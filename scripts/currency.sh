#!/usr/bin/env bash
# Prints `<where>: <item> <pin> -> <latest>` for each mise tool, package.json dependency (the
# @iconify-json sets and vite among them), GitHub Actions pin, and github: devDependency's tag
# behind its latest, and the optional vite peer's range when it doesn't admit vite's latest
# release. A pin the HOLDS list names, `<item> <pin>: <reason>`, is reported with
# `held: <reason>`. Exits 1 if it reports any pin that isn't held; prints nothing when all are
# current. Reads the network.
# See docs/internals.md
set -euo pipefail
cd "$(dirname "$0")/.."

trailing=""
stale=0
holds=${HOLDS:-}

held() {
  grep -m1 "^$1 $2: " <<<"$holds" | cut -d: -f2- | sed 's/^ //' || true
}

report() {
  trailing+=$'\n'"$1"
}

report_pin() {
  local line=$1 reason=$2
  if [[ -n $reason ]]; then
    report "$line held: $reason"
  else
    report "$line"
    stale=1
  fi
}

report_mise_tools() {
  local outdated lines tool requested bump
  outdated=$(MISE_LOG_LEVEL=error mise outdated --bump --local --json) || return
  lines=$(node -p '
    Object.entries(JSON.parse(process.argv[1]))
      .map(([tool, { requested, bump }]) => [tool, requested, bump].join(" "))
      .join("\n")
  ' "$outdated") || return
  while read -r tool requested bump; do
    [[ -n $tool ]] || continue
    report_pin "mise.toml: $tool $requested -> $bump" "$(held "$tool" "$requested")"
  done <<<"$lines"
}

report_release_tag() {
  local package=$1 spec=${2#github:} latest
  latest=$(gh api "repos/${spec%%#*}/releases/latest" --jq .tag_name) || return
  if [[ ${spec#*#} != "$latest" ]]; then
    report_pin "package.json: $package ${spec#*#} -> $latest" "$(held "$package" "${spec#*#}")"
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

report_peer_range() {
  local package=$1 latest=$2 range
  range=$(node -p 'require("./package.json").peerDependencies?.[process.argv[1]] ?? ""' "$package") ||
    return
  if [[ -n $range ]] && ! node --input-type=module -e '
    import { caretAdmits } from "./test/unit/release.ts";
    process.exit(caretAdmits(...process.argv.slice(1)) ? 0 : 1);
  ' "$range" "$latest"; then
    report_pin "package.json: peer $package $range -> ^$latest" "$(held "peer $package" "$range")"
  fi
}

report_packages() {
  local pins package pin latest
  pins=$(node -p '
    const { dependencies, devDependencies } = require("./package.json");
    Object.entries({ ...dependencies, ...devDependencies })
      .map(([name, pin]) => name + " " + pin)
      .join("\n")
  ') || return
  while read -r package pin; do
    if [[ $pin == github:* ]]; then
      report_release_tag "$package" "$pin" || return
      continue
    fi
    latest=$(latest_release "$package") || return
    if [[ $pin != "$latest" ]]; then
      report_pin "package.json: $package $pin -> $latest" "$(held "$package" "$pin")"
    fi
    report_peer_range "$package" "$latest" || return
  done <<<"$pins"
}

report_actions() {
  local uses action repo latest
  compgen -G '.github/workflows/*.yml' >/dev/null || return 0
  uses=$(grep -ho 'uses: *[^ ]*@[^ ]*' .github/workflows/*.yml | sed 's/uses: *//' | sort -u) ||
    return
  while read -r action; do
    [[ -n $action ]] || continue
    repo=$(cut -d/ -f1,2 <<<"${action%@*}") || return
    latest=$(gh api "repos/$repo/releases/latest" --jq .tag_name) || return
    if [[ ${action#*@} != "$latest" ]]; then
      report_pin ".github/workflows: ${action%@*} ${action#*@} -> $latest" \
        "$(held "${action%@*}" "${action#*@}")"
    fi
  done <<<"$uses"
}

report_mise_tools
report_packages
report_actions

if [[ -n ${trailing//$'\n'/} ]]; then
  sed '/^$/d' <<<"$trailing"
fi
exit "$stale"
