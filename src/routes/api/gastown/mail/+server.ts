/**
 * GET /api/gastown/mail
 * Returns inbox messages from `gt mail inbox --json --all`
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';

export interface MailMessage {
	id: string;
	from: string;
	to: string;
	subject: string;
	body?: string;
	type: string;
	priority: number;
	read: boolean;
	createdAt: string;
	readAt?: string;
	rig_name?: string;
	labels?: string[];
}

export const GET: RequestHandler = async () => {
	const requestId = crypto.randomUUID();
	const supervisor = getProcessSupervisor();

	try {
		const result = await supervisor.gt<MailMessage[]>(
			['mail', 'inbox', '--json', '--all'],
			{ timeout: 15_000 }
		);

		if (!result.success) {
			if (result.error?.includes('no messages') || result.error?.includes('No messages')) {
				return json({
					messages: [],
					total: 0,
					unread: 0,
					timestamp: new Date().toISOString(),
					requestId
				});
			}

			return json(
				{ error: result.error || 'Failed to get mail', requestId },
				{ status: 500 }
			);
		}

		const messages = result.data || [];
		const unread = messages.filter((m) => !m.read).length;

		return json({
			messages,
			total: messages.length,
			unread,
			timestamp: new Date().toISOString(),
			requestId,
			duration: result.duration
		});
	} catch (err) {
		console.error('Mail inbox endpoint error:', err);
		return json(
			{ error: err instanceof Error ? err.message : 'Unknown error', requestId },
			{ status: 500 }
		);
	}
};
