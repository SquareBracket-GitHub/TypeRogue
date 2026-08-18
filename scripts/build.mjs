import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "dist");
const sourceFiles = [
  "manifest.json",
  "LICENSE",
  "icons/typerogue-48.png",
  "icons/typerogue-96.png",
  "src/type-data.js",
  "src/pokemon-data.js",
  "src/manual-selection.js",
  "src/overlay-ui.js",
  "src/bridge-core.js",
  "src/page-bridge.js",
  "src/build-config.js",
  "src/logger.js",
  "src/settings.js",
  "src/content-script.js",
  "src/overlay.css",
  "src/fonts/Galmuri11.woff2",
  "src/fonts/Galmuri11-Bold.woff2",
  "src/fonts/OFL-Galmuri.md",
  "docs/state-contract.md",
  "docs/type-data.md",
  "docs/release.md",
  "docs/amo-review.md",
  "README.md",
  "README.ko.md",
  "PRIVACY.md",
  "PRIVACY.ko.md",
  "THIRD_PARTY_NOTICES.md"
];

fs.rmSync(output, { recursive: true, force: true });
for (const relativePath of sourceFiles) {
  const target = path.join(output, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, relativePath), target);
}

const releaseConfigPath = path.join(output, "src/build-config.js");
const releaseConfig = fs.readFileSync(releaseConfigPath, "utf8")
  .replace('mode: "development"', 'mode: "production"')
  .replace("debug: true", "debug: false");
fs.writeFileSync(releaseConfigPath, releaseConfig);

console.log(`release extension built at ${output}`);
