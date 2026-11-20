// Adapted from web-foundation (72e759f): test/unit/release.test.ts, on the manifest's rule.
// The release rule, release.ts's releaseProblems, on a pnpm pack of the build, extracted: as it
// stands, and in scratch copies with one fault each, in its package.json or its LICENSE. It packs
// the dist/ that mise run build writes.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import { caretAdmits, packInto, releaseProblems } from "./release.ts";
import type { Manifest } from "./release.ts";

const root = join(import.meta.dirname, "../..");
const scratches: string[] = [];

/** A new temporary directory, removed after the run. */
function scratchDir() {
  const scratch = mkdtempSync(join(tmpdir(), "release-"));
  scratches.push(scratch);
  return scratch;
}

// The pack under test: pnpm pack's tarball, extracted, its package/ directory.
let pack: string;
before(() => {
  const scratch = scratchDir();
  execFileSync("tar", ["-xzf", packInto(root, scratch), "-C", scratch]);
  pack = join(scratch, "package");
});
after(() => {
  for (const scratch of scratches) rmSync(scratch, { recursive: true, force: true });
});

/** A fault: a change to a pack's copy, given its directory and its manifest, every field of which
 * the pack declares. */
type Change = (dir: string, manifest: Required<Manifest>) => void;

/** A scratch copy of the pack, `change` applied to it and its manifest, and its problems. */
function faulted(change: Change) {
  const copy = join(scratchDir(), "package");
  cpSync(pack, copy, { recursive: true });
  const manifest: Required<Manifest> = JSON.parse(readFileSync(join(copy, "package.json"), "utf8"));
  change(copy, manifest);
  writeFileSync(join(copy, "package.json"), JSON.stringify(manifest));
  return releaseProblems(copy);
}

const foundation = "@standards-lab/web-foundation";
const tooling = "@standards-lab/web-tooling";

describe("release rule", () => {
  test("the pack is a release by the rule", () => {
    assert.deepEqual(releaseProblems(pack), []);
  });

  test("a caret range admits its own minor's later patches only, below 1.0.0", () => {
    assert.ok(caretAdmits("^8.3.8", "8.3.8"));
    assert.ok(caretAdmits("^8.3.8", "8.9.0"));
    assert.ok(!caretAdmits("^8.3.8", "8.3.7"));
    assert.ok(!caretAdmits("^8.3.8", "9.0.0"));
    assert.ok(caretAdmits("^0.4.0", "0.4.2"));
    assert.ok(!caretAdmits("^0.4.0", "0.5.0"));
  });

  const faults: Record<string, [Change, string]> = {
    "another name": [
      (_, copy) => (copy.name = "@standards-lab/icons"),
      "package.json declares name @standards-lab/icons, not @standards-lab/web-icons",
    ],
    "a prerelease version": [
      (_, copy) => (copy.version = "0.1.0-rc.1"),
      "package.json declares version 0.1.0-rc.1, not x.y.z",
    ],
    "a package that declares another license": [
      (_, copy) => (copy.license = "MIT"),
      "package.json declares license MIT, not Apache-2.0",
    ],
    "a pack without its LICENSE": [(dir) => rmSync(join(dir, "LICENSE")), "LICENSE is missing"],
    "a LICENSE that isn't Apache 2.0": [
      (dir) => writeFileSync(join(dir, "LICENSE"), "All rights reserved.\n"),
      "LICENSE isn't the Apache License 2.0",
    ],
    "an install script": [
      (_, copy) => (copy.scripts = { postinstall: "node setup.js" }),
      "package.json declares the install script postinstall",
    ],
    "a prepare script, which an install from GitHub runs": [
      (_, copy) => (copy.scripts = { prepare: "node scripts/build.ts" }),
      "package.json declares the install script prepare",
    ],
    "a runtime dependency": [
      (_, copy) => (copy.dependencies = { "@iconify/utils": "3.1.7" }),
      "package.json declares @iconify/utils in dependencies, but a release has none",
    ],
    "an optional dependency": [
      (_, copy) => (copy.optionalDependencies = { vite: "8.3.8" }),
      "package.json declares vite in optionalDependencies, but a release has none",
    ],
    "a bundled dependency": [
      (_, copy) => (copy.bundleDependencies = true),
      "package.json declares bundleDependencies, but a release bundles none",
    ],
    "a peer other than vite": [
      (_, copy) => (copy.peerDependencies[foundation] = "^0.4.0"),
      `package.json declares peer ${foundation}, which no release needs`,
    ],
    "no vite peer": [
      (_, copy) => delete copy.peerDependencies.vite,
      "package.json doesn't declare peer vite",
    ],
    "a vite peer that isn't a caret range": [
      (_, copy) => (copy.peerDependencies.vite = ">=8.3.8"),
      "package.json declares peer vite >=8.3.8, not a caret range",
    ],
    "a vite peer that isn't optional": [
      (_, copy) => (copy.peerDependenciesMeta = {}),
      "package.json's peer vite isn't optional",
    ],
    "peer metadata for a package that isn't a peer": [
      (_, copy) => (copy.peerDependenciesMeta.lit = { optional: true }),
      "peerDependenciesMeta names lit, which isn't a peer",
    ],
    "no vite dev pin": [
      (_, copy) => delete copy.devDependencies.vite,
      "package.json doesn't declare devDependency vite",
    ],
    "a vite dev pin that isn't exact": [
      (_, copy) => (copy.devDependencies.vite = "^8.3.8"),
      "package.json declares devDependency vite ^8.3.8, not an exact pin",
    ],
    "a vite dev pin outside the peer range": [
      (_, copy) => (copy.devDependencies.vite = "8.3.7"),
      "package.json's devDependency vite 8.3.7 is outside its peer range ^8.3.8",
    ],
    "no foundation devDependency": [
      (_, copy) => delete copy.devDependencies[foundation],
      `package.json doesn't declare devDependency ${foundation}`,
    ],
    "the foundation at a branch": [
      (_, copy) => (copy.devDependencies[foundation] = "github:standards-lab/web-foundation#main"),
      `package.json declares devDependency ${foundation} github:standards-lab/web-foundation#main, not an exact release tag`,
    ],
    "the foundation from the registry": [
      (_, copy) => (copy.devDependencies[foundation] = "0.4.0"),
      `package.json declares devDependency ${foundation} 0.4.0, not an exact release tag`,
    ],
    "the tooling by a semver: spec": [
      (_, copy) =>
        (copy.devDependencies[tooling] = "github:standards-lab/web-tooling#semver:^0.1.0"),
      `package.json declares devDependency ${tooling} github:standards-lab/web-tooling#semver:^0.1.0, not an exact release tag`,
    ],
    "the tooling at another repository's tag": [
      (_, copy) => (copy.devDependencies[tooling] = "github:standards-lab/web-foundation#v0.1.0"),
      `package.json declares devDependency ${tooling} github:standards-lab/web-foundation#v0.1.0, not an exact release tag`,
    ],
    "a standalone rolldown": [
      (_, copy) => (copy.devDependencies.rolldown = "1.3.2"),
      "package.json declares rolldown in devDependencies; Vite's build is the bundler",
    ],
  };
  for (const [fault, [change, problem]] of Object.entries(faults)) {
    test(`fails on ${fault}`, () => {
      const problems = faulted(change);
      assert.ok(problems.includes(problem), `expected: ${problem}\ngot: ${problems.join("\n")}`);
    });
  }
});
