// The fixture Vite project whose page names an icon the package doesn't hold, which fails its
// build and its page's request in dev. test/unit/vite.test.ts runs it.

import { defineConfig } from "vite";
import { iconFill } from "@standards-lab/web-icons/vite";

export default defineConfig({ plugins: [iconFill()] });
