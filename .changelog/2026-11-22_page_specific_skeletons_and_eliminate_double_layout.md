---
date: 2026-11-22
time: "13:50 WIB"
timezone: Asia/Jakarta
task: Rekonfigurasi Skeleton Loading Halaman Dashboard, Brankas, Wishlist, Analitik, dan Data & Backup Menjadi 1 Layout Otentik
prompt: tolong untuk skeleton tiap page(dashboard, brankas, wishlist, analitik, data&backup) itu sesuaikan itu layoutnya seperti layout page nya, trus aku liat kok brankas, wishlist, analitik, data&backup itu sletonnya 2 layout ya?? dibikin 1 ajaa
author: Antigravity
---

# Rekonfigurasi Skeleton Loading Halaman — 1 Layout Otentik & Eliminasi Isu Double Layout

## 1. Ringkasan Perubahan
Memperbaiki arsitektur skeleton loading pada seluruh sub-halaman dashboard Kenzo Treasury (`/dashboard`, `/dashboard/vault`, `/dashboard/wishlists`, `/dashboard/analytics`, `/dashboard/settings`):
- **Eliminasi Isu "2 Layout" Bertumpuk:** Sebelumnya `PageSectionSkeleton.tsx` merender dua seksi sekaligus (grid kartu metrik `cardsCount` DAN kartu tabel/grafik besar `h-48`) yang bertumpuk vertikal dan tidak mencerminkan wireframe halaman aslinya. Komponen ini telah direfaktor menjadi modular dan bersih tanpa duplikasi layout.
- **5 Skeleton Terdedikasi yang Presisi (1 Layout per Halaman):**
  1. `DashboardSkeleton.tsx`: Menyelaraskan baris kanan header dengan kontrol 2 baris aktual (Baris 1: Month Selector lebar penuh; Baris 2: Grid 3 action buttons simetris: Bulan Baru, Evaluasi AI, Transaksi), diikuti Executive Summary KPI Card, 3 Cashflow Pillar Cards, 6 Grid Pos Anggaran Bulanan, dan 2 Hub Cards di bawah.
  2. `VaultSkeleton.tsx`: 1 layout utuh mencerminkan `EmergencyVaultCard` (Header proteksi brankas & tombol mutasi, 3 Pilar Angka: Dana Darurat, Tabungan Bebas, Safety Months Meter, dan target progress bar).
  3. `WishlistsSkeleton.tsx`: 1 layout utuh mencerminkan `WishlistGrid` (Header halaman, Top Banner Sinking Fund + tombol tambah barang impian, dan katalog 6 kartu wishlist dengan thumbnail WebP, milestone badge, dan progress bar).
  4. `AnalyticsSkeleton.tsx`: 1 layout utuh mencerminkan `AnalyticsDashboard` (Header halaman, Control Strip toggle Bar vs Line, 2 kartu grafik lebar Recharts, serta 2 kartu bawah untuk perbandingan tahunan dan distribusi pos anggaran).
  5. `SettingsSkeleton.tsx`: 1 layout utuh mencerminkan `SettingsPage` (Header halaman, Panel 1 Form Gaji Pokok & Target Darurat, Panel 2 Manajemen Template Pos Rutin, dan Panel 3 Ekspor Data dengan 3 format unduhan: CSV, Excel, JSON).
- **Wiring Loading Pages & Isolasi Route Group `(overview)`:** Memindahkan `page.tsx` dan `loading.tsx` dashboard ke route group `src/app/(dashboard)/dashboard/(overview)/` agar skeleton dashboard hanya aktif saat mengakses `/dashboard` dan tidak membungkus sub-rute sebaya (`vault`, `wishlists`, `analytics`, `settings`). Mengeliminasi akar masalah "flash skeleton dashboard sepersekian detik" saat berpindah tab.
- **Invarian Tipografi & A11y:** Seluruh komponen skeleton bebas 100% dari utility font monospace (`font-mono = 0`) dan mematuhi atribut aksesibilitas `aria-busy="true"`.

## 2. File Changes
- `[MOVED] src/app/(dashboard)/dashboard/page.tsx` → `src/app/(dashboard)/dashboard/(overview)/page.tsx`: Mengisolasi halaman utama dashboard ke dalam route group agar tidak mewarisi loading boundary ke sub-halaman lain.
- `[MOVED] src/app/(dashboard)/dashboard/loading.tsx` → `src/app/(dashboard)/dashboard/(overview)/loading.tsx`: Mengisolasi loading skeleton dashboard khusus untuk `/dashboard`.
- `[MODIFIED] src/components/layout/DashboardSkeleton.tsx`: Menyelaraskan header kanan dengan 2 baris kontrol aktual (Month Selector & 3 action buttons) serta wireframe lengkap modul dashboard.
- `[CREATED] src/components/layout/VaultSkeleton.tsx`: Skeleton terdedikasi 1 layout untuk halaman Brankas Dana Darurat (`/dashboard/vault`).
- `[CREATED] src/components/layout/WishlistsSkeleton.tsx`: Skeleton terdedikasi 1 layout untuk katalog barang impian Sinking Fund (`/dashboard/wishlists`).
- `[CREATED] src/components/layout/AnalyticsSkeleton.tsx`: Skeleton terdedikasi 1 layout untuk grafik Recharts & ringkasan analitik (`/dashboard/analytics`).
- `[CREATED] src/components/layout/SettingsSkeleton.tsx`: Skeleton terdedikasi 1 layout untuk 3 panel pengaturan finansial & kedaulatan data (`/dashboard/settings`).
- `[MODIFIED] src/components/layout/PageSectionSkeleton.tsx`: Menghapus duplikasi render kartu tabel/grafik ganda, menambahkan re-ekspor skeleton terdedikasi, serta mendukung prop `variant`.
- `[MODIFIED] src/app/(dashboard)/dashboard/vault/loading.tsx`: Menghubungkan rute langsung ke `<VaultSkeleton />`.
- `[MODIFIED] src/app/(dashboard)/dashboard/wishlists/loading.tsx`: Menghubungkan rute langsung ke `<WishlistsSkeleton />`.
- `[MODIFIED] src/app/(dashboard)/dashboard/analytics/loading.tsx`: Menghubungkan rute langsung ke `<AnalyticsSkeleton />`.
- `[MODIFIED] src/app/(dashboard)/dashboard/settings/loading.tsx`: Menghubungkan rute langsung ke `<SettingsSkeleton />`.
- `[MODIFIED] src/components/features/__tests__/frontend-phases-f7-f18.test.tsx`: Menambahkan unit test komprehensif untuk memvalidasi kelima skeleton terdedikasi (`aria-busy="true"`, `font-mono = 0`).

## 3. Hasil Verifikasi
- Static Analysis (`tsc --noEmit`): **PASS** (0 errors).
- Unit & Integration Test (`bun test`): **PASS** (87 passed, 0 failed, 364 expect calls).
- Production Build (`bun run build` via Next.js Turbopack): **PASS** (11/11 static/dynamic routes compiled).
- Zero Monospace Audit: **PASS** (0 temuan `font-mono`).

## 4. Status
- `COMPLETED ✅ — Approved by Kenzo (2026-11-22 15:02 WIB)`
