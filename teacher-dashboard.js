const cfg = window.SUPABASE_CONFIG || {};
const ready = Boolean(cfg.url && cfg.anonKey && window.supabase);
const sb = ready ? window.supabase.createClient(cfg.url, cfg.anonKey) : null;
const TEACHER_SIGNUP_FUNCTION = 'teacher-signup';

let teacher = null;
let students = [];
let records = [];
let mode = 'login';
let message = '';
let selectedStudentId = null;
const draft = { nickname: '', password: '', code: '' };
let classes = [];
let overview = [];
let feedback = {};
let challenges = {};
const feedbackDraft = {};
const classForm = { school: null, query: '', results: [], searching: false, searched: false, error: '', sample: false, grade: '', classNo: '' };
const isLocalHost = ['localhost', '127.0.0.1'].includes(location.hostname);

async function fetchSchools(query) {
  if (isLocalHost) {
    const res = await fetch(`/__neis?q=${encodeURIComponent(query)}`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || '학교를 검색하지 못했어요.');
    classForm.sample = !!body.sample;
    return body.items || [];
  }
  const { data: result, error } = await sb.functions.invoke('neis-school-search', { body: { query } });
  if (error) { const detail = await error.context?.json?.().catch(() => null); throw new Error(detail?.error || error.message || '학교를 검색하지 못했어요.'); }
  return result?.items || [];
}
async function searchSchools() {
  const query = document.querySelector('#class-school-query')?.value.trim() ?? classForm.query;
  classForm.query = query;
  if (query.length < 2) { classForm.error = '두 글자 이상 학교 이름을 입력해 주세요.'; classForm.results = []; classForm.searched = false; render(); return; }
  classForm.searching = true; classForm.error = ''; classForm.results = []; render();
  try { classForm.results = await fetchSchools(query); classForm.searched = true; } catch (error) { classForm.error = error.message; }
  classForm.searching = false; render();
}
function schoolPicker() {
  const s = classForm.school;
  const results = classForm.searching ? '<div class="book-search-note">학교를 찾고 있어요…</div>'
    : classForm.error ? `<div class="book-search-note error">${escapeHtml(classForm.error)}</div>`
    : classForm.results.length ? `${classForm.sample ? '<div class="book-search-note">인증키가 없어 샘플 학교를 보여주고 있어요.</div>' : ''}<div class="book-search-results">${classForm.results.map((item, index) => `<button type="button" class="book-result" data-action="pick-school" data-school-index="${index}"><span class="book-result-placeholder">🏫</span><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.officeName)} · ${escapeHtml(item.address || item.kind)}</small></span><b>선택</b></button>`).join('')}</div>`
    : classForm.searched ? '<div class="book-search-note">검색 결과가 없어요.</div>' : '';
  return s
    ? `<div class="selected-school"><span aria-hidden="true">🏫</span><div><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.officeName)}</small></div><button type="button" class="ghost-button" data-action="clear-class-school">변경</button></div>`
    : `<div class="school-search-row"><input id="class-school-query" value="${escapeHtml(classForm.query)}" placeholder="예: 한걸음초등학교" autocomplete="off" /><button type="button" class="secondary-button" data-action="search-class-school">학교 찾기</button></div>${results}`;
}

