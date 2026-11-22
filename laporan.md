# 📊 Laporan Progres Pengembangan — Kenzo Treasury

Dokumen ini adalah rekapitulasi status pengerjaan proyek **Kenzo Treasury**, diperbarui secara berkala di setiap checkpoint pengembangan dengan mekanisme *Rolling Window* (maksimal 5 checkpoint aktif terbaru).

---

## 📌 Ringkasan Status Proyek

- **Status Saat Ini:**
  - **Seluruh Fase Backend (B1–B13) & Frontend (F1–F18):** `Approved by Kenzo ✅ (2026-11-15 13:21 WIB)` — Seluruh roadmap telah tuntas 100%.
  - **Revisi UI Pasca-Fase (2026-11-15 13:45 WIB):** Detail rincian `BudgetCategoryCard` diubah dari dropdown inline menjadi Modal Box (`Dialog`) + kompatibilitas Toast Undo 5 detik (`Approved by Kenzo ✅ 2026-11-15 13:46 WIB`).
  - **Batch Revisi Terkumpul (Fase R1–R10 & Action Grid):** `Approved by Kenzo ✅ (2026-11-15 18:33 WIB)` — Seluruh checklist `docs/plans/PLANREVISI.md` tuntas 100% dan terverifikasi penuh (`87/87 bun test PASS`, `typecheck PASS`, `font-mono = 0`, `bun run build PASS`).
  - **Penyelarasan Skeleton Tiap Halaman & Eliminasi Layout Ganda:** `Approved by Kenzo ✅ (2026-11-22 15:02 WIB)`.
  - **Penyelarasan Kontrak Cicilan (Auto-Calculate, Edit & Hapus Cicilan, Pos Lock, Status Target Terpenuhi):** `Approved by Kenzo ✅ (2026-11-22 15:02 WIB)`.
  - **Standardisasi Dialog Konfirmasi Seluruh Aksi Mutasi Finansial & Destruktif:** `Approved by Kenzo ✅ (2026-11-22 15:35 WIB)`.
- **Tech Stack Terkunci:**
  - Runtime & Package Manager: Bun (v1.4+)
  - Frontend: Next.js 16 (App Router, React 19, TypeScript)
  - Styling: Tailwind CSS v4 + Shadcn UI + Lucide React (Zero `font-mono`, 100% `tabular-nums`)
  - Form & Validation: React Hook Form + Zod (`@hookform/resolvers/zod`)
  - Database & ORM: Supabase (PostgreSQL) + Drizzle ORM / Drizzle Kit
  - Storage & Image Optimization: HTML5 Canvas WebP Compressor (`<200KB`) + Supabase Storage (`wishlist-images`)
  - State & Caching: TanStack Query v5 + Server Actions + Offline Sync
  - Charts & Theme: Recharts (`recharts@3.10.1`) + `next-themes` (Dark/Light Mode)
  - AI Review & Celebrations: Google GenAI SDK (`@google/genai@3.3.0`) + `canvas-confetti`

---

## 🚀 Roadmap Pelaksanaan Fase

Seluruh fase teknis didokumentasikan di tiga berkas roadmap:
- 🛠️ **Backend Roadmap:** [`docs/plans/PLANBACKEND.md`](docs/plans/PLANBACKEND.md) (13 Fase Granular: B1–B13 Disetujui ✅)
- 🎨 **Frontend Roadmap:** [`docs/plans/PLANFRONTEND.md`](docs/plans/PLANFRONTEND.md) (18 Fase Granular: F1–F18 Disetujui ✅)
- 🔄 **Revisi Roadmap:** [`docs/plans/PLANREVISI.md`](docs/plans/PLANREVISI.md) (10 Fase Granular: R1–R10 Disetujui ✅)

> **Status Roadmap:** Seluruh item checklist Fase B1–B13, F1–F18, dan R1–R10 telah dicentang (`- [x]`) setelah persetujuan eksplisit dari Kenzo.

---

