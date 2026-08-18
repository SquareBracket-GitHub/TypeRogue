import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const context = vm.createContext({});
for (const file of ["src/type-data.js", "src/pokemon-data.js"]) {
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
}

const data = context.PokeRogueTypeData;
const pokemon = context.PokeRoguePokemonData;
const T = data.TYPE_IDS;

assert.equal(data.TYPES.length, 18);
assert.equal(data.TYPE_CHART.length, 18);
assert.ok(data.TYPE_CHART.every(row => row.length === 18));
assert.deepEqual(Array.from(data.DISPLAY_MULTIPLIERS), [4, 2, .5, .25, 0]);
assert.deepEqual(Array.from(data.MULTIPLIERS), [4, 2, 1, .5, .25, 0]);

assert.equal(data.defensiveMultiplier(T.WATER, [T.FIRE]), 2);
assert.equal(data.defensiveMultiplier(T.GRASS, [T.FIRE]), .5);
assert.equal(data.defensiveMultiplier(T.ELECTRIC, [T.GROUND]), 0);
assert.equal(data.defensiveMultiplier(T.ROCK, [T.FIRE, T.FLYING]), 4);
assert.equal(data.defensiveMultiplier(T.FIRE, [T.WATER, T.DRAGON]), .25);
assert.equal(data.defensiveMultiplier(T.FIRE, [T.GRASS, T.DRAGON]), 1);

const groups = data.classifyDefenses([T.FIRE, T.FLYING]);
assert.ok(groups.every(group => group.multiplier !== 1 && group.types.length));
assert.deepEqual(Array.from(groups, group => group.multiplier), [4, 2, .5, .25, 0].filter(
  multiplier => groups.some(group => group.multiplier === multiplier)
));
assert.ok(data.TYPES.every(type => type.ko && type.key && type.icon.kind === "text-badge"));
assert.ok(data.calculateDefenses([T.FIRE]).some(group => group.multiplier === 1));

function flattenGroups(groups) {
  return groups.flatMap(group => Array.from(group.types, type => ({
    attack: type.id,
    multiplier: group.multiplier
  })));
}

function verifyAllAttacks(defendingTypes) {
  const allGroups = data.calculateDefenses(defendingTypes);
  const displayGroups = data.classifyDefenses(defendingTypes);
  const allResults = flattenGroups(allGroups);
  const displayResults = flattenGroups(displayGroups);

  assert.deepEqual(
    Array.from(allGroups, group => group.multiplier),
    Array.from(data.MULTIPLIERS).filter(multiplier =>
      allGroups.some(group => group.multiplier === multiplier)
    )
  );
  assert.deepEqual(
    Array.from(displayGroups, group => group.multiplier),
    Array.from(data.DISPLAY_MULTIPLIERS).filter(multiplier =>
      displayGroups.some(group => group.multiplier === multiplier)
    )
  );
  assert.equal(allResults.length, data.TYPES.length);
  assert.equal(new Set(allResults.map(result => result.attack)).size, data.TYPES.length);
  assert.ok(displayResults.every(result => result.multiplier !== 1));

  for (const attack of data.TYPES) {
    const expected = defendingTypes.reduce(
      (product, defense) => product * data.TYPE_CHART[attack.id][defense],
      1
    );
    assert.ok(data.MULTIPLIERS.includes(expected));
    assert.equal(data.defensiveMultiplier(attack.id, defendingTypes), expected);
    assert.equal(allResults.find(result => result.attack === attack.id)?.multiplier, expected);
    assert.equal(displayResults.some(result => result.attack === attack.id), expected !== 1);
  }
}

// 18 single types × 18 attacking types = 324 automatic checks.
for (const defense of data.TYPES) verifyAllAttacks([defense.id]);

// All C(18, 2) dual types × 18 attacking types = 2,754 automatic checks.
let dualTypeCombinations = 0;
for (let first = 0; first < data.TYPES.length; first += 1) {
  for (let second = first + 1; second < data.TYPES.length; second += 1) {
    verifyAllAttacks([first, second]);
    dualTypeCombinations += 1;
  }
}
assert.equal(dualTypeCombinations, 153);

assert.deepEqual(Array.from(pokemon.resolveTypes({ types: [T.WATER, T.DRAGON], speciesId: 6, formKey: "mega-x" })), [T.WATER, T.DRAGON]);
assert.deepEqual(Array.from(pokemon.resolveTypes({ types: [], speciesId: 6, formKey: "mega-x" })), [T.FIRE, T.DRAGON]);
assert.deepEqual(Array.from(pokemon.fusionTypes([T.FIRE, T.FLYING], [T.WATER, T.FLYING])), [T.FIRE, T.WATER]);
assert.deepEqual(Array.from(pokemon.fusionTypes([T.NORMAL], [T.NORMAL])), [T.NORMAL]);

console.log("type data tests passed");
