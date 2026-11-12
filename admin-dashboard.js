// 슈퍼 관리자 화면 (읽기 전용). teacher-dashboard.js 가 role='admin' 로그인 때 사용합니다.
// 데이터는 supabase-admin.sql 의 admin_* 함수로만 읽습니다. (수정·삭제 기능 없음)
const adminState = { profile: null, summary: null, schools: [], school: null, classes: [], teachers: [], students: [], unassigned: [], selectedClass: null, student: null, studentRecords: [], error: '', loading: false };
const adminEsc = (v = '') => String(v ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const adminDate = v => v ? String(v).slice(0, 10) : '-';

async function adminRpc(name, args) {
  const { data, error } = await sb.rpc(name, args);
  if (error) throw new Error(error.message || '불러오지 못했어요.');
  return data;
}
async function loadAdmin() {
  adminState.summary = await adminRpc('admin_summary');
  adminState.schools = await adminRpc('admin_schools');
  adminState.unassigned = await adminRpc('admin_students', { p_class: null });
  adminState.school = null; adminState.selectedClass = null; adminState.student = null;
}
async function adminOpenSchool(code) {
  adminState.school = adminState.schools.find(s => s.school_code === code) || null;
  adminState.selectedClass = null; adminState.student = null; adminState.students = [];
  [adminState.classes, adminState.teachers] = await Promise.all([adminRpc('admin_classes', { p_school: code }), adminRpc('admin_teachers', { p_school: code })]);
}
async function adminOpenClass(id) {
  adminState.selectedClass = adminState.classes.find(c => c.id === id) || null;
  adminState.student = null;
  adminState.students = await adminRpc('admin_students', { p_class: id });
}
async function adminOpenStudent(id, list) {
  adminState.student = (list || adminState.students).find(s => s.id === id) || null;
  adminState.studentRecords = adminState.student ? await adminRpc('admin_student_records', { p_user: id }) : [];
}

function adminStat(label, value) { return `<div class="admin-stat"><b>${Number(value) || 0}</b><span>${label}</span></div>`; }
function adminTable(head, rows, empty) {
  return rows.length ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : `<div class="empty">${empty}</div>`;
}
function adminStudentRows(list) {
  return list.map(s => `<tr><td><button class="student-name-button" data-admin="student" data-id="${adminEsc(s.id)}" data-from="${list === adminState.unassigned ? 'un' : 'cls'}">${adminEsc(s.nickname)}</button></td><td>${s.record_count}권</td><td>${adminDate(s.last_read)}</td><td>${adminDate(s.created_at)}</td></tr>`);
}
function adminStudentModal() {
  const s = adminState.student; if (!s) return '';
  const rows = adminState.studentRecords.map(r => `<tr><td>${adminEsc(r.title)}</td><td>${adminEsc(r.author)}</td><td>${adminDate(r.read_date)}</td><td>${'★'.repeat(r.rating || 0)}</td></tr>`);
  return `<div class="record-modal-backdrop" data-admin="close-student"><section class="record-modal" role="dialog" aria-modal="true"><button class="ghost-button" data-admin="close-student">닫기</button><h2>${adminEsc(s.nickname)}</h2><p class="record-meta">가입 ${adminDate(s.created_at)} · 기록 ${s.record_count}권 · 미션 답변은 관리자 화면에 표시하지 않아요.</p>${adminTable(['책', '저자', '읽은 날', '별점'], rows, '아직 기록이 없어요.')}</section></div>`;
}
function adminScreen() {
  const s = adminState.summary || {};
  const sc = adminState.school, cl = adminState.selectedClass;
  const crumbs = `<nav class="admin-crumbs"><button data-admin="home">전체 학교</button>${sc ? ` › <button data-admin="school" data-id="${adminEsc(sc.school_code)}">${adminEsc(sc.school_name)}</button>` : ''}${cl ? ` › ${cl.grade}학년 ${cl.class_no}반` : ''}</nav>`;
  let body;
  if (!sc) {
    const rows = adminState.schools.map(x => `<tr><td><button class="student-name-button" data-admin="school" data-id="${adminEsc(x.school_code)}">${adminEsc(x.school_name)}</button><div class="record-meta">${adminEsc(x.office_name)}</div></td><td>${x.teachers}</td><td>${x.classes}</td><td>${x.students}</td><td>${x.records}</td><td>${adminDate(x.last_activity)}</td></tr>`);
    body = `<section class="panel"><h2>학교별 현황</h2>${adminTable(['학교', '교사', '학급', '학생', '기록', '최근 활동'], rows, '가입한 학교가 아직 없어요.')}</section>
      <section class="panel"><h2>학급 미배정 학생 (${adminState.unassigned.length}명)</h2>${adminTable(['학생', '기록', '최근 읽은 날', '가입일'], adminStudentRows(adminState.unassigned), '없어요.')}</section>`;
  } else if (!cl) {
    const crow = adminState.classes.map(c => `<tr><td><button class="student-name-button" data-admin="class" data-id="${adminEsc(c.id)}">${c.school_year}학년도 ${c.grade}학년 ${c.class_no}반</button></td><td>${adminEsc(c.teacher_nickname || '-')}</td><td>${c.students}</td><td>${c.records}</td><td>${adminEsc(c.join_code)}</td></tr>`);
    const trow = adminState.teachers.map(t => `<tr><td>${adminEsc(t.nickname)}</td><td>${t.class_count}</td><td>${adminDate(t.created_at)}</td></tr>`);
    body = `<section class="panel"><h2>${adminEsc(sc.school_name)} · 학급</h2>${adminTable(['학급', '담임 교사', '학생', '기록', '학급코드'], crow, '학급이 없어요.')}</section>
      <section class="panel"><h2>교사</h2>${adminTable(['닉네임', '학급 수', '가입일'], trow, '교사가 없어요.')}</section>`;
  } else {
    body = `<section class="panel"><h2>${cl.grade}학년 ${cl.class_no}반 학생 (담임 ${adminEsc(cl.teacher_nickname || '-')})</h2>${adminTable(['학생', '기록', '최근 읽은 날', '가입일'], adminStudentRows(adminState.students), '학생이 없어요.')}</section>`;
  }
  return `<div class="shell"><div class="container"><header class="topbar"><div class="brand"><span class="brand-mark"><img src="assets/logo.svg" alt="독서한걸음 로고" /></span><div>독서한걸음<small>슈퍼 관리자 · 읽기 전용</small></div></div><div class="topbar-actions"><button class="ghost-button" data-admin="logout">로그아웃</button></div></header>
    <section class="admin-stats">${adminStat('학교', s.schools)}${adminStat('교사', s.teachers)}${adminStat('학급', s.classes)}${adminStat('학생', s.students)}${adminStat('독서 기록', s.records)}</section>
    ${crumbs}<div class="error">${adminEsc(adminState.error)}</div>${body}${adminStudentModal()}</div></div>`;
}
