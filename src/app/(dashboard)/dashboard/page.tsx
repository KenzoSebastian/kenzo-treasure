import { getCurrentUser } from "@/actions/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Sparkles,
  BarChart3,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Target,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const userResult = await getCurrentUser();
  const user = userResult.success ? userResult.data : null;
  const firstName = user?.fullName?.split(" ")[0] || "Kenzo";

  // Data referensi finansial siklus berjalan (Swiss Functional Invariants)
  const salaryBase = 4000000;
  const totalSpent = 1420000;
  const remainingCash = 2580000;
  const savingsBalance = 5000000;
  const emergencyTarget = 18000000;
  const usageRatio = Math.round((totalSpent / salaryBase) * 100);

  // 7 Pos Anggaran Wajib Bulanan
  const budgetCategories = [
    {
      name: "Bensin & Mobilitas",
      icon: "⛽",
      target: 200000,
      spent: 135000,
      remaining: 65000,
      usagePercent: 68,
      status: "Aman",
    },
    {
      name: "Belanja & Jajan",
      icon: "🍿",
      target: 300000,
      spent: 190000,
      remaining: 110000,
      usagePercent: 63,
      status: "Aman",
    },
    {
      name: "Listrik & Air",
      icon: "⚡",
      target: 450000,
      spent: 0,
      remaining: 450000,
      usagePercent: 0,
      status: "Terkunci",
    },
    {
      name: "Gereja / Persepuluhan",
      icon: "✝️",
      target: 400000,
      spent: 0,
      remaining: 400000,
      usagePercent: 0,
      status: "Terkunci",
    },
    {
      name: "Tabungan Otomatis",
      icon: "💰",
      target: 500000,
      spent: 500000,
      remaining: 0,
      usagePercent: 100,
      status: "Teralokasi",
    },
    {
      name: "Cicilan iPhone (24 bln)",
      icon: "📱",
      target: 735000,
      spent: 0,
      remaining: 735000,
      usagePercent: 0,
      status: "18 Bln Tersisa",
    },
    {
      name: "Talangan Mama (5 bln)",
      icon: "👩‍👦",
      target: 500000,
      spent: 0,
      remaining: 500000,
      usagePercent: 0,
      status: "3 Bln Tersisa",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* 1. Header Ringkasan: Sapaan Personal & Status Siklus */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs text-muted-foreground font-medium">
            <Calendar className="size-3.5 text-foreground/70" />
            <span>Oktober 2026 • Siklus Mandiri</span>
            <span className="text-border">•</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Aktif Berjalan
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Halo, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
            Ikhtisar arus kas, kuota 7 pos anggaran terproteksi, dan ketahanan dana darurat Anda bulan ini.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs font-semibold px-3 py-1 border-border/80 bg-muted/30 text-foreground"
          >
            Anggaran Sehat (35,5% Terpakai)
          </Badge>
        </div>
      </div>

      {/* 2. Kartu Utama Arus Kas (Executive Cashflow Summary) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Simpanan & Brankas Dana Darurat */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Total Brankas Simpanan
            </span>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              Rp {savingsBalance.toLocaleString("id-ID")}
            </div>
          </div>
          <div className="pt-4 border-t border-border/50 mt-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Ketahanan Darurat:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
              6,2 Bulan Aman
            </span>
          </div>
        </Card>

        {/* Realisasi Pengeluaran Bulan Ini */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Realisasi Pengeluaran Kas
            </span>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              Rp {totalSpent.toLocaleString("id-ID")}
            </div>
          </div>
          <div className="pt-4 border-t border-border/50 mt-4 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Terpakai dari Gaji:</span>
              <span className="font-semibold text-foreground tabular-nums">{usageRatio}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-foreground/80 transition-all duration-300"
                style={{ width: `${usageRatio}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Sisa Anggaran Bebas / Buffer */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Sisa Kuota Uang Bebas
            </span>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              Rp {remainingCash.toLocaleString("id-ID")}
            </div>
          </div>
          <div className="pt-4 border-t border-border/50 mt-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Pemasukan Gaji Pokok:</span>
            <span className="font-semibold text-foreground tabular-nums">
              Rp {salaryBase.toLocaleString("id-ID")}
            </span>
          </div>
        </Card>
      </div>

      {/* 3. Seksi 7 Pos Anggaran Wajib */}
      <div id="pos-anggaran" className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              7 Pos Pengeluaran Wajib
            </h2>
            <p className="text-xs text-muted-foreground">
              Alokasi pos terkunci dari gaji pokok Rp 4.000.000 untuk mencegah kebocoran kas.
            </p>
          </div>
          <span className="text-xs font-medium text-muted-foreground hidden sm:inline tabular-nums">
            Total Target Wajib: Rp 3.085.000
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {budgetCategories.map((cat) => (
            <Card
              key={cat.name}
              className="rounded-xl border border-border/70 bg-card p-4 space-y-3.5 shadow-xs transition-colors hover:border-foreground/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl select-none" aria-hidden="true">
                    {cat.icon}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-foreground leading-snug">
                      {cat.name}
                    </h3>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      Target: Rp {cat.target.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="text-[10px] font-medium tracking-tight px-2 py-0.5 rounded-full"
                >
                  {cat.status}
                </Badge>
              </div>

              {/* Progress Bar & Sisa Nominal */}
              <div className="space-y-1.5 pt-1 border-t border-border/40">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[11px] text-muted-foreground">Sisa Kuota:</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    Rp {cat.remaining.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/70 transition-all duration-300"
                    style={{ width: `${Math.min(cat.usagePercent, 100)}%` }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 4. Seksi Sinking Fund & Pelunasan Cicilan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
        {/* Hub Wishlist Impian */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                <h3 className="text-sm font-bold text-foreground">Wishlist Barang Impian</h3>
              </div>
              <Link
                href="/dashboard/wishlists"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
              >
                <span>Buka Hub</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sinking fund mandiri yang terkumpul bertahap dari sisa uang bebas tanpa menyentuh dana darurat.
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-3.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-foreground">🎯 Target Tabungan Kamera & Lensa</span>
              <span className="font-semibold text-foreground tabular-nums">50% Tercapai</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-amber-500 w-1/2" />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
              <span>Terkumpul: Rp 6.000.000</span>
              <span>Target: Rp 12.000.000</span>
            </div>
          </div>
        </Card>

        {/* Hub Analitik Arus Kas */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-blue-500" />
                <h3 className="text-sm font-bold text-foreground">Analitik & Historis Kas</h3>
              </div>
              <Link
                href="/dashboard/analytics"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
              >
                <span>Lihat Tren</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pantau kestabilan rasio tabungan, tren pengeluaran mingguan, dan proyeksi pelunasan cicilan Anda.
            </p>
          </div>

          <div className="flex items-center justify-around gap-2 rounded-xl border border-border/60 bg-muted/20 p-3.5 text-center">
            <div>
              <span className="text-[11px] text-muted-foreground block">Rasio Tabungan</span>
              <span className="text-base font-bold text-foreground tabular-nums">28,5%</span>
            </div>
            <div className="h-8 w-px bg-border/60" />
            <div>
              <span className="text-[11px] text-muted-foreground block">Cicilan Aktif</span>
              <span className="text-base font-bold text-foreground tabular-nums">2 Pos</span>
            </div>
            <div className="h-8 w-px bg-border/60" />
            <div>
              <span className="text-[11px] text-muted-foreground block">Kepatuhan Pos</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                100%
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
