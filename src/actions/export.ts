"use server";

/**
 * ==============================================================================
 * Kenzo Treasury — Server Action: Sovereign Financial Data Export (Fase B13)
 * ==============================================================================
 *
 * Menyediakan ekspor data mandiri untuk kedaulatan penuh data pengguna:
 * 1. Format `"csv"`: CSV Transaksi Bulanan & Rekap Pos.
 * 2. Format `"excel"`: Spreadsheet TSV/CSV ber-BOM (`\uFEFF`) yang langsung
 *    terbuka rapi per kolom di Microsoft Excel / Apple Numbers.
 * 3. Format `"json"`: Full JSON Backup seluruh 9 tabel milik pengguna.
 */

import { eq, asc, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  savingsAccount,
  months,
  incomes,
  liabilities,
  budgetCategories,
  transactions,
  wishlists,
  wishlistAllocations,
  userBudgetTemplates,
} from "@/db/schema";
import { resolveAuthenticatedUserId } from "@/lib/queries/months";
import type {
  ActionResponse,
  ExportFormat,
  ExportFilePayload,
} from "@/types";

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Mengekspor data finansial pengguna:
 * - Mendukung pemanggilan:
 *   1. `exportFinancialData(userId, format)`
 *   2. `exportFinancialData(format)`
 */
