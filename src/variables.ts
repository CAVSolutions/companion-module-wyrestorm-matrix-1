import type { CompanionVariableDefinition } from '@companion-module/base'

import type { WyrestormMatrixInstance } from './main.js'

export function UpdateVariableDefinitions(self: WyrestormMatrixInstance): void {
	const variables: CompanionVariableDefinition[] = []

	variables.push({ variableId: 'version', name: 'Firmware Version' })

	//selected input
	variables.push({ variableId: 'selectedInput', name: 'Selected Input' })
	//selected output
	variables.push({ variableId: 'selectedOutput', name: 'Selected Output' })

	//outputs
	for (let i = 0; i < self.config.outputs; i++) {
		variables.push({ variableId: `output${i + 1}`, name: `Output ${i + 1}` })
	}

	self.setVariableDefinitions(variables)
}
