"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If user is already authenticated, send directly to /admin
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/admin");
      }
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/admin");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-background min-h-screen py-16 px-6 md:px-12 max-w-[1440px] mx-auto flex flex-col justify-center items-center">
      <div className="w-full max-w-sm space-y-8">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <span className="text-[10px] tracking-[0.4em] font-bold text-muted uppercase">
            SECURE ENTRY
          </span>
          <h1 className="font-serif text-3xl md:text-4xl tracking-tight uppercase text-foreground">
            ADMIN PORTAL
          </h1>
          <div className="h-[1px] w-12 bg-border mx-auto my-3" />
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-red-200 bg-red-50 text-red-700 text-xs py-3 px-4 uppercase tracking-widest text-center"
          >
            {errorMsg}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="text-[9px] tracking-[0.25em] font-bold text-muted uppercase block"
            >
              ADMIN EMAIL
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ADMIN@FRACTALS.STUDIO"
              className="w-full bg-transparent text-foreground border border-border focus:border-foreground transition-colors px-4 py-3 text-xs tracking-wider uppercase focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-[9px] tracking-[0.25em] font-bold text-muted uppercase block"
            >
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-transparent text-foreground border border-border focus:border-foreground transition-colors px-4 py-3 text-xs tracking-wider uppercase focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full luxury-btn-dark py-4 text-[10px] font-semibold tracking-[0.2em] uppercase disabled:bg-neutral-200 disabled:text-neutral-400 disabled:border-neutral-200 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "AUTHENTICATING..." : "ENTER PORTAL"}
          </button>
        </form>

      </div>
    </div>
  );
}
