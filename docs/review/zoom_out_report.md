# Goldfish Review Report — Stage 5 (Initial Zoom Out Review)

**Target:** `docs/plans/PLANREVISI.md` (`Lines 1..462`)
**Document Standard:** `resources/document_standards/zoom-out-standard.md`

## Reviewer Status

| Reviewer | Status |
| --- | --- |
| `egm-zoom-out` | `completed` |

## Prioritized Findings (Blockers -> Major -> Nits)

### 1. Split-Brain Budget Source of Truth (`user_budget_templates` vs `budget_categories` Case A Inheritance) - Severity: Blocker
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 35, 379, 412-419` (`R10`)
* **Discrepancy Description**: In `src/lib/month-generator.ts` (`Lines 224-276`), Case A already generates each new month by inheriting `previousCategories` from the user's latest month in `budget_categories`, while active-month categories are edited directly on `/dashboard` (`BudgetCategoryList` / `BudgetCategoryCard`). `R10` introduces a second parallel model (`user_budget_templates` + full CRUD inside `/dashboard/settings`), stating both that Settings edits automatically become defaults for future months (`Line 379`) AND that `month-generator.ts` reads `user_budget_templates` for a new user's *first* month (`Line 412`), alongside an optional *"Terapkan ke Bulan Aktif Saat Ini"* button (`Line 418`) and a second active-month category manager inside Settings (`Line 379`), with no foreign key linking `budget_categories` to `user_budget_templates`.
* **Rationale & Recommendation**: This creates two competing sources of truth and an architectural dead-end: either Case A continues inheriting from `previousCategories` (silently ignoring Settings template edits unless manually applied), or new months read `user_budget_templates` (overwriting category changes made directly on `/dashboard`), while *"Terapkan ke Bulan Aktif Saat Ini"* must heuristically match categories by string name (fragile after renames). Collapse to one Single Source of Truth before implementation: either eliminate `user_budget_templates` + duplicate active-month CRUD in `/dashboard/settings` (have onboarding capture `defaultBaseSalary` + initial categories directly for Month 1 and keep `/dashboard` as the sole category editor), or strictly limit Settings templates to onboarding/initial seed and remove the duplicate active-month CRUD and heuristic sync button in Settings.

### 2. Incomplete Root-Problem Fix: Hardcoded Kenzo Personal Dummy Data & Emojis Still Leak on Sibling Routes - Severity: Blocker
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 409-412` (`R10`)
* **Discrepancy Description**: `R10` targets removing hardcoded Kenzo dummy defaults (`5000000`, `Cicilan iPhone`, `Talangan Mama`, etc.) only in `dashboard/page.tsx`, `month-generator.ts`, and `CreateMonthDialog.tsx`. Verified codebase leaks outside `R10`'s scope remain live:
  1. `src/app/(dashboard)/dashboard/analytics/page.tsx` (`Lines 22-182`): renders `fallbackAnalytics` (`selectedYear: 2026`, `"Cicilan iPhone"` `"📱"` `735000`, `"Tabungan Otomatis"` `"💰"` `500000`, `"Talangan Mama"` `"👩‍👦"` `500000`, `"Listrik & Air"` `"⚡"` `450000`, `"Gereja / Persepuluhan"` `"✝️"` `400000`, `"Belanja & Jajan"` `"🍿"` `200000`, `"Bensin & Mobilitas"` `"⛽"` `135000`) whenever `monthlyCashflow.length === 0`.
  2. `src/app/(dashboard)/dashboard/wishlists/page.tsx` (`Lines 27-66`): renders `fallbackWishlists` (`"Kamera Sony A6700 + Lensa Sigma 18-50mm"` `"📷"` `12000000`/`6000000`, `"Standing Desk Ergonomis & Monitor Arm"` `"🖥️"` `4000000`/`3800000`) and `2500000` free savings whenever `items.length === 0`.
  3. `src/app/(dashboard)/dashboard/vault/page.tsx` (`Lines 22-37`): renders `fallbackVault` (`freeSavingsBalance: 2500000`, `emergencyFundBalance: 12600000`, `emergencyFundTarget: 18000000`, `safetyMonths: 4.2`, `monthlyFixedExpense: 3000000`).
  4. `src/app/(dashboard)/dashboard/page.tsx` (`Lines 488-527`): `<DashboardHubCard title="Wishlist Barang Impian">` renders fake `"🎯 Target Tabungan Kamera & Lensa"` (`50% Tercapai`, `6000000`/`12000000`) whenever `!topWishlist` — even for users with active months.
  5. While `register()` in `R10` sets `emergencyFundTarget: 0`, `18000000` (`DEFAULT_EMERGENCY_FUND_TARGET`), `DEFAULT_MONTHLY_FIXED_EXPENSE = 3_000_000`, `"💵 Gaji Pokok"`, and `"🎯"` remain hardcoded across `src/lib/queries/savings.ts`, `src/actions/auth.ts`, `src/actions/months.ts`, `src/actions/savings.ts`, `src/actions/wishlists.ts`, and `src/db/schema.ts`.
