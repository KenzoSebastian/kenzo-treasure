import { revalidatePath } from "next/cache";

/**
 * Helper terpusat untuk merevalidasi seluruh rute di bawah layout `/dashboard`
 * (`/dashboard`, `/dashboard/vault`, `/dashboard/wishlists`, `/dashboard/analytics`, `/dashboard/settings`)
 * sekaligus rute `/onboarding`.
 */
export function revalidateDashboardRoutes(): void {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/onboarding");
}