function classPanel() {
  const s = classForm.school;
  const list = classes.length ? classes.map(item => `<div class="class-item"><div><strong>${escapeHtml(item.schools?.name || '')} ${item.grade}학년 ${item.class_no}반</strong><small>${item.school_year}학년도</small></div><div class="class-code"><span>학급 코드</span><b>${escapeHtml(item.join_code)}</b></div></div>`).join('') : '<div class="empty">아직 만든 학급이 없어요. 아래에서 학급을 만들어 주세요.</div>';
  const results = classForm.searching ? '<div class="book-search-note">학교를 찾고 있어요…</div>'
    : classForm.error ? `<div class="book-search-note error">${escapeHtml(classForm.error)}</div>`
    : classForm.results.length ? `${classForm.sample ? '<div class="book-search-note">인증키가 없어 샘플 학교를 보여주고 있어요.</div>' : ''}<div class="book-search-results">${classForm.results.map((item, index) => `<button type="button" class="book-result" data-action="pick-school" data-school-index="${index}"><span class="book-result-placeholder">🏫</span><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.officeName)} · ${escapeHtml(item.address || item.kind)}</small></span><b>선택</b></button>`).join('')}</div>`
    : classForm.searched ? '<div class="book-search-note">검색 결과가 없어요.</div>' : '';
  const picker = schoolPicker();
  const grades = Array.from({ length: 6 }, (_, i) => `<option value="${i + 1}" ${String(classForm.grade) === String(i + 1) ? 'selected' : ''}>${i + 1}학년</option>`).join('');
  const nos = Array.from({ length: 20 }, (_, i) => `<option value="${i + 1}" ${String(classForm.classNo) === String(i + 1) ? 'selected' : ''}>${i + 1}반</option>`).join('');
  const overviewText = overview.length ? `<p class="subtitle">${overview.map(o => `${escapeHtml(o.school_name)} 전체: 학급 ${o.class_count}개 · 학생 ${o.student_count}명 · 이번 달 ${o.records_this_month}권`).join('<br>')}</p>` : '';
  return `<section class="panel"><div class="panel-header"><div><p class="eyebrow">MY CLASSES</p><h2>우리 반 학급 코드</h2><p class="subtitle">학생은 학교·학년·반을 고르고 학급 코드를 입력해 가입해요.</p></div></div>${overviewText}<div class="class-list">${list}</div>
  <form id="class-form" class="class-form"><h3>학급 만들기</h3><div class="field"><label>학교</label>${picker}</div><div class="field-row"><div class="field"><label for="class-grade">학년</label><select id="class-grade" required><option value="">선택</option>${grades}</select></div><div class="field"><label for="class-no">반</label><select id="class-no" required><option value="">선택</option>${nos}</select></div></div><button class="primary-button" type="submit">학급 만들고 코드 받기</button></form></section>`;
}

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));
const monthKey = new Date().toISOString().slice(0, 7);
const teacherEmail = nickname => {
  const bytes = new TextEncoder().encode(nickname.trim());
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return `teacher-${btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')}@bookstep.local`;
};
const levelName = count => {
  const levels = [[0, '독서 준비생'], [5, '책 첫걸음'], [10, '책 새싹'], [20, '독서 탐험가'], [40, '열정 독서가'], [60, '이야기 수집가'], [80, '독서 여행자'], [100, '책의 친구'], [130, '지식 탐험가'], [160, '독서 고수'], [200, '책 마스터']];
  return levels.filter(level => count >= level[0]).at(-1);
};

async function loadDashboard() {
  const [{ data: classRows, error: classError }, { data: overviewRows }] = await Promise.all([
    sb.from('classes').select('id,grade,class_no,school_year,join_code,schools(name,office_name)').order('grade').order('class_no'),
    sb.rpc('school_overview')
  ]);
  if (classError) throw classError;
  classes = classRows || [];
  overview = overviewRows || [];
  const challengeResults = await Promise.all(classes.map(item => sb.rpc('challenge_status', { p_class_id: item.id })));
  challenges = Object.fromEntries(classes.map((item, index) => [item.id, challengeResults[index].data || []]));
  const [{ data: profileRows, error: profileError }, { data: recordRows, error: recordError }] = await Promise.all([
    sb.from('profiles').select('id,nickname,class_id,created_at').eq('role', 'student').order('nickname'),
    sb.from('reading_records').select('id,user_id,student_nickname,title,author,read_date,rating,mission,answer,created_at').order('created_at', { ascending: false })
  ]);
  if (profileError) throw profileError;
  if (recordError) throw recordError;
  students = profileRows || [];
  records = recordRows || [];
  const { data: feedbackRows } = await sb.from('teacher_feedback').select('record_id,stamp,comment');
  feedback = Object.fromEntries((feedbackRows || []).map(row => [row.record_id, row]));
}

function loginScreen() {
  return `<div class="auth-wrap"><div class="auth-card"><div class="brand"><span class="brand-mark"><img src="assets/dokseo-hangeoreum-logo.png" alt="독서한걸음 로고" /></span><div>독서한걸음<small>교사용 학급 대시보드</small></div></div>
    <p class="eyebrow">TEACHER SPACE</p><h1>${mode === 'signup' ? '교사 계정을 만들어요' : '학급 기록을 확인해요'}</h1>
    <p class="subtitle">학생의 독서 기록과 미션 답변을 한곳에서 확인할 수 있어요.</p>
    <div class="auth-toggle"><button class="${mode === 'login' ? 'active' : ''}" data-mode="login">로그인</button><button class="${mode === 'signup' ? 'active' : ''}" data-mode="signup">첫 교사 계정 만들기</button></div>
    <form id="teacher-auth-form"><div class="field"><label for="teacher-nickname">교사 닉네임</label><input id="teacher-nickname" required minlength="2" maxlength="16" value="${escapeHtml(draft.nickname)}" placeholder="예: 6학년 1반 선생님" /></div>
    <div class="field"><label for="teacher-password">비밀번호</label><input id="teacher-password" type="password" required minlength="6" value="${escapeHtml(draft.password)}" placeholder="6자 이상 입력" /></div>
    ${mode === 'signup' ? `<div class="field"><label>근무 학교</label>${schoolPicker()}</div><div class="field"><label for="teacher-code">선생님 인증코드</label><input id="teacher-code" required value="${escapeHtml(draft.code)}" placeholder="학교에서 안내받은 인증코드" autocomplete="off" /></div>` : ''}
    <div class="error">${escapeHtml(message)}</div><button class="primary-button" style="width:100%" type="submit">${mode === 'signup' ? '교사 계정 만들기' : '대시보드 열기'}</button></form>
    <p class="notice">인증코드는 최초 계정 생성 때만 필요해요. 학교를 선택하면 학급을 만들 때 자동으로 선택돼요.</p></div></div>`;
}

