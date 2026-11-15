"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Finance Defaults Panel (Fase R3 & R4)
 * ==============================================================================
 *
 * Panel pengaturan konfigurasi dasar finansial pengguna di `/dashboard/settings`:
 * - Gaji Pokok Default (`users.defaultBaseSalary`) untuk pre-fill pembuatan
 *   siklus bulan baru.
 * - Target Ideal Dana Darurat (`savingsAccount.emergencyFundTarget`) untuk
 *   perhitungan persentase Brankas Dana Darurat.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Wallet, ShieldCheck, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, parseRupiah } from "@/lib/financial-calculations";
import { updateFinanceDefaults } from "@/actions/settings";
import { cn } from "@/lib/utils";

export interface FinanceDefaultsPanelProps {
  defaultBaseSalary: number | null;
  emergencyFundTarget: number;
}

export function FinanceDefaultsPanel({
  defaultBaseSalary,
  emergencyFundTarget,
}: FinanceDefaultsPanelProps) {
  const router = useRouter();
  const [salaryRaw, setSalaryRaw] = React.useState(
    String(Math.max(0, defaultBaseSalary ?? 0))
  );
  const [emergencyRaw, setEmergencyRaw] = React.useState(
    String(Math.max(0, emergencyFundTarget ?? 0))
  );
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setSalaryRaw(String(Math.max(0, defaultBaseSalary ?? 0)));
  }, [defaultBaseSalary]);

  React.useEffect(() => {
    setEmergencyRaw(String(Math.max(0, emergencyFundTarget ?? 0)));
  }, [emergencyFundTarget]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedSalary = parseRupiah(salaryRaw);
    const parsedEmergency = parseRupiah(emergencyRaw);

    if (parsedSalary < 0 || parsedEmergency < 0) {
      setErrorMsg("Nominal tidak boleh bernilai negatif.");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateFinanceDefaults({
        defaultBaseSalary: parsedSalary,
        emergencyFundTarget: parsedEmergency,
      });

      if (!res.success) {
        setErrorMsg(res.error);
        return;
      }

      toast.success("Konfigurasi dasar finansial disimpan!", {
        description: `Gaji default: ${formatRupiah(parsedSalary)} • Target darurat: ${formatRupiah(parsedEmergency)}`,
      });
      router.refresh();
    });
  };

  return (
    <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-foreground">
              Konfigurasi Gaji Pokok & Target Dana Darurat
            </h2>
            <p className="text-xs text-muted-foreground">
              Nilai dasar ini digunakan otomatis saat membuka siklus bulan baru
              dan menghitung progres ketahanan Brankas Dana Darurat.
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="rounded-full text-[10px] self-start sm:self-auto"
        >
          Database-First Setup
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="settings-default-salary"
              className="text-xs font-semibold flex items-center gap-1.5"
            >
              <Wallet className="size-3.5 text-primary" />
              <span>Gaji Pokok Bulanan Default (Rp)</span>
            </Label>
            <Input
              id="settings-default-salary"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={
                parseRupiah(salaryRaw) > 0
                  ? parseRupiah(salaryRaw).toLocaleString("id-ID")
                  : "0"
              }
              onChange={(e) => {
                setSalaryRaw(String(parseRupiah(e.target.value)));
                setErrorMsg(null);
              }}
              className={cn(
                "h-11 rounded-xl text-sm font-bold tabular-nums",
                errorMsg && "border-destructive"
              )}
            />
            <p className="text-[11px] text-muted-foreground">
              Menjadi nilai pre-fill otomatis saat membuat siklus bulan baru.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="settings-emergency-target"
              className="text-xs font-semibold flex items-center gap-1.5"
            >
              <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Target Ideal Dana Darurat (Rp)</span>
            </Label>
            <Input
              id="settings-emergency-target"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={
                parseRupiah(emergencyRaw) > 0
                  ? parseRupiah(emergencyRaw).toLocaleString("id-ID")
                  : "0"
              }
              onChange={(e) => {
                setEmergencyRaw(String(parseRupiah(e.target.value)));
                setErrorMsg(null);
              }}
              className={cn(
                "h-11 rounded-xl text-sm font-bold tabular-nums",
                errorMsg && "border-destructive"
              )}
            />
            <p className="text-[11px] text-muted-foreground">
              Rekomendasi umum adalah 3–6x pengeluaran wajib bulanan Anda.
            </p>
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs font-medium text-destructive">{errorMsg}</p>
        )}

        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            size="sm"
            disabled={isPending}
            className="h-9 px-4 rounded-xl gap-1.5 text-xs font-semibold"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            <span>Simpan Konfigurasi Dasar</span>
          </Button>
        </div>
      </form>
    </Card>
  );
}
