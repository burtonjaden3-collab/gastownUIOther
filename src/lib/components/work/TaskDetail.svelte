<script lang="ts">
	import { Clock, Loader2, CheckCircle2, XCircle, Tag, User, Hash, Crosshair } from 'lucide-svelte';
	import { Badge, Card } from '$lib/components/core';
	import { feedStore } from '$lib/stores/feed.svelte';
	import type { Task } from '$lib/stores/tasks.svelte';

	interface Props {
		task: Task;
		onSling?: () => void;
	}

	let { task, onSling }: Props = $props();

	const statusConfig: Record<string, { icon: typeof Clock; label: string; variant: 'chrome' | 'warning' | 'success' | 'danger' }> = {
		pending: { icon: Clock, label: 'QUEUED', variant: 'chrome' },
		in_progress: { icon: Loader2, label: 'RUNNING', variant: 'warning' },
		completed: { icon: CheckCircle2, label: 'DONE', variant: 'success' },
		blocked: { icon: XCircle, label: 'BLOCKED', variant: 'danger' },
		failed: { icon: XCircle, label: 'FAILED', variant: 'danger' }
	};

	const config = $derived(statusConfig[task.status] || statusConfig.pending);
	const canSling = $derived(task.status === 'pending' && !task.assignee);

	const recentEvents = $derived(
		feedStore.items
			.filter((e) => e.message?.includes(task.id) || e.source === task.id || e.actor === task.assignee)
			.slice(0, 5)
	);
</script>

<div class="p-4 space-y-4">
	<!-- Header -->
	<div>
		<div class="flex items-center gap-2 mb-2">
			<Badge variant={config.variant}>{config.label}</Badge>
			<span class="font-mono text-xs uppercase text-chrome-500">{task.type}</span>
		</div>
		<h2 class="font-display text-lg text-chrome-100">{task.title}</h2>
	</div>

	<!-- Description -->
	{#if task.description}
		<Card title="Description">
			<p class="text-sm text-chrome-300 whitespace-pre-wrap">{task.description}</p>
		</Card>
	{/if}

	<!-- Metadata -->
	<Card title="Details">
		<div class="space-y-2 text-sm">
			<div class="flex items-center gap-2 text-chrome-400">
				<Hash size={14} />
				<span class="font-mono">{task.id}</span>
			</div>
			<div class="flex items-center gap-2 text-chrome-400">
				<User size={14} />
				<span>{task.assignee || 'Unassigned'}</span>
			</div>
			<div class="flex items-center gap-2 text-chrome-400">
				<Clock size={14} />
				<span>Created: {task.createdAt}</span>
			</div>
			<div class="flex items-center gap-2 text-chrome-400">
				<Clock size={14} />
				<span>Updated: {task.updatedAt}</span>
			</div>
			{#if task.labels.length > 0}
				<div class="flex items-center gap-2 text-chrome-400">
					<Tag size={14} />
					<div class="flex flex-wrap gap-1">
						{#each task.labels as label}
							<Badge>{label}</Badge>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</Card>

	<!-- Recent Activity -->
	<Card title="Recent Activity">
		{#if recentEvents.length === 0}
			<p class="text-xs text-chrome-500 font-mono">No recent events for this task</p>
		{:else}
			<ul class="space-y-1 text-sm text-chrome-300">
				{#each recentEvents as event}
					<li class="flex items-center gap-2">
						<span class="text-xs text-chrome-500 font-mono">{event.timestamp}</span>
						<span class="text-rust-400 font-mono">{event.actor}</span>
						<span class="truncate">{event.message}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</Card>

	<!-- Sling hint -->
	{#if canSling}
		<div class="flex items-center gap-2 p-3 bg-flame-500/10 border border-flame-500/30 rounded-sm">
			<Crosshair size={16} class="text-flame-400" />
			<span class="text-sm text-flame-300">Ready to sling — use the Sling tab or hover action.</span>
			{#if onSling}
				<button
					class="ml-auto text-xs font-stencil uppercase text-flame-400 hover:text-flame-300 transition-colors"
					onclick={onSling}
				>
					Sling Now
				</button>
			{/if}
		</div>
	{/if}
</div>
