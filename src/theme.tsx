import {
  alpha,
  lighten,
  darken,
  getContrastRatio,
  getLuminance,
  emphasize,
  hslToRgb,
} from "./color-manipulator";
import {
  attachColorManipulators,
  contrastColor,
  nativeMix,
} from "./theme-color";
import type { ColorCoefficient } from "./theme-color";
import type { Components as ThemeComponents } from "./component-types";
import { createColorSystem } from "./color-system";
import { createMotion } from "./motion";
import type { Motion, MotionOptions } from "./motion";
export type { Motion, MotionOptions, ReducedMotionMode } from "./motion";
import type {
  CssVarsPalette,
  ColorSystem,
  Opacity,
  Overlays,
} from "./color-system";
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  getOwner,
  onSettled,
  untrack,
  useContext,
} from "solid-js";
import type { JSX, ValidComponent, ComponentProps } from "@solidjs/web";
import { dynamic, isServer } from "@solidjs/web";
import createEmotion from "@emotion/css/create-instance";
import type { CSSObject, CSSInterpolation } from "@emotion/serialize";
import { serializeStyles } from "@emotion/serialize";
import { compile, serialize, stringify } from "stylis";
export type { CSSObject } from "@emotion/serialize";
export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl";
export type Responsive<T> =
  | T
  | readonly (T | null)[]
  | Partial<Record<Breakpoint, T>>;
export type SystemStyleObject = { [property: string]: unknown };
export type SxProps =
  | SystemStyleObject
  | ((theme: Theme) => SystemStyleObject)
  | readonly (SxProps | boolean | undefined | null)[];
export interface PaletteColor {
  main: string;
  light: string;
  dark: string;
  contrastText: string;
}
export interface Palette {
  mode: "light" | "dark";
  primary: PaletteColor;
  secondary: PaletteColor;
  error: PaletteColor;
  warning: PaletteColor;
  info: PaletteColor;
  success: PaletteColor;
  text: { primary: string; secondary: string; disabled: string };
  background: { default: string; paper: string };
  action: {
    active: string;
    hover: string;
    hoverOpacity: number;
    selected: string;
    selectedOpacity: number;
    disabled: string;
    disabledOpacity: number;
    disabledBackground: string;
    focus: string;
    focusOpacity: number;
    activatedOpacity: number;
  };
  divider: string;
  common: { black: string; white: string };
  grey: Record<string, string>;
  contrastThreshold: number;
  tonalOffset: number | { light: number; dark: number };
  getContrastText(color: string): string;
  augmentColor(options: {
    color: Partial<PaletteColor>;
    name?: string;
    mainShade?: number;
    lightShade?: number;
    darkShade?: number;
  }): PaletteColor;
}
export type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "subtitle1"
  | "subtitle2"
  | "body1"
  | "body2"
  | "button"
  | "caption"
  | "overline"
  | "inherit";
export type TypographyVariants = Record<TypographyVariant, CSSObject> & {
  fontFamily: string;
  fontSize: number;
  htmlFontSize: number;
  fontWeightLight: number;
  fontWeightRegular: number;
  fontWeightMedium: number;
  fontWeightBold: number;
  pxToRem(size: number): string;
};
export interface ComponentStyleArgs<
  P extends object = Record<string, unknown>,
  TTheme = Theme,
> {
  theme: TTheme;
  ownerState: P & Record<string, unknown>;
  [prop: string]: unknown;
}
export interface ComponentConfig<
  P extends object = Record<string, unknown>,
  TTheme = Theme,
  ClassKey extends string = string,
> {
  defaultProps?: Partial<P>;
  styleOverrides?: Partial<
    Record<
      ClassKey,
      | CSSInterpolation
      | ((args: ComponentStyleArgs<P, TTheme>) => CSSInterpolation)
    >
  >;
  variants?: {
    props: Partial<P> | ((props: P & Record<string, unknown>) => boolean);
    style:
      | CSSInterpolation
      | ((args: ComponentStyleArgs<P, TTheme>) => CSSInterpolation);
  }[];
}
export interface Theme {
  palette: Palette;
  typography: TypographyVariants;
  shape: { borderRadius: number };
  direction: "ltr" | "rtl";
  shadows: string[];
  spacing: (...values: (number | string)[]) => string;
  breakpoints: {
    keys: Breakpoint[];
    values: Record<Breakpoint, number>;
    unit: string;
    up(key: Breakpoint | number): string;
    down(key: Breakpoint | number): string;
    between(start: Breakpoint | number, end: Breakpoint | number): string;
    only(key: Breakpoint): string;
    not(key: Breakpoint): string;
  };
  transitions: {
    easing: Record<"easeInOut" | "easeOut" | "easeIn" | "sharp", string>;
    duration: Record<
      | "shortest"
      | "shorter"
      | "short"
      | "standard"
      | "complex"
      | "enteringScreen"
      | "leavingScreen",
      number
    >;
    create(
      props?: string | string[],
      options?: {
        duration?: number | string;
        easing?: string;
        delay?: number | string;
      },
    ): string;
    getAutoHeightDuration(height: number): number;
  };
  zIndex: {
    mobileStepper: number;
    fab: number;
    speedDial: number;
    appBar: number;
    drawer: number;
    modal: number;
    snackbar: number;
    tooltip: number;
  };
  components: ThemeComponents;
  mixins: { toolbar: CSSObject };
  focusVisible?: CSSObject | false;
  motion: Motion;
  alpha(color: string, coefficient: ColorCoefficient): string;
  lighten(color: string, coefficient: ColorCoefficient): string;
  darken(color: string, coefficient: ColorCoefficient): string;
  colorSpace?: string;
  nativeColor?: boolean;
  modularCssLayers?: boolean | string;
  vars?: ThemeVars;
  colorSchemes?: Partial<Record<PaletteMode, ColorSystem>>;
  opacity?: Opacity;
  overlays?: Overlays;
  defaultColorScheme?: PaletteMode;
  cssVarPrefix?: string;
  rootSelector?: string;
  colorSchemeSelector?: "media" | "class" | "data" | string;
  disableCssColorScheme?: boolean;
  getColorSchemeSelector?(mode: PaletteMode): string;
  applyStyles(mode: PaletteMode, styles: CSSObject): CSSObject;
  getCssVar(field: string, fallback?: string): string;
  generateStyleSheets(): CSSObject[];
  unstable_sx(sx: SxProps): CSSObject;
}
export type DeepPartial<T> = T extends
  | string
  | number
  | boolean
  | symbol
  | null
  | undefined
  ? T
  : T extends (...args: never[]) => unknown
    ? T
    : T extends readonly unknown[]
      ? T
      : T extends object
        ? { [K in keyof T]?: DeepPartial<T[K]> }
        : T;
export type ThemeOptions = Omit<
  DeepPartial<Theme>,
  "spacing" | "colorSchemes" | "focusVisible" | "motion"
> & {
  palette?: DeepPartial<Palette & CssVarsPalette>;
  motion?: MotionOptions;
  focusVisible?: boolean | CSSObject;
  shouldSkipGeneratingVar?: (keys: string[], value: string | number) => boolean;
  spacing?: number | number[] | ((value: number) => number | string);
  colorSchemes?: Partial<
    Record<
      PaletteMode,
      | boolean
      | {
          palette?: DeepPartial<Palette & CssVarsPalette>;
          opacity?: Partial<Opacity>;
          overlays?: Overlays;
        }
    >
  >;
  cssVariables?:
    | boolean
    | {
        cssVarPrefix?: string;
        rootSelector?: string;
        nativeColor?: boolean;
        colorSchemeSelector?: Theme["colorSchemeSelector"];
        disableCssColorScheme?: boolean;
        modularCssLayers?: boolean | string;
      };
  rootSelector?: string;
};
export type CssVarTree<T> = T extends string | number
  ? string
  : T extends (...args: never[]) => unknown
    ? never
    : T extends readonly unknown[]
      ? string[]
      : {
          [K in keyof T as T[K] extends (...args: never[]) => unknown
            ? never
            : K]: CssVarTree<T[K]>;
        };
