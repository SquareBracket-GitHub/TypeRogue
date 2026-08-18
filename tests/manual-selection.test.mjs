import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const context = vm.createContext({});
for (const file of ["src/type-data.js", "src/manual-selection.js"]) {
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
}

const manual = context.PokeRogueManualSelection;
const korean = manual.search("리자몽");
const english = manual.search("charizard");
assert.equal(korean.length, 3);
assert.deepEqual(Array.from(korean, entry => entry.id), Array.from(english, entry => entry.id));
assert.deepEqual(Array.from(manual.search("메가진화 x"), entry => entry.id), ["6:mega-x", "150:mega-x"]);
assert.deepEqual(Array.from(manual.search("alolan"), entry => entry.id), ["26:alola"]);
assert.deepEqual(Array.from(manual.search("없는포켓몬")), []);

const selected = manual.toSnapshot(korean[1], "enemy");
assert.equal(selected.side, "enemy");
assert.equal(selected.formKey, "mega-x");
assert.equal(selected.displayName, "리자몽 (메가진화 X)");
assert.deepEqual(Array.from(selected.types), [9, 15]);
assert.equal(manual.toSnapshot(korean[0], "invalid"), null);

console.log("manual selection tests passed");
