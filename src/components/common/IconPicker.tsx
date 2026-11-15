"use client";

import * as React from "react";
import {
  CATEGORY_ICON_OPTIONS,
  getCategoryIconLabel,
  resolveCategoryIconKey,
  type CategoryGroup,
  type CategoryIconKey,
} from "@/lib/category-icons";
import { cn } from "@/lib/utils";

export interface IconPickerProps {
  value?: string | null;
  onChange: (key: CategoryIconKey) => void;
  fallbackGroup?: CategoryGroup;
  label?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Komponen pemilih ikon 36 opsi kurasi `lucide-react` dengan ergonomi sentuh (`min-h-11`)
 * dan grid responsif simetris 6x6 (`grid-cols-4 min-[380px]:grid-cols-6`).
 */
export function IconPicker({
  value,
  onChange,
  fallbackGroup = "kebutuhan",
  label,
  disabled = false,
  className,
}: IconPickerProps) {
  const normalizedKey = resolveCategoryIconKey(value, fallbackGroup, null);
  const selectedLabel = getCategoryIconLabel(normalizedKey, fallbackGroup);

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <p className="text-xs font-medium text-foreground">{label}</p>
      ) : null}
      <div
        role="radiogroup"
        aria-label={label ?? "Pilih ikon"}
        className="grid grid-cols-4 min-[380px]:grid-cols-6 gap-1.5"
      >
        {CATEGORY_ICON_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = normalizedKey === option.key;
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={option.label}
              title={option.label}
              disabled={disabled}
              onClick={() => onChange(option.key)}
              className={cn(
                "flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl border p-1.5 text-[10px] font-medium transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none",
                isSelected
                  ? "border-foreground bg-foreground text-background shadow-2xs"
                  : "border-border/70 bg-card text-muted-foreground hover:border-foreground/40 hover:bg-muted/40 hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="w-full truncate text-center leading-tight">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Ikon terpilih:{" "}
        <span className="font-semibold text-foreground">{selectedLabel}</span>
      </p>
    </div>
  );
}
