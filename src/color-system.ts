import {
  private_safeAlpha as alpha,
  private_safeDarken as darken,
  private_safeEmphasize as emphasize,
  hslToRgb,
  private_safeLighten as lighten,
} from "./color-manipulator";
import { nativeMix } from "./theme-color";
import { getOverlayAlpha } from "./theme";
import type { Palette, PaletteColor } from "./theme";

export type Overlays = [
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
];
export interface Opacity {
  inputPlaceholder: number;
  inputUnderline: number;
  switchTrackDisabled: number;
  switchTrack: number;
}
export interface PaletteBackgroundChannel {
  defaultChannel: string;
  paperChannel: string;
}
export interface PaletteCommonChannel {
  background: string;
  backgroundChannel: string;
  onBackground: string;
  onBackgroundChannel: string;
}
export interface PaletteColorChannel {
  mainChannel: string;
  lightChannel: string;
  darkChannel: string;
  contrastTextChannel: string;
}
export interface PaletteActionChannel {
  activeChannel: string;
  selectedChannel: string;
}
export interface PaletteTextChannel {
  primaryChannel: string;
  secondaryChannel: string;
}
export interface PaletteAlert {
  errorColor: string;
  infoColor: string;
  successColor: string;
  warningColor: string;
  errorFilledBg: string;
  infoFilledBg: string;
  successFilledBg: string;
  warningFilledBg: string;
  errorFilledColor: string;
  infoFilledColor: string;
  successFilledColor: string;
  warningFilledColor: string;
  errorStandardBg: string;
  infoStandardBg: string;
  successStandardBg: string;
  warningStandardBg: string;
  errorIconColor: string;
  infoIconColor: string;
  successIconColor: string;
  warningIconColor: string;
}
export interface PaletteAppBar {
  defaultBg: string;
  darkBg: string;
  darkColor: string;
}
export interface PaletteAvatar {
  defaultBg: string;
}
export interface PaletteButton {
  inheritContainedBg: string;
  inheritContainedHoverBg: string;
}
export interface PaletteChip {
  defaultBorder: string;
  defaultAvatarColor: string;
  defaultIconColor: string;
}
export interface PaletteFilledInput {
  bg: string;
  hoverBg: string;
  disabledBg: string;
}
export interface PaletteInput {
  autofillWebkitBoxShadow: string;
}
export interface PaletteLinearProgress {
  primaryBg: string;
  secondaryBg: string;
  errorBg: string;
  infoBg: string;
  successBg: string;
  warningBg: string;
}
export interface PaletteSkeleton {
  bg: string;
}
export interface PaletteSlider {
  primaryTrack: string;
  secondaryTrack: string;
  errorTrack: string;
  infoTrack: string;
  successTrack: string;
  warningTrack: string;
}
export interface PaletteSnackbarContent {
  bg: string;
  color: string;
}
export interface PaletteSpeedDialAction {
  fabHoverBg: string;
}
export interface PaletteStepConnector {
  border: string;
}
export interface PaletteStepContent {
  border: string;
}
export interface PaletteSwitch {
  defaultColor: string;
  defaultDisabledColor: string;
  primaryDisabledColor: string;
  secondaryDisabledColor: string;
  errorDisabledColor: string;
  infoDisabledColor: string;
  successDisabledColor: string;
  warningDisabledColor: string;
}
export interface PaletteTableCell {
  border: string;
}
export interface PaletteTooltip {
  bg: string;
}
export type CssVarsPalette = {
  common: PaletteCommonChannel;
  primary: PaletteColorChannel;
  secondary: PaletteColorChannel;
  error: PaletteColorChannel;
  info: PaletteColorChannel;
  success: PaletteColorChannel;
  warning: PaletteColorChannel;
  text: PaletteTextChannel;
  background: PaletteBackgroundChannel;
  dividerChannel: string;
  action: PaletteActionChannel;
  Alert: PaletteAlert;
  AppBar: PaletteAppBar;
  Avatar: PaletteAvatar;
  Button: PaletteButton;
  Chip: PaletteChip;
  FilledInput: PaletteFilledInput;
  Input: PaletteInput;
  LinearProgress: PaletteLinearProgress;
  Skeleton: PaletteSkeleton;
  Slider: PaletteSlider;
  SnackbarContent: PaletteSnackbarContent;
  SpeedDialAction: PaletteSpeedDialAction;
  StepConnector: PaletteStepConnector;
  StepContent: PaletteStepContent;
  Switch: PaletteSwitch;
  TableCell: PaletteTableCell;
  Tooltip: PaletteTooltip;
};
export type ColorSystemPalette = Palette & CssVarsPalette;
export interface ColorSystemOptions {
  palette?: Partial<Palette> & Partial<CssVarsPalette>;
  opacity?: Partial<Opacity>;
  overlays?: Overlays;
  cssVarPrefix?: string;
  nativeColor?: boolean;
  colorSpace?: string;
}
export interface ColorSystem {
  palette: ColorSystemPalette;
  opacity: Opacity;
  overlays: Overlays;
}
export type ThemeVars = Record<string, unknown> & {
  palette: CssVarsPalette;
  opacity: Opacity;
  overlays: Overlays;
};