const teacherStars = rating => '★'.repeat(Number(rating) || 0) + '☆'.repeat(Math.max(0, 5 - (Number(rating) || 0)));
const teacherBookVisual = record => record.cover_image ? `<span class="teacher-record-cover"><img src="${escapeHtml(record.cover_image)}" alt="${escapeHtml(record.title)} 표지" /></span>` : '<span class="teacher-record-cover">📕</span>';

function studentRecordModal() {
  const student = students.find(item => item.id === selectedStudentId);
  if (!student) return '';
  const own = records.filter(record => record.user_id === student.id);
  const [threshold, name] = levelName(own.length);
  const levelNumber = [[0], [5], [10], [20], [40], [60], [80], [100], [130], [160], [200]].findIndex(item => item[0] === threshold);
  const list = own.length ? own.map(record => `<article class="teacher-student-record">${teacherBookVisual(record)}<div class="teacher-student-record-copy"><div class="teacher-student-record-head"><div><h3>${escapeHtml(record.title)}</h3><p>${escapeHtml(record.author)} · 📅 ${escapeHtml(record.read_date)}</p></div><strong>${teacherStars(record.rating)}</strong></div><div class="teacher-mission-answer"><span>랜덤 미션</span><b>${escapeHtml(record.mission || '미션 내용 없음')}</b><span>학생 답변</span><p>${escapeHtml(record.answer || '작성한 답변이 없어요.')}</p></div>${feedbackForm(record)}</div></article>`).join('') : '<div class="empty">아직 작성한 독서 기록이 없어요.</div>';
  return `<div class="record-modal-backdrop" data-action="close-student"><section class="record-modal teacher-student-modal" role="dialog" aria-modal="true" aria-label="학생 독서 기록"><button class="modal-close" data-action="close-student" aria-label="닫기">×</button><p class="eyebrow">STUDENT READING PORTFOLIO</p><h2>${escapeHtml(student.nickname)} 학생의 독서 기록</h2><p class="subtitle">총 ${own.length}권 · LV.${levelNumber} ${name}</p><div class="teacher-student-record-list">${list}</div><div class="modal-actions"><span></span><button class="primary-button" data-action="close-student">닫기</button></div></section></div>`;
}

function dashboardScreen() {
  const thisMonth = records.filter(record => String(record.read_date || '').startsWith(monthKey)).length;
  const completedStudents = new Set(records.map(record => record.user_id)).size;
  const latest = records.slice(0, 5);
  const rows = students.map(student => {
    const own = records.filter(record => record.user_id === student.id);
    const newest = own[0];
    const [threshold, name] = levelName(own.length);
    return `<tr><td><button class="student-name-button" data-action="open-student" data-student-id="${escapeHtml(student.id)}">${escapeHtml(student.nickname)}</button></td><td>${escapeHtml(classLabel(student.class_id))}</td><td>${own.length}권</td><td>LV.${threshold === 0 ? 0 : [[0],[5],[10],[20],[40],[60],[80],[100],[130],[160],[200]].findIndex(item => item[0] === threshold)} ${name}</td><td>${newest ? escapeHtml(newest.title) : '<span class="record-meta">아직 기록 없음</span>'}</td></tr>`;
  }).join('');
  return `<div class="shell"><div class="container"><header class="topbar"><div class="brand"><span class="brand-mark"><img src="assets/dokseo-hangeoreum-logo.png" alt="독서한걸음 로고" /></span><div>독서한걸음<small>${teacherTitle()}</small></div></div><div class="topbar-actions"><a class="ghost-button" href="index.html">학생 화면</a><button class="ghost-button" data-action="logout">로그아웃</button></div></header>
  <section class="page-title"><div><p class="eyebrow">CLASS READING DASHBOARD</p><h1>우리 반 독서 현황</h1><p class="subtitle">학생별 독서 기록과 미션 답변을 한눈에 확인해요.</p>${classChips()}</div><button class="secondary-button" data-action="refresh">새로고침</button></section>
  ${collapsible('classes', classPanel(), !classes.length)}${collapsible('bulk', bulkPanel())}${collapsible('challenge', challengePanel())}
  <section class="stats"><div class="stat"><div class="stat-label">등록 학생</div><div class="stat-value">${students.length}명</div><div class="stat-note">현재 학생 계정 기준</div></div><div class="stat"><div class="stat-label">이번 달 독서</div><div class="stat-value">${thisMonth}권</div><div class="stat-note">${monthKey.replace('-', '년 ')}월 기록</div></div><div class="stat"><div class="stat-label">전체 미션 완료</div><div class="stat-value">${records.length}회</div><div class="stat-note">저장된 독서 기록 수</div></div><div class="stat"><div class="stat-label">기록한 학생</div><div class="stat-value">${completedStudents}명</div><div class="stat-note">한 권 이상 기록</div></div></section>
  <section class="teacher-grid"><section class="panel"><div class="panel-header"><div><p class="eyebrow">STUDENT SUMMARY</p><h2>학생별 성장 현황</h2></div></div><div class="table-wrap"><table class="teacher-table"><thead><tr><th>학생</th><th>학급</th><th>읽은 책</th><th>현재 업적</th><th>최근 기록</th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="empty">아직 가입한 학생이 없어요.</td></tr>'}</tbody></table></div></section>
  <aside class="panel"><p class="eyebrow">RECENT RECORDS</p><h2>최근 미션 답변</h2><div class="teacher-records">${latest.length ? latest.map(record => `<details class="teacher-record"><summary><div><strong>${escapeHtml(record.student_nickname || '학생')}</strong><span class="record-meta">${escapeHtml(record.title)} · ${escapeHtml(record.read_date)}</span></div></summary><p><strong>${escapeHtml(record.mission)}</strong></p><p class="subtitle">${escapeHtml(record.answer)}</p></details>`).join('') : '<div class="empty">아직 제출된 기록이 없어요.</div>'}</div></aside></section>${studentRecordModal()}</div></div>`;
}

