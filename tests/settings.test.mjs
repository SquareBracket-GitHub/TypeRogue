import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const values = new Map();
const browser = {
  storage: {
    local: {
      async get(key) {
        return values.has(key) ? { [key]: values.get(key) } : {};
      },
      async set(next) {
        for (const [key, value] of Object.entries(next)) values.set(key, value);
      },
      async remove(key) {
        values.delete(key);
      }
    }
  }
};

const context = vm.createContext({ browser, Number });
const source = fs.readFileSync(new URL("../src/settings.js", import.meta.url), "utf8");
vm.runInContext(source, context);
const settings = context.PokeRogueTypeHelperSettings;

assert.deepEqual({ ...await settings.load() }, {
  panelPosition: null,
  collapsed: false,
  debugLogging: true
});

const saved = await settings.save({
  panelPosition: { x: 30, y: 40 },
  collapsed: true,
  ignored: "value"
});
assert.deepEqual({ ...saved, panelPosition: { ...saved.panelPosition } }, {
  panelPosition: { x: 30, y: 40 },
  collapsed: true,
  debugLogging: true
});
assert.equal((await settings.load()).collapsed, true);
assert.equal((await settings.reset()).collapsed, false);
assert.equal((await settings.load()).panelPosition, null);

const chromeContext = vm.createContext({ chrome: browser, Number });
vm.runInContext(source, chromeContext);
assert.equal((await chromeContext.PokeRogueTypeHelperSettings.load()).collapsed, false);

console.log("settings tests passed");
