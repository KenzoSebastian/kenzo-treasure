---
date: 2026-11-24
time: "20:15 WIB"
timezone: Asia/Jakarta
task: "Refactor Dashboard: Executive Wealth Bento (Tier 1 Hero Simpanan & Cashflow Cockpit)"
prompt: "aku mau refactor halaman daskboard, itu kyk double ya? Realisasi kas keluar sama Realisasi pengeluaran kas, trus juga net tabungan sama sisa kuota uang bebas, itu kan sama ya, tolong dong robak layoutnya gimna ya?? aku si rencana, brankas simpanan itu pling atas, aku mau refactor semua card di halaman dashboard, coba kasih aku opsi, bikin lebih modern tanpa redundansi, pke skill ini /design-taste-web"
author: Antigravity
---

# Refactor Dashboard: Executive Wealth Bento (Tier 1 Hero Simpanan & Cashflow Cockpit)

## Ringkasan Perubahan
Menghilangkan redundansi metrik finansial pada halaman utama `/dashboard` di mana metrik *Realisasi kas keluar* terduplikasi dengan *Realisasi pengeluaran kas* dan *Net tabungan* terduplikasi dengan *Sisa kuota uang bebas*. Berdasarkan preferensi Kenzo (Opsi 1: The Executive Wealth Bento), tata letak Tier 1 dirancang ulang menggunakan grid bento asimetris 65:35 (7:5 di desktop) dengan prinsip *high-altitude simplicity* dan estetika visual modern:

1. **Komponen Baru `ExecutiveWealthBento.tsx` (`src/components/features/dashboard/ExecutiveWealthBento.tsx`):**
   - **Kartu Kiri (Hero Brankas Simpanan - 65% Desktop / Col-Span-7):**
     - Menampilkan total akumulasi aset kas likuid (`Total Brankas Simpanan`) di posisi puncak dashboard dengan tipografi sans-serif proporsional `text-4xl font-extrabold tabular-nums`.
     - Badge rasio ketahanan darurat (`Safety Months`, misal: "3,5 Bulan Aman") dengan ikon pelindung `ShieldCheck`.
     - Inset cards ganda dengan micro-border rapi (`border-border/70 bg-muted/20`) untuk rincian *Tabungan Bebas* dan *Dana Darurat* (lengkap dengan progres % target ideal).
     - Navigasi ringkas: Tombol *Buka Detail Brankas* ke `/dashboard/vault` (tombol *Kelola & Setor Brankas* dihapus sesuai arahan Kenzo agar mutasi terpusat di halaman brankas).
   - **Kartu Kanan (Cockpit Arus Kas Bulan Berjalan - 35% Desktop / Col-Span-5):**
     - Fokus pada sisa kuota likuid bulan berjalan: *Sisa Kuota Uang Bebas (Surplus)* dengan nominal visual besar berwarna hijau emerald (`+formatRupiah(remainingCash)`).
     - Badge status kesehatan anggaran dinamis (*Anggaran Sehat* $\le 70\%$, *Mendekati Batas* $71-90\%$, *Defisit Kas / Overbudget* $>90\%$).
     - Breakdown 2 baris terfokus: *Total Pemasukan* (dengan rincian gaji dasar) dan *Realisasi Belanja* (dengan persentase penyerapan).
     - Bar progres penyerapan anggaran dengan transisi warna semantik dan teks edukatif ZBB.

2. **Penyelarasan Server Component Orchestrator (`src/app/(dashboard)/dashboard/(overview)/page.tsx`):**
   - Menggantikan `ExecutiveSummaryCard` lama, 3 kartu redundant `CashflowSummaryCard`, dan kartu `EmergencyVaultCard` duplikat di bagian bawah dengan `<ExecutiveWealthBento />`.
   - Menghilangkan redundansi pembacaan dan tampilan angka ganda pada antarmuka.

3. **Penyelarasan Layout Skeleton (`src/components/layout/DashboardSkeleton.tsx`):**
   - Memperbarui skeleton Tier 1 agar presisi mencerminkan struktur bento asimetris 65:35, mencegah terjadinya cumulative layout shift (CLS).

4. **Pengujian Terotomasi (`ExecutiveWealthBento.test.tsx`):**
   - Menambahkan unit test komprehensif untuk pengujian SSR Bento Cockpit, verifikasi ambang batas kesehatan anggaran (sehat, waspada, defisit), serta penegakan invarian zero-monospace (`tabular-nums`).

## Berkas yang Diubah / Dibuat
| File | Status | Keterangan |
| :--- | :--- | :--- |
| `src/components/features/dashboard/ExecutiveWealthBento.tsx` | CREATED | Komponen Hero Bento Tier 1 untuk Total Brankas Simpanan & Arus Kas Cockpit |
| `src/components/features/dashboard/__tests__/ExecutiveWealthBento.test.tsx` | CREATED | Unit test suite SSR, status anggaran, dan audit zero monospace |
| `src/components/features/dashboard/index.ts` | MODIFIED | Ekspor modul `ExecutiveWealthBento` |
| `src/app/(dashboard)/dashboard/(overview)/page.tsx` | MODIFIED | Integrasi `ExecutiveWealthBento` dan eliminasi kartu-kartu duplikat |
| `src/components/layout/DashboardSkeleton.tsx` | MODIFIED | Penyelarasan skeleton Tier 1 mengikuti grid bento 65:35 |

## Hasil Verifikasi Kualitas
- `tsc --noEmit`: **PASS** (0 type errors)
- `bun test`: **PASS** (109 passing, 0 failing across 8 test suites)
- `bun run build`: **PASS** (Next.js 16.4.6 Turbopack production build berhasil mengompilasi 11/11 rute statis & dinamis)
- Invarian Desain: **PASS** (Zero `font-mono`, 100% `tabular-nums`, zero literal emojis)

## Status
`IMPLEMENTED — AWAITING APPROVAL`
