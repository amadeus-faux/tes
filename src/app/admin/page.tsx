"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogOut, Plus, Trash2, Edit3, X, Check } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  base_price?: number;
  sizes: string[];
  stock: number;
  images: string[];
  category: string;
  status: "active" | "draft" | "archived";
}

const AVAILABLE_SIZES = ["38", "39", "40", "41", "OS", "6", "7", "S", "M", "L", "XL"];

export default function AdminDashboard() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [image1, setImage1] = useState("");
  const [image2, setImage2] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [status, setStatus] = useState<"active" | "draft" | "archived">("active");

  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Check authentication on load
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/fractals-admin-login");
      } else {
        setCheckingAuth(false);
        fetchProducts();
      }
    };
    checkUser();
  }, [router]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) {
        // Map database price to price column or base_price fallback
        const mapped: Product[] = data.map((p: any) => ({
          ...p,
          price: p.price !== null ? parseFloat(p.price) : parseFloat(p.base_price || 0),
          sizes: p.sizes || [],
          stock: p.stock !== null ? p.stock : 0,
        }));
        setProducts(mapped);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/fractals-admin-login");
  };

  const resetForm = () => {
    setIsEditMode(false);
    setCurrentId(null);
    setName("");
    setSlug("");
    setDescription("");
    setPrice("");
    setStock("");
    setCategory("");
    setImage1("");
    setImage2("");
    setSizes([]);
    setStatus("active");
    setFormError("");
  };

  const handleSizeToggle = (size: string) => {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleEditClick = (p: Product) => {
    setIsEditMode(true);
    setCurrentId(p.id);
    setName(p.name);
    setSlug(p.slug);
    setDescription(p.description || "");
    setPrice(p.price.toString());
    setStock(p.stock.toString());
    setCategory(p.category || "");
    setImage1(p.images[0] || "");
    setImage2(p.images[1] || "");
    setSizes(p.sizes || []);
    setStatus(p.status || "active");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    if (!name || !slug || !price || !stock || !category || !image1) {
      setFormError("All fields except description and secondary image are required.");
      setFormLoading(false);
      return;
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock);

    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError("Price must be a valid positive number.");
      setFormLoading(false);
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      setFormError("Stock must be a valid non-negative integer.");
      setFormLoading(false);
      return;
    }

    const imagesArray = [image1];
    if (image2) imagesArray.push(image2);

    try {
      if (isEditMode && currentId) {
        // 1. Update Products table
        const { error: pError } = await supabase
          .from("products")
          .update({
            name,
            slug,
            description,
            price: priceNum,
            base_price: priceNum,
            sizes,
            stock: stockNum,
            images: imagesArray,
            category,
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentId);

        if (pError) throw pError;

        // 2. Refresh Variants and Inventory
        // Delete existing variants (cascades to inventory)
        await supabase.from("product_variants").delete().eq("product_id", currentId);

        // Re-insert variants and inventory
        const activeSizes = sizes.length > 0 ? sizes : ["OS"];
        const stockPerSize = Math.max(1, Math.floor(stockNum / activeSizes.length));

        for (const size of activeSizes) {
          const { data: vData, error: vError } = await supabase
            .from("product_variants")
            .insert({
              product_id: currentId,
              name: `${size} / Default`,
              sku: `${slug}-${size}-${Date.now().toString().slice(-4)}`.toUpperCase(),
              size,
              color: "Default",
            })
            .select()
            .single();

          if (vError) throw vError;

          if (vData) {
            await supabase
              .from("inventory")
              .insert({
                variant_id: vData.id,
                stock_quantity: stockPerSize,
              });
          }
        }
      } else {
        // 1. Insert into Products table
        const { data: newProd, error: pError } = await supabase
          .from("products")
          .insert({
            name,
            slug,
            description,
            price: priceNum,
            base_price: priceNum,
            sizes,
            stock: stockNum,
            images: imagesArray,
            category,
            status,
          })
          .select()
          .single();

        if (pError) throw pError;

        // 2. Insert default variants and inventory
        const activeSizes = sizes.length > 0 ? sizes : ["OS"];
        const stockPerSize = Math.max(1, Math.floor(stockNum / activeSizes.length));

        for (const size of activeSizes) {
          const { data: vData, error: vError } = await supabase
            .from("product_variants")
            .insert({
              product_id: newProd.id,
              name: `${size} / Default`,
              sku: `${slug}-${size}-${Date.now().toString().slice(-4)}`.toUpperCase(),
              size,
              color: "Default",
            })
            .select()
            .single();

          if (vError) throw vError;

          if (vData) {
            await supabase
              .from("inventory")
              .insert({
                variant_id: vData.id,
                stock_quantity: stockPerSize,
              });
          }
        }
      }

      resetForm();
      fetchProducts();
    } catch (err: any) {
      setFormError(err.message || "Failed to save product.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this creation from the archive?")) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
      fetchProducts();
    } catch (err: any) {
      alert(err.message || "Failed to delete product.");
    }
  };

  if (checkingAuth) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-background">
        <span className="font-serif italic text-lg animate-pulse text-muted">Verification...</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-background min-h-screen py-10 px-6 md:px-12 max-w-[1440px] mx-auto space-y-8">
      {/* Top Header Row */}
      <div className="flex justify-between items-center border-b border-border pb-6">
        <div>
          <span className="text-[9px] tracking-[0.25em] font-semibold text-muted uppercase block">
            FRACTALS ATELIER MANAGER
          </span>
          <h1 className="font-serif text-3xl md:text-4.5xl uppercase text-foreground">
            ADMIN WORKSPACE
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 border border-border px-4 py-2 hover:border-foreground smooth-hover text-[10px] tracking-wider uppercase font-semibold"
        >
          <LogOut size={14} />
          LOG OUT
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Side: Product Archive List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xs tracking-[0.2em] font-bold uppercase text-foreground">
              PRODUCT ARCHIVES ({products.length})
            </h2>
            {isEditMode && (
              <button
                onClick={resetForm}
                className="flex items-center gap-1 text-[10px] tracking-widest text-muted hover:text-foreground font-semibold uppercase"
              >
                <Plus size={10} /> Add New Product
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-20 text-xs text-muted tracking-widest uppercase">
              Retrieving creations...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border text-xs text-muted tracking-widest uppercase">
              No products available in archive.
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex gap-4 border border-border p-4 hover:border-foreground/40 transition-colors bg-white relative group"
                >
                  <div className="relative w-20 h-24 shrink-0 bg-neutral-100 border border-border overflow-hidden">
                    {p.images[0] ? (
                      <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-muted font-bold">
                        NO IMAGE
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-foreground truncate">
                          {p.name}
                        </h3>
                        <span className="text-[8px] border border-border px-2 py-0.5 tracking-wider uppercase font-bold text-muted bg-neutral-50">
                          {p.status}
                        </span>
                      </div>
                      <p className="text-[9px] tracking-widest text-muted uppercase mt-0.5">
                        {p.category} | SLUG: {p.slug}
                      </p>
                      <p className="text-[10px] text-muted line-clamp-1 mt-1 font-light">
                        {p.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center justify-between mt-2 pt-2 border-t border-neutral-100">
                      <div className="flex gap-4 text-[10px]">
                        <span>
                          PRICE: <strong>${p.price.toFixed(2)}</strong>
                        </span>
                        <span>
                          STOCK: <strong>{p.stock}</strong>
                        </span>
                        <span>
                          SIZES: <strong>{p.sizes.join(", ") || "OS"}</strong>
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="hover:text-foreground text-neutral-400 p-1 smooth-hover"
                          title="Edit Product"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="hover:text-red-600 text-neutral-400 p-1 smooth-hover"
                          title="Delete Product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Manage Form */}
        <div className="lg:col-span-5 bg-white border border-border p-6 space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-xs tracking-[0.2em] font-bold uppercase text-foreground flex items-center gap-2">
              {isEditMode ? "EDIT CREATION" : "ARCHIVE NEW CREATION"}
            </h2>
            <p className="text-[9px] text-muted tracking-wider uppercase mt-1">
              {isEditMode ? "Modify details of an existing creation." : "Introduce a new luxury item to the database."}
            </p>
          </div>

          {formError && (
            <div className="border border-red-200 bg-red-50 text-red-700 text-[10px] py-2 px-3 tracking-wider uppercase text-center font-medium">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] tracking-[0.2em] font-bold text-muted uppercase block">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!isEditMode) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                    }
                  }}
                  placeholder="e.g. Silk Shirt"
                  className="w-full bg-transparent text-foreground border border-border focus:border-foreground transition-colors px-3 py-2 text-xs tracking-wider uppercase focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] tracking-[0.2em] font-bold text-muted uppercase block">
                  Product Slug
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ""))}
                  placeholder="e-g-silk-shirt"
                  className="w-full bg-transparent text-foreground border border-border focus:border-foreground transition-colors px-3 py-2 text-xs tracking-wider focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[8px] tracking-[0.2em] font-bold text-muted uppercase block">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed garment specifications and details"
                className="w-full bg-transparent text-foreground border border-border focus:border-foreground transition-colors px-3 py-2 text-xs tracking-wider focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] tracking-[0.2em] font-bold text-muted uppercase block">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="1250.00"
                  className="w-full bg-transparent text-foreground border border-border focus:border-foreground transition-colors px-3 py-2 text-xs tracking-wider focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] tracking-[0.2em] font-bold text-muted uppercase block">
                  Total Stock
                </label>
                <input
                  type="number"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="20"
                  className="w-full bg-transparent text-foreground border border-border focus:border-foreground transition-colors px-3 py-2 text-xs tracking-wider focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] tracking-[0.2em] font-bold text-muted uppercase block">
                  Category
                </label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Shoes / Clothing"
                  className="w-full bg-transparent text-foreground border border-border focus:border-foreground transition-colors px-3 py-2 text-xs tracking-wider uppercase focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[8px] tracking-[0.2em] font-bold text-muted uppercase block">
                Primary Image URL
              </label>
              <input
                type="text"
                required
                value={image1}
                onChange={(e) => setImage1(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-transparent text-foreground border border-border focus:border-foreground transition-colors px-3 py-2 text-xs tracking-wider focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[8px] tracking-[0.2em] font-bold text-muted uppercase block">
                Hover Image URL (Optional)
              </label>
              <input
                type="text"
                value={image2}
                onChange={(e) => setImage2(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-transparent text-foreground border border-border focus:border-foreground transition-colors px-3 py-2 text-xs tracking-wider focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <span className="text-[8px] tracking-[0.2em] font-bold text-muted uppercase block">
                Available Sizes
              </span>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SIZES.map((size) => {
                  const isChecked = sizes.includes(size);
                  return (
                    <button
                      type="button"
                      key={size}
                      onClick={() => handleSizeToggle(size)}
                      className={`text-[9px] border px-3 py-1.5 font-semibold transition-all duration-200 ${
                        isChecked
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-foreground hover:border-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[8px] tracking-[0.2em] font-bold text-muted uppercase block">
                Product Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-transparent text-foreground border border-border focus:border-foreground transition-colors px-3 py-2 text-xs tracking-wider focus:outline-none cursor-pointer"
              >
                <option value="active">Active (Visible)</option>
                <option value="draft">Draft (Hidden)</option>
                <option value="archived">Archived (Hidden)</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              {isEditMode && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 border border-border text-[9px] tracking-widest uppercase font-semibold py-3 hover:bg-neutral-50 smooth-hover"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={formLoading}
                className="flex-1 bg-foreground text-background border border-foreground text-[9px] tracking-widest uppercase font-semibold py-3 hover:bg-foreground/90 smooth-hover"
              >
                {formLoading ? "SAVING..." : isEditMode ? "SAVE CHANGES" : "ADD PRODUCT"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
