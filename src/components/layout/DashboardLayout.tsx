import * as React from "react";
import { getCurrentUser, type UserSessionData } from "@/actions/auth";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: UserSessionData | null;
}

/**
 * Layout wrapper responsif utama untuk zona dashboard privat Kenzo Treasury.
 * Mengintegrasikan AppHeader di bagian atas, konten utama dengan batas lebar Swiss grid,
 * serta MobileBottomNav di layar mobile.
 */
export async function DashboardLayout({
  children,
  user: initialUser,
}: DashboardLayoutProps) {
  let currentUser = initialUser;

  // Jika user belum diprovide oleh parent, ambil langsung dari sesi SSR
  if (currentUser === undefined) {
    const userRes = await getCurrentUser();
    currentUser = userRes.success ? userRes.data : null;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground antialiased">
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
