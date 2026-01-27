/**
 * Feed Store - Svelte 5 Runes
 * Manages activity feed events with filtering
 */

import { api } from '$lib/api/client';

export interface FeedEvent {
	id: string;
	timestamp: string;
	type: string;
	source: string;
	actor: string;
	message: string;
	visibility: string;
}

interface FeedState {
	items: FeedEvent[];
	isLoading: boolean;
	error: string | null;
	lastFetch: Date | null;
	filter: string | null;
}

class FeedStore {
	#state = $state<FeedState>({
		items: [],
		isLoading: false,
		error: null,
		lastFetch: null,
		filter: null
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

	get filter() {
		return this.#state.filter;
	}

	get filtered() {
		if (!this.#state.filter) return this.#state.items;
		return this.#state.items.filter((e) => e.type === this.#state.filter);
	}

	get stats() {
		const items = this.#state.items;
		const counts: Record<string, number> = {};
		for (const e of items) {
			counts[e.type] = (counts[e.type] || 0) + 1;
		}
		return { total: items.length, byType: counts };
	}

	setFilter(type: string | null) {
		this.#state.filter = type;
	}

	async fetch(since = '1h', type?: string) {
		this.#state.isLoading = true;
		this.#state.error = null;
		try {
			const params = new URLSearchParams();
			if (since) params.set('since', since);
			if (type) params.set('type', type);
			const query = params.toString();
			const response = await fetch(`/api/gastown/feed${query ? `?${query}` : ''}`);
			const data = await response.json();
			this.#state.items = (data.items as FeedEvent[]) || [];
			this.#state.lastFetch = new Date();
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to fetch feed';
		} finally {
			this.#state.isLoading = false;
		}
	}

	/**
	 * Replace all items (used by SSE updates)
	 */
	setItems(items: FeedEvent[]) {
		this.#state.items = items;
		this.#state.lastFetch = new Date();
	}
}

export const feedStore = new FeedStore();
