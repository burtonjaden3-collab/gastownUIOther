# Rigs Tab Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a management page at `/rigs` with hierarchical tree navigation, context-sensitive detail panel, and actions for rig lifecycle, work slinging, and crew management.

**Architecture:** Master-detail layout with tree panel (~300px) on left showing Rig → Agent Type → Agent Instance hierarchy, and detail panel on right showing context-sensitive content based on selection. Actions execute CLI commands via ProcessSupervisor.

**Tech Stack:** SvelteKit, Svelte 5 runes, TypeScript, Tailwind CSS, lucide-svelte icons

---

## Task 1: Create Rigs Store

**Files:**
- Create: `src/lib/stores/rigs.svelte.ts`
- Modify: `src/lib/stores/index.ts`

**Step 1: Create the rigs store file**

```typescript
// src/lib/stores/rigs.svelte.ts
/**
 * Rigs Store - Svelte 5 Runes
 * Manages rig data with real API integration
 */

import { api } from '$lib/api/client';
import type { Agent } from './agents.svelte';

export type RigStatus = 'active' | 'parked' | 'docked' | 'error';

export interface Rig {
	name: string;
	status: RigStatus;
	addedAt: string;
	gitUrl: string;
	hasWitness: boolean;
	hasRefinery: boolean;
	polecatCount: number;
	crewCount: number;
	agents: Agent[];
}

interface RigsState {
	items: Rig[];
	isLoading: boolean;
	error: string | null;
	lastFetch: Date | null;
}

class RigsStore {
	#state = $state<RigsState>({
		items: [],
		isLoading: false,
		error: null,
		lastFetch: null
	});

	get items() {
		return this.#state.items;
	}

	get isLoading() {
		return this.#state.isLoading;
	}

	get error() {
		return this.#state.error;
	}

	get lastFetch() {
		return this.#state.lastFetch;
	}

	get stats() {
		const items = this.#state.items;
		return {
			total: items.length,
			active: items.filter((r) => r.status === 'active').length,
			parked: items.filter((r) => r.status === 'parked').length,
			docked: items.filter((r) => r.status === 'docked').length
		};
	}

	getRig(name: string): Rig | undefined {
		return this.#state.items.find((r) => r.name === name);
	}

	/**
	 * Fetch rigs from the API (via status endpoint)
	 */
	async fetch() {
		this.#state.isLoading = true;
		this.#state.error = null;

		try {
			const response = await api.getStatus();
			const data = response.data as { rigs?: unknown[] };
			const rigs = (data?.rigs || []) as Array<{
				name: string;
				has_witness: boolean;
				has_refinery: boolean;
				polecat_count: number;
				crew_count: number;
				agents: Agent[];
			}>;

			this.#state.items = rigs.map((r) => ({
				name: r.name,
				status: 'active' as RigStatus, // TODO: derive from agent states
				addedAt: '', // Not in status response
				gitUrl: '', // Not in status response
				hasWitness: r.has_witness,
				hasRefinery: r.has_refinery,
				polecatCount: r.polecat_count,
				crewCount: r.crew_count,
				agents: r.agents || []
			}));
			this.#state.lastFetch = new Date();
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to fetch rigs';
			console.error('Failed to fetch rigs:', e);
		} finally {
			this.#state.isLoading = false;
		}
	}

	/**
	 * Replace all items (used by SSE updates)
	 */
	setItems(rigs: Rig[]) {
		this.#state.items = rigs;
		this.#state.lastFetch = new Date();
	}
}

export const rigsStore = new RigsStore();
```

**Step 2: Export from stores index**

Add to `src/lib/stores/index.ts`:

```typescript
export { rigsStore, type Rig, type RigStatus } from './rigs.svelte';
```

**Step 3: Verify no TypeScript errors**

Run: `cd /home/jaden-burton/gt/gastown-ui && npm run check`
Expected: No errors related to rigs store

**Step 4: Commit**

```bash
git add src/lib/stores/rigs.svelte.ts src/lib/stores/index.ts
git commit -m "feat(stores): add rigs store for rig management"
```

---

## Task 2: Add Rigs to Sidebar Navigation

**Files:**
- Modify: `src/lib/components/layout/Sidebar.svelte`

**Step 1: Add Boxes icon import and nav item**

In `src/lib/components/layout/Sidebar.svelte`, update the imports:

```typescript
import {
	LayoutDashboard,
	PlusCircle,
	ListTodo,
	Bot,
	Settings,
	Fuel,
	Flame,
	Boxes
} from 'lucide-svelte';
```

**Step 2: Add Rigs nav item between Agents and Settings**

Update the `navItems` array:

```typescript
const navItems: NavItem[] = [
	{ href: '/', label: 'Dashboard', icon: LayoutDashboard },
	{ href: '/submit', label: 'New Task', icon: PlusCircle },
	{ href: '/tasks', label: 'Queue', icon: ListTodo },
	{ href: '/agents', label: 'Agents', icon: Bot },
	{ href: '/rigs', label: 'Rigs', icon: Boxes },
	{ href: '/settings', label: 'Settings', icon: Settings }
];
```

**Step 3: Verify build passes**

Run: `cd /home/jaden-burton/gt/gastown-ui && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/lib/components/layout/Sidebar.svelte
git commit -m "feat(nav): add Rigs to sidebar navigation"
```

---

## Task 3: Create Tree Node Components

**Files:**
- Create: `src/lib/components/rigs/AgentNode.svelte`
- Create: `src/lib/components/rigs/AgentTypeNode.svelte`
- Create: `src/lib/components/rigs/RigNode.svelte`

**Step 1: Create AgentNode (Level 3 - leaf node)**