## 📝 Log Checkpoint Terbaru (Maksimal 5 Checkpoint Aktif)

### Checkpoint 1: Standardisasi Dialog Konfirmasi untuk Seluruh Aksi Mutasi Finansial & Destruktif (2026-11-22 15:25 WIB • Approved 2026-11-22 15:35 WIB)
- **Status:** `COMPLETED ✅ — Approved by Kenzo (2026-11-22 15:35 WIB)`
- **Agent:** Antigravity
- **Capaian Utama:**
  1. **Konfirmasi Bayar Cicilan (`LiabilityTrackerCard.tsx`):** Menampilkan modal konfirmasi dengan rincian nama cicilan, nominal tagihan bulan ini, sisa pokok saat ini, dan estimasi sisa pokok sesudah pembayaran sebelum eksekusi pembayaran cicilan.
  2. **Konfirmasi Hapus Transaksi Rincian (`TransactionSubList.tsx`):** Menampilkan modal konfirmasi rincian transaksi (keterangan, nominal, tanggal, metode bayar) sebelum soft delete, tetap menjaga fitur Toast Undo (5 detik) sebagai jaring pengaman lapis kedua.
  3. **Konfirmasi Hapus Pemasukan Freelance (`IncomeSection.tsx`):** Menampilkan modal konfirmasi sebelum menghapus pos pemasukan freelance beserta peringatan penyesuaian kuota Uang Bebas / Tabungan.
  4. **Konfirmasi Hapus Template Pos Rutin (`BudgetTemplateManager.tsx`):** Menampilkan modal konfirmasi sebelum menghapus template pos rutin bulanan dari menu Settings.
  5. **Konfirmasi Tutup Buku & Sweep Tabungan (`AiMonthlyReviewModal.tsx`):** Menampilkan modal konfirmasi sebelum mengeksekusi sweep saldo surplus ke Tabungan Bebas dan penguncian siklus bulan.
  6. **Konfirmasi Tandai Terbeli Wishlist (`WishlistCard.tsx`):** Menampilkan modal konfirmasi rincian tabungan 100% sebelum menandai barang impian sebagai sudah terbeli permanen.
  7. **Kepatuhan Desain & Verifikasi:** Bebas `font-mono` (100% `tabular-nums`), bebas emoji literal, fixed header & edge-to-edge footer, lolos `tsc --noEmit`, 89/89 `bun test` PASS, dan Turbopack build PASS.
- **File Changelog:** [`2026-11-22_action_confirmation_dialogs.md`](.changelog/2026-11-22_action_confirmation_dialogs.md).

