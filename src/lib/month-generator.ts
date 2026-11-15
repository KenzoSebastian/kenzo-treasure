/**
 * ==============================================================================
 * Kenzo Treasury — Domain Service: Month & Budget Category Generator
 * ==============================================================================
 *
 * Memisahkan logika domain pembuatan pos anggaran bulanan dari Server Actions:
 * 1. 100% Database-Driven & Zero Dummy Data: Seluruh nominal cicilan (`monthlyPayment`),
 *    status lunas (`isSettled`), serta template pos anggaran (`user_budget_templates`)
 *    dibaca langsung dari database tanpa hardcode angka atau data pribadi.
 * 2. Kasus A (Inheritance Bulan Sebelumnya): Mewarisi susunan pos anggaran dari bulan
 *    terakhir, meng-exclude pos sementara (`isTemporary = true` tanpa cicilan aktif)
 *    maupun cicilan yang baru lunas (`isSettled = true`), serta merelokasi kuota cicilan
 *    yang lunas dari bulan tersebut ke pos `uang_bebas_tabungan`.
 * 3. Kasus B (Bulan Pertama Pengguna Baru): Menggunakan `user_budget_templates` milik
 *    pengguna (atau fallback netral tunggal `Uang Bebas / Tabungan` sebesar `baseSalary`
 *    dikurangi komitmen cicilan aktif).
 */

import { eq, ne, and, desc, asc } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  months,
  budgetCategories,
  liabilities,
  userBudgetTemplates,
} from "@/db/schema";
import * as schema from "@/db/schema";
import { resolveCategoryIconKey } from "@/lib/category-icons";

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

export const DEFAULT_BASE_SALARY = 0;

export interface NeutralPresetTemplateSpec {
  name: string;
  icon: string;
  group: "pos_wajib" | "kebutuhan" | "uang_bebas_tabungan";
  percentage: number;
  sortOrder: number;
}

/**
 * 6 template preset netral untuk tombol cepat di Onboarding & Pengaturan.
 */
export const NEUTRAL_PRESET_TEMPLATES: NeutralPresetTemplateSpec[] = [
  {
    name: "Kebutuhan Pokok",
    icon: "utensils",
    group: "kebutuhan",
    percentage: 30,
    sortOrder: 1,
  },
  {
    name: "Hunian & Utilitas",
    icon: "home",
    group: "pos_wajib",
    percentage: 20,
    sortOrder: 2,
  },
  {
    name: "Transportasi & BBM",
    icon: "fuel",
    group: "kebutuhan",
    percentage: 10,
    sortOrder: 3,
  },
  {
    name: "Komitmen & Tagihan",
    icon: "receipt",
    group: "pos_wajib",
    percentage: 10,
    sortOrder: 4,
  },
  {
    name: "Sosial & Keluarga",
    icon: "users",
    group: "pos_wajib",
    percentage: 10,
    sortOrder: 5,
  },
  {
    name: "Uang Bebas / Tabungan",
    icon: "wallet",
    group: "uang_bebas_tabungan",
    percentage: 20,
    sortOrder: 6,
  },
];

export interface GeneratedCategoryInsert {
  monthId: string;
  liabilityId: string | null;
  name: string;
  icon: string;
  group: "pos_wajib" | "kebutuhan" | "uang_bebas_tabungan";
  targetBudget: number;
  isTemporary: boolean;
  sortOrder: number;
}

export interface NeutralPresetTemplateRow {
  userId: string;
  name: string;
  icon: string;
  group: "pos_wajib" | "kebutuhan" | "uang_bebas_tabungan";
  targetBudget: number;
  sortOrder: number;
  isActive: boolean;
}

/**
 * Membangun daftar template pos anggaran dari 6 preset netral.
 * Mendukung argumen `userId` (string -> targetBudget 0) maupun `baseSalary` (number).
 */
