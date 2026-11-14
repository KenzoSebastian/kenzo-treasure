"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Allocate Wishlist Sinking Fund Drawer (Fase F13)
 * ==============================================================================
 *
 * ── Kenapa komponen ini ada ───────────────────────────────────────────────────
 *
 * Menyediakan Drawer/Modal alokasi dana Sinking Fund ke barang impian:
 * 1. Menampilkan sisa `Saldo Tabungan Bebas` yang tersedia (`tabular-nums`).
 * 2. Input nominal alokasi dengan quick pill shortcut (`10%`, `25%`, `50%`,
 *    `Semua Saldo`).
 * 3. Opsi tarik balik dana dari wishlist ke tabungan bebas (`withdrawFromWishlist`).
 * 4. Efek selebrasi Confetti (`canvas-confetti`) saat alokasi mencapai milestone
 *    penting (`50%`, `75%`, `90%`, `95%`, dan `100% Lunas`).
 * 5. Tabel log riwayat mutasi alokasi di dalam detail wishlist.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  History,
  Sparkles,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, parseRupiah } from "@/lib/financial-calculations";
import { allocateSavings, withdrawFromWishlist } from "@/actions/wishlists";
import { cn } from "@/lib/utils";
import type { WishlistWithProgress } from "@/types/wishlist";

interface AllocateWishlistDrawerProps {
  wishlist: WishlistWithProgress;
  freeSavingsBalance: number;
  trigger?: React.ReactNode;
}

