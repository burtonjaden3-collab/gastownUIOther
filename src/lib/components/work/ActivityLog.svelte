<script lang="ts">
	import { ChevronDown, ChevronUp, Activity } from 'lucide-svelte';
	import { feedStore } from '$lib/stores/feed.svelte';

	let expanded = $state(false);

	const workEvents = $derived(
		feedStore.items
			.filter(e =>
				e.type === 'task_created' || e.type === 'task_updated' ||
				e.type === 'sling' || e.type === 'spawn' ||
				e.type === 'convoy_created' || e.type === 'convoy_closed' ||
				e.type === 'task_completed' || e.type === 'task_assigned'
			)
			.slice(0, 10)
	);

	function relativeTime(ts: string): string {
		try {
			const now = Date.now();
			const then = new Date(ts).getTime();
			const diff = Math.floor((now - then) / 1000);
			if (diff < 60) return `${diff}s ago`;
			if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
			if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
			return `${Math.floor(diff / 86400)}d ago`;
		} catch {
			return ts;
		}
	}
</script>

<div class="border-t border-chrome-800/30 bg-oil-900">
	<button
		class="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-oil-800/50 transition-colors"
		aria-expanded={expanded}
		aria-controls="activity-log-content"
		onclick={() => expanded = !expanded}
	>
		<Activity size={14} class="text-chrome-500" />
		<span class="font-stencil text-xs uppercase tracking-wider text-chrome-400">Activity Log</span>
		<span class="text-xs font-mono text-chrome-600 ml-1">({workEvents.length})</span>
		<div class="ml-auto">
			{#if expanded}
				<ChevronUp size={14} class="text-chrome-500" />
			{:else}
				<ChevronDown size={14} class="text-chrome-500" />
			{/if}
		</div>
	</button>

	{#if expanded}
		<div id="activity-log-content" class="max-h-48 overflow-y-auto border-t border-oil-800">
			{#if workEvents.length === 0}
				<p class="px-4 py-3 text-xs text-chrome-600 font-mono">No recent work activity</p>
			{:else}
				{#each workEvents as event (event.id)}
					<div class="flex items-center gap-3 px-4 py-2 border-b border-oil-800/50 text-xs">
						<span class="text-chrome-600 font-mono w-16 flex-shrink-0">{relativeTime(event.timestamp)}</span>
						<span class="text-rust-400 font-mono flex-shrink-0">{event.actor}</span>
						<span class="text-chrome-400 truncate">{event.message}</span>
					</div>
				{/each}
			{/if}
		</div>
	{/if}
</div>
