"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Budget Category Card (Fase F7 & F9)
 * ==============================================================================
 *
 * ── Kenapa komponen ini ada ───────────────────────────────────────────────────
 *
 * Menampilkan kartu individual untuk satu pos pengeluaran anggaran bulanan:
 * - Ikon & nama pos (`✝️`, `⚡`, `💰`, `⛽`, `🍿`, `📱`, `👩‍👦`)
 * - Target Alokasi, Realisasi Terpakai, dan Sisa Budget (`tabular-nums`)
 * - Progress bar pemakaian dengan warna semantik & badge status (`Aman`,
 *   `Mendekati Limit >80%`, `Overbudget`)
 * - Edit cepat Target Alokasi (`updateCategoryTarget`) secara inline
 * - Modal Box Rincian Riwayat Transaksi Harian (`TransactionSubList`) via Dialog
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Check,
  X,
  ReceiptText,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatRupiah, parseRupiah } from "@/lib/financial-calculations";
import { updateCategoryTarget } from "@/actions/categories";
import { TransactionSubList } from "@/components/features/transactions/TransactionSubList";
import type { TransactionItem } from "@/types/transaction";

export interface BudgetCategoryItem {
  id?: string;
  name: string;
  icon: string;
  group?: "pos_wajib" | "kebutuhan" | "uang_bebas_tabungan";
  target: number;
  spent: number;
  remaining: number;
  usagePercent: number;
  status: string;
  isLocked?: boolean;
  transactions?: TransactionItem[];
}

interface BudgetCategoryCardProps {
  category: BudgetCategoryItem;
  isClosed?: boolean;
}

