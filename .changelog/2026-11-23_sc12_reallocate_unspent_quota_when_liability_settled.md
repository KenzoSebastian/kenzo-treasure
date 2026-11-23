---
date: 2026-11-23
time: "20:11 WIB"
timezone: Asia/Jakarta
task: Skenario SC-12 — Realokasi Kuota Belanja saat Cicilan Dilunasi di Bulan Berjalan
prompt: "kmu kerjain trus ya sampe sc 16, tiap sc kmu git commit dulu, hanya kli ini aja aku ijinin kmu commit, pokoknya selesai sc, commit, dengangan msg bhs inggris, selalu update ke aku, udah sampe sc berapa, jd kmu kerja in sambil update yg udah,dan yg belum sc berapa aja, gosah buru2, pikir 2x sebelum kerjain, klo kurang yakin jangan halusinasi, mending tnya aja, ayo kerjain"
author: Antigravity
---

# Skenario SC-12: Realokasi Kuota Belanja saat Cicilan Dilunasi di Bulan Berjalan

## 1. Ringkasan Perubahan
Menutup celah di mana ketika cicilan ditandai lunas (`isSettled = true`) di tengah bulan berjalan, pos anggaran cicilan terkait sebelumnya tetap menahan plafon anggaran normal (`targetBudget = monthlyPayment`). Sisa anggaran yang belum dibelanjakan tersebut sebelumnya tersandera menganggur. Dengan perbaikan ini, sistem secara atomik mendeteksi realisasi belanja aktual pada pos tersebut (`spent`), menyetel `targetBudget = spent`, dan mengembalikan seluruh sisa kuota yang belum terpakai (`unspent = targetBudget - spent`) ke `uang_bebas_tabungan` di bulan yang sama.

## 2. File yang Berubah & Alasan
1. `src/schemas/liability.schema.ts`:
   - Menambahkan field opsional `isSettled: z.boolean().optional()` pada `updateLiabilitySchema`.
2. `src/actions/liabilities.ts`:
   - Di dalam Server Action `updateLiability`:
     - Memperbarui `isSettled` dan memastikan `paidAmount` diselaraskan ke `totalAmount` jika ditandai lunas.
     - Memeriksa seluruh pos anggaran terkait di siklus bulan yang masih terbuka (`months.isClosed = false`).
     - Jika `nextIsSettled === true`: menghitung transaksi belanja aktual yang sudah keluar (`spent`), menyetel target pos cicilan menjadi sama dengan `spent` (atau Rp 0 jika belum ada belanja), dan menambahkan sisa kuota `unspent` ke `uang_bebas_tabungan` secara atomik di dalam transaksi database (`FOR UPDATE`).
3. `src/components/features/liabilities/LiabilityTrackerCard.tsx`:
   - Menambahkan checkbox *"Tandai cicilan ini lunas sekarang"* pada dialog form ubah cicilan dengan catatan informatif bahwa sisa kuota akan langsung dikembalikan ke Uang Bebas.
4. `src/actions/__tests__/backend-phases-b7-b13.test.ts`:
   - Menambahkan unit test untuk SC-12 yang memverifikasi skema penerimaan `isSettled` dan kalkulasi realokasi dana menganggur ke Uang Bebas (baik saat belanja Rp 0 maupun saat sudah terpakai sebagian).

## 3. Hasil Verifikasi
- `tsc --noEmit`: PASS (0 errors)
- `bun test`: PASS (103 pass, 0 fail, 458 assertions)
- `bun run build`: PASS (Turbopack, 11/11 routes dynamic/static rendered cleanly)
- Zero `font-mono` & zero literal emojis: PASS

## 4. Status
- `COMPLETED ✅ — Authorized by Kenzo for batch commit`
