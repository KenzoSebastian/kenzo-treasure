/**
 * ==============================================================================
 * Kenzo Treasury — Next.js Session Refresh & Route Protection Middleware
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * 1. Session Refresh: Memperbarui cookie access token Supabase Auth secara berkala
 *    sebelum kedaluwarsa saat navigasi request.
 * 2. Proteksi Rute: Mengamankan dashboard rute privat agar hanya dapat diakses oleh
 *    pengguna yang terautentikasi (`supabase.auth.getUser()`).
 * 3. Redirect Balik: Mengalihkan pengguna yang sudah login agar tidak mengakses
 *    kembali halaman `/login` atau `/register`.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Verifikasi keaslian user dari Supabase Auth server (jangan gunakan getSession)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  // Jika belum login dan mencoba mengakses rute terproteksi
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Jika sudah login dan mencoba membuka halaman login/register
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - file ekstensi gambar / ikon publik (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
