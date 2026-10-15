import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import { unstable_ClassNameGenerator } from "../src/className";

// Configure before loading components so utility maps and internal selectors agree.
const prefix = new URLSearchParams(window.location.search).get("prefix");
if (prefix)
  unstable_ClassNameGenerator.configure((name) => `${prefix}-${name}`);
const { mountReorderExample } = await import("./reorder");
mountReorderExample(document.getElementById("root")!);
