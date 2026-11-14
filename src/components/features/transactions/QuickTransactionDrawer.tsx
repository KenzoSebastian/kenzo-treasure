"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Mobile Sub-Second Quick Add Drawer (<5 Detik) (Fase F8)
 * ==============================================================================
 *
 * Drawer/modal input pengeluaran harian kilat (<5 detik):
 * - Input nominal uang dengan auto-format titik ribuan (`tabular-nums`) dan
 *   keyboard angka ponsel (`inputMode="numeric"`).
 * - Pill selector cepat untuk pos anggaran & metode bayar (QRIS, Tunai, Debit, Transfer).
 * - React Hook Form + Zod resolver dengan validasi error inline di bawah field
 *   (tanpa toast untuk error input form) dan optimistic close (<50ms).
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Zap, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createTransactionSchema,
  type CreateTransactionInput,
} from "@/schemas/transaction.schema";
import { createTransaction } from "@/actions/transactions";
import { formatRupiah, parseRupiah } from "@/lib/financial-calculations";
import { cn } from "@/lib/utils";
import type { TransactionMethod } from "@/types";

export interface QuickCategoryOption {
  id: string;
  name: string;
  icon: string;
  remaining: number;
}

export interface QuickTransactionDrawerProps {
  monthId?: string;
  categories: QuickCategoryOption[];
  defaultCategoryId?: string;
  /** Tahun siklus aktif untuk default tanggal yang valid */
  cycleYear?: number;
  /** Indeks bulan siklus aktif (1-12) */
  cycleMonthIndex?: number;
  isClosed?: boolean;
  trigger?: React.ReactNode;
  floatingMobile?: boolean;
}

const PAYMENT_METHODS: Array<{ value: TransactionMethod; label: string }> = [
  { value: "qris", label: "QRIS" },
  { value: "cash", label: "Tunai" },
  { value: "debit", label: "Debit" },
  { value: "transfer", label: "Transfer" },
];

const QUICK_AMOUNTS = [15_000, 25_000, 50_000, 100_000];

function getDefaultCycleDate(year?: number, monthIndex?: number): string {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = monthIndex ?? now.getMonth() + 1;

  if (
    targetYear === now.getFullYear() &&
    targetMonth === now.getMonth() + 1
  ) {
    return now.toISOString().slice(0, 10);
  }

  return `${targetYear}-${String(targetMonth).padStart(2, "0")}-01`;
}

