# Goldfish Review Report — Stage 7 (Critic Review)

**Target:** `docs/plans/PLANREVISI.md` (`FeatureRange: Lines 1..462`)
**Document Standard:** `resources/document_standards/feature-spec-standard.md`
**Verdict:** **CHANGES REQUESTED**

## Reviewer Status

| Reviewer | Status |
| --- | --- |
| `egm-design` | `completed` |
| `egm-structural` | `completed` |
| `egm-style` | `completed` |

## Prioritized Findings (Blockers -> Major -> Nits)

### 1. Missing Evaluation of Alternatives, Batch Problem Statement, and Explicit Non-Goals - Severity: Blocker
* **Reviewer Lens:** `egm-structural`, `egm-design`
* **Affected Scope:** `Lines 1–65, 66–462` (Section 0, Section 1, & Section 3)
* **Discrepancy Description**: `feature-spec-standard.md` (`Lines 13–21, 33–39`) requires an explicit **Problem Statement**, **Goals & Non-Goals**, and **Alternatives Considered** proving other viable designs were evaluated and rejected for concrete reasons. `PLANREVISI.md` states only the meta-workflow goal on `Line 4`, omits **Non-Goals** completely, and presents single-path architectures across `R1`, `R3`, `R4`, `R8` (mentions *"Opsi A"* without documenting rejected `Opsi B/C`), `R9` (`staleTimes: 20` vs `revalidateTag`/profiling-only), and `R10` (`user_budget_templates` table vs JSONB / direct Category inheritance).
* **Rationale & Recommendation**: Single-path specifications fail `feature-spec-standard.md` and leave implementers unable to evaluate why simpler or alternative mechanisms were rejected. Add **Problem Statement**, **Non-Goals**, and explicit **Alternatives Considered** entries documenting rejected choices and trade-offs for `R1, R3, R4, R8, R9, R10`.

---

### 2. R4 `<Suspense>` Boundary Conflicts with `dashboard/page.tsx` Header Data Dependencies - Severity: Blocker
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** `Lines 152–189, 254` (`dashboard/page.tsx#L50-L80, L297-L361`)
* **Discrepancy Description**: `R4` keeps the dashboard header visible above `<DashboardSkeleton hideHeader />` (`Line 156`) while moving `getMonthDetailById`, `getLiabilities`, `getSavingsAccount`, and `getWishlists` inside an async child Server Component wrapped in `<Suspense key={selectedMonthId ?? "active"} fallback={<DashboardSkeleton hideHeader />}>` (`Line 171`). However, `dashboard/page.tsx` (`Lines 299–360`) depends directly on `currentMonthDetail` from `getMonthDetailById` in the header to render the cycle title/badge (`Lines 301–318`), dynamic `activeCategories.length` subtitle (`R7 Line 254`), `<AiMonthlyReviewModal ... />` (`Lines 336–343`), and `<QuickTransactionDrawer ... />` (`Lines 344–359`).
* **Rationale & Recommendation**: Deferring `getMonthDetailById` inside `<Suspense>` makes header props unavailable outside `<Suspense>`; conversely, awaiting `getMonthDetailById` at root `DashboardPage` stalls RSC navigation so `<Suspense>` fallback below the header never triggers on cold/Back/Forward navigations. Keep root `DashboardPage` awaiting only `getCachedAuthenticatedSession()` and `getAllMonths(user.id)` (rendering `MonthSelector` + `CreateMonthDialog`), and either move cycle-dependent header strip (`AiMonthlyReviewModal`, `QuickTransactionDrawer`, cycle title/status) inside the `<Suspense>` boundary or provide explicit disabled/skeleton header buttons inside `DashboardSkeleton`.

---

