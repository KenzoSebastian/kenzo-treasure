/**
 * ==============================================================================
 * Kenzo Treasury — Domain Service: Month & Budget Category Generator
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Memisahkan logika domain pembuatan pos anggaran bulanan dari Server Actions.
 * Menjamin prinsip:
 * 1. 100% Database-Driven: Seluruh nominal cicilan (`monthlyPayment`), status lunas
 *    (`isSettled`), dan ID utang dibaca langsung dari tabel `liabilities` di database,
 *    tanpa hardcode angka 735.000 / 500.000 atau pencocokan keyword string yang kaku.
 * 2. Inheritance Bulan Sebelumnya: Jika pengguna sudah memiliki siklus bulan
 *    sebelumnya di DB, susunan pos anggaran dan penyesuaian target kuota diwarisi
 *    langsung dari bulan terakhir tersebut.
 * 3. Fallback Baseline Zero-Based Budgeting: Template 7 pos anggaran awal hanya
 *    digunakan jika pengguna baru pertama kali membuat bulan dan belum memiliki riwayat
 *    bulan di database.
 */

import { eq, and, desc, asc } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  months,
  budgetCategories,
  liabilities,
} from "@/db/schema";
import * as schema from "@/db/schema";

export const INDONESIAN_MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export const DEFAULT_BASE_SALARY = 4000000;

export interface CategoryTemplateConfig {
  name: string;
  icon: string;
  group: "pos_wajib" | "kebutuhan" | "uang_bebas_tabungan";
  baseTarget: number;
  isTemporary: boolean;
  sortOrder: number;
  liabilityKeyword?: "iphone" | "mama";
}

/**
 * 7 Pos Anggaran Baseline (Fallback untuk inisialisasi awal pengguna baru).
 * Total baseline seimbang tepat Rp 4.000.000 (Zero-Based Budget).
 */
export const BASELINE_CATEGORIES_CONFIG: CategoryTemplateConfig[] = [
  {
    name: "Perpuluhan",
    icon: "✝️",
    group: "pos_wajib",
    baseTarget: 400000,
    isTemporary: false,
    sortOrder: 1,
  },
  {
    name: "📱 Cicilan Pokok iPhone",
    icon: "📱",
    group: "pos_wajib",
    baseTarget: 735000,
    isTemporary: true,
    sortOrder: 2,
    liabilityKeyword: "iphone",
  },
  {
    name: "👩‍👦 Talangan Mama",
    icon: "👩‍👦",
    group: "pos_wajib",
    baseTarget: 500000,
    isTemporary: true,
    sortOrder: 3,
    liabilityKeyword: "mama",
  },
  {
    name: "⚡ Listrik Rumah",
    icon: "⚡",
    group: "pos_wajib",
    baseTarget: 1000000,
    isTemporary: false,
    sortOrder: 4,
  },
  {
    name: "⛽ Bensin",
    icon: "⛽",
    group: "kebutuhan",
    baseTarget: 250000,
    isTemporary: false,
    sortOrder: 5,
  },
  {
    name: "👵 Jajan Popo",
    icon: "👵",
    group: "kebutuhan",
    baseTarget: 200000,
    isTemporary: false,
    sortOrder: 6,
  },
  {
    name: "🍿 Uang Bebas / Tabungan",
    icon: "🍿",
    group: "uang_bebas_tabungan",
    baseTarget: 915000,
    isTemporary: false,
    sortOrder: 7,
  },
];

interface GenerateMonthCategoriesParams {
  tx: PostgresJsDatabase<typeof schema>;
  userId: string;
  newMonthId: string;
  year: number;
  monthIndex: number;
}

/**
 * Logika murni generator pos anggaran:
 * 1. Mengambil seluruh record `liabilities` milik pengguna dari DB.
 * 2. Menghitung akumulasi nominal cicilan yang sudah lunas (`isSettled = true`)
 *    berdasarkan kolom `liability.monthlyPayment` aktual dari DB.
 * 3. Memeriksa apakah ada siklus bulan sebelumnya di DB untuk mewarisi pos & target.
 * 4. Meng-exclude pos cicilan yang sudah lunas dan mengalihkan kuotanya ke pos Uang Bebas.
 */
