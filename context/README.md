# web-icons context

web-icons is the web client stack's icon layer: Octicons (MIT, its LICENSE kept) as one string ES
module per icon, each an SVG sized 1em in `currentColor` and `aria-hidden`, and a Vite plugin that
fills `<svg data-icon="set/name">` markers in dev and build. It is the iconography convention for
every web client and page: a page writes a marker and the plugin fills it; a component imports the
icon's module and renders it with Lit's `unsafeHTML`. It sits above web-foundation and below
web-components and web-app-sdk.

It is a package under the `@standards-lab` scope, starting at v0.1.0 and released by a plain
`vX.Y.Z` tag. Its goals live in the coordinator's roadmap (`standards-lab/roadmap/index.toml`,
v1.client.stack), and its strategy is `standards-lab/context/web-client.md`. README.md's
"Provenance" section names the spikes it is seeded from.

## Release

A person cuts each release by hand: an annotated `vX.Y.Z` tag on a pack commit, whose tree is the
pack and whose one parent is main's merge commit, and then dispatches `release.yml` with the tag.
README.md's "Release" section gives the steps and what the workflow verifies.

## Provenance

Each copied file that takes comments names each of its sources in a provenance line. These files
take none, so their provenance is here:

- `package.json` is adapted from web-foundation (72e759f): package.json. It is renamed
  `@standards-lab/web-icons` at 0.1.0, its exports the icons by `<set>/<name>` and the plugin by
  `vite`, its one peer vite `^8.3.8`, optional, and its devDependencies the generator's
  (`@iconify-json/octicon`, `@iconify/types`, `@iconify/utils`), vite at 8.3.8,
  `@eslint-community/eslint-plugin-eslint-comments` at 4.8.1, and web-foundation v0.4.0 and
  web-tooling v0.1.0 by their `github:` tags.
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

- **Icons** (built): [sets.json](../sets.json) and [licenses/](../licenses/).
- **Generator** (built): [scripts/generate.ts](../scripts/generate.ts) and
  [scripts/build.ts](../scripts/build.ts).
- **Fill** (built): [src/vite.ts](../src/vite.ts).
- **Browse** (built): [browse/](../browse/) and [scripts/served.ts](../scripts/served.ts).
- **Preview** (built): [scripts/preview.ts](../scripts/preview.ts).
- **Release** (built): [test/unit/release.ts](../test/unit/release.ts) and
  [.github/workflows/release.yml](../.github/workflows/release.yml).
