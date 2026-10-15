import { resolveMuiClassName } from "./class-names";
import { generateUtilityClass } from "./utility-classes";
import {
  createContext,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  Show,
  untrack,
  useContext,
} from "solid-js";
import { dynamic } from "@solidjs/web";
import type { JSX, ValidComponent, ComponentProps } from "@solidjs/web";
import {
  Root,
  simple,
  useProps,
  clamp,
  callHandler,
  slotProps,
  setRef,
} from "./core";
import { systemPropNames } from "./system-props";
import type { SystemProps } from "./system-props";
import { omit } from "solid-js";
import type { MuiProps, Color, Size } from "./core";
import { getOverlayAlpha, GlobalStyles, useTheme } from "./theme";
const alpha = (color: string, opacity: number) =>
  useTheme().alpha(color, opacity);
import type { CSSObject, Responsive, TypographyVariant, Theme } from "./theme";
export type BoxOwnProps = Omit<MuiProps, keyof SystemProps | "component"> &
  SystemProps;
export type BoxProps<
  C extends ValidComponent = "div",
  AdditionalProps extends object = {},
> = BoxOwnProps &
  AdditionalProps & {
    component?: C;
  } & Omit<ComponentProps<C>, keyof BoxOwnProps | "component">;
export interface BoxTypeMap<
  AdditionalProps extends object = {},
  RootComponent extends ValidComponent = "div",
