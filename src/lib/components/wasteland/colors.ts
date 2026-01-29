/** Gas Town theme colors as hex values for Three.js materials */
export const WASTELAND = {
	desert: {
		ground: '#5c200f',    // darker rust — distinct from sky horizon
		foreground: '#6b2814', // rust-850 midtone
		duneA: '#3d3d3d',     // oil-900
		duneB: '#42160b',     // rust-950
	},
	sky: {
		top: '#1a1a1a',       // oil-950
		horizon: '#7a301c',   // rust-900
		highLoad: '#b43e1c',  // rust-700 — horizon at 60-80% load
		critical: '#ea580c',  // flame-600 — horizon at >80% load
	},
	citadel: {
		primary: '#8b939e',   // chrome-600 — lighter for visibility
		secondary: '#6b7280', // chrome-700
		dark: '#4b5563',      // chrome-800 — shadow accent
		window: '#d97706',    // warm amber glow for lit windows
	},
	light: {
		warm: '#f9b8a0',      // rust-300
	},
	vehicle: {
		body: '#8b939e',      // chrome-600
		accentPR: '#c2410c',  // rust-500
		accentIssue: '#a1a1aa', // chrome-500
		exhaust: '#f97316',   // flame-500
		blocked: '#fbbf24',   // warning-400
		failed: '#3d3d3d',    // oil-900
		headlight: '#fef3c7', // warm headlight glow
	},
	warBoy: {
		body: '#d1d5db',      // chrome-300
		highlight: '#e5e7eb', // chrome-200
	},
	flame: {
		dim: '#9a3412',       // flame-800
		medium: '#ea580c',    // flame-600
		bright: '#fb923c',    // flame-400
		inferno: '#f97316',   // flame-500
		spark: '#fb923c',     // flame-400
	},
	smoke: {
		light: '#6b7280',     // exhaust-500
		dense: '#9ca3af',     // exhaust-400
	},
} as const;
