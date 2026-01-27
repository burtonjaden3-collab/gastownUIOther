<script lang="ts">
	import { CircleCheck, AlertTriangle, CircleX, ChevronRight } from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';
	import type { DiagnosticCheck } from '$lib/utils/parse-doctor-output';

	interface Props {
		check: DiagnosticCheck;
		detailsExpanded: boolean;
		onToggleDetails: () => void;
	}

	let { check, detailsExpanded, onToggleDetails }: Props = $props();

	const hasDetails = $derived(check.details.length > 0);

	const statusColor = $derived(
		check.status === 'pass' ? 'text-green-400'
		: check.status === 'warn' ? 'text-warning-400'
		: 'text-red-400'
	);
</script>

<div class="group">
	<button
		class={cn(
			'w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-left transition-colors',
			hasDetails ? 'hover:bg-oil-700/50 cursor-pointer' : 'cursor-default'
		)}
		onclick={() => hasDetails && onToggleDetails()}
		disabled={!hasDetails}
		aria-label={hasDetails ? `Toggle details for ${check.name}` : undefined}
		aria-expanded={hasDetails ? detailsExpanded : undefined}
	>
		{#if hasDetails}
			<ChevronRight
				size={12}
				class={cn('text-chrome-600 shrink-0 transition-transform duration-150', detailsExpanded && 'rotate-90')}
			/>
		{:else}
			<span class="w-3 shrink-0"></span>
		{/if}

		{#if check.status === 'pass'}
			<CircleCheck size={14} class={cn(statusColor, 'shrink-0')} />
		{:else if check.status === 'warn'}
			<AlertTriangle size={14} class={cn(statusColor, 'shrink-0')} />
		{:else}
			<CircleX size={14} class={cn(statusColor, 'shrink-0')} />
		{/if}

		<span class="font-mono text-xs text-chrome-400 shrink-0">{check.name}</span>
		<span class="font-body text-xs text-chrome-300 truncate">{check.description}</span>
	</button>

	{#if detailsExpanded && hasDetails}
		<div class="ml-[3.25rem] pl-3 border-l border-oil-600 mb-1">
			{#each check.details as detail}
				<p class="font-mono text-xs text-chrome-500 py-0.5">{detail}</p>
			{/each}
		</div>
	{/if}
</div>
