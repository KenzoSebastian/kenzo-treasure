---
date: 2026-11-23
time: "20:07 WIB"
timezone: Asia/Jakarta
task: Skenario SC-11 — Fitur Edit & Hapus Wishlist dengan Penyelamatan Dana Otomatis (Auto-Refund)
prompt: "kmu kerjain trus ya sampe sc 16, tiap sc kmu git commit dulu, hanya kli ini aja aku ijinin kmu commit, pokoknya selesai sc, commit, dengangan msg bhs inggris, selalu update ke aku, udah sampe sc berapa, jd kmu kerja in sambil update yg udah,dan yg belum sc berapa aja, gosah buru2, pikir 2x sebelum kerjain, klo kurang yakin jangan halusinasi, mending tnya aja, ayo kerjain"
author: Antigravity
---

# Skenario SC-11: Fitur Edit & Hapus Wishlist dengan Penyelamatan Dana Otomatis (Auto-Refund)

## 1. Ringkasan Perubahan
Menutup celah ketiadaan fitur pembaruan dan penghapusan barang impian (`wishlists`), serta mencegah risiko dana tersandera (*orphaned funds*). Ketika barang impian yang belum dibeli dihapus, sistem secara atomik mengembalikan seluruh dana terkumpul (`savedAmount`) ke Saldo Tabungan Bebas (`savings_account.balance`), menjaga saldo kas fisik tetap utuh tanpa menguap.

## 2. File yang Berubah & Alasan
1. `src/schemas/wishlist.schema.ts`:
   - Menambahkan kontrak validasi `deleteWishlistSchema` (`wishlistId: uuid`).
   - Mengekspor tipe inferensi `DeleteWishlistInput`.
2. `src/actions/wishlists.ts`:
   - Mengimplementasikan Server Action `updateWishlist`:
     - Memvalidasi target nominal baru: dilarang lebih kecil dari dana yang sudah terkumpul (`targetAmount >= savedAmount`).
     - Mengunci modifikasi jika barang sudah berstatus terbeli (`isPurchased = true`).
     - Memperbarui nama, ikon, target harga, dan foto WebP secara atomik.
   - Mengimplementasikan Server Action `deleteWishlist`:
     - Di dalam `db.transaction`, jika barang belum dibeli dan memiliki `savedAmount > 0`, sistem secara atomik merefund saldo tersebut ke `savings_account.balance`.
     - Menghapus riwayat alokasi terkait di `wishlist_allocations`.
     - Menghapus baris barang impian dari `wishlists`.
3. `src/components/features/wishlists/WishlistCard.tsx`:
   - Menambahkan tombol aksi Ubah (Pencil) dan Hapus (Trash2) pada sudut foto barang impian.
   - Menyediakan Modal `Dialog` Ubah Barang Impian dengan `IconPicker` dan validasi instan.
   - Menyediakan Modal `Dialog` Konfirmasi Hapus dengan banner transparansi penyelamatan dana otomatis ke Saldo Tabungan Bebas.
4. `src/actions/__tests__/backend-phases-b7-b13.test.ts`:
   - Menambahkan unit test untuk SC-11: memvalidasi skema update & delete, memvalidasi penolakan target baru < dana terkumpul, dan memverifikasi perhitungan auto-refund ke tabungan bebas.

## 3. Hasil Verifikasi
- `tsc --noEmit`: PASS (0 errors)
- `bun test`: PASS (102 pass, 0 fail, 451 assertions)
- `bun run build`: PASS (Turbopack, 11/11 routes dynamic/static rendered cleanly)
- Zero `font-mono` & zero literal emojis: PASS

## 4. Status
- `COMPLETED ✅ — Authorized by Kenzo for batch commit`
