// 순수 함수 모음 (DB·화면과 무관). app-supabase.js보다 먼저 로드됩니다.
// 동작은 기존 app-supabase.js의 코드와 동일하며, Node 테스트(tests/)에서도 불러옵니다.
const LEVELS = [
  [0, '독서 준비생', '🌰'], [5, '책 첫걸음', '🌱'], [10, '책 새싹', '🌱'], [20, '독서 탐험가', '🌿'],
  [40, '열정 독서가', '🌿'], [60, '이야기 수집가', '🪴'], [80, '독서 여행자', '🪴'], [100, '책의 친구', '🌳'],
  [130, '지식 탐험가', '🌳'], [160, '독서 고수', '📖'], [200, '책 마스터', '🏆']
];
const esc = (v = '') => String(v).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
// 학급코드가 있으면 학급별 로그인 ID(student2-), 없으면 예전 방식(student-)을 씁니다.
const loginEmail = (nickname, classCode = '') => {
  const code = String(classCode || '').trim().toUpperCase();
  const encoded = btoa(unescape(encodeURIComponent(code ? `${code}:${nickname.trim()}` : nickname.trim()))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${code ? 'student2' : 'student'}-${encoded}@bookstep.local`;
};
const levelForCount = count => LEVELS.reduce((r, x) => count >= x[0] ? x : r, LEVELS[0]);
function localDateString(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function parseLocalDate(text) { const [y, m, d] = String(text).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); }
function weekStartString(date) { const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return localDateString(d); }
function shortDate(text) { const [, m, d] = String(text).slice(0, 10).split('-'); return `${Number(m)}/${Number(d)}`; }
const stampBonusFor = feedbackCount => Math.floor(feedbackCount / 3);
const stickerTotal = (recordCount, bonus, feedbackCount) => recordCount + (bonus || 0) + stampBonusFor(feedbackCount);
// days: 'YYYY-MM-DD' 문자열 집합, now: 기준 날짜
function weeklyStreakFor(days, now = new Date()) {
  const weeks = new Set([...days].map(day => weekStartString(parseLocalDate(day))));
  const cursor = parseLocalDate(weekStartString(now));
  const shift = () => cursor.setDate(cursor.getDate() - 7);
  const key = () => localDateString(cursor);
  const thisWeekDone = weeks.has(key());
  if (!thisWeekDone) shift();
  let count = 0;
  while (weeks.has(key())) { count += 1; shift(); }
  return { count, thisWeekDone };
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LEVELS, esc, today, loginEmail, levelForCount, localDateString, parseLocalDate, weekStartString, shortDate, stampBonusFor, stickerTotal, weeklyStreakFor };
}
