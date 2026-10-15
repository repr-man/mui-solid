#!/usr/bin/env python3
"""Generate per-entry Solid barrels and an API coverage inventory from MUI v9.5.0."""
from __future__ import annotations
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UPSTREAM = Path('/tmp/mui-upstream')
SOURCES = {
    'display': ROOT / 'src/display.tsx',
    'inputs': ROOT / 'src/inputs.tsx',
    'overlays': ROOT / 'src/overlays.tsx',
    'navigation': ROOT / 'src/navigation.tsx',
    'theme': ROOT / 'src/theme.tsx',
    'motion': ROOT / 'src/motion.ts',
    'color-system': ROOT / 'src/color-system.ts',
    'color-manipulator': ROOT / 'src/color-manipulator.ts',
    'input-select-context': ROOT / 'src/input-select-context.tsx',
    'component-types': ROOT / 'src/component-types.ts',
    'core': ROOT / 'src/core.tsx',
    'utility-classes': ROOT / 'src/utility-classes.ts',
    'utils': ROOT / 'src/utils.ts',
    'validation': ROOT / 'src/validation.ts',
    'compatibility': ROOT / 'src/compatibility.ts',
    'index': ROOT / 'src/index.ts',
    'types': ROOT / 'src/types.ts',
    'system-props': ROOT / 'src/system-props.ts',
    'input-slider-slots': ROOT / 'src/input-slider-slots.tsx',
}


def decls(path: Path):
    text = path.read_text()
    result = {}
    for kind, name in re.findall(r'export\s+(function|const|interface|type|class)\s+(\w+)', text):
        result[name] = kind
    # Include explicit local export lists, including aliases and type-only aliases.
    local_names = {name: kind for kind, name in re.findall(r'\b(function|const|interface|type|class)\s+(\w+)', text)}
    for match in re.finditer(r'export\s+(type\s+)?\{([^}]+)\}(?:\s+from\s+["\'][^"\']+["\'])?', text, re.S):
        type_only, block = match.groups()
        for item in block.split(','):
            bits = re.split(r'\s+as\s+', item.strip())
            if not bits or not bits[0]:
                continue
            original, public = bits[0].strip(), bits[-1].strip()
            kind = 'type' if type_only else local_names.get(original, 'const')
            result[public] = kind
    return result


def pascal(name: str) -> str:
    return name[:1].upper() + name[1:]


def lower_camel(name: str) -> str:
    return name[:1].lower() + name[1:]


def public_default_exports(path: Path):
    text = path.read_text()
    result = []
    for match in re.finditer(r'export\s*\{([^}]+)\}\s*from\s*["\']([^"\']+)["\']', text, re.S):
        result.extend((name, match.group(2)) for name in re.findall(r'default\s+as\s+(\w+)', match.group(1)))
    return result


def upstream_types(target: str) -> set[str]:
    if target.startswith('@mui/'): return set()
    base = UPSTREAM / target.removesuffix('.js')
    candidates = [base.with_suffix('.d.ts')]
    if base.name == 'index':
        candidates += sorted(base.parent.glob('*.d.ts'))
    elif not candidates[0].exists() and base.is_dir():
        candidates = sorted(base.glob('*.d.ts'))
    result = set()
    for path in candidates:
        if not path.exists(): continue
        result.update(re.findall(r'export\s+(?:declare\s+)?(?:interface|type)\s+(\w+)', path.read_text()))
    return result


def export_types_for(name: str, source_names: dict[str, str], target: str) -> list[str]:
    allowed = upstream_types(target)
    return sorted(n for n, kind in source_names.items()
                  if kind in ('interface', 'type') and n in allowed)


