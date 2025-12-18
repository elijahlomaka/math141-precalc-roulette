"use client";

import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";

type SceneProps = {
  /** Optional subtle lamp flicker. Disabled by default. */
  enableFlicker?: boolean;
};

function RoomAndLighting({ enableFlicker = false }: SceneProps) {
  // Suggested starting values
  const roomSize = useMemo(() => ({ x: 20, y: 6, z: 20 }), []);
  const fogColor = useMemo(() => new THREE.Color("#05060a"), []);

  const lampPos = useMemo(() => new THREE.Vector3(0, 4, 0), []);
  const tableCenter = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  const spotRef = useRef<THREE.SpotLight | null>(null);
  const spotTarget = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    // Ensure the spotlight points at the table center.
    if (!spotRef.current) return;
    spotRef.current.target = spotTarget;
    spotTarget.position.copy(tableCenter);
    spotTarget.updateMatrixWorld();
  }, [spotTarget, tableCenter]);

  useFrame(({ clock }) => {
    if (!enableFlicker) return;
    const light = spotRef.current;
    if (!light) return;

    // Subtle flicker: tiny intensity modulation + occasional quick dip.
    const t = clock.getElapsedTime();
    const base = 12;
    const wobble = (Math.sin(t * 17.0) * 0.15 + Math.sin(t * 7.0) * 0.08) * 0.6;
    const dip = Math.sin(t * 1.35) > 0.98 ? -2.5 : 0;
    light.intensity = Math.max(0, base + wobble + dip);
  });

  return (
    <>
      {/* Fog: hide edges, dark atmosphere */}
      <fog attach="fog" args={[fogColor, 6, 18]} />

      {/* Extremely low ambient */}
      <ambientLight intensity={0.05} color={"#b7c3ff"} />

      {/* Spotlight target must exist in scene graph */}
      <primitive object={spotTarget} />

      {/* Spot light aimed at table center */}
      <spotLight
        ref={spotRef}
        position={[lampPos.x, lampPos.y, lampPos.z]}
        intensity={12}
        angle={0.48}
        penumbra={0.95}
        distance={20}
        decay={2}
        color={"#fff0cc"}
      />

      {/* Hanging lamp placeholder */}
      <group position={[lampPos.x, lampPos.y, lampPos.z]}>
        {/* Cord */}
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1.3, 10]} />
          <meshStandardMaterial color="#101015" roughness={0.9} metalness={0.1} />
        </mesh>
        {/* Shade */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.38, 0.28, 16, 1, true]} />
          <meshStandardMaterial color="#1a1a22" roughness={0.7} metalness={0.2} side={THREE.DoubleSide} />
        </mesh>
        {/* Bulb glow (fake) */}
        <mesh position={[0, -0.12, 0]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color="#fff3cf" emissive="#ffd27a" emissiveIntensity={2.0} />
        </mesh>
      </group>

      {/* Room: floor + 3 walls + ceiling */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow={false}>
        <planeGeometry args={[roomSize.x, roomSize.z]} />
        <meshStandardMaterial color="#08090d" roughness={1} metalness={0} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, roomSize.y / 2, -roomSize.z / 2]} receiveShadow={false}>
        <planeGeometry args={[roomSize.x, roomSize.y]} />
        <meshStandardMaterial color="#06070b" roughness={1} />
      </mesh>

      {/* Left wall */}
      <mesh
        position={[-roomSize.x / 2, roomSize.y / 2, 0]}
        rotation-y={Math.PI / 2}
        receiveShadow={false}
      >
        <planeGeometry args={[roomSize.z, roomSize.y]} />
        <meshStandardMaterial color="#06070b" roughness={1} />
      </mesh>

      {/* Right wall */}
      <mesh
        position={[roomSize.x / 2, roomSize.y / 2, 0]}
        rotation-y={-Math.PI / 2}
        receiveShadow={false}
      >
        <planeGeometry args={[roomSize.z, roomSize.y]} />
        <meshStandardMaterial color="#06070b" roughness={1} />
      </mesh>

      {/* Ceiling (optional) */}
      <mesh rotation-x={Math.PI / 2} position={[0, roomSize.y, 0]} receiveShadow={false}>
        <planeGeometry args={[roomSize.x, roomSize.z]} />
        <meshStandardMaterial color="#05060a" roughness={1} />
      </mesh>

      {/* Minimal placeholders so the spotlight has something to hit */}
      {/* Table */}
      <group position={[0, 1, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[5.0, 0.18, 3.0]} />
          <meshStandardMaterial color="#15141a" roughness={0.9} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.7, 0]}>
          <boxGeometry args={[0.35, 1.4, 0.35]} />
          <meshStandardMaterial color="#0e0e12" roughness={0.9} metalness={0.1} />
        </mesh>
      </group>

      {/* Monster silhouette */}
      <group position={[0, 1.0, -2.2]}>
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[0.9, 1.1, 0.5]} />
          <meshStandardMaterial color="#07070a" roughness={1} />
        </mesh>
        <mesh position={[0, 1.35, 0.05]}>
          <boxGeometry args={[0.55, 0.55, 0.55]} />
          <meshStandardMaterial color="#050508" roughness={1} />
        </mesh>
      </group>

      {/* Revolver placeholder */}
      <mesh position={[0.5, 1.12, 0.4]} rotation-y={-0.6}>
        <boxGeometry args={[0.65, 0.12, 0.22]} />
        <meshStandardMaterial color="#1b1d24" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Deck placeholder */}
      <mesh position={[-0.55, 1.1, 0.45]} rotation-y={0.35}>
        <boxGeometry args={[0.42, 0.06, 0.6]} />
        <meshStandardMaterial color="#101018" roughness={0.8} metalness={0.1} />
      </mesh>
    </>
  );
}

export function Scene(props: SceneProps) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Cinematic fixed-ish camera */}
      <PerspectiveCamera makeDefault fov={42} position={[0.0, 2.35, 6.4]} />

      {/* Subtle dark tone mapping */}
      <color attach="background" args={["#05060a"]} />

      <RoomAndLighting {...props} />
    </Canvas>
  );
}
