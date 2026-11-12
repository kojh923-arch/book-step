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
// 홈 캐릭터 말풍선: 상황에 맞는 말이 있으면 그중에서, 없으면 요일·기본 말 중에서 날짜(seed)에 따라 하나를 골라요.
// ctx: { total, weekday(0=일), streak, thisWeekDone, toNextLevel, unseenFeedback, stickers, cheers, challenge: { title, daysLeft } | null, seed }
function buddyLineFor(ctx = {}) {
  const { total = 0, weekday = 0, streak = 0, thisWeekDone = false, toNextLevel = 0, unseenFeedback = 0, stickers = 0, cheers = 0, challenge = null, seed = 0 } = ctx;
  const pick = list => list[Math.abs(Math.floor(seed)) % list.length];
  if (!total) return pick(['첫 책을 기록하면 내가 쑥쑥 자라요!', '어떤 책부터 시작해 볼까요?', '첫 스티커가 기다리고 있어요!']);
  const special = [];
  if (unseenFeedback) special.push(`선생님 칭찬이 ${unseenFeedback}개 도착했어요!`);
  if (challenge && challenge.daysLeft >= 0 && challenge.daysLeft <= 2) special.push(challenge.daysLeft === 0 ? '우리 반 챌린지가 오늘 마감이에요!' : `우리 반 챌린지 마감까지 ${challenge.daysLeft}일! 같이 힘내요`);
  if (toNextLevel > 0 && toNextLevel <= 2) special.push(`${toNextLevel}권만 더 읽으면 레벨 업이에요!`);
  if (streak >= 1 && !thisWeekDone) special.push(`${streak}주 연속 기록, 이번 주에 한 권이면 이어져요!`);
  if (streak >= 3 && thisWeekDone) special.push(`${streak}주 연속 독서! 정말 대단해요`);
  if (cheers) special.push(`친구들이 응원을 ${cheers}개 보냈어요!`);
  if (stickers >= 5) special.push(`스티커가 ${stickers}개 모였어요. 방 꾸미러 갈까요?`);
  if (special.length) return pick(special);
  const byDay = [
    ['느긋한 일요일, 책 읽기 딱 좋은 날!', '내일을 위해 오늘 한 쪽만 읽어 볼까요?'],
    ['새로운 한 주! 어떤 책으로 시작할까요?', '월요일도 독서 한 걸음부터!'],
    ['어제보다 한 쪽만 더 읽어 봐요!', '화요일엔 재미있는 책이 최고예요'],
    ['벌써 수요일! 이번 주 책은 읽었나요?', '수요일엔 책 한 걸음!'],
    ['조금만 더 힘내요, 책이 응원해요!', '목요일의 독서는 주말을 즐겁게 해요'],
    ['주말에 읽을 책은 골라 두었나요?', '신나는 금요일, 책과 함께해요!'],
    ['토요일엔 좋아하는 책을 실컷 읽어요!', '오늘은 어떤 이야기를 만날까요?']
  ][((weekday % 7) + 7) % 7];
  const common = thisWeekDone ? ['이번 주도 기록 완료! 최고예요', '읽은 책 이야기가 궁금해요!'] : ['이번 주에 읽은 책 이야기를 들려줘요!', '오늘 읽은 책을 기록해 볼까요?'];
  return pick([...byDay, ...common]);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LEVELS, esc, today, loginEmail, levelForCount, localDateString, parseLocalDate, weekStartString, shortDate, stampBonusFor, stickerTotal, weeklyStreakFor, buddyLineFor };
}
