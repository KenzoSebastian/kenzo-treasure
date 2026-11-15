"use server";

/**
 * ==============================================================================
 * Kenzo Treasury — Server Actions: Autentikasi & Sinkronisasi Profil Pengguna
 * ==============================================================================
 *
 * Menangani seluruh operasi autentikasi (login, register, logout, getCurrentUser)
 * secara aman di sisi server Next.js:
 * 1. Supabase Auth adalah satu-satunya otoritas kredensial & password (`auth.users`).
 * 2. Tabel `public.users` disinkronkan 1:1 saat register/login dengan ID yang sama.
 * 3. `register` tidak melakukan auto-login melainkan membersihkan sesi sementara agar
 *    pengguna selalu masuk melalui `/login` sebelum diarahkan ke `/onboarding`.
 * 4. Baris default `public.savings_account` diinisialisasi otomatis dengan target `0`.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, savingsAccount } from "@/db/schema";
import { DEFAULT_EMERGENCY_FUND_TARGET } from "@/lib/financial-calculations";
import {
  getCachedAuthenticatedSession,
  type UserSessionData,
} from "@/lib/queries/auth";
import { revalidateDashboardRoutes } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/schemas/auth.schema";
import type { ActionResponse } from "@/types";

export type { UserSessionData };

/**
 * Registrasi pengguna baru di Supabase Auth dan inisialisasi profil database
 * tanpa auto-login (pengguna diarahkan ke halaman `/login`).
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
    // 1. Tautkan profil pengguna ke public.users (onboardingCompletedAt = null untuk user baru)
    await db
      .insert(users)
      .values({
        id: userId,
        email: userEmail,
        fullName,
        defaultBaseSalary: null,
        onboardingCompletedAt: null,
      })
      .onConflictDoNothing();

    // 2. Inisialisasi brankas default tabungan & dana darurat netral (target 0)
    await db
      .insert(savingsAccount)
      .values({
        userId,
        balance: 0,
        emergencyFundTarget: DEFAULT_EMERGENCY_FUND_TARGET,
        emergencyFundBalance: 0,
      })
      .onConflictDoNothing();
  } catch (dbError) {
    console.error("Gagal sinkronisasi profil pengguna ke PostgreSQL:", dbError);
    return {
      success: false,
      error:
        "Akun berhasil dibuat namun inisialisasi profil database gagal. Silakan login kembali.",
    };
  }

  // Pastikan sesi tidak langsung aktif saat registrasi agar alur selalu kembali ke /login
  if (authData.session) {
    await supabase.auth.signOut();
  }

  return {
    success: true,
    data: {
      id: userId,
      userId,
      email: userEmail,
      name: fullName,
      fullName,
      defaultBaseSalary: null,
      onboardingCompletedAt: null,
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
        emergencyFundTarget: DEFAULT_EMERGENCY_FUND_TARGET,
        emergencyFundBalance: 0,
      })
      .onConflictDoNothing();

    const [userProfile] = await db
      .select({
        fullName: users.fullName,
        defaultBaseSalary: users.defaultBaseSalary,
        onboardingCompletedAt: users.onboardingCompletedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    revalidateDashboardRoutes();

    const resolvedFullName =
      userProfile?.fullName ??
      metadataFullName ??
      userEmail.split("@")[0] ??
      "Pengguna";

    return {
      success: true,
      data: {
        id: userId,
        userId,
        email: userEmail,
        name: resolvedFullName,
        fullName: userProfile?.fullName ?? metadataFullName,
        defaultBaseSalary: userProfile?.defaultBaseSalary ?? null,
        onboardingCompletedAt: userProfile?.onboardingCompletedAt ?? null,
      },
    };
  } catch (dbError) {
    console.error("Gagal memeriksa profil saat login:", dbError);
    revalidateDashboardRoutes();
    const fallbackName =
      metadataFullName ?? userEmail.split("@")[0] ?? "Pengguna";
    return {
      success: true,
      data: {
        id: userId,
        userId,
        email: userEmail,
        name: fallbackName,
        fullName: metadataFullName,
        defaultBaseSalary: null,
        onboardingCompletedAt: null,
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

  revalidateDashboardRoutes();

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
  return getCachedAuthenticatedSession();
}
