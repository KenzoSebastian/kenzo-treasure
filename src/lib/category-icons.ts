/**
 * ==============================================================================
 * Kenzo Treasury — Curated Category, Liability & Wishlist Icon Registry (R1/R2)
 * ==============================================================================
 *
 * Menyediakan:
 * 1. 36 ikon kurasi `lucide-react` (6x6 grid) beserta label Bahasa Indonesia.
 * 2. Peta kompatibilitas mundur (fallback) dari string emoji historis database
 *    menuju key Lucide.
 * 3. Helper `stripEmojiPrefix` untuk membersihkan awalan/simbol emoji pada nama.
 * 4. Komponen ikon milestone Wishlist.
 */

import type { LucideIcon } from "lucide-react";
import {
  Award,
  Baby,
  Banknote,
  Briefcase,
  Camera,
  Car,
  Coffee,
  Coins,
  CreditCard,
  Dog,
  Flame,
  Fuel,
  Gift,
  GraduationCap,
  HeartHandshake,
  HeartPulse,
  HelpCircle,
  Home,
  Landmark,
  Monitor,
  Package,
  PiggyBank,
  Plane,
  Receipt,
  Rocket,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  Trophy,
  Tv,
  Users,
  Utensils,
  Wallet,
  Wifi,
  Wrench,
  Zap,
} from "lucide-react";

export const CATEGORY_ICON_KEYS = [
  "help-circle",
  "wallet",
  "banknote",
  "coins",
  "credit-card",
  "piggy-bank",
  "landmark",
  "receipt",
  "trending-up",
  "briefcase",
  "shield-check",
  "heart-handshake",
  "gift",
  "home",
  "zap",
  "wifi",
  "smartphone",
  "monitor",
  "camera",
  "wrench",
  "fuel",
  "car",
  "plane",
  "shopping-basket",
  "utensils",
  "coffee",
  "shopping-bag",
  "store",
  "graduation-cap",
  "heart-pulse",
  "baby",
  "dog",
  "users",
  "tv",
  "sparkles",
  "target",
  "package",
] as const;

export type CategoryIconKey = (typeof CATEGORY_ICON_KEYS)[number];

export type CategoryGroup =
  | "pos_wajib"
  | "kebutuhan"
  | "uang_bebas_tabungan"
  | string;

export interface CategoryIconOption {
  key: CategoryIconKey;
  label: string;
  Icon: LucideIcon;
  icon: LucideIcon;
}

const RAW_ICON_SPECS: ReadonlyArray<{
  key: CategoryIconKey;
  label: string;
  Icon: LucideIcon;
}> = [
  { key: "wallet", label: "Dompet", Icon: Wallet },
  { key: "banknote", label: "Tunai", Icon: Banknote },
  { key: "coins", label: "Koin/Receh", Icon: Coins },
  { key: "credit-card", label: "Kartu/Cicilan", Icon: CreditCard },
  { key: "piggy-bank", label: "Tabungan", Icon: PiggyBank },
  { key: "landmark", label: "Bank", Icon: Landmark },
  { key: "receipt", label: "Struk", Icon: Receipt },
  { key: "trending-up", label: "Investasi", Icon: TrendingUp },
  { key: "briefcase", label: "Gaji/Karir", Icon: Briefcase },
  { key: "shield-check", label: "Dana Darurat", Icon: ShieldCheck },
  { key: "heart-handshake", label: "Amal/Sosial", Icon: HeartHandshake },
  { key: "gift", label: "Hadiah", Icon: Gift },
  { key: "home", label: "Hunian", Icon: Home },
  { key: "zap", label: "Listrik", Icon: Zap },
  { key: "wifi", label: "Internet", Icon: Wifi },
  { key: "smartphone", label: "Gadget", Icon: Smartphone },
  { key: "monitor", label: "Komputer", Icon: Monitor },
  { key: "camera", label: "Fotografi", Icon: Camera },
  { key: "wrench", label: "Servis", Icon: Wrench },
  { key: "fuel", label: "Bensin", Icon: Fuel },
  { key: "car", label: "Transportasi", Icon: Car },
  { key: "plane", label: "Liburan", Icon: Plane },
  { key: "shopping-basket", label: "Belanja Dapur", Icon: ShoppingBasket },
  { key: "utensils", label: "Makan/Resto", Icon: Utensils },
  { key: "coffee", label: "Kopi", Icon: Coffee },
  { key: "shopping-bag", label: "Belanja", Icon: ShoppingBag },
  { key: "store", label: "Usaha/Toko", Icon: Store },
  { key: "graduation-cap", label: "Pendidikan", Icon: GraduationCap },
  { key: "heart-pulse", label: "Kesehatan", Icon: HeartPulse },
  { key: "baby", label: "Anak/Bayi", Icon: Baby },
  { key: "dog", label: "Hewan/Pet", Icon: Dog },
  { key: "users", label: "Keluarga", Icon: Users },
  { key: "tv", label: "Langganan", Icon: Tv },
  { key: "sparkles", label: "Hiburan", Icon: Sparkles },
  { key: "target", label: "Target/Impian", Icon: Target },
  { key: "package", label: "Lainnya", Icon: Package },
] as const;