export async function exportFinancialData(
  userIdOrFormat: string | ExportFormat,
  formatArg?: ExportFormat
): Promise<ActionResponse<ExportFilePayload>> {
  let format: ExportFormat = "json";
  let explicitUserId: string | undefined;

  if (
    userIdOrFormat === "csv" ||
    userIdOrFormat === "json" ||
    userIdOrFormat === "excel"
  ) {
    format = userIdOrFormat;
  } else {
    explicitUserId = userIdOrFormat;
    format = formatArg ?? "json";
  }

  const userId = await resolveAuthenticatedUserId(explicitUserId);
  if (!userId) {
    return {
      success: false,
      error: "Pengguna tidak terautentikasi. Silakan login terlebih dahulu.",
    };
  }

  try {
    const [
      [userProfile],
      [savingsRow],
      userMonths,
      userIncomes,
      userLiabilities,
      userTransactions,
      userWishlists,
      userAllocations,
      userTemplates,
    ] = await Promise.all([
      db.select().from(users).where(eq(users.id, userId)).limit(1),
      db
        .select()
        .from(savingsAccount)
        .where(eq(savingsAccount.userId, userId))
        .limit(1),
      db
        .select()
        .from(months)
        .where(eq(months.userId, userId))
        .orderBy(desc(months.year), desc(months.monthIndex)),
      db
        .select()
        .from(incomes)
        .where(eq(incomes.userId, userId))
        .orderBy(desc(incomes.date)),
      db
        .select()
        .from(liabilities)
        .where(eq(liabilities.userId, userId))
        .orderBy(asc(liabilities.createdAt)),
      db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.date), desc(transactions.createdAt)),
      db
        .select()
        .from(wishlists)
        .where(eq(wishlists.userId, userId))
        .orderBy(desc(wishlists.createdAt)),
      db
        .select()
        .from(wishlistAllocations)
        .where(eq(wishlistAllocations.userId, userId))
        .orderBy(desc(wishlistAllocations.createdAt)),
      db
        .select()
        .from(userBudgetTemplates)
        .where(eq(userBudgetTemplates.userId, userId))
        .orderBy(asc(userBudgetTemplates.sortOrder)),
    ]);

    const monthIds = userMonths.map((m) => m.id);
    const allCategories =
      monthIds.length > 0
        ? await db
            .select()
            .from(budgetCategories)
            .where(inArray(budgetCategories.monthId, monthIds))
            .orderBy(asc(budgetCategories.sortOrder))
        : [];

    const monthMap = new Map(userMonths.map((m) => [m.id, m.name]));
    const categoryMap = new Map(
      allCategories.map((c) => [
        c.id,
        { name: c.name, group: c.group, monthId: c.monthId },
      ])
    );

    const dateStamp = new Date().toISOString().slice(0, 10);

    if (format === "json") {
      const fullBackup = {
        meta: {
          application: "Kenzo Treasury",
          version: "1.0.0",
          exportedAt: new Date().toISOString(),
          currency: "IDR (Integer)",
        },
        profile: userProfile ?? null,
        savingsAccount: savingsRow ?? null,
        budgetTemplates: userTemplates,
        months: userMonths,
        incomes: userIncomes,
        liabilities: userLiabilities,
        budgetCategories: allCategories,
        transactions: userTransactions.filter((t) => !t.isDeleted),
        wishlists: userWishlists,
        wishlistAllocations: userAllocations,
      };

      const totalRecords =
        userTemplates.length +
        userMonths.length +
        userIncomes.length +
        userLiabilities.length +
        allCategories.length +
        userTransactions.filter((t) => !t.isDeleted).length +
        userWishlists.length;

      return {
        success: true,
        data: {
          filename: `kenzo-treasury-backup-${dateStamp}.json`,
          mimeType: "application/json;charset=utf-8",
          content: JSON.stringify(fullBackup, null, 2),
          recordCount: totalRecords,
          exportedAt: new Date().toISOString(),
        },
      };
    }

    const activeTx = userTransactions.filter((t) => !t.isDeleted);
    const headers = [
      "ID Transaksi",
      "Tanggal",
      "Siklus Bulan",
      "Pos Anggaran",
      "Kelompok Pos",
      "Keterangan",
      "Metode Bayar",
      "Nominal (Rp)",
    ];

    const rows = activeTx.map((tx) => {
      const catInfo = categoryMap.get(tx.categoryId);
      const monthName = catInfo
        ? monthMap.get(catInfo.monthId) ?? "-"
        : "-";
      return [
        escapeCsvCell(tx.id),
        escapeCsvCell(tx.date),
        escapeCsvCell(monthName),
        escapeCsvCell(catInfo?.name ?? "-"),
        escapeCsvCell(catInfo?.group ?? "-"),
        escapeCsvCell(tx.description),
        escapeCsvCell(tx.method.toUpperCase()),
        escapeCsvCell(tx.amount),
      ].join(",");
    });

    const csvBody = [headers.join(","), ...rows].join("\n");

    if (format === "excel") {
      // UTF-8 BOM + ringkasan pos anggaran & transaksi untuk kompatibilitas langsung Excel
      const summaryHeader = [
        "Siklus Bulan",
        "Nama Pos",
        "Kelompok",
        "Target Anggaran (Rp)",
      ].join(",");
      const summaryRows = allCategories.map((c) =>
        [
          escapeCsvCell(monthMap.get(c.monthId) ?? "-"),
          escapeCsvCell(c.name),
          escapeCsvCell(c.group),
          escapeCsvCell(c.targetBudget),
        ].join(",")
      );

      const excelContent = `\uFEFF# REKAPITULASI POS ANGGARAN KENZO TREASURY\n${summaryHeader}\n${summaryRows.join(
        "\n"
      )}\n\n# LOG TRANSAKSI PENGELUARAN HARIAN\n${csvBody}`;

      return {
        success: true,
        data: {
          filename: `kenzo-treasury-rekap-${dateStamp}.csv`,
          mimeType: "text/csv;charset=utf-8",
          content: excelContent,
          recordCount: allCategories.length + activeTx.length,
          exportedAt: new Date().toISOString(),
        },
      };
    }

    return {
      success: true,
      data: {
        filename: `kenzo-treasury-transaksi-${dateStamp}.csv`,
        mimeType: "text/csv;charset=utf-8",
        content: `\uFEFF${csvBody}`,
        recordCount: activeTx.length,
        exportedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    console.error("Gagal mengekspor data finansial:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat menyiapkan file ekspor data.",
    };
  }
}
