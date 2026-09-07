import { createClient, SupabaseClient } from "@supabase/supabase-js";

function cleanSupabaseUrl(url: string): string {
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "").trim();
}

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseUrl = cleanSupabaseUrl(rawUrl);
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("your-project-id") &&
    !supabaseAnonKey.includes("your-anon-public-key") &&
    supabaseUrl.startsWith("http")
  );
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  return supabaseInstance;
}

export { supabaseUrl, supabaseAnonKey };
