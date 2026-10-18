"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — 1-Click Month Generator Dialog (CreateMonthDialog)
 * ==============================================================================
 *
 * ── Kenapa komponen ini ada ───────────────────────────────────────────────────
 *
 * Antarmuka modal untuk membuat siklus bulan baru (Zero-Based Budgeting).
 * Pengguna dapat menentukan tahun, bulan, gaji pokok baseline, serta opsi
 * pemindahan sisa anggaran bebas bulan sebelumnya ke saldo tabungan.
 * Mengintegrasikan Server Action `createMonthlyCycle` dengan feedback Sonner.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Sparkles, AlertCircle } from "lucide-react";
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

interface CreateMonthDialogProps {
  /**
   * Kustom trigger jika tombol dipanggil dari tempat lain (misal empty state).
   */
  trigger?: React.ReactNode;
  /**
   * Bulan terakhir yang tercatat di database untuk auto-suggest bulan berikutnya.
   */
  latestMonth?: {
    year: number;
    monthIndex: number;
  } | null;
}

export function CreateMonthDialog({
  trigger,
  latestMonth,
}: CreateMonthDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  // Hitung rekomendasi bulan berikutnya
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
  const [baseSalary, setBaseSalary] = React.useState<number>(4000000);
  const [rolloverSavings, setRolloverSavings] = React.useState<boolean>(true);

  // Sinkronisasi saat default berubah
  React.useEffect(() => {
    setYear(defaultYear);
    setMonthIndex(defaultMonthIndex);
  }, [defaultYear, defaultMonthIndex]);

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseRupiah(rawValue);
    setBaseSalary(numericValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
        });

        if (!result.success) {
          toast.error("Gagal membuat bulan baru", {
            description: result.error,
          });
          return;
        }

        toast.success("Siklus bulan berhasil dibuat!", {
          description: `${result.data.name} aktif dengan ${result.data.categoriesCreated} pos anggaran.`,
        });

        setOpen(false);
        router.push(`/dashboard?month=${result.data.monthId}`);
        router.refresh();
      } catch (err) {
        console.error("Error creating month:", err);
        toast.error("Terjadi kesalahan sistem saat membuat bulan baru.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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

      <DialogContent className="sm:max-w-115 max-h-[calc(100dvh-4rem)] overflow-y-auto p-6 rounded-2xl border-border/80 my-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="size-3.5 text-foreground/80" />
              <span>Zero-Based Budgeting</span>
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              Buat Lembar Bulan Baru
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Inisialisasi siklus kerja mandiri dengan 7 pos anggaran baseline
              dan alokasi kuota dinamis langsung dari database.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
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
                  <SelectTrigger id="month-select" className="h-10! w-full rounded-xl">
                    <SelectValue placeholder="Pilih Bulan" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-56" position="popper">
                    {INDONESIAN_MONTH_NAMES.map((name, idx) => (
                      <SelectItem key={idx + 1} value={String(idx + 1)}>
                        {name}
                      </SelectItem>
                    ))}
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
                  min={2020}
                  max={2100}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  disabled={isPending}
                  required
                  className="h-10! w-full rounded-xl tabular-nums"
                />
              </div>
            </div>

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
                  value={baseSalary > 0 ? formatRupiah(baseSalary, { prefix: false }) : ""}
                  onChange={handleSalaryChange}
                  placeholder="0"
                  disabled={isPending}
                  required
                  className="h-10! w-full rounded-xl tabular-nums pl-9"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none select-none">
                  Rp
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Menjadi dasar alokasi pos pengeluaran (default: Rp 4.000.000).
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
                berstatus 🏆 Lunas di database tidak akan dimunculkan lagi, dan
                kuotanya dialihkan untuk memperbesar pos Uang Bebas.
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="h-9 px-4 rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="h-9 px-4 rounded-xl gap-1.5 font-medium"
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