export function QuickTransactionDrawer({
  categories,
  defaultCategoryId,
  cycleYear,
  cycleMonthIndex,
  isClosed = false,
  trigger,
  floatingMobile = false,
}: QuickTransactionDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validCategories = React.useMemo(
    () => categories.filter((c) => Boolean(c.id)),
    [categories]
  );

  const initialCategoryId =
    defaultCategoryId || validCategories[0]?.id || "";
  const defaultDate = React.useMemo(
    () => getDefaultCycleDate(cycleYear, cycleMonthIndex),
    [cycleYear, cycleMonthIndex]
  );

  const form = useForm({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      categoryId: initialCategoryId,
      amount: 0,
      date: defaultDate,
      description: "",
      method: "qris" as const,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        categoryId: defaultCategoryId || validCategories[0]?.id || "",
        amount: 0,
        date: defaultDate,
        description: "",
        method: "qris",
      });
    }
  }, [open, defaultCategoryId, validCategories, defaultDate, form]);

  const watchedAmount = form.watch("amount");
  const watchedCategoryId = form.watch("categoryId");
  const watchedMethod = form.watch("method");
  const { errors } = form.formState;

  async function onSubmit(values: CreateTransactionInput) {
    if (isClosed || isSubmitting) return;

    // Optimistic close (<50ms) untuk pengalaman sub-second logging
    setOpen(false);
    setIsSubmitting(true);

    const res = await createTransaction(values);
    setIsSubmitting(false);

    if (!res.success) {
      // Buka kembali drawer dan tampilkan pesan error jika ditolak server
      setOpen(true);
      if (res.fieldErrors?.date?.[0]) {
        form.setError("date", { message: res.fieldErrors.date[0] });
      } else {
        form.setError("description", {
          message: res.error || "Gagal mencatat pengeluaran.",
        });
      }
      return;
    }

    toast.success("Pengeluaran tercatat!", {
      description: `${values.description} • ${formatRupiah(values.amount)}`,
    });
    router.refresh();
  }

  if (isClosed || validCategories.length === 0) {
    return null;
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {trigger ? (
          trigger
        ) : floatingMobile ? (
          <Button
            type="button"
            size="lg"
            className="fixed bottom-20 right-4 z-40 md:hidden min-h-12 px-4 rounded-full shadow-lg gap-2 font-semibold"
          >
            <Plus className="size-5" />
            <span>Catat Pengeluaran</span>
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className="min-h-10 px-3.5 rounded-xl gap-1.5 font-medium shadow-xs"
          >
            <Zap className="size-4" />
            <span>+ Catat Pengeluaran</span>
          </Button>
        )}
      </DrawerTrigger>

      <DrawerContent className="max-h-[92dvh] px-4 pb-6 pt-2 sm:max-w-lg sm:mx-auto">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="space-y-4 overflow-y-auto px-1"
        >
          <DrawerHeader className="px-0 pb-1 text-left">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Zap className="size-3.5" />
              <span>Sub-Second Quick Add</span>
            </div>
            <DrawerTitle className="text-lg font-bold tracking-tight text-foreground">
              Catat Pengeluaran Harian
            </DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">
              Masukkan nominal, pilih pos anggaran, dan simpan dalam hitungan detik.
            </DrawerDescription>
          </DrawerHeader>

          {/* 1. Nominal Uang (Numpad Mobile + Quick Pills) */}
          <div className="space-y-2">
            <Label htmlFor="quick-amount" className="text-xs font-semibold">
              Nominal Pengeluaran (Rp)
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground select-none">
                Rp
              </span>
              <Input
                id="quick-amount"
                type="text"
                inputMode="numeric"
                autoFocus
                placeholder="0"
                value={
                  Number(watchedAmount) > 0
                    ? formatRupiah(Number(watchedAmount), { prefix: false })
                    : ""
                }
                onChange={(e) => {
                  const parsed = parseRupiah(e.target.value);
                  form.setValue("amount", Math.max(0, parsed), {
                    shouldValidate: Boolean(errors.amount),
                  });
                }}
                className={cn(
                  "min-h-12 pl-10 text-lg font-extrabold tabular-nums rounded-xl",
                  errors.amount &&
                    "border-destructive focus-visible:ring-destructive"
                )}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() =>
                    form.setValue("amount", amt, { shouldValidate: true })
                  }
                  className="rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground tabular-nums transition-colors hover:bg-muted cursor-pointer"
                >
                  +{formatRupiah(amt, { prefix: false })}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Selector Cepat Pos Kategori Anggaran */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Pilih Pos Anggaran</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-0.5">
              {validCategories.map((cat) => {
                const selected = watchedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      form.setValue("categoryId", cat.id, {
                        shouldValidate: true,
                      })
                    }
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-xl border p-2.5 text-left text-xs transition-all cursor-pointer",
                      selected
                        ? "border-primary bg-primary/10 text-foreground font-semibold shadow-2xs"
                        : "border-border/70 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{cat.icon}</span>
                      <div className="min-w-0">
                        <p className="truncate text-foreground text-xs font-medium">
                          {cat.name}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground tabular-nums">
                          Sisa: {formatRupiah(cat.remaining)}
                        </p>
                      </div>
                    </div>
                    {selected && (
                      <Check className="size-3.5 text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
            {errors.categoryId && (
              <p className="text-xs text-destructive">
                {errors.categoryId.message}
              </p>
            )}
          </div>

          {/* 3. Selector Cepat Metode Bayar */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Metode Pembayaran</Label>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const active = watchedMethod === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() =>
                      form.setValue("method", m.value, { shouldValidate: true })
                    }
                    className={cn(
                      "min-h-10 rounded-xl border text-xs font-medium transition-colors cursor-pointer",
                      active
                        ? "border-primary bg-primary text-primary-foreground font-semibold"
                        : "border-border/70 bg-card text-foreground hover:bg-muted/50"
                    )}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Keterangan & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="quick-desc" className="text-xs font-semibold">
                Keterangan Singkat
              </Label>
              <Input
                id="quick-desc"
                type="text"
                placeholder="Contoh: Isi bensin Pertamax, Kopi..."
                {...form.register("description")}
                className={cn(
                  "min-h-11 rounded-xl text-xs",
                  errors.description &&
                    "border-destructive focus-visible:ring-destructive"
                )}
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quick-date" className="text-xs font-semibold">
                Tanggal
              </Label>
              <Input
                id="quick-date"
                type="date"
                {...form.register("date")}
                className={cn(
                  "min-h-11 rounded-xl text-xs tabular-nums",
                  errors.date &&
                    "border-destructive focus-visible:ring-destructive"
                )}
              />
              {errors.date && (
                <p className="text-xs text-destructive">
                  {errors.date.message}
                </p>
              )}
            </div>
          </div>

          <DrawerFooter className="px-0 pt-2 flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="min-h-12 flex-1 rounded-xl text-xs font-medium"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-h-12 flex-2 rounded-xl text-xs font-semibold gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  <span>Simpan Transaksi</span>
                </>
              )}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
