"use client";

import { Environment, Lightformer } from "@react-three/drei";

/**
 * Food-commercial lighting: a big soft warm key from upper front-left, a
 * golden fill so the shadows stay rich brown instead of black, and two rims
 * behind (golden left, ember right) that put a glossy edge on the bun. Food
 * photographers keep the rims golden rather than red: red rims make bread
 * look like plastic. Reflections come from procedural light panels.
 */
export function StudioLights({ shadows = true }: { shadows?: boolean }) {
  return (
    <>
      <ambientLight intensity={0.12} color="#ffe6c8" />
      <hemisphereLight args={["#fff2dc", "#7a2a10", 0.25]} />
      <spotLight
        position={[-4.5, 6, 5.5]}
        angle={0.45}
        penumbra={0.9}
        intensity={300}
        color="#fff3e0"
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      {/* Front fill: lifts the patty and the cheese out of shadow. */}
      <spotLight position={[2.5, 1.2, 6.5]} angle={0.5} penumbra={1} intensity={45} color="#ffd9a8" />
      <spotLight position={[5, 2.5, -5]} angle={0.6} penumbra={1} intensity={130} color="#ff7a30" />
      <spotLight position={[-5.5, 1.8, -4]} angle={0.6} penumbra={1} intensity={120} color="#ffc070" />
      <pointLight position={[0, -2.2, 3]} intensity={6} color="#ffb070" distance={8} />

      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} color="#fff4e4" position={[-3, 4, 4]} scale={[5, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.8} color="#ffe0b0" position={[3, 1, 5]} scale={[3, 2, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.4} color="#ff7a30" position={[5, 1, -3]} scale={[2, 6, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={1.6} color="#ffb24a" position={[-4, 0, -4]} scale={2.5} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.5} color="#6a2a10" position={[0, -5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
      </Environment>
    </>
  );
}
