import * as React from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ComparisonRow {
  feature: string;
  kenzo: string;
  kenzoOk: boolean | "warn";
  apps: string;
  appsOk: boolean | "warn";
  sheet: string;
  sheetOk: boolean | "warn";
}

export function ComparisonTable() {
  const rows: ComparisonRow[] = [
    {
      feature: "Kecepatan Mencatat di Depan Kasir",
      kenzo: "< 5 Detik (Papan angka langsung aktif)",
      kenzoOk: true,
      apps: "15-30 Detik (Banyak menu & loading)",
      appsOk: "warn",
      sheet: "> 30 Detik (Berat dibuka di ponsel)",
      sheetOk: false,
    },
    {
      feature: "Pemisahan Siklus Setiap Bulan",
      kenzo: "Lembar baru siap dalam 1 sentuhan",
      kenzoOk: true,
      apps: "Semua bulan tercampur jadi satu",
      appsOk: false,
      sheet: "Harus copy-paste rumus manual",
      sheetOk: "warn",
    },
    {
      feature: "Alokasi Otomatis Uang Tambahan / Bonus",
      kenzo: "Otomatis menambah belanja & tabungan",
      kenzoOk: true,
      apps: "Tidak ada (harus hitung sendiri)",
      appsOk: false,
      sheet: "Rumus rumit dan mudah salah hitung",
      sheetOk: false,
    },
    {
      feature: "Hitung Mundur Cicilan Sampai Lunas",
      kenzo: "Otomatis selesai begitu lunas",
      kenzoOk: true,
      apps: "Tercatat sebagai tagihan abadi",
      appsOk: false,
      sheet: "Harus diperiksa manual satu per satu",
      sheetOk: "warn",
    },
    {
      feature: "Ukuran Ketahanan Dana Darurat",
      kenzo: "Hitungan nyata jumlah bulan bertahan hidup",
      kenzoOk: true,
      apps: "Hanya grafik persentase umum",
      appsOk: "warn",
      sheet: "Tidak tersedia secara bawaan",
      sheetOk: false,
    },
    {
      feature: "Privasi & Keamanan Data Pribadi",
      kenzo: "Data privat terkunci hanya untuk Anda",
      kenzoOk: true,
      apps: "Disimpan di server perusahaan aplikasi",
      appsOk: false,
      sheet: "Tersimpan di cloud penyedia dokumen",
      sheetOk: "warn",
    },
    {
      feature: "Ekspor Seluruh Catatan Kapan Saja",
      kenzo: "Bebas unduh file Excel / CSV tanpa syarat",
      kenzoOk: true,
      apps: "Sering dipagari biaya langganan",
      appsOk: false,
      sheet: "Bisa diunduh bebas",
      sheetOk: true,
    },
    {
      feature: "Bebas Iklan & Tawaran Pinjol",
      kenzo: "100% Bersih tanpa iklan apa pun",
      kenzoOk: true,
      apps: "Kerap muncul banner dan tawaran pinjaman",
      appsOk: false,
      sheet: "Bersih",
      sheetOk: true,
    },
    {
      feature: "Evaluasi Cerdas di Akhir Bulan",
      kenzo: "Rangkuman cerdas AI otomatis tersedia",
      kenzoOk: true,
      apps: "Perlu bayar fitur langganan mahal",
      appsOk: false,
      sheet: "Tidak ada",
      sheetOk: false,
    },
  ];

  function renderStatusIcon(status: boolean | "warn") {
    if (status === true) {
      return (
        <div className="flex size-5 shrink-0 aspect-square items-center justify-center rounded-full p-[1px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <Check className="size-3 shrink-0" strokeWidth={2.5} />
        </div>
      );
    }
    if (status === "warn") {
      return (
        <div className="flex size-5 shrink-0 aspect-square items-center justify-center rounded-full p-[1px] bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-3 shrink-0" strokeWidth={2.5} />
        </div>
      );
    }
    return (
      <div className="flex size-5 shrink-0 aspect-square items-center justify-center rounded-full p-[1px] bg-destructive/15 text-destructive">
        <X className="size-3 shrink-0" strokeWidth={2.5} />
      </div>
    );
  }

  return (
    <section id="perbandingan" className="py-20 sm:py-28 bg-muted/20 border-t">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="outline" className="text-xs uppercase tracking-widest font-semibold">
            Perbandingan Jujur
          </Badge>
          <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight">
            Kenapa Memilih Kenzo Treasury?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Bandingkan kepraktisan Kenzo Treasury dengan aplikasi pencatat keuangan umum atau lembar
            spreadsheet manual.
          </p>
        </div>

        {/* Comparison Table with deliberate horizontal scroll on mobile */}
        <div className="mt-14 overflow-x-auto rounded-2xl border bg-card shadow-xs">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="py-4 px-4 sm:px-6 font-bold text-foreground w-1/3">
                  Fitur & Logika Finansial
                </th>
                <th className="py-4 px-4 sm:px-6 font-extrabold text-foreground bg-primary/5 border-x border-primary/20 w-1/4">
                  <div className="flex items-center gap-1.5">
                    <span>Kenzo Treasury</span>
                    <Badge variant="default" className="text-[10px] py-0 px-1.5 font-bold">
                      PWA
                    </Badge>
                  </div>
                </th>
                <th className="py-4 px-4 sm:px-6 font-medium text-muted-foreground w-1/4">
                  Aplikasi Finansial Umum
                </th>
                <th className="py-4 px-4 sm:px-6 font-medium text-muted-foreground w-1/4">
                  Excel / Notion Sheet
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r, idx) => (
                <tr key={idx} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-medium text-foreground">
                    {r.feature}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 font-semibold bg-primary/5 border-x border-primary/20">
                    <div className="flex items-center gap-2">
                      {renderStatusIcon(r.kenzoOk)}
                      <span className="text-foreground">{r.kenzo}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {renderStatusIcon(r.appsOk)}
                      <span>{r.apps}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {renderStatusIcon(r.sheetOk)}
                      <span>{r.sheet}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
