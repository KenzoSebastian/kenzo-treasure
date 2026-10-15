import * as React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export const metadata = {
  title: "Dashboard • Kenzo Treasury",
  description: "Panel kendali keuangan bulanan pribadi mandiri.",
};

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
