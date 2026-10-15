import { generateUtilityClass } from "./utility-classes";

/** Resolve internal selectors and slot names through the configured class generator. */
export function resolveMuiClassName(value: string): string {
  return value.replace(
    /\b(Mui[A-Z]\w*)-(\w+)\b/g,
    (_, component: string, slot: string) =>
      generateUtilityClass(component, slot),
  );
}
