# AMO reviewer instructions

## Purpose

TypeRogue displays defensive type matchups for the active Pokémon on both sides of a PokeRogue battle. It does not automate input or modify account data.

## Requirements

- Firefox 142 or later
- Network access to `https://pokerogue.net/`
- No paid service or additional hardware
- PokeRogue can be tested with its normal guest/new-session flow; the extension has no separate account

## Functional test

1. Install the submitted extension package.
2. Open `https://pokerogue.net/`.
3. Start or continue a game and enter a battle.
4. Confirm that the TypeRogue panel appears in the upper-right corner.
5. Confirm that the opposing and player Pokémon are shown separately.
6. Confirm that defensive matchup groups use 4×, 2×, 0.5×, 0.25×, and 0× and omit 1×.
7. In a double battle, confirm that both slots on each side are kept separate.
8. Switch a Pokémon or trigger a form change and confirm that the panel updates without reloading the page.
9. Drag the panel header, collapse and expand it, then use the reset button.
10. If an unsupported game state causes automatic detection to fail, use the player and opponent manual-selection buttons and search by a Korean or English name.

## Data and network behavior

- No analytics, advertisements, telemetry, or external API is used.
- No account, save, search, or battle data is transmitted by the extension.
- `browser.storage.local` stores only panel position, collapsed state, and a development logging preference.
- Host access is limited to `https://pokerogue.net/*`.

## Build

The submitted package contains readable, unminified JavaScript. No transpilation or bundling is performed.

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run package
```

`npm run build` copies the reviewed source files to `dist/` and disables development logging. `npm run package` uses Mozilla `web-ext` to create the ZIP.
