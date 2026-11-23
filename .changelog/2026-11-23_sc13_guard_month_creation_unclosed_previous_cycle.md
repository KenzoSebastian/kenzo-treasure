---
date: 2026-11-23
time: "20:15 WIB"
timezone: Asia/Jakarta
task: Skenario SC-13 — Proteksi Pembuatan Siklus Bulan Baru saat Bulan Aktif Belum Ditutup Buku
prompt: "kmu kerjain trus ya sampe sc 16, tiap sc kmu git commit dulu, hanya kli ini aja aku ijinin kmu commit, pokoknya selesai sc, commit, dengangan msg bhs inggris, selalu update ke aku, udah sampe sc berapa, jd kmu kerja in sambil update yg udah,dan yg belum sc berapa aja, gosah buru2, pikir 2x sebelum kerjain, klo kurang yakin jangan halusinasi, mending tnya aja, ayo kerjain"
author: Antigravity
---

# Skenario SC-13: Proteksi Pembuatan Siklus Bulan Baru saat Bulan Aktif Belum Ditutup Buku

## 1. Ringkasan Perubahan
Menutup celah di mana pengguna dapat membuat siklus bulan baru secara beruntun tanpa menutup buku siklus bulan sebelumnya (*lompat bulan*). Siklus bulan yang ditinggalkan tanpa tutup buku sebelumnya mengakibatkan proses sapu sisa saldo (*month sweep*) ke tabungan tidak pernah tereksekusi, serta memunculkan multi-bulan aktif simultan yang membingungkan alokasi kas. Sistem kini memverifikasi apakah terdapat bulan aktif yang belum ditutup buku dan meminta konfirmasi sadar sebelum melanjutkan.

## 2. File yang Berubah & Alasan
1. `src/schemas/month.schema.ts`:
   - Menambahkan field `allowUnclosedPrevious: z.boolean().optional().default(false)` pada `createMonthSchema`.
2. `src/actions/months.ts`:
   - Di dalam Server Action `createMonthlyCycle`:
     - Memeriksa apakah pengguna memiliki siklus bulan yang berstatus `isClosed = false`.
     - Jika ditemukan dan `allowUnclosedPrevious === false`, menolak eksekusi dan mengembalikan pesan edukatif: `Siklus "[Nama Bulan]" belum ditutup buku. Tutup buku bulan tersebut terlebih dahulu agar saldo disapu ke tabungan, atau konfirmasi untuk tetap membuat bulan baru.`
3. `src/components/features/months/CreateMonthDialog.tsx`:
   - Menangkap pesan peringatan bulan belum ditutup buku dan menampilkan banner konfirmasi khusus dengan tombol aksi sadar *"Tetap Buat (Lompati Tutup Buku)"*.
4. `src/actions/__tests__/months.test.ts`:
   - Menambahkan unit test untuk SC-13 yang memvalidasi skema input `allowUnclosedPrevious` dan memastikan pembuatan siklus baru diblokir saat bulan lama belum ditutup kecuali ada konfirmasi eksplisit.

## 3. Hasil Verifikasi
- `tsc --noEmit`: PASS (0 errors)
- `bun test`: PASS (104 pass, 0 fail, 464 assertions)
- `bun run build`: PASS (Turbopack, 11/11 routes dynamic/static rendered cleanly)
- Zero `font-mono` & zero literal emojis: PASS

## 4. Status
- `COMPLETED ✅ — Authorized by Kenzo for batch commit`
