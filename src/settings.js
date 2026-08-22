(function installSettings(globalScope) {
  "use strict";

  const STORAGE_KEY = "settings";
  const DEFAULTS = Object.freeze({
    panelPosition: null,
    collapsed: false,
    debugLogging: true
  });
  const extensionApi = globalScope.browser ?? globalScope.chrome;

  if (!extensionApi?.storage?.local) {
    throw new Error("WebExtension storage API is unavailable");
  }

  function sanitize(candidate) {
    const source = candidate && typeof candidate === "object" ? candidate : {};
    const position = source.panelPosition;
    const validPosition = position
      && Number.isFinite(position.x)
      && Number.isFinite(position.y)
      ? { x: position.x, y: position.y }
      : null;

    return {
      panelPosition: validPosition,
      collapsed: source.collapsed === true,
      debugLogging: source.debugLogging !== false
    };
  }

  async function load() {
    const stored = await extensionApi.storage.local.get(STORAGE_KEY);
    return sanitize({ ...DEFAULTS, ...stored[STORAGE_KEY] });
  }

  async function save(patch) {
    const current = await load();
    const next = sanitize({ ...current, ...patch });
    await extensionApi.storage.local.set({ [STORAGE_KEY]: next });
    return next;
  }

  async function reset() {
    await extensionApi.storage.local.remove(STORAGE_KEY);
    return { ...DEFAULTS };
  }

  Object.defineProperty(globalScope, "PokeRogueTypeHelperSettings", {
    configurable: true,
    value: Object.freeze({ DEFAULTS, load, reset, sanitize, save })
  });
})(globalThis);
