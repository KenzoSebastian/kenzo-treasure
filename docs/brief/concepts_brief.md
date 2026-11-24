# Full-Width Wealth Hero Card & Historical Wealth Trajectory Chart

* **Author:** Kenzo Sebastian
* **Date:** 2026-11-24

## Overview

Transform the Tier 1 Dashboard Hero section from an asymmetric 65:35 Bento grid into an authoritative, full-width, viewport-fitted Wealth Cockpit. The top card showcases the headline Total Brankas Simpanan alongside an interactive Historical Wealth Trajectory chart spanning Daily, Weekly, Monthly, and Yearly intervals. Users can toggle between Cumulative Line (Area gradient) and Periodic Growth Bar visualizations, with interactive 2-axis dashed crosshairs projecting to the Y-axis Rupiah value on hover. The monthly Cashflow Cockpit shifts directly beneath the Wealth Hero card as a full-width Tier 2 control panel.

## Analysis

### 1. Viewport Ergonomics & Mobile Clamping
* **Desktop (`lg:`):** The Wealth Hero card spans 100% width with a responsive height clamp (`min-h-[460px]` up to `h-[520px]`). This commands the viewport below the Navbar and Header, offering a dedicated ~300px canvas height for the chart and clear headline figures.
* **Mobile PWA (`< sm`):** Setting a strict `calc(100dvh - ...)` on mobile screens (667–844px) would push the primary daily operational tool (the monthly Cashflow Cockpit and discretionary Uang Bebas quota) entirely below the fold. Mobile height is clamped to `h-[360px]` (chart canvas ~`200px`), allowing the top border of the Cashflow Cockpit to remain visible above the initial fold.

### 2. Chart Engine: Zero-Bloat Recharts vs. External Libraries
* **Verdict:** Retain and optimize **Recharts (v3.10.1)**. Recharts is already installed, deeply integrated with Tailwind CSS dark/light theme tokens, proven in `AnalyticsDashboard.tsx`, and eliminates React 19 / Next.js 16 SSR canvas hydration hazards.
* **Two-Axis Dashed Crosshair:** Achieved natively in Recharts using the vertical cursor (`cursor={{ strokeDasharray: '4 4' }}`) paired with an active horizontal SVG `<ReferenceLine y={hoveredY} strokeDasharray="4 4" />` triggered during tooltip hover, keeping bundle bloat to zero.

### 3. Data Persistence & Time-Series Engine
* **`savings_snapshots` Table (`src/db/schema.ts`):** An append-only time-series ledger capturing:
  - `id`: UUID Primary Key
  - `userId`: Foreign Key to `users.id`
  - `snapshotDate`: Date
  - `freeSavingsBalance`: Integer Rupiah
  - `emergencyFundBalance`: Integer Rupiah
  - `totalBalance`: Integer Rupiah (Sum of free + emergency)
  - `deltaAmount`: Integer (+/- change from previous record)
  - `sourceEvent`: String (`initial` | `month_sweep` | `month_reopen` | `top_up` | `emergency_transfer` | `emergency_withdraw` | `wishlist_allocate` | `wishlist_withdraw`)
  - `createdAt`: Timestamp with timezone
* **Forward-Fill Gap Interpolation:** Personal savings accounts do not mutate every single day. A forward-fill utility (`forwardFillSnapshots`) in `src/lib/queries/savings-snapshots.ts` fills sparse data gaps between active mutation dates, ensuring smooth, continuous curves across 30-day views instead of erratic step plateaus.
* **Historical Backfill Migration:** Baseline snapshots will be seeded automatically from existing closed cycles (`months.swept_amount`) and current balances, ensuring existing accounts do not display blank charts.

