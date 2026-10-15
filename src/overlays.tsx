import { resolveMuiClassName } from "./class-names";
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onSettled,
  Show,
  omit,
  useContext,
  untrack,
} from "solid-js";
import { dynamic, Portal as WebPortal } from "@solidjs/web";
import type { JSX, ValidComponent } from "@solidjs/web";
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  arrow as floatingArrow,
} from "@floating-ui/dom";
import type { Placement, VirtualElement } from "@floating-ui/dom";
import { Root, useProps, callHandler, setRef, slotProps, clamp } from "./core";
import type { MuiProps } from "./core";
import { useTheme } from "./theme";
import { useReducedMotion } from "./motion";
import { SelectOptionRegistryContext } from "./input-select-context";
import type { CSSObject, Theme } from "./theme";
export interface PortalProps {
  children?: JSX.Element;
  container?: Element | null | (() => Element | null);
  disablePortal?: boolean;
  ref?: (node: Element) => void;
}
export function Portal(p: PortalProps): JSX.Element {
  const target = () =>
    typeof p.container === "function" ? p.container() : p.container;
  onSettled(() => {
    const node =
      target() ?? (typeof document !== "undefined" ? document.body : null);
    if (node)
      setRef(
        untrack(() => p.ref),
        node,
      );
  });
  return (
    <Show when={!p.disablePortal} fallback={p.children}>
      <WebPortal mount={target() ?? undefined}>{p.children}</WebPortal>
    </Show>
  );
}
export interface NoSsrProps {
  children?: JSX.Element;
  fallback?: JSX.Element;
  defer?: boolean;
}
export function NoSsr(p: NoSsrProps): JSX.Element {
  const [mounted, setMounted] = createSignal(false);
  onSettled(() => {
    if (p.defer) {
      const id = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(id);
    }
    setMounted(true);
  });
  return (
    <Show when={mounted()} fallback={p.fallback}>
      {p.children}
    </Show>
  );
}
export interface ClickAwayListenerProps {
  children?: JSX.Element;
  onClickAway: (event: MouseEvent | TouchEvent) => void;
  mouseEvent?:
    | "onClick"
    | "onMouseDown"
    | "onMouseUp"
    | "onPointerDown"
    | "onPointerUp"
    | false;
  touchEvent?: "onTouchStart" | "onTouchEnd" | false;
  disableReactTree?: boolean;
}
export function ClickAwayListener(p: ClickAwayListenerProps): JSX.Element {
  let root!: HTMLSpanElement;
  let insideEvent: Event | undefined;
  const recordInside = (event: Event) => {
    insideEvent = event;
  };
  createEffect(
    () => [p.mouseEvent ?? "onClick", p.touchEvent ?? "onTouchEnd"] as const,
    ([mouse, touch]) => {
      if (typeof document === "undefined") return;
      let ready = false;
      queueMicrotask(() => {
        ready = true;
      });
      let moved = false;
      const move = () => {
        moved = true;
      };
      const away = (event: Event) => {
        if (!ready || moved) {
          moved = false;
          return;
        }
        if (
          root &&
          (p.disableReactTree || insideEvent !== event) &&
          !event.composedPath().includes(root) &&
          document.documentElement.contains(event.target as Node)
        )
          p.onClickAway(event as MouseEvent | TouchEvent);
      };
      const m = mouse && mouse.slice(2).toLowerCase();
      const t = touch && touch.slice(2).toLowerCase();
      if (m) document.addEventListener(m, away);
      if (t) {
        document.addEventListener(t, away);
        document.addEventListener("touchmove", move);
      }
      return () => {
        if (m) document.removeEventListener(m, away);
        if (t) {
          document.removeEventListener(t, away);
          document.removeEventListener("touchmove", move);
        }
      };
    },
  );
  return (
    <span
      ref={root}
      style={{ display: "contents" }}
      onClick={recordInside}
      onMouseDown={recordInside}
      onMouseUp={recordInside}
      onPointerDown={recordInside}
      onPointerUp={recordInside}
      onTouchStart={recordInside}
      onTouchEnd={recordInside}
    >
      {p.children}
    </span>
  );
}
const TransitionBoundary = /* @__PURE__ */ createContext<{
  entering: () => void;
  exited: () => void;
} | null>(null);
export interface TransitionProps extends MuiProps {
  in?: boolean;
  /** Ignore theme.motion.reducedMotion and use the authored transition timing. */
  disablePrefersReducedMotion?: boolean;
  appear?: boolean;
  enter?: boolean;
  exit?: boolean;
  timeout?:
    | number
    | {
        appear?: number;
        enter?: number;
        exit?: number;
      }
    | "auto";
  easing?:
    | string
    | {
        enter?: string;
        exit?: string;
      };
  mountOnEnter?: boolean;
  unmountOnExit?: boolean;
  onEnter?: (node: HTMLElement, appearing: boolean) => void;
  onEntering?: (node: HTMLElement, appearing: boolean) => void;
  onEntered?: (node: HTMLElement, appearing: boolean) => void;
  onExit?: (node: HTMLElement) => void;
  onExiting?: (node: HTMLElement) => void;
  onExited?: (node: HTMLElement) => void;
  addEndListener?: (node: HTMLElement, done: () => void) => void;
}
export interface SlideProps extends TransitionProps {
  direction?: "left" | "right" | "up" | "down";
  container?: Element | (() => Element | null) | null;
}
export interface CollapseProps extends TransitionProps {
  collapsedSize?: number | string;
  orientation?: "horizontal" | "vertical";
}
export type FadeProps = TransitionProps;
export type GrowProps = TransitionProps;
export type ZoomProps = TransitionProps;
function Transition(
  p: TransitionProps & {
    kind: "Fade" | "Grow" | "Slide" | "Zoom" | "Collapse";
    direction?: SlideProps["direction"];
    container?: SlideProps["container"];
    collapsedSize?: number | string;
    orientation?: CollapseProps["orientation"];
  },
): JSX.Element {
  let node!: HTMLDivElement;
  let inner!: HTMLDivElement;
  let first = true;
  const initiallyAppearing = untrack(() => p.appear !== false);
  let enteredOnce = untrack(() => !!p.in);
  let appearingTransition = false;
  const theme = useTheme();
  const boundary = useContext(TransitionBoundary);
  const [autoDuration, setAutoDuration] = createSignal(250);
  const [phase, setPhase] = createSignal(
    untrack(() => (p.in && p.appear === false ? "entered" : "exited")),
  );
  const reducedMotion = useReducedMotion(() => !!p.disablePrefersReducedMotion);
  const [extent, setExtent] = createSignal("0px");
  const [slideDistance, setSlideDistance] = createSignal<string>();
  const automatic = () =>
    p.timeout === "auto" || (p.timeout === undefined && p.kind === "Grow");
  const duration = (reduce = reducedMotion()) =>
    reduce
      ? 0
      : typeof p.timeout === "number"
        ? p.timeout
        : typeof p.timeout === "object"
          ? p.timeout[
              p.in ? (appearingTransition ? "appear" : "enter") : "exit"
            ] ??
            p.timeout[p.in ? "enter" : "exit"] ??
            225
          : automatic()
            ? autoDuration()
            : p.kind === "Collapse"
              ? theme.transitions.duration.standard
              : p.in
                ? theme.transitions.duration.enteringScreen
                : theme.transitions.duration.leavingScreen;
  createEffect(
    () => !!p.in,
    (visible) => {
      const appearing = first;
      first = false;
      appearingTransition = appearing && visible;
      if (appearing && (!visible || !initiallyAppearing)) {
        if (visible) {
          setPhase("entered");
          boundary?.entering();
        }
        return;
      }
      let timer: ReturnType<typeof setTimeout> | undefined;
      let frame = 0;
      let disposed = false;
      // Completion timing belongs to this phase, even if the preference changes.
      const reduce = untrack(reducedMotion);
      const complete = () => {
        if (disposed) return;
        setPhase(visible ? "entered" : "exited");
        // Solid stages writes; lifecycle callbacks observe the committed phase.
        queueMicrotask(() => {
          if (disposed) return;
          if (visible) p.onEntered?.(node, appearing);
          else {
            p.onExited?.(node);
            boundary?.exited();
          }
        });
      };
      queueMicrotask(() => {
        if (disposed || !node) return;
        if (
          (visible && !appearing && p.enter === false) ||
          (!visible && p.exit === false)
        ) {
          if (visible) {
            enteredOnce = true;
            boundary?.entering();
          }
          complete();
          return;
        }
        node.getBoundingClientRect();
        if (visible) {
          enteredOnce = true;
          boundary?.entering();
          p.onEnter?.(node, appearing);
          setPhase("entering");
        } else {
          p.onExit?.(node);
          setPhase(p.kind === "Collapse" ? "exit-start" : "exiting");
        }
        if (p.kind === "Slide") {
          const saved = node.style.transform;
          node.style.transform = "none";
          const rect = node.getBoundingClientRect();
          const container =
            typeof p.container === "function" ? p.container() : p.container;
          const bounds = container?.getBoundingClientRect() ?? {
            top: 0,
            left: 0,
            right: window.innerWidth,
            bottom: window.innerHeight,
          };
          const direction = p.direction ?? "down";
          const distance =
            direction === "left"
              ? bounds.right - rect.left
              : direction === "right"
                ? bounds.left - rect.right
                : direction === "up"
                  ? bounds.bottom - rect.top
                  : bounds.top - rect.bottom;
          setSlideDistance(`${distance}px`);
          node.style.transform = saved;
        }
        if (inner) {
          const size =
            p.orientation === "horizontal"
              ? inner.scrollWidth
              : p.kind === "Collapse"
                ? inner.scrollHeight
                : (inner.firstElementChild as HTMLElement | null)
                    ?.offsetHeight ?? node.scrollHeight;
          setExtent(`${size}px`);
          if (automatic() && !reduce)
            setAutoDuration(theme.transitions.getAutoHeightDuration(size));
        }
        frame = requestAnimationFrame(() => {
          const scheduleCompletion = () => {
            if (disposed) return;
            if (visible) p.onEntering?.(node, appearing);
            else p.onExiting?.(node);
            let finished = false;
            const done = () => {
              if (disposed || finished) return;
              finished = true;
              if (timer) clearTimeout(timer);
              // A synchronous end listener must not erase the entering/exiting
              // phase before the DOM has committed it.
              queueMicrotask(complete);
            };
            p.addEndListener?.(node, done);
            if (!finished)
              timer = setTimeout(
                done,
                (visible ? p.enter !== false : p.exit !== false)
                  ? untrack(() => duration(reduce))
                  : 0,
              );
          };
          if (!visible) setPhase("exiting");
          queueMicrotask(scheduleCompletion);
        });
      });
      return () => {
        disposed = true;
        if (timer) clearTimeout(timer);
        cancelAnimationFrame(frame);
      };
    },
  );
  const styles = (): CSSObject => {
    const visible =
      phase() === "entered" ||
      phase() === "entering" ||
      phase() === "exit-start";
    const easing =
      typeof p.easing === "object"
        ? p.easing[p.in ? "enter" : "exit"]
        : p.easing;
    const milliseconds =
      (p.in && p.enter === false) || (!p.in && p.exit === false)
        ? 0
        : duration();
    const base: CSSObject = {
      transition: `opacity ${milliseconds}ms ${easing ?? "cubic-bezier(0.4, 0, 0.2, 1)"}, transform ${milliseconds}ms ${easing ?? "cubic-bezier(0.4, 0, 0.2, 1)"}`,
      visibility:
        phase() === "exited" &&
        !p.in &&
        (p.kind !== "Collapse" ||
          p.collapsedSize == null ||
          p.collapsedSize === 0 ||
          p.collapsedSize === "0px")
          ? "hidden"
          : undefined,
    };
    if (p.kind === "Fade") base.opacity = visible ? 1 : 0;
    if (p.kind === "Grow" || p.kind === "Zoom") {
      base.opacity = visible ? 1 : 0;
      base.transform = visible
        ? "scale(1)"
        : p.kind === "Grow"
          ? "scale(0.75,0.5625)"
          : "scale(0)";
    }
    if (p.kind === "Slide") {
      const d = p.direction ?? "down";
      base.transform = visible
        ? "translate(0,0)"
        : `translate${d === "left" || d === "right" ? "X" : "Y"}(${slideDistance() ?? `${d === "left" || d === "up" ? "" : "-"}100${d === "left" || d === "right" ? "vw" : "vh"}`})`;
    }
    if (p.kind === "Collapse") {
      const horizontal = p.orientation === "horizontal";
      const collapsed =
        typeof p.collapsedSize === "number"
          ? `${p.collapsedSize}px`
          : p.collapsedSize ?? "0px";
      base[horizontal ? "width" : "height"] =
        phase() === "entered" ? "auto" : visible ? extent() : collapsed;
      base.overflow = phase() === "entered" ? "visible" : "hidden";
      base.transition = `${horizontal ? "width" : "height"} ${milliseconds}ms ${easing ?? "ease"}`;
      base.minHeight = horizontal ? undefined : collapsed;
    }
    return base;
  };
  return (
    <Show
      when={
        p.in ||
        !(
          (p.mountOnEnter && !enteredOnce) ||
          (p.unmountOnExit && phase() === "exited")
        )
      }
    >
      <Root
        name={`Mui${p.kind}`}
        props={omit(p, "disablePrefersReducedMotion", "kind")}
        ref={(el: HTMLDivElement) => {
          node = el;
          setRef(
            untrack(() => p.ref),
            el,
          );
        }}
        styles={styles()}
        style={
          reducedMotion()
            ? { "transition-duration": "0ms", "transition-delay": "0ms" }
            : undefined
        }
      >
        <div
          ref={inner}
          style={{
            display:
              p.kind === "Collapse"
                ? p.orientation === "horizontal"
                  ? "flex"
                  : "block"
                : "contents",
            width:
              p.kind === "Collapse" && p.orientation === "horizontal"
                ? "max-content"
                : undefined,
          }}
        >
          <TransitionBoundary value={null}>{p.children}</TransitionBoundary>
        </div>
      </Root>
    </Show>
  );
}
export const Fade = (p: FadeProps) => (
  <Transition {...useProps("MuiFade", p)} kind="Fade" />
);
export const Grow = (p: GrowProps) => (
  <Transition {...useProps("MuiGrow", p)} kind="Grow" />
);
export const Zoom = (p: ZoomProps) => (
  <Transition {...useProps("MuiZoom", p)} kind="Zoom" />
);
export const Slide = (p: SlideProps) => (
  <Transition {...useProps("MuiSlide", p)} kind="Slide" />
);
export const Collapse = (p: CollapseProps) => (
  <Transition {...useProps("MuiCollapse", p)} kind="Collapse" />
);
export interface ModalOwnerState {
  open: boolean;
  exited?: boolean;
}
export interface ModalRootProps extends MuiProps {
  ownerState?: ModalOwnerState;
  ownerProps?: MuiProps;
  _name?: string;
}
const modalRootStyles = (theme: Theme, visible: boolean): CSSObject => ({
  position: "fixed",
  inset: 0,
  zIndex: theme.zIndex.modal,
  visibility: visible ? "visible" : "hidden",
});
/** The styled root used by Modal; focus and lifecycle management live in Modal. */
export function ModalRoot(p: ModalRootProps): JSX.Element {
  return (
    <Root
      name={p._name ?? "MuiModal"}
      props={omit(p, "ownerState", "ownerProps", "_name")}
      ownerProps={p.ownerProps}
      state={p.ownerState ? { ...p.ownerState } : undefined}
      styles={(t) =>
        modalRootStyles(
          t,
          p.ownerState?.open !== false || p.ownerState?.exited === false,
        )
      }
    />
  );
}
export interface BackdropRootProps extends MuiProps {
  invisible?: boolean;
  ownerState?: {
    invisible?: boolean;
    open?: boolean;
  };
  ownerProps?: MuiProps;
}
const backdropStyles = (invisible: boolean): CSSObject => ({
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: invisible ? "transparent" : "rgba(0,0,0,.5)",
  WebkitTapHighlightColor: "transparent",
});
export function BackdropRoot(p: BackdropRootProps): JSX.Element {
  return (
    <Root
      name="MuiBackdrop"
      props={omit(p, "ownerState", "ownerProps")}
      ownerProps={p.ownerProps}
      state={p.ownerState}
      aria-hidden="true"
      styles={backdropStyles(p.invisible ?? p.ownerState?.invisible ?? false)}
    />
  );
}
export interface BackdropProps extends MuiProps {
  open: boolean;
  invisible?: boolean;
  transitionDuration?: TransitionProps["timeout"];
}
export function Backdrop(props: BackdropProps): JSX.Element {
  const p = useProps("MuiBackdrop", props);
  return (
    <Fade in={p.open} timeout={p.transitionDuration}>
      <BackdropRoot {...p} ownerProps={p} />
    </Fade>
  );
}
export type ModalCloseReason = "backdropClick" | "escapeKeyDown";
export interface ModalProps extends Omit<MuiProps, "onClose"> {
  open: boolean;
  onClose?: (event: Event, reason: ModalCloseReason) => void;
  container?: PortalProps["container"];
  disablePortal?: boolean;
  disableAutoFocus?: boolean;
  disableEnforceFocus?: boolean;
  disableRestoreFocus?: boolean;
  disableScrollLock?: boolean;
  disableEscapeKeyDown?: boolean;
  hideBackdrop?: boolean;
  keepMounted?: boolean;
  closeAfterTransition?: boolean;
  onTransitionEnter?: () => void;
  onTransitionExited?: () => void;
  BackdropComponent?: ValidComponent;
  BackdropProps?: Partial<BackdropProps>;
}
export interface ManagedModalProps {
  disableScrollLock?: boolean;
}
export interface ManagedModal {
  mount: Element;
  modalRef: Element;
}
export function ariaHidden(element: Element, hide: boolean): void {
  if (hide) element.setAttribute("aria-hidden", "true");
  else element.removeAttribute("aria-hidden");
}
/** Coordinates modal stacking, sibling accessibility and container scroll locks. */
export class ModalManager {
  private readonly modals: ManagedModal[] = [];
  private readonly entries = new Map<
    ManagedModal,
    {
      container: HTMLElement;
      locked: boolean;
      mounted: boolean;
    }
  >();
  private readonly locks = new Map<
    HTMLElement,
    {
      count: number;
      overflow: string;
      overflowX: string;
      overflowY: string;
      paddingRight: string;
      fixed: {
        element: HTMLElement;
        paddingRight: string;
      }[];
    }
  >();
  private readonly hidden = new Map<Element, string | null>();
  private syncAccessibility(): void {
    const desired = new Set<Element>();
    const containers = new Map<HTMLElement, ManagedModal>();
    for (const modal of this.modals) {
      const entry = this.entries.get(modal);
      if (entry) containers.set(entry.container, modal);
    }
    for (const [container, last] of containers) {
      const keep =
        this.topModal && container.contains(this.topModal.modalRef)
          ? this.topModal.modalRef
          : last.modalRef;
      const collect = (parent: Element) => {
        for (const element of parent.children) {
          // These elements cannot carry aria-hidden under the HTML ARIA rules.
          if (
            element === keep ||
            [
              "TEMPLATE",
              "SCRIPT",
              "STYLE",
              "LINK",
              "MAP",
              "META",
              "NOSCRIPT",
              "PICTURE",
              "COL",
              "COLGROUP",
              "PARAM",
              "SLOT",
              "SOURCE",
              "TRACK",
            ].includes(element.tagName) ||
            (element.tagName === "INPUT" &&
              element.getAttribute("type") === "hidden")
          )
            continue;
          if (element.contains(keep)) collect(element);
          else desired.add(element);
        }
      };
      collect(container);
    }
    for (const [element, previous] of this.hidden) {
      if (!desired.has(element)) {
        if (previous === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", previous);
        this.hidden.delete(element);
      }
    }
    for (const element of desired) {
      if (!this.hidden.has(element))
        this.hidden.set(element, element.getAttribute("aria-hidden"));
      ariaHidden(element, true);
    }
    if (this.topModal) ariaHidden(this.topModal.modalRef, false);
  }
  get topModal(): ManagedModal | undefined {
    return this.modals.at(-1);
  }
  get size(): number {
    return this.modals.length;
  }
  add(modal: ManagedModal, container: HTMLElement): number {
    const existing = this.modals.indexOf(modal);
    if (existing >= 0) return existing;
    this.modals.push(modal);
    this.entries.set(modal, { container, locked: false, mounted: false });
    this.syncAccessibility();
    return this.modals.length - 1;
  }
  mount(modal: ManagedModal, props: ManagedModalProps = {}): void {
    const entry = this.entries.get(modal);
    if (!entry || entry.mounted) return;
    entry.mounted = true;
    if (props.disableScrollLock) return;
    entry.locked = true;
    const container = entry.container;
    const existing = this.locks.get(container);
    if (existing) {
      existing.count++;
      return;
    }
    const doc = container.ownerDocument;
    const view = doc.defaultView;
    const width =
      container === doc.body
        ? (view?.innerWidth ?? doc.documentElement.clientWidth) -
          doc.documentElement.clientWidth
        : container.offsetWidth - container.clientWidth;
    const fixed =
      container === doc.body
        ? Array.from(doc.querySelectorAll<HTMLElement>(".mui-fixed")).map(
            (element) => ({
              element,
              paddingRight: element.style.paddingRight,
            }),
          )
        : [];
    this.locks.set(container, {
      count: 1,
      overflow: container.style.overflow,
      overflowX: container.style.overflowX,
      overflowY: container.style.overflowY,
      paddingRight: container.style.paddingRight,
      fixed,
    });
    container.style.overflow = "hidden";
    if (width > 0 && view) {
      container.style.paddingRight = `${(parseFloat(view.getComputedStyle(container).paddingRight) || 0) + width}px`;
      for (const { element } of fixed)
        element.style.paddingRight = `${(parseFloat(view.getComputedStyle(element).paddingRight) || 0) + width}px`;
    }
  }
  remove(modal: ManagedModal, ariaHiddenState = true): number {
    const index = this.modals.indexOf(modal);
    if (index < 0) return -1;
    this.modals.splice(index, 1);
    const entry = this.entries.get(modal);
    if (entry) {
      if (entry.locked) {
        const lock = this.locks.get(entry.container);
        if (lock && --lock.count === 0) {
          entry.container.style.overflow = lock.overflow;
          entry.container.style.overflowX = lock.overflowX;
          entry.container.style.overflowY = lock.overflowY;
          entry.container.style.paddingRight = lock.paddingRight;
          for (const { element, paddingRight } of lock.fixed)
            element.style.paddingRight = paddingRight;
          this.locks.delete(entry.container);
        }
      }
      this.entries.delete(modal);
    }
    this.syncAccessibility();
    if (!this.topModal || !modal.modalRef.contains(this.topModal.modalRef))
      ariaHidden(modal.modalRef, ariaHiddenState);
    if (this.topModal) ariaHidden(this.topModal.modalRef, false);
    return index;
  }
  isTopModal(modal: ManagedModal): boolean {
    return this.topModal === modal;
  }
}
const modalManager = new ModalManager();
const focusable = (root: HTMLElement) =>
  Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])',
    ),
  )
    .filter(
      (el) =>
        !el.hasAttribute("disabled") &&
        el.tabIndex >= 0 &&
        !el.hidden &&
        !el.closest('[aria-hidden="true"],[inert]') &&
        el.getClientRects().length > 0,
    )
    .sort(
      (a, b) =>
        (a.tabIndex > 0 ? a.tabIndex : Infinity) -
        (b.tabIndex > 0 ? b.tabIndex : Infinity),
    );
