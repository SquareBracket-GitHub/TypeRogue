(function startPageBridge() {
  "use strict";

  const MESSAGE_SOURCE = "pokerogue-type-helper-page";
  const POLL_INTERVAL_MS = 250;
  const GAME_OBSERVER_TIMEOUT_MS = 120000;
  const core = globalThis.PokeRogueBridgeCore;
  let scene = null;
  let previousState = null;
  let sequence = 0;
  let hookReadyPublished = false;
  let capturedGames = null;
  let gameBindObserved = false;
  let gameBindSignature = null;
  let restoreGameBindObserver = null;
  let gameBindObserverTimeout = null;

  function publish(type, payload = {}) {
    window.postMessage({ source: MESSAGE_SOURCE, type, payload }, window.location.origin);
  }

  function captureScene(nextScene, strategy = "unknown") {
    if (scene === nextScene) return;
    scene = nextScene;
    previousState = null;
    sequence = 0;
    publish("SCENE_CAPTURED", {
      key: nextScene?.sys?.settings?.key ?? "battle",
      strategy,
      gameSignature: readGameSignature(nextScene?.game),
      gameBindObserved,
      gameBindSignature
    });
  }

  function readGameSignature(game) {
    try {
      const config = game?.config;
      const parent = config?.parent;
      return {
        constructorName: String(game?.constructor?.name ?? ""),
        parentType: typeof parent,
        parentValue: typeof parent === "string" ? parent : String(parent?.id ?? ""),
        width: Number(config?.width),
        height: Number(config?.height),
        hasSceneManager: Boolean(game?.scene)
      };
    } catch {
      return null;
    }
  }

  function isPokeRogueGame(value) {
    try {
      const signature = readGameSignature(value);
      return signature?.hasSceneManager === true
        && (signature.parentValue === "app"
          || (signature.width === 1920 && signature.height === 1080));
    } catch {
      return false;
    }
  }

  function installGameBindObserver() {
    const functionPrototype = globalThis.Function?.prototype;
    const originalBind = functionPrototype?.bind;
    if (!functionPrototype || typeof originalBind !== "function") return null;

    function restore() {
      if (functionPrototype.bind === observeBind) functionPrototype.bind = originalBind;
    }

    function observeBind(thisArg, ...args) {
      const result = Reflect.apply(originalBind, this, [thisArg, ...args]);
      if (isPokeRogueGame(thisArg)) {
        capturedGames = [thisArg];
        gameBindObserved = true;
        gameBindSignature = readGameSignature(thisArg);
        restore();
        restoreGameBindObserver = null;
      }
      return result;
    }

    functionPrototype.bind = observeBind;
    return restore;
  }

  function clearGameBindObserver() {
    restoreGameBindObserver?.();
    restoreGameBindObserver = null;
    if (gameBindObserverTimeout !== null) window.clearTimeout(gameBindObserverTimeout);
    gameBindObserverTimeout = null;
  }

  function discoverScene() {
    const games = globalThis.Phaser?.GAMES ?? capturedGames;
    const nextScene = core.findBattleSceneInGames(games);
    if (nextScene) {
      captureScene(nextScene, capturedGames ? "phaser-game-bind" : "phaser-games");
      if (!hookReadyPublished) {
        hookReadyPublished = true;
        publish("HOOK_READY", { strategy: "phaser-scene-discovery" });
      }
    }

  }

  function publishStateIfChanged() {
    discoverScene();
    if (!scene) return;

    try {
      const state = core.readSceneState(scene);
      const update = core.createStateUpdate(previousState, state);
      if (update) {
        previousState = state;
        sequence += 1;
        publish("STATE", { sequence, ...update });
      }
    } catch (error) {
      publish("ERROR", {
        code: "STATE_READ_FAILED",
        message: String(error?.message ?? error)
      });
    }
  }

  if (!core) {
    publish("ERROR", { code: "BRIDGE_CORE_MISSING", message: "Bridge core was not loaded" });
    return;
  }

  restoreGameBindObserver = installGameBindObserver();
  gameBindObserverTimeout = window.setTimeout(clearGameBindObserver, GAME_OBSERVER_TIMEOUT_MS);
  publishStateIfChanged();
  window.setInterval(publishStateIfChanged, POLL_INTERVAL_MS);
  window.addEventListener("pagehide", () => {
    clearGameBindObserver();
  }, { once: true });
})();
