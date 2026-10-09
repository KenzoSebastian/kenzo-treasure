---
date: 2026-10-09
task: Pemetaan Struktur Direktori Proyek di AGENTS.md
prompt: Buatkan struktur folder buat gambaran nanti di AGENTS.md
author: Cecillia (Cil)
---

# Changelog: Pemetaan Struktur Direktori Proyek

## 📌 Ringkasan Perubahan
Menambahkan blueprint struktur folder arsitektur aplikasi (Project Directory Map) ke dalam [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md) Seksi 4. Pemetaan ini mencakup perincian menyeluruh untuk setiap folder mulai dari Server Actions, App Router, Atomic & Feature UI components, Drizzle schema & migrations, shared Zod validation schemas, custom hooks, hingga domain utilities.

---

## 📁 Berkas yang Dibuat / Diubah
- [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md) — Menambahkan Seksi 4 (Project Directory Map) dengan hierarki `src/actions/`, `src/app/`, `src/components/`, `src/db/`, `src/hooks/`, `src/lib/`, `src/schemas/`, dan `src/types/`.
- [`laporan.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/laporan.md) — Memperbarui ringkasan checkpoint persiapan arsitektur proyek.

---

## 💡 Keputusan Penting (Rationale)
1. **Pemisahan Tegas Lapisan (Strict Separation of Concerns):**
   - Komponen UI atomik terisolasi di `src/components/ui/` (Shadcn UI murni tanpa business logic).
   - Komponen berbasis domain bisnis ditempatkan terpisah di `src/components/features/` per modul fitur (months, transactions, liabilities, wishlists, dll.).
   - Logika mutasi database dipusatkan di Server Actions (`src/actions/`).
   - Single source of truth rumus finansial dikunci di `src/lib/financial-calculations.ts`.
2. **Pedoman Navigasi Kode yang Konsisten:**
   - Memastikan pengembang dan agent selalu menempatkan berkas baru pada direktori yang tepat sesuai konvensi tanpa membuat struktur liar.
