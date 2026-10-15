# 📊 Laporan Progres Pengembangan — Kenzo Treasury

Dokumen ini adalah rekapitulasi status pengerjaan proyek **Kenzo Treasury**, diperbarui secara berkala di setiap checkpoint pengembangan.

---

## 📌 Ringkasan Status Proyek

- **Status Saat Ini:** **Fase F4 Disetujui (Approved ✅)** $\rightarrow$ Siap untuk commit manual Git oleh Kenzo sebelum melangkah ke Fase berikutnya
- **Tech Stack Terkunci:**
  - Runtime & Package Manager: Bun (v1.4.2)
  - Frontend: Next.js 16 (App Router, React 19, TypeScript)
  - Styling: Tailwind CSS v4 + Shadcn UI (New York) + Lucide React
  - Form & Validation: React Hook Form + Zod (`@hookform/resolvers/zod`)
  - Database & ORM: Supabase (PostgreSQL) + Drizzle ORM / Drizzle Kit
  - Storage: Supabase Storage (`wishlist-images`, WebP compression)
  - State & Caching: TanStack Query v5 + Server Actions
  - Charts & Theme: Recharts + `next-themes` (Dark/Light Mode)
  - AI Review: Google Gemini 1.5 Flash (`@google/genai`)

---

## 🚀 Roadmap Pelaksanaan Fase

Seluruh fase teknis telah dipecah secara granular dan didokumentasikan di dua berkas roadmap:
- 🛠️ **Backend Roadmap:** [`PLANBACKEND.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/PLANBACKEND.md) (13 Fase Granular: B1 - B13)
- 🎨 **Frontend Roadmap:** [`PLANFRONTEND.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/PLANFRONTEND.md) (18 Fase Granular: F1 - F18, Fase F4 Disetujui ✅)

> **Protokol:** Agent hanya mengerjakan 1 fase per sesi. Checklist baru boleh dicentang (`- [x]`) setelah di-approve oleh Kenzo. Pasca-approval, Agent menyajikan rekomendasi commit git dan menahan eksekusi fase berikutnya (HOLD).

---

## 📝 Log Checkpoint Terbaru

### Checkpoint: Persetujuan Resmi Fase F4 — App Shell, Mobile Layout & Navigasi Utama Dashboard (2026-10-15 21:15 WIB)
- **Status:** Approved by Kenzo ✅
- **Capaian:**
  1. Primitif UI `Skeleton` (`src/components/ui/skeleton.tsx`): Komponen dasar animasi pulse untuk loading state.
  2. Komponen `AppHeader` (`src/components/layout/AppHeader.tsx`): Branding Kenzo Treasury, navigasi desktop (Dashboard, Pos Anggaran, Wishlist, Analitik), `ThemeToggle`, serta profil pengguna & dropdown logout terhubung ke Server Action `logout()`.
  3. Komponen `MobileBottomNav` (`src/components/layout/MobileBottomNav.tsx`): Navigasi bawah fixed mobile dengan safe-area support, touch target $\ge 48$px, dan deteksi rute/hash aktif.
  4. Komponen `DashboardLayout` (`src/components/layout/DashboardLayout.tsx` & `src/app/(dashboard)/layout.tsx`): Layout wrapper responsif yang menampung seluruh rute `(dashboard)` dengan batas lebar Swiss grid dan padding aman konten bawah.
  5. Fail-Closed Proteksi: Kerangka `DashboardSkeleton` (`src/components/layout/DashboardSkeleton.tsx` & `src/app/(dashboard)/dashboard/loading.tsx`) dan `DashboardErrorBoundary` (`src/components/layout/DashboardErrorBoundary.tsx` & `src/app/(dashboard)/dashboard/error.tsx`) dengan tombol aksi coba muat ulang (`reset()`).
  6. Refaktor Anti-Slop Swiss Functional: Menghapus 100% metadata debug/pengembang (tanpa User ID/UUID, tanpa label RLS, tanpa badge fase), menyajikan dashboard eksekutif nyata (arus kas, 7 pos wajib terproteksi, sinking fund, dan analitik) dengan angka sans-serif `tabular-nums`.
  7. Penyelesaian Checklist: Seluruh 4 butir checklist Fase F4 di `PLANFRONTEND.md` telah diverifikasi dan resmi dicentang (`- [x]`).
  8. Lolos seluruh pengujian: `bun run typecheck` (0 error), `bun test` (21/21 tests PASS), dan `bun run build` (Next.js 16 PASS).
