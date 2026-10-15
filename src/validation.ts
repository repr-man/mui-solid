declare const process: { env?: { NODE_ENV?: string } };

export type PropTypeValidator = (
  props: Record<string, unknown>,
  propName: string,
  componentName?: string,
  location?: string,
  propFullName?: string,
  ...args: unknown[]
) => Error | null;

/** Marks a PropTypes-compatible validator as deprecated during development. */
export function deprecatedPropType(
  validator: PropTypeValidator,
  reason: string,
): PropTypeValidator {
  if (isProduction()) return () => null;
  return (props, propName, componentName, location, propFullName) => {
    const componentNameSafe = componentName || "<<anonymous>>";
    const propFullNameSafe = propFullName || propName;
    if (typeof props[propName] !== "undefined") {
      return new Error(
        `The ${location} \`${propFullNameSafe}\` of \`${componentNameSafe}\` is deprecated. ${reason}`,
      );
    }
    return null;
  };
}

/** Creates a PropTypes-compatible validator for props that require another prop. */
export function requirePropFactory(
  componentNameInError: string,
  Component?: { propTypes?: Record<string, PropTypeValidator> },
) {
  if (isProduction()) return () => () => null;
  const prevPropTypes = Component?.propTypes
    ? { ...Component.propTypes }
    : undefined;
  return (requiredProp: string): PropTypeValidator =>
    (props, propName, componentName, location, propFullName, ...args) => {
      const propFullNameSafe = propFullName || propName;
      const defaultTypeChecker = prevPropTypes?.[propFullNameSafe];
      if (defaultTypeChecker) {
        const typeCheckerResult = defaultTypeChecker(
          props,
          propName,
          componentName,
          location,
          propFullName,
          ...args,
        );
        if (typeCheckerResult) return typeCheckerResult;
      }
      if (typeof props[propName] !== "undefined" && !props[requiredProp]) {
        return new Error(
          `The prop \`${propFullNameSafe}\` of \`${componentNameInError}\` can only be used together with the \`${requiredProp}\` prop.`,
        );
      }
      return null;
    };
}

/** Reports a prop that is unsupported by the component. */
export function unsupportedProp(
  props: Record<string, unknown>,
  propName: string,
  _componentName?: string,
  _location?: string,
  propFullName?: string,
): Error | null {
  if (isProduction()) return null;
  const propFullNameSafe = propFullName || propName;
  if (typeof props[propName] !== "undefined") {
    return new Error(
      `The prop \`${propFullNameSafe}\` is not supported. Please remove it.`,
    );
  }
  return null;
}

function isProduction(): boolean {
  return (
    typeof process !== "undefined" && process.env?.NODE_ENV === "production"
  );
}
