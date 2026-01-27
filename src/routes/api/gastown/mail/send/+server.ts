/**
 * POST /api/gastown/mail/send
 * Sends a new message via `gt mail send`
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';
import { createRequestId, validationError, serverError } from '$lib/server/api-response';
import { z } from 'zod';

const SendMailSchema = z.object({
	to: z.string().min(1),
	subject: z.string().min(1),
	body: z.string().optional(),
	type: z.string().optional().default('notification'),
	priority: z.number().int().min(0).max(4).optional().default(2)
});

export const POST: RequestHandler = async ({ request }) => {
	const requestId = createRequestId();
	const supervisor = getProcessSupervisor();

	try {
		const body = await request.json();
		const parsed = SendMailSchema.safeParse(body);

		if (!parsed.success) {
			return validationError('Invalid request body: ' + parsed.error.issues.map(i => i.message).join(', '), requestId);
		}

		const { to, subject, body: messageBody, type, priority } = parsed.data;

		const args = [
			'mail', 'send', to,
			'-s', subject,
			'--type', type,
			'--priority', priority.toString()
		];

		if (messageBody) {
			args.push('-m', messageBody);
		}

		const result = await supervisor.gt(args, { timeout: 30_000 });

		if (!result.success) {
			return serverError(new Error(result.error || 'Failed to send message'), requestId);
		}

		return json(
			{
				success: true,
				message: `Message sent to ${to}`,
				timestamp: new Date().toISOString(),
				requestId
			},
			{ status: 201 }
		);
	} catch (err) {
		console.error('Mail send endpoint error:', err);
		return serverError(err, requestId);
	}
};
