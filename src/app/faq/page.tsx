"use client";

import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQS = [
  {
    q: "ARE FRACTALS STUDIO MX CREATIONS LIMITED?",
    a: "Yes. Most items are crafted in limited quantities to respect sustainable production capacities. We rarely re-run past collections, making each piece an exclusive archival asset.",
  },
  {
    q: "HOW DO I FIND THE CORRECT SIZE?",
    a: "Our fits generally run true to standard sizing with slightly tailored drapes. Please consult the specific measurement details displayed on the product cards, or get in touch through our contact form.",
  },
  {
    q: "WHAT MATERIALS DO YOU INTEGRATE?",
    a: "We integrate certified organic double-faced calfskins, premium Italian nappa, heavyweight wools, and organic cotton silks. We detail our precise material compounds under each creation page.",
  },
  {
    q: "DO YOU ACCOMMODATE BESPOKE CUSTOMIZATION?",
    a: "Yes, bespoke alterations and tailor requests can be requested by reaching out to our concierge service through the contact form.",
  },
];

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggleIdx = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className="w-full bg-background min-h-screen py-16 px-6 md:px-12 max-w-[1440px] mx-auto flex flex-col justify-center items-center">
      <div className="w-full max-w-2xl space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-[10px] tracking-[0.4em] font-bold text-muted uppercase">
            ASSISTANCE
          </span>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight uppercase text-foreground">
            COMMON QUESTIONS
          </h1>
          <div className="h-[1px] w-12 bg-border mx-auto my-4" />
        </div>

        {/* FAQ list */}
        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className="border-b border-border pb-4">
                <button
                  onClick={() => toggleIdx(idx)}
                  className="w-full flex items-center justify-between text-left py-2 hover:text-muted smooth-hover"
                >
                  <span className="text-xs font-semibold tracking-wider text-foreground uppercase">
                    {faq.q}
                  </span>
                  {isOpen ? <Minus size={14} className="shrink-0 ml-4" /> : <Plus size={14} className="shrink-0 ml-4" />}
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="text-xs text-neutral-500 pt-2 pb-4 leading-relaxed font-light">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
