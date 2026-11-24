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
  - **Skenario 1: Penanda Status "Sudah Dibayar Bulan Ini" & Fitur Bayar Ekstra dari Uang Bebas:** `Approved by Kenzo ✅ (2026-11-22 20:28 WIB)`.
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

### Checkpoint 1: Refactor Dashboard Tier 1 — Full-Width Wealth Hero Card & Historical Wealth Trajectory Chart (PLANWEALTHCHART Fase 1–7) (2026-11-24 21:30 WIB)
- **Status:** `COMPLETED ✅ — Batch Authorized by Kenzo`
- **Agent:** Antigravity
- **Capaian Utama:**
  1. **Visualisasi Time-Series Interaktif:** Mengimplementasikan `WealthTrajectoryChart.tsx` bertenaga Recharts v3 dengan dual mode (Area Gradient Monotone vs Volume Bar), 4 timeframe responsif (Harian 30D, Mingguan 12W, Bulanan 12M, Tahunan All), dan 2-axis dashed crosshair (`ReferenceLine y={hoveredValue}`) yang memproyeksikan nominal Rupiah aktif ke sumbu Y saat kursor melayang (*hover*).
  2. **Skema & Query Engine Snapshot Finansial:** Membangun tabel `savings_snapshots` dengan RLS & indexing ganda, centralized mutation hooks pada seluruh Server Actions mutasi tabungan/darurat/sweep, serta query time-series murni dengan *same-day collision collapse*, *baseline seeding*, dan *forward-fill gap interpolation*.
  3. **Modular Primitives Tier 1 & Tier 2:** Merombak layout dashboard menjadi kartu lebar penuh (*Full-Width Viewport-Fitted*): `WealthHeroCard.tsx` di posisi teratas Tier 1 (dengan sub-vault inset chips dan tautan ke detail brankas) dan mereposisi `CashflowCockpitCard.tsx` tepat di bawahnya sebagai Tier 2 (dengan indikator kesehatan anggaran dan progress bar penyerapan kas).
  4. **Penyelarasan Server Component & Skeleton:** Mengintegrasikan query snapshot ke `src/app/(dashboard)/dashboard/(overview)/page.tsx` secara paralel (`Promise.all`), menerapkan responsive height clamping (`lg:min-h-[480px]` desktop, adaptif mobile), dan memperbarui `DashboardSkeleton.tsx` untuk proteksi zero CLS.
  5. **Verifikasi Kualitas:** `tsc --noEmit` PASS (0 errors), `bun test` 118/118 PASS (608 expect calls across 10 test suites), Turbopack build PASS (11/11 routes), 0 monospace utility font, 0 literal emojis.
- **File Changelog:** [`2026-11-24_wealth_trajectory_chart.md`](.changelog/2026-11-24_wealth_trajectory_chart.md).

### Checkpoint 2: Skenario SC-16 — Preservasi Soft-Delete Permanen Transaksi untuk Jejak Audit Finansial (2026-11-23 20:22 WIB)
- **Status:** `COMPLETED ✅ — Approved by Kenzo (Explicit batch authorization)`
- **Agent:** Antigravity
- **Capaian Utama:**
  1. **Audit & Penyelamatan Jejak Audit Finansial (*Audit Trail Integrity*):** Menutup celah di mana transaksi yang melewati jendela undo dimusnahkan secara permanen dari database (`DELETE FROM transactions`).
  2. **Invarian Soft-Delete Permanen (`src/actions/transactions.ts`):** Mengeliminasi query hard-delete fisik dan menggantikannya dengan preservasi record `isDeleted = true` permanen, mengembalikan `deletedCount: 0` dan `archivedCount` sebagai jaminan rekonsiliasi audit tahunan.
  3. **Verifikasi Kualitas:** `tsc --noEmit` PASS (0 errors), `bun test` 106/106 PASS (474 expect calls across 7 test files), Turbopack build PASS (11/11 routes), 0 `font-mono`, 0 literal emojis.
- **File Changelog:** [`2026-11-23_sc16_permanent_soft_delete_audit_trail.md`](.changelog/2026-11-23_sc16_permanent_soft_delete_audit_trail.md).

