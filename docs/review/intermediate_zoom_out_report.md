# Goldfish Review Report — Stage 8 (Intermediate Zoom Out Review)

**Target:** `docs/plans/PLANREVISI.md` (`Lines 1..462`)
**Document Standard:** `resources/document_standards/zoom-out-standard.md`
**Prior Reports Evaluated:** `docs/review/zoom_out_report.md` (Stage 5), `docs/review/comprehension_report.md` (Stage 6), `docs/review/critic_report.md` (Stage 7)
**Verdict:** **CHANGES REQUESTED — SIMPLIFY & CONSOLIDATE BEFORE EXECUTION**

## Reviewer Status

| Reviewer | Status |
| --- | --- |
| `egm-zoom-out` | `completed` |

## High-Altitude Synthesis Across Stages 5–7 & `R1–R10`

Resolving Stage 6–7 discrepancies by patching `PLANREVISI.md` as currently structured risks **compounding over-engineering** in four areas:
1. **R10 Budget & Onboarding Bloat:** Stage 7 mitigations (`templateId` FK, multi-open-month targeting, `deleteCategory` transaction-reassignment UI inside `/dashboard/settings`, multi-bucket `Dynamic Freedom Buffer` refactoring, `?resume=1` route lock, and `UserSessionData.onboardingStatus` plumbing) defend two unnecessary parallel mechanisms—a second budget store (`user_budget_templates`) and a 4-column onboarding state machine—instead of collapsing to one Single Source of Truth.
2. **R4 + R7 + R9 Boundary & Cache Collision:** Adding `experimental.staleTimes.dynamic = 20` (`R9`) before profiling `React.cache` auth dedup actively fights `R4` ("Zero Stale Data") and forces cross-file cache-invalidation patches (`auth.ts`, `onboarding.ts`), while keeping cycle-dependent header controls outside `<Suspense>` forces cross-domain `MonthNavigationContext` into `ai/` and `transactions/`.
3. **R8 Parallel Transaction & Dialog Paths:** Building a duplicate 4-field payment dialog in `LiabilityTrackerCard.tsx` and a parallel transaction-insertion branch in `recordInstallmentPayment` forces row locks, overpayment guards, and quota checks to be maintained twice instead of sharing one internal transaction core and reusing `QuickTransactionDrawer.tsx`.
4. **R1/R2/R3/R7/R10 Fragmentation & Symptom Patching:** `R1` and `R2` overlap on picker creation and schema bounds while splitting DB cleanup ownership with `R10`; `R3` reinvents DOM measurement (`ResizeObserver`/`offsetLeft`) instead of leveraging/extending `tabs.tsx` and ARIA radio semantics; and `R7`/`R10` leave personal dummy data and `"7 pos"` hardcodes live on sibling routes.

## Prioritized Findings (Blockers -> Major -> Nits)

