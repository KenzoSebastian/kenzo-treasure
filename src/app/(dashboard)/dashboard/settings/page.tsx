import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCachedAuthenticatedSession } from "@/lib/queries/auth";
import {
  getUserBudgetTemplates,
  getUserFinanceSetup,
} from "@/lib/queries/settings";
import {
  DataExportPanel,
  FinanceDefaultsPanel,
  BudgetTemplateManager,
} from "@/components/features/settings";

export const metadata = {
  title: "Pengaturan & Backup Mandiri • Kenzo Treasury",
  description:
    "Atur gaji pokok default, target dana darurat, template pos anggaran rutin, dan unduh backup data penuh.",
};

export default async function SettingsPage() {
  const sessionRes = await getCachedAuthenticatedSession();
  const userId = sessionRes.success ? sessionRes.data.userId : undefined;

  const [setup, templates] = userId
    ? await Promise.all([
        getUserFinanceSetup(userId).catch(() => null),
        getUserBudgetTemplates(userId).catch(() => []),
      ])
    : [null, []];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Pengaturan Keuangan & Kedaulatan Data
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Kelola gaji pokok default, target dana darurat, template pos
            anggaran rutin, serta unduh backup transaksi CSV, Excel, atau JSON.
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

      <FinanceDefaultsPanel
        defaultBaseSalary={setup?.defaultBaseSalary ?? 0}
        emergencyFundTarget={setup?.emergencyFundTarget ?? 0}
      />

      <BudgetTemplateManager
        templates={templates}
        defaultBaseSalary={setup?.defaultBaseSalary ?? 0}
      />

      <DataExportPanel />
    </div>
  );
}
