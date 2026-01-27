<script lang="ts">
	import { Dog, Trash2, AlertTriangle } from 'lucide-svelte';

	interface Props {
		name: string;
		status: 'idle' | 'working' | 'stuck';
		currentTask?: string;
		duration?: string;
		onremove?: (name: string) => void;
	}

	let { name, status, currentTask, duration, onremove }: Props = $props();

	let confirmRemove = $state(false);

	const statusConfig: Record<string, { color: string; dot: string; label: string }> = {
		idle: { color: 'text-chrome-400', dot: 'bg-chrome-500', label: 'Idle' },
		working: { color: 'text-green-400', dot: 'bg-green-500 animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.6)]', label: 'Working' },
		stuck: { color: 'text-red-400', dot: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]', label: 'Stuck' }
	};

	const config = $derived(statusConfig[status] || statusConfig.idle);

	const displayName = $derived(name.charAt(0).toUpperCase() + name.slice(1));
</script>

<div class="p-4 rounded-sm bg-oil-800 border border-oil-700">
	<div class="flex items-start justify-between">
		<div class="flex items-center gap-3">
			<div class="w-10 h-10 rounded-sm bg-oil-900 flex items-center justify-center">
				<Dog size={20} class={config.color} />
			</div>
			<div>
				<h3 class="font-stencil text-sm uppercase tracking-wider text-chrome-100">{displayName}</h3>
				<div class="flex items-center gap-1.5 mt-0.5">
					<span class="w-2 h-2 rounded-full {config.dot}"></span>
					<span class="text-[10px] font-mono uppercase {config.color}">{config.label}</span>
				</div>
			</div>
		</div>

		{#if status === 'stuck'}
			<AlertTriangle size={16} class="text-red-400" />
		{/if}
	</div>

	{#if currentTask}
		<div class="mt-3 px-3 py-2 rounded-sm bg-oil-900">
			<p class="text-[10px] font-stencil uppercase text-chrome-500">Current Task</p>
			<p class="font-mono text-xs text-chrome-300 mt-0.5 truncate">{currentTask}</p>
		</div>
	{/if}

	{#if duration}
		<p class="mt-2 text-[10px] font-mono text-chrome-500">Duration: {duration}</p>
	{/if}

	<div class="mt-3 pt-3 border-t border-oil-700">
		{#if confirmRemove}
			<div class="flex items-center gap-2">
				<span class="text-[10px] font-mono text-warning-400">Remove {displayName}?</span>
				<button
					class="px-2 py-1 rounded-sm text-[10px] font-stencil uppercase bg-red-600 text-white hover:bg-red-500"
					onclick={() => { confirmRemove = false; onremove?.(name); }}
				>
					Yes
				</button>
				<button
					class="px-2 py-1 rounded-sm text-[10px] font-stencil uppercase text-chrome-400 hover:text-chrome-200"
					onclick={() => confirmRemove = false}
				>
					No
				</button>
			</div>
		{:else}
			<button
				class="flex items-center gap-1.5 text-[10px] font-mono text-chrome-500 hover:text-red-400 transition-colors"
				onclick={() => confirmRemove = true}
			>
				<Trash2 size={10} />
				Remove
			</button>
		{/if}
	</div>
</div>
