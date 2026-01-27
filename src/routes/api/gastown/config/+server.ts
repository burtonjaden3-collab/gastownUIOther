import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTownConfig, getRegisteredRigs, getDaemonConfig, findTownRoot } from '$lib/server/cli';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const GET: RequestHandler = async () => {
	const requestId = crypto.randomUUID();

	try {
		const [townConfig, rigs, daemonConfig] = await Promise.all([
			getTownConfig().catch(() => null),
			getRegisteredRigs().catch(() => []),
			getDaemonConfig().catch(() => null)
		]);

		let escalation = null;
		try {
			const root = findTownRoot();
			const escalationPath = join(root, 'settings', 'escalation.json');
			const content = await readFile(escalationPath, 'utf-8');
			escalation = JSON.parse(content);
		} catch { /* escalation config may not exist */ }

		let overseer = null;
		try {
			const root = findTownRoot();
			const overseerPath = join(root, 'mayor', 'overseer.json');
			const content = await readFile(overseerPath, 'utf-8');
			overseer = JSON.parse(content);
		} catch { /* overseer config may not exist */ }

		return json({
			data: {
				town: townConfig,
				rigs: rigs.map(r => ({ name: r.name, gitUrl: r.gitUrl, addedAt: r.addedAt })),
				daemon: daemonConfig,
				escalation,
				overseer
			},
			requestId
		});
	} catch (err) {
		return json({ data: null, requestId, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
	}
};
