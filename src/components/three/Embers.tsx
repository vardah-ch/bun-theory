"use client";

import { useEffect, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from "three";
import { rng } from "./burger/noise";
import { STEAM_LAYER, useEffectsLayer } from "./Appetite";

/**
 * Sparks rising off a grill: they drift up, sway, flicker and burn out.
 * Kept sparse and slow on purpose. They should read as heat, not as confetti.
 */
export function Embers({ count = 260 }: { count?: number }) {
  useEffectsLayer();
  const geometry = useMemo(() => {
    const rand = rng(99);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * 11;
      pos[i * 3 + 1] = (rand() - 0.5) * 7;
      pos[i * 3 + 2] = (rand() - 0.5) * 6 - 1;
      seed[i] = rand();
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new BufferAttribute(seed, 1));
    return g;
  }, [count]);

  const [material, setMaterial] = useState<ShaderMaterial | null>(null);

  useEffect(() => {
    const nextMaterial = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPixel: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime;
        uniform float uPixel;
        varying float vAlpha;
        varying float vHeat;
        void main() {
          vec3 p = position;
          float speed = 0.12 + aSeed * 0.22;
          float life = fract(uTime * speed * 0.18 + aSeed * 7.0);
          p.y = mix(-3.5, 3.5, life) + position.y * 0.15;
          p.x += sin(uTime * (0.4 + aSeed) + aSeed * 30.0) * 0.35;
          p.z += cos(uTime * (0.3 + aSeed * 0.5) + aSeed * 12.0) * 0.25;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float flicker = 0.65 + 0.35 * sin(uTime * (6.0 + aSeed * 9.0) + aSeed * 40.0);
          vAlpha = smoothstep(0.0, 0.15, life) * (1.0 - smoothstep(0.55, 1.0, life)) * flicker;
          vHeat = aSeed;
          gl_PointSize = (1.5 + aSeed * 3.5) * uPixel * (6.0 / -mv.z);
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        varying float vHeat;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          vec3 col = mix(vec3(1.0, 0.34, 0.08), vec3(1.0, 0.78, 0.45), vHeat * vHeat);
          gl_FragColor = vec4(col, a * vAlpha * 0.85);
        }
      `,
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMaterial(nextMaterial);
    return () => nextMaterial.dispose();
  }, []);

  useFrame((state) => {
    if (!material) return;
    // eslint-disable-next-line react-hooks/immutability
    material.uniforms.uTime.value = state.clock.elapsedTime;
    // eslint-disable-next-line react-hooks/immutability
    material.uniforms.uPixel.value = state.viewport.dpr;
  });

  if (!material) return null;
  return <points geometry={geometry} material={material} frustumCulled={false} layers={STEAM_LAYER} />;
}
