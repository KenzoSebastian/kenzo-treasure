---
date: 2026-11-15
time: "17:32 WIB"
timezone: Asia/Jakarta
task: "Implementasi Penuh Fase R1–R10 (Pilihan A Batch Terkendali) dari PLANREVISI.md"
prompt: "gapapa, emng harusnya per langkah, tapi untuk ini langsung kerjakan sekaligus pilihan A yaa, tolong teliti, tidak usah buru buru, agar hasilnya maksimal"
author: Antigravity
---

# Implementasi Penuh Fase R1–R10 (`PLANREVISI.md` — Pilihan A Batch Terkendali)

## 1. Ringkasan Perubahan
- **Fase R1 & R2 (Zero-Emoji Policy & Curated Lucide Icon System):**
  - Membuat registry 24 ikon kurasi `lucide-react` di `src/lib/category-icons.ts` lengkap dengan fallback kompatibilitas mundur dari kode poin emoji historis dan helper `stripEmojiPrefix`.
  - Membuat primitif `<AppCategoryIcon />` (`src/components/common/AppCategoryIcon.tsx`) dan `<IconPicker />` (`src/components/common/IconPicker.tsx`).
  - Mengganti seluruh emoji literal pada UI produksi, lencana milestone wishlist, modal evaluasi AI, ekspor CSV/Excel, dan landing page (`HeroSection`, `MobileShowcase`, `LandingFooter`, `FaqAccordion`, `SecuritySection`).
- **Fase R3 (Zero-Dummy Architecture, Guided Onboarding & Dynamic User Setup):**
  - Memperbarui `src/db/schema.ts` dan menambahkan migrasi `0002_onboarding_templates_and_restrict.sql` serta `0003_cleanup_legacy_emojis.sql` (`users.defaultBaseSalary`, `users.onboardingCompletedAt`, `savingsAccount.emergencyFundTarget` default `0`, `liabilities.icon`, unique constraint `(user_id, year, month_index)` pada `months`, `ON DELETE RESTRICT` pada `transactions.category_id`, dan tabel `user_budget_templates` + RLS).
  - Menghapus seluruh konstanta/fallback dummy pribadi di `dashboard/page.tsx`, `vault/page.tsx`, `wishlists/page.tsx`, `analytics/page.tsx`, `month-generator.ts`, `months.ts`, dan `savings.ts`.
  - Membangun halaman `/onboarding` (`src/app/onboarding/page.tsx`) dan komponen `OnboardingWizard` (`src/components/features/onboarding/OnboardingWizard.tsx`), serta panel pengaturan di `/dashboard/settings` (`FinanceDefaultsPanel`, `BudgetTemplateManager`).
- **Fase R4 (Dynamic Category Creation & Safe Deletion Strategy):**
  - Menerapkan `deleteCategory` di `src/actions/categories.ts` dengan mode `"deactivate_next_month"` (`targetBudget = 0, isTemporary = true` + relokasi ke `Uang Bebas`) dan `"permanent_delete"` (hapus langsung bila 0 transaksi atau *1-Click Bulk Reassign* bila memiliki transaksi), serta UI dialog hapus 2 opsi di `BudgetCategoryCard.tsx`.
- **Fase R5 (Dashboard Header 2x2 Action Grid):**
  - Menata area aksi kanan header di `src/app/(dashboard)/dashboard/page.tsx` menjadi grid 2x2 simetris di desktop (`lg:grid lg:grid-cols-2 lg:gap-2.5 lg:w-[440px]`) dan menyelaraskan `w-full justify-center` pada `MonthSelector`, `CreateMonthDialog`, `AiMonthlyReviewModal`, dan `QuickTransactionDrawer`.
- **Fase R6 (Tactile Sliding Segmented Control & Interactive Controls):**
  - Membuat hook `useSlidingIndicator` (`src/hooks/use-sliding-indicator.ts`) dan komponen `<SlidingSegmentedControl />` (`src/components/common/SlidingSegmentedControl.tsx`) serta mengintegrasikannya di `AppHeader`, `MobileBottomNav`, `AnalyticsDashboard`, `QuickTransactionDrawer`, `IncomeSection`, `EmergencyVaultCard`, `AllocateWishlistDrawer`, `BudgetCategoryList`, `BudgetTemplateManager`, dan `OnboardingWizard`.
