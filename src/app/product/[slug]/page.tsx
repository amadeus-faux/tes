"use client";

import React, { useState, use, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, ChevronDown, ShieldCheck, Truck, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/context/StoreContext";
import { MOCK_PRODUCTS, MOCK_VARIANTS, Product } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  price_override?: string | null;
  size: string;
  color: string;
  material: string;
  stock: number;
}

export default function ProductDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const { addToCart } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);

  useEffect(() => {
    // 1. Initial fallback load
    const mockP = MOCK_PRODUCTS.find((p) => p.slug === slug);
    if (mockP) {
      setTimeout(() => {
        setProduct(mockP);
        const mockV = MOCK_VARIANTS.filter((v) => v.product_id === mockP.id);
        setProductVariants(mockV);
      }, 0);
    }

    // 2. Fetch live data from Supabase
    const fetchLiveDetails = async () => {
      try {
        const { data: pData, error: pError } = await supabase
          .from("products")
          .select("*")
          .eq("slug", slug)
          .eq("status", "active")
          .maybeSingle();

        if (pError) throw pError;
        if (pData) {
          setProduct(pData);

          const { data: vData, error: vError } = await supabase
            .from("product_variants")
            .select(`
              id,
              product_id,
              name,
              sku,
              price_override,
              size,
              color,
              material,
              inventory (
                stock_quantity
              )
            `)
            .eq("product_id", pData.id);

          if (vError) throw vError;
          if (vData) {
            interface SupabaseVariant {
              id: string;
              product_id: string;
              name: string;
              sku: string;
              price_override: string | null;
              size: string;
              color: string;
              material: string;
              inventory: { stock_quantity: number } | { stock_quantity: number }[] | null;
            }
            const mappedVariants = (vData as unknown as SupabaseVariant[]).map((v) => ({
              id: v.id,
              product_id: v.product_id,
              name: v.name,
              sku: v.sku,
              price_override: v.price_override,
              size: v.size,
              color: v.color,
              material: v.material,
              stock: Array.isArray(v.inventory)
                ? v.inventory[0]?.stock_quantity || 0
                : v.inventory?.stock_quantity || 0,
            }));
            setProductVariants(mappedVariants);
          }
        }
      } catch (err) {
        console.warn("Detail DB fetch failed, using mock fallback:", err);
      }
    };

    fetchLiveDetails();
  }, [slug]);

  // Extract unique sizes and colors dynamically
  const sizes = useMemo(() => {
    const s = productVariants.map((v) => v.size).filter(Boolean);
    return Array.from(new Set(s));
  }, [productVariants]);

  const colors = useMemo(() => {
    const c = productVariants.map((v) => v.color).filter(Boolean);
    return Array.from(new Set(c));
  }, [productVariants]);

  // Active inputs states
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Sync state selection when lists hydrate from DB
  useEffect(() => {
    if (sizes.length > 0 && !selectedSize) {
      setTimeout(() => setSelectedSize(sizes[0]), 0);
    }
  }, [sizes, selectedSize]);

  useEffect(() => {
    if (colors.length > 0 && !selectedColor) {
      setTimeout(() => setSelectedColor(colors[0]), 0);
    }
  }, [colors, selectedColor]);

  // Accordion details toggle states
  const [accordions, setAccordions] = useState({
    details: true,
    care: false,
    shipping: false,
  });

  const toggleAccordion = (key: keyof typeof accordions) => {
    setAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!product) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-6 py-32 text-center space-y-6">
        <h2 className="font-serif text-3xl uppercase">Creation Not Found</h2>
        <p className="text-xs text-muted uppercase tracking-widest">
          The requested luxury piece could not be retrieved from the archives.
        </p>
        <Link href="/shop" className="luxury-btn">
          RETURN TO CATALOGUE
        </Link>
      </div>
    );
  }

  // Find active variant matching selected color & size
  const activeVariant = productVariants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );

  const stockAvailable = activeVariant ? activeVariant.stock : 0;
 
  // Price (variant specific price override, or fall back to base product price)
  const currentPrice = product.base_price;

  const handleAddToCart = () => {
    if (!activeVariant) return;
    
    addToCart(
      {
        id: activeVariant.id,
        productId: product.id,
        name: product.name,
        price: currentPrice,
        image: product.images[0],
        size: selectedSize,
        color: selectedColor,
        sku: activeVariant.sku,
      },
      quantity
    );
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-10 md:py-20">
      
      {/* Breadcrumb path */}
      <div className="text-[9px] tracking-[0.25em] font-semibold text-muted uppercase mb-8 md:mb-12">
        <Link href="/" className="hover:text-foreground smooth-hover">HOME</Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-foreground smooth-hover">SHOP</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16 items-start">
        
        {/* LEFT COLUMN: Editorial Image Gallery (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Display Image */}
          <div className="relative aspect-[4/5] bg-neutral-100 overflow-hidden border border-border">
            <Image
              src={product.images[activeImageIndex]}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover transition-transform duration-700 hover:scale-105"
              priority
            />
          </div>

          {/* Thumbnails list */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            {product.images.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`relative w-20 h-24 border bg-neutral-100 overflow-hidden flex-shrink-0 transition-colors duration-300 ${
                  activeImageIndex === idx ? "border-foreground" : "border-border hover:border-foreground/50"
                }`}
              >
                <Image
                  src={img}
                  alt={`${product.name} thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>

        </div>

        {/* RIGHT COLUMN: Sticky Info & Purchase Inputs (lg:col-span-5) */}
        <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-8">
          
          {/* Brand/Heading Metadata */}
          <div className="space-y-2">
            <span className="text-[10px] tracking-[0.3em] font-bold text-muted uppercase">
              {product.category}
            </span>
            <h1 className="font-serif text-3xl md:text-4.5xl tracking-tight leading-tight uppercase font-medium">
              {product.name}
            </h1>
            <p className="text-xl font-medium tracking-wider text-foreground">
              ${currentPrice.toFixed(2)}
            </p>
          </div>

          {/* Short narrative details */}
          <p className="text-xs text-muted leading-relaxed tracking-wider">
            {product.description}
          </p>

          {/* Color chip selections */}
          {colors.length > 0 && colors[0] !== "" && (
            <div className="space-y-3">
              <span className="text-[9px] tracking-[0.2em] font-bold text-foreground uppercase block">
                SELECT COLOR: <span className="font-light text-muted ml-1">{selectedColor}</span>
              </span>
              <div className="flex gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      setQuantity(1); // Reset quantity
                    }}
                    className={`text-[10px] tracking-widest uppercase border px-3 py-1.5 transition-all duration-300 ${
                      selectedColor === color
                        ? "border-foreground bg-foreground text-background font-semibold"
                        : "border-border hover:border-foreground text-foreground"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size chip selections */}
          {sizes.length > 0 && sizes[0] !== "" && (
            <div className="space-y-3">
              <span className="text-[9px] tracking-[0.2em] font-bold text-foreground uppercase block">
                SELECT SIZE: <span className="font-light text-muted ml-1">{selectedSize}</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  // Check if this size is available for the currently selected color
                  const variant = productVariants.find(
                    (v) => v.size === size && v.color === selectedColor
                  );
                  const isAvailable = variant ? variant.stock > 0 : false;

                  return (
                    <button
                      key={size}
                      disabled={!isAvailable}
                      onClick={() => {
                        setSelectedSize(size);
                        setQuantity(1); // Reset quantity
                      }}
                      className={`text-[10px] tracking-widest uppercase border py-2.5 px-4 min-w-[50px] transition-all duration-300 ${
                        selectedSize === size
                          ? "border-foreground bg-foreground text-background font-semibold"
                          : isAvailable
                          ? "border-border hover:border-foreground text-foreground"
                          : "border-neutral-200 text-neutral-300 cursor-not-allowed line-through"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock inventory display indicator */}
          <div className="text-[10px] tracking-wider uppercase flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${stockAvailable > 0 ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            {stockAvailable > 0 ? (
              <span className="text-muted">
                IN STOCK: <span className="font-semibold text-foreground">{stockAvailable} PIECES AVAILABLE</span>
              </span>
            ) : (
              <span className="text-red-500 font-semibold">PIECE CURRENTLY OUT OF STOCK</span>
            )}
          </div>

          {/* Count adjust & Checkout CTA Grid */}
          <div className="flex gap-4 pt-2">
            
            {/* Quantity Adjuster */}
            <div className="flex items-center border border-border bg-background">
              <button
                disabled={stockAvailable === 0}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-3 hover:bg-neutral-100 disabled:opacity-50 smooth-hover"
              >
                <Minus size={12} />
              </button>
              <span className="px-4 text-xs font-semibold tabular-nums select-none">{quantity}</span>
              <button
                disabled={stockAvailable === 0 || quantity >= stockAvailable}
                onClick={() => setQuantity((q) => q + 1)}
                className="p-3 hover:bg-neutral-100 disabled:opacity-50 smooth-hover"
              >
                <Plus size={12} />
              </button>
            </div>

            {/* Add to Basket Action */}
            <button
              disabled={stockAvailable === 0}
              onClick={handleAddToCart}
              className="flex-grow luxury-btn-dark disabled:bg-neutral-200 disabled:text-neutral-400 disabled:border-neutral-200 disabled:cursor-not-allowed text-[10px] font-semibold tracking-[0.2em]"
            >
              {stockAvailable > 0 ? "ADD TO BASKET" : "OUT OF STOCK"}
            </button>



          </div>

          {/* Brand/Product Assurances */}
          <div className="border-t border-border pt-6 space-y-3">
            <div className="flex items-center gap-3 text-[10px] text-muted tracking-wider uppercase font-medium">
              <Truck size={14} className="text-foreground shrink-0" />
              <span>Complimentary shipping & signature packaging</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted tracking-wider uppercase font-medium">
              <RefreshCw size={14} className="text-foreground shrink-0" />
              <span>Complimentary returns within 14 days</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted tracking-wider uppercase font-medium">
              <ShieldCheck size={14} className="text-foreground shrink-0" />
              <span>Authenticity guaranteed & luxury warranty</span>
            </div>
          </div>

          {/* Accordions */}
          <div className="border-t border-border pt-4">
            
            {/* Accordion 1: Details & Fit */}
            <div className="border-b border-border py-4">
              <button
                onClick={() => toggleAccordion("details")}
                className="w-full flex justify-between items-center text-left hover:text-muted smooth-hover"
              >
                <span className="text-[10px] tracking-[0.2em] font-bold uppercase">DESCRIPTION & FIT</span>
                <ChevronDown
                  size={14}
                  className={`transform transition-transform duration-300 ${accordions.details ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence>
                {accordions.details && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="text-[11px] text-muted leading-relaxed tracking-wider pt-3 space-y-1">
                      Designed with an editorial sensibility. Fits true to size, take your normal size. Calfskin leather items feature natural grain variations. Made in Italy.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Accordion 2: Care & Composition */}
            <div className="border-b border-border py-4">
              <button
                onClick={() => toggleAccordion("care")}
                className="w-full flex justify-between items-center text-left hover:text-muted smooth-hover"
              >
                <span className="text-[10px] tracking-[0.2em] font-bold uppercase">COMPOSITION & CARE</span>
                <ChevronDown
                  size={14}
                  className={`transform transition-transform duration-300 ${accordions.care ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence>
                {accordions.care && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="text-[11px] text-muted leading-relaxed tracking-wider pt-3">
                      To preserve the quality of this creation, avoid exposure to direct light, heat, and moisture. Clean only using a soft, dry cloth or professional leather/jewelry specialists. Store inside the provided signature protective dust bag and box.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Accordion 3: Shipping & Returns */}
            <div className="border-b border-border py-4">
              <button
                onClick={() => toggleAccordion("shipping")}
                className="w-full flex justify-between items-center text-left hover:text-muted smooth-hover"
              >
                <span className="text-[10px] tracking-[0.2em] font-bold uppercase">SHIPPING & GIFTING</span>
                <ChevronDown
                  size={14}
                  className={`transform transition-transform duration-300 ${accordions.shipping ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence>
                {accordions.shipping && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="text-[11px] text-muted leading-relaxed tracking-wider pt-3">
                      All orders are shipped complimentary in our signature black FRACTALS STUDIO MX box, complete with fabric ribbons and product certification cards. Standard delivery completes in 3-5 business days. Express shipping is available on check out.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
