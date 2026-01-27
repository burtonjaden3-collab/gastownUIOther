<!-- src/lib/components/rigs/AgentTypeNode.svelte -->
<script lang="ts">
	import { ChevronRight, Bot, Eye, Factory, Users } from 'lucide-svelte';
	import type { Agent } from '$lib/stores/agents.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		type: 'polecat' | 'witness' | 'refinery' | 'crew';
		agents: Agent[];
		expanded: boolean;
		onToggle: () => void;
		children: Snippet;
		'aria-level'?: number;
		'aria-expanded'?: boolean;
		tabindex?: number;
	}

	let { type, agents, expanded, onToggle, children, ...ariaProps }: Props = $props();

	const icons = {
		polecat: Bot,
		witness: Eye,
		refinery: Factory,
		crew: Users
	};

	const labels = {
		polecat: 'Polecats',
		witness: 'Witness',
		refinery: 'Refinery',
		crew: 'Crews'
	};

	const Icon = $derived(icons[type] || Bot);
</script>

<div role="treeitem" {...ariaProps}>
	<button
		class="w-full flex items-center gap-2 px-2 py-1.5 pl-6 text-left text-xs
			text-chrome-500 hover:text-chrome-300 transition-colors"
		onclick={onToggle}
		disabled={agents.length === 0}
		tabindex="-1"
	>
		<ChevronRight
			size={12}
			class="transition-transform duration-150 {expanded ? 'rotate-90' : ''} {agents.length === 0 ? 'opacity-30' : ''}"
		/>
		<Icon size={14} />
		<span class="font-mono uppercase">{labels[type]}</span>
		<span class="text-chrome-600">({agents.length})</span>
	</button>

	{#if expanded && agents.length > 0}
		<div role="group">
			{@render children()}
		</div>
	{/if}
</div>
