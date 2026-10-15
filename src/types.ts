import type { ComponentProps, ValidComponent } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import type { SxProps } from "./theme";

/** Distributive form of Omit for props that may be unions. */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/** Slot props may opt into explicitly declared data attributes through augmentation. */
export interface DataAttributesOverrides {}
export type WithDataAttributes<T> = T | (T & DataAttributesOverrides);

/** Event handlers accepted by renderer-native slot prop utilities. */
export type EventHandlers = Record<string, (...args: never[]) => unknown>;

/** A component prop object that may omit the state normally passed to a slot. */
export type WithOptionalOwnerState<Props extends { ownerState: unknown }> =
  Omit<Props, "ownerState"> & Partial<Pick<Props, "ownerState">>;

/** Common props that can be applied to any Solid slot. */
export interface SlotCommonProps {
  component?: ValidComponent;
  class?: JSX.HTMLAttributes<HTMLElement>["class"];
  className?: string;
  style?: JSX.CSSProperties;
  sx?: SxProps;
}

type SlotPropsFor<
  C extends ValidComponent,
  Overrides extends object,
> = WithDataAttributes<Partial<ComponentProps<C>> & Overrides>;

/** Slot props can be static or computed from the component's current owner state. */
export type SlotComponentProps<
  C extends ValidComponent,
  Overrides extends object = {},
  OwnerState = unknown,
> =
  | SlotPropsFor<C, Overrides>
  | ((ownerState: OwnerState) => SlotPropsFor<C, Overrides>);

/** Slot props computed from both component owner state and a slot-specific state. */
export type SlotComponentPropsWithSlotState<
  C extends ValidComponent,
  Overrides extends object = {},
  OwnerState = unknown,
  SlotState = unknown,
> =
  | SlotPropsFor<C, Overrides>
  | ((
      ownerState: OwnerState,
      slotState: SlotState,
    ) => SlotPropsFor<C, Overrides>);

/** Convenience alias for a slot's native props plus shared MUI-style slot props. */
export type SlotProps<
  C extends ValidComponent,
  Overrides extends object = {},
  OwnerState = unknown,
> = SlotComponentProps<C, SlotCommonProps & Overrides, OwnerState>;

/** Pairs a slot component map with a required, key-matched slot-prop map. */
export type CreateSlotsAndSlotProps<
  Slots extends Record<string, ValidComponent>,
  Props extends Record<keyof Slots, unknown>,
> = {
  slots?: Partial<Slots>;
  slotProps?: Partial<Props>;
};

/** Renderer-native polymorphic component map. */
export interface OverridableTypeMap<
  Props extends object,
  DefaultComponent extends ValidComponent,
> {
  props: Props;
  defaultComponent: DefaultComponent;
}

/** Component-specific props shared by every allowed root component. */
export type BaseProps<M extends OverridableTypeMap<object, ValidComponent>> =
  M["props"] & {
    class?: JSX.HTMLAttributes<HTMLElement>["class"];
    className?: string;
    style?: JSX.CSSProperties;
  };

/** Props when the root is a chosen Solid intrinsic or component. */
export type OverrideProps<
  M extends OverridableTypeMap<object, ValidComponent>,
  C extends ValidComponent,
> = BaseProps<M> & DistributiveOmit<ComponentProps<C>, keyof BaseProps<M>>;

/** Props when the type map's default root is used. */
export type DefaultComponentProps<
  M extends OverridableTypeMap<object, ValidComponent>,
> = BaseProps<M> &
  DistributiveOmit<ComponentProps<M["defaultComponent"]>, keyof BaseProps<M>>;

/** Function component shape with a typed `component` override and native prop inference. */
export interface OverridableComponent<
  M extends OverridableTypeMap<object, ValidComponent>,
> {
  <C extends ValidComponent>(
    props: { component: C } & OverrideProps<M, C>,
  ): JSX.Element;
  (props: DefaultComponentProps<M> & { component?: undefined }): JSX.Element;
}

/** Common props for components built from a renderer-native type map. */
export type StandardProps<
  Props,
  ClassKey extends string = never,
  Removed extends keyof Props = never,
> = Omit<Props, Removed | "class" | "className" | "style"> &
  SlotCommonProps & { classes?: Partial<Record<ClassKey, string>> };
