import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Public client for standard client-side queries
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Administrative server-side client to process background updates (e.g. webhooks, stock offsets)
export const getSupabaseAdmin = () => {
  if (typeof window !== "undefined") {
    throw new Error("Admin client can only be used on the server.");
  }
  return createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