- **File Changelog:** [`2026-10-15_fase_f4_app_shell_mobile_layout_navigasi.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-15_fase_f4_app_shell_mobile_layout_navigasi.md).

### Checkpoint: Persetujuan Resmi Fase F3 — Halaman Depan Publik 12 Seksi & PWA (2026-10-14 23:59 WIB)
- **Status:** Approved by Kenzo ✅
- **Capaian:**
  1. Implementasi 12 Seksi Landing Page Publik Lengkap: `LandingNavbar` (solid background tanpa `border-b`, smart hide on scroll down & reveal on scroll up, zero layout shift), `HeroSection`, `MetricsStrip`, `ProblemSolutionSection`, `BentoFeatures`, `MobileShowcase` (chassis iPhone Titanium murni CSS 2D floating, Dynamic Island vektor, tanpa dependensi gambar raster eksternal), `WorkflowSection`, `SecuritySection`, `ComparisonTable` (simbol status check/warning/cross bulat sempurna 1:1 dengan padding 1px), `FaqAccordion`, dan `LandingFooter` terintegrasi di `src/app/page.tsx`.
  2. Standar Tipografi Bebas `font-mono`: 100% nominal mata uang, rasio, dan angka metrik di seluruh UI landing page menggunakan font standar sans-serif dengan `tabular-nums`.
  3. Global Smooth Scrolling: Mengaktifkan `scroll-smooth` pada elemen root `<html>` di `src/app/layout.tsx` dan `src/app/globals.css` agar navigasi anchor dan scroll halaman berjalan mulus.
  4. Penyelesaian Checklist: Seluruh 12 butir checklist Fase F3 di `PLANFRONTEND.md` telah diverifikasi dan resmi dicentang (`- [x]`).
- **File Changelog:** [`2026-10-14_fase_f3_halaman_depan_publik_landing_page.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-14_fase_f3_halaman_depan_publik_landing_page.md).

### Checkpoint: Migrasi Edge Proxy Next.js 16 (2026-10-14 21:30 WIB)
- **Status:** Completed ✅
- **Capaian:**
  1. Migrasi konvensi `src/middleware.ts` ke `src/proxy.ts` dengan ekspor fungsi resmi Next.js 16 `export async function proxy(request: NextRequest)`.
  2. Penegasan pembagian 3 zona akses: publik (`/`, `/login`, `/register`) vs privat (`/dashboard/*`).
  3. Pembaruan seluruh dokumen acuan: `PRD.md`, `PLANBACKEND.md`, `docs/PROJECT-STRUCTURE.md`, `docs/REVIEW-AUDIT.md`, dan `.changelog/`.
  4. Lolos verifikasi build Next.js 16 tanpa peringatan deprecation middleware.
- **File Changelog:** [`2026-10-14_migrate_middleware_to_proxy_next16.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-14_migrate_middleware_to_proxy_next16.md).

### Checkpoint: Implementasi Fase F2 — Setup Komponen Atomik Shadcn UI & Design Tokens (2026-10-14 21:12 WIB)
- **Status:** Approved ✅
- **Capaian:**
  1. Inisialisasi CLI Shadcn UI (`components.json`) dengan konfigurasi `style: radix-nova`, Tailwind v4, Lucide icons, dan path alias terstandarisasi.
  2. Integrasi token warna semantik Oklch dan dark mode adaptif di `src/app/globals.css`.
  3. Pemasangan 18 komponen antarmuka atomik di `src/components/ui/`: `Button`, `Card`, `Dialog`, `AlertDialog`, `Drawer`, `Input`, `Label`, `Badge`, `Progress`, `Tabs`, `Table`, `Separator`, `Popover`, `Calendar`, `Select`, `Accordion`, `DropdownMenu`, dan `Sonner`.
  4. Penyambungan `Toaster` theme-aware dari `@/components/ui/sonner` ke `src/app/layout.tsx`.
  5. Lolos seluruh gerbang kualitas: `bun run typecheck` (PASS, 0 error), `bun test` (PASS, 21 tests lolos), dan `bun run build` (PASS, 0 error).
- **File Changelog:** [`2026-10-14_fase_f2_setup_komponen_atomik_shadcn_ui.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-14_fase_f2_setup_komponen_atomik_shadcn_ui.md).

