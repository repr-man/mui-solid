# Migration from MUI React

Replace `@mui/material` imports with `@mui-solid/material`, `@mui/material/styles` with `@mui-solid/material/styles`, and `@mui/icons-material/Name` with `@mui-solid/material/icons/Name`. Use the Solid 2 compiler and renderer versions recorded in the README.

Component names and common props remain familiar. Controlled values, default values, variants, sizes, palette colors, accessibility attributes, transitions, popups, focus handling, `sx`, and theme customization are implemented with Solid primitives and native events.

## React-specific code

Use Solid signals, contexts, `For`, `Show`, and owned computations. Hooks exposing changing state return accessors. React context objects, synthetic-event assumptions, ref forwarding, and `react-transition-group` lifecycle objects require adaptation. Slot components are ordinary Solid components. Native events can be retained without pooling. Where a React API clones an element to create repeated or modified content, pass a Solid component or factory that creates fresh JSX; a Solid component function is not a React element and cannot be cloned with `cloneElement`.

`component` changes the rendered root. Component prop interfaces use Solid DOM types; the generic polymorphic and slot utilities exported from `utils` also use Solid component props. The upstream React type-map and module-augmentation declarations are not copied wholesale: consult the inventory when migrating code that imports those auxiliary types. Extra TypeScript props supported by a custom component should be declared by that component rather than cast to React props.

For dynamic hook options, pass getters or another reactive prop object; avoid passing a snapshot object from the component body. For example:

```tsx
const [query, setQuery] = createSignal("(min-width: 900px)");
const matches = useMediaQuery(() => query());
return <Show when={matches()}>Wide layout</Show>;
```

## Scope and fidelity

The export inventory is a source-name comparison. It does not establish identical behavior across every MUI configuration, browser, assistive technology, or third-party integration. This is a new Solid implementation, with simplified internal state and native DOM structure.

Popper positioning uses Floating UI. Existing Popper.js-specific modifiers and custom transition components may need Solid adapters. Material design, controlled forms, popup interactions, keyboard navigation, responsive layouts, and theme changes have been manually reviewed in the gallery; production suitability still depends on the application workflows and slots used.

CSS variable mode generates palette channels and component tokens, along with light and dark scheme variables. Data and class selectors are supported, as are media and custom selector strings; `useColorScheme` updates the active scheme. `nativeColor` uses relative CSS colors and `oklch` mixing, while `modularCssLayers` orders global, component, theme, custom, and `sx` styles. Native color mode requires the corresponding modern browser CSS support. Framework-specific streaming integration uses Solid adapters rather than React adapters. Keep references to the public `Theme` and `ThemeVars` types rather than assuming every upstream private field exists.

Custom React elements passed as transition children or repeated item renderers need Solid components or factories where independent DOM instances are required. `SliderValueLabel` is a native label slot: its children/value render the label directly; it does not clone a React thumb element. The development `/ssr` route demonstrates Vite SSR with Solid's `ssr: true` compilation, `renderToString`, `generateHydrationScript`, and client hydration. The reorder example is at `/examples/reorder.html`.

For a manually composed `FormControl`, pass reactive `filled` and `adornedStart` state to reproduce initial server label placement. `TextField` derives these from its input props. This replaces React child-element inspection.

The full source, gallery, and generated entry barrels are included so the implementation can be reviewed and extended without a React compatibility layer.
