# Consolidated EGM Goldfish Review Report

**Target Document:** [`docs/plans/PLANREVISI.md`](../plans/PLANREVISI.md) (`Lines 1..462`)
**Execution Mode:** Uninterrupted Full Flow (Stages 5, 6, 7, 8, 9)
**Overall Verdict:** **FAIL / CHANGES REQUESTED — NOT READY FOR EXECUTION**

> **Ringkasan Eksekutif:** Seluruh 5 tahap audit independen menemukan cacat arsitektural, kontradiksi batas eksekusi antar-fase, celah integritas data transaksi/utang, kebocoran data dummy pribadi di rute saudara, serta *bloat* kompensasi (terutama di **Fase R4, R8, R9, & R10**). Dokumen perlu disederhanakan dan disinkronkan sebelum eksekusi kode dijalankan.

## 1. Stage & Reviewer Status

| Stage | Report Artifact | Reviewers | Status | Verdict |
| --- | --- | --- | --- | --- |
| Stage 5: Initial Zoom Out | [`zoom_out_report.md`](./zoom_out_report.md) | `egm-zoom-out` | `completed` | Changes Requested |
| Stage 6: Comprehension Test | [`comprehension_report.md`](./comprehension_report.md) | `egm-comprehension` | `completed` | Findings Logged |
| Stage 7: Critic Review | [`critic_report.md`](./critic_report.md) | `egm-design`, `egm-structural`, `egm-style` | `completed` | Changes Requested |
| Stage 8: Intermediate Zoom Out | [`intermediate_zoom_out_report.md`](./intermediate_zoom_out_report.md) | `egm-zoom-out` | `completed` | Simplify Before Execution |
| Stage 9: Implementation Readiness | [`implementation_readiness_report.md`](./implementation_readiness_report.md) | `egm-implementation-readiness`, `egm-codebase-details`, `egm-style` | `completed` | **FAIL (Not Ready)** |

---

## 2. Consolidated Action Items (Prioritized: 🔴 Blocker → 🟡 Major → 🟢 Nit)

### 🔴 Blockers (`ACT-01` – `ACT-09`)

#### `ACT-01` — Hilangkan Split-Brain Sumber Anggaran (`user_budget_templates` vs `Kasus A`) & Ketatkan `deleteCategory`
- **Affected Scope:** `PLANREVISI.md` Lines `35, 379, 393, 412, 415–419, 451`; `src/lib/month-generator.ts`, `src/lib/queries/months.ts`, `src/actions/months.ts`, `src/actions/categories.ts`, `src/actions/transactions.ts`, `src/actions/incomes.ts`, `src/db/schema.ts`.
- **Issue:** `month-generator.ts` (`Kasus A`) mewarisi bulan baru dari `previousCategories` di `budget_categories`, sedangkan `R10` menambah tabel `user_budget_templates` sekaligus editor & `deleteCategory` pos bulan aktif di `/dashboard/settings` serta tombol heuristic *"Terapkan ke Bulan Aktif Saat Ini"* tanpa FK `templateId`. Hal ini memicu konflik Single Source of Truth, duplikasi kategori saat template diganti nama, celah `deleteIncome` pada `isBaseSalary: true`, dan celah integritas `deleteCategory` (`liabilityId` Undo/Restore rusak karena `transactions` tak punya `liabilityId`; hapus pos `uang_bebas_tabungan` terakhir merusak `closeMonth` sweep & R8; banyak pos `uang_bebas_tabungan` membuat `Dynamic Freedom Buffer` menghitung pemasukan tambahan $N\times$; `isDeleted = true` memblokir hapus pos kosong saat Undo TTL aktif; `targetBudget` zero-based tidak terkonservasi).
- **Required Action:** Pilih satu arsitektur bersih: **(Opsi Sederhana Stage 8 — Disarankan)** tetapkan `budget_categories` di `/dashboard` sebagai satu-satunya editor pos bulan berjalan (`Kasus A` bulan $N \rightarrow N+1$), batasi template onboarding hanya untuk inisialisasi bulan pertama user baru + update `defaultBaseSalary` (hapus duplikasi CRUD/sync bulan aktif di Settings dan `templateId` FK), dan batasi maksimal **1** pos `uang_bebas_tabungan`. Jika `deleteCategory` tetap disediakan di bulan aktif, ganti `transactions.categoryId` ke `onDelete: "restrict"`, tolak hapus pada `isClosed`, pos terakhir, `uang_bebas_tabungan` terakhir, dan pos dengan `liabilityId !== null` (termasuk melarang reassign ke pos cicilan), tangani row `isDeleted = true` terpisah dari `activeTxCount`, dan konservasikan `targetBudget`.

