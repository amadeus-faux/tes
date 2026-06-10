"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { StoreProvider } from "@/context/StoreContext";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import MegaMenu from "@/components/MegaMenu";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCheckout = pathname.startsWith("/checkout");

  return (
    <StoreProvider>
      {!isCheckout && <AnnouncementBar />}
      {!isCheckout && <Header />}
      {!isCheckout && <MegaMenu />}
      {!isCheckout && <CartDrawer />}
      <main className="flex-grow">{children}</main>
      {!isCheckout && <Footer />}
    </StoreProvider>
  );
}
