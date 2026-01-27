# Unified Work Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace `/tasks`, `/submit`, and `/convoys` with a single `/work` page containing Queue, Sling, and Convoys tabs, a shared action bar, and a collapsible activity log.

**Architecture:** Tabbed SPA page at `/work` with query-param-driven tab state. Three tabs share a two-panel layout (list + detail). A collapsible activity log sits at the bottom. Old routes redirect. Sidebar nav simplified from 6 work-related items to 1.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, Tailwind CSS (Gas Town theme), Lucide icons, tailwind-variants

---

### Task 1: Create work component barrel and WorkTabs

**Files:**
- Create: `src/lib/components/work/index.ts`
- Create: `src/lib/components/work/WorkTabs.svelte`

**Step 1: Create WorkTabs component**

Create `src/lib/components/work/WorkTabs.svelte`:

```svelte
<script lang="ts">
	import { ListTodo, Crosshair, Truck } from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';

	export type WorkTab = 'queue' | 'sling' | 'convoys';

	interface TabDef {
		id: WorkTab;
		label: string;
		icon: typeof ListTodo;
	}

	interface Props {
		active: WorkTab;
		onchange: (tab: WorkTab) => void;
	}

	let { active, onchange }: Props = $props();

	const tabs: TabDef[] = [
		{ id: 'queue', label: 'Queue', icon: ListTodo },
		{ id: 'sling', label: 'Sling', icon: Crosshair },
		{ id: 'convoys', label: 'Convoys', icon: Truck }
	];
</script>

<div class="flex border-b border-oil-700">
	{#each tabs as tab}
		{@const Icon = tab.icon}
		<button
			class={cn(
				'flex items-center gap-2 px-5 py-3 font-display text-sm uppercase tracking-wider transition-all',
				active === tab.id
					? 'text-rust-400 border-b-2 border-rust-500 bg-oil-900/50'
					: 'text-chrome-500 hover:text-chrome-300 hover:bg-oil-800/50'
			)}
			onclick={() => onchange(tab.id)}
		>
			<Icon size={16} />
			{tab.label}
		</button>
	{/each}
</div>
```

**Step 2: Create barrel export**

Create `src/lib/components/work/index.ts`:

```typescript
export { default as WorkTabs } from './WorkTabs.svelte';
export type { WorkTab } from './WorkTabs.svelte';
```

**Step 3: Verify build**

Run: `cd /home/jaden-burton/gt/gastownUIOther && npx svelte-check --threshold error`
Expected: No errors related to work components

**Step 4: Commit**

```bash
git add src/lib/components/work/
git commit -m "feat(work): add WorkTabs component and barrel export"
```

---

### Task 2: Create WorkActionBar

**Files:**
- Create: `src/lib/components/work/WorkActionBar.svelte`
- Modify: `src/lib/components/work/index.ts`

**Step 1: Create WorkActionBar component**

Create `src/lib/components/work/WorkActionBar.svelte`:

```svelte
<script lang="ts">
	import { PlusCircle, Truck, X } from 'lucide-svelte';
	import { Button } from '$lib/components/core';
	import type { WorkTab } from './WorkTabs.svelte';

	interface Props {
		activeTab: WorkTab;
		selectionCount: number;
		onNewTask: () => void;
		onNewConvoy: () => void;
		onClearSelection: () => void;
	}

	let { activeTab, selectionCount, onNewTask, onNewConvoy, onClearSelection }: Props = $props();

	const newTaskDisabled = $derived(activeTab === 'sling');
	const newConvoyDisabled = $derived(activeTab === 'sling');
	const showClear = $derived(selectionCount > 0 && activeTab === 'queue');
</script>

<div class="flex items-center gap-3 px-4 py-3 border-b border-chrome-800/30 bg-oil-800">
	<h1 class="font-stencil text-xl uppercase tracking-wider text-chrome-100 mr-auto">Work</h1>

	{#if showClear}
		<span class="text-xs font-mono text-chrome-400">{selectionCount} selected</span>
		<Button variant="ghost" size="sm" onclick={onClearSelection}>
			<X size={14} />
			Clear
		</Button>
	{/if}

	<Button variant="secondary" size="sm" disabled={newConvoyDisabled} onclick={onNewConvoy}>
		<Truck size={14} />
		New Convoy
	</Button>

	<Button variant="primary" size="sm" disabled={newTaskDisabled} onclick={onNewTask}>
		<PlusCircle size={14} />
		New Task
	</Button>
</div>
```

**Step 2: Update barrel export**

Add to `src/lib/components/work/index.ts`:

```typescript
export { default as WorkActionBar } from './WorkActionBar.svelte';
```

**Step 3: Verify build**

Run: `cd /home/jaden-burton/gt/gastownUIOther && npx svelte-check --threshold error`

**Step 4: Commit**

```bash
git add src/lib/components/work/
git commit -m "feat(work): add WorkActionBar with context-aware buttons"
```

---

### Task 3: Create TaskRow with checkbox and quick actions

**Files:**
- Create: `src/lib/components/work/TaskRow.svelte`
- Modify: `src/lib/components/work/index.ts`

**Step 1: Create TaskRow component**

Create `src/lib/components/work/TaskRow.svelte`:

```svelte
<script lang="ts">
	import { Clock, Loader2, CheckCircle2, XCircle, Crosshair, Truck, ChevronRight } from 'lucide-svelte';
	import Badge from '$lib/components/core/Badge.svelte';
	import StatusLight from '$lib/components/status/StatusLight.svelte';
	import type { Task } from '$lib/stores/tasks.svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		task: Task;
		selected: boolean;
		checked: boolean;
		oncheck: (checked: boolean) => void;
		onclick: () => void;
		onSling: () => void;
		onAddToConvoy: () => void;
	}

	let { task, selected, checked, oncheck, onclick, onSling, onAddToConvoy }: Props = $props();

	const normalizedStatus = $derived(
		task.status === 'in_progress' ? 'running' :
		task.status === 'blocked' ? 'failed' : task.status
	);

	const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
		pending: { icon: Clock, color: 'text-chrome-400', label: 'QUEUED' },
		running: { icon: Loader2, color: 'text-warning-400', label: 'RUNNING' },
		in_progress: { icon: Loader2, color: 'text-warning-400', label: 'RUNNING' },
		completed: { icon: CheckCircle2, color: 'text-green-400', label: 'DONE' },
		failed: { icon: XCircle, color: 'text-red-400', label: 'FAILED' },
		blocked: { icon: XCircle, color: 'text-red-400', label: 'BLOCKED' }
	};

	const config = $derived(statusConfig[task.status] || statusConfig.pending);

	const statusToLight = $derived(
		normalizedStatus === 'running' ? 'busy' :
		normalizedStatus === 'completed' ? 'online' :
		normalizedStatus === 'failed' ? 'offline' : 'pending'
	);

	const badgeVariant = $derived(
		normalizedStatus === 'completed' ? 'success' :
		normalizedStatus === 'running' ? 'warning' :
		normalizedStatus === 'failed' ? 'danger' : 'chrome'
	);

	const canSling = $derived(task.status === 'pending' && !task.assignee);
</script>

<div
	class={cn(
		'flex items-center gap-3 px-4 py-3 border-b border-oil-800 transition-all group',
		selected ? 'bg-chrome-500/10 border-l-2 border-l-rust-500' : 'hover:bg-oil-800/50'
	)}
>
	<!-- Checkbox -->
	<input
		type="checkbox"
		checked={checked}
		onchange={(e) => oncheck((e.target as HTMLInputElement).checked)}
		class="w-4 h-4 rounded-sm border-oil-600 bg-oil-950 text-flame-500
			focus:ring-rust-500 focus:ring-offset-0 cursor-pointer"
	/>

	<!-- Status Light -->
	<StatusLight status={statusToLight} />

	<!-- Content (clickable for detail) -->
	<button class="flex-1 min-w-0 text-left" onclick={onclick}>
		<div class="flex items-center gap-2 mb-0.5">
			<span class="font-mono text-sm text-chrome-100 truncate">{task.title}</span>
			<Badge variant={badgeVariant} glow={normalizedStatus === 'running'}>
				{config.label}
			</Badge>
		</div>
		<div class="flex items-center gap-3 text-xs text-chrome-500">
			<span class="font-mono uppercase">{task.type}</span>
			<span>&middot;</span>
			<span class="font-mono">{task.id.slice(0, 8)}</span>
			{#if task.assignee}
				<span>&middot;</span>
				<span class="text-rust-400">{task.assignee}</span>
			{/if}
		</div>
	</button>

	<!-- Quick Actions (visible on hover) -->
	<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
		{#if canSling}
			<button
				class="p-1.5 rounded-sm text-chrome-500 hover:text-flame-400 hover:bg-oil-700 transition-colors"
				title="Sling to rig"
				onclick={onSling}
			>
				<Crosshair size={14} />
			</button>
		{/if}
		<button
			class="p-1.5 rounded-sm text-chrome-500 hover:text-chrome-200 hover:bg-oil-700 transition-colors"
			title="Add to convoy"
			onclick={onAddToConvoy}
		>
			<Truck size={14} />
		</button>
	</div>

	<!-- Arrow -->
	<ChevronRight size={16} class="text-chrome-600 opacity-0 group-hover:opacity-100 transition-opacity" />
</div>
```

**Step 2: Update barrel export**

Add to `src/lib/components/work/index.ts`:

```typescript
export { default as TaskRow } from './TaskRow.svelte';
```

**Step 3: Verify build**

Run: `cd /home/jaden-burton/gt/gastownUIOther && npx svelte-check --threshold error`

**Step 4: Commit**

```bash
git add src/lib/components/work/
git commit -m "feat(work): add TaskRow with checkbox, quick actions, and status display"
```

---

### Task 4: Create TaskList with filters and stats bar

**Files:**
- Create: `src/lib/components/work/TaskList.svelte`
- Modify: `src/lib/components/work/index.ts`

**Step 1: Create TaskList component**

Create `src/lib/components/work/TaskList.svelte`:

```svelte
<script lang="ts">
	import { tasksStore, type TaskStatus, type Task } from '$lib/stores/tasks.svelte';
	import TaskRow from './TaskRow.svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		selectedTaskId: string | null;
		checkedIds: Set<string>;
		onSelectTask: (id: string) => void;
		onCheckTask: (id: string, checked: boolean) => void;
		onCheckAll: (checked: boolean) => void;
		onSlingTask: (id: string) => void;
		onAddToConvoy: (id: string) => void;
	}

	let { selectedTaskId, checkedIds, onSelectTask, onCheckTask, onCheckAll, onSlingTask, onAddToConvoy }: Props = $props();

	let filter = $state<TaskStatus | 'all'>('all');

	const filteredTasks = $derived(
		filter === 'all'
			? tasksStore.items
			: tasksStore.items.filter(t => t.status === filter)
	);

	const stats = $derived(tasksStore.stats);

	const allVisibleChecked = $derived(
		filteredTasks.length > 0 && filteredTasks.every(t => checkedIds.has(t.id))
	);

	const filters: { value: TaskStatus | 'all'; label: string; count: number }[] = $derived([
		{ value: 'all', label: 'All', count: tasksStore.items.length },
		{ value: 'pending', label: 'Pending', count: stats.pending },
		{ value: 'in_progress', label: 'Running', count: stats.inProgress },
		{ value: 'completed', label: 'Done', count: stats.completed },
		{ value: 'blocked', label: 'Blocked', count: stats.blocked }
	]);
</script>

<div class="flex flex-col h-full">
	<!-- Stats Bar -->
	<div class="flex items-center gap-2 px-4 py-2 border-b border-oil-800 bg-oil-900/50 overflow-x-auto">
		{#each filters as f}
			<button
				class={cn(
					'px-3 py-1.5 rounded-sm font-mono text-xs uppercase whitespace-nowrap transition-all',
					filter === f.value
						? 'bg-rust-600/20 text-rust-400 border border-rust-500'
						: 'bg-oil-800 text-chrome-400 border border-oil-700 hover:border-oil-600'
				)}
				onclick={() => filter = f.value}
			>
				{f.label} <span class="ml-1 text-chrome-500">({f.count})</span>
			</button>
		{/each}
	</div>

	<!-- Select All Header -->
	<div class="flex items-center gap-3 px-4 py-2 border-b border-oil-800 bg-oil-900/30">
		<input
			type="checkbox"
			checked={allVisibleChecked}
			onchange={(e) => onCheckAll((e.target as HTMLInputElement).checked)}
			class="w-4 h-4 rounded-sm border-oil-600 bg-oil-950 text-flame-500
				focus:ring-rust-500 focus:ring-offset-0 cursor-pointer"
		/>
		<span class="text-xs text-chrome-500 font-mono">
			{filteredTasks.length} {filter === 'all' ? 'tasks' : filter}
		</span>
	</div>

	<!-- Task List -->
	<div class="flex-1 overflow-y-auto">
		{#if tasksStore.isLoading}
			<div class="flex items-center justify-center py-12 text-chrome-500">
				<span class="font-mono text-sm">Loading tasks...</span>
			</div>
		{:else if filteredTasks.length === 0}
			<div class="flex flex-col items-center justify-center py-12 text-chrome-500 gap-2">
				<span class="font-mono text-sm">No tasks found</span>
				<span class="text-xs text-chrome-600">
					{filter !== 'all' ? 'Try a different filter' : 'Create a new task to get started'}
				</span>
			</div>
		{:else}
			{#each filteredTasks as task (task.id)}
				<TaskRow
					{task}
					selected={selectedTaskId === task.id}
					checked={checkedIds.has(task.id)}
					oncheck={(checked) => onCheckTask(task.id, checked)}
					onclick={() => onSelectTask(task.id)}
					onSling={() => onSlingTask(task.id)}
					onAddToConvoy={() => onAddToConvoy(task.id)}
				/>
			{/each}
		{/if}
	</div>
</div>
```