### 3. R8 Debt Repayment & Transaction Sync Lack Row Locks, Overpayment Guards, & `Uang Bebas` Quota Safety - Severity: Blocker
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** `Lines 281–335, 448` (`actions/liabilities.ts#L147-L306`, `actions/transactions.ts#L148-L173`, `lib/month-generator.ts#L225-L291`, `lib/queries/months.ts#L250-L256`)
* **Discrepancy Description**:
  1. **No server row lock or overpayment/settled guard:** Existing `recordInstallmentPayment` and `createTransaction` read `liabilities` without `.for("update")` and do not reject `existing.isSettled === true` or `amount > existing.totalAmount - existing.paidAmount` (`R8` places this check only on the UI dialog at `Line 290`).
  2. **Blocked payments when `Uang Bebas` quota is exhausted (`Line 311`):** Auto-creating a linked category on `Bayar Rp ...` fails/blocks if `uang_bebas_tabungan` has insufficient remaining budget or was removed, and leaves behavior undefined when `monthsList.length === 0` (`activeMonthId == null` after R10 onboarding).
  3. **Negative DB `targetBudget` risk (`Line 303`):** Because `Dynamic Freedom Buffer` adds `additionalIncomesSum` only in memory (`queries/months.ts#L254-L256`), subtracting `monthlyPayment` from persisted `target_budget` when additional income funded higher spending pushes stored `target_budget < 0`, violating `financial-domain.md#L17` and breaking `Kasus A` inheritance.
  4. **`updateLiability` & `month-generator.ts` Zero-Based desync:** `updateLiability` (`liabilities.ts#L214-L306`) neither rebalances `monthlyPayment` changes in active-month `budget_categories` nor checks `nextTotal < paidAmount`; `month-generator.ts` (`Lines 278–290`) injects newly active liabilities in `Kasus A` without deducting `uang_bebas_tabungan` and ignores updated `baseSalary` in `Kasus A`.
* **Rationale & Recommendation**: Add `.for("update")` row locking on `liabilities` and `uang_bebas_tabungan` inside `db.transaction`, reject `isSettled` and `amount > remainingAmount` server-side (`recordInstallmentPayment` & `createTransaction`), require **both** `freeCat.targetBudget >= monthlyPayment` AND `effectiveRemaining >= monthlyPayment` before deducting `targetBudget`, specify fallback when `Uang Bebas` is `0` or no open month exists, and enforce Zero-Based rebalance in `updateLiability` and `month-generator.ts` `Kasus A`.

---

### 4. R10 `deleteCategory` Reassignment Corrupts `liabilities.paidAmount`, `Dynamic Freedom Buffer`, & `closeMonth` Sweep - Severity: Blocker
* **Reviewer Lens:** `egm-design`, `egm-style`
* **Affected Scope:** `Lines 379, 417–420, 451` (`db/schema.ts#L158-L195`, `actions/transactions.ts#L224-L430`, `lib/queries/months.ts#L253-L256`, `actions/months.ts#L259-L265`)
* **Discrepancy Description**:
  1. **Liability Undo/Restore corruption:** `transactions` has no `liabilityId` column; `softDeleteTransaction` and `restoreTransaction` reconcile `liabilities.paidAmount` strictly via `budgetCategories.liabilityId`. Deleting a `liabilityId`-linked category or reassigning transactions across `liabilityId` vs regular categories corrupts `liabilities.paidAmount`.
  2. **`uang_bebas_tabungan` deletion & $N\times$ `Dynamic Freedom Buffer` bug:** Deleting the last `uang_bebas_tabungan` category breaks `Dynamic Freedom Buffer` (`queries/months.ts#L254-L256`), `R8` rebalancing, and `closeMonth` sweep (`actions/months.ts#L260-L265`). Conversely, allowing users in Onboarding/Settings (`Lines 393, 403, 416`) to create multiple `uang_bebas_tabungan` categories causes `queries/months.ts` to add `additionalIncomesSum` to *every* `uang_bebas_tabungan` row ($N\times$ budget inflation) while `closeMonth` sweeps only `.find(...)`.
  3. **Missing constraints & budget conservation:** Reassigning transactions omits `targetCategory.monthId === sourceCategory.monthId`, `targetCategoryId !== categoryId`, Undo-toast interaction vs `totalTxCount` soft-deleted rows, and what happens to deleted `targetBudget` in Zero-Based Balance sums.
