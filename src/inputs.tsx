import { resolveMuiClassName } from "./class-names";
import { useReducedMotion } from "./motion";
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  merge,
  omit,
  onSettled,
  untrack,
  useContext,
} from "solid-js";
import { dynamic } from "@solidjs/web";
import type { JSX, ValidComponent } from "@solidjs/web";
import {
  Root,
  useProps,
  useControlled,
  clamp,
  callHandler,
  setRef,
  slotProps,
} from "./core";
import type { MuiProps, Color, Size } from "./core";
import { useTheme } from "./theme";
import { Popper } from "./overlays";
import { SelectOptionRegistryContext } from "./input-select-context";
import type { SelectOptionRegistry } from "./input-select-context";
import type { MenuProps as OverlayMenuProps } from "./overlays";
import type { CSSObject, Theme } from "./theme";
import type { CSSInterpolation } from "@emotion/serialize";
const alpha = (color: string, opacity: number) =>
  useTheme().alpha(color, opacity);
export {
  SliderRoot,
  SliderRail,
  SliderTrack,
  SliderThumb,
  SliderMark,
  SliderMarkLabel,
  SliderValueLabel,
} from "./input-slider-slots";
export type {
  SliderSlotProps,
  SliderValueLabelProps,
} from "./input-slider-slots";
export type InputRef<T> =
  | JSX.Ref<T>
  | {
      current?: T | null;
    };
export type InputEvent = Event & {
  currentTarget: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  target: Element;
};
export type SelectChangeEvent<T = string> = Event & {
  target: {
    value: T;
    name: string;
  };
};
const palette = (t: Theme, color: Color = "primary") =>
  color === "inherit"
    ? { main: "currentColor", dark: "currentColor", contrastText: "inherit" }
    : t.palette[color];
// Nested native slot handlers may share the same callback. Invoke it once and
// let an outer slot cancel the component's default behavior.
function callInputHandlers(event: Event, ...handlers: unknown[]) {
  const called = new Set<unknown>();
  for (const handler of handlers) {
    if (event.defaultPrevented) break;
    if (!handler || called.has(handler)) continue;
    called.add(handler);
    callHandler(handler, event);
  }
}
const visuallyHidden: CSSObject = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};
const Arrow = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="currentColor"
  >
    <path d="m7 10 5 5 5-5z" />
  </svg>
);
const Check = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="currentColor"
  >
    <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-9 14-5-5 1.4-1.4 3.6 3.6 7.6-7.6L19 8z" />
  </svg>
);
const BoxIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="currentColor"
  >
    <path d="M19 5v14H5V5h14m0-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
  </svg>
);
export interface TouchRippleProps extends Omit<MuiProps, "ref"> {
  center?: boolean;
  ref?: InputRef<TouchRippleActions>;
}
export interface StartActionOptions {
  pulsate?: boolean;
  center?: boolean;
}
export interface TouchRippleActions {
  start(
    event?: Event,
    options?: StartActionOptions,
    callback?: () => void,
  ): void;
  stop(event?: Event, callback?: () => void): void;
  pulsate(event?: Event): void;
}
export function TouchRipple(
  props: TouchRippleProps & {
    action?:
      | ((actions: TouchRippleActions) => void)
      | {
          current?: TouchRippleActions;
        };
  },
) {
  const reducedMotion = useReducedMotion();
  const [ripples, setRipples] = createSignal<
    Array<{
      id: number;
      x: number;
      y: number;
      size: number;
      pulsate: boolean;
      leaving: boolean;
    }>
  >([]);
  let host: HTMLSpanElement | undefined;
  let id = 0;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let touchTimer: ReturnType<typeof setTimeout> | undefined;
  let touchCommit: (() => void) | undefined;
  const actions: TouchRippleActions = {
    start(event, options = {}, callback) {
      if (!host) return;
      const box = host.getBoundingClientRect();
      const point =
        event && "touches" in event
          ? (event as TouchEvent).touches[0]
          : event && "clientX" in event
            ? (event as MouseEvent)
            : undefined;
      const centered =
        props.center || options.center || options.pulsate || !point;
      const x = centered ? box.width / 2 : point!.clientX - box.left;
      const y = centered ? box.height / 2 : point!.clientY - box.top;
      const size = options.pulsate
        ? Math.max(box.width, box.height)
        : Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y)) *
          2;
      const ripple = {
        id: ++id,
        x,
        y,
        size,
        pulsate: !!options.pulsate,
        leaving: false,
      };
      const commit = () => {
        setRipples((previous) => [...previous, ripple]);
        callback?.();
      };
      if (
        event &&
        (event.type === "touchstart" ||
          ("pointerType" in event &&
            (event as PointerEvent).pointerType === "touch")) &&
        !options.pulsate
      ) {
        if (touchTimer) {
          clearTimeout(touchTimer);
          timers.delete(touchTimer);
        }
        touchCommit = commit;
        touchTimer = setTimeout(() => {
          if (touchTimer) timers.delete(touchTimer);
          touchTimer = undefined;
          const pending = touchCommit;
          touchCommit = undefined;
          pending?.();
        }, 80);
        timers.add(touchTimer);
      } else commit();
    },
    stop(event, callback) {
      if (touchCommit) {
        const pending = touchCommit;
        touchCommit = undefined;
        if (touchTimer) {
          clearTimeout(touchTimer);
          timers.delete(touchTimer);
          touchTimer = undefined;
        }
        if (event && /cancel|move|leave/.test(event.type)) {
          callback?.();
          return;
        }
        // A quick tap still displays a ripple; scrolling cancels the delayed start.
        pending();
        const timer = setTimeout(() => {
          timers.delete(timer);
          actions.stop(event, callback);
        }, 0);
        timers.add(timer);
        return;
      }
      const leavingThrough = id;
      setRipples((previous) =>
        previous.map((r) =>
          r.id <= leavingThrough ? { ...r, leaving: true } : r,
        ),
      );
      const timer = setTimeout(
        () => {
          setRipples((previous) =>
            previous.filter((r) => r.id > leavingThrough),
          );
          timers.delete(timer);
          callback?.();
        },
        untrack(reducedMotion) ? 0 : 550,
      );
      timers.add(timer);
    },
    pulsate(event) {
      actions.start(event, { pulsate: true });
    },
  };
  onSettled(() => {
    setRef(
      untrack(() => props.action),
      actions,
    );
    setRef(
      untrack(() => props.ref),
      actions,
    );
    return () => {
      for (const timer of timers) clearTimeout(timer);
    };
  });
  return (
    <Root
      name="MuiTouchRipple"
      props={omit(props, "ref", "action")}
      component="span"
      ref={(el: HTMLSpanElement) => (host = el)}
      aria-hidden="true"
      styles={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        borderRadius: "inherit",
        pointerEvents: "none",
        "@keyframes mui-ripple-enter": {
          from: { transform: "scale(0)" },
          to: { transform: "scale(1)" },
        },
        "@keyframes mui-ripple-exit": {
          from: { opacity: 0.3 },
          to: { opacity: 0 },
        },
        "@keyframes mui-ripple-pulsate": {
          from: { transform: "scale(1)" },
          "50%": { transform: "scale(.92)" },
          to: { transform: "scale(1)" },
        },
      }}
    >
      <For each={ripples()}>
        {(r) => (
          <span
            class={resolveMuiClassName("MuiTouchRipple-ripple")}
            style={{
              position: "absolute",
              "border-radius": "50%",
              background: "currentColor",
              opacity: r.leaving ? (reducedMotion() ? 0 : undefined) : 0.3,
              width: `${r.size}px`,
              height: `${r.size}px`,
              left: `${r.x - r.size / 2}px`,
              top: `${r.y - r.size / 2}px`,
              animation: reducedMotion()
                ? "none"
                : r.leaving
                  ? "mui-ripple-exit 550ms ease-out forwards"
                  : r.pulsate
                    ? "mui-ripple-pulsate 2.5s ease-in-out infinite"
                    : "mui-ripple-enter 550ms ease-out forwards",
            }}
          />
        )}
      </For>
    </Root>
  );
}
export interface ButtonBaseActions {
  focusVisible(): void;
}
export interface ButtonBaseProps extends MuiProps {
  disabled?: boolean;
  disableRipple?: boolean;
  disableTouchRipple?: boolean;
  LinkComponent?: ValidComponent;
  nativeButton?: boolean;
  onFocusVisible?: (event: FocusEvent) => void;
  disableFocusRipple?: boolean;
  focusRipple?: boolean;
  centerRipple?: boolean;
  focusVisibleClassName?: string;
  href?: string;
  target?: string;
  type?: "button" | "submit" | "reset";
  tabIndex?: number;
  action?: InputRef<ButtonBaseActions>;
  TouchRippleProps?: TouchRippleProps;
  touchRippleRef?: InputRef<TouchRippleActions>;
}
export function ButtonBase(
  props: ButtonBaseProps & {
    _name?: string;
    _styles?: (theme: Theme) => CSSObject;
  },
) {
  const p = useProps("MuiButtonBase", props);
  const [focusVisible, setFocusVisible] = createSignal(false);
  let element: HTMLElement | undefined;
  let ripple: TouchRippleActions | undefined;
  let keyboard = false;
  let forcedFocus = false;
  const isButton = () =>
    p.nativeButton ?? ((!p.component && !p.href) || p.component === "button");
  onSettled(() => {
    setRef(
      untrack(() => p.action),
      {
        focusVisible() {
          forcedFocus = true;
          setFocusVisible(true);
          element?.focus();
        },
      },
    );
  });
  return (
    <Root
      name={p._name ?? "MuiButtonBase"}
      props={omit(p, "_name", "_styles")}
      component={p.href ? (p.LinkComponent ?? "a") : "button"}
      ref={(el: HTMLElement) => {
        element = el;
        setRef(
          untrack(() => p.ref),
          el,
        );
      }}
      type={isButton() ? (p.type ?? "button") : undefined}
      role={!isButton() && !p.href ? "button" : p.role}
      disabled={isButton() ? p.disabled : undefined}
      aria-disabled={!isButton() && p.disabled ? true : undefined}
      tabindex={p.disabled ? -1 : (p.tabIndex ?? 0)}
      state={{ disabled: !!p.disabled, focusVisible: focusVisible() }}
      class={[
        resolveMuiClassName("MuiButtonBase-root"),
        focusVisible() ? p.focusVisibleClassName : undefined,
      ]}
      onPointerDown={(e: PointerEvent) => {
        keyboard = false;
        callHandler(p.onPointerDown, e);
        if (
          !e.defaultPrevented &&
          !p.disabled &&
          !p.disableRipple &&
          !p.disableTouchRipple
        )
          ripple?.start(e);
      }}
      onPointerUp={(e: PointerEvent) => {
        ripple?.stop(e);
        callHandler(p.onPointerUp, e);
      }}
      onFocus={(e: FocusEvent) =>
        untrack(() => {
          const visible =
            forcedFocus ||
            keyboard ||
            (e.currentTarget as HTMLElement).matches(":focus-visible");
          forcedFocus = false;
          setFocusVisible(visible);
          if (visible) {
            p.onFocusVisible?.(e);
            if (p.focusRipple && !p.disableFocusRipple) ripple?.pulsate(e);
          }
          callHandler(p.onFocus, e);
        })
      }
      onBlur={(e: FocusEvent) =>
        untrack(() => {
          setFocusVisible(false);
          ripple?.stop();
          callHandler(p.onBlur, e);
        })
      }
      onKeyDown={(e: KeyboardEvent) => {
        keyboard = true;
        setFocusVisible(true);
        if (!isButton() && !p.href && (e.key === " " || e.key === "Enter")) {
          e.preventDefault();
          if (e.key === "Enter" && !p.disabled)
            (e.currentTarget as HTMLElement).click();
        }
        if (e.key === " " && !e.repeat && !p.disableRipple) ripple?.start(e);
        callHandler(p.onKeyDown, e);
      }}
      onTouchMove={(e: TouchEvent) => {
        ripple?.stop(e);
        callHandler(p.onTouchMove, e);
      }}
      onPointerCancel={(e: PointerEvent) => {
        ripple?.stop(e);
        callHandler(p.onPointerCancel, e);
      }}
      onPointerLeave={(e: PointerEvent) => {
        ripple?.stop(e);
        callHandler(p.onPointerLeave, e);
      }}
      onKeyUp={(e: KeyboardEvent) => {
        if (e.key === " ") {
          ripple?.stop(e);
          if (!isButton() && !p.href && !p.disabled)
            (e.currentTarget as HTMLElement).click();
        }
        callHandler(p.onKeyUp, e);
      }}
      onClick={(e: MouseEvent) => {
        if (p.disabled) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        callHandler(p.onClick, e);
      }}
      styles={(t) => ({
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        boxSizing: "border-box",
        WebkitTapHighlightColor: "transparent",
        outline: 0,
        border: 0,
        margin: 0,
        padding: 0,
        cursor: p.disabled ? "default" : "pointer",
        userSelect: "none",
        verticalAlign: "middle",
        textDecoration: "none",
        color: "inherit",
        font: "inherit",
        background: "transparent",
        borderRadius: "inherit",
        "&.Mui-disabled": { pointerEvents: "none" },
        "&.Mui-focusVisible":
          t.focusVisible === false
            ? undefined
            : (t.focusVisible ?? {
                outline: `2px solid ${t.palette.primary.main}`,
                outlineOffset: 2,
              }),
        ...p._styles?.(t),
      })}
    >
      {p.children}
      {!p.disableRipple && (
        <TouchRipple
          {...p.TouchRippleProps}
          center={p.centerRipple}
          action={(a) => {
            ripple = a;
            setRef(
              untrack(() => p.touchRippleRef),
              a,
            );
          }}
        />
      )}
    </Root>
  );
}
export interface ButtonProps extends ButtonBaseProps {
  variant?: "text" | "outlined" | "contained";
  color?: Color;
  size?: Size;
  fullWidth?: boolean;
  disableElevation?: boolean;
  startIcon?: JSX.Element;
  endIcon?: JSX.Element;
  loading?: boolean | null;
  loadingPosition?: "start" | "end" | "center";
  loadingIndicator?: JSX.Element;
}
export interface ButtonGroupContextValue extends Pick<
  ButtonProps,
  | "color"
  | "disabled"
  | "disableElevation"
  | "disableFocusRipple"
  | "disableRipple"
  | "fullWidth"
  | "size"
  | "variant"
