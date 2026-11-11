import { Color, DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, type Material } from "three";
import type { BunVariant, CheeseVariant, SauceVariant } from "@/lib/burger/layers";
import { bunGloss, CHEESE_COLOR } from "./geometries";
import { swissHoles, tomatoTexture } from "./textures";
import { addCrust } from "./crust";

const cache = new Map<string, Material | Material[]>();

/**
 * Phones and low-core devices get "lite" materials: no sheen (a costly extra
 * lighting lobe), gloss kept. It's barely visible at phone size and roughly
 * halves the shading cost of the bread and leaves.
 */
const LITE =
  typeof window !== "undefined" &&
  (window.matchMedia("(pointer: coarse)").matches || (navigator.hardwareConcurrency ?? 8) <= 4);
const sheen = (v: number) => (LITE ? 0 : v);
function memo<T extends Material | Material[]>(key: string, build: () => T): T {
  if (!cache.has(key)) cache.set(key, build());
  return cache.get(key) as T;
}

export const SAUCE_COLOR: Record<SauceVariant, string> = {
  signature: "#f7a86a",
  bbq: "#6e1e0a",
  spicy: "#ee3d1a",
  mustard: "#f2b51a",
};

export const bunMaterial = (v: BunVariant) =>
  memo(`bun-${v}`, () => {
    const gloss = bunGloss(v);
    // Egg-wash shine: a soft clear layer (not lacquer) over a fine, slightly
    // mottled bake, so it reads as bread and not as plastic.
    return addCrust(
      new MeshPhysicalMaterial({
        vertexColors: true,
        roughness: 0.62 - gloss * 0.2,
        clearcoat: 0.18 + gloss * 0.32,
        clearcoatRoughness: 0.45,
        sheen: sheen(0.7),
        sheenRoughness: 0.8,
        sheenColor: new Color("#ffd2a0"),
      }),
      { scale: 9, color: 0.16, rough: 0.25, bump: 0.0035, char: [0.32, 0.12, 0.03] },
    );
  });

export const seedMaterial = () => memo("seed", () => new MeshStandardMaterial({ color: "#f4e3b9", roughness: 0.55 }));

export const pattyMaterial = () =>
  memo("patty", () =>
    // A hard sear: craggy, dry crust with charred pits and a few glistening
    // spots of rendered fat. A glossy clear coat everywhere made it read as chocolate.
    addCrust(
      new MeshPhysicalMaterial({
        vertexColors: true,
        roughness: 0.72,
        clearcoat: 0.32,
        clearcoatRoughness: 0.35,
        sheen: sheen(0.35),
        sheenRoughness: 0.6,
        sheenColor: new Color("#ff8a4a"),
      }),
      { scale: 14, color: 0.55, rough: 0.7, bump: 0.012, char: [0.035, 0.012, 0.004] },
    ));

export const cheeseMaterial = (v: CheeseVariant) =>
  memo(`cheese-${v}`, () => {
    const m = new MeshPhysicalMaterial({
      color: CHEESE_COLOR[v],
      roughness: 0.26,
      clearcoat: 0.7,
      clearcoatRoughness: 0.15,
      side: DoubleSide,
      sheen: sheen(0.5),
      sheenColor: new Color("#ffe08a"),
      // Self-glow stands in for light scattering through warm, melting cheese.
      emissive: new Color(CHEESE_COLOR[v]).multiplyScalar(0.3),
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
      // Creamy and wet: glossy, and lit a little from within so it never
      // reads as a dark disc when the light skims across it.
      roughness: 0.14,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      emissive: new Color(SAUCE_COLOR[v]).multiplyScalar(0.32),
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
      sheen: sheen(0.4),
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
      sheen: sheen(0.5),
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
