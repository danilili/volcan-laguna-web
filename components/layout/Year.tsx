"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Current year, read on the client. With Cache Components enabled,
 * `new Date()` during prerender is a build error, so the server snapshot
 * uses the launch year and the client replaces it after hydration.
 */
export function Year({ fallback = 2026 }: { fallback?: number }) {
  const year = useSyncExternalStore(
    subscribe,
    () => new Date().getFullYear(),
    () => fallback,
  );
  return <>{year}</>;
}