const componentNodes = [
  "Alert",
  "AppBar",
  "Avatar",
  "Button",
  "Chip",
  "FilledInput",
  "Input",
  "LinearProgress",
  "Skeleton",
  "Slider",
  "SnackbarContent",
  "SpeedDialAction",
  "StepConnector",
  "StepContent",
  "Switch",
  "TableCell",
  "Tooltip",
] as const;
type DynamicPalette = Record<string, any>;

function colorChannel(color: unknown): string | undefined {
  if (typeof color !== "string") return undefined;
  const value = color.startsWith("hsl") ? hslToRgb(color) : color;
  const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(value);
  if (hex) {
    const digits =
      hex[1].length === 3 ? [...hex[1]].map((x) => x + x).join("") : hex[1];
    return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16)).join(" ");
  }
  const rgb = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(value);
  return rgb
    ? `${Math.round(+rgb[1])} ${Math.round(+rgb[2])} ${Math.round(+rgb[3])}`
    : undefined;
}
function varColor(
  palette: DynamicPalette,
  prefix: string,
  group: string,
  key: string,
): string | undefined {
  const fallback = palette[group]?.[key];
  return fallback == null
    ? undefined
    : `var(--${prefix ? `${prefix}-` : ""}palette-${group}-${key}, ${fallback})`;
}
function setDefault(
  node: DynamicPalette,
  key: string,
  value: string | undefined,
): void {
  if (node[key] == null && value != null) node[key] = value;
}
function adjust(
  color: unknown,
  fn: (color: string, coefficient: number) => string,
  coefficient: number,
): string | undefined {
  if (typeof color !== "string") return undefined;
  try {
    return fn(color, coefficient);
  } catch {
    return undefined;
  }
}
function assignToneBase(
  palette: DynamicPalette,
  node: string,
  key: string,
  group: string,
  shade: string,
  fn: "lighten" | "darken",
  coefficient: number,
): void {
  setDefault(
    palette[node],
    key,
    adjust(
      palette[group]?.[shade],
      fn === "lighten" ? lighten : darken,
      coefficient,
    ),
  );
}

