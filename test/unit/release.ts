// Adapted from web-foundation (72e759f): test/unit/release.ts, its licence check, with
// web-app-sdk's (fbaba50) dependency check for an optional peer and web-components' (a659353)
// github: tag form for the foundation.
// The release rule: what a pack's package.json and LICENSE must declare. The package is
// @standards-lab/web-icons, released under Apache 2.0, at a plain x.y.z version; it has no
// dependency at run time and no install script; its one peer is vite, optional and by a caret
// range, which its exact dev pin falls within; and web-foundation and web-tooling are
// devDependencies at a release tag, with no standalone rolldown. test/unit/release.test.ts runs it
// on a pnpm pack. Which version, range, pin, and tag is package.json's; mise run currency reports
// each behind its latest.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";

/** The members of a package.json the rule reads; JSON.parse gives them as written, unchecked. */
export interface Manifest {
  name?: string;
  version?: string;
  license?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  bundleDependencies?: string[] | boolean;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
  devDependencies?: Record<string, string>;
}

/** Packs the package at `root` with pnpm pack into `destination`, a scratch directory, and returns
 * the tarball's path. pnpm writes nothing into `root` while it packs: unless a store directory is
 * configured, pnpm first probes where its store should live by writing a short-lived
 * _tmp_<pid>_<hex> file into the project, and the browser tier, which may be running beside the
 * unit tier, checks that the repository's untracked files don't change. A store directory under
 * `destination`, set in the environment (the --store-dir flag still probes), skips the probe; pack
 * reads no store, so pnpm never creates it. */
export function packInto(root: string, destination: string): string {
  execFileSync("pnpm", ["pack", "--pack-destination", destination], {
    cwd: root,
    env: { ...process.env, pnpm_config_store_dir: join(destination, "store") },
    stdio: "ignore",
  });
  const [tarball] = readdirSync(destination).filter((file) => file.endsWith(".tgz"));
  return join(destination, tarball);
}

/** root's package.json. */
export function readManifest(root: string): Manifest {
  return JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as Manifest;
}

/** Every file below `dir`, relative to it with / separators, sorted. */
export function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((path) => statSync(join(dir, path)).isFile())
    .map((path) => path.split(sep).join("/"))
    .sort();
}

/** The package's name. */
export const packageName = "@standards-lab/web-icons";

/** The license every release declares, and the text its LICENSE opens with. */
const license = "Apache-2.0";
const licenseHeading = /^\s*Apache License\s+Version 2\.0, January 2004\s/;

/** What keeps root, a pack's package/, from carrying the license its package.json declares, one
 * line each: the declaration and the LICENSE beside package.json. */
export function licenseProblems(root: string): string[] {
  const problems: string[] = [];
  const manifest = readManifest(root);
  if (manifest.license !== license) {
    problems.push(`package.json declares license ${manifest.license}, not ${license}`);
  }
  const path = join(root, "LICENSE");
  if (!existsSync(path)) problems.push("LICENSE is missing");
  else if (!licenseHeading.test(readFileSync(path, "utf8"))) {
    problems.push("LICENSE isn't the Apache License 2.0");
  }
  return problems;
}

/** The scripts a package manager runs when it installs the package, from the registry or from
 * GitHub, where prepare runs too: a release declares none of them. */
const installScripts = [
  "preinstall",
  "install",
  "postinstall",
  "preprepare",
  "prepare",
  "postprepare",
];

/** The plugin's one peer, optional, so a consumer that imports only icon modules isn't asked for
 * it, and by a caret range, which the repository's own install of it, a devDependency at one exact
 * version, falls within. */
const vite = "vite";
const caretRange = /^\^\d+\.\d+\.\d+$/;
const exactVersion = /^\d+\.\d+\.\d+$/;

/** The devDependencies taken from GitHub, each at one release tag, never a range, a branch, a
 * commit, or a #semver: spec, which bun fails. */
const taggedDevDependencies = ["@standards-lab/web-foundation", "@standards-lab/web-tooling"];
const githubTag = (name: string) =>
  new RegExp(`^github:standards-lab/${name.split("/")[1]}#v\\d+\\.\\d+\\.\\d+$`);