### Checkpoint 2: Penyelarasan Kontrak Cicilan — Smart Auto-Calculate, Penguncian Pos Cicilan & Modal Edit Terpusat (2026-11-22 14:24 WIB • Approved 2026-11-22 15:02 WIB)
- **Status:** `COMPLETED ✅ — Approved by Kenzo (2026-11-22 15:02 WIB)`
- **Agent:** Antigravity
- **Capaian Utama:**
  1. **Penguncian Pos Cicilan di `BudgetCategoryCard.tsx` & Eliminasi Teks "Kontrak Utang":** Menghilangkan tombol pensil edit target jika pos memiliki `category.liabilityId` tanpa memunculkan teks/badge "Kontrak Utang" yang canggung, menjaga tampilan pos anggaran bersih, serta proteksi penolakan mutasi di server action `updateCategoryTarget` (*defense-in-depth*).
  2. **Smart Bidirectional Auto-Calculate (Kalkulasi Timbal Balik Otomatis & Pembulatan Ribuan):**
     - Total Pokok atau Tenor diubah $\rightarrow$ Cicilan per Bulan otomatis terhitung rapi dibulatkan ke atas ke kelipatan ribuan Rupiah terdekat: $\lceil (\text{totalAmount} / \text{tenorMonths}) / 1000 \rceil \times 1000$ (misal: pokok Rp 4.000.000 / 12 bulan menghasilkan **Rp 334.000**, bukan pecahan ganjil 333.334).
     - Cicilan per Bulan disesuaikan manual $\rightarrow$ Tenor otomatis dihitung ulang: $\text{tenorMonths} = \max(1, \lceil \text{totalAmount} / \text{monthlyPayment} \rceil)$.
     - Mengeliminasi tuntas kontradiksi matematis (misal: pokok 17jt dengan tenor 12 bulan otomatis terisi Rp 1.417.000/bln dan sisa bulan tepat 12 bulan).
  3. **Modal Edit Cicilan Terpusat di `LiabilityTrackerCard.tsx`:**
     - Menambahkan tombol edit (ikon pensil kecil) di samping nama cicilan pada setiap kartu cicilan aktif.
     - Menyediakan dialog modal edit dengan kalkulasi timbal balik otomatis dan sinkronisasi atomik via `updateLiability` (otomatis memperbarui `budgetCategories` siklus terbuka dan menyeimbangkan saldo Uang Bebas).
  4. **Fitur Hapus Cicilan (Opsi B — Tombol di Header Kartu + Dialog Konfirmasi):**
     - Tombol ikon tempat sampah merah (`Trash2`) langsung di samping tombol pensil edit kartu cicilan.
     - Server action `deleteLiability` atomik: Jika pos cicilan di bulan berjalan belum ada transaksi, pos dihapus dan sisa plafon dikembalikan utuh ke `Uang Bebas / Tabungan`. Jika sudah ada transaksi, pos anggaran dilepas tautannya (`liabilityId = null`) agar catatan pengeluaran harian tidak hilang.
  5. **Penyelarasan Status Semantik 'Target Terpenuhi' (Hijau Emerald) saat Penyerapan Pas 100%:**
     - Pos anggaran dengan realisasi tepat 100% targetnya (`spent === target` dan `sisa === 0`) kini menampilkan status positif **`Target Terpenuhi`** dengan badge dan progress bar hijau emerald, bukan lagi peringatan waspada kuning *"Mendekati Limit >80%"*.
  6. **Kepatuhan Standar Desain:** Bebas 100% dari emoji literal (menggunakan ikon semantik Lucide `Info`, `Lock`, `Pencil`, `Trash2`), fixed header & edge-to-edge footer, serta seluruh angka dan metrik menggunakan `tabular-nums` tanpa `font-mono`.
  7. **Verifikasi Kualitas:** `tsc --noEmit` (PASS), `bun test` (89/89 PASS, 380 expect calls), `bun run build` (Turbopack 11/11 routes PASS).
- **File Changelog:** [`2026-11-22_liability_smart_auto_calculate_and_budget_lock.md`](.changelog/2026-11-22_liability_smart_auto_calculate_and_budget_lock.md).

