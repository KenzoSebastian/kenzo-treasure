---
date: 2026-11-15
time: "19:30 WIB"
timezone: Asia/Jakarta
task: Perbaikan Tata Letak Card Template Pos Anggaran (2 Baris), Mode Awal Kosong, dan Tombol Tambah Lebar Penuh
prompt: "tolong bagian card card pos ini terlalu sempit, bikin 2 baris aja, trus juga jangan ada 6 template netral, jadi bener2 dari kosong, nnti user input sendiri, trus tombol tambah baris pos anggaran lebar nya full"
author: Antigravity
---

# Perbaikan Layout Card Template Pos Anggaran Onboarding Wizard

## Ringkasan Perubahan
1. **Tata Letak 2 Baris per Card Pos Anggaran (Onboarding Wizard Langkah 2):**
   - **Baris 1:** Memisahkan pemilihan ikon (`AppCategoryIcon` + button picker), input nama pos anggaran (`flex-1 min-w-0`), dan tombol hapus (`Trash2`) sehingga nama pos anggaran dapat diketik panjang tanpa terpotong atau terdesak.
   - **Baris 2:** Menempatkan `SlidingSegmentedControl` kelompok pos (`Pos Wajib`, `Kebutuhan`, `Uang Bebas`) di sisi kiri secara lapang dan input target anggaran / badge otomatis `uang_bebas_tabungan` di sisi kanan (`w-full sm:w-56 tabular-nums text-right`).
   - **Baris 3 (Expandable):** Menjaga `IconPicker` tetap dapat dibuka langsung di bawah card secara mulus saat ikon diklik.
2. **Inisialisasi Mulai dari Kosong (Zero Default Neutral Templates):**
   - Mengubah nilai awal `templates` menjadi array kosong `[]` (tidak lagi otomatis memuat 6 preset netral 50/30/20).
   - Menghapus tombol toggle `6 Template Netral` dan `Mulai dari Kosong` dari header Langkah 2 agar alur onboarding murni dimulai dari kanvas kosong yang diinput sendiri oleh pengguna.
   - Menambahkan visual *empty state* yang informatif dan estetik ketika daftar template masih kosong.
3. **Tombol Tambah Baris Pos Anggaran Lebar Penuh (`w-full`):**
   - Mengubah tombol `+ Tambah Baris Pos Anggaran` menjadi `w-full h-10` dengan styling border dashed responsif dan ikon plus terpusat.

## Berkas yang Diubah
- `[MODIFIED] src/components/features/onboarding/OnboardingWizard.tsx` — Memisahkan layout card menjadi 2 baris terpisah, mengosongkan state default template, dan memperlebar tombol tambah pos menjadi full-width.

## Verifikasi
- `bun test`: PASS (87 pass, 0 fail across 7 files).
- `bun run typecheck`: PASS (0 errors).
- `bun run build`: PASS (Next.js 16.4.0 Turbopack clean build).
- `font-mono audit`: PASS (100% sans-serif dengan `tabular-nums`, 0 monospace).

## Status
COMPLETED ✅ — Approved by Kenzo (2026-11-15 20:52 WIB)
