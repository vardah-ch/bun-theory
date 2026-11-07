"use client";

import dynamic from "next/dynamic";
import type { Product } from "@/lib/catalog/types";

const ProductScene = dynamic(() => import("@/components/three/ProductScene"), { ssr: false });

export function StudioView({ product }: { product: Pick<Product, "layers" | "artwork" | "category"> }) {
  return (
    <div data-studio className="fixed inset-0 bg-transparent">
      <ProductScene product={product} still />
    </div>
  );
}