#### `ACT-02` — Sederhanakan State Machine Onboarding R10, Sinkronkan Backfill SQL & RLS, & Amankan `/onboarding` di `src/proxy.ts`
- **Affected Scope:** `PLANREVISI.md` Lines `371–429, 450`; `src/proxy.ts`, `src/actions/auth.ts`, `src/actions/onboarding.ts`, `src/db/schema.ts`, `src/db/migrations/`.
- **Issue:** (1) 3 enum status + `onboardingStep` (tak pernah disimpan per-step) + `initialSetupCompletedAt` + kunci `?resume=1` + auto-promosi Settings bersifat spekulatif (`YAGNI`) dan langsung menabrak backfill user lama: `Line 394` menandai akun eksisting `'completed'` dengan `defaultBaseSalary = null` & `0` template, namun `Line 411` memunculkan card peringatan bila `(gaji pokok / template pos masih kosong)`; (2) `src/proxy.ts` hanya melindungi `/dashboard*` sehingga `/onboarding` bocor untuk tamu anonim; (3) `UserSessionData` / `login()` / `getCurrentUser()` belum mengembalikan `onboardingStatus`; (4) skema DDL kolom baru, urutan `UPDATE` backfill di SQL migrasi yang sama, kebijakan RLS Postgres pada `user_budget_templates`, unique `(user_id, year, month_index)` pada `months`, interaksi Step 4 `liabilities` ke Bulan 1, array konkret template netral `"50/30/20"`, struktur fallback `"Uang Bebas / Tabungan"` (`targetBudget: baseSalary`), `CreateMonthDialogProps`, dan daftar file `Settings` (`src/actions/`, `src/lib/queries/`, `src/schemas/`, `Delete Account`) belum dirinci.
- **Required Action:** Sederhanakan status onboarding menjadi 1 kolom nullable timestamp (`onboardingCompletedAt` — atau lengkapi persisten step & `?resume=1`), derivasikan card peringatan langsung dari data domain nyata (`monthsList.length === 0 && (!defaultBaseSalary || templatesCount === 0)`) agar akun eksisting bebas gangguan, tambahkan `/onboarding` ke `isProtectedRoute` di `src/proxy.ts`, sertakan status onboarding pada `UserSessionData` + `getCachedAuthenticatedSession()`, lengkapi definisi DDL + SQL backfill atomik + RLS + index unik `months`, dan tetapkan kontrak eksplisit Step 4 `liabilities`, `50/30/20`, `CreateMonthDialog`, serta modul Settings.

#### `ACT-03` — Sapu Bersih Seluruh Fallback Data Pribadi Kenzo & Angka Dummy `18.000.000` Lintas Semua Rute
- **Affected Scope:** `PLANREVISI.md` Lines `396, 409–412, 427`; `dashboard/page.tsx`, `dashboard/analytics/page.tsx`, `dashboard/wishlists/page.tsx`, `dashboard/vault/page.tsx`, `src/lib/queries/savings.ts`, `src/actions/auth.ts`, `src/actions/months.ts`, `src/actions/savings.ts`, `src/actions/wishlists.ts`, `src/schemas/savings.schema.ts`, `src/db/schema.ts`, `src/actions/export.ts`.
- **Issue:** R10 hanya menghapus dummy di bagian atas `dashboard/page.tsx`, `month-generator.ts`, dan `CreateMonthDialog.tsx`. Data pribadi Kenzo (`"Cicilan iPhone"`, `"Talangan Mama"`, `"Gereja / Persepuluhan"`, `"Kamera Sony A6700"`, `"Standing Desk"`, `"Target Tabungan Kamera & Lensa"`, `2.500.000`, `18.000.000`, `3.000.000`, `"💵 Gaji Pokok"`, emoji) masih bocor di `analytics/page.tsx`, `wishlists/page.tsx`, `vault/page.tsx`, `dashboard/page.tsx` (`fallbackVault` & `!topWishlist`), `queries/savings.ts`, `schema.ts`, `auth.ts`, `months.ts`, dan `savings.ts`. Selain itu `updateEmergencyTargetSchema` masih `.positive()` (bentrok dengan inisialisasi `0`), dan `exportFinancialData` JSON belum mengekspor `user_budget_templates`.
- **Required Action:** Satukan penghapusan semua `fallback*` demo pribadi lintas ke-4 rute dashboard & `queries/savings.ts` menjadi zero/empty state *fail-closed* (`financial-domain.md`), set default inisialisasi baru `emergencyFundTarget: 0` di semua modul terkait (atau selaraskan validator `>= 0` / setup eksplisit), dan tambahkan `user_budget_templates` ke JSON backup di `export.ts`.

#### `ACT-04` — Resolusi Deadlock `<Suspense>` Header vs Data Bulan pada R4 & Hapus Klaim `floatingMobile` Palsu
- **Affected Scope:** `PLANREVISI.md` Lines `29, 152–189, 254, 444`; `src/app/(dashboard)/dashboard/page.tsx`, `src/components/layout/DashboardSkeleton.tsx`, `src/components/features/months/MonthSelector.tsx`, `CreateMonthDialog.tsx`, `AiMonthlyReviewModal.tsx`, `QuickTransactionDrawer.tsx`.
- **Issue:** R4 memindahkan `getMonthDetailById` ke child `<Suspense key={selectedMonthId}>`, padahal `dashboard/page.tsx` membutuhkan `currentMonthDetail` di header untuk nama/badge siklus, `activeCategories.length` (R7), `AiMonthlyReviewModal`, dan `QuickTransactionDrawer`. Klaim mematikan tombol `"floating mobile"` (`Line 29`, `Line 156`) juga tidak faktual karena `floatingMobile` tidak ada di `dashboard/page.tsx`. Selain itu `useTransition` lokal di `MonthSelector.tsx` tidak bisa terdeteksi oleh auto-reset `MonthNavigationContext` Provider, dan `getAllMonths`/`getActiveMonth` invalid `?month=` belum dipetakan di R4.
- **Required Action:** Pindahkan strip header yang bergantung pada data bulan (judul bulan, badge `Aktif`/`Arsip`, jumlah pos, `AiMonthlyReviewModal`, `QuickTransactionDrawer`) **ke dalam** batas `<Suspense>`/`DashboardMonthShell` sehingga hanya `MonthSelector` + `CreateMonthDialog` (`getAllMonths`) yang tinggal di luar `<Suspense>` — ini sekaligus menghilangkan injeksi `MonthNavigationContext` lintas domain ke `ai/` & `transactions/` serta mencegah judul bulan lama tertinggal saat skeleton aktif. Pindahkan `useTransition` ke dalam Provider (jika masih dipakai), definisikan props `DashboardSkeleton` `hideHeader`, dan hapus referensi palsu `floatingMobile` (atau deklarasikan penambahan barunya secara eksplisit).

