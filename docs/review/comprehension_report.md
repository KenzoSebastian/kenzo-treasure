# Goldfish Comprehension Report (Stage 6)

**Target:** `docs/plans/PLANREVISI.md` (`FeatureRange: Lines 1..462`, `DetailedRange: Lines 66..462`)
**Reviewer:** `egm-comprehension`

## What this proposes

This document defines a batch of ten post-launch revisions (`R1`–`R10`) for the Kenzo Treasury personal finance web app, meant to be collected completely before sequential batch implementation. On the frontend and UX side, it replaces all emoji stickers across the UI and database with `lucide-react` icons and a 24-icon `IconPicker` (`R1`–`R2`), unifies tab and segmented-control switching with sliding overlays (`R3`), adds instant loading skeletons during month transitions (`R4`), improves the expense drawer with a `Semua Sisa` quick pill, single-scroll sticky footer, and auto-filled descriptions (`R5`–`R6`), and arranges desktop header action buttons into a right-aligned 2x2 grid (`R7`). On the financial logic and performance side, it implements two-way atomic synchronization between installment tracking (`liabilities`), budget categories, and transactions (`R8`), alongside per-request `React.cache` session deduplication, a 20-second dynamic router cache, sub-route loading skeletons, and centralized layout revalidation (`R9`). Finally, `R10` replaces hardcoded personal sample data with a register-to-login flow, a 5-step `/onboarding` wizard, route guards, new schema fields/tables (`users` onboarding columns and `user_budget_templates`), and template/category management in `/dashboard/settings`.

## How the existing system works, per this document

According to this document, Kenzo Treasury is a Next.js (`16.4.0`), Drizzle/PostgreSQL, and Supabase Auth budgeting application organized into monthly cycles with budget categories (`pos_wajib`, `kebutuhan`, `uang_bebas_tabungan`), daily transactions, installment liabilities, an emergency savings vault, wishlists, and AI monthly reviews. Currently, category and wishlist icons use text emojis or hardcoded emoji strings, switching months keeps the previous month's numbers visible while Next.js soft navigation awaits root Server Component queries, segmented controls lack sliding animations, and navigating between dashboard tabs incurs duplicate auth verification and zero dynamic client router caching (`staleTimes = 0`). Installment tracking (`liabilities`) currently syncs only one-way from budget categories, meaning creating a liability or clicking `Bayar Rp ...` in `LiabilityTrackerCard` neither creates a monthly category nor inserts a transaction row. In addition, newly registered accounts are automatically logged into `/dashboard` with no onboarding flow, and empty states or new-month generation fall back to Kenzo's hardcoded personal categories, `4.000.000` salary, and debt records.

---

## Findings

### 1. Severity: Blocker
- **Affected Scope:** Fase R4 — `<Suspense>` Boundary vs. Visible Header Controls (`Lines 156, 159–160, 163, 166, 168, 171, 181`) and Fase R7 (`Line 254`).
- **Discrepancy Description & Rationale:** Line 171 proposes moving `getMonthDetailById`, `getLiabilities`, `getSavingsAccount`, and `getWishlists` into an async child Server Component inside `<Suspense key={selectedMonthId ?? "active"} fallback={<DashboardSkeleton hideHeader />}>` beneath `DashboardMonthShell`. However, Lines 156 and 163 keep `MonthSelector`, `AiMonthlyReviewModal`, and `QuickTransactionDrawer` visible *outside* the `<DashboardSkeleton hideHeader />` replacement area (merely disabling the two action buttons during `isSwitching`), and R7 Line 254 puts `activeCategories.length` into the header subtitle. Because `AiMonthlyReviewModal`, `QuickTransactionDrawer` (which requires month-specific `categories` with `group` and `remaining` per R6 Line 229), and `activeCategories.length` all depend on `getMonthDetailById`, the document never explains how the header outside `<Suspense>` can render or supply those props when `getMonthDetailById` is deferred inside `<Suspense>`. Additionally, what `"Header"` is hidden by `hideHeader` on `DashboardSkeleton` (the global navbar vs. the dashboard title/action header) is ambiguous given that header controls remain rendered outside the skeleton.