### Checkpoint 3: Skenario SC-15 — Proteksi Transfer Brankas Dana Darurat saat Target Rp 0 atau Sudah 100% Tercapai (2026-11-23 20:19 WIB)
- **Status:** `COMPLETED ✅ — Approved by Kenzo (Explicit batch authorization)`
- **Agent:** Antigravity
- **Capaian Utama:**
  1. **Audit & Penyelamatan Likuiditas Tabungan Bebas (*Emergency Vault Guard*):** Menutup celah di mana pengguna yang belum menentukan target dana darurat atau sudah mencapai 100% target ideal tidak sengaja mengunci tabungan bebas ke dana darurat.
  2. **Validasi Server-Side Atomik (`src/actions/savings.ts`):** Mencegah transfer jika target masih Rp 0 (`TARGET_ZERO`) dan meminta konfirmasi sadar (`allowOverTarget`) jika target sudah 100% terpenuhi (`TARGET_ALREADY_REACHED`).
  3. **Antarmuka Konfirmasi Sadar (`EmergencyVaultCard.tsx`):** Menampilkan banner edukatif ketika target Rp 0 dan checkbox konfirmasi sadar *"Saya ingin tetap menambah cadangan ekstra di atas 100%"* saat target sudah tercapai.
  4. **Verifikasi Kualitas:** `tsc --noEmit` PASS (0 errors), `bun test` 105/105 PASS (471 expect calls across 7 test files), Turbopack build PASS (11/11 routes), 0 `font-mono`, 0 literal emojis.
- **File Changelog:** [`2026-11-23_sc15_guard_emergency_fund_transfer_zero_or_full_target.md`](.changelog/2026-11-23_sc15_guard_emergency_fund_transfer_zero_or_full_target.md).

### Checkpoint 4: Skenario SC-13 — Proteksi Pembuatan Siklus Bulan Baru saat Bulan Aktif Belum Ditutup Buku (2026-11-23 20:15 WIB)
- **Status:** `COMPLETED ✅ — Approved by Kenzo (Explicit batch authorization)`
- **Agent:** Antigravity
- **Capaian Utama:**
  1. **Audit & Penyelamatan Rantai Riwayat Finansial (*Anti-Lompat Bulan*):** Menutup celah di mana siklus bulan baru dapat dibuat berulang kali tanpa menutup buku bulan berjalan, yang sebelumnya menyebabkan sisa saldo Uang Bebas bulan lama tidak pernah disapu (*month sweep*) ke tabungan.
  2. **Validasi Server-Side Atomik (`src/actions/months.ts`):** Memeriksa apakah terdapat siklus bulan dengan `isClosed = false`. Jika ditemukan dan belum dikonfirmasi sadar (`allowUnclosedPrevious = false`), Server Action memblokir proses dan mengembalikan pesan ramah pengguna.
  3. **Antarmuka Dialog Edukatif (`CreateMonthDialog.tsx`):** Menampilkan banner konfirmasi peringatan taktil lengkap dengan tombol konfirmasi sadar *"Tetap Buat (Lompati Tutup Buku)"*.
  4. **Verifikasi Kualitas:** `tsc --noEmit` PASS (0 errors), `bun test` 104/104 PASS (464 expect calls across 7 test files), Turbopack build PASS (11/11 routes), 0 `font-mono`, 0 literal emojis.
- **File Changelog:** [`2026-11-23_sc13_guard_month_creation_unclosed_previous_cycle.md`](.changelog/2026-11-23_sc13_guard_month_creation_unclosed_previous_cycle.md).

### Checkpoint 5: Skenario SC-12 — Realokasi Kuota Belanja saat Cicilan Dilunasi di Bulan Berjalan (2026-11-23 20:11 WIB)
- **Status:** `COMPLETED ✅ — Approved by Kenzo (Explicit batch authorization)`
- **Agent:** Antigravity
- **Capaian Utama:**
  1. **Audit & Penyelamatan Dana Menganggur (*Idle Installment Quota*):** Menutup celah di mana saat cicilan ditandai lunas di bulan aktif, pos anggaran terkait tetap menahan kuota normal dan tidak dapat digunakan untuk kebutuhan lain.
  2. **Realokasi Dinamis Realtime (`src/actions/liabilities.ts`):** Mengizinkan update `isSettled: true`. Di siklus bulan terbuka, sistem menghitung belanja aktual (`spent`), menyetel `targetBudget = spent`, dan mengembalikan sisa kuota yang belum terpakai (`targetBudget - spent`) secara atomik ke `uang_bebas_tabungan`.
  3. **Antarmuka Pelunasan Instan (`LiabilityTrackerCard.tsx`):** Menambahkan opsi centang *"Tandai cicilan ini lunas sekarang"* pada modal ubah cicilan dengan catatan informatif bagi pengguna.
  4. **Verifikasi Kualitas:** `tsc --noEmit` PASS (0 errors), `bun test` 103/103 PASS (458 expect calls across 7 test files), Turbopack build PASS (11/11 routes), 0 `font-mono`, 0 literal emojis.
- **File Changelog:** [`2026-11-23_sc12_reallocate_unspent_quota_when_liability_settled.md`](.changelog/2026-11-23_sc12_reallocate_unspent_quota_when_liability_settled.md).

---

## 📚 Rekapitulasi Arsip Milestone Lengkap

