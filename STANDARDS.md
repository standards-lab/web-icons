<!-- Adapted from spike-html-hosting-icons (8b8d955): STANDARDS.md, for @standards-lab/web-icons
and its hand-cut releases, in web-foundation's (72e759f) STANDARDS.md shape. -->

# web-icons standards

The judgement calls the standards-reviewer applies to web-icons, beyond what `mise run check`
enforces: each one line, with a pointer to the architecture page that applies where one does. What
the check enforces is never restated here. The `standard` task points them at the Web Elemental
standard once it is founded (`standards-lab/context/web-client.md`, "Toward Web Elemental").

The architecture pages that apply, in the architecture repository:

- `architecture/principles/minimal-footprint.md`: no runtime dependency, Vite an optional peer,
  and each devDependency deliberate; a consumer installs the tag with no build step, and a bundle
  carries only the icons it imports.
- `architecture/principles/rolling-currency.md`: every tool, package, and action pin explicit and
  at its latest, the `@iconify-json` sets among them, and the optional peer's range admitting
  Vite's latest release.
- `architecture/principles/independent-releases.md`: the package releases on its own tags.
- `architecture/principles/downward-dependencies.md`: the icons sit on the foundation, below the
  components and the SDK, and import nothing above them; only the dev-only browse page loads the
  foundation.
- `architecture/principles/validation-first.md`: the generator checks a set's licence, prefix, and
  icon names before it writes a module, and the fill checks every marker before a page is served.

## Icons

- An icon is a plain string module generated at this package's build, never at a consumer's: no
  icon module imports anything, and no runtime reads Iconify.
- A shipped name is a public API: once released it keeps resolving in every later release, and a
  release never drops or renames one, even in a major version.
- A set ships only under a licence that shipping its text satisfies; a set whose licence asks for
  attribution where an icon is shown, or for the work's own licence, is never added, whatever its
  glyphs.
- A held LICENSE is the upstream's byte for byte, fetched at the tag its `@iconify-json` package
  follows, and moves only with that package's pin.
- A new set is a minor release, named with its licence in the CHANGELOG (README.md, "Adding a
  set").
- An icon names nothing and takes no focus; the text or label beside a glyph names it, and the
  fill adds no accessible name.

## Fill

- The fill is a build-time transform of HTML alone: it adds markup, never a script, and the icons
  it fills are its own package's, so the plugin and its icons are one release.
- A fill failure fails the page loudly, in dev and at build, naming the page; a marker is never
  left empty or half-filled.

## Design

- web-foundation v0.4.0 is the browse page's visual baseline: native elements keep its styling,
  and every built-in profile renders as it does there.
- Focus is always visible, motion honours reduced motion, and spacing comes from the foundation's
  tokens, never a literal.
- A UI task's session brief carries the browse page's screenshots per profile (`mise run
  screenshots --all`); the architect's acceptance is the design review.

## Package

- The package is `@standards-lab/web-icons`, the icon layer of the web client stack
  (`architecture/principles/minimal-footprint.md`).
- The browse page and what serves it are dev-only, and never in the pack.
- `dist/` lives only in a release tag's tree, the pack, never on a branch.
- Releases are plain `vX.Y.Z` annotated tags on a pack commit whose one parent is main's merge
  commit, cut by hand on a green check from `package.json`'s version, each with its `CHANGELOG.md`
  section, and never changed or re-cut; the release workflow, dispatched by hand with the pushed
  tag and never on a push, only verifies and publishes it (`standards-lab/context/web-client.md`,
  "Packaging and release"; `architecture/principles/independent-releases.md`).
- A layer resolves another only through its release tag, as a consumer does: never a link, path
  alias, source condition, or project reference
  (`architecture/principles/independent-releases.md`).

## Code

- Code meets the bar of spike-html-conventions' `layers/` code at a88828a: a header of about 2–6
  lines and a one-line doc comment per export.
- Every comment is one of the five kinds in `architecture/principles/comments.md` (package
  documentation, a suppression's reason, a pin hold's reason, provenance, a reference), in TS, JS,
  shell, CSS, HTML, tests, and every configuration file (TOML, YAML, JSONC, `.gitignore`,
  `.prettierignore`). A module's or a script's header and the JSDoc on its exports are its package
  documentation, the public contract with no reasoning; JSDoc on a non-exported symbol and a
  test's comments are not. A configuration file's header is a short description plus `See` lines.
- A copied file names its source repository and commit in a provenance line, one line per source:
  `From|Adapted from <repo> (<commit>): <path>`, with at most a short clause on what changed. It
  names the immediate source alone; that source keeps the earlier lines. A JSON file, which takes
  no comment, has its line in `context/README.md`.
- Sources use `.ts` relative specifiers, which tsc rewrites; a handwritten `.d.ts` keeps `.js`.
- Tests are TypeScript run under Node's type stripping, erasable syntax only, type-checked by
  `tsconfig.test.json`; browser-served fixtures stay `.js`.
- The unit tier runs the generator on fixture sets in Iconify's layout, never only on the released
  set, so a refusal is proven on a set built to break it.
- The browser tier tests `dist/`, and no server transforms what it serves beyond the catalog it
  makes.
- A mise task runs one script or one command, and `check` is a depends list.
