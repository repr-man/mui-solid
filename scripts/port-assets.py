#!/usr/bin/env python3
"""Port MUI v9.5.0 palette and Material Icons files to Solid TSX.

Usage: python3 scripts/port-assets.py /path/to/material/package /path/to/icons/package
The input directories are the extracted npm package contents.
"""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path

SVG_ATTRIBUTE_NAMES = {
    # React's DOM prop names for SVG attributes are not the literal SVG names.
    "fillOpacity": "fill-opacity",
    "fillRule": "fill-rule",
    # SVG 2 removed the xlink namespace; href is the current equivalent.
    "xlinkHref": "href",
    "clipRule": "clip-rule",
    "strokeWidth": "stroke-width",
    "strokeLinecap": "stroke-linecap",
    "strokeLinejoin": "stroke-linejoin",
    "strokeOpacity": "stroke-opacity",
    "strokeDasharray": "stroke-dasharray",
    "strokeDashoffset": "stroke-dashoffset",
}


def split_top(text: str, delimiter: str = ",") -> list[str]:
    parts, start = [], 0
    stack = []
    quote = None
    escaped = False
    i = 0
    while i < len(text):
        c = text[i]
        if quote:
            if escaped: escaped = False
            elif c == "\\": escaped = True
            elif c == quote: quote = None
            i += 1; continue
        if text.startswith("/*", i):
            end = text.find("*/", i + 2)
            i = len(text) if end < 0 else end + 2; continue
        if text.startswith("//", i):
            end = text.find("\n", i + 2)
            i = len(text) if end < 0 else end + 1; continue
        if c in "'\"`": quote = c
        elif c in "([{": stack.append({"(": ")", "[": "]", "{": "}"}[c])
        elif c in ")]}":
            if stack and stack[-1] == c: stack.pop()
        elif c == delimiter and not stack:
            parts.append(text[start:i].strip()); start = i + 1
        i += 1
    parts.append(text[start:].strip())
    return [p for p in parts if p]


def matching(text: str, start: int) -> int:
    pairs = {"(": ")", "[": "]", "{": "}"}
    opening = text[start]
    stack = [pairs[opening]]
    quote = None; escaped = False; i = start + 1
    while i < len(text):
        c = text[i]
        if quote:
            if escaped: escaped = False
            elif c == "\\": escaped = True
            elif c == quote: quote = None
            i += 1; continue
        if text.startswith("/*", i):
            end = text.find("*/", i + 2); i = len(text) if end < 0 else end + 2; continue
        if text.startswith("//", i):
            end = text.find("\n", i + 2); i = len(text) if end < 0 else end + 1; continue
        if c in "'\"`": quote = c
        elif c in pairs: stack.append(pairs[c])
        elif c in ")]}" and stack and c == stack[-1]:
            stack.pop()
            if not stack: return i
        i += 1
    raise ValueError(f"unclosed expression near {text[start:start+50]!r}")


def jsx_call(expr: str) -> tuple[str, str, str]:
    expr = re.sub(r"^/\*.*?\*/\s*", "", expr.strip(), flags=re.S)
    m = re.match(r"(_jsx|_jsxs)\s*\(", expr)
    if not m: raise ValueError(f"unsupported SVG expression {expr[:80]!r}")
    op = expr.find("(", m.start())
    end = matching(expr, op)
    args = split_top(expr[op + 1:end])
    tag = "React.Fragment" if args[0].strip() == "React.Fragment" else json.loads(args[0])
    props = args[1]
    if not (props.startswith("{") and matching(props, 0) == len(props) - 1):
        raise ValueError(f"unexpected JSX props {props[:80]!r}")
    return tag, props[1:-1], args[2] if len(args) > 2 else ""


def js_expr_to_jsx(value: str) -> str:
    value = re.sub(r"^/\*.*?\*/\s*", "", value.strip(), flags=re.S)
    if value.startswith("[") and matching(value, 0) == len(value) - 1:
        children = "".join(render(v) for v in split_top(value[1:-1]))
        return f"<> {children} </>"
    if re.match(r"^_jsx(?:s)?\s*\(", value): return render(value)
    return "{" + value + "}"


