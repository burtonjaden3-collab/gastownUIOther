<script lang="ts">
	import { ChevronRight } from 'lucide-svelte';

	export interface BreadcrumbItem {
		label: string;
		href?: string;
	}

	interface Props {
		items: BreadcrumbItem[];
	}

	let { items }: Props = $props();
</script>

<nav aria-label="Breadcrumb">
	<ol class="flex items-center gap-1.5 text-sm font-mono">
		{#each items as item, i}
			{#if i > 0}
				<li aria-hidden="true" class="text-chrome-600">
					<ChevronRight size={14} />
				</li>
			{/if}
			<li>
				{#if item.href && i < items.length - 1}
					<a href={item.href} class="text-chrome-400 hover:text-chrome-200 transition-colors">
						{item.label}
					</a>
				{:else}
					<span class="text-chrome-200">{item.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
