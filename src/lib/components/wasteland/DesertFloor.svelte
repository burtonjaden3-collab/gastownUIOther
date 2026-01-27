<script lang="ts">
	import { T } from '@threlte/core';
	import { WASTELAND } from './colors';
</script>

<!-- Main ground plane -->
<T.Mesh rotation.x={-Math.PI / 2} position.y={-1}>
	<T.PlaneGeometry args={[80, 40]} />
	<T.MeshStandardMaterial color={WASTELAND.desert.ground} roughness={0.95} />
</T.Mesh>

<!-- Foreground strip (lighter, offset to avoid z-fighting) -->
<T.Mesh rotation.x={-Math.PI / 2} position={[0, -0.98, 8]}>
	<T.PlaneGeometry args={[80, 12]} />
	<T.MeshStandardMaterial color={WASTELAND.desert.foreground} roughness={0.9} />
</T.Mesh>

<!-- Dune ridgeline A (far) — taller, reads as distant mesa -->
<T.Mesh position={[-6, -0.2, -12]}>
	<T.BoxGeometry args={[30, 0.8, 2]} />
	<T.MeshStandardMaterial color={WASTELAND.desert.duneA} roughness={0.85} />
</T.Mesh>

<!-- Dune ridgeline B (mid) -->
<T.Mesh position={[4, -0.5, -8]}>
	<T.BoxGeometry args={[20, 0.6, 1.5]} />
	<T.MeshStandardMaterial color={WASTELAND.desert.duneB} roughness={0.9} />
</T.Mesh>

<!-- Dune ridgeline C (near) -->
<T.Mesh position={[-10, -0.7, -4]}>
	<T.BoxGeometry args={[15, 0.4, 1]} />
	<T.MeshStandardMaterial color={WASTELAND.desert.duneA} roughness={0.8} />
</T.Mesh>

<!-- Small rock clusters for foreground detail -->
<T.Mesh position={[-4, -0.85, 2]}>
	<T.BoxGeometry args={[0.5, 0.3, 0.4]} />
	<T.MeshStandardMaterial color={WASTELAND.desert.duneA} roughness={0.9} />
</T.Mesh>
<T.Mesh position={[12, -0.9, 3]}>
	<T.BoxGeometry args={[0.3, 0.2, 0.3]} />
	<T.MeshStandardMaterial color={WASTELAND.desert.duneB} roughness={0.9} />
</T.Mesh>
<T.Mesh position={[-12, -0.88, 1]}>
	<T.BoxGeometry args={[0.4, 0.25, 0.35]} />
	<T.MeshStandardMaterial color={WASTELAND.desert.duneA} roughness={0.85} />
</T.Mesh>
