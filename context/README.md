# web-icons context

web-icons is the web client stack's icon layer: Octicons (MIT, its LICENSE kept) as one string ES
module per icon, each an SVG sized 1em in `currentColor` and `aria-hidden`, and a Vite plugin that
fills `<svg data-icon="set/name">` markers in dev and build. It is the iconography convention for
every web client and page: a page writes a marker and the plugin fills it; a component imports the
icon's module and renders it with Lit's `unsafeHTML`. It sits above web-foundation and below
web-components and web-app-sdk.

It is a package under the `@standards-lab` scope, starting at v0.1.0 and released by a plain
`vX.Y.Z` tag. Its goals live in the coordinator's roadmap (`standards-lab/context/roadmap.toml`,
v1.client.stack), and its strategy is `standards-lab/context/web-client.md`. Its first task,
v1.client.stack's `icons`, seeds it by copy from spike-html-hosting-icons at 8b8d955, and its fill
from spike-html-hosting-sdk's `src/icons.ts`, with a provenance line on every copied file; the
spikes are archived and never a dependency.

## Capability map

- **Icons**: Octicons 19.42.0, one string ES module per icon.
- **Fill**: the Vite plugin that fills `data-icon` markers, in dev and build.
- **Browse**: a page, on web-foundation v0.4.0, that shows every icon by name.
