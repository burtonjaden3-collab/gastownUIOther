<script lang="ts">
	import { Radio, CheckCircle2, XCircle } from 'lucide-svelte';

	interface Props {
		patrols: Record<string, { enabled: boolean; interval: string; agent: string }>;
	}

	let { patrols }: Props = $props();

	const patrolEntries = $derived(Object.entries(patrols));
</script>

<div class="rounded-sm bg-oil-800 border border-oil-700">
	<div class="px-4 py-3 border-b border-oil-700">
		<h3 class="font-stencil text-sm uppercase tracking-wider text-chrome-100 flex items-center gap-2">
			<Radio size={16} class="text-rust-400" />
			Patrol Configuration
		</h3>
	</div>

	{#if patrolEntries.length === 0}
		<div class="p-4 text-center">
			<p class="text-sm font-mono text-chrome-500">No patrols configured</p>
		</div>
	{:else}
		<div class="divide-y divide-oil-700/50">
			{#each patrolEntries as [name, config]}
				<div class="px-4 py-3 flex items-center justify-between">
					<div class="flex items-center gap-3">
						{#if config.enabled}
							<CheckCircle2 size={14} class="text-green-400" />
						{:else}
							<XCircle size={14} class="text-chrome-600" />
						{/if}
						<div>
							<p class="font-mono text-sm text-chrome-200">{name}</p>
							<p class="text-[10px] font-mono text-chrome-500">Agent: {config.agent}</p>
						</div>
					</div>
					<div class="text-right">
						<span class="text-xs font-mono {config.enabled ? 'text-green-400' : 'text-chrome-600'}">
							{config.enabled ? 'Enabled' : 'Disabled'}
						</span>
						<p class="text-[10px] font-mono text-chrome-500">{config.interval}</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
