"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Emergency Fund Vault & Safety Months Meter (Fase F14, R1, R3, R6)
 * ==============================================================================
 *
 * ── Kenapa komponen ini ada ───────────────────────────────────────────────────
 *
 * Menampilkan kartu Brankas Dana Darurat yang terpisah dari Tabungan Bebas:
 * - Visual brankas dengan indikator kunci keamanan (`Lock`) tanpa emoji literal.
 * - Nominal Saldo Dana Darurat terkumpul vs Target Ideal pengguna.
 * - Meter *Safety Months* (`Bertahan Aman selama X,X Bulan Biaya Hidup`).
 * - Modal `Setor / Tarik Dana Darurat` dengan `SlidingSegmentedControl` dan
 *   **proteksi konfirmasi ganda** ketika pengguna menarik dana dari brankas darurat.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Plus,
  Loader2,
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
import { SlidingSegmentedControl } from "@/components/common/SlidingSegmentedControl";
import { formatRupiah, parseRupiah } from "@/lib/financial-calculations";
import {
  transferToEmergencyFund,
  withdrawFromEmergencyFund,
  topUpFreeSavings,
} from "@/actions/savings";
import { cn } from "@/lib/utils";
import type { SavingsVaultSummary } from "@/types/savings";

interface EmergencyVaultCardProps {
  vault: SavingsVaultSummary;
}

type VaultMutationMode =
  | "deposit_emergency"
  | "withdraw_emergency"
  | "topup_free";

const VAULT_MODE_OPTIONS: Array<{
  value: VaultMutationMode;
  label: string;
}> = [
  { value: "deposit_emergency", label: "Setor Darurat" },
  { value: "withdraw_emergency", label: "Tarik Darurat" },
  { value: "topup_free", label: "Top-Up Bebas" },
];

