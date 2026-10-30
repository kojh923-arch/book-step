const MISSIONS = [
  ['감정과 공감', '주인공의 기분은 어땠을까요?'],
  ['감정과 공감', '주인공에게 해주고 싶은 말은 무엇인가요?'],
  ['감정과 공감', '책을 읽으며 가장 마음이 움직인 순간은 언제였나요?'],
  ['감정과 공감', '이 책을 읽고 내 마음에 남은 감정을 한 단어로 표현해 보세요.'],
  ['감정과 공감', '주인공의 선택에 공감한 점 또는 아쉬운 점을 적어보세요.'],
  ['등장인물', '가장 기억에 남는 인물은 누구인가요?'],
  ['등장인물', '내가 주인공이라면 어떻게 했을까요?'],
  ['등장인물', '주인공과 닮은 점이 있는 사람을 떠올리고 이유를 적어보세요.'],
  ['등장인물', '등장인물 한 명에게 질문을 하나 한다면 무엇을 묻고 싶나요?'],
  ['등장인물', '가장 멋진 행동을 한 인물과 그 이유를 적어보세요.'],
  ['장면과 문장', '가장 기억에 남는 장면을 적어보세요.'],
  ['장면과 문장', '기억에 남는 문장을 소개해 보세요.'],
  ['장면과 문장', '책 속 장면 하나를 그림으로 그린다면 어떤 장면을 고르겠나요?'],
  ['장면과 문장', '책의 제목을 새로 짓는다면 어떤 제목으로 바꾸고 싶나요?'],
  ['장면과 문장', '이 책의 내용을 세 문장으로 요약해 보세요.'],
  ['추천과 생각', '친구에게 이 책을 추천하고 싶은 이유는 무엇인가요?'],
  ['추천과 생각', '이 책에서 새롭게 알게 된 점은 무엇인가요?'],
  ['추천과 생각', '이 책을 누구에게 추천하고 싶은지, 그 이유를 적어보세요.'],
  ['추천과 생각', '이 책을 읽기 전과 후에 달라진 생각이 있나요?'],
  ['추천과 생각', '별점을 준 이유를 자세히 적어보세요.'],
  ['상상과 이어쓰기', '결말을 바꾼다면 어떻게 바꾸고 싶나요?'],
  ['상상과 이어쓰기', '다음 이야기를 상상해 보세요.'],
  ['상상과 이어쓰기', '이야기 속에 새로운 인물이 등장한다면 어떤 인물일까요?'],
  ['상상과 이어쓰기', '책 속 인물에게 편지를 써 보세요.'],
  ['상상과 이어쓰기', '이 이야기가 10년 뒤에도 이어진다면 어떤 일이 생길까요?'],
  ['나와 연결하기', '이 책의 내용과 비슷한 내 경험이 있나요?'],
  ['나와 연결하기', '책 속에서 배운 점을 내 생활에서 실천한다면 무엇을 해 보고 싶나요?'],
  ['나와 연결하기', '오늘 읽은 책을 한 줄 일기로 남긴다면 어떻게 쓸까요?'],
  ['나와 연결하기', '이 책을 읽고 가장 궁금해진 점은 무엇인가요?'],
  ['나와 연결하기', '이 책을 읽기 전의 나에게 한마디 해 준다면 무엇이라고 말할까요?']
];
const LEVELS = [
  [0, '독서 준비생', '🌰'], [5, '책 첫걸음', '🌱'], [10, '책 새싹', '🌱'], [20, '독서 탐험가', '🌿'],
  [40, '열정 독서가', '🌿'], [60, '이야기 수집가', '🪴'], [80, '독서 여행자', '🪴'], [100, '책의 친구', '🌳'],
  [130, '지식 탐험가', '🌳'], [160, '독서 고수', '📖'], [200, '책 마스터', '🏆']
];
const localKey = 'read-step-local-v2';
const cfg = window.SUPABASE_CONFIG || {};
const supabaseReady = Boolean(cfg.url && cfg.anonKey && window.supabase);
const sb = supabaseReady ? window.supabase.createClient(cfg.url, cfg.anonKey) : null;
const STUDENT_SIGNUP_FUNCTION = 'quick-responder';
const BOOK_SEARCH_FUNCTION = 'kakao-book-search';
const RECOMMENDATION_POOLS = {
  junior: [
    '강아지똥', '알사탕', '구름빵', '팥죽 할멈과 호랑이', '무지개 물고기',
    '장수탕 선녀님', '이상한 엄마', '수박 수영장', '도깨비를 빨아버린 우리 엄마', '돼지책',
    '괴물들이 사는 나라', '아주아주 배고픈 애벌레', '달님 안녕', '사과가 쿵', '지하 100층짜리 집',
    '100층짜리 집', '책 먹는 여우', '마법의 설탕 두 조각', '나쁜 어린이 표', '마당을 나온 암탉',
    '까막눈 삼디기', '눈아이', '할머니의 여름휴가', '코끼리 아저씨와 100개의 물방울', '구름 공항',
    '선생님은 몬스터!', '어쩌다 숲', '나무는 좋다', '커다란 순무', '세상에서 제일 힘센 수탉'
  ].map(title => [title, '', '저학년의 상상력과 공감을 키워 주는 추천 도서예요.']),
  senior: [
    '시간을 파는 상점', '체리새우: 비밀글입니다', '페인트', '불편한 편의점', '5번 레인',
    '긴긴밤', '순례 주택', '아몬드', '완득이', '유진과 유진',
    '너도 하늘말나리야', '세계로 가는 기차', '독고솜에게 반하면', '세계를 건너 너에게 갈게', '괭이부리말 아이들',
    '나의 라임 오렌지나무', '모모', '해리 포터와 마법사의 돌', '호빗', '오즈의 마법사',
    '비밀의 화원', '15소년 표류기', '로빈슨 크루소', '톰 소여의 모험', '작은 아씨들',
    '보물섬', '파랑새', '소공녀', '몽실 언니', '우리들의 일그러진 영웅'
  ].map(title => [title, '', '고학년이 생각을 넓히고 깊이 읽어 볼 만한 추천 도서예요.'])
};
const state = { view: 'home', authMode: 'login', pendingBook: null, mission: null, rating: 0, selectedRecord: null, editingId: null, error: '', levelUp: null, bookQuery: '', bookAuthor: '', selectedBookInfo: null, bookDescriptionExpanded: false, bookResults: [], bookSearchError: '', bookSearching: false, recommendations: [], recommendationsLoaded: false, recommendationLoading: false, school: null, schoolQuery: '', schoolResults: [], schoolSearching: false, schoolSearched: false, schoolError: '', schoolSample: false, grade: '', classNo: '', draft: { nickname: '', password: '', classCode: '' } };

try { state.draft.classCode = localStorage.getItem('bookstep-class-code') || ''; } catch {}
const SCHOOL_SEARCH_FUNCTION = 'neis-school-search';
const isLocalHost = ['localhost', '127.0.0.1'].includes(location.hostname);
const gradeCount = () => 6;
async function fetchSchools(query) {
  if (isLocalHost) {
    const res = await fetch(`/__neis?q=${encodeURIComponent(query)}`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || '학교를 검색하지 못했어요.');
    state.schoolSample = !!body.sample;
    return body.items || [];
  }
  if (!sb) throw new Error('Supabase 연결 설정을 먼저 확인해 주세요.');
  const { data: result, error } = await sb.functions.invoke(SCHOOL_SEARCH_FUNCTION, { body: { query } });
  if (error) { const detail = await error.context?.json?.().catch(() => null); throw new Error(detail?.error || error.message || '학교를 검색하지 못했어요.'); }
  return result?.items || [];
}
async function searchSchools() {
  const query = document.querySelector('#school-query')?.value.trim() ?? state.schoolQuery;
  state.schoolQuery = query;
  if (query.length < 2) { state.schoolError = '두 글자 이상 학교 이름을 입력해 주세요.'; state.schoolResults = []; state.schoolSearched = false; render(); return; }
  state.schoolSearching = true; state.schoolError = ''; state.schoolResults = []; render();
  try {
    state.schoolResults = await fetchSchools(query);
    state.schoolSearched = true;
  } catch (err) { state.schoolError = err.message; }
  state.schoolSearching = false; render();
}
function schoolFields() {
  const s = state.school;
  const results = state.schoolSearching ? '<div class="book-search-note">학교를 찾고 있어요…</div>'
    : state.schoolError ? `<div class="book-search-note error">${esc(state.schoolError)}</div>`
    : state.schoolResults.length ? `${state.schoolSample ? '<div class="book-search-note">인증키가 없어 샘플 학교를 보여주고 있어요.</div>' : ''}<div class="book-search-results">${state.schoolResults.map((item, index) => `<button type="button" class="book-result" data-action="select-school" data-school-index="${index}"><span class="book-result-placeholder">🏫</span><span><strong>${esc(item.name)}</strong><small>${esc(item.officeName)} · ${esc(item.address || item.kind)}</small></span><b>선택</b></button>`).join('')}</div>`
    : state.schoolSearched ? '<div class="book-search-note">검색 결과가 없어요. 학교 이름을 다시 확인해 주세요.</div>' : '';
  const picker = s
    ? `<div class="selected-school"><span aria-hidden="true">🏫</span><div><strong>${esc(s.name)}</strong><small>${esc(s.officeName)}</small></div><button type="button" class="ghost-button" data-action="clear-school">변경</button></div>`
    : `<div class="school-search-row"><input id="school-query" value="${esc(state.schoolQuery)}" placeholder="예: 한걸음초등학교" autocomplete="off" /><button type="button" class="secondary-button" data-action="search-school">학교 찾기</button></div>${results}`;
  const grades = s ? Array.from({ length: gradeCount() }, (_, i) => `<option value="${i + 1}" ${String(state.grade) === String(i + 1) ? 'selected' : ''}>${i + 1}학년</option>`).join('') : '';
  const classes = Array.from({ length: 20 }, (_, i) => `<option value="${i + 1}" ${String(state.classNo) === String(i + 1) ? 'selected' : ''}>${i + 1}반</option>`).join('');
  const classRow = s ? `<div class="field-row"><div class="field"><label for="grade">학년</label><select id="grade" required><option value="">선택</option>${grades}</select></div><div class="field"><label for="class-no">반</label><select id="class-no" required><option value="">선택</option>${classes}</select></div></div>` : '';
  return `<div class="field"><label>학교</label>${picker}</div>${classRow}`;
}
let data = { nickname: '', records: [], feedback: {}, challenges: [], ranking: [], bonus: 0 };

