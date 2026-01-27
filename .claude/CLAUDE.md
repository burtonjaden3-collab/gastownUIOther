# Project Instructions

## Codebase Layout

```
gastownUIOther/                            # Gas Town UI - SvelteKit 2 + Svelte 5 + Tailwind
├── package.json                           # Dependencies: SvelteKit 2.x, Svelte 5, Tailwind, Lucide icons
├── svelte.config.js                       # SvelteKit config
├── vite.config.ts                         # Vite bundler config
├── tsconfig.json                          # TypeScript strict mode
├── tailwind.config.js                     # Gas Town theme (rust, oil, chrome, flame, exhaust)
├── postcss.config.js                      # PostCSS for Tailwind
│
├── src/
│   ├── app.html                           # HTML entry point
│   ├── app.css                            # Global styles
│   ├── app.d.ts                           # Global type declarations
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts                  # Fetch wrapper for all API endpoints
│   │   │   └── events.ts                  # SSE event streaming client (agents, tasks, rigs, mail, convoys, feed)
│   │   │
│   │   ├── components/
│   │   │   ├── core/                      # Badge, Button, Card, ConfirmDialog, ErrorAlert, Input, Select, Textarea
│   │   │   ├── layout/                    # Breadcrumb, Header, Sidebar
│   │   │   ├── rigs/                      # RigTree, RigNode, RigDetail, CrewDetail, AgentNode,
│   │   │   │                              #   AgentTypeNode, AgentDetail, SlingForm, AddRigForm,
│   │   │   │                              #   AddCrewForm
│   │   │   ├── convoys/                   # ConvoyItem, ConvoyDetail, CreateConvoyForm
│   │   │   ├── mail/                      # MessageCard, ComposeForm, MessageDetail
│   │   │   ├── status/                    # StatusLight, ConnectionStatus, AgentCard, Gauge, TaskQueueItem
│   │   │   ├── forms/                     # Form-specific components
│   │   │   ├── agents/                    # NudgeForm (nudge/broadcast)
│   │   │   ├── feed/                      # FeedItem (activity events, used in dashboard)
│   │   │   ├── daemon/                    # DaemonStatusCard, PatrolConfig, DaemonLogs
│   │   │   ├── health/                    # RigHealthCard, SystemOverview, DiagnosticsPanel
│   │   │   ├── mergequeue/                # MergeRequestItem, MergeRequestDetail
│   │   │   ├── gates/                     # GateCard
│   │   │   ├── dogs/                      # DogCard
│   │   │   ├── work/                      # WorkPage, WorkTabs, WorkActionBar, TaskList,
│   │   │   │                              #   TaskRow, TaskDetail, TaskCreateForm, SlingPanel,
│   │   │   │                              #   SlingTargetPicker, ConvoyList, ConvoyRow,
│   │   │   │                              #   ConvoyCreateForm, ActivityLog
│   │   │   ├── tasks/                     # DependencyGraph
│   │   │   ├── wasteland/                 # WastelandHero (3D hero scene: desert, citadel, sky)
│   │   │   │   ├── Vehicle.svelte         #   Procedural vehicle mesh (status-based colors)
│   │   │   │   ├── VehicleExhaust.svelte  #   Exhaust particle emitter for vehicles
│   │   │   │   ├── VehicleConvoy.svelte   #   Maps tasks to positioned vehicles
│   │   │   │   ├── WarBoy.svelte          #   Agent humanoid figure (capsule+sphere)
│   │   │   │   ├── WarBoyManager.svelte   #   Maps agents to WarBoy figures
│   │   │   │   └── particles/             #   Particle systems
│   │   │   │       ├── DustSystem.svelte  #     Ambient desert dust (load-reactive)
│   │   │   │       └── SparkSystem.svelte #     Critical load spark bursts
│   │   │   └── settings/                  # EscalationRoutes, TownInfo
│   │   │
│   │   ├── stores/
│   │   │   ├── index.ts                   # Barrel exports for all stores
│   │   │   ├── rigs.svelte.ts             # Rig state store (Svelte 5 runes)
│   │   │   ├── agents.svelte.ts           # Agent state store
│   │   │   ├── tasks.svelte.ts            # Task queue store
│   │   │   ├── convoys.svelte.ts          # Convoy tracking store
│   │   │   ├── mail.svelte.ts             # Mail inbox store (13 categories, 3 sources)
│   │   │   ├── feed.svelte.ts             # Activity feed event store
│   │   │   ├── daemon.svelte.ts           # Daemon status + logs store
│   │   │   ├── health.svelte.ts           # System health + rig diagnostics store
│   │   │   ├── mergequeue.svelte.ts       # Merge queue (refinery) store
│   │   │   ├── gates.svelte.ts            # Async coordination gates store
│   │   │   ├── dogs.svelte.ts             # Dog pool management store
│   │   │   └── settings.svelte.ts        # User preferences store (localStorage-persisted)
│   │   │
│   │   ├── server/cli/                    # Server-side gt CLI integration
│   │   │   ├── process-supervisor.ts      # Process supervisor for gt commands
│   │   │   ├── circuit-breaker.ts         # Circuit breaker for CLI reliability
│   │   │   ├── concurrency-limiter.ts     # Concurrency control
│   │   │   ├── contracts.ts               # Interface definitions
│   │   │   └── town-config.ts             # On-disk config reader (rigs.json, daemon.json, rig status parser)
│   │   │
│   │   └── utils/
│   │       └── cn.ts                      # Class name merger (clsx + tailwind-merge)
│   │
│   └── routes/
│       ├── +layout.svelte                 # Root layout: sidebar + SSE connection
│       ├── +page.svelte                   # Dashboard home (includes Recent Activity feed)
│       ├── work/+page.svelte              # Unified work page (queue, sling, convoys tabs)
│       ├── work/[id]/+page.svelte         # Task detail + dependency graph
│       ├── agents/+page.svelte            # Agent list + nudge/broadcast controls
│       ├── rigs/+page.svelte              # Rig tree with detail panels
│       ├── tasks/+page.svelte             # (redirect → /work?tab=queue)
│       ├── tasks/[id]/                    # Task detail + dependency graph (legacy)
│       ├── convoys/+page.svelte           # (redirect → /work?tab=convoys)
│       ├── messages/+page.svelte          # Mayor's escalation inbox (mail from witness/deacon/dogs)
│       ├── settings/+page.svelte          # App settings + escalation routes + town info
│       ├── submit/+page.svelte            # (redirect → /work?tab=queue&action=new)
│       ├── daemon/+page.svelte            # Daemon status, controls, patrols, logs
│       ├── health/+page.svelte            # System health dashboard + diagnostics
│       ├── mergequeue/+page.svelte        # Merge queue (refinery) viewer
│       ├── gates/+page.svelte             # Async coordination gates
│       ├── dogs/+page.svelte              # Dog pool management
│       │
│       └── api/gastown/                   # Server-side API route handlers
│           ├── status/+server.ts          # GET  system status
│           ├── events/+server.ts          # GET  SSE event stream (agents, tasks, rigs, mail, convoys, feed, mergequeue, gates, dogs)
│           ├── work/+server.ts            # GET  work items
│           ├── work/[id]/+server.ts       # GET  work item detail with dependencies
│           ├── agents/+server.ts          # GET  agents list
│           ├── agents/[name]/unsling/     # POST unsling agent
│           ├── agents/nudge/              # POST nudge specific agent
│           ├── agents/broadcast/          # POST broadcast to all workers
│           ├── rigs/add/                  # POST add new rig (name, gitUrl, branch?, prefix?)
│           ├── rigs/[name]/start/         # POST start rig
│           ├── rigs/[name]/stop/          # POST stop rig
│           ├── rigs/[name]/restart/       # POST restart rig
│           ├── rigs/[name]/park/          # POST park rig
│           ├── rigs/[name]/sling/         # POST sling work to rig
│           ├── rigs/[name]/crew/add/      # POST add crew worker to rig
│           ├── crews/[name]/start/        # POST start crew
│           ├── crews/[name]/stop/         # POST stop crew
│           ├── crews/[name]/refresh/      # POST refresh crew
│           ├── crews/[name]/remove/       # POST remove crew
│           ├── convoys/+server.ts         # GET  convoy list
│           ├── convoys/create/            # POST create convoy
│           ├── convoys/[id]/+server.ts    # GET  convoy detail
│           ├── convoys/[id]/close/        # POST close convoy
│           ├── feed/+server.ts            # GET  activity feed events
│           ├── formulas/+server.ts        # GET  formula list
│           ├── formulas/[name]/+server.ts # GET  formula detail
│           ├── molecules/+server.ts       # GET  active molecules
│           ├── molecules/[id]/+server.ts  # GET  molecule detail
│           ├── daemon/status/             # GET  daemon status
│           ├── daemon/logs/               # GET  daemon logs
│           ├── daemon/start/              # POST start services (gt up)
│           ├── daemon/stop/               # POST stop services (gt down)
│           ├── health/+server.ts          # GET  system health + diagnostics
│           ├── mergequeue/+server.ts      # GET  merge queue items
│           ├── gates/+server.ts           # GET  gate list
│           ├── gates/[id]/close/          # POST close gate
│           ├── dogs/+server.ts            # GET  dog pool
│           ├── dogs/add/                  # POST add dog
│           ├── dogs/[name]/remove/        # POST remove dog
│           ├── config/+server.ts          # GET  town configuration
│           ├── mail/+server.ts            # GET  inbox messages
│           ├── mail/send/                 # POST send mail
│           ├── mail/[id]/+server.ts       # GET  single message
│           ├── mail/[id]/read/            # POST mark message read
│           ├── mail/[id]/archive/         # POST archive message
│           └── mail/[id]/reply/           # POST reply to message
│
├── static/
│   └── favicon.png
│
└── docs/
    └── plans/                             # Design and implementation plans
        └── archive/                       # Completed/implemented plans
```

