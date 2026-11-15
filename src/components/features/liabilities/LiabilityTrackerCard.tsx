"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Liability Tracker Card (Fase F11, R1, R3, R8)
 * ==============================================================================
 *
 * ── Kenapa komponen ini ada ───────────────────────────────────────────────────
 *
 * Melacak utang & cicilan berjangka waktu hingga lunas:
 * - Ikon semantik Lucide (`AppCategoryIcon` & `IconPicker`) tanpa emoji literal.
 * - Progress bar pelunasan & persentase lunas (`tabular-nums`).
 * - Sisa bulan menuju lunas (`remainingMonths`).
 * - Badge `100% LUNAS` dengan ikon `Trophy` dan otomatis nonaktif/pensiun di
 *   bulan berikutnya.
 * - Sinkronisasi pembayaran cicilan (`recordInstallmentPayment`) dengan bulan
 *   berjalan (`monthId`) agar arus kas dan riwayat transaksi pos cicilan tercatat
 *   secara atomik.
 * - Opsi alokasi pos cicilan ke anggaran bulan berjalan saat menambah utang baru.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Plus,
  CheckCircle2,
  Loader2,
  CalendarClock,
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
import { AppCategoryIcon } from "@/components/common/AppCategoryIcon";
import { IconPicker } from "@/components/common/IconPicker";
import { formatRupiah, parseRupiah } from "@/lib/financial-calculations";
import {
  createLiability,
  recordInstallmentPayment,
} from "@/actions/liabilities";
import { cn } from "@/lib/utils";
import type { LiabilityWithProgress } from "@/types/liability";

interface LiabilityTrackerCardProps {
  liabilities: LiabilityWithProgress[];
  monthId?: string;
  freeBudgetRemaining?: number;
  isClosed?: boolean;
}

