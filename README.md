<!-- Adapted from spike-html-hosting-icons (8b8d955): README.md, for @standards-lab/web-icons, in
web-foundation's (72e759f) README shape, with spike-html-hosting-sdk's (f49087e) marker fill. -->

# web-icons

The icons of the standards-lab web client stack, and its iconography convention: every web client
and page draws its glyphs from here. Each icon is its own ES module whose default export is one
complete `<svg>` string, so a bundle carries only the icons it imports; and `iconFill()`, a Vite
plugin, fills a page's glyph markers with the same markup in dev and at build. A component imports
an icon's module and renders it with Lit's `unsafeHTML`; a page writes a marker and the plugin
fills it. The package has no runtime dependency, and its one peer, Vite, is optional. It sits on
web-foundation, below web-components and web-app-sdk.

It releases [Octicons](https://github.com/primer/octicons) 19.42.0 alone.

## Install

Each release is a tag, `v<version>`, of
[standards-lab/web-icons](https://github.com/standards-lab/web-icons), whose tree is the package
as `pnpm pack` builds it: `package.json`, this README, the LICENSE, and `dist/`, the build. The
build lives only in the tag's tree, so the tag installs with no build step, and its manifest has no
scripts. Install it by the tag:

```
pnpm add github:standards-lab/web-icons#v0.1.0
bun add github:standards-lab/web-icons#v0.1.0
npm install --allow-git=root github:standards-lab/web-icons#v0.1.0
```

npm 12 refuses git dependencies unless `--allow-git` allows them; `root` allows the ones the
project itself declares. Each GitHub release also carries the tarball.

`vite` (`^8.3.8`) is an optional peer: a project that uses `iconFill()` has Vite already, and one
that imports only icon modules isn't asked for it.

## Use

The package is `@standards-lab/web-icons`.

- `./<set>/<name>`: an icon, imported by its set and its name with no extension, as
  `@standards-lab/web-icons/octicon/x-16`. Its default export is the icon's `<svg>`, a string: 1em
  square on its viewBox, so it takes the text's size; drawn in `currentColor`, so it takes the
  text's color; with `aria-hidden="true"` and `focusable="false"`, so the text or the label beside
  it names it and it never takes focus. Its declaration types it as a string.
- `./vite`: `iconFill()`, the Vite plugin that fills markers, with its declaration.

### In a component

A component imports the icons it draws and renders each with Lit's `unsafeHTML`. The markup is the
package's own, generated at its build, never a reader's input:

```ts
import { LitElement, html } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import x from "@standards-lab/web-icons/octicon/x-16";

class CloseButton extends LitElement {
  render() {
    return html`<button class="glyph-button" aria-label="Close">${unsafeHTML(x)}</button>`;
  }
}
customElements.define("close-button", CloseButton);
```

A Vite build that imports two icons carries exactly their markup and no other icon's.

### In a page

A page writes an empty marker, `<svg data-icon="<set>/<name>"></svg>`, where a glyph goes:

```html
<button class="glyph-button" aria-label="Settings">
  <svg class="glyph" data-icon="octicon/gear-16"></svg>
</button>
<button class="glyph-button" aria-label="Close"><svg data-icon="octicon/x-16"></svg></button>
```

and its `vite.config` adds the plugin:

```ts
import { defineConfig } from "vite";
import { iconFill } from "@standards-lab/web-icons/vite";

export default defineConfig({
  plugins: [iconFill()],
});
```

`iconFill()` replaces each marker in every HTML page Vite serves in dev or writes at build with that
icon's `<svg>`. The marker's `class` carries over to the svg, so a page styles a glyph where it
places it; any other attribute is dropped. A page with no marker passes through unchanged, and a
filled page gains only the icons' markup, never a script. An HTML comment's text is neither filled
nor checked, so a comment may show a marker.

A marker whose name isn't `<set>/<name>`, or whose icon the package doesn't hold, fails with a
message naming the page and the icon; so does an svg holding `data-icon` that isn't an empty,
quoted marker, naming the page and its tag. The build fails with that message, and in dev the
page's request fails with it, so nothing reaches the browser half-filled. The icons come from the
plugin's own package, so the plugin and its icons are always one release.

## Sets and licences

| Set | Import | Licence | Upstream |
| --- | --- | --- | --- |
| [Octicons](https://github.com/primer/octicons) | `octicon/<name>` | MIT | primer/octicons, tag `@primer/octicons@19.42.0` |

A set ships every icon Iconify marks visible, and every alias of a shipped icon, which carries its
parent's markup: Octicons is 803 modules. An icon Iconify marks hidden, such as `alert`, doesn't
ship. From v0.1.0 on, a shipped name keeps resolving in every later release.

The package is Apache-2.0. `sets.json` lists the released sets, each read from its
`@iconify-json/*` devDependency. The generator accepts a set only when shipping its licence text
satisfies the licence: MIT, ISC, Apache-2.0, BSD-2-Clause, BSD-3-Clause, CC0-1.0, or Unlicense. It
refuses any other, CC-BY, CC-BY-SA, and GPL among them, naming the set and its licence, and leaves
`dist/` empty, so no accepted set built before it survives. It also refuses a set whose prefix
isn't its name, and an icon whose name isn't a safe file name or that isn't drawn in
`currentColor`.

`@iconify-json/*` ships no licence text, so each released set's upstream LICENSE is held in
`licenses/<set>/`, byte for byte, and `sets.json` records its sha256 and the upstream repository,
commit, and tag it was fetched from; the build fails when the held LICENSE doesn't match its
sha256. The build ships it as `dist/<set>/LICENSE`, beside `LICENSE.provenance`, the line naming
that repository and commit. Octicons' is primer/octicons' LICENSE at commit `9a274e2`, tag
`@primer/octicons@19.42.0`.

### Adding a set

A set is added in a minor release, by three changes: the set's `@iconify-json/<set>` package as an
exact devDependency; its upstream LICENSE in `licenses/<set>/LICENSE`, byte for byte, fetched at
the upstream tag the package's data follows; and its entry in `sets.json`, naming the package, the
LICENSE's path and sha256, and the repository, commit, and tag it was fetched from. The build then
generates it into `dist/<set>/`, or fails naming the set when its licence isn't one of those above.
The version's minor number moves, as the release adds modules and removes none, and the
CHANGELOG's entry names the set and its licence.

## Glyph source

The glyph data comes from [Iconify](https://iconify.design)'s per-set packages, `@iconify-json/*`,
read at this package's build, never at a consumer's. Iconify is MIT-licensed code from Iconify OÜ,
Estonia. Its data keeps each set's upstream licence, modified by Iconify Tools, and follows each
set's upstream repository, some sets within minutes of an upstream release, others days behind.

Iconify is a single-maintainer risk: one maintainer, cyberalien, made 87% of iconify/iconify's
human commits and 99% of iconify/icon-sets'. The released modules don't depend on it: each is a
plain string, so a release already cut keeps working whatever becomes of Iconify, and only the
next build would need another source of the same set.

## Development

Tasks run through [mise](https://mise.jdx.dev):

```
mise run install      # the pinned tools, and node_modules with the foundation and the tooling at their tags; reads the network
mise run check        # lint, types, the build, and the unit and browser tiers; reads no network
mise run build        # generate sets.json's sets into a fresh dist/, and build the plugin beside them
mise run browse       # serve the browse page on a loopback port and print its URL; Ctrl-C stops it
mise run screenshots  # capture the browse page wide and narrow, light and dark, inline in kitty
mise run currency     # report every tool, package, and action pin, the @iconify-json set, the vite peer's range, and the foundation's and the tooling's tags behind its latest
```

`browse/index.html` is the browse page: every shipped icon, each beside its name, in sections by
set, each section naming the set's licence and its upstream tag. It runs on web-foundation
v0.4.0's full entry, and plain selects for color, scheme, space, and type show the stored choice
and apply and save a change at once; the URL query (`?palette=github&scheme=dark`) sets a profile
before the first paint. It is dev-only: the pack carries `dist/` alone, so the page and what
serves it never ship. `scripts/served.ts` serves it at `/browse/`, with each glyph the built
`dist/<set>/<name>.js`, imported as a consumer imports it, and its catalog made from `sets.json`
and `dist/` at its request.

`mise run screenshots` captures the browse page whole, wide and narrow, light and dark. It runs the
`web-screenshots` bin of [web-tooling](https://github.com/standards-lab/web-tooling), the
devDependency the browser tier's driver and server also come from, over the capture description in
`scripts/screenshots.config.ts`, and passes its arguments on. With none it captures the default
profile; `--palette`, `--space`, and `--type` choose a profile, and `--all` captures every color
and compact and sans. `--output directory --dir <path>` writes the files instead of showing them
in kitty; `mise run screenshots -- --help` lists the other flags, and web-tooling's README
documents them. The check never runs `browse` or `screenshots`, though the browser tier runs the
screenshots command once.

The unit tier runs the generator on fixture sets in Iconify's layout, `test/fixtures/sets/`, the
plugin through two fixture Vite projects as a dev server and as a build, the release rule on the
manifest, and a pack of the build installed into a scratch consumer. The browser tier checks the
browse page in the pinned chrome-headless-shell, in every built-in profile, light and dark, at
1280 and 390 px. The check lints with ESLint, Prettier, shellcheck, and actionlint. CI runs `mise
run install` and the check on each pull request to main and each push to it.

## Release

A release is an annotated `v<version>` tag on a pack commit: a commit, on no branch, whose tree is
the pack, the build included, and whose one parent is main's merge commit. The version is the one
`package.json` gives and `CHANGELOG.md` has a section for. A person cuts the tag by hand once the
check is green on the merge commit, from a clean checkout with the pins installed:

```
git fetch origin && git switch --detach origin/main
mise run check
tag=v$(node -p 'require("./package.json").version')
scratch=$(mktemp -d)
pnpm pack --pack-destination "$scratch"
tar -xzf "$scratch"/*.tgz -C "$scratch"
# The pack's package/ as a tree, through an index of its own, so the checkout's index and
# .gitignore (which ignores dist/) play no part; --force keeps any other ignore rule from
# dropping a file.
GIT_INDEX_FILE="$scratch/index" git --work-tree="$scratch/package" add --all --force .
tree=$(GIT_INDEX_FILE="$scratch/index" git write-tree)
commit=$(git commit-tree "$tree" -p HEAD -m "web-icons $tag")
git tag -a "$tag" -m "web-icons $tag" "$commit"
git push origin "refs/tags/$tag"
gh workflow run release.yml -f tag="$tag"
```

The release workflow is dispatched by hand with the tag, not run by the push: GitHub reads a tag
push's workflows from the tagged tree, and the pack commit's tree holds only the pack, so the
workflow runs from main's copy. It checks that the tag's commit has one parent, a merge commit on
main, whose `package.json` version the tag names; runs the check on that parent; packs it and holds
the tag's tree to the pack, file for file; and creates the GitHub release from the version's
`CHANGELOG.md` section, with the tarball attached. It never cuts a tag, and a pushed tag is never
changed or re-cut.

## Provenance

The package is seeded by copy from spike-html-hosting-icons at 8b8d955: the generator, its tests
and fixture sets, and the browse page and what serves it. The marker fill comes from
spike-html-hosting-sdk at f49087e, its `src/icons.ts`, made a Vite plugin of its own that fills in
dev as well as at build. The scaffold, the workflows, this README's shape, the CHANGELOG, and the
browse page's selects come from web-foundation at 72e759f. Both spikes are archived and never a
dependency. Each copied file that takes comments names its source in a provenance line; the JSON
files' provenance is in `context/README.md`.

## License

[Apache License 2.0](LICENSE). Each icon set keeps its own licence, shipped beside its modules:
Octicons' is [MIT](licenses/octicon/LICENSE).
