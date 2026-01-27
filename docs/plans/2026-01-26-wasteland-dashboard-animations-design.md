# Wasteland Dashboard Animations Design

## Overview

Add a data-driven Mad Max themed animation scene to the dashboard. A full-width hero band at the top of the dashboard renders a living 3D wasteland diorama where every visual element maps to real system state: vehicles represent tasks flowing through the pipeline, the citadel's intensity reflects system load, and War Boy figures represent agents.

## Goals

- **Functional visuals**: Every animation element maps to real system metrics (tasks, agents, load). Not decorative — informational.
- **At-a-glance status**: System state readable from across the room by the intensity of the scene.
- **Theme-native**: Uses existing Gas Town palette (rust, oil, chrome, flame, exhaust). No new colors.

## Scene Architecture

The hero band is a `<canvas>` element rendered by Three.js via `threlte` (Svelte-native Three.js wrapper). It sits at the top of the dashboard, 300px tall, full width. Camera is fixed orthographic, side-view. No user interaction — it is a living status display.

### Three Zones (Left to Right)

1. **Staging Area (left edge)** — Vehicles spawn here when tasks enter the queue. They idle with engines running (subtle exhaust particles), headlights on.
2. **The Wasteland Road (center)** — Running tasks drive left-to-right across the desert. Speed is uniform but vehicles have slight vertical variation to avoid single-file appearance. Desert floor is textured sand with heat shimmer.
3. **The Citadel (right side)** — A towering industrial structure with flame stacks, pipes, and platforms. Completed vehicles pull in through the gates and disappear. The citadel's visual intensity maps to system load.

## Visual Style

### Color Mapping (Existing Theme Tokens)

| Element | Tokens |
|---|---|
| Sky | `oil-950` (top) to `rust-900` (horizon). Shifts toward `flame-500`/`rust-500` as load increases |
| Desert floor | `rust-800` to `rust-950` textured sand. Dune silhouettes in `oil-900` |
| Citadel | `chrome-700`/`chrome-800` metallic shapes, `oil-950` shadows. Riveted, industrial, blocky |
| Flame stacks | `flame-400` to `warning-400` with `glow-rust` shadow token |
| Vehicles | `chrome-600` body, `rust-500` accents, `flame-500` exhaust glow when running. Blocked vehicles pulse `warning-400` |
| War Boys | `chrome-300` silhouettes on citadel, sized for readability at small scale |

### Particle Systems (GPU-Instanced)

- **Sand/dust**: Constant low drift across desert. Intensity scales with system load.
- **Exhaust smoke**: Each running vehicle emits a small trail of `exhaust-500` particles.
- **Citadel smoke**: `exhaust-400` plumes from stacks. Density and height scale with load.
- **Sparks**: At critical load (>80%), `flame-400` sparks fly from citadel stacks.

### Lighting

- Ambient light tinted `rust-300` for constant warm wasteland feel.
- Directional "sun" light from top-left.
- At high load, a secondary `flame-500` point light pulses from the citadel, casting orange glow across the scene.

## State Mapping

### Vehicles (from `tasksStore`)

| Task Status | Vehicle Behavior |
|---|---|
| `pending` | Idles in staging area, engine particles running, headlights on |
| `running` | Drives across desert toward citadel. Agent figure riding on top |
| `completed` | Enters citadel gate, fades out. Agent climbs back up to ramparts |
| `blocked` | Stopped mid-road, hazard-yellow pulse, small smoke plume from hood |
| `failed` | Wrecked on roadside, dark silhouette, no particles. Fades after 10s |

Task type determines vehicle color accent: PR tasks = `rust-500`, issue tasks = `chrome-500`.

### Citadel (from `agentsStore` + health store)

| Metric | Visual Effect |
|---|---|
| `avgLoad < 30%` | One flame stack lit dimly, faint smoke, still sky |
| `avgLoad 30-60%` | Two stacks lit, moderate smoke, sand begins drifting |
| `avgLoad 60-80%` | All stacks lit, thick smoke, sky shifts to `rust-700`, dust kicks up |
| `avgLoad > 80%` | Full inferno — flames roar, sparks fly, sky goes `flame-600`, ground shakes (subtle canvas vibration) |

### War Boys / Agents (from `agentsStore`)

