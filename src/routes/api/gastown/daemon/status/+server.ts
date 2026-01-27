import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor, getDaemonConfig } from '$lib/server/cli';

export const GET: RequestHandler = async () => {
	const requestId = crypto.randomUUID();
	const supervisor = getProcessSupervisor();

	try {
		const [statusResult, daemonConfig] = await Promise.all([
			supervisor.gt(['daemon', 'status'], { timeout: 10_000 }).catch(() => ({ success: false, data: null, error: 'Failed' })),
			getDaemonConfig()
		]);

		let running = false;
		let pid: number | null = null;
		let uptime: string | null = null;

		if (statusResult.success && statusResult.data) {
			const text = typeof statusResult.data === 'string' ? statusResult.data : String(statusResult.data);
			running = /running|active|up/i.test(text);
			const pidMatch = text.match(/PID[:\s]+(\d+)/i);
			if (pidMatch) pid = parseInt(pidMatch[1], 10);
			const uptimeMatch = text.match(/uptime[:\s]+(.+)/i);
			if (uptimeMatch) uptime = uptimeMatch[1].trim();
		}

		return json({
			data: {
				running,
				pid,
				uptime,
				heartbeat: daemonConfig?.heartbeat || { enabled: false, interval: 'unknown' },
				patrols: daemonConfig?.patrols || {}
			},
			requestId
		});
	} catch (err) {
		return json({ data: null, requestId, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
	}
};
