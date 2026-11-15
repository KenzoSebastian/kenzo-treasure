"use server";

/**
 * ==============================================================================
 * Kenzo Treasury — Server Actions: Multi-Step Onboarding Wizard (Fase R10)
 * ==============================================================================
 *
 * Mengelola penyimpanan bertahap pada 5 langkah `/onboarding`:
 * 1. `saveOnboardingSalary`: Menyimpan `users.defaultBaseSalary`.
 * 2. `saveOnboardingTemplates`: Menyimpan daftar `user_budget_templates` pribadi
 *    (maksimal 1 pos kelompok `uang_bebas_tabungan`).
 * 3. `applyNeutralPresetTemplates`: Menerapkan contoh preset netral 50/30/20.
 * 4. `saveOnboardingVaultAndLiability`: Menyimpan saldo/target brankas dana darurat
 *    dan opsional cicilan awal ke tabel `liabilities`.
 * 5. `completeOnboarding`: Menandai `users.onboardingCompletedAt = new Date()`.
 */

import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  userBudgetTemplates,
  savingsAccount,
  liabilities,
  type UserBudgetTemplate,
} from "@/db/schema";
import {
  onboardingSalaryStepSchema,
  onboardingTemplatesStepSchema,
  onboardingVaultAndLiabilityStepSchema,
  onboardingSchema,
  type OnboardingSalaryStepInput,
  type OnboardingTemplatesStepInput,
  type OnboardingVaultAndLiabilityStepInput,
  type OnboardingInput,
} from "@/schemas/onboarding.schema";
import { resolveCategoryIconKey } from "@/lib/category-icons";
import {
  buildNeutralPresetTemplates,
  generateMonthCategories,
  INDONESIAN_MONTH_NAMES,
} from "@/lib/month-generator";
import { resolveDefaultCycleDate } from "@/lib/financial-calculations";
import { months, incomes } from "@/db/schema";
import { resolveAuthenticatedUserId } from "@/lib/queries/months";
import { revalidateDashboardRoutes } from "@/lib/revalidate";
import type { ActionResponse } from "@/types";

/* ══════════════════════════════════════════════════════════════════════════════
   1. SERVER ACTION: saveOnboardingSalary (Step 2)
   ══════════════════════════════════════════════════════════════════════════════ */

