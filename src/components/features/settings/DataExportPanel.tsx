"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Data Export & Sovereign Backup Panel (Fase F17)
 * ==============================================================================
 *
 * ── Kenapa komponen ini ada ───────────────────────────────────────────────────
 *
 * Menyediakan antarmuka kedaulatan data mandiri (Data Sovereignty) dengan
 * 3 tombol unduhan langsung:
 * 1. `📥 Download CSV Transaksi Bulanan`
 * 2. `📊 Download Excel (.xlsx / .csv) Rekap Keuangan`
 * 3. `💾 Full JSON Backup (Kedaulatan Data)`
 * Dilengkapi indikator status unduhan yang jelas bagi pengguna.
 */

import * as React from "react";
import {
  Download,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { exportFinancialData } from "@/actions/export";
import type { ExportFormat } from "@/types/ai-review";

interface DataExportPanelProps {
  monthId?: string;
}

export function DataExportPanel({ monthId }: DataExportPanelProps) {
  const [downloadingFormat, setDownloadingFormat] =
    React.useState<ExportFormat | null>(null);
  const [lastDownloaded, setLastDownloaded] = React.useState<{
    format: ExportFormat;
    fileName: string;
    recordCount: number;
  } | null>(null);

  const handleDownload = async (format: ExportFormat) => {
    setDownloadingFormat(format);
    try {
      const res = await exportFinancialData(format);
      if (!res.success) {
        toast.error(res.error);
        return;
      }

      const blob = new Blob([res.data.content], {
        type: res.data.mimeType,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = res.data.filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      setLastDownloaded({
        format,
        fileName: res.data.filename,
        recordCount: res.data.recordCount,
      });

      toast.success(`Berkas "${res.data.filename}" berhasil diunduh!`);
    } catch {
      toast.error("Gagal mengunduh berkas ekspor data.");
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-foreground">
              Ekspor Data & Kedaulatan Backup Mandiri
            </h2>
            <p className="text-xs text-muted-foreground">
              Unduh seluruh riwayat transaksi, rekap anggaran, dan cadangan
              database kapan saja tanpa penguncian ekosistem.
            </p>
          </div>
        </div>

        <Badge variant="secondary" className="rounded-full text-[10px] self-start sm:self-auto">
          100% Data Sovereignty
        </Badge>
      </div>

      {/* 3 Tombol Aksi Unduhan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <Button
          type="button"
          variant="outline"
          disabled={downloadingFormat !== null}
          onClick={() => handleDownload("csv")}
          className="h-auto min-h-14 py-3.5 px-4 rounded-xl flex flex-col items-start gap-1 text-left justify-center border-border/80 hover:border-foreground/40"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            {downloadingFormat === "csv" ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <Download className="size-4 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>📥 Download CSV Transaksi Bulanan</span>
          </div>
          <span className="text-[11px] text-muted-foreground font-normal">
            Format tabel transaksi standar siap olah
          </span>
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={downloadingFormat !== null}
          onClick={() => handleDownload("excel")}
          className="h-auto min-h-14 py-3.5 px-4 rounded-xl flex flex-col items-start gap-1 text-left justify-center border-border/80 hover:border-foreground/40"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            {downloadingFormat === "excel" ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <FileSpreadsheet className="size-4 text-blue-600 dark:text-blue-400" />
            )}
            <span>📊 Download Excel (.xlsx) Rekap Keuangan</span>
          </div>
          <span className="text-[11px] text-muted-foreground font-normal">
            Kompatibel langsung dengan Microsoft Excel & Sheets
          </span>
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={downloadingFormat !== null}
          onClick={() => handleDownload("json")}
          className="h-auto min-h-14 py-3.5 px-4 rounded-xl flex flex-col items-start gap-1 text-left justify-center border-border/80 hover:border-foreground/40"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            {downloadingFormat === "json" ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <FileJson className="size-4 text-amber-600 dark:text-amber-400" />
            )}
            <span>💾 Full JSON Backup (Kedaulatan Data)</span>
          </div>
          <span className="text-[11px] text-muted-foreground font-normal">
            Snapshot penuh seluruh tabel keuangan pribadi Anda
          </span>
        </Button>
      </div>

      {/* Feedback Status Unduhan */}
      {lastDownloaded && (
        <div
          className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-800 dark:text-emerald-300"
          role="status"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              Unduhan terakhir berhasil:{" "}
              <strong>{lastDownloaded.fileName}</strong>
            </span>
          </div>
          <span className="font-semibold tabular-nums">
            {lastDownloaded.recordCount} Entri Data
          </span>
        </div>
      )}
    </Card>
  );
}
