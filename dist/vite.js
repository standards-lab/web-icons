// Adapted from spike-html-hosting-sdk (f49087e): src/icons.ts, its fill as a Vite plugin of its
// own, loading the icons from this package rather than from the site's root.
// The marker fill, iconFill(), from @standards-lab/web-icons/vite: in every HTML page Vite serves
// in dev or writes at build, each glyph marker, an empty <svg data-icon="<set>/<name>"></svg>, is
// replaced by that icon's svg, and the page gains no script. A marker this package can't fill, or
// an svg holding data-icon that isn't a marker, fails the page, so none reaches a page empty; a
// comment's text is neither filled nor checked. The icons load from the modules beside this one,
// whatever the consumer installs, so the plugin and its icons are always one release.
var __rewriteRelativeImportExtension = (this && this.__rewriteRelativeImportExtension) || function (path, preserveJsx) {
    if (typeof path === "string" && /^\.\.?\//.test(path)) {
        return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function (m, tsx, d, ext, cm) {
            return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : (d + ext + "." + cm.toLowerCase() + "js");
        });
    }
    return path;
};
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
const attributeValue = (attributes, name) => {
    const match = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`).exec(attributes);
    return match === null ? undefined : (match[1] ?? match[2]);
};
/** Loads each icon from this package's module beside this one, imported once per plugin. */
function packageIcons() {
    const loaded = new Map();
    return (icon) => {
        let svg = loaded.get(icon);
        if (svg === undefined) {
            svg = (async () => {
                const module = (await import(__rewriteRelativeImportExtension(new URL(`./${icon}.js`, import.meta.url).href)));
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
 * icon's svg from load, the marker's class carried onto it and its other attributes dropped;
 * rejects on a marker whose name isn't <set>/<name> or whose icon load can't give, naming the page
 * and the icon, and on an svg holding data-icon that isn't a marker, naming the page and its tag. */
async function fillIcons(html, page, load) {
    const comments = [...html.matchAll(comment)].map(({ index, 0: text }) => [
        index,
        index + text.length,
    ]);
    const outside = ({ index }) => !comments.some(([start, end]) => index > start && index < end);
    const markers = [...html.matchAll(svgElement)].filter((marker) => outside(marker) && attributeValue(marker[1] ?? "", "data-icon") !== undefined);
    const opens = new Set(markers.map(({ index }) => index));
    for (const { index, 0: tag } of html.matchAll(iconTag)) {
        if (!opens.has(index) && outside({ index })) {
            throw new Error(`icons: ${page} holds ${tag}, which isn't an empty <svg data-icon="<set>/<name>"></svg>`);
        }
    }
    if (markers.length === 0)
        return html;
    const svgs = await Promise.all(markers.map(async ([, attributes = ""]) => {
        const icon = attributeValue(attributes, "data-icon");
        if (!iconName.test(icon)) {
            throw new Error(`icons: ${page} names the icon "${icon}", which isn't <set>/<name>`);
        }
        let svg;
        try {
            svg = await load(icon);
        }
        catch (cause) {
            throw new Error(`icons: ${page} names the icon ${icon}, which ${packageName} doesn't hold`, {
                cause,
            });
        }
        const className = attributeValue(attributes, "class");
        return className === undefined ? svg : svg.replace(/^<svg/, `<svg class="${className}"`);
    }));
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
export function iconFill() {
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
