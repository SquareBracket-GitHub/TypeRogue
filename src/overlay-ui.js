(function installOverlayUi(globalScope) {
  "use strict";

  const ROOT_ID = "pokerogue-type-helper-root";
  const typeData = globalScope.PokeRogueTypeData;
  const pokemonData = globalScope.PokeRoguePokemonData;
  const manualSelection = globalScope.PokeRogueManualSelection;

  const SHADOW_STYLES = `
    @font-face {
      font-family: "TypeRogue Galmuri"; font-style: normal; font-weight: 400; font-display: swap;
      src: url("__GALMURI11_REGULAR__") format("woff2");
    }
    @font-face {
      font-family: "TypeRogue Galmuri"; font-style: normal; font-weight: 700; font-display: swap;
      src: url("__GALMURI11_BOLD__") format("woff2");
    }
    :host {
      --pr-ink: #17131f;
      --pr-panel: #352d40;
      --pr-panel-surface: #352d40;
      --pr-section-surface: #393143;
      --pr-row-surface: #292330;
      --pr-panel-deep: #292333;
      --pr-line: #655b70;
      --pr-text: #fffaff;
      --pr-muted: #c8c0cf;
      --pr-red: #b52d2d;
      --pr-red-dark: #651d24;
      --pr-enemy: #dc4542;
      --pr-enemy-dark: #7b222a;
      --pr-player: #55b3ca;
      --pr-player-dark: #276576;
      --pr-weak: #ff9a89;
      --pr-resist: #78cde2;
      --pr-immune: #bdb4c4;
      --pr-panel-width: 320px;
      --pr-panel-width-compact: 248px;
      color-scheme: dark;
    }
    .panel-frame, .panel, .panel * { box-sizing: border-box; }
    .panel-frame {
      position: relative; width: min(var(--pr-panel-width), calc(100vw - 16px)); padding: 0;
      background: transparent; border: 4px solid var(--pr-red);
      clip-path: polygon(5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px), 0 5px);
      filter: drop-shadow(3px 4px 0 rgba(17, 13, 23, .72)); opacity: .55;
      transition: opacity 120ms steps(2, end);
    }
    .panel-frame:hover, .panel-frame:focus-within { opacity: 1; }
    .panel {
      all: initial; position: relative; display: block; margin: 0; width: auto;
      max-height: calc(100vh - 28px); overflow: auto; overscroll-behavior: contain;
      color: var(--pr-text); background: var(--pr-panel-surface); border: 3px solid var(--pr-ink);
      border-radius: 0;
      font: 12px/1.3 "TypeRogue Galmuri", system-ui, sans-serif;
      scrollbar-color: #766b80 var(--pr-panel-deep); scrollbar-width: thin;
    }
    .panel-header {
      display: flex; min-height: 26px; align-items: center; gap: 4px; padding: 3px 5px 3px 9px;
      background: #1d1923; border-bottom: 2px solid #0e0c12;
      box-shadow: inset 0 -1px #4e4558; cursor: grab; touch-action: none; user-select: none;
    }
    .panel-header.dragging { cursor: grabbing; }
    .panel-title { flex: 1; overflow: hidden; color: #fff; font-size: 12px; font-weight: 900; letter-spacing: .3px; text-shadow: 1px 1px 0 #000; text-overflow: ellipsis; white-space: nowrap; }
    .panel-title::before { content: ""; display: inline-block; width: 4px; height: 8px; margin-right: 5px; background: var(--pr-red); box-shadow: 0 2px 0 var(--pr-red-dark); vertical-align: -1px; }
    .panel-summary { color: #aaa1b2; font-size: 10px; white-space: nowrap; }
    .panel-button {
      appearance: none; min-width: 22px; min-height: 18px; padding: 1px 4px; color: var(--pr-text);
      background: #3d3547; border: 1px solid #0e0c12; border-radius: 0;
      box-shadow: inset 0 0 0 1px #5e5368, 1px 1px 0 #09070b; font: 800 10px/1 "TypeRogue Galmuri", system-ui, sans-serif;
      cursor: pointer; text-shadow: 1px 1px 0 #17131f; white-space: nowrap;
    }
    .panel-button:hover { background: #65576f; }
    .panel-button:active { transform: translate(1px, 1px); box-shadow: inset 0 0 0 1px #73677e; }
    .panel-button:focus-visible { outline: 2px solid #fff4d6; outline-offset: 2px; }
    .panel-content[hidden] { display: none; }
    .panel.collapsed { width: auto; min-width: 190px; overflow: hidden; }
    .panel-frame:has(.panel.collapsed) { width: auto; }
    .panel.collapsed .panel-header { border-bottom: 0; }
    .detection-status { margin: 0; padding: 7px 9px; color: var(--pr-muted); background: var(--pr-panel-deep); border-bottom: 1px solid var(--pr-line); font-size: 11px; }
    .detection-status.failed { color: #ffe1d2; background: #602830; border-bottom-color: #9e3b39; }
    .manual-actions { display: flex; gap: 4px; padding: 0 7px 7px; }
    .manual-search { display: grid; gap: 6px; padding: 8px; background: var(--pr-panel-deep); border-top: 2px solid var(--pr-ink); }
    .manual-label { color: var(--pr-text); font-weight: 800; }
    .manual-input { min-width: 0; padding: 6px; color: #241e2b; background: #f7f1ed; border: 2px solid var(--pr-ink); border-radius: 1px; box-shadow: inset 0 0 0 1px #aaa1ad; font: 12px/1.2 "TypeRogue Galmuri", system-ui, sans-serif; }
    .search-results { display: grid; gap: 3px; max-height: 150px; overflow: auto; }
    .search-result { display: block; width: 100%; padding: 6px 7px; color: var(--pr-text); background: #4a4055; border: 2px solid var(--pr-ink); border-radius: 1px; text-align: left; cursor: pointer; }
    .search-result:hover, .search-result:focus-visible { background: var(--pr-red); outline: none; }
    .search-result small { display: block; color: #d6cedb; }
    .side {
      margin: 5px; padding: 8px 8px 9px;
      background: var(--pr-section-surface); border: 2px solid var(--pr-ink);
      box-shadow: inset 0 0 0 1px #554b5e, 2px 2px 0 #211b28;
    }
    .side + .side { margin-top: 8px; }
    .side-title { margin: -8px -8px 7px; padding: 5px 8px 4px 14px; color: #eee9f1; background: #292330; border-bottom: 2px solid var(--pr-ink); box-shadow: inset 0 -1px #5e5367; font: 800 12px/1 "TypeRogue Galmuri", system-ui, sans-serif; letter-spacing: .4px; position: relative; }
    .side-title::before { content: ""; position: absolute; left: 7px; top: 6px; width: 4px; height: 7px; background: var(--pr-enemy); box-shadow: 0 2px 0 var(--pr-enemy-dark); }
    .side-player .side-title::before { background: var(--pr-player); box-shadow: 0 2px 0 var(--pr-player-dark); }
    .empty { margin: 0; color: #aba2b2; font: 12px/1.25 "TypeRogue Galmuri", system-ui, sans-serif; }
    .pokemon + .pokemon { margin-top: 8px; padding-top: 8px; border-top: 2px solid #241e2b; box-shadow: inset 0 1px #574d60; }
    .identity {
      display: flex; min-width: 0; min-height: 24px; align-items: center; gap: 6px;
      margin: 0 -2px; padding: 3px 6px 3px 7px;
      background: #2b2533; border: 2px solid #17131f;
      box-shadow: inset 0 0 0 1px #554b5e, 2px 2px 0 #211b28;
      clip-path: polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%);
    }
    .name { flex: 0 1 auto; min-width: 0; overflow: hidden; color: #fff; font-size: 12px; font-weight: 900; letter-spacing: .3px; text-shadow: 1px 1px 0 #000; text-overflow: ellipsis; white-space: nowrap; }
    .current-types { flex: 0 1 auto; min-width: 0; max-width: 46%; overflow: hidden; color: #d8d0dc; font-size: 10px; font-weight: 800; text-overflow: ellipsis; text-shadow: 1px 1px 0 #17131f; white-space: nowrap; }
    .matchups { display: grid; gap: 2px; margin-top: 7px; }
    .matchup {
      display: grid; min-height: 20px; grid-template-columns: 38px minmax(0, 1fr); align-items: center; gap: 5px;
      padding: 2px 4px 2px 0; background: var(--pr-row-surface); border-bottom: 1px solid #4c4255;
    }
    .matchup:last-child { border-bottom-color: transparent; }
    .multiplier {
      align-self: stretch; display: grid; place-items: center; padding: 0 4px;
      background: #27212e; border-right: 2px solid #17131f;
      font-size: 10px; font-weight: 900; text-align: center; text-shadow: 1px 1px 0 #000;
    }
    .m4, .m2 { color: var(--pr-weak); } .m05, .m025 { color: var(--pr-resist); } .m0 { color: var(--pr-immune); }
    .type-list { display: flex; flex-wrap: wrap; align-items: center; gap: 3px 6px; min-width: 0; padding: 1px 0; }
    .type-badge { display: inline-flex; min-width: 0; align-items: center; gap: 3px; white-space: nowrap; }
    .type-icon {
      display: inline-grid; width: 16px; height: 16px; place-items: center; flex: none;
      padding-bottom: 1px;
      border: 1px solid rgba(255,255,255,.82); border-radius: 50%; color: #17131f;
      box-shadow: 0 0 0 1px #17131f, 1px 1px 0 #0b090d;
      font: 900 8px/1 "TypeRogue Galmuri", system-ui, sans-serif; text-align: center;
    }
    .type-name { color: #f1ecf3; font-size: 10px; font-weight: 700; line-height: 16px; text-shadow: 1px 1px 0 #17131f; }
    @media (max-width: 520px), (max-height: 420px) {
      .panel-frame { width: min(var(--pr-panel-width-compact), calc(100vw - 8px)); }
      .panel { max-height: calc(100vh - 20px); }
      .side { padding: 6px; }
      .side-title { margin: -6px -6px 6px; }
      .type-name { display: none; }
    }
  `;

  function resolveShadowStyles() {
    const runtime = globalScope.browser?.runtime ?? globalScope.chrome?.runtime;
    const assetUrl = path => runtime?.getURL?.(path) ?? path;
    return SHADOW_STYLES
      .replace("__GALMURI11_REGULAR__", assetUrl("src/fonts/Galmuri11.woff2"))
      .replace("__GALMURI11_BOLD__", assetUrl("src/fonts/Galmuri11-Bold.woff2"));
  }

  function buildPokemonView(snapshot) {
    const typeIds = pokemonData.resolveTypes(snapshot);
    return Object.freeze({
      key: `${snapshot.side}:${snapshot.slot}`,
      side: snapshot.side,
      slot: snapshot.slot,
      name: snapshot.displayName || "이름 없음",
      types: Object.freeze(typeIds.map(id => typeData.TYPES[id]).filter(Boolean)),
      matchups: Object.freeze(typeData.classifyDefenses(typeIds))
    });
  }

  function buildPanelView(state, manual = {}) {
    const fields = state?.fields ?? {};
    const useManual = state?.detection?.ok === false;
    return Object.freeze([
      Object.freeze({ side: "enemy", title: "상대", pokemon: Object.freeze((useManual && manual.enemy ? [manual.enemy] : fields.enemy ?? []).map(buildPokemonView)) }),
      Object.freeze({ side: "player", title: "아군", pokemon: Object.freeze((useManual && manual.player ? [manual.player] : fields.player ?? []).map(buildPokemonView)) })
    ]);
  }

  function element(documentRef, tag, className, text) {
    const node = documentRef.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function multiplierClass(multiplier) {
    return `m${String(multiplier).replace(".", "")}`;
  }

  function clampPosition(position, viewport, panelSize) {
    const maxX = Math.max(0, viewport.width - panelSize.width);
    const maxY = Math.max(0, viewport.height - panelSize.height);
    return {
      x: Math.min(Math.max(0, position.x), maxX),
      y: Math.min(Math.max(0, position.y), maxY)
    };
  }

  function isRestorablePosition(position, viewport, panelSize) {
    return Boolean(position)
      && Number.isFinite(position.x)
      && Number.isFinite(position.y)
      && position.x >= 0
      && position.y >= 0
      && position.x + panelSize.width <= viewport.width
      && position.y + panelSize.height <= viewport.height;
  }

  function renderPokemon(documentRef, view) {
    const article = element(documentRef, "article", "pokemon");
    article.dataset.side = view.side;
    article.dataset.slot = String(view.slot);
    const identity = element(documentRef, "div", "identity");
    identity.append(element(documentRef, "span", "name", view.name));
    identity.append(element(documentRef, "span", "current-types", view.types.map(type => type.ko).join("/") || "타입 정보 없음"));
    article.append(identity);

    const matchups = element(documentRef, "div", "matchups");
    matchups.setAttribute("aria-label", "방어 상성");
    for (const group of view.matchups) {
      const row = element(documentRef, "div", "matchup");
      row.append(element(documentRef, "span", `multiplier ${multiplierClass(group.multiplier)}`, `${group.multiplier}×`));
      const list = element(documentRef, "span", "type-list");
      for (const type of group.types) {
        const badge = element(documentRef, "span", "type-badge");
        badge.title = type.ko;
        const icon = element(documentRef, "span", "type-icon", type.glyph);
        icon.style.backgroundColor = type.color;
        icon.setAttribute("aria-hidden", "true");
        badge.append(icon, element(documentRef, "span", "type-name", type.ko));
        list.append(badge);
      }
      row.append(list);
      matchups.append(row);
    }
    article.append(matchups);
    return article;
  }

  function createController(documentRef = globalScope.document, settingsStore = globalScope.PokeRogueTypeHelperSettings) {
    let host = null;
    let panel = null;
    let header = null;
    let content = null;
    let summary = null;
    let collapseButton = null;
    let latestState = null;
    let collapsed = false;
    let drag = null;
    const manual = { player: null, enemy: null };
    let searchSide = null;
    const sequenceGate = createSequenceGate();

    function viewport() {
      return { width: globalScope.innerWidth, height: globalScope.innerHeight };
    }

    function panelSize() {
      const rect = host.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }

    function setHostPosition(position) {
      host.style.left = `${position.x}px`;
      host.style.top = `${position.y}px`;
      host.style.right = "auto";
    }

    function useDefaultPosition() {
      host.style.removeProperty("left");
      host.style.removeProperty("top");
      host.style.removeProperty("right");
    }

    function setCollapsed(value, { persist = true } = {}) {
      collapsed = value === true;
      panel.classList.toggle("collapsed", collapsed);
      content.hidden = collapsed;
      collapseButton.textContent = collapsed ? "펼치기" : "접기";
      collapseButton.setAttribute("aria-expanded", String(!collapsed));
      collapseButton.title = collapsed ? "패널 펼치기" : "패널 접기";
      let panelPosition;
      if (host.style.left !== "") {
        const rect = host.getBoundingClientRect();
        panelPosition = clampPosition({ x: rect.left, y: rect.top }, viewport(), panelSize());
        setHostPosition(panelPosition);
      }
      if (persist) settingsStore.save({ collapsed, ...(panelPosition ? { panelPosition } : {}) }).catch(() => {});
    }

    function restorePosition(position, { persistCorrection = true } = {}) {
      if (isRestorablePosition(position, viewport(), panelSize())) {
        setHostPosition(position);
        return true;
      }
      useDefaultPosition();
      if (position && persistCorrection) settingsStore.save({ panelPosition: null }).catch(() => {});
      return false;
    }

    function correctPositionAfterLayout() {
      if (!host?.isConnected || host.style.left === "") return true;
      const rect = host.getBoundingClientRect();
      const current = { x: rect.left, y: rect.top };
      if (isRestorablePosition(current, viewport(), panelSize())) return true;
      useDefaultPosition();
      settingsStore.save({ panelPosition: null }).catch(() => {});
      return false;
    }

    function applySettings(value) {
      if (!panel) return;
      setCollapsed(value?.collapsed, { persist: false });
      restorePosition(value?.panelPosition);
    }

    function resetLayout() {
      settingsStore.reset()
        .then(value => applySettings(value))
        .catch(() => {
          setCollapsed(false, { persist: false });
          useDefaultPosition();
        });
    }

    function openManualSearch(side) {
      searchSide = side;
      render(latestState);
      content.querySelector(".manual-input")?.focus();
    }

    function renderSearch() {
      if (!searchSide) return;
      const searchBox = element(documentRef, "div", "manual-search");
      searchBox.append(element(documentRef, "label", "manual-label", `${searchSide === "enemy" ? "상대" : "아군"} 포켓몬 검색`));
      const input = element(documentRef, "input", "manual-input");
      input.type = "search";
      input.placeholder = "한국어 또는 영어 이름";
      input.setAttribute("aria-label", "포켓몬 이름 검색");
      const results = element(documentRef, "div", "search-results");
      function updateResults() {
        results.replaceChildren();
        for (const entry of manualSelection.search(input.value)) {
          const button = element(documentRef, "button", "search-result", `${entry.ko} · ${entry.formKo}`);
          button.type = "button";
          button.append(element(documentRef, "small", "", `${entry.en} · ${entry.formEn}`));
          button.addEventListener("click", () => {
            manual[searchSide] = manualSelection.toSnapshot(entry, searchSide);
            searchSide = null;
            render(latestState);
          });
          results.append(button);
        }
      }
      input.addEventListener("input", updateResults);
      searchBox.append(input, results);
      content.append(searchBox);
    }

    function startDrag(event) {
      if (event.button !== 0 || event.target.closest("button")) return;
      const rect = host.getBoundingClientRect();
      drag = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
      header.classList.add("dragging");
      header.setPointerCapture(event.pointerId);
      event.preventDefault();
      event.stopPropagation();
    }

    function moveDrag(event) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const next = clampPosition(
        { x: event.clientX - drag.offsetX, y: event.clientY - drag.offsetY },
        viewport(),
        panelSize()
      );
      setHostPosition(next);
      event.preventDefault();
      event.stopPropagation();
    }

    function endDrag(event) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const rect = host.getBoundingClientRect();
      const position = clampPosition({ x: rect.left, y: rect.top }, viewport(), panelSize());
      setHostPosition(position);
      header.classList.remove("dragging");
      if (header.hasPointerCapture(event.pointerId)) header.releasePointerCapture(event.pointerId);
      drag = null;
      settingsStore.save({ panelPosition: position }).catch(() => {});
      event.preventDefault();
      event.stopPropagation();
    }

    function mount() {
      if (host?.isConnected) return host;
      host = documentRef.getElementById(ROOT_ID) ?? element(documentRef, "aside");
      host.id = ROOT_ID;
      host.setAttribute("aria-label", "포켓몬 방어 상성");
      const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
      if (!shadow.firstChild) {
        shadow.append(element(documentRef, "style", "", resolveShadowStyles()));
        const panelFrame = element(documentRef, "div", "panel-frame");
        panel = element(documentRef, "div", "panel");
        header = element(documentRef, "header", "panel-header");
        header.append(element(documentRef, "span", "panel-title", "타입 상성"));
        summary = element(documentRef, "span", "panel-summary", "상대 0 · 아군 0");
        collapseButton = element(documentRef, "button", "panel-button", "접기");
        collapseButton.type = "button";
        collapseButton.tabIndex = -1;
        const resetButton = element(documentRef, "button", "panel-button", "초기화");
        resetButton.type = "button";
        resetButton.tabIndex = -1;
        resetButton.title = "위치와 접힘 상태 초기화";
        header.append(summary, collapseButton, resetButton);
        content = element(documentRef, "div", "panel-content");
        panel.append(header, content);
        panelFrame.append(panel);
        shadow.append(panelFrame);
        header.addEventListener("pointerdown", startDrag);
        header.addEventListener("pointermove", moveDrag);
        header.addEventListener("pointerup", endDrag);
        header.addEventListener("pointercancel", endDrag);
        collapseButton.addEventListener("click", event => {
          event.stopPropagation();
          setCollapsed(!collapsed);
          event.currentTarget.blur();
        });
        resetButton.addEventListener("click", event => {
          event.stopPropagation();
          resetLayout();
          event.currentTarget.blur();
        });
      } else {
        panel = shadow.querySelector(".panel");
        header = shadow.querySelector(".panel-header");
        content = shadow.querySelector(".panel-content");
        summary = shadow.querySelector(".panel-summary");
        collapseButton = shadow.querySelector("[aria-expanded]");
      }
      (documentRef.body ?? documentRef.documentElement).append(host);
      if (latestState) render(latestState);
      else render(null);
      return host;
    }

    function renderSide(section) {
      const replacement = element(documentRef, "section", `side side-${section.side}`);
      replacement.append(element(documentRef, "h2", "side-title", section.title));
      if (!section.pokemon.length) replacement.append(element(documentRef, "p", "empty", "감지된 포켓몬 없음"));
      for (const pokemon of section.pokemon) replacement.append(renderPokemon(documentRef, pokemon));
      const current = content.querySelector(`.side-${section.side}`);
      if (current) current.replaceWith(replacement);
      else content.append(replacement);
    }

    function render(state) {
      latestState = state;
      if (!content) return;
      if (state?.detection?.ok === true) {
        manual.player = null;
        manual.enemy = null;
        searchSide = null;
      }
      const sections = buildPanelView(state, manual);
      summary.textContent = `상대 ${sections[0].pokemon.length} · 아군 ${sections[1].pokemon.length}`;
      content.replaceChildren();
      if (!state) {
        content.append(element(documentRef, "p", "detection-status", "전투 감지 대기 중"));
        correctPositionAfterLayout();
        return;
      }
      if (state.detection?.ok === false) {
        content.append(element(documentRef, "p", "detection-status failed", "자동 감지에 실패했습니다"));
        const actions = element(documentRef, "div", "manual-actions");
        for (const [side, label] of [["enemy", "상대 수동 선택"], ["player", "아군 수동 선택"]]) {
          const button = element(documentRef, "button", "panel-button", label);
          button.type = "button";
          button.tabIndex = -1;
          button.addEventListener("click", event => {
            event.currentTarget.blur();
            openManualSearch(side);
          });
          actions.append(button);
        }
        content.append(actions);
      }
      for (const section of sections) {
        renderSide(section);
      }
      renderSearch();
      correctPositionAfterLayout();
    }

    function beginScene() {
      sequenceGate.reset();
    }

    function applyUpdate(update) {
      if (!sequenceGate.accept(update?.sequence)) return false;
      const state = update.state;
      const requiresFullRender = !latestState
        || update.lifecycle !== "state-changed"
        || state?.detection?.ok !== true
        || latestState?.detection?.ok !== true
        || !content?.querySelector(".side-enemy")
        || !content?.querySelector(".side-player");
      if (requiresFullRender) {
        render(state);
        return true;
      }

      latestState = state;
      manual.player = null;
      manual.enemy = null;
      searchSide = null;
      const sections = buildPanelView(state, manual);
      summary.textContent = `상대 ${sections[0].pokemon.length} · 아군 ${sections[1].pokemon.length}`;
      const sectionBySide = new Map(sections.map(section => [section.side, section]));
      const changesBySide = new Map();
      for (const change of update.changedSlots ?? []) {
        const list = changesBySide.get(change.side) ?? [];
        list.push(change);
        changesBySide.set(change.side, list);
      }

      for (const [side, changes] of changesBySide) {
        const slotOnly = changes.every(change => ["form-changed", "updated"].includes(change.kind) && change.after);
        if (!slotOnly) {
          renderSide(sectionBySide.get(side));
          continue;
        }
        for (const change of changes) {
          const current = content.querySelector(`.side-${side} .pokemon[data-slot="${change.slot}"]`);
          if (current) current.replaceWith(renderPokemon(documentRef, buildPokemonView(change.after)));
          else renderSide(sectionBySide.get(side));
        }
      }
      correctPositionAfterLayout();
      return true;
    }

    globalScope.addEventListener?.("resize", () => {
      correctPositionAfterLayout();
    });

    return Object.freeze({ applySettings, applyUpdate, beginScene, mount, render, resetLayout, setCollapsed });
  }

  function createSequenceGate() {
    let latest = 0;
    return Object.freeze({
      accept(sequence) {
        if (!Number.isSafeInteger(sequence) || sequence <= latest) return false;
        latest = sequence;
        return true;
      },
      reset() { latest = 0; }
    });
  }

  Object.defineProperty(globalScope, "PokeRogueTypeHelperOverlay", {
    configurable: true,
    value: Object.freeze({ ROOT_ID, SHADOW_STYLES, buildPanelView, buildPokemonView, clampPosition, createController, createSequenceGate, isRestorablePosition })
  });
})(globalThis);
