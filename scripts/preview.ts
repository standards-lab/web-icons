// mise run preview: README's preview, the browse page's first wide tile at the default profile,
// light and dark, written as preview-light.png and preview-dark.png to docs/, or to the directory
// the one argument names. The capture is mise run screenshots' own, web-tooling's web-screenshots
// on scripts/screenshots.config.ts, into a scratch directory under TMPDIR that the run removes.

import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = join(import.meta.dirname, "..");
const config = join(root, "scripts/screenshots.config.ts");
const bin = join(root, "node_modules/.bin/web-screenshots");

const out = resolve(process.argv[2] ?? join(root, "docs"));
const scratch = mkdtempSync(join(tmpdir(), "preview."));
try {
  // No facet flag, so the default profile; no --scheme, so light and dark.
  const args = [config, "--page", "browse", "--output", "directory", "--dir", scratch];
  const { status, stdout, stderr } = spawnSync(bin, args, { cwd: root, encoding: "utf8" });
  if (status !== 0) {
    process.stderr.write(stdout + stderr);
    throw new Error(`preview: web-screenshots exited ${status}`);
  }
  const files = readdirSync(scratch);
  mkdirSync(out, { recursive: true });
  for (const scheme of ["light", "dark"]) {
    // The wide state's first tile, or its one capture when the page fits a single tile.
    const first = new RegExp(`-browse-wide--.*-${scheme}(--1of\\d+)?\\.png$`);
    const matched = files.filter((file) => first.test(file));
    if (matched.length !== 1) {
      throw new Error(`preview: one first wide ${scheme} tile expected, found ${matched}`);
    }
    const target = join(out, `preview-${scheme}.png`);
    copyFileSync(join(scratch, matched[0]), target);
    console.log(target);
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
