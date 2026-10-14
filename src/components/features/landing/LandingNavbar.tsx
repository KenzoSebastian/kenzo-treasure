"use client";

import * as React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  LayoutDashboard,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";

interface LandingNavbarProps {
  isLoggedIn?: boolean;
}

export function LandingNavbar({ isLoggedIn = false }: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const lastScrollY = React.useRef(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Deteksi posisi scroll melewati batas atas
      setIsScrolled(currentScrollY > 16);

      // Selalu tampilkan navbar ketika berada di puncak halaman
      if (currentScrollY <= 10) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      const delta = currentScrollY - lastScrollY.current;

      // Scroll ke bawah melewati batas -> sembunyikan navbar ke atas
      if (delta > 6) {
        if (!mobileMenuOpen) {
          setIsVisible(false);
        }
      } else if (delta < -6) {
        // Scroll sedikit ke atas -> munculkan navbar seketika dengan transisi mulus
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: "Fitur Utama", href: "#fitur" },
    { label: "Cara Kerja", href: "#cara-kerja" },
    { label: "Keamanan", href: "#keamanan" },
    { label: "Perbandingan", href: "#perbandingan" },
    { label: "Tanya Jawab", href: "#faq" },
  ];

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 w-full bg-background transition-transform duration-300 ease-in-out",
          isVisible ? "translate-y-0" : "-translate-y-full",
          isScrolled && "shadow-xs"
        )}
      >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight transition-opacity hover:opacity-90"
        >
          <div className="flex size-8 items-center justify-center rounded-lg border bg-card shadow-xs">
            <ShieldCheck className="size-4 text-foreground" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold tracking-tight">Kenzo Treasury</span>
            <span className="rounded-md border bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              PWA
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions & Theme Toggle */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <div className="h-4 w-px bg-border" />
          {isLoggedIn ? (
            <Button asChild size="sm" className="gap-2 font-medium">
              <Link href="/dashboard">
                <LayoutDashboard className="size-3.5" />
                Buka Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="font-medium">
                <Link href="/login">Masuk</Link>
              </Button>
              <Button asChild size="sm" className="gap-1.5 font-medium">
                <Link href="/register">
                  Coba Gratis
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="bg-background px-4 py-4 transition-all md:hidden animate-in slide-in-from-top-2 shadow-md">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <div className="my-2 border-t pt-3">
              {isLoggedIn ? (
                <Button
                  asChild
                  className="w-full gap-2 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/dashboard">
                    <LayoutDashboard className="size-4" />
                    Buka Dashboard
                  </Link>
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/login">Masuk</Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/register">Coba Gratis</Link>
                  </Button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>

    {/* Spacer to maintain document flow with fixed header */}
    <div className="h-16 w-full shrink-0" aria-hidden="true" />
  </>
  );
}
