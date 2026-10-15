import { createContext } from "solid-js";
import type { JSX } from "@solidjs/web";

/** Option source metadata is available before DOM mounting and during SSR. */
export interface SelectOptionSource {
  value: () => unknown;
  label: () => JSX.Element;
  disabled: () => boolean;
}
export interface SelectOptionRegistry {
  collectOnly: boolean;
  register(option: SelectOptionSource): void;
  options: SelectOptionSource[];
}
export const SelectOptionRegistryContext =
  createContext<SelectOptionRegistry | null>(null);
