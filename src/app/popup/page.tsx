"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const NYC_PHOTOS = [
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800",
  "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=800",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800",
  "https://images.unsplash.com/photo-1537838979607-a57bd4d8d970?q=80&w=800",
];

export default function PopUpPage() {
  return (
    <div className="w-full bg-background min-h-screen py-16 px-6 md:px-12 max-w-[1440px] mx-auto space-y-16">
      
      {/* Brand Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-[10px] tracking-[0.4em] font-bold text-muted uppercase">
          FRACTALS POP-UP DIARY
        </span>
        <h1 className="font-serif text-4xl md:text-6xl tracking-tight uppercase text-foreground">
          NEW YORK
        </h1>
        <div className="h-[1px] w-12 bg-border mx-auto my-4" />
        <p className="text-xs text-muted leading-relaxed tracking-wide font-light">
          A retrospective on our physical residency. FRACTALS STUDIO MX hosted an architectural installation, private client previews, and bespoke styling ateliers in the heart of Manhattan.
        </p>
      </div>

      {/* Grid gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
        {NYC_PHOTOS.map((src, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative aspect-[3/4] bg-neutral-100 border border-border overflow-hidden group"
          >
            <Image
              src={src}
              alt={`New York Pop-Up Documentation ${idx + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-103"
            />
            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors duration-300" />
          </motion.div>
        ))}
      </div>

      {/* Brief details footer block */}
      <div className="border-t border-border pt-12 max-w-2xl mx-auto text-center space-y-4">
        <span className="text-[10px] tracking-[0.25em] font-bold text-muted uppercase block">
          EVENT HIGHLIGHTS
        </span>
        <p className="text-xs text-neutral-500 leading-relaxed font-light">
          Collaborative curation featured architectural plaster columns, industrial metal racks, and soft fabric screens designed in partnership with local sculptors. Over 300 archival items were cataloged and displayed for our New York client network.
        </p>
      </div>
      
    </div>
  );
}
