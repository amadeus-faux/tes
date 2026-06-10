import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { chargeCreditCard } from "@/lib/midtrans";
import { CartItem } from "@/context/StoreContext";

export async function POST(req: NextRequest) {
  const cartItemsToRollback: CartItem[] = [];
  try {
    const { tokenId, amount, shipping, cartItems, discountId, discountAmount, profileId } = await req.json();

    if (!tokenId || !amount || !shipping || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ message: "Invalid payload parameters." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Transactional Inventory Check & Reservation
    console.log(`[Checkout API] Reserving inventory stock for ${cartItems.length} items.`);
    
    for (const item of cartItems) {
      const { data: success, error: rpcError } = await supabaseAdmin.rpc("decrement_stock", {
        target_variant_id: item.id,
        qty: item.quantity,
      });

      if (rpcError || !success) {
        // Rollback any inventory reserved so far
        console.warn(`[Checkout API Stock Error] ${item.name} is out of stock. Initiating reservation rollback.`);
        for (const rbItem of cartItemsToRollback) {
          await supabaseAdmin.rpc("increment_stock", {
            target_variant_id: rbItem.id,
            qty: rbItem.quantity,
          });
        }
        return NextResponse.json({
          message: `Sufficient stock is not available for creation: ${item.name} (Size: ${item.size}). Please adjust quantity.`
        }, { status: 400 });
      }

      // Add to rollback list in case subsequent steps fail
      cartItemsToRollback.push(item);
    }

    // 2. Generate unique luxury order number
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD
    const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit code
    const orderNumber = `FRACTALS-${datePart}-${randomPart}`;

    console.log(`[Checkout API] Initializing Order ${orderNumber} for $${amount}`);

    // 3. Insert Database Records
    let orderRowId: string | null = null;
    try {
      // a. Insert Order Record
      const { data: orderData, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
          profile_id: profileId || null,
          order_number: orderNumber,
          status: "pending",
          subtotal: amount - 25 + (discountAmount || 0), // subtotal before shipping and discount
          shipping_cost: 25.0,
          discount_amount: discountAmount || 0,
          total: amount,
          shipping_address: shipping,
          billing_address: shipping,
          discount_id: discountId || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;
      orderRowId = orderData.id;

      // b. Insert Order Items
      const orderItemsToInsert = (cartItems as CartItem[]).map((item: CartItem) => ({
        order_id: orderRowId,
        variant_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        variant_name: `${item.size} / ${item.color}`,
        product_name: item.name,
      }));

      const { error: itemsError } = await supabaseAdmin
        .from("order_items")
        .insert(orderItemsToInsert);

      if (itemsError) throw itemsError;

      // c. Insert Initial Payment record
      const { error: paymentError } = await supabaseAdmin
        .from("payments")
        .insert({
          order_id: orderRowId,
          payment_method: "credit_card",
          status: "pending",
          amount: amount,
        });

      if (paymentError) throw paymentError;

      console.log(`[Checkout API] Database logs recorded successfully for order ID: ${orderRowId}`);
    } catch (dbError) {
      const dbErrorMsg = dbError instanceof Error ? dbError.message : String(dbError);
      console.error(`[Checkout API DB Error] Failed to write order details: ${dbErrorMsg}`);
      throw new Error(`Database error: ${dbErrorMsg}`);
    }

    // 4. Charge credit card via Midtrans Core API
    let midtransResponse;
    try {
      midtransResponse = await chargeCreditCard({
        tokenId,
        orderNumber,
        amount,
        customer: {
          firstName: shipping.firstName,
          lastName: shipping.lastName,
          email: shipping.email,
          phone: shipping.phone,
        },
      });
    } catch (chargeError) {
      const chargeErrorMsg = chargeError instanceof Error ? chargeError.message : String(chargeError);
      console.error(`[Checkout API Charge Error] Card charging failed: ${chargeErrorMsg}`);
      
      // Delete order row on payment failure to avoid stale database entries
      if (orderRowId) {
        await supabaseAdmin.from("orders").delete().eq("id", orderRowId);
      }
      throw chargeError;
    }

    console.log(
      `[Checkout API] Midtrans response for ${orderNumber}: status = ${midtransResponse.transaction_status}, code = ${midtransResponse.status_code}`
    );

    // 5. Update local payment record with Transaction ID
    if (orderRowId && midtransResponse.transaction_id) {
      try {
        await supabaseAdmin
          .from("payments")
          .update({
            transaction_id: midtransResponse.transaction_id,
            payment_type: midtransResponse.payment_type,
            status: midtransResponse.transaction_status || "pending",
          })
          .eq("order_id", orderRowId);
      } catch (updateDbError) {
        const updateDbErrorMsg = updateDbError instanceof Error ? updateDbError.message : String(updateDbError);
        console.error(`[Checkout API] Failed to update transaction details in DB: ${updateDbErrorMsg}`);
      }
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      redirectUrl: midtransResponse.redirect_url,
      message: midtransResponse.status_message,
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Checkout API Exception] Aborting checkout: ${errorMsg}`);

    // Rollback stock decrements on failure
    try {
      const supabaseAdmin = getSupabaseAdmin();
      for (const rbItem of cartItemsToRollback) {
        await supabaseAdmin.rpc("increment_stock", {
          target_variant_id: rbItem.id,
          qty: rbItem.quantity,
        });
      }
      console.log(`[Checkout API Rollback] Stock rolled back successfully for items.`);
    } catch (rollbackError) {
      const rollbackErrorMsg = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
      console.error(`[Checkout API Rollback Failed] ${rollbackErrorMsg}`);
    }

    return NextResponse.json(
      { message: errorMsg || "Card authorization rejected." },
      { status: 500 }
    );
  }
}
