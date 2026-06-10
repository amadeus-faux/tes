"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";

function PaymentResultContent() {
  const searchParams = useSearchParams();

  // Extract return parameters from Midtrans redirection
  const orderId = searchParams.get("order_id") || searchParams.get("orderId") || "N/A";
  const statusCode = searchParams.get("status_code");
  const transactionStatus = searchParams.get("transaction_status") || searchParams.get("status");

  // Determine state
  // success conditions: code 200, or status 'settlement' / 'capture' / 'success'
  const isSuccess =
    transactionStatus === "success" ||
    transactionStatus === "settlement" ||
    transactionStatus === "capture" ||
    statusCode === "200";

  const isPending =
    transactionStatus === "pending" ||
    statusCode === "201";


  return (
    <div className="w-full max-w-[600px] mx-auto px-6 py-20 md:py-32 text-center space-y-8">
      
      {/* 1. Status icon & headings */}
      {isSuccess && (
        <div className="space-y-4">
          <div className="flex justify-center text-emerald-600">
            <CheckCircle2 size={48} className="stroke-[1.25]" />
          </div>
          <span className="text-[10px] tracking-[0.3em] font-bold text-muted uppercase block">
            TRANSACTION COMPLETED
          </span>
          <h1 className="font-serif text-3.5xl md:text-5xl tracking-tight uppercase">
            THANK YOU FOR YOUR PATRONAGE
          </h1>
          <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed tracking-wider">
            Your payment was authorized successfully. The FRACTALS STUDIO MX atelier is preparing your signature parcel.
          </p>
        </div>
      )}

      {isPending && (
        <div className="space-y-4">
          <div className="flex justify-center text-amber-500">
            <HelpCircle size={48} className="stroke-[1.25]" />
          </div>
          <span className="text-[10px] tracking-[0.3em] font-bold text-muted uppercase block">
            PAYMENT PENDING
          </span>
          <h1 className="font-serif text-3.5xl md:text-5xl tracking-tight uppercase">
            TRANSACTION IS PROCESSING
          </h1>
          <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed tracking-wider">
            Your credit card payment is awaiting completion or bank clearance. We will notify you via email shortly.
          </p>
        </div>
      )}

      {!isSuccess && !isPending && (
        <div className="space-y-4">
          <div className="flex justify-center text-red-500">
            <AlertTriangle size={48} className="stroke-[1.25]" />
          </div>
          <span className="text-[10px] tracking-[0.3em] font-bold text-muted uppercase block">
            TRANSACTION FAILED
          </span>
          <h1 className="font-serif text-3.5xl md:text-5xl tracking-tight uppercase">
            AUTHORIZATION DENIED
          </h1>
          <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed tracking-wider">
            We were unable to authorize your credit card. Please verify your details or use another card.
          </p>
        </div>
      )}

      {/* 2. Order summary details */}
      <div className="border border-border p-5 bg-neutral-50/50 space-y-3 text-[10px] tracking-widest text-left max-w-sm mx-auto uppercase">
        <div className="flex justify-between">
          <span className="text-muted">ORDER IDENTIFIER:</span>
          <span className="font-semibold text-foreground">{orderId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">PAYMENT STATUS:</span>
          <span className="font-semibold text-foreground">
            {transactionStatus || (isSuccess ? "SETTLEMENT" : isPending ? "PENDING" : "FAILED")}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">GATEWAY METHOD:</span>
          <span className="font-semibold text-foreground">VISA / MASTERCARD</span>
        </div>
      </div>

      {/* 3. Action CTAs */}
      <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
        {isSuccess ? (
          <>
            <Link href="/shop" className="luxury-btn-dark text-xs">
              CONTINUE BROWSING
            </Link>
            <span className="hidden sm:inline" />
          </>
        ) : (
          <>
            <Link href="/checkout" className="luxury-btn-dark text-xs">
              TRY CHECKOUT AGAIN
            </Link>
            <Link href="/shop" className="luxury-btn text-xs">
              RETURN TO CATALOGUE
            </Link>
          </>
        )}
      </div>

    </div>
  );
}

function PaymentResultFallback() {
  return (
    <div className="w-full max-w-[600px] mx-auto px-6 py-32 text-center space-y-4">
      <span className="font-serif italic text-lg animate-pulse text-muted">FRACTALS STUDIO MX Processing Return...</span>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<PaymentResultFallback />}>
      <PaymentResultContent />
    </Suspense>
  );
}
