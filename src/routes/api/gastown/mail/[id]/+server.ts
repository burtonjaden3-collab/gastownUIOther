/**
 * GET /api/gastown/mail/[id]
 * Returns a single message from `gt mail read <id> --json`
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';
import type { MailMessage } from '../+server';

export const GET: RequestHandler = async ({ params }) => {
	const requestId = crypto.randomUUID();
	const supervisor = getProcessSupervisor();
	const { id } = params;

	try {
		const result = await supervisor.gt<MailMessage>(
			['mail', 'read', id, '--json'],
			{ timeout: 15_000 }
		);

		if (!result.success) {
			return json(
				{ error: result.error || 'Failed to read message', requestId },
				{ status: 500 }
			);
		}

		return json({
			message: result.data,
			timestamp: new Date().toISOString(),
			requestId,
			duration: result.duration
		});
	} catch (err) {
		console.error('Mail read endpoint error:', err);
		return json(
			{ error: err instanceof Error ? err.message : 'Unknown error', requestId },
			{ status: 500 }
		);
	}
};
