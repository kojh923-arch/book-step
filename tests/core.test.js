// 실행: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const c = require('../lib/core.js');

test('loginEmail: 기존 로그인 ID와 동일해야 한다 (바뀌면 기존 학생이 로그인 못 함)', () => {
  assert.equal(c.loginEmail('지현', ''), 'student-7KeA7ZiE@bookstep.local');
  assert.equal(c.loginEmail('지현', 'abc123'), 'student2-QUJDMTIzOuyngO2YhA@bookstep.local');
  assert.equal(c.loginEmail('Kim Min', ' ab1 '), 'student2-QUIxOktpbSBNaW4@bookstep.local');
  assert.equal(c.loginEmail('a', 'X'), 'student2-WDph@bookstep.local');
});

test('levelForCount: 경계값', () => {
  assert.equal(c.levelForCount(0)[1], '독서 준비생');
  assert.equal(c.levelForCount(4)[1], '독서 준비생');
  assert.equal(c.levelForCount(5)[1], '책 첫걸음');
  assert.equal(c.levelForCount(199)[1], '독서 고수');
  assert.equal(c.levelForCount(200)[1], '책 마스터');
  assert.equal(c.levelForCount(9999)[1], '책 마스터');
});

test('stickerTotal: 기록 + 보너스 + 도장 3개당 1개', () => {
  assert.equal(c.stickerTotal(10, 0, 0), 10);
  assert.equal(c.stickerTotal(10, 2, 2), 12);
  assert.equal(c.stickerTotal(10, 2, 3), 13);
  assert.equal(c.stickerTotal(10, undefined, 7), 12);
});

test('weekStartString: 월요일 시작', () => {
  assert.equal(c.weekStartString(new Date(2026, 10, 6)), '2026-11-02'); // 금 → 월
  assert.equal(c.weekStartString(new Date(2026, 10, 8)), '2026-11-02'); // 일
  assert.equal(c.weekStartString(new Date(2026, 10, 9)), '2026-11-09'); // 월
});

test('weeklyStreakFor', () => {
  const now = new Date(2026, 10, 6);
  assert.deepEqual(c.weeklyStreakFor(new Set(), now), { count: 0, thisWeekDone: false });
  assert.deepEqual(c.weeklyStreakFor(new Set(['2026-11-03', '2026-10-28', '2026-10-20']), now), { count: 3, thisWeekDone: true });
  // 이번 주 아직 안 읽었어도 지난주까지 이어진 기록은 유지
  assert.deepEqual(c.weeklyStreakFor(new Set(['2026-10-28', '2026-10-21']), now), { count: 2, thisWeekDone: false });
  // 한 주 건너뛰면 끊김
  assert.deepEqual(c.weeklyStreakFor(new Set(['2026-11-03', '2026-10-21']), now), { count: 1, thisWeekDone: true });
});

test('esc / shortDate / localDateString', () => {
  assert.equal(c.esc('<a href="x">&\'</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
  assert.equal(c.shortDate('2026-03-05T10:00:00'), '3/5');
  assert.equal(c.localDateString(new Date(2026, 0, 9)), '2026-01-09');
});