const esc = (v = '') => String(v).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const bookVisual = (record, className = 'record-book-icon') => record.cover_image ? `<span class="${className} record-book-cover"><img src="${esc(record.cover_image)}" alt="${esc(record.title)} 표지" /></span>` : `<span class="${className}">📕</span>`;
const stars = n => '★'.repeat(Number(n || 0)) + '☆'.repeat(5 - Number(n || 0));
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
// 학급코드가 있으면 학급별 로그인 ID(student2-), 없으면 예전 방식(student-)을 씁니다.
const loginEmail = (nickname, classCode = '') => {
  const code = String(classCode || '').trim().toUpperCase();
  const encoded = btoa(unescape(encodeURIComponent(code ? `${code}:${nickname.trim()}` : nickname.trim()))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${code ? 'student2' : 'student'}-${encoded}@bookstep.local`;
};
const levelForCount = count => LEVELS.reduce((r, x) => count >= x[0] ? x : r, LEVELS[0]);
const levelIcon = item => `<span class="growth-symbol growth-symbol-${LEVELS.indexOf(item)}" aria-hidden="true">${item[2]}</span>`;
const level = () => levelForCount(data.records.length);
const nextLevel = () => LEVELS.find(x => x[0] > data.records.length) || LEVELS.at(-1);
const monthCount = () => { const m = today().slice(0, 7); return data.records.filter(r => String(r.read_date || r.date).startsWith(m)).length; };
const pickMission = () => MISSIONS[Math.floor(Math.random() * MISSIONS.length)];
const dayOfYear = date => Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 86400000);
const dailyRecommendationSeed = grade => {
  const pool = RECOMMENDATION_POOLS[grade];
  const gradeOffset = grade === 'senior' ? 1 : 0;
  return pool[(dayOfYear(new Date()) + gradeOffset) % pool.length];
};
const fallbackBookUrl = title => `https://search.daum.net/search?w=book&q=${encodeURIComponent(title)}`;
const fallbackRecommendations = () => ['junior', 'senior'].map(grade => {
  const [title, author, description] = dailyRecommendationSeed(grade);
  return { grade, title, author, description, image: '', publisher: '', url: fallbackBookUrl(title) };
});
function localLoad() { try { return JSON.parse(localStorage.getItem(localKey) || 'null'); } catch { return null; } }
function localSave() { localStorage.setItem(localKey, JSON.stringify(data)); }

async function loadRecords() {
  if (!sb) return;
  const { data: rows, error } = await sb.from('reading_records').select('*').order('read_date', { ascending: false }).order('created_at', { ascending: false });
  if (error) throw error;
  data.records = rows || [];
  const { data: fbRows } = await sb.from('teacher_feedback').select('record_id,stamp,comment,seen_at');
  data.feedback = Object.fromEntries((fbRows || []).map(row => [row.record_id, row]));
  await loadCommunity();
  await loadRoom();
  await loadWishlist();
}
async function loadProfile(user) {
  const { data: profile } = await sb.from('profiles').select('nickname').eq('id', user.id).maybeSingle();
  data.nickname = profile?.nickname || user.user_metadata?.nickname || user.email?.split('@')[0] || '독서가';
  if (!profile) await sb.from('profiles').upsert({ id: user.id, nickname: data.nickname });
  await loadRecords();
}
async function saveToSupabase(record) {
  const { data: userData } = await sb.auth.getUser();
  if (!userData.user) throw new Error('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
  const { error } = await sb.from('reading_records').insert({
    user_id: userData.user.id, title: record.title, author: record.author, read_date: record.date,
    rating: record.rating, mission_category: record.category, mission: record.mission, answer: record.answer,
    student_nickname: data.nickname, cover_image: record.cover_image || null
  });
  if (error) throw error;
  await removeWishlistByTitle(record.title);
  await loadRecords();
}
async function deleteRecord(recordId) {
  if (!window.confirm('이 독서 기록을 정말 삭제할까요?\n삭제한 기록은 되돌릴 수 없어요.')) return;
  if (sb) {
    const { error } = await sb.from('reading_records').delete().eq('id', recordId);
    if (error) throw error;
    await loadRecords();
  } else {
    data.records = data.records.filter(record => String(record.id) !== String(recordId));
    localSave();
  }
  state.selectedRecord = null;
}
async function updateRecord(recordId, fields) {
  if (!sb) throw new Error('Supabase 연결 설정을 먼저 확인해 주세요.');
  const { error } = await sb.from('reading_records').update(fields).eq('id', recordId);
  if (error) throw error;
  await loadRecords();
}
const normalizeTitle = title => String(title || '').replace(/\s/g, '').toLowerCase();
const findDuplicateRecord = title => normalizeTitle(title) ? data.records.find(record => normalizeTitle(record.title) === normalizeTitle(title)) : null;
async function fetchBooks(query) {
  if (!sb) throw new Error('Supabase 연결 설정을 먼저 확인해 주세요.');
  const { data: result, error } = await sb.functions.invoke(BOOK_SEARCH_FUNCTION, { body: { query } });
  if (error) throw new Error(error.message || '도서를 검색하지 못했어요.');
  return result?.items || [];
}
async function searchNaverBooks(query) {
  state.bookSearching = true;
  state.bookSearchError = '';
  state.selectedBookInfo = null;
  state.bookDescriptionExpanded = false;
  state.bookResults = [];
  render();
  state.bookResults = await fetchBooks(query);
  if (!state.bookResults.length) state.bookSearchError = '검색 결과가 없어요. 다른 검색어를 입력해 보세요.';
}
async function loadHomeRecommendations() {
  if (state.recommendationLoading || state.recommendationsLoaded) return;
  state.recommendationLoading = true;
  if (state.view === 'home') render();
  try {
    const groups = ['junior', 'senior'];
    const recommendations = await Promise.all(groups.map(async grade => {
      const [title, author, fallbackDescription] = dailyRecommendationSeed(grade);
      const items = await fetchBooks(title);
      const matched = items.find(item => item.title.replace(/\s/g, '') === title.replace(/\s/g, '')) || items[0] || {};
      const recommendedTitle = matched.title || title;
      return { grade, title: recommendedTitle, author: matched.author || author, description: matched.description || fallbackDescription, image: matched.image || '', publisher: matched.publisher || '', url: matched.url || fallbackBookUrl(recommendedTitle) };
    }));
    state.recommendations = recommendations;
  } catch {
    state.recommendations = fallbackRecommendations();
  } finally {
    state.recommendationLoading = false;
    state.recommendationsLoaded = true;
    if (state.view === 'home') render();
  }
}
async function registerStudent(nickname, password, classCode, classInfo = {}) {
  const response = await fetch(`${cfg.url}/functions/v1/${STUDENT_SIGNUP_FUNCTION}`, {
    method: 'POST',
    headers: { apikey: cfg.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, password, classCode, ...classInfo })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || '회원가입에 실패했어요.');
}

function layout(content, active = 'home') { return `<div class="shell"><div class="container"><header class="topbar"><div class="brand"><span class="brand-mark"><img src="assets/dokseo-hangeoreum-logo.png" alt="독서한걸음 로고" /></span><div>독서한걸음<small>${esc(data.nickname)}님의 독서 기록</small></div></div><div class="topbar-actions"><button class="ghost-button" data-action="logout">로그아웃</button></div></header><nav class="nav-tabs"><button class="${active === 'home' ? 'active' : ''}" data-view="home">홈</button><button class="${active === 'record' ? 'active' : ''}" data-view="record">독서 기록</button><button class="${active === 'history' ? 'active' : ''}" data-view="history">저장 내역</button><button class="${active === 'shelf' ? 'active' : ''}" data-view="shelf">내 책장</button><button class="${active === 'growth' ? 'active' : ''}" data-view="growth">성장 현황</button><button class="${active === 'room' ? 'active' : ''}" data-view="room">내 방</button></nav>${content}</div></div>`; }
function homeRecommendations() {
  const cards = state.recommendationLoading || !state.recommendations.length
    ? ['junior', 'senior'].map(grade => `<article class="recommendation-card ${grade} loading"><div class="recommendation-copy"><span class="recommendation-tag">${grade === 'junior' ? '🌼 저학년 추천' : '🌿 고학년 추천'}</span><strong>오늘의 책을 고르고 있어요…</strong><p>잠시만 기다려 주세요.</p></div></article>`).join('')
    : state.recommendations.map(book => `<a class="recommendation-card ${book.grade}" href="${esc(book.url || fallbackBookUrl(book.title))}" target="_blank" rel="noopener noreferrer" aria-label="${esc(book.title)} 상세 보기"><div class="recommendation-cover">${book.image ? `<img src="${esc(book.image)}" alt="${esc(book.title)} 표지" />` : '📚'}</div><div class="recommendation-copy"><span class="recommendation-tag">${book.grade === 'junior' ? '🌼 저학년 추천' : '🌿 고학년 추천'}</span><h3>${esc(book.title)}</h3><small>${esc(book.author || '저자 정보 없음')}</small><p>${esc(book.description || '오늘 이 책을 만나 보세요.')}</p><span class="recommendation-link-note">책 자세히 보기 ↗</span></div></a>`).join('');
  return `<section class="recommendations-section"><div class="recommendations-heading"><div><p class="eyebrow">TODAY'S BOOK PICKS</p><h2>오늘의 책 추천</h2><p class="subtitle">나의 학년에 어울리는 책을 만나 보고, 읽고 싶은 책을 골라 보세요.</p></div><span class="recommendation-date">${today().replaceAll('-', '.')}</span></div><div class="recommendation-grid">${cards}</div></section>`;
}
function home() {
  const lv = level(), next = nextLevel();
  const pct = next[0] === lv[0] ? 100 : Math.min(100, ((data.records.length - lv[0]) / (next[0] - lv[0])) * 100);
  return layout(`<section class="hero"><div class="hero-copy"><p class="eyebrow">오늘도 독서 한 걸음</p><h1>읽은 책이<br>나의 성장으로 이어져요.</h1><p class="subtitle">책을 기록하고 랜덤 미션을 수행하면<br>나만의 독서 기록이 차곡차곡 쌓여요.</p><div class="button-row"><button class="primary-button" data-view="record">독서한걸음 기록하기</button><button class="secondary-button" data-view="history">저장 내역 보기</button></div></div><div class="hero-visual"><div class="growth-tree">${levelIcon(lv)}</div><div class="hero-level-summary"><strong>LV.${LEVELS.indexOf(lv)} ${lv[1]}</strong></div></div></section><section class="stats home-stats"><div class="stat"><div class="stat-label">이번 달 읽은 권 수</div><div class="stat-value">${monthCount()}권</div><div class="stat-note">꾸준히 기록하고 있어요</div></div><div class="stat"><div class="stat-label">총 읽은 책</div><div class="stat-value">${data.records.length}권</div><div class="stat-note">다음 목표 ${next[0]}권</div></div><div class="stat"><div class="stat-label">받은 스티커</div><div class="stat-value">${stickerCount()}개 ⭐</div><div class="stat-note">미션 완료 보상</div></div></section><section class="panel"><div class="level-row"><div class="level-icon">${levelIcon(lv)}</div><div class="level-copy"><div class="level-title">LV.${LEVELS.indexOf(lv)} ${lv[1]}</div><div class="progress"><span style="width:${pct}%"></span></div><div class="progress-note"><span>${data.records.length}권 읽음</span><span>${next[0] === lv[0] ? '최고 레벨!' : `다음 레벨까지 ${next[0] - data.records.length}권`}</span></div></div></div></section>${feedbackBanner()}${communityPanel()}${calendarPanel()}${homeRecommendations()}`, 'home');
}
function auth() { return `<div class="auth-wrap"><div class="auth-card"><div class="brand"><span class="brand-mark"><img src="assets/dokseo-hangeoreum-logo.png" alt="독서한걸음 로고" /></span><div>독서한걸음<small>읽고 기록하고 성장해요</small></div></div><p class="eyebrow">MY READING SPACE</p><h1>${state.authMode === 'signup' ? '나만의 독서 기록을 시작해요' : '독서한걸음 불러오기'}</h1><p class="subtitle">닉네임과 비밀번호만으로, 어디서든 같은 기록을 이어갈 수 있어요.</p><div class="auth-toggle"><button class="${state.authMode === 'login' ? 'active' : ''}" data-action="login">로그인</button><button class="${state.authMode === 'signup' ? 'active' : ''}" data-action="signup">회원가입</button></div><form id="auth-form">${state.authMode === 'signup' ? schoolFields() : ''}<div class="field"><label for="nickname">닉네임</label><input id="nickname" required minlength="2" maxlength="16" value="${esc(state.draft.nickname)}" placeholder="예: 책을 좋아하는 지현" /></div><div class="field"><label for="password">비밀번호</label><input id="password" type="password" required minlength="6" value="${esc(state.draft.password)}" placeholder="6자 이상 입력" /></div><div class="field"><label for="class-code">학급코드${state.authMode === 'signup' ? '' : ' (예전에 가입한 친구는 비워도 돼요)'}</label><input id="class-code" ${state.authMode === 'signup' ? 'required' : ''} maxlength="30" autocapitalize="characters" autocomplete="off" value="${esc(state.draft.classCode)}" placeholder="선생님에게 받은 학급코드" /></div><div id="auth-error" class="error" role="alert">${esc(state.error)}</div><button class="primary-button" style="width:100%" type="submit">${state.authMode === 'signup' ? '회원가입하고 시작하기' : '독서한걸음 불러오기'}</button></form><p class="notice">닉네임과 비밀번호를 잊지 않도록 꼭 기억해 주세요.</p></div></div>`; }
function recordForm() {
  const results = state.bookSearching ? '<div class="book-search-note">도서를 찾고 있어요…</div>' : state.bookResults.length ? `<div class="book-search-results">${state.bookResults.map((book, index) => `<button type="button" class="book-result" data-action="select-book" data-book-index="${index}">${book.image ? `<img src="${esc(book.image)}" alt="" />` : '<span class="book-result-placeholder">📚</span>'}<span><strong>${esc(book.title)}</strong><small>${esc(book.author || '저자 정보 없음')} · ${esc(book.publisher || '출판사 정보 없음')}</small></span><b>선택</b></button>`).join('')}</div>` : state.bookSearchError ? `<div class="book-search-note error">${esc(state.bookSearchError)}</div>` : '';
  const selected = state.selectedBookInfo;
  const description = selected?.description || '이 책은 카카오 책 검색에서 선택한 도서예요. 책을 읽고 나만의 생각을 기록해 보세요.';
  const hasMoreDescription = description.length > 130;
  const preview = selected ? `<article class="selected-book-preview ${state.bookDescriptionExpanded ? 'expanded' : ''}"><div class="selected-book-cover">${selected.image ? `<img src="${esc(selected.image)}" alt="${esc(selected.title)} 표지" />` : '📚'}</div><div class="selected-book-copy"><span>선택한 책</span><h2>${esc(selected.title)}</h2><small>${esc(selected.author || '저자 정보 없음')} · ${esc(selected.publisher || '출판사 정보 없음')}</small><p>${esc(description)}</p>${hasMoreDescription ? `<button class="book-description-toggle" type="button" data-action="toggle-book-description" aria-expanded="${state.bookDescriptionExpanded}">${state.bookDescriptionExpanded ? '책 소개 접기 ▲' : '책 소개 더보기 ▼'}</button>` : ''}</div></article>` : '';
  const dup = selected ? findDuplicateRecord(selected.title) : null;
  const dupNote = dup ? `<div class="dup-note">📌 이 책은 ${esc(String(dup.read_date || dup.date).slice(0, 10))}에 이미 기록했어요. 또 읽었다면 그대로 기록해도 돼요.</div>` : '';
  return layout(`<section class="page-title"><div><p class="eyebrow">BOOK RECORD</p><h1>읽은 책을 기록해요.</h1><p class="subtitle">책을 검색해 간편하게 기록하거나 직접 입력할 수 있어요.</p></div></section><form class="form-card" id="book-form"><div class="form-grid"><div class="field full"><label for="title">책 제목</label><div class="book-search-input"><input id="title" required value="${esc(state.bookQuery)}" placeholder="예: 마당을 나온 암탉" /><button class="secondary-button" type="button" data-action="search-books">🔎 책 검색</button></div>${results}${preview}${dupNote}</div><div class="field"><label for="author">저자</label><input id="author" required value="${esc(state.bookAuthor)}" placeholder="예: 황선미" /></div><div class="field"><label for="date">읽은 날짜</label><input id="date" type="date" value="${today()}" required /></div><div class="field full"><label>내 별점</label><div class="rating">${[1,2,3,4,5].map(n => `<button type="button" class="star ${n <= state.rating ? 'active' : ''}" data-rating="${n}">★</button>`).join('')}</div></div></div><div class="button-row"><button class="primary-button" type="button" data-action="next-mission">다음: 랜덤 미션 보기 →</button><button class="secondary-button" type="button" data-view="home">취소</button></div></form>`, 'record');
}
function missionView() { return layout(`<section class="page-title"><div><p class="eyebrow">TODAY'S RANDOM MISSION</p><h1>책을 읽고, 생각을 남겨요.</h1><p class="subtitle"><strong>${esc(state.pendingBook.title)}</strong>을(를) 읽고 다음 질문에 답해 보세요.</p></div></section><section class="mission-layout"><aside class="mission-quote"><div><span class="badge">${esc(state.mission[0])}</span><div class="big" style="margin-top:26px">${esc(state.mission[1])}</div></div><button class="secondary-button" type="button" data-action="reroll">다른 미션 뽑기</button></aside><form class="form-card" id="mission-form"><div class="field"><label for="answer">나의 답변</label><textarea id="answer" required minlength="10" maxlength="2000" placeholder="책을 읽고 떠오른 생각을 자유롭게 적어보세요. (10자 이상)"></textarea></div><p class="notice">답변은 10자 이상 써 주세요. 하루에 최대 5권까지 기록할 수 있어요. 답변을 저장하면 독서 기록이 Supabase에 저장되고 스티커 1개를 받아요.</p><button class="primary-button" type="submit">결과를 Supabase에 저장하고 스티커 받기</button></form></section>`, 'record'); }
function recordModal() {
  const r = state.selectedRecord;
  const editing = r && state.editingId === r.id;
  const editForm = editing ? `<form class="edit-form" id="edit-form" data-record-id="${esc(r.id)}"><div class="field-row"><div class="field"><label for="edit-date">읽은 날짜</label><input id="edit-date" type="date" required value="${esc(String(r.read_date || r.date).slice(0, 10))}" /></div><div class="field"><label>내 별점</label><div class="rating">${[1, 2, 3, 4, 5].map(n => `<button type="button" class="star ${n <= state.rating ? 'active' : ''}" data-rating="${n}">★</button>`).join('')}</div></div></div><div class="field"><label for="edit-answer">내 답변</label><textarea id="edit-answer" required minlength="10" maxlength="2000">${esc(r.answer)}</textarea></div><div class="button-row"><button class="primary-button" type="submit">저장하기</button><button class="secondary-button" type="button" data-action="cancel-edit">취소</button></div></form>` : '';
  const modal = r ? `<div class="record-modal-backdrop" data-action="close-record"><section class="record-modal" role="dialog" aria-modal="true" aria-label="독서 기록 상세"><button class="modal-close" data-action="close-record" aria-label="닫기">×</button><div class="modal-book-head">${bookVisual(r)}<div><h2>${esc(r.title)}</h2><span class="record-meta">${esc(r.author)} · 📅 ${esc(r.read_date || r.date)}</span></div></div><div class="record-reward-grid"><div class="record-info-box"><span>내 별점</span><strong class="record-rating">${stars(r.rating)} <small>(${r.rating}점)</small></strong></div><div class="record-info-box sticker-box"><span>스티커 획득</span><strong>완료 ⭐ (+1)</strong></div></div><article class="record-mission-card"><div class="record-mission-head"><span class="badge">${esc(r.mission_category || '랜덤 미션')}</span><span>랜덤 미션</span></div><h3>${esc(r.mission)}</h3>${editing ? editForm : `<div class="record-answer"><span>내 답변</span><p>${esc(r.answer)}</p></div>`}</article>${feedbackBox(r)}<div class="modal-actions"><span>${editing ? '' : `<button class="edit-record-button" data-action="edit-record" data-record-id="${esc(r.id)}">✏️ 기록 수정</button>`}<button class="delete-record-button" data-action="delete-record" data-record-id="${esc(r.id)}">🗑 기록 삭제</button></span><button class="primary-button" data-action="close-record">닫기</button></div></section></div>` : '';
  return modal;
}
function history() {
  const rows = data.records;
  const cards = rows.map(r => `<button class="record-card" data-action="open-record" data-record-id="${esc(r.id)}"><span class="record-card-top">${bookVisual(r)}<span><strong>${esc(r.title)}</strong><span class="record-meta">${esc(r.author)} · 📅 ${esc(r.read_date || r.date)}</span></span></span><span class="record-open">${stampBadge(r)}자세히 보기</span></button>`).join('');
  return layout(`<section class="page-title"><div><p class="eyebrow">SAVED HISTORY</p><h1>저장 내역</h1><p class="subtitle">책을 누르면 미션과 나의 답변을 자세히 볼 수 있어요.</p></div><button class="secondary-button" data-action="refresh">새로고침</button></section><section class="panel">${rows.length ? `<div class="record-list record-card-list">${cards}</div>` : '<div class="empty">아직 저장된 독서 기록이 없어요. 첫 책을 기록해 보세요!</div>'}</section>${recordModal()}`, 'history');
}
function growth() {
  const lv = level();
  const currentIndex = LEVELS.indexOf(lv);
  const roadmap = LEVELS.map((item, index) => {
    const stateName = index === currentIndex ? 'current' : index < currentIndex ? 'completed' : 'locked';
    const label = index === currentIndex ? '현재 레벨' : index < currentIndex ? '달성 완료' : '잠김 🔒';
    const detail = index === currentIndex && nextLevel()[0] > item[0]
      ? `다음 레벨까지 ${nextLevel()[0] - data.records.length}권`
      : `${item[0]}권 이상 필요`;
    return `<article class="roadmap-card ${stateName}"><div class="roadmap-icon">${levelIcon(item)}</div><div class="roadmap-copy"><strong>LV.${index} ${item[1]}</strong><span>${detail}</span></div><em>${label}</em></article>`;
  }).join('');
  return layout(`<section class="page-title"><div><p class="eyebrow">MY READING GROWTH</p><h1>성장 현황</h1><p class="subtitle">읽은 책과 미션 기록이 나의 성장으로 이어져요.</p></div></section><section class="panel"><div class="level-row"><div class="level-icon">${levelIcon(lv)}</div><div class="level-copy"><div class="level-title">LV.${currentIndex} ${lv[1]}</div><p class="subtitle" style="margin:6px 0">총 ${data.records.length}권 · 스티커 ${stickerCount()}개 (사용 가능 ${stickersAvailable()}개)</p></div></div></section><section class="roadmap-section"><div class="roadmap-heading"><div><p class="eyebrow">LEVEL ROADMAP</p><h2>나의 성장 레벨 로드맵</h2><p class="subtitle">독서 권수가 쌓일 때마다 나의 성장 레벨과 업적이 한 단계 높아져요!</p></div><span class="roadmap-total">현재 ${data.records.length}권</span></div><div class="roadmap-grid">${roadmap}</div></section>`, 'growth'); }
function success() { return layout(`<section class="success"><div class="sticker-pop">⭐</div><p class="eyebrow">MISSION COMPLETE</p><h2>독서 기록이 저장됐어요!</h2><p class="subtitle">스티커 1개를 받았어요.<br>다음 책도 기록해 볼까요?</p><div class="button-row" style="justify-content:center"><button class="primary-button" data-view="record">다음 책 기록하기</button><button class="secondary-button" data-view="room">스티커로 방 꾸미기</button><button class="secondary-button" data-view="history">저장 내역 보기</button></div></section>`, 'home'); }
function levelGiftNote(item) {
  const gifts = (data.room?.items || []).filter(gift => gift.reward_level === LEVELS.indexOf(item));
  return gifts.length ? `<p class="level-gift">🎁 새 선물 도착! ${gifts.map(gift => `${esc(gift.name)}`).join(', ')} — <button class="text-button" data-view="room">내 방에서 놓아 보기</button></p>` : '';
}
function levelUp() { const gained = state.levelUp || level(); const next = LEVELS.find(item => item[0] > data.records.length); const confetti = Array.from({ length: 28 }, (_, index) => `<i class="confetti-piece piece-${index % 7}" style="--delay:${(index % 7) * 0.08}s;--x:${(index * 37) % 94}%"></i>`).join(''); return layout(`<section class="level-up-card"><div class="confetti" aria-hidden="true">${confetti}</div><div class="level-up-icon">${levelIcon(gained)}</div><p class="eyebrow">LEVEL UP!</p><h1>축하해요!</h1><h2>LV.${LEVELS.indexOf(gained)} ${esc(gained[1])} 달성</h2><p class="subtitle">책 ${data.records.length}권을 읽고 미션을 완성했어요.<br>나의 독서 실력이 한 단계 자랐습니다.</p>${levelGiftNote(gained)}<div class="level-up-progress"><span>${next ? `다음 레벨까지 ${next[0] - data.records.length}권` : '최고 레벨 달성!'}</span></div><div class="button-row" style="justify-content:center"><button class="primary-button" data-view="growth">성장 현황 보기</button><button class="secondary-button" data-view="record">다음 책 기록하기</button></div></section>`, 'growth'); }
function render() { document.querySelector('#app').innerHTML = data.nickname ? (state.view === 'home' ? home() : state.view === 'record' ? (state.mission ? missionView() : recordForm()) : state.view === 'history' ? history() : state.view === 'growth' ? growth() : state.view === 'success' ? success() : state.view === 'levelup' ? levelUp() : state.view === 'room' ? roomView() : state.view === 'shelf' ? shelf() : home()) : auth(); }
function startMission(form) {
  if (!form.reportValidity()) return;
  const dup = findDuplicateRecord(form.querySelector('#title').value);
  if (dup && !window.confirm(`"${dup.title}" 책은 ${String(dup.read_date || dup.date).slice(0, 10)}에 이미 기록했어요.\n같은 책을 또 기록할까요?`)) return;
  state.pendingBook = {
    title: form.querySelector('#title').value.trim(),
    author: form.querySelector('#author').value.trim(),
    date: form.querySelector('#date').value,
    rating: state.rating,
    cover_image: state.selectedBookInfo?.image || ''
  };
  state.mission = pickMission();
  render();
}

document.addEventListener('click', async e => {
  const view = e.target.closest('[data-view]')?.dataset.view;
  if (view) { state.view = view; state.pendingBook = null; state.mission = null; state.selectedRecord = null; if (view === 'record') { state.rating = 0; state.bookQuery = ''; state.bookAuthor = ''; state.selectedBookInfo = null; state.bookDescriptionExpanded = false; state.bookResults = []; state.bookSearchError = ''; } render(); if (view === 'home') loadHomeRecommendations(); return; }
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'search-books') { const query = document.querySelector('#title').value.trim(); if (query.length < 2) { state.bookSearchError = '두 글자 이상 책 제목을 입력해 주세요.'; render(); return; } state.bookQuery = query; try { await searchNaverBooks(query); } catch (error) { state.bookSearchError = error.message || '도서를 검색하지 못했어요.'; } finally { state.bookSearching = false; render(); } return; }
  if (action === 'select-book') { const index = Number(e.target.closest('[data-book-index]')?.dataset.bookIndex); const book = state.bookResults[index]; if (book) { state.bookQuery = book.title; state.bookAuthor = book.author; state.selectedBookInfo = book; state.bookDescriptionExpanded = false; state.bookResults = []; state.bookSearchError = ''; render(); } return; }
  if (action === 'toggle-book-description') { state.bookDescriptionExpanded = !state.bookDescriptionExpanded; render(); if (state.bookDescriptionExpanded) requestAnimationFrame(() => document.querySelector('.selected-book-preview')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })); return; }
  if (action === 'open-record') { const id = e.target.closest('[data-record-id]')?.dataset.recordId; state.editingId = null; state.selectedRecord = data.records.find(record => String(record.id) === String(id)) || null; render(); markFeedbackSeen(state.selectedRecord); return; }
  if (action === 'cal-prev') { state.calOffset = (state.calOffset || 0) - 1; render(); return; }
  if (action === 'cal-next') { state.calOffset = Math.min(0, (state.calOffset || 0) + 1); render(); return; }
  if (action === 'close-record') { if (e.target.classList.contains('record-modal-backdrop') || e.target.closest('button[data-action="close-record"]')) { state.selectedRecord = null; state.editingId = null; render(); } return; }
  if (action === 'edit-record') { const record = state.selectedRecord; if (record) { state.editingId = record.id; state.rating = Number(record.rating) || 0; render(); } return; }
  if (action === 'cancel-edit') { state.editingId = null; render(); return; }
  if (action === 'delete-record') { const id = e.target.closest('[data-record-id]')?.dataset.recordId; try { await deleteRecord(id); render(); } catch (error) { alert(error.message || '기록을 삭제하지 못했어요.'); } return; }
  if (action === 'login' || action === 'signup') { state.authMode = action; state.error = ''; render(); }
  if (action === 'next-mission') { startMission(document.querySelector('#book-form')); return; }
  if (action === 'reroll') { state.mission = pickMission(); render(); }
  if (action === 'refresh') { try { await loadRecords(); render(); } catch { state.error = '저장 내역을 불러오지 못했어요.'; render(); } }
  if (action === 'logout') { if (sb) await sb.auth.signOut(); data = { nickname: '', records: [] }; state.view = 'home'; render(); }
});
document.addEventListener('click', e => { const star = e.target.closest('[data-rating]'); if (!star) return; state.rating = Number(star.dataset.rating); document.querySelectorAll('.star').forEach((el, i) => el.classList.toggle('active', i < state.rating)); });
document.addEventListener('submit', async e => {
  e.preventDefault();
  if (e.target.id === 'auth-form') {
    state.error = '';
    if (!supabaseReady) { state.error = 'supabase-config.js에 Supabase URL과 anon key를 먼저 입력해 주세요.'; render(); return; }
    const nickname = document.querySelector('#nickname').value.trim(); const password = document.querySelector('#password').value;
    const typedCode = document.querySelector('#class-code')?.value.trim() || '';
    try { if (typedCode) localStorage.setItem('bookstep-class-code', typedCode.toUpperCase()); } catch {}
    const email = loginEmail(nickname, typedCode);
    try {
      if (state.authMode === 'signup') {
        if (!state.school) { state.error = '학교를 먼저 찾아서 선택해 주세요.'; render(); return; }
        const classCode = document.querySelector('#class-code').value.trim();
        await registerStudent(nickname, password, classCode, { school: state.school, grade: Number(state.grade), classNo: Number(state.classNo) });
        const { data: result, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await loadProfile(result.user); state.view = 'home'; render(); return;
      }
      const { data: result, error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error; await loadProfile(result.user); state.view = 'home'; render();
    } catch (err) { state.error = err.message || '로그인에 실패했어요.'; render(); }
  }
  if (e.target.id === 'book-form') startMission(e.target);
  if (e.target.id === 'edit-form') {
    const id = e.target.dataset.recordId;
    const answer = document.querySelector('#edit-answer').value.trim();
    const original = data.records.find(record => String(record.id) === String(id));
    if (answer !== String(original?.answer || '').trim() && answer.length < 10) { alert('답변을 10자 이상 써 주세요.'); return; }
    if (!answer) return;
    try {
      await updateRecord(id, { answer, read_date: document.querySelector('#edit-date').value, rating: state.rating });
      state.selectedRecord = data.records.find(record => String(record.id) === String(id)) || null;
      state.editingId = null; render();
    } catch (err) { alert(err.message || '기록을 수정하지 못했어요.'); }
  }
  if (e.target.id === 'mission-form') {
    const answer = document.querySelector('#answer').value.trim(); if (answer.length < 10) { alert('답변을 10자 이상 써 주세요.'); return; }
    const record = { ...state.pendingBook, category: state.mission[0], mission: state.mission[1], answer };
    try {
      const before = data.records.length;
      await saveToSupabase(record);
      const beforeLevel = levelForCount(before);
      const afterLevel = level();
      state.levelUp = LEVELS.indexOf(afterLevel) > LEVELS.indexOf(beforeLevel) ? afterLevel : null;
      state.view = state.levelUp ? 'levelup' : 'success';
      state.pendingBook = null; state.mission = null; render();
    } catch (err) { state.error = err.message || '저장하지 못했어요.'; alert(state.error); }
  }
});

(async function init() {
  if (supabaseReady) { const { data: session } = await sb.auth.getSession(); if (session.session) { try { await loadProfile(session.session.user); } catch { /* 로그인 화면에서 재시도 */ } } }
  render();
  if (data.nickname) loadHomeRecommendations();
})();

// 회원가입: 학교 찾기, 학년/반 선택
document.addEventListener('click', e => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'search-school') searchSchools();
  if (action === 'select-school') { state.school = state.schoolResults[Number(e.target.closest('[data-school-index]').dataset.schoolIndex)]; state.grade = ''; state.classNo = ''; render(); }
  if (action === 'clear-school') { state.school = null; state.grade = ''; state.classNo = ''; render(); }
});
document.addEventListener('keydown', e => {
  if (e.target.id === 'school-query' && e.key === 'Enter') { e.preventDefault(); searchSchools(); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'nickname') state.draft.nickname = e.target.value;
  if (e.target.id === 'password') state.draft.password = e.target.value;
  if (e.target.id === 'class-code') state.draft.classCode = e.target.value;
  if (e.target.id === 'school-query') state.schoolQuery = e.target.value;
});
document.addEventListener('change', e => {
  if (e.target.id === 'grade') state.grade = e.target.value;
  if (e.target.id === 'class-no') state.classNo = e.target.value;
});