```svelte
<!-- src/lib/components/rigs/AgentNode.svelte -->
<script lang="ts">
	import type { Agent } from '$lib/stores/agents.svelte';

	interface Props {
		agent: Agent;
		selected: boolean;
		onSelect: () => void;
	}

	let { agent, selected, onSelect }: Props = $props();

	const statusColors: Record<string, string> = {
		running: 'bg-warning-500',
		idle: 'bg-green-500',
		offline: 'bg-neutral-500'
	};

	const statusLabels: Record<string, string> = {
		running: 'BUSY',
		idle: 'IDLE',
		offline: 'OFFLINE'
	};
</script>

<button
	class="w-full flex items-center gap-2 px-2 py-1.5 pl-12 text-left text-sm
		transition-colors duration-100
		{selected
			? 'bg-rust-600/20 border-l-2 border-rust-500 text-chrome-100'
			: 'text-chrome-400 hover:bg-oil-800 hover:text-chrome-200 border-l-2 border-transparent'}"
	onclick={onSelect}
>
	<span class="w-2 h-2 rounded-full {statusColors[agent.status] || 'bg-neutral-500'}"></span>
	<span class="flex-1 truncate font-mono text-xs">{agent.name}</span>
	{#if agent.status === 'running'}
		<span class="text-[10px] font-mono text-warning-400 uppercase">{statusLabels[agent.status]}</span>
	{/if}
</button>
```

**Step 2: Create AgentTypeNode (Level 2 - grouping node)**

```svelte
<!-- src/lib/components/rigs/AgentTypeNode.svelte -->
<script lang="ts">
	import { ChevronRight, Bot, Eye, Factory, Users } from 'lucide-svelte';
	import type { Agent } from '$lib/stores/agents.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		type: 'polecat' | 'witness' | 'refinery' | 'crew';
		agents: Agent[];
		expanded: boolean;
		onToggle: () => void;
		children: Snippet;
	}

	let { type, agents, expanded, onToggle, children }: Props = $props();

	const icons = {
		polecat: Bot,
		witness: Eye,
		refinery: Factory,
		crew: Users
	};

	const labels = {
		polecat: 'Polecats',
		witness: 'Witness',
		refinery: 'Refinery',
		crew: 'Crews'
	};

	const Icon = $derived(icons[type] || Bot);
</script>

<div>
	<button
		class="w-full flex items-center gap-2 px-2 py-1.5 pl-6 text-left text-xs
			text-chrome-500 hover:text-chrome-300 transition-colors"
		onclick={onToggle}
		disabled={agents.length === 0}
	>
		<ChevronRight
			size={12}
			class="transition-transform duration-150 {expanded ? 'rotate-90' : ''} {agents.length === 0 ? 'opacity-30' : ''}"
		/>
		<svelte:component this={Icon} size={14} />
		<span class="font-mono uppercase">{labels[type]}</span>
		<span class="text-chrome-600">({agents.length})</span>
	</button>

	{#if expanded && agents.length > 0}
		<div>
			{@render children()}
		</div>
	{/if}
</div>
```

**Step 3: Create RigNode (Level 1 - top level)**

```svelte
<!-- src/lib/components/rigs/RigNode.svelte -->
<script lang="ts">
	import { ChevronRight } from 'lucide-svelte';
	import type { Rig } from '$lib/stores/rigs.svelte';
	import type { Snippet } from 'svelte';
	import Badge from '../core/Badge.svelte';

	interface Props {
		rig: Rig;
		expanded: boolean;
		selected: boolean;
		onToggle: () => void;
		onSelect: () => void;
		children: Snippet;
	}

	let { rig, expanded, selected, onToggle, onSelect, children }: Props = $props();

	const statusColors: Record<string, string> = {
		active: 'bg-green-500',
		parked: 'bg-warning-500',
		docked: 'bg-neutral-500',
		error: 'bg-red-500'
	};

	const badgeVariants: Record<string, 'success' | 'warning' | 'chrome' | 'danger'> = {
		active: 'success',
		parked: 'warning',
		docked: 'chrome',
		error: 'danger'
	};
</script>

<div>
	<div
		class="flex items-center gap-1 px-2 py-2
			{selected
				? 'bg-rust-600/20 border-l-2 border-rust-500'
				: 'border-l-2 border-transparent hover:bg-oil-800'}"
	>
		<button
			class="p-0.5 text-chrome-500 hover:text-chrome-300"
			onclick={onToggle}
		>
			<ChevronRight
				size={14}
				class="transition-transform duration-150 {expanded ? 'rotate-90' : ''}"
			/>
		</button>
		<button
			class="flex-1 flex items-center gap-2 text-left"
			onclick={onSelect}
		>
			<span class="w-2 h-2 rounded-full {statusColors[rig.status]}"></span>
			<span class="flex-1 font-stencil text-sm uppercase tracking-wider text-chrome-100 truncate">
				{rig.name}
			</span>
			<Badge variant={badgeVariants[rig.status]} size="sm">
				{rig.status.toUpperCase()}
			</Badge>
		</button>
	</div>

	{#if expanded}
		<div>
			{@render children()}
		</div>
	{/if}
</div>
```

**Step 4: Verify no TypeScript errors**

Run: `cd /home/jaden-burton/gt/gastown-ui && npm run check`
Expected: No errors

**Step 5: Commit**

```bash
git add src/lib/components/rigs/
git commit -m "feat(rigs): add tree node components (RigNode, AgentTypeNode, AgentNode)"
```

---

## Task 4: Create RigTree Component

**Files:**
- Create: `src/lib/components/rigs/RigTree.svelte`

**Step 1: Create the tree container component**

