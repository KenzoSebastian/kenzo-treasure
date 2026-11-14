/**
 * ==============================================================================
 * Kenzo Treasury — Database Queries: Budget Categories (Fase B8)
 * ==============================================================================
 */

import { resolveAuthenticatedUserId, getMonthDetailById } from "./months";
import type { ActionResponse, CategoryDetailItem } from "@/types";

/**
 * Mengambil daftar pos anggaran untuk bulan tertentu beserta agregasi
 * `spentAmount`, `remainingBudget`, `status`, dan log transaksi hariannya.
 */
export async function getCategoriesByMonth(
  monthId: string,
  explicitUserId?: string
): Promise<ActionResponse<CategoryDetailItem[]>> {
  const userId = await resolveAuthenticatedUserId(explicitUserId);
  if (!userId) {
    return {
      success: false,
      error: "Pengguna tidak terautentikasi. Silakan login terlebih dahulu.",
    };
  }

  try {
    const monthDetailRes = await getMonthDetailById(monthId, userId);
    if (!monthDetailRes.success) {
      return {
        success: false,
        error: monthDetailRes.error,
      };
    }

    return {
      success: true,
      data: monthDetailRes.data.categories,
    };
  } catch (err) {
    console.error("Gagal memuat pos anggaran bulanan:", err);
    return {
      success: false,
      error: "Gagal memuat daftar pos anggaran bulanan.",
    };
  }
}
