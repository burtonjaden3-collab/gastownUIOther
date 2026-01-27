/**
 * Settings Store - Svelte 5 Runes
 * Persists user preferences to localStorage with SSR-safe hydration.
 */

import type { DetailLevel } from './tasks.svelte';

const STORAGE_KEY = 'gastown-settings';

export interface AppSettings {
	detailLevel: DetailLevel;
	autoRefresh: boolean;
	refreshInterval: string;
}

const DEFAULTS: AppSettings = {
	detailLevel: 'normal',
	autoRefresh: true,
	refreshInterval: '5'
};

const VALID_DETAIL_LEVELS: DetailLevel[] = ['minimal', 'normal', 'verbose'];
const VALID_INTERVALS = ['2', '5', '10', '30'];

class SettingsStore {
	#state = $state<AppSettings>({ ...DEFAULTS });

	get detailLevel() {
		return this.#state.detailLevel;
	}

	set detailLevel(v: DetailLevel) {
		this.#state.detailLevel = v;
		this.#persist();
	}

	get autoRefresh() {
		return this.#state.autoRefresh;
	}

	set autoRefresh(v: boolean) {
		this.#state.autoRefresh = v;
		this.#persist();
	}

	get refreshInterval() {
		return this.#state.refreshInterval;
	}

	set refreshInterval(v: string) {
		this.#state.refreshInterval = v;
		this.#persist();
	}

	/** Batch-update multiple fields at once. */
	updateAll(partial: Partial<AppSettings>) {
		if (partial.detailLevel !== undefined) this.#state.detailLevel = partial.detailLevel;
		if (partial.autoRefresh !== undefined) this.#state.autoRefresh = partial.autoRefresh;
		if (partial.refreshInterval !== undefined) this.#state.refreshInterval = partial.refreshInterval;
		this.#persist();
	}

	/** Reset all settings to defaults. */
	reset() {
		this.#state.detailLevel = DEFAULTS.detailLevel;
		this.#state.autoRefresh = DEFAULTS.autoRefresh;
		this.#state.refreshInterval = DEFAULTS.refreshInterval;
		this.#persist();
	}

	/** Read persisted settings from localStorage (SSR-safe). */
	hydrate() {
		if (typeof window === 'undefined') return;

		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw) as Partial<AppSettings>;

			if (parsed.detailLevel && VALID_DETAIL_LEVELS.includes(parsed.detailLevel)) {
				this.#state.detailLevel = parsed.detailLevel;
			}
			if (typeof parsed.autoRefresh === 'boolean') {
				this.#state.autoRefresh = parsed.autoRefresh;
			}
			if (parsed.refreshInterval && VALID_INTERVALS.includes(parsed.refreshInterval)) {
				this.#state.refreshInterval = parsed.refreshInterval;
			}
		} catch {
			// Corrupt data — keep defaults
		}
	}

	#persist() {
		if (typeof window === 'undefined') return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify({
			detailLevel: this.#state.detailLevel,
			autoRefresh: this.#state.autoRefresh,
			refreshInterval: this.#state.refreshInterval
		}));
	}
}

export const settingsStore = new SettingsStore();