> {
  props: BoxOwnProps & AdditionalProps;
  defaultComponent: RootComponent;
}
export function Box<C extends ValidComponent = "div">(
  props: BoxProps<C>,
): JSX.Element {
  const p = useProps("MuiBox", props);
  return (
    <Root
      name="MuiBox"
      props={omit(p, ...systemPropNames) as MuiProps}
      onInput={(p as Record<string, unknown>).onInput}
      onChange={(p as Record<string, unknown>).onChange}
      styles={(t) =>
        t.unstable_sx(
          Object.fromEntries(
            systemPropNames
              .filter((key) => key in p)
              .map((key) => [key, p[key]]),
          ),
        )
      }
    />
  );
}
export interface ContainerProps extends MuiProps {
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false;
  fixed?: boolean;
  disableGutters?: boolean;
}
export const Container = /* @__PURE__ */ simple<ContainerProps>(
  "MuiContainer",
  "div",
  (p, t) => ({
    width: "100%",
    marginInline: "auto",
    boxSizing: "border-box",
    ...(!p.disableGutters
      ? { paddingInline: 16, [t.breakpoints.up("sm")]: { paddingInline: 24 } }
      : {}),
    ...(p.fixed
      ? Object.fromEntries(
          t.breakpoints.keys
            .filter((k) => t.breakpoints.values[k] > 0)
            .map((k) => [
              t.breakpoints.up(k),
              { maxWidth: t.breakpoints.values[k] },
            ]),
        )
      : {}),
    ...(p.maxWidth !== false
      ? {
          [t.breakpoints.up(p.maxWidth ?? "lg")]: {
            maxWidth:
              p.maxWidth === "xs"
                ? 444
                : t.breakpoints.values[p.maxWidth ?? "lg"],
          },
        }
      : {}),
  }),
);
export interface StackProps extends MuiProps {
  direction?: Responsive<"row" | "column" | "row-reverse" | "column-reverse">;
  spacing?: Responsive<number | string>;
  divider?: JSX.Element | (() => JSX.Element);
  useFlexGap?: boolean;
  alignItems?: Responsive<string>;
  justifyContent?: Responsive<string>;
}
export function Stack(props: StackProps): JSX.Element {
  const p = useProps("MuiStack", props);
  return (
    <Root
      name="MuiStack"
      props={p}
      styles={(t) => ({
        display: "flex",
        ...t.unstable_sx({
          flexDirection: p.direction ?? "column",
          gap: p.spacing ?? 0,
          alignItems: p.alignItems,
          justifyContent: p.justifyContent,
        }),
      })}
    >
      {p.divider ? (
        <StackChildren divider={p.divider}>{p.children}</StackChildren>
      ) : (
        p.children
      )}
    </Root>
  );
}
function StackChildren(p: {
  children?: JSX.Element;
  divider: JSX.Element | (() => JSX.Element);
}) {
  const values = createMemo(() => flatten(p.children));
  const divider = createMemo(() => p.divider);
  const separator = (): JSX.Element => {
    const value = divider();
    return typeof value === "function"
      ? value()
      : typeof Node !== "undefined" && value instanceof Node
        ? value.cloneNode(true)
        : value;
  };
  return (
    <For each={values()}>
      {(child, index) => (
        <>
          {index() > 0 && separator()}
          {child}
        </>
      )}
    </For>
  );
}
function flatten(value: JSX.Element): JSX.Element[] {
  return Array.isArray(value)
    ? value.flatMap(flatten)
    : value == null || typeof value === "boolean"
      ? []
      : [value];
}
export interface GridProps extends MuiProps {
  container?: boolean;
  size?: Responsive<number | "auto" | "grow">;
  offset?: Responsive<number | "auto">;
  columns?: Responsive<number>;
  spacing?: Responsive<number | string>;
  rowSpacing?: Responsive<number | string>;
  columnSpacing?: Responsive<number | string>;
  direction?: Responsive<"row" | "row-reverse" | "column" | "column-reverse">;
  wrap?: "nowrap" | "wrap" | "wrap-reverse";
}
const GridContext = /* @__PURE__ */ createContext<() => Responsive<number>>(() => 12);
export function Grid(props: GridProps): JSX.Element {
  const p = useProps("MuiGrid", props);
  const parent = useContext(GridContext);
  const columns = () => p.columns ?? parent();
  const sizeStyle = (v: number | "auto" | "grow", count: number): CSSObject =>
    v === "grow"
      ? { flexBasis: 0, flexGrow: 1, maxWidth: "100%" }
      : v === "auto"
        ? { flexBasis: "auto", flexGrow: 0, flexShrink: 0, width: "auto" }
        : {
            flexGrow: 0,
            flexBasis: "auto",
            width: `calc(100% * ${v} / ${count} - (var(--Grid-columnSpacing, 0px) * (${count} - ${v}) / ${count}))`,
          };
  const countAt = (bp: string): number => {
    const c = columns();
    if (typeof c === "number") return c;
    if (Array.isArray(c))
      return (
        c.filter((v) => v != null)[
          Math.max(0, ["xs", "sm", "md", "lg", "xl"].indexOf(bp))
        ] ?? 12
      );
    const o = c as Record<string, number>;
    return ["xs", "sm", "md", "lg", "xl"]
      .slice(0, ["xs", "sm", "md", "lg", "xl"].indexOf(bp) + 1)
      .reduce((n, k) => o[k] ?? n, 12);
  };
  const responsive = (
    value: unknown,
    fn: (v: never, bp: string) => CSSObject,
    t: ReturnType<typeof useTheme>,
  ): CSSObject => {
    if (value == null) return {};
    if (typeof value !== "object") return fn(value as never, "xs");
    const o: CSSObject = {};
    for (const [i, bp] of t.breakpoints.keys.entries()) {
      const v = Array.isArray(value)
        ? value[i]
        : (value as Record<string, unknown>)[bp];
      if (v == null) continue;
      const rule = fn(v as never, bp);
      if (bp === "xs") Object.assign(o, rule);
      else o[t.breakpoints.up(bp)] = rule;
    }
    return o;
  };
  return (
    <GridContext value={columns}>
      <Root
        name="MuiGrid"
        props={p}
        styles={(t) => ({
          minWidth: 0,
          boxSizing: "border-box",
          ...(p.container
            ? {
                display: "flex",
                flexWrap: p.wrap ?? "wrap",
                ...t.unstable_sx({
                  flexDirection: p.direction ?? "row",
                  rowGap: p.rowSpacing ?? p.spacing ?? 0,
                  columnGap: p.columnSpacing ?? p.spacing ?? 0,
                }),
                ...responsive(
                  p.columnSpacing ?? p.spacing ?? 0,
                  (v) => ({ "--Grid-columnSpacing": t.spacing(v) }),
                  t,
                ),
              }
            : {}),
          ...responsive(p.size, (v, bp) => sizeStyle(v, countAt(bp)), t),
          ...responsive(
            p.offset,
            (v, bp) => ({
              marginInlineStart:
                v === "auto" ? "auto" : `calc(100% * ${v} / ${countAt(bp)})`,
            }),
            t,
          ),
        })}
      />
    </GridContext>
  );
}
export interface PaperProps extends MuiProps {
  elevation?: number;
  square?: boolean;
  variant?: "elevation" | "outlined";
}
const paperStyles = (p: PaperProps, t: Theme): CSSObject => ({
  backgroundColor: t.palette.background.paper,
  color: t.palette.text.primary,
  transition: t.transitions.create("box-shadow"),
  borderRadius: p.square ? 0 : t.shape.borderRadius,
  ...(p.variant === "outlined"
    ? { border: `1px solid ${t.palette.divider}` }
    : {
        boxShadow: t.shadows[clamp(p.elevation ?? 1, 0, 24)],
        ...(t.palette.mode === "dark" && (p.elevation ?? 1) > 0
          ? {
              backgroundImage: `linear-gradient(${alpha("#fff", getOverlayAlpha(p.elevation ?? 1))}, ${alpha("#fff", getOverlayAlpha(p.elevation ?? 1))})`,
            }
          : {}),
      }),
});
export const Paper = /* @__PURE__ */ simple<PaperProps>("MuiPaper", "div", paperStyles);
export interface TypographyProps extends MuiProps {
  variant?: TypographyVariant;
  color?: string;
  align?: "inherit" | "left" | "center" | "right" | "justify";
  gutterBottom?: boolean;
  noWrap?: boolean;
  paragraph?: boolean;
  variantMapping?: Partial<Record<TypographyVariant, ValidComponent>>;
}
const typographyMapping: Record<string, ValidComponent> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  subtitle1: "h6",
  subtitle2: "h6",
  body1: "p",
  body2: "p",
  inherit: "p",
};
export function Typography(props: TypographyProps): JSX.Element {
  const p = useProps("MuiTypography", props);
  return (
    <Root
      name="MuiTypography"
      props={p}
      component={
        p.paragraph
          ? "p"
          : (p.variantMapping?.[p.variant ?? "body1"] ??
            typographyMapping[p.variant ?? "body1"] ??
            "span")
      }
      styles={(t) => ({
        margin: 0,
        ...t.typography[p.variant ?? "body1"],
        color: p.color ? t.unstable_sx({ color: p.color }).color : undefined,
        textAlign: p.align ?? "inherit",
        ...(p.gutterBottom ? { marginBottom: ".35em" } : {}),
        ...(p.paragraph ? { marginBottom: 16 } : {}),
        ...(p.noWrap
          ? {
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }
          : {}),
      })}
    />
  );
}
export interface LinkProps extends TypographyProps {
  href?: string;
  target?: string;
  rel?: string;
  download?: string | boolean;
  underline?: "none" | "hover" | "always";
}
export function Link(props: LinkProps): JSX.Element {
  const p = useProps("MuiLink", props);
  return (
    <Root
      name="MuiLink"
      props={p}
      component="a"
      href={p.href}
      styles={(t) => ({
        ...t.typography[p.variant ?? "inherit"],
        color: t.unstable_sx({ color: p.color ?? "primary.main" }).color,
        textDecoration:
          p.underline === "none" || p.underline === "hover"
            ? "none"
            : "underline",
        textDecorationColor: alpha(t.palette.primary.main, 0.4),
        "&:hover": {
          textDecoration: p.underline === "none" ? "none" : "underline",
          textDecorationColor: "inherit",
        },
        "&:focus-visible": t.focusVisible,
      })}
    />
  );
}
export interface DividerProps extends MuiProps {
  orientation?: "horizontal" | "vertical";
  variant?: "fullWidth" | "inset" | "middle";
  flexItem?: boolean;
  absolute?: boolean;
  textAlign?: "left" | "right" | "center";
  light?: boolean;
}
export function Divider(props: DividerProps): JSX.Element {
  const p = useProps("MuiDivider", props);
  return (
    <Root
      name="MuiDivider"
      props={p}
      component={p.children ? "div" : "hr"}
      role="separator"
      aria-orientation={p.orientation ?? "horizontal"}
      styles={(t) => ({
        margin: 0,
        flexShrink: 0,
        border: 0,
        borderColor: p.light
          ? alpha(t.palette.divider, 0.08)
          : t.palette.divider,
        ...(p.orientation === "vertical"
          ? { height: "100%", borderRightWidth: 1, borderRightStyle: "solid" }
          : { borderBottomWidth: 1, borderBottomStyle: "solid" }),
        ...(p.flexItem ? { alignSelf: "stretch", height: "auto" } : {}),
        ...(p.variant === "inset"
          ? { marginInlineStart: 72 }
          : p.variant === "middle"
            ? { marginInline: 16 }
            : {}),
        ...(p.absolute
          ? { position: "absolute", bottom: 0, width: "100%" }
          : {}),
        ...(p.children
          ? {
              display: "flex",
              alignItems: "center",
              border: 0,
              whiteSpace: "nowrap",
              "&::before, &::after": {
                content: '""',
                width: "100%",
                borderTop: `1px solid ${t.palette.divider}`,
              },
              "&::before": { width: p.textAlign === "left" ? "10%" : "100%" },
              "&::after": { width: p.textAlign === "right" ? "10%" : "100%" },
            }
          : {}),
      })}
    >
      {p.children && (
        <Root
          name="MuiDivider"
          slot="wrapper"
          ownerProps={p}
          component="span"
          styles={{ padding: "0 1em" }}
        >
          {p.children}
        </Root>
      )}
    </Root>
  );
}
export interface AppBarProps extends PaperProps {
  color?: Color | "default" | "transparent";
  position?: "fixed" | "absolute" | "sticky" | "static" | "relative";
  enableColorOnDark?: boolean;
}
export const AppBar = /* @__PURE__ */ simple<AppBarProps>("MuiAppBar", "header", (p, t) => ({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  boxSizing: "border-box",
  flexShrink: 0,
  position: p.position ?? "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: t.zIndex.appBar,
  boxShadow: t.shadows[p.elevation ?? 4],
  backgroundColor:
    p.color === "transparent"
      ? "transparent"
      : p.color === "inherit"
        ? "inherit"
        : t.palette.mode === "dark" && !p.enableColorOnDark
          ? t.palette.background.paper
          : p.color === "default"
            ? t.palette.grey[100]
            : (
                t.palette[p.color ?? "primary"] as {
                  main: string;
                }
              ).main,
  color:
    p.color === "transparent" || p.color === "inherit"
      ? "inherit"
      : t.palette.mode === "dark" && !p.enableColorOnDark
        ? t.palette.text.primary
        : p.color === "default"
          ? t.palette.text.primary
          : (
              t.palette[p.color ?? "primary"] as {
                contrastText: string;
              }
            ).contrastText,
  ...(t.palette.mode === "dark" &&
  !p.enableColorOnDark &&
  p.color !== "transparent" &&
  p.color !== "inherit"
    ? {
        backgroundImage: `linear-gradient(${alpha("#fff", getOverlayAlpha(p.elevation ?? 4))},${alpha("#fff", getOverlayAlpha(p.elevation ?? 4))})`,
      }
    : {}),
}));
export interface ToolbarProps extends MuiProps {
  disableGutters?: boolean;
  variant?: "regular" | "dense";
}
export const Toolbar = /* @__PURE__ */ simple<ToolbarProps>("MuiToolbar", "div", (p, t) => ({
  position: "relative",
  display: "flex",
  alignItems: "center",
  ...(!p.disableGutters
    ? { paddingInline: 16, [t.breakpoints.up("sm")]: { paddingInline: 24 } }
    : {}),
  ...(p.variant === "dense" ? { minHeight: 48 } : t.mixins.toolbar),
}));
export interface CardProps extends PaperProps {
  raised?: boolean;
}
export function Card(props: CardProps): JSX.Element {
  const p = useProps("MuiCard", useProps("MuiPaper", props));
  const elevation = () => (p.raised ? 8 : (p.elevation ?? 1));
  const paperState = new Proxy(p, {
    get: (target, key) =>
      key === "elevation"
        ? elevation()
        : key === "variant"
          ? (p.variant ?? "elevation")
          : key === "square"
            ? !!p.square
            : Reflect.get(target, key),
  }) as unknown as Record<string, unknown>;
  const paperKeys = () => [
    "root",
    ...(!p.square ? ["rounded"] : []),
    p.variant === "outlined" ? "outlined" : "elevation",
    ...(p.variant === "outlined" ? [] : [`elevation${elevation()}`]),
  ];
  return (
    <Root
      name="MuiCard"
      props={p}
      class={paperKeys().map((key) => generateUtilityClass("MuiPaper", key))}
      styles={(t) => {
        const config = t.components.MuiPaper;
        const overrides = paperKeys().map((key) => {
          const override =
            config?.styleOverrides?.[key as keyof typeof config.styleOverrides];
          return typeof override === "function"
            ? override({ theme: t, ownerState: paperState })
            : override;
        });
        const variants = (config?.variants ?? [])
          .filter((v) =>
            typeof v.props === "function"
              ? v.props(paperState)
              : Object.entries(v.props).every(
                  ([key, value]) => paperState[key] === value,
                ),
          )
          .map((v) =>
            typeof v.style === "function"
              ? v.style({ theme: t, ownerState: paperState })
              : v.style,
          );
        return [
          paperStyles(
            { variant: p.variant, square: p.square, elevation: elevation() },
            t,
          ),
          ...overrides,
          ...variants,
          { overflow: "hidden" },
        ];
      }}
    />
  );
}
export const CardContent = /* @__PURE__ */ simple("MuiCardContent", "div", () => ({
  padding: 16,
  "&:last-child": { paddingBottom: 24 },
}));
export interface CardActionsProps extends MuiProps {
  disableSpacing?: boolean;
}
export const CardActions = /* @__PURE__ */ simple<CardActionsProps>(
  "MuiCardActions",
  "div",
  (p) => ({
    display: "flex",
    alignItems: "center",
    padding: 8,
    ...(!p.disableSpacing
      ? { "& > :not(:first-of-type)": { marginLeft: 8 } }
      : {}),
  }),
);
export interface CardHeaderProps extends Omit<MuiProps, "title"> {
  avatar?: JSX.Element;
  action?: JSX.Element;
  title?: JSX.Element;
  subheader?: JSX.Element;
  disableTypography?: boolean;
  titleTypographyProps?: TypographyProps;
  subheaderTypographyProps?: TypographyProps;
}
export function CardHeader(props: CardHeaderProps): JSX.Element {
  const p = useProps("MuiCardHeader", props);
  const avatar = createMemo(() => p.avatar),
    action = createMemo(() => p.action),
    title = createMemo(() => p.title),
    subheader = createMemo(() => p.subheader);
  return (
    <Root
      name="MuiCardHeader"
      props={p as MuiProps}
      styles={{ display: "flex", alignItems: "center", padding: 16 }}
    >
      <Show when={avatar()}>
        <Root
          name="MuiCardHeader"
          slot="avatar"
          ownerProps={p as MuiProps}
          styles={{ marginRight: 16, flexShrink: 0 }}
        >
          {avatar()}
        </Root>
      </Show>
      <Root
        name="MuiCardHeader"
        slot="content"
        ownerProps={p as MuiProps}
        styles={{ flex: "1 1 auto" }}
      >
        <Show
          when={!p.disableTypography}
          fallback={
            <>
              {title()}
              {subheader()}
            </>
          }
        >
          <Root
            name="MuiCardHeader"
            slot="title"
            ownerProps={p as MuiProps}
            props={p.titleTypographyProps}
            component={(q: TypographyProps) => (
              <Typography {...q} component="span" />
            )}
            variant={avatar() ? "body2" : "h5"}
          >
            {title()}
          </Root>
          <Root
            name="MuiCardHeader"
            slot="subheader"
            ownerProps={p as MuiProps}
            props={p.subheaderTypographyProps}
            component={(q: TypographyProps) => (
              <Typography {...q} component="span" />
            )}
            variant="body2"
            color="text.secondary"
            styles={{ display: "block" }}
          >
            {subheader()}
          </Root>
        </Show>
      </Root>
      <Show when={action()}>
        <Root
          name="MuiCardHeader"
          slot="action"
          ownerProps={p as MuiProps}
          styles={{
            alignSelf: "flex-start",
            marginTop: -4,
            marginRight: -8,
            marginBottom: -4,
          }}
        >
          {action()}
        </Root>
      </Show>
    </Root>
  );
}
export interface CardMediaProps extends MuiProps {
  image?: string;
  src?: string;
  alt?: string;
  height?: number | string;
}
export function CardMedia(props: CardMediaProps): JSX.Element {
  const p = useProps("MuiCardMedia", props);
  return (
    <Root
      name="MuiCardMedia"
      props={p}
      component="div"
      src={p.src ?? p.image}
      alt={p.alt}
      height={p.height}
      styles={{
        display: "block",
        backgroundImage:
          p.image && (!p.component || p.component === "div")
            ? `url("${p.image.replaceAll('"', '\\"')}")`
            : undefined,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        width: ["img", "video", "picture"].includes(String(p.component))
          ? "100%"
          : undefined,
        height: p.height,
      }}
    />
  );
}
export interface CardActionAreaProps extends MuiProps {
  disabled?: boolean;
  href?: string;
  onClick?: JSX.EventHandlerUnion<HTMLElement, MouseEvent>;
}
export function CardActionArea(props: CardActionAreaProps): JSX.Element {
  const p = useProps("MuiCardActionArea", props);
  return (
    <Root
      name="MuiCardActionArea"
      props={p}
      component={p.href ? "a" : "button"}
      type={p.href ? undefined : "button"}
      disabled={p.disabled}
      styles={(t) => ({
        display: "block",
        textAlign: "inherit",
        width: "100%",
        border: 0,
        padding: 0,
        font: "inherit",
        color: "inherit",
        background: "transparent",
        cursor: p.disabled ? "default" : "pointer",
        "&:hover": { background: t.palette.action.hover },
        "&:focus-visible": t.focusVisible,
      })}
    />
  );
}
export interface AvatarProps extends MuiProps {
  alt?: string;
  src?: string;
  srcSet?: string;
  sizes?: string;
  imgProps?: JSX.ImgHTMLAttributes<HTMLImageElement>;
  variant?: "circular" | "rounded" | "square";
}
export function Avatar(props: AvatarProps): JSX.Element {
  const p = useProps("MuiAvatar", props);
  const [failed, setFailed] = createSignal(false);
  const source = createMemo(() => ({ src: p.src, srcSet: p.srcSet }));
  const isFailed = () => failed() && source() === failedSource;
  let failedSource: ReturnType<typeof source> | undefined;
  return (
    <Root
      name="MuiAvatar"
      props={p}
      styles={(t) => ({
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width: 40,
        height: 40,
        fontFamily: t.typography.fontFamily,
        fontSize: 20,
        lineHeight: 1,
        borderRadius:
          p.variant === "square"
            ? 0
            : p.variant === "rounded"
              ? t.shape.borderRadius
              : "50%",
        overflow: "hidden",
        userSelect: "none",
        color: "#fff",
        backgroundColor: t.palette.grey[t.palette.mode === "dark" ? 600 : 400],
      })}
    >
      <Show
        when={(p.src || p.srcSet) && !isFailed()}
        fallback={
          p.children ??
          p.alt?.[0] ?? (
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
              />
            </svg>
          )
        }
      >
        <Root
          name="MuiAvatar"
          slot="img"
          ownerProps={p}
          props={p.imgProps as MuiProps}
          component="img"
          src={p.src}
          srcset={p.srcSet}
          sizes={p.sizes}
          alt={p.alt}
          onError={(event: Event) => {
            failedSource = source();
            setFailed(true);
            callHandler(p.imgProps?.onError, event);
          }}
          styles={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </Show>
    </Root>
  );
}
export interface AvatarGroupProps extends MuiProps {
  max?: number;
  total?: number;
  spacing?: "small" | "medium" | number;
  variant?: AvatarProps["variant"];
  renderSurplus?: (surplus: number) => JSX.Element;
}
export function AvatarGroup(props: AvatarGroupProps): JSX.Element {
  const p = useProps("MuiAvatarGroup", props);
  const children = createMemo(() => flatten(p.children));
  const limit = () => Math.max(2, p.max ?? 5);
  const surplus = () =>
    Math.max(0, (p.total ?? children().length) - limit() + 1);
  return (
    <Root
      name="MuiAvatarGroup"
      props={p}
      styles={(t) => ({
        display: "flex",
        flexDirection: "row-reverse",
        justifyContent: "flex-end",
        [resolveMuiClassName("& .MuiAvatar-root")]: {
          border: `2px solid ${t.palette.background.paper}`,
          marginLeft: -(typeof p.spacing === "number"
            ? p.spacing
            : p.spacing === "small"
              ? 16
              : 8),
        },
        [resolveMuiClassName("& .MuiAvatar-root:last-child")]: {
          marginLeft: 0,
        },
      })}
    >
      {surplus() > 0 && (
        <Avatar>{p.renderSurplus?.(surplus()) ?? `+${surplus()}`}</Avatar>
      )}
      <For
        each={children()
          .slice(0, surplus() > 0 ? limit() - 1 : limit())
          .reverse()}
      >
        {(child) => child}
      </For>
    </Root>
  );
}
export interface BadgeProps extends MuiProps {
  badgeContent?: JSX.Element;
  color?: Color | "default";
  variant?: "standard" | "dot";
  max?: number;
  showZero?: boolean;
  invisible?: boolean;
  overlap?: "rectangular" | "circular";
  anchorOrigin?: {
    vertical: "top" | "bottom";
    horizontal: "left" | "right";
  };
}
export interface BadgeSlotProps extends BadgeProps {
  ownerState?: BadgeProps & {
    invisible?: boolean;
  };
}
export function BadgeRoot(props: BadgeSlotProps): JSX.Element {
  return (
    <Root
      name="MuiBadge"
      props={props}
      component="span"
      styles={{
        position: "relative",
        display: "inline-flex",
        verticalAlign: "middle",
        flexShrink: 0,
      }}
    />
  );
}
export function BadgeMark(props: BadgeSlotProps): JSX.Element {
  const p = new Proxy(props, {
    get: (target, key) => Reflect.get(target.ownerState ?? target, key),
  });
  const hidden = () => !!p.invisible;
  return (
    <Root
      name="MuiBadge"
      slot="badge"
      props={props}
      ownerProps={omit(p, "slots", "slotProps")}
      component="span"
      state={{ invisible: hidden() }}
      styles={(t) => ({
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignContent: "center",
        alignItems: "center",
        position: "absolute",
        boxSizing: "border-box",
        fontFamily: t.typography.fontFamily,
        fontWeight: 500,
        fontSize: 12,
        minWidth: p.variant === "dot" ? 8 : 20,
        height: p.variant === "dot" ? 8 : 20,
        borderRadius: 10,
        padding: p.variant === "dot" ? 0 : "0 6px",
        zIndex: 1,
        backgroundColor:
          p.color && p.color !== "default" && p.color !== "inherit"
            ? t.palette[p.color].main
            : undefined,
        color:
          p.color && p.color !== "default" && p.color !== "inherit"
            ? t.palette[p.color].contrastText
            : undefined,
        [p.anchorOrigin?.vertical ?? "top"]:
          p.overlap === "circular" ? "14%" : 0,
        [p.anchorOrigin?.horizontal ?? "right"]:
          p.overlap === "circular" ? "14%" : 0,
        transform: `scale(${hidden() ? 0 : 1}) translate(${p.anchorOrigin?.horizontal === "left" ? "-" : ""}50%, ${p.anchorOrigin?.vertical === "bottom" ? "" : "-"}50%)`,
        transformOrigin: `${p.anchorOrigin?.horizontal === "left" ? "0" : "100"}% ${p.anchorOrigin?.vertical === "bottom" ? "100" : "0"}%`,
        transition: t.transitions.create("transform", {
          duration: t.transitions.duration.shorter,
        }),
      })}
    >
      {props.children}
    </Root>
  );
}
export function Badge(props: BadgeProps): JSX.Element {
  const p = useProps("MuiBadge", props);
  const hidden = () =>
    p.invisible ??
    (p.variant !== "dot" &&
      (p.badgeContent == null || (!p.showZero && p.badgeContent === 0)));
  const ownerState = new Proxy(p, {
    get: (target, key) =>
      key === "invisible" ? hidden() : Reflect.get(target, key),
  });
  return (
    <BadgeRoot {...p}>
      {p.children}
      <Root
        name="MuiBadge"
        slot="badge"
        ownerProps={ownerState}
        component={BadgeMark}
        ownerState={ownerState}
        sx={
          slotProps(
            p,
            "badge",
            ownerState as unknown as Record<string, unknown>,
          ).sx
        }
      >
        {p.variant !== "dot" &&
          (typeof p.badgeContent === "number" && p.badgeContent > (p.max ?? 99)
            ? `${p.max ?? 99}+`
            : p.badgeContent)}
      </Root>
    </BadgeRoot>
  );
}
export interface ChipProps extends MuiProps {
  label?: JSX.Element;
  avatar?: JSX.Element;
  icon?: JSX.Element;
  deleteIcon?: JSX.Element;
  onDelete?: (event: MouseEvent | KeyboardEvent) => void;
  clickable?: boolean;
  disabled?: boolean;
  color?: Color | "default";
  size?: Size;
  variant?: "filled" | "outlined";
}
export function Chip(props: ChipProps): JSX.Element {
  const p = useProps("MuiChip", props);
  return (
    <Root
      name="MuiChip"
      props={p}
      component="div"
      role={p.clickable || p.onClick ? "button" : undefined}
      tabIndex={
        p.disabled ? -1 : p.clickable || p.onClick || p.onDelete ? 0 : undefined
      }
      aria-disabled={p.disabled}
      onClick={(event: MouseEvent) => {
        if (!p.disabled) callHandler(p.onClick, event);
      }}
      onKeyDown={(e: KeyboardEvent) => {
        callHandler(p.onKeyDown, e);
        if (p.disabled || e.defaultPrevented) return;
        if ((e.key === "Backspace" || e.key === "Delete") && p.onDelete) {
          e.preventDefault();
          p.onDelete(e);
        }
        if (
          (e.key === "Enter" || e.key === " ") &&
          (p.clickable || p.onClick)
        ) {
          e.preventDefault();
          e.currentTarget && (e.currentTarget as HTMLElement).click();
        }
      }}
      state={{ disabled: p.disabled }}
      styles={(t) => {
        const c =
          p.color && p.color !== "default" && p.color !== "inherit"
            ? t.palette[p.color]
            : undefined;
        return {
          ...t.typography.body2,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          height: p.size === "small" ? 24 : 32,
          borderRadius: 16,
          whiteSpace: "nowrap",
          verticalAlign: "middle",
          maxWidth: "100%",
          boxSizing: "border-box",
          outline: 0,
          color:
            p.variant === "outlined"
              ? (c?.main ?? t.palette.text.primary)
              : (c?.contrastText ?? t.palette.text.primary),
          backgroundColor:
            p.variant === "outlined"
              ? "transparent"
              : (c?.main ?? t.palette.action.selected),
          border:
            p.variant === "outlined"
              ? `1px solid ${c?.main ?? t.palette.divider}`
              : undefined,
          cursor: p.disabled
            ? "default"
            : p.clickable || p.onClick
              ? "pointer"
              : "default",
          opacity: p.disabled ? 0.38 : 1,
          "&:focus-visible": t.focusVisible,
          [resolveMuiClassName("& .MuiAvatar-root")]: {
            width: p.size === "small" ? 18 : 24,
            height: p.size === "small" ? 18 : 24,
            marginLeft: 5,
            marginRight: -6,
            fontSize: 12,
          },
        };
      }}
    >
      {p.avatar ?? p.icon}
      <Root
        name="MuiChip"
        slot="label"
        ownerProps={p}
        component="span"
        styles={{
          padding: p.size === "small" ? "0 8px" : "0 12px",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {p.label}
      </Root>
      {p.onDelete && (
        <button
          type="button"
          aria-label="Delete"
          disabled={p.disabled}
          onClick={(e) => {
            e.stopPropagation();
            p.onDelete?.(e);
          }}
          class={resolveMuiClassName("MuiChip-deleteIcon")}
          style={{
            border: 0,
            background: "transparent",
            color: "inherit",
            cursor: "inherit",
            display: "flex",
            padding: "0 5px 0 0",
          }}
        >
          {p.deleteIcon ?? (
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12z"
              />
            </svg>
          )}
        </button>
      )}
    </Root>
  );
}
export interface SvgIconProps extends Omit<MuiProps, "ref"> {
  ref?: JSX.Ref<SVGSVGElement>;
  color?: Color | "action" | "disabled";
  fontSize?: "inherit" | "small" | "medium" | "large";
  htmlColor?: string;
  viewBox?: string;
  titleAccess?: string;
  inheritViewBox?: boolean;
}
export function SvgIcon(props: SvgIconProps): JSX.Element {
  const p = useProps("MuiSvgIcon", props);
  const titleId = createUniqueId();
  return (
    <Root
      name="MuiSvgIcon"
      props={p as MuiProps}
      component="svg"
      ref={(node: SVGSVGElement) =>
        setRef(
          untrack(() => p.ref),
          node,
        )
      }
      viewBox={p.inheritViewBox ? undefined : (p.viewBox ?? "0 0 24 24")}
      focusable="false"
      aria-hidden={p.titleAccess ? undefined : true}
      role={p.titleAccess ? "img" : undefined}
      aria-labelledby={p.titleAccess ? titleId : undefined}
      color={p.htmlColor}
      styles={(t) => ({
        userSelect: "none",
        width: "1em",
        height: "1em",
        display: "inline-block",
        fill: "currentColor",
        flexShrink: 0,
        transition: t.transitions.create("fill", {
          duration: t.transitions.duration.shorter,
        }),
        fontSize:
          p.fontSize === "inherit"
            ? "inherit"
            : p.fontSize === "small"
              ? 20
              : p.fontSize === "large"
                ? 35
                : 24,
        color:
          p.color === "action"
            ? t.palette.action.active
            : p.color === "disabled"
              ? t.palette.action.disabled
              : p.color && p.color !== "inherit"
                ? t.palette[p.color].main
                : p.htmlColor,
      })}
    >
      {p.titleAccess && <title id={titleId}>{p.titleAccess}</title>}
      {p.children}
    </Root>
  );
}
export function createSvgIcon(
  path: JSX.Element | (() => JSX.Element),
  displayName: string,
) {
  const Icon = (props: SvgIconProps) => (
    <SvgIcon {...props}>{typeof path === "function" ? path() : path}</SvgIcon>
  );
  Object.defineProperty(Icon, "name", { value: `${displayName}Icon` });
  return Object.assign(Icon, { muiName: "SvgIcon" });
}
export interface IconProps extends MuiProps {
  baseClassName?: string;
  color?: SvgIconProps["color"];
  fontSize?: SvgIconProps["fontSize"];
}
export function Icon(props: IconProps): JSX.Element {
  const p = useProps("MuiIcon", props);
  return (
    <Root
      name="MuiIcon"
      props={p}
      component="span"
      class={[p.baseClassName ?? "material-icons", "notranslate"]}
      aria-hidden={p["aria-label"] ? undefined : true}
      styles={(t) => ({
        userSelect: "none",
        width: "1em",
        height: "1em",
        overflow: "hidden",
        display: "inline-block",
        flexShrink: 0,
        fontFamily: p.baseClassName ? undefined : "Material Icons",
        fontFeatureSettings: "liga",
        fontSize:
          p.fontSize === "inherit"
            ? "inherit"
            : p.fontSize === "small"
              ? 20
              : p.fontSize === "large"
                ? 36
                : 24,
        color:
          p.color === "action"
            ? t.palette.action.active
            : p.color === "disabled"
              ? t.palette.action.disabled
              : p.color && p.color !== "inherit"
                ? t.palette[p.color].main
                : undefined,
      })}
    />
  );
}
export interface ListProps extends MuiProps {
  dense?: boolean;
  disablePadding?: boolean;
  subheader?: JSX.Element;
}
const ListContext = /* @__PURE__ */ createContext<{
  dense?: boolean;
}>({});
export function List(props: ListProps): JSX.Element {
  const p = useProps("MuiList", props);
  const context = {
    get dense() {
      return p.dense;
    },
  };
  return (
    <ListContext value={context}>
      <Root
        name="MuiList"
        props={p}
        component="ul"
        styles={{
          listStyle: "none",
          margin: 0,
          padding: p.disablePadding ? 0 : "8px 0",
          position: "relative",
        }}
      >
        {p.subheader}
        {p.children}
      </Root>
    </ListContext>
  );
}
export interface ListItemProps extends MuiProps {
  alignItems?: "center" | "flex-start";
  dense?: boolean;
  disablePadding?: boolean;
  disableGutters?: boolean;
  divider?: boolean;
  secondaryAction?: JSX.Element;
}
export function ListItem(props: ListItemProps): JSX.Element {
  const p = useProps("MuiListItem", props),
    context = useContext(ListContext);
  return (
    <Root
      name="MuiListItem"
      props={p}
      component="li"
      styles={(t) => ({
        display: "flex",
        justifyContent: "flex-start",
        alignItems: p.alignItems ?? "center",
        position: "relative",
        textDecoration: "none",
        width: "100%",
        boxSizing: "border-box",
        textAlign: "left",
        padding: p.disablePadding
          ? 0
          : `${(p.dense ?? context.dense) ? 4 : 8}px ${p.disableGutters ? 0 : 16}px`,
        ...(p.divider
          ? {
              borderBottom: `1px solid ${t.palette.divider}`,
              backgroundClip: "padding-box",
            }
          : {}),
        ...(p.secondaryAction ? { paddingRight: 48 } : {}),
      })}
    >
      {p.children}
      {p.secondaryAction && (
        <ListItemSecondaryAction>{p.secondaryAction}</ListItemSecondaryAction>
      )}
    </Root>
  );
}
export interface ListItemButtonProps extends ListItemProps {
  selected?: boolean;
  disabled?: boolean;
  href?: string;
}
export function ListItemButton(props: ListItemButtonProps): JSX.Element {
  const p = useProps("MuiListItemButton", props),
    context = useContext(ListContext);
  return (
    <Root
      name="MuiListItemButton"
      props={p}
      component={p.href ? "a" : "div"}
      role={p.href ? undefined : "button"}
      tabIndex={p.disabled ? -1 : (p.tabIndex ?? 0)}
      aria-disabled={p.disabled}
      state={{ selected: p.selected, disabled: p.disabled }}
      onKeyDown={(e: KeyboardEvent) => {
        if (!p.disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          (e.currentTarget as HTMLElement).click();
        }
        callHandler(p.onKeyDown, e);
      }}
      styles={(t) => ({
        display: "flex",
        flexGrow: 1,
        justifyContent: "flex-start",
        alignItems: p.alignItems ?? "center",
        position: "relative",
        border: 0,
        font: "inherit",
        textDecoration: "none",
        color: "inherit",
        padding: `${(p.dense ?? context.dense) ? 4 : 8}px ${p.disableGutters ? 0 : 16}px`,
        cursor: p.disabled ? "default" : "pointer",
        pointerEvents: p.disabled ? "none" : undefined,
        opacity: p.disabled ? 0.38 : 1,
        background: p.selected
          ? alpha(t.palette.primary.main, t.palette.action.selectedOpacity)
          : "transparent",
        "&:hover": {
          background: p.selected
            ? alpha(
                t.palette.primary.main,
                t.palette.action.selectedOpacity +
                  t.palette.action.hoverOpacity,
              )
            : t.palette.action.hover,
        },
        "&:focus-visible": t.focusVisible,
      })}
    />
  );
}
export const ListItemIcon = /* @__PURE__ */ simple("MuiListItemIcon", "div", (_, t) => ({
  minWidth: 56,
  color: t.palette.action.active,
  flexShrink: 0,
  display: "inline-flex",
}));
export const ListItemAvatar = /* @__PURE__ */ simple("MuiListItemAvatar", "div", () => ({
  minWidth: 56,
  flexShrink: 0,
}));
export const ListItemSecondaryAction = /* @__PURE__ */ simple(
  "MuiListItemSecondaryAction",
  "div",
  () => ({
    position: "absolute",
    right: 16,
    top: "50%",
    transform: "translateY(-50%)",
  }),
);
export interface ListItemTextProps extends MuiProps {
  primary?: JSX.Element;
  secondary?: JSX.Element;
  inset?: boolean;
  disableTypography?: boolean;
  primaryTypographyProps?: TypographyProps;
  secondaryTypographyProps?: TypographyProps;
}
export function ListItemText(props: ListItemTextProps): JSX.Element {
  const p = useProps("MuiListItemText", props),
    context = useContext(ListContext);
  const primary = createMemo(() => p.primary ?? p.children),
    secondary = createMemo(() => p.secondary);
  return (
    <Root
      name="MuiListItemText"
      props={p}
      styles={{
        flex: "1 1 auto",
        minWidth: 0,
        marginBlock: primary() && secondary() ? 6 : 4,
        paddingLeft: p.inset ? 56 : undefined,
      }}
    >
      <Show
        when={!p.disableTypography}
        fallback={
          <>
            {primary()}
            {secondary()}
          </>
        }
      >
        <Root
          name="MuiListItemText"
          slot="primary"
          ownerProps={p}
          props={p.primaryTypographyProps}
          component={(q: TypographyProps) => (
            <Typography {...q} component="span" />
          )}
          variant={context.dense ? "body2" : "body1"}
          styles={{ display: "block" }}
        >
          {primary()}
        </Root>
        <Show when={secondary()}>
          <Root
            name="MuiListItemText"
            slot="secondary"
            ownerProps={p}
            props={p.secondaryTypographyProps}
            component={Typography}
            variant="body2"
            color="text.secondary"
          >
            {secondary()}
          </Root>
        </Show>
      </Show>
    </Root>
  );
}
export interface ListSubheaderProps extends MuiProps {
  color?: "default" | "primary" | "inherit";
  disableGutters?: boolean;
  disableSticky?: boolean;
  inset?: boolean;
}
export const ListSubheader = /* @__PURE__ */ simple<ListSubheaderProps>(
  "MuiListSubheader",
  "li",
  (p, t) => ({
    boxSizing: "border-box",
    lineHeight: "48px",
    listStyle: "none",
    color:
      p.color === "primary"
        ? t.palette.primary.main
        : p.color === "inherit"
          ? "inherit"
          : t.palette.text.secondary,
    fontFamily: t.typography.fontFamily,
    fontWeight: 500,
    fontSize: 14,
    paddingInline: p.disableGutters ? 0 : 16,
    paddingLeft: p.inset ? 72 : undefined,
    ...(!p.disableSticky
      ? {
          position: "sticky",
          top: 0,
          zIndex: 1,
          backgroundColor: t.palette.background.paper,
        }
      : {}),
  }),
);
export interface TableProps extends MuiProps {
  size?: "small" | "medium";
  padding?: "normal" | "checkbox" | "none";
  stickyHeader?: boolean;
}
const TableContext = /* @__PURE__ */ createContext<TableProps>({});
const TableSectionContext = /* @__PURE__ */ createContext<"head" | "body" | "footer">("body");
export function Table(props: TableProps): JSX.Element {
  const p = useProps("MuiTable", props);
  return (
    <TableContext value={p}>
      <Root
        name="MuiTable"
        props={p}
        component="table"
        styles={{
          display: "table",
          width: "100%",
          borderCollapse: p.stickyHeader ? "separate" : "collapse",
          borderSpacing: 0,
          "& caption": {
            padding: 16,
            textAlign: "left",
            captionSide: "bottom",
          },
        }}
      />
    </TableContext>
  );
}
export const TableContainer = /* @__PURE__ */ simple("MuiTableContainer", "div", () => ({
  width: "100%",
  overflowX: "auto",
}));
function section(
  name: string,
  tag: "thead" | "tbody" | "tfoot",
  value: "head" | "body" | "footer",
) {
  return (props: MuiProps) => {
    const p = useProps(name, props);
    return (
      <TableSectionContext value={value}>
        <Root
          name={name}
          props={p}
          component={tag}
          styles={{
            display:
              tag === "thead"
                ? "table-header-group"
                : tag === "tfoot"
                  ? "table-footer-group"
                  : "table-row-group",
          }}
        />
      </TableSectionContext>
    );
  };
}
export const TableHead = /* @__PURE__ */ section("MuiTableHead", "thead", "head");
export const TableBody = /* @__PURE__ */ section("MuiTableBody", "tbody", "body");
export const TableFooter = /* @__PURE__ */ section("MuiTableFooter", "tfoot", "footer");
export interface TableRowProps extends MuiProps {
  hover?: boolean;
  selected?: boolean;
}
export const TableRow = /* @__PURE__ */ simple<TableRowProps>("MuiTableRow", "tr", (p, t) => ({
  color: "inherit",
  display: "table-row",
  verticalAlign: "middle",
  outline: 0,
  "&:hover": p.hover ? { backgroundColor: t.palette.action.hover } : undefined,
  backgroundColor: p.selected
    ? alpha(t.palette.primary.main, t.palette.action.selectedOpacity)
    : undefined,
}));
export interface TableCellProps extends MuiProps {
  align?: "inherit" | "left" | "center" | "right" | "justify";
  padding?: TableProps["padding"];
  size?: TableProps["size"];
  variant?: "head" | "body" | "footer";
  sortDirection?: "asc" | "desc" | false;
  scope?: string;
  colSpan?: number;
  rowSpan?: number;
}
export function TableCell(props: TableCellProps): JSX.Element {
  const p = useProps("MuiTableCell", props),
    table = useContext(TableContext),
    section = useContext(TableSectionContext);
  const variant = () => p.variant ?? section;
  return (
    <Root
      name="MuiTableCell"
      props={p}
      component={variant() === "head" ? "th" : "td"}
      scope={p.scope ?? (variant() === "head" ? "col" : undefined)}
      colspan={p.colSpan}
      rowspan={p.rowSpan}
      aria-sort={
        p.sortDirection
          ? p.sortDirection === "asc"
            ? "ascending"
            : "descending"
          : undefined
      }
      styles={(t) => ({
        ...t.typography.body2,
        display: "table-cell",
        verticalAlign: "inherit",
        borderBottom: `1px solid ${t.palette.divider}`,
        textAlign: p.align ?? "left",
        padding:
          (p.padding ?? table.padding) === "none"
            ? 0
            : (p.padding ?? table.padding) === "checkbox"
              ? "0 0 0 4px"
              : (p.size ?? table.size) === "small"
                ? "6px 16px"
                : "16px",
        fontWeight: variant() === "head" ? 500 : t.typography.body2.fontWeight,
        color:
          variant() === "footer"
            ? t.palette.text.secondary
            : t.palette.text.primary,
        ...(variant() === "head" && table.stickyHeader
          ? {
              position: "sticky",
              top: 0,
              zIndex: 2,
              backgroundColor: t.palette.background.default,
            }
          : {}),
      })}
    />
  );
}
export interface TableSortLabelProps extends MuiProps {
  active?: boolean;
  direction?: "asc" | "desc";
  hideSortIcon?: boolean;
  IconComponent?: ValidComponent;
}
export function TableSortLabel(props: TableSortLabelProps): JSX.Element {
  const p = useProps("MuiTableSortLabel", props),
    Icon = dynamic(() => p.IconComponent ?? "span");
  return (
    <Root
      name="MuiTableSortLabel"
      props={p}
      component="button"
      type="button"
      styles={(t) => ({
        cursor: "pointer",
        display: "inline-flex",
        justifyContent: "flex-start",
        flexDirection: "inherit",
        alignItems: "center",
        border: 0,
        padding: 0,
        background: "transparent",
        font: "inherit",
        color: p.active ? t.palette.text.primary : t.palette.text.secondary,
        "&:focus-visible": t.focusVisible,
        [resolveMuiClassName("&:hover .MuiTableSortLabel-icon")]: {
          opacity: 0.5,
        },
      })}
    >
      {p.children}
      {(!p.hideSortIcon || p.active) && (
        <Icon
          class={resolveMuiClassName("MuiTableSortLabel-icon")}
          style={{
            display: "inline-flex",
            opacity: p.active ? 1 : 0,
            margin: "0 4px",
            transform: p.direction === "desc" ? "rotate(180deg)" : "none",
          }}
        >
          {!p.IconComponent && (
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="m7 14 5-5 5 5z" />
            </svg>
          )}
        </Icon>
      )}
    </Root>
  );
}
export interface TablePaginationActionsProps extends MuiProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: MouseEvent | null, page: number) => void;
  showFirstButton?: boolean;
  showLastButton?: boolean;
  disabled?: boolean;
  getItemAriaLabel?: (type: "first" | "last" | "next" | "previous") => string;
}
export function TablePaginationActions(
  props: TablePaginationActionsProps,
): JSX.Element {
  const p = useProps("MuiTablePaginationActions", props),
    t = useTheme();
  const last = () => Math.max(0, Math.ceil(p.count / p.rowsPerPage) - 1);
  const icons = {
    first: "M18.41 16.59 13.83 12l4.58-4.59L17 6l-6 6 6 6zM6 6h2v12H6z",
    previous: "M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z",
    next: "M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z",
    last: "M5.59 7.41 10.17 12l-4.58 4.59L7 18l6-6-6-6zM16 6h2v12h-2z",
  };
  const button = (
    type: "first" | "last" | "next" | "previous",
    page: () => number,
    _label: string,
  ): JSX.Element => {
    const icon = () =>
      t.direction === "rtl"
        ? type === "first"
          ? "last"
          : type === "last"
            ? "first"
            : type === "previous"
              ? "next"
              : "previous"
        : type;
    const disabled = () =>
      p.disabled ||
      (type === "first" || type === "previous"
        ? p.page === 0
        : p.count !== -1 && p.page >= last());
    return (
      <Root
        name="MuiTablePaginationActions"
        slot={`${type}Button`}
        ownerProps={p}
        component="button"
        type="button"
        disabled={disabled()}
        aria-label={p.getItemAriaLabel?.(type) ?? `Go to ${type} page`}
        onClick={(event: MouseEvent) => {
          if (!disabled()) p.onPageChange(event, page());
        }}
        styles={(theme) => ({
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 8,
          border: 0,
          borderRadius: "50%",
          background: "transparent",
          color: disabled() ? theme.palette.action.disabled : "inherit",
          width: 40,
          height: 40,
          cursor: disabled() ? "default" : "pointer",
          "&:hover": {
            backgroundColor: disabled()
              ? undefined
              : theme.palette.action.hover,
          },
          "&:focus-visible": theme.focusVisible,
        })}
      >
        <Root
          name="MuiTablePaginationActions"
          slot={`${type}ButtonIcon`}
          ownerProps={p}
          component={SvgIcon}
        >
          <path d={icons[icon()]} />
        </Root>
      </Root>
    );
  };
  return (
    <Root
      name="MuiTablePaginationActions"
      props={p}
      styles={{ flexShrink: 0, marginLeft: 20, display: "flex" }}
    >
      {p.showFirstButton &&
        button("first", () => 0, t.direction === "rtl" ? "»" : "«")}
      {button("previous", () => p.page - 1, t.direction === "rtl" ? "›" : "‹")}
      {button("next", () => p.page + 1, t.direction === "rtl" ? "‹" : "›")}
      {p.showLastButton &&
        button("last", last, t.direction === "rtl" ? "«" : "»")}
    </Root>
  );
}
export interface TablePaginationProps extends Omit<
  TablePaginationActionsProps,
  "onPageChange"
> {
  onPageChange: TablePaginationActionsProps["onPageChange"];
  rowsPerPageOptions?: (
    | number
    | {
        label: string;
        value: number;
      }
  )[];
  onRowsPerPageChange?: (
    event: Event & {
      currentTarget: HTMLSelectElement;
    },
  ) => void;
  labelRowsPerPage?: JSX.Element;
  labelDisplayedRows?: (args: {
    from: number;
    to: number;
    count: number;
    page: number;
  }) => JSX.Element;
  ActionsComponent?: ValidComponent;
}
export function TablePagination(props: TablePaginationProps): JSX.Element {
  const p = useProps("MuiTablePagination", props),
    selectId = createUniqueId();
  const from = () => (p.count === 0 ? 0 : p.page * p.rowsPerPage + 1);
  const to = () =>
    p.rowsPerPage === -1
      ? p.count
      : Math.min(
          p.count === -1 ? Infinity : p.count,
          (p.page + 1) * p.rowsPerPage,
        );
  return (
    <Root
      name="MuiTablePagination"
      props={p}
      component="td"
      colspan={!p.component || p.component === "td" ? 1000 : undefined}
      styles={(t) => ({
        ...t.typography.body2,
        color: t.palette.text.primary,
        overflow: "auto",
        padding: 0,
      })}
    >
      <Root
        name="MuiTablePagination"
        slot="toolbar"
        ownerProps={p}
        styles={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          minHeight: 52,
          padding: "0 16px",
          gap: 8,
        }}
      >
        <Root
          name="MuiTablePagination"
          slot="spacer"
          ownerProps={p}
          styles={{ flex: "1 1 100%" }}
        />
        <Show when={(p.rowsPerPageOptions ?? [10, 25, 50, 100]).length > 1}>
          <Root
            name="MuiTablePagination"
            slot="selectLabel"
            ownerProps={p}
            component="label"
            for={selectId}
            styles={{ flexShrink: 0 }}
          >
            {p.labelRowsPerPage ?? "Rows per page:"}
          </Root>
          <Root
            name="MuiTablePagination"
            slot="select"
            ownerProps={p}
            component="select"
            id={selectId}
            value={p.rowsPerPage}
            disabled={p.disabled}
            onChange={p.onRowsPerPageChange}
            styles={{
              border: 0,
              background: "transparent",
              color: "inherit",
              font: "inherit",
              padding: "6px 24px 6px 8px",
              cursor: "pointer",
            }}
          >
            <For each={p.rowsPerPageOptions ?? [10, 25, 50, 100]}>
              {(option) => (
                <Root
                  name="MuiTablePagination"
                  slot="menuItem"
                  ownerProps={p}
                  component="option"
                  value={typeof option === "number" ? option : option.value}
                >
                  {typeof option === "number" ? option : option.label}
                </Root>
              )}
            </For>
          </Root>
        </Show>
        <Root
          name="MuiTablePagination"
          slot="displayedRows"
          ownerProps={p}
          component="p"
          styles={{ marginInline: 16, flexShrink: 0 }}
        >
          {p.labelDisplayedRows?.({
            from: from(),
            to: to(),
            count: p.count,
            page: p.page,
          }) ??
            `${from()}–${to()} of ${p.count === -1 ? `more than ${(p.page + 1) * p.rowsPerPage}` : p.count}`}
        </Root>
        <Root
          name="MuiTablePagination"
          slot="actions"
          ownerProps={p}
          component={p.ActionsComponent ?? TablePaginationActions}
          count={p.count}
          page={p.page}
          rowsPerPage={p.rowsPerPage}
          onPageChange={p.onPageChange}
          showFirstButton={p.showFirstButton}
          showLastButton={p.showLastButton}
          disabled={p.disabled}
          getItemAriaLabel={p.getItemAriaLabel}
        />
      </Root>
    </Root>
  );
}
export interface ImageListProps extends MuiProps {
  cols?: number;
  rowHeight?: number | "auto";
  gap?: number;
  variant?: "standard" | "woven" | "masonry" | "quilted";
}
const ImageListContext = /* @__PURE__ */ createContext<ImageListProps>({});
export function ImageList(props: ImageListProps): JSX.Element {
  const p = useProps("MuiImageList", props);
  return (
    <ImageListContext value={p}>
      <Root
        name="MuiImageList"
        props={p}
        component="ul"
        styles={{
          display: p.variant === "masonry" ? "block" : "grid",
          overflowY: "auto",
          listStyle: "none",
          padding: 0,
          gridTemplateColumns: `repeat(${p.cols ?? 2}, 1fr)`,
          gap: p.gap ?? 4,
          columnCount: p.variant === "masonry" ? (p.cols ?? 2) : undefined,
          columnGap: p.gap ?? 4,
        }}
      />
    </ImageListContext>
  );
}
export interface ImageListItemProps extends MuiProps {
  cols?: number;
  rows?: number;
}
export function ImageListItem(props: ImageListItemProps): JSX.Element {
  const p = useProps("MuiImageListItem", props),
    list = useContext(ImageListContext);
  return (
    <Root
      name="MuiImageListItem"
      props={p}
      component="li"
      styles={{
        display: "flex",
        position: "relative",
        flexDirection: "column",
        gridColumnEnd: `span ${p.cols ?? 1}`,
        gridRowEnd: `span ${p.rows ?? 1}`,
        height:
          typeof list.rowHeight === "number"
            ? list.rowHeight * (p.rows ?? 1) +
              (list.gap ?? 4) * ((p.rows ?? 1) - 1)
            : "auto",
        breakInside: list.variant === "masonry" ? "avoid" : undefined,
        marginBottom: list.variant === "masonry" ? (list.gap ?? 4) : undefined,
        "& img": { width: "100%", height: "100%", objectFit: "cover" },
        ...(list.variant === "woven"
          ? { "&:nth-of-type(even)": { height: "80%", alignSelf: "center" } }
          : {}),
      }}
    />
  );
}
export interface ImageListItemBarProps extends Omit<MuiProps, "title"> {
  title?: JSX.Element;
  subtitle?: JSX.Element;
  position?: "top" | "bottom" | "below";
  actionIcon?: JSX.Element;
  actionPosition?: "left" | "right";
}
export function ImageListItemBar(props: ImageListItemBarProps): JSX.Element {
  const p = useProps("MuiImageListItemBar", props);
  return (
    <Root
      name="MuiImageListItemBar"
      props={p as MuiProps}
      styles={(t) => ({
        position: p.position === "below" ? "relative" : "absolute",
        [p.position === "top" ? "top" : "bottom"]: 0,
        left: 0,
        right: 0,
        background: p.position === "below" ? "transparent" : "rgba(0,0,0,.5)",
        display: "flex",
        alignItems: "center",
        color: p.position === "below" ? t.palette.text.primary : "#fff",
        flexDirection: p.actionPosition === "left" ? "row-reverse" : "row",
      })}
    >
      <div
        style={{ padding: "12px 16px", flex: "1 1 auto", overflow: "hidden" }}
      >
        <Typography noWrap>{p.title}</Typography>
        {p.subtitle && (
          <Typography variant="caption" noWrap>
            {p.subtitle}
          </Typography>
        )}
      </div>
      {p.actionIcon && <div>{p.actionIcon}</div>}
    </Root>
  );
}
export interface AlertProps extends MuiProps {
  severity?: "error" | "warning" | "info" | "success";
  variant?: "standard" | "filled" | "outlined";
  color?: "error" | "warning" | "info" | "success";
  icon?: JSX.Element | false;
  iconMapping?: Partial<
    Record<"error" | "warning" | "info" | "success", JSX.Element>
  >;
  action?: JSX.Element;
  onClose?: (event: MouseEvent) => void;
}
const alertPaths = {
  success: "M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  error:
    "M11 7h2v6h-2zm0 8h2v2h-2zm1-13a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z",
  warning: "M1 21h22L12 2zm12-3h-2v-2h2zm0-4h-2v-4h2z",
  info: "M11 17h2v-6h-2zm1-15a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-13h2v2h-2z",
};
export function Alert(props: AlertProps): JSX.Element {
  const p = useProps("MuiAlert", props);
  return (
    <Root
      name="MuiAlert"
      props={p}
      role={p.role ?? "alert"}
      styles={(t) => {
        const color = t.palette[p.color ?? p.severity ?? "success"];
        return {
          ...t.typography.body2,
          display: "flex",
          padding: "6px 16px",
          borderRadius: t.shape.borderRadius,
          color:
            p.variant === "filled"
              ? color.contrastText
              : t.palette.mode === "dark"
                ? lightenColor(color.light)
                : darkenColor(color.light),
          backgroundColor:
            p.variant === "filled"
              ? color.main
              : p.variant === "outlined"
                ? "transparent"
                : t.palette.mode === "dark"
                  ? darkenColorBase(color.light, 0.9)
                  : lightenColorBase(color.light, 0.9),
          border:
            p.variant === "outlined" ? `1px solid ${color.main}` : undefined,
        };
      }}
    >
      {p.icon !== false && (
        <Root
          name="MuiAlert"
          slot="icon"
          ownerProps={p}
          styles={(t) => ({
            marginRight: 12,
            padding: "7px 0",
            display: "flex",
            opacity: 0.9,
            color:
              p.variant === "filled"
                ? "inherit"
                : t.palette[p.color ?? p.severity ?? "success"].main,
          })}
        >
          {p.icon ?? p.iconMapping?.[p.severity ?? "success"] ?? (
            <SvgIcon fontSize="inherit">
              <path d={alertPaths[p.severity ?? "success"]} />
            </SvgIcon>
          )}
        </Root>
      )}
      <Root
        name="MuiAlert"
        slot="message"
        ownerProps={p}
        styles={{ padding: "8px 0", overflow: "auto" }}
      >
        {p.children}
      </Root>
      {(p.action || p.onClose) && (
        <Root
          name="MuiAlert"
          slot="action"
          ownerProps={p}
          styles={{
            display: "flex",
            alignItems: "flex-start",
            padding: "4px 0 0 16px",
            marginLeft: "auto",
            marginRight: -8,
          }}
        >
          {p.action ?? (
            <button
              type="button"
              aria-label="Close"
              onClick={p.onClose}
              style={{
                border: 0,
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
                padding: "4px",
                "font-size": "20px",
              }}
            >
              ×
            </button>
          )}
        </Root>
      )}
    </Root>
  );
}
import {
  lighten as lightenColorBase,
  darken as darkenColorBase,
} from "./theme";
const lightenColor = (c: string) => lightenColorBase(c, 0.6);
const darkenColor = (c: string) => darkenColorBase(c, 0.6);
export const AlertTitle = /* @__PURE__ */ simple("MuiAlertTitle", "div", (_, t) => ({
  ...t.typography.body1,
  fontWeight: 500,
  marginTop: -2,
  marginBottom: 4,
}));
export interface CircularProgressProps extends MuiProps {
  color?: Color;
  size?: number | string;
  thickness?: number;
  value?: number;
  variant?: "determinate" | "indeterminate";
  disableShrink?: boolean;
}
export function CircularProgress(props: CircularProgressProps): JSX.Element {
  const p = useProps("MuiCircularProgress", props);
  const circumference = () => 2 * Math.PI * ((44 - (p.thickness ?? 3.6)) / 2);
  return (
    <Root
      name="MuiCircularProgress"
      props={p}
      component="span"
      role="progressbar"
      aria-valuenow={
        p.variant === "determinate" ? Math.round(p.value ?? 0) : undefined
      }
      aria-valuemin={p.variant === "determinate" ? 0 : undefined}
      aria-valuemax={p.variant === "determinate" ? 100 : undefined}
      styles={(t) => ({
        display: "inline-block",
        width: p.size ?? 40,
        height: p.size ?? 40,
        color:
          p.color === "inherit"
            ? "inherit"
            : t.palette[p.color ?? "primary"].main,
        ...(p.variant === "determinate"
          ? { transform: "rotate(-90deg)" }
          : { animation: "mui-circular-rotate 1.4s linear infinite" }),
        "@keyframes mui-circular-rotate": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "@keyframes mui-circular-dash": {
          "0%": { strokeDasharray: "1px,200px", strokeDashoffset: 0 },
          "50%": { strokeDasharray: "100px,200px", strokeDashoffset: -15 },
          "100%": { strokeDasharray: "100px,200px", strokeDashoffset: -125 },
        },
        "@media (prefers-reduced-motion: reduce)": {
          animationDuration: "2.8s",
        },
      })}
    >
      <svg
        class={resolveMuiClassName("MuiCircularProgress-svg")}
        viewBox="22 22 44 44"
        style={{ display: "block" }}
      >
        <circle
          class={resolveMuiClassName("MuiCircularProgress-circle")}
          cx="44"
          cy="44"
          r={(44 - (p.thickness ?? 3.6)) / 2}
          fill="none"
          stroke="currentColor"
          stroke-width={p.thickness ?? 3.6}
          stroke-dasharray={
            p.variant === "determinate" ? String(circumference()) : "80px,200px"
          }
          stroke-dashoffset={String(
            p.variant === "determinate"
              ? circumference() * (1 - clamp(p.value ?? 0, 0, 100) / 100)
              : 0,
          )}
          style={{
            transition: "stroke-dashoffset .3s",
            animation:
              p.variant !== "determinate" && !p.disableShrink
                ? "mui-circular-dash 1.4s ease-in-out infinite"
                : undefined,
          }}
        />
      </svg>
    </Root>
  );
}
export interface LinearProgressProps extends MuiProps {
  color?: Color;
  value?: number;
  valueBuffer?: number;
  variant?: "determinate" | "indeterminate" | "buffer" | "query";
}
export function LinearProgress(props: LinearProgressProps): JSX.Element {
  const p = useProps("MuiLinearProgress", props);
  const t = useTheme();
  const color = () =>
    p.color === "inherit"
      ? "currentColor"
      : t.palette[p.color ?? "primary"].main;
  return (
    <Root
      name="MuiLinearProgress"
      props={p}
      role="progressbar"
      aria-valuenow={
        p.variant === "determinate" ? Math.round(p.value ?? 0) : undefined
      }
      aria-valuemin={p.variant === "determinate" ? 0 : undefined}
      aria-valuemax={p.variant === "determinate" ? 100 : undefined}
      styles={{
        position: "relative",
        overflow: "hidden",
        display: "block",
        height: 4,
        zIndex: 0,
        backgroundColor:
          p.variant === "buffer" ? "transparent" : alpha(color(), 0.3),
        transform: p.variant === "query" ? "rotate(180deg)" : undefined,
        "@keyframes mui-linear-1": {
          "0%": { left: "-35%", right: "100%" },
          "60%": { left: "100%", right: "-90%" },
          "100%": { left: "100%", right: "-90%" },
        },
        "@keyframes mui-linear-2": {
          "0%": { left: "-200%", right: "100%" },
          "60%": { left: "107%", right: "-8%" },
          "100%": { left: "107%", right: "-8%" },
        },
      }}
    >
      {p.variant === "buffer" && (
        <span
          class={resolveMuiClassName("MuiLinearProgress-bar2")}
          style={{
            position: "absolute",
            inset: 0,
            background: alpha(color(), 0.3),
            transform: `translateX(${-(100 - clamp(p.valueBuffer ?? 0, 0, 100))}%)`,
          }}
        />
      )}
      <span
        class={resolveMuiClassName("MuiLinearProgress-bar1")}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width:
            p.variant === "determinate" || p.variant === "buffer"
              ? "100%"
              : "auto",
          background: color(),
          transition: "transform .4s linear",
          transform:
            p.variant === "determinate" || p.variant === "buffer"
              ? `translateX(${-(100 - clamp(p.value ?? 0, 0, 100))}%)`
              : undefined,
          animation:
            p.variant !== "determinate" && p.variant !== "buffer"
              ? "mui-linear-1 2.1s cubic-bezier(.65,.815,.735,.395) infinite"
              : undefined,
        }}
      />
      {p.variant !== "determinate" && p.variant !== "buffer" && (
        <span
          class={resolveMuiClassName("MuiLinearProgress-bar2")}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            background: color(),
            animation:
              "mui-linear-2 2.1s cubic-bezier(.165,.84,.44,1) 1.15s infinite",
          }}
        />
      )}
    </Root>
  );
}
export interface SkeletonProps extends MuiProps {
  variant?: "text" | "rectangular" | "rounded" | "circular";
  animation?: "pulse" | "wave" | false;
  width?: number | string;
  height?: number | string;
}
export const Skeleton = /* @__PURE__ */ simple<SkeletonProps>(
  "MuiSkeleton",
  "span",
  (p, t) => ({
    display: "block",
    backgroundColor: alpha(
      t.palette.text.primary,
      t.palette.mode === "light" ? 0.11 : 0.13,
    ),
    height: p.height ?? "1.2em",
    width: p.width,
    borderRadius:
      p.variant === "circular"
        ? "50%"
        : p.variant === "rectangular"
          ? 0
          : t.shape.borderRadius,
    ...(p.variant === "text" || !p.variant
      ? {
          transform: "scale(1, .6)",
          transformOrigin: "0 55%",
          "&:empty::before": { content: '"\\00a0"' },
        }
      : {}),
    animation:
      p.animation === false
        ? undefined
        : p.animation === "wave"
          ? undefined
          : "mui-pulse 2s ease-in-out .5s infinite",
    position: "relative",
    overflow: "hidden",
    "& > *": { visibility: "hidden" },
    ...(p.animation === "wave"
      ? {
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            transform: "translateX(-100%)",
            background: `linear-gradient(90deg, transparent, ${t.palette.action.hover}, transparent)`,
            animation: "mui-wave 2s linear .5s infinite",
          },
        }
      : {}),
    "@keyframes mui-pulse": {
      "0%, 100%": { opacity: 1 },
      "50%": { opacity: 0.4 },
    },
    "@keyframes mui-wave": {
      "0%": { transform: "translateX(-100%)" },
      "50%, 100%": { transform: "translateX(100%)" },
    },
    "@media (prefers-reduced-motion: reduce)": {
      animation: "none",
      "&::after": { animation: "none" },
    },
  }),
);
export interface CssBaselineProps {
  children?: JSX.Element;
  enableColorScheme?: boolean;
}
export function CssBaseline(p: CssBaselineProps = {}): JSX.Element {
  const t = useTheme();
  return (
    <>
      <GlobalStyles
        styles={
          [
            {
              html: {
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
                boxSizing: "border-box",
                ...(p.enableColorScheme ? { colorScheme: t.palette.mode } : {}),
              },
              "*, *::before, *::after": { boxSizing: "inherit" },
              body: {
                margin: 0,
                color: t.palette.text.primary,
                ...t.typography.body1,
                backgroundColor: t.palette.background.default,
                "@media print": { backgroundColor: "#fff" },
              },
              "strong, b": { fontWeight: t.typography.fontWeightBold },
              "@media (prefers-reduced-motion: reduce)": {
                "*, *::before, *::after": { scrollBehavior: "auto" },
              },
            },
            t.components.MuiCssBaseline?.styleOverrides,
          ] as import("./theme").SxProps
        }
      />
      {p.children}
    </>
  );
}
export interface ScopedCssBaselineProps extends MuiProps {
  enableColorScheme?: boolean;
}
export const ScopedCssBaseline = /* @__PURE__ */ simple<ScopedCssBaselineProps>(
  "MuiScopedCssBaseline",
  "div",
  (p, t) => ({
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    boxSizing: "border-box",
    ...t.typography.body1,
    color: t.palette.text.primary,
    backgroundColor: t.palette.background.default,
    colorScheme: p.enableColorScheme ? t.palette.mode : undefined,
    "& *, & *::before, & *::after": { boxSizing: "inherit" },
    "& strong, & b": { fontWeight: t.typography.fontWeightBold },
  }),
);
export function darkScrollbar(
  options: {
    track?: string;
    thumb?: string;
    active?: string;
  } = {},
): CSSObject {
  const track = options.track ?? "#2b2b2b",
    thumb = options.thumb ?? "#6b6b6b",
    active = options.active ?? "#959595";
  return {
    scrollbarColor: `${thumb} ${track}`,
    "&::-webkit-scrollbar, & *::-webkit-scrollbar": { backgroundColor: track },
    "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
      borderRadius: 8,
      backgroundColor: thumb,
      minHeight: 24,
      border: `3px solid ${track}`,
    },
    "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
      backgroundColor: active,
    },
  };
}