export interface ThemeVars {
  palette: CssVarTree<Palette & CssVarsPalette>;
  opacity: CssVarTree<Opacity>;
  overlays: (string | undefined)[];
  shape: { borderRadius: string };
  shadows: string[];
  spacing: string;
  zIndex: CssVarTree<Theme["zIndex"]>;
}
export type CssVarsTheme = Theme & {
  vars: ThemeVars;
  palette: Palette & CssVarsPalette;
  opacity: Opacity;
  overlays: Overlays;
};
export type CssVarsThemeOptions = ThemeOptions;
function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) return value.map(cloneValue) as T;
  if (
    value &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  )
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key]) => !["__proto__", "constructor", "prototype"].includes(key),
        )
        .map(([key, value]) => [key, cloneValue(value)]),
    ) as T;
  return value;
}
export function deepmerge<T extends object>(target: T, source: object): T {
  const output = cloneValue(target) as Record<string, unknown>;
  // Plain target trees are already cloned. Merge into that private copy rather
  // than cloning each overlapping subtree again at every recursion level.
  return mergeInto(output, source, output !== target) as T;
}
function mergeInto(
  output: Record<string, unknown>,
  source: object,
  cloned = true,
): Record<string, unknown> {
  for (const [key, value] of Object.entries(source)) {
    if (["__proto__", "constructor", "prototype"].includes(key)) continue;
    const old = output[key];
    output[key] =
      value &&
      old &&
      Object.getPrototypeOf(value) === Object.prototype &&
      Object.getPrototypeOf(old) === Object.prototype
        ? mergeInto(
            (cloned && Object.hasOwn(output, key)
              ? old
              : cloneValue(old)) as Record<string, unknown>,
            value,
          )
        : cloneValue(value);
  }
  return output;
}
export function createSpacing(
  input: ThemeOptions["spacing"] = 8,
): Theme["spacing"] {
  return (...args) =>
    (args.length ? args : [1])
      .map((v) => {
        if (typeof v === "string") return v;
        const magnitude = Math.abs(v);
        const value =
          typeof input === "function"
            ? input(v)
            : Array.isArray(input)
              ? input[magnitude]
              : magnitude * input;
        if (value === undefined)
          throw new RangeError(`No spacing token for ${magnitude}`);
        return typeof value === "number"
          ? `${(typeof input === "function" ? 1 : Math.sign(v)) * value}px`
          : typeof input !== "function" && v < 0
            ? `calc(-1 * ${value})`
            : value;
      })
      .join(" ");
}
export const easing = {
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
};
export const duration = {
  shortest: 150,
  shorter: 200,
  short: 250,
  standard: 300,
  complex: 375,
  enteringScreen: 225,
  leavingScreen: 195,
};
const shadow = (...px: number[]) =>
  [0, 4, 8]
    .map(
      (start, i) =>
        `${px
          .slice(start, start + 4)
          .map((v) => `${v}px`)
          .join(" ")} rgba(0,0,0,${[0.2, 0.14, 0.12][i]})`,
    )
    .join(",");
// Material elevation values, preserved from MUI 9.5.0 (MIT).
export const shadows = [
  "none",
  shadow(0, 2, 1, -1, 0, 1, 1, 0, 0, 1, 3, 0),
  shadow(0, 3, 1, -2, 0, 2, 2, 0, 0, 1, 5, 0),
  shadow(0, 3, 3, -2, 0, 3, 4, 0, 0, 1, 8, 0),
  shadow(0, 2, 4, -1, 0, 4, 5, 0, 0, 1, 10, 0),
  shadow(0, 3, 5, -1, 0, 5, 8, 0, 0, 1, 14, 0),
  shadow(0, 3, 5, -1, 0, 6, 10, 0, 0, 1, 18, 0),
  shadow(0, 4, 5, -2, 0, 7, 10, 1, 0, 2, 16, 1),
  shadow(0, 5, 5, -3, 0, 8, 10, 1, 0, 3, 14, 2),
  shadow(0, 5, 6, -3, 0, 9, 12, 1, 0, 3, 16, 2),
  shadow(0, 6, 6, -3, 0, 10, 14, 1, 0, 4, 18, 3),
  shadow(0, 6, 7, -4, 0, 11, 15, 1, 0, 4, 20, 3),
  shadow(0, 7, 8, -4, 0, 12, 17, 2, 0, 5, 22, 4),
  shadow(0, 7, 8, -4, 0, 13, 19, 2, 0, 5, 24, 4),
  shadow(0, 7, 9, -4, 0, 14, 21, 2, 0, 5, 26, 4),
  shadow(0, 8, 9, -5, 0, 15, 22, 2, 0, 6, 28, 5),
  shadow(0, 8, 10, -5, 0, 16, 24, 2, 0, 6, 30, 5),
  shadow(0, 8, 11, -5, 0, 17, 26, 2, 0, 6, 32, 5),
  shadow(0, 9, 11, -5, 0, 18, 28, 2, 0, 7, 34, 6),
  shadow(0, 9, 12, -6, 0, 19, 29, 2, 0, 7, 36, 6),
  shadow(0, 10, 13, -6, 0, 20, 31, 3, 0, 8, 38, 7),
  shadow(0, 10, 13, -6, 0, 21, 33, 3, 0, 8, 40, 7),
  shadow(0, 10, 14, -6, 0, 22, 35, 3, 0, 8, 42, 7),
  shadow(0, 11, 14, -7, 0, 23, 36, 3, 0, 9, 44, 8),
  shadow(0, 11, 15, -7, 0, 24, 38, 3, 0, 9, 46, 8),
];
function createTypography(
  options: DeepPartial<TypographyVariants> = {},
): TypographyVariants {
  const fontFamily =
    options.fontFamily ?? '"Roboto", "Helvetica", "Arial", sans-serif';
  const light = options.fontWeightLight ?? 300,
    regular = options.fontWeightRegular ?? 400,
    medium = options.fontWeightMedium ?? 500,
    bold = options.fontWeightBold ?? 700;
  const fontSize = options.fontSize ?? 14;
  const htmlFontSize = options.htmlFontSize ?? 16;
  const pxToRem =
    options.pxToRem ??
    ((v: number) => `${(v / htmlFontSize) * (fontSize / 14)}rem`);
  const variant = (
    weight: number,
    size: number,
    lineHeight: number,
    tracking: number,
    uppercase = false,
  ): CSSObject => ({
    fontFamily,
    fontWeight: weight,
    fontSize: pxToRem(size),
    lineHeight,
    ...(fontFamily === '"Roboto", "Helvetica", "Arial", sans-serif'
      ? { letterSpacing: `${Math.round((tracking / size) * 1e5) / 1e5}em` }
      : {}),
    ...(uppercase ? { textTransform: "uppercase" } : {}),
  });
  return deepmerge(
    {
      fontFamily,
      fontSize,
      htmlFontSize,
      pxToRem,
      fontWeightLight: light,
      fontWeightRegular: regular,
      fontWeightMedium: medium,
      fontWeightBold: bold,
      h1: variant(light, 96, 1.167, -1.5),
      h2: variant(light, 60, 1.2, -0.5),
      h3: variant(regular, 48, 1.167, 0),
      h4: variant(regular, 34, 1.235, 0.25),
      h5: variant(regular, 24, 1.334, 0),
      h6: variant(medium, 20, 1.6, 0.15),
      subtitle1: variant(regular, 16, 1.75, 0.15),
      subtitle2: variant(medium, 14, 1.57, 0.1),
      body1: variant(regular, 16, 1.5, 0.15),
      body2: variant(regular, 14, 1.43, 0.15),
      button: variant(medium, 14, 1.75, 0.4, true),
      caption: variant(regular, 12, 1.66, 0.4),
      overline: variant(regular, 12, 2.66, 1, true),
      inherit: {
        fontFamily: "inherit",
        fontWeight: "inherit",
        fontSize: "inherit",
        lineHeight: "inherit",
        letterSpacing: "inherit",
      },
    },
    options,
  ) as TypographyVariants;
}
export type FocusVisible = CSSObject;