### Checkpoint: Implementasi Fase B3 — Financial Calculation Engine (Single Source of Truth) (2026-10-13 21:16 WIB)
- **Status:** Approved ✅
- **Capaian:**
  1. Pembuatan berkas terpusat `src/lib/financial-calculations.ts` yang menjadi satu-satunya sumber rumus finansial di Kenzo Treasury.
  2. Implementasi fungsi sanitasi angka & pemformat lokal: `toIntegerRupiah`, `formatRupiah`, dan `parseRupiah`.
  3. Implementasi kalkulasi anggaran pos: `calculateRemainingBudget`, `calculateBudgetUsagePercentage`, dan `getBudgetStatus` (`healthy`, `warning`, `overbudget`) sesuai FR-5.1.
  4. Implementasi `calculateDynamicFreedomBuffer` untuk auto-scaling pos uang bebas saat ada pemasukan freelance/tambahan (Invarian 3).
  5. Implementasi kalkulasi cicilan bertarget lunas: `calculateDebtProgress` dan `calculateRemainingDebtMonths` (Invarian 4).
  6. Implementasi `calculateSafetyMonths` (rasio ketahanan hidup 1 desimal terhadap biaya wajib bulanan) dan target default Rp 18.000.000 (Invarian 5 & FR-12.1).
  7. Implementasi `calculateFreeSavings` dan `calculateWishlistProgress` lengkap dengan 6 milestone gamifikasi barang impian (FR-10.4).
  8. Implementasi `calculateNetCashflow`, `calculateSavingsRate`, dan `calculateMonthSweep` untuk penutupan buku (Invarian 6).
  9. Pembuatan unit test suite mandiri di `src/lib/__tests__/financial-calculations.test.ts` (21 pengujian lolos, 0 gagal, 91 assertions).
  10. Penambahan script `"test": "bun test"` serta `@types/bun` ke `package.json`.
  11. Lolos seluruh gerbang kualitas: `bun test` (PASS), `bun run typecheck` (PASS, 0 error), dan `bun run build` (PASS, 0 error).
- **File Changelog:** [`2026-10-13_fase_b3_financial_calculation_engine.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-13_fase_b3_financial_calculation_engine.md).

### Checkpoint: Implementasi Fase B2 — Supabase SSR Client, Proxy Session & Auth Helpers (2026-10-13 20:50 WIB)
- **Status:** Approved ✅
- **Capaian:**
  1. Penambahan dependensi validasi skema `zod` ke `package.json`.
  2. Pembuatan kontrak discriminated union `ActionResponse<T>` di `src/types/index.ts` dan Zod schema autentikasi di `src/schemas/auth.schema.ts`.
  3. Pembuatan helper SSR Supabase: `src/lib/supabase/client.ts` (Browser) dan `src/lib/supabase/server.ts` (Server dengan async cookies Next.js 16).
  4. Pembuatan edge proxy token refresh dan proteksi rute di `src/proxy.ts` (Next.js 16).
  5. Pembuatan Server Actions di `src/actions/auth.ts` (`register`, `login`, `logout`, `getCurrentUser`) dengan sinkronisasi profil `public.users` dan inisialisasi default `public.savings_account`.
  6. Pembuatan UI autentikasi fungsional di `src/app/(auth)/login/page.tsx` & `src/app/(auth)/register/page.tsx` dengan validasi inline (border merah + teks error spesifik di bawah field tanpa toast mengambang), penyambungan logout di `src/app/(dashboard)/page.tsx`, serta kodifikasi standar ke `.agents/rules/frontend-design.md` & `docs/DESIGN-SYSTEM.md`.
  7. Eksekusi migrasi live `src/db/migrations/0002_enable_rls_all_tables.sql` mengaktifkan Row Level Security (RLS) dan ownership policies pada seluruh 9 tabel publik Supabase sehingga status UNRESTRICTED hilang.
  8. Lolos verifikasi non-UI: `bun run typecheck` (PASS, 0 error) dan `bun run build` (PASS, 0 error).
- **File Changelog:** [`2026-10-13_fase_b2_supabase_ssr_and_auth_actions.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-13_fase_b2_supabase_ssr_and_auth_actions.md).

### Checkpoint: Instalasi Skill Khusus Proyek (2026-10-13 19:48 WIB)
- **Status:** Installed & Active ✅
- **Capaian:**
  1. Penambahan 4 skill domain spesifik langsung di tingkat proyek (`.agents/skills/`): `tanstack-query-best-practices`, `recharts`, `zod`, dan `pwa-development`.
  2. Seluruh skill diverifikasi berkualitas tinggi (>1K-12K installs) dan belum ada di global maupun konfigurasi proyek sebelumnya.
  3. Konfigurasi lockfile skill tersimpan di `skills-lock.json`.
