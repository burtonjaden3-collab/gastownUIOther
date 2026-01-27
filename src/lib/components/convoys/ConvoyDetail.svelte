<script lang="ts">
	import { Package, User, Calendar, Tag, Hash, AlertTriangle } from 'lucide-svelte';
	import Badge from '../core/Badge.svelte';
	import Card from '../core/Card.svelte';

	type ConvoyDisplayStatus = 'pending' | 'in_progress' | 'blocked' | 'completed';

	interface Props {
		id: string;
		title: string;
		description: string;
		status: 'open' | 'closed';
		displayStatus: ConvoyDisplayStatus;
		priority: number;
		assignee: string | null;
		trackedCount: number;
		createdAt: string;
		updatedAt: string;
		labels: string[];
	}

	let {
		id,
		title,
		description,
		status,
		displayStatus,
		priority,
		assignee,
		trackedCount,
		createdAt,
		updatedAt,
		labels
	}: Props = $props();

	const statusBadge = $derived(
		displayStatus === 'completed' ? { variant: 'success' as const, label: 'CLOSED' } :
		displayStatus === 'in_progress' ? { variant: 'warning' as const, label: 'ACTIVE' } :
		displayStatus === 'blocked' ? { variant: 'danger' as const, label: 'BLOCKED' } :
		{ variant: 'chrome' as const, label: 'OPEN' }
	);

	const priorityLabel = $derived(
		priority === 1 ? 'Critical' :
		priority === 2 ? 'Normal' :
		priority === 3 ? 'Low' : `P${priority}`
	);

	const priorityColor = $derived(
		priority === 1 ? 'text-red-400' :
		priority === 2 ? 'text-chrome-400' :
		'text-chrome-500'
	);
</script>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<div class="flex items-start gap-3 mb-2">
			<h2 class="font-stencil text-xl uppercase tracking-wider text-chrome-100 flex-1">
				{title}
			</h2>
			<Badge variant={statusBadge.variant} glow={displayStatus === 'in_progress'}>
				{statusBadge.label}
			</Badge>
		</div>
		<p class="text-xs font-mono text-chrome-500">{id}</p>
	</div>

	<!-- Stats Row -->
	<div class="grid grid-cols-3 gap-4">
		<Card>
			<div class="text-center">
				<div class="flex items-center justify-center gap-1.5 mb-1">
					<Package size={14} class="text-rust-400" />
					<span class="text-lg font-mono text-chrome-100">{trackedCount}</span>
				</div>
				<p class="text-xs font-mono text-chrome-500 uppercase">Tracked</p>
			</div>
		</Card>

		<Card>
			<div class="text-center">
				<div class="flex items-center justify-center gap-1.5 mb-1">
					<AlertTriangle size={14} class={priorityColor} />
					<span class="text-lg font-mono text-chrome-100">{priorityLabel}</span>
				</div>
				<p class="text-xs font-mono text-chrome-500 uppercase">Priority</p>
			</div>
		</Card>

		<Card>
			<div class="text-center">
				<div class="flex items-center justify-center gap-1.5 mb-1">
					<User size={14} class="text-rust-400" />
					<span class="text-sm font-mono text-chrome-100 truncate">
						{assignee || 'Unassigned'}
					</span>
				</div>
				<p class="text-xs font-mono text-chrome-500 uppercase">Assignee</p>
			</div>
		</Card>
	</div>

	<!-- Description -->
	{#if description}
		<Card title="Description">
			<p class="text-sm font-mono text-chrome-300 whitespace-pre-wrap leading-relaxed">
				{description}
			</p>
		</Card>
	{/if}

	<!-- Metadata -->
	<Card title="Details">
		<div class="space-y-3">
			<div class="flex items-center gap-2 text-sm">
				<Hash size={14} class="text-chrome-500" />
				<span class="font-mono text-chrome-500">ID:</span>
				<span class="font-mono text-chrome-300">{id}</span>
			</div>
			<div class="flex items-center gap-2 text-sm">
				<Calendar size={14} class="text-chrome-500" />
				<span class="font-mono text-chrome-500">Created:</span>
				<span class="font-mono text-chrome-300">{new Date(createdAt).toLocaleString()}</span>
			</div>
			<div class="flex items-center gap-2 text-sm">
				<Calendar size={14} class="text-chrome-500" />
				<span class="font-mono text-chrome-500">Updated:</span>
				<span class="font-mono text-chrome-300">{new Date(updatedAt).toLocaleString()}</span>
			</div>
			{#if labels.length > 0}
				<div class="flex items-center gap-2 text-sm">
					<Tag size={14} class="text-chrome-500" />
					<span class="font-mono text-chrome-500">Labels:</span>
					<div class="flex flex-wrap gap-1">
						{#each labels as label}
							<Badge>{label}</Badge>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</Card>
</div>