**Step 2: Update barrel export**

Add to `src/lib/components/work/index.ts`:

```typescript
export { default as TaskList } from './TaskList.svelte';
```

**Step 3: Verify build**

Run: `cd /home/jaden-burton/gt/gastownUIOther && npx svelte-check --threshold error`

**Step 4: Commit**

```bash
git add src/lib/components/work/
git commit -m "feat(work): add TaskList with status filters, stats bar, and bulk selection"
```

---

### Task 5: Create TaskDetail and TaskCreateForm panels

**Files:**
- Create: `src/lib/components/work/TaskDetail.svelte`
- Create: `src/lib/components/work/TaskCreateForm.svelte`
- Modify: `src/lib/components/work/index.ts`

**Step 1: Create TaskDetail component**

Create `src/lib/components/work/TaskDetail.svelte`:

```svelte
<script lang="ts">
	import { Clock, Loader2, CheckCircle2, XCircle, Tag, User, Hash, Crosshair } from 'lucide-svelte';
	import { Badge, Card } from '$lib/components/core';
	import type { Task } from '$lib/stores/tasks.svelte';

	interface Props {
		task: Task;
		onSling?: () => void;
	}

	let { task, onSling }: Props = $props();

	const statusConfig: Record<string, { icon: typeof Clock; label: string; variant: 'chrome' | 'warning' | 'success' | 'danger' }> = {
		pending: { icon: Clock, label: 'QUEUED', variant: 'chrome' },
		in_progress: { icon: Loader2, label: 'RUNNING', variant: 'warning' },
		completed: { icon: CheckCircle2, label: 'DONE', variant: 'success' },
		blocked: { icon: XCircle, label: 'BLOCKED', variant: 'danger' },
		failed: { icon: XCircle, label: 'FAILED', variant: 'danger' }
	};

	const config = $derived(statusConfig[task.status] || statusConfig.pending);
	const canSling = $derived(task.status === 'pending' && !task.assignee);
</script>

<div class="p-4 space-y-4">
	<!-- Header -->
	<div>
		<div class="flex items-center gap-2 mb-2">
			<Badge variant={config.variant}>{config.label}</Badge>
			<span class="font-mono text-xs uppercase text-chrome-500">{task.type}</span>
		</div>
		<h2 class="font-display text-lg text-chrome-100">{task.title}</h2>
	</div>

	<!-- Description -->
	{#if task.description}
		<Card title="Description">
			<p class="text-sm text-chrome-300 whitespace-pre-wrap">{task.description}</p>
		</Card>
	{/if}

	<!-- Metadata -->
	<Card title="Details">
		<div class="space-y-2 text-sm">
			<div class="flex items-center gap-2 text-chrome-400">
				<Hash size={14} />
				<span class="font-mono">{task.id}</span>
			</div>
			<div class="flex items-center gap-2 text-chrome-400">
				<User size={14} />
				<span>{task.assignee || 'Unassigned'}</span>
			</div>
			<div class="flex items-center gap-2 text-chrome-400">
				<Clock size={14} />
				<span>Created: {task.createdAt}</span>
			</div>
			<div class="flex items-center gap-2 text-chrome-400">
				<Clock size={14} />
				<span>Updated: {task.updatedAt}</span>
			</div>
			{#if task.labels.length > 0}
				<div class="flex items-center gap-2 text-chrome-400">
					<Tag size={14} />
					<div class="flex flex-wrap gap-1">
						{#each task.labels as label}
							<Badge>{label}</Badge>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</Card>

	<!-- Sling hint -->
	{#if canSling}
		<div class="flex items-center gap-2 p-3 bg-flame-500/10 border border-flame-500/30 rounded-sm">
			<Crosshair size={16} class="text-flame-400" />
			<span class="text-sm text-flame-300">Ready to sling — use the Sling tab or hover action.</span>
			{#if onSling}
				<button
					class="ml-auto text-xs font-stencil uppercase text-flame-400 hover:text-flame-300 transition-colors"
					onclick={onSling}
				>
					Sling Now
				</button>
			{/if}
		</div>
	{/if}
</div>
```

**Step 2: Create TaskCreateForm component**

Create `src/lib/components/work/TaskCreateForm.svelte`:

