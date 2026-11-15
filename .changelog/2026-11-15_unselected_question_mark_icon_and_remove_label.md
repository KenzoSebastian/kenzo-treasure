---
date: 2026-11-15
time: "19:46 WIB"
timezone: Asia/Jakarta
task: Penghapusan Label Teks Ikon & Default Ikon Tanda Tanya untuk Pos Baru
prompt: "gausah ada tulisan 'ikon' , hapus aja,lalu secara default, ketika user belum pilih, itu pke icon tanda tanya aja"
author: Antigravity
---

# Penghapusan Label Teks Ikon & Penerapan Default Ikon Tanda Tanya

## Ringkasan Perubahan
1. **Penghapusan Label Teks "Ikon":**
   - Menghapus teks `<span ...>Ikon</span>` pada tombol pemilih ikon di Langkah 2 Wizard Onboarding.
   - Tombol kini berbentuk kotak simetris presisi (`size-9 rounded-xl`) yang serasi sejajar dengan `Input` tinggi 36px (`h-9`) dan tombol hapus (`size-9`).
2. **Default Ikon Tanda Tanya (`help-circle`) Saat Belum Dipilih:**
   - Menetapkan nilai default `icon: "help-circle"` saat baris pos anggaran baru ditambahkan.
   - Menambahkan dukungan `help-circle` (dan alias `circle-help`) ke `CATEGORY_ICON_MAP` dan `getCategoryIconComponent` di `src/lib/category-icons.ts` yang me-render ikon tanda tanya `HelpCircle`.
   - Menyesuaikan `AppCategoryIcon` agar memberikan styling garis putus-putus lembut (*dashed badge*) ketika ikon masih berupa tanda tanya (`help-circle`), menandakan pos siap dipilihkan ikon oleh pengguna.

## Berkas yang Diubah
- `[MODIFIED] src/components/features/onboarding/OnboardingWizard.tsx` — Menghapus teks "Ikon" dari tombol dan menetapkan `icon: "help-circle"` secara default pada baris baru.
- `[MODIFIED] src/lib/category-icons.ts` — Mendaftarkan `help-circle` dan `circle-help` ke dalam registry & map ikon kategori.
- `[MODIFIED] src/components/common/AppCategoryIcon.tsx` — Menambahkan tone badge khusus untuk key `help-circle`.

## Verifikasi
- `bun test`: PASS (87 pass, 0 fail across 7 files).
- `bun run typecheck`: PASS (0 errors).
- `bun run build`: PASS (Next.js 16.4.0 Turbopack clean build).
- `font-mono audit`: PASS (100% sans-serif dengan `tabular-nums`, 0 monospace).

## Status
COMPLETED ✅ — Approved by Kenzo (2026-11-15 20:52 WIB)
