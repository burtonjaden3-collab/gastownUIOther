<script lang="ts">
	import { GitBranch, User, Clock, AlertTriangle, CheckCircle2, Boxes } from 'lucide-svelte';

	interface Props {
		id: string;
		branch: string;
		rig: string;
		status: 'queued' | 'processing' | 'merged' | 'conflict';
		author: string;
		title: string;
		submittedAt: string;
		mergedAt?: string;
		conflictReason?: string;
	}

	let { id, branch, rig, status, author, title, submittedAt, mergedAt, conflictReason }: Props = $props();

	const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string }> = {
		queued: { color: 'text-chrome-400', icon: Clock, label: 'Queued' },
		processing: { color: 'text-warning-400', icon: Clock, label: 'Processing' },
		merged: { color: 'text-green-400', icon: CheckCircle2, label: 'Merged' },
		conflict: { color: 'text-red-400', icon: AlertTriangle, label: 'Conflict' }
	};

	const config = $derived(statusConfig[status] || statusConfig.queued);
	const StatusIcon = $derived(config.icon);
</script>

<div class="space-y-6">
	<div class="flex items-center gap-3">
		<StatusIcon size={20} class={config.color} />
		<div>
			<h2 class="font-mono text-lg text-chrome-100">{branch}</h2>
			<span class="text-xs font-mono uppercase {config.color}">{config.label}</span>
		</div>
	</div>

	{#if title && title !== branch}
		<p class="text-sm text-chrome-300">{title}</p>
	{/if}

	<div class="grid grid-cols-2 gap-4 p-4 rounded-sm bg-oil-800 border border-oil-700">
		<div class="space-y-1">
			<p class="text-[10px] font-stencil uppercase text-chrome-500">ID</p>
			<p class="font-mono text-sm text-chrome-200">{id}</p>
		</div>
		{#if author}
			<div class="space-y-1">
				<p class="text-[10px] font-stencil uppercase text-chrome-500">Author</p>
				<div class="flex items-center gap-1.5">
					<User size={12} class="text-rust-400" />
					<p class="font-mono text-sm text-chrome-200">{author}</p>
				</div>
			</div>
		{/if}
		{#if rig}
			<div class="space-y-1">
				<p class="text-[10px] font-stencil uppercase text-chrome-500">Rig</p>
				<div class="flex items-center gap-1.5">
					<Boxes size={12} class="text-rust-400" />
					<p class="font-mono text-sm text-chrome-200">{rig}</p>
				</div>
			</div>
		{/if}
		<div class="space-y-1">
			<p class="text-[10px] font-stencil uppercase text-chrome-500">Submitted</p>
			<p class="font-mono text-sm text-chrome-200">{new Date(submittedAt).toLocaleString()}</p>
		</div>
		{#if mergedAt}
			<div class="space-y-1">
				<p class="text-[10px] font-stencil uppercase text-chrome-500">Merged</p>
				<p class="font-mono text-sm text-green-400">{new Date(mergedAt).toLocaleString()}</p>
			</div>
		{/if}
	</div>

	{#if conflictReason}
		<div class="p-4 rounded-sm bg-red-500/10 border border-red-500/30">
			<div class="flex items-center gap-2 mb-2">
				<AlertTriangle size={14} class="text-red-400" />
				<h3 class="font-stencil text-xs uppercase text-red-400">Conflict Reason</h3>
			</div>
			<p class="font-mono text-sm text-red-300">{conflictReason}</p>
		</div>
	{/if}
</div>
