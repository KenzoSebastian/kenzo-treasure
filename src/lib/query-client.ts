import { QueryClient } from "@tanstack/react-query";

/**
 * Singleton QueryClient terpusat untuk konfigurasi global caching TanStack Query.
 * - Stale Time: 5 menit
 * - Garbage Collection Time: 10 menit
 * - Retry: Menghentikan retry otomatis jika status HTTP 4xx (client error), maksimal 3x coba untuk error lainnya.
 * - Mutations: Logging error terpusat untuk kemudahan trace dan debugging.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.status && error.status >= 400 && error.status < 500) {
          console.log("query error: ", error);
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      onError: (error: any) => {
        console.log("mutation error: ", error);
      },
    },
  },
});
