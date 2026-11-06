# 리팩터링 계획

목표: **동작과 DB는 그대로**, 코드만 읽고 고치기 쉽게 만든다. 학생·교사 데이터는 건드리지 않는다.

## 현황
- `app-supabase.js` 843줄, `teacher-dashboard.js` 568줄. 템플릿 문자열이 한 줄에 수천 자.
- `render()` 한 함수가 모든 화면을 삼항 연산으로 분기.
- 전역 `state`, `data`를 모든 함수가 직접 수정.

## 원칙
1. 단계마다 **화면 동작이 완전히 같아야** 한다 (스크린샷/체크리스트 비교).
2. SQL·RPC·Edge Function·테이블은 변경하지 않는다.
3. 빌드 도구 없이 `<script>` 순서로 로드하는 현재 방식 유지 (Vercel 정적 배포 호환).
4. 한 단계 = 한 PR. 문제 시 PR 단위로 되돌린다.

## 단계
1. ✅ **(완료)** **순수 함수 분리** (`lib/levels.js`, `lib/dates.js`, `lib/sticker.js`): `levelForCount`, 날짜·주간 연속 기록, `stickerCount` 등. 이후 Node 단위 테스트 추가.
2. **데이터 계층 분리** (`lib/api.js`): `loadRecords`, `saveToSupabase`, `fetchBooks`, 방·위시리스트 호출을 한곳에.
3. **뷰 파일 분리** (`views/home.js`, `record.js`, `history.js`, `shelf.js`, `growth.js`, `room.js`, `auth.js`): 각 파일이 HTML 문자열 함수 하나씩 내보냄. 긴 한 줄 템플릿은 여러 줄로 정리.
4. **`render()` 라우터화**: `const views = { home, record, ... }; views[state.view]()`.
5. **이벤트 위임 정리**: 클릭 핸들러의 `if (action === ...)` 나열을 `actions` 객체로 변환.
6. **교사 대시보드에 1~5 동일 적용.**
7. **접근성**: 방 꾸미기 키보드 조작(방향키 이동, +/- 크기), `aria-label` 보강.
8. **테스트·고정**: 순수 함수 테스트, `supabase-js` 버전 고정.

## 검증 체크리스트 (각 단계 공통)
`docs/SETUP.md`의 배포 후 점검 체크리스트 수행.

## 권장 순서
1 → 2 → 3·4 → 5 → 6 → 7 → 8. 1단계부터 시작하면 위험이 가장 작다.

## 진행 기록
- 1단계 완료: `lib/core.js`(레벨·스티커·주간 연속·날짜·`esc`·`loginEmail`) 분리, `tests/core.test.js` 추가. `loginEmail`은 기존 로그인 ID와 동일한 값을 고정 테스트로 보호.