- **File Changelog:** [`2026-10-13_add_project_specific_skills.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-13_add_project_specific_skills.md).

### Checkpoint: Penyelarasan Otoritas Supabase Auth & Penghapusan Password (2026-10-12 22:41 WIB)
- **Status:** Completed & Aligned ✅
- **Capaian:**
  1. Penghapusan kolom `password` dari tabel `users` di `src/db/schema.ts`; tabel `public.users` kini difungsikan murni sebagai profil pengguna dengan ID terhubung 1:1 ke `auth.users.id` Supabase Auth.
  2. Eksekusi perubahan ke live PostgreSQL Supabase dan pembuatan file migrasi snapshot `src/db/migrations/0001_busy_hiroim.sql`.
  3. Pembaruan dan penyelarasan dokumen spesifikasi `PRD.md`, `PLANBACKEND.md` (Fase B2), `docs/DECISIONS-NEEDED.md`, dan `docs/REVIEW-AUDIT.md`.
  4. Quality gate lulus: `bun run typecheck` (0 error).
- **File Changelog:** [`2026-10-12_remove_users_password_and_align_supabase_auth.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-12_remove_users_password_and_align_supabase_auth.md).

### Checkpoint: Restrukturisasi Aturan & Koreksi Invarian Finansial (2026-10-12 22:17 WIB)
- **Status:** Completed & Aligned ✅
- **Capaian:**
  1. Restrukturisasi aturan proyek Kenzo Treasury menjadi sistem modular di `.agents/rules/` (`database-access.md`, `financial-domain.md`, `frontend-design.md`, `project-architecture.md`).
  2. Integrasi skill spesifik proyek di `.agents/skills/` (`phase-delivery`, `financial-integrity`).
  3. Dokumentasi blueprint, design system, dan audit teknis di `docs/` (`PROJECT-STRUCTURE.md`, `DESIGN-SYSTEM.md`, `REVIEW-AUDIT.md`, `DECISIONS-NEEDED.md`).
  4. Perbaikan dan penulisan komprehensif berkas [`.agents/rules/financial-domain.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.agents/rules/financial-domain.md) mencakup seluruh invarian finansial: integer Rupiah, dynamic freedom buffer, finite lifetime cicilan, transfer sinking fund wishlist tanpa defisit, idempotensi sweep tutup buku, dan single source of truth.
- **File Changelog:** [`2026-10-12_reorganize_rules_and_financial_domain.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-12_reorganize_rules_and_financial_domain.md).

### Checkpoint: Fase B1 — Konfigurasi Drizzle ORM, Skema 9 Tabel & Koneksi Supabase (2026-10-10 20:52 WIB)
- **Status:** Approved by Kenzo ✅
- **Capaian:**
  1. Instalasi dependensi database modern & stabil (`drizzle-orm@0.45.4`, `postgres@3.4.9`, `@supabase/supabase-js@2.117.3`, `@supabase/ssr@0.12.7`, `drizzle-kit@0.31.11`).
  2. Implementasi koneksi database singleton di `src/db/index.ts` dengan driver `postgres.js` dan konfigurasi `prepare: false` untuk Supavisor transaction pooler.
  3. Konfigurasi `drizzle.config.ts` dan `.env.example` dengan dual-mode connection string: memprioritaskan `DATABASE_URL_UNPOOLED` (port 5432) untuk Drizzle Kit CLI migrations, dan `DATABASE_URL` (port 6543) untuk runtime Server Actions.
  4. Penyusunan skema 9 tabel di `src/db/schema.ts` (`users`, `savings_account`, `months`, `incomes`, `liabilities`, `budget_categories`, `transactions`, `wishlists`, `wishlist_allocations`) lengkap dengan audit timestamp dan relasi ORM.
  5. Ekspor inferensi tipe TypeScript Drizzle (`$inferSelect`, `$inferInsert`) untuk seluruh 9 tabel.
  6. Eksekusi `drizzle-kit generate` dan push langsung ke Supabase PostgreSQL (`drizzle-kit push --force`). Verifikasi query tabel mengonfirmasi seluruh 9 tabel aktif.
  7. Penambahan butir 10 standar database pooling & TLS ke `AGENTS.md`.
  8. Quality gate lulus: `bun run typecheck` (0 error) & `bun run build` sukses 100%.
