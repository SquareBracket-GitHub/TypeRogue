import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requestedBrowser = process.argv.find(argument => argument.startsWith("--browser="))?.split("=")[1];
const browsers = requestedBrowser ? [requestedBrowser] : ["firefox", "chrome"];
const supportedBrowsers = new Set(["firefox", "chrome"]);
const isolatedScripts = [
  "src/build-config.js",
  "src/logger.js",
  "src/settings.js",
  "src/type-data.js",
  "src/pokemon-data.js",
  "src/manual-selection.js",
  "src/overlay-ui.js",
  "src/content-script.js"
];
const sourceFiles = [
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
  "docs/chrome-review.md",
  "README.md",
  "README.ko.md",
  "PRIVACY.md",
  "PRIVACY.ko.md",
  "THIRD_PARTY_NOTICES.md"
];

for (const browser of browsers) {
  if (!supportedBrowsers.has(browser)) {
    throw new Error(`unsupported browser: ${browser}`);
  }
}

if (requestedBrowser) {
  fs.rmSync(path.join(root, "dist", requestedBrowser), { recursive: true, force: true });
} else {
  fs.rmSync(path.join(root, "dist"), { recursive: true, force: true });
}

for (const browser of browsers) {
  const output = path.join(root, "dist", browser);
  for (const relativePath of sourceFiles) {
    const target = path.join(output, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, relativePath), target);
  }

  const manifestSource = browser === "firefox" ? "manifest.json" : "manifest.chrome.json";
  fs.copyFileSync(path.join(root, manifestSource), path.join(output, "manifest.json"));

  if (browser === "chrome") {
    const isolatedBundle = isolatedScripts
      .map(relativePath => fs.readFileSync(path.join(root, relativePath), "utf8"))
      .join("\n")
      .replace('mode: "development"', 'mode: "production"')
      .replace("debug: true", "debug: false");
    fs.writeFileSync(path.join(output, "src/isolated-bundle.js"), isolatedBundle);
  }

  const releaseConfigPath = path.join(output, "src/build-config.js");
  const releaseConfig = fs.readFileSync(releaseConfigPath, "utf8")
    .replace('mode: "development"', 'mode: "production"')
    .replace("debug: true", "debug: false");
  fs.writeFileSync(releaseConfigPath, releaseConfig);

  console.log(`${browser} release extension built at ${output}`);
}
