// Adapted from web-foundation (72e759f): eslint.config.js, its layer table cut to the icons'.
// Adapted from web-components (a659353): eslint.config.js, its policies naming a package.
// The lint the check runs: the recommended rules, every suppression's reason, the layer's imports
// in src/, and every .css import a CSS module script.
// See docs/internals.md

import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import boundaries from "eslint-plugin-boundaries";
import importX from "eslint-plugin-import-x";
import globals from "globals";
import tseslint from "typescript-eslint";

const code = ["**/*.js", "**/*.ts"];

const cssModuleScriptAttribute = `:matches(ImportAttribute[key.name='type'], ImportAttribute[key.value='type'])[value.value='css']`;
const cssSpecifier = "[source.value=/\\.css$/]";
const cssDynamicImports = [
  `ImportExpression${cssSpecifier}`,
  "ImportExpression > TemplateLiteral.source > TemplateElement[tail=true][value.cooked=/\\.css$/]",
];
const cssImports = [
  ...["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].map((type) => ({
    selector: `${type}${cssSpecifier}:not(:has(${cssModuleScriptAttribute}))`,
    message: "A .css import is a CSS module script: add with { type: 'css' }.",
  })),
  ...cssDynamicImports.map((selector) => ({
    selector,
    message:
      "A .css file is imported statically, as a CSS module script with { type: 'css' }, never by " +
      "import().",
  })),
];

/** The layer table cut to the icons: its sources, the plugin, which may import themselves and, by
 * name, vite, the package's one peer, for the plugin's types. */
export const layers = [{ name: "icons", path: "src", may: ["icons", "vite"] }];

const layerElements = layers.map(({ name, path }) => ({
  type: name,
  pattern: [path, `${path}/**/.*`],
  partialMatch: false,
}));

const layerPolicies = layers.map(({ name, may }) => ({
  from: { element: { type: name } },
  allow: {
    to: may.map((target) =>
      target === name
        ? { element: { type: target } }
        : { module: { origin: "external", source: target } },
    ),
  },
}));

const declarationFilesAsTypeImportsOnly = {
  disallow: { to: { internalPath: "**/*.d.ts" }, dependency: { kind: "value" } },
  message:
    "A .d.ts file is a declaration with no runtime: import it with `import type` (or export " +
    "from it with `export type`), never as a value, a side effect, or an import().",
};

export default defineConfig([
  { ignores: ["dist/"] },
  { files: code, extends: [js.configs.recommended, tseslint.configs.recommended] },
  { files: code, languageOptions: { globals: globals.browser } },
  { files: code, rules: { "no-restricted-syntax": ["error", ...cssImports] } },
  {
    files: code,
    plugins: { "@eslint-community/eslint-comments": eslintComments },
    rules: {
      "@eslint-community/eslint-comments/require-description": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": "allow-with-description",
          "ts-nocheck": "allow-with-description",
          "ts-check": false,
        },
      ],
    },
  },
  {
    files: ["test/**/*.js", "test/**/*.ts", "scripts/**"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["src/**"],
    plugins: { boundaries, "import-x": importX },
    settings: {
      "import/resolver": { typescript: true },
      "import-x/resolver": { typescript: true },
      "boundaries/elements": layerElements,
    },
    rules: {
      "import-x/no-unresolved": "error",
      "import-x/no-extraneous-dependencies": [
        "error",
        { devDependencies: false, includeInternal: true, includeTypes: true },
      ],
      "import-x/no-relative-packages": "error",
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          checkAllOrigins: true,
          checkUnknownLocals: true,
          checkInternals: true,
          policies: [...layerPolicies, declarationFilesAsTypeImportsOnly],
        },
      ],
    },
  },
]);
