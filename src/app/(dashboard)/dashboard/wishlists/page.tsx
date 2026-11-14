import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/actions/auth";
import { getWishlists } from "@/lib/queries/wishlists";
import { getSavingsAccount } from "@/lib/queries/savings";
import { calculateWishlistProgress } from "@/lib/financial-calculations";
import { WishlistGrid } from "@/components/features/wishlists";
import type { WishlistWithProgress } from "@/types/wishlist";

export const metadata = {
  title: "Wishlist Impian • Kenzo Treasury",
  description: "Daftar barang impian dan tabungan Sinking Fund terencana.",
};

export default async function WishlistsPage() {
  const userRes = await getCurrentUser();
  const userId = userRes.success ? userRes.data?.id : undefined;

  const [wishlistsRes, savingsRes] = userId
    ? await Promise.all([getWishlists(userId), getSavingsAccount(userId)])
    : [
        { success: false as const, error: "" },
        { success: false as const, error: "" },
      ];

  const fallbackWishlists: WishlistWithProgress[] = [
    {
      id: "preview-camera",
      userId: userId ?? "preview",
      name: "Kamera Sony A6700 + Lensa Sigma 18-50mm",
      targetAmount: 12000000,
      savedAmount: 6000000,
      icon: "📷",
      imageUrl: null,
      isPurchased: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: calculateWishlistProgress(6000000, 12000000),
      allocations: [],
    },
    {
      id: "preview-desk",
      userId: userId ?? "preview",
      name: "Standing Desk Ergonomis & Monitor Arm",
      targetAmount: 4000000,
      savedAmount: 3800000,
      icon: "🖥️",
      imageUrl: null,
      isPurchased: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: calculateWishlistProgress(3800000, 4000000),
      allocations: [],
    },
  ];

  const wishlists =
    wishlistsRes.success && wishlistsRes.data.items.length > 0
      ? wishlistsRes.data.items
      : fallbackWishlists;

  const freeSavingsBalance =
    savingsRes.success && savingsRes.data
      ? savingsRes.data.freeSavingsBalance
      : 2500000;

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