#### `ACT-05` — Unifikasi Mutasi Transaksi ↔ Cicilan (`R8`), Tambah `.for("update")` Lock & Guard Kuota `Uang Bebas`
- **Affected Scope:** `PLANREVISI.md` Lines `33, 281–336, 448`; `src/actions/transactions.ts`, `src/actions/liabilities.ts`, `src/lib/month-generator.ts`, `src/lib/queries/months.ts`, `src/lib/financial-calculations.ts`, `src/components/features/liabilities/LiabilityTrackerCard.tsx`, `src/components/features/transactions/QuickTransactionDrawer.tsx`, `src/components/features/incomes/IncomeSection.tsx`, `src/db/schema.ts`.
- **Issue:** (1) `R8` menduplikasi logika `createTransaction` (`actions/transactions.ts`) dan modal pembayaran (`QuickTransactionDrawer`) ke `recordInstallmentPayment` & `LiabilityTrackerCard`, sambil menyisakan jalur `monthId == null` yang melewati tabel `transactions`; (2) `recordInstallmentPayment` & `createTransaction` belum memakai `.for("update")` row lock maupun guard server `isSettled === true` dan `amount > remainingAmount`; (3) mengecek sisa `effectiveTarget` (base + freelance in-memory) lalu mengurangi DB `target_budget` berisiko menghasilkan `targetBudget < 0`; (4) `liabilities` tidak punya kolom `icon` sehingga `IconPicker` R8 hilang bila toggle bulan berjalan dimatikan; (5) belum ada aturan jika `Uang Bebas` = `0` / habis saat `Bayar Rp ...`, jika `activeMonthId` null (belum ada bulan di R10), atau jika `updateLiability` mengubah `monthlyPayment`; (6) `Kasus A` `month-generator.ts` menyuntikkan cicilan baru tanpa memotong `Uang Bebas` dan mengabaikan `baseSalary`; (7) `getDefaultCycleDate` memakai `toISOString()` (bug UTC `00:00–06:59 WIB`) & `IncomeSection.tsx` menduplikasinya.
- **Required Action:** Ekstrak satu helper transaksi internal bersama untuk `createTransaction` + `recordInstallmentPayment` dengan `.for("update")` dan guard `isSettled`/overpayment; pertimbangkan memakai ulang `QuickTransactionDrawer` bila pos tertaut sudah ada; syaratkan **kedua** `freeCat.targetBudget >= monthlyPayment` AND `(effectiveTarget - spent) >= monthlyPayment`; putuskan antara menambah `liabilities.icon` atau menyembunyikan `IconPicker` saat toggle nonaktif; tangani `!activeMonthId` & `Uang Bebas` kosong secara eksplisit; perbaiki `month-generator.ts` `Kasus A` & `updateLiability`; jelaskan target tabel `isTemporary: true`; dan gunakan WIB di `resolveDefaultCycleDate` bersama `IncomeSection.tsx`.

#### `ACT-06` — Pisahkan Scope R1 vs R2 & Tetapkan Satu Pemilik Jelas untuk Migrasi/Cleanup Emoji DB
- **Affected Scope:** `PLANREVISI.md` Lines `38, 46–47, 68–124, 390–394, 423, 441`; `src/lib/financial-calculations.ts`, `src/schemas/category.schema.ts`, `src/schemas/wishlist.schema.ts`, `src/actions/wishlists.ts`, `src/components/features/wishlists/WishlistCard.tsx`, `src/db/schema.ts`.
- **Issue:** `R1` menginstruksikan pemasangan Icon Picker dan slug `>10` karakter di `BudgetCategoryList`/`WishlistCard` sebelum `R2` membuat `IconPicker.tsx` dan memperlebar Zod `.max(10) -> .max(50)`; `R2` lupa `updateCategorySchema.icon` dan `updateWishlistSchema.icon` (keduanya `.max(10)`) serta `"|| '🎯'"` di `actions/wishlists.ts:70`; `R1` memecah `WishlistProgress` (`calculateWishlistProgress` tanpa kontrak tipe baru, sedangkan `WishlistCard.tsx` meng-hardcode emoji milestone sendiri); daftar 24 pasang `{ key, label, icon }` & peta emoji DB lama (`"👩‍👦"`, `"👵"`, `"✝️"`, `"📷"`, `"🖥️"`, `"🍿"`) + regex ZWJ/`\uFE0F` belum lengkap; cleanup SQL DB ditulis di R1 tanpa file migrasi lalu diulang di checklist R10 `Line 423` tanpa SQL.
- **Required Action:** Gabungkan `R1 + R2` atau kunci batas tegas: `R1` = registry 24 ikon lengkap + `AppCategoryIcon` prop/class + `WishlistProgress` non-breaking `milestoneIconKey` + konsolidasi milestone di `WishlistCard` + Regex `\p{Extended_Pictographic}`/ZWJ/`\uFE0F` + `.max(50)` pada seluruh 4 skema create/update + Zero-Emoji Guard lintas `.tsx`, `src/actions/`, & `src/lib/` + satu migrasi `--custom` SQL cleanup yang jelas; `R2` = implementasi `IconPicker` (`type="button"`, `role="radiogroup"`, unknown fallback).

