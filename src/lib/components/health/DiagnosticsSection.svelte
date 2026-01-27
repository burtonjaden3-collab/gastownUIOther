<script lang="ts">
	import { ChevronRight } from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';
	import { Badge } from '$lib/components/core';
	import DiagnosticsCheckRow from './DiagnosticsCheckRow.svelte';
	import type { DiagnosticSection } from '$lib/utils/parse-doctor-output';

	interface Props {
		section: DiagnosticSection;
		expanded: boolean;
		onToggle: () => void;
	}

	let { section, expanded, onToggle }: Props = $props();

	let expandedChecks = $state<Set<string>>(new Set());

	// Auto-expand details for warn/fail checks when section data changes
	$effect(() => {
		const toExpand = new Set<string>();
		for (const check of section.checks) {
			if (check.status !== 'pass' && check.details.length > 0) {
				toExpand.add(check.name);
			}
		}
		expandedChecks = toExpand;
	});

	function toggleCheck(name: string) {
		const next = new Set(expandedChecks);
		if (next.has(name)) {
			next.delete(name);
		} else {
			next.add(name);
		}
		expandedChecks = next;
	}
</script>

<div class="rounded-sm border border-oil-700 bg-oil-800/50">
	<button
		class="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-oil-700/50 transition-colors"
		onclick={onToggle}
		aria-expanded={expanded}
	>
		<ChevronRight
			size={14}
			class={cn('text-chrome-500 shrink-0 transition-transform duration-150', expanded && 'rotate-90')}
		/>

		<span class="font-stencil text-xs uppercase tracking-wider text-chrome-200">
			{section.name}
		</span>

		<div class="flex items-center gap-1.5 ml-auto">
			{#if section.failCount > 0}
				<Badge variant="danger">{section.failCount} failed</Badge>
			{/if}
			{#if section.warnCount > 0}
				<Badge variant="warning">{section.warnCount} warn</Badge>
			{/if}
			{#if section.passCount > 0}
				<Badge variant="success">{section.passCount} ok</Badge>
			{/if}
		</div>
	</button>

	{#if expanded}
		<div class="px-2 pb-2 border-t border-oil-700/50">
			{#each section.checks as check (check.name)}
				<DiagnosticsCheckRow
					{check}
					detailsExpanded={expandedChecks.has(check.name)}
					onToggleDetails={() => toggleCheck(check.name)}
				/>
			{/each}
		</div>
	{/if}
</div>
