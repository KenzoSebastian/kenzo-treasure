import * as React from "react";
import {
  Zap,
  RotateCcw,
  Check,
  CreditCard,
  QrCode,
  Banknote,
  Wifi,
  Signal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function MobileShowcase() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text / Specs */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-semibold">
              <Zap className="size-3.5 text-amber-500" />
              <span>Pencatatan Secepat Kilat</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Catat Pengeluaran di Depan Kasir dalam 5 Detik.
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Antrean minimarket yang ramai sering membuat orang menunda mencatat dan akhirnya lupa.
              Kenzo Treasury dirancang agar Anda bisa membuka ponsel, mengetik nominal dengan papan
              angka otomatis, dan menyimpannya dalam sekejap.
            </p>

            {/* Feature List */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted text-xs font-bold">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Formulir Nyaman Satu Tangan
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Formulir praktis muncul dari bawah layar dengan tombol besar yang mudah dijangkau jempol saat berdiri di kasir.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted text-xs font-bold">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Papan Angka Langsung Aktif
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Papan ketik angka langsung terbuka otomatis tanpa perlu beralih dari keyboard huruf secara manual.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted text-xs font-bold">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Tombol Batal Instan 5 Detik
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Salah memasukkan nominal? Tekan tombol Batal pada layar dalam 5 detik untuk mengembalikan saldo seketika.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Mobile Mockup Frame - Tampilan Depan Tegak 2 Dimensi dengan Floating Animation */}
          <div className="lg:col-span-6 flex justify-center py-6 sm:py-8">
            {/* Floating Phone Container */}
            <div className="relative select-none animate-float transition-transform duration-300 hover:scale-[1.01]">
              {/* 2D Front-Facing Phone Canvas (Proporsional Seimbang) */}
              <div className="relative mx-auto w-[280px] sm:w-[312px]">
                {/* Hardware Buttons on the sides */}
                {/* Left: Action Button & Volume Buttons */}
                <div className="absolute -left-[3px] top-24 w-[3.5px] h-7 rounded-l-xs bg-neutral-600/90 shadow-xs pointer-events-none" />
                <div className="absolute -left-[3px] top-35 w-[3.5px] h-11 rounded-l-xs bg-neutral-600/90 shadow-xs pointer-events-none" />
                <div className="absolute -left-[3px] top-49 w-[3.5px] h-11 rounded-l-xs bg-neutral-600/90 shadow-xs pointer-events-none" />
                {/* Right: Power / Side Button */}
                <div className="absolute -right-[3px] top-32 w-[3.5px] h-16 rounded-r-xs bg-neutral-600/90 shadow-xs pointer-events-none" />

                {/* Outer iPhone Titanium Chassis (Tegak 2 Dimensi) */}
                <div className="relative rounded-[50px] p-[9px] bg-neutral-900 border-[3px] border-neutral-700/80 ring-1 ring-white/10 shadow-2xl">
                  {/* Screen Bezel & Display Layer */}
                  <div className="relative rounded-[40px] bg-background border border-neutral-800/80 overflow-hidden flex flex-col justify-between p-3.5 pt-2 pb-2.5 text-xs font-sans shadow-inner min-h-[580px] sm:min-h-[595px]">
                    {/* iOS Status Bar with Vector Dynamic Island */}
                    <div className="relative h-8 flex items-center justify-between text-xs font-semibold text-foreground shrink-0 select-none px-1">
                      {/* Left: Clock */}
                      <span className="text-[11px] font-bold tracking-tight pl-2">09:41</span>

                      {/* Center: Authentic Vector Dynamic Island */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-1.5 h-6 w-24 rounded-full bg-black flex items-center justify-between px-2.5 shadow-md">
                        {/* Speaker / Ambient Light Sensor */}
                        <div className="size-2 rounded-full bg-neutral-900 border border-neutral-800/80" />
                        {/* Camera Lens with Lens Coating Reflection */}
                        <div className="size-2.5 rounded-full bg-[#080914] ring-1 ring-neutral-800/90 flex items-center justify-center shadow-inner">
                          <div className="size-1 rounded-full bg-indigo-500/35" />
                        </div>
                      </div>

                      {/* Right: Signal, Wifi, Battery Indicator */}
                      <div className="flex items-center gap-1.5 pr-1.5 text-foreground/80">
                        <Signal className="size-3" />
                        <Wifi className="size-3" />
                        {/* Vector Battery Pill */}
                        <div className="flex items-center gap-0.5">
                          <div className="w-4 h-2.5 rounded-[3px] border border-foreground/70 p-0.5 flex items-center">
                            <div className="h-full w-full rounded-[1px] bg-foreground/90" />
                          </div>
                          <div className="w-0.5 h-1 rounded-r-xs bg-foreground/70" />
                        </div>
                      </div>
                    </div>

                    {/* Main Kasir Kilat Drawer Interface */}
                    <div className="flex flex-col justify-between flex-1 space-y-3 pt-2">
                      {/* Drawer Header */}
                      <div className="flex items-center justify-between border-b pb-2">
                        <div>
                          <span className="font-bold text-xs text-foreground block leading-tight">
                            Catat Pengeluaran
                          </span>
                          <span className="text-[10px] text-muted-foreground">Kasir Kilat</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] py-0 px-2 h-5 font-normal">
                          &lt; 5 Detik
                        </Badge>
                      </div>

                      {/* Nominal Display Card */}
                      <div className="rounded-xl border bg-muted/40 p-2.5 text-center">
                        <span className="text-[10px] text-muted-foreground block">
                          Nominal Transaksi
                        </span>
                        <div className="text-2xl font-extrabold tracking-tight tabular-nums text-foreground mt-0.5">
                          Rp 35.000
                        </div>
                      </div>

                      {/* Pos Anggaran Chips */}
                      <div>
                        <span className="text-[10px] font-semibold text-muted-foreground block mb-1.5">
                          Pilih Pos Anggaran:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          <div className="rounded-lg border border-primary bg-primary/10 px-2 py-1.5 text-center font-semibold text-foreground flex items-center justify-center gap-1.5">
                            <span>⛽</span> Bensin
                          </div>
                          <div className="rounded-lg border bg-muted/30 px-2 py-1.5 text-center text-muted-foreground flex items-center justify-center gap-1.5">
                            <span>🍿</span> Belanja
                          </div>
                          <div className="rounded-lg border bg-muted/30 px-2 py-1.5 text-center text-muted-foreground flex items-center justify-center gap-1.5">
                            <span>⚡</span> Listrik
                          </div>
                          <div className="rounded-lg border bg-muted/30 px-2 py-1.5 text-center text-muted-foreground flex items-center justify-center gap-1.5">
                            <span>💰</span> Tabungan
                          </div>
                        </div>
                      </div>

                      {/* Payment Methods */}
                      <div>
                        <span className="text-[10px] font-semibold text-muted-foreground block mb-1.5">
                          Metode Pembayaran:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="default" className="text-[10px] gap-1 py-0.5 px-2 h-5.5">
                            <QrCode className="size-3" /> QRIS
                          </Badge>
                          <Badge variant="outline" className="text-[10px] gap-1 py-0.5 px-2 h-5.5">
                            <Banknote className="size-3" /> Tunai
                          </Badge>
                          <Badge variant="outline" className="text-[10px] gap-1 py-0.5 px-2 h-5.5">
                            <CreditCard className="size-3" /> Debit
                          </Badge>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button size="sm" className="w-full font-bold h-8 text-xs cursor-default">
                        Simpan Transaksi
                      </Button>

                      {/* 5-Second Undo Toast */}
                      <div className="rounded-lg border border-emerald-500/30 bg-card p-2 shadow-xs flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 truncate">
                          <Check className="size-3 text-emerald-500 shrink-0" />
                          <span className="text-foreground truncate font-medium">Tersimpan di Pos Bensin</span>
                        </div>
                        <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-1">
                          <RotateCcw className="size-3" />
                          Batal (5d)
                        </span>
                      </div>
                    </div>

                    {/* iOS Home Indicator Bar */}
                    <div className="h-4 flex items-center justify-center shrink-0 mt-1">
                      <div className="h-1 w-28 rounded-full bg-foreground/25" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Floor Shadow for Floating Effect */}
              <div
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 h-5 w-3/4 rounded-full bg-foreground/15 blur-xl animate-float-shadow pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
