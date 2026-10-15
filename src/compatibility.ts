declare const process: { env?: { NODE_ENV?: string } };

import {
  createSpacing,
  type CSSObject,
  type Theme,
  type ThemeOptions,
} from "./theme";
import {
  accordionSummaryClasses,
  autocompleteClasses,
  checkboxClasses,
  filledInputClasses,
  formControlLabelClasses,
  formHelperTextClasses,
  formLabelClasses,
  inputClasses,
  listItemButtonClasses,
  menuItemClasses,
  nativeSelectClasses,
  outlinedInputClasses,
  radioClasses,
  sliderClasses,
  toggleButtonClasses,
} from "./utility-classes";

/** Theme options accepted by the deprecated v4 theme adapter. */
export type DeprecatedThemeOptions = ThemeOptions & {
  defaultProps?: Record<string, Record<string, unknown>>;
  props?: Record<string, Record<string, unknown>>;
  overrides?: Record<string, Record<string, unknown>>;
  styleOverrides?: Record<string, Record<string, unknown>>;
  palette?: ThemeOptions["palette"] & {
    type?: "light" | "dark";
    mode?: "light" | "dark";
  };
};

/**
 * Generate a theme base on the V4 theme options received.
 * @deprecated Follow the upgrade guide on https://mui.com/r/migration-v4#theme
 */
export function adaptV4Theme(
  inputTheme: DeprecatedThemeOptions = {},
): ThemeOptions {
  if (!isProduction()) {
    console.warn(
      [
        "MUI: adaptV4Theme() is deprecated.",
        "Follow the upgrade guide on https://mui.com/r/migration-v4#theme.",
      ].join("\n"),
    );
  }
  const {
    defaultProps = {},
    mixins = {},
    overrides = {},
    palette = {},
    props = {},
    styleOverrides = {},
    ...other
  } = inputTheme;
  const components: NonNullable<ThemeOptions["components"]> = {};
  const ensure = (name: string) =>
    (components[name] ??= {}) as import("./theme").ComponentConfig;

  // default props
  Object.keys(defaultProps).forEach((component) => {
    ensure(component).defaultProps = defaultProps[component];
  });
  Object.keys(props).forEach((component) => {
    ensure(component).defaultProps = props[component];
  });

  // CSS overrides
  Object.keys(styleOverrides).forEach((component) => {
    ensure(component).styleOverrides = styleOverrides[component] as never;
  });
  Object.keys(overrides).forEach((component) => {
    ensure(component).styleOverrides = overrides[component] as never;
  });

  // theme.spacing
  const spacing = createSpacing(inputTheme.spacing);

  // theme.mixins.gutters
  const values = {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
    ...inputTheme.breakpoints?.values,
  };
  const unit = inputTheme.breakpoints?.unit ?? "px";
  const up = (key: string) =>
    `@media (min-width:${values[key as keyof typeof values] ?? key}${unit})`;
  const sm = up("sm");
  const gutters = (styles: CSSObject = {}): CSSObject => ({
    paddingLeft: spacing(2),
    paddingRight: spacing(2),
    ...styles,
    [sm]: {
      paddingLeft: spacing(3),
      paddingRight: spacing(3),
      ...((styles[sm] as CSSObject | undefined) ?? {}),
    },
  });
  const themePalette = palette as NonNullable<ThemeOptions["palette"]> & {
    type?: string;
    mode?: string;
  };
  const { type: typeInput, mode: modeInput, ...paletteRest } = themePalette;
  const finalMode = modeInput || typeInput || "light";

  return {
    ...other,
    components,
    spacing: spacing as ThemeOptions["spacing"],
    mixins: { gutters, ...mixins } as unknown as ThemeOptions["mixins"],
    palette: {
      text: {
        hint:
          finalMode === "dark"
            ? "rgba(255, 255, 255, 0.5)"
            : "rgba(0, 0, 0, 0.38)",
      },
      mode: finalMode,
      type: finalMode,
      ...paletteRest,
    } as ThemeOptions["palette"],
  };
}

