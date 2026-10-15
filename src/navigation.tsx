import { resolveMuiClassName } from "./class-names";
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  onSettled,
  Show,
  useContext,
  omit,
  children,
  untrack,
} from "solid-js";
import { dynamic } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import {
  Root,
  useControlled,
  useProps,
  callHandler,
  setRef,
  clamp,
} from "./core";
import type { MuiProps, Color, Size } from "./core";
import { Collapse, Tooltip } from "./overlays";
import { useReducedMotion } from "./motion";
import { useTheme } from "./theme";
import type { CSSObject } from "./theme";
/** Keep implicit child indices aligned with keyed DOM moves and removals. */
function createChildOrder(
  root: () => HTMLElement | undefined,
  selector: string,
  boundary: string,
): (node: HTMLElement | undefined, fallback: number) => number {
  const [nodes, setNodes] = createSignal<ReadonlyMap<HTMLElement, number>>(new Map());
  onSettled(() => {
    const container = root();
    if (!container) return;
    const collect = () => {
      const next = Array.from(
        container.querySelectorAll<HTMLElement>(selector),
      ).filter((node) => node.closest(boundary) === container);
      const previous = untrack(nodes);
      if (
        next.length !== previous.size ||
        next.some((node, i) => previous.get(node) !== i)
      )
        setNodes(new Map(next.map((node, i) => [node, i])));
    };
    collect();
    const observer = new MutationObserver(collect);
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  });
  return (node, fallback) => {
    const current = nodes();
    return (node ? current.get(node) : undefined) ?? fallback;
  };
}
interface TabsContextValue {
  value: () => unknown;
  change: (event: Event, value: unknown) => void;
  allocate: () => number;
  orderIndex: (node: HTMLElement | undefined, fallback: number) => number;
  orientation: () => "horizontal" | "vertical";
  textColor: () => "primary" | "secondary" | "inherit";
  selectionFollowsFocus: () => boolean;
  fullWidth: () => boolean;
}
const TabsContext = /* @__PURE__ */ createContext<TabsContextValue | null>(null);
export interface TabsProps extends MuiProps {
  value?: unknown;
  defaultValue?: unknown;
  onChange?: (event: Event, value: unknown) => void;
  orientation?: "horizontal" | "vertical";
  variant?: "standard" | "scrollable" | "fullWidth";
  centered?: boolean;
  textColor?: "primary" | "secondary" | "inherit";
  indicatorColor?: "primary" | "secondary";
  selectionFollowsFocus?: boolean;
  scrollButtons?: boolean | "auto";
  allowScrollButtonsMobile?: boolean;
  visibleScrollbar?: boolean;
  TabIndicatorProps?: MuiProps;
  TabScrollButtonProps?: TabScrollButtonProps;
  ScrollButtonComponent?: (p: TabScrollButtonProps) => JSX.Element;
  action?: (api: {
    updateIndicator: () => void;
    updateScrollButtons: () => void;
  }) => void;
}
export function Tabs(props: TabsProps): JSX.Element {
  const p = useProps("MuiTabs", props);
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const ScrollButton = dynamic(
    () => p.ScrollButtonComponent ?? p.slots?.scrollButtons ?? TabScrollButton,
  );
  const [value, setValue] = useControlled(
    () => p.value,
    () => p.defaultValue ?? 0,
  );
  let sequence = 0;
  let root!: HTMLElement;
  let list!: HTMLDivElement;
  let scroller!: HTMLDivElement;
  let scrollFrame = 0;
  const orderIndex = createChildOrder(
    () => list,
    resolveMuiClassName(".MuiTab-root"),
    resolveMuiClassName(".MuiTabs-list"),
  );
  const [indicator, setIndicator] = createSignal({ start: 0, size: 0 });
  const [overflow, setOverflow] = createSignal({ start: false, end: false });
  const vertical = () => p.orientation === "vertical";
  const update = () => {
    if (!list || !scroller) return;
    const active = list.querySelector<HTMLElement>('[aria-selected="true"]');
    if (active)
      setIndicator({
        start: vertical() ? active.offsetTop : active.offsetLeft,
        size: vertical() ? active.offsetHeight : active.offsetWidth,
      });
    else setIndicator({ start: 0, size: 0 });
    const current = vertical() ? scroller.scrollTop : scroller.scrollLeft;
    const available = vertical()
      ? scroller.scrollHeight - scroller.clientHeight
      : scroller.scrollWidth - scroller.clientWidth;
    setOverflow({ start: current > 1, end: current < available - 1 });
  };
  onSettled(() => {
    update();
    setRef(p.action, { updateIndicator: update, updateScrollButtons: update });
    const observer = new ResizeObserver(update);
    observer.observe(root);
    observer.observe(list);
    const mutation = new MutationObserver(update);
    mutation.observe(list, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    return () => {
      cancelAnimationFrame(scrollFrame);
      observer.disconnect();
      mutation.disconnect();
    };
  });
  createEffect(
    () => [
      value(),
      orderIndex(undefined, 0),
      p.orientation,
      p.variant,
      p.children,
    ],
    () => {
      queueMicrotask(update);
    },
  );
  const context: TabsContextValue = {
    value,
    change: (event, next) => {
      if (next !== value()) {
        setValue(next);
        p.onChange?.(event, next);
      }
    },
    allocate: () => sequence++,
    orderIndex,
    orientation: () => p.orientation ?? "horizontal",
    textColor: () => p.textColor ?? "primary",
    selectionFollowsFocus: () => !!p.selectionFollowsFocus,
    fullWidth: () => p.variant === "fullWidth",
  };
  const scroll = (direction: number) => {
    cancelAnimationFrame(scrollFrame);
    const property = vertical() ? "scrollTop" : "scrollLeft";
    const start = scroller[property];
    const delta =
      direction *
      (vertical() ? scroller.clientHeight : scroller.clientWidth) *
      0.8;
    const duration = untrack(reducedMotion)
      ? 0
      : theme.transitions.duration.standard;
    if (duration <= 0) {
      scroller[property] = start + delta;
      return;
    }
    const started = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      scroller[property] =
        start + (delta * (1 - Math.cos(Math.PI * progress))) / 2;
      if (progress < 1) scrollFrame = requestAnimationFrame(animate);
    };
    scrollFrame = requestAnimationFrame(animate);
  };
  const showScroll = () =>
    p.variant === "scrollable" &&
    p.scrollButtons !== false &&
    (p.scrollButtons === true || overflow().start || overflow().end);
  return (
    <TabsContext value={context}>
      <Root
        name="MuiTabs"
        props={omit(p, "onKeyDown")}
        ref={(el: HTMLElement) => {
          root = el;
          setRef(
            untrack(() => p.ref),
            el,
          );
        }}
        styles={{
          display: "flex",
          flexDirection: vertical() ? "column" : "row",
          minHeight: 48,
          overflow: "hidden",
        }}
      >
        <Show when={showScroll()}>
          <ScrollButton
            {...p.TabScrollButtonProps}
            orientation={p.orientation}
            direction="left"
            disabled={!overflow().start}
            onClick={() => scroll(-1)}
          />
        </Show>
        <div
          ref={scroller}
          class={resolveMuiClassName("MuiTabs-scroller")}
          onScroll={update}
          style={{
            position: "relative",
            flex: "1 1 auto",
            overflow: p.variant === "scrollable" ? "auto" : "hidden",
            "scrollbar-width": p.visibleScrollbar ? "auto" : "none",
          }}
        >
          <div
            ref={list}
            class={resolveMuiClassName("MuiTabs-list")}
            role="tablist"
            aria-label={p["aria-label"]}
            aria-labelledby={p["aria-labelledby"]}
            aria-orientation={p.orientation ?? "horizontal"}
            style={{
              display: "flex",
              "flex-direction": vertical() ? "column" : "row",
              "justify-content": p.centered ? "center" : undefined,
            }}
            onKeyDown={(e: KeyboardEvent) => {
              callHandler(p.onKeyDown, e);
              if (e.defaultPrevented) return;
              const previous = vertical() ? "ArrowUp" : "ArrowLeft";
              const next = vertical() ? "ArrowDown" : "ArrowRight";
              if (![previous, next, "Home", "End"].includes(e.key)) return;
              const nodes = Array.from(
                list.querySelectorAll<HTMLButtonElement>(
                  '[role="tab"]:not(:disabled)',
                ),
              );
              const current = nodes.indexOf(
                document.activeElement as HTMLButtonElement,
              );
              if (nodes.length) {
                e.preventDefault();
                nodes[
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? nodes.length - 1
                      : (current +
                          (e.key === next ? 1 : -1) *
                            (!vertical() &&
                            getComputedStyle(list).direction === "rtl"
                              ? -1
                              : 1) +
                          nodes.length) %
                        nodes.length
                ].focus();
              }
            }}
          >
            {p.children}
          </div>
          <Root
            name="MuiTabs"
            slot="indicator"
            ownerProps={p}
            props={p.TabIndicatorProps}
            styles={(t) => ({
              position: "absolute",
              background: t.palette[p.indicatorColor ?? "primary"].main,
              transition: t.transitions.create("all", {
                duration: reducedMotion() ? 0 : t.transitions.duration.standard,
              }),
              [vertical() ? "right" : "bottom"]: 0,
              [vertical() ? "top" : "left"]: indicator().start,
              [vertical() ? "height" : "width"]: indicator().size,
              [vertical() ? "width" : "height"]: 2,
            })}
          />
        </div>
        <Show when={showScroll()}>
          <ScrollButton
            {...p.TabScrollButtonProps}
            orientation={p.orientation}
            direction="right"
            disabled={!overflow().end}
            onClick={() => scroll(1)}
          />
        </Show>
      </Root>
    </TabsContext>
  );
}
export interface TabProps extends MuiProps {
  label?: JSX.Element;
  icon?: JSX.Element;
  iconPosition?: "top" | "bottom" | "start" | "end";
  value?: unknown;
  disabled?: boolean;
  wrapped?: boolean;
  href?: string;
  onChange?: (event: Event, value: unknown) => void;
}
export function Tab(props: TabProps): JSX.Element {
  const p = useProps("MuiTab", props);
  const context = useContext(TabsContext);
  const allocated = context?.allocate() ?? 0;
  let root: HTMLElement | undefined;
  const value = () =>
    p.value === undefined
      ? context?.orderIndex(root, allocated) ?? allocated
      : p.value;
  const selected = () => context?.value() === value();
  const change = (e: Event) => {
    context?.change(e, value());
    p.onChange?.(e, value());
  };
  return (
    <Root
      name="MuiTab"
      props={p}
      ref={(el: HTMLElement) => {
        root = el;
        setRef(
          untrack(() => p.ref),
          el,
        );
      }}
      component={p.href ? "a" : "button"}
      type={p.href ? undefined : "button"}
      href={p.href}
      role="tab"
      aria-selected={selected()}
      disabled={p.disabled}
      tabindex={selected() ? 0 : -1}
      onBlur={p.onBlur}
      onKeyDown={p.onKeyDown}
      onClick={(e: MouseEvent) => {
        callHandler(p.onClick, e);
        if (!e.defaultPrevented && !p.disabled) change(e);
      }}
      onFocus={(e: FocusEvent) => {
        callHandler(p.onFocus, e);
        if (context?.selectionFollowsFocus() && !p.disabled) change(e);
      }}
      state={{ selected: selected(), disabled: !!p.disabled }}
      styles={(t) => ({
        ...t.typography.button,
        display: "inline-flex",
        flexDirection:
          p.iconPosition === "start"
            ? "row"
            : p.iconPosition === "end"
              ? "row-reverse"
              : p.iconPosition === "bottom"
                ? "column-reverse"
                : "column",
        gap: p.icon && p.label ? 8 : undefined,
        alignItems: "center",
        justifyContent: "center",
        border: 0,
        background: "transparent",
        padding: "12px 16px",
        minHeight: p.icon && p.label ? 72 : 48,
        minWidth: 90,
        maxWidth: context?.fullWidth() ? "none" : 360,
        flex: context?.fullWidth() ? "1 1 0" : "0 0 auto",
        cursor: p.disabled ? "default" : "pointer",
        opacity: p.disabled ? 0.38 : 1,
        color:
          selected() && context?.textColor() !== "inherit"
            ? t.palette[
                context?.textColor() === "secondary" ? "secondary" : "primary"
              ].main
            : "inherit",
        whiteSpace: p.wrapped ? "normal" : "nowrap",
        "&:hover": { background: t.palette.action.hover },
        "&:focus-visible":
          t.focusVisible === false
            ? undefined
            : t.focusVisible
              ? {
                  ...t.focusVisible,
                  // Keep the configured ring inside the clipping Tabs scroller.
                  "--_focusVisible-offset": -3,
                  "--_focusVisible-behavior": "inset",
                }
              : {
                  outline: `2px solid ${t.palette.primary.main}`,
                  outlineOffset: -2,
                },
      })}
    >
      {p.icon}
      {p.label ?? p.children}
    </Root>
  );
}
export interface TabScrollButtonProps extends MuiProps {
  direction: "left" | "right";
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
}
export function TabScrollButton(props: TabScrollButtonProps): JSX.Element {
  const p = useProps("MuiTabScrollButton", props);
  return (
    <Root
      name="MuiTabScrollButton"
      props={p}
      component="button"
      type="button"
      disabled={p.disabled}
      aria-label={`Scroll ${p.direction}`}
      styles={{
        border: 0,
        width: p.orientation === "vertical" ? "100%" : 40,
        height: p.orientation === "vertical" ? 40 : undefined,
        flexShrink: 0,
        cursor: p.disabled ? "default" : "pointer",
        opacity: p.disabled ? 0 : 1,
        background: "transparent",
        color: "inherit",
        fontSize: 24,
      }}
    >
      {p.children ??
        (p.orientation === "vertical"
          ? p.direction === "left"
            ? "⌃"
            : "⌄"
          : p.direction === "left"
            ? "‹"
            : "›")}
    </Root>
  );
}
interface BottomContextValue {
  value: () => unknown;
  change: (event: Event, value: unknown) => void;
  allocate: () => number;
  orderIndex: (node: HTMLElement | undefined, fallback: number) => number;
  showLabels: () => boolean;
}
const BottomContext = /* @__PURE__ */ createContext<BottomContextValue | null>(null);
export interface BottomNavigationProps extends MuiProps {
  value?: unknown;
  defaultValue?: unknown;
  showLabels?: boolean;
  onChange?: (event: Event, value: unknown) => void;
}
export function BottomNavigation(props: BottomNavigationProps): JSX.Element {
  const p = useProps("MuiBottomNavigation", props);
  const [value, setValue] = useControlled(
    () => p.value,
    () => p.defaultValue,
  );
  let sequence = 0;
  let root: HTMLElement | undefined;
  const orderIndex = createChildOrder(
    () => root,
    resolveMuiClassName(".MuiBottomNavigationAction-root"),
    resolveMuiClassName(".MuiBottomNavigation-root"),
  );
  return (
    <BottomContext
      value={{
        value,
        allocate: () => sequence++,
        orderIndex,
        showLabels: () => !!p.showLabels,
        change: (event, next) => {
          setValue(next);
          p.onChange?.(event, next);
        },
      }}
    >
      <Root
        name="MuiBottomNavigation"
        props={p}
        ref={(el: HTMLElement) => {
          root = el;
          setRef(
            untrack(() => p.ref),
            el,
          );
        }}
        styles={(t) => ({
          display: "flex",
          justifyContent: "center",
          height: 56,
          background: t.palette.background.paper,
        })}
      />
    </BottomContext>
  );
}
export interface BottomNavigationActionProps extends MuiProps {
  value?: unknown;
  label?: JSX.Element;
  icon?: JSX.Element;
  showLabel?: boolean;
  disabled?: boolean;
  href?: string;
}
export function BottomNavigationAction(
  props: BottomNavigationActionProps,
): JSX.Element {
  const p = useProps("MuiBottomNavigationAction", props);
  const context = useContext(BottomContext);
  const allocated = context?.allocate() ?? 0;
  let root: HTMLElement | undefined;
  const value = () =>
    p.value === undefined
      ? context?.orderIndex(root, allocated) ?? allocated
      : p.value;
  const selected = () => value() === context?.value();
  const show = () => selected() || (p.showLabel ?? context?.showLabels());
  return (
    <Root
      name="MuiBottomNavigationAction"
      props={p}
      ref={(el: HTMLElement) => {
        root = el;
        setRef(
          untrack(() => p.ref),
          el,
        );
      }}
      component={p.href ? "a" : "button"}
      type={p.href ? undefined : "button"}
      href={p.href}
      disabled={p.disabled}
      aria-label={typeof p.label === "string" ? p.label : undefined}
      aria-current={selected() ? "page" : undefined}
      onFocus={p.onFocus}
      onBlur={p.onBlur}
      onKeyDown={p.onKeyDown}
      onClick={(e: MouseEvent) => {
        callHandler(p.onClick, e);
        if (!e.defaultPrevented && !p.disabled) context?.change(e, value());
      }}
      state={{ selected: selected(), disabled: !!p.disabled }}
      styles={(t) => ({
        border: 0,
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: "1 1 0",
        minWidth: 80,
        maxWidth: 168,
        padding: "6px 12px 8px",
        gap: 2,
        cursor: "pointer",
        color: selected() ? t.palette.primary.main : t.palette.text.secondary,
        opacity: p.disabled ? 0.38 : 1,
        transition: "color 200ms",
      })}
    >
      {p.icon}
      <span
        class={resolveMuiClassName("MuiBottomNavigationAction-label")}
        style={{
          opacity: show() ? 1 : 0,
          "font-size": selected() ? "0.875rem" : "0.75rem",
          transition: "font-size 200ms, opacity 200ms",
        }}
      >
        {p.label}
      </span>
    </Root>
  );
}
export interface BreadcrumbsProps extends MuiProps {
  separator?: JSX.Element;
  maxItems?: number;
  itemsAfterCollapse?: number;
  itemsBeforeCollapse?: number;
  expandText?: string;
}
function flattenChildren(value: JSX.Element): JSX.Element[] {
  return Array.isArray(value)
    ? value.flatMap(flattenChildren)
    : value == null || typeof value === "boolean"
      ? []
      : [value];
}
export function Breadcrumbs(props: BreadcrumbsProps): JSX.Element {
  const p = useProps("MuiBreadcrumbs", props);
  const [expanded, setExpanded] = createSignal(false);
  const all = createMemo(() => flattenChildren(p.children));
  const collapsed = () => !expanded() && all().length > (p.maxItems ?? 8);
  const visible = () =>
    collapsed()
      ? [
          ...all().slice(0, p.itemsBeforeCollapse ?? 1),
          <button
            type="button"
            class={resolveMuiClassName("MuiBreadcrumbs-collapsed")}
            aria-label={p.expandText ?? "Show path"}
            onClick={() => setExpanded(true)}
            style={{
              border: 0,
              background: "rgba(0,0,0,.08)",
              cursor: "pointer",
              "border-radius": "2px",
            }}
          >
            •••
          </button>,
          ...((p.itemsAfterCollapse ?? 1) > 0
            ? all().slice(-(p.itemsAfterCollapse ?? 1))
            : []),
        ]
      : all();
  return (
    <Root
      name="MuiBreadcrumbs"
      props={p}
      component="nav"
      aria-label={p["aria-label"] ?? "breadcrumb"}
      styles={(t) => ({
        ...t.typography.body1,
        color: t.palette.text.secondary,
      })}
    >
      <ol
        style={{
          display: "flex",
          "flex-wrap": "wrap",
          "align-items": "center",
          padding: 0,
          margin: 0,
          "list-style": "none",
        }}
      >
        <For each={visible()}>
          {(item, index) => (
            <>
              <Show when={index() > 0}>
                <li
                  aria-hidden="true"
                  class={resolveMuiClassName("MuiBreadcrumbs-separator")}
                  style={{
                    display: "flex",
                    "user-select": "none",
                    margin: "0 8px",
                  }}
                >
                  {p.separator ?? "/"}
                </li>
              </Show>
              <li class={resolveMuiClassName("MuiBreadcrumbs-li")}>{item}</li>
            </>
          )}
        </For>
      </ol>
    </Root>
  );
}
export type PaginationItemType =
  | "page"
  | "first"
  | "last"
  | "next"
  | "previous"
  | "start-ellipsis"
  | "end-ellipsis";
