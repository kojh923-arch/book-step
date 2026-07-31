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
  [0, '독서 준비생', '🌱'], [5, '책 첫걸음', '🌿'], [10, '책 새싹', '🌿'], [20, '독서 탐험가', '🌳'],
  [40, '열정 독서가', '🌳'], [60, '이야기 수집가', '🌲'], [80, '독서 여행자', '🌲'], [100, '책의 친구', '🌲'],
  [130, '지식 탐험가', '📚'], [160, '독서 고수', '📖'], [200, '책 마스터', '🏆']
];
const localKey = 'read-step-local-v2';
const cfg = window.SUPABASE_CONFIG || {};
const supabaseReady = Boolean(cfg.url && cfg.anonKey && window.supabase);
const sb = supabaseReady ? window.supabase.createClient(cfg.url, cfg.anonKey) : null;
const STUDENT_SIGNUP_FUNCTION = 'quick-responder';
const BOOK_SEARCH_FUNCTION = 'kakao-book-search';
const state = { view: 'home', authMode: 'login', pendingBook: null, mission: null, rating: 0, selectedRecord: null, error: '', levelUp: null, bookQuery: '', bookAuthor: '', selectedBookInfo: null, bookDescriptionExpanded: false, bookResults: [], bookSearchError: '', bookSearching: false };
let data = { nickname: '', records: [] };

