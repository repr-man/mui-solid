import { createMemo, createSignal, merge, omit, untrack } from "solid-js";
import type { Accessor } from "solid-js";
import { dynamic } from "@solidjs/web";
import { generateUtilityClass } from "./utility-classes";
import { componentClassSlots } from "./class-slots";
import type { JSX, ValidComponent } from "@solidjs/web";
import {
  useTheme,
  resolveSx,
  css,
  useThemeProps,
  internal_layerStyles,
} from "./theme";
import type { SxProps, Theme, CSSObject } from "./theme";

export type Color =
  | "inherit"
  | "primary"
  | "secondary"
  | "error"
  | "info"
  | "success"
  | "warning";
export type Size = "small" | "medium" | "large";
export type SlotProps = Record<
  string,
  object | ((state: Record<string, unknown>) => object)
>;
export interface MuiProps extends Omit<
  JSX.HTMLAttributes<HTMLElement>,
  "color" | "style" | "class" | "onChange" | "onInput" | "onClose" | "title"
> {
  tabIndex?: number;
  title?: JSX.Element;
  component?: ValidComponent;
  sx?: SxProps;
  class?: JSX.HTMLAttributes<HTMLElement>["class"];
  className?: string;
  style?: JSX.CSSProperties;
  classes?: Partial<Record<string, string>>;
  slots?: Partial<Record<string, ValidComponent>>;
  slotProps?: SlotProps;
}
export type StyleInput =
  | import("@emotion/serialize").CSSInterpolation
  | ((theme: Theme) => import("@emotion/serialize").CSSInterpolation);