def render(expr: str) -> str:
    tag, props_text, _key = jsx_call(expr)
    attrs, children = [], None
    for prop in split_top(props_text):
        pair = split_top(prop, ":")
        if len(pair) < 2: raise ValueError(f"unsupported JSX prop {prop!r}")
        key = pair[0].strip().strip("\"'")
        key = SVG_ATTRIBUTE_NAMES.get(key, key)
        val = ":".join(pair[1:]).strip()
        if key == "children": children = val; continue
        if val.startswith("\"") or val.startswith("'"):
            # JSX string attribute, preserving the exact decoded value.
            decoded = json.loads(val) if val.startswith('"') else bytes(val[1:-1], "utf8").decode("unicode_escape")
            attrs.append(f"{key}={json.dumps(decoded, ensure_ascii=False)}")
        elif val == "true": attrs.append(key)
        elif val == "false": attrs.append(f"{key}={{false}}")
        else: attrs.append(f"{key}={{{val}}}")
    if tag == "React.Fragment":
        if attrs: raise ValueError("fragment with attributes")
        if children is None: return "<></>"
        if children.startswith("["):
            child_text = "".join(render(v) for v in split_top(children[1:-1]))
        else: child_text = js_expr_to_jsx(children)
        return f"<>{child_text}</>"
    attr_text = (" " + " ".join(attrs)) if attrs else ""
    if children is None: return f"<{tag}{attr_text} />"
    if children.startswith("["):
        child_text = "".join(render(v) for v in split_top(children[1:-1]))
    else: child_text = js_expr_to_jsx(children)
    return f"<{tag}{attr_text}>{child_text}</{tag}>"


def port_colors(package: Path, out: Path) -> int:
    source = package / "colors"
    files = sorted(source.glob("*.mjs"))
    names = []
    for file in files:
        name = file.stem
        if name == "index": continue
        text = file.read_text()
        text = re.sub(r"const " + re.escape(name) + r" = \{", "const " + name + " = {", text, count=1)
        text = text.replace("};\nexport default " + name + ";", "} as const;\nexport default " + name + ";")
        (out / f"{name}.ts").write_text(text)
        names.append(name)
    (out / "index.ts").write_text("\n".join(f"export {{ default as {n} }} from './{n}';" for n in names) + "\n")
    return len(names)


def port_icons(package: Path, out: Path) -> tuple[int, list[str]]:
    files = sorted(f for f in package.glob("*.mjs") if f.stem != "index" and f.stem[:1].isupper())
    names, failures = [], []
    for file in files:
        name = file.stem
        source = file.read_text()
        match = re.search(r"export default createSvgIcon\((.*),\s*(['\"])(.*?)\2\);\s*$", source, re.S)
        if not match:
            failures.append(f"{name}: no standard createSvgIcon export"); continue
        svg_expr, upstream_name = match.group(1).strip(), match.group(3)
        if upstream_name != name:
            failures.append(f"{name}: export name mismatch ({upstream_name})"); continue
        try:
            jsx = js_expr_to_jsx(svg_expr)
        except Exception as e:
            failures.append(f"{name}: {e}"); continue
        content = f"import {{ createSvgIcon }} from '../display';\n\nconst {name} = /* @__PURE__ */ createSvgIcon(() => {jsx}, '{name}');\n\nexport default {name};\n"
        (out / f"{name}.tsx").write_text(content)
        names.append(name)
    (out / "index.ts").write_text("\n".join(f"export {{ default as {n} }} from './{n}';" for n in names) + "\n")
    return len(names), failures


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    root = Path(__file__).resolve().parent.parent
    colors = port_colors(Path(sys.argv[1]), root / "src/colors")
    icons, failures = port_icons(Path(sys.argv[2]), root / "src/icons")
    print(f"ported {colors} color modules and {icons} icons")
    if failures:
        print(f"unsupported conversions: {len(failures)}")
        print("\n".join(failures[:100]))
        raise SystemExit(1)

if __name__ == "__main__": main()
