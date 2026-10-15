"use client";

import * as React from "react";
import { DashboardErrorBoundary } from "@/components/layout/DashboardErrorBoundary";

export default function ErrorBoundaryPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Dashboard error boundary triggered:", error);
  }, [error]);

  return <DashboardErrorBoundary error={error} reset={reset} />;
}
