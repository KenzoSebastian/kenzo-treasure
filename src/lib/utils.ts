import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility cn() untuk menggabungkan nama class Tailwind CSS secara kondisional
 * dan mencegah duplikasi/konflik styling menggunakan tailwind-merge.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
