/**
 * ==============================================================================
 * Kenzo Treasury — Query Layer: Savings Snapshots & Time-Series Interpolator
 * ==============================================================================
 *
 * Menyediakan data time-series histori simpanan untuk visualisasi Recharts:
 * 1. Read-Only Pure Queries: Tidak melakukan mutasi apa pun ke database.
 * 2. Same-Day Collision Collapse: Menciutkan multiple mutasi pada hari yang sama
 *    menjadi 1 titik data saldo penutupan hari tersebut.
 * 3. Inactivity Baseline Seeding: Menemukan saldo penutupan terakhir sebelum
 *    jendela awal timeframe agar grafik tidak jatuh ke Rp 0 saat pengguna pasif.
 * 4. Forward-Fill Interpolation: Mengisi hari/minggu kosong dengan meneruskan
 *    saldo terakhir (*last known value*).
 */

import { db } from "@/db";
import { savingsSnapshots, savingsAccount } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import type {
  AllTimeframeSnapshots,
  TimeframeOption,
  WealthSnapshotPoint,
} from "@/types/savings-snapshots";

const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ags",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

interface RawSnapshot {
  snapshotDate: string;
  freeSavingsBalance: number;
  emergencyFundBalance: number;
  totalBalance: number;
  deltaAmount: number;
  createdAt: Date;
}

/**
 * Format tanggal ISO (YYYY-MM-DD) ke label bahasa Indonesia.
 */
function formatShortDateLabel(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length < 3) return isoDate;
  const day = parseInt(parts[2], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  return `${day} ${SHORT_MONTH_NAMES[monthIdx] || ""}`;
}

function formatMonthYearLabel(yearMonth: string): string {
  const parts = yearMonth.split("-");
  if (parts.length < 2) return yearMonth;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  return `${SHORT_MONTH_NAMES[monthIdx] || ""} ${year.slice(2)}`;
}

/**
 * Format date object ke YYYY-MM-DD
 */
function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Menciutkan snapshot pada tanggal yang sama: mengambil snapshot terakhir dari setiap tanggal.
 */
export function collapseSameDaySnapshots(
  snapshots: RawSnapshot[]
): Map<string, RawSnapshot> {
  const map = new Map<string, RawSnapshot>();
  for (const s of snapshots) {
    // Karena query di-order ASC by date & createdAt, entri berikutnya pada tanggal yang sama akan menimpa entri sebelumnya
    map.set(s.snapshotDate, s);
  }
  return map;
}

/**
 * Menghasilkan deret titik data Harian (30 Hari Terakhir).
 */