```svelte
<script lang="ts">
	import { Code, Database, MessageSquare, X } from 'lucide-svelte';
	import { Button, Input, Textarea } from '$lib/components/core';
	import { tasksStore, type TaskType } from '$lib/stores/tasks.svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		onclose: () => void;
		oncreate: () => void;
	}

	let { onclose, oncreate }: Props = $props();

	let title = $state('');
	let description = $state('');
	let taskType = $state<TaskType>('general');
	let errors = $state<{ title?: string; description?: string }>({});
	let submitting = $state(false);
	let submitError = $state<string | null>(null);

	const typeOptions: { value: TaskType; label: string; icon: typeof Code; hint: string }[] = [
		{ value: 'code', label: 'Code', icon: Code, hint: 'Code generation, bug fixes, refactoring' },
		{ value: 'data', label: 'Data', icon: Database, hint: 'File transformations, analysis, reports' },
		{ value: 'general', label: 'General', icon: MessageSquare, hint: 'Open-ended prompts' }
	];

	function validate(): boolean {
		errors = {};
		if (!title.trim()) errors.title = 'Task title is required';
		else if (title.length < 5) errors.title = 'Title must be at least 5 characters';

		if (!description.trim()) errors.description = 'Description is required';
		else if (description.length < 10) errors.description = 'Description must be at least 10 characters';

		return Object.keys(errors).length === 0;
	}

	async function handleSubmit() {
		if (!validate()) return;
		submitting = true;
		submitError = null;

		try {
			const task = await tasksStore.createTask({
				title: title.trim(),
				description: description.trim(),
				type: taskType
			});

			if (task) {
				oncreate();
				onclose();
			} else {
				submitError = tasksStore.error || 'Failed to create task';
			}
		} catch (e) {
			submitError = e instanceof Error ? e.message : 'Unexpected error';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="p-4 space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="font-stencil text-lg uppercase tracking-wider text-chrome-200">New Task</h2>
		<button class="p-1 text-chrome-500 hover:text-chrome-300 transition-colors" onclick={onclose}>
			<X size={18} />
		</button>
	</div>

	<!-- Task Type Selector -->
	<div class="grid grid-cols-3 gap-2">
		{#each typeOptions as opt}
			{@const Icon = opt.icon}
			<button
				class={cn(
					'flex flex-col items-center gap-1 p-3 rounded-sm border-2 transition-all',
					taskType === opt.value
						? 'border-rust-500 bg-rust-600/10 text-rust-400'
						: 'border-oil-700 bg-oil-900 text-chrome-400 hover:border-oil-600'
				)}
				onclick={() => taskType = opt.value}
			>
				<Icon size={18} />
				<span class="font-stencil text-xs uppercase">{opt.label}</span>
			</button>
		{/each}
	</div>
	<p class="text-xs text-chrome-500">{typeOptions.find(o => o.value === taskType)?.hint}</p>

	<!-- Form Fields -->
	<Input
		label="Title"
		placeholder="What needs to be done?"
		bind:value={title}
		error={errors.title}
		required
	/>

	<Textarea
		label="Description"
		placeholder="Provide details, context, and acceptance criteria..."
		bind:value={description}
		error={errors.description}
		rows={5}
		required
	/>

	<!-- Error -->
	{#if submitError}
		<p class="text-sm text-red-400">{submitError}</p>
	{/if}

	<!-- Actions -->
	<div class="flex items-center gap-3 pt-2">
		<Button variant="secondary" size="sm" onclick={onclose}>Cancel</Button>
		<Button size="sm" disabled={submitting} onclick={handleSubmit}>
			{submitting ? 'Creating...' : 'Create Task'}
		</Button>
	</div>
</div>
```

**Step 3: Update barrel export**

Add to `src/lib/components/work/index.ts`:

```typescript
export { default as TaskDetail } from './TaskDetail.svelte';
export { default as TaskCreateForm } from './TaskCreateForm.svelte';
```

**Step 4: Verify build**

Run: `cd /home/jaden-burton/gt/gastownUIOther && npx svelte-check --threshold error`

**Step 5: Commit**

```bash
git add src/lib/components/work/
git commit -m "feat(work): add TaskDetail and TaskCreateForm right-panel components"
```

---

### Task 6: Create SlingPanel with task picker and target picker

**Files:**
- Create: `src/lib/components/work/SlingPanel.svelte`
- Create: `src/lib/components/work/SlingTargetPicker.svelte`
- Modify: `src/lib/components/work/index.ts`

**Step 1: Create SlingTargetPicker component**

Create `src/lib/components/work/SlingTargetPicker.svelte`:

```svelte
<script lang="ts">
	import { Crosshair, Loader2 } from 'lucide-svelte';
	import { Button, Select } from '$lib/components/core';
	import { rigsStore, type Rig } from '$lib/stores/rigs.svelte';
	import { api } from '$lib/api/client';

	interface Props {
		beadId: string;
		onSlung: () => void;
	}

	let { beadId, onSlung }: Props = $props();

	let selectedRig = $state('');
	let target = $state('auto');
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	const runningRigs = $derived(
		rigsStore.items.filter(r => r.status === 'active')
	);

	const rigOptions = $derived(
		runningRigs.map(r => ({ value: r.name, label: r.name }))
	);

	const currentRig = $derived(
		runningRigs.find(r => r.name === selectedRig)
	);

	const targetOptions = $derived(() => {
		const opts = [{ value: 'auto', label: 'Auto (spawn polecat)' }];
		if (currentRig) {
			for (const agent of currentRig.agents) {
				if (agent.role === 'crew' || agent.role === 'witness') {
					opts.push({ value: agent.name, label: `${agent.name} (${agent.role})` });
				}
			}
		}
		return opts;
	});

	const canSling = $derived(beadId.length > 0 && selectedRig.length > 0);

	async function handleSling() {
		if (!canSling) return;
		isLoading = true;
		error = null;

		try {
			await api.slingWork(selectedRig, beadId, target === 'auto' ? undefined : target);
			onSlung();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to sling work';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="space-y-4">
	{#if runningRigs.length === 0}
		<div class="p-6 text-center">
			<p class="text-chrome-400 text-sm">No rigs are running.</p>
			<p class="text-chrome-500 text-xs mt-1">Start a rig from the Fleet page first.</p>
		</div>
	{:else}
		<Select
			label="Rig"
			placeholder="Select a rig..."
			options={rigOptions}
			bind:value={selectedRig}
		/>

		{#if selectedRig}
			<Select
				label="Target"
				options={targetOptions()}
				bind:value={target}
			/>
		{/if}

		{#if error}
			<p class="text-sm text-red-400">{error}</p>
		{/if}

		<Button
			size="md"
			disabled={!canSling || isLoading}
			onclick={handleSling}
			class="w-full bg-gradient-to-r from-flame-600 to-rust-600 border-flame-700 hover:from-flame-500 hover:to-rust-500"
		>
			{#if isLoading}
				<Loader2 size={16} class="animate-spin" />
				Slinging...
			{:else}
				<Crosshair size={16} />
				Sling Work
			{/if}
		</Button>
	{/if}
</div>
```

**Step 2: Create SlingPanel component**

