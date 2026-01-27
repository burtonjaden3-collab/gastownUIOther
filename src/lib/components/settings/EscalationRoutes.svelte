<script lang="ts">
	import { AlertTriangle } from 'lucide-svelte';

	interface Props {
		routes: Record<string, string[]>;
		staleThreshold?: string;
		maxReescalations?: number;
	}

	let { routes, staleThreshold, maxReescalations }: Props = $props();

	const routeEntries = $derived(Object.entries(routes));

	const severityColors: Record<string, { text: string; bg: string; border: string }> = {
		critical: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
		high: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
		medium: { text: 'text-warning-400', bg: 'bg-warning-500/10', border: 'border-warning-500/20' },
		low: { text: 'text-chrome-400', bg: 'bg-chrome-500/10', border: 'border-chrome-500/20' }
	};

	function getColors(severity: string) {
		const lower = severity.toLowerCase();
		return severityColors[lower] || severityColors.low;
	}
</script>

<div class="rounded-sm bg-oil-800 border border-oil-700">
	<div class="px-4 py-3 border-b border-oil-700">
		<h3 class="font-stencil text-sm uppercase tracking-wider text-chrome-100 flex items-center gap-2">
			<AlertTriangle size={16} class="text-rust-400" />
			Escalation Routes
		</h3>
	</div>

	{#if routeEntries.length === 0}
		<div class="p-4 text-center">
			<p class="text-sm font-mono text-chrome-500">No escalation routes configured</p>
		</div>
	{:else}
		<div class="divide-y divide-oil-700/50">
			{#each routeEntries as [severity, channels]}
				{@const colors = getColors(severity)}
				<div class="px-4 py-3 flex items-center justify-between {colors.bg}">
					<div class="flex items-center gap-3">
						<span class="font-stencil text-xs uppercase tracking-wider {colors.text} w-20">
							{severity}
						</span>
					</div>
					<div class="flex items-center gap-2 flex-wrap">
						{#each channels as channel}
							<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-oil-900 text-chrome-300 border {colors.border}">
								{channel}
							</span>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if staleThreshold || maxReescalations !== undefined}
		<div class="px-4 py-3 border-t border-oil-700 flex items-center gap-6">
			{#if staleThreshold}
				<div>
					<span class="text-[10px] font-stencil uppercase text-chrome-500">Stale Threshold</span>
					<p class="font-mono text-xs text-chrome-300">{staleThreshold}</p>
				</div>
			{/if}
			{#if maxReescalations !== undefined}
				<div>
					<span class="text-[10px] font-stencil uppercase text-chrome-500">Max Re-escalations</span>
					<p class="font-mono text-xs text-chrome-300">{maxReescalations}</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
