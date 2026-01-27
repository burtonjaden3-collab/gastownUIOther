<script lang="ts">
	import { Badge } from '$lib/components/core';
	import type { DiagnosticsSummary } from '$lib/utils/parse-doctor-output';

	interface Props {
		summary: DiagnosticsSummary;
	}

	let { summary }: Props = $props();
</script>

<div class="flex items-center gap-3 px-4 py-2.5 rounded-sm bg-oil-800 border border-oil-700">
	<span class="font-mono text-xs text-chrome-400">
		{summary.total} checks
	</span>
	<div class="flex items-center gap-1.5 ml-auto">
		<Badge variant="success" glow={false}>{summary.passed} passed</Badge>
		{#if summary.warnings > 0}
			<Badge variant="warning" glow>{summary.warnings} warnings</Badge>
		{/if}
		{#if summary.failures > 0}
			<Badge variant="danger" glow>{summary.failures} failed</Badge>
		{/if}
	</div>
</div>
