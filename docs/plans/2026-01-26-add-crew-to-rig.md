# Add Crew Workers to Rigs — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to add new crew (persistent worker) workspaces to a rig from the Rigs page UI.

**Architecture:** Three-layer addition following existing patterns: a SvelteKit API route handler that calls `gt crew add`, an API client method, and a Svelte 5 form component wired into the rigs page. The UI surfaces an "Add Crew" button on the RigDetail panel that opens an inline form (same pattern as AddRigForm / SlingForm).

**Tech Stack:** SvelteKit 2, Svelte 5 (runes), TypeScript, Tailwind CSS (Gas Town theme), `gt` CLI via ProcessSupervisor

---

### Task 1: API Route — `POST /api/gastown/rigs/[name]/crew/add`

**Files:**
- Create: `src/routes/api/gastown/rigs/[name]/crew/add/+server.ts`

**Step 1: Create the API route handler**

Create `src/routes/api/gastown/rigs/[name]/crew/add/+server.ts`:

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor, validateNameParam } from '$lib/server/cli';
import { createRequestId, validationError, serverError } from '$lib/server/api-response';

const NAME_RE = /^[a-zA-Z0-9_-]+$/;
const MAX_NAME_LEN = 64;

export const POST: RequestHandler = async ({ params, request }) => {
	const requestId = createRequestId();

	// Validate rig name from URL
	const rigName = params.name;
	const rigError = validateNameParam(rigName);
	if (rigError || !rigName) {
		return validationError(rigError ?? 'Missing rig name', requestId);
	}

	// Parse body for worker name
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return validationError('Invalid JSON body', requestId);
	}

	const { workerName } = body as { workerName?: string };

	if (!workerName || typeof workerName !== 'string' || !workerName.trim()) {
		return validationError('Worker name is required', requestId);
	}

	const trimmed = workerName.trim();
	if (trimmed.length > MAX_NAME_LEN || !NAME_RE.test(trimmed)) {
		return validationError(
			'Worker name must be 1-64 alphanumeric characters, hyphens, or underscores',
			requestId
		);
	}

	try {
		const supervisor = getProcessSupervisor();
		const result = await supervisor.gt(['crew', 'add', trimmed, '--rig', rigName], {
			timeout: 30_000
		});

		if (!result.success) {
			return serverError(
				new Error(result.error || 'Failed to add crew worker'),
				requestId
			);
		}

		return json({
			success: true,
			message: `Crew worker "${trimmed}" added to rig "${rigName}"`,
			requestId
		});
	} catch (err) {
		return serverError(err, requestId);
	}
};
```

**Step 2: Commit**

```bash
git add src/routes/api/gastown/rigs/\[name\]/crew/add/+server.ts
git commit -m "feat(api): add POST endpoint for adding crew workers to rigs"
```

---

### Task 2: API Client Method — `addCrew()`

**Files:**
- Modify: `src/lib/api/client.ts` (add method after `removeCrew` at line ~205)

**Step 1: Add the `addCrew` method**

Insert after the `removeCrew` method (line 205), before the `nukePolecat` method:

```typescript
	/**
	 * Add a crew worker to a rig
	 */
	async addCrew(rigName: string, workerName: string) {
		return fetchApi<unknown>(
			`/api/gastown/rigs/${encodeURIComponent(rigName)}/crew/add`,
			{
				method: 'POST',
				body: JSON.stringify({ workerName })
			}
		);
	},
