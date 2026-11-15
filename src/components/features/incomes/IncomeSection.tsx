"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Income Section: Gaji Pokok vs Freelance (Fase F10, R1, R3)
 * ==============================================================================
 *
 * ── Kenapa komponen ini ada ───────────────────────────────────────────────────
 *
 * Memisahkan tampilan pemasukan bulan berjalan menjadi 2 bagian jelas:
 * 1. Pemasukan Gaji Pokok (terikat pada pos-pos wajib & kebutuhan rutin).
 * 2. Daftar `Pemasukan Tambahan / Freelance` yang secara dinamis memperbesar
 *    kuota Uang Bebas / Tabungan.
 * 3. Modal `Tambah Pemasukan Tambahan` dengan validasi inline dan notifikasi
 *    otomatis bahwa dana freelance dialokasikan ke kuota Uang Bebas.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  formatRupiah,
  parseRupiah,
  resolveDefaultCycleDate,
} from "@/lib/financial-calculations";
import { addIncome, deleteIncome } from "@/actions/incomes";
import { cn } from "@/lib/utils";

export interface IncomeDetailItem {
  id: string;
  source: string;
  amount: number;
  date: string;
  isBaseSalary: boolean;
}

interface IncomeSectionProps {
  monthId?: string;
  isClosed?: boolean;
  baseSalary: number;
  incomes?: IncomeDetailItem[];
  cycleYear?: number;
  cycleMonthIndex?: number;
}

