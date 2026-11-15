# Goldfish Annotated Review Report

**Status:** `resolved` (`2026-11-15 16:22 WIB`)
**Target:** `docs/plans/PLANREVISI.md` (`Lines 1..573`, diperbarui dari `1..462`)
**Source Audit:** [`docs/review/consolidated_review_report.md`](./consolidated_review_report.md) (`ACT-01` – `ACT-18`, mencakup temuan Stages 5–9)
**Summary Counts:** `17` `PROPOSE FIX` (Diterapkan) | `1` `ESCALATE` (`Issue 9A` — ditandai di header `PLANREVISI.md`, menunggu pilihan Kenzo) | `1` `CONTEST` (`Issue 11A` — `SlidingSegmentedControl` dipertahankan) | `1` `DECLINE` (`Issue 18`) (`20` butir terpetakan ke seluruh `ACT-01`–`ACT-18`)

---

## Prioritized Findings & AI Suggestions

### [Issue 1 — ACT-01] [`egm-zoom-out`, `egm-comprehension`, `egm-design`, `egm-implementation-readiness`, `egm-style`] - Severity: Blocker
*   **Affected Scope:** [`Lines 35, 379, 393, 412, 415-419, 451`](../plans/PLANREVISI.md#L379) (Fase R10 & Risiko `deleteCategory` vs `month-generator.ts`)
*   **Discrepancy Description:** `month-generator.ts#L224-L276` (`Kasus A`) mewarisi bulan baru dari `previousCategories` di `budget_categories`, sedangkan `R10` menambahkan `user_budget_templates` paralel plus editor & `deleteCategory` bulan aktif di `/dashboard/settings` serta tombol heuristik *"Terapkan ke Bulan Aktif Saat Ini"* tanpa FK `templateId`. Selain itu `deleteCategory` belum melarang hapus pos dengan `liabilityId !== null` atau pos `uang_bebas_tabungan` tunggal, tidak membatasi maksimal `1` pos `uang_bebas_tabungan` (`Dynamic Freedom Buffer` menghitung pemasukan tambahan `N` kali), membiarkan `transactions.categoryId` tetap `ON DELETE CASCADE`, mengabaikan row `isDeleted = true` Undo TTL, serta tidak menjaga konservasi `targetBudget` atau melarang `deleteIncome` pada `isBaseSalary: true`.
*   **Rationale:** Dua sumber kebenaran anggaran menyebabkan edit di Settings dan di `/dashboard` saling menimpa atau gagal cocok saat pos diganti nama; sedangkan `ON DELETE CASCADE` atau pindah transaksi paksa satu-per-satu membebani UX dan berisiko menghapus riwayat cashflow maupun merusak `liabilities.paidAmount` saat Undo.
*   ***AI Suggestion:*** `PROPOSE FIX`
*   ***Justification:*** Menyatukan arsitektur ke rekomendasi **Stage 8 (Single Source of Truth)** sekaligus menjawab pertanyaan Kenzo tentang praktik terbaik `deleteCategory` tanpa repot memindahkan transaksi secara manual:
    1. Tetapkan `budget_categories` di `/dashboard` (`BudgetCategoryList`) sebagai satu-satunya editor pos aktif berjalan (`Kasus A` bulan `N -> N+1`), sedangkan `user_budget_templates` di Onboarding & `Data & Backup` (`/dashboard/settings`) hanya menginisialisasi **Bulan 1** (saat user belum punya bulan) dan memperbarui `defaultBaseSalary`. Hapus editor ganda bulan aktif & tombol sync heuristik dari `/dashboard/settings` beserta wacana `templateId` FK.
    2. Batasi maksimal **1** pos `uang_bebas_tabungan` per template & per bulan agar `Dynamic Freedom Buffer` (`queries/months.ts#L254-L256`) dan `closeMonth` (`actions/months.ts#L260`) selalu konsisten, serta lindungi `deleteIncome` agar menolak baris `isBaseSalary === true`.
    3. Ubah FK `transactions.categoryId` dari `onDelete: "cascade"` menjadi `onDelete: "restrict"` di `src/db/schema.ts`, dan sediakan `deleteCategory` (dipicu dari kartu pos di `/dashboard`) dengan 2 jalur ringan anti-ribet bila pos sudah punya transaksi:
       - **Opsi Non-Destruktif (Default Disarankan):** *"Hentikan Mulai Bulan Depan"* (`set targetBudget = 0, isTemporary = true`) — **0 transaksi perlu dipindah**, cashflow bulan berjalan tetap akurat penuh, dan pos otomatis tidak muncul di bulan berikutnya.
       - **Opsi Hapus Permanen + 1-Click Bulk Reassign:** pilih **1** pos tujuan (default otomatis ke pos `uang_bebas_tabungan`) di dalam dialog konfirmasi agar **seluruh** transaksi pos tersebut langsung dipindahkan dalam 1 `db.transaction` sebelum pos dihapus (tanpa memindahkan transaksi satu-per-satu).
       - Tolak penghapusan jika bulan `isClosed`, tersisa 1 pos, `liabilityId !== null`, atau merupakan pos `uang_bebas_tabungan` terakhir; tolak bulk-reassign ke pos lain yang punya `liabilityId !== null` atau lintas `monthId`; dan tangani `isDeleted = true` dengan menonaktifkan penghapusan permanen selagi masih ada transaksi Undo `< 10` detik atau mengarsipkan/memindahkannya secara eksplisit sebelum `DELETE`.
*   ***Proposed Edit:***
    *   Location: [`docs/plans/PLANREVISI.md#L35`](../plans/PLANREVISI.md#L35), [`#L379`](../plans/PLANREVISI.md#L379), [`#L393`](../plans/PLANREVISI.md#L393), [`#L412`](../plans/PLANREVISI.md#L412), [`#L415-L420`](../plans/PLANREVISI.md#L415-L420), [`#L451`](../plans/PLANREVISI.md#L451)
    *   Change: Perbarui keputusan & rancangan R10 agar: (a) `user_budget_templates` + `defaultBaseSalary` berfungsi sebagai blueprint Bulan 1 & referensi default gaji berikutnya, sementara `/dashboard` (`Kasus A`) menjadi satu-satunya editor pos aktif berjalan (menghapus duplikasi CRUD bulan aktif & tombol *"Terapkan ke Bulan Aktif Saat Ini"* di Settings); (b) batasi maksimal **1** pos `uang_bebas_tabungan` di template & bulan dan lindungi `deleteIncome` pada `isBaseSalary: true`; (c) ubah `transactions.categoryId` ke `onDelete: "restrict"` dan terapkan `deleteCategory` di `/dashboard` dengan jalur **Nonaktifkan Mulai Bulan Depan (`targetBudget = 0`, `isTemporary = true`)** atau **1-Click Bulk Reassign** (melarang hapus pada `isClosed`, pos terakhir, `uang_bebas_tabungan` terakhir, `liabilityId !== null`, target reassign `liabilityId !== null`, serta menjaga selisih `isDeleted` & konservasi saldo `Uang Bebas`).

---

### [Issue 2 — ACT-02] [`egm-zoom-out`, `egm-comprehension`, `egm-design`, `egm-structural`, `egm-implementation-readiness`, `egm-codebase-details`] - Severity: Blocker
*   **Affected Scope:** [`Lines 38, 371-429, 450`](../plans/PLANREVISI.md#L371-L429) (`src/proxy.ts#L58`, `src/actions/auth.ts#L34-L38`, `src/db/schema.ts#L121-L132`, `src/db/migrations/0002_enable_rls_all_tables.sql`)
*   **Discrepancy Description:**
    1. R10 menambah 4 artifak state onboarding (`onboardingStatusEnum` `"pending" | "skipped" | "completed"`, `onboardingStep`, `initialSetupCompletedAt`, serta guard `?resume=1` & auto-promosi Settings), namun `Line 394` menandai user lama `'completed'` dengan `defaultBaseSalary = null` & `0` template sementara `Line 411` memunculkan card peringatan bila `(gaji pokok / template pos masih kosong)`.
    2. `src/proxy.ts#L58` hanya melindungi `pathname.startsWith("/dashboard")`, membiarkan `/onboarding` terbuka tanpa sesi login.
    3. `UserSessionData` / `login()` / `getCurrentUser()` di `auth.ts` belum membawa status onboarding yang dibutuhkan redirect `/login` -> `/onboarding`.
    4. `PLANREVISI.md` belum merinci definisi DDL kolom baru, urutan DDL -> `UPDATE` backfill di SQL migrasi yang sama, kebijakan RLS untuk tabel baru `user_budget_templates` (catatan: 9 tabel eksisting sudah memiliki RLS di `0002_enable_rls_all_tables.sql`), constraint unik `(user_id, year, month_index)` pada `months`, integrasi Step 4 `liabilities` ke Bulan 1, array konkret contoh netral `"50/30/20"`, struktur fallback `"Uang Bebas / Tabungan"` (`targetBudget: baseSalary`), `CreateMonthDialogProps`, serta inventori file Settings (`src/actions/`, `src/lib/queries/`, `src/schemas/`, `src/components/features/settings/*`) tanpa fitur *Delete Account* di luar scope.
*   **Rationale:** Mesin status 4-kolom bersifat YAGNI dan memicu benturan langsung antara migrasi user lama vs banner peringatan; sementara celah `/onboarding` di `proxy.ts`, RLS tabel baru, dan kurangnya kontrak DDL/Steps menyebabkan implementasi terhenti.
*   ***AI Suggestion:*** `PROPOSE FIX`
*   ***Justification:*** Mengakui temuan valid sambil meluruskan bahwa 9 tabel lama telah memiliki RLS pada `src/db/migrations/0002_enable_rls_all_tables.sql#L1-L102` (hanya `user_budget_templates` yang perlu policy baru + `months` unique constraint). Mengganti 4 kolom onboarding dengan 1 kolom nullable timestamp `onboardingCompletedAt` + cek data domain nyata di `/dashboard` menghilangkan drift status ganda sekaligus menjaga akun lama bebas warning card palsu.
*   ***Proposed Edit:***
    *   Location: [`docs/plans/PLANREVISI.md#L35, #L38, #L376-L429, #L450`](../plans/PLANREVISI.md#L390-L429)
    *   Change: Sederhanakan skema `users` menjadi `onboardingCompletedAt` (`timestamp with timezone`, nullable — `null` berarti belum selesai Step 5 / tertahan ke `/onboarding`) + `defaultBaseSalary` (`integer`, nullable); jalankan `ALTER TABLE` + backfill `UPDATE "users" SET "onboarding_completed_at" = NOW()` atomik dalam 1 berkas migrasi Drizzle sebelum mengaktifkan guard; derivasikan card peringatan di `/dashboard` dari kondisi domain nyata (`onboardingCompletedAt !== null && monthsList.length === 0 && (defaultBaseSalary === null || templatesCount === 0)` atau khusus akun dengan `monthsList.length === 0 && hasExplicitSkipIntent` sehingga akun eksisting bebas banner palsu); lindungi `/onboarding` di `src/proxy.ts` (`isProtectedRoute`); sertakan `onboardingCompletedAt` & `defaultBaseSalary` di `UserSessionData`; tambahkan kebijakan RLS `user_budget_templates` + unique `(user_id, year, month_index)` pada `months`; definisikan penggabungan Step 4 `liabilities` ke Bulan 1, array konkret template `"50/30/20"`, struct fallback `"Uang Bebas / Tabungan"` (`targetBudget: baseSalary`, `icon: "wallet"`, `sortOrder: 1`, `isTemporary: false`), serta `CreateMonthDialogProps`.

---

### [Issue 3 — ACT-03] [`egm-zoom-out`, `egm-design`, `egm-implementation-readiness`, `egm-codebase-details`] - Severity: Blocker
*   **Affected Scope:** [`Lines 396, 409-412, 427`](../plans/PLANREVISI.md#L409-L412) (`analytics/page.tsx#L22-L182`, `wishlists/page.tsx#L27-L66`, `vault/page.tsx#L22-L37`, `dashboard/page.tsx#L265-L280, #L495-L526`, `queries/savings.ts#L17, #L47`, `schema.ts#L93`, `actions/auth.ts#L102, #L197`, `actions/months.ts#L134, #L156`, `actions/savings.ts#L95, #L323`, `actions/wishlists.ts#L306`, `schemas/savings.schema.ts#L21-L26`, `actions/export.ts#L143-L160`)
*   **Discrepancy Description:** R10 hanya membersihkan dummy di `dashboard/page.tsx` atas, `month-generator.ts`, dan `CreateMonthDialog.tsx`. Data pribadi Kenzo dan angka bawaan `18.000.000` / `3.000.000` masih aktif di `analytics/page.tsx` (`fallbackAnalytics`), `wishlists/page.tsx` (`fallbackWishlists`), `vault/page.tsx` (`fallbackVault`), `dashboard/page.tsx` (`fallbackVault` & `"🎯 Target Tabungan Kamera & Lensa"`), `queries/savings.ts` (`DEFAULT_MONTHLY_FIXED_EXPENSE = 3_000_000`), `schema.ts#L93`, `auth.ts`, `months.ts`, `savings.ts`, `wishlists.ts`, serta `updateEmergencyTargetSchema` masih `.positive()` (bentrok bila nilai awal/reset `0`), dan `exportFinancialData` JSON belum menyertakan `user_budget_templates`.
*   **Rationale:** User baru yang langsung membuka `/analytics`, `/wishlists`, `/vault`, atau kartu hub Wishlist di `/dashboard` masih melihat hutang iPhone, Talangan Mama, dan Kamera Sony A6700 pribadi Kenzo, melanggar arsitektur multi-tenant & fail-closed UI (`financial-domain.md`).
*   ***AI Suggestion:*** `PROPOSE FIX`
*   ***Justification:*** Seluruh temuan 100% terverifikasi eksis di kode sumber dan harus dibersihkan serentak agar pengalaman user baru benar-benar bersih & jujur.
*   ***Proposed Edit:***
    *   Location: [`docs/plans/PLANREVISI.md#L396, #L409-L412, #L427`](../plans/PLANREVISI.md#L409-L412) (dan `File Terdampak` R10)
    *   Change: Perluas sapu bersih zero-dummy R10 menjadi audit lintas **seluruh 4 rute dashboard** (`dashboard/page.tsx`, `analytics/page.tsx`, `wishlists/page.tsx`, `vault/page.tsx`) agar membuang `fallback*` pribadi Kenzo dan merender empty state jujur; set inisialisasi `emergencyFundTarget: 0` seragam di `db/schema.ts#L93`, `financial-calculations.ts#L283`, `auth.ts`, `months.ts`, `savings.ts`, `wishlists.ts`, serta `DEFAULT_MONTHLY_FIXED_EXPENSE = 0` di `queries/savings.ts#L17`; selaraskan `updateEmergencyTargetSchema` (`>= 0` vs `.positive()` dengan UX input target eksplisit > 0); ubah `"💵 Gaji Pokok"` menjadi `"Gaji Pokok"` di `actions/months.ts#L156`; dan tambahkan `userBudgetTemplates` ke JSON backup di `src/actions/export.ts`.

---

### [Issue 4 — ACT-04] [`egm-zoom-out`, `egm-comprehension`, `egm-design`, `egm-implementation-readiness`, `egm-codebase-details`] - Severity: Blocker
*   **Affected Scope:** [`Lines 29, 152-189, 254, 444`](../plans/PLANREVISI.md#L152-L189) (`dashboard/page.tsx#L297-L360`, `QuickTransactionDrawer.tsx#L60, #L94, #L178`)
*   **Discrepancy Description:**
    1. R4 memindahkan `getMonthDetailById` ke async child `<Suspense key={selectedMonthId ?? "active"}>`, namun tetap mempertahankan judul siklus/badge status, `activeCategories.length` (R7), `AiMonthlyReviewModal`, dan `QuickTransactionDrawer` *di luar* `<Suspense>` padahal semuanya membutuhkan `currentMonthDetail` dari `getMonthDetailById`.
    2. `PLANREVISI.md` menyebut penonaktifan tombol floating mobile di `/dashboard`, padahal `dashboard/page.tsx#L345-L358` hanya merender satu inline `<QuickTransactionDrawer />` tanpa prop `floatingMobile` (catatan codebase: prop `floatingMobile?: boolean` memang ada definisinya di `QuickTransactionDrawer.tsx#L60`, namun tidak dipakai di `/dashboard`).
    3. `MonthSelector.tsx` memakai `useTransition` lokal, sehingga `MonthNavigationContext` Provider tidak bisa mendeteksi akhir `isPending` saat navigasi dibatalkan/gagal; aturan fallback invalid `?month=` dan props `DashboardMonthShell` / `DashboardSkeleton` juga belum eksplisit.
*   **Rationale:** Kontradiksi tree React `<Suspense>` membuat implementasi R4 buntu saat dijalankan, sementara judul bulan lama tertinggal selama skeleton aktif dan cross-domain `MonthNavigationContext` membocorkan state ke modul `ai/` & `transactions/`.
*   ***AI Suggestion:*** `PROPOSE FIX`
*   ***Justification:*** Pemisahan batas `<Suspense>` yang tepat membuat root `DashboardPage` cukup memanggil `getCachedAuthenticatedSession()` + `getAllMonths(user.id)` (untuk `MonthSelector` + `CreateMonthDialog`) sementara seluruh blok yang bergantung pada bulan berjalan—termasuk strip info siklus/badge, subtitle jumlah pos, `AiMonthlyReviewModal`, `QuickTransactionDrawer`, dan metrik—berada **di dalam** `<Suspense>` / `DashboardMonthShell`, menghilangkan coupling konteks ke `ai/` & `transactions/` sekaligus!
*   ***Proposed Edit:***
    *   Location: [`docs/plans/PLANREVISI.md#L29, #L152-L189`](../plans/PLANREVISI.md#L152-L189)
    *   Change: Revisi desain R4 agar: (a) hanya `MonthSelector` (+ `CreateMonthDialog`) yang tinggal di luar `<Suspense key={selectedMonthId ?? "active"} fallback={<DashboardSkeleton hideHeader />}>`, sedangkan judul/badge siklus, `activeCategories.length`, `AiMonthlyReviewModal`, `QuickTransactionDrawer`, dan seluruh kartu data dipindah ke `DashboardMonthContent` di **dalam** `<Suspense>`/`DashboardMonthShell` (menghapus injeksi `useOptionalMonthNavigation()` ke `AiMonthlyReviewModal.tsx` & `QuickTransactionDrawer.tsx` serta menghapus klaim `floatingMobile` di header); (b) pindahkan `useTransition` ke dalam `MonthNavigationContext` Provider (`startMonthSwitch(id, name, navigate)`) lengkap dengan kontrak `DashboardMonthShellProps` & `DashboardSkeletonProps`; dan (c) dokumentasikan resolusi `?month=` invalid fallback ke `getActiveMonth` / `monthsList[0]`.

---

### [Issue 5 — ACT-05] [`egm-zoom-out`, `egm-comprehension`, `egm-design`, `egm-implementation-readiness`, `egm-codebase-details`] - Severity: Blocker
*   **Affected Scope:** [`Lines 33, 281-336, 448`](../plans/PLANREVISI.md#L281-L336) (`actions/transactions.ts#L55-L191`, `actions/liabilities.ts#L42-L306`, `lib/month-generator.ts#L233-L290`, `lib/queries/months.ts#L250-L256`, `QuickTransactionDrawer.tsx#L72-L85`, `IncomeSection.tsx#L84-L92`, `db/schema.ts#L102-L115`)
*   **Discrepancy Description:**
    1. R8 menduplikasi alur validasi/insert `createTransaction` ke `recordInstallmentPayment` dan menduplikasi dialog 4-field di `LiabilityTrackerCard.tsx` (padahal `QuickTransactionDrawer` sudah punya kategori/nominal/metode/keterangan/tanggal), sambil menyisakan jalur `monthId == null` yang melewati tabel `transactions`.
    2. `recordInstallmentPayment` & `createTransaction` belum memakai `.for("update")` row lock maupun guard server `isSettled === true` & `amount > remainingAmount`.
    3. Mengecek sisa in-memory (`effectiveTarget = targetBudget + additionalIncomesSum`) lalu memotong DB `target_budget` berisiko menghasilkan `targetBudget < 0`.
    4. Tabel `liabilities` tidak punya kolom `icon`, sehingga `IconPicker` R8 hilang bila toggle bulan aktif dimatikan; `Line 313` juga keliru menulis `isTemporary: true` di konteks update `liabilities` padahal kolom itu ada di `budget_categories`.
    5. Kondisi `!activeMonthId` (user baru R10 tanpa bulan), kuota `Uang Bebas` habis saat `Bayar Rp ...`, `custom amount !== monthlyPayment`, `updateLiability` mengubah `monthlyPayment`, `Kasus A` `month-generator.ts#L278-L290` menyisipkan cicilan baru tanpa potong `Uang Bebas` + tidak sinkron `baseSalary`, dan bug UTC `toISOString()` di `getDefaultCycleDate` (`QuickTransactionDrawer` & `IncomeSection`) belum ditangani.
*   **Rationale:** Risiko race condition, overpayment/double-settlement, `targetBudget < 0`, hilangnya saldo Zero-Based Budgeting, dan off-by-1 tanggal WIB `00:00–06:59`.
*   ***AI Suggestion:*** `PROPOSE FIX`
*   ***Justification:*** Menyatukan inti transaksi ke 1 helper bersama + `.for("update")` + validasi `freeCat.targetBudget >= monthlyPayment` AND `effectiveRemaining >= monthlyPayment` menjamin atomisitas mutasi lintas UI tanpa duplikasi logika.
*   ***Proposed Edit:***
    *   Location: [`docs/plans/PLANREVISI.md#L33, #L281-L336, #L448`](../plans/PLANREVISI.md#L281-L336)
    *   Change: (a) Ekstrak 1 helper internal bersama `executeCategoryTransactionTx` untuk `createTransaction` & `recordInstallmentPayment` dengan `.for("update")` row lock pada `liabilities` + `budget_categories` serta guard server `isSettled` & `amount <= remainingAmount`; (b) gunakan `<QuickTransactionDrawer>` (dengan `defaultAmount`, `defaultDescription`, `defaultMethod`) bila pos tertaut sudah ada, dan dialog konfirmasi ringkas hanya untuk cicilan belum tertaut / `!activeMonthId`; (c) syaratkan **kedua** `freeCat.targetBudget >= monthlyPayment` AND `effectiveRemaining >= monthlyPayment`, serta definisikan perilaku eksplisit bila `Uang Bebas` habis atau `!activeMonthId` (`Bayar` catat ke `liabilities` tanpa pos bulan, atau tampilkan pesan kebutuhan buka bulan); (d) tambah kolom `icon` default `"credit-card"` pada `liabilities` agar pilihan `IconPicker` tersimpan antar-bulan & perjelas `isTemporary: true` hanya di-set pada `budget_categories`; (e) perbaiki `month-generator.ts` `Kasus A` (relokasi lunas dari `previousCategories` saja menggunakan `liability.monthlyPayment`, serta potong `Uang Bebas` untuk cicilan aktif baru) dan tambah sinkronisasi pada `updateLiability`; (f) definisikan rumus `freeBudgetRemaining` di `dashboard/page.tsx`; dan (g) pakai zona waktu `Asia/Jakarta` di `resolveDefaultCycleDate` untuk `QuickTransactionDrawer`, `LiabilityTrackerCard`, `IncomeSection`, & `liabilities.ts`.

---

### [Issue 6 — ACT-06] [`egm-zoom-out`, `egm-comprehension`, `egm-structural`, `egm-implementation-readiness`, `egm-codebase-details`] - Severity: Blocker
*   **Affected Scope:** [`Lines 38, 46-47, 68-124, 390-394, 423, 441`](../plans/PLANREVISI.md#L68-L124) (`lib/financial-calculations.ts#L69-L78, #L349-L398`, `schemas/category.schema.ts#L38-L43, #L84`, `schemas/wishlist.schema.ts#L29-L34, #L61`, `actions/wishlists.ts#L70`, `components/features/wishlists/WishlistCard.tsx#L82-L108`)
*   **Discrepancy Description:**
    1. Urutan sirkuler `R1 -> R2`: R1 memasang Icon Picker & key `> 10` karakter sebelum R2 membuat `IconPicker.tsx` dan memperlebar `.max(10)` -> `.max(50)`.
    2. R2 lupa `updateCategorySchema.icon` (`category.schema.ts#L84`), `updateWishlistSchema.icon` (`wishlist.schema.ts#L61`), serta `"|| '🎯'"` di `wishlists.ts#L70`.
    3. R1 memecah return type `WishlistProgress` (`calculateWishlistProgress`) tanpa kontrak non-breaking dan belum mengonsolidasi emoji hardcoded di `WishlistCard.tsx#L82-L108`.
    4. Daftar lengkap 24 pasangan `(key, label, LucideIcon)`, peta fallback emoji DB (`"👩‍👦"`, `"👵"`, `"✝️"`, `"📷"`, `"🖥️"`, `"🍿"`, dll.), regex ZWJ/VS-16 (`\u200D`, `\uFE0F`), cakupan Zero-Emoji Guard ke `src/actions/` & `src/lib/`, serta kepemilikan tunggal migrasi SQL cleanup (R1 vs R10 `Line 423`) belum jelas.
*   **Rationale:** Mengikuti dokumen saat ini akan menggagalkan typecheck/build di R1 karena `IconPicker` belum dibuat dan Zod menolak slug Lucide di jalur Create maupun Update.
*   ***AI Suggestion:*** `PROPOSE FIX`
*   ***Justification:*** Memisahkan tanggung jawab R1 vs R2 secara bersih (atau menggabungkan prasyarat skema + registry + 1 migrasi SQL `--custom` ke R1, lalu `IconPicker` & form wiring ke R2) memutus ketergantungan sirkuler tanpa merusak existing tests.
*   ***Proposed Edit:***
    *   Location: [`docs/plans/PLANREVISI.md#L38, #L68-L124, #L423`](../plans/PLANREVISI.md#L68-L124)
    *   Change: Kunci pemisahan tegas: **R1** mencakup tabel eksplisit 24 ikon `(key, label, LucideIcon)` + peta fallback emoji DB + `stripEmojiPrefix` (`\p{Extended_Pictographic}`, `\u200D`, `\uFE0F`), `AppCategoryIcon` props (`variant: "badge" | "inline"`), perluasan non-breaking `WishlistProgress` (`milestoneIconKey` optional/added alongside `milestoneLabel` + pemakaian di `WishlistCard.tsx`), kenaikan `.max(50)` di ke-4 skema create/update (`category.schema.ts`, `wishlist.schema.ts`), `wishlists.ts#L70` (`|| "target"`), Zero-Emoji Regex Audit lintas `src/components/`, `src/app/`, `src/actions/`, `src/lib/` (`exclude __tests__`), serta **1 migrasi `--custom` SQL cleanup** di R1 (hapus duplikasi cleanup R1 di `R10 Line 423`). **R2** fokus penuh pada `IconPicker.tsx` (`IconPickerProps`, `type="button"`, `role="radiogroup"`, fallback key tak dikenal) dan integrasinya ke `BudgetCategoryList.tsx` (plus reset `icon`/`group`), `WishlistGrid` (`WishlistCard.tsx#L285-L336`), R8, dan R10.

---

### [Issue 7 — ACT-07] [`egm-zoom-out`, `egm-comprehension`, `egm-design`, `egm-implementation-readiness`, `egm-codebase-details`] - Severity: Blocker
*   **Affected Scope:** [`Lines 34, 337-368, 449`](../plans/PLANREVISI.md#L337-L368) (`next.config.ts`, `actions/auth.ts#L232-L291`, `actions/export.ts#L126-L131`, `lib/queries/months.ts#L41-L64`)
*   **Discrepancy Description:**
    1. Bentrok nama `revalidateAllDashboardPaths` (`Line 348`) vs `revalidateDashboardRoutes` (`Line 350`), rute `/vault` vs `/dashboard/vault`, dan `settings/page.tsx` terlewat dari daftar halaman R9 (`Line 347`).
    2. `resolveAuthenticatedUserId(explicitUserId)` harus menjalankan `if (explicitUserId) return explicitUserId;` **sebelum** memanggil `React.cache` berbasis `cookies()` agar `bun test` non-request tidak throw; `bun test` dedup verification harness juga belum didefinisikan.
    3. `src/actions/export.ts#L128` menarik seluruh baris `budgetCategories` **lintas semua user** di Postgres tanpa filter `where`.
    4. Mengaktifkan `experimental.staleTimes.dynamic = 20` sebelum profiling membenturkan R4 "Zero Stale Data" (`?month=` kembali ke cache lama selama 20 detik) dan berisiko membocorkan cache antar-sesi setelah `logout()`/`login()`/`onboarding` karena modul tersebut belum diinvalidasi.
*   **Rationale:** Kebocoran scan penuh `export.ts` berisiko keamanan/performa multi-tenant, sedangkan `staleTimes.dynamic = 20` tanpa profiling & tanpa invalidasi auth/onboarding menimbulkan bug stale data lintas user & lintas bulan.
*   ***AI Suggestion:*** `PROPOSE FIX`
*   ***Justification:*** Menjalankan rekomendasi Stage 8: kirimkan perbaikan bottleneck terverifikasi lebih dulu (`React.cache` auth dedup 1x + `user` prop propagation + fix `export.ts#L128` + `revalidateDashboardRoutes()` lintas semua mutasi termasuk `auth.ts` `logout()`/`login()` dan `onboarding.ts`), lalu **tunda** `experimental.staleTimes.dynamic = 20` sebagai langkah opsional pasca-profiling (atau sertakan `router.refresh()` wajib bila diaktifkan).
*   ***Proposed Edit:***
    *   Location: [`docs/plans/PLANREVISI.md#L34, #L337-L368, #L449`](../plans/PLANREVISI.md#L337-L368)
    *   Change: Seragamkan nama menjadi `revalidateDashboardRoutes()` dan seluruh path `/dashboard/*`; tambahkan `settings/page.tsx`, `auth.ts` (`logout`/`login`), dan `onboarding.ts` ke cakupan dedup/invalidasi; eksplisitkan guard `if (explicitUserId) return explicitUserId;` di awal `resolveAuthenticatedUserId` + desain mock SSR test harness `React.cache`; wajibkan perbaikan `export.ts#L128` memakai `inArray(budgetCategories.monthId, [...monthIds])`; dan posisikan `React.cache` + `revalidateDashboardRoutes()` + sub-route `loading.tsx` sebagai inti R9 sementara `experimental.staleTimes.dynamic = 20` ditunda sampai profiling pasca-dedup menunjukkan kebutuhan (disertai catatan `router.refresh()` di `logout` & R4 `?month=` cache semantics).

---

### [Issue 8 — ACT-08] [`egm-structural`, `egm-design`, `egm-comprehension`] - Severity: Blocker
*   **Affected Scope:** [`Lines 1-65, Section 0-1`](../plans/PLANREVISI.md#L1-L65)
*   **Discrepancy Description:** `PLANREVISI.md` hanya mencantumkan tujuan proses meta di `Line 4`, tanpa **Problem Statement** produk untuk batch `R1–R10`, tanpa **Non-Goals**, dan tanpa bagian **Alternatives Considered** yang mendokumentasikan alternatif ditolak pada keputusan kunci (termasuk apa itu `Opsi B/C` dibanding `Opsi A` di R8, `React.cache`-first vs `staleTimes: 20` di R9, dan `user_budget_templates` Month-1 vs sync berkelanjutan di R10).
*   **Rationale:** Spesifikasi tanpa *Problem Statement*, *Non-Goals*, dan *Alternatives Considered* gagal memenuhi standar spesifikasi fitur (`feature-spec-standard.md`) serta menyulitkan reviewer/implementer memahami trade-off saat ada kendala di lapangan.
*   ***AI Suggestion:*** `PROPOSE FIX`
*   ***Justification:*** Penambahan ringkas 3 subseksi ini langsung menutup gap `feature-spec-standard.md` dan mengontekstualisasikan istilah `Opsi A` pada R8 untuk pembaca tanpa konteks chat `/grill-me`.
*   ***Proposed Edit:***
    *   Location: [`docs/plans/PLANREVISI.md#L1-L40`](../plans/PLANREVISI.md#L1-L40) (di antara header/Seksi 0 dan Seksi 1)
    *   Change: Tambahkan blok ringkas **Problem Statement Batch R1–R10**, daftar **Non-Goals** (misal: belum menambah multi-currency, belum ada *Delete Account*, belum ada server push sync eksternal), serta tabel ringkas **Alternatives Considered** untuk `R1/R2`, `R3`, `R4`, `R8` (`Opsi A` vs `Opsi B` tracking independen tanpa transaksi), `R9` (`React.cache`-first vs `staleTimes.dynamic = 20`), dan `R10` (`Templates Month-1 + Kasus A` vs dua editor live).

---

### [Issue 9A — ACT-09A] [`egm-comprehension`, `egm-style`] - Severity: Blocker
*   **Affected Scope:** [`Lines 6-8, 59-61, 205, 439-440`](../plans/PLANREVISI.md#L6-L8) vs [`AGENTS.md` §2](../../AGENTS.md)
*   **Discrepancy Description:** `PLANREVISI.md` (`Lines 7, 59, 205, 439-440`) menetapkan mode eksekusi sekaligus (`R1–R10` dikerjakan beruntun sebelum approval gate), sedangkan `AGENTS.md` §2 dan `planning.md` §4 mewajibkan pengerjaan **hanya 1 fase per iterasi** dengan gerbang `IMPLEMENTED — AWAITING APPROVAL` sebelum lanjut.
*   **Rationale:** Benturan aturan eksekusi antara rencana batch vs aturan kerja resmi berisiko membuat agent melompati persetujuan fase atau sebaliknya menunda eksekusi bertahap di luar ekspektasi Kenzo.
*   ***AI Suggestion:*** `ESCALATE`
*   ***Justification:*** Keputusan mengeksekusi revisi secara batch (`"kerjain sekaligus yaa?"`) berasal dari instruksi verbal eksplisit Kenzo di sesi sebelumnya (tercatat di `.changelog/2026-11-15_create_planrevisi_workflow.md#L6`), yang berada di luar cakupan `AGENTS.md` §2 (yang memang belum diamendemen) dan di luar konteks Goldfish reviewer. Mengingat batch `R1–R10` kini juga mencakup migrasi skema DB (`R10` & `R1`), konfirmasi ulang Kenzo diperlukan sebelum implementasi dimulai:
    - **Pilihan A (Batch Tunggal Terkendali):** Tetap kerjakan `R1–R10` dalam 1 batch setelah Kenzo memberi instruksi mulai, namun tetap jalankan cek statis/unit test per blok dependensi + audit SQL migrasi wajib sebelum eksekusi migrasi DB.
    - **Pilihan B (Per-Fase Ketat `AGENTS.md` §2):** Eksekusi 1 atau kelompok fase logis per giliran (`IMPLEMENTED — AWAITING APPROVAL`) sehingga review lebih ringan.
*   ***Proposed Edit:***
    *   Location: [`docs/plans/PLANREVISI.md#L5-L8, #L205, #L439`](../plans/PLANREVISI.md#L5-L8)
    *   Change: *(Menunggu keputusan eksplisit Kenzo di Interactive Resolution Gate — tidak otomatis diubah sebelum konfirmasi pilihan A vs B).*

---

### [Issue 9B — ACT-09B] [`egm-comprehension`, `egm-structural`, `egm-style`] - Severity: Blocker
*   **Affected Scope:** [`Lines 3, 25-36, 197, 205, 281, 337, 373, 431, 457`](../plans/PLANREVISI.md#L25-L36)
*   **Discrepancy Description:** Dokumen mencampur header `COLLECTING → READY FOR BATCH EXECUTION` dengan `M["Revisi R11..Rn"]` & komentar `<!-- Silakan kirim revisi berikutnya -->`, memakai label `Disetujui Kenzo ✅` untuk kunci desain pra-eksekusi `/grill-me` (identik dengan badge persetujuan implementasi di `Lines 14, 16`), memiliki selisih timestamp R10 (`15:43 WIB` di `Line 35` vs `15:39 WIB` di `Lines 373, 375`), serta memakai istilah tak terdefinisi `"Mode EXECUTING"` di `Line 205`.
*   **Rationale:** Pembaca atau implementer baru bisa keliru mengira fase sudah diimplementasikan dan disetujui (`Disetujui Kenzo ✅`), sementara checkbox `[ ]` masih kosong.
*   ***AI Suggestion:*** `PROPOSE FIX`
*   ***Justification:*** Memisahkan label pra-implementasi (`Desain Terkunci (Pra-Eksekusi)`) dari status implementasi (`IMPLEMENTED — AWAITING APPROVAL` -> `Approved ✅`) menghilangkan ambiguitas tanpa mengubah makna keputusan `/grill-me`.
*   ***Proposed Edit:***
    *   Location: [`docs/plans/PLANREVISI.md#L3, #L26-L35, #L197, #L205, #L281, #L337, #L431, #L457`](../plans/PLANREVISI.md#L26-L35)
    *   Change: Ubah label `/grill-me` di Seksi 1 & heading R8/R9 dari `Disetujui Kenzo ✅` menjadi `Desain Terkunci (Pra-Eksekusi)`; selaraskan timestamp R10 (`15:39 WIB /grill-me` + `15:43 WIB` addendum `deleteCategory`); perbarui `Line 3` & `Line 431` setelah `/egm-resolve` selesai; ubah `"saat Mode EXECUTING"` (`Line 205`) menjadi keterangan urutan eksekusi aktual; dan ganti `R1..Rn` di DoD (`Line 457`) menjadi `R1–R10`.

---

### [Issue 10 — ACT-10] [`egm-design`, `egm-implementation-readiness`, `egm-codebase-details`] - Severity: Major
*   **Affected Scope:** [`Lines 215-248, 446`](../plans/PLANREVISI.md#L215-L248) (`QuickTransactionDrawer.tsx#L123-L167, #L199-L204`)
*   **Discrepancy Description:**
    1. `QuickTransactionDrawer.tsx#L144, L152` menutup drawer secara optimistis (`setOpen(false)`) lalu membuka ulang (`setOpen(true)` + `form.setError`) saat gagal; `useEffect` reset (`#L123-L133`) terpicu lagi pada `open === true` sehingga menghapus input user, `lastAutoDescriptionRef`, serta `form.setError`.
    2. `QuickCategoryOption` belum punya `group?: CategoryGroup` di `QuickTransactionDrawer.tsx` maupun di `dashboard/page.tsx#L350-L357`; `form.setValue("description", ...)` di `R6` belum menyebut opsi `{ shouldDirty, shouldValidate }`.
    3. `Line 226` memasang `sticky bottom-0 bg-background/95 backdrop-blur-sm px-1 py-3 pb-[...]` pada sibling `<DrawerFooter>` tanpa `shrink-0`, menimbulkan duplikasi padding bawah Tailwind v4 (`py-3` vs `pb-[...]`) dan bentrok dengan `DESIGN-SYSTEM.md#L46` (`Hindari ... glassmorphism`).
*   **Rationale:** Tanpa guard reopen pada `useEffect`, auto-fill & error server pada submit gagal akan langsung terhapus.
*   ***AI Suggestion:*** `PROPOSE FIX`
*   ***Justification:*** Semua bug dan bentrokan class terverifikasi langsung pada `QuickTransactionDrawer.tsx#L123-L161` dan `DESIGN-SYSTEM.md#L46`.
*   ***Proposed Edit:***
    *   Location: [`docs/plans/PLANREVISI.md#L225-L248, #L446`](../plans/PLANREVISI.md#L225-L248)
    *   Change: Tambahkan guard `shouldSkipNextOpenResetRef` (dan pemeriksaan transisi `closed -> open`) pada `useEffect` reset; teruskan `group?: CategoryGroup` pada `QuickCategoryOption` & `dashboard/page.tsx#L350`; wajibkan `form.setValue("description", ..., { shouldValidate: false, shouldDirty: true })`; ganti class `<DrawerFooter>` menjadi solid `bg-background border-t border-border/60 px-1 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] shrink-0 flex-row gap-2`; dan cantumkan strategi unit test SSR (`defaultOpen` atau helper murni).

---

### [Issue 11A — ACT-11A] [`egm-zoom-out`] - Severity: Major
*   **Affected Scope:** [`Lines 127-151`](../plans/PLANREVISI.md#L127-L151) (`src/components/ui/tabs.tsx#L26-L73`)
*   **Discrepancy Description:** Laporan Stage 5 & Stage 8 mengkritik `R3` karena membuat `SlidingSegmentedControl` baru tanpa memanfaatkan `src/components/ui/tabs.tsx` (`variant="default" | "line"`) yang disebut telah memiliki *animated `after:` indicator*.
*   **Rationale:** Mengklaim duplikasi komponen primitive ketika komponen UI Shadcn sudah ada.
*   ***AI Suggestion:*** `CONTEST`
*   ***Justification:*** Kritik ini tidak akurat terhadap kebutuhan visual R3 jika dicek langsung di [`src/components/ui/tabs.tsx#L65-L69`](../../src/components/ui/tabs.tsx#L65-L69):
    - `TabsTrigger` (`variant="default"`) berpindah secara statis menggunakan background aktif (`data-active:bg-background`), **tanpa** animasi pergeseran overlay antar-tab.
    - `TabsTrigger` (`variant="line"`) hanya menganimasikan `after:opacity-0 after:transition-opacity ... data-active:after:opacity-100` (fade-in/out di tempat pada pseudo-element tiap tombol), **bukan** satu track indicator tunggal yang meluncur horizontal kiri-kanan (`transform: translateX(...)` + `width`) mengikuti item aktif seperti permintaan eksplisit Kenzo di `R3`.
    - Oleh karena itu, tetap diperlukan satu komponen terpadu (`SlidingSegmentedControl`) atau primitive beranimasi geser horizontal.
*   ***Proposed Edit:***
    *   Location: [`docs/plans/PLANREVISI.md#L132-L135`](../plans/PLANREVISI.md#L132-L135)
    *   Change: Pertahankan `SlidingSegmentedControl` sebagai komponen sliding horizontal overlay; namun rapikan kontrak ARIA & properti teknisnya sesuai temuan valid pada `Issue 11B`.

---

### [Issue 11B — ACT-11B] [`egm-zoom-out`, `egm-comprehension`, `egm-structural`, `egm-implementation-readiness`, `egm-codebase-details`] - Severity: Major
*   **Affected Scope:** [`Lines 28, 127-151, 443`](../plans/PLANREVISI.md#L127-L151) (`AppHeader.tsx`, `MobileBottomNav.tsx#L71-L80`, `AnalyticsDashboard.tsx#L47, #L304`)
*   **Discrepancy Description:**
    1. R3 memaksakan `role="tablist"`/`"tab"` untuk kontrol pilihan input form tanpa `tabpanel` (metode bayar `QuickTransactionDrawer`, kelompok `BudgetCategoryList`), belum mewajibkan `type="button"` agar klik tidak men-submit form drawer, dan mencampurkan detail implementasi mikro (`offsetLeft`, `ResizeObserver`) di plan.
    2. `!hasMeasured` saat SSR/hidrasi awal, re-measure di dalam portal Vaul/Radix Dialog atau saat font dimuat (`document.fonts?.ready`), dimensi garis atas + kapsul `MobileBottomNav`, perilaku `Tarik Darurat` aksen rose, serta `optimisticHref` pada navigasi `<Link>` yang rawan desync saat *Back/Forward* browser belum terspesifikasi.
    3. `AnalyticsDashboard.tsx#L47, #L304` masih memakai `[2026, 2027] as const` dan `useState<2026 | 2027>(2026)` ketimbang `data.availableYears`; jumlah lokasi R3 tercatat `"7 lokasi"` padahal mencakup 8 kontrol di 7 berkas plus R8 & R10.
*   **Rationale:** `role="tablist"` tanpa `tabpanel` melanggar aksesibilitas ARIA; ketiadaan `type="button"` dalam `<form>` menyebabkan submit tidak sengaja; dan tahun hardcoded membuat analitik rusak di tahun 2028+.
*   ***AI Suggestion:*** `PROPOSE FIX`
*   ***Justification:*** Semua temuan teknis aksesibilitas, navigasi `usePathname()`, dan tahun dinamis `data.availableYears` valid dan meningkatkan ketangguhan R3.
*   ***Proposed Edit:***
    *   Location: [`docs/plans/PLANREVISI.md#L28, #L127-L151, #L443`](../plans/PLANREVISI.md#L127-L151)
    *   Change: Tambahkan kontrak `role?: "tablist" | "radiogroup"` (wajib `"radiogroup"`/`"radio"` + `type="button"` untuk kontrol form), definisi TypeScript ringkas `SlidingSegmentedControlProps` & `useSlidingIndicator`, fallback SSR aktif berbasis CSS saat `!hasMeasured`, trigger re-measure saat container drawer/dialog terbuka & `fonts.ready`, penggunaan `usePathname()` langsung di `AppHeader`/`MobileBottomNav` (hapus `optimisticHref` berisiko desync), dimensi `h-0.5` garis atas + pill `MobileBottomNav` serta aksen `Tarik Darurat`, migrasi `AnalyticsDashboard` ke `data.availableYears`, dan koreksi label menjadi **8 kontrol di 7 berkas eksisting + R8 & R10**.

---

### [Issue 12 — ACT-12] [`egm-comprehension`, `egm-design`, `egm-implementation-readiness`, `egm-codebase-details`] - Severity: Major
*   **Affected Scope:** [`Lines 250-280`](../plans/PLANREVISI.md#L250-L280) (`dashboard/page.tsx#L324, #L375`, `MonthSelector.tsx#L79, #L191`, `CreateMonthDialog.tsx#L158`, `BudgetCategoryList.tsx#L10, #L130`, `IncomeSection.tsx#L180, #L216`, `AiMonthlyReviewModal.tsx#L209`, `AppHeader.tsx#L207`, `gemini.ts#L155`)
*   **Discrepancy Description:**
    1. Memisahkan `<CreateMonthDialog />` keluar dari `MonthSelector` (`Line 264`) menghilangkan prop wajib `latestMonth={monthsList[0] ?? null}` yang saat ini dihitung di `MonthSelector.tsx#L79, #L191`.
    2. Pembaruan subtitle dinamis `activeCategories.length` (`Line 254`, keliru ditulis *"kuota pos"* di `Line 273`) belum masuk ke `Checklist Eksekusi` (`Lines 276-279`), belum mendefinisikan tampilan `0` bulan, dan melewatkan kemunculan string `"7 pos"` lainnya di codebase (`dashboard/page.tsx#L375`, `CreateMonthDialog.tsx#L158`, `BudgetCategoryList.tsx#L130`, `IncomeSection.tsx#L180, #L216`, `AiMonthlyReviewModal.tsx#L209`, `AppHeader.tsx#L207`, `gemini.ts#L155`).
    3. Breakpoint tinggi tombol menggunakan `md:h-9` (`Line 268`) sedangkan tata letak 2x2 menggunakan `lg:` (`Line 263`), dan `"rapikan root JSX"` `MonthSelector` belum menyebut `<Fragment>` tanpa wrapper `div`.
*   **Rationale:** Menghilangkan `latestMonth` merusak auto-suggest nama siklus bulan baru berikutnya di `CreateMonthDialog`, sedangkan label `"7 pos"` yang tersisa menyesatkan setelah user mengustomisasi jumlah pos.
*   ***AI Suggestion:*** `PROPOSE FIX`
*   ***Justification:*** Seluruh lokasi `"7 pos"` dan `latestMonth` di `MonthSelector.tsx#L79, #L191` terverifikasi melalui pencarian & pembacaan kode.
*   ***Proposed Edit:***
    *   Location: [`docs/plans/PLANREVISI.md#L254-L280`](../plans/PLANREVISI.md#L254-L280)
    *   Change: Teruskan `latestMonth={monthsList[0] ?? null}` secara eksplisit pada `<CreateMonthDialog />` di `dashboard/page.tsx`; ubah root `MonthSelector` saat `showCreateButton={false}` menjadi tanpa wrapper `div` (`<>...</>`/`button` langsung); selaraskan breakpoint `lg:h-9 lg:min-h-9` pada `QuickTransactionDrawer`; tambahkan item khusus di `Checklist Eksekusi` R7 untuk mengganti subtitle header (`activeCategories.length` / fallback 0 bulan) serta sapu bersih semua string UI/prompt `"7 pos"` di `dashboard/page.tsx`, `CreateMonthDialog.tsx`, `BudgetCategoryList.tsx`, `IncomeSection.tsx`, `AiMonthlyReviewModal.tsx`, `AppHeader.tsx`, dan `src/lib/ai/gemini.ts`.

---

### [Issue 13 — ACT-13] [`egm-zoom-out`, `egm-comprehension`, `egm-structural`, `egm-implementation-readiness`] - Severity: Major
*   **Affected Scope:** [`Lines 42-62, 75-91, 136-144, 371-430, 439`](../plans/PLANREVISI.md#L42-L62) (`AGENTS.md` §5)
*   **Discrepancy Description:** **R3** dan **R10** belum memiliki bagian terstruktur `File Terdampak` berlabel `[Create | Modify | Delete]`, sementara R1 & R9 memakai glob (`dll.`, `src/app/**/page.tsx`, `actions/*`); diagram Mermaid Seksi 2 memaksa urutan serial linear `R1 -> ... -> R10` alih-alih dependensi paralel dan hotspot file yang sebenarnya (`QuickTransactionDrawer.tsx`, `dashboard/page.tsx`); serta dampak regresi terhadap 5 berkas uji (`financial-calculations.test.ts`, `schemas.test.ts`, `months.test.ts`, `backend-phases-b7-b13.test.ts`, `frontend-phases-f7-f18.test.tsx`) belum dipetakan per fase.
*   **Rationale:** Tanpa daftar file eksak (`[Create|Modify|Delete]`), pemisahan lapisan `actions/` vs `lib/queries/` vs `schemas/` vs `components/` (`AGENTS.md` §5) dan urutan eksekusi hotspot mudah keliru.
*   ***AI Suggestion:*** `PROPOSE FIX`
*   ***Justification:*** Standarisasi penuh daftar berkas per fase dan pemetaan tes membuat eksekusi batch atau bertahap berjalan mulus tanpa tabrakan file.
*   ***Proposed Edit:***
    *   Location: [`docs/plans/PLANREVISI.md#L42-L62`](../plans/PLANREVISI.md#L42-L62), subseksi `File Terdampak` di `R1–R10`
    *   Change: Seragamkan bagian `File Terdampak` (`[Create | Modify | Delete]`) tanpa singkatan/glob pada seluruh `R1–R10` (termasuk daftar eksplisit file R3 dan pemisahan file R10 ke `src/actions/onboarding.ts`, `src/actions/settings.ts`, `src/lib/queries/settings.ts`, `src/schemas/onboarding.schema.ts`, `src/schemas/settings.schema.ts`, `src/components/features/onboarding/*`, `src/components/features/settings/*`, `src/proxy.ts`); perbaiki grafik Mermaid menjadi DAG dependensi riil beserta catatan konsolidasi file panas; dan tambahkan tabel/butir pemetaan regresi pada ke-5 berkas uji unit eksisting.

---

### [Issue 14 — ACT-14] [`egm-comprehension`, `egm-structural`, `egm-style`, `egm-implementation-readiness`] - Severity: Major
*   **Affected Scope:** [`Lines 8, 17, 37, 60, 98, 150, 435-462`](../plans/PLANREVISI.md#L435-L462)
*   **Discrepancy Description:**
    1. Perintah `Tailwind v4 Canonical Audit` (`Total non-canonical: 0`) berulang kali diwajibkan sebagai gerbang DoD tanpa menyertakan command CLI/skrip nyata; penggunaan `tsc --noEmit` vs `bun run typecheck` tidak konsisten; dan klaim baseline `81/81 PASS` di `Line 17` belum mencantumkan tanggal/checkpoint (`2026-11-15 13:46 WIB`).
    2. Seksi 4 (Risiko) belum mencakup risiko keamanan kepemilikan lintas-user saat bulk-reassign di `deleteCategory` maupun skalabilitas grid `QuickTransactionDrawer` (`R6`) jika jumlah pos anggaran user sangat banyak.
    3. Seksi 5 DoD belum merangkum verifikasi migrasi + RLS, Zero-Emoji & Zero-Dummy grep guard, sinkronisasi `docs/DESIGN-SYSTEM.md` & `docs/PROJECT-STRUCTURE.md`, serta daftar uji UI manual Kenzo.
*   **Rationale:** Kriteria lulus yang tidak disertai perintah eksekusi konkret tidak dapat diaudit ulang secara objektif oleh implementer maupun agent baru.
*   ***AI Suggestion:*** `PROPOSE FIX`
*   ***Justification:*** Berdasarkan bukti historis di `.changelog/2026-11-14_complete_phases_b7_b13_and_f7_f18.md#L86`, proyek ini memakai `@tailwindcss/node` (`ds.canonicalizeCandidates`) untuk audit Tailwind v4. Menuliskannya secara eksplisit beserta pola grep `font-mono` & dummy data menghilangkan ambiguitas verifikasi.
*   ***Proposed Edit:***
    *   Location: [`docs/plans/PLANREVISI.md#L8, #L17, #L435-L462`](../plans/PLANREVISI.md#L435-L462)
    *   Change: Cantumkan skrip/perintah audit nyata (`@tailwindcss/node` `ds.canonicalizeCandidates`, `grep -rn "font-mono" src/`, grep zero-dummy & zero-emoji), seragamkan ke `bun run typecheck`, catat referensi tanggal `2026-11-15 13:46 WIB` pada baseline `81/81 PASS`, tambah 2 baris risiko di Seksi 4 (otorisasi `deleteCategory` lintas user & skalabilitas daftar pos panjang pada `R6`), serta perluas Seksi 5 DoD (`R1–R10`, audit migrasi/RLS, pembaruan `docs/DESIGN-SYSTEM.md` & `docs/PROJECT-STRUCTURE.md`, dan checklist uji manual Kenzo).

---

### [Issue 15 — ACT-15] [`egm-comprehension`, `egm-style`, `egm-design`] - Severity: Major
*   **Affected Scope:** [`Lines 14, 26, 72, 78, 89, 113, 134, 226, 286, 293, 304, 313, 451`](../plans/PLANREVISI.md#L26) (`docs/DESIGN-SYSTEM.md#L46, #L73-L75, #L110, #L115, #L126`)
*   **Discrepancy Description:**
    1. Inkonsistensi warna kotak ikon `pos_wajib`: `amber/biru lembut` (`Line 26`) vs `amber/indigo lembut` (`Line 72`), ditambah ketiadaan spesifikasi ukuran varian `inline` vs kotak pada `AppCategoryIcon`.
    2. Konflik dengan `docs/DESIGN-SYSTEM.md` belum diselesaikan/dicatat resmi: kotak ikon dekoratif berwarna & radius `rounded-xl` (`Line 75` & `Line 73`), ukuran sentuh `size-10` vs target ideal `48×48px` (`Line 115`), transisi `duration-300` vs `120–200ms` (`Line 110`), serta catatan emoji kategori (`Line 126`).
    3. Istilah domain khas proyek (`pos_wajib`, `kebutuhan`, `uang_bebas_tabungan`, `Strict Month-Date Boundary`, `monthIndex`, `isTemporary`, `Executive Cashflow KPI`, serta kode fase `B1–B13`/`F1–F18`) belum diberi glosarium ringkas atau tautan.
*   **Rationale:** Pembaca atau developer baru berisiko salah menebak kode warna, indeks bulan (`1–12` vs `0–11`), atau menyimpang tanpa dokumentasi dari `DESIGN-SYSTEM.md`.
*   ***AI Suggestion:*** `PROPOSE FIX`
*   ***Justification:*** Menyatukan token `amber` (pos tertaut cicilan/perhatian) & `indigo` (pos wajib reguler), menyeragamkan `duration-200` (patuh `120–200ms` atau mencatat pengecualian di `DESIGN-SYSTEM.md`), dan menambah glosarium 7 butir menyelesaikan semua kesenjangan pemahaman sekaligus.
*   ***Proposed Edit:***
    *   Location: [`docs/plans/PLANREVISI.md#L12-L20, #L26, #L72, #L78, #L89, #L134`](../plans/PLANREVISI.md#L72-L89)
    *   Change: Kunci warna `pos_wajib` menjadi `indigo` lembut (atau `amber` lembut bila terikat `liabilityId !== null`), definisikan props `AppCategoryIcon` (`variant="badge"` `size-8 rounded-lg/xl` vs `variant="inline"` `size-4`), selaraskan durasi R3 (`duration-200`) + touch grid `IconPicker` (`min-h-11` di mobile) agar sesuai `docs/DESIGN-SYSTEM.md` (atau deklarasikan pembaruannya di `R1 Line 89`), tautkan `B1–B13`/`F1–F18` ke `PLANBACKEND.md`/`PLANFRONTEND.md`, dan sisipkan tabel glosarium domain ringkas di Seksi 0.

---

### [Issue 16 — ACT-16] [`egm-style`, `egm-comprehension`, `egm-implementation-readiness`] - Severity: Nit
*   **Affected Scope:** [`Lines 4, 31, 35, 73, 137, 139, 147, 150, 158, 167, 201, 205, 222, 226, 237-238, 252, 266, 281, 312, 349, 352, 367, 371, 443, 446, 450`](../plans/PLANREVISI.md#L158)
*   **Discrepancy Description:** Broken CommonMark code span memakai `\` di dalam single backtick (`Lines 158, 167, 312`), LaTeX `$...$` di heading `###` (`Lines 281, 371`), referensi screenshot yatim (`Lines 137, 139, 252`), typo/duplikasi kata (`ikut ikut`, `memecah proxy.ts`, `Line 450` urutan kalimat SQL DDL->DML), ketidakjelasan letak `<DrawerHeader>` & perilaku saat user menghapus teks manual hingga kosong di R6 (`Lines 226, 237`), kata sifat tak terukur (`100%`, `mulus`, `nyaman`, `seketika`), dan tautan file di R1/R10 belum berupa Markdown links.
*   **Rationale:** Memastikan validitas parsing Markdown/KaTeX dan menghilangkan kalimat rancu saat dibaca ulang.
*   ***AI Suggestion:*** `PROPOSE FIX`
*   ***Justification:*** Meski tergolong Nit, perbaikan sintaks CommonMark double-backtick, penghapusan `$...$` pada judul, dan koreksi typo sangat cepat diterapkan sekaligus menjaga dokumen bersih.
*   ***Proposed Edit:***
    *   Location: Baris terdampak di [`docs/plans/PLANREVISI.md`](../plans/PLANREVISI.md)
    *   Change: Gunakan double backtick pada template literal (`Lines 158, 167, 312`), ganti simbol panah Unicode (`↔` / `→`) di judul H3 (`Lines 281, 371`), hapus kalimat rujukan screenshot yatim, perbaiki typo (`ikut ikut`, `memecah proxy.ts`, phrasing DDL -> backfill DML di `Line 450`), eksplisitkan `<DrawerHeader>` di dalam scroll container + reset `lastAutoDescriptionRef` saat input dikosongkan manual, ganti `100%`/`mulus`/`seketika` dengan syarat terukur, dan normalkan link file R1/R10.

---

### [Issue 17 — ACT-17] [`egm-design`, `egm-style`, `egm-codebase-details`] - Severity: Nit
*   **Affected Scope:** [`Lines 113-115, 134, 137-138`](../plans/PLANREVISI.md#L113-L115) (`BudgetCategoryList.tsx#L118-L120`, `WishlistCard.tsx#L285-L336`)
*   **Discrepancy Description:**
    1. Grid `IconPicker` `grid-cols-6` dengan `size-10` terasa sempit pada layar `< 360px` (`R2`).
    2. `BudgetCategoryList.tsx#L118-L120` saat ini lupa me-reset `icon` & `group` seusai submit, dan komponen dialog tambah wishlist berada di export `WishlistGrid` di dalam `WishlistCard.tsx#L285-L336`.
    3. Penamaan label navigasi desktop (`"Data & Backup"`) vs bottom mobile nav (`"Backup"`) perlu ditegaskan apakah disengaja untuk ringkas atau diseragamkan.
*   **Rationale:** Meningkatkan ergonomi sentuh mobile dan ketepatan simbol komponen saat implementasi R2 & R3.
*   ***AI Suggestion:*** `PROPOSE FIX`
*   ***Justification:*** Perbaikan mikro ini mencegah bug form state yang tersisa setelah menambah pos kustom dan mempermudah target sentuh di perangkat sempit.
*   ***Proposed Edit:***
    *   Location: [`docs/plans/PLANREVISI.md#L113-L115, #L137-L138`](../plans/PLANREVISI.md#L113-L115)
    *   Change: Gunakan kelas responsif `grid-cols-4 min-[380px]:grid-cols-6` + `min-h-11` pada tombol `IconPicker`; eksplisitkan reset `icon` (`"wallet"`) & `group` (`"kebutuhan"`) di `BudgetCategoryList.tsx` dan simbol `WishlistGrid` di `WishlistCard.tsx#L285-L336`; dan catat secara eksplisit label ringkas `"Backup"` pada `MobileBottomNav` vs `"Data & Backup"` pada `AppHeader`.

---

### [Issue 18 — ACT-18] [`egm-comprehension`, `egm-implementation-readiness`] - Severity: Nit
*   **Affected Scope:** [`Lines 168, 197, 203`](../plans/PLANREVISI.md#L197) (`src/lib/financial-calculations.ts#L96-L118`)
*   **Discrepancy Description:** Penjelasan detail tie-break highlight aktif `Semua Sisa` saat `remaining` kebetulan sama dengan `QUICK_AMOUNTS` (`50000`/`100000`), konfirmasi penggunaan `formatRupiah(..., { prefix: false })`, status `CreateMonthDialog` saat `isSwitching`, serta pemolesan kalimat `Line 168` (`DashboardSkeleton`).
*   **Rationale:** Menyempurnakan detail minor pada perilaku tombol quick amount & loading skeleton.
*   ***AI Suggestion:*** `DECLINE`
*   ***Justification:*** Helper `formatRupiah(amount, { prefix: false })` sudah menjadi standar proyek (`src/lib/financial-calculations.ts#L96-L118`), kondisi highlight `Number(watchedAmount) === maxCategoryRemaining && maxCategoryRemaining > 0` bekerja wajar secara independen tanpa konflik, `CreateMonthDialog` tidak terikat data bulan terpilih saat membuat bulan baru, dan kalimat `Line 168` otomatis tergantikan oleh perbaikan `ACT-04`. Menolak sebagai Nit agar spesifikasi tidak membengkak oleh micro-detail yang sudah jelas di kode.
*   ***Proposed Edit:***
    *   Location: *(Tidak ada — dicatat sebagai DECLINE)*
    *   Change: Tidak ada perubahan yang diperlukan.