const esc = (v = '') => String(v).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const bookVisual = (record, className = 'record-book-icon') => record.cover_image ? `<span class="${className} record-book-cover"><img src="${esc(record.cover_image)}" alt="${esc(record.title)} 표지" /></span>` : `<span class="${className}">📕</span>`;
const stars = n => '★'.repeat(Number(n || 0)) + '☆'.repeat(5 - Number(n || 0));
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const loginEmail = nickname => {
  const encoded = btoa(unescape(encodeURIComponent(nickname.trim()))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `student-${encoded}@bookstep.local`;
};
const levelForCount = count => LEVELS.reduce((r, x) => count >= x[0] ? x : r, LEVELS[0]);
const level = () => levelForCount(data.records.length);
const nextLevel = () => LEVELS.find(x => x[0] > data.records.length) || LEVELS.at(-1);
const monthCount = () => { const m = new Date().toISOString().slice(0, 7); return data.records.filter(r => String(r.read_date || r.date).startsWith(m)).length; };
const pickMission = () => MISSIONS[Math.floor(Math.random() * MISSIONS.length)];
function localLoad() { try { return JSON.parse(localStorage.getItem(localKey) || 'null'); } catch { return null; } }
function localSave() { localStorage.setItem(localKey, JSON.stringify(data)); }

async function loadRecords() {
  if (!sb) return;
  const { data: rows, error } = await sb.from('reading_records').select('*').order('read_date', { ascending: false }).order('created_at', { ascending: false });
  if (error) throw error;
  data.records = rows || [];
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
async function searchNaverBooks(query) {
  if (!sb) throw new Error('Supabase 연결 설정을 먼저 확인해 주세요.');
  state.bookSearching = true;
  state.bookSearchError = '';
  state.selectedBookInfo = null;
  state.bookDescriptionExpanded = false;
  state.bookResults = [];
  render();
  const { data: result, error } = await sb.functions.invoke(BOOK_SEARCH_FUNCTION, { body: { query } });
  if (error) throw new Error(error.message || '도서를 검색하지 못했어요.');
  state.bookResults = result?.items || [];
  if (!state.bookResults.length) state.bookSearchError = '검색 결과가 없어요. 다른 검색어를 입력해 보세요.';
}
async function registerStudent(nickname, password, classCode) {
  const response = await fetch(`${cfg.url}/functions/v1/${STUDENT_SIGNUP_FUNCTION}`, {
    method: 'POST',
    headers: { apikey: cfg.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, password, classCode })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || '회원가입에 실패했어요.');
}

function layout(content, active = 'home') { return `<div class="shell"><div class="container"><header class="topbar"><div class="brand"><span class="brand-mark"><img src="assets/dokseo-hangeoreum-logo.png" alt="독서한걸음 로고" /></span><div>독서한걸음<small>${esc(data.nickname)}님의 독서 기록</small></div></div><div class="topbar-actions"><button class="ghost-button" data-action="logout">로그아웃</button></div></header><nav class="nav-tabs"><button class="${active === 'home' ? 'active' : ''}" data-view="home">홈</button><button class="${active === 'record' ? 'active' : ''}" data-view="record">독서 기록</button><button class="${active === 'history' ? 'active' : ''}" data-view="history">저장 내역</button><button class="${active === 'growth' ? 'active' : ''}" data-view="growth">성장 현황</button></nav>${content}</div></div>`; }
function home() { const lv = level(), next = nextLevel(); const pct = next[0] === lv[0] ? 100 : Math.min(100, ((data.records.length - lv[0]) / (next[0] - lv[0])) * 100); return layout(`<section class="hero"><div class="hero-copy"><p class="eyebrow">오늘도 독서 한 걸음</p><h1>읽은 책이<br>나의 성장으로 이어져요.</h1><p class="subtitle">책을 기록하고 랜덤 미션을 수행하면<br>나만의 독서 기록이 차곡차곡 쌓여요.</p><div class="button-row"><button class="primary-button" data-view="record">독서한걸음 기록하기</button><button class="secondary-button" data-view="history">저장 내역 보기</button></div></div><div class="hero-visual"><div class="growth-tree">${lv[2]}</div></div></section><section class="stats"><div class="stat"><div class="stat-label">이번 달 읽은 권 수</div><div class="stat-value">${monthCount()}권</div><div class="stat-note">꾸준히 기록하고 있어요</div></div><div class="stat"><div class="stat-label">총 읽은 책</div><div class="stat-value">${data.records.length}권</div><div class="stat-note">다음 목표 ${next[0]}권</div></div><div class="stat"><div class="stat-label">받은 스티커</div><div class="stat-value">${data.records.length}개 ⭐</div><div class="stat-note">미션 완료 보상</div></div><div class="stat"><div class="stat-label">현재 업적</div><div class="stat-value">LV.${LEVELS.indexOf(lv)}</div><div class="stat-note">${lv[1]}</div></div></section><section class="panel"><div class="level-row"><div class="level-icon">${lv[2]}</div><div class="level-copy"><div class="level-title">LV.${LEVELS.indexOf(lv)} ${lv[1]}</div><div class="progress"><span style="width:${pct}%"></span></div><div class="progress-note"><span>${data.records.length}권 읽음</span><span>${next[0] === lv[0] ? '최고 레벨!' : `다음 레벨까지 ${next[0] - data.records.length}권`}</span></div></div></div></section>`, 'home'); }
function auth() { return `<div class="auth-wrap"><div class="auth-card"><div class="brand"><span class="brand-mark"><img src="assets/dokseo-hangeoreum-logo.png" alt="독서한걸음 로고" /></span><div>독서한걸음<small>읽고 기록하고 성장해요</small></div></div><p class="eyebrow">MY READING SPACE</p><h1>${state.authMode === 'signup' ? '나만의 독서 기록을 시작해요' : '독서한걸음 불러오기'}</h1><p class="subtitle">닉네임과 비밀번호만으로, 어디서든 같은 기록을 이어갈 수 있어요.</p><div class="auth-toggle"><button class="${state.authMode === 'login' ? 'active' : ''}" data-action="login">로그인</button><button class="${state.authMode === 'signup' ? 'active' : ''}" data-action="signup">회원가입</button></div><form id="auth-form"><div class="field"><label for="nickname">닉네임</label><input id="nickname" required minlength="2" maxlength="16" placeholder="예: 책을 좋아하는 지현" /></div><div class="field"><label for="password">비밀번호</label><input id="password" type="password" required minlength="6" placeholder="6자 이상 입력" /></div>${state.authMode === 'signup' ? '<div class="field"><label for="class-code">학급코드</label><input id="class-code" required maxlength="30" placeholder="선생님에게 받은 학급코드" /></div>' : ''}<div id="auth-error" class="error" role="alert">${esc(state.error)}</div><button class="primary-button" style="width:100%" type="submit">${state.authMode === 'signup' ? '회원가입하고 시작하기' : '독서한걸음 불러오기'}</button></form><p class="notice">닉네임과 비밀번호를 잊지 않도록 꼭 기억해 주세요.</p></div></div>`; }
function recordForm() {
  const results = state.bookSearching ? '<div class="book-search-note">도서를 찾고 있어요…</div>' : state.bookResults.length ? `<div class="book-search-results">${state.bookResults.map((book, index) => `<button type="button" class="book-result" data-action="select-book" data-book-index="${index}">${book.image ? `<img src="${esc(book.image)}" alt="" />` : '<span class="book-result-placeholder">📚</span>'}<span><strong>${esc(book.title)}</strong><small>${esc(book.author || '저자 정보 없음')} · ${esc(book.publisher || '출판사 정보 없음')}</small></span><b>선택</b></button>`).join('')}</div>` : state.bookSearchError ? `<div class="book-search-note error">${esc(state.bookSearchError)}</div>` : '';
  const selected = state.selectedBookInfo;
  const description = selected?.description || '이 책은 카카오 책 검색에서 선택한 도서예요. 책을 읽고 나만의 생각을 기록해 보세요.';
  const hasMoreDescription = description.length > 130;
  const preview = selected ? `<article class="selected-book-preview ${state.bookDescriptionExpanded ? 'expanded' : ''}"><div class="selected-book-cover">${selected.image ? `<img src="${esc(selected.image)}" alt="${esc(selected.title)} 표지" />` : '📚'}</div><div class="selected-book-copy"><span>선택한 책</span><h2>${esc(selected.title)}</h2><small>${esc(selected.author || '저자 정보 없음')} · ${esc(selected.publisher || '출판사 정보 없음')}</small><p>${esc(description)}</p>${hasMoreDescription ? `<button class="book-description-toggle" type="button" data-action="toggle-book-description" aria-expanded="${state.bookDescriptionExpanded}">${state.bookDescriptionExpanded ? '책 소개 접기 ▲' : '책 소개 더보기 ▼'}</button>` : ''}</div></article>` : '';
  return layout(`<section class="page-title"><div><p class="eyebrow">BOOK RECORD</p><h1>읽은 책을 기록해요.</h1><p class="subtitle">책을 검색해 간편하게 기록하거나 직접 입력할 수 있어요.</p></div></section><form class="form-card" id="book-form"><div class="form-grid"><div class="field full"><label for="title">책 제목</label><div class="book-search-input"><input id="title" required value="${esc(state.bookQuery)}" placeholder="예: 마당을 나온 암탉" /><button class="secondary-button" type="button" data-action="search-books">🔎 책 검색</button></div>${results}${preview}</div><div class="field"><label for="author">저자</label><input id="author" required value="${esc(state.bookAuthor)}" placeholder="예: 황선미" /></div><div class="field"><label for="date">읽은 날짜</label><input id="date" type="date" value="${today()}" required /></div><div class="field full"><label>내 별점</label><div class="rating">${[1,2,3,4,5].map(n => `<button type="button" class="star ${n <= state.rating ? 'active' : ''}" data-rating="${n}">★</button>`).join('')}</div></div></div><div class="button-row"><button class="primary-button" type="button" data-action="next-mission">다음: 랜덤 미션 보기 →</button><button class="secondary-button" type="button" data-view="home">취소</button></div></form>`, 'record');
}
function missionView() { return layout(`<section class="page-title"><div><p class="eyebrow">TODAY'S RANDOM MISSION</p><h1>책을 읽고, 생각을 남겨요.</h1><p class="subtitle"><strong>${esc(state.pendingBook.title)}</strong>을(를) 읽고 다음 질문에 답해 보세요.</p></div></section><section class="mission-layout"><aside class="mission-quote"><div><span class="badge">${esc(state.mission[0])}</span><div class="big" style="margin-top:26px">${esc(state.mission[1])}</div></div><button class="secondary-button" type="button" data-action="reroll">다른 미션 뽑기</button></aside><form class="form-card" id="mission-form"><div class="field"><label for="answer">나의 답변</label><textarea id="answer" required placeholder="책을 읽고 떠오른 생각을 자유롭게 적어보세요."></textarea></div><p class="notice">답변을 저장하면 독서 기록이 Supabase에 저장되고 스티커 1개를 받아요.</p><button class="primary-button" type="submit">결과를 Supabase에 저장하고 스티커 받기</button></form></section>`, 'record'); }
function history() {
  const rows = data.records;
  const cards = rows.map(r => `<button class="record-card" data-action="open-record" data-record-id="${esc(r.id)}"><span class="record-card-top">${bookVisual(r)}<span><strong>${esc(r.title)}</strong><span class="record-meta">${esc(r.author)} · 📅 ${esc(r.read_date || r.date)}</span></span></span><span class="record-open">자세히 보기</span></button>`).join('');
  const r = state.selectedRecord;
  const modal = r ? `<div class="record-modal-backdrop" data-action="close-record"><section class="record-modal" role="dialog" aria-modal="true" aria-label="독서 기록 상세"><button class="modal-close" data-action="close-record" aria-label="닫기">×</button><div class="modal-book-head">${bookVisual(r)}<div><h2>${esc(r.title)}</h2><span class="record-meta">${esc(r.author)} · 📅 ${esc(r.read_date || r.date)}</span></div></div><div class="record-reward-grid"><div class="record-info-box"><span>내 별점</span><strong class="record-rating">${stars(r.rating)} <small>(${r.rating}점)</small></strong></div><div class="record-info-box sticker-box"><span>스티커 획득</span><strong>완료 ⭐ (+1)</strong></div></div><article class="record-mission-card"><div class="record-mission-head"><span class="badge">${esc(r.mission_category || '랜덤 미션')}</span><span>랜덤 미션</span></div><h3>${esc(r.mission)}</h3><div class="record-answer"><span>내 답변</span><p>${esc(r.answer)}</p></div></article><div class="modal-actions"><button class="delete-record-button" data-action="delete-record" data-record-id="${esc(r.id)}">🗑 기록 삭제</button><button class="primary-button" data-action="close-record">닫기</button></div></section></div>` : '';
  return layout(`<section class="page-title"><div><p class="eyebrow">SAVED HISTORY</p><h1>저장 내역</h1><p class="subtitle">책을 누르면 미션과 나의 답변을 자세히 볼 수 있어요.</p></div><button class="secondary-button" data-action="refresh">새로고침</button></section><section class="panel">${rows.length ? `<div class="record-list record-card-list">${cards}</div>` : '<div class="empty">아직 저장된 독서 기록이 없어요. 첫 책을 기록해 보세요!</div>'}</section>${modal}`, 'history');
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
    return `<article class="roadmap-card ${stateName}"><div class="roadmap-icon">${item[2]}</div><div class="roadmap-copy"><strong>LV.${index} ${item[1]}</strong><span>${detail}</span></div><em>${label}</em></article>`;
  }).join('');
  return layout(`<section class="page-title"><div><p class="eyebrow">MY READING GROWTH</p><h1>성장 현황</h1><p class="subtitle">읽은 책과 미션 기록이 나의 성장으로 이어져요.</p></div></section><section class="panel"><div class="level-row"><div class="level-icon">${lv[2]}</div><div class="level-copy"><div class="level-title">LV.${currentIndex} ${lv[1]}</div><p class="subtitle" style="margin:6px 0">총 ${data.records.length}권 · 스티커 ${data.records.length}개</p></div></div></section><section class="roadmap-section"><div class="roadmap-heading"><div><p class="eyebrow">LEVEL ROADMAP</p><h2>나의 성장 레벨 로드맵</h2><p class="subtitle">독서 권수가 쌓일 때마다 나의 성장 레벨과 업적이 한 단계 높아져요!</p></div><span class="roadmap-total">현재 ${data.records.length}권</span></div><div class="roadmap-grid">${roadmap}</div></section>`, 'growth'); }
