"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  images: string[];
  category: string;
  is_featured?: boolean;
  price?: number;
  sizes?: string[];
  stock?: number;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const primaryImage = product.images[0];
  const hoverImage = product.images[1] || product.images[0];

  return (
    <div
      className="group relative flex flex-col space-y-3 border border-transparent hover:border-border/40 p-2 smooth-hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Frame */}
      <Link href={`/product/${product.slug}`} className="relative block aspect-[4/5] bg-neutral-100 overflow-hidden border border-border">
        {/* Primary Image */}
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover transition-transform duration-700 ease-out ${
            isHovered ? "scale-105 opacity-0" : "scale-100 opacity-100"
          }`}
          priority={product.is_featured}
        />
        
        {/* Hover/Secondary Image */}
        <Image
          src={hoverImage}
          alt={`${product.name} - Alternate view`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover transition-all duration-700 ease-out absolute inset-0 ${
            isHovered ? "scale-102 opacity-100" : "scale-105 opacity-0"
          }`}
        />

        {/* Dynamic Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
      </Link>

      {/* Product Information */}
      <div className="flex flex-col space-y-1">
        <div className="flex justify-between items-start">
          <span className="text-[9px] tracking-[0.25em] font-semibold text-muted uppercase">
            {product.category}
          </span>
        </div>
        <Link href={`/product/${product.slug}`} className="hover:underline">
          <h3 className="font-serif text-sm tracking-wide text-foreground font-medium uppercase truncate">
            {product.name}
          </h3>
        </Link>
        <span className="text-xs font-semibold tracking-wider tabular-nums text-foreground/90 mt-0.5">
          ${product.base_price.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
