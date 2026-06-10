"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="font-serif italic text-lg animate-pulse text-muted">Redirecting...</span>
    </div>
  );
}
