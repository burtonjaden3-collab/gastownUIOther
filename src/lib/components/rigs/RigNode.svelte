<!-- src/lib/components/rigs/RigNode.svelte -->
<script lang="ts">
	import { ChevronRight } from 'lucide-svelte';
	import type { Rig } from '$lib/stores/rigs.svelte';
	import type { Snippet } from 'svelte';
	import Badge from '../core/Badge.svelte';
	import { RIG_STATUS_COLORS, RIG_STATUS_VARIANTS } from '$lib/utils/status';

	interface Props {
		rig: Rig;
		expanded: boolean;
		selected: boolean;
		onToggle: () => void;
		onSelect: () => void;
		children: Snippet;
		'aria-level'?: number;
		'aria-expanded'?: boolean;
		tabindex?: number;
	}

	let { rig, expanded, selected, onToggle, onSelect, children, ...ariaProps }: Props = $props();
</script>

<div role="treeitem" {...ariaProps}>
	<div
		class="flex items-center gap-1 px-2 py-2
			{selected
				? 'bg-rust-600/20 border-l-2 border-rust-500'
				: 'border-l-2 border-transparent hover:bg-oil-800'}"
	>
		<button
			class="p-0.5 text-chrome-500 hover:text-chrome-300"
			onclick={onToggle}
			aria-hidden="true"
			tabindex="-1"
		>
			<ChevronRight
				size={14}
				class="transition-transform duration-150 {expanded ? 'rotate-90' : ''}"
			/>
		</button>
		<button
			class="flex-1 flex items-center gap-2 text-left"
			onclick={onSelect}
			tabindex="-1"
		>
			<span class="w-2 h-2 rounded-full {RIG_STATUS_COLORS[rig.status]}"></span>
			<span class="flex-1 font-stencil text-sm uppercase tracking-wider text-chrome-100 truncate">
				{rig.name}
			</span>
			<Badge variant={RIG_STATUS_VARIANTS[rig.status]}>
				{rig.status.toUpperCase()}
			</Badge>
		</button>
	</div>

	{#if expanded}
		<div role="group">
			{@render children()}
		</div>
	{/if}
</div>
