"use client";

// Studio props for everything on the menu that isn't a burger. Built from
// primitives in the same lighting language as the burgers, so the whole
// menu photographs as one set.

import { useLayoutEffect, useMemo, useRef } from "react";
import {
  CanvasTexture,
  CatmullRomCurve3,
  TubeGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  LatheGeometry,
  Matrix4,
  MeshPhysicalMaterial,
  Quaternion,
  SRGBColorSpace,
  Vector2,
  Vector3,
  type InstancedMesh,
} from "three";
import type { Artwork } from "@/lib/catalog/types";
import { rng } from "../burger/noise";

const fryMat = new MeshPhysicalMaterial({ color: "#e7b552", roughness: 0.55, clearcoat: 0.3, sheen: 0.5, sheenColor: new Color("#ffe2a0") });
const red = "#d8361b";

/**
 * Brand print for cartons and cups. Four identical panels across the texture,
 * one per carton face, so the mark never wraps around a fold.
 */
let printTex: CanvasTexture | null = null;
function brandPrint(base: string) {
  if (printTex) return printTex;
  const cv = document.createElement("canvas");
  cv.width = 1024;
  cv.height = 256;
  const g = cv.getContext("2d")!;
  g.fillStyle = base;
  g.fillRect(0, 0, 1024, 256);
  g.fillStyle = "#f5e8d0";
  g.fillRect(0, 22, 1024, 5);
  g.fillRect(0, 229, 1024, 5);
  g.textAlign = "center";
  for (let i = 0; i < 4; i++) {
    const cx = i * 256 + 128;
    g.font = "900 58px 'Arial Narrow', Arial, sans-serif";
    g.fillText("BUN", cx, 118);
    g.font = "900 40px 'Arial Narrow', Arial, sans-serif";
    g.fillText("THEORY", cx, 170);
  }
  printTex = new CanvasTexture(cv);
  printTex.colorSpace = SRGBColorSpace;
  return printTex;
}

function useInstances(count: number, place: (i: number, r: () => number) => Matrix4, seed = 1) {
  const ref = useRef<InstancedMesh>(null);
  const mats = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, (_, i) => place(i, r));
  }, [count, place, seed]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    mats.forEach((x, i) => m.setMatrixAt(i, x));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [mats]);
  return ref;
}

const compose = (p: Vector3, axis: Vector3, angle: number, s: Vector3) =>
  new Matrix4().compose(p, new Quaternion().setFromAxisAngle(axis.normalize(), angle), s);

/* ── Fries in a carton ─────────────────────────────────────────────── */

const placeFry = (i: number, r: () => number) => {
  const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.42;
  const h = 0.9 + r() * 0.75;
  return compose(
    new Vector3(Math.cos(a) * d * 1.3, 0.55 + h / 2 - 0.2 + r() * 0.15, Math.sin(a) * d * 0.7),
    new Vector3(r() - 0.5, 0, r() - 0.5),
    (r() - 0.5) * 0.5,
    new Vector3(1, h, 1),
  );
};

function Fries({ loaded = false }: { loaded?: boolean }) {
  const ref = useInstances(70, placeFry, 4);
  const carton = useMemo(() => {
    const g = new CylinderGeometry(0.72, 0.52, 1.1, 4, 1, true);
    g.rotateY(Math.PI / 4);
    g.scale(1.25, 1, 0.75);
    g.translate(0, 0.55, 0);
    return g;
  }, []);
  return (
    <group position-y={-0.9}>
      <mesh geometry={carton} castShadow receiveShadow>
        <meshPhysicalMaterial map={brandPrint(red)} roughness={0.55} side={DoubleSide} />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, fryMat, 70]} castShadow>
        <boxGeometry args={[0.085, 1, 0.085]} />
      </instancedMesh>
      {loaded && <Drizzle />}
    </group>
  );
}

/** Cheese sauce and house sauce zig-zagged over loaded fries. */
function Drizzle() {
  const tubes = useMemo(() => {
    const zigzag = (seed: number, y: number) => {
      const r = rng(seed);
      const pts = Array.from({ length: 9 }, (_, i) => new Vector3(-0.55 + i * 0.14, y + (r() - 0.5) * 0.12, (i % 2 ? 0.28 : -0.28) + (r() - 0.5) * 0.1));
      return new TubeGeometry(new CatmullRomCurve3(pts), 80, 0.035, 8, false);
    };
    return [zigzag(3, 1.62), zigzag(7, 1.7)];
  }, []);
  return (
    <>
      <mesh geometry={tubes[0]} castShadow>
        <meshPhysicalMaterial color="#f2a21f" roughness={0.2} clearcoat={1} />
      </mesh>
      <mesh geometry={tubes[1]} rotation-y={0.5} castShadow>
        <meshPhysicalMaterial color="#e89a6a" roughness={0.15} clearcoat={1} />
      </mesh>
    </>
  );
}

/* ── Onion rings, fried pickles ───────────────────────────────────── */

function Rings() {
  const ref = useInstances(
    6,
    (i, r) =>
      compose(new Vector3((r() - 0.5) * 0.5, -0.6 + i * 0.22, (r() - 0.5) * 0.4), new Vector3(1, 0, r() - 0.5), Math.PI / 2 + (r() - 0.5) * 0.7, new Vector3(1, 1, 1).multiplyScalar(0.9 + r() * 0.25)),
    3,
  );
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 6]} castShadow>
      <torusGeometry args={[0.55, 0.17, 18, 48]} />
      <meshPhysicalMaterial color="#c98a33" roughness={0.75} sheen={0.6} sheenColor="#ffd38a" />
    </instancedMesh>
  );
}