#### `ACT-07` — Ukur Dedup `React.cache` Dahulu / Tunda `staleTimes.dynamic = 20` & Tutup Scan Penuh `export.ts` (`R9`)
- **Affected Scope:** `PLANREVISI.md` Lines `34, 337–368, 449`; `next.config.ts`, `src/lib/queries/months.ts`, `src/actions/auth.ts`, `src/actions/export.ts`, `src/lib/queries/analytics.ts`.
- **Issue:** (1) Nama helper bentrok (`revalidateAllDashboardPaths` di `Line 348` vs `revalidateDashboardRoutes` di tempat lain), `settings/page.tsx` terlewat dari dedup/revalidasi, dan `resolveAuthenticatedUserId(explicitUserId)` harus bypass `explicitUserId` sebelum `React.cache` (`cookies()` error di `bun test`); (2) `export.ts:128` menarik seluruh baris `budgetCategories` **semua user** di Postgres tanpa filter `where`; (3) `experimental.staleTimes.dynamic = 20` bertentangan dengan "Zero Stale Data" R4 dan berisiko membocorkan cache 20 detik setelah `logout()`/`login()`/`onboarding` karena `auth.ts` & `onboarding.ts` tidak ikut diinvalidasi.
- **Required Action:** Wajib terapkan `React.cache` auth dedup (1 helper di `src/lib/queries/auth.ts` + bypass `explicitUserId` + tes harness SSR), perbaikan `export.ts` (`inArray(budgetCategories.monthId, ...)`), dan `revalidateDashboardRoutes()` (termasuk `auth.ts` & `onboarding.ts`). **Tunda** `experimental.staleTimes.dynamic = 20` sampai ada bukti profiling setelah dedup—atau bila tetap dipertahankan, wajibkan `revalidateDashboardRoutes()` + `router.refresh()` di `login`/`logout`/`onboarding` dan tetapkan aturan `?month=` bersama R4.

#### `ACT-08` — Tambahkan *Problem Statement*, *Non-Goals*, & *Alternatives Considered* (`feature-spec-standard.md`)
- **Affected Scope:** `PLANREVISI.md` Lines `1–65`, `Section 3`.
- **Issue:** Dokumen gagal memenuhi syarat *feature-spec-standard.md* karena hanya berisi meta-goal proses, nol daftar *Non-Goals*, dan tidak mendokumentasikan alternatif desain yang ditolak beserta alasannya (termasuk apa itu `Opsi B/C` pada R8, R3, R4, R9, R10).
- **Required Action:** Tambahkan subseksi **Problem Statement**, **Goals & Non-Goals** batch `R1–R10`, dan **Alternatives Considered** ringkas untuk keputusan arsitektural kunci (`R1/R2`, `R3`, `R4`, `R8`, `R9`, `R10`).

#### `ACT-09` — Selaraskan Mode Eksekusi (`Mode EXECUTING` vs `AGENTS.md` §2) & Status Pra-Eksekusi vs Approval
- **Affected Scope:** `PLANREVISI.md` Lines `3, 25–36, 197, 205, 281, 337, 373, 375, 431, 439–440, 457`.
- **Issue:** Dokumen mencampur `READY FOR BATCH EXECUTION` dengan loop `COLLECTING` (`R11..Rn`), memakai label `Disetujui Kenzo ✅` untuk kunci desain `/grill-me` (identik dengan gerbang persetujuan pasca-implementasi di `AGENTS.md` §2), memiliki selisih timestamp R10 (`15:39` vs `15:43 WIB`), dan menyebut istilah tak terdefinisi `"Mode EXECUTING"` di `Line 205`.
- **Required Action:** Ganti badge pra-implementasi menjadi `Desain Terkunci (Pra-Eksekusi)`, selaraskan status header + timestamp R10 + aturan eksekusi batch vs verifikasi per-fase (`AGENTS.md` §2), dan hapus `"Mode EXECUTING"`.

---

### 🟡 Majors (`ACT-10` – `ACT-15`)

#### `ACT-10` — Perbaiki Bug Reset Error Optimistic Submit & Layout `DrawerFooter` pada R6 (`QuickTransactionDrawer.tsx`)
- **Affected Scope:** `PLANREVISI.md` Lines `215–248, 446`; `QuickTransactionDrawer.tsx`, `dashboard/page.tsx`.
- **Action:** Tambahkan guard `shouldSkipNextOpenResetRef` (atau closed→open transition check) agar `setOpen(false)` -> `setOpen(true)` saat error server tidak menghapus input manual, `lastAutoDescriptionRef`, maupun `form.setError`; forward `group: CategoryGroup` pada `QuickCategoryOption`; ganti `sticky bottom-0 bg-background/95 backdrop-blur-sm py-3 pb-[...]` dengan `bg-background shrink-0 pt-3 pb-[...]`; dan tetapkan opsi `form.setValue` + `defaultOpen` untuk pengujian SSR.

