"use server";

/**
 * ==============================================================================
 * Kenzo Treasury — Server Action: AI Monthly Review Engine (Fase B13)
 * ==============================================================================
 *
 * Menghasilkan evaluasi cerdas tutup buku bulanan (`generateMonthlyReview`):
 * - Menganalisis data cashflow bulan berjalan dari database.
 * - Mengidentifikasi pos paling hemat vs paling boros/overbudget, skor disiplin
 *   anggaran (0-100), dan rekomendasi alokasi bulan depan.
 * - Menggunakan `@google/genai` bila `GEMINI_API_KEY` tersedia, atau fallback
 *   ke mesin analisis finansial deterministik presisi tinggi.
 */

import {
  getGeminiClient,
  DEFAULT_GEMINI_MODEL,
  buildDeterministicMonthlyEvaluation,
} from "@/lib/ai/gemini";
import { formatRupiah } from "@/lib/financial-calculations";
import {
  resolveAuthenticatedUserId,
  getMonthDetailById,
} from "@/lib/queries/months";
import type { ActionResponse, MonthlyAiReview } from "@/types";

export async function generateMonthlyReview(
  monthId: string,
  explicitUserId?: string
): Promise<ActionResponse<MonthlyAiReview>> {
  if (!monthId || typeof monthId !== "string") {
    return {
      success: false,
      error: "ID siklus bulan wajib diisi.",
    };
  }

  const userId = await resolveAuthenticatedUserId(explicitUserId);
  if (!userId) {
    return {
      success: false,
      error: "Pengguna tidak terautentikasi. Silakan login terlebih dahulu.",
    };
  }

  try {
    const detailRes = await getMonthDetailById(monthId, userId);
    if (!detailRes.success) {
      return {
        success: false,
        error: detailRes.error,
      };
    }

    const baseEval = buildDeterministicMonthlyEvaluation(detailRes.data);
    const client = getGeminiClient();

    if (!client) {
      return {
        success: true,
        data: {
          ...baseEval,
          generatedBy: "deterministic-engine",
          modelUsed: "deterministic-rule-engine-v1",
          generatedAt: new Date().toISOString(),
        },
      };
    }

    try {
      const categoryBreakdown = detailRes.data.categories
        .map(
          (c) =>
            `- ${c.name}: Target ${formatRupiah(
              c.targetBudget
            )}, Terpakai ${formatRupiah(c.spentAmount)}, Sisa ${formatRupiah(
              c.remainingBudget
            )} (${c.status})`
        )
        .join("\n");

      const prompt = `Kamu adalah penasihat keuangan pribadi Kenzo Treasury.
Analisis data anggaran siklus ${detailRes.data.name} berikut dalam Bahasa Indonesia yang ringkas, taktis, dan bebas basa-basi:
- Total Pemasukan: ${formatRupiah(detailRes.data.totalIncome)}
- Total Pengeluaran: ${formatRupiah(detailRes.data.totalSpent)}
- Net Surplus/Defisit: ${formatRupiah(detailRes.data.netCashflow)}
- Skor Disiplin: ${baseEval.disciplineScore}/100

Rincian Pos Anggaran:
${categoryBreakdown}

Kembalikan tepat dalam format JSON murni dengan struktur:
{
  "executiveSummary": "1-2 kalimat evaluasi utama",
  "tacticalRecommendations": ["poin 1", "poin 2"],
  "nextMonthAllocationAdvice": ["saran alokasi 1", "saran alokasi 2"]
}`;

      const response = await client.models.generateContent({
        model: DEFAULT_GEMINI_MODEL,
        contents: prompt,
      });

      const rawText = response.text?.trim() ?? "";
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedJson = JSON.parse(jsonMatch[0]) as {
          executiveSummary?: string;
          tacticalRecommendations?: string[];
          nextMonthAllocationAdvice?: string[];
        };

        return {
          success: true,
          data: {
            ...baseEval,
            executiveSummary:
              parsedJson.executiveSummary || baseEval.executiveSummary,
            tacticalRecommendations:
              Array.isArray(parsedJson.tacticalRecommendations) &&
              parsedJson.tacticalRecommendations.length > 0
                ? parsedJson.tacticalRecommendations
                : baseEval.tacticalRecommendations,
            nextMonthAllocationAdvice:
              Array.isArray(parsedJson.nextMonthAllocationAdvice) &&
              parsedJson.nextMonthAllocationAdvice.length > 0
                ? parsedJson.nextMonthAllocationAdvice
                : baseEval.nextMonthAllocationAdvice,
            generatedBy: "gemini",
            modelUsed: DEFAULT_GEMINI_MODEL,
            generatedAt: new Date().toISOString(),
          },
        };
      }
    } catch (aiErr) {
      console.warn(
        "Gemini API fallback ke evaluasi deterministik:",
        aiErr instanceof Error ? aiErr.message : aiErr
      );
    }

    return {
      success: true,
      data: {
        ...baseEval,
        generatedBy: "deterministic-engine",
        modelUsed: DEFAULT_GEMINI_MODEL,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    console.error("Gagal membuat evaluasi bulanan AI:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat menganalisis laporan keuangan bulanan.",
    };
  }
}
