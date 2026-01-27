<script lang="ts">
	import { ChevronRight, Package } from 'lucide-svelte';
	import Badge from '$lib/components/core/Badge.svelte';
	import StatusLight from '$lib/components/status/StatusLight.svelte';
	import type { ConvoyDisplayStatus } from '$lib/stores/convoys.svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		id: string;
		title: string;
		displayStatus: ConvoyDisplayStatus;
		trackedCount: number;
		assignee?: string | null;
		createdAt: string;
		selected: boolean;
		onclick: () => void;
	}

	let { id, title, displayStatus, trackedCount, assignee, createdAt, selected, onclick }: Props = $props();

	const statusToLight = $derived(
		displayStatus === 'in_progress' ? 'busy' :
		displayStatus === 'completed' ? 'online' :
		displayStatus === 'blocked' ? 'offline' : 'pending'
	);

	const badgeVariant = $derived(
		displayStatus === 'completed' ? 'success' :
		displayStatus === 'in_progress' ? 'warning' :
		displayStatus === 'blocked' ? 'danger' : 'chrome'
	);

	const badgeLabel = $derived(
		displayStatus === 'completed' ? 'CLOSED' :
		displayStatus === 'in_progress' ? 'ACTIVE' :
		displayStatus === 'blocked' ? 'BLOCKED' : 'OPEN'
	);
</script>

<button
	class={cn(
		'w-full text-left px-4 py-3 border-b border-oil-800 transition-all group',
		selected ? 'bg-chrome-500/10 border-l-2 border-l-rust-500' : 'hover:bg-oil-800/50'
	)}
	{onclick}
>
	<div class="flex items-center gap-3">
		<StatusLight status={statusToLight} />
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 mb-0.5">
				<span class="font-mono text-sm text-chrome-100 truncate">{title}</span>
				<Badge variant={badgeVariant}>{badgeLabel}</Badge>
			</div>
			<div class="flex items-center gap-3 text-xs text-chrome-500">
				<span class="font-mono">{id.slice(0, 12)}</span>
				<span>&middot;</span>
				<Package size={10} />
				<span>{trackedCount} items</span>
				{#if assignee}
					<span>&middot;</span>
					<span class="text-rust-400">{assignee}</span>
				{/if}
			</div>
		</div>
		<ChevronRight size={16} class="text-chrome-600 opacity-0 group-hover:opacity-100 transition-opacity" />
	</div>
</button>
