import type { SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	ip: string
	inputs: number
	outputs: number
	verbose: boolean
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module communicates with Wyrestorm MX-H2A, MXV and MX-KIT Series Matrix Switchers',
		},
		{
			type: 'textinput',
			id: 'ip',
			width: 4,
			label: 'IP Address',
			default: '127.0.0.1',
		},
		{
			type: 'number',
			id: 'inputs',
			width: 4,
			label: 'Number of Inputs',
			min: 1,
			max: 32,
			default: 8,
		},
		{
			type: 'number',
			id: 'outputs',
			width: 4,
			label: 'Number of Outputs',
			min: 1,
			max: 32,
			default: 8,
		},
		{
			type: 'static-text',
			id: 'hr1',
			width: 12,
			label: ' ',
			value: '<hr />',
		},
		{
			type: 'checkbox',
			id: 'verbose',
			label: 'Enable Verbose Logging',
			default: false,
			width: 4,
		},
	]
}
