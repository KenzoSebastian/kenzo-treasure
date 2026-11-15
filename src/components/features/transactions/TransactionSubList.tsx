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
                onClick={() => handleSoftDelete(tx)}
                aria-label={`Hapus transaksi ${tx.description}`}
                className="size-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
    </div>
  );
}