#### `ACT-11` — Angkat Spesifikasi R3 ke Kontrak Komponen, Perbaiki ARIA & Portal Timing, dan Pakai `availableYears` Dinamis
- **Affected Scope:** `PLANREVISI.md` Lines `28, 127–151, 443`; `src/components/ui/tabs.tsx`, `AppHeader.tsx`, `MobileBottomNav.tsx`, `AnalyticsDashboard.tsx`.
- **Action:** Evaluasi penggunaan ulang `src/components/ui/tabs.tsx` vs primitive switcher terukur; wajibkan `role="radiogroup"`/`"radio"` + `type="button"` untuk kontrol form (`QuickTransactionDrawer`, `BudgetCategoryList`); tangani `!hasMeasured` SSR CSS fallback & `ResizeObserver` portal/breakpoint re-measure bila memakai indikator JS; gunakan `usePathname()` di `AppHeader`/`MobileBottomNav` (hindari `optimisticHref` yang rawan desync) dengan dimensi pill/garis atas eksplisit; samakan hitungan lokasi (`R3` vs `R8`); dan ikat switcher tahun `AnalyticsDashboard` ke `data.availableYears`.

#### `ACT-12` — Perbaiki R7 (`latestMonth` Hilang di `<CreateMonthDialog />`, Ceklis Subtitle, Breakpoint, & 5 `"7 Pos"` Tersisa)
- **Affected Scope:** `PLANREVISI.md` Lines `250–280`; `dashboard/page.tsx`, `MonthSelector.tsx`, `AppHeader.tsx`, `BudgetCategoryList.tsx`, `IncomeSection.tsx`, `AiMonthlyReviewModal.tsx`, `CreateMonthDialog.tsx`, `gemini.ts`.
- **Action:** Teruskan `latestMonth={monthsList[0] ?? null}` ke `<CreateMonthDialog />` setelah dipisah dari `MonthSelector`; tambahkan butir checklist subtitle dinamis (+ state 0 bulan) ke R7; selaraskan breakpoint `md:` vs `lg:` untuk tinggi `h-9` & root JSX `MonthSelector`; dan bersihkan 5 string hardcoded `"7 pos"` tersisa lintas komponen/AI prompt.

#### `ACT-13` — Lengkapi `File Terdampak` (`[Create|Modify|Delete]`) di Seluruh R1–R10 & Peta Regresi Unit Test
- **Affected Scope:** `PLANREVISI.md` Lines `42–62, 75–91, 136–144, 371–430, 439`.
- **Action:** Tambahkan daftar file eksplisit berlabel `[Create | Modify | Delete]` pada **R3** dan **R10** (memisah `actions/`, `lib/queries/`, `schemas/`, `components/features/settings/*`, `proxy.ts`), hapus glob/singkatan (`dll.`, `actions/*`, `src/app/**/page.tsx`), perbaiki diagram Mermaid agar merepresentasikan DAG dependensi nyata + konsolidasi hot files (`QuickTransactionDrawer.tsx`, `dashboard/page.tsx`), dan petakan pembaruan 5 berkas uji terdampak (`financial-calculations.test.ts`, `schemas.test.ts`, `months.test.ts`, `backend-phases-b7-b13.test.ts`, `frontend-phases-f7-f18.test.tsx`).

#### `ACT-14` — Konkretkan Perintah Audit Verification, Risiko Keamanan/Skalabilitas, & Exit Criteria DoD
- **Affected Scope:** `PLANREVISI.md` Lines `8, 17, 37, 60, 98, 150, 435–462`.
- **Action:** Cantumkan command/skrip nyata untuk `Tailwind v4 Canonical Audit` & `Zero-` + `Zero-font-mono` + `Zero-Dummy` grep checks; seragamkan `bun run typecheck`; tambahkan timestamp/commit baseline `81/81 PASS`; tambahkan risiko keamanan kepemilikan reassignment & skalabilitas grid kategori (`R6`) ke Section 4; dan sinkronkan Section 5 DoD dengan Row 13–14, `DESIGN-SYSTEM.md`, `PROJECT-STRUCTURE.md`, dan checklist UI manual Kenzo.

#### `ACT-15` — Selaraskan Deviasi `docs/DESIGN-SYSTEM.md`, Glosarium Domain, & Inkonsistensi Token R1 (`biru` vs `indigo`)
- **Affected Scope:** `PLANREVISI.md` Lines `26, 72, 78, 89, 113, 134, 226, 286, 293, 304`.
- **Action:** Pilih satu token warna `pos_wajib` (`indigo` vs `blue`) + ukuran `AppCategoryIcon` `inline`; selaraskan atau catat pengecualian resmi di `docs/DESIGN-SYSTEM.md` (`rounded-xl` kotak ikon, `size-10` vs `48×48px`, `duration-300` vs `120–200ms`); dan definisikan singkat istilah proyek (`pos_wajib`, `kebutuhan`, `uang_bebas_tabungan`, `Strict Month-Date Boundary`, `monthIndex`, `isTemporary`, `Executive Cashflow KPI`).

---

### 🟢 Nits (`ACT-16` – `ACT-18`)

