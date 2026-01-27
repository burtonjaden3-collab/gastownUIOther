/**
 * Mail Store - Svelte 5 Runes
 * Manages mail messages and inbox state for the mayor's escalation inbox.
 *
 * Mail sources:
 *   witness  - rig-level issues (polecat help, stuck, idle dirty, cleanup failure, deacon unresponsive, swarm complete)
 *   deacon   - town-level issues (convoy complete, health check failure, witness cleanup failure, dog chronic failure)
 *   dog      - infrastructure tasks (orphan escalation, high-priority unblocked, daily digest)
 */

import { api } from '$lib/api/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Raw mail message from API (before transformation) */
export interface RawMailMessage {
	id: string;
	subject?: string;
	title?: string;
	body?: string;
	description?: string;
	from?: string;
	created_by?: string;
	to?: string;
	assignee?: string;
	read?: boolean;
	status?: string;
	priority?: number;
	type?: string;
	category?: string;
	createdAt?: string;
	created_at?: string;
	labels?: string[];
	threadId?: string;
	thread_id?: string;
	replyTo?: string;
	reply_to?: string;
	rig_name?: string;
	rigName?: string;
}

/** API response from getInbox() */
export interface MailInboxResponse {
	messages?: RawMailMessage[];
	items?: RawMailMessage[];
}

export type MailStatus = 'read' | 'unread';

/** Which agent type sent the mail */
export type MailSource = 'witness' | 'deacon' | 'dog';

/** All known escalation categories */
export type MailCategory =
	// Witness (rig-level)
	| 'polecat_help'
	| 'polecat_stuck'
	| 'idle_dirty_polecat'
	| 'dirty_cleanup_failure'
	| 'deacon_unresponsive'
	| 'swarm_complete'
	// Deacon (town-level)
	| 'convoy_complete'
	| 'health_check_failure'
	| 'witness_cleanup_failure'
	| 'dog_chronic_failure'
	// Dogs (infrastructure)
	| 'orphan_escalation'
	| 'high_priority_unblocked'
	| 'daily_digest'
	// Fallback
	| 'unknown';

export interface MailMessage {
	id: string;
	subject: string;
	body: string;
	from: string;
	to: string;
	status: MailStatus;
	priority: number; // 0=urgent, 1=high, 2=normal, 3=low
	category: MailCategory;
	source: MailSource;
	createdAt: string;
	labels: string[];
	threadId?: string;
	replyTo?: string;
	rigName?: string; // present on witness mails
}

// ---------------------------------------------------------------------------
// Source / category derivation helpers
// ---------------------------------------------------------------------------

const WITNESS_CATEGORIES: MailCategory[] = [
	'polecat_help',
	'polecat_stuck',
	'idle_dirty_polecat',
	'dirty_cleanup_failure',
	'deacon_unresponsive',
	'swarm_complete'
];

const DEACON_CATEGORIES: MailCategory[] = [
	'convoy_complete',
	'health_check_failure',
	'witness_cleanup_failure',
	'dog_chronic_failure'
];

const DOG_CATEGORIES: MailCategory[] = [
	'orphan_escalation',
	'high_priority_unblocked',
	'daily_digest'
];

/** Map a raw category string to a typed MailCategory */
export function toMailCategory(raw: string | undefined): MailCategory {
	if (!raw) return 'unknown';
	const normalized = raw.toLowerCase().replace(/-/g, '_');
	const all: MailCategory[] = [...WITNESS_CATEGORIES, ...DEACON_CATEGORIES, ...DOG_CATEGORIES];
	const match = all.find((c) => c === normalized);
	if (!match) {
		console.warn(`[MailStore] Unknown mail category: "${raw}"`);
		return 'unknown';
	}
	return match;
}

/** Derive source from category, falling back to parsing the `from` field */
export function deriveSource(category: MailCategory, from: string): MailSource {
	if (WITNESS_CATEGORIES.includes(category)) return 'witness';
	if (DEACON_CATEGORIES.includes(category)) return 'deacon';
	if (DOG_CATEGORIES.includes(category)) return 'dog';

	// Fallback: parse the from field
	const lower = from.toLowerCase();
	if (lower.includes('witness')) return 'witness';
	if (lower.includes('deacon')) return 'deacon';
	if (lower.includes('dog') || lower.includes('kennel')) return 'dog';

	return 'witness'; // default
}

/** Human-readable label for a category */
export const CATEGORY_LABELS: Record<MailCategory, string> = {
	polecat_help: 'Polecat Asks for Help',
	polecat_stuck: 'Polecat Stuck',
	idle_dirty_polecat: 'Idle Dirty Polecat',
	dirty_cleanup_failure: 'Dirty Cleanup Failure',
	deacon_unresponsive: 'Deacon Unresponsive',
	swarm_complete: 'Swarm Complete',
	convoy_complete: 'Convoy Complete',
	health_check_failure: 'Health Check Failure',
	witness_cleanup_failure: 'Witness Cleanup Failure',
	dog_chronic_failure: 'Dog Chronic Failure',
	orphan_escalation: 'Orphan Escalation',
	high_priority_unblocked: 'High-Priority Unblocked',
	daily_digest: 'Daily Digest',
	unknown: 'Unknown'
};

