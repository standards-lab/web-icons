import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";

const root = join(import.meta.dirname, "../..");
const config = join(root, "scripts/screenshots.config.ts");
const bin = join(root, "node_modules/.bin/web-screenshots");
const preview = join(root, "scripts/preview.ts");

const untracked = () =>
  execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
    cwd: root,
    encoding: "utf8",
  });

function capture(...flags: string[]) {
  const dir = mkdtempSync(join(tmpdir(), "screenshots."));
  try {
    const args = [config, "--page", "browse", "--scheme", "light", "--output", "terminal"];
    const { status, stdout, stderr } = spawnSync(bin, [...args, ...flags], {
      cwd: root,
      env: { ...process.env, TMPDIR: dir, NODE_DISABLE_COMPILE_CACHE: "1" },
      encoding: "utf8",
    });
    const printed = stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.endsWith(".png"));
    for (const path of printed) assert.ok(path.startsWith(`${dir}/`), `${path} is under ${dir}`);
    return {
      status,
      stderr,
      printed: printed.map((path) => path.slice(dir.length + 1)),
      left: readdirSync(dir, { recursive: true, encoding: "utf8" }),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("mise run screenshots' command", { timeout: 300_000 }, () => {
  test("captures the browse page wide and narrow under TMPDIR and leaves nothing there", () => {
    const before = untracked();
    const { status, stderr, printed, left } = capture();
    assert.equal(status, 0, stderr);
    for (const state of ["wide", "narrow"]) {
      assert.ok(
        printed.some((path) => path.includes(`-browse-${state}--`)),
        `a capture of browse-${state} among ${printed}`,
      );
    }
    for (const path of printed) {
      assert.match(
        path,
        /-browse-(wide|narrow)--/,
        `${path} is the page wide or narrow, no other state`,
      );
    }
    assert.deepEqual(left, [], "TMPDIR is left empty");
    assert.equal(untracked(), before, "the run leaves no file in the repository");
  });

  test("with --keep, leaves every capture file it printed", () => {
    const { status, stderr, printed, left } = capture("--keep");
    assert.equal(status, 0, stderr);
    assert.ok(printed.length > 0, "it printed its captures");
    for (const path of printed) assert.ok(left.includes(path), `${path} is kept`);
  });

  test("mise run preview's script writes the first wide tile, light and dark, and nothing else", () => {
    const before = untracked();
    const scratch = mkdtempSync(join(tmpdir(), "preview-test."));
    try {
      const [out, tmp, shots] = [
        join(scratch, "out"),
        join(scratch, "tmp"),
        join(scratch, "shots"),
      ];
      mkdirSync(tmp);
      const env = { ...process.env, TMPDIR: tmp, NODE_DISABLE_COMPILE_CACHE: "1" };
      const run = spawnSync(process.execPath, [preview, out], { cwd: root, env, encoding: "utf8" });
      assert.equal(run.status, 0, run.stderr);
      assert.deepEqual(readdirSync(out).sort(), ["preview-dark.png", "preview-light.png"]);
      assert.deepEqual(readdirSync(tmp), [], "TMPDIR is left empty");

      const everyTileKept = [config, "--page", "browse", "--output", "directory", "--dir", shots];
      const capture = spawnSync(bin, everyTileKept, { cwd: root, env, encoding: "utf8" });
      assert.equal(capture.status, 0, capture.stderr);
      const tiles = readdirSync(shots);
      for (const scheme of ["light", "dark"]) {
        const first = tiles.filter((file) =>
          new RegExp(`^1-browse-wide--zen-regular-mono-${scheme}(--1of\\d+)?\\.png$`).test(file),
        );
        assert.equal(first.length, 1, `one first wide ${scheme} tile among ${tiles}`);
        assert.ok(
          readFileSync(join(out, `preview-${scheme}.png`)).equals(
            readFileSync(join(shots, first[0])),
          ),
          `preview-${scheme}.png is ${first[0]}`,
        );
      }
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
    assert.equal(untracked(), before, "the run leaves no file in the repository");
  });
});
