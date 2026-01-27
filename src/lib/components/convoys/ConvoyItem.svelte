<script lang="ts">
	import { Clock, CheckCircle2, Loader2, XCircle, ChevronRight, Package } from 'lucide-svelte';
	import Badge from '../core/Badge.svelte';
	import StatusLight from '../status/StatusLight.svelte';

	type ConvoyDisplayStatus = 'pending' | 'in_progress' | 'blocked' | 'completed';

	interface Props {
		id: string;
		title: string;
		displayStatus: ConvoyDisplayStatus;
		trackedCount: number;
		assignee?: string | null;
		priority?: number;
		createdAt: string;
		onclick?: () => void;
		class?: string;
	}

	let {
		id,
		title,
		displayStatus,
		trackedCount,
		assignee,
		priority = 2,
		createdAt,
		onclick,
		class: className = ''
	}: Props = $props();

	const normalizedStatus = $derived(
		displayStatus === 'in_progress' ? 'running' :
		displayStatus === 'blocked' ? 'failed' : displayStatus
	);

	const statusConfig: Record<string, { icon: typeof Clock, color: string, label: string }> = {
		pending: { icon: Clock, color: 'text-chrome-400', label: 'OPEN' },
		running: { icon: Loader2, color: 'text-warning-400', label: 'ACTIVE' },
		in_progress: { icon: Loader2, color: 'text-warning-400', label: 'ACTIVE' },
		completed: { icon: CheckCircle2, color: 'text-green-400', label: 'CLOSED' },
		failed: { icon: XCircle, color: 'text-red-400', label: 'BLOCKED' },
		blocked: { icon: XCircle, color: 'text-red-400', label: 'BLOCKED' }
	};

	const config = $derived(statusConfig[displayStatus] || statusConfig.pending);

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

	const isActive = $derived(normalizedStatus === 'running');
</script>

<button
	class="w-full text-left p-4 bg-oil-900 border border-oil-700 rounded-sm
		hover:bg-oil-800 hover:border-oil-600 transition-all duration-150
		focus:outline-none focus:ring-2 focus:ring-rust-500 focus:ring-offset-2 focus:ring-offset-oil-950
		group {className}"
	{onclick}
>
	<div class="flex items-start gap-3">
		<div class="mt-0.5">
			<StatusLight status={statusToLight} />
		</div>

		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 mb-1">
				<h4 class="font-mono text-sm text-chrome-100 truncate">{title}</h4>
				<Badge variant={badgeVariant} glow={isActive}>
					{config.label}
				</Badge>
			</div>

			<div class="flex items-center gap-3 text-xs text-chrome-500">
				<span class="font-mono">{id.slice(0, 12)}</span>
				<span>•</span>
				<span class="flex items-center gap-1">
					<Package size={12} />
					<span class="font-mono">{trackedCount} tracked</span>
				</span>
				{#if assignee}
					<span>•</span>
					<span class="text-rust-400">{assignee}</span>
				{/if}
			</div>
		</div>

		<div class="flex items-center gap-2 text-chrome-500">
			<span class="text-xs font-mono">{createdAt}</span>
			<ChevronRight size={16} class="opacity-0 group-hover:opacity-100 transition-opacity" />
		</div>
	</div>
</button>
