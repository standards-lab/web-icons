// The fixture Vite project: a consumer of the package by its name, as an app installs it, with the
// marker fill on its two pages and two icons imported by module in its script.
// test/unit/vite.test.ts runs it as a dev server and as a build.

import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { iconFill } from "@standards-lab/web-icons/vite";

const page = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [iconFill()],
  build: { rolldownOptions: { input: [page("./index.html"), page("./pages/help.html")] } },
});
