<script lang="ts">
	import { Clock, Loader2, CheckCircle2, XCircle, Crosshair, Truck, ChevronRight } from 'lucide-svelte';
	import Badge from '$lib/components/core/Badge.svelte';
	import StatusLight from '$lib/components/status/StatusLight.svelte';
	import type { Task } from '$lib/stores/tasks.svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		task: Task;
		selected: boolean;
		checked: boolean;
		oncheck: (checked: boolean) => void;
		onclick: () => void;
		onSling: () => void;
		onAddToConvoy: () => void;
	}

	let { task, selected, checked, oncheck, onclick, onSling, onAddToConvoy }: Props = $props();

	const normalizedStatus = $derived(
		task.status === 'in_progress' ? 'running' :
		task.status === 'blocked' ? 'failed' : task.status
	);

	const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
		pending: { icon: Clock, color: 'text-chrome-400', label: 'QUEUED' },
		running: { icon: Loader2, color: 'text-warning-400', label: 'RUNNING' },
		in_progress: { icon: Loader2, color: 'text-warning-400', label: 'RUNNING' },
		completed: { icon: CheckCircle2, color: 'text-green-400', label: 'DONE' },
		failed: { icon: XCircle, color: 'text-red-400', label: 'FAILED' },
		blocked: { icon: XCircle, color: 'text-red-400', label: 'BLOCKED' }
	};

	const config = $derived(statusConfig[task.status] || statusConfig.pending);

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

	const canSling = $derived(task.status === 'pending' && !task.assignee);
</script>

<div
	class={cn(
		'flex items-center gap-3 px-4 py-3 border-b border-oil-800 transition-all group',
		selected ? 'bg-chrome-500/10 border-l-2 border-l-rust-500' : 'hover:bg-oil-800/50'
	)}
>
	<!-- Checkbox -->
	<input
		type="checkbox"
		checked={checked}
		aria-label="Select task {task.title}"
		onchange={(e) => oncheck((e.target as HTMLInputElement).checked)}
		class="w-4 h-4 rounded-sm border-oil-600 bg-oil-950 text-flame-500
			focus:ring-rust-500 focus:ring-offset-0 cursor-pointer"
	/>

	<!-- Status Light -->
	<StatusLight status={statusToLight} />

	<!-- Content (clickable for detail) -->
	<button class="flex-1 min-w-0 text-left" onclick={onclick}>
		<div class="flex items-center gap-2 mb-0.5">
			<span class="font-mono text-sm text-chrome-100 truncate">{task.title}</span>
			<Badge variant={badgeVariant} glow={normalizedStatus === 'running'}>
				{config.label}
			</Badge>
		</div>
		<div class="flex items-center gap-3 text-xs text-chrome-500">
			<span class="font-mono uppercase">{task.type}</span>
			<span>&middot;</span>
			<span class="font-mono">{task.id.slice(0, 8)}</span>
			{#if task.assignee}
				<span>&middot;</span>
				<span class="text-rust-400">{task.assignee}</span>
			{/if}
		</div>
	</button>

	<!-- Quick Actions (visible on hover) -->
	<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
		{#if canSling}
			<button
				class="p-1.5 rounded-sm text-chrome-500 hover:text-flame-400 hover:bg-oil-700 transition-colors"
				title="Sling to rig"
				onclick={onSling}
			>
				<Crosshair size={14} />
			</button>
		{/if}
		<button
			class="p-1.5 rounded-sm text-chrome-500 hover:text-chrome-200 hover:bg-oil-700 transition-colors"
			title="Add to convoy"
			onclick={onAddToConvoy}
		>
			<Truck size={14} />
		</button>
	</div>

	<!-- Arrow -->
	<ChevronRight size={16} class="text-chrome-600 opacity-0 group-hover:opacity-100 transition-opacity" />
</div>
