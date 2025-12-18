import { Canvas } from "@react-three/fiber";
import { Scene } from "./Scene";

export default function App() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2.6, 8.5], fov: 50, near: 0.1, far: 60 }}
      gl={{ antialias: true }}
    >
      <Scene />
    </Canvas>
  );
}