function FriedPickles() {
  const ref = useInstances(
    16,
    (i, r) => {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.9;
      return compose(new Vector3(Math.cos(a) * d, -0.7 + r() * 0.35, Math.sin(a) * d), new Vector3(r() - 0.5, 0, r() - 0.5), r() * 1.2, new Vector3(1, 1, 1));
    },
    5,
  );
  return (
    <group>
      <mesh position-y={-0.85} receiveShadow>
        <cylinderGeometry args={[1.25, 1.1, 0.12, 48]} />
        <meshPhysicalMaterial color="#1a1a1a" roughness={0.4} clearcoat={0.6} />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, 16]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.1, 18]} />
        <meshPhysicalMaterial color="#b98234" roughness={0.8} />
      </instancedMesh>
    </group>
  );
}

/* ── Cups and shakes ──────────────────────────────────────────────── */

function Cup({ shake = false }: { shake?: boolean }) {
  const cup = useMemo(() => {
    const g = new CylinderGeometry(0.62, 0.46, 1.9, 48, 1, true);
    g.translate(0, 0.95, 0);
    return g;
  }, []);
  const whip = useMemo(() => {
    // A soft-serve style swirl as a lathe with a wobbling profile.
    const pts = Array.from({ length: 24 }, (_, i) => {
      const t = i / 23;
      return new Vector2(0.64 * (1 - t) * (0.85 + 0.15 * Math.cos(t * 18)), t * 0.7);
    });
    return new LatheGeometry(pts, 48);
  }, []);
  return (
    <group position-y={-1.1}>
      <mesh geometry={cup} castShadow receiveShadow>
        <meshPhysicalMaterial map={brandPrint(red)} roughness={0.35} clearcoat={0.4} side={DoubleSide} />
      </mesh>
      {shake ? (
        <mesh geometry={whip} position-y={1.9} castShadow>
          <meshPhysicalMaterial color="#f6ead2" roughness={0.6} sheen={1} sheenColor="#ffffff" />
        </mesh>
      ) : (
        <mesh position-y={1.93}>
          <cylinderGeometry args={[0.66, 0.66, 0.07, 48]} />
          <meshPhysicalMaterial color="#f5f0e6" roughness={0.3} transmission={0} opacity={0.92} transparent />
        </mesh>
      )}
      <mesh position={[0.18, 2.35, 0]} rotation-z={-0.18} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 1.2, 12]} />
        <meshStandardMaterial color={shake ? "#ff5722" : "#101010"} roughness={0.4} />
      </mesh>
    </group>
  );
}

/* ── Desserts ─────────────────────────────────────────────────────── */

function Cookie() {
  const chips = useInstances(
    18,
    (i, r) => {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.95;
      return compose(new Vector3(Math.cos(a) * d, 0.13, Math.sin(a) * d), new Vector3(r(), r(), r()), r() * 6, new Vector3(1, 0.6, 1));
    },
    8,
  );
  return (
    <group rotation-x={0.9} position-y={-0.1}>
      <mesh castShadow>
        <cylinderGeometry args={[1.15, 1.18, 0.24, 64]} />
        <meshPhysicalMaterial color="#b7742f" roughness={0.85} sheen={0.4} sheenColor="#ffcf8a" />
      </mesh>
      <instancedMesh ref={chips} args={[undefined, undefined, 18]} castShadow>
        <dodecahedronGeometry args={[0.09, 0]} />
        <meshStandardMaterial color="#2a140a" roughness={0.5} />
      </instancedMesh>
    </group>
  );
}

function SoftServe() {
  const swirl = useMemo(() => {
    const pts = Array.from({ length: 40 }, (_, i) => {
      const t = i / 39;
      return new Vector2(0.62 * (1 - t) * (0.82 + 0.18 * Math.cos(t * 30)), t * 1.5);
    });
    return new LatheGeometry(pts, 64);
  }, []);
  const cone = useMemo(() => new CylinderGeometry(0.62, 0.08, 1.6, 32, 1, true), []);
  return (
    <group position-y={-0.9}>
      <mesh geometry={cone} position-y={0} castShadow>
        <meshStandardMaterial color="#c88a42" roughness={0.8} side={DoubleSide} />
      </mesh>
      <mesh geometry={swirl} position-y={0.8} castShadow>
        <meshPhysicalMaterial color="#f7ecd6" roughness={0.55} sheen={1} sheenColor="#fff" />
      </mesh>
      <mesh position-y={2.15} castShadow>
        <sphereGeometry args={[0.16, 16, 12]} />
        <meshPhysicalMaterial color="#b85a12" roughness={0.15} clearcoat={1} />
      </mesh>
    </group>
  );
}

export function Prop({ artwork }: { artwork: Artwork }) {
  switch (artwork) {
    case "fries": return <Fries />;
    case "loaded-fries": return <Fries loaded />;
    case "rings": return <Rings />;
    case "pickles": return <FriedPickles />;
    case "cup": return <Cup />;
    case "shake": return <Cup shake />;
    case "cookie": return <Cookie />;
    case "softserve": return <SoftServe />;
    case "combo": return <Fries />;
  }
}