### 2. Severity: Blocker
- **Affected Scope:** Mermaid Flow (`Lines 46–47`), Fase R1 (`Lines 77, 79, 87, 95`), and Fase R2 (`Lines 107–110, 114–116, 120–122`).
- **Discrepancy Description & Rationale:** The execution graph (`Lines 46–47`) and Line 7 mandate executing `R1` before `R2`. However, R1 already instructs replacing `<Input maxLength={4} />` in `BudgetCategoryList.tsx` and the form in `WishlistCard.tsx` with a Lucide Icon Picker (`Lines 79, 95`) and introducing multi-character slugs such as `"heart-handshake"` (15 chars) and `"credit-card"` (11 chars) in `category-icons.ts` (`Line 77`) and schemas (`Line 87`). R2—positioned *after* R1—then claims under *"Temuan Penting Pra-Implementasi"* (`Lines 107–110`) that `BudgetCategoryList.tsx` still uses `<Input maxLength={4} />`, `WishlistCard.tsx` still hardcodes `"🎯"`, `IconPicker.tsx` does not exist yet (`Line 120`), and `category.schema.ts` / `wishlist.schema.ts` enforce `.max(10)` causing Lucide slugs to fail server validation until R2 raises the limit to `.max(50)` (`Line 122`). A naive reader cannot execute R1 before R2 without hitting missing components and failing Zod validation.

### 3. Severity: Blocker
- **Affected Scope:** Fase R10 — `user_budget_templates` vs. `previousCategories`, and Step 3 vs. Step 4 (`Lines 379, 393, 403–404, 412, 415–416, 418`) vs. Fase R8 (`Line 315`).
- **Discrepancy Description & Rationale:** R10 states that editing `defaultBaseSalary` and `user_budget_templates` in Onboarding or `/dashboard/settings` automatically becomes the *"default untuk bulan-bulan baru ke depan"* (`Lines 379, 415–416`), while R8 Line 315 reveals that `month-generator.ts` uses `Kasus A (previousCategories.length > 0)` to generate subsequent months from the prior month's categories. The document never explains how `month-generator.ts` prioritizes `user_budget_templates` vs. `previousCategories` on Month 2+ (or what "Kasus A" vs. its implied counterpart means). In addition, Onboarding Step 3 asks users to balance `user_budget_templates` against `defaultBaseSalary` (`Line 403`) *before* Step 4 allows adding existing `liabilities` (`Line 404`); the document omits how Step 4's liabilities are reconciled when the user later clicks `+ Buat Bulan Baru` (whether they are auto-added as `pos_wajib` and deducted from `uang_bebas_tabungan`, or added on top of the template budget).

