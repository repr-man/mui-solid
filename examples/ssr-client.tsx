import { hydrate } from "@solidjs/web";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import { StyledEngineProvider, createStyleCache } from "../src";
import { ServerGallery } from "./ssr";
const cache = createStyleCache({ key: "mui-ssr" });
hydrate(
  () => (
    <StyledEngineProvider cache={cache}>
      <ServerGallery />
    </StyledEngineProvider>
  ),
  document.getElementById("root")!,
);
