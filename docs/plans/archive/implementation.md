# Gas Town UI — Missing Features Implementation Plan

## Architecture

All work is split into **two phases**:

- **Phase 1 (Parallel):** Each agent creates ONLY new files — stores, API routes, pages, components. No agent modifies any existing file.
- **Phase 2 (Sequential):** A single integration agent wires everything together by editing shared files: `client.ts`, `events.ts`, `stores/index.ts`, `Sidebar.svelte`.

This guarantees zero merge conflicts between parallel agents.

---

## Conventions (All Agents Must Follow)

### Store Pattern
```typescript
// src/lib/stores/<name>.svelte.ts
import { api } from '$lib/api/client';

export interface MyItem { /* ... */ }

interface MyState {
  items: MyItem[];
  isLoading: boolean;
  error: string | null;
  lastFetch: Date | null;
}

class MyStore {
  #state = $state<MyState>({ items: [], isLoading: false, error: null, lastFetch: null });

  get items() { return this.#state.items; }
  get isLoading() { return this.#state.isLoading; }
  get error() { return this.#state.error; }

  async fetch() {
    this.#state.isLoading = true;
    this.#state.error = null;
    try {
      const response = await api.getMyItems();
      this.#state.items = (response.items as MyItem[]) || [];
      this.#state.lastFetch = new Date();
    } catch (e) {
      this.#state.error = e instanceof Error ? e.message : 'Failed to fetch';
    } finally {
      this.#state.isLoading = false;
    }
  }

  setItems(items: MyItem[]) {
    this.#state.items = items;
    this.#state.lastFetch = new Date();
  }
}

export const myStore = new MyStore();
```

### API Route Pattern
```typescript
// src/routes/api/gastown/<resource>/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { getProcessSupervisor } from '$lib/server/cli';

export const GET: RequestHandler = async ({ url }) => {
  const requestId = crypto.randomUUID();
  const supervisor = getProcessSupervisor();

  try {
    const result = await supervisor.gt(['command', 'args'], { timeout: 30_000 });
    if (!result.success) {
      return json({ items: [], total: 0, requestId, error: result.error, stale: true }, { status: 503 });
    }
    return json({ items: result.data, total: (result.data as unknown[])?.length ?? 0, requestId, duration: result.duration });
  } catch (err) {
    return json({ items: [], total: 0, requestId, warning: err instanceof Error ? err.message : 'Unknown error' });
  }
};
```

### POST Action Route Pattern
```typescript
// src/routes/api/gastown/<resource>/[name]/<action>/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';

export const POST: RequestHandler = async ({ params }) => {
  const requestId = crypto.randomUUID();
  const supervisor = getProcessSupervisor();
  const { name } = params;

  try {
    const result = await supervisor.gt(['command', name], { timeout: 30_000 });
    if (!result.success) {
      return json({ error: result.error || 'Failed', requestId }, { status: 500 });
    }
    return json({ success: true, message: `Done: ${name}`, requestId });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error', requestId }, { status: 500 });
  }
};
```

### Page Pattern
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { Header } from '$lib/components/layout';
  import { Card } from '$lib/components/core';
  import { myStore } from '$lib/stores/my.svelte';
  import { AlertTriangle } from 'lucide-svelte';

  onMount(() => { myStore.fetch(); });
</script>

<svelte:head><title>Page | Gas Town</title></svelte:head>

<Header title="Page" subtitle="Description" onRefresh={() => myStore.fetch()} />