### 4. Component Architecture & Modularization
To adhere to the Thin Orchestrator pattern (keeping `src/app/(dashboard)/dashboard/(overview)/page.tsx` under 300 lines), the monolithic `ExecutiveWealthBento.tsx` splits into two focused feature components:
* `WealthHeroCard.tsx`: Houses the balance callouts, safety months badge, timeframe/mode toggles, and `WealthTrajectoryChart.tsx`.
* `CashflowCockpitCard.tsx`: Houses the current monthly cashflow health, surplus callout, inflow/outflow breakdown, and budget absorption progress bar.

## Goals vs. Non-Goals

### In-Scope Goals
* **Full-Width Viewport-Clamped Wealth Hero Card:**
  - 100% full width (`w-full`).
  - Desktop height clamped to `min-h-[460px]` / `h-[520px]`; mobile clamped to `h-[360px]`.
* **Interactive Chart Component (`WealthTrajectoryChart.tsx`):**
  - Dual visualization modes: **Garis (Line / Area Gradient)** and **Batang (Bar)**.
  - Multi-timeframe tabs: **Harian (30D)**, **Mingguan (12W)**, **Bulanan (12M)**, **Tahunan (All/3Y)**.
  - 2-Axis Dashed Crosshair locking to the active Y-axis Rupiah value and X-axis date.
  - Zero monospace font (`font-mono` = 0); 100% sans-serif with `tabular-nums`.
* **Database & Query Layer:**
  - `savings_snapshots` table definition and Drizzle migration.
  - Centralized atomic helper `recordSavingsSnapshot(tx, ...)` integrated into existing server actions.
  - Server-side forward-fill interpolation utility.
* **Layout Adjustment:**
  - Cashflow Cockpit repositioned directly beneath the Wealth Hero card.

### Out-of-Scope Non-Goals
* **Candlestick (OHLC) Charts:** Officially eliminated per Kenzo's decision due to the lack of intraday price volatility in personal treasury accounts.
* **External Trading Indicators:** No RSI, MACD, or stock market ticker widgets.
* **Real-time WebSocket Streaming:** Updates remain event-driven upon Server Action mutations and Next.js route revalidation.

## Alternatives Weighed

1. **Adopting TradingView Lightweight Charts (`lightweight-charts`):**
   - *Technical Trade-off:* Offers out-of-the-box crosshairs, but adds ~45KB bundle size, operates imperatively outside React's declarative state, and introduces hydration/resizing friction with Next.js 16 and CSS variable theme switching.
   - *Rejected in favor of:* Recharts v3 with an active SVG `ReferenceLine` crosshair, maintaining complete zero-dependency architectural consistency.
2. **Candlestick Aggregation on Personal Savings:**
   - *Technical Trade-off:* Evaluated grouping transactions into weekly/monthly OHLC buckets. Rejected by Kenzo during problem drilling in favor of clean Line and Bar modes.
3. **Calculating Historical Balances Dynamically on Every Request (Event Sourcing):**
   - *Technical Trade-off:* Summing all historical transactions, incomes, and sweeps on-the-fly causes unbounded O(N) query degradation as user records grow.
   - *Rejected in favor of:* Dedicated indexed `savings_snapshots` table with O(1) interval queries.

## Key Decisions & Staging for Next Steps

1. **Decision 1 (Layout):** Implement full-width `WealthHeroCard` clamped responsively on desktop (`lg:min-h-[460px]`) and mobile (`h-[360px]`).
2. **Decision 2 (Chart Visualizations):** Support Line (Area) and Bar modes via `SlidingSegmentedControl`. Default active view: Bulanan (12M).
3. **Decision 3 (Library Reuse):** Build the interactive 2-axis dashed crosshair using Recharts native cursor and dynamic `ReferenceLine`.
4. **Decision 4 (Schema Migration):** Create `savings_snapshots` table with foreign key to `users.id`, indexes on `(userId, snapshotDate)`, and a centralized mutation hook.
5. **Decision 5 (Next Step):** Proceed to formal planning and execution document (`docs/plans/PLANWEALTHCHART.md` or `/egm-draft`).
