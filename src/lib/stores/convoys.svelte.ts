/**
 * Convoy Store - Svelte 5 Runes
 * Manages convoy tracking state with real API integration
 */

import { api } from '$lib/api/client';

export type ConvoyStatus = 'open' | 'closed';
export type ConvoyDisplayStatus = 'pending' | 'in_progress' | 'blocked' | 'completed';
export type DetailLevel = 'minimal' | 'normal' | 'verbose';

export interface Convoy {
	id: string;
	title: string;
	description: string;
	status: ConvoyStatus;
	displayStatus: ConvoyDisplayStatus;
	priority: number;
	assignee: string | null;
	trackedCount: number;
	createdAt: string;
	updatedAt: string;
	labels: string[];
}

/** API response from getConvoys() */
export interface ConvoysListResponse {
	items?: Convoy[];
}

interface ConvoysState {
	items: Convoy[];
	isLoading: boolean;
	error: string | null;
	detailLevel: DetailLevel;
	lastFetch: Date | null;
	selectedId: string | null;
}

class ConvoysStore {
	#state = $state<ConvoysState>({
		items: [],
		isLoading: false,
		error: null,
		detailLevel: 'normal',
		lastFetch: null,
		selectedId: null
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

	get detailLevel() {
		return this.#state.detailLevel;
	}

	get lastFetch() {
		return this.#state.lastFetch;
	}

	get selectedId() {
		return this.#state.selectedId;
	}

	get selected(): Convoy | undefined {
		return this.#state.selectedId
			? this.#state.items.find((c) => c.id === this.#state.selectedId)
			: undefined;
	}

	get open() {
		return this.#state.items.filter((c) => c.displayStatus !== 'completed');
	}

	get closed() {
		return this.#state.items.filter((c) => c.displayStatus === 'completed');
	}

	get stats() {
		const items = this.#state.items;
		return {
			total: items.length,
			open: items.filter((c) => c.status === 'open').length,
			closed: items.filter((c) => c.status === 'closed').length,
			pending: items.filter((c) => c.displayStatus === 'pending').length,
			inProgress: items.filter((c) => c.displayStatus === 'in_progress').length,
			completed: items.filter((c) => c.displayStatus === 'completed').length,
			blocked: items.filter((c) => c.displayStatus === 'blocked').length,
			totalTracked: items.reduce((sum, c) => sum + c.trackedCount, 0)
		};
	}

	setDetailLevel(level: DetailLevel) {
		this.#state.detailLevel = level;
	}

	cycleDetailLevel() {
		const levels: DetailLevel[] = ['minimal', 'normal', 'verbose'];
		const currentIndex = levels.indexOf(this.#state.detailLevel);
		this.#state.detailLevel = levels[(currentIndex + 1) % levels.length];
	}

	select(id: string | null) {
		this.#state.selectedId = id;
	}

	async fetch(filters?: { status?: string }) {
		this.#state.isLoading = true;
		this.#state.error = null;

		try {
			const response = (await api.getConvoys(filters)) as ConvoysListResponse;
			this.#state.items = response.items || [];
			this.#state.lastFetch = new Date();
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to fetch convoys';
			console.error('Failed to fetch convoys:', e);
		} finally {
			this.#state.isLoading = false;
		}
	}

	getConvoy(id: string): Convoy | undefined {
		return this.#state.items.find((c) => c.id === id);
	}

	/**
	 * Replace all items (used by SSE updates)
	 */
	setItems(convoys: Convoy[]) {
		this.#state.items = convoys;
		this.#state.lastFetch = new Date();
	}
}

export const convoysStore = new ConvoysStore();
