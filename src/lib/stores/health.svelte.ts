import type { DiagnosticsReport } from '$lib/utils/parse-doctor-output';

export interface RigHealth {
	rigName: string;
	witnessStatus: string;
	refineryStatus: string;
	polecatCount: number;
	crewCount: number;
	issues: string[];
}

export interface SystemHealth {
	overallStatus: 'healthy' | 'degraded' | 'critical';
	rigHealth: RigHealth[];
	diagnostics: DiagnosticsReport | null;
	lastCheck: string;
}

interface HealthState {
	health: SystemHealth | null;
	isLoading: boolean;
	error: string | null;
	lastFetch: Date | null;
}

class HealthStore {
	#state = $state<HealthState>({
		health: null,
		isLoading: false,
		error: null,
		lastFetch: null
	});

	get health() { return this.#state.health; }
	get isLoading() { return this.#state.isLoading; }
	get error() { return this.#state.error; }
	get lastFetch() { return this.#state.lastFetch; }

	async fetch() {
		this.#state.isLoading = true;
		this.#state.error = null;
		try {
			const response = await fetch('/api/gastown/health');
			const data = await response.json();
			if (!response.ok) {
				this.#state.error = data.error || 'Failed to fetch health';
				return;
			}
			this.#state.health = data.data as SystemHealth;
			this.#state.lastFetch = new Date();
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to fetch health';
		} finally {
			this.#state.isLoading = false;
		}
	}

	async runDiagnostics() {
		this.#state.isLoading = true;
		this.#state.error = null;
		try {
			const response = await fetch('/api/gastown/health?diagnostics=true');
			const data = await response.json();
			if (!response.ok) {
				this.#state.error = data.error || 'Failed to run diagnostics';
				return;
			}
			this.#state.health = data.data as SystemHealth;
			this.#state.lastFetch = new Date();
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to run diagnostics';
		} finally {
			this.#state.isLoading = false;
		}
	}
}

export const healthStore = new HealthStore();
