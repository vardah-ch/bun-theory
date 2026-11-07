import type { Metadata } from "next";
import { Suspense } from "react";
import { Nav } from "@/components/layout/Nav";
import { getBuildGroups } from "@/lib/data/catalog";
import { Builder } from "./Builder";

export const metadata: Metadata = {
  title: "Build your burger",
  description: "Pick the bun, patty, cheese and everything after, and watch it stack up in 3D. Then order it.",
};

export default async function BuildPage() {
  const groups = await getBuildGroups();
  return (
    <div className="theme-light min-h-dvh bg-ink">
      <Nav />
      <main>
        {/* Builder reads ?edit= from the URL, so it renders inside a Suspense boundary. */}
        <Suspense fallback={<div className="min-h-dvh" />}>
          <Builder groups={groups} />
        </Suspense>
      </main>
    </div>
  );
}