/** A bundler the release never takes on its own: Vite's build is the one the package is held to. */
const rolldown = "rolldown";

/** Whether the caret range, ^x.y.z, admits the version x.y.z: the same leftmost nonzero part and
 * no lower, so ^0.1.0 admits 0.1.x only. mise run currency asks it too. */
export function caretAdmits(range: string, version: string): boolean {
  const [major, minor, patch] = range.slice(1).split(".").map(Number);
  const [vMajor, vMinor, vPatch] = version.split(".").map(Number);
  const atLeast =
    vMajor > major ||
    (vMajor === major && (vMinor > minor || (vMinor === minor && vPatch >= patch)));
  if (!atLeast) return false;
  if (major > 0) return vMajor === major;
  if (minor > 0) return vMajor === 0 && vMinor === minor;
  return vMajor === 0 && vMinor === 0 && vPatch === patch;
}

/** What keeps root, a pack's package/, from declaring the manifest a release needs, one line
 * each: its name and version, no install script, no dependency at run time, vite as its one
 * optional caret-range peer with an exact dev pin inside that range, the foundation and the
 * tooling at their release tags, and no rolldown. */
export function manifestProblems(root: string): string[] {
  const problems: string[] = [];
  const manifest = readManifest(root);
  if (manifest.name !== packageName) {
    problems.push(`package.json declares name ${manifest.name}, not ${packageName}`);
  }
  if (!exactVersion.test(manifest.version ?? "")) {
    problems.push(`package.json declares version ${manifest.version}, not x.y.z`);
  }
  for (const script of Object.keys(manifest.scripts ?? {})) {
    if (installScripts.includes(script)) {
      problems.push(`package.json declares the install script ${script}`);
    }
  }
  for (const field of ["dependencies", "optionalDependencies"] as const) {
    for (const name of Object.keys(manifest[field] ?? {})) {
      problems.push(`package.json declares ${name} in ${field}, but a release has none`);
    }
  }
  if (manifest.bundleDependencies !== undefined) {
    problems.push("package.json declares bundleDependencies, but a release bundles none");
  }

  const peers = manifest.peerDependencies ?? {};
  const meta = manifest.peerDependenciesMeta ?? {};
  const dev = manifest.devDependencies ?? {};
  for (const name of Object.keys(peers)) {
    if (name !== vite) problems.push(`package.json declares peer ${name}, which no release needs`);
  }
  for (const name of Object.keys(meta)) {
    if (!(name in peers)) problems.push(`peerDependenciesMeta names ${name}, which isn't a peer`);
  }
  const range = peers[vite];
  if (range === undefined) problems.push(`package.json doesn't declare peer ${vite}`);
  else {
    if (!caretRange.test(range)) {
      problems.push(`package.json declares peer ${vite} ${range}, not a caret range`);
    }
    if (meta[vite]?.optional !== true) problems.push(`package.json's peer ${vite} isn't optional`);
  }
  const pin = dev[vite];
  if (pin === undefined) problems.push(`package.json doesn't declare devDependency ${vite}`);
  else if (!exactVersion.test(pin)) {
    problems.push(`package.json declares devDependency ${vite} ${pin}, not an exact pin`);
  } else if (range !== undefined && caretRange.test(range) && !caretAdmits(range, pin)) {
    problems.push(`package.json's devDependency ${vite} ${pin} is outside its peer range ${range}`);
  }

  for (const name of taggedDevDependencies) {
    if (!(name in dev)) problems.push(`package.json doesn't declare devDependency ${name}`);
    else if (!githubTag(name).test(dev[name])) {
      problems.push(
        `package.json declares devDependency ${name} ${dev[name]}, not an exact release tag`,
      );
    }
  }

  for (const field of ["peerDependencies", "devDependencies"] as const) {
    if (rolldown in (manifest[field] ?? {})) {
      problems.push(`package.json declares ${rolldown} in ${field}; Vite's build is the bundler`);
    }
  }
  return problems;
}

/** What keeps root, a pack's package/, from being a release by the rule, one line each. */
export function releaseProblems(root: string): string[] {
  return [...licenseProblems(root), ...manifestProblems(root)];
}
