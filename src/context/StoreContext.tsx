"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface CartItem {
  id: string; // unique cart item identifier (usually variant_id)
  productId: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  sku: string;
}

interface StoreContextType {
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  userId: string | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Monitor auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
      if (!session) {
        // Clear authenticated state on logout
        setCart([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load guest cart from LocalStorage on mount
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem("fractals_cart");
      setTimeout(() => {
        if (storedCart) setCart(JSON.parse(storedCart));
        setIsHydrated(true);
      }, 0);
    } catch (e) {
      console.error("Failed to load local storage state:", e);
      setTimeout(() => setIsHydrated(true), 0);
    }
  }, []);

  // Save guest cart to LocalStorage when changed
  useEffect(() => {
    if (!isHydrated || userId) return;
    localStorage.setItem("fractals_cart", JSON.stringify(cart));
  }, [cart, isHydrated, userId]);

  // Sync state with Supabase DB when user logs in
  useEffect(() => {
    if (!userId) return;

    const syncOnLogin = async () => {
      try {
        const cartId = await getOrCreateDbCartId(userId);
        if (!cartId) return;

        // 1. If guest has local items, upsert them to database
        const storedCart = localStorage.getItem("fractals_cart");
        if (storedCart) {
          const localItems: CartItem[] = JSON.parse(storedCart);
          if (localItems.length > 0) {
            const upsertItems = localItems.map((item) => ({
              cart_id: cartId,
              variant_id: item.id,
              quantity: item.quantity,
            }));

            await supabase
              .from("cart_items")
              .upsert(upsertItems, { onConflict: "cart_id,variant_id" });
            
            // Clear local storage guest cart after sync
            localStorage.removeItem("fractals_cart");
          }
        }

        // 2. Fetch complete merged cart from database
        await fetchDbCart(cartId);
      } catch (err) {
        console.error("Error syncing state with Supabase:", err);
      }
    };

    syncOnLogin();
  }, [userId]);

  async function getOrCreateDbCartId(uid: string): Promise<string | null> {
    try {
      const { data: existingCart } = await supabase
        .from("carts")
        .select("id")
        .eq("profile_id", uid)
        .maybeSingle();

      if (existingCart?.id) return existingCart.id;

      const { data: newCart, error } = await supabase
        .from("carts")
        .insert({ profile_id: uid })
        .select()
        .single();

      if (error) throw error;
      return newCart?.id || null;
    } catch (e) {
      console.error("Failed to get or create DB cart:", e);
      return null;
    }
  }

  async function fetchDbCart(cartId: string) {
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          quantity,
          product_variants (
            id,
            name,
            sku,
            size,
            color,
            price_override,
            product_id,
            products (
              id,
              name,
              base_price,
              images,
              category
            )
          )
        `)
        .eq("cart_id", cartId);

      if (error) throw error;

      if (data) {
        interface DbCartItemResponse {
          quantity: number;
          product_variants: {
            id: string;
            name: string;
            sku: string;
            size: string | null;
            color: string | null;
            price_override: string | null;
            product_id: string;
            products: {
              id: string;
              name: string;
              base_price: string | number;
              images: string[];
              category: string;
            };
          };
        }

        const dbCart: CartItem[] = (data as unknown as DbCartItemResponse[])
          .filter((item) => item.product_variants && item.product_variants.products)
          .map((item) => {
            const variant = item.product_variants;
            const product = variant.products;
            const price = variant.price_override
              ? parseFloat(variant.price_override)
              : parseFloat(product.base_price as string);

            return {
              id: variant.id,
              productId: product.id,
              name: product.name,
              price: price,
              image: product.images[0] || "",
              size: variant.size || "OS",
              color: variant.color || "None",
              quantity: item.quantity,
              sku: variant.sku,
            };
          });
        setCart(dbCart);
      }
    } catch (e) {
      console.error("Failed to fetch DB cart:", e);
    }
  }

  const addToCart = async (newItem: Omit<CartItem, "quantity">, qty = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === newItem.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += qty;
        return updated;
      }
      return [...prevCart, { ...newItem, quantity: qty }];
    });
    setCartOpen(true); // Automatically slide open cart drawer

    if (userId) {
      const cartId = await getOrCreateDbCartId(userId);
      if (cartId) {
        const { data: existingItem } = await supabase
          .from("cart_items")
          .select("quantity")
          .eq("cart_id", cartId)
          .eq("variant_id", newItem.id)
          .maybeSingle();

        const newQty = (existingItem?.quantity || 0) + qty;
        await supabase
          .from("cart_items")
          .upsert({ cart_id: cartId, variant_id: newItem.id, quantity: newQty }, { onConflict: "cart_id,variant_id" });
      }
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== cartItemId));

    if (userId) {
      const cartId = await getOrCreateDbCartId(userId);
      if (cartId) {
        await supabase
          .from("cart_items")
          .delete()
          .eq("cart_id", cartId)
          .eq("variant_id", cartItemId);
      }
    }
  };

  const updateCartQuantity = async (cartItemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === cartItemId ? { ...item, quantity: qty } : item))
    );

    if (userId) {
      const cartId = await getOrCreateDbCartId(userId);
      if (cartId) {
        await supabase
          .from("cart_items")
          .update({ quantity: qty })
          .eq("cart_id", cartId)
          .eq("variant_id", cartItemId);
      }
    }
  };

  const clearCart = async () => {
    setCart([]);
    if (userId) {
      const cartId = await getOrCreateDbCartId(userId);
      if (cartId) {
        await supabase
          .from("cart_items")
          .delete()
          .eq("cart_id", cartId);
      }
    }
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        cart,
        cartOpen,
        setCartOpen,
        menuOpen,
        setMenuOpen,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        userId,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
