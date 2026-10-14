import * as React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LandingFooterProps {
  isLoggedIn?: boolean;
}

export function LandingFooter({ isLoggedIn = false }: LandingFooterProps) {
  return (
    <footer className="border-t bg-muted/30">
      {/* Final Conversion CTA Banner */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 text-center">
          <Badge variant="outline" className="text-xs uppercase tracking-widest font-semibold mb-4">
            Mulai Sekarang
          </Badge>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto">
            Kelola Uang Bulanan dengan Tenang dan Rapi.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Tidak ada lagi rasa cemas kehabisan uang di tengah bulan. Mulai atur pos belanja, amankan
            tabungan, dan catat pengeluaran dari ponsel dalam hitungan detik.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto font-medium gap-2 px-8">
              <Link href={isLoggedIn ? "/dashboard" : "/register"}>
                {isLoggedIn ? "Buka Dashboard Saya" : "Mulai Atur Keuangan Sekarang"}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            {!isLoggedIn && (
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto font-medium">
                <Link href="/login">Sudah Punya Akun? Masuk</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Information */}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg border bg-card">
                <ShieldCheck className="size-4 text-foreground" />
              </div>
              <span className="font-bold tracking-tight text-base">Kenzo Treasury</span>
              <Badge variant="secondary" className="text-[10px] uppercase font-medium">
                PWA
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              Aplikasi keuangan pribadi mobile-first untuk mencatat pengeluaran di kasir dengan cepat,
              mengunci kebutuhan pokok, dan menumbuhkan tabungan setiap bulan.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="rounded-md border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                100% Bebas Iklan
              </span>
              <span className="rounded-md border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Privasi Terenkripsi
              </span>
              <span className="rounded-md border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Dukungan Offline
              </span>
              <span className="rounded-md border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Ekspor Data Bebas
              </span>
            </div>
          </div>

          {/* Navigasi Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Navigasi Cepat
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <a href="#fitur" className="hover:text-foreground transition-colors">
                  6 Pilar Finansial
                </a>
              </li>
              <li>
                <a href="#cara-kerja" className="hover:text-foreground transition-colors">
                  Alur 4 Langkah
                </a>
              </li>
              <li>
                <a href="#keamanan" className="hover:text-foreground transition-colors">
                  Kedaulatan & Keamanan
                </a>
              </li>
              <li>
                <a href="#perbandingan" className="hover:text-foreground transition-colors">
                  Matriks Perbandingan
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-foreground transition-colors">
                  Tanya Jawab (FAQ)
                </a>
              </li>
            </ul>
          </div>

          {/* Autentikasi & Akses */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Akses Pengguna
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  Masuk ke Akun
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-foreground transition-colors">
                  Registrasi Akun Baru
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                  Dashboard Privat
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-12 border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Kenzo Treasury. Seluruh hak cipta dilindungi.</p>
          <p className="text-[11px]">
            Dirancang untuk kemudahan dan kepraktisan pencatatan harian.
          </p>
        </div>
      </div>
    </footer>
  );
}