export interface HighContrastTokens {
  /** Color for disabled elements. @default 'GrayText' */ disabled?: string;
  /** Color for error states. @default 'ActiveText' */ error?: string;
  /** Background color for selected items. @default 'SelectedItem' */ selectedBackground?: string;
  /** Text color on selected items. @default 'SelectedItemText' */ selectedText?: string;
  /** Background color for active/toggled controls. @default 'Highlight' */ activeBackground?: string;
  /** Text color on active/toggled controls. @default 'HighlightText' */ activeText?: string;
  /** Border color for interactive controls. @default 'ButtonBorder' */ buttonBorder?: string;
  /** Text/icon color on buttons. @default 'ButtonText' */ buttonText?: string;
  /** Background color for the page/canvas. @default 'Canvas' */ canvas?: string;
}

const HCM = "@media (forced-colors: active)";

function isProduction(): boolean {
  return (
    typeof process !== "undefined" && process.env?.NODE_ENV === "production"
  );
}

/** Enhances a theme with styles for Windows High Contrast Mode (forced-colors). */
export function enhanceHighContrast<
  T extends { components?: Theme["components"] },
>(themeInput: T, tokens?: HighContrastTokens): T {
  const colors = {
    disabled: tokens?.disabled ?? "GrayText",
    error: tokens?.error ?? "ActiveText",
    selectedBackground: tokens?.selectedBackground ?? "SelectedItem",
    selectedText: tokens?.selectedText ?? "SelectedItemText",
    activeBackground: tokens?.activeBackground ?? "Highlight",
    activeText: tokens?.activeText ?? "HighlightText",
    buttonBorder: tokens?.buttonBorder ?? "ButtonBorder",
    buttonText: tokens?.buttonText ?? "ButtonText",
    canvas: tokens?.canvas ?? "Canvas",
  };
  const components = { ...themeInput.components } as Record<
    string,
    import("./theme").ComponentConfig | undefined
  >;
  const add = (name: string, overrides: Record<string, unknown>) => {
    const previous = components[name] ?? {};
    const oldOverrides = previous.styleOverrides ?? {};
    components[name] = {
      ...previous,
      styleOverrides: { ...oldOverrides, ...overrides },
    } as never;
  };
  const previous = (name: string, slot: string) =>
    components[name]?.styleOverrides?.[slot];
  const append = (name: string, slot: string, rule: unknown) => [
    previous(name, slot),
    rule,
  ];

  add("MuiAccordionSummary", {
    root: append("MuiAccordionSummary", "root", {
      [`&.${accordionSummaryClasses.disabled}`]: { [HCM]: { opacity: 1 } },
    }),
  });
  add("MuiAutocomplete", {
    listbox: append("MuiAutocomplete", "listbox", {
      [`& .${autocompleteClasses.option}`]: {
        '&[aria-disabled="true"]': {
          [HCM]: { color: colors.disabled, opacity: 1 },
        },
        [`&.${autocompleteClasses.focused}, &.${autocompleteClasses.focusVisible}`]:
          {
            [HCM]: {
              forcedColorAdjust: "none",
              color: colors.activeText,
              backgroundColor: colors.activeBackground,
            },
          },
        '&[aria-selected="true"]': {
          [HCM]: {
            forcedColorAdjust: "none",
            color: colors.selectedText,
            backgroundColor: colors.selectedBackground,
          },
          [`&.${autocompleteClasses.focused}`]: {
            [HCM]: {
              color: colors.activeText,
              backgroundColor: colors.activeBackground,
            },
          },
        },
      },
    }),
  });
  add("MuiCheckbox", {
    root: append("MuiCheckbox", "root", {
      [`&.${checkboxClasses.disabled}`]: { [HCM]: { color: colors.disabled } },
    }),
  });
  add("MuiFilledInput", {
    root: append("MuiFilledInput", "root", {
      [`&.${filledInputClasses.error}`]: {
        "&::before, &::after": { [HCM]: { borderBottomColor: colors.error } },
      },
      [`&.${filledInputClasses.disabled}:before`]: {
        [HCM]: {
          borderBottomStyle: "solid",
          borderBottomColor: colors.disabled,
        },
      },
      [`&.${filledInputClasses.disabled}`]: {
        [HCM]: { color: colors.disabled },
      },
    }),
  });
  add("MuiFormControlLabel", {
    root: append("MuiFormControlLabel", "root", {
      [`& .${formControlLabelClasses.label}.${formControlLabelClasses.disabled}`]:
        { [HCM]: { color: colors.disabled } },
    }),
  });
  add("MuiFormHelperText", {
    root: append("MuiFormHelperText", "root", {
      [`&.${formHelperTextClasses.error}`]: { [HCM]: { color: colors.error } },
      [`&.${formHelperTextClasses.disabled}`]: {
        [HCM]: { color: colors.disabled },
      },
    }),
  });
  add("MuiFormLabel", {
    root: append("MuiFormLabel", "root", {
      [`&.${formLabelClasses.error}`]: { [HCM]: { color: colors.error } },
      [`&.${formLabelClasses.disabled}`]: { [HCM]: { color: colors.disabled } },
    }),
  });
  add("MuiInput", {
    root: append("MuiInput", "root", {
      [`&.${inputClasses.error}`]: {
        "&::before, &::after": { [HCM]: { borderBottomColor: colors.error } },
      },
      [`&.${inputClasses.disabled}:before`]: {
        [HCM]: {
          borderBottomStyle: "solid",
          borderBottomColor: colors.disabled,
        },
      },
      [`&.${inputClasses.disabled}`]: { [HCM]: { color: colors.disabled } },
    }),
  });
  add("MuiLinearProgress", {
    root: append("MuiLinearProgress", "root", {
      [HCM]: {
        forcedColorAdjust: "none",
        outline: `1px solid ${colors.buttonBorder}`,
        backgroundColor: colors.canvas,
      },
    }),
    bar: append("MuiLinearProgress", "bar", {
      [HCM]: { backgroundColor: colors.buttonText },
    }),
    bar2: append("MuiLinearProgress", "bar2", {
      variants: [
        {
          props: { variant: "buffer" },
          style: { [HCM]: { backgroundColor: colors.disabled } },
        },
      ],
    }),
  });
  add("MuiInputBase", {
    input: append("MuiInputBase", "input", {
      [HCM]: { "&::placeholder": { opacity: 1 } },
    }),
  });
  add("MuiMenuItem", {
    root: append("MuiMenuItem", "root", {
      [`&.${menuItemClasses.disabled}`]: {
        [HCM]: { color: colors.disabled, opacity: 1 },
      },
      [`&.${menuItemClasses.focusVisible}, &:hover`]: {
        [HCM]: {
          forcedColorAdjust: "none",
          color: colors.activeText,
          backgroundColor: colors.activeBackground,
          outline: "none",
        },
      },
      [`&.${menuItemClasses.selected}`]: {
        [HCM]: {
          forcedColorAdjust: "none",
          color: colors.selectedText,
          backgroundColor: colors.selectedBackground,
        },
      },
      [`&.${menuItemClasses.selected}.${menuItemClasses.focusVisible}, &.${menuItemClasses.selected}:hover`]:
        {
          [HCM]: {
            color: colors.activeText,
            backgroundColor: colors.activeBackground,
          },
        },
    }),
  });
  add("MuiListItemIcon", {
    root: append("MuiListItemIcon", "root", { [HCM]: { color: "inherit" } }),
  });
  add("MuiListItemButton", {
    root: append("MuiListItemButton", "root", {
      [`&.${listItemButtonClasses.focusVisible}, &:hover`]: {
        [HCM]: {
          forcedColorAdjust: "none",
          color: colors.activeText,
          backgroundColor: colors.activeBackground,
        },
      },
      [`&.${listItemButtonClasses.selected}`]: {
        [HCM]: {
          forcedColorAdjust: "none",
          color: colors.selectedText,
          backgroundColor: colors.selectedBackground,
        },
      },
      [`&.${listItemButtonClasses.selected}.${listItemButtonClasses.focusVisible}, &.${listItemButtonClasses.selected}:hover`]:
        {
          [HCM]: {
            color: colors.activeText,
            backgroundColor: colors.activeBackground,
          },
        },
    }),
  });
  add("MuiNativeSelect", {
    icon: append("MuiNativeSelect", "icon", {
      [`&.${nativeSelectClasses.disabled}`]: {
        [HCM]: { color: colors.disabled },
      },
    }),
  });
  add("MuiOutlinedInput", {
    root: append("MuiOutlinedInput", "root", {
      [`&.${outlinedInputClasses.error} .${outlinedInputClasses.notchedOutline}`]:
        { [HCM]: { borderColor: colors.error } },
      [`&.${outlinedInputClasses.disabled} .${outlinedInputClasses.notchedOutline}`]:
        { [HCM]: { borderColor: colors.disabled } },
      [`&.${outlinedInputClasses.disabled}`]: {
        [HCM]: { color: colors.disabled },
      },
    }),
  });
  add("MuiRadio", {
    root: append("MuiRadio", "root", {
      [`&.${radioClasses.disabled}`]: { [HCM]: { color: colors.disabled } },
    }),
  });
  add("MuiSlider", {
    track: append(
      "MuiSlider",
      "track",
      ({ ownerState }: { ownerState: { disabled?: boolean } }) => ({
        ...(ownerState.disabled && { [HCM]: { borderColor: colors.disabled } }),
      }),
    ),
    thumb: append("MuiSlider", "thumb", {
      [`&.${sliderClasses.disabled}`]: {
        [HCM]: { borderColor: colors.disabled },
      },
    }),
  });
  add("MuiSwitch", {
    track: append(
      "MuiSwitch",
      "track",
      ({ ownerState }: { ownerState: { disabled?: boolean } }) => ({
        ...(ownerState.disabled && { [HCM]: { borderColor: colors.disabled } }),
      }),
    ),
    thumb: append(
      "MuiSwitch",
      "thumb",
      ({ ownerState }: { ownerState: { disabled?: boolean } }) => ({
        ...(ownerState.disabled && { [HCM]: { borderColor: colors.disabled } }),
      }),
    ),
  });
  add("MuiButtonBase", {
    root: append("MuiButtonBase", "root", {
      [HCM]: {
        "&:focus-visible, &:focus-within:has(input:focus-visible)": {
          outline: `5px auto ${colors.activeBackground}`,
        },
      },
    }),
  });
  add("MuiTooltip", {
    tooltip: append("MuiTooltip", "tooltip", {
      [HCM]: { border: `1px solid ${colors.buttonText}` },
    }),
  });
  add("MuiToggleButton", {
    root: append("MuiToggleButton", "root", {
      [`&.${toggleButtonClasses.selected}`]: {
        [HCM]: {
          forcedColorAdjust: "none",
          color: colors.activeText,
          backgroundColor: colors.activeBackground,
          borderColor: colors.activeBackground,
        },
        "&:hover": {
          [HCM]: {
            backgroundColor: colors.activeBackground,
            borderColor: colors.buttonBorder,
          },
        },
      },
    }),
  });

  return { ...themeInput, components };
}

