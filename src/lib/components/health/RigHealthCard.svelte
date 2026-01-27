<script lang="ts">
	import { Shield, AlertTriangle } from 'lucide-svelte';

	interface Props {
		rigName: string;
		witnessStatus: string;
		refineryStatus: string;
		polecatCount: number;
		crewCount: number;
		issues: string[];
	}

	let { rigName, witnessStatus, refineryStatus, polecatCount, crewCount, issues }: Props = $props();

	const statusColor = (s: string) => {
		if (s === 'running') return 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]';
		if (s === 'stopped') return 'bg-warning-500';
		return 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]';
	};

	const hasIssues = $derived(issues.length > 0);
</script>

<div class="p-4 rounded-sm bg-oil-800 border {hasIssues ? 'border-warning-500/50' : 'border-oil-700'}">
	<div class="flex items-center justify-between mb-3">
		<div class="flex items-center gap-2">
			<Shield size={16} class={hasIssues ? 'text-warning-400' : 'text-green-400'} />
			<h3 class="font-stencil text-sm uppercase tracking-wider text-chrome-100">{rigName}</h3>
		</div>
	</div>

	<div class="grid grid-cols-2 gap-3 mb-3">
		<div class="flex items-center gap-2">
			<span class="w-2 h-2 rounded-full {statusColor(witnessStatus)}"></span>
			<span class="text-xs font-mono text-chrome-400">Witness</span>
		</div>
		<div class="flex items-center gap-2">
			<span class="w-2 h-2 rounded-full {statusColor(refineryStatus)}"></span>
			<span class="text-xs font-mono text-chrome-400">Refinery</span>
		</div>
	</div>

	<div class="flex items-center gap-4 text-[10px] font-mono text-chrome-500">
		<span>{polecatCount} polecats</span>
		<span>{crewCount} crew</span>
	</div>

	{#if hasIssues}
		<div class="mt-3 pt-3 border-t border-oil-700 space-y-1">
			{#each issues as issue}
				<div class="flex items-center gap-1.5 text-xs font-mono text-warning-400">
					<AlertTriangle size={10} />
					<span>{issue}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