/** Adds upstream CSS-variable palette channels and component tokens, preserving supplied values. */
export function augmentCssVarsPalette<P extends Palette>(
  palette: P,
  cssVarPrefix = "mui",
  options: Pick<ColorSystemOptions, "nativeColor" | "colorSpace"> = {},
): P & CssVarsPalette {
  const p = palette as unknown as DynamicPalette;
  const dark = p.mode === "dark";
  const colorSpace = options.nativeColor ? "oklch" : options.colorSpace;
  const nativeColor = options.nativeColor;
  const reference = (group: string, shade: string): string =>
    nativeColor
      ? `var(--${cssVarPrefix ? `${cssVarPrefix}-` : ""}palette-${group}-${shade})`
      : p[group][shade];
  const mix = (
    color: string,
    operation: "lighten" | "darken" | "alpha",
    coefficient: number,
  ): string | undefined =>
    colorSpace
      ? nativeMix(
          color,
          operation === "lighten"
            ? "#fff"
            : operation === "darken"
              ? "#000"
              : "transparent",
          operation === "alpha" ? 1 - coefficient : coefficient,
          colorSpace,
        )
      : adjust(
          color,
          operation === "lighten"
            ? lighten
            : operation === "darken"
              ? darken
              : alpha,
          coefficient,
        );
  const assignTone: typeof assignToneBase = (
    palette,
    node,
    key,
    group,
    shade,
    operation,
    coefficient,
  ) => {
    if (colorSpace)
      setDefault(
        palette[node],
        key,
        mix(reference(group, shade), operation, coefficient),
      );
    else
      assignToneBase(palette, node, key, group, shade, operation, coefficient);
  };

  p.common ??= {};
  setDefault(p.common, "background", dark ? "#000" : "#fff");
  setDefault(p.common, "onBackground", dark ? "#fff" : "#000");
  for (const node of componentNodes) p[node] ??= {};

  // Alert
  for (const color of ["error", "info", "success", "warning"]) {
    const group = p[color] as PaletteColor | undefined;
    assignTone(
      p,
      "Alert",
      `${color}Color`,
      color,
      "light",
      dark ? "lighten" : "darken",
      0.6,
    );
    setDefault(
      p.Alert,
      `${color}FilledBg`,
      varColor(p, cssVarPrefix, color, dark ? "dark" : "main"),
    );
    setDefault(
      p.Alert,
      `${color}FilledColor`,
      group && p.getContrastText?.(dark ? group.dark : group.main),
    );
    assignTone(
      p,
      "Alert",
      `${color}StandardBg`,
      color,
      "light",
      dark ? "darken" : "lighten",
      0.9,
    );
    setDefault(
      p.Alert,
      `${color}IconColor`,
      varColor(p, cssVarPrefix, color, "main"),
    );
  }

  setDefault(
    p.AppBar,
    "defaultBg",
    varColor(p, cssVarPrefix, "grey", dark ? "900" : "100"),
  );
  if (dark) {
    setDefault(
      p.AppBar,
      "darkBg",
      varColor(p, cssVarPrefix, "background", "paper"),
    );
    setDefault(
      p.AppBar,
      "darkColor",
      varColor(p, cssVarPrefix, "text", "primary"),
    );
  }
  setDefault(
    p.Avatar,
    "defaultBg",
    varColor(p, cssVarPrefix, "grey", dark ? "600" : "400"),
  );
  setDefault(
    p.Button,
    "inheritContainedBg",
    varColor(p, cssVarPrefix, "grey", dark ? "800" : "300"),
  );
  setDefault(
    p.Button,
    "inheritContainedHoverBg",
    varColor(p, cssVarPrefix, "grey", dark ? "700" : "A100"),
  );
  setDefault(
    p.Chip,
    "defaultBorder",
    varColor(p, cssVarPrefix, "grey", dark ? "700" : "400"),
  );
  setDefault(
    p.Chip,
    "defaultAvatarColor",
    varColor(p, cssVarPrefix, "grey", dark ? "300" : "700"),
  );
  setDefault(
    p.Chip,
    "defaultIconColor",
    varColor(p, cssVarPrefix, "grey", dark ? "300" : "700"),
  );
  for (const [key, value] of Object.entries(
    dark
      ? {
          bg: "rgba(255, 255, 255, 0.09)",
          hoverBg: "rgba(255, 255, 255, 0.13)",
          disabledBg: "rgba(255, 255, 255, 0.12)",
        }
      : {
          bg: "rgba(0, 0, 0, 0.06)",
          hoverBg: "rgba(0, 0, 0, 0.09)",
          disabledBg: "rgba(0, 0, 0, 0.12)",
        },
  ))
    setDefault(p.FilledInput, key, value);
  setDefault(
    p.Input,
    "autofillWebkitBoxShadow",
    dark ? "0 0 0 100px #266798 inset" : "none",
  );

  for (const [group, token] of [
    ["primary", "primaryBg"],
    ["secondary", "secondaryBg"],
    ["error", "errorBg"],
    ["info", "infoBg"],
    ["success", "successBg"],
    ["warning", "warningBg"],
  ]) {
    assignTone(
      p,
      "LinearProgress",
      token,
      group,
      "main",
      dark ? "darken" : "lighten",
      dark ? 0.5 : 0.62,
    );
  }
  const textPrimaryChannel = colorChannel(p.text?.primary);
  if (colorSpace)
    setDefault(
      p.Skeleton,
      "bg",
      mix(reference("text", "primary"), "alpha", dark ? 0.13 : 0.11),
    );
  else if (textPrimaryChannel)
    setDefault(
      p.Skeleton,
      "bg",
      `rgba(var(--${cssVarPrefix ? `${cssVarPrefix}-` : ""}palette-text-primaryChannel, ${textPrimaryChannel}) / ${dark ? 0.13 : 0.11})`,
    );
  for (const [group, token] of [
    ["primary", "primaryTrack"],
    ["secondary", "secondaryTrack"],
    ["error", "errorTrack"],
    ["info", "infoTrack"],
    ["success", "successTrack"],
    ["warning", "warningTrack"],
  ]) {
    assignTone(
      p,
      "Slider",
      token,
      group,
      "main",
      dark ? "darken" : "lighten",
      dark ? 0.5 : 0.62,
    );
  }
  const snackbarBg = p.background?.default;
  setDefault(
    p.SnackbarContent,
    "bg",
    colorSpace
      ? mix(
          reference("background", "default"),
          dark ? "lighten" : "darken",
          dark ? 0.985 : 0.6825,
        )
      : adjust(snackbarBg, emphasize, dark ? 0.98 : 0.8),
  );
  const snackbarDefault = p.SnackbarContent.bg;
  setDefault(
    p.SnackbarContent,
    "color",
    colorSpace
      ? dark
        ? "rgba(0, 0, 0, 0.87)"
        : "#fff"
      : typeof snackbarDefault === "string"
        ? p.getContrastText?.(snackbarDefault)
        : undefined,
  );
  setDefault(
    p.SpeedDialAction,
    "fabHoverBg",
    adjust(p.background?.paper, emphasize, 0.15),
  );
  setDefault(
    p.StepConnector,
    "border",
    varColor(p, cssVarPrefix, "grey", dark ? "600" : "400"),
  );
  setDefault(
    p.StepContent,
    "border",
    varColor(p, cssVarPrefix, "grey", dark ? "600" : "400"),
  );
  setDefault(
    p.Switch,
    "defaultColor",
    dark
      ? varColor(p, cssVarPrefix, "grey", "300")
      : varColor(p, cssVarPrefix, "common", "white"),
  );
  setDefault(
    p.Switch,
    "defaultDisabledColor",
    varColor(p, cssVarPrefix, "grey", dark ? "600" : "100"),
  );
  for (const group of [
    "primary",
    "secondary",
    "error",
    "info",
    "success",
    "warning",
  ]) {
    assignTone(
      p,
      "Switch",
      `${group}DisabledColor`,
      group,
      "main",
      dark ? "darken" : "lighten",
      dark ? 0.55 : 0.62,
    );
  }
  const divider =
    typeof p.divider === "string"
      ? colorSpace
        ? `oklch(from ${nativeColor ? `var(--${cssVarPrefix ? `${cssVarPrefix}-` : ""}palette-divider)` : p.divider} l c h / 1)`
        : alpha(p.divider, 1)
      : undefined;
  setDefault(
    p.TableCell,
    "border",
    divider === undefined
      ? undefined
      : mix(divider, dark ? "darken" : "lighten", dark ? 0.68 : 0.88),
  );
  const tooltipChannel = colorChannel(p.grey?.[700]);
  if (colorSpace)
    setDefault(p.Tooltip, "bg", mix(reference("grey", "700"), "alpha", 0.92));
  else if (tooltipChannel)
    setDefault(p.Tooltip, "bg", `rgba(${tooltipChannel} / 0.92)`);

  // Native colors are resolved by the browser, so fixed sRGB channel tokens are
  // intentionally absent. User supplied channels remain available.
  if (nativeColor) return palette as P & CssVarsPalette;

  const addChannel = (object: DynamicPalette, key: string) => {
    const channelKey = `${key}Channel`;
    if (!(channelKey in object)) {
      const channel = colorChannel(object[key]);
      if (channel !== undefined) object[channelKey] = channel;
    }
  };
  for (const group of [
    "primary",
    "secondary",
    "error",
    "info",
    "success",
    "warning",
  ])
    for (const key of ["main", "light", "dark", "contrastText"])
      if (p[group]?.[key] != null) addChannel(p[group], key);
  for (const [group, keys] of Object.entries({
    common: ["background", "onBackground"],
    background: ["default", "paper"],
    text: ["primary", "secondary"],
    action: ["active", "selected"],
  }))
    for (const key of keys)
      if (p[group]?.[key] != null) addChannel(p[group], key);
  if (p.divider != null && !("dividerChannel" in p)) addChannel(p, "divider");
  return palette as P & CssVarsPalette;
}