* **Rationale & Recommendation**: Reject `deleteCategory` when `liabilityId !== null` or when deleting the last `uang_bebas_tabungan` category, block reassigning into a `liabilityId !== null` target, enforce same-month non-self `db.transaction` ownership checks, explicitly reallocate/conserve `targetBudget`, and restrict `Dynamic Freedom Buffer` to a single primary `uang_bebas_tabungan` bucket (or fix `queries/months.ts` and `closeMonth`).

---

### 5. R10 Auth/Onboarding Guards, Missing RLS/Constraints, Migration Order, & Active-Month Template Sync Collisions - Severity: Blocker
* **Reviewer Lens:** `egm-design`, `egm-structural`, `egm-style`
* **Affected Scope:** `Lines 38, 371–429, 450` (`src/proxy.ts#L55-L75`, `src/actions/auth.ts#L34-L227`, `src/actions/incomes.ts#L332-L361`, `src/db/schema.ts#L93-L132`, `src/db/migrations/0000_steep_cammi.sql`)
* **Discrepancy Description**:
  1. **`/onboarding` unprotected at proxy layer:** `src/proxy.ts#L58` only protects `pathname.startsWith("/dashboard")`, leaving `/onboarding` open to unauthenticated requests.
  2. **Session projection & persistent `18.000.000` leaks:** `UserSessionData` and `login()` (`auth.ts#L34-L225`) lack `onboardingStatus`; `register()` (`PLANREVISI:396`) resets `emergencyFundTarget: 0`, yet `schema.ts#L93`, `auth.ts#L197`, `actions/months.ts#L134`, `actions/savings.ts#L95, L323`, and `queries/savings.ts#L47` still seed `18000000`.
  3. **Missing RLS policies, unique index, & migration SQL ordering:** `0000_steep_cammi.sql` and `R10` define no Supabase RLS policies for `user_budget_templates` (and user tables) and no unique `(user_id, year, month_index)` constraint on `months`; adding `onboarding_status DEFAULT 'pending' NOT NULL` marks all existing users `pending` unless `UPDATE "users" SET "onboarding_status" = 'completed', ...` runs inside the **exact same** SQL migration before traffic.
  4. **Underspecified `?resume=1` & *"Terapkan ke Bulan Aktif Saat Ini"*:** `Lines 408 & 411` decouple `"Lengkapi Sekarang"` from `/onboarding?resume=1` without defining direct `/onboarding` visits for `"skipped"` users; `budget_categories` lacks a nullable `templateId` FK so renamed/regrouped templates duplicate rows on sync; multi-open-month targeting (`year DESC, monthIndex DESC`) is omitted; and `deleteIncome` (`incomes.ts#L332-L361`) lacks a guard against deleting `isBaseSalary: true` rows.
* **Rationale & Recommendation**: Add `/onboarding` to `src/proxy.ts`; include `onboardingStatus` in `UserSessionData` & `login()`; unify `emergencyFundTarget = 0` everywhere; add nullable `templateId` FK + deterministic active-month lookup + `isBaseSalary` delete guard; bind the `"skipped"` onboarding guard to `?resume=1`; and audit RLS + `(user_id, year, month_index)` unique index + atomic `UPDATE` backfill inside one Drizzle SQL migration.

---

