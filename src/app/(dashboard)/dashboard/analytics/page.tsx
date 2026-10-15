import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, ArrowLeft, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Analitik Finansial • Kenzo Treasury",
  description: "Grafik historis dan analisis arus kas bulanan.",
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Grafik & Analitik Finansial
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Visualisasi tren tabungan, rasio arus kas bersih bulanan, dan evaluasi ketahanan dana darurat.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs self-start sm:self-auto">
          <Link href="/dashboard">
            <ArrowLeft className="size-3.5" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </Button>
      </div>

      <Card className="rounded-2xl border border-dashed border-border/80 bg-card/60 p-8 text-center space-y-4">
        <div className="flex size-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 mx-auto">
          <BarChart3 className="size-6" />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <CardTitle className="text-base font-bold text-foreground">
            Pusat Analisis & Tren Finansial
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed text-muted-foreground">
            Visualisasi data grafis interaktif dengan Recharts untuk memantau pertumbuhan brankas tabungan, konsistensi rasio pengeluaran, dan riwayat tutup buku bulanan.
          </CardDescription>
        </div>
      </Card>
    </div>
  );
}