// 독서 달력 · 주 단위 연속 기록 · 선생님 칭찬
function localDateString(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function parseLocalDate(text) { const [y, m, d] = String(text).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); }
function weekStartString(date) { const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return localDateString(d); }
function readingDays() { return new Set(data.records.map(r => String(r.read_date || r.date || '').slice(0, 10)).filter(Boolean)); }
function weeklyStreak() {
  const weeks = new Set([...readingDays()].map(day => weekStartString(parseLocalDate(day))));
  const cursor = parseLocalDate(weekStartString(new Date()));
  const shift = () => cursor.setDate(cursor.getDate() - 7);
  const key = () => localDateString(cursor);
  const thisWeekDone = weeks.has(key());
  if (!thisWeekDone) shift();
  let count = 0;
  while (weeks.has(key())) { count += 1; shift(); }
  return { count, thisWeekDone };
}
function calendarPanel() {
  const offset = state.calOffset || 0;
  const base = new Date();
  const first = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const year = first.getFullYear(), month = first.getMonth();
  const days = readingDays();
  const titlesByDay = {};
  data.records.forEach(r => { const day = String(r.read_date || r.date || '').slice(0, 10); (titlesByDay[day] = titlesByDay[day] || []).push(r.title); });
  const todayText = localDateString(new Date());
  const lastDate = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(first.getDay()).fill('<span class="cal-cell empty"></span>')];
  let monthDays = 0;
  for (let d = 1; d <= lastDate; d++) {
    const text = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const done = days.has(text);
    if (done) monthDays += 1;
    cells.push(`<span class="cal-cell${done ? ' done' : ''}${text === todayText ? ' today' : ''}" ${done ? `title="${esc(titlesByDay[text].join(', '))}"` : ''}>${done ? '📖' : d}</span>`);
  }
  const { count, thisWeekDone } = weeklyStreak();
  const streakText = count ? `🔥 ${count}주 연속 독서 중!` : '🌱 이번 주에 첫 책을 기록해 보세요';
  const streakNote = count && !thisWeekDone ? '이번 주에 한 권 더 기록하면 연속 기록이 이어져요.' : count ? '이번 주도 기록 완료! 멋져요.' : '일주일에 한 권만 읽어도 연속 기록이 쌓여요.';
  return `<section class="panel calendar-panel"><div class="calendar-head"><div><p class="eyebrow">READING CALENDAR</p><h2>${year}년 ${month + 1}월 독서 달력</h2></div><div class="calendar-nav"><button class="ghost-button" data-action="cal-prev" aria-label="이전 달">‹</button><button class="ghost-button" data-action="cal-next" aria-label="다음 달" ${offset >= 0 ? 'disabled' : ''}>›</button></div></div><div class="calendar-body"><div class="calendar-side"><div class="streak-box"><strong>${streakText}</strong><span>${streakNote}</span></div><p class="subtitle cal-foot">이 달에 책을 읽은 날 ${monthDays}일</p></div><div class="cal-grid">${['일', '월', '화', '수', '목', '금', '토'].map(w => `<span class="cal-week">${w}</span>`).join('')}${cells.join('')}</div></div></section>`;
}
function unseenFeedbackCount() { return data.records.filter(r => data.feedback?.[r.id] && !data.feedback[r.id].seen_at).length; }
function feedbackBanner() { const n = unseenFeedbackCount(); return n ? `<section class="feedback-banner"><span aria-hidden="true">💌</span><div><strong>선생님이 칭찬을 ${n}개 남겼어요!</strong><small>저장 내역에서 확인해 보세요.</small></div><button class="primary-button" data-view="history">보러 가기</button></section>` : ''; }
function stampBadge(r) { const fb = data.feedback?.[r.id]; return fb ? `<span class="stamp-badge${fb.seen_at ? '' : ' new'}">${esc(fb.stamp)}${fb.seen_at ? '' : ' NEW'}</span>` : ''; }
function feedbackBox(r) { const fb = data.feedback?.[r.id]; return fb ? `<div class="teacher-feedback-box"><span class="stamp-big">${esc(fb.stamp)}</span><div><b>선생님 한마디</b><p>${esc(fb.comment || '참 잘했어요!')}</p></div></div>` : ''; }
async function markFeedbackSeen(record) {
  const fb = record && data.feedback?.[record.id];
  if (!fb || fb.seen_at || !sb) return;
  fb.seen_at = new Date().toISOString();
  try { await sb.rpc('mark_feedback_seen', { p_record_id: record.id }); } catch { fb.seen_at = null; }
}

