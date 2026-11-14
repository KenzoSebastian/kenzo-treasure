"use client";

import * as React from "react";

/**
 * Hook hitung mundur (countdown) dalam detik, berguna untuk indikator Undo
 * soft-delete 5 detik.
 */
export function useCountdown(initialSeconds: number = 5) {
  const [secondsLeft, setSecondsLeft] = React.useState(initialSeconds);
  const [isRunning, setIsRunning] = React.useState(false);

  React.useEffect(() => {
    if (!isRunning || secondsLeft <= 0) {
      if (secondsLeft <= 0) setIsRunning(false);
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, secondsLeft]);

  const start = React.useCallback(
    (customSeconds?: number) => {
      setSecondsLeft(customSeconds ?? initialSeconds);
      setIsRunning(true);
    },
    [initialSeconds]
  );

  const stop = React.useCallback(() => {
    setIsRunning(false);
  }, []);

  return {
    secondsLeft,
    isRunning,
    start,
    stop,
  };
}