#### `ACT-16` — Perbaikan Sintaks CommonMark Code Span, LaTeX di Heading, & Kebersihan Prosa
- **Affected Scope:** `PLANREVISI.md` Lines `4, 31, 35, 73, 137, 139, 147, 150, 158, 167, 201, 205, 222, 226, 238, 252, 266, 281, 312, 349, 352, 367, 371, 443, 446, 450`.
- **Action:** Pakai double backtick pada template literal (`Lines 158, 167, 312`), hapus LaTeX `$...$` dari heading `###` (`Lines 281, 371`), hapus referensi screenshot yatim (`Lines 137, 139, 252`), seragamkan format tautan file di R1 & R10, seragamkan template sub-judul & pemisah `---` R1–R10, perbaiki typo (`ikut ikut`, `memecah proxy.ts`, `Line 450` urutan SQL DDL->DML), hapus misplaced caveats (`Line 150` R3 Tailwind, `Line 205` R5 `amount`), jelaskan `<DrawerHeader>` & clear-input R6, dan bersihkan kata sifat/intensifier tak terukur (`100%`, `mulus`, `nyaman`, `seketika`/`sempurna`).

#### `ACT-17` — Ergonomi Grid Mobile `IconPicker`, Reset `BudgetCategoryList`, & Konsistensi Label Nav
- **Affected Scope:** `PLANREVISI.md` Lines `113–115, 134, 137–138`.
- **Action:** Gunakan `grid-cols-4 min-[380px]:grid-cols-6` pada `IconPicker`, catat reset `icon`/`group` di `BudgetCategoryList` dan ekspor `WishlistGrid` di `WishlistCard.tsx`, serta samakan penamaan tab `Backup` / `Data & Backup` / `Pengaturan`.

#### `ACT-18` — Kejelasan Minor Tie-Break `Semua Sisa`, Re-klik `CreateMonthDialog`, & Kalimat `DashboardSkeleton`
- **Affected Scope:** `PLANREVISI.md` Lines `168, 197, 203`.
- **Action:** Konfirmasikan `formatRupiah(maxRemaining, { prefix: false })`, tie-break highlight aktif saat `remaining === QUICK_AMOUNTS`, status `CreateMonthDialog` saat `isSwitching`, serta perbaiki kalimat `Line 168` agar `DashboardSkeleton` tidak terdengar menampilkan teks status bulan.

---

## 3. Traceability Matrix (Raw Stage Findings → Consolidated Action Items)

