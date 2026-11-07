"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Euler, MathUtils, Quaternion, type Group, type InstancedMesh, type Mesh } from "three";
import type { PlacedLayer } from "@/lib/burger/layers";
import * as G from "./geometries";
import * as M from "./materials";

/** Where a layer goes when the burger is taken apart (offsets from its assembled pose). */
export type ExplodedPose = {
  y: number;
  x?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  scale?: number;
};

type Props = {
  layer: PlacedLayer;
  pose?: ExplodedPose;
  /** 0 = assembled, 1 = fully exploded. Read every frame, never stored in React state. */
  getT?: () => number;
  /** Yaw toward the camera in the burger's frame; exploded offsets and tilts are applied in it. */
  getFacing?: () => number;
  /** Animated stack height (configurator); defaults to the layer's static position. */
  getY?: () => number;
  /** Entrance/exit: 1 = in place; below 1 it hangs above (entering) or slides off (exiting). */
  getPresence?: () => { v: number; exiting: boolean };
  castShadow?: boolean;
  /** Called with the layer's root group so outside code (labels) can track it. */
  onGroup?: (key: string, group: Group | null, height: number) => void;
};

const zero = () => 0;
const IDENTITY = new Quaternion();
const lerp = MathUtils.lerp;

export function Layer({ layer, pose, getT = zero, getFacing = zero, getY, getPresence, castShadow = true, onGroup }: Props) {
  const group = useRef<Group>(null);
  const parts = useRef<(Group | Mesh | null)[]>([]);
  const cheese = useRef<Mesh>(null);
  const { spec } = layer;
  const rot = useMemo(() => ({ e: new Euler(0, 0, 0, "YXZ"), q: new Quaternion() }), []);

  useLayoutEffect(() => {
    if (!onGroup) return;
    onGroup(layer.key, group.current, layer.height);
    return () => onGroup(layer.key, null, layer.height);
  }, [onGroup, layer.key, layer.height]);

  // Sub-parts (tomato slices, onion rings) drift apart on their own paths.
  const partHomes = useMemo(() => partLayout(spec.kind), [spec.kind]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const t = getT();
    const p = pose ?? { y: 0 };
    // Offsets are authored as screen-right (x) / toward-viewer (z): rotate them into the burger's frame.
    const f = getFacing();
    const cf = Math.cos(f), sf = Math.sin(f);
    const ox = p.x ?? 0, oz = p.z ?? 0;
    const baseY = getY ? getY() : layer.y;
    g.position.set((ox * cf + oz * sf) * t, baseY + p.y * t, (-ox * sf + oz * cf) * t);
    // YXZ: turn to face the viewer first, so rx tilts the layer's face toward the camera.
    // Slerp from rest takes the shortest path even when the facing angle wraps past ±180°.
    rot.e.set(p.rx ?? 0, f + (p.ry ?? 0), p.rz ?? 0);
    rot.q.setFromEuler(rot.e);
    g.quaternion.slerpQuaternions(IDENTITY, rot.q, MathUtils.clamp(t, -0.2, 1.2));
    g.scale.setScalar(lerp(1, p.scale ?? 1, t));

    if (getPresence) {
      const { v, exiting } = getPresence();
      const out = 1 - MathUtils.clamp(v, 0, 1.2);
      if (exiting) {
        // Leaves sideways toward screen-right with a tumble, like it's been flicked off.
        g.position.x += out * 3.2 * cf;
        g.position.z += -out * 3.2 * sf;
        g.position.y += out * 0.6;
        g.rotateZ(-out * 1.1);
      } else {
        // Arrives from above and lands; the spring's overshoot gives it the bounce.
        g.position.y += out * 2.8;
        g.rotateX(out * 0.5);
      }
      g.scale.multiplyScalar(MathUtils.clamp(v, 0.001, 1.1));
      g.visible = v > 0.01;
    }

    partHomes.forEach((home, i) => {
      const part = parts.current[i];
      if (!part) return;
      part.position.set(lerp(home.x, home.ex, t), lerp(home.y, home.ey, t), lerp(home.z, home.ez, t));
      part.rotation.set(lerp(0, home.erx, t), lerp(home.ry, home.ery, t), 0);
    });

    if (cheese.current?.morphTargetInfluences) cheese.current.morphTargetInfluences[0] = t;
  });

  return (
    <group ref={group} position-y={layer.y}>
      <LayerMeshes layer={layer} parts={parts} cheese={cheese} partHomes={partHomes} castShadow={castShadow} />
    </group>
  );
}

type PartHome = { x: number; y: number; z: number; ry: number; ex: number; ey: number; ez: number; erx: number; ery: number };