> {
  className?: string;
}
export const ButtonGroupContext = /* @__PURE__ */ createContext<ButtonGroupContextValue | null>(
  null,
);
export const ButtonGroupButtonContext = /* @__PURE__ */ createContext<string | null>(null);
export function Button(props: ButtonProps) {
  const inherited = useContext(ButtonGroupContext);
  const positionClass = useContext(ButtonGroupButtonContext);
  const p = useProps("MuiButton", merge(inherited ?? {}, props));
  return (
    <ButtonBase
      {...p}
      _name="MuiButton"
      disabled={p.disabled || !!p.loading}
      class={[
        resolveMuiClassName("MuiButton-root"),
        inherited && resolveMuiClassName("MuiButtonGroup-grouped"),
        positionClass,
        p.loading && resolveMuiClassName("MuiButton-loading"),
        p.fullWidth && resolveMuiClassName("MuiButton-fullWidth"),
        resolveMuiClassName(`MuiButton-${p.variant ?? "text"}`),
        resolveMuiClassName(
          `MuiButton-color${p.color === "inherit" ? "Inherit" : (p.color ?? "primary")[0].toUpperCase() + (p.color ?? "primary").slice(1)}`,
        ),
        resolveMuiClassName(
          `MuiButton-${p.variant ?? "text"}${(p.color ?? "primary")[0].toUpperCase() + (p.color ?? "primary").slice(1)}`,
        ),
        resolveMuiClassName(
          `MuiButton-size${p.size === "small" ? "Small" : p.size === "large" ? "Large" : "Medium"}`,
        ),
        p.class,
      ]}
      _styles={(t) => {
        const c = palette(t, p.color);
        return {
          ...t.typography.button,
          minWidth: 64,
          padding:
            p.variant === "outlined"
              ? p.size === "small"
                ? "3px 9px"
                : p.size === "large"
                  ? "7px 21px"
                  : "5px 15px"
              : p.variant === "contained"
                ? p.size === "small"
                  ? "4px 10px"
                  : p.size === "large"
                    ? "8px 22px"
                    : "6px 16px"
                : p.size === "small"
                  ? "4px 5px"
                  : p.size === "large"
                    ? "8px 11px"
                    : "6px 8px",
          fontSize:
            p.size === "small"
              ? ".8125rem"
              : p.size === "large"
                ? ".9375rem"
                : ".875rem",
          borderRadius: t.shape.borderRadius,
          transition: t.transitions.create([
            "background-color",
            "box-shadow",
            "border-color",
            "color",
          ]),
          width: p.fullWidth ? "100%" : undefined,
          gap: 8,
          [resolveMuiClassName(
            "& .MuiButton-startIcon > :nth-of-type(1), & .MuiButton-endIcon > :nth-of-type(1)",
          )]: {
            fontSize: p.size === "small" ? 18 : p.size === "large" ? 22 : 20,
          },
          [resolveMuiClassName("& .MuiButton-startIcon")]: { marginLeft: -4 },
          [resolveMuiClassName("& .MuiButton-endIcon")]: { marginRight: -4 },
          color:
            p.variant === "contained"
              ? p.color === "inherit"
                ? t.palette.text.primary
                : c.contrastText
              : c.main,
          backgroundColor:
            p.variant === "contained"
              ? p.color === "inherit"
                ? t.palette.grey[300]
                : c.main
              : "transparent",
          border:
            p.variant === "outlined" ? `1px solid ${alpha(c.main, 0.5)}` : 0,
          boxShadow:
            p.variant === "contained" && !p.disableElevation
              ? t.shadows[2]
              : "none",
          "&:hover": {
            backgroundColor:
              p.variant === "contained"
                ? p.color === "inherit"
                  ? t.palette.grey[400]
                  : c.dark
                : alpha(c.main, 0.04),
            borderColor: p.variant === "outlined" ? c.main : undefined,
            boxShadow:
              p.variant === "contained" && !p.disableElevation
                ? t.shadows[4]
                : undefined,
          },
          "&.Mui-disabled": {
            color: t.palette.action.disabled,
            backgroundColor:
              p.variant === "contained"
                ? t.palette.action.disabledBackground
                : undefined,
            borderColor:
              p.variant === "outlined"
                ? t.palette.action.disabledBackground
                : undefined,
            boxShadow: "none",
          },
        };
      }}
    >
      {p.startIcon && (
        <span class={resolveMuiClassName("MuiButton-startIcon")}>
          {p.startIcon}
        </span>
      )}
      {p.loading && p.loadingPosition === "start" && (
        <span>{p.loadingIndicator ?? <Spinner />}</span>
      )}
      <span
        style={{
          visibility:
            p.loading && (!p.loadingPosition || p.loadingPosition === "center")
              ? "hidden"
              : undefined,
        }}
      >
        {p.children}
      </span>
      {p.loading && (!p.loadingPosition || p.loadingPosition === "center") && (
        <span style={{ position: "absolute" }}>
          {p.loadingIndicator ?? <Spinner />}
        </span>
      )}
      {p.loading && p.loadingPosition === "end" && (
        <span>{p.loadingIndicator ?? <Spinner />}</span>
      )}
      {p.endIcon && (
        <span class={resolveMuiClassName("MuiButton-endIcon")}>
          {p.endIcon}
        </span>
      )}
    </ButtonBase>
  );
}
function Spinner() {
  return (
    <svg
      role="progressbar"
      aria-label="Loading"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      style={{ animation: "mui-input-spin 1s linear infinite" }}
    >
      <style>{"@keyframes mui-input-spin{to{transform:rotate(360deg)}}"}</style>
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-dasharray="40 20"
      />
    </svg>
  );
}
export interface IconButtonProps extends ButtonBaseProps {
  color?: Color | "default";
  size?: Size;
  edge?: "start" | "end" | false;
  loading?: boolean | null;
  loadingIndicator?: JSX.Element;
}
export function IconButton(props: IconButtonProps) {
  const p = useProps("MuiIconButton", props);
  return (
    <ButtonBase
      {...p}
      _name="MuiIconButton"
      centerRipple
      disabled={p.disabled || !!p.loading}
      class={[
        resolveMuiClassName("MuiIconButton-root"),
        p.loading && resolveMuiClassName("MuiIconButton-loading"),
        p.class,
      ]}
      _styles={(t) => ({
        padding: p.size === "small" ? 5 : p.size === "large" ? 12 : 8,
        borderRadius: "50%",
        fontSize: p.size === "small" ? 18 : p.size === "large" ? 28 : 24,
        color:
          p.color && p.color !== "default"
            ? palette(t, p.color).main
            : t.palette.action.active,
        marginLeft: p.edge === "start" ? -12 : undefined,
        marginRight: p.edge === "end" ? -12 : undefined,
        "&:hover": {
          background: alpha(
            p.color && p.color !== "default"
              ? palette(t, p.color).main
              : t.palette.text.primary,
            0.04,
          ),
        },
        "&.Mui-disabled": { color: t.palette.action.disabled },
      })}
    >
      <span
        style={{
          display: "inherit",
          visibility: p.loading ? "hidden" : undefined,
        }}
      >
        {p.children}
      </span>
      {p.loading && (
        <span style={{ position: "absolute", display: "flex" }}>
          {p.loadingIndicator ?? <Spinner />}
        </span>
      )}
    </ButtonBase>
  );
}
export interface FabProps extends ButtonBaseProps {
  color?: Color | "default";
  size?: Size;
  variant?: "circular" | "extended";
}
export function Fab(props: FabProps) {
  const p = useProps("MuiFab", props);
  return (
    <ButtonBase
      {...p}
      _name="MuiFab"
      class={[resolveMuiClassName("MuiFab-root"), p.class]}
      _styles={(t) => ({
        ...t.typography.button,
        width:
          p.variant === "extended"
            ? "auto"
            : p.size === "small"
              ? 40
              : p.size === "medium"
                ? 48
                : 56,
        height: p.size === "small" ? 40 : p.size === "medium" ? 48 : 56,
        minWidth: p.variant === "extended" ? 48 : undefined,
        padding: p.variant === "extended" ? "0 16px" : 0,
        borderRadius: p.variant === "extended" ? 24 : "50%",
        gap: 8,
        boxShadow: t.shadows[6],
        background:
          p.color && p.color !== "default"
            ? palette(t, p.color).main
            : "#e0e0e0",
        color:
          p.color && p.color !== "default"
            ? palette(t, p.color).contrastText
            : t.palette.text.primary,
        "&:hover": {
          background:
            p.color && p.color !== "default"
              ? palette(t, p.color).dark
              : "#d5d5d5",
        },
        "&.Mui-disabled": {
          background: t.palette.action.disabledBackground,
          color: t.palette.action.disabled,
          boxShadow: "none",
        },
      })}
    />
  );
}
export interface ButtonGroupProps extends MuiProps {
  color?: Color;
  size?: Size;
  variant?: ButtonProps["variant"];
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
  fullWidth?: boolean;
  disableElevation?: boolean;
  disableRipple?: boolean;
}
export function ButtonGroup(props: ButtonGroupProps) {
  const p = useProps("MuiButtonGroup", props);
  return (
    <ButtonGroupContext
      value={{
        get color() {
          return p.color;
        },
        get disabled() {
          return p.disabled;
        },
        get disableElevation() {
          return p.disableElevation;
        },
        get disableRipple() {
          return p.disableRipple;
        },
        get fullWidth() {
          return p.fullWidth;
        },
        get size() {
          return p.size;
        },
        get variant() {
          return p.variant ?? "outlined";
        },
        get className() {
          return p.classes?.grouped;
        },
      }}
    >
      <Root
        name="MuiButtonGroup"
        props={p}
        role="group"
        styles={(t) => ({
          display: "inline-flex",
          flexDirection: p.orientation === "vertical" ? "column" : "row",
          width: p.fullWidth ? "100%" : undefined,
          borderRadius: t.shape.borderRadius,
          [resolveMuiClassName("& .MuiButton-root")]: { borderRadius: 0 },
          [resolveMuiClassName("& .MuiButton-root:first-of-type")]:
            p.orientation === "vertical"
              ? {
                  borderTopLeftRadius: t.shape.borderRadius,
                  borderTopRightRadius: t.shape.borderRadius,
                }
              : {
                  borderTopLeftRadius: t.shape.borderRadius,
                  borderBottomLeftRadius: t.shape.borderRadius,
                },
          [resolveMuiClassName("& .MuiButton-root:last-of-type")]:
            p.orientation === "vertical"
              ? {
                  borderBottomLeftRadius: t.shape.borderRadius,
                  borderBottomRightRadius: t.shape.borderRadius,
                }
              : {
                  borderTopRightRadius: t.shape.borderRadius,
                  borderBottomRightRadius: t.shape.borderRadius,
                },
          [resolveMuiClassName("& .MuiButton-root + .MuiButton-root")]: {
            marginLeft: p.orientation !== "vertical" ? -1 : undefined,
            marginTop: p.orientation === "vertical" ? -1 : undefined,
          },
        })}
      />
    </ButtonGroupContext>
  );
}
export interface FormControlProps extends MuiProps {
  /** Supply derived state for manually composed fields, including their server output. */
  filled?: boolean;
  adornedStart?: boolean;
  color?: Color;
  disabled?: boolean;
  error?: boolean;
  required?: boolean;
  focused?: boolean;
  fullWidth?: boolean;
  hiddenLabel?: boolean;
  size?: "small" | "medium";
  margin?: "none" | "dense" | "normal";
  variant?: "standard" | "outlined" | "filled";
}
interface FormState {
  props: FormControlProps;
  focused: () => boolean;
  filled: () => boolean;
  adornedStart: () => boolean;
  setFocused: (v: boolean) => void;
  setFilled: (v: boolean) => void;
}
const FormContext = /* @__PURE__ */ createContext<FormState | null>(null);
export function useFormControl() {
  return useContext(FormContext);
}
export function FormControl(
  props: FormControlProps & {
    _name?: string;
    _initialFilled?: boolean;
    _adornedStart?: boolean;
  },
) {
  const p = useProps("MuiFormControl", props);
  const [focused, setFocused] = createSignal(false);
  // Child reports override the source until a controlled value changes. The
  // source also supplies filled state during SSR, when effects do not run.
  const [filled, setFilled] = createSignal(() => p._initialFilled ?? false);
  return (
    <FormContext
      value={{
        props: p,
        focused: () => p.focused ?? focused(),
        filled: () => p.filled ?? filled(),
        adornedStart: () => p.adornedStart ?? !!p._adornedStart,
        setFocused,
        setFilled,
      }}
    >
      <Root
        name={p._name ?? "MuiFormControl"}
        props={omit(
          p,
          "_name",
          "_initialFilled",
          "_adornedStart",
          "filled",
          "adornedStart",
        )}
        class={[resolveMuiClassName("MuiFormControl-root"), p.class]}
        styles={{
          display: "inline-flex",
          flexDirection: "column",
          position: "relative",
          minWidth: 0,
          padding: 0,
          border: 0,
          verticalAlign: "top",
          width: p.fullWidth ? "100%" : undefined,
          marginTop:
            p.margin === "normal" ? 16 : p.margin === "dense" ? 8 : undefined,
          marginBottom:
            p.margin === "normal" ? 8 : p.margin === "dense" ? 4 : undefined,
        }}
      />
    </FormContext>
  );
}
export interface FormGroupProps extends MuiProps {
  row?: boolean;
}
export function FormGroup(
  props: FormGroupProps & {
    _name?: string;
  },
) {
  const p = useProps("MuiFormGroup", props);
  return (
    <Root
      name={p._name ?? "MuiFormGroup"}
      props={omit(p, "_name")}
      class={[resolveMuiClassName("MuiFormGroup-root"), p.class]}
      styles={{
        display: "flex",
        flexDirection: p.row ? "row" : "column",
        flexWrap: "wrap",
      }}
    />
  );
}
export interface FormLabelProps extends MuiProps {
  color?: Color;
  disabled?: boolean;
  error?: boolean;
  required?: boolean;
  focused?: boolean;
  htmlFor?: string;
}
export function FormLabel(
  props: FormLabelProps & {
    _name?: string;
    _styles?: (theme: Theme) => CSSObject;
  },
) {
  const p = useProps("MuiFormLabel", props);
  const f = useFormControl();
  const error = () => p.error ?? f?.props.error;
  return (
    <Root
      name={p._name ?? "MuiFormLabel"}
      props={omit(p, "_name", "_styles")}
      component="label"
      for={p.htmlFor}
      state={{
        disabled: !!(p.disabled ?? f?.props.disabled),
        error: !!error(),
        focused: !!(p.focused ?? f?.focused()),
      }}
      styles={(t) => ({
        ...t.typography.body1,
        lineHeight: 1.4375,
        padding: 0,
        color: error()
          ? t.palette.error.main
          : (p.focused ?? f?.focused())
            ? palette(t, p.color ?? f?.props.color).main
            : (p.disabled ?? f?.props.disabled)
              ? t.palette.text.disabled
              : t.palette.text.secondary,
        ...p._styles?.(t),
      })}
    >
      {p.children}
      {(p.required ?? f?.props.required) && (
        <span
          class={resolveMuiClassName("MuiFormLabel-asterisk")}
          aria-hidden="true"
        >
          {" *"}
        </span>
      )}
    </Root>
  );
}
export interface InputLabelProps extends FormLabelProps {
  shrink?: boolean;
  disableAnimation?: boolean;
  variant?: "standard" | "outlined" | "filled";
  size?: "small" | "medium";
}
export function InputLabel(props: InputLabelProps) {
  const p = useProps("MuiInputLabel", props);
  const f = useFormControl();
  const shrink = () =>
    p.shrink ?? !!(f?.filled() || f?.focused() || f?.adornedStart());
  const variant = () => p.variant ?? f?.props.variant ?? "outlined";
  return (
    <FormLabel
      {...p}
      _name="MuiInputLabel"
      data-shrink={shrink() ? "true" : "false"}
      class={[
        resolveMuiClassName("MuiFormLabel-root"),
        resolveMuiClassName("MuiInputLabel-root"),
        shrink() && resolveMuiClassName("MuiInputLabel-shrink"),
        p.class,
      ]}
      _styles={() => ({
        display: "block",
        transformOrigin: "top left",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "calc(100% - 24px)",
        position: f ? "absolute" : undefined,
        left: f ? 0 : undefined,
        top: f ? 0 : undefined,
        pointerEvents: shrink() ? "auto" : "none",
        "z-index": 1,
        transform: f
          ? variant() === "outlined"
            ? shrink()
              ? "translate(14px, -9px) scale(0.75)"
              : `translate(14px, ${(p.size ?? f.props.size) === "small" ? 9 : 16}px) scale(1)`
            : variant() === "filled"
              ? shrink()
                ? "translate(12px, 7px) scale(0.75)"
                : `translate(12px, ${(p.size ?? f.props.size) === "small" ? 16 : 20}px) scale(1)`
              : shrink()
                ? "translate(0, -1.5px) scale(0.75)"
                : "translate(0, 20px) scale(1)"
          : undefined,
        transition: p.disableAnimation
          ? undefined
          : "color 200ms, transform 200ms, max-width 200ms",
      })}
    />
  );
}
export interface FormHelperTextProps extends MuiProps {
  disabled?: boolean;
  error?: boolean;
  margin?: "dense";
  variant?: "standard" | "outlined" | "filled";
  required?: boolean;
}
export function FormHelperText(props: FormHelperTextProps) {
  const p = useProps("MuiFormHelperText", props);
  const f = useFormControl();
  return (
    <Root
      name="MuiFormHelperText"
      props={p}
      component="p"
      state={{
        error: !!(p.error ?? f?.props.error),
        disabled: !!(p.disabled ?? f?.props.disabled),
      }}
      styles={(t) => ({
        ...t.typography.caption,
        margin: "3px 14px 0",
        textAlign: "left",
        color:
          (p.error ?? f?.props.error)
            ? t.palette.error.main
            : (p.disabled ?? f?.props.disabled)
              ? t.palette.text.disabled
              : t.palette.text.secondary,
        ...((p.variant ?? f?.props.variant) === "standard"
          ? { marginLeft: 0, marginRight: 0 }
          : {}),
      })}
    />
  );
}
export interface InputAdornmentProps extends MuiProps {
  position: "start" | "end";
  disablePointerEvents?: boolean;
  disableTypography?: boolean;
  variant?: "standard" | "outlined" | "filled";
}
export function InputAdornment(props: InputAdornmentProps) {
  const p = useProps("MuiInputAdornment", props);
  return (
    <Root
      name="MuiInputAdornment"
      props={p}
      styles={(t) => ({
        display: "flex",
        height: "0.01em",
        maxHeight: "2em",
        alignItems: "center",
        whiteSpace: "nowrap",
        color: t.palette.text.secondary,
        marginRight: p.position === "start" ? 8 : undefined,
        marginLeft: p.position === "end" ? 8 : undefined,
        pointerEvents: p.disablePointerEvents ? "none" : undefined,
      })}
    />
  );
}
const CheckLabelContext = /* @__PURE__ */ createContext<Partial<CheckableProps> | null>(null);
export interface FormControlLabelProps extends MuiProps {
  control: JSX.Element | ((props: CheckableProps) => JSX.Element);
  label?: JSX.Element;
  labelPlacement?: "end" | "start" | "top" | "bottom";
  disabled?: boolean;
  required?: boolean;
  checked?: boolean;
  value?: string;
  name?: string;
  onChange?: CheckableProps["onChange"];
  disableTypography?: boolean;
}
export function FormControlLabel(props: FormControlLabelProps) {
  const p = useProps("MuiFormControlLabel", props);
  const f = useFormControl();
  return (
    <CheckLabelContext
      value={{
        get checked() {
          return p.checked;
        },
        get disabled() {
          return p.disabled ?? f?.props.disabled;
        },
        get required() {
          return p.required;
        },
        get name() {
          return p.name;
        },
        get value() {
          return p.value;
        },
        get onChange() {
          return p.onChange;
        },
      }}
    >
      <Root
        name="MuiFormControlLabel"
        props={p}
        component="label"
        styles={(t) => ({
          display: "inline-flex",
          alignItems: "center",
          cursor: (p.disabled ?? f?.props.disabled) ? "default" : "pointer",
          verticalAlign: "middle",
          WebkitTapHighlightColor: "transparent",
          marginLeft: p.labelPlacement === "start" ? 16 : -11,
          marginRight: 16,
          flexDirection:
            p.labelPlacement === "start"
              ? "row-reverse"
              : p.labelPlacement === "top"
                ? "column-reverse"
                : p.labelPlacement === "bottom"
                  ? "column"
                  : "row",
          color:
            (p.disabled ?? f?.props.disabled)
              ? t.palette.text.disabled
              : t.palette.text.primary,
        })}
      >
        {typeof p.control === "function"
          ? p.control({
              checked: p.checked,
              disabled: p.disabled ?? f?.props.disabled,
              required: p.required,
              name: p.name,
              value: p.value,
              onChange: p.onChange,
            })
          : p.control}
        <span class={resolveMuiClassName("MuiFormControlLabel-label")}>
          {p.label}
          {p.required && <span aria-hidden="true"> *</span>}
        </span>
      </Root>
    </CheckLabelContext>
  );
}
export interface CheckableProps extends MuiProps {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  name?: string;
  value?: string | number;
  color?: Color | "default";
  size?: "small" | "medium";
  inputProps?: JSX.InputHTMLAttributes<HTMLInputElement>;
  inputRef?: InputRef<HTMLInputElement>;
  onChange?: (event: InputEvent, checked: boolean) => void;
  icon?: JSX.Element;
  checkedIcon?: JSX.Element;
  disableRipple?: boolean;
  edge?: "start" | "end" | false;
}
export interface CheckboxProps extends CheckableProps {
  indeterminate?: boolean;
  indeterminateIcon?: JSX.Element;
}
function Checkable(
  props: CheckboxProps & {
    kind: "checkbox" | "radio" | "switch";
  },
) {
  const inherited = useContext(CheckLabelContext);
  const p = useProps(
    props.kind === "radio"
      ? "MuiRadio"
      : props.kind === "switch"
        ? "MuiSwitch"
        : "MuiCheckbox",
    merge(inherited ?? {}, props),
  );
  const form = useFormControl();
  const theme = useTheme();
  const group = useContext(RadioContext);
  const [checked, setChecked] = useControlled(
    () =>
      p.checked ??
      (p.kind === "radio" && group ? group.value() === p.value : undefined),
    () => !!p.defaultChecked,
  );
  const disabled = () => p.disabled ?? form?.props.disabled;
  const color = () =>
    p.color === "default"
      ? "inherit"
      : (p.color ?? form?.props.color ?? "primary");
  let inputEl: HTMLInputElement | undefined;
  let ripple: TouchRippleActions | undefined;
  createEffect(
    () => p.indeterminate,
    (next) => {
      if (inputEl) inputEl.indeterminate = !!next;
    },
  );
  const input = (
    <Root
      name={
        p.kind === "radio"
          ? "MuiRadio"
          : p.kind === "switch"
            ? "MuiSwitch"
            : "MuiCheckbox"
      }
      slot="input"
      ownerProps={p}
      component="input"
      props={
        merge(p.inputProps ?? {}, {
          get name() {
            return p.name ?? group?.name();
          },
        }) as MuiProps
      }
      ref={(el: HTMLInputElement) => {
        inputEl = el;
        untrack(() => {
          el.indeterminate = !!p.indeterminate;
          setRef(p.inputRef, el);
          setRef(p.inputProps?.ref, el);
        });
      }}
      id={p.id ?? p.inputProps?.id}
      type={p.kind === "radio" ? "radio" : "checkbox"}
      checked={checked()}
      disabled={disabled()}
      required={p.required ?? form?.props.required}
      readonly={p.readOnly}
      value={p.value}
      aria-checked={p.indeterminate ? "mixed" : checked() ? "true" : "false"}
      data-indeterminate={p.indeterminate}
      onChange={(e: InputEvent) => {
        callHandler(p.inputProps?.onChange, e);
        if (e.defaultPrevented) return;
        const next = (e.currentTarget as HTMLInputElement).checked;
        if (p.readOnly) return;
        setChecked(next);
        p.onChange?.(e, next);
        if (p.kind === "radio" && next) group?.change(e, p.value);
      }}
      onFocus={(e: FocusEvent) =>
        untrack(() => {
          callHandler(p.inputProps?.onFocus, e);
          if (!e.defaultPrevented) callHandler(p.onFocus, e);
        })
      }
      onBlur={(e: FocusEvent) =>
        untrack(() => {
          callHandler(p.inputProps?.onBlur, e);
          if (!e.defaultPrevented) callHandler(p.onBlur, e);
        })
      }
      onKeyDown={(e: KeyboardEvent) => {
        callHandler(p.inputProps?.onKeyDown, e);
        if (!e.defaultPrevented) callHandler(p.onKeyDown, e);
      }}
      styles={{
        position: "absolute",
        inset: 0,
        opacity: 0,
        width: "100%",
        height: "100%",
        margin: 0,
        cursor: "inherit",
        zIndex: 1,
      }}
    />
  );
  return (
    <Root
      name={
        p.kind === "radio"
          ? "MuiRadio"
          : p.kind === "switch"
            ? "MuiSwitch"
            : "MuiCheckbox"
      }
      props={omit(p, "kind", "onFocus", "onBlur", "onKeyDown")}
      component="span"
      id={undefined}
      onPointerDown={(event: PointerEvent) => {
        callHandler(p.onPointerDown, event);
        if (!event.defaultPrevented && !disabled() && !p.disableRipple)
          ripple?.start(event, { center: true });
      }}
      onPointerUp={(event: PointerEvent) => {
        ripple?.stop(event);
        callHandler(p.onPointerUp, event);
      }}
      onTouchMove={(event: TouchEvent) => {
        ripple?.stop(event);
        callHandler(p.onTouchMove, event);
      }}
      onPointerCancel={(event: PointerEvent) => {
        ripple?.stop(event);
        callHandler(p.onPointerCancel, event);
      }}
      onPointerLeave={(event: PointerEvent) => {
        ripple?.stop(event);
        callHandler(p.onPointerLeave, event);
      }}
      state={{
        checked: checked(),
        disabled: !!disabled(),
        indeterminate: !!p.indeterminate,
      }}
      styles={(t) => ({
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        padding: p.kind === "switch" ? 0 : 9,
        borderRadius: "50%",
        verticalAlign: "middle",
        color: disabled()
          ? t.palette.action.disabled
          : checked() || p.indeterminate
            ? palette(t, color()).main
            : t.palette.text.secondary,
        cursor: disabled() ? "default" : "pointer",
        marginLeft: p.edge === "start" ? -12 : undefined,
        marginRight: p.edge === "end" ? -12 : undefined,
        "&:hover": {
          background: disabled()
            ? undefined
            : alpha(palette(t, color()).main, 0.04),
        },
        "&:has(input:focus-visible)":
          t.focusVisible === false
            ? undefined
            : (t.focusVisible ?? {
                outline: `2px solid ${palette(t, color()).main}`,
                outlineOffset: 2,
              }),
        "& svg": {
          width: p.size === "small" ? 20 : 24,
          height: p.size === "small" ? 20 : 24,
        },
        ...(p.kind === "switch"
          ? {
              width: p.size === "small" ? 40 : 58,
              height: p.size === "small" ? 24 : 38,
              padding: p.size === "small" ? 7 : 12,
              borderRadius: 20,
              boxSizing: "border-box",
            }
          : {}),
      })}
    >
      {p.kind === "switch" ? (
        <Root
          name="MuiSwitch"
          slot="switchBase"
          ownerProps={p}
          component="span"
          state={{ checked: checked(), disabled: !!disabled() }}
          styles={(t) => ({
            position: "absolute",
            zIndex: 1,
            top: 0,
            left: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: p.size === "small" ? 4 : 9,
            borderRadius: "50%",
            transition: t.transitions.create(["left", "transform"]),
            transform: checked()
              ? `translateX(${p.size === "small" ? 16 : 20}px)`
              : undefined,
            "&:hover": {
              backgroundColor: disabled()
                ? undefined
                : alpha(palette(t, color()).main, 0.04),
            },
          })}
        >
          {input}{" "}
          <Root
            name="MuiSwitch"
            slot="thumb"
            ownerProps={p}
            component="span"
            state={{ checked: checked(), disabled: !!disabled() }}
            styles={{
              width: p.size === "small" ? "16px" : "20px",
              height: p.size === "small" ? "16px" : "20px",
              borderRadius: "50%",
              background: disabled()
                ? theme.palette.action.disabled
                : checked()
                  ? palette(theme, color()).main
                  : theme.palette.mode === "dark"
                    ? "#e0e0e0"
                    : "#fff",
              boxShadow: theme.shadows[1],
              transition: "transform 150ms, background 150ms",
            }}
          >
            {checked() ? p.checkedIcon : p.icon}
          </Root>
          {!p.disableRipple && !disabled() && (
            <TouchRipple center ref={(actions) => (ripple = actions)} />
          )}
        </Root>
      ) : (
        <>
          {input}
          {!p.disableRipple && !disabled() && (
            <TouchRipple center ref={(actions) => (ripple = actions)} />
          )}
        </>
      )}
      {p.kind === "switch" ? (
        <>
          <Root
            name="MuiSwitch"
            slot="track"
            ownerProps={p}
            component="span"
            state={{ checked: checked(), disabled: !!disabled() }}
            styles={{
              width: "100%",
              height: "100%",
              borderRadius: "7px",
              background: checked()
                ? palette(theme, color()).main
                : theme.palette.text.primary,
              opacity: disabled() ? 0.12 : 0.38,
              transition: "background 150ms",
            }}
          />
        </>
      ) : p.indeterminate ? (
        (p.indeterminateIcon ?? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM7 11h10v2H7z" />
          </svg>
        ))
      ) : checked() ? (
        (p.checkedIcon ??
        (p.kind === "radio" ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
            <circle cx="12" cy="12" r="5" />
          </svg>
        ) : (
          <Check />
        )))
      ) : (
        (p.icon ??
        (p.kind === "radio" ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
          </svg>
        ) : (
          <BoxIcon />
        )))
      )}
    </Root>
  );
}
export function Checkbox(p: CheckboxProps) {
  return <Checkable {...p} kind="checkbox" />;
}
export interface RadioProps extends CheckableProps {}
export function Radio(p: RadioProps) {
  return <Checkable {...p} kind="radio" />;
}
export interface SwitchProps extends CheckableProps {}
export function Switch(p: SwitchProps) {
  return <Checkable {...p} kind="switch" />;
}
interface RadioGroupState {
  value: () => unknown;
  name: () => string;
  change: (e: InputEvent, value: unknown) => void;
}
const RadioContext = /* @__PURE__ */ createContext<RadioGroupState | null>(null);
export function useRadioGroup() {
  return useContext(RadioContext);
}
export interface RadioGroupProps extends FormGroupProps {
  name?: string;
  value?: unknown;
  defaultValue?: unknown;
  onChange?: (event: InputEvent, value: string) => void;
}
export function RadioGroup(props: RadioGroupProps) {
  const p = useProps("MuiRadioGroup", props);
  const id = createUniqueId();
  const [value, setValue] = useControlled(
    () => p.value,
    () => p.defaultValue,
  );
  return (
    <RadioContext
      value={{
        value,
        name: () => p.name ?? id,
        change(e, next) {
          setValue(next);
          p.onChange?.(e, String(next));
        },
      }}
    >
      <FormGroup
        {...p}
        _name="MuiRadioGroup"
        class={[resolveMuiClassName("MuiRadioGroup-root"), p.class]}
        role="radiogroup"
      />
    </RadioContext>
  );
}
export interface TextareaAutosizeProps extends Omit<
  JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "rows"
