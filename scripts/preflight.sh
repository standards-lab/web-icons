#!/usr/bin/env bash
# Adapted from web-foundation (72e759f): scripts/preflight.sh, with the packages the build reads.
# Fails naming mise run install when a tool a task needs is missing: the node_modules tooling, the
# packages the generator reads (@iconify/utils and each @iconify-json set sets.json lists), and
# with `browser`, the pinned chrome-headless-shell at its pinned version.
# See docs/internals.md
set -euo pipefail
cd "$(dirname "$0")/.."

fail() {
  echo "preflight: $1 isn't installed; run mise run install" >&2
  exit 1
}

require_node_modules() {
  local bin sets package
  for bin in eslint prettier; do
    [[ -x node_modules/.bin/$bin ]] || fail "$bin (devDependencies)"
  done
  sets=$(node -p 'Object.values(require("./sets.json")).map((set) => set.package).join("\n")') ||
    return
  for package in @iconify/utils $sets; do
    [[ -f node_modules/$package/package.json ]] || fail "$package (devDependencies)"
  done
}

require_browser_at_pin() {
  local shell pin version
  shell=$(mise which chrome-headless-shell 2>/dev/null) || fail "chrome-headless-shell"
  pin=$(mise current http:chrome-headless-shell) || return
  version=$("$shell" --version) || return
  if [[ $version != *" $pin" ]]; then
    echo "preflight: $shell isn't chrome-headless-shell $pin; give the pin its own sha256" >&2
    exit 1
  fi
}

require_node_modules
case "${1:-}" in
  browser) require_browser_at_pin ;;
esac