### 6. R10 Leaves Personal Kenzo Fallbacks & R7 Misses Unlisted `"7 pos"` / `availableYears` Hardcodes - Severity: Major
* **Reviewer Lens:** `egm-design`, `egm-style`
* **Affected Scope:** `Lines 254, 273, 276–279, 409–412, 427` (`dashboard/page.tsx#L265-L292, L495-L545`, `vault/page.tsx#L22-L37`, `wishlists/page.tsx#L27-L67`, `analytics/page.tsx#L22-L182`, `queries/savings.ts#L17`, `BudgetCategoryList.tsx#L130`, `IncomeSection.tsx#L180, L216`, `AiMonthlyReviewModal.tsx#L209`, `AppHeader.tsx#L207`, `CreateMonthDialog.tsx#L158`, `AnalyticsDashboard.tsx#L47, L304`, `gemini.ts#L155`)
* **Discrepancy Description**:
  1. `R10` (`Line 410`) removes `defaultBudgetCategories`/`fallbackLiabilities` only from `dashboard/page.tsx` top stats, `month-generator.ts`, and `CreateMonthDialog.tsx`, leaving personal Kenzo dummy fallbacks and emojis active in `dashboard/page.tsx` (`fallbackVault`, `"🎯 Target Tabungan Kamera & Lensa"` hub card), `vault/page.tsx`, `wishlists/page.tsx` (`fallbackWishlists`), `analytics/page.tsx` (`fallbackAnalytics`), and `queries/savings.ts` (`DEFAULT_MONTHLY_FIXED_EXPENSE = 3_000_000`).
  2. `R7` (`Line 254`, `Line 273`) targets `"7 pos"` only in the dashboard header subtitle (still missing from `R7 Checklist Eksekusi`), omitting 6 other hardcoded `"7 pos"` strings across `BudgetCategoryList`, `IncomeSection`, `AiMonthlyReviewModal`, `AppHeader`, `CreateMonthDialog`, and `gemini.ts`, as well as hardcoded years `[2026, 2027]` in `AnalyticsDashboard.tsx`.
* **Rationale & Recommendation**: Remove all `fallback*` demo objects across all 4 routes and `queries/savings.ts` to uphold `financial-domain.md#L74` (fail-closed zero/empty UI), fix every remaining `"7 pos"` label + `R7` dynamic subtitle checklist item (including `monthsList.length === 0` subtitle state), and source `AnalyticsDashboard` year switcher options from `data.availableYears`.

---

### 7. R9 `staleTimes.dynamic = 20` Leaks Client Cache on Logout/Onboarding & Misses Full-Table `export.ts` Scan - Severity: Major
* **Reviewer Lens:** `egm-design`, `egm-style`
* **Affected Scope:** `Lines 34, 337–368, 449` (`actions/auth.ts#L232-L291`, `actions/export.ts#L126-L131`, `lib/queries/analytics.ts#L129-L137`)
* **Discrepancy Description**:
  1. `Line 348` calls the invalidation helper `revalidateAllDashboardPaths` while `Lines 34, 350, 355, 364, 367` call it `revalidateDashboardRoutes`; `Line 347` omits `settings/page.tsx`; and route paths alternate between `/vault` vs `/dashboard/vault`.
  2. `R9` updates 7 action files but excludes `logout()` (`auth.ts#L232-L247`) and `onboarding.ts` (`R10`), risking 20-second stale Client Router Cache across logout/login or post-onboarding redirects; `getCurrentUser()` (`"use server"`) and `getCachedAuthenticatedSession()` also split projection unless `onboardingStatus` + `defaultBaseSalary` are included.
  3. `src/actions/export.ts#L128` fetches **every row** of `budgetCategories` across all users (`db.select().from(budgetCategories)`) before filtering in JS; `analytics.ts#L129-L137` fetches unbounded user transactions across all years.
* **Rationale & Recommendation**: Standardize on `revalidateDashboardRoutes()` and `/dashboard/*` naming, include `settings/page.tsx`, invalidate router/layout cache on `logout()` & `onboarding.ts`, scope `export.ts` with `inArray(budgetCategories.monthId, [...monthIds])`, and unify cached session fields.

---

