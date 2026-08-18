(function installOverlayUi(globalScope) {
  "use strict";

  const ROOT_ID = "pokerogue-type-helper-root";
  const typeData = globalScope.PokeRogueTypeData;
  const pokemonData = globalScope.PokeRoguePokemonData;
  const manualSelection = globalScope.PokeRogueManualSelection;

  const SHADOW_STYLES = `
    :host { color-scheme: dark; }
    .panel, .panel * { box-sizing: border-box; }
    .panel {
      all: initial; display: block; width: min(260px, calc(100vw - 16px));
      max-height: calc(100vh - 16px); overflow: auto; overscroll-behavior: contain;
      color: #f8fafc; background: rgba(15, 23, 42, .94); border: 1px solid #475569;
      border-radius: 8px; box-shadow: 0 4px 14px rgba(0, 0, 0, .35);
      font: 12px/1.25 system-ui, sans-serif;
    }
    .panel-header {
      display: flex; min-height: 30px; align-items: center; gap: 5px; padding: 5px 6px;
      border-bottom: 1px solid #475569; cursor: grab; touch-action: none; user-select: none;
    }
    .panel-header.dragging { cursor: grabbing; }
    .panel-title { flex: 1; overflow: hidden; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
    .panel-summary { color: #cbd5e1; font-size: 10px; }
    .panel-button {
      appearance: none; min-width: 24px; min-height: 22px; padding: 2px 5px; color: #f8fafc;
      background: #334155; border: 1px solid #64748b; border-radius: 4px; font: 700 10px/1 system-ui, sans-serif;
      cursor: pointer;
    }
    .panel-button:focus-visible { outline: 2px solid #93c5fd; outline-offset: 1px; }
    .panel-content[hidden] { display: none; }
    .panel.collapsed { width: auto; min-width: 190px; overflow: hidden; }
    .panel.collapsed .panel-header { border-bottom: 0; }
    .detection-status { margin: 0; padding: 6px 7px; color: #cbd5e1; font-size: 11px; }
    .detection-status.failed { color: #fecaca; background: rgba(127, 29, 29, .35); }
    .manual-actions { display: flex; gap: 4px; padding: 0 7px 7px; }
    .manual-search { display: grid; gap: 5px; padding: 7px; border-top: 1px solid #475569; }
    .manual-label { color: #e2e8f0; font-weight: 700; }
    .manual-input { min-width: 0; padding: 5px; color: #0f172a; background: #fff; border: 0; border-radius: 3px; font: 12px/1.2 system-ui, sans-serif; }
    .search-results { display: grid; gap: 3px; max-height: 150px; overflow: auto; }
    .search-result { display: block; width: 100%; padding: 5px; color: #f8fafc; background: #334155; border: 1px solid #64748b; border-radius: 3px; text-align: left; cursor: pointer; }
    .search-result small { display: block; color: #cbd5e1; }
    .side { padding: 7px; }
    .side + .side { border-top: 1px solid #475569; }
    .side-title { margin: 0 0 5px; color: #cbd5e1; font: 700 11px/1 system-ui, sans-serif; }
    .empty { margin: 0; color: #94a3b8; font: 12px/1.25 system-ui, sans-serif; }
    .pokemon + .pokemon { margin-top: 7px; padding-top: 7px; border-top: 1px solid #334155; }
    .identity { display: flex; align-items: baseline; gap: 5px; min-width: 0; }
    .name { overflow: hidden; color: #fff; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
    .current-types { flex: none; color: #cbd5e1; font-size: 10px; }
    .matchups { display: grid; gap: 3px; margin-top: 5px; }
    .matchup { display: grid; grid-template-columns: 34px minmax(0, 1fr); align-items: center; gap: 4px; }
    .multiplier { font-weight: 800; text-align: right; }
    .m4, .m2 { color: #fda4af; } .m05, .m025 { color: #93c5fd; } .m0 { color: #cbd5e1; }
    .type-list { display: flex; flex-wrap: wrap; gap: 3px; min-width: 0; }
    .type-badge { display: inline-flex; align-items: center; gap: 2px; min-width: 0; }
    .type-icon {
      display: inline-grid; width: 15px; height: 15px; place-items: center; flex: none;
      border: 1px solid rgba(255,255,255,.65); border-radius: 50%; color: #0f172a;
      font: 800 8px/1 system-ui, sans-serif;
    }
    .type-name { color: #e2e8f0; font-size: 10px; }
    @media (max-width: 520px), (max-height: 420px) {
      .panel { width: min(220px, calc(100vw - 8px)); max-height: calc(100vh - 8px); }
      .side { padding: 5px; } .type-name { display: none; }
    }
  `;

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
        shadow.append(element(documentRef, "style", "", SHADOW_STYLES));
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
        shadow.append(panel);
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