export function Modal(props: ModalProps): JSX.Element {
  return <ModalImpl {...props} />;
}
function ModalImpl(
  props: ModalProps & {
    ownerName?: string;
    transitionDuration?: TransitionProps["timeout"];
    TransitionProps?: Partial<TransitionProps>;
  },
): JSX.Element {
  const p = useProps("MuiModal", props);
  const theme = useTheme();
  const [exited, setExited] = createSignal(untrack(() => !p.open));
  let root!: HTMLElement;
  let content!: HTMLDivElement;
  const active = createMemo(
    () => p.open || (!!p.closeAfterTransition && !exited()),
  );
  // A custom transition may not participate in our internal boundary; bound its retention.
  createEffect(
    () => {
      const configured = p as ModalProps & {
        transitionDuration?: TransitionProps["timeout"];
        TransitionProps?: Partial<TransitionProps>;
      };
      const transition =
        configured.TransitionProps?.timeout ?? configured.transitionDuration;
      return {
        open: p.open,
        close: p.closeAfterTransition,
        delay:
          (typeof transition === "number"
            ? transition
            : typeof transition === "object"
              ? transition.exit ?? 225
              : transition === "auto"
                ? theme.transitions.getAutoHeightDuration(
                    typeof window === "undefined" ? 0 : window.innerHeight,
                  )
                : 300) + 100,
      };
    },
    ({ open, close, delay }) => {
      if (open || !close) return;
      const id = setTimeout(() => {
        if (!untrack(exited)) {
          setExited(true);
          untrack(() => p.onTransitionExited?.());
        }
      }, delay);
      return () => clearTimeout(id);
    },
  );
  createEffect(
    () => ({
      open: active(),
      lock: !p.disableScrollLock,
      restore: !p.disableRestoreFocus,
    }),
    ({ open, lock, restore }) => {
      if (!open || typeof document === "undefined") return;
      const previous = document.activeElement as HTMLElement | null;
      let active = true;
      let initialized = false;
      let managed: ManagedModal | undefined;
      const top = () => !!managed && modalManager.isTopModal(managed);
      const focus = () => (focusable(content)[0] ?? content)?.focus();
      const enforce = (e: FocusEvent) => {
        if (
          !p.disableEnforceFocus &&
          top() &&
          content &&
          !content.contains(e.target as Node)
        )
          focus();
      };
      const keydown = (e: KeyboardEvent) => {
        if (!top()) return;
        callHandler(p.onKeyDown, e);
        if (e.defaultPrevented) return;
        if (e.key === "Escape" && !p.disableEscapeKeyDown) {
          e.stopPropagation();
          p.onClose?.(e, "escapeKeyDown");
        }
        if (e.key === "Tab" && !p.disableEnforceFocus) {
          const nodes = focusable(content);
          const first = nodes[0] ?? content;
          const last = nodes.at(-1) ?? content;
          if (
            !nodes.length ||
            document.activeElement === content ||
            (e.shiftKey
              ? document.activeElement === first
              : document.activeElement === last)
          ) {
            e.preventDefault();
            (e.shiftKey ? last : first).focus();
          }
        }
      };
      queueMicrotask(() => {
        if (!active || !root) return;
        initialized = true;
        const body = root.ownerDocument.body;
        if (!p.disableAutoFocus && !content.contains(document.activeElement))
          previous?.blur();
        managed = { mount: root.parentElement ?? body, modalRef: root };
        const requested =
          typeof p.container === "function" ? p.container() : p.container;
        modalManager.add(
          managed,
          requested instanceof HTMLElement ? requested : body,
        );
        modalManager.mount(managed, { disableScrollLock: !lock });
        if (!p.disableAutoFocus && !content.contains(document.activeElement))
          focus();
        document.addEventListener("keydown", keydown);
        document.addEventListener("focusin", enforce);
      });
      return () => {
        active = false;
        if (!initialized) return;
        if (managed) modalManager.remove(managed);
        document.removeEventListener("keydown", keydown);
        document.removeEventListener("focusin", enforce);
        if (restore && previous?.isConnected) previous.focus();
      };
    },
  );
  return (
    <TransitionBoundary
      value={{
        entering: () => {
          setExited(false);
          untrack(() => p.onTransitionEnter?.());
        },
        exited: () => {
          setExited(true);
          untrack(() => p.onTransitionExited?.());
        },
      }}
    >
      <Show
        when={p.open || p.keepMounted || (p.closeAfterTransition && !exited())}
      >
        <Portal container={p.container} disablePortal={p.disablePortal}>
          <Root
            name={p.ownerName ?? "MuiModal"}
            props={omit(p, "onClose", "ownerName", "onKeyDown")}
            ref={(el: HTMLElement) => {
              root = el;
              setRef(
                untrack(() => p.ref),
                el,
              );
            }}
            role="presentation"
            onFocus={p.onFocus}
            onBlur={p.onBlur}
            styles={(t) =>
              modalRootStyles(
                t,
                p.open || (!!p.closeAfterTransition && !exited()),
              )
            }
          >
            <Show when={!p.hideBackdrop}>
              <TransitionBoundary value={null}>
                <Fade
                  in={p.open}
                  timeout={
                    p.BackdropProps?.transitionDuration ?? p.transitionDuration
                  }
                  style={{ position: "absolute", inset: "0" }}
                >
                  <Root
                    name={p.ownerName ?? "MuiModal"}
                    slot="backdrop"
                    ownerProps={p}
                    props={p.BackdropProps}
                    component={p.BackdropComponent ?? "div"}
                    aria-hidden="true"
                    open={p.open}
                    onClick={(e: MouseEvent) => {
                      callHandler(p.BackdropProps?.onClick, e);
                      if (
                        e.target === e.currentTarget &&
                        modalManager.topModal?.modalRef === root
                      )
                        p.onClose?.(e, "backdropClick");
                    }}
                    styles={{
                      position: "absolute",
                      inset: 0,
                      background: p.BackdropProps?.invisible
                        ? "transparent"
                        : "rgba(0,0,0,.5)",
                    }}
                  />
                </Fade>
              </TransitionBoundary>
            </Show>
            <Root
              name="MuiModal"
              slot="content"
              ownerProps={p}
              ref={(el: HTMLDivElement) => {
                content = el;
              }}
              tabindex={-1}
              styles={{
                outline: "none",
                position: "relative",
                height: "100%",
                pointerEvents: "none",
                "& > *": { pointerEvents: "auto" },
              }}
            >
              {p.children}
            </Root>
          </Root>
        </Portal>
      </Show>
    </TransitionBoundary>
  );
}
export interface DialogProps extends ModalProps {
  fullScreen?: boolean;
  fullWidth?: boolean;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false;
  scroll?: "body" | "paper";
  PaperProps?: MuiProps;
  transitionDuration?: TransitionProps["timeout"];
  TransitionComponent?: ValidComponent;
  TransitionProps?: Partial<TransitionProps>;
}
export function Dialog(props: DialogProps): JSX.Element {
  const p = useProps("MuiDialog", props);
  let backdropStarted = false;
  const outsidePaper = (event: MouseEvent) =>
    !(event.currentTarget as HTMLElement)
      .querySelector(resolveMuiClassName(".MuiDialog-paper"))
      ?.contains(event.target as Node);
  const transition = createMemo(() =>
    slotProps(p, "transition", {
      open: p.open,
      fullScreen: !!p.fullScreen,
      fullWidth: !!p.fullWidth,
    }),
  );
  const TransitionTag = dynamic(
    () => p.TransitionComponent ?? p.slots?.transition ?? Fade,
  );
  return (
    <ModalImpl
      {...p}
      ownerName="MuiDialog"
      TransitionProps={{ ...p.TransitionProps, ...transition() }}
      closeAfterTransition={p.closeAfterTransition ?? true}
    >
      <Root
        name="MuiDialog"
        slot="container"
        ownerProps={p}
        onMouseDown={(e: MouseEvent) => {
          backdropStarted = outsidePaper(e);
        }}
        onClick={(e: MouseEvent) => {
          if (backdropStarted && outsidePaper(e))
            p.onClose?.(e, "backdropClick");
        }}
        styles={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflowY: p.scroll === "body" ? "auto" : "hidden",
        }}
      >
        <TransitionTag
          in={p.open}
          timeout={p.transitionDuration ?? 225}
          {...p.TransitionProps}
          {...transition()}
        >
          <Root
            name="MuiDialog"
            slot="paper"
            ownerProps={p}
            props={p.PaperProps}
            role="dialog"
            aria-modal="true"
            aria-labelledby={p["aria-labelledby"]}
            aria-describedby={p["aria-describedby"]}
            styles={(t) => ({
              background: t.palette.background.paper,
              color: t.palette.text.primary,
              borderRadius: p.fullScreen ? 0 : t.shape.borderRadius,
              boxShadow: t.shadows[24],
              margin: p.fullScreen ? 0 : 32,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              position: "relative",
              width: p.fullScreen
                ? "100vw"
                : p.fullWidth
                  ? "calc(100vw - 64px)"
                  : undefined,
              height: p.fullScreen ? "100vh" : undefined,
              maxHeight: p.fullScreen ? "100vh" : "calc(100vh - 64px)",
              maxWidth: p.fullScreen
                ? "none"
                : p.maxWidth === false
                  ? "calc(100vw - 64px)"
                  : `min(${{ xs: 444, sm: 600, md: 900, lg: 1200, xl: 1536 }[p.maxWidth ?? "sm"]}px, calc(100vw - 64px))`,
            })}
          >
            {p.children}
          </Root>
        </TransitionTag>
      </Root>
    </ModalImpl>
  );
}
export interface DialogTitleProps extends MuiProps {}
export interface DialogContentProps extends MuiProps {
  dividers?: boolean;
}
export interface DialogContentTextProps extends MuiProps {}
export interface DialogActionsProps extends MuiProps {
  disableSpacing?: boolean;
}
export const DialogTitle = (props: DialogTitleProps) => {
  const p = useProps("MuiDialogTitle", props);
  return (
    <Root
      name="MuiDialogTitle"
      props={p}
      component="h2"
      styles={(t) => ({
        ...t.typography.h6,
        margin: 0,
        padding: "16px 24px",
        flex: "0 0 auto",
      })}
    />
  );
};
export const DialogContent = (props: DialogContentProps) => {
  const p = useProps("MuiDialogContent", props);
  return (
    <Root
      name="MuiDialogContent"
      props={p}
      styles={(t) => ({
        flex: "1 1 auto",
        overflowY: "auto",
        padding: p.dividers ? "16px 24px" : "20px 24px",
        borderTop: p.dividers ? `1px solid ${t.palette.divider}` : undefined,
        borderBottom: p.dividers ? `1px solid ${t.palette.divider}` : undefined,
      })}
    />
  );
};
export const DialogContentText = (props: DialogContentTextProps) => {
  const p = useProps("MuiDialogContentText", props);
  return (
    <Root
      name="MuiDialogContentText"
      props={p}
      component="p"
      styles={(t) => ({
        ...t.typography.body1,
        color: t.palette.text.secondary,
        margin: "0 0 16px",
      })}
    />
  );
};
export const DialogActions = (props: DialogActionsProps) => {
  const p = useProps("MuiDialogActions", props);
  return (
    <Root
      name="MuiDialogActions"
      props={p}
      styles={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: 8,
        flex: "0 0 auto",
        gap: p.disableSpacing ? 0 : 8,
      }}
    />
  );
};
export interface DrawerProps extends Partial<ModalProps> {
  anchor?: "left" | "right" | "top" | "bottom";
  variant?: "permanent" | "persistent" | "temporary";
  elevation?: number;
  PaperProps?: MuiProps;
  ModalProps?: Partial<ModalProps>;
  SlideProps?: Partial<SlideProps>;
  transitionDuration?: TransitionProps["timeout"];
}
export function Drawer(props: DrawerProps): JSX.Element {
  const p = useProps("MuiDrawer", props);
  const TransitionTag = dynamic(() => p.slots?.transition ?? Slide);
  const anchor = () => p.anchor ?? "left";
  const horizontal = () => anchor() === "left" || anchor() === "right";
  const transition = createMemo(() =>
    slotProps(p, "transition", {
      open: !!p.open,
      anchor: anchor(),
      variant: p.variant ?? "temporary",
    }),
  );
  const paper = () => (
    <Root
      name="MuiDrawer"
      slot="paper"
      ownerProps={p}
      props={p.PaperProps}
      styles={(t) => ({
        position: "fixed",
        pointerEvents: "auto",
        [anchor()]: 0,
        top: horizontal() ? 0 : undefined,
        left: !horizontal() ? 0 : undefined,
        bottom: horizontal() ? 0 : undefined,
        right: !horizontal() ? 0 : undefined,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        background: t.palette.background.paper,
        color: t.palette.text.primary,
        zIndex: t.zIndex.drawer,
        boxShadow:
          p.variant === "permanent" || p.variant === "persistent"
            ? "none"
            : t.shadows[p.elevation ?? 16],
        borderRight:
          anchor() === "left" && (p.variant ?? "temporary") !== "temporary"
            ? `1px solid ${t.palette.divider}`
            : undefined,
      })}
    >
      {p.children}
    </Root>
  );
  return (
    <Show
      when={p.variant === "permanent"}
      fallback={
        <Show
          when={p.variant === "persistent"}
          fallback={
            <ModalImpl
              {...p}
              {...p.ModalProps}
              ownerName="MuiDrawer"
              TransitionProps={{ ...p.SlideProps, ...transition() }}
              closeAfterTransition={p.ModalProps?.closeAfterTransition ?? true}
              open={!!p.open}
            >
              <TransitionTag
                in={p.open}
                direction={
                  anchor() === "left"
                    ? "right"
                    : anchor() === "right"
                      ? "left"
                      : anchor() === "top"
                        ? "down"
                        : "up"
                }
                timeout={p.transitionDuration}
                {...p.SlideProps}
                {...transition()}
                style={{
                  height: "100%",
                  width: "100%",
                  "pointer-events": "none",
                  ...p.SlideProps?.style,
                  ...(transition().style as JSX.CSSProperties),
                }}
              >
                {paper()}
              </TransitionTag>
            </ModalImpl>
          }
        >
          <Root
            name="MuiDrawer"
            ownerProps={p}
            props={omit(
              p,
              "children",
              "PaperProps",
              "ModalProps",
              "SlideProps",
              "onClose",
            )}
            slot="docked"
            styles={{ flexShrink: 0 }}
          >
            <TransitionTag
              in={p.open}
              unmountOnExit
              direction={
                anchor() === "left"
                  ? "right"
                  : anchor() === "right"
                    ? "left"
                    : anchor() === "top"
                      ? "down"
                      : "up"
              }
              timeout={p.transitionDuration}
              {...p.SlideProps}
              {...transition()}
              style={{
                height: "100%",
                width: "100%",
                "pointer-events": "none",
                ...p.SlideProps?.style,
                ...(transition().style as JSX.CSSProperties),
              }}
            >
              {paper()}
            </TransitionTag>
          </Root>
        </Show>
      }
    >
      <Root
        name="MuiDrawer"
        ownerProps={p}
        props={omit(
          p,
          "children",
          "PaperProps",
          "ModalProps",
          "SlideProps",
          "onClose",
        )}
        slot="docked"
        styles={{ flexShrink: 0 }}
      >
        {paper()}
      </Root>
    </Show>
  );
}
export interface SwipeableDrawerProps
  extends Omit<DrawerProps, "open" | "onClose"> {
  open: boolean;
  allowSwipeInChildren?:
    | boolean
    | ((
        event: TouchEvent,
        swipeArea: HTMLDivElement,
        paper: HTMLDivElement,
      ) => boolean);
  disableBackdropTransition?: boolean;
  onOpen: (event: Event) => void;
  onClose: (event: Event, reason?: ModalCloseReason) => void;
  disableSwipeToOpen?: boolean;
  swipeAreaWidth?: number;
  hysteresis?: number;
  minFlingVelocity?: number;
  disableDiscovery?: boolean;
}
interface DrawerGesture {
  offset: number;
  extent: number;
  active: boolean;
}
export function SwipeableDrawer(p: SwipeableDrawerProps): JSX.Element {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  let paper: HTMLElement | undefined;
  const [paperElement, setPaperElement] = createSignal<HTMLElement | null>(
    null,
  );
  let swipeArea!: HTMLDivElement;
  let completedSwipe = false;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  const [gesture, setGesture] = createSignal<DrawerGesture | null>(null);
  const horizontal = () => p.anchor !== "top" && p.anchor !== "bottom";
  const reversed = () => p.anchor === "right" || p.anchor === "bottom";
  const swipeDisabled = () =>
    p.disableSwipeToOpen ??
    (typeof navigator !== "undefined" &&
      /iPad|iPhone|iPod/.test(navigator.userAgent));
  createEffect(
    () => p.open,
    (open) => {
      if (open) completedSwipe = false;
    },
  );
  const duration = (open = p.open) =>
    reducedMotion()
      ? 0
      : typeof p.transitionDuration === "number"
        ? p.transitionDuration
        : typeof p.transitionDuration === "object"
          ? p.transitionDuration[open ? "enter" : "exit"] ??
            theme.transitions.duration[
              open ? "enteringScreen" : "leavingScreen"
            ]
          : theme.transitions.duration[
              open ? "enteringScreen" : "leavingScreen"
            ];
  let tracking: {
    fromOpen: boolean;
    start: number;
    cross: number;
    time: number;
    extent: number;
    delta: number;
    axis: boolean;
  } | null = null;
  const transform = () => {
    const current = gesture();
    return current
      ? `translate${horizontal() ? "X" : "Y"}(${current.offset * (reversed() ? -1 : 1)}px)`
      : p.PaperProps?.style?.transform;
  };
  createEffect(
    () => ({
      active: !!gesture(),
      horizontal: horizontal(),
      paper: paperElement(),
    }),
    ({ active, horizontal: isHorizontal, paper: measuredPaper }) => {
      if (!active || !measuredPaper) return;
      let disposed = false;
      queueMicrotask(() => {
        if (disposed || !tracking || !measuredPaper.isConnected) return;
        const size = isHorizontal
          ? measuredPaper.getBoundingClientRect().width
          : measuredPaper.getBoundingClientRect().height;
        if (size > 0) {
          tracking.extent = size;
          // A spread prop source can invalidate this effect during a drag even
          // when its axis and measured node are unchanged. Only correct an
          // estimated extent; repeated measurement must not republish the drag.
          if (untrack(gesture)?.extent === size) return;
          setGesture({
            offset: clamp(
              (tracking.fromOpen ? 0 : -size) + tracking.delta,
              -size,
              0,
            ),
            extent: size,
            active: true,
          });
        }
      });
      return () => {
        disposed = true;
      };
    },
  );
  onSettled(() => {
    const coordinate = (touch: Touch) =>
      horizontal() ? touch.clientX : touch.clientY;
    const cross = (touch: Touch) =>
      horizontal() ? touch.clientY : touch.clientX;
    // Native listeners take an imperative snapshot of the controlled settings
    // for each gesture event; tracking belongs to geometry and rendered styles.
    const begin = (event: TouchEvent) =>
      untrack(() => {
        if (
          event.touches.length !== 1 ||
          (event.target instanceof Element &&
            event.target.closest(
              'input,textarea,select,[contenteditable="true"]',
            )) ||
          p.variant === "permanent" ||
          p.variant === "persistent"
        )
          return;
        if (
          p.open &&
          paper &&
          modalManager.size &&
          !modalManager.topModal?.modalRef.contains(paper)
        )
          return;
        if (!p.open && modalManager.size) return;
        if (
          !p.open &&
          paper?.contains(event.target as Node) &&
          !(typeof p.allowSwipeInChildren === "function"
            ? p.allowSwipeInChildren(event, swipeArea, paper as HTMLDivElement)
            : p.allowSwipeInChildren)
        )
          return;
        const touch = event.touches[0];
        const start = coordinate(touch);
        const viewport = horizontal() ? window.innerWidth : window.innerHeight;
        if (
          !p.open &&
          (swipeDisabled() ||
            (reversed() ? viewport - start : start) > (p.swipeAreaWidth ?? 20))
        )
          return;
        clearTimeout(settleTimer);
        completedSwipe = false;
        const extent = paper?.isConnected
          ? horizontal()
            ? paper.getBoundingClientRect().width
            : paper.getBoundingClientRect().height
          : horizontal()
            ? Math.min(360, window.innerWidth * 0.8)
            : 250;
        tracking = {
          fromOpen: !!p.open,
          start,
          cross: cross(touch),
          time: performance.now(),
          extent: Math.max(1, extent),
          delta: 0,
          axis: false,
        };
        if (!p.open && !p.disableDiscovery)
          setGesture({
            offset: -tracking.extent + (p.swipeAreaWidth ?? 20),
            extent: tracking.extent,
            active: true,
          });
      });
    const move = (event: TouchEvent) =>
      untrack(() => {
        if (!tracking || event.touches.length !== 1) return;
        const touch = event.touches[0];
        const delta =
          (coordinate(touch) - tracking.start) * (reversed() ? -1 : 1);
        if (!tracking.axis && Math.abs(delta) > 5) {
          if (Math.abs(cross(touch) - tracking.cross) > Math.abs(delta)) {
            tracking = null;
            setGesture(null);
            return;
          }
          tracking.axis = true;
        }
        if (!tracking.axis) return;
        tracking.delta = delta;
        if (event.cancelable) event.preventDefault();
        setGesture({
          offset: clamp(
            (tracking.fromOpen ? 0 : -tracking.extent) + delta,
            -tracking.extent,
            0,
          ),
          extent: tracking.extent,
          active: true,
        });
      });
    const finish = (event: TouchEvent) =>
      untrack(() => {
        if (!tracking) return;
        const state = tracking;
        tracking = null;
        const raw = clamp(
          (state.fromOpen ? 0 : -state.extent) + state.delta,
          -state.extent,
          0,
        );
        const velocity =
          (state.delta / Math.max(1, performance.now() - state.time)) * 1000;
        const target =
          event.type === "touchcancel" || !state.axis
            ? state.fromOpen
            : Math.abs(velocity) > (p.minFlingVelocity ?? 450)
              ? velocity > 0
              : state.fromOpen
                ? -raw / state.extent <= (p.hysteresis ?? 0.52)
                : 1 + raw / state.extent > (p.hysteresis ?? 0.52);
        completedSwipe = !target;
        setGesture({
          offset: target ? 0 : -state.extent,
          extent: state.extent,
          active: false,
        });
        if (target !== state.fromOpen) {
          if (target) p.onOpen(event);
          else p.onClose(event);
        }
        // Controlled open writes are staged, so time the intended destination.
        settleTimer = setTimeout(() => setGesture(null), duration(target));
      });
    document.addEventListener("touchstart", begin, { passive: true });
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", finish);
    document.addEventListener("touchcancel", finish);
    return () => {
      clearTimeout(settleTimer);
      document.removeEventListener("touchstart", begin);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", finish);
      document.removeEventListener("touchcancel", finish);
    };
  });
  return (
    <>
      <Drawer
        {...p}
        open={!!p.open || !!gesture()}
        onClose={(event, reason) => {
          tracking = null;
          clearTimeout(settleTimer);
          setGesture(null);
          p.onClose(event, reason);
        }}
        ModalProps={{
          ...p.ModalProps,
          disableAutoFocus: !!gesture() || p.ModalProps?.disableAutoFocus,
          disableEnforceFocus: !!gesture() || p.ModalProps?.disableEnforceFocus,
        }}
        BackdropProps={{
          ...p.BackdropProps,
          style: {
            ...p.BackdropProps?.style,
            opacity: gesture()
              ? 1 + gesture()!.offset / gesture()!.extent
              : undefined,
            transition:
              p.disableBackdropTransition || gesture()?.active
                ? "none"
                : `opacity ${duration()}ms ease`,
          },
        }}
        PaperProps={{
          ...p.PaperProps,
          ref: (node: HTMLElement) => {
            paper = node;
            setPaperElement(node);
            setRef(
              untrack(() => p.PaperProps?.ref),
              node,
            );
          },
          style: {
            ...p.PaperProps?.style,
            transform: transform(),
            transition: gesture()?.active
              ? "none"
              : `transform ${duration()}ms ease`,
          },
        }}
        SlideProps={{
          ...p.SlideProps,
          appear: gesture() ? false : p.SlideProps?.appear,
          enter: gesture() ? false : p.SlideProps?.enter,
          exit:
            (completedSwipe && !p.open) || gesture()
              ? false
              : p.SlideProps?.exit,
          style: {
            ...p.SlideProps?.style,
            transform: gesture() ? "none" : p.SlideProps?.style?.transform,
          },
        }}
      />
      <Show
        when={
          !swipeDisabled() &&
          (p.variant === undefined || p.variant === "temporary")
        }
      >
        <Root
          name="MuiSwipeableDrawer"
          slot="swipeArea"
          ownerProps={p}
          ref={(el: HTMLDivElement) => {
            swipeArea = el;
          }}
          aria-hidden="true"
          styles={(theme) => ({
            position: "fixed",
            [p.anchor ?? "left"]: 0,
            top: horizontal() ? 0 : undefined,
            left: horizontal() ? undefined : 0,
            bottom: horizontal() ? 0 : undefined,
            right: horizontal() ? undefined : 0,
            width: horizontal() ? p.swipeAreaWidth ?? 20 : "100%",
            height: horizontal() ? "100%" : p.swipeAreaWidth ?? 20,
            zIndex: theme.zIndex.drawer - 1,
            // Document touch listeners recognize the edge by coordinates, so
            // this visual discovery area must not cover underlying controls.
            pointerEvents: "none",
          })}
        />
      </Show>
    </>
  );
}
export type Anchor =
  | Element
  | VirtualElement
  | null
  | (() => Element | VirtualElement | null);
