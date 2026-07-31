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
  const [{ data: profileRows, error: profileError }, { data: recordRows, error: recordError }] = await Promise.all([
    sb.from('profiles').select('id,nickname,created_at').eq('role', 'student').order('nickname'),
    sb.from('reading_records').select('id,user_id,student_nickname,title,author,read_date,rating,mission,answer,created_at').order('created_at', { ascending: false })
  ]);
  if (profileError) throw profileError;
  if (recordError) throw recordError;
  students = profileRows || [];
  records = recordRows || [];
}

function loginScreen() {
  return `<div class="auth-wrap"><div class="auth-card"><div class="brand"><span class="brand-mark">👩‍🏫</span><div>독서한걸음<small>교사용 학급 대시보드</small></div></div>
    <p class="eyebrow">TEACHER SPACE</p><h1>${mode === 'signup' ? '교사 계정을 만들어요' : '학급 기록을 확인해요'}</h1>
    <p class="subtitle">학생의 독서 기록과 미션 답변을 한곳에서 확인할 수 있어요.</p>
    <div class="auth-toggle"><button class="${mode === 'login' ? 'active' : ''}" data-mode="login">로그인</button><button class="${mode === 'signup' ? 'active' : ''}" data-mode="signup">첫 교사 계정 만들기</button></div>
    <form id="teacher-auth-form"><div class="field"><label for="teacher-nickname">교사 닉네임</label><input id="teacher-nickname" required minlength="2" maxlength="16" placeholder="예: 6학년 1반 선생님" /></div>
    <div class="field"><label for="teacher-password">비밀번호</label><input id="teacher-password" type="password" required minlength="6" placeholder="6자 이상 입력" /></div>
    ${mode === 'signup' ? '<div class="field"><label for="teacher-code">교사 생성 코드</label><input id="teacher-code" required placeholder="Supabase Secret에 정한 코드" /></div>' : ''}
    <div class="error">${escapeHtml(message)}</div><button class="primary-button" style="width:100%" type="submit">${mode === 'signup' ? '교사 계정 만들기' : '대시보드 열기'}</button></form>
    <p class="notice">교사 생성 코드는 최초 계정 생성 때만 필요합니다.</p></div></div>`;
}

const teacherStars = rating => '★'.repeat(Number(rating) || 0) + '☆'.repeat(Math.max(0, 5 - (Number(rating) || 0)));
const teacherBookVisual = record => record.cover_image ? `<span class="teacher-record-cover"><img src="${escapeHtml(record.cover_image)}" alt="${escapeHtml(record.title)} 표지" /></span>` : '<span class="teacher-record-cover">📕</span>';