function resolveFocusVisible(
  input: true | CSSObject,
  color: string,
): CSSObject {
  const resolved: CSSObject = {
    outlineStyle: "solid",
    outlineColor: color,
    outlineWidth: 2,
    outlineOffset: 2,
    // An invisible shadow lets colored surfaces control the ring color.
    boxShadow: "var(--_focusVisible-shadow, 0 0)",
    ...(input === true ? {} : input),
  };
  // These variables also drive private_applyInsetFocusVisible and
  // private_outsetFocusRing. Re-composed themes must not invert the offset twice.
  const offset = resolved.outlineOffset ?? 0;
  if (typeof offset !== "string" || !offset.includes("--_focusVisible-offset"))
    resolved.outlineOffset = `calc(var(--_focusVisible-offset, 1) * ${typeof offset === "number" ? `${offset}px` : offset})`;
  const shadow = resolved.boxShadow;
  if (
    typeof shadow === "string" &&
    !new Set([
      "none",
      "initial",
      "inherit",
      "unset",
      "revert",
      "revert-layer",
    ]).has(shadow.trim().toLowerCase()) &&
    !/\binset\b/.test(shadow) &&
    !shadow.includes("--_focusVisible-behavior")
  )
    resolved.boxShadow = `var(--_focusVisible-behavior, ) ${shadow}`;
  return resolved;
}

