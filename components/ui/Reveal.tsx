"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Seconds. Use small steps (0.05–0.1) for staggered children. */
  delay?: number;
  /** Render as a different element (default div). */
  as?: "div" | "section" | "li" | "article" | "span";
  once?: boolean;
};

/**
 * Scroll reveal: opacity 0→1 and 12 px rise, 500 ms, soft ease.
 * Under prefers-reduced-motion it renders static (no transform, no fade).
 */
export function Reveal({ children, className, delay = 0, as = "div", once = true }: Props) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  if (reduce) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}