| Milestone / Fase | Tanggal Selesai | Ringkasan Capaian Utama | Berkas Changelog |
| :--- | :--- | :--- | :--- |
| **Skenario SC-11: Edit, Hapus & Auto-Refund Wishlist** | 2026-11-23 | Validasi perubahan target, proteksi wishlist dibeli, dan pengembalian atomik dana ke Tabungan Bebas saat dihapus. | [`2026-11-23_sc11_wishlist_edit_delete_and_auto_refund.md`](.changelog/2026-11-23_sc11_wishlist_edit_delete_and_auto_refund.md) |
| **Skenario SC-10: Over-Allocation Guard pada Wishlists** | 2026-11-23 | Proteksi alokasi melebihi sisa kekurangan barang impian, likuiditas tabungan bebas terlindungi. | [`2026-11-23_sc10_prevent_wishlist_over_allocation.md`](.changelog/2026-11-23_sc10_prevent_wishlist_over_allocation.md) |
| **Skenario SC-09: Pencegahan Pos Hantu saat Menghapus Cicilan** | 2026-11-23 | Menjaga flag isTemporary: true pada pos yang dilepas keterikatannya agar tidak diwariskan ke siklus baru. | [`2026-11-23_sc09_prevent_ghost_categories_on_liability_deletion.md`](.changelog/2026-11-23_sc09_prevent_ghost_categories_on_liability_deletion.md) |
| **Skenario SC-08: Validasi Pokok Utang Tidak Boleh < Total Terbayar** | 2026-11-23 | Server-side FOR UPDATE row lock mencegah pokok utang diedit lebih kecil dari yang sudah dibayar. | [`2026-11-23_sc08_prevent_total_debt_smaller_than_paid.md`](.changelog/2026-11-23_sc08_prevent_total_debt_smaller_than_paid.md) |
| **Skenario SC-07: Hard Freeze Mutasi Tabungan pada Barang Impian Terbeli** | 2026-11-23 | Anti-magic money: mutasi alokasi & penarikan dikunci permanen saat isPurchased = true. | [`2026-11-23_sc07_freeze_mutations_on_purchased_wishlists.md`](.changelog/2026-11-23_sc07_freeze_mutations_on_purchased_wishlists.md) |
| **Skenario SC-06: Shock Deficit Guard pada Freelance Income Deletion** | 2026-11-23 | Pencegahan defisit mendadak saat pemasukan sampingan dihapus/dikurangi, dialog bahaya sadar. | [`2026-11-23_sc06_shock_deficit_guard_on_income_deletion.md`](.changelog/2026-11-23_sc06_shock_deficit_guard_on_income_deletion.md) |
| **Skenario SC-06: Shock Deficit Guard pada Freelance Income Deletion** | 2026-11-23 | Pencegahan defisit mendadak saat pemasukan sampingan dihapus/dikurangi, dialog bahaya sadar. | [`2026-11-23_sc06_shock_deficit_guard_on_income_deletion.md`](.changelog/2026-11-23_sc06_shock_deficit_guard_on_income_deletion.md) |
| **Skenario SC-05: Penyesuaian Plafon Bulan Terakhir Cicilan & Relokasi Dana Menganggur** | 2026-11-23 | Target cicilan capped ke min(monthlyPayment, sisa pokok), surplus otomatis dialihkan ke uang bebas. | [`2026-11-23_sc05_last_month_installment_remaining_principal.md`](.changelog/2026-11-23_sc05_last_month_installment_remaining_principal.md) |
| **Skenario SC-05: Penyesuaian Plafon Bulan Terakhir Cicilan & Relokasi Dana Menganggur** | 2026-11-23 | Target cicilan capped ke min(monthlyPayment, sisa pokok), surplus otomatis dialihkan ke uang bebas. | [`2026-11-23_sc05_last_month_installment_remaining_principal.md`](.changelog/2026-11-23_sc05_last_month_installment_remaining_principal.md) |
| **Skenario SC-03 & SC-04: Zero-Based Budgeting Rebalancing & Custom Category Leak Protection** | 2026-11-22 | Konservasi zero-sum saat edit target pos dan penyerapan kuota uang bebas saat tambah pos kustom. | [`2026-11-22_sc03_sc04_zbb_rebalancing_and_custom_category_leak_protection.md`](.changelog/2026-11-22_sc03_sc04_zbb_rebalancing_and_custom_category_leak_protection.md) |

---

## 📚 Rekapitulasi Arsip Milestone Lengkap

