// Adapted from spike-html-hosting-icons (8b8d955): scripts/screenshots.config.ts, on web-tooling's web-screenshots, without the theme menu's captures.
// mise run screenshots' description, which web-tooling's web-screenshots reads: the browse page,
// whole, in tiles, wide and narrow; the profile's facets, palette, space, and type, at zen,
// regular, and mono; --all's profiles, every palette at the defaults, then compact and sans at
// zen; the profiles the page registers, from the foundation's registry; and the page served as the
// browser tier serves it, by scripts/served.ts.

import type { DescribedState, Description, Step } from "@standards-lab/web-tooling/screenshots.js";

import { PAGE, served } from "./served.ts";

const WIDE = { width: 1280, height: 800 };
const NARROW = { width: 390, height: 844 };

const everyGlyphInThePage: Step = async (page) => {
  await page.evaluate(`window.ready`);
};

const states: DescribedState[] = [
  {
    name: "browse-wide",
    caption: "the browse page, wide",
    viewport: WIDE,
    full: true,
    open: everyGlyphInThePage,
  },
  {
    name: "browse-narrow",
    caption: "the browse page, narrow",
    viewport: NARROW,
    full: true,
    open: everyGlyphInThePage,
  },
];

const REGISTERED_PROFILES_BY_FLAG = `(() => {
  const store = globalThis[Symbol.for("web-foundation.registry")] ?? {};
  return { palette: store.color ?? [], space: store.space ?? [], type: store.type ?? [] };
})()`;

const description: Description = {
  pages: [{ name: "browse", caption: "the browse page", path: PAGE, states }],
  facets: [
    { flag: "palette", attribute: "data-palette", default: "zen" },
    { flag: "space", attribute: "data-space", default: "regular" },
    { flag: "type", attribute: "data-type", default: "mono" },
  ],
  all: [
    ...["zen", "github", "catppuccin", "everforest"].map((palette) => ({ palette })),
    { space: "compact" },
    { type: "sans" },
  ],
  profiles: (page) => page.evaluate(REGISTERED_PROFILES_BY_FLAG),
  server: served,
};

export default description;
