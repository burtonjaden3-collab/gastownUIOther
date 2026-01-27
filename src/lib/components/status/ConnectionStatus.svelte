<script lang="ts">
	import { eventStream } from '$lib/api/events';

	let status = $state(eventStream.status);

	$effect(() => {
		const unsubscribe = eventStream.subscribe((s) => {
			status = s;
		});
		return unsubscribe;
	});

	const configs = {
		connected: { color: 'bg-green-500', label: 'Live', pulse: false },
		connecting: { color: 'bg-yellow-500', label: 'Connecting', pulse: true },
		disconnected: { color: 'bg-neutral-500', label: 'Offline', pulse: false },
		error: { color: 'bg-red-500', label: 'Error', pulse: false }
	} as const;

	const statusConfig = $derived(configs[status]);
</script>

<div class="flex items-center gap-2 text-xs text-neutral-400">
	<span
		class="relative flex h-2 w-2"
		title={statusConfig.label}
	>
		{#if statusConfig.pulse}
			<span class="absolute inline-flex h-full w-full animate-ping rounded-full {statusConfig.color} opacity-75"></span>
		{/if}
		<span class="relative inline-flex h-2 w-2 rounded-full {statusConfig.color}"></span>
	</span>
	<span>{statusConfig.label}</span>
</div>
