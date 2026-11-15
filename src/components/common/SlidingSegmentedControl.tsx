"use client";

import * as React from "react";
import { useSlidingIndicator } from "@/hooks/use-sliding-indicator";
import { cn } from "@/lib/utils";

export interface SlidingSegmentOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  /**
   * Kelas warna khusus saat item aktif (misal hijau untuk Setor, amber untuk Tarik).
   * Bila dikosongkan, menggunakan permukaan standar `bg-background text-foreground shadow-xs`.
   */
  activeClassName?: string;
  /**
   * Kelas teks khusus saat aktif (opsional jika indikator pill sudah mengatur teks).
   */
  activeTextClassName?: string;
}

export interface SlidingSegmentedControlProps<T extends string = string> {
  options: SlidingSegmentOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  role?: "tablist" | "radiogroup";
  ariaLabel?: string;
  variant?: "pill" | "rounded";
  size?: "sm" | "md";
  fullWidth?: boolean;
  recalculateTrigger?: unknown;
  className?: string;
}

/**
 * Komponen Segmented Control & Tab Switcher dengan transisi geser horizontal (`duration-200`)
 * dan fallback CSS SSR anti-kedip ketika pengukuran DOM (`hasMeasured`) belum selesai.
 */
export function SlidingSegmentedControl<T extends string = string>({
  options,
  value,
  onValueChange,
  role = "tablist",
  ariaLabel,
  variant = "rounded",
  size = "md",
  fullWidth = false,
  recalculateTrigger,
  className,
}: SlidingSegmentedControlProps<T>) {
  const {
    containerRef,
    registerItem,
    hasMeasured,
    prefersReducedMotion,
    indicatorStyle,
  } = useSlidingIndicator({
    activeValue: value,
    recalculateTrigger,
  });

  const activeOption = options.find((opt) => opt.value === value);
  const itemRole = role === "radiogroup" ? "radio" : "tab";

  const radiusClass = variant === "pill" ? "rounded-full" : "rounded-xl";
  const indicatorRadiusClass =
    variant === "pill" ? "rounded-full" : "rounded-lg";

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
      }}
      role={role}
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex items-center border border-border/70 bg-muted/40 p-1 select-none",
        radiusClass,
        fullWidth && "flex w-full",
        className
      )}
    >
      {/* Indikator Geser Horizontal (muncul begitu koordinat DOM terukur) */}
      {hasMeasured && (
        <span
          aria-hidden="true"
          style={indicatorStyle}
          className={cn(
            "pointer-events-none absolute top-1 bottom-1 left-0 z-0",
            indicatorRadiusClass,
            !prefersReducedMotion &&
              "transition-[transform,width,background-color] duration-200 ease-out",
            activeOption?.activeClassName ?? "bg-background shadow-xs"
          )}
        />
      )}

      {options.map((option) => {
        const isActive = option.value === value;
        const fallbackActiveClass = !hasMeasured && isActive
          ? option.activeClassName ?? "bg-background text-foreground shadow-xs"
          : "";

        return (
          <button
            key={option.value}
            ref={registerItem(option.value)}
            type="button"
            role={itemRole}
            aria-selected={role === "tablist" ? isActive : undefined}
            aria-checked={role === "radiogroup" ? isActive : undefined}
            disabled={option.disabled}
            onClick={() => {
              if (!option.disabled && option.value !== value) {
                onValueChange(option.value);
              }
            }}
            className={cn(
              "relative z-10 inline-flex items-center justify-center gap-1.5 font-medium transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none",
              indicatorRadiusClass,
              fullWidth && "flex-1",
              size === "sm"
                ? "min-h-8 px-2.5 py-1 text-xs"
                : "min-h-9 px-3 py-1.5 text-xs",
              isActive
                ? cn(
                    "font-semibold text-foreground",
                    option.activeTextClassName
                  )
                : "text-muted-foreground hover:text-foreground",
              fallbackActiveClass
            )}
          >
            {option.icon}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