export interface PopperProps extends Omit<MuiProps, "children"> {
  open: boolean;
  anchorEl?: Anchor;
  placement?: Placement;
  disablePortal?: boolean;
  container?: PortalProps["container"];
  keepMounted?: boolean;
  transition?: boolean;
  modifiers?: readonly {
    name: string;
    enabled?: boolean;
    options?: Record<string, unknown>;
  }[];
  popperOptions?: {
    placement?: Placement;
    strategy?: "absolute" | "fixed";
  };
  popperRef?: (instance: {
    update: () => Promise<void>;
    forceUpdate: () => void;
  }) => void;
  children?:
    | JSX.Element
    | ((props: {
        placement: Placement;
        TransitionProps: {
          in: boolean;
          onEnter: () => void;
          onExited: () => void;
        };
      }) => JSX.Element);
}
export function Popper(props: PopperProps): JSX.Element {
  const p = useProps("MuiPopper", props);
  let root!: HTMLElement;
  let generation = 0;
  const [position, setPosition] = createSignal(
    untrack(() => ({
      x: 0,
      y: 0,
      placement: (p.placement ?? "bottom") as Placement,
      strategy: "fixed" as "absolute" | "fixed",
    })),
  );
  const anchor = () =>
    typeof p.anchorEl === "function" ? p.anchorEl() : p.anchorEl;
  const renderProps = {
    get placement() {
      return position().placement;
    },
    TransitionProps: {
      get in() {
        return p.open;
      },
      onEnter: () => {},
      onExited: () => {},
    },
  };
  createEffect(
    () => ({
      open: p.open,
      anchor: anchor(),
      placement: p.placement ?? p.popperOptions?.placement ?? "bottom",
      strategy: p.popperOptions?.strategy ?? ("fixed" as const),
      modifiers: p.modifiers,
    }),
    ({ open, anchor, placement, strategy, modifiers }) => {
      if (!open || !anchor) return;
      let disposed = false;
      let cleanup: (() => void) | undefined;
      const current = ++generation;
      const update = async () => {
        if (!root || disposed) return;
        const distance = modifiers?.find((m) => m.name === "offset")?.options
          ?.offset;
        const gap = Array.isArray(distance) ? Number(distance[1]) || 0 : 0;
        const arrowElement = root.querySelector<HTMLElement>(
          resolveMuiClassName(".MuiTooltip-arrow,[data-popper-arrow]"),
        );
        const middleware = [
          offset(gap),
          ...(modifiers?.some((m) => m.name === "flip" && m.enabled === false)
            ? []
            : [flip()]),
          ...(modifiers?.some(
            (m) => m.name === "preventOverflow" && m.enabled === false,
          )
            ? []
            : [shift({ padding: 8 })]),
          ...(arrowElement
            ? [floatingArrow({ element: arrowElement, padding: 4 })]
            : []),
        ];
        const result = await computePosition(anchor, root, {
          placement,
          strategy,
          middleware,
        });
        if (!disposed && current === generation) {
          setPosition(result);
          const arrow = result.middlewareData.arrow;
          if (arrowElement && arrow) {
            const side = result.placement.split("-")[0];
            arrowElement.style.left = arrow.x == null ? "" : `${arrow.x}px`;
            arrowElement.style.top = arrow.y == null ? "" : `${arrow.y}px`;
            arrowElement.style.right = "";
            arrowElement.style.bottom = "";
            arrowElement.style[
              side === "top"
                ? "bottom"
                : side === "bottom"
                  ? "top"
                  : side === "left"
                    ? "right"
                    : "left"
            ] = "-4px";
          }
        }
      };
      queueMicrotask(() => {
        if (disposed || !root) return;
        cleanup = autoUpdate(anchor, root, update);
        setRef(p.popperRef, {
          update,
          forceUpdate: () => {
            void update();
          },
        });
      });
      return () => {
        disposed = true;
        cleanup?.();
      };
    },
  );
  return (
    <Show when={p.open || p.keepMounted}>
      <Portal container={p.container} disablePortal={p.disablePortal}>
        <Root
          name="MuiPopper"
          props={omit(p, "children")}
          ref={(el: HTMLElement) => {
            root = el;
            setRef(
              untrack(() => p.ref),
              el,
            );
          }}
          data-popper-placement={position().placement}
          style={{
            position: position().strategy,
            left: `${position().x}px`,
            top: `${position().y}px`,
            visibility: p.open ? "visible" : "hidden",
          }}
          styles={(t) => ({ zIndex: t.zIndex.modal })}
        >
          {typeof p.children === "function"
            ? p.children(renderProps)
            : p.children}
        </Root>
      </Portal>
    </Show>
  );
}
export interface PopoverOrigin {
  vertical: "top" | "center" | "bottom" | number;
  horizontal: "left" | "center" | "right" | number;
}
export interface PopoverProps extends ModalProps {
  anchorEl?: Anchor;
  anchorPosition?: {
    top: number;
    left: number;
  };
  anchorReference?: "anchorEl" | "anchorPosition" | "none";
  anchorOrigin?: PopoverOrigin;
  transformOrigin?: PopoverOrigin;
  marginThreshold?: number | null;
  elevation?: number;
  PaperProps?: MuiProps;
  transitionDuration?: TransitionProps["timeout"];
  action?: (api: { updatePosition: () => void }) => void;
  TransitionProps?: Partial<TransitionProps>;
  TransitionComponent?: ValidComponent;
}
export function getOffsetTop(
  rect: {
    height: number;
  },
  vertical: PopoverOrigin["vertical"],
): number {
  return typeof vertical === "number"
    ? vertical
    : vertical === "center"
      ? rect.height / 2
      : vertical === "bottom"
        ? rect.height
        : 0;
}
export function getOffsetLeft(
  rect: {
    width: number;
  },
  horizontal: PopoverOrigin["horizontal"],
): number {
  return typeof horizontal === "number"
    ? horizontal
    : horizontal === "center"
      ? rect.width / 2
      : horizontal === "right"
        ? rect.width
        : 0;
}
export interface PopoverPaperProps extends MuiProps {
  elevation?: number;
  ownerProps?: MuiProps;
  ownerState?: Partial<PopoverProps>;
}
const popoverPaperStyles = (
  t: Theme,
  elevation: number,
  menu = false,
): CSSObject => ({
  position: "relative",
  pointerEvents: "auto",
  overflowY: "auto",
  overflowX: "hidden",
  minWidth: 16,
  minHeight: 16,
  maxWidth: "calc(100vw - 32px)",
  maxHeight: menu ? "calc(100vh - 96px)" : "calc(100vh - 32px)",
  background: t.palette.background.paper,
  color: t.palette.text.primary,
  borderRadius: t.shape.borderRadius,
  boxShadow: t.shadows[elevation],
  outline: "none",
  ...(menu ? { WebkitOverflowScrolling: "touch" } : {}),
});
export function PopoverPaper(p: PopoverPaperProps): JSX.Element {
  return (
    <Root
      name="MuiPopover"
      slot="paper"
      props={omit(p, "ownerState", "ownerProps")}
      ownerProps={p.ownerProps}
      state={p.ownerState ? { ...p.ownerState } : undefined}
      styles={(t) =>
        popoverPaperStyles(t, p.elevation ?? p.ownerState?.elevation ?? 8)
      }
    />
  );
}
export function MenuPaper(p: PopoverPaperProps): JSX.Element {
  return (
    <Root
      name="MuiMenu"
      slot="paper"
      props={omit(p, "ownerState", "ownerProps")}
      ownerProps={p.ownerProps}
      state={p.ownerState ? { ...p.ownerState } : undefined}
      styles={(t) =>
        popoverPaperStyles(t, p.elevation ?? p.ownerState?.elevation ?? 8, true)
      }
    />
  );
}
export function PopoverRoot(
  p: ModalProps & {
    transitionDuration?: TransitionProps["timeout"];
    TransitionProps?: Partial<TransitionProps>;
    _name?: string;
  },
): JSX.Element {
  return (
    <ModalImpl {...omit(p, "_name")} ownerName={p._name ?? "MuiPopover"} />
  );
}
export function Popover(props: PopoverProps): JSX.Element {
  return <PopoverImpl {...props} />;
}
function PopoverImpl(
  props: PopoverProps & {
    _name?: string;
  },
): JSX.Element {
  const p = useProps("MuiPopover", props);
  const transition = createMemo(() =>
    slotProps(p, "transition", { open: p.open }),
  );
  const TransitionTag = dynamic(
    () => p.TransitionComponent ?? p.slots?.transition ?? Grow,
  );
  let paper!: HTMLElement;
  const [geometry, setGeometry] = createSignal({
    top: 0,
    left: 0,
    origin: "0px 0px",
  });
  const update = () => {
    if (!paper || p.anchorReference === "none") return;
    const anchor = typeof p.anchorEl === "function" ? p.anchorEl() : p.anchorEl;
    const rect =
      anchor?.getBoundingClientRect() ?? document.body.getBoundingClientRect();
    const ao = p.anchorOrigin ?? { vertical: "top", horizontal: "left" };
    const to = p.transformOrigin ?? { vertical: "top", horizontal: "left" };
    let x = getOffsetLeft({ width: paper.offsetWidth }, to.horizontal);
    let y = getOffsetTop({ height: paper.offsetHeight }, to.vertical);
    let top =
      (p.anchorReference === "anchorPosition"
        ? p.anchorPosition?.top ?? 0
        : rect.top + getOffsetTop(rect, ao.vertical)) - y;
    let left =
      (p.anchorReference === "anchorPosition"
        ? p.anchorPosition?.left ?? 0
        : rect.left + getOffsetLeft(rect, ao.horizontal)) - x;
    if (p.marginThreshold !== null) {
      const margin = p.marginThreshold ?? 16;
      const adjustedTop = Math.max(
        margin,
        Math.min(top, window.innerHeight - paper.offsetHeight - margin),
      );
      const adjustedLeft = Math.max(
        margin,
        Math.min(left, window.innerWidth - paper.offsetWidth - margin),
      );
      y += top - adjustedTop;
      x += left - adjustedLeft;
      top = adjustedTop;
      left = adjustedLeft;
    }
    setGeometry({ top, left, origin: `${x}px ${y}px` });
  };
  createEffect(
    () => ({
      open: p.open,
      anchor: typeof p.anchorEl === "function" ? p.anchorEl() : p.anchorEl,
      position: p.anchorPosition,
      origin: p.anchorOrigin,
      transform: p.transformOrigin,
    }),
    ({ open }) => {
      if (!open) return;
      let active = true;
      let observer: ResizeObserver | undefined;
      queueMicrotask(() => {
        if (!active) return;
        update();
        p.action?.({ updatePosition: update });
        if (paper) {
          observer = new ResizeObserver(update);
          observer.observe(paper);
        }
      });
      window.addEventListener("resize", update);
      window.addEventListener("scroll", update, true);
      return () => {
        active = false;
        observer?.disconnect();
        window.removeEventListener("resize", update);
        window.removeEventListener("scroll", update, true);
      };
    },
  );
  return (
    <PopoverRoot
      {...p}
      _name={p._name}
      TransitionProps={{ ...p.TransitionProps, ...transition() }}
      transitionDuration={p.transitionDuration ?? "auto"}
      closeAfterTransition={p.closeAfterTransition ?? true}
      BackdropProps={{ ...p.BackdropProps, invisible: true }}
    >
      <TransitionTag
        in={p.open}
        timeout={p.transitionDuration ?? "auto"}
        {...p.TransitionProps}
        {...transition()}
        style={{
          position: "absolute",
          top: `${geometry().top}px`,
          left: `${geometry().left}px`,
          width: "max-content",
          "transform-origin": geometry().origin,
          "pointer-events": "none",
          ...p.TransitionProps?.style,
          ...(transition().style as JSX.CSSProperties),
        }}
      >
        <Root
          name={p._name ?? "MuiPopover"}
          slot="paper"
          ownerProps={p}
          props={p.PaperProps}
          ref={(el: HTMLElement) => {
            paper = el;
            setRef(
              untrack(() => p.PaperProps?.ref),
              el,
            );
          }}
          styles={(t) =>
            popoverPaperStyles(t, p.elevation ?? 8, p._name === "MuiMenu")
          }
        >
          {p.children}
        </Root>
      </TransitionTag>
    </PopoverRoot>
  );
}
const MenuListContext = /* @__PURE__ */ createContext<{
  dense: () => boolean;
} | null>(null);
export interface MenuListProps extends MuiProps {
  autoFocus?: boolean;
  autoFocusItem?: boolean;
  disabledItemsFocusable?: boolean;
  disableListWrap?: boolean;
  variant?: "menu" | "selectedMenu";
  dense?: boolean;
  disablePadding?: boolean;
}
function moveMenuFocus(
  list: HTMLElement,
  key: string,
  wrap = true,
  disabledFocusable = false,
): void {
  const items = Array.from(
    list.querySelectorAll<HTMLElement>('[role="menuitem"],[role="option"]'),
  ).filter(
    (el) => disabledFocusable || el.getAttribute("aria-disabled") !== "true",
  );
  if (!items.length) return;
  const current = items.indexOf(document.activeElement as HTMLElement);
  const next =
    key === "Home"
      ? 0
      : key === "End"
        ? items.length - 1
        : key === "ArrowDown"
          ? current + 1
          : current - 1;
  items[
    wrap
      ? (next + items.length) % items.length
      : Math.max(0, Math.min(items.length - 1, next))
  ]?.focus();
}
export function MenuList(props: MenuListProps): JSX.Element {
  const p = useProps("MuiMenuList", props);
  let root!: HTMLElement;
  let search = "";
  let last = 0;
  createEffect(
    () => [p.autoFocusItem, p.autoFocus, p.variant],
    () => {
      queueMicrotask(() => {
        if (!root) return;
        if (p.autoFocusItem)
          (
            root.querySelector<HTMLElement>(
              p.variant !== "menu"
                ? '.Mui-selected:not([aria-disabled="true"])'
                : '[role="menuitem"]:not([aria-disabled="true"])',
            ) ??
            root.querySelector<HTMLElement>(
              '[role="menuitem"]:not([aria-disabled="true"])',
            )
          )?.focus();
        else if (p.autoFocus) root.focus();
      });
    },
  );
  return (
    <MenuListContext value={{ dense: () => !!p.dense }}>
      <Root
        name="MuiMenuList"
        props={p}
        component="ul"
        role="menu"
        tabindex={p.autoFocus ? 0 : -1}
        ref={(el: HTMLElement) => {
          root = el;
          setRef(
            untrack(() => p.ref),
            el,
          );
        }}
        onKeyDown={(e: KeyboardEvent) => {
          callHandler(p.onKeyDown, e);
          if (e.defaultPrevented) return;
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
            e.preventDefault();
            moveMenuFocus(
              root,
              e.key,
              !p.disableListWrap,
              p.disabledItemsFocusable,
            );
          } else if (
            e.key.length === 1 &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey
          ) {
            const now = performance.now();
            search =
              now - last > 500
                ? e.key.toLowerCase()
                : search + e.key.toLowerCase();
            last = now;
            const items = Array.from(
              root.querySelectorAll<HTMLElement>(
                '[role="menuitem"],[role="option"]',
              ),
            ).filter((el) => el.getAttribute("aria-disabled") !== "true");
            const current = items.indexOf(
              document.activeElement as HTMLElement,
            );
            const match = [
              ...items.slice(current + 1),
              ...items.slice(0, current + 1),
            ].find((el) =>
              el.textContent
                ?.trim()
                .toLowerCase()
                .startsWith(
                  search.split("").every((c) => c === search[0])
                    ? search[0]
                    : search,
                ),
            );
            if (match) {
              e.preventDefault();
              match.focus();
            }
          }
        }}
        styles={{
          listStyle: "none",
          margin: 0,
          padding: p.disablePadding ? 0 : "8px 0",
          outline: 0,
        }}
      />
    </MenuListContext>
  );
}
export interface MenuItemProps extends MuiProps {
  selected?: boolean;
  disabled?: boolean;
  dense?: boolean;
  divider?: boolean;
  disableGutters?: boolean;
  value?: unknown;
  autoFocus?: boolean;
}
export function MenuItem(props: MenuItemProps): JSX.Element {
  const p = useProps("MuiMenuItem", props);
  const registry = useContext(SelectOptionRegistryContext);
  registry?.register({
    value: () => p.value,
    label: () => p.children,
    disabled: () => !!p.disabled,
  });
  if (registry?.collectOnly) return null;
  const list = useContext(MenuListContext);
  const dense = () => p.dense ?? list?.dense() ?? false;
  const [role, setRole] = createSignal<"menuitem" | "option">("menuitem");
  let root!: HTMLElement;
  createEffect(
    () => p.value,
    (value) => {
      if (root)
        (
          root as HTMLElement & {
            __muiValue?: unknown;
          }
        ).__muiValue = value;
    },
  );
  onSettled(() => {
    if (root.closest('[role="listbox"]')) setRole("option");
    if (p.autoFocus) root.focus();
  });
  return (
    <Root
      name="MuiMenuItem"
      props={p}
      component="li"
      role={p.role ?? role()}
      tabindex={p.disabled ? -1 : p.tabindex ?? -1}
      aria-disabled={p.disabled || undefined}
      onFocus={p.onFocus}
      onBlur={p.onBlur}
      data-value={p.value == null ? undefined : String(p.value)}
      ref={(el: HTMLElement) => {
        root = el;
        (
          el as HTMLElement & {
            __muiValue?: unknown;
          }
        ).__muiValue = untrack(() => p.value);
        setRef(
          untrack(() => p.ref),
          el,
        );
      }}
      onClick={(e: MouseEvent) => {
        if (p.disabled) {
          e.preventDefault();
          e.stopPropagation();
        } else callHandler(p.onClick, e);
      }}
      onKeyDown={(e: KeyboardEvent) => {
        callHandler(p.onKeyDown, e);
        if (
          !p.disabled &&
          (e.key === " " || e.key === "Enter") &&
          !e.defaultPrevented
        ) {
          e.preventDefault();
          root.click();
        }
      }}
      state={{ selected: !!p.selected, disabled: !!p.disabled }}
      styles={(t) => ({
        ...t.typography.body1,
        display: "flex",
        alignItems: "center",
        minHeight: dense() ? 32 : 48,
        padding: p.disableGutters ? "6px 0" : "6px 16px",
        fontSize: dense() ? "0.875rem" : undefined,
        whiteSpace: "nowrap",
        position: "relative",
        cursor: p.disabled ? "default" : "pointer",
        outline: 0,
        userSelect: "none",
        background: p.selected ? t.palette.action.selected : undefined,
        opacity: p.disabled ? 0.38 : 1,
        borderBottom: p.divider ? `1px solid ${t.palette.divider}` : undefined,
        "&:hover": {
          background: p.disabled ? undefined : t.palette.action.hover,
        },
        "&:focus-visible": { background: t.palette.action.selected },
      })}
    />
  );
}
export interface MenuProps extends PopoverProps {
  autoFocus?: boolean;
  disableAutoFocusItem?: boolean;
  MenuListProps?: MenuListProps;
  variant?: MenuListProps["variant"];
  onClose?: (event: Event, reason: ModalCloseReason | "tabKeyDown") => void;
}
export function Menu(props: MenuProps): JSX.Element {
  const p = useProps("MuiMenu", props);
  return (
    <PopoverImpl
      _name="MuiMenu"
      {...p}
      anchorOrigin={
        p.anchorOrigin ?? { vertical: "bottom", horizontal: "left" }
      }
      transformOrigin={
        p.transformOrigin ?? { vertical: "top", horizontal: "left" }
      }
    >
      <MenuList
        {...p.MenuListProps}
        slots={{
          ...p.MenuListProps?.slots,
          root: p.slots?.list ?? p.MenuListProps?.slots?.root,
        }}
        slotProps={{
          ...p.MenuListProps?.slotProps,
          root: slotProps(p, "list"),
        }}
        autoFocus={p.autoFocus !== false && !p.disableAutoFocusItem}
        autoFocusItem={
          p.open && p.autoFocus !== false && !p.disableAutoFocusItem
        }
        variant={p.variant}
        onKeyDown={(e: KeyboardEvent) => {
          callHandler(p.MenuListProps?.onKeyDown, e);
          if (e.key === "Tab") {
            e.preventDefault();
            p.onClose?.(e, "tabKeyDown");
          }
        }}
      >
        {p.children}
      </MenuList>
    </PopoverImpl>
  );
}
let lastTooltipClosed = 0;
export interface TooltipProps extends Omit<MuiProps, "title" | "onClose"> {
  title: JSX.Element;
  children: JSX.Element;
  open?: boolean;
  onOpen?: (event: Event) => void;
  onClose?: (event: Event) => void;
  placement?: Placement;
  arrow?: boolean;
  enterDelay?: number;
  enterNextDelay?: number;
  leaveDelay?: number;
  enterTouchDelay?: number;
  leaveTouchDelay?: number;
  disableHoverListener?: boolean;
  disableFocusListener?: boolean;
  disableTouchListener?: boolean;
  disableInteractive?: boolean;
  followCursor?: boolean;
  describeChild?: boolean;
  PopperProps?: Partial<PopperProps>;
  TransitionProps?: Partial<TransitionProps>;
}
export function Tooltip(props: TooltipProps): JSX.Element {
  const p = useProps("MuiTooltip", props);
  const id = createUniqueId();
  let anchor!: HTMLSpanElement;
  let updatePopper: (() => void) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let touch = false;
  const [local, setLocal] = createSignal(false);
  const [exited, setExited] = createSignal(true);
  const opened = () =>
    (p.open ?? local()) &&
    p.title !== "" &&
    p.title != null &&
    p.title !== false;
  const [cursor, setCursor] = createSignal({ x: 0, y: 0 });
  const request = (value: boolean, event: Event, delay: number) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (p.open === undefined) setLocal(value);
      if (value) p.onOpen?.(event);
      else {
        touch = false;
        lastTooltipClosed = performance.now();
        p.onClose?.(event);
      }
    }, delay);
  };
  onSettled(() => () => clearTimeout(timer));
  createEffect(
    () => ({ open: opened(), title: p.title, describe: p.describeChild }),
    ({ open, title, describe }) => {
      let disposed = false;
      let target: HTMLElement | undefined;
      let previous: string | null = null;
      let attribute = "";
      queueMicrotask(() => {
        if (disposed || !anchor) return;
        target =
          anchor.querySelector<HTMLElement>(
            "button,a[href],input,select,textarea,[tabindex]",
          ) ??
          (anchor.firstElementChild as HTMLElement) ??
          anchor;
        attribute =
          describe || typeof title !== "string"
            ? "aria-describedby"
            : "aria-label";
        previous = target.getAttribute(attribute);
        if (attribute === "aria-describedby") {
          if (open)
            target.setAttribute(
              attribute,
              [previous, id].filter(Boolean).join(" "),
            );
        } else if (!previous && typeof title === "string")
          target.setAttribute(attribute, title);
      });
      return () => {
        disposed = true;
        if (target) {
          if (previous === null) target.removeAttribute(attribute);
          else target.setAttribute(attribute, previous);
        }
      };
    },
  );
  createEffect(
    () => opened(),
    (open) => {
      if (!open) return;
      setExited(false);
      const escape = (e: KeyboardEvent) => {
        if (e.key === "Escape") request(false, e, 0);
      };
      document.addEventListener("keydown", escape);
      return () => document.removeEventListener("keydown", escape);
    },
  );
  const virtual: VirtualElement = {
    getBoundingClientRect: () => new DOMRect(cursor().x, cursor().y, 0, 0),
    get contextElement() {
      return anchor;
    },
  };
  return (
    <>
      <span
        ref={anchor}
        style={{ display: "inline-flex" }}
        onMouseEnter={(e: MouseEvent) => {
          if (!p.disableHoverListener && !touch)
            request(
              true,
              e,
              performance.now() - lastTooltipClosed < 800
                ? p.enterNextDelay ?? 0
                : p.enterDelay ?? 100,
            );
        }}
        onMouseLeave={(e: MouseEvent) => {
          if (!p.disableHoverListener && !touch)
            request(false, e, p.leaveDelay ?? 0);
        }}
        onFocus={(e: FocusEvent) => {
          if (!p.disableFocusListener) request(true, e, 0);
        }}
        onBlur={(e: FocusEvent) => {
          if (!p.disableFocusListener) request(false, e, p.leaveDelay ?? 0);
        }}
        onMouseMove={(e: MouseEvent) => {
          if (p.followCursor) {
            setCursor({ x: e.clientX, y: e.clientY });
            queueMicrotask(() => updatePopper?.());
          }
        }}
        onTouchStart={(e: TouchEvent) => {
          if (!p.disableTouchListener) {
            touch = true;
            request(true, e, p.enterTouchDelay ?? 700);
          }
        }}
        onTouchEnd={(e: TouchEvent) => {
          if (!p.disableTouchListener)
            request(false, e, p.leaveTouchDelay ?? 1500);
        }}
      >
        {p.children}
      </span>
      <TransitionBoundary value={null}>
        <Popper
          {...p.PopperProps}
          slots={{
            ...p.PopperProps?.slots,
            root: p.slots?.popper ?? p.PopperProps?.slots?.root,
          }}
          slotProps={{
            ...p.PopperProps?.slotProps,
            root: slotProps(p, "popper"),
          }}
          popperRef={(instance) => {
            updatePopper = () => {
              void instance.update();
            };
            p.PopperProps?.popperRef?.(instance);
          }}
          open={opened() || !exited()}
          anchorEl={p.followCursor ? virtual : () => anchor}
          placement={p.placement ?? "bottom"}
          modifiers={[
            { name: "offset", options: { offset: [0, 10] } },
            ...(p.PopperProps?.modifiers ?? []),
          ]}
          sx={[p.PopperProps?.sx, (t) => ({ zIndex: t.zIndex.tooltip }), p.sx]}
        >
          <Grow
            in={opened()}
            {...p.TransitionProps}
            onEnter={(node, appearing) => {
              setExited(false);
              p.TransitionProps?.onEnter?.(node, appearing);
            }}
            onExited={(node) => {
              setExited(true);
              p.TransitionProps?.onExited?.(node);
            }}
          >
            <Root
              name="MuiTooltip"
              ownerProps={p}
              slot="tooltip"
              role="tooltip"
              id={id}
              onMouseEnter={(e: MouseEvent) => {
                if (!p.disableInteractive) request(true, e, 0);
              }}
              onMouseLeave={(e: MouseEvent) => {
                if (!p.disableInteractive) request(false, e, p.leaveDelay ?? 0);
              }}
              styles={(t) => ({
                position: "relative",
                color: "#fff",
                background: "rgba(97,97,97,.92)",
                borderRadius: t.shape.borderRadius,
                padding: "4px 8px",
                fontSize: "0.6875rem",
                fontWeight: 500,
                lineHeight: 1.4,
                maxWidth: 300,
                pointerEvents: p.disableInteractive ? "none" : "auto",
                [resolveMuiClassName("& .MuiTooltip-arrow")]: {
                  position: "absolute",
                  width: 8,
                  height: 8,
                  background: "inherit",
                  transform: "rotate(45deg)",
                  left: "calc(50% - 4px)",
                  top: -4,
                },
                [resolveMuiClassName(
                  '[data-popper-placement^="top"] & .MuiTooltip-arrow',
                )]: {
                  top: "auto",
                  bottom: -4,
                },
                [resolveMuiClassName(
                  '[data-popper-placement^="left"] & .MuiTooltip-arrow',
                )]: {
                  left: "auto",
                  right: -4,
                  top: "calc(50% - 4px)",
                },
                [resolveMuiClassName(
                  '[data-popper-placement^="right"] & .MuiTooltip-arrow',
                )]: {
                  left: -4,
                  top: "calc(50% - 4px)",
                },
              })}
            >
              {p.title}
              <Show when={p.arrow}>
                <Root
                  name="MuiTooltip"
                  ownerProps={p}
                  slot="arrow"
                  component="span"
                />
              </Show>
            </Root>
          </Grow>
        </Popper>
      </TransitionBoundary>
    </>
  );
}
export interface SnackbarContentProps extends MuiProps {
  message?: JSX.Element;
  action?: JSX.Element;
}
export function SnackbarContent(props: SnackbarContentProps): JSX.Element {
  const p = useProps("MuiSnackbarContent", props);
  return (
    <Root
      name="MuiSnackbarContent"
      props={p}
      role={p.role ?? "alert"}
      styles={(t) => ({
        ...t.typography.body2,
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        minWidth: 288,
        maxWidth: "100%",
        padding: "6px 16px",
        color: t.palette.mode === "dark" ? "#000" : "#fff",
        background: t.palette.mode === "dark" ? "#eee" : "#323232",
        boxShadow: t.shadows[6],
        borderRadius: t.shape.borderRadius,
      })}
    >
      <div
        class={resolveMuiClassName("MuiSnackbarContent-message")}
        style={{ padding: "8px 0" }}
      >
        {p.message}
      </div>
      <Show when={p.action}>
        <div
          class={resolveMuiClassName("MuiSnackbarContent-action")}
          style={{
            display: "flex",
            "align-items": "center",
            "margin-left": "auto",
            "padding-left": "16px",
            "margin-right": "-8px",
          }}
        >
          {p.action}
        </div>
      </Show>
    </Root>
  );
}
export interface SnackbarProps extends Omit<MuiProps, "onClose"> {
  open?: boolean;
  onClose?: (
    event: Event | null,
    reason: "timeout" | "clickaway" | "escapeKeyDown",
  ) => void;
  message?: JSX.Element;
  action?: JSX.Element;
  autoHideDuration?: number | null;
  resumeHideDuration?: number;
  disableWindowBlurListener?: boolean;
  anchorOrigin?: {
    vertical: "top" | "bottom";
    horizontal: "left" | "center" | "right";
  };
  ContentProps?: SnackbarContentProps;
  TransitionProps?: Partial<TransitionProps>;
  transitionDuration?: TransitionProps["timeout"];
  TransitionComponent?: ValidComponent;
}
export function Snackbar(props: SnackbarProps): JSX.Element {
  const p = useProps("MuiSnackbar", props);
  const TransitionTag = dynamic(
    () => p.TransitionComponent ?? p.slots?.transition ?? Grow,
  );
  const [exited, setExited] = createSignal(untrack(() => !p.open));
  let timer: ReturnType<typeof setTimeout> | undefined;
  const pause = () => clearTimeout(timer);
  const resume = () => {
    pause();
    if (p.open && p.autoHideDuration != null)
      timer = setTimeout(
        () => p.onClose?.(null, "timeout"),
        p.resumeHideDuration ?? p.autoHideDuration / 2,
      );
  };
  createEffect(
    () => ({
      open: p.open,
      duration: p.autoHideDuration,
      blur: p.disableWindowBlurListener,
    }),
    ({ open, duration, blur }) => {
      pause();
      if (!open) return;
      if (duration != null)
        timer = setTimeout(() => p.onClose?.(null, "timeout"), duration);
      const escape = (e: KeyboardEvent) => {
        if (e.key === "Escape") p.onClose?.(e, "escapeKeyDown");
      };
      document.addEventListener("keydown", escape);
      if (!blur) {
        window.addEventListener("blur", pause);
        window.addEventListener("focus", resume);
      }
      return () => {
        pause();
        document.removeEventListener("keydown", escape);
        window.removeEventListener("blur", pause);
        window.removeEventListener("focus", resume);
      };
    },
  );
  createEffect(
    () => {
      const timeout = p.TransitionProps?.timeout ?? p.transitionDuration;
      return {
        open: p.open,
        duration:
          typeof timeout === "number"
            ? timeout
            : typeof timeout === "object"
              ? timeout.exit ?? 225
              : 300,
      };
    },
    ({ open, duration }) => {
      if (open) {
        setExited(false);
        return;
      }
      const id = setTimeout(() => setExited(true), duration + 100);
      return () => clearTimeout(id);
    },
  );
  const origin = () =>
    p.anchorOrigin ?? { vertical: "bottom", horizontal: "left" };
  return (
    <TransitionBoundary
      value={{
        entering: () => setExited(false),
        exited: () => setExited(true),
      }}
    >
      <Show when={p.open || !exited()}>
        <ClickAwayListener onClickAway={(e) => p.onClose?.(e, "clickaway")}>
          <Root
            name="MuiSnackbar"
            props={omit(p, "onClose")}
            onMouseEnter={pause}
            onMouseLeave={resume}
            onFocus={pause}
            onBlur={resume}
            styles={(t) => ({
              position: "fixed",
              zIndex: t.zIndex.snackbar,
              display: "flex",
              [origin().vertical]: 24,
              left:
                origin().horizontal === "center"
                  ? "50%"
                  : origin().horizontal === "left"
                    ? 24
                    : undefined,
              right: origin().horizontal === "right" ? 24 : undefined,
              transform:
                origin().horizontal === "center"
                  ? "translateX(-50%)"
                  : undefined,
              maxWidth: "calc(100vw - 48px)",
            })}
          >
            <TransitionTag
              in={p.open}
              timeout={p.transitionDuration}
              {...p.TransitionProps}
              onEnter={(node: HTMLElement, appearing: boolean) => {
                setExited(false);
                p.TransitionProps?.onEnter?.(node, appearing);
              }}
              onExited={(node: HTMLElement) => {
                setExited(true);
                p.TransitionProps?.onExited?.(node);
              }}
            >
              {p.children ?? (
                <SnackbarContent
                  {...p.ContentProps}
                  message={p.message}
                  action={p.action}
                />
              )}
            </TransitionTag>
          </Root>
        </ClickAwayListener>
      </Show>
    </TransitionBoundary>
  );
}
export interface TrapFocusProps {
  children?: JSX.Element;
  open: boolean;
  disableAutoFocus?: boolean;
  disableEnforceFocus?: boolean;
  disableRestoreFocus?: boolean;
  isEnabled?: () => boolean;
  getTabbable?: (root: HTMLElement) => HTMLElement[];
}
export function Unstable_TrapFocus(p: TrapFocusProps): JSX.Element {
  let root!: HTMLDivElement;
  createEffect(
    () => ({ open: p.open, restore: !p.disableRestoreFocus }),
    ({ open, restore }) => {
      if (!open || typeof document === "undefined") return;
      const previous = document.activeElement as HTMLElement | null;
      let active = true;
      const nodes = () => (p.getTabbable ?? focusable)(root);
      const enabled = () => p.isEnabled?.() !== false;
      const focus = () => (nodes()[0] ?? root).focus();
      const enforce = (e: FocusEvent) => {
        if (
          enabled() &&
          !p.disableEnforceFocus &&
          !root.contains(e.target as Node)
        )
          focus();
      };
      const keydown = (e: KeyboardEvent) => {
        if (e.key !== "Tab" || !enabled() || p.disableEnforceFocus) return;
        const all = nodes();
        const first = all[0] ?? root;
        const last = all.at(-1) ?? root;
        if (
          !all.length ||
          document.activeElement === root ||
          (e.shiftKey
            ? document.activeElement === first
            : document.activeElement === last)
        ) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        }
      };
      queueMicrotask(() => {
        if (
          active &&
          root &&
          !p.disableAutoFocus &&
          !root.contains(document.activeElement)
        )
          focus();
      });
      document.addEventListener("focusin", enforce);
      document.addEventListener("keydown", keydown);
      return () => {
        active = false;
        document.removeEventListener("focusin", enforce);
        document.removeEventListener("keydown", keydown);
        if (restore && previous?.isConnected) previous.focus();
      };
    },
  );
  return (
    <div ref={root} tabindex={-1} style={{ outline: "none" }}>
      {p.children}
    </div>
  );
}
