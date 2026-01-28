<script lang="ts">
	import { T, useThrelte } from '@threlte/core';
	import * as THREE from 'three';
	import DesertFloor from './DesertFloor.svelte';
	import CitadelGroup from './CitadelGroup.svelte';
	import VehicleConvoy from './VehicleConvoy.svelte';
	import WarBoyManager from './WarBoyManager.svelte';
	import { DustSystem, SparkSystem } from './particles';
	import { WASTELAND } from './colors';

	type LoadBand = 'low' | 'moderate' | 'high' | 'critical';

	type VehicleStatus = 'pending' | 'running' | 'completed' | 'blocked' | 'failed';
	type VehicleTaskType = 'pr' | 'issue';

	interface SceneTask {
		id: string;
		status: VehicleStatus;
		type?: VehicleTaskType;
	}

	interface Props {
		load?: number;
		tasks?: SceneTask[];
		agents?: Array<{ name: string; state: string; assignedTask?: string }>;
	}

	const { load = 0, tasks = [], agents = [] }: Props = $props();

	const { scene, size } = useThrelte();

	const aspect = $derived(size.current.width / Math.max(size.current.height, 1));
	const frustumH = 8;
	const frustumW = $derived(frustumH * aspect);

	const band = $derived<LoadBand>(
		load > 80 ? 'critical' : load > 60 ? 'high' : load > 30 ? 'moderate' : 'low'
	);

	function interpolateHorizon(l: number): string {
		if (l <= 30) return WASTELAND.sky.horizon;
		if (l <= 60) {
			const t = (l - 30) / 30;
			const c = new THREE.Color();
			c.lerpColors(new THREE.Color(WASTELAND.sky.horizon), new THREE.Color(WASTELAND.sky.highLoad), t);
			return '#' + c.getHexString();
		}
		if (l <= 80) {
			const t = (l - 60) / 20;
			const c = new THREE.Color();
			c.lerpColors(new THREE.Color(WASTELAND.sky.highLoad), new THREE.Color(WASTELAND.sky.critical), t);
			return '#' + c.getHexString();
		}
		return WASTELAND.sky.critical;
	}

	const horizonColor = $derived(interpolateHorizon(load));

	let camera: THREE.OrthographicCamera | null = $state(null);

	// Keep projection matrix in sync with reactive frustum bounds
	$effect(() => {
		if (!camera) return;
		camera.left = -frustumW / 2;
		camera.right = frustumW / 2;
		camera.top = frustumH / 2;
		camera.bottom = -frustumH / 2;
		camera.updateProjectionMatrix();
	});

	// Sky gradient background — reactive to load via horizonColor
	$effect(() => {
		const canvas = document.createElement('canvas');
		canvas.width = 2;
		canvas.height = 256;
		const ctx = canvas.getContext('2d')!;
		const grad = ctx.createLinearGradient(0, 0, 0, 256);
		grad.addColorStop(0, WASTELAND.sky.top);
		grad.addColorStop(1, horizonColor);
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, 2, 256);
		const tex = new THREE.CanvasTexture(canvas);
		scene.background = tex;

		return () => {
			tex.dispose();
			scene.background = null;
		};
	});
</script>

<!-- Orthographic camera: manual frustum (Threlte auto-sizes to pixels without manual) -->
<T.OrthographicCamera
	makeDefault
	manual
	left={-frustumW / 2}
	right={frustumW / 2}
	top={frustumH / 2}
	bottom={-frustumH / 2}
	near={0.1}
	far={100}
	position={[0, 1, 20]}
	oncreate={(ref) => {
		camera = ref;
		ref.lookAt(0, 1, 0);
		ref.updateProjectionMatrix();
	}}
/>

<!-- Hemisphere light: warm sky, cool ground — fills shadows naturally -->
<T.HemisphereLight args={['#c4836a', '#3d2517', 0.6]} />

<!-- Ambient light with warm tint -->
<T.AmbientLight intensity={0.5} color={WASTELAND.light.warm} />

<!-- Key light from top-left -->
<T.DirectionalLight intensity={1.0} position={[-5, 8, 5]} />

<!-- Fill light from right to reveal citadel side faces -->
<T.DirectionalLight intensity={0.4} position={[10, 3, 8]} />

<DesertFloor />
<CitadelGroup {load} {band} />
<VehicleConvoy {tasks} />
<WarBoyManager {agents} {tasks} />
<DustSystem intensity={load / 100} />
<SparkSystem active={band === 'critical'} />
