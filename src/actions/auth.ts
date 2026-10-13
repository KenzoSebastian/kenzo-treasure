"use server";

/**
 * ==============================================================================
 * Kenzo Treasury — Server Actions: Autentikasi & Sinkronisasi Profil Pengguna
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Menangani seluruh operasi autentikasi (login, register, logout, getCurrentUser)
 * secara aman di sisi server Next.js.
 *
 * ── Prinsip Integritas Keamanan & Data ─────────────────────────────────────────
 *
 * 1. Supabase Auth adalah satu-satunya otoritas kredensial & password (`auth.users`).
 * 2. Tabel `public.users` disinkronkan 1:1 saat register/login dengan ID yang sama.
 * 3. Baris default `public.savings_account` diinisialisasi otomatis untuk user baru.
 * 4. Mengembalikan kontrak discriminated union `ActionResponse<T>`.
 * 5. Input divalidasi ketat menggunakan Zod sebelum berinteraksi dengan API/database.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, savingsAccount } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/schemas/auth.schema";
import type { ActionResponse } from "@/types";

export interface UserSessionData {
  id: string;
  email: string;
  fullName: string | null;
}

/**
 * Registrasi pengguna baru di Supabase Auth dan inisialisasi profil database.
 */
export async function register(
  input: RegisterInput
): Promise<ActionResponse<UserSessionData>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data registrasi tidak valid",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { fullName, email, password } = parsed.data;
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (authError) {
    return {
      success: false,
      error: authError.message,
    };
  }

  if (!authData.user) {
    return {
      success: false,
      error: "Gagal membuat akun pengguna di sistem autentikasi",
    };
  }

  const userId = authData.user.id;
  const userEmail = authData.user.email ?? email;

  try {
    // 1. Tautkan profil pengguna ke public.users (idempotent via onConflictDoNothing)
    await db
      .insert(users)
      .values({
        id: userId,
        email: userEmail,
        fullName,
      })
      .onConflictDoNothing();

    // 2. Inisialisasi brankas default tabungan & dana darurat (target default Rp 18.000.000)
    await db
      .insert(savingsAccount)
      .values({
        userId,
        balance: 0,
        emergencyFundTarget: 18000000,
        emergencyFundBalance: 0,
      })
      .onConflictDoNothing();
  } catch (dbError) {
    console.error("Gagal sinkronisasi profil pengguna ke PostgreSQL:", dbError);
    // Catatan: Jika DB gagal, Supabase Auth user sudah dibuat.
    // Error ditangani aman agar tidak membocorkan stack trace.
    return {
      success: false,
      error: "Akun berhasil dibuat namun inisialisasi profil database gagal. Silakan login kembali.",
    };
  }

  // Otomatis buat sesi cookie login jika signUp belum menghasilkan sesi aktif (auto-confirm mode)
  if (!authData.session) {
    await supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  return {
    success: true,
    data: {
      id: userId,
      email: userEmail,
      fullName,
    },
  };
}

/**
 * Login pengguna menggunakan email dan password.
 */
export async function login(
  input: LoginInput
): Promise<ActionResponse<UserSessionData>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data login tidak valid",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password } = parsed.data;
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError) {
    const isInvalidCreds = authError.message === "Invalid login credentials";
    return {
      success: false,
      error: isInvalidCreds ? "Email atau password salah" : authError.message,
      fieldErrors: isInvalidCreds
        ? { password: ["Email atau password salah"] }
        : undefined,
    };
  }

  if (!authData.user) {
    return {
      success: false,
      error: "Gagal memproses sesi login pengguna",
    };
  }

  const userId = authData.user.id;
  const userEmail = authData.user.email ?? email;
  const metadataFullName =
    (authData.user.user_metadata?.full_name as string) ?? null;

  try {
    // Idempotent sync: pastikan row profil dan savings account selalu ada
    await db
      .insert(users)
      .values({
        id: userId,
        email: userEmail,
        fullName: metadataFullName,
      })
      .onConflictDoNothing();

    await db
      .insert(savingsAccount)
      .values({
        userId,
        balance: 0,
        emergencyFundTarget: 18000000,
        emergencyFundBalance: 0,
      })
      .onConflictDoNothing();

    const [userProfile] = await db
      .select({ fullName: users.fullName })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return {
      success: true,
      data: {
        id: userId,
        email: userEmail,
        fullName: userProfile?.fullName ?? metadataFullName,
      },
    };
  } catch (dbError) {
    console.error("Gagal memeriksa profil saat login:", dbError);
    return {
      success: true,
      data: {
        id: userId,
        email: userEmail,
        fullName: metadataFullName,
      },
    };
  }
}

/**
 * Logout pengguna dan bersihkan sesi di cookie.
 */
export async function logout(): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    data: undefined,
  };
}

/**
 * Mengambil informasi pengguna yang sedang aktif dari sesi terverifikasi server.
 */
export async function getCurrentUser(): Promise<
  ActionResponse<UserSessionData>
> {
  const supabase = await createClient();

  // Selalu verifikasi ke Supabase Auth server langsung
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "Pengguna tidak terautentikasi",
    };
  }

  const [profile] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  return {
    success: true,
    data: {
      id: user.id,
      email: user.email ?? profile?.email ?? "",
      fullName:
        profile?.fullName ??
        (user.user_metadata?.full_name as string) ??
        null,
    },
  };
}