def write_barrel(name: str, source_file: str, source_names: dict[str, dict[str, str]], target: str) -> None:
    source = source_names[source_file]
    target_path = ROOT / 'src' / name / 'index.ts'
    target_path.parent.mkdir(parents=True, exist_ok=True)
    is_default_fn = name in source and source[name] in ('function', 'const')
    lines = []
    if is_default_fn:
        lines.append(f"export {{ {name} as default, {name} }} from '../{source_file}';")
    elif name in source and source[name] in ('interface', 'type'):
        lines.append(f"export type {{ {name} }} from '../{source_file}';")
    types = export_types_for(name, source, target)
    if types:
        lines.append(f"export type {{ {', '.join(types)} }} from '../{source_file}';")
    class_const = lower_camel(name) + 'Classes'
    utility = source_names['utility-classes']
    extras = []
    if class_const in utility: extras.append(class_const)
    get_fn = 'get' + pascal(name) + 'UtilityClass'
    if get_fn not in utility:
        plural_get_fn = 'get' + pascal(name) + 'UtilityClasses'
        if plural_get_fn in utility: get_fn = plural_get_fn
    if get_fn in utility: extras.append(get_fn)
    if extras: lines.append(f"export {{ {', '.join(extras)} }} from '../utility-classes';")
    class_types = [t for t in (pascal(name) + 'Classes', pascal(name) + 'ClassKey') if t in utility]
    if class_types: lines.append(f"export type {{ {', '.join(class_types)} }} from '../utility-classes';")
    target_path.write_text('\n'.join(dict.fromkeys(lines)) + '\n')


def main() -> None:
    source_names = {key: decls(path) for key, path in SOURCES.items()}
    write_class_slots()
    symbols: dict[str, str] = {}
    for file, declarations in source_names.items():
        for symbol in declarations: symbols.setdefault(symbol, file)
    index_exports = public_default_exports(UPSTREAM / 'index.d.ts')
    utility_exports = [(name, './utils/' + module.removeprefix('./')) for name, module in public_default_exports(UPSTREAM / 'utils/index.d.ts')]
    style_exports = [(name, './styles/' + module.removeprefix('./')) for name, module in public_default_exports(UPSTREAM / 'styles/index.d.ts')]
    exports = list(index_exports)
    # Utility subpath defaults are available when this Solid implementation has them.
    for name, module in utility_exports + style_exports:
        if name in symbols and (name, module) not in exports:
            exports.append((name, module))
    generated, missing = [], []
    for name, module in exports:
        source_file = symbols.get(name)
        if source_file is None:
            missing.append(name); continue
        write_barrel(name, source_file, source_names, module)
        generated.append(name)
    # composeClasses is a named implementation but upstream exposes it as the package-level alias.
    if 'unstable_composeClasses' in symbols and not any(name == 'unstable_composeClasses' for name, _ in exports):
        write_barrel('unstable_composeClasses', symbols['unstable_composeClasses'], source_names, '@mui/utils/composeClasses')
        generated.append('unstable_composeClasses')
    # The class generator must be importable before any component class maps are evaluated.
    class_name = ROOT / 'src/className/index.ts'
    class_name.parent.mkdir(parents=True, exist_ok=True)
    class_name.write_text("export { unstable_ClassNameGenerator } from '../class-name-generator';\n")
    write_barrel('createMotion', 'motion', source_names, './styles/createMotion')
    print(f"generated {len(set(generated))} entry barrels; unmatched upstream defaults: {', '.join(missing)}")
    write_inventory(source_names, index_exports, generated, missing)


UPSTREAM_TYPE_NAMES = {
    'Breakpoint', 'Breakpoints', 'BreakpointsOptions', 'CSSInterpolation', 'CSSObject',
    'BreakpointOverrides', 'ColorFormat', 'ColorObject', 'CreateMUIStyled', 'CssThemeVariables', 'Direction', 'FocusVisible',
    'Interpolation', 'PropTypes', 'SxProps', 'Theme',
}


