import { readdir, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { transformAsync } from "@babel/core";
import solid from "@solidjs/babel-plugin";
import ts from "typescript";

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)),
    );
  });
}
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? files(path.join(directory, entry.name))
          : path.join(directory, entry.name),
      ),
    )
  ).flat();
}
await rm("dist", { recursive: true, force: true });
await run(process.execPath, [
  "node_modules/typescript/bin/tsc",
  "-p",
  "tsconfig.build.json",
]);
const sources = (await files("src")).filter((file) => /\.tsx?$/.test(file));
const sourceSet = new Set(sources);
const renderers = [
  ["dist", "dom"],
  ["dist/server", "ssr"],
];
// Create each output directory once, rather than twice for every icon module.
await Promise.all(
  [...new Set(sources.map((file) => path.dirname(path.relative("src", file))))]
    .flatMap((directory) =>
      renderers.map(([root]) =>
        mkdir(path.join(root, directory), { recursive: true }),
      ),
    ),
);
function resolveImports(source, file) {
  return source.replace(
    /(from\s+|import\s*\(\s*|import\s*)(['"])(\.[^'"]+)\2/g,
    (_, prefix, quote, relative) => {
      if (/\.(js|json|css)$/.test(relative))
        return `${prefix}${quote}${relative}${quote}`;
      const resolved = path.normalize(path.join(path.dirname(file), relative));
      const isDirectory = sourceSet.has(path.join(resolved, "index.ts"));
      return `${prefix}${quote}${relative}${isDirectory ? "/index" : ""}.js${quote}`;
    },
  );
}
async function compile(file) {
  const original = await readFile(file, "utf8");
  // Erase types once. JSX is preserved for each renderer's Solid compiler pass.
  const javascript = ts.transpileModule(original, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2023,
      jsx: ts.JsxEmit.Preserve,
    },
    fileName: file,
  }).outputText;
  for (const [directory, generate] of renderers) {
    const output = path
      .join(directory, path.relative("src", file))
      .replace(/\.tsx?$/, ".js");
    let source = javascript;
    // Each renderer receives its own compiled templates.
    if (file.endsWith(".tsx")) {
      source = (
        await transformAsync(source, {
          filename: file,
          plugins: [
            [
              solid,
              {
                generate,
                moduleName: "@solidjs/web",
                dev: false,
                hydratable: true,
              },
            ],
          ],
          parserOpts: { plugins: ["jsx"] },
          babelrc: false,
          configFile: false,
        })
      ).code;
    }
    await writeFile(output, resolveImports(source, file));
  }
}
// Bound concurrent file operations while keeping the icon build's memory usage small.
for (let offset = 0; offset < sources.length; offset += 32) {
  await Promise.all(sources.slice(offset, offset + 32).map(compile));
  if (offset % 1024 === 0)
    console.log(
      `Compiled ${Math.min(offset + 32, sources.length)} / ${sources.length} source modules`,
    );
}
for (const declaration of (await files("dist")).filter((file) =>
  file.endsWith(".d.ts"),
)) {
  const sourceFile = path
    .join("src", path.relative("dist", declaration))
    .replace(/\.d\.ts$/, ".ts");
  await writeFile(
    declaration,
    resolveImports(await readFile(declaration, "utf8"), sourceFile),
  );
}
console.log(
  `Built ${sources.length} modules for browser and server, with TypeScript declarations.`,
);