export function LiabilityTrackerCard({
  liabilities,
  monthId,
  freeBudgetRemaining,
  isClosed = false,
}: LiabilityTrackerCardProps) {
  const router = useRouter();
  const [openAddModal, setOpenAddModal] = React.useState(false);
  const [name, setName] = React.useState("");
  const [icon, setIcon] = React.useState("credit-card");
  const [totalRaw, setTotalRaw] = React.useState("");
  const [monthlyRaw, setMonthlyRaw] = React.useState("");
  const [tenorMonths, setTenorMonths] = React.useState("12");
  const [allocateToCurrentMonth, setAllocateToCurrentMonth] = React.useState(
    Boolean(monthId && !isClosed)
  );
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [payingId, setPayingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setAllocateToCurrentMonth(Boolean(monthId && !isClosed));
  }, [monthId, isClosed]);

  const handlePayInstallment = (item: LiabilityWithProgress) => {
    if (item.isSettled || item.id.startsWith("preview-")) return;
    setPayingId(item.id);

    startTransition(async () => {
      const res = await recordInstallmentPayment({
        liabilityId: item.id,
        amount: Math.min(item.monthlyPayment, item.remainingAmount),
        monthId: monthId && !isClosed ? monthId : undefined,
        method: "transfer",
      });
      setPayingId(null);

      if (!res.success) {
        toast.error(res.error);
        return;
      }

      if (res.data.isSettled) {
        toast.success(`Selamat! "${item.name}" 100% LUNAS!`, {
          description:
            "Pos cicilan ini otomatis pensiun di siklus bulan berikutnya.",
        });
      } else {
        toast.success(`Cicilan "${item.name}" tercatat`, {
          description: `Sisa pokok: ${formatRupiah(
            res.data.remainingAmount
          )}`,
        });
      }
      router.refresh();
    });
  };

  const handleCreateLiability = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const totalAmount = parseRupiah(totalRaw);
    const monthlyPayment = parseRupiah(monthlyRaw);
    const totalTenorMonths = Number(tenorMonths) || 1;

    if (trimmedName.length < 2) {
      setFormError("Nama utang/cicilan minimal 2 karakter");
      return;
    }
    if (totalAmount <= 0) {
      setFormError("Total pokok utang harus lebih besar dari Rp 0");
      return;
    }
    if (monthlyPayment <= 0 || monthlyPayment > totalAmount) {
      setFormError("Cicilan per bulan harus > Rp 0 dan <= total utang");
      return;
    }

    setFormError(null);
    startTransition(async () => {
      const shouldAllocate =
        Boolean(monthId && !isClosed) && allocateToCurrentMonth;
      const res = await createLiability({
        name: trimmedName,
        icon: icon.trim() || "credit-card",
        totalAmount,
        paidAmount: 0,
        monthlyPayment,
        totalMonths: totalTenorMonths,
        addToCurrentMonthBudget: shouldAllocate,
        monthId: shouldAllocate ? monthId : undefined,
      });

      if (!res.success) {
        setFormError(res.error);
        return;
      }

      toast.success(`Cicilan "${res.data.name}" ditambahkan`);
      setName("");
      setIcon("credit-card");
      setTotalRaw("");
      setMonthlyRaw("");
      setOpenAddModal(false);
      router.refresh();
    });
  };

  return (
    <section className="space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Tracking Cicilan & Utang Bertarget Lunas
          </h2>
          <p className="text-xs text-muted-foreground">
            Pantau progres pelunasan pokok utang. Begitu mencapai 100%, pos
            otomatis pensiun dari anggaran bulan berikutnya.
          </p>
        </div>

        {!isClosed && (
          <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3.5 rounded-xl gap-1.5 text-xs font-medium self-start sm:self-auto"
              >
                <Plus className="size-3.5" />
                <span>Tambah Cicilan</span>
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md max-h-[90dvh]">
              <DialogHeader className="px-6 pt-5 pb-3.5 border-b border-border/40 shrink-0 text-left pr-14">
                <DialogTitle className="text-base font-bold text-foreground">
                  Tambah Tracking Cicilan / Utang Baru
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                  Catat kewajiban cicilan berjangka waktu beserta target tenor
                  pelunasannya.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={handleCreateLiability}
                className="flex flex-col flex-1 min-h-0 w-full m-0 p-0"
                noValidate
              >
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="liab-name" className="text-xs">
                      Nama Kewajiban / Cicilan
                    </Label>
                    <Input
                      id="liab-name"
                      placeholder="Contoh: Cicilan Kendaraan / Pinjaman Pendidikan"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setFormError(null);
                      }}
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="liab-total" className="text-xs">
                        Total Pokok Utang (Rp)
                      </Label>
                      <Input
                        id="liab-total"
                        type="text"
                        inputMode="numeric"
                        placeholder="12.000.000"
                        value={
                          parseRupiah(totalRaw) > 0
                            ? parseRupiah(totalRaw).toLocaleString("id-ID")
                            : ""
                        }
                        onChange={(e) =>
                          setTotalRaw(String(parseRupiah(e.target.value)))
                        }
                        className="h-10 rounded-xl text-xs tabular-nums"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="liab-monthly" className="text-xs">
                        Cicilan / Bulan (Rp)
                      </Label>
                      <Input
                        id="liab-monthly"
                        type="text"
                        inputMode="numeric"
                        placeholder="1.000.000"
                        value={
                          parseRupiah(monthlyRaw) > 0
                            ? parseRupiah(monthlyRaw).toLocaleString("id-ID")
                            : ""
                        }
                        onChange={(e) =>
                          setMonthlyRaw(String(parseRupiah(e.target.value)))
                        }
                        className="h-10 rounded-xl text-xs tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="liab-tenor" className="text-xs">
                      Tenor Pelunasan (Bulan)
                    </Label>
                    <Input
                      id="liab-tenor"
                      type="number"
                      min={1}
                      max={360}
                      value={tenorMonths}
                      onChange={(e) => setTenorMonths(e.target.value)}
                      className="h-10 rounded-xl text-xs tabular-nums"
                    />
                  </div>

                  <IconPicker
                    value={icon}
                    onChange={setIcon}
                    fallbackGroup="pos_wajib"
                    label="Pilih Ikon Cicilan"
                  />

                  {monthId && !isClosed && (
                    <label className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-muted/20 p-3 text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allocateToCurrentMonth}
                        onChange={(e) =>
                          setAllocateToCurrentMonth(e.target.checked)
                        }
                        className="size-4 rounded accent-primary mt-0.5 shrink-0"
                      />
                      <span className="leading-relaxed text-foreground">
                        Alokasikan pos cicilan ke anggaran bulan berjalan
                        (otomatis memotong kuota Uang Bebas
                        {typeof freeBudgetRemaining === "number"
                          ? `, sisa saat ini: ${formatRupiah(freeBudgetRemaining)}`
                          : ""}
                        )
                      </span>
                    </label>
                  )}

                  {formError && (
                    <p className="text-xs font-medium text-destructive">
                      {formError}
                    </p>
                  )}
                </div>

                <DialogFooter className="w-full border-t border-border/60 bg-background px-6 py-4 flex flex-row items-center justify-end gap-2.5 shrink-0 mt-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenAddModal(false)}
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
                    <span>Simpan Cicilan</span>
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {liabilities.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-border/70 bg-muted/15 p-6 text-center space-y-1.5">
          <p className="text-xs font-semibold text-foreground">
            Belum ada catatan cicilan atau utang aktif
          </p>
          <p className="text-[11px] text-muted-foreground">
            Tambahkan kewajiban cicilan berjangka waktu jika Anda ingin melacak
            progres pelunasannya setiap bulan.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {liabilities.map((item) => {
            const isPreview = item.id.startsWith("preview-");
            return (
              <Card
                key={item.id}
                className={cn(
                  "rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs transition-all",
                  item.isSettled &&
                    "border-emerald-500/40 bg-emerald-500/5"
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {item.isSettled ? (
                      <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <Trophy className="size-5" />
                      </div>
                    ) : (
                      <AppCategoryIcon
                        iconKey={item.icon ?? "credit-card"}
                        group="pos_wajib"
                        liabilityId={item.id}
                        size="md"
                      />
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {item.name}
                      </h3>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        Tagihan: {formatRupiah(item.monthlyPayment)} / bln
                      </p>
                    </div>
                  </div>

                  {item.isSettled ? (
                    <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600 text-[10px] font-bold gap-1 px-2.5 py-0.5">
                      <Trophy className="size-3 shrink-0" />
                      <span>100% LUNAS</span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="rounded-full text-[10px] font-semibold gap-1 px-2.5 py-0.5 tabular-nums"
                    >
                      <CalendarClock className="size-3 text-amber-500" />
                      <span>{`${item.remainingMonths} Bulan Tersisa`}</span>
                    </Badge>
                  )}
                </div>

                {/* Progress Bar Pelunasan */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Progres Pelunasan Pokok:
                    </span>
                    <span className="font-bold text-foreground tabular-nums">
                      {item.percentage}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        item.isSettled ? "bg-emerald-500" : "bg-amber-500"
                      )}
                      style={{
                        width: `${Math.min(100, item.percentage)}%`,
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] tabular-nums">
                    <div>
                      <span className="text-muted-foreground block">
                        Total Utang
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatRupiah(item.totalAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">
                        Sudah Dibayar
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(item.paidAmount)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground block">
                        Sisa Pokok
                      </span>
                      <span className="font-bold text-foreground">
                        {formatRupiah(item.remainingAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action / Settled Banner */}
                <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                  {item.isSettled ? (
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                      Kewajiban ini telah lunas penuh dan tidak lagi memotong gaji
                      bulan berikutnya.
                    </p>
                  ) : (
                    <>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        Tenor: {item.totalMonths ?? Math.ceil(item.totalAmount / Math.max(1, item.monthlyPayment))} bln ({item.remainingMonths} bln tersisa)
                      </span>
                      {!isClosed && !isPreview && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={payingId === item.id || isPending}
                          onClick={() => handlePayInstallment(item)}
                          className="h-8 px-3 rounded-xl text-xs font-semibold gap-1.5"
                        >
                          {payingId === item.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                          )}
                          <span>
                            Bayar {formatRupiah(Math.min(item.monthlyPayment, item.remainingAmount))}
                          </span>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