Create `src/lib/components/work/SlingPanel.svelte`:

```svelte
<script lang="ts">
	import { Search, Clock, Crosshair } from 'lucide-svelte';
	import Badge from '$lib/components/core/Badge.svelte';
	import { tasksStore, type Task } from '$lib/stores/tasks.svelte';
	import { rigsStore } from '$lib/stores/rigs.svelte';
	import SlingTargetPicker from './SlingTargetPicker.svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		preSelectedTaskId?: string | null;
	}

	let { preSelectedTaskId = null }: Props = $props();

	let selectedId = $state<string | null>(preSelectedTaskId);
	let searchQuery = $state('');

	// Sync pre-selection from parent
	$effect(() => {
		if (preSelectedTaskId) {
			selectedId = preSelectedTaskId;
		}
	});

	const pendingTasks = $derived(
		tasksStore.items.filter(t => t.status === 'pending' && !t.assignee)
	);

	const filteredTasks = $derived(
		searchQuery.trim()
			? pendingTasks.filter(t =>
				t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.id.toLowerCase().includes(searchQuery.toLowerCase())
			)
			: pendingTasks
	);

	const selectedTask = $derived(
		selectedId ? pendingTasks.find(t => t.id === selectedId) : undefined
	);

	function handleSlung() {
		// Task was slung - select next available
		const remaining = pendingTasks.filter(t => t.id !== selectedId);
		selectedId = remaining.length > 0 ? remaining[0].id : null;
		tasksStore.fetch();
	}
</script>

<div class="flex h-full">
	<!-- Left Column: Task Picker -->
	<div class="w-[420px] flex-shrink-0 border-r border-oil-700 flex flex-col">
		<!-- Search -->
		<div class="p-3 border-b border-oil-800">
			<div class="relative">
				<Search size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-chrome-500" />
				<input
					type="text"
					placeholder="Search tasks..."
					bind:value={searchQuery}
					class="w-full pl-9 pr-3 py-2 bg-oil-950 border border-oil-700 rounded-sm
						font-mono text-sm text-chrome-100 placeholder:text-chrome-600
						focus:outline-none focus:border-rust-500"
				/>
			</div>
			<p class="mt-2 text-xs text-chrome-500 font-mono">
				{pendingTasks.length} unassigned pending
			</p>
		</div>

		<!-- Task List -->
		<div class="flex-1 overflow-y-auto">
			{#if filteredTasks.length === 0}
				<div class="flex flex-col items-center justify-center py-12 text-chrome-500 gap-2">
					<Crosshair size={24} class="text-chrome-600" />
					<span class="font-mono text-sm">All caught up.</span>
					<span class="text-xs text-chrome-600">No unassigned tasks in the queue.</span>
				</div>
			{:else}
				{#each filteredTasks as task (task.id)}
					<button
						class={cn(
							'w-full text-left px-4 py-3 border-b border-oil-800 transition-all',
							selectedId === task.id
								? 'bg-rust-600/10 border-l-2 border-l-rust-500'
								: 'hover:bg-oil-800/50'
						)}
						onclick={() => selectedId = task.id}
					>
						<div class="flex items-center gap-2 mb-0.5">
							<span class="font-mono text-sm text-chrome-100 truncate">{task.title}</span>
							<Badge variant="chrome">{task.type.toUpperCase()}</Badge>
						</div>
						<div class="flex items-center gap-2 text-xs text-chrome-500">
							<span class="font-mono">{task.id.slice(0, 8)}</span>
							<span>&middot;</span>
							<Clock size={10} />
							<span>{task.createdAt}</span>
						</div>
					</button>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Right Column: Target Picker -->
	<div class="flex-1 overflow-y-auto p-4">
		{#if selectedTask}
			<div class="mb-4 pb-4 border-b border-oil-800">
				<p class="text-xs text-chrome-500 uppercase font-stencil tracking-wider mb-1">Selected Task</p>
				<h3 class="font-display text-base text-chrome-100">{selectedTask.title}</h3>
				<p class="text-xs text-chrome-500 font-mono mt-1">{selectedTask.id}</p>
			</div>

			<SlingTargetPicker
				beadId={selectedTask.id}
				onSlung={handleSlung}
			/>
		{:else}
			<div class="flex flex-col items-center justify-center h-full text-chrome-500 gap-2">
				<Crosshair size={32} class="text-chrome-600" />
				<span class="font-stencil text-sm uppercase">Select a task</span>
				<span class="text-xs text-chrome-600">Pick a task from the left to assign it to a rig</span>
			</div>
		{/if}
	</div>
</div>
```

**Step 3: Update barrel export**

Add to `src/lib/components/work/index.ts`:

```typescript
export { default as SlingPanel } from './SlingPanel.svelte';
export { default as SlingTargetPicker } from './SlingTargetPicker.svelte';
```

**Step 4: Verify build**

Run: `cd /home/jaden-burton/gt/gastownUIOther && npx svelte-check --threshold error`

**Step 5: Commit**

```bash
git add src/lib/components/work/
git commit -m "feat(work): add SlingPanel with task picker and target picker"
```

---

### Task 7: Create ConvoyList, ConvoyRow, and ConvoyCreateForm

**Files:**
- Create: `src/lib/components/work/ConvoyList.svelte`
- Create: `src/lib/components/work/ConvoyRow.svelte`
- Create: `src/lib/components/work/ConvoyCreateForm.svelte`
- Modify: `src/lib/components/work/index.ts`

**Step 1: Create ConvoyRow component**

Create `src/lib/components/work/ConvoyRow.svelte`:

