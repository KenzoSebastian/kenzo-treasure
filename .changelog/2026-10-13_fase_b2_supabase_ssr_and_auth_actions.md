---
date: 2026-10-13
time: "20:50 WIB"
timezone: Asia/Jakarta
task: Implementasi Fase B2 Supabase SSR Client, Middleware Session & Auth Helpers
prompt: /plan oke tenkyuu -> oke kerjain
author: Antigravity
status: APPROVED
---

# Fase B2: Supabase SSR Client, Middleware Session & Auth Helpers

## 1. Ringkasan Perubahan

Mengimplementasikan fondasi autentikasi SSR menyeluruh pada Kenzo Treasury:
- **Dependensi Validasi:** Pemasangan `zod` untuk validasi schema input auth.
- **Tipe & Kontrak:** Pembuatan `src/types/index.ts` dengan discriminated union `ActionResponse<T>`.
- **Skema Validasi:** Pembuatan `src/schemas/auth.schema.ts` (`loginSchema`, `registerSchema`).
- **Supabase SSR Helpers:**
  - Browser: `src/lib/supabase/client.ts` menggunakan `createBrowserClient`.
  - Server SSR: `src/lib/supabase/server.ts` menggunakan `createServerClient` dan asynchronous `cookies()` Next.js 16.
- **Edge Proxy Proteksi & Token Refresh:** `src/proxy.ts` (Next.js 16) menyegarkan access token secara berkala via cookies dan memproteksi rute privat (`/dashboard/*`) dengan mengalihkan user belum login ke `/login`, serta mengalihkan user yang sudah login ke `/`.
- **Server Actions Autentikasi:** `src/actions/auth.ts` mengelola `register`, `login`, `logout`, dan `getCurrentUser`:
  - `register` otomatis menyinkronkan profil ke `public.users(id, email, fullName)` dan menginisialisasi `public.savings_account(userId, balance: 0, emergencyFundTarget: 18000000, emergencyFundBalance: 0)`.
  - `login` menyinkronkan data profil fallback secara idempotent.
  - `getCurrentUser` memverifikasi sesi resmi server melalui `supabase.auth.getUser()`.
- **Halaman Auth Minimalis Fungsional:** `src/app/(auth)/login/page.tsx` dan `src/app/(auth)/register/page.tsx` dibuat agar alur autentikasi dan proxy dapat langsung diuji end-to-end tanpa 404, serta pembaruan `src/app/(dashboard)/page.tsx` dengan informasi pengguna aktif dan tombol logout.
- **Standar Validasi Error Inline (Permintaan Kenzo):** Menghilangkan floating toast untuk kesalahan input pengguna. Pesan error ditampilkan persis di bawah field terkait (`text-xs text-destructive`) dan border input berubah menjadi merah (`border-destructive focus:ring-destructive`). Standar ini juga dikodifikasikan ke dalam `.agents/rules/frontend-design.md` dan `docs/DESIGN-SYSTEM.md`.
- **Aktivasi Row Level Security (RLS) Seluruh 9 Tabel (Permintaan Kenzo):** Pembuatan file migrasi `src/db/migrations/0002_enable_rls_all_tables.sql` dan eksekusi live ke Supabase PostgreSQL. Mengaktifkan RLS pada seluruh 9 tabel publik (`users`, `savings_account`, `months`, `incomes`, `liabilities`, `budget_categories`, `transactions`, `wishlists`, `wishlist_allocations`) serta memasang policy kepemilikan terotorisasi `((select auth.uid()) = user_id)` sehingga status `UNRESTRICTED` di dashboard Supabase hilang dan berubah aman.

## 2. Berkas Terdampak

- `src/db/migrations/0002_enable_rls_all_tables.sql`: Migrasi DDL pengaktifan RLS dan security policies di 9 tabel publik.
- `package.json` & `bun.lock`: Penambahan dependency `zod`.
- `.agents/rules/frontend-design.md`: Penegasan aturan larangan toast untuk input error & kewajiban inline error/border merah.
- `docs/DESIGN-SYSTEM.md`: Penegasan spesifikasi visual border merah & teks error di bawah field form.
- `src/types/index.ts`: Definisi shared types & penambahan `fieldErrors` pada `ActionResponse<T>`.
- `src/schemas/auth.schema.ts`: Skema validasi login & register.
- `src/lib/supabase/client.ts`: Supabase Browser Client helper.
- `src/lib/supabase/server.ts`: Supabase Server Client helper.
- `src/proxy.ts`: Next.js 16 session refresh & route protection proxy (migrasi dari middleware.ts).
- `src/actions/auth.ts`: Server Actions login, register, logout, getCurrentUser dengan `fieldErrors` mapping.
- `src/app/(auth)/login/page.tsx`: Halaman login dengan inline error border merah di bawah field.
- `src/app/(auth)/register/page.tsx`: Halaman register dengan inline error border merah di bawah field.
- `src/app/(dashboard)/page.tsx`: Integrasi profil pengguna aktif dan aksi logout.

## 3. Hasil Verifikasi

- **Typecheck:** `bun run typecheck` $\rightarrow$ **PASS** (0 errors).
- **Build:** `bun run build` $\rightarrow$ **PASS** (Kompilasi Turbopack Next.js 16 berhasil, 5 rute static/dynamic tergenerate).
- **Manual UI & Auth Flow:** **NOT RUN** (Menunggu pengujian interaktif oleh Kenzo).

## 4. Status Fase

- **Status:** `APPROVED` ✅
- **Checklist Plan:** Seluruh checklist Fase B2 di `PLANBACKEND.md` telah dicentang (`- [x]`).

## 5. Riwayat Persetujuan (Approval)

- **Status Persetujuan:** `APPROVED` ✅
- **Tanggal Disetujui:** 2026-10-13 21:05 WIB
- **Diverifikasi oleh:** Kenzo Sebastian (Ken)
- **Capaian Akhir Teruji:**
  1. Login & Registrasi SSR terintegrasi cookie browser (`sb-*-auth-token`).
  2. Proteksi rute middleware aktif dengan auto-refresh session token.
  3. Validasi skema Zod dengan border merah & error text inline di bawah field (tanpa floating toast).
  4. Auto-confirm database trigger terpasang di PostgreSQL Supabase.
  5. Seluruh 9 tabel publik diaktifkan Row Level Security (RLS) dengan ownership policies.
