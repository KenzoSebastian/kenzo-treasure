---
date: 2026-11-22
time: "20:21 WIB"
timezone: Asia/Jakarta
task: "Skenario 1: Penanda Status 'Sudah Dibayar Bulan Ini' & Fitur Bayar Ekstra (Percepatan Pokok) dari Uang Bebas"
prompt: "skenario 1 dulu aja, jadi klo udah dibayar bulan ini , kasih keterangan sudah bayar, tapi nnti bisa bayar lagi klo mau, tapi itu motong uang bebas berarti, nnti ada di rincian uang bebas, tapi klo sisa uang bebas tidak cukup sama cicilannya ya itu gabisa"
author: Antigravity
---

# Skenario 1: Penanda Status "Sudah Dibayar Bulan Ini" & Fitur Bayar Ekstra dari Uang Bebas

## Ringkasan Perubahan

Mengimplementasikan **Skenario 1 (Pembayaran Cicilan Bulan Ini & Opsi Bayar Ekstra / Percepatan Pokok)** pada pelacakan cicilan (`liabilities`) dan integrasinya dengan pos anggaran bulanan:
1. **Penanda Status "Sudah Dibayar Bulan Ini":**
   - Bila cicilan bulan berjalan sudah dibayar (pos cicilan mencapai realisasi $\ge$ target), kartu cicilan di `LiabilityTrackerCard` otomatis menampilkan badge positif **`Sudah Dibayar Bulan Ini`** (hijau emerald dengan ikon `CheckCircle2`).
2. **Fitur Bayar Ekstra (Percepatan Pokok):**
   - Tombol berubah menjadi **`Bayar Ekstra <Nominal>`** dengan ikon `Sparkles`.
   - Pembayaran ekstra tidak membuat pos cicilan menjadi overbudget, melainkan **dipotong langsung dari pos `Uang Bebas / Tabungan`**.
   - Transaksi tercatat pada pos `Uang Bebas / Tabungan` dengan deskripsi bersih: `Percepatan Cicilan <Nama Cicilan>`.
   - Secara atomik memperbarui tabel `liabilities` (`paidAmount` bertambah, `remainingAmount` berkurang, dan otomatis lunas `isSettled = true` jika sisa pokok lunas).
3. **Validasi Ketersediaan Sisa Uang Bebas:**
   - Jika sisa kuota Uang Bebas (`freeBudgetRemaining`) kurang dari nominal tagihan cicilan, tombol Bayar Ekstra otomatis di-disable (*not-allowed*) dengan teks pendamping: *"Sisa Uang Bebas (Rp ...) tidak cukup untuk bayar ekstra"*.
   - Server Action `recordInstallmentPayment` memvalidasi ketersediaan saldo Uang Bebas secara atomik dengan penguncian baris (`FOR UPDATE`), menolak mutasi jika kuota tidak mencukupi (`INSUFFICIENT_FREE_BUDGET_EXTRA`).
   - Mencegah pembayaran reguler ganda jika pos cicilan sudah terbayar penuh (`INSTALLMENT_ALREADY_PAID_THIS_MONTH`).
4. **Rekonsiliasi Hapus / Undo Transaksi Bayar Ekstra:**
   - Menghubungkan pelacakan referensi cicilan pada transaksi pembayaran ekstra (`[ref:liability:<uuid>]`).
   - Bila transaksi pembayaran ekstra dihapus (soft delete) atau dipulihkan (undo restore) di Rincian Uang Bebas (`TransactionSubList`), `paidAmount` dan `isSettled` pada tabel `liabilities` direkonsiliasi otomatis secara atomik.
   - Tag internal dibersihkan dari tampilan antarmuka pengguna (`TransactionSubList`, toast, dan modal konfirmasi).

---

## File yang Berubah

| Path File | Jenis Perubahan | Deskripsi & Alasan |
| :--- | :--- | :--- |
| `src/schemas/liability.schema.ts` | MODIFIED | Menambahkan opsi `isExtraPayment: z.boolean().optional().default(false)` pada `recordInstallmentSchema`. |
| `src/actions/liabilities.ts` | MODIFIED | Menambahkan logika pembayaran ekstra yang memotong pos `uang_bebas_tabungan` secara atomik, validasi sisa kuota uang bebas, serta pencegahan pembayaran ganda di jalur reguler. |
| `src/actions/transactions.ts` | MODIFIED | Menambahkan rekonsiliasi atomik `paidAmount` dan `isSettled` pada tabel `liabilities` saat transaksi pembayaran ekstra di pos Uang Bebas dihapus (*soft delete*) atau dipulihkan (*restore*). |
| `src/components/features/transactions/TransactionSubList.tsx` | MODIFIED | Memfilter tag metadata internal `[ref:liability:...]` dari deskripsi transaksi pada daftar rincian, toast notifikasi, aria-label, dan modal konfirmasi. |
| `src/types/liability.ts` | MODIFIED | Menambahkan prop `paidLiabilityIds?: string[]` pada `LiabilityTrackerCardProps`. |
| `src/app/(dashboard)/dashboard/(overview)/page.tsx` | MODIFIED | Menghitung `paidLiabilityIds` dari pos anggaran aktif yang memiliki `liabilityId` dan `spent >= target`, lalu meneruskannya ke `<LiabilityTrackerCard />`. |
| `src/components/features/liabilities/LiabilityTrackerCard.tsx` | MODIFIED | Menampilkan badge `Sudah Dibayar Bulan Ini`, tombol `Bayar Ekstra`, validasi disable sisa Uang Bebas tidak cukup, dan dialog modal konfirmasi khusus pembayaran ekstra. |
| `src/schemas/__tests__/schemas.test.ts` | MODIFIED | Menambahkan pengujian validasi Zod untuk `isExtraPayment` (default `false` dan validasi `true`). |
| `src/components/features/__tests__/frontend-phases-f7-f18.test.tsx` | MODIFIED | Menambahkan unit test untuk badge `Sudah Dibayar Bulan Ini`, tombol `Bayar Ekstra`, kondisi disabled sisa Uang Bebas tidak cukup, dan pembersihan tag ref di `TransactionSubList`. |

---

## Hasil Verifikasi Kualitas

- **Typecheck (`tsc --noEmit`):** `PASS` (0 error).
- **Unit & Integration Tests (`bun test`):** `PASS` (89/89 tests lulus, 396 expect calls across 7 test files).
- **Production Build (`bun run build` Turbopack Next.js 16.4.6):** `PASS` (11/11 routes terkompilasi sempurna).
- **Invarian Tipografi & Desain:**
  - `font-mono` = 0 (100% menggunakan `tabular-nums` pada seluruh angka Rupiah dan tenor).
  - Emoji literal di `src/` = 0 (100% menggunakan ikon Lucide semantik `CheckCircle2` dan `Sparkles`).

---

## Status Implementasi

`COMPLETED ✅ — Approved by Kenzo (2026-11-22 20:28 WIB)`.