| Stage / Reviewer | Raw Finding ID | Topic Summary | Mapped Action Item |
| --- | --- | --- | --- |
| Stage 5 (`egm-zoom-out`) | `S5-1` | Split-brain `user_budget_templates` vs `budget_categories` Case A | `ACT-01` |
| Stage 5 (`egm-zoom-out`) | `S5-2` | Hardcoded Kenzo dummy data & emojis on `/analytics`, `/wishlists`, `/vault`, savings | `ACT-03` |
| Stage 5 (`egm-zoom-out`) | `S5-3` | R1 & R2 duplicated picker/cleanup & missing `update*` `.max(10)` schemas | `ACT-06`, `ACT-15` |
| Stage 5 (`egm-zoom-out`) | `S5-4` | R8 duplicate transaction/dialog paths & `IncomeSection` `resolveDefaultCycleDate` | `ACT-05` |
| Stage 5 (`egm-zoom-out`) | `S5-5` | Redundant 4-column onboarding state machine & omitted `/onboarding` proxy | `ACT-02` |
| Stage 5 (`egm-zoom-out`) | `S5-6` | Premature `staleTimes.dynamic = 20` & overlapping auth helpers | `ACT-07` |
| Stage 5 (`egm-zoom-out`) | `S5-7` | Over-coupled `MonthNavigationContext` & stale header on transition | `ACT-04` |
| Stage 5 (`egm-zoom-out`) | `S5-8` | Low-level `ResizeObserver` weeds vs `tabs.tsx` & ARIA `tablist` misuse | `ACT-11` |
| Stage 5 (`egm-zoom-out`) | `S5-9` | Altitude bleed & multi-phase churn on `QuickTransactionDrawer` / `dashboard/page.tsx` | `ACT-06`, `ACT-13`, `ACT-16` |
| Stage 6 (`egm-comprehension`) | `S6-1` | `<Suspense>` boundary vs visible header props (`AiMonthlyReviewModal`, R7 count) | `ACT-04` |
| Stage 6 (`egm-comprehension`) | `S6-2` | Circular execution order R1 -> R2 (picker & `.max(10)` Zod failure) | `ACT-06` |
| Stage 6 (`egm-comprehension`) | `S6-3` | `user_budget_templates` vs `Kasus A` & Step 3 vs Step 4 liabilities | `ACT-01`, `ACT-02` |
| Stage 6 (`egm-comprehension`) | `S6-4` | Legacy `'completed'` backfill vs empty-salary/template warning card trigger | `ACT-02` |
| Stage 6 (`egm-comprehension`) | `S6-5` | Status/Rule contradiction: `Disetujui Kenzo ✅` on pre-execution `[ ]` items | `ACT-09` |
| Stage 6 (`egm-comprehension`) | `S6-6` | Undefined project domain terms (`pos_wajib`, `Strict Month-Date`, `isTemporary`, KPI) | `ACT-15` |
| Stage 6 (`egm-comprehension`) | `S6-7` | R8 unexplained `Opsi A`, `transactionId`, `softDeleteTransaction`, `Kasus A` | `ACT-05`, `ACT-08` |
| Stage 6 (`egm-comprehension`) | `S6-8` | R8 `Bayar` missing `Uang Bebas` fallback, custom nominal, overpay, `activeMonthId` null | `ACT-05` |
| Stage 6 (`egm-comprehension`) | `S6-9` | R1 vs R10 DB SQL cleanup timing & undefined Zero-Emoji regex scope | `ACT-06`, `ACT-13` |
| Stage 6 (`egm-comprehension`) | `S6-10` | R9 `getCurrentUser` non-RSC, missing `logout`/`onboarding`/`settings` routes | `ACT-07` |
| Stage 6 (`egm-comprehension`) | `S6-11` | R9 `staleTimes = 20` vs R4 "Zero Stale Data" `?month=` interaction | `ACT-07` |
| Stage 6 (`egm-comprehension`) | `S6-12` | R10 `onboardingStep`, `?resume=1`, `0` vs `null` salary, `50/30/20` presets | `ACT-02` |
| Stage 6 (`egm-comprehension`) | `S6-13` | R10 active-month sync (`templateId`, `incomes`) & `deleteCategory` edges | `ACT-01` |
| Stage 6 (`egm-comprehension`) | `S6-14` | Undefined verification commands (`Tailwind v4 Canonical Audit`) & missing links | `ACT-14` |
| Stage 6 (`egm-comprehension`) | `S6-15` | `amber/biru` vs `amber/indigo` & `AppCategoryIcon` inline specs | `ACT-15` |
| Stage 6 (`egm-comprehension`) | `S6-16` | Dangling screenshots, R3 count (`7` vs `8` + R8), `Tarik Darurat`, `optimisticHref` | `ACT-11`, `ACT-16` |
| Stage 6 (`egm-comprehension`) | `S6-17` | R4 `CreateMonthDialog` disabled state & `?month=` fallback matching | `ACT-18` |
| Stage 6 (`egm-comprehension`) | `S6-18` | R2 24 icon slug completeness & edit-category `.max(50)` reuse | `ACT-06`, `ACT-15` |
| Stage 6 (`egm-comprehension`) | `S6-19` | R6 drawer closed/reopen `lastAutoDescriptionRef` lifecycle | `ACT-10`, `ACT-16`, `ACT-18` |
| Stage 6 (`egm-comprehension`) | `S6-20` | R7 `"bulan arsip"` definition & `"7 pos"` subtitle location | `ACT-12` |
| Stage 7 (`critic_report.md`) | `S7-1` | Missing `Alternatives Considered`, batch Problem Statement, & `Non-Goals` | `ACT-08` |
| Stage 7 (`critic_report.md`) | `S7-2` | R4 `<Suspense>` vs `dashboard/page.tsx` header dependencies | `ACT-04` |
| Stage 7 (`critic_report.md`) | `S7-3` | R8 missing `.for("update")`, overpay guards, negative DB `targetBudget`, `updateLiability` | `ACT-05` |
| Stage 7 (`critic_report.md`) | `S7-4` | R10 `deleteCategory` `liabilityId` corruption & $N\times$ `Dynamic Freedom Buffer` | `ACT-01` |
| Stage 7 (`critic_report.md`) | `S7-5` | R10 `/onboarding` `proxy.ts`, RLS, `months` unique index, `18M` leak, `deleteIncome` | `ACT-01`, `ACT-02`, `ACT-03` |
| Stage 7 (`critic_report.md`) | `S7-6` | R10 personal fallbacks on sub-routes & R7 6 unlisted `"7 pos"` / `[2026,2027]` literals | `ACT-03`, `ACT-11`, `ACT-12` |
| Stage 7 (`critic_report.md`) | `S7-7` | R9 `logout()`/`onboarding` cache leak, helper mismatch, full-table `export.ts` scan | `ACT-07` |
| Stage 7 (`critic_report.md`) | `S7-8` | R6 optimistic-close reset bug & `DrawerFooter` blur/`DESIGN-SYSTEM.md` conflicts | `ACT-10`, `ACT-15` |
| Stage 7 (`critic_report.md`) | `S7-9` | R1/R2 split SQL cleanup, missing `update*` Zod schemas, narrow Zero-Emoji guard | `ACT-06` |
| Stage 7 (`critic_report.md`) | `S7-10` | Cross-section drift, missing `File Terdampak` R3/R10, linear Mermaid, Section 4/5 DoD gaps | `ACT-09`, `ACT-13`, `ACT-14` |
| Stage 7 (`critic_report.md`) | `S7-11` | `IconPicker` touch width, font re-measure, nav labels, broken backticks/LaTeX/typos | `ACT-11`, `ACT-16`, `ACT-17` |
| Stage 8 (`intermediate_zoom_out`) | `S8-1` | Eliminate split-brain templates + redundant Settings active CRUD + `templateId` bloat | `ACT-01` |
| Stage 8 (`intermediate_zoom_out`) | `S8-2` | Replace speculative 4-column onboarding enum/guard with `onboardingCompletedAt` | `ACT-02` |
| Stage 8 (`intermediate_zoom_out`) | `S8-3` | Defer `staleTimes.dynamic = 20`; move cycle-header inside R4 `<Suspense>` boundary | `ACT-04`, `ACT-07` |
| Stage 8 (`intermediate_zoom_out`) | `S8-4` | Unify `createTransaction` & `recordInstallmentPayment` core; reuse `QuickTransactionDrawer` | `ACT-05` |
| Stage 8 (`intermediate_zoom_out`) | `S8-5` | Simplify R3 to contracts/existing `tabs.tsx` + `radiogroup`; drop `optimisticHref` | `ACT-11` |
| Stage 8 (`intermediate_zoom_out`) | `S8-6` | Merge/decouple R1+R2 cleanly; consolidate SQL cleanup & hot-file churn | `ACT-06`, `ACT-13` |
| Stage 8 (`intermediate_zoom_out`) | `S8-7` | Holistic zero-dummy sweep & dynamic counts/years across all routes | `ACT-03`, `ACT-12` |
| Stage 8 (`intermediate_zoom_out`) | `S8-8` | Remove implementation weeds, fix `DESIGN-SYSTEM.md` conflicts, add `Alternatives` | `ACT-08`, `ACT-09`, `ACT-15`, `ACT-16` |
| Stage 9 (`readiness_report`) | `S9-1` | R4 `<Suspense>` deadlock, invalid `?month=` fallback, false `floatingMobile` | `ACT-04` |
| Stage 9 (`readiness_report`) | `S9-2` | R10 template inheritance vs `Kasus A`, Step 4 liabilities, `CreateMonthDialogProps` | `ACT-01`, `ACT-02` |
| Stage 9 (`readiness_report`) | `S9-3` | R8 `targetBudget` negative math, missing `liabilities.icon`, 0/>1 `Uang Bebas` & locks | `ACT-05` |
| Stage 9 (`readiness_report`) | `S9-4` | R10 sibling route Kenzo fallbacks & missing `UserSessionData` onboarding fields | `ACT-02`, `ACT-03` |
| Stage 9 (`readiness_report`) | `S9-5` | R10 DDL/backfill SQL order, RLS, `?resume=1`, `proxy.ts`, `18_000_000` initializers | `ACT-02`, `ACT-03` |
| Stage 9 (`readiness_report`) | `S9-6` | R10 unenumerated Settings files, `export.ts`, & `deleteCategory` safety hazards | `ACT-01`, `ACT-02`, `ACT-03` |
| Stage 9 (`readiness_report`) | `S9-7` | Batch `Mode EXECUTING` vs `AGENTS.md` §2 per-phase approval gate | `ACT-09` |
| Stage 9 (`readiness_report`) | `S9-8` | R4 `useTransition` location disconnect in `MonthNavigationContext` | `ACT-04` |
| Stage 9 (`readiness_report`) | `S9-9` | R6 optimistic-close reopen bug, `QuickCategoryOption.group`, `py-3 pb-[...]` clash | `ACT-10` |
| Stage 9 (`readiness_report`) | `S9-10` | R2 missing `update*` schemas, `wishlists.ts:70`, R1 globs & `BudgetCategoryList` reset | `ACT-06`, `ACT-17` |
| Stage 9 (`readiness_report`) | `S9-11` | R3 `type="button"`, `role="tablist"`, portal re-measure, `MobileBottomNav`, years | `ACT-11` |
| Stage 9 (`readiness_report`) | `S9-12` | R7 `CreateMonthDialog` missing `latestMonth`, omitted subtitle check, 5 `"7 Pos"` sites | `ACT-12` |
| Stage 9 (`readiness_report`) | `S9-13` | R9 `explicitUserId` bypass before `React.cache`, SSR test harness, `/settings` & logout | `ACT-07` |
| Stage 9 (`readiness_report`) | `S9-14` | Target Scope `[Create|Modify|Delete]` discipline, test regression map, audit commands | `ACT-07`, `ACT-13`, `ACT-14` |
| Stage 9 (`readiness_report`) | `S9-15` | R8 `toISOString()` WIB off-by-1 bug, `IncomeSection` reuse, `freeBudgetRemaining` formula | `ACT-05` |
| Stage 9 (`readiness_report`) | `S9-16` | R5 formatting/tie-break, `BudgetCategoryList` reset, `WishlistGrid`, `availableYears` | `ACT-11`, `ACT-17`, `ACT-18` |
| Stage 9 (`readiness_report`) | `S9-17` | R1 color/inline, R6 `<DrawerHeader>`/clear edge, Line 450 SQL order phrasing | `ACT-15`, `ACT-16` |