export function BudgetCategoryCard({
  category,
  isClosed = false,
}: BudgetCategoryCardProps) {
  const router = useRouter();
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [isEditingTarget, setIsEditingTarget] = React.useState(false);
  const [targetInput, setTargetInput] = React.useState(
    String(category.target)
  );
  const [targetError, setTargetError] = React.useState<string | null>(null);
  const [isSaving, startTransition] = React.useTransition();

  React.useEffect(() => {
    setTargetInput(String(category.target));
  }, [category.target]);

  const txList = category.transactions ?? [];
  const usageRatio =
    category.target > 0
      ? Math.round((category.spent / category.target) * 100)
      : category.spent > 0
      ? 100
      : 0;

  // Klasifikasi status semantik pos anggaran (Fase F7)
  const isOverbudget =
    category.spent > category.target && category.target > 0;
  const isWarning = !isOverbudget && usageRatio >= 80 && category.group !== "uang_bebas_tabungan";

  let statusLabel = category.status;
  let badgeClassName =
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25";
  let barClassName = "bg-emerald-500";

  if (isOverbudget || category.status === "Overbudget") {
    statusLabel = "Overbudget";
    badgeClassName =
      "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25";
    barClassName = "bg-rose-500";
  } else if (isWarning || category.status === "Waspada") {
    statusLabel = "Mendekati Limit >80%";
    badgeClassName =
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25";
    barClassName = "bg-amber-500";
  } else if (category.status === "Terkunci") {
    badgeClassName = "bg-muted text-muted-foreground border-border/60";
    barClassName = "bg-primary/70";
  }

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.id) return;

    const numericTarget = parseRupiah(targetInput);
    if (numericTarget < 0) {
      setTargetError("Target alokasi tidak boleh negatif");
      return;
    }

    setTargetError(null);
    startTransition(async () => {
      const res = await updateCategoryTarget({
        categoryId: category.id!,
        targetBudget: numericTarget,
      });

      if (!res.success) {
        setTargetError(res.error);
        return;
      }

      toast.success(`Target pos "${category.name}" diperbarui`, {
        description: `Alokasi baru: ${formatRupiah(numericTarget)}`,
      });
      setIsEditingTarget(false);
      router.refresh();
    });
  };

  return (
    <Card
      className={cn(
        "rounded-xl border border-border/70 bg-card p-4 space-y-3.5 shadow-xs transition-all hover:border-foreground/25",
        isOverbudget && "border-rose-500/40 bg-rose-500/2"
      )}
    >
      {/* Baris Header: Ikon, Nama Pos, Target & Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-lg select-none"
            aria-hidden="true"
          >
            {category.icon}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-foreground leading-snug truncate">
                {category.name}
              </h3>
              {category.isLocked && (
                <Lock
                  className="size-3 text-muted-foreground shrink-0"
                  aria-label="Pos Wajib Terkunci"
                />
              )}
            </div>

            {!isEditingTarget ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  Target: {formatRupiah(category.target)}
                </span>
                {category.id && !isClosed && (
                  <button
                    type="button"
                    onClick={() => setIsEditingTarget(true)}
                    className="inline-flex items-center justify-center size-5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Ubah target alokasi"
                    aria-label={`Ubah target alokasi ${category.name}`}
                  >
                    <Pencil className="size-2.5" />
                  </button>
                )}
              </div>
            ) : (
              <form
                onSubmit={handleSaveTarget}
                className="mt-1.5 space-y-1"
              >
                <div className="flex items-center gap-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={
                      parseRupiah(targetInput) > 0
                        ? parseRupiah(targetInput).toLocaleString("id-ID")
                        : "0"
                    }
                    onChange={(e) => {
                      setTargetInput(String(parseRupiah(e.target.value)));
                      setTargetError(null);
                    }}
                    disabled={isSaving}
                    className={cn(
                      "h-7 text-xs px-2 py-0.5 w-28 rounded-lg tabular-nums",
                      targetError && "border-destructive"
                    )}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    disabled={isSaving}
                    className="size-7 rounded-lg text-emerald-600 hover:bg-emerald-500/10"
                    aria-label="Simpan target"
                  >
                    <Check className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={isSaving}
                    onClick={() => {
                      setIsEditingTarget(false);
                      setTargetError(null);
                      setTargetInput(String(category.target));
                    }}
                    className="size-7 rounded-lg text-muted-foreground"
                    aria-label="Batal ubah target"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
                {targetError && (
                  <p className="text-[10px] text-destructive font-medium">
                    {targetError}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

        <Badge
          variant="outline"
          className={cn(
            "text-[10px] font-semibold tracking-tight px-2 py-0.5 rounded-full shrink-0",
            badgeClassName
          )}
        >
          {statusLabel}
        </Badge>
      </div>

      {/* Ringkasan Realisasi Terpakai vs Sisa Budget */}
      <div className="space-y-2 pt-2 border-t border-border/40">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[10px] text-muted-foreground block">
              Realisasi Terpakai
            </span>
            <span className="font-semibold text-foreground tabular-nums">
              {formatRupiah(category.spent)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground block">
              Sisa Budget
            </span>
            <span
              className={cn(
                "font-bold tabular-nums",
                category.remaining < 0 || isOverbudget
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {isOverbudget
                ? `-${formatRupiah(Math.abs(category.target - category.spent))}`
                : formatRupiah(category.remaining)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                barClassName
              )}
              style={{ width: `${Math.min(usageRatio, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground tabular-nums">
            <span>Penyerapan: {usageRatio}%</span>
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-lg px-2.5 text-[11px] font-medium text-foreground/90 tabular-nums"
                  aria-label={`Buka rincian transaksi pos ${category.name} (${txList.length} transaksi)`}
                >
                  <ReceiptText data-icon="inline-start" />
                  <span>Rincian ({txList.length})</span>
                </Button>
              </DialogTrigger>

              <DialogContent
                className="flex max-h-[calc(100dvh-2rem)] flex-col gap-4 rounded-2xl p-6 sm:max-w-lg"
                onPointerDownOutside={(event) => {
                  const target = event.target as HTMLElement | null;
                  if (target?.closest("[data-sonner-toaster]")) {
                    event.preventDefault();
                  }
                }}
                onInteractOutside={(event) => {
                  const target = event.target as HTMLElement | null;
                  if (target?.closest("[data-sonner-toaster]")) {
                    event.preventDefault();
                  }
                }}
              >
                <DialogHeader>
                  <div className="flex items-center justify-between gap-3 pr-7">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-lg select-none"
                        aria-hidden="true"
                      >
                        {category.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <DialogTitle className="truncate text-base font-bold text-foreground">
                            {category.name}
                          </DialogTitle>
                          {category.isLocked && (
                            <Lock
                              className="size-3.5 shrink-0 text-muted-foreground"
                              aria-label="Pos Wajib Terkunci"
                            />
                          )}
                        </div>
                        <DialogDescription className="text-xs text-muted-foreground tabular-nums">
                          {txList.length > 0
                            ? `${txList.length} catatan pengeluaran pada siklus bulan ini`
                            : "Belum ada catatan pengeluaran di pos ini"}
                        </DialogDescription>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-tight",
                        badgeClassName
                      )}
                    >
                      {statusLabel}
                    </Badge>
                  </div>
                </DialogHeader>

                <BudgetCategoryDetailsPanel
                  category={category}
                  isOverbudget={isOverbudget}
                  isClosed={isClosed}
                />

                <DialogFooter className="-mx-6 -mb-6 rounded-b-2xl px-6 py-4">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                    >
                      Tutup
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface BudgetCategoryDetailsPanelProps {
  category: BudgetCategoryItem;
  isOverbudget: boolean;
  isClosed?: boolean;
}

/**
 * Konten utama modal box rincian pos pengeluaran agar ringkas di layar mobile
 * dan tetap terisolasi dari tata letak grid kartu pos anggaran.
 */
export function BudgetCategoryDetailsPanel({
  category,
  isOverbudget,
  isClosed = false,
}: BudgetCategoryDetailsPanelProps) {
  const txList = category.transactions ?? [];

  return (
    <div className="flex min-h-0 flex-col gap-3.5">
      <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/60 bg-muted/25 p-3 text-xs tabular-nums">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Target</span>
          <span className="font-semibold text-foreground">
            {formatRupiah(category.target)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 text-center">
          <span className="text-[10px] text-muted-foreground">Terpakai</span>
          <span className="font-semibold text-foreground">
            {formatRupiah(category.spent)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 text-right">
          <span className="text-[10px] text-muted-foreground">
            {isOverbudget ? "Overbudget" : "Sisa"}
          </span>
          <span
            className={cn(
              "font-bold",
              category.remaining < 0 || isOverbudget
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {isOverbudget
              ? `-${formatRupiah(Math.abs(category.target - category.spent))}`
              : formatRupiah(category.remaining)}
          </span>
        </div>
      </div>

      <Separator />

      <div className="max-h-[45dvh] overflow-y-auto pr-1">
        <TransactionSubList transactions={txList} isClosed={isClosed} />
      </div>
    </div>
  );
}
