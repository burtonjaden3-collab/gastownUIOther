<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { convoysStore } from '$lib/stores/convoys.svelte';
	import { rigsStore } from '$lib/stores/rigs.svelte';
	import { feedStore } from '$lib/stores/feed.svelte';
	import { api } from '$lib/api/client';
	import { ConvoyDetail } from '$lib/components/convoys';
	import WorkTabs, { type WorkTab } from './WorkTabs.svelte';
	import WorkActionBar from './WorkActionBar.svelte';
	import TaskList from './TaskList.svelte';
	import TaskDetail from './TaskDetail.svelte';
	import TaskCreateForm from './TaskCreateForm.svelte';
	import SlingPanel from './SlingPanel.svelte';
	import ConvoyList from './ConvoyList.svelte';
	import ConvoyCreateForm from './ConvoyCreateForm.svelte';
	import ActivityLog from './ActivityLog.svelte';

	// Tab state from URL
	const activeTab = $derived(
		($page.url.searchParams.get('tab') as WorkTab) || 'queue'
	);

	// Action from URL (e.g., ?action=new opens create form)
	const urlAction = $derived($page.url.searchParams.get('action'));

	// Local UI state
	let selectedTaskId = $state<string | null>(null);
	let selectedConvoyId = $state<string | null>(null);
	let checkedIds = $state(new Set<string>());
	let showCreateTask = $state(false);
	let showCreateConvoy = $state(false);
	let slingPreSelectedTaskId = $state<string | null>(null);
	let closeError = $state<string | null>(null);

	// Sync UI state from URL params (tab switch + action)
	let prevTab = $state<WorkTab>('queue');
	$effect(() => {
		if (activeTab !== prevTab) {
			checkedIds = new Set();
			showCreateTask = false;
			showCreateConvoy = false;
			slingPreSelectedTaskId = null;
			prevTab = activeTab;
		}
		if (urlAction === 'new' && activeTab === 'queue') {
			showCreateTask = true;
		}
	});

	// Fetch all stores on mount
	onMount(() => {
		tasksStore.fetch();
		convoysStore.fetch();
		rigsStore.fetch();
		feedStore.fetch();
	});

	function setTab(tab: WorkTab) {
		const url = new URL($page.url);
		url.searchParams.set('tab', tab);
		url.searchParams.delete('action');
		goto(url.toString(), { replaceState: true, noScroll: true });
	}

	function handleNewTask() {
		showCreateTask = true;
		showCreateConvoy = false;
		selectedTaskId = null;
	}

	function handleNewConvoy() {
		showCreateConvoy = true;
		showCreateTask = false;
		selectedTaskId = null;
		selectedConvoyId = null;
	}

	function handleClearSelection() {
		checkedIds = new Set();
	}

	function handleSelectTask(id: string) {
		selectedTaskId = selectedTaskId === id ? null : id;
		showCreateTask = false;
		showCreateConvoy = false;
	}

	function handleCheckTask(id: string, checked: boolean) {
		const next = new Set(checkedIds);
		if (checked) next.add(id); else next.delete(id);
		checkedIds = next;
	}

	function handleCheckAll(checked: boolean) {
		if (checked) {
			checkedIds = new Set(tasksStore.items.map(t => t.id));
		} else {
			checkedIds = new Set();
		}
	}

	function handleSlingTask(id: string) {
		slingPreSelectedTaskId = id;
		setTab('sling');
	}

	function handleAddToConvoy(id: string) {
		const next = new Set(checkedIds);
		next.add(id);
		checkedIds = next;
		handleNewConvoy();
	}

	function handleTaskCreated() {
		tasksStore.fetch();
		showCreateTask = false;
	}

	function handleConvoyCreated() {
		convoysStore.fetch();
		showCreateConvoy = false;
		checkedIds = new Set();
	}

	function handleSelectConvoy(id: string) {
		selectedConvoyId = selectedConvoyId === id ? null : id;
		showCreateConvoy = false;
	}

	async function handleCloseConvoy() {
		if (!selectedConvoyId) return;
		closeError = null;
		try {
			await api.closeConvoy(selectedConvoyId);
			convoysStore.fetch();
		} catch (e) {
			closeError = e instanceof Error ? e.message : 'Failed to close convoy';
		}
	}

	const selectedTask = $derived(
		selectedTaskId ? tasksStore.items.find(t => t.id === selectedTaskId) : undefined
	);

	const selectedConvoy = $derived(
		selectedConvoyId ? convoysStore.items.find(c => c.id === selectedConvoyId) : undefined
	);

	const prefillConvoyIds = $derived(
		Array.from(checkedIds)
	);

	// Right panel content for Queue tab
	type QueuePanel = 'detail' | 'create-task' | 'create-convoy' | 'none';
	const queuePanel = $derived<QueuePanel>(
		showCreateTask ? 'create-task' :
		showCreateConvoy ? 'create-convoy' :
		selectedTask ? 'detail' : 'none'
	);

	// Right panel content for Convoys tab
	type ConvoyPanel = 'detail' | 'create-convoy' | 'none';
	const convoyPanel = $derived<ConvoyPanel>(
		showCreateConvoy ? 'create-convoy' :
		selectedConvoy ? 'detail' : 'none'
	);
