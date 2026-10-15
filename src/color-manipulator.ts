/* eslint-disable @typescript-eslint/naming-convention */

export type ColorFormat = "rgb" | "rgba" | "hsl" | "hsla" | "color";
export type SupportedColorSpace =
  "srgb" | "display-p3" | "a98-rgb" | "prophoto-rgb" | "rec-2020";
export interface ColorObject {
  type: ColorFormat;
  values: [number, number, number] | [number, number, number, number | string];
  colorSpace?: SupportedColorSpace;
}

const supportedTypes = ["rgb", "rgba", "hsl", "hsla", "color"];
const supportedSpaces: SupportedColorSpace[] = [
  "srgb",
  "display-p3",
  "a98-rgb",
  "prophoto-rgb",
  "rec-2020",
];

/** Returns a number limited to the given range. */
function clamp(value: number, min = 0, max = 1): number {
  return Math.min(Math.max(value, min), max);
}

/** Converts a color from CSS hex format to CSS rgb format. */
export function hexToRgb(color: string): string {
  color = color.slice(1);
  const re = new RegExp(`.{1,${color.length >= 6 ? 2 : 1}}`, "g");
  let colors: string[] | null = color.match(re);
  if (colors && colors[0].length === 1) colors = colors.map((n) => n + n);
  return colors
    ? `rgb${colors.length === 4 ? "a" : ""}(${colors
        .map((n, index) =>
          index < 3
            ? parseInt(n, 16)
            : Math.round((parseInt(n, 16) / 255) * 1000) / 1000,
        )
        .join(", ")})`
    : "";
}

function unsupportedColor(color: string): Error {
  return new Error(
    `MUI: Unsupported \`${color}\` color.\nThe following formats are supported: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color().`,
  );
}

/**
 * Returns an object with the type and values of a color.
 *
 * Note: Does not support rgb % values.
 */
export function decomposeColor(input: string | ColorObject): ColorObject {
  // Idempotent
  if (typeof input !== "string") return input;
  if (input.charAt(0) === "#") return decomposeColor(hexToRgb(input));
  const marker = input.indexOf("(");
  const type = input.substring(0, marker) as ColorFormat;
  if (!supportedTypes.includes(type)) throw unsupportedColor(input);
  let values: string[] | string = input.substring(marker + 1, input.length - 1);
  let colorSpace: string | undefined;
  if (type === "color") {
    values = values.split(" ");
    colorSpace = values.shift();
    if (values.length === 4 && values[3].charAt(0) === "/")
      values[3] = values[3].slice(1);
    if (!supportedSpaces.includes(colorSpace as SupportedColorSpace)) {
      throw new Error(
        `MUI: unsupported \`${colorSpace}\` color space.\nThe following color spaces are supported: srgb, display-p3, a98-rgb, prophoto-rgb, rec-2020.`,
      );
    }
  } else {
    values = values.split(",");
  }
  return {
    type,
    values: (values as string[]).map((value) =>
      parseFloat(value),
    ) as ColorObject["values"],
    ...(colorSpace ? { colorSpace: colorSpace as SupportedColorSpace } : {}),
  };
}

/** Returns the channels of a color in a form suitable for rgba() or hsla(). */
export function colorChannel(color: string): string {
  const decomposed = decomposeColor(color);
  return decomposed.values
    .slice(0, 3)
    .map((value, index) =>
      decomposed.type.includes("hsl") && index !== 0 ? `${value}%` : value,
    )
    .join(" ");
}

/** Converts a color object with type and values to a string. */
export function recomposeColor(color: ColorObject): string {
  const { type, colorSpace } = color;
  let values: Array<number | string> = [...color.values];
  if (type.includes("rgb")) {
    // Only convert the first 3 values to int (i.e. not alpha)
    values = values.map((value, index) =>
      index < 3 ? parseInt(String(value), 10) : value,
    );
  } else if (type.includes("hsl")) {
    values[1] = `${values[1]}%`;
    values[2] = `${values[2]}%`;
  }
  const output = type.includes("color")
    ? `${colorSpace} ${values.join(" ")}`
    : values.join(", ");
  return `${type}(${output})`;
}

function intToHex(value: number): string {
  const hex = value.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
}

/** Converts a color from CSS rgb format to CSS hex format. */
export function rgbToHex(color: string): string {
  // Idempotent
  if (color.startsWith("#")) return color;
  const { values } = decomposeColor(color);
  return `#${values.map((value, index) => intToHex(index === 3 ? Math.round(255 * Number(value)) : Number(value))).join("")}`;
}

/** Converts a color from hsl format to rgb format. */
export function hslToRgb(input: string | ColorObject): string {
  const color = decomposeColor(input);
  const [h, saturation, lightness] = color.values;
  const s = Number(saturation) / 100;
  const l = Number(lightness) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number, k = (n + Number(h) / 30) % 12) =>
    l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  const type = color.type === "hsla" ? "rgba" : "rgb";
  const values: ColorObject["values"] = [
    Math.round(f(0) * 255),
    Math.round(f(8) * 255),
    Math.round(f(4) * 255),
  ];
  if (color.type === "hsla") values.push(Number(color.values[3]));
  return recomposeColor({ type, values });
}

