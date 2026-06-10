import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyMidtransSignature } from "@/lib/midtrans";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const orderId = payload.order_id;
    const statusCode = payload.status_code;
    const grossAmount = payload.gross_amount;
    const signatureKey = payload.signature_key;
    const transactionStatus = payload.transaction_status;
    const fraudStatus = payload.fraud_status;
    const transactionId = payload.transaction_id;
    const paymentType = payload.payment_type;

    if (!orderId || !statusCode || !grossAmount || !signatureKey) {
      console.warn("[Midtrans Webhook] Missing signature parameters in payload.");
      return NextResponse.json({ message: "Missing required signature fields." }, { status: 400 });
    }

    console.log(`[Midtrans Webhook] Received webhook update for order: ${orderId}, Status: ${transactionStatus}`);

    // 1. Verify Midtrans signature to prevent mock webhook requests
    const isSignatureValid = verifyMidtransSignature({
      orderId,
      statusCode,
      grossAmount,
      signatureKey,
    });

    if (!isSignatureValid) {
      console.warn(`[Midtrans Webhook] SECURIY WARNING: Invalid signature key received for order: ${orderId}`);
      return NextResponse.json({ message: "Signature verification failed." }, { status: 403 });
    }

    // 2. Fetch databases and update records via Supabase Admin Client
    try {
      const supabaseAdmin = getSupabaseAdmin();

      // Find local order row matching order_number
      const { data: orderData, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("id, status")
        .eq("order_number", orderId)
        .single();

      if (orderError || !orderData) {
        throw new Error(orderError?.message || `Order ${orderId} not found in database.`);
      }

      const orderRowId = orderData.id;

      // 3. Map Midtrans statuses to local order and payment statuses
      let localPaymentStatus = "pending";
      let localOrderStatus = "pending";
      let restoreStock = false;

      switch (transactionStatus) {
        case "capture":
          if (paymentType === "credit_card") {
            if (fraudStatus === "challenge") {
              localPaymentStatus = "pending"; // challenge requires manual verification
              localOrderStatus = "pending";
            } else if (fraudStatus === "accept") {
              localPaymentStatus = "settlement";
              localOrderStatus = "processing"; // payment authorized, start fulfillment
            }
          }
          break;

        case "settlement":
          localPaymentStatus = "settlement";
          localOrderStatus = "processing";
          break;

        case "pending":
          localPaymentStatus = "pending";
          localOrderStatus = "pending";
          break;

        case "deny":
        case "expire":
        case "cancel":
          localPaymentStatus = transactionStatus;
          localOrderStatus = "cancelled";
          restoreStock = true; // payment expired or failed, return items to shelf
          break;

        case "refund":
          localPaymentStatus = "refund";
          localOrderStatus = "refunded";
          restoreStock = true; // refunded, return items to shelf
          break;

        default:
          localPaymentStatus = transactionStatus || "pending";
          break;
      }

      // 4. Update order state in database
      const { error: updateOrderError } = await supabaseAdmin
        .from("orders")
        .update({ status: localOrderStatus })
        .eq("id", orderRowId);

      if (updateOrderError) throw updateOrderError;

      // 5. Update payment state
      const { data: paymentData, error: paymentError } = await supabaseAdmin
        .from("payments")
        .update({
          status: localPaymentStatus,
          transaction_id: transactionId,
          payment_type: paymentType,
        })
        .eq("order_id", orderRowId)
        .select()
        .single();

      if (paymentError) throw paymentError;

      // 6. Log raw payload history into Transactions table
      await supabaseAdmin.from("transactions").insert({
        order_id: orderRowId,
        payment_id: paymentData.id,
        raw_payload: payload,
        status: transactionStatus,
      });

      // 7. Perform inventory restoration if order was failed, cancelled, or refunded
      if (restoreStock) {
        // Fetch items purchased in this order
        const { data: items, error: itemsError } = await supabaseAdmin
          .from("order_items")
          .select("variant_id, quantity")
          .eq("order_id", orderRowId);

        if (!itemsError && items) {
          console.log(`[Midtrans Webhook] Restoring warehouse stock for cancelled order: ${orderId}`);
          for (const item of items) {
            if (!item.variant_id) continue;
            
            // Increment inventory stock
            // Direct query using Postgres math operations
            try {
              const { error: rpcError } = await supabaseAdmin.rpc("increment_stock", {
                target_variant_id: item.variant_id,
                qty: item.quantity,
              });
              if (rpcError) throw rpcError;
            } catch {
              // Fallback: manually fetch, add, and save if RPC is not compiled
              const { data: inv } = await supabaseAdmin
                .from("inventory")
                .select("stock_quantity")
                .eq("variant_id", item.variant_id)
                .single();

              if (inv) {
                await supabaseAdmin
                  .from("inventory")
                  .update({ stock_quantity: inv.stock_quantity + item.quantity })
                  .eq("variant_id", item.variant_id);
              }
            }
          }
        }
      }

      console.log(`[Midtrans Webhook] Database updated successfully for Order: ${orderId}`);

    } catch (dbError) {
      const dbErrorMsg = dbError instanceof Error ? dbError.message : String(dbError);
      // Catch DB errors (e.g. database unconfigured or offline fallbacks)
      console.warn(`[Midtrans Webhook DB Warning] Database operations bypassed/failed: ${dbErrorMsg}`);
    }

    return NextResponse.json({ success: true, message: "Webhook processed." }, { status: 200 });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Midtrans Webhook Exception] ${errorMsg}`);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