export function IncomeSection({
  monthId,
  isClosed = false,
  baseSalary,
  incomes = [],
  cycleYear,
  cycleMonthIndex,
}: IncomeSectionProps) {
  const router = useRouter();
  const [openModal, setOpenModal] = React.useState(false);
  const [source, setSource] = React.useState("");
  const [amountRaw, setAmountRaw] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<{
    source?: string;
    amount?: string;
  }>({});
  const [isPending, startTransition] = React.useTransition();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const defaultDate = React.useMemo(
    () => resolveDefaultCycleDate(cycleYear, cycleMonthIndex),
    [cycleYear, cycleMonthIndex]
  );

  const [date, setDate] = React.useState(defaultDate);

  React.useEffect(() => {
    setDate(defaultDate);
  }, [defaultDate]);

  const extraIncomes = React.useMemo(
    () => incomes.filter((inc) => !inc.isBaseSalary),
    [incomes]
  );

  const totalExtra = React.useMemo(
    () => extraIncomes.reduce((acc, item) => acc + item.amount, 0),
    [extraIncomes]
  );

  const handleAddFreelance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthId) return;

    const trimmedSource = source.trim();
    const numericAmount = parseRupiah(amountRaw);
    const errors: { source?: string; amount?: string } = {};

    if (trimmedSource.length < 2) {
      errors.source = "Sumber pemasukan minimal 2 karakter (misal: Proyek Lepas)";
    }
    if (numericAmount <= 0) {
      errors.amount = "Nominal pemasukan harus lebih besar dari Rp 0";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    startTransition(async () => {
      const res = await addIncome({
        monthId,
        source: trimmedSource,
        amount: numericAmount,
        date,
        isBaseSalary: false,
      });

      if (!res.success) {
        setFieldErrors({
          source: res.fieldErrors?.source?.[0] ?? res.error,
          amount: res.fieldErrors?.amount?.[0],
        });
        return;
      }

      toast.success(`+${formatRupiah(numericAmount)} ditambahkan!`, {
        description: `Otomatis memperbesar kuota Uang Bebas / Tabungan dari "${trimmedSource}".`,
      });
      setSource("");
      setAmountRaw("");
      setOpenModal(false);
      router.refresh();
    });
  };

  const handleDeleteIncome = (id: string, label: string) => {
    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteIncome(id);
      setDeletingId(null);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(`Pemasukan "${label}" dihapus`);
      router.refresh();
    });
  };

  return (
    <section className="space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Sumber Pemasukan: Gaji Pokok vs Freelance
          </h2>
          <p className="text-xs text-muted-foreground">
            Gaji pokok mendanai pos anggaran rutin, sedangkan pendapatan freelance
            otomatis memperbesar buffer Uang Bebas & Tabungan.
          </p>
        </div>

        {monthId && !isClosed && (
          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3.5 rounded-xl gap-1.5 text-xs font-semibold self-start sm:self-auto"
              >
                <Plus className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Tambah Pemasukan Tambahan</span>
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md max-h-[90dvh]">
              <DialogHeader className="px-6 pt-5 pb-3.5 border-b border-border/40 shrink-0 text-left pr-14">
                <DialogTitle className="text-base font-bold text-foreground">
                  Tambah Pemasukan Tambahan / Freelance
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                  Catat pemasukan di luar gaji pokok seperti proyek freelance,
                  bonus, atau komisi.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={handleAddFreelance}
                className="flex flex-col flex-1 min-h-0 w-full m-0 p-0"
                noValidate
              >
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

                {/* Notifikasi Buffer Otomatis */}
                <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="size-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <p className="leading-relaxed">
                    Dana tambahan ini otomatis dialokasikan sebagai{" "}
                    <strong>Dynamic Freedom Buffer</strong> untuk memperbesar kuota{" "}
                    <strong>Uang Bebas / Tabungan</strong> tanpa mengubah alokasi
                    pos wajib Anda.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="income-source" className="text-xs font-medium">
                      Sumber Pemasukan
                    </Label>
                    <Input
                      id="income-source"
                      placeholder="Contoh: Proyek Freelance / Komisi"
                      value={source}
                      onChange={(e) => {
                        setSource(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, source: undefined }));
                      }}
                      className={cn(
                        "h-10 rounded-xl text-xs",
                        fieldErrors.source && "border-destructive"
                      )}
                    />
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {[
                        "Proyek Freelance",
                        "Bonus Kinerja",
                        "Komisi / Insentif",
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setSource(preset);
                            setFieldErrors((prev) => ({ ...prev, source: undefined }));
                          }}
                          className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    {fieldErrors.source && (
                      <p className="text-xs font-medium text-destructive">
                        {fieldErrors.source}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="income-amount" className="text-xs font-medium">
                        Nominal (Rp)
                      </Label>
                      <Input
                        id="income-amount"
                        type="text"
                        inputMode="numeric"
                        placeholder="250.000"
                        value={
                          parseRupiah(amountRaw) > 0
                            ? parseRupiah(amountRaw).toLocaleString("id-ID")
                            : ""
                        }
                        onChange={(e) => {
                          setAmountRaw(String(parseRupiah(e.target.value)));
                          setFieldErrors((prev) => ({ ...prev, amount: undefined }));
                        }}
                        className={cn(
                          "h-10 rounded-xl text-xs tabular-nums",
                          fieldErrors.amount && "border-destructive"
                        )}
                      />
                      {fieldErrors.amount && (
                        <p className="text-xs font-medium text-destructive">
                          {fieldErrors.amount}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="income-date" className="text-xs font-medium">
                        Tanggal Terima
                      </Label>
                      <Input
                        id="income-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="h-10 rounded-xl text-xs tabular-nums"
                      />
                    </div>
                  </div>
                </div>
                </div>

                <DialogFooter className="w-full border-t border-border/60 bg-background px-6 py-4 flex flex-row items-center justify-end gap-2.5 shrink-0 mt-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenModal(false)}
                    className="rounded-xl cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isPending}
                    className="rounded-xl gap-1.5 cursor-pointer font-semibold shadow-xs"
                  >
                    {isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                    <span>Simpan Pemasukan</span>
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Kartu Gaji Pokok */}
        <Card className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-3 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Briefcase className="size-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Pemasukan Utama Rutin
                </span>
                <h3 className="text-sm font-bold text-foreground tabular-nums">
                  {`Gaji Pokok: ${formatRupiah(baseSalary)}`}
                </h3>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="rounded-full text-[10px] font-semibold gap-1 px-2.5 py-0.5"
            >
              <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
              <span>Terikat Pos Rutin</span>
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pondasi anggaran bulanan yang menjamin seluruh pos kewajiban rutin,
            kebutuhan harian, dan cicilan aktif terpenuhi secara terencana.
          </p>
        </Card>

        {/* 2. Kartu Pemasukan Tambahan / Freelance */}
        <Card className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-3 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="size-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Dynamic Freedom Buffer
                </span>
                <h3 className="text-sm font-bold text-foreground tabular-nums">
                  {`Freelance & Bonus: +${formatRupiah(totalExtra)}`}
                </h3>
              </div>
            </div>
            <Badge
              variant="outline"
              className="rounded-full text-[10px] font-semibold border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            >
              {extraIncomes.length} Sumber
            </Badge>
          </div>

          {extraIncomes.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1 leading-relaxed">
              Belum ada pemasukan freelance pada siklus bulan ini. Setiap pemasukan
              sampingan yang dicatat akan otomatis menambah kuota Uang Bebas /
              Tabungan.
            </p>
          ) : (
            <div className="space-y-1.5 pt-1 max-h-36 overflow-y-auto pr-1">
              {extraIncomes.map((inc) => (
                <div
                  key={inc.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {inc.source}
                    </p>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {inc.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {`+${formatRupiah(inc.amount)}`}
                    </span>
                    {!isClosed && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === inc.id || isPending}
                        onClick={() => handleDeleteIncome(inc.id, inc.source)}
                        className="size-7 rounded-lg text-muted-foreground hover:text-destructive"
                        aria-label={`Hapus pemasukan ${inc.source}`}
                      >
                        {deletingId === inc.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