> {
  minRows?: number | string;
  maxRows?: number | string;
}
export function TextareaAutosize(props: TextareaAutosizeProps) {
  let el: HTMLTextAreaElement | undefined;
  const limits = createMemo(() => {
    const min = Math.max(1, Number(props.minRows) || 1);
    return { min, max: Math.max(min, Number(props.maxRows) || Infinity) };
  });
  const resize = () => {
    if (!el) return;
    const style = getComputedStyle(el);
    const line =
      parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
    const padding =
      parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const border =
      parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    el.style.height = "auto";
    const { min, max } = untrack(limits);
    const height = clamp(el.scrollHeight - padding, min * line, max * line);
    el.style.height = `${height + padding + (style.boxSizing === "border-box" ? border : 0)}px`;
    el.style.overflowY =
      el.scrollHeight - padding > max * line ? "auto" : "hidden";
  };
  createEffect(
    () => [props.value, limits()],
    () => {
      resize();
    },
  );
  onSettled(() => {
    resize();
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(resize)
        : undefined;
    if (el) observer?.observe(el);
    return () => observer?.disconnect();
  });
  return (
    <textarea
      {...props}
      rows={Math.max(1, Number(props.minRows) || 1)}
      ref={(node) => {
        el = node;
        setRef(
          untrack(() => props.ref),
          node,
        );
      }}
      onInput={(e) => {
        resize();
        callHandler(props.onInput, e);
      }}
    />
  );
}
export interface InputBaseProps extends MuiProps {
  id?: string;
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  disabled?: boolean;
  error?: boolean;
  required?: boolean;
  readOnly?: boolean;
  name?: string;
  type?: string;
  placeholder?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number | string;
  minRows?: number | string;
  maxRows?: number | string;
  size?: "small" | "medium";
  color?: Color;
  startAdornment?: JSX.Element;
  endAdornment?: JSX.Element;
  inputProps?: JSX.InputHTMLAttributes<HTMLInputElement>;
  inputRef?: InputRef<HTMLInputElement | HTMLTextAreaElement>;
  inputComponent?: ValidComponent;
  onChange?: (event: InputEvent) => void;
  onInput?: (event: InputEvent) => void;
  hiddenLabel?: boolean;
  margin?: "none" | "dense";
}
export function InputBase(
  props: InputBaseProps & {
    _variant?: "standard" | "outlined" | "filled";
    label?: JSX.Element;
    notched?: boolean;
    disableUnderline?: boolean;
  },
) {
  const p = useProps("MuiInputBase", props);
  const f = useFormControl();
  const [value, setValue] = useControlled(
    () =>
      (p.value ??
        p.inputProps?.value ??
        slotProps(p, "htmlInput").value) as InputBaseProps["value"],
    () => p.defaultValue ?? "",
  );
  const [localFocused, setFocused] = createSignal(false);
  const focused = () => f?.focused() ?? localFocused();
  const variant = () => p._variant;
  const disabled = () => p.disabled ?? f?.props.disabled;
  const error = () => p.error ?? f?.props.error;
  const small = () => (p.size ?? f?.props.size) === "small";
  const theme = useTheme();
  createEffect(
    () => String(value() ?? "") !== "",
    (filled) => {
      f?.setFilled(filled);
    },
  );
  const html = () => ({ ...p.inputProps, ...slotProps(p, "htmlInput") });
  const InputTag = dynamic(
    () =>
      p.slots?.input ??
      p.inputComponent ??
      (p.multiline ? TextareaAutosize : "input"),
  );
  const borderColor = () =>
    error()
      ? theme.palette.error.main
      : focused()
        ? palette(theme, p.color ?? f?.props.color).main
        : alpha(theme.palette.text.primary, 0.23);
  const padding = () =>
    variant() === "outlined"
      ? small()
        ? "8.5px 14px"
        : "16.5px 14px"
      : variant() === "filled"
        ? small()
          ? "21px 12px 4px"
          : "25px 12px 8px"
        : "4px 0 5px";
  const inputOwner = new Proxy({} as Record<string, unknown>, {
    get: (_, key) =>
      key === "variant"
        ? variant()
        : key === "focused"
          ? focused()
          : key === "disabled"
            ? disabled()
            : key === "error"
              ? error()
              : (p as unknown as Record<string, unknown>)[String(key)],
  });
  const inputSlot = () => slotProps(p, "input", inputOwner);
  const inputStyles = (t: Theme): CSSInterpolation => {
    const baseOverride = variant()
      ? t.components.MuiInputBase?.styleOverrides?.input
      : undefined;
    const override =
      typeof baseOverride === "function"
        ? baseOverride({ theme: t, ownerState: inputOwner })
        : baseOverride;
    return [
      {
        font: "inherit",
        letterSpacing: "inherit",
        color: "currentColor",
        border: 0,
        boxSizing: "content-box",
        background: "none",
        height: p.multiline ? "auto" : "1.4375em",
        margin: 0,
        display: "block",
        minWidth: 0,
        width: "100%",
        outline: 0,
        padding: padding(),
        paddingLeft: p.startAdornment ? 0 : undefined,
        paddingRight: p.endAdornment ? 0 : undefined,
        resize: "none",
      },
      override,
    ];
  };
  // Dynamic native spreads run in the renderer effect phase. Resolve their props
  // in this owned computation so JSX-created memos never appear in that phase.
  const inputAttributes = createMemo(() => ({
    ...html(),
    ...inputSlot(),
    ref: (el: HTMLInputElement | HTMLTextAreaElement) => {
      untrack(() => {
        setRef(p.inputRef, el);
        setRef(html().ref, el);
        setRef(inputSlot().ref, el);
      });
    },
    class: [
      resolveMuiClassName("MuiInputBase-input"),
      variant() === "outlined"
        ? resolveMuiClassName("MuiOutlinedInput-input")
        : variant() === "filled"
          ? resolveMuiClassName("MuiFilledInput-input")
          : undefined,
      html().class,
      inputSlot().class,
    ],
    id: p.id ?? html().id,
    name: p.name ?? html().name,
    type: p.multiline ? undefined : (p.type ?? "text"),
    value: value(),
    disabled: disabled(),
    required: p.required ?? f?.props.required,
    readonly: p.readOnly ?? html().readonly,
    autofocus: p.autoFocus ?? html().autofocus,
    autocomplete: p.autoComplete ?? html().autocomplete,
    placeholder: p.placeholder ?? html().placeholder,
    rows: p.rows,
    minRows: p.rows ?? p.minRows,
    maxRows: p.rows ?? p.maxRows,
    "aria-label": p["aria-label"] ?? html()["aria-label"],
    "aria-labelledby": p["aria-labelledby"] ?? html()["aria-labelledby"],
    "aria-invalid": error() ? "true" : undefined,
    "aria-describedby": p["aria-describedby"] ?? html()["aria-describedby"],
    onInput: (e: InputEvent) => {
      callInputHandlers(e, inputSlot().onInput, html().onInput);
      if (e.defaultPrevented) return;
      setValue(e.currentTarget.value);
      p.onInput?.(e);
      p.onChange?.(e);
    },
    onChange: (e: InputEvent) => {
      callInputHandlers(e, inputSlot().onChange, html().onChange);
    },
    onFocus: (e: FocusEvent) =>
      untrack(() => {
        callInputHandlers(e, inputSlot().onFocus, html().onFocus);
        if (e.defaultPrevented) return;
        setFocused(true);
        f?.setFocused(true);
        callHandler(p.onFocus, e);
      }),
    onBlur: (e: FocusEvent) =>
      untrack(() => {
        callInputHandlers(e, inputSlot().onBlur, html().onBlur);
        if (e.defaultPrevented) return;
        setFocused(false);
        f?.setFocused(false);
        callHandler(p.onBlur, e);
      }),
    onKeyDown: (e: KeyboardEvent) => {
      callInputHandlers(e, inputSlot().onKeyDown, html().onKeyDown);
      if (!e.defaultPrevented) callHandler(p.onKeyDown, e);
    },
    style: {
      ...(html().style as JSX.CSSProperties),
      ...(inputSlot().style as JSX.CSSProperties),
    } as JSX.CSSProperties,
  }));
  const nativeInput = (
    <Root
      {...omit(
        inputAttributes() as Record<string, unknown>,
        "name",
        "slot",
        "sx",
        "component",
        "className",
      )}
      name={
        variant() === "outlined"
          ? "MuiOutlinedInput"
          : variant() === "filled"
            ? "MuiFilledInput"
            : variant() === "standard"
              ? "MuiInput"
              : "MuiInputBase"
      }
      slot="input"
      ownerProps={omit(p, "slotProps", "component")}
      props={
        merge(html(), inputSlot(), {
          get name() {
            return p.name ?? html().name;
          },
          get slot() {
            return html().slot;
          },
        }) as MuiProps
      }
      component={InputTag}
      state={{
        variant: variant(),
        disabled: !!disabled(),
        error: !!error(),
        focused: focused(),
      }}
      styles={inputStyles}
    />
  );
  return (
    <Root
      name={
        variant() === "outlined"
          ? "MuiOutlinedInput"
          : variant() === "filled"
            ? "MuiFilledInput"
            : variant() === "standard"
              ? "MuiInput"
              : "MuiInputBase"
      }
      ownerProps={p}
      props={omit(
        p,
        "_variant",
        "onFocus",
        "onBlur",
        "onKeyDown",
        "value",
        "defaultValue",
      )}
      id={undefined}
      class={[resolveMuiClassName("MuiInputBase-root"), p.class]}
      state={{
        variant: variant(),
        disabled: !!disabled(),
        error: !!error(),
        focused: focused(),
        multiline: !!p.multiline,
        adornedStart: !!p.startAdornment,
        adornedEnd: !!p.endAdornment,
      }}
      styles={(t) => ({
        ...t.typography.body1,
        lineHeight: "1.4375em",
        color: disabled() ? t.palette.text.disabled : t.palette.text.primary,
        boxSizing: "border-box",
        position: "relative",
        cursor: disabled() ? "default" : "text",
        display: "inline-flex",
        alignItems: "center",
        width: p.fullWidth || f?.props.fullWidth ? "100%" : undefined,
        borderRadius:
          variant() && variant() !== "standard"
            ? t.shape.borderRadius
            : undefined,
        backgroundColor:
          variant() === "filled"
            ? alpha(t.palette.text.primary, 0.06)
            : undefined,
        marginTop:
          variant() === "standard" && f && !f.props.hiddenLabel
            ? 16
            : undefined,
        [resolveMuiClassName("& .MuiInputBase-input::placeholder")]: {
          opacity: 0.42,
        },
        [resolveMuiClassName(
          "label[data-shrink=false] + & .MuiInputBase-input::placeholder",
        )]: {
          opacity: 0,
        },
        [resolveMuiClassName(
          "label[data-shrink=false] + & .MuiInputBase-input:focus::placeholder",
        )]: {
          opacity: 0.42,
        },
        paddingLeft: p.startAdornment
          ? variant() === "outlined"
            ? 14
            : 12
          : undefined,
        paddingRight: p.endAdornment
          ? variant() === "outlined"
            ? 14
            : 12
          : undefined,
        [resolveMuiClassName("&:hover .MuiOutlinedInput-notchedOutline")]: {
          borderColor: disabled() ? undefined : t.palette.text.primary,
        },
        ...(variant() !== "outlined" && variant() && !p.disableUnderline
          ? {
              "&:before": {
                content: '""',
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                borderBottom: `1px ${disabled() ? "dotted" : "solid"} ${alpha(t.palette.text.primary, 0.42)}`,
                pointerEvents: "none",
              },
              "&:after": {
                content: '""',
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                borderBottom: `2px solid ${error() ? t.palette.error.main : palette(t, p.color ?? f?.props.color).main}`,
                transform: focused() ? "scaleX(1)" : "scaleX(0)",
                transition: "transform 200ms",
                pointerEvents: "none",
              },
            }
          : {}),
      })}
      onClick={(e: MouseEvent) => callHandler(p.onClick, e)}
    >
      {p.startAdornment}
      {nativeInput}
      {p.endAdornment}
      {variant() === "outlined" && (
        <fieldset
          aria-hidden="true"
          class={resolveMuiClassName("MuiOutlinedInput-notchedOutline")}
          style={{
            position: "absolute",
            inset: "-5px 0 0",
            margin: 0,
            padding: "0 8px",
            "pointer-events": "none",
            "border-radius": "inherit",
            border: `${focused() ? 2 : 1}px solid ${borderColor()}`,
          }}
        >
          <legend
            style={{
              width: "auto",
              padding: 0,
              height: "11px",
              "font-size": ".75em",
              "max-width":
                (p.notched ??
                (focused() || !!p.startAdornment || String(value()).length > 0))
                  ? "100%"
                  : "0.01px",
              visibility: "hidden",
              transition: "max-width 150ms",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                "padding-left": "5px",
                "padding-right": "5px",
                display: "inline-block",
              }}
            >
              {p.label ?? "​"}
            </span>
          </legend>
        </fieldset>
      )}
    </Root>
  );
}
export interface InputProps extends InputBaseProps {
  disableUnderline?: boolean;
}
export function Input(props: InputProps) {
  return <InputBase {...useProps("MuiInput", props)} _variant="standard" />;
}
export interface FilledInputProps extends InputProps {}
export function FilledInput(props: FilledInputProps) {
  return <InputBase {...useProps("MuiFilledInput", props)} _variant="filled" />;
}
export interface OutlinedInputProps extends InputBaseProps {
  label?: JSX.Element;
  notched?: boolean;
}
export function OutlinedInput(props: OutlinedInputProps) {
  return (
    <InputBase {...useProps("MuiOutlinedInput", props)} _variant="outlined" />
  );
}
export interface TextFieldProps extends Omit<InputBaseProps, "margin"> {
  label?: JSX.Element;
  helperText?: JSX.Element;
  variant?: "standard" | "outlined" | "filled";
  margin?: "none" | "dense" | "normal";
  select?: boolean;
  InputProps?: Partial<InputBaseProps>;
  InputLabelProps?: Partial<InputLabelProps>;
  FormHelperTextProps?: Partial<FormHelperTextProps>;
  SelectProps?: Partial<SelectProps>;
}
export function TextField(props: TextFieldProps) {
  const p = useProps("MuiTextField", props);
  const unique = createUniqueId();
  const id = () => p.id ?? unique;
  const inputSetting = (key: "value" | "defaultValue" | "startAdornment") => {
    const input = slotProps(p, "input");
    if (Object.hasOwn(input, key)) return input[key];
    if (p.InputProps && Object.hasOwn(p.InputProps, key))
      return p.InputProps[key];
    return p[key];
  };
  // Match InputBase's one-time default seed while keeping controlled values live.
  const [initialDefaultValue] = createSignal(() =>
    untrack(() => (p.select ? p.defaultValue : inputSetting("defaultValue"))),
  );
  const initialFilled = () => {
    const html = slotProps(p, "htmlInput");
    const value =
      (p.select
        ? p.value
        : (inputSetting("value") ??
          (Object.hasOwn(html, "value") ? html.value : p.inputProps?.value))) ??
      initialDefaultValue();
    return Array.isArray(value)
      ? value.length > 0
      : value != null && value !== "";
  };
  const InputComponent = dynamic(
    () =>
      p.slots?.input ??
      (p.variant === "filled"
        ? FilledInput
        : p.variant === "standard"
          ? Input
          : OutlinedInput),
  );
  const LabelComponent = dynamic(() => p.slots?.inputLabel ?? InputLabel);
  const HelperComponent = dynamic(
    () => p.slots?.formHelperText ?? FormHelperText,
  );
  const SelectComponent = dynamic(() => p.slots?.select ?? Select);
  return (
    <FormControl
      {...omit(p, "onFocus", "onBlur", "onKeyDown")}
      _name="MuiTextField"
      _initialFilled={initialFilled()}
      _adornedStart={!!inputSetting("startAdornment")}
      id={undefined}
      variant={p.variant ?? "outlined"}
      class={[resolveMuiClassName("MuiTextField-root"), p.class]}
    >
      {p.label != null && (
        <LabelComponent
          {...p.InputLabelProps}
          {...slotProps(p, "inputLabel")}
          htmlFor={id()}
          id={`${id()}-label`}
        >
          {p.label}
        </LabelComponent>
      )}
      {p.select ? (
        <SelectComponent
          {...p.SelectProps}
          {...slotProps(p, "select")}
          id={id()}
          labelId={`${id()}-label`}
          label={p.label}
          variant={p.variant}
          value={p.value}
          defaultValue={p.defaultValue}
          onChange={p.onChange as SelectProps["onChange"]}
          onFocus={p.onFocus}
          onBlur={p.onBlur}
          onKeyDown={p.onKeyDown}
          disabled={p.disabled}
          required={p.required}
          name={p.name}
        >
          {p.children}
        </SelectComponent>
      ) : (
        <InputComponent
          {...omit(
            p,
            "children",
            "slots",
            "slotProps",
            "class",
            "className",
            "sx",
            "ref",
            "component",
            "InputProps",
            "InputLabelProps",
            "FormHelperTextProps",
            "SelectProps",
            "select",
            "helperText",
          )}
          {...p.InputProps}
          {...slotProps(p, "input")}
          id={id()}
          label={p.label}
          inputProps={{ ...p.inputProps, ...slotProps(p, "htmlInput") }}
          slots={merge(p.InputProps?.slots ?? {}, {
            get input() {
              return p.slots?.htmlInput ?? p.InputProps?.slots?.input;
            },
          })}
          slotProps={{
            ...p.InputProps?.slotProps,
            htmlInput: slotProps(p, "htmlInput"),
          }}
          aria-describedby={
            p.helperText ? `${id()}-helper-text` : p["aria-describedby"]
          }
          sx={undefined}
        />
      )}{" "}
      {p.helperText != null && (
        <HelperComponent
          {...p.FormHelperTextProps}
          {...slotProps(p, "formHelperText")}
          id={`${id()}-helper-text`}
        >
          {p.helperText}
        </HelperComponent>
      )}
    </FormControl>
  );
}
export interface NativeSelectProps extends Omit<
  InputBaseProps,
  "value" | "defaultValue" | "inputProps" | "onChange" | "inputRef"
