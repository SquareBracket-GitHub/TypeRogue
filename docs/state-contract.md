# 게임 상태 감지 데이터 계약

페이지 브리지는 `window.postMessage()`로 `STATE` 메시지를 보낸다. 현재 계약 버전은 `schemaVersion: 1`이다.

```js
{
  source: "pokerogue-type-helper-page",
  type: "STATE",
  payload: {
    sequence: 1,
    lifecycle: "battle-start",
    changedSlots: [
      {
        side: "player",
        slot: 0,
        kind: "entered",
        before: null,
        after: PokemonSnapshot
      }
    ],
    state: BattleState
  }
}
```

`lifecycle` 값은 `snapshot`, `battle-start`, `battle-end`, `state-changed`, `detection-failed` 중 하나다.

`changedSlots[].kind` 값은 다음과 같다.

- `entered`: 비어 있던 슬롯에 포켓몬이 들어옴
- `left`: 슬롯에서 포켓몬이 사라짐
- `switched`: 같은 슬롯의 런타임 포켓몬 ID가 바뀜
- `form-changed`: 같은 포켓몬의 종·폼·표시 이름 식별자가 바뀜
- `updated`: 그 밖의 직렬화 정보가 바뀜

```js
BattleState = {
  schemaVersion: 1,
  status: "idle" | "battle" | "unavailable",
  detection: {
    ok: boolean,
    errors: string[]
  },
  battle: {
    active: boolean,
    double: boolean
  },
  fields: {
    player: PokemonSnapshot[],
    enemy: PokemonSnapshot[]
  }
}

PokemonSnapshot = {
  side: "player" | "enemy",
  slot: number,
  pokemonId: number | string | null,
  speciesId: number | null,
  fusionSpeciesId: number | null,
  formIndex: number | null,
  fusionFormIndex: number | null,
  formKey: string | null,
  displayName: string | null,
  types: number[]
}
```

포켓몬 이름은 현재 게임 언어의 표시 이름을 그대로 전달한다. 로직의 안정적인 식별에는 언어와 무관한 `speciesId`, `formIndex`, `pokemonId`를 사용한다.

단일 배틀은 각 진영의 슬롯 `0`을 사용한다. 더블 배틀은 각 진영의 슬롯 `0`, `1`을 사용한다. 활성 포켓몬 필터를 적용하기 전 배열 인덱스를 사용하므로 슬롯이 사라지거나 당겨지지 않는다.

동일한 전체 상태는 다시 전송하지 않는다. UI는 `changedSlots`를 사용해 변경된 포켓몬 영역만 다시 렌더링할 수 있다.
