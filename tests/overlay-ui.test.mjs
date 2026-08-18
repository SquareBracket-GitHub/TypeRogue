import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const context = vm.createContext({});
for (const file of ["src/type-data.js", "src/pokemon-data.js", "src/manual-selection.js", "src/overlay-ui.js"]) {
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
}

const overlay = context.PokeRogueTypeHelperOverlay;
const T = context.PokeRogueTypeData.TYPE_IDS;
const gate = overlay.createSequenceGate();
assert.equal(gate.accept(1), true);
assert.equal(gate.accept(1), false);
assert.equal(gate.accept(0), false);
assert.equal(gate.accept(3), true);
assert.equal(gate.accept(2), false);
gate.reset();
assert.equal(gate.accept(1), true);
const view = overlay.buildPanelView({
  fields: {
    enemy: [{ side: "enemy", slot: 0, displayName: "리자몽", types: [T.FIRE, T.FLYING] }],
    player: [{ side: "player", slot: 0, displayName: "거북왕", types: [T.WATER] }]
  }
});

assert.deepEqual(Array.from(view, section => section.title), ["상대", "아군"]);
assert.equal(view[0].pokemon[0].name, "리자몽");
assert.equal(view[0].pokemon[0].side, "enemy");
assert.equal(view[0].pokemon[0].slot, 0);
assert.deepEqual(Array.from(view[0].pokemon[0].types, type => type.ko), ["불꽃", "비행"]);
const changedFormView = overlay.buildPokemonView({ side: "enemy", slot: 0, displayName: "리자몽 X", types: [T.FIRE, T.DRAGON] });
assert.deepEqual(Array.from(changedFormView.types, type => type.ko), ["불꽃", "드래곤"]);
assert.notDeepEqual(
  Array.from(changedFormView.matchups, group => [group.multiplier, Array.from(group.types, type => type.id)]),
  Array.from(view[0].pokemon[0].matchups, group => [group.multiplier, Array.from(group.types, type => type.id)])
);
assert.deepEqual(Array.from(view[0].pokemon[0].matchups, group => group.multiplier), [4, 2, .5, .25, 0].filter(
  multiplier => view[0].pokemon[0].matchups.some(group => group.multiplier === multiplier)
));
assert.ok(view.flatMap(section => Array.from(section.pokemon)).every(
  pokemon => pokemon.matchups.every(group => group.multiplier !== 1 && group.types.length > 0)
));

const manualSnapshot = context.PokeRogueManualSelection.toSnapshot(
  context.PokeRogueManualSelection.search("피카츄")[0],
  "player"
);
const failedView = overlay.buildPanelView({ detection: { ok: false }, fields: { enemy: [], player: [] } }, { player: manualSnapshot });
assert.equal(failedView[1].pokemon[0].name, "피카츄");
const recoveredView = overlay.buildPanelView({ detection: { ok: true }, fields: { enemy: [], player: [] } }, { player: manualSnapshot });
assert.equal(recoveredView[1].pokemon.length, 0);

assert.match(overlay.SHADOW_STYLES, /max-height:\s*calc\(100vh/);
assert.match(overlay.SHADOW_STYLES, /overflow:\s*auto/);
assert.match(overlay.SHADOW_STYLES, /\.type-icon/);
assert.match(overlay.SHADOW_STYLES, /\.multiplier/);
assert.match(overlay.SHADOW_STYLES, /touch-action:\s*none/);
assert.match(overlay.SHADOW_STYLES, /\.panel-content\[hidden\]/);

assert.deepEqual(
  { ...overlay.clampPosition({ x: -20, y: 900 }, { width: 800, height: 600 }, { width: 260, height: 200 }) },
  { x: 0, y: 400 }
);
assert.deepEqual(
  { ...overlay.clampPosition({ x: 50, y: 60 }, { width: 800, height: 600 }, { width: 260, height: 200 }) },
  { x: 50, y: 60 }
);
assert.equal(overlay.isRestorablePosition({ x: 540, y: 400 }, { width: 800, height: 600 }, { width: 260, height: 200 }), true);
assert.equal(overlay.isRestorablePosition({ x: 541, y: 400 }, { width: 800, height: 600 }, { width: 260, height: 200 }), false);
assert.equal(overlay.isRestorablePosition({ x: -1, y: 0 }, { width: 800, height: 600 }, { width: 260, height: 200 }), false);

const source = fs.readFileSync("src/overlay-ui.js", "utf8");
assert.match(source, /attachShadow\(\{ mode: "open" \}\)/);
assert.match(source, /aria-label", "방어 상성"/);
assert.match(source, /setPointerCapture/);
assert.match(source, /settingsStore\.save\(\{ panelPosition: position \}\)/);
assert.match(source, /settingsStore\.save\(\{ collapsed,/);
assert.match(source, /settingsStore\.reset\(\)/);
assert.match(source, /collapseButton\.tabIndex = -1/);
assert.match(source, /resetButton\.tabIndex = -1/);
assert.match(source, /event\.currentTarget\.blur\(\)/);
assert.match(source, /상대 0 · 아군 0/);
assert.match(source, /function correctPositionAfterLayout\(\)/);
assert.match(source, /전투 감지 대기 중/);
assert.match(source, /자동 감지에 실패했습니다/);
assert.match(source, /한국어 또는 영어 이름/);
assert.doesNotMatch(source, /detection\.errors/);
assert.match(source, /renderSide\(section\);[\s\S]*correctPositionAfterLayout\(\)/);
assert.ok(!source.includes("innerHTML"));

const css = fs.readFileSync("src/overlay.css", "utf8");
assert.match(css, /z-index:\s*2147483647/);
assert.match(css, /isolation:\s*isolate/);
assert.match(css, /@media/);

console.log("overlay UI tests passed");
