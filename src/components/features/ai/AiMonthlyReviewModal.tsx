"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — AI Monthly Financial Review Modal (Fase F16, R1, R3)
 * ==============================================================================
 *
 * ── Kenapa komponen ini ada ───────────────────────────────────────────────────
 *
 * Menyediakan tombol trigger `[Evaluasi Bulan Ini dengan AI]` dan modal dialog
 * review cerdas di panel siklus/penutupan buku bulanan:
 * - Animasi loading shimmering saat AI sedang menganalisis data (`generateMonthlyReview`).
 * - Kartu evaluasi pos paling hemat vs pos overbudget dengan `AppCategoryIcon`.
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
import { AppCategoryIcon } from "@/components/common/AppCategoryIcon";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/financial-calculations";
import { generateMonthlyReview } from "@/actions/ai-review";
import { closeMonth, reopenMonth } from "@/actions/months";
import {
  buildDeterministicMonthlyEvaluation,
  DEFAULT_GEMINI_MODEL,
} from "@/lib/ai/gemini";
import type { MonthlyAiReview } from "@/types/ai-review";
import type { BudgetCategoryItem } from "@/components/features/categories/BudgetCategoryCard";

export interface AiMonthlyReviewModalProps {
  monthId?: string;
  monthName: string;
  isClosed?: boolean;
  totalIncome: number;
  totalSpent: number;
  categories: BudgetCategoryItem[];
  trigger?: React.ReactNode;
}

export function AiMonthlyReviewModal({
  monthId,
  monthName,
  isClosed = false,
  totalIncome,
  totalSpent,
  categories,
  trigger,
}: AiMonthlyReviewModalProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isLoadingAi, setIsLoadingAi] = React.useState(false);
  const [reviewData, setReviewData] = React.useState<MonthlyAiReview | null>(
    null
  );
  const [isClosing, startCloseTransition] = React.useTransition();
  const [showCloseConfirm, setShowCloseConfirm] = React.useState(false);

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

      // Fallback deterministik ketika dievaluasi secara lokal
      const fallback = buildDeterministicMonthlyEvaluation({
        id: monthId ?? "preview-month",
        userId: "preview-user",
        name: monthName,
        year: new Date().getFullYear(),
        monthIndex: new Date().getMonth() + 1,
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
          liabilityId: c.liabilityId ?? null,
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
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl gap-1.5 text-xs font-semibold border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-foreground shadow-2xs w-full justify-center"
          >
            <Sparkles className="size-3.5 text-amber-500 shrink-0" />
            <span className="truncate">Evaluasi AI</span>
          </Button>
        )}
      </DialogTrigger>

        <DialogContent className="sm:max-w-xl max-h-[90dvh]">
          <DialogHeader className="px-6 pt-5 pb-3.5 border-b border-border/40 shrink-0 text-left pr-14">
            <div className="flex items-center justify-between gap-3 pr-6">
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
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Analisis otomatis kepatuhan pos anggaran, rasio tabungan, dan
              rekomendasi taktis bulan berikutnya.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
            {isLoadingAi ? (
              /* Animasi Loading Shimmering saat AI Menganalisis */
              <div className="space-y-4 py-2" aria-live="polite">
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
                      <p className="inline-flex items-center gap-1.5 font-bold text-foreground">
                        <AppCategoryIcon
                          iconKey={reviewData.mostFrugalCategory.icon}
                          size="xs"
                          variant="inline"
                        />
                        <span>{reviewData.mostFrugalCategory.name}</span>
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
                      <p className="inline-flex items-center gap-1.5 font-bold text-foreground">
                        <AppCategoryIcon
                          iconKey={reviewData.mostOverspentCategory.icon}
                          size="xs"
                          variant="inline"
                        />
                        <span>{reviewData.mostOverspentCategory.name}</span>
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
                      Nihil Overbudget! Seluruh pos terkendali di bawah plafon.
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
          </div>

          <DialogFooter className="w-full border-t border-border/60 bg-background px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 shrink-0 mt-auto">
            {monthId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isClosing}
                onClick={() => setShowCloseConfirm(true)}
                className="rounded-xl gap-1.5 text-xs cursor-pointer"
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
                className="rounded-xl text-xs cursor-pointer"
              >
                Analisis Ulang
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setOpen(false)}
                className="rounded-xl text-xs cursor-pointer"
              >
                Selesai
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog Konfirmasi Tutup Buku / Buka Kembali */}
      <Dialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <DialogContent className="sm:max-w-md max-h-[90dvh]">
          <DialogHeader className="px-6 pt-5 pb-3.5 border-b border-border/40 shrink-0 text-left pr-14">
            <DialogTitle className="text-base font-bold text-foreground">
              {isClosed
                ? "Konfirmasi Buka Kembali Siklus"
                : "Konfirmasi Tutup Buku & Sweep Tabungan"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {isClosed
                ? `Apakah Anda yakin ingin membuka kembali siklus ${monthName}? Catatan dan alokasi anggaran akan dapat diedit kembali.`
                : `Apakah Anda yakin ingin menutup buku siklus ${monthName}? Sisa surplus anggaran akan otomatis disapu ke Tabungan Bebas.`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0 text-xs">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Siklus Bulan</span>
                <span className="font-bold text-foreground">{monthName}</span>
              </div>
              {!isClosed && reviewData && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Surplus Disapu ke Tabungan</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatRupiah(Math.max(0, reviewData.netSavings))}
                  </span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {isClosed
                ? "Membuka kembali siklus memungkinkan pencatatan transaksi susulan pada bulan ini."
                : "Setelah ditutup, pos anggaran bulan ini akan terkunci dari transaksi baru hingga dibuka kembali."}
            </p>
          </div>

          <DialogFooter className="w-full border-t border-border/60 bg-background px-6 py-4 flex flex-row items-center justify-end gap-2.5 shrink-0 mt-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCloseConfirm(false)}
              className="rounded-xl cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isClosing}
              onClick={() => {
                setShowCloseConfirm(false);
                handleToggleMonthClose();
              }}
              className={cn(
                "rounded-xl gap-1.5 font-semibold cursor-pointer shadow-xs",
                isClosed
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
            >
              {isClosing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : isClosed ? (
                <Unlock className="size-3.5" />
              ) : (
                <Lock className="size-3.5" />
              )}
              <span>{isClosed ? "Buka Kembali" : "Tutup Buku Sekarang"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
    );
  }
