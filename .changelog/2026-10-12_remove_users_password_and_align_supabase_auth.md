---
date: 2026-10-12
task: Penyelarasan Otoritas Supabase Auth & Penghapusan Kolom Password
prompt: oke setuju, klo kolom password null ya, apus aja beraarti, update file yg berkaitan dengan ini, biar selalu update
author: Cecillia (Cil)
---

# Laporan Perubahan: Penyelarasan Supabase Auth & Penghapusan Kolom Password

## 1. Ikhtisar Perubahan
Menyelaraskan otoritas kredensial aplikasi dengan arsitektur Supabase Auth:
- **Pembersihan Kolom Password:** Menghapus kolom `password` dari tabel `users` di [`src/db/schema.ts`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/db/schema.ts). Tabel `public.users` kini murni berfungsi sebagai tabel profil pengguna di mana kolom `id` terikat 1:1 ke `auth.users.id` Supabase Auth.
- **Eksekusi Database & Migrasi:** Menjalankan perubahan skema ke PostgreSQL Supabase dan mendokumentasikan migrasi formal di [`src/db/migrations/0001_busy_hiroim.sql`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/db/migrations/0001_busy_hiroim.sql).
- **Penyelarasan Dokumen Arsitektur & Spesifikasi:**
  - [`docs/DECISIONS-NEEDED.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/docs/DECISIONS-NEEDED.md): Menandai keputusan kredensial Supabase Auth dan Drizzle ownership check sebagai **RESOLVED**.
  - [`docs/REVIEW-AUDIT.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/docs/REVIEW-AUDIT.md): Menandai kontradiksi Auth (item 1), Direct DB RLS (item 3), dan Security risk (item 4) sebagai **RESOLVED**.
  - [`PLANBACKEND.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/PLANBACKEND.md): Menyesuaikan checklist Fase B2 untuk menghapus tugas hashing Bcrypt/Argon2 dan menggantinya dengan penautan profil pengguna Supabase Auth.
  - [`PRD.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/PRD.md): Memperbarui definisi tabel `users` di Bab 3.1 tanpa kolom password.

## 2. Berkas yang Terpengaruh
- [`src/db/schema.ts`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/db/schema.ts)
- [`src/db/migrations/0001_busy_hiroim.sql`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/db/migrations/0001_busy_hiroim.sql)
- [`src/db/migrations/meta/_journal.json`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/db/migrations/meta/_journal.json)
- [`src/db/migrations/meta/0001_snapshot.json`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/db/migrations/meta/0001_snapshot.json)
- [`docs/DECISIONS-NEEDED.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/docs/DECISIONS-NEEDED.md)
- [`docs/REVIEW-AUDIT.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/docs/REVIEW-AUDIT.md)
- [`PLANBACKEND.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/PLANBACKEND.md)
- [`PRD.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/PRD.md)
- [`.agents/rules/database-access.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.agents/rules/database-access.md)