### 8. R6 Optimistic Close Effect Wipes Failed Submits & DrawerFooter Blur/Sticky Conflict - Severity: Major
* **Reviewer Lens:** `egm-design`, `egm-style`
* **Affected Scope:** `Lines 72, 113, 134, 215–248, 446` (`QuickTransactionDrawer.tsx#L123-L167`, `docs/DESIGN-SYSTEM.md#L46, L73, L75, L110, L115`)
* **Discrepancy Description**:
  1. In `QuickTransactionDrawer.tsx` (`Lines 123–167`), `onSubmit` optimistically sets `open = false` and reopens on error (`setOpen(true)` + `form.setError`), triggering `useEffect([open, validCategories, ...])` to wipe errors, inputs, and `lastAutoDescriptionRef`.
  2. `Line 226` puts `sticky bottom-0 bg-background/95 backdrop-blur-sm` on a flex sibling `<DrawerFooter>` without `shrink-0`, while conflicting with `DESIGN-SYSTEM.md#L46` (`Hindari ... glassmorphism`). Similarly, `R1` (`rounded-xl` colored boxes), `R2` (`size-10` vs `48×48px`), and `R3` (`duration-300` vs `120–200ms`) diverge from `DESIGN-SYSTEM.md` without being documented in `Line 89`.
* **Rationale & Recommendation**: Guard `QuickTransactionDrawer` reset with an `isErrorReopenRef` and stable dependencies; use solid `bg-background shrink-0` instead of `sticky bottom-0 backdrop-blur-sm` on `<DrawerFooter>`; and either conform CSS tokens or explicitly log approved exceptions in `docs/DESIGN-SYSTEM.md` (`Line 89`).

---

### 9. R1/R2 Split DB Migration Ownership, Missing `update*` Zod Schemas, & Narrow Zero-Emoji Guard - Severity: Major
* **Reviewer Lens:** `egm-structural`, `egm-style`, `egm-design`
* **Affected Scope:** `Lines 38, 68–124, 390–394, 423, 441` (`category.schema.ts#L84`, `wishlist.schema.ts#L61`, `actions/wishlists.ts#L70`, `backend-phases-b7-b13.test.ts#L268-L269`)
* **Discrepancy Description**:
  1. DB emoji cleanup is triggered in `R1` (`Line 87, 97`) with no script/migration path or `db:generate` step, then bundled into `R10`'s checklist (`Line 423`) with zero mention in `R10`'s design (`Lines 390–394`) and no concrete SQL ZWJ/emoji transformation rules (`"👩‍👦"`, `"✝️"`, `"💵"`) or empty-name safety fallback.
  2. `R2` (`Lines 116, 122`) enlarges `createCategorySchema` & `createWishlistSchema` `.max(10) -> .max(50)`, missing **`updateCategorySchema.icon`** (`category.schema.ts#L84`), **`updateWishlistSchema.icon`** (`wishlist.schema.ts#L61`), and `actions/wishlists.ts#L70` (`|| "🎯"`).
  3. `R1`'s `Zero-Emoji Audit Test` (`Line 91`) scans only `.tsx` UI files (`src/components/**`, `src/app/**`), leaving emojis inside `src/lib/` (`gemini.ts`, `financial-calculations.ts`), `src/actions/`, `src/schemas/`, and `backend-phases-b7-b13.test.ts` unchecked without defining the exact Unicode regex.
* **Rationale & Recommendation**: Assign single ownership for custom SQL migration (`--custom`) + safe emoji stripping across `icon` & `name`, update both `create*` and `update*` Zod schemas, and extend the automated Zero-Emoji regex sweep across `src/actions/` and non-test `src/lib/` + `src/schemas/`.

---

