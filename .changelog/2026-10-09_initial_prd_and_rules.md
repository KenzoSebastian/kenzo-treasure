---
date: 2026-10-09
task: Inisialisasi Spesifikasi, ERD, dan Panduan Operasional
prompt: Perencanaan Kenzo Treasury, skema DB Excalidraw, PRD, dan adaptasi aturan kantor Lamonte
author: Cecillia (Cil)
---

# Changelog: Inisialisasi Spesifikasi, ERD, dan Panduan Operasional

## 📌 Ringkasan Perubahan
Menyelesaikan fondasi perencanaan produk dan arsitektur data aplikasi Kenzo Treasury untuk menggantikan sistem Notion lama, mencakup PRD lengkap, diagram database ERD visual di Excalidraw, dokumen aturan operasional AI (`AGENTS.md`) dengan adopsi standar dari proyek Lamonte, serta dashboard pelaporan progres (`laporan.md`).

---

## 📁 Berkas yang Dibuat / Diubah
- [`PRD.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/PRD.md) — Product Requirement Document mencakup 15 modul teknis, kalkulasi finansial, dan arsitektur database.
- [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md) — Ground rules operasional agen AI: persona, standar stack, testing manual UI Ken, izin komentar mendalam di kode, pencatatan `.changelog/`, dan pemeliharaan `laporan.md`.
- [`database_schema.excalidraw`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/database_schema.excalidraw) — File visual ERD 9 tabel database lokal beserta live sharing link.
- [`laporan.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/laporan.md) — Dasbor pemantauan progres pengerjaan bertahap dari Fase 0 hingga Fase 9.

---

## 💡 Keputusan Penting (Rationale)
1. **Penyimpanan Foto di Supabase Storage:**
   - Menggantikan Cloudflare R2 untuk menghemat biaya (gratis kuota 1GB bawaan Supabase) dan menyederhanakan autentikasi melalui RLS.
   - Gambar wishlist dikompres ke format WebP (<200KB) di sisi client sebelum upload.
2. **Kolom `password` di Tabel `users`:**
   - Ditambahkan untuk mendukung kredensial autentikasi hash (Bcrypt / Argon2) sesuai arahan langsung Ken.
3. **Standarisasi Kolom `updated_at` di 9 Tabel:**
   - Menyeragamkan seluruh tabel agar memiliki `updated_at` untuk audit trail, cache invalidation, dan background sync queue offline di TanStack Query.
4. **Form Stack (React Hook Form + Zod):**
   - Menggunakan kombinasi resmi Shadcn UI (`@hookform/resolvers/zod`) untuk performa tinggi tanpa re-render berlebih pada perangkat mobile.
5. **Adopsi Standar Proyek Lamonte:**
   - Larangan `alert()`/`confirm()` browser bawaan (wajib Shadcn dialog & toast Sonner).
   - Anti-halusinasi Tailwind class & viewport `100dvh` mobile.
   - Single source of truth untuk rumus finansial (`src/lib/financial-calculations.ts`).
   - Format changelog dengan frontmatter YAML.
