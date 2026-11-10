"use client";

import { useEffect, useMemo, useState } from "react";
import { PerformanceMonitor } from "@react-three/drei";
import { CanvasTexture, SRGBColorSpace } from "three";

/**
 * Soft shadow under the burger. A blurred disc baked into a tiny texture:
 * free to draw, unlike a contact-shadow pass that re-renders the whole scene
 * from below every frame.
 */
export function BlobShadow({ y, size = 3.4, opacity = 0.6, color = "#3a0e02" }: { y: number; size?: number; opacity?: number; color?: string }) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.45, "rgba(255,255,255,0.65)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={y} renderOrder={-1}>
      <planeGeometry args={[size, size * 0.62]} />
      <meshBasicMaterial map={texture} color={color} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/**
 * Resolution that follows the device: starts sharp, and steps the pixel ratio
 * down when the frame rate drops (and back up when there's headroom), so slow
 * phones stay smooth instead of stuttering at full resolution.
 */
export function useAdaptiveDpr(cap = 1.5) {
  // Never render more pixels than the screen has, and never above the cap.
  const [max] = useState(() => (typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, cap)));
  const [dpr, setDpr] = useState(max);
  const monitor = (
    <PerformanceMonitor
      bounds={() => [45, 58]}
      flipflops={4}
      onDecline={() => setDpr((d) => Math.max(0.7, +(d - 0.25).toFixed(2)))}
      onIncline={() => setDpr((d) => Math.min(max, +(d + 0.25).toFixed(2)))}
    />
  );
  return { dpr, monitor };
}
