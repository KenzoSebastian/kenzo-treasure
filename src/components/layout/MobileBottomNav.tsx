"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Sparkles, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [currentHash, setCurrentHash] = React.useState<string>("");

  React.useEffect(() => {
    // Pantau hash browser untuk mendeteksi anchor #pos-anggaran
    const updateHash = () => {
      if (typeof window !== "undefined") {
        setCurrentHash(window.location.hash);
      }
    };

    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, [pathname]);

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      isActive:
        pathname === "/dashboard" &&
        (!currentHash || currentHash === "#" || currentHash === "#overview"),
    },
    {
      href: "/dashboard#pos-anggaran",
      label: "Anggaran",
      icon: Wallet,
      isActive:
        pathname === "/dashboard" && currentHash === "#pos-anggaran",
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

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border/80 bg-background/95 backdrop-blur-md pb-[calc(env(safe-area-inset-bottom,0px)+0.35rem)] pt-1 px-3 shadow-lg"
      aria-label="Navigasi Bawah Ponsel"
    >
      <div className="flex items-center justify-around gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center min-h-12 py-1 px-1 rounded-xl transition-all duration-150 select-none",
                active
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center size-8 rounded-full transition-colors",
                  active
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="size-4.5" strokeWidth={active ? 2.3 : 1.8} />
              </div>
              <span className="text-[10px] tracking-tight leading-none mt-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
