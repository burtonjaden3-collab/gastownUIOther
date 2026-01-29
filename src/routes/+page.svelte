<script lang="ts">
	import { onMount } from 'svelte';
	import { Header } from '$lib/components/layout';
	import { Card, Button, Badge, ErrorAlert } from '$lib/components/core';
	import { AgentCard, TaskQueueItem, Gauge } from '$lib/components/status';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { agentsStore } from '$lib/stores/agents.svelte';
	import { healthStore } from '$lib/stores/health.svelte';
	import { mailStore } from '$lib/stores/mail.svelte';
	import { feedStore } from '$lib/stores/feed.svelte';
	import { FeedItem } from '$lib/components/feed';
	import { WastelandHero } from '$lib/components/wasteland';
	import {
		PlusCircle,
		Activity,
		CheckCircle2,
		Clock,
		Zap,
		ShieldAlert,
		Users,
		Mail
	} from 'lucide-svelte';

	onMount(() => {
		agentsStore.fetch();
		tasksStore.fetch();
		healthStore.fetch();
		mailStore.fetch();
		feedStore.fetch();
		const feedInterval = setInterval(() => feedStore.fetch(), 5000);
		return () => clearInterval(feedInterval);
	});

	function handleRefresh() {
		tasksStore.fetch();
		agentsStore.fetch();
		healthStore.fetch();
		mailStore.fetch();
		feedStore.fetch();
	}

	function handleToggleDetail() {
		tasksStore.cycleDetailLevel();
	}

	const taskStats = $derived(tasksStore.stats);
	const agentStats = $derived(agentsStore.stats);

	const healthStatus = $derived(healthStore.health?.overallStatus);
	const offlineAgents = $derived(agentStats.total - agentStats.online);
	const unreadMail = $derived(mailStore.unreadCount);

	const recentFeed = $derived(feedStore.items.slice(0, 10));

	const hasAlerts = $derived(
		taskStats.blocked > 0 ||
		offlineAgents > 0 ||
		(healthStatus && healthStatus !== 'healthy') ||
		unreadMail > 0
	);
</script>

<svelte:head>
	<title>Dashboard | Gas Town</title>
</svelte:head>

<Header
	title="Control Center"
	subtitle="System Overview & Task Management"
	alertCount={taskStats.blocked}
	detailLevel={tasksStore.detailLevel}
	onRefresh={handleRefresh}
	onToggleDetail={handleToggleDetail}
/>

<WastelandHero
	load={agentStats.avgLoad}
	tasks={tasksStore.items.map(t => ({
		id: t.id,
		status: t.status === 'in_progress' ? 'running' : t.status,
		type: t.type === 'code' ? 'pr' : t.type === 'data' ? 'issue' : undefined
	}))}
	agents={agentsStore.items.map(a => ({ name: a.name, state: a.status, assignedTask: a.currentTask }))}
/>

