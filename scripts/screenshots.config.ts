// Adapted from spike-html-hosting-icons (8b8d955): scripts/screenshots.config.ts, on web-tooling's
// web-screenshots bin and web-foundation's profiles and registry key, without the theme menu's
// captures.
// mise run screenshots' description, which web-tooling's web-screenshots reads: the browse page,
// whole, in tiles, wide and narrow; the profile's facets, palette, space, and type, at zen,
// regular, and mono; --all's profiles, every palette at the defaults, then compact and sans at
// zen; the profiles the page registers, from the foundation's registry; and the page served as the
// browser tier serves it, by scripts/served.ts. The files go to a fresh directory under TMPDIR, or
// to --dir's, never into the repository unless --dir names its gitignored captures/.

import type { DescribedState, Description, Step } from "@standards-lab/web-tooling/screenshots.js";

import { PAGE, served } from "./served.ts";

// A desktop's width, and a phone's.
const WIDE = { width: 1280, height: 800 };
const NARROW = { width: 390, height: 844 };

/** Resolves once the page has every glyph in it. */
const ready: Step = async (page) => {
  await page.evaluate(`window.ready`);
};

const states: DescribedState[] = [
  {
    name: "browse-wide",
    caption: "the browse page, wide",
    viewport: WIDE,
    full: true,
    open: ready,
  },
  {
    name: "browse-narrow",
    caption: "the browse page, narrow",
    viewport: NARROW,
    full: true,
    open: ready,
  },
];

/** The page's registered names, by flag, read from the foundation's store at its well-known
 * global key; its color facet is palette's. */
const REGISTRY = `(() => {
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
  // Every color at the defaults, then the other space and the other type at the default color.
  all: [
    ...["zen", "github", "catppuccin", "everforest"].map((palette) => ({ palette })),
    { space: "compact" },
    { type: "sans" },
  ],
  profiles: (page) => page.evaluate(REGISTRY),
  server: served,
};

export default description;