function success() { return layout(`<section class="success"><div class="sticker-pop">⭐</div><p class="eyebrow">MISSION COMPLETE</p><h2>독서 기록이 저장됐어요!</h2><p class="subtitle">스티커 1개를 받았어요.<br>다음 책도 기록해 볼까요?</p><div class="button-row" style="justify-content:center"><button class="primary-button" data-view="record">다음 책 기록하기</button><button class="secondary-button" data-view="history">저장 내역 보기</button></div></section>`, 'home'); }
function levelUp() { const gained = state.levelUp || level(); const next = LEVELS.find(item => item[0] > data.records.length); const confetti = Array.from({ length: 28 }, (_, index) => `<i class="confetti-piece piece-${index % 7}" style="--delay:${(index % 7) * 0.08}s;--x:${(index * 37) % 94}%"></i>`).join(''); return layout(`<section class="level-up-card"><div class="confetti" aria-hidden="true">${confetti}</div><div class="level-up-icon">${gained[2]}</div><p class="eyebrow">LEVEL UP!</p><h1>축하해요!</h1><h2>LV.${LEVELS.indexOf(gained)} ${esc(gained[1])} 달성</h2><p class="subtitle">책 ${data.records.length}권을 읽고 미션을 완성했어요.<br>나의 독서 나무가 한 단계 자랐습니다.</p><div class="level-up-progress"><span>${next ? `다음 레벨까지 ${next[0] - data.records.length}권` : '최고 레벨 달성!'}</span></div><div class="button-row" style="justify-content:center"><button class="primary-button" data-view="growth">성장 현황 보기</button><button class="secondary-button" data-view="record">다음 책 기록하기</button></div></section>`, 'growth'); }
function render() { document.querySelector('#app').innerHTML = data.nickname ? (state.view === 'home' ? home() : state.view === 'record' ? (state.mission ? missionView() : recordForm()) : state.view === 'history' ? history() : state.view === 'growth' ? growth() : state.view === 'success' ? success() : state.view === 'levelup' ? levelUp() : home()) : auth(); }
function startMission(form) {
  if (!form.reportValidity()) return;
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
  if (view) { state.view = view; state.pendingBook = null; state.mission = null; state.selectedRecord = null; if (view === 'record') { state.rating = 0; state.bookQuery = ''; state.bookAuthor = ''; state.selectedBookInfo = null; state.bookDescriptionExpanded = false; state.bookResults = []; state.bookSearchError = ''; } render(); return; }
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'search-books') { const query = document.querySelector('#title').value.trim(); if (query.length < 2) { state.bookSearchError = '두 글자 이상 책 제목을 입력해 주세요.'; render(); return; } state.bookQuery = query; try { await searchNaverBooks(query); } catch (error) { state.bookSearchError = error.message || '도서를 검색하지 못했어요.'; } finally { state.bookSearching = false; render(); } return; }
  if (action === 'select-book') { const index = Number(e.target.closest('[data-book-index]')?.dataset.bookIndex); const book = state.bookResults[index]; if (book) { state.bookQuery = book.title; state.bookAuthor = book.author; state.selectedBookInfo = book; state.bookDescriptionExpanded = false; state.bookResults = []; state.bookSearchError = ''; render(); } return; }
  if (action === 'toggle-book-description') { state.bookDescriptionExpanded = !state.bookDescriptionExpanded; render(); if (state.bookDescriptionExpanded) requestAnimationFrame(() => document.querySelector('.selected-book-preview')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })); return; }
  if (action === 'open-record') { const id = e.target.closest('[data-record-id]')?.dataset.recordId; state.selectedRecord = data.records.find(record => String(record.id) === String(id)) || null; render(); return; }
  if (action === 'close-record') { if (e.target === e.currentTarget || e.target.closest('[data-action="close-record"]')) { state.selectedRecord = null; render(); } return; }
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
    const email = loginEmail(nickname);
    try {
      if (state.authMode === 'signup') {
        const classCode = document.querySelector('#class-code').value.trim();
        await registerStudent(nickname, password, classCode);
        const { data: result, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await loadProfile(result.user); state.view = 'home'; render(); return;
      }
      const { data: result, error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error; await loadProfile(result.user); state.view = 'home'; render();
    } catch (err) { state.error = err.message || '로그인에 실패했어요.'; render(); }
  }
  if (e.target.id === 'book-form') startMission(e.target);
  if (e.target.id === 'mission-form') {
    const answer = document.querySelector('#answer').value.trim(); if (!answer) return;
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
})();