```svelte
<!-- src/lib/components/rigs/RigTree.svelte -->
<script lang="ts">
	import { rigsStore, type Rig } from '$lib/stores/rigs.svelte';
	import type { Agent } from '$lib/stores/agents.svelte';
	import RigNode from './RigNode.svelte';
	import AgentTypeNode from './AgentTypeNode.svelte';
	import AgentNode from './AgentNode.svelte';

	export type Selection =
		| { type: 'rig'; rig: Rig }
		| { type: 'agent'; agent: Agent; rig: Rig }
		| null;

	interface Props {
		selection: Selection;
		onSelect: (selection: Selection) => void;
	}

	let { selection, onSelect }: Props = $props();

	// Track expanded state for rigs and agent types
	let expandedRigs = $state<Set<string>>(new Set());
	let expandedTypes = $state<Map<string, Set<string>>>(new Map());

	function toggleRig(name: string) {
		if (expandedRigs.has(name)) {
			expandedRigs.delete(name);
		} else {
			expandedRigs.add(name);
		}
		expandedRigs = new Set(expandedRigs);
	}

	function toggleType(rigName: string, type: string) {
		const types = expandedTypes.get(rigName) || new Set();
		if (types.has(type)) {
			types.delete(type);
		} else {
			types.add(type);
		}
		expandedTypes.set(rigName, types);
		expandedTypes = new Map(expandedTypes);
	}

	function isRigExpanded(name: string): boolean {
		return expandedRigs.has(name);
	}

	function isTypeExpanded(rigName: string, type: string): boolean {
		return expandedTypes.get(rigName)?.has(type) || false;
	}

	function isRigSelected(rig: Rig): boolean {
		return selection?.type === 'rig' && selection.rig.name === rig.name;
	}

	function isAgentSelected(agent: Agent): boolean {
		return selection?.type === 'agent' && selection.agent.id === agent.id;
	}

	function getAgentsByType(agents: Agent[], type: string): Agent[] {
		return agents.filter((a) => a.role === type);
	}

	const agentTypes = ['witness', 'refinery', 'polecat', 'crew'] as const;
</script>

<div class="h-full overflow-y-auto bg-oil-900 border-r border-oil-700">
	{#if rigsStore.isLoading && rigsStore.items.length === 0}
		<!-- Skeleton loading -->
		<div class="p-4 space-y-3">
			{#each [1, 2, 3] as _}
				<div class="h-8 bg-oil-800 rounded animate-pulse"></div>
			{/each}
		</div>
	{:else if rigsStore.items.length === 0}
		<!-- Empty state -->
		<div class="p-4 text-center">
			<p class="text-chrome-500 text-sm font-mono">No rigs configured.</p>
			<p class="text-chrome-600 text-xs mt-1">Add one with:</p>
			<code class="text-xs text-rust-400 block mt-2">gt rig add &lt;name&gt; &lt;url&gt;</code>
		</div>
	{:else}
		<!-- Rig tree -->
		<div class="py-2">
			{#each rigsStore.items as rig (rig.name)}
				<RigNode
					{rig}
					expanded={isRigExpanded(rig.name)}
					selected={isRigSelected(rig)}
					onToggle={() => toggleRig(rig.name)}
					onSelect={() => onSelect({ type: 'rig', rig })}
				>
					{#each agentTypes as agentType}
						{@const agents = getAgentsByType(rig.agents, agentType)}
						<AgentTypeNode
							type={agentType}
							{agents}
							expanded={isTypeExpanded(rig.name, agentType)}
							onToggle={() => toggleType(rig.name, agentType)}
						>
							{#each agents as agent (agent.id)}
								<AgentNode
									{agent}
									selected={isAgentSelected(agent)}
									onSelect={() => onSelect({ type: 'agent', agent, rig })}
								/>
							{/each}
						</AgentTypeNode>
					{/each}
				</RigNode>
			{/each}
		</div>
	{/if}
</div>
```

**Step 2: Verify no TypeScript errors**

Run: `cd /home/jaden-burton/gt/gastown-ui && npm run check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/components/rigs/RigTree.svelte
git commit -m "feat(rigs): add RigTree container component"
```

---

## Task 5: Create Detail Panel Components

**Files:**
- Create: `src/lib/components/rigs/RigDetail.svelte`
- Create: `src/lib/components/rigs/AgentDetail.svelte`
- Create: `src/lib/components/rigs/CrewDetail.svelte`

**Step 1: Create RigDetail component**

