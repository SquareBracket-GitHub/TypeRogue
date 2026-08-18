import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/bridge-core.js", import.meta.url), "utf8");
const context = vm.createContext({});
vm.runInContext(source, context);
const core = context.PokeRogueBridgeCore;

const plain = value => JSON.parse(JSON.stringify(value));
const inactiveBattle = { getPlayerField() {}, getEnemyField() {}, sys: { isActive: () => false } };
const activeBattle = { getPlayerField() {}, getEnemyField() {}, sys: { isActive: () => true } };
assert.equal(core.findBattleSceneInGames([{ scene: { scenes: [{}, inactiveBattle, activeBattle] } }]), activeBattle);
assert.equal(core.findBattleSceneInGames([{ scene: { scenes: [{}, inactiveBattle] } }]), inactiveBattle);
assert.equal(core.findBattleSceneInGames([]), null);
const newerActiveBattle = { getPlayerField() {}, getEnemyField() {}, sys: { isActive: () => true } };
assert.equal(core.findBattleSceneInGames([
  { scene: { scenes: [activeBattle] } },
  { scene: { scenes: [newerActiveBattle] } }
]), newerActiveBattle);
const brokenActivityBattle = { getPlayerField() {}, getEnemyField() {}, sys: { isActive: () => { throw new Error("destroyed"); } } };
assert.equal(core.findBattleSceneInGames([{ scene: { scenes: [brokenActivityBattle, activeBattle] } }]), activeBattle);

function pokemon(id, speciesId, formIndex, displayName, types, extra = {}) {
  return {
    id,
    species: { speciesId },
    formIndex,
    name: displayName,
    getFormKey: () => `form-${formIndex}`,
    getTypes: options => {
      assert.equal(options.includeTeraType, false);
      assert.equal(options.bypassSummonData, true);
      assert.equal(options.ignoreThirdType, true);
      return types;
    },
    ...extra
  };
}

function scene(player, enemy, currentBattle = { double: false }) {
  return {
    currentBattle,
    getPlayerField: activeOnly => {
      assert.equal(activeOnly, false, "슬롯 보존을 위해 activeOnly=false여야 한다");
      return player;
    },
    getEnemyField: activeOnly => {
      assert.equal(activeOnly, false, "슬롯 보존을 위해 activeOnly=false여야 한다");
      return enemy;
    }
  };
}

const koreanPlayer = pokemon(10, 6, 1, "리자몽", [9, 2]);
const englishEnemy = pokemon(20, 74, 0, "Geodude", [5, 12]);
const single = core.readSceneState(scene([koreanPlayer], [englishEnemy]));

assert.equal(single.schemaVersion, 1);
assert.equal(single.status, "battle");
assert.equal(single.detection.ok, true);
assert.equal(single.battle.active, true);
assert.equal(single.battle.double, false);
assert.equal(single.fields.player[0].side, "player");
assert.equal(single.fields.player[0].slot, 0);
assert.equal(single.fields.player[0].speciesId, 6);
assert.equal(single.fields.player[0].formIndex, 1);
assert.equal(single.fields.player[0].displayName, "리자몽");
assert.deepEqual(plain(single.fields.player[0].types), [9, 2]);
assert.equal(single.fields.enemy[0].side, "enemy");
assert.equal(single.fields.enemy[0].slot, 0);
assert.equal(single.fields.enemy[0].displayName, "Geodude");

const secondPlayer = pokemon(11, 25, 0, "Pikachu", [12]);
const secondEnemy = pokemon(21, 7, 0, "꼬부기", [10]);
const double = core.readSceneState(scene(
  [koreanPlayer, secondPlayer],
  [englishEnemy, secondEnemy],
  { double: true }
));
assert.equal(double.battle.double, true);
assert.deepEqual(plain(double.fields.player.map(entry => entry.slot)), [0, 1]);
assert.deepEqual(plain(double.fields.enemy.map(entry => entry.slot)), [0, 1]);

