"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Vector3, type Group } from "three";
import { CLASSIC, stackLayers } from "@/lib/burger/layers";
import { Burger } from "./burger/Burger";
import { Embers } from "./Embers";
import { StudioLights } from "./StudioLights";
import { HeatDriver, SauceSplash, Steam } from "./Appetite";
import { story } from "./story";
import { BlobShadow, useAdaptiveDpr } from "./Perf";

const CLASSIC_HEIGHT = stackLayers(CLASSIC).height;

const publish = (key: string, object: Group | null, height: number) => {
  if (object) story.objects.set(key, { object, height });
  else story.objects.delete(key);
};

/**
 * Pins each annotation to its ingredient like a technical drawing: a leader
 * line runs from the ingredient's edge (projected to screen) out to a fixed
 * text column. Writes styles directly; React never re-renders for this.
 */
function LabelProjector() {
  const { camera, size } = useThree();
  const v = useRef(new Vector3());
  const right = useRef(new Vector3());

  useFrame(() => {
    const narrow = size.width < 768;
    right.current.setFromMatrixColumn(camera.matrixWorld, 0);
    for (const [key, el] of story.labelEls) {
      const entry = story.objects.get(key);
      const visible = story.labels * (story.targets[key] ?? 0);
      if (!entry || visible < 0.01) {
        el.style.opacity = "0";
        continue;
      }
      const side = Number(el.dataset.side) || 1;
      entry.object.updateWorldMatrix(true, false);
      v.current.set(0, entry.height / 2, 0).applyMatrix4(entry.object.matrixWorld);
      v.current.addScaledVector(right.current, side * 1.12);
      v.current.project(camera);
      const ax = (v.current.x * 0.5 + 0.5) * size.width;
      const ay = (-v.current.y * 0.5 + 0.5) * size.height;
      const column = narrow ? (side > 0 ? size.width - 14 : 14) : side > 0 ? size.width * 0.8 : size.width * 0.2;
      const w = Math.max(side > 0 ? column - ax : ax - column, 12);
      el.style.transform = `translate3d(${ax.toFixed(1)}px, ${ay.toFixed(1)}px, 0)`;
      el.style.setProperty("--w", `${w.toFixed(1)}px`);
      el.style.opacity = visible.toFixed(3);
    }
  });
  return null;
}

/** Follows the story's camera pose with damping, plus a little pointer parallax. */
function CameraRig({ reduced }: { reduced: boolean }) {
  const { camera, size } = useThree();
  const look = useRef(new Vector3());
  const cur = useRef({ ...story.camera });

  useFrame((state, delta) => {
    const c = cur.current, t = story.camera;
    const k = 1 - Math.exp(-delta * 4);
    c.theta = MathUtils.lerp(c.theta, t.theta, k);
    c.phi = MathUtils.lerp(c.phi, t.phi, k);
    c.distance = MathUtils.lerp(c.distance, t.distance, k);
    c.targetY = MathUtils.lerp(c.targetY, t.targetY, k);

    // Portrait screens need more distance to keep the burger's width in frame.
    const aspect = size.width / size.height;
    const fit = aspect < 1 ? MathUtils.lerp(1.8, 1, MathUtils.clamp((aspect - 0.45) / 0.55, 0, 1)) : 1;
    const px = reduced ? 0 : state.pointer.x * 0.12;
    const py = reduced ? 0 : state.pointer.y * 0.06;

    const d = c.distance * fit;
    const theta = c.theta + px;
    const phi = c.phi + py;
    // On tall phones, aim a little low so the burger rides up into the gap
    // between the two headline blocks instead of sitting under the copy.
    const ty = c.targetY - (aspect < 0.75 ? 0.45 : 0);
    camera.position.set(Math.sin(theta) * Math.cos(phi) * d, ty + Math.sin(phi) * d, Math.cos(theta) * Math.cos(phi) * d);
    look.current.set(0, ty, 0);
    camera.lookAt(look.current);
  });
  return null;
}

