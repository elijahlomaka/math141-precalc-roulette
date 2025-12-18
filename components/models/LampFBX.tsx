import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { FBXLoader } from "three-stdlib";

export type LampFBXProps = {
  /**
   * Public URL to the FBX file.
   * Default matches: `/public/models/SM_lamp_embedded.fbx` -> `/models/SM_lamp_embedded.fbx`
   */
  url?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
};

/**
 * Loads and renders the embedded lamp FBX as a primitive.
 *
 * We clone the loaded FBX so we can safely tweak materials and shadow flags.
 */
export function LampFBX({
  url = "/models/SM_lamp_embedded.fbx",
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: LampFBXProps) {
  const fbx = useLoader(FBXLoader, url);

  const model = useMemo(() => {
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

        // Avoid excessively shiny imports (common with FBX).
        const pbr = m as THREE.MeshStandardMaterial;
        if (typeof pbr.roughness === "number") {
          pbr.roughness = Math.max(pbr.roughness, 0.5);
        }
        if (typeof pbr.metalness === "number") {
          pbr.metalness = Math.min(pbr.metalness, 0.35);
        }
      }
    });

    return root;
  }, [fbx]);

  return <primitive object={model} position={position} rotation={rotation} scale={scale} />;
}