### 4. Severity: Blocker
- **Affected Scope:** Fase R10 — Existing Account Backfill vs. Incomplete-Data Warning Card (`Lines 394, 411, 423`).
- **Discrepancy Description & Rationale:** Line 394 backfills all existing user rows (such as Kenzo's account) to `onboarding_status = 'completed'` so existing accounts are never forced into onboarding, without backfilling `defaultBaseSalary` (nullable, stays `null`) or creating `user_budget_templates` rows. However, Line 411 instructs `/dashboard` to render the *"Card Peringatan Data Awal Belum Lengkap"* whenever `onboardingStatus === "skipped"` ***"(atau gaji pokok / template pos masih kosong)"***. Because existing accounts will have empty `defaultBaseSalary` and zero `user_budget_templates` after migration, this parenthetical condition will immediately trigger the incomplete-onboarding warning card for existing users despite Line 394's protection.

### 5. Severity: Major
- **Affected Scope:** Status Header (`Line 2`), Working Rules (`Lines 6–8`), Section 1 Table (`Lines 26–36`), and Phase Headings (`Lines 68, 197, 281, 337`).
- **Discrepancy Description & Rationale:** Lines 2 and 6–8 state that `R1–R10` are still awaiting batch execution, no code has changed, and checklists `- [ ]` must stay unchecked until `IMPLEMENTED — AWAITING APPROVAL` and final approval. Yet Section 1 (`Lines 26–35`) marks R1–R10 with `Disetujui Kenzo ✅`, and R8 (`Line 281`) and R9 (`Line 337`) place `Disetujui Kenzo ✅` directly on `### [ ] Fase R*` headings while leaving checkboxes unchecked. Using the exact same post-implementation approval phrasing (`Disetujui Kenzo ✅`, cf. `Lines 14, 16`) for `/grill-me` design sign-off creates an internal contradiction about whether these phases are approved specs or approved implementations.

### 6. Severity: Major
- **Affected Scope:** Core Domain Terms — `pos_wajib`, `kebutuhan`, `uang_bebas_tabungan`, `Strict Month-Date Boundary`, `monthIndex`, `isTemporary`, and `Executive Cashflow KPI` (`Lines 26, 72, 228–232, 286, 293, 303–304, 309, 313, 451`).
- **Discrepancy Description & Rationale:** Multiple project-specific concepts are assumed without inline definition or documentation links:
  - **`pos_wajib`, `kebutuhan`, `uang_bebas_tabungan`:** Never defined upfront (why `uang_bebas_tabungan` serves as the residual budget pool deducted when adding installments in R8 and excluded from auto-fill in R6).
  - **`Strict Month-Date Boundary` & `monthIndex` (`Lines 293, 309`):** Neither the cycle date boundaries (calendar month vs. payday cycle) nor `monthIndex` indexing (0-based vs. 1-based) nor the exact behavior of `resolveDefaultCycleDate(year, monthIndex)` is defined.
  - **`isTemporary: true` (`Lines 304, 313`):** Applied both to newly created installment `budget_categories` (`Line 304`) and to settled `liabilities` (`Line 313`), without explaining what `isTemporary` signifies or affects in the existing system.
  - **`Executive Cashflow KPI (totalSpent)` (`Lines 286, 451`):** Never explained where it is computed or displayed.

### 7. Severity: Major
- **Affected Scope:** Fase R8 — Existing 1-Way Sync, `transactionId`, `reallocatedFromSettledLiabilities`, `Kasus A`, and `"Opsi A"` (`Lines 33, 281, 284, 287, 294, 307, 311, 314–315, 448`).
- **Discrepancy Description & Rationale:** R8 refers to `"Opsi A"` (`Lines 33, 281, 294, 300, 331, 335`) without explaining what the alternative options were. It also relies on unexplained existing mechanisms: Line 284 mentions existing 1-way sync (`Pos Anggaran -> Tracking Cicilan`), Line 307 adds a condition *"dan `transactionId` tidak dikirim"*, Line 311 states `softDeleteTransaction` automatically reconciles `liabilities.paidAmount` for `liabilityId`-linked categories, and Line 448 warns not to call `createTransaction` inside `recordInstallmentPayment` to avoid double-counting. None of the existing `createTransaction`, `softDeleteTransaction`, or `recordInstallmentPayment(..., transactionId)` flows are described. Similarly, `reallocatedFromSettledLiabilities` and `Kasus A` in `month-generator.ts` (`Lines 287, 315`) are never explained.

### 8. Severity: Major
- **Affected Scope:** Fase R8 — `Bayar` Edge Cases (`Lines 290, 299, 311, 313, 317–319`).
- **Discrepancy Description & Rationale:** Three behavioral gaps remain unspecified in R8:
  1. Line 311 creates a missing linked category on the fly when clicking `Bayar Rp ...` by deducting `monthlyPayment` from `uang_bebas_tabungan`, but unlike `createLiability` (`Line 305`), it omits what happens when `uang_bebas_tabungan` lacks sufficient quota, or when the user enters a custom payment amount different from `monthlyPayment`.
  2. Line 290 notes client-side limits `> 0 & <= remainingAmount`, without stating whether `recordInstallmentPayment` on the server rejects overpayments exceeding `remainingAmount`.
  3. Lines 317–319 wire `activeMonthId` from `dashboard/page.tsx` into `LiabilityTrackerCard`, leaving unclear whether `activeMonthId` represents the user's *selected* `?month=` or the *latest open month*, and how `Bayar Rp ...` behaves when no open month exists (`activeMonthId` is `null`, e.g., right after R10 onboarding) or on a closed month.

### 9. Severity: Major
- **Affected Scope:** Fase R1 & R10 — Database Emoji Cleanup Timing/Logic and Zero-Emoji Audit Scope (`Lines 38, 73–74, 87, 91, 97, 423`).
- **Discrepancy Description & Rationale:** Line 38 highlights DB schema/data changes in both R1 and R10; R1 Line 97 instructs executing an idempotent SQL cleanup for `budget_categories`, `liabilities`, `wishlists`, and `incomes` during R1, whereas R10 Line 423 folds *"cleanup aman emoji DB (R1)"* into R10's Drizzle migration step (`bun run db:generate`). Furthermore, the exact SQL mapping/stripping rules for historical emoji strings in `icon` and `name` are unspecified, and the *"Automated Zero-Emoji Audit Test"* (`Line 91`) does not define which Unicode ranges/dingbats fail the check versus allowed symbols (`→`, `—`, `Rp`, etc.).

### 10. Severity: Major
- **Affected Scope:** Fase R9 — Auth/Onboarding Revalidation Gap, Non-RSC `getCurrentUser`, and Route Naming (`Lines 341–350, 359, 363, 366, 449`).
- **Discrepancy Description & Rationale:**
  - Line 347 delegates `getCurrentUser()` (`auth.ts`) to `React.cache` *"saat berjalan dalam konteks RSC"*, leaving unstated how `getCurrentUser()` behaves when called inside Server Actions.
  - Lines 350 and 359 migrate 7 mutation modules (`categories`, `incomes`, `liabilities`, `months`, `savings`, `transactions`, `wishlists`) to `revalidateDashboardRoutes()`, omitting `auth.ts` and R10's `onboarding.ts`, even though Risk Line 449 requires testing that *"alur logout tetap bersih"* under `staleTimes.dynamic = 20` (where an uninvalidated client cache after logout/login could briefly display the prior user's dashboard).
  - Line 347 omits `settings/page.tsx` from its explicit page list despite `settings` being covered in Lines 341 and 363, and R9 alternates between `/vault`, `/wishlists`, `/analytics`, `/settings` (`Lines 341, 343, 347, 352`) and `/dashboard/vault`, `/dashboard/wishlists`, `/dashboard/analytics`, `/dashboard/settings` (`Lines 350, 366`).

