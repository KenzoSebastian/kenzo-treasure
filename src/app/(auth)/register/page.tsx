"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { register } from "@/actions/auth";
import { registerSchema } from "@/schemas/auth.schema";

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [formData, setFormData] = React.useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = React.useState<{
    fullName?: string;
    email?: string;
    password?: string;
    form?: string;
  }>({});

  function handleInputChange(
    field: "fullName" | "email" | "password",
    value: string
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Hapus error spesifik field saat pengguna mulai mengetik ulang
    if (errors[field] || errors.form) {
      setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 1. Validasi awal di client via Zod schema
    const validation = registerSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors({
        fullName: fieldErrors.fullName?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    setErrors({});

    startTransition(async () => {
      const result = await register(formData);

      if (!result.success) {
        if (result.fieldErrors) {
          setErrors({
            fullName: result.fieldErrors.fullName?.[0],
            email: result.fieldErrors.email?.[0],
            password: result.fieldErrors.password?.[0],
          });
        } else {
          setErrors({
            form: result.error,
          });
        }
        return;
      }

      toast.success("Akun berhasil didaftarkan! Mengalihkan ke dashboard...");
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide text-muted-foreground">
            Kenzo Treasury
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">Daftar Akun Baru</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Mulai kelola finansial mandiri bulananmu.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {errors.form && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
              {errors.form}
            </div>
          )}

          <div>
            <label
              htmlFor="fullName"
              className="block text-xs font-medium text-foreground mb-1"
            >
              Nama Lengkap
            </label>
            <input
              id="fullName"
              type="text"
              disabled={isPending}
              placeholder="Kenzo Sebastian"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              className={`w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors ${
                errors.fullName
                  ? "border-destructive focus:ring-destructive"
                  : "border-border focus:ring-primary"
              }`}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-destructive">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-foreground mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              disabled={isPending}
              placeholder="nama@email.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors ${
                errors.email
                  ? "border-destructive focus:ring-destructive"
                  : "border-border focus:ring-primary"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-foreground mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              disabled={isPending}
              placeholder="Minimal 6 karakter"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={`w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors ${
                errors.password
                  ? "border-destructive focus:ring-destructive"
                  : "border-border focus:ring-primary"
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Mendaftarkan..." : "Daftar"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
