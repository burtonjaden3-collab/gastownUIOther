<script lang="ts">
	import { Stethoscope } from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';
	import DiagnosticsSummaryBar from './DiagnosticsSummaryBar.svelte';
	import DiagnosticsSection from './DiagnosticsSection.svelte';
	import type { DiagnosticsReport, DiagnosticFilter, DiagnosticSection as SectionType } from '$lib/utils/parse-doctor-output';

	interface Props {
		diagnostics: DiagnosticsReport | null;
	}

	let { diagnostics }: Props = $props();

	let activeFilter = $state<DiagnosticFilter>('all');
	let expandedSections = $state<Set<string>>(new Set());

	const filterOptions: { id: DiagnosticFilter; label: string }[] = [
		{ id: 'all', label: 'All' },
		{ id: 'warnings', label: 'Warnings' },
		{ id: 'failures', label: 'Failures' }
	];

	const filteredSections = $derived.by((): SectionType[] => {
		if (!diagnostics) return [];
		if (activeFilter === 'all') return diagnostics.sections;
		return diagnostics.sections
			.map((section) => {
				const checks = section.checks.filter((c) =>
					activeFilter === 'warnings' ? c.status !== 'pass' : c.status === 'fail'
				);
				if (checks.length === 0) return null;
				return {
					...section,
					checks,
					passCount: checks.filter((c) => c.status === 'pass').length,
					warnCount: checks.filter((c) => c.status === 'warn').length,
					failCount: checks.filter((c) => c.status === 'fail').length
				};
			})
			.filter((s): s is SectionType => s !== null);
	});

	// Auto-expand sections with warnings or failures when diagnostics data arrives
	$effect(() => {
		if (!diagnostics) return;
		const toExpand = new Set<string>();
		for (const section of diagnostics.sections) {
			if (section.warnCount > 0 || section.failCount > 0) {
				toExpand.add(section.name);
			}
		}
		expandedSections = toExpand;
	});

	function toggleSection(name: string) {
		const next = new Set(expandedSections);
		if (next.has(name)) {
			next.delete(name);
		} else {
			next.add(name);
		}
		expandedSections = next;
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<h3 class="font-stencil text-sm uppercase tracking-wider text-chrome-100 flex items-center gap-2">
			<Stethoscope size={16} class="text-rust-400" />
			Diagnostics
		</h3>

		{#if diagnostics}
			<div class="flex gap-1">
				{#each filterOptions as opt (opt.id)}
					<button
						class={cn(
							'px-3 py-1 font-mono text-xs rounded-sm transition-colors',
							activeFilter === opt.id
								? 'bg-oil-700 text-chrome-100'
								: 'text-chrome-500 hover:text-chrome-300 hover:bg-oil-800'
						)}
						onclick={() => activeFilter = opt.id}
					>
						{opt.label}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	{#if diagnostics}
		<DiagnosticsSummaryBar summary={diagnostics.summary} />

		<div class="space-y-2">
			{#each filteredSections as section (section.name)}
				<DiagnosticsSection
					{section}
					expanded={expandedSections.has(section.name)}
					onToggle={() => toggleSection(section.name)}
				/>
			{/each}
		</div>

		{#if filteredSections.length === 0}
			<p class="text-chrome-600 font-mono text-xs text-center py-4">
				No checks match the selected filter.
			</p>
		{/if}
	{:else}
		<div class="rounded-sm bg-oil-800 border border-oil-700 px-4 py-6 text-center">
			<p class="text-chrome-600 font-mono text-xs">
				No diagnostics data. Click "Run Diagnostics" to check.
			</p>
		</div>
	{/if}
</div>
