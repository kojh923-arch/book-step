# 코드 지도 (어디에 뭐가 있나)

코드가 처음과 달라져 헷갈릴 때 이 문서부터 보세요.

## 파일
| 파일 | 역할 |
|---|---|
| `index.html` | 학생 앱 진입점. 아래 순서로 스크립트를 불러옵니다: supabase-js → `supabase-config.js` → `lib/core.js` → `app-supabase.js` |
| `lib/core.js` | **계산만 하는 함수** (레벨, 스티커, 주간 연속, 날짜, `esc`, `loginEmail`). 화면·DB와 무관. 테스트 있음 |
| `app-supabase.js` | 학생 앱 본체. 안에 `// ===== 제목 =====` 표시로 구역이 나뉘어 있음 |
| `tests/core.test.js` | `lib/core.js` 자동 테스트 (`node --test tests/*.test.js`) |
| `teacher.html`, `teacher-dashboard.js`, `teacher-room.js` | 교사용 화면 (아직 정리 전, 원래 모습 그대로) |
| `admin-dashboard.js`, `supabase-admin.sql` | 슈퍼 관리자 화면(읽기 전용)과 조회 함수. `role='admin'`으로 `teacher.html`에 로그인하면 표시 |
| `supabase-*.sql`, `supabase/functions/` | DB 구조와 서버 함수. 순서는 `docs/SETUP.md` |

## `app-supabase.js` 구역 (위에서 아래)
상수 → 앱 상태(`state`) → 학교 검색 → 데이터 읽기·쓰기 → 화면 그리기 → 이벤트 처리 → 캘린더·도장·챌린지 → 내 방 → 내 책장

## 자주 하는 수정은 어디서?
- 미션 질문 바꾸기: 파일 맨 위 `MISSIONS`
- 레벨 이름/기준: `lib/core.js`의 `LEVELS`
- 스티커 계산 규칙: `lib/core.js`의 `stickerTotal`
- 화면 문구: 해당 화면 함수(`home`, `recordForm`, `growth`, `shelf` …)
- 버튼 동작: 이벤트 처리 구역의 `if (action === '...')`

## 지금까지의 정리 내용
1단계: 계산 함수를 `lib/core.js`로 분리 (동작 동일)
2단계(이번): 코드는 그대로 두고 **구역 표시 주석과 이 지도만 추가**.
DB 저장 코드를 옮기는 작업은 학생·교사 데이터에 닿는 부분이라 따로 신중히 진행합니다.
