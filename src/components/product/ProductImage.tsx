import Image from "next/image";
import type { Product } from "@/lib/catalog/types";

/** Uploaded photo if there is one, otherwise the studio render of the 3D model. */
export function productImageSrc(p: Pick<Product, "slug" | "imageUrl">) {
  return p.imageUrl || `/renders/${p.slug}.png`;
}

const isExternalUnoptimized = (src: string) => /^https?:\/\//.test(src) && !src.includes("res.cloudinary.com");

type Props = {
  product: Pick<Product, "slug" | "name" | "imageUrl">;
  sizes: string;
  className?: string;
  priority?: boolean;
};

export function ProductImage({ product, sizes, className = "", priority }: Props) {
  return (
    <Image
      src={productImageSrc(product)}
      alt={product.name}
      width={900}
      height={900}
      sizes={sizes}
      priority={priority}
      className={`select-none object-contain ${className}`}
      draggable={false}
      // Our renders and Cloudinary go through the optimiser; any other host is loaded as-is.
      unoptimized={isExternalUnoptimized(productImageSrc(product))}
    />
  );
}
