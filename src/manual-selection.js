(function installManualSelection(globalScope) {
  "use strict";

  const T = globalScope.PokeRogueTypeData.TYPE_IDS;
  const entries = [
    [6, "default", "리자몽", "Charizard", "기본", "Default", [T.FIRE, T.FLYING]],
    [6, "mega-x", "리자몽", "Charizard", "메가진화 X", "Mega X", [T.FIRE, T.DRAGON]],
    [6, "mega-y", "리자몽", "Charizard", "메가진화 Y", "Mega Y", [T.FIRE, T.FLYING]],
    [25, "default", "피카츄", "Pikachu", "기본", "Default", [T.ELECTRIC]],
    [26, "default", "라이츄", "Raichu", "기본", "Default", [T.ELECTRIC]],
    [26, "alola", "라이츄", "Raichu", "알로라", "Alolan", [T.ELECTRIC, T.PSYCHIC]],
    [58, "default", "가디", "Growlithe", "기본", "Default", [T.FIRE]],
    [58, "hisui", "가디", "Growlithe", "히스이", "Hisuian", [T.FIRE, T.ROCK]],
    [144, "default", "프리져", "Articuno", "기본", "Default", [T.ICE, T.FLYING]],
    [144, "galar", "프리져", "Articuno", "가라르", "Galarian", [T.PSYCHIC, T.FLYING]],
    [150, "default", "뮤츠", "Mewtwo", "기본", "Default", [T.PSYCHIC]],
    [150, "mega-x", "뮤츠", "Mewtwo", "메가진화 X", "Mega X", [T.PSYCHIC, T.FIGHTING]],
    [150, "mega-y", "뮤츠", "Mewtwo", "메가진화 Y", "Mega Y", [T.PSYCHIC]],
    [382, "default", "가이오가", "Kyogre", "기본", "Default", [T.WATER]],
    [382, "primal", "가이오가", "Kyogre", "원시회귀", "Primal", [T.WATER]],
    [383, "default", "그란돈", "Groudon", "기본", "Default", [T.GROUND]],
    [383, "primal", "그란돈", "Groudon", "원시회귀", "Primal", [T.GROUND, T.FIRE]]
  ];

  const CATALOG = Object.freeze(entries.map(([speciesId, formKey, ko, en, formKo, formEn, types]) => Object.freeze({
    id: `${speciesId}:${formKey}`, speciesId, formKey, ko, en, formKo, formEn, types: Object.freeze(types)
  })));

  const normalize = value => String(value ?? "").trim().toLocaleLowerCase();

  function search(query, limit = 12) {
    const needle = normalize(query);
    if (!needle) return [];
    return CATALOG.filter(entry =>
      [entry.ko, entry.en, entry.formKo, entry.formEn, `${entry.ko} ${entry.formKo}`, `${entry.en} ${entry.formEn}`]
        .some(value => normalize(value).includes(needle))
    ).slice(0, limit);
  }

  function toSnapshot(entry, side, slot = 0) {
    if (!entry || !["player", "enemy"].includes(side)) return null;
    return Object.freeze({
      side, slot, pokemonId: `manual:${side}:${slot}:${entry.id}`, speciesId: entry.speciesId,
      fusionSpeciesId: null, formIndex: null, fusionFormIndex: null, formKey: entry.formKey,
      displayName: entry.formKey === "default" ? entry.ko : `${entry.ko} (${entry.formKo})`, types: entry.types
    });
  }

  Object.defineProperty(globalScope, "PokeRogueManualSelection", {
    configurable: true,
    value: Object.freeze({ CATALOG, search, toSnapshot })
  });
})(globalThis);
