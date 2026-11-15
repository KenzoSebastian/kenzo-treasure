# Struktur Proyek — Kenzo Treasury

> **Status: Tersinkronisasi dengan Implementasi Aktual (Fase B1–B13, F1–F18 & R1–R10).** Disusun dan diverifikasi terhadap struktur source code aktual, `PRD.md`, `docs/plans/PLANBACKEND.md`, `docs/plans/PLANFRONTEND.md`, `docs/plans/PLANREVISI.md`, dan `laporan.md`.

## 1. Prinsip organisasi

- **Route-first, feature-oriented:** Next.js App Router menentukan route, sedangkan komponen dan proses bisnis dikelompokkan berdasarkan domain.
- **Batas lapisan yang jelas:** UI tidak mengakses database secara langsung; mutasi server memvalidasi input dan otorisasi; aturan finansial tidak diduplikasi di komponen.
- **Prinsip DRY (Don't Repeat Yourself) & Reusability:** Komponen antarmuka yang memiliki kerangka visual atau pola styling serupa (seperti kartu ringkasan atau kartu hub) wajib diabstraksi menjadi *reusable primitive* dengan memanfaatkan props konfigurasi dan slot `children`, bukan diduplikasi menjadi beberapa file terpisah yang redundan.
- **Prinsip Public Entry Point & Barrel Export:** Setiap direktori atau modul yang menampung banyak berkas sejenis (seperti tipe data, skema validasi, hooks, utilitas, atau komponen fitur) wajib menyediakan berkas `index.ts` sebagai pintu masuk tunggal (*single entry point*). Seluruh pemanggil di luar folder tersebut selalu mengimpor secara bersih via nama modul utama (misal: `@/types`, `@/schemas`) tanpa bergantung pada struktur berkas internal.
- **Ikuti repository:** bila struktur aktual berbeda dari blueprint, periksa alasan dan jangan melakukan pemindahan massal tanpa kebutuhan.

## 2. Peta direktori aktual

```text
kenzo-treasure/
├── AGENTS.md                         # Instruksi agent khusus proyek (ringkas)
├── PRD.md                            # Spesifikasi produk
├── laporan.md                        # Ringkasan status dan checkpoint proyek (Rolling Window <= 5)
├── .changelog/                       # Satu catatan ringkas per tugas/perubahan bermakna
├── .agents/
│   ├── rules/
│   │   ├── financial-domain.md       # Invarian keuangan
│   │   ├── database-access.md        # Auth, akses DB, RLS
│   │   ├── frontend-design.md        # Konvensi implementasi UI
│   │   └── project-architecture.md   # Aturan penempatan file
│   └── skills/
│       ├── phase-delivery/SKILL.md
│       └── financial-integrity/SKILL.md
├── docs/
│   ├── plans/
│   │   ├── PLANBACKEND.md            # Roadmap dan checklist backend (B1–B13)
│   │   ├── PLANFRONTEND.md           # Roadmap dan checklist frontend (F1–F18)
│   │   └── PLANREVISI.md             # Backlog & rencana kerja revisi terkumpul (Fase R*)
│   ├── PROJECT-STRUCTURE.md          # Dokumentasi arsitektur & struktur direktori ini
│   ├── DESIGN-SYSTEM.md              # Identitas visual yang disepakati
│   ├── REVIEW-AUDIT.md               # Audit teknis
│   └── DECISIONS-NEEDED.md           # Keputusan terbuka
├── public/
│   ├── icons/
│   │   ├── icon-192.svg              # Ikon PWA 192x192
│   │   └── icon-512.svg              # Ikon PWA 512x512
│   ├── manifest.json                 # Web App Manifest PWA (Fase F18)
│   └── sw.js                         # Service Worker caching aset statis PWA
├── src/
│   ├── app/                          # Next.js 16 App Router (Server Component Orchestrators)
│   │   ├── page.tsx                  # Root URL '/' — Public Landing Page (12 seksi)
│   │   ├── onboarding/
│   │   │   └── page.tsx              # Fase R3 & R10: Guided Onboarding Wizard 3 Langkah
│   │   ├── (auth)/                   # Zona Autentikasi Publik
│   │   │   ├── login/page.tsx        # Halaman Masuk Akun
│   │   │   └── register/page.tsx     # Halaman Registrasi Akun
│   │   ├── (dashboard)/              # Zona Workspace Privat Terproteksi
│   │   │   ├── layout.tsx            # Wrapper Layout Zona Dashboard Privat
│   │   │   └── dashboard/
│   │   │       ├── page.tsx          # Panel Utama (Orchestrator Ikhtisar Bulanan + Suspense)
│   │   │       ├── loading.tsx       # Skeleton UI saat transisi halaman utama
│   │   │       ├── error.tsx         # Error boundary pemulihan workspace
│   │   │       ├── wishlists/
│   │   │       │   ├── page.tsx      # Sinking Fund & Wishlist Barang Impian
│   │   │       │   └── loading.tsx   # Fase R10: Instant Tab Skeleton Wishlist
│   │   │       ├── analytics/
│   │   │       │   ├── page.tsx      # Grafik Tren Tabungan & Cashflow Recharts
│   │   │       │   └── loading.tsx   # Fase R10: Instant Tab Skeleton Analytics
│   │   │       ├── vault/
│   │   │       │   ├── page.tsx      # Brankas Dana Darurat (Safety Months)
│   │   │       │   └── loading.tsx   # Fase R10: Instant Tab Skeleton Vault
│   │   │       └── settings/
│   │   │           ├── page.tsx      # Pengaturan Keuangan, Template Pos & Backup Mandiri
│   │   │           └── loading.tsx   # Fase R10: Instant Tab Skeleton Settings
│   │   ├── globals.css               # Tailwind v4 / theme / global CSS
│   │   ├── layout.tsx                # Root layout & PWA metadata/viewport
│   │   └── providers.tsx             # Komposisi provider (Theme + TanStack Query)
│   ├── actions/                      # Mutasi server terotorisasi (Write Layer)
│   │   ├── auth.ts                   # Fase B2 & R3: login, register, logout, getCurrentUser
│   │   ├── onboarding.ts             # Fase R3 & R10: completeOnboarding, skipOnboarding, step actions
│   │   ├── settings.ts               # Fase R3, R4 & R10: updateFinanceDefaults, upsertBudgetTemplate, deleteBudgetTemplate
│   │   ├── months.ts                 # Fase B5 & R3: createMonthlyCycle, closeMonth, reopenMonth
│   │   ├── incomes.ts                # Fase B6: addIncome, updateIncome, deleteIncome
│   │   ├── liabilities.ts            # Fase B7 & R8: createLiability, recordInstallmentPayment, updateLiability
│   │   ├── categories.ts             # Fase B8 & R4: updateCategoryTarget, addCustomCategory, reorderCategories, deleteCategory
│   │   ├── transactions.ts           # Fase B9 & R8: createTransaction, softDeleteTransaction, restoreTransaction, hardDeleteExpiredTransactions
│   │   ├── wishlists.ts              # Fase B10 & R1: createWishlist, allocateSavings, withdrawFromWishlist, markWishlistAsPurchased
│   │   ├── savings.ts                # Fase B11: transferToEmergencyFund, withdrawFromEmergencyFund, updateEmergencyFundTarget, topUpFreeSavings
│   │   ├── analytics.ts              # Fase B12: Server Action wrapper analitik
│   │   ├── ai-review.ts              # Fase B13: generateMonthlyReview (Gemini + Deterministic Fallback)
│   │   └── export.ts                 # Fase B13 & R1: exportFinancialData (CSV, Excel, JSON)
│   ├── components/
│   │   ├── ui/                       # Primitif/reusable Shadcn UI
│   │   ├── layout/                   # AppHeader, MobileBottomNav, DashboardLayout, DashboardSkeleton, PageSectionSkeleton, DashboardErrorBoundary, ThemeToggle
│   │   ├── common/
│   │   │   ├── AppCategoryIcon.tsx   # Fase R1: Komponen ikon pos/cicilan/wishlist berbasis Lucide
│   │   │   ├── IconPicker.tsx        # Fase R1: Pemilih 24 ikon kurasi Lucide ramah mobile
│   │   │   ├── SlidingSegmentedControl.tsx # Fase R6 & R10: Segmented control taktil dengan indikator geser
│   │   │   ├── NetworkStatusBanner.tsx # Fase F18 & R10: Banner Offline & Auto-Sync
│   │   │   └── index.ts
│   │   └── features/
│   │       ├── __tests__/            # frontend-phases-f7-f18.test.tsx
│   │       ├── landing/              # Komponen Halaman Depan Publik (Fase F3 & R2)
│   │       ├── onboarding/           # OnboardingWizard, index.ts (Fase R3 & R10)
│   │       ├── months/               # MonthSelector, CreateMonthDialog, MonthNavigationContext, DashboardMonthShell, index.ts (Fase F5, R5 & R10)
│   │       ├── dashboard/            # ExecutiveSummaryCard, CashflowSummaryCard, DashboardHubCard, __tests__/, index.ts (Fase F6 & R9)
│   │       ├── categories/           # BudgetCategoryCard, BudgetCategoryList, index.ts (Fase F7, R4 & R7)
│   │       ├── transactions/         # QuickTransactionDrawer, TransactionSubList, index.ts (Fase F8, F9, R6 & R7)
│   │       ├── incomes/              # IncomeSection, index.ts (Fase F10 & R6)
│   │       ├── liabilities/          # LiabilityTrackerCard, index.ts (Fase F11 & R8)
│   │       ├── wishlists/            # WishlistCard (+ WishlistGrid), AllocateWishlistDrawer, index.ts (Fase F12, F13 & R1)
│   │       ├── savings/              # EmergencyVaultCard, index.ts (Fase F14 & R6)
│   │       ├── analytics/            # AnalyticsDashboard, index.ts (Fase F15 & R6)
│   │       ├── ai/                   # AiMonthlyReviewModal, index.ts (Fase F16 & R1)
│   │       └── settings/             # FinanceDefaultsPanel, BudgetTemplateManager, DataExportPanel, index.ts (Fase F17, R3 & R4)
│   ├── db/
│   │   ├── index.ts                  # Koneksi/klien DB Drizzle + Postgres
│   │   ├── schema.ts                 # Skema 10 Tabel Drizzle ORM (termasuk user_budget_templates)
│   │   └── migrations/               # Migrasi SQL (0000, 0001 RLS, 0002 onboarding & restrict, 0003 cleanup emojis)
│   ├── hooks/                        # Hook React (Fase F18, R6 & R10)
│   │   ├── use-mobile.ts
│   │   ├── use-offline-sync.ts
│   │   ├── use-countdown.ts
│   │   ├── use-sliding-indicator.ts  # Fase R6 & R10: Kalkulasi indikator geser ResizeObserver
│   │   └── index.ts
│   ├── lib/
│   │   ├── queries/                  # Read-Only Data Access Layer untuk Server Components
│   │   │   ├── auth.ts               # Fase R10: getCachedAuthenticatedSession & getCachedUserId (React.cache)
│   │   │   ├── settings.ts           # Fase R3 & R10: getUserFinanceSetup & getUserBudgetTemplates
│   │   │   ├── months.ts
│   │   │   ├── incomes.ts
│   │   │   ├── liabilities.ts
│   │   │   ├── categories.ts
│   │   │   ├── transactions.ts
│   │   │   ├── wishlists.ts
│   │   │   ├── savings.ts
│   │   │   ├── analytics.ts
│   │   │   └── index.ts
│   │   ├── ai/
│   │   │   └── gemini.ts             # Fase B13 & R1: Google GenAI SDK client & deterministic evaluator
│   │   ├── supabase/                 # Helper SSR/browser Supabase Auth
│   │   ├── category-icons.ts         # Fase R1: Registry 24 ikon kurasi Lucide & fallback emoji historis
│   │   ├── category-transaction-tx.ts# Fase R8: Helper atomik transaksi pos + cicilan dengan FOR UPDATE
│   │   ├── revalidate.ts             # Fase R10: revalidateDashboardRoutes terpusat 5 rute
│   │   ├── month-generator.ts        # Generator pos anggaran bulanan dinamis dari DB & template
│   │   ├── query-client.ts
│   │   ├── financial-calculations.ts # Single Source of Truth rumus finansial murni
│   │   ├── image-compressor.ts       # Fase F12: Kompresor foto HTML5 Canvas ke WebP <200KB
│   │   └── utils.ts
│   ├── schemas/                      # Kontrak validasi Zod (Single Entry Point via index.ts)
│   │   ├── auth.schema.ts
│   │   ├── onboarding.schema.ts      # Fase R3 & R10: Kontrak Zod wizard onboarding
│   │   ├── settings.schema.ts        # Fase R3, R4 & R10: Kontrak Zod pengaturan & template pos
│   │   ├── month.schema.ts
│   │   ├── income.schema.ts
│   │   ├── liability.schema.ts
│   │   ├── category.schema.ts
│   │   ├── transaction.schema.ts
│   │   ├── wishlist.schema.ts
│   │   ├── savings.schema.ts
│   │   └── index.ts
│   ├── types/                        # Kontrak tipe bersama lintas modul (Single Entry Point via index.ts)
│   │   ├── month.ts
│   │   ├── income.ts
│   │   ├── liability.ts
│   │   ├── category.ts
│   │   ├── transaction.ts
│   │   ├── wishlist.ts
│   │   ├── savings.ts
│   │   ├── analytics.ts
│   │   ├── ai-review.ts
│   │   └── index.ts
│   └── proxy.ts                      # Next.js 16 Edge Proxy (Session Refresh & Route Protection)
├── drizzle.config.ts
├── next.config.ts
├── package.json
├── bun.lock
├── postcss.config.mjs
├── tsconfig.json
└── .gitignore
```

## 3. Tanggung jawab setiap lapisan

| Lokasi | Isi yang tepat | Hindari |
|---|---|---|
| `src/app/` | Halaman Server Component Orchestrator, layout, boundary loading/error | Query DB langsung atau rumus finansial yang disalin berulang dalam JSX |
| `src/actions/` | Mutasi server (write) yang terautentikasi/terotorisasi | Menaruh query pembacaan panjang atau logika presentasi |
| `src/lib/queries/` | Fungsi pembacaan data (read-only) untuk Server Components | Mutasi database |
| `src/components/ui/` | Komponen UI umum dan adaptasi Shadcn | Aturan khusus cicilan, tabungan, atau ownership |
| `src/components/features/<domain>/` | Komponen dan presentasi khusus satu fitur + `index.ts` barrel | Duplikasi komponen generik lintas fitur |
| `src/components/layout/` | Shell, header, navigasi, layout | Perhitungan atau mutasi data |
| `src/db/` | Skema, koneksi, migrasi dan helper persistensi | UI, secret client, atau asumsi hak akses user |
| `src/schemas/` | Validasi input dan kontrak Zod bersama | Mendefinisikan ulang tipe yang dapat diinferensikan |
| `src/hooks/` | State UI, event handling, offline sync React | Proses keuangan otoritatif yang seharusnya di server |
| `src/lib/` | Kalkulasi finansial murni, generator bulan, kompresor WebP, adaptor AI | File serbaguna tanpa domain yang jelas |
| `src/types/` | Tipe lintas modul per domain | Tipe duplikat dari Drizzle/Zod |
| `public/` | Aset publik, ikon/manifest/service worker PWA | Kredensial, data privat pengguna |
