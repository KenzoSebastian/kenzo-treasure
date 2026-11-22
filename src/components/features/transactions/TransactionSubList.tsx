"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Sub-Log Riwayat Transaksi & 5-Second Undo Toast (Fase F9 & R1)
 * ==============================================================================
 *
 * Menampilkan daftar transaksi harian di dalam masing-masing pos anggaran:
 * - Tanggal, nominal Rupiah (`tabular-nums`, bebas font monospace), keterangan,
 *   dan badge metode bayar (`QRIS`, `Tunai`, `Debit`, `Transfer`).
 * - Aksi hapus transaksi (`softDeleteTransaction`) dengan optimistic removal
 *   dan Toast Sonner 5 detik berisi tombol **"Batalkan (Undo)"** yang
 *   memanggil `restoreTransaction` secara instan.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, RotateCcw, ReceiptText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  softDeleteTransaction,
  restoreTransaction,
} from "@/actions/transactions";
import { formatRupiah } from "@/lib/financial-calculations";
import type { TransactionItem, TransactionMethod } from "@/types";

const METHOD_LABELS: Record<TransactionMethod, string> = {
  qris: "QRIS",
  cash: "Tunai",
  debit: "Debit",
  transfer: "Transfer",
};

export interface TransactionSubListProps {
  transactions: TransactionItem[];
  isClosed?: boolean;
}

export function TransactionSubList({
  transactions: initialTransactions,
  isClosed = false,
}: TransactionSubListProps) {
  const router = useRouter();
  const [items, setItems] = React.useState<TransactionItem[]>(
    initialTransactions
  );
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [deleteItem, setDeleteItem] = React.useState<TransactionItem | null>(
    null
  );

  React.useEffect(() => {
    setItems(initialTransactions);
  }, [initialTransactions]);

  async function handleSoftDelete(item: TransactionItem) {
    if (isClosed || pendingId) return;

    // Optimistic UI: sembunyikan baris secara instan
    const previousItems = items;
    setItems((prev) => prev.filter((t) => t.id !== item.id));
    setPendingId(item.id);

    const res = await softDeleteTransaction(item.id);
    setPendingId(null);

    if (!res.success) {
      // Rollback jika gagal
      setItems(previousItems);
      toast.error(res.error || "Gagal menghapus transaksi.");
      return;
    }

    router.refresh();

    toast(`Transaksi "${item.description}" dihapus`, {
      description: `${formatRupiah(item.amount)} • Klik Undo dalam 5 detik untuk membatalkan.`,
      duration: 5000,
      action: {
        label: "Batalkan (Undo)",
        onClick: async () => {
          // Pulihkan secara instan di layar
          setItems((prev) => [item, ...prev]);
          const restoreRes = await restoreTransaction(item.id);
          if (!restoreRes.success) {
            toast.error(restoreRes.error || "Gagal memulihkan transaksi.");
            router.refresh();
            return;
          }
          toast.success("Transaksi berhasil dipulihkan!", {
            icon: <RotateCcw className="size-4" />,
          });
          router.refresh();
        },
      },
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-3 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ReceiptText className="size-3.5" />
          <span>Belum ada catatan transaksi di pos ini.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 pt-1">
      {items.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/20 px-2.5 py-2 text-xs transition-colors hover:bg-muted/40"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-foreground truncate">
                {tx.description}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 rounded-md font-medium shrink-0"
              >
                {METHOD_LABELS[tx.method] ?? tx.method.toUpperCase()}
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {tx.date}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-semibold text-foreground tabular-nums">
              {formatRupiah(tx.amount)}
            </span>

            {!isClosed && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={pendingId === tx.id}
                onClick={() => setDeleteItem(tx)}
                aria-label={`Hapus transaksi ${tx.description}`}
                className="size-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                {pendingId === tx.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>
      ))}

      {/* Modal Dialog Konfirmasi Hapus Transaksi */}
      <Dialog
        open={Boolean(deleteItem)}
        onOpenChange={(open) => !open && setDeleteItem(null)}
      >
        <DialogContent className="sm:max-w-md max-h-[90dvh]">
          <DialogHeader className="px-6 pt-5 pb-3.5 border-b border-border/40 shrink-0 text-left pr-14">
            <DialogTitle className="text-base font-bold text-foreground">
              Konfirmasi Hapus Transaksi
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan pengeluaran ini dari pos anggaran?
            </DialogDescription>
          </DialogHeader>

          {deleteItem && (
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0 text-xs">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Keterangan Transaksi</span>
                  <span className="font-bold text-foreground truncate max-w-[200px]">
                    {deleteItem.description}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Nominal</span>
                  <span className="font-extrabold text-foreground tabular-nums text-sm">
                    {formatRupiah(deleteItem.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tanggal</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {deleteItem.date}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Metode Pembayaran</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4 rounded-md font-medium"
                  >
                    {METHOD_LABELS[deleteItem.method] ??
                      deleteItem.method.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Realisasi terpakai pada pos ini akan berkurang otomatis. Anda tetap dapat membatalkan aksi ini melalui notifikasi Toast Undo (5 detik).
              </p>
            </div>
          )}

          <DialogFooter className="w-full border-t border-border/60 bg-background px-6 py-4 flex flex-row items-center justify-end gap-2.5 shrink-0 mt-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteItem(null)}
              className="rounded-xl cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={!deleteItem || pendingId === deleteItem?.id}
              onClick={() => {
                if (deleteItem) {
                  const target = deleteItem;
                  setDeleteItem(null);
                  void handleSoftDelete(target);
                }
              }}
              className="rounded-xl gap-1.5 font-semibold cursor-pointer shadow-xs"
            >
              <Trash2 className="size-3.5" />
              <span>Hapus Transaksi</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
