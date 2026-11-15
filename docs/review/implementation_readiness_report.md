# Goldfish Review Report — Stage 9 (Implementation Readiness Test)

**Target:** `docs/plans/PLANREVISI.md` (`DetailedRange: Lines 66..462`)
**Document Standard:** `resources/document_standards/implementation-readiness-standard.md`
**Verdict:** **FAIL — NOT READY FOR IMPLEMENTATION**

## Reviewer Status

| Reviewer | Status |
| --- | --- |
| `egm-implementation-readiness` | `completed` |
| `egm-codebase-details` | `completed` |
| `egm-style` | `completed` |

## Prioritized Findings (Blockers -> Major -> Nits)

### 1. R4 `<Suspense>` Header-Data Deadlock & Non-Existent `floatingMobile` Reference - Severity: Blocker
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`
* **Affected Scope:** `Lines 29, 156–188` (`src/app/(dashboard)/dashboard/page.tsx:59-80, 300-359`)
* **Discrepancy Description**:
  1. `Line 171` moves `getMonthDetailById`, `getLiabilities`, `getSavingsAccount`, and `getWishlists` inside an async child Server Component wrapped in `<Suspense key={selectedMonthId ?? "active"} fallback={<DashboardSkeleton hideHeader />}>` below the header, while `Lines 156 & 163` keep `MonthSelector`, `AiMonthlyReviewModal`, and `QuickTransactionDrawer` visible and `disabled` above `<DashboardSkeleton hideHeader />`. In `dashboard/page.tsx:300-359`, the cycle title/badge, `<AiMonthlyReviewModal />`, and `<QuickTransactionDrawer />` directly depend on `currentMonthDetail`, `salaryBase`, `totalSpent`, and `activeCategories` from `getMonthDetailById`. Moving `getMonthDetailById` below `<Suspense>` makes those props unavailable to the header; conversely keeping `getMonthDetailById` at root stalls SSR navigation and bypasses `<Suspense>`.
  2. `Line 171` omits `getAllMonths(user.id)` and `getActiveMonth(user.id)` invalid-`?month=` fallback (`dashboard/page.tsx:59-80`), and `Lines 29, 156, 166` reference a mobile floating `+ Catat Pengeluaran` trigger (`floatingMobile`), whereas `dashboard/page.tsx:344-359` only renders one inline `<QuickTransactionDrawer />` (`floatingMobile` omitted everywhere in `src/`).
  3. `DashboardMonthShell` lacks exact slot props (`header` vs `children`), and `DashboardSkeleton` `hideHeader` exact excluded DOM elements / optional loading label conflict between `Line 156` and `Line 168`.
* **Rationale & Recommendation**: Pre-determine the exact React tree split in `dashboard/page.tsx` (`getAllMonths` at root for `MonthSelector` + `CreateMonthDialog`, plus either streaming `AiMonthlyReviewModal`/`QuickTransactionDrawer` inside an async shell or keeping previous header props disabled in `DashboardMonthShell` while swapping only the lower body to `<DashboardSkeleton hideHeader />`). Explicitly specify `DashboardMonthShell` and `DashboardSkeleton` TypeScript props and either add or remove the `floatingMobile` FAB claim.

### 2. R10 Split-Brain `user_budget_templates` vs `month-generator.ts` `Kasus A`, Step 4 Liabilities & Missing Sync Identity - Severity: Blocker
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`
* **Affected Scope:** `Lines 378–393, 403–404, 412–418` (`src/lib/month-generator.ts:224-290`, `src/db/schema.ts:158-174`, `src/actions/months.ts:70`, `CreateMonthDialog.tsx:80`)
* **Discrepancy Description**:
  1. `Lines 379 & 416` guarantee `user_budget_templates` edits automatically govern future months, while `Line 412` mentions `user_budget_templates` only for Month 1. `month-generator.ts:224-290` uses `Kasus A (previousCategories.length > 0)` to copy `previousCategories` verbatim, ignoring Settings templates once Month 1 exists.
  2. `budget_categories` lacks a nullable `templateId` FK to `user_budget_templates`. *"Terapkan ke Bulan Aktif Saat Ini"* (`Line 418`) leaves unspecified: (a) how multiple open months (`isClosed === false`) are disambiguated; (b) how renamed/regrouped templates match existing categories (`name` matching causes duplicates); (c) how `"pemasukan gaji pokok"` is matched (`isBaseSalary = true` vs string match) and whether `months.baseSalary` also updates; (d) how zero-tx unmatched categories and `liabilityId` categories behave; and (e) Zero-Based rebalance when target/salary changes drop targets below already-spent totals.
  3. Step 4 optionally inserts `liabilities` (`Line 404`) after Step 3 balances templates against salary (`Line 403`), with no month created (`Line 378`); first-month generation (`Line 412`) omits how Step 4 `liabilities` integrate with `user_budget_templates` (and omits `targetBudget: baseSalary`, `icon`, `sortOrder`, `isTemporary` for the fallback `"Uang Bebas / Tabungan"` row and concrete `50/30/20` presets including when `defaultBaseSalary === null`/`0`).
  4. `CreateMonthDialog` (`useState(4000000)`) and `src/actions/months.ts:70` (`DEFAULT_BASE_SALARY`) lack explicit prop/default replacements (`defaultBaseSalary`, `templateCount`).