{#if agentsStore.error || tasksStore.error}
	<ErrorAlert message={agentsStore.error || tasksStore.error || ''} onRetry={handleRefresh} />
{/if}

<div class="p-6 space-y-6">
	<!-- Stats Row -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<Card>
			<div class="flex items-center gap-4">
				<div class="p-3 bg-rust-600/20 rounded-sm">
					<Activity size={24} class="text-rust-400" />
				</div>
				<div>
					<p class="text-2xl font-stencil text-chrome-100">{taskStats.running}</p>
					<p class="text-xs font-mono uppercase text-chrome-500">Running</p>
				</div>
			</div>
		</Card>

		<Card>
			<div class="flex items-center gap-4">
				<div class="p-3 bg-warning-600/20 rounded-sm">
					<Clock size={24} class="text-warning-400" />
				</div>
				<div>
					<p class="text-2xl font-stencil text-chrome-100">{taskStats.pending}</p>
					<p class="text-xs font-mono uppercase text-chrome-500">Queued</p>
				</div>
			</div>
		</Card>

		<Card>
			<div class="flex items-center gap-4">
				<div class="p-3 bg-green-600/20 rounded-sm">
					<CheckCircle2 size={24} class="text-green-400" />
				</div>
				<div>
					<p class="text-2xl font-stencil text-chrome-100">{taskStats.completed}</p>
					<p class="text-xs font-mono uppercase text-chrome-500">Completed</p>
				</div>
			</div>
		</Card>

		<Card>
			<div class="flex items-center gap-4">
				<div class="p-3 bg-chrome-600/20 rounded-sm">
					<Zap size={24} class="text-chrome-400" />
				</div>
				<div>
					<p class="text-2xl font-stencil text-chrome-100">{agentStats.online}/{agentStats.total}</p>
					<p class="text-xs font-mono uppercase text-chrome-500">Agents Online</p>
				</div>
			</div>
		</Card>
	</div>

	<!-- System Alerts -->
	{#if hasAlerts}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
			{#if taskStats.blocked > 0}
				<a href="/work?tab=queue" class="block">
					<Card variant="warning">
						<div class="flex items-center gap-3">
							<ShieldAlert size={18} class="text-warning-400 flex-shrink-0" />
							<div>
								<p class="font-stencil text-sm uppercase text-warning-400">{taskStats.blocked} Blocked</p>
								<p class="text-xs text-chrome-500 mt-0.5">Tasks need attention</p>
							</div>
						</div>
					</Card>
				</a>
			{/if}

			{#if offlineAgents > 0}
				<a href="/agents" class="block">
					<Card variant="danger">
						<div class="flex items-center gap-3">
							<Users size={18} class="text-red-400 flex-shrink-0" />
							<div>
								<p class="font-stencil text-sm uppercase text-red-400">{offlineAgents} Offline</p>
								<p class="text-xs text-chrome-500 mt-0.5">Agents unavailable</p>
							</div>
						</div>
					</Card>
				</a>
			{/if}

			{#if healthStatus && healthStatus !== 'healthy'}
				<a href="/health" class="block">
					<Card variant={healthStatus === 'critical' ? 'danger' : 'warning'}>
						<div class="flex items-center gap-3">
							<ShieldAlert size={18} class={healthStatus === 'critical' ? 'text-red-400' : 'text-warning-400'} />
							<div>
								<p class="font-stencil text-sm uppercase {healthStatus === 'critical' ? 'text-red-400' : 'text-warning-400'}">
									{healthStatus}
								</p>
								<p class="text-xs text-chrome-500 mt-0.5">System health</p>
							</div>
						</div>
					</Card>
				</a>
			{/if}

			{#if unreadMail > 0}
				<a href="/messages" class="block">
					<Card>
						<div class="flex items-center gap-3">
							<Mail size={18} class="text-rust-400 flex-shrink-0" />
							<div>
								<p class="font-stencil text-sm uppercase text-rust-400">{unreadMail} Unread</p>
								<p class="text-xs text-chrome-500 mt-0.5">Escalation messages</p>
							</div>
						</div>
					</Card>
				</a>
			{/if}
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Task Queue -->
		<div class="lg:col-span-2 space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="font-stencil text-lg uppercase tracking-wider text-chrome-200">
					Task Queue
				</h2>
				<a href="/work?tab=queue&action=new">
					<Button variant="primary" size="sm">
						<PlusCircle size={16} />
						<span>New Task</span>
					</Button>
				</a>
			</div>

			{#if tasksStore.items.length === 0}
				<Card>
					<div class="text-center py-8">
						<p class="text-chrome-500 font-mono">No tasks in queue</p>
						<a href="/work?tab=queue&action=new" class="text-rust-400 hover:text-rust-300 text-sm font-mono mt-2 inline-block">
							Submit your first task →
						</a>
					</div>
				</Card>
			{:else}
				<div class="space-y-2">
					{#each tasksStore.items.slice(0, 5) as task}
						<TaskQueueItem
							id={task.id}
							title={task.title}
							type={task.type}
							status={task.status}
							createdAt={new Date(task.createdAt).toLocaleTimeString()}
							assignee={task.assignee}
							onclick={() => { /* navigate to task detail */ }}
						/>
					{/each}
				</div>

				{#if tasksStore.items.length > 5}
					<a
						href="/work?tab=queue"
						class="block text-center py-2 text-sm font-mono text-rust-400 hover:text-rust-300"
					>
						View all {tasksStore.items.length} tasks →
					</a>
				{/if}
			{/if}
		</div>

		<!-- Agents Panel -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="font-stencil text-lg uppercase tracking-wider text-chrome-200">
					Agents
				</h2>
				<Badge variant={agentStats.busy > 0 ? 'warning' : 'success'} glow>
					{agentStats.busy} BUSY
				</Badge>
			</div>

			<div class="space-y-3">
				{#each agentsStore.items.slice(0, 3) as agent}
					<AgentCard
						name={agent.name}
						role={agent.role}
						status={agent.status}
						hasWork={agent.hasWork}
						unreadMail={agent.unreadMail}
					/>
				{/each}
			</div>

			{#if agentsStore.items.length > 3}
				<a
					href="/agents"
					class="block text-center py-2 text-sm font-mono text-rust-400 hover:text-rust-300"
				>
					View all {agentsStore.items.length} agents →
				</a>
			{/if}
		</div>
	</div>

	<!-- System Load -->
	<Card title="System Load" hazard={agentStats.avgLoad > 70}>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<Gauge
				value={agentStats.avgLoad}
				label="Average Load"
				showValue
				variant={agentStats.avgLoad > 80 ? 'danger' : agentStats.avgLoad > 50 ? 'warning' : 'success'}
				size="lg"
			/>
			<Gauge
				value={taskStats.running}
				max={10}
				label="Active Tasks"
				showValue
				variant="rust"
				size="lg"
			/>
			<Gauge
				value={agentStats.online}
				max={agentStats.total}
				label="Agents Online"
				showValue
				variant="success"
				size="lg"
			/>
		</div>
	</Card>

	<!-- Recent Activity -->
	<Card title="Recent Activity">
		{#if recentFeed.length === 0}
			<div class="text-center py-6">
				<Activity size={24} class="text-oil-700 mx-auto mb-2" />
				<p class="text-chrome-500 font-mono text-sm">No recent activity</p>
			</div>
		{:else}
			<div class="divide-y divide-oil-700/30 max-h-[400px] overflow-y-auto">
				{#each recentFeed as event (event.id)}
					<FeedItem
						timestamp={event.timestamp}
						type={event.type}
						source={event.source}
						actor={event.actor}
						message={event.message}
					/>
				{/each}
			</div>
		{/if}
	</Card>
</div>
