// 방 보기 방식: 기본 / 싸이월드 미니룸(벽 두 면 + 마름모 바닥) / 도트.
// 화면 표시만 바꿔요. 저장된 위치·크기 값과 DB는 그대로예요. (index.html, teacher.html에서 가장 먼저 불러와요)
const ROOM_STYLES = [['basic', '🏠 기본'], ['cy', '🏡 미니룸'], ['dot', '👾 도트']];
const ROOM_STYLE_KEY = 'bookstep-room-style';

function getRoomStyle() {
  try { const v = localStorage.getItem(ROOM_STYLE_KEY); return ROOM_STYLES.some(s => s[0] === v) ? v : 'basic'; } catch { return 'basic'; }
}
function setRoomStyle(value) { try { localStorage.setItem(ROOM_STYLE_KEY, value); } catch {} }
function roomStyleClass() {
  const style = getRoomStyle();
  return style === 'basic' ? '' : ` room-cy${style === 'dot' ? ' room-dot' : ''}`;
}
function roomStyleSwitcher(action) {
  const now = getRoomStyle();
  return `<div class="room-style-switch" role="group" aria-label="방 모양">${ROOM_STYLES.map(([key, label]) => `<button type="button" class="chip${now === key ? ' active' : ''}" data-action="${action}" data-style="${key}">${label}</button>`).join('')}</div>`;
}
// 벽 두 면 + 마름모 바닥. 160×100 좌표 기준: 바닥 꼭짓점 (80,42) (150,68) (80,96) (10,68), 벽 높이 36
function roomBackdrop() {
  if (getRoomStyle() === 'basic') return '';
  return '<div class="cy-wall cy-wall-l"></div><div class="cy-wall cy-wall-r"></div><div class="cy-floor"></div>'
    + '<svg class="cy-lines" viewBox="0 0 160 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="80,42 150,68 80,96 10,68"/><polyline points="10,68 10,32 80,6 150,32 150,68"/><line x1="80" y1="42" x2="80" y2="6"/></svg>';
}

// 도트 모드: 아이템 그림을 작은 해상도로 줄이고 색을 줄여서 도트 느낌으로 보여줘요. (한 번 만들면 기억해 둬요)
const pixelCache = new Map();
function pixelSrc(src) {
  if (getRoomStyle() !== 'dot' || !src) return src;
  const hit = pixelCache.get(src);
  if (hit && hit !== 'pending') return hit;
  if (!hit) {
    pixelCache.set(src, 'pending');
    const img = new Image();
    img.onload = () => {
      try {
        const w = 56, h = Math.max(1, Math.round(img.naturalHeight * w / img.naturalWidth));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, w, h);
        const frame = ctx.getImageData(0, 0, w, h), px = frame.data;
        for (let i = 0; i < px.length; i += 4) {
          px[i] = Math.round(px[i] / 255 * 5) * 51; px[i + 1] = Math.round(px[i + 1] / 255 * 5) * 51; px[i + 2] = Math.round(px[i + 2] / 255 * 5) * 51;
          px[i + 3] = px[i + 3] < 128 ? 0 : 255;
        }
        ctx.putImageData(frame, 0, 0);
        const url = canvas.toDataURL('image/png');
        pixelCache.set(src, url);
        document.querySelectorAll('img[data-px]').forEach(el => { if (el.dataset.px === src && getRoomStyle() === 'dot') el.src = url; });
      } catch { pixelCache.set(src, src); }
    };
    img.onerror = () => pixelCache.set(src, src);
    img.src = src;
  }
  return src;
}
