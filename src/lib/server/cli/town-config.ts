/**
 * Town Config — reads Gas Town configuration from disk
 *
 * Avoids broken `gt status --json` by reading the on-disk JSON files directly:
 *   - mayor/rigs.json  — rig registry
 *   - mayor/daemon.json — patrol/daemon config
 *   - mayor/town.json  — town metadata
 */

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';

// ── Types ──────────────────────────────────────────────────────────────────

interface RigEntry {
	git_url: string;
	added_at: string;
	beads: { repo: string; prefix: string };
}

interface RigsConfig {
	version: number;
	rigs: Record<string, RigEntry>;
}

interface DaemonConfig {
	type: string;
	version: number;
	heartbeat: { enabled: boolean; interval: string };
	patrols: Record<string, { enabled: boolean; interval: string; agent: string }>;
}

interface TownConfig {
	type: string;
	version: number;
	name: string;
	owner: string;
	public_name: string;
	created_at: string;
}

export interface RigInfo {
	name: string;
	gitUrl: string;
	addedAt: string;
	beadsPrefix: string;
}

// ── Town root discovery ────────────────────────────────────────────────────

let cachedTownRoot: string | null = null;

/**
 * Find the Gas Town root directory by:
 * 1. Checking GT_TOWN env var
 * 2. Walking up from cwd looking for mayor/town.json
 * 3. Checking ~/gt as a well-known default location
 */
export function findTownRoot(): string {
	if (cachedTownRoot) return cachedTownRoot;

	const hasTown = (dir: string) => existsSync(join(dir, 'mayor', 'town.json'));

	// 1. Check env var first
	if (process.env.GT_TOWN) {
		if (hasTown(process.env.GT_TOWN)) {
			cachedTownRoot = process.env.GT_TOWN;
			return cachedTownRoot;
		}
		console.warn(`[town-config] GT_TOWN=${process.env.GT_TOWN} set but mayor/town.json not found there`);
	}

	// 2. Walk up from cwd
	let dir = process.cwd();
	for (let i = 0; i < 10; i++) {
		if (hasTown(dir)) {
			cachedTownRoot = dir;
			return dir;
		}
		const parent = dirname(dir);
		if (parent === dir) break; // reached filesystem root
		dir = parent;
	}

	// 3. Check ~/gt as well-known default
	const defaultRoot = join(homedir(), 'gt');
	if (hasTown(defaultRoot)) {
		cachedTownRoot = defaultRoot;
		return defaultRoot;
	}

	throw new Error(
		'Cannot find Gas Town root (no mayor/town.json found). ' +
		'Set GT_TOWN env var or run from within the town directory.'
	);
}

// ── Config readers ─────────────────────────────────────────────────────────

/**
 * Get the list of registered rig names and metadata from mayor/rigs.json
 */
export async function getRegisteredRigs(): Promise<RigInfo[]> {
	const root = findTownRoot();
	const content = await readFile(join(root, 'mayor', 'rigs.json'), 'utf-8');
	const config: RigsConfig = JSON.parse(content);

	return Object.entries(config.rigs).map(([name, entry]) => ({
		name,
		gitUrl: entry.git_url,
		addedAt: entry.added_at,
		beadsPrefix: entry.beads.prefix
	}));
}

/**
 * Get rig names only (convenience)
 */
export async function getRigNames(): Promise<string[]> {
	const rigs = await getRegisteredRigs();
	return rigs.map((r) => r.name);
}

/**
 * Read daemon/patrol config from mayor/daemon.json
 */
export async function getDaemonConfig(): Promise<DaemonConfig | null> {
	try {
		const root = findTownRoot();
		const content = await readFile(join(root, 'mayor', 'daemon.json'), 'utf-8');
		return JSON.parse(content);
	} catch {
		return null;
	}
}

/**
 * Read town metadata from mayor/town.json
 */
export async function getTownConfig(): Promise<TownConfig | null> {
	try {
		const root = findTownRoot();
		const content = await readFile(join(root, 'mayor', 'town.json'), 'utf-8');
		return JSON.parse(content);
	} catch {
		return null;
	}
}

// ── Rig status text parser ─────────────────────────────────────────────────

export interface ParsedAgentEntry {
	status: 'running' | 'idle';
	description: string;
}

export interface ParsedRigStatus {
	name: string;
	status: string; // e.g. "OPERATIONAL"
	witnessRunning: boolean;
	refineryRunning: boolean;
	polecatCount: number;
	crewCount: number;
	polecats: ParsedAgentEntry[];
	crews: ParsedAgentEntry[];
}

/**
 * Parse the text output of `gt rig status <name>`
 *
 * Example output:
 *   Metals_Tracker
 *     Status: OPERATIONAL
 *     Path: /home/user/gt/Metals_Tracker
 *     Beads prefix: mt-
 *
 *   Witness
 *     ● running
 *
 *   Refinery
 *     ● running
 *
 *   Polecats (none)
 *
 *   Crew (4)
 *     ○ Worker: worker/branch
 */
export function parseRigStatusOutput(stdout: string): ParsedRigStatus {
	const lines = stdout.split('\n');

	let name = '';
	let status = 'unknown';
	let witnessRunning = false;
	let refineryRunning = false;
	let polecatCount = 0;
	let crewCount = 0;
	const polecats: ParsedAgentEntry[] = [];
	const crews: ParsedAgentEntry[] = [];

	let section = '';

	for (const line of lines) {
		const trimmed = line.trim();

		// First non-empty line is the rig name
		if (!name && trimmed && !trimmed.startsWith('Status:')) {
			name = trimmed;
			continue;
		}

		// Status line
		const statusMatch = trimmed.match(/^Status:\s+(.+)/);
		if (statusMatch) {
			status = statusMatch[1];
			continue;
		}

		// Section headers
		if (trimmed === 'Witness') {
			section = 'witness';
			continue;
		}
		if (trimmed === 'Refinery') {
			section = 'refinery';
			continue;
		}

		// Running indicator for witness/refinery
		if (trimmed.includes('running')) {
			if (section === 'witness') witnessRunning = true;
			if (section === 'refinery') refineryRunning = true;
		}

		// Polecat count
		const polecatMatch = trimmed.match(/^Polecats\s*\((\d+|none)\)/);
		if (polecatMatch) {
			polecatCount = polecatMatch[1] === 'none' ? 0 : parseInt(polecatMatch[1], 10);
			section = 'polecats';
			continue;
		}

		// Crew count
		const crewMatch = trimmed.match(/^Crew\s*\((\d+|none)\)/);
		if (crewMatch) {
			crewCount = crewMatch[1] === 'none' ? 0 : parseInt(crewMatch[1], 10);
			section = 'crew';
			continue;
		}

		// Individual agent entries: ● = running/busy, ○ = idle
		if (/^[●○]/.test(trimmed)) {
			const isRunning = trimmed.startsWith('●');
			const description = trimmed.replace(/^[●○]\s*/, '').trim();
			const entry: ParsedAgentEntry = {
				status: isRunning ? 'running' : 'idle',
				description
			};

			if (section === 'polecats') {
				polecats.push(entry);
			} else if (section === 'crew') {
				crews.push(entry);
			}
		}
	}

	return { name, status, witnessRunning, refineryRunning, polecatCount, crewCount, polecats, crews };
}
