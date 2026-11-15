import * as React from "react";
import {
  getCategoryIconComponent,
  type CategoryGroup,
} from "@/lib/category-icons";
import { cn } from "@/lib/utils";

export interface AppCategoryIconProps {
  iconKey?: string | null;
  group?: CategoryGroup;
  liabilityId?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "badge" | "inline";
  className?: string;
}

const BADGE_SIZE_CLASSES: Record<
  NonNullable<AppCategoryIconProps["size"]>,
  { box: string; icon: string }
> = {
  xs: { box: "size-6 rounded-md", icon: "size-3.5" },
  sm: { box: "size-8 rounded-lg", icon: "size-4" },
  md: { box: "size-9 rounded-xl", icon: "size-4.5" },
  lg: { box: "size-11 rounded-xl", icon: "size-5" },
};

const INLINE_SIZE_CLASSES: Record<
  NonNullable<AppCategoryIconProps["size"]>,
  string
> = {
  xs: "size-3.5",
  sm: "size-4",
  md: "size-4.5",
  lg: "size-5",
};

/**
 * Komponen ikon pos anggaran, cicilan, dan wishlist terstandarisasi berbasis `lucide-react`.
 * Mendukung mode `"badge"` (kotak bertema grup/cicilan) dan `"inline"` (ikon SVG langsung).
 */
export function AppCategoryIcon({
  iconKey,
  group = "kebutuhan",
  liabilityId = null,
  size = "sm",
  variant = "badge",
  className,
}: AppCategoryIconProps) {
  const IconComponent = getCategoryIconComponent(iconKey, group, liabilityId);

  if (variant === "inline") {
    return (
      <IconComponent
        aria-hidden="true"
        className={cn(
          "shrink-0",
          INLINE_SIZE_CLASSES[size],
          className
        )}
      />
    );
  }

  let toneClasses =
    "bg-muted text-foreground/80 border border-border/60";

  if (liabilityId) {
    toneClasses =
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
  } else if (group === "pos_wajib") {
    toneClasses =
      "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20";
  } else if (group === "uang_bebas_tabungan") {
    toneClasses =
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
  }

  const sizeConfig = BADGE_SIZE_CLASSES[size];

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center transition-colors",
        sizeConfig.box,
        toneClasses,
        className
      )}
    >
      <IconComponent className={cn("shrink-0", sizeConfig.icon)} />
    </span>
  );
}
