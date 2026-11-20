# web-icons context

web-icons is the web client stack's icon layer: Octicons (MIT, its LICENSE kept) as one string ES
module per icon, each an SVG sized 1em in `currentColor` and `aria-hidden`, and a Vite plugin that
fills `<svg data-icon="set/name">` markers in dev and build. It is the iconography convention for
every web client and page: a page writes a marker and the plugin fills it; a component imports the
icon's module and renders it with Lit's `unsafeHTML`. It sits above web-foundation and below
web-components and web-app-sdk.

It is a package under the `@standards-lab` scope, starting at v0.1.0 and released by a plain
`vX.Y.Z` tag. Its goals live in the coordinator's roadmap (`standards-lab/context/roadmap.toml`,
v1.client.stack), and its strategy is `standards-lab/context/web-client.md`. README.md's
"Provenance" section names the spikes it is seeded from.

## Release

A person cuts each release by hand: an annotated `vX.Y.Z` tag on a pack commit, whose tree is the
pack and whose one parent is main's merge commit, and then dispatches `release.yml` with the tag.
README.md's "Release" section gives the steps and what the workflow verifies.

## Provenance

Each copied file that takes comments names its source in a provenance line. These files take none,
so their provenance is here:

- `package.json` is adapted from web-foundation (72e759f): package.json. It is renamed
  `@standards-lab/web-icons` at 0.1.0, its exports the icons by `<set>/<name>` and the plugin by
  `vite`, its one peer vite `^8.3.8`, optional, and its devDependencies the generator's
  (`@iconify-json/octicon`, `@iconify/types`, `@iconify/utils`), vite at 8.3.8, and web-foundation
  v0.4.0 and web-tooling v0.1.0 by their `github:` tags.
- `.prettierrc.json` is from web-foundation (72e759f): .prettierrc.json.
- `pnpm-lock.yaml` is generated, by `pnpm install` on the pins web-foundation (72e759f) carries,
  and the icons' own.
- `sets.json` is from spike-html-hosting-icons (8b8d955): sets.json, recording
  `licenses/octicon/LICENSE`'s sha256 and its source.
- `test/fixtures/sets/tiny/info.json`, `test/fixtures/sets/tiny/LICENSE`,
  `test/fixtures/sets/attrib/icons.json`, and `test/fixtures/sets/attrib/info.json` are from
  spike-html-hosting-icons (8b8d955), the generator's fixture sets in `@iconify-json`'s layout.
- `test/fixtures/sets/tiny/icons.json` is adapted from spike-html-hosting-icons (8b8d955):
  test/fixtures/sets/tiny/icons.json, with `halo`, an alias of a hidden icon, which doesn't ship.
- `licenses/octicon/LICENSE` is primer/octicons' LICENSE at commit 9a274e2 (tag
  `@primer/octicons@19.42.0`), byte for byte, recorded in `sets.json` and shipped beside the
  modules with `LICENSE.provenance`, which the build writes.

## Capability map

- **Icons**: Octicons 19.42.0, from Iconify's `@iconify-json/octicon` 1.2.40, one string ES module
  per icon with its declaration: 803 modules, the 780 icons Iconify marks visible and the 23
  aliases of a shipped icon, imported as `octicon/<name>`. An alias takes its parent's hidden flag
  unless it sets its own. A shipped name keeps resolving in every later release (STANDARDS.md,
  "Icons"); no test enforces it yet.
- **Generator**: `scripts/generate.ts`, run by `scripts/build.ts` on the sets `sets.json` lists,
  into a fresh `dist/`. The licence gate accepts MIT, ISC, Apache-2.0, BSD-2-Clause,
  BSD-3-Clause, CC0-1.0, and Unlicense, and refuses any other set, a set whose prefix isn't its
  name, and an icon whose name isn't a safe file name or isn't drawn in `currentColor`, leaving
  `dist/` empty. Each set's held LICENSE, checked against its sha256, ships beside its modules
  with `LICENSE.provenance`.
- **Fill**: `iconFill()`, from `@standards-lab/web-icons/vite` (`src/vite.ts`): a Vite plugin
  that fills `data-icon` markers in every HTML page, in dev and at build, the marker's class
  carried over, and fails the page naming it and the icon on a malformed marker or an unknown
  icon. It runs before Vite's own HTML transforms and loads each icon from the module beside it in
  its own package.
- **Browse**: `browse/`, a dev-only page on web-foundation v0.4.0's full entry, served by
  `scripts/served.ts`, that shows every shipped icon by name in sections by set. Its plain selects
  for color, scheme, space, and type show the root's profile; the foundation loads through an
  import map from `/deps/`. `mise run screenshots` captures it, wide and narrow, light and dark.
- **Preview**: README.md's `<picture>`, `docs/preview-light.png` and `docs/preview-dark.png`, the
  browse page's first wide tile at the default profile, picked by `prefers-color-scheme`.
  `mise run preview` (`scripts/preview.ts`) regenerates them by hand from the screenshots
  command's capture; the check never writes them, and the pack never carries `docs/`.
- **Release**: the release rule (`test/unit/release.ts`), which checks the manifest's form and
  relations and the LICENSE; the pack test on an installed pack; and `release.yml`, which verifies
  a hand-cut tag and publishes it. `mise run currency` reports each pin behind its latest.