```svelte
<!-- src/lib/components/rigs/RigDetail.svelte -->
<script lang="ts">
	import { Play, Square, ParkingCircle, RotateCw, Send } from 'lucide-svelte';
	import type { Rig } from '$lib/stores/rigs.svelte';
	import { Card, Button, Badge } from '$lib/components/core';

	interface Props {
		rig: Rig;
		onAction: (action: string) => void;
		onSling: () => void;
	}

	let { rig, onAction, onSling }: Props = $props();

	let isLoading = $state<string | null>(null);
	let confirmAction = $state<string | null>(null);

	async function handleAction(action: string) {
		if (action === 'stop' && !confirmAction) {
			confirmAction = action;
			return;
		}
		confirmAction = null;
		isLoading = action;
		try {
			await onAction(action);
		} finally {
			isLoading = null;
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<div class="flex items-center gap-3">
			<h2 class="font-stencil text-2xl uppercase tracking-wider text-chrome-100">
				{rig.name}
			</h2>
			<Badge variant={rig.status === 'active' ? 'success' : 'chrome'}>
				{rig.status.toUpperCase()}
			</Badge>
		</div>
		{#if rig.addedAt}
			<p class="text-xs text-chrome-500 font-mono mt-1">Added: {rig.addedAt}</p>
		{/if}
	</div>

	<!-- Stats -->
	<Card>
		<div class="flex flex-wrap gap-4">
			<div class="flex items-center gap-2">
				<span class="text-lg font-stencil text-chrome-100">{rig.polecatCount}</span>
				<span class="text-xs text-chrome-500 uppercase">Polecats</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="text-lg font-stencil text-chrome-100">{rig.crewCount}</span>
				<span class="text-xs text-chrome-500 uppercase">Crews</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="w-2 h-2 rounded-full {rig.hasWitness ? 'bg-green-500' : 'bg-neutral-500'}"></span>
				<span class="text-xs text-chrome-500 uppercase">Witness</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="w-2 h-2 rounded-full {rig.hasRefinery ? 'bg-green-500' : 'bg-neutral-500'}"></span>
				<span class="text-xs text-chrome-500 uppercase">Refinery</span>
			</div>
		</div>
	</Card>

	<!-- Actions -->
	<Card title="Actions">
		{#if confirmAction === 'stop'}
			<div class="p-3 bg-red-900/20 border border-red-700/50 rounded-sm mb-4">
				<p class="text-sm text-chrome-200 mb-3">Stop this rig? Running agents will be terminated.</p>
				<div class="flex gap-2">
					<Button variant="ghost" size="sm" onclick={() => confirmAction = null}>Cancel</Button>
					<Button variant="danger" size="sm" onclick={() => handleAction('stop')}>Confirm Stop</Button>
				</div>
			</div>
		{/if}

		<div class="flex flex-wrap gap-2">
			<Button
				variant="secondary"
				size="sm"
				disabled={isLoading !== null}
				onclick={() => handleAction('start')}
			>
				<Play size={14} />
				{isLoading === 'start' ? 'Starting...' : 'Start'}
			</Button>
			<Button
				variant="secondary"
				size="sm"
				disabled={isLoading !== null}
				onclick={() => handleAction('stop')}
			>
				<Square size={14} />
				{isLoading === 'stop' ? 'Stopping...' : 'Stop'}
			</Button>
			<Button
				variant="secondary"
				size="sm"
				disabled={isLoading !== null}
				onclick={() => handleAction('park')}
			>
				<ParkingCircle size={14} />
				{isLoading === 'park' ? 'Parking...' : 'Park'}
			</Button>
			<Button
				variant="secondary"
				size="sm"
				disabled={isLoading !== null}
				onclick={() => handleAction('restart')}
			>
				<RotateCw size={14} />
				{isLoading === 'restart' ? 'Restarting...' : 'Restart'}
			</Button>
		</div>

		<div class="mt-4 pt-4 border-t border-oil-700">
			<Button variant="primary" onclick={onSling}>
				<Send size={14} />
				Sling Work...
			</Button>
		</div>
	</Card>
</div>
```

**Step 2: Create AgentDetail component**

```svelte
<!-- src/lib/components/rigs/AgentDetail.svelte -->
<script lang="ts">
	import { Unplug, Trash2 } from 'lucide-svelte';
	import type { Agent } from '$lib/stores/agents.svelte';
	import type { Rig } from '$lib/stores/rigs.svelte';
	import { Card, Button, Badge } from '$lib/components/core';

	interface Props {
		agent: Agent;
		rig: Rig;
		onAction: (action: string) => void;
	}

	let { agent, rig, onAction }: Props = $props();

	let isLoading = $state<string | null>(null);
	let confirmAction = $state<string | null>(null);

	const isPolecat = $derived(agent.role === 'polecat');

	async function handleAction(action: string) {
		if (action === 'nuke' && !confirmAction) {
			confirmAction = action;
			return;
		}
		confirmAction = null;
		isLoading = action;
		try {
			await onAction(action);
		} finally {
			isLoading = null;
		}
	}

	const statusVariants: Record<string, 'success' | 'warning' | 'chrome'> = {
		running: 'warning',
		idle: 'success',
		offline: 'chrome'
	};
</script>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<div class="flex items-center gap-3">
			<h2 class="font-stencil text-2xl uppercase tracking-wider text-chrome-100">
				{agent.name}
			</h2>
			<Badge variant={statusVariants[agent.status] || 'chrome'}>
				{agent.status === 'running' ? 'BUSY' : agent.status.toUpperCase()}
			</Badge>
		</div>
		<p class="text-xs text-chrome-500 font-mono mt-1">
			Role: {agent.role} &bull; Rig: {rig.name}
		</p>
	</div>

	<!-- Current Work (if busy) -->
	{#if agent.status === 'running' && agent.hasWork}
		<Card title="Current Work">
			<p class="text-sm text-chrome-200 font-mono">Working on assigned task</p>
			{#if agent.unreadMail > 0}
				<p class="text-xs text-warning-400 mt-2">{agent.unreadMail} unread messages</p>
			{/if}
		</Card>
	{/if}

	<!-- Actions -->
	<Card title="Actions">
		{#if confirmAction === 'nuke'}
			<div class="p-3 bg-red-900/20 border border-red-700/50 rounded-sm mb-4">
				<p class="text-sm text-chrome-200 mb-3">Nuke this polecat? It will be terminated immediately.</p>
				<div class="flex gap-2">
					<Button variant="ghost" size="sm" onclick={() => confirmAction = null}>Cancel</Button>
					<Button variant="danger" size="sm" onclick={() => handleAction('nuke')}>Confirm Nuke</Button>
				</div>
			</div>
		{/if}

		<div class="flex flex-wrap gap-2">
			{#if agent.hasWork}
				<Button
					variant="secondary"
					size="sm"
					disabled={isLoading !== null}
					onclick={() => handleAction('unsling')}
				>
					<Unplug size={14} />
					{isLoading === 'unsling' ? 'Unslinging...' : 'Unsling'}
				</Button>
			{/if}
			{#if isPolecat}
				<Button
					variant="danger"
					size="sm"
					disabled={isLoading !== null}
					onclick={() => handleAction('nuke')}
				>
					<Trash2 size={14} />
					{isLoading === 'nuke' ? 'Nuking...' : 'Nuke'}
				</Button>
			{/if}
		</div>

		{#if !agent.hasWork && !isPolecat}
			<p class="text-sm text-chrome-500">No actions available for idle {agent.role}.</p>
		{/if}
	</Card>
</div>
```