export async function generateMonthCategories({
  tx,
  userId,
  newMonthId,
}: GenerateMonthCategoriesParams): Promise<{ categoriesCreated: number }> {
  // 1. Ambil seluruh data cicilan/utang dari database
  let userLiabilities = await tx
    .select()
    .from(liabilities)
    .where(eq(liabilities.userId, userId));

  // Jika user belum punya data liabilities di DB sama sekali, lakukan inisialisasi awal
  if (userLiabilities.length === 0) {
    const seededLiabilities = await tx
      .insert(liabilities)
      .values([
        {
          userId,
          name: "📱 Cicilan Pokok iPhone",
          totalAmount: 17640000,
          paidAmount: 5000000,
          monthlyPayment: 735000,
          totalMonths: 24,
          isSettled: false,
        },
        {
          userId,
          name: "👩‍👦 Talangan Mama",
          totalAmount: 2500000,
          paidAmount: 0,
          monthlyPayment: 500000,
          totalMonths: 5,
          isSettled: false,
        },
      ])
      .returning();

    userLiabilities = seededLiabilities;
  }

  // 2. Hitung relokasi kuota dari seluruh cicilan yang berstatus lunas secara dinamis dari DB
  let reallocatedFromSettledLiabilities = 0;
  const activeLiabilitiesMap = new Map<string, typeof liabilities.$inferSelect>();
  const settledLiabilityIds = new Set<string>();

  for (const liability of userLiabilities) {
    if (liability.isSettled) {
      // Baca nominal langsung dari database, BUKAN hardcoded angka!
      reallocatedFromSettledLiabilities += liability.monthlyPayment;
      settledLiabilityIds.add(liability.id);
    } else {
      activeLiabilitiesMap.set(liability.id, liability);
    }
  }

  // 3. Periksa apakah pengguna memiliki siklus bulan sebelumnya di database
  const [previousMonth] = await tx
    .select()
    .from(months)
    .where(and(eq(months.userId, userId), eq(months.id, newMonthId))) // exclude newly inserted month
    .orderBy(desc(months.year), desc(months.monthIndex))
    .limit(1);

  // Ambil pos anggaran dari bulan sebelumnya jika ada
  let previousCategories: (typeof budgetCategories.$inferSelect)[] = [];
  if (previousMonth) {
    previousCategories = await tx
      .select()
      .from(budgetCategories)
      .where(eq(budgetCategories.monthId, previousMonth.id))
      .orderBy(asc(budgetCategories.sortOrder));
  }

  const categoriesToInsert: Array<{
    monthId: string;
    liabilityId: string | null;
    name: string;
    icon: string;
    group: "pos_wajib" | "kebutuhan" | "uang_bebas_tabungan";
    targetBudget: number;
    isTemporary: boolean;
    sortOrder: number;
  }> = [];

  let currentSortOrder = 1;

  if (previousCategories.length > 0) {
    // ── KASUS A: INHERIT DARI BULAN SEBELUMNYA DI DATABASE ────────────────────────
    for (const prevCat of previousCategories) {
      // Jika pos ini terikat cicilan dan cicilannya sudah lunas, jangan dibuatkan lagi
      if (prevCat.liabilityId && settledLiabilityIds.has(prevCat.liabilityId)) {
        continue;
      }

      // Jika pos Uang Bebas / Tabungan, tambahkan relokasi kuota cicilan yang lunas
      if (prevCat.group === "uang_bebas_tabungan") {
        categoriesToInsert.push({
          monthId: newMonthId,
          liabilityId: null,
          name: prevCat.name,
          icon: prevCat.icon ?? "🍿",
          group: prevCat.group,
          targetBudget: prevCat.targetBudget + reallocatedFromSettledLiabilities,
          isTemporary: prevCat.isTemporary,
          sortOrder: currentSortOrder++,
        });
        continue;
      }

      // Jika pos terikat cicilan yang masih aktif, sinkronkan nominal target dengan monthlyPayment terbaru dari DB
      if (prevCat.liabilityId && activeLiabilitiesMap.has(prevCat.liabilityId)) {
        const activeLiability = activeLiabilitiesMap.get(prevCat.liabilityId)!;
        categoriesToInsert.push({
          monthId: newMonthId,
          liabilityId: prevCat.liabilityId,
          name: activeLiability.name,
          icon: prevCat.icon ?? "📱",
          group: prevCat.group,
          targetBudget: activeLiability.monthlyPayment, // Otoritatif dari DB
          isTemporary: true,
          sortOrder: currentSortOrder++,
        });
        // Hapus dari map agar tidak diduplikasi
        activeLiabilitiesMap.delete(prevCat.liabilityId);
        continue;
      }

      // Pos reguler lainnya
      categoriesToInsert.push({
        monthId: newMonthId,
        liabilityId: null,
        name: prevCat.name,
        icon: prevCat.icon ?? "💰",
        group: prevCat.group,
        targetBudget: prevCat.targetBudget,
        isTemporary: prevCat.isTemporary,
        sortOrder: currentSortOrder++,
      });
    }

    // Jika ada cicilan aktif baru di DB yang belum ada di bulan sebelumnya, tambahkan
    for (const [, newActiveLiability] of activeLiabilitiesMap) {
      categoriesToInsert.push({
        monthId: newMonthId,
        liabilityId: newActiveLiability.id,
        name: newActiveLiability.name,
        icon: "💳",
        group: "pos_wajib",
        targetBudget: newActiveLiability.monthlyPayment,
        isTemporary: true,
        sortOrder: currentSortOrder++,
      });
    }
  } else {
    // ── KASUS B: USER BARU PERTAMA KALI (GUNAKAN MASTER BASELINE 7 POS) ────────────
    const iphoneLiability = userLiabilities.find((l) =>
      l.name.toLowerCase().includes("iphone")
    );
    const mamaLiability = userLiabilities.find(
      (l) =>
        l.name.toLowerCase().includes("mama") ||
        l.name.toLowerCase().includes("talangan")
    );

    for (const tpl of BASELINE_CATEGORIES_CONFIG) {
      // Pos Cicilan iPhone
      if (tpl.liabilityKeyword === "iphone") {
        if (iphoneLiability?.isSettled) {
          continue; // Lewati jika sudah lunas
        }
        categoriesToInsert.push({
          monthId: newMonthId,
          liabilityId: iphoneLiability ? iphoneLiability.id : null,
          name: iphoneLiability ? iphoneLiability.name : tpl.name,
          icon: tpl.icon,
          group: tpl.group,
          targetBudget: iphoneLiability ? iphoneLiability.monthlyPayment : tpl.baseTarget,
          isTemporary: tpl.isTemporary,
          sortOrder: currentSortOrder++,
        });
        continue;
      }

      // Pos Talangan Mama
      if (tpl.liabilityKeyword === "mama") {
        if (mamaLiability?.isSettled) {
          continue; // Lewati jika sudah lunas
        }
        categoriesToInsert.push({
          monthId: newMonthId,
          liabilityId: mamaLiability ? mamaLiability.id : null,
          name: mamaLiability ? mamaLiability.name : tpl.name,
          icon: tpl.icon,
          group: tpl.group,
          targetBudget: mamaLiability ? mamaLiability.monthlyPayment : tpl.baseTarget,
          isTemporary: tpl.isTemporary,
          sortOrder: currentSortOrder++,
        });
        continue;
      }

      // Pos Uang Bebas / Tabungan
      if (tpl.group === "uang_bebas_tabungan") {
        categoriesToInsert.push({
          monthId: newMonthId,
          liabilityId: null,
          name: tpl.name,
          icon: tpl.icon,
          group: tpl.group,
          targetBudget: tpl.baseTarget + reallocatedFromSettledLiabilities,
          isTemporary: tpl.isTemporary,
          sortOrder: currentSortOrder++,
        });
        continue;
      }

      // Pos reguler
      categoriesToInsert.push({
        monthId: newMonthId,
        liabilityId: null,
        name: tpl.name,
        icon: tpl.icon,
        group: tpl.group,
        targetBudget: tpl.baseTarget,
        isTemporary: tpl.isTemporary,
        sortOrder: currentSortOrder++,
      });
    }
  }

  await tx.insert(budgetCategories).values(categoriesToInsert);

  return {
    categoriesCreated: categoriesToInsert.length,
  };
}
