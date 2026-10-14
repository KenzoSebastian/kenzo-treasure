import { getCurrentUser } from "@/actions/auth";
import { LandingNavbar } from "@/components/features/landing/LandingNavbar";
import { HeroSection } from "@/components/features/landing/HeroSection";
import { MetricsStrip } from "@/components/features/landing/MetricsStrip";
import { ProblemSolutionSection } from "@/components/features/landing/ProblemSolutionSection";
import { BentoFeatures } from "@/components/features/landing/BentoFeatures";
import { MobileShowcase } from "@/components/features/landing/MobileShowcase";
import { WorkflowSection } from "@/components/features/landing/WorkflowSection";
import { SecuritySection } from "@/components/features/landing/SecuritySection";
import { ComparisonTable } from "@/components/features/landing/ComparisonTable";
import { FaqAccordion } from "@/components/features/landing/FaqAccordion";
import { LandingFooter } from "@/components/features/landing/LandingFooter";

export const metadata = {
  title: "Kenzo Treasury — Atur Anggaran Bulanan Lebih Tenang & Rapi",
  description:
    "Aplikasi keuangan pribadi mobile-first untuk mencatat pengeluaran di bawah 5 detik, mengunci kebutuhan pokok, dan menabung otomatis tanpa rumus rumit.",
};

export default async function LandingPage() {
  const userResult = await getCurrentUser();
  const isLoggedIn = userResult.success && !!userResult.data;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-foreground selection:text-background">
      {/* 1. Navbar Publik */}
      <LandingNavbar isLoggedIn={isLoggedIn} />

      <main className="flex-1">
        {/* 2. Hero Section */}
        <HeroSection isLoggedIn={isLoggedIn} />

        {/* 3. Metrics & KPI Strip */}
        <MetricsStrip />

        {/* 4. Problem vs Solution Section */}
        <ProblemSolutionSection />

        {/* 5. Bento Grid 6 Pilar Finansial */}
        <BentoFeatures />

        {/* 6. Sub-Second Mobile Showcase */}
        <MobileShowcase />

        {/* 7. Alur 4 Langkah Disiplin Finansial */}
        <WorkflowSection />

        {/* 8. Kedaulatan & Keamanan Data (Security & Sovereignty) */}
        <SecuritySection />

        {/* 9. Matriks Perbandingan (Comparison Matrix Table) */}
        <ComparisonTable />

        {/* 10. Tanya Jawab Interaktif (FAQ Accordion) */}
        <FaqAccordion />
      </main>

      {/* 11 & 12. Final Conversion CTA Banner & Brand Footer */}
      <LandingFooter isLoggedIn={isLoggedIn} />
    </div>
  );
}