export function createTheme(
  options: ThemeOptions = {},
  ...additional: object[]
): Theme {
  let input = additional.reduce<ThemeOptions>((a, b) => deepmerge(a, b), {
    ...options,
  });
  if (typeof input.cssVariables === "object")
    input = {
      ...input,
      ...input.cssVariables,
      cssVariables: input.cssVariables,
    };
  const colorSpace = input.nativeColor ? "oklch" : input.colorSpace;
  const mode = input.palette?.mode ?? input.defaultColorScheme ?? "light";
  const scheme = input.colorSchemes?.[mode];
  if (scheme && typeof scheme !== "boolean")
    input.palette = deepmerge(scheme.palette ?? {}, input.palette ?? {});
  const dark = mode === "dark";
  const contrastText = (color: string) =>
    colorSpace
      ? contrastColor(color)
      : getContrastRatio(color, "#fff") >=
          (input.palette?.contrastThreshold ?? 3)
        ? "#fff"
        : "rgba(0, 0, 0, 0.87)";
  const tonal = input.palette?.tonalOffset ?? 0.2;
  const augment: Palette["augmentColor"] = ({
    color,
    name,
    mainShade = 500,
    lightShade = 300,
    darkShade = 700,
  }) => {
    const shades = color as Partial<PaletteColor> &
      Record<number, string | undefined>;
    const main = shades.main ?? shades[mainShade];
    if (typeof main !== "string")
      throw new Error(
        `MUI: The color${name ? ` (${name})` : ""} provided to augmentColor(color) is invalid. The color object needs a string main property or a ${mainShade} property.`,
      );
    const lightOffset =
      typeof tonal === "number" ? tonal : (tonal.light ?? 0.2);
    const darkOffset =
      typeof tonal === "number" ? tonal * 1.5 : (tonal.dark ?? 0.3);
    return {
      ...color,
      main,
      light:
        color.light ??
        shades[lightShade] ??
        (colorSpace
          ? nativeMix(main, "#fff", lightOffset, colorSpace)
          : lighten(main, lightOffset)),
      dark:
        color.dark ??
        shades[darkShade] ??
        (colorSpace
          ? nativeMix(main, "#000", darkOffset, colorSpace)
          : darken(main, darkOffset)),
      contrastText: color.contrastText ?? contrastText(main),
    };
  };
  const basePalette: Palette = {
    mode,
    primary: dark
      ? {
          main: "#90caf9",
          light: "#e3f2fd",
          dark: "#42a5f5",
          contrastText: "rgba(0, 0, 0, 0.87)",
        }
      : {
          main: "#1976d2",
          light: "#42a5f5",
          dark: "#1565c0",
          contrastText: "#fff",
        },
    secondary: dark
      ? {
          main: "#ce93d8",
          light: "#f3e5f5",
          dark: "#ab47bc",
          contrastText: "rgba(0, 0, 0, 0.87)",
        }
      : {
          main: "#9c27b0",
          light: "#ba68c8",
          dark: "#7b1fa2",
          contrastText: "#fff",
        },
    error: augment({
      color: dark
        ? { main: "#f44336", light: "#e57373", dark: "#d32f2f" }
        : { main: "#d32f2f", light: "#ef5350", dark: "#c62828" },
    }),
    warning: augment({
      color: dark
        ? { main: "#ffa726", light: "#ffb74d", dark: "#f57c00" }
        : { main: "#ed6c02", light: "#ff9800", dark: "#e65100" },
    }),
    info: augment({
      color: dark
        ? { main: "#29b6f6", light: "#4fc3f7", dark: "#0288d1" }
        : { main: "#0288d1", light: "#03a9f4", dark: "#01579b" },
    }),
    success: augment({
      color: dark
        ? { main: "#66bb6a", light: "#81c784", dark: "#388e3c" }
        : { main: "#2e7d32", light: "#4caf50", dark: "#1b5e20" },
    }),
    text: {
      primary: dark ? "#fff" : "rgba(0, 0, 0, 0.87)",
      secondary: dark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
      disabled: dark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.38)",
    },
    divider: dark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)",
    background: {
      default: dark ? "#121212" : "#fff",
      paper: dark ? "#121212" : "#fff",
    },
    common: { black: "#000", white: "#fff" },
    grey: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#eeeeee",
      300: "#e0e0e0",
      400: "#bdbdbd",
      500: "#9e9e9e",
      600: "#757575",
      700: "#616161",
      800: "#424242",
      900: "#212121",
      A100: "#f5f5f5",
      A200: "#eeeeee",
      A400: "#bdbdbd",
      A700: "#616161",
    },
    contrastThreshold: 3,
    tonalOffset: tonal as Palette["tonalOffset"],
    getContrastText: contrastText,
    augmentColor: augment,
    action: {
      active: dark ? "#fff" : "rgba(0, 0, 0, 0.54)",
      hover: dark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
      hoverOpacity: dark ? 0.08 : 0.04,
      selected: dark ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.08)",
      selectedOpacity: dark ? 0.16 : 0.08,
      disabled: dark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.26)",
      disabledOpacity: 0.38,
      disabledBackground: dark
        ? "rgba(255, 255, 255, 0.12)"
        : "rgba(0, 0, 0, 0.12)",
      focus: dark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)",
      focusOpacity: 0.12,
      activatedOpacity: 0.12,
    },
  };
  if (colorSpace) {
    basePalette.primary.contrastText = contrastColor(basePalette.primary.main);
    basePalette.secondary.contrastText = contrastColor(
      basePalette.secondary.main,
    );
  }
  const palette = deepmerge(basePalette, input.palette ?? {});
  for (const key of [
    "primary",
    "secondary",
    "error",
    "warning",
    "info",
    "success",
  ] as const) {
    const custom = input.palette?.[key];
    if (custom) palette[key] = augment({ color: custom, name: key });
  }
  const values = {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
    ...input.breakpoints?.values,
  };
  const keys = Object.keys(values) as Breakpoint[];
  const unit = input.breakpoints?.unit ?? "px";
  const value = (k: Breakpoint | number) =>
    typeof k === "number" ? k : values[k];
  const up = (k: Breakpoint | number) =>
    `@media (min-width:${value(k)}${unit})`;
  const down = (k: Breakpoint | number) =>
    `@media (max-width:${value(k) - 0.05}${unit})`;
  const between = (a: Breakpoint | number, b: Breakpoint | number) =>
    `@media (min-width:${value(a)}${unit}) and (max-width:${value(b) - 0.05}${unit})`;
  const mergedEasing = { ...easing, ...input.transitions?.easing },
    mergedDuration = { ...duration, ...input.transitions?.duration };
  const ms = (v: number | string) =>
    typeof v === "number" ? `${Math.round(v)}ms` : v;
  const theme: Theme = {
    palette,
    colorSpace,
    nativeColor: input.nativeColor,
    modularCssLayers: input.modularCssLayers,
    typography: createTypography(input.typography),
    shape: { borderRadius: 4, ...input.shape },
    direction: input.direction ?? "ltr",
    shadows: input.shadows ?? shadows,
    spacing: createSpacing(input.spacing),
    breakpoints: {
      keys,
      values,
      unit,
      up,
      down,
      between,
      only: (key) => {
        const next = keys[keys.indexOf(key) + 1];
        return next ? between(key, next) : up(key);
      },
      not: (key) => {
        const next = keys[keys.indexOf(key) + 1];
        return key === "xs"
          ? up(next)
          : next
            ? `@media (max-width:${value(key) - 0.05}${unit}), (min-width:${value(next)}${unit})`
            : down(key);
      },
    },
    transitions: {
      easing: mergedEasing,
      duration: mergedDuration,
      create: (props = "all", o = {}) =>
        (Array.isArray(props) ? props : [props])
          .map(
            (p) =>
              `${p} ${ms(o.duration ?? mergedDuration.standard)} ${o.easing ?? mergedEasing.easeInOut} ${ms(o.delay ?? 0)}`,
          )
          .join(","),
      getAutoHeightDuration: (height) =>
        height
          ? Math.min(
              Math.round((4 + 15 * (height / 36) ** 0.25 + height / 180) * 10),
              3000,
            )
          : 0,
    },
    zIndex: {
      mobileStepper: 1000,
      fab: 1050,
      speedDial: 1050,
      appBar: 1100,
      drawer: 1200,
      modal: 1300,
      snackbar: 1400,
      tooltip: 1500,
      ...input.zIndex,
    },
    components: (input.components as Theme["components"]) ?? {},
    mixins: {
      toolbar: { minHeight: 56, [up("sm")]: { minHeight: 64 } },
      ...input.mixins,
    },
    motion: createMotion(input.motion),
    focusVisible:
      input.focusVisible == null || input.focusVisible === false
        ? input.focusVisible
        : resolveFocusVisible(input.focusVisible, palette.primary.main),
    alpha,
    lighten,
    darken,
    applyStyles: (mode, styles) => {
      if (!theme.vars || !theme.colorSchemeSelector)
        return mode === theme.palette.mode ? styles : {};
      const selector = colorSchemeSelector(theme.colorSchemeSelector, mode);
      return selector.startsWith("@")
        ? { [selector]: styles }
        : { [`&:where(${selector}, ${selector} *)`]: styles };
    },
    getCssVar: (field, fallback) =>
      `var(--${theme.cssVarPrefix === "" ? "" : `${theme.cssVarPrefix ?? "mui"}-`}${field}${fallback ? `, ${fallback}` : ""})`,
    generateStyleSheets: () => [],
    unstable_sx: (sx) =>
      theme.modularCssLayers
        ? { "@layer mui.sx": resolveSx(sx, theme) }
        : resolveSx(sx, theme),
  };
  if (input.colorSchemes) {
    theme.defaultColorScheme = mode;
    theme.colorSchemes = {};
    for (const key of ["light", "dark"] as const) {
      const scheme = input.colorSchemes[key];
      if (scheme) {
        theme.colorSchemes[key] = createColorSystem(
          key === mode
            ? palette
            : createTheme({
                colorSpace,
                palette: {
                  ...(typeof scheme === "boolean" ? {} : scheme.palette),
                  mode: key,
                },
              }).palette,
          {
            ...(typeof scheme === "boolean"
              ? {}
              : { opacity: scheme.opacity, overlays: scheme.overlays }),
            nativeColor: input.nativeColor,
            colorSpace,
            cssVarPrefix:
              typeof input.cssVariables === "object"
                ? input.cssVariables.cssVarPrefix
                : input.cssVarPrefix,
          },
        );
      }
    }
  }
  if (input.cssVariables) {
    attachThemeVars(theme, input);
    if (input.focusVisible != null && input.focusVisible !== false)
      theme.focusVisible = resolveFocusVisible(
        input.focusVisible,
        theme.getCssVar("palette-primary-main"),
      );
  } else if (colorSpace)
    theme.generateStyleSheets = () => [
      {
        ":root": {
          "--__l-threshold": "0.7",
          "--__l": "clamp(0, (l / var(--__l-threshold) - 1) * -infinity, 1)",
          "--__a": "clamp(0.87, (l / var(--__l-threshold) - 1) * -infinity, 1)",
        },
      },
    ];
  attachColorManipulators(theme);
  return theme;
}
function colorSchemeSelector(strategy: string, mode: PaletteMode): string {
  if (strategy === "class") return `.${mode}`;
  if (strategy === "data") return `[data-mui-color-scheme="${mode}"]`;
  if (strategy === "media") return `@media (prefers-color-scheme: ${mode})`;
  return strategy.replaceAll("%s", mode);
}
function attachThemeVars(theme: Theme, input: ThemeOptions): void {
  const options =
    typeof input.cssVariables === "object" ? input.cssVariables : {};
  const prefix = options.cssVarPrefix ?? input.cssVarPrefix ?? "mui";
  theme.cssVarPrefix = prefix;
  theme.rootSelector = options.rootSelector ?? input.rootSelector ?? ":root";
  theme.colorSchemeSelector =
    input.colorSchemeSelector ??
    (theme.colorSchemes?.light && theme.colorSchemes?.dark
      ? "media"
      : undefined);
  theme.disableCssColorScheme = input.disableCssColorScheme;
  theme.getColorSchemeSelector = (mode) =>
    colorSchemeSelector(theme.colorSchemeSelector ?? "data", mode);
  const definitions: Record<string, string | number> = {};
  const walk = (
    value: unknown,
    keys: string[],
    target: Record<string, string | number>,
  ): unknown => {
    if (typeof value === "string" || typeof value === "number") {
      if (
        (input.shouldSkipGeneratingVar ?? shouldSkipGeneratingVar)(keys, value)
      )
        return value;
      const name = `--${prefix ? `${prefix}-` : ""}${keys.join("-")}`;
      const normalized =
        typeof value === "number" && keys[0] === "shape" ? `${value}px` : value;
      target[name] = normalized;
      return `var(${name}, ${normalized})`;
    }
    if (Array.isArray(value))
      return value.map((v, i) => walk(v, [...keys, String(i)], target));
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value)
          .filter(([, v]) => typeof v !== "function")
          .map(([k, v]) => [k, walk(v, [...keys, k], target)]),
      );
    return undefined;
  };
  const selected = createColorSystem(theme.palette, {
    cssVarPrefix: prefix,
    nativeColor: theme.nativeColor,
    colorSpace: theme.colorSpace,
    opacity: input.opacity,
    overlays: input.overlays,
  });
  theme.palette = selected.palette;
  theme.opacity = selected.opacity;
  theme.overlays = selected.overlays;
  const schemeSheets: Record<string, CSSObject> = {};
  let paletteVars: unknown = {};
  for (const mode of ["light", "dark"] as const) {
    const authored = theme.colorSchemes?.[mode];
    if (!authored) continue;
    const system = createColorSystem(authored.palette, {
      ...authored,
      cssVarPrefix: prefix,
      nativeColor: theme.nativeColor,
      colorSpace: theme.colorSpace,
    });
    theme.colorSchemes![mode] = system;
    const sheet: Record<string, string | number> = {};
    const vars = walk(system.palette, ["palette"], sheet);
    walk(system.opacity, ["opacity"], sheet);
    walk(system.overlays, ["overlays"], sheet);
    paletteVars = deepmerge(paletteVars as object, vars as object);
    if (!theme.disableCssColorScheme) sheet.colorScheme = mode;
    schemeSheets[mode] = sheet;
  }
  theme.vars = {
    palette: deepmerge(
      paletteVars as object,
      walk(theme.palette, ["palette"], definitions) as object,
    ),
    shape: walk(theme.shape, ["shape"], definitions),
    shadows: walk(theme.shadows, ["shadows"], definitions),
    spacing: walk(theme.spacing(1), ["spacing"], definitions),
    zIndex: walk(theme.zIndex, ["zIndex"], definitions),
    opacity: walk(theme.opacity, ["opacity"], definitions),
    overlays: walk(theme.overlays, ["overlays"], definitions),
  } as ThemeVars;
  if (!theme.disableCssColorScheme)
    definitions.colorScheme = theme.palette.mode;
  theme.generateStyleSheets = () => {
    const root = theme.rootSelector ?? ":root";
    const sheets: CSSObject[] = [{ [root]: definitions }];
    if (theme.colorSchemeSelector)
      for (const [mode, sheet] of Object.entries(schemeSheets)) {
        const selector = colorSchemeSelector(
          theme.colorSchemeSelector,
          mode as PaletteMode,
        );
        if (selector.startsWith("@"))
          sheets.push({ [selector]: { [root]: sheet } });
        else
          sheets.push({
            [root === ":root"
              ? `${root}${selector}`
              : `${selector} ${root}, ${root}${selector}`]: sheet,
          });
      }
    if (theme.nativeColor)
      sheets.push({
        ":root": {
          "--__l-threshold": "0.7",
          "--__l": "clamp(0, (l / var(--__l-threshold) - 1) * -infinity, 1)",
          "--__a": "clamp(0.87, (l / var(--__l-threshold) - 1) * -infinity, 1)",
        },
      });
    return sheets;
  };
}
export function extendTheme(
  options: ThemeOptions = {},
  ...additional: object[]
): CssVarsTheme {
  return createTheme(
    {
      colorSchemes: { light: true, dark: true },
      ...options,
      cssVariables: options.cssVariables ?? true,
    },
    ...additional,
  ) as CssVarsTheme;
}
const defaultTheme = /* @__PURE__ */ createTheme();
const ThemeContext = /* @__PURE__ */ createContext<Theme>(defaultTheme);
export function useTheme(): Theme {
  return useContext(ThemeContext);
}
export interface ThemeProviderProps {
  theme: Theme | ThemeOptions | ((outer: Theme) => Theme | ThemeOptions);
  children?: JSX.Element;
}
function ThemeLayerOrder(p: { theme: Theme }): JSX.Element {
  const order = createMemo(() => {
    const layers = p.theme.modularCssLayers;
    if (!layers) return "";
    const muiOrder =
      "mui.global, mui.components, mui.theme, mui.custom, mui.sx";
    if (typeof layers !== "string") return `@layer ${muiOrder};`;
    const expanded = layers.replace(/mui(?!\.)/g, muiOrder);
    return expanded.trimStart().startsWith("@layer")
      ? expanded
      : `@layer ${expanded.replace(/;$/, "")};`;
  });
  createEffect(
    () => order(),
    (value) => {
      if (isServer || !value) return;
      // Prepend the declaration before Emotion's styles so insertion timing does
      // not determine the precedence of the component, theme, custom and sx layers.
      const node = document.createElement("style");
      node.setAttribute("data-mui-layer-order", "");
      node.textContent = value;
      document.head.prepend(node);
      return () => node.remove();
    },
  );
  return <style data-mui-layer-order innerHTML={order()} />;
}
export function ThemeProvider(p: ThemeProviderProps): JSX.Element {
  const outer = useTheme();
  const theme = createMemo(() => {
    const value = typeof p.theme === "function" ? p.theme(outer) : p.theme;
    return typeof value.spacing === "function" && value.palette?.augmentColor
      ? (value as Theme)
      : createTheme(deepmerge(outer, value) as ThemeOptions);
  });
  const reactive = new Proxy({} as Theme, {
    get: (_, key) => Reflect.get(theme(), key),
    ownKeys: () => Reflect.ownKeys(theme()),
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
  });
  return (
    <ThemeContext value={reactive}>
      {(outer === defaultTheme || !outer.modularCssLayers) && (
        <ThemeLayerOrder theme={reactive} />
      )}
      {(theme().vars || theme().colorSpace) && (
        <GlobalStyles styles={theme().generateStyleSheets() as SxProps} />
      )}
      {p.children}
    </ThemeContext>
  );
}
export type ColorSchemeMode = "light" | "dark" | "system";
interface ColorSchemeState {
  mode: () => ColorSchemeMode;
  systemMode: () => "light" | "dark";
  setMode: (mode: ColorSchemeMode) => void;
}
const ColorSchemeContext = /* @__PURE__ */ createContext<ColorSchemeState | null>(null);
export interface CssVarsProviderProps extends Omit<
  ThemeProviderProps,
  "theme"
