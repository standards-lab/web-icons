#!/usr/bin/env bash
# Adapted from web-foundation (72e759f): scripts/preflight.sh, with the packages the build reads.
# Fails naming mise run install when a tool a task needs is missing: the node_modules tooling, the
# packages the generator reads (@iconify/utils and each @iconify-json set sets.json lists), and
# with `browser`, the pinned chrome-headless-shell.
set -euo pipefail
cd "$(dirname "$0")/.."

fail() {
  echo "preflight: $1 isn't installed; run mise run install" >&2
  exit 1
}

for bin in eslint prettier; do
  [[ -x node_modules/.bin/$bin ]] || fail "$bin (devDependencies)"
done
sets=$(node -p 'Object.values(require("./sets.json")).map((set) => set.package).join("\n")')
for package in @iconify/utils $sets; do
  [[ -f node_modules/$package/package.json ]] || fail "$package (devDependencies)"
done

[[ "${1:-}" == browser ]] || exit 0
shell=$(mise which chrome-headless-shell 2>/dev/null) || fail "chrome-headless-shell"
# mise caches downloads by checksum: a version bumped without its sha256 installs the old build.
pin=$(mise current http:chrome-headless-shell)
if [[ "$("$shell" --version)" != *" $pin" ]]; then
  echo "preflight: $shell isn't chrome-headless-shell $pin; give the pin its own sha256" >&2
  exit 1
fi