### 11. Severity: Major
- **Affected Scope:** Fase R9 vs. Fase R4 Interaction (`Lines 154, 160, 349, 365`).
- **Discrepancy Description & Rationale:** R4 enforces "Zero Stale Data" by replacing content with `<DashboardSkeleton hideHeader />` during `?month=` transitions (`Lines 154–160`), whereas R9 sets `experimental.staleTimes.dynamic = 20` (`Line 349`). Line 365 asserts compatibility with R4's `?month=` switching without explaining whether returning to a previously visited `?month=` within 20 seconds serves cached RSC data (bypassing `<DashboardSkeleton />`) or how stale month views are prevented if data changed in another tab.

### 12. Severity: Major
- **Affected Scope:** Fase R10 — Unspecified Onboarding Mechanics (`onboardingStep`, `?resume=1`, `0` vs. `null` Salary, `"50/30/20"` Template) (`Lines 392, 402–405, 408, 411`).
- **Discrepancy Description & Rationale:**
  - `users.onboardingStep` (`default 1`) is added in Line 392, yet Lines 396–430 never explain whether steps 2–4 persist to the database incrementally or only at Step 5, nor how `onboardingStep` is read on `/onboarding?resume=1`.
  - Line 408 restricts `"skipped"` users to opening `/onboarding` only via CTA `"Lengkapi Sekarang"`, while Line 411 links the warning card to `/onboarding?resume=1` without explicitly tying `"Lengkapi Sekarang"` to `?resume=1` or stating what happens on a direct `/onboarding` visit without `?resume=1`.
  - Line 392 uses `null` for an unset `defaultBaseSalary`, yet Line 405 requires `defaultBaseSalary > 0` for `"completed"`, leaving a `0` salary permanently treated as `"skipped"`.
  - Line 403 offers *"Pakai Contoh Template Netral (50/30/20)"* without defining the concrete category names, icons, group mappings, or target calculations when `defaultBaseSalary` is `null`/`0`.

### 13. Severity: Major
- **Affected Scope:** Fase R10 — `/dashboard/settings` Active-Month Sync & `deleteCategory` Edge Cases (`Lines 393, 418–419, 451`).
- **Discrepancy Description & Rationale:**
  - ***"Terapkan ke Bulan Aktif Saat Ini"*** (`Line 418`): Does not define how `user_budget_templates` rows match existing active-month `budget_categories` (Line 393 adds no `templateId` FK, so renaming a template would fail name matching), how the base salary row in `incomes` is identified for update, what happens to active-month categories removed from templates that have `0` transactions, or how Zero-Based Budget totals rebalance if targets/salary change.
  - **`deleteCategory`** (`Line 419`): Does not specify what happens to the deleted category's `targetBudget` when transactions are reassigned, whether deleting a `liabilityId`-linked category from R8 is prevented or cascades to tracking, or whether deleting the final `uang_bebas_tabungan` category in an active month is blocked (which R8 and Line 412 depend on).