> {
  label?: JSX.Element;
  disableUnderline?: boolean;
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  disabled?: boolean;
  required?: boolean;
  name?: string;
  multiple?: boolean;
  variant?: "standard" | "outlined" | "filled";
  inputProps?: JSX.SelectHTMLAttributes<HTMLSelectElement>;
  /** A Solid input component or render factory; receives InputBase props. */
  input?: ValidComponent;
  IconComponent?: ValidComponent;
  onChange?: (event: InputEvent) => void;
  inputRef?: InputRef<HTMLSelectElement>;
}
export function NativeSelect(props: NativeSelectProps) {
  const p = useProps("MuiNativeSelect", props);
  const f = useFormControl();
  const [value, setValue] = useControlled(
    () => p.value,
    () => p.defaultValue ?? "",
  );
  const variant = () => p.variant ?? f?.props.variant ?? "standard";
  const disabled = () => p.disabled ?? f?.props.disabled;
  const Wrapper = dynamic(
    () =>
      p.input ??
      (variant() === "outlined"
        ? OutlinedInput
        : variant() === "filled"
          ? FilledInput
          : Input),
  );
  const Icon = dynamic(() => p.IconComponent ?? Arrow);
  const NativeField = (attrs: MuiProps & Record<string, unknown>) => (
    <>
      <Root
        name="MuiNativeSelect"
        slot="select"
        ownerProps={p}
        component="select"
        props={
          merge(
            omit(
              attrs,
              "ref",
              "onInput",
              "onChange",
              "onFocus",
              "onBlur",
              "onKeyDown",
              "children",
            ),
            {
              get name() {
                return p.name ?? p.inputProps?.name;
              },
            },
          ) as MuiProps
        }
        ref={(el: HTMLSelectElement) =>
          untrack(() => {
            setRef(attrs.ref, el);
            setRef(p.inputRef, el);
          })
        }
        id={p.id ?? p.inputProps?.id}
        value={value() as string | number | string[]}
        multiple={p.multiple ?? p.inputProps?.multiple}
        disabled={disabled()}
        required={p.required ?? f?.props.required}
        onInput={(event: InputEvent) => callHandler(attrs.onInput, event)}
        onChange={(event: InputEvent) => {
          callHandler(attrs.onChange, event);
          if (event.defaultPrevented) return;
          const el = event.currentTarget as HTMLSelectElement;
          setValue(
            (p.multiple ?? p.inputProps?.multiple)
              ? Array.from(el.selectedOptions, (option) => option.value)
              : el.value,
          );
          p.onChange?.(event);
        }}
        onFocus={(event: FocusEvent) =>
          untrack(() => callHandler(attrs.onFocus, event))
        }
        onBlur={(event: FocusEvent) =>
          untrack(() => callHandler(attrs.onBlur, event))
        }
        onKeyDown={(event: KeyboardEvent) =>
          callHandler(attrs.onKeyDown, event)
        }
        state={{
          disabled: !!disabled(),
          variant: variant(),
          multiple: !!(p.multiple ?? p.inputProps?.multiple),
        }}
        styles={(t) => ({
          appearance: "none",
          font: "inherit",
          letterSpacing: "inherit",
          color: "inherit",
          background: "transparent",
          border: 0,
          outline: 0,
          minWidth: 16,
          cursor: disabled() ? "default" : "pointer",
          paddingRight: variant() === "standard" ? 24 : 32,
          height: "1.4375em",
          "&:focus": { backgroundColor: t.palette.action.hover },
          "&::-ms-expand": { display: "none" },
          "&[multiple]": {
            height: "auto",
            paddingRight: variant() === "standard" ? 0 : 14,
          },
        })}
      >
        {p.children}
      </Root>
      {!(p.multiple ?? p.inputProps?.multiple) && (
        <Root
          name="MuiNativeSelect"
          slot="icon"
          ownerProps={p}
          component="span"
          state={{ disabled: !!disabled(), variant: variant() }}
          styles={(t) => ({
            position: "absolute",
            right: variant() === "standard" ? 0 : 7,
            top: "calc(50% - 12px)",
            pointerEvents: "none",
            display: "flex",
            color: disabled()
              ? t.palette.action.disabled
              : t.palette.action.active,
          })}
        >
          <Icon />
        </Root>
      )}
    </>
  );
  return (
    <Root
      name="MuiNativeSelect"
      props={omit(
        p,
        "children",
        "input",
        "inputProps",
        "inputRef",
        "onChange",
        "value",
        "defaultValue",
        "variant",
        "slots",
        "slotProps",
      )}
      ownerProps={p}
      component={Wrapper}
      inputComponent={NativeField}
      inputProps={p.inputProps}
      value={value()}
      disabled={p.disabled ?? f?.props.disabled}
      required={p.required ?? f?.props.required}
      fullWidth={p.fullWidth ?? f?.props.fullWidth}
      label={p.label}
      error={p.error ?? f?.props.error}
      size={p.size ?? f?.props.size}
      disableUnderline={p.disableUnderline}
      onChange={undefined}
      styles={{ position: "relative" }}
    />
  );
}
export interface SelectProps<T = unknown> extends Omit<
  InputBaseProps,
  "value" | "defaultValue" | "onChange" | "inputProps" | "inputRef"
