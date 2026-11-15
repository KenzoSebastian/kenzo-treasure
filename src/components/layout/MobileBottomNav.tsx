"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  BarChart3,
  Settings,
} from "lucide-react";
import { useSlidingIndicator } from "@/hooks/use-sliding-indicator";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      href: "/dashboard/vault",
      label: "Brankas",
      icon: ShieldCheck,
      isActive: pathname.startsWith("/dashboard/vault"),
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
    {
      href: "/dashboard/settings",
      label: "Backup",
      icon: Settings,
      isActive: pathname.startsWith("/dashboard/settings"),
    },
  ];

  const activeHref =
    navItems.find((item) => item.isActive)?.href ?? "/dashboard";

  const {
    containerRef,
    registerItem,
    hasMeasured,
    prefersReducedMotion,
    indicatorStyle,
  } = useSlidingIndicator({
    activeValue: activeHref,
    recalculateTrigger: pathname,
  });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border/80 bg-background/95 backdrop-blur-md pb-[calc(env(safe-area-inset-bottom,0px)+0.35rem)] pt-1 px-2 shadow-lg"
      aria-label="Navigasi Bawah Ponsel"
    >
      <div
        ref={(node) => {
          containerRef.current = node;
        }}
        className="relative flex items-center justify-around gap-1"
      >
        {/* Indikator Garis Atas & Pill Halus Berbasis Sliding Indicator (R3) */}
        {hasMeasured && (
          <span
            aria-hidden="true"
            style={indicatorStyle}
            className={cn(
              "pointer-events-none absolute top-0 left-0 z-0 flex justify-center",
              !prefersReducedMotion &&
                "transition-[transform,width] duration-200 ease-out"
            )}
          >
            <span className="h-0.5 w-8 rounded-full bg-foreground" />
          </span>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <Link
              key={item.href}
              ref={registerItem(item.href)}
              href={item.href}
              className={cn(
                "relative z-10 flex flex-1 flex-col items-center justify-center min-h-12 min-w-12 py-1 px-1 rounded-xl transition-colors duration-200 select-none",
                active
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center size-8 rounded-full transition-colors duration-200",
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