**Step 3: Create CrewDetail component**

```svelte
<!-- src/lib/components/rigs/CrewDetail.svelte -->
<script lang="ts">
	import { Play, Square, Terminal, RefreshCw, Trash2 } from 'lucide-svelte';
	import type { Agent } from '$lib/stores/agents.svelte';
	import type { Rig } from '$lib/stores/rigs.svelte';
	import { Card, Button, Badge } from '$lib/components/core';

	interface Props {
		crew: Agent;
		rig: Rig;
		onAction: (action: string) => void;
	}

	let { crew, rig, onAction }: Props = $props();

	let isLoading = $state<string | null>(null);
	let confirmAction = $state<string | null>(null);

	async function handleAction(action: string) {
		if (action === 'remove' && !confirmAction) {
			confirmAction = action;
			return;
		}
		confirmAction = null;
		isLoading = action;
		try {
			await onAction(action);
		} finally {
			isLoading = null;
		}
	}

	const statusVariants: Record<string, 'success' | 'warning' | 'chrome'> = {
		running: 'success',
		idle: 'chrome',
		offline: 'chrome'
	};
</script>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<div class="flex items-center gap-3">
			<h2 class="font-stencil text-2xl uppercase tracking-wider text-chrome-100">
				{crew.name}
			</h2>
			<Badge variant={statusVariants[crew.status] || 'chrome'}>
				{crew.status === 'running' ? 'ACTIVE' : crew.status.toUpperCase()}
			</Badge>
		</div>
		<p class="text-xs text-chrome-500 font-mono mt-1">
			Rig: {rig.name}
		</p>
	</div>

	<!-- Actions -->
	<Card title="Actions">
		{#if confirmAction === 'remove'}
			<div class="p-3 bg-red-900/20 border border-red-700/50 rounded-sm mb-4">
				<p class="text-sm text-chrome-200 mb-3">Remove this crew workspace? This cannot be undone.</p>
				<div class="flex gap-2">
					<Button variant="ghost" size="sm" onclick={() => confirmAction = null}>Cancel</Button>
					<Button variant="danger" size="sm" onclick={() => handleAction('remove')}>Confirm Remove</Button>
				</div>
			</div>
		{/if}

		<div class="flex flex-wrap gap-2">
			<Button
				variant="secondary"
				size="sm"
				disabled={isLoading !== null}
				onclick={() => handleAction('start')}
			>
				<Play size={14} />
				{isLoading === 'start' ? 'Starting...' : 'Start'}
			</Button>
			<Button
				variant="secondary"
				size="sm"
				disabled={isLoading !== null}
				onclick={() => handleAction('stop')}
			>
				<Square size={14} />
				{isLoading === 'stop' ? 'Stopping...' : 'Stop'}
			</Button>
			<Button
				variant="secondary"
				size="sm"
				disabled={isLoading !== null}
				onclick={() => handleAction('attach')}
			>
				<Terminal size={14} />
				Attach
			</Button>
			<Button
				variant="secondary"
				size="sm"
				disabled={isLoading !== null}
				onclick={() => handleAction('refresh')}
			>
				<RefreshCw size={14} />
				{isLoading === 'refresh' ? 'Refreshing...' : 'Refresh'}
			</Button>
			<Button
				variant="danger"
				size="sm"
				disabled={isLoading !== null}
				onclick={() => handleAction('remove')}
			>
				<Trash2 size={14} />
				{isLoading === 'remove' ? 'Removing...' : 'Remove'}
			</Button>
		</div>
	</Card>
</div>
```

**Step 4: Verify no TypeScript errors**

Run: `cd /home/jaden-burton/gt/gastown-ui && npm run check`
Expected: No errors

**Step 5: Commit**

```bash
git add src/lib/components/rigs/
git commit -m "feat(rigs): add detail panel components (RigDetail, AgentDetail, CrewDetail)"
```

---

## Task 6: Create SlingForm Component

**Files:**
- Create: `src/lib/components/rigs/SlingForm.svelte`

**Step 1: Create the sling form component**