// 학급 챌린지 · 학년 랭킹 · 보너스 스티커
async function loadCommunity() {
  data.challenges = []; data.ranking = []; data.bonus = 0;
  if (!sb) return;
  const [challenges, ranking, bonus] = await Promise.all([
    sb.rpc('challenge_status'), sb.rpc('grade_ranking'), sb.rpc('my_bonus_stickers')
  ]);
  if (!challenges.error) data.challenges = challenges.data || [];
  if (!ranking.error) data.ranking = ranking.data || [];
  if (!bonus.error) data.bonus = Number(bonus.data) || 0;
}
const stampBonus = () => Math.floor(Object.keys(data.feedback || {}).length / 3);
function stickerCount() { return data.records.length + (data.bonus || 0) + stampBonus(); }
function shortDate(text) { const [, m, d] = String(text).slice(0, 10).split('-'); return `${Number(m)}/${Number(d)}`; }
function challengeCard(item) {
  const target = Number(item.target_books), progress = Number(item.progress), mine = Number(item.my_count);
  const pct = Math.min(100, Math.round((progress / target) * 100));
  const today = localDateString(new Date());
  const ended = item.ends_on < today;
  const daysLeft = Math.round((parseLocalDate(item.ends_on) - parseLocalDate(today)) / 86400000);
  let status;
  if (item.achieved && mine >= 1) status = `<span class="challenge-done">🎉 달성! 보너스 스티커 +${item.bonus_stickers}</span>`;
  else if (item.achieved) status = '<span class="challenge-done">🎉 우리 반 달성! 한 권 이상 읽으면 보너스 스티커를 받아요.</span>';
  else if (ended) status = '<span class="challenge-miss">아쉽게 끝났어요. 다음에 또 도전해요!</span>';
  else status = `<span>${daysLeft === 0 ? '오늘 마감' : `D-${daysLeft}`} · 내가 읽은 책 ${mine}권 · 달성하면 ⭐+${item.bonus_stickers}</span>`;
  return `<div class="challenge-item"><div class="challenge-top"><strong>${esc(item.title)}</strong><small>${shortDate(item.starts_on)} ~ ${shortDate(item.ends_on)}</small></div><div class="progress"><span style="width:${pct}%"></span></div><div class="progress-note"><span>우리 반 ${progress} / ${target}권 (${pct}%)</span></div><div class="challenge-status">${status}</div></div>`;
}
function communityPanel() {
  const today = localDateString(new Date());
  const visible = (data.challenges || []).filter(c => c.ends_on >= today || c.achieved).slice(0, 3);
  const challenges = visible.length ? visible.map(challengeCard).join('') : '<div class="empty">진행 중인 학급 챌린지가 없어요. 선생님이 만들면 여기에 보여요.</div>';
  const medals = ['🥇', '🥈', '🥉'];
  const rows = (data.ranking || []).map(row => `<li class="${row.is_me ? 'me' : ''}"><span class="rank-no">${row.rank ? (medals[row.rank - 1] || `${row.rank}위`) : '-'}</span><span class="rank-name">${esc(row.nickname)}${row.is_me ? ' (나)' : ''}</span><b>${row.books}권</b></li>`).join('');
  const me = (data.ranking || []).find(row => row.is_me);
  const meNote = me && !me.rank ? '<p class="subtitle rank-note">이번 달 첫 책을 기록하면 순위에 올라가요!</p>' : '';
  const ranking = rows ? `<ol class="rank-list">${rows}</ol>${meNote}` : '<div class="empty">학급에 가입하면 같은 학년 친구들과 함께 볼 수 있어요.</div>';
  return `<section class="community-grid"><section class="panel"><p class="eyebrow">CLASS CHALLENGE</p><h2>우리 반 챌린지</h2>${challenges}</section><section class="panel"><p class="eyebrow">THIS MONTH</p><h2>우리 학년 독서왕 TOP 5</h2><p class="subtitle">이번 달에 읽은 책 권수예요.</p>${ranking}</section></section>`;
}