| Milestone / Fase | Tanggal Selesai | Ringkasan Capaian Utama | Berkas Changelog |
| :--- | :--- | :--- | :--- |
| **Skenario SC-14: Tutup Buku Menyapu Bersih Surplus Realisasi Kas (Total Pemasukan – Total Kas Keluar)** | 2026-11-22 | Sweep saldo berbasis surplus kas riil bersih (max(0, income - expenses)), anti-uang menguap. | [`2026-11-22_sc14_real_cashflow_surplus_sweep.md`](.changelog/2026-11-22_sc14_real_cashflow_surplus_sweep.md) |

---

## 📚 Rekapitulasi Arsip Milestone Lengkap

| Milestone / Fase | Tanggal Selesai | Ringkasan Capaian Utama | Berkas Changelog |
| :--- | :--- | :--- | :--- |
| **Skenario 2 (SC-02): Reopen Month Sweep Reversal & Anti-Double-Counting** | 2026-11-22 | Kolom sweptAmount di DB, penarikan kembali saldo sweep saat buka buku, dan anti-defisit guard. | [`2026-11-22_sc02_reopen_month_sweep_reversal_anti_double_counting.md`](.changelog/2026-11-22_sc02_reopen_month_sweep_reversal_anti_double_counting.md) |
  5. **Transparansi UI & Dialog Konfirmasi (`AiMonthlyReviewModal.tsx`):** Menampilkan rincian transparan *"Saldo Sweep Ditarik Kembali: -Rp xxx"* pada dialog konfirmasi saat bulan berstatus tertutup, serta notifikasi toast informatif pasca pembukaan kembali siklus.
  6. **Verifikasi Kualitas:** `tsc --noEmit` PASS (0 errors), `bun test` 91/91 PASS (410 assertions across 7 test files), Turbopack build PASS (11/11 routes), 0 `font-mono`, 0 literal emojis.
- **File Changelog:** [`2026-11-22_sc02_reopen_month_sweep_reversal_anti_double_counting.md`](.changelog/2026-11-22_sc02_reopen_month_sweep_reversal_anti_double_counting.md).

---

## 📚 Rekapitulasi Arsip Milestone Lengkap

| Milestone / Fase | Tanggal Selesai | Ringkasan Capaian Utama | Berkas Changelog |
| :--- | :--- | :--- | :--- |
| **Skenario 1 (SC-01): Status "Sudah Dibayar Bulan Ini" & Bayar Ekstra dari Uang Bebas** | 2026-11-22 | Badge hijau lunas bulan ini, tombol bayar ekstra dari uang bebas, validasi anti-defisit, dan undo rekonsiliasi. | [`2026-11-22_liability_extra_installment_and_paid_status.md`](.changelog/2026-11-22_liability_extra_installment_and_paid_status.md) |
| **Standardisasi Dialog Konfirmasi Seluruh Aksi Mutasi Finansial & Destruktif** | 2026-11-22 | Modal konfirmasi bayar cicilan, hapus transaksi, hapus pemasukan, hapus template pos, tutup buku, dan wishlist terbeli. | [`2026-11-22_action_confirmation_dialogs.md`](.changelog/2026-11-22_action_confirmation_dialogs.md) |
| **Penyelarasan Kontrak Cicilan** | 2026-11-22 | Smart auto-calculate pokok/tenor/angsuran, penguncian pos cicilan, dan modal edit cicilan terpusat. | [`2026-11-22_liability_smart_auto_calculate_and_budget_lock.md`](.changelog/2026-11-22_liability_smart_auto_calculate_and_budget_lock.md) |

| Milestone / Fase | Tanggal Selesai | Ringkasan Capaian Utama | Berkas Changelog |
| :--- | :--- | :--- | :--- |
| **Rekonfigurasi Skeleton Tiap Halaman** | 2026-11-22 | 5 skeleton otentik terdedikasi per rute, eliminasi layout ganda di `PageSectionSkeleton.tsx`. | [`2026-11-22_page_specific_skeletons_and_eliminate_double_layout.md`](.changelog/2026-11-22_page_specific_skeletons_and_eliminate_double_layout.md) |
| **Standarisasi Semua Modal Box & Sheet** | 2026-11-15 | Eliminasi padding Dialog, footer solid hitam nempel tepi-ke-tepi, tombol close lega. | [`2026-11-15_standardize_all_modal_boxes_fixed_header_footer_and_scrollable_body.md`](.changelog/2026-11-15_standardize_all_modal_boxes_fixed_header_footer_and_scrollable_body.md) |
| **Layout Card Pos 2 Baris, Animasi Tab Rp/% & 36 Ikon Finansial** | 2026-11-15 | MonthSelector 360px 2 baris, animasi geser sliding indicator, dan ekspansi 36 ikon finansial Lucide. | [`2026-11-15_refine_onboarding_template_cards_and_full_width_button.md`](.changelog/2026-11-15_refine_onboarding_template_cards_and_full_width_button.md) |
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