> {
  theme?: ThemeProviderProps["theme"];
  defaultMode?: ColorSchemeMode;
  modeStorageKey?: string;
  disableTransitionOnChange?: boolean;
  colorSchemeNode?: HTMLElement;
  documentNode?: Document;
}
export function CssVarsProvider(p: CssVarsProviderProps): JSX.Element {
  const [mode, setModeSignal] = createSignal<ColorSchemeMode>(
    untrack(() => p.defaultMode ?? "system"),
  );
  const [systemMode, setSystemMode] = createSignal<"light" | "dark">("light");
  const setMode = (next: ColorSchemeMode) => {
    setModeSignal(next);
    try {
      localStorage.setItem(p.modeStorageKey ?? "mui-mode", next);
    } catch {
      /* Storage may be unavailable in an embedded document. */
    }
  };
  onSettled(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemMode(query.matches ? "dark" : "light");
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(p.modeStorageKey ?? "mui-mode");
    } catch {
      /* Use defaultMode when storage is unavailable. */
    }
    if (stored === "light" || stored === "dark" || stored === "system")
      setModeSignal(stored);
    const update = () => setSystemMode(query.matches ? "dark" : "light");
    const storage = (event: StorageEvent) => {
      if (
        event.key === (p.modeStorageKey ?? "mui-mode") &&
        (event.newValue === "light" ||
          event.newValue === "dark" ||
          event.newValue === "system")
      )
        setModeSignal(event.newValue);
    };
    query.addEventListener("change", update);
    window.addEventListener("storage", storage);
    return () => {
      query.removeEventListener("change", update);
      window.removeEventListener("storage", storage);
    };
  });
  const outer = useTheme();
  const fallback = extendTheme();
  const selected = createMemo(() => {
    const value =
      typeof p.theme === "function" ? p.theme(outer) : (p.theme ?? fallback);
    const paletteMode =
      mode() === "system" ? systemMode() : (mode() as PaletteMode);
    const scheme = value.colorSchemes?.[paletteMode];
    const authoredPalette =
      scheme && typeof scheme !== "boolean"
        ? scheme.palette
        : value.palette?.mode === paletteMode
          ? value.palette
          : {};
    return createTheme({
      ...value,
      cssVariables: {
        cssVarPrefix: value.cssVarPrefix,
        rootSelector: value.rootSelector,
      },
      colorSchemeSelector: value.colorSchemeSelector ?? "data",
      palette: { ...authoredPalette, mode: paletteMode },
    } as ThemeOptions);
  });
  createEffect(
    () => ({
      mode: selected().palette.mode,
      strategy: selected().colorSchemeSelector,
      node: p.colorSchemeNode,
      doc: p.documentNode,
      disableTransitions: p.disableTransitionOnChange,
    }),
    ({ mode, strategy, node, doc, disableTransitions }) => {
      if (isServer) return;
      const target = node ?? (doc ?? document).documentElement;
      const transitionStyle = disableTransitions
        ? (doc ?? document).createElement("style")
        : undefined;
      if (transitionStyle) {
        transitionStyle.textContent =
          "*,*::before,*::after{transition:none!important}";
        (doc ?? document).head.appendChild(transitionStyle);
      }
      let restore: () => void = () => {};
      if (strategy === "class") {
        const hadLight = target.classList.contains("light"),
          hadDark = target.classList.contains("dark");
        target.classList.toggle("light", mode === "light");
        target.classList.toggle("dark", mode === "dark");
        restore = () => {
          target.classList.toggle("light", hadLight);
          target.classList.toggle("dark", hadDark);
        };
      } else if (strategy && strategy !== "media") {
        const selector = colorSchemeSelector(strategy, mode);
        const attribute = selector.match(
          /^\[([^=\]]+)(?:=["']?([^"'\]]+)["']?)?\]$/,
        );
        if (attribute) {
          const name = attribute[1],
            previous = target.getAttribute(name);
          target.setAttribute(name, attribute[2] ?? "");
          restore = () => {
            if (previous === null) target.removeAttribute(name);
            else target.setAttribute(name, previous);
          };
        } else if (selector.startsWith(".")) {
          const name = selector.slice(1),
            other = colorSchemeSelector(
              strategy,
              mode === "light" ? "dark" : "light",
            ).slice(1);
          const hadCurrent = target.classList.contains(name),
            hadOther = target.classList.contains(other);
          target.classList.add(name);
          target.classList.remove(other);
          restore = () => {
            target.classList.toggle(name, hadCurrent);
            target.classList.toggle(other, hadOther);
          };
        }
      }
      const frame = transitionStyle
        ? requestAnimationFrame(() =>
            requestAnimationFrame(() => transitionStyle.remove()),
          )
        : undefined;
      return () => {
        restore();
        if (frame !== undefined) cancelAnimationFrame(frame);
        transitionStyle?.remove();
      };
    },
  );
  return (
    <ColorSchemeContext value={{ mode, systemMode, setMode }}>
      <ThemeProvider theme={selected()}>{p.children}</ThemeProvider>
    </ColorSchemeContext>
  );
}
export function useThemeProps<P extends object>({
  name,
  props,
}: {
  name: string;
  props: P;
}): P {
  const theme = useTheme();
  const defaults = createMemo(
    () =>
      (theme.components[name] as ComponentConfig | undefined)?.defaultProps ??
      {},
  );
  return new Proxy(props, {
    get: (target, key, receiver) => {
      const value = Reflect.get(target, key, receiver);
      if (value !== undefined) return value;
      // An existence probe must not subscribe native ref/event consumers to the theme.
      // Reads of actual default values still track when consumed in JSX/computations.
      if (!Object.hasOwn(untrack(defaults), key)) return undefined;
      return defaults()[String(key)];
    },
    ownKeys: (target) => [
      ...new Set([...Reflect.ownKeys(defaults()), ...Reflect.ownKeys(target)]),
    ],
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
  });
}
const paths = (obj: unknown, path: string): unknown =>
  path
    .split(".")
    .reduce<unknown>(
      (o, k) =>
        o && typeof o === "object"
          ? (o as Record<string, unknown>)[k]
          : undefined,
      obj,
    );
