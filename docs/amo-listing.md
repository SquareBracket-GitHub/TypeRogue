# AMO listing draft

## Identity

- Name: TypeRogue
- Version: 0.1.0
- Platform: Firefox for Desktop
- Category: Games & Entertainment
- Source repository: https://github.com/SquareBracket-GitHub/TypeRogue
- Support website: https://github.com/SquareBracket-GitHub/TypeRogue/issues
- Support email: eomtaegyun08@gmail.com
- Privacy notice: https://github.com/SquareBracket-GitHub/TypeRogue/blob/main/PRIVACY.md
- License: Mozilla Public License 2.0 (`MPL-2.0`)
- Copyright holder: New Potato

## English

### Summary

Shows defensive type matchups for both sides during PokeRogue battles.

### Description

TypeRogue adds a compact defensive type matchup panel to PokeRogue battles.

It detects the active Pokémon and their current types on both sides, then groups incoming attack types by 4×, 2×, 0.5×, 0.25×, and 0× effectiveness. Neutral 1× matchups are omitted to keep the panel compact.

The panel supports single and double battles, fused Pokémon, dragging, collapsing, and layout reset. If automatic detection is unavailable, a limited manual catalog can be searched by Korean or English Pokémon name.

TypeRogue does not automate game input, alter account data, or send information to an external server. It stores only panel position and collapsed state in Firefox local storage.

TypeRogue is an unofficial fan tool and is not affiliated with PokeRogue, Pokémon, Nintendo, Game Freak, or The Pokémon Company.

## 한국어

### 요약

PokeRogue 전투에서 양쪽 포켓몬의 방어 타입 상성을 표시합니다.

### 설명

TypeRogue는 PokeRogue 전투 화면에 간결한 방어 타입 상성 패널을 추가합니다.

아군과 상대의 현재 포켓몬 및 타입을 감지하고, 공격받을 때의 타입 배율을 4×, 2×, 0.5×, 0.25×, 0×로 나눠 표시합니다. 패널을 간결하게 유지하기 위해 중립인 1×는 표시하지 않습니다.

싱글·더블 전투와 융합 포켓몬을 지원하며 패널 이동, 접기 및 위치 초기화를 제공합니다. 자동 감지가 불가능하면 제한된 수동 목록에서 한국어 또는 영어 포켓몬 이름을 검색할 수 있습니다.

TypeRogue는 게임 입력을 자동화하거나 계정 데이터를 변경하지 않으며 외부 서버로 정보를 보내지 않습니다. Firefox 로컬 저장소에는 패널 위치와 접힘 상태만 저장합니다.

TypeRogue는 비공식 팬 도구이며 PokeRogue, Pokémon, Nintendo, Game Freak 또는 The Pokémon Company와 제휴하지 않습니다.

## Screenshot

- File: `amo-assets/screenshot-battle-ko.png`
- Contents: PokeRogue single battle with the TypeRogue panel visible
- Sensitive information: none visible
- Editing: no compositing or gameplay alteration; captured extension output
- Rights note: the screenshot contains PokeRogue game imagery for the sole purpose of demonstrating extension compatibility. No game image is packaged as extension UI or redistributed as a reusable asset.

## CLI metadata

`docs/amo-metadata.template.json` contains the finalized localized summary, category, support information, and reviewer-note metadata accepted by `web-ext sign --amo-metadata`.
