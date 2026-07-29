const MISSIONS = [
  ['감정과 공감', '주인공의 기분은 어땠을까요?'], ['감정과 공감', '주인공에게 해주고 싶은 말은 무엇인가요?'],
  ['등장인물', '가장 기억에 남는 인물은 누구인가요?'], ['등장인물', '내가 주인공이라면 어떻게 했을까요?'],
  ['장면과 문장', '가장 기억에 남는 장면을 적어보세요.'], ['장면과 문장', '기억에 남는 문장을 소개해 보세요.'],
  ['추천과 생각', '친구에게 이 책을 추천하고 싶은 이유는 무엇인가요?'], ['추천과 생각', '이 책에서 새롭게 알게 된 점은 무엇인가요?'],
  ['상상과 이어쓰기', '결말을 바꾼다면 어떻게 바꾸고 싶나요?'], ['상상과 이어쓰기', '다음 이야기를 상상해 보세요.']
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
const state = { view: 'home', authMode: 'login', pendingBook: null, mission: null, rating: 0, selectedRecord: null, error: '' };
let data = { nickname: '', records: [] };

const esc = (v = '') => String(v).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const stars = n => '★'.repeat(Number(n || 0)) + '☆'.repeat(5 - Number(n || 0));
const level = () => LEVELS.reduce((r, x) => data.records.length >= x[0] ? x : r, LEVELS[0]);
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
    rating: record.rating, mission_category: record.category, mission: record.mission, answer: record.answer
  });
  if (error) throw error;
  await loadRecords();
}