## Tech Stack

- **Framework**: SvelteKit 2.x with Svelte 5 (runes for reactivity)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS with custom Gas Town dark theme
- **Icons**: Lucide Svelte
- **Build**: Vite
- **Real-time**: Server-Sent Events (SSE)
- **Backend integration**: `gt` CLI via ProcessSupervisor (server-side)

## Critical Rules

### Svelte 5 Runes Only
- Use `$state`, `$derived`, `$effect`, `$bindable`, `$props()` exclusively — no legacy `let` reactivity, `$:`, or `on:` directives
- Component content uses Svelte 5 snippets (`{@render children()}`) — never `<slot>`
- Event handlers are callback props (`onclick`) — never `on:click`

### Component Conventions
- Props defined via `interface Props` + destructured `$props()` with defaults
- Keep components under 150 lines — split if larger
- Use barrel exports (`index.ts`) per feature directory
- Import from `$lib/` alias — never relative paths to lib

### Store Pattern
- Stores are classes with private `#state = $state<T>(...)` encapsulation
- Expose data via getters, mutations via named methods
- One store per domain (`rigs.svelte.ts`, `agents.svelte.ts`, etc.)

### Styling
- Use Gas Town theme tokens (`rust`, `oil`, `chrome`, `flame`, `exhaust`, `warning`) — don't introduce raw colors
- Use `tailwind-variants` (`tv()`) for component variant styling
- Use `cn()` utility from `$lib/utils/cn.ts` for dynamic class merging
- Font families: `font-display` (Space Grotesk), `font-body` (Inter), `font-mono` (JetBrains Mono), `font-stencil` (Bebas Neue)

