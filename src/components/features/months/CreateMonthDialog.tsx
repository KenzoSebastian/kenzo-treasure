"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — 1-Click Month Generator Dialog (CreateMonthDialog)
 * ==============================================================================
 *
 * Antarmuka modal untuk membuat siklus bulan baru (Zero-Based Budgeting).
 * Mewarisi `defaultBaseSalary` pengguna dari database dan menavigasikan ke
 * siklus bulan baru menggunakan `startMonthSwitch` (`MonthNavigationContext`).
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMonthlyCycle } from "@/actions/months";
import { INDONESIAN_MONTH_NAMES } from "@/lib/month-generator";
import { formatRupiah, parseRupiah } from "@/lib/financial-calculations";
import { useMonthNavigation } from "./MonthNavigationContext";

export interface CreateMonthDialogProps {
  trigger?: React.ReactNode;
  latestMonth?: {
    year: number;
    monthIndex: number;
  } | null;
  defaultBaseSalary?: number | null;
  templateCount?: number;
  initialTrigger?: boolean;
}

export function CreateMonthDialog({
  trigger,
  latestMonth,
  defaultBaseSalary = null,
  templateCount = 0,
  initialTrigger = false,
}: CreateMonthDialogProps) {
  const router = useRouter();
  const { startMonthSwitch } = useMonthNavigation();
  const [open, setOpen] = React.useState(initialTrigger);
  const [unclosedWarning, setUnclosedWarning] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const defaultYear = React.useMemo(() => {
    if (!latestMonth) return new Date().getFullYear();
    return latestMonth.monthIndex === 12
      ? latestMonth.year + 1
      : latestMonth.year;
  }, [latestMonth]);

  const defaultMonthIndex = React.useMemo(() => {
    if (!latestMonth) return new Date().getMonth() + 1;
    return latestMonth.monthIndex === 12 ? 1 : latestMonth.monthIndex + 1;
  }, [latestMonth]);

  const [year, setYear] = React.useState<number>(defaultYear);
  const [monthIndex, setMonthIndex] = React.useState<number>(defaultMonthIndex);
  const [baseSalary, setBaseSalary] = React.useState<number>(
    defaultBaseSalary && defaultBaseSalary > 0 ? defaultBaseSalary : 0
  );
  const [hasEditedSalary, setHasEditedSalary] = React.useState<boolean>(false);
  const [rolloverSavings, setRolloverSavings] = React.useState<boolean>(true);

  React.useEffect(() => {
    setYear(defaultYear);
    setMonthIndex(defaultMonthIndex);
  }, [defaultYear, defaultMonthIndex]);

  React.useEffect(() => {
    if (!hasEditedSalary && defaultBaseSalary && defaultBaseSalary > 0) {
      setBaseSalary(defaultBaseSalary);
    }
  }, [defaultBaseSalary, hasEditedSalary]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setHasEditedSalary(false);
      setBaseSalary(defaultBaseSalary && defaultBaseSalary > 0 ? defaultBaseSalary : 0);
      setUnclosedWarning(null);
    }
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasEditedSalary(true);
    const rawValue = e.target.value;
    const numericValue = parseRupiah(rawValue);
    setBaseSalary(numericValue);
  };

  const isBeforeLatestMonth = React.useMemo(() => {
    if (!latestMonth) return false;
    return year * 12 + monthIndex < latestMonth.year * 12 + latestMonth.monthIndex;
  }, [latestMonth, year, monthIndex]);

  const executeCreateMonth = (allowUnclosed = false) => {
    if (isBeforeLatestMonth) {
      toast.error("Tidak dapat memilih bulan sebelum siklus terakhir.");
      return;
    }

    if (baseSalary <= 0) {
      toast.error("Gaji pokok harus bernilai positif (lebih besar dari Rp 0)");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createMonthlyCycle({
          year,
          monthIndex,
          baseSalary,
          rolloverSavings,
          allowUnclosedPrevious: allowUnclosed,
        });

        if (!result.success) {
          if (result.error.includes("belum ditutup buku")) {
            setUnclosedWarning(result.error);
            return;
          }
          toast.error("Gagal membuat bulan baru", {
            description: result.error,
          });
          return;
        }

        toast.success("Siklus bulan berhasil dibuat!", {
          description: `${result.data.name} aktif dengan ${result.data.categoriesCreated} pos anggaran.`,
        });

        setUnclosedWarning(null);
        setOpen(false);
        startMonthSwitch(result.data.monthId, result.data.name, () => {
          router.push(`/dashboard?month=${result.data.monthId}`);
          router.refresh();
        });
      } catch (err) {
        console.error("Error creating month:", err);
        toast.error("Terjadi kesalahan sistem saat membuat bulan baru.");
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCreateMonth(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            className="h-9 px-3.5 gap-1.5 font-medium rounded-xl shadow-xs"
          >
            <Plus className="size-4" />
            <span>Buat Bulan Baru</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md max-h-[90dvh]">
        <DialogHeader className="px-6 pt-5 pb-3.5 border-b border-border/40 shrink-0 text-left pr-14 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-3.5 text-foreground/80" />
            <span>Zero-Based Budgeting</span>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Buat Lembar Bulan Baru
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {latestMonth
              ? "Mewarisi konfigurasi pos anggaran bulan terakhir beserta penyesuaian otomatis cicilan dari database."
              : templateCount > 0
              ? `Inisialisasi Bulan 1 menggunakan ${templateCount} template pos anggaran pribadi Anda.`
              : "Inisialisasi siklus bulan baru dengan alokasi kuota dinamis dari database."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 w-full m-0 p-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {unclosedWarning && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2.5">
                <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <AlertCircle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                  <span className="leading-relaxed">{unclosedWarning}</span>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUnclosedWarning(null)}
                    className="rounded-lg h-7 px-2.5 text-[11px] cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isPending}
                    onClick={() => executeCreateMonth(true)}
                    className="rounded-lg h-7 px-2.5 text-[11px] font-semibold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-xs"
                  >
                    Tetap Buat (Lompati Tutup Buku)
                  </Button>
                </div>
              </div>
            )}

            {/* 1. Baris Pemilih Bulan & Tahun */}
            <div className="grid grid-cols-2 gap-3 items-start">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="month-select" className="text-xs font-medium">
                  Bulan
                </Label>
                <Select
                  value={String(monthIndex)}
                  onValueChange={(val) => setMonthIndex(Number(val))}
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="month-select"
                    className="h-10! w-full rounded-xl"
                  >
                    <SelectValue placeholder="Pilih Bulan" />
                  </SelectTrigger>
                  <SelectContent
                    className="rounded-xl max-h-56"
                    position="popper"
                  >
                    {INDONESIAN_MONTH_NAMES.map((name, idx) => {
                      const candidateMonthIndex = idx + 1;
                      const isPastOrCurrentLatest = Boolean(
                        latestMonth &&
                          year * 12 + candidateMonthIndex <=
                            latestMonth.year * 12 + latestMonth.monthIndex
                      );
                      return (
                        <SelectItem
                          key={candidateMonthIndex}
                          value={String(candidateMonthIndex)}
                          disabled={isPastOrCurrentLatest}
                        >
                          {name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="year-input" className="text-xs font-medium">
                  Tahun
                </Label>
                <Input
                  id="year-input"
                  type="number"
                  min={latestMonth ? latestMonth.year : 2020}
                  max={2100}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  disabled={isPending}
                  required
                  className="h-10! w-full rounded-xl tabular-nums"
                />
              </div>
            </div>

            {isBeforeLatestMonth && (
              <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                Tidak dapat memilih bulan sebelum siklus terakhir ({INDONESIAN_MONTH_NAMES[(latestMonth?.monthIndex ?? 1) - 1]} {latestMonth?.year}).
              </p>
            )}

            {/* 2. Gaji Pokok Rutin */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="salary-input" className="text-xs font-medium">
                Gaji Pokok Awal
              </Label>
              <div className="relative">
                <Input
                  id="salary-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={
                    baseSalary > 0
                      ? formatRupiah(baseSalary, { prefix: false })
                      : ""
                  }
                  onChange={handleSalaryChange}
                  placeholder="Contoh: 5.000.000"
                  disabled={isPending}
                  required
                  className="h-10! w-full rounded-xl tabular-nums pl-9"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none select-none">
                  Rp
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Menjadi dasar alokasi pos pengeluaran bulan ini.
              </p>
            </div>

            {/* 3. Opsi Sweep & Rollover */}
            <div className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-muted/30">
              <input
                id="rollover-checkbox"
                type="checkbox"
                checked={rolloverSavings}
                onChange={(e) => setRolloverSavings(e.target.checked)}
                disabled={isPending}
                className="size-4 mt-0.5 rounded accent-foreground cursor-pointer"
              />
              <label
                htmlFor="rollover-checkbox"
                className="text-xs text-foreground/90 cursor-pointer select-none leading-relaxed"
              >
                <span className="font-semibold block text-foreground">
                  Sapu Sisa Anggaran Bebas (Month Sweep)
                </span>
                Sisa kuota uang bebas dari bulan sebelumnya otomatis dialihkan ke
                saldo tabungan.
              </label>
            </div>

            {/* 4. Swiss Infobox: Penegasan Invarian Otomasi */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="text-[11px] leading-relaxed">
                <strong>Otomasi Utang Lunas:</strong> Pos cicilan yang sudah
                berstatus{" "}
                <span className="inline-flex items-center gap-0.5 font-semibold">
                  <CheckCircle2 className="size-3 inline shrink-0" />
                  Lunas
                </span>{" "}
                di database tidak akan dimunculkan lagi, dan kuotanya dialihkan
                untuk memperbesar pos Uang Bebas.
              </div>
            </div>
          </div>

          <DialogFooter className="w-full border-t border-border/60 bg-background px-6 py-4 flex flex-row items-center justify-end gap-2.5 shrink-0 mt-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="h-9 px-4 rounded-xl cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || baseSalary <= 0 || isBeforeLatestMonth}
              className="h-9 px-4 rounded-xl gap-1.5 font-medium cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Membuat...</span>
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  <span>Generate Bulan</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
