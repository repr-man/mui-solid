# Material UI for SolidJS 2

A Solid-native port of **MUI Core 9.5.0**, using the Material Design 2 palette, typography, elevation, spacing, and component vocabulary. Package name: `@mui-solid/material`.

The source includes all 138 Core default entry points, the upstream utility classes and palettes, and 10,750 Material icons. The [API inventory](docs/API-INVENTORY.md) compares exported names; its coverage counts do not guarantee behavioral or type compatibility. MUI X and Lab packages have their own scope upstream and are not included here.

## Run the component gallery

```sh
npm install
npm run dev
```

Open the URL printed by Vite. The gallery covers inputs, surfaces, navigation, feedback, data display, layout, and live theme customization, with desktop/mobile layouts and light/dark modes.

The development server also serves a server-rendered, hydrated form at `/ssr`. The reorder example is available at `/examples/reorder.html`; add `?prefix=demo` to inspect custom utility class names.

```sh
npm run typecheck
npm run build
npm run build:demo
npm run size
```

The library build produces browser modules, server modules, and declarations in `dist/`. The gallery build is written to `demo-dist/`. There are no tests or test dependencies; verification uses source review, TypeScript/build checks, and manual browser inspection.

`size` builds representative consumer imports from `dist/` in memory and reports minified and gzip JavaScript bytes, including runtime dependencies. See [performance notes](docs/PERFORMANCE.md) for the optimization changes and measurements.

## Solid 2 setup

This repository pins the runtime, renderer, and compiler to **2.0.0-rc.14**, with `@solidjs/vite-plugin@3.0.0-next.49` and Vite 8. Keep those versions aligned in consuming applications. Node 22.12 or newer is required.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import solid from "@solidjs/vite-plugin";

export default defineConfig({ plugins: [solid()] });
```

Use `jsx: "preserve"` and `jsxImportSource: "@solidjs/web"` in TypeScript. Package exports provide a `solid` condition for source compilation, plus precompiled browser and server modules. Build the library before consuming its compiled exports through a workspace or local package dependency.

## Components

```tsx
import { createMemo, createSignal } from "solid-js";
import {
  Button,
  CssBaseline,
  Stack,
  TextField,
  ThemeProvider,
  createTheme,
} from "@mui-solid/material";
import Save from "@mui-solid/material/icons/Save";

export function Editor() {
  const [name, setName] = createSignal("Material workspace");
  const theme = createMemo(() =>
    createTheme({
      palette: { primary: { main: "#008577" } },
    }),
  );

  return (
    <ThemeProvider theme={theme()}>
      <CssBaseline />
      <Stack spacing={2} sx={{ maxWidth: 480, p: 3 }}>
        <TextField
          label="Project name"
          value={name()}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <Button variant="contained" startIcon={<Save />}>
          Save
        </Button>
      </Stack>
    </ThemeProvider>
  );
}
```

Individual imports work too: `@mui-solid/material/Button`, `/TextField`, `/styles`, `/colors`, and `/icons/Save`. Importing an individual icon keeps the bundle focused on the icons used by the application. Roboto and the ligature-based Material Icons font are application assets; the gallery includes Roboto, while SVG icon components need no icon font.

## Themes and customization

Import `unstable_ClassNameGenerator` from `/className` and configure it before importing components when customizing the class prefix.

`createTheme`, `ThemeProvider`, `sx`, `styled`, `GlobalStyles`, component `defaultProps`, `styleOverrides`, variants, utility classes, and slot props share MUI's general shape. `sx` numbers use theme spacing where applicable; raw CSS in `styled`, overrides, and `GlobalStyles` uses CSS units.

```tsx
const theme = createTheme({
  palette: { mode: "dark" },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: "none" } },
    },
  },
});

<Button
  variant="outlined"
  sx={{ px: 3, width: { xs: "100%", sm: "auto" } }}
  slotProps={{ root: { "aria-label": "Save project" } }}
>
  Save
</Button>;
```

`extendTheme` and `CssVarsProvider` provide light/dark palettes, palette channels and component tokens, CSS variable trees, stored/system mode selection, and `useColorScheme`. Scheme styles support the data and class selectors as well as media and custom selectors. Use a custom CSS variable prefix and `rootSelector` for a scoped theme preview. `StyledEngineProvider` supports a supplied Emotion cache and `injectFirst`. `nativeColor: true` uses native CSS relative colors and `oklch` mixing. `modularCssLayers` places global, component, theme, custom, and `sx` styles in ordered cascade layers. `motion.reducedMotion` supports `never`, `system`, and `always`; transitions can opt out with `disablePrefersReducedMotion`. `focusVisible` accepts a curated ring or custom styles. Native colors require browser support for relative colors and color mixing; framework-specific streaming adapters belong in the consuming Solid application.

## Solid-shaped APIs

- Read signals in JSX and tracked computations. Component bodies execute once; preserve reactive props instead of destructuring them into snapshots.
- `useMediaQuery`, `useScrollTrigger`, and the state returned by `useAutocomplete`/`usePagination` use accessors. Call the accessors in JSX or computations.
- Event callbacks receive native DOM events. Value-bearing callbacks retain MUI's extra arguments where applicable, such as `Checkbox.onChange(event, checked)` and `Slider.onChange(event, value)`.
- DOM refs are callbacks, ref arrays, or compatible `{ current }` objects. Custom components and slots receive reactive props directly, without React ref forwarding.
- `class` accepts Solid 2 arrays/objects; `className` remains an alias. Native `style` properties use Solid's kebab-case CSS names. `sx`, styled CSS objects, and theme overrides use camel-case CSS names.
- Solid writes commit at the next microtask. Controlled components derive their visible state from props and do not depend on reading a setter's result synchronously.
- For repeated JSX such as a Stack divider, prefer a factory: `<Stack divider={() => <Divider />}>`. Each separator then owns its element and reactive bindings. A supplied DOM divider can be reused as static markup.
- For manually composed `FormControl` fields, supply `filled={value() !== ""}` and `adornedStart` where needed so their initial server labels reflect the input state. `TextField` derives these automatically.
- Custom `slots` and computed `slotProps` replace or customize owned elements. Slot handlers run before internal behavior and can cancel it with `preventDefault`; refs preserve internal DOM handles.

See [migration notes](docs/MIGRATION.md) for the compatibility boundaries of the port.

## Server rendering

The package's `node` export condition selects Solid's server-compiled components. The `/ssr` development route demonstrates Vite SSR with `ssr: true`, a per-request style cache, `renderToString`, and `generateHydrationScript`; its client entry hydrates the same tree. For an application, include `getStyleTag(cache)` in the document head and hydrate with the same cache key. Global styles and CSS variable declarations are rendered as style elements in the component tree. Keep browser and server initial values consistent, and provide `ssrMatchMedia` when responsive output depends on a server-known viewport.

## Source and license

The port derives its API, utility classes, palette values, icon data, elevation values, and compatibility helpers from [MUI v9.5.0](https://github.com/mui/material-ui/tree/v9.5.0), under the MIT license. See [LICENSE](LICENSE) and [NOTICE](NOTICE). Solid's runtime owns state, effects, contexts, and rendering throughout the implementation.