function layout(content, active = 'home') { return `<div class="shell"><div class="container"><header class="topbar"><div class="brand"><span class="brand-mark">📚</span><div>독서한걸음<small>${esc(data.nickname)}님의 독서 기록</small></div></div><div class="topbar-actions"><button class="ghost-button" data-action="logout">로그아웃</button></div></header><nav class="nav-tabs"><button class="${active === 'home' ? 'active' : ''}" data-view="home">홈</button><button class="${active === 'record' ? 'active' : ''}" data-view="record">독서 기록</button><button class="${active === 'history' ? 'active' : ''}" data-view="history">저장 내역</button><button class="${active === 'growth' ? 'active' : ''}" data-view="growth">성장 현황</button></nav>${content}</div></div>`; }
function home() { const lv = level(), next = nextLevel(); const pct = next[0] === lv[0] ? 100 : Math.min(100, ((data.records.length - lv[0]) / (next[0] - lv[0])) * 100); return layout(`<section class="hero"><div class="hero-copy"><p class="eyebrow">오늘도 독서 한 걸음</p><h1>읽은 책이<br>나의 성장으로 이어져요.</h1><p class="subtitle">책을 기록하고 랜덤 미션을 수행하면<br>나만의 독서 기록이 차곡차곡 쌓여요.</p><div class="button-row"><button class="primary-button" data-view="record">독서한걸음 기록하기</button><button class="secondary-button" data-view="history">저장 내역 보기</button></div></div><div class="hero-visual"><div class="growth-tree">${lv[2]}</div></div></section><section class="stats"><div class="stat"><div class="stat-label">이번 달 읽은 권 수</div><div class="stat-value">${monthCount()}권</div><div class="stat-note">꾸준히 기록하고 있어요</div></div><div class="stat"><div class="stat-label">총 읽은 책</div><div class="stat-value">${data.records.length}권</div><div class="stat-note">다음 목표 ${next[0]}권</div></div><div class="stat"><div class="stat-label">받은 스티커</div><div class="stat-value">${data.records.length}개 ⭐</div><div class="stat-note">미션 완료 보상</div></div><div class="stat"><div class="stat-label">현재 업적</div><div class="stat-value">LV.${LEVELS.indexOf(lv)}</div><div class="stat-note">${lv[1]}</div></div></section><section class="panel"><div class="level-row"><div class="level-icon">${lv[2]}</div><div class="level-copy"><div class="level-title">LV.${LEVELS.indexOf(lv)} ${lv[1]}</div><div class="progress"><span style="width:${pct}%"></span></div><div class="progress-note"><span>${data.records.length}권 읽음</span><span>${next[0] === lv[0] ? '최고 레벨!' : `다음 레벨까지 ${next[0] - data.records.length}권`}</span></div></div></div></section>`, 'home'); }
function auth() { return `<div class="auth-wrap"><div class="auth-card"><div class="brand"><span class="brand-mark">📚</span><div>독서한걸음<small>읽고 기록하고 성장해요</small></div></div><p class="eyebrow">MY READING SPACE</p><h1>${state.authMode === 'signup' ? '나만의 독서 기록을 시작해요' : '독서한걸음 불러오기'}</h1><p class="subtitle">어디서든 같은 계정으로 나의 독서 기록을 이어갈 수 있어요.</p><div class="auth-toggle"><button class="${state.authMode === 'login' ? 'active' : ''}" data-action="login">로그인</button><button class="${state.authMode === 'signup' ? 'active' : ''}" data-action="signup">회원가입</button></div><form id="auth-form">${state.authMode === 'signup' ? '<div class="field"><label for="nickname">닉네임</label><input id="nickname" required maxlength="16" placeholder="예: 책을 좋아하는 지현" /></div>' : ''}<div class="field"><label for="email">이메일</label><input id="email" type="email" required placeholder="name@example.com" /></div><div class="field"><label for="password">비밀번호</label><input id="password" type="password" required minlength="6" placeholder="6자 이상 입력" /></div><div id="auth-error" class="error" role="alert">${esc(state.error)}</div><button class="primary-button" style="width:100%" type="submit">${state.authMode === 'signup' ? '회원가입하고 시작하기' : '독서한걸음 불러오기'}</button></form>${!supabaseReady ? '<p class="notice">Supabase 설정 전에는 로그인 기능이 준비 화면으로 표시됩니다. supabase-config.js에 프로젝트 정보를 입력하세요.</p>' : ''}</div></div>`; }
function recordForm() { state.rating = 0; return layout(`<section class="page-title"><div><p class="eyebrow">BOOK RECORD</p><h1>읽은 책을 기록해요.</h1><p class="subtitle">책 정보를 입력하면 오늘의 랜덤 미션이 나와요.</p></div></section><form class="form-card" id="book-form"><div class="form-grid"><div class="field full"><label for="title">책 제목</label><input id="title" required placeholder="예: 마당을 나온 암탉" /></div><div class="field"><label for="author">저자</label><input id="author" required placeholder="예: 황선미" /></div><div class="field"><label for="date">읽은 날짜</label><input id="date" type="date" value="${new Date().toISOString().slice(0, 10)}" required /></div><div class="field full"><label>내 별점</label><div class="rating">${[1,2,3,4,5].map(n => `<button type="button" class="star" data-rating="${n}">★</button>`).join('')}</div></div></div><div class="button-row"><button class="primary-button" type="submit">다음: 랜덤 미션 보기 →</button><button class="secondary-button" type="button" data-view="home">취소</button></div></form>`, 'record'); }
function missionView() { return layout(`<section class="page-title"><div><p class="eyebrow">TODAY'S RANDOM MISSION</p><h1>책을 읽고, 생각을 남겨요.</h1><p class="subtitle"><strong>${esc(state.pendingBook.title)}</strong>을(를) 읽고 다음 질문에 답해 보세요.</p></div></section><section class="mission-layout"><aside class="mission-quote"><div><span class="badge">${esc(state.mission[0])}</span><div class="big" style="margin-top:26px">${esc(state.mission[1])}</div></div><button class="secondary-button" type="button" data-action="reroll">다른 미션 뽑기</button></aside><form class="form-card" id="mission-form"><div class="field"><label for="answer">나의 답변</label><textarea id="answer" required placeholder="책을 읽고 떠오른 생각을 자유롭게 적어보세요."></textarea></div><p class="notice">답변을 저장하면 독서 기록이 Supabase에 저장되고 스티커 1개를 받아요.</p><button class="primary-button" type="submit">결과를 Supabase에 저장하고 스티커 받기</button></form></section>`, 'record'); }
function history() { const rows = data.records; return layout(`<section class="page-title"><div><p class="eyebrow">SAVED HISTORY</p><h1>저장 내역</h1><p class="subtitle">내가 읽고 미션을 완료한 기록을 다시 확인해요.</p></div><button class="secondary-button" data-action="refresh">새로고침</button></section><section class="panel">${rows.length ? `<div class="record-list">${rows.map(r => `<details class="record-item"><summary><div><strong>${esc(r.title)}</strong><span class="record-meta">${esc(r.author)} · ${esc(r.read_date || r.date)}</span></div><span class="record-rating">${stars(r.rating)}</span></summary><div style="padding-top:14px;color:var(--muted);line-height:1.6;font-size:14px"><strong style="color:var(--ink)">${esc(r.mission)}</strong><br>${esc(r.answer)}</div></details>`).join('')}</div>` : '<div class="empty">아직 저장된 독서 기록이 없어요. 첫 책을 기록해 보세요!</div>'}</section>`, 'history'); }
function growth() { const lv = level(); return layout(`<section class="page-title"><div><p class="eyebrow">MY READING GROWTH</p><h1>성장 현황</h1><p class="subtitle">읽은 책과 미션 기록이 나의 성장으로 이어져요.</p></div></section><section class="panel"><div class="level-row"><div class="level-icon">${lv[2]}</div><div class="level-copy"><div class="level-title">LV.${LEVELS.indexOf(lv)} ${lv[1]}</div><p class="subtitle" style="margin:6px 0">총 ${data.records.length}권 · 스티커 ${data.records.length}개</p></div></div></section>`, 'growth'); }
function success() { return layout(`<section class="success"><div class="sticker-pop">⭐</div><p class="eyebrow">MISSION COMPLETE</p><h2>독서 기록이 저장됐어요!</h2><p class="subtitle">스티커 1개를 받았어요.<br>다음 책도 기록해 볼까요?</p><div class="button-row" style="justify-content:center"><button class="primary-button" data-view="record">다음 책 기록하기</button><button class="secondary-button" data-view="history">저장 내역 보기</button></div></section>`, 'home'); }
function render() { document.querySelector('#app').innerHTML = data.nickname ? (state.view === 'home' ? home() : state.view === 'record' ? (state.mission ? missionView() : recordForm()) : state.view === 'history' ? history() : state.view === 'growth' ? growth() : state.view === 'success' ? success() : home()) : auth(); }

