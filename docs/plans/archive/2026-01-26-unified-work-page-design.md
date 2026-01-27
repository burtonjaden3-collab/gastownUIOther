# Unified Work Page Design

Consolidate Tasks, Convoys, and Slinging into a single `/work` page with three tabs, a shared action bar, two-panel layout, and a collapsible activity log.

## Motivation

Tasks, Convoys, and Slinging are currently scattered across three nav items and two sidebar groups:
- **New Task** and **Queue** in Command group
- **Convoys** in Fleet group
- **Sling** buried inside the Rigs page detail panel

These features are tightly related: tasks are work units, convoys group them, slinging assigns them to rigs. The create → queue → sling → track workflow requires 3-4 page hops. Users shouldn't have to navigate between pages to manage work.

## Navigation Change

**Before:**
```
Command:  Dashboard, New Task, Queue, Messages
Fleet:    Rigs, Agents, Convoys
```

**After:**
```
Command:  Dashboard, Work (badge: pending count), Messages
Fleet:    Rigs, Agents
```

Single sidebar entry at `/work` replaces `/tasks`, `/submit`, and `/convoys`. Uses `Flame` icon (work/fire metaphor).

## Page Layout

```
┌─────────────────────────────────────────────────────┐
│  WORK                          [selection count]    │
│  [+ New Task]  [+ New Convoy]  [Clear]              │  Action bar
│                                                     │
│  ┌──────────┬──────────┬──────────┐                 │
│  │  Queue   │  Sling   │ Convoys  │                 │  Tabs
│  └──────────┴──────────┴──────────┘                 │
│  ┌─────────────────────┬───────────────────────────┐│
│  │                     │                           ││
│  │   List panel        │   Detail / Form panel     ││  Two-panel
│  │   (filtered items)  │   (selected item or form) ││
│  │                     │                           ││
│  └─────────────────────┴───────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │  ▾ Activity Log  (collapsible)                  ││  Activity sidebar
│  │  • Task "fix auth" slung to rig-1 — 2m ago     ││
│  │  • Convoy "sprint-4" created — 5m ago           ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

URL scheme: `/work?tab=queue` (default), `/work?tab=sling`, `/work?tab=convoys`. Tabs are query-param driven for bookmarkability.

## Queue Tab (Default)

Shows the task list from `tasksStore`. Combines task viewing and creation in one place.

### Stats Bar
```
12 Total  ·  5 Pending  ·  3 Running  ·  2 Blocked  ·  2 Done
```
Each stat is a clickable filter pill.

### Task Rows
- Checkbox (left edge) for bulk selection
- Status badge
- Title
- Type chip (code / data / general)
- Assignee or "unassigned"
- Age

"Select all visible" checkbox in the list header.

### Quick Actions (hover/focus per row)
- **Sling** → switches to Sling tab with this task pre-selected
- **Add to Convoy** → dropdown of open convoys + "New Convoy" option
- **View Detail** → expands in right panel

### Right Panel
Shows detail of selected task: title, description, status, priority, labels, assignee, timestamps. For pending/unassigned tasks, shows a hint: "Ready to sling — use the Sling tab or hover action."

### New Task Creation
**"+ New Task" button** in the action bar opens a slide-out panel on the right with the task creation form (type selector, title, description — same fields as current `/submit`).

### Bulk Selection
- Checkboxes enable selecting multiple tasks
- Selection count appears in action bar
- Bulk actions: **+ New Convoy** (pre-fills selected task IDs)
- Selection persists across filter changes, clears on tab switch
- Multi-select right panel shows summary: "3 tasks selected — 2 pending, 1 running"

## Sling Tab

Dedicated assignment view — pick a task, pick a target, fire. Two-column split panel.

### Left Column — Task Picker
- Filtered list showing only **unassigned pending tasks**
- Each item shows: title, type icon, priority, age
- Click to select (highlighted border)
- Search/filter bar at top for quick lookup by title or ID
- If user arrived via "Sling" quick action from Queue tab, the task is pre-selected

### Right Column — Target Picker + Action
- **Rig selector** — dropdown of running rigs (from `rigsStore`)
- Once rig is selected, shows available targets:
  - "Auto (spawn polecat)" — default option
  - List of crew members and witnesses on that rig
- **Sling button** — prominent action button, disabled until both task and target are selected
- On success: toast notification, task disappears from left column (now assigned), auto-selects next pending task if available

### Empty States
- No pending tasks → "All caught up. No unassigned tasks in the queue."
- No running rigs → "No rigs are running. Start a rig from the Fleet page first."

## Convoys Tab

Shows the convoy list from `convoyStore`. Same split-panel pattern.

### Left Panel — Convoy List
- Status filter pills: All | Open | Active | Closed | Blocked
- Stats bar: total convoys, total tracked items
- **"+ New Convoy" button** — opens create form (title + issue IDs)
- Convoy cards showing: title, status badge, tracked count, age

### Right Panel — Convoy Detail
- Selected convoy's full info
- List of tracked items with their individual statuses
- **"Close Convoy" button** when status is open

## Activity Log (Collapsible Bottom Panel)

Persistent across all tabs. Shows recent work-related events:
- Task creation, status changes
- Sling assignments
- Convoy creation/closure

Collapsed by default with a toggle arrow. Shows last ~10 events. Lightweight — scoped to work actions only (not the full system feed from `/feed`).

## Action Bar Behavior

| Button | Queue Tab | Sling Tab | Convoys Tab |
|--------|-----------|-----------|-------------|
| + New Task | Right panel → task form | Disabled | Right panel → task form |
| + New Convoy | Right panel → convoy form (pre-fills if tasks selected) | Disabled | Right panel → convoy form |
| Clear | Visible when selection active | — | — |

The Sling tab has its own dedicated sling UI, so the action bar buttons are minimal there.

## Component Architecture

### New Components (`src/lib/components/work/`)

| Component | Responsibility |
|-----------|---------------|
| `WorkPage.svelte` | Orchestrates tabs, action bar, two-panel layout, selection state, activity log |
| `WorkActionBar.svelte` | Action buttons, selection count, context-aware enable/disable |
| `WorkTabs.svelte` | Tab strip rendering and active tab state |
| `TaskList.svelte` | Scrollable task list with checkboxes, status filter, stats bar |
| `TaskRow.svelte` | Single task row with checkbox, status, title, meta |
| `TaskDetail.svelte` | Right panel task detail view |
| `TaskCreateForm.svelte` | Right panel new task form (replaces /submit page) |
| `SlingPanel.svelte` | Full Sling tab: task picker (left) + target picker (right) |
| `SlingTargetPicker.svelte` | Rig selector, target selector, sling button |
| `ConvoyList.svelte` | Scrollable convoy list with status filter, stats bar |
| `ConvoyRow.svelte` | Single convoy row |
| `ConvoyCreateForm.svelte` | Right panel convoy creation form |
| `ActivityLog.svelte` | Collapsible bottom panel with recent work events |

### Reused Existing Code
- `tasksStore`, `convoyStore`, `rigsStore` — no changes needed
- Status badges, type chips from existing core components
- `CreateConvoyForm` logic adapted into `ConvoyCreateForm`
- `SlingForm` logic adapted into `SlingPanel` / `SlingTargetPicker`
- API client methods unchanged

## Route Changes

| Old Route | New Route | Behavior |
|-----------|-----------|----------|
| `/tasks` | `/work` | Redirect → Queue tab |
| `/submit` | `/work?action=new` | Redirect → Queue tab with task form open |
| `/convoys` | `/work?tab=convoys` | Redirect → Convoys tab |
| `/tasks/[id]` | `/work/[id]` | Task detail with dependency graph (deep view) |

Old routes serve redirects for bookmarks/links.

## Data Flow

```
tasksStore ──────┐
                 ├──→ WorkPage ──→ tabs + panels + activity log
convoyStore ─────┤
                 │
rigsStore ───────┘  (for sling tab rig/agent dropdowns)
```

- All stores fetched on page mount
- SSE events continue updating stores in real-time
- Selection state is local to WorkPage (not in stores)
- Tab and action query params in URL for deep linking
- Activity log subscribes to work-related feed events

## Styling

- Uses existing Gas Town theme tokens (rust, oil, chrome, flame, exhaust)
- Two-panel layout matches existing rigs/convoys page pattern
- Tabs use `font-display` for labels
- Action bar uses `chrome` border with `oil-800` background
- Selected rows use `chrome/10` highlight
- Checkbox uses `flame` accent color
- Activity log uses `oil-900` background with `exhaust-500` text, `chrome` border-top
- Sling tab's sling button uses `flame` gradient for emphasis
