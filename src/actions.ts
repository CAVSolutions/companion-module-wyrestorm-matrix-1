import { CompanionActionDefinitions } from '@companion-module/base'
import type { WyrestormMatrixInstance } from './main.js'

export function UpdateActions(self: WyrestormMatrixInstance): void {
	const actions: CompanionActionDefinitions = {}

	actions.selectInput = {
		name: 'Select Input',
		description: 'Select the input to use in routing',
		options: [
			{
				type: 'dropdown',
				label: 'Input',
				id: 'input',
				default: '1',
				choices: self.CHOICES_INPUTS,
			},
		],
		callback: async (action) => {
			self.selectedInput = parseInt(String(action.options.input) ?? '1')
			self.setVariableValues({ selectedInput: self.selectedInput })
		},
	}

	actions.selectOutput = {
		name: 'Select Output',
		description: 'Select the output to use in routing',
		options: [
			{
				type: 'dropdown',
				label: 'Output',
				id: 'output',
				default: '1',
				choices: self.CHOICES_OUTPUTS,
			},
		],
		callback: async (action) => {
			self.selectedOutput = parseInt(String(action.options.output) ?? '1')
			self.setVariableValues({ selectedOutput: self.selectedOutput })
		},
	}

	actions.routeSource = {
		name: 'Route Input to Output',
		description: 'Route a Source to a Destination',
		options: [
			{
				type: 'checkbox',
				label: 'Use Selected Input',
				id: 'useSelectedInput',
				default: false,
			},
			{
				type: 'dropdown',
				label: 'Input',
				id: 'input',
				default: '1',
				choices: self.CHOICES_INPUTS,
				isVisible: (options) => options.useSelectedInput !== true,
			},
			{
				type: 'checkbox',
				label: 'Use Selected Output',
				id: 'useSelectedOutput',
				default: false,
			},
			{
				type: 'dropdown',
				label: 'Output',
				id: 'output',
				default: '1',
				choices: self.CHOICES_OUTPUTS,
				isVisible: (options) => options.useSelectedOutput !== true,
			},
		],
		callback: async (action) => {
			const input = action.options.useSelectedInput ? self.selectedInput : parseInt(String(action.options.input) ?? '1')
			const output = action.options.useSelectedOutput
				? self.selectedOutput
				: parseInt(String(action.options.output) ?? '1')

			if (self.config.verbose) {
				self.log('debug', `Routing Input ${input} to Output ${output}`)
			}

			//SET SW hdmiin4 hdmiout1
			const cmd = `SET SW hdmiin${input} hdmiout${output}`
			self.sendCommand(cmd)
		},
	}

	self.setActionDefinitions(actions)
}
