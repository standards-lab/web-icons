// Adapted from spike-html-hosting-sdk (f49087e): test/unit/icons.test.ts, its cases run through the plugin and fixture Vite projects.

import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { after, describe, test } from "node:test";

import gear from "@standards-lab/web-icons/octicon/gear-16";
import question from "@standards-lab/web-icons/octicon/question-16";
import x from "@standards-lab/web-icons/octicon/x-16";
import { iconFill } from "@standards-lab/web-icons/vite";
import { build, createServer } from "vite";

const root = join(import.meta.dirname, "../..");
const fixtures = join(root, "test/fixtures");

const scratches: string[] = [];
function scratchDir(): string {
  const scratch = mkdtempSync(join(tmpdir(), "vite-"));
  scratches.push(scratch);
  return scratch;
}
after(() => {
  for (const scratch of scratches) rmSync(scratch, { recursive: true, force: true });
});

function fill(html: string, path = "/index.html"): Promise<unknown> {
  const hook = iconFill().transformIndexHtml;
  assert.ok(hook && typeof hook === "object", "transformIndexHtml isn't an ordered hook");
  return Promise.resolve(
    hook.handler.call({} as never, html, { path, filename: join(root, path) } as never),
  );
}

describe("the marker fill", () => {
  test("replaces each marker with its icon's svg", async () => {
    const page =
      '<button aria-label="Help"><svg data-icon="octicon/question-16"></svg>' +
      '<kbd>?</kbd></button><button aria-label="Close"><svg data-icon="octicon/x-16"> </svg>' +
      '</button><button><svg data-icon="octicon/x-16"></svg></button>';
    assert.equal(
      await fill(page),
      `<button aria-label="Help">${question}<kbd>?</kbd></button>` +
        `<button aria-label="Close">${x}</button><button>${x}</button>`,
    );
  });

  test("carries a marker's class onto the svg, and drops its other attributes", async () => {
    assert.equal(
      await fill('<svg class="glyph wide" data-icon="octicon/x-16" role="img"></svg>'),
      x.replace(/^<svg/, '<svg class="glyph wide"'),
    );
    assert.equal(
      await fill(`<SVG data-icon = 'octicon/x-16' class='glyph'></SVG>`),
      x.replace(/^<svg/, '<svg class="glyph"'),
    );
  });

  test("leaves a page with no marker, an svg that isn't one, and a comment's text unchanged", async () => {
    const page =
      '<main><svg viewBox="0 0 1 1"></svg><svg><path d="M0 0"/></svg>' +
      '<p>data-icon</p><!-- <svg data-icon="octicon/x-16"></svg>, <svg data-icon="<name>"> --></main>';
    assert.equal(await fill(page, "/a.html"), page);
  });

  test("fails on a name the package doesn't hold, naming the page and the icon", async () => {
    await assert.rejects(fill('<svg data-icon="octicon/no-such-icon-16"></svg>', "/dir/a.html"), {
      message:
        "icons: /dir/a.html names the icon octicon/no-such-icon-16, which " +
        "@standards-lab/web-icons doesn't hold",
    });
    await assert.rejects(fill('<svg data-icon="no-such-set/x-16"></svg>', "/b.html"), {
      message:
        "icons: /b.html names the icon no-such-set/x-16, which @standards-lab/web-icons doesn't hold",
    });
  });

  test("fails on an svg holding data-icon that isn't a marker, naming the page and its tag", async () => {
    for (const tag of [
      '<svg data-icon="octicon/x-16"/>',
      "<svg data-icon=octicon/x-16>",
      '<svg viewBox="0 0 1 1" data-icon>',
      '<svg data-icon="octicon/x-16">',
    ]) {
      const page = `<p>${tag}${tag.endsWith("/>") ? "" : "<title>X</title></svg>"}</p>`;
      await assert.rejects(fill(page, "/a.html"), {
        message: `icons: /a.html holds ${tag}, which isn't an empty <svg data-icon="<set>/<name>"></svg>`,
      });
    }
  });

  test("fails on a name that isn't <set>/<name>, naming the page and the icon", async () => {
    for (const icon of ["x-16", "octicon/../x-16", "octicon/X-16", "../../package", ""]) {
      await assert.rejects(fill(`<svg data-icon="${icon}"></svg>`, "/a.html"), {
        message: `icons: /a.html names the icon "${icon}", which isn't <set>/<name>`,
      });
    }
  });
});

function fixtureConfig(name: string) {
  const project = join(fixtures, name);
  return {
    root: project,
    configFile: join(project, "vite.config.ts"),
    cacheDir: scratchDir(),
    logLevel: "silent" as const,
  };
}

