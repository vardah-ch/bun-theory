import type { MeshPhysicalMaterial, MeshStandardMaterial } from "three";

/**
 * Surface detail computed per pixel, not per vertex: a 3D noise sampled in the
 * mesh's own space darkens the colour into crust, varies the roughness, and
 * bumps the normal. It stays sharp however close the camera gets, needs no UVs
 * or texture downloads, and moves with the mesh as the burger comes apart.
 */
export type CrustOptions = {
  /** Noise frequency in model units: higher means finer grain. */
  scale: number;
  /** How far colour swings: 0 = flat, 0.6 = deep charred pits. */
  color: number;
  /** Roughness swing; wet spots (low) next to dry crust (high). */
  rough: number;
  /** Bump height; 0 disables. */
  bump: number;
  /** Tint mixed into the darkest pits (char), as linear RGB. */
  char?: [number, number, number];
};

const NOISE = /* glsl */ `
varying vec3 vCrustPos;
float crustHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float crustNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(crustHash(i), crustHash(i + vec3(1,0,0)), f.x), mix(crustHash(i + vec3(0,1,0)), crustHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(crustHash(i + vec3(0,0,1)), crustHash(i + vec3(1,0,1)), f.x), mix(crustHash(i + vec3(0,1,1)), crustHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float crustFbm(vec3 p) { float v = 0.0, a = 0.5; for (int k = 0; k < 4; k++) { v += a * crustNoise(p); p *= 2.07; a *= 0.5; } return v; }
`;

export function addCrust<T extends MeshStandardMaterial | MeshPhysicalMaterial>(m: T, o: CrustOptions): T {
  const char = o.char ?? [0.06, 0.02, 0.008];
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vCrustPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvCrustPos = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${NOISE}`)
      .replace(
        "#include <color_fragment>",
        /* glsl */ `#include <color_fragment>
        float crustH = crustFbm(vCrustPos * ${o.scale.toFixed(3)});
        float crustPit = smoothstep(0.62, 0.25, crustH);
        diffuseColor.rgb *= 1.0 + (crustH - 0.5) * ${(o.color * 1.4).toFixed(3)};
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(${char.map((c) => c.toFixed(3)).join(",")}), crustPit * ${(o.color * 0.55).toFixed(3)});`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + (crustH - 0.5) * ${o.rough.toFixed(3)}, 0.04, 1.0);`,
      );
    if (o.bump > 0) {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <normal_fragment_maps>",
        /* glsl */ `#include <normal_fragment_maps>
        {
          vec3 dpdx = dFdx(-vViewPosition), dpdy = dFdy(-vViewPosition);
          float dhx = dFdx(crustH), dhy = dFdy(crustH);
          vec3 r1 = cross(dpdy, normal), r2 = cross(normal, dpdx);
          float det = dot(dpdx, r1);
          vec3 grad = sign(det) * (dhx * r1 + dhy * r2);
          normal = normalize(abs(det) * normal - ${o.bump.toFixed(4)} * grad);
        }`,
      );
    }
  };
  // Distinct programs per setting, so three.js doesn't reuse one crust for another.
  m.customProgramCacheKey = () => `crust-${o.scale}-${o.color}-${o.rough}-${o.bump}-${char.join(",")}`;
  return m;
}

