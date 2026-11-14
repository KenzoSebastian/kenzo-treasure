"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — AI Monthly Financial Review Modal (Fase F16)
 * ==============================================================================
 *
 * ── Kenapa komponen ini ada ───────────────────────────────────────────────────
 *
 * Menyediakan tombol trigger `[✨ Evaluasi Bulan Ini dengan AI]` dan modal dialog
 * review cerdas di panel siklus/penutupan buku bulanan:
 * - Animasi loading shimmering saat AI sedang menganalisis data (`generateMonthlyReview`).
 * - Kartu evaluasi pos paling hemat vs pos overbudget.
 * - Kartu skor disiplin finansial (`0–100` dengan `tabular-nums`).
 * - Rekomendasi taktis penyesuaian alokasi untuk bulan berikutnya.
 * - Terintegrasi dengan aksi `closeMonth` (Automatic Savings Sweep) & `reopenMonth`.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/financial-calculations";
import { generateMonthlyReview } from "@/actions/ai-review";
import { closeMonth, reopenMonth } from "@/actions/months";
import {
  buildDeterministicMonthlyEvaluation,
  DEFAULT_GEMINI_MODEL,
} from "@/lib/ai/gemini";
import type { MonthlyAiReview } from "@/types/ai-review";
import type { BudgetCategoryItem } from "@/components/features/categories/BudgetCategoryCard";

interface AiMonthlyReviewModalProps {
  monthId?: string;
  monthName: string;
  isClosed?: boolean;
  totalIncome: number;
  totalSpent: number;
  categories: BudgetCategoryItem[];
}

