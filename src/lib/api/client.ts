/**
 * API Client - Simple fetch wrapper for Gas Town API
 */

export interface ApiResponse<T> {
	data?: T;
	items?: T[];
	agents?: T[];
	error?: string;
	timestamp?: string;
	requestId?: string;
	total?: number;
	duration?: number;
}

export class ApiError extends Error {
	constructor(
		message: string,
		public status: number,
		public requestId?: string
	) {
		super(message);
		this.name = 'ApiError';
	}
}

async function fetchApi<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<ApiResponse<T>> {
	const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

	let response: Response;
	try {
		response = await fetch(url, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			}
		});
	} catch (e) {
		throw new ApiError(
			e instanceof Error ? e.message : 'Network request failed',
			0
		);
	}

	let data: ApiResponse<T>;
	try {
		data = await response.json();
	} catch {
		throw new ApiError(
			`Invalid JSON response from ${endpoint}`,
			response.status
		);
	}

	if (!response.ok) {
		throw new ApiError(
			data.error || `Request failed with status ${response.status}`,
			response.status,
			data.requestId
		);
	}

	return data;
}

export const api = {
	/**
	 * Get system status
	 */
	async getStatus() {
		return fetchApi<unknown>('/api/gastown/status');
	},

	/**
	 * Get all agents
	 */
	async getAgents() {
		return fetchApi<unknown>('/api/gastown/agents');
	},

	/**
	 * Get work items with optional filters
	 */
	async getWork(filters?: { status?: string; type?: string }) {
		const params = new URLSearchParams();
		if (filters?.status) params.set('status', filters.status);
		if (filters?.type) params.set('type', filters.type);
		const query = params.toString();
		return fetchApi<unknown>(`/api/gastown/work${query ? `?${query}` : ''}`);
	},

	/**
	 * Create a new work item
	 */
	async createWork(data: { title: string; description: string; type?: string; priority?: number }) {
		return fetchApi<unknown>('/api/gastown/work', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	},

	/**
	 * Start a rig
	 */
	async startRig(name: string) {
		return fetchApi<unknown>(`/api/gastown/rigs/${encodeURIComponent(name)}/start`, {
			method: 'POST'
		});
	},

	/**
	 * Stop a rig
	 */
	async stopRig(name: string) {
		return fetchApi<unknown>(`/api/gastown/rigs/${encodeURIComponent(name)}/stop`, {
			method: 'POST'
		});
	},

	/**
	 * Park a rig
	 */
	async parkRig(name: string) {
		return fetchApi<unknown>(`/api/gastown/rigs/${encodeURIComponent(name)}/park`, {
			method: 'POST'
		});
	},

	/**
	 * Restart a rig (stop + start)
	 */
	async restartRig(name: string) {
		return fetchApi<unknown>(`/api/gastown/rigs/${encodeURIComponent(name)}/restart`, {
			method: 'POST'
		});
	},

	/**
	 * Add a new rig
	 */
	async addRig(data: { name: string; gitUrl: string; branch?: string; prefix?: string }) {
		return fetchApi<unknown>('/api/gastown/rigs/add', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	},

	/**
	 * Remove a rig from the registry
	 */
	async removeRig(name: string) {
		return fetchApi<unknown>(`/api/gastown/rigs/${encodeURIComponent(name)}/remove`, {
			method: 'POST'
		});
	},

	/**
	 * Sling work to a rig
	 */
	async slingWork(
		rigName: string,
		beadId: string,
		options?: {
			target?: string;
			args?: string;
			message?: string;
			subject?: string;
			account?: string;
			create?: boolean;
			force?: boolean;
			noConvoy?: boolean;
		}
	) {
		return fetchApi<unknown>(`/api/gastown/rigs/${encodeURIComponent(rigName)}/sling`, {
			method: 'POST',
			body: JSON.stringify({
				beadId,
				...options
			})
		});
	},

	/**
	 * Start a crew
	 */
	async startCrew(name: string) {
		return fetchApi<unknown>(`/api/gastown/crews/${encodeURIComponent(name)}/start`, {
			method: 'POST'
		});
	},

	/**
	 * Stop a crew
	 */
	async stopCrew(name: string) {
		return fetchApi<unknown>(`/api/gastown/crews/${encodeURIComponent(name)}/stop`, {
			method: 'POST'
		});
	},

	/**
	 * Refresh a crew
	 */
	async refreshCrew(name: string) {
		return fetchApi<unknown>(`/api/gastown/crews/${encodeURIComponent(name)}/refresh`, {
			method: 'POST'
		});
	},

	/**
	 * Remove a crew
	 */
	async removeCrew(name: string) {
		return fetchApi<unknown>(`/api/gastown/crews/${encodeURIComponent(name)}/remove`, {
			method: 'POST'
		});
	},

	/**
	 * Add a crew worker to a rig
	 */
	async addCrew(rigName: string, workerName: string) {
		return fetchApi<unknown>(
			`/api/gastown/rigs/${encodeURIComponent(rigName)}/crew/add`,
			{
				method: 'POST',
				body: JSON.stringify({ workerName })
			}
		);
	},

	/**
	 * Nuke a polecat
	 */
	async nukePolecat(name: string) {
		return fetchApi<unknown>(`/api/gastown/polecats/${encodeURIComponent(name)}/nuke`, {
			method: 'POST'
		});
	},

	/**
	 * Unsling work from an agent
	 */
	async unslingAgent(name: string) {
		return fetchApi<unknown>(`/api/gastown/agents/${encodeURIComponent(name)}/unsling`, {
			method: 'POST'
		});
	},

	// -------------------------------------------------------------------------
	// Convoys
	// -------------------------------------------------------------------------

	/**
	 * Get convoys with optional filters
	 */
	async getConvoys(filters?: { status?: string }) {
		const params = new URLSearchParams();
		if (filters?.status) params.set('status', filters.status);
		const query = params.toString();
		return fetchApi<unknown>(`/api/gastown/convoys${query ? `?${query}` : ''}`);
	},

	// -------------------------------------------------------------------------
	// Mail
	// -------------------------------------------------------------------------

	/**
	 * Get inbox messages
	 */
	async getInbox() {
		return fetchApi<unknown>('/api/gastown/mail');
	},

	/**
	 * Read a single message
	 */
	async readMessage(id: string) {
		return fetchApi<unknown>(`/api/gastown/mail/${encodeURIComponent(id)}`);
	},

	/**
	 * Send a mail message
	 */
	async sendMail(
		to: string,
		subject: string,
		body: string,
		opts?: { type?: string; priority?: number }
	) {
		return fetchApi<unknown>('/api/gastown/mail/send', {
			method: 'POST',
			body: JSON.stringify({
				to,
				subject,
				body,
				type: opts?.type || 'notification',
				priority: opts?.priority ?? 2
			})
		});
	},

	/**
	 * Mark a message as read
	 */
	async markRead(id: string) {
		return fetchApi<unknown>(`/api/gastown/mail/${encodeURIComponent(id)}/read`, {
			method: 'POST'
		});
	},

	/**
	 * Archive a message
	 */
	async archiveMail(id: string) {
		return fetchApi<unknown>(`/api/gastown/mail/${encodeURIComponent(id)}/archive`, {
			method: 'POST'
		});
	},

	/**
	 * Reply to a message
	 */
	async replyMail(id: string, body: string) {
		return fetchApi<unknown>(`/api/gastown/mail/${encodeURIComponent(id)}/reply`, {
			method: 'POST',
			body: JSON.stringify({ body })
		});
	},

	// -------------------------------------------------------------------------
	// Feed
	// -------------------------------------------------------------------------

	/**
	 * Get activity feed events
	 */
	async getFeed(since?: string, type?: string) {
		const params = new URLSearchParams();
		if (since) params.set('since', since);
		if (type) params.set('type', type);
		const query = params.toString();
		return fetchApi<unknown>(`/api/gastown/feed${query ? `?${query}` : ''}`);
	},

	// -------------------------------------------------------------------------
	// Formulas & Molecules
	// -------------------------------------------------------------------------

	/**
	 * Get all formulas
	 */
	async getFormulas() {
		return fetchApi<unknown>('/api/gastown/formulas');
	},

	/**
	 * Get a single formula detail
	 */
	async getFormula(name: string) {
		return fetchApi<unknown>(`/api/gastown/formulas/${encodeURIComponent(name)}`);
	},

	/**
	 * Get active molecules
	 */
	async getMolecules() {
		return fetchApi<unknown>('/api/gastown/molecules');
	},

	/**
	 * Get a single molecule detail
	 */
	async getMolecule(id: string) {
		return fetchApi<unknown>(`/api/gastown/molecules/${encodeURIComponent(id)}`);
	},

	// -------------------------------------------------------------------------
	// Convoy Actions
	// -------------------------------------------------------------------------

	/**
	 * Create a new convoy
	 */
	async createConvoy(title: string, issues: string[]) {
		return fetchApi<unknown>('/api/gastown/convoys/create', {
			method: 'POST',
			body: JSON.stringify({ title, issues })
		});
	},

	/**
	 * Close a convoy
	 */
	async closeConvoy(id: string) {
		return fetchApi<unknown>(`/api/gastown/convoys/${encodeURIComponent(id)}/close`, {
			method: 'POST'
		});
	},

	/**
	 * Get convoy detail
	 */
	async getConvoyDetail(id: string) {
		return fetchApi<unknown>(`/api/gastown/convoys/${encodeURIComponent(id)}`);
	},

	// -------------------------------------------------------------------------
	// Daemon
	// -------------------------------------------------------------------------

	/**
	 * Get daemon status
	 */
	async getDaemonStatus() {
		return fetchApi<unknown>('/api/gastown/daemon/status');
	},

	/**
	 * Get daemon logs
	 */
	async getDaemonLogs() {
		return fetchApi<unknown>('/api/gastown/daemon/logs');
	},

	/**
	 * Start all services
	 */
	async startServices() {
		return fetchApi<unknown>('/api/gastown/daemon/start', { method: 'POST' });
	},

	/**
	 * Stop all services
	 */
	async stopServices() {
		return fetchApi<unknown>('/api/gastown/daemon/stop', { method: 'POST' });
	},

	// -------------------------------------------------------------------------
	// Health
	// -------------------------------------------------------------------------

	/**
	 * Get system health
	 */
	async getHealth() {
		return fetchApi<unknown>('/api/gastown/health');
	},

	// -------------------------------------------------------------------------
	// Merge Queue
	// -------------------------------------------------------------------------

	/**
	 * Get merge queue items
	 */
	async getMergeQueue() {
		return fetchApi<unknown>('/api/gastown/mergequeue');
	},

	// -------------------------------------------------------------------------
	// Gates
	// -------------------------------------------------------------------------

	/**
	 * Get all gates
	 */
	async getGates() {
		return fetchApi<unknown>('/api/gastown/gates');
	},

	/**
	 * Close a gate
	 */
	async closeGate(id: string, reason: string) {
		return fetchApi<unknown>(`/api/gastown/gates/${encodeURIComponent(id)}/close`, {
			method: 'POST',
			body: JSON.stringify({ reason })
		});
	},

	// -------------------------------------------------------------------------
	// Dogs
	// -------------------------------------------------------------------------

	/**
	 * Get dog pool
	 */
	async getDogs() {
		return fetchApi<unknown>('/api/gastown/dogs');
	},

	/**
	 * Add a dog to the pool
	 */
	async addDog(name: string) {
		return fetchApi<unknown>('/api/gastown/dogs/add', {
			method: 'POST',
			body: JSON.stringify({ name })
		});
	},

	/**
	 * Remove a dog from the pool
	 */
	async removeDog(name: string) {
		return fetchApi<unknown>(`/api/gastown/dogs/${encodeURIComponent(name)}/remove`, {
			method: 'POST'
		});
	},

	// -------------------------------------------------------------------------
	// Nudge & Broadcast
	// -------------------------------------------------------------------------

	/**
	 * Nudge a specific agent
	 */
	async nudgeAgent(agent: string, message: string) {
		return fetchApi<unknown>('/api/gastown/agents/nudge', {
			method: 'POST',
			body: JSON.stringify({ agent, message })
		});
	},

	/**
	 * Broadcast message to all workers
	 */
	async broadcast(message: string) {
		return fetchApi<unknown>('/api/gastown/agents/broadcast', {
			method: 'POST',
			body: JSON.stringify({ message })
		});
	},

	// -------------------------------------------------------------------------
	// Work Detail
	// -------------------------------------------------------------------------

	/**
	 * Get detailed work item with dependencies
	 */
	async getWorkDetail(id: string) {
		return fetchApi<unknown>(`/api/gastown/work/${encodeURIComponent(id)}`);
	},

	// -------------------------------------------------------------------------
	// Config
	// -------------------------------------------------------------------------

	/**
	 * Get town configuration
	 */
	async getConfig() {
		return fetchApi<unknown>('/api/gastown/config');
	},

};
