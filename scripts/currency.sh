#!/usr/bin/env bash
# Adapted from web-foundation (72e759f): scripts/currency.sh.
# Adapted from web-app-sdk (fbaba50): scripts/currency.sh, its peer range check.
# Prints `<where>: <item> <pin> -> <latest>` for each mise tool, package.json dependency (the
# @iconify-json sets and vite among them), GitHub Actions pin, and github: devDependency's tag
# behind its latest, and the optional vite peer's range when it doesn't admit vite's latest
# release, and exits 1 if any; prints nothing when all are current. Reads the network.
# See docs/internals.md
set -euo pipefail
cd "$(dirname "$0")/.."

mise_tools_trailing() {
  local outdated
  outdated=$(MISE_LOG_LEVEL=error mise outdated --bump --local --json) || return
  node -p '
    Object.entries(JSON.parse(process.argv[1]))
      .map(([tool, { requested, bump }]) => "mise.toml: " + [tool, requested, "->", bump].join(" "))
      .join("\n")
  ' "$outdated"
}

github_release_tag_trailing() {
  local package=$1 spec=${2#github:} latest
  latest=$(gh api "repos/${spec%%#*}/releases/latest" --jq .tag_name) || return
  if [[ ${spec#*#} != "$latest" ]]; then
    echo "package.json: $package ${spec#*#} -> $latest"
  fi
}

newest_typescript_typescript_eslint_accepts() {
  local typescript_eslint range accepted
  typescript_eslint=$(node -p 'require("./package.json").devDependencies["typescript-eslint"]') ||
    return
  range=$(pnpm view "typescript-eslint@$typescript_eslint" peerDependencies.typescript) || return
  accepted=$(pnpm view "typescript@$range" version --json) || return
  node -p '[].concat(JSON.parse(process.argv[1])).join("\n")' "$accepted" | sort -V | tail -n 1
}

latest_release() {
  if [[ $1 == typescript ]]; then
    newest_typescript_typescript_eslint_accepts
  else
    pnpm view "$1" version
  fi
}

peer_range_trailing() {
  local package=$1 latest=$2 range
  range=$(node -p 'require("./package.json").peerDependencies?.[process.argv[1]] ?? ""' "$package") ||
    return
  if [[ -n $range ]] && ! node --input-type=module -e '
    import { caretAdmits } from "./test/unit/release.ts";
    process.exit(caretAdmits(...process.argv.slice(1)) ? 0 : 1);
  ' "$range" "$latest"; then
    echo "package.json: peer $package $range -> ^$latest"
  fi
}

packages_trailing() {
  local pins package pin latest
  pins=$(node -p '
    const { dependencies, devDependencies } = require("./package.json");
    Object.entries({ ...dependencies, ...devDependencies })
      .map(([name, pin]) => name + " " + pin)
      .join("\n")
  ') || return
  while read -r package pin; do
    if [[ $pin == github:* ]]; then
      github_release_tag_trailing "$package" "$pin" || return
      continue
    fi
    latest=$(latest_release "$package") || return
    if [[ $pin != "$latest" ]]; then
      echo "package.json: $package $pin -> $latest"
    fi
    peer_range_trailing "$package" "$latest" || return
  done <<<"$pins"
}

workflow_actions_trailing() {
  local uses="" action repo latest
  if compgen -G '.github/workflows/*.yml' >/dev/null; then
    uses=$(grep -ho 'uses: *[^ ]*@[^ ]*' .github/workflows/*.yml | sed 's/uses: *//' | sort -u) ||
      return
  fi
  while read -r action; do
    [[ -n $action ]] || continue
    repo=$(cut -d/ -f1,2 <<<"${action%@*}") || return
    latest=$(gh api "repos/$repo/releases/latest" --jq .tag_name) || return
    if [[ ${action#*@} != "$latest" ]]; then
      echo ".github/workflows: ${action%@*} ${action#*@} -> $latest"
    fi
  done <<<"$uses"
}

trailing=$(mise_tools_trailing)
trailing+=$'\n'$(packages_trailing)
trailing+=$'\n'$(workflow_actions_trailing)

if [[ -n ${trailing//$'\n'/} ]]; then
  sed '/^$/d' <<<"$trailing"
  exit 1
fi
