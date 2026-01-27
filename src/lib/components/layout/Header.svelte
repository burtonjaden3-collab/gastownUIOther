<script lang="ts">
	import { Bell, RefreshCw, Eye, EyeOff } from 'lucide-svelte';
	import Button from '../core/Button.svelte';
	import { ConnectionStatus } from '../status';

	interface Props {
		title: string;
		subtitle?: string;
		alertCount?: number;
		detailLevel?: 'minimal' | 'normal' | 'verbose';
		onRefresh?: () => void;
		onToggleDetail?: () => void;
	}

	let {
		title,
		subtitle,
		alertCount = 0,
		detailLevel = 'normal',
		onRefresh,
		onToggleDetail
	}: Props = $props();
</script>

<header class="bg-oil-900 border-b border-oil-700 px-6 py-4">
	<div class="flex items-center justify-between">
		<!-- Title -->
		<div>
			<h1 class="font-stencil text-2xl uppercase tracking-wider text-chrome-100">
				{title}
			</h1>
			{#if subtitle}
				<p class="text-sm font-mono text-chrome-500 mt-0.5">{subtitle}</p>
			{/if}
		</div>

		<!-- Actions -->
		<div class="flex items-center gap-3">
			<!-- Connection Status -->
			<ConnectionStatus />

			<!-- Detail Toggle -->
			{#if onToggleDetail}
				<Button variant="ghost" size="sm" onclick={onToggleDetail}>
					{#if detailLevel === 'verbose'}
						<Eye size={16} />
					{:else}
						<EyeOff size={16} />
					{/if}
					<span class="text-xs">{detailLevel.toUpperCase()}</span>
				</Button>
			{/if}

			<!-- Refresh -->
			{#if onRefresh}
				<Button variant="secondary" size="sm" onclick={onRefresh}>
					<RefreshCw size={16} />
					<span>Refresh</span>
				</Button>
			{/if}

			<!-- Alerts -->
			<button
				class="relative p-2 rounded-sm bg-oil-800 border border-oil-700
					hover:bg-oil-700 transition-colors"
				aria-label="Alerts"
			>
				<Bell size={18} class="text-chrome-400" />
				{#if alertCount > 0}
					<span
						class="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center
							bg-red-500 text-white text-[10px] font-bold rounded-full
							shadow-[0_0_8px_rgba(239,68,68,0.6)]"
					>
						{alertCount > 9 ? '9+' : alertCount}
					</span>
				{/if}
			</button>
		</div>
	</div>
</header>
