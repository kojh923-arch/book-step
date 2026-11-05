// 선생님 방 꾸미기: 스티커·레벨과 상관없이 모든 아이템을 자유롭게 놓을 수 있어요.
// 우리 반 학생들은 '친구 방 구경'에서 선생님 방을 보고 따라 할 수 있어요. (supabase-room.sql)
// teacher-dashboard.js보다 먼저 불러오며, escapeHtml·sb·render·keepScroll은 그쪽에서 가져다 써요.
const TROOM_MAX = 60;
const TROOM_TABS = [['furniture', '🛋️ 가구·소품'], ['wallpaper', '🎨 벽지'], ['floor', '🟫 바닥']];
const TROOM_CATS = [['furniture', '가구'], ['seat', '의자·쿠션'], ['lamp', '조명'], ['wall', '벽 장식'], ['decor', '인테리어'], ['tech', '전자기기'], ['stationery', '문구·소품']];
const troom = { ready: false, items: [], placed: {}, objects: [], tab: 'furniture', cat: null, selected: null, busy: false, drag: null };

async function loadTeacherRoom() {
  troom.ready = false;
  if (!sb) return;
  const [items, placed, objects] = await Promise.all([
    sb.from('room_items').select('*').order('price').order('id'),
    sb.from('user_room').select('slot,item_id'),
    sb.from('room_objects').select('id,item_id,x,y,scale,flip,z').order('z')
  ]);
  if (items.error || placed.error || objects.error) return;
  troom.items = items.data || [];
  troom.placed = Object.fromEntries((placed.data || []).map(row => [row.slot, row.item_id]));
  troom.objects = (objects.data || []).map(o => ({ ...o, x: Number(o.x), y: Number(o.y), scale: Number(o.scale) }));
  if (!troom.objects.some(o => o.id === troom.selected)) troom.selected = null;
  troom.ready = true;
}

const troomItem = id => troom.items.find(item => item.id === id);
const troomDefault = slot => troom.items.find(item => item.slot === slot && item.price === 0 && item.reward_level == null);
const troomCurrent = slot => troomItem(troom.placed[slot]) || troomDefault(slot);
const troomClamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const troomVisual = item => item.img ? `<img src="${escapeHtml(item.img)}" alt="" loading="lazy" draggable="false" />` : item.color ? `<span class="room-swatch" style="background:${escapeHtml(item.color)}"></span>` : escapeHtml(item.emoji || '');

function troomObjHtml(obj) {
  const item = troomItem(obj.item_id);
  if (!item?.img) return '';
  const handles = ['nw', 'ne', 'sw', 'se'].map(corner => `<i class="obj-handle h-${corner}" data-handle="${corner}"></i>`).join('');
  return `<div class="room-obj${troom.selected === obj.id ? ' selected' : ''}" data-oid="${escapeHtml(obj.id)}" style="left:${obj.x}%;top:${obj.y}%;width:${item.base_w * obj.scale}%;z-index:${10 + Number(obj.z || 0)}"><img src="${escapeHtml(item.img)}" alt="${escapeHtml(item.name)}" draggable="false" style="transform:scaleX(${obj.flip ? -1 : 1})" />${handles}</div>`;
}
function troomScene() {
  const wall = troomCurrent('wallpaper'), floor = troomCurrent('floor');
  const style = `--wall:${escapeHtml(wall?.color || '#fff4dc')};--floor:${escapeHtml(floor?.color || '#e8c9a0')}`;
  const objs = [...troom.objects].sort((a, b) => a.z - b.z).map(troomObjHtml).join('');
  const hint = troom.objects.length ? '' : '<p class="room-empty-hint">아래에서 아이템을 눌러 방에 놓아 보세요!</p>';
  return `<div class="room" id="troom-stage" style="${style}"><div class="room-wall"></div><div class="room-floor"></div>${objs}${hint}</div>`;
}
function troomBar() {
  const obj = troom.objects.find(o => o.id === troom.selected);
  const count = `<small class="obj-count">방에 놓은 아이템 ${troom.objects.length}/${TROOM_MAX}</small>`;
  if (!obj) return `<div class="obj-bar" id="troom-bar"><span class="obj-hint">아이템을 눌러 선택하고, 끌어서 옮기고, 모서리를 끌어 크기를 바꿔요.</span>${count}</div>`;
  return `<div class="obj-bar active" id="troom-bar"><strong>${escapeHtml(troomItem(obj.item_id)?.name || '')}</strong><button class="secondary-button" data-action="troom-flip">↔ 반전</button><button class="secondary-button" data-action="troom-front">⬆ 앞으로</button><button class="secondary-button danger" data-action="troom-remove">🗑 빼기</button>${count}</div>`;
}
function troomCard(item) {
  if (item.slot === 'object') {
    const n = troom.objects.filter(o => o.item_id === item.id).length;
    return `<article class="shop-item${n ? ' placed' : ''}"><div class="shop-icon">${troomVisual(item)}</div><strong>${escapeHtml(item.name)}</strong>${n ? `<small class="shop-slot">${n}개 놓임</small>` : ''}<button class="primary-button" data-action="troom-add" data-item-id="${escapeHtml(item.id)}">놓기</button></article>`;
  }
  const used = troomCurrent(item.slot)?.id === item.id;
  return `<article class="shop-item${used ? ' placed' : ''}"><div class="shop-icon">${troomVisual(item)}</div><strong>${escapeHtml(item.name)}</strong>${used ? '<button class="secondary-button" disabled>사용 중</button>' : `<button class="primary-button" data-action="troom-set" data-item-id="${escapeHtml(item.id)}">적용</button>`}</article>`;
}