* **Rationale & Recommendation**: Leaving fake financial metrics on `/analytics`, `/wishlists`, `/vault`, and the Dashboard wishlist hub card directly fails multi-user zero-dummy production behavior. Treat zero personal dummy fallbacks + honest empty states as a unified sweep across all four routes and shared server defaults.

### 3. `R1` & `R2` Duplicated Scope, Overlapped Cleanup, and Incomplete Schema Bounds - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 68-123` (`R1` and `R2`)
* **Discrepancy Description**: `R1` (`Lines 79, 95`) specifies replacing `<Input maxLength={4} />` in `BudgetCategoryList.tsx` and the form in `WishlistCard.tsx` with a Lucide Icon Picker Grid and updating `category-icons.ts` + `schemas/*`. Immediately afterward, `R2` (`Lines 102-123`) re-specifies building `IconPicker.tsx`, expanding `category-icons.ts` to 24 icons, wiring it into `BudgetCategoryList.tsx` and `WishlistCard.tsx`, and raising schema `icon` `.max(10)` → `.max(50)`. Furthermore: `R1` combines *both* destructive one-off SQL cleanup AND permanent runtime `stripEmojiPrefix`; `R2` (`Line 123`) omits `updateCategorySchema.icon` (`category.schema.ts#L84`) and `updateWishlistSchema.icon` (`wishlist.schema.ts#L61`), which also enforce `.max(10)`; and `src/lib/financial-calculations.ts` (`Lines 364-395`, `calculateWishlistProgress`) embeds milestone emojis missed by `R1`.
* **Rationale & Recommendation**: Building an icon picker in `R1` only to extract/replace it in `R2` creates churn and schema validation failures. Merge `R1` + `R2` (or scope `R1` strictly to icon registry + `AppCategoryIcon` + zero-emoji sweep including `calculateWishlistProgress`, and scope `R2` strictly to `IconPicker` + `.max(50)` across both create and update schemas).

### 4. Re-Implementing Transaction + Liability Sync Instead of Reusing `createTransaction` & `QuickTransactionDrawer` - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 281-335` (`R8`)
* **Discrepancy Description**: `src/actions/transactions.ts` (`createTransaction`, `Lines 55-191`) already validates `budgetCategories` + `months` ownership and `!isClosed`, enforces `isDateWithinMonthCycle`, inserts into `transactions`, and atomically increments `liabilities.paidAmount` / `isSettled` (with `softDeleteTransaction` at `Lines 197-326` reversing on Undo). `QuickTransactionDrawer.tsx` (`Lines 50-61`) already accepts `defaultCategoryId`, `cycleYear`, and `cycleMonthIndex`. `R8` builds a parallel payment dialog inside `LiabilityTrackerCard.tsx` and duplicates transaction/liability sync logic inside `recordInstallmentPayment` (`src/actions/liabilities.ts#L110-L208`). Meanwhile, retaining a `monthId == null` legacy branch bypasses `transactions`; `month-generator.ts` (`Lines 278-290`) auto-inserts `activeLiabilitiesMap` without deducting `uang_bebas_tabungan`; and `IncomeSection.tsx` (`Lines 84-92`) duplicates inline `defaultDate` calculation omitted from `resolveDefaultCycleDate` reuse.
* **Rationale & Recommendation**: Reuse one shared internal transactional helper across `createTransaction` and `recordInstallmentPayment` (or launch `QuickTransactionDrawer` / `createTransaction` when an active linked category exists), extract `resolveDefaultCycleDate` for `IncomeSection.tsx` too, and ensure `month-generator.ts:278-290` preserves zero-based balance.

### 5. Redundant Onboarding State Machine & Speculative Schema Columns (YAGNI) - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 390-416` (`R10`)
* **Discrepancy Description**: `R10` adds `onboardingStatusEnum` (`"pending" | "skipped" | "completed"`), `onboardingStep`, and `initialSetupCompletedAt` to `users`, plus auto-promotion in `/dashboard/settings` and a route guard restricting `"skipped"` users unless `?resume=1` is present (`Line 408`). Meanwhile `src/proxy.ts` (`Lines 55-65`) only checks `pathname.startsWith("/dashboard")` and omits `/onboarding`.
* **Rationale & Recommendation**: Locking users inside `/onboarding` until Step 5 with no incremental step persistence makes `onboardingStep` unused speculative state, while tracking 3 onboarding statuses creates dual-state drift against real user data (`defaultBaseSalary`, categories, months). Simplify to a single nullable timestamp/boolean (`onboardingCompletedAt`) to track post-register completion, derive warning banners from missing real data, allow `/onboarding` anytime when authenticated, and add `/onboarding` to `proxy.ts`.