### 14. Severity: Major
- **Affected Scope:** Undefined Project Artifacts, Workflows, and Commands (`Lines 2, 8, 14, 17, 60, 69, 84–85, 98, 150, 382, 440, 450, 460`).
- **Discrepancy Description & Rationale:**
  - **`Tailwind v4 Canonical Audit` / `Total non-canonical: 0`** (`Lines 8, 17, 60, 98, 150, 440, 460`): Mandatory verification and Definition of Done gate, yet no command, script, or linked documentation defines how to run it.
  - **`/grill-me`** (`Lines 2, 69`, etc.): Undefined workflow/command referenced as the authority for locked decisions.
  - **`B1–B13` & `F1–F18`** (`Lines 14, 90`, etc.): Undefined roadmap codes with no links to `PLANBACKEND.md` / `PLANFRONTEND.md`.
  - **`src/proxy.ts`** (`Lines 382, 450`): Referenced as an Edge routing/auth guard without explaining its role in the existing system.
  - **`Fallback Preview` on `analytics/page.tsx` and `wishlists/page.tsx`** (`Lines 84–85`): Mentioned without explaining what fallback/preview UI exists in those pages.

### 15. Severity: Nit
- **Affected Scope:** Section 1 Table (`Line 26`) vs. Fase R1 (`Lines 72, 78`).
- **Discrepancy Description & Rationale:** Line 26 defines `pos_wajib` icon boxes as `amber/biru lembut` (amber/soft blue), whereas Line 72 defines them as `amber/indigo lembut` (amber/soft indigo). Both lines also mention *"sesuai kelompok/status pos"* without defining what "status pos" triggers amber vs. blue/indigo, and Line 78 mentions `mode inline` on `AppCategoryIcon` without defining its styling.

### 16. Severity: Nit
- **Affected Scope:** Section 1 Table (`Line 28`) and Fase R3 (`Lines 131, 135, 137–144`).
- **Discrepancy Description & Rationale:**
  - Lines 137 and 139 cite `*(Screenshot 1)*` and `*(Screenshot 2 & Mode Grafik)*`, neither of which is attached or linked.
  - Lines 28 and 131 refer to *"7 lokasi R3"*, though `AnalyticsDashboard.tsx` (`Line 139`) contains two separate switchers (Year and Chart Mode, making 8 controls across 7 files), and Line 144 omits R8's payment-method `SlidingSegmentedControl` (`Line 291`) when listing cross-phase reuse.
  - Line 141 maintains a rose accent for `Tarik Darurat`, while Line 135 only mentions item `activeClassName` (`text-rose-600`) without clarifying if the floating pill overlay also shifts color.
  - Lines 137–138 describe `optimistic active href` on `onClick` without noting how it resets on browser Back/Forward or failed navigation.

### 17. Severity: Nit
- **Affected Scope:** Fase R4 (`Lines 156, 165–169`).
- **Discrepancy Description & Rationale:** While `AiMonthlyReviewModal` and `QuickTransactionDrawer` are disabled during `isSwitching`, it is unstated whether `CreateMonthDialog` (`+ Buat Bulan Baru`) is also disabled or whether selecting a second month mid-switch is blocked. Line 169 also does not explain how `resolvedMonthId` is matched when the URL omits `?month=`.

### 18. Severity: Nit
- **Affected Scope:** Fase R2 (`Lines 112, 122`).
- **Discrepancy Description & Rationale:** Line 112 lists 24 Indonesian preset labels, whereas Line 77 specifies only 13 concrete Lucide slugs, leaving the exact Lucide icon slugs for the remaining presets unstated. Line 122 also lists `addCustomCategory`, `createWishlist`, and `updateWishlist` without noting if category editing (added in R10) reuses the `.max(50)` icon validation.

### 19. Severity: Nit
- **Affected Scope:** Fase R6 (`Lines 233–237`).
- **Discrepancy Description & Rationale:** Line 234 initializes `lastAutoDescriptionRef` *"Saat Drawer Dibuka"*, without explicitly clarifying whether the drawer remains mounted when closed and must re-sync `lastAutoDescriptionRef` and `description` on `open` state transitions or after form submission.

### 20. Severity: Nit
- **Affected Scope:** Fase R7 (`Line 254, 266`) vs. Section 4 (`Line 447`).
- **Discrepancy Description & Rationale:** Line 266 uses the term `"bulan arsip"` without defining it until Section 4 (`Line 447` clarifies `saat isClosed`), and Line 254 mentions replacing a hardcoded `"7 pos"` subtitle without specifying where it resides.