export function AllocateWishlistDrawer({
  wishlist,
  freeSavingsBalance,
  trigger,
}: AllocateWishlistDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"allocate" | "withdraw">("allocate");
  const [amountRaw, setAmountRaw] = React.useState("");
  const [note, setNote] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const remainingNeeded = Math.max(
    0,
    wishlist.targetAmount - wishlist.savedAmount
  );
  const maxAllocate = Math.min(
    freeSavingsBalance,
    remainingNeeded > 0 ? remainingNeeded : freeSavingsBalance
  );

  const fireCelebrationConfetti = () => {
    try {
      confetti({
        particleCount: 85,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Abaikan jika dijalankan pada environment non-canvas (SSR/test)
    }
  };

  const handleShortcutPercent = (ratio: number) => {
    setErrorMsg(null);
    if (mode === "allocate") {
      const base = freeSavingsBalance > 0 ? freeSavingsBalance : remainingNeeded;
      const calculated = Math.min(
        Math.round(base * ratio),
        remainingNeeded > 0 ? remainingNeeded : base
      );
      setAmountRaw(String(Math.max(0, calculated)));
    } else {
      const calculated = Math.round(wishlist.savedAmount * ratio);
      setAmountRaw(String(Math.max(0, calculated)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wishlist.id.startsWith("preview-")) {
      setErrorMsg(
        "Buat barang impian terlebih dahulu untuk mulai mengalokasikan dana."
      );
      return;
    }

    const numericAmount = parseRupiah(amountRaw);
    if (numericAmount <= 0) {
      setErrorMsg("Nominal harus lebih besar dari Rp 0");
      return;
    }

    if (mode === "allocate" && numericAmount > freeSavingsBalance) {
      setErrorMsg(
        `Nominal melebihi Saldo Tabungan Bebas (${formatRupiah(freeSavingsBalance)})`
      );
      return;
    }

    if (mode === "withdraw" && numericAmount > wishlist.savedAmount) {
      setErrorMsg(
        `Nominal tarik melebihi dana terkumpul (${formatRupiah(wishlist.savedAmount)})`
      );
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      if (mode === "allocate") {
        const res = await allocateSavings({
          wishlistId: wishlist.id,
          amount: numericAmount,
          direction: "deposit",
          notes: note.trim() || "Alokasi Sinking Fund",
        });

        if (!res.success) {
          setErrorMsg(res.error);
          return;
        }

        const pct = res.data.progress.percentage;
        if (pct >= 50) {
          fireCelebrationConfetti();
          toast.success(
            pct >= 100
              ? `🎉 100% Tercapai! "${wishlist.name}" siap dibeli!`
              : `✨ Milestone ${pct}% tercapai untuk "${wishlist.name}"!`,
            {
              description: `Terkumpul: ${formatRupiah(
                res.data.savedAmount
              )} dari ${formatRupiah(res.data.targetAmount)}`,
            }
          );
        } else {
          toast.success(
            `+${formatRupiah(numericAmount)} dialokasikan ke "${wishlist.name}"`
          );
        }
      } else {
        const res = await withdrawFromWishlist(
          wishlist.id,
          numericAmount,
          note.trim() || "Tarik balik ke Tabungan Bebas"
        );

        if (!res.success) {
          setErrorMsg(res.error);
          return;
        }

        toast.success(
          `${formatRupiah(numericAmount)} dikembalikan ke Saldo Tabungan Bebas`
        );
      }

      setAmountRaw("");
      setNote("");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            variant="default"
            className="h-9 px-3.5 rounded-xl gap-1.5 text-xs font-semibold flex-1"
          >
            <PiggyBank className="size-3.5" />
            <span>Alokasi / Tarik Dana</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg rounded-2xl p-6 max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <DialogHeader>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <Sparkles className="size-3.5" />
              <span>Sinking Fund Barang Impian</span>
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              {wishlist.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Terkumpul{" "}
              <strong className="text-foreground tabular-nums">
                {formatRupiah(wishlist.savedAmount)}
              </strong>{" "}
              dari target{" "}
              <strong className="text-foreground tabular-nums">
                {formatRupiah(wishlist.targetAmount)}
              </strong>{" "}
              ({wishlist.progress.percentage}%).
            </DialogDescription>
          </DialogHeader>

          {/* Info Saldo Tabungan Bebas */}
          <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/30 p-3.5 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">
                Saldo Tabungan Bebas Tersedia
              </span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatRupiah(freeSavingsBalance)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground block text-[11px]">
                Kekurangan Target
              </span>
              <span className="text-sm font-bold text-foreground tabular-nums">
                {formatRupiah(remainingNeeded)}
              </span>
            </div>
          </div>

          {/* Toggle Mode: Alokasi vs Tarik Balik */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("allocate");
                setErrorMsg(null);
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-semibold transition-all",
                mode === "allocate"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowUpRight className="size-3.5 text-emerald-600" />
              <span>Setor ke Wishlist</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("withdraw");
                setErrorMsg(null);
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-semibold transition-all",
                mode === "withdraw"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowDownLeft className="size-3.5 text-amber-600" />
              <span>Tarik ke Tabungan</span>
            </button>
          </div>

          {/* Input Nominal & Quick Pills (10%, 25%, 50%, Semua Saldo) */}
          <div className="space-y-2">
            <Label htmlFor="alloc-amount" className="text-xs font-semibold">
              {mode === "allocate"
                ? "Nominal Alokasi (Rp)"
                : "Nominal Penarikan (Rp)"}
            </Label>
            <Input
              id="alloc-amount"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={
                parseRupiah(amountRaw) > 0
                  ? parseRupiah(amountRaw).toLocaleString("id-ID")
                  : ""
              }
              onChange={(e) => {
                setAmountRaw(String(parseRupiah(e.target.value)));
                setErrorMsg(null);
              }}
              className={cn(
                "h-11 rounded-xl text-base font-bold tabular-nums",
                errorMsg && "border-destructive"
              )}
            />

            {/* Quick Pill Shortcuts */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {[
                { label: "10%", ratio: 0.1 },
                { label: "25%", ratio: 0.25 },
                { label: "50%", ratio: 0.5 },
                { label: "Semua Saldo", ratio: 1 },
              ].map((pill) => (
                <button
                  key={pill.label}
                  type="button"
                  onClick={() => handleShortcutPercent(pill.ratio)}
                  className="rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-[11px] font-semibold text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                >
                  {pill.label}
                </button>
              ))}
              {mode === "allocate" && maxAllocate > 0 && (
                <button
                  type="button"
                  onClick={() => setAmountRaw(String(maxAllocate))}
                  className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400"
                >
                  Lunasi ({formatRupiah(maxAllocate)})
                </button>
              )}
            </div>

            {errorMsg && (
              <p className="text-xs font-medium text-destructive">{errorMsg}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="alloc-note" className="text-xs font-medium">
              Catatan Mutasi (Opsional)
            </Label>
            <Input
              id="alloc-note"
              placeholder="Contoh: Sisihan bonus freelance bulan ini"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-9 rounded-xl text-xs"
            />
          </div>

          {/* Tabel Log Riwayat Mutasi Alokasi (Fase F13) */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <History className="size-3.5" />
                <span>Riwayat Mutasi Sinking Fund</span>
              </span>
              <span className="tabular-nums">
                {wishlist.allocations.length} Catatan
              </span>
            </div>

            {wishlist.allocations.length === 0 ? (
              <p className="text-[11px] text-muted-foreground py-2 text-center rounded-xl border border-dashed border-border/60">
                Belum ada riwayat mutasi alokasi pada barang impian ini.
              </p>
            ) : (
              <div className="max-h-36 overflow-y-auto rounded-xl border border-border/60 divide-y divide-border/50">
                {wishlist.allocations.map((alloc) => {
                  const isPositive = alloc.amount >= 0;
                  return (
                    <div
                      key={alloc.id}
                      className="flex items-center justify-between px-3 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {alloc.notes ||
                            (isPositive ? "Setoran Alokasi" : "Penarikan Dana")}
                        </p>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {new Date(alloc.createdAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "tabular-nums text-[11px] font-bold shrink-0",
                          isPositive
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        )}
                      >
                        {isPositive
                          ? `+${formatRupiah(alloc.amount)}`
                          : formatRupiah(alloc.amount)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="rounded-xl"
            >
              Tutup
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="rounded-xl gap-1.5 font-semibold"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              <span>
                {mode === "allocate"
                  ? "Simpan Alokasi"
                  : "Konfirmasi Penarikan"}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
