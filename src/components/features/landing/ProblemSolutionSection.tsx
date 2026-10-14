import * as React from "react";
import { XCircle, CheckCircle2, ArrowRight } from "lucide-react";

export function ProblemSolutionSection() {
  const problems = [
    {
      title: "Rumus Spreadsheet Mudah Rusak di Layar Ponsel",
      desc: "Salah sentuh satu sel di layar ponsel bisa menghapus rumus perhitungan pengeluaran satu bulan penuh.",
    },
    {
      title: "Aplikasi Berat Bikin Malas Mencatat di Kasir",
      desc: "Membuka aplikasi yang lambat saat antre minimarket membuat transaksi terlewat dan catatan pengeluaran bocor.",
    },
    {
      title: "Pemasukan Tambahan Mencampuradukkan Anggaran",
      desc: "Uang bonus atau honor sampingan tercampur dengan gaji pokok, membuat Anda merasa punya uang lebih padahal biaya wajib belum dibayar.",
    },
    {
      title: "Cicilan Tercatat Sebagai Beban Rutin Selamanya",
      desc: "Aplikasi umum mencatat cicilan seperti tagihan tanpa akhir, tanpa hitungan mundur kapan cicilan benar-benar lunas.",
    },
    {
      title: "Banjir Iklan dan Tawaran Pinjaman Online",
      desc: "Banyak aplikasi keuangan gratis yang memonetisasi data belanja pengguna atau membanjiri layar dengan tawaran kredit.",
    },
  ];

  const solutions = [
    {
      title: "Lembar Kerja Bulanan Terpisah & Rapi",
      desc: "Setiap bulan memiliki catatan mandiri. Buka lembar bulan baru dengan satu klik tanpa mengutak-atik riwayat sebelumnya.",
    },
    {
      title: "Pencatatan Kilat di Bawah 5 Detik",
      desc: "Tombol catat siap pakai di kasir, papan angka otomatis langsung terbuka, dan tombol Batal jika salah input.",
    },
    {
      title: "Uang Belanja Bertambah Otomatis Saat Ada Bonus",
      desc: "Pemasukan sampingan langsung menambah jatah belanja santai dan tabungan Anda tanpa menyentuh kebutuhan pokok.",
    },
    {
      title: "Hitung Mundur Cicilan Sampai Tuntas",
      desc: "Cicilan dihitung mundur setiap bulan. Begitu lunas, alokasinya otomatis dialihkan untuk memperbesar tabungan Anda.",
    },
    {
      title: "Privasi Terjaga dan Bebas Ekspor Kapan Saja",
      desc: "Catatan keuangan Anda tersimpan privat tanpa iklan. Anda bisa mengunduh file Excel atau CSV kapan pun Anda butuhkan.",
    },
  ];

  return (
    <section id="cara-kerja" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Masalah & Solusi
          </span>
          <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight">
            Kenapa Aplikasi Biasa dan Spreadsheet Sering Gagal?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Rumus yang mudah rusak, pencatatan yang lambat saat di kasir, dan anggaran yang campur aduk
            membuat banyak orang menyerah menata keuangan harian.
          </p>
        </div>

        {/* Side-by-Side Comparison Cards */}
        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column: Old Methods */}
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 sm:p-8">
            <div className="flex items-center gap-3 border-b border-destructive/15 pb-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <XCircle className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Metode Lama: Spreadsheet & Aplikasi Biasa</h3>
                <p className="text-xs text-muted-foreground">Kerapuhan cara pencatatan konvensional</p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {problems.map((p, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive text-xs font-bold">
                    ✕
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{p.title}</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Kenzo Treasury */}
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6 sm:p-8">
            <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Solusi Praktis Kenzo Treasury</h3>
                <p className="text-xs text-muted-foreground">Pencatatan cepat dan anggaran terencana</p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {solutions.map((s, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