### 6. Premature `experimental.staleTimes.dynamic = 20` & Redundant Auth/Skeleton Layers - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 337-367` (`R9`)
* **Discrepancy Description**: `R9` enables Next.js `experimental: { staleTimes: { dynamic: 20 } }` in `next.config.ts`, adds `PageSectionSkeleton.tsx` + 4 `loading.tsx` files (including sync `/dashboard/settings`), and maintains three overlapping auth helpers (`getCachedAuthenticatedSession`, `getCurrentUser` in `actions/auth.ts`, `resolveAuthenticatedUserId` in `queries/months.ts:41-64`) even though `DashboardLayout.tsx:17-27` already accepts an optional `user` prop and `DashboardSkeleton.tsx` already exists.
* **Rationale & Recommendation**: The verified bottleneck on tab navigation is duplicate `supabase.auth.getUser()` + `SELECT users` queries per request. Caching dynamic Router Cache responses for 20s prematurely risks stale `?month=` views (`R4`) and stale onboarding/logout states (`R10`). Start by unifying around a single `React.cache` session reader (`src/lib/queries/auth.ts`) + `revalidateDashboardRoutes()`, and defer `experimental.staleTimes` unless post-dedup profiling proves necessary.

### 7. Over-Coupled Two-Layer Month Transition Context & Header/Skeleton Inconsistency - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 152-188` (`R4`)
* **Discrepancy Description**: `R4` injects `MonthNavigationContext` into 4 components across `months/`, `ai/`, and `transactions/` while keeping `src/app/(dashboard)/dashboard/loading.tsx` and wrapping content below the header in `<DashboardSkeleton hideHeader />`. In `src/app/(dashboard)/dashboard/page.tsx` (`Lines 297-360`), the left side of the dashboard header displays the current month's title and `Aktif Berjalan` / `Tutup Buku (Arsip)` badge while the right side renders action triggers.
* **Rationale & Recommendation**: Cross-domain context coupling into `ai/` and `transactions/` is unnecessary to disable two header buttons during transitions, leaving the left header displaying the *old* month's name and badge while `"Memuat <Bulan Tujuan>"` renders on the right, and introducing a two-phase skeleton flash above `<Suspense>`. Keep `AiMonthlyReviewModal` and `QuickTransactionDrawer` decoupled (via prop or container control) and unify header/content loading boundaries cleanly.

### 8. Low-Level `ResizeObserver` `SlidingSegmentedControl` Weeds & ARIA `tablist` Misuse - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 127-151` (`R3`)
* **Discrepancy Description**: `src/components/ui/tabs.tsx` (`Lines 8-89`) already provides Shadcn/Radix `Tabs` and `TabsList` (`variant="default" | "line"` with animated `after:` indicator), yet goes unexamined. `R3` dives into DOM measurement implementation details (`useLayoutEffect`, `ResizeObserver`, `offsetLeft`, `offsetWidth`), forces `role="tablist"`/`"tab"` onto form field inputs without `tabpanel`s (`PAYMENT_METHODS` in `QuickTransactionDrawer.tsx`, `group` in `BudgetCategoryList.tsx`), and adds client `optimisticHref` to `<Link>` navigation bars (`AppHeader` / `MobileBottomNav`).
* **Rationale & Recommendation**: `offsetLeft`/`offsetWidth` measurements inside animated Vaul drawers / Radix dialogs risk stale initial box coordinates during open transitions, `role="tablist"` violates ARIA semantics for form controls, and optimistic route href local state risks desyncing on browser back/aborted transitions. Lift `R3` to component contracts, reuse or extend existing Shadcn `Tabs` primitives where appropriate, and use `radiogroup`/`radio` semantics for form option selectors.

### 9. Premature Implementation Weeds & Multi-Phase File Churn Across `R1–R10` - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 70-430` (`R1–R10`)
* **Discrepancy Description**: Multiple sections (`R3`, `R6`, `R8`) prescribe inline Tailwind utility strings, hook internals, and variable names (`lastAutoDescriptionRef`), while `QuickTransactionDrawer.tsx` is touched across 7 phases (`R1, R3, R4, R5, R6, R7, R8`) and `dashboard/page.tsx` across 6 (`R1, R4, R6, R7, R8, R10`).
* **Rationale & Recommendation**: Specify contracts and invariants rather than inline class strings/internal variables, and sequence shared hot-file updates cleanly to eliminate repeated churn.