function teacherRoomPanel() {
  const head = '<section class="panel teacher-room-panel"><div class="panel-header"><div><p class="eyebrow">MY ROOM</p><h2>선생님 방 꾸미기</h2></div></div>';
  if (!troom.ready) return `${head}<div class="empty">방 꾸미기를 불러오지 못했어요.<br>Supabase에서 supabase-room.sql을 다시 실행해 주세요.</div></section>`;
  const furniture = troom.tab === 'furniture';
  const tabs = TROOM_TABS.map(([key, label]) => `<button class="slot-tab${troom.tab === key ? ' active' : ''}" data-action="troom-tab" data-tab="${key}">${label}</button>`).join('');
  const filter = furniture ? `<div class="slot-filter"><button class="chip${troom.cat ? '' : ' active'}" data-action="troom-cat" data-cat="">전체</button>${TROOM_CATS.map(([key, label]) => `<button class="chip${troom.cat === key ? ' active' : ''}" data-action="troom-cat" data-cat="${key}">${label}</button>`).join('')}</div>` : '';
  const visible = troom.items.filter(item => furniture ? item.slot === 'object' && item.category !== 'pet' && (!troom.cat || item.category === troom.cat) : item.slot === troom.tab);
  return `${head}<p class="subtitle">선생님은 스티커 없이 모든 아이템을 마음껏 쓸 수 있어요. 우리 반 학생들이 ‘친구 방 구경’에서 선생님 방을 보고 따라 꾸밀 수 있어요.</p>${troomScene()}${troomBar()}<div class="slot-tabs">${tabs}</div>${filter}<div class="shop-grid">${visible.map(troomCard).join('') || '<div class="empty">아직 준비된 아이템이 없어요.</div>'}</div></section>`;
}

