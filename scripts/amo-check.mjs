import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function requireCondition(condition, message) {
  if (!condition) failures.push(message);
}

const manifest = JSON.parse(read("manifest.json"));
const pageBridge = read("src/page-bridge.js");
const listing = read("docs/amo-listing.md");
const metadata = read("docs/amo-metadata.template.json");

requireCondition(!/\b(?:fetch\s*\(|import\s*\(|eval\s*\(|new\s+Function\b)/.test(pageBridge),
  "src/page-bridge.js must not fetch or execute remote code");
requireCondition(!String(manifest.browser_specific_settings?.gecko?.id ?? "").endsWith("@local"),
  "replace the development-only Firefox add-on ID");
requireCondition(fs.existsSync(path.join(root, "LICENSE")),
  "add the publisher-selected LICENSE file");
requireCondition(!listing.includes("TODO"),
  "complete every TODO in docs/amo-listing.md");
requireCondition(!metadata.includes("TODO"),
  "complete every TODO in docs/amo-metadata.template.json");
requireCondition(manifest.browser_specific_settings?.gecko?.data_collection_permissions?.required?.includes("none"),
  "manifest must declare that no data is collected");
requireCondition(manifest.permissions?.length === 1 && manifest.permissions[0] === "storage",
  "only the storage extension permission is expected");
requireCondition(manifest.host_permissions?.length === 1
  && manifest.host_permissions[0] === "https://pokerogue.net/*",
  "host access must remain limited to PokeRogue");

if (failures.length) {
  console.error("AMO preflight failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("AMO preflight passed");
