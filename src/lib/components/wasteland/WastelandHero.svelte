<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { browser } from '$app/environment';
	import { cn } from '$lib/utils/cn';
	import WastelandScene from './WastelandScene.svelte';

	type VehicleStatus = 'pending' | 'running' | 'completed' | 'blocked' | 'failed';
	type VehicleTaskType = 'pr' | 'issue';

	interface HeroTask {
		id: string;
		status: VehicleStatus;
		type?: VehicleTaskType;
	}

	interface Props {
		class?: string;
		load?: number;
		tasks?: HeroTask[];
		agents?: Array<{ name: string; state: string; assignedTask?: string }>;
	}

	const { class: className, load = 0, tasks = [], agents = [] }: Props = $props();

	// Stable key for Canvas — set once at init, not in $effect (avoids double-mount)
	const mountKey = crypto.randomUUID();

	// Reduced motion preference detection (SSR-safe)
	let prefersReducedMotion = $state(false);

	$effect(() => {
		if (!browser) return;
		const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
		prefersReducedMotion = mql.matches;
		const handler = (e: MediaQueryListEvent) => {
			prefersReducedMotion = e.matches;
		};
		mql.addEventListener('change', handler);
		return () => mql.removeEventListener('change', handler);
	});

	// Critical load vibration effect
	const band = $derived(
		load > 80 ? 'critical' : load > 60 ? 'high' : load > 30 ? 'moderate' : 'low'
	);
	let shakeX = $state(0);
	let shakeY = $state(0);

	$effect(() => {
		if (band !== 'critical' || prefersReducedMotion) {
			shakeX = 0;
			shakeY = 0;
			return;
		}
		const interval = setInterval(() => {
			shakeX = (Math.random() - 0.5) * 2;
			shakeY = (Math.random() - 0.5) * 2;
		}, 1000 / 15);
		return () => clearInterval(interval);
	});
</script>

{#if browser}
	{#if prefersReducedMotion}
		<!-- Static SVG fallback for reduced-motion preference -->
		<div class={cn('h-[300px] w-full overflow-hidden border-b border-oil-800', className)}>
			<svg viewBox="0 0 800 300" class="h-full w-full" preserveAspectRatio="xMidYMid slice">
				<defs>
					<linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="#1a1a1a" />
						<stop offset="100%" stop-color="#7a301c" />
					</linearGradient>
				</defs>
				<!-- Sky -->
				<rect width="800" height="300" fill="url(#sky-grad)" />
				<!-- Desert horizon -->
				<rect x="0" y="220" width="800" height="80" fill="#5c200f" />
				<!-- Dune silhouettes -->
				<ellipse cx="200" cy="220" rx="200" ry="20" fill="#42160b" />
				<ellipse cx="600" cy="225" rx="150" ry="15" fill="#3d3d3d" />
				<!-- Citadel silhouette -->
				<rect x="520" y="80" width="40" height="140" fill="#6b7280" rx="2" />
				<rect x="490" y="110" width="30" height="110" fill="#4b5563" rx="2" />
				<rect x="480" y="190" width="100" height="30" fill="#4b5563" rx="1" />
				<!-- Antenna -->
				<line x1="540" y1="80" x2="540" y2="50" stroke="#6b7280" stroke-width="1" />
				<circle cx="540" cy="48" r="3" fill="#ef4444" />
				<!-- Windows -->
				<rect x="530" y="120" width="8" height="5" fill="#d97706" opacity="0.7" />
				<rect x="530" y="140" width="8" height="5" fill="#d97706" opacity="0.5" />
				<rect x="530" y="160" width="8" height="5" fill="#d97706" opacity="0.6" />
			</svg>
		</div>
	{:else}
		{#key mountKey}
			<div
				class={cn('h-[300px] w-full overflow-hidden border-b border-oil-800', className)}
				style:transform="translate({shakeX}px, {shakeY}px)"
			>
				<Canvas renderMode="always">
					<WastelandScene {load} {tasks} {agents} />
				</Canvas>
			</div>
		{/key}
	{/if}
{/if}
