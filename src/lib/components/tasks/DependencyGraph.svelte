<script lang="ts">
	import { ArrowUp, ArrowDown, Link } from 'lucide-svelte';

	interface Props {
		taskId: string;
		blocks: string[];
		blockedBy: string[];
	}

	let { taskId, blocks, blockedBy }: Props = $props();

	const hasAnyDeps = $derived(blocks.length > 0 || blockedBy.length > 0);
</script>

{#if hasAnyDeps}
	<div class="rounded-sm bg-oil-800 border border-oil-700 p-4 space-y-4">
		<h3 class="font-stencil text-sm uppercase tracking-wider text-chrome-100 flex items-center gap-2">
			<Link size={16} class="text-rust-400" />
			Dependencies
		</h3>

		{#if blockedBy.length > 0}
			<div>
				<div class="flex items-center gap-2 mb-2">
					<ArrowUp size={14} class="text-red-400" />
					<h4 class="text-xs font-stencil uppercase text-red-400">Blocked By ({blockedBy.length})</h4>
				</div>
				<div class="space-y-1">
					{#each blockedBy as depId}
						<a
							href="/tasks/{depId}"
							class="flex items-center gap-2 px-3 py-2 rounded-sm bg-red-500/5 border border-red-500/20 hover:border-red-500/40 transition-colors group"
						>
							<span class="w-2 h-2 rounded-full bg-red-500/60"></span>
							<span class="font-mono text-xs text-red-300 group-hover:text-red-200">{depId}</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		{#if blocks.length > 0}
			<div>
				<div class="flex items-center gap-2 mb-2">
					<ArrowDown size={14} class="text-chrome-400" />
					<h4 class="text-xs font-stencil uppercase text-chrome-400">Blocks ({blocks.length})</h4>
				</div>
				<div class="space-y-1">
					{#each blocks as depId}
						<a
							href="/tasks/{depId}"
							class="flex items-center gap-2 px-3 py-2 rounded-sm bg-oil-900 border border-oil-700 hover:border-oil-600 transition-colors group"
						>
							<span class="w-2 h-2 rounded-full bg-chrome-500/60"></span>
							<span class="font-mono text-xs text-chrome-300 group-hover:text-chrome-200">{depId}</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}
