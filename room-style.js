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
const ROOM_ZOOM = 1.4;   // 방을 1.4배 넓게 (최대 1008px = 720px × 1.4). 아이템 크기 그대로, 놓을 자리만 늘어나요
const roomZoomFor = () => ROOM_ZOOM;   // 학생 방·선생님 방 같은 크기
function pixelSrc(src) {
  if (getRoomStyle() !== 'dot' || !src) return src;
  const m = /^assets\/room\/([a-z0-9_]+)\.png/.exec(src);
  return m && DOT_ITEMS.has(m[1]) ? `assets/room/dot/${m[1]}.png?v=3` : src;
}

// ---------- 미니미 옷 입히기 ----------
// 부위별 그림(assets/room/dot/minimi/)을 겹쳐서 그려요. 선택지는 minimi-data.js (scripts/cyroom_minimi.py가 만들어요)
// 방에는 'minimi' 아이템 하나가 서 있고, 생김새(look)는 user_minimi 테이블에 따로 저장돼요.
const MM = window.MINIMI_DATA || null;
const MINIMI_ITEM_ID = 'minimi';
const MM_GROUPS = [['preset', '⭐ 캐릭터'], ['hair', '💇 머리'], ['hairColor', '🎨 머리색'], ['face', '😊 얼굴'], ['skin', '🙂 피부'],
  ['top', '👕 옷'], ['bottom', '👖 하의'], ['shoes', '👟 신발'], ['hat', '🎀 모자·장식'], ['glasses', '👓 안경'], ['hand', '✋ 손에 든 것']];
const MM_SAY_MAX = 30;   // 말풍선 글자 수 (서버도 같은 기준으로 검사해요)
const mmEditor = { draft: null, group: 'preset', say: null };
const minimiSayClean = text => String(text ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MM_SAY_MAX);
function minimiBubble(say) { const text = minimiSayClean(say); return text ? `<span class="mm-bubble">${mmEsc(text)}</span>` : ''; }
const mmEsc = v => String(v ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));

