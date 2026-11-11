import {
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  LatheGeometry,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  RingGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import type { BunVariant, CheeseVariant, PattyVariant } from "@/lib/burger/layers";
import { fbm, noise3, rng } from "./noise";

const TAU = Math.PI * 2;
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

const cache = new Map<string, unknown>();
function memo<T>(key: string, build: () => T): T {
  if (!cache.has(key)) cache.set(key, build());
  return cache.get(key) as T;
}

/** Weld seams, then light-friendly normals. Colors must be a function of position so welded verts agree. */
function finish(g: BufferGeometry, colorAt?: (p: Vector3, i: number) => Color) {
  g.deleteAttribute("uv");
  g.deleteAttribute("normal");
  if (colorAt) {
    const pos = g.getAttribute("position");
    const colors = new Float32Array(pos.count * 3);
    const p = new Vector3();
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i);
      const c = colorAt(p, i);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new BufferAttribute(colors, 3));
  }
  const merged = mergeVertices(g, 1e-4);
  merged.computeVertexNormals();
  merged.computeBoundingSphere();
  return merged;
}

const mix = (a: Color, b: Color, t: number) => a.clone().lerp(b, Math.min(Math.max(t, 0), 1));

/* ── Buns ─────────────────────────────────────────────────────────────── */

const BUN = {
  brioche: { R: 1.0, crust: "#7a340f", band: "#d6944a", crumb: "#f3dba8", gloss: 0.75 },
  sesame: { R: 1.0, crust: "#86400f", band: "#cf8a3e", crumb: "#f3dcaa", gloss: 0.45 },
  potato: { R: 0.98, crust: "#a8692a", band: "#e2b86c", crumb: "#f4e0b0", gloss: 0.2 },
} satisfies Record<BunVariant, { R: number; crust: string; band: string; crumb: string; gloss: number }>;

export const bunGloss = (v: BunVariant) => BUN[v].gloss;

/** Hand-shaped buns are never perfectly round: shared by bun vertices and seed placement. */
function bunLump(x: number, y: number, z: number, H: number) {
  const a = Math.atan2(z, x);
  const scale = 1 + 0.022 * noise3(Math.cos(a) * 1.6 + 3.1, Math.sin(a) * 1.6, y * 1.4);
  const dy = 0.028 * fbm(x * 1.7, z * 1.7, 7.3, 3) * Math.max(y / H, 0);
  return { scale, dy };
}

function domeProfile(R: number, H: number, theta: number) {
  return new Vector2(
    Math.max(R * Math.pow(Math.max(Math.cos(theta), 0), 0.68), 0),
    0.05 + (H - 0.05) * Math.pow(Math.sin(theta), 0.92),
  );
}

export function bunTopGeometry(variant: BunVariant, H: number) {
  return memo(`bunTop-${variant}-${H}`, () => {
    const { R, crust, band, crumb } = BUN[variant];
    const pts = [new Vector2(0, 0.016), new Vector2(R * 0.6, 0.006), new Vector2(R * 0.93, 0), new Vector2(R * 0.985, 0.028)];
    const N = 44;
    for (let i = 0; i <= N; i++) pts.push(domeProfile(R, H, (i / N) * (Math.PI / 2)));
    pts[pts.length - 1].set(0, H);

    const g = new LatheGeometry(pts, 112);
    const pos = g.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const { scale, dy } = bunLump(x, y, z, H);
      pos.setXYZ(i, x * scale, y + dy, z * scale);
    }

    const cCrust = new Color(crust), cBand = new Color(band), cCrumb = new Color(crumb);
    return finish(g, (p) => {
      if (p.y < 0.022) return mix(cCrumb, cBand, smoothstep(0.85, 1.0, Math.hypot(p.x, p.z)) * 0.6);
      const t = p.y / H;
      const base = mix(cBand, cCrust, smoothstep(0.06, 0.62, t));
      return base.multiplyScalar(1 + 0.12 * fbm(p.x * 3, p.y * 3, p.z * 3));
    });
  });
}