export function useProps<P extends object>(name: string, props: P): P {
  return useThemeProps({ name, props });
}
export function useControlled<T>(
  value: () => T | undefined,
  initial: () => T,
): [Accessor<T>, (next: T | ((prev: T) => T)) => void] {
  const [local, setLocal] = createSignal<T>(() => untrack(initial));
  return [
    () => {
      const controlled = value();
      return controlled === undefined ? local() : controlled;
    },
    (next) => {
      if (value() === undefined) setLocal(next as never);
    },
  ];
}
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
export function callHandler<E>(handler: unknown, event: E): void {
  if (typeof handler === "function") handler(event);
  else if (Array.isArray(handler) && typeof handler[0] === "function")
    handler[0](handler[1], event);
}
export function setRef<T>(ref: unknown, value: T) {
  if (Array.isArray(ref)) ref.forEach((item) => setRef(item, value));
  else if (typeof ref === "function") ref(value);
  else if (ref && typeof ref === "object")
    (ref as { current: T }).current = value;
}
export function slotProps(
  props: MuiProps,
  slot: string,
  state: Record<string, unknown> = {},
): Record<string, unknown> {
  const source = props.slotProps?.[slot];
  return (
    typeof source === "function" ? source(state) : (source ?? {})
  ) as Record<string, unknown>;
}
const excluded = new Set([
  "variantMapping",
  "enableColorOnDark",
  "imgProps",
  "cols",
  "rowHeight",
  "hover",
  "light",
  "raised",
  "ActionsComponent",
  "ContainerComponent",
  "ContainerProps",
  "valueBuffer",
  "thickness",
  "disableShrink",
  "ownerState",
  "theme",
  "as",
  "tabIndex",
  "component",
  "sx",
  "class",
  "className",
  "style",
  "classes",
  "slots",
  "slotProps",
  "children",
  "color",
  "size",
  "variant",
  "elevation",
  "square",
  "fullWidth",
  "fullHeight",
  "margin",
  "padding",
  "spacing",
  "direction",
  "divider",
  "alignItems",
  "justifyContent",
  "disableElevation",
  "disableRipple",
  "disableFocusRipple",
  "focusRipple",
  "focusVisibleClassName",
  "centerRipple",
  "TouchRippleProps",
  "touchRippleRef",
  "action",
  "startIcon",
  "endIcon",
  "loading",
  "loadingPosition",
  "loadingIndicator",
  "edge",
  "orientation",
  "exclusive",
  "selected",
  "checkedIcon",
  "icon",
  "indeterminate",
  "indeterminateIcon",
  "inputRef",
  "inputProps",
  "inputComponent",
  "defaultChecked",
  "label",
  "labelPlacement",
  "helperText",
  "error",
  "focused",
  "shrink",
  "notched",
  "multiline",
  "minRows",
  "maxRows",
  "rows",
  "startAdornment",
  "endAdornment",
  "disableUnderline",
  "hiddenLabel",
  "InputProps",
  "InputLabelProps",
  "FormHelperTextProps",
  "SelectProps",
  "options",
  "getOptionLabel",
  "getOptionValue",
  "getOptionKey",
  "getOptionDisabled",
  "isOptionEqualToValue",
  "renderInput",
  "renderOption",
  "renderTags",
  "renderValue",
  "filterOptions",
  "filterSelectedOptions",
  "freeSolo",
  "clearOnBlur",
  "selectOnFocus",
  "autoHighlight",
  "autoSelect",
  "autoComplete",
  "blurOnSelect",
  "disableClearable",
  "disableCloseOnSelect",
  "disableListWrap",
  "includeInputInList",
  "handleHomeEndKeys",
  "openOnFocus",
  "groupBy",
  "limitTags",
  "clearText",
  "closeText",
  "openText",
  "noOptionsText",
  "loadingText",
  "popupIcon",
  "clearIcon",
  "onInputChange",
  "onHighlightChange",
  "open",
  "defaultOpen",
  "onOpen",
  "onClose",
  "anchorEl",
  "anchorOrigin",
  "transformOrigin",
  "placement",
  "disablePortal",
  "container",
  "keepMounted",
  "disableAutoFocus",
  "disableEnforceFocus",
  "disableRestoreFocus",
  "disableScrollLock",
  "disableEscapeKeyDown",
  "hideBackdrop",
  "BackdropProps",
  "BackdropComponent",
  "closeAfterTransition",
  "transitionDuration",
  "TransitionComponent",
  "TransitionProps",
  "PaperProps",
  "ModalProps",
  "MenuListProps",
  "MenuProps",
  "PopperProps",
  "arrow",
  "title",
  "enterDelay",
  "leaveDelay",
  "enterNextDelay",
  "enterTouchDelay",
  "leaveTouchDelay",
  "followCursor",
  "disableHoverListener",
  "disableFocusListener",
  "disableTouchListener",
  "describeChild",
  "maxWidth",
  "disableGutters",
  "fixed",
  "container",
  "columns",
  "rowSpacing",
  "columnSpacing",
  "offset",
  "wrap",
  "useFlexGap",
  "zeroMinWidth",
  "badgeContent",
  "max",
  "showZero",
  "invisible",
  "overlap",
  "anchorOrigin",
  "src",
  "srcSet",
  "alt",
  "imgProps",
  "sizes",
  "total",
  "renderSurplus",
  "deleteIcon",
  "onDelete",
  "clickable",
  "avatar",
  "primary",
  "secondary",
  "inset",
  "dense",
  "disablePadding",
  "disableTypography",
  "primaryTypographyProps",
  "secondaryTypographyProps",
  "secondaryAction",
  "alignItems",
  "subheader",
  "stickyHeader",
  "sortDirection",
  "padding",
  "numeric",
  "scope",
  "active",
  "hideSortIcon",
  "count",
  "page",
  "defaultPage",
  "rowsPerPage",
  "rowsPerPageOptions",
  "onPageChange",
  "onRowsPerPageChange",
  "labelRowsPerPage",
  "labelDisplayedRows",
  "showFirstButton",
  "showLastButton",
  "getItemAriaLabel",
  "boundaryCount",
  "siblingCount",
  "hideNextButton",
  "hidePrevButton",
  "renderItem",
  "shape",
  "valueLabelDisplay",
  "valueLabelFormat",
  "getAriaLabel",
  "getAriaValueText",
  "marks",
  "min",
  "max",
  "step",
  "scale",
  "track",
  "disableSwap",
  "onChangeCommitted",
  "precision",
  "highlightSelectedOnly",
  "emptyIcon",
  "emptyLabelText",
  "getLabelText",
  "readOnly",
  "maxLength",
  "activeStep",
  "nonLinear",
  "alternativeLabel",
  "completed",
  "connector",
  "expanded",
  "defaultExpanded",
  "disabled",
  "optional",
  "index",
  "last",
  "StepIconComponent",
  "StepIconProps",
  "expandIcon",
  "severity",
  "action",
  "iconMapping",
  "onClickAway",
  "message",
  "autoHideDuration",
  "resumeHideDuration",
  "disableWindowBlurListener",
  "anchorOrigin",
  "ContentProps",
  "in",
  "appear",
  "enter",
  "exit",
  "timeout",
  "easing",
  "mountOnEnter",
  "unmountOnExit",
  "collapsedSize",
  "addEndListener",
  "onEnter",
  "onEntering",
  "onEntered",
  "onExit",
  "onExiting",
  "onExited",
  "nodeRef",
  "centered",
  "wrapped",
  "showLabel",
  "ariaLabel",
  "openIcon",
  "FabProps",
  "tooltipTitle",
  "tooltipOpen",
  "tooltipPlacement",
  "delay",
  "onTransitionEnter",
  "onTransitionExited",
  "anchorPosition",
  "anchorReference",
  "marginThreshold",
  "popperOptions",
  "popperRef",
  "modifiers",
  "transition",
  "fullScreen",
  "dividers",
  "disableSpacing",
  "isEnabled",
  "getTabbable",
  "disabledItemsFocusable",
  "autoFocusItem",
  "disableTouchRipple",
  "LinkComponent",
  "nativeButton",
  "onFocusVisible",
  "row",
  "select",
  "displayEmpty",
  "renderValue",
  "labelId",
  "native",
  "autoWidth",
  "SelectDisplayProps",
  "IconComponent",
  "input",
  "getLimitTagsText",
  "forcePopupIcon",
  "clearOnEscape",
  "resetHighlightOnMouseLeave",
  "shiftStep",
  "onChangeActive",
  "disableAnimation",
  "disablePointerEvents",
  "allowSwipeInChildren",
  "disableBackdropTransition",
  "disablePrefersReducedMotion",
  "_name",
  "_styles",
  "kind",
  "_variant",
  "textColor",
  "indicatorColor",
  "selectionFollowsFocus",
  "scrollButtons",
  "allowScrollButtonsMobile",
  "visibleScrollbar",
  "TabIndicatorProps",
  "TabScrollButtonProps",
  "ScrollButtonComponent",
  "showLabels",
  "iconPosition",
  "height",
  "width",
  "animation",
  "position",
  "fontSize",
  "viewBox",
  "htmlColor",
  "titleAccess",
  "inheritViewBox",
  "baseClassName",
  "bottomNavigation",
  "disableSticky",
  "enableColorScheme",
  "swipeAreaWidth",
  "disableSwipeToOpen",
  "disableDiscovery",
  "hysteresis",
  "minFlingVelocity",
  "onChange",
  "onInput",
]);
export function nativeProps(
  props: object,
  extra: string[] = [],
): Record<string, unknown> {
  // Getter forwarding keeps native attributes reactive without copying their values.
  const forwarded: Record<string, unknown> = {};
  for (const key of Object.keys(props)) {
    if (excluded.has(key) || extra.includes(key)) continue;
    Object.defineProperty(forwarded, key, {
      enumerable: true,
      configurable: true,
      get: () => (props as Record<string, unknown>)[key],
    });
  }
  return forwarded;
}
export interface RootProps {
  name: string;
  props?: MuiProps;
  ownerProps?: MuiProps;
  component?: ValidComponent;
  styles?: StyleInput;
  state?: Record<string, unknown>;
  slot?: string;
  children?: JSX.Element;
  [attribute: string]: unknown;
}
const componentDefaults: Record<string, Record<string, unknown>> = {
  MuiTypography: { variant: "body1", align: "inherit" },
  MuiLink: { variant: "inherit", underline: "always" },
  MuiPaper: { variant: "elevation", elevation: 1 },
  MuiButton: { variant: "text", color: "primary", size: "medium" },
  MuiButtonGroup: {
    variant: "outlined",
    color: "primary",
    size: "medium",
    orientation: "horizontal",
  },
  MuiIconButton: { size: "medium", color: "default" },
  MuiFab: { variant: "circular", size: "large", color: "default" },
  MuiAvatar: { variant: "circular" },
  MuiBadge: { variant: "standard", overlap: "rectangular" },
  MuiChip: { variant: "filled", color: "default", size: "medium" },
  MuiContainer: { maxWidth: "lg" },
  MuiDivider: { orientation: "horizontal", variant: "fullWidth" },
  MuiSvgIcon: { fontSize: "medium", color: "inherit" },
  MuiIcon: { fontSize: "medium", color: "inherit" },
  MuiCheckbox: { color: "primary", size: "medium" },
  MuiRadio: { color: "primary", size: "medium" },
  MuiSwitch: { color: "primary", size: "medium" },
  MuiAlert: { variant: "standard", severity: "success" },
  MuiCircularProgress: { variant: "indeterminate", color: "primary" },
  MuiLinearProgress: { variant: "indeterminate", color: "primary" },
  MuiImageList: { variant: "standard" },
  MuiAppBar: { color: "primary", position: "fixed" },
  MuiToolbar: { variant: "regular" },
  MuiTabs: {
    orientation: "horizontal",
    variant: "standard",
    textColor: "primary",
    indicatorColor: "primary",
  },
  MuiPaginationItem: {
    variant: "text",
    size: "medium",
    shape: "circular",
    color: "standard",
  },
  MuiToggleButton: { size: "medium", color: "standard" },
  MuiStepper: { orientation: "horizontal" },
  MuiCollapse: { orientation: "vertical" },
  MuiTooltip: { placement: "bottom" },
  MuiDrawer: { anchor: "left", variant: "temporary", elevation: 16 },
  MuiDialog: { maxWidth: "sm", scroll: "paper" },
  MuiPopover: {
    anchorReference: "anchorEl",
    marginThreshold: 16,
    elevation: 8,
  },
  MuiMenuList: { variant: "selectedMenu" },
};
const capitalized = (value: unknown) =>
  typeof value === "string"
    ? value[0]?.toUpperCase() + value.slice(1)
    : String(value);
