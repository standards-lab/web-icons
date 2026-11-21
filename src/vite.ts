// Adapted from spike-html-hosting-sdk (f49087e): src/icons.ts, its fill a Vite plugin loading this package's icons.
// The marker fill, iconFill(), from @standards-lab/web-icons/vite: in every HTML page Vite serves
// in dev or writes at build, each glyph marker, an empty <svg data-icon="<set>/<name>"></svg>, is
// replaced by that icon's svg, and the page gains no script. A marker this package can't fill, or
// an svg holding data-icon that isn't a marker, fails the page, so none reaches a page empty; a
// comment's text is neither filled nor checked. The icons load from the modules beside this one,
// whatever the consumer installs, so the plugin and its icons are always one release.

import type { Plugin } from "vite";

const packageName = "@standards-lab/web-icons";

const emptySvgElement = /<svg(\s[^>]*)?>\s*<\/svg>/gi;

const svgStartTagHoldingDataIcon = /<svg\s[^>]*?(?<=\s)data-icon(?=[\s=/>])[^>]*>/gi;

const htmlComment = /<!--[\s\S]*?-->/g;

const setSlashName = /^[a-z0-9-]+\/[a-z0-9-]+$/;

const quotedAttributeValue = (attributes: string, name: string): string | undefined => {
  const match = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`).exec(attributes);
  return match === null ? undefined : (match[1] ?? match[2]);
};

type LoadIcon = (icon: string) => Promise<string>;

function iconsFromModulesBesideThisOne(): LoadIcon {
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

async function fillIcons(html: string, page: string, load: LoadIcon): Promise<string> {
  const comments = [...html.matchAll(htmlComment)].map(({ index, 0: text }) => [
    index,
    index + text.length,
  ]);
  const outside = ({ index }: { index: number }): boolean =>
    !comments.some(([start, end]) => index > start && index < end);
  const markers = [...html.matchAll(emptySvgElement)].filter(
    (marker) => outside(marker) && quotedAttributeValue(marker[1] ?? "", "data-icon") !== undefined,
  );
  const opens = new Set(markers.map(({ index }) => index));
  for (const { index, 0: tag } of html.matchAll(svgStartTagHoldingDataIcon)) {
    if (!opens.has(index) && outside({ index })) {
      throw new Error(
        `icons: ${page} holds ${tag}, which isn't an empty <svg data-icon="<set>/<name>"></svg>`,
      );
    }
  }
  if (markers.length === 0) return html;
  const svgs = await Promise.all(
    markers.map(async ([, attributes = ""]) => {
      const icon = quotedAttributeValue(attributes, "data-icon") as string;
      if (!setSlashName.test(icon)) {
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
      const className = quotedAttributeValue(attributes, "class");
      return className === undefined ? svg : svg.replace(/^<svg/, `<svg class="${className}"`);
    }),
  );
  let filled = html;
  for (let i = markers.length - 1; i >= 0; i--) {
    const { index, 0: marker } = markers[i];
    filled = filled.slice(0, index) + svgs[i] + filled.slice(index + marker.length);
  }
  return filled;
}

/** The marker fill, a Vite plugin: every HTML page Vite serves in dev or writes at build, its
 * markers filled with this package's icons before Vite's own transforms read the page, the
 * marker's class carried onto the svg and its other attributes dropped. The page fails, naming it
 * and the icon, on a marker whose name isn't <set>/<name> or whose icon the package doesn't hold,
 * and, naming it and the tag, on an svg holding data-icon that isn't an empty, quoted marker. */
export function iconFill(): Plugin {
  const load = iconsFromModulesBesideThisOne();
  return {
    name: "web-icons:fill",
    transformIndexHtml: {
      order: "pre",
      handler: (html, { path }) => fillIcons(html, path, load),
    },
  };
}