* **Rationale & Recommendation**: Resolve Month 2+ generation precedence unambiguously, specify optional `templateId` FK or exact single-SSOT rule, define `incomes.isBaseSalary = true` + open-month sync targeting, document how Step 4 liabilities merge into Month 1, specify exact `50/30/20` + `"Uang Bebas / Tabungan"` fallback structs, and specify `CreateMonthDialogProps`.

### 3. R8 Negative `targetBudget` Math Trap, Missing `liabilities.icon`, & Zero/Multi `Uang Bebas` + Server Guards - Severity: Blocker
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`
* **Affected Scope:** `Lines 290–335` (`src/db/schema.ts:102-115`, `src/actions/liabilities.ts:147-306`, `src/actions/transactions.ts:148-173`, `src/lib/queries/months.ts:250-259`, `src/lib/month-generator.ts:233-290`)
* **Discrepancy Description**:
  1. **Negative `targetBudget` in DB:** `queries/months.ts:250-256` computes `effectiveTarget = cat.targetBudget + additionalIncomesSum`. Deducting `monthlyPayment` from persisted `cat.targetBudget` whenever `effectiveRemaining >= monthlyPayment` can push DB `targetBudget < 0` if `cat.targetBudget < monthlyPayment`. Both `cat.targetBudget >= monthlyPayment` AND `(effectiveTarget - spent) >= monthlyPayment` must be checked explicitly.
  2. **Missing `liabilities.icon` column:** `R8` (`Line 298`, `Line 318`) adds `<IconPicker />` (`categoryIcon`) to `+ Tambah Cicilan`, yet `liabilities` (`schema.ts:102-115`) has no `icon` column—losing selected icons when `addToCurrentMonthBudget === false`, during unlinked payment auto-create (`Line 311`), and in `month-generator.ts` carry-over.
  3. **0 / >=2 `uang_bebas_tabungan` bugs & unlinked `amount !== monthlyPayment`:** Under R10, a month can have `0` or `>1` `uang_bebas_tabungan` categories. `month-generator.ts:233-245` credits `reallocatedFromSettledLiabilities` to *every* `uang_bebas_tabungan` row ($N\times$ inflation) and at `278-290` injects newly active liabilities in `Kasus A` without deducting `Uang Bebas`. `Line 311` omits fallback behavior when `Uang Bebas` is missing/insufficient during payment or when custom `amount !== monthlyPayment`.
  4. **`isTemporary` contradiction, server guards & `!activeMonthId`:** `Line 304` sets `isTemporary: true` at category creation, while `Line 313` says `(+ set isTemporary: true jika lunas)` ambiguously on the `liabilities` update; `recordInstallmentPayment` & `createTransaction` lack `.for("update")` row locking and server guards for `isSettled === true` and `amount > remainingAmount`; legacy `monthId == null` branch (`Line 299`) & `!activeMonthId` UI behavior (`Line 319`) are unspecified; and `Line 315` doesn't state whether `reallocatedFromSettledLiabilities` sums `prevCat.targetBudget` or `liability.monthlyPayment`.
* **Rationale & Recommendation**: Persist or gate `categoryIcon` properly, require both base `targetBudget` and `effectiveRemaining` checks on a deterministic primary `uang_bebas_tabungan` row, enforce `.for("update")` + `isSettled`/overpayment server guards, fix `month-generator.ts` (`Kasus A` rebalance + single `Uang Bebas` credit + exact field summed), clarify `isTemporary: true` per table, and define `!activeMonthId` UI handling.

### 4. R1/R2 Circular Execution Dependency, Unspecified 24 Icon Registry, Breaking `WishlistProgress` Return Type, & Contradictory SQL Cleanup - Severity: Blocker
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-style`
* **Affected Scope:** `Lines 46–47, 73–98, 107–124, 390–394, 423` (`src/lib/financial-calculations.ts:69-78, 349-398`, `src/schemas/category.schema.ts:38-43, 84`, `src/schemas/wishlist.schema.ts:29-34, 61`, `src/db/schema.ts:167, 209`)
* **Discrepancy Description**:
  1. **R1 vs R2 Circular Order:** `R1` (`Lines 79, 95`) installs Lucide Icon Pickers in `BudgetCategoryList.tsx` and `WishlistCard.tsx` and introduces `>10`-char keys (`"heart-handshake"`, `15` chars), while `R2` (sequenced *after* R1) creates `IconPicker.tsx` and raises `.max(10) -> .max(50)` in both schemas. Neither phase defines the exact 24 `(key, label, LucideIcon)` definitions or the concrete legacy emoji -> key fallback map (`"👵"`, `"📷"`, `"🖥️"`, `"💵"`, `"🚀"`, `"🍿"`, `"📦"`), `AppCategoryIcon` prop/class interface, `IconPickerProps` (including `type="button"`, `role="radiogroup"`, unknown-key fallback), or `\p{Extended_Pictographic}` + ZWJ `\u200D` + `\uFE0F` `stripEmojiPrefix` algorithm.
  2. **Breaking `calculateWishlistProgress` API:** `Line 86` changes `milestone` to `{ label, iconKey }` without updating `WishlistProgress` (`financial-calculations.ts:69-78`) or reconciling `WishlistCard.tsx:82-108` (which currently hardcodes its own emoji milestones ignoring `progress.milestoneLabel`).
  3. **R1 vs R10 DB Cleanup Split:** `R1` (`Lines 87, 97`) alters `schema.ts` defaults (`"💰"` -> `"wallet"`, `"🎯"` -> `"target"`) and runs SQL cleanup on 4 tables without a Drizzle migration file/SQL; `R10` (`Line 423`) bundles `"cleanup aman emoji DB (R1)"` into R10's migration without SQL design.