const emptyProps: Record<string, unknown> = {};
export function Root(p: RootProps): JSX.Element {
  const theme = useTheme();
  const slot = () => p.slot ?? "root";
  const state = createMemo(() => p.state ?? emptyProps, { equals: false });
  const parentProps = () => p.ownerProps ?? p.props;
  const ownerState = new Proxy({} as Record<string, unknown>, {
    get: (_, key) => {
      const current = state();
      return Object.hasOwn(current, key)
        ? current[String(key)]
        : ((parentProps() as Record<string, unknown> | undefined)?.[
            String(key)
          ] ?? componentDefaults[p.name]?.[String(key)]);
    },
    ownKeys: () => [
      ...new Set([
        ...Object.keys(parentProps() ?? {}).filter(
          (key) => !["children", "control", "sx", "style", "ref"].includes(key),
        ),
        ...Object.keys(state()),
      ]),
    ],
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
  });
  const modifiers = createMemo(() => {
    if (slot() !== "root") return [];
    const available = componentClassSlots[p.name] ?? [];
    const candidates: string[] = [];
    for (const key of [
      "disabled",
      "focused",
      "focusVisible",
      "active",
      "checked",
      "selected",
      "expanded",
      "error",
      "invisible",
      "indeterminate",
      "fullWidth",
      "disableGutters",
      "disablePadding",
      "disableElevation",
      "fixed",
      "absolute",
      "flexItem",
      "dense",
      "inset",
      "stickyHeader",
      "square",
      "loading",
      "container",
      "multiline",
      "adornedStart",
      "adornedEnd",
      "gutterBottom",
      "noWrap",
      "paragraph",
      "shrink",
      "dividers",
      "alternativeLabel",
      "completed",
    ] as const)
      if (ownerState[key] === true) candidates.push(key);
    for (const key of ["variant", "orientation"] as const) {
      const value = ownerState[key];
      if (typeof value === "string") candidates.push(value);
    }
    for (const key of [
      "color",
      "size",
      "fontSize",
      "position",
      "maxWidth",
      "textAlign",
      "edge",
      "anchor",
      "underline",
      "align",
      "loadingPosition",
    ] as const) {
      const value = ownerState[key];
      if (typeof value === "string")
        candidates.push(`${key}${capitalized(value)}`);
    }
    if (ownerState.elevation !== undefined)
      candidates.push(`elevation${ownerState.elevation}`);
    if (p.name === "MuiPaper" && !ownerState.square) candidates.push("rounded");
    if (p.name === "MuiAlert")
      candidates.push(
        `color${capitalized(ownerState.color ?? ownerState.severity)}`,
      );
    return [...new Set(candidates)].filter((key) => available.includes(key));
  });
  // Resolve authored slot factories once per dependency change, even when their
  // result is consumed by the tag, styles, attributes, and composed handlers.
  const sp = createMemo(
    () => slotProps(parentProps() ?? emptyProps, slot(), ownerState),
    { equals: false },
  );
  const chosenComponent = () =>
    (parentProps()?.slots?.[slot()] ??
      sp().component ??
      p.props?.component ??
      p.component ??
      "div") as ValidComponent;
  const Tag = dynamic(chosenComponent);
  const content = createMemo(() => p.children ?? p.props?.children);
  const baseStyles = createMemo(
    () =>
      internal_layerStyles(
        theme,
        typeof p.styles === "function" ? p.styles(theme) : p.styles,
        "components",
      ),
    // Style callbacks may reuse an object; dependency changes still invalidate CSS.
    { equals: false },
  );
  const sxStyles = createMemo(() =>
    p.props?.sx
      ? internal_layerStyles(theme, resolveSx(p.props.sx, theme), "sx")
      : undefined,
  );
  const slotSxStyles = createMemo(() =>
    sp().sx
      ? internal_layerStyles(theme, resolveSx(sp().sx as SxProps, theme), "sx")
      : undefined,
  );
  const generated = createMemo(() => {
    const config = theme.components[p.name] as
      import("./theme").ComponentConfig | undefined;
    const override = config?.styleOverrides?.[slot()];
    const variants = (slot() === "root" ? (config?.variants ?? []) : []).filter(
      (v) =>
        typeof v.props === "function"
          ? v.props(ownerState)
          : Object.entries(v.props).every(([k, val]) => ownerState[k] === val),
    );
    const resolveStyle = (
      value: unknown,
    ): import("@emotion/serialize").CSSInterpolation =>
      typeof value === "function"
        ? resolveStyle(value({ theme, ownerState }))
        : Array.isArray(value)
          ? value.map(resolveStyle)
          : (value as import("@emotion/serialize").CSSInterpolation);
    return css(
      baseStyles(),
      internal_layerStyles(theme, resolveStyle(override), "theme"),
      ...(config?.styleOverrides ? modifiers() : []).map((key) =>
        internal_layerStyles(
          theme,
          resolveStyle(config?.styleOverrides?.[key]),
          "theme",
        ),
      ),
      ...variants.map((v) =>
        internal_layerStyles(theme, resolveStyle(v.style), "theme"),
      ),
      sxStyles(),
      slotSxStyles(),
    );
  });
  // Cache forwarding descriptors; the attributes computation still reads their
  // getters so individual native prop values remain reactive.
  const native = createMemo(() => nativeProps(p.props ?? emptyProps));
  const own = omit(
    p,
    "name",
    "props",
    "ownerProps",
    "component",
    "styles",
    "state",
    "slot",
    "children",
    "class",
    "style",
    "tabIndex",
  );
  const attributes = createMemo(() => {
    const base: Record<string, unknown> = {
      ...native(),
      ...own,
    };
    const external = sp();
    const values: Record<string, unknown> = {
      ...base,
      ...omit(
        external,
        "component",
        "sx",
        "class",
        "className",
        "style",
        "tabIndex",
        "children",
      ),
      tabindex:
        p.tabindex ??
        p.tabIndex ??
        p.props?.tabindex ??
        p.props?.tabIndex ??
        external.tabIndex,
      class: [
        generateUtilityClass(p.name, slot()),
        generated(),
        parentProps()?.classes?.[slot()],
        modifiers().map((key) => [
          generateUtilityClass(p.name, key),
          parentProps()?.classes?.[key],
        ]),
        Object.entries(state())
          .filter(([, v]) => v === true)
          .map(([key]) => generateUtilityClass(p.name, key)),
        p.props?.class,
        p.props?.className,
        p.class as string,
        external.class as string,
        external.className as string,
      ],
      style: {
        ...p.props?.style,
        ...(p.style as JSX.CSSProperties),
        ...(sp().style as JSX.CSSProperties),
      },
      children: content(),
    };
    if (
      typeof (parentProps()?.slots?.[slot()] ?? external.component) ===
      "function"
    )
      values.ownerState ??= ownerState;
    // Slot customization retains the component's DOM handles and behavior.
    const baseRef = base.ref,
      externalRef = external.ref;
    if (externalRef && baseRef && externalRef !== baseRef)
      values.ref = (node: unknown) => {
        setRef(baseRef, node);
        setRef(externalRef, node);
      };
    for (const key of Object.keys(external)) {
      if (
        /^on[A-Z]/.test(key) &&
        base[key] &&
        external[key] &&
        base[key] !== external[key]
      ) {
        values[key] = (event: Event) => {
          callHandler(external[key], event);
          if (!event.defaultPrevented) callHandler(base[key], event);
        };
      }
    }
    for (const key of Object.keys(values))
      if (key.startsWith("aria-") && typeof values[key] === "boolean")
        values[key] = String(values[key]);
    return values;
  });
  return <Tag {...attributes()} />;
}
export function simple<P extends MuiProps = MuiProps>(
  name: string,
  component: ValidComponent,
  styles: (props: P, theme: Theme) => CSSObject = () => ({}),
) {
  return (props: P) => {
    const p = useProps(name, props);
    return (
      <Root
        name={name}
        props={p}
        component={component}
        styles={(theme) => styles(p, theme)}
      />
    );
  };
}