async function serve(name: string, paths: string[]): Promise<{ status: number; text: string }[]> {
  const server = await createServer({ ...fixtureConfig(name), server: { port: 0 } });
  try {
    await server.listen();
    const [origin] = server.resolvedUrls?.local ?? [];
    assert.ok(origin, "the dev server listens on no local URL");
    return await Promise.all(
      paths.map(async (path) => {
        const response = await fetch(new URL(path, origin));
        return { status: response.status, text: await response.text() };
      }),
    );
  } finally {
    await server.close();
  }
}

async function buildFixture(name: string): Promise<string> {
  const outDir = scratchDir();
  await build({ ...fixtureConfig(name), build: { outDir, emptyOutDir: true } });
  return outDir;
}

function filledSource(path: string): string {
  return readFileSync(join(fixtures, "vite", path), "utf8")
    .replace('<svg data-icon="octicon/question-16"></svg>', question)
    .replace('<svg class="glyph" data-icon="octicon/gear-16"></svg>', gearGlyph)
    .replace('<svg data-icon="octicon/x-16" role="img"></svg>', x);
}
const gearGlyph = gear.replace(/^<svg/, '<svg class="glyph"');
const comment =
  '<!-- A marker in a comment stays as written: <svg data-icon="octicon/alert-16"></svg> -->';

const unknownMessage =
  "icons: /index.html names the icon octicon/no-such-icon-16, which @standards-lab/web-icons " +
  "doesn't hold";

describe("the fixture project", () => {
  test("in dev, answers each page filled with its icons, gaining only Vite's client", async () => {
    const [index, help] = await serve("vite", ["/", "/pages/help.html"]);
    const viteClientScript = /<script type="module" src="\/@vite\/client"><\/script>\s*/;
    assert.equal(index.status, 200);
    assert.equal(index.text.replace(viteClientScript, ""), filledSource("index.html"));
    assert.ok(index.text.includes(comment));
    assert.equal(help.status, 200);
    assert.equal(help.text.replace(viteClientScript, ""), filledSource("pages/help.html"));
  });

  test("at build, writes each page filled with its icons", async () => {
    const out = await buildFixture("vite");
    const index = readFileSync(join(out, "index.html"), "utf8");
    const help = readFileSync(join(out, "pages/help.html"), "utf8");
    assert.ok(index.includes(`<button aria-label="Help">${question}</button>`));
    assert.ok(index.includes(`<button aria-label="Settings">${gearGlyph}</button>`));
    assert.ok(index.includes(comment));
    assert.ok(help.includes(`<button aria-label="Close">${x}</button>`));
    assert.ok(!index.replace(comment, "").includes("data-icon"));
    assert.ok(!help.includes("data-icon"));
  });

  test("a build carries exactly the markup of the two icons its script imports", async () => {
    const out = await buildFixture("vite");
    const scripts = readdirSync(join(out, "assets"))
      .filter((file) => file.endsWith(".js"))
      .map((file) => readFileSync(join(out, "assets", file), "utf8"))
      .join("\n");
    const octicon = join(root, "dist/octicon");
    const distinctShippedMarkups = new Set<string>();
    for (const file of readdirSync(octicon).filter((file) => file.endsWith(".js"))) {
      distinctShippedMarkups.add((await import(pathToFileURL(join(octicon, file)).href)).default);
    }
    assert.ok(distinctShippedMarkups.size > 2);
    const carried = [...distinctShippedMarkups].filter((svg) => scripts.includes(svg)).sort();
    assert.deepEqual(carried, [gear, x].sort());
  });
});

describe("a page naming an icon the package doesn't hold", () => {
  test("in dev, fails the page's request with the message, sending none of its markup", async () => {
    const [index] = await serve("vite-unknown", ["/"]);
    assert.equal(index.status, 500);
    const overlayErrorJson = /const error = (\{.*\})\n/.exec(index.text);
    assert.ok(overlayErrorJson, "the response isn't Vite's error page");
    assert.equal((JSON.parse(overlayErrorJson[1]) as { message: string }).message, unknownMessage);
    assert.ok(!index.text.includes("<svg"));
    assert.ok(!index.text.includes('aria-label="Help"'));
  });

  test("fails the build with the same message", async () => {
    await assert.rejects(buildFixture("vite-unknown"), (error: Error) => {
      assert.ok(
        error.message.split("\n").includes(`Error: ${unknownMessage}`),
        `the build failed otherwise: ${error.message}`,
      );
      return true;
    });
  });
});
