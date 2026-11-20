// Adapted from spike-html-hosting-sdk (f49087e): src/icons.ts, its fill as a Vite plugin of its
// own, loading the icons from this package rather than from the site's root.
// The marker fill, iconFill(), imported from @standards-lab/web-icons/vite: a Vite plugin that
// replaces every glyph marker, an empty <svg data-icon="<set>/<name>"></svg>, in every HTML page
// Vite serves in dev or writes at build, with that icon's svg, the default export of this
// package's module <set>/<name>: 1em square, drawn in currentColor, aria-hidden and
// focusable="false". A class on the marker carries over onto the svg, so a page styles a glyph
// where it places it; any other attribute on the marker is dropped, the icon's own standing. The
// page gains the icon's markup alone, never a script, and a page with no marker passes through
// unchanged.
//
// A marker whose name isn't <set>/<name>, each a run of lowercase letters, digits, and hyphens, or
// whose icon this package doesn't hold, fails the page, naming the page and the icon, and so does
// an svg holding data-icon that isn't a marker, self-closed, unquoted, or not empty, naming the
// page and its tag, so no marker reaches a page empty. The build fails with that message, and in
// dev the page's request fails with it, so nothing reaches the browser half-filled. An HTML
// comment's text is neither filled nor checked, so a comment may show a marker.
//
// The icons are this package's: each loads from the module beside this one, dist/<set>/<name>.js,
// whatever the consuming project installs, so the plugin and its icons are always one release.

import type { Plugin } from "vite";

/** The package the icons come from, as a failure names it. */
const packageName = "@standards-lab/web-icons";

/** An empty svg element, its attributes captured; a marker when they hold data-icon. */
const svgElement = /<svg(\s[^>]*)?>\s*<\/svg>/gi;

/** An svg's start tag holding data-icon, however written; each must open a marker. */
const iconTag = /<svg\s[^>]*?(?<=\s)data-icon(?=[\s=/>])[^>]*>/gi;

/** An HTML comment, whose text holds no marker. */
const comment = /<!--[\s\S]*?-->/g;

/** A marker's icon name, <set>/<name>, which names no path outside its set's directory. */
const iconName = /^[a-z0-9-]+\/[a-z0-9-]+$/;

/** The value of the quoted attribute name in an element's attributes, if it has one. */
const attributeValue = (attributes: string, name: string): string | undefined => {
  const match = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`).exec(attributes);
  return match === null ? undefined : (match[1] ?? match[2]);
};

/** An icon's svg, by its marker's name, <set>/<name>; rejects when the package holds none. */
type LoadIcon = (icon: string) => Promise<string>;

/** Loads each icon from this package's module beside this one, imported once per plugin. */
function packageIcons(): LoadIcon {
  const loaded = new Map<string, Promise<string>>();
  return (icon) => {
    let svg = loaded.get(icon);
    if (svg === undefined) {
      svg = (async () => {
        const module = (await import(new URL(`./${icon}.js`, import.meta.url).href)) as {
          default: unknown;
        };
        if (typeof module.default !== "string") {
          throw new Error(`${packageName}/${icon} exports no svg string`);
        }
        return module.default;
      })();
      loaded.set(icon, svg);
    }
    return svg;
  };
}

/** The page's html, page its path as a failure names it, with every glyph marker replaced by its
 * icon's svg from load, the marker's class carried onto it; rejects on a marker whose name isn't
 * <set>/<name> or whose icon load can't give, naming the page and the icon, and on an svg holding
 * data-icon that isn't a marker, naming the page and its tag. */
async function fillIcons(html: string, page: string, load: LoadIcon): Promise<string> {
  const comments = [...html.matchAll(comment)].map(({ index, 0: text }) => [
    index,
    index + text.length,
  ]);
  const outside = ({ index }: { index: number }): boolean =>
    !comments.some(([start, end]) => index > start && index < end);
  const markers = [...html.matchAll(svgElement)].filter(
    (marker) => outside(marker) && attributeValue(marker[1] ?? "", "data-icon") !== undefined,
  );
  const opens = new Set(markers.map(({ index }) => index));
  for (const { index, 0: tag } of html.matchAll(iconTag)) {
    if (!opens.has(index) && outside({ index })) {
      throw new Error(
        `icons: ${page} holds ${tag}, which isn't an empty <svg data-icon="<set>/<name>"></svg>`,
      );
    }
  }
  if (markers.length === 0) return html;
  const svgs = await Promise.all(
    markers.map(async ([, attributes = ""]) => {
      const icon = attributeValue(attributes, "data-icon") as string;
      if (!iconName.test(icon)) {
        throw new Error(`icons: ${page} names the icon "${icon}", which isn't <set>/<name>`);
      }
      let svg: string;
      try {
        svg = await load(icon);
      } catch (cause) {
        throw new Error(
          `icons: ${page} names the icon ${icon}, which ${packageName} doesn't hold`,
          {
            cause,
          },
        );
      }
      const className = attributeValue(attributes, "class");
      return className === undefined ? svg : svg.replace(/^<svg/, `<svg class="${className}"`);
    }),
  );
  // Each marker's svg in its place, from the last back, so each index still points at its marker.
  let filled = html;
  for (let i = markers.length - 1; i >= 0; i--) {
    const { index, 0: marker } = markers[i];
    filled = filled.slice(0, index) + svgs[i] + filled.slice(index + marker.length);
  }
  return filled;
}

/** The marker fill, a Vite plugin: every HTML page Vite serves in dev or writes at build, its
 * markers filled with this package's icons before Vite reads the page. */
export function iconFill(): Plugin {
  const load = packageIcons();
  return {
    name: "web-icons:fill",
    // pre: the fill runs on the page as written, before Vite's own transforms read it, in dev and
    // at build alike; ctx.path is the page's path from the root, /index.html, in both.
    transformIndexHtml: {
      order: "pre",
      handler: (html, { path }) => fillIcons(html, path, load),
    },
  };
}
