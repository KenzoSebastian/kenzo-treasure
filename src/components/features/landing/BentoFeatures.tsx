import * as React from "react";
import {
  CalendarDays,
  Coins,
  CreditCard,
  ShieldAlert,
  Sparkles,
  Bot,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function BentoFeatures() {
  const pillars = [
    {
      icon: CalendarDays,
      badge: "Pilar 1",
      title: "1. Lembar Kerja Terpisah",
      subtitle: "Satu Bulan, Satu Fokus",
      desc: "Setiap bulan memiliki catatan mandiri. Sisa uang belanja di akhir bulan langsung dipindahkan rapi ke tabungan utama saat tutup buku tanpa mengacak-acak catatan bulan baru.",
      preview: {
        label: "Alur Tutup Buku",
        highlight: "Sisa Anggaran Belanja ➔ Masuk Tabungan Otomatis",
      },
    },
    {
      icon: Coins,
      badge: "Pilar 2",
      title: "2. Jatah Belanja Fleksibel",
      subtitle: "Otomatis Ikut Pemasukan",
      desc: "Gaji pokok mengamankan kebutuhan wajib. Ketika ada honor tambahan atau bonus, sistem langsung menambah jatah uang belanja santai dan tabungan secara proporsional.",
      preview: {
        label: "Alur Otomatis",
        highlight: "Uang Belanja Bertambah Saat Ada Bonus",
      },
    },
    {
      icon: CreditCard,
      badge: "Pilar 3",
      title: "3. Cicilan Terhitung Tuntas",
      subtitle: "Pasti Ada Ujungnya",
      desc: "Cicilan peralatan kerja atau pinjaman dipantau dengan batas waktu yang pasti. Setiap bulan dihitung mundur; begitu lunas, jatahnya langsung dialihkan untuk memperbesar tabungan.",
      preview: {
        label: "Hitung Mundur",
        highlight: "Bulan 8 dari 12 • Tersisa 4 Bulan Menuju Bebas Cicilan",
      },
    },
    {
      icon: ShieldAlert,
      badge: "Pilar 4",
      title: "4. Tolok Ukur Dana Darurat",
      subtitle: "Kesiapan Finansial Nyata",
      desc: "Ketahui persis berapa bulan Anda mampu bertahan hidup jika pemasukan tiba-tiba berhenti, dihitung akurat dari total kebutuhan pokok bulanan Anda.",
      preview: {
        label: "Ketahanan Hidup",
        highlight: "6 Bulan Biaya Hidup Tersedia Aman",
      },
    },
    {
      icon: Sparkles,
      badge: "Pilar 5",
      title: "5. Tabungan Barang Impian",
      subtitle: "Beli Tanpa Rasa Bersalah",
      desc: "Rencanakan pembelian laptop, gawai baru, atau liburan idaman. Sisihkan dana secara berkala dengan bilah progres visual sampai target tercapai.",
      preview: {
        label: "Target Impian",
        highlight: "75% Terkumpul • Sedikit Lagi Terwujud",
      },
    },
    {
      icon: Bot,
      badge: "Pilar 6",
      title: "6. Saran Keuangan dari AI",
      subtitle: "Evaluasi Akhir Bulan",
      desc: "Asisten AI memeriksa kebiasaan belanja bulanan Anda, menyoroti pos yang paling hemat, dan memberikan saran praktis untuk bulan berikutnya.",
      preview: {
        label: "Saran Asisten",
        highlight: "Pengeluaran hemat 15%, tabungan melampaui target",
      },
    },
  ];

  return (
    <section id="fitur" className="py-20 sm:py-28 bg-muted/20 border-t">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="outline" className="text-xs uppercase tracking-widest font-semibold">
            Fondasi Praktis
          </Badge>
          <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight">
            6 Pilar Pengendali Keuangan Bulanan
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Aturan terstruktur yang bekerja otomatis di setiap awal dan akhir bulan, menjaga uang Anda
            tetap utuh tanpa rumus rumit.
          </p>
        </div>

        {/* 6 Balanced Cards Grid (3 columns desktop, 2 columns tablet, 1 column mobile) */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border bg-card p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:border-foreground/20 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-lg border bg-muted">
                      <Icon className="size-5 text-foreground" />
                    </div>
                    <Badge variant="secondary" className="text-[11px] font-medium">
                      {pillar.badge}
                    </Badge>
                  </div>
                  <h3 className="mt-4 text-base sm:text-lg font-bold tracking-tight">
                    {pillar.title}
                  </h3>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                    {pillar.subtitle}
                  </span>
                  <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>

                {/* Visual Micro Preview Bar */}
                <div className="mt-6 rounded-xl border bg-muted/40 p-3 text-xs">
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    {pillar.preview.label}
                  </div>
                  <div className="mt-1 font-semibold text-foreground truncate">
                    {pillar.preview.highlight}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
