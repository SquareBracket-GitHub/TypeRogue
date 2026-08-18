import assert from "node:assert/strict";
import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));
assert.equal(manifest.manifest_version, 3);
assert.deepEqual(manifest.permissions, ["storage"]);
assert.deepEqual(manifest.host_permissions, ["https://pokerogue.net/*"]);
assert.equal(manifest.content_scripts.length, 2);
assert.equal(manifest.browser_specific_settings.gecko.id, "typerogue@potato.new");

for (const script of manifest.content_scripts) {
  assert.deepEqual(script.matches, ["https://pokerogue.net/*"]);
  assert.equal(script.run_at, "document_start");
}

assert.equal(manifest.content_scripts[0].world, "MAIN");
assert.equal(manifest.content_scripts[1].world, "ISOLATED");
assert.deepEqual(manifest.content_scripts[1].css, ["src/overlay.css"]);
assert.ok(manifest.content_scripts[1].js.includes("src/overlay-ui.js"));
assert.ok(manifest.content_scripts[1].js.includes("src/manual-selection.js"));

const bridgeCore = fs.readFileSync(new URL("../src/bridge-core.js", import.meta.url), "utf8");
assert.match(bridgeCore, /schemaVersion/);
assert.match(bridgeCore, /getPlayerField/);
assert.match(bridgeCore, /getEnemyField/);

console.log("manifest tests passed");