export function AiMonthlyReviewModal({
  monthId,
  monthName,
  isClosed = false,
  totalIncome,
  totalSpent,
  categories,
}: AiMonthlyReviewModalProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isLoadingAi, setIsLoadingAi] = React.useState(false);
  const [reviewData, setReviewData] = React.useState<MonthlyAiReview | null>(
    null
  );
  const [isClosing, startCloseTransition] = React.useTransition();

  const runEvaluation = React.useCallback(async () => {
    setIsLoadingAi(true);
    try {
      if (monthId) {
        const res = await generateMonthlyReview(monthId);
        if (res.success) {
          setReviewData(res.data);
          setIsLoadingAi(false);
          return;
        }
      }

      // Fallback deterministik untuk mode preview (ketika belum ada bulan di DB)
      const fallback = buildDeterministicMonthlyEvaluation({
        id: monthId ?? "preview-month",
        userId: "preview-user",
        name: monthName,
        year: 2026,
        monthIndex: 10,
        isClosed,
        createdAt: new Date(),
        updatedAt: new Date(),
        incomes: [],
        totalIncome,
        totalBudget: categories.reduce((acc, c) => acc + c.target, 0),
        totalSpent,
        netCashflow: totalIncome - totalSpent,
        categories: categories.map((c, idx) => ({
          id: c.id ?? `cat-${idx}`,
          monthId: monthId ?? "preview-month",
          liabilityId: null,
          name: c.name,
          icon: c.icon,
          group: c.group ?? "kebutuhan",
          targetBudget: c.target,
          spentAmount: c.spent,
          remainingBudget: c.remaining,
          status:
            c.spent > c.target
              ? "overbudget"
              : c.usagePercent >= 80
              ? "warning"
              : "healthy",
          isTemporary: false,
          sortOrder: idx,
        })),
      });

      setReviewData({
        ...fallback,
        generatedBy: "deterministic-engine",
        modelUsed: DEFAULT_GEMINI_MODEL,
        generatedAt: new Date().toISOString(),
      });
    } catch {
      toast.error("Gagal memuat evaluasi bulanan AI.");
    } finally {
      setIsLoadingAi(false);
    }
  }, [monthId, monthName, isClosed, totalIncome, totalSpent, categories]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && !reviewData) {
      void runEvaluation();
    }
  };

  const handleToggleMonthClose = () => {
    if (!monthId) return;

    startCloseTransition(async () => {
      if (!isClosed) {
        const res = await closeMonth({
          monthId,
          surplusAction: "sweep_to_savings",
        });
        if (!res.success) {
          toast.error(res.error);
          return;
        }
        toast.success(`Tutup Buku "${monthName}" berhasil!`, {
          description: `Surplus ${formatRupiah(
            res.data.sweptAmount
          )} disapu ke Tabungan Bebas.`,
        });
      } else {
        const res = await reopenMonth({ monthId });
        if (!res.success) {
          toast.error(res.error);
          return;
        }
        toast.success(`Siklus "${monthName}" dibuka kembali.`);
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 px-3.5 rounded-xl gap-1.5 text-xs font-semibold border-primary/30 bg-primary/5 hover:bg-primary/10 text-foreground shadow-2xs"
          >
            <Sparkles className="size-3.5 text-amber-500" />
            <span>✨ Evaluasi Bulan Ini dengan AI</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-xl rounded-2xl p-6 max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <Sparkles className="size-3.5" />
                <span>AI Financial Advisor • Gemini</span>
              </div>
              {reviewData && (
                <Badge variant="outline" className="text-[10px] rounded-full">
                  {reviewData.generatedBy === "gemini"
                    ? "Gemini Live Insight"
                    : "Deterministic Engine"}
                </Badge>
              )}
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Evaluasi Finansial Siklus {monthName}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Analisis otomatis kepatuhan 7 pos anggaran, rasio tabungan, dan
              rekomendasi taktis bulan berikutnya.
            </DialogDescription>
          </DialogHeader>

          {isLoadingAi ? (
            /* Animasi Loading Shimmering saat AI Menganalisis */
            <div className="space-y-4 py-4" aria-live="polite">
              <div className="h-20 w-full rounded-2xl bg-muted animate-pulse" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-24 rounded-xl bg-muted animate-pulse" />
                <div className="h-24 rounded-xl bg-muted animate-pulse" />
              </div>
              <div className="h-28 w-full rounded-xl bg-muted animate-pulse" />
              <p className="text-center text-xs text-muted-foreground">
                Menganalisis realisasi anggaran dan rasio kas {monthName}...
              </p>
            </div>
          ) : reviewData ? (
            <div className="space-y-4 py-1">
              {/* 1. Kartu Skor Disiplin Finansial */}
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/80 bg-muted/20 p-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    Skor Disiplin Finansial
                  </span>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {reviewData.executiveSummary}
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center size-18 shrink-0 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 tabular-nums">
                  <span className="text-2xl font-extrabold leading-none">
                    {reviewData.disciplineScore}
                  </span>
                  <span className="text-[10px] font-semibold mt-0.5">/ 100</span>
                </div>
              </div>

              {/* 2. Kartu Evaluasi Pos Paling Hemat vs Pos Overbudget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pos Paling Hemat */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <Trophy className="size-3.5" />
                    <span>Pos Paling Disiplin / Hemat</span>
                  </div>
                  {reviewData.mostFrugalCategory ? (
                    <div className="text-xs space-y-0.5 tabular-nums">
                      <p className="font-bold text-foreground">
                        {reviewData.mostFrugalCategory.icon}{" "}
                        {reviewData.mostFrugalCategory.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Terpakai{" "}
                        {formatRupiah(
                          reviewData.mostFrugalCategory.spentAmount
                        )}{" "}
                        dari{" "}
                        {formatRupiah(
                          reviewData.mostFrugalCategory.targetBudget
                        )}{" "}
                        ({reviewData.mostFrugalCategory.usagePercent}%)
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Belum ada data realisasi pos.
                    </p>
                  )}
                </div>

                {/* Pos Overbudget */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="size-3.5" />
                    <span>Evaluasi Pos Overbudget</span>
                  </div>
                  {reviewData.mostOverspentCategory ? (
                    <div className="text-xs space-y-0.5 tabular-nums">
                      <p className="font-bold text-foreground">
                        {reviewData.mostOverspentCategory.icon}{" "}
                        {reviewData.mostOverspentCategory.name}
                      </p>
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                        Melebihi target sebesar{" "}
                        {formatRupiah(
                          Math.abs(reviewData.mostOverspentCategory.varianceAmount)
                        )}{" "}
                        ({reviewData.mostOverspentCategory.usagePercent}%)
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      ✓ Nihil Overbudget! Seluruh pos terkendali di bawah
                      plafon.
                    </p>
                  )}
                </div>
              </div>

              {/* 3. Rekomendasi Taktis Bulan Berikutnya */}
              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Rekomendasi Taktis Bulan Berikutnya
                </h4>
                <ul className="space-y-2 text-xs text-foreground/90">
                  {reviewData.tacticalRecommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="size-3.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <DialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-border/50">
            {monthId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isClosing}
                onClick={handleToggleMonthClose}
                className="rounded-xl gap-1.5 text-xs"
              >
                {isClosing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : isClosed ? (
                  <Unlock className="size-3.5" />
                ) : (
                  <Lock className="size-3.5" />
                )}
                <span>
                  {isClosed
                    ? "Buka Kembali Siklus"
                    : "Tutup Buku & Sweep Tabungan"}
                </span>
              </Button>
            )}

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isLoadingAi}
                onClick={() => void runEvaluation()}
                className="rounded-xl text-xs"
              >
                Analisis Ulang
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setOpen(false)}
                className="rounded-xl text-xs"
              >
                Selesai
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
