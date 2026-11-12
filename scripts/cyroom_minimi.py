# 싸이월드풍 미니미(2.5등신 도트 캐릭터)를 그려요. → assets/room/dot/minimi_*.png
# 실행: python3 scripts/cyroom_minimi.py   (Pillow 필요)
import os, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__))
from cyroom_engine import finish, tone

SKIN = (255, 222, 196); BLUSH = (255, 160, 170); EYE = (52, 40, 44)
W, H = 34, 48

def px(d, x0, y0, x1, y1, c): d.rectangle([x0, y0, x1, y1], fill=c[:3] + (255,))
def shaded(d, x0, y0, x1, y1, c):   # 오른쪽 1/3은 어둡게, 왼쪽 위 1줄은 밝게
    px(d, x0, y0, x1, y1, c); cut = x1 - max(1, (x1 - x0) // 3)
    px(d, cut, y0, x1, y1, tone(c, .84)); px(d, x0, y0, x0, y1, tone(c, 1.12))
def oval(d, box, c): d.ellipse(box, fill=c[:3] + (255,))

class Shift:   # 모자·왕관이 위로 삐져나와도 잘리지 않게 모든 좌표를 아래로 TOP만큼 옮겨 그려요
    TOP = 12
    def __init__(self, d): self.d = d
    def _b(self, b): return [b[0], b[1] + self.TOP, b[2], b[3] + self.TOP]
    def rectangle(self, b, **k): self.d.rectangle(self._b(b), **k)
    def ellipse(self, b, **k): self.d.ellipse(self._b(b), **k)
    def polygon(self, pts, **k): self.d.polygon([(x, y + self.TOP) for x, y in pts], **k)

def draw(cfg):
    img = Image.new('RGBA', (W, H + Shift.TOP), (0, 0, 0, 0)); d = Shift(ImageDraw.Draw(img))
    hair, top, bottom = cfg['hair'], cfg['top'], cfg.get('bottom', (90, 110, 170))
    style, cx = cfg['style'], 17
    # 뒤쪽 머리 (긴 머리·양갈래)
    if style in ('long', 'ribbon'): oval(d, (6, 6, 28, 30), tone(hair, .85)); px(d, 6, 16, 28, 31, tone(hair, .85))
    if style == 'pigtail':
        for x in (2, 27): oval(d, (x, 12, x + 6, 24), hair)
    if cfg.get('cape'): d.polygon([(9, 22), (25, 22), (28, 40), (6, 40)], fill=cfg['cape'] + (255,))
    # 다리·신발
    skirt = cfg.get('skirt')
    for x in (12, 18):
        px(d, x, 36, x + 3, 42, SKIN if skirt else bottom); px(d, x - 1, 42, x + 4, 44, cfg.get('shoes', (90, 70, 70)))
    # 몸통
    if cfg.get('robe'):
        d.polygon([(10, 22), (24, 22), (27, 42), (7, 42)], fill=top + (255,)); px(d, 19, 23, 24, 41, tone(top, .84))
    else:
        shaded(d, 10, 22, 24, 33, top)
        if skirt: d.polygon([(9, 32), (25, 32), (27, 38), (7, 38)], fill=skirt + (255,)); px(d, 19, 33, 26, 37, tone(skirt, .85))
        else: shaded(d, 10, 32, 24, 36, bottom); px(d, 17, 34, 17, 36, tone(bottom, .7))
    if cfg.get('overall'): px(d, 12, 26, 22, 33, cfg['overall']); px(d, 12, 22, 13, 26, cfg['overall']); px(d, 21, 22, 22, 26, cfg['overall'])
    if cfg.get('tie'): px(d, 16, 23, 18, 24, cfg['tie']); px(d, 16, 25, 17, 29, cfg['tie'])
    if cfg.get('collar'): px(d, 13, 22, 21, 23, cfg['collar'])
    # 팔·손 (책 들기)
    for x in (7, 24): shaded(d, x, 23, x + 3, 30, top); px(d, x, 31, x + 3, 33, SKIN)
    if cfg.get('book'):
        bc = cfg['book']; px(d, 10, 27, 24, 34, bc); px(d, 17, 27, 17, 34, tone(bc, .7)); px(d, 11, 28, 16, 28, tone(bc, 1.3)); px(d, 18, 28, 23, 28, tone(bc, 1.3))
        px(d, 8, 30, 11, 33, SKIN); px(d, 23, 30, 26, 33, SKIN)
    if cfg.get('star'): px(d, 26, 26, 28, 28, (255, 220, 90)); px(d, 27, 25, 27, 29, (255, 220, 90)); px(d, 25, 27, 29, 27, (255, 220, 90))
    # 얼굴
    oval(d, (6, 2, 28, 24), SKIN); px(d, 22, 8, 27, 20, tone(SKIN, .94))
    # 앞머리·모자
    if style == 'short': oval(d, (5, 0, 29, 13), hair); px(d, 5, 6, 8, 14, hair); px(d, 26, 6, 29, 14, hair)
    elif style == 'spiky':
        oval(d, (5, 1, 29, 13), hair)
        for x in range(6, 28, 4): d.polygon([(x, 4), (x + 2, -1), (x + 4, 4)], fill=hair + (255,))
    elif style in ('long', 'ribbon', 'pigtail', 'bob'):
        oval(d, (5, 0, 29, 13), hair); px(d, 5, 6, 8, 20 if style != 'bob' else 18, hair); px(d, 26, 6, 29, 20 if style != 'bob' else 18, hair)
    elif style == 'curly':
        for x, y in ((6, 2), (11, 0), (17, 0), (23, 2), (5, 8), (27, 8)): oval(d, (x - 1, y, x + 6, y + 7), hair)
    elif style == 'cap':
        oval(d, (5, 0, 29, 12), hair); px(d, 5, 7, 29, 9, tone(hair, .8)); px(d, 2, 9, 18, 10, tone(hair, .7))
    elif style in ('bear', 'cat'):
        oval(d, (4, 0, 30, 18), hair); px(d, 4, 9, 7, 22, hair); px(d, 27, 9, 30, 22, hair)
        if style == 'bear':
            for x in (3, 25): oval(d, (x, -1, x + 7, 6), hair); oval(d, (x + 2, 1, x + 5, 4), tone(hair, 1.3))
        else:
            for x0, x1 in ((5, 12), (22, 29)): d.polygon([(x0, 4), ((x0 + x1) // 2, -2), (x1, 4)], fill=hair + (255,))
    elif style == 'wizard':
        oval(d, (5, 2, 29, 12), (70, 50, 40)); d.polygon([(4, 8), (30, 8), (19, -9), (14, -9)], fill=hair + (255,)); px(d, 2, 7, 32, 9, tone(hair, .8))
        px(d, 16, -3, 18, -1, (255, 220, 90))
    if cfg.get('crown'): d.polygon([(9, 1), (11, -4), (14, 0), (17, -5), (20, 0), (23, -4), (25, 1)], fill=(255, 210, 70, 255)); px(d, 16, -2, 18, 0, (240, 90, 110))
    if style == 'ribbon': d.polygon([(19, 0), (25, -3), (25, 4)], fill=cfg['ribbon'] + (255,)); d.polygon([(19, 0), (13, -3), (13, 4)], fill=cfg['ribbon'] + (255,)); px(d, 18, -1, 20, 1, tone(cfg['ribbon'], .8))
    if cfg.get('hairpin'): px(d, 22, 4, 25, 6, cfg['hairpin'])
    # 눈·볼·입
    ey = 13 if style not in ('bear', 'cat') else 14
    for x in (11, 21):
        px(d, x, ey, x + 1, ey + 2, EYE); px(d, x, ey, x, ey, (255, 255, 255))
    if cfg.get('glasses'):
        for x in (9, 19): d.rectangle([x, ey - 1, x + 5, ey + 3], outline=(60, 60, 80, 255))
        px(d, 15, ey, 18, ey, (60, 60, 80))
    for x in (8, 23): px(d, x, ey + 4, x + 2, ey + 4, BLUSH)
    px(d, 16, ey + 5, 17, ey + 5, (210, 90, 90))
    return img

MINIMI = {
    'minimi_reader':  ('책 읽는 친구', dict(style='short', hair=(60, 48, 44), top=(110, 160, 230), bottom=(70, 90, 150), book=(240, 110, 110))),
    'minimi_ribbon':  ('리본 친구', dict(style='ribbon', hair=(130, 84, 60), top=(250, 170, 190), skirt=(250, 140, 170), ribbon=(240, 90, 120), shoes=(200, 80, 100))),
    'minimi_pigtail': ('양갈래 친구', dict(style='pigtail', hair=(230, 140, 70), top=(255, 220, 110), skirt=(140, 210, 190), hairpin=(120, 190, 240))),
    'minimi_student': ('교복 친구', dict(style='bob', hair=(40, 36, 44), top=(70, 80, 130), bottom=(60, 66, 110), collar=(250, 250, 250), tie=(220, 70, 80), glasses=True, book=(120, 180, 120))),
    'minimi_cap':     ('모자 친구', dict(style='cap', hair=(230, 80, 80), top=(250, 250, 248), bottom=(90, 130, 200), overall=(100, 140, 210))),
    'minimi_bear':    ('곰돌이 친구', dict(style='bear', hair=(180, 120, 80), top=(190, 130, 90), bottom=(170, 115, 78))),
    'minimi_cat':     ('고양이 친구', dict(style='cat', hair=(190, 190, 210), top=(200, 180, 240), bottom=(170, 150, 220), book=(250, 210, 100))),
    'minimi_curly':   ('곱슬머리 친구', dict(style='curly', hair=(110, 70, 50), top=(120, 200, 130), bottom=(110, 100, 90))),
    'minimi_spiky':   ('뾰족머리 친구', dict(style='spiky', hair=(250, 200, 80), top=(240, 120, 90), bottom=(60, 60, 80))),
    'minimi_wizard':  ('마법사 친구', dict(style='wizard', hair=(140, 100, 210), top=(150, 110, 220), robe=True, star=True, shoes=(80, 60, 120))),
    'minimi_king':    ('독서왕', dict(style='short', hair=(250, 210, 120), top=(230, 80, 90), bottom=(90, 70, 140), crown=True, cape=(200, 50, 70), book=(250, 210, 100))),
    'minimi_teacher': ('선생님', dict(style='long', hair=(70, 50, 44), top=(236, 214, 180), skirt=(120, 110, 150), glasses=True, book=(110, 150, 220))),
}

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'assets/room/dot'
    os.makedirs(out, exist_ok=True)
    for key, (name, cfg) in MINIMI.items():
        img = Image.new('RGBA', (W + 8, H + Shift.TOP + 4), (0, 0, 0, 0)); img.paste(draw(cfg), (4, 2))
        finish(img, 0, 0.62, up=6).save(f'{out}/{key}.png', optimize=True)
        print(key, name)
