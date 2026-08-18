# 배포 확인

TypeRogue 0.1.0의 Firefox 배포 기준입니다.

## 확정 정보

- 이름: TypeRogue
- 버전: 0.1.0
- 최소 Firefox 버전: 142.0
- 아이콘: `icons/typerogue-48.png`, `icons/typerogue-96.png`
- 권한: `storage`, `https://pokerogue.net/*`
- 데이터 수집 선언: `none`

## Mozilla 요구 사항 확인

- Manifest V3 형식과 Firefox 전용 확장 ID를 사용한다.
- MAIN world content script를 사용하므로 지원되는 최소 Firefox 버전을 명시한다.
- 기능에 필요한 로컬 저장소와 PokeRogue 호스트 권한만 요청한다.
- 난독화·원격 코드·동적 원격 스크립트를 사용하지 않는다. PokeRogue 장면은 자체 포함된 one-shot Game bind 관찰로 찾고 관찰 직후 원래 메서드를 복원한다.
- 사용자 데이터를 외부로 전송하지 않으며 manifest에 `none`으로 선언한다.
- AMO 제출 전 실전 회귀 시험을 마치고 `web-ext lint` 오류·경고 0개를 확인한다. 배포 ZIP은 Mozilla 서명을 받아야 한다.

정책 확인일: 2026-08-18

- https://extensionworkshop.com/documentation/publish/add-on-policies/
- https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/
- https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/manifest.json
- https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/

## 새 프로필 최종 시험

1. 새 Firefox 프로필을 만든다.
2. 배포 ZIP을 풀고 `manifest.json`을 임시 부가 기능으로 로드한다.
3. PokeRogue 싱글·더블 전투에서 양쪽 포켓몬과 배율을 확인한다.
4. 교체와 폼 변경 때 패널이 갱신되는지 확인한다.
5. 자동 감지 실패 상태에서 양쪽 수동 검색을 확인한다.
6. 이동, 접기, 초기화와 브라우저 배율 변경을 확인한다.
7. 개발자 도구에서 확장 오류와 외부 네트워크 요청이 없는지 확인한다.

마지막 항목은 실제 새 Firefox 프로필에서 사람이 확인한 뒤 `구현.txt`에 완료 기록을 남긴다.
