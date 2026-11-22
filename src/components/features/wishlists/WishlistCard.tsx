"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Gamified Dream Wishlist Card & Grid (Fase F12, R1, R3)
 * ==============================================================================
 *
 * ── Kenapa komponen ini ada ───────────────────────────────────────────────────
 *
 * Menampilkan katalog kartu barang impian (Sinking Fund):
 * - Foto barang dengan rasio proporsional & loading skeleton.
 * - Progress bar pengumpulan dana & milestone badges (`50%`, `75%`, `90%`,
 *   `95%`, `100% Tercapai!`) dengan ikon Lucide semantik.
 * - Drawer alokasi dana (`AllocateWishlistDrawer`) & tombol `Tandai Terbeli`
 *   (`markWishlistAsPurchased`).
 * - Modal `Tambah Barang Impian Baru` dengan `IconPicker`, drag-and-drop image
 *   preview & kompresi WebP otomatis `<200KB` (`compressImageToWebP`).
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Plus,
  CheckCircle2,
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppCategoryIcon } from "@/components/common/AppCategoryIcon";
import { IconPicker } from "@/components/common/IconPicker";
import { getWishlistMilestoneIconComponent } from "@/lib/category-icons";
import { formatRupiah, parseRupiah } from "@/lib/financial-calculations";
import { compressImageToWebP } from "@/lib/image-compressor";
import { createWishlist, markWishlistAsPurchased } from "@/actions/wishlists";
import { AllocateWishlistDrawer } from "./AllocateWishlistDrawer";
import { cn } from "@/lib/utils";
import type { WishlistWithProgress } from "@/types/wishlist";

interface WishlistCardProps {
  wishlist: WishlistWithProgress;
  freeSavingsBalance: number;
}

