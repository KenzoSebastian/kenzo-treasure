import * as React from "react";
import { Lock, Zap, Database, Shield } from "lucide-react";

export function MetricsStrip() {
  const metrics = [
    {
      icon: Lock,
      value: "100% Terencana",
      label: "Kebutuhan Pokok Aman",
      desc: "Pos sewa, makan, dan operasional terdanai di awal bulan agar tidak terpakai untuk hal lain.",
    },
    {
      icon: Zap,
      value: "< 5 Detik",
      label: "Catat Cepat di Kasir",
      desc: "Buka ponsel saat antre minimarket, ketik nominal, dan simpan sebelum struk selesai dicetak.",
    },
    {
      icon: Database,
      value: "100% Privat",
      label: "Data Milik Anda Sendiri",
      desc: "Catatan keuangan Anda tersimpan privat tanpa pelacak dan tidak pernah dibagikan ke pihak ketiga.",
    },
    {
      icon: Shield,
      value: "0 Iklan",
      label: "Bebas Tawaran Pinjol",
      desc: "Fokus menata keuangan tanpa gangguan banner iklan, pop-up promosi, atau penawaran kredit.",
    },
  ];

  return (
    <section className="border-y bg-muted/40 py-12 transition-colors">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex flex-col">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Icon className="size-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {item.label}
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
                  {item.value}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
