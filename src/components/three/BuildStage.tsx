"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { LayerSpec } from "@/lib/burger/layers";
import { BuildBurger } from "./burger/BuildBurger";
import { StudioLights } from "./StudioLights";
import { Embers } from "./Embers";

export type BuildStageHandle = { resetView: () => void };

type Props = { specs: LayerSpec[]; explode: number; height: number };

/** The configurator viewport: drag to orbit, scroll or pinch to zoom. */
const BuildStage = forwardRef<BuildStageHandle, Props>(function BuildStage({ specs, explode, height }, ref) {
  const controls = useRef<OrbitControlsImpl>(null);
  useImperativeHandle(ref, () => ({ resetView: () => controls.current?.reset() }), []);
  // Taller stacks (double patties, every extra) need the camera further back.
  const distance = Math.max(7.2, height * 3.2);

  return (
    <Canvas shadows="percentage" dpr={[1, 1.8]} camera={{ fov: 30, position: [0, distance * 0.28, distance] }} gl={{ alpha: true, antialias: true }}>
      <StudioLights />
      <BuildBurger specs={specs} explode={explode} />
      <ContactShadows position-y={-Math.max(height, 2) / 2 - 0.08} opacity={0.7} scale={9} blur={2.5} far={4} />
      <Embers count={120} />
      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        enableDamping
        minDistance={4}
        maxDistance={16}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 2 + 0.15}
        autoRotate
        autoRotateSpeed={0.7}
        onStart={() => controls.current && (controls.current.autoRotate = false)}
      />
    </Canvas>
  );
});

export default BuildStage;