export function buildNeutralPresetTemplates(
  userIdOrBaseSalary: string | number = 0,
  maybeBaseSalary?: number
): NeutralPresetTemplateRow[] {
  const userId =
    typeof userIdOrBaseSalary === "string" ? userIdOrBaseSalary : "";
  const rawSalary =
    typeof userIdOrBaseSalary === "number"
      ? userIdOrBaseSalary
      : (maybeBaseSalary ?? 0);
  const safeSalary = Math.max(0, Math.round(rawSalary));

  let allocatedNonFree = 0;

  return NEUTRAL_PRESET_TEMPLATES.map((spec) => {
    if (spec.group === "uang_bebas_tabungan") {
      const freeBudget =
        safeSalary > 0 ? Math.max(0, safeSalary - allocatedNonFree) : 0;
      return {
        userId,
        name: spec.name,
        icon: spec.icon,
        group: spec.group,
        targetBudget: freeBudget,
        sortOrder: spec.sortOrder,
        isActive: true,
      };
    }

    const target =
      safeSalary > 0 ? Math.round((safeSalary * spec.percentage) / 100) : 0;
    allocatedNonFree += target;

    return {
      userId,
      name: spec.name,
      icon: spec.icon,
      group: spec.group,
      targetBudget: target,
      sortOrder: spec.sortOrder,
      isActive: true,
    };
  });
}

export interface InheritedCategorySource {
  id?: string;
  liabilityId: string | null;
  name: string;
  icon: string | null;
  group: "pos_wajib" | "kebutuhan" | "uang_bebas_tabungan";
  targetBudget: number;
  isTemporary: boolean;
  sortOrder: number;
}

export interface InheritedLiabilitySource {
  id: string;
  name: string;
  icon?: string | null;
  monthlyPayment: number;
  isSettled?: boolean;
}

/**
 * KASUS A (Pure Function): Mewarisi susunan pos dari bulan sebelumnya
 * dengan relokasi cicilan lunas yang hanya berasal dari bulan sebelumnya
 * serta pemotongan `Uang Bebas` untuk cicilan aktif baru.
 */
export function buildInheritedMonthCategories(params: {
  newMonthId: string;
  baseSalary?: number;
  previousCategories?: InheritedCategorySource[];
  prevCategories?: InheritedCategorySource[];
  liabilities?: InheritedLiabilitySource[];
  activeLiabilities?: InheritedLiabilitySource[];
}): GeneratedCategoryInsert[] {
  const { newMonthId } = params;
  const previousCategories =
    params.previousCategories ?? params.prevCategories ?? [];
  const userLiabilities =
    params.liabilities ?? params.activeLiabilities ?? [];

  const liabilityById = new Map(userLiabilities.map((l) => [l.id, l]));
  const activeLiabilitiesMap = new Map(
    userLiabilities.filter((l) => !l.isSettled).map((l) => [l.id, l])
  );

  const prevLiabilityIds = new Set<string>();
  let reallocatedFromRetiredCategories = 0;

  for (const prevCat of previousCategories) {
    if (prevCat.liabilityId) {
      prevLiabilityIds.add(prevCat.liabilityId);
      const isStillActive = activeLiabilitiesMap.has(prevCat.liabilityId);
      if (!isStillActive) {
        const settledRow = liabilityById.get(prevCat.liabilityId);
        reallocatedFromRetiredCategories +=
          settledRow?.monthlyPayment ?? prevCat.targetBudget;
      }
    } else if (prevCat.isTemporary) {
      // Pos reguler yang ditandai "Hentikan Mulai Bulan Depan"
      reallocatedFromRetiredCategories += prevCat.targetBudget;
    }
  }

  let newLiabilitiesMonthlySum = 0;
  for (const [id, activeLiability] of activeLiabilitiesMap) {
    if (!prevLiabilityIds.has(id)) {
      newLiabilitiesMonthlySum += activeLiability.monthlyPayment;
    }
  }

  const categoriesToInsert: GeneratedCategoryInsert[] = [];
  let currentSortOrder = 1;
  let hasInsertedFreeCategory = false;

  for (const prevCat of previousCategories) {
    // 1. Lewati pos cicilan yang sudah lunas / tidak lagi aktif
    if (prevCat.liabilityId && !activeLiabilitiesMap.has(prevCat.liabilityId)) {
      continue;
    }

    // 2. Lewati pos reguler yang dihentikan mulai bulan depan (`isTemporary = true` tanpa `liabilityId`)
    if (!prevCat.liabilityId && prevCat.isTemporary) {
      continue;
    }

    // 3. Pos Uang Bebas / Tabungan (maksimal 1 per bulan)
    if (prevCat.group === "uang_bebas_tabungan") {
      if (hasInsertedFreeCategory) {
        continue;
      }
      hasInsertedFreeCategory = true;

      const adjustedFreeTarget = Math.max(
        0,
        prevCat.targetBudget +
          reallocatedFromRetiredCategories -
          newLiabilitiesMonthlySum
      );

      categoriesToInsert.push({
        monthId: newMonthId,
        liabilityId: null,
        name: prevCat.name,
        icon: resolveCategoryIconKey(prevCat.icon, "uang_bebas_tabungan", null),
        group: "uang_bebas_tabungan",
        targetBudget: adjustedFreeTarget,
        isTemporary: false,
        sortOrder: currentSortOrder++,
      });
      continue;
    }

    // 4. Pos yang terikat pada cicilan aktif
    if (prevCat.liabilityId && activeLiabilitiesMap.has(prevCat.liabilityId)) {
      const activeLiability = activeLiabilitiesMap.get(prevCat.liabilityId)!;
      categoriesToInsert.push({
        monthId: newMonthId,
        liabilityId: prevCat.liabilityId,
        name: activeLiability.name,
        icon: resolveCategoryIconKey(
          activeLiability.icon ?? prevCat.icon,
          "pos_wajib",
          activeLiability.id
        ),
        group: "pos_wajib",
        targetBudget: activeLiability.monthlyPayment,
        isTemporary: true,
        sortOrder: currentSortOrder++,
      });
      activeLiabilitiesMap.delete(prevCat.liabilityId);
      continue;
    }

    // 5. Pos reguler lainnya
    categoriesToInsert.push({
      monthId: newMonthId,
      liabilityId: null,
      name: prevCat.name,
      icon: resolveCategoryIconKey(prevCat.icon, prevCat.group, null),
      group: prevCat.group,
      targetBudget: prevCat.targetBudget,
      isTemporary: false,
      sortOrder: currentSortOrder++,
    });
  }

  // Tambahkan cicilan aktif baru yang belum ada di bulan sebelumnya
  for (const [, newActiveLiability] of activeLiabilitiesMap) {
    categoriesToInsert.push({
      monthId: newMonthId,
      liabilityId: newActiveLiability.id,
      name: newActiveLiability.name,
      icon: resolveCategoryIconKey(
        newActiveLiability.icon,
        "pos_wajib",
        newActiveLiability.id
      ),
      group: "pos_wajib",
      targetBudget: newActiveLiability.monthlyPayment,
      isTemporary: true,
      sortOrder: currentSortOrder++,
    });
  }

  if (!hasInsertedFreeCategory) {
    categoriesToInsert.push({
      monthId: newMonthId,
      liabilityId: null,
      name: "Uang Bebas / Tabungan",
      icon: "wallet",
      group: "uang_bebas_tabungan",
      targetBudget: Math.max(
        0,
        reallocatedFromRetiredCategories - newLiabilitiesMonthlySum
      ),
      isTemporary: false,
      sortOrder: currentSortOrder++,
    });
  }

  return categoriesToInsert;
}