/** Seeds sit on the dome's real surface, tangent to it, so they ride the bun wherever it flies. */
export function sesameMatrices(H: number, count = 110, seed = 7) {
  return memo(`sesame-${H}-${count}`, () => {
    const R = BUN.sesame.R;
    const rand = rng(seed);
    const out: Matrix4[] = [];
    const up = new Vector3(0, 1, 0);
    let guard = 0;
    while (out.length < count && guard++ < count * 20) {
      const theta = 0.3 + rand() * 1.12;
      const prof = domeProfile(R, H, theta);
      if (rand() > prof.x / R) continue; // uniform density over the surface, not the angle
      const phi = rand() * TAU;
      const d = 0.002;
      const p2 = domeProfile(R, H, theta + d);
      const n2 = new Vector2(p2.y - prof.y, -(p2.x - prof.x)).normalize();
      const normal = new Vector3(n2.x * Math.cos(phi), n2.y, n2.x * Math.sin(phi)).normalize();

      const x = prof.x * Math.cos(phi), z = prof.x * Math.sin(phi);
      const { scale, dy } = bunLump(x, prof.y, z, H);
      const p = new Vector3(x * scale, prof.y + dy, z * scale).addScaledVector(normal, 0.006);

      const q = new Quaternion().setFromUnitVectors(up, normal);
      q.multiply(new Quaternion().setFromAxisAngle(up, rand() * TAU));
      const s = 0.85 + rand() * 0.3;
      out.push(new Matrix4().compose(p, q, new Vector3(0.034 * s, 0.011 * s, 0.019 * s)));
    }
    return out;
  });
}

export function bunBottomGeometry(variant: BunVariant, H: number) {
  return memo(`bunBottom-${variant}-${H}`, () => {
    const { R, band, crumb } = BUN[variant];
    const pts = [
      new Vector2(0, 0),
      new Vector2(R * 0.9, 0),
      new Vector2(R * 0.975, 0.035),
      new Vector2(R * 0.998, 0.11),
      new Vector2(R, H * 0.72),
      new Vector2(R * 0.985, H - 0.03),
      new Vector2(R * 0.955, H),
      new Vector2(R * 0.5, H + 0.004),
      new Vector2(0, H + 0.006),
    ];
    const g = new LatheGeometry(pts, 112);
    const pos = g.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const { scale } = bunLump(x, y, z, H);
      pos.setX(i, x * scale);
      pos.setZ(i, z * scale);
    }
    const cBand = new Color(band), cCrumb = new Color(crumb), cToast = new Color("#5a2a0e");
    return finish(g, (p) => {
      const r = Math.hypot(p.x, p.z);
      if (p.y > H - 0.012 && r < 0.95) {
        // Cut face: open crumb, slightly toasted toward the rim.
        return mix(cCrumb, cBand, smoothstep(0.7, 0.95, r) * 0.5).multiplyScalar(1 + 0.1 * fbm(p.x * 9, 1, p.z * 9));
      }
      return mix(cToast, cBand, smoothstep(0.0, 0.16, p.y)).multiplyScalar(1 + 0.1 * fbm(p.x * 3, p.y * 3, p.z * 3));
    });
  });
}

/* ── Patty ────────────────────────────────────────────────────────────── */

const PATTY = {
  // Seared, not burnt: deep mahogany crust with lighter, juicier browns between.
  beef: { R: 1.07, edge: 0.05, cap: 0.02, base: "#6e3618", char: "#2e1107", side: "#8a4a28" },
  smash: { R: 1.15, edge: 0.055, cap: 0.014, base: "#74391a", char: "#2c0f05", side: "#8f4d2a" },
  chicken: { R: 1.05, edge: 0.06, cap: 0.034, base: "#c98633", char: "#8a4815", side: "#d79a49" },
  veg: { R: 1.03, edge: 0.04, cap: 0.022, base: "#6a4528", char: "#3b2414", side: "#7a5636" },
} satisfies Record<PattyVariant, Record<string, number | string>>;

