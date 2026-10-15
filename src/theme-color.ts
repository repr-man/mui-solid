import {
  alpha,
  darken,
  lighten,
  colorChannel,
  hslToRgb,
  private_safeColorChannel,
} from "./color-manipulator";
import type { Theme } from "./theme";

export type ColorCoefficient = number | string;

function coefficientToPercentage(coefficient: ColorCoefficient): string {
  return typeof coefficient === "number"
    ? `${(coefficient * 100).toFixed(0)}%`
    : `calc((${coefficient}) * 100%)`;
}

export function nativeMix(
  color: string,
  mixer: "#fff" | "#000" | "transparent",
  coefficient: ColorCoefficient,
  colorSpace = "oklch",
): string {
  return `color-mix(in ${colorSpace}, ${color}, ${mixer} ${coefficientToPercentage(coefficient)})`;
}

// Use the same name as the experimental CSS `contrast-color` function.
export function contrastColor(background: string): string {
  return `oklch(from ${background} var(--__l) 0 h / var(--__a))`;
}

const toRgb = (color: string): string =>
  color.startsWith("hsl") ? hslToRgb(color) : color;

// Replace color variables with their matching sRGB channel tokens. Preserve a
// fallback only when it can be converted to three valid sRGB channels.
function toChannelVar(_match: string, name: string, fallback = ""): string {
  const color = fallback.trim();
  if (color && !color.startsWith("color(")) {
    try {
      const channel = colorChannel(toRgb(color));
      if (channel.split(" ").length === 3 && !channel.includes("NaN"))
        return `var(--${name}Channel, ${channel})`;
    } catch {
      // A CSS variable or native color expression has no fixed sRGB channels.
    }
  }
  return `var(--${name}Channel)`;
}

// Legacy alpha accepts additive CSS coefficients by resolving their numeric
// terms, matching MUI's no-variable theme behavior.
function parseAddition(value: ColorCoefficient): number {
  if (!Number.isNaN(Number(value))) return Number(value);
  return (String(value).match(/\d*\.?\d+/g) ?? []).reduce(
    (sum, number) => sum + Number(number),
    0,
  );
}

export function attachColorManipulators(theme: Theme): void {
  theme.alpha = function themeAlpha(color, coefficient) {
    const current = this || theme;
    const value =
      typeof coefficient === "string" ? `calc(${coefficient})` : coefficient;
    if (current.colorSpace) return `oklch(from ${color} l c h / ${value})`;
    if (current.vars) {
      // `color()` channels are not sRGB; keep the color space and replace alpha.
      if (color.startsWith("color("))
        return color.replace(/\s*(?:\/[^)]*)?\)$/, ` / ${value})`);
      const usesVariables = color.includes("var(");
      const channels = usesVariables
        ? color.replace(
            /var\(--([^,\s)]+)(?:,((?:[^()]|\([^()]*\))+)\)|(?:,[^)]+)?\)+)/g,
            toChannelVar,
          )
        : private_safeColorChannel(toRgb(color));
      if (
        !usesVariables &&
        (channels.split(" ").length !== 3 || channels.includes("NaN"))
      )
        return `oklch(from ${color} l c h / ${value})`;
      return `rgba(${channels} / ${value})`;
    }
    try {
      return alpha(color, parseAddition(coefficient));
    } catch {
      return `oklch(from ${color} l c h / ${value})`;
    }
  };
  theme.lighten = function themeLighten(color, coefficient) {
    const current = this || theme;
    return current.colorSpace
      ? nativeMix(color, "#fff", coefficient, current.colorSpace)
      : lighten(color, Number(coefficient));
  };
  theme.darken = function themeDarken(color, coefficient) {
    const current = this || theme;
    return current.colorSpace
      ? nativeMix(color, "#000", coefficient, current.colorSpace)
      : darken(color, Number(coefficient));
  };
}
