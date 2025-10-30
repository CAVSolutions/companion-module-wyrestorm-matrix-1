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
		const sendBuf = Buffer.from(command + '\n', 'latin1')
		self.socket?.send(sendBuf)
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
				console.log('Got this: ', data.toString())
				buffer += data.toString()
				//if we have a LF, it is a complete message
				if (buffer.endsWith('\n')) {
					const parts = buffer.split('\n')
					buffer = ''

					for (const part of parts) {
						ProcessData(self, part)
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
		SendCommand(self, `GET MP all`)
		SendCommand(self, 'GET VER')
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

	//SW HDMIIN1 HDMIOUT4 or MP HDMIIN4 HDMIOUT1
	if (msg.startsWith('SW') || msg.startsWith('MP')) {
		const parts = msg.split(' ')
		if (parts.length >= 3) {
			const inputMatch = parts[1].match(/HDMIIN(\d+)/) //HDMIIN4
			const outputMatch = parts[2].match(/HDMIOUT(\d+)/) //HDMIOUT1

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
