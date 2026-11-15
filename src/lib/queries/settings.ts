import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  months,
  savingsAccount,
  userBudgetTemplates,
  users,
  type UserBudgetTemplate,
} from "@/db/schema";
import { DEFAULT_EMERGENCY_FUND_TARGET } from "@/lib/financial-calculations";
import { resolveAuthenticatedUserId } from "./months";

export interface UserFinanceSetup {
  name: string;
  defaultBaseSalary: number | null;
  onboardingCompletedAt: Date | null;
  emergencyFundTarget: number;
  emergencyFundBalance: number;
  balance: number;
  templates: UserBudgetTemplate[];
  templatesCount: number;
  monthsCount: number;
}

/**
 * Mengambil seluruh daftar template pos anggaran milik pengguna.
 */
export async function getUserBudgetTemplates(
  explicitUserId?: string
): Promise<UserBudgetTemplate[]> {
  const userId = await resolveAuthenticatedUserId(explicitUserId);
  if (!userId) {
    return [];
  }

  try {
    const rows = await db
      .select()
      .from(userBudgetTemplates)
      .where(eq(userBudgetTemplates.userId, userId))
      .orderBy(
        asc(userBudgetTemplates.sortOrder),
        asc(userBudgetTemplates.createdAt)
      );

    return rows;
  } catch (err) {
    console.error("Gagal mengambil template pos anggaran:", err);
    return [];
  }
}

/**
 * Mengambil konfigurasi finansial dasar pengguna untuk halaman Pengaturan & Onboarding.
 */
export async function getUserFinanceSetup(
  explicitUserId?: string
): Promise<UserFinanceSetup | null> {
  const userId = await resolveAuthenticatedUserId(explicitUserId);
  if (!userId) {
    return null;
  }

  try {
    const [[userRow], [savingsRow], templates, userMonths] = await Promise.all([
      db
        .select({
          fullName: users.fullName,
          email: users.email,
          defaultBaseSalary: users.defaultBaseSalary,
          onboardingCompletedAt: users.onboardingCompletedAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
      db
        .select()
        .from(savingsAccount)
        .where(eq(savingsAccount.userId, userId))
        .limit(1),
      db
        .select()
        .from(userBudgetTemplates)
        .where(eq(userBudgetTemplates.userId, userId))
        .orderBy(
          asc(userBudgetTemplates.sortOrder),
          asc(userBudgetTemplates.createdAt)
        ),
      db
        .select({ id: months.id })
        .from(months)
        .where(eq(months.userId, userId)),
    ]);

    return {
      name:
        userRow?.fullName ||
        userRow?.email?.split("@")[0] ||
        "Pengguna",
      defaultBaseSalary: userRow?.defaultBaseSalary ?? null,
      onboardingCompletedAt: userRow?.onboardingCompletedAt ?? null,
      emergencyFundTarget:
        savingsRow?.emergencyFundTarget ?? DEFAULT_EMERGENCY_FUND_TARGET,
      emergencyFundBalance: savingsRow?.emergencyFundBalance ?? 0,
      balance: savingsRow?.balance ?? 0,
      templates,
      templatesCount: templates.length,
      monthsCount: userMonths.length,
    };
  } catch (err) {
    console.error("Gagal memuat pengaturan finansial pengguna:", err);
    return null;
  }
}