- **Fase R7 (Transaction History Card & Category Details Modal Refinement):**
  - Mengekstrak `BudgetCategoryDetailsPanel` di `BudgetCategoryCard.tsx` dan menambahkan fitur pencarian instan, filter metode pembayaran, dan urutan terbaru/terbesar di `TransactionSubList.tsx`.
- **Fase R8 (Integrated Installment & Debt Payment Flow + Concurrency Guard):**
  - Membuat helper transaksional bersama `executeCategoryTransactionTx` (`src/lib/category-transaction-tx.ts`) dengan `FOR UPDATE` row-level locking dan anti-overpayment guard yang digunakan oleh `createTransaction` maupun `recordInstallmentPayment`, serta pemulihan `paidAmount`/`isSettled` pada `softDeleteTransaction` dan `restoreTransaction`.
  - Menambahkan `resolveDefaultCycleDate` berbasis zona waktu `Asia/Jakarta` di `src/lib/financial-calculations.ts`.
- **Fase R9 & R10 (Performance, Deduplication & Instant Tab Skeletons):**
  - Membuat `getCachedAuthenticatedSession` & `getCachedUserId` berbasis `React.cache(...)` di `src/lib/queries/auth.ts`, `revalidateDashboardRoutes()` di `src/lib/revalidate.ts`, `MonthNavigationContext` + `DashboardMonthShell`, `PageSectionSkeleton` + 4 berkas `loading.tsx`, dan memperbaiki mutasi array in-place di `src/actions/export.ts`.
  - Memperbarui 5 berkas pengujian otomatis (`87/87 PASS`) serta menyinkronkan `docs/DESIGN-SYSTEM.md` dan `docs/PROJECT-STRUCTURE.md`.