---

## 4. Langkah Lanjutan yang Disarankan

1. Tinjau prioritas **`ACT-01` – `ACT-09` (Blocker)** di atas—terutama keputusan penyederhanaan **Stage 8 (`egm-zoom-out`)**:
   - Menyatukan Sumber Anggaran di `budget_categories` (`/dashboard`) dan memakai template onboarding hanya untuk inisialisasi Bulan 1 (**`ACT-01`**).
   - Mengganti 4 kolom status onboarding kompleks dengan `onboardingCompletedAt` + cek data riil (**`ACT-02`**).
   - Menunda `staleTimes.dynamic = 20` sampai hasil profiling `React.cache` terukur, dan memindahkan header data-bulan ke dalam `<Suspense>` (**`ACT-04`**, **`ACT-07`**).
   - Menyatukan inti mutasi & modal pembayaran `R8` dengan `createTransaction` + `QuickTransactionDrawer` (**`ACT-05`**).
2. Setelah kamu memilih arah penyelesaiannya, jalankan `/egm-resolve` pada [`docs/plans/PLANREVISI.md`](../plans/PLANREVISI.md) sebelum masuk tahap implementasi. *(Seluruh berkas `docs/review/*.md` akan dibersihkan otomatis setelah seluruh implementasi & verifikasi rampung.)*
