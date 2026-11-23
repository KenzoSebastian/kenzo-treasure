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
  Pencil,
  Trash2,
  Info,
  CheckCircle2,
  Loader2,
  CalendarClock,
  Sparkles,
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
import {
  formatRupiah,
  parseRupiah,
  calculateMonthlyInstallment,
  calculateTenorFromMonthly,
} from "@/lib/financial-calculations";
import {
  createLiability,
  updateLiability,
  deleteLiability,
  recordInstallmentPayment,
} from "@/actions/liabilities";
import { cn } from "@/lib/utils";
import type { LiabilityWithProgress } from "@/types/liability";

interface LiabilityTrackerCardProps {
  liabilities: LiabilityWithProgress[];
  monthId?: string;
  freeBudgetRemaining?: number;
  paidLiabilityIds?: string[];
  isClosed?: boolean;
}

export function LiabilityTrackerCard({
  liabilities,
  monthId,
  freeBudgetRemaining,
  paidLiabilityIds,
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

  // State Modal Edit Cicilan
  const [editingItem, setEditingItem] =
    React.useState<LiabilityWithProgress | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editIcon, setEditIcon] = React.useState("credit-card");
  const [editTotalRaw, setEditTotalRaw] = React.useState("");
  const [editMonthlyRaw, setEditMonthlyRaw] = React.useState("");
  const [editTenorMonths, setEditTenorMonths] = React.useState("12");
  const [editIsSettled, setEditIsSettled] = React.useState(false);
  const [editFormError, setEditFormError] = React.useState<string | null>(null);

  // State Modal Hapus Cicilan
  const [deletingItem, setDeletingItem] =
    React.useState<LiabilityWithProgress | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // State Modal Konfirmasi Bayar Cicilan (Reguler / Ekstra)
  const [payItem, setPayItem] = React.useState<{
    item: LiabilityWithProgress;
    isExtra: boolean;
  } | null>(null);

  const [isPending, startTransition] = React.useTransition();
  const [payingId, setPayingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setAllocateToCurrentMonth(Boolean(monthId && !isClosed));
  }, [monthId, isClosed]);

  const handleOpenEditModal = (item: LiabilityWithProgress) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditIcon(item.icon ?? "credit-card");
    setEditTotalRaw(String(item.totalAmount));
    setEditMonthlyRaw(String(item.monthlyPayment));
    const fallbackTenor = Math.max(
      1,
      Math.ceil(item.totalAmount / Math.max(1, item.monthlyPayment))
    );
    setEditTenorMonths(String(item.totalMonths ?? fallbackTenor));
    setEditIsSettled(Boolean(item.isSettled));
    setEditFormError(null);
  };

  const handlePayInstallment = (
    item: LiabilityWithProgress,
    isExtraPayment = false
  ) => {
    if (item.isSettled || item.id.startsWith("preview-")) return;
    setPayingId(item.id);

    startTransition(async () => {
      const res = await recordInstallmentPayment({
        liabilityId: item.id,
        amount: Math.min(item.monthlyPayment, item.remainingAmount),
        monthId: monthId && !isClosed ? monthId : undefined,
        method: "transfer",
        isExtraPayment,
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
      } else if (isExtraPayment) {
        toast.success(`Pembayaran ekstra "${item.name}" tercatat`, {
          description: `Dipotong dari Uang Bebas. Sisa pokok: ${formatRupiah(
            res.data.remainingAmount
          )}`,
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

  const handleUpdateLiability = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const trimmedName = editName.trim();
    const totalAmount = parseRupiah(editTotalRaw);
    const monthlyPayment = parseRupiah(editMonthlyRaw);
    const totalTenorMonths = Number(editTenorMonths) || 1;

    if (trimmedName.length < 2) {
      setEditFormError("Nama utang/cicilan minimal 2 karakter");
      return;
    }
    if (totalAmount <= 0) {
      setEditFormError("Total pokok utang harus lebih besar dari Rp 0");
      return;
    }
    if (totalAmount < editingItem.paidAmount) {
      setEditFormError(
        `Total pokok tidak boleh lebih kecil dari yang sudah dibayar (${formatRupiah(
          editingItem.paidAmount
        )})`
      );
      return;
    }
    if (monthlyPayment <= 0 || monthlyPayment > totalAmount) {
      setEditFormError("Cicilan per bulan harus > Rp 0 dan <= total utang");
      return;
    }

    setEditFormError(null);
    startTransition(async () => {
      const res = await updateLiability({
        liabilityId: editingItem.id,
        name: trimmedName,
        icon: editIcon.trim() || "credit-card",
        totalAmount,
        monthlyPayment,
        totalMonths: totalTenorMonths,
        isSettled: editIsSettled,
      });

      if (!res.success) {
        setEditFormError(res.error);
        return;
      }

      toast.success(`Cicilan "${res.data.name}" berhasil diperbarui`, {
        description: `Tagihan per bulan: ${formatRupiah(
          res.data.monthlyPayment
        )} (Tenor: ${totalTenorMonths} bulan)`,
      });
      setEditingItem(null);
      router.refresh();
    });
  };

  const handleDeleteLiability = () => {
    if (!deletingItem) return;
    setDeleteError(null);

    startTransition(async () => {
      const res = await deleteLiability(deletingItem.id);
      if (!res.success) {
        setDeleteError(res.error);
        return;
      }

      toast.success(`Cicilan "${res.data.name}" berhasil dihapus`, {
        description:
          res.data.reallocatedAmount > 0
            ? `Alokasi ${formatRupiah(
                res.data.reallocatedAmount
              )} dikembalikan ke Uang Bebas`
            : undefined,
      });
      setDeletingItem(null);
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
                        onChange={(e) => {
                          const newTotal = parseRupiah(e.target.value);
                          setTotalRaw(String(newTotal));
                          setFormError(null);
                          const tenor = Number(tenorMonths);
                          if (newTotal > 0 && tenor > 0) {
                            setMonthlyRaw(
                              String(
                                calculateMonthlyInstallment(newTotal, tenor)
                              )
                            );
                          }
                        }}
                        className="h-10 rounded-xl text-xs tabular-nums"
                      />
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
                        placeholder="12"
                        value={tenorMonths}
                        onChange={(e) => {
                          const newTenorStr = e.target.value;
                          setTenorMonths(newTenorStr);
                          setFormError(null);
                          const tenor = Number(newTenorStr);
                          const total = parseRupiah(totalRaw);
                          if (total > 0 && tenor > 0) {
                            setMonthlyRaw(
                              String(
                                calculateMonthlyInstallment(total, tenor)
                              )
                            );
                          }
                        }}
                        className="h-10 rounded-xl text-xs tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="liab-monthly" className="text-xs">
                        Cicilan / Bulan (Rp)
                      </Label>
                      <span className="text-[10px] text-muted-foreground italic">
                        Otomatis: Total ÷ Tenor
                      </span>
                    </div>
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
                      onChange={(e) => {
                        const newMonthly = parseRupiah(e.target.value);
                        setMonthlyRaw(String(newMonthly));
                        setFormError(null);
                        const total = parseRupiah(totalRaw);
                        if (total > 0 && newMonthly > 0) {
                          setTenorMonths(
                            String(calculateTenorFromMonthly(total, newMonthly))
                          );
                        }
                      }}
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
            const isPaidThisMonth = Boolean(paidLiabilityIds?.includes(item.id));
            const payAmount = Math.min(item.monthlyPayment, item.remainingAmount);
            const isFreeBudgetInsufficient =
              isPaidThisMonth && (freeBudgetRemaining ?? 0) < payAmount;

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
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-foreground">
                          {item.name}
                        </h3>
                        {!isClosed && !isPreview && !item.isSettled && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="inline-flex items-center justify-center size-5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                              title={`Ubah cicilan ${item.name}`}
                              aria-label={`Ubah cicilan ${item.name}`}
                            >
                              <Pencil className="size-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingItem(item);
                                setDeleteError(null);
                              }}
                              className="inline-flex items-center justify-center size-5 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title={`Hapus cicilan ${item.name}`}
                              aria-label={`Hapus cicilan ${item.name}`}
                            >
                              <Trash2 className="size-2.5" />
                            </button>
                          </>
                        )}
                      </div>
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
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {isPaidThisMonth && (
                        <Badge
                          variant="outline"
                          className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 text-[10px] font-semibold gap-1 px-2.5 py-0.5"
                        >
                          <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Sudah Dibayar Bulan Ini</span>
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="rounded-full text-[10px] font-semibold gap-1 px-2.5 py-0.5 tabular-nums"
                      >
                        <CalendarClock className="size-3 text-amber-500" />
                        <span>{`${item.remainingMonths} Bulan Tersisa`}</span>
                      </Badge>
                    </div>
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
                <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  {item.isSettled ? (
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                      Kewajiban ini telah lunas penuh dan tidak lagi memotong gaji
                      bulan berikutnya.
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          Tenor: {item.totalMonths ?? Math.ceil(item.totalAmount / Math.max(1, item.monthlyPayment))} bln ({item.remainingMonths} bln tersisa)
                        </span>
                        {isPaidThisMonth && isFreeBudgetInsufficient && (
                          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 tabular-nums">
                            Sisa Uang Bebas ({formatRupiah(freeBudgetRemaining ?? 0)}) tidak cukup untuk bayar ekstra
                          </span>
                        )}
                      </div>
                      {!isClosed && !isPreview && (
                        isPaidThisMonth ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isFreeBudgetInsufficient || payingId === item.id || isPending}
                            onClick={() => setPayItem({ item, isExtra: true })}
                            title={
                              isFreeBudgetInsufficient
                                ? `Sisa Uang Bebas (${formatRupiah(freeBudgetRemaining ?? 0)}) tidak mencukupi untuk bayar ekstra`
                                : `Bayar ekstra ${formatRupiah(payAmount)} memotong Uang Bebas`
                            }
                            aria-label={`Bayar ekstra cicilan ${item.name}`}
                            className="h-8 px-3 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer border-primary/30 text-primary hover:bg-primary/5 disabled:cursor-not-allowed"
                          >
                            {payingId === item.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="size-3.5 text-primary" />
                            )}
                            <span>
                              Bayar Ekstra {formatRupiah(payAmount)}
                            </span>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={payingId === item.id || isPending}
                            onClick={() => setPayItem({ item, isExtra: false })}
                            aria-label={`Bayar cicilan ${item.name}`}
                            className="h-8 px-3 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
                          >
                            {payingId === item.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                            )}
                            <span>
                              Bayar {formatRupiah(payAmount)}
                            </span>
                          </Button>
                        )
                      )}
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Edit Cicilan */}
      <Dialog
        open={Boolean(editingItem)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
            setEditFormError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90dvh]">
          <DialogHeader className="px-6 pt-5 pb-3.5 border-b border-border/40 shrink-0 text-left pr-14">
            <DialogTitle className="text-base font-bold text-foreground">
              Ubah Tracking Cicilan / Utang
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Perbarui rincian utang pokok, tenor, cicilan per bulan, atau ikon.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleUpdateLiability}
            className="flex flex-col flex-1 min-h-0 w-full m-0 p-0"
            noValidate
          >
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/85 leading-relaxed">
                <Info className="size-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Perubahan tagihan per bulan otomatis menyinkronkan pos anggaran
                  siklus berjalan (jika ada) dan menyesuaikan alokasi Uang Bebas
                  secara atomik.
                </span>
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-liab-name" className="text-xs">
                  Nama Kewajiban / Cicilan
                </Label>
                <Input
                  id="edit-liab-name"
                  placeholder="Contoh: Cicilan Kendaraan"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    setEditFormError(null);
                  }}
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-liab-total" className="text-xs">
                    Total Pokok Utang (Rp)
                  </Label>
                  <Input
                    id="edit-liab-total"
                    type="text"
                    inputMode="numeric"
                    placeholder="12.000.000"
                    value={
                      parseRupiah(editTotalRaw) > 0
                        ? parseRupiah(editTotalRaw).toLocaleString("id-ID")
                        : ""
                    }
                    onChange={(e) => {
                      const newTotal = parseRupiah(e.target.value);
                      setEditTotalRaw(String(newTotal));
                      setEditFormError(null);
                      const tenor = Number(editTenorMonths);
                      if (newTotal > 0 && tenor > 0) {
                        setEditMonthlyRaw(
                          String(
                            calculateMonthlyInstallment(newTotal, tenor)
                          )
                        );
                      }
                    }}
                    className="h-10 rounded-xl text-xs tabular-nums"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-liab-tenor" className="text-xs">
                    Tenor Pelunasan (Bulan)
                  </Label>
                  <Input
                    id="edit-liab-tenor"
                    type="number"
                    min={1}
                    max={360}
                    placeholder="12"
                    value={editTenorMonths}
                    onChange={(e) => {
                      const newTenorStr = e.target.value;
                      setEditTenorMonths(newTenorStr);
                      setEditFormError(null);
                      const tenor = Number(newTenorStr);
                      const total = parseRupiah(editTotalRaw);
                      if (total > 0 && tenor > 0) {
                        setEditMonthlyRaw(
                          String(
                            calculateMonthlyInstallment(total, tenor)
                          )
                        );
                      }
                    }}
                    className="h-10 rounded-xl text-xs tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-liab-monthly" className="text-xs">
                    Cicilan / Bulan (Rp)
                  </Label>
                  <span className="text-[10px] text-muted-foreground italic">
                    Otomatis: Total ÷ Tenor
                  </span>
                </div>
                <Input
                  id="edit-liab-monthly"
                  type="text"
                  inputMode="numeric"
                  placeholder="1.000.000"
                  value={
                    parseRupiah(editMonthlyRaw) > 0
                      ? parseRupiah(editMonthlyRaw).toLocaleString("id-ID")
                      : ""
                  }
                  onChange={(e) => {
                    const newMonthly = parseRupiah(e.target.value);
                    setEditMonthlyRaw(String(newMonthly));
                    setEditFormError(null);
                    const total = parseRupiah(editTotalRaw);
                    if (total > 0 && newMonthly > 0) {
                      setEditTenorMonths(
                        String(calculateTenorFromMonthly(total, newMonthly))
                      );
                    }
                  }}
                  className="h-10 rounded-xl text-xs tabular-nums"
                />
              </div>

              <IconPicker
                value={editIcon}
                onChange={setEditIcon}
                fallbackGroup="pos_wajib"
                label="Pilih Ikon Cicilan"
              />

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="edit-liab-settled"
                  type="checkbox"
                  checked={editIsSettled}
                  onChange={(e) => setEditIsSettled(e.target.checked)}
                  className="size-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <Label
                  htmlFor="edit-liab-settled"
                  className="text-xs font-semibold cursor-pointer text-foreground flex flex-col gap-0.5"
                >
                  <span>Tandai cicilan ini lunas sekarang</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Sisa kuota bulan berjalan akan otomatis kembali ke Uang Bebas
                  </span>
                </Label>
              </div>

              {editFormError && (
                <p className="text-xs font-medium text-destructive">
                  {editFormError}
                </p>
              )}
            </div>

            <DialogFooter className="w-full border-t border-border/60 bg-background px-6 py-4 flex flex-row items-center justify-end gap-2.5 shrink-0 mt-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingItem(null)}
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
                  <CheckCircle2 className="size-3.5" />
                )}
                <span>Simpan Perubahan</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Hapus Cicilan */}
      <Dialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingItem(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90dvh]">
          <DialogHeader className="px-6 pt-5 pb-3.5 border-b border-border/40 shrink-0 text-left pr-14">
            <DialogTitle className="text-base font-bold text-destructive">
              Hapus Tracking Cicilan
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan cicilan &quot;{deletingItem?.name}&quot;? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-foreground/85 leading-relaxed">
              <Info className="size-4 text-rose-500 shrink-0 mt-0.5" />
              <span>
                Jika pos cicilan ini di bulan berjalan belum memiliki transaksi riil,
                pos tersebut akan otomatis dihapus dan jatah anggarannya dikembalikan
                ke <strong>Uang Bebas / Tabungan</strong>.
              </span>
            </div>

            {deleteError && (
              <p className="text-xs font-medium text-destructive">
                {deleteError}
              </p>
            )}
          </div>

          <DialogFooter className="w-full border-t border-border/60 bg-background px-6 py-4 flex flex-row items-center justify-end gap-2.5 shrink-0 mt-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDeletingItem(null);
                setDeleteError(null);
              }}
              className="rounded-xl cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleDeleteLiability}
              className="rounded-xl gap-1.5 cursor-pointer font-semibold shadow-xs"
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              <span>Hapus Cicilan</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog Konfirmasi Bayar Cicilan (Reguler / Ekstra) */}
      <Dialog
        open={Boolean(payItem)}
        onOpenChange={(open) => !open && setPayItem(null)}
      >
        <DialogContent className="sm:max-w-md max-h-[90dvh]">
          <DialogHeader className="px-6 pt-5 pb-3.5 border-b border-border/40 shrink-0 text-left pr-14">
            <DialogTitle className="text-base font-bold text-foreground">
              {payItem?.isExtra
                ? "Konfirmasi Pembayaran Ekstra (Percepatan Pokok)"
                : "Konfirmasi Pembayaran Cicilan"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {payItem?.isExtra
                ? "Pembayaran ekstra ini akan dipotong langsung dari saldo Uang Bebas / Tabungan."
                : "Pastikan rincian pembayaran cicilan ini sudah sesuai sebelum dicatat."}
            </DialogDescription>
          </DialogHeader>

          {payItem && (
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5 min-h-0 text-xs">
              {payItem.isExtra && (
                <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/85 leading-relaxed">
                  <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    Cicilan bulan ini sudah dibayar penuh. Pembayaran ekstra ini akan memotong saldo <strong>Uang Bebas / Tabungan</strong> dan mempercepat sisa pokok utang tanpa membuat pos cicilan overbudget.
                  </span>
                </div>
              )}

              <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Kewajiban / Cicilan</span>
                  <span className="font-bold text-foreground">{payItem.item.name}</span>
                </div>
                {payItem.isExtra && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Sumber Pemotongan</span>
                    <span className="font-semibold text-primary">Uang Bebas / Tabungan</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {payItem.isExtra ? "Nominal Pembayaran Ekstra" : "Nominal Tagihan Bulan Ini"}
                  </span>
                  <span className="font-extrabold text-foreground tabular-nums text-sm">
                    {formatRupiah(Math.min(payItem.item.monthlyPayment, payItem.item.remainingAmount))}
                  </span>
                </div>
                {payItem.isExtra && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sisa Uang Bebas Saat Ini</span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {formatRupiah(freeBudgetRemaining ?? 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sisa Uang Bebas Sesudah Bayar</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatRupiah(
                          Math.max(
                            0,
                            (freeBudgetRemaining ?? 0) -
                              Math.min(payItem.item.monthlyPayment, payItem.item.remainingAmount)
                          )
                        )}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between border-t border-border/40 pt-2">
                  <span className="text-muted-foreground">Sisa Pokok Saat Ini</span>
                  <span className="font-semibold text-muted-foreground tabular-nums">
                    {formatRupiah(payItem.item.remainingAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sisa Pokok Sesudah Bayar</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatRupiah(
                      Math.max(
                        0,
                        payItem.item.remainingAmount -
                          Math.min(payItem.item.monthlyPayment, payItem.item.remainingAmount)
                      )
                    )}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {payItem.isExtra
                  ? "Transaksi akan tercatat pada rincian pos Uang Bebas / Tabungan dan memotong pokok utang secara atomik."
                  : "Pembayaran akan dicatat pada pos anggaran bulan ini dan memotong pokok utang secara atomik."}
              </p>
            </div>
          )}

          <DialogFooter className="w-full border-t border-border/60 bg-background px-6 py-4 flex flex-row items-center justify-end gap-2.5 shrink-0 mt-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPayItem(null)}
              className="rounded-xl cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!payItem || payingId === payItem?.item.id}
              onClick={() => {
                if (payItem) {
                  const target = payItem.item;
                  const isExtra = payItem.isExtra;
                  setPayItem(null);
                  handlePayInstallment(target, isExtra);
                }
              }}
              className="rounded-xl gap-1.5 font-semibold cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              {payingId === payItem?.item.id ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              <span>{payItem?.isExtra ? "Konfirmasi Bayar Ekstra" : "Konfirmasi Bayar"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