* **Rationale & Recommendation**: Decouple R1 (static `AppCategoryIcon`, non-breaking `WishlistProgress` `milestoneIconKey`, canonical 24-icon registry, ZWJ-safe regex, `.max(50)` or `<=10`-char temp defaults) cleanly from R2 (`IconPicker` component + Zod `.max(50)` on all 4 create/update schemas), and give R1/R10 explicit numbered Drizzle DDL/DML SQL steps.

### 5. R10 Incomplete DB Schema/RLS/Backfill, Missing `/onboarding` Proxy Auth, Unreconciled Onboarding State Machine, & Hardcoded Kenzo Fallbacks on Sibling Routes - Severity: Blocker
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`
* **Affected Scope:** `Lines 378–429, 450` (`src/db/schema.ts:93`, `src/db/migrations/meta/_journal.json`, `src/proxy.ts:55-65`, `src/actions/auth.ts:34-38, 117-122, 192-226, 270-290`, `src/actions/months.ts:134`, `src/actions/savings.ts:95, 323`, `src/lib/queries/savings.ts:17, 47`, `dashboard/analytics/page.tsx:22-182`, `dashboard/wishlists/page.tsx:27-66`, `dashboard/vault/page.tsx:22-37`, `dashboard/page.tsx:242-263, 498-520`)
* **Discrepancy Description**:
  1. **Schema, Backfill & RLS Omissions:** Missing full Drizzle DDL column definitions/indexes, explicit ordered SQL migration (DDL -> `UPDATE "users" SET "onboarding_status" = 'completed'` in the same migration so existing users don't get trapped), and RLS `SELECT/INSERT/UPDATE/DELETE` policies for `user_budget_templates` per `database-access.md:29-33`.
  2. **Backfill vs Empty Warning Card Conflict & `?resume=1`:** `Line 394` sets existing users to `'completed'` with `defaultBaseSalary: null` and `0` templates, while `Line 411` triggers the Incomplete Data Warning card when `(gaji pokok / template pos masih kosong)`—hitting existing users immediately on deploy. Incremental step persistence (`onboardingStep`), exact `?resume=1` access rule (`Line 408` vs `Line 411`), and symmetric `"skipped" -> "completed"` promotion in `Line 416` are also unspecified.
  3. **Unprotected `/onboarding` & Broken Session Type:** `src/proxy.ts:56-65` only matches `/dashboard*` (leaving `/onboarding` unprotected against unauthenticated users). `UserSessionData` and `login()` / `getCurrentUser()` (`auth.ts`) lack `onboardingStatus` needed by `LoginPage` (`Line 398`).
  4. **Leaked Personal Kenzo Dummy Data & `18_000_000` Fallbacks:** R10 fails to strip `fallbackAnalytics` (`/analytics`), `fallbackWishlists` (`/wishlists`), `fallbackVault` (`/vault` + `dashboard/page.tsx`), `!topWishlist` (`"Target Tabungan Kamera & Lensa"`), `DEFAULT_MONTHLY_FIXED_EXPENSE = 3_000_000` (`queries/savings.ts:17`), and hardcoded `18_000_000` initializers across `schema.ts:93`, `auth.ts:197`, `months.ts:134`, `savings.ts:95, 323`, `wishlists.ts:306`, and `queries/savings.ts:47` (plus `.positive()` conflict on `updateEmergencyTargetSchema` for `0`).
* **Rationale & Recommendation**: Define exact schema/SQL/RLS migration order, fix the warning-card predicate so legacy completed users aren't falsely flagged (or backfill defaults), protect `/onboarding` in `src/proxy.ts`, expand `UserSessionData`, clear all Kenzo/demo fallbacks across `/analytics`, `/wishlists`, `/vault`, `/dashboard`, and `savings`, and specify explicit `50/30/20` + onboarding Action/Schema contracts.

### 6. R10 Settings Scope Gaps (`Delete Account`, File List) & `deleteCategory` Cascade / Liability / Last-Pos / Undo Hazards - Severity: Blocker
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-style`
* **Affected Scope:** `Lines 414–420, 451` (`src/actions/categories.ts`, `src/actions/transactions.ts:148-173, 267-295`, `src/actions/months.ts:260`, `src/actions/export.ts:12, 77-160`, `src/db/schema.ts:185`)
* **Discrepancy Description**:
  1. Settings mutations (`src/actions/settings.ts` vs `onboarding.ts`), queries (`src/lib/queries/`), Zod schemas, and `src/components/features/settings/*` file paths are unenumerated, and `user_budget_templates` is omitted from `exportFinancialData` JSON backup (`src/actions/export.ts`).
  2. `deleteCategory` (`Line 419`) omits protecting: (a) the **last `uang_bebas_tabungan` category** in an open month (`closeMonth` `months.ts:260`, Dynamic Freedom Buffer, and R8 break); (b) categories with **`liabilityId !== null`** (or reassigning transactions into/out of them, which corrupts `liabilities.paidAmount` during `softDeleteTransaction`/`restoreTransaction`); (c) **target budget conservation** under Zero-Based Budgeting; and (d) expired **`isDeleted = true`** soft-deleted rows blocking deletion of visually empty categories (`activeTxCount === 0` vs active Undo window).
