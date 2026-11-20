# web-icons

`@standards-lab/web-icons`: the web client stack's icons, Octicons as one string ES module per
icon, imported by set and name with no extension:

```js
import x from "@standards-lab/web-icons/octicon/x-16";
```

Its default export is one complete `<svg>` string, 1em square, drawn in `currentColor`, and hidden
from assistive technology. Octicons' MIT LICENSE ships beside its modules, in
`dist/octicon/LICENSE`; the package itself is Apache-2.0.

## Development

- `mise run install`: install the pins and `node_modules`; the one task that reads the network.
- `mise run check`: the whole check: lint, types, build, and the unit and browser tiers.
- `mise run build`: generate the sets `sets.json` lists into a fresh `dist/`.
- `mise run currency`: report every pin behind its latest.
