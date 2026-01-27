import { api } from '$lib/api/client';

export interface Dog {
	name: string;
	status: 'idle' | 'working' | 'stuck';
	currentTask?: string;
	startedAt?: string;
	duration?: string;
}

interface DogsState {
	items: Dog[];
	isLoading: boolean;
	error: string | null;
	lastFetch: Date | null;
}

const AVAILABLE_NAMES = ['alpha', 'bravo', 'charlie', 'delta'];

class DogsStore {
	#state = $state<DogsState>({
		items: [],
		isLoading: false,
		error: null,
		lastFetch: null
	});

	get items() { return this.#state.items; }
	get isLoading() { return this.#state.isLoading; }
	get error() { return this.#state.error; }
	get lastFetch() { return this.#state.lastFetch; }

	get idle() { return this.#state.items.filter(d => d.status === 'idle'); }
	get working() { return this.#state.items.filter(d => d.status === 'working'); }
	get stuck() { return this.#state.items.filter(d => d.status === 'stuck'); }

	get stats() {
		const items = this.#state.items;
		return {
			total: items.length,
			idle: items.filter(d => d.status === 'idle').length,
			working: items.filter(d => d.status === 'working').length,
			stuck: items.filter(d => d.status === 'stuck').length
		};
	}

	get availableNames() {
		const taken = new Set(this.#state.items.map(d => d.name));
		return AVAILABLE_NAMES.filter(n => !taken.has(n));
	}

	get canAddDog() {
		return this.#state.items.length < 4 && this.availableNames.length > 0;
	}

	async fetch() {
		this.#state.isLoading = true;
		this.#state.error = null;
		try {
			const data = await api.getDogs();
			this.#state.items = (data.items as Dog[]) || [];
			this.#state.lastFetch = new Date();
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to fetch dogs';
		} finally {
			this.#state.isLoading = false;
		}
	}

	async addDog(name: string) {
		this.#state.isLoading = true;
		this.#state.error = null;
		try {
			await api.addDog(name);
			await this.fetch();
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to add dog';
		} finally {
			this.#state.isLoading = false;
		}
	}

	async removeDog(name: string) {
		this.#state.isLoading = true;
		this.#state.error = null;
		try {
			await api.removeDog(name);
			await this.fetch();
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to remove dog';
		} finally {
			this.#state.isLoading = false;
		}
	}

	setItems(items: Dog[]) {
		this.#state.items = items;
		this.#state.lastFetch = new Date();
	}
}

export const dogsStore = new DogsStore();