export function pattyGeometry(variant: PattyVariant, H: number) {
  return memo(`patty-${variant}-${H}`, () => {
    const s = PATTY[variant];
    const g = new CylinderGeometry(s.R, s.R, H, 144, 10);
    g.translate(0, H / 2, 0);
    const pos = g.getAttribute("position");
    const nrm = g.getAttribute("normal");
    const hf = variant === "chicken" ? 2.2 : 1;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const a = Math.atan2(z, x);
      const rr = Math.hypot(x, z);
      const yy = Math.min(Math.max(y / H, 0), 1);
      // max(0, …): sin(π) can come out as -1e-16, and pow(negative, 0.5) is NaN.
      const bulge = 0.9 + 0.1 * Math.pow(Math.max(Math.sin(yy * Math.PI), 0), 0.5);
      const edge =
        1 +
        s.edge * fbm(Math.cos(a) * 3 + 11, Math.sin(a) * 3, yy * 2.5) +
        s.edge * 0.45 * noise3(Math.cos(a) * 14 * hf, Math.sin(a) * 14 * hf, yy * 6);
      x *= bulge * edge;
      z *= bulge * edge;
      const ny = nrm.getY(i);
      if (Math.abs(ny) > 0.5) {
        const rim = 1 - Math.pow(Math.min(rr / s.R, 1), 6);
        const top = ny > 0;
        y += (top ? 1 : -1) * (s.cap * fbm(x * 4 * hf, z * 4 * hf, 1.3) + (top ? 0.016 * (1 - (rr * rr) / (s.R * s.R)) : 0)) * rim;
      }
      pos.setXYZ(i, x, y, z);
    }
    const cBase = new Color(s.base), cChar = new Color(s.char), cSide = new Color(s.side);
    const fleck = new Color("#5d7d33");
    return finish(g, (p) => {
      const r = Math.hypot(p.x, p.z);
      const onSide = r > s.R * 0.88 && p.y > 0.03 && p.y < H - 0.03;
      const n = fbm(p.x * 5, p.y * 7, p.z * 5);
      let c = mix(onSide ? cSide : cBase, cChar, smoothstep(0.05, 0.55, n));
      if (variant === "veg" && noise3(p.x * 22, p.y * 22, p.z * 22) > 0.62) c = fleck.clone();
      return c.multiplyScalar(1 + 0.15 * noise3(p.x * 30, p.y * 30, p.z * 30));
    });
  });
}

/* ── Cheese ───────────────────────────────────────────────────────────── */

export const CHEESE_COLOR: Record<CheeseVariant, string> = {
  cheddar: "#ff9a12",
  american: "#ffb627",
  swiss: "#f0dfa2",
};

/**
 * A square slice with softened corners, melted over a round patty: the
 * overhang curls down the patty's side and a few drips run further. Morph
 * target 0 is the same slice lying flat and slightly spread: animating its
 * influence "unfolds" it. Built as rings so the overhang can bend.
 */
export function cheeseGeometry() {
  return memo("cheese", () => {
    const rand = rng(41);
    const drips = Array.from({ length: 6 }, () => ({ a: rand() * TAU, w: 0.05 + rand() * 0.05, h: 0.1 + rand() * 0.16 }));
    const turn = Math.PI / 4 + 0.08;
    const outline = (a: number) => {
      // Superellipse: a square with rounded corners (n = 5).
      const n = 5, half = 1.0;
      const c = Math.abs(Math.cos(a - turn)), sn = Math.abs(Math.sin(a - turn));
      let r = half / Math.pow(Math.pow(c, n) + Math.pow(sn, n), 1 / n);
      for (const d of drips) {
        const da = Math.atan2(Math.sin(a - d.a), Math.cos(a - d.a));
        r += d.h * Math.exp(-(da * da) / (2 * d.w * d.w));
      }
      return r;
    };
    const rings = 22, segs = 168;
    const build = (draped: boolean) => {
      const positions: number[] = [0, 0.01, 0];
      for (let j = 1; j <= rings; j++) {
        for (let i = 0; i < segs; i++) {
          const a = (i / segs) * TAU;
          const r = outline(a) * (j / rings);
          const x0 = Math.cos(a), z0 = Math.sin(a);
          const wave = 0.008 * noise3(x0 * r * 3, z0 * r * 3, 2.2);
          if (draped) {
            const over = Math.max(0, r - 0.97);
            // Bends over the edge, then hangs close to the patty's side.
            const rr = r - over + 0.15 * smoothstep(0, 0.18, over);
            const y = wave - over * 1.05 + 0.012 * (1 - (r * r) / 1.2);
            positions.push(x0 * rr, y, z0 * rr);
          } else {
            positions.push(x0 * r * 1.12, wave, z0 * r * 1.12);
          }
        }
      }
      const index: number[] = [];
      for (let i = 0; i < segs; i++) index.push(0, 1 + ((i + 1) % segs), 1 + i);
      for (let j = 1; j < rings; j++) {
        const a0 = 1 + (j - 1) * segs, a1 = 1 + j * segs;
        for (let i = 0; i < segs; i++) {
          const i1 = (i + 1) % segs;
          index.push(a0 + i, a0 + i1, a1 + i, a0 + i1, a1 + i1, a1 + i);
        }
      }
      const g = new BufferGeometry();
      g.setAttribute("position", new Float32BufferAttribute(positions, 3));
      g.setIndex(index);
      g.computeVertexNormals();
      return g;
    };
    const draped = build(true);
    const flat = build(false);
    draped.morphAttributes.position = [flat.getAttribute("position")];
    draped.morphAttributes.normal = [flat.getAttribute("normal")];
    return draped;
  });
}