export function EmergencyVaultCard({ vault }: EmergencyVaultCardProps) {
  const router = useRouter();
  const [openModal, setOpenModal] = React.useState(false);
  const [mode, setMode] =
    React.useState<VaultMutationMode>("deposit_emergency");
  const [amountRaw, setAmountRaw] = React.useState("");
  const [doubleConfirmed, setDoubleConfirmed] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const safetyMonthsLabel = vault.safetyMonths.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseRupiah(amountRaw);
    if (numericAmount <= 0) {
      setErrorMsg("Nominal harus lebih besar dari Rp 0");
      return;
    }

    if (mode === "withdraw_emergency" && !doubleConfirmed) {
      setErrorMsg(
        "Wajib centang konfirmasi keamanan ganda sebelum mencairkan Dana Darurat."
      );
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      if (mode === "deposit_emergency") {
        const res = await transferToEmergencyFund({
          amount: numericAmount,
        });
        if (!res.success) {
          setErrorMsg(res.error);
          return;
        }
        toast.success(
          `${formatRupiah(numericAmount)} diamankan ke Brankas Dana Darurat!`
        );
      } else if (mode === "withdraw_emergency") {
        const res = await withdrawFromEmergencyFund(numericAmount);
        if (!res.success) {
          setErrorMsg(res.error);
          return;
        }
        toast.success(
          `${formatRupiah(numericAmount)} ditarik dari Dana Darurat ke Tabungan Bebas`
        );
      } else {
        const res = await topUpFreeSavings(numericAmount);
        if (!res.success) {
          setErrorMsg(res.error);
          return;
        }
        toast.success(
          `+${formatRupiah(numericAmount)} ditambahkan ke Saldo Tabungan Bebas`
        );
      }

      setAmountRaw("");
      setDoubleConfirmed(false);
      setOpenModal(false);
      router.refresh();
    });
  };

  return (
    <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-5 shadow-xs relative overflow-hidden">
      {/* Header Brankas dengan Indikator Kunci Keamanan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Brankas Dana Darurat & Simpanan
              </h2>
              <Badge
                variant="outline"
                className="rounded-full text-[10px] font-semibold gap-1 px-2 py-0.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              >
                <Lock className="size-2.5" />
                <span>Terproteksi</span>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Terpisah dari Sinking Fund Wishlist agar ketahanan darurat tidak
              tergerus belanja impulsif.
            </p>
          </div>
        </div>

        {/* Tombol Modal Setor / Tarik Dana Darurat */}
        <Dialog
          open={openModal}
          onOpenChange={(val) => {
            setOpenModal(val);
            setErrorMsg(null);
            setDoubleConfirmed(false);
          }}
        >
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3.5 rounded-xl gap-1.5 text-xs font-semibold self-start sm:self-auto"
            >
              <Lock className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Setor / Tarik Dana Darurat</span>
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <DialogHeader>
                <DialogTitle className="text-base font-bold">
                  Kelola Brankas Dana Darurat & Tabungan
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Pindahkan dana antara Saldo Tabungan Bebas dan Brankas Dana
                  Darurat.
                </DialogDescription>
              </DialogHeader>

              {/* Mode Selector */}
              <SlidingSegmentedControl
                options={VAULT_MODE_OPTIONS}
                value={mode}
                onValueChange={(next) => {
                  setMode(next);
                  setErrorMsg(null);
                }}
                role="tablist"
                ariaLabel="Mode mutasi brankas"
                fullWidth
                size="sm"
                recalculateTrigger={openModal}
              />

              {/* Info Saldo */}
              <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-border/70 bg-muted/20 p-3 text-xs tabular-nums">
                <div>
                  <span className="text-[10px] text-muted-foreground block">
                    Brankas Dana Darurat
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(vault.emergencyFundBalance)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">
                    Saldo Tabungan Bebas
                  </span>
                  <span className="font-bold text-foreground">
                    {formatRupiah(vault.freeSavingsBalance)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vault-amount" className="text-xs font-semibold">
                  Nominal Mutasi (Rp)
                </Label>
                <Input
                  id="vault-amount"
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
                    setErrorMsg(null);
                  }}
                  className={cn(
                    "h-10 rounded-xl text-sm font-bold tabular-nums",
                    errorMsg && "border-destructive"
                  )}
                />
              </div>

              {/* Proteksi Konfirmasi Ganda saat Penarikan Dana Darurat */}
              {mode === "withdraw_emergency" && (
                <div className="space-y-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs">
                  <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <p className="leading-relaxed">
                      <strong>Peringatan Brankas:</strong> Dana darurat hanya
                      boleh dicairkan untuk kondisi mendesak (medis, kehilangan
                      pendapatan, atau perbaikan darurat).
                    </p>
                  </div>
                  <label className="flex items-center gap-2 pt-1 cursor-pointer select-none font-semibold text-foreground">
                    <input
                      type="checkbox"
                      checked={doubleConfirmed}
                      onChange={(e) => {
                        setDoubleConfirmed(e.target.checked);
                        setErrorMsg(null);
                      }}
                      className="size-4 rounded accent-rose-600"
                    />
                    <span>
                      Saya mengonfirmasi penarikan ini untuk kebutuhan darurat
                    </span>
                  </label>
                </div>
              )}

              {errorMsg && (
                <p className="text-xs font-medium text-destructive">
                  {errorMsg}
                </p>
              )}

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenModal(false)}
                  className="rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="rounded-xl gap-1.5 font-semibold"
                >
                  {isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : mode === "withdraw_emergency" ? (
                    <ArrowDownLeft className="size-3.5" />
                  ) : mode === "deposit_emergency" ? (
                    <ArrowUpRight className="size-3.5" />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                  <span>Konfirmasi Mutasi</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 3 Pilar Angka Brankas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-1">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Lock className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Saldo Dana Darurat</span>
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatRupiah(vault.emergencyFundBalance)}
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums block">
            {vault.emergencyFundTarget > 0
              ? `Target Ideal: ${formatRupiah(vault.emergencyFundTarget)}`
              : "Atur target Dana Darurat di menu Settings"}
          </span>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-1">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Wallet className="size-3.5 text-primary" />
            <span>Saldo Tabungan Bebas</span>
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums">
            {formatRupiah(vault.freeSavingsBalance)}
          </div>
          <span className="text-[11px] text-muted-foreground block">
            Siap dialokasikan ke Sinking Fund Wishlist
          </span>
        </div>

        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-1">
          <span className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
            <ShieldCheck className="size-3.5" />
            <span>Safety Months Meter</span>
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums">
            {`${safetyMonthsLabel} Bulan`}
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums block">
            {`Bertahan Aman selama ${safetyMonthsLabel} Bulan Biaya Hidup`}
          </span>
        </div>
      </div>

      {/* Progress Bar Menuju Target Ideal */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs tabular-nums">
          <span className="text-muted-foreground font-medium">
            Progres Dana Darurat Ideal:
          </span>
          <span className="font-bold text-foreground">
            {vault.percentageOfTarget}%
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{
              width: `${Math.min(100, vault.percentageOfTarget)}%`,
            }}
          />
        </div>
      </div>
    </Card>
  );
}
