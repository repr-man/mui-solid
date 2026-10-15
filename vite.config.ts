import { defineConfig } from "vite";
import solid from "@solidjs/vite-plugin";
import type { Plugin } from "vite";

/** A real server-rendered gallery route, hydrated with the browser compiler output. */
const serverGallery: Plugin = {
  name: "material-server-gallery",
  configureServer(server) {
    server.middlewares.use("/ssr", async (request, response, next) => {
      if (
        request.method !== "GET" ||
        (request.url !== "" &&
          request.url !== "/" &&
          !request.url?.startsWith("?"))
      ) {
        next();
        return;
      }
      try {
        const { renderServerPage } =
          await server.ssrLoadModule("/examples/ssr.tsx");
        const { markup, styles, hydrationScript } = renderServerPage();
        const html = await server.transformIndexHtml(
          "/ssr",
          `<!doctype html><html lang="en"><head><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27%231976d2%27 d=%27M12 2 2 7l10 5 10-5-10-5Zm-8 9-2 1 10 5 10-5-2-1-8 4-8-4Zm0 5-2 1 10 5 10-5-2-1-8 4-8-4Z%27/%3E%3C/svg%3E"/><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Material workspace · Server rendering</title>${styles}${hydrationScript}</head><body><main id="root">${markup}</main><script type="module" src="/examples/ssr-client.tsx"></script></body></html>`,
        );
        response.statusCode = 200;
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.end(html);
      } catch (error) {
        if (error instanceof Error) server.ssrFixStacktrace(error);
        next(error);
      }
    });
  },
};
export default defineConfig({
  plugins: [solid({ ssr: true }), serverGallery],
  build: {
    outDir: "demo-dist",
    rolldownOptions: {
      input: { gallery: "index.html", reorder: "examples/reorder.html" },
    },
  },
});