### 10. Structural & Cross-Section Contradictions, Missing `File Terdampak` (R3 & R10), and Incomplete DoD / Security-Scalability Risks - Severity: Major
* **Reviewer Lens:** `egm-structural`, `egm-style`
* **Affected Scope:** `Lines 3, 25–62, 127–150, 205, 291, 319, 371–462`
* **Discrepancy Description**:
  1. **Status & Timestamp Drift:** `Line 3` asserts `READY FOR BATCH EXECUTION` while `Lines 25, 56–58, 431, 457` keep `COLLECTING` / `R11..Rn` open; `Lines 26–35, 197, 281` label pre-execution `/grill-me` design locks `Disetujui Kenzo ✅` (conflicting with `AGENTS.md` §2 post-implementation approval); `R10` carries `15:43 WIB` (`Line 35`) vs `15:39 WIB` (`Lines 373, 375`).
  2. **Token & Count Drift:** `pos_wajib` icon box is `amber/biru lembut` (`Line 26`) vs `amber/indigo lembut` (`Line 72`); `R3` lists 8 items under `"7 lokasi R3"` while omitting `R8`'s payment-method switcher (`Line 291`); `R8` (`Line 313`) attaches `(+ set isTemporary: true jika lunas)` ambiguously to the `liabilities` update; `R7` height uses `md:` (`Line 268`) vs `lg:` (`Lines 263–265`).
  3. **Missing `File Terdampak` & Unaligned Mermaid:** `R3` and `R10` omit `File Terdampak` maps (leaving `src/lib/queries/*`, `src/schemas/*`, `src/components/features/settings/*`, `src/proxy.ts` disposition, and tests unmapped, undermining `Line 439`); Section 2 Mermaid forces a linear chain `R1 -> ... -> R10` instead of true dependencies; `R1–R10` lack uniform sub-headings and `---` separators.
  4. **Section 4 & DoD Gaps:** `Tailwind v4 Canonical Audit` / `Total non-canonical: 0` has no CLI command/script; `tsc --noEmit` vs `bun run typecheck` alternates; `Line 17` (`81/81 PASS`) lacks commit/timestamp; Section 4 omits `deleteCategory` ownership security and `R6` category-grid scalability for large user budgets; Section 5 DoD omits migration audit, zero-emoji/zero-`font-mono` sweeps, `DESIGN-SYSTEM.md` / `PROJECT-STRUCTURE.md` updates, and Kenzo's manual UI checklist.
* **Rationale & Recommendation**: Separate pre-execution lock status (`Desain Terkunci (Pra-Eksekusi)`) from post-implementation approval (`Disetujui`), align all tokens/timestamps/counts, add `File Terdampak` maps to `R3` & `R10`, specify the exact verification command for Tailwind v4 Canonical Audit, add security/scalability risks to Section 4, and update Section 5 DoD.

---

### 11. Component Ergonomics, `useSlidingIndicator` Re-measurement, Broken Code Spans, & Prose Cleanup - Severity: Nit
* **Reviewer Lens:** `egm-design`, `egm-structural`, `egm-style`
* **Affected Scope:** `Lines 4, 73, 113, 134, 137–139, 158, 167, 197, 205, 222, 226, 252, 281, 312, 349, 352, 371, 443, 446, 450`
* **Discrepancy Description**:
  - `IconPicker` (`grid-cols-6`, `size-10` / `40px`) is narrow on `< 360px` screens; `useSlidingIndicator` inside Vaul/Radix modals needs `document.fonts?.ready` and both track + button observation; nav label `"Backup"` vs `"Data & Backup"` needs unification.
  - Broken CommonMark code spans (`Lines 158, 167, 312` using `\` inside single backticks), LaTeX math in `###` headings (`Lines 281, 371`), dangling screenshot captions (`Lines 137, 139, 252`), prose typos/fillers (`ikut ikut`, `memecah proxy.ts`, `100%`, `mulus`, `nyaman`, `dll.`), misplaced caveats (`Line 150`, `Line 205`), and unlinked plain paths in `R1` & `R10`.
* **Rationale & Recommendation**: Use `grid-cols-4 min-[380px]:grid-cols-6` (or `min-h-11`), add `fonts.ready` observer to `useSlidingIndicator`, unify sidebar/nav labels, replace template-literal single backticks with double backticks, move LaTeX out of headings, remove ungrounded adjectives/dangling screenshot references, and standardize `R1–R10` file links.
