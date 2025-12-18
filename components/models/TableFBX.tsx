import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { FBXLoader } from "three-stdlib";

export type TableFBXProps = {
  /**
   * Public URL to the FBX file.
   * Default matches: `/public/models/OldTable.fbx` -> `/models/OldTable.fbx`
   */
  url?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
};

/**
 * Loads and renders the roulette table FBX as a primitive.
 *
 * Notes:
 * - We intentionally load FBX directly (no GLB conversion).
 * - We traverse meshes once to fix common FBX material/shadow issues.
 */
export function TableFBX({
  url = "/models/OldTable.fbx",
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: TableFBXProps) {
  const fbx = useLoader(FBXLoader, url);

  const model = useMemo(() => {
    // Clone so we can safely mutate materials/shadow flags without
    // affecting cached loader results across renders.
    const root = fbx.clone(true);

    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!(mesh as unknown as { isMesh?: boolean }).isMesh) return;

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const material = (mesh.material ?? null) as
        | THREE.Material
        | THREE.Material[]
        | null;
      if (!material) return;

      const mats = Array.isArray(material) ? material : [material];
      for (const m of mats) {
        // FBX frequently has single-sided faces; DoubleSide avoids disappearing polygons.
        (m as THREE.Material & { side?: THREE.Side }).side = THREE.DoubleSide;
        m.needsUpdate = true;

        // If we can, tame overly-shiny imports (common with FBX).
        const pbr = m as THREE.MeshStandardMaterial;
        if (typeof pbr.roughness === "number") {
          pbr.roughness = Math.max(pbr.roughness, 0.6);
        }
        if (typeof pbr.metalness === "number") {
          pbr.metalness = Math.min(pbr.metalness, 0.2);
        }
      }
    });

    return root;
  }, [fbx]);

  return <primitive object={model} position={position} rotation={rotation} scale={scale} />;
}