### 1. Split-Brain Budget Model & Compensatory Mitigation Bloat (`user_budget_templates`, Proposed `templateId` FK, & Duplicate Settings CRUD) - Severity: Blocker
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 35, 379, 393, 412, 415–419, 451`; Stage 5 (`zoom_out_report.md` #1); Stage 6 (`comprehension_report.md` #3, #13); Stage 7 (`critic_report.md` #4, #5)
* **Discrepancy Description**: `src/lib/month-generator.ts` (`Lines 194-276`) already implements month-to-month continuity via `Kasus A` (`previousCategories` inheritance from the user's latest `budget_categories`). `R10` adds a second parallel budget model (`user_budget_templates` + template CRUD in `/dashboard/settings`) *and* duplicates active-month category CRUD (`deleteCategory` + transaction reassignment) inside `/dashboard/settings` alongside *"Terapkan ke Bulan Aktif Saat Ini"*. Stage 7 (`critic_report.md` #4–#5) responds by recommending a nullable `templateId` FK, multi-open-month sync lookup, `targetBudget` conservation during reassignment, and refactoring `queries/months.ts` & `actions/months.ts` to survive multiple `uang_bebas_tabungan` rows.
* **Rationale & Recommendation**: Layering `templateId` FK, active-month sync heuristics, and two category editors treats symptoms of a split-brain budget store instead of eliminating it, and supporting $N$ `uang_bebas_tabungan` buckets violates the single residual freedom buffer invariant (`financial-domain.md`). Collapse to one Single Source of Truth: keep `budget_categories` on `/dashboard` as the sole live budget editor (`Kasus A` Month $N \rightarrow N+1$), restrict onboarding/Settings category setup strictly to Month 1 initialization + `defaultBaseSalary` updates (dropping duplicate active-month CRUD/sync in Settings and `templateId` FK), and enforce at most 1 primary `uang_bebas_tabungan` bucket.

### 2. Speculative 4-Column Onboarding State Machine & Route-Guard Plumbing - Severity: Blocker
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 35, 391–394, 398, 405–408, 411, 415`; Stage 5 (`zoom_out_report.md` #5); Stage 6 (`comprehension_report.md` #4, #12); Stage 7 (`critic_report.md` #5)
* **Discrepancy Description**: `R10` adds `onboardingStatusEnum` (`"pending" | "skipped" | "completed"`), `users.onboardingStep` (`default 1`), and `users.initialSetupCompletedAt`, plus a `?resume=1` guard (`Line 408`) and Settings auto-promotion (`Line 415`). Stage 6 showed `onboardingStep` lacks persistence, existing users backfilled to `'completed'` with `defaultBaseSalary = null` still trigger `Line 411`'s warning banner, and `defaultBaseSalary = 0` traps users in `"skipped"`; Stage 7 responded by expanding `UserSessionData`, `login()`, `proxy.ts`, and `?resume=1` rules.
* **Rationale & Recommendation**: Modeling a boolean post-registration onboarding gate with a 3-state enum, unused step column, two timestamps, and `?resume=1` query locking is YAGNI and creates dual-state drift. Replace those columns with one nullable `users.onboardingCompletedAt` (backfilled `NOW()` in migration SQL) + `users.defaultBaseSalary`, derive incomplete-setup banners on `/dashboard` from real missing domain state (`monthsList.length === 0 && (defaultBaseSalary === null || templates.length === 0)`), allow direct `/onboarding` visits without `?resume=1`, and protect `/onboarding` in `src/proxy.ts`.

### 3. Premature `experimental.staleTimes.dynamic = 20` & Over-Coupled R4 Month-Transition Context (`R4`, `R7`, `R9`) - Severity: Blocker
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 34, 152–188, 254, 337–368, 444, 449`; Stage 5 (`zoom_out_report.md` #6, #7); Stage 6 (`comprehension_report.md` #1, #10, #11); Stage 7 (`critic_report.md` #2, #7)
* **Discrepancy Description**: `R9` enables `experimental.staleTimes.dynamic = 20` in `next.config.ts` before profiling `React.cache` session deduplication, fighting `R4`'s "Zero Stale Data" guarantee and introducing 20s logout/onboarding cache hazards. Meanwhile `R4` leaves header controls outside `<Suspense>` and injects `MonthNavigationContext` into `ai/` and `transactions/`, even though `dashboard/page.tsx` (`Lines 297–361`) depends on `getMonthDetailById` for the header cycle title, lock badge, `activeCategories.length` (`R7`), `AiMonthlyReviewModal`, and `QuickTransactionDrawer`.
* **Rationale & Recommendation**: First ship the verified bottleneck fix in `R9` (single `React.cache` session query in `src/lib/queries/auth.ts`, `user` prop propagation, fixing the full-table scan in `src/actions/export.ts`, and `revalidateDashboardRoutes()`) and defer `experimental.staleTimes.dynamic = 20` unless profiling proves necessary. In `R4`, keep only `MonthSelector` + `CreateMonthDialog` outside `<Suspense key={selectedMonthId ?? "active"}>` and move the cycle-dependent header strip inside the `<Suspense>` / `DashboardMonthShell` swap boundary—eliminating `MonthNavigationContext` coupling from `ai/` & `transactions/` and stale old-month titles.

### 4. Parallel Installment Payment Dialog & Duplicated Transaction/Liability Mutation Engine (`R8`) - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 33, 281–335, 448`; Stage 5 (`zoom_out_report.md` #4); Stage 6 (`comprehension_report.md` #7, #8); Stage 7 (`critic_report.md` #3)
* **Discrepancy Description**: `createTransaction` (`src/actions/transactions.ts#L55-L191`) already inserts transactions and atomically reconciles `liabilities.paidAmount`/`isSettled` (with Undo/Restore), and `QuickTransactionDrawer.tsx` accepts `defaultCategoryId` and custom `trigger`. `R8` constructs a duplicate 4-field modal in `LiabilityTrackerCard.tsx` and parallel transaction-insertion logic in `recordInstallmentPayment` (plus an un-reconciled `monthId == null` bypass), forcing row locks, settled/overpayment validation, and quota guards to be maintained in two places.
* **Rationale & Recommendation**: Extract one shared internal transactional helper (`executeCategoryTransactionTx`) as the sole place owning `.for("update")` locks, settled/overpayment checks, cycle-date validation, `transactions` insert, and `liabilities.paidAmount` updates. Reuse `<QuickTransactionDrawer>` (extended with `defaultAmount`/`defaultDescription`) when a linked category exists, isolate/remove `monthId == null` bypasses, fix `month-generator.ts#L278-L290` `Kasus A` zero-based balance, and share `resolveDefaultCycleDate` with `IncomeSection.tsx`.

### 5. Low-Level `ResizeObserver` Measurement Architecture & ARIA `tablist` Misuse Instead of Existing `Tabs` (`R3`) - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 28, 127–151, 443`; Stage 5 (`zoom_out_report.md` #8); Stage 7 (`critic_report.md` #8, #11)
* **Discrepancy Description**: `src/components/ui/tabs.tsx` already provides animated Shadcn/Radix `Tabs`/`TabsList` (`variant="default" | "line"`), yet goes unused. `R3` prescribes DOM box measurement weeds (`ResizeObserver`/`offsetLeft`/`hasMeasured`/`document.fonts?.ready`), enforces invalid `role="tablist"`/`"tab"` on form selectors (`PAYMENT_METHODS`, `group`), and overlays `optimisticHref` local state onto Next.js `<Link>` navs.
* **Rationale & Recommendation**: Separate route links (driven cleanly by `usePathname()`), view switchers (extending `tabs.tsx` or a clean switcher contract), and form option selectors (`role="radiogroup"`/`"radio"` + `type="button"`), keeping low-level DOM mechanics out of the plan spec.

### 6. Overlapping `R1`/`R2` Scope, Split DB Cleanup Ownership, & Multi-Phase Hot-File Churn - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 38, 68–124, 423`; Stage 5 (`zoom_out_report.md` #3, #9); Stage 6 (`comprehension_report.md` #2, #9); Stage 7 (`critic_report.md` #9)
* **Discrepancy Description**: `R1` instructs replacing `<Input maxLength={4} />` with an icon picker and introducing `>10`-char keys before `R2` builds `IconPicker.tsx` and raises `.max(10)` -> `.max(50)` (while omitting `updateCategorySchema.icon` and `updateWishlistSchema.icon`). `R1` also leaves `calculateWishlistProgress` emojis intact and ambiguously splits DB emoji cleanup SQL between `R1` and `R10` (`Line 423`), while touching `QuickTransactionDrawer.tsx` across 7 phases and `dashboard/page.tsx` across 6.
* **Rationale & Recommendation**: Merge `R1` + `R2` or enforce strict clean boundaries (`R1` = registry + `AppCategoryIcon` + complete zero-emoji sweep including `calculateWishlistProgress` + `.max(50)` on create/update schemas + single owned `--custom` SQL cleanup; `R2` = `IconPicker`), and consolidate shared-file updates on hot files during execution.

### 7. Incomplete Root-Problem Fix: Personal Kenzo Dummy Data & `"7 pos"` Hardcodes Across Sibling Routes (`R7`, `R10`) - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 254, 273, 409–412`; Stage 5 (`zoom_out_report.md` #2); Stage 7 (`critic_report.md` #6)
* **Discrepancy Description**: `R10` and `R7` leave personal Kenzo fallback previews, emojis, and `"7 pos"` / `[2026, 2027]` hardcodes live across `/analytics`, `/wishlists`, `/vault`, `dashboard/page.tsx#L488-L527`, `queries/savings.ts#L17`, `actions/auth.ts`, `actions/months.ts`, `actions/savings.ts`, `db/schema.ts#L93`, `BudgetCategoryList`, `IncomeSection`, `AiMonthlyReviewModal`, `AppHeader`, `CreateMonthDialog`, `AnalyticsDashboard`, and `gemini.ts`.
* **Rationale & Recommendation**: Consolidate zero-dummy-data fallbacks, fail-closed empty states, `18_000_000` -> `0` neutral defaults, dynamic category counts, and `data.availableYears` into one holistic sweep across all 4 dashboard routes and shared server modules.

### 8. Altitude Bleed, Undocumented `DESIGN-SYSTEM.md` Conflicts, and Missing Decision Context - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 1–65, 72, 113, 134, 226, 233–237, 263–268, 435–462`; Stage 5 (`zoom_out_report.md` #9); Stage 6 (`comprehension_report.md` #5, #6, #14); Stage 7 (`critic_report.md` #1, #8, #10, #11)
* **Discrepancy Description**: Sections embed verbose Tailwind strings and ref variable names instead of component contracts, omit `File Terdampak` in `R3`/`R10`, force a serial Mermaid graph, blur `/grill-me` design lock labels (`Disetujui Kenzo ✅`) with post-implementation approval, omit domain glossary + `Alternatives Considered` (`Opsi A`), and conflict silently with `DESIGN-SYSTEM.md` (`backdrop-blur-sm`, `duration-300`, `size-10`).
* **Rationale & Recommendation**: Elevate prose to clean contracts/invariants, fix `DrawerFooter` (`bg-background shrink-0`), rename pre-execution lock labels to `Desain Terkunci (Pra-Eksekusi)`, add concise domain glossary & `Alternatives Considered`, and normalize `File Terdampak` & dependency Mermaid edges across `R1–R10`.
