import * as React from "react";
import {
  ShieldCheck,
  Lock,
  Download,
  WifiOff,
  KeyRound,
  FileCheck2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SecuritySection() {
  const securityFeatures = [
    {
      icon: Lock,
      title: "Penyimpanan Privat Mandiri",
      desc: "Setiap baris data transaksi terikat hanya ke akun Anda sendiri. Ruang data Anda terisolasi rapat sehingga tidak ada pengguna lain yang bisa melihatnya.",
    },
    {
      icon: KeyRound,
      title: "Proteksi Akun Tingkat Tinggi",
      desc: "Sesi masuk Anda dilindungi enkripsi ketat untuk mencegah pembajakan akun. Tetap aman diakses dari browser komputer maupun ponsel.",
    },
    {
      icon: Download,
      title: "Unduh Data Lengkap Kapan Saja",
      desc: "Catatan keuangan adalah hak milik Anda seutuhnya. Unduh seluruh riwayat pengeluaran, anggaran, dan tabungan ke format Excel atau CSV dengan sekali klik.",
    },
    {
      icon: WifiOff,
      title: "Bisa Dipakai Tanpa Sinyal",
      desc: "Pasang aplikasi ke layar utama ponsel Android atau iPhone. Anda tetap bisa mencatat pengeluaran harian dengan lancar walau sedang berada di area tanpa sinyal.",
    },
  ];

  return (
    <section id="keamanan" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="outline" className="text-xs uppercase tracking-widest font-semibold">
            Privasi & Keamanan
          </Badge>
          <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight">
            Data Keuangan Anda Tetap Menjadi Milik Anda Sendiri
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Catatan keuangan adalah hal yang sangat pribadi. Kenzo Treasury memastikan seluruh data
            tersimpan aman tanpa pelacak iklan dan tanpa campur tangan pihak ketiga.
          </p>
        </div>

        {/* 4 Security Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6">
          {securityFeatures.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border bg-card p-6 sm:p-8 flex items-start gap-4 shadow-xs"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted text-foreground">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
