# web-icons context

web-icons is the web client stack's icon layer: Octicons (MIT, its LICENSE kept) as one string ES
module per icon, each an SVG sized 1em in `currentColor` and `aria-hidden`, and a Vite plugin that
fills `<svg data-icon="set/name">` markers in dev and build. It is the iconography convention for
every web client and page: a page writes a marker and the plugin fills it; a component imports the
icon's module and renders it with Lit's `unsafeHTML`. It sits above web-foundation and below
web-components.

It is a package under the `@standards-lab` scope, released by a plain `vX.Y.Z` tag. Its goals live
in the coordinator's roadmap (`standards-lab/roadmap/index.toml`, v1.client.stack), and its
strategy is `standards-lab/context/web-client.md`.

## Release

A person cuts each release by hand: an annotated `vX.Y.Z` tag on a pack commit, whose tree is the
pack and whose one parent is main's merge commit, and then dispatches `release.yml` with the tag.
README.md's "Release" section gives the steps and what the workflow verifies.

## Provenance

The lineage of its files is in the workspace's [references catalog](https://github.com/standards-lab/org/blob/main/references.md).

`licenses/octicon/LICENSE` is primer/octicons' LICENSE at commit 9a274e2 (tag
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
- **Shipped-name check** (planned): [shipped-names.md](shipped-names.md).
