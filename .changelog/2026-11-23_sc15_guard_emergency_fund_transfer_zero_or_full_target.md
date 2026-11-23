---
date: 2026-11-23
time: "20:19 WIB"
timezone: Asia/Jakarta
task: Skenario SC-15 — Proteksi Transfer Brankas Dana Darurat saat Target Rp 0 atau Sudah 100% Tercapai
prompt: "kmu kerjain trus ya sampe sc 16, tiap sc kmu git commit dulu, hanya kli ini aja aku ijinin kmu commit, pokoknya selesai sc, commit, dengangan msg bhs inggris, selalu update ke aku, udah sampe sc berapa, jd kmu kerja in sambil update yg udah,dan yg belum sc berapa aja, gosah buru2, pikir 2x sebelum kerjain, klo kurang yakin jangan halusinasi, mending tnya aja, ayo kerjain"
author: Antigravity
---

# Skenario SC-15: Proteksi Transfer Brankas Dana Darurat saat Target Rp 0 atau Sudah 100% Tercapai

## 1. Ringkasan Perubahan
Menutup celah di mana pengguna yang belum menentukan target dana darurat (`emergencyFundTarget = 0`) atau sudah mencapai 100% target ideal tidak sengaja memindahkan saldo tabungan bebas ke brankas dana darurat. Sistem kini menerapkan *guard* otomatis: menolak transfer jika target masih Rp 0 (edukasi menentukan target terlebih dahulu) dan meminta konfirmasi sadar (`allowOverTarget`) jika target sudah terpenuhi 100%.

## 2. File yang Berubah & Alasan
1. `src/schemas/savings.schema.ts`:
   - Menambahkan field `allowOverTarget: z.boolean().optional().default(false)` pada `transferEmergencyFundSchema`.
2. `src/actions/savings.ts`:
   - Di dalam Server Action `transferToEmergencyFund`:
     - Menambahkan validasi `account.emergencyFundTarget <= 0`: melempar error `TARGET_ZERO` jika target belum ditentukan.
     - Menambahkan validasi `account.emergencyFundBalance >= account.emergencyFundTarget && !allowOverTarget`: melempar error `TARGET_ALREADY_REACHED` jika target sudah 100% dan belum ada konfirmasi penambahan cadangan ekstra.
     - Mengembalikan pesan ramah pengguna informatif pada blok `catch`.
3. `src/components/features/savings/EmergencyVaultCard.tsx`:
   - Menampilkan banner edukatif peringatan jika target masih Rp 0.
   - Menampilkan banner selebrasi 100% dan checkbox konfirmasi sadar *"Saya ingin tetap menambah cadangan ekstra di atas 100%"* jika target sudah tercapai.
4. `src/actions/__tests__/backend-phases-b7-b13.test.ts`:
   - Menambahkan unit test untuk SC-15 yang memvalidasi skema `allowOverTarget`, memblokir transfer saat target Rp 0, dan memblokir transfer di atas 100% tanpa konfirmasi sadar.

## 3. Hasil Verifikasi
- `tsc --noEmit`: PASS (0 errors)
- `bun test`: PASS (105 pass, 0 fail, 471 assertions)
- `bun run build`: PASS (Turbopack, 11/11 routes dynamic/static rendered cleanly)
- Zero `font-mono` & zero literal emojis: PASS

## 4. Status
- `COMPLETED ✅ — Authorized by Kenzo for batch commit`
