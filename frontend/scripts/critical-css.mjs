#!/usr/bin/env node
/**
 * Post-build critical-CSS inlining.
 *
 * The paint chain on a cold mobile load was: document → 76KB render-blocking
 * stylesheet → first paint, which put simulated FCP at ~3.3s even after the
 * static hero was prerendered into the shell (the HTML was there, but nothing
 * could paint until the CSS arrived).
 *
 * Beasties (maintained fork of Critters) inlines the CSS rules each shell
 * actually uses above the fold into a <style> tag and swaps the full
 * stylesheet to load asynchronously — so first paint needs only the HTML
 * document itself.
 *
 * Runs after prerender-meta.mjs (see package.json build script) so every
 * route shell, including the "/" hero shell, gets its own critical CSS.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { globSync } from "node:fs";
import Beasties from "beasties";

const DIST = join(dirname(fileURLToPath(import.meta.url)), "..", "build");

const beasties = new Beasties({
  path: DIST,
  // Keep the full stylesheet intact — the SPA needs every rule once React
  // mounts; we only want the *loading* to be async, not the rules removed.
  pruneSource: false,
  // Load the full CSS via media="print" swap (same pattern as our fonts) so
  // it never blocks rendering.
  preload: "media",
  // Inline @font-face/keyframes references used above the fold.
  fonts: false,
  logLevel: "warn",
});

const files = globSync(join(DIST, "**", "*.html"));
let done = 0;
for (const file of files) {
  const html = readFileSync(file, "utf8");
  writeFileSync(file, await beasties.process(html));
  done++;
}
console.log(`critical-css: inlined critical CSS into ${done} shells`);
