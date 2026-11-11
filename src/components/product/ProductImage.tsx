import Image from "next/image";
import type { Product } from "@/lib/catalog/types";

/**
 * Uploaded photo if there is one, otherwise the bundled photo for the item
 * (public/photos/<slug>.jpg). Real food photography sells; the 3D model is
 * kept for the interactive scenes, where it can move.
 */
export function productImageSrc(p: Pick<Product, "slug" | "imageUrl">) {
  return p.imageUrl || `/photos/${p.slug}.jpg`;
}

const isExternalUnoptimized = (src: string) => /^https?:\/\//.test(src) && !src.includes("res.cloudinary.com");

type Props = {
  product: Pick<Product, "slug" | "name" | "imageUrl">;
  sizes: string;
  className?: string;
  priority?: boolean;
};

/** A square food photo that fills its box. Give the box its size and rounding. */
export function ProductImage({ product, sizes, className = "", priority }: Props) {
  const src = productImageSrc(product);
  return (
    <Image
      src={src}
      alt={product.name}
      width={1200}
      height={1200}
      sizes={sizes}
      priority={priority}
      className={`select-none object-cover ${className}`}
      draggable={false}
      // Our photos and Cloudinary go through the optimiser; any other host is loaded as-is.
      unoptimized={isExternalUnoptimized(src)}
    />
  );
}
