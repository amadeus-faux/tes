"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import { MOCK_PRODUCTS, Product } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";

function ShopContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("status", "active");

        if (error) throw error;
        if (data && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(MOCK_PRODUCTS);
        }
      } catch (err) {
        console.warn("Shop DB fetch failed, falling back to mock data:", err);
        setProducts(MOCK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return <ShopFallback />;
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-10 md:py-16">
      
      {/* Category Title / Banner */}
      <div className="border-b border-border pb-8 mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <span className="text-[9px] tracking-[0.3em] font-semibold text-muted uppercase block">
            FRACTALS STUDIO MX
          </span>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight uppercase text-foreground">
            ALL CREATIONS
          </h1>
        </div>
        <span className="text-[10px] tracking-widest text-muted uppercase">
          {products.length} CREATIONS FOUND
        </span>
      </div>

      {/* Products list grid */}
      {products.length === 0 ? (
        <div className="w-full text-center py-24 space-y-4">
          <p className="font-serif italic text-lg text-muted">FRACTALS STUDIO MX</p>
          <p className="text-[11px] tracking-widest text-muted uppercase">
            No creations found in the archives.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      )}

    </div>
  );
}

// Fallback skeleton screen while content loads
function ShopFallback() {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-32 text-center">
      <span className="font-serif italic text-lg animate-pulse text-muted">
        FRACTALS STUDIO MX Loading...
      </span>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopFallback />}>
      <ShopContent />
    </Suspense>
  );
}
