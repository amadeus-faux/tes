"use client";

import React from "react";

export default function ReturnsPage() {
  return (
    <div className="w-full bg-background min-h-screen py-16 px-6 md:px-12 max-w-[1440px] mx-auto flex flex-col justify-center items-center">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-3">
          <span className="text-[10px] tracking-[0.4em] font-bold text-muted uppercase">
            ASSISTANCE
          </span>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight uppercase text-foreground">
            RETURNS & EXCHANGES
          </h1>
          <div className="h-[1px] w-12 bg-border mx-auto my-4" />
        </div>

        <div className="space-y-6 text-xs text-neutral-600 leading-relaxed font-light tracking-wide">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold tracking-wider text-foreground uppercase">
              14-DAY RETURN POLICY
            </h2>
            <p>
              We want you to be fully satisfied with your garment. FRACTALS STUDIO MX accepts returns or exchanges on all unworn, unaltered products with security labels intact within 14 days of receipt.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold tracking-wider text-foreground uppercase">
              RETURN ELIGIBILITY
            </h2>
            <p>
              To qualify for refund credits, items must return in their original packaging, including protective dust bags, hanger elements, boxes, and documentation cards.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold tracking-wider text-foreground uppercase">
              PROCESS REQUESTS
            </h2>
            <p>
              To initiate a return or exchange, please access our contact page and submit a service request, citing your order confirmation code. Pre-paid shipping labels will be emailed to you.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
