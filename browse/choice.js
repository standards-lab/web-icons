// The browse page's controls, a dev page's and not a package feature: each select of the page's
// form[data-choice], named for a key of a choice, lists the names this page registered (the
// schemes for scheme), and a change applies and saves the whole choice through the foundation's
// preferences.js. Each select shows the profile the root carries, following its changes, or the
// facet's default when the root names none the page registered.
// See docs/internals.md

import { ATTRIBUTES, apply, save, SCHEMES } from "@standards-lab/web-foundation/preferences.js";
import { DEFAULTS, profiles } from "@standards-lab/web-foundation/registry.js";

const root = document.documentElement;
const form = /** @type {HTMLFormElement} */ (document.querySelector("form[data-choice]"));
const selects = [...form.querySelectorAll("select")];

/** @param {HTMLSelectElement} select
 * @returns {import("@standards-lab/web-foundation/preferences.js").Key} */
const keyOf = (select) =>
  /** @type {import("@standards-lab/web-foundation/preferences.js").Key} */ (select.name);

for (const select of selects) {
  const key = keyOf(select);
  const names = key === "scheme" ? SCHEMES : profiles(key);
  select.replaceChildren(...names.map((name) => new Option(name)));
}

function showRootProfile() {
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
new MutationObserver(showRootProfile).observe(root, { attributeFilter: Object.values(ATTRIBUTES) });
showRootProfile();
