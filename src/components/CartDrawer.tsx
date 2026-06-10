"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/context/StoreContext";

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateCartQuantity, removeFromCart, cartSubtotal } = useStore();

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
          />

          {/* Cart Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[440px] bg-background border-l border-border flex flex-col justify-between shadow-2xl h-full"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <span className="text-[10px] tracking-[0.2em] font-semibold uppercase text-foreground">
                YOUR BASKET ({cart.length})
              </span>
              <button
                onClick={() => setCartOpen(false)}
                className="flex items-center gap-1 hover:text-muted smooth-hover"
              >
                <span className="text-[9px] tracking-[0.1em] font-medium uppercase">CLOSE</span>
                <X size={15} className="stroke-[1.5]" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 no-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                  <span className="font-serif text-lg italic text-muted">FRACTALS STUDIO MX</span>
                  <p className="text-[11px] tracking-widest text-muted uppercase">Your basket is currently empty.</p>
                  <Link
                    href="/shop"
                    onClick={() => setCartOpen(false)}
                    className="luxury-btn text-[10px] py-2.5"
                  >
                    CONTINUE SHOPPING
                  </Link>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-border last:border-b-0">
                    {/* Item Image */}
                    <div className="relative w-20 h-24 border border-border bg-neutral-100 flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>

                    {/* Item Information */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="text-[11px] tracking-widest font-semibold uppercase line-clamp-1">
                            {item.name}
                          </h4>
                          <span className="text-[11px] tracking-widest font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-[9px] tracking-wider text-muted uppercase mt-0.5">
                          SIZE: {item.size} / COLOR: {item.color}
                        </p>
                      </div>

                      {/* Controls Row */}
                      <div className="flex items-center justify-between mt-2">
                        {/* Adjust Count */}
                        <div className="flex items-center border border-border">
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 hover:bg-neutral-100 smooth-hover"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="px-3 text-[10px] font-medium tabular-nums">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 hover:bg-neutral-100 smooth-hover"
                          >
                            <Plus size={10} />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-muted hover:text-red-500 smooth-hover"
                        >
                          <Trash2 size={13} className="stroke-[1.5]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Summary & CTA Footer */}
            {cart.length > 0 && (
              <div className="border-t border-border p-6 bg-neutral-50/50 space-y-4">
                <div className="flex justify-between items-center text-[10px] tracking-[0.2em] font-semibold uppercase">
                  <span>ESTIMATED SUBTOTAL</span>
                  <span className="text-sm font-medium tracking-normal">${cartSubtotal.toFixed(2)}</span>
                </div>
                <p className="text-[9px] tracking-wider text-muted uppercase">
                  Taxes and shipping calculated at checkout.
                </p>

                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    href="/checkout"
                    onClick={() => setCartOpen(false)}
                    className="w-full luxury-btn-dark text-center text-[10px] font-semibold"
                  >
                    PROCEED TO CHECKOUT
                  </Link>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="w-full text-center text-[9px] tracking-[0.2em] font-medium uppercase text-muted hover:text-foreground smooth-hover pt-1"
                  >
                    CONTINUE SHOPPING
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
