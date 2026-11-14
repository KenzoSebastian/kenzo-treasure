import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/actions/auth";
import { getSavingsAccount } from "@/lib/queries/savings";
import { EmergencyVaultCard } from "@/components/features/savings";
import type { SavingsVaultSummary } from "@/types/savings";

export const metadata = {
  title: "Brankas Dana Darurat • Kenzo Treasury",
  description: "Manajemen brankas dana darurat, tabungan bebas, dan safety months meter.",
};

export default async function VaultPage() {
  const userRes = await getCurrentUser();
  const userId = userRes.success ? userRes.data?.id : undefined;

  const savingsRes = userId
    ? await getSavingsAccount(userId)
    : { success: false as const, error: "" };

  const fallbackVault: SavingsVaultSummary = {
    id: "preview-vault",
    userId: userId ?? "preview",
    freeSavingsBalance: 2500000,
    emergencyFundBalance: 12600000,
    emergencyFundTarget: 18000000,
    totalVaultBalance: 15100000,
    percentageOfTarget: 70,
    isTargetReached: false,
    safetyMonths: 4.2,
    monthlyFixedExpense: 3000000,
    updatedAt: new Date(),
  };

  const activeVault =
    savingsRes.success && savingsRes.data ? savingsRes.data : fallbackVault;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Brankas Dana Darurat & Simpanan
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Proteksi ketahanan biaya hidup darurat terpisah dari saldo tabungan
            bebas.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs self-start sm:self-auto rounded-xl"
        >
          <Link href="/dashboard">
            <ArrowLeft className="size-3.5" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </Button>
      </div>

      <EmergencyVaultCard vault={activeVault} />
    </div>
  );
}