const spacingAliases: Record<string, string[]> = {
  m: ["margin"],
  mt: ["marginTop"],
  mr: ["marginRight"],
  mb: ["marginBottom"],
  ml: ["marginLeft"],
  mx: ["marginLeft", "marginRight"],
  marginX: ["marginLeft", "marginRight"],
  marginY: ["marginTop", "marginBottom"],
  my: ["marginTop", "marginBottom"],
  p: ["padding"],
  pt: ["paddingTop"],
  pr: ["paddingRight"],
  pb: ["paddingBottom"],
  pl: ["paddingLeft"],
  px: ["paddingLeft", "paddingRight"],
  paddingX: ["paddingLeft", "paddingRight"],
  paddingY: ["paddingTop", "paddingBottom"],
  py: ["paddingTop", "paddingBottom"],
};
const aliases: Record<string, string> = {
  bgcolor: "backgroundColor",
  displayPrint: "display",
};
export function resolveSx(input: SxProps | undefined, theme: Theme): CSSObject {
  if (!input) return {};
  if (Array.isArray(input)) {
    const result: CSSObject = {};
    for (const value of input)
      if (value) mergeInto(result, resolveSx(value as SxProps, theme));
    return result;
  }
  const source = typeof input === "function" ? input(theme) : input;
  const result: CSSObject = {};
  const transform = (key: string, v: unknown): unknown => {
    if (typeof v === "function")
      return transform(key, (v as (t: Theme) => unknown)(theme));
    if (
      spacingAliases[key] ||
      /^(margin|padding|gap|rowGap|columnGap)/.test(key)
    )
      return typeof v === "number" ? theme.spacing(v) : v;
    if (
      [
        "color",
        "bgcolor",
        "backgroundColor",
        "borderColor",
        "borderTopColor",
        "borderBottomColor",
        "borderLeftColor",
        "borderRightColor",
      ].includes(key)
    )
      return typeof v === "string" ? (paths(theme.palette, v) ?? v) : v;
    if (key === "borderRadius" && typeof v === "number")
      return v * theme.shape.borderRadius;
    if (key === "boxShadow" && typeof v === "number") return theme.shadows[v];
    if (key === "zIndex" && typeof v === "string")
      return paths(theme.zIndex, v) ?? v;
    if (
      [
        "fontWeight",
        "fontFamily",
        "fontSize",
        "font",
        "lineHeight",
        "letterSpacing",
      ].includes(key) &&
      typeof v === "string"
    )
      return paths(theme.typography, v) ?? v;
    if (
      [
        "width",
        "height",
        "maxWidth",
        "maxHeight",
        "minWidth",
        "minHeight",
      ].includes(key) &&
      typeof v === "number" &&
      v > 0 &&
      v <= 1
    )
      return `${v * 100}%`;
    if (key === "maxWidth" && typeof v === "string")
      return paths(theme.breakpoints.values, v) ?? v;
    if (/^border(?:Top|Bottom|Left|Right)?$/.test(key) && typeof v === "number")
      return `${v}px solid`;
    return v;
  };
  for (const [key, supplied] of Object.entries(source)) {
    const raw = typeof supplied === "function" ? supplied(theme) : supplied;
    if (raw == null || raw === false) continue;
    if (key === "typography" && typeof raw === "string") {
      Object.assign(result, paths(theme.typography, raw));
      continue;
    }
    if (
      key.startsWith("@") ||
      key.startsWith("&") ||
      key.includes(" ") ||
      key.startsWith(":") ||
      key.startsWith(">")
    ) {
      result[key] = resolveSx(raw as SxProps, theme);
      continue;
    }
    const properties = spacingAliases[key] ?? [aliases[key] ?? key];
    const assign = (target: CSSObject, val: unknown) => {
      const transformed = transform(key, val);
      for (const prop of properties)
        (target as Record<string, unknown>)[prop] = transformed;
    };
    if (key === "displayPrint") {
      result["@media print"] = { display: raw as string };
      continue;
    }
    if (Array.isArray(raw)) {
      raw.forEach((v, i) => {
        if (v == null) return;
        const bp = theme.breakpoints.keys[i];
        if (!bp) return;
        if (i === 0) assign(result, v);
        else {
          const query = theme.breakpoints.up(bp);
          const rule = (result[query] ?? {}) as CSSObject;
          assign(rule, v);
          result[query] = rule;
        }
      });
    } else if (
      typeof raw === "object" &&
      Object.keys(raw).every((k) =>
        theme.breakpoints.keys.includes(k as Breakpoint),
      )
    ) {
      for (const bp of theme.breakpoints.keys) {
        const v = (raw as Record<string, unknown>)[bp];
        if (v == null) continue;
        if (theme.breakpoints.values[bp] === 0) assign(result, v);
        else {
          const query = theme.breakpoints.up(bp);
          const rule = (result[query] ?? {}) as CSSObject;
          assign(rule, v);
          result[query] = rule;
        }
      }
    } else if (typeof raw === "object")
      result[key] = resolveSx(raw as SxProps, theme);
    else assign(result, raw);
  }
  return result;
}
export const createStyleCache = (
  options: Parameters<typeof createEmotion>[0] = { key: "mui-solid" },
) => createEmotion(options);
export type StyleCache = ReturnType<typeof createStyleCache>;
let defaultStyleCache: StyleCache | undefined;
const StyleContext = /* @__PURE__ */ createContext<StyleCache | null>(null);
function getDefaultStyleCache(): StyleCache {
  return (defaultStyleCache ??= createStyleCache());
}
export function useStyleCache(): StyleCache {
  return useContext(StyleContext) ?? getDefaultStyleCache();
}
/** @internal Assign styles to their MUI cascade layer without mutating authored styles. */
export function internal_layerStyles(
  theme: Theme,
  styles: CSSInterpolation,
  layer: "global" | "components" | "theme" | "custom" | "sx",
): CSSInterpolation {
  if (!theme.modularCssLayers || styles == null || styles === false)
    return styles;
  const serialized = serializeStyles([styles]);
  // Explicitly layered author styles keep their requested layer.
  if (!serialized.styles || serialized.styles.trimStart().startsWith("@layer"))
    return styles;
  return { ...serialized, styles: `@layer mui.${layer}{${serialized.styles}}` };
}
export function css(...styles: CSSInterpolation[]): string {
  return (getOwner() ? useStyleCache() : getDefaultStyleCache()).css(...styles);
}
export function StyledEngineProvider(p: {
  children?: JSX.Element;
  injectFirst?: boolean;
  cache?: StyleCache;
}): JSX.Element {
  const injectFirst = untrack(() => p.injectFirst);
  let fallback: StyleCache | undefined;
  return (
    <StyleContext
      value={p.cache ?? (fallback ??= createStyleCache({ key: "mui-solid", prepend: injectFirst }))}
    >
      {p.children}
    </StyleContext>
  );
}
export const CacheProvider = StyledEngineProvider;
export function getStyleTag(engine: StyleCache = getDefaultStyleCache()): string {
  const entries = Object.entries(engine.cache.inserted).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );
  return `<style data-emotion="${engine.cache.key} ${entries.map(([id]) => id).join(" ")}">${entries.map(([, rule]) => rule).join("")}</style>`;
}
export interface GlobalStylesProps {
  styles: SxProps | CSSInterpolation;
}
export function GlobalStyles(p: GlobalStylesProps): JSX.Element {
  const theme = useTheme();
  const evaluate = (style: unknown): CSSInterpolation =>
    typeof style === "function"
      ? evaluate(style(theme))
      : Array.isArray(style)
        ? style.map(evaluate)
        : (style as CSSInterpolation);
  const text = createMemo(() =>
    serialize(
      compile(
        serializeStyles([
          internal_layerStyles(theme, evaluate(p.styles), "global"),
        ]).styles,
      ),
      stringify,
    ),
  );
  return <style data-mui-global innerHTML={text()} />;
}
export interface StyledOptions {
  name?: string;
  slot?: string;
  shouldForwardProp?: (key: string) => boolean;
  skipSx?: boolean;
  skipVariantsResolver?: boolean;
  overridesResolver?: (
    props: Record<string, unknown> & { theme: Theme },
    styles: Record<string, CSSInterpolation>,
  ) => CSSInterpolation;
}
type StyledStyle<P> =
  | CSSInterpolation
  | ((props: P & { theme: Theme }) => CSSInterpolation);