* **Rationale & Recommendation**: Enumerate all Settings actions/queries/schemas/components explicitly (`AGENTS.md` §5 compliant), include `user_budget_templates` in JSON export, and enforce in `deleteCategory`: reject `isClosed`, last category, last `uang_bebas_tabungan`, and `liabilityId !== null` categories/targets; handle expired `isDeleted = true` cleanup vs active Undo safety; and specify `targetBudget` conservation on reassignment.

### 7. Contradictory Batch Execution Mode (`Mode EXECUTING`) vs `AGENTS.md` §2 Per-Phase Gate - Severity: Blocker
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** `Lines 205, 439–440` (`AGENTS.md` §2)
* **Discrepancy Description**: `Line 205` states edits across R1/R3/R5 on `QuickTransactionDrawer.tsx` are *"dieksekusi terpadu saat Mode EXECUTING"*, `Line 439` organizes a full batch, and `Line 440` defers `bun test` / `tsc --noEmit` until *"setelah seluruh batch selesai"*. `AGENTS.md` §2 strictly specifies *"Kerjakan hanya 1 fase yang diminta eksplisit per iterasi"* with per-phase `IMPLEMENTED — AWAITING APPROVAL` gates, while `"Mode EXECUTING"` is undefined in `Lines 66–462`.
* **Rationale & Recommendation**: Remove ambiguous execution gating and align batch vs per-phase verification steps explicitly with Kenzo's approved batch mode and `AGENTS.md` §2 checkpoints so neither verification nor approval is skipped.