def upstream_public_names(path: Path) -> tuple[set[str], set[str]]:
    """Return public runtime and type names, following declaration barrel re-exports."""
    runtime, types, visited = set(), set(), set()
    def visit(current: Path):
        current = current.resolve()
        if current in visited or not current.exists(): return
        visited.add(current)
        text = current.read_text()
        for match in re.finditer(r'export\s+(type\s+)?\{([^}]+)\}\s+from\s+["\']([^"\']+)["\']', text, re.S):
            type_only, block, target = match.groups()
            child = current.parent / target
            if child.suffix in ('.js', '.mjs'): child = child.with_suffix('.d.ts' if child.suffix == '.js' else '.d.mts')
            child_text = child.read_text() if child.exists() else ''
            declared_types = set(re.findall(r'export\s+(?:declare\s+)?(?:interface|type|namespace)\s+(\w+)', child_text))
            for item in re.sub(r'/\*.*?\*/|//[^\n]*', '', block, flags=re.S).split(','):
                bits = re.split(r'\s+as\s+', item.strip())
                if not bits[0]: continue
                original, public = bits[0].strip(), bits[-1].strip()
                if type_only or original in declared_types or public in UPSTREAM_TYPE_NAMES:
                    types.add(public)
                elif public != 'default':
                    # `default as PublicName` is a real runtime export from the barrel.
                    runtime.add(public)
            if '*' in block: visit(child)
        for kind, name in re.findall(r'export\s+(?:declare\s+)?(function|const|interface|type|class|namespace)\s+(\w+)', text):
            (types if kind in ('interface', 'type', 'namespace') else runtime).add(name)
        for target in re.findall(r'export\s+\*\s+from\s+["\']([^"\']+)["\']', text):
            child = current.parent / target
            if child.suffix == '.js': child = child.with_suffix('.d.ts')
            visit(child)
    visit(path)
    return runtime, types


def write_class_slots() -> None:
    text = (ROOT / 'src/utility-classes.ts').read_text()
    entries = []
    pattern = r"generateUtilityClasses\(['\"]([^'\"]+)['\"],\s*\[([^\]]*)\]\s*as const\)"
    for component, slots in re.findall(pattern, text):
        names = re.findall(r"['\"]([^'\"]+)['\"]", slots)
        entries.append((component, names))
    slots_by_component = dict(entries)
    inherited_input_slots = slots_by_component['MuiInputBase']
    entries = [(component, list(dict.fromkeys(inherited_input_slots + slots)) if component in {'MuiInput', 'MuiFilledInput', 'MuiOutlinedInput'} else slots) for component, slots in entries]
    if len(entries) != 118:
        raise RuntimeError(f'expected 118 utility-class maps, parsed {len(entries)}')
    lines = [
        '/** Slot names supported by the generated Material UI v9.5.0 utility class maps. */',
        'export const componentClassSlots: Readonly<Record<string, readonly string[]>> = {',
    ]
    for component, slots in entries:
        lines.append(f"  {component!r}: [{', '.join(repr(slot) for slot in slots)}],")
    lines.extend(['};', ''])
    (ROOT / 'src/class-slots.ts').write_text('\n'.join(lines))