/** Slow idle turn, a breath of float, and the story's own spin layered on top. */
function Turntable({ children, reduced }: { children: React.ReactNode; reduced: boolean }) {
  const ref = useRef<Group>(null);
  const idle = useRef(0);
  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    if (!reduced) idle.current += delta * 0.16;
    g.rotation.y = MathUtils.lerp(g.rotation.y, idle.current + story.spin + state.pointer.x * 0.25, 1 - Math.exp(-delta * 3));
    g.rotation.x = MathUtils.lerp(g.rotation.x, reduced ? 0 : -state.pointer.y * 0.06, 1 - Math.exp(-delta * 3));
    g.position.y = reduced ? 0 : Math.sin(state.clock.elapsedTime * 0.9) * 0.04;
  });
  return <group ref={ref}>{children}</group>;
}

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Tells the page once real frames are on screen, so the stand-in image can fade out. */
function ReadySignal({ onReady }: { onReady?: () => void }) {
  const { gl, scene, camera } = useThree();
  const compiled = useRef(false);
  const frames = useRef(0);
  useEffect(() => {
    // Compile every shader before the scene is revealed, in parallel where the
    // GPU driver allows it, so nothing compiles mid-scroll (the classic freeze
    // when the burger first explodes).
    let alive = true;
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .finally(() => {
        if (alive) compiled.current = true;
      });
    return () => {
      alive = false;
    };
  }, [gl, scene, camera]);
  useFrame(() => {
    if (!compiled.current) return;
    frames.current += 1;
    if (frames.current === 3) onReady?.();
  });
  return null;
}

export default function HomeStage({ active = true, onReady }: { active?: boolean; onReady?: () => void }) {
  const [support, setSupport] = useState<"pending" | "yes" | "no">("pending");
  const [reduced, setReduced] = useState(false);
  const [mobile, setMobile] = useState(false);
  const { dpr, monitor } = useAdaptiveDpr(1.5);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupport(webglAvailable() ? "yes" : "no");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobile(window.matchMedia("(max-width: 767px)").matches);
  }, []);

  if (support === "no") return <StageFallback />;
  if (support === "pending") return null;

  return (
    <Canvas
      shadows="percentage"
      frameloop={active ? "always" : "never"}
      dpr={dpr}
      camera={{ fov: 28, near: 0.1, far: 60, position: [0, 0.9, 7.6] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      // The canvas never takes clicks; pointer parallax listens on the page instead.
      eventSource={typeof document !== "undefined" ? document.documentElement : undefined}
      eventPrefix="client"
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <CameraRig reduced={reduced} />
      <StudioLights shadows={!mobile} />
      <Turntable reduced={reduced}>
        <Burger specs={CLASSIC} targets={story.targets} castShadow={!mobile} onGroup={publish} />
        {!reduced && <Steam count={mobile ? 10 : 18} top={CLASSIC_HEIGHT / 2 - 0.1} />}
      </Turntable>
      {!reduced && <SauceSplash count={mobile ? 50 : 100} />}
      <HeatDriver />
      <BlobShadow y={-CLASSIC_HEIGHT / 2 - 0.06} size={3.6} opacity={0.65} />
      {!reduced && <Embers count={mobile ? 50 : 140} />}
      {monitor}
      <ReadySignal onReady={onReady} />
      <LabelProjector />
    </Canvas>
  );
}

/** No WebGL: an illustrated cross-section in CSS, so the hero is never an empty void. */
function StageFallback() {
  const bands = [
    { h: "18%", c: "linear-gradient(#b8642a,#d99a50)", r: "50% 50% 12% 12% / 90% 90% 12% 12%", w: "62%" },
    { h: "3%", c: "#5f9a2e", r: "40%", w: "70%" },
    { h: "4%", c: "#c81d10", r: "30%", w: "58%" },
    { h: "2.5%", c: "#f08c1c", r: "8px", w: "66%" },
    { h: "8%", c: "linear-gradient(#4a2716,#2b160c)", r: "30px", w: "64%" },
    { h: "9%", c: "linear-gradient(#e1aa62,#8f4a1b)", r: "12% 12% 40% 40%", w: "61%" },
  ];
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-[0.6%] pt-[8vh]" aria-hidden="true">
      {bands.map((b, i) => (
        <div key={i} style={{ height: b.h, width: b.w, maxWidth: 520, background: b.c, borderRadius: b.r }} className="shadow-[0_20px_40px_-20px_#000]" />
      ))}
    </div>
  );
}
