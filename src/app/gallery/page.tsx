"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const EXHIBITS = [
  {
    title: "Atelier Campaign I",
    category: "FUTURE RELEASE",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200",
    description: "An exploration of fluid structure and high-contrast styling.",
  },
  {
    title: "Sculptural Silhouette",
    category: "AUTUMN PREVIEW",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200",
    description: "Tailored outerwear using raw, heavyweight organic fiber.",
  },
  {
    title: "Minimal Utility Bag",
    category: "ACCESSORIES SHOWCASE",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1200",
    description: "Premium calfskin shoulder piece with structural silver hardware.",
  },
  {
    title: "Monolith Footwear Detail",
    category: "LABORATORY SAMPLE",
    image: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=1200",
    description: "Thick profile sole and hand-welted leather construct.",
  },
];

export default function GalleryPage() {
  return (
    <div className="w-full bg-background min-h-screen py-16 px-6 md:px-12 max-w-[1440px] mx-auto space-y-16">
      
      {/* Title */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-[10px] tracking-[0.4em] font-bold text-muted uppercase">
          FRACTALS STUDIO MX
        </span>
        <h1 className="font-serif text-4xl md:text-6xl tracking-tight uppercase text-foreground">
          ATELIER GALLERY
        </h1>
        <div className="h-[1px] w-12 bg-border mx-auto my-4" />
        <p className="text-xs text-muted leading-relaxed tracking-wide font-light">
          A curate of structural concepts, visual showcases, and upcoming releases. Each artifact represents our devotion to avant-garde minimalism and architectural tailor craftsmanship.
        </p>
      </div>

      {/* Grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
        {EXHIBITS.map((exhibit, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col space-y-4 group"
          >
            {/* Image Container */}
            <div className="relative aspect-[4/5] bg-neutral-100 border border-border overflow-hidden">
              <Image
                src={exhibit.image}
                alt={exhibit.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors duration-500" />
            </div>

            {/* Typography */}
            <div className="flex flex-col space-y-1">
              <span className="text-[9px] tracking-[0.25em] font-semibold text-muted uppercase">
                {exhibit.category}
              </span>
              <h2 className="font-serif text-xl md:text-2xl text-foreground uppercase tracking-wide">
                {exhibit.title}
              </h2>
              <p className="text-xs text-muted leading-relaxed max-w-md">
                {exhibit.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      
    </div>
  );
}
