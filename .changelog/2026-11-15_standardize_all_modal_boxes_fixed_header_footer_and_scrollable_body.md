---
date: 2026-11-15
time: "22:15 WIB"
timezone: Asia/Jakarta
task: Standarisasi Semua Modal Box & Sheet — Eliminasi Padding Dialog, Footer Solid Hitam Full-Width Nempel Tepi, dan Tombol Close Lega
prompt: "bagian bawah yg containernya itu kok ga full widthnya? aku mau full yang hitamnya itu, kanan kiri, dan bawah, itu nempel, tanpa kena padding, priksa lagi di semual modal box"
author: Antigravity
---

# Standarisasi Seluruh Modal Box & Sheet (Fixed Header & Footer Solid Hitam Nempel Tepi-ke-Tepi, Scrollable Body, Safe Close Button)

## Root Cause & Solusi Definitif
- **Akar Masalah (*Root Cause*):** Base template `DialogPrimitive.Content` pada `src/components/ui/dialog.tsx` awalnya memiliki kelas bawaan `grid gap-4 p-4 rounded-xl sm:max-w-sm`. Di beberapa bundler Next.js Turbopack client component, utility `p-4` (16px) tetap aktif dan membungkus seluruh anak elemen, sehingga footer tombol aksi (`DialogFooter` dengan background hitam pekat `bg-background`) tampak melayang (*floating*) dengan jeda padding 16px di sisi kiri, kanan, dan bawahnya.
- **Solusi Arsitektur Definitif:**
  1. **Eliminasi Padding di Akar (`src/components/ui/dialog.tsx`):** Mengganti base class `DialogPrimitive.Content` menjadi `flex flex-col w-full max-w-[calc(100%-2rem)] rounded-2xl bg-popover p-0 gap-0 sm:max-w-md overflow-hidden`. Menghapus total `grid`, `gap-4`, dan `p-4`, serta beralih menggunakan `import { cn } from "@/lib/utils"` (standard `tailwind-merge` + `clsx`).
  2. **Footer Solid Hitam Nempel Tepi (`w-full border-t border-border/60 bg-background px-6 py-4 flex flex-row items-center justify-end gap-2.5 shrink-0 mt-auto`):** Footer kontainer tombol aksi kini 100% menempel sempurna tanpa celah samping dan bawah (*zero inset*), dengan batas atas `border-t border-border/60` membentang penuh dari ujung ke ujung. Sudut bawah dibulatkan presisi oleh `rounded-2xl overflow-hidden` kontainer induk.
  3. **Formulir 100% Lebar (`w-full m-0 p-0 flex flex-col flex-1 min-h-0`):** Seluruh elemen `<form>` di dalam 11 modal box distandarisasi agar mengambil 100% lebar kontainer tanpa margin/padding liar.
  4. **Body Scrollable Mandiri (`flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0`):** Header dan footer terkunci (*fixed position*), sementara area konten formulir di tengah dapat di-scroll secara independen.
  5. **Tombol Close Lega (`top-4 right-4 size-8 rounded-xl` + `pr-14`):** Tombol `X` diposisikan simetris 16px dari atas dan kanan, dengan safe right-padding `pr-12` default pada header sehingga tidak pernah bertabrakan dengan judul atau badge.

## Daftar Komponen yang Diperbarui (11 Dialog + 1 Drawer)
1. `src/components/ui/dialog.tsx` — Definisi dasar `p-0 gap-0 overflow-hidden flex flex-col`, import `@/lib/utils`, dan footer solid edge-to-edge.
2. `src/components/ui/drawer.tsx` — Default footer solid edge-to-edge `w-full bg-background border-t border-border/60 px-6 py-4`.
3. `src/components/features/months/CreateMonthDialog.tsx` — Modal Buat Lembar Bulan Baru: form `w-full m-0 p-0`, footer solid hitam nempel tepi-ke-tepi.
4. `src/components/features/settings/BudgetTemplateManager.tsx` — Modal Ubah/Tambah Template Pos Anggaran Rutin.
5. `src/components/features/ai/AiMonthlyReviewModal.tsx` — Modal Evaluasi Finansial AI Gemini.
6. `src/components/features/liabilities/LiabilityTrackerCard.tsx` — Modal Tambah Tracking Cicilan / Utang Baru.
7. `src/components/features/wishlists/WishlistCard.tsx` — Modal Tambah Barang Impian Baru WebP Auto-Compress.
8. `src/components/features/wishlists/AllocateWishlistDrawer.tsx` — Modal Alokasi Sinking Fund Barang Impian.
9. `src/components/features/categories/BudgetCategoryList.tsx` — Modal Tambah Pos Anggaran Kustom.
10. `src/components/features/categories/BudgetCategoryCard.tsx` (Modal 1) — Modal Kelola Penghapusan Pos Anggaran & Reassign.
11. `src/components/features/categories/BudgetCategoryCard.tsx` (Modal 2) — Modal Detail Pos Anggaran & Riwayat Transaksi.
12. `src/components/features/savings/EmergencyVaultCard.tsx` — Modal Kelola Brankas Dana Darurat & Tabungan Bebas.
13. `src/components/features/incomes/IncomeSection.tsx` — Modal Tambah Pemasukan Tambahan / Freelance.
14. `src/components/features/transactions/QuickTransactionDrawer.tsx` — Sheet Catat Pengeluaran Harian Kilat.

## Verifikasi
- `bun test`: PASS (87 pass, 0 fail across 7 files, 349 expect calls).
- `bun run typecheck`: PASS (0 errors).
- `bun run build`: PASS (Turbopack compile 2.7s, 11/11 routes clean).
- `font-mono audit`: PASS (0 monospace pada nominal Rupiah & angka).

## Status
COMPLETED ✅ — Approved by Kenzo (2026-11-15 22:17 WIB)