// 내 방 꾸미기: 스티커로 아이템을 사서 방에 자유롭게 놓아요. (supabase-room.sql)
const ROOM_TABS = [['furniture', '🛋️ 가구·소품'], ['pet', '🐾 펫'], ['wallpaper', '🎨 벽지'], ['floor', '🟫 바닥']];
const ROOM_CATEGORIES = [['furniture', '가구'], ['seat', '의자·쿠션'], ['lamp', '조명'], ['wall', '벽 장식'], ['decor', '인테리어'], ['tech', '전자기기'], ['stationery', '문구·소품']];
const ROOM_SETS = [[0, '기본 세트'], [1, '첫걸음 세트'], [3, '새싹 세트'], [6, '모험 세트']];
const ROOM_MAX_OBJECTS = 30;
state.roomTab = 'furniture';
state.roomCat = null;
state.roomMode = 'mine';
state.friends = null;
state.selectedObj = null;
let roomBusy = false;
let roomDrag = null;

async function loadRoom() {
  data.room = { ready: false, items: [], owned: [], placed: {}, objects: [] };
  if (!sb) return;
  const [items, owned, placed, objects] = await Promise.all([
    sb.from('room_items').select('*').order('price').order('id'),
    sb.from('user_items').select('item_id'),
    sb.from('user_room').select('slot,item_id'),
    sb.from('room_objects').select('id,item_id,x,y,scale,flip,z').order('z')
  ]);
  if (items.error || owned.error || placed.error || objects.error) return;
  data.room = {
    ready: true, items: items.data || [], owned: (owned.data || []).map(row => row.item_id),
    placed: Object.fromEntries((placed.data || []).map(row => [row.slot, row.item_id])),
    objects: (objects.data || []).map(o => ({ ...o, x: Number(o.x), y: Number(o.y), scale: Number(o.scale) }))
  };
  if (!data.room.objects.some(o => o.id === state.selectedObj)) state.selectedObj = null;
}
async function loadFriends() {
  state.friends = { loading: true, rows: [] };
  const { data: rows, error } = await sb.rpc('classmate_rooms');
  state.friends = { loading: false, error: Boolean(error), rows: rows || [] };
}
const roomItemById = id => data.room?.items.find(item => item.id === id);
const roomItemLevel = item => item.reward_level ?? item.unlock_level;
const roomIsDefault = item => item.price === 0 && item.reward_level == null;
const roomOwned = item => roomIsDefault(item) || (item.reward_level != null && LEVELS.indexOf(level()) >= item.reward_level) || Boolean(data.room?.owned.includes(item.id));
const roomSpent = () => (data.room?.owned || []).reduce((sum, id) => sum + (roomItemById(id)?.price || 0), 0);
function stickersAvailable() { return Math.max(0, stickerCount() - roomSpent()); }
const roomDefault = slot => data.room?.items.find(item => item.slot === slot && roomIsDefault(item));
const roomPlaced = (slot, placedMap = data.room?.placed) => roomItemById(placedMap?.[slot]) || roomDefault(slot);
const roomVisual = item => item.img ? `<img src="${esc(item.img)}" alt="" loading="lazy" draggable="false" />` : item.color ? `<span class="room-swatch" style="background:${esc(item.color)}"></span>` : esc(item.emoji);
const roomSetFor = lv => ROOM_SETS.reduce((found, set) => lv >= set[0] ? set : found, ROOM_SETS[0]);
const placedCount = item => data.room.objects.filter(o => o.item_id === item.id).length;
const clampNum = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function objectHtml(obj, readonly) {
  const item = roomItemById(obj.item_id);
  if (!item?.img) return '';
  const selected = !readonly && state.selectedObj === obj.id;
  const handles = readonly ? '' : ['nw', 'ne', 'sw', 'se'].map(corner => `<i class="obj-handle h-${corner}" data-handle="${corner}"></i>`).join('');
  return `<div class="room-obj${selected ? ' selected' : ''}${readonly ? ' readonly' : ''}" data-oid="${esc(obj.id || '')}" style="left:${obj.x}%;top:${obj.y}%;width:${item.base_w * obj.scale}%;z-index:${10 + Number(obj.z || 0)}"><img src="${esc(item.img)}" alt="${esc(item.name)}" draggable="false" style="transform:scaleX(${obj.flip ? -1 : 1})" />${handles}</div>`;
}
function roomScene(placedMap = data.room.placed, objects = data.room.objects, readonly = false) {
  const wall = roomPlaced('wallpaper', placedMap), floor = roomPlaced('floor', placedMap);
  const style = `--wall:${esc(wall?.color || '#fff4dc')};--floor:${esc(floor?.color || '#e8c9a0')}`;
  const objs = [...objects].sort((a, b) => a.z - b.z).map(obj => objectHtml(obj, readonly)).join('');
  const hint = !readonly && !objects.length ? '<p class="room-empty-hint">아래에서 아이템을 눌러 방에 놓아 보세요!</p>' : '';
  return `<div class="room${readonly ? ' room-mini' : ''}" ${readonly ? '' : 'id="room-stage"'} style="${style}"><div class="room-wall"></div><div class="room-floor"></div>${objs}${hint}</div>`;
}
function objectBar() {
  const obj = data.room.objects.find(o => o.id === state.selectedObj);
  const count = `<small class="obj-count">방에 놓은 아이템 ${data.room.objects.length}/${ROOM_MAX_OBJECTS}</small>`;
  if (!obj) return `<div class="obj-bar" id="obj-bar"><span class="obj-hint">아이템을 눌러 선택하고, 끌어서 옮기고, 모서리를 끌어 크기를 바꿔요.</span>${count}</div>`;
  const item = roomItemById(obj.item_id);
  return `<div class="obj-bar active" id="obj-bar"><strong>${esc(item?.name || '')}</strong><button class="secondary-button" data-action="flip-obj">↔ 반전</button><button class="secondary-button" data-action="front-obj">⬆ 앞으로</button><button class="secondary-button danger" data-action="remove-obj">🗑 빼기</button>${count}</div>`;
}
function roomItemCard(item) {
  const lv = LEVELS.indexOf(level());
  const isObject = item.slot === 'object';
  const placed = !isObject && (data.room.placed[item.slot] === item.id || (!data.room.placed[item.slot] && roomIsDefault(item)));
  const n = isObject ? placedCount(item) : 0;
  let action;
  if (placed) action = `<button class="secondary-button" data-action="clear-slot" data-slot="${esc(item.slot)}"${roomIsDefault(item) ? ' disabled' : ''}>${roomIsDefault(item) ? '사용 중' : '빼기'}</button>`;
  else if (roomOwned(item)) action = isObject ? `<button class="primary-button" data-action="add-object" data-item-id="${esc(item.id)}">놓기</button>` : `<button class="primary-button" data-action="place-item" data-item-id="${esc(item.id)}">놓기</button>`;
  else if (item.reward_level != null) action = `<button class="secondary-button" disabled>🎁 LV.${item.reward_level} 선물</button>`;
  else if (lv < item.unlock_level) action = `<button class="secondary-button" disabled>🔒 LV.${item.unlock_level}</button>`;
  else if (stickersAvailable() < item.price) action = `<button class="secondary-button" disabled>⭐ ${item.price} (${item.price - stickersAvailable()}개 부족)</button>`;
  else action = `<button class="primary-button" data-action="buy-item" data-item-id="${esc(item.id)}">⭐ ${item.price} 사기</button>`;
  const locked = !placed && !roomOwned(item) && lv < roomItemLevel(item);
  const note = n ? `<small class="shop-slot">${n}개 놓임</small>` : roomIsDefault(item) && isObject ? '<small class="shop-slot">무료</small>' : '';
  return `<article class="shop-item${placed || n ? ' placed' : ''}${locked ? ' locked' : ''}"><div class="shop-icon">${roomVisual(item)}</div><strong>${esc(item.name)}</strong>${note}${action}</article>`;
}
function roomGifts(lv) {
  const gifts = data.room.items.filter(item => item.reward_level != null).sort((a, b) => a.reward_level - b.reward_level);
  if (!gifts.length) return '';
  const cards = gifts.map(item => {
    if (lv < item.reward_level) return `<div class="gift-card locked"><span class="gift-icon">?</span><b>Lv.${item.reward_level}</b></div>`;
    const isObject = item.slot === 'object';
    const placed = !isObject && data.room.placed[item.slot] === item.id;
    const action = isObject ? 'add-object' : placed ? 'clear-slot' : 'place-item';
    const label = isObject ? '놓기' : placed ? '빼기' : '놓기';
    return `<button class="gift-card${placed || (isObject && placedCount(item)) ? ' placed' : ''}" data-action="${action}" data-item-id="${esc(item.id)}" data-slot="${esc(item.slot)}" title="${esc(item.name)}"><span class="gift-icon">${roomVisual(item)}</span><b>${esc(item.name)}</b><small>${label}</small></button>`;
  }).join('');
  return `<section class="panel gift-panel"><div class="gift-head"><strong>🎁 레벨 선물</strong><small>레벨이 오를 때마다 새 선물이 와요</small></div><div class="gift-row">${cards}</div></section>`;
}
function friendsPanel() {
  if (!state.friends || state.friends.loading) return '<section class="panel"><div class="empty">친구들의 방을 불러오는 중이에요…</div></section>';
  if (state.friends.error) return '<section class="panel"><div class="empty">친구 방을 불러오지 못했어요. (supabase-room.sql을 다시 실행해야 해요)</div></section>';
  if (!state.friends.rows.length) return '<section class="panel"><div class="empty">같은 반 친구가 아직 없어요. 친구가 가입하면 여기에서 방을 구경할 수 있어요.</div></section>';
  return `<section class="friend-grid">${state.friends.rows.map(row => `<article class="friend-room"><strong>${esc(row.nickname)}의 방</strong>${roomScene(row.placed || {}, row.objects || [], true)}</article>`).join('')}</section>`;
}
function roomView() {
  const head = `<section class="page-title"><div><p class="eyebrow">MY ROOM</p><h1>내 방 꾸미기</h1><p class="subtitle">책을 읽고 받은 스티커로 방을 꾸며 보세요. 책 1권을 기록하면 스티커 1개를 받아요.</p></div><span class="sticker-wallet">⭐ 사용 가능 ${data.room?.ready ? stickersAvailable() : 0}개</span></section>`;
  if (!data.room?.ready) return layout(`${head}<section class="panel"><div class="empty">내 방을 불러오지 못했어요.<br>선생님께 문의해 주세요. (supabase-room.sql 실행 필요)</div></section>`, 'room');
  const modes = `<div class="room-modes"><button class="slot-tab${state.roomMode === 'mine' ? ' active' : ''}" data-action="room-mode" data-mode="mine">🏠 내 방</button><button class="slot-tab${state.roomMode === 'friends' ? ' active' : ''}" data-action="room-mode" data-mode="friends">👫 친구 방 구경</button></div>`;
  if (state.roomMode === 'friends') return layout(`${head}${modes}${friendsPanel()}`, 'room');
  const lv = LEVELS.indexOf(level());
  const tabs = ROOM_TABS.map(([key, label]) => `<button class="slot-tab${state.roomTab === key ? ' active' : ''}" data-action="room-tab" data-tab="${key}">${label}</button>`).join('');
  const isFurniture = state.roomTab === 'furniture';
  const filter = isFurniture ? `<div class="slot-filter"><button class="chip${state.roomCat ? '' : ' active'}" data-action="room-filter" data-cat="">전체</button>${ROOM_CATEGORIES.map(([key, label]) => `<button class="chip${state.roomCat === key ? ' active' : ''}" data-action="room-filter" data-cat="${key}">${label}</button>`).join('')}</div>` : '';
  const visible = data.room.items.filter(item => item.reward_level == null && (isFurniture ? item.slot === 'object' && item.category !== 'pet' && (!state.roomCat || item.category === state.roomCat) : state.roomTab === 'pet' ? item.category === 'pet' : item.slot === state.roomTab));
  const sets = ROOM_SETS.map(([min, name], index) => {
    const next = ROOM_SETS[index + 1]?.[0] ?? Infinity;
    const group = visible.filter(item => item.unlock_level >= min && item.unlock_level < next);
    if (!group.length) return '';
    const lock = lv < min ? `<span class="set-lock">🔒 Lv.${min} 달성 시 열려요</span>` : '';
    return `<div class="shop-set"><h3>${name} <small>${group.length}종</small>${lock}</h3><div class="shop-grid">${group.map(roomItemCard).join('')}</div></div>`;
  }).join('');
  const empty = state.roomTab === 'pet' ? '펫은 곧 만나요! 🐾' : '아직 준비된 아이템이 없어요.';
  return layout(`${head}${modes}${roomScene()}${objectBar()}<p class="subtitle room-hint">선생님 도장 3개마다 스티커 1개를 더 받아요. (지금 도장 ${Object.keys(data.feedback || {}).length}개)</p>${roomGifts(lv)}<section class="panel shop-panel"><div class="slot-tabs">${tabs}</div>${filter}${sets || `<div class="empty">${empty}</div>`}</section>`, 'room');
}

