---
date: 2026-11-23
time: "19:56 WIB"
timezone: Asia/Jakarta
task: "Skenario SC-09: Pencegahan Pos Hantu (Ghost Categories) pada Siklus Bulan Depan saat Menghapus Cicilan"
prompt: "kmu kerjain trus ya sampe sc 16, tiap sc kmu git commit dulu, hanya kli ini aja aku ijinin kmu commit"
author: Antigravity
---

# Skenario SC-09: Pencegahan Pos Hantu (Ghost Categories) pada Siklus Bulan Depan saat Menghapus Cicilan

## 1. Ringkasan Perubahan

Menyelesaikan skenario **SC-09** dari `docs/UNHANDLED-SCENARIOS.md`:
- **Masalah:** Ketika pengguna menghapus cicilan di tengah bulan setelah membayar angsuran di bulan berjalan, sistem melepaskan relasi pos anggaran terkait (`liabilityId = null`) agar riwayat transaksi tetap aman. Namun pada implementasi sebelumnya, kolom `isTemporary` diubah menjadi `false`. Akibatnya, generator bulan depan (`month-generator.ts`) menganggap pos tersebut sebagai "Pos Operasional Reguler Permanen", sehingga pos cicilan yang sudah dihapus akan terus muncul kembali (*ghost categories*) di setiap bulan baru.
- **Solusi:**
  1. Pada Server Action `deleteLiability` (`src/actions/liabilities.ts`), pertahankan `isTemporary: true` saat melepas `liabilityId: null` pada pos yang memiliki transaksi:
     ```ts
     await tx
       .update(budgetCategories)
       .set({
         liabilityId: null,
         isTemporary: true,
         updatedAt: new Date(),
       })
       .where(eq(budgetCategories.id, linkedCat.id));
     ```
  2. Dengan `isTemporary: true` tanpa `liabilityId`, generator siklus bulan baru (`month-generator.ts`) secara otomatis melewati pos tersebut dan merelokasikan anggarannya ke `uang_bebas_tabungan` tanpa meninggalkan pos hantu.
  3. Menambahkan unit test di `src/actions/__tests__/backend-phases-b7-b13.test.ts`.

## 2. Berkas yang Berubah

| Berkas | Status | Alasan Perubahan |
| :--- | :--- | :--- |
| `src/actions/liabilities.ts` | MODIFIED | Mempertahankan `isTemporary: true` pada `deleteLiability` saat melepas keterikatan pos cicilan yang memiliki riwayat transaksi. |
| `src/actions/__tests__/backend-phases-b7-b13.test.ts` | MODIFIED | Menambahkan unit test verifikasi penandaan `isTemporary: true` untuk memblokir pewarisan pos hantu. |
| `docs/UNHANDLED-SCENARIOS.md` | MODIFIED | Memperbarui status SC-09 menjadi `COMPLETED ✅`. |
| `laporan.md` | MODIFIED | Menambahkan Checkpoint 1 SC-09 dengan status `COMPLETED ✅`. |

## 3. Hasil Verifikasi

- **Typecheck (`tsc --noEmit`):** `PASS` (0 error)
- **Unit & Integration Tests (`bun test`):** `PASS` (100 pass, 0 fail across 7 test files, 444 assertions)
- **Production Build (`bun run build`):** `PASS` (Next.js 16 Turbopack build sukses, 11/11 routes terkompilasi)
- **Design & Invariant Audit:** Bebas `font-mono` (100% `tabular-nums`), bebas emoji literal di `src/`.

## 4. Status

`COMPLETED ✅ — Approved by Kenzo (Explicit continuous batch authorization)`
