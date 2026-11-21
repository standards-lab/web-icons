// Adapted from spike-html-hosting-icons (8b8d955): browse/browse.js.
// The browse page's module: a section for each released set, in the catalog's order, headed by
// its title and prefix, with its licence and its upstream, then its glyphs, each the built
// module's default export, imported as a consumer imports it, set as the markup of its cell beside
// its name. window.ready settles once every glyph is in the page, or rejects naming the module
// that failed to load.
// See docs/internals.md

import sets from "./catalog.js";

/** @param {string} tag
 * @param {(Node | string)[]} children */
function element(tag, ...children) {
  const node = document.createElement(tag);
  node.append(...children);
  return node;
}

/** @param {string} href
 * @param {string} text */
function link(href, text) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.append(text);
  return anchor;
}

/** @param {string} name */
function withBreakAfterEachHyphen(name) {
  return name
    .split(/(?<=-)/)
    .flatMap((part, index) => (index === 0 ? [part] : [document.createElement("wbr"), part]));
}

/** @param {import("./catalog.js").CatalogSet} set
 * @param {string[]} glyphs */
function section(set, glyphs) {
  const heading = element("h2", `${set.title} `, element("code", set.name));
  heading.id = set.name;
  const { license, upstream } = set;
  const label = license.spdx ?? license.title;
  const about = element(
    "dl",
    element("dt", "Licence"),
    element("dd", license.url === undefined ? label : link(license.url, label)),
    element("dt", "Upstream"),
    element("dd", link(`${upstream.repository}/tree/${upstream.tag}`, upstream.tag)),
    element("dt", "Glyphs"),
    element("dd", String(set.icons.length)),
  );
  about.className = "about";
  const list = element(
    "ul",
    ...set.icons.map((name, index) => {
      const glyph = element("span");
      glyph.className = "glyph";
      glyph.innerHTML = glyphs[index];
      const item = element("li", glyph, element("code", ...withBreakAfterEachHyphen(name)));
      item.dataset.icon = `${set.name}/${name}`;
      return item;
    }),
  );
  list.className = "glyphs";
  const labelled = element("section", heading, about, list);
  labelled.setAttribute("aria-labelledby", set.name);
  return labelled;
}

/** @type {Window & { ready?: Promise<void> }} */ (window).ready = (async () => {
  const main = /** @type {HTMLElement} */ (document.querySelector("main"));
  for (const set of sets) {
    const glyphs = await Promise.all(
      set.icons.map(async (name) => {
        /** @type {{ default: string }} */
        const module = await import(`/dist/${set.name}/${name}.js`);
        return module.default;
      }),
    );
    main.append(section(set, glyphs));
  }
})();
