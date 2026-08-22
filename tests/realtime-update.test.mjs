import assert from "node:assert/strict";
import fs from "node:fs";

const pageBridge = fs.readFileSync("src/page-bridge.js", "utf8");
const contentScript = fs.readFileSync("src/content-script.js", "utf8");
const overlay = fs.readFileSync("src/overlay-ui.js", "utf8");

const interval = Number(pageBridge.match(/POLL_INTERVAL_MS\s*=\s*(\d+)/)?.[1]);
assert.ok(interval >= 250, `poll interval is too aggressive: ${interval}`);
assert.match(pageBridge, /if \(update\) \{[\s\S]*publish\("STATE"/);
assert.match(pageBridge, /globalThis\.Phaser\?\.GAMES \?\? capturedGames/);
assert.match(pageBridge, /findBattleSceneInGames\(games\)/);
assert.match(pageBridge, /capturedGames \? "phaser-game-bind" : "phaser-games"/);
assert.match(pageBridge, /publish\("SCENE_CAPTURED", \{[\s\S]*strategy/);
assert.match(pageBridge, /gameSignature: readGameSignature\(nextScene\?\.game\)/);
assert.match(pageBridge, /constructorName:[\s\S]*parentType:[\s\S]*parentValue:[\s\S]*hasSceneManager/);
assert.match(pageBridge, /gameBindObserved,[\s\S]*gameBindSignature/);
assert.match(pageBridge, /signature\?\.hasSceneManager === true/);
assert.match(pageBridge, /Reflect\.apply\(originalBind, this, \[thisArg, \.\.\.args\]\)/);
assert.match(pageBridge, /functionPrototype\.bind === observeBind/);
assert.match(pageBridge, /GAME_OBSERVER_TIMEOUT_MS = 120000/);
assert.match(pageBridge, /setTimeout\(clearGameBindObserver, GAME_OBSERVER_TIMEOUT_MS\)/);
assert.doesNotMatch(pageBridge, /\bfetch\s*\(/);
assert.doesNotMatch(pageBridge, /performance\.getEntriesByType|\bimport\s*\(|installOneShotSceneCapture/);
assert.match(pageBridge, /pagehide[\s\S]*clearGameBindObserver/);
assert.doesNotMatch(pageBridge, /showText|showDialogue|setMode/);
assert.match(contentScript, /overlay\.beginScene\(\)/);
assert.match(contentScript, /overlay\.applyUpdate\(event\.data\.payload\)/);
assert.match(overlay, /update\.lifecycle !== "state-changed"/);
assert.match(overlay, /\["form-changed", "updated"\]/);
assert.match(overlay, /current\.replaceWith\(renderPokemon/);
assert.match(overlay, /renderSide\(sectionBySide\.get\(side\)\)/);

console.log("realtime update tests passed");
