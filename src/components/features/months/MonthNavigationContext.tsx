"use client";

import * as React from "react";

export interface MonthNavigationContextValue {
  isSwitching: boolean;
  pendingMonthId: string | null;
  pendingMonthName: string | null;
  startMonthSwitch: (
    targetMonthId: string,
    targetMonthName: string | undefined,
    navigate: () => void
  ) => void;
  clearMonthSwitch: () => void;
}

const MonthNavigationContext =
  React.createContext<MonthNavigationContextValue | null>(null);

export interface MonthNavigationProviderProps {
  children: React.ReactNode;
  initialIsSwitching?: boolean;
  initialPendingMonthId?: string | null;
  initialPendingMonthName?: string | null;
}

/**
 * Provider terpusat untuk transisi instan skeleton (`0 ms`) saat pengguna berpindah
 * siklus bulan melalui `MonthSelector` atau `CreateMonthDialog`.
 */
export function MonthNavigationProvider({
  children,
  initialIsSwitching = false,
  initialPendingMonthId = null,
  initialPendingMonthName = null,
}: MonthNavigationProviderProps) {
  const [isPending, startTransition] = React.useTransition();
  const [manualSwitching, setManualSwitching] =
    React.useState(initialIsSwitching);
  const [pendingMonthId, setPendingMonthId] = React.useState<string | null>(
    initialPendingMonthId
  );
  const [pendingMonthName, setPendingMonthName] = React.useState<string | null>(
    initialPendingMonthName
  );
  const wasPendingRef = React.useRef(false);

  const clearMonthSwitch = React.useCallback(() => {
    setManualSwitching(false);
    setPendingMonthId(null);
    setPendingMonthName(null);
  }, []);

  // Auto-reset ketika transisi router selesai (baik berhasil, dibatalkan, maupun fallback)
  React.useEffect(() => {
    if (isPending) {
      wasPendingRef.current = true;
    } else if (wasPendingRef.current) {
      wasPendingRef.current = false;
      clearMonthSwitch();
    }
  }, [isPending, clearMonthSwitch]);

  const startMonthSwitch = React.useCallback(
    (
      targetMonthId: string,
      targetMonthName: string | undefined,
      navigate: () => void
    ) => {
      setManualSwitching(true);
      setPendingMonthId(targetMonthId);
      setPendingMonthName(targetMonthName ?? null);
      startTransition(() => {
        navigate();
      });
    },
    []
  );

  const isSwitching = manualSwitching || isPending;

  const value = React.useMemo<MonthNavigationContextValue>(
    () => ({
      isSwitching,
      pendingMonthId,
      pendingMonthName,
      startMonthSwitch,
      clearMonthSwitch,
    }),
    [
      isSwitching,
      pendingMonthId,
      pendingMonthName,
      startMonthSwitch,
      clearMonthSwitch,
    ]
  );

  return (
    <MonthNavigationContext.Provider value={value}>
      {children}
    </MonthNavigationContext.Provider>
  );
}

const FALLBACK_CONTEXT_VALUE: MonthNavigationContextValue = {
  isSwitching: false,
  pendingMonthId: null,
  pendingMonthName: null,
  startMonthSwitch: (_id, _name, navigate) => navigate(),
  clearMonthSwitch: () => {},
};

export function useMonthNavigation(): MonthNavigationContextValue {
  const ctx = React.useContext(MonthNavigationContext);
  return ctx ?? FALLBACK_CONTEXT_VALUE;
}
