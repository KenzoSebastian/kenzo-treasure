/**
 * ==============================================================================
 * Kenzo Treasury — Centralized Savings Snapshot & Audit Ledger Helper
 * ==============================================================================
 *
 * Mencatat rekaman time-series perubahan saldo tabungan bebas & dana darurat
 * (`savings_snapshots`) secara deterministik di setiap peristiwa mutasi finansial:
 * - Top-up tabungan bebas (`top_up`)
 * - Penutupan buku siklus bulanan (`month_sweep`)
 * - Pembukaan kembali buku siklus (`month_reopen`)
 * - Transfer tabungan bebas ke dana darurat (`emergency_transfer`)
 * - Penarikan dana darurat ke tabungan bebas (`emergency_withdraw`)
 * - Alokasi tabungan bebas ke wishlist sinking fund (`wishlist_allocate`)
 * - Pengembalian dana wishlist ke tabungan bebas (`wishlist_withdraw`)
 */

import { db } from "@/db";
import { savingsSnapshots, savingsAccount, months } from "@/db/schema";
import { resolveDefaultCycleDate } from "@/lib/financial-calculations";
import { eq, asc } from "drizzle-orm";

export type SnapshotSourceEvent =
  | "initial"
  | "top_up"
  | "month_sweep"
  | "month_reopen"
  | "emergency_transfer"
  | "emergency_withdraw"
  | "wishlist_allocate"
  | "wishlist_withdraw";

export interface RecordSavingsSnapshotParams {
  userId: string;
  freeSavingsBalance: number;
  emergencyFundBalance: number;
  deltaAmount?: number;
  sourceEvent: SnapshotSourceEvent;
  snapshotDate?: string; // Format YYYY-MM-DD
}

type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Mencatat snapshot baru ke tabel `savings_snapshots`.
 * Aman dijalankan di dalam transaksi Drizzle (`tx`) maupun koneksi database umum (`db`).
 */
export async function recordSavingsSnapshot(
  txOrDb: DatabaseTransaction | typeof db,
  params: RecordSavingsSnapshotParams
) {
  const freeSavings = Math.max(0, Math.round(params.freeSavingsBalance));
  const emergencyFund = Math.max(0, Math.round(params.emergencyFundBalance));
  const totalBalance = freeSavings + emergencyFund;
  const snapshotDate = params.snapshotDate || resolveDefaultCycleDate();

  const [inserted] = await txOrDb
    .insert(savingsSnapshots)
    .values({
      userId: params.userId,
      snapshotDate,
      freeSavingsBalance: freeSavings,
      emergencyFundBalance: emergencyFund,
      totalBalance,
      deltaAmount: params.deltaAmount ?? 0,
      sourceEvent: params.sourceEvent,
    })
    .returning();

  return inserted;
}

/**
 * Menyintesis snapshot baseline historis (backfill) untuk pengguna jika tabel
 * `savings_snapshots` mereka masih kosong. Menjamin chart langsung terisi
 * dari akumulasi `sweptAmount` siklus bulan lalu dan saldo berjalan.
 */
export async function ensureInitialSavingsSnapshots(
  txOrDb: DatabaseTransaction | typeof db,
  userId: string
) {
  const existingCount = await txOrDb
    .select({ id: savingsSnapshots.id })
    .from(savingsSnapshots)
    .where(eq(savingsSnapshots.userId, userId))
    .limit(1);

  if (existingCount.length > 0) {
    return; // Sudah memiliki riwayat snapshot
  }

  // 1. Ambil data akun tabungan saat ini
  const [currentAccount] = await txOrDb
    .select()
    .from(savingsAccount)
    .where(eq(savingsAccount.userId, userId))
    .limit(1);

  const currentFree = currentAccount?.balance ?? 0;
  const currentEmergency = currentAccount?.emergencyFundBalance ?? 0;
  const currentTotal = currentFree + currentEmergency;

  // 2. Ambil seluruh riwayat bulan yang pernah ditutup
  const closedMonths = await txOrDb
    .select()
    .from(months)
    .where(eq(months.userId, userId))
    .orderBy(asc(months.year), asc(months.monthIndex));

  let runningBalance = 0;
  const todayStr = resolveDefaultCycleDate();

  for (const m of closedMonths) {
    if (m.isClosed && m.sweptAmount > 0) {
      runningBalance += m.sweptAmount;
      const dateStr = `${m.year}-${String(m.monthIndex).padStart(2, "0")}-28`;
      await txOrDb.insert(savingsSnapshots).values({
        userId,
        snapshotDate: dateStr,
        freeSavingsBalance: runningBalance,
        emergencyFundBalance: 0,
        totalBalance: runningBalance,
        deltaAmount: m.sweptAmount,
        sourceEvent: "month_sweep",
      });
    }
  }

  // 3. Catat snapshot kondisi hari ini jika runningBalance != currentTotal atau belum ada entri sama sekali
  await txOrDb.insert(savingsSnapshots).values({
    userId,
    snapshotDate: todayStr,
    freeSavingsBalance: currentFree,
    emergencyFundBalance: currentEmergency,
    totalBalance: currentTotal,
    deltaAmount: currentTotal - runningBalance,
    sourceEvent: "initial",
  });
}
