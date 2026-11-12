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
// 벽 두 면 + 마름모 바닥. 160×100 좌표 기준: 바닥 꼭짓점 (80,42) (150,69) (80,96) (10,69), 벽 높이 36
// 방 비율(875:708)과 함께 바닥이 정확한 2:1 쿼터뷰가 되어 아이템 그림의 기울기와 맞아요.
function roomBackdrop() {
  if (getRoomStyle() === 'basic') return '';
  return '<div class="cy-wall cy-wall-l"></div><div class="cy-wall cy-wall-r"></div><div class="cy-floor"></div>'
    + '<svg class="cy-lines" viewBox="0 0 160 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="80,42 150,69 80,96 10,69"/><polyline points="10,69 10,33 80,6 150,33 150,69"/><line x1="80" y1="42" x2="80" y2="6"/></svg>';
}

// 도트 모드: 싸이월드풍으로 새로 그린 도트 그림(assets/room/dot/, scripts/cyroom_items.py로 생성)으로 바꿔 보여줘요. DB의 그림 경로는 그대로예요.
// 도트 그림이 없는 아이템은 원래 그림을 그대로 써요.
const DOT_ITEMS = new Set(['acoustic_guitar', 'air_purifier', 'blanket_basket', 'book_cart', 'bookcase5', 'clothes_hanger', 'dday_calendar', 'design_frame', 'desktop_pc', 'drawer3', 'eraser_cleaner', 'floor_cushion', 'floor_table', 'full_mirror', 'headphone_stand', 'keyboard_mouse', 'laptop', 'memo_board', 'memo_clip', 'mini_board', 'mini_bookrack', 'mini_shelf', 'monstera', 'mood_lamp', 'pencil_sharpener', 'phone_stand', 'power_strip_box', 'scissors_tape', 'sitting_ball', 'sitting_chair', 'stand_lamp', 'storage_bed', 'storage_stool', 'study_desk', 'study_partition', 'swivel_chair', 'tablet_pencil', 'tumbler_rack', 'wall_pocket']);
const MINIMI_CATEGORY = 'minimi';
const ROOM_ZOOM = 1.4;   // 방을 1.4배 넓게 (최대 1008px = 720px × 1.4). 아이템 크기 그대로, 놓을 자리만 늘어나요
const roomZoomFor = () => ROOM_ZOOM;   // 학생 방·선생님 방 같은 크기
function pixelSrc(src, back = false) {
  if (getRoomStyle() !== 'dot' || !src) return src;
  const m = /^assets\/room\/([a-z0-9_]+)\.png/.exec(src);
  if (!m || !DOT_ITEMS.has(m[1])) return src;
  return back && roomCanTurnId(m[1]) ? `assets/room/dot/${m[1]}_back.png?v=2` : `assets/room/dot/${m[1]}.png?v=4`;
}

