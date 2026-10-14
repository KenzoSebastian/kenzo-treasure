import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/app/providers";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kenzo Treasury — Monthly Personal Finance",
  description: "Web & PWA manajemen finansial bulanan independen untuk Kenzo Sebastian.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kenzo Treasury",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className="min-h-dvh w-full overflow-x-hidden antialiased font-sans bg-background text-foreground">
        <Providers>
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton
            duration={4000}
          />
        </Providers>
      </body>
    </html>
  );
}
