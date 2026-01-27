<script lang="ts">
	import { AlertTriangle, RefreshCw } from 'lucide-svelte';
	import Button from './Button.svelte';

	interface Props {
		message: string;
		onRetry?: () => void;
		class?: string;
	}

	let { message, onRetry, class: className = '' }: Props = $props();
</script>

<div class="mx-6 mt-4 px-4 py-3 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono flex items-center gap-2 {className}">
	<AlertTriangle size={16} class="flex-shrink-0" />
	<span class="flex-1">{message}</span>
	{#if onRetry}
		<Button variant="ghost" size="sm" onclick={onRetry}>
			<RefreshCw size={14} />
			<span>Retry</span>
		</Button>
	{/if}
</div>
