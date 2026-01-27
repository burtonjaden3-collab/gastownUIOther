<script lang="ts">
	import { Bot, Activity, Clock, Cpu } from 'lucide-svelte';
	import StatusLight from './StatusLight.svelte';
	import Gauge from './Gauge.svelte';
	import Card from '../core/Card.svelte';
	import Badge from '../core/Badge.svelte';

	// Support both legacy (online/offline/busy/idle) and API (running/idle/offline) statuses
	type AgentStatus = 'online' | 'offline' | 'busy' | 'idle' | 'running';

	interface Props {
		name: string;
		role?: string;
		type?: string;
		status: AgentStatus;
		hasWork?: boolean;
		unreadMail?: number;
		currentTask?: string;
		tasksCompleted?: number;
		uptime?: string;
		load?: number;
		class?: string;
	}

	let {
		name,
		role,
		type,
		status,
		hasWork = false,
		unreadMail = 0,
		currentTask,
		tasksCompleted = 0,
		uptime = '—',
		load = 0,
		class: className = ''
	}: Props = $props();

	// Use role if type not provided (API uses role)
	const displayType = $derived(type || role || 'agent');

	// Normalize status for display
	// 'running' only means 'busy' if the agent actually has work
	const normalizedStatus = $derived(
		status === 'running' ? (hasWork ? 'busy' : 'online') :
		status === 'idle' ? 'idle' :
		status === 'offline' ? 'offline' : status
	);

	const statusLabels: Record<string, string> = {
		online: 'ONLINE',
		offline: 'OFFLINE',
		busy: 'WORKING',
		running: 'WORKING',
		idle: 'STANDBY'
	};

	const badgeVariant = $derived(
		normalizedStatus === 'online' ? 'success' :
		normalizedStatus === 'busy' ? 'warning' :
		normalizedStatus === 'offline' ? 'danger' : 'chrome'
	);

	const isBusy = $derived(normalizedStatus === 'busy');
</script>

<Card class={className} hazard={isBusy}>
	{#snippet headerContent()}
		<div class="flex items-center gap-3">
			<div class="p-2 bg-oil-700 rounded-sm">
				<Bot size={20} class="text-rust-400" />
			</div>
			<div class="flex-1 min-w-0">
				<h3 class="font-stencil text-lg uppercase tracking-wider text-chrome-100 truncate">
					{name}
				</h3>
				<p class="text-xs text-chrome-500 font-mono uppercase">{displayType}</p>
			</div>
			<div class="flex items-center gap-2">
				<StatusLight status={normalizedStatus} size="lg" />
				<Badge variant={badgeVariant} glow={isBusy}>
					{statusLabels[status] || statusLabels[normalizedStatus]}
				</Badge>
			</div>
		</div>
	{/snippet}

	<div class="space-y-4">
		{#if currentTask}
			<div class="p-3 bg-oil-950 rounded-sm border border-oil-700">
				<p class="text-xs text-chrome-500 font-stencil uppercase mb-1">{isBusy ? 'Current Task' : 'Last Task'}</p>
				<p class="text-sm text-chrome-200 font-mono truncate">{currentTask}</p>
			</div>
		{/if}

		<div class="grid grid-cols-3 gap-3">
			<div class="text-center p-2 bg-oil-800/50 rounded-sm">
				<Activity size={14} class="mx-auto mb-1 text-chrome-500" />
				<p class="text-lg font-stencil text-chrome-100">{tasksCompleted}</p>
				<p class="text-[10px] text-chrome-500 uppercase">Tasks</p>
			</div>
			<div class="text-center p-2 bg-oil-800/50 rounded-sm">
				<Clock size={14} class="mx-auto mb-1 text-chrome-500" />
				<p class="text-sm font-mono text-chrome-100">{uptime}</p>
				<p class="text-[10px] text-chrome-500 uppercase">Uptime</p>
			</div>
			<div class="text-center p-2 bg-oil-800/50 rounded-sm">
				<Cpu size={14} class="mx-auto mb-1 text-chrome-500" />
				<p class="text-lg font-stencil text-chrome-100">{load}%</p>
				<p class="text-[10px] text-chrome-500 uppercase">Load</p>
			</div>
		</div>

		<Gauge
			value={load}
			label="System Load"
			variant={load > 80 ? 'danger' : load > 50 ? 'warning' : 'success'}
		/>
	</div>
</Card>
