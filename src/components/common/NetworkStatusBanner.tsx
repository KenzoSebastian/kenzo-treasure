"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Network Status & Offline Sync Banner (Fase F18 + R1)
 * ==============================================================================
 *
 * Menampilkan banner konektivitas real-time di bagian atas aplikasi:
 * - Menampilkan indikator titik CSS + `"Mode Offline — Disimpan di perangkat"`
 *   saat koneksi internet terputus (bebas karakter emoji).
 * - Otomatis men-trigger background sync TanStack Query saat perangkat kembali
 *   online.
 */

import * as React from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { useOfflineSync } from "@/hooks/use-offline-sync";

export function NetworkStatusBanner() {
  const { isOnline, isSyncing } = useOfflineSync();

  if (isOnline && !isSyncing) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full border-b border-amber-500/30 bg-amber-500/15 px-4 py-2 text-center text-xs font-semibold text-amber-900 dark:text-amber-200 backdrop-blur-xs"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span
              className="size-2 shrink-0 aspect-square rounded-full bg-amber-500"
              aria-hidden="true"
            />
            <span>Mode Offline — Disimpan di perangkat</span>
          </>
        ) : (
          <>
            <RefreshCw className="size-3.5 shrink-0 animate-spin text-emerald-600 dark:text-emerald-400" />
            <span>Menyinkronkan antrean data ke server...</span>
          </>
        )}
      </div>
    </div>
  );
}
