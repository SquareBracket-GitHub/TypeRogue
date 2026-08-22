import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

execFileSync(process.execPath, ["scripts/build.mjs"], { stdio: "pipe" });

const firefox = JSON.parse(fs.readFileSync("dist/firefox/manifest.json", "utf8"));
const chrome = JSON.parse(fs.readFileSync("dist/chrome/manifest.json", "utf8"));
const chromeSettings = fs.readFileSync("dist/chrome/src/settings.js", "utf8");
const chromeBundle = fs.readFileSync("dist/chrome/src/isolated-bundle.js", "utf8");
const chromeBuildConfig = fs.readFileSync("dist/chrome/src/build-config.js", "utf8");

assert.equal(firefox.browser_specific_settings.gecko.id, "typerogue@potato.new");
assert.equal(chrome.browser_specific_settings, undefined);
assert.equal(chrome.minimum_chrome_version, "111");
assert.match(chromeSettings, /globalScope\.browser \?\? globalScope\.chrome/);
assert.ok(chromeBundle.indexOf("installTypeData") < chromeBundle.indexOf("installManualSelection"));
assert.ok(chromeBundle.indexOf("installManualSelection") < chromeBundle.indexOf("startContentScript"));
assert.match(chromeBundle, /mode: "production"/);
assert.match(chromeBundle, /debug: false/);
assert.match(chromeBuildConfig, /mode: "production"/);
assert.match(chromeBuildConfig, /debug: false/);

console.log("build tests passed");
