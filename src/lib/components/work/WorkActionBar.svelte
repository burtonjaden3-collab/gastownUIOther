<script lang="ts">
	import { PlusCircle, Truck, X } from 'lucide-svelte';
	import { Button } from '$lib/components/core';
	import type { WorkTab } from './WorkTabs.svelte';

	interface Props {
		activeTab: WorkTab;
		selectionCount: number;
		onNewTask: () => void;
		onNewConvoy: () => void;
		onClearSelection: () => void;
	}

	let { activeTab, selectionCount, onNewTask, onNewConvoy, onClearSelection }: Props = $props();

	const newTaskDisabled = $derived(activeTab === 'sling');
	const newConvoyDisabled = $derived(activeTab === 'sling');
	const showClear = $derived(selectionCount > 0 && activeTab === 'queue');
</script>

<div class="flex items-center gap-3 px-4 py-3 border-b border-chrome-800/30 bg-oil-800">
	<h1 class="font-stencil text-xl uppercase tracking-wider text-chrome-100 mr-auto">Work</h1>

	{#if showClear}
		<span class="text-xs font-mono text-chrome-400">{selectionCount} selected</span>
		<Button variant="ghost" size="sm" onclick={onClearSelection}>
			<X size={14} />
			Clear
		</Button>
	{/if}

	<Button variant="secondary" size="sm" disabled={newConvoyDisabled} onclick={onNewConvoy}>
		<Truck size={14} />
		New Convoy
	</Button>

	<Button variant="primary" size="sm" disabled={newTaskDisabled} onclick={onNewTask}>
		<PlusCircle size={14} />
		New Task
	</Button>
</div>
