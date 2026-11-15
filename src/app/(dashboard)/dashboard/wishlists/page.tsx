import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCachedAuthenticatedSession } from "@/lib/queries/auth";
import { getWishlists } from "@/lib/queries/wishlists";
import { getSavingsAccount } from "@/lib/queries/savings";
import { WishlistGrid } from "@/components/features/wishlists";

export const metadata = {
  title: "Wishlist Impian • Kenzo Treasury",
  description: "Daftar barang impian dan tabungan Sinking Fund terencana.",
};

export default async function WishlistsPage() {
  const sessionRes = await getCachedAuthenticatedSession();
  const userId = sessionRes.success ? sessionRes.data.userId : undefined;

  const [wishlistsRes, savingsRes] = userId
    ? await Promise.all([getWishlists(userId), getSavingsAccount(userId)])
    : [
        { success: false as const, error: "" },
        { success: false as const, error: "" },
      ];

  const wishlists =
    wishlistsRes.success && wishlistsRes.data
      ? wishlistsRes.data.items
      : [];

  const freeSavingsBalance =
    savingsRes.success && savingsRes.data
      ? savingsRes.data.freeSavingsBalance
      : 0;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Wishlist Barang Impian
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Sinking fund barang impian bertahap dengan milestone progres,
            selebrasi Confetti, dan kompresor foto WebP.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs self-start sm:self-auto rounded-xl"
        >
          <Link href="/dashboard">
            <ArrowLeft className="size-3.5" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </Button>
      </div>

      <WishlistGrid
        wishlists={wishlists}
        freeSavingsBalance={freeSavingsBalance}
      />
    </div>
  );
}