> {
  disableUnderline?: boolean;
  /** Solid input component or render factory receiving InputBase props. */
  input?: ValidComponent;
  tabIndex?: number;
  error?: boolean;
  value?: T;
  defaultValue?: T;
  multiple?: boolean;
  native?: boolean;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  name?: string;
  label?: JSX.Element;
  labelId?: string;
  variant?: "standard" | "outlined" | "filled";
  size?: "small" | "medium";
  fullWidth?: boolean;
  displayEmpty?: boolean;
  renderValue?: (value: T) => JSX.Element;
  open?: boolean;
  defaultOpen?: boolean;
  onOpen?: (event: Event) => void;
  onClose?: (event: Event) => void;
  onChange?: (event: SelectChangeEvent<T>, child?: HTMLElement) => void;
  inputProps?: JSX.InputHTMLAttributes<HTMLInputElement>;
  inputRef?: InputRef<HTMLInputElement>;
  MenuProps?: Partial<OverlayMenuProps>;
  SelectDisplayProps?: MuiProps;
  IconComponent?: ValidComponent;
  autoWidth?: boolean;
}
export function areEqualValues(a: unknown, b: unknown): boolean {
  if (typeof b === "object" && b !== null) return a === b;
  // The value could be a number, the DOM will stringify it anyway.
  return String(a) === String(b);
}
export function isEmpty(display: unknown): boolean {
  return display == null || (typeof display === "string" && !display.trim());
}
export function getOpenInteractionType(
  event: MouseEvent | KeyboardEvent | TouchEvent | PointerEvent | null,
): "keyboard" | "pointer" | null {
  if (!event) return null;
  if (["mousedown", "pointerdown", "touchstart"].includes(event.type))
    return "pointer";
  if (
    event.type === "keydown" ||
    (event.type === "click" && "detail" in event && event.detail === 0)
  )
    return "keyboard";
  return null;
}
export type SelectFocusSource = "keyboard" | "mouse" | "touch" | null;
const SelectFocusContext = /* @__PURE__ */ createContext<{
  focusSource: () => SelectFocusSource;
} | null>(null);
export interface SelectFocusSourceProviderProps {
  value: SelectFocusSource | (() => SelectFocusSource);
  children?: JSX.Element;
}
export function SelectFocusSourceProvider(p: SelectFocusSourceProviderProps) {
  return (
    <SelectFocusContext
      value={{
        focusSource: () =>
          typeof p.value === "function" ? p.value() : p.value,
      }}
    >
      {p.children}
    </SelectFocusContext>
  );
}
export function useSelectFocusSource(): () => SelectFocusSource {
  return useContext(SelectFocusContext)?.focusSource ?? (() => null);
}
function cloneSelectLabel(label: JSX.Element): JSX.Element {
  if (Array.isArray(label)) return label.map(cloneSelectLabel);
  if (typeof Node !== "undefined" && label instanceof Node)
    return label.cloneNode(true);
  return label;
}
type OptionElement = HTMLElement & {
  __muiValue?: unknown;
};
export function Select<T = unknown>(props: SelectProps<T>) {
  const registry: SelectOptionRegistry = {
    collectOnly: true,
    options: [],
    register(option) {
      if (registry.collectOnly) registry.options.push(option);
    },
  };
  const Content = () => {
    registry.collectOnly = true;
    // Capture source option metadata without constructing popup DOM in this owner.
    // The live menu still resolves its reactive children inside the portal owner.
    try {
      untrack(() => resolveSelectOptionSources(props.children));
    } finally {
      registry.collectOnly = false;
    }
    return <SelectController {...props} />;
  };
  return (
    <SelectOptionRegistryContext value={registry}>
      <Content />
    </SelectOptionRegistryContext>
  );
}
function resolveSelectOptionSources(value: unknown): void {
  if (typeof value === "function") resolveSelectOptionSources(value());
  else if (Array.isArray(value)) value.forEach(resolveSelectOptionSources);
}
function SelectController<T = unknown>(props: SelectProps<T>) {
  const registry = useContext(SelectOptionRegistryContext);
  const p = useProps("MuiSelect", props);
  const f = useFormControl();
  const theme = useTheme();
  const id = createUniqueId();
  const [value, setValue] = useControlled<unknown>(
    () => p.value,
    () => p.defaultValue ?? (p.multiple ? [] : ""),
  );
  const [open, setOpen] = useControlled(
    () => p.open,
    () => !!p.defaultOpen,
  );
  const [options, setOptions] = createSignal<OptionElement[]>([]);
  const [optionsCollected, setOptionsCollected] = createSignal(false);
  const [active, setActive] = createSignal(-1);
  const [focusSource, setFocusSource] = createSignal<SelectFocusSource>(null);
  let host: HTMLElement | undefined;
  let trigger: HTMLElement | undefined;
  let list: HTMLElement | undefined;
  let typed = "";
  let typingTimer: ReturnType<typeof setTimeout> | undefined;
  const getValue = (el: OptionElement) => el.__muiValue ?? el.dataset.value;
  const equal = areEqualValues;
  const selected = (el: OptionElement) =>
    p.multiple
      ? (Array.isArray(value()) ? (value() as unknown[]) : []).some((v) =>
          equal(v, getValue(el)),
        )
      : equal(value(), getValue(el));
  const disabled = () => p.disabled ?? f?.props.disabled;
  const error = () => p.error ?? f?.props.error;
  const variant = () => p.variant ?? f?.props.variant ?? "outlined";
  const collect = () => {
    if (!list) return;
    const elements = Array.from(
      list.querySelectorAll<OptionElement>("[data-value]"),
    );
    setOptions(elements);
    setOptionsCollected(true);
    elements.forEach((el) => {
      el.setAttribute("role", "option");
      el.setAttribute("tabindex", "-1");
    });
  };
  onSettled(() => {
    collect();
    const observer =
      typeof MutationObserver !== "undefined" && list
        ? new MutationObserver(collect)
        : undefined;
    if (observer && list)
      observer.observe(list, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["data-value", "aria-disabled"],
      });
    return () => {
      observer?.disconnect();
      clearTimeout(typingTimer);
    };
  });
  createEffect(
    () => ({
      els: options(),
      selection: options().map(selected),
      filled: Array.isArray(value())
        ? (value() as unknown[]).length > 0
        : value() != null && value() !== "",
    }),
    ({ els, selection, filled }) => {
      f?.setFilled(filled);
      els.forEach((el, index) => {
        el.setAttribute("aria-selected", String(selection[index]));
        el.id ||= `${id}-option-${index}`;
      });
    },
  );
  let highlightedOption: OptionElement | undefined;
  createEffect(
    () => ({ els: options(), index: active() }),
    ({ els, index }) => {
      const next = els[index];
      if (highlightedOption !== next) {
        if (highlightedOption) highlightedOption.dataset.highlighted = "false";
        if (next) next.dataset.highlighted = "true";
        highlightedOption = next;
      }
    },
  );
  const close = (e: Event) => {
    setOpen(false);
    p.onClose?.(e);
  };
  const show = (e: Event) => {
    if (disabled() || p.readOnly) return;
    setFocusSource(
      e.type === "keydown" ||
        (e.type === "click" && "detail" in e && (e as MouseEvent).detail === 0)
        ? "keyboard"
        : e.type.startsWith("touch") ||
            ("pointerType" in e && (e as PointerEvent).pointerType === "touch")
          ? "touch"
          : "mouse",
    );
    setOpen(true);
    p.onOpen?.(e);
    const first = options().findIndex(
      (el) => selected(el) && el.getAttribute("aria-disabled") !== "true",
    );
    setActive(
      first >= 0
        ? first
        : options().findIndex(
            (el) => el.getAttribute("aria-disabled") !== "true",
          ),
    );
  };
  createEffect(
    () => open(),
    (isOpen) => {
      if (!isOpen) return;
      const outside = (e: PointerEvent) => {
        if (
          host &&
          !host.contains(e.target as Node) &&
          !list?.contains(e.target as Node)
        )
          close(e);
      };
      document.addEventListener("pointerdown", outside);
      return () => document.removeEventListener("pointerdown", outside);
    },
  );
  const choose = (e: Event, el: OptionElement) => {
    if (disabled() || p.readOnly || el.getAttribute("aria-disabled") === "true")
      return;
    const option = getValue(el);
    const current = Array.isArray(value()) ? (value() as unknown[]) : [];
    const next = p.multiple
      ? selected(el)
        ? current.filter((v) => !equal(v, option))
        : [...current, option]
      : option;
    setValue(next);
    const clone = new Event(e.type, { bubbles: true });
    Object.defineProperty(clone, "target", {
      value: { value: next, name: p.name ?? p.inputProps?.name ?? "" },
      enumerable: true,
    });
    p.onChange?.(clone as SelectChangeEvent<T>, el);
    if (!p.multiple) {
      close(e);
      trigger?.focus();
    }
  };
  const move = (offset: number) => {
    const els = options();
    if (!els.length) return;
    let index = active();
    for (let n = 0; n < els.length; n++) {
      index = (index + offset + els.length) % els.length;
      if (els[index].getAttribute("aria-disabled") !== "true") {
        setActive(index);
        els[index].scrollIntoView({ block: "nearest" });
        break;
      }
    }
  };
  const keydown = (e: KeyboardEvent) => {
    callHandler(p.onKeyDown, e);
    if (e.defaultPrevented || disabled() || p.readOnly) return;
    if (e.key === "Escape") {
      if (open()) {
        e.preventDefault();
        close(e);
      }
      return;
    }
    if (e.key === "Tab") {
      if (open()) close(e);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open()) show(e);
      else move(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Home" || e.key === "End") {
      if (open()) {
        e.preventDefault();
        const els = options();
        const next =
          e.key === "Home"
            ? els.findIndex((el) => el.getAttribute("aria-disabled") !== "true")
            : els.findLastIndex(
                (el) => el.getAttribute("aria-disabled") !== "true",
              );
        setActive(next);
      }
    } else if (e.key === "Enter" || (e.key === " " && !typed)) {
      e.preventDefault();
      if (!open()) show(e);
      else if (options()[active()]) choose(e, options()[active()]);
    } else if (e.key.length === 1) {
      clearTimeout(typingTimer);
      typed += e.key.toLocaleLowerCase();
      typingTimer = setTimeout(() => (typed = ""), 750);
      const els = options();
      const found = els.findIndex(
        (el) =>
          el.getAttribute("aria-disabled") !== "true" &&
          el.textContent?.trim().toLocaleLowerCase().startsWith(typed),
      );
      if (found >= 0) {
        if (open()) setActive(found);
        else choose(e, els[found]);
      }
    }
  };
  const display = (): JSX.Element => {
    if (!p.displayEmpty && isEmpty(value())) return "";
    if (p.renderValue) return p.renderValue(value() as T);
    const selectedValues = p.multiple
      ? Array.isArray(value())
        ? (value() as unknown[])
        : []
      : [value()];
    const sources = registry?.options ?? [];
    const labels = optionsCollected()
      ? options()
          .filter(selected)
          .map((el) => {
            const source = sources.find((option) =>
              equal(getValue(el), option.value()),
            );
            return source ? cloneSelectLabel(source.label()) : el.textContent;
          })
      : sources
          .filter((option) =>
            selectedValues.some((v) => equal(v, option.value())),
          )
          .map((option) => cloneSelectLabel(option.label()));
    return labels.flatMap((label, index) => (index ? [", ", label] : [label]));
  };
  const Icon = dynamic(() => p.IconComponent ?? Arrow);
  const InputWrapper = dynamic(
    () =>
      p.input ??
      (variant() === "filled"
        ? FilledInput
        : variant() === "standard"
          ? Input
          : OutlinedInput),
  );
  const Display = (attrs: MuiProps = {}) => (
    <Root
      name="MuiSelect"
      slot="select"
      ownerProps={p}
      props={p.SelectDisplayProps}
      component="div"
      id={p.id}
      ref={(el: HTMLElement) => {
        trigger = el;
        untrack(() => {
          setRef(attrs.ref, el);
          if (p.SelectDisplayProps?.ref !== attrs.ref)
            setRef(p.SelectDisplayProps?.ref, el);
        });
      }}
      class={attrs.class}
      style={attrs.style}
      role="combobox"
      tabindex={disabled() ? -1 : (p.tabIndex ?? 0)}
      aria-disabled={disabled() || undefined}
      aria-expanded={open()}
      aria-controls={open() ? `${id}-listbox` : undefined}
      aria-haspopup="listbox"
      aria-labelledby={p.labelId}
      aria-label={p["aria-label"]}
      aria-describedby={
        p.SelectDisplayProps?.["aria-describedby"] ?? attrs["aria-describedby"]
      }
      aria-invalid={error() || undefined}
      aria-readonly={p.readOnly || undefined}
      aria-required={(p.required ?? f?.props.required) || undefined}
      aria-activedescendant={
        open() && active() >= 0 ? options()[active()]?.id : undefined
      }
      onClick={(event: MouseEvent) => {
        callInputHandlers(event, attrs.onClick, p.SelectDisplayProps?.onClick);
        if (!event.defaultPrevented) open() ? close(event) : show(event);
      }}
      onKeyDown={(event: KeyboardEvent) => {
        callInputHandlers(
          event,
          p.SelectDisplayProps?.onKeyDown,
          attrs.onKeyDown,
        );
        if (event.defaultPrevented) return;
        keydown(event);
      }}
      onFocus={(e: FocusEvent) =>
        untrack(() => {
          callInputHandlers(e, p.SelectDisplayProps?.onFocus, attrs.onFocus);
          if (e.defaultPrevented) return;
          f?.setFocused(true);
        })
      }
      onBlur={(e: FocusEvent) =>
        untrack(() => {
          callInputHandlers(e, p.SelectDisplayProps?.onBlur, attrs.onBlur);
          if (e.defaultPrevented) return;
          f?.setFocused(false);
        })
      }
      styles={(t) => ({
        position: "relative",
        display: "flex",
        alignItems: "center",
        cursor: disabled() ? "default" : "pointer",
        minHeight: "1.4375em",
        paddingRight: 32,
        paddingLeft: p.startAdornment ? 0 : undefined,
        outline: 0,
        borderRadius: variant() === "standard" ? 0 : t.shape.borderRadius,
        border: 0,
        color: disabled() ? t.palette.text.disabled : undefined,
      })}
    >
      {display() || <span aria-hidden="true">​</span>}
      <span
        style={{
          position: "absolute",
          right: "7px",
          display: "flex",
          transform: open() ? "rotate(180deg)" : undefined,
        }}
      >
        <Icon />
      </span>
    </Root>
  );
  const ControllerInput = (attrs: MuiProps) => (
    <>
      <Display {...attrs} />{" "}
      <Root
        name="MuiSelect"
        slot="nativeInput"
        ownerProps={p}
        component="input"
        props={
          merge(p.inputProps ?? {}, {
            get name() {
              return p.name ?? p.inputProps?.name;
            },
          }) as MuiProps
        }
        ref={(el: HTMLInputElement) =>
          untrack(() => {
            setRef(p.inputRef, el);
            setRef(p.inputProps?.ref, el);
          })
        }
        type="text"
        tabindex={-1}
        aria-hidden="true"
        styles={visuallyHidden}
        onInvalid={(event: Event) => {
          callHandler(p.inputProps?.onInvalid, event);
          if (!event.defaultPrevented) trigger?.focus();
        }}
        onChange={(event: InputEvent) => {
          callHandler(p.inputProps?.onChange, event);
          if (event.defaultPrevented) return;
          const option = options().find((el) =>
            equal(getValue(el), event.currentTarget.value),
          );
          if (option) choose(event, option);
        }}
        value={
          Array.isArray(value())
            ? (value() as unknown[]).join(",")
            : String(value() ?? "")
        }
        disabled={disabled()}
        required={p.required ?? f?.props.required}
      />
      <Popper
        open={open()}
        keepMounted
        anchorEl={() => trigger ?? host ?? null}
        placement="bottom-start"
        disablePortal={p.MenuProps?.disablePortal}
        container={p.MenuProps?.container}
      >
        {" "}
        <Root
          name="MuiSelect"
          slot="listbox"
          ownerProps={p}
          props={p.MenuProps}
          id={`${id}-listbox`}
          role="listbox"
          aria-multiselectable={p.multiple || undefined}
          aria-labelledby={p.labelId}
          ref={(el: HTMLElement) => (list = el)}
          onClick={(e: MouseEvent) => {
            const el = (e.target as Element).closest<OptionElement>(
              "[data-value]",
            );
            if (el) choose(e, el);
          }}
          styles={(t) => ({
            display: open() ? "block" : "none",
            minWidth: host?.getBoundingClientRect().width ?? 80,
            width: p.autoWidth ? "max-content" : undefined,
            maxHeight: 320,
            overflowY: "auto",
            zIndex: t.zIndex.modal + 1,
            padding: "8px 0",
            background: t.palette.background.paper,
            borderRadius: t.shape.borderRadius,
            boxShadow: t.shadows[8],
            "& [role=option][aria-selected=true]": {
              background: t.palette.action.selected,
            },
            "& [role=option]:hover, & [data-highlighted=true]": {
              background: t.palette.action.hover,
            },
          })}
        >
          {p.children}
        </Root>
      </Popper>
    </>
  );
  return (
    <SelectFocusSourceProvider value={focusSource}>
      <>
        {p.native ? (
          <NativeSelect
            {...(p as NativeSelectProps)}
            onChange={p.onChange as NativeSelectProps["onChange"]}
          />
        ) : (
          <Root
            name="MuiSelect"
            ownerProps={p}
            props={omit(
              p,
              "children",
              "input",
              "inputProps",
              "inputRef",
              "value",
              "defaultValue",
              "onChange",
              "onKeyDown",
              "variant",
              "slots",
              "slotProps",
              "component",
            )}
            component={InputWrapper}
            id={undefined}
            ref={(el: HTMLElement) => {
              host = el;
              setRef(
                untrack(() => p.ref),
                el,
              );
            }}
            inputComponent={ControllerInput}
            inputProps={p.inputProps}
            value={value()}
            label={p.label}
            disabled={disabled()}
            error={error()}
            required={p.required ?? f?.props.required}
            fullWidth={p.fullWidth ?? f?.props.fullWidth}
            size={p.size ?? f?.props.size}
            color={p.color ?? f?.props.color}
            disableUnderline={p.disableUnderline}
            startAdornment={p.startAdornment}
            endAdornment={p.endAdornment}
            onChange={undefined}
            state={{
              disabled: !!disabled(),
              error: !!error(),
              variant: variant(),
            }}
            styles={{ position: "relative", minWidth: 80 }}
          />
        )}
      </>
    </SelectFocusSourceProvider>
  );
}
export interface CreateFilterOptionsConfig<V> {
  ignoreAccents?: boolean;
  ignoreCase?: boolean;
  limit?: number;
  matchFrom?: "any" | "start";
  stringify?: (option: V) => string;
  trim?: boolean;
}
export interface FilterOptionsState<V> {
  inputValue: string;
  getOptionLabel: (option: V) => string;
}
export function createFilterOptions<V>(
  config: CreateFilterOptionsConfig<V> = {},
) {
  const normalize = (text: string) => {
    let result = config.trim ? text.trim() : text;
    if (config.ignoreCase !== false) result = result.toLocaleLowerCase();
    if (config.ignoreAccents !== false)
      result = result.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return result;
  };
  return (options: V[], state: FilterOptionsState<V>): V[] => {
    const input = normalize(state.inputValue);
    const filtered = input
      ? options.filter((option) => {
          const label = normalize(
            (config.stringify ?? state.getOptionLabel)(option),
          );
          return config.matchFrom === "start"
            ? label.startsWith(input)
            : label.includes(input);
        })
      : options;
    return config.limit === undefined
      ? filtered
      : filtered.slice(0, config.limit);
  };
}
export type AutocompleteMappedValue<FreeSolo = false> = true extends FreeSolo
  ? number | boolean
  : string | number | boolean;
export type AutocompleteFreeSoloValueMapping<F> = F extends true
  ? string
  : never;
export type AutocompleteValue<V, M, D, F> = M extends true
  ? Array<V | AutocompleteFreeSoloValueMapping<F>>
  : D extends true
    ? NonNullable<V | AutocompleteFreeSoloValueMapping<F>>
    : V | null | AutocompleteFreeSoloValueMapping<F>;
export type AutocompleteResolvedValue<V, Mapped> = Mapped extends undefined
  ? V
  : NoInfer<Mapped>;
export type AutocompleteChangeReason =
  "createOption" | "selectOption" | "removeOption" | "blur" | "clear";
export type AutocompleteCloseReason =
  | "createOption"
  | "toggleInput"
  | "escape"
  | "selectOption"
  | "removeOption"
  | "blur";
export type AutocompleteInputChangeReason =
  "input" | "reset" | "clear" | "blur" | "selectOption" | "removeOption";
export interface AutocompleteChangeDetails<V> {
  option: V;
}
export interface AutocompleteGroupedOption<V = string> {
  key: number;
  index: number;
  group: string;
  options: V[];
}
export interface UseAutocompleteProps<
  V,
  M extends boolean | undefined = undefined,
  D extends boolean | undefined = undefined,
  F extends boolean | undefined = undefined,
  Mapped extends AutocompleteMappedValue<F> | undefined = undefined,
> {
  options: readonly V[];
  value?: AutocompleteValue<AutocompleteResolvedValue<V, Mapped>, M, D, F>;
  defaultValue?: AutocompleteValue<
    AutocompleteResolvedValue<V, Mapped>,
    M,
    D,
    F
  >;
  multiple?: M;
  disableClearable?: D;
  freeSolo?: F;
  inputValue?: string;
  id?: string;
  disabled?: boolean;
  readOnly?: boolean;
  autoComplete?: boolean;
  autoHighlight?: boolean;
  autoSelect?: boolean;
  blurOnSelect?: boolean | "touch" | "mouse";
  clearOnBlur?: boolean;
  clearOnEscape?: boolean;
  selectOnFocus?: boolean;
  disableCloseOnSelect?: boolean;
  disabledItemsFocusable?: boolean;
  disableListWrap?: boolean;
  filterSelectedOptions?: boolean;
  includeInputInList?: boolean;
  handleHomeEndKeys?: boolean;
  openOnFocus?: boolean;
  resetHighlightOnMouseLeave?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  getOptionLabel?: (option: V | AutocompleteFreeSoloValueMapping<F>) => string;
  getOptionValue?: (option: V) => Exclude<Mapped, undefined>;
  getOptionKey?: (option: V | string) => string | number;
  getOptionDisabled?: (option: V) => boolean;
  isOptionEqualToValue?: (
    option: V,
    value:
      | AutocompleteResolvedValue<V, Mapped>
      | AutocompleteFreeSoloValueMapping<F>,
  ) => boolean;
  groupBy?: (option: V) => string;
  filterOptions?: (options: V[], state: FilterOptionsState<V>) => V[];
  onChange?: (
    event: Event,
    value: AutocompleteValue<AutocompleteResolvedValue<V, Mapped>, M, D, F>,
    reason: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails<V>,
  ) => void;
  onInputChange?: (
    event: Event | null,
    value: string,
    reason: AutocompleteInputChangeReason,
  ) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: Event, reason: AutocompleteCloseReason) => void;
  onHighlightChange?: (
    event: Event | null,
    option: V | null,
    reason: "keyboard" | "mouse" | "auto",
  ) => void;
}
export function useAutocomplete<
  V,
  M extends boolean | undefined = undefined,
  D extends boolean | undefined = undefined,
  F extends boolean | undefined = undefined,
  Mapped extends AutocompleteMappedValue<F> = AutocompleteMappedValue<F>,
>(
  props: Omit<UseAutocompleteProps<V, M, D, F, Mapped>, "getOptionValue"> & {
    getOptionValue: (option: V) => Mapped;
  },
): ReturnType<typeof createAutocompleteState<V, M, D, F, Mapped>>;
export function useAutocomplete<
  V,
  M extends boolean | undefined = undefined,
  D extends boolean | undefined = undefined,
  F extends boolean | undefined = undefined,
>(
  props: UseAutocompleteProps<V, M, D, F>,
): ReturnType<typeof createAutocompleteState<V, M, D, F, undefined>>;
export function useAutocomplete<
  V,
  M extends boolean | undefined = undefined,
  D extends boolean | undefined = undefined,
  F extends boolean | undefined = undefined,
  Mapped extends AutocompleteMappedValue<F> | undefined = undefined,
>(
  props: UseAutocompleteProps<V, M, D, F, Mapped>,
): ReturnType<typeof createAutocompleteState<V, M, D, F, Mapped>>;
export function useAutocomplete<
  V,
  M extends boolean | undefined = undefined,
  D extends boolean | undefined = undefined,
  F extends boolean | undefined = undefined,
  Mapped extends AutocompleteMappedValue<F> | undefined = undefined,
>(props: UseAutocompleteProps<V, M, D, F, Mapped>) {
  return createAutocompleteState(props);
}
function createAutocompleteState<
  V,
  M extends boolean | undefined = undefined,
  D extends boolean | undefined = undefined,
  F extends boolean | undefined = undefined,
  Mapped extends AutocompleteMappedValue<F> | undefined = undefined,
