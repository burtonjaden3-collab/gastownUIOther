# Agents Page: Filter by Rig

## Overview

Add a rig-based filter to the Agents page so users can scope the agent grid, role filters, and stats cards to a specific rig. Rig filter options update dynamically as rigs are added or removed.

## Data Flow

- **Rig list source**: Derived from `rigsStore.rigs` (already loaded via SSE in root layout). Reactive — pills appear/disappear as rigs change.
- **Agent-to-rig mapping**: `Agent.rig?: string` field on each agent in `agentsStore.items`.
- **Filter state**: Two local reactive values on the agents page:
  - `selectedRig: string | null` — `null` means "All Rigs"
  - `selectedRole: AgentRole | null` — already exists
- **Filtered agents**: Single `$derived` applying rig filter first, then role filter. Stats compute from this same list.
- No new stores, API calls, or components needed.

## UI Layout

```
┌──────────────────────────────────────────────┐
│  Agents                          [Refresh]   │
├──────────────────────────────────────────────┤
│  [Total: N]  [Online: N]  [Busy: N]  [Load]  │  ← stats scoped to filters
├──────────────────────────────────────────────┤
│  [All Rigs] [rig-alpha] [rig-beta] [rig-γ]   │  ← NEW rig filter pills
├──────────────────────────────────────────────┤
│  [All] [Polecats(n)] [Witness(n)] [Deacon…]  │  ← existing role filter (counts scoped to rig)
├──────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │ Agent   │ │ Agent   │ │ Agent   │        │  ← filtered grid
│  └─────────┘ └─────────┘ └─────────┘        │
└──────────────────────────────────────────────┘
```

- Rig pills styled identically to existing role pills (active: theme highlight, inactive: muted)
- "All Rigs" always present as first pill, selected by default
- One pill per rig from `rigsStore.rigs`

## Implementation

### File: `src/routes/agents/+page.svelte`

Single file change. No new components, stores, or API routes.

#### State additions

```typescript
let selectedRig: string | null = $state(null);
```

#### Derived values

```typescript
// Available rig names (reactive to rig additions/removals)
let rigNames = $derived(rigsStore.rigs.map(r => r.name));

// Combined filter: rig first, then role
let filteredAgents = $derived.by(() => {
  let result = agentsStore.items;
  if (selectedRig) {
    result = result.filter(a => a.rig === selectedRig);
  }
  if (selectedRole) {
    result = result.filter(a => a.role === selectedRole);
  }
  return result;
});
```

#### Edge case: selected rig removed

```typescript
$effect(() => {
  if (selectedRig && !rigNames.includes(selectedRig)) {
    selectedRig = null;
  }
});
```

#### Role badge counts

Per-role counts must be computed from the rig-filtered subset (not global), so selecting a rig updates the role pill badges.

#### Stats cards

Total, Online, Busy, and Average Load all computed from `filteredAgents`. No changes to the card components themselves — just the data source.

### Behaviors

| Scenario | Result |
|---|---|
| Page load | "All Rigs" selected, all agents shown |
| Click rig pill | Filter agents to that rig, update stats + role counts |
| Click selected rig pill | Deselect, return to "All Rigs" |
| Click "All Rigs" | Clear rig filter |
| Rig added (via SSE) | New pill appears in rig row |
| Rig removed (via SSE) | Pill disappears; if it was selected, reset to "All Rigs" |
| Rig selected + role selected | Both filters apply (intersection) |
| Selected rig has 0 agents | Grid empty, all role counts show 0, stats show 0 |
