# Rigs Tab Design

## Overview

A management page for rigs at `/rigs` with hierarchical tree navigation and context-sensitive detail panel. Supports rig lifecycle control, work slinging, and crew management.

## Page Layout

**Route:** `/rigs`

```
┌─────────────────────────────────────────────────────┐
│ Header: "Rigs" + subtitle + Refresh button          │
├────────────────────┬────────────────────────────────┤
│                    │                                │
│   Rig Tree         │   Detail Panel                 │
│   (~300px)         │   (flex-1)                     │
│                    │                                │
└────────────────────┴────────────────────────────────┘
```

- Tree panel: Fixed width ~300px, `bg-oil-900`, independent scroll
- Detail panel: Remaining space, content based on selection
- Empty state: "Select a rig or agent to view details"

## Tree Structure

Three-level hierarchy: Rig → Agent Type → Agent Instance

### Level 1 - Rig Node
```
▼ ● Metals_Tracker     [ACTIVE]
```
- Expand/collapse chevron
- Status dot (green=active, yellow=parked, red=error, gray=docked)
- Rig name (clickable)
- Status badge

### Level 2 - Agent Type Node
```
  ▼ Polecats (3)
```
- Indented with chevron
- Type icon (bot=polecats, eye=witness, factory=refinery, users=crews)
- Type label + count
- Non-selectable grouping node

### Level 3 - Agent Instance Node
```
    ● polecat-alpha     [BUSY]
```
- Further indented
- Status dot (green=idle, orange=busy, red=stalled, gray=offline)
- Agent name (clickable)
- Optional status badge

### Interaction
- Single click: Select and show details
- Double-click or chevron: Expand/collapse
- Selected highlight: `bg-rust-600/20` with left border

## Detail Panel Content

### Rig Selected
```
┌─────────────────────────────────────────┐
│ Metals_Tracker                  [ACTIVE]│
│ Added: Jan 25, 2026                     │
├─────────────────────────────────────────┤
│ [4 Polecats] [2 Crews] [Witness ●] [Refinery ●]│
├─────────────────────────────────────────┤
│ Actions:                                │
│ [Start] [Stop] [Park] [Restart]         │
│ [Sling Work...]                         │
├─────────────────────────────────────────┤
│ Configuration:                          │
│ max_polecats: 10                        │
│ auto_restart: true                      │
└─────────────────────────────────────────┘
```

### Agent Selected
```
┌─────────────────────────────────────────┐
│ polecat-alpha                    [BUSY] │
│ Role: polecat • Rig: Metals_Tracker     │
├─────────────────────────────────────────┤
│ Current Work:                           │
│ "Fix authentication bug" (mt-4fy)       │
├─────────────────────────────────────────┤
│ Actions: [Unsling] [Nuke]               │
└─────────────────────────────────────────┘
```

### Crew Selected
```
┌─────────────────────────────────────────┐
│ crew-jaden                      [ACTIVE]│
│ Rig: Metals_Tracker • Branch: main      │
├─────────────────────────────────────────┤
│ Actions:                                │
│ [Start] [Stop] [Attach]                 │
│ [Refresh] [Remove]                      │
└─────────────────────────────────────────┘
```

## Sling Work Flow

Inline form (not modal) expands below actions:

```
┌─────────────────────────────────────────┐
│ Sling Work to Metals_Tracker            │
├─────────────────────────────────────────┤
│ Bead ID or search: [mt-4fy        🔍]   │
│                                         │
│ Or select from queue:                   │
│ ○ mt-4fy  "Fix auth bug"        P1     │
│ ○ mt-9ds  "Add logging"         P2     │
│                                         │
│ Target: [Auto (spawn polecat)    ▼]     │
│                                         │
│ [Cancel] [Sling]                        │
└─────────────────────────────────────────┘
```

- Shows unassigned beads filtered to selected rig
- Target options: Auto (default), specific crew, witness
- Executes: `gt sling <bead> <rig>` or `gt sling <bead> --agent <agent>`

## Data & State

### New Store: `rigs.svelte.ts`

```typescript
interface Rig {
  name: string;
  status: 'active' | 'parked' | 'docked' | 'error';
  addedAt: string;
  gitUrl: string;
  hasWitness: boolean;
  hasRefinery: boolean;
  polecatCount: number;
  crewCount: number;
  agents: Agent[];
}
```

### Data Sources
- Read: Existing `/api/gastown/status` endpoint (returns rigs array)
- Live updates: Existing SSE `/api/gastown/events`
- No new read endpoints needed

### Action Endpoints (new)
```
POST /api/gastown/rigs/[name]/start
POST /api/gastown/rigs/[name]/stop
POST /api/gastown/rigs/[name]/park
POST /api/gastown/rigs/[name]/sling   { beadId, target? }
POST /api/gastown/rigs/[name]/unsling { beadId }
POST /api/gastown/crews/[name]/start
POST /api/gastown/crews/[name]/stop
```

Each wraps corresponding `gt` CLI command via ProcessSupervisor.

## File Structure

### New Files
```
src/
├── lib/
│   ├── stores/
│   │   └── rigs.svelte.ts
│   └── components/
│       └── rigs/
│           ├── index.ts
│           ├── RigTree.svelte
│           ├── RigNode.svelte
│           ├── AgentTypeNode.svelte
│           ├── AgentNode.svelte
│           ├── RigDetail.svelte
│           ├── AgentDetail.svelte
│           ├── CrewDetail.svelte
│           └── SlingForm.svelte
└── routes/
    ├── rigs/
    │   └── +page.svelte
    └── api/gastown/
        ├── rigs/[name]/
        │   ├── start/+server.ts
        │   ├── stop/+server.ts
        │   ├── park/+server.ts
        │   ├── sling/+server.ts
        │   └── unsling/+server.ts
        └── crews/[name]/
            ├── start/+server.ts
            └── stop/+server.ts
```

### Modified Files
- `src/lib/components/layout/Sidebar.svelte` - Add Rigs nav item
- `src/lib/stores/index.ts` - Export rigsStore

## Loading & Error States

### Tree Loading
- Initial: Skeleton nodes (3-4 pulsing bars)
- Refresh: Subtle header spinner, tree stays interactive

### Action Feedback
- Buttons show spinner + disable during execution
- Success: Toast notification + tree updates via SSE
- Error: Inline red message below actions, dismissable

### Confirmations
Required for: `Stop`, `Nuke`, `Remove`
Not required for: `Park`, `Dock`, `Sling`, `Unsling`

### Stale State
- SSE disconnect: Warning banner "Connection lost - data may be stale"
- Actions still allowed with warning in confirmation

### Empty States
- No rigs: "No rigs configured. Add one with `gt rig add <name> <url>`"
- No polecats/crews: Show "(0)" collapsed, non-expandable

## Navigation

Add to Sidebar.svelte between "Agents" and "Settings":
```typescript
{ href: '/rigs', label: 'Rigs', icon: Boxes }
```

## CLI Commands Used

| Action | Command |
|--------|---------|
| Start rig | `gt rig start <name>` |
| Stop rig | `gt rig stop <name>` |
| Park rig | `gt rig park <name>` |
| Restart rig | `gt rig restart <name>` |
| Sling work | `gt sling <bead> <rig>` or `gt sling <bead> --agent <agent>` |
| Unsling work | `gt unsling <bead>` |
| Nuke polecat | `gt polecat nuke <name>` |
| Start crew | `gt crew start <name>` |
| Stop crew | `gt crew stop <name>` |
| Remove crew | `gt crew remove <name>` |