```svelte
<script lang="ts">
	import { ChevronRight, Package } from 'lucide-svelte';
	import Badge from '$lib/components/core/Badge.svelte';
	import StatusLight from '$lib/components/status/StatusLight.svelte';
	import type { ConvoyDisplayStatus } from '$lib/stores/convoys.svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		id: string;
		title: string;
		displayStatus: ConvoyDisplayStatus;
		trackedCount: number;
		assignee?: string | null;
		createdAt: string;
		selected: boolean;
		onclick: () => void;
	}

	let { id, title, displayStatus, trackedCount, assignee, createdAt, selected, onclick }: Props = $props();

	const statusToLight = $derived(
		displayStatus === 'in_progress' ? 'busy' :
		displayStatus === 'completed' ? 'online' :
		displayStatus === 'blocked' ? 'offline' : 'pending'
	);

	const badgeVariant = $derived(
		displayStatus === 'completed' ? 'success' :
		displayStatus === 'in_progress' ? 'warning' :
		displayStatus === 'blocked' ? 'danger' : 'chrome'
	);

	const badgeLabel = $derived(
		displayStatus === 'completed' ? 'CLOSED' :
		displayStatus === 'in_progress' ? 'ACTIVE' :
		displayStatus === 'blocked' ? 'BLOCKED' : 'OPEN'
	);
</script>

<button
	class={cn(
		'w-full text-left px-4 py-3 border-b border-oil-800 transition-all group',
		selected ? 'bg-chrome-500/10 border-l-2 border-l-rust-500' : 'hover:bg-oil-800/50'
	)}
	{onclick}
>
	<div class="flex items-center gap-3">
		<StatusLight status={statusToLight} />
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 mb-0.5">
				<span class="font-mono text-sm text-chrome-100 truncate">{title}</span>
				<Badge variant={badgeVariant}>{badgeLabel}</Badge>
			</div>
			<div class="flex items-center gap-3 text-xs text-chrome-500">
				<span class="font-mono">{id.slice(0, 12)}</span>
				<span>&middot;</span>
				<Package size={10} />
				<span>{trackedCount} items</span>
				{#if assignee}
					<span>&middot;</span>
					<span class="text-rust-400">{assignee}</span>
				{/if}
			</div>
		</div>
		<ChevronRight size={16} class="text-chrome-600 opacity-0 group-hover:opacity-100 transition-opacity" />
	</div>
</button>
```

**Step 2: Create ConvoyCreateForm component**

Create `src/lib/components/work/ConvoyCreateForm.svelte`:

```svelte
<script lang="ts">
	import { X, AlertTriangle } from 'lucide-svelte';
	import { Button, Input, Textarea } from '$lib/components/core';

	interface Props {
		prefillIds?: string[];
		onclose: () => void;
		oncreate: () => void;
	}

	let { prefillIds = [], onclose, oncreate }: Props = $props();

	let title = $state('');
	let issuesText = $state(prefillIds.join('\n'));
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	const issues = $derived(
		issuesText.split('\n').map(s => s.trim()).filter(Boolean)
	);

	const isValid = $derived(title.trim().length > 0 && issues.length > 0);

	async function handleSubmit() {
		if (!isValid || isSubmitting) return;
		isSubmitting = true;
		error = null;

		try {
			const response = await fetch('/api/gastown/convoys/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: title.trim(), issues })
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || 'Failed to create convoy';
				return;
			}

			oncreate();
			onclose();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create convoy';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="p-4 space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="font-stencil text-lg uppercase tracking-wider text-chrome-200">New Convoy</h2>
		<button class="p-1 text-chrome-500 hover:text-chrome-300 transition-colors" onclick={onclose}>
			<X size={18} />
		</button>
	</div>

	<Input
		label="Title"
		placeholder="Convoy title..."
		bind:value={title}
		required
	/>

	<Textarea
		label="Issue IDs"
		placeholder="One issue ID per line..."
		bind:value={issuesText}
		hint="{issues.length} issue{issues.length !== 1 ? 's' : ''} added"
		rows={5}
		required
	/>

	{#if error}
		<div class="flex items-center gap-2 text-sm text-red-400">
			<AlertTriangle size={14} />
			{error}
		</div>
	{/if}

	<div class="flex items-center gap-3 pt-2">
		<Button variant="secondary" size="sm" onclick={onclose}>Cancel</Button>
		<Button size="sm" disabled={!isValid || isSubmitting} onclick={handleSubmit}>
			{isSubmitting ? 'Creating...' : 'Create Convoy'}
		</Button>
	</div>
</div>
```

**Step 3: Create ConvoyList component**

Create `src/lib/components/work/ConvoyList.svelte`:

```svelte
<script lang="ts">
	import { convoysStore, type ConvoyDisplayStatus } from '$lib/stores/convoys.svelte';
	import ConvoyRow from './ConvoyRow.svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		selectedConvoyId: string | null;
		onSelectConvoy: (id: string) => void;
	}

	let { selectedConvoyId, onSelectConvoy }: Props = $props();

	let filter = $state<ConvoyDisplayStatus | 'all'>('all');

	const filteredConvoys = $derived(
		filter === 'all'
			? convoysStore.items
			: convoysStore.items.filter(c => c.displayStatus === filter)
	);

	const stats = $derived(convoysStore.stats);

	const totalTracked = $derived(
		convoysStore.items.reduce((sum, c) => sum + c.trackedCount, 0)
	);

	const filters: { value: ConvoyDisplayStatus | 'all'; label: string; count: number }[] = $derived([
		{ value: 'all', label: 'All', count: convoysStore.items.length },
		{ value: 'pending', label: 'Open', count: stats.pending },
		{ value: 'in_progress', label: 'Active', count: stats.inProgress },
		{ value: 'blocked', label: 'Blocked', count: stats.blocked },
		{ value: 'completed', label: 'Closed', count: stats.completed }
	]);
</script>

<div class="flex flex-col h-full">
	<!-- Stats Bar -->
	<div class="flex items-center gap-2 px-4 py-2 border-b border-oil-800 bg-oil-900/50 overflow-x-auto">
		{#each filters as f}
			<button
				class={cn(
					'px-3 py-1.5 rounded-sm font-mono text-xs uppercase whitespace-nowrap transition-all',
					filter === f.value
						? 'bg-rust-600/20 text-rust-400 border border-rust-500'
						: 'bg-oil-800 text-chrome-400 border border-oil-700 hover:border-oil-600'
				)}
				onclick={() => filter = f.value}
			>
				{f.label} <span class="ml-1 text-chrome-500">({f.count})</span>
			</button>
		{/each}
	</div>

	<!-- Summary -->
	<div class="px-4 py-2 border-b border-oil-800 bg-oil-900/30">
		<span class="text-xs text-chrome-500 font-mono">
			{convoysStore.items.length} convoys &middot; {totalTracked} tracked items
		</span>
	</div>

	<!-- Convoy List -->
	<div class="flex-1 overflow-y-auto">
		{#if filteredConvoys.length === 0}
			<div class="flex flex-col items-center justify-center py-12 text-chrome-500 gap-2">
				<span class="font-mono text-sm">No convoys found</span>
				<span class="text-xs text-chrome-600">
					{filter !== 'all' ? 'Try a different filter' : 'Create a convoy to group related work'}
				</span>
			</div>
		{:else}
			{#each filteredConvoys as convoy (convoy.id)}
				<ConvoyRow
					id={convoy.id}
					title={convoy.title}
					displayStatus={convoy.displayStatus}
					trackedCount={convoy.trackedCount}
					assignee={convoy.assignee}
					createdAt={convoy.createdAt}
					selected={selectedConvoyId === convoy.id}
					onclick={() => onSelectConvoy(convoy.id)}
				/>
			{/each}
		{/if}
	</div>
</div>
```

