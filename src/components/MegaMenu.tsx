"use client";

import React from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/context/StoreContext";

const MENU_ITEMS = [
  { title: "STORE", slug: "/shop" },
  { title: "GALLERY", slug: "/gallery" },
  { title: "VISION", slug: "/vision" },
  { title: "POP UP", slug: "/popup" },
  { title: "CONTACT US", slug: "/contact" },
];

export default function MegaMenu() {
  const { menuOpen, setMenuOpen } = useStore();

  return (
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 bg-background flex flex-col justify-between"
        >
          {/* Menu Header */}
          <div className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-border">
            <span className="text-[10px] tracking-[0.3em] font-semibold uppercase text-muted">FRACTALS NAVIGATOR</span>
            <button
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 group hover:text-muted smooth-hover"
            >
              <span className="text-[10px] tracking-[0.2em] font-medium uppercase">CLOSE</span>
              <X size={16} className="stroke-[1.5]" />
            </button>
          </div>

          {/* Menu Content */}
          <div className="flex-1 flex flex-col justify-center items-center overflow-y-auto px-6 py-10 md:py-16">
            <div className="flex flex-col space-y-6 md:space-y-8 text-center">
              {MENU_ITEMS.map((item) => (
                <div key={item.title} className="overflow-hidden">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <Link
                      href={item.slug}
                      onClick={() => setMenuOpen(false)}
                      className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight text-foreground hover:italic inline-flex items-center transition-all duration-300"
                    >
                      {item.title}
                    </Link>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          {/* Menu Footer */}
          <div className="border-t border-border px-6 md:px-12 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[9px] md:text-[10px] tracking-[0.2em] font-medium uppercase text-muted">
            <div className="flex gap-6">
              <Link href="/shop" onClick={() => setMenuOpen(false)} className="hover:text-foreground smooth-hover">
                SHOP ALL COUTURE
              </Link>
              <Link href="/contact" onClick={() => setMenuOpen(false)} className="hover:text-foreground smooth-hover">
                CUSTOMER SUPPORT
              </Link>
            </div>
            <span>© FRACTALS STUDIO MX 2026. All rights reserved.</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