## 2. Daftar Berkas yang Berubah
- `[MODIFIED]` `src/db/schema.ts`, `src/db/migrations/meta/_journal.json`
- `[CREATED]` `src/db/migrations/0002_onboarding_templates_and_restrict.sql`, `src/db/migrations/0003_cleanup_legacy_emojis.sql`, `src/db/migrations/meta/0002_snapshot.json`, `src/db/migrations/meta/0003_snapshot.json`
- `[CREATED]` `src/lib/category-icons.ts`, `src/lib/category-transaction-tx.ts`, `src/lib/revalidate.ts`, `src/lib/queries/auth.ts`, `src/lib/queries/settings.ts`
- `[MODIFIED]` `src/lib/financial-calculations.ts`, `src/lib/month-generator.ts`, `src/lib/ai/gemini.ts`, `src/lib/queries/index.ts`, `src/lib/queries/months.ts`, `src/lib/queries/savings.ts`, `src/lib/queries/analytics.ts`, `src/proxy.ts`, `src/types/liability.ts`
- `[CREATED]` `src/schemas/onboarding.schema.ts`, `src/schemas/settings.schema.ts`
- `[MODIFIED]` `src/schemas/category.schema.ts`, `src/schemas/liability.schema.ts`, `src/schemas/month.schema.ts`, `src/schemas/savings.schema.ts`, `src/schemas/wishlist.schema.ts`, `src/schemas/index.ts`
- `[CREATED]` `src/actions/onboarding.ts`, `src/actions/settings.ts`
- `[MODIFIED]` `src/actions/auth.ts`, `src/actions/categories.ts`, `src/actions/export.ts`, `src/actions/incomes.ts`, `src/actions/liabilities.ts`, `src/actions/months.ts`, `src/actions/savings.ts`, `src/actions/transactions.ts`, `src/actions/wishlists.ts`
- `[CREATED]` `src/hooks/use-sliding-indicator.ts`, `src/components/common/AppCategoryIcon.tsx`, `src/components/common/IconPicker.tsx`, `src/components/common/SlidingSegmentedControl.tsx`, `src/components/layout/PageSectionSkeleton.tsx`, `src/components/features/months/MonthNavigationContext.tsx`, `src/components/features/months/DashboardMonthShell.tsx`, `src/components/features/onboarding/OnboardingWizard.tsx`, `src/components/features/onboarding/index.ts`, `src/components/features/settings/FinanceDefaultsPanel.tsx`, `src/components/features/settings/BudgetTemplateManager.tsx`
- `[MODIFIED]` `src/hooks/index.ts`, `src/components/common/index.ts`, `src/components/common/NetworkStatusBanner.tsx`, `src/components/layout/AppHeader.tsx`, `src/components/layout/MobileBottomNav.tsx`, `src/components/layout/DashboardLayout.tsx`, `src/components/layout/DashboardSkeleton.tsx`, `src/components/features/months/index.ts`, `src/components/features/months/MonthSelector.tsx`, `src/components/features/months/CreateMonthDialog.tsx`, `src/components/features/categories/BudgetCategoryCard.tsx`, `src/components/features/categories/BudgetCategoryList.tsx`, `src/components/features/transactions/QuickTransactionDrawer.tsx`, `src/components/features/transactions/TransactionSubList.tsx`, `src/components/features/incomes/IncomeSection.tsx`, `src/components/features/liabilities/LiabilityTrackerCard.tsx`, `src/components/features/savings/EmergencyVaultCard.tsx`, `src/components/features/wishlists/WishlistCard.tsx`, `src/components/features/wishlists/AllocateWishlistDrawer.tsx`, `src/components/features/analytics/AnalyticsDashboard.tsx`, `src/components/features/ai/AiMonthlyReviewModal.tsx`, `src/components/features/settings/DataExportPanel.tsx`, `src/components/features/settings/index.ts`, `src/components/features/dashboard/ExecutiveSummaryCard.tsx`, `src/components/features/landing/HeroSection.tsx`, `src/components/features/landing/MobileShowcase.tsx`, `src/components/features/landing/LandingFooter.tsx`, `src/components/features/landing/FaqAccordion.tsx`, `src/components/features/landing/SecuritySection.tsx`
- `[CREATED]` `src/app/onboarding/page.tsx`, `src/app/(dashboard)/dashboard/vault/loading.tsx`, `src/app/(dashboard)/dashboard/wishlists/loading.tsx`, `src/app/(dashboard)/dashboard/analytics/loading.tsx`, `src/app/(dashboard)/dashboard/settings/loading.tsx`
- `[MODIFIED]` `src/app/page.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`, `src/app/(dashboard)/dashboard/page.tsx`, `src/app/(dashboard)/dashboard/vault/page.tsx`, `src/app/(dashboard)/dashboard/wishlists/page.tsx`, `src/app/(dashboard)/dashboard/analytics/page.tsx`, `src/app/(dashboard)/dashboard/settings/page.tsx`
- `[MODIFIED]` `src/lib/__tests__/financial-calculations.test.ts`, `src/schemas/__tests__/schemas.test.ts`, `src/actions/__tests__/months.test.ts`, `src/actions/__tests__/backend-phases-b7-b13.test.ts`, `src/components/features/__tests__/frontend-phases-f7-f18.test.tsx`, `src/components/features/dashboard/__tests__/ExecutiveSummaryCard.test.tsx`
- `[MODIFIED]` `docs/DESIGN-SYSTEM.md`, `docs/PROJECT-STRUCTURE.md`

## 3. Hasil Verifikasi Otomatis
- `bun test`: **PASS** (`87 pass, 0 fail, 343 expect() calls` lintas 7 berkas test, termasuk Automated Zero-Emoji, Zero-Dummy, dan Zero-Monospace Audit).
- `bun run typecheck` (`tsc --noEmit`): **PASS** (`0 errors`).
- Audit Kanonikalisasi Kelas Tailwind v4 (`@tailwindcss/node`): **PASS** (`Total non-canonical: 0`).
- Audit `grep -rn "font-mono" src/`: **PASS** (`0 matches`).
- `bun run build` (`next build`): **PASS** (10 rute berhasil dikompilasi dan dioptimalkan).
- Pengujian Interaksi UI Manual di Browser: **NOT RUN** (Menunggu pengujian manual oleh Kenzo).

## 4. Status Persetujuan
- **Status:** `IMPLEMENTED — AWAITING APPROVAL` (Menunggu persetujuan eksplisit Kenzo untuk mencentang checklist `docs/plans/PLANREVISI.md` dan membersihkan `docs/review/`).
