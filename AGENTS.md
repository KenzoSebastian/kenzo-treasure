# Kenzo Treasury — Aturan Proyek

Kenzo Treasury adalah aplikasi manajemen keuangan pribadi berbasis web progresif (PWA) dengan pendekatan mobile-first. Aturan Global Cecillia berlaku penuh (jangan diduplikasi di sini).

## 1. Sumber Acuan & Prioritas Kebenaran
- **Kebutuhan Produk:** `PRD.md` (baca hanya bagian relevan; untuk skema database selalu lihat langsung `src/db/schema.ts`).
- **Roadmap & Progres:** `PLANBACKEND.md`, `PLANFRONTEND.md`, dan `laporan.md`.
- **Implementasi Aktual Menang:** Kode sumber, migrasi, dan lockfile adalah single source of truth. Jangan berasumsi dari dokumen jika kode berbeda.
- **Aturan Domain Spesifik:** `.agents/rules/` (`financial-domain.md`, `database-access.md`, `frontend-design.md`, `project-architecture.md`).
- **Riwayat Persetujuan:** Fase B1–B5 dan F1–F5 sudah disetujui. Dilarang menghapus atau membatalkan riwayat tanpa izin.

## 2. Alur Pengerjaan & Gerbang Persetujuan (Approval Gate)
- Kerjakan **hanya 1 fase yang diminta eksplisit** per iterasi.
- Saat selesai implementasi, laporkan status: `IMPLEMENTED — AWAITING APPROVAL`. Dilarang mencentang checklist sebelum ada persetujuan eksplisit (contoh: "approve B6").
- Setelah disetujui:
  1. Centang hanya checklist fase terkait di roadmap.
  2. Catat persetujuan di `.changelog/` terkait.
  3. Perbarui status fase di `laporan.md`.
  4. Berikan saran git staging dan commit Conventional Commits manual untuk Kenzo.
  5. Dilarang commit/push otomatis atau memulai fase baru tanpa instruksi.
- Gunakan skill `.agents/skills/phase-delivery/SKILL.md` untuk alur fase dan `.agents/skills/financial-integrity/SKILL.md` untuk kalkulasi/mutasi keuangan.

## 3. Runtime & Dependensi
- Gunakan **Bun (v1.4+)** sebagai runtime & package manager utama (`bun install`, `bun add`, `bun run`).
- Dilarang keras menggunakan npm, Yarn, atau pnpm. Pertahankan `bun.lock`.
- Jangan upgrade dependensi tanpa instruksi atau kebutuhan kompatibilitas nyata.

## 4. Standar Tampilan & Invarian Tipografi
- Wajib ikuti `.agents/rules/frontend-design.md` dan `docs/DESIGN-SYSTEM.md`.
- **DILARANG KERAS font monospace (`font-mono`)** untuk nominal uang (Rupiah), angka saldo, persen, rasio, atau metrik pada UI. Semua angka wajib menggunakan font sans-serif proporsional standar dengan `tabular-nums`.

## 5. Pemisahan Tanggung Jawab & Invarian Database-First
- **Pemisahan Lapisan Modul:**
  - `src/actions/`: HANYA mutasi server (write). Dilarang menaruh query agregasi atau fungsi pembacaan data panjang di sini.
  - `src/lib/queries/`: Khusus fungsi pembacaan data (read-only) untuk React Server Components.
  - `src/lib/`: Fungsi kalkulasi domain murni (`financial-calculations.ts`), generator (`*-generator.ts`), atau utilitas.
  - `src/types/`: Kontrak tipe bersama domain terkait (`src/types/<domain>.ts`).
- **Anti-Hardcode Finansial (Database-First):**
  - Dilarang keras men-hardcode nominal finansial (seperti nominal cicilan 735.000, 500.000, atau saldo) dan pencocokan string keyword kaku di dalam logika kode.
  - Data utang, cicilan (`monthlyPayment`), status lunas (`isSettled`), serta daftar pos kategori wajib dibaca dinamis langsung dari database (`liabilities`, `budgetCategories`, `months`).
  - Pembuatan bulan baru wajib mewarisi (*inherit*) konfigurasi dan target bulan sebelumnya dari database jika ada. Baseline template hanya fallback saat database kosong.

## 6. Clean Page Architecture & Prinsip Mutlak DRY
- **Page sebagai Orchestrator:** Berkas `src/app/**/page.tsx` HANYA bertindak sebagai Server Component orchestrator (auth, fetch data via `queries/`, urai params, supply props). Dilarang keras menumpuk inline markup kartu berulang atau rincian UI panjang di dalam `page.tsx`.
- **Pemisahan Komponen Fitur:** Seluruh kartu metrik, daftar pos, dan widget interaktif wajib dipisahkan ke `src/components/features/<domain>/`.
- **Prinsip Mutlak DRY (Don't Repeat Yourself):** Dilarang keras membuat banyak file komponen yang berbagi 80%+ kerangka visual/shell identik (hanya beda judul, ikon, teks link, atau konten). Wajib satukan ke dalam *reusable primitive* (seperti `DashboardHubCard` untuk hub preview dan `CashflowSummaryCard` untuk metrik arus kas) menggunakan props konfigurasi dan slot `children`.