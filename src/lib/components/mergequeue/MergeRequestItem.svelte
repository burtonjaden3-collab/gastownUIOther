<script lang="ts">
	import { GitBranch } from 'lucide-svelte';

	interface Props {
		id: string;
		branch: string;
		rig: string;
		status: 'queued' | 'processing' | 'merged' | 'conflict';
		author: string;
		title: string;
		submittedAt: string;
		class?: string;
		onclick?: () => void;
	}

	let { id, branch, rig, status, author, title, submittedAt, class: className = '', onclick }: Props = $props();

	const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
		queued: { color: 'text-chrome-400', bg: 'bg-chrome-500/10', label: 'Queued' },
		processing: { color: 'text-warning-400', bg: 'bg-warning-500/10', label: 'Processing' },
		merged: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'Merged' },
		conflict: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Conflict' }
	};

	const config = $derived(statusConfig[status] || statusConfig.queued);
</script>

<button
	class="w-full text-left p-4 rounded-sm bg-oil-800 border border-oil-700 hover:border-oil-600 transition-all {className}"
	{onclick}
>
	<div class="flex items-start justify-between">
		<div class="flex items-center gap-2 min-w-0">
			<GitBranch size={14} class="text-rust-400 flex-shrink-0" />
			<span class="font-mono text-sm text-chrome-100 truncate">{branch}</span>
		</div>
		<span class="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded {config.bg} {config.color} flex-shrink-0 ml-2">
			{config.label}
		</span>
	</div>
	{#if title && title !== branch}
		<p class="text-xs text-chrome-400 mt-1.5 truncate">{title}</p>
	{/if}
	<div class="flex items-center gap-3 mt-2 text-[10px] font-mono text-chrome-500">
		{#if rig}<span>{rig}</span>{/if}
		{#if author}<span>{author}</span>{/if}
		<span>{new Date(submittedAt).toLocaleDateString()}</span>
	</div>
</button>
