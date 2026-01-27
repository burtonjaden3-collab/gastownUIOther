<script lang="ts">
	import { Heart } from 'lucide-svelte';

	interface Props {
		overallStatus: 'healthy' | 'degraded' | 'critical';
		rigCount: number;
		lastCheck: string;
	}

	let { overallStatus, rigCount, lastCheck }: Props = $props();

	const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
		healthy: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'All Systems Healthy' },
		degraded: { color: 'text-warning-400', bg: 'bg-warning-500/10', border: 'border-warning-500/30', label: 'Degraded Performance' },
		critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Critical Issues Detected' }
	};

	const config = $derived(statusConfig[overallStatus]);
</script>

<div class="p-6 rounded-sm {config.bg} border {config.border}">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<div class="w-12 h-12 rounded-sm flex items-center justify-center {config.bg}">
				<Heart size={24} class={config.color} />
			</div>
			<div>
				<h2 class="font-stencil text-lg uppercase tracking-wider {config.color}">{config.label}</h2>
				<p class="text-xs font-mono text-chrome-500">{rigCount} rig(s) monitored</p>
			</div>
		</div>
		<div class="text-right">
			<p class="text-[10px] font-stencil uppercase text-chrome-500">Last Check</p>
			<p class="text-xs font-mono text-chrome-400">{new Date(lastCheck).toLocaleTimeString()}</p>
		</div>
	</div>
</div>
