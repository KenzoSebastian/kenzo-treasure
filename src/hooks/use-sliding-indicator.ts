"use client";

import * as React from "react";

export interface SlidingIndicatorMetrics {
  left: number;
  width: number;
}

export interface UseSlidingIndicatorOptions {
  activeValue: string;
  recalculateTrigger?: unknown;
}

/**
 * Hook pengukur posisi & lebar tab aktif untuk animasi indikator geser horizontal
 * (`translate3d` + `width`) yang mendukung `ResizeObserver`, `document.fonts?.ready`,
 * dan `prefers-reduced-motion`.
 */
export function useSlidingIndicator({
  activeValue,
  recalculateTrigger,
}: UseSlidingIndicatorOptions) {
  const containerRef = React.useRef<HTMLElement | null>(null);
  const itemRefs = React.useRef<Map<string, HTMLElement>>(new Map());
  const [metrics, setMetrics] = React.useState<SlidingIndicatorMetrics | null>(
    null
  );
  const [prefersReducedMotion, setPrefersReducedMotion] =
    React.useState(false);

  const measure = React.useCallback(() => {
    const container = containerRef.current;
    const activeEl = itemRefs.current.get(activeValue);
    if (!container || !activeEl) {
      return;
    }

    const width = activeEl.offsetWidth;
    const left = activeEl.offsetLeft;

    if (width > 0) {
      setMetrics((prev) => {
        if (prev && prev.left === left && prev.width === width) {
          return prev;
        }
        return { left, width };
      });
    }
  }, [activeValue]);

  const registerItem = React.useCallback(
    (value: string) => (node: HTMLElement | null) => {
      if (node) {
        itemRefs.current.set(value, node);
      } else {
        itemRefs.current.delete(value);
      }
    },
    []
  );

  // Use useLayoutEffect on client, fallback to useEffect on SSR
  const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

  useIsomorphicLayoutEffect(() => {
    measure();
  }, [measure, recalculateTrigger]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (mediaQuery) {
      setPrefersReducedMotion(mediaQuery.matches);
      const handleChange = (e: MediaQueryListEvent) =>
        setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener?.("change", handleChange);

      return () => {
        mediaQuery.removeEventListener?.("change", handleChange);
      };
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const rafId = window.requestAnimationFrame(() => {
      measure();
    });

    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        measure();
      }).catch(() => {});
    }

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") {
      return () => window.cancelAnimationFrame(rafId);
    }

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(container);
    for (const el of itemRefs.current.values()) {
      observer.observe(el);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [measure, recalculateTrigger]);

  const hasMeasured = metrics !== null && metrics.width > 0;

  const indicatorStyle: React.CSSProperties = hasMeasured
    ? {
        width: `${metrics.width}px`,
        transform: `translate3d(${metrics.left}px, 0, 0)`,
      }
    : {
        opacity: 0,
        pointerEvents: "none",
      };

  return {
    containerRef,
    registerItem,
    metrics,
    hasMeasured,
    prefersReducedMotion,
    indicatorStyle,
    remeasure: measure,
  };
}
