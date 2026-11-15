# Struktur Proyek — Kenzo Treasury

> **Status: Tersinkronisasi dengan Implementasi Aktual (Fase B1–B13 & F1–F18).** Disusun dan diverifikasi terhadap struktur source code aktual, `PRD.md`, `docs/plans/PLANBACKEND.md`, `docs/plans/PLANFRONTEND.md`, dan `laporan.md`.

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
│   │   └── PLANFRONTEND.md           # Roadmap dan checklist frontend (F1–F18)
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
│   │   ├── (auth)/                   # Zona Autentikasi Publik
│   │   │   ├── login/page.tsx        # Halaman Masuk Akun
│   │   │   └── register/page.tsx     # Halaman Registrasi Akun
│   │   ├── (dashboard)/              # Zona Workspace Privat Terproteksi
│   │   │   ├── layout.tsx            # Wrapper Layout Zona Dashboard Privat
│   │   │   └── dashboard/
│   │   │       ├── page.tsx          # Panel Utama (Orchestrator Ikhtisar Bulanan)
│   │   │       ├── loading.tsx       # Skeleton UI saat transisi halaman
│   │   │       ├── error.tsx         # Error boundary pemulihan workspace
│   │   │       ├── wishlists/page.tsx# Sinking Fund & Wishlist Barang Impian
│   │   │       ├── analytics/page.tsx# Grafik Tren Tabungan & Cashflow Recharts
│   │   │       ├── vault/page.tsx    # Brankas Dana Darurat (Safety Months)
│   │   │       └── settings/page.tsx # Pengaturan & Ekspor Data Backup Mandiri
│   │   ├── globals.css               # Tailwind v4 / theme / global CSS
│   │   ├── layout.tsx                # Root layout & PWA metadata/viewport
│   │   └── providers.tsx             # Komposisi provider (Theme + TanStack Query)
│   ├── actions/                      # Mutasi server terotorisasi (Write Layer)
│   │   ├── auth.ts                   # Fase B2: login, register, logout, getCurrentUser
│   │   ├── months.ts                 # Fase B5: createMonthlyCycle, closeMonth, reopenMonth
│   │   ├── incomes.ts                # Fase B6: addIncome, updateIncome, deleteIncome
│   │   ├── liabilities.ts            # Fase B7: createLiability, recordInstallmentPayment, updateLiability
│   │   ├── categories.ts             # Fase B8: updateCategoryTarget, addCustomCategory, reorderCategories
│   │   ├── transactions.ts           # Fase B9: createTransaction, softDeleteTransaction, restoreTransaction, hardDeleteExpiredTransactions
│   │   ├── wishlists.ts              # Fase B10: createWishlist, allocateSavings, withdrawFromWishlist, markWishlistAsPurchased
│   │   ├── savings.ts                # Fase B11: transferToEmergencyFund, withdrawFromEmergencyFund, updateEmergencyFundTarget, topUpFreeSavings
│   │   ├── analytics.ts              # Fase B12: Server Action wrapper analitik
│   │   ├── ai-review.ts              # Fase B13: generateMonthlyReview (Gemini + Deterministic Fallback)
│   │   └── export.ts                 # Fase B13: exportFinancialData (CSV, Excel, JSON)
│   ├── components/
│   │   ├── ui/                       # Primitif/reusable Shadcn UI
│   │   ├── layout/                   # AppHeader, MobileBottomNav, DashboardLayout, DashboardSkeleton, DashboardErrorBoundary, ThemeToggle
│   │   ├── common/
│   │   │   ├── NetworkStatusBanner.tsx # Fase F18: Banner Offline & Auto-Sync
│   │   │   └── index.ts
│   │   └── features/
│   │       ├── __tests__/            # frontend-phases-f7-f18.test.tsx
│   │       ├── landing/              # Komponen Halaman Depan Publik (Fase F3)
│   │       ├── months/               # MonthSelector, CreateMonthDialog, index.ts (Fase F5)
│   │       ├── dashboard/            # ExecutiveSummaryCard, CashflowSummaryCard, DashboardHubCard, __tests__/, index.ts (Fase F6)
│   │       ├── categories/           # BudgetCategoryCard, BudgetCategoryList, index.ts (Fase F7)
│   │       ├── transactions/         # QuickTransactionDrawer, TransactionSubList, index.ts (Fase F8 & F9)
│   │       ├── incomes/              # IncomeSection, index.ts (Fase F10)
│   │       ├── liabilities/          # LiabilityTrackerCard, index.ts (Fase F11)
│   │       ├── wishlists/            # WishlistCard (+ WishlistGrid), AllocateWishlistDrawer, index.ts (Fase F12 & F13)
│   │       ├── savings/              # EmergencyVaultCard, index.ts (Fase F14)
│   │       ├── analytics/            # AnalyticsDashboard, index.ts (Fase F15)
│   │       ├── ai/                   # AiMonthlyReviewModal, index.ts (Fase F16)
│   │       └── settings/             # DataExportPanel, index.ts (Fase F17)
│   ├── db/
│   │   ├── index.ts                  # Koneksi/klien DB Drizzle + Postgres
│   │   ├── schema.ts                 # Skema 9 Tabel Drizzle ORM
│   │   └── migrations/               # Migrasi SQL & RLS policies
│   ├── hooks/                        # Hook React (Fase F18)
│   │   ├── use-mobile.ts
│   │   ├── use-offline-sync.ts
│   │   ├── use-countdown.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── queries/                  # Read-Only Data Access Layer untuk Server Components
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
│   │   │   └── gemini.ts             # Fase B13: Google GenAI SDK client & deterministic evaluator
│   │   ├── supabase/                 # Helper SSR/browser Supabase Auth
│   │   ├── month-generator.ts        # Generator pos anggaran bulanan dinamis dari DB
│   │   ├── query-client.ts
│   │   ├── financial-calculations.ts # Single Source of Truth rumus finansial murni
│   │   ├── image-compressor.ts       # Fase F12: Kompresor foto HTML5 Canvas ke WebP <200KB
│   │   └── utils.ts
│   ├── schemas/                      # Kontrak validasi Zod (Single Entry Point via index.ts)
│   │   ├── auth.schema.ts
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
