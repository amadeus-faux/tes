import type { Metadata } from "next";
import "./globals.css";
import LayoutContent from "./LayoutContent";

export const metadata: Metadata = {
  title: "FRACTALS STUDIO MX | Haute Couture & Ready-to-Wear Storefront",
  description:
    "Explore modern luxury apparel, premium footwear, handbags, and accessories at FRACTALS STUDIO MX. Designed with a minimal, magazine-style editorial aesthetic.",
  openGraph: {
    title: "FRACTALS STUDIO MX | Haute Couture",
    description: "Premium minimal luxury fashion house collection.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-foreground selection:text-background">
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  );
}
