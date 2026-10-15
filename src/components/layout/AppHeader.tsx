"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Sparkles,
  BarChart3,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { logout, type UserSessionData } from "@/actions/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  user: UserSessionData | null;
}

export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // Navigasi desktop utama
  const navLinks = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      href: "/dashboard#pos-anggaran",
      label: "Pos Anggaran",
      icon: Wallet,
      isActive: pathname.startsWith("/dashboard#pos-anggaran"),
    },
    {
      href: "/dashboard/wishlists",
      label: "Wishlist",
      icon: Sparkles,
      isActive: pathname.startsWith("/dashboard/wishlists"),
    },
    {
      href: "/dashboard/analytics",
      label: "Analitik",
      icon: BarChart3,
      isActive: pathname.startsWith("/dashboard/analytics"),
    },
  ];

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      const res = await logout();
      if (res.success) {
        toast.success("Berhasil keluar dari sesi akun");
        router.push("/login");
        router.refresh();
      } else {
        toast.error(res.error ?? "Gagal memproses logout");
        setIsLoggingOut(false);
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi saat logout");
      setIsLoggingOut(false);
    }
  }

  // Ambil inisial nama pengguna untuk avatar
  const displayName = user?.fullName || user?.email || "Pengguna";
  const initial = displayName.trim().charAt(0).toUpperCase() || "K";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Sisi Kiri: Branding & Logo */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            aria-label="Kembali ke Dashboard Kenzo Treasury"
          >
            <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-xs">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-foreground"
              >
                <path d="M12 2v20" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-foreground">
                Kenzo Treasury
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                Sistem Anggaran Mandiri
              </span>
            </div>
          </Link>
        </div>

        {/* Sisi Tengah: Navigasi Desktop */}
        <nav
          className="hidden md:flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 p-1 text-xs"
          aria-label="Navigasi Utama"
        >
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-colors",
                  link.isActive
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Icon className="size-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sisi Kanan: Theme Toggle & Profile Dropdown */}
        <div className="flex items-center gap-2">
          <ThemeToggle className="size-8 rounded-full border border-border/60" />

          {/* User Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-2 rounded-full border border-border/70 bg-card p-1 pr-2.5 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-muted/50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Menu akun pengguna"
            >
              <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary border border-primary/20">
                {initial}
              </div>
              <span className="hidden sm:inline-block max-w-27.5 truncate text-xs font-medium">
                {displayName}
              </span>
              <ChevronDown className="size-3 text-muted-foreground hidden sm:inline-block" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 p-1.5 shadow-lg border-border"
            >
              <DropdownMenuLabel className="px-2 py-1.5 font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-semibold leading-none text-foreground truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] leading-none text-muted-foreground truncate">
                    {user?.email || "Tidak ada email"}
                  </p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard")}
                  className="cursor-pointer gap-2 text-xs"
                >
                  <LayoutDashboard className="size-3.5 text-muted-foreground" />
                  <span>Dashboard Utama</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard#pos-anggaran")}
                  className="cursor-pointer gap-2 text-xs"
                >
                  <Wallet className="size-3.5 text-muted-foreground" />
                  <span>Pos Anggaran</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/wishlists")}
                  className="cursor-pointer gap-2 text-xs"
                >
                  <Sparkles className="size-3.5 text-muted-foreground" />
                  <span>Wishlist Impian</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/analytics")}
                  className="cursor-pointer gap-2 text-xs"
                >
                  <BarChart3 className="size-3.5 text-muted-foreground" />
                  <span>Grafik Analitik</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="cursor-pointer gap-2 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                {isLoggingOut ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <LogOut className="size-3.5" />
                )}
                <span>{isLoggingOut ? "Sedang Keluar..." : "Keluar (Logout)"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
