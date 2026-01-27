<!-- src/lib/components/rigs/AgentNode.svelte -->
<script lang="ts">
	import type { Agent } from '$lib/stores/agents.svelte';
	import { AGENT_STATUS_COLORS, AGENT_STATUS_LABELS } from '$lib/utils/status';

	interface Props {
		agent: Agent;
		selected: boolean;
		onSelect: () => void;
		'aria-level'?: number;
		'aria-selected'?: boolean;
		tabindex?: number;
	}

	let { agent, selected, onSelect, ...ariaProps }: Props = $props();
</script>

<button
	role="treeitem"
	{...ariaProps}
	class="w-full flex items-center gap-2 px-2 py-1.5 pl-12 text-left text-sm
		transition-colors duration-100
		{selected
			? 'bg-rust-600/20 border-l-2 border-rust-500 text-chrome-100'
			: 'text-chrome-400 hover:bg-oil-800 hover:text-chrome-200 border-l-2 border-transparent'}"
	onclick={onSelect}
>
	<span class="w-2 h-2 rounded-full {AGENT_STATUS_COLORS[agent.status] || 'bg-neutral-500'}"></span>
	<span class="flex-1 truncate font-mono text-xs">{agent.name}</span>
	{#if agent.status === 'running'}
		<span class="text-[10px] font-mono text-warning-400 uppercase">{AGENT_STATUS_LABELS[agent.status]}</span>
	{/if}
</button>