const sparseDouble = core.readSceneState(scene(
  [null, secondPlayer],
  [englishEnemy, null],
  { double: true }
));
assert.deepEqual(plain(sparseDouble.fields.player.map(entry => entry.slot)), [1]);
assert.deepEqual(plain(sparseDouble.fields.enemy.map(entry => entry.slot)), [0]);

const start = core.createStateUpdate(null, single);
assert.equal(start.lifecycle, "battle-start");
assert.equal(start.changedSlots.length, 2);
assert.equal(core.createStateUpdate(single, single), null, "동일 상태는 중복 전송하지 않는다");

const switchedPlayer = pokemon(12, 1, 0, "Bulbasaur", [11, 3]);
const switchedState = core.readSceneState(scene([switchedPlayer], [englishEnemy]));
const switched = core.createStateUpdate(single, switchedState);
assert.equal(switched.lifecycle, "state-changed");
assert.deepEqual(plain(switched.changedSlots.map(change => [change.side, change.slot, change.kind])), [
  ["player", 0, "switched"]
]);

const changedForm = pokemon(12, 1, 1, "Bulbasaur-Mega", [11, 17]);
const formState = core.readSceneState(scene([changedForm], [englishEnemy]));
const formUpdate = core.createStateUpdate(switchedState, formState);
assert.equal(formUpdate.changedSlots[0].kind, "form-changed");
assert.deepEqual(plain(formUpdate.changedSlots[0].after.types), [11, 17]);

const ended = core.readSceneState(scene([], [], null));
const endUpdate = core.createStateUpdate(formState, ended);
assert.equal(endUpdate.lifecycle, "battle-end");
assert.deepEqual(plain(endUpdate.changedSlots.map(change => change.kind)), ["left", "left"]);

const unavailable = core.readSceneState({ currentBattle: {} });
assert.equal(unavailable.status, "unavailable");
assert.equal(unavailable.detection.ok, false);
assert.equal(unavailable.detection.errors.length, 2);
assert.equal(core.createStateUpdate(ended, unavailable).lifecycle, "detection-failed");

const thrown = core.readSceneState({
  currentBattle: {},
  getPlayerField: () => { throw new Error("changed internals"); },
  getEnemyField: () => []
});
assert.equal(thrown.status, "unavailable");
assert.match(thrown.detection.errors[0], /changed internals/);

const fragilePokemon = {
  get id() { throw new Error("id unavailable during dialogue"); },
  get species() { throw new Error("species unavailable during dialogue"); },
  get name() { throw new Error("translation unavailable during dialogue"); },
  get formIndex() { throw new Error("form unavailable during dialogue"); },
  getNameToRender: () => "Rival Pokemon",
  getFormKey: () => { throw new Error("form key unavailable"); },
  getTypes: () => [9]
};
const fragileSnapshot = core.snapshotPokemon(fragilePokemon, "enemy", 0);
assert.equal(fragileSnapshot.pokemonId, null);
assert.equal(fragileSnapshot.speciesId, null);
assert.equal(fragileSnapshot.formIndex, null);
assert.equal(fragileSnapshot.formKey, null);
assert.equal(fragileSnapshot.displayName, "Rival Pokemon");
assert.deepEqual(plain(fragileSnapshot.types), [9]);
const dialogueState = core.readSceneState(scene([koreanPlayer], [fragilePokemon]));
assert.equal(dialogueState.detection.ok, true);
assert.equal(dialogueState.fields.enemy.length, 1);
assert.equal(dialogueState.fields.enemy[0].displayName, "Rival Pokemon");

const activeRival = pokemon(30, 25, 0, "Rival Pikachu", [12], { isActive: () => true });
const dialogueTransitionState = core.readSceneState({
  currentBattle: { double: false },
  getPlayerField: () => [],
  getEnemyField: () => [],
  getPlayerParty: () => [koreanPlayer],
  getEnemyParty: () => [activeRival]
});
assert.equal(dialogueTransitionState.detection.ok, true);
assert.equal(dialogueTransitionState.fields.player.length, 0);
assert.equal(dialogueTransitionState.fields.enemy.length, 1);
assert.equal(dialogueTransitionState.fields.enemy[0].displayName, "Rival Pikachu");

console.log("bridge-core tests passed");
