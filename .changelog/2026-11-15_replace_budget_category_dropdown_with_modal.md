---
date: 2026-11-15
time: "13:45 WIB"
timezone: Asia/Jakarta
task: Ubah Rincian Card Pos Pengeluaran dari Dropdown Menjadi Modal Box
prompt: "tolong untuk card pos pengeluaran itu, jangan pkai drop down buat liat detail rinciannya, tapi pakai modal box aja"
author: Antigravity
approved_at: "2026-11-15 13:46 WIB"
approved_by: Kenzo
status: COMPLETED ✅ (Approved)
---

# Changelog — Modal Box Rincian Pos Pengeluaran

- **Status:** `COMPLETED ✅ — Approved by Kenzo (2026-11-15 13:46 WIB)`

## Ringkasan Perubahan

1. **Penggantian Dropdown Inline Menjadi Modal Box (`Dialog`):**
   - Menghapus state & UI collapsible dropdown (`isExpanded`, ikon panah `ChevronDown`/`ChevronUp`, dan sub-list inline yang melebarkan tinggi kartu di grid) pada `BudgetCategoryCard`.
   - Mengganti tombol `Rincian (N)` menjadi `DialogTrigger` Shadcn UI yang membuka `DialogContent` terstruktur (`BudgetCategoryDetailsPanel`), menampilkan header pos (ikon, nama, ikon kunci opsional, badge status semantik), ringkasan 3 kolom (`Target`, `Terpakai`, `Sisa` / `Overbudget`) dalam angka proporsional `tabular-nums`, `Separator`, area daftar transaksi `TransactionSubList` yang dapat di-scroll (`max-h-[45dvh]`), dan tombol `Tutup`.
2. **Kompatibilitas Toast Undo 5 Detik di Dalam Modal Radix:**
   - Menambahkan `pointer-events-auto` pada kontainer `Toaster` di `src/components/ui/sonner.tsx` karena Radix `Dialog` menonaktifkan `pointer-events` pada `<body>` saat modal terbuka.
   - Menambahkan guard `onPointerDownOutside` & `onInteractOutside` untuk elemen `[data-sonner-toaster]` pada `DialogContent` di `BudgetCategoryCard.tsx` agar klik tombol **"↩️ Batalkan (Undo)"** atau tutup toast setelah menghapus transaksi tidak menutup modal rincian secara tidak sengaja.
3. **Pengujian Otomatis Komponen:**
   - Memperbarui unit test `Fase F7` pada `frontend-phases-f7-f18.test.tsx` untuk memverifikasi keberadaan trigger modal (`data-slot="dialog-trigger"`, `aria-haspopup="dialog"`), ketiadaan daftar inline pada kartu grid, serta rendering `BudgetCategoryDetailsPanel` (termasuk status overbudget, metrik Rupiah `tabular-nums`, `TransactionSubList`, dan nol `font-mono`).

## Berkas yang Berubah

- `[MODIFIED]` `src/components/features/categories/BudgetCategoryCard.tsx` — Mengganti mekanisme dropdown rincian pos anggaran menjadi modal box (`Dialog`) dengan `BudgetCategoryDetailsPanel`.
- `[MODIFIED]` `src/components/ui/sonner.tsx` — Menambahkan `pointer-events-auto` agar toast Sonner tetap dapat diklik saat modal Radix terbuka.
- `[MODIFIED]` `src/components/features/__tests__/frontend-phases-f7-f18.test.tsx` — Memperbarui pengujian `BudgetCategoryCard` dan menambah pengujian `BudgetCategoryDetailsPanel`.

## Hasil Verifikasi

- `bun test`: **PASS** (`81 pass, 0 fail, 286 expect() calls` lintas 7 berkas uji, `535.00ms`).
- `bun run typecheck` (`tsc --noEmit`): **PASS** (0 error).
- Audit Kanonikal Tailwind v4 (`ds.canonicalizeCandidates` pada `src/**/*.{ts,tsx,js,jsx}`): **PASS** (`Total non-canonical: 0`).
- `bun run build` (`next build`): **PASS** (kompilasi Turbopack & generate 10/10 halaman statis sukses dengan peringatan advisory keamanan versi Next.js `16.4.0`).
- Uji UI Visual / Browser Manual: **NOT RUN** (menunggu verifikasi manual oleh Kenzo di desktop & mobile, light & dark mode).
