import {
  createEffect,
  createMemo,
  createUniqueId,
  onCleanup,
  untrack,
} from "solid-js";
import { createSvgIcon } from "./display";
import type { JSX } from "@solidjs/web";
import { setRef } from "./core";
import { generateUtilityClass } from "./utility-classes";
export { createSvgIcon };
export {
  useControlled,
  useControlled as unstable_useControlled,
  setRef,
} from "./core";
export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
export function debounce<T extends (...args: never[]) => unknown>(
  fn: T,
  wait = 166,
): T & { clear(): void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const result = function (this: unknown, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  } as T & { clear(): void };
  result.clear = () => {
    if (timer) clearTimeout(timer);
  };
  return result;
}
export function ownerDocument(node?: Node | null): Document {
  return node?.ownerDocument ?? document;
}
export function ownerWindow(node?: Node | null): Window {
  return ownerDocument(node).defaultView ?? window;
}
export function useForkRef<T>(...refs: unknown[]): (value: T) => void {
  return (value) => refs.forEach((ref) => setRef(ref, value));
}
export function unstable_useId(id?: string): string {
  return id ?? createUniqueId();
}
export function useEventCallback<T extends (...args: never[]) => unknown>(
  callback: () => T,
): T {
  return ((...args: Parameters<T>) => untrack(() => callback()(...args))) as T;
}
export function useIsFocusVisible() {
  const isFocusVisibleRef = { current: false };
  return {
    isFocusVisibleRef,
    onBlur: (_event: FocusEvent) => {
      const wasFocusVisible = isFocusVisibleRef.current;
      isFocusVisibleRef.current = false;
      return wasFocusVisible;
    },
    onFocus: (event: FocusEvent) => {
      isFocusVisibleRef.current = (event.target as Element).matches(
        ":focus-visible",
      );
      return isFocusVisibleRef.current;
    },
    ref: (_element: HTMLElement) => {},
  };
}
export function mergeSlotProps<
  A extends Record<string, unknown>,
  B extends Record<string, unknown>,
>(
  external: A | ((state: Record<string, unknown>) => A) | undefined,
  defaults: B,
): A & B {
  const merge = (a: A | undefined) =>
    ({
      ...defaults,
      ...a,
      class: [defaults.class, defaults.className, a?.class, a?.className],
      style: { ...(defaults.style as object), ...(a?.style as object) },
      sx: [defaults.sx, a?.sx],
    }) as unknown as A & B;
  return typeof external === "function"
    ? (((state: Record<string, unknown>) =>
        merge(external(state))) as unknown as A & B)
    : merge(external);
}
export function unstable_useEnhancedEffect(
  compute: () => unknown,
  effect: (value: unknown) => void | (() => void),
) {
  return createEffect(compute, effect);
}
export type OverridableStringUnion<
  T extends string,
  U extends Record<string, boolean> = {},
> =
  | Exclude<T, { [K in keyof U]: U[K] extends false ? K : never }[keyof U]>
  | Extract<{ [K in keyof U]: U[K] extends true ? K : never }[keyof U], string>;
export type * from "./types";

export function createChainedFunction<T extends (...args: never[]) => unknown>(
  ...callbacks: (T | undefined | null)[]
): T {
  return function (this: unknown, ...args: Parameters<T>) {
    for (const callback of callbacks) callback?.apply(this, args);
  } as T;
}
export function getActiveElement(
  root: Document | ShadowRoot = document,
): Element | null {
  let current = root.activeElement;
  while (current?.shadowRoot?.activeElement)
    current = current.shadowRoot.activeElement;
  return current;
}
export function isMuiElement(element: unknown, names: string[]): boolean {
  if (typeof Element !== "undefined" && element instanceof Element)
    return names.some((name) =>
      element.classList.contains(generateUtilityClass(`Mui${name}`, "root")),
    );
  return (
    typeof element === "function" &&
    names.includes((element as unknown as { muiName: string }).muiName)
  );
}
export function unstable_memoTheme<T>(
  fn: (props: { theme: import("./theme").Theme }) => T,
) {
  let previous: import("./theme").Theme | undefined;
  let value: T;
  return (props: { theme: import("./theme").Theme }) => {
    if (props.theme !== previous) {
      previous = props.theme;
      value = fn(props);
    }
    return value;
  };
}

export {
  deprecatedPropType,
  requirePropFactory,
  unsupportedProp,
} from "./validation";
export type { PropTypeValidator } from "./validation";
