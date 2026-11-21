# Development

Tasks run through [mise](https://mise.jdx.dev):

```
mise run install      # the pinned tools, and node_modules with the foundation and the tooling at their tags; reads the network
mise run check        # lint, lint-context, lint-references, types, the build, and the unit and browser tiers; reads no network
mise run build        # generate sets.json's sets into a fresh dist/, and build the plugin beside them
mise run browse       # serve the browse page on a loopback port and print its URL; Ctrl-C stops it
mise run screenshots  # capture the browse page wide and narrow, light and dark, inline in kitty
mise run preview      # regenerate the README's preview, docs/preview-light.png and docs/preview-dark.png
mise run currency     # report every tool, package, and action pin, the @iconify-json set, the vite peer's range, and the foundation's and the tooling's tags behind its latest
```

`browse/index.html` is the browse page: every shipped icon, each beside its name, in sections by
set, each section naming the set's licence and its upstream tag. It runs on web-foundation
v0.4.0's full entry. Plain selects for color, scheme, space, and type show the profile the page's
root carries, so they follow the stored choice, the URL query (`?palette=github&scheme=dark`, set
before the first paint), and another tab's save; a change applies and saves at once. It is
dev-only: the pack carries `dist/` alone, so the page and what serves it never ship.
`scripts/served.ts` serves it at `/browse/`, with each glyph the built `dist/<set>/<name>.js`,
imported as a consumer imports it; the foundation under `/deps/`, which the page's import map
names; and the catalog, made from `sets.json` and `dist/` at each request.

`mise run screenshots` captures the browse page whole, wide and narrow, light and dark. It runs the
`web-screenshots` bin of [web-tooling](https://github.com/standards-lab/web-tooling), the
devDependency the browser tier's driver and server also come from, over the capture description in
`scripts/screenshots.config.ts`, and passes its arguments on. With none it captures the default
profile; `--palette`, `--space`, and `--type` choose a profile, and `--all` captures every color
and compact and sans. `--output directory --dir <path>` writes the files instead of showing them
in kitty; `mise run screenshots -- --help` lists the other flags, and web-tooling's README
documents them. The check never runs `browse` or `screenshots`, though the browser tier runs the
screenshots command once.

`mise run preview` regenerates the preview at the top of the README, `docs/preview-light.png` and
`docs/preview-dark.png`: the browse page's first wide tile, 1280 px wide and at most 1200 px tall,
at the default profile, light and dark. It runs the screenshots command over the same description,
into a scratch directory it removes, and copies those two tiles; given a directory, it writes them
there instead. Run it, and commit the two files, when the browse page's look changes. `docs/` is
never packed, so the images stay out of the release; the README links them from `main` by
absolute URL, so they show at a release tag and in an installed package too. The browser tier runs the script once, into a
scratch directory, and holds each image to its scheme's first wide tile.

The unit tier runs the generator on fixture sets in Iconify's layout, `test/fixtures/sets/`, the
plugin through two fixture Vite projects as a dev server and as a build, the release rule on the
manifest, and a pack of the build installed into a scratch consumer. The browser tier checks the
browse page in the pinned chrome-headless-shell, in every built-in profile, light and dark, at
1280 and 390 px. The check lints with ESLint, Prettier, shellcheck, actionlint, and marathon's
lint-context and lint-references. CI runs `mise run install` and the check on each pull request to
main and each push to it.
