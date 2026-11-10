"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  MathUtils,
  MeshPhysicalMaterial,
  NormalBlending,
  Object3D,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  type InstancedMesh,
} from "three";
import { rng } from "./burger/noise";
import { story } from "./story";

export const STEAM_LAYER = 1;

/**
 * Point-sprite effects live on their own layer: the scene camera sees them,
 * the contact-shadow camera doesn't (it would draw each sprite as a big dark
 * square on the floor). Call from any component that renders such sprites.
 */
export function useEffectsLayer() {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    camera.layers.enable(STEAM_LAYER);
  }, [camera]);
}

/** How far apart the homepage burger is right now, 0 (stacked) to 1 (fully dissected). */
export function explodeAmount() {
  // Only the numeric layer entries: GSAP keeps its own bookkeeping (_gsap) on tween targets.
  let sum = 0, n = 0;
  for (const v of Object.values(story.targets) as unknown[]) {
    if (typeof v === "number") {
      sum += v;
      n++;
    }
  }
  return n ? sum / n : 0;
}

/**
 * Steam curling off a burger that has just left the grill. The cue for "hot
 * and fresh" that food advertising leans on. Soft noise puffs, slow, few.
 * Fades out while the burger is taken apart.
 */
export function Steam({ count = 18, top = 0.9 }: { count?: number; top?: number }) {
  useEffectsLayer();
  const geometry = useMemo(() => {
    const rand = rng(5);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * 0.55;
      pos.set([Math.cos(a) * r, top, Math.sin(a) * r], i * 3);
      seed[i] = rand();
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new BufferAttribute(seed, 1));
    return g;
  }, [count, top]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: NormalBlending,
        uniforms: { uTime: { value: 0 }, uPixel: { value: 1 }, uFade: { value: 1 } },
        vertexShader: /* glsl */ `
          attribute float aSeed;
          uniform float uTime;
          uniform float uPixel;
          varying float vAlpha;
          varying float vSeed;
          void main() {
            vec3 p = position;
            float life = fract(uTime * (0.07 + aSeed * 0.05) + aSeed * 5.0);
            p.y += life * 1.9;
            p.x += sin(life * 5.0 + aSeed * 20.0) * 0.18 * life;
            p.z += cos(life * 4.0 + aSeed * 11.0) * 0.12 * life;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            vAlpha = smoothstep(0.0, 0.25, life) * (1.0 - smoothstep(0.45, 1.0, life));
            vSeed = aSeed;
            gl_PointSize = (90.0 + life * 160.0) * uPixel * (6.0 / -mv.z);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform float uFade;
          varying float vAlpha;
          varying float vSeed;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float noise(vec2 p) {
            vec2 i = floor(p), f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
          }
          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float n = noise(uv * 4.0 + vec2(vSeed * 13.0, -uTime * 0.4)) * 0.6 + noise(uv * 9.0 - uTime * 0.2) * 0.4;
            float a = smoothstep(0.5, 0.05, d) * smoothstep(0.35, 0.75, n);
            gl_FragColor = vec4(vec3(1.0, 0.97, 0.92), a * vAlpha * uFade * 0.32);
          }
        `,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    // Shader uniforms are GPU inputs, mutated per frame by design.
    /* eslint-disable react-hooks/immutability */
    const u = material.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uPixel.value = state.viewport.dpr;
    u.uFade.value = MathUtils.lerp(u.uFade.value, 1 - MathUtils.clamp(explodeAmount() * 3, 0, 1), 0.08);
    /* eslint-enable react-hooks/immutability */
  });

  // Layer 1: seen by the main camera, invisible to the contact-shadow pass
  // (which would otherwise draw every puff as a dark square on the floor).
  return <points geometry={geometry} material={material} frustumCulled={false} layers={STEAM_LAYER} />;
}

const SPLASH_COLORS = ["#f08a4b", "#ee3d1a", "#d8281a", "#f39a52", "#ffb21a", "#f08a4b"];