>(p: UseAutocompleteProps<V, M, D, F, Mapped>) {
  type Selection = AutocompleteValue<
    AutocompleteResolvedValue<V, Mapped>,
    M,
    D,
    F
  >;
  const unique = createUniqueId();
  const id = () => p.id ?? unique;
  const mapped = (option: V): unknown =>
    p.getOptionValue ? p.getOptionValue(option) : option;
  const label = (option: V | string): string =>
    String(
      p.getOptionLabel
        ? p.getOptionLabel(option as V & AutocompleteFreeSoloValueMapping<F>)
        : ((
            option as {
              label?: unknown;
            }
          )?.label ??
            option ??
            ""),
    );
  const equal = (option: V, v: unknown) =>
    p.isOptionEqualToValue
      ? p.isOptionEqualToValue(
          option,
          v as AutocompleteResolvedValue<V, Mapped>,
        )
      : mapped(option) === v;
  const [value, setValue] = useControlled(
    () => p.value,
    () => p.defaultValue ?? ((p.multiple ? [] : null) as Selection),
  );
  const resolve = (v: unknown): V | string | undefined =>
    p.getOptionValue
      ? (p.options.find((option) => equal(option, v)) ??
        (p.freeSolo && typeof v === "string" ? v : undefined))
      : (v as V | string | undefined);
  const selectionLabel = (v: unknown) => {
    const option = resolve(v);
    return option === undefined ? "" : label(option);
  };
  const [inputValue, setInput] = useControlled(
    () => p.inputValue,
    () => (p.multiple ? "" : selectionLabel(value())),
  );
  const [open, setOpen] = useControlled(
    () => p.open,
    () => !!p.defaultOpen,
  );
  const [focused, setFocused] = createSignal(false);
  const [highlighted, setHighlight] = createSignal(
    untrack(() => (p.autoHighlight ? 0 : -1)),
  );
  let input: HTMLInputElement | undefined;
  let root: HTMLElement | undefined;
  let listbox: HTMLElement | undefined;
  const [focusedItem, setFocusedItem] = createSignal(-1);
  let lastValue = untrack(value);
  let lastLabel = untrack(() => (p.multiple ? "" : selectionLabel(value())));
  const values = () =>
    p.multiple
      ? Array.isArray(value())
        ? (value() as unknown[])
        : []
      : value() == null
        ? []
        : [value()];
  const selected = (option: V) => values().some((v) => equal(option, v));
  const defaultFilterOptions = createFilterOptions<V>();
  const options = createMemo(() => {
    const selectedValues = values();
    const available = p.filterSelectedOptions
      ? p.options.filter(
          (option) => !selectedValues.some((v) => equal(option, v)),
        )
      : [...p.options];
    const search =
      !p.multiple && inputValue() === selectionLabel(value())
        ? ""
        : inputValue();
    return (p.filterOptions ?? defaultFilterOptions)(available, {
      inputValue: search,
      getOptionLabel: label,
    });
  });
  const popupOpen = () => open() && !p.readOnly;
  const inputChange = (
    event: Event | null,
    next: string,
    reason: AutocompleteInputChangeReason,
  ) => {
    if (next === untrack(inputValue)) return;
    setInput(next);
    p.onInputChange?.(event, next, reason);
  };
  createEffect(
    () => ({
      value: value(),
      label: p.multiple ? "" : selectionLabel(value()),
      focused: focused(),
      freeSolo: p.freeSolo,
    }),
    (next) => {
      if (next.value === lastValue && next.label === lastLabel) return;
      lastValue = next.value;
      lastLabel = next.label;
      if (!next.focused || !next.freeSolo)
        inputChange(null, next.label, "reset");
    },
  );
  const highlight = (
    event: Event | null,
    index: number,
    reason: "keyboard" | "mouse" | "auto",
  ) => {
    setHighlight(index);
    p.onHighlightChange?.(event, options()[index] ?? null, reason);
    if (index >= 0)
      listbox
        ?.querySelector<HTMLElement>(`[data-option-index="${index}"]`)
        ?.scrollIntoView({ block: "nearest" });
  };
  const show = (event: Event) => {
    if (p.disabled || p.readOnly) return;
    setOpen(true);
    p.onOpen?.(event);
    highlight(
      event,
      p.autoHighlight
        ? options().findIndex((o) => !p.getOptionDisabled?.(o))
        : -1,
      "auto",
    );
  };
  const close = (event: Event, reason: AutocompleteCloseReason) => {
    setOpen(false);
    p.onClose?.(event, reason);
  };
  const change = (
    event: Event,
    next: unknown,
    reason: AutocompleteChangeReason,
    option?: V,
  ) => {
    setValue(next as Selection);
    p.onChange?.(
      event,
      next as Selection,
      reason,
      option === undefined ? undefined : { option },
    );
  };
  const remove = (event: Event, index: number) => {
    if (p.disabled || p.readOnly) return;
    const current = values();
    if (index < 0 || index >= current.length) return;
    change(
      event,
      current.filter((_, i) => i !== index),
      "removeOption",
      resolve(current[index]) as V,
    );
  };
  const select = (
    event: Event,
    option: V | string,
    reason: AutocompleteChangeReason = "selectOption",
  ) => {
    if (
      p.disabled ||
      p.readOnly ||
      (reason !== "createOption" && p.getOptionDisabled?.(option as V))
    )
      return;
    const item = reason === "createOption" ? option : mapped(option as V);
    let next: unknown = item;
    let finalReason = reason;
    if (p.multiple) {
      const current = values();
      const existing = current.findIndex((v) =>
        reason === "createOption" ? v === item : equal(option as V, v),
      );
      if (existing >= 0) {
        next = current.filter((_, i) => i !== existing);
        finalReason = "removeOption";
      } else next = [...current, item];
    }
    change(event, next, finalReason, option as V);
    inputChange(
      event,
      p.multiple ? "" : label(option),
      finalReason === "removeOption" ? "removeOption" : "selectOption",
    );
    if (
      !p.disableCloseOnSelect &&
      !("ctrlKey" in event && (event as MouseEvent).ctrlKey) &&
      !("metaKey" in event && (event as MouseEvent).metaKey)
    )
      close(
        event,
        finalReason === "removeOption"
          ? "removeOption"
          : finalReason === "createOption"
            ? "createOption"
            : finalReason === "blur"
              ? "blur"
              : "selectOption",
      );
    if (
      p.blurOnSelect === true ||
      (p.blurOnSelect === "touch" && event.type.startsWith("touch")) ||
      (p.blurOnSelect === "mouse" && event.type === "click")
    )
      input?.blur();
  };
  const clear = (event: Event) => {
    if (p.disableClearable || p.disabled || p.readOnly) return;
    inputChange(event, "", "clear");
    change(event, p.multiple ? [] : null, "clear");
    input?.focus();
  };
  const move = (event: KeyboardEvent, delta: number) => {
    const opts = options();
    if (!opts.length) return;
    if (
      !p.disabledItemsFocusable &&
      opts.every((o) => p.getOptionDisabled?.(o))
    ) {
      highlight(event, -1, "keyboard");
      return;
    }
    let index = highlighted() + delta;
    for (let n = 0; n <= opts.length; n++) {
      if (index < 0) {
        if (p.includeInputInList) {
          index = -1;
          break;
        }
        index = p.disableListWrap ? 0 : opts.length - 1;
      }
      if (index >= opts.length) {
        if (p.includeInputInList) {
          index = -1;
          break;
        }
        index = p.disableListWrap ? opts.length - 1 : 0;
      }
      if (p.disabledItemsFocusable || !p.getOptionDisabled?.(opts[index]))
        break;
      index += Math.sign(delta);
    }
    highlight(event, index, "keyboard");
    if (p.autoComplete && index >= 0 && input) {
      const completion = label(opts[index]);
      input.value = completion;
      if (["text", "search", "tel", "url", "password"].includes(input.type))
        input.setSelectionRange(inputValue().length, completion.length);
    }
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || p.disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!popupOpen()) {
        show(event);
        const opts = options();
        highlight(
          event,
          event.key === "ArrowDown"
            ? opts.findIndex(
                (o) => p.disabledItemsFocusable || !p.getOptionDisabled?.(o),
              )
            : opts.findLastIndex(
                (o) => p.disabledItemsFocusable || !p.getOptionDisabled?.(o),
              ),
          "keyboard",
        );
      } else move(event, event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "PageDown" || event.key === "PageUp") {
      if (popupOpen()) {
        event.preventDefault();
        move(event, event.key === "PageDown" ? 5 : -5);
      }
    } else if (
      (event.key === "Home" || event.key === "End") &&
      (p.handleHomeEndKeys ?? !p.freeSolo) &&
      popupOpen()
    ) {
      event.preventDefault();
      const opts = options();
      const next =
        event.key === "Home"
          ? opts.findIndex(
              (o) => p.disabledItemsFocusable || !p.getOptionDisabled?.(o),
            )
          : opts.findLastIndex(
              (o) => p.disabledItemsFocusable || !p.getOptionDisabled?.(o),
            );
      highlight(event, next, "keyboard");
    } else if (event.key === "Enter" && !event.isComposing) {
      if (popupOpen() && highlighted() >= 0 && options()[highlighted()]) {
        event.preventDefault();
        select(event, options()[highlighted()]);
      } else if (p.freeSolo && inputValue().trim()) {
        event.preventDefault();
        select(event, inputValue(), "createOption");
      }
    } else if (event.key === "Escape") {
      if (popupOpen()) {
        event.preventDefault();
        event.stopPropagation();
        close(event, "escape");
      } else if (p.clearOnEscape && !p.disableClearable) {
        event.preventDefault();
        clear(event);
      }
    } else if (
      p.multiple &&
      (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
      (input?.selectionStart === 0 || focusedItem() >= 0)
    ) {
      const next =
        focusedItem() < 0 && event.key === "ArrowLeft"
          ? values().length - 1
          : clamp(
              focusedItem() + (event.key === "ArrowLeft" ? -1 : 1),
              -1,
              values().length - 1,
            );
      setFocusedItem(next);
      if (next < 0) input?.focus();
      else
        root
          ?.querySelector<HTMLElement>(`[data-item-index="${next}"]`)
          ?.focus();
    } else if (
      (event.key === "Backspace" || event.key === "Delete") &&
      p.multiple &&
      !inputValue()
    ) {
      remove(event, focusedItem() >= 0 ? focusedItem() : values().length - 1);
      setFocusedItem(-1);
      input?.focus();
    }
  };
  const blur = (event: FocusEvent) =>
    untrack(() => {
      if (root?.contains(event.relatedTarget as Node)) return;
      setFocused(false);
      if (p.autoSelect && highlighted() >= 0 && popupOpen())
        select(event, options()[highlighted()], "blur");
      else if (p.autoSelect && p.freeSolo && inputValue())
        select(event, inputValue(), "createOption");
      else if (p.clearOnBlur ?? !p.freeSolo)
        inputChange(event, p.multiple ? "" : selectionLabel(value()), "blur");
      close(event, "blur");
    });
  createEffect(
    () => popupOpen(),
    (opened) => {
      if (!opened) return;
      const outside = (event: PointerEvent) => {
        if (
          root &&
          !root.contains(event.target as Node) &&
          !listbox?.contains(event.target as Node)
        )
          close(event, "blur");
      };
      document.addEventListener("pointerdown", outside);
      return () => document.removeEventListener("pointerdown", outside);
    },
  );
  const groupedOptions = createMemo(() => {
    if (!p.groupBy) return options();
    const groups: AutocompleteGroupedOption<V>[] = [];
    options().forEach((option, index) => {
      const group = p.groupBy!(option);
      const last = groups.at(-1);
      if (last?.group === group) last.options.push(option);
      else groups.push({ key: index, index, group, options: [option] });
    });
    return groups;
  });
  return {
    id,
    value,
    inputValue,
    focused,
    popupOpen,
    expanded: popupOpen,
    dirty: () => !!inputValue() || values().length > 0,
    groupedOptions,
    filteredOptions: options,
    highlightedIndex: highlighted,
    focusedItem,
    selected,
    resolveValue: resolve,
    getOptionLabel: label,
    anchorEl: () => root ?? null,
    setAnchorEl: (el: HTMLElement | null) => (root = el ?? undefined),
    getRootProps: (external: Record<string, unknown> = {}) => ({
      ...external,
      ref: (el: HTMLElement) => {
        root = el;
        setRef(
          untrack(() => external.ref),
          el,
        );
      },
      onKeyDown: (event: KeyboardEvent) => {
        callHandler(external.onKeyDown, event);
        onKeyDown(event);
      },
    }),
    getInputLabelProps: () => ({ id: `${id()}-label`, htmlFor: id() }),
    getInputProps: () => ({
      id: id(),
      ref: (el: HTMLInputElement) => (input = el),
      value: inputValue(),
      disabled: p.disabled,
      readonly: p.readOnly,
      role: "combobox",
      "aria-autocomplete": p.autoComplete ? "both" : "list",
      "aria-expanded": popupOpen() ? ("true" as const) : ("false" as const),
      "aria-controls": popupOpen() ? `${id()}-listbox` : undefined,
      "aria-activedescendant":
        popupOpen() && highlighted() >= 0
          ? `${id()}-option-${highlighted()}`
          : undefined,
      autocomplete: "off",
      onInput: (event: InputEvent) => {
        const next = event.currentTarget.value;
        inputChange(event, next, "input");
        setHighlight(p.autoHighlight ? 0 : -1);
        if (next) show(event);
        else if (!p.multiple && !p.disableClearable)
          change(event, null, "clear");
      },
      onFocus: (event: FocusEvent) =>
        untrack(() => {
          setFocused(true);
          if (p.selectOnFocus ?? !p.freeSolo) input?.select();
          if (p.openOnFocus) show(event);
        }),
      onMouseDown: (event: MouseEvent) => {
        if (!popupOpen()) show(event);
      },
      onBlur: blur,
    }),
    getClearProps: () => ({
      type: "button" as const,
      tabIndex: -1,
      onMouseDown: (event: MouseEvent) => event.preventDefault(),
      onClick: clear,
    }),
    getPopupIndicatorProps: () => ({
      type: "button" as const,
      tabIndex: -1,
      onMouseDown: (event: MouseEvent) => event.preventDefault(),
      onClick: (event: Event) => {
        input?.focus();
        popupOpen() ? close(event, "toggleInput") : show(event);
      },
    }),
    getTagProps: ({ index }: { index: number }) => ({
      key: index,
      "data-tag-index": index,
      tabIndex: -1,
      onDelete: (event: Event) => remove(event, index),
    }),
    getItemProps: ({
      index = 0,
    }: {
      index?: number;
    } = {}) => ({
      "data-item-index": index,
      tabIndex: -1,
      onDelete: (event: Event) => remove(event, index),
    }),
    getListboxProps: (external: Record<string, unknown> = {}) => ({
      ...external,
      id: `${id()}-listbox`,
      ref: (el: HTMLElement) => {
        listbox = el;
        setRef(
          untrack(() => external.ref),
          el,
        );
      },
      role: "listbox",
      "aria-labelledby": `${id()}-label`,
      onMouseDown: (event: MouseEvent) => {
        event.preventDefault();
        callHandler(external.onMouseDown, event);
      },
      onMouseLeave: (event: MouseEvent) => {
        if (p.resetHighlightOnMouseLeave) highlight(event, -1, "auto");
        callHandler(external.onMouseLeave, event);
      },
    }),
    getOptionFromValue: (
      v:
        | AutocompleteResolvedValue<V, Mapped>
        | AutocompleteFreeSoloValueMapping<F>,
    ) => {
      const found = p.options.findIndex((option) => equal(option, v));
      return found >= 0
        ? { option: p.options[found] }
        : p.freeSolo && typeof v === "string"
          ? { option: v }
          : !p.getOptionValue
            ? { option: v as V }
            : null;
    },
    getOptionProps: ({ option, index }: { option: V; index: number }) => ({
      key: p.getOptionKey?.(option) ?? label(option),
      id: `${id()}-option-${index}`,
      role: "option",
      tabIndex: -1,
      "data-option-index": index,
      "aria-disabled": p.getOptionDisabled?.(option)
        ? ("true" as const)
        : ("false" as const),
      "aria-selected": selected(option)
        ? ("true" as const)
        : ("false" as const),
      onMouseMove: (event: MouseEvent) => highlight(event, index, "mouse"),
      onClick: (event: MouseEvent) => select(event, option),
    }),
    clear,
    selectOption: select,
    close,
    open: show,
  };
}
export type AutocompleteValueOrFreeSoloValueMapping<V, F> =
  V | AutocompleteFreeSoloValueMapping<F>;
export type UseAutocompleteParameters<
  V,
  M extends boolean | undefined = undefined,
  D extends boolean | undefined = undefined,
  F extends boolean | undefined = undefined,
  Mapped extends AutocompleteMappedValue<F> | undefined = undefined,
> = UseAutocompleteProps<V, M, D, F, Mapped>;
export type UseAutocompleteReturnValue<
  V,
  M extends boolean | undefined = undefined,
  D extends boolean | undefined = undefined,
  F extends boolean | undefined = undefined,
  HasGroupBy extends boolean = false,
  Mapped extends AutocompleteMappedValue<F> | undefined = undefined,
> = Omit<
  ReturnType<typeof createAutocompleteState<V, M, D, F, Mapped>>,
  "groupedOptions"
> & {
  groupedOptions: () => HasGroupBy extends true
    ? AutocompleteGroupedOption<V>[]
    : V[];
};
export type AutocompleteHighlightChangeReason =
  "keyboard" | "mouse" | "touch" | "auto";
export interface AutocompleteRenderInputParams {
  id: string;
  disabled: boolean;
  fullWidth: boolean;
  size: "small" | undefined;
  slotProps: {
    inputLabel: Record<string, unknown>;
    input: Record<string, unknown>;
    htmlInput: JSX.InputHTMLAttributes<HTMLInputElement> &
      Record<string, unknown>;
  };
  InputLabelProps: Record<string, unknown>;
  InputProps: Record<string, unknown>;
  inputProps: JSX.InputHTMLAttributes<HTMLInputElement>;
}
export interface AutocompleteRenderOptionState {
  inputValue: string;
  index: number;
  selected: boolean;
}
export interface AutocompleteRenderGroupParams {
  key: number;
  group: string;
  children?: JSX.Element;
}
export interface AutocompleteProps<
  V,
  M extends boolean | undefined = undefined,
  D extends boolean | undefined = undefined,
  F extends boolean | undefined = undefined,
  ChipComponent = unknown,
  Mapped extends AutocompleteMappedValue<F> | undefined = undefined,
>
  extends
    Omit<
      MuiProps,
      keyof UseAutocompleteProps<V, M, D, F, Mapped> | "onKeyDown"
    >,
    UseAutocompleteProps<V, M, D, F, Mapped> {
  renderInput: (params: AutocompleteRenderInputParams) => JSX.Element;
  renderOption?: (
    props: JSX.HTMLAttributes<HTMLLIElement>,
    option: V,
    state: AutocompleteRenderOptionState,
    ownerState: AutocompleteProps<V, M, D, F, ChipComponent, Mapped>,
  ) => JSX.Element;
  renderGroup?: (params: AutocompleteRenderGroupParams) => JSX.Element;
  renderTags?: (
    value: Array<V | string>,
    getTagProps: (params: { index: number }) => Record<string, unknown>,
    ownerState: AutocompleteProps<V, M, D, F, ChipComponent, Mapped>,
  ) => JSX.Element;
  renderValue?: (
    value: V | string | Array<V | string>,
    getItemProps: (params?: { index?: number }) => Record<string, unknown>,
    ownerState: AutocompleteProps<V, M, D, F, ChipComponent, Mapped>,
  ) => JSX.Element;
  fullWidth?: boolean;
  size?: "small" | "medium";
  limitTags?: number;
  getLimitTagsText?: (more: number) => JSX.Element;
  loading?: boolean;
  loadingText?: JSX.Element;
  noOptionsText?: JSX.Element;
  clearText?: string;
  closeText?: string;
  openText?: string;
  popupIcon?: JSX.Element;
  clearIcon?: JSX.Element;
  forcePopupIcon?: boolean | "auto";
  disablePortal?: boolean;
  onKeyDown?: JSX.EventHandlerUnion<HTMLElement, KeyboardEvent>;
}
function reactiveRecord<T extends object>(get: () => T): T {
  return new Proxy({} as T, {
    get: (_, key) => Reflect.get(get(), key),
    ownKeys: () => Reflect.ownKeys(get()),
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
  });
}
export interface AutocompleteComponent {
  <
    V,
    M extends boolean | undefined = undefined,
    D extends boolean | undefined = undefined,
    F extends boolean | undefined = undefined,
    ChipComponent = unknown,
    Mapped extends AutocompleteMappedValue<F> = AutocompleteMappedValue<F>,
  >(
    props: Omit<
      AutocompleteProps<V, M, D, F, ChipComponent, Mapped>,
      "getOptionValue"
    > & {
      getOptionValue: (option: V) => Mapped;
    },
  ): JSX.Element;
  <
    V,
    M extends boolean | undefined = undefined,
    D extends boolean | undefined = undefined,
    F extends boolean | undefined = undefined,
    ChipComponent = unknown,
  >(
    props: AutocompleteProps<V, M, D, F, ChipComponent>,
  ): JSX.Element;
}
export const Autocomplete: AutocompleteComponent = function Autocomplete<
  V,
  M extends boolean | undefined = undefined,
  D extends boolean | undefined = undefined,
  F extends boolean | undefined = undefined,
  ChipComponent = unknown,
  Mapped extends AutocompleteMappedValue<F> | undefined = undefined,
