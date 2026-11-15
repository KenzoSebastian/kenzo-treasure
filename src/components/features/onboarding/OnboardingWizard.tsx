"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — 3-Step Guided Onboarding Wizard (Fase R3)
 * ==============================================================================
 *
 * Wizard penyiapan awal keuangan pengguna baru di `/onboarding`:
 * - Step 1: Gaji Pokok Bulanan Default (`defaultBaseSalary`) & Target Dana
 *   Darurat (`emergencyFundTarget`), keduanya default Rp 0 tanpa angka dummy.
 * - Step 2: Template Pos Anggaran Rutin (`budgetTemplates`) dengan pilihan cepat
 *   "Gunakan 6 Template Netral" atau "Mulai dari Kosong", dilengkapi bar
 *   alokasi real-time terhadap gaji pokok.
 * - Step 3: Daftar Utang / Cicilan Aktif (`liabilities`) opsional (boleh kosong).
 * - Tombol "Lewati untuk Sekarang" (`skipOnboarding`) di pojok kanan atas.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ShieldCheck,
  Layers,
  CreditCard,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AppCategoryIcon } from "@/components/common/AppCategoryIcon";
import { IconPicker } from "@/components/common/IconPicker";
import { SlidingSegmentedControl } from "@/components/common/SlidingSegmentedControl";
import { formatRupiah, parseRupiah } from "@/lib/financial-calculations";
import { completeOnboarding, skipOnboarding } from "@/actions/onboarding";
import { cn } from "@/lib/utils";
import type { CategoryGroup } from "@/db/schema";

export interface OnboardingTemplateItem {
  id: string;
  name: string;
  icon: string;
  group: CategoryGroup;
  targetBudget: number;
  sortOrder: number;
  targetMode?: "rp" | "percent";
  targetPercent?: number;
}

export interface OnboardingLiabilityItem {
  id: string;
  name: string;
  icon: string;
  totalAmount: number;
  paidAmount: number;
  monthlyPayment: number;
  totalMonths: number;
}

export interface OnboardingWizardProps {
  userName?: string;
  initialBaseSalary?: number | null;
  initialEmergencyFundTarget?: number;
}

const GROUP_OPTIONS: Array<{ value: CategoryGroup; label: string }> = [
  { value: "pos_wajib", label: "Pos Wajib" },
  { value: "kebutuhan", label: "Kebutuhan" },
  { value: "uang_bebas_tabungan", label: "Uang Bebas" },
];

