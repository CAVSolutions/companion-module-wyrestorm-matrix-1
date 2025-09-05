import { CompanionFeedbackDefinitions, combineRgb } from '@companion-module/base'
import type { WyrestormMatrixInstance } from './main.js'

export function UpdateFeedbacks(self: WyrestormMatrixInstance): void {
	const feedbacks: CompanionFeedbackDefinitions = {}

	feedbacks.routeSource = {
		type: 'boolean',
		name: 'Input Routed to Output',
		description: 'If the input is routed to the output',
		options: [
			{
				type: 'dropdown',
				label: 'Input',
				id: 'input',
				default: '1',
				choices: self.CHOICES_INPUTS,
			},
			{
				type: 'dropdown',
				label: 'Output',
				id: 'output',
				default: '1',
				choices: self.CHOICES_OUTPUTS,
			},
		],
		defaultStyle: { color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 255, 0) },
		callback: async (feedback) => {
			const input = parseInt(String(feedback.options.input))
			const output = parseInt(String(feedback.options.output))

			if (self.data[`out${output}`] === input) {
				return true
			}

			return false
		},
	}

	self.setFeedbackDefinitions(feedbacks)
}