---

### 8. R4 `useTransition` Auto-Reset Disconnect Across Context Triggers & Pre-Existing Data Reset - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-style`
* **Affected Scope:** `Lines 164–169, 184` (`MonthSelector.tsx`, `CreateMonthDialog.tsx`)
* **Discrepancy Description**: `Line 165` places `startTransition(() => router.push(...))` locally inside `MonthSelector.tsx`, `Line 167` calls `startMonthSwitch` in `CreateMonthDialog.tsx` without `startTransition`, yet `Line 169` expects `MonthNavigationContext` Provider to auto-reset when `useTransition` completes without URL change. A React Provider cannot observe a child component's local `isPending` unless `useTransition` lives inside the Provider itself.
* **Rationale & Recommendation**: Move `useTransition` inside `MonthNavigationContext` (wrapping navigation callbacks inside `startMonthSwitch(id, name, navigateFn)`) and define the exact `isPending` `true -> false` edge reset + `MonthNavigationContextValue` signature.

### 9. R6 `QuickTransactionDrawer` Optimistic-Close Error-Reset Bug, `QuickCategoryOption.group`, & Tailwind Padding Duplicate - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** `Lines 225–242` (`QuickTransactionDrawer.tsx:123-161`, `src/components/ui/drawer.tsx:87`, `dashboard/page.tsx:354`)
* **Discrepancy Description**:
  1. `QuickTransactionDrawer.tsx:144,152` optimistically sets `open = false` and reopens `setOpen(true)` + `form.setError` on failure; `useEffect` (`lines 123–133`) then fires on `open === true`, resetting the form and erasing both server validation errors and `lastAutoDescriptionRef` / user descriptions.
  2. `QuickCategoryOption` in `QuickTransactionDrawer.tsx` lacks `group?: CategoryGroup`, and `dashboard/page.tsx:354` omits `group`. `DrawerFooter` (`Line 226`) uses `py-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]`, generating conflicting bottom-padding utilities in Tailwind v4, and Vaul drawer SSR testing strategy (`defaultOpen?: boolean` or helper extraction) is unstated.
