# TypeRogue

English | [한국어](README.ko.md)

A Firefox extension that displays defensive type matchups for your Pokémon and opposing Pokémon during PokeRogue battles.

![TypeRogue icon](icons/typerogue-96.png)

## Features

- Automatically detects active Pokémon and their current types on both sides of a battle.
- Groups defensive matchups by `4×`, `2×`, `0.5×`, `0.25×`, and `0×`. Neutral `1×` matchups are omitted.
- Supports single battles, double battles, and fused Pokémon.
- Provides manual Pokémon and form selection by Korean or English name when automatic detection fails.
- Saves the panel position and collapsed state in Firefox local storage.
- Sends no data to the game server or any external server.

## Installation

TypeRogue requires Firefox 142 or later. A Chrome-compatible build is also available.

### Mozilla Add-ons (Recommended)

1. Visit the [TypeRogue page on Mozilla Add-ons](https://addons.mozilla.org/ko/firefox/addon/typerogue/) in Firefox.
2. Click **Add to Firefox** and approve the installation prompt.

### Temporary installation from a release package

1. Extract the release `.zip` file.
2. Open `about:debugging#/runtime/this-firefox` in Firefox.
3. Click **Load Temporary Add-on**.
4. Select `manifest.json` from the extracted directory.

A temporary add-on is removed when Firefox closes.

### Temporary installation from source

```powershell
npm.cmd test
npm.cmd run build
```

Then select `dist/firefox/manifest.json` from `about:debugging#/runtime/this-firefox`.

### Chrome development installation

```powershell
npm.cmd run build:chrome
```

Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select `dist/chrome`.

## Usage

Start a battle in PokeRogue. The type matchup panel appears in the upper-right corner.

- Move: drag the panel header.
- Collapse or expand: click **접기** or **펼치기** in the header.
- Reset the layout: click **초기화** to restore the default position and expanded state.
- Manual search: after automatic detection fails, click **상대 수동 선택** or **아군 수동 선택**, enter a Korean or English name, and select a form.

## MVP scope

The current release only covers defensive type matchups. It does not support:

- Calculating offensive matchups for individual moves
- Temporary type changes caused by abilities, moves, Terastallization, or similar effects
- Automated play or game input
- Type indicators that rely on color alone
- Neutral `1×` defensive matchups

The manual search catalog only contains a representative set of Pokémon and selected regional, Mega Evolution, and Primal Reversion forms.

## Known limitations

Automatic detection reads public state from PokeRogue's active Phaser scene. The panel may briefly appear empty during battle transitions. Changes to PokeRogue's internal structure may break automatic detection. Manual search remains available in that case, although newly added forms may not be in its catalog.

TypeRogue does not modify PokeRogue's game code or input. If a problem occurs, disable the extension and confirm that PokeRogue works normally without it.

## Privacy

TypeRogue does not collect or transmit account information, game progress, search queries, or usage history. It only stores the panel position and collapsed state in `browser.storage.local`. See the [privacy notice](PRIVACY.md) for details.

## Licenses and notices

TypeRogue is an unofficial fan tool and is not affiliated with PokeRogue or any Pokémon-related company. It contains no Pokémon artwork or official type icons. See [third-party notices](THIRD_PARTY_NOTICES.md) for data and asset information.

TypeRogue source code is available under the [Mozilla Public License 2.0](LICENSE). Copyright 2026 New Potato.

## Development

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run package
npm.cmd run amo:check
npm.cmd run cws:check
```

`build` creates `dist/firefox/` and `dist/chrome/`. `package` creates browser-specific ZIP files under `web-ext-artifacts/`.
`amo:check` blocks AMO submission while remote code or unfinished publisher metadata remains.
`cws:check` checks the Chrome manifest, permissions, privacy disclosure, and runtime code before Chrome Web Store packaging.
