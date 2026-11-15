"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Mobile Sub-Second Quick Add Drawer (<5 Detik) (Fase F8, R1, R6, R7)
 * ==============================================================================
 *
 * Drawer/modal input pengeluaran harian kilat (<5 detik):
 * - Single-scroll sheet tanpa nested scroll container dan dengan sticky footer.
 * - Input nominal uang dengan auto-format titik ribuan (`tabular-nums`),
 *   keyboard angka ponsel (`inputMode="numeric"`), dan tombol `Semua Sisa (<nominal>)`.
 * - Auto-fill `description` saat memilih pos anggaran selain `uang_bebas_tabungan`
 *   dengan pelacakan perubahan manual (`lastAutoDescriptionRef`).
 * - Selector Metode Pembayaran menggunakan `SlidingSegmentedControl`.
 * - React Hook Form + Zod resolver dengan validasi error inline di bawah field
 *   dan optimistic close (<50ms) yang mempertahankan error server saat dibuka ulang.
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
import { AppCategoryIcon } from "@/components/common/AppCategoryIcon";
import { SlidingSegmentedControl } from "@/components/common/SlidingSegmentedControl";
import {
  createTransactionSchema,
  type CreateTransactionInput,
} from "@/schemas/transaction.schema";
import { createTransaction } from "@/actions/transactions";
import {
  formatRupiah,
  parseRupiah,
  resolveDefaultCycleDate,
} from "@/lib/financial-calculations";
import { cn } from "@/lib/utils";
import type { TransactionMethod } from "@/types";

export interface QuickCategoryOption {
  id: string;
  name: string;
  icon: string;
  remaining: number;
  group?: "pos_wajib" | "kebutuhan" | "uang_bebas_tabungan";
  liabilityId?: string | null;
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
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialAmount?: number;
  initialDescription?: string;
}

const PAYMENT_METHODS: Array<{ value: TransactionMethod; label: string }> = [
  { value: "qris", label: "QRIS" },
  { value: "cash", label: "Tunai" },
  { value: "debit", label: "Debit" },
  { value: "transfer", label: "Transfer" },
];

const QUICK_AMOUNTS = [15_000, 25_000, 50_000, 100_000];

/**
 * Helper murni untuk menghitung sisa anggaran maksimum yang dapat dipakai pada
 * tombol cepat "Semua Sisa" (dijamin >= 0).
 */
export function resolveMaxCategoryRemaining(
  categories: QuickCategoryOption[],
  categoryId: string
): number {
  const selected = categories.find((c) => c.id === categoryId);
  if (!selected) return 0;
  return Math.max(0, Math.trunc(selected.remaining));
}

/**
 * Helper murni untuk menentukan nilai auto-fill keterangan berdasarkan pos anggaran.
 * Mengembalikan string kosong untuk `uang_bebas_tabungan` agar pengguna mengisi manual.
 */
export function resolveAutoDescriptionForCategory(
  category?: Pick<QuickCategoryOption, "name" | "group"> | null
): string {
  if (!category) return "";
  if (category.group === "uang_bebas_tabungan") return "";
  return category.name.trim();
}

