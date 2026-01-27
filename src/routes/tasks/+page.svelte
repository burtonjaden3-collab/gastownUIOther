<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/work?tab=queue', { replaceState: true });
	});
</script>

<p class="p-4 text-chrome-500 font-mono text-sm">Redirecting to /work...</p>
