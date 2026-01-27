// ── Types ──────────────────────────────────────────────────────────

export type DiagnosticStatus = 'pass' | 'warn' | 'fail';

export type DiagnosticFilter = 'all' | 'warnings' | 'failures';

export interface DiagnosticCheck {
	status: DiagnosticStatus;
	name: string;
	description: string;
	details: string[];
}

export interface DiagnosticSection {
	name: string;
	checks: DiagnosticCheck[];
	passCount: number;
	warnCount: number;
	failCount: number;
}

export interface DiagnosticsSummary {
	total: number;
	passed: number;
	warnings: number;
	failures: number;
}

export interface DiagnosticsReport {
	sections: DiagnosticSection[];
	summary: DiagnosticsSummary;
	rawLines: string[];
}

// ── Helpers ────────────────────────────────────────────────────────

const SECTION_HEADER_RE = /^[A-Z][A-Z _-]+$/;
const CHECK_LINE_RE = /^\s*(✓|✔|⚠|✖|✗|✘)\s{1,3}(\S+)\s+(.*)$/;
const DETAIL_RE = /^\s+└─\s?(.*)$/;

function statusFromIcon(icon: string): DiagnosticStatus {
	if (icon === '✓' || icon === '✔') return 'pass';
	if (icon === '⚠') return 'warn';
	return 'fail';
}

function computeSectionCounts(checks: DiagnosticCheck[]) {
	let passCount = 0;
	let warnCount = 0;
	let failCount = 0;
	for (const c of checks) {
		if (c.status === 'pass') passCount++;
		else if (c.status === 'warn') warnCount++;
		else failCount++;
	}
	return { passCount, warnCount, failCount };
}

// ── Parser ─────────────────────────────────────────────────────────

export function parseDoctorOutput(lines: string[]): DiagnosticsReport {
	const sections: DiagnosticSection[] = [];
	let currentSection: { name: string; checks: DiagnosticCheck[] } | null = null;
	let currentCheck: DiagnosticCheck | null = null;

	for (const line of lines) {
		const trimmed = line.trim();

		// Section header: all-caps line with no leading whitespace
		if (trimmed && SECTION_HEADER_RE.test(trimmed)) {
			// Finalize previous section
			if (currentSection) {
				const counts = computeSectionCounts(currentSection.checks);
				sections.push({ ...currentSection, ...counts });
			}
			currentSection = { name: trimmed, checks: [] };
			currentCheck = null;
			continue;
		}

		// Sub-detail line (└─ prefix)
		const detailMatch = line.match(DETAIL_RE);
		if (detailMatch && currentCheck) {
			currentCheck.details.push(detailMatch[1]);
			continue;
		}

		// Check line (✓/⚠/✖ + name + description)
		const checkMatch = line.match(CHECK_LINE_RE);
		if (checkMatch) {
			currentCheck = {
				status: statusFromIcon(checkMatch[1]),
				name: checkMatch[2],
				description: checkMatch[3].trim(),
				details: []
			};
			if (!currentSection) {
				currentSection = { name: 'OUTPUT', checks: [] };
			}
			currentSection.checks.push(currentCheck);
			continue;
		}

		// Indented continuation line that isn't a detail or check — attach to current check
		if (currentCheck && line.startsWith('     ')) {
			currentCheck.details.push(line.trim());
		}
	}

	// Finalize last section
	if (currentSection) {
		const counts = computeSectionCounts(currentSection.checks);
		sections.push({ ...currentSection, ...counts });
	}

	// Defensive fallback: if parsing found nothing, wrap raw lines
	if (sections.length === 0 && lines.length > 0) {
		const checks: DiagnosticCheck[] = lines.map((l, i) => ({
			status: 'warn' as DiagnosticStatus,
			name: `line-${i + 1}`,
			description: l,
			details: []
		}));
		const counts = computeSectionCounts(checks);
		sections.push({ name: 'OUTPUT', checks, ...counts });
	}

	const summary: DiagnosticsSummary = {
		total: sections.reduce((sum, s) => sum + s.checks.length, 0),
		passed: sections.reduce((sum, s) => sum + s.passCount, 0),
		warnings: sections.reduce((sum, s) => sum + s.warnCount, 0),
		failures: sections.reduce((sum, s) => sum + s.failCount, 0)
	};

	return { sections, summary, rawLines: lines };
}

// ── Error Report Helper ────────────────────────────────────────────

export function createErrorReport(message: string): DiagnosticsReport {
	const check: DiagnosticCheck = {
		status: 'fail',
		name: 'doctor-error',
		description: message,
		details: []
	};
	return {
		sections: [{ name: 'ERROR', checks: [check], passCount: 0, warnCount: 0, failCount: 1 }],
		summary: { total: 1, passed: 0, warnings: 0, failures: 1 },
		rawLines: [message]
	};
}