```

**Step 2: Commit**

```bash
git add src/lib/api/client.ts
git commit -m "feat(api): add addCrew client method for crew worker creation"
```

---

### Task 3: UI Component — `AddCrewForm.svelte`

**Files:**
- Create: `src/lib/components/rigs/AddCrewForm.svelte`
- Modify: `src/lib/components/rigs/index.ts` (add barrel export)

**Step 1: Create AddCrewForm component**

Create `src/lib/components/rigs/AddCrewForm.svelte`. This mirrors `AddRigForm.svelte` but is simpler — only a worker name field, scoped to a rig:

```svelte
<script lang="ts">
	import { X, UserPlus } from 'lucide-svelte';
	import type { Rig } from '$lib/stores/rigs.svelte';
	import { Card, Button, Input } from '$lib/components/core';
	import { api } from '$lib/api/client';
	import { rigsStore } from '$lib/stores/rigs.svelte';
	import { agentsStore } from '$lib/stores/agents.svelte';

	interface Props {
		rig: Rig;
		onCancel: () => void;
	}

	let { rig, onCancel }: Props = $props();

	let workerName = $state('');
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	const NAME_RE = /^[a-zA-Z0-9_-]+$/;

	const nameError = $derived.by(() => {
		const trimmed = workerName.trim();
		if (trimmed.length === 0) return null;
		if (trimmed.length > 64) return 'Name too long (max 64 chars)';
		if (!NAME_RE.test(trimmed)) return 'Only letters, numbers, hyphens, underscores';
		return null;
	});

	const canSubmit = $derived(
		workerName.trim().length > 0 && !nameError && !isLoading
	);

	async function handleSubmit() {
		const trimmed = workerName.trim();
		if (!trimmed) {
			error = 'Worker name is required';
			return;
		}
		if (nameError) {
			error = nameError;
			return;
		}

		error = null;
		isLoading = true;

		try {
			await api.addCrew(rig.name, trimmed);
			await Promise.all([rigsStore.fetch(), agentsStore.fetch()]);
			onCancel();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to add crew worker';
		} finally {
			isLoading = false;
		}
	}
</script>