export interface UsePaginationProps {
  count?: number;
  page?: number;
  defaultPage?: number;
  boundaryCount?: number;
  siblingCount?: number;
  disabled?: boolean;
  hideNextButton?: boolean;
  hidePrevButton?: boolean;
  showFirstButton?: boolean;
  showLastButton?: boolean;
  onChange?: (event: Event, page: number) => void;
}
export interface UsePaginationItem {
  onClick: (event: MouseEvent) => void;
  type: PaginationItemType;
  page: number | null;
  selected: boolean;
  disabled: boolean;
  "aria-current"?: "page";
}
export function usePagination(p: UsePaginationProps = {}): {
  readonly items: UsePaginationItem[];
} {
  const [page, setPage] = useControlled(
    () => p.page,
    () => p.defaultPage ?? 1,
  );
  const range = (start: number, end: number) =>
    Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
  const items = createMemo(() => {
    const count = Math.max(0, Math.floor(p.count ?? 1));
    const current = clamp(page(), 1, Math.max(1, count));
    const boundary = Math.max(0, p.boundaryCount ?? 1);
    const sibling = Math.max(0, p.siblingCount ?? 1);
    const start = range(1, Math.min(boundary, count));
    const end = range(Math.max(count - boundary + 1, boundary + 1), count);
    const siblingStart = Math.max(
      Math.min(current - sibling, count - boundary - sibling * 2 - 1),
      boundary + 2,
    );
    const siblingEnd = Math.min(
      Math.max(current + sibling, boundary + sibling * 2 + 2),
      end.length ? end[0] - 2 : count - 1,
    );
    const list: (number | PaginationItemType)[] = [
      ...(p.showFirstButton ? ["first" as const] : []),
      ...(p.hidePrevButton ? [] : ["previous" as const]),
      ...start,
      ...(siblingStart > boundary + 2
        ? ["start-ellipsis" as const]
        : boundary + 1 < count - boundary
          ? [boundary + 1]
          : []),
      ...range(siblingStart, siblingEnd),
      ...(siblingEnd < count - boundary - 1
        ? ["end-ellipsis" as const]
        : count - boundary > boundary
          ? [count - boundary]
          : []),
      ...end,
      ...(p.hideNextButton ? [] : ["next" as const]),
      ...(p.showLastButton ? ["last" as const] : []),
    ];
    return list.map((item) => {
      const type = typeof item === "number" ? "page" : item;
      const target =
        typeof item === "number"
          ? item
          : item === "first"
            ? 1
            : item === "last"
              ? count
              : item === "previous"
                ? current - 1
                : item === "next"
                  ? current + 1
                  : null;
      return {
        type,
        page: target,
        selected: type === "page" && target === current,
        disabled:
          !!p.disabled ||
          (type !== "page" &&
            !type.includes("ellipsis") &&
            (target == null || target < 1 || target > count)),
        "aria-current":
          type === "page" && target === current ? ("page" as const) : undefined,
        onClick: (event: MouseEvent) => {
          if (
            target != null &&
            target >= 1 &&
            target <= count &&
            !p.disabled &&
            target !== current
          ) {
            setPage(target);
            p.onChange?.(event, target);
          }
        },
      };
    });
  });
  return {
    get items() {
      return items();
    },
  };
}
export interface PaginationItemProps extends MuiProps {
  page?: number | null;
  type?: PaginationItemType;
  selected?: boolean;
  disabled?: boolean;
  variant?: "text" | "outlined";
  shape?: "circular" | "rounded";
  size?: Size;
  color?: Color | "standard";
}
export function PaginationItem(props: PaginationItemProps): JSX.Element {
  const p = useProps("MuiPaginationItem", props);
  const ellipsis = () => p.type?.includes("ellipsis");
  return (
    <Root
      name="MuiPaginationItem"
      props={p}
      component={ellipsis() ? "div" : "button"}
      type={ellipsis() ? undefined : "button"}
      disabled={!ellipsis() && p.disabled}
      aria-current={p.selected ? "page" : undefined}
      onFocus={p.onFocus}
      onBlur={p.onBlur}
      onKeyDown={p.onKeyDown}
      state={{ selected: !!p.selected, disabled: !!p.disabled }}
      styles={(t) => {
        const color =
          p.color && p.color !== "inherit" && p.color !== "standard"
            ? t.palette[p.color]
            : null;
        const diameter = p.size === "small" ? 26 : p.size === "large" ? 40 : 32;
        return {
          ...t.typography.body2,
          border:
            p.variant === "outlined" && !ellipsis()
              ? `1px solid ${p.selected && color ? color.main : t.palette.divider}`
              : 0,
          borderRadius: p.shape === "rounded" ? t.shape.borderRadius : "50%",
          height: diameter,
          minWidth: diameter,
          padding: "0 6px",
          margin: "0 3px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: ellipsis() || p.disabled ? "default" : "pointer",
          fontSize: p.size === "large" ? "0.9375rem" : undefined,
          background: p.selected
            ? p.variant === "outlined"
              ? color
                ? `${color.main}14`
                : t.palette.action.selected
              : color?.main ?? t.palette.action.selected
            : "transparent",
          color:
            p.selected && color
              ? p.variant === "outlined"
                ? color.main
                : color.contrastText
              : t.palette.text.primary,
          opacity: p.disabled ? 0.38 : 1,
          "&:hover": {
            background:
              p.disabled || ellipsis()
                ? undefined
                : p.selected && color && p.variant !== "outlined"
                  ? color.dark
                  : t.palette.action.hover,
          },
        };
      }}
    >
      {p.children ??
        (p.type === "first"
          ? "«"
          : p.type === "last"
            ? "»"
            : p.type === "previous"
              ? "‹"
              : p.type === "next"
                ? "›"
                : ellipsis()
                  ? "…"
                  : p.page)}
    </Root>
  );
}
export interface PaginationProps extends MuiProps, UsePaginationProps {
  variant?: PaginationItemProps["variant"];
  shape?: PaginationItemProps["shape"];
  size?: Size;
  color?: Color | "standard";
  renderItem?: (item: PaginationItemProps & UsePaginationItem) => JSX.Element;
  getItemAriaLabel?: (
    type: PaginationItemType,
    page: number | null,
    selected: boolean,
  ) => string;
}
export function Pagination(props: PaginationProps): JSX.Element {
  const p = useProps("MuiPagination", props);
  const pagination = usePagination(p);
  return (
    <Root
      name="MuiPagination"
      props={p}
      component="nav"
      aria-label={p["aria-label"] ?? "pagination navigation"}
    >
      <ul
        class={resolveMuiClassName("MuiPagination-ul")}
        style={{
          display: "flex",
          "flex-wrap": "wrap",
          "align-items": "center",
          "list-style": "none",
          padding: 0,
          margin: 0,
        }}
      >
        <For each={pagination.items}>
          {(item) => {
            const options = {
              ...item,
              color: p.color,
              shape: p.shape,
              size: p.size,
              variant: p.variant,
              "aria-label":
                p.getItemAriaLabel?.(item.type, item.page, item.selected) ??
                (item.type === "page"
                  ? `${item.selected ? "" : "Go to "}page ${item.page}`
                  : item.type.includes("ellipsis")
                    ? undefined
                    : `Go to ${item.type} page`),
            };
            return (
              <li>
                {p.renderItem ? (
                  p.renderItem(options)
                ) : (
                  <PaginationItem {...options} />
                )}
              </li>
            );
          }}
        </For>
      </ul>
    </Root>
  );
}
export interface StepperContextValue {
  activeStep: () => number;
  nonLinear: () => boolean;
  orientation: () => "horizontal" | "vertical";
  alternativeLabel: () => boolean;
  allocate: () => number;
  orderIndex: (node: HTMLElement | undefined, fallback: number) => number;
  count: () => number;
  connector: () => JSX.Element;
  totalSteps: () => number;
  isTabList: () => boolean;
}
export interface StepContextValue {
  index: () => number;
  active: () => boolean;
  completed: () => boolean;
  disabled: () => boolean;
  expanded: () => boolean;
  last: () => boolean;
  icon: () => JSX.Element;
}
export const StepperContext = /* @__PURE__ */ createContext<StepperContextValue | null>(null);
export const StepContext = /* @__PURE__ */ createContext<StepContextValue | null>(null);
export type StepperContextType = StepperContextValue;
export type StepContextType = StepContextValue;
export function useStepperContext(): StepperContextValue | null {
  return useContext(StepperContext);
}
export function useStepContext(): StepContextValue | null {
  return useContext(StepContext);
}
export interface StepperProps extends MuiProps {
  activeStep?: number;
  nonLinear?: boolean;
  alternativeLabel?: boolean;
  orientation?: "horizontal" | "vertical";
  connector?: JSX.Element;
}
export function Stepper(props: StepperProps): JSX.Element {
  const p = useProps("MuiStepper", props);
  let sequence = 0;
  let root!: HTMLElement;
  const orderIndex = createChildOrder(
    () => root,
    resolveMuiClassName(".MuiStep-root"),
    resolveMuiClassName(".MuiStepper-root"),
  );
  const [totalSteps, setTotalSteps] = createSignal(0);
  const [isTabList, setIsTabList] = createSignal(false);
  onSettled(() => {
    const collect = () => {
      setTotalSteps(
        Array.from(
          root.querySelectorAll(resolveMuiClassName(".MuiStep-root")),
        ).filter(
          (node) =>
            node.closest(resolveMuiClassName(".MuiStepper-root")) === root,
        ).length,
      );
      setIsTabList(
        !!root.querySelector(resolveMuiClassName(".MuiStepButton-root")),
      );
    };
    collect();
    const observer = new MutationObserver(collect);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  });
  return (
    <StepperContext
      value={{
        activeStep: () => p.activeStep ?? 0,
        nonLinear: () => !!p.nonLinear,
        orientation: () => p.orientation ?? "horizontal",
        alternativeLabel: () => !!p.alternativeLabel,
        allocate: () => sequence++,
        orderIndex,
        count: totalSteps,
        totalSteps,
        isTabList,
        connector: () =>
          p.connector === undefined ? <StepConnector /> : p.connector,
      }}
    >
      <Root
        name="MuiStepper"
        props={p}
        ref={(el: HTMLElement) => {
          root = el;
          setRef(
            untrack(() => p.ref),
            el,
          );
        }}
        role={isTabList() ? "tablist" : p.role}
        aria-orientation={
          isTabList() ? p.orientation ?? "horizontal" : undefined
        }
        onKeyDown={(e: KeyboardEvent) => {
          callHandler(p.onKeyDown, e);
          if (e.defaultPrevented || !isTabList()) return;
          const horizontal = p.orientation !== "vertical";
          const rtl = getComputedStyle(root).direction === "rtl";
          const previous = horizontal
            ? rtl
              ? "ArrowRight"
              : "ArrowLeft"
            : "ArrowUp";
          const next = horizontal
            ? rtl
              ? "ArrowLeft"
              : "ArrowRight"
            : "ArrowDown";
          if (![previous, next, "Home", "End"].includes(e.key)) return;
          const buttons = Array.from(
            root.querySelectorAll<HTMLButtonElement>(
              resolveMuiClassName(".MuiStepButton-root:not(:disabled)"),
            ),
          );
          if (!buttons.length) return;
          const current = buttons.indexOf(
            root.ownerDocument.activeElement as HTMLButtonElement,
          );
          const index =
            e.key === "Home"
              ? 0
              : e.key === "End"
                ? buttons.length - 1
                : (current + (e.key === previous ? -1 : 1) + buttons.length) %
                  buttons.length;
          e.preventDefault();
          for (const button of buttons) button.tabIndex = -1;
          buttons[index].tabIndex = 0;
          buttons[index].focus();
        }}
        styles={{
          display: "flex",
          flexDirection: p.orientation === "vertical" ? "column" : "row",
          alignItems: p.alternativeLabel
            ? "flex-start"
            : p.orientation === "vertical"
              ? "stretch"
              : "center",
        }}
      />
    </StepperContext>
  );
}
export interface StepProps extends MuiProps {
  index?: number;
  active?: boolean;
  completed?: boolean;
  disabled?: boolean;
  expanded?: boolean;
  last?: boolean;
}
export function Step(props: StepProps): JSX.Element {
  const p = useProps("MuiStep", props);
  const stepper = useContext(StepperContext);
  const allocated = stepper?.allocate() ?? 0;
  let root: HTMLElement | undefined;
  const index = () =>
    p.index ?? stepper?.orderIndex(root, allocated) ?? allocated;
  const context: StepContextValue = {
    index,
    icon: () => index() + 1,
    active: () => p.active ?? index() === stepper?.activeStep(),
    completed: () =>
      p.completed ??
      (!stepper?.nonLinear() && index() < (stepper?.activeStep() ?? 0)),
    disabled: () =>
      p.disabled ??
      (!stepper?.nonLinear() && index() > (stepper?.activeStep() ?? 0)),
    expanded: () => !!p.expanded,
    last: () => p.last ?? index() === (stepper?.count() ?? 1) - 1,
  };
  return (
    <StepContext value={context}>
      <Show when={index() > 0 && !stepper?.alternativeLabel()}>
        {stepper?.connector()}
      </Show>
      <Root
        name="MuiStep"
        props={p}
        ref={(el: HTMLElement) => {
          root = el;
          setRef(
            untrack(() => p.ref),
            el,
          );
        }}
        state={{
          completed: context.completed(),
          disabled: context.disabled(),
          active: context.active(),
        }}
        styles={{
          position: "relative",
          flex: stepper?.alternativeLabel() ? "1 1 0" : undefined,
          padding: stepper?.orientation() === "vertical" ? 0 : "0 8px",
        }}
      >
        <Show when={index() > 0 && stepper?.alternativeLabel()}>
          {stepper?.connector()}
        </Show>
        {p.children}
      </Root>
    </StepContext>
  );
}
export interface StepLabelProps extends MuiProps {
  error?: boolean;
  optional?: JSX.Element;
  icon?: JSX.Element;
  StepIconComponent?: (p: StepIconProps) => JSX.Element;
  StepIconProps?: StepIconProps;
}
export function StepLabel(props: StepLabelProps): JSX.Element {
  const p = useProps("MuiStepLabel", props);
  const stepper = useContext(StepperContext);
  const step = useContext(StepContext);
  const Icon = p.StepIconComponent ?? StepIcon;
  const icon = () => p.icon ?? step?.icon();
  return (
    <Root
      name="MuiStepLabel"
      props={p}
      component="span"
      state={{
        active: !!step?.active(),
        completed: !!step?.completed(),
        disabled: !!step?.disabled(),
        error: !!p.error,
      }}
      styles={(t) => ({
        display: "flex",
        flexDirection: stepper?.alternativeLabel() ? "column" : "row",
        alignItems: "center",
        color: p.error
          ? t.palette.error.main
          : step?.disabled()
            ? t.palette.text.disabled
            : t.palette.text.secondary,
        padding: stepper?.orientation() === "vertical" ? "8px 0" : 0,
      })}
    >
      <Show when={icon() != null}>
        <span
          class={resolveMuiClassName("MuiStepLabel-iconContainer")}
          style={{
            display: "flex",
            "padding-right": stepper?.alternativeLabel() ? 0 : "8px",
          }}
        >
          <Icon
            {...p.StepIconProps}
            icon={icon()}
            active={step?.active()}
            completed={step?.completed()}
            error={p.error}
          />
        </span>
      </Show>
      <span
        class={resolveMuiClassName("MuiStepLabel-labelContainer")}
        style={{
          width: "100%",
          "text-align": stepper?.alternativeLabel() ? "center" : undefined,
        }}
      >
        <Root
          name="MuiStepLabel"
          slot="label"
          ownerProps={p}
          component="span"
          styles={(t) => ({
            ...t.typography.body2,
            display: "block",
            color:
              step?.active() || step?.completed()
                ? t.palette.text.primary
                : "inherit",
            fontWeight: step?.active() || step?.completed() ? 500 : 400,
            marginTop: stepper?.alternativeLabel() ? 16 : undefined,
          })}
        >
          {p.children}
        </Root>
        {p.optional}
      </span>
    </Root>
  );
}
export interface StepIconProps extends MuiProps {
  active?: boolean;
  completed?: boolean;
  error?: boolean;
  icon?: JSX.Element;
}
export function StepIcon(props: StepIconProps): JSX.Element {
  const p = useProps("MuiStepIcon", props);
  return (
    <Show
      when={typeof p.icon === "number" || typeof p.icon === "string"}
      fallback={p.icon}
    >
      <Root
        name="MuiStepIcon"
        props={p}
        component="svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
        state={{
          active: !!p.active,
          completed: !!p.completed,
          error: !!p.error,
        }}
        styles={(t) => ({
          width: 24,
          height: 24,
          display: "block",
          flexShrink: 0,
          color: p.error
            ? t.palette.error.main
            : p.active || p.completed
              ? t.palette.primary.main
              : t.palette.text.disabled,
        })}
      >
        <Show
          when={p.error}
          fallback={
            <>
              <circle cx="12" cy="12" r="12" fill="currentColor" />
              <Show
                when={p.completed}
                fallback={
                  <text
                    x="12"
                    y="12"
                    text-anchor="middle"
                    dominant-baseline="central"
                    fill="white"
                    font-size="12"
                    font-family="Roboto,Helvetica,Arial,sans-serif"
                  >
                    {p.icon}
                  </text>
                }
              >
                <path
                  d="M6 12l4 4 8-8"
                  fill="none"
                  stroke="white"
                  stroke-width="2"
                />
              </Show>
            </>
          }
        >
          <path d="M12 2L1 21h22L12 2z" fill="currentColor" />
          <path d="M12 8v6m0 3v1" stroke="white" stroke-width="2" />
        </Show>
      </Root>
    </Show>
  );
}
export interface StepConnectorProps extends MuiProps {}
export function StepConnector(props: StepConnectorProps): JSX.Element {
  const p = useProps("MuiStepConnector", props);
  const stepper = useContext(StepperContext);
  const step = useContext(StepContext);
  const vertical = () => stepper?.orientation() === "vertical";
  return (
    <Root
      name="MuiStepConnector"
      props={p}
      state={{
        active: !!step?.active(),
        completed: !!step?.completed(),
        disabled: !!step?.disabled(),
      }}
      styles={{
        flex: "1 1 auto",
        marginLeft: vertical() ? 12 : undefined,
        position: stepper?.alternativeLabel() ? "absolute" : undefined,
        top: stepper?.alternativeLabel() ? 12 : undefined,
        left: stepper?.alternativeLabel() ? "calc(-50% + 20px)" : undefined,
        right: stepper?.alternativeLabel() ? "calc(50% + 20px)" : undefined,
      }}
    >
      <Root
        name="MuiStepConnector"
        slot="line"
        ownerProps={p}
        component="span"
        styles={(t) => ({
          display: "block",
          borderColor: t.palette.divider,
          borderLeftStyle: vertical() ? "solid" : undefined,
          borderLeftWidth: vertical() ? 1 : undefined,
          minHeight: vertical() ? 24 : undefined,
          borderTopStyle: vertical() ? undefined : "solid",
          borderTopWidth: vertical() ? undefined : 1,
        })}
      />
    </Root>
  );
}
export interface StepContentProps extends MuiProps {
  transitionDuration?: number | "auto";
  TransitionProps?: {
    unmountOnExit?: boolean;
  };
}
export function StepContent(props: StepContentProps): JSX.Element {
  const p = useProps("MuiStepContent", props);
  const step = useContext(StepContext);
  return (
    <Root
      name="MuiStepContent"
      props={p}
      styles={(t) => ({
        marginLeft: 12,
        paddingLeft: 20,
        paddingRight: 8,
        borderLeft: step?.last() ? undefined : `1px solid ${t.palette.divider}`,
      })}
    >
      <Collapse
        in={step?.active() || step?.expanded()}
        timeout={p.transitionDuration}
        unmountOnExit={p.TransitionProps?.unmountOnExit !== false}
      >
        {p.children}
      </Collapse>
    </Root>
  );
}
export interface StepButtonProps extends MuiProps {
  icon?: JSX.Element;
  optional?: JSX.Element;
  disabled?: boolean;
}
export function StepButton(props: StepButtonProps): JSX.Element {
  const p = useProps("MuiStepButton", props);
  const step = useContext(StepContext);
  const stepper = useContext(StepperContext);
  const content = children(() => p.children);
  const existingLabel = () => {
    const first = content.toArray()[0];
    return (
      typeof HTMLElement !== "undefined" &&
      first instanceof HTMLElement &&
      first.classList.contains(resolveMuiClassName("MuiStepLabel-root"))
    );
  };
  return (
    <Root
      name="MuiStepButton"
      props={p}
      component="button"
      type="button"
      disabled={p.disabled ?? step?.disabled()}
      role="tab"
      aria-selected={!!step?.active()}
      aria-posinset={step ? step.index() + 1 : undefined}
      aria-setsize={stepper?.totalSteps()}
      tabIndex={p.tabIndex ?? (step?.active() ? 0 : -1)}
      styles={(t) => ({
        display: "flex",
        alignItems: "center",
        textAlign: "left",
        border: 0,
        background: "transparent",
        color: "inherit",
        font: "inherit",
        cursor: "pointer",
        width: "100%",
        padding: stepper?.orientation() === "vertical" ? "8px 0" : "24px 16px",
        margin:
          stepper?.orientation() === "vertical" ? "-8px 0" : "-24px -16px",
        "&:focus-visible":
          t.focusVisible === false
            ? undefined
            : t.focusVisible ?? {
                outline: `2px solid ${t.palette.primary.main}`,
                outlineOffset: 2,
              },
      })}
    >
      <Show
        when={existingLabel()}
        fallback={
          <StepLabel icon={p.icon} optional={p.optional}>
            {content() as JSX.Element}
          </StepLabel>
        }
      >
        {content() as JSX.Element}
      </Show>
    </Root>
  );
}
export interface MobileStepperProps extends MuiProps {
  steps: number;
  activeStep?: number;
  backButton?: JSX.Element;
  nextButton?: JSX.Element;
  position?: "bottom" | "top" | "static";
  variant?: "text" | "dots" | "progress";
  LinearProgressProps?: MuiProps;
}
export function MobileStepper(props: MobileStepperProps): JSX.Element {
  const p = useProps("MuiMobileStepper", props);
  return (
    <Root
      name="MuiMobileStepper"
      props={p}
      styles={(t) => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 8,
        background: t.palette.background.default,
        position: p.position === "static" ? "static" : "fixed",
        top: p.position === "top" ? 0 : undefined,
        bottom: p.position !== "top" && p.position !== "static" ? 0 : undefined,
        left: 0,
        right: 0,
        zIndex: t.zIndex.mobileStepper,
      })}
    >
      {p.backButton}
      <Show
        when={p.variant === "text"}
        fallback={
          <Show
            when={p.variant === "progress"}
            fallback={
              <div
                class={resolveMuiClassName("MuiMobileStepper-dots")}
                style={{ display: "flex" }}
              >
                <For
                  each={Array.from(
                    { length: Math.max(0, p.steps) },
                    (_, i) => i,
                  )}
                >
                  {(i) => (
                    <Root
                      name="MuiMobileStepper"
                      slot="dot"
                      ownerProps={p}
                      state={{ active: i === (p.activeStep ?? 0) }}
                      styles={(t) => ({
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        margin: "0 2px",
                        background:
                          i === (p.activeStep ?? 0)
                            ? t.palette.primary.main
                            : t.palette.action.disabled,
                      })}
                    />
                  )}
                </For>
              </div>
            }
          >
            <Root
              name="MuiMobileStepper"
              slot="progress"
              ownerProps={p}
              props={p.LinearProgressProps}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={
                p.steps > 1 ? ((p.activeStep ?? 0) / (p.steps - 1)) * 100 : 100
              }
              styles={(t) => ({
                width: "50%",
                height: 4,
                overflow: "hidden",
                background: t.palette.primary.light,
              })}
            >
              <Root
                name="MuiMobileStepper"
                slot="bar"
                ownerProps={p}
                styles={(t) => ({
                  width: `${p.steps > 1 ? clamp(((p.activeStep ?? 0) / (p.steps - 1)) * 100, 0, 100) : 100}%`,
                  height: "100%",
                  background: t.palette.primary.main,
                  transition: "width 300ms",
                })}
              />
            </Root>
          </Show>
        }
      >
        {(p.activeStep ?? 0) + 1} / {p.steps}
      </Show>
      {p.nextButton}
    </Root>
  );
}
interface AccordionContextValue {
  expanded: () => boolean;
  disabled: () => boolean;
  toggle: (event: Event) => void;
  summaryId: string;
  regionId: string;
}
const AccordionContext = /* @__PURE__ */ createContext<AccordionContextValue | null>(null);
export interface AccordionProps extends MuiProps {
  expanded?: boolean;
  defaultExpanded?: boolean;
  disabled?: boolean;
  disableGutters?: boolean;
  square?: boolean;
  elevation?: number;
  onChange?: (event: Event, expanded: boolean) => void;
  TransitionProps?: {
    unmountOnExit?: boolean;
    timeout?: number | "auto";
  };
}
export function Accordion(props: AccordionProps): JSX.Element {
  const p = useProps("MuiAccordion", props);
  const [expanded, setExpanded] = useControlled(
    () => p.expanded,
    () => p.defaultExpanded ?? false,
  );
  const id = createUniqueId();
  const context: AccordionContextValue = {
    expanded,
    disabled: () => !!p.disabled,
    toggle: (event) => {
      if (!p.disabled) {
        const next = !expanded();
        setExpanded(next);
        p.onChange?.(event, next);
      }
    },
    summaryId: `${id}-summary`,
    regionId: `${id}-region`,
  };
  return (
    <AccordionContext value={context}>
      <AccordionBody props={p} context={context} />
    </AccordionContext>
  );
}
function AccordionBody(args: {
  props: AccordionProps;
  context: AccordionContextValue;
}): JSX.Element {
  const p = args.props;
  const context = args.context;
  // Resolve the summary and body within the provider so all descendants share state.
  const content = children(() => p.children);
  return (
    <Root
      name="MuiAccordion"
      props={p}
      state={{ expanded: context.expanded(), disabled: !!p.disabled }}
      styles={(t) => ({
        position: "relative",
        background: p.disabled
          ? t.palette.action.disabledBackground
          : t.palette.background.paper,
        color: t.palette.text.primary,
        borderRadius: p.square ? 0 : t.shape.borderRadius,
        boxShadow: t.shadows[p.elevation ?? 1],
        margin: context.expanded() && !p.disableGutters ? "16px 0" : 0,
        transition: "margin 150ms",
        "& + &::before": {
          content: '""',
          height: 1,
          background: t.palette.divider,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
        },
      })}
    >
      <Root
        name="MuiAccordion"
        ownerProps={p}
        slot="heading"
        component="h3"
        styles={{ margin: 0, font: "inherit" }}
      >
        {content.toArray()[0] as JSX.Element}
      </Root>
      <Collapse
        in={context.expanded()}
        timeout={p.TransitionProps?.timeout ?? "auto"}
        unmountOnExit={p.TransitionProps?.unmountOnExit}
      >
        <Root
          name="MuiAccordion"
          ownerProps={p}
          slot="region"
          role="region"
          id={context.regionId}
          aria-labelledby={context.summaryId}
        >
          {content.toArray().slice(1) as JSX.Element}
        </Root>
      </Collapse>
    </Root>
  );
}
export interface AccordionSummaryProps extends MuiProps {
  expandIcon?: JSX.Element;
  disabled?: boolean;
}
export function AccordionSummary(props: AccordionSummaryProps): JSX.Element {
  const p = useProps("MuiAccordionSummary", props);
  const context = useContext(AccordionContext);
  return (
    <Root
      name="MuiAccordionSummary"
      props={p}
      component="button"
      type="button"
      id={p.id ?? context?.summaryId}
      aria-controls={p["aria-controls"] ?? context?.regionId}
      aria-expanded={context?.expanded()}
      disabled={p.disabled || context?.disabled()}
      onFocus={p.onFocus}
      onBlur={p.onBlur}
      onKeyDown={p.onKeyDown}
      onClick={(e: MouseEvent) => {
        callHandler(p.onClick, e);
        if (!e.defaultPrevented) context?.toggle(e);
      }}
      state={{
        expanded: !!context?.expanded(),
        disabled: !!context?.disabled(),
      }}
      styles={(t) => ({
        display: "flex",
        alignItems: "center",
        width: "100%",
        padding: "0 16px",
        minHeight: context?.expanded() ? 64 : 48,
        border: 0,
        borderRadius: "inherit",
        background: "transparent",
        color: "inherit",
        font: "inherit",
        textAlign: "left",
        cursor: context?.disabled() ? "default" : "pointer",
        opacity: context?.disabled() ? 0.38 : 1,
        transition: "min-height 150ms",
        "&:focus-visible": { background: t.palette.action.selected },
      })}
    >
      <span
        class={resolveMuiClassName("MuiAccordionSummary-content")}
        style={{
          display: "flex",
          flex: "1 1 auto",
          margin: context?.expanded() ? "20px 0" : "12px 0",
        }}
      >
        {p.children}
      </span>
      <Show when={p.expandIcon}>
        <span
          class={resolveMuiClassName("MuiAccordionSummary-expandIconWrapper")}
          style={{
            display: "flex",
            transform: context?.expanded() ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 150ms",
          }}
        >
          {p.expandIcon}
        </span>
      </Show>
    </Root>
  );
}
export interface AccordionDetailsProps extends MuiProps {}
export interface AccordionActionsProps extends MuiProps {
  disableSpacing?: boolean;
}
export function AccordionDetails(props: AccordionDetailsProps): JSX.Element {
  const p = useProps("MuiAccordionDetails", props);
  return (
    <Root
      name="MuiAccordionDetails"
      props={p}
      styles={{ padding: "8px 16px 16px" }}
    />
  );
}
export function AccordionActions(props: AccordionActionsProps): JSX.Element {
  const p = useProps("MuiAccordionActions", props);
  return (
    <Root
      name="MuiAccordionActions"
      props={p}
      styles={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: 8,
        gap: p.disableSpacing ? 0 : 8,
      }}
    />
  );
}
interface SpeedDialContextValue {
  open: () => boolean;
  close: (event: Event) => void;
  direction: () => "up" | "down" | "left" | "right";
}
const SpeedDialContext = /* @__PURE__ */ createContext<SpeedDialContextValue | null>(null);
export interface SpeedDialProps extends Omit<MuiProps, "onClose"> {
  ariaLabel: string;
  icon?: JSX.Element;
  openIcon?: JSX.Element;
  open?: boolean;
  defaultOpen?: boolean;
  hidden?: boolean;
  direction?: "up" | "down" | "left" | "right";
  onOpen?: (event: Event, reason: "toggle" | "focus" | "mouseEnter") => void;
  onClose?: (
    event: Event,
    reason: "toggle" | "blur" | "mouseLeave" | "escapeKeyDown",
  ) => void;
  FabProps?: MuiProps & {
    color?: Color;
    size?: Size;
    disabled?: boolean;
  };
  transitionDuration?: number;
}
export function SpeedDial(props: SpeedDialProps): JSX.Element {
  const p = useProps("MuiSpeedDial", props);
  const [open, setOpen] = useControlled(
    () => p.open,
    () => p.defaultOpen ?? false,
  );
  let root!: HTMLElement;
  let fab!: HTMLButtonElement;
  const request = (event: Event, next: boolean, reason: string) => {
    if (next === open()) return;
    setOpen(next);
    if (next) p.onOpen?.(event, reason as "toggle" | "focus" | "mouseEnter");
    else
      p.onClose?.(
        event,
        reason as "toggle" | "blur" | "mouseLeave" | "escapeKeyDown",
      );
  };
  const direction = () => p.direction ?? "up";
  const id = createUniqueId();
  return (
    <SpeedDialContext
      value={{ open, direction, close: (e) => request(e, false, "toggle") }}
    >
      <Root
        name="MuiSpeedDial"
        props={omit(p, "onClose")}
        ref={(el: HTMLElement) => {
          root = el;
          setRef(
            untrack(() => p.ref),
            el,
          );
        }}
        onMouseEnter={(e: MouseEvent) => request(e, true, "mouseEnter")}
        onMouseLeave={(e: MouseEvent) => request(e, false, "mouseLeave")}
        onFocus={(e: FocusEvent) => request(e, true, "focus")}
        onBlur={(e: FocusEvent) => {
          if (!root.contains(e.relatedTarget as Node))
            request(e, false, "blur");
        }}
        onKeyDown={(e: KeyboardEvent) => {
          callHandler(p.onKeyDown, e);
          if (e.defaultPrevented) return;
          if (e.key === "Escape") {
            request(e, false, "escapeKeyDown");
            fab.focus();
          }
          if (
            [
              "ArrowUp",
              "ArrowDown",
              "ArrowLeft",
              "ArrowRight",
              "Home",
              "End",
            ].includes(e.key)
          ) {
            const nodes = Array.from(
              root.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
            );
            const current = nodes.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            const next =
              e.key === "Home"
                ? 0
                : e.key === "End"
                  ? nodes.length - 1
                  : (current +
                      (e.key ===
                      (direction() === "up"
                        ? "ArrowUp"
                        : direction() === "down"
                          ? "ArrowDown"
                          : direction() === "left"
                            ? "ArrowLeft"
                            : "ArrowRight")
                        ? 1
                        : -1) +
                      nodes.length) %
                    nodes.length;
            e.preventDefault();
            nodes[next]?.focus();
          }
        }}
        styles={(t) => ({
          display: p.hidden ? "none" : "flex",
          flexDirection:
            direction() === "up"
              ? "column-reverse"
              : direction() === "down"
                ? "column"
                : direction() === "left"
                  ? "row-reverse"
                  : "row",
          alignItems: "center",
          zIndex: t.zIndex.speedDial,
        })}
      >
        <Root
          name="MuiSpeedDial"
          slot="fab"
          ownerProps={p}
          props={p.FabProps}
          component="button"
          type="button"
          disabled={p.FabProps?.disabled}
          ref={(el: HTMLButtonElement) => {
            fab = el;
            setRef(
              untrack(() => p.FabProps?.ref),
              el,
            );
          }}
          aria-label={p.ariaLabel}
          aria-haspopup="menu"
          aria-expanded={open()}
          aria-controls={id}
          onClick={(e: MouseEvent) => {
            callHandler(p.FabProps?.onClick, e);
            if (!e.defaultPrevented) request(e, !open(), "toggle");
          }}
          styles={(t) => ({
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: 0,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: t.palette.primary.main,
            color: t.palette.primary.contrastText,
            boxShadow: t.shadows[6],
            cursor: "pointer",
            flexShrink: 0,
          })}
        >
          {open() && p.openIcon ? p.openIcon : p.icon ?? <SpeedDialIcon />}
        </Root>
        <div
          class={resolveMuiClassName("MuiSpeedDial-actions")}
          id={id}
          role="menu"
          aria-label={`${p.ariaLabel} actions`}
          style={{
            display: "flex",
            "flex-direction":
              direction() === "up"
                ? "column-reverse"
                : direction() === "down"
                  ? "column"
                  : direction() === "left"
                    ? "row-reverse"
                    : "row",
            padding: "8px",
            gap: "8px",
            visibility: open() ? "visible" : "hidden",
          }}
        >
          {p.children}
        </div>
      </Root>
    </SpeedDialContext>
  );
}
export interface SpeedDialActionProps extends MuiProps {
  icon?: JSX.Element;
  tooltipTitle?: JSX.Element;
  tooltipOpen?: boolean;
  tooltipPlacement?: "left" | "right" | "top" | "bottom";
  delay?: number;
  FabProps?: MuiProps & {
    disabled?: boolean;
  };
}
export function SpeedDialAction(props: SpeedDialActionProps): JSX.Element {
  const p = useProps("MuiSpeedDialAction", props);
  const reducedMotion = useReducedMotion();
  const context = useContext(SpeedDialContext);
  return (
    <Tooltip
      title={p.tooltipTitle}
      placement={
        p.tooltipPlacement ??
        (context?.direction() === "left" || context?.direction() === "right"
          ? "top"
          : "left")
      }
      open={p.tooltipOpen && context?.open() ? true : undefined}
    >
      <Root
        name="MuiSpeedDialAction"
        props={{ ...p, ...p.FabProps }}
        component="button"
        type="button"
        role="menuitem"
        tabindex={context?.open() ? 0 : -1}
        disabled={p.FabProps?.disabled}
        aria-label={
          typeof p.tooltipTitle === "string" ? p.tooltipTitle : undefined
        }
        onClick={(e: MouseEvent) => {
          callHandler(p.onClick, e);
          callHandler(p.FabProps?.onClick, e);
          if (!e.defaultPrevented) context?.close(e);
        }}
        styles={(t) => ({
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: 0,
          background: t.palette.background.paper,
          color: t.palette.text.primary,
          boxShadow: t.shadows[3],
          cursor: "pointer",
          transform: context?.open() ? "scale(1)" : "scale(0)",
          opacity: context?.open() ? 1 : 0,
          transition: reducedMotion()
            ? "none"
            : `${t.transitions.create("transform", { duration: t.transitions.duration.shorter, delay: p.delay ?? 0 })}, ${t.transitions.create("opacity", { duration: 800, delay: p.delay ?? 0 })}`,
        })}
      >
        {p.icon}
      </Root>
    </Tooltip>
  );
}
export interface SpeedDialIconProps extends MuiProps {
  icon?: JSX.Element;
  openIcon?: JSX.Element;
}
export function SpeedDialIcon(props: SpeedDialIconProps): JSX.Element {
  const p = useProps("MuiSpeedDialIcon", props);
  const context = useContext(SpeedDialContext);
  return (
    <Root
      name="MuiSpeedDialIcon"
      props={p}
      component="span"
      styles={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        fontSize: 28,
        transform:
          context?.open() && !p.openIcon ? "rotate(45deg)" : "rotate(0)",
        transition: "transform 200ms",
      }}
    >
      {context?.open() && p.openIcon ? p.openIcon : p.icon ?? "+"}
    </Root>
  );
}
