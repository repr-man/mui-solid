import { omit, untrack } from "solid-js";
import type { JSX } from "@solidjs/web";
import { Root, setRef } from "./core";
import type { MuiProps } from "./core";
import type { SliderProps } from "./inputs";
import type { CSSObject, Theme } from "./theme";

export interface SliderSlotProps extends Omit<
  Partial<SliderProps>,
  "value" | "defaultValue" | "onChange"
> {
  ownerState?: Partial<SliderProps> & {
    active?: boolean;
    focusVisible?: boolean;
    marked?: boolean;
    open?: boolean;
  };
  active?: boolean;
  focusVisible?: boolean;
  open?: boolean;
}
const state = (p: SliderSlotProps) => p.ownerState ?? p;
const sliderColor = (p: SliderSlotProps) => {
  const color = state(p).color;
  return color && color !== "inherit" ? color : "primary";
};
const vertical = (p: SliderSlotProps) => state(p).orientation === "vertical";
function primitive(
  slot: string,
  styles: (p: SliderSlotProps, theme: Theme) => CSSObject,
) {
  return (p: SliderSlotProps): JSX.Element => (
    <Root
      name="MuiSlider"
      slot={slot}
      props={omit(p, "ownerState", "active", "open")}
      ownerProps={omit(state(p), "slots", "slotProps") as MuiProps}
      component="span"
      ref={(node: HTMLElement) =>
        setRef(
          untrack(() => p.ref),
          node,
        )
      }
      state={{
        active: p.active ?? state(p).active,
        disabled: state(p).disabled,
        focusVisible: state(p).focusVisible,
      }}
      styles={(theme) => styles(p, theme)}
    />
  );
}
/** Material slider slots, reusable as the defaults for `slots`. */
export const SliderRoot = primitive("root", (p, t) => ({
  display: "inline-block",
  position: "relative",
  boxSizing: "content-box",
  touchAction: "none",
  WebkitTapHighlightColor: "transparent",
  borderRadius: 12,
  color: state(p).disabled
    ? t.palette.action.disabled
    : state(p).color === "inherit"
      ? "inherit"
      : t.palette[sliderColor(p)].main,
  cursor: state(p).disabled ? "default" : "pointer",
  width: vertical(p) ? (state(p).size === "small" ? 2 : 4) : "100%",
  height: vertical(p) ? "100%" : state(p).size === "small" ? 2 : 4,
  padding: vertical(p) ? "0 13px" : "13px 0",
  minHeight: vertical(p) ? 100 : undefined,
}));
export const SliderRail = primitive("rail", (p) => ({
  display: "block",
  position: "absolute",
  backgroundColor: "currentColor",
  opacity: state(p).track === "inverted" ? 1 : 0.38,
  borderRadius: "inherit",
  width: vertical(p) ? "inherit" : "100%",
  height: vertical(p) ? "100%" : "inherit",
  top: vertical(p) ? 0 : "50%",
  left: vertical(p) ? "50%" : 0,
  transform: vertical(p) ? "translateX(-50%)" : "translateY(-50%)",
}));
export const SliderTrack = primitive("track", (p, t) => ({
  display: "block",
  position: "absolute",
  border: "1px solid currentColor",
  backgroundColor:
    state(p).track === "inverted" ? t.palette.background.paper : "currentColor",
  opacity: state(p).track === "inverted" ? 0.7 : 1,
  borderRadius: "inherit",
  height: vertical(p) ? undefined : "inherit",
  width: vertical(p) ? "inherit" : undefined,
  top: vertical(p) ? undefined : "50%",
  left: vertical(p) ? "50%" : undefined,
  transform: vertical(p) ? "translateX(-50%)" : "translateY(-50%)",
}));
export const SliderThumb = primitive("thumb", (p, t) => ({
  position: "absolute",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: state(p).size === "small" ? 12 : 20,
  height: state(p).size === "small" ? 12 : 20,
  borderRadius: "50%",
  outline: 0,
  backgroundColor: "currentColor",
  boxShadow: t.shadows[1],
  top: vertical(p) ? undefined : "50%",
  left: vertical(p) ? "50%" : undefined,
  transform: vertical(p)
    ? "translate(-50%,50%)"
    : t.direction === "rtl"
      ? "translate(50%,-50%)"
      : "translate(-50%,-50%)",
  transition: t.transitions.create(["box-shadow", "width", "height"], {
    duration: t.transitions.duration.shortest,
  }),
  "&:hover, &:focus-visible": {
    boxShadow: `0 0 0 8px ${t.alpha(t.palette[sliderColor(p)].main, 0.16)}`,
  },
  "&::before": {
    position: "absolute",
    content: '""',
    borderRadius: "inherit",
    inset: 0,
  },
  "&::after": {
    position: "absolute",
    content: '""',
    width: 42,
    height: 42,
    borderRadius: "50%",
  },
}));
export const SliderMark = primitive("mark", (p) => ({
  position: "absolute",
  width: 2,
  height: 2,
  borderRadius: 1,
  backgroundColor: "currentColor",
  top: vertical(p) ? undefined : "50%",
  left: vertical(p) ? "50%" : undefined,
  transform: vertical(p) ? "translate(-50%,50%)" : "translate(-50%,-50%)",
}));
export const SliderMarkLabel = primitive("markLabel", (p, t) => ({
  ...t.typography.body2,
  position: "absolute",
  whiteSpace: "nowrap",
  color:
    (p.active ?? state(p).active)
      ? t.palette.text.primary
      : t.palette.text.secondary,
  top: vertical(p) ? undefined : 30,
  left: vertical(p) ? 26 : undefined,
  transform: vertical(p)
    ? "translateY(50%)"
    : t.direction === "rtl"
      ? "translateX(50%)"
      : "translateX(-50%)",
}));
export interface SliderValueLabelProps extends SliderSlotProps {
  value?: JSX.Element;
}
export function SliderValueLabel(p: SliderValueLabelProps): JSX.Element {
  return (
    <Root
      name="MuiSlider"
      slot="valueLabel"
      props={omit(p, "ownerState", "value", "open", "active")}
      ownerProps={omit(state(p), "slots", "slotProps") as MuiProps}
      component="span"
      ref={(node: HTMLElement) =>
        setRef(
          untrack(() => p.ref),
          node,
        )
      }
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
        transform:
          (p.open ?? state(p).open) === false ? "scale(0)" : "scale(1)",
        transition: t.transitions.create("transform", {
          duration: t.transitions.duration.shortest,
        }),
      })}
    >
      {p.value ?? p.children}
    </Root>
  );
}
