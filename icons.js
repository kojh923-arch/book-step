// 화면에 쓰는 선 아이콘과 성장 캐릭터 그림(SVG). 화면 표시만 담당하며 데이터·DB와 무관합니다.
// index.html, teacher.html에서 app-supabase.js보다 먼저 불러옵니다.
const ICON_PATHS = {
  home: '<path d="M3 10.5 12 3l9 7.5V19a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z"/>',
  pencil: '<path d="M13 20h8"/><path d="M16.5 3.6a2.1 2.1 0 0 1 3 3L7.5 18.5 3 20l1.5-4.5z"/>',
  book: '<path d="M2.5 5h5.5a4 4 0 0 1 4 4v11a3 3 0 0 0-3-3H2.5z"/><path d="M21.5 5H16a4 4 0 0 0-4 4v11a3 3 0 0 1 3-3h6.5z"/>',
  shelf: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="8" y="7" width="5" height="13" rx="1.5"/><path d="m14.6 8.3 3.9-1.1 3 11.5-3.9 1.1z"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
  sprout: '<path d="M12 21v-9"/><path d="M12 13c0-4.5-3-7-7.5-7 0 4.5 3 7 7.5 7z"/><path d="M12 10c0-3.5 2.5-6 7-6 0 4-2.5 6-7 6z"/>',
  room: '<path d="M5 11V7.5A3.5 3.5 0 0 1 8.5 4h7A3.5 3.5 0 0 1 19 7.5V11"/><path d="M3 13a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v4.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/><path d="M6 19v2M18 19v2"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9l-5.4 2.9 1.1-6.1-4.5-4.3 6.1-.8z"/>',
  flame: '<path d="M12 22c4.2 0 7-2.9 7-7 0-3.2-2-5.4-3.6-7.6-.5 1.9-1.4 3-2.9 3.6.3-3.2-.8-6.3-3.7-9 .4 3.6-3.8 6.6-3.8 12 0 4.8 3 8 7 8z"/>',
  logout: '<path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.3-4.3"/>',
  refresh: '<path d="M20.5 12a8.5 8.5 0 1 1-2.8-6.3"/><path d="M20.5 4v5h-5"/>',
  left: '<path d="m15 5-7 7 7 7"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  arrow: '<path d="M4 12h16"/><path d="m14 6 6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m4.5 12.5 5 5 10-11"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6.5 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5l1-12.5"/>',
  heart: '<path d="M12 20.5s-8-4.8-8-11a4.5 4.5 0 0 1 8-2.8 4.5 4.5 0 0 1 8 2.8c0 6.2-8 11-8 11z"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4.5a3.5 3.5 0 0 0 3.8 4.5M16 6h3.5a3.5 3.5 0 0 1-3.8 4.5"/><path d="M12 13v4M8.5 20.5h7M10 17h4"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  gift: '<rect x="3.5" y="8.5" width="17" height="4.5" rx="1.5"/><path d="M5.5 13v6a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-6M12 8.5v12"/><path d="M12 8.5C10.5 5 7 4 7 6.5s3 2 5 2c2 0 5 .5 5-2s-3.5-1.5-5 2z"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="3"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18.5 14.5A6.5 6.5 0 0 1 21.5 20"/>',
  sparkle: '<path d="M12 3c.8 4.7 2.8 6.7 7.5 7.5-4.7.8-6.7 2.8-7.5 7.5-.8-4.7-2.8-6.7-7.5-7.5C9.2 9.7 11.2 7.7 12 3z"/><path d="M19 16.5v4M17 18.5h4"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13.5" rx="3"/><path d="m4 8 8 5.5L20 8"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 9h.01M15 9h.01M12 12h.01M9 15h.01M15 15h.01"/>',
  cap: '<path d="M2.5 9.5 12 5l9.5 4.5L12 14z"/><path d="M6.5 11.5V16c1.5 1.5 3.3 2.2 5.5 2.2s4-.7 5.5-2.2v-4.5M21.5 9.5V15"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12h.01"/>'
};
// name: ICON_PATHS의 이름, cls: 추가 클래스 (예: 'fill' → 옅게 채움)
function icon(name, cls = '') {
  const body = ICON_PATHS[name] || '';
  return `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
}

// 성장 캐릭터: 레벨이 오를수록 화분의 새싹이 자라요 (0 씨앗 → 10 왕관 쓴 나무). index는 LEVELS의 순서예요.
// 화분 색: [몸통, 테두리]. user_buddy.pot 값과 같은 이름이에요.
const POT_COLORS = { peach: ['#ffb9a3', '#ff9f86'], mint: ['#a9e8c4', '#84d6a8'], sky: ['#a9d6ff', '#84bff5'], lilac: ['#c9bdfb', '#ac9cf3'], butter: ['#ffe08a', '#f5c95a'], pink: ['#ffbcd6', '#ff9cc0'] };
function levelArt(index = 0, pot = 'peach') {
  const lv = Math.max(0, Math.min(10, Number(index) || 0));
  const [potBody, potRim] = POT_COLORS[pot] || POT_COLORS.peach;
  const leaf = (x, y, rot, s = 1, fill = '#7fdc9f') => `<path d="M0 0C-11-6-13-21 0-30 13-21 11-6 0 0z" fill="${fill}" transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"/>`;
  const flower = (x, y, s = 1, fill = '#ffb3cf') => `<g transform="translate(${x} ${y}) scale(${s})">${[0, 72, 144, 216, 288].map(a => `<circle cx="0" cy="-7" r="5.5" fill="${fill}" transform="rotate(${a})"/>`).join('')}<circle r="4.2" fill="#ffe27a"/></g>`;
  const star = (x, y, s = 1) => `<path d="M0-8c1.2 5 2.8 6.6 8 8-5.2 1.4-6.8 3-8 8-1.2-5-2.8-6.6-8-8 5.2-1.4 6.8-3 8-8z" fill="#ffd95e" transform="translate(${x} ${y}) scale(${s})"/>`;
  const stem = top => `<path d="M60 78V${top}" stroke="#56c98a" stroke-width="5" stroke-linecap="round"/>`;
  let plant;
  if (lv === 0) plant = `<ellipse cx="60" cy="72" rx="9" ry="7" fill="#c98f62"/><path d="M60 66c0-5 3-8 7-8 0 5-3 8-7 8z" fill="#7fdc9f"/>`;
  else if (lv === 1) plant = stem(60) + leaf(60, 62, -55, .7) + leaf(60, 62, 55, .7);
  else if (lv === 2) plant = stem(52) + leaf(60, 55, -58, .95) + leaf(60, 55, 58, .95) + leaf(60, 52, 0, .5, '#a6ecbd');
  else if (lv === 3) plant = stem(42) + leaf(60, 64, -70, .8) + leaf(60, 64, 70, .8) + leaf(60, 46, -45, .9, '#6fd396') + leaf(60, 46, 45, .9, '#6fd396');
  else if (lv === 4) plant = stem(40) + leaf(60, 66, -72, .85) + leaf(60, 66, 72, .85) + leaf(60, 50, -50, .95, '#6fd396') + leaf(60, 50, 50, .95, '#6fd396') + `<circle cx="60" cy="36" r="7" fill="#ffc2d8"/><path d="M54 39c2 3 10 3 12 0" stroke="#56c98a" stroke-width="3" stroke-linecap="round" fill="none"/>`;
  else if (lv === 5) plant = stem(38) + leaf(60, 66, -72, .9) + leaf(60, 66, 72, .9) + leaf(60, 52, -52, 1, '#6fd396') + leaf(60, 52, 52, 1, '#6fd396') + flower(60, 32, 1.15);
  else if (lv === 6) plant = stem(36) + leaf(60, 68, -74, .9) + leaf(60, 68, 74, .9) + leaf(60, 54, -54, 1, '#6fd396') + leaf(60, 54, 54, 1, '#6fd396') + flower(60, 30, 1.2) + flower(36, 44, .7, '#c9b8ff') + flower(84, 44, .7, '#ffd0a8');
  else {
    const fruit = lv >= 8 ? `<circle cx="42" cy="44" r="4.5" fill="#ff9f9f"/><circle cx="76" cy="50" r="4.5" fill="#ff9f9f"/><circle cx="60" cy="30" r="4.5" fill="#ffb86b"/>` : '';
    const stars = lv >= 9 ? star(26, 24, .8) + star(96, 30, .65) : '';
    const crown = lv >= 10 ? `<path d="M46 14l5 7 9-10 9 10 5-7 2 16H44z" fill="#ffd95e" stroke="#f2b632" stroke-width="1.5" stroke-linejoin="round"/>` : '';
    const canopy = lv >= 10 ? ['#8fe3ae', '#74d79a'] : ['#8fe3ae', '#6fd396'];
    plant = `<path d="M60 78V50" stroke="#c98f62" stroke-width="8" stroke-linecap="round"/><circle cx="42" cy="48" r="17" fill="${canopy[1]}"/><circle cx="78" cy="48" r="17" fill="${canopy[1]}"/><circle cx="60" cy="36" r="21" fill="${canopy[0]}"/><circle cx="60" cy="54" r="15" fill="${canopy[0]}"/>${fruit}${stars}${crown}`;
  }
  return `<svg class="level-art level-art-${lv}" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
    <ellipse cx="60" cy="112" rx="30" ry="4.5" fill="#5b4dcf" opacity=".12"/>
    <g class="level-art-plant">${plant}</g>
    <path d="M40 84h40l-4.5 22a6 6 0 0 1-5.9 4.8H50.4a6 6 0 0 1-5.9-4.8z" fill="${potBody}"/>
    <rect x="35" y="75" width="50" height="12" rx="6" fill="${potRim}"/>
    <circle cx="53" cy="96" r="2.2" fill="#5a3b46"/><circle cx="67" cy="96" r="2.2" fill="#5a3b46"/>
    <path d="M56.5 100.5c2 2.2 5 2.2 7 0" stroke="#5a3b46" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <circle cx="48" cy="100" r="2.8" fill="#ff8f8f" opacity=".55"/><circle cx="72" cy="100" r="2.8" fill="#ff8f8f" opacity=".55"/>
  </svg>`;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { icon, levelArt, ICON_PATHS, POT_COLORS };
