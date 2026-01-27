<script lang="ts">
	import { Clock, CheckCircle2, XCircle, Loader2, ChevronRight } from 'lucide-svelte';
	import Badge from '../core/Badge.svelte';
	import StatusLight from './StatusLight.svelte';

	type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'in_progress' | 'blocked';

	interface Props {
		id: string;
		title: string;
		type: string;
		status: TaskStatus;
		createdAt: string;
		assignee?: string | null;
		progress?: number;
		onclick?: () => void;
		class?: string;
	}

	let {
		id,
		title,
		type,
		status,
		createdAt,
		assignee,
		progress,
		onclick,
		class: className = ''
	}: Props = $props();

	// Normalize status for display (API uses in_progress/blocked, components use running/failed)
	const normalizedStatus = $derived(
		status === 'in_progress' ? 'running' :
		status === 'blocked' ? 'failed' : status
	);

	const statusConfig: Record<string, { icon: typeof Clock, color: string, label: string }> = {
		pending: { icon: Clock, color: 'text-chrome-400', label: 'QUEUED' },
		running: { icon: Loader2, color: 'text-warning-400', label: 'RUNNING' },
		in_progress: { icon: Loader2, color: 'text-warning-400', label: 'RUNNING' },
		completed: { icon: CheckCircle2, color: 'text-green-400', label: 'DONE' },
		failed: { icon: XCircle, color: 'text-red-400', label: 'FAILED' },
		blocked: { icon: XCircle, color: 'text-red-400', label: 'BLOCKED' }
	};

	const config = $derived(statusConfig[status] || statusConfig.pending);
	const StatusIcon = $derived(config.icon);

	const statusToLight = $derived(
		normalizedStatus === 'running' ? 'busy' :
		normalizedStatus === 'completed' ? 'online' :
		normalizedStatus === 'failed' ? 'offline' : 'pending'
	);

	const badgeVariant = $derived(
		normalizedStatus === 'completed' ? 'success' :
		normalizedStatus === 'running' ? 'warning' :
		normalizedStatus === 'failed' ? 'danger' : 'chrome'
	);

	const isRunning = $derived(normalizedStatus === 'running');
</script>

<button
	class="w-full text-left p-4 bg-oil-900 border border-oil-700 rounded-sm
		hover:bg-oil-800 hover:border-oil-600 transition-all duration-150
		focus:outline-none focus:ring-2 focus:ring-rust-500 focus:ring-offset-2 focus:ring-offset-oil-950
		group {className}"
	{onclick}
>
	<div class="flex items-start gap-3">
		<!-- Status Icon -->
		<div class="mt-0.5">
			<StatusLight status={statusToLight} />
		</div>

		<!-- Content -->
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 mb-1">
				<h4 class="font-mono text-sm text-chrome-100 truncate">{title}</h4>
				<Badge variant={badgeVariant} glow={isRunning}>
					{config.label}
				</Badge>
			</div>

			<div class="flex items-center gap-3 text-xs text-chrome-500">
				<span class="font-mono uppercase">{type}</span>
				<span>•</span>
				<span class="font-mono">{id.slice(0, 8)}</span>
				{#if assignee}
					<span>•</span>
					<span class="text-rust-400">{assignee}</span>
				{/if}
			</div>

			{#if isRunning && progress !== undefined}
				<div class="mt-2 h-1 bg-oil-800 rounded-full overflow-hidden">
					<div
						class="h-full bg-gradient-to-r from-warning-600 to-warning-400 transition-all duration-300"
						style="width: {progress}%"
					></div>
				</div>
			{/if}
		</div>

		<!-- Timestamp & Arrow -->
		<div class="flex items-center gap-2 text-chrome-500">
			<span class="text-xs font-mono">{createdAt}</span>
			<ChevronRight size={16} class="opacity-0 group-hover:opacity-100 transition-opacity" />
		</div>
	</div>
</button>
