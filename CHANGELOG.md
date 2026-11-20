<!-- Adapted from web-foundation (72e759f): CHANGELOG.md, for @standards-lab/web-icons, with none
of web-foundation's versions. -->

# Changelog

All notable changes to `@standards-lab/web-icons` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-20

### Added

- The icons package, seeded by copy from spike-html-hosting-icons (8b8d955), its marker fill from
  spike-html-hosting-sdk (f49087e). It has no runtime dependency and no install script; its build
  generates the icon modules from Iconify's `@iconify-json/*` sets, and tsc builds the plugin
  beside them, into `dist/`.
- Octicons 19.42.0, MIT, as `octicon/<name>`: 803 modules, the 780 icons Iconify's
  `@iconify-json/octicon` 1.2.40 marks visible and the 23 aliases of a shipped icon, `question-16`,
  `gear-16`, and `x-16` among them. Each is its own module, imported by set and name with no
  extension, whose default export is one complete `<svg>` string, 1em square, drawn in
  `currentColor`, `aria-hidden="true"` and `focusable="false"`, with a declaration that types it as
  a string. Octicons' LICENSE ships beside its modules byte for byte, as primer/octicons has it at
  commit 9a274e2, with `LICENSE.provenance` naming that repository and commit.
- `iconFill()`, from `@standards-lab/web-icons/vite`: a Vite plugin that fills each empty
  `<svg data-icon="<set>/<name>"></svg>` marker in every HTML page Vite serves in dev or writes at
  build with that icon's svg, the marker's `class` carried over. A malformed marker or an unknown
  icon fails the build, or the page's request in dev, naming the page and the icon. `vite`
  `^8.3.8` is its optional peer.
- The licence gate: the generator accepts a set only under MIT, ISC, Apache-2.0, BSD-2-Clause,
  BSD-3-Clause, CC0-1.0, or Unlicense, with its upstream LICENSE held at a recorded sha256, and
  refuses any other, naming the set and its licence and leaving the build empty.
- The browse page, dev-only and never packed: every shipped icon by name, in sections by set, on
  web-foundation v0.4.0's full entry with plain selects for color, scheme, space, and type.
- The browser tier on `@standards-lab/web-tooling` v0.1.0, its driver, server, and screenshot
  command, in a pinned chrome-headless-shell.
- Releases by tag: each `v<version>` tag marks a pack commit whose tree is the pack, the build
  included, and whose one parent is main's merge commit; its GitHub release carries the tarball.

[0.1.0]: https://github.com/standards-lab/web-icons/releases/tag/v0.1.0