```svelte
<!-- src/lib/components/rigs/SlingForm.svelte -->
<script lang="ts">
	import { X, Send } from 'lucide-svelte';
	import type { Rig } from '$lib/stores/rigs.svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { Card, Button, Input, Select } from '$lib/components/core';

	interface Props {
		rig: Rig;
		onSling: (beadId: string, target?: string) => Promise<void>;
		onCancel: () => void;
	}

	let { rig, onSling, onCancel }: Props = $props();

	let beadId = $state('');
	let target = $state('auto');
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// Get unassigned tasks
	const availableBeads = $derived(
		tasksStore.items.filter((t) => t.status === 'pending' && !t.assignee)
	);

	const targetOptions = $derived([
		{ value: 'auto', label: 'Auto (spawn polecat)' },
		...rig.agents
			.filter((a) => a.role === 'crew' || a.role === 'witness')
			.map((a) => ({ value: a.name, label: `${a.name} (${a.role})` }))
	]);

	async function handleSubmit() {
		if (!beadId.trim()) {
			error = 'Please enter or select a bead ID';
			return;
		}

		error = null;
		isLoading = true;

		try {
			await onSling(beadId.trim(), target === 'auto' ? undefined : target);
			onCancel();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to sling work';
		} finally {
			isLoading = false;
		}
	}

	function selectBead(id: string) {
		beadId = id;
	}
</script>

<Card title="Sling Work to {rig.name}">
	<div class="space-y-4">
		<!-- Bead ID input -->
		<div>
			<label class="block text-xs text-chrome-500 font-mono uppercase mb-1">
				Bead ID
			</label>
			<Input
				bind:value={beadId}
				placeholder="e.g., mt-4fy"
			/>
		</div>

		<!-- Available beads -->
		{#if availableBeads.length > 0}
			<div>
				<label class="block text-xs text-chrome-500 font-mono uppercase mb-2">
					Or select from queue:
				</label>
				<div class="max-h-32 overflow-y-auto space-y-1">
					{#each availableBeads.slice(0, 5) as task (task.id)}
						<button
							class="w-full flex items-center gap-2 p-2 text-left text-sm rounded-sm
								transition-colors
								{beadId === task.id
									? 'bg-rust-600/20 border border-rust-500'
									: 'bg-oil-800 border border-oil-700 hover:border-oil-600'}"
							onclick={() => selectBead(task.id)}
						>
							<span class="font-mono text-xs text-rust-400">{task.id}</span>
							<span class="flex-1 truncate text-chrome-300">{task.title}</span>
							<span class="text-xs text-chrome-500">P{task.priority}</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Target selection -->
		<div>
			<label class="block text-xs text-chrome-500 font-mono uppercase mb-1">
				Target
			</label>
			<Select bind:value={target} options={targetOptions} />
		</div>

		<!-- Error message -->
		{#if error}
			<p class="text-sm text-red-400">{error}</p>
		{/if}

		<!-- Actions -->
		<div class="flex gap-2 pt-2">
			<Button variant="ghost" onclick={onCancel} disabled={isLoading}>
				<X size={14} />
				Cancel
			</Button>
			<Button onclick={handleSubmit} disabled={isLoading}>
				<Send size={14} />
				{isLoading ? 'Slinging...' : 'Sling'}
			</Button>
		</div>
	</div>
</Card>
```

**Step 2: Verify no TypeScript errors**

Run: `cd /home/jaden-burton/gt/gastown-ui && npm run check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/components/rigs/SlingForm.svelte
git commit -m "feat(rigs): add SlingForm component for work assignment"
```

---

## Task 7: Create Component Barrel Export

**Files:**
- Create: `src/lib/components/rigs/index.ts`

**Step 1: Create barrel export file**

```typescript
// src/lib/components/rigs/index.ts
export { default as RigTree } from './RigTree.svelte';
export { default as RigNode } from './RigNode.svelte';
export { default as AgentTypeNode } from './AgentTypeNode.svelte';
export { default as AgentNode } from './AgentNode.svelte';
export { default as RigDetail } from './RigDetail.svelte';
export { default as AgentDetail } from './AgentDetail.svelte';
export { default as CrewDetail } from './CrewDetail.svelte';
export { default as SlingForm } from './SlingForm.svelte';
export type { Selection } from './RigTree.svelte';
```

**Step 2: Commit**

```bash
git add src/lib/components/rigs/index.ts
git commit -m "feat(rigs): add component barrel export"
```

---

## Task 8: Create Rig Action API Endpoints

**Files:**
- Create: `src/routes/api/gastown/rigs/[name]/start/+server.ts`
- Create: `src/routes/api/gastown/rigs/[name]/stop/+server.ts`
- Create: `src/routes/api/gastown/rigs/[name]/park/+server.ts`
- Create: `src/routes/api/gastown/rigs/[name]/sling/+server.ts`

**Step 1: Create start endpoint**

```typescript
// src/routes/api/gastown/rigs/[name]/start/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';

export const POST: RequestHandler = async ({ params }) => {
	const requestId = crypto.randomUUID();
	const supervisor = getProcessSupervisor();
	const { name } = params;

	try {
		const result = await supervisor.gt(['rig', 'start', name], { timeout: 30_000 });

		if (!result.success) {
			return json(
				{ error: result.error || 'Failed to start rig', requestId },
				{ status: 500 }
			);
		}

		return json({
			success: true,
			message: `Rig ${name} started`,
			requestId
		});
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : 'Unknown error', requestId },
			{ status: 500 }
		);
	}
};
```

**Step 2: Create stop endpoint**

```typescript
// src/routes/api/gastown/rigs/[name]/stop/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';

export const POST: RequestHandler = async ({ params }) => {
	const requestId = crypto.randomUUID();
	const supervisor = getProcessSupervisor();
	const { name } = params;

	try {
		const result = await supervisor.gt(['rig', 'stop', name], { timeout: 30_000 });

		if (!result.success) {
			return json(
				{ error: result.error || 'Failed to stop rig', requestId },
				{ status: 500 }
			);
		}

		return json({
			success: true,
			message: `Rig ${name} stopped`,
			requestId
		});
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : 'Unknown error', requestId },
			{ status: 500 }
		);
	}
};
```

**Step 3: Create park endpoint**

```typescript
// src/routes/api/gastown/rigs/[name]/park/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';

export const POST: RequestHandler = async ({ params }) => {
	const requestId = crypto.randomUUID();
	const supervisor = getProcessSupervisor();
	const { name } = params;

	try {
		const result = await supervisor.gt(['rig', 'park', name], { timeout: 30_000 });

		if (!result.success) {
			return json(
				{ error: result.error || 'Failed to park rig', requestId },
				{ status: 500 }
			);
		}

		return json({
			success: true,
			message: `Rig ${name} parked`,
			requestId
		});
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : 'Unknown error', requestId },
			{ status: 500 }
		);
	}
};
```

**Step 4: Create sling endpoint**

