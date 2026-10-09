---
date: 2026-10-09
task: Pemisahan Modul Singleton QueryClient ke src/lib/query-client.ts
prompt: Query client pisahkan ke folder lib, bikin query-client.ts dengan konfigurasi custom staleTime, gcTime, retry 4xx check, refetch on reconnect, dan mutation onError
author: Cecillia (Cil)
---

# Changelog: Pemisahan Modul Singleton QueryClient

## 📌 Ringkasan Perubahan
Memisahkan inisialisasi TanStack QueryClient dari `src/app/providers.tsx` ke modul mandiri terpusat [`src/lib/query-client.ts`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/lib/query-client.ts) dengan konfigurasi cache, retry bersyarat, dan penanganan error mutasi.

---

## 📁 Berkas yang Dibuat / Diubah
- [`src/lib/query-client.ts`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/lib/query-client.ts) — Berkas baru berisi ekspor singleton `queryClient`.
- [`src/app/providers.tsx`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/src/app/providers.tsx) — Mengimpor singleton `queryClient` langsung ke `QueryClientProvider`.
- [`AGENTS.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/AGENTS.md) — Menambahkan `query-client.ts` ke diagram pohon folder di Seksi 4.
- [`laporan.md`](file:///C:/Users/kenzo/ngoding/kenzo-treasure/laporan.md) — Memperbarui ringkasan capaian persiapan & arsitektur.

---

## 💡 Konfigurasi Teknis (Rationale)
1. **Single Source of Truth Konfigurasi Cache:** Menghindari reinstansiasi `QueryClient` dan memusatkan pengaturan cache di satu berkas.
2. **Kondisi Retry Cerdas:**
   - Tidak melakukan retry otomatis untuk kode status HTTP 4xx (Client Error) agar menghemat bandwidth dan mencegah request berulang yang sia-sia.
   - Melakukan retry hingga maksimal 3 kali untuk transient network errors atau server error (5xx).
3. **Observabilitas Error Mutasi:** Handler `mutations.onError` terpusat mencatat log error ke konsol untuk memudahkan pelacakan bug saat mutasi Server Actions / API gagal.