### Checkpoint 3: Rekonfigurasi Skeleton Tiap Halaman (Dashboard, Brankas, Wishlist, Analitik, Data & Backup) Menjadi 1 Layout Otentik (2026-11-22 13:50 WIB • Approved 2026-11-22 15:02 WIB)
- **Status:** `COMPLETED ✅ — Approved by Kenzo (2026-11-22 15:02 WIB)`
- **Agent:** Antigravity
- **Capaian Utama:**
  1. **Eliminasi Isu "2 Layout" Bertumpuk:** Menghapus perenderan ganda pada `PageSectionSkeleton.tsx` yang sebelumnya memunculkan grid kartu metrik bersamaan dengan kartu tabel/grafik besar bertumpuk vertikal. Komponen direfaktor menjadi modular dan bebas dari duplikasi layout.
  2. **5 Skeleton Terdedikasi yang Presisi (1 Layout per Halaman):**
     - `DashboardSkeleton.tsx`: Menyelaraskan baris kanan header dengan kontrol 2 baris aktual (Baris 1: Month Selector lebar penuh; Baris 2: Grid 3 action buttons simetris: Bulan Baru, Evaluasi AI, Transaksi), diikuti Executive Summary KPI Card, 3 Cashflow Pillar Cards, 6 Grid Pos Anggaran Bulanan, dan 2 Hub Cards di bawah.
     - `VaultSkeleton.tsx`: 1 layout utuh mencerminkan `EmergencyVaultCard` (Header proteksi brankas & tombol mutasi, 3 Pilar Angka: Dana Darurat, Tabungan Bebas, Safety Months Meter, dan target progress bar).
     - `WishlistsSkeleton.tsx`: 1 layout utuh mencerminkan `WishlistGrid` (Header halaman, Top Banner Sinking Fund + tombol tambah barang impian, dan katalog 6 kartu wishlist dengan thumbnail WebP, milestone badge, dan progress bar).
     - `AnalyticsSkeleton.tsx`: 1 layout utuh mencerminkan `AnalyticsDashboard` (Header halaman, Control Strip toggle Bar vs Line, 2 kartu grafik lebar Recharts, serta 2 kartu bawah untuk perbandingan tahunan dan distribusi pos anggaran).
     - `SettingsSkeleton.tsx`: 1 layout utuh mencerminkan `SettingsPage` (Header halaman, Panel 1 Form Gaji Pokok & Target Darurat, Panel 2 Manajemen Template Pos Rutin, dan Panel 3 Ekspor Data dengan 3 format unduhan: CSV, Excel, JSON).
  3. **Wiring Seluruh Rute Loading & Isolasi Route Group `(overview)`:** Menghubungkan masing-masing `loading.tsx` langsung ke skeleton terdedikasinya. Memindahkan `page.tsx` & `loading.tsx` utama dashboard ke route group `dashboard/(overview)/` agar skeleton dashboard tidak membungkus sub-rute sebaya, mengeliminasi tuntas akar masalah flash skeleton dashboard saat berpindah sub-tab.
  4. **Invarian Tipografi & A11y:** Seluruh komponen skeleton bebas 100% dari utility font monospace (`font-mono = 0`) dan mematuhi atribut aksesibilitas `aria-busy="true"`.
  5. **Verifikasi Kualitas Lengkap:** `tsc --noEmit` (0 errors), `bun test` (87/87 PASS, 364 expect calls), `bun run build` (Turbopack Next.js 16.4.6 pass).
- **File Changelog:** [`2026-11-22_page_specific_skeletons_and_eliminate_double_layout.md`](.changelog/2026-11-22_page_specific_skeletons_and_eliminate_double_layout.md).

### Checkpoint 4: Standarisasi Semua Modal Box & Sheet — Eliminasi Padding Dialog, Footer Solid Hitam Nempel Tepi, dan Tombol Close Lega (2026-11-15 22:15 WIB • Approved 2026-11-15 22:17 WIB)
- **Status:** `COMPLETED ✅ — Approved by Kenzo (2026-11-15 22:17 WIB)`
- **Agent:** Antigravity
- **Capaian Utama:**
  1. **Eliminasi Padding Bawaan Dialog (`p-0 gap-0 overflow-hidden` di Akar):** Mengganti base class `DialogPrimitive.Content` pada `src/components/ui/dialog.tsx` dari `grid gap-4 p-4 rounded-xl` menjadi `flex flex-col rounded-2xl bg-popover p-0 gap-0 overflow-hidden`, serta beralih menggunakan utility resmi `@/lib/utils`. Menghilangkan akar masalah padding 16px yang sebelumnya membuat footer tampak melayang di dalam dialog.
  2. **Footer Tombol Aksi Solid Hitam Menempel Tepi-ke-Tepi (`w-full border-t border-border/60 bg-background px-6 py-4 shrink-0 mt-auto`):** Footer kontainer tombol aksi di seluruh 11 modal dialog dan drawer kini menempel 100% rapat ke tepi kiri, kanan, dan bawah tanpa jeda padding samping maupun bawah. Garis `border-t border-border/60` membentang utuh dan sudut bawah dibulatkan rapi mengikuti kontainer modal.
  3. **Formulir 100% Lebar (`w-full m-0 p-0 flex flex-col flex-1 min-h-0`):** Seluruh elemen `<form>` di dalam modal distandarisasi agar mengambil 100% lebar modal tanpa margin samping yang menggeser footer.
  4. **Body Formulir Scrollable Mandiri (`flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0`):** Header dan footer terkunci di tempat (*fixed position*), sementara area tengah konten formulir menjadi satu-satunya area yang dapat di-scroll secara mulus.
  5. **Tombol Close Nyaman & Tidak Dempet (`top-4 right-4 size-8 rounded-xl` + `pr-14`):** Tombol `X` diposisikan simetris 16px dari atas dan kanan, dengan safe right-padding `pr-12` default pada header sehingga tidak pernah bertabrakan dengan judul atau badge.
  6. **Cakupan Lengkap 11 Dialog + 1 Drawer:** `CreateMonthDialog`, `QuickTransactionDrawer`, `BudgetTemplateManager`, `LiabilityTrackerCard`, `WishlistCard`, `AllocateWishlistDrawer`, `AiMonthlyReviewModal`, `BudgetCategoryList`, `BudgetCategoryCard` (Modal Hapus & Modal Rincian), `EmergencyVaultCard`, dan `IncomeSection`.
  7. **Verifikasi Otomatis:** `bun test` (87/87 PASS), `bun run typecheck` (0 errors), `font-mono = 0`, dan `bun run build` (Turbopack compile PASS).