{#if myStore.error}
  <div class="mx-6 mt-4 px-4 py-3 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono flex items-center gap-2">
    <AlertTriangle size={16} class="flex-shrink-0" />
    <span>{myStore.error}</span>
  </div>
{/if}
```

### Component Pattern
```svelte
<!-- src/lib/components/<feature>/MyComponent.svelte -->
<script lang="ts">
  interface Props {
    id: string;
    title: string;
    class?: string;
    onclick?: () => void;
  }
  let { id, title, class: className = '', onclick }: Props = $props();
</script>
```

### Styling
- Tailwind with Gas Town dark theme: `bg-oil-950`, `bg-oil-900`, `bg-oil-800`, `border-oil-700`
- Text: `text-chrome-100` (bright), `text-chrome-400` (body), `text-chrome-500` (muted)
- Accent: `text-rust-400`, `bg-rust-600/20`, `border-rust-500`
- Warning: `text-warning-400`, `bg-warning-500`
- Mono font for data: `font-mono`
- Stencil font for headers: `font-stencil uppercase tracking-wider`
- Icons: Lucide Svelte (`lucide-svelte`)

---

## Phase 1: Parallel Work Units

Each section below is assigned to one parallel agent. Each agent creates ONLY the files listed — no modifications to existing files.

---

### Unit 1: Activity Feed

**Purpose:** Real-time event stream page showing system activity (spawns, slings, merges, mail, handoffs, etc.)

**CLI Commands:**
- `gt feed --plain --since 1h` — recent events (text output, parse lines)
- `gt trail` — recent agent activity trail

**Files to Create:**

1. `src/lib/stores/feed.svelte.ts`
   - Interface: `FeedEvent { id: string; timestamp: string; type: string; source: string; actor: string; message: string; visibility: string; }`
   - State: `items: FeedEvent[]`, `isLoading`, `error`, `lastFetch`, `filter: string | null`
   - Methods: `fetch()`, `setItems()`, `setFilter(type: string | null)`
   - Derived: `filtered` (by type), `stats` (count per type)
   - Event types to track: `mail`, `spawn`, `session_start`, `sling`, `nudge`, `done`, `halt`, `handoff`, `patrol`, `merge_started`, `merged`, `conflict`

2. `src/routes/api/gastown/feed/+server.ts`
   - `GET` handler
   - Query params: `since` (default `1h`), `type` (optional filter)
   - CLI: `supervisor.gt(['feed', '--plain', '--since', since], { timeout: 15_000 })`
   - Parse text output: each line is an event. Format: `[timestamp] [type] [actor]: [message]`
   - Return: `{ items: FeedEvent[], total: number }`

3. `src/lib/components/feed/FeedItem.svelte`
   - Props: `timestamp`, `type`, `source`, `actor`, `message`
   - Color-code by type: spawn=green, conflict=red, mail=blue, merge=purple, patrol=chrome
   - Show timestamp relative (e.g., "2m ago")
   - Lucide icon per type: `Zap` (spawn), `GitMerge` (merge), `Mail` (mail), `AlertTriangle` (conflict), `Radio` (patrol), `Send` (sling)

4. `src/lib/components/feed/index.ts`
   - Barrel: `export { default as FeedItem } from './FeedItem.svelte';`

5. `src/routes/feed/+page.svelte`
   - Header with refresh button
   - Filter buttons for event types (All, Spawn, Merge, Mail, Sling, Conflict, Patrol)
   - Scrollable list of FeedItem components, newest first
   - Auto-refresh toggle (poll every 5s when enabled)
   - Empty state: "No activity yet"
   - Show total event count in header subtitle

---

### Unit 2: Formulas & Molecules

**Purpose:** Browse formula catalog and track active molecule (workflow) progress.

**CLI Commands:**
- `gt formula list --json` — list all formulas
- `gt formula show <name> --json` — show formula steps
- `gt mol list --active --json` — list active molecules
- `gt mol show <id> --json` — show molecule with step progress

**Files to Create:**

1. `src/lib/stores/formulas.svelte.ts`
   - Interface: `Formula { name: string; description: string; version: number; stepCount: number; }`
   - Interface: `Molecule { id: string; formulaName: string; status: string; currentStep: string; totalSteps: number; completedSteps: number; attachedTo: string | null; variables: Record<string, string>; }`
   - State: `formulas: Formula[]`, `molecules: Molecule[]`, `selectedFormulaName: string | null`, `selectedMoleculeId: string | null`, `isLoading`, `error`
   - Methods: `fetchFormulas()`, `fetchMolecules()`, `selectFormula(name)`, `selectMolecule(id)`, `setFormulas()`, `setMolecules()`
   - Derived: `selectedFormula`, `selectedMolecule`, `activeMolecules`, `stats`

2. `src/routes/api/gastown/formulas/+server.ts`
   - `GET` handler
   - CLI: `supervisor.gt(['formula', 'list', '--json'], { timeout: 15_000 })`
   - Return: `{ items: Formula[], total }`

3. `src/routes/api/gastown/formulas/[name]/+server.ts`
   - `GET` handler — single formula detail with steps
   - CLI: `supervisor.gt(['formula', 'show', name, '--json'], { timeout: 15_000 })`
   - Return: `{ data: FormulaDetail }` (includes steps array)

4. `src/routes/api/gastown/molecules/+server.ts`
   - `GET` handler
   - CLI: `supervisor.gt(['mol', 'list', '--active', '--json'], { timeout: 30_000 })`
   - Return: `{ items: Molecule[], total }`

5. `src/routes/api/gastown/molecules/[id]/+server.ts`
   - `GET` handler — single molecule detail with step progress
   - CLI: `supervisor.gt(['mol', 'show', id, '--json'], { timeout: 15_000 })`
   - Return: `{ data: MoleculeDetail }`

6. `src/lib/components/formulas/FormulaCard.svelte`
   - Props: `name`, `description`, `version`, `stepCount`, `class?`, `onclick?`
   - Show name, description, version badge, step count

7. `src/lib/components/formulas/MoleculeProgress.svelte`
   - Props: `id`, `formulaName`, `status`, `currentStep`, `totalSteps`, `completedSteps`, `attachedTo?`, `class?`, `onclick?`
   - Progress bar showing completed/total steps
   - Current step name highlighted
   - Status badge (active, paused, completed)

8. `src/lib/components/formulas/FormulaDetail.svelte`
   - Props: `name`, `description`, `version`, `steps: { id: string; title: string; description: string }[]`
   - Full formula view with step list (numbered, with descriptions)

9. `src/lib/components/formulas/index.ts`
   - Barrel export all components

10. `src/routes/formulas/+page.svelte`
    - Split layout: formulas list (left) + detail (right)
    - Two tabs: "Catalog" (formulas) and "Active" (molecules)
    - Catalog tab: grid of FormulaCard, click to see FormulaDetail
    - Active tab: list of MoleculeProgress cards
    - Click molecule to see step-by-step progress detail
    - Refresh button, error state, empty states

---

### Unit 3: Convoy Actions

**Purpose:** Add create/close convoy actions to the existing convoy page.

**CLI Commands:**
- `gt convoy create "<title>" <issue1> <issue2> ...` — create convoy
- `gt convoy close <id>` — close convoy
- `bd show <id> --json` — detailed convoy with tracked issues

**Files to Create:**

1. `src/routes/api/gastown/convoys/create/+server.ts`
   - `POST` handler
   - Body: `{ title: string, issues: string[] }` (validate with Zod)
   - CLI: `supervisor.gt(['convoy', 'create', title, ...issues], { timeout: 30_000 })`
   - Return: `{ success: true, message }`

2. `src/routes/api/gastown/convoys/[id]/close/+server.ts`
   - `POST` handler
   - CLI: `supervisor.gt(['convoy', 'close', id], { timeout: 30_000 })`
   - Return: `{ success: true, message }`

3. `src/routes/api/gastown/convoys/[id]/+server.ts`
   - `GET` handler — single convoy detail with tracked issues
   - CLI: `supervisor.bd(['show', id, '--json'], { timeout: 15_000 })`
   - Parse children array to get tracked issue details
   - Return: `{ data: ConvoyDetail }` with trackedIssues array

4. `src/lib/components/convoys/CreateConvoyForm.svelte`
   - Props: `onclose: () => void`, `oncreate: () => void`
   - Form fields: title (required), issues (textarea, one ID per line)
   - Submit calls `POST /api/gastown/convoys/create`
   - Validation: title required, at least 1 issue ID

5. Update barrel: `src/lib/components/convoys/index.ts` — add `CreateConvoyForm` export
   **Note:** This file may already exist. If it does, this is an EXCEPTION to the no-edit rule — the agent should create the form component and note in output that the barrel needs updating in Phase 2.

---

### Unit 4: Daemon Controls

**Purpose:** Dashboard for daemon service lifecycle and patrol configuration.

**CLI Commands:**
- `gt daemon status` — daemon process status (text output)
- `gt daemon logs` — recent daemon logs (text output)
- `gt up` / `gt down` — start/stop all services
- Reads `mayor/daemon.json` for patrol config (already available via `getDaemonConfig()` in `town-config.ts`)

**Files to Create:**

1. `src/lib/stores/daemon.svelte.ts`
   - Interface: `DaemonStatus { running: boolean; pid: number | null; uptime: string | null; heartbeat: { enabled: boolean; interval: string }; patrols: Record<string, { enabled: boolean; interval: string; agent: string }>; }`
   - Interface: `DaemonLog { timestamp: string; message: string; level: string; }`
   - State: `status: DaemonStatus | null`, `logs: DaemonLog[]`, `isLoading`, `error`
   - Methods: `fetchStatus()`, `fetchLogs()`, `startServices()`, `stopServices()`

2. `src/routes/api/gastown/daemon/status/+server.ts`
   - `GET` handler
   - CLI: `supervisor.gt(['daemon', 'status'], { timeout: 10_000 })` — parse text output
   - Also read patrol config via `getDaemonConfig()` from `$lib/server/cli`
   - Return: `{ data: DaemonStatus }`

3. `src/routes/api/gastown/daemon/logs/+server.ts`
   - `GET` handler
   - CLI: `supervisor.gt(['daemon', 'logs'], { timeout: 10_000 })` — parse text output into lines
   - Return: `{ items: DaemonLog[], total }`

4. `src/routes/api/gastown/daemon/start/+server.ts`
   - `POST` handler
   - CLI: `supervisor.gt(['up'], { timeout: 30_000 })`
   - Return: `{ success, message }`

5. `src/routes/api/gastown/daemon/stop/+server.ts`
   - `POST` handler
   - CLI: `supervisor.gt(['down'], { timeout: 30_000 })`
   - Return: `{ success, message }`

6. `src/lib/components/daemon/DaemonStatusCard.svelte`
   - Props: `running`, `pid`, `uptime`, `heartbeat`
   - Green/red status indicator
   - PID display, uptime counter
   - Heartbeat interval display

7. `src/lib/components/daemon/PatrolConfig.svelte`
   - Props: `patrols: Record<string, { enabled: boolean; interval: string; agent: string }>`
   - Table/grid showing each patrol agent, enabled status, interval
   - Visual enabled/disabled indicators

8. `src/lib/components/daemon/DaemonLogs.svelte`
   - Props: `logs: DaemonLog[]`
   - Scrollable log viewer with monospace text
   - Color-code by level (error=red, warn=yellow, info=chrome)
   - Auto-scroll to bottom

9. `src/lib/components/daemon/index.ts`
   - Barrel export

10. `src/routes/daemon/+page.svelte`
    - Top: DaemonStatusCard with start/stop buttons
    - Middle: PatrolConfig grid
    - Bottom: DaemonLogs viewer with refresh
    - Action buttons: Start Services, Stop Services (with confirmation)

---

### Unit 5: Health Dashboard

**Purpose:** Dedicated health monitoring view showing per-rig witness/refinery health and system diagnostics.

**CLI Commands:**
- `gt status --fast` — quick status summary (text)
- `gt doctor -v` — system health diagnostics (text)
- Per-rig: `gt witness status <rig>`, `gt refinery status <rig>` (text)

**Files to Create:**

1. `src/lib/stores/health.svelte.ts`
   - Interface: `RigHealth { rigName: string; witnessStatus: string; refineryStatus: string; polecatCount: number; crewCount: number; issues: string[]; }`
   - Interface: `SystemHealth { overallStatus: 'healthy' | 'degraded' | 'critical'; rigHealth: RigHealth[]; diagnostics: string[]; lastCheck: string; }`
   - State: `health: SystemHealth | null`, `isLoading`, `error`
   - Methods: `fetch()`, `runDiagnostics()`

2. `src/routes/api/gastown/health/+server.ts`
   - `GET` handler
   - Reads rig names, then checks `gt witness status <rig>` and `gt refinery status <rig>` for each
   - Also runs `gt doctor -v` for diagnostics
   - Return: `{ data: SystemHealth }`

3. `src/lib/components/health/RigHealthCard.svelte`
   - Props: `rigName`, `witnessStatus`, `refineryStatus`, `polecatCount`, `crewCount`, `issues`
   - Card showing rig name with status indicators for witness/refinery
   - Green/yellow/red status lights
   - Issue list if any problems detected

4. `src/lib/components/health/SystemOverview.svelte`
   - Props: `overallStatus`, `rigCount`, `lastCheck`
   - Large status indicator (healthy/degraded/critical)
   - Colored banner: green/yellow/red
   - Last check timestamp

5. `src/lib/components/health/DiagnosticsPanel.svelte`
   - Props: `diagnostics: string[]`
   - Scrollable output from `gt doctor -v`
   - Monospace text, line-by-line

6. `src/lib/components/health/index.ts`
   - Barrel export

7. `src/routes/health/+page.svelte`
   - Top: SystemOverview banner
   - Grid of RigHealthCard per rig
   - Bottom: DiagnosticsPanel (collapsible)
   - Refresh + Run Diagnostics buttons

---

### Unit 6: Merge Queue (Refinery)

**Purpose:** Visibility into the merge queue — pending MRs, processing status, conflicts.

**CLI Commands:**
- `gt mq --json` or `gt mq list --json` — list merge queue items
- `gt refinery status <rig>` — refinery status per rig (text)

**Files to Create:**

1. `src/lib/stores/mergequeue.svelte.ts`
   - Interface: `MergeRequest { id: string; branch: string; rig: string; status: 'queued' | 'processing' | 'merged' | 'conflict'; author: string; title: string; submittedAt: string; mergedAt?: string; conflictReason?: string; }`
   - State: `items: MergeRequest[]`, `isLoading`, `error`, `lastFetch`, `selectedId`
   - Methods: `fetch()`, `select(id)`, `setItems()`
   - Derived: `queued`, `processing`, `merged`, `conflicts`, `stats`, `selected`

2. `src/routes/api/gastown/mergequeue/+server.ts`
   - `GET` handler
   - CLI: `supervisor.gt(['mq', '--json'], { timeout: 30_000 })`
   - Falls back to `supervisor.gt(['mq'], { timeout: 30_000 })` and parse text if JSON unavailable
   - Return: `{ items: MergeRequest[], total }`

3. `src/lib/components/mergequeue/MergeRequestItem.svelte`
   - Props: `id`, `branch`, `rig`, `status`, `author`, `title`, `submittedAt`, `class?`, `onclick?`
   - Branch name prominent, status badge, rig tag
   - Color: queued=chrome, processing=warning, merged=green, conflict=red

4. `src/lib/components/mergequeue/MergeRequestDetail.svelte`
   - Props: full MergeRequest fields
   - Shows branch, author, rig, submission time, merge time
   - Conflict reason if status=conflict

5. `src/lib/components/mergequeue/index.ts`
   - Barrel export

6. `src/routes/mergequeue/+page.svelte`
   - Split layout: list (left) + detail (right)
   - Filter buttons: All, Queued, Processing, Merged, Conflicts
   - Stats bar: total, queued, conflicts count
   - List of MergeRequestItem, click for detail

---

### Unit 7: Gates

**Purpose:** View and manage async coordination gates (timers, GitHub, human approval).

**CLI Commands:**
- `bd gate list --json` — list all gates
- `bd gate close <id> --reason "..."` — manually close a gate

**Files to Create:**

1. `src/lib/stores/gates.svelte.ts`
   - Interface: `Gate { id: string; awaitType: 'timer' | 'gh:run' | 'gh:pr' | 'human' | 'mail'; status: 'open' | 'closed'; createdAt: string; timeout?: string; reason?: string; waiters: string[]; }`
   - State: `items: Gate[]`, `isLoading`, `error`, `lastFetch`
   - Methods: `fetch()`, `closeGate(id, reason)`, `setItems()`
   - Derived: `open`, `closed`, `stats`

2. `src/routes/api/gastown/gates/+server.ts`
   - `GET` handler
   - CLI: `supervisor.bd(['gate', 'list', '--json'], { timeout: 15_000 })`
   - Return: `{ items: Gate[], total }`

3. `src/routes/api/gastown/gates/[id]/close/+server.ts`
   - `POST` handler
   - Body: `{ reason: string }` (validate with Zod)
   - CLI: `supervisor.bd(['gate', 'close', id, '--reason', reason], { timeout: 15_000 })`
   - Return: `{ success, message }`

4. `src/lib/components/gates/GateCard.svelte`
   - Props: `id`, `awaitType`, `status`, `createdAt`, `timeout?`, `waiters`, `onclose?`
   - Type icon: Timer (clock), GitHub (gitbranch), Human (user), Mail (mail)
   - Status: open=warning pulse, closed=green
   - Close button (if open and type allows manual close)

5. `src/lib/components/gates/index.ts`
   - Barrel export

6. `src/routes/gates/+page.svelte`
   - Header with refresh
   - Filter: All, Open, Closed
   - Stats: total, open, closed by type
   - Grid of GateCard components
   - Close gate action with reason input modal/inline

---

### Unit 8: Dog Pool

**Purpose:** Manage infrastructure worker dogs — view pool, add/remove dogs.

**CLI Commands:**
- `gt dog status` — pool overview (text)
- `gt dog list --json` — list dogs with status
- `gt dog add <name>` — spawn new dog
- `gt dog remove <name>` — retire dog

**Files to Create:**

1. `src/lib/stores/dogs.svelte.ts`
   - Interface: `Dog { name: string; status: 'idle' | 'working' | 'stuck'; currentTask?: string; startedAt?: string; duration?: string; }`
   - State: `items: Dog[]`, `isLoading`, `error`, `lastFetch`
   - Methods: `fetch()`, `addDog(name)`, `removeDog(name)`, `setItems()`
   - Derived: `idle`, `working`, `stuck`, `stats`
   - Available names: `alpha`, `bravo`, `charlie`, `delta`

2. `src/routes/api/gastown/dogs/+server.ts`
   - `GET` handler
   - CLI: `supervisor.gt(['dog', 'list', '--json'], { timeout: 15_000 })`
   - Falls back to text parse of `gt dog status`
   - Return: `{ items: Dog[], total }`

3. `src/routes/api/gastown/dogs/add/+server.ts`
   - `POST` handler
   - Body: `{ name: string }` (validate with Zod)
   - CLI: `supervisor.gt(['dog', 'add', name], { timeout: 30_000 })`
   - Return: `{ success, message }`

4. `src/routes/api/gastown/dogs/[name]/remove/+server.ts`
   - `POST` handler
   - CLI: `supervisor.gt(['dog', 'remove', name], { timeout: 30_000 })`
   - Return: `{ success, message }`

5. `src/lib/components/dogs/DogCard.svelte`
   - Props: `name`, `status`, `currentTask?`, `duration?`, `onremove?`
   - NATO phonetic name display
   - Status indicator: idle=chrome, working=green pulse, stuck=red
   - Current task display if working
   - Remove button (with confirmation)

6. `src/lib/components/dogs/index.ts`
   - Barrel export

7. `src/routes/dogs/+page.svelte`
   - Header with refresh + "Add Dog" button
   - Stats: total, idle, working, stuck
   - Grid of DogCard components
   - Add dog: select name from available names dropdown
   - Max 4 dogs enforcement in UI

---

### Unit 9: Nudge & Broadcast

**Purpose:** Send direct messages (nudges) to specific agents or broadcast to all workers.

**CLI Commands:**
- `gt nudge <agent> "<message>"` — send synchronous message to agent
- `gt broadcast "<message>"` — send to all workers

**Files to Create:**

1. `src/routes/api/gastown/agents/nudge/+server.ts`
   - `POST` handler
   - Body: `{ agent: string, message: string }` (validate with Zod)
   - CLI: `supervisor.gt(['nudge', agent, message], { timeout: 30_000 })`
   - Return: `{ success, message }`

2. `src/routes/api/gastown/agents/broadcast/+server.ts`
   - `POST` handler
   - Body: `{ message: string }` (validate with Zod)
   - CLI: `supervisor.gt(['broadcast', message], { timeout: 30_000 })`
   - Return: `{ success, message }`

3. `src/lib/components/agents/NudgeForm.svelte`
   - Props: `agents: { name: string; address: string }[]`, `onclose: () => void`
   - Agent selector dropdown (populated from agents list)
   - Message textarea
   - Send button
   - Also a "Broadcast" toggle that switches to broadcast mode (no agent selector, sends to all)

4. `src/lib/components/agents/index.ts`
   - Barrel export (new file — agents didn't have a barrel)

---

### Unit 10: Task Dependencies

**Purpose:** Show blocks/blocked_by relationships on task detail page.

**CLI Commands:**
- `bd show <id> --json` — full bead detail with dependencies

**Files to Create:**

1. `src/routes/api/gastown/work/[id]/+server.ts`
   - `GET` handler — single work item with full dependencies
   - CLI: `supervisor.bd(['show', id, '--json'], { timeout: 15_000 })`
   - Return: `{ data: WorkItemDetail }` including `blocks`, `blockedBy`, `dependencies` arrays

2. `src/lib/components/tasks/DependencyGraph.svelte`
   - Props: `taskId: string`, `blocks: string[]`, `blockedBy: string[]`
   - Visual display: "Blocked by" section listing issue IDs (links to `/tasks/<id>`)
   - "Blocks" section listing issue IDs
   - Color: blocked_by items in red/warning, blocks items in chrome
   - Simple list view (not full graph — keep it practical)

3. `src/lib/components/tasks/index.ts`
   - Barrel export (new file)

---

### Unit 11: Escalation & Town Config

**Purpose:** View escalation routes and town configuration in settings.

**CLI Commands:**
- Reads `settings/escalation.json` on disk
- Reads `mayor/town.json`, `mayor/rigs.json`, `mayor/overseer.json` on disk

**Files to Create:**

1. `src/routes/api/gastown/config/+server.ts`
   - `GET` handler — reads all config files from disk
   - Uses `getTownConfig()`, `getRegisteredRigs()`, `getDaemonConfig()` from `$lib/server/cli`
   - Also reads `settings/escalation.json` via fs
   - Return: `{ data: { town, rigs, daemon, escalation, overseer } }`

2. `src/lib/components/settings/EscalationRoutes.svelte`
   - Props: `routes: Record<string, string[]>`, `staleThreshold`, `maxReescalations`
   - Table showing severity level → notification channels
   - Color-coded rows: critical=red, high=orange, medium=yellow, low=chrome

3. `src/lib/components/settings/TownInfo.svelte`
   - Props: `name`, `owner`, `createdAt`, `rigCount`, `overseer`
   - Card showing town metadata
   - Rig count, owner info, creation date

4. `src/lib/components/settings/index.ts`
   - Barrel export

---

## Phase 2: Integration (Sequential — Single Agent)

This agent edits existing shared files to wire everything together. Run AFTER all Phase 1 agents complete.

### 2A: Update `src/lib/api/client.ts`

Add these methods to the `api` object:

```typescript
// Feed
async getFeed(since?: string, type?: string) {
  const params = new URLSearchParams();
  if (since) params.set('since', since);
  if (type) params.set('type', type);
  const query = params.toString();
  return fetchApi<unknown>(`/api/gastown/feed${query ? `?${query}` : ''}`);
},

// Formulas
async getFormulas() {
  return fetchApi<unknown>('/api/gastown/formulas');
},
async getFormula(name: string) {
  return fetchApi<unknown>(`/api/gastown/formulas/${encodeURIComponent(name)}`);
},

// Molecules
async getMolecules() {
  return fetchApi<unknown>('/api/gastown/molecules');
},
async getMolecule(id: string) {
  return fetchApi<unknown>(`/api/gastown/molecules/${encodeURIComponent(id)}`);
},

// Convoy Actions
async createConvoy(title: string, issues: string[]) {
  return fetchApi<unknown>('/api/gastown/convoys/create', {
    method: 'POST',
    body: JSON.stringify({ title, issues })
  });
},
async closeConvoy(id: string) {
  return fetchApi<unknown>(`/api/gastown/convoys/${encodeURIComponent(id)}/close`, {
    method: 'POST'
  });
},
async getConvoyDetail(id: string) {
  return fetchApi<unknown>(`/api/gastown/convoys/${encodeURIComponent(id)}`);
},

// Daemon
async getDaemonStatus() {
  return fetchApi<unknown>('/api/gastown/daemon/status');
},
async getDaemonLogs() {
  return fetchApi<unknown>('/api/gastown/daemon/logs');
},
async startServices() {
  return fetchApi<unknown>('/api/gastown/daemon/start', { method: 'POST' });
},
async stopServices() {
  return fetchApi<unknown>('/api/gastown/daemon/stop', { method: 'POST' });
},

// Health
async getHealth() {
  return fetchApi<unknown>('/api/gastown/health');
},

// Merge Queue
async getMergeQueue() {
  return fetchApi<unknown>('/api/gastown/mergequeue');
},

// Gates
async getGates() {
  return fetchApi<unknown>('/api/gastown/gates');
},
async closeGate(id: string, reason: string) {
  return fetchApi<unknown>(`/api/gastown/gates/${encodeURIComponent(id)}/close`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
},

// Dogs
async getDogs() {
  return fetchApi<unknown>('/api/gastown/dogs');
},
async addDog(name: string) {
  return fetchApi<unknown>('/api/gastown/dogs/add', {
    method: 'POST',
    body: JSON.stringify({ name })
  });
},
async removeDog(name: string) {
  return fetchApi<unknown>(`/api/gastown/dogs/${encodeURIComponent(name)}/remove`, {
    method: 'POST'
  });
},

// Nudge & Broadcast
async nudgeAgent(agent: string, message: string) {
  return fetchApi<unknown>('/api/gastown/agents/nudge', {
    method: 'POST',
    body: JSON.stringify({ agent, message })
  });
},
async broadcast(message: string) {
  return fetchApi<unknown>('/api/gastown/agents/broadcast', {
    method: 'POST',
    body: JSON.stringify({ message })
  });
},

// Work Detail
async getWorkDetail(id: string) {
  return fetchApi<unknown>(`/api/gastown/work/${encodeURIComponent(id)}`);
},

// Config
async getConfig() {
  return fetchApi<unknown>('/api/gastown/config');
},
```

### 2B: Update `src/lib/api/events.ts`

Add new SSE event types to the `SSEMessage` type union:
```typescript
type: 'agents' | 'tasks' | 'rigs' | 'mail' | 'convoys' | 'feed' | 'status' | 'heartbeat' | 'error';
```

Add `feed` event listener and handler (import `feedStore` and push new events).

### 2C: Update `src/lib/stores/index.ts`

Add all new store exports:
```typescript
export { feedStore, type FeedEvent } from './feed.svelte';
export { formulasStore, type Formula, type Molecule } from './formulas.svelte';
export { daemonStore, type DaemonStatus, type DaemonLog } from './daemon.svelte';
export { healthStore, type RigHealth, type SystemHealth } from './health.svelte';
export { mergeQueueStore, type MergeRequest } from './mergequeue.svelte';
export { gatesStore, type Gate } from './gates.svelte';
export { dogsStore, type Dog } from './dogs.svelte';
export { mailStore, type MailMessage, type MailCategory, type MailSource } from './mail.svelte';
```

### 2D: Update `src/lib/components/layout/Sidebar.svelte`

Add new nav items (insert before Settings):
```typescript
import { Activity, FlaskConical, Heart, GitMerge, Timer, Dog } from 'lucide-svelte';

// Add to navItems array (before Settings):
{ href: '/feed', label: 'Feed', icon: Activity },
{ href: '/formulas', label: 'Formulas', icon: FlaskConical },
{ href: '/health', label: 'Health', icon: Heart },
{ href: '/mergequeue', label: 'Merge Queue', icon: GitMerge },
{ href: '/gates', label: 'Gates', icon: Timer },
{ href: '/dogs', label: 'Dogs', icon: Dog },
{ href: '/daemon', label: 'Daemon', icon: Flame },
```

### 2E: Update `src/routes/settings/+page.svelte`

Import and render `EscalationRoutes` and `TownInfo` components in the settings page. Fetch config data on mount.

### 2F: Update `src/routes/tasks/[id]/+page.svelte`

Import and render `DependencyGraph` component. Fetch work detail (with dependencies) via the new API endpoint.

### 2G: Update `src/routes/convoys/+page.svelte`

Add "Create Convoy" button that shows `CreateConvoyForm`. Add "Close" action button in `ConvoyDetail` area.

### 2H: Update `src/routes/agents/+page.svelte`

Add "Nudge" and "Broadcast" buttons that show `NudgeForm`.

### 2I: Update SSE events endpoint `src/routes/api/gastown/events/+server.ts`

Add feed event polling:
```typescript
// Step 5: Fetch feed events
try {
  const feedResult = await supervisor.gt(['feed', '--plain', '--since', '5m'], { timeout: 10_000 });
  if (feedResult.success) {
    // Parse and emit feed events
    const feedHash = JSON.stringify(feedResult.data);
    if (feedHash !== prevFeedHash) {
      prevFeedHash = feedHash;
      safeEnqueue(encoder.encode(formatSSE({ type: 'feed', data: { events: parsedEvents }, timestamp: new Date().toISOString() })));
    }
  }
} catch { /* non-fatal */ }
```

### 2J: Update barrel exports for component directories

Update any existing barrel files (`src/lib/components/convoys/index.ts`, etc.) to include newly created components.

### 2K: Update `CLAUDE.md` Codebase Layout

Add new directories and files to the codebase layout section.

---

## Execution Order

```
Phase 1 (Parallel - 11 agents):
┌──────────────────────────────────────────────┐
│  Unit 1: Activity Feed                       │
│  Unit 2: Formulas & Molecules                │
│  Unit 3: Convoy Actions                      │
│  Unit 4: Daemon Controls                     │
│  Unit 5: Health Dashboard                    │
│  Unit 6: Merge Queue                         │
│  Unit 7: Gates                               │
│  Unit 8: Dog Pool                            │
│  Unit 9: Nudge & Broadcast                   │
│  Unit 10: Task Dependencies                  │
│  Unit 11: Escalation & Town Config           │
└──────────────────────────────────────────────┘
                    │
                    ▼
Phase 2 (Sequential - 1 agent):
┌──────────────────────────────────────────────┐
│  Integration: Wire up all shared files       │
│  (client.ts, events.ts, stores/index.ts,     │
│   Sidebar.svelte, settings page, tasks page, │
│   convoys page, agents page, SSE endpoint,   │
│   barrel exports, CLAUDE.md)                 │
└──────────────────────────────────────────────┘
                    │
                    ▼
Phase 3 (Validation):
┌──────────────────────────────────────────────┐
│  Build check: npm run build                  │
│  Type check: npx svelte-check                │
│  Fix any import/type errors                  │
└──────────────────────────────────────────────┘
```

---

## File Manifest

### New Files (Phase 1)

| Unit | File | Type |
|------|------|------|
| 1 | `src/lib/stores/feed.svelte.ts` | Store |
| 1 | `src/routes/api/gastown/feed/+server.ts` | API |
| 1 | `src/lib/components/feed/FeedItem.svelte` | Component |
| 1 | `src/lib/components/feed/index.ts` | Barrel |
| 1 | `src/routes/feed/+page.svelte` | Page |
| 2 | `src/lib/stores/formulas.svelte.ts` | Store |
| 2 | `src/routes/api/gastown/formulas/+server.ts` | API |
| 2 | `src/routes/api/gastown/formulas/[name]/+server.ts` | API |
| 2 | `src/routes/api/gastown/molecules/+server.ts` | API |
| 2 | `src/routes/api/gastown/molecules/[id]/+server.ts` | API |
| 2 | `src/lib/components/formulas/FormulaCard.svelte` | Component |
| 2 | `src/lib/components/formulas/MoleculeProgress.svelte` | Component |
| 2 | `src/lib/components/formulas/FormulaDetail.svelte` | Component |
| 2 | `src/lib/components/formulas/index.ts` | Barrel |
| 2 | `src/routes/formulas/+page.svelte` | Page |
| 3 | `src/routes/api/gastown/convoys/create/+server.ts` | API |
| 3 | `src/routes/api/gastown/convoys/[id]/close/+server.ts` | API |
| 3 | `src/routes/api/gastown/convoys/[id]/+server.ts` | API |
| 3 | `src/lib/components/convoys/CreateConvoyForm.svelte` | Component |
| 4 | `src/lib/stores/daemon.svelte.ts` | Store |
| 4 | `src/routes/api/gastown/daemon/status/+server.ts` | API |
| 4 | `src/routes/api/gastown/daemon/logs/+server.ts` | API |
| 4 | `src/routes/api/gastown/daemon/start/+server.ts` | API |
| 4 | `src/routes/api/gastown/daemon/stop/+server.ts` | API |
| 4 | `src/lib/components/daemon/DaemonStatusCard.svelte` | Component |
| 4 | `src/lib/components/daemon/PatrolConfig.svelte` | Component |
| 4 | `src/lib/components/daemon/DaemonLogs.svelte` | Component |
| 4 | `src/lib/components/daemon/index.ts` | Barrel |
| 4 | `src/routes/daemon/+page.svelte` | Page |
| 5 | `src/lib/stores/health.svelte.ts` | Store |
| 5 | `src/routes/api/gastown/health/+server.ts` | API |
| 5 | `src/lib/components/health/RigHealthCard.svelte` | Component |
| 5 | `src/lib/components/health/SystemOverview.svelte` | Component |
| 5 | `src/lib/components/health/DiagnosticsPanel.svelte` | Component |
| 5 | `src/lib/components/health/index.ts` | Barrel |
| 5 | `src/routes/health/+page.svelte` | Page |
| 6 | `src/lib/stores/mergequeue.svelte.ts` | Store |
| 6 | `src/routes/api/gastown/mergequeue/+server.ts` | API |
| 6 | `src/lib/components/mergequeue/MergeRequestItem.svelte` | Component |
| 6 | `src/lib/components/mergequeue/MergeRequestDetail.svelte` | Component |
| 6 | `src/lib/components/mergequeue/index.ts` | Barrel |
| 6 | `src/routes/mergequeue/+page.svelte` | Page |
| 7 | `src/lib/stores/gates.svelte.ts` | Store |
| 7 | `src/routes/api/gastown/gates/+server.ts` | API |
| 7 | `src/routes/api/gastown/gates/[id]/close/+server.ts` | API |
| 7 | `src/lib/components/gates/GateCard.svelte` | Component |
| 7 | `src/lib/components/gates/index.ts` | Barrel |
| 7 | `src/routes/gates/+page.svelte` | Page |
| 8 | `src/lib/stores/dogs.svelte.ts` | Store |
| 8 | `src/routes/api/gastown/dogs/+server.ts` | API |
| 8 | `src/routes/api/gastown/dogs/add/+server.ts` | API |
| 8 | `src/routes/api/gastown/dogs/[name]/remove/+server.ts` | API |
| 8 | `src/lib/components/dogs/DogCard.svelte` | Component |
| 8 | `src/lib/components/dogs/index.ts` | Barrel |
| 8 | `src/routes/dogs/+page.svelte` | Page |
| 9 | `src/routes/api/gastown/agents/nudge/+server.ts` | API |
| 9 | `src/routes/api/gastown/agents/broadcast/+server.ts` | API |
| 9 | `src/lib/components/agents/NudgeForm.svelte` | Component |
| 9 | `src/lib/components/agents/index.ts` | Barrel |
| 10 | `src/routes/api/gastown/work/[id]/+server.ts` | API |
| 10 | `src/lib/components/tasks/DependencyGraph.svelte` | Component |
| 10 | `src/lib/components/tasks/index.ts` | Barrel |
| 11 | `src/routes/api/gastown/config/+server.ts` | API |
| 11 | `src/lib/components/settings/EscalationRoutes.svelte` | Component |
| 11 | `src/lib/components/settings/TownInfo.svelte` | Component |
| 11 | `src/lib/components/settings/index.ts` | Barrel |

### Modified Files (Phase 2 Only)

| File | Changes |
|------|---------|
| `src/lib/api/client.ts` | Add ~20 new API methods |
| `src/lib/api/events.ts` | Add feed event type + handler |
| `src/lib/stores/index.ts` | Add 7 new store exports + mailStore |
| `src/lib/components/layout/Sidebar.svelte` | Add 7 new nav items |
| `src/routes/settings/+page.svelte` | Add escalation + town config sections |
| `src/routes/tasks/[id]/+page.svelte` | Add dependency graph |
| `src/routes/convoys/+page.svelte` | Add create/close convoy actions |
| `src/routes/agents/+page.svelte` | Add nudge/broadcast buttons |
| `src/routes/api/gastown/events/+server.ts` | Add feed event polling |
| `src/lib/components/convoys/index.ts` | Add CreateConvoyForm export |
| `.claude/CLAUDE.md` | Update codebase layout |

**Total: 62 new files, 11 modified files**
