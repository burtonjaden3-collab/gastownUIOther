import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor, validateNameParam } from '$lib/server/cli';
import { createRequestId, validationError, serverError } from '$lib/server/api-response';
import { z } from 'zod';

const SlingSchema = z.object({
	beadId: z.string().min(1),
	target: z.string().optional()
});

export const POST: RequestHandler = async ({ params, request }) => {
	const requestId = createRequestId();
	const { name } = params;
	const nameError = validateNameParam(name);
	if (nameError) {
		return validationError(nameError, requestId);
	}

	const supervisor = getProcessSupervisor();

	try {
		const body = await request.json();
		const parsed = SlingSchema.safeParse(body);

		if (!parsed.success) {
			return validationError('Invalid request body: ' + parsed.error.issues.map(i => i.message).join(', '), requestId);
		}

		const { beadId, target } = parsed.data;
		const args = ['sling', beadId, target || name];

		const result = await supervisor.gt(args, { timeout: 30_000 });

		if (!result.success) {
			return serverError(new Error(result.error || 'Failed to sling work'), requestId);
		}

		return json({
			success: true,
			message: `Work ${beadId} slung to ${target || name}`,
			requestId
		});
	} catch (err) {
		return serverError(err, requestId);
	}
};
