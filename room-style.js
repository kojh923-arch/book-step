// 방 보기 방식: 싸이월드 도트 방(벽 두 면 + 마름모 바닥 + 도트 그림)으로 고정했어요.
// 화면 표시만 바꿔요. 저장된 위치·크기 값과 DB는 그대로예요. (index.html, teacher.html에서 가장 먼저 불러와요)
const ROOM_STYLES = [['basic', '🏠 기본'], ['cy', '🏡 미니룸'], ['dot', '👾 도트']];
const ROOM_STYLE_KEY = 'bookstep-room-style';

function getRoomStyle() { return 'dot'; }   // 예전 선택값(localStorage)은 더 이상 쓰지 않아요
function setRoomStyle(value) { try { localStorage.setItem(ROOM_STYLE_KEY, value); } catch {} }
function roomStyleClass() {
  const style = getRoomStyle();
  return style === 'basic' ? '' : ` room-cy${style === 'dot' ? ' room-dot' : ''}`;
}
function roomStyleSwitcher(action) {
  if (ROOM_STYLES.length) return '';   // 도트 방으로 고정 → 스위치 숨김
  const now = getRoomStyle();
  return `<div class="room-style-switch" role="group" aria-label="방 모양">${ROOM_STYLES.map(([key, label]) => `<button type="button" class="chip${now === key ? ' active' : ''}" data-action="${action}" data-style="${key}">${label}</button>`).join('')}</div>`;
}
// 벽 두 면 + 마름모 바닥. 160×100 좌표 기준: 바닥 꼭짓점 (80,42) (150,68) (80,96) (10,68), 벽 높이 36
function roomBackdrop() {
  if (getRoomStyle() === 'basic') return '';
  return '<div class="cy-wall cy-wall-l"></div><div class="cy-wall cy-wall-r"></div><div class="cy-floor"></div>'
    + '<svg class="cy-lines" viewBox="0 0 160 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="80,42 150,68 80,96 10,68"/><polyline points="10,68 10,32 80,6 150,32 150,68"/><line x1="80" y1="42" x2="80" y2="6"/></svg>';
}

// 도트 모드: 싸이월드풍으로 새로 그린 도트 그림(assets/room/dot/, scripts/cyroom_items.py로 생성)으로 바꿔 보여줘요. DB의 그림 경로는 그대로예요.
// 도트 그림이 없는 아이템은 원래 그림을 그대로 써요.
const DOT_ITEMS = new Set(['acoustic_guitar', 'air_purifier', 'blanket_basket', 'book_cart', 'bookcase5', 'clothes_hanger', 'dday_calendar', 'design_frame', 'desktop_pc', 'drawer3', 'eraser_cleaner', 'floor_cushion', 'floor_table', 'full_mirror', 'headphone_stand', 'keyboard_mouse', 'laptop', 'memo_board', 'memo_clip', 'mini_board', 'mini_bookrack', 'mini_shelf', 'monstera', 'mood_lamp', 'pencil_sharpener', 'phone_stand', 'power_strip_box', 'scissors_tape', 'sitting_ball', 'sitting_chair', 'stand_lamp', 'storage_bed', 'storage_stool', 'study_desk', 'study_partition', 'swivel_chair', 'tablet_pencil', 'tumbler_rack', 'wall_pocket']);
const MINIMI_CATEGORY = 'minimi';
const ROOM_ZOOM = 1.25;   // 학생 방을 1.25배 넓게 (아이템 크기 그대로, 놓을 자리만 늘어나요)
const roomZoomFor = isTeacher => isTeacher ? 1.4 : ROOM_ZOOM;
function pixelSrc(src) {
  if (getRoomStyle() !== 'dot' || !src) return src;
  const m = /^assets\/room\/([a-z0-9_]+)\.png/.exec(src);
  return m && DOT_ITEMS.has(m[1]) ? `assets/room/dot/${m[1]}.png?v=3` : src;
}
