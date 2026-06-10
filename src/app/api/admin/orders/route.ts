import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/admin/orders
 * Fetch all orders with nested order_items and buyer profile info.
 * Uses service role to bypass RLS — admin only.
 */
export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select(
        `
        id,
        order_number,
        status,
        subtotal,
        shipping_cost,
        discount_amount,
        total,
        shipping_address,
        created_at,
        profile_id,
        profiles (
          first_name,
          last_name,
          email,
          phone
        ),
        order_items (
          id,
          quantity,
          unit_price,
          variant_name,
          product_name,
          variant_id,
          product_variants (
            size,
            color,
            product_id,
            products (
              images,
              name
            )
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Admin Orders API] Supabase error:", error.message);
      throw error;
    }

    return NextResponse.json({ orders: orders ?? [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Admin Orders API] Exception:", msg);
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
