import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';
import { createRequestId, validationError, serverError } from '$lib/server/api-response';

export const POST: RequestHandler = async ({ request }) => {
	const requestId = createRequestId();
	const supervisor = getProcessSupervisor();

	try {
		const body = await request.json();
		const { title, issues } = body as { title: string; issues: string[] };

		if (!title || !issues || issues.length === 0) {
			return validationError('Title and at least one issue ID required', requestId);
		}

		const result = await supervisor.gt(['convoy', 'create', title, ...issues], { timeout: 30_000 });
		if (!result.success) {
			return serverError(new Error(result.error || 'Failed to create convoy'), requestId);
		}
		return json({ success: true, message: `Convoy "${title}" created`, requestId });
	} catch (err) {
		return serverError(err, requestId);
	}
};