export function QuickTransactionDrawer({
  categories,
  defaultCategoryId,
  cycleYear,
  cycleMonthIndex,
  isClosed = false,
  trigger,
  floatingMobile = false,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  initialAmount = 0,
  initialDescription,
}: QuickTransactionDrawerProps) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isOpen = controlledOpen ?? uncontrolledOpen;
  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextOpen);
      }
      controlledOnOpenChange?.(nextOpen);
    },
    [controlledOpen, controlledOnOpenChange]
  );

  const validCategories = React.useMemo(
    () => categories.filter((c) => Boolean(c.id)),
    [categories]
  );

  const initialCategoryId =
    defaultCategoryId || validCategories[0]?.id || "";
  const initialCategory = validCategories.find(
    (c) => c.id === initialCategoryId
  );
  const computedInitialDesc =
    initialDescription !== undefined
      ? initialDescription
      : resolveAutoDescriptionForCategory(initialCategory);

  const defaultDate = React.useMemo(
    () => resolveDefaultCycleDate(cycleYear, cycleMonthIndex),
    [cycleYear, cycleMonthIndex]
  );

  const lastAutoDescriptionRef = React.useRef<string>(computedInitialDesc);
  const shouldSkipNextOpenResetRef = React.useRef<boolean>(false);
  const wasOpenRef = React.useRef<boolean>(defaultOpen);

  const form = useForm({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      categoryId: initialCategoryId,
      amount: initialAmount,
      date: defaultDate,
      description: computedInitialDesc,
      method: "qris" as const,
    },
  });

  React.useEffect(() => {
    const transitionedToOpen = !wasOpenRef.current && isOpen;
    wasOpenRef.current = isOpen;

    if (!transitionedToOpen) return;

    if (shouldSkipNextOpenResetRef.current) {
      shouldSkipNextOpenResetRef.current = false;
      return;
    }

    const resetCategoryId =
      defaultCategoryId || validCategories[0]?.id || "";
    const resetCategory = validCategories.find(
      (c) => c.id === resetCategoryId
    );
    const autoDesc =
      initialDescription !== undefined
        ? initialDescription
        : resolveAutoDescriptionForCategory(resetCategory);

    lastAutoDescriptionRef.current = autoDesc;
    form.reset({
      categoryId: resetCategoryId,
      amount: initialAmount,
      date: defaultDate,
      description: autoDesc,
      method: "qris",
    });
  }, [
    isOpen,
    defaultCategoryId,
    validCategories,
    defaultDate,
    initialAmount,
    initialDescription,
    form,
  ]);

  const watchedAmount = form.watch("amount");
  const watchedCategoryId = form.watch("categoryId");
  const watchedMethod = form.watch("method");
  const { errors } = form.formState;

  const maxCategoryRemaining = React.useMemo(
    () => resolveMaxCategoryRemaining(validCategories, watchedCategoryId),
    [validCategories, watchedCategoryId]
  );

  const handleSelectCategory = (cat: QuickCategoryOption) => {
    form.setValue("categoryId", cat.id, { shouldValidate: true });

    const currentDesc = (form.getValues("description") ?? "").trim();
    const isUntouchedOrAuto =
      currentDesc === "" || currentDesc === lastAutoDescriptionRef.current;

    if (isUntouchedOrAuto) {
      const nextAutoDesc = resolveAutoDescriptionForCategory(cat);
      lastAutoDescriptionRef.current = nextAutoDesc;
      form.setValue("description", nextAutoDesc, {
        shouldValidate: Boolean(errors.description),
      });
    }
  };

  async function onSubmit(values: CreateTransactionInput) {
    if (isClosed || isSubmitting) return;

    // Optimistic close (<50ms) untuk pengalaman sub-second logging
    setOpen(false);
    setIsSubmitting(true);

    const res = await createTransaction(values);
    setIsSubmitting(false);

    if (!res.success) {
      // Pertahankan input & error server saat drawer dibuka kembali
      shouldSkipNextOpenResetRef.current = true;
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
    <Drawer open={isOpen} onOpenChange={setOpen}>
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
            className="min-h-10 lg:h-9 lg:min-h-9 px-3.5 rounded-xl gap-1.5 font-medium shadow-xs"
          >
            <Zap className="size-4" />
            <span>+ Catat Pengeluaran</span>
          </Button>
        )}
      </DrawerTrigger>

      <DrawerContent className="flex flex-col max-h-[92dvh] p-0 sm:max-w-lg sm:mx-auto">
        <DrawerHeader className="px-6 pt-4 pb-2 text-left shrink-0 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Zap className="size-3.5" />
            <span>Sub-Second Quick Add</span>
          </div>
          <DrawerTitle className="text-xl font-bold tracking-tight text-foreground">
            Catat Pengeluaran Harian
          </DrawerTitle>
          <DrawerDescription className="text-xs text-muted-foreground leading-relaxed">
            Masukkan nominal, pilih pos anggaran, dan simpan dalam hitungan detik.
          </DrawerDescription>
        </DrawerHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto space-y-5 px-6 py-4">
            {/* 1. Nominal Uang (Numpad Mobile + Quick Pills + Semua Sisa) */}
            <div className="space-y-2.5">
              <Label htmlFor="quick-amount" className="text-xs font-semibold text-foreground/90">
                Nominal Pengeluaran (Rp)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground select-none">
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
                    "min-h-12 pl-11 text-lg font-bold tabular-nums rounded-xl",
                    errors.amount &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-destructive">
                  {errors.amount.message}
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() =>
                      form.setValue("amount", amt, { shouldValidate: true })
                    }
                    className="rounded-lg border border-border/70 bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground tabular-nums transition-colors hover:bg-muted cursor-pointer active:scale-95"
                  >
                    +{formatRupiah(amt, { prefix: false })}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={maxCategoryRemaining <= 0}
                  onClick={() => {
                    if (maxCategoryRemaining > 0) {
                      form.setValue("amount", maxCategoryRemaining, {
                        shouldValidate: true,
                      });
                    }
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold tabular-nums transition-colors",
                    maxCategoryRemaining > 0
                      ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 cursor-pointer active:scale-95"
                      : "border-border/50 bg-muted/20 text-muted-foreground/60 cursor-not-allowed"
                  )}
                >
                  {maxCategoryRemaining > 0
                    ? `Semua Sisa (${formatRupiah(maxCategoryRemaining)})`
                    : "Sisa Pos Habis"}
                </button>
              </div>
            </div>

            {/* 2. Selector Cepat Pos Kategori Anggaran (Single-scroll tanpa nested overflow) */}
            <div className="space-y-2.5">
              <Label className="text-xs font-semibold text-foreground/90">Pilih Pos Anggaran</Label>
              <div className="grid grid-cols-2 gap-2.5">
                {validCategories.map((cat) => {
                  const selected = watchedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className={cn(
                        "flex items-center justify-between gap-2.5 rounded-xl border p-3 text-left text-xs transition-all cursor-pointer",
                        selected
                          ? "border-primary bg-primary/10 text-foreground font-semibold shadow-2xs"
                          : "border-border/70 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <AppCategoryIcon
                          iconKey={cat.icon}
                          group={cat.group}
                          liabilityId={cat.liabilityId}
                          size="xs"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-foreground text-xs font-medium">
                            {cat.name}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground tabular-nums">
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

            {/* 3. Selector Cepat Metode Bayar (SlidingSegmentedControl) */}
            <div className="space-y-2.5">
              <Label className="text-xs font-semibold text-foreground/90">Metode Pembayaran</Label>
              <SlidingSegmentedControl
                options={PAYMENT_METHODS}
                value={watchedMethod ?? "qris"}
                onValueChange={(val) =>
                  form.setValue(
                    "method",
                    val as "cash" | "debit" | "qris" | "transfer",
                    { shouldValidate: true }
                  )
                }
                role="radiogroup"
                ariaLabel="Metode pembayaran"
                fullWidth
                size="md"
                recalculateTrigger={isOpen}
              />
            </div>

            {/* 4. Keterangan & Tanggal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="quick-desc" className="text-xs font-semibold text-foreground/90">
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

              <div className="space-y-2">
                <Label htmlFor="quick-date" className="text-xs font-semibold text-foreground/90">
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
          </div>

          <DrawerFooter className="w-full bg-background border-t border-border/60 px-6 py-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] shrink-0 flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="min-h-11 flex-1 rounded-xl text-xs font-medium cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-h-11 flex-2 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
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