def write_inventory(source_names, index_exports, generated, missing):
    # compatibility/validation implementations are public only through theme/utils;
    # use those actual barrels rather than counting their source files as implicit exports.
    public_sources = {key: value for key, value in source_names.items() if key not in {'compatibility', 'validation', 'input-select-context', 'motion'}}
    local_public = set().union(*(d.keys() for d in public_sources.values()))
    local_types = {name for declarations in public_sources.values() for name, kind in declarations.items() if kind in ('type', 'interface')}
    local_runtime = {name for declarations in public_sources.values() for name, kind in declarations.items() if kind in ('function', 'const', 'class')}
    upstream_defaults = public_default_exports(UPSTREAM / 'index.d.ts')
    root_defaults = sorted({name for name, _ in upstream_defaults if name in local_runtime})
    style_defaults = sorted({name for name, _ in public_default_exports(UPSTREAM / 'styles/index.d.ts') if name in local_runtime})
    utility_defaults = sorted({name for name, _ in public_default_exports(UPSTREAM / 'utils/index.d.ts') if name in local_runtime})
    root_runtime, root_types = upstream_public_names(UPSTREAM / 'index.d.ts')
    root_runtime_missing = sorted(root_runtime - local_runtime)
    root_types_missing = sorted(root_types - local_types)

    def omission_summary(names: list[str], limit: int = 12) -> str:
        if not names: return 'none'
        sample = ', '.join(names[:limit])
        return sample + (f', plus {len(names) - limit} more' if len(names) > limit else '')
    styles_runtime, styles_types = upstream_public_names(UPSTREAM / 'styles/index.d.ts')
    utils_runtime, utils_types = upstream_public_names(UPSTREAM / 'utils/index.d.ts')
    style_runtime_missing = sorted(styles_runtime - local_runtime)
    style_types_missing = sorted(styles_types - local_types)
    utils_runtime_missing = sorted(utils_runtime - local_runtime)
    utils_types_missing = sorted(utils_types - local_types)
    sections = [
        '# API inventory', '',
        'This inventory compares the MUI Material UI v9.5.0 public barrels with the Solid implementation in this repository. Component entry barrels are generated from upstream default exports and available local exports; matching names do not imply React-compatible prop or ref semantics.', '',
        '## Implemented entry points', '',
        f"Generated {len(set(generated))} per-entry barrels. The upstream top-level barrel declares {len(upstream_defaults)} default entries; local implementations are available for {len(root_defaults)} ({len(upstream_defaults) - len(root_defaults)} missing): {', '.join(root_defaults)}.", '',
        f"Across the upstream top-level declaration barrel, local named runtime exports cover {len(root_runtime - set(root_runtime_missing))}/{len(root_runtime)} names and local type exports cover {len(root_types - set(root_types_missing))}/{len(root_types)} names. Missing runtime export examples: {omission_summary(root_runtime_missing)}. Missing type examples: {omission_summary(root_types_missing)}.", '',
        f"Style defaults with local implementations ({len(style_defaults)}): {', '.join(style_defaults)}. Utility defaults with local implementations ({len(utility_defaults)}): {', '.join(utility_defaults)}.", '',
        'Per-component barrels expose each implemented entry as default and named exports, plus local types and utility-class exports when available. The source uses Solid-shaped APIs; component behavior, props, slots, refs, and theme integration are not asserted to match MUI. The root entry remains a separate barrel.', '',
        'Utility-class helpers include `generateUtilityClass`, `generateUtilityClasses`, `unstable_composeClasses`, `unstable_isGlobalState`, `unstable_ClassNameGenerator`, all 118 component maps and their derived `*ClassKey` unions. The internal slot registry includes inherited InputBase slots for Input, FilledInput, and OutlinedInput.', '',
        '## Remaining upstream API omissions', '',
        'Runtime exports and type exports are reported separately. These comparisons include the transitive names exposed by the MUI styles and utils declaration barrels:', '',
        f"- `@mui/material/styles` runtime exports: {', '.join(style_runtime_missing) if style_runtime_missing else 'none detected by name'}.",
        f"- `@mui/material/styles` type exports missing ({len(style_types_missing)}): {omission_summary(style_types_missing)}.",
        f"- `@mui/material/utils` runtime exports: {', '.join(utils_runtime_missing) if utils_runtime_missing else 'none detected by name'}.",
        f"- `@mui/material/utils` type exports missing ({len(utils_types_missing)}): {omission_summary(utils_types_missing)}.",
        f"- Top-level default entry modules with no matching implementation: {', '.join(missing) if missing else 'none'}.", '',
        'This is a name-based export inventory, not a behavioral conformance report. MUI X, Lab-only package exports, and internals outside these Core declaration barrels are not included. See the upstream [Material UI v9.5.0 entry declarations](https://github.com/mui/material-ui/tree/v9.5.0/packages/mui-material), [styles declarations](https://github.com/mui/material-ui/tree/v9.5.0/packages/mui-material/src/styles), and [utils declarations](https://github.com/mui/material-ui/tree/v9.5.0/packages/mui-material/src/utils).', '',
    ]
    (ROOT / 'docs').mkdir(exist_ok=True)
    (ROOT / 'docs/API-INVENTORY.md').write_text('\n'.join(sections))

if __name__ == '__main__': main()
