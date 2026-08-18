(function installBridgeCore(globalScope) {
  "use strict";

  const SCHEMA_VERSION = 1;
  const SIDES = Object.freeze(["player", "enemy"]);
  const TYPE_OPTIONS = Object.freeze({
    includeTeraType: false,
    bypassSummonData: true,
    ignoreThirdType: true
  });

  function findBattleSceneInGames(games) {
    if (!Array.isArray(games)) return null;
    const candidates = games.flatMap(game => game?.scene?.scenes ?? []).filter(candidate =>
      typeof candidate?.getPlayerField === "function"
      && typeof candidate?.getEnemyField === "function"
    );
    const active = candidates.filter(candidate => {
      try {
        return candidate?.sys?.isActive?.() === true;
      } catch (_error) {
        return false;
      }
    });
    return active.at(-1) ?? candidates.at(-1) ?? null;
  }

  function safeCall(receiver, methodName, ...args) {
    try {
      return typeof receiver?.[methodName] === "function"
        ? receiver[methodName](...args)
        : undefined;
    } catch (_error) {
      return undefined;
    }
  }

  function safeGet(receiver, propertyName) {
    try {
      return receiver?.[propertyName];
    } catch (_error) {
      return undefined;
    }
  }

  function snapshotPokemon(pokemon, side, slot) {
    const species = safeGet(pokemon, "species");
    const fusionSpecies = safeGet(pokemon, "fusionSpecies");
    const types = safeCall(pokemon, "getTypes", TYPE_OPTIONS);
    const rawName = safeGet(pokemon, "name");
    const renderedName = safeCall(pokemon, "getNameToRender");

    return {
      side,
      slot,
      pokemonId: safeGet(pokemon, "id") ?? null,
      speciesId: safeGet(species, "speciesId") ?? null,
      fusionSpeciesId: safeGet(fusionSpecies, "speciesId") ?? null,
      formIndex: safeGet(pokemon, "formIndex") ?? safeGet(species, "_formIndex") ?? null,
      fusionFormIndex: safeGet(pokemon, "fusionFormIndex") ?? null,
      formKey: safeCall(pokemon, "getFormKey") ?? null,
      displayName: typeof rawName === "string"
        ? rawName
        : typeof renderedName === "string"
          ? renderedName
          : null,
      types: Array.isArray(types) ? types.filter(Number.isInteger) : []
    };
  }

  function readField(scene, side) {
    const methodName = side === "player" ? "getPlayerField" : "getEnemyField";
    const partyMethodName = side === "player" ? "getPlayerParty" : "getEnemyParty";
    if (typeof scene?.[methodName] !== "function") {
      return { pokemon: [], error: `${methodName} is unavailable` };
    }

    try {
      // activeOnly=false를 사용해야 더블 배틀에서 원래 슬롯 인덱스가 보존된다.
      let field = scene[methodName](false);
      if (!Array.isArray(field)) {
        return { pokemon: [], error: `${methodName} did not return an array` };
      }
      if (field.length === 0) {
        const party = safeCall(scene, partyMethodName);
        if (Array.isArray(party)) {
          const activeParty = party.filter(pokemon => safeCall(pokemon, "isActive") === true);
          if (activeParty.length) {
            const slotLimit = safeGet(safeGet(scene, "currentBattle"), "double") ? 2 : 1;
            field = activeParty.slice(0, slotLimit);
          }
        }
      }
      return {
        pokemon: field
          .map((entry, slot) => entry ? snapshotPokemon(entry, side, slot) : null)
          .filter(Boolean),
        error: null
      };
    } catch (error) {
      return {
        pokemon: [],
        error: `${methodName} failed: ${String(error?.message ?? error)}`
      };
    }
  }

  function readSceneState(scene) {
    const player = readField(scene, "player");
    const enemy = readField(scene, "enemy");
    const errors = [player.error, enemy.error].filter(Boolean);
    const battleActive = Boolean(scene?.currentBattle);

    return {
      schemaVersion: SCHEMA_VERSION,
      status: errors.length ? "unavailable" : battleActive ? "battle" : "idle",
      detection: { ok: errors.length === 0, errors },
      battle: {
        active: battleActive,
        double: Boolean(scene?.currentBattle?.double)
      },
      fields: {
        player: player.pokemon,
        enemy: enemy.pokemon
      }
    };
  }

  function fingerprint(value) {
    return JSON.stringify(value);
  }

  function explicitFormFingerprint(pokemon) {
    if (!pokemon) return "";
    return fingerprint([
      pokemon.speciesId,
      pokemon.fusionSpeciesId,
      pokemon.formIndex,
      pokemon.fusionFormIndex,
      pokemon.formKey,
      pokemon.displayName
    ]);
  }

  function fieldBySlot(state, side) {
    return new Map((state?.fields?.[side] ?? []).map(pokemon => [pokemon.slot, pokemon]));
  }

  function diffFields(previousState, nextState) {
    const changes = [];

    for (const side of SIDES) {
      const previous = fieldBySlot(previousState, side);
      const next = fieldBySlot(nextState, side);
      const slots = [...new Set([...previous.keys(), ...next.keys()])].sort((a, b) => a - b);

      for (const slot of slots) {
        const before = previous.get(slot) ?? null;
        const after = next.get(slot) ?? null;
        let kind = null;

        if (!before && after) kind = "entered";
        else if (before && !after) kind = "left";
        else if (before.pokemonId !== after.pokemonId) kind = "switched";
        else if (explicitFormFingerprint(before) !== explicitFormFingerprint(after)) kind = "form-changed";
        else if (fingerprint(before) !== fingerprint(after)) kind = "updated";

        if (kind) changes.push({ side, slot, kind, before, after });
      }
    }

    return changes;
  }

  function createStateUpdate(previousState, nextState) {
    if (previousState && fingerprint(previousState) === fingerprint(nextState)) {
      return null;
    }

    let lifecycle = "state-changed";
    if (!nextState.detection.ok) lifecycle = "detection-failed";
    else if (!previousState) lifecycle = nextState.battle.active ? "battle-start" : "snapshot";
    else if (!previousState.battle.active && nextState.battle.active) lifecycle = "battle-start";
    else if (previousState.battle.active && !nextState.battle.active) lifecycle = "battle-end";

    return {
      lifecycle,
      changedSlots: diffFields(previousState, nextState),
      state: nextState
    };
  }

  Object.defineProperty(globalScope, "PokeRogueBridgeCore", {
    configurable: true,
    value: Object.freeze({
      SCHEMA_VERSION,
      createStateUpdate,
      diffFields,
      findBattleSceneInGames,
      fingerprint,
      readField,
      readSceneState,
      safeGet,
      snapshotPokemon
    })
  });
})(globalThis);
