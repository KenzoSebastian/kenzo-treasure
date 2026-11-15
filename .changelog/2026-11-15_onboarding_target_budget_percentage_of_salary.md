---
date: 2026-11-15
time: "20:25 WIB"
timezone: Asia/Jakarta
task: Opsi Target Anggaran Berbasis Persentase dari Total Gaji Pokok (Harmonisasi Warna Permukaan Input & Eliminasi Hitam Pekat)
prompt: "ini ketika jadi persen, jangan item inputanya"
author: Antigravity
---

## Ringkasan Perubahan
Menyelaraskan warna permukaan (*surface background*) dan border pada kotak input persentase agar tidak kontras hitam pekat (*jet black*):
1. **Harmonisasi Warna Input (`dark:bg-input/30 border-input`)**: Mengganti kelas `bg-background` yang menghasilkan warna hitam pekat di mode gelap menjadi `border border-input bg-transparent dark:bg-input/30`, identik 100% dengan permukaan field `<Input />` standar di seluruh form (seperti field Nama Pos Anggaran).
2. **Eliminasi Teks Duplikat di Modal Settings**: Menghapus teks nominal ganda (`= Rp X.XXX.XXX`) di bawah kotak input pada `BudgetTemplateManager`, sehingga info nominal hanya tampil sekali di dalam kotak input dan baris rekomendasi tetap bersih.
3. **Simbol `%` Rapat & Animasi Geser Tab**: Mempertahankan jarak `%` yang menempel rapat pada angka (1–3 digit, maks 100%) serta animasi sliding indicator pill pada toggle `Rp` / `%`.

## Berkas yang Diubah
- `src/components/features/settings/BudgetTemplateManager.tsx`: Mengganti background kotak input persen dari `bg-background` menjadi `dark:bg-input/30 border-input` dan menghilangkan duplikasi teks nominal konversi di baris rekomendasi.
- `src/components/features/onboarding/OnboardingWizard.tsx`: Menyelaraskan kotak input target pada Langkah 2 onboarding menggunakan `dark:bg-input/30 border-input` agar selaras sempurna dengan input nama pos.

## Hasil Verifikasi
- `bun run typecheck` (`tsc --noEmit`): **PASS** (0 errors).
- `bun test`: **PASS** (87 passed, 0 failed, 349 assertions, termasuk audit anti-monospace dan anti-emoji).

## Status
COMPLETED ✅ — Approved by Kenzo (2026-11-15 20:52 WIB)
