"use client";

import { useState } from "react";

const ZONES = [
  { id: "grill", n: "A", name: "The grill", body: "A flat-top hot enough to smash on. Sit at the bar and you're two metres from it.", x: 60, y: 60, w: 260, h: 110 },
  { id: "pass", n: "B", name: "The pass", body: "Where every burger is checked against the notebook before it leaves. Yes, the notebook is real.", x: 340, y: 60, w: 140, h: 110 },
  { id: "bar", n: "C", name: "Counter seats ×10", body: "Best seats in the house if you like noise, heat and watching it happen.", x: 60, y: 200, w: 420, h: 50 },
  { id: "room", n: "D", name: "The room ×24", body: "Low light, warm wood, loud enough to talk over, quiet enough that you can.", x: 60, y: 290, w: 420, h: 170 },
  { id: "window", n: "E", name: "Pickup window", body: "Ordered ahead? Skip the queue: your bag waits here under your name.", x: 520, y: 290, w: 120, h: 170 },
];

/**
 * The restaurant as an architect's plan rather than stock interiors: it shows
 * what the room is actually like (where the heat is, where to sit) in the
 * same diagram language as the dissected burger.
 */
export function Experience() {
  const [active, setActive] = useState("grill");
  const zone = ZONES.find((z) => z.id === active)!;

  return (
    <section aria-labelledby="exp-title" className="relative z-20 bg-mustard px-5 py-24 text-ink md:px-10 md:py-40">
      <div className="grid gap-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="type-annot text-ketchup">Nº 007 · The restaurant</p>
          <h2 id="exp-title" className="type-display mt-6 text-[16vw] md:text-[6.5vw]">
            Pull up
            <br />a stool.
          </h2>
          <p className="mt-6 max-w-sm leading-relaxed text-ink/70">Thirty-four seats around one very hot grill. Tap the plan to look around.</p>

          <ul className="mt-10 space-y-1" role="tablist" aria-label="Areas of the restaurant">
            {ZONES.map((z) => (
              <li key={z.id}>
                <button
                  role="tab"
                  aria-selected={active === z.id}
                  onClick={() => setActive(z.id)}
                  className={`flex w-full items-baseline gap-4 border-b border-ink/15 py-3 text-left transition-colors ${active === z.id ? "text-ketchup" : "text-ink/70 hover:text-ink"}`}
                >
                  <span className="type-annot w-4">{z.n}</span>
                  <span className="type-display text-2xl">{z.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-8">
          <svg viewBox="0 0 700 520" className="w-full" role="img" aria-label="Floor plan of the restaurant">
            <defs>
              <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#d8281a" strokeWidth="2" opacity="0.45" />
              </pattern>
            </defs>
            <rect x="30" y="30" width="640" height="460" fill="none" stroke="#170b06" strokeWidth="6" />
            <rect x="290" y="484" width="90" height="12" fill="#ffc23d" />
            <text x="335" y="512" textAnchor="middle" className="type-annot" fontSize="11" fill="#170b06">Entrance</text>
            {ZONES.map((z) => (
              <g key={z.id} onClick={() => setActive(z.id)} className="cursor-pointer">
                <rect
                  x={z.x}
                  y={z.y}
                  width={z.w}
                  height={z.h}
                  fill={active === z.id ? "url(#hatch)" : "transparent"}
                  stroke="#170b06"
                  strokeWidth={active === z.id ? 2.5 : 1}
                  strokeDasharray={active === z.id ? "0" : "4 4"}
                  className="transition-all duration-300"
                />
                <text x={z.x + 12} y={z.y + 26} fontSize="22" fontWeight={900} fill={active === z.id ? "#d8281a" : "#170b06"} fontFamily="var(--font-display)">
                  {z.n}
                </text>
              </g>
            ))}
            {/* Seats */}
            {Array.from({ length: 10 }, (_, i) => (
              <circle key={`b${i}`} cx={82 + i * 42} cy={268} r={8} fill="none" stroke="#170b06" />
            ))}
            {Array.from({ length: 6 }, (_, i) => (
              <g key={`t${i}`}>
                <rect x={90 + (i % 3) * 130} y={320 + Math.floor(i / 3) * 80} width={60} height={40} fill="none" stroke="#170b06" />
                {[-1, 1].map((s) => (
                  <circle key={s} cx={120 + (i % 3) * 130 + s * 46} cy={340 + Math.floor(i / 3) * 80} r={7} fill="none" stroke="#170b06" />
                ))}
              </g>
            ))}
            <text x="670" y="22" textAnchor="end" fontSize="11" letterSpacing="2" fill="#170b06" opacity="0.5">PLAN · NOT TO SCALE</text>
          </svg>

          <div className="mt-6 grid gap-2 border-t border-ink/20 pt-6 md:grid-cols-[auto_1fr] md:gap-8" aria-live="polite">
            <p className="type-display text-6xl text-ketchup">{zone.n}</p>
            <div>
              <h3 className="type-display text-3xl">{zone.name}</h3>
              <p className="mt-2 max-w-lg leading-relaxed text-ink/70">{zone.body}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