// 방 안에서 아이템 끌기 · 모서리로 크기 조절
function refreshObjectBar() { const bar = document.querySelector('#obj-bar'); if (bar) bar.outerHTML = objectBar(); }
function selectObject(id) {
  state.selectedObj = id;
  document.querySelectorAll('.room-obj').forEach(el => el.classList.toggle('selected', el.dataset.oid === id));
  refreshObjectBar();
}
async function saveObject(obj) {
  try { const { error } = await sb.rpc('update_object', { p_id: obj.id, p_x: obj.x, p_y: obj.y, p_scale: obj.scale, p_flip: obj.flip }); if (error) throw error; }
  catch (error) { alert(error.message || '저장하지 못했어요. 다시 시도해 주세요.'); await loadRoom().catch(() => {}); render(); }
}
document.addEventListener('pointerdown', e => {
  const stage = e.target.closest('#room-stage');
  if (!stage) return;
  const el = e.target.closest('.room-obj');
  if (!el) { if (state.selectedObj) selectObject(null); return; }
  const obj = data.room.objects.find(o => o.id === el.dataset.oid);
  if (!obj) return;
  e.preventDefault();
  selectObject(obj.id);
  const rect = stage.getBoundingClientRect();
  const handle = e.target.closest('[data-handle]');
  const cx = rect.left + rect.width * obj.x / 100, cy = rect.top + rect.height * obj.y / 100;
  roomDrag = { obj, el, rect, mode: handle ? 'scale' : 'move', startX: e.clientX, startY: e.clientY, x0: obj.x, y0: obj.y, scale0: obj.scale, dist0: Math.max(10, Math.hypot(e.clientX - cx, e.clientY - cy)), cx, cy, moved: false, id: e.pointerId };
  try { el.setPointerCapture(e.pointerId); } catch {}
});
document.addEventListener('pointermove', e => {
  const d = roomDrag;
  if (!d || e.pointerId !== d.id) return;
  const item = roomItemById(d.obj.item_id);
  if (d.mode === 'move') {
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < 3) return;
    d.moved = true;
    d.obj.x = clampNum(d.x0 + dx / d.rect.width * 100, 0, 100);
    d.obj.y = clampNum(d.y0 + dy / d.rect.height * 100, 0, 100);
    d.el.style.left = d.obj.x + '%'; d.el.style.top = d.obj.y + '%';
  } else {
    d.moved = true;
    d.obj.scale = clampNum(d.scale0 * Math.hypot(e.clientX - d.cx, e.clientY - d.cy) / d.dist0, 0.4, 2.5);
    d.el.style.width = item.base_w * d.obj.scale + '%';
  }
});
async function endDrag(e) {
  const d = roomDrag;
  if (!d || e.pointerId !== d.id) return;
  roomDrag = null;
  if (d.moved) await saveObject(d.obj);
}
document.addEventListener('pointerup', endDrag);
document.addEventListener('pointercancel', endDrag);

