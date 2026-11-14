import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataExportPanel } from "@/components/features/settings";

export const metadata = {
  title: "Ekspor Data & Backup Mandiri • Kenzo Treasury",
  description: "Unduh laporan transaksi CSV, Excel (.xlsx), dan cadangan JSON penuh.",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Ekspor Data & Backup Mandiri
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Kedaulatan data penuh: unduh transaksi bulanan dalam format CSV,
            Excel, maupun full JSON backup.
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

      <DataExportPanel />
    </div>
  );
}
