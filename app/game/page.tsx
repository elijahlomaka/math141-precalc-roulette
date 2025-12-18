"use client";

import { Scene } from "@/components/Scene";

export default function GamePage() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#05060a",
        overflow: "hidden",
      }}
    >
      <Scene />
    </div>
  );
}
