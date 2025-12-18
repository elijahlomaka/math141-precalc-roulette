import { Environment } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type SceneProps = {
  /**
   * Optional subtle lamp flicker.
   * Disabled by default (set true to enable).
   */
  flicker?: boolean;
  /**
   * Only enable an Environment if you find the scene too flat.
   * Disabled by default.
   */
  useEnvironment?: boolean;
};

export function Scene({ flicker = false, useEnvironment = false }: SceneProps) {
  // --- Tunables (baseline) ---
  const room = useMemo(() => ({ width: 20, height: 6, depth: 20 }), []);
  const tableCenter = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const lampMount = useMemo(() => new THREE.Vector3(0, 4, 0), []);
  const lampShadeY = 2.2;

  const fogColor = "#05060a";
  const fogNear = 6;
  const fogFar = 18;

  const ambientIntensity = 0.04;

  const baseSpotIntensity = 12;
  const spotColor = "#ffd8b3";
  const spotAngle = 0.48;
  const spotPenumbra = 0.95;
  const spotDistance = 20;
  const spotDecay = 2;

  // --- Refs ---
  const targetRef = useRef<THREE.Object3D>(null);
  const spotRef = useRef<THREE.SpotLight>(null);
  const bulbMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useLayoutEffect(() => {
    if (!spotRef.current || !targetRef.current) return;
    spotRef.current.target = targetRef.current;
    spotRef.current.target.updateMatrixWorld();
  }, []);

  // Optional subtle flicker (disabled by default)
  const flickerState = useRef({
    t: 0,
    smooth: 1,
  });

  useFrame((_, dt) => {
    if (!flicker) return;
    const light = spotRef.current;
    if (!light) return;

    const s = flickerState.current;
    s.t += dt;

    // Low-frequency wobble + tiny noise, smoothed to avoid harsh pops
    const wobble = 0.03 * Math.sin(s.t * 3.7) + 0.02 * Math.sin(s.t * 11.9);
    const noise = (Math.random() - 0.5) * 0.015;
    const target = 1 + wobble + noise;
    s.smooth = THREE.MathUtils.lerp(s.smooth, target, 1 - Math.pow(0.001, dt));

    light.intensity = baseSpotIntensity * s.smooth;
    if (bulbMatRef.current) {
      bulbMatRef.current.emissiveIntensity = 0.35 * s.smooth;
    }
  });

  const halfW = room.width / 2;
  const halfD = room.depth / 2;

  return (
    <>
      {/* Baseline "dark room" look */}
      <color attach="background" args={[fogColor]} />
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

      {/* Extremely low ambient so blacks aren't crushed */}
      <ambientLight intensity={ambientIntensity} />

      {/* Spotlight from lamp mount, aimed at table center */}
      <object3D ref={targetRef} position={tableCenter.toArray()} />
      <spotLight
        ref={spotRef}
        position={lampMount.toArray()}
        color={spotColor}
        intensity={baseSpotIntensity}
        angle={spotAngle}
        penumbra={spotPenumbra}
        distance={spotDistance}
        decay={spotDecay}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />

      {/* Room: floor + 3 walls + optional ceiling */}
      <group>
        {/* Floor */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[room.width, room.depth]} />
          <meshStandardMaterial color="#0b0c10" roughness={1} metalness={0} />
        </mesh>

        {/* Back wall (z = -halfD) */}
        <mesh position={[0, room.height / 2, -halfD]} receiveShadow>
          <planeGeometry args={[room.width, room.height]} />
          <meshStandardMaterial
            color="#07080c"
            roughness={1}
            metalness={0}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Left wall (x = -halfW) */}
        <mesh
          position={[-halfW, room.height / 2, 0]}
          rotation={[0, Math.PI / 2, 0]}
          receiveShadow
        >
          <planeGeometry args={[room.depth, room.height]} />
          <meshStandardMaterial
            color="#07080c"
            roughness={1}
            metalness={0}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Right wall (x = +halfW) */}
        <mesh
          position={[halfW, room.height / 2, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          receiveShadow
        >
          <planeGeometry args={[room.depth, room.height]} />
          <meshStandardMaterial
            color="#07080c"
            roughness={1}
            metalness={0}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Ceiling (optional; kept on because it helps the vibe) */}
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, room.height, 0]}
          receiveShadow
        >
          <planeGeometry args={[room.width, room.depth]} />
          <meshStandardMaterial color="#07080c" roughness={1} metalness={0} />
        </mesh>
      </group>

      {/* Hanging lamp placeholder (simple cable + shade + bulb) */}
      <group position={[0, 0, 0]}>
        {/* Cable */}
        <mesh position={[lampMount.x, (lampMount.y + lampShadeY) / 2, lampMount.z]}>
          <cylinderGeometry args={[0.01, 0.01, lampMount.y - lampShadeY, 10]} />
          <meshStandardMaterial color="#11131a" roughness={1} metalness={0.2} />
        </mesh>

        {/* Shade */}
        <mesh position={[lampMount.x, lampShadeY, lampMount.z]} castShadow>
          <coneGeometry args={[0.42, 0.48, 18, 1, true]} />
          <meshStandardMaterial
            color="#0c0d12"
            roughness={0.9}
            metalness={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Bulb */}
        <mesh position={[lampMount.x, lampShadeY - 0.12, lampMount.z]} castShadow>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial
            ref={bulbMatRef}
            color="#1a1a1a"
            emissive={new THREE.Color("#ffe7c6")}
            emissiveIntensity={0.35}
            roughness={0.2}
            metalness={0}
          />
        </mesh>
      </group>

      {/* Dark Environment only if needed */}
      {useEnvironment ? (
        <Environment preset="night" background={false} />
      ) : null}
    </>
  );
}

