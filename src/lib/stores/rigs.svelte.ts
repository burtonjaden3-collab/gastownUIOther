/**
 * Rigs Store - Svelte 5 Runes
 * Manages rig data with real API integration
 */

import { z } from 'zod';
import { api } from '$lib/api/client';
import type { Agent } from './agents.svelte';

export type RigStatus = 'active' | 'parked' | 'docked' | 'error';

const AgentSchema = z.object({
	id: z.string().optional().default(''),
	name: z.string(),
	address: z.string().optional().default(''),
	role: z.string(),
	status: z.enum(['running', 'idle', 'offline']).optional().default('offline'),
	hasWork: z.boolean().optional().default(false),
	unreadMail: z.number().optional().default(0)
});

const RigSchema = z.object({
	name: z.string(),
	status: z.string(),
	witnessRunning: z.boolean().optional().default(false),
	refineryRunning: z.boolean().optional().default(false),
	polecatCount: z.number().optional().default(0),
	crewCount: z.number().optional().default(0),
	agents: z.array(AgentSchema).optional().default([])
});

const StatusResponseSchema = z.object({
	rigs: z.array(RigSchema).optional().default([])
});

export interface Rig {
	name: string;
	status: RigStatus;
	addedAt: string;
	gitUrl: string;
	hasWitness: boolean;
	hasRefinery: boolean;
	polecatCount: number;
	crewCount: number;
	agents: Agent[];
}

interface RigsState {
	items: Rig[];
	isLoading: boolean;
	error: string | null;
	lastFetch: Date | null;
}

/**
 * Map the CLI status string (e.g. "OPERATIONAL") to a RigStatus enum value.
 */
function deriveRigStatus(cliStatus: string): RigStatus {
	const normalized = cliStatus.toUpperCase();
	if (normalized === 'OPERATIONAL') return 'active';
	if (normalized === 'PARKED') return 'parked';
	if (normalized === 'DOCKED') return 'docked';
	if (normalized === 'ERROR' || normalized === 'UNKNOWN') return 'error';
	// Fallback: if witness or refinery are running, treat as active
	return 'parked';
}

class RigsStore {
	#state = $state<RigsState>({
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

	get stats() {
		const items = this.#state.items;
		return {
			total: items.length,
			active: items.filter((r) => r.status === 'active').length,
			parked: items.filter((r) => r.status === 'parked').length,
			docked: items.filter((r) => r.status === 'docked').length
		};
	}

	getRig(name: string): Rig | undefined {
		return this.#state.items.find((r) => r.name === name);
	}

	/**
	 * Fetch rigs from the API (via status endpoint).
	 * The status endpoint returns camelCase fields and per-rig agents.
	 */
	async fetch() {
		this.#state.isLoading = true;
		this.#state.error = null;

		try {
			const response = await api.getStatus();
			const parsed = StatusResponseSchema.safeParse(response.data);

			if (!parsed.success) {
				throw new Error(`Invalid rig data: ${parsed.error.issues[0]?.message ?? 'unknown schema error'}`);
			}

			this.#state.items = parsed.data.rigs.map((r) => {
				const agents: Agent[] = r.agents.map((a) => ({
					id: a.id || a.name,
					name: a.name,
					address: a.address,
					role: a.role.toLowerCase() as Agent['role'],
					status: a.status,
					hasWork: a.hasWork,
					unreadMail: a.unreadMail
				}));

				return {
					name: r.name,
					status: deriveRigStatus(r.status),
					addedAt: '',
					gitUrl: '',
					hasWitness: r.witnessRunning,
					hasRefinery: r.refineryRunning,
					polecatCount: r.polecatCount,
					crewCount: r.crewCount,
					agents
				};
			});
			this.#state.lastFetch = new Date();
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to fetch rigs';
			console.error('Failed to fetch rigs:', e);
		} finally {
			this.#state.isLoading = false;
		}
	}

	/**
	 * Replace all items (used by SSE updates)
	 */
	setItems(rigs: Rig[]) {
		this.#state.items = rigs;
		this.#state.lastFetch = new Date();
	}
}

export const rigsStore = new RigsStore();
