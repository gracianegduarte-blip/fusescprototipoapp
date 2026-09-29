import type { CSSProperties } from "react";
import type { Theme } from "../shared";

export default function Skeleton({ theme, className = "", style }: { theme: Theme; className?: string; style?: CSSProperties }) {
  return (
    <div aria-hidden="true" className={`animate-pulse rounded-xl ${className}`}
      style={{ background: theme.border, ...style }} />
  );
}
