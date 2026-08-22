import fs from "node:fs";

const failures = [];
const manifest = JSON.parse(fs.readFileSync("manifest.chrome.json", "utf8"));
const runtimeFiles = [
  "src/bridge-core.js",
  "src/page-bridge.js",
  "src/content-script.js",
  "src/overlay-ui.js",
  "src/settings.js",
  "src/manual-selection.js",
  "src/pokemon-data.js",
  "src/type-data.js"
];
const runtimeSource = runtimeFiles.map(file => fs.readFileSync(file, "utf8")).join("\n");
const privacy = fs.readFileSync("PRIVACY.md", "utf8");

function requireCondition(condition, message) {
  if (!condition) failures.push(message);
}

requireCondition(manifest.manifest_version === 3, "Chrome package must use Manifest V3");
requireCondition(manifest.browser_specific_settings === undefined,
  "Chrome manifest must not contain Firefox-only browser_specific_settings");
requireCondition(manifest.permissions?.length === 1 && manifest.permissions[0] === "storage",
  "only the storage extension permission is expected");
requireCondition(manifest.host_permissions?.length === 1
  && manifest.host_permissions[0] === "https://pokerogue.net/*",
  "host access must remain limited to PokeRogue");
requireCondition(!/\b(?:fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|import\s*\(|eval\s*\(|new\s+Function\b)/.test(runtimeSource),
  "runtime code must not fetch, transmit, or execute remote code");
requireCondition(privacy.includes("Chrome Web Store User Data Policy"),
  "privacy notice must include the Chrome Web Store Limited Use statement");

if (failures.length) {
  console.error("Chrome Web Store preflight failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Chrome Web Store preflight passed");
