---
date: 2026-11-23
time: "19:47 WIB"
timezone: Asia/Jakarta
task: "Skenario SC-06: Shock Deficit Guard pada Penghapusan & Pengurangan Pemasukan Freelance"
prompt: "kmu kerjain trus ya sampe sc 16, tiap sc kmu git commit dulu, hanya kli ini aja aku ijinin kmu commit"
author: Antigravity
---

# Skenario SC-06: Shock Deficit Guard pada Penghapusan & Pengurangan Pemasukan Freelance

## 1. Ringkasan Perubahan

Menyelesaikan skenario kritis **SC-06** dari `docs/UNHANDLED-SCENARIOS.md`:
- **Masalah:** Ketika pemasukan tambahan freelance dicatat, sistem secara dinamis memperbesar plafon kuota `uang_bebas_tabungan` (*Dynamic Freedom Buffer*). Jika pengguna sudah membelanjakan kuota tersebut, lalu menghapus atau menurunkan nominal pemasukan freelance (misal karena klien batal bayar atau salah input), anggaran bulan berjalan dan pos Uang Bebas langsung terjun bebas ke defisit akut (*Shock Deficit*) tanpa peringatan bahaya atau konfirmasi eksplisit.
- **Solusi:**
  1. Menambahkan helper `checkShockDeficit` di `src/actions/incomes.ts` yang mengevaluasi secara atomik:
     - Apakah belanja aktual melebihi total pemasukan baru ($\text{Total Belanja} > \text{Total Pemasukan Baru}$)?
     - Apakah realisasi belanja di Uang Bebas melebihi target efektif baru ($\text{Belanja Bebas} > \text{Target Bebas Dasar} + \text{Sisa Freelance}$)?
  2. Menambahkan field `allowDeficit` pada `deleteIncomeSchema` dan `updateIncomeSchema`.
  3. Memblokir penghapusan atau pengurangan nominal pemasukan jika menyebabkan defisit dan `allowDeficit !== true`, mengembalikan kode error `SHOCK_DEFICIT:<amount>`.
  4. Menambahkan modal konfirmasi bahaya interaktif (`AlertTriangle`) di `src/components/features/incomes/IncomeSection.tsx` yang membeberkan potensi defisit riil dan mewajibkan konfirmasi eksplisit ("Tetap Hapus (Izinkan Defisit)") sebelum mengeksekusi mutasi.
  5. Menambahkan unit test di `src/actions/__tests__/incomes.test.ts`.

## 2. Berkas yang Berubah

| Berkas | Status | Alasan Perubahan |
| :--- | :--- | :--- |
| `src/schemas/income.schema.ts` | MODIFIED | Menambahkan opsi validasi `allowDeficit: z.boolean().default(false)` pada update & delete income. |
| `src/actions/incomes.ts` | MODIFIED | Menambahkan validasi `checkShockDeficit` pada `deleteIncome` dan `updateIncome`. |
| `src/components/features/incomes/IncomeSection.tsx` | MODIFIED | Menambahkan modal konfirmasi bahaya Shock Deficit dengan rincian potensi saldo minus. |
| `src/actions/__tests__/incomes.test.ts` | MODIFIED | Menambahkan unit tests untuk validasi schema dan kalkulasi shock deficit. |
| `docs/UNHANDLED-SCENARIOS.md` | MODIFIED | Memperbarui status SC-06 menjadi `COMPLETED ✅`. |
| `laporan.md` | MODIFIED | Menambahkan Checkpoint 1 SC-06 dengan status `COMPLETED ✅`. |

## 3. Hasil Verifikasi

- **Typecheck (`tsc --noEmit`):** `PASS` (0 error)
- **Unit & Integration Tests (`bun test`):** `PASS` (97 pass, 0 fail across 7 test files, 439 assertions)
- **Production Build (`bun run build`):** `PASS` (Next.js 16 Turbopack build sukses, 11/11 routes terkompilasi)
- **Design & Invariant Audit:** Bebas `font-mono` (100% `tabular-nums`), bebas emoji literal di `src/`.

## 4. Status

`COMPLETED ✅ — Approved by Kenzo (Explicit continuous batch authorization)`