export function WishlistCard({
  wishlist,
  freeSavingsBalance,
}: WishlistCardProps) {
  const router = useRouter();
  const [isMarking, startTransition] = React.useTransition();
  const [showPurchaseConfirm, setShowPurchaseConfirm] = React.useState(false);

  const progressPct = wishlist.progress.percentage;
  const remainingAmt = wishlist.progress.remainingAmount;
  const MilestoneIcon = getWishlistMilestoneIconComponent(
    wishlist.isPurchased ? "trophy" : wishlist.progress.milestoneIconKey
  );

  const handleMarkPurchased = () => {
    if (wishlist.id.startsWith("preview-")) return;
    startTransition(async () => {
      const res = await markWishlistAsPurchased(wishlist.id);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(`Selamat! "${wishlist.name}" ditandai Terbeli!`);
      router.refresh();
    });
  };

  // Milestone Badge (50%, 75%, 90%, 95%, 100%)
  let milestoneText = `${progressPct}% Terkumpul`;
  let milestoneStyle = "bg-muted text-muted-foreground border-border/60";

  if (wishlist.isPurchased) {
    milestoneText = "Sudah Terbeli";
    milestoneStyle = "bg-emerald-600 text-white border-emerald-600";
  } else if (progressPct >= 100) {
    milestoneText = "100% Tercapai!";
    milestoneStyle =
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
  } else if (progressPct >= 95) {
    milestoneText = "95% Hampir Lunas!";
    milestoneStyle =
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
  } else if (progressPct >= 90) {
    milestoneText = "Milestone 90%";
    milestoneStyle =
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
  } else if (progressPct >= 75) {
    milestoneText = "Milestone 75%";
    milestoneStyle =
      "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30";
  } else if (progressPct >= 50) {
    milestoneText = "Milestone 50%";
    milestoneStyle = "bg-primary/10 text-primary border-primary/30";
  }

  return (
    <Card className="rounded-2xl border border-border/80 bg-card overflow-hidden flex flex-col justify-between shadow-xs transition-all hover:border-foreground/25">
      <div>
        {/* Area Foto Barang Impian */}
        <div className="relative h-44 w-full bg-muted/40 border-b border-border/60 overflow-hidden flex items-center justify-center">
          {wishlist.imageUrl ? (
            <img
              src={wishlist.imageUrl}
              alt={wishlist.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <AppCategoryIcon iconKey={wishlist.icon} size="lg" />
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
                <ImageIcon className="size-3.5 opacity-60" />
                <span>Sinking Fund Impian</span>
              </span>
            </div>
          )}

          <div className="absolute top-3 right-3">
            <Badge
              variant="outline"
              className={cn(
                "rounded-full text-[10px] font-bold gap-1 px-2.5 py-0.5 backdrop-blur-md shadow-xs tabular-nums",
                milestoneStyle
              )}
            >
              <MilestoneIcon className="size-3 shrink-0" />
              <span>{milestoneText}</span>
            </Badge>
          </div>
        </div>

        {/* Konten Detail */}
        <div className="p-4 sm:p-5 space-y-3.5">
          <div className="flex items-start gap-2.5">
            <AppCategoryIcon iconKey={wishlist.icon} size="sm" />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground leading-snug truncate">
                {wishlist.name}
              </h3>
              <span className="text-xs text-muted-foreground tabular-nums">
                Target Harga: {formatRupiah(wishlist.targetAmount)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  progressPct >= 100 ? "bg-emerald-500" : "bg-amber-500"
                )}
                style={{
                  width: `${Math.min(100, progressPct)}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] tabular-nums">
              <span className="text-muted-foreground">
                Terkumpul:{" "}
                <strong className="text-foreground">
                  {formatRupiah(wishlist.savedAmount)}
                </strong>
              </span>
              <span className="text-muted-foreground">
                Kurang:{" "}
                <strong className="text-foreground">
                  {formatRupiah(remainingAmt)}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-2 border-t border-border/40 flex items-center gap-2">
        {!wishlist.isPurchased ? (
          <>
            <AllocateWishlistDrawer
              wishlist={wishlist}
              freeSavingsBalance={freeSavingsBalance}
            />
            {progressPct >= 100 && !wishlist.id.startsWith("preview-") && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isMarking}
                onClick={() => setShowPurchaseConfirm(true)}
                aria-label={`Tandai terbeli ${wishlist.name}`}
                className="h-9 px-3 rounded-xl gap-1 text-xs font-semibold border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
              >
                {isMarking ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-3.5" />
                )}
                <span>Tandai Terbeli</span>
              </Button>
            )}
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 py-1">
            <Trophy className="size-4" />
            <span>Barang impian ini telah tercapai & dibeli</span>
          </div>
        )}
      </div>

      {/* Modal Dialog Konfirmasi Tandai Terbeli */}
      <Dialog
        open={showPurchaseConfirm}
        onOpenChange={setShowPurchaseConfirm}
      >
        <DialogContent className="sm:max-w-md max-h-[90dvh]">
          <DialogHeader className="px-6 pt-5 pb-3.5 border-b border-border/40 shrink-0 text-left pr-14">
            <DialogTitle className="text-base font-bold text-foreground">
              Konfirmasi Pembelian Barang Impian
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Tandai barang impian ini sebagai sudah dibeli setelah tabungan mencukupi 100%.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0 text-xs">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Barang Impian</span>
                <span className="font-bold text-foreground">{wishlist.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Target Dana</span>
                <span className="font-extrabold text-foreground tabular-nums text-sm">
                  {formatRupiah(wishlist.targetAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Dana Terkumpul</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatRupiah(wishlist.savedAmount)} (100%)
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Setelah ditandai terbeli, barang ini akan mendapatkan lencana permanen &ldquo;Sudah Terbeli&rdquo;.
            </p>
          </div>

          <DialogFooter className="w-full border-t border-border/60 bg-background px-6 py-4 flex flex-row items-center justify-end gap-2.5 shrink-0 mt-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPurchaseConfirm(false)}
              className="rounded-xl cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isMarking}
              onClick={() => {
                setShowPurchaseConfirm(false);
                handleMarkPurchased();
              }}
              className="rounded-xl gap-1.5 font-semibold cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              {isMarking ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              <span>Konfirmasi Terbeli</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

interface WishlistGridProps {
  wishlists: WishlistWithProgress[];
  freeSavingsBalance: number;
}

export function WishlistGrid({
  wishlists,
  freeSavingsBalance,
}: WishlistGridProps) {
  const router = useRouter();
  const [openAddModal, setOpenAddModal] = React.useState(false);
  const [itemName, setItemName] = React.useState("");
  const [icon, setIcon] = React.useState("target");
  const [targetRaw, setTargetRaw] = React.useState("");
  const [previewDataUrl, setPreviewDataUrl] = React.useState<string>("");
  const [compressedInfo, setCompressedInfo] = React.useState<string | null>(
    null
  );
  const [isCompressing, setIsCompressing] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setFormError(null);
    try {
      const result = await compressImageToWebP(file, {
        maxDimension: 1200,
        maxSizeBytes: 200 * 1024,
      });
      setPreviewDataUrl(result.dataUrl);
      const kb = (result.sizeBytes / 1024).toFixed(1);
      setCompressedInfo(
        `Teroptimasi ke WebP (${result.width}x${result.height}px • ${kb} KB)`
      );
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Gagal mengompres foto."
      );
    } finally {
      setIsCompressing(false);
    }
  };

  const handleCreateWishlist = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = itemName.trim();
    const targetAmount = parseRupiah(targetRaw);

    if (trimmedName.length < 2) {
      setFormError("Nama barang impian minimal 2 karakter");
      return;
    }
    if (targetAmount <= 0) {
      setFormError("Target harga barang harus lebih besar dari Rp 0");
      return;
    }

    setFormError(null);
    startTransition(async () => {
      const res = await createWishlist({
        name: trimmedName,
        targetAmount,
        icon: icon.trim() || "target",
        imageUrl: previewDataUrl || null,
      });

      if (!res.success) {
        setFormError(res.error);
        return;
      }

      toast.success(`Barang impian "${res.data.name}" ditambahkan!`);
      setItemName("");
      setIcon("target");
      setTargetRaw("");
      setPreviewDataUrl("");
      setCompressedInfo(null);
      setOpenAddModal(false);
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      {/* Banner Ringkasan Sinking Fund & Tombol Tambah */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Sparkles className="size-4" />
            <span>Saldo Tabungan Bebas Siap Alokasi</span>
          </div>
          <div className="text-2xl font-extrabold text-foreground tabular-nums">
            {formatRupiah(freeSavingsBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            Sisihkan sebagian tabungan bebas ke barang impian tanpa menyentuh
            Brankas Dana Darurat.
          </p>
        </div>

        <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="h-10 px-4 rounded-xl gap-2 text-xs font-semibold self-start sm:self-auto"
            >
              <Plus className="size-4" />
              <span>Tambah Barang Impian Baru</span>
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md max-h-[90dvh]">
            <DialogHeader className="px-6 pt-5 pb-3.5 border-b border-border/40 shrink-0 text-left pr-14">
              <DialogTitle className="text-base font-bold text-foreground">
                Tambah Barang Impian Baru
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Unggah foto barang (otomatis dikompres ke WebP &lt;200KB) dan
                tentukan target harganya.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleCreateWishlist}
              className="flex flex-col flex-1 min-h-0 w-full m-0 p-0"
              noValidate
            >
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {/* Drag & Drop / Upload Image Preview (WebP Compressor) */}
                <div className="space-y-1.5">
                  <Label htmlFor="wishlist-photo" className="text-xs">
                    Foto Barang Impian (WebP Auto-Compress &lt;200KB)
                  </Label>
                  <label
                    htmlFor="wishlist-photo"
                    className="flex flex-col items-center justify-center h-36 w-full rounded-xl border border-dashed border-border/80 bg-muted/20 hover:bg-muted/40 cursor-pointer overflow-hidden transition-colors"
                  >
                    {previewDataUrl ? (
                      <img
                        src={previewDataUrl}
                        alt="Preview Barang Impian"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-muted-foreground p-4 text-center">
                        <UploadCloud className="size-6" />
                        <span className="text-xs font-medium">
                          {isCompressing
                            ? "Mengompres ke WebP..."
                            : "Klik untuk pilih foto barang"}
                        </span>
                        <span className="text-[10px]">
                          Otomatis dioptimasi ke WebP (maks. 1200px, &lt;200KB)
                        </span>
                      </div>
                    )}
                    <input
                      id="wishlist-photo"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  {compressedInfo && (
                    <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {compressedInfo}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="wishlist-name" className="text-xs">
                    Nama Barang Impian
                  </Label>
                  <Input
                    id="wishlist-name"
                    placeholder="Contoh: Laptop Kerja / Sepeda Lipat"
                    value={itemName}
                    onChange={(e) => {
                      setItemName(e.target.value);
                      setFormError(null);
                    }}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="wishlist-price" className="text-xs">
                    Target Harga (Rp)
                  </Label>
                  <Input
                    id="wishlist-price"
                    type="text"
                    inputMode="numeric"
                    placeholder="8.500.000"
                    value={
                      parseRupiah(targetRaw) > 0
                        ? parseRupiah(targetRaw).toLocaleString("id-ID")
                        : ""
                    }
                    onChange={(e) => {
                      setTargetRaw(String(parseRupiah(e.target.value)));
                      setFormError(null);
                    }}
                    className="h-10 rounded-xl text-xs tabular-nums"
                  />
                </div>

                <IconPicker
                  value={icon}
                  onChange={setIcon}
                  label="Pilih Ikon Wishlist"
                />

                {formError && (
                  <p className="text-xs font-medium text-destructive">
                    {formError}
                  </p>
                )}
              </div>

              <DialogFooter className="w-full border-t border-border/60 bg-background px-6 py-4 flex flex-row items-center justify-end gap-2.5 shrink-0 mt-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenAddModal(false)}
                  className="rounded-xl cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending || isCompressing}
                  className="rounded-xl gap-1.5 cursor-pointer font-semibold shadow-xs"
                >
                  {isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                  <span>Simpan Wishlist</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid Kartu Barang Impian */}
      {wishlists.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-border/70 bg-muted/15 p-8 text-center space-y-2">
          <p className="text-sm font-bold text-foreground">
            Belum ada barang impian di katalog Anda
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Tambahkan target pembelian barang impian dan kumpulkan dananya secara
            bertahap dari Saldo Tabungan Bebas tanpa mengganggu kas bulanan.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlists.map((w) => (
            <WishlistCard
              key={w.id}
              wishlist={w}
              freeSavingsBalance={freeSavingsBalance}
            />
          ))}
        </div>
      )}
    </div>
  );
}
