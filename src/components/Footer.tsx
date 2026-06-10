"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Thank you for subscribing with: ${email}`);
    setEmail("");
  };

  return (
    <footer className="w-full bg-foreground text-background border-t border-border/10 pt-16 pb-12 px-6 md:px-12 mt-auto">
      <div className="max-w-[1440px] mx-auto space-y-16">
        
        {/* Top: Brand & Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Brand info */}
          <div className="lg:col-span-5 space-y-4">
            <span className="font-serif text-2xl tracking-[0.2em] font-semibold">FRACTALS STUDIO MX</span>
            <p className="text-[11px] tracking-wider leading-relaxed text-neutral-400 max-w-sm">
              Established in Mexico, FRACTALS STUDIO MX represents a convergence of sculptural form, structural tailoring, and effortless avant-garde elegance.
            </p>
          </div>

          {/* Newsletter subscription */}
          <div className="lg:col-span-7 space-y-4 w-full">
            <span className="text-[10px] tracking-[0.2em] font-semibold uppercase block text-neutral-300">
              JOIN THE FRACTALS JOURNAL
            </span>
            <p className="text-xs text-neutral-400 max-w-md">
              Receive early access to seasonal collections, private runway viewings, and brand narratives.
            </p>
            <form onSubmit={handleSubmit} className="relative max-w-md border-b border-neutral-600 focus-within:border-background transition-colors duration-300 flex items-center py-1.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="YOUR EMAIL ADDRESS"
                className="w-full bg-transparent text-background placeholder:text-neutral-500 text-xs tracking-widest uppercase border-none focus:outline-none pr-8 py-1"
              />
              <button
                type="submit"
                className="absolute right-0 text-neutral-400 hover:text-background transition-colors p-1"
              >
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* Middle: Links columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-8 border-t border-neutral-800">
          
          {/* Column 1 */}
          <div className="space-y-3">
            <span className="text-[9px] tracking-[0.3em] font-semibold text-neutral-300 uppercase">ASSISTANCE</span>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-[11px] text-neutral-400 hover:text-background smooth-hover">
                  Customer Service
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-[11px] text-neutral-400 hover:text-background smooth-hover">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-[11px] text-neutral-400 hover:text-background smooth-hover">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-[11px] text-neutral-400 hover:text-background smooth-hover">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
 
          {/* Column 2 */}
          <div className="space-y-3">
            <span className="text-[9px] tracking-[0.3em] font-semibold text-neutral-300 uppercase">COMPANY</span>
            <ul className="space-y-2">
              <li>
                <Link href="/vision" className="text-[11px] text-neutral-400 hover:text-background smooth-hover">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
 
          {/* Column 3 */}
          <div className="space-y-3">
            <span className="text-[9px] tracking-[0.3em] font-semibold text-neutral-300 uppercase">SOCIAL CHANNELS</span>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://instagram.com/fractals.studio.mx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-neutral-400 hover:text-background smooth-hover"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[9px] tracking-[0.2em] font-medium uppercase text-neutral-500">
          <span>© FRACTALS STUDIO MX 2026. ALL RIGHTS RESERVED.</span>
          <div className="flex gap-6">
            <span className="cursor-pointer hover:text-background smooth-hover">PRIVACY POLICY</span>
            <span className="cursor-pointer hover:text-background smooth-hover">TERMS & CONDITIONS</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
