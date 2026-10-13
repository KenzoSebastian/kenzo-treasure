/**
 * ==============================================================================
 * Kenzo Treasury — Zod Auth Validation Schemas
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Mendefinisikan validasi input formulir autentikasi (login & registrasi).
 * Digunakan baik di sisi client (React Hook Form) maupun sisi server (Server Actions)
 * untuk memastikan integritas data sebelum payload diteruskan ke Supabase Auth.
 */

import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ message: "Email wajib diisi" })
    .trim()
    .toLowerCase()
    .email({ message: "Format email tidak valid" }),
  password: z
    .string({ message: "Password wajib diisi" })
    .min(6, { message: "Password minimal 6 karakter" }),
});

export const registerSchema = z.object({
  fullName: z
    .string({ message: "Nama lengkap wajib diisi" })
    .trim()
    .min(2, { message: "Nama lengkap minimal 2 karakter" }),
  email: z
    .string({ message: "Email wajib diisi" })
    .trim()
    .toLowerCase()
    .email({ message: "Format email tidak valid" }),
  password: z
    .string({ message: "Password wajib diisi" })
    .min(6, { message: "Password minimal 6 karakter" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
