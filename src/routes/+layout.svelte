<script lang="ts">
	import '../app.css';
	import { Sidebar } from '$lib/components/layout';
	import { eventStream } from '$lib/api/events';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	$effect(() => {
		if (browser) {
			settingsStore.hydrate();
			console.log('[Layout] Browser detected, connecting to SSE...');
			eventStream.connect();
			return () => {
				console.log('[Layout] Disconnecting from SSE...');
				eventStream.disconnect();
			};
		}
	});
</script>

<div class="flex h-screen overflow-hidden">
	<Sidebar />

	<main class="flex-1 overflow-auto bg-oil-950">
		{@render children()}
	</main>
</div>