export function OnboardingWizard({
  userName,
  initialBaseSalary,
  initialEmergencyFundTarget,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [salaryRaw, setSalaryRaw] = React.useState(
    String(Math.max(0, initialBaseSalary ?? 0))
  );
  const [emergencyRaw, setEmergencyRaw] = React.useState(
    String(Math.max(0, initialEmergencyFundTarget ?? 0))
  );
  const [templates, setTemplates] = React.useState<OnboardingTemplateItem[]>([]);
  const [liabilities, setLiabilities] = React.useState<
    OnboardingLiabilityItem[]
  >([]);
  const [activeIconRowId, setActiveIconRowId] = React.useState<string | null>(
    null
  );
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSubmitting, startTransition] = React.useTransition();
  const [isSkipping, startSkipTransition] = React.useTransition();

  const baseSalary = parseRupiah(salaryRaw);
  const emergencyFundTarget = parseRupiah(emergencyRaw);

  const allocatedFixedBudget = React.useMemo(() => {
    const tplSum = templates
      .filter((t) => t.group !== "uang_bebas_tabungan")
      .reduce((acc, item) => acc + item.targetBudget, 0);
    const liabSum = liabilities.reduce(
      (acc, item) => acc + item.monthlyPayment,
      0
    );
    return tplSum + liabSum;
  }, [templates, liabilities]);

  const remainingUnallocated = baseSalary - allocatedFixedBudget;
  const allocationPercent =
    baseSalary > 0
      ? Math.min(100, Math.round((allocatedFixedBudget / baseSalary) * 100))
      : 0;

  const handleAddTemplateRow = () => {
    const nextIdx = templates.length + 1;
    setTemplates((prev) => [
      ...prev,
      {
        id: `tpl-${Date.now()}-${nextIdx}`,
        name: "",
        icon: "help-circle",
        group: "kebutuhan",
        targetBudget: 0,
        sortOrder: nextIdx,
        targetMode: "rp",
        targetPercent: 0,
      },
    ]);
  };

  const handleRemoveTemplateRow = (id: string) => {
    setTemplates((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateTemplateRow = (
    id: string,
    patch: Partial<OnboardingTemplateItem>
  ) => {
    setTemplates((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, ...patch };
        }
        if (
          patch.group === "uang_bebas_tabungan" &&
          item.group === "uang_bebas_tabungan"
        ) {
          return { ...item, group: "kebutuhan" };
        }
        return item;
      })
    );
    setErrorMsg(null);
  };

  const handleAddLiabilityRow = () => {
    const nextIdx = liabilities.length + 1;
    setLiabilities((prev) => [
      ...prev,
      {
        id: `liab-${Date.now()}-${nextIdx}`,
        name: "",
        icon: "credit-card",
        totalAmount: 0,
        paidAmount: 0,
        monthlyPayment: 0,
        totalMonths: 12,
      },
    ]);
  };

  const handleRemoveLiabilityRow = (id: string) => {
    setLiabilities((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateLiabilityRow = (
    id: string,
    patch: Partial<OnboardingLiabilityItem>
  ) => {
    setLiabilities((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
    setErrorMsg(null);
  };

  const handleNextStep = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (baseSalary < 0 || emergencyFundTarget < 0) {
        setErrorMsg("Nominal tidak boleh bernilai negatif.");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      const cleaned = templates.filter((t) => t.name.trim().length >= 2);
      if (cleaned.length === 0) {
        setErrorMsg(
          "Tambahkan minimal 1 template pos anggaran dengan nama minimal 2 karakter."
        );
        return;
      }
      setStep(3);
    }
  };

  const handleSkip = () => {
    setErrorMsg(null);
    startSkipTransition(async () => {
      const res = await skipOnboarding();
      if (!res.success) {
        setErrorMsg(res.error);
        return;
      }
      toast.info("Setup awal dilewati. Anda dapat mengaturnya kapan saja di Settings.");
      router.push("/dashboard");
      router.refresh();
    });
  };

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validTemplates = templates
      .map((tpl, idx) => ({
        name: tpl.name.trim(),
        icon: tpl.icon || "wallet",
        group: tpl.group,
        targetBudget:
          tpl.group === "uang_bebas_tabungan"
            ? Math.max(0, remainingUnallocated)
            : Math.max(0, tpl.targetBudget),
        sortOrder: idx + 1,
      }))
      .filter((tpl) => tpl.name.length >= 2);

    if (validTemplates.length === 0) {
      setErrorMsg("Minimal 1 template pos anggaran wajib memiliki nama valid.");
      setStep(2);
      return;
    }

    for (const liab of liabilities) {
      if (liab.name.trim().length < 2) {
        setErrorMsg("Nama cicilan minimal 2 karakter atau hapus baris kosong.");
        return;
      }
      if (liab.totalAmount <= 0 || liab.monthlyPayment <= 0) {
        setErrorMsg(
          `Cicilan "${liab.name}" wajib memiliki total utang dan cicilan bulanan > Rp 0.`
        );
        return;
      }
      if (liab.monthlyPayment > liab.totalAmount) {
        setErrorMsg(
          `Cicilan bulanan "${liab.name}" tidak boleh melebihi total pokok utang.`
        );
        return;
      }
    }

    startTransition(async () => {
      const res = await completeOnboarding({
        defaultBaseSalary: baseSalary,
        emergencyFundTarget,
        budgetTemplates: validTemplates,
        liabilities: liabilities.map((l) => ({
          name: l.name.trim(),
          icon: l.icon || "credit-card",
          totalAmount: l.totalAmount,
          paidAmount: l.paidAmount,
          monthlyPayment: l.monthlyPayment,
          totalMonths: Math.max(1, l.totalMonths),
        })),
        createInitialMonth: true,
      });

      if (!res.success) {
        setErrorMsg(res.error);
        return;
      }

      toast.success("Konfigurasi keuangan berhasil disimpan!", {
        description: "Siklus bulan pertama Anda siap digunakan.",
      });
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 space-y-6">
      {/* Top Bar: Brand + Skip Button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <Badge variant="outline" className="rounded-full text-[11px] mb-1.5">
            Langkah {step} dari 3
          </Badge>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            {userName
              ? `Selamat Datang, ${userName}`
              : "Siapkan Pondasi Keuangan Anda"}
          </h1>
          <p className="text-xs text-muted-foreground">
            Sesuaikan gaji pokok, template pos anggaran, dan cicilan sesuai
            kondisi nyata Anda.
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isSkipping || isSubmitting}
          onClick={handleSkip}
          className="h-9 px-3 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground shrink-0"
        >
          {isSkipping ? (
            <Loader2 className="size-3.5 animate-spin mr-1.5" />
          ) : null}
          <span>Lewati untuk Sekarang</span>
        </Button>
      </div>

      {/* Step Progress Indicator */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { num: 1, title: "1. Gaji & Dana Darurat" },
          { num: 2, title: "2. Template Pos Rutin" },
          { num: 3, title: "3. Cicilan Aktif" },
        ].map((item) => {
          const isCurrent = step === item.num;
          const isDone = step > item.num;
          return (
            <button
              key={item.num}
              type="button"
              onClick={() => {
                if (item.num < step) setStep(item.num as 1 | 2 | 3);
              }}
              className={cn(
                "rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors",
                isCurrent
                  ? "border-primary bg-primary/10 text-foreground"
                  : isDone
                  ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 cursor-pointer"
                  : "border-border/60 bg-muted/20 text-muted-foreground"
              )}
            >
              <span className="truncate block">{item.title}</span>
            </button>
          );
        })}
      </div>

      <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
        <form onSubmit={handleComplete} className="space-y-6" noValidate>
          {/* STEP 1: GAJI POKOK & TARGET DANA DARURAT */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-foreground">
                  Langkah 1: Gaji Pokok & Target Dana Darurat
                </h2>
                <p className="text-xs text-muted-foreground">
                  Masukkan pemasukan bulanan utama dan target dana darurat ideal
                  Anda. Anda dapat mengubahnya kapan saja di menu Settings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="onboard-salary"
                    className="text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Wallet className="size-3.5 text-primary" />
                    <span>Gaji Pokok Bulanan (Rp)</span>
                  </Label>
                  <Input
                    id="onboard-salary"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={
                      baseSalary > 0 ? baseSalary.toLocaleString("id-ID") : "0"
                    }
                    onChange={(e) => {
                      setSalaryRaw(String(parseRupiah(e.target.value)));
                      setErrorMsg(null);
                    }}
                    className="h-11 rounded-xl text-base font-bold tabular-nums"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {[3_000_000, 5_000_000, 8_000_000, 12_000_000].map(
                      (preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setSalaryRaw(String(preset))}
                          className="rounded-lg border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground tabular-nums cursor-pointer"
                        >
                          {formatRupiah(preset)}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="onboard-emergency"
                    className="text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Target Dana Darurat Ideal (Rp)</span>
                  </Label>
                  <Input
                    id="onboard-emergency"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={
                      emergencyFundTarget > 0
                        ? emergencyFundTarget.toLocaleString("id-ID")
                        : "0"
                    }
                    onChange={(e) => {
                      setEmergencyRaw(String(parseRupiah(e.target.value)));
                      setErrorMsg(null);
                    }}
                    className="h-11 rounded-xl text-base font-bold tabular-nums"
                  />
                  {baseSalary > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {[
                        { label: "3x Gaji", val: baseSalary * 3 },
                        { label: "6x Gaji", val: baseSalary * 6 },
                      ].map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setEmergencyRaw(String(opt.val))}
                          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 tabular-nums cursor-pointer"
                        >
                          {opt.label} ({formatRupiah(opt.val)})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: TEMPLATE POS ANGGARAN RUTIN */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    Langkah 2: Template Pos Anggaran Rutin
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Atur daftar pos pengeluaran bulanan dan target alokasinya.
                  </p>
                </div>
              </div>

              {/* Live Allocation Bar */}
              <div className="rounded-xl border border-border/70 bg-muted/25 p-3.5 space-y-2 tabular-nums">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Alokasi Pos Rutin:{" "}
                    <strong className="text-foreground">
                      {formatRupiah(allocatedFixedBudget)}
                    </strong>{" "}
                    dari {formatRupiah(baseSalary)}
                  </span>
                  <span
                    className={cn(
                      "font-bold",
                      remainingUnallocated < 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    Sisa Uang Bebas: {formatRupiah(remainingUnallocated)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      remainingUnallocated < 0
                        ? "bg-rose-500"
                        : "bg-emerald-500"
                    )}
                    style={{ width: `${allocationPercent}%` }}
                  />
                </div>
              </div>

              {/* Daftar Baris Pos Anggaran (2 Baris per Card) atau Empty State */}
              {templates.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 bg-muted/15 p-6 text-center space-y-1.5">
                  <Layers className="size-6 mx-auto text-muted-foreground/60" />
                  <p className="text-xs font-semibold text-foreground">
                    Belum ada pos anggaran rutin
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Mulai susun dari kosong sesuai kebutuhan finansial Anda.
                    Klik tombol di bawah untuk menambah pos anggaran pertama.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((tpl) => {
                    const isFreeBudget = tpl.group === "uang_bebas_tabungan";
                    const isPickingIcon = activeIconRowId === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        className="rounded-xl border border-border/70 bg-background p-3.5 sm:p-4 space-y-3"
                      >
                        {/* Baris 1: Ikon + Input Nama Pos + Tombol Hapus */}
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveIconRowId(isPickingIcon ? null : tpl.id)
                            }
                            className="flex size-9 items-center justify-center shrink-0 rounded-xl border border-border/70 bg-muted/30 hover:bg-muted transition-colors cursor-pointer"
                            title="Klik untuk memilih ikon"
                            aria-label="Pilih ikon pos anggaran"
                          >
                            <AppCategoryIcon
                              iconKey={tpl.icon}
                              group={tpl.group}
                              size="xs"
                            />
                          </button>

                          <div className="flex-1 min-w-0">
                            <Input
                              type="text"
                              placeholder="Nama pos anggaran (misal: Kebutuhan Pokok)"
                              value={tpl.name}
                              onChange={(e) =>
                                handleUpdateTemplateRow(tpl.id, {
                                  name: e.target.value,
                                })
                              }
                              className="h-9 rounded-lg text-xs"
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveTemplateRow(tpl.id)}
                            className="size-9 rounded-lg text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
                            aria-label="Hapus baris pos"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>

                        {/* Baris 2: Segmented Control Group + Target Anggaran / Otomatis Badge */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-1">
                          <div className="w-full sm:w-auto">
                            <SlidingSegmentedControl
                              options={GROUP_OPTIONS}
                              value={tpl.group}
                              onValueChange={(nextGroup) =>
                                handleUpdateTemplateRow(tpl.id, {
                                  group: nextGroup,
                                })
                              }
                              role="radiogroup"
                              ariaLabel={`Kelompok pos ${tpl.name || "baru"}`}
                              size="sm"
                              className="w-full sm:w-auto"
                            />
                          </div>

                          <div className="w-full sm:w-auto shrink-0 flex items-center">
                            {isFreeBudget ? (
                              <div className="flex h-9 w-full sm:w-auto items-center justify-between gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                <span className="text-[11px] font-semibold text-emerald-700/80 dark:text-emerald-400/80">
                                  Sisa Otomatis:
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span>
                                    {formatRupiah(
                                      Math.max(0, remainingUnallocated)
                                    )}
                                  </span>
                                  {baseSalary > 0 && (
                                    <span className="text-[10px] font-medium text-emerald-700/70 dark:text-emerald-400/70">
                                      (≈{" "}
                                      {Math.min(
                                        100,
                                        Math.max(
                                          0,
                                          Math.round(
                                            (Math.max(
                                              0,
                                              remainingUnallocated
                                            ) /
                                              baseSalary) *
                                              100
                                          )
                                        )
                                      )}
                                      %)
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex h-9 w-full sm:w-64 shrink-0 items-center rounded-xl border border-input bg-transparent dark:bg-input/30 overflow-hidden focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40 transition-all shadow-2xs">
                                {/* Toggle Mode: Rp vs % Gaji dengan Animasi Transisi Sliding Pill */}
                                <div className="relative inline-flex h-full items-center bg-muted/40 p-1 border-r border-border/60 shrink-0 select-none">
                                  {/* Sliding Indicator Pill */}
                                  <span
                                    aria-hidden="true"
                                    className={cn(
                                      "pointer-events-none absolute top-1 bottom-1 left-1 w-7 rounded-md bg-background shadow-2xs transition-transform duration-200 ease-out",
                                      tpl.targetMode === "percent"
                                        ? "translate-x-7"
                                        : "translate-x-0"
                                    )}
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateTemplateRow(tpl.id, {
                                        targetMode: "rp",
                                      })
                                    }
                                    title="Input nominal langsung dalam Rupiah"
                                    className={cn(
                                      "relative z-10 size-7 inline-flex items-center justify-center rounded-md text-[11px] font-bold transition-colors duration-200 cursor-pointer",
                                      tpl.targetMode !== "percent"
                                        ? "text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                    )}
                                  >
                                    Rp
                                  </button>
                                  <button
                                    type="button"
                                    disabled={baseSalary <= 0}
                                    onClick={() => {
                                      const currentPct =
                                        baseSalary > 0
                                          ? Math.min(
                                              100,
                                              Math.round(
                                                (tpl.targetBudget / baseSalary) *
                                                  100
                                              )
                                            )
                                          : 0;
                                      handleUpdateTemplateRow(tpl.id, {
                                        targetMode: "percent",
                                        targetPercent: currentPct,
                                      });
                                    }}
                                    title={
                                      baseSalary <= 0
                                        ? "Isi gaji pokok di Langkah 1 untuk memilih target persentase"
                                        : "Target sebagai persentase dari gaji pokok"
                                    }
                                    className={cn(
                                      "relative z-10 size-7 inline-flex items-center justify-center rounded-md text-[11px] font-bold transition-colors duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                                      tpl.targetMode === "percent"
                                        ? "text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                    )}
                                  >
                                    %
                                  </button>
                                </div>

                                {/* Input Target (Rp atau %) + Live Inline Equivalent */}
                                {tpl.targetMode === "percent" ? (
                                  (() => {
                                    const percentStr =
                                      tpl.targetPercent !== undefined &&
                                      tpl.targetPercent > 0
                                        ? String(tpl.targetPercent)
                                        : baseSalary > 0 &&
                                          tpl.targetBudget > 0
                                        ? String(
                                            Math.min(
                                              100,
                                              Math.round(
                                                (tpl.targetBudget /
                                                  baseSalary) *
                                                  100
                                              )
                                            )
                                          )
                                        : "";
                                    return (
                                      <div className="flex h-full flex-1 items-center px-2.5 min-w-0">
                                        <div className="inline-flex items-center">
                                          <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="0"
                                            value={percentStr}
                                            style={{
                                              width: `${
                                                Math.max(
                                                  1,
                                                  (percentStr || "0").length
                                                ) *
                                                  8.5 +
                                                2
                                              }px`,
                                            }}
                                            onChange={(e) => {
                                              const raw =
                                                e.target.value.replace(
                                                  /[^0-9]/g,
                                                  ""
                                                );
                                              const pct = Math.min(
                                                100,
                                                Math.max(
                                                  0,
                                                  raw === "" ? 0 : Number(raw)
                                                )
                                              );
                                              const budget = Math.round(
                                                (pct / 100) * baseSalary
                                              );
                                              handleUpdateTemplateRow(tpl.id, {
                                                targetPercent:
                                                  raw === "" ? 0 : pct,
                                                targetBudget: budget,
                                              });
                                            }}
                                            className="h-full bg-transparent text-xs font-semibold tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none text-left p-0 m-0"
                                          />
                                          <span className="text-xs font-bold text-muted-foreground select-none pl-0.5">
                                            %
                                          </span>
                                        </div>
                                        {baseSalary > 0 &&
                                          tpl.targetBudget > 0 && (
                                            <span className="ml-auto text-[11px] text-muted-foreground truncate select-none tabular-nums pl-1.5 font-medium">
                                              = {formatRupiah(tpl.targetBudget)}
                                            </span>
                                          )}
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <div className="flex h-full flex-1 items-center px-2.5 min-w-0">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      placeholder="0"
                                      value={
                                        tpl.targetBudget > 0
                                          ? tpl.targetBudget.toLocaleString(
                                              "id-ID"
                                            )
                                          : "0"
                                      }
                                      onChange={(e) => {
                                        const nominal = parseRupiah(
                                          e.target.value
                                        );
                                        const pct =
                                          baseSalary > 0
                                            ? Math.min(
                                                100,
                                                Math.round(
                                                  (nominal / baseSalary) * 100
                                                )
                                              )
                                            : 0;
                                        handleUpdateTemplateRow(tpl.id, {
                                          targetBudget: nominal,
                                          targetPercent: pct,
                                        });
                                      }}
                                      className="h-full flex-1 min-w-0 bg-transparent text-xs font-semibold tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none text-left"
                                    />
                                    {baseSalary > 0 && tpl.targetBudget > 0 && (
                                      <span className="ml-auto text-[11px] text-muted-foreground shrink-0 select-none tabular-nums pl-1.5 font-medium">
                                        ≈{" "}
                                        {(
                                          (tpl.targetBudget / baseSalary) *
                                          100
                                        )
                                          .toFixed(1)
                                          .replace(".0", "")}
                                        %
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expandable Icon Picker */}
                        {isPickingIcon && (
                          <div className="pt-2 border-t border-border/50">
                            <IconPicker
                              value={tpl.icon}
                              onChange={(nextIcon) => {
                                handleUpdateTemplateRow(tpl.id, {
                                  icon: nextIcon,
                                });
                                setActiveIconRowId(null);
                              }}
                              fallbackGroup={tpl.group}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tombol Tambah Baris Pos Anggaran Lebar Penuh (w-full) */}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTemplateRow}
                className="w-full h-10 rounded-xl gap-2 text-xs font-semibold border-dashed border-border/80 bg-background/50 hover:bg-muted/50 hover:border-foreground/30 transition-all text-foreground justify-center shadow-2xs cursor-pointer"
              >
                <Plus className="size-4 text-primary" />
                <span>Tambah Baris Pos Anggaran</span>
              </Button>
            </div>
          )}

          {/* STEP 3: CICILAN AKTIF (OPSIONAL) */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    Langkah 3: Cicilan / Utang Aktif (Opsional)
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Jika Anda memiliki kewajiban cicilan berjalan, tambahkan di
                    sini agar otomatis masuk ke dalam pos wajib bulanan.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLiabilityRow}
                  className="h-9 rounded-xl gap-1.5 text-xs font-semibold self-start sm:self-auto"
                >
                  <Plus className="size-3.5" />
                  <span>Tambah Cicilan Aktif</span>
                </Button>
              </div>

              {liabilities.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 bg-muted/15 p-6 text-center space-y-1.5">
                  <CreditCard className="size-6 mx-auto text-muted-foreground/60" />
                  <p className="text-xs font-semibold text-foreground">
                    Tidak ada cicilan yang ditambahkan
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Anda bebas melanjutkan tanpa cicilan, atau klik tombol
                    &ldquo;Tambah Cicilan Aktif&rdquo; di atas.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {liabilities.map((liab) => (
                    <div
                      key={liab.id}
                      className="rounded-xl border border-border/70 bg-background p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <AppCategoryIcon
                            iconKey={liab.icon}
                            group="pos_wajib"
                            liabilityId={liab.id}
                            size="sm"
                          />
                          <Input
                            type="text"
                            placeholder="Nama cicilan (misal: Cicilan Kendaraan)"
                            value={liab.name}
                            onChange={(e) =>
                              handleUpdateLiabilityRow(liab.id, {
                                name: e.target.value,
                              })
                            }
                            className="h-9 rounded-lg text-xs"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveLiabilityRow(liab.id)}
                          className="size-8 rounded-lg text-muted-foreground hover:text-destructive"
                          aria-label="Hapus cicilan"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[11px]">
                            Total Pokok Utang (Rp)
                          </Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="12.000.000"
                            value={
                              liab.totalAmount > 0
                                ? liab.totalAmount.toLocaleString("id-ID")
                                : ""
                            }
                            onChange={(e) =>
                              handleUpdateLiabilityRow(liab.id, {
                                totalAmount: parseRupiah(e.target.value),
                              })
                            }
                            className="h-9 rounded-lg text-xs tabular-nums"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px]">
                            Cicilan / Bulan (Rp)
                          </Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="1.000.000"
                            value={
                              liab.monthlyPayment > 0
                                ? liab.monthlyPayment.toLocaleString("id-ID")
                                : ""
                            }
                            onChange={(e) =>
                              handleUpdateLiabilityRow(liab.id, {
                                monthlyPayment: parseRupiah(e.target.value),
                              })
                            }
                            className="h-9 rounded-lg text-xs tabular-nums"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px]">Tenor (Bulan)</Label>
                          <Input
                            type="number"
                            min={1}
                            max={360}
                            value={liab.totalMonths}
                            onChange={(e) =>
                              handleUpdateLiabilityRow(liab.id, {
                                totalMonths: Math.max(
                                  1,
                                  Number(e.target.value) || 1
                                ),
                              })
                            }
                            className="h-9 rounded-lg text-xs tabular-nums"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <p className="text-xs font-medium text-destructive">{errorMsg}</p>
          )}

          {/* Wizard Navigation Footer */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/60">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
                className="h-10 px-4 rounded-xl gap-1.5 text-xs font-semibold"
              >
                <ArrowLeft className="size-3.5" />
                <span>Kembali</span>
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button
                type="button"
                size="sm"
                onClick={handleNextStep}
                className="h-10 px-5 rounded-xl gap-1.5 text-xs font-semibold"
              >
                <span>Lanjut ke Langkah {step + 1}</span>
                <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || isSkipping}
                className="h-10 px-5 rounded-xl gap-2 text-xs font-semibold"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                <span>Simpan & Mulai Siklus Bulan Pertama</span>
                <Check className="size-3.5" />
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
