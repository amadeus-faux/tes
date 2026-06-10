"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const ANNOUNCEMENTS = [
  "COMPLIMENTARY SHIPPING & RETURNS ON ALL ORDERS",
  "EXPLORE THE NEW COUTURE ARRIVALS | FALL / WINTER 2026",
  "SECURE PAYMENTS WITH VISA & MASTERCARD",
];

export default function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % ANNOUNCEMENTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-black text-white text-[9px] md:text-[10px] tracking-[0.2em] font-medium py-2 px-4 flex items-center justify-center overflow-hidden h-8 border-b border-white/10 uppercase">
      <div className="relative w-full text-center flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -15, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute text-center py-1 w-full"
          >
            {ANNOUNCEMENTS[index]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
