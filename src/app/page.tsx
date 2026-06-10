"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { MOCK_PRODUCTS, Product } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: ".hero-section",
        start: "top top",
        end: "bottom top",
        pin: true,
        pinSpacer: false as any,
      });
    });

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("is_featured", true)
          .eq("status", "active");

        if (error) throw error;
        if (data && data.length > 0) {
          setFeaturedProducts(data);
        } else {
          setFeaturedProducts(MOCK_PRODUCTS.filter((p) => p.is_featured));
        }
      } catch (err) {
        console.warn("DB fetch failed, falling back to mock data:", err);
        setFeaturedProducts(MOCK_PRODUCTS.filter((p) => p.is_featured));
      }
    };
    fetchFeatured();
  }, []);


  return (
    <div className="w-full relative">

      {/* 1. HERO SECTION */}
      <section className="hero-section absolute top-0 left-0 w-full h-screen bg-neutral-900 overflow-hidden z-0">
        {/* Cinematic Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        >
          <source
            src="/assets/video/1.mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
        {/* Soft Dark Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-black/40" />

        {/* Hero Copy Overlay */}
        <div className="absolute inset-0 max-w-[1440px] mx-auto px-6 md:px-12 flex flex-col justify-end pb-20 md:pb-28">
          <div className="max-w-xl text-white space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-5xl md:text-7xl tracking-tight leading-[0.95]"
            >
              CIGILWARE: INITIATION
            </motion.h1>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="pt-2"
            >
              <Link href="/shop" className="luxury-btn bg-white text-black border-white hover:bg-transparent hover:text-white">
                SHOP NOW
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Spacer to allow absolute hero section to be visible */}
      <div className="h-[100vh] w-full pointer-events-none"></div>

      {/* Main Content Wrapper (Slides over Hero) */}
      <div className="relative z-10 bg-background w-full shadow-[0_-10px_50px_rgba(0,0,0,0.12)]">
        {/* 2. ASYMMETRIC EDITORIAL COLLECTIONS BLOCK */}
        <section className="relative z-10 bg-background max-w-[1440px] mx-auto px-6 md:px-12 py-20 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">

            {/* Left Block: Women's Collection (Taller, slightly offset) */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="md:col-span-7 space-y-6"
            >
              <Link href="/vision" className="relative block aspect-[4/5] overflow-hidden border border-border bg-neutral-100 group">
                <Image
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200"
                  alt="Women's Couture"
                  fill
                  sizes="(max-width: 768px) 100vw, 55vw"
                  className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />
                <div className="absolute bottom-8 left-8 text-white">
                  <span className="text-[9px] tracking-[0.25em] font-semibold uppercase block mb-1">BRAND STORY</span>
                  <h3 className="font-serif text-3xl tracking-wide uppercase">VISION</h3>
                </div>
              </Link>
              <div className="flex justify-between items-start max-w-md">
                <p className="text-[11px] tracking-wider text-muted uppercase leading-relaxed">
                  Discover our design manifesto, sustainable artisan practices, and material choices.
                </p>
                <Link href="/vision" className="text-xs font-semibold tracking-wider hover:underline flex items-center shrink-0 uppercase">
                  EXPLORE <ChevronRight size={14} className="mt-0.5" />
                </Link>
              </div>
            </motion.div>

            {/* Right Block: Men's Collection (Slightly shorter, lower start offset) */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="md:col-span-5 space-y-6 md:mt-24"
            >
              <Link href="/gallery" className="relative block aspect-[3/4] overflow-hidden border border-border bg-neutral-100 group">
                <Image
                  src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1200"
                  alt="Men's Ready-to-Wear"
                  fill
                  sizes="(max-width: 768px) 100vw, 35vw"
                  className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />
                <div className="absolute bottom-8 left-8 text-white">
                  <span className="text-[9px] tracking-[0.25em] font-semibold uppercase block mb-1">VISUALS</span>
                  <h3 className="font-serif text-3xl tracking-wide uppercase">GALLERY</h3>
                </div>
              </Link>
              <div className="flex justify-between items-start max-w-sm">
                <p className="text-[11px] tracking-wider text-muted uppercase leading-relaxed">
                  Step inside the creative space showcasing upcoming arrivals and atelier laboratory samples.
                </p>
                <Link href="/gallery" className="text-xs font-semibold tracking-wider hover:underline flex items-center shrink-0 uppercase">
                  EXPLORE <ChevronRight size={14} className="mt-0.5" />
                </Link>
              </div>
            </motion.div>

          </div>
        </section>

        {/* 3. PRODUCT SHOWCASE CAROUSEL */}
        <section className="bg-neutral-50/50 border-y border-border py-20 md:py-28">
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 space-y-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <span className="text-[9px] tracking-[0.3em] font-semibold text-muted uppercase block">
                  CURATED SELECTION
                </span>
                <h2 className="font-serif text-3.5xl md:text-5xl tracking-tight uppercase text-foreground">
                  LATEST CREATIONS
                </h2>
              </div>
              <Link
                href="/shop"
                className="text-xs font-semibold tracking-[0.15em] border-b border-foreground pb-1 hover:text-muted hover:border-muted smooth-hover uppercase flex items-center gap-1.5"
              >
                SHOP ALL CREATIONS <ArrowRight size={12} />
              </Link>
            </div>

            {/* Carousel Slider Wrapper */}
            <div className="flex gap-6 overflow-x-auto pb-6 pt-2 no-scrollbar snap-x snap-mandatory">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="w-[280px] sm:w-[320px] md:w-[360px] shrink-0 snap-start"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Visual Ticker Bar */}
            <div className="w-full flex items-center gap-4">
              <div className="h-[1px] bg-foreground/15 flex-grow" />
              <span className="text-[8px] tracking-[0.25em] font-semibold text-muted uppercase">
                DRAG OR SCROLL TO BROWSE
              </span>
              <div className="h-[1px] bg-foreground/15 flex-grow" />
            </div>

          </div>
        </section>

        {/* 4. BRAND STORYTELLING BLOCK */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-24 md:py-36">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">

            {/* Narrative content (Left) */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8 max-w-xl"
            >
              <span className="text-[10px] tracking-[0.35em] font-bold text-muted uppercase block">
                OUR MANIFESTO
              </span>
              <h2 className="font-serif text-4xl md:text-6xl tracking-tight leading-[1.05] uppercase text-foreground">
                ARCHITECTURAL FORM & DYNAMIC DRAPE
              </h2>
              <p className="text-xs md:text-sm tracking-wider leading-relaxed text-muted font-light">
                Every FRACTALS STUDIO MX garment is approached as a structural sculpture. We strip away extraneous details to focus on pure composition: the density of double-faced wool, the structure of hand-finished seams, and the dynamic weight of organic silk.
              </p>
              <p className="text-xs md:text-sm tracking-wider leading-relaxed text-muted font-light">
                Our materials are sourced responsibly from historic mills across Europe, combining generations of artisan heritage with forward-looking silhouettes.
              </p>
              <div className="pt-2">
                <Link href="/gallery" className="luxury-btn">
                  LEARN ABOUT OUR ATELIER
                </Link>
              </div>
            </motion.div>

            {/* Large image (Right) */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative aspect-[4/5] w-full border border-border bg-neutral-100 overflow-hidden"
            >
              <Image
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200"
                alt="Atelier drape craftsmanship details"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/5" />
            </motion.div>

          </div>
        </section>
      </div>

    </div>
  );
}
