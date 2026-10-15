# Performance

The optimization pass keeps the public exports and both Solid renderers. It focuses on repeated component work, unused initialization, and the cost of compiling the icon set.

## Runtime changes

- `Root` resolves slot factories once per dependency change, retains native forwarding descriptors, and computes base and `sx` styles separately. Forwarded getters and style computations still track reactive values. Without theme overrides, utility-class modifier changes no longer invalidate CSS generation by themselves.
- `styled` evaluates the current slot override when there is no custom override resolver. Custom resolvers continue to receive all overrides.
- `deepmerge` clones the target tree once and merges overlapping plain subtrees into that private copy. Inherited values are cloned before merging; protected property names remain excluded. `sx` arrays merge into their fresh accumulator instead of repeatedly cloning it, and spacing aliases transform their value once.
- Select separates selection metadata from highlight updates. Moving the highlight changes at most the previous and next option's highlight attributes; it does not recompute every option's selection or rewrite every `aria-selected` attribute. Selection and option changes still refresh the complete selection metadata.
- Slider memoizes sorted range values and generated marks, including configurations with up to 10,000 marks. Autocomplete reuses its default filter and reads selected values once per filtering computation. Custom equality functions retain their existing semantics and comparison complexity.
- Tabs, BottomNavigation, and Stepper share a map of current child positions. Each child lookup is constant-time after collection. DOM collection still respects nested component boundaries, keyed reorders, removals, and explicit values. Tabs skip DOM queries for unrelated keys.
- The default Emotion cache is created when needed. Supplying a cache no longer creates an unused fallback cache. Cache flushing, hydration, and per-request SSR ownership remain with Emotion and the application.

## Tree shaking and build work

Pure annotations identify factories whose result owns their changes: utility class maps, component/context factories, the default theme, and all 10,750 icon components. The asset and class generators preserve those annotations. This allows unused definitions inside shared modules to be removed without changing their exports.

The library build erases TypeScript once per source module, then compiles the preserved JSX separately for the browser and server. This reduces type-erasure passes from 21,948 to 10,974 for the current source tree. Each output directory is created once instead of once per output file. File concurrency remains bounded, and the full declaration build remains in place.

## Recorded bundle sizes

Measurements used the installed Vite 8.3.4 toolchain on 2026-10-13. Sizes include browser runtime dependencies. Decimal kB are rounded to one decimal place.

The production gallery's complete JavaScript output decreased from approximately **366.2 kB to 354.2 kB**, and from **113.1 kB to 110.2 kB gzip**. Fonts and CSS are excluded from those figures.

The following comparison isolates factory annotations: it builds the same compiled modules with those annotations removed, then with them enabled. Other runtime optimizations are present in both columns; these are not full before/after library measurements.

| Consumer export | Gzip bytes without factory annotations | Gzip bytes with annotations |
| --- | ---: | ---: |
| Button | 46,788 | 43,622 |
| Box | 40,579 | 39,406 |
| TextField | 57,902 | 54,752 |
| SvgIcon | 40,637 | 39,470 |
| Save, direct icon import | 40,850 | 39,674 |
| Save, icon barrel import | 40,855 | 39,679 |
| deepmerge | 16,699 | 659 |

The direct and barrel Save imports produce almost identical delivered code. Direct imports still avoid traversing the entire icon barrel during development and builds.

Run `npm run build` followed by `npm run size` to report current minified and gzip bytes. The size command builds consumer exports in memory without executing application code. It preserves entry exports so an otherwise unused virtual entry cannot produce a misleading empty bundle.

## Verification

Verification uses source review, TypeScript checking, complete browser/server/declaration builds, the production gallery build, and browser interaction. No tests were written or run.

Browser inspection covered Select highlight/selection, Slider input updates, Autocomplete filtering, light/dark theme updates, navigation rotation/removal with custom utility-class prefixes, and the hydrated SSR form's save action. Mobile DOM geometry showed no horizontal overflow in the inspected gallery and reorder pages. Preview screenshot capture was unavailable, so no screenshot-based visual verification is claimed.

Runtime improvements above describe removed work and algorithmic changes. They are not measured end-to-end latency guarantees; application data, custom callbacks, and theme configuration still determine the total cost.
