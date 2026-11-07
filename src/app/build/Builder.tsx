"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Check, Minus, Plus, RotateCcw, Scan, Undo2 } from "lucide-react";
import {
  BUILD_BASE_CENTS,
  CUSTOM_BUILD_PRODUCT,
  DEFAULT_BUILD,
  buildLayers,
  buildNumber,
  buildPrice,
  parseBuild,
  sanitizeBuild,
  selectedOptions,
  type Build,
  type BuildGroup,
} from "@/lib/burger/options";
import { stackLayers, type LayerSpec } from "@/lib/burger/layers";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart/store";
import type { BuildStageHandle } from "@/components/three/BuildStage";

const BuildStage = dynamic(() => import("@/components/three/BuildStage"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center type-annot text-cream/40">Heating the grill…</div>,
});

const LAYER_NAMES: Record<LayerSpec["kind"], string> = {
  bunTop: "Crown", bunBottom: "Heel", patty: "Patty", cheese: "Cheese", sauce: "Sauce", lettuce: "Lettuce",
  tomato: "Tomato", onion: "Red onion", pickles: "Pickles", crispyOnion: "Crispy onions", jalapeno: "Jalapeños",
};

function toggle(build: Build, group: BuildGroup, id: string): Build {
  if (group.type === "single") {
    const cur = build[group.id] as string | null;
    // Optional singles (cheese) switch off when tapped again.
    const next = group.optional && cur === id ? null : id;
    return { ...build, [group.id]: next } as Build;
  }
  const list = build[group.id] as string[];
  return { ...build, [group.id]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] } as Build;
}

const isOn = (build: Build, group: BuildGroup, id: string) =>
  group.type === "single" ? build[group.id] === id : (build[group.id] as string[]).includes(id);

