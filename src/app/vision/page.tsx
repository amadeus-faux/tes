"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function VisionPage() {
  return (
    <div className="w-full bg-background min-h-screen py-16 px-6 md:px-12 max-w-[1440px] mx-auto space-y-20">
      
      {/* Title Section */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-[10px] tracking-[0.4em] font-bold text-muted uppercase">
          OUR PHILOSOPHY
        </span>
        <h1 className="font-serif text-4xl md:text-6xl tracking-tight uppercase text-foreground">
          THE VISION
        </h1>
        <div className="h-[1px] w-12 bg-border mx-auto my-4" />
      </div>

      {/* Hero Banner Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative aspect-[16/9] w-full bg-neutral-100 border border-border overflow-hidden"
      >
        <Image
          src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1600"
          alt="Fractals Studio Vision Showcase"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/20" />
      </motion.div>

      {/* Philosophy Details Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pt-8">
        <div className="lg:col-span-5 space-y-6">
          <span className="text-[9px] tracking-[0.25em] font-bold text-muted uppercase block">
            CORE PRINCIPLES
          </span>
          <h2 className="font-serif text-3xl md:text-4.5xl leading-tight text-foreground uppercase tracking-wide">
            GEOMETRIC SYMMETRY & TAILORED FORM
          </h2>
          <p className="text-xs text-muted leading-relaxed font-light tracking-wide">
            At FRACTALS STUDIO MX, our garments are approached as sculptural form. We strip away unnecessary ornaments to dedicate focus entirely on pure composition: the structure of seam lines, geometric balance, and premium textures.
          </p>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <span className="text-sm font-semibold tracking-wider text-foreground block">
              I. CONVERSION
            </span>
            <p className="text-xs text-neutral-500 leading-relaxed font-light">
              We translate physical materials into asymmetric works of art, building silhouettes that move dynamically with the human frame.
            </p>
          </div>
          <div className="space-y-4">
            <span className="text-sm font-semibold tracking-wider text-foreground block">
              II. SUSTAINABLE ATELIER
            </span>
            <p className="text-xs text-neutral-500 leading-relaxed font-light">
              Craftsmanship is slow, deliberate, and respectful. Every garment is hand-finished in our atelier under meticulous ethical standards.
            </p>
          </div>
          <div className="space-y-4">
            <span className="text-sm font-semibold tracking-wider text-foreground block">
              III. TEXTURAL DENSITY
            </span>
            <p className="text-xs text-neutral-500 leading-relaxed font-light">
              We source high-grade wools, premium double-faced calfskins, and organic silks, allowing the natural weight of fabric to dictate form.
            </p>
          </div>
          <div className="space-y-4">
            <span className="text-sm font-semibold tracking-wider text-foreground block">
              IV. MODERN AVANT-GARDE
            </span>
            <p className="text-xs text-neutral-500 leading-relaxed font-light">
              An elegant design system designed to last beyond seasons, representing a refined uniform for global tastemakers.
            </p>
          </div>
        </div>
      </div>
      
    </div>
  );
}