* **Rationale & Recommendation**: Fix the reopen reset bug using `shouldSkipNextOpenResetRef` (or closed→open transition guard), pass `group` on `QuickCategoryOption`, replace `py-3 pb-[...]` with `pt-3 pb-[...]` + `shrink-0`, and define `form.setValue` flags + SSR test approach.

### 10. R2 `update*` Zod Schemas, `wishlists.ts:70` Fallback, & Incomplete R1 Component/Test Inventory - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** `Lines 77–98, 112–123` (`src/schemas/category.schema.ts:84`, `src/schemas/wishlist.schema.ts:61`, `src/actions/wishlists.ts:70`, `frontend-phases-f7-f18.test.tsx`, `backend-phases-b7-b13.test.ts`, `schemas.test.ts`)
* **Discrepancy Description**:
  1. `R2` omits updating `updateCategorySchema.icon` (`category.schema.ts:84`) and `updateWishlistSchema.icon` (`wishlist.schema.ts:61`), which both enforce `.max(10)`, as well as `src/actions/wishlists.ts:70` (`|| "🎯"`).
  2. `R1` uses globs (`dll.`, `src/components/**/*.tsx`) and restricts the Zero-Emoji Sweep Guard regex test to `.tsx` UI files, leaving `src/actions/**`, `src/lib/**` (`gemini.ts`, `financial-calculations.ts`), and `src/schemas/**` unguarded and failing to specify the Unicode regex (vs allowed symbols `→`, `—`, `Rp`, `✕`/`✓`/`➔`). Note also `BudgetCategoryList.tsx:118-120` currently fails to reset `icon` & `group` after submit, and `WishlistCard` Add modal is actually `WishlistGrid` inside `WishlistCard.tsx:285-336`.
* **Rationale & Recommendation**: Upgrade `.max(50)` across all 4 create/update Zod schemas, replace `"|| '🎯'"` in `wishlists.ts:70`, enumerate exact affected files including `BudgetCategoryList` reset and `WishlistGrid`, define the Zero-Emoji Sweep Guard file path and Unicode regex (`\p{Extended_Pictographic}`) spanning `src/actions/**` & `src/lib/**`, and specify exact updates to existing failing tests.

### 11. R3 `SlidingSegmentedControl` ARIA Misuse, Portal Measurement Traps, `MobileBottomNav` Geometry, & `AnalyticsDashboard` Years - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`
* **Affected Scope:** `Lines 130–150` (`MobileBottomNav.tsx:71-80`, `AnalyticsDashboard.tsx:47, 304`, `useSlidingIndicator`)
* **Discrepancy Description**:
  1. Hardcodes `role="tablist"`/`"tab"` for form selectors (*Kebutuhan vs Pos Wajib*, *QRIS | Tunai | Debit | Transfer*) that have no `tabpanel`s; omits `type="button"` inside modals/drawers (`Locations 4–7`); omits TypeScript contracts for `useSlidingIndicator` & `SlidingSegmentedControl`; and omits SSR `!hasMeasured` fallback styling plus `ResizeObserver`/portal re-measurement when Vaul drawers or `md:`/`hidden md:flex` containers open or resize.
  2. `MobileBottomNav` active pill vs top bar (`h-0.5`?) dimensions and `optimisticHref` reset (`usePathname()` reconciliation) are unstated, and `AnalyticsDashboard.tsx:304` uses hardcoded `[2026, 2027] as const` rather than `data.availableYears`.
* **Rationale & Recommendation**: Support configurable `role="radiogroup" | "tablist"`, enforce `type="button"`, document exact TypeScript signatures + `!hasMeasured` SSR CSS fallback + `ResizeObserver` portal re-measurement, specify `MobileBottomNav` bar/pill styling and `usePathname()` reset, and bind `AnalyticsDashboard` year tabs to `data.availableYears`.