export function styled<T extends ValidComponent>(
  component: T,
  options: StyledOptions = {},
) {
  return <Extra extends object = {}>(
    ...styles: (StyledStyle<ComponentProps<T> & Extra> | TemplateStringsArray)[]
  ) => {
    const isTemplate =
      Array.isArray(styles[0]) && Object.hasOwn(styles[0], "raw");
    type Props = ComponentProps<T> &
      Extra & {
        children?: JSX.Element;
        sx?: SxProps;
        class?: JSX.HTMLAttributes<HTMLElement>["class"];
        className?: string;
        as?: ValidComponent;
        ownerState?: Record<string, unknown>;
        theme?: Theme;
      };
    return (props: Props): JSX.Element => {
      const p = options.name
        ? useThemeProps({ name: options.name, props })
        : props;
      const outer = useTheme();
      const theme = new Proxy({} as Theme, {
        get: (_, key) => Reflect.get(p.theme ?? outer, key),
      });
      const children = createMemo(() => p.children);
      // Keep getters intact: spreading props can construct JSX children a second time.
      const styleProps = new Proxy(p, {
        get: (target, key) =>
          key === "theme"
            ? theme
            : key === "children"
              ? children()
              : Reflect.get(target, key),
      }) as Props & { theme: Theme };
      const slot = options.slot
        ? options.slot[0].toLowerCase() + options.slot.slice(1)
        : "root";
      const Tag = dynamic(() => p.as ?? component);
      const evaluate = (style: unknown): CSSInterpolation =>
        typeof style === "function"
          ? evaluate(style(styleProps))
          : Array.isArray(style)
            ? style.map(evaluate)
            : (style as CSSInterpolation);
      const className = createMemo(() => {
        const config = options.name
          ? (theme.components[options.name] as ComponentConfig | undefined)
          : undefined;
        const ownerState = p.ownerState ?? (p as Record<string, unknown>);
        const overrideEntries = options.overridesResolver
          ? Object.entries(config?.styleOverrides ?? {})
          : [[slot, config?.styleOverrides?.[slot]]];
        const overrides = Object.fromEntries(
          overrideEntries.map(([key, value]) => [
            key,
            typeof value === "function" ? value({ theme, ownerState }) : value,
          ]),
        );
        const variants =
          options.skipVariantsResolver || slot !== "root"
            ? []
            : (config?.variants ?? [])
                .filter((v) =>
                  typeof v.props === "function"
                    ? v.props(ownerState)
                    : Object.entries(v.props).every(
                        ([key, value]) => ownerState[key] === value,
                      ),
                )
                .map((v) =>
                  typeof v.style === "function"
                    ? v.style({ theme, ownerState })
                    : v.style,
                );
        const base = isTemplate
          ? serializeStyles([
              styles[0] as TemplateStringsArray,
              ...styles.slice(1).map(evaluate),
            ])
          : styles.map(evaluate);
        return css(
          internal_layerStyles(
            theme,
            base as CSSInterpolation,
            options.name?.startsWith("Mui") || options.slot
              ? "components"
              : "custom",
          ),
          internal_layerStyles(
            theme,
            options.overridesResolver
              ? options.overridesResolver(
                  styleProps as unknown as Record<string, unknown> & {
                    theme: Theme;
                  },
                  overrides,
                )
              : overrides[slot],
            "theme",
          ),
          ...variants.map((style) =>
            internal_layerStyles(theme, style, "theme"),
          ),
          options.skipSx
            ? undefined
            : internal_layerStyles(theme, resolveSx(p.sx, theme), "sx"),
        );
      });
      const hidden = new Set([
        "theme",
        "sx",
        "as",
        "class",
        "className",
        "ownerState",
        "children",
      ]);
      const native = new Proxy(p, {
        get: (target, key) =>
          hidden.has(String(key)) ||
          (options.shouldForwardProp && !options.shouldForwardProp(String(key)))
            ? undefined
            : Reflect.get(target, key),
        ownKeys: (target) =>
          Reflect.ownKeys(target).filter(
            (key) =>
              !hidden.has(String(key)) &&
              (!options.shouldForwardProp ||
                options.shouldForwardProp(String(key))),
          ),
        getOwnPropertyDescriptor: () => ({
          enumerable: true,
          configurable: true,
        }),
      });
      const attributes = createMemo(() => ({
        ...native,
        class: [
          className(),
          p.class,
          p.className,
          options.name && `${options.name}-${slot}`,
        ],
        children: children(),
      }));
      return <Tag {...attributes()} />;
    };
  };
}
export function responsiveFontSizes(
  theme: Theme,
  options: {
    factor?: number;
    breakpoints?: Breakpoint[];
    variants?: TypographyVariant[];
  } = {},
): Theme {
  const next = deepmerge(theme, { typography: {} });
  for (const key of options.variants ?? ["h1", "h2", "h3", "h4", "h5", "h6"]) {
    const style = theme.typography[key],
      max = parseFloat(String(style.fontSize));
    if (!Number.isFinite(max) || max <= 1) continue;
    const min = 1 + (max - 1) / (options.factor ?? 2);
    const variant: CSSObject = { ...style, fontSize: `${min}rem` };
    for (const bp of options.breakpoints ?? ["sm", "md", "lg"]) {
      variant[theme.breakpoints.up(bp)] = {
        fontSize: `${min + (max - min) * Math.min(1, theme.breakpoints.values[bp] / 1200)}rem`,
      };
    }
    next.typography[key] = variant;
  }
  return next;
}
export function useMediaQuery(
  query: string | ((theme: Theme) => string),
  options: {
    defaultMatches?: boolean;
    noSsr?: boolean;
    ssrMatchMedia?: (query: string) => { matches: boolean };
    matchMedia?: typeof window.matchMedia;
  } = {},
): () => boolean {
  const theme = useTheme();
  const resolved = () =>
    (typeof query === "function" ? query(theme) : query).replace(
      /^@media\s*/,
      "",
    );
  const [matches, setMatches] = createSignal(
    untrack(() =>
      !isServer && options.noSsr
        ? (options.matchMedia ?? window.matchMedia.bind(window))(resolved())
            .matches
        : (options.ssrMatchMedia?.(resolved()).matches ??
          options.defaultMatches ??
          false),
    ),
  );
  createEffect(
    () => ({ query: resolved(), matcher: options.matchMedia }),
    ({ query, matcher }) => {
      if (isServer) return;
      const media = (matcher ?? window.matchMedia.bind(window))(query);
      setMatches(media.matches);
      const update = () => setMatches(media.matches);
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    },
  );
  return matches;
}
export function useScrollTrigger(
  options: {
    disableHysteresis?: boolean;
    threshold?: number;
    target?: Window | HTMLElement;
  } = {},
): () => boolean {
  const [trigger, setTrigger] = createSignal(false);
  createEffect(
    () => ({
      target: options.target,
      threshold: options.threshold ?? 100,
      disableHysteresis: options.disableHysteresis,
    }),
    ({ target: input, threshold, disableHysteresis }) => {
      if (isServer) return;
      const target = input ?? window;
      let previous = 0;
      const update = () => {
        const pos =
          target instanceof Window ? target.scrollY : target.scrollTop;
        const next =
          !disableHysteresis && pos < previous ? false : pos > threshold;
        previous = pos;
        setTrigger(next);
      };
      update();
      target.addEventListener("scroll", update, { passive: true });
      return () => target.removeEventListener("scroll", update);
    },
  );
  return trigger;
}
export function useColorScheme(): ColorSchemeState {
  const context = useContext(ColorSchemeContext);
  if (context) return context;
  throw new Error("useColorScheme requires CssVarsProvider.");
}
export function InitColorSchemeScript(
  p: {
    defaultMode?: "light" | "dark" | "system";
    attribute?: string;
    modeStorageKey?: string;
  } = {},
): JSX.Element {
  const code = `(function(){try{var m=localStorage.getItem(${JSON.stringify(p.modeStorageKey ?? "mui-mode")})||${JSON.stringify(p.defaultMode ?? "system")};if(m==='system')m=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute(${JSON.stringify(p.attribute ?? "data-mui-color-scheme")},m)}catch(e){}})()`;
  return <script innerHTML={code.replaceAll("<", "\\u003c")} />;
}

