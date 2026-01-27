/**
 * POST /api/gastown/mail/[id]/archive
 * Archives a message via `gt mail archive <id>`
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
			['mail', 'archive', id],
			{ timeout: 15_000 }
		);

		if (!result.success) {
			return serverError(new Error(result.error || 'Failed to archive message'), requestId);
		}

		return json({
			success: true,
			message: `Message ${id} archived`,
			timestamp: new Date().toISOString(),
			requestId
		});
	} catch (err) {
		console.error('Mail archive endpoint error:', err);
		return serverError(err, requestId);
	}
};
