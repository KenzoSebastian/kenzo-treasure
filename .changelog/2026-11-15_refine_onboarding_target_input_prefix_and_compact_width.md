---
date: 2026-11-15
time: "19:53 WIB"
timezone: Asia/Jakarta
task: Penyesuaian Kolom Input Nominal Pos Anggaran Onboarding (Lebar Kompak, Rata Kiri & Prefix Target Rp)
prompt: "lalu untuk input nominalnya uang yang di pos kan itu, pendekin lebarnya, rata kiri tulisannya, lalu bagian kiri input ada tulisan nya, kyk 'nominal: Rp.' atau apa ya ?? biar jelas ituinputan apa gtulohh"
author: Antigravity
---

# Penyesuaian Input Nominal Pos Anggaran Wizard Onboarding

## Ringkasan Perubahan
1. **Lebar Kompak & Presisi (`w-full sm:w-48`):**
   - Memendekkan lebar wadah input nominal dari `sm:w-56` (224px) menjadi `sm:w-48` (192px), sehingga tidak lagi terbentang terlalu lebar dan jauh lebih proporsional terhadap baris card.
2. **Penambahan Prefix Semantik `Target: Rp`:**
   - Menambahkan kotak prefix kiri terintegrasi (`Target: Rp`) dengan latar belakang abu-abu lembut (`bg-muted/50 border-r border-border/60 text-[11px] font-semibold text-muted-foreground select-none`) untuk memberikan konteks instan bahwa kolom tersebut adalah alokasi target bulanan dalam mata uang Rupiah.
3. **Format Rata Kiri (`text-left`) & Sans-Serif Tabular-Nums:**
   - Mengubah perataan teks dari rata kanan (`text-right`) menjadi rata kiri (`text-left`) bersambung tepat di sebelah kanan prefix `Target: Rp`.
   - Tetap menegakkan aturan tipografi bebas monospace (100% sans-serif dengan `tabular-nums font-semibold`).
4. **Penyelarasan Tampilan Sisa Uang Bebas Otomatis:**
   - Menyematkan badge hijau kompak `Sisa Otomatis:` dan nominal terformat ketika kelompok pos `Uang Bebas` dipilih.

## Berkas yang Diubah
- `[MODIFIED] src/components/features/onboarding/OnboardingWizard.tsx` — Memendekkan input target anggaran, menambahkan prefix `Target: Rp`, dan menyetel perataan rata kiri.

## Verifikasi
- `bun test`: PASS (87 pass, 0 fail across 7 files, 349 expect calls).
- `bun run typecheck`: PASS (0 errors).
- `bun run build`: PASS (Next.js 16.4.0 Turbopack clean build).
- `font-mono audit`: PASS (100% sans-serif dengan `tabular-nums`, 0 monospace).

## Status
COMPLETED ✅ — Approved by Kenzo (2026-11-15 20:52 WIB)