function render() { document.querySelector('#teacher-app').innerHTML = teacher ? dashboardScreen() : loginScreen(); }

async function restoreSession() {
  if (!ready) return;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return;
  const { data: profile, error: profileError } = await sb.from('profiles').select('nickname,role,schools(code,name,office_code,office_name,address)').eq('id', session.user.id).maybeSingle();
  if (profileError) throw new Error('교사 정보를 불러오지 못했어요. 데이터베이스 설정(SQL)을 확인해 주세요. (' + profileError.message + ')');
  if (profile?.role !== 'teacher') { await sb.auth.signOut(); return; }
  teacher = profile;
  applyTeacherSchool(profile);
  await loadDashboard();
}

document.addEventListener('click', async event => {
  const selectedMode = event.target.closest('[data-mode]')?.dataset.mode;
  if (selectedMode) { mode = selectedMode; message = ''; render(); return; }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'logout') { await sb.auth.signOut(); teacher = null; render(); }
  if (action === 'refresh') { try { await loadDashboard(); render(); } catch (error) { alert(error.message || '대시보드를 불러오지 못했어요.'); } }
  if (action === 'open-student') { selectedStudentId = event.target.closest('[data-student-id]')?.dataset.studentId || null; render(); }
  if (action === 'close-student' && (event.target.classList.contains('record-modal-backdrop') || event.target.closest('button[data-action="close-student"]'))) { selectedStudentId = null; render(); }
});

document.addEventListener('submit', async event => {
  if (event.target.id !== 'teacher-auth-form') return;
  event.preventDefault();
  message = '';
  if (!ready) { message = 'supabase-config.js 설정을 확인해 주세요.'; render(); return; }
  const nickname = document.querySelector('#teacher-nickname').value.trim();
  const password = document.querySelector('#teacher-password').value;
  try {
    if (mode === 'signup') {
      if (!classForm.school) throw new Error('근무하는 학교를 먼저 찾아서 선택해 주세요.');
      const response = await fetch(`${cfg.url}/functions/v1/${TEACHER_SIGNUP_FUNCTION}`, {
        method: 'POST', headers: { apikey: cfg.anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, password, school: classForm.school, setupCode: document.querySelector('#teacher-code').value.trim() })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || '교사 계정을 만들지 못했어요.');
    }
    const { data, error } = await sb.auth.signInWithPassword({ email: teacherEmail(nickname), password });
    if (error) throw error;
    const { data: profile, error: profileError } = await sb.from('profiles').select('nickname,role,schools(code,name,office_code,office_name,address)').eq('id', data.user.id).maybeSingle();
  if (profileError) throw new Error('교사 정보를 불러오지 못했어요. 데이터베이스 설정(SQL)을 확인해 주세요. (' + profileError.message + ')');
    if (profile?.role !== 'teacher') { await sb.auth.signOut(); throw new Error('교사용 계정으로 로그인해 주세요.'); }
    teacher = profile;
  applyTeacherSchool(profile);
    draft.nickname = draft.password = draft.code = '';
    await loadDashboard();
    render();
  } catch (error) { message = error.message || '로그인하지 못했어요.'; render(); }
});

(async () => { try { await restoreSession(); } catch (error) { message = error.message || '대시보드를 준비하지 못했어요.'; } render(); })();

function applyTeacherSchool(profile) {
  const school = profile?.schools;
  if (school && !classForm.school) classForm.school = { code: school.code, name: school.name, officeCode: school.office_code, officeName: school.office_name, address: school.address };
}