>(props: AutocompleteProps<V, M, D, F, ChipComponent, Mapped>) {
  const p = useProps("MuiAutocomplete", props);
  const a = createAutocompleteState(p);
  const theme = useTheme();
  const [popupWidth, setPopupWidth] = createSignal(0);
  createEffect(
    () => ({ open: a.popupOpen(), anchor: a.anchorEl() }),
    ({ open, anchor }) => {
      if (!open || !anchor) return;
      const update = () => setPopupWidth(anchor.getBoundingClientRect().width);
      update();
      const observer =
        typeof ResizeObserver === "undefined"
          ? undefined
          : new ResizeObserver(update);
      observer?.observe(anchor);
      return () => observer?.disconnect();
    },
  );
  const Popup = dynamic(() => p.slots?.popper ?? Popper);
  const selectedValues = () => {
    const val = a.value();
    return (
      p.multiple ? (Array.isArray(val) ? val : []) : val == null ? [] : [val]
    )
      .map((v) => a.resolveValue(v))
      .filter((v) => v !== undefined) as Array<V | string>;
  };
  const chips = () =>
    !selectedValues().length ? undefined : p.renderValue ? (
      p.renderValue(
        p.multiple ? selectedValues() : selectedValues()[0],
        a.getItemProps,
        p,
      )
    ) : p.renderTags && p.multiple ? (
      p.renderTags(selectedValues(), a.getTagProps, p)
    ) : p.multiple ? (
      <For
        each={selectedValues().slice(
          0,
          !a.focused() && p.limitTags !== undefined
            ? Math.max(0, p.limitTags)
            : undefined,
        )}
      >
        {(option, index) => (
          <span
            class={resolveMuiClassName("MuiAutocomplete-tag")}
            data-item-index={index()}
            tabindex={-1}
            style={{
              display: "inline-flex",
              "align-items": "center",
              gap: "4px",
              margin: "3px",
              padding: "3px 8px",
              "border-radius": "16px",
              background: theme.palette.action.selected,
              "font-size": ".8125rem",
              "white-space": "nowrap",
            }}
          >
            {a.getOptionLabel(option)}
            {!p.readOnly && !p.disabled && (
              <button
                type="button"
                tabindex={-1}
                aria-label={`Remove ${a.getOptionLabel(option)}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(event) =>
                  a.getTagProps({ index: index() }).onDelete(event)
                }
                style={{
                  border: "none",
                  background: "none",
                  color: "inherit",
                  cursor: "pointer",
                  padding: 0,
                  "font-size": "18px",
                }}
              >
                ×
              </button>
            )}
          </span>
        )}
      </For>
    ) : undefined;
  const endAdornment = (
    <span
      class={resolveMuiClassName("MuiAutocomplete-endAdornment")}
      style={{
        display: "inline-flex",
        "align-items": "center",
        position: "absolute",
        right: "9px",
        top: "calc(50% - 14px)",
      }}
    >
      {!p.disableClearable && !p.disabled && !p.readOnly && a.dirty() && (
        <IconButton
          {...a.getClearProps()}
          size="small"
          aria-label={p.clearText ?? "Clear"}
        >
          {p.clearIcon ?? "×"}
        </IconButton>
      )}
      {p.forcePopupIcon !== false &&
        (p.forcePopupIcon === true || !p.freeSolo) && (
          <IconButton
            {...a.getPopupIndicatorProps()}
            disabled={p.disabled}
            size="small"
            aria-label={
              a.popupOpen() ? (p.closeText ?? "Close") : (p.openText ?? "Open")
            }
            style={{ transform: a.popupOpen() ? "rotate(180deg)" : undefined }}
          >
            {p.popupIcon ?? <Arrow />}
          </IconButton>
        )}
    </span>
  );
  const htmlInput = reactiveRecord(() => ({
    ...a.getInputProps(),
    onKeyDown: undefined,
  }));
  const inputLabel = reactiveRecord(a.getInputLabelProps);
  const startAdornment = (
    <>
      {chips()}
      {!a.focused() &&
        p.limitTags !== undefined &&
        selectedValues().length > p.limitTags && (
          <span>
            {p.getLimitTagsText?.(selectedValues().length - p.limitTags) ??
              `+${selectedValues().length - p.limitTags}`}
          </span>
        )}
    </>
  );
  const input = {
    className: resolveMuiClassName("MuiAutocomplete-inputRoot"),
    get startAdornment() {
      return selectedValues().length && (p.multiple || p.renderValue)
        ? startAdornment
        : undefined;
    },
    endAdornment,
  };
  const params = reactiveRecord(() => ({
    id: a.id(),
    disabled: !!p.disabled,
    fullWidth: true,
    size: p.size === "small" ? ("small" as const) : undefined,
    slotProps: {
      inputLabel,
      input,
      htmlInput: htmlInput as JSX.InputHTMLAttributes<HTMLInputElement> &
        Record<string, unknown>,
    },
    InputLabelProps: inputLabel,
    InputProps: input,
    inputProps: htmlInput as JSX.InputHTMLAttributes<HTMLInputElement>,
  }));
  const renderOption = (option: V, index: () => number) => {
    const optionProps = createMemo(() =>
      a.getOptionProps({ option, index: index() }),
    );
    const custom = createMemo(() =>
      p.renderOption?.(
        optionProps() as JSX.HTMLAttributes<HTMLLIElement>,
        option,
        {
          inputValue: a.inputValue(),
          index: index(),
          selected: a.selected(option),
        },
        p,
      ),
    );
    return (
      <>
        {p.renderOption ? (
          custom()
        ) : (
          <Root
            name="MuiAutocomplete"
            slot="option"
            ownerProps={p}
            component="li"
            {...optionProps()}
            styles={(t) => ({
              display: "flex",
              alignItems: "center",
              minHeight: 48,
              padding: "6px 16px",
              cursor: p.getOptionDisabled?.(option) ? "default" : "pointer",
              opacity: p.getOptionDisabled?.(option) ? 0.38 : 1,
              background:
                a.highlightedIndex() === index()
                  ? t.palette.action.hover
                  : a.selected(option)
                    ? t.palette.action.selected
                    : undefined,
              "&:hover": { background: t.palette.action.hover },
            })}
          >
            {a.getOptionLabel(option)}
          </Root>
        )}
      </>
    );
  };
  return (
    <Root
      name="MuiAutocomplete"
      props={p}
      {...a.getRootProps()}
      id={undefined}
      onKeyDown={(event: KeyboardEvent) => {
        callHandler(p.onKeyDown, event);
        a.getRootProps().onKeyDown(event);
      }}
      state={{ focused: a.focused(), expanded: a.popupOpen() }}
      styles={{
        position: "relative",
        width: p.fullWidth ? "100%" : 300,
        [resolveMuiClassName("& .MuiInputBase-root")]: {
          paddingRight: 64,
          flexWrap: "wrap",
        },
        [resolveMuiClassName("& .MuiInputBase-input")]: {
          width: "auto",
          minWidth: 30,
          flexGrow: 1,
        },
      }}
    >
      {p.renderInput(params)}
      {a.popupOpen() && (
        <Root
          name="MuiAutocomplete"
          slot="popper"
          ownerProps={p}
          component={Popup}
          open={a.popupOpen()}
          anchorEl={a.anchorEl}
          placement="bottom-start"
          disablePortal={p.disablePortal}
        >
          <Root
            name="MuiAutocomplete"
            slot="paper"
            ownerProps={p}
            styles={(t) => ({
              width: popupWidth(),
              zIndex: t.zIndex.modal + 1,
              background: t.palette.background.paper,
              color: t.palette.text.primary,
              borderRadius: t.shape.borderRadius,
              boxShadow: t.shadows[8],
              overflow: "hidden",
            })}
          >
            {p.loading && !a.filteredOptions().length ? (
              <Root
                name="MuiAutocomplete"
                slot="loading"
                ownerProps={p}
                props={slotProps(p, "status") as MuiProps}
                component={p.slots?.status ?? "div"}
                role="status"
                styles={{ padding: "14px 16px" }}
              >
                {p.loadingText ?? (
                  <span
                    style={{
                      display: "block",
                      height: "20px",
                      width: "65%",
                      background: theme.palette.action.hover,
                      "border-radius": "4px",
                    }}
                  />
                )}
              </Root>
            ) : !a.filteredOptions().length && !p.freeSolo ? (
              <Root
                name="MuiAutocomplete"
                slot="noOptions"
                ownerProps={p}
                props={slotProps(p, "status") as MuiProps}
                component={p.slots?.status ?? "div"}
                role="status"
                styles={{ padding: "14px 16px" }}
              >
                {p.noOptionsText ?? "No options"}
              </Root>
            ) : (
              <Root
                name="MuiAutocomplete"
                slot="listbox"
                ownerProps={p}
                component="ul"
                {...a.getListboxProps()}
                aria-multiselectable={p.multiple || undefined}
                styles={{
                  listStyle: "none",
                  margin: 0,
                  padding: "8px 0",
                  maxHeight: "40vh",
                  overflow: "auto",
                }}
              >
                {p.groupBy ? (
                  <For
                    each={a.groupedOptions() as AutocompleteGroupedOption<V>[]}
                  >
                    {(group) =>
                      p.renderGroup ? (
                        p.renderGroup({
                          key: group.key,
                          group: group.group,
                          children: (
                            <For each={group.options}>
                              {(option, index) =>
                                renderOption(
                                  option,
                                  () => group.index + index(),
                                )
                              }
                            </For>
                          ),
                        })
                      ) : (
                        <li>
                          <div
                            class={resolveMuiClassName(
                              "MuiAutocomplete-groupLabel",
                            )}
                            style={{
                              position: "sticky",
                              top: "-8px",
                              padding: "8px 16px",
                              background: theme.palette.background.paper,
                              color: theme.palette.text.secondary,
                              "font-size": ".875rem",
                            }}
                          >
                            {group.group}
                          </div>
                          <ul style={{ padding: 0, "list-style": "none" }}>
                            <For each={group.options}>
                              {(option, index) =>
                                renderOption(
                                  option,
                                  () => group.index + index(),
                                )
                              }
                            </For>
                          </ul>
                        </li>
                      )
                    }
                  </For>
                ) : (
                  <For each={a.filteredOptions()}>
                    {(option, index) => renderOption(option, index)}
                  </For>
                )}
              </Root>
            )}
          </Root>
        </Root>
      )}
    </Root>
  );
};
export interface SliderMarkData {
  value: number;
  label?: JSX.Element;
}
export interface SliderProps extends MuiProps {
  value?: number | number[];
  defaultValue?: number | number[];
  min?: number;
  max?: number;
  step?: number | null;
  shiftStep?: number;
  marks?: boolean | readonly SliderMarkData[];
  disabled?: boolean;
  disableSwap?: boolean;
  color?: Color;
  size?: "small" | "medium";
  orientation?: "horizontal" | "vertical";
  track?: "normal" | "inverted" | false;
  scale?: (value: number) => number;
  name?: string;
  tabIndex?: number;
  valueLabelDisplay?: "auto" | "on" | "off";
  valueLabelFormat?: string | ((value: number, index: number) => JSX.Element);
  getAriaLabel?: (index: number) => string;
  getAriaValueText?: (value: number, index: number) => string;
  onChange?: (
    event: Event,
    value: number | number[],
    activeThumb: number,
  ) => void;
  onChangeCommitted?: (event: Event, value: number | number[]) => void;
}
export function Slider(props: SliderProps) {
  const p = useProps("MuiSlider", props);
  const theme = useTheme();
  const [value, setValue] = useControlled(
    () => p.value,
    () => p.defaultValue ?? p.min ?? 0,
  );
  const [active, setActive] = createSignal(-1);
  const [hover, setHover] = createSignal(-1);
  let host: HTMLElement | undefined;
  let dragIndex = -1;
  let latestValue: number | number[] = untrack(value);
  const min = () => p.min ?? 0;
  const max = () => Math.max(min(), p.max ?? 100);
  const range = () => max() - min() || 1;
  const values = createMemo(() =>
    Array.isArray(value())
      ? (value() as number[])
          .map((v) => clamp(v, min(), max()))
          .sort((a, b) => a - b)
      : [clamp(value() as number, min(), max())],
  );
  const stepSize = () =>
    typeof p.step === "number" && p.step > 0 ? p.step : 1;
  const marks = createMemo(() =>
    Array.isArray(p.marks)
      ? p.marks
      : p.marks && p.step !== null
        ? Array.from(
            { length: Math.min(10000, Math.floor(range() / stepSize()) + 1) },
            (_, index) => ({ value: min() + index * stepSize() }),
          )
        : [],
  );
  const percent = (v: number) => ((v - min()) / range()) * 100;
  const vertical = () => p.orientation === "vertical";
  const round = (n: number) => {
    if (p.step === null) {
      const ms = marks();
      return ms.length
        ? ms.reduce(
            (best, m) =>
              Math.abs(m.value - n) < Math.abs(best - n) ? m.value : best,
            ms[0].value,
          )
        : min();
    }
    const step = stepSize();
    return clamp(
      Number((Math.round((n - min()) / step) * step + min()).toPrecision(12)),
      min(),
      max(),
    );
  };
  const trackStart = () => (values().length > 1 ? percent(values()[0]) : 0);
  const trackEnd = () => percent(values().at(-1)!);
  const trackSize = () => trackEnd() - trackStart();
  const update = (event: Event, next: number, index: number) => {
    if (p.disabled) return;
    const current = values();
    let newIndex = index;
    if (current.length > 1) {
      next = p.disableSwap
        ? clamp(
            next,
            index === 0 ? min() : current[index - 1],
            index === current.length - 1 ? max() : current[index + 1],
          )
        : next;
      const updated = current.map((v, i) => (i === index ? next : v));
      const sorted = [...updated].sort((a, b) => a - b);
      newIndex = sorted.indexOf(next);
      latestValue = sorted;
    } else latestValue = next;
    if (dragIndex >= 0) dragIndex = newIndex;
    setActive(newIndex);
    setValue(latestValue);
    p.onChange?.(event, latestValue, newIndex);
  };
  const fromPointer = (event: PointerEvent) => {
    if (!host) return min();
    const box = host.getBoundingClientRect();
    let ratio = vertical()
      ? (box.bottom - event.clientY) / box.height
      : (event.clientX - box.left) / box.width;
    if (!vertical() && theme.direction === "rtl") ratio = 1 - ratio;
    return round(min() + clamp(ratio, 0, 1) * range());
  };
  const start = (event: PointerEvent) => {
    if (p.disabled || event.button !== 0) return;
    event.preventDefault();
    host?.setPointerCapture(event.pointerId);
    const next = fromPointer(event);
    const current = values();
    dragIndex = current.reduce(
      (best, v, i) =>
        Math.abs(v - next) < Math.abs(current[best] - next) ? i : best,
      0,
    );
    latestValue = value();
    update(event, next, dragIndex);
    host
      ?.querySelector<HTMLElement>(
        resolveMuiClassName(`.MuiSlider-input[data-index="${dragIndex}"]`),
      )
      ?.focus();
  };
  const end = (event: PointerEvent) => {
    if (dragIndex < 0) return;
    p.onChangeCommitted?.(event, latestValue);
    dragIndex = -1;
    setActive(-1);
    if (host?.hasPointerCapture(event.pointerId))
      host.releasePointerCapture(event.pointerId);
  };
  return (
    <Root
      name="MuiSlider"
      props={p}
      component="span"
      ref={(el: HTMLElement) => {
        host = el;
        setRef(
          untrack(() => p.ref),
          el,
        );
      }}
      state={{
        disabled: !!p.disabled,
        marked: marks().some((mark) => mark.label != null),
        dragging: active() >= 0,
      }}
      onPointerDown={start}
      onPointerMove={(event: PointerEvent) => {
        if (dragIndex >= 0) update(event, fromPointer(event), dragIndex);
      }}
      onPointerUp={end}
      onPointerCancel={end}
      styles={(t) => ({
        display: "inline-block",
        position: "relative",
        boxSizing: "content-box",
        touchAction: "none",
        WebkitTapHighlightColor: "transparent",
        borderRadius: 12,
        color: p.disabled
          ? t.palette.action.disabled
          : palette(t, p.color).main,
        cursor: p.disabled ? "default" : "pointer",
        width: vertical() ? (p.size === "small" ? 2 : 4) : "100%",
        height: vertical() ? "100%" : p.size === "small" ? 2 : 4,
        padding: vertical() ? "0 13px" : "13px 0",
        minHeight: vertical() ? 100 : undefined,
      })}
    >
      <Root
        name="MuiSlider"
        slot="rail"
        ownerProps={p}
        component="span"
        styles={{
          display: "block",
          position: "absolute",
          backgroundColor: "currentColor",
          opacity: p.track === "inverted" ? 1 : 0.38,
          borderRadius: "inherit",
          width: vertical() ? "inherit" : "100%",
          height: vertical() ? "100%" : "inherit",
          top: vertical() ? 0 : "50%",
          left: vertical() ? "50%" : 0,
          transform: vertical() ? "translateX(-50%)" : "translateY(-50%)",
        }}
      />
      {p.track !== false && (
        <Root
          name="MuiSlider"
          slot="track"
          ownerProps={p}
          component="span"
          style={{
            width: vertical() ? undefined : `${trackSize()}%`,
            height: vertical() ? `${trackSize()}%` : undefined,
            left: vertical()
              ? "50%"
              : theme.direction === "rtl"
                ? undefined
                : `${trackStart()}%`,
            right:
              !vertical() && theme.direction === "rtl"
                ? `${trackStart()}%`
                : undefined,
            bottom: vertical() ? `${trackStart()}%` : undefined,
          }}
          styles={(t) => ({
            position: "absolute",
            backgroundColor:
              p.track === "inverted"
                ? t.palette.background.paper
                : "currentColor",
            opacity: p.track === "inverted" ? 0.7 : 1,
            border: `1px solid ${p.track === "inverted" ? t.palette.background.paper : "currentColor"}`,
            borderRadius: "inherit",
            width: vertical() ? "inherit" : undefined,
            height: vertical() ? undefined : "inherit",
            top: vertical() ? undefined : "50%",
            transform: vertical() ? "translateX(-50%)" : "translateY(-50%)",
          })}
        />
      )}
      <For each={marks()}>
        {(mark) => {
          const marked = () =>
            p.track === false
              ? values().includes(mark.value)
              : p.track === "inverted"
                ? mark.value <= values()[0] || mark.value >= values().at(-1)!
                : mark.value >= min() + (trackStart() / 100) * range() &&
                  mark.value <= values().at(-1)!;
          return (
            <>
              <Root
                name="MuiSlider"
                slot="mark"
                ownerProps={p}
                component="span"
                state={{ markActive: marked() }}
                style={{
                  left: vertical()
                    ? "50%"
                    : theme.direction === "rtl"
                      ? undefined
                      : `${percent(mark.value)}%`,
                  right:
                    !vertical() && theme.direction === "rtl"
                      ? `${percent(mark.value)}%`
                      : undefined,
                  bottom: vertical() ? `${percent(mark.value)}%` : undefined,
                }}
                styles={{
                  position: "absolute",
                  width: 2,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: "currentColor",
                  top: vertical() ? undefined : "50%",
                  transform: vertical()
                    ? "translate(-50%,50%)"
                    : theme.direction === "rtl"
                      ? "translate(50%,-50%)"
                      : "translate(-50%,-50%)",
                  opacity: marked() ? 0.8 : 1,
                }}
              />
              {mark.label != null && (
                <Root
                  name="MuiSlider"
                  slot="markLabel"
                  ownerProps={p}
                  component="span"
                  state={{ markLabelActive: marked() }}
                  style={{
                    left: vertical()
                      ? 26
                      : theme.direction === "rtl"
                        ? undefined
                        : `${percent(mark.value)}%`,
                    right:
                      !vertical() && theme.direction === "rtl"
                        ? `${percent(mark.value)}%`
                        : undefined,
                    bottom: vertical() ? `${percent(mark.value)}%` : undefined,
                  }}
                  styles={(t) => ({
                    ...t.typography.body2,
                    position: "absolute",
                    top: vertical() ? undefined : 30,
                    transform: vertical()
                      ? "translateY(50%)"
                      : theme.direction === "rtl"
                        ? "translateX(50%)"
                        : "translateX(-50%)",
                    color: marked()
                      ? t.palette.text.primary
                      : t.palette.text.secondary,
                    whiteSpace: "nowrap",
                  })}
                >
                  {mark.label}
                </Root>
              )}
            </>
          );
        }}
      </For>
      <For each={Array.from({ length: values().length }, (_, i) => i)}>
        {(index) => {
          const v = () => values()[index];
          const labelOpen = () =>
            p.valueLabelDisplay === "on" ||
            (p.valueLabelDisplay === "auto" &&
              (active() === index || hover() === index));
          const label = () =>
            typeof p.valueLabelFormat === "function"
              ? p.valueLabelFormat(p.scale?.(v()) ?? v(), index)
              : (p.valueLabelFormat ?? p.scale?.(v()) ?? v());
          return (
            <Root
              name="MuiSlider"
              slot="thumb"
              ownerProps={p}
              component="span"
              data-index={index}
              state={{ active: active() === index }}
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(-1)}
              style={{
                left: vertical()
                  ? "50%"
                  : theme.direction === "rtl"
                    ? undefined
                    : `${percent(v())}%`,
                right:
                  !vertical() && theme.direction === "rtl"
                    ? `${percent(v())}%`
                    : undefined,
                bottom: vertical() ? `${percent(v())}%` : undefined,
              }}
              styles={(t) => ({
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: p.size === "small" ? 12 : 20,
                height: p.size === "small" ? 12 : 20,
                borderRadius: "50%",
                backgroundColor: "currentColor",
                top: vertical() ? undefined : "50%",
                transform: vertical()
                  ? "translate(-50%,50%)"
                  : theme.direction === "rtl"
                    ? "translate(50%,-50%)"
                    : "translate(-50%,-50%)",
                boxShadow:
                  active() === index || hover() === index
                    ? `0 0 0 8px ${alpha(palette(t, p.color).main, 0.16)}`
                    : t.shadows[1],
              })}
            >
              <Root
                name="MuiSlider"
                slot="input"
                ownerProps={p}
                props={
                  {
                    get name() {
                      return p.name;
                    },
                  } as MuiProps
                }
                component="input"
                data-index={index}
                type="range"
                dir={vertical() ? "ltr" : theme.direction}
                min={min()}
                max={max()}
                step={p.step === null ? "any" : stepSize()}
                value={v()}
                disabled={p.disabled}
                tabindex={p.tabIndex}
                aria-label={p.getAriaLabel?.(index) ?? p["aria-label"]}
                aria-labelledby={p["aria-labelledby"]}
                aria-orientation={vertical() ? "vertical" : "horizontal"}
                aria-valuemin={p.scale?.(min()) ?? min()}
                aria-valuemax={p.scale?.(max()) ?? max()}
                aria-valuenow={p.scale?.(v()) ?? v()}
                aria-valuetext={p.getAriaValueText?.(
                  p.scale?.(v()) ?? v(),
                  index,
                )}
                onFocus={() => untrack(() => setActive(index))}
                onBlur={() => untrack(() => setActive(-1))}
                onInput={(event: InputEvent) =>
                  update(event, round(Number(event.currentTarget.value)), index)
                }
                onChange={(event: InputEvent) =>
                  p.onChangeCommitted?.(event, latestValue)
                }
                onKeyDown={(event: KeyboardEvent) => {
                  let next: number | undefined;
                  if (event.key === "Home") next = min();
                  else if (event.key === "End") next = max();
                  else if (event.key === "PageUp")
                    next = v() + (p.shiftStep ?? 10);
                  else if (event.key === "PageDown")
                    next = v() - (p.shiftStep ?? 10);
                  else if (event.shiftKey && event.key.startsWith("Arrow"))
                    next =
                      v() +
                      (event.key === "ArrowUp" ||
                      event.key ===
                        (theme.direction === "rtl" && !vertical()
                          ? "ArrowLeft"
                          : "ArrowRight")
                        ? 1
                        : -1) *
                        (p.shiftStep ?? 10);
                  if (next !== undefined) {
                    event.preventDefault();
                    update(event, round(next), index);
                    p.onChangeCommitted?.(event, latestValue);
                  }
                }}
                styles={{
                  position: "absolute",
                  opacity: 0,
                  width: "100%",
                  height: "100%",
                  margin: 0,
                  padding: 0,
                  cursor: "inherit",
                }}
              />
              {p.valueLabelDisplay !== "off" && p.valueLabelDisplay != null && (
                <Root
                  name="MuiSlider"
                  slot="valueLabel"
                  ownerProps={p}
                  component="span"
                  state={{ open: labelOpen() }}
                  styles={(t) => ({
                    ...t.typography.body2,
                    position: "absolute",
                    bottom: 30,
                    backgroundColor: t.palette.grey[600],
                    color: "#fff",
                    padding: "4px 12px",
                    borderRadius: 2,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    transform: labelOpen() ? "scale(1)" : "scale(0)",
                    transition: t.transitions.create("transform"),
                  })}
                >
                  {label()}
                </Root>
              )}
            </Root>
          );
        }}
      </For>
    </Root>
  );
}
export interface IconContainerProps extends MuiProps {
  value: number;
}
export interface RatingProps extends MuiProps {
  IconContainerComponent?: ValidComponent;
  value?: number | null;
  defaultValue?: number | null;
  max?: number;
  precision?: number;
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
  size?: Size;
  highlightSelectedOnly?: boolean;
  icon?: JSX.Element;
  emptyIcon?: JSX.Element;
  emptyLabelText?: JSX.Element;
  getLabelText?: (value: number) => string;
  onChange?: (event: Event, value: number | null) => void;
  onChangeActive?: (event: Event, value: number) => void;
}
const Star = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="m12 17.27 6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);
const StarBorder = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="m22 9.24-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z" />
  </svg>
);
export function Rating(props: RatingProps) {
  const p = useProps("MuiRating", props);
  const theme = useTheme();
  const unique = createUniqueId();
  const name = () => p.name ?? unique;
  const [value, setValue] = useControlled(
    () => p.value,
    () => p.defaultValue ?? null,
  );
  const [hover, setHover] = createSignal(-1);
  const [focused, setFocused] = createSignal(-1);
  const [focusVisible, setFocusVisible] = createSignal(false);
  const precision = () => Math.max(0.01, Math.min(1, p.precision ?? 1));
  const max = () => Math.max(1, Math.floor(p.max ?? 5));
  const rounded = () =>
    value() == null
      ? null
      : clamp(
          Number(
            (Math.round(value()! / precision()) * precision()).toPrecision(12),
          ),
          0,
          max(),
        );
  const display = () =>
    hover() >= 0 ? hover() : focused() >= 0 ? focused() : (rounded() ?? 0);
  const label = (number: number) =>
    p.getLabelText?.(number) ?? `${number} Star${number === 1 ? "" : "s"}`;
  const change = (event: Event, next: number | null) => {
    if (p.disabled || p.readOnly) return;
    setValue(next);
    if (next == null) {
      setHover(-1);
      setFocused(-1);
    }
    p.onChange?.(event, next);
  };
  const focus = (event: FocusEvent, number: number) =>
    untrack(() => {
      setFocused(number);
      setFocusVisible(
        (event.currentTarget as HTMLElement).matches(":focus-visible"),
      );
    });
  const blur = () =>
    untrack(() => {
      setFocused(-1);
      setFocusVisible(false);
    });
  const itemInput = (number: number) => (
    <input
      id={`${name()}-${number}`}
      type="radio"
      name={name()}
      value={number}
      disabled={p.disabled}
      checked={rounded() === number}
      aria-label={label(number)}
      onFocus={(event: FocusEvent) => untrack(() => focus(event, number))}
      onBlur={blur}
      onChange={(event: Event) =>
        change(event, hover() >= 0 ? hover() : number)
      }
      class={resolveMuiClassName("MuiRating-visuallyHidden")}
      style={visuallyHidden as JSX.CSSProperties}
    />
  );
  return (
    <Root
      name="MuiRating"
      props={omit(p, "IconContainerComponent")}
      component="span"
      role={p.readOnly ? "img" : undefined}
      aria-label={p.readOnly ? label(rounded() ?? 0) : p["aria-label"]}
      state={{
        disabled: !!p.disabled,
        readOnly: !!p.readOnly,
        focusVisible: focusVisible(),
      }}
      onMouseLeave={(event: MouseEvent) => {
        setHover(-1);
        p.onChangeActive?.(event, -1);
        callHandler(p.onMouseLeave, event);
      }}
      styles={(t) => ({
        display: "inline-flex",
        position: "relative",
        direction: t.direction,
        width: "min-content",
        color: "#faaf00",
        fontSize: p.size === "small" ? 18 : p.size === "large" ? 30 : 24,
        opacity: p.disabled ? 0.38 : 1,
        cursor: p.disabled || p.readOnly ? "default" : "pointer",
        pointerEvents: p.disabled || p.readOnly ? "none" : undefined,
        WebkitTapHighlightColor: "transparent",
        "& svg": { width: "1em", height: "1em", flexShrink: 0 },
        "&:has(input:focus-visible)": t.focusVisible || {
          outline: "1px solid #999",
          outlineOffset: 2,
        },
      })}
    >
      <For each={Array.from({ length: max() }, (_, i) => i + 1)}>
        {(star) => {
          const active = () => Math.ceil(display()) === star;
          const fractions = () =>
            Array.from({ length: Math.ceil(1 / precision()) }, (_, i) =>
              Math.min(
                star,
                Number((star - 1 + (i + 1) * precision()).toPrecision(12)),
              ),
            );
          return (
            <Root
              name="MuiRating"
              slot="decimal"
              ownerProps={p}
              component={p.IconContainerComponent ?? "span"}
              value={star}
              state={{ iconActive: active() }}
              styles={{
                position: "relative",
                display: "inline-flex",
                cursor: "inherit",
              }}
              onMouseMove={(event: MouseEvent) => {
                if (p.disabled || p.readOnly) return;
                const box = (
                  event.currentTarget as HTMLElement
                ).getBoundingClientRect();
                const fraction = clamp(
                  (theme.direction === "rtl"
                    ? box.right - event.clientX
                    : event.clientX - box.left) / box.width,
                  0,
                  1,
                );
                const next = clamp(
                  Number(
                    (
                      Math.ceil((star - 1 + fraction) / precision()) *
                      precision()
                    ).toPrecision(12),
                  ),
                  precision(),
                  max(),
                );
                setHover(next);
                if (next !== hover()) p.onChangeActive?.(event, next);
              }}
              onClick={(event: MouseEvent) => {
                if (
                  p.disabled ||
                  p.readOnly ||
                  event.target instanceof HTMLInputElement
                )
                  return;
                event.preventDefault();
                const next = hover() >= 0 ? hover() : star;
                (event.currentTarget as HTMLElement)
                  .querySelector<HTMLInputElement>(`input[value="${next}"]`)
                  ?.focus();
                change(event, rounded() === next ? null : next);
              }}
            >
              {!p.readOnly && (
                <For each={fractions().filter((number) => number < star)}>
                  {(number) => (
                    <Root
                      name="MuiRating"
                      slot="label"
                      ownerProps={p}
                      component="label"
                      for={`${name()}-${number}`}
                      class={resolveMuiClassName("MuiRating-visuallyHidden")}
                      styles={visuallyHidden}
                    >
                      {itemInput(number)}
                      {label(number)}
                    </Root>
                  )}
                </For>
              )}
              <Root
                name="MuiRating"
                slot="label"
                ownerProps={p}
                component={p.readOnly ? "span" : "label"}
                for={p.readOnly ? undefined : `${name()}-${star}`}
                state={{ pristine: rounded() == null }}
                styles={{
                  display: "inline-flex",
                  position: "relative",
                  cursor: "inherit",
                }}
              >
                <Root
                  name="MuiRating"
                  slot="icon"
                  ownerProps={p}
                  component="span"
                  class={resolveMuiClassName("MuiRating-iconEmpty")}
                  state={{ iconEmpty: true }}
                  styles={(t) => ({
                    display: "inline-flex",
                    pointerEvents: "none",
                    color: t.palette.action.disabled,
                  })}
                >
                  {p.emptyIcon ?? <StarBorder />}
                </Root>
                <Root
                  name="MuiRating"
                  slot="icon"
                  ownerProps={p}
                  component="span"
                  class={resolveMuiClassName("MuiRating-iconFilled")}
                  state={{
                    iconFilled: true,
                    iconHover: hover() >= 0 && active(),
                    iconFocus: focusVisible() && active(),
                    iconActive: active(),
                  }}
                  style={{
                    width: `${clamp(display() - star + 1, 0, 1) * 100}%`,
                  }}
                  styles={{
                    position: "absolute",
                    left: theme.direction === "rtl" ? undefined : 0,
                    right: theme.direction === "rtl" ? 0 : undefined,
                    top: 0,
                    overflow: "hidden",
                    display: "inline-flex",
                    pointerEvents: "none",
                    opacity: p.highlightSelectedOnly && !active() ? 0 : 1,
                  }}
                >
                  {p.icon ?? <Star />}
                </Root>
                {!p.readOnly && itemInput(star)}
              </Root>
            </Root>
          );
        }}
      </For>
      {!p.readOnly && (
        <Root
          name="MuiRating"
          slot="label"
          ownerProps={p}
          component="label"
          class={[
            resolveMuiClassName("MuiRating-labelEmptyValue"),
            resolveMuiClassName("MuiRating-visuallyHidden"),
          ]}
          for={`${name()}-empty`}
          state={{ labelEmptyValueActive: focused() === 0 }}
          styles={visuallyHidden}
        >
          <input
            id={`${name()}-empty`}
            type="radio"
            name={name()}
            value=""
            checked={rounded() == null}
            disabled={p.disabled}
            aria-label={
              typeof p.emptyLabelText === "string" ? p.emptyLabelText : "Empty"
            }
            onChange={(event) => change(event, null)}
            onFocus={(event) => untrack(() => focus(event, 0))}
            onBlur={blur}
          />
          {p.emptyLabelText ?? "Empty"}
        </Root>
      )}
    </Root>
  );
}
export interface ToggleButtonProps extends ButtonBaseProps {
  value: unknown;
  selected?: boolean;
  color?: Color | "standard";
  size?: Size;
  onChange?: (event: MouseEvent, value: unknown) => void;
}
export interface ToggleButtonGroupProps extends MuiProps {
  value?: unknown;
  defaultValue?: unknown;
  exclusive?: boolean;
  orientation?: "horizontal" | "vertical";
  color?: Color | "standard";
  size?: Size;
  disabled?: boolean;
  fullWidth?: boolean;
  onChange?: (event: MouseEvent, value: unknown) => void;
}
const ToggleContext = /* @__PURE__ */ createContext<{
  props: ToggleButtonGroupProps;
  value: () => unknown;
  change: (event: MouseEvent, value: unknown) => void;
} | null>(null);
export function ToggleButtonGroup(props: ToggleButtonGroupProps) {
  const p = useProps("MuiToggleButtonGroup", props);
  const [value, setValue] = useControlled(
    () => p.value,
    () => p.defaultValue ?? (p.exclusive ? null : []),
  );
  return (
    <ToggleContext
      value={{
        props: p,
        value,
        change(event, item) {
          const current = value();
          const next = p.exclusive
            ? current === item
              ? null
              : item
            : Array.isArray(current)
              ? current.includes(item)
                ? current.filter((v) => v !== item)
                : [...current, item]
              : [item];
          setValue(next);
          p.onChange?.(event, next);
        },
      }}
    >
      <Root
        name="MuiToggleButtonGroup"
        props={p}
        role="group"
        styles={(t) => ({
          display: "inline-flex",
          flexDirection: p.orientation === "vertical" ? "column" : "row",
          borderRadius: t.shape.borderRadius,
          width: p.fullWidth ? "100%" : undefined,
          [resolveMuiClassName("& .MuiToggleButton-root")]: {
            borderRadius: 0,
            flex: p.fullWidth ? 1 : undefined,
          },
          [resolveMuiClassName("& .MuiToggleButton-root:first-of-type")]: {
            borderTopLeftRadius: t.shape.borderRadius,
            borderBottomLeftRadius:
              p.orientation === "vertical" ? 0 : t.shape.borderRadius,
            borderTopRightRadius:
              p.orientation === "vertical" ? t.shape.borderRadius : 0,
          },
          [resolveMuiClassName("& .MuiToggleButton-root:last-of-type")]: {
            borderBottomRightRadius: t.shape.borderRadius,
            borderTopRightRadius:
              p.orientation === "vertical" ? 0 : t.shape.borderRadius,
            borderBottomLeftRadius:
              p.orientation === "vertical" ? t.shape.borderRadius : 0,
          },
          [resolveMuiClassName(
            "& .MuiToggleButton-root + .MuiToggleButton-root",
          )]: {
            marginLeft: p.orientation === "vertical" ? undefined : -1,
            marginTop: p.orientation === "vertical" ? -1 : undefined,
          },
        })}
      />
    </ToggleContext>
  );
}
export function ToggleButton(props: ToggleButtonProps) {
  const group = useContext(ToggleContext);
  const p = useProps(
    "MuiToggleButton",
    merge(
      group?.props
        ? {
            get color() {
              return group.props.color;
            },
            get size() {
              return group.props.size;
            },
            get disabled() {
              return group.props.disabled;
            },
          }
        : {},
      props,
    ),
  );
  const selected = () =>
    p.selected ??
    (group?.props.exclusive
      ? group.value() === p.value
      : Array.isArray(group?.value()) &&
        (group!.value() as unknown[]).includes(p.value));
  return (
    <ButtonBase
      {...p}
      _name="MuiToggleButton"
      aria-pressed={selected() ? "true" : "false"}
      class={[
        resolveMuiClassName("MuiToggleButton-root"),
        selected() && "Mui-selected",
        p.class,
      ]}
      onClick={(event: MouseEvent) => {
        callHandler(p.onClick, event);
        if (event.defaultPrevented) return;
        p.onChange?.(event, p.value);
        group?.change(event, p.value);
      }}
      _styles={(t) => {
        const color =
          p.color && p.color !== "standard"
            ? palette(t, p.color).main
            : t.palette.text.primary;
        return {
          ...t.typography.button,
          padding: p.size === "small" ? 7 : p.size === "large" ? 19 : 11,
          border: `1px solid ${t.palette.divider}`,
          borderRadius: t.shape.borderRadius,
          color: selected() ? color : t.palette.text.secondary,
          background: selected() ? alpha(color, 0.08) : undefined,
          "&:hover": { background: alpha(color, selected() ? 0.12 : 0.04) },
          "&.Mui-disabled": { color: t.palette.action.disabled },
        };
      }}
    />
  );
}
