"use client";

import { useEffect, useState } from "react";

export function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = (options?.root as T | null) ?? null;
    // NOTE: This hook expects caller to handle element refs via callback.
    // Kept for future compatibility; current implementation is not used.
    void el;
  }, [options]);

  return { inView };
}

