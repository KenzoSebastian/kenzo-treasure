"use server";

/**
 * ==============================================================================
 * Kenzo Treasury — Server Actions: Finite Liabilities & Installment Tracker (Fase B7)
 * ==============================================================================
 *
 * Mengelola seluruh mutasi utang/cicilan bertarget lunas (`liabilities`):
 * 1. `createLiability`: Menambah pos cicilan bertarget baru.
 * 2. `recordInstallmentPayment`: Mencatat pembayaran cicilan bulanan secara atomik,
 *    otomatis menandai `isSettled = true` jika `paidAmount >= totalAmount`, dan
 *    menandai pos kategori terkait agar pensiun di siklus bulan berikutnya.
 * 3. `updateLiability`: Memperbarui parameter cicilan.
 */

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { liabilities, budgetCategories } from "@/db/schema";
import {
  createLiabilitySchema,
  recordInstallmentSchema,
  updateLiabilitySchema,
  type CreateLiabilityInput,
  type RecordInstallmentInput,
  type UpdateLiabilityInput,
} from "@/schemas/liability.schema";
import { resolveAuthenticatedUserId } from "@/lib/queries/months";
import {
  getLiabilities,
  getLiabilityById,
  enrichLiabilityWithProgress,
} from "@/lib/queries/liabilities";
import type { ActionResponse, LiabilityWithProgress } from "@/types";

export { getLiabilities, getLiabilityById };

/* ══════════════════════════════════════════════════════════════════════════════
   1. SERVER ACTION: createLiability
   ══════════════════════════════════════════════════════════════════════════════ */

export async function createLiability(
  input: CreateLiabilityInput,
  explicitUserId?: string
): Promise<ActionResponse<LiabilityWithProgress>> {
  try {
    const parsed = createLiabilitySchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ?? "Validasi data cicilan gagal.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi. Silakan login terlebih dahulu.",
      };
    }

    const { name, totalAmount, monthlyPayment, totalMonths, paidAmount } =
      parsed.data;
    const isSettled = paidAmount >= totalAmount;

    const [created] = await db
      .insert(liabilities)
      .values({
        userId,
        name,
        totalAmount,
        paidAmount,
        monthlyPayment,
        totalMonths:
          totalMonths ?? Math.ceil(Math.max(1, totalAmount / monthlyPayment)),
        isSettled,
      })
      .returning();

    revalidatePath("/dashboard");

    return {
      success: true,
      data: enrichLiabilityWithProgress(created),
    };
  } catch (err) {
    console.error("Gagal membuat pos cicilan baru:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat menyimpan pos cicilan baru.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   2. SERVER ACTION: recordInstallmentPayment
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Mencatat pembayaran cicilan bulanan secara atomik:
 * - Mendukung pemanggilan:
 *   1. `recordInstallmentPayment(liabilityId, amount, transactionId?)`
 *   2. `recordInstallmentPayment({ liabilityId, amount, transactionId })`
 * - Meng-update `paidAmount` dan `isSettled = (paidAmount >= totalAmount)`.
 * - Meng-update pos kategori terkait (`isTemporary = true`) agar pensiun di bulan berikutnya.
 */
export async function recordInstallmentPayment(
  inputOrLiabilityId: string | RecordInstallmentInput,
  amountArg?: number,
  transactionIdArg?: string | null,
  explicitUserId?: string
): Promise<ActionResponse<LiabilityWithProgress>> {
  try {
    const rawPayload =
      typeof inputOrLiabilityId === "string"
        ? {
            liabilityId: inputOrLiabilityId,
            amount: amountArg,
            transactionId: transactionIdArg ?? null,
          }
        : inputOrLiabilityId;

    const parsed = recordInstallmentSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ??
          "Validasi nominal pembayaran cicilan gagal.",
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

    const { liabilityId, amount } = parsed.data;

    const updatedRecord = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(liabilities)
        .where(
          and(eq(liabilities.id, liabilityId), eq(liabilities.userId, userId))
        )
        .limit(1);

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      const nextPaidAmount = existing.paidAmount + amount;
      const nextIsSettled = nextPaidAmount >= existing.totalAmount;

      const [updated] = await tx
        .update(liabilities)
        .set({
          paidAmount: nextPaidAmount,
          isSettled: nextIsSettled,
          updatedAt: new Date(),
        })
        .where(
          and(eq(liabilities.id, liabilityId), eq(liabilities.userId, userId))
        )
        .returning();

      // Pastikan seluruh pos kategori terkait ditandai temporary agar pensiun saat bulan baru dibuat
      if (nextIsSettled) {
        await tx
          .update(budgetCategories)
          .set({
            isTemporary: true,
            updatedAt: new Date(),
          })
          .where(eq(budgetCategories.liabilityId, liabilityId));
      }

      return updated;
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      data: enrichLiabilityWithProgress(updatedRecord),
    };
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return {
        success: false,
        error: "Data cicilan tidak ditemukan atau bukan milik akun Anda.",
      };
    }
    console.error("Gagal mencatat pembayaran cicilan:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat mencatat pembayaran cicilan.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   3. SERVER ACTION: updateLiability
   ══════════════════════════════════════════════════════════════════════════════ */

export async function updateLiability(
  inputOrId: string | UpdateLiabilityInput,
  data?: Partial<Omit<UpdateLiabilityInput, "liabilityId">>,
  explicitUserId?: string
): Promise<ActionResponse<LiabilityWithProgress>> {
  try {
    const rawPayload =
      typeof inputOrId === "string"
        ? { liabilityId: inputOrId, ...(data ?? {}) }
        : inputOrId;

    const parsed = updateLiabilitySchema.safeParse(rawPayload);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ?? "Validasi pembaruan cicilan gagal.",
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

    const [existing] = await db
      .select()
      .from(liabilities)
      .where(
        and(
          eq(liabilities.id, parsed.data.liabilityId),
          eq(liabilities.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return {
        success: false,
        error: "Data cicilan tidak ditemukan.",
      };
    }

    const nextTotal = parsed.data.totalAmount ?? existing.totalAmount;
    const nextMonthly = parsed.data.monthlyPayment ?? existing.monthlyPayment;
    if (nextMonthly > nextTotal) {
      return {
        success: false,
        error: "Cicilan per bulan tidak boleh melebihi total kewajiban utang.",
      };
    }

    const nextIsSettled = existing.paidAmount >= nextTotal;

    const [updated] = await db
      .update(liabilities)
      .set({
        name: parsed.data.name ?? existing.name,
        totalAmount: nextTotal,
        monthlyPayment: nextMonthly,
        totalMonths:
          parsed.data.totalMonths !== undefined
            ? parsed.data.totalMonths
            : existing.totalMonths,
        isSettled: nextIsSettled,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(liabilities.id, parsed.data.liabilityId),
          eq(liabilities.userId, userId)
        )
      )
      .returning();

    revalidatePath("/dashboard");

    return {
      success: true,
      data: enrichLiabilityWithProgress(updated),
    };
  } catch (err) {
    console.error("Gagal memperbarui data cicilan:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat memperbarui data cicilan.",
    };
  }
}