/** Human-readable label for a source */
export const SOURCE_LABELS: Record<MailSource, string> = {
	witness: 'Witness',
	deacon: 'Deacon',
	dog: 'Dog'
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface MailState {
	items: MailMessage[];
	isLoading: boolean;
	error: string | null;
	lastFetch: Date | null;
	selectedId: string | null;
}

/**
 * Transform a raw API message into our typed MailMessage.
 */
export function transformMessage(m: RawMailMessage): MailMessage {
	const category = toMailCategory(m.type || m.category);
	const from =
		m.from || m.created_by || (m.labels?.find((l: string) => l.startsWith('from:'))?.slice(5)) || 'unknown';
	const source = deriveSource(category, from);

	return {
		id: m.id,
		subject: m.subject || m.title || '',
		body: m.body || m.description || '',
		from,
		to: m.to || m.assignee || '',
		status: m.read === true || m.status === 'read' ? 'read' : 'unread',
		priority: m.priority ?? 2,
		category,
		source,
		createdAt: m.createdAt || m.created_at || new Date().toISOString(),
		labels: m.labels || [],
		threadId: m.threadId || m.thread_id,
		replyTo: m.replyTo || m.reply_to,
		rigName: m.rig_name || m.rigName
	};
}

class MailStore {
	#state = $state<MailState>({
		items: [],
		isLoading: false,
		error: null,
		lastFetch: null,
		selectedId: null
	});

	// -- Getters ---------------------------------------------------------------

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

	get unreadCount() {
		return this.#state.items.filter((m) => m.status === 'unread').length;
	}

	get selectedId() {
		return this.#state.selectedId;
	}

	get selected(): MailMessage | null {
		if (!this.#state.selectedId) return null;
		return this.#state.items.find((m) => m.id === this.#state.selectedId) || null;
	}

	// -- Filtered views --------------------------------------------------------

	bySource(source: MailSource): MailMessage[] {
		return this.#state.items.filter((m) => m.source === source);
	}

	byCategory(category: MailCategory): MailMessage[] {
		return this.#state.items.filter((m) => m.category === category);
	}

	// -- Actions ---------------------------------------------------------------

	async fetch() {
		this.#state.isLoading = true;
		this.#state.error = null;

		try {
			const response = (await api.getInbox()) as MailInboxResponse;
			const raw = response.messages || response.items || [];
			this.#state.items = raw.map((m) => transformMessage(m));
			this.#state.lastFetch = new Date();
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to fetch inbox';
			console.error('Failed to fetch inbox:', e);
		} finally {
			this.#state.isLoading = false;
		}
	}

	async send(
		to: string,
		subject: string,
		body: string,
		opts?: { category?: MailCategory; priority?: number }
	): Promise<void> {
		this.#state.isLoading = true;
		this.#state.error = null;

		try {
			await api.sendMail(to, subject, body, {
				type: opts?.category,
				priority: opts?.priority
			});
			await this.fetch();
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to send mail';
			console.error('Failed to send mail:', e);
		} finally {
			this.#state.isLoading = false;
		}
	}

	async markRead(id: string): Promise<boolean> {
		this.#state.error = null;
		try {
			await api.markRead(id);
			this.#state.items = this.#state.items.map((msg) =>
				msg.id === id ? { ...msg, status: 'read' as MailStatus } : msg
			);
			return true;
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to mark as read';
			console.error('Failed to mark as read:', e);
			return false;
		}
	}

	async archive(id: string): Promise<boolean> {
		this.#state.error = null;
		try {
			await api.archiveMail(id);
			this.#state.items = this.#state.items.filter((msg) => msg.id !== id);
			if (this.#state.selectedId === id) {
				this.#state.selectedId = null;
			}
			return true;
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to archive message';
			console.error('Failed to archive message:', e);
			return false;
		}
	}

	async reply(id: string, body: string): Promise<void> {
		this.#state.isLoading = true;
		this.#state.error = null;
		try {
			await api.replyMail(id, body);
			await this.fetch();
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to reply to message';
			console.error('Failed to reply to message:', e);
		} finally {
			this.#state.isLoading = false;
		}
	}

	select(id: string | null) {
		this.#state.selectedId = id;
	}

	/** Replace all items (used by SSE updates) */
	setItems(messages: MailMessage[]) {
		this.#state.items = messages;
		this.#state.lastFetch = new Date();
	}

	getMessage(id: string): MailMessage | undefined {
		return this.#state.items.find((m) => m.id === id);
	}
}

export const mailStore = new MailStore();
