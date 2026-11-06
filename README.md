# 독서한걸음 (book-step)

초등학생이 읽은 책을 기록하고(미션 답변 → 스티커), 스티커로 방을 꾸미며, 교사가 학급을 관리하는 웹앱입니다.
정적 사이트(HTML/JS/CSS) + Supabase(DB·인증·Edge Function) 구성이며 Vercel에 배포합니다.

## 화면
| 파일 | 설명 |
|---|---|
| `index.html` + `app-supabase.js` | 학생용 앱 (기록, 저장 내역, 내 책장, 성장 현황, 내 방) |
| `teacher.html` + `teacher-dashboard.js` + `teacher-room.js` | 교사용 대시보드 (학생 관리, 칭찬 도장, 챌린지, 교사 방) |
| `supabase-config.js` | Supabase URL / publishable(anon) key — 공개 키만 넣습니다 |
| `assets/` | 로고, 방 아이템 일러스트 |

## 배포
`main` 브랜치에 push하면 Vercel이 자동 배포합니다. 빌드 과정은 없습니다.

## 데이터베이스 · Edge Function
- SQL 실행 순서와 주의사항: [`docs/SETUP.md`](docs/SETUP.md)
- 카카오 책 검색 설정: [`KAKAO_BOOK_SEARCH_SETUP.md`](KAKAO_BOOK_SEARCH_SETUP.md)
- 리팩터링 계획: [`docs/REFACTOR_PLAN.md`](docs/REFACTOR_PLAN.md)

## 운영 원칙 (중요)
학생·교사가 입력한 데이터는 운영 DB에 있습니다. 코드 변경 시:
- SQL 파일에서 `drop table`, `truncate`, 조건 없는 `delete`를 쓰지 않습니다.
- 스키마 변경은 `add column if not exists` 등 되돌릴 수 있는 방식만 사용합니다.
- 새 SQL은 반드시 백업(Supabase Dashboard → Database → Backups) 후 실행합니다.
