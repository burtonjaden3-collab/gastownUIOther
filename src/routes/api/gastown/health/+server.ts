import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor, getRigNames } from '$lib/server/cli';
import { createRequestId, serverError } from '$lib/server/api-response';
import { parseDoctorOutput, createErrorReport } from '$lib/utils/parse-doctor-output';
import type { DiagnosticsReport } from '$lib/utils/parse-doctor-output';

export const GET: RequestHandler = async ({ url }) => {
	const requestId = createRequestId();
	const supervisor = getProcessSupervisor();
	const runDiagnostics = url.searchParams.get('diagnostics') === 'true';

	try {
		let rigNames: string[] = [];
		try {
			rigNames = await getRigNames();
		} catch { /* no rigs */ }

		const rigHealth = [];

		for (const rigName of rigNames) {
			const issues: string[] = [];
			let witnessStatus = 'unknown';
			let refineryStatus = 'unknown';
			let polecatCount = 0;
			let crewCount = 0;

			try {
				const witnessResult = await supervisor.gt(['witness', 'status', rigName], { timeout: 10_000 });
				if (witnessResult.success) {
					const text = typeof witnessResult.data === 'string' ? witnessResult.data : String(witnessResult.data);
					witnessStatus = /running|active/i.test(text) ? 'running' : 'stopped';
					if (witnessStatus === 'stopped') issues.push('Witness not running');
				} else {
					issues.push('Witness status check failed');
				}
			} catch {
				witnessStatus = 'error';
				issues.push('Witness unreachable');
			}

			try {
				const refineryResult = await supervisor.gt(['refinery', 'status', rigName], { timeout: 10_000 });
				if (refineryResult.success) {
					const text = typeof refineryResult.data === 'string' ? refineryResult.data : String(refineryResult.data);
					refineryStatus = /running|active/i.test(text) ? 'running' : 'stopped';
					if (refineryStatus === 'stopped') issues.push('Refinery not running');
					const pcMatch = text.match(/polecats?[:\s]+(\d+)/i);
					if (pcMatch) polecatCount = parseInt(pcMatch[1], 10);
					const crMatch = text.match(/crews?[:\s]+(\d+)/i);
					if (crMatch) crewCount = parseInt(crMatch[1], 10);
				} else {
					issues.push('Refinery status check failed');
				}
			} catch {
				refineryStatus = 'error';
				issues.push('Refinery unreachable');
			}

			rigHealth.push({ rigName, witnessStatus, refineryStatus, polecatCount, crewCount, issues });
		}

		let diagnostics: DiagnosticsReport | null = null;
		if (runDiagnostics) {
			try {
				const doctorResult = await supervisor.gt(['doctor', '-v'], { timeout: 60_000 });
				// Doctor exits non-zero when it finds issues — output is still useful
				const text = typeof doctorResult.data === 'string' ? doctorResult.data : String(doctorResult.data ?? '');
				if (text.trim()) {
					const rawLines = text.split('\n').filter(Boolean);
					diagnostics = parseDoctorOutput(rawLines);
				} else {
					diagnostics = createErrorReport(
						`doctor command failed${doctorResult.error ? ` — ${doctorResult.error}` : ''}`
					);
				}
			} catch (e) {
				diagnostics = createErrorReport(
					e instanceof Error ? e.message : 'doctor command unreachable'
				);
			}
		}

		const hasIssues = rigHealth.some(r => r.issues.length > 0);
		const hasCritical = rigHealth.some(r => r.witnessStatus === 'error' || r.refineryStatus === 'error');
		const overallStatus = hasCritical ? 'critical' : hasIssues ? 'degraded' : 'healthy';

		return json({
			data: {
				overallStatus,
				rigHealth,
				diagnostics,
				lastCheck: new Date().toISOString()
			},
			requestId
		});
	} catch (err) {
		return serverError(err, requestId);
	}
};