export interface InitialTemplateSource {
  name: string;
  icon: string | null;
  group: "pos_wajib" | "kebutuhan" | "uang_bebas_tabungan";
  targetBudget: number;
  sortOrder: number;
  isActive?: boolean;
}

/**
 * KASUS B (Pure Function): Inisialisasi Bulan 1 dari `user_budget_templates`
 * atau fallback tunggal `Uang Bebas / Tabungan` bila template kosong.
 */
export function buildInitialMonthCategories(params: {
  newMonthId: string;
  baseSalary: number;
  templates?: InitialTemplateSource[];
  userTemplates?: InitialTemplateSource[];
  activeLiabilities: InheritedLiabilitySource[];
}): GeneratedCategoryInsert[] {
  const { newMonthId, baseSalary, activeLiabilities } = params;
  const rawTemplates = params.templates ?? params.userTemplates ?? [];
  const templates = rawTemplates.filter((t) => t.isActive !== false);

  const unpaidLiabilities = activeLiabilities.filter((l) => !l.isSettled);
  const activeLiabilitiesSum = unpaidLiabilities.reduce(
    (sum, item) => sum + item.monthlyPayment,
    0
  );

  const categoriesToInsert: GeneratedCategoryInsert[] = [];
  let currentSortOrder = 1;

  if (templates.length > 0) {
    let hasInsertedFreeCategory = false;
    let nonFreeTemplatesSum = 0;

    for (const tpl of templates) {
      if (tpl.group === "uang_bebas_tabungan") {
        if (hasInsertedFreeCategory) {
          continue;
        }
        hasInsertedFreeCategory = true;
        categoriesToInsert.push({
          monthId: newMonthId,
          liabilityId: null,
          name: tpl.name,
          icon: resolveCategoryIconKey(tpl.icon, "uang_bebas_tabungan", null),
          group: "uang_bebas_tabungan",
          targetBudget: Math.max(0, tpl.targetBudget - activeLiabilitiesSum),
          isTemporary: false,
          sortOrder: currentSortOrder++,
        });
        continue;
      }

      nonFreeTemplatesSum += tpl.targetBudget;
      categoriesToInsert.push({
        monthId: newMonthId,
        liabilityId: null,
        name: tpl.name,
        icon: resolveCategoryIconKey(tpl.icon, tpl.group, null),
        group: tpl.group,
        targetBudget: tpl.targetBudget,
        isTemporary: false,
        sortOrder: currentSortOrder++,
      });
    }

    if (!hasInsertedFreeCategory) {
      const residualFreeTarget = Math.max(
        0,
        Math.round(baseSalary) - nonFreeTemplatesSum - activeLiabilitiesSum
      );
      categoriesToInsert.push({
        monthId: newMonthId,
        liabilityId: null,
        name: "Uang Bebas / Tabungan",
        icon: "wallet",
        group: "uang_bebas_tabungan",
        targetBudget: residualFreeTarget,
        isTemporary: false,
        sortOrder: currentSortOrder++,
      });
    }
  } else {
    // Fallback netral tunggal saat pengguna belum merancang template pos
    categoriesToInsert.push({
      monthId: newMonthId,
      liabilityId: null,
      name: "Uang Bebas / Tabungan",
      icon: "wallet",
      group: "uang_bebas_tabungan",
      targetBudget: Math.max(0, Math.round(baseSalary) - activeLiabilitiesSum),
      isTemporary: false,
      sortOrder: currentSortOrder++,
    });
  }

  for (const liability of unpaidLiabilities) {
    categoriesToInsert.push({
      monthId: newMonthId,
      liabilityId: liability.id,
      name: liability.name,
      icon: resolveCategoryIconKey(liability.icon, "pos_wajib", liability.id),
      group: "pos_wajib",
      targetBudget: liability.monthlyPayment,
      isTemporary: true,
      sortOrder: currentSortOrder++,
    });
  }

  return categoriesToInsert;
}