export function getOpacity(mode: "light" | "dark"): Opacity {
  return {
    inputPlaceholder: mode === "dark" ? 0.5 : 0.42,
    inputUnderline: mode === "dark" ? 0.7 : 0.42,
    switchTrackDisabled: mode === "dark" ? 0.2 : 0.12,
    switchTrack: mode === "dark" ? 0.3 : 0.38,
  };
}
export function getOverlays(mode: "light" | "dark"): Overlays {
  return (
    mode === "dark"
      ? Array.from({ length: 25 }, (_, i) =>
          i === 0
            ? "none"
            : `linear-gradient(rgba(255 255 255 / ${getOverlayAlpha(i)}), rgba(255 255 255 / ${getOverlayAlpha(i)}))`,
        )
      : []
  ) as Overlays;
}
export function createColorSystem<P extends Palette>(
  palette: P,
  options: ColorSystemOptions = {},
): ColorSystem & { palette: P & CssVarsPalette } {
  const input = options.palette
    ? ({ ...palette, ...options.palette } as P)
    : palette;
  const augmented = augmentCssVarsPalette(
    input,
    options.cssVarPrefix ?? "mui",
    options,
  );
  const mode = augmented.mode;
  return {
    palette: augmented,
    opacity: { ...getOpacity(mode), ...options.opacity },
    overlays: options.overlays || getOverlays(mode),
  };
}