</script>

<div class="flex flex-col h-[calc(100vh-theme(spacing.16))]">
	<!-- Action Bar -->
	<WorkActionBar
		{activeTab}
		selectionCount={checkedIds.size}
		onNewTask={handleNewTask}
		onNewConvoy={handleNewConvoy}
		onClearSelection={handleClearSelection}
	/>

	<!-- Tabs -->
	<WorkTabs active={activeTab} onchange={setTab} />

	<!-- Tab Content -->
	<div class="flex-1 min-h-0">
		{#if activeTab === 'queue'}
			<div class="flex h-full">
				<!-- List Panel -->
				<div class="w-[420px] flex-shrink-0 border-r border-oil-700">
					<TaskList
						{selectedTaskId}
						{checkedIds}
						onSelectTask={handleSelectTask}
						onCheckTask={handleCheckTask}
						onCheckAll={handleCheckAll}
						onSlingTask={handleSlingTask}
						onAddToConvoy={handleAddToConvoy}
					/>
				</div>

				<!-- Right Panel -->
				<div class="flex-1 overflow-y-auto">
					{#if queuePanel === 'create-task'}
						<TaskCreateForm
							onclose={() => showCreateTask = false}
							oncreate={handleTaskCreated}
						/>
					{:else if queuePanel === 'create-convoy'}
						<ConvoyCreateForm
							prefillIds={prefillConvoyIds}
							onclose={() => showCreateConvoy = false}
							oncreate={handleConvoyCreated}
						/>
					{:else if queuePanel === 'detail' && selectedTask}
						<TaskDetail
							task={selectedTask}
							onSling={() => handleSlingTask(selectedTask.id)}
						/>
					{:else}
						<div class="flex flex-col items-center justify-center h-full text-chrome-500 gap-2">
							<span class="font-stencil text-sm uppercase">Select a task</span>
							<span class="text-xs text-chrome-600">Click a task to view details, or create a new one</span>
						</div>
					{/if}
				</div>
			</div>

		{:else if activeTab === 'sling'}
			<SlingPanel preSelectedTaskId={slingPreSelectedTaskId} />

		{:else if activeTab === 'convoys'}
			<div class="flex h-full">
				<!-- List Panel -->
				<div class="w-[420px] flex-shrink-0 border-r border-oil-700">
					<ConvoyList
						{selectedConvoyId}
						onSelectConvoy={handleSelectConvoy}
					/>
				</div>

				<!-- Right Panel -->
				<div class="flex-1 overflow-y-auto">
					{#if convoyPanel === 'create-convoy'}
						<ConvoyCreateForm
							onclose={() => showCreateConvoy = false}
							oncreate={handleConvoyCreated}
						/>
					{:else if convoyPanel === 'detail' && selectedConvoy}
						<div class="p-4 space-y-4">
							<ConvoyDetail {...selectedConvoy} />

							{#if selectedConvoy.status === 'open'}
								<div class="px-4">
									{#if closeError}
										<p class="text-sm text-red-400 mb-2">{closeError}</p>
									{/if}
									<button
										class="px-4 py-2 bg-red-600/20 border border-red-500 rounded-sm
											font-stencil text-xs uppercase text-red-400
											hover:bg-red-600/30 transition-colors"
										onclick={handleCloseConvoy}
									>
										Close Convoy
									</button>
								</div>
							{/if}
						</div>
					{:else}
						<div class="flex flex-col items-center justify-center h-full text-chrome-500 gap-2">
							<span class="font-stencil text-sm uppercase">Select a convoy</span>
							<span class="text-xs text-chrome-600">Click a convoy to view details, or create a new one</span>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- Activity Log -->
	<ActivityLog />
</div>
