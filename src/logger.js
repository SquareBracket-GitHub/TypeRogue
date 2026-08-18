(function installLogger(globalScope) {
  "use strict";

  const build = globalScope.PokeRogueTypeHelperBuild ?? { mode: "production", debug: false };
  const prefix = "[PokeRogue Type Helper]";
  let enabled = build.debug === true;

  function call(method, args) {
    if (enabled) {
      console[method](prefix, ...args);
    }
  }

  Object.defineProperty(globalScope, "PokeRogueTypeHelperLogger", {
    configurable: true,
    value: Object.freeze({
      debug: (...args) => call("debug", args),
      info: (...args) => call("info", args),
      warn: (...args) => call("warn", args),
      error: (...args) => console.error(prefix, ...args),
      isEnabled: () => enabled,
      setEnabled: value => {
        enabled = build.debug === true && value === true;
      }
    })
  });
})(globalThis);