| Agent State | Figure Behavior |
|---|---|
| `idle` | Standing on citadel platform, slight idle sway animation |
| `busy` | Riding assigned vehicle, arms raised (classic War Boy pose) |
| `offline` | Absent from scene entirely |
| `idle -> busy` | Climb-down animation, runs to vehicle, jumps on |
| `busy -> idle` | Detaches at citadel gate, climbs back up to open platform slot |

### Transitions

All state changes animate over ~1.5s. Vehicles accelerate and decelerate rather than teleporting. Agent transitions (climbing, jumping) use position/rotation tweens.

## Technical Implementation

### Dependencies

- `threlte` (`@threlte/core` + `@threlte/extras`) — Svelte-native Three.js wrapper. Works with Svelte 5, declarative scene graph, reactive props driven directly by store values.
- `three` — Underlying 3D engine. No other runtime dependencies.

### Component Structure

```
src/lib/components/wasteland/
├── index.ts                    # Barrel export
├── WastelandScene.svelte       # Top-level <Canvas> + scene setup, camera, lighting
├── Desert.svelte               # Ground plane, dune silhouettes, heat shimmer shader
├── Sky.svelte                  # Gradient sky mesh, color shifts based on load
├── Citadel.svelte              # Citadel geometry, flame stacks, smoke emitters
├── FlameStack.svelte           # Individual flame + smoke, intensity prop
├── Vehicle.svelte              # Single vehicle mesh + exhaust particles, status-driven
├── VehicleConvoy.svelte        # Spawns/removes Vehicle instances from tasksStore
├── WarBoy.svelte               # Agent figure, handles idle/riding/transition states
├── WarBoyManager.svelte        # Maps agentsStore to WarBoy instances on citadel/vehicles
├── particles/
│   ├── DustSystem.svelte       # Ambient sand drift, intensity from load
│   ├── SmokeSystem.svelte      # Citadel smoke plumes
│   └── SparkSystem.svelte      # Critical-load spark bursts
└── shaders/
    ├── heat-shimmer.glsl       # Desert heat distortion (vertex displacement)
    └── flame-glow.glsl         # Flame stack glow (fragment shader)
```

### Integration Point

One line added to `src/routes/+page.svelte`:

```svelte
<WastelandScene
  tasks={tasksStore.items}
  agents={agentsStore.items}
  load={agentStats.avgLoad}
/>
```

The scene component subscribes to reactive props. When store data changes, threlte's reactive bindings update the 3D objects without manual imperative calls.

### 3D Assets (All Procedural)

No external model files. Everything is code-generated geometry:

- **Vehicles**: Box geometry with beveled edges, wheel cylinders, exhaust pipe. Simple enough that 20+ on screen stays performant.
- **Citadel**: Stacked box/cylinder primitives — towers, pipes, platforms. Brutalist industrial style. Reads well at 300px height.
- **War Boys**: Capsule body + sphere head. Stick-figure proportions. Recognizable as human figures at small scale without needing skeletal animation.
- **Desert**: Flat plane with displacement map generated from noise. Dune silhouettes are 2D planes in background layer.

### Performance Guardrails

- GPU-instanced meshes for vehicles and particles (not individual draw calls)
- Particle count caps: dust 200, smoke 100 per stack, sparks 50
- `requestAnimationFrame` throttled to 30fps (status display, not a game)
- Canvas uses `powerPreference: 'low-power'` to avoid spinning up discrete GPUs on laptops
- Entire scene wrapped in `{#if prefersReducedMotion}` check — falls back to a static SVG silhouette

## Phased Rollout

### Phase 1 — Static Scene
Desert floor, sky gradient, citadel geometry. No animation. Proves the canvas renders correctly in the hero band without breaking the dashboard layout.

### Phase 2 — Load-Reactive Citadel
Flame stacks respond to `avgLoad`. Smoke particles. Sky color shifts. Standalone useful status indicator.

### Phase 3 — Vehicle Convoy
Tasks spawn vehicles, drive across desert, enter citadel. Blocked/failed states visualized. Core pipeline metaphor complete.

### Phase 4 — War Boys
Agent figures on citadel, riding vehicles, transition animations between idle and busy states.

### Phase 5 — Polish
Heat shimmer shader, spark particles, subtle canvas vibration at critical load, reduced-motion fallback SVG.
