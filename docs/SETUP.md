# 설정 · 운영 안내

## 1. SQL 실행 순서 (새 프로젝트를 처음부터 만들 때)
Supabase SQL Editor에서 아래 순서로 한 번씩 실행합니다. 모두 여러 번 실행해도 안전하게 작성되어 있습니다.

1. `supabase-schema.sql` — 기본 테이블(기록 등)
2. `supabase-teacher-dashboard.sql` — 교사 대시보드
3. `supabase-classes.sql` — 학교·학급 구조
4. `supabase-teacher-school.sql` — 교사 근무 학교
5. `supabase-challenges.sql` — 학급 챌린지·랭킹·보너스 스티커
6. `supabase-feedback.sql` — 교사 도장·한마디
7. `supabase-wishlist.sql` — 읽고 싶은 책 (순서 무관, 1 다음이면 가능)
8. `supabase-room.sql` — 방 꾸미기
9. `supabase-hardening.sql` — 보안 강화 (**항상 마지막**)

> ⚠️ 이미 운영 중인 DB에서는 **바뀐 파일만** 실행하세요. 특히 `supabase-room.sql`은 최근
> (`classmate_rooms` 접근 제한) 수정되었으므로, 운영 DB 반영 여부를 확인하고 실행 후
> `supabase-hardening.sql`을 다시 실행하는 것이 안전합니다.
> 실행 전 Dashboard → Database → Backups에서 백업을 확인하세요.

## 2. Edge Function (`supabase/functions/`)
코드를 저장소에 올려도 **자동 배포되지 않습니다.** Dashboard → Edge Functions에서 직접 배포합니다.

| 함수 | 용도 | 필요 Secret |
|---|---|---|
| `kakao-book-search` | 책 검색 | `KAKAO_REST_API_KEY` |
| `neis-school-search` | 학교 검색 | NEIS 키 |
| `student-signup` / `teacher-signup` | 가입 | (기본 제공 키) |
| `bulk-create-students` / `manage-student` | 교사의 학생 관리 | (기본 제공 키) |

## 3. 배포 후 점검 체크리스트
- [ ] 학생 로그인 → 책 검색 → 기록 저장 → 스티커 증가
- [ ] 내 방에서 아이템 구매·배치, 새로고침 후 유지
- [ ] 교사 로그인 → 학생 목록, 칭찬 도장 → 학생 화면에 표시
- [ ] 로그인하지 않은 상태에서 테이블 직접 조회가 막히는지 (anon 권한)
- [ ] 기존 학생·교사 데이터(기록 수, 도장)가 그대로인지

## 4. 알려진 개선 과제
- `supabase-js`가 CDN에서 `@2`로 느슨하게 로드됩니다. 정확한 버전 고정은 로그인 흐름 점검과 함께 진행 권장.
- 테스트: `node --test tests/*.test.js` (Node 20+, 설치 불필요). 현재 `lib/core.js`의 순수 함수만 대상.
