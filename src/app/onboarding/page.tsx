/**
 * ==============================================================================
 * Kenzo Treasury — Onboarding Page Orchestrator (`/onboarding`) (Fase R3)
 * ==============================================================================
 *
 * Server Component orchestrator untuk alur onboarding pengguna baru:
 * - Memastikan sesi pengguna terautentikasi via `getCachedAuthenticatedSession()`.
 * - Membaca konfigurasi awal pengguna via `getUserFinanceSetup()`.
 * - Menyajikan `OnboardingWizard` 3 langkah.
 */

import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCachedAuthenticatedSession } from "@/lib/queries/auth";
import { getUserFinanceSetup } from "@/lib/queries/settings";
import { OnboardingWizard } from "@/components/features/onboarding";

export const metadata: Metadata = {
  title: "Penyiapan Awal Keuangan — Kenzo Treasury",
  description:
    "Atur gaji pokok, target dana darurat, dan template pos anggaran rutin Anda.",
};

export default async function OnboardingPage() {
  const sessionResult = await getCachedAuthenticatedSession();
  if (!sessionResult.success) {
    redirect("/login");
  }

  const setup = await getUserFinanceSetup(sessionResult.data.userId).catch(
    () => null
  );

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <OnboardingWizard
        userName={setup?.name ?? sessionResult.data.name}
        initialBaseSalary={setup?.defaultBaseSalary ?? 0}
        initialEmergencyFundTarget={setup?.emergencyFundTarget ?? 0}
      />
    </main>
  );
}
