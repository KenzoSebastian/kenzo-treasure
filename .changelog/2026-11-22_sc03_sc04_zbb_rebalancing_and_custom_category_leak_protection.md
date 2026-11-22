---
date: 2026-11-22
time: "22:03 WIB"
timezone: Asia/Jakarta
task: "Skenario SC-03 & SC-04 — Zero-Based Budgeting Rebalancing & Custom Category Leak Protection"
prompt: "oke kerjain sc 3 dan 4 dulu"
author: Antigravity
---

# Skenario SC-03 & SC-04 — Zero-Based Budgeting Rebalancing & Custom Category Leak Protection

## Ringkasan Perubahan
Menuntaskan dua celah integritas Zero-Based Budgeting (ZBB) pada modul manajemen pos anggaran (`src/actions/categories.ts`):
1. **SC-03 (ZBB Drift pada Edit Target Pos):**
   - Sebelumnya, saat pengguna menaikkan atau menurunkan `targetBudget` pada pos anggaran reguler, sistem tidak menyesuaikan kuota pos `uang_bebas_tabungan`. Akibatnya, jika target dinaikkan, total plafon belanja bulanan membengkak melampaui pemasukan gaji. Sebaliknya jika target diturunkan, sisa kelebihan anggaran hilang dan tidak kembali ke Uang Bebas.
   - **Solusi Konservasi Zero-Sum:** Seluruh mutasi `updateCategoryTarget` dibungkus dalam `db.transaction` dengan *row-level locking* (`FOR UPDATE`) pada pos target dan pos `uang_bebas_tabungan`.
     - Jika target dinaikkan ($\Delta > 0$): Sistem memverifikasi ketersediaan kuota Uang Bebas yang belum dibelanjakan. Jika cukup, kuota Uang Bebas dipotong sebesar $\Delta$. Jika tidak cukup, aksi ditolak dengan pesan edukatif transparan.
     - Jika target diturunkan ($\Delta < 0$): Sistem memvalidasi target baru tidak boleh lebih rendah dari pengeluaran yang telah terealisasi di pos tersebut. Selisih $|\Delta|$ otomatis dikembalikan untuk menambah kuota `uang_bebas_tabungan`.
2. **SC-04 (ZBB Leak pada Penambahan Pos Kustom):**
   - Sebelumnya, `addCustomCategory` membuat pos baru dengan plafon `targetBudget` tanpa memotong dari pos Uang Bebas.
   - **Solusi ZBB Conservation:** Pembuatan pos kustom baru dengan `targetBudget > 0` wajib memotong kuota dari `uang_bebas_tabungan` secara atomik di dalam transaksi database yang sama, dan menolak penambahan jika kuota Uang Bebas tidak mencukupi.

## Berkas yang Diubah & Alasan
1. `src/actions/categories.ts` (MODIFIED):
   - Menerapkan transaksi atomik dan rebalancing kuota Uang Bebas pada Server Action `updateCategoryTarget` (SC-03) dan `addCustomCategory` (SC-04).
   - Menambahkan penolakan perubahan langsung pada pos `uang_bebas_tabungan` (karena pos ini bertindak sebagai penyeimbang ZBB otomatis).
2. `src/actions/__tests__/backend-phases-b7-b13.test.ts` (MODIFIED):
   - Menambahkan pengujian invariant ZBB SC-03 & SC-04: verifikasi konservasi zero-sum pada kenaikan target, penurunan target, penolakan defisit, validasi batas belanja realisasi, dan penambahan pos kustom baru.
3. `docs/UNHANDLED-SCENARIOS.md` (MODIFIED):
   - Memperbarui status SC-03 dan SC-04 menjadi `IMPLEMENTED — AWAITING APPROVAL`.

## Hasil Verifikasi
- `bun run typecheck`: **PASS** (0 errors).
- `bun test`: **PASS** (92 pass, 0 fail, 425 expect calls across 7 test files).
- `bun run build`: **PASS** (Turbopack, 11/11 routes).
- Kepatuhan Desain: 0 `font-mono`, 100% `tabular-nums`, 0 literal emojis.

## Status Implementasi
- Status: `COMPLETED ✅ — Approved by Kenzo (2026-11-22 22:05 WIB)`
