import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ShieldCheck,
  Wallet,
  CheckCircle2,
} from "lucide-react";

interface HeroSectionProps {
  isLoggedIn?: boolean;
}

export function HeroSection({ isLoggedIn = false }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Top Announcement Pill */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3.5 py-1 text-xs font-medium text-foreground transition-all hover:bg-muted">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-muted-foreground text-[11px]">v1.0</span>
            <span className="h-3 w-px bg-border" />
            <span>Aplikasi Keuangan Pribadi Siap Pakai di Ponsel</span>
            <ArrowRight className="size-3 text-muted-foreground" />
          </div>
        </div>

        {/* Headline & Subheadline */}
        <div className="mt-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl max-w-4xl mx-auto leading-[1.12]">
            Atur Anggaran Bulanan Lebih Tenang{" "}
            <span className="underline decoration-muted-foreground/30 underline-offset-8">
              Tanpa Takut Uang Bocor
            </span>
            .
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Kunci pos kebutuhan wajib di awal bulan, pantau sisa jatah belanja harian secara otomatis,
            dan amankan tabungan saat tutup buku. Praktis dicatat dari ponsel dalam hitungan detik.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto font-medium gap-2 px-6">
              <Link href={isLoggedIn ? "/dashboard" : "/register"}>
                {isLoggedIn ? "Buka Dashboard Saya" : "Mulai Atur Keuangan Gratis"}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto font-medium"
            >
              <a href="#fitur">Lihat Fitur Utama</a>
            </Button>
          </div>

          {/* Guarantee / Value Microcopy */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>100% Bebas Iklan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Catat Cepat di Kasir (&lt; 5 Detik)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Data Tersimpan Privat</span>
            </div>
          </div>
        </div>

        {/* Dashboard Visual Mockup (Swiss Functional Minimalism) */}
        <div className="mt-14 sm:mt-18 rounded-2xl border bg-card p-3 sm:p-6 shadow-xl shadow-black/5 dark:shadow-black/20">
          {/* Mockup Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg border bg-muted">
                <Wallet className="size-4 text-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tracking-tight">Lembar Kerja Finansial</span>
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                    🟢 Aktif Berjalan
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Siklus: Bulan Berjalan</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Dana Darurat: 6 Bulan Aman
              </Badge>
              <Badge variant="outline" className="text-xs">
                Kebutuhan Pokok Terkunci
              </Badge>
            </div>
          </div>

          {/* 3 Executive KPI Summary Cards */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-muted/30 p-4">
              <span className="text-xs font-medium text-muted-foreground">Total Pemasukan Bulan Ini</span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums">
                  Rp 12.500.000
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Pemasukan Pokok + Tambahan Proyek
              </p>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              <span className="text-xs font-medium text-muted-foreground">Pos Komitmen Terkunci</span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-foreground">
                  Rp 6.200.000
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Kebutuhan pokok teralokasi aman
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Sisa Anggaran Bebas & Tabungan
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
                  Rp 6.300.000
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Anggaran bebas bertambah dari pendapatan tambahan
              </p>
            </div>
          </div>

          {/* Pos Budget Preview Rows */}
          <div className="mt-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground px-1">
              <span>Pos Anggaran Terpilih</span>
              <span>Realisasi vs Target Budget</span>
            </div>

            {/* Row 1: Kebutuhan Pokok */}
            <div className="flex items-center justify-between rounded-lg border bg-background/50 p-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-base">🏠</span>
                <div>
                  <span className="font-semibold text-foreground">Kebutuhan Pokok & Operasional</span>
                  <span className="block text-[11px] text-muted-foreground">Alokasi Wajib Pokok</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-medium tabular-nums">Rp 3.500.000 / Rp 3.500.000</span>
                <Badge variant="outline" className="ml-2 text-[10px] text-emerald-600 border-emerald-500/20">
                  100% Terpenuhi
                </Badge>
              </div>
            </div>

            {/* Row 2: Cicilan Perangkat Kerja */}
            <div className="flex items-center justify-between rounded-lg border bg-background/50 p-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-base">💻</span>
                <div>
                  <span className="font-semibold text-foreground">Cicilan Perangkat Kerja (Pasti Lunas)</span>
                  <span className="block text-[11px] text-muted-foreground">Bulan 8 dari 12 • Selesai otomatis</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-medium tabular-nums">Rp 1.250.000 / bln</span>
                <Badge variant="outline" className="ml-2 text-[10px] text-foreground border-border">
                  Tersisa 4 Bln
                </Badge>
              </div>
            </div>

            {/* Row 3: Uang Bebas / Tabungan */}
            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-base">🍿</span>
                <div>
                  <span className="font-semibold text-foreground">Uang Bebas & Tabungan</span>
                  <span className="block text-[11px] text-muted-foreground">
                    Alokasi Dasar + Tambahan Bonus & Proyek
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-semibold tabular-nums text-foreground">
                  Rp 6.300.000
                </span>
                <Badge className="ml-2 text-[10px] bg-foreground text-background">
                  Bertambah Otomatis
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
