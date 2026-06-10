"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

export default function ContactPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"IDLE" | "LOADING" | "SUCCESS" | "ERROR">("IDLE");
  const [errorMessage, setErrorMessage] = useState("");

  const formspreeEndpoint =
    process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT || "https://formspree.io/f/xanyevzw"; // Default test placeholder or client endpoint

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) {
      setErrorMessage("Both email and message fields are required.");
      setStatus("ERROR");
      return;
    }

    setStatus("LOADING");
    setErrorMessage("");

    try {
      const response = await fetch(formspreeEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, message }),
      });

      if (response.ok) {
        setStatus("SUCCESS");
        setEmail("");
        setMessage("");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Submission failed. Please try again later.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect to Formspree.";
      setErrorMessage(msg);
      setStatus("ERROR");
    }
  };

  return (
    <div className="w-full bg-background min-h-screen py-16 px-6 md:px-12 max-w-[1440px] mx-auto flex flex-col justify-center items-center">
      <div className="w-full max-w-lg space-y-10">
        
        {/* Title */}
        <div className="text-center space-y-3">
          <span className="text-[10px] tracking-[0.4em] font-bold text-muted uppercase">
            CONCIERGE & SUPPORT
          </span>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight uppercase text-foreground">
            CONTACT US
          </h1>
          <div className="h-[1px] w-12 bg-border mx-auto my-4" />
          <p className="text-xs text-muted leading-relaxed max-w-sm mx-auto">
            Please submit your inquiry below. Our atelier team will respond to your registered email address within 24 business hours.
          </p>
        </div>

        {/* Status Alerts */}
        {status === "SUCCESS" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-foreground bg-foreground text-background text-xs py-3 px-4 uppercase tracking-widest text-center"
          >
            Thank you. Your message has been transmitted successfully.
          </motion.div>
        )}

        {status === "ERROR" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-red-200 bg-red-50 text-red-700 text-xs py-3 px-4 uppercase tracking-widest text-center"
          >
            {errorMessage}
          </motion.div>
        )}

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="text-[9px] tracking-[0.25em] font-bold text-muted uppercase block"
            >
              EMAIL ADDRESS
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="YOUR.EMAIL@DOMAIN.COM"
              className="w-full bg-transparent text-foreground border border-border focus:border-foreground transition-colors px-4 py-3 text-xs tracking-wider uppercase focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="message"
              className="text-[9px] tracking-[0.25em] font-bold text-muted uppercase block"
            >
              MESSAGE
            </label>
            <textarea
              id="message"
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="HOW CAN WE ASSIST YOU?"
              className="w-full bg-transparent text-foreground border border-border focus:border-foreground transition-colors px-4 py-3 text-xs tracking-wider uppercase focus:outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={status === "LOADING"}
            className="w-full luxury-btn-dark py-4 text-[10px] font-semibold tracking-[0.2em] uppercase disabled:bg-neutral-200 disabled:text-neutral-400 disabled:border-neutral-200 disabled:cursor-not-allowed transition-colors"
          >
            {status === "LOADING" ? "TRANSMITTING..." : "SUBMIT INQUIRY"}
          </button>
        </form>

      </div>
    </div>
  );
}
