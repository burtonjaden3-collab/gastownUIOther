/**
 * POST /api/gastown/mail/[id]/read
 * Marks a message as read via `gt mail mark-read <id>`
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';
import { createRequestId, serverError } from '$lib/server/api-response';

export const POST: RequestHandler = async ({ params }) => {
	const requestId = createRequestId();
	const supervisor = getProcessSupervisor();
	const { id } = params;

	try {
		const result = await supervisor.gt(
			['mail', 'mark-read', id],
			{ timeout: 15_000 }
		);

		if (!result.success) {
			return serverError(new Error(result.error || 'Failed to mark message as read'), requestId);
		}

		return json({
			success: true,
			message: `Message ${id} marked as read`,
			timestamp: new Date().toISOString(),
			requestId
		});
	} catch (err) {
		console.error('Mail mark-read endpoint error:', err);
		return serverError(err, requestId);
	}
};