document.addEventListener('click', async e => {
  const el = e.target.closest('[data-action]');
  const action = el?.dataset.action;
  if (!['room-tab', 'room-filter', 'buy-item', 'place-item', 'clear-slot', 'room-mode', 'add-object', 'flip-obj', 'front-obj', 'remove-obj'].includes(action)) return;
  if (action === 'room-tab') { state.roomTab = el.dataset.tab; state.roomCat = null; render(); return; }
  if (action === 'room-filter') { state.roomCat = el.dataset.cat || null; render(); return; }
  if (action === 'room-mode') {
    state.roomMode = el.dataset.mode;
    if (state.roomMode === 'friends' && sb) { state.friends = null; render(); await loadFriends(); }
    render(); return;
  }
  if (roomBusy || !sb) return;
  roomBusy = true;
  try {
    const obj = data.room.objects.find(o => o.id === state.selectedObj);
    if (action === 'flip-obj' && obj) {
      obj.flip = !obj.flip;
      const img = document.querySelector(`.room-obj[data-oid="${obj.id}"] img`);
      if (img) img.style.transform = `scaleX(${obj.flip ? -1 : 1})`;
      await saveObject(obj);
    } else if (action === 'front-obj' && obj) {
      const { error } = await sb.rpc('front_object', { p_id: obj.id }); if (error) throw error;
      await loadRoom();
    } else if (action === 'remove-obj' && obj) {
      const { error } = await sb.rpc('remove_object', { p_id: obj.id }); if (error) throw error;
      state.selectedObj = null; await loadRoom();
    } else if (action === 'buy-item' || action === 'add-object') {
      const id = el.dataset.itemId, item = roomItemById(id);
      if (action === 'buy-item') { const { error } = await sb.rpc('buy_item', { p_item_id: id }); if (error) throw error; }
      if (item.slot === 'object') {
        const wall = item.category === 'wall';
        const x = 50 + (Math.random() - .5) * 30, y = wall ? 22 + Math.random() * 10 : 68 + Math.random() * 10;
        const { data: newId, error } = await sb.rpc('add_object', { p_item_id: id, p_x: x, p_y: y }); if (error) throw error;
        await loadRoom(); state.selectedObj = newId;
      } else {
        const { error } = await sb.rpc('place_item', { p_item_id: id }); if (error) throw error;
        await loadRoom();
      }
    } else if (action === 'place-item') {
      const { error } = await sb.rpc('place_item', { p_item_id: el.dataset.itemId }); if (error) throw error;
      await loadRoom();
    } else if (action === 'clear-slot') {
      const { error } = await sb.rpc('clear_slot', { p_slot: el.dataset.slot }); if (error) throw error;
      await loadRoom();
    }
  } catch (error) { alert(error.message || '처리하지 못했어요. 잠시 후 다시 시도해 주세요.'); await loadRoom().catch(() => {}); }
  roomBusy = false;
  render();
});