function minimiLook(look) {
  if (!MM) return {};
  const base = MM.presets[0][1], out = {};
  for (const key of Object.keys(base)) out[key] = (MM[key] || []).some(o => o[0] === look?.[key]) ? look[key] : base[key];
  return out;
}
function minimiLayers(look) {
  const L = minimiLook(look), n = [];   // 순서는 scripts/cyroom_minimi.py의 compose()와 같아요
  if (MM.hairBack.includes(L.hair)) n.push(`hairb_${L.hair}_${L.hairColor}`);
  n.push(`legs_${L.skin}`, `shoes_${L.shoes}`);
  if (!MM.covers.includes(L.top)) n.push(`bottom_${L.bottom}`);
  n.push(`hands_${L.skin}`, `top_${L.top}`, `head_${L.skin}`, `face_${L.face}`);
  if (L.glasses !== 'none') n.push(`glasses_${L.glasses}`);
  n.push(`hairf_${L.hair}_${L.hairColor}`);
  if (L.hat !== 'none') n.push(`hat_${L.hat}`);
  if (L.hand !== 'none') n.push(`hand_${L.hand}`);
  return n.map(name => `assets/room/dot/minimi/${name}.png?v=${MM.version}`);
}
function minimiStack(look, cls = '', flip = false) {
  if (!MM) return '';
  return `<span class="minimi-stack ${cls}"${flip ? ' style="transform:scaleX(-1)"' : ''}>${minimiLayers(look).map(src => `<img src="${src}" alt="" draggable="false" />`).join('')}</span>`;
}
function minimiEditorHtml(savedLook, standing, savedSay = '', suggestions = []) {
  if (!MM) return '<div class="empty">미니미를 불러오지 못했어요.</div>';
  const draft = mmEditor.draft = minimiLook(mmEditor.draft || savedLook);
  if (mmEditor.say === null) mmEditor.say = minimiSayClean(savedSay);
  const g = mmEditor.group;
  const groups = MM_GROUPS.map(([key, label]) => `<button type="button" class="chip${g === key ? ' active' : ''}" data-action="mm-group" data-group="${key}">${label}</button>`).join('');
  let cards;
  if (g === 'preset') cards = MM.presets.map(([name, look], i) => `<button type="button" class="mm-card" data-action="mm-preset" data-index="${i}">${minimiStack(look, 'thumb')}<b>${mmEsc(name)}</b></button>`).join('');
  else if (g === 'skin' || g === 'hairColor' || g === 'shoes') cards = MM[g].map(([key, name, color]) => `<button type="button" class="mm-card mm-swatch${draft[g] === key ? ' active' : ''}" data-action="mm-pick" data-group="${g}" data-value="${key}"><i style="background:${color}"></i><b>${mmEsc(name)}</b></button>`).join('');
  else cards = MM[g].map(([key, name]) => `<button type="button" class="mm-card${draft[g] === key ? ' active' : ''}" data-action="mm-pick" data-group="${g}" data-value="${key}">${minimiStack({ ...draft, [g]: key }, 'thumb')}<b>${mmEsc(name)}</b></button>`).join('');
  const note = g === 'bottom' && MM.covers.includes(draft.top) ? '<p class="mm-note">지금 옷(원피스·로브 등)이 하의를 덮고 있어요.</p>' : '';
  const quick = ['놀러 와~ ♥', '오늘도 한 걸음!', '책 추천해 줘!', ...suggestions].map(t => minimiSayClean(t)).filter(Boolean)
    .map(t => `<button type="button" class="chip" data-action="mm-say" data-say="${mmEsc(t)}">${mmEsc(t)}</button>`).join('');
  const sayBox = `<div class="mm-say"><label for="mm-say-input">💬 말풍선 <small>(${MM_SAY_MAX}자까지 · 친구들도 볼 수 있어요)</small></label><input id="mm-say-input" maxlength="${MM_SAY_MAX}" value="${mmEsc(mmEditor.say)}" placeholder="미니미가 할 말을 적어 보세요" autocomplete="off" /><div class="mm-quick">${quick}</div></div>`;
  return `<section class="panel minimi-editor"><div class="mm-preview"><div class="mm-stage">${minimiBubble(mmEditor.say)}${minimiStack(draft, 'big')}</div>${sayBox}<button type="button" class="primary-button" data-action="mm-save">💾 저장하고 방에 세우기</button><button type="button" class="ghost-button" data-action="mm-reset">처음으로 되돌리기</button><small>${standing ? '방에 서 있는 미니미가 바로 바뀌어요.' : '저장하면 방 가운데에 미니미가 서요.'}</small></div><div class="mm-options"><div class="mm-groups">${groups}</div>${note}<div class="mm-grid">${cards}</div></div></section>`;
}
document.addEventListener('click', event => {
  const el = event.target.closest('[data-action^="mm-"]');
  const action = el?.dataset.action;
  if (!action || action === 'mm-save') return;
  if (action === 'mm-group') mmEditor.group = el.dataset.group;
  else if (action === 'mm-preset') mmEditor.draft = minimiLook(MM.presets[Number(el.dataset.index)][1]);
  else if (action === 'mm-pick') mmEditor.draft = minimiLook({ ...mmEditor.draft, [el.dataset.group]: el.dataset.value });
  else if (action === 'mm-reset') { mmEditor.draft = null; mmEditor.say = null; }
  else if (action === 'mm-say') mmEditor.say = minimiSayClean(el.dataset.say);
  const y = window.scrollY; render(); window.scrollTo(0, y);
});
document.addEventListener('input', event => {   // 말풍선 글은 다시 그리지 않고 미리보기만 바꿔요 (입력 중 커서 유지)
  if (event.target.id !== 'mm-say-input') return;
  mmEditor.say = event.target.value.slice(0, MM_SAY_MAX);
  const stage = document.querySelector('.mm-stage');
  if (stage) { stage.querySelector('.mm-bubble')?.remove(); stage.insertAdjacentHTML('afterbegin', minimiBubble(mmEditor.say)); }
});
