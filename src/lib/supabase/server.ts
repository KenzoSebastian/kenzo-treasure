/**
 * ==============================================================================
 * Kenzo Treasury — Supabase Server Client Helper (SSR)
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Menginisialisasi instance Supabase Client untuk lingkungan Server (Server Components,
 * Server Actions, Route Handlers).
 *
 * ── Next.js 16 App Router Asynchronous Cookies ────────────────────────────────
 *
 * Pada Next.js 16, pemanggilan `cookies()` bersifat asynchronous (`await cookies()`).
 * Helper ini mengekspos `async function createClient()` dengan handler `getAll` dan
 * `setAll` yang kompatibel dengan mekanisme cookie Next.js.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Handler setAll dipanggil dari Server Component (read-only cookie context).
            // Error ini aman diabaikan karena session token disegarkan oleh middleware.
          }
        },
      },
    }
  );
}
