(function installPokemonData(globalScope) {
  "use strict";

  const T = globalScope.PokeRogueTypeData?.TYPE_IDS;
  if (!T) return;

  // Fallbacks are deliberately small: PokeRogue's live getTypes() is authoritative.
  // Entries cover ordinary, regional, and explicit type-changing special forms.
  const FORM_TYPES = Object.freeze({
    "25:default": [T.ELECTRIC],
    "26:default": [T.ELECTRIC], "26:alola": [T.ELECTRIC, T.PSYCHIC],
    "58:default": [T.FIRE], "58:hisui": [T.FIRE, T.ROCK],
    "144:default": [T.ICE, T.FLYING], "144:galar": [T.PSYCHIC, T.FLYING],
    "150:default": [T.PSYCHIC], "150:mega-x": [T.PSYCHIC, T.FIGHTING], "150:mega-y": [T.PSYCHIC],
    "6:default": [T.FIRE, T.FLYING], "6:mega-x": [T.FIRE, T.DRAGON], "6:mega-y": [T.FIRE, T.FLYING],
    "382:default": [T.WATER], "382:primal": [T.WATER],
    "383:default": [T.GROUND], "383:primal": [T.GROUND, T.FIRE]
  });

  function localTypes(speciesId, formKey = "default") {
    return FORM_TYPES[`${speciesId}:${formKey || "default"}`] ?? FORM_TYPES[`${speciesId}:default`] ?? null;
  }

  function fusionTypes(primaryTypes, fusionTypesValue) {
    const first = [...new Set(primaryTypes ?? [])];
    const second = [...new Set(fusionTypesValue ?? [])];
    if (!first.length) return second.slice(0, 2);
    if (!second.length) return first.slice(0, 2);
    const primary = first[0];
    const secondary = second.find(type => type !== primary) ?? first.find(type => type !== primary);
    return secondary === undefined ? [primary] : [primary, secondary];
  }

  function resolveTypes(snapshot, primaryFallback, fusionFallback) {
    if (Array.isArray(snapshot?.types) && snapshot.types.length) return [...new Set(snapshot.types)].slice(0, 2);
    const primary = primaryFallback ?? localTypes(snapshot?.speciesId, snapshot?.formKey);
    if (!snapshot?.fusionSpeciesId) return primary ? [...primary] : [];
    const fusion = fusionFallback ?? localTypes(snapshot.fusionSpeciesId, "default");
    return fusionTypes(primary, fusion);
  }

  Object.defineProperty(globalScope, "PokeRoguePokemonData", {
    configurable: true,
    value: Object.freeze({ FORM_TYPES, localTypes, fusionTypes, resolveTypes })
  });
})(globalThis);