export async function saveOnboardingSalary(
  input: OnboardingSalaryStepInput,
  explicitUserId?: string
): Promise<ActionResponse<{ defaultBaseSalary: number }>> {
  try {
    const parsed = onboardingSalaryStepSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ??
          "Nominal gaji pokok awal tidak valid.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi.",
      };
    }

    await db
      .update(users)
      .set({
        defaultBaseSalary: parsed.data.defaultBaseSalary,
      })
      .where(eq(users.id, userId));

    revalidateDashboardRoutes();

    return {
      success: true,
      data: { defaultBaseSalary: parsed.data.defaultBaseSalary },
    };
  } catch (err) {
    console.error("Gagal menyimpan gaji pokok onboarding:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat menyimpan gaji pokok.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   2. SERVER ACTION: saveOnboardingTemplates (Step 3)
   ══════════════════════════════════════════════════════════════════════════════ */

export async function saveOnboardingTemplates(
  input: OnboardingTemplatesStepInput,
  explicitUserId?: string
): Promise<ActionResponse<UserBudgetTemplate[]>> {
  try {
    const parsed = onboardingTemplatesStepSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ??
          "Data template pos anggaran tidak valid.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi.",
      };
    }

    const saved = await db.transaction(async (tx) => {
      await tx
        .delete(userBudgetTemplates)
        .where(eq(userBudgetTemplates.userId, userId));

      if (parsed.data.templates.length === 0) {
        return [] as UserBudgetTemplate[];
      }

      const values = parsed.data.templates.map((tpl, idx) => ({
        userId,
        name: tpl.name.trim(),
        icon: resolveCategoryIconKey(tpl.icon, tpl.group, null),
        group: tpl.group,
        targetBudget: tpl.targetBudget,
        sortOrder: tpl.sortOrder ?? idx + 1,
      }));

      return tx.insert(userBudgetTemplates).values(values).returning();
    });

    revalidateDashboardRoutes();

    return {
      success: true,
      data: saved,
    };
  } catch (err) {
    console.error("Gagal menyimpan template pos anggaran onboarding:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat menyimpan template pos anggaran.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   3. SERVER ACTION: applyNeutralPresetTemplates (Preset 50/30/20)
   ══════════════════════════════════════════════════════════════════════════════ */

export async function applyNeutralPresetTemplates(
  baseSalaryArg?: number,
  explicitUserId?: string
): Promise<ActionResponse<UserBudgetTemplate[]>> {
  try {
    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi.",
      };
    }

    let resolvedSalary = baseSalaryArg;
    if (resolvedSalary === undefined) {
      const [userRow] = await db
        .select({ defaultBaseSalary: users.defaultBaseSalary })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      resolvedSalary = userRow?.defaultBaseSalary ?? 0;
    }

    const presets = buildNeutralPresetTemplates(resolvedSalary ?? 0);

    const saved = await db.transaction(async (tx) => {
      await tx
        .delete(userBudgetTemplates)
        .where(eq(userBudgetTemplates.userId, userId));

      return tx
        .insert(userBudgetTemplates)
        .values(
          presets.map((item) => ({
            userId,
            name: item.name,
            icon: item.icon,
            group: item.group,
            targetBudget: item.targetBudget,
            sortOrder: item.sortOrder,
          }))
        )
        .returning();
    });

    revalidateDashboardRoutes();

    return {
      success: true,
      data: saved,
    };
  } catch (err) {
    console.error("Gagal menerapkan preset template 50/30/20:", err);
    return {
      success: false,
      error: "Gagal menerapkan contoh template pos anggaran netral.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   4. SERVER ACTION: saveOnboardingVaultAndLiability (Step 4)
   ══════════════════════════════════════════════════════════════════════════════ */

export async function saveOnboardingVaultAndLiability(
  input: OnboardingVaultAndLiabilityStepInput,
  explicitUserId?: string
): Promise<
  ActionResponse<{
    balance: number;
    emergencyFundTarget: number;
    liabilityCreated: boolean;
  }>
> {
  try {
    const parsed = onboardingVaultAndLiabilityStepSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ??
          "Data brankas atau cicilan awal tidak valid.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi.",
      };
    }

    const { currentBalance, emergencyFundTarget, initialLiability } =
      parsed.data;

    let liabilityCreated = false;

    await db.transaction(async (tx) => {
      await tx
        .insert(savingsAccount)
        .values({
          userId,
          balance: currentBalance,
          emergencyFundTarget,
          emergencyFundBalance: 0,
        })
        .onConflictDoUpdate({
          target: savingsAccount.userId,
          set: {
            balance: currentBalance,
            emergencyFundTarget,
            updatedAt: new Date(),
          },
        });

      if (initialLiability) {
        const [existingSameName] = await tx
          .select({ id: liabilities.id })
          .from(liabilities)
          .where(
            and(
              eq(liabilities.userId, userId),
              eq(liabilities.name, initialLiability.name.trim())
            )
          )
          .limit(1);

        if (!existingSameName) {
          const isSettled =
            initialLiability.paidAmount >= initialLiability.totalAmount;
          await tx.insert(liabilities).values({
            userId,
            name: initialLiability.name.trim(),
            icon: resolveCategoryIconKey(
              initialLiability.icon,
              "pos_wajib",
              "liability"
            ),
            totalAmount: initialLiability.totalAmount,
            paidAmount: initialLiability.paidAmount,
            monthlyPayment: initialLiability.monthlyPayment,
            totalMonths:
              initialLiability.totalMonths ??
              Math.ceil(
                Math.max(
                  1,
                  initialLiability.totalAmount / initialLiability.monthlyPayment
                )
              ),
            isSettled,
          });
          liabilityCreated = true;
        }
      }
    });

    revalidateDashboardRoutes();

    return {
      success: true,
      data: {
        balance: currentBalance,
        emergencyFundTarget,
        liabilityCreated,
      },
    };
  } catch (err) {
    console.error("Gagal menyimpan brankas & cicilan onboarding:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat menyimpan data brankas & cicilan awal.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   5. SERVER ACTION: completeOnboarding & skipOnboarding (Step 5)
   ══════════════════════════════════════════════════════════════════════════════ */

export async function skipOnboarding(
  explicitUserId?: string
): Promise<ActionResponse<{ skippedAt: string }>> {
  try {
    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi.",
      };
    }

    const now = new Date();
    await db
      .update(users)
      .set({
        onboardingCompletedAt: now,
      })
      .where(eq(users.id, userId));

    revalidateDashboardRoutes();

    return {
      success: true,
      data: { skippedAt: now.toISOString() },
    };
  } catch (err) {
    console.error("Gagal melewati onboarding:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat melewati setup awal.",
    };
  }
}

export async function completeOnboarding(
  payloadOrUserId?: OnboardingInput | string,
  explicitUserId?: string
): Promise<ActionResponse<{ completedAt: string }>> {
  try {
    const resolvedExplicitUserId =
      typeof payloadOrUserId === "string" ? payloadOrUserId : explicitUserId;
    const payload =
      typeof payloadOrUserId === "object" && payloadOrUserId !== null
        ? payloadOrUserId
        : undefined;

    const userId = await resolveAuthenticatedUserId(resolvedExplicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi.",
      };
    }

    const now = new Date();

    if (payload) {
      const parsed = onboardingSchema.safeParse(payload);
      if (!parsed.success) {
        return {
          success: false,
          error:
            parsed.error.issues[0]?.message ??
            "Data konfigurasi onboarding tidak valid.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        };
      }

      const {
        defaultBaseSalary,
        emergencyFundTarget,
        budgetTemplates,
        liabilities: initialLiabilities,
        createInitialMonth,
      } = parsed.data;

      await db.transaction(async (tx) => {
        await tx
          .update(users)
          .set({
            defaultBaseSalary,
            onboardingCompletedAt: now,
          })
          .where(eq(users.id, userId));

        await tx
          .insert(savingsAccount)
          .values({
            userId,
            balance: 0,
            emergencyFundTarget,
            emergencyFundBalance: 0,
          })
          .onConflictDoUpdate({
            target: savingsAccount.userId,
            set: {
              emergencyFundTarget,
              updatedAt: now,
            },
          });

        if (budgetTemplates.length > 0) {
          await tx
            .delete(userBudgetTemplates)
            .where(eq(userBudgetTemplates.userId, userId));

          await tx.insert(userBudgetTemplates).values(
            budgetTemplates.map((tpl, idx) => ({
              userId,
              name: tpl.name.trim(),
              icon: resolveCategoryIconKey(tpl.icon, tpl.group, null),
              group: tpl.group,
              targetBudget: tpl.targetBudget,
              sortOrder: tpl.sortOrder ?? idx + 1,
            }))
          );
        }

        if (initialLiabilities.length > 0) {
          for (const liab of initialLiabilities) {
            const isSettled = liab.paidAmount >= liab.totalAmount;
            await tx.insert(liabilities).values({
              userId,
              name: liab.name.trim(),
              icon: resolveCategoryIconKey(
                liab.icon,
                "pos_wajib",
                "liability"
              ),
              totalAmount: liab.totalAmount,
              paidAmount: liab.paidAmount,
              monthlyPayment: liab.monthlyPayment,
              totalMonths:
                liab.totalMonths ??
                Math.ceil(Math.max(1, liab.totalAmount / liab.monthlyPayment)),
              isSettled,
            });
          }
        }

        if (createInitialMonth) {
          const [existingMonth] = await tx
            .select({ id: months.id })
            .from(months)
            .where(eq(months.userId, userId))
            .limit(1);

          if (!existingMonth) {
            const todayStr = resolveDefaultCycleDate();
            const [yStr, mStr] = todayStr.split("-");
            const year = Number(yStr);
            const monthIndex = Number(mStr);
            const monthName = `${INDONESIAN_MONTH_NAMES[monthIndex - 1]} ${year}`;

            const [createdMonth] = await tx
              .insert(months)
              .values({
                userId,
                name: monthName,
                year,
                monthIndex,
                isClosed: false,
              })
              .returning();

            if (defaultBaseSalary > 0) {
              await tx.insert(incomes).values({
                userId,
                monthId: createdMonth.id,
                source: "Gaji Pokok Bulanan",
                amount: defaultBaseSalary,
                date: todayStr,
                isBaseSalary: true,
              });
            }

            await generateMonthCategories({
              tx,
              userId,
              newMonthId: createdMonth.id,
              year,
              monthIndex,
              baseSalary: defaultBaseSalary,
            });
          }
        }
      });

      revalidateDashboardRoutes();

      return {
        success: true,
        data: { completedAt: now.toISOString() },
      };
    }

    await db
      .update(users)
      .set({
        onboardingCompletedAt: now,
      })
      .where(eq(users.id, userId));

    // Pastikan savingsAccount sudah terinisialisasi
    await db
      .insert(savingsAccount)
      .values({
        userId,
        balance: 0,
        emergencyFundTarget: 0,
        emergencyFundBalance: 0,
      })
      .onConflictDoNothing();

    // Urutkan ulang sortOrder template jika ada
    const templates = await db
      .select()
      .from(userBudgetTemplates)
      .where(eq(userBudgetTemplates.userId, userId))
      .orderBy(asc(userBudgetTemplates.sortOrder));

    if (templates.length > 0) {
      await db.transaction(async (tx) => {
        for (let i = 0; i < templates.length; i++) {
          await tx
            .update(userBudgetTemplates)
            .set({ sortOrder: i + 1, updatedAt: new Date() })
            .where(eq(userBudgetTemplates.id, templates[i].id));
        }
      });
    }

    revalidateDashboardRoutes();

    return {
      success: true,
      data: { completedAt: now.toISOString() },
    };
  } catch (err) {
    console.error("Gagal menyelesaikan onboarding:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat menyelesaikan setup awal.",
    };
  }
}
