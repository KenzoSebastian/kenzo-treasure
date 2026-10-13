/**
 * ==============================================================================
 * Kenzo Treasury — Supabase Browser Client Helper
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Menginisialisasi instance Supabase Client untuk lingkungan Browser (Client Components).
 * Menggunakan `createBrowserClient` dari `@supabase/ssr` yang otomatis menyelaraskan
 * session token dengan cookie browser.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