```typescript
// src/routes/api/gastown/rigs/[name]/sling/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';
import { z } from 'zod';

const SlingSchema = z.object({
	beadId: z.string().min(1),
	target: z.string().optional()
});

export const POST: RequestHandler = async ({ params, request }) => {
	const requestId = crypto.randomUUID();
	const supervisor = getProcessSupervisor();
	const { name } = params;

	try {
		const body = await request.json();
		const parsed = SlingSchema.safeParse(body);

		if (!parsed.success) {
			return json(
				{ error: 'Invalid request body', details: parsed.error.issues, requestId },
				{ status: 400 }
			);
		}

		const { beadId, target } = parsed.data;
		const args = ['sling', beadId, target || name];

		const result = await supervisor.gt(args, { timeout: 30_000 });

		if (!result.success) {
			return json(
				{ error: result.error || 'Failed to sling work', requestId },
				{ status: 500 }
			);
		}

		return json({
			success: true,
			message: `Work ${beadId} slung to ${target || name}`,
			requestId
		});
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : 'Unknown error', requestId },
			{ status: 500 }
		);
	}
};
```

**Step 5: Verify no TypeScript errors**

Run: `cd /home/jaden-burton/gt/gastown-ui && npm run check`
Expected: No errors

**Step 6: Commit**

```bash
git add src/routes/api/gastown/rigs/
git commit -m "feat(api): add rig action endpoints (start, stop, park, sling)"
```

---

## Task 9: Create Crew Action API Endpoints

**Files:**
- Create: `src/routes/api/gastown/crews/[name]/start/+server.ts`
- Create: `src/routes/api/gastown/crews/[name]/stop/+server.ts`

**Step 1: Create crew start endpoint**

```typescript
// src/routes/api/gastown/crews/[name]/start/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';

export const POST: RequestHandler = async ({ params }) => {
	const requestId = crypto.randomUUID();
	const supervisor = getProcessSupervisor();
	const { name } = params;

	try {
		const result = await supervisor.gt(['crew', 'start', name], { timeout: 30_000 });

		if (!result.success) {
			return json(
				{ error: result.error || 'Failed to start crew', requestId },
				{ status: 500 }
			);
		}

		return json({
			success: true,
			message: `Crew ${name} started`,
			requestId
		});
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : 'Unknown error', requestId },
			{ status: 500 }
		);
	}
};
```

**Step 2: Create crew stop endpoint**

```typescript
// src/routes/api/gastown/crews/[name]/stop/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';

export const POST: RequestHandler = async ({ params }) => {
	const requestId = crypto.randomUUID();
	const supervisor = getProcessSupervisor();
	const { name } = params;

	try {
		const result = await supervisor.gt(['crew', 'stop', name], { timeout: 30_000 });

		if (!result.success) {
			return json(
				{ error: result.error || 'Failed to stop crew', requestId },
				{ status: 500 }
			);
		}

		return json({
			success: true,
			message: `Crew ${name} stopped`,
			requestId
		});
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : 'Unknown error', requestId },
			{ status: 500 }
		);
	}
};
```

**Step 3: Commit**

```bash
git add src/routes/api/gastown/crews/
git commit -m "feat(api): add crew action endpoints (start, stop)"
```

---

## Task 10: Create Rigs Page

**Files:**
- Create: `src/routes/rigs/+page.svelte`

**Step 1: Create the main rigs page**

```svelte
<!-- src/routes/rigs/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Header } from '$lib/components/layout';
	import {
		RigTree,
		RigDetail,
		AgentDetail,
		CrewDetail,
		SlingForm,
		type Selection
	} from '$lib/components/rigs';
	import { rigsStore } from '$lib/stores/rigs.svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';

	onMount(() => {
		rigsStore.fetch();
		tasksStore.fetch();
	});

	let selection = $state<Selection>(null);
	let showSlingForm = $state(false);

	function handleRefresh() {
		rigsStore.fetch();
	}

	async function handleRigAction(action: string) {
		if (!selection || selection.type !== 'rig') return;

		const rigName = selection.rig.name;
		const endpoint = `/api/gastown/rigs/${encodeURIComponent(rigName)}/${action}`;

		const response = await fetch(endpoint, { method: 'POST' });
		const data = await response.json();

		if (!response.ok) {
			console.error('Rig action failed:', data.error);
			throw new Error(data.error);
		}

		// Refresh data after action
		await rigsStore.fetch();
	}

	async function handleAgentAction(action: string) {
		if (!selection || selection.type !== 'agent') return;

		const agent = selection.agent;

		if (action === 'unsling') {
			// TODO: Call unsling endpoint
			console.log('Unsling:', agent.name);
		} else if (action === 'nuke') {
			const endpoint = `/api/gastown/polecats/${encodeURIComponent(agent.name)}/nuke`;
			// TODO: Create polecat nuke endpoint
			console.log('Nuke:', agent.name);
		}

		await rigsStore.fetch();
	}

	async function handleCrewAction(action: string) {
		if (!selection || selection.type !== 'agent') return;

		const crew = selection.agent;
		const crewName = crew.name;

		if (action === 'start' || action === 'stop') {
			const endpoint = `/api/gastown/crews/${encodeURIComponent(crewName)}/${action}`;
			const response = await fetch(endpoint, { method: 'POST' });
			const data = await response.json();

			if (!response.ok) {
				console.error('Crew action failed:', data.error);
				throw new Error(data.error);
			}
		} else if (action === 'attach') {
			// Attach requires terminal - just log for now
			console.log('Attach to crew:', crewName);
		} else if (action === 'refresh' || action === 'remove') {
			// TODO: Implement these endpoints
			console.log(`${action} crew:`, crewName);
		}

		await rigsStore.fetch();
	}

	async function handleSling(beadId: string, target?: string) {
		if (!selection || selection.type !== 'rig') return;

		const rigName = selection.rig.name;
		const endpoint = `/api/gastown/rigs/${encodeURIComponent(rigName)}/sling`;

		const response = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ beadId, target })
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Failed to sling work');
		}

		await rigsStore.fetch();
		await tasksStore.fetch();
	}
</script>

<svelte:head>
	<title>Rigs | Gas Town</title>
</svelte:head>

<Header
	title="Rigs"
	subtitle="Rig management and work assignment"
	onRefresh={handleRefresh}
/>

<div class="flex h-[calc(100vh-theme(spacing.16))]">
	<!-- Tree Panel -->
	<div class="w-80 flex-shrink-0">
		<RigTree {selection} onSelect={(s) => { selection = s; showSlingForm = false; }} />
	</div>

	<!-- Detail Panel -->
	<div class="flex-1 overflow-y-auto p-6">
		{#if selection === null}
			<div class="h-full flex items-center justify-center">
				<p class="text-chrome-500 font-mono">Select a rig or agent to view details</p>
			</div>
		{:else if selection.type === 'rig'}
			{#if showSlingForm}
				<SlingForm
					rig={selection.rig}
					onSling={handleSling}
					onCancel={() => showSlingForm = false}
				/>
			{:else}
				<RigDetail
					rig={selection.rig}
					onAction={handleRigAction}
					onSling={() => showSlingForm = true}
				/>
			{/if}
		{:else if selection.type === 'agent'}
			{#if selection.agent.role === 'crew'}
				<CrewDetail
					crew={selection.agent}
					rig={selection.rig}
					onAction={handleCrewAction}
				/>
			{:else}
				<AgentDetail
					agent={selection.agent}
					rig={selection.rig}
					onAction={handleAgentAction}
				/>
			{/if}
		{/if}
	</div>
</div>
```