document.addEventListener('click', async e => {
  const view = e.target.closest('[data-view]')?.dataset.view;
  if (view) { state.view = view; state.pendingBook = null; state.mission = null; render(); return; }
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'login' || action === 'signup') { state.authMode = action; state.error = ''; render(); }
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
    const email = document.querySelector('#email').value.trim(); const password = document.querySelector('#password').value;
    try {
      if (state.authMode === 'signup') {
        const nickname = document.querySelector('#nickname').value.trim(); const { error } = await sb.auth.signUp({ email, password, options: { data: { nickname } } }); if (error) throw error;
        state.error = '가입 완료! 이메일 인증이 필요하면 메일을 확인한 뒤 로그인해 주세요.'; state.authMode = 'login'; render(); return;
      }
      const { data: result, error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error; await loadProfile(result.user); state.view = 'home'; render();
    } catch (err) { state.error = err.message || '로그인에 실패했어요.'; render(); }
  }
  if (e.target.id === 'book-form') { const f = new FormData(e.target); state.pendingBook = { title: f.get('title').trim(), author: f.get('author').trim(), date: f.get('date'), rating: state.rating }; state.mission = pickMission(); render(); }
  if (e.target.id === 'mission-form') {
    const answer = document.querySelector('#answer').value.trim(); if (!answer) return;
    const record = { ...state.pendingBook, category: state.mission[0], mission: state.mission[1], answer };
    try { await saveToSupabase(record); state.view = 'success'; state.pendingBook = null; state.mission = null; render(); } catch (err) { state.error = err.message || '저장하지 못했어요.'; alert(state.error); }
  }
});

(async function init() {
  if (supabaseReady) { const { data: session } = await sb.auth.getSession(); if (session.session) { try { await loadProfile(session.session.user); } catch { /* 로그인 화면에서 재시도 */ } } }
  render();
})();