function studentRecordModal() {
  const student = students.find(item => item.id === selectedStudentId);
  if (!student) return '';
  const own = records.filter(record => record.user_id === student.id);
  const [threshold, name] = levelName(own.length);
  const levelNumber = [[0], [5], [10], [20], [40], [60], [80], [100], [130], [160], [200]].findIndex(item => item[0] === threshold);
  const list = own.length ? own.map(record => `<article class="teacher-student-record">${teacherBookVisual(record)}<div class="teacher-student-record-copy"><div class="teacher-student-record-head"><div><h3>${escapeHtml(record.title)}</h3><p>${escapeHtml(record.author)} · 📅 ${escapeHtml(record.read_date)}</p></div><strong>${teacherStars(record.rating)}</strong></div><div class="teacher-mission-answer"><span>랜덤 미션</span><b>${escapeHtml(record.mission || '미션 내용 없음')}</b><span>학생 답변</span><p>${escapeHtml(record.answer || '작성한 답변이 없어요.')}</p></div></div></article>`).join('') : '<div class="empty">아직 작성한 독서 기록이 없어요.</div>';
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
    return `<tr><td><button class="student-name-button" data-action="open-student" data-student-id="${escapeHtml(student.id)}">${escapeHtml(student.nickname)}</button></td><td>${own.length}권</td><td>LV.${threshold === 0 ? 0 : [[0],[5],[10],[20],[40],[60],[80],[100],[130],[160],[200]].findIndex(item => item[0] === threshold)} ${name}</td><td>${newest ? escapeHtml(newest.title) : '<span class="record-meta">아직 기록 없음</span>'}</td></tr>`;
  }).join('');
  return `<div class="shell"><div class="container"><header class="topbar"><div class="brand"><span class="brand-mark">👩‍🏫</span><div>독서한걸음<small>${escapeHtml(teacher.nickname)} 선생님 · 학급 대시보드</small></div></div><div class="topbar-actions"><a class="ghost-button" href="index.html">학생 화면</a><button class="ghost-button" data-action="logout">로그아웃</button></div></header>
  <section class="page-title"><div><p class="eyebrow">CLASS READING DASHBOARD</p><h1>우리 반 독서 현황</h1><p class="subtitle">학생별 독서 기록과 미션 답변을 한눈에 확인해요.</p></div><button class="secondary-button" data-action="refresh">새로고침</button></section>
  <section class="stats"><div class="stat"><div class="stat-label">등록 학생</div><div class="stat-value">${students.length}명</div><div class="stat-note">현재 학생 계정 기준</div></div><div class="stat"><div class="stat-label">이번 달 독서</div><div class="stat-value">${thisMonth}권</div><div class="stat-note">${monthKey.replace('-', '년 ')}월 기록</div></div><div class="stat"><div class="stat-label">전체 미션 완료</div><div class="stat-value">${records.length}회</div><div class="stat-note">저장된 독서 기록 수</div></div><div class="stat"><div class="stat-label">기록한 학생</div><div class="stat-value">${completedStudents}명</div><div class="stat-note">한 권 이상 기록</div></div></section>
  <section class="teacher-grid"><section class="panel"><div class="panel-header"><div><p class="eyebrow">STUDENT SUMMARY</p><h2>학생별 성장 현황</h2></div></div><div class="table-wrap"><table class="teacher-table"><thead><tr><th>학생</th><th>읽은 책</th><th>현재 업적</th><th>최근 기록</th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="empty">아직 가입한 학생이 없어요.</td></tr>'}</tbody></table></div></section>
  <aside class="panel"><p class="eyebrow">RECENT RECORDS</p><h2>최근 미션 답변</h2><div class="teacher-records">${latest.length ? latest.map(record => `<details class="teacher-record"><summary><div><strong>${escapeHtml(record.student_nickname || '학생')}</strong><span class="record-meta">${escapeHtml(record.title)} · ${escapeHtml(record.read_date)}</span></div></summary><p><strong>${escapeHtml(record.mission)}</strong></p><p class="subtitle">${escapeHtml(record.answer)}</p></details>`).join('') : '<div class="empty">아직 제출된 기록이 없어요.</div>'}</div></aside></section>${studentRecordModal()}</div></div>`;
}

function render() { document.querySelector('#teacher-app').innerHTML = teacher ? dashboardScreen() : loginScreen(); }

async function restoreSession() {
  if (!ready) return;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return;
  const { data: profile } = await sb.from('profiles').select('nickname,role').eq('id', session.user.id).maybeSingle();
  if (profile?.role !== 'teacher') { await sb.auth.signOut(); return; }
  teacher = profile;
  await loadDashboard();
}

document.addEventListener('click', async event => {
  const selectedMode = event.target.closest('[data-mode]')?.dataset.mode;
  if (selectedMode) { mode = selectedMode; message = ''; render(); return; }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'logout') { await sb.auth.signOut(); teacher = null; render(); }
  if (action === 'refresh') { try { await loadDashboard(); render(); } catch (error) { alert(error.message || '대시보드를 불러오지 못했어요.'); } }
  if (action === 'open-student') { selectedStudentId = event.target.closest('[data-student-id]')?.dataset.studentId || null; render(); }
  if (action === 'close-student') { selectedStudentId = null; render(); }
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
      const response = await fetch(`${cfg.url}/functions/v1/${TEACHER_SIGNUP_FUNCTION}`, {
        method: 'POST', headers: { apikey: cfg.anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, password, setupCode: document.querySelector('#teacher-code').value.trim() })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || '교사 계정을 만들지 못했어요.');
    }
    const { data, error } = await sb.auth.signInWithPassword({ email: teacherEmail(nickname), password });
    if (error) throw error;
    const { data: profile } = await sb.from('profiles').select('nickname,role').eq('id', data.user.id).maybeSingle();
    if (profile?.role !== 'teacher') { await sb.auth.signOut(); throw new Error('교사용 계정으로 로그인해 주세요.'); }
    teacher = profile;
    await loadDashboard();
    render();
  } catch (error) { message = error.message || '로그인하지 못했어요.'; render(); }
});

(async () => { try { await restoreSession(); } catch (error) { message = error.message || '대시보드를 준비하지 못했어요.'; } render(); })();