### 12. R7 Lost `latestMonth` Prop on Decoupled `<CreateMonthDialog />`, Missing Checklist Item, Breakpoint Drift, & 5 Other `"7 Pos"` Copies - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`
* **Affected Scope:** `Lines 254, 263–279` (`MonthSelector.tsx:79, 191`, `AppHeader.tsx:207`, `BudgetCategoryList.tsx:130`, `IncomeSection.tsx:180, 216`, `AiMonthlyReviewModal.tsx:209`, `CreateMonthDialog.tsx:158`, `gemini.ts:155`)
* **Discrepancy Description**:
  1. Decoupling `[CreateMonthDialog]` out of `MonthSelector` in `dashboard/page.tsx` (`Line 264`) omits forwarding `latestMonth={monthsList[0] ?? null}` (which `MonthSelector.tsx:79,191` currently computes), breaking auto-suggested next month names.
  2. Dynamic category-count header subtitle (`Line 254`) is missing from `Checklist Eksekusi` (`Lines 276–279`, mislabeled `"kuota pos"` at `Line 273`), leaves zero-month state undefined, ignores 5 remaining `"7 pos"` hardcodes (`AppHeader`, `BudgetCategoryList`, `IncomeSection`, `AiMonthlyReviewModal`, `gemini.ts`), uses `md:h-9` (`Line 268`) vs `lg:flex-col` (`Line 263`), and leaves `"rapikan root JSX"` (`Line 270`) underspecified (`Fragment` vs wrapper `div` classes).
* **Rationale & Recommendation**: Forward `latestMonth={monthsList[0] ?? null}` to `<CreateMonthDialog />`, add the dynamic subtitle task (including `0`-month copy & all 5 other `"7 pos"` strings) to `Lines 276–279`, align `h-9` breakpoints across all 4 buttons, and specify exact `MonthSelector` wrapperless JSX.

### 13. R9 Symbol Drift, Missing `explicitUserId` Bypass, Logout Cache Leak, `/dashboard/settings`, & R4 Compatibility Criteria - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`
* **Affected Scope:** `Lines 341–367, 449` (`src/lib/queries/months.ts`, `src/actions/auth.ts`, `next.config.ts`)
* **Discrepancy Description**:
  1. Naming conflict: `revalidateAllDashboardPaths` (`Line 348`) vs `revalidateDashboardRoutes` (`Lines 350, 355, 364, 367`); route shorthand inconsistencies (`/vault` vs `/dashboard/vault`); omits `settings/page.tsx` in `Line 347` and `/dashboard/settings` / `auth.ts` (`logout()`) / `onboarding.ts` in cache invalidation (`staleTimes.dynamic = 20` risks serving stale account data after login/logout or onboarding!).
  2. `resolveAuthenticatedUserId(explicitUserId)` must short-circuit `if (explicitUserId) return explicitUserId;` **before** invoking cookie-bound `React.cache` (`cookies()` throws in `bun test`), and `bun test` cannot verify `React.cache` cross-call dedup outside an RSC/SSR cache scope without an explicit test harness spec.
  3. Exact `PageSectionSkeletonProps`, exact 4 `loading.tsx` paths, `next/cache` unit-test mock setup, and measurable `?month=` cached-back-navigation acceptance behavior alongside R4 (`Line 365`) are omitted.
* **Rationale & Recommendation**: Unify on `revalidateDashboardRoutes()`, `/dashboard/*` paths, `settings/page.tsx`, and auth/onboarding invalidation (`revalidateDashboardRoutes()` + client `router.refresh()`), short-circuit `explicitUserId` prior to `React.cache`, define `PageSectionSkeletonProps` + `bun test` dedup verification harness, and specify R4+R9 cached `?month=` behavior.

