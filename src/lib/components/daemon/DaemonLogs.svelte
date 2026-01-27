<script lang="ts">
	import { Terminal } from 'lucide-svelte';

	interface DaemonLog {
		timestamp: string;
		message: string;
		level: string;
	}

	interface Props {
		logs: DaemonLog[];
		maxVisible?: number;
	}

	let { logs, maxVisible = 200 }: Props = $props();

	let container: HTMLDivElement | undefined = $state();
	let prevLogCount = 0;

	const visibleLogs = $derived(
		logs.length > maxVisible ? logs.slice(-maxVisible) : logs
	);

	const isTruncated = $derived(logs.length > maxVisible);

	const levelColors: Record<string, string> = {
		error: 'text-red-400',
		warn: 'text-warning-400',
		warning: 'text-warning-400',
		info: 'text-chrome-400',
		debug: 'text-chrome-600'
	};

	$effect(() => {
		const count = logs.length;
		if (container && count > prevLogCount && count > 0) {
			requestAnimationFrame(() => {
				if (container) {
					container.scrollTop = container.scrollHeight;
				}
			});
		}
		prevLogCount = count;
	});
</script>

<div class="rounded-sm bg-oil-800 border border-oil-700">
	<div class="px-4 py-3 border-b border-oil-700">
		<h3 class="font-stencil text-sm uppercase tracking-wider text-chrome-100 flex items-center gap-2">
			<Terminal size={16} class="text-rust-400" />
			Daemon Logs
		</h3>
	</div>

	{#if isTruncated}
		<div class="px-4 py-1.5 border-b border-oil-700 text-chrome-600 text-xs font-mono">
			Showing last {visibleLogs.length} of {logs.length} entries
		</div>
	{/if}

	<div
		bind:this={container}
		class="p-4 max-h-[400px] overflow-y-auto font-mono text-xs space-y-0.5 bg-oil-950"
	>
		{#if visibleLogs.length === 0}
			<p class="text-chrome-600">No logs available</p>
		{:else}
			{#each visibleLogs as log (log.timestamp + log.message)}
				<div class="flex gap-2">
					<span class="text-chrome-600 flex-shrink-0">{log.timestamp}</span>
					<span class="uppercase w-12 flex-shrink-0 {levelColors[log.level] || 'text-chrome-400'}">[{log.level}]</span>
					<span class="text-chrome-300">{log.message}</span>
				</div>
			{/each}
		{/if}
	</div>
</div>
