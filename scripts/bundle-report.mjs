import { build } from "vite";
import { gzipSync } from "node:zlib";
import path from "node:path";

// Build representative consumer imports in memory and report delivered JS size.
// Run after the library build; no application code is executed.
const entries = {
  Button: ["Button/index.js", "Button"],
  Box: ["Box/index.js", "Box"],
  TextField: ["TextField/index.js", "TextField"],
  SvgIcon: ["SvgIcon/index.js", "SvgIcon"],
  Save: ["icons/Save.js", "default"],
  SaveBarrel: ["icons/index.js", "Save"],
  deepmerge: ["theme.js", "deepmerge"],
};

const report = [];
for (const [name, [file, exported]] of Object.entries(entries)) {
  const input = path.resolve("dist", file);
  const result = await build({
    configFile: false,
    logLevel: "silent",
    plugins: [{
      name: "consumer-entry",
      resolveId: (id) => id === "mui-consumer" ? "\0mui-consumer" : undefined,
      load: (id) => id === "\0mui-consumer"
        ? `export { ${exported} as ${name} } from ${JSON.stringify(input)};`
        : undefined,
    }],
    build: {
      write: false,
      minify: true,
      target: "esnext",
      rolldownOptions: {
        input: "mui-consumer",
        preserveEntrySignatures: "strict",
        output: { format: "es" },
      },
    },
  });
  const chunks = (Array.isArray(result) ? result : [result])
    .flatMap((output) => output.output)
    .filter((item) => item.type === "chunk");
  report.push({
    import: name,
    bytes: chunks.reduce((total, chunk) => total + Buffer.byteLength(chunk.code), 0),
    gzip: chunks.reduce((total, chunk) => total + gzipSync(chunk.code).length, 0),
  });
}
console.table(report);