**Step 4: Update barrel export**

Add to `src/lib/components/work/index.ts`:

```typescript
export { default as ConvoyList } from './ConvoyList.svelte';
export { default as ConvoyRow } from './ConvoyRow.svelte';
export { default as ConvoyCreateForm } from './ConvoyCreateForm.svelte';
```

**Step 5: Verify build**

Run: `cd /home/jaden-burton/gt/gastownUIOther && npx svelte-check --threshold error`

**Step 6: Commit**

```bash
git add src/lib/components/work/
git commit -m "feat(work): add ConvoyList, ConvoyRow, and ConvoyCreateForm components"
```

---

### Task 8: Create ActivityLog collapsible panel

**Files:**
- Create: `src/lib/components/work/ActivityLog.svelte`
- Modify: `src/lib/components/work/index.ts`

**Step 1: Create ActivityLog component**

Create `src/lib/components/work/ActivityLog.svelte`:

```svelte
<script lang="ts">
	import { ChevronDown, ChevronUp, Activity } from 'lucide-svelte';
	import { feedStore } from '$lib/stores/feed.svelte';
	import { cn } from '$lib/utils/cn';

	let expanded = $state(false);

	const workEvents = $derived(
		feedStore.items
			.filter(e =>
				e.type === 'task_created' || e.type === 'task_updated' ||
				e.type === 'sling' || e.type === 'spawn' ||
				e.type === 'convoy_created' || e.type === 'convoy_closed' ||
				e.type === 'task_completed' || e.type === 'task_assigned'
			)
			.slice(0, 10)
	);

	function relativeTime(ts: string): string {
		try {
			const now = Date.now();
			const then = new Date(ts).getTime();
			const diff = Math.floor((now - then) / 1000);
			if (diff < 60) return `${diff}s ago`;
			if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
			if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
			return `${Math.floor(diff / 86400)}d ago`;
		} catch {
			return ts;
		}
	}
</script>

<div class="border-t border-chrome-800/30 bg-oil-900">
	<!-- Toggle Bar -->
	<button
		class="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-oil-800/50 transition-colors"
		onclick={() => expanded = !expanded}
	>
		<Activity size={14} class="text-chrome-500" />
		<span class="font-stencil text-xs uppercase tracking-wider text-chrome-400">Activity Log</span>
		<span class="text-xs font-mono text-chrome-600 ml-1">({workEvents.length})</span>
		<div class="ml-auto">
			{#if expanded}
				<ChevronDown size={14} class="text-chrome-500" />
			{:else}
				<ChevronUp size={14} class="text-chrome-500" />
			{/if}
		</div>
	</button>

	<!-- Events -->
	{#if expanded}
		<div class="max-h-48 overflow-y-auto border-t border-oil-800">
			{#if workEvents.length === 0}
				<p class="px-4 py-3 text-xs text-chrome-600 font-mono">No recent work activity</p>
			{:else}
				{#each workEvents as event (event.id)}
					<div class="flex items-center gap-3 px-4 py-2 border-b border-oil-800/50 text-xs">
						<span class="text-chrome-600 font-mono w-16 flex-shrink-0">{relativeTime(event.timestamp)}</span>
						<span class="text-rust-400 font-mono flex-shrink-0">{event.actor}</span>
						<span class="text-chrome-400 truncate">{event.message}</span>
					</div>
				{/each}
			{/if}
		</div>
	{/if}
</div>
```

**Step 2: Update barrel export**

Add to `src/lib/components/work/index.ts`:

```typescript
export { default as ActivityLog } from './ActivityLog.svelte';
```

**Step 3: Verify build**

Run: `cd /home/jaden-burton/gt/gastownUIOther && npx svelte-check --threshold error`

**Step 4: Commit**

```bash
git add src/lib/components/work/
git commit -m "feat(work): add collapsible ActivityLog panel"
```

---

### Task 9: Create WorkPage orchestrator component

**Files:**
- Create: `src/lib/components/work/WorkPage.svelte`
- Modify: `src/lib/components/work/index.ts`

**Step 1: Create WorkPage component**

Create `src/lib/components/work/WorkPage.svelte`:

```svelte
<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { convoysStore } from '$lib/stores/convoys.svelte';
	import { rigsStore } from '$lib/stores/rigs.svelte';
	import { feedStore } from '$lib/stores/feed.svelte';
	import { api } from '$lib/api/client';
	import { Card } from '$lib/components/core';
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

	// Open create task form if URL has ?action=new
	$effect(() => {
		if (urlAction === 'new') {
			showCreateTask = true;
		}
	});

	// Clear selection state on tab switch
	$effect(() => {
		activeTab; // track
		checkedIds = new Set();
		showCreateTask = false;
		showCreateConvoy = false;
		slingPreSelectedTaskId = null;
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
```

**Step 2: Update barrel export**

Add to `src/lib/components/work/index.ts`:

```typescript
export { default as WorkPage } from './WorkPage.svelte';
```

**Step 3: Verify build**

Run: `cd /home/jaden-burton/gt/gastownUIOther && npx svelte-check --threshold error`

**Step 4: Commit**

```bash
git add src/lib/components/work/
git commit -m "feat(work): add WorkPage orchestrator with tab routing and panel management"
```

---

### Task 10: Create /work route and redirect old routes

**Files:**
- Create: `src/routes/work/+page.svelte`
- Create: `src/routes/work/[id]/+page.svelte`
- Modify: `src/routes/tasks/+page.svelte` (replace with redirect)
- Modify: `src/routes/submit/+page.svelte` (replace with redirect)
- Modify: `src/routes/convoys/+page.svelte` (replace with redirect)

**Step 1: Create /work route**

Create `src/routes/work/+page.svelte`:

