/**
 * POST /api/gastown/mail/[id]/reply
 * Replies to a message via `gt mail reply <id> -m <body>`
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';
import { createRequestId, validationError, serverError } from '$lib/server/api-response';
import { z } from 'zod';

const ReplySchema = z.object({
	body: z.string().min(1)
});

export const POST: RequestHandler = async ({ params, request }) => {
	const requestId = createRequestId();
	const supervisor = getProcessSupervisor();
	const { id } = params;

	try {
		const body = await request.json();
		const parsed = ReplySchema.safeParse(body);

		if (!parsed.success) {
			return validationError('Invalid request body: ' + parsed.error.issues.map(i => i.message).join(', '), requestId);
		}

		const { body: messageBody } = parsed.data;

		const result = await supervisor.gt(
			['mail', 'reply', id, '-m', messageBody],
			{ timeout: 30_000 }
		);

		if (!result.success) {
			return serverError(new Error(result.error || 'Failed to reply to message'), requestId);
		}

		return json({
			success: true,
			message: `Reply sent to message ${id}`,
			timestamp: new Date().toISOString(),
			requestId
		});
	} catch (err) {
		console.error('Mail reply endpoint error:', err);
		return serverError(err, requestId);
	}
};