export function buildDailyPoints(
  dayMap: Map<string, RawSnapshot>,
  allSorted: RawSnapshot[],
  fallbackFree: number,
  fallbackEmergency: number,
  referenceDate: Date = new Date()
): WealthSnapshotPoint[] {
  const points: WealthSnapshotPoint[] = [];
  const daysCount = 30;

  // Tanggal awal = referenceDate - 29 hari
  const startDate = new Date(referenceDate);
  startDate.setDate(startDate.getDate() - (daysCount - 1));
  const startIso = toIsoDate(startDate);

  // Cari saldo baseline terakhir sebelum startDate
  let lastKnownFree = fallbackFree;
  let lastKnownEmergency = fallbackEmergency;

  const priorSnapshots = allSorted.filter((s) => s.snapshotDate < startIso);
  if (priorSnapshots.length > 0) {
    const latestPrior = priorSnapshots[priorSnapshots.length - 1];
    lastKnownFree = latestPrior.freeSavingsBalance;
    lastKnownEmergency = latestPrior.emergencyFundBalance;
  } else if (allSorted.length > 0) {
    lastKnownFree = allSorted[0].freeSavingsBalance;
    lastKnownEmergency = allSorted[0].emergencyFundBalance;
  }

  const cursor = new Date(startDate);
  for (let i = 0; i < daysCount; i++) {
    const currentIso = toIsoDate(cursor);
    const snap = dayMap.get(currentIso);

    if (snap) {
      lastKnownFree = snap.freeSavingsBalance;
      lastKnownEmergency = snap.emergencyFundBalance;
      points.push({
        date: currentIso,
        label: formatShortDateLabel(currentIso),
        freeSavings: snap.freeSavingsBalance,
        emergencyFund: snap.emergencyFundBalance,
        totalWealth: snap.totalBalance,
        delta: snap.deltaAmount,
      });
    } else {
      points.push({
        date: currentIso,
        label: formatShortDateLabel(currentIso),
        freeSavings: lastKnownFree,
        emergencyFund: lastKnownEmergency,
        totalWealth: lastKnownFree + lastKnownEmergency,
        delta: 0,
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return points;
}

/**
 * Menghasilkan deret titik data Mingguan (12 Minggu Terakhir).
 */
export function buildWeeklyPoints(
  dayMap: Map<string, RawSnapshot>,
  allSorted: RawSnapshot[],
  fallbackFree: number,
  fallbackEmergency: number,
  referenceDate: Date = new Date()
): WealthSnapshotPoint[] {
  const points: WealthSnapshotPoint[] = [];
  const weeksCount = 12;

  // Tiap minggu diakhiri pada kelipatan 7 hari mundur dari referenceDate
  for (let w = weeksCount - 1; w >= 0; w--) {
    const weekEndDate = new Date(referenceDate);
    weekEndDate.setDate(weekEndDate.getDate() - w * 7);
    const weekEndIso = toIsoDate(weekEndDate);

    // Cari snapshot terakhir pada atau sebelum tanggal akhir minggu ini
    let free = fallbackFree;
    let emergency = fallbackEmergency;
    let delta = 0;

    const applicable = allSorted.filter((s) => s.snapshotDate <= weekEndIso);
    if (applicable.length > 0) {
      const latest = applicable[applicable.length - 1];
      free = latest.freeSavingsBalance;
      emergency = latest.emergencyFundBalance;
      delta = latest.deltaAmount;
    }

    const weekNumber = weeksCount - w;
    points.push({
      date: weekEndIso,
      label: `M${weekNumber}`,
      freeSavings: free,
      emergencyFund: emergency,
      totalWealth: free + emergency,
      delta,
    });
  }

  return points;
}

/**
 * Menghasilkan deret titik data Bulanan (12 Bulan Terakhir).
 */
export function buildMonthlyPoints(
  allSorted: RawSnapshot[],
  fallbackFree: number,
  fallbackEmergency: number,
  referenceDate: Date = new Date()
): WealthSnapshotPoint[] {
  const points: WealthSnapshotPoint[] = [];
  const monthsCount = 12;

  const currentYear = referenceDate.getFullYear();
  const currentMonthIdx = referenceDate.getMonth(); // 0-11

  for (let m = monthsCount - 1; m >= 0; m--) {
    const targetDate = new Date(currentYear, currentMonthIdx - m + 1, 0); // Akhir bulan
    const targetIso = toIsoDate(targetDate);
    const yearMonthStr = `${targetDate.getFullYear()}-${String(
      targetDate.getMonth() + 1
    ).padStart(2, "0")}`;

    let free = fallbackFree;
    let emergency = fallbackEmergency;
    let delta = 0;

    const applicable = allSorted.filter((s) => s.snapshotDate <= targetIso);
    if (applicable.length > 0) {
      const latest = applicable[applicable.length - 1];
      free = latest.freeSavingsBalance;
      emergency = latest.emergencyFundBalance;
      delta = latest.deltaAmount;
    }

    points.push({
      date: targetIso,
      label: formatMonthYearLabel(yearMonthStr),
      freeSavings: free,
      emergencyFund: emergency,
      totalWealth: free + emergency,
      delta,
    });
  }

  return points;
}

/**
 * Menghasilkan deret titik data Tahunan (5 Tahun Terakhir / Sepanjang Waktu).
 */
export function buildYearlyPoints(
  allSorted: RawSnapshot[],
  fallbackFree: number,
  fallbackEmergency: number,
  referenceDate: Date = new Date()
): WealthSnapshotPoint[] {
  const points: WealthSnapshotPoint[] = [];
  const yearsCount = 3;
  const currentYear = referenceDate.getFullYear();

  for (let y = yearsCount - 1; y >= 0; y--) {
    const targetYear = currentYear - y;
    const yearEndIso = `${targetYear}-12-31`;

    let free = fallbackFree;
    let emergency = fallbackEmergency;
    let delta = 0;

    const applicable = allSorted.filter((s) => s.snapshotDate <= yearEndIso);
    if (applicable.length > 0) {
      const latest = applicable[applicable.length - 1];
      free = latest.freeSavingsBalance;
      emergency = latest.emergencyFundBalance;
      delta = latest.deltaAmount;
    }

    points.push({
      date: `${targetYear}-01-01`,
      label: String(targetYear),
      freeSavings: free,
      emergencyFund: emergency,
      totalWealth: free + emergency,
      delta,
    });
  }

  return points;
}

/**
 * Mengambil dataset time-series komprehensif seluruh timeframe untuk pengguna.
 * Pure Read-Only Query.
 */
export async function getAllTimeframeSnapshots(
  userId: string
): Promise<AllTimeframeSnapshots> {
  const [snapshots, [account]] = await Promise.all([
    db
      .select({
        snapshotDate: savingsSnapshots.snapshotDate,
        freeSavingsBalance: savingsSnapshots.freeSavingsBalance,
        emergencyFundBalance: savingsSnapshots.emergencyFundBalance,
        totalBalance: savingsSnapshots.totalBalance,
        deltaAmount: savingsSnapshots.deltaAmount,
        createdAt: savingsSnapshots.createdAt,
      })
      .from(savingsSnapshots)
      .where(eq(savingsSnapshots.userId, userId))
      .orderBy(asc(savingsSnapshots.snapshotDate), asc(savingsSnapshots.createdAt)),
    db
      .select()
      .from(savingsAccount)
      .where(eq(savingsAccount.userId, userId))
      .limit(1),
  ]);

  const fallbackFree = account?.balance ?? 0;
  const fallbackEmergency = account?.emergencyFundBalance ?? 0;

  const dayMap = collapseSameDaySnapshots(snapshots);
  const now = new Date();

  return {
    daily: buildDailyPoints(dayMap, snapshots, fallbackFree, fallbackEmergency, now),
    weekly: buildWeeklyPoints(dayMap, snapshots, fallbackFree, fallbackEmergency, now),
    monthly: buildMonthlyPoints(snapshots, fallbackFree, fallbackEmergency, now),
    yearly: buildYearlyPoints(snapshots, fallbackFree, fallbackEmergency, now),
  };
}