interface GenerateMonthCategoriesParams {
  tx: PostgresJsDatabase<typeof schema>;
  userId: string;
  newMonthId: string;
  year: number;
  monthIndex: number;
  baseSalary?: number;
}

/**
 * Generator pos anggaran bulanan berbasis database:
 * - KASUS A (`previousCategories.length > 0`): mewarisi pos bulan sebelumnya.
 * - KASUS B (`previousCategories.length === 0`): membaca `user_budget_templates`
 *   atau membuat 1 pos netral `Uang Bebas / Tabungan`.
 */
export async function generateMonthCategories({
  tx,
  userId,
  newMonthId,
  baseSalary = 0,
}: GenerateMonthCategoriesParams): Promise<{ categoriesCreated: number }> {
  // 1. Ambil seluruh data cicilan/utang aktual milik pengguna dari database (tanpa auto-seed dummy)
  const userLiabilities = await tx
    .select()
    .from(liabilities)
    .where(eq(liabilities.userId, userId))
    .orderBy(asc(liabilities.createdAt));

  // 2. Periksa apakah pengguna memiliki siklus bulan sebelumnya di database
  const [previousMonth] = await tx
    .select()
    .from(months)
    .where(and(eq(months.userId, userId), ne(months.id, newMonthId)))
    .orderBy(desc(months.year), desc(months.monthIndex))
    .limit(1);

  let previousCategories: (typeof budgetCategories.$inferSelect)[] = [];
  if (previousMonth) {
    previousCategories = await tx
      .select()
      .from(budgetCategories)
      .where(eq(budgetCategories.monthId, previousMonth.id))
      .orderBy(asc(budgetCategories.sortOrder));
  }

  let categoriesToInsert: GeneratedCategoryInsert[];

  if (previousCategories.length > 0) {
    categoriesToInsert = buildInheritedMonthCategories({
      newMonthId,
      previousCategories,
      liabilities: userLiabilities,
    });
  } else {
    const templates = await tx
      .select()
      .from(userBudgetTemplates)
      .where(eq(userBudgetTemplates.userId, userId))
      .orderBy(
        asc(userBudgetTemplates.sortOrder),
        asc(userBudgetTemplates.createdAt)
      );

    categoriesToInsert = buildInitialMonthCategories({
      newMonthId,
      baseSalary,
      templates,
      activeLiabilities: userLiabilities.filter((l) => !l.isSettled),
    });
  }

  await tx.insert(budgetCategories).values(categoriesToInsert);

  return {
    categoriesCreated: categoriesToInsert.length,
  };
}
