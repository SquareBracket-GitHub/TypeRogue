(function startContentScript() {
  "use strict";

  const MESSAGE_SOURCE = "pokerogue-type-helper-page";
  const ALLOWED_TYPES = new Set(["HOOK_READY", "SCENE_CAPTURED", "STATE", "ERROR"]);
  const logger = globalThis.PokeRogueTypeHelperLogger;
  const settings = globalThis.PokeRogueTypeHelperSettings;
  const overlay = globalThis.PokeRogueTypeHelperOverlay.createController();

  function mountOverlay() {
    if (document.body || document.documentElement) overlay.mount();
    else document.addEventListener("DOMContentLoaded", () => overlay.mount(), { once: true });
  }

  function isBridgeMessage(event) {
    const data = event.data;
    return event.source === window
      && event.origin === window.location.origin
      && data?.source === MESSAGE_SOURCE
      && ALLOWED_TYPES.has(data.type)
      && isValidPayload(data.type, data.payload);
  }

  function isShortString(value) {
    return typeof value === "string" && value.length <= 500;
  }

  function isPokemonSnapshot(value, side) {
    return value !== null
      && typeof value === "object"
      && value.side === side
      && Number.isInteger(value.slot)
      && value.slot >= 0
      && value.slot <= 1
      && (value.pokemonId === null || Number.isInteger(value.pokemonId))
      && (value.speciesId === null || Number.isInteger(value.speciesId))
      && (value.fusionSpeciesId === null || Number.isInteger(value.fusionSpeciesId))
      && (value.displayName === null || isShortString(value.displayName))
      && Array.isArray(value.types)
      && value.types.length <= 3
      && value.types.every(Number.isInteger);
  }

  function isValidState(state) {
    if (state === null || typeof state !== "object"
      || state.schemaVersion !== 1
      || !["idle", "battle", "unavailable"].includes(state.status)
      || typeof state.detection?.ok !== "boolean"
      || !Array.isArray(state.detection.errors)
      || state.detection.errors.length > 2
      || !state.detection.errors.every(isShortString)
      || typeof state.battle?.active !== "boolean"
      || typeof state.battle?.double !== "boolean") return false;

    return ["player", "enemy"].every(side => Array.isArray(state.fields?.[side])
      && state.fields[side].length <= 2
      && new Set(state.fields[side].map(pokemon => pokemon?.slot)).size === state.fields[side].length
      && state.fields[side].every(pokemon => isPokemonSnapshot(pokemon, side)));
  }

  function isValidPayload(type, payload) {
    if (payload === null || typeof payload !== "object") return false;
    if (type === "HOOK_READY") return isShortString(payload.strategy);
    if (type === "SCENE_CAPTURED") return isShortString(payload.key);
    if (type === "ERROR") return isShortString(payload.code) && isShortString(payload.message);
    if (type === "STATE") {
      return Number.isSafeInteger(payload.sequence)
        && payload.sequence > 0
        && ["snapshot", "battle-start", "battle-end", "state-changed", "detection-failed"].includes(payload.lifecycle)
        && Array.isArray(payload.changedSlots)
        && payload.changedSlots.length <= 4
        && payload.changedSlots.every(change => change !== null
          && typeof change === "object"
          && ["player", "enemy"].includes(change.side)
          && Number.isInteger(change.slot)
          && change.slot >= 0
          && change.slot <= 1
          && ["entered", "left", "switched", "form-changed", "updated"].includes(change.kind))
        && isValidState(payload.state);
    }
    return false;
  }

  window.addEventListener("message", event => {
    if (!isBridgeMessage(event)) {
      return;
    }

    if (event.data.type === "ERROR") {
      logger.error(event.data.type, event.data.payload);
    } else {
      logger.info(event.data.type, event.data.payload);
    }

    if (event.data.type === "SCENE_CAPTURED") {
      overlay.beginScene();
    }

    if (event.data.type === "STATE") {
      if (event.data.payload.state?.detection?.ok === false) {
        logger.error("자동 감지 실패", event.data.payload.state.detection.errors);
      }
      overlay.applyUpdate(event.data.payload);
    }
  });

  mountOverlay();

  settings.load()
    .then(value => {
      logger.setEnabled(value.debugLogging);
      overlay.applySettings(value);
      logger.debug("content script initialized", { mode: globalThis.PokeRogueTypeHelperBuild.mode });
    })
    .catch(error => logger.error("settings load failed", error));
})();
