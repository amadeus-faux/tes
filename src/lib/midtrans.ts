import { createHash } from "crypto";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";
const MIDTRANS_API_URL = MIDTRANS_IS_PRODUCTION
  ? "https://api.midtrans.com/v2"
  : "https://api.sandbox.midtrans.com/v2";

// Secure authorization header using base64 encoded Server Key
const getAuthHeader = () => {
  const token = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");
  return `Basic ${token}`;
};

export interface ChargeCardRequest {
  tokenId: string;
  orderNumber: string;
  amount: number;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export interface MidtransAction {
  name: string;
  method: string;
  url: string;
}

export interface ChargeCardResponse {
  status_code: string;
  status_message: string;
  transaction_id?: string;
  order_id?: string;
  gross_amount?: string;
  payment_type?: string;
  transaction_time?: string;
  transaction_status?: string;
  redirect_url?: string; // OTP verification page URL
  fraud_status?: string;
  validation_messages?: string[];
  actions?: MidtransAction[];
}

/**
 * Charges a credit card token via Midtrans Core API
 */
export async function chargeCreditCard(params: ChargeCardRequest): Promise<ChargeCardResponse> {
  const response = await fetch(`${MIDTRANS_API_URL}/charge`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": getAuthHeader(),
    },
    body: JSON.stringify({
      payment_type: "credit_card",
      transaction_details: {
        order_id: params.orderNumber,
        gross_amount: Math.round(params.amount),
      },
      credit_card: {
        token_id: params.tokenId,
        authentication: true, // triggers 3D Secure if applicable
      },
      customer_details: {
        first_name: params.customer.firstName,
        last_name: params.customer.lastName,
        email: params.customer.email,
        phone: params.customer.phone,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.status_message || `Midtrans charge failed with status: ${response.status}`
    );
  }

  return response.json();
}

/**
 * Fetch status of an order/transaction from Midtrans
 */
export async function getMidtransStatus(orderId: string): Promise<unknown> {
  const response = await fetch(`${MIDTRANS_API_URL}/${orderId}/status`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch status from Midtrans: ${response.status}`);
  }

  return response.json();
}

/**
 * Verifies the integrity of the webhook notification from Midtrans using SHA512 signature key mapping
 */
export function verifyMidtransSignature(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}): boolean {
  if (!MIDTRANS_SERVER_KEY) return false;
  // signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)
  const rawString = params.orderId + params.statusCode + params.grossAmount + MIDTRANS_SERVER_KEY;
  const computedHash = createHash("sha512").update(rawString).digest("hex");
  return computedHash === params.signatureKey;
}
