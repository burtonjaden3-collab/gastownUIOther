<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import { WASTELAND } from '../colors';

	interface Props {
		intensity: number; // 0-1, maps to load/100
	}

	const { intensity }: Props = $props();

	const MAX_PARTICLES = 200;
	const MIN_ACTIVE = 20;

	// Particle state — created fresh per component instance
	const positions = new Float32Array(MAX_PARTICLES * 3);
	const velocities: { x: number; y: number; phase: number }[] = [];

	// Three.js refs
	let pointsRef: THREE.Points | null = $state(null);

	// Initialize particle system
	for (let i = 0; i < MAX_PARTICLES; i++) {
		const i3 = i * 3;

		// Random initial position
		positions[i3] = Math.random() * 30 - 15; // x: -15 to 15
		positions[i3 + 1] = Math.random() * 1.3 - 0.8; // y: -0.8 to 0.5
		positions[i3 + 2] = Math.random() * 15 - 10; // z: -10 to 5

		// Random velocity and phase for vertical drift
		velocities.push({
			x: -(0.02 + Math.random() * 0.03), // drift left at varying speeds
			y: 0,
			phase: Math.random() * Math.PI * 2, // sine wave phase offset
		});
	}

	// Create geometry and material fresh per instance
	let geometry: THREE.BufferGeometry | undefined = $state();
	let material: THREE.PointsMaterial | undefined = $state();

	$effect(() => {
		const geo = new THREE.BufferGeometry();
		geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

		const mat = new THREE.PointsMaterial({
			size: 0.04,
			color: new THREE.Color(WASTELAND.desert.duneA),
			transparent: true,
			opacity: 0.3,
			depthWrite: false,
		});

		geometry = geo;
		material = mat;

		return () => {
			geo.dispose();
			mat.dispose();
		};
	});

	// Animation loop
	useTask((delta) => {
		if (!pointsRef || !geometry) return;

		const activeCount = Math.floor(MIN_ACTIVE + (MAX_PARTICLES - MIN_ACTIVE) * intensity);
		let needsUpdate = false;

		for (let i = 0; i < MAX_PARTICLES; i++) {
			const i3 = i * 3;
			const isActive = i < activeCount;

			if (isActive) {
				// Update position
				positions[i3] += velocities[i].x * delta * 60; // drift left

				// Vertical sine wave drift
				velocities[i].phase += delta * 0.5;
				positions[i3 + 1] += Math.sin(velocities[i].phase) * 0.001;

				// Recycle particle if it goes off-screen left
				if (positions[i3] < -16) {
					positions[i3] = 16 + Math.random() * 2; // respawn on right side
					positions[i3 + 1] = Math.random() * 1.3 - 0.8; // new y position
					positions[i3 + 2] = Math.random() * 15 - 10; // new z position
					velocities[i].phase = Math.random() * Math.PI * 2;
				}

				needsUpdate = true;
			} else {
				// Hide inactive particles
				if (positions[i3 + 1] !== -10) {
					positions[i3 + 1] = -10;
					needsUpdate = true;
				}
			}
		}

		if (needsUpdate && geometry.attributes.position) {
			geometry.attributes.position.needsUpdate = true;
		}
	});

</script>

{#if geometry && material}
	<T.Points {geometry} {material} oncreate={(ref) => { pointsRef = ref as unknown as THREE.Points; }} />
{/if}
