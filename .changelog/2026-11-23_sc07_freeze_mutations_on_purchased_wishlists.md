---
date: 2026-11-23
time: "19:51 WIB"
timezone: Asia/Jakarta
task: "Skenario SC-07: Hard Freeze Mutasi Tabungan pada Barang Impian Berstatus Terbeli"
prompt: "kmu kerjain trus ya sampe sc 16, tiap sc kmu git commit dulu, hanya kli ini aja aku ijinin kmu commit"
author: Antigravity
---

# Skenario SC-07: Hard Freeze Mutasi Tabungan pada Barang Impian Berstatus Terbeli

## 1. Ringkasan Perubahan

Menyelesaikan skenario kritis **SC-07** dari `docs/UNHANDLED-SCENARIOS.md`:
- **Masalah:** Ketika barang impian mencapai 100% dan ditandai terbeli (`isPurchased = true`), uang tabungan secara fisik dan riil telah dibelanjakan di toko. Pada implementasi lama, Server Actions `allocateSavings` dan `withdrawFromWishlist` belum memvalidasi flag `isPurchased`. Jika dipanggil kembali, sistem akan menarik uang dari wishlist dan mengembalikannya ke `savings_account.balance`, menciptakan saldo tabungan bebas fiktif (*magic money*) dari uang yang sesungguhnya sudah habis terbelanja.
- **Solusi:**
  1. Menambahkan validasi ketat (*hard freeze*) di dalam transaksi atomik pada Server Actions `allocateSavings` dan `withdrawFromWishlist`:
     `if (targetWishlist.isPurchased) throw new Error("WISHLIST_ALREADY_PURCHASED");`
  2. Mengembalikan respons edukatif terpisah untuk alokasi maupun penarikan dana agar pengguna paham bahwa barang yang sudah dibeli terkunci permanen.
  3. Menambahkan unit test di `src/actions/__tests__/backend-phases-b7-b13.test.ts`.

## 2. Berkas yang Berubah

| Berkas | Status | Alasan Perubahan |
| :--- | :--- | :--- |
| `src/actions/wishlists.ts` | MODIFIED | Memvalidasi `isPurchased` pada `allocateSavings` dan `withdrawFromWishlist`, melempar `WISHLIST_ALREADY_PURCHASED`. |
| `src/actions/__tests__/backend-phases-b7-b13.test.ts` | MODIFIED | Menambahkan unit test verifikasi pemblokiran mutasi pada wishlist terbeli. |
| `docs/UNHANDLED-SCENARIOS.md` | MODIFIED | Memperbarui status SC-07 menjadi `COMPLETED ✅`. |
| `laporan.md` | MODIFIED | Menambahkan Checkpoint 1 SC-07 dengan status `COMPLETED ✅`. |

## 3. Hasil Verifikasi

- **Typecheck (`tsc --noEmit`):** `PASS` (0 error)
- **Unit & Integration Tests (`bun test`):** `PASS` (98 pass, 0 fail across 7 test files, 441 assertions)
- **Production Build (`bun run build`):** `PASS` (Next.js 16 Turbopack build sukses, 11/11 routes terkompilasi)
- **Design & Invariant Audit:** Bebas `font-mono` (100% `tabular-nums`), bebas emoji literal di `src/`.

## 4. Status

`COMPLETED ✅ — Approved by Kenzo (Explicit continuous batch authorization)`