/**
 * The money shot: as the layers fly apart, sauce and melted cheese spray off
 * the patty in glossy beads, arc, and fall away. It's a pure function of the
 * scroll position, so it plays backwards (beads flying home) on the way up
 * and replays as the stack slams back together.
 */
export function SauceSplash({ count = 70 }: { count?: number }) {
  const ref = useRef<InstancedMesh>(null);
  const drops = useMemo(() => {
    const rand = rng(77);
    return Array.from({ length: count }, () => {
      const a = rand() * Math.PI * 2;
      const up = 0.15 + rand() * 0.9;
      return {
        dir: new Vector3(Math.cos(a), up, Math.sin(a)).normalize(),
        reach: 1.6 + rand() * 2.8,
        // Mostly fine spray, a few heavy drops.
        size: 0.012 + Math.pow(rand(), 3.2) * 0.055,
        delay: rand() * 0.25,
        color: SPLASH_COLORS[Math.floor(rand() * SPLASH_COLORS.length)],
      };
    });
  }, [count]);
  const geometry = useMemo(() => new SphereGeometry(1, 14, 10), []);
  const material = useMemo(
    () => new MeshPhysicalMaterial({ roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, emissive: new Color("#ff8a3a"), emissiveIntensity: 0.12 }),
    [],
  );
  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);

  const tmp = useMemo(() => ({ o: new Vector3(), p: new Vector3(), v: new Vector3(), z: new Vector3(0, 0, 1), dummy: new Object3D() }), []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    drops.forEach((d, i) => mesh.setColorAt(i, new Color(d.color)));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [drops]);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const e = explodeAmount();
    // Stays in the scene (so its shader is compiled up front with everything
    // else); between splashes it simply draws zero beads.
    const visible = e > 0.002 && e < 0.85;
    mesh.count = visible ? drops.length : 0;
    if (!visible) return;
    // Spray from the heart of the burger: the patty, wherever it is in flight.
    const patty = story.objects.get("patty-1");
    if (patty) {
      patty.object.updateWorldMatrix(true, false);
      tmp.o.set(0, patty.height, 0).applyMatrix4(patty.object.matrixWorld);
    } else tmp.o.set(0, 0, 0);

    drops.forEach((d, i) => {
      const k = MathUtils.clamp((e - d.delay * 0.4) / 0.6, 0, 1);
      // Out fast, then gravity takes over; beads swell, stretch along their path, then shrink away.
      const travel = 1 - Math.pow(1 - k, 2.4);
      tmp.p.copy(tmp.o).addScaledVector(d.dir, travel * d.reach);
      tmp.p.y -= k * k * 1.6;
      const life = Math.sin(Math.PI * k);
      const s = d.size * life;
      // Stretch each bead along its flight path: fast drops streak, slow ones round up.
      tmp.v.copy(d.dir).multiplyScalar(d.reach * 2.4 * Math.pow(1 - k, 1.4));
      tmp.v.y -= 3.2 * k;
      const speed = tmp.v.length();
      tmp.dummy.position.copy(tmp.p);
      if (speed > 1e-4) tmp.dummy.quaternion.setFromUnitVectors(tmp.z, tmp.v.divideScalar(speed));
      tmp.dummy.scale.set(s, s, s * (1 + Math.min(speed, 4) * 0.55));
      tmp.dummy.updateMatrix();
      mesh.setMatrixAt(i, tmp.dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[geometry, material, count]} frustumCulled={false} />;
}

/** Feeds the page's background "heat" glow (CSS --heat) from how far the burger is apart. */
export function HeatDriver() {
  const last = useRef(-1);
  useFrame(() => {
    const v = 0.35 + 0.65 * Math.min(explodeAmount() * 1.6, 1);
    if (Math.abs(v - last.current) > 0.004) {
      last.current = v;
      document.documentElement.style.setProperty("--heat", v.toFixed(3));
    }
  });
  useEffect(() => () => {
    document.documentElement.style.removeProperty("--heat");
  }, []);
  return null;
}
