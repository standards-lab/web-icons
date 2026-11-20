// Adapted from spike-html-hosting-icons (8b8d955): test/unit/pack.test.ts, its manifest's case
// moved to the release rule (test/unit/release.test.ts).
// The pack: pnpm pack's tarball of the build, extracted into a scratch consumer's node_modules in
// TMPDIR, removed after. Its files are the build and the files every pack carries, never the browse
// page or the scripts that serve it; and an icon resolves from it by its set and name, with no
// extension, as a consumer imports it, in node to its module and under TypeScript's types
// condition to its declaration, which types the icon as a string. It packs the dist/ mise run
// build writes, and reads no network.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { after, before, describe, test } from "node:test";
import ts from "typescript";
import { listFiles, packageName as name } from "./release.ts";

const root = join(import.meta.dirname, "../..");
const icon = `${name}/octicon/x-16`;

// The consumer: a scratch directory with the tarball's package/ as its installed package.
let scratch: string;
let consumer: string;
let installed: string;
before(() => {
  scratch = mkdtempSync(join(tmpdir(), "pack-"));
  execFileSync("pnpm", ["pack", "--pack-destination", scratch], { cwd: root, stdio: "ignore" });
  const [tarball] = readdirSync(scratch).filter((file) => file.endsWith(".tgz"));
  execFileSync("tar", ["-xzf", join(scratch, tarball), "-C", scratch]);
  consumer = join(scratch, "consumer");
  installed = join(consumer, "node_modules", name);
  mkdirSync(join(consumer, "node_modules/@standards-lab"), { recursive: true });
  renameSync(join(scratch, "package"), installed);
  writeFileSync(join(consumer, "package.json"), JSON.stringify({ type: "module" }));
});
after(() => rmSync(scratch, { recursive: true, force: true }));

/** What node resolves `specifier` to from the consumer, under `conditions`, relative to the
 * installed package. */
function resolveFromConsumer(specifier: string, conditions: string[] = []): string {
  const url = execFileSync(
    process.execPath,
    [
      ...conditions,
      "--input-type=module",
      "-e",
      "console.log(import.meta.resolve(process.argv[1]))",
      specifier,
    ],
    { cwd: consumer, encoding: "utf8" },
  ).trim();
  return relative(installed, fileURLToPath(url)).split(sep).join("/");
}

/** TypeScript's diagnostics on `source`, a consumer module, under node's module resolution. */
function typeCheck(source: string): { messages: string[]; declarations: string[] } {
  const file = join(consumer, "consumer.ts");
  writeFileSync(file, source);
  const program = ts.createProgram([file], {
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    target: ts.ScriptTarget.ES2024,
    strict: true,
    noEmit: true,
    types: [],
  });
  const messages = ts
    .getPreEmitDiagnostics(program)
    .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
  const declarations = program
    .getSourceFiles()
    .map((sourceFile) => relative(installed, sourceFile.fileName).split(sep).join("/"))
    .filter((path) => !path.startsWith(".."));
  return { messages, declarations };
}

describe("the pack", () => {
  test("is package.json, README.md, LICENSE, and the build, never the browse page or its scripts", () => {
    const built = listFiles(join(root, "dist")).map((path) => `dist/${path}`);
    assert.ok(built.includes("dist/octicon/x-16.js"), "mise run build wrote no dist/octicon/");
    assert.deepEqual(
      listFiles(installed),
      [...built, "LICENSE", "README.md", "package.json"].sort(),
    );
  });

  test("ships Octicons' LICENSE and its provenance line beside the modules", () => {
    const files = listFiles(installed);
    assert.ok(files.includes("dist/octicon/LICENSE"));
    assert.ok(files.includes("dist/octicon/LICENSE.provenance"));
  });

  test("an icon resolves by its set and name to its module, a string", async () => {
    assert.equal(resolveFromConsumer(icon), "dist/octicon/x-16.js");
    const svg = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        "process.stdout.write((await import(process.argv[1])).default)",
        icon,
      ],
      { cwd: consumer, encoding: "utf8" },
    );
    assert.match(svg, /^<svg [^>]*viewBox="0 0 16 16"[^>]*>.*<\/svg>$/s);
    const built = await import(pathToFileURL(join(root, "dist/octicon/x-16.js")).href);
    assert.equal(svg, built.default);
  });

  test("an icon resolves under the types condition to its declaration", () => {
    assert.equal(resolveFromConsumer(icon, ["--conditions=types"]), "dist/octicon/x-16.d.ts");
  });

  test("TypeScript reads the icon's declaration, which types it as a string", () => {
    const { messages, declarations } = typeCheck(
      `import x from "${icon}";\nexport const svg: string = x;\n`,
    );
    assert.deepEqual(messages, []);
    assert.deepEqual(declarations, ["dist/octicon/x-16.d.ts"]);
    const wrong = typeCheck(`import x from "${icon}";\nexport const n: number = x;\n`);
    assert.deepEqual(wrong.messages, ["Type 'string' is not assignable to type 'number'."]);
  });
});