export function Builder({ groups }: { groups: BuildGroup[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const editId = params.get("edit");
  const items = useCart((s) => s.items);
  const add = useCart((s) => s.add);
  const update = useCart((s) => s.update);

  const editing = editId ? items.find((i) => i.lineId === editId) : undefined;
  const [build, setBuild] = useState<Build>(() => {
    if (!editing) return sanitizeBuild(DEFAULT_BUILD, groups);
    const b = parseBuild(editing.build);
    return b ? sanitizeBuild(b, groups) : sanitizeBuild(DEFAULT_BUILD, groups);
  });
  const [qty, setQty] = useState(() => (editing ? editing.quantity : 1));
  const [explode, setExplode] = useState(false);
  const [added, setAdded] = useState(false);
  const [announce, setAnnounce] = useState("");
  const stage = useRef<BuildStageHandle>(null);

  const specs = useMemo(() => buildLayers(build), [build]);
  const height = useMemo(() => stackLayers(specs).height, [specs]);
  const price = buildPrice(build, groups);
  const lines = selectedOptions(build, groups);
  const number = buildNumber(build);

  const choose = (group: BuildGroup, id: string, label: string) => {
    const was = isOn(build, group, id);
    setBuild((b) => toggle(b, group, id));
    setAnnounce(`${was && !(group.type === "single" && !group.optional) ? "Removed" : "Added"} ${label}.`);
  };

  const commit = () => {
    const payload = {
      productId: CUSTOM_BUILD_PRODUCT.id,
      slug: CUSTOM_BUILD_PRODUCT.slug,
      name: `Build Nº ${String(number).padStart(6, "0")}`,
      basePriceCents: BUILD_BASE_CENTS,
      quantity: qty,
      options: lines.map((l) => ({ group: l.group, optionId: `${l.group}:${l.option.id}`, label: l.option.label, priceCents: l.option.priceCents })),
      build: { ...build },
    };
    if (editing) {
      update(editing.lineId, payload);
      router.push("/cart");
      return;
    }
    add(payload);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="grid min-h-dvh pt-[6.5rem] md:grid-cols-12 md:pt-20">
      {/* Viewport */}
      <div className="theme-glow sticky top-[6.5rem] z-10 h-[46dvh] border-b border-cream/10 bg-[radial-gradient(65%_60%_at_50%_55%,#ffa848_0%,#e8601e_42%,#9a2a0c_80%,#5a1606_100%)] md:top-20 md:col-span-7 md:h-[calc(100dvh-5rem)] md:border-b-0 md:border-r">
        <BuildStage ref={stage} specs={specs} explode={explode ? 1 : 0} height={height} />

        <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between md:inset-x-8 md:top-8">
          <div>
            <p className="type-annot text-fire">Build Nº {String(number).padStart(6, "0")}</p>
            <p className="type-annot mt-1 text-cream/50">{specs.length} layers · {(height * 4.1).toFixed(1)} cm tall</p>
          </div>
          <div className="pointer-events-auto flex gap-2">
            <button
              type="button"
              onClick={() => setExplode((v) => !v)}
              aria-pressed={explode}
              className={`type-annot flex items-center gap-1.5 rounded-full border px-3 py-2 transition-colors ${explode ? "border-fire bg-fire text-ink" : "border-cream/20 text-cream/80 hover:border-cream"}`}
            >
              <Scan className="h-3.5 w-3.5" aria-hidden="true" /> {explode ? "Stack it" : "Inspect"}
            </button>
            <button
              type="button"
              onClick={() => stage.current?.resetView()}
              className="type-annot flex items-center gap-1.5 rounded-full border border-cream/20 px-3 py-2 text-cream/80 hover:border-cream"
            >
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" /> View
            </button>
          </div>
        </div>
        <p className="type-annot pointer-events-none absolute bottom-4 left-4 hidden text-cream/35 md:bottom-8 md:left-8 md:block">
          Drag to turn · Scroll to zoom
        </p>
      </div>

      {/* Controls */}
      <div className="px-5 pb-40 pt-8 md:col-span-5 md:px-10 md:pb-16 md:pt-14">
        <p className="type-annot text-fire">{editing ? "Editing your build" : "Nº 004 · Build your own"}</p>
        <h1 className="type-display mt-4 text-6xl text-cream md:text-7xl">Stack it your way.</h1>
        <p className="mt-3 max-w-md text-cream/65">Start from {formatPrice(BUILD_BASE_CENTS)}. Everything you pick shows up on the burger, in the order we&apos;d build it.</p>

        <div className="mt-10 space-y-10">
          {groups.map((g, gi) => (
            <fieldset key={g.id}>
              <legend className="flex w-full items-baseline justify-between border-b border-cream/15 pb-3">
                <span className="flex items-baseline gap-3">
                  <span className="type-annot text-fire">{String(gi + 1).padStart(2, "0")}</span>
                  <span className="type-display text-3xl text-cream">{g.name}</span>
                </span>
                <span className="type-annot text-cream/40">
                  {g.type === "multi" ? "Pick any" : g.optional ? "Pick one or none" : "Pick one"}
                </span>
              </legend>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {g.options.map((o) => {
                  const on = isOn(build, g, o.id);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      role={g.type === "single" ? "radio" : "checkbox"}
                      aria-checked={on}
                      onClick={() => choose(g, o.id, o.label)}
                      className={`group relative flex min-h-[4.5rem] flex-col items-start justify-between rounded-xl border p-3.5 text-left transition-all duration-200 ${
                        on ? "border-fire bg-fire/10" : "border-cream/12 hover:border-cream/40"
                      }`}
                    >
                      <span className="flex w-full items-start justify-between gap-2">
                        <span className={`font-medium ${on ? "text-cream" : "text-cream/85"}`}>{o.label}</span>
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${on ? "border-fire bg-fire text-ink" : "border-cream/25"}`}
                          aria-hidden="true"
                        >
                          {on && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                      </span>
                      {o.note && <span className="mt-1 text-xs text-cream/45">{o.note}</span>}
                      <span className="type-annot mt-2 text-cream/55">{o.priceCents ? `+${formatPrice(o.priceCents)}` : "Included"}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        {/* Spec sheet: the stack top-down, and the bill */}
        <section aria-labelledby="spec-title" className="mt-14 rounded-2xl border border-cream/12 p-6">
          <div className="flex items-baseline justify-between">
            <h2 id="spec-title" className="type-display text-3xl text-cream">Spec sheet</h2>
            <button type="button" onClick={() => setBuild(sanitizeBuild(DEFAULT_BUILD, groups))} className="type-annot flex items-center gap-1.5 text-cream/55 hover:text-fire">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset
            </button>
          </div>
          <ol className="mt-5 space-y-1.5 text-sm">
            {[...specs].reverse().map((s, i) => (
              <li key={i} className="flex items-baseline gap-3 text-cream/75">
                <span className="type-annot w-6 text-cream/35">{String(specs.length - i).padStart(2, "0")}</span>
                {LAYER_NAMES[s.kind]}
                {"variant" in s && <span className="text-cream/40">· {s.variant}</span>}
              </li>
            ))}
          </ol>
          <dl className="mt-6 space-y-1 border-t border-dashed border-cream/15 pt-4 text-sm">
            <div className="flex justify-between text-cream/60">
              <dt>Base burger</dt>
              <dd>{formatPrice(BUILD_BASE_CENTS)}</dd>
            </div>
            {lines.filter((l) => l.option.priceCents > 0).map((l) => (
              <div key={`${l.group}-${l.option.id}`} className="flex justify-between text-cream/60">
                <dt>{l.option.label}</dt>
                <dd>+{formatPrice(l.option.priceCents)}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {/* Order bar: always reachable */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream/10 bg-ink/95 px-5 py-4 backdrop-blur md:left-auto md:right-0 md:w-[calc(5/12*100%)] md:px-5 lg:px-10">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="flex items-center rounded-full border border-cream/20">
            <button type="button" aria-label="One fewer" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-11 w-11 items-center justify-center text-cream/80 hover:text-fire">
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="w-6 text-center tabular-nums" aria-live="polite" aria-label={`Quantity ${qty}`}>{qty}</span>
            <button type="button" aria-label="One more" onClick={() => setQty((q) => Math.min(20, q + 1))} className="flex h-11 w-11 items-center justify-center text-cream/80 hover:text-fire">
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={commit}
            className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-full bg-fire px-5 py-3.5 text-ink lg:px-6 transition-colors hover:bg-cream"
          >
            <span className="truncate text-xs font-semibold uppercase tracking-wide sm:text-sm">
              {added ? "Added to order" : editing ? "Save changes" : "Add to order"}
            </span>
            <span className="type-display text-2xl tabular-nums">{formatPrice(price * qty)}</span>
          </button>
        </div>
        {added && (
          <p className="type-annot mt-2 text-right text-cream/60">
            In your bag. <Link href="/cart" className="text-fire underline-offset-4 hover:underline">View order →</Link>
          </p>
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announce} Total {formatPrice(price * qty)}.
      </p>
    </div>
  );
}