// ---------- 돌리기(네 방향)와 벽에 딱 붙이기 ----------
// 방향이 있는 아이템(의자·책상 등)은 앞모습/뒷모습 × 좌우 반전으로 네 방향을 돌려요. 그림 정보: room-dot-data.js
const RD = window.ROOM_DOT || { back: [], wall: [], anchors: {} };
const ROOM_H = 708 / 875;   // 방 세로/가로 비율 (styles.css의 aspect-ratio와 같아요)
const SNAP_CATEGORIES = ['furniture', 'seat', 'decor'];   // 조명은 무드 등처럼 가구 위에 올리는 것도 있어서 빼요
const TURN_STEPS = [[false, false], [true, false], [false, true], [true, true]];
const roomItemKey = item => /^assets\/room\/([a-z0-9_]+)\.png/.exec(item?.img || '')?.[1] || null;
function roomCanTurnId(id) { return RD.back.includes(id); }
const roomCanTurn = item => roomCanTurnId(roomItemKey(item));
function nextTurn(obj) {
  const i = TURN_STEPS.findIndex(([f, b]) => f === Boolean(obj.flip) && b === Boolean(obj.back));
  return TURN_STEPS[(i + 1) % TURN_STEPS.length];
}
// 아이템의 뒤쪽 바닥 모서리가 벽선 가까이(방 폭의 3.5% 안) 오면 벽에 딱 붙여요. 붙일 곳이 없으면 null
function roomSnap(obj, item, zoom) {
  const id = roomItemKey(item);
  // 바닥에 놓는 큰 가구만 붙여요 (책상 위에 올리는 노트북·문구 같은 소품은 그대로)
  if (!id || RD.wall.includes(id) || !SNAP_CATEGORIES.includes(item.category)) return null;
  const an = RD.anchors[obj.back && roomCanTurnId(id) ? `${id}_back` : id];
  if (!an) return null;
  const [fx0, fy, aspect] = an, fx = obj.flip ? 1 - fx0 : fx0;
  const w = item.base_w * obj.scale / zoom / 100, h = w * aspect;
  const cx = obj.x / 100, cy = obj.y / 100 * ROOM_H;
  const ax = cx - w / 2 + fx * w, ay = cy - h / 2 + fy * h, top = .42 * ROOM_H, near = .035;
  const tl = top + .25 - .5 * ax - ay;   // 왼쪽 벽까지 (오른쪽 아래 방향으로 밀기)
  const tr = top - .25 + .5 * ax - ay;   // 오른쪽 벽까지 (왼쪽 아래 방향으로 밀기)
  const onLeft = ax > .04 && ax < .52 && Math.abs(tl) < near, onRight = ax > .48 && ax < .96 && Math.abs(tr) < near;
  let dx = 0, dy = 0;
  if (onLeft && onRight) { dx = .5 - ax; dy = top - ay; }
  else if (onLeft) { dx = tl; dy = tl * .5; }
  else if (onRight) { dx = -tr; dy = tr * .5; }
  else return null;
  const clamp = v => Math.min(100, Math.max(0, v));
  return { x: clamp((cx + dx) * 100), y: clamp((cy + dy) / ROOM_H * 100) };
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

// 단색 벽지·바닥에만 기본 줄무늬·마루 선을 얹어요 (무늬 벽지·바닥은 자기 무늬 그대로)
function roomSurfaceClass(wallColor, floorColor) {
  const plain = c => !c || /^#[0-9a-f]{3,8}$/i.test(String(c).trim());
  return `${plain(wallColor) ? ' wall-plain' : ''}${plain(floorColor) ? ' floor-plain' : ''}`;
}

// ---------- 방문자 수(TODAY / TOTAL)와 방명록 ----------
const GB_STAMPS = [['foot', '👣', '다녀갔어요'], ['heart', '❤️', '방이 예뻐요'], ['star', '⭐', '멋져요'], ['good', '👍', '최고야'], ['book', '📚', '책 추천해 줘'], ['party', '🎉', '축하해']];
const GB_MAX = 40;
const gbDraft = { stamp: 'foot', msg: '' };
const gbStamp = key => GB_STAMPS.find(s => s[0] === key) || GB_STAMPS[0];
function roomCounterHtml(counts, owner = '') {
  return `<div class="room-counter">${owner ? `<strong>${mmEsc(owner)}</strong>` : ''}<span>TODAY <b>${counts?.today ?? 0}</b></span><i></i><span>TOTAL <b>${counts?.total ?? 0}</b></span></div>`;
}
function gbTime(t) {
  const d = new Date(t), m = Math.floor((Date.now() - d) / 60000);
  if (m < 1) return '방금'; if (m < 60) return `${m}분 전`; if (m < 1440) return `${Math.floor(m / 60)}시간 전`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
function guestbookHtml(entries, { write = false, title = '📒 방명록', empty = '아직 방명록이 없어요.' } = {}) {
  const form = write ? `<div class="gb-form"><div class="gb-stamps">${GB_STAMPS.map(([key, emoji, label]) => `<button type="button" class="gb-stamp-btn${gbDraft.stamp === key ? ' active' : ''}" data-action="gb-stamp" data-stamp="${key}" title="${label}"><span>${emoji}</span><small>${label}</small></button>`).join('')}</div><div class="gb-write"><input id="gb-msg" maxlength="${GB_MAX}" value="${mmEsc(gbDraft.msg)}" placeholder="한마디 남기기 (${GB_MAX}자까지, 안 써도 돼요)" autocomplete="off" /><button type="button" class="primary-button" data-action="gb-send">남기기</button></div><small class="gb-rule">한 방에 하루 3개까지 남길 수 있어요. 친구가 기분 좋아지는 말로 남겨 주세요 😊</small></div>` : '';
  const list = entries == null ? '<div class="empty">불러오는 중이에요…</div>'
    : entries.length ? `<ul class="gb-list">${entries.map(e => { const [, emoji, label] = gbStamp(e.stamp); return `<li class="gb-item"><span class="gb-emoji">${emoji}</span><div class="gb-body"><b>${mmEsc(e.is_teacher && !/선생님$/.test(e.nickname) ? e.nickname + ' 선생님' : e.nickname)}</b><small>${gbTime(e.created_at)}</small><p>${mmEsc(e.message || label)}</p></div>${e.can_delete ? `<button type="button" class="ghost-button gb-del" data-action="gb-del" data-id="${mmEsc(e.id)}">지우기</button>` : ''}</li>`; }).join('')}</ul>`
    : `<div class="empty">${empty}</div>`;
  return `<section class="panel guestbook"><h3>${title}</h3>${form}${list}</section>`;
}
document.addEventListener('click', event => {
  const el = event.target.closest('[data-action="gb-stamp"]');
  if (!el) return;
  gbDraft.stamp = el.dataset.stamp;
  document.querySelectorAll('.gb-stamp-btn').forEach(b => b.classList.toggle('active', b === el));
});
document.addEventListener('input', event => { if (event.target.id === 'gb-msg') gbDraft.msg = event.target.value.slice(0, GB_MAX); });
