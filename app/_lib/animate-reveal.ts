"use client";

export type RevealOptions = {
  delayMs?: number;
};

export function getRevealStyle({ delayMs = 0 }: RevealOptions = {}) {
  return {
    opacity: 0,
    transform: "translateY(10px)",
    transitionProperty: "transform, opacity",
    transitionDuration: "500ms",
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
    transitionDelay: `${delayMs}ms`,
  } as const;
}

export function getRevealActiveStyle() {
  return {
    opacity: 1,
    transform: "translateY(0px)",
  } as const;
}