### TypeScript
- Strict mode — no `any` without eslint-disable comment and justification
- Explicit interfaces for all component props and API responses
- Discriminated unions for state variants (e.g., `Selection`)
- Generics for reusable patterns (`fetchApi<T>`, `CLIResult<T>`)

## Security Rules

### CLI Command Execution
- Always use `execFile()` with array args — never `exec()` or string concatenation
- Commands go through `ProcessSupervisor` with concurrency limiting and circuit breaker
- All commands have a 30s default timeout — override explicitly if needed
- Process cleanup on destroy — no orphaned child processes

### Input Validation
- Validate all CLI output with Zod schemas via `parseCliOutput()`
- Use `encodeURIComponent()` for all dynamic URL path segments
- No user input directly interpolated into commands or URLs

### Secrets
- No hardcoded secrets, API keys, or credentials in source
- Environment variables for all sensitive configuration

## GT Backend Reference

The UI wraps the `gt` CLI (Go binary at `/home/jaden-burton/go/bin/gt`). Source code lives at `/home/jaden-burton/gt/` — explore it when you need to understand backend behavior, data shapes, or available commands.

### Architecture: Zero File Coordinates (ZFC)

Running state is **not stored in files** — it's derived from:
- **tmux sessions** (agent processes)
- **Beads** (`bd` CLI, git-backed issue tracking)
- **JSONL logs** (activity history)

This means crash recovery is reliable without complex state files.

### Source Layout (`/home/jaden-burton/gt/`)

```
mayor/              # Town identity: town.json, config.json, daemon.json, rigs.json
settings/           # Agent presets, escalation routes, agents.json
daemon/             # Daemon lock, logs, state
deacon/             # Heartbeat/health monitoring agent
plugins/            # Plugin system
logs/               # Activity logs
test_rig_1/         # Example rig directory
```

