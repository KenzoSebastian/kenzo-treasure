import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { ActionResponse } from "@/types";

export interface UserSessionData {
  id: string;
  userId: string;
  email: string;
  name: string;
  fullName: string | null;
  defaultBaseSalary: number | null;
  onboardingCompletedAt: Date | null;
}

/**
 * Deduplikasi pembacaan sesi pengguna terautentikasi per siklus request RSC
 * menggunakan `React.cache(...)`.
 */
export const getCachedAuthenticatedSession = cache(
  async (): Promise<ActionResponse<UserSessionData>> => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return {
          success: false,
          error: "Sesi tidak ditemukan atau sudah berakhir.",
        };
      }

      const [profile] = await db
        .select({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          defaultBaseSalary: users.defaultBaseSalary,
          onboardingCompletedAt: users.onboardingCompletedAt,
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      const resolvedName =
        profile?.fullName ??
        (user.user_metadata?.full_name as string | undefined) ??
        user.email?.split("@")[0] ??
        "Pengguna";

      return {
        success: true,
        data: {
          id: user.id,
          userId: user.id,
          email: user.email ?? profile?.email ?? "",
          name: resolvedName,
          fullName: profile?.fullName ?? resolvedName,
          defaultBaseSalary: profile?.defaultBaseSalary ?? null,
          onboardingCompletedAt: profile?.onboardingCompletedAt ?? null,
        },
      };
    } catch (err) {
      if (
        typeof err === "object" &&
        err !== null &&
        "digest" in err &&
        (err as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
      ) {
        return {
          success: false,
          error: "Sesi tidak ditemukan atau sudah berakhir.",
        };
      }
      console.error("Gagal memverifikasi sesi terautentikasi:", err);
      return {
        success: false,
        error: "Gagal membaca sesi pengguna.",
      };
    }
  }
);

/**
 * Mengambil `userId` terautentikasi yang di-cache per siklus request RSC.
 */
export const getCachedUserId = cache(async (): Promise<string | null> => {
  const session = await getCachedAuthenticatedSession();
  return session.success ? session.data.userId : null;
});
