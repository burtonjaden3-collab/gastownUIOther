import { api } from '$lib/api/client';

export interface Gate {
	id: string;
	awaitType: 'timer' | 'gh:run' | 'gh:pr' | 'human' | 'mail';
	status: 'open' | 'closed';
	createdAt: string;
	timeout?: string;
	reason?: string;
	waiters: string[];
}

interface GatesState {
	items: Gate[];
	isLoading: boolean;
	error: string | null;
	lastFetch: Date | null;
}

class GatesStore {
	#state = $state<GatesState>({
		items: [],
		isLoading: false,
		error: null,
		lastFetch: null
	});

	get items() { return this.#state.items; }
	get isLoading() { return this.#state.isLoading; }
	get error() { return this.#state.error; }
	get lastFetch() { return this.#state.lastFetch; }

	get open() { return this.#state.items.filter(g => g.status === 'open'); }
	get closed() { return this.#state.items.filter(g => g.status === 'closed'); }

	get stats() {
		const items = this.#state.items;
		return {
			total: items.length,
			open: items.filter(g => g.status === 'open').length,
			closed: items.filter(g => g.status === 'closed').length
		};
	}

	async fetch() {
		this.#state.isLoading = true;
		this.#state.error = null;
		try {
			const data = await api.getGates();
			this.#state.items = (data.items as Gate[]) || [];
			this.#state.lastFetch = new Date();
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to fetch gates';
		} finally {
			this.#state.isLoading = false;
		}
	}

	async closeGate(id: string, reason: string) {
		this.#state.error = null;
		try {
			await api.closeGate(id, reason);
			await this.fetch();
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to close gate';
		}
	}

	setItems(items: Gate[]) {
		this.#state.items = items;
		this.#state.lastFetch = new Date();
	}
}

export const gatesStore = new GatesStore();
