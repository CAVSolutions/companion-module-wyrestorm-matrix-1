import { InstanceStatus, TCPHelper } from '@companion-module/base'
import type { WyrestormMatrixInstance } from './main.js'

async function processQueue(self: WyrestormMatrixInstance): Promise<void> {
	if (self.isProcessing) return

	self.isProcessing = true

	while (self.commandQueue.length > 0) {
		const command = self.commandQueue.shift()
		if (command) {
			await executeCommand(self, command)
			await sleep(500)
		}
	}

	self.isProcessing = false
}

async function executeCommand(self: WyrestormMatrixInstance, command: string): Promise<void> {
	if (self.connected) {
		if (self.config.verbose) {
			self.log('debug', `Sending command: ${command}`)
		}
		self.socket?.send(command + '\r\n')
		self.lastCommand = command
	} else {
		self.log('warn', 'Not connected to Device')
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function InitConnection(self: WyrestormMatrixInstance): Promise<void> {
	const ip = self.config.ip
	const port = 23

	if (self.config.ip && self.config.ip !== '') {
		self.log('debug', `Connecting to Device at ${ip}:${port}`)
		self.updateStatus(InstanceStatus.Connecting, 'Connecting')

		self.setVariableValues({ selectedInput: self.selectedInput, selectedOutput: self.selectedOutput })

		self.socket = new TCPHelper(self.config.ip, port) as TCPHelper | null

		self.socket?.on('connect', () => {
			self.connected = true
			clearInterval(self.reconnectInterval)
			self.updateStatus(InstanceStatus.Ok, 'Connected')
			self.log('info', 'Connected to Device')
			RequestData(self)
		})

		let buffer = ''

		self.socket?.on('data', (data: any) => {
			try {
				buffer += data.toString()
				//might be crlf or just lf
				const parts = buffer.split('\r\n')
				if (parts.length === 1) {
					//no \r\n, try \n
					parts.splice(0, parts.length, ...buffer.split('\n'))
				}
				buffer = parts.pop() || ''

				for (const part of parts) {
					if (part.trim()) {
						const msg = part.trim()
						ProcessData(self, msg)
					}
				}
			} catch (e) {
				self.log('error', `Error parsing data: ${e}`)
			}
		})

		self.socket?.on('error', (err: any) => {
			self.connected = false
			self.updateStatus(InstanceStatus.UnknownError, 'Connection error')
			self.log('error', `Error: ${err}`)

			if (String(err).indexOf('ECONNREFUSED') > -1) {
				self.socket?.destroy()
				self.socket = null
				self.log('info', 'Connection refused. Will attempt to reconnect in 5 seconds.')
				self.reconnectInterval = setTimeout(() => {
					self.log('info', 'Attempting to reconnect...')
					InitConnection(self)
					self.reconnectInterval = undefined
				}, 5000)
			}
		})
	}
}

function RequestData(self: WyrestormMatrixInstance): void {
	if (self.connected) {
		SendCommand(self, 'GET VER')
		for (let i = 1; i <= (self.config.outputs ?? 1); i++) {
			SendCommand(self, `GET MP out${i}`)
		}
	} else {
		self.log('warn', 'Unable to request data; Not connected to Device')
	}
}

export function SendCommand(self: WyrestormMatrixInstance, cmd: string): void {
	self.commandQueue.push(cmd)
	processQueue(self)
}

function ProcessData(self: WyrestormMatrixInstance, msg: any): void {
	if (self.config.verbose) {
		self.log('debug', `Received data: ${msg}`)
	}

	let variableObj: { [key: string]: string } = {}

	if (msg.startsWith('VER')) {
		//VER <PRM>
		const parts = msg.split(' ')
		if (parts.length >= 2) {
			variableObj['version'] = parts[1]
		}
	}

	//SW hdmiin4 out1 or MP hdmiin4 out1
	if (msg.startsWith('SW') || msg.startsWith('MP')) {
		const parts = msg.split(' ')
		if (parts.length >= 3) {
			const inputMatch = parts[1].match(/hdmiin(\d+)/) //hdmiin4
			const outputMatch = parts[2].match(/out(\d+)/) //out1
			console.log('inputMatch:', 	inputMatch)
			console.log('outputMatch:', 	outputMatch)
			if (inputMatch && outputMatch) {
				const inputNum = parseInt(inputMatch[1])
				const outputNum = parseInt(outputMatch[1])
				self.data[`out${outputNum}`] = inputNum
				variableObj[`output${outputNum}`] = `Input ${inputNum}`
			}
		}
	}

	self.setVariableValues(variableObj)
	self.checkFeedbacks()
}
