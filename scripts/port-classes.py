#!/usr/bin/env python3
"""Generate MUI 9.5.0 utility classes from an extracted Material UI package."""
from __future__ import annotations
import re
import sys
from pathlib import Path


def matching(text: str, start: int) -> int:
    depth = 0
    quote = None
    escape = False
    i = start
    while i < len(text):
        c = text[i]
        if quote:
            if escape: escape = False
            elif c == "\\": escape = True
            elif c == quote: quote = None
            i += 1; continue
        if text.startswith("//", i):
            end = text.find("\n", i + 2); i = len(text) if end < 0 else end + 1; continue
        if text.startswith("/*", i):
            end = text.find("*/", i + 2); i = len(text) if end < 0 else end + 2; continue
        if c in "'\"`": quote = c
        elif c == "[": depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0: return i
        i += 1
    raise ValueError("unclosed slots array")


def extract(source_root: Path):
    records = {}
    for file in sorted(source_root.rglob("*Classes.mjs")):
        text = file.read_text()
        call = re.search(r"const (\w+Classes)\s*=\s*(?:\{.*?\}\s*;|generateUtilityClasses\()", text, re.S)
        if not call: continue
        fn = re.search(r"export function (get\w+UtilityClass(?:es)?)\(slot\)\s*\{\s*return generateUtilityClass\(['\"]([^'\"]+)['\"], slot\);", text)
        gen = re.search(r"generateUtilityClasses\(['\"]([^'\"]+)['\"],\s*\[", text[call.start():])
        if not gen: raise ValueError(f"missing generateUtilityClasses call: {file}")
        component = gen.group(1)
        bracket = text.find("[", call.start() + gen.end() - 1)
        end = matching(text, bracket)
        slots = re.findall(r"['\"]([A-Za-z][A-Za-z0-9]*)['\"]", text[bracket + 1:end])
        fn_name, fn_component = fn.groups() if fn else (None, None)
        const_name = call.group(1)
        if fn_component and fn_component != component: raise ValueError(f"component mismatch: {file}")
        if const_name in records: raise ValueError(f"duplicate {const_name}")
        inherited = re.search(r"\.\.\.(\w+Classes)", text[call.start():bracket])
        records[const_name] = (fn_name, component, slots, inherited.group(1) if inherited else None)
    return records


def main():
    if len(sys.argv) != 2: raise SystemExit("Usage: port-classes.py /path/to/extracted/material/package")
    records = extract(Path(sys.argv[1]))
    if not records: raise SystemExit("No *Classes.mjs files found")
    ordered = []
    seen = set()
    def visit(name: str) -> None:
        if name in seen: return
        seen.add(name)
        inherited = records[name][3]
        if inherited in records: visit(inherited)
        ordered.append(name)
    for name in records: visit(name)
    lines = [
        "/**",
        " * Utility classes based on MUI Material UI v9.5.0.",
        " * Global state slots use the shared Mui-* names from @mui/utils.",
        " */",
        "import { unstable_ClassNameGenerator } from './class-name-generator';",
        "export { unstable_ClassNameGenerator } from './class-name-generator';",
        "",
        "export const globalStateClasses = {",
        "  active: 'active', checked: 'checked', completed: 'completed', disabled: 'disabled',",
        "  error: 'error', expanded: 'expanded', focused: 'focused', focusVisible: 'focusVisible',",
        "  open: 'open', readOnly: 'readOnly', required: 'required', selected: 'selected',",
        "} as const;",
        "export type GlobalStateClassKey = keyof typeof globalStateClasses;",
        "",
        "export function unstable_isGlobalState(slot: string): slot is GlobalStateClassKey {",
        "  return Object.prototype.hasOwnProperty.call(globalStateClasses, slot);",
        "}",
        "",
        "export function generateUtilityClass(componentName: string, slot: string, globalStatePrefix = 'Mui'): string {",
        "  const globalState = globalStateClasses[slot as GlobalStateClassKey];",
        "  return globalState ? `${globalStatePrefix}-${globalState}` : `${unstable_ClassNameGenerator.generate(componentName)}-${slot}`;",
        "}",
        "",
        "export function generateUtilityClasses<const Slots extends readonly string[]>(componentName: string, slots: Slots): { [K in Slots[number]]: string } {",
        "  const result = {} as { [K in Slots[number]]: string };",
        "  for (const slot of slots) result[slot as Slots[number]] = generateUtilityClass(componentName, slot);",
        "  return result;",
        "}",
        "",
        "export function unstable_composeClasses<Slots extends Record<string, readonly (string | false | null | undefined)[]>>(",
        "  slots: Slots, getUtilityClass: (slot: string) => string, classes?: Partial<Record<string, string>>",
        "): { [K in keyof Slots]: string } {",
        "  const output = {} as { [K in keyof Slots]: string };",
        "  for (const slotName in slots) {",
        "    const composed: string[] = [];",
        "    for (const slot of slots[slotName]) {",
        "      if (!slot) continue;",
        "      composed.push(getUtilityClass(slot));",
        "      if (classes?.[slot]) composed.push(classes[slot]!);",
        "    }",
        "    output[slotName] = composed.join(' ');",
        "  }",
        "  return output;",
        "}",
        "",
    ]
    for const_name in ordered:
        fn_name, component, slots, inherited = records[const_name]
        values = ", ".join(repr(s) for s in slots)
        # Emit upstream slot order and names verbatim.
        if fn_name:
            lines.append(f"export function {fn_name}(slot: string): string {{ return generateUtilityClass('{component}', slot); }}")
        expr = f"/* @__PURE__ */ generateUtilityClasses('{component}', [{values}] as const)"
        if inherited:
            expr = f"{{ ...{inherited}, ...{expr} }}"
        class_interface = const_name[0].upper() + const_name[1:]
        class_key = class_interface.removesuffix("Classes") + "ClassKey"
        lines += [
            f"export const {const_name} = {expr};",
            f"export type {class_interface} = typeof {const_name};",
            f"export type {class_key} = keyof {class_interface};",
            "",
        ]
    Path(__file__).resolve().parent.parent.joinpath("src/utility-classes.ts").write_text("\n".join(lines))
    print(f"generated {len(records)} utility class maps and {sum(len(slots) for _,_,slots,_ in records.values())} declared slots")

if __name__ == "__main__": main()
