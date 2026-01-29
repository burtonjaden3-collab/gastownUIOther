import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor, validateNameParam } from '$lib/server/cli';
import { createRequestId, validationError, serverError } from '$lib/server/api-response';
import { z } from 'zod';

const SlingSchema = z.object({
	beadId: z.string().min(1),
	target: z.string().optional(),
	args: z.string().optional(),
	message: z.string().optional(),
	subject: z.string().optional(),
	account: z.string().optional(),
	create: z.boolean().optional(),
	force: z.boolean().optional(),
	noConvoy: z.boolean().optional()
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

		const { beadId, target, args: argStr, message, subject, account, create, force, noConvoy } = parsed.data;
		const args = ['sling', beadId, target || name];

		if (argStr) args.push('--args', argStr);
		if (message) args.push('--message', message);
		if (subject) args.push('--subject', subject);
		if (account) args.push('--account', account);
		if (create) args.push('--create');
		if (force) args.push('--force');
		if (noConvoy) args.push('--no-convoy');

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
