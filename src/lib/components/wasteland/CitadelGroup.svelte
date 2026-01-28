<script lang="ts">
	import { T } from '@threlte/core';
	import { WASTELAND } from './colors';
	import FlameStack from './FlameStack.svelte';
	import SmokeEmitter from './SmokeEmitter.svelte';

	type LoadBand = 'low' | 'moderate' | 'high' | 'critical';

	interface Props {
		load?: number;
		band?: LoadBand;
	}

	const { load = 0, band = 'low' }: Props = $props();

	const c = WASTELAND.citadel;

	const intensity = $derived(Math.max(0, Math.min(1, load / 100)));
	const smokeColor = $derived(
		band === 'critical' || band === 'high' ? WASTELAND.smoke.dense : WASTELAND.smoke.light
	);

	const stackALit = $derived(load > 0);
	const stackBLit = $derived(band !== 'low');
	const stackCLit = $derived(band === 'high' || band === 'critical');
</script>

<T.Group position={[4, 0, -2]}>
	<!-- Main tower -->
	<T.Mesh position={[0, 1.5, 0]}>
		<T.BoxGeometry args={[2, 5, 2]} />
		<T.MeshStandardMaterial
			color={c.primary}
			emissive={c.primary}
			emissiveIntensity={0.15}
			roughness={0.75}
			metalness={0.15}
		/>
	</T.Mesh>

	<!-- Secondary tower -->
	<T.Mesh position={[-2.5, 1, 0]}>
		<T.BoxGeometry args={[1.5, 4, 1.5]} />
		<T.MeshStandardMaterial
			color={c.secondary}
			emissive={c.secondary}
			emissiveIntensity={0.12}
			roughness={0.8}
			metalness={0.1}
		/>
	</T.Mesh>

	<!-- Base platform -->
	<T.Mesh position={[-1, -0.7, 0]}>
		<T.BoxGeometry args={[6, 0.5, 4]} />
		<T.MeshStandardMaterial
			color={c.dark}
			emissive={c.dark}
			emissiveIntensity={0.1}
			roughness={0.85}
			metalness={0.15}
		/>
	</T.Mesh>

	<!-- Upper walkway platform -->
	<T.Mesh position={[-1.2, 2.2, 0]}>
		<T.BoxGeometry args={[4.5, 0.15, 2.5]} />
		<T.MeshStandardMaterial
			color={c.secondary}
			emissive={c.secondary}
			emissiveIntensity={0.12}
			roughness={0.75}
			metalness={0.15}
		/>
	</T.Mesh>

	<!-- Window lights on main tower -->
	<T.Mesh position={[0, 2.2, 1.01]}>
		<T.PlaneGeometry args={[0.3, 0.4]} />
		<T.MeshStandardMaterial color={c.window} emissive={c.window} emissiveIntensity={0.8} roughness={0.4} />
	</T.Mesh>
	<T.Mesh position={[0.6, 1.4, 1.01]}>
		<T.PlaneGeometry args={[0.25, 0.3]} />
		<T.MeshStandardMaterial color={c.window} emissive={c.window} emissiveIntensity={0.6} roughness={0.4} />
	</T.Mesh>
	<T.Mesh position={[-0.5, 3.0, 1.01]}>
		<T.PlaneGeometry args={[0.2, 0.35]} />
		<T.MeshStandardMaterial color={c.window} emissive={c.window} emissiveIntensity={0.5} roughness={0.4} />
	</T.Mesh>

	<!-- Window lights on secondary tower -->
	<T.Mesh position={[-2.5, 1.6, 0.76]}>
		<T.PlaneGeometry args={[0.25, 0.3]} />
		<T.MeshStandardMaterial color={c.window} emissive={c.window} emissiveIntensity={0.7} roughness={0.4} />
	</T.Mesh>
	<T.Mesh position={[-2.5, 0.6, 0.76]}>
		<T.PlaneGeometry args={[0.2, 0.25]} />
		<T.MeshStandardMaterial color={c.window} emissive={c.window} emissiveIntensity={0.5} roughness={0.4} />
	</T.Mesh>

	<!-- Flame Stack A (main tower) -->
	<FlameStack position={[0.5, 3.5, -0.7]} height={3} lit={stackALit} {intensity} />
	<SmokeEmitter
		position={[0.5, 5.2, -0.7]}
		density={stackALit ? intensity : 0}
		speed={0.3 + intensity * 0.7}
		color={smokeColor}
	/>

	<!-- Flame Stack B (secondary tower) -->
	<FlameStack
		position={[-2.5, 3, -0.5]}
		topRadius={0.12}
		bottomRadius={0.2}
		height={2}
		lit={stackBLit}
		{intensity}
	/>
	<SmokeEmitter
		position={[-2.5, 4.5, -0.5]}
		density={stackBLit ? intensity * 0.8 : 0}
		speed={0.2 + intensity * 0.6}
		color={smokeColor}
		particleCount={60}
	/>

	<!-- Flame Stack C (walkway) -->
	<FlameStack
		position={[-1.2, 2.8, -0.6]}
		topRadius={0.1}
		bottomRadius={0.15}
		height={1.5}
		lit={stackCLit}
		{intensity}
	/>
	<SmokeEmitter
		position={[-1.2, 3.8, -0.6]}
		density={stackCLit ? intensity * 0.6 : 0}
		speed={0.2 + intensity * 0.5}
		color={smokeColor}
		particleCount={50}
	/>

	<!-- Horizontal pipe connecting towers -->
	<T.Mesh position={[-1.2, 1.8, 0.8]} rotation.z={Math.PI / 2}>
		<T.CylinderGeometry args={[0.1, 0.1, 3.5, 8]} />
		<T.MeshStandardMaterial color={c.primary} emissive={c.primary} emissiveIntensity={0.1} roughness={0.6} metalness={0.2} />
	</T.Mesh>

	<!-- Lower pipe run -->
	<T.Mesh position={[-1.2, 0.4, 0.8]} rotation.z={Math.PI / 2}>
		<T.CylinderGeometry args={[0.08, 0.08, 4, 8]} />
		<T.MeshStandardMaterial color={c.secondary} emissive={c.secondary} emissiveIntensity={0.1} roughness={0.65} metalness={0.2} />
	</T.Mesh>

	<!-- Auxiliary shed -->
	<T.Mesh position={[2, -0.3, 0.5]}>
		<T.BoxGeometry args={[1, 0.8, 1.2]} />
		<T.MeshStandardMaterial color={c.dark} emissive={c.dark} emissiveIntensity={0.1} roughness={0.85} metalness={0.1} />
	</T.Mesh>

	<!-- Antenna mast -->
	<T.Mesh position={[0, 5, 0]}>
		<T.CylinderGeometry args={[0.03, 0.03, 3, 4]} />
		<T.MeshStandardMaterial color={c.secondary} emissive={c.secondary} emissiveIntensity={0.1} roughness={0.5} metalness={0.2} />
	</T.Mesh>

	<!-- Antenna tip light (red beacon) -->
	<T.Mesh position={[0, 6.5, 0]}>
		<T.SphereGeometry args={[0.06, 6, 4]} />
		<T.MeshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.5} />
	</T.Mesh>
	<T.PointLight position={[0, 6.5, 0]} color="#ef4444" intensity={0.5} distance={4} decay={2} />
</T.Group>
