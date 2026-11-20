import type { Plugin } from "vite";
/** The marker fill, a Vite plugin: every HTML page Vite serves in dev or writes at build, its
 * markers filled with this package's icons before Vite reads the page. */
export declare function iconFill(): Plugin;