const focusVisibleOffsetVar = "--_focusVisible-offset";
const focusVisibleBehaviorVar = "--_focusVisible-behavior";
const focusVisibleShadowVar = "--_focusVisible-shadow";

// Spread on a root whose ring must stay outset: inset vars inherit to descendants.
export const private_outsetFocusRing: CSSObject = {
  [focusVisibleOffsetVar]: 1,
  [focusVisibleBehaviorVar]: "initial",
};

// Used by colored-background surfaces to let the parent control the focus ring color.
export function private_applyChildrenFocusVisible(color: string): CSSObject {
  return { [focusVisibleShadowVar]: color };
}

// Clip-prone components use this to keep the ring visible when an ancestor clips overflow.
export function private_applyInsetFocusVisible(offset: number): CSSObject {
  return {
    [focusVisibleOffsetVar]: -offset,
    [focusVisibleBehaviorVar]: "inset",
  };
}

/** @internal Omit generated CSS variables from the root stylesheet for the default dark scheme. */
export function private_excludeVariablesFromRoot(
  cssVarPrefix?: string,
): string[] {
  const prefix = cssVarPrefix ? `${cssVarPrefix}-` : "";
  return [
    ...Array.from({ length: 25 }, (_, index) => `--${prefix}overlays-${index}`),
    `--${prefix}palette-AppBar-darkBg`,
    `--${prefix}palette-AppBar-darkColor`,
  ];
}
