"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardErrorBoundaryProps {
  error?: Error & { digest?: string };
  reset: () => void;
}

/**
 * Komponen Fail-Closed Error Boundary Fallback untuk Dashboard Kenzo Treasury.
 * Memberikan perlindungan antarmuka yang elegan saat terjadi kegagalan SSR/database,
 * tanpa mengekspos informasi sensitif atau koneksi rahasia ke layar pengguna.
 */
export function DashboardErrorBoundary({
  error,
  reset,
}: DashboardErrorBoundaryProps) {
  const [isResetting, setIsResetting] = React.useState(false);

  const handleRetry = () => {
    setIsResetting(true);
    reset();
    setTimeout(() => setIsResetting(false), 1000);
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md rounded-2xl border-destructive/20 bg-card text-center shadow-sm">
        <CardHeader className="flex flex-col items-center pb-2 pt-6">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3 ring-8 ring-destructive/5">
            <AlertCircle className="size-6" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            Kendala Memuat Dashboard
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
            Terjadi gangguan teknis saat mengambil data siklus keuangan aktif Anda.
            Seluruh saldo dan catatan tersimpan aman di database.
          </p>
        </CardHeader>

        <CardContent className="space-y-3 pb-4">
          {error?.digest && (
            <div className="rounded-md border border-border/60 bg-muted/50 p-2 text-[11px] text-muted-foreground font-sans">
              <span className="font-semibold text-foreground/80">Kode Referensi:</span>{" "}
              {error.digest}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2 pb-6 border-t border-border/50 bg-muted/20">
          <Button
            onClick={handleRetry}
            disabled={isResetting}
            className="w-full sm:w-auto gap-2 text-xs font-semibold"
          >
            <RefreshCw
              className={`size-3.5 ${isResetting ? "animate-spin" : ""}`}
            />
            <span>{isResetting ? "Mencoba Ulang..." : "Coba Muat Ulang"}</span>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto gap-2 text-xs border-border/80"
          >
            <Link href="/">
              <Home className="size-3.5" />
              <span>Halaman Utama</span>
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
