import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { iconFill } from "@standards-lab/web-icons/vite";

const page = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [iconFill()],
  build: { rolldownOptions: { input: [page("./index.html"), page("./pages/help.html")] } },
});