const classLabel = classId => {
  const item = classes.find(c => c.id === classId);
  return item ? `${item.grade}학년 ${item.class_no}반` : '-';
};

document.addEventListener('click', async event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'search-class-school') searchSchools();
  if (action === 'pick-school') { classForm.school = classForm.results[Number(event.target.closest('[data-school-index]').dataset.schoolIndex)]; render(); }
  if (action === 'clear-class-school') { classForm.school = null; render(); }
});
document.addEventListener('keydown', event => {
  if (event.target.id === 'class-school-query' && event.key === 'Enter') { event.preventDefault(); searchSchools(); }
});
document.addEventListener('input', event => {
  const id = event.target.id;
  if (id === 'class-school-query') classForm.query = event.target.value;
  if (id === 'teacher-nickname') draft.nickname = event.target.value;
  if (id === 'teacher-password') draft.password = event.target.value;
  if (id === 'teacher-code') draft.code = event.target.value;
});
document.addEventListener('change', event => {
  if (event.target.id === 'class-grade') classForm.grade = event.target.value;
  if (event.target.id === 'class-no') classForm.classNo = event.target.value;
});
document.addEventListener('submit', async event => {
  if (event.target.id !== 'class-form') return;
  event.preventDefault();
  const s = classForm.school;
  if (!s) { classForm.error = '학교를 먼저 찾아서 선택해 주세요.'; render(); return; }
  const { error } = await sb.rpc('create_class', {
    p_school_code: s.code, p_office_code: s.officeCode, p_office_name: s.officeName, p_school_name: s.name,
    p_address: s.address || null, p_grade: Number(classForm.grade), p_class_no: Number(classForm.classNo)
  });
  if (error) { alert(error.message || '학급을 만들지 못했어요.'); return; }
  classForm.school = null; classForm.query = ''; classForm.results = []; classForm.searched = false; classForm.grade = ''; classForm.classNo = '';
  await loadDashboard(); render();
});

// 선생님 피드백: 도장 + 한마디
const STAMPS = ['👍', '❤️', '🌟', '👏', '🔥', '🎉'];
function feedbackValue(recordId) {
  return feedbackDraft[recordId] || { stamp: feedback[recordId]?.stamp || '', comment: feedback[recordId]?.comment || '' };
}
function feedbackForm(record) {
  const value = feedbackValue(record.id);
  const saved = feedback[record.id];
  const id = escapeHtml(record.id);
  return `<div class="feedback-form" data-feedback-record="${id}"><span class="feedback-label">선생님 도장${saved ? ' · 남긴 칭찬이 있어요' : ''}</span><div class="stamp-row">${STAMPS.map(stamp => `<button type="button" class="stamp-button${value.stamp === stamp ? ' active' : ''}" data-action="pick-stamp" data-record-id="${id}" data-stamp="${stamp}" aria-label="${stamp} 도장">${stamp}</button>`).join('')}</div><textarea class="feedback-comment" data-feedback-comment="${id}" maxlength="200" rows="2" placeholder="한마디를 남겨 주세요 (선택, 200자 이내)">${escapeHtml(value.comment)}</textarea><div class="feedback-actions"><button type="button" class="secondary-button" data-action="save-feedback" data-record-id="${id}">${saved ? '칭찬 수정하기' : '칭찬 남기기'}</button>${saved ? `<button type="button" class="ghost-button" data-action="delete-feedback" data-record-id="${id}">삭제</button>` : ''}</div></div>`;
}
function renderKeepModalScroll() {
  const before = document.querySelector('.teacher-student-modal')?.scrollTop ?? 0;
  render();
  const modal = document.querySelector('.teacher-student-modal');
  if (modal) modal.scrollTop = before;
}
document.addEventListener('input', event => {
  const recordId = event.target.dataset?.feedbackComment;
  if (!recordId) return;
  feedbackDraft[recordId] = { ...feedbackValue(recordId), comment: event.target.value };
});
document.addEventListener('click', async event => {
  const button = event.target.closest('[data-action][data-record-id]');
  if (!button) return;
  const action = button.dataset.action;
  const recordId = button.dataset.recordId;
  if (action === 'pick-stamp') {
    feedbackDraft[recordId] = { ...feedbackValue(recordId), stamp: button.dataset.stamp };
    button.closest('.stamp-row').querySelectorAll('.stamp-button').forEach(item => item.classList.toggle('active', item === button));
  }
  if (action === 'save-feedback') {
    const value = feedbackValue(recordId);
    if (!value.stamp) { alert('도장을 먼저 골라 주세요.'); return; }
    const { data: userData } = await sb.auth.getUser();
    const { error } = await sb.from('teacher_feedback').upsert(
      { record_id: recordId, teacher_id: userData.user.id, stamp: value.stamp, comment: value.comment.trim() || null },
      { onConflict: 'record_id' }
    );
    if (error) { alert(error.message || '칭찬을 저장하지 못했어요.'); return; }
    delete feedbackDraft[recordId];
    await loadDashboard(); renderKeepModalScroll();
  }
  if (action === 'delete-feedback') {
    if (!confirm('남긴 칭찬을 삭제할까요?')) return;
    const { error } = await sb.from('teacher_feedback').delete().eq('record_id', recordId);
    if (error) { alert(error.message || '칭찬을 삭제하지 못했어요.'); return; }
    delete feedbackDraft[recordId];
    await loadDashboard(); renderKeepModalScroll();
  }
});

