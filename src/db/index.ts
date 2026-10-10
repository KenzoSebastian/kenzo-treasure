/**
 * ==============================================================================
 * Kenzo Treasury — Database Connection & Drizzle ORM Client
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Menginisialisasi koneksi singleton database PostgreSQL native cepat (`postgres.js`)
 * dan mengikat seluruh skema relasional 9 tabel ke instance `db`.
 *
 * ── Supabase Connection Pooling Considerations ───────────────────────────────
 *
 * Pada mode Supabase Transaction Pooler (port 6543 / Supavisor), prepared statements
 * tidak didukung di level koneksi pooled. Oleh karena itu, opsi `{ prepare: false }`
 * diaktifkan secara eksplisit untuk mencegah error eksekusi query pada serverless/
 * server actions Next.js.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "";

// Supabase Transaction Pooler kompatibel (prepare: false)
const client = postgres(connectionString, {
  prepare: false,
});

export const db = drizzle(client, { schema });
