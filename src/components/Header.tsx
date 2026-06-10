"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, Menu } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export default function Header() {
  const { setMenuOpen, setCartOpen, cartCount } = useStore();

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 h-16 md:h-20 flex items-center justify-between">
        
        {/* Left Section: Menu button */}
        <div className="flex items-center">
          <button
            onClick={() => setMenuOpen(true)}
            className="flex items-center gap-2 group hover:text-muted smooth-hover"
          >
            <Menu size={16} className="stroke-[1.5] group-hover:scale-105 transition-transform" />
            <span className="hidden md:inline text-[10px] tracking-[0.25em] font-medium uppercase mt-0.5">
              MENU
            </span>
          </button>
        </div>

        {/* Center Section: Centered Brand Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <Link
            href="/"
            className="font-serif text-xl md:text-2xl tracking-[0.18em] font-bold text-foreground hover:opacity-85 transition-opacity whitespace-nowrap"
          >
            FRACTALS STUDIO MX
          </Link>
        </div>

        {/* Right Section: Utility Navigation */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Cart Bag Icon with Item Counter */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative hover:text-muted smooth-hover p-1"
          >
            <ShoppingBag size={16} className="stroke-[1.5]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-foreground text-background text-[7px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
