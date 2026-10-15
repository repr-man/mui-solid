import type { CSSProperties } from "@emotion/serialize";
import type { Responsive, Theme } from "./theme";

/**
 * All style-system property names supported by the MUI v9.5.0 default sx config.
 * This registry is also used to consume these props before they reach a DOM node.
 */
export const systemPropNames = [
  "border",
  "borderTop",
  "borderRight",
  "borderBottom",
  "borderLeft",
  "borderColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "outline",
  "outlineColor",
  "borderRadius",
  "color",
  "bgcolor",
  "backgroundColor",
  "p",
  "pt",
  "pr",
  "pb",
  "pl",
  "px",
  "py",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "paddingX",
  "paddingY",
  "paddingInline",
  "paddingInlineStart",
  "paddingInlineEnd",
  "paddingBlock",
  "paddingBlockStart",
  "paddingBlockEnd",
  "m",
  "mt",
  "mr",
  "mb",
  "ml",
  "mx",
  "my",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "marginX",
  "marginY",
  "marginInline",
  "marginInlineStart",
  "marginInlineEnd",
  "marginBlock",
  "marginBlockStart",
  "marginBlockEnd",
  "displayPrint",
  "display",
  "overflow",
  "textOverflow",
  "visibility",
  "whiteSpace",
  "flexBasis",
  "flexDirection",
  "flexWrap",
  "justifyContent",
  "alignItems",
  "alignContent",
  "order",
  "flex",
  "flexGrow",
  "flexShrink",
  "alignSelf",
  "justifyItems",
  "justifySelf",
  "gap",
  "rowGap",
  "columnGap",
  "gridColumn",
  "gridRow",
  "gridAutoFlow",
  "gridAutoColumns",
  "gridAutoRows",
  "gridTemplateColumns",
  "gridTemplateRows",
  "gridTemplateAreas",
  "gridArea",
  "position",
  "zIndex",
  "top",
  "right",
  "bottom",
  "left",
  "boxShadow",
  "width",
  "maxWidth",
  "minWidth",
  "height",
  "maxHeight",
  "minHeight",
  "boxSizing",
  "font",
  "fontFamily",
  "fontSize",
  "fontStyle",
  "fontWeight",
  "letterSpacing",
  "textTransform",
  "lineHeight",
  "textAlign",
  "typography",
] as const;

export type SystemPropName = (typeof systemPropNames)[number];

type SystemPropValue<K extends SystemPropName> = K extends "bgcolor"
  ? CSSProperties["backgroundColor"]
  : K extends "displayPrint"
    ? CSSProperties["display"]
    : K extends "typography"
      ? keyof Theme["typography"] | CSSProperties["font"]
      : K extends keyof CSSProperties
        ? CSSProperties[K] | number
        : string | number;

/** Responsive system props, with optional theme-aware value functions. */
export type SystemProps = {
  [K in SystemPropName]?:
    | Responsive<SystemPropValue<K>>
    | ((theme: Theme) => Responsive<SystemPropValue<K>>);
};