export const CATEGORY_ICON_OPTIONS: readonly CategoryIconOption[] =
  RAW_ICON_SPECS.map((item) => ({
    ...item,
    icon: item.Icon,
  }));

export const CURATED_CATEGORY_ICONS = CATEGORY_ICON_OPTIONS;

const SPECIAL_ICON_SPECS: Record<string, CategoryIconOption> = {
  "help-circle": {
    key: "help-circle",
    label: "Pilih Ikon",
    Icon: HelpCircle,
    icon: HelpCircle,
  },
  "circle-help": {
    key: "help-circle",
    label: "Pilih Ikon",
    Icon: HelpCircle,
    icon: HelpCircle,
  },
};

export const CATEGORY_ICON_MAP: Record<CategoryIconKey, CategoryIconOption> = {
  ...Object.fromEntries(
    CATEGORY_ICON_OPTIONS.map((item) => [item.key, item])
  ),
  ...SPECIAL_ICON_SPECS,
} as Record<CategoryIconKey, CategoryIconOption>;

/**
 * Pemetaan kompatibilitas mundur dari kode poin / urutan karakter emoji lama
 * di database menuju 24 key Lucide kurasi (di-encode via Unicode escape agar
 * berkas sumber 100% bebas literal karakter emoji).
 */
const LEGACY_EMOJI_TO_ICON_KEY: Record<string, CategoryIconKey> = {
  "\u271D\uFE0F": "heart-handshake",
  "\u271D": "heart-handshake",
  "\uD83D\uDCF1": "smartphone",
  "\uD83D\uDC69\u200D\uD83D\uDC66": "users",
  "\uD83D\uDC75": "users",
  "\u26A1": "zap",
  "\u26FD": "fuel",
  "\uD83C\uDF7F": "wallet",
  "\uD83D\uDCB5": "banknote",
  "\uD83D\uDCB8": "banknote",
  "\uD83D\uDCB0": "banknote",
  "\uD83C\uDFAF": "target",
  "\uD83C\uDFC6": "target",
  "\uD83E\uDD47": "target",
  "\uD83E\uDD48": "target",
  "\uD83D\uDCE6": "package",
  "\uD83D\uDCC1": "package",
  "\uD83D\uDCB3": "credit-card",
  "\uD83D\uDCF7": "camera",
  "\uD83D\uDDA5\uFE0F": "monitor",
  "\uD83D\uDDA5": "monitor",
  "\uD83D\uDCBB": "monitor",
  "\uD83C\uDF54": "utensils",
  "\uD83D\uDE97": "car",
  "\uD83C\uDFE0": "home",
  "\uD83D\uDEE1\uFE0F": "shield-check",
  "\uD83D\uDEE1": "shield-check",
  "\uD83C\uDF81": "gift",
  "\uD83C\uDF89": "gift",
  "\u2728": "zap",
  "\uD83D\uDD25": "zap",
  "\uD83D\uDE80": "zap",
};