// 학급 챌린지
function dateText(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function challengeDefaults() {
  const now = new Date();
  return { classId: '', title: '', target: '', start: dateText(now), end: dateText(new Date(now.getFullYear(), now.getMonth() + 1, 0)), bonus: '3' };
}
const challengeForm = challengeDefaults();
function challengeStatusText(item) {
  const today = dateText(new Date());
  if (item.achieved) return '🎉 달성';
  if (item.ends_on < today) return '종료';
  if (item.starts_on > today) return '예정';
  return '진행 중';
}
function challengePanel() {
  if (!classes.length) return '';
  const f = challengeForm;
  if (!f.classId || !classes.some(c => c.id === f.classId)) f.classId = classes[0].id;
  const label = c => `${escapeHtml(c.schools?.name || '')} ${c.grade}학년 ${c.class_no}반`;
  const options = classes.map(c => `<option value="${escapeHtml(c.id)}" ${f.classId === c.id ? 'selected' : ''}>${label(c)}</option>`).join('');
  const lists = classes.map(c => {
    const items = challenges[c.id] || [];
    const body = items.length ? items.map(item => {
      const pct = Math.min(100, Math.round((Number(item.progress) / Number(item.target_books)) * 100));
      return `<div class="challenge-item"><div class="challenge-top"><strong>${escapeHtml(item.title)} <small>${challengeStatusText(item)}</small></strong><small>${escapeHtml(item.starts_on)} ~ ${escapeHtml(item.ends_on)}</small></div><div class="progress"><span style="width:${pct}%"></span></div><div class="progress-note"><span>${item.progress} / ${item.target_books}권 (${pct}%) · 달성 보상 ⭐+${item.bonus_stickers}</span><button type="button" class="ghost-button" data-action="delete-challenge" data-challenge-id="${escapeHtml(item.id)}">삭제</button></div></div>`;
    }).join('') : '<div class="empty">아직 챌린지가 없어요.</div>';
    return `<div class="challenge-class"><h3>${label(c)}</h3>${body}</div>`;
  }).join('');
  return `<section class="panel"><div class="panel-header"><div><p class="eyebrow">CLASS CHALLENGE</p><h2>학급 챌린지</h2><p class="subtitle">목표 권수를 정하면 학생 홈에 진행바가 보여요. 달성하면 한 권 이상 읽은 학생에게 보너스 스티커가 주어져요.</p></div></div>${lists}
  <form id="challenge-form" class="class-form"><h3>챌린지 만들기</h3><div class="field"><label for="ch-class">학급</label><select id="ch-class">${options}</select></div><div class="field"><label for="ch-title">챌린지 이름</label><input id="ch-title" required maxlength="40" value="${escapeHtml(f.title)}" placeholder="예: 우리 반 100권 도전!" /></div><div class="field-row"><div class="field"><label for="ch-target">목표 권수</label><input id="ch-target" type="number" min="1" max="1000" required value="${escapeHtml(f.target)}" placeholder="예: 100" /></div><div class="field"><label for="ch-bonus">보너스 스티커</label><input id="ch-bonus" type="number" min="0" max="20" required value="${escapeHtml(f.bonus)}" /></div></div><div class="field-row"><div class="field"><label for="ch-start">시작일</label><input id="ch-start" type="date" required value="${escapeHtml(f.start)}" /></div><div class="field"><label for="ch-end">종료일</label><input id="ch-end" type="date" required value="${escapeHtml(f.end)}" /></div></div><button class="primary-button" type="submit">챌린지 시작하기</button></form></section>`;
}
document.addEventListener('input', event => {
  const map = { 'ch-title': 'title', 'ch-target': 'target', 'ch-bonus': 'bonus', 'ch-start': 'start', 'ch-end': 'end', 'ch-class': 'classId' };
  const key = map[event.target.id];
  if (key) challengeForm[key] = event.target.value;
});
document.addEventListener('change', event => { if (event.target.id === 'ch-class') challengeForm.classId = event.target.value; });
document.addEventListener('click', async event => {
  const button = event.target.closest('[data-action="delete-challenge"]');
  if (!button) return;
  if (!confirm('이 챌린지를 삭제할까요? 학생들이 받은 보너스 스티커도 함께 사라져요.')) return;
  const { error } = await sb.from('class_challenges').delete().eq('id', button.dataset.challengeId);
  if (error) { alert(error.message || '챌린지를 삭제하지 못했어요.'); return; }
  await loadDashboard(); render();
});
document.addEventListener('submit', async event => {
  if (event.target.id !== 'challenge-form') return;
  event.preventDefault();
  const f = challengeForm;
  if (f.end < f.start) { alert('종료일은 시작일보다 빠를 수 없어요.'); return; }
  const { data: userData } = await sb.auth.getUser();
  const { error } = await sb.from('class_challenges').insert({
    class_id: f.classId, title: f.title.trim(), target_books: Number(f.target), starts_on: f.start,
    ends_on: f.end, bonus_stickers: Number(f.bonus), created_by: userData.user.id
  });
  if (error) { alert(error.message || '챌린지를 만들지 못했어요.'); return; }
  Object.assign(challengeForm, challengeDefaults(), { classId: f.classId });
  await loadDashboard(); render();
});

// 학생 일괄 생성
const bulk = { classId: '', text: '', busy: false, error: '', result: null };
function parseBulkText(text) {
  return String(text).split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
    const [nickname, password] = line.split(/[\t,]/).map(part => part.trim());
    return { nickname: nickname || '', password: password || '' };
  });
}
function bulkPanel() {
  if (!classes.length) return '';
  if (!bulk.classId || !classes.some(item => item.id === bulk.classId)) bulk.classId = classes[0].id;
  const options = classes.map(item => `<option value="${escapeHtml(item.id)}" ${bulk.classId === item.id ? 'selected' : ''}>${escapeHtml(item.schools?.name || '')} ${item.grade}학년 ${item.class_no}반</option>`).join('');
  const count = parseBulkText(bulk.text).length;
  const statusLabel = { created: '✅ 만들어짐', exists: '⚠️ 이미 있음', error: '❌ 실패' };
  const result = bulk.result ? `<div class="bulk-result"><p class="subtitle">학급코드 <b>${escapeHtml(bulk.result.classCode)}</b> · 만들어진 계정 ${bulk.result.results.filter(item => item.status === 'created').length}개 / 전체 ${bulk.result.results.length}명. <b>비밀번호는 이 화면을 닫으면 다시 볼 수 없으니 지금 인쇄하거나 저장해 주세요.</b></p><div class="table-wrap"><table class="teacher-table"><thead><tr><th>닉네임</th><th>비밀번호</th><th>결과</th></tr></thead><tbody>${bulk.result.results.map(item => `<tr><td>${escapeHtml(item.nickname)}</td><td>${item.password ? `<code>${escapeHtml(item.password)}</code>` : '-'}</td><td>${statusLabel[item.status] || ''} ${escapeHtml(item.message || '')}</td></tr>`).join('')}</tbody></table></div><div class="button-row"><button type="button" class="secondary-button" data-action="bulk-print">인쇄하기</button><button type="button" class="secondary-button" data-action="bulk-csv">CSV 저장</button><button type="button" class="ghost-button" data-action="bulk-close">결과 닫기</button></div></div>` : '';
  return `<section class="panel"><div class="panel-header"><div><p class="eyebrow">BULK STUDENTS</p><h2>학생 계정 한 번에 만들기</h2><p class="subtitle">닉네임을 한 줄에 한 명씩 붙여넣으세요. 엑셀에서 복사해도 돼요. 비밀번호를 따로 적지 않으면 6자리 숫자가 자동으로 만들어져요.</p></div></div>
  <form id="bulk-form" class="class-form"><div class="field"><label for="bulk-class">학급</label><select id="bulk-class">${options}</select></div><div class="field"><label for="bulk-text">학생 명단 (${count}명)</label><textarea id="bulk-text" rows="6" placeholder="책벌레1&#10;책벌레2&#10;별빛독서가, 123456">${escapeHtml(bulk.text)}</textarea><small class="record-meta">실명 대신 별명을 쓰는 걸 권해요. 줄마다 "닉네임" 또는 "닉네임, 비밀번호"(6자 이상)로 적어요. 한 번에 60명까지 가능해요.</small></div>${bulk.error ? `<div class="error">${escapeHtml(bulk.error)}</div>` : ''}<button class="primary-button" type="submit" ${bulk.busy ? 'disabled' : ''}>${bulk.busy ? '만드는 중…' : '계정 만들기'}</button></form>${result}</section>`;
}
function bulkRowsForExport() {
  return bulk.result.results.map(item => [item.nickname, bulk.result.classCode, item.password || '', item.status === 'created' ? '만들어짐' : item.status === 'exists' ? '이미 있음' : (item.message || '실패')]);
}
document.addEventListener('input', event => { if (event.target.id === 'bulk-text') { bulk.text = event.target.value; const label = document.querySelector('label[for="bulk-text"]'); if (label) label.textContent = `학생 명단 (${parseBulkText(bulk.text).length}명)`; } });
document.addEventListener('change', event => { if (event.target.id === 'bulk-class') bulk.classId = event.target.value; });
document.addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'bulk-close') { bulk.result = null; render(); }
  if (action === 'bulk-csv' && bulk.result) {
    const rows = [['닉네임', '학급코드', '비밀번호', '결과'], ...bulkRowsForExport()];
    const csv = '﻿' + rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `학생계정_${bulk.result.classCode}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
  if (action === 'bulk-print' && bulk.result) {
    const rows = bulkRowsForExport().filter(row => row[2]);
    const win = window.open('', '_blank');
    if (!win) { alert('팝업이 차단됐어요. 팝업을 허용하거나 CSV로 저장해 주세요.'); return; }
    win.document.write(`<!doctype html><meta charset="utf-8"><title>학생 로그인 카드</title><style>body{font-family:sans-serif;margin:16px}.card{display:inline-block;width:46%;margin:6px;padding:12px 14px;border:1px dashed #888;border-radius:8px;box-sizing:border-box;page-break-inside:avoid}h3{margin:0 0 6px}p{margin:3px 0}code{font-size:1.2em;letter-spacing:.1em}</style>${rows.map(row => `<div class="card"><h3>📚 독서한걸음</h3><p>닉네임: <b>${escapeHtml(row[0])}</b></p><p>학급코드: <b>${escapeHtml(row[1])}</b></p><p>비밀번호: <code>${escapeHtml(row[2])}</code></p></div>`).join('')}`);
    win.document.close(); win.focus(); win.print();
  }
});
document.addEventListener('submit', async event => {
  if (event.target.id !== 'bulk-form') return;
  event.preventDefault();
  const students = parseBulkText(bulk.text);
  if (!students.length) { bulk.error = '학생 명단을 입력해 주세요.'; render(); return; }
  if (students.length > 60) { bulk.error = '한 번에 60명까지만 만들 수 있어요.'; render(); return; }
  bulk.busy = true; bulk.error = ''; render();
  const { data: body, error } = await sb.functions.invoke('bulk-create-students', { body: { classId: bulk.classId, students } });
  bulk.busy = false;
  if (error) {
    const detail = await error.context?.json?.().catch(() => null);
    bulk.error = detail?.error || error.message || '학생 계정을 만들지 못했어요.';
  } else {
    bulk.result = body;
    panelOpen.bulk = true;
    bulk.text = '';
    await loadDashboard();
  }
  render();
});