// 끌어서 옮기기 · 모서리로 크기 조절
function troomSelect(id) {
  troom.selected = id;
  document.querySelectorAll('#troom-stage .room-obj').forEach(el => el.classList.toggle('selected', el.dataset.oid === id));
  const bar = document.querySelector('#troom-bar');
  if (bar) bar.outerHTML = troomBar();
}
async function troomSave(obj) {
  try { const { error } = await sb.rpc('update_object', { p_id: obj.id, p_x: obj.x, p_y: obj.y, p_scale: obj.scale, p_flip: obj.flip }); if (error) throw error; }
  catch (error) { alert(error.message || '저장하지 못했어요. 다시 시도해 주세요.'); await loadTeacherRoom().catch(() => {}); keepScroll(render); }
}
document.addEventListener('pointerdown', event => {
  const stage = event.target.closest('#troom-stage');
  if (!stage) return;
  const el = event.target.closest('.room-obj');
  if (!el) { if (troom.selected) troomSelect(null); return; }
  const obj = troom.objects.find(o => o.id === el.dataset.oid);
  if (!obj) return;
  event.preventDefault();
  troomSelect(obj.id);
  const rect = stage.getBoundingClientRect();
  const cx = rect.left + rect.width * obj.x / 100, cy = rect.top + rect.height * obj.y / 100;
  troom.drag = { obj, el, rect, mode: event.target.closest('[data-handle]') ? 'scale' : 'move', startX: event.clientX, startY: event.clientY, x0: obj.x, y0: obj.y, scale0: obj.scale, dist0: Math.max(10, Math.hypot(event.clientX - cx, event.clientY - cy)), cx, cy, moved: false, id: event.pointerId };
  try { el.setPointerCapture(event.pointerId); } catch {}
});
document.addEventListener('pointermove', event => {
  const d = troom.drag;
  if (!d || event.pointerId !== d.id) return;
  if (d.mode === 'move') {
    const dx = event.clientX - d.startX, dy = event.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < 3) return;
    d.moved = true;
    d.obj.x = troomClamp(d.x0 + dx / d.rect.width * 100, 0, 100);
    d.obj.y = troomClamp(d.y0 + dy / d.rect.height * 100, 0, 100);
    d.el.style.left = d.obj.x + '%'; d.el.style.top = d.obj.y + '%';
  } else {
    d.moved = true;
    d.obj.scale = troomClamp(d.scale0 * Math.hypot(event.clientX - d.cx, event.clientY - d.cy) / d.dist0, 0.4, 2.5);
    d.el.style.width = troomItem(d.obj.item_id).base_w * d.obj.scale + '%';
  }
});
async function troomEndDrag(event) {
  const d = troom.drag;
  if (!d || event.pointerId !== d.id) return;
  troom.drag = null;
  if (d.moved) await troomSave(d.obj);
}
document.addEventListener('pointerup', troomEndDrag);
document.addEventListener('pointercancel', troomEndDrag);

document.addEventListener('click', async event => {
  const el = event.target.closest('[data-action]');
  const action = el?.dataset.action;
  if (!action?.startsWith('troom-')) return;
  if (action === 'troom-tab') { troom.tab = el.dataset.tab; troom.cat = null; keepScroll(render); return; }
  if (action === 'troom-cat') { troom.cat = el.dataset.cat || null; keepScroll(render); return; }
  if (troom.busy || !sb) return;
  troom.busy = true;
  try {
    const obj = troom.objects.find(o => o.id === troom.selected);
    if (action === 'troom-flip' && obj) {
      obj.flip = !obj.flip;
      const img = document.querySelector(`#troom-stage .room-obj[data-oid="${obj.id}"] img`);
      if (img) img.style.transform = `scaleX(${obj.flip ? -1 : 1})`;
      await troomSave(obj);
    } else if (action === 'troom-front' && obj) {
      const { error } = await sb.rpc('front_object', { p_id: obj.id }); if (error) throw error;
      await loadTeacherRoom();
    } else if (action === 'troom-remove' && obj) {
      const { error } = await sb.rpc('remove_object', { p_id: obj.id }); if (error) throw error;
      troom.selected = null; await loadTeacherRoom();
    } else if (action === 'troom-add') {
      const item = troomItem(el.dataset.itemId);
      const wall = item?.category === 'wall';
      const x = 50 + (Math.random() - .5) * 30, y = wall ? 22 + Math.random() * 10 : 68 + Math.random() * 10;
      const { data: newId, error } = await sb.rpc('add_object', { p_item_id: el.dataset.itemId, p_x: x, p_y: y }); if (error) throw error;
      await loadTeacherRoom(); troom.selected = newId;
    } else if (action === 'troom-set') {
      const { error } = await sb.rpc('place_item', { p_item_id: el.dataset.itemId }); if (error) throw error;
      await loadTeacherRoom();
    }
  } catch (error) { alert(error.message || '처리하지 못했어요. 잠시 후 다시 시도해 주세요.'); await loadTeacherRoom().catch(() => {}); }
  troom.busy = false;
  keepScroll(render);
});
