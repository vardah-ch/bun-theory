"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Quaternion, Vector3, type Group } from "three";
import { stackLayers, type LayerSpec, type PlacedLayer } from "@/lib/burger/layers";
import { Layer, type ExplodedPose } from "./Layer";

/**
 * The dissection layout. Layers fan out on a vertical axis with roughly even
 * gaps, then each kind adds its own gesture: the crown tips back to show its
 * crumb, lettuce opens wide, the patty drops away from the bread.
 */
export function explodedPoses(layers: PlacedLayer[], gap = 0.72): Record<string, ExplodedPose> {
  const out: Record<string, ExplodedPose> = {};
  const base = layers[0] ? layers[0].y + layers[0].height / 2 : 0;
  layers.forEach((l, i) => {
    // The bottom bun is the anchor; everything above fans upward from it.
    const slot = base + i * gap;
    const y = slot - (l.y + l.height / 2);
    const side = i % 2 ? 1 : -1;
    switch (l.spec.kind) {
      case "bunTop": out[l.key] = { y: y + 0.35, rx: 0.22, rz: 0.1 }; break;
      case "bunBottom": out[l.key] = { y: 0, rx: 0.05 }; break;
      case "patty": out[l.key] = { y: y - 0.15, rx: 0.35, rz: -0.06, x: side * 0.12 }; break;
      case "cheese": out[l.key] = { y, x: 0.5, rx: 0.38, ry: 0.4, rz: 0.08 }; break;
      case "lettuce": out[l.key] = { y, x: -0.3, rz: 0.1, rx: 0.34, scale: 1.12 }; break;
      case "sauce": out[l.key] = { y, rx: 0.3, scale: 0.95, x: side * 0.1 }; break;
      case "tomato": out[l.key] = { y, rx: 0.3, ry: 0.5 }; break;
      case "onion": out[l.key] = { y, rx: 0.25 }; break;
      default: out[l.key] = { y, rx: 0.25, x: side * 0.2 };
    }
  });
  return out;
}

type Spring = { x: number; v: number };

type BurgerProps = {
  specs: LayerSpec[];
  /** Per-layer explode targets (0..1), mutated externally (e.g. by a GSAP timeline). */
  targets?: Record<string, number>;
  gap?: number;
  /** Lower = looser, more overshoot. */
  stiffness?: number;
  damping?: number;
  castShadow?: boolean;
  onGroup?: (key: string, group: Group | null, height: number) => void;
};

export function Burger({ specs, targets, gap, stiffness = 90, damping = 0.68, castShadow = true, onGroup }: BurgerProps) {
  const { layers, height } = useMemo(() => stackLayers(specs), [specs]);
  const poses = useMemo(() => explodedPoses(layers, gap), [layers, gap]);
  const springs = useRef<Record<string, Spring>>({});
  const root = useRef<Group>(null);
  const facing = useRef(0);
  const tmp = useRef({ q: new Quaternion(), v: new Vector3(), fwd: new Vector3() });

  // Runs before the layers' own frame callbacks so they read this frame's values.
  useFrame((state, delta) => {
    // Fixed 1/120 s sub-steps covering the real elapsed time: the motion runs
    // at true speed on a 20 fps phone too, and stays stable on a 144 Hz screen.
    const elapsed = Math.min(delta, 0.25);
    const steps = Math.max(1, Math.ceil(elapsed * 120));
    const dt = elapsed / steps;
    const k = stiffness, c = 2 * Math.sqrt(k) * damping;
    for (const l of layers) {
      const s = (springs.current[l.key] ??= { x: 0, v: 0 });
      const target = targets?.[l.key] ?? 0;
      for (let j = 0; j < steps; j++) {
        const a = k * (target - s.x) - c * s.v;
        s.v += a * dt;
        s.x += s.v * dt;
      }
    }

    // Yaw (in the burger's own frame) that points at the camera. Exploded
    // parts turn to it, so their tilts always read toward the viewer.
    const g = root.current;
    if (g) {
      const { q, v, fwd } = tmp.current;
      g.getWorldQuaternion(q);
      v.copy(state.camera.position).sub(g.getWorldPosition(fwd)).applyQuaternion(q.invert());
      facing.current = Math.atan2(v.x, v.z);
    }
  }, -1);

  return (
    <group ref={root} position-y={-height / 2}>
      {layers.map((l) => (
        <Layer
          key={l.key}
          layer={l}
          pose={poses[l.key]}
          getT={() => springs.current[l.key]?.x ?? 0}
          getFacing={() => facing.current}
          castShadow={castShadow}
          onGroup={onGroup}
        />
      ))}
    </group>
  );
}