### 14. Target Scope Lacks Explicit `[Create|Modify|Delete]` Inventory (Especially R3 & R10) and Test-Migration Mapping - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-style`
* **Affected Scope:** `Lines 75–91, 136–144, 371–430, 455–462` (`AGENTS.md` §5)
* **Discrepancy Description**: R3 and R10 omit dedicated `File Terdampak` inventories, R1/R9 use wildcard globs (`dll.`, `src/app/**/page.tsx`), `R10` omits `src/lib/queries/*` separation required by `AGENTS.md` §5, and cross-phase regressions in existing tests (`financial-calculations.test.ts`, `schemas.test.ts`, `months.test.ts`, `backend-phases-b7-b13.test.ts`, `frontend-phases-f7-f18.test.tsx`) are not mapped per phase. Also, `Tailwind v4 Canonical Audit` / `Total non-canonical: 0` (`Line 460`) lacks an executable CLI/script command, and Global DoD omits concrete zero-dummy grep patterns and `R1–R10` vs `R1..Rn`.
* **Rationale & Recommendation**: Standardize exact `[Create|Modify|Delete]` repository-relative file paths across every phase R1–R10 (no globs except generated `src/db/migrations/*`), map affected tests per phase, and document exact executable verification commands/patterns for Tailwind v4 Canonical Audit & zero-dummy checks.

### 15. R8 WIB Date Timezone Bug in `QuickTransactionDrawer`, `freeBudgetRemaining` Formula, & `IncomeSection` DRY Miss - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** `Lines 293, 296, 317` (`QuickTransactionDrawer.tsx:72-85`, `IncomeSection.tsx:84-92`)
* **Discrepancy Description**: `QuickTransactionDrawer.tsx:72-85` uses `now.toISOString().slice(0, 10)` (UTC date, off by 1 day during `00:00–06:59 WIB`), `IncomeSection.tsx:84-92` duplicates the exact cycle-date builder and isn't migrated to `resolveDefaultCycleDate`, and `freeBudgetRemaining` passed from `dashboard/page.tsx` (`Line 317`) lacks an exact calculation formula.
* **Rationale & Recommendation**: Specify `Asia/Jakarta` local date resolution in `resolveDefaultCycleDate`, include `IncomeSection.tsx` in its consumers, and specify `freeBudgetRemaining` explicitly in `dashboard/page.tsx`.

---

### 16. R5 `Semua Sisa` Number Formatting & Coincidental Tie-Break - Severity: Nit
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-style`
* **Affected Scope:** `Lines 197, 203`
* **Discrepancy Description**: `"Semua Sisa (65.000)"` omits `"Rp"`, leaving exact `formatRupiah(..., { prefix: false })` usage, negative-sisa labeling (`remaining < 0` -> `"Sisa Pos Habis"`), and active-border precedence when `remaining` equals a preset (`50000`/`100000`) implicit.
* **Rationale & Recommendation**: State `formatRupiah(maxRemaining, { prefix: false })` explicitly and clarify independent active-highlight matching (`Number(watchedAmount) === maxRemaining`).

### 17. Minor R1, R6, & R10 Wording, Color Token, and Test-Fixture Precision Nits - Severity: Nit
* **Reviewer Lens:** `egm-codebase-details`, `egm-style`
* **Affected Scope:** `Lines 72, 74, 78, 114–115, 139, 226, 234, 237, 450`
* **Discrepancy Description**: `pos_wajib` tone (`amber` vs `indigo`) and `AppCategoryIcon` `inline` mode sizes are unspecified (`Lines 72, 78`); `DrawerHeader` inside-vs-outside `<form>` and exact behavior when clearing `"Keterangan Singkat"` manually (`Line 226, 237`) can be tightened; Line 450 `"di-backfill completed sebelum default 'pending' berlaku"` misstates DDL->DML SQL order; `WishlistGrid` inside `WishlistCard.tsx` (`Line 115`) and `BudgetCategoryList.tsx` `icon`/`group` reset (`Line 114`) should be explicit.
* **Rationale & Recommendation**: Lock single hue/dimensions for `AppCategoryIcon`, note `<DrawerHeader>` placement & reset edge cases, align SQL migration wording on Line 450, and cite `WishlistGrid` explicitly.
