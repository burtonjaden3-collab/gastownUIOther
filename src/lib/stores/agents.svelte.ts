/**
 * Agents Store - Svelte 5 Runes
 * Manages agent status with real API integration
 */

import { api } from '$lib/api/client';

export type AgentRole = 'polecat' | 'witness' | 'deacon' | 'refinery' | 'crew' | 'overseer';
export type AgentStatus = 'running' | 'idle' | 'offline';

export interface Agent {
	id: string;
	name: string;
	address: string;
	role: AgentRole;
	status: AgentStatus;
	hasWork: boolean;
	unreadMail: number;
	rig?: string;
	currentTask?: string;
}

/** API response from getAgents() */
export interface AgentsApiResponse {
	agents?: Agent[];
}

interface AgentsState {
	items: Agent[];
	isLoading: boolean;
	error: string | null;
	lastFetch: Date | null;
}

class AgentsStore {
	#state = $state<AgentsState>({
		items: [],
		isLoading: false,
		error: null,
		lastFetch: null
	});

	get items() {
		return this.#state.items;
	}

	get isLoading() {
		return this.#state.isLoading;
	}

	get error() {
		return this.#state.error;
	}

	get lastFetch() {
		return this.#state.lastFetch;
	}

	get online() {
		return this.#state.items.filter((a) => a.status !== 'offline');
	}

	get offline() {
		return this.#state.items.filter((a) => a.status === 'offline');
	}

	get running() {
		return this.#state.items.filter((a) => a.status === 'running');
	}

	get idle() {
		return this.#state.items.filter((a) => a.status === 'idle');
	}

	get available() {
		return this.#state.items.filter((a) => a.status === 'idle');
	}

	get stats() {
		const items = this.#state.items;
		const running = items.filter((a) => a.status === 'running').length;
		return {
			total: items.length,
			online: items.filter((a) => a.status !== 'offline').length,
			offline: items.filter((a) => a.status === 'offline').length,
			running,
			idle: items.filter((a) => a.status === 'idle').length,
			// Aliases for component compatibility
			busy: running,
			avgLoad: items.length > 0 ? Math.round((running / items.length) * 100) : 0
		};
	}

	getAgent(id: string): Agent | undefined {
		return this.#state.items.find((a) => a.id === id);
	}

	/**
	 * Fetch agents from the API
	 */
	async fetch() {
		this.#state.isLoading = true;
		this.#state.error = null;

		try {
			const response = (await api.getAgents()) as AgentsApiResponse;
			this.#state.items = response.agents || [];
			this.#state.lastFetch = new Date();
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to fetch agents';
			console.error('Failed to fetch agents:', e);
		} finally {
			this.#state.isLoading = false;
		}
	}

	/**
	 * Alias for fetch() - backward compatibility
	 */
	async refresh() {
		return this.fetch();
	}

	updateAgent(id: string, updates: Partial<Agent>) {
		this.#state.items = this.#state.items.map((agent) =>
			agent.id === id ? { ...agent, ...updates } : agent
		);
	}

	/**
	 * Replace all items (used by SSE updates)
	 */
	setItems(agents: Agent[]) {
		this.#state.items = agents;
		this.#state.lastFetch = new Date();
	}
}

export const agentsStore = new AgentsStore();
