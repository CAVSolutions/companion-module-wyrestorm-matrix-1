import net from 'node:net'

const PORT = 23

// Internal routing state
const matrix = {
	videoRouting: {}, // out1: hdmiin4
	audioRouting: {},
	audioMode: 'followvm', // or 'independent'
	audioMute: {},
	power: {},
	standby: false,
}

// Utilities
function respond(socket, message) {
	console.log('> RESPONDING:', message.trim())
	socket.write(message + '\n')
}

function parseCommand(command) {
	return command.trim().split(/\s+/)
}

// Emulator server
const server = net.createServer((socket) => {
	console.log('Client connected')

	socket.on('data', (data) => {
		const text = data.toString().trim()
		console.log('< RECEIVED:', text)
		const [cmd, ...args] = parseCommand(text)

		switch (cmd.toUpperCase()) {
			case 'SET':
				handleSet(socket, args)
				break
			case 'GET':
				handleGet(socket, args)
				break
			case 'SAVE':
				if (args[0] === 'PRESET') respond(socket, `PRESET ${args[1]}`)
				break
			case 'RESTORE':
				if (args[0] === 'PRESET') respond(socket, `PRESET ${args[1]}`)
				break
			case 'STANDBY':
				matrix.standby = true
				respond(socket, 'STANDBY')
				break
			case 'WAKE':
				matrix.standby = false
				respond(socket, 'WAKE')
				break
			case 'REBOOT':
				respond(socket, 'REBOOT')
				break
			case 'RESET':
				respond(socket, 'RESET')
				break
			default:
				respond(socket, `ERR Unknown command: ${cmd}`)
				break
		}
	})

	socket.on('end', () => {
		console.log('Client disconnected')
	})
})

server.listen(PORT, () => {
	console.log(`Matrix Emulator listening on port ${PORT}`)
})

// SET handlers
function handleSet(socket, args) {
	const subcmd = args[0].toUpperCase()
	switch (subcmd) {
		case 'SW': {
			const [input, output] = args.slice(1)
			matrix.videoRouting[output] = input
			respond(socket, `SW ${input} ${output}`)
			break
		}
		case 'AUDIOSW_M': {
			const mode = args[1]
			matrix.audioMode = mode
			respond(socket, `AUDIOSW_M ${mode}`)
			break
		}
		case 'AUDIOSW': {
			const [input, output] = args.slice(1)
			matrix.audioRouting[output] = input
			respond(socket, `AUDIOSW ${input} ${output}`)
			break
		}
		case 'MUTE': {
			const [output, prm] = args.slice(1)
			matrix.audioMute[output] = prm
			respond(socket, `MUTE ${output} ${prm}`)
			break
		}
		case 'CEC_PWR': {
			const [output, prm] = args.slice(1)
			matrix.power[output] = prm
			respond(socket, `CEC_PWR ${output} ${prm}`)
			break
		}
		default:
			respond(socket, `ERR Unknown SET subcommand: ${subcmd}`)
	}
}

// GET handlers
function handleGet(socket, args) {
	const subcmd = args[0].toUpperCase()
	switch (subcmd) {
        case 'VER':
            respond(socket, 'VER 1.0.0')
            break
		case 'MP': {
			const output = args[1]
			const input = matrix.videoRouting[output] || 'hdmiin1'
			respond(socket, `MP ${input} ${output}`)
			break
		}
		case 'AUDIOSW_M':
			respond(socket, `AUDIOSW_M ${matrix.audioMode}`)
			break
		case 'AUDIOMP': {
			const output = args[1]
			const input = matrix.audioRouting[output] || 'hdmiin1'
			respond(socket, `AUDIOMP ${input} ${output}`)
			break
		}
		case 'MUTE': {
			const output = args[1]
			const state = matrix.audioMute[output] || 'off'
			respond(socket, `MUTE ${output} ${state}`)
			break
		}
		case 'AUTOCEC_FN': {
			const output = args[1]
			const state = matrix.power[output] || 'off'
			respond(socket, `AUTOCEC_FN ${output} ${state}`)
			break
		}
		case 'STANDBY':
			respond(socket, matrix.standby ? 'STANDBY' : 'WAKE')
			break
		default:
			respond(socket, `ERR Unknown GET subcommand: ${subcmd}`)
	}
}