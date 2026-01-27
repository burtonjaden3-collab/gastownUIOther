<script lang="ts">
	import { Wifi, WifiOff } from 'lucide-svelte';
	import type { ConnectionStatus as Status } from '$lib/api/events';

	interface Props {
		status: Status;
	}

	let { status }: Props = $props();

	const connectionConfig: Record<Status, { color: string; label: string; dot: string }> = {
		connected: {
			color: 'text-green-400',
			label: 'Online',
			dot: 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]'
		},
		connecting: {
			color: 'text-warning-400',
			label: 'Linking...',
			dot: 'bg-warning-500 animate-pulse'
		},
		disconnected: {
			color: 'text-chrome-500',
			label: 'Offline',
			dot: 'bg-chrome-600'
		},
		error: {
			color: 'text-red-400',
			label: 'Fault',
			dot: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
		}
	};

	const config = $derived(connectionConfig[status]);
</script>

<div class="p-3 border-t border-oil-700/80 bg-oil-900/80">
	<div class="flex items-center justify-center gap-2" role="status" aria-live="polite">
		<span class="w-2 h-2 rounded-full flex-shrink-0 {config.dot}"></span>
		{#if status === 'connected' || status === 'connecting'}
			<Wifi size={13} class={config.color} />
		{:else}
			<WifiOff size={13} class={config.color} />
		{/if}
		<span class="text-[11px] font-mono tracking-wide {config.color}">
			{config.label}
		</span>
	</div>
</div>
