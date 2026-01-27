<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { Header, Breadcrumb } from '$lib/components/layout';
	import { Card, Badge } from '$lib/components/core';
	import { DependencyGraph } from '$lib/components/tasks';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { api } from '$lib/api/client';
	import {
		Clock,
		CheckCircle2,
		XCircle,
		Loader2,
		User,
		Tag,
		AlertTriangle
	} from 'lucide-svelte';

	type BadgeVariant = 'success' | 'default' | 'warning' | 'chrome' | 'danger' | 'rust';

	const id = $derived($page.params.id ?? '');
	const task = $derived(tasksStore.getTask(id));

	let blocks = $state<string[]>([]);
	let blockedBy = $state<string[]>([]);

	onMount(() => {
		if (tasksStore.items.length === 0) {
			tasksStore.fetch();
		}
		fetchDependencies();
	});

	async function fetchDependencies() {
		const taskId = id;
		if (!taskId) return;
		try {
			const result = await api.getWorkDetail(taskId);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const data = result.data as any;
			blocks = data?.blocks || [];
			blockedBy = data?.blockedBy || data?.blocked_by || [];
		} catch {
			// Non-fatal — dependencies just won't show
		}
	}

	const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string; variant: BadgeVariant }> = {
		pending: { icon: Clock, color: 'text-chrome-400', label: 'QUEUED', variant: 'chrome' },
		in_progress: { icon: Loader2, color: 'text-warning-400', label: 'RUNNING', variant: 'warning' },
		completed: { icon: CheckCircle2, color: 'text-green-400', label: 'COMPLETED', variant: 'success' },
		blocked: { icon: XCircle, color: 'text-red-400', label: 'BLOCKED', variant: 'danger' }
	};

	const config = $derived(statusConfig[task?.status ?? 'pending'] || statusConfig.pending);
	const StatusIcon = $derived(config.icon);
	const breadcrumbs = $derived([
		{ label: 'Dashboard', href: '/' },
		{ label: 'Work', href: '/work' },
		{ label: task?.title || id }
	]);
</script>

<svelte:head>
	<title>{task?.title || 'Task Detail'} | Gas Town</title>
</svelte:head>

<Header
	title="Task Detail"
	subtitle={id}
/>

<div class="p-6 max-w-3xl space-y-6">
	<Breadcrumb items={breadcrumbs} />

	{#if tasksStore.isLoading && !task}
		<Card>
			<div class="py-12 text-center">
				<Loader2 size={24} class="text-chrome-500 animate-spin mx-auto mb-3" />
				<p class="text-chrome-500 font-mono text-sm">Loading task...</p>
			</div>
		</Card>
	{:else if !task}
		<Card>
			<div class="py-12 text-center">
				<AlertTriangle size={24} class="text-chrome-500 mx-auto mb-3" />
				<p class="text-chrome-500 font-mono text-sm">Task not found: {id}</p>
				<a href="/work" class="text-rust-400 hover:text-rust-300 text-sm font-mono mt-2 inline-block">
					View all tasks
				</a>
			</div>
		</Card>
	{:else}
		<!-- Status & Title -->
		<Card>
			<div class="space-y-4">
				<div class="flex items-start justify-between">
					<div class="space-y-2">
						<div class="flex items-center gap-3">
							<StatusIcon size={20} class={config.color} />
							<Badge variant={config.variant}>{config.label}</Badge>
						</div>
						<h2 class="font-mono text-lg text-chrome-100">{task.title}</h2>
					</div>
					<span class="text-xs font-mono text-chrome-500 uppercase">{task.type}</span>
				</div>

				{#if task.description}
					<div class="pt-4 border-t border-oil-700">
						<p class="text-sm text-chrome-300 whitespace-pre-wrap">{task.description}</p>
					</div>
				{/if}
			</div>
		</Card>

		<!-- Dependencies -->
		<DependencyGraph taskId={id ?? ''} {blocks} {blockedBy} />

		<!-- Metadata -->
		<Card title="Details">
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-1">
					<p class="text-xs font-stencil uppercase text-chrome-500">ID</p>
					<p class="font-mono text-sm text-chrome-200">{task.id}</p>
				</div>
				<div class="space-y-1">
					<p class="text-xs font-stencil uppercase text-chrome-500">Priority</p>
					<p class="font-mono text-sm text-chrome-200">P{task.priority}</p>
				</div>
				<div class="space-y-1">
					<p class="text-xs font-stencil uppercase text-chrome-500">Created</p>
					<p class="font-mono text-sm text-chrome-200">
						{new Date(task.createdAt).toLocaleString()}
					</p>
				</div>
				<div class="space-y-1">
					<p class="text-xs font-stencil uppercase text-chrome-500">Updated</p>
					<p class="font-mono text-sm text-chrome-200">
						{new Date(task.updatedAt).toLocaleString()}
					</p>
				</div>
				{#if task.assignee}
					<div class="space-y-1">
						<p class="text-xs font-stencil uppercase text-chrome-500">Assignee</p>
						<div class="flex items-center gap-2">
							<User size={14} class="text-rust-400" />
							<p class="font-mono text-sm text-rust-400">{task.assignee}</p>
						</div>
					</div>
				{/if}
				{#if task.labels && task.labels.length > 0}
					<div class="space-y-1">
						<p class="text-xs font-stencil uppercase text-chrome-500">Labels</p>
						<div class="flex items-center gap-2 flex-wrap">
							<Tag size={14} class="text-chrome-500" />
							{#each task.labels as label}
								<Badge variant="chrome">{label}</Badge>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</Card>
	{/if}
</div>
