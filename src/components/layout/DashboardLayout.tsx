import * as React from "react";
import { redirect } from "next/navigation";
import {
  getCachedAuthenticatedSession,
  type UserSessionData,
} from "@/lib/queries/auth";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { NetworkStatusBanner } from "@/components/common/NetworkStatusBanner";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: UserSessionData | null;
}

/**
 * Layout wrapper responsif utama untuk zona dashboard privat Kenzo Treasury.
 * Menggunakan `getCachedAuthenticatedSession` (`React.cache`) dan mengarahkan
 * pengguna baru yang belum menyelesaikan onboarding (`onboardingCompletedAt === null`)
 * ke rute `/onboarding`.
 */
export async function DashboardLayout({
  children,
  user: initialUser,
}: DashboardLayoutProps) {
  let currentUser = initialUser;

  if (currentUser === undefined) {
    const sessionRes = await getCachedAuthenticatedSession();
    currentUser = sessionRes.success ? sessionRes.data : null;
  }

  if (currentUser && currentUser.onboardingCompletedAt === null) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground antialiased">
      {/* Banner Konektivitas Offline/Online (Fase F18) */}
      <NetworkStatusBanner />

      {/* Header Aplikasi (Sticky Top) */}
      <AppHeader user={currentUser ?? null} />

      {/* Konten Utama Terpusat */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
        {children}
      </main>

      {/* Navigasi Bawah Mobile-Only (Fixed Bottom) */}
      <MobileBottomNav />
    </div>
  );
}
