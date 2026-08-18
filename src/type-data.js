(function installTypeData(globalScope) {
  "use strict";

  const TYPE_IDS = Object.freeze({
    NORMAL: 0, FIGHTING: 1, FLYING: 2, POISON: 3, GROUND: 4, ROCK: 5,
    BUG: 6, GHOST: 7, STEEL: 8, FIRE: 9, WATER: 10, GRASS: 11,
    ELECTRIC: 12, PSYCHIC: 13, ICE: 14, DRAGON: 15, DARK: 16, FAIRY: 17
  });

  const definitions = [
    ["normal", "노말", "N", "#9299a1"], ["fighting", "격투", "F", "#ce416b"],
    ["flying", "비행", "W", "#8fa9de"], ["poison", "독", "P", "#aa6bc8"],
    ["ground", "땅", "G", "#d97845"], ["rock", "바위", "R", "#c5b78c"],
    ["bug", "벌레", "B", "#91c12f"], ["ghost", "고스트", "H", "#5269ad"],
    ["steel", "강철", "S", "#5a8ea2"], ["fire", "불꽃", "F", "#ff9d55"],
    ["water", "물", "W", "#5090d6"], ["grass", "풀", "G", "#63bc5a"],
    ["electric", "전기", "E", "#f4d23c"], ["psychic", "에스퍼", "P", "#fa7179"],
    ["ice", "얼음", "I", "#73cec0"], ["dragon", "드래곤", "D", "#0b6dc3"],
    ["dark", "악", "D", "#5a5465"], ["fairy", "페어리", "Y", "#ec8fe6"]
  ];

  const TYPES = Object.freeze(definitions.map(([key, ko, glyph, color], id) => Object.freeze({
    id, key, ko, glyph, color,
    icon: Object.freeze({ kind: "text-badge", glyph, license: "TypeRogue-original" })
  })));

  // Rows are attacking types; listed entries are the only non-neutral multipliers.
  const chart = {
    normal: { rock: .5, ghost: 0, steel: .5 },
    fighting: { normal: 2, flying: .5, poison: .5, rock: 2, bug: .5, ghost: 0, steel: 2, psychic: .5, ice: 2, dark: 2, fairy: .5 },
    flying: { fighting: 2, rock: .5, bug: 2, steel: .5, grass: 2, electric: .5 },
    poison: { poison: .5, ground: .5, rock: .5, ghost: .5, steel: 0, grass: 2, fairy: 2 },
    ground: { flying: 0, poison: 2, rock: 2, bug: .5, steel: 2, fire: 2, grass: .5, electric: 2 },
    rock: { fighting: .5, flying: 2, ground: .5, bug: 2, steel: .5, fire: 2, ice: 2 },
    bug: { fighting: .5, flying: .5, poison: .5, ghost: .5, steel: .5, fire: .5, grass: 2, psychic: 2, dark: 2, fairy: .5 },
    ghost: { normal: 0, ghost: 2, psychic: 2, dark: .5 },
    steel: { rock: 2, steel: .5, fire: .5, water: .5, electric: .5, ice: 2, fairy: 2 },
    fire: { rock: .5, bug: 2, steel: 2, fire: .5, water: .5, grass: 2, ice: 2, dragon: .5 },
    water: { ground: 2, rock: 2, fire: 2, water: .5, grass: .5, dragon: .5 },
    grass: { flying: .5, poison: .5, ground: 2, rock: 2, bug: .5, steel: .5, fire: .5, water: 2, grass: .5, dragon: .5 },
    electric: { flying: 2, ground: 0, water: 2, grass: .5, electric: .5, dragon: .5 },
    psychic: { fighting: 2, poison: 2, steel: .5, psychic: .5, dark: 0 },
    ice: { flying: 2, ground: 2, steel: .5, fire: .5, water: .5, grass: 2, ice: .5, dragon: 2 },
    dragon: { steel: .5, dragon: 2, fairy: 0 },
    dark: { fighting: .5, ghost: 2, psychic: 2, dark: .5, fairy: .5 },
    fairy: { fighting: 2, poison: .5, steel: .5, fire: .5, dragon: 2, dark: 2 }
  };

  const TYPE_CHART = Object.freeze(TYPES.map(attacking => Object.freeze(
    TYPES.map(defending => chart[attacking.key]?.[defending.key] ?? 1)
  )));
  const MULTIPLIERS = Object.freeze([4, 2, 1, .5, .25, 0]);
  const DISPLAY_MULTIPLIERS = Object.freeze([4, 2, .5, .25, 0]);

  function normalizeType(type) {
    if (Number.isInteger(type) && TYPES[type]) return type;
    if (typeof type === "string") return TYPES.find(entry => entry.key === type.toLowerCase())?.id ?? null;
    return null;
  }

  function defensiveMultiplier(attackingType, defendingTypes) {
    const attack = normalizeType(attackingType);
    const defense = [...new Set((defendingTypes ?? []).map(normalizeType).filter(type => type !== null))];
    if (attack === null || defense.length === 0) return null;
    return defense.reduce((product, type) => product * TYPE_CHART[attack][type], 1);
  }

  function calculateDefenses(defendingTypes, { includeNeutral = true } = {}) {
    const order = includeNeutral ? MULTIPLIERS : DISPLAY_MULTIPLIERS;
    const groups = new Map(order.map(multiplier => [multiplier, []]));
    for (const type of TYPES) {
      const multiplier = defensiveMultiplier(type.id, defendingTypes);
      if (groups.has(multiplier)) groups.get(multiplier).push(type);
    }
    return order
      .map(multiplier => Object.freeze({ multiplier, types: Object.freeze(groups.get(multiplier)) }))
      .filter(group => group.types.length > 0);
  }

  function classifyDefenses(defendingTypes) {
    return calculateDefenses(defendingTypes, { includeNeutral: false });
  }

  Object.defineProperty(globalScope, "PokeRogueTypeData", {
    configurable: true,
    value: Object.freeze({ TYPE_IDS, TYPES, TYPE_CHART, MULTIPLIERS, DISPLAY_MULTIPLIERS, normalizeType, defensiveMultiplier, calculateDefenses, classifyDefenses })
  });
})(globalThis);
