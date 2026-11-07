"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import type { Group } from "three";
import type { Product } from "@/lib/catalog/types";
import { stackLayers } from "@/lib/burger/layers";
import { Burger } from "./burger/Burger";
import { BuildBurger } from "./burger/BuildBurger";
import { Prop } from "./props/Props";
import { StudioLights } from "./StudioLights";

function Subject({ product }: { product: Pick<Product, "layers" | "artwork" | "category"> }) {
  if (product.category === "combos") {
    return (
      <group position-y={0.2}>
        {product.layers && (
          <group position={[-0.55, 0, 0.55]} scale={0.82}>
            <Burger specs={product.layers} />
          </group>
        )}
        <group position={[1.25, -0.05, 0.1]} scale={0.6}>
          <Prop artwork="fries" />
        </group>
        <group position={[-0.2, 0.2, -1.4]} scale={0.6}>
          <Prop artwork={product.layers ? "cup" : "shake"} />
        </group>
      </group>
    );
  }
  // Animated burger: customisations (no onion, extra patty…) drop in or slide out live.
  if (product.layers) return <BuildBurger specs={product.layers} />;
  if (product.artwork) return <Prop artwork={product.artwork} />;
  return null;
}

function Spin({ children, speed }: { children: React.ReactNode; speed: number }) {
  const ref = useRef<Group>(null);
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.y += d * speed;
  });
  return <group ref={ref}>{children}</group>;
}

type Props = {
  product: Pick<Product, "layers" | "artwork" | "category">;
  /** Studio capture: fixed three-quarter angle, no motion, keep the frame for screenshots. */
  still?: boolean;
  interactive?: boolean;
};

export default function ProductScene({ product, still = false, interactive = false }: Props) {
  const h = product.layers ? stackLayers(product.layers).height : 2.2;
  const distance = product.category === "combos" ? 9.5 : Math.max(7, h * 3.3);
  return (
    <Canvas
      shadows="percentage"
      dpr={still ? 2 : [1, 1.8]}
      camera={{ fov: 28, position: [distance * 0.34, distance * 0.3, distance * 0.89] }}
      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: still }}
    >
      <StudioLights />
      <group rotation-y={still ? -0.35 : 0}>
        {still ? (
          <Subject product={product} />
        ) : (
          <Spin speed={interactive ? 0 : 0.25}>
            <Subject product={product} />
          </Spin>
        )}
      </group>
      <ContactShadows position-y={-h / 2 - 0.05} opacity={0.7} scale={8} blur={2.4} far={3} />
      {interactive && <OrbitControls enablePan={false} minDistance={4} maxDistance={14} autoRotate autoRotateSpeed={0.6} target={[0, 0, 0]} />}
    </Canvas>
  );
}
