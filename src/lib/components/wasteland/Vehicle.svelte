<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import { WASTELAND } from './colors';

	interface Props {
		status: 'pending' | 'running' | 'completed' | 'blocked' | 'failed';
		taskType?: 'pr' | 'issue';
		x: number;
		z: number;
	}

	let { status, taskType, x, z }: Props = $props();

	// Body color based on status
	const bodyColor = $derived(
		status === 'failed' ? WASTELAND.vehicle.failed : WASTELAND.vehicle.body
	);

	// Accent color based on task type
	const accentColor = $derived(
		taskType === 'pr'
			? WASTELAND.vehicle.accentPR
			: taskType === 'issue'
				? WASTELAND.vehicle.accentIssue
				: WASTELAND.vehicle.body
	);

	// Emissive intensity for blocked status animation
	let emissiveIntensity = $state(0);
	let elapsed = 0;

	// Animate blocked pulse at top level
	useTask((delta) => {
		if (status === 'blocked') {
			elapsed += delta;
			emissiveIntensity = Math.abs(Math.sin(elapsed * 3)) * 0.8;
		} else {
			emissiveIntensity = 0;
		}
	});

	// Three.js colors
	const bodyColorObj = $derived(new THREE.Color(bodyColor));
	const accentColorObj = $derived(new THREE.Color(accentColor));
	const wheelColor = new THREE.Color('#333333');
	const exhaustColor = new THREE.Color('#555555');
	const blockedEmissive = new THREE.Color(WASTELAND.vehicle.blocked);
	const headlightColor = new THREE.Color(WASTELAND.vehicle.headlight);

	// Wheel positions (corners of body)
	const wheelPositions = [
		[-0.5, -0.25, 0.25], // front-left
		[0.5, -0.25, 0.25], // front-right
		[-0.5, -0.25, -0.25], // back-left
		[0.5, -0.25, -0.25] // back-right
	] as const;
</script>

<T.Group position={[x, 0.2, z]}>
	<!-- Main body -->
	<T.Mesh>
		<T.BoxGeometry args={[1.2, 0.5, 0.6]} />
		<T.MeshStandardMaterial
			color={bodyColorObj}
			roughness={0.6}
			metalness={0.3}
			emissive={status === 'blocked' ? blockedEmissive : undefined}
			emissiveIntensity={status === 'blocked' ? emissiveIntensity : 0}
		/>
	</T.Mesh>

	<!-- Accent stripe on top -->
	<T.Mesh position={[0, 0.26, 0]}>
		<T.BoxGeometry args={[1.0, 0.05, 0.3]} />
		<T.MeshStandardMaterial color={accentColorObj} roughness={0.5} metalness={0.4} />
	</T.Mesh>

	<!-- Wheels -->
	{#each wheelPositions as [wx, wy, wz]}
		<T.Mesh position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]}>
			<T.CylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
			<T.MeshStandardMaterial color={wheelColor} roughness={0.9} metalness={0.1} />
		</T.Mesh>
	{/each}

	<!-- Exhaust pipe at rear -->
	<T.Mesh position={[-0.65, 0, 0.2]}>
		<T.BoxGeometry args={[0.15, 0.1, 0.08]} />
		<T.MeshStandardMaterial color={exhaustColor} roughness={0.7} metalness={0.5} />
	</T.Mesh>

	<!-- Headlight for pending status -->
	{#if status === 'pending'}
		<T.PointLight
			position={[0.7, 0, 0]}
			color={headlightColor}
			intensity={0.3}
			distance={3}
			castShadow={false}
		/>
	{/if}
</T.Group>
