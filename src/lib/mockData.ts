export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  images: string[];
  category: string;
  is_featured?: boolean;
  price?: number;
  sizes?: string[];
  stock?: number;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1000000-0000-0000-0000-000000000000",
    name: "Monolith Leather Combat Boot",
    slug: "monolith-combat-boot",
    description: "Crafted from premium water-resistant calfskin leather with a chunky platform sole, textured knit shaft detail, and silver hardware accents.",
    base_price: 1250.00,
    images: [
      "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=800",
      "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=800"
    ],
    category: "Shoes",
    is_featured: true,
  },
  {
    id: "p2000000-0000-0000-0000-000000000000",
    name: "Talon Pointed Slingback Loafer",
    slug: "talon-slingback-loafer",
    description: "An avant-garde blend of classic loafer detailing and a slingback silhouette, featuring a sleek silver buckle strap and signature low stacked heel.",
    base_price: 890.00,
    images: [
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=800",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800"
    ],
    category: "Shoes",
    is_featured: true,
  },
  {
    id: "p3000000-0000-0000-0000-000000000000",
    name: "Fractals Court Premium Sneaker",
    slug: "fractals-court-sneaker",
    description: "Editorial low-top luxury sneaker in soft white nappa leather with detailed tonal stitching, refined perforation, and dynamic raw-edge overlays.",
    base_price: 650.00,
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800",
      "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?q=80&w=800"
    ],
    category: "Shoes",
    is_featured: false,
  },
  {
    id: "p4000000-0000-0000-0000-000000000000",
    name: "Signature Monogram Tote Bag",
    slug: "signature-monogram-tote",
    description: "Spacious open-top tote structured in textured printed leather. Double top handles and dual thin shoulder straps for effortless styling versatility.",
    base_price: 1750.00,
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800",
      "https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=800"
    ],
    category: "Bags",
    is_featured: true,
  },
  {
    id: "p5000000-0000-0000-0000-000000000000",
    name: "Crux Sterling Silver Ring Chain",
    slug: "crux-ring-chain",
    description: "Minimalist sterling silver chain link wrap ring featuring a subtle dangling tag and integrated custom loop clasp detail.",
    base_price: 320.00,
    images: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800",
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800"
    ],
    category: "Jewelry",
    is_featured: false,
  }
];

export const MOCK_COLLECTIONS: Collection[] = [
  {
    id: "c1000000-0000-0000-0000-000000000000",
    name: "FALL / WINTER 2026",
    slug: "fall-winter-2026",
    description: "A study of asymmetric tailoring and structured silhouettes.",
    image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200",
  },
  {
    id: "c2000000-0000-0000-0000-000000000000",
    name: "VERSATILE ELEGANCE",
    slug: "versatile-elegance",
    description: "Minimal accessories, sleek leather details, and high-fashion utility.",
    image_url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200",
  }
];

export interface Variant {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  size: string;
  color: string;
  material: string;
  stock: number;
}

export const MOCK_VARIANTS: Variant[] = [
  { id: "v1-38", product_id: "p1000000-0000-0000-0000-000000000000", name: "38 / Black / Leather", sku: "BOOT-BLK-38", size: "38", color: "Black", material: "Calfskin Leather", stock: 10 },
  { id: "v1-39", product_id: "p1000000-0000-0000-0000-000000000000", name: "39 / Black / Leather", sku: "BOOT-BLK-39", size: "39", color: "Black", material: "Calfskin Leather", stock: 8 },
  { id: "v1-40", product_id: "p1000000-0000-0000-0000-000000000000", name: "40 / Black / Leather", sku: "BOOT-BLK-40", size: "40", color: "Black", material: "Calfskin Leather", stock: 12 },
  
  { id: "v2-38", product_id: "p2000000-0000-0000-0000-000000000000", name: "38 / Black / Leather", sku: "LOAF-BLK-38", size: "38", color: "Black", material: "Polished Leather", stock: 5 },
  { id: "v2-39", product_id: "p2000000-0000-0000-0000-000000000000", name: "39 / Black / Leather", sku: "LOAF-BLK-39", size: "39", color: "Black", material: "Polished Leather", stock: 6 },
  
  { id: "v3-40", product_id: "p3000000-0000-0000-0000-000000000000", name: "40 / White / Nappa", sku: "SNEAK-WHT-40", size: "40", color: "White", material: "Nappa Leather", stock: 15 },
  { id: "v3-41", product_id: "p3000000-0000-0000-0000-000000000000", name: "41 / White / Nappa", sku: "SNEAK-WHT-41", size: "41", color: "White", material: "Nappa Leather", stock: 20 },
  
  { id: "v4-os", product_id: "p4000000-0000-0000-0000-000000000000", name: "OS / Mono / Printed Leather", sku: "TOTE-MONO-OS", size: "OS", color: "Monogram", material: "Textured Leather", stock: 4 },
  
  { id: "v5-6", product_id: "p5000000-0000-0000-0000-000000000000", name: "6 / Silver / Silver", sku: "RING-SLV-6", size: "6", color: "Silver", material: "Sterling Silver", stock: 25 },
  { id: "v5-7", product_id: "p5000000-0000-0000-0000-000000000000", name: "7 / Silver / Silver", sku: "RING-SLV-7", size: "7", color: "Silver", material: "Sterling Silver", stock: 30 },
];
