---
date: 2026-11-24
time: "21:30 WIB"
timezone: Asia/Jakarta
task: Refactor Dashboard Tier 1 — Full-Width Wealth Hero Card & Historical Wealth Trajectory Chart (Fase 1–7)
prompt: "Merombak Tier 1 Dashboard utama (/dashboard) menjadi full-width viewport-fitted Wealth Hero Card dengan visualisasi grafik interaktif histori simpanan (Line & Bar, rentang Harian/Mingguan/Bulanan/Tahunan, 2-axis dashed crosshair tooltip) yang ditenagai oleh tabel time-series savings_snapshots, serta mereposisi Cockpit Arus Kas bulanan tepat di bawahnya."
author: Antigravity
---

# Refactor Dashboard Tier 1: Full-Width Wealth Hero Card & Historical Wealth Trajectory Chart

## Ringkasan Perubahan
Menuntaskan seluruh 7 fase granular pada rencana kerja `PLANWEALTHCHART.md`:
1. **Fase 1 (Schema & DB Migration):** Menambahkan tabel time-series `savings_snapshots` pada `src/db/schema.ts` dengan indeks performa ganda (`userId + snapshotDate`, `userId + createdAt`) dan kebijakan Row Level Security (RLS) PostgreSQL. Migrasi berhasil diaplikasikan ke Supabase (`0004_shocking_invisible_woman.sql`).
2. **Fase 2 (Mutation Hooks & Backfill Routine):** Mengintegrasikan utilitas terpusat `recordSavingsSnapshot` pada Server Actions mutasi tabungan/darurat (`src/actions/savings.ts`, `src/actions/months.ts`, `src/actions/wishlists.ts`) dan menyediakan Server Action `backfillInitialSnapshots(userId)` untuk baseline data masa lalu.
3. **Fase 3 (Query Layer & Forward-Fill):** Mengimplementasikan layer pembacaan murni `getAllTimeframeSnapshots(userId)` di `src/lib/queries/savings-snapshots.ts` dengan algoritma penggabungan mutasi di hari yang sama (*same-day collision collapse*), baseline seeding untuk mencegah grafik drop ke Rp 0, dan interpolasi forward-fill untuk rentang harian (30D), mingguan (12W), bulanan (12M), dan tahunan (All).
4. **Fase 4 (Recharts Wealth Trajectory Chart):** Membangun komponen klien interaktif `WealthTrajectoryChart.tsx` berbasis Recharts v3 dengan dual mode (Area Gradient Monotone vs Volume Bar), 4 timeframe responsif (label ringkas di ponsel, label penuh di desktop), 2-axis dashed crosshair (`ReferenceLine y={hoveredValue}`), dan live readout strip ramah sentuh (*mobile touch ergonomics*).
5. **Fase 5 (Modular Primitives):** Membuat kontainer kartu lebar penuh `WealthHeroCard.tsx` (terintegrasi dengan headline saldo, badge Safety Months, dan sub-vault inset chips) serta `CashflowCockpitCard.tsx` (Tier 2 ringkasan arus kas dengan badge status kesehatan anggaran dan progress bar penyerapan kas). Keduanya diekspor melalui `src/components/features/dashboard/index.ts`.
6. **Fase 6 (Dashboard Orchestrator Integration & Responsive Clamping):** Memasang kedua kartu baru di `src/app/(dashboard)/dashboard/(overview)/page.tsx` dengan pemanggilan paralel `Promise.all` tanpa latency tambahan, menerapkan responsive height clamping (`lg:min-h-[480px]` di desktop, adaptif di ponsel), serta menyelaraskan `DashboardSkeleton.tsx` untuk mencegah cumulative layout shift (CLS).
7. **Fase 7 (Automated Test Suite & Quality Verification):** Menyusun test suite komprehensif `WealthTrajectoryChart.test.tsx`, memvalidasi seluruh unit test (118/118 PASS), pemeriksaan tipe TypeScript (0 errors), audit invarian tipografi zero monospace (`tabular-nums` verified), dan build produksi Turbopack sukses (11/11 rute terkompilasi).

## Berkas yang Diubah / Dibuat
- `src/db/schema.ts` — Skema tabel `savings_snapshots` dan relasi Drizzle ORM.
- `src/db/migrations/0004_shocking_invisible_woman.sql` — Berkas migrasi database SQL dengan RLS.
- `src/lib/savings-snapshots.ts` — Modul pembantu atomik pencatatan snapshot finansial.
- `src/actions/savings.ts` — Hook mutasi setor/tarik darurat, top-up bebas, dan backfill snapshot.
- `src/actions/months.ts` — Hook mutasi month sweep saat tutup/buka buku siklus.
- `src/actions/wishlists.ts` — Hook mutasi alokasi/penarikan tabungan wishlist.
- `src/types/savings-snapshots.ts` — Kontrak tipe data time-series histori kekayaan.
- `src/types/index.ts` — Barrel export kontrak tipe data snapshot.
- `src/lib/queries/savings-snapshots.ts` — Query engine time-series dengan forward-fill & collision collapse.
- `src/lib/queries/__tests__/savings-snapshots.test.ts` — Unit test query layer time-series.
- `src/components/features/dashboard/WealthTrajectoryChart.tsx` — Visualisasi Recharts 4 timeframe & 2-axis crosshair.
- `src/components/features/dashboard/WealthHeroCard.tsx` — Full-width Hero card Tier 1.
- `src/components/features/dashboard/CashflowCockpitCard.tsx` — Full-width Cockpit card Tier 2.
- `src/components/features/dashboard/index.ts` — Barrel export komponen dashboard.
- `src/app/(dashboard)/dashboard/(overview)/page.tsx` — Server Component orchestrator dashboard utama.
- `src/components/layout/DashboardSkeleton.tsx` — Skeleton anti-CLS untuk Tier 1 & Tier 2.
- `src/components/features/dashboard/__tests__/WealthTrajectoryChart.test.tsx` — Test suite untuk komponen Tier 1 & 2.
- `docs/plans/PLANWEALTHCHART.md` — Rencana kerja teknis (seluruh 7 fase selesai).
- `laporan.md` — Laporan progres repositori terpusat.

## Hasil Verifikasi Kualitas
- **Typecheck:** `bun run typecheck` PASS (0 errors).
- **Unit Tests:** `bun test` PASS (118/118 passing across 10 test suites, 608 expect calls).
- **Production Build:** `next build` (Turbopack) PASS (11/11 static and dynamic routes compiled in 4.2s).
- **Invarian Tipografi:** 100% sans-serif dengan `tabular-nums`, 0% monospace utility font pada seluruh angka/nominal Rupiah.
- **Audit Kode:** 0 literal emojis, 0 personal dummy figures.

## Status Persetujuan
- **Status:** `COMPLETED ✅` (Sesuai otorisasi batch Kenzo: *"khusus ini kerjain fase 1 - 7, tiap fase , kmu commit , trus lanjut fase selanjutnya(khusus ini aja)"*).
