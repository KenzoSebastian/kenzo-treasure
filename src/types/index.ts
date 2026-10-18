/**
 * ==============================================================================
 * Kenzo Treasury — Shared Global Types & Contracts
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Berkas ini mendefinisikan tipe dan kontrak bersama tingkat aplikasi, khususnya
 * discriminated union `ActionResponse<T>` untuk seluruh Server Actions sesuai
 * panduan `.agents/rules/database-access.md`.
 */

/**
 * Kontrak standar respons Server Actions.
 * Menggunakan discriminated union agar pemanggil (UI / Mutation Hooks)
 * dapat melakukan type-narrowing dengan aman berdasarkan properti `success`.
 */
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

export * from "./month";
