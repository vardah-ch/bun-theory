"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Quaternion, Vector3, type Group } from "three";
import { stackLayers, type LayerSpec, type PlacedLayer } from "@/lib/burger/layers";
import { Layer } from "./Layer";
import { explodedPoses } from "./Burger";

type Spring = { x: number; v: number; target: number };
type Entry = { layer: PlacedLayer; exiting: boolean; enterAt: number };

const variantOf = (s: LayerSpec) => ("variant" in s ? s.variant : "");

/** Keys include the variant, so swapping brioche for potato is an exit plus an entrance, not a silent swap. */
function placeWithKeys(specs: LayerSpec[]) {
  const { layers, height } = stackLayers(specs);
  const seen: Record<string, number> = {};
  return {
    height,
    layers: layers.map((l) => {
      const base = `${l.spec.kind}:${variantOf(l.spec)}`;
      const n = (seen[base] = (seen[base] ?? 0) + 1);
      return { ...l, key: `${base}#${n}` };
    }),
  };
}

function step(s: Spring, k: number, damping: number, dt: number) {
  const c = 2 * Math.sqrt(k) * damping;
  const a = k * (s.target - s.x) - c * s.v;
  s.v += a * dt;
  s.x += s.v * dt;
}

type Props = {
  specs: LayerSpec[];
  /** 0 = stacked, 1 = pulled apart for inspection. */
  explode?: number;
};

/**
 * The configurator's burger. Layers that join drop in from above and land
 * with a bounce; layers that leave are flicked off to the side; everything in
 * between slides to its new height. All motion is spring-driven, so rapid
 * clicking never leaves the stack in a broken intermediate state.
 */
export function BuildBurger({ specs, explode = 0 }: Props) {
  const { layers, height } = useMemo(() => placeWithKeys(specs), [specs]);
  const poses = useMemo(() => explodedPoses(layers, 0.55), [layers]);

  const [entries, setEntries] = useState<Entry[]>([]);
  const ys = useRef<Record<string, Spring>>({});
  const presence = useRef<Record<string, Spring>>({});
  const blow = useRef<Spring>({ x: 0, v: 0, target: 0 });
  const center = useRef<Spring>({ x: -height / 2, v: 0, target: -height / 2 });
  const zoom = useRef<Spring>({ x: 1, v: 0, target: 1 });
  const clock = useRef(0);
  const first = useRef(true);
  const root = useRef<Group>(null);
  const facing = useRef(0);
  const tmp = useMemo(() => ({ q: new Quaternion(), v: new Vector3(), w: new Vector3() }), []);

  // Reconcile the new stack with what's on screen.
  useEffect(() => {
    const now = clock.current;
    setEntries((prev) => {
      const next = new Map<string, Entry>();
      layers.forEach((l, i) => {
        const old = prev.find((e) => e.layer.key === l.key);
        // On first load the burger builds itself bottom-up, one layer at a time.
        const enterAt = old && !old.exiting ? old.enterAt : now + (first.current ? i * 0.12 : 0);
        next.set(l.key, { layer: l, exiting: false, enterAt });
        ys.current[l.key] ??= { x: l.y, v: 0, target: l.y };
        ys.current[l.key].target = l.y;
        presence.current[l.key] ??= { x: 0, v: 0, target: 0 };
      });
      prev.forEach((e) => {
        if (!next.has(e.layer.key)) next.set(e.layer.key, { ...e, exiting: true });
      });
      first.current = false;
      return [...next.values()];
    });
  }, [layers, height]);

  useFrame((state, delta) => {
    const elapsed = Math.min(delta, 0.25);
    clock.current += elapsed;
    const steps = Math.max(1, Math.ceil(elapsed * 120));
    const dt = elapsed / steps;
    blow.current.target = explode;
    // Inspect mode: shrink the whole stack so the pulled-apart version fits the
    // same viewport, and centre on the exploded column instead of the burger.
    const n = layers.length;
    const explodedSpan = (n - 1) * 0.55 + 1;
    const fit = Math.min(1, 3.4 / explodedSpan);
    const base = layers[0] ? layers[0].height / 2 : 0;
    zoom.current.target = explode > 0.5 ? fit : 1;
    center.current.target = explode > 0.5 ? -(base + ((n - 1) * 0.55) / 2) * fit : -height / 2;

    let finished: string[] | null = null;
    for (const e of entries) {
      const key = e.layer.key;
      const p = presence.current[key];
      const y = ys.current[key];
      if (!p || !y) continue;
      p.target = e.exiting ? 0 : clock.current >= e.enterAt ? 1 : 0;
      for (let j = 0; j < steps; j++) {
        step(p, e.exiting ? 70 : 140, e.exiting ? 0.9 : 0.5, dt);
        step(y, 160, 0.75, dt);
      }
      if (e.exiting && p.x < 0.02) (finished ??= []).push(key);
    }
    for (let j = 0; j < steps; j++) {
      step(blow.current, 60, 0.8, dt);
      step(center.current, 120, 0.85, dt);
      step(zoom.current, 120, 0.85, dt);
    }
    if (root.current) {
      root.current.position.y = center.current.x;
      root.current.scale.setScalar(zoom.current.x);
      root.current.getWorldQuaternion(tmp.q);
      tmp.v.copy(state.camera.position).sub(root.current.getWorldPosition(tmp.w)).applyQuaternion(tmp.q.invert());
      facing.current = Math.atan2(tmp.v.x, tmp.v.z);
    }
    if (finished) {
      const done = new Set(finished);
      finished.forEach((k) => {
        delete presence.current[k];
        delete ys.current[k];
      });
      setEntries((prev) => prev.filter((e) => !(e.exiting && done.has(e.layer.key))));
    }
  }, -1);

  return (
    <group ref={root}>
      {entries.map((e) => (
        <Layer
          key={e.layer.key}
          layer={e.layer}
          pose={poses[e.layer.key] ?? { y: 0 }}
          getT={() => (e.exiting ? 0 : blow.current.x)}
          getFacing={() => facing.current}
          getY={() => ys.current[e.layer.key]?.x ?? e.layer.y}
          getPresence={() => ({ v: presence.current[e.layer.key]?.x ?? 0, exiting: e.exiting })}
        />
      ))}
    </group>
  );
}
