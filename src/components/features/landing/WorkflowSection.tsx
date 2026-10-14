import * as React from "react";
import {
  Sparkles,
  CalendarCheck,
  Receipt,
  Layers,
  CheckCircle,
} from "lucide-react";

export function WorkflowSection() {
  const steps = [
    {
      step: "01",
      icon: CalendarCheck,
      title: "Buka Lembar Bulan Baru",
      desc: "Di awal bulan, siapkan lembar anggaran dalam 1 sentuhan. Pos kebutuhan rutin tersusun rapi, dan cicilan yang sudah lunas otomatis disisihkan.",
    },
    {
      step: "02",
      icon: Receipt,
      title: "Catat Pengeluaran Harian",
      desc: "Saat berbelanja di kasir, buka formulir kilat dari ponsel. Ketik nominal, pilih pos belanja, dan simpan. Tersedia tombol Batal jika salah ketik.",
    },
    {
      step: "03",
      icon: Layers,
      title: "Alokasikan Uang Tambahan",
      desc: "Ketika menerima pembayaran honor sampingan atau bonus, masukkan sebagai pemasukan baru. Sistem otomatis membaginya ke pos belanja santai dan tabungan.",
    },
    {
      step: "04",
      icon: Sparkles,
      title: "Tutup Buku & Amankan Tabungan",
      desc: "Di akhir bulan, lakukan tutup buku. Seluruh sisa anggaran belanja otomatis disapu ke tabungan utama, lalu asisten AI merangkum performa keuangan Anda.",
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-muted/20 border-t">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Langkah Praktis
          </span>
          <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight">
            4 Langkah Mengatur Uang Bulanan
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Siklus teratur yang menjaga setiap rupiah dialokasikan dengan jelas sejak hari pertama gajian
            hingga akhir bulan.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border bg-card p-6 flex flex-col justify-between relative shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black tracking-tight text-muted-foreground/50">
                      {item.step}
                    </span>
                    <div className="flex size-9 items-center justify-center rounded-lg border bg-muted">
                      <Icon className="size-4 text-foreground" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-foreground tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="size-3.5" />
                  <span>Otomatis & Teratur</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