function resolveFallbackByGroup(
  groupOrFallback?: CategoryIconKey | CategoryGroup | null,
  liabilityId?: string | null
): CategoryIconKey {
  if (liabilityId) {
    return "credit-card";
  }
  if (!groupOrFallback) {
    return "wallet";
  }
  if (groupOrFallback in CATEGORY_ICON_MAP) {
    return groupOrFallback as CategoryIconKey;
  }
  if (groupOrFallback === "pos_wajib") {
    return "shield-check";
  }
  if (groupOrFallback === "uang_bebas_tabungan") {
    return "wallet";
  }
  return "wallet";
}

/**
 * Menormalkan input key ikon atau emoji historis menjadi `CategoryIconKey` yang valid.
 */
export function resolveCategoryIconKey(
  rawIcon?: string | null,
  groupOrFallback?: CategoryIconKey | CategoryGroup | null,
  liabilityId?: string | null
): CategoryIconKey {
  const fallback = resolveFallbackByGroup(groupOrFallback, liabilityId);
  if (!rawIcon) return fallback;
  const trimmed = rawIcon.trim();
  if (trimmed in CATEGORY_ICON_MAP) {
    return trimmed as CategoryIconKey;
  }
  if (trimmed in LEGACY_EMOJI_TO_ICON_KEY) {
    return LEGACY_EMOJI_TO_ICON_KEY[trimmed];
  }
  const withoutVs = trimmed.replace(/\uFE0F/g, "");
  if (withoutVs in LEGACY_EMOJI_TO_ICON_KEY) {
    return LEGACY_EMOJI_TO_ICON_KEY[withoutVs];
  }
  return fallback;
}

/**
 * Mengambil komponen ikon Lucide berdasarkan key atau string historis.
 */
export function getCategoryIconComponent(
  rawIcon?: string | null,
  groupOrFallback?: CategoryIconKey | CategoryGroup | null,
  liabilityId?: string | null
): LucideIcon {
  const key = resolveCategoryIconKey(rawIcon, groupOrFallback, liabilityId);
  return CATEGORY_ICON_MAP[key]?.Icon ?? Wallet;
}

/**
 * Mengambil label Bahasa Indonesia dari key ikon terpilih.
 */
export function getCategoryIconLabel(
  rawIcon?: string | null,
  groupOrFallback?: CategoryIconKey | CategoryGroup | null,
  liabilityId?: string | null
): string {
  const key = resolveCategoryIconKey(rawIcon, groupOrFallback, liabilityId);
  return CATEGORY_ICON_MAP[key]?.label ?? "Dompet";
}

/**
 * Menghapus seluruh karakter pikto/emoji, Zero-Width Joiner (\u200D), dan
 * Variation Selector-16 (\uFE0F) dari teks nama kategori/cicilan/wishlist.
 */
export function stripEmojiPrefix(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/[\p{Extended_Pictographic}\u200D\uFE0F]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export type WishlistMilestoneIconKey =
  | "target"
  | "sparkles"
  | "rocket"
  | "flame"
  | "zap"
  | "award"
  | "trophy";

const WISHLIST_MILESTONE_ICONS: Record<WishlistMilestoneIconKey, LucideIcon> = {
  target: Target,
  sparkles: Sparkles,
  rocket: Rocket,
  flame: Flame,
  zap: Zap,
  award: Award,
  trophy: Trophy,
};

export function getWishlistMilestoneIconComponent(
  key?: WishlistMilestoneIconKey | null
): LucideIcon {
  if (!key) return Target;
  return WISHLIST_MILESTONE_ICONS[key] ?? Target;
}
