# 카카오 책 검색 API 설정 안내

네이버 책 검색 API 대신 카카오 책 검색 API를 사용하도록 변경했습니다. 학생 화면의 검색 UI는 그대로이고, 검색 요청은 `kakao-book-search` Supabase Edge Function을 거칩니다.

## 1. 카카오 REST API 키 발급

1. [카카오디벨로퍼스](https://developers.kakao.com/)에 카카오 계정으로 로그인합니다.
2. **내 애플리케이션**에서 앱을 하나 만들거나 기존 앱을 선택합니다.
3. 앱 설정의 **앱 키** 화면에서 **REST API 키**를 복사합니다.
4. 이 키를 채팅, GitHub, HTML, JavaScript에 올리지 않습니다.

## 2. Supabase Secret 등록

1. Supabase Dashboard에서 `read-onestep` 프로젝트를 엽니다.
2. 왼쪽 메뉴에서 **Edge Functions → Secrets**로 이동합니다.
3. Name에 `KAKAO_REST_API_KEY`를 입력합니다.
4. Value에 카카오 REST API 키를 붙여넣습니다.
5. **Save**를 누릅니다.

## 3. Edge Function 배포

Supabase Dashboard의 **Edge Functions**에서 **Deploy a new function → Via Editor**를 선택합니다.

- Function name: `kakao-book-search`
- 프로젝트의 `supabase/functions/kakao-book-search/index.ts` 내용을 복사해 붙여넣습니다.
- Deploy합니다.

이 함수는 `https://dapi.kakao.com/v3/search/book`을 호출하고, 제목·저자·출판사·표지·ISBN·짧은 책 소개를 학생 화면에 전달합니다. 카카오 키는 함수 서버 안에서만 사용됩니다.

## 4. 앱 배포

변경된 `app-supabase.js`와 `supabase/functions/kakao-book-search/index.ts`를 GitHub `main` 브랜치에 커밋·푸시하면 Vercel이 자동 배포합니다. 앱 코드에서 호출하는 함수 이름은 `kakao-book-search`입니다.

## 5. 테스트 순서

1. `https://book-step.vercel.app/`에 접속합니다.
2. 학생 계정으로 로그인합니다.
3. **독서한걸음 기록하기**를 누릅니다.
4. 책 제목을 두 글자 이상 입력합니다.
5. **책 검색**을 누릅니다.
6. 검색 결과에서 책을 선택합니다.
7. 제목과 저자가 자동 입력되고, 표지와 짧은 책 소개 카드가 나타나는지 확인합니다.

검색이 실패하면 다음을 확인합니다.

- Secret 이름이 정확히 `KAKAO_REST_API_KEY`인지
- Secret을 저장한 Supabase 프로젝트가 앱의 Supabase 프로젝트와 같은지
- Edge Function 이름이 정확히 `kakao-book-search`인지
- Function 배포가 성공했는지
- 카카오 REST API 키를 재발급했다면 Supabase Secret도 새 값으로 바꿨는지

기존 `naver-book-search` Function은 더 이상 앱에서 호출하지 않지만, 삭제하지 않고 남겨두어도 됩니다. 네이버 Client Secret은 만료·노출 가능성이 있으므로 네이버 개발자센터에서 폐기하거나 재발급하는 것을 권장합니다.
