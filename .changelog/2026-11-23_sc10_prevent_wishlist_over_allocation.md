---
date: 2026-11-23
time: "20:01 WIB"
timezone: Asia/Jakarta
task: Skenario SC-10 — Proteksi Alokasi Wishlist Melebihi Sisa Kebutuhan (Over-Allocation Guard)
prompt: "kmu kerjain trus ya sampe sc 16, tiap sc kmu git commit dulu, hanya kli ini aja aku ijinin kmu commit, pokoknya selesai sc, commit, dengangan msg bhs inggris, selalu update ke aku, udah sampe sc berapa, jd kmu kerja in sambil update yg udah,dan yg belum sc berapa aja, gosah buru2, pikir 2x sebelum kerjain, klo kurang yakin jangan halusinasi, mending tnya aja, ayo kerjain"
author: Antigravity
---

# Skenario SC-10: Proteksi Alokasi Wishlist Melebihi Sisa Kebutuhan (Over-Allocation Guard)

## 1. Ringkasan Perubahan
Menutup celah di mana pengguna dapat mengalokasikan dana dari Saldo Tabungan Bebas ke barang impian melebihi sisa kekurangan kebutuhan barang tersebut (`amount > targetAmount - savedAmount`). Hal ini sebelumnya menyebabkan persentase terkumpul melebihi 100% dan menyandera likuiditas tabungan bebas yang sebenarnya dapat digunakan untuk pos atau barang impian lain.

## 2. File yang Berubah & Alasan
1. `src/actions/wishlists.ts`:
   - Menambahkan import `formatRupiah` dari `@/lib/financial-calculations`.
   - Di dalam `allocateSavings` (transaksi atomik database):
     - Menghitung `remainingNeeded = Math.max(0, targetWishlist.targetAmount - targetWishlist.savedAmount)`.
     - Melempar error `WISHLIST_ALREADY_FULFILLED` jika `remainingNeeded <= 0`.
     - Melempar error `OVER_ALLOCATION:${remainingNeeded}` jika `amount > remainingNeeded`.
     - Menangkap error di blok `catch` dan mengembalikan pesan informatif ramah pengguna dengan nominal sisa kebutuhan.
2. `src/components/features/wishlists/AllocateWishlistDrawer.tsx`:
   - Menambahkan validasi client-side instan sebelum mutasi dijalankan: jika `mode === "allocate"` dan `numericAmount > remainingNeeded`, menampilkan pesan error `Nominal alokasi melebihi sisa kebutuhan barang impian ini (Rp xxx)`.
3. `src/actions/__tests__/backend-phases-b7-b13.test.ts`:
   - Menambahkan unit test untuk SC-10 yang memverifikasi penolakan over-allocation saat nominal melebihi sisa kebutuhan barang impian.

## 3. Hasil Verifikasi
- `tsc --noEmit`: PASS (0 errors)
- `bun test`: PASS (101 pass, 0 fail, 447 assertions)
- `bun run build`: PASS (Turbopack, 11/11 routes dynamic/static rendered cleanly)
- Zero `font-mono` & zero literal emojis: PASS

## 4. Status
- `COMPLETED ✅ — Authorized by Kenzo for batch commit`
