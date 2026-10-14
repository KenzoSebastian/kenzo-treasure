import { getCurrentUser, logout } from "@/actions/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const userResult = await getCurrentUser();
  const user = userResult.success ? userResult.data : null;

  async function handleLogout() {
    "use server";
    await logout();
    redirect("/login");
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-4 rounded-xl border bg-card p-6 shadow-sm">
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide text-muted-foreground">
          Kenzo Treasury • Dashboard Workspace
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Selamat Datang, {user?.fullName || user?.email || "Pengguna"}!
        </h1>
        <p className="text-xs text-muted-foreground">
          Sesi terverifikasi Supabase Auth SSR via cookies.
        </p>
        {user && (
          <div className="rounded-md bg-muted p-2 text-left text-xs font-mono break-all space-y-1">
            <div><span className="text-muted-foreground">Email:</span> {user.email}</div>
            <div><span className="text-muted-foreground">User ID:</span> {user.id}</div>
          </div>
        )}

        <form action={handleLogout} className="pt-2">
          <button
            type="submit"
            className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
          >
            Keluar (Logout)
          </button>
        </form>
      </div>
    </main>
  );
}