// 내 책장: 읽은 책 표지 책장 + 읽고 싶은 책 담기
Object.assign(state, { shelfQuery: '', shelfResults: [], shelfSearching: false, shelfNote: '', shelfPage: 0, shelfDir: '', wishExpanded: false });
const SHELF_PER_ROW = 5;
const SHELF_ROWS_PER_PAGE = 2;
const WISH_PREVIEW = 5;
const WISHLIST_MAX = 50;
data.wishlist = []; data.wishlistReady = false;
async function loadWishlist() {
  if (!sb) return;
  const { data: rows, error } = await sb.from('wishlist_books').select('id,title,author,publisher,cover_image,description,created_at').order('created_at', { ascending: false });
  data.wishlistReady = !error;
  data.wishlist = error ? [] : (rows || []);
}
async function removeWishlistByTitle(title) {
  if (!sb || !data.wishlistReady) return;
  const ids = (data.wishlist || []).filter(item => normalizeTitle(item.title) === normalizeTitle(title)).map(item => item.id);
  if (ids.length) await sb.from('wishlist_books').delete().in('id', ids);
}
const bookColor = title => { let h = 0; for (const ch of String(title)) h = (h * 31 + ch.charCodeAt(0)) % 360; return `hsl(${h} 60% 84%)`; };
function shelfBook(record) {
  const cover = record.cover_image ? `<img src="${esc(record.cover_image)}" alt="${esc(record.title)} 표지" loading="lazy" />` : `<span class="shelf-book-title">${esc(record.title)}</span>`;
  return `<button type="button" class="shelf-book${record.cover_image ? '' : ' no-cover'}" style="--spine:${bookColor(record.title)}" data-action="open-record" data-record-id="${esc(record.id)}" title="${esc(record.title)}" aria-label="${esc(record.title)} 기록 보기">${cover}</button>`;
}
function wishPanel() {
  if (!data.wishlistReady) return '<section class="panel"><p class="eyebrow">WISH LIST</p><h2>읽고 싶은 책</h2><div class="empty">읽고 싶은 책 기능을 준비하는 중이에요. 선생님께 문의해 주세요.</div></section>';
  const read = new Set(data.records.map(record => normalizeTitle(record.title)));
  const results = state.shelfSearching ? '<div class="book-search-note">책을 찾고 있어요…</div>'
    : state.shelfResults.length ? `<div class="book-search-results">${state.shelfResults.map((book, index) => `<div class="book-result wish-result">${book.image ? `<img src="${esc(book.image)}" alt="" />` : '<span class="book-result-placeholder">📚</span>'}<span><strong>${esc(book.title)}</strong><small>${esc(book.author || '저자 정보 없음')}${read.has(normalizeTitle(book.title)) ? ' · ✅ 이미 읽은 책' : ''}</small></span>${data.wishlist.some(item => normalizeTitle(item.title) === normalizeTitle(book.title)) ? '<span class="wish-added">✓ 담음</span>' : `<button type="button" class="secondary-button wish-add" data-action="wish-add" data-result-index="${index}">♡ 담기</button>`}</div>`).join('')}</div>`
    : '';
  const note = state.shelfNote ? `<div class="book-search-note">${esc(state.shelfNote)}</div>` : '';
  const shownWish = state.wishExpanded ? data.wishlist : data.wishlist.slice(0, WISH_PREVIEW);
  const moreWish = data.wishlist.length > WISH_PREVIEW ? `<button type="button" class="ghost-button wish-more" data-action="wish-toggle">${state.wishExpanded ? '접기 ▲' : `전체 보기 (${data.wishlist.length}권) ▼`}</button>` : '';
  const list = data.wishlist.length ? shownWish.map(item => `<div class="wish-item">${bookVisual(item)}<div class="wish-copy"><strong>${esc(item.title)}</strong><small>${esc(item.author || '저자 정보 없음')}</small></div><div class="wish-actions"><button type="button" class="primary-button" data-action="wish-record" data-wish-id="${esc(item.id)}">📖 읽었어요!</button><button type="button" class="ghost-button" data-action="wish-remove" data-wish-id="${esc(item.id)}" aria-label="${esc(item.title)} 빼기">빼기</button></div></div>`).join('') : '<div class="empty">아직 담은 책이 없어요. 위에서 읽고 싶은 책을 찾아 담아 보세요!</div>';
  return `<section class="panel"><p class="eyebrow">WISH LIST</p><h2>읽고 싶은 책 (${data.wishlist.length}권)</h2><p class="subtitle">읽고 싶은 책을 담아 두었다가, 다 읽으면 바로 기록해 보세요.</p><div class="book-search-input"><input id="shelf-query" value="${esc(state.shelfQuery)}" placeholder="책 제목으로 찾기" autocomplete="off" /><button class="secondary-button" type="button" data-action="shelf-search">🔎 책 검색</button></div>${results}${note}<div class="wish-list">${list}</div>${moreWish}</section>`;
}
function shelf() {
  const books = data.records;
  const perPage = SHELF_PER_ROW * SHELF_ROWS_PER_PAGE;
  const pages = Math.max(1, Math.ceil(books.length / perPage));
  state.shelfPage = Math.min(Math.max(0, state.shelfPage), pages - 1);
  const pageBooks = books.slice(state.shelfPage * perPage, (state.shelfPage + 1) * perPage);
  const rows = [];
  for (let i = 0; i < pageBooks.length; i += SHELF_PER_ROW) rows.push(pageBooks.slice(i, i + SHELF_PER_ROW));
  const shelves = rows.length ? rows.map(row => `<div class="shelf-row">${row.map(shelfBook).join('')}</div>`).join('') : '<div class="empty">아직 책장이 비어 있어요.<br>책을 기록하면 표지가 책장에 꽂혀요!</div>';
  const pager = pages > 1 ? `<div class="shelf-pager"><button type="button" class="ghost-button" data-action="shelf-prev" aria-label="이전 책장" ${state.shelfPage === 0 ? 'disabled' : ''}>‹</button><span class="shelf-dots" role="status" aria-label="${state.shelfPage + 1}쪽 / 전체 ${pages}쪽">${Array.from({ length: pages }, (_, i) => `<i class="${i === state.shelfPage ? 'on' : ''}"></i>`).join('')}<b>${state.shelfPage + 1} / ${pages}</b></span><button type="button" class="ghost-button" data-action="shelf-next" aria-label="다음 책장" ${state.shelfPage >= pages - 1 ? 'disabled' : ''}>›</button></div>` : '';
  const dir = state.shelfDir; state.shelfDir = '';
  return layout(`<section class="page-title"><div><p class="eyebrow">MY BOOKSHELF</p><h1>내 책장</h1><p class="subtitle">내가 읽은 책 ${books.length}권이 책장에 꽂혀 있어요. 책을 누르면 내 기록을 볼 수 있어요.${pages > 1 ? '<br>옆으로 밀거나 화살표를 눌러 다음 책장을 볼 수 있어요.' : ''}</p></div></section><section class="panel bookshelf"><div class="shelf-pages ${dir}">${shelves}</div>${pager}</section>${wishPanel()}${recordModal()}`, 'shelf');
}
async function searchShelfBooks() {
  const query = document.querySelector('#shelf-query')?.value.trim() ?? state.shelfQuery;
  state.shelfQuery = query; state.shelfNote = '';
  if (query.length < 2) { state.shelfResults = []; state.shelfNote = '두 글자 이상 책 제목을 입력해 주세요.'; render(); return; }
  state.shelfSearching = true; state.shelfResults = []; render();
  try {
    state.shelfResults = await fetchBooks(query);
    if (!state.shelfResults.length) state.shelfNote = '검색 결과가 없어요. 다른 검색어를 입력해 보세요.';
  } catch (error) { state.shelfNote = error.message || '도서를 검색하지 못했어요.'; }
  state.shelfSearching = false; render();
}
async function addWish(book) {
  if (data.wishlist.length >= WISHLIST_MAX) { state.shelfNote = `읽고 싶은 책은 ${WISHLIST_MAX}권까지 담을 수 있어요.`; return; }
  if (data.wishlist.some(item => normalizeTitle(item.title) === normalizeTitle(book.title))) { state.shelfNote = '이미 담은 책이에요.'; return; }
  const { data: userData } = await sb.auth.getUser();
  const { error } = await sb.from('wishlist_books').insert({
    user_id: userData.user.id, title: book.title, author: book.author || null, publisher: book.publisher || null,
    cover_image: book.image || null, description: (book.description || '').slice(0, 500) || null
  });
  if (error) { state.shelfNote = error.code === '23505' ? '이미 담은 책이에요.' : (error.message || '책을 담지 못했어요.'); return; }
  state.shelfNote = `"${book.title}" 책을 담았어요!`;
  await loadWishlist();
}
document.addEventListener('click', async e => {
  const button = e.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'shelf-search') searchShelfBooks();
  if (action === 'shelf-prev' || action === 'shelf-next') turnShelfPage(action === 'shelf-next' ? 1 : -1);
  if (action === 'wish-toggle') { state.wishExpanded = !state.wishExpanded; const y = window.scrollY; render(); window.scrollTo(0, y); }
  if (action === 'wish-add') {
    const book = state.shelfResults[Number(button.dataset.resultIndex)];
    if (!book) return;
    button.disabled = true;
    try { await addWish(book); } catch (error) { state.shelfNote = error.message || '책을 담지 못했어요.'; }
    render();
  }
  if (action === 'wish-remove') {
    const item = data.wishlist.find(row => row.id === button.dataset.wishId);
    if (!item || !window.confirm(`"${item.title}" 책을 읽고 싶은 책에서 뺄까요?`)) return;
    const { error } = await sb.from('wishlist_books').delete().eq('id', item.id);
    if (error) { alert(error.message || '책을 빼지 못했어요.'); return; }
    state.shelfNote = ''; await loadWishlist(); render();
  }
  if (action === 'wish-record') {
    const item = data.wishlist.find(row => row.id === button.dataset.wishId);
    if (!item) return;
    Object.assign(state, { view: 'record', pendingBook: null, mission: null, selectedRecord: null, rating: 0, bookQuery: item.title, bookAuthor: item.author || '', selectedBookInfo: { title: item.title, author: item.author || '', publisher: item.publisher || '', image: item.cover_image || '', description: item.description || '' }, bookDescriptionExpanded: false, bookResults: [], bookSearchError: '' });
    render(); window.scrollTo(0, 0);
  }
});
document.addEventListener('keydown', e => { if (e.target.id === 'shelf-query' && e.key === 'Enter') { e.preventDefault(); searchShelfBooks(); } });
document.addEventListener('input', e => { if (e.target.id === 'shelf-query') state.shelfQuery = e.target.value; });

function turnShelfPage(step) {
  const pages = Math.max(1, Math.ceil(data.records.length / (SHELF_PER_ROW * SHELF_ROWS_PER_PAGE)));
  const next = Math.min(Math.max(0, state.shelfPage + step), pages - 1);
  if (next === state.shelfPage) return;
  state.shelfPage = next; state.shelfDir = step > 0 ? 'from-right' : 'from-left';
  const y = window.scrollY; render(); window.scrollTo(0, y);
}
// 책장을 손가락으로 옆으로 밀어 넘기기
let shelfTouch = null;
document.addEventListener('touchstart', e => { shelfTouch = e.target.closest('.bookshelf') && !state.selectedRecord ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null; }, { passive: true });
document.addEventListener('touchend', e => {
  if (!shelfTouch) return;
  const dx = e.changedTouches[0].clientX - shelfTouch.x, dy = e.changedTouches[0].clientY - shelfTouch.y;
  shelfTouch = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) turnShelfPage(dx < 0 ? 1 : -1);
});
document.addEventListener('keydown', e => {
  if (state.view !== 'shelf' || state.selectedRecord || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (e.key === 'ArrowRight') turnShelfPage(1);
  if (e.key === 'ArrowLeft') turnShelfPage(-1);
});