/* ── Sauce ────────────────────────────────────────────────────────────── */

export function sauceGeometry(seed: number) {
  return memo(`sauce-${seed}`, () => {
    const rand = rng(seed);
    const drips = Array.from({ length: 9 }, () => ({ a: rand() * TAU, w: 0.045 + rand() * 0.05, h: 0.1 + rand() * 0.22 }));
    const radius = (a: number) => {
      let r = 1.0 + 0.04 * noise3(Math.cos(a) * 2 + seed, Math.sin(a) * 2, 0);
      for (const d of drips) {
        const da = Math.atan2(Math.sin(a - d.a), Math.cos(a - d.a));
        r += d.h * Math.exp(-(da * da) / (2 * d.w * d.w));
      }
      return r;
    };
    // Where a point at radius r ends up: on top it's a glossy mound; past the
    // rim it bends over and runs straight down the side, like a real drip.
    const place = (a: number, r: number, j: number, i: number) => {
      const over = Math.max(0, r - 0.98);
      const rr = r - over + 0.05 * smoothstep(0, 0.08, over);
      const mound = 0.016 * (1 - Math.min(r, 1) ** 2) + 0.006 * noise3(Math.cos(a) * r * 6, Math.sin(a) * r * 6, seed);
      return [Math.cos(a) * rr, mound - over * 1.15 + 0.002 * noise3(i * 0.3, j, seed), Math.sin(a) * rr];
    };
    const rings = 14, segs = 200;
    const positions: number[] = [0, 0.018, 0];
    const index: number[] = [];
    for (let j = 1; j <= rings; j++) {
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * TAU;
        positions.push(...place(a, radius(a) * (j / rings), j, i));
      }
    }
    for (let i = 0; i < segs; i++) index.push(0, 1 + ((i + 1) % segs), 1 + i);
    for (let j = 1; j < rings; j++) {
      const a0 = 1 + (j - 1) * segs, a1 = 1 + j * segs;
      for (let i = 0; i < segs; i++) {
        const i1 = (i + 1) % segs;
        index.push(a0 + i, a0 + i1, a1 + i, a0 + i1, a1 + i1, a1 + i);
      }
    }
    const sheet = new BufferGeometry();
    sheet.setAttribute("position", new Float32BufferAttribute(positions, 3));
    sheet.setIndex(index);
    sheet.computeVertexNormals();

    // A heavy bead at the end of each longer drip: the detail that makes it read as wet.
    const beads = drips
      .filter((d) => d.h > 0.16)
      .map((d) => {
        const [x, y, z] = place(d.a, radius(d.a), rings, 0);
        const b = new SphereGeometry(0.016 + d.w * 0.16, 12, 8);
        b.scale(1, 1.6, 1);
        b.translate(x, y - 0.01, z);
        b.deleteAttribute("uv");
        return b;
      });
    return beads.length ? mergeGeometries([sheet, ...beads]) : sheet;
  });
}

/* ── Lettuce ──────────────────────────────────────────────────────────── */