<Card title="Add Crew Worker">
	<p class="text-xs text-chrome-500 font-mono mb-4">
		Rig: {rig.name}
	</p>

	<form class="space-y-4" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
		<Input
			bind:value={workerName}
			label="Worker Name"
			placeholder="e.g., alice"
			required
			error={nameError ?? undefined}
			disabled={isLoading}
		/>

		{#if error}
			<p class="text-sm text-red-400">{error}</p>
		{/if}

		<div class="flex gap-2 pt-2">
			<Button variant="ghost" onclick={onCancel} disabled={isLoading}>
				<X size={14} />
				Cancel
			</Button>
			<Button onclick={handleSubmit} disabled={!canSubmit}>
				<UserPlus size={14} />
				{isLoading ? 'Adding...' : 'Add Crew'}
			</Button>
		</div>
	</form>
</Card>
```

**Step 2: Add barrel export**

In `src/lib/components/rigs/index.ts`, add the export:

```typescript
export { default as AddCrewForm } from './AddCrewForm.svelte';
```

**Step 3: Commit**

```bash
git add src/lib/components/rigs/AddCrewForm.svelte src/lib/components/rigs/index.ts
git commit -m "feat(rigs): add AddCrewForm component for creating crew workers"
```

---

### Task 4: Wire Into Rigs Page

**Files:**
- Modify: `src/routes/rigs/+page.svelte` (import form, add state toggle, add button, render form)
- Modify: `src/lib/components/rigs/RigDetail.svelte` (add "Add Crew" button)

**Step 1: Add `onAddCrew` prop to RigDetail**

In `src/lib/components/rigs/RigDetail.svelte`, add an `onAddCrew` callback prop and an "Add Crew" button next to "Sling Work":

Update the Props interface (line 8):
```typescript
	interface Props {
		rig: Rig;
		onAction: (action: string) => void;
		onSling: () => void;
		onAddCrew: () => void;
	}
```

Update the destructure (line 12):
```typescript
	let { rig, onAction, onSling, onAddCrew }: Props = $props();
```

In the actions footer section (around line 150-154), add the "Add Crew" button between "Sling Work" and "Remove":

Replace the existing footer `<div>` (lines 150-164) with:
```svelte
		<div class="mt-4 pt-4 border-t border-oil-700 flex items-center justify-between">
			<div class="flex gap-2">
				<Button variant="primary" onclick={onSling}>
					<Send size={14} />
					Sling Work...
				</Button>
				<Button variant="secondary" onclick={onAddCrew}>
					<UserPlus size={14} />
					Add Crew...
				</Button>
			</div>
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
```

Add the `UserPlus` import to the icon imports (line 2):
```typescript
	import { Play, Square, ParkingCircle, RotateCw, Send, Trash2, UserPlus } from 'lucide-svelte';
```

**Step 2: Wire into the rigs page**

In `src/routes/rigs/+page.svelte`:

Add `AddCrewForm` to the import (line 11):
```typescript
	import {
		RigTree,
		RigDetail,
		AgentDetail,
		CrewDetail,
		SlingForm,
		AddRigForm,
		AddCrewForm,
		type Selection
	} from '$lib/components/rigs';
```

Add state variable (after line 37):
```typescript
	let showAddCrewForm = $state(false);
```

Update `handleAddRig` to also clear crew form (line 39-43):
```typescript
	function handleAddRig() {
		selection = null;
		showSlingForm = false;
		showAddCrewForm = false;
		showAddRigForm = true;
	}
```

Add handler for add crew:
```typescript
	function handleAddCrew() {
		showSlingForm = false;
		showAddRigForm = false;
		showAddCrewForm = true;
	}
```

In the RigTree `onSelect` callback (line 124), also clear the crew form:
```svelte
	<RigTree {selection} onSelect={(s) => { selection = s; showSlingForm = false; showAddRigForm = false; showAddCrewForm = false; }} onAddRig={handleAddRig} />
```

In the detail panel, add the AddCrewForm rendering. In the `selection.type === 'rig'` branch (lines 135-148), add a check for `showAddCrewForm`:

```svelte
		{:else if selection.type === 'rig'}
			{#if showSlingForm}
				<SlingForm
					rig={selection.rig}
					onSling={handleSling}
					onCancel={() => showSlingForm = false}
				/>
			{:else if showAddCrewForm}
				<AddCrewForm
					rig={selection.rig}
					onCancel={() => showAddCrewForm = false}
				/>
			{:else}
				<RigDetail
					rig={selection.rig}
					onAction={handleRigAction}
					onSling={() => showSlingForm = true}
					onAddCrew={handleAddCrew}
				/>
			{/if}
```

**Step 3: Commit**

```bash
git add src/lib/components/rigs/RigDetail.svelte src/routes/rigs/+page.svelte
git commit -m "feat(rigs): wire Add Crew button and form into rig detail panel"
```

---

### Task 5: Update Codebase Layout

**Files:**
- Modify: `.claude/CLAUDE.md`

**Step 1: Update the Codebase Layout section**

In the `src/lib/components/rigs/` line of the layout, add `AddCrewForm`:

```
│   │   │   ├── rigs/                      # RigTree, RigNode, RigDetail, CrewDetail, AgentNode,
│   │   │   │                              #   AgentTypeNode, AgentDetail, SlingForm, AddRigForm,
│   │   │   │                              #   AddCrewForm
```

In the API routes section, add the new endpoint:

```
│           ├── rigs/[name]/crew/add/      # POST add crew worker to rig
```

**Step 2: Commit**

```bash
git add .claude/CLAUDE.md
git commit -m "docs: update codebase layout with AddCrewForm and crew add endpoint"
```

---

### Task 6: Smoke Test

**Step 1: Run the dev server and verify**

```bash
npm run dev
```

1. Open Firefox to `http://localhost:5173/rigs`
2. Select a rig in the tree panel
3. Verify "Add Crew..." button appears in the RigDetail actions alongside "Sling Work..."
4. Click "Add Crew..." — verify the AddCrewForm renders with the rig name shown
5. Verify validation: empty name shows required error, invalid chars show validation error, long names show length error
6. Verify Cancel returns to the RigDetail view
7. Submit a crew name (e.g., `test-worker`) — verify the API call fires and the form closes on success

**Step 2: Build check**

```bash
npm run build
```

Verify no type errors or build failures.
