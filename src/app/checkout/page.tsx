"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CreditCard, ShoppingBag, ShieldCheck } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { supabase } from "@/lib/supabase";

interface Address {
  id: string;
  profile_id: string;
  label: string;
  first_name: string;
  last_name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
}

interface AppliedDiscount {
  id: string;
  code: string;
  type: string;
  value: string;
  amount: number;
}

export default function CheckoutPage() {
  const { cart, cartSubtotal, clearCart, userId } = useStore();
  const router = useRouter();

  // Shipping form fields
  const [shippingForm, setShippingForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Indonesia",
  });

  // Credit Card fields
  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    expMonth: "",
    expYear: "",
    cvv: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Saved addresses from DB
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);

  // Promo code states
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  function selectSavedAddress(addr: Address) {
    setShippingForm((prev) => ({
      ...prev,
      firstName: addr.first_name,
      lastName: addr.last_name,
      phone: addr.phone,
      addressLine1: addr.line1,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postal_code,
      country: addr.country,
    }));
  }

  // Fetch client shipping profile & addresses
  useEffect(() => {
    if (!userId) return;

    const loadUserData = async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profile) {
          setShippingForm((prev) => ({
            ...prev,
            firstName: profile.first_name || "",
            lastName: profile.last_name || "",
            email: profile.email || "",
            phone: profile.phone || "",
          }));
        }

        const { data: addrs } = await supabase
          .from("addresses")
          .select("*")
          .eq("profile_id", userId);

        if (addrs) {
          setSavedAddresses(addrs as Address[]);
          const defaultAddr = addrs.find((a) => a.is_default);
          if (defaultAddr) {
            selectSavedAddress(defaultAddr as Address);
          }
        }
      } catch (err) {
        console.warn("Failed to load user addresses:", err);
      }
    };

    loadUserData();
  }, [userId]);

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === "cardNumber") {
      const value = e.target.value.replace(/\D/g, "").substring(0, 16);
      const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
      setCardForm((prev) => ({ ...prev, cardNumber: formatted }));
    } else {
      setCardForm((prev) => ({ ...prev, [e.target.name]: e.target.value.replace(/\D/g, "") }));
    }
  };

  // Validate and apply promo code via Supabase
  const handleApplyPromo = async () => {
    setPromoError("");
    setPromoLoading(true);
    setAppliedDiscount(null);

    try {
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .eq("code", promoCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error("Invalid or inactive promotion code.");
      }

      const minAmount = parseFloat(data.min_order_amount || "0");
      if (cartSubtotal < minAmount) {
        throw new Error(`Minimum purchase of $${minAmount.toFixed(2)} required.`);
      }

      const now = new Date();
      if (data.active_from && new Date(data.active_from) > now) {
        throw new Error("Promotion not active yet.");
      }
      if (data.active_to && new Date(data.active_to) < now) {
        throw new Error("Promotion code expired.");
      }

      let discountVal = 0;
      if (data.type === "percentage") {
        discountVal = (cartSubtotal * parseFloat(data.value)) / 100;
      } else {
        discountVal = parseFloat(data.value);
      }

      discountVal = Math.min(discountVal, cartSubtotal);

      setAppliedDiscount({
        id: data.id,
        code: data.code,
        type: data.type,
        value: data.value,
        amount: discountVal,
      });
      setPromoCode("");
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : "Failed to apply code.");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "SB-Mid-client-your-sandbox-client-key";
    const rawCardNumber = cardForm.cardNumber.replace(/\s/g, "");

    if (!rawCardNumber.startsWith("4") && !/^5[1-5]/.test(rawCardNumber)) {
      setErrorMsg("We only accept Visa and Mastercard payments.");
      setLoading(false);
      return;
    }

    try {
      // 1. Obtain Client Token from Midtrans Tokenizer REST API
      const tokenUrl = `https://api.sandbox.midtrans.com/v2/token?client_key=${clientKey}&card_number=${rawCardNumber}&card_cvv=${cardForm.cvv}&card_exp_month=${cardForm.expMonth}&card_exp_year=${cardForm.expYear}`;
      
      const tokenRes = await fetch(tokenUrl, { method: "GET" });
      const tokenData = await tokenRes.json();

      if (tokenData.status_code !== "200" || !tokenData.token_id) {
        throw new Error(tokenData.status_message || "Failed to tokenize credit card. Check details.");
      }

      const cardTokenId = tokenData.token_id;
      const discountAmt = appliedDiscount ? appliedDiscount.amount : 0;
      const grandTotal = Math.max(0, cartSubtotal + 25 - discountAmt);

      // 2. Submit Charge payload to our Next.js API endpoint
      const chargeRes = await fetch("/api/checkout/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId: cardTokenId,
          amount: grandTotal,
          shipping: shippingForm,
          cartItems: cart,
          discountId: appliedDiscount?.id || null,
          discountAmount: discountAmt,
          profileId: userId || null,
        }),
      });

      const chargeData = await chargeRes.json();

      if (!chargeRes.ok) {
        throw new Error(chargeData.message || "Failed to place order.");
      }

      // 3. Clear cart
      clearCart();

      // 4. Handle 3D Secure OTP authentication redirect if returned by Midtrans
      if (chargeData.redirectUrl) {
        window.location.href = chargeData.redirectUrl;
      } else {
        router.push(`/checkout/payment?status=success&orderId=${chargeData.orderNumber}`);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "An error occurred while processing checkout.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-6 py-32 text-center space-y-6">
        <h2 className="font-serif text-3xl uppercase">Your Basket is Empty</h2>
        <p className="text-xs text-muted uppercase tracking-widest">
          Please add creations to your shopping bag before checking out.
        </p>
        <Link href="/shop" className="luxury-btn">
          RETURN TO SHOP
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-10 md:py-16">
      
      <div className="text-[9px] tracking-[0.25em] font-semibold text-muted uppercase mb-8">
        <Link href="/" className="hover:text-foreground smooth-hover">HOME</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">SECURE CHECKOUT</span>
      </div>

      <h1 className="font-serif text-3.5xl md:text-5.5xl tracking-tight uppercase mb-12">
        SECURE CHECKOUT
      </h1>

      <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* LEFT COLUMN: Input Forms (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-10">
          
          {/* Saved Address Book Select Dropdown */}
          {savedAddresses.length > 0 && (
            <div className="border border-border p-5 bg-neutral-50/30 space-y-2">
              <label className="text-[9px] tracking-[0.2em] font-bold text-foreground uppercase block">
                SELECT SAVED SHIPPING ADDRESS
              </label>
              <select
                onChange={(e) => {
                  const addr = savedAddresses.find((a) => a.id === e.target.value);
                  if (addr) selectSavedAddress(addr);
                }}
                className="w-full bg-background border border-border py-2 px-3 text-[10px] tracking-widest uppercase focus:outline-none focus:border-foreground"
              >
                <option value="">-- CHOOSE A SAVED ADDRESS --</option>
                {savedAddresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.label}: {addr.first_name} {addr.last_name} - {addr.line1}, {addr.city}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* A. Shipping address form */}
          <div className="space-y-6">
            <h3 className="text-xs tracking-[0.2em] font-bold text-foreground uppercase border-b border-border pb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full border border-foreground flex items-center justify-center text-[10px]">1</span>
              SHIPPING ADDRESS
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="firstName"
                required
                placeholder="FIRST NAME"
                value={shippingForm.firstName}
                onChange={handleShippingChange}
                className="w-full border-b border-border bg-transparent py-2.5 text-xs tracking-widest uppercase focus:outline-none focus:border-foreground"
              />
              <input
                type="text"
                name="lastName"
                required
                placeholder="LAST NAME"
                value={shippingForm.lastName}
                onChange={handleShippingChange}
                className="w-full border-b border-border bg-transparent py-2.5 text-xs tracking-widest uppercase focus:outline-none focus:border-foreground"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="email"
                name="email"
                required
                placeholder="EMAIL ADDRESS"
                value={shippingForm.email}
                onChange={handleShippingChange}
                className="w-full border-b border-border bg-transparent py-2.5 text-xs tracking-widest uppercase focus:outline-none focus:border-foreground"
              />
              <input
                type="tel"
                name="phone"
                required
                placeholder="PHONE NUMBER"
                value={shippingForm.phone}
                onChange={handleShippingChange}
                className="w-full border-b border-border bg-transparent py-2.5 text-xs tracking-widest uppercase focus:outline-none focus:border-foreground"
              />
            </div>

            <input
              type="text"
              name="addressLine1"
              required
              placeholder="ADDRESS LINE 1"
              value={shippingForm.addressLine1}
              onChange={handleShippingChange}
              className="w-full border-b border-border bg-transparent py-2.5 text-xs tracking-widest uppercase focus:outline-none focus:border-foreground"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                name="city"
                required
                placeholder="CITY"
                value={shippingForm.city}
                onChange={handleShippingChange}
                className="w-full border-b border-border bg-transparent py-2.5 text-xs tracking-widest uppercase focus:outline-none focus:border-foreground"
              />
              <input
                type="text"
                name="state"
                required
                placeholder="STATE / PROVINCE"
                value={shippingForm.state}
                onChange={handleShippingChange}
                className="w-full border-b border-border bg-transparent py-2.5 text-xs tracking-widest uppercase focus:outline-none focus:border-foreground"
              />
              <input
                type="text"
                name="postalCode"
                required
                placeholder="POSTAL CODE"
                value={shippingForm.postalCode}
                onChange={handleShippingChange}
                className="w-full border-b border-border bg-transparent py-2.5 text-xs tracking-widest uppercase focus:outline-none focus:border-foreground"
              />
            </div>
          </div>

          {/* B. Credit Card Details */}
          <div className="space-y-6">
            <h3 className="text-xs tracking-[0.2em] font-bold text-foreground uppercase border-b border-border pb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full border border-foreground flex items-center justify-center text-[10px]">2</span>
              PAYMENT METHOD (VISA & MASTERCARD ONLY)
            </h3>

            <div className="border border-border p-5 bg-neutral-50/50 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-[10px] tracking-widest font-semibold flex items-center gap-2 text-foreground">
                  <CreditCard size={15} />
                  CREDIT OR DEBIT CARD
                </span>
                <span className="text-[9px] tracking-widest text-muted">SECURED BY MIDTRANS</span>
              </div>

              {/* Card Inputs */}
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    name="cardNumber"
                    required
                    placeholder="CARD NUMBER (VISA/MASTERCARD)"
                    value={cardForm.cardNumber}
                    onChange={handleCardChange}
                    className="w-full border-b border-border bg-transparent py-2.5 text-xs tracking-widest uppercase focus:outline-none focus:border-foreground pr-10"
                  />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-1">
                    <span className="text-[9px] border border-border px-1 py-0.5 rounded font-mono text-muted">VISA</span>
                    <span className="text-[9px] border border-border px-1 py-0.5 rounded font-mono text-muted">MC</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="text"
                    name="expMonth"
                    required
                    maxLength={2}
                    placeholder="EXP MONTH (MM)"
                    value={cardForm.expMonth}
                    onChange={handleCardChange}
                    className="w-full border-b border-border bg-transparent py-2.5 text-xs tracking-widest uppercase focus:outline-none focus:border-foreground"
                  />
                  <input
                    type="text"
                    name="expYear"
                    required
                    maxLength={4}
                    placeholder="EXP YEAR (YYYY)"
                    value={cardForm.expYear}
                    onChange={handleCardChange}
                    className="w-full border-b border-border bg-transparent py-2.5 text-xs tracking-widest uppercase focus:outline-none focus:border-foreground"
                  />
                  <input
                    type="password"
                    name="cvv"
                    required
                    maxLength={3}
                    placeholder="CVV"
                    value={cardForm.cvv}
                    onChange={handleCardChange}
                    className="w-full border-b border-border bg-transparent py-2.5 text-xs tracking-widest uppercase focus:outline-none focus:border-foreground"
                  />
                </div>
              </div>

              {/* Card Security Assurance */}
              <div className="flex items-center gap-2 pt-2 text-[10px] text-muted tracking-wider">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>Card data is tokenized directly on Sandbox API servers.</span>
              </div>
            </div>
          </div>

          {/* Validation Alert */}
          {errorMsg && (
            <div className="bg-red-50 text-red-700 text-xs tracking-widest p-4 uppercase border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* Checkout CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full luxury-btn-dark py-4 text-center text-xs font-bold tracking-[0.2em] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:border-neutral-200 disabled:cursor-not-allowed uppercase"
          >
            {loading ? "PROCESSING TRANSACTION..." : `AUTHORIZE PAYMENT & PLACE ORDER`}
          </button>

        </div>

        {/* RIGHT COLUMN: Order summary (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-neutral-50/50 border border-border p-6 md:p-8 space-y-6 sticky top-28">
          <h3 className="text-xs tracking-[0.2em] font-bold text-foreground uppercase border-b border-border pb-3 flex items-center gap-2">
            <ShoppingBag size={14} />
            ORDER SUMMARY
          </h3>

          {/* Cart Products loop */}
          <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2 no-scrollbar border-b border-border/60 pb-4">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-4 items-center">
                <div className="relative w-12 h-16 border border-border bg-neutral-100 shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-grow">
                  <h4 className="text-[10px] tracking-widest font-semibold uppercase line-clamp-1">{item.name}</h4>
                  <p className="text-[9px] tracking-wider text-muted uppercase mt-0.5">
                    Qty: {item.quantity} / Size: {item.size}
                  </p>
                </div>
                <span className="text-[10px] tracking-wider font-semibold">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Promo code entry */}
          <div className="space-y-2">
            <label className="text-[9px] tracking-[0.25em] font-bold text-muted uppercase block">
              HAVE A PROMOTIONAL CODE?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ENTER CODE"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-grow border-b border-border bg-transparent py-1.5 text-xs tracking-widest uppercase focus:outline-none focus:border-foreground"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={promoLoading || !promoCode}
                className="border border-foreground text-[10px] tracking-widest font-semibold uppercase px-4 py-1.5 hover:bg-foreground hover:text-background transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {promoLoading ? "..." : "APPLY"}
              </button>
            </div>
            {promoError && (
              <p className="text-[9px] tracking-wider text-red-500 uppercase pt-0.5 font-medium">{promoError}</p>
            )}
            {appliedDiscount && (
              <div className="bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-[9px] tracking-widest p-2.5 uppercase flex justify-between items-center mt-2">
                <span className="font-semibold">CODE &quot;{appliedDiscount.code}&quot; APPLIED</span>
                <span className="font-bold">-${appliedDiscount.amount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Toggles subtotal fees */}
          <div className="border-t border-border pt-4 space-y-2.5 text-[10px] tracking-widest">
            <div className="flex justify-between text-muted uppercase">
              <span>BAG SUBTOTAL</span>
              <span className="font-semibold text-foreground">${cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted uppercase">
              <span>SHIPPING FEE</span>
              <span className="font-semibold text-foreground">$25.00</span>
            </div>
            {appliedDiscount && (
              <div className="flex justify-between text-emerald-600 uppercase font-semibold">
                <span>DEDUCT DISCOUNT</span>
                <span>-${appliedDiscount.amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted uppercase">
              <span>TAXES</span>
              <span className="font-semibold text-foreground">$0.00</span>
            </div>
            
            {/* Total */}
            <div className="flex justify-between items-end border-t border-border pt-4 text-xs font-bold text-foreground uppercase">
              <span>GRAND TOTAL</span>
              <span className="text-base font-semibold tracking-normal">
                ${Math.max(0, cartSubtotal + 25 - (appliedDiscount ? appliedDiscount.amount : 0)).toFixed(2)}
              </span>
            </div>
          </div>

        </div>

      </form>

    </div>
  );
}
