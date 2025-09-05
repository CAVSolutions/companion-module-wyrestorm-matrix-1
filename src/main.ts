import { InstanceBase, runEntrypoint, type SomeCompanionConfigField } from '@companion-module/base'
import type { TCPHelper } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { UpdateVariableDefinitions } from './variables.js'
import { UpdatePresets } from './presets.js'
import { InitConnection, SendCommand } from './api.js'

export class WyrestormMatrixInstance extends InstanceBase<ModuleConfig> {
	config!: ModuleConfig // Setup in init()
	socket!: TCPHelper | null
	connected = false
	commandQueue: string[] = []
	lastCommand = ''
	isProcessing = false
	reconnectInterval: NodeJS.Timeout | undefined = undefined

	data: { [key: string]: any } = {}

	selectedInput: number = 1
	selectedOutput: number = 1

	CHOICES_INPUTS: { id: string; label: string }[] = []
	CHOICES_OUTPUTS: { id: string; label: string }[] = []

	constructor(internal: unknown) {
		super(internal)

		this.socket as TCPHelper | null
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.buildChoices() // build the input/output choices
		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions
		this.updatePresets() // export presets

		await this.initConnection()
	}
	// When module gets deleted
	async destroy(): Promise<void> {
		this.log('debug', 'destroy')
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
		this.buildChoices() // build the input/output choices
		await this.initConnection()
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	private buildChoices(): void {
		this.CHOICES_INPUTS = []
		this.CHOICES_OUTPUTS = []

		if (!this.config.inputs) {
			this.config.inputs = 1
		}
		if (!this.config.outputs) {
			this.config.outputs = 1
		}

		for (let i = 0; i < this.config.inputs; i++) {
			this.CHOICES_INPUTS.push({ id: (i + 1).toString(), label: `Input ${i + 1}` })
		}

		for (let i = 0; i < this.config.outputs; i++) {
			this.CHOICES_OUTPUTS.push({ id: (i + 1).toString(), label: `Output ${i + 1}` })
		}
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	async initConnection(): Promise<void> {
		await InitConnection(this)
	}

	sendCommand(cmd: string): void {
		SendCommand(this, cmd)
	}
}

runEntrypoint(WyrestormMatrixInstance, UpgradeScripts)
