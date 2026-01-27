export interface DaemonStatus {
	running: boolean;
	pid: number | null;
	uptime: string | null;
	heartbeat: { enabled: boolean; interval: string };
	patrols: Record<string, { enabled: boolean; interval: string; agent: string }>;
}

export interface DaemonLog {
	timestamp: string;
	message: string;
	level: string;
}

interface DaemonState {
	status: DaemonStatus | null;
	logs: DaemonLog[];
	isLoading: boolean;
	error: string | null;
	lastFetch: Date | null;
}

class DaemonStore {
	#state = $state<DaemonState>({
		status: null,
		logs: [],
		isLoading: false,
		error: null,
		lastFetch: null
	});

	get status() { return this.#state.status; }
	get logs() { return this.#state.logs; }
	get isLoading() { return this.#state.isLoading; }
	get error() { return this.#state.error; }
	get lastFetch() { return this.#state.lastFetch; }

	async fetchStatus() {
		this.#state.isLoading = true;
		this.#state.error = null;
		try {
			const response = await fetch('/api/gastown/daemon/status');
			const data = await response.json();
			this.#state.status = data.data as DaemonStatus;
			this.#state.lastFetch = new Date();
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to fetch daemon status';
		} finally {
			this.#state.isLoading = false;
		}
	}

	async fetchLogs() {
		this.#state.error = null;
		try {
			const response = await fetch('/api/gastown/daemon/logs');
			const data = await response.json();
			this.#state.logs = (data.items as DaemonLog[]) || [];
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to fetch daemon logs';
		}
	}

	async startServices() {
		this.#state.isLoading = true;
		this.#state.error = null;
		try {
			const response = await fetch('/api/gastown/daemon/start', { method: 'POST' });
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || 'Failed to start services');
			await this.fetchStatus();
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to start services';
		} finally {
			this.#state.isLoading = false;
		}
	}

	async stopServices() {
		this.#state.isLoading = true;
		this.#state.error = null;
		try {
			const response = await fetch('/api/gastown/daemon/stop', { method: 'POST' });
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || 'Failed to stop services');
			await this.fetchStatus();
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to stop services';
		} finally {
			this.#state.isLoading = false;
		}
	}
}

export const daemonStore = new DaemonStore();
