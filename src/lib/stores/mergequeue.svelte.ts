import { api } from '$lib/api/client';

export interface MergeRequest {
	id: string;
	branch: string;
	rig: string;
	status: 'queued' | 'processing' | 'merged' | 'conflict';
	author: string;
	title: string;
	submittedAt: string;
	mergedAt?: string;
	conflictReason?: string;
}

interface MergeQueueState {
	items: MergeRequest[];
	isLoading: boolean;
	error: string | null;
	lastFetch: Date | null;
	selectedId: string | null;
}

class MergeQueueStore {
	#state = $state<MergeQueueState>({
		items: [],
		isLoading: false,
		error: null,
		lastFetch: null,
		selectedId: null
	});

	get items() { return this.#state.items; }
	get isLoading() { return this.#state.isLoading; }
	get error() { return this.#state.error; }
	get lastFetch() { return this.#state.lastFetch; }
	get selectedId() { return this.#state.selectedId; }

	get selected(): MergeRequest | undefined {
		return this.#state.selectedId ? this.#state.items.find(m => m.id === this.#state.selectedId) : undefined;
	}

	get queued() { return this.#state.items.filter(m => m.status === 'queued'); }
	get processing() { return this.#state.items.filter(m => m.status === 'processing'); }
	get merged() { return this.#state.items.filter(m => m.status === 'merged'); }
	get conflicts() { return this.#state.items.filter(m => m.status === 'conflict'); }

	get stats() {
		const items = this.#state.items;
		return {
			total: items.length,
			queued: items.filter(m => m.status === 'queued').length,
			processing: items.filter(m => m.status === 'processing').length,
			merged: items.filter(m => m.status === 'merged').length,
			conflicts: items.filter(m => m.status === 'conflict').length
		};
	}

	select(id: string | null) { this.#state.selectedId = id; }

	async fetch() {
		this.#state.isLoading = true;
		this.#state.error = null;
		try {
			const data = await api.getMergeQueue();
			this.#state.items = (data.items as MergeRequest[]) || [];
			this.#state.lastFetch = new Date();
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to fetch merge queue';
		} finally {
			this.#state.isLoading = false;
		}
	}

	setItems(items: MergeRequest[]) {
		this.#state.items = items;
		this.#state.lastFetch = new Date();
	}
}

export const mergeQueueStore = new MergeQueueStore();
