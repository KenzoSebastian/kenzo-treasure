"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
}

/**
 * Hook pemantau status jaringan online/offline (Fase F18):
 * - Mendeteksi perubahan `window.ononline` & `window.onoffline`.
 * - Mendaftarkan Service Worker `/sw.js` untuk kapabilitas PWA.
 * - Otomatis men-trigger background sync TanStack Query & `router.refresh()`
 *   begitu koneksi perangkat kembali online.
 */
export function useOfflineSync(): OfflineSyncState {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = React.useState<boolean>(true);
  const [isSyncing, setIsSyncing] = React.useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = React.useState<Date | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Abaikan jika SW gagal diregistrasi pada lingkungan dev tertentu
      });
    }

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      try {
        await queryClient.resumePausedMutations();
        await queryClient.invalidateQueries();
        router.refresh();
        setLastSyncedAt(new Date());
        toast.success("Koneksi pulih — Data berhasil disinkronkan");
      } finally {
        setIsSyncing(false);
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [queryClient, router]);

  return {
    isOnline,
    isSyncing,
    lastSyncedAt,
  };
}
