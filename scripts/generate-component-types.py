#!/usr/bin/env python3
"""Generate Solid-native theme component maps from MUI v9.5.0 declarations."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UPSTREAM = Path("/tmp/mui-upstream")


def main() -> None:
    props_source = (UPSTREAM / "styles/props.d.ts").read_text()
    class_source = (UPSTREAM / "styles/overrides.d.ts").read_text()
    rows = re.findall(r"^\s*(Mui\w+):\s*([^;]+);", props_source, re.M)
    utility = (ROOT / "src/utility-classes.ts").read_text()
    available = set(re.findall(r"export type (\w+ClassKey) = keyof", utility))

    imports: dict[str, set[str]] = {}
    declarations: list[tuple[str, str]] = []
    for component_name, upstream_type in rows:
        component = component_name.removeprefix("Mui")
        if component == "UseMediaQuery":
            declarations.append((component_name, "NonNullable<Parameters<typeof import('./theme').useMediaQuery>[1]>"))
            continue
        path = ROOT / "src" / component / "index.ts"
        contents = path.read_text() if path.exists() else ""
        prop_match = re.match(r"(\w+)(?:<.*>)?$", upstream_type.strip())
        prop_name = prop_match.group(1) if prop_match else ""
        if component == "Autocomplete":
            imported_type = "AutocompleteProps<unknown>"
            imports.setdefault(component, set()).add("AutocompleteProps")
        elif prop_name and re.search(rf"\b{prop_name}\b", contents):
            imported_type = prop_name
            imports.setdefault(component, set()).add(prop_name)
        else:
            alias = component + "Component"
            imported_type = f"ComponentProps<typeof {alias}>"
            imports.setdefault(component, set()).add(f"default as {alias}")
        declarations.append((component_name, imported_type))

    class_map_body = re.search(r"export interface ComponentNameToClassKey\s*\{(.*?)\n\}", class_source, re.S)
    if not class_map_body:
        raise RuntimeError("upstream ComponentNameToClassKey interface not found")
    class_entries = re.findall(r"(Mui\w+)\s*:\s*(\w+);", class_map_body.group(1))
    # Use the project's real derived class-key aliases. Upstream's Step* names
    # use a legacy lower-case 'key' spelling, while our aliases are normalized.
    class_mapping = {
        component_name: component_name.removeprefix("Mui") + "ClassKey"
        for component_name, _ in class_entries
        if component_name.removeprefix("Mui") + "ClassKey" in available
    }

    out = [
        "/** Solid-native theme component types generated from MUI Material UI v9.5.0 declarations. */",
        'import type { ComponentProps } from "@solidjs/web";',
        'import type { CSSInterpolation, CSSObject } from "@emotion/serialize";',
        'import type { ComponentConfig, Theme } from "./theme";',
    ]
    for component, names in sorted(imports.items()):
        formatted = ", ".join(sorted(names))
        out.append(f'import type {{ {formatted} }} from "./{component}";')
    if class_mapping:
        out.append('import type { ' + ', '.join(sorted(set(class_mapping.values()))) + ' } from "./utility-classes";')
    out += ["", "export interface ComponentsPropsList {"]
    for name, prop_type in declarations:
        out.append(f"  {name}: {prop_type};")
    out += [
        "}",
        "",
        "export type ComponentsProps = { [Name in keyof ComponentsPropsList]?: Partial<ComponentsPropsList[Name]> };",
        "",
        "export interface ComponentNameToClassKey {",
    ]
    for name, class_key in sorted(class_mapping.items()):
        out.append(f"  {name}: {class_key};")
    out += [
        "}",
        "",
        "type CssBaselineStyleOverrides<TTheme> = CSSObject | string | ((theme: TTheme) => CSSInterpolation);",
        "type ComponentConfigFor<Name extends keyof ComponentsPropsList, TTheme> = Name extends 'MuiCssBaseline'",
        "  ? Omit<ComponentConfig<ComponentsPropsList[Name], TTheme>, 'styleOverrides'> & { styleOverrides?: CssBaselineStyleOverrides<TTheme> }",
        "  : ComponentConfig<ComponentsPropsList[Name], TTheme, Name extends keyof ComponentNameToClassKey ? ComponentNameToClassKey[Name] : string>;",
        "export type ComponentsOverrides<TTheme = Theme> = {",
        "  [Name in keyof ComponentsPropsList]?: ComponentConfigFor<Name, TTheme>[\"styleOverrides\"];",
        "};",
        "export type ComponentsVariants<TTheme = Theme> = {",
        "  [Name in keyof ComponentsPropsList]?: ComponentConfigFor<Name, TTheme>[\"variants\"];",
        "};",
        "export type Components<TTheme = Theme> = {",
        "  [Name in keyof ComponentsPropsList]?: ComponentConfigFor<Name, TTheme>;",
        "} & Record<string, unknown>;",
        "",
    ]
    (ROOT / "src/component-types.ts").write_text("\n".join(out))
    print(f"generated {len(declarations)} component prop entries and {len(class_mapping)} class-key entries")


if __name__ == "__main__":
    main()