The Go source is in the `gt` binary's repo (internal packages):
- `internal/cmd/` — 87+ CLI commands
- `internal/rig/` — Project container management
- `internal/polecat/` — Ephemeral worker agent lifecycle
- `internal/crew/` — Persistent user workspaces
- `internal/daemon/` — Background service coordinator
- `internal/deacon/` — Heartbeat/health monitoring
- `internal/witness/` — Polecat monitoring & spawn
- `internal/refinery/` — Merge queue processor
- `internal/mail/` — Cross-agent messaging
- `internal/convoy/` — Work batch tracking
- `internal/formula/` — Template-based work system
- `internal/dog/` — Dog pool management
- `internal/gate/` — Async coordination gates
- `internal/feed/` — Activity feed curation
- `internal/web/` — HTTP handler for UI
- `internal/beads/` — Wrapper around `bd` CLI
- `internal/config/` — TownConfig, RigSettings types
- `internal/state/` — Global enable/disable state
- `internal/tmux/` — tmux integration
- `internal/git/` — Git worktree operations

### Key Data Structures

**Rig** (project container):
- Name, Path, GitURL, LocalRepo
- Polecats (worker names), Crew (member names)
- HasWitness, HasRefinery, HasMayor flags

**Polecat** (ephemeral worker agent):
- Name, Rig, State (`working`|`done`|`stuck`|`active`)
- ClonePath (git worktree), Branch, Issue (assigned work ID)

**Beads Issue** (work item):
- ID (`{prefix}-{5 alphanum}`, prefix = origin rig)
- Title, Description, Status, Priority, Type
- Assignee, Children, DependsOn, Blocks, BlockedBy
- Labels, HookBead, AgentState

**Message** (mail):
- From, To, Subject, Body, Priority
- Type (`task`|`scavenge`|`notification`|`reply`)
- Delivery (`queue`|`interrupt`), ThreadID, ReplyTo, Channel, CC

**MergeRequest** (refinery):
- ID, Branch, Worker (polecat), IssueID
- Status (`open`|`in_progress`|`closed`)
- CloseReason (`merged`|`rejected`|`conflict`|`superseded`)

**Convoy** (batch tracking):
- ID, Name, Issues list, Status, Progress
- SQLite-backed

### Role System

| Role | Purpose | Default Agent |
|------|---------|--------------|
| mayor | Coordinator AI | claude |
| deacon | Heartbeat/coordination | haiku |
| witness | Polecat monitoring/spawn | haiku |
| refinery | Merge queue processor | — |
| polecat | Ephemeral workers | claude |
| crew | Persistent user workspaces | claude |

### CLI Commands (UI-relevant)

**Work**: `sling`, `convoy`, `formula`, `molecule`, `mq`, `ready`, `activity`
**Agents**: `agents`, `nudge`, `broadcast`, `polecat`, `crew`, `dog`, `role`
**Comms**: `mail`, `notify`, `witness`, `deacon`, `refinery`, `escalate`
**Services**: `daemon`, `up`, `down`, `status`, `shutdown`, `patrol`, `heartbeat`
**Workspace**: `rig`, `init`, `boot`, `worktree`, `session`
**Config**: `config`, `theme`, `role`, `account`, `gate`, `plugin`
**Diagnostics**: `doctor`, `status`, `statusline`, `audit`, `trail`, `stale`, `orphans`, `version`

### Key Workflows

**Sling (work distribution)**: Identify work → sling to target (rig/agent/queue) → creates hook bead → agent claims → executes → cleanup

**Agent lifecycle**: Spawn (tmux session + beads init) → Working (assigned issue) → Done (completed) → Cleanup (remove session & worktree)

**Anomaly types** (detected by Witness): Stalled, Zombie, Stuck

**Convoy**: Create with issue IDs → sling to agents → monitor progress with dependencies → report completion

**Merge queue**: Polecat opens merge request → Refinery processes → handles conflicts/tests/merges → updates status

### On-Disk Config Locations

```
~/gt/mayor/town.json         # Town identity (name, owner, version)
~/gt/mayor/config.json       # Mayor config
~/gt/mayor/daemon.json       # Daemon/patrol config (heartbeat intervals, patrol schedules)
~/gt/mayor/rigs.json         # Rigs registry
~/gt/settings/config.json    # Agent presets, themes, CLITheme
~/gt/settings/escalation.json # Escalation routing rules
~/gt/settings/agents.json    # Custom agent definitions
```

### Environment Variables

- `GT_ROOT` — Override town root
- `GT_THEME` — CLI theme override
- `GASTOWN_ENABLED` / `GASTOWN_DISABLED` — Global on/off
- `BD_ACTOR` — Current beads actor (routing)
- `BEADS_DIR` — Beads database path override

## Git Workflow

### Commit Messages
- Format: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
- Scopes: `api`, `rigs`, `nav`, `stores`, `docs`, `mail`, `convoys`, `status` (match feature domains)
- Description: lowercase, imperative mood, no period
- Example: `feat(api): add rig and crew action methods to API client`

### Branch Discipline
- Never commit directly to main
- PRs require review before merge