- **File Changelog:** [`2026-11-15_standardize_all_modal_boxes_fixed_header_footer_and_scrollable_body.md`](.changelog/2026-11-15_standardize_all_modal_boxes_fixed_header_footer_and_scrollable_body.md).

### Checkpoint 5: Layout Card Pos Ketat 2 Baris, Animasi Geser Tab Rp/%, Header Action Buttons Dashboard & 36 Ikon Finansial (2026-11-15 20:49 WIB • Approved 2026-11-15 20:52 WIB)
- **Status:** `COMPLETED ✅ — Approved by Kenzo (2026-11-15 20:52 WIB)`
- **Agent:** Antigravity
- **Capaian Utama:**
  1. **Rekonfigurasi Header Action Buttons Dashboard (Width Ringkas 360px & Dropdown Edge-to-Edge):** Baris 1 `MonthSelector` lebar penuh 360px, Baris 2 grid 3 tombol simetris (`Bulan Baru`, `Evaluasi AI`, `Transaksi`).
  2. **Harmonisasi Warna Input Persen (`dark:bg-input/30`):** Selaras 100% dengan permukaan field form standar.
  3. **Animasi Geser Horizontal Tab Rp/% (`Sliding Indicator`):** Transisi halus tactile dengan GPU acceleration.
  4. **Ekspansi 36 Ikon Finansial (Grid 6x6):** Menambahkan 12 ikon keuangan baru untuk menyempurnakan kurasi Lucide.
- **File Changelog:** [`2026-11-15_refine_onboarding_template_cards_and_full_width_button.md`](.changelog/2026-11-15_refine_onboarding_template_cards_and_full_width_button.md).

---

## 🗄️ Arsip Rekapitulasi Milestone Disetujui (Fase Lampau)

Seluruh rincian teknis, log kode, dan verifikasi fase terdahulu telah terdokumentasi secara permanen di berkas changelog masing-masing:

