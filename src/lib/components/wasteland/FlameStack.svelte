<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import { WASTELAND } from './colors';

	interface Props {
		position: [number, number, number];
		topRadius?: number;
		bottomRadius?: number;
		height?: number;
		lit?: boolean;
		intensity?: number;
	}

	const {
		position,
		topRadius = 0.15,
		bottomRadius = 0.25,
		height = 3,
		lit = false,
		intensity = 0,
	}: Props = $props();

	const c = WASTELAND.citadel;

	let flameMesh: THREE.Mesh | null = $state(null);
	let pointLight: THREE.PointLight | null = $state(null);

	const flameTop = $derived(position[1] + height / 2 + 0.2);

	const flameColor = $derived(() => {
		const out = new THREE.Color();
		out.lerpColors(
			new THREE.Color(WASTELAND.flame.dim),
			new THREE.Color(WASTELAND.flame.inferno),
			intensity
		);
		return '#' + out.getHexString();
	});

	let elapsed = 0;

	useTask((delta) => {
		if (!lit || !flameMesh || !pointLight) return;
		elapsed += delta;
		const flicker = Math.sin(elapsed * 8) * 0.15 + Math.sin(elapsed * 13.7) * 0.1;
		const mat = flameMesh.material as THREE.MeshStandardMaterial;
		mat.emissiveIntensity = intensity * 2 + flicker;
		pointLight.intensity = intensity * 3 + flicker * 0.5;
	});
</script>

<!-- Smokestack pipe (always rendered) -->
<T.Mesh position={position}>
	<T.CylinderGeometry args={[topRadius, bottomRadius, height, 8]} />
	<T.MeshStandardMaterial color={c.secondary} roughness={0.7} metalness={0.2} />
</T.Mesh>

{#if lit}
	<!-- Flame sphere at stack top -->
	<T.Mesh
		position={[position[0], flameTop, position[2]]}
		scale={[0.4, 0.6 + intensity * 0.4, 0.4]}
		oncreate={(ref) => { flameMesh = ref; }}
	>
		<T.SphereGeometry args={[0.3, 8, 6]} />
		<T.MeshStandardMaterial
			color={flameColor()}
			emissive={flameColor()}
			emissiveIntensity={intensity * 2}
			roughness={0.3}
			transparent
			opacity={0.7 + intensity * 0.3}
		/>
	</T.Mesh>

	<!-- Point light for glow -->
	<T.PointLight
		position={[position[0], flameTop + 0.3, position[2]]}
		color={WASTELAND.flame.bright}
		intensity={intensity * 3}
		distance={8}
		decay={2}
		oncreate={(ref) => { pointLight = ref; }}
	/>
{/if}
