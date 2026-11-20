// Adapted from web-foundation (72e759f): demo/choice.js, on the import map's bare specifiers, and
// showing the root's applied profile in place of the stored choice.
// The browse page's controls, a dev page's and not a package feature: each select of the page's
// form[data-choice], named for a key of a choice, lists the names this page registered (the
// schemes for scheme), and a change applies and saves the whole choice through the foundation's
// preferences.js. Each select shows the profile the root carries. preferences.js applies the
// stored choice there before first paint, and another tab's save on its storage event, so a select
// shows the stored choice and follows another tab's save; with nothing stored it shows a profile
// the URL query, or a capture, set on the root. An attribute absent, or naming a profile this page
// didn't register, shows the facet's default, which the CSS applies with none.

import { ATTRIBUTES, apply, save, SCHEMES } from "@standards-lab/web-foundation/preferences.js";
import { DEFAULTS, profiles } from "@standards-lab/web-foundation/registry.js";

const root = document.documentElement;
const form = /** @type {HTMLFormElement} */ (document.querySelector("form[data-choice]"));
const selects = [...form.querySelectorAll("select")];

/** A select's key of a choice: its name, a facet or the scheme.
 * @param {HTMLSelectElement} select
 * @returns {import("@standards-lab/web-foundation/preferences.js").Key} */
const keyOf = (select) =>
  /** @type {import("@standards-lab/web-foundation/preferences.js").Key} */ (select.name);

for (const select of selects) {
  const key = keyOf(select);
  const names = key === "scheme" ? SCHEMES : profiles(key);
  select.replaceChildren(...names.map((name) => new Option(name)));
}

/** Selects the root's profile in each select, its default where the root names none it lists. */
function show() {
  for (const select of selects) {
    const key = keyOf(select);
    const names = [...select.options].map((option) => option.value);
    const name = root.getAttribute(ATTRIBUTES[key]);
    select.value =
      name !== null && names.includes(name) ? name : key === "scheme" ? SCHEMES[0] : DEFAULTS[key];
  }
}

form.addEventListener("change", () => {
  const choice = Object.fromEntries(selects.map((select) => [select.name, select.value]));
  apply(choice);
  save(choice);
});
// The root's profile attributes change on a change here, another tab's save, or a capture's
// profile: each shows in the selects.
new MutationObserver(show).observe(root, { attributeFilter: Object.values(ATTRIBUTES) });
show();