| Milestone / Fase | Tanggal Selesai | Ringkasan Capaian Utama | Berkas Changelog |
| :--- | :--- | :--- | :--- |
| **Implementasi Penuh Fase R1–R10 (Pilihan A Batch)** | 2026-11-15 | 100% zero-emoji, onboarding wizard, single-source of truth database, dynamic categories, concurrency guard, caching & performa. | [`2026-11-15_implement_phases_r1_to_r10_batch.md`](.changelog/2026-11-15_implement_phases_r1_to_r10_batch.md) |
| **Master Plan Revisi PLANREVISI.md (R1–R10)** | 2026-11-15 | Penyusunan backlog revisi 10 fase via /grill-me dan resolusi 17 temuan audit EGM. | [`2026-11-15_create_planrevisi_workflow.md`](.changelog/2026-11-15_create_planrevisi_workflow.md) |
| **Backend B7–B13 & Frontend F7–F18** | 2026-11-15 | Penuntasan penuh seluruh roadmap backend dan frontend (100% tuntas & disetujui). | [`2026-11-14_complete_phases_b7_b13_and_f7_f18.md`](.changelog/2026-11-14_complete_phases_b7_b13_and_f7_f18.md) |
| **Relokasi Plan ke `docs/plans/`** | 2026-11-14 | Memindahkan roadmap ke `docs/plans/` dan memperbarui seluruh referensi path. | [`2026-11-14_move_plans_to_docs_plans.md`](.changelog/2026-11-14_move_plans_to_docs_plans.md) |
| **Relokasi Plan ke `docs/plans/`** | 2026-11-14 | Memindahkan roadmap ke `docs/plans/` dan memperbarui seluruh referensi path. | [`2026-11-14_move_plans_to_docs_plans.md`](.changelog/2026-11-14_move_plans_to_docs_plans.md) |
| **Fase F6: Executive Summary Card & Cashflow KPI** | 2026-10-18 | Komponen `ExecutiveSummaryCard` dengan Multi-Zone Health Progress Bar + 7 unit test. | [`2026-10-18_fase_f6_executive_summary_card_cashflow_kpi.md`](.changelog/2026-10-18_fase_f6_executive_summary_card_cashflow_kpi.md) |
| **Fase B6: Multi-Source Incomes Engine** | 2026-10-18 | Kontrak tipe, query read-only, dan Server Actions pemasukan (`addIncome`, `updateIncome`, `deleteIncome`) + 11 unit test. | [`2026-10-18_fase_b6_server_actions_multi_source_incomes.md`](.changelog/2026-10-18_fase_b6_server_actions_multi_source_incomes.md) |
| **Optimasi Token Efisiensi Dokumentasi** | 2026-10-18 | Perampingan `AGENTS.md` (~45% hemat token) dan penerapan mekanisme Rolling Window di `laporan.md`. | [`2026-10-18_optimize_markdown_token_efficiency.md`](.changelog/2026-10-18_optimize_markdown_token_efficiency.md) |
| **Refactor Clean Page Architecture** | 2026-10-18 | Pemisahan `CashflowSummaryCard`, `DashboardHubCard`, `BudgetCategoryCard`, dan `BudgetCategoryList` dari `dashboard/page.tsx`. | [`2026-10-18_refactor_clean_page_architecture_and_feature_cards.md`](.changelog/2026-10-18_refactor_clean_page_architecture_and_feature_cards.md) |
| **Fase F5: Month Selector & 1-Click Generator** | 2026-10-18 | Komponen `MonthSelector`, `CreateMonthDialog`, integrasi URL `/dashboard?month=<id>`, dan baseline query bulan. | [`2026-10-18_fase_f5_dropdown_pemilih_bulan_generator.md`](.changelog/2026-10-18_fase_f5_dropdown_pemilih_bulan_generator.md) |
| **Fase B5: Month Lifecycle & Category Generator** | 2026-10-16 | Pemisahan modular 4 lapis, actions create/close/reopen, automatic savings sweep, 9 unit test lulus. | [`2026-10-16_fase_b5_server_actions_month_lifecycle.md`](.changelog/2026-10-16_fase_b5_server_actions_month_lifecycle.md) |
| **Fase B4: Shared Zod Validation Schemas** | 2026-10-15 | 8 skema validasi Zod terpusat di `src/schemas/`, inferensi tipe TS, 16 unit test lulus. | [`2026-10-15_fase_b4_shared_zod_schemas.md`](.changelog/2026-10-15_fase_b4_shared_zod_schemas.md) |
| **Fase F4: App Shell & Mobile Layout** | 2026-10-15 | `AppHeader`, `MobileBottomNav`, `DashboardLayout`, skeleton loading, dan error boundary. | [`2026-10-15_fase_f4_app_shell_mobile_layout_navigasi.md`](.changelog/2026-10-15_fase_f4_app_shell_mobile_layout_navigasi.md) |
| **Fase F3: Landing Page Publik 12 Seksi** | 2026-10-14 | Landing page publik lengkap, floating chassis iPhone titanium murni CSS, bebas `font-mono`. | [`2026-10-14_fase_f3_halaman_depan_publik_landing_page.md`](.changelog/2026-10-14_fase_f3_halaman_depan_publik_landing_page.md) |
| **Migrasi Edge Proxy Next.js 16** | 2026-10-14 | Migrasi middleware lama ke konvensi resmi Next.js 16 `src/proxy.ts`. | [`2026-10-14_migrate_middleware_to_proxy_next16.md`](.changelog/2026-10-14_migrate_middleware_to_proxy_next16.md) |
| **Fase F2: Setup Atomik Shadcn UI** | 2026-10-14 | Pemasangan 18 komponen atomik Shadcn UI, design tokens semantik Oklch, dan dark mode. | [`2026-10-14_fase_f2_setup_komponen_atomik_shadcn_ui.md`](.changelog/2026-10-14_fase_f2_setup_komponen_atomik_shadcn_ui.md) |
| **Fase B3: Financial Calculation Engine** | 2026-10-13 | Single source of truth rumus finansial di `src/lib/financial-calculations.ts`, 21 unit test lolos. | [`2026-10-13_fase_b3_financial_calculation_engine.md`](.changelog/2026-10-13_fase_b3_financial_calculation_engine.md) |
| **Fase B2: Supabase SSR & Auth Actions** | 2026-10-13 | Server Actions login/register, RLS aktif di 9 tabel publik, SSR cookie handler. | [`2026-10-13_fase_b2_supabase_ssr_and_auth_actions.md`](.changelog/2026-10-13_fase_b2_supabase_ssr_and_auth_actions.md) |
| **Instalasi Skill Domain Proyek** | 2026-10-13 | Integrasi skill `tanstack-query`, `recharts`, `zod`, dan `pwa-development` di `.agents/skills/`. | [`2026-10-13_add_project_specific_skills.md`](.changelog/2026-10-13_add_project_specific_skills.md) |
| **Penyelarasan Supabase Auth** | 2026-10-12 | Penghapusan kolom `password` dari `public.users`, integrasi profil 1:1 ke Supabase Auth. | [`2026-10-12_remove_users_password_and_align_supabase_auth.md`](.changelog/2026-10-12_remove_users_password_and_align_supabase_auth.md) |
| **Restrukturisasi Aturan & Invarian** | 2026-10-12 | Pemecahan aturan modular `.agents/rules/` dan kodifikasi invarian finansial anti-duplikasi. | [`2026-10-12_reorganize_rules_and_financial_domain.md`](.changelog/2026-10-12_reorganize_rules_and_financial_domain.md) |
| **Fase B1: Drizzle ORM & Skema 9 Tabel** | 2026-10-10 | Skema 9 tabel database, singleton pooling `src/db/index.ts`, dan migrasi Drizzle Supabase. | [`2026-10-10_phase_b1_completion.md`](.changelog/2026-10-10_phase_b1_completion.md) |
| **Fase F1: Inisialisasi Next.js 16 & Bun** | 2026-10-09 | Setup Next.js 16 App Router, Tailwind CSS v4, Bun runtime, dan provider query client. | [`2026-10-09_phase_f1_completion.md`](.changelog/2026-10-09_phase_f1_completion.md) |
| **Fase 0: Spesifikasi & Arsitektur Awal** | 2026-10-09 | Perumusan `PRD.md`, ERD 9 tabel Excalidraw, blueprint awal, dan migrasi Bun. | [`2026-10-09_initial_prd_and_rules.md`](.changelog/2026-10-09_initial_prd_and_rules.md) |
