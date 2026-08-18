(function installBuildConfig(globalScope) {
  "use strict";

  Object.defineProperty(globalScope, "PokeRogueTypeHelperBuild", {
    configurable: true,
    value: Object.freeze({
      mode: "development",
      debug: true
    })
  });
})(globalThis);