- **File Changelog:** [`2026-10-10_phase_b1_completion.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-10_phase_b1_completion.md).

### Checkpoint: Fase F1 — Inisialisasi Next.js 16, Tailwind CSS v4, Layout & Providers (2026-10-09 23:21 WIB)
- **Status:** Approved by Kenzo ✅
- **Capaian:**
  1. Setup proyek Next.js 16.4.0 (App Router, Turbopack, React 19.3.0, TypeScript 7.0.2).
  2. Setup Tailwind CSS v4 (`@tailwindcss/postcss`) dengan semantic token Shadcn UI.
  3. Konfigurasi `src/app/layout.tsx` (mobile `min-h-[100dvh]`, anti-horizontal overflow `overflow-x-hidden`, Google Inter, Sonner Toaster).
  4. Implementasi clean client boundary di `src/app/providers.tsx` dan modul singleton terpusat di `src/lib/query-client.ts`.
  5. Migrasi total ekosistem runtime & package manager ke **Bun (v1.4.2)**.
  6. Quality gate lulus: `bun run typecheck` (0 error) & `bun run build` (2.4 detik).
- **File Changelog:** [`2026-10-09_phase_f1_completion.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-09_phase_f1_completion.md).

### Checkpoint: Fase 0 — Persiapan Konsep, Aturan & Arsitektur (2026-10-09 23:31 WIB)
- **Capaian:**
  1. Spesifikasi komprehensif selesai di [`PRD.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/PRD.md).
  2. ERD 9 tabel selesai digambar dan diverifikasi di [Excalidraw Live Canvas](https://excalidraw.com/#json=wQBlD5nMIr_tM9P1V-mf6,Mizngs7kMbgI26oOCHCTgQ).
  3. Kolom `password` di tabel `users` dan standarisasi `updated_at` di seluruh 9 tabel selesai diimplementasikan.
  4. Penyusunan pedoman operasional AI di [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md) lengkap dengan adopsi 7 standar emas best practices (no browser alert, anti-halusinasi Tailwind, mobile `100dvh`, single source of truth rumus finansial, YAML frontmatter changelog).
  5. Audit & penguncian dependensi ke versi mutakhir di [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md#L45-L85).
  6. Blueprint peta direktori proyek lengkap (Project Directory Map) di [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md#L86-L185).
  7. Penambahan konfigurasi keamanan repositori [`.gitignore`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.gitignore).
  8. Penambahan aturan alur pasca-approval, checklist, rekomendasi Git Commit manual format `<action>: <description>` (English), dan larangan langsung loncat fase di [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md#L310-L320).
  9. Migrasi seluruh runtime & package manager dari `npm` ke **`Bun`** (v1.4.2) resmi di [`PRD.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/PRD.md) dan [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md).
  10. Pemisahan konfigurasi singleton TanStack Query ke [`src/lib/query-client.ts`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/lib/query-client.ts).
  11. Penguncian aturan Providers Wrapper Bersih (zero state / client instances) di [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md#L224-L228).
  12. Standarisasi Clean Architecture & Anti-Campur Tanggung Jawab (Strict Single Responsibility) di [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md#L229-L236).
  13. Pengadopsian standar emas dokumentasi kode naratif & mendalam (Rationale-First Documentation) di [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md#L278-L287).
- **File Changelog:**
  - [`2026-10-09_initial_prd_and_rules.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-09_initial_prd_and_rules.md)
  - [`2026-10-09_phase_roadmap_and_gate_rules.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-09_phase_roadmap_and_gate_rules.md)
  - [`2026-10-09_verified_latest_libraries.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-09_verified_latest_libraries.md)
  - [`2026-10-09_directory_structure_map.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-09_directory_structure_map.md)
  - [`2026-10-09_added_gitignore.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-09_added_gitignore.md)
  - [`2026-10-09_post_approval_commit_rules.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-09_post_approval_commit_rules.md)
  - [`2026-10-09_adopted_bun_runtime.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-09_adopted_bun_runtime.md)
  - [`2026-10-09_modular_query_client.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-09_modular_query_client.md)
  - [`2026-10-09_clean_providers_rule.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-09_clean_providers_rule.md)
  - [`2026-10-09_strict_clean_architecture_rule.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-09_strict_clean_architecture_rule.md)
  - [`2026-10-09_adopted_deep_documentation_standard.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/.changelog/2026-10-09_adopted_deep_documentation_standard.md)
- **Tindakan Berikutnya:** Menunggu Kenzo commit git manual, lalu bersiap untuk fase selanjutnya.
