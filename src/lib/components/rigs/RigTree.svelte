<!-- src/lib/components/rigs/RigTree.svelte -->
<script lang="ts">
	import { rigsStore, type Rig } from '$lib/stores/rigs.svelte';
	import type { Agent } from '$lib/stores/agents.svelte';
	import RigNode from './RigNode.svelte';
	import AgentTypeNode from './AgentTypeNode.svelte';
	import AgentNode from './AgentNode.svelte';
	import { createTreeKeyboardHandler } from '$lib/utils/tree-keyboard';
	import { buildVisibleRigTreeItems } from '$lib/utils/rig-tree-items';
	import { Plus } from 'lucide-svelte';

	export type Selection =
		| { type: 'rig'; rig: Rig }
		| { type: 'agent'; agent: Agent; rig: Rig }
		| null;

	interface Props {
		selection: Selection;
		onSelect: (selection: Selection) => void;
		onAddRig?: () => void;
	}

	let { selection, onSelect, onAddRig }: Props = $props();

	// Track expanded state for rigs and agent types
	let expandedRigs = $state<Set<string>>(new Set());
	let expandedTypes = $state<Map<string, Set<string>>>(new Map());
	let focusedIndex = $state(0);

	function toggleRig(name: string) {
		expandedRigs.has(name) ? expandedRigs.delete(name) : expandedRigs.add(name);
		expandedRigs = new Set(expandedRigs);
	}

	function toggleType(rigName: string, type: string) {
		const types = expandedTypes.get(rigName) || new Set();
		types.has(type) ? types.delete(type) : types.add(type);
		expandedTypes.set(rigName, types);
		expandedTypes = new Map(expandedTypes);
	}

	const isRigExpanded = (name: string) => expandedRigs.has(name);
	const isTypeExpanded = (rigName: string, type: string) =>
		expandedTypes.get(rigName)?.has(type) || false;
	const isRigSelected = (rig: Rig) => selection?.type === 'rig' && selection.rig.name === rig.name;
	const isAgentSelected = (agent: Agent) =>
		selection?.type === 'agent' && selection.agent.id === agent.id;
	const getAgentsByType = (agents: Agent[], type: string) => agents.filter((a) => a.role === type);

	const agentTypes = ['witness', 'refinery', 'polecat', 'crew'] as const;

	// Build flat list of visible tree items for keyboard navigation
	const visibleItems = $derived(
		buildVisibleRigTreeItems(
			rigsStore.items,
			expandedRigs,
			expandedTypes,
			selection,
			onSelect,
			toggleRig,
			toggleType
		)
	);

	const handleKeydown = $derived(
		createTreeKeyboardHandler(visibleItems, focusedIndex, (index) => {
			focusedIndex = index;
		})
	);
</script>

<div class="h-full overflow-y-auto bg-oil-900 border-r border-oil-700">
	<!-- Header -->
	<div class="flex items-center justify-between px-3 py-2 border-b border-oil-700">
		<span class="font-stencil text-xs uppercase tracking-wider text-chrome-400">Rigs</span>
		{#if onAddRig}
			<button
				class="p-1 rounded-sm text-chrome-400 hover:text-chrome-100 hover:bg-oil-700 transition-colors"
				title="Add rig"
				onclick={onAddRig}
			>
				<Plus size={14} />
			</button>
		{/if}
	</div>

	{#if rigsStore.isLoading && rigsStore.items.length === 0}
		<!-- Skeleton loading -->
		<div class="p-4 space-y-3">
			{#each [1, 2, 3] as _}
				<div class="h-8 bg-oil-800 rounded animate-pulse"></div>
			{/each}
		</div>
	{:else if rigsStore.items.length === 0}
		<!-- Empty state -->
		<div class="p-4 text-center">
			<p class="text-chrome-500 text-sm font-mono">No rigs configured.</p>
			{#if onAddRig}
				<button
					class="mt-2 text-xs text-rust-400 hover:text-rust-300 underline underline-offset-2 transition-colors"
					onclick={onAddRig}
				>
					Add your first rig
				</button>
			{:else}
				<p class="text-chrome-600 text-xs mt-1">Add one with:</p>
				<code class="text-xs text-rust-400 block mt-2">gt rig add &lt;name&gt; &lt;url&gt;</code>
			{/if}
		</div>
	{:else}
		<!-- Rig tree -->
		<div role="tree" aria-label="Rig hierarchy" tabindex="0" onkeydown={handleKeydown} class="py-2">
			{#each rigsStore.items as rig (rig.name)}
				{@const rigIndex = visibleItems.findIndex((item) => item.id === `rig-${rig.name}`)}
				<RigNode
					{rig}
					expanded={isRigExpanded(rig.name)}
					selected={isRigSelected(rig)}
					onToggle={() => toggleRig(rig.name)}
					onSelect={() => onSelect({ type: 'rig', rig })}
					aria-level={1}
					aria-expanded={isRigExpanded(rig.name)}
					tabindex={rigIndex === focusedIndex ? 0 : -1}
				>
					{#each agentTypes as agentType (agentType)}
						{@const agents = getAgentsByType(rig.agents, agentType)}
						{#if agents.length > 0}
							{@const typeIndex = visibleItems.findIndex(
								(item) => item.id === `type-${rig.name}-${agentType}`
							)}
							<AgentTypeNode
								type={agentType}
								{agents}
								expanded={isTypeExpanded(rig.name, agentType)}
								onToggle={() => toggleType(rig.name, agentType)}
								aria-level={2}
								aria-expanded={isTypeExpanded(rig.name, agentType)}
								tabindex={typeIndex === focusedIndex ? 0 : -1}
							>
								{#each agents as agent (agent.id)}
									{@const agentIndex = visibleItems.findIndex(
										(item) => item.id === `agent-${agent.id}`
									)}
									<AgentNode
										{agent}
										selected={isAgentSelected(agent)}
										onSelect={() => onSelect({ type: 'agent', agent, rig })}
										aria-level={3}
										aria-selected={isAgentSelected(agent)}
										tabindex={agentIndex === focusedIndex ? 0 : -1}
									/>
								{/each}
							</AgentTypeNode>
						{/if}
					{/each}
				</RigNode>
			{/each}
		</div>
	{/if}
</div>