function partLayout(kind: PlacedLayer["spec"]["kind"]): PartHome[] {
  if (kind === "tomato") {
    return [0, 1, 2].map((i) => {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      return {
        x: Math.cos(a) * 0.43, y: i * 0.004, z: Math.sin(a) * 0.43, ry: a,
        ex: Math.cos(a) * 0.95, ey: 0.12 * (i - 1), ez: Math.sin(a) * 0.95,
        erx: 0.55 + i * 0.25, ery: a + Math.PI * (0.6 + i * 0.3),
      };
    });
  }
  if (kind === "onion") {
    const rings: [number, number, number][] = [
      [-0.33, 0.18, 0.44], [-0.33, 0.18, 0.33], [0.36, -0.14, 0.42], [0.36, -0.14, 0.3], [0.05, 0.42, 0.36], [-0.05, -0.5, 0.32],
    ];
    return rings.map(([x, z], i) => ({
      x, y: 0, z, ry: 0,
      ex: x * 2.4 + (i % 2 ? 0.25 : -0.25), ey: (i - 2.5) * 0.09, ez: z * 2.1,
      erx: 0.9 + i * 0.12, ery: i * 0.7,
    }));
  }
  if (kind === "pickles" || kind === "jalapeno") {
    const n = kind === "pickles" ? 6 : 8;
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + 0.2;
      const r = i % 2 ? 0.62 : 0.38;
      return {
        x: Math.cos(a) * r, y: (i % 3) * 0.004, z: Math.sin(a) * r, ry: a,
        ex: Math.cos(a) * r * 1.9, ey: (i % 3) * 0.06, ez: Math.sin(a) * r * 1.9, erx: 0.6, ery: a + 1.2,
      };
    });
  }
  return [];
}

type MeshProps = {
  layer: PlacedLayer;
  parts: React.RefObject<(Group | Mesh | null)[]>;
  cheese: React.RefObject<Mesh | null>;
  partHomes: PartHome[];
  castShadow: boolean;
};

function LayerMeshes({ layer, parts, cheese, partHomes, castShadow: cs }: MeshProps) {
  const { spec, height } = layer;
  const setPart = (i: number) => (el: Group | Mesh | null) => {
    parts.current[i] = el;
  };

  switch (spec.kind) {
    case "bunTop":
      return (
        <>
          <mesh geometry={G.bunTopGeometry(spec.variant, height)} material={M.bunMaterial(spec.variant)} castShadow={cs} receiveShadow />
          {spec.variant === "sesame" && <Seeds height={height} />}
        </>
      );
    case "bunBottom":
      return <mesh geometry={G.bunBottomGeometry(spec.variant, height)} material={M.bunMaterial(spec.variant)} castShadow={cs} receiveShadow />;
    case "patty":
      return <mesh geometry={G.pattyGeometry(spec.variant, height)} material={M.pattyMaterial()} castShadow={cs} receiveShadow />;
    case "cheese":
      return (
        <mesh
          ref={cheese}
          geometry={G.cheeseGeometry()}
          material={M.cheeseMaterial(spec.variant)}
          position-y={0.012}
          castShadow={cs}
          receiveShadow
          onUpdate={(m) => !m.morphTargetInfluences && m.updateMorphTargets()}
        />
      );
    case "sauce":
      return <mesh geometry={G.sauceGeometry(layer.index * 7 + 3)} material={M.sauceMaterial(spec.variant)} position-y={0.008} receiveShadow />;
    case "lettuce":
      return <mesh geometry={G.lettuceGeometry(layer.index + 2)} material={M.lettuceMaterial()} position-y={0.04} castShadow={cs} receiveShadow />;
    case "tomato":
      return (
        <>
          {partHomes.map((h, i) => (
            <mesh
              key={i}
              ref={setPart(i)}
              geometry={G.tomatoGeometry()}
              material={M.tomatoMaterials()}
              position={[h.x, h.y, h.z]}
              rotation-y={h.ry}
              castShadow={cs}
              receiveShadow
            />
          ))}
        </>
      );
    case "onion": {
      const radii = [0.44, 0.33, 0.42, 0.3, 0.36, 0.32];
      return (
        <>
          {partHomes.map((h, i) => (
            <mesh
              key={i}
              ref={setPart(i)}
              geometry={G.onionRingGeometry(radii[i])}
              material={M.onionMaterial(i % 2 === 0)}
              position={[h.x, h.y, h.z]}
              castShadow={cs}
            />
          ))}
        </>
      );
    }
    case "pickles":
    case "jalapeno":
      return (
        <>
          {partHomes.map((h, i) => (
            <mesh
              key={i}
              ref={setPart(i)}
              geometry={spec.kind === "pickles" ? G.pickleGeometry() : G.jalapenoGeometry()}
              material={spec.kind === "pickles" ? M.pickleMaterial() : M.jalapenoMaterial()}
              position={[h.x, h.y, h.z]}
              rotation-y={h.ry}
              castShadow={cs}
            />
          ))}
        </>
      );
    case "crispyOnion":
      return <CrispyOnions />;
  }
}

function Seeds({ height }: { height: number }) {
  const ref = useRef<InstancedMesh>(null);
  const matrices = G.sesameMatrices(height);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    matrices.forEach((mat, i) => m.setMatrixAt(i, mat));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [matrices]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, matrices.length]} material={M.seedMaterial()} castShadow>
      <sphereGeometry args={[1, 10, 6]} />
    </instancedMesh>
  );
}

function CrispyOnions() {
  const ref = useRef<InstancedMesh>(null);
  const matrices = G.crispyOnionMatrices();
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    matrices.forEach((mat, i) => m.setMatrixAt(i, mat));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [matrices]);
  return <instancedMesh ref={ref} args={[G.crispyOnionGeometry(), M.crispyMaterial(), matrices.length]} castShadow />;
}
