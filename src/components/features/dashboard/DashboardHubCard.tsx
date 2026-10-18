import * as React from "react";
import { Card } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * ==============================================================================
 * Kenzo Treasury — Dashboard Hub Preview Card Primitive (DashboardHubCard)
 * ==============================================================================
 *
 * ── Kenapa komponen ini ada ───────────────────────────────────────────────────
 *
 * Komponen kartu preview navigasi hub (Wishlist, Analitik Kas, dll.) yang
 * menyediakan layout standar: icon, judul, deskripsi, tautan cepat dengan panah,
 * serta area `children` fleksibel untuk konten ringkasan atau widget interaktif.
 */

export interface DashboardHubCardProps {
  /**
   * Ikon fitur (misal Lucide icon Sparkles, BarChart3, ShieldCheck).
   */
  icon: React.ReactNode;
  /**
   * Judul hub fitur (e.g. "Wishlist Barang Impian", "Analitik & Historis Kas").
   */
  title: string;
  /**
   * Deskripsi penjelasan singkat mengenai peran hub.
   */
  description: string;
  /**
   * URL tautan menuju halaman hub penuh (e.g. "/dashboard/wishlists").
   */
  href: string;
  /**
   * Label teks tombol tautan (e.g. "Buka Hub", "Lihat Tren").
   */
  linkText: string;
  /**
   * Konten ringkasan atau widget yang ditampilkan di dalam kartu.
   */
  children: React.ReactNode;
  /**
   * Kelas tambahan opsional.
   */
  className?: string;
}

export function DashboardHubCard({
  icon,
  title,
  description,
  href,
  linkText,
  children,
  className,
}: DashboardHubCardProps) {
  return (
    <Card
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between space-y-4",
        className
      )}
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
          </div>
          <Link
            href={href}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5 shrink-0"
          >
            <span>{linkText}</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      <div>{children}</div>
    </Card>
  );
}