```svelte
<script lang="ts">
	import { WorkPage } from '$lib/components/work';
</script>

<WorkPage />
```

**Step 2: Create /work/[id] detail route**

Create directory first, then the file.

Create `src/routes/work/[id]/+page.svelte` — copy the content from the existing `src/routes/tasks/[id]/+page.svelte` but update any internal links from `/tasks` to `/work`:

Read the existing file at `src/routes/tasks/[id]/+page.svelte` and copy it, replacing:
- `href="/tasks"` → `href="/work"`
- `goto('/tasks')` → `goto('/work')`

**Step 3: Replace /tasks with redirect**

Replace `src/routes/tasks/+page.svelte` with:

```svelte
<script lang="ts">
	import { redirect } from '@sveltejs/kit';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/work?tab=queue', { replaceState: true });
	});
</script>

<p class="p-4 text-chrome-500 font-mono text-sm">Redirecting to /work...</p>
```

**Step 4: Replace /submit with redirect**

Replace `src/routes/submit/+page.svelte` with:

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/work?tab=queue&action=new', { replaceState: true });
	});
</script>

<p class="p-4 text-chrome-500 font-mono text-sm">Redirecting to /work...</p>
```

**Step 5: Replace /convoys with redirect**

Replace `src/routes/convoys/+page.svelte` with:

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/work?tab=convoys', { replaceState: true });
	});
</script>

<p class="p-4 text-chrome-500 font-mono text-sm">Redirecting to /work...</p>
```

**Step 6: Verify build**

Run: `cd /home/jaden-burton/gt/gastownUIOther && npx svelte-check --threshold error`

**Step 7: Commit**

```bash
git add src/routes/work/ src/routes/tasks/+page.svelte src/routes/submit/+page.svelte src/routes/convoys/+page.svelte
git commit -m "feat(work): add /work route and redirect old /tasks, /submit, /convoys routes"
```

---

### Task 11: Update sidebar navigation

**Files:**
- Modify: `src/lib/components/layout/nav-config.ts`

**Step 1: Update nav-config.ts**

In `src/lib/components/layout/nav-config.ts`:

1. Add `Flame` import (already imported) — or use `Briefcase` from lucide. Check existing imports.
2. Replace the Command group items: remove `New Task` and `Queue`, add `Work`.
3. Remove `Convoys` from the Fleet group.

The import line already has `Flame`. Add `Briefcase` import:

Change the import to include `Briefcase`:
```typescript
import {
	LayoutDashboard,
	// Remove: PlusCircle, ListTodo, Truck
	Bot,
	Settings,
	Boxes,
	Mail,
	Activity,
	FlaskConical,
	Heart,
	GitMerge,
	Timer,
	Dog,
	Gauge,
	Wrench,
	Radio,
	Shield,
	Flame,
	Briefcase
} from 'lucide-svelte';
```

Update the `navGroups` array:

```typescript
export const navGroups: NavGroupData[] = [
	{
		id: 'command',
		label: 'Command',
		icon: Radio,
		items: [
			{ href: '/', label: 'Dashboard', icon: LayoutDashboard },
			{ href: '/work', label: 'Work', icon: Briefcase, badge: () => tasksStore.stats.pending },
			{ href: '/messages', label: 'Messages', icon: Mail, badge: () => mailStore.unreadCount }
		]
	},
	{
		id: 'fleet',
		label: 'Fleet',
		icon: Gauge,
		items: [
			{ href: '/rigs', label: 'Rigs', icon: Boxes },
			{ href: '/agents', label: 'Agents', icon: Bot }
		]
	},
	// ... operations and system groups unchanged
];
```

Also add the `tasksStore` import at the top:
```typescript
import { tasksStore } from '$lib/stores/tasks.svelte';
```

**Step 2: Verify build**

Run: `cd /home/jaden-burton/gt/gastownUIOther && npx svelte-check --threshold error`

**Step 3: Commit**

```bash
git add src/lib/components/layout/nav-config.ts
git commit -m "feat(nav): replace New Task, Queue, Convoys with unified Work entry"
```

---

### Task 12: Update CLAUDE.md codebase layout

**Files:**
- Modify: `.claude/CLAUDE.md`

**Step 1: Update codebase layout**

Update the `## Codebase Layout` section in `.claude/CLAUDE.md` to reflect:

- Add `work/` under `src/lib/components/` with the new components listed
- Update `src/routes/` to show `/work` and mark `/tasks`, `/submit`, `/convoys` as redirects
- Update sidebar description to note simplified nav

Key changes to the tree:
```
│   │   ├── work/                      # WorkPage, WorkTabs, WorkActionBar, TaskList,
│   │   │                              #   TaskRow, TaskDetail, TaskCreateForm, SlingPanel,
│   │   │                              #   SlingTargetPicker, ConvoyList, ConvoyRow,
│   │   │                              #   ConvoyCreateForm, ActivityLog
```

Routes section:
```
│       ├── work/+page.svelte              # Unified work hub (Queue, Sling, Convoys tabs)
│       ├── work/[id]/+page.svelte         # Task detail + dependency graph
│       ├── tasks/+page.svelte             # Redirect → /work?tab=queue
│       ├── submit/+page.svelte            # Redirect → /work?tab=queue&action=new
│       ├── convoys/+page.svelte           # Redirect → /work?tab=convoys
```

**Step 2: Commit**

```bash
git add .claude/CLAUDE.md
git commit -m "docs: update codebase layout for unified work page"
```

---

### Task 13: Smoke test the full flow

**Step 1: Start dev server**

Run: `cd /home/jaden-burton/gt/gastownUIOther && npm run dev`

**Step 2: Verify in browser**

Open Firefox and check:

1. `/work` loads with Queue tab active
2. Queue tab shows task list with filters and stats
3. Click a task → right panel shows detail
4. Click "+ New Task" → right panel shows create form
5. Switch to Sling tab → two-column layout with task picker and target picker
6. Switch to Convoys tab → convoy list with detail panel
7. Click "+ New Convoy" → create form in right panel
8. Activity log at bottom toggles open/closed
9. Sidebar shows "Work" entry instead of "New Task", "Queue", "Convoys"
10. `/tasks` redirects to `/work?tab=queue`
11. `/submit` redirects to `/work?tab=queue&action=new`
12. `/convoys` redirects to `/work?tab=convoys`

**Step 3: Fix any issues found during testing**

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(work): address issues found during smoke testing"
```
