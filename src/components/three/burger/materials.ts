import { Color, DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, type Material } from "three";
import type { BunVariant, CheeseVariant, SauceVariant } from "@/lib/burger/layers";
import { bunGloss, CHEESE_COLOR } from "./geometries";
import { swissHoles, tomatoTexture } from "./textures";

const cache = new Map<string, Material | Material[]>();
function memo<T extends Material | Material[]>(key: string, build: () => T): T {
  if (!cache.has(key)) cache.set(key, build());
  return cache.get(key) as T;
}

export const SAUCE_COLOR: Record<SauceVariant, string> = {
  signature: "#f08a4b",
  bbq: "#6e1e0a",
  spicy: "#ee3d1a",
  mustard: "#f2b51a",
};

export const bunMaterial = (v: BunVariant) =>
  memo(`bun-${v}`, () => {
    const gloss = bunGloss(v);
    return new MeshPhysicalMaterial({
      vertexColors: true,
      // Egg-wash shine: a clear glossy layer over a soft, slightly fuzzy crumb.
      roughness: 0.58 - gloss * 0.25,
      clearcoat: 0.35 + gloss * 0.6,
      clearcoatRoughness: 0.32,
      sheen: 0.7,
      sheenRoughness: 0.8,
      sheenColor: new Color("#ffd2a0"),
    });
  });

export const seedMaterial = () => memo("seed", () => new MeshStandardMaterial({ color: "#f4e3b9", roughness: 0.55 }));

export const pattyMaterial = () =>
  memo("patty", () => new MeshPhysicalMaterial({
      vertexColors: true,
      // Seared crust with rendered fat on it: rough underneath, wet highlights on top.
      roughness: 0.6,
      clearcoat: 0.75,
      clearcoatRoughness: 0.28,
      sheen: 0.4,
      sheenRoughness: 0.5,
      sheenColor: new Color("#ff9a5a"),
    }));

export const cheeseMaterial = (v: CheeseVariant) =>
  memo(`cheese-${v}`, () => {
    const m = new MeshPhysicalMaterial({
      color: CHEESE_COLOR[v],
      roughness: 0.3,
      clearcoat: 0.9,
      clearcoatRoughness: 0.18,
      side: DoubleSide,
      sheen: 0.6,
      sheenColor: new Color("#fff0b0"),
      // Self-glow stands in for light scattering through warm, melting cheese.
      emissive: new Color(CHEESE_COLOR[v]).multiplyScalar(0.22),
    });
    if (v === "swiss") {
      m.alphaMap = swissHoles();
      m.alphaTest = 0.5;
    }
    return m;
  });

export const sauceMaterial = (v: SauceVariant) =>
  memo(`sauce-${v}`, () =>
    new MeshPhysicalMaterial({
      color: SAUCE_COLOR[v],
      roughness: 0.08,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      emissive: new Color(SAUCE_COLOR[v]).multiplyScalar(0.12),
      side: DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
  );

export const lettuceMaterial = () =>
  memo("lettuce", () =>
    new MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.42,
      clearcoat: 0.6,
      clearcoatRoughness: 0.25,
      side: DoubleSide,
      sheen: 0.4,
      sheenColor: new Color("#e8ffb0"),
      emissive: new Color("#2c5a0c"),
      emissiveIntensity: 0.25,
    }),
  );

/** Cylinder groups: [side, top cap, bottom cap]. */
export const tomatoMaterials = () =>
  memo("tomato", () => {
    const side = new MeshPhysicalMaterial({ color: "#d81e0e", roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.1 });
    const face = new MeshPhysicalMaterial({ map: tomatoTexture(), roughness: 0.18, clearcoat: 0.8, clearcoatRoughness: 0.15 });
    return [side, face, face];
  });

export const onionMaterial = (outer: boolean) =>
  memo(`onion-${outer}`, () =>
    new MeshPhysicalMaterial({
      color: outer ? "#b8648f" : "#f1e4ee",
      roughness: 0.3,
      clearcoat: 0.7,
      sheen: 0.5,
      sheenColor: new Color("#ffffff"),
      transparent: true,
      opacity: 0.93,
    }),
  );

export const pickleMaterial = () =>
  memo("pickle", () => new MeshPhysicalMaterial({ vertexColors: true, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2 }));

export const jalapenoMaterial = () =>
  memo("jalapeno", () => new MeshPhysicalMaterial({ color: "#3d7a1f", roughness: 0.25, clearcoat: 1 }));

export const crispyMaterial = () => memo("crispy", () => new MeshStandardMaterial({ color: "#c7842f", roughness: 0.7 }));
