// Shared, mutable story state. GSAP's scrubbed timeline writes these numbers;
// the WebGL frame loop reads them. Nothing here goes through React state, so
// scrolling never triggers a re-render.
import type { Object3D } from "three";

export type CameraPose = {
  /** Orbit angle around the burger (radians). */
  theta: number;
  /** Elevation above the burger's equator (radians). */
  phi: number;
  distance: number;
  /** World height the camera looks at. */
  targetY: number;
};

export const story = {
  /** Explode target per layer key, 0 = stacked, 1 = dissected. */
  targets: {} as Record<string, number>,
  camera: { theta: 0, phi: 0.12, distance: 7.6, targetY: 0 } as CameraPose,
  /** Extra spin applied to the whole burger (radians). */
  spin: 0,
  /** Opacity of the ingredient annotations. */
  labels: 0,
  /** Live scene objects per layer key, registered by the homepage burger. */
  objects: new Map<string, { object: Object3D; height: number }>(),
  /** Annotation elements per layer key, positioned every frame from the 3D scene. */
  labelEls: new Map<string, HTMLElement>(),
};

// Dev only: lets browser tests read the live story state.
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __story: typeof story }).__story = story;
}
