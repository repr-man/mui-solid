import { createMemo } from "solid-js";
import type { Accessor } from "solid-js";
import { useMediaQuery, useTheme } from "./theme";

export type ReducedMotionMode = "never" | "system" | "always";
export interface Motion {
  reducedMotion: ReducedMotionMode;
}
export interface MotionOptions {
  reducedMotion?: ReducedMotionMode;
}

/** Creates the motion policy, preserving MUI's opt-in default. */
export function createMotion(options: MotionOptions = {}): Motion {
  return { reducedMotion: options.reducedMotion ?? "never" };
}

/** @internal Observe the theme policy and an optional component override. */
export function useReducedMotion(
  disable?: Accessor<boolean | undefined>,
): Accessor<boolean> {
  const theme = useTheme();
  // The initial server value is false. An explicit always policy is resolved
  // independently so it remains identical during server rendering and hydration.
  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)",
  );
  return createMemo(
    () =>
      !disable?.() &&
      (theme.motion.reducedMotion === "always" ||
        (theme.motion.reducedMotion === "system" && prefersReducedMotion())),
  );
}
