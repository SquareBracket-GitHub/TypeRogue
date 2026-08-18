import assert from "node:assert/strict";
import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const runtimeSources = [
  "src/bridge-core.js",
  "src/page-bridge.js",
  "src/content-script.js",
  "src/overlay-ui.js",
  "src/settings.js",
  "src/manual-selection.js",
  "src/pokemon-data.js",
  "src/type-data.js"
].map(path => fs.readFileSync(path, "utf8")).join("\n");
const bridgeCore = fs.readFileSync("src/bridge-core.js", "utf8");
const pageBridge = fs.readFileSync("src/page-bridge.js", "utf8");
const contentScript = fs.readFileSync("src/content-script.js", "utf8");

assert.deepEqual(manifest.permissions, ["storage"]);
assert.deepEqual(manifest.host_permissions, ["https://pokerogue.net/*"]);
assert.deepEqual(manifest.browser_specific_settings.gecko.data_collection_permissions.required, ["none"]);

assert.doesNotMatch(runtimeSources, /\b(?:XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/);
assert.doesNotMatch(pageBridge, /\b(?:keydown|keyup|keypress)\b/);
assert.doesNotMatch(pageBridge, /\.dispatchEvent\s*\(/);
assert.doesNotMatch(pageBridge, /\.(?:click|focus)\s*\(/);
assert.doesNotMatch(pageBridge, /\bfetch\s*\(/);
assert.doesNotMatch(pageBridge, /performance\.getEntriesByType|\bimport\s*\(|installOneShotSceneCapture/);
assert.match(pageBridge, /clearGameBindObserver/);
assert.match(pageBridge, /pagehide/);

for (const field of ["pokemonId", "speciesId", "fusionSpeciesId", "formIndex", "fusionFormIndex", "formKey", "displayName", "types"]) {
  assert.match(bridgeCore, new RegExp(`\\b${field}\\b`));
}
assert.doesNotMatch(bridgeCore, /(?:account|token|credential|password|email|username|saveData)/i);
assert.match(contentScript, /event\.source === window/);
assert.match(contentScript, /event\.origin === window\.location\.origin/);
assert.match(contentScript, /isValidPayload\(data\.type, data\.payload\)/);
assert.match(contentScript, /isValidState/);

console.log("security tests passed");
