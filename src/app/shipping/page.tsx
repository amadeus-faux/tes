"use client";

import React from "react";

export default function ShippingPage() {
  return (
    <div className="w-full bg-background min-h-screen py-16 px-6 md:px-12 max-w-[1440px] mx-auto flex flex-col justify-center items-center">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-3">
          <span className="text-[10px] tracking-[0.4em] font-bold text-muted uppercase">
            ASSISTANCE
          </span>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight uppercase text-foreground">
            SHIPPING POLICY
          </h1>
          <div className="h-[1px] w-12 bg-border mx-auto my-4" />
        </div>

        <div className="space-y-6 text-xs text-neutral-600 leading-relaxed font-light tracking-wide">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold tracking-wider text-foreground uppercase">
              COMPLIMENTARY DELIVERY
            </h2>
            <p>
              FRACTALS STUDIO MX is pleased to offer complimentary signature standard delivery on all domestic and international orders. Our products are packaged in signature custom black boxes with fabric wrap ties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold tracking-wider text-foreground uppercase">
              TIMELINES & PROCESS
            </h2>
            <p>
              All orders are dispatched from our atelier within 24–48 hours of verification, excluding holidays and weekends.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Standard Shipping: 3–5 business days (Complimentary)</li>
              <li>Express Delivery: 1–2 business days (Calculated at checkout)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold tracking-wider text-foreground uppercase">
              TRACKING AND SECURITY
            </h2>
            <p>
              A tracking identifier will be dispatched to your registered email address as soon as the courier scans the shipping parcel. All shipments are fully insured and require a signature upon delivery.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