**Step 2: Verify build passes**

Run: `cd /home/jaden-burton/gt/gastown-ui && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/routes/rigs/
git commit -m "feat(rigs): add main rigs page with tree and detail panels"
```

---

## Task 11: Add API Client Methods

**Files:**
- Modify: `src/lib/api/client.ts`

**Step 1: Add rig action methods to API client**

Add these methods to the `api` object in `src/lib/api/client.ts`:

```typescript
/**
 * Start a rig
 */
async startRig(name: string) {
	return fetchApi<unknown>(`/api/gastown/rigs/${encodeURIComponent(name)}/start`, {
		method: 'POST'
	});
},

/**
 * Stop a rig
 */
async stopRig(name: string) {
	return fetchApi<unknown>(`/api/gastown/rigs/${encodeURIComponent(name)}/stop`, {
		method: 'POST'
	});
},

/**
 * Park a rig
 */
async parkRig(name: string) {
	return fetchApi<unknown>(`/api/gastown/rigs/${encodeURIComponent(name)}/park`, {
		method: 'POST'
	});
},

/**
 * Sling work to a rig
 */
async slingWork(rigName: string, beadId: string, target?: string) {
	return fetchApi<unknown>(`/api/gastown/rigs/${encodeURIComponent(rigName)}/sling`, {
		method: 'POST',
		body: JSON.stringify({ beadId, target })
	});
},

/**
 * Start a crew
 */
async startCrew(name: string) {
	return fetchApi<unknown>(`/api/gastown/crews/${encodeURIComponent(name)}/start`, {
		method: 'POST'
	});
},

/**
 * Stop a crew
 */
async stopCrew(name: string) {
	return fetchApi<unknown>(`/api/gastown/crews/${encodeURIComponent(name)}/stop`, {
		method: 'POST'
	});
}
```

**Step 2: Commit**

```bash
git add src/lib/api/client.ts
git commit -m "feat(api): add rig and crew action methods to API client"
```

---

## Task 12: Integration Testing

**Step 1: Start dev server and test manually**

Run: `cd /home/jaden-burton/gt/gastown-ui && npm run dev`

**Step 2: Test checklist**

1. Navigate to `/rigs` - verify page loads
2. Verify sidebar shows "Rigs" nav item
3. Verify tree shows rigs from API
4. Click a rig - verify detail panel shows
5. Expand rig - verify agent types show
6. Click agent - verify agent detail shows
7. Click "Sling Work..." - verify form opens
8. Click "Start" on rig - verify action executes

**Step 3: Fix any issues found**

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(rigs): complete rigs tab implementation"
```

---

## Summary

**Total Tasks:** 12

**New Files Created:**
- `src/lib/stores/rigs.svelte.ts`
- `src/lib/components/rigs/index.ts`
- `src/lib/components/rigs/RigTree.svelte`
- `src/lib/components/rigs/RigNode.svelte`
- `src/lib/components/rigs/AgentTypeNode.svelte`
- `src/lib/components/rigs/AgentNode.svelte`
- `src/lib/components/rigs/RigDetail.svelte`
- `src/lib/components/rigs/AgentDetail.svelte`
- `src/lib/components/rigs/CrewDetail.svelte`
- `src/lib/components/rigs/SlingForm.svelte`
- `src/routes/rigs/+page.svelte`
- `src/routes/api/gastown/rigs/[name]/start/+server.ts`
- `src/routes/api/gastown/rigs/[name]/stop/+server.ts`
- `src/routes/api/gastown/rigs/[name]/park/+server.ts`
- `src/routes/api/gastown/rigs/[name]/sling/+server.ts`
- `src/routes/api/gastown/crews/[name]/start/+server.ts`
- `src/routes/api/gastown/crews/[name]/stop/+server.ts`

**Files Modified:**
- `src/lib/stores/index.ts`
- `src/lib/components/layout/Sidebar.svelte`
- `src/lib/api/client.ts`
