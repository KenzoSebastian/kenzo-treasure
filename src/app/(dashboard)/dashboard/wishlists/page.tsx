import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, ArrowLeft, Target, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Wishlist Impian • Kenzo Treasury",
  description: "Daftar barang impian dan tabungan terencana.",
};

export default function WishlistsPage() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Wishlist Barang Impian
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Sinking fund barang impian bertahap dengan milestone progres dan kompresor foto WebP.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs self-start sm:self-auto">
          <Link href="/dashboard">
            <ArrowLeft className="size-3.5" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </Button>
      </div>

      <Card className="rounded-2xl border border-dashed border-border/80 bg-card/60 p-8 text-center space-y-4">
        <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto">
          <Sparkles className="size-6" />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <CardTitle className="text-base font-bold text-foreground">
            Sinking Fund Barang Impian
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed text-muted-foreground">
            Ruang perencanaan barang impian Anda. Di sini Anda dapat menambahkan foto barang, menetapkan target nominal, dan memindahkan sisa uang bebas bulanan.
          </CardDescription>
        </div>
        <div className="pt-2">
          <Button disabled variant="outline" size="sm" className="gap-1.5 text-xs opacity-60">
            <Plus className="size-3.5" />
            <span>Tambah Barang Impian</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