export type PaletteMode = Palette["mode"];
export type PaletteOptions = DeepPartial<Palette>;
export type SimplePaletteColorOptions = Partial<PaletteColor> & {
  main: string;
};
export type PaletteColorOptions = Partial<PaletteColor>;
export type TypeText = Palette["text"];
export type TypeBackground = Palette["background"];
export type TypeAction = Palette["action"];
export type CommonColors = Palette["common"];
export type TypographyVariantsOptions = DeepPartial<TypographyVariants>;
export type TypographyStyle = CSSObject;
export type Direction = Theme["direction"];
export type Shadows = Theme["shadows"];
export type ZIndex = Theme["zIndex"];
export type Mixins = Theme["mixins"];
export type MixinsOptions = DeepPartial<Mixins>;
export type Duration = typeof duration;
export type Easing = typeof easing;
export type Transitions = Theme["transitions"];
export type TransitionsOptions = DeepPartial<Transitions>;
export type Breakpoints = Theme["breakpoints"];
export type BreakpointsOptions = DeepPartial<Breakpoints>;
export interface BreakpointOverrides {}
export type CSSProperties = JSX.CSSProperties;
export type { CSSInterpolation } from "@emotion/serialize";
export type ClassNameMap<ClassKey extends string = string> = Record<
  ClassKey,
  string
>;
export interface StyledComponentProps<ClassKey extends string = string> {
  classes?: Partial<ClassNameMap<ClassKey>>;
}
export type {
  Components,
  ComponentsPropsList,
  ComponentNameToClassKey,
  ComponentsOverrides,
  ComponentsVariants,
  ComponentsProps,
} from "./component-types";
export const THEME_ID = "$$material";
export const unstable_createMuiStrictModeTheme = createTheme;
export function createColorScheme(
  options: ThemeOptions = {},
): Pick<Theme, "palette"> {
  return { palette: createTheme(options).palette };
}
export function createStyles<T extends Record<string, CSSObject>>(
  styles: T,
): T {
  return styles;
}
export function getOverlayAlpha(elevation: number): number {
  return (
    Math.round(
      (elevation < 1
        ? 5.11916 * elevation ** 2
        : 4.5 * Math.log(elevation + 1) + 2) * 10,
    ) / 1000
  );
}
export function shouldSkipGeneratingVar(keys: string[]): boolean {
  return (
    ["motion", "focusVisible"].includes(keys[0]) ||
    /(cssVarPrefix|colorSchemeSelector|modularCssLayers|rootSelector|typography|mixins|breakpoints|direction|transitions|sxConfig$)/.test(
      keys[0],
    ) ||
    (keys[0] === "palette" &&
      /(mode|contrastThreshold|tonalOffset)/.test(keys[1] ?? ""))
  );
}
export function unstable_getUnit(value: string): string {
  return value.match(/[a-z%]+$/i)?.[0] ?? "";
}
export function unstable_toUnitless(value: string): number {
  return parseFloat(value);
}
export function unstable_createBreakpoints(
  options: BreakpointsOptions = {},
): Breakpoints {
  return createTheme({ breakpoints: options }).breakpoints;
}
export function experimental_sx(
  sx: SxProps,
): (props: { theme: Theme }) => CSSObject {
  return ({ theme }) => resolveSx(sx, theme);
}
export function private_createTypography(
  palette: Palette,
  options:
    | DeepPartial<TypographyVariants>
    | ((palette: Palette) => DeepPartial<TypographyVariants>) = {},
): TypographyVariants {
  return createTypography(
    typeof options === "function" ? options(palette) : options,
  );
}
export function withTheme<P extends object>(
  Component: (props: P & { theme: Theme }) => JSX.Element,
) {
  return (props: P) => <Component {...props} theme={useTheme()} />;
}
export function makeStyles<K extends string>(
  styles: Record<K, CSSObject> | ((theme: Theme) => Record<K, CSSObject>),
) {
  return () => {
    const theme = useTheme();
    const classes = createMemo(
      () =>
        Object.fromEntries(
          Object.entries(
            typeof styles === "function" ? styles(theme) : styles,
          ).map(([key, value]) => [key, css(value as CSSObject)]),
        ) as Record<K, string>,
    );
    return new Proxy({} as Record<K, string>, {
      get: (_, key) => classes()[key as K],
      ownKeys: () => Object.keys(classes()),
      getOwnPropertyDescriptor: () => ({
        enumerable: true,
        configurable: true,
      }),
    });
  };
}
export function withStyles<K extends string>(
  styles: Record<K, CSSObject> | ((theme: Theme) => Record<K, CSSObject>),
) {
  return <P extends { classes?: Partial<Record<K, string>> }>(
      Component: (props: P) => JSX.Element,
    ) =>
    (props: P) => {
      const generated = makeStyles(styles)();
      const classes = createMemo(
        () =>
          Object.fromEntries(
            Object.keys(generated).map((k) => [
              k,
              [generated[k as K], props.classes?.[k as K]]
                .filter(Boolean)
                .join(" "),
            ]),
          ) as Record<K, string>,
      );
      return <Component {...props} classes={classes()} />;
    };
}
export const keyframes = (...styles: CSSInterpolation[]): string =>
  (getOwner() ? useStyleCache() : getDefaultStyleCache()).keyframes(...styles);

export {
  adaptV4Theme,
  enhanceHighContrast,
  private_excludeVariablesFromRoot,
  private_applyChildrenFocusVisible,
  private_applyInsetFocusVisible,
  private_outsetFocusRing,
} from "./compatibility";
export type {
  DeprecatedThemeOptions,
  HighContrastTokens,
} from "./compatibility";

export type {
  CssVarsPalette,
  ColorSystem,
  ColorSystemOptions,
  Opacity,
  Overlays,
  PaletteBackgroundChannel,
  PaletteCommonChannel,
  PaletteColorChannel,
  PaletteActionChannel,
  PaletteTextChannel,
  PaletteAlert,
  PaletteAppBar,
  PaletteAvatar,
  PaletteButton,
  PaletteChip,
  PaletteFilledInput,
  PaletteInput,
  PaletteLinearProgress,
  PaletteSkeleton,
  PaletteSlider,
  PaletteSnackbarContent,
  PaletteSpeedDialAction,
  PaletteStepConnector,
  PaletteStepContent,
  PaletteSwitch,
  PaletteTableCell,
  PaletteTooltip,
} from "./color-system";

export {
  alpha,
  lighten,
  darken,
  getLuminance,
  getContrastRatio,
  emphasize,
  hexToRgb,
  hslToRgb,
  rgbToHex,
  decomposeColor,
  recomposeColor,
  colorChannel,
  blend,
} from "./color-manipulator";
export type {
  ColorFormat,
  ColorObject,
  SupportedColorSpace,
} from "./color-manipulator";
