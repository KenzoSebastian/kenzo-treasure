---
date: 2026-11-25
time: "20:56 WIB"
timezone: Asia/Jakarta
task: Perombakan Halaman Analitik Finansial 4-Tier (/dashboard/analytics) (PLANANALYTICS Fase A1–A3)
prompt: "Merombak halaman /dashboard/analytics agar lebih mudah dipahami dan bebas redundansi dengan Dashboard utama, menerapkan arsitektur 4-Tier (KPI Ringkas, Grouped Bar Arus Kas, Donut + Ranking Pengeluaran dengan selector bulan, serta Target vs Realisasi & Tren Savings Rate %)."
author: Antigravity
---

# Perombakan Halaman Analitik Finansial 4-Tier (`/dashboard/analytics`)

## Ringkasan Perubahan
Menuntaskan seluruh 3 fase pada rencana kerja `PLANANALYTICS.md`:
1. **Fase A1 (Types & Multi-Month Query Layer):** Menambahkan `AnalyticsMonthOption`, `availableMonths`, dan `categoryDistributionByMonth` di `src/types/analytics.ts`, serta memperbarui `getAnalyticsDashboardData` di `src/lib/queries/analytics.ts` agar mengambil seluruh bulan dalam `targetYear` beserta agregat tahunannya (`"all"`) dalam satu batch query paralel.
2. **Fase A2 (Komponen Modular Tier 1–4):**
   - `AnalyticsKpiGrid.tsx`: 4 KPI ringkas (*Rata-rata Savings Rate*, *Surplus Bersih*, *Rata-rata Belanja / Bulan*, *Pos Terbesar*).
   - `MonthlyCashflowChart.tsx`: Grouped Bar Chart Recharts (Pemasukan vs Pengeluaran) dengan `var(--border)`/`var(--muted-foreground)` dan dark-aware custom tooltip (`tabular-nums`).
   - `ExpenseDonutSection.tsx`: Donut Chart interaktif (Top 5 + *Lainnya*, Total Belanja di tengah donat) + Ranked List berikon (`AppCategoryIcon`) dan Selector Bulan instan.
   - `BudgetDisciplineSection.tsx`: 2 kolom (*Target vs Realisasi Anggaran* per pos & *Tren Savings Rate %* AreaChart).
   - `AnalyticsDashboard.tsx`: Orchestrator dengan 1 Filter Tahun di header (`?year=...`), menghapus toggle global Bar/Line dan grafik Pertumbuhan Tabungan yang redundan dengan Dashboard utama.
3. **Fase A3 (Page Orchestrator, Skeleton, Tests & Docs):**
   - Memperbarui `src/app/(dashboard)/dashboard/analytics/page.tsx` untuk mendukung `searchParams.year` dan `<Suspense fallback={<AnalyticsSkeleton />}>`.
   - Menyelaraskan `AnalyticsSkeleton.tsx` dengan layout 4-Tier baru.
   - Menambahkan unit test suite `AnalyticsDashboard.test.tsx` dan memperbarui `frontend-phases-f7-f18.test.tsx`.

## Hasil Verifikasi
- **Typecheck:** `bun run typecheck` PASS (0 errors).
- **Unit Tests:** `bun test` PASS (121/121 passing across 11 suites, 634 expect calls).
- **Production Build:** `bun run build` (Turbopack) PASS (11/11 routes compiled in 7.8s).

## Status Persetujuan
- **Status:** `COMPLETED ✅` (Otorisasi batch oleh Kenzo: *"khusus ini tolong kerjain sampe fase akhir, tiap fase kmu commit"*).
