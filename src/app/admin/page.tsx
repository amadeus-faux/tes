"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  LogOut, Plus, Trash2, Edit3, X, UploadCloud,
  ShoppingBag, Package, User, MapPin, CreditCard,
  RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  variant_name: string;
  product_name: string;
  variant_id: string;
  product_variants?: {
    size: string;
    color: string;
    product_id: string;
    products?: {
      images: string[];
      name: string;
    };
  };
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  shipping_address: Record<string, string>;
  created_at: string;
  profile_id: string | null;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  order_items: OrderItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AVAILABLE_SIZES = ["38", "39", "40", "41", "OS", "6", "7", "S", "M", "L", "XL"];

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-amber-50 text-amber-700 border-amber-200",
  confirmed:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  shipped:    "bg-violet-50 text-violet-700 border-violet-200",
  delivered:  "bg-emerald-50 text-emerald-800 border-emerald-300",
  cancelled:  "bg-red-50 text-red-700 border-red-200",
  refunded:   "bg-neutral-100 text-neutral-600 border-neutral-300",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAddress(addr: Record<string, string>): string {
  if (!addr) return "—";
  const parts = [
    addr.addressLine1,
    addr.city,
    addr.state,
    addr.postalCode,
    addr.country,
  ].filter(Boolean);
  return parts.join(", ");
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);

  // ── Products state ──
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Orders state ──
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // ── Active tab ──
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");

  // ── Form states ──
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [status, setStatus] = useState<"active" | "draft" | "archived">("active");

  // ── Image upload states (replaces image1/image2 URL inputs) ──
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  // Existing images from DB (shown in edit mode before new upload)
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // ─── Auth check ───────────────────────────────────────────────────────────

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/fractals-admin-login");
      } else {
        setCheckingAuth(false);
        fetchProducts();
        fetchOrders();
      }
    };
    checkUser();
  }, [router]);

  // ─── Data fetchers ────────────────────────────────────────────────────────

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) {
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

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // ─── Logout ───────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/fractals-admin-login");
  };

  // ─── Form reset ───────────────────────────────────────────────────────────

  const resetForm = () => {
    setIsEditMode(false);
    setCurrentId(null);
    setName("");
    setSlug("");
    setDescription("");
    setPrice("");
    setStock("");
    setCategory("");
    setSizes([]);
    setStatus("active");
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setFormError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Image file picker handler ────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Append new files to existing selection (support multiple picks)
    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    // Generate object URL previews for each file
    const previews = newFiles.map((f) => URL.createObjectURL(f));
    setImagePreviews(previews);
  };

  const removeImageFile = (index: number) => {
    const updatedFiles = imageFiles.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(updatedFiles);
    setImagePreviews(updatedPreviews);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Upload images to Supabase Storage ───────────────────────────────────

  const uploadImages = async (productSlug: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of imageFiles) {
      const ext = file.name.split(".").pop();
      const fileName = `${productSlug}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrlData.publicUrl);
    }

    return uploadedUrls;
  };

  // ─── Sizes ───────────────────────────────────────────────────────────────

  const handleSizeToggle = (size: string) => {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // ─── Edit click ───────────────────────────────────────────────────────────

  const handleEditClick = (p: Product) => {
    setIsEditMode(true);
    setCurrentId(p.id);
    setName(p.name);
    setSlug(p.slug);
    setDescription(p.description || "");
    setPrice(p.price.toString());
    setStock(p.stock.toString());
    setCategory(p.category || "");
    setSizes(p.sizes || []);
    setStatus(p.status || "active");
    // Load existing images from DB (shown as current)
    setExistingImages(p.images || []);
    setImageFiles([]);
    setImagePreviews([]);
    setFormError("");
  };

  // ─── Form submit ──────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    // Validation
    if (!name || !slug || !price || !stock || !category) {
      setFormError("Name, slug, price, stock, and category are required.");
      setFormLoading(false);
      return;
    }

    // Must have at least 1 image (either existing or new upload)
    if (existingImages.length === 0 && imageFiles.length === 0) {
      setFormError("Please upload at least one product image.");
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

    try {
      // 1. Upload new image files to Storage
      let newUploadedUrls: string[] = [];
      if (imageFiles.length > 0) {
        newUploadedUrls = await uploadImages(slug);
      }

      // 2. Compose final images array:
      //    existing retained images + newly uploaded images
      const finalImages = [...existingImages, ...newUploadedUrls];

      // ── Hover image fallback logic (no separate input needed) ──
      // imagesArray[0] = primary image
      // imagesArray[1] = hover image:
      //   - if only 1 image → same as primary (auto-fallback)
      //   - if >1 images → imagesArray[1] (already in array from upload)
      // This is already handled by ProductCard.tsx:
      //   const hoverImage = product.images[1] || product.images[0];
      // So we just need to pass finalImages as-is.

      if (isEditMode && currentId) {
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
            images: finalImages,
            category,
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentId);

        if (pError) throw pError;

        // Refresh variants/inventory
        await supabase.from("product_variants").delete().eq("product_id", currentId);

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
            await supabase.from("inventory").insert({
              variant_id: vData.id,
              stock_quantity: stockPerSize,
            });
          }
        }
      } else {
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
            images: finalImages,
            category,
            status,
          })
          .select()
          .single();

        if (pError) throw pError;

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
            await supabase.from("inventory").insert({
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

  // ─── Delete product ───────────────────────────────────────────────────────

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

  // ─── Orders helpers ───────────────────────────────────────────────────────

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  // ─── Auth guard ───────────────────────────────────────────────────────────

  if (checkingAuth) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-background">
        <span className="font-serif italic text-lg animate-pulse text-muted">Verification...</span>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full bg-background min-h-screen py-10 px-6 md:px-12 max-w-[1440px] mx-auto space-y-8">

      {/* ── Header ── */}
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

      {/* ── Tab Navigation ── */}
      <div className="flex gap-0 border-b border-border">
        <button
          onClick={() => setActiveTab("products")}
          className={`px-6 py-3 text-[10px] tracking-[0.2em] font-bold uppercase border-b-2 transition-colors ${
            activeTab === "products"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <Package size={11} />
            Products ({products.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-6 py-3 text-[10px] tracking-[0.2em] font-bold uppercase border-b-2 transition-colors ${
            activeTab === "orders"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <ShoppingBag size={11} />
            Orders ({orders.length})
          </span>
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* PRODUCTS TAB                                                 */}
      {/* ════════════════════════════════════════════════════════════ */}
      {activeTab === "products" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* Left: Product List */}
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
                  <Plus size={10} /> Add New
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-20 text-xs text-muted tracking-widest uppercase">
                Retrieving creations...
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border text-xs text-muted tracking-widest uppercase">
                No products in archive.
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
                          NO IMG
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
                          {p.category} | {p.slug}
                        </p>
                        <p className="text-[9px] text-muted mt-1">
                          {p.images.length} image{p.images.length !== 1 ? "s" : ""}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 items-center justify-between mt-2 pt-2 border-t border-neutral-100">
                        <div className="flex gap-4 text-[10px]">
                          <span>PRICE: <strong>${p.price.toFixed(2)}</strong></span>
                          <span>STOCK: <strong>{p.stock}</strong></span>
                          <span>SIZES: <strong>{p.sizes.join(", ") || "OS"}</strong></span>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEditClick(p)}
                            className="hover:text-foreground text-neutral-400 p-1 smooth-hover"
                            title="Edit"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="hover:text-red-600 text-neutral-400 p-1 smooth-hover"
                            title="Delete"
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

          {/* Right: Manage Form */}
          <div className="lg:col-span-5 bg-white border border-border p-6 space-y-5 sticky top-8">
            <div className="border-b border-border pb-4">
              <h2 className="text-xs tracking-[0.2em] font-bold uppercase text-foreground">
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

              {/* Name + Slug */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] tracking-[0.2em] font-bold text-muted uppercase block">Product Name</label>
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
                    className="w-full bg-transparent border border-border focus:border-foreground px-3 py-2 text-xs tracking-wider uppercase focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] tracking-[0.2em] font-bold text-muted uppercase block">Slug</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ""))}
                    placeholder="silk-shirt"
                    className="w-full bg-transparent border border-border focus:border-foreground px-3 py-2 text-xs tracking-wider focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[8px] tracking-[0.2em] font-bold text-muted uppercase block">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Garment specifications and details"
                  className="w-full bg-transparent border border-border focus:border-foreground px-3 py-2 text-xs tracking-wider focus:outline-none resize-none"
                />
              </div>

              {/* Price / Stock / Category */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] tracking-[0.2em] font-bold text-muted uppercase block">Price ($)</label>
                  <input
                    type="number" step="0.01" required value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="1250.00"
                    className="w-full bg-transparent border border-border focus:border-foreground px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] tracking-[0.2em] font-bold text-muted uppercase block">Stock</label>
                  <input
                    type="number" required value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="20"
                    className="w-full bg-transparent border border-border focus:border-foreground px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] tracking-[0.2em] font-bold text-muted uppercase block">Category</label>
                  <input
                    type="text" required value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Shoes"
                    className="w-full bg-transparent border border-border focus:border-foreground px-3 py-2 text-xs uppercase focus:outline-none"
                  />
                </div>
              </div>

              {/* ── Image Upload Section (replaces URL inputs) ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[8px] tracking-[0.2em] font-bold text-muted uppercase block">
                    Product Images
                  </label>
                  <span className="text-[7px] tracking-wider text-muted uppercase">
                    {existingImages.length + imageFiles.length} selected
                    {existingImages.length + imageFiles.length > 1 && " · hover = image[1]"}
                  </span>
                </div>

                {/* File picker dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-foreground/50 transition-colors cursor-pointer p-5 flex flex-col items-center gap-2 bg-neutral-50/50"
                >
                  <UploadCloud size={20} className="text-muted" />
                  <p className="text-[9px] tracking-widest text-muted uppercase text-center">
                    Click to select images
                    <br />
                    <span className="text-[8px]">JPG, PNG, WEBP · Multiple files supported</span>
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />

                {/* Hover image fallback info */}
                <p className="text-[8px] text-muted tracking-wider uppercase leading-relaxed">
                  ℹ Hover image: auto-set to image[1] if multiple, or image[0] if only one uploaded.
                </p>

                {/* Existing images (edit mode) */}
                {existingImages.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[8px] tracking-wider text-muted uppercase font-semibold">Current Images:</p>
                    <div className="flex flex-wrap gap-2">
                      {existingImages.map((url, i) => (
                        <div key={url} className="relative group/thumb w-14 h-14 border border-border bg-neutral-100 overflow-hidden shrink-0">
                          <Image src={url} alt={`img-${i}`} fill className="object-cover" />
                          {i === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[6px] text-center py-0.5 uppercase tracking-wider">
                              Primary
                            </span>
                          )}
                          {i === 1 && (
                            <span className="absolute bottom-0 left-0 right-0 bg-indigo-600/80 text-white text-[6px] text-center py-0.5 uppercase tracking-wider">
                              Hover
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeExistingImage(i)}
                            className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                            title="Remove"
                          >
                            <X size={8} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New file previews */}
                {imagePreviews.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[8px] tracking-wider text-muted uppercase font-semibold">
                      New Uploads ({imagePreviews.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {imagePreviews.map((src, i) => {
                        const absoluteIndex = existingImages.length + i;
                        return (
                          <div key={src} className="relative group/thumb w-14 h-14 border border-border bg-neutral-100 overflow-hidden shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={`preview-${i}`} className="w-full h-full object-cover" />
                            {absoluteIndex === 0 && (
                              <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[6px] text-center py-0.5 uppercase tracking-wider">
                                Primary
                              </span>
                            )}
                            {absoluteIndex === 1 && (
                              <span className="absolute bottom-0 left-0 right-0 bg-indigo-600/80 text-white text-[6px] text-center py-0.5 uppercase tracking-wider">
                                Hover
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImageFile(i)}
                              className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                              title="Remove"
                            >
                              <X size={8} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[7px] text-muted tracking-wider uppercase">
                      Images will be uploaded to Supabase Storage upon save.
                    </p>
                  </div>
                )}
              </div>

              {/* Sizes */}
              <div className="space-y-2">
                <span className="text-[8px] tracking-[0.2em] font-bold text-muted uppercase block">Available Sizes</span>
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

              {/* Status */}
              <div className="space-y-1">
                <label className="text-[8px] tracking-[0.2em] font-bold text-muted uppercase block">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-transparent border border-border focus:border-foreground px-3 py-2 text-xs tracking-wider focus:outline-none cursor-pointer"
                >
                  <option value="active">Active (Visible)</option>
                  <option value="draft">Draft (Hidden)</option>
                  <option value="archived">Archived (Hidden)</option>
                </select>
              </div>

              {/* Action buttons */}
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
                  className="flex-1 bg-foreground text-background border border-foreground text-[9px] tracking-widest uppercase font-semibold py-3 hover:bg-foreground/90 smooth-hover disabled:opacity-60"
                >
                  {formLoading ? "SAVING..." : isEditMode ? "SAVE CHANGES" : "ADD PRODUCT"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ORDERS TAB                                                   */}
      {/* ════════════════════════════════════════════════════════════ */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xs tracking-[0.2em] font-bold uppercase text-foreground">
              INCOMING ORDERS ({orders.length})
            </h2>
            <button
              onClick={fetchOrders}
              disabled={ordersLoading}
              className="flex items-center gap-2 border border-border px-4 py-2 text-[10px] tracking-wider uppercase font-semibold hover:border-foreground smooth-hover disabled:opacity-50"
            >
              <RefreshCw size={11} className={ordersLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {ordersLoading ? (
            <div className="text-center py-24 text-xs text-muted tracking-widest uppercase">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-border text-xs text-muted tracking-widest uppercase">
              No orders received yet.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isExpanded = expandedOrders.has(order.id);
                const addr = order.shipping_address || {};
                const buyer = order.profiles;
                const buyerName = buyer
                  ? `${buyer.first_name || ""} ${buyer.last_name || ""}`.trim()
                  : addr.firstName
                  ? `${addr.firstName} ${addr.lastName || ""}`.trim()
                  : "Guest";

                return (
                  <div
                    key={order.id}
                    className="border border-border bg-white overflow-hidden"
                  >
                    {/* ── Order Header Row ── */}
                    <div
                      className="flex flex-wrap items-center gap-4 px-5 py-4 cursor-pointer hover:bg-neutral-50/60 transition-colors select-none"
                      onClick={() => toggleOrderExpand(order.id)}
                    >
                      {/* Order number + date */}
                      <div className="min-w-[160px]">
                        <p className="text-[9px] tracking-widest font-bold text-foreground uppercase">
                          #{order.order_number}
                        </p>
                        <p className="text-[8px] text-muted tracking-wider mt-0.5">
                          {new Date(order.created_at).toLocaleDateString("en-US", {
                            year: "numeric", month: "short", day: "numeric",
                          })}
                        </p>
                      </div>

                      {/* Buyer name */}
                      <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
                        <User size={10} className="text-muted shrink-0" />
                        <span className="text-[10px] font-semibold tracking-wider text-foreground uppercase truncate">
                          {buyerName}
                        </span>
                      </div>

                      {/* Items count */}
                      <div className="text-[9px] text-muted tracking-wider uppercase">
                        {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? "s" : ""}
                      </div>

                      {/* Total */}
                      <div className="text-right min-w-[80px]">
                        <span className="text-xs font-bold tracking-wider text-foreground">
                          ${parseFloat(order.total as any).toFixed(2)}
                        </span>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`text-[8px] tracking-widest font-bold uppercase border px-2 py-1 ${
                          STATUS_COLORS[order.status] || "bg-neutral-50 text-muted border-border"
                        }`}
                      >
                        {order.status}
                      </span>

                      {/* Expand toggle */}
                      <div className="text-muted ml-auto">
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </div>
                    </div>

                    {/* ── Expanded Detail Panel ── */}
                    {isExpanded && (
                      <div className="border-t border-border px-5 py-5 grid grid-cols-1 md:grid-cols-3 gap-6 bg-neutral-50/30">

                        {/* Column 1: Products */}
                        <div className="space-y-3">
                          <h4 className="text-[8px] tracking-[0.25em] font-bold text-muted uppercase flex items-center gap-1.5 border-b border-border/60 pb-2">
                            <Package size={9} /> Products Ordered
                          </h4>
                          <div className="space-y-3">
                            {(order.order_items || []).map((item) => {
                              const productImages = item.product_variants?.products?.images;
                              const thumbSrc = productImages?.[0];

                              return (
                                <div key={item.id} className="flex gap-3 items-center">
                                  {/* Thumbnail */}
                                  <div className="relative w-10 h-12 shrink-0 bg-neutral-200 border border-border overflow-hidden">
                                    {thumbSrc ? (
                                      <Image
                                        src={thumbSrc}
                                        alt={item.product_name}
                                        fill
                                        className="object-cover"
                                        sizes="40px"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[6px] text-muted">
                                        —
                                      </div>
                                    )}
                                  </div>
                                  {/* Info */}
                                  <div>
                                    <p className="text-[9px] font-semibold tracking-wider text-foreground uppercase line-clamp-1">
                                      {item.product_name}
                                    </p>
                                    <p className="text-[8px] text-muted tracking-wider uppercase mt-0.5">
                                      Size: {item.product_variants?.size || item.variant_name} · Qty: {item.quantity}
                                    </p>
                                    <p className="text-[8px] text-foreground font-semibold tracking-wider mt-0.5">
                                      ${parseFloat(item.unit_price as any).toFixed(2)} ea.
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Column 2: Buyer + Shipping */}
                        <div className="space-y-4">
                          {/* Buyer identity */}
                          <div className="space-y-2">
                            <h4 className="text-[8px] tracking-[0.25em] font-bold text-muted uppercase flex items-center gap-1.5 border-b border-border/60 pb-2">
                              <User size={9} /> Buyer Details
                            </h4>
                            <div className="space-y-1 text-[9px] tracking-wider">
                              <p className="font-semibold text-foreground uppercase">{buyerName}</p>
                              <p className="text-muted">
                                📧 {buyer?.email || addr.email || "—"}
                              </p>
                              <p className="text-muted">
                                📞 {buyer?.phone || addr.phone || "—"}
                              </p>
                            </div>
                          </div>

                          {/* Shipping address */}
                          <div className="space-y-2">
                            <h4 className="text-[8px] tracking-[0.25em] font-bold text-muted uppercase flex items-center gap-1.5 border-b border-border/60 pb-2">
                              <MapPin size={9} /> Shipping Address
                            </h4>
                            <p className="text-[9px] tracking-wider text-foreground leading-relaxed">
                              {formatAddress(addr)}
                            </p>
                          </div>
                        </div>

                        {/* Column 3: Payment Summary */}
                        <div className="space-y-3">
                          <h4 className="text-[8px] tracking-[0.25em] font-bold text-muted uppercase flex items-center gap-1.5 border-b border-border/60 pb-2">
                            <CreditCard size={9} /> Payment Summary
                          </h4>
                          <div className="space-y-1.5 text-[9px] tracking-wider">
                            <div className="flex justify-between text-muted">
                              <span>Subtotal</span>
                              <span>${parseFloat(order.subtotal as any).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-muted">
                              <span>Shipping</span>
                              <span>${parseFloat(order.shipping_cost as any).toFixed(2)}</span>
                            </div>
                            {parseFloat(order.discount_amount as any) > 0 && (
                              <div className="flex justify-between text-emerald-600">
                                <span>Discount</span>
                                <span>-${parseFloat(order.discount_amount as any).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-foreground border-t border-border pt-2 mt-1 text-[10px]">
                              <span>TOTAL</span>
                              <span>${parseFloat(order.total as any).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