export function lettuceGeometry(seed: number) {
  return memo(`lettuce-${seed}`, () => {
    const g = new RingGeometry(0.02, 1, 220, 16);
    g.rotateX(-Math.PI / 2);
    const pos = g.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      const x0 = pos.getX(i), z0 = pos.getZ(i);
      const a = Math.atan2(z0, x0);
      const rr = Math.hypot(x0, z0);
      const outer = 1.2 + 0.13 * fbm(Math.cos(a) * 2.5 + seed, Math.sin(a) * 2.5, 0.5);
      const r = rr * outer;
      const f = smoothstep(0.5, 1, rr);
      const frill =
        0.075 * Math.sin(a * 13 + seed + 4 * fbm(Math.cos(a) * 3, Math.sin(a) * 3, seed)) + 0.035 * Math.sin(a * 31 + seed * 2);
      const y = f * frill + 0.03 * fbm(x0 * 3, z0 * 3, seed) + (1 - rr) * 0.025 - f * f * 0.07;
      pos.setXYZ(i, Math.cos(a) * r, y, Math.sin(a) * r);
    }
    const heart = new Color("#eaf6a6"), leaf = new Color("#74c03a"), deep = new Color("#46922a");
    return finish(g, (p) => {
      const r = Math.hypot(p.x, p.z) / 1.25;
      const vein = Math.abs(Math.sin(Math.atan2(p.z, p.x) * 9)) > 0.97 ? 0.15 : 0;
      return mix(mix(heart, leaf, smoothstep(0.15, 0.75, r)), deep, smoothstep(0.85, 1.05, r) * 0.7 - vein).multiplyScalar(
        1 + 0.1 * noise3(p.x * 12, p.y * 12, p.z * 12),
      );
    });
  });
}

/* ── Tomato, onion, pickles, jalapeño, crispy onion ──────────────────── */

export function tomatoGeometry() {
  return memo("tomato", () => {
    const g = new CylinderGeometry(0.52, 0.52, 0.085, 56, 1);
    g.translate(0, 0.0425, 0);
    return g; // keeps cap UVs for the cross-section texture
  });
}

export function onionRingGeometry(r: number) {
  return memo(`onion-${r}`, () => {
    const g = new TorusGeometry(r, 0.03, 10, 72);
    g.rotateX(Math.PI / 2);
    g.scale(1, 0.6, 1);
    g.translate(0, 0.02, 0);
    return g;
  });
}

export function pickleGeometry() {
  return memo("pickle", () => {
    const g = new CylinderGeometry(0.21, 0.21, 0.036, 36, 1);
    g.translate(0, 0.018, 0);
    const pos = g.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const a = Math.atan2(z, x);
      const k = 1 + 0.045 * Math.sin(a * 16);
      pos.setX(i, x * k);
      pos.setZ(i, z * k);
    }
    const skin = new Color("#4f6b1d"), flesh = new Color("#a9bc4f"), seeds = new Color("#d6d58a");
    return finish(g, (p) => {
      const r = Math.hypot(p.x, p.z);
      if (r > 0.19) return skin.clone();
      return r < 0.11 && r > 0.07 ? seeds.clone() : flesh.clone().multiplyScalar(1 + 0.08 * noise3(p.x * 30, 0, p.z * 30));
    });
  });
}

export function jalapenoGeometry() {
  return memo("jalapeno", () => {
    const g = new TorusGeometry(0.11, 0.035, 8, 28);
    g.rotateX(Math.PI / 2);
    g.scale(1, 0.55, 1);
    g.translate(0, 0.02, 0);
    return g;
  });
}

export function crispyOnionMatrices(count = 80, seed = 21) {
  return memo(`crispy-${count}`, () => {
    const rand = rng(seed);
    return Array.from({ length: count }, () => {
      const a = rand() * TAU, r = Math.sqrt(rand()) * 0.88;
      const p = new Vector3(Math.cos(a) * r, 0.015 + rand() * 0.06 * (1 - r * 0.6), Math.sin(a) * r);
      const q = new Quaternion().setFromAxisAngle(new Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(), rand() * TAU);
      const s = 0.7 + rand() * 0.7;
      return new Matrix4().compose(p, q, new Vector3(s, s, s));
    });
  });
}

export function crispyOnionGeometry() {
  return memo("crispy-geo", () => new TorusGeometry(0.075, 0.014, 6, 14, Math.PI * 1.25));
}