// 상단 제목과 담당 학급 표시
function teacherTitle() {
  const name = /선생님$/.test(teacher.nickname) ? teacher.nickname : `${teacher.nickname} 선생님`;
  const labels = classes.map(item => `${item.schools?.name || ''} ${item.grade}학년 ${item.class_no}반`.trim());
  return escapeHtml(labels.length ? `${name} · ${labels.join(', ')}` : `${name} · 학급 대시보드`);
}
function classChips() {
  if (!classes.length) return '<div class="class-chips"><span class="class-chip empty-chip">아직 학급이 없어요. 아래에서 학급을 만들어 주세요.</span></div>';
  return `<div class="class-chips">${classes.map(item => {
    const count = students.filter(student => student.class_id === item.id).length;
    return `<span class="class-chip">🏫 ${escapeHtml(item.schools?.name || '')} <b>${item.grade}학년 ${item.class_no}반</b> · 코드 <b class="chip-code">${escapeHtml(item.join_code)}</b> · 학생 ${count}명</span>`;
  }).join('')}</div>`;
}

// 패널 접기/열기
const panelOpen = {};
function collapsible(key, html, openByDefault = false) {
  if (!html) return '';
  const isOpen = panelOpen[key] ?? openByDefault;
  const end = '</div></div>';
  const headStart = html.indexOf('<div class="panel-header">');
  const headEnd = html.indexOf(end, headStart) + end.length;
  if (headStart < 0 || headEnd < end.length) return html;
  const toggle = `<button type="button" class="ghost-button panel-toggle" data-action="toggle-panel" data-panel="${key}" aria-expanded="${isOpen}">${isOpen ? '접기 ▲' : '열기 ▼'}</button>`;
  const header = html.slice(headStart, headEnd - end.length) + '</div>' + toggle + '</div>';
  const body = html.slice(headEnd, html.lastIndexOf('</section>'));
  return html.slice(0, headStart) + header + `<div class="panel-body"${isOpen ? '' : ' hidden'}>${body}</div></section>`;
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-action="toggle-panel"]');
  if (!button) return;
  const key = button.dataset.panel;
  const wasOpen = button.getAttribute('aria-expanded') === 'true';
  panelOpen[key] = !wasOpen;
  const y = window.scrollY;
  render();
  window.scrollTo(0, y);
});