/** Relative brightness normalized from 0 (black) to 1 (white). */
export function getLuminance(input: string | ColorObject): number {
  const color = decomposeColor(input);
  let rgb: number[] =
    color.type === "hsl" || color.type === "hsla"
      ? decomposeColor(hslToRgb(color)).values.slice(0, 3).map(Number)
      : color.values.slice(0, 3).map(Number);
  rgb = rgb.map((value) => {
    if (color.type !== "color") value /= 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return Number(
    (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]).toFixed(3),
  );
}

/** Calculates the WCAG contrast ratio between two colors. */
export function getContrastRatio(
  foreground: string,
  background: string,
): number {
  const lumA = getLuminance(foreground);
  const lumB = getLuminance(background);
  return (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05);
}

/** Sets the absolute transparency of a color, replacing any existing alpha. */
export function alpha(input: string, value: number): string {
  const color = decomposeColor(input);
  value = clamp(value);
  if (color.type === "rgb" || color.type === "hsl") color.type += "a";
  if (color.type === "color") color.values[3] = `/${value}`;
  else color.values[3] = value;
  return recomposeColor(color);
}

/** Darkens a color by the supplied coefficient. */
export function darken(input: string, coefficient: number): string {
  const color = decomposeColor(input);
  coefficient = clamp(coefficient);
  if (color.type.includes("hsl"))
    color.values[2] = Number(color.values[2]) * (1 - coefficient);
  else if (color.type.includes("rgb") || color.type.includes("color")) {
    for (let index = 0; index < 3; index += 1)
      color.values[index] = Number(color.values[index]) * (1 - coefficient);
  }
  return recomposeColor(color);
}

/** Lightens a color by the supplied coefficient. */
export function lighten(input: string, coefficient: number): string {
  const color = decomposeColor(input);
  coefficient = clamp(coefficient);
  if (color.type.includes("hsl"))
    color.values[2] =
      Number(color.values[2]) + (100 - Number(color.values[2])) * coefficient;
  else if (color.type.includes("rgb")) {
    for (let index = 0; index < 3; index += 1)
      color.values[index] =
        Number(color.values[index]) +
        (255 - Number(color.values[index])) * coefficient;
  } else if (color.type.includes("color")) {
    for (let index = 0; index < 3; index += 1)
      color.values[index] =
        Number(color.values[index]) +
        (1 - Number(color.values[index])) * coefficient;
  }
  return recomposeColor(color);
}

/** Darkens light colors and lightens dark colors. */
export function emphasize(color: string, coefficient = 0.15): string {
  return getLuminance(color) > 0.5
    ? darken(color, coefficient)
    : lighten(color, coefficient);
}

/** Blends an RGB overlay over an RGB background. */
export function blend(
  background: string,
  overlay: string,
  opacity: number,
  gamma = 1,
): string {
  const blendChannel = (base: number, over: number) =>
    Math.round(
      (base ** (1 / gamma) * (1 - opacity) + over ** (1 / gamma) * opacity) **
        gamma,
    );
  const backgroundColor = decomposeColor(background);
  const overlayColor = decomposeColor(overlay);
  return recomposeColor({
    type: "rgb",
    values: [0, 1, 2].map((index) =>
      blendChannel(
        Number(backgroundColor.values[index]),
        Number(overlayColor.values[index]),
      ),
    ) as ColorObject["values"],
  });
}

/** Safe channel conversion for user supplied palette colors. */
export function private_safeColorChannel(
  color: string,
  warning?: string,
): string {
  try {
    return colorChannel(color);
  } catch {
    if (warning) console.warn(warning);
    return color;
  }
}
/** Safe alpha transform; unresolved CSS colors use a CSS color-mix expression. */
export function private_safeAlpha(
  color: string,
  value: number,
  warning?: string,
): string {
  try {
    return alpha(color, value);
  } catch {
    if (/^(var\(|color-mix\(|currentColor$|inherit$)/i.test(color.trim()))
      return `color-mix(in srgb, ${color.trim() === "inherit" ? "currentColor" : color} ${clamp(value) * 100}%, transparent)`;
    if (warning) console.warn(warning);
    return color;
  }
}
/** Safe darkening transform; unresolved CSS colors use a CSS color-mix expression. */
export function private_safeDarken(
  color: string,
  coefficient: number,
  warning?: string,
): string {
  try {
    return darken(color, coefficient);
  } catch {
    if (/^(var\(|color-mix\(|currentColor$|inherit$)/i.test(color.trim()))
      return `color-mix(in srgb, ${color.trim() === "inherit" ? "currentColor" : color} ${(1 - clamp(coefficient)) * 100}%, black)`;
    if (warning) console.warn(warning);
    return color;
  }
}
/** Safe lightening transform; unresolved CSS colors use a CSS color-mix expression. */
export function private_safeLighten(
  color: string,
  coefficient: number,
  warning?: string,
): string {
  try {
    return lighten(color, coefficient);
  } catch {
    if (/^(var\(|color-mix\(|currentColor$|inherit$)/i.test(color.trim()))
      return `color-mix(in srgb, ${color.trim() === "inherit" ? "currentColor" : color} ${(1 - clamp(coefficient)) * 100}%, white)`;
    if (warning) console.warn(warning);
    return color;
  }
}
/** Safe emphasis transform when the input's luminance cannot be evaluated. */
export function private_safeEmphasize(
  color: string,
  coefficient = 0.15,
  warning?: string,
): string {
  try {
    return emphasize(color, coefficient);
  } catch {
    if (warning) console.warn(warning);
    return color;
  }
}
