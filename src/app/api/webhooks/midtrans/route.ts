import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/webhooks/midtrans
 *
 * Endpoint untuk menerima notifikasi pembayaran dari Midtrans.
 * Midtrans akan mengirim HTTP POST ke URL ini setelah setiap perubahan
 * status transaksi (settlement, capture, cancel, expire, dll.)
 *
 * Referensi: https://docs.midtrans.com/docs/post-notification
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Parse payload dari Midtrans
    const payload = await req.json();

    const {
      order_id,
      transaction_status,
      gross_amount,
      fraud_status,
      signature_key,
      status_code,
      transaction_id,
      payment_type,
    } = payload;

    console.log(`[Midtrans Webhook] Received notification for order: ${order_id}`);
    console.log(`[Midtrans Webhook] Status: ${transaction_status} | Amount: ${gross_amount}`);

    // 2. Validasi properti wajib
    if (!order_id || !transaction_status || !gross_amount || !signature_key) {
      console.warn("[Midtrans Webhook] Missing required payload properties.");
      return NextResponse.json(
        { message: "Bad Request: Missing required payload fields." },
        { status: 400 }
      );
    }

    // 3. Verifikasi Signature Key dari Midtrans
    //    Formula: SHA512(order_id + status_code + gross_amount + ServerKey)
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    const rawSignature = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const expectedSignature = createHash("sha512")
      .update(rawSignature)
      .digest("hex");

    if (signature_key !== expectedSignature) {
      console.error(
        `[Midtrans Webhook] INVALID SIGNATURE for order: ${order_id}. Possible fraudulent request.`
      );
      return NextResponse.json(
        { message: "Unauthorized: Invalid signature key." },
        { status: 401 }
      );
    }

    console.log(`[Midtrans Webhook] Signature verified for order: ${order_id}`);

    const supabaseAdmin = getSupabaseAdmin();

    // 4. Tentukan status order berdasarkan transaction_status dari Midtrans
    //    'settlement' = transfer bank / e-wallet sudah lunas
    //    'capture'    = kartu kredit berhasil di-charge
    //    'pending'    = menunggu pembayaran
    //    'cancel'     = dibatalkan
    //    'expire'     = waktu pembayaran habis
    //    'deny'       = ditolak (fraud / insufficient funds)
    //    'refund'     = dana dikembalikan

    let newOrderStatus: string | null = null;
    let newPaymentStatus: string | null = null;

    if (transaction_status === "settlement" || transaction_status === "capture") {
      // --- PEMBAYARAN BERHASIL ---
      // Jika capture, pastikan fraud_status bukan 'deny'
      if (transaction_status === "capture" && fraud_status === "deny") {
        newOrderStatus = "failed";
        newPaymentStatus = "failed";
        console.warn(`[Midtrans Webhook] Capture denied due to fraud for order: ${order_id}`);
      } else {
        newOrderStatus = "confirmed";
        newPaymentStatus = "paid";
        console.log(`[Midtrans Webhook] ✅ Payment SUCCESS for order: ${order_id}`);
      }
    } else if (transaction_status === "pending") {
      newOrderStatus = "pending";
      newPaymentStatus = "pending";
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "expire" ||
      transaction_status === "deny"
    ) {
      newOrderStatus = "cancelled";
      newPaymentStatus = "failed";
      console.log(`[Midtrans Webhook] ❌ Payment FAILED/CANCELLED for order: ${order_id}`);
    } else if (transaction_status === "refund") {
      newOrderStatus = "refunded";
      newPaymentStatus = "refunded";
    }

    if (!newOrderStatus || !newPaymentStatus) {
      console.log(`[Midtrans Webhook] Unhandled transaction_status: ${transaction_status}`);
      return NextResponse.json({ message: "Status not handled." }, { status: 200 });
    }

    // 5. Update status di tabel `orders` berdasarkan order_number
    const { data: orderData, error: orderFetchError } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("order_number", order_id)
      .maybeSingle();

    if (orderFetchError) {
      throw new Error(`Failed to fetch order: ${orderFetchError.message}`);
    }

    if (!orderData) {
      console.warn(`[Midtrans Webhook] Order not found in database: ${order_id}`);
      // Tetap return 200 agar Midtrans tidak terus retry
      return NextResponse.json({ message: "Order not found, ignoring." }, { status: 200 });
    }

    const orderRowId = orderData.id;

    // Update status order
    const { error: orderUpdateError } = await supabaseAdmin
      .from("orders")
      .update({ status: newOrderStatus })
      .eq("id", orderRowId);

    if (orderUpdateError) {
      throw new Error(`Failed to update order status: ${orderUpdateError.message}`);
    }

    // Update status payment record
    const paymentUpdatePayload: Record<string, string> = {
      status: newPaymentStatus,
    };

    if (transaction_id) {
      paymentUpdatePayload.transaction_id = transaction_id;
    }
    if (payment_type) {
      paymentUpdatePayload.payment_type = payment_type;
    }

    const { error: paymentUpdateError } = await supabaseAdmin
      .from("payments")
      .update(paymentUpdatePayload)
      .eq("order_id", orderRowId);

    if (paymentUpdateError) {
      // Log tapi jangan throw – order status sudah terupdate
      console.error(
        `[Midtrans Webhook] Failed to update payment record: ${paymentUpdateError.message}`
      );
    }

    console.log(
      `[Midtrans Webhook] ✅ Order ${order_id} updated → order_status: ${newOrderStatus}, payment_status: ${newPaymentStatus}`
    );

    // 6. Return 200 OK agar Midtrans tidak mengirim ulang notifikasi
    return NextResponse.json({
      success: true,
      message: `Order ${order_id} status updated to ${newOrderStatus}.`,
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Midtrans Webhook] Unhandled exception: ${errorMsg}`);

    return NextResponse.json(
      { message: `Internal Server Error: ${errorMsg}` },
      { status: 500 }
    );
  }
}
