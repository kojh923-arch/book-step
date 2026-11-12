# 싸이월드풍 미니미 옷 입히기: 작고 동글동글한 2등신 도트 캐릭터를 부위별(같은 크기의 투명 PNG)로 그려요.
# 부위마다 자기 색의 진한 색으로 외곽선을 둘러서, 겹쳐 놓으면 싸이월드 미니미처럼 보여요.
# → assets/room/dot/minimi/*.png, minimi-data.js   실행: python3 scripts/cyroom_minimi.py  (Pillow 필요)
import colorsys, json, os
from PIL import Image, ImageDraw

W, H, OX, OY, UP = 30, 50, 2, 5, 4       # 캔버스 30×50칸 (모자·풍선이 삐져나갈 자리 포함), 4배로 저장
OUT = 'assets/room/dot/minimi'
VERSION = 2

def dk(c, f=.58):
    h, l, s = colorsys.rgb_to_hls(*[v / 255 for v in c]); return tuple(round(v * 255) for v in colorsys.hls_to_rgb(h, l * f, min(1, s * 1.1)))
def lt(c, f=.35): return tuple(round(v + (255 - v) * f) for v in c)

class Part:
    def __init__(s, color, line=None):
        s.c = color; s.line = line or dk(color)
        s.img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); s.d = ImageDraw.Draw(s.img)
    def _f(s, c): return (s.c if c is None else c) + (255,)
    def _p(s, pts): return [(x + OX, y + OY) for x, y in pts]
    def rect(s, x0, y0, x1, y1, c=None): s.d.rectangle([x0 + OX, y0 + OY, x1 + OX, y1 + OY], fill=s._f(c))
    def oval(s, x0, y0, x1, y1, c=None): s.d.ellipse([x0 + OX, y0 + OY, x1 + OX, y1 + OY], fill=s._f(c))
    def poly(s, pts, c=None): s.d.polygon(s._p(pts), fill=s._f(c))
    def dot(s, x, y, c=None): s.d.point((x + OX, y + OY), fill=s._f(c))
    def dots(s, pts, c=None): [s.dot(x, y, c) for x, y in pts]
    def line_(s, pts, c=None, w=1): s.d.line(s._p(pts), fill=s._f(c), width=w)
    def erase(s, pts): s.d.polygon(s._p(pts), fill=(0, 0, 0, 0))
    def erase_rect(s, x0, y0, x1, y1): s.d.rectangle([x0 + OX, y0 + OY, x1 + OX, y1 + OY], fill=(0, 0, 0, 0))
    def done(s, outline=True):
        if not outline or s.line is None: return s.img
        px = s.img.load(); out = s.img.copy(); o = out.load()
        for y in range(H):
            for x in range(W):
                if px[x, y][3]: continue
                if any(0 <= x + a < W and 0 <= y + b < H and px[x + a, y + b][3] for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    o[x, y] = s.line + (255,)
        return out

def save(img, name):
    img.resize((W * UP, H * UP), Image.NEAREST).save(f'{OUT}/{name}.png', optimize=True)

# ---------- 피부: 다리 / 손 / 머리(귀·목) ----------
SKINS = [('light', '밝은 피부', (255, 226, 200)), ('tan', '보통 피부', (246, 204, 168)), ('brown', '구릿빛 피부', (206, 150, 108))]
def skin_line(c): return (int(c[0] * .74), int(c[1] * .56), int(c[2] * .5))
def legs(c):
    p = Part(c, skin_line(c))
    for x in (9, 14): p.rect(x, 34, x + 2, 39)
    return p.done()
def hands(c):
    p = Part(c, skin_line(c)); p.oval(4, 29, 7, 32); p.oval(18, 29, 21, 32); return p.done()
def head(c):
    p = Part(c, skin_line(c))
    p.oval(2, 5, 23, 23); p.oval(0, 13, 3, 17); p.oval(22, 13, 25, 17); p.rect(11, 22, 14, 23)
    p.dot(1, 15, dk(c, .9)); p.dot(23, 15, dk(c, .9))
    return p.done()

# ---------- 얼굴 (외곽선 없음) ----------
EYE = (40, 30, 36); BLUSH = (255, 168, 168); MOUTH = (214, 90, 96); WHITE = (255, 255, 255)
def face(kind):
    p = Part(EYE, None)
    for x in (5, 18): p.rect(x, 18, x + 2, 19, BLUSH)
    smile = [(11, 19), (12, 20), (13, 20), (14, 19)]
    if kind == 'smile':
        for x in (8, 16): p.rect(x, 15, x + 1, 17); p.dot(x, 15, WHITE)
        p.dots(smile, MOUTH)
    elif kind == 'sparkle':
        for x in (7, 16): p.rect(x, 14, x + 2, 17); p.dot(x, 14, WHITE); p.dot(x + 1, 14, WHITE); p.dot(x + 2, 17, WHITE)
        p.rect(11, 19, 14, 20, MOUTH); p.rect(12, 20, 13, 20, (255, 150, 160))
    elif kind == 'wink':
        p.dots([(7, 16), (8, 15), (9, 16)]); p.rect(16, 15, 17, 17); p.dot(16, 15, WHITE); p.dots(smile, MOUTH)
    elif kind == 'cat':
        for x in (8, 16): p.rect(x, 15, x + 1, 17); p.dot(x, 15, WHITE)
        p.dots([(10, 19), (11, 20), (12, 19), (13, 19), (14, 20), (15, 19)], MOUTH)
    elif kind == 'sleepy':
        for x in (7, 15): p.dots([(x, 16), (x + 1, 17), (x + 2, 17), (x + 3, 16)])
        p.rect(12, 19, 13, 20, MOUTH)
    elif kind == 'heart':
        for x in (7, 15):
            p.dots([(x, 15), (x + 2, 15), (x, 16), (x + 1, 16), (x + 2, 16), (x + 1, 17)], (236, 70, 110))
        p.dots(smile, MOUTH)
    return p.done(False)
FACES = [('smile', '방긋'), ('sparkle', '반짝'), ('wink', '윙크'), ('cat', '냥냥'), ('heart', '하트 눈'), ('sleepy', '졸려')]

# ---------- 머리 (앞머리 + 뒷머리) ----------
HAIR_COLORS = [('brown', '갈색', (150, 86, 46)), ('black', '검정', (54, 46, 56)), ('chestnut', '밤색', (186, 110, 60)),
               ('blonde', '금발', (246, 200, 96)), ('pink', '분홍', (246, 140, 176)), ('sky', '하늘', (120, 180, 236))]
BANGS = [(5, 12), (7, 10), (9, 13), (11, 10), (13, 13), (15, 10), (17, 13), (19, 10), (20, 12), (20, 22), (5, 22)]
def shine(p, c): p.dots([(6, 5), (7, 4), (8, 4), (9, 4), (14, 4), (15, 4)], lt(c, .45))
def hair(style, c):
    f = Part(c, dk(c, .5)); b = Part(dk(c, .82), dk(c, .5)); back = False
    if style == 'spiky':
        f.oval(1, 2, 24, 16)
        for x0 in (3, 8, 13, 18): f.poly([(x0, 5), (x0 + 3, -1), (x0 + 5, 5)])
        f.erase(BANGS); f.rect(1, 9, 3, 15); f.rect(22, 9, 24, 15)
    elif style == 'bowl':
        f.oval(1, 1, 24, 18); f.erase_rect(5, 12, 20, 22); f.rect(1, 9, 4, 16); f.rect(21, 9, 24, 16)
        f.dots([(6, 11), (10, 11), (14, 11), (18, 11)], dk(c, .8))
    elif style in ('bob', 'long'):
        f.oval(1, 2, 24, 17)
        f.erase([(6, 13), (8, 10), (10, 13), (12, 10), (14, 13), (16, 10), (18, 13), (19, 13), (19, 22), (6, 22)])
        low = 24 if style == 'bob' else 30
        f.rect(1, 9, 4, low); f.rect(21, 9, 24, low); f.oval(1, low - 3, 5, low + 2); f.oval(20, low - 3, 24, low + 2)
        b.oval(1, 4, 24, 26); b.rect(1, 14, 24, 27 if style == 'bob' else 33); back = True
    elif style == 'pigtail':
        f.oval(1, 2, 24, 16); f.erase(BANGS); f.rect(1, 9, 3, 16); f.rect(22, 9, 24, 16)
        for x in (-2, 23): f.oval(x, 13, x + 5, 27); f.dot(x + 1, 16, lt(c, .45))
        f.rect(1, 13, 3, 15, (250, 110, 150)); f.rect(22, 13, 24, 15, (250, 110, 150))
    elif style == 'bun':
        f.oval(1, 2, 24, 16); f.oval(8, -4, 17, 4); f.dot(10, -2, lt(c, .45)); f.erase(BANGS); f.rect(1, 9, 3, 15); f.rect(22, 9, 24, 15)
    elif style == 'curly':
        for x, y in ((1, 3), (6, 0), (11, -1), (16, 0), (20, 3), (-1, 9), (22, 9), (-1, 15), (22, 15)): f.oval(x, y, x + 6, y + 7)
        f.oval(2, 2, 23, 14); f.erase([(6, 13), (9, 11), (12, 13), (15, 11), (18, 13), (19, 22), (6, 22)])
        for x, y in ((3, 4), (8, 1), (13, 0), (18, 1)): f.dot(x, y, lt(c, .45))
    elif style == 'ponytail':
        f.oval(1, 2, 24, 16); f.erase(BANGS); f.rect(1, 9, 3, 15); f.rect(22, 9, 24, 15)
        b.poly([(20, 4), (27, 9), (28, 20), (25, 30), (22, 27), (24, 18), (20, 10)]); back = True
        f.rect(21, 4, 23, 6, (250, 110, 150))
    if style not in ('curly',): shine(f, c)
    return f.done(), (b.done() if back else None)
HAIRS = [('spiky', '삐죽 머리'), ('bowl', '바가지 머리'), ('bob', '단발'), ('long', '긴 머리'), ('pigtail', '양갈래'), ('bun', '똥머리'), ('curly', '곱슬'), ('ponytail', '포니테일')]

# ---------- 상의 (소매 포함). covers=True 면 하의를 덮어요 ----------
HEART = [(10, 26), (11, 26), (14, 26), (15, 26), (10, 27), (11, 27), (12, 27), (13, 27), (14, 27), (15, 27), (11, 28), (12, 28), (13, 28), (14, 28), (12, 29), (13, 29)]
def shirt(p, c=None, y1=31):
    p.poly([(9, 23), (16, 23), (18, 24), (18, y1), (7, y1), (7, 24)], c)
    p.poly([(8, 23), (4, 28), (6, 30), (8, 28)], c); p.poly([(17, 23), (21, 28), (19, 30), (17, 28)], c)
def side_shade(p, c, y1=30): p.rect(17, 24, 17, y1, dk(c, .86))
def top(kind):
    if kind in ('heart_blue', 'heart_pink', 'heart_yellow'):
        c = {'heart_blue': (96, 160, 236), 'heart_pink': (250, 150, 176), 'heart_yellow': (252, 210, 90)}[kind]
        p = Part(c); shirt(p); p.dots(HEART, WHITE); side_shade(p, c)
    elif kind == 'stripe':
        c = (250, 250, 246); p = Part(c, (80, 96, 160)); shirt(p)
        for y in (25, 27, 29): p.line_([(7, y), (18, y)], (80, 110, 186))
        p.line_([(5, 27), (7, 25)], (80, 110, 186))
    elif kind == 'hoodie':
        c = (140, 220, 190); p = Part(c); p.oval(7, 20, 18, 25, dk(c, .9)); shirt(p)
        p.rect(10, 28, 15, 30, dk(c, .9)); p.dots([(11, 24), (11, 25), (14, 24), (14, 25)], WHITE); side_shade(p, c)
    elif kind == 'uniform':
        c = (70, 84, 140); p = Part(c); shirt(p)
        p.poly([(9, 23), (16, 23), (12.5, 27)], WHITE); p.poly([(11, 24), (14, 24), (12.5, 27)], (226, 64, 80)); p.rect(12, 27, 13, 29, (226, 64, 80))
    elif kind == 'overall':
        c = (96, 138, 210); p = Part(c); shirt(p, (250, 250, 246))
        p.rect(9, 26, 16, 31); p.rect(9, 23, 10, 26); p.rect(15, 23, 16, 26); p.rect(8, 31, 17, 35); p.rect(12, 33, 13, 35, dk(c, .8))
        p.rect(11, 27, 14, 29, lt(c, .25)); p.dot(9, 25, (255, 220, 90)); p.dot(16, 25, (255, 220, 90))
    elif kind == 'dress':
        c = (250, 156, 186); p = Part(c); shirt(p, None, 29); p.poly([(8, 28), (17, 28), (20, 36), (5, 36)])
        p.dots([(x, 35) for x in range(6, 20, 2)], WHITE); p.rect(8, 28, 17, 28, dk(c, .85)); p.dots(HEART[:10], WHITE)
    elif kind == 'robe':
        c = (146, 110, 222); p = Part(c); shirt(p); p.poly([(7, 24), (18, 24), (20, 39), (5, 39)])
        for x, y in ((9, 30), (15, 34), (10, 36)): p.dots([(x, y - 1), (x - 1, y), (x, y), (x + 1, y), (x, y + 1)], (255, 222, 90))
    elif kind == 'bear':
        c = (186, 128, 86); p = Part(c); shirt(p); p.rect(8, 30, 17, 35); p.rect(12, 33, 13, 35, dk(c, .8))
        p.oval(9, 25, 16, 31, (242, 210, 170)); p.dots([(11, 27), (14, 27)], dk(c, .6))
    elif kind == 'cape':
        p = Part((214, 52, 72)); p.poly([(7, 23), (18, 23), (22, 37), (3, 37)])
        p2 = Part((252, 214, 96)); shirt(p2); p2.rect(7, 23, 18, 24, WHITE); p2.dots([(9, 23), (12, 23), (15, 23)], (226, 64, 80))
        return Image.alpha_composite(p.done(), p2.done())
    elif kind == 'hanbok':
        c = (252, 190, 206); p = Part(c); shirt(p, None, 28)
        for i, col in enumerate(((240, 90, 90), (255, 210, 90), (110, 200, 140))):
            p.line_([(7 - i, 25 + i), (6 - i, 27 + i)], col); p.line_([(18 + i, 25 + i), (19 + i, 27 + i)], col)
        p.poly([(9, 23), (16, 23), (12.5, 26)], WHITE); p.rect(12, 26, 13, 30, (230, 70, 110))
        p.poly([(7, 28), (18, 28), (21, 39), (4, 39)], (110, 142, 230)); p.rect(7, 28, 18, 28, (90, 120, 210))
    elif kind == 'cardigan':
        c = (232, 206, 166); p = Part(c); shirt(p); p.poly([(11, 23), (14, 23), (14, 31), (11, 31)], WHITE)
        p.dots([(12, 25), (12, 27), (12, 29)], (150, 110, 80)); side_shade(p, c)
    elif kind == 'sailor':
        c = (250, 250, 246); p = Part(c, (80, 96, 160)); shirt(p)
        p.poly([(8, 23), (17, 23), (16, 25), (12.5, 28), (9, 25)], (80, 120, 210)); p.poly([(11, 26), (14, 26), (12.5, 29)], (230, 70, 84))
    return p.done()
TOPS = [('heart_blue', '하트 티(파랑)', False), ('heart_pink', '하트 티(분홍)', False), ('heart_yellow', '하트 티(노랑)', False),
        ('stripe', '줄무늬 티', False), ('hoodie', '후드티', False), ('sailor', '세일러', False), ('uniform', '교복', False),
        ('cardigan', '가디건', False), ('cape', '독서왕 망토', False), ('overall', '멜빵바지', True), ('dress', '원피스', True),
        ('robe', '마법사 로브', True), ('bear', '곰돌이 옷', True), ('hanbok', '한복', True)]

# ---------- 하의 ----------
def bottom(kind):
    if kind in ('shorts', 'pants'):
        c = (88, 120, 186) if kind == 'shorts' else (62, 64, 86); p = Part(c)
        p.rect(8, 30, 17, 35 if kind == 'shorts' else 38); p.rect(12, 33, 13, 38 if kind == 'pants' else 35, dk(c, .8))
        if kind == 'shorts': p.rect(8, 35, 11, 35, lt(c, .2)); p.rect(14, 35, 17, 35, lt(c, .2))
    else:
        c = {'skirt_denim': (96, 132, 200), 'skirt_pink': (250, 140, 172), 'skirt_check': (224, 80, 90)}[kind]; p = Part(c)
        p.poly([(8, 30), (17, 30), (19, 36), (6, 36)])
        if kind == 'skirt_check':
            for x in (8, 11, 14, 17): p.line_([(x, 31), (x, 35)], (250, 200, 120))
            p.line_([(7, 33), (18, 33)], (250, 200, 120))
        else: p.dots([(x, 35) for x in range(8, 19, 2)], lt(c, .45))
    return p.done()
BOTTOMS = [('shorts', '청반바지'), ('skirt_denim', '청치마'), ('skirt_pink', '분홍 치마'), ('skirt_check', '체크 치마'), ('pants', '긴 바지')]

SHOE_COLORS = [('brown', '갈색 신발', (96, 70, 66)), ('pink', '분홍 신발', (226, 84, 110)), ('white', '흰 운동화', (240, 240, 244)), ('red', '빨간 구두', (210, 50, 60))]
def shoes(c):
    p = Part(c, dk(c, .5) if c[0] < 230 else (150, 150, 170))
    for x in (8, 14): p.oval(x, 38, x + 4, 42)
    p.dots([(9, 39), (15, 39)], lt(c, .45) if c[0] < 230 else (200, 200, 214))
    return p.done()

# ---------- 모자·장식 ----------
def hat(kind):
    if kind == 'ribbon':
        p = Part((240, 90, 130)); p.poly([(19, 3), (25, -1), (25, 7)]); p.poly([(19, 3), (13, -1), (13, 7)]); p.oval(17, 1, 21, 5, (220, 60, 110))
    elif kind == 'cap':
        p = Part((230, 76, 76)); p.oval(1, 0, 24, 14); p.erase_rect(0, 9, 25, 15); p.rect(-2, 8, 13, 9, (200, 56, 56)); p.dot(12, 0, WHITE)
    elif kind == 'crown':
        p = Part((255, 204, 64), (190, 130, 30)); p.poly([(6, 4), (6, -2), (9, 1), (12.5, -4), (16, 1), (19, -2), (19, 4)])
        p.dots([(9, 2), (16, 2)], (110, 170, 240)); p.dot(12, 1, (240, 80, 110)); p.dot(13, 1, (240, 80, 110))
    elif kind == 'wizard':
        p = Part((130, 96, 210)); p.poly([(0, 7), (25, 7), (16, -4), (13, -5)]); p.poly([(13, -5), (17, -5), (20, -8)])
        p.rect(-1, 6, 26, 8, (100, 70, 180)); p.dots([(14, 1), (15, 2), (16, 1), (15, 0)], (255, 222, 90))
    elif kind == 'bear':
        p = Part((176, 118, 80))
        for x in (0, 18): p.oval(x, -1, x + 7, 6); p.oval(x + 2, 1, x + 5, 4, (240, 196, 160))
    elif kind == 'cat':
        p = Part((226, 226, 236), (130, 130, 150))
        for x0, x1 in ((2, 9), (16, 23)): p.poly([(x0, 7), ((x0 + x1) / 2, -2), (x1, 7)]); p.poly([(x0 + 2, 6), ((x0 + x1) / 2, 1), (x1 - 2, 6)], (255, 180, 196))
    elif kind == 'flower':
        p = Part((255, 140, 176))
        for dx, dy in ((0, -2), (2, 0), (0, 2), (-2, 0)): p.oval(19 + dx, 3 + dy, 22 + dx, 6 + dy)
        p.oval(19, 3, 22, 6, (255, 220, 90))
    elif kind == 'headphone':
        p = Part((250, 140, 176)); p.d.arc([OX + 2, OY - 1, OX + 23, OY + 22], 180, 360, fill=p._f(None), width=2)
        p.oval(-1, 10, 4, 19); p.oval(21, 10, 26, 19); p.dot(0, 13, (255, 200, 216)); p.dot(22, 13, (255, 200, 216))
    elif kind == 'beanie':
        p = Part((120, 184, 236)); p.oval(1, 0, 24, 16); p.erase_rect(0, 10, 25, 17); p.rect(0, 8, 25, 10, (96, 156, 214)); p.oval(10, -4, 15, 1, WHITE)
        p.dots([(6, 4), (10, 3), (15, 3), (19, 4)], (96, 156, 214))
    elif kind == 'leaf':
        p = Part((110, 196, 104)); p.line_([(12, 3), (12, -1)], (110, 80, 50)); p.oval(12, -4, 18, 0)
    return p.done()
HATS = [('none', '없음'), ('ribbon', '리본'), ('cap', '야구모자'), ('crown', '왕관'), ('wizard', '마법사 모자'), ('bear', '곰돌이 귀'),
        ('cat', '고양이 귀'), ('flower', '꽃핀'), ('headphone', '헤드폰'), ('beanie', '털모자'), ('leaf', '새싹')]

def glasses(kind):
    if kind == 'round':
        p = Part((70, 70, 96), None)
        for x in (6, 14): p.d.ellipse([x + OX, 13 + OY, x + 5 + OX, 18 + OY], outline=(70, 70, 96, 255))
        p.line_([(11, 15), (14, 15)]); return p.done(False)
    p = Part((236, 70, 120), (150, 30, 70))
    for x in (6, 14): p.dots([(x, 14), (x + 1, 14), (x + 3, 14), (x + 4, 14)] + [(x + i, 15) for i in range(5)] + [(x + i, 16) for i in range(1, 4)] + [(x + 2, 17)])
    p.line_([(11, 15), (14, 15)]); p.dot(7, 15, (255, 190, 210)); p.dot(15, 15, (255, 190, 210))
    return p.done()
GLASSES = [('none', '없음'), ('round', '동그란 안경'), ('heart', '하트 선글라스')]

def hand(kind):
    if kind == 'book':
        p = Part((236, 96, 100)); p.poly([(18, 26), (24, 25), (25, 33), (19, 34)]); p.line_([(21, 26), (22, 33)], dk((236, 96, 100), .75)); p.dot(19, 27, WHITE)
    elif kind == 'balloon':
        p = Part((255, 110, 146)); p.line_([(20, 30), (23, 8)], (130, 120, 130)); p.oval(19, -1, 27, 8); p.dot(21, 1, (255, 200, 216)); p.dot(22, 1, (255, 200, 216))
    elif kind == 'flower':
        p = Part((250, 100, 126)); p.line_([(20, 31), (21, 22)], (80, 160, 90))
        for dx, dy in ((0, -2), (2, 0), (0, 2), (-2, 0)): p.oval(19 + dx, 18 + dy, 22 + dx, 21 + dy)
        p.oval(19, 18, 22, 21, (255, 220, 90))
    elif kind == 'wand':
        p = Part((255, 210, 70), (200, 140, 30)); p.line_([(20, 31), (23, 21)], (250, 250, 250))
        p.poly([(24, 14), (25, 17), (28, 17), (26, 19), (27, 22), (24, 20), (21, 22), (22, 19), (20, 17), (23, 17)])
    elif kind == 'pencil':
        p = Part((255, 206, 80)); p.poly([(19, 31), (21, 32), (26, 22), (24, 21)]); p.poly([(24, 21), (26, 22), (26, 19)], (250, 220, 190)); p.dot(19, 31, (250, 140, 160))
    elif kind == 'lollipop':
        p = Part((255, 130, 170)); p.line_([(20, 31), (22, 23)], (250, 250, 250)); p.oval(18, 16, 26, 24); p.dots([(21, 18), (23, 19), (22, 21), (20, 20)], WHITE)
    elif kind == 'bear':
        p = Part((196, 140, 96)); p.oval(18, 24, 26, 33); p.oval(18, 22, 21, 25); p.oval(23, 22, 26, 25); p.dots([(20, 27), (24, 27)], (60, 40, 40)); p.oval(21, 28, 23, 30, (240, 210, 170))
    return p.done()
HANDS = [('none', '없음'), ('book', '책'), ('balloon', '풍선'), ('flower', '꽃'), ('wand', '별 지팡이'), ('pencil', '연필'), ('lollipop', '막대사탕'), ('bear', '곰인형')]

PRESETS = [
    ('하트 남자친구', dict(skin='light', face='smile', hair='spiky', hairColor='brown', top='heart_blue', bottom='shorts', shoes='brown', hat='none', glasses='none', hand='none')),
    ('하트 여자친구', dict(skin='light', face='smile', hair='bob', hairColor='brown', top='heart_pink', bottom='skirt_denim', shoes='pink', hat='flower', glasses='none', hand='none')),
    ('책벌레', dict(skin='light', face='smile', hair='bowl', hairColor='black', top='sailor', bottom='pants', shoes='brown', hat='none', glasses='round', hand='book')),
    ('양갈래 친구', dict(skin='tan', face='wink', hair='pigtail', hairColor='chestnut', top='stripe', bottom='skirt_check', shoes='red', hat='none', glasses='none', hand='lollipop')),
    ('모자 친구', dict(skin='tan', face='sparkle', hair='spiky', hairColor='black', top='overall', bottom='shorts', shoes='white', hat='cap', glasses='none', hand='balloon')),
    ('곰돌이 친구', dict(skin='light', face='cat', hair='curly', hairColor='chestnut', top='bear', bottom='shorts', shoes='brown', hat='bear', glasses='none', hand='bear')),
    ('고양이 친구', dict(skin='light', face='cat', hair='bob', hairColor='pink', top='hoodie', bottom='skirt_pink', shoes='white', hat='cat', glasses='none', hand='pencil')),
    ('마법사 친구', dict(skin='brown', face='sparkle', hair='long', hairColor='sky', top='robe', bottom='pants', shoes='brown', hat='wizard', glasses='none', hand='wand')),
    ('독서왕', dict(skin='tan', face='smile', hair='spiky', hairColor='blonde', top='cape', bottom='pants', shoes='red', hat='crown', glasses='none', hand='book')),
    ('한복 친구', dict(skin='light', face='smile', hair='bun', hairColor='black', top='hanbok', bottom='skirt_pink', shoes='pink', hat='flower', glasses='none', hand='none')),
    ('음악 친구', dict(skin='brown', face='heart', hair='ponytail', hairColor='blonde', top='heart_yellow', bottom='skirt_denim', shoes='white', hat='headphone', glasses='heart', hand='none')),
    ('선생님', dict(skin='tan', face='smile', hair='long', hairColor='brown', top='cardigan', bottom='pants', shoes='brown', hat='none', glasses='round', hand='book')),
]

def compose(look, back_styles, covers):
    names = []
    if look['hair'] in back_styles: names.append(f"hairb_{look['hair']}_{look['hairColor']}")
    names += [f"legs_{look['skin']}", f"shoes_{look['shoes']}"]
    if look['top'] not in covers: names.append(f"bottom_{look['bottom']}")
    names += [f"hands_{look['skin']}", f"top_{look['top']}", f"head_{look['skin']}", f"face_{look['face']}"]
    if look['glasses'] != 'none': names.append(f"glasses_{look['glasses']}")
    names.append(f"hairf_{look['hair']}_{look['hairColor']}")
    if look['hat'] != 'none': names.append(f"hat_{look['hat']}")
    if look['hand'] != 'none': names.append(f"hand_{look['hand']}")
    return names

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT): os.remove(os.path.join(OUT, f))
    for k, _, c in SKINS: save(legs(c), f'legs_{k}'); save(hands(c), f'hands_{k}'); save(head(c), f'head_{k}')
    for k, _ in FACES: save(face(k), f'face_{k}')
    back = set()
    for s, _ in HAIRS:
        for ck, _, c in HAIR_COLORS:
            fr, bk = hair(s, c); save(fr, f'hairf_{s}_{ck}')
            if bk is not None: save(bk, f'hairb_{s}_{ck}'); back.add(s)
    for k, _, _ in TOPS: save(top(k), f'top_{k}')
    for k, _ in BOTTOMS: save(bottom(k), f'bottom_{k}')
    for k, _, c in SHOE_COLORS: save(shoes(c), f'shoes_{k}')
    for k, _ in HATS[1:]: save(hat(k), f'hat_{k}')
    for k, _ in GLASSES[1:]: save(glasses(k), f'glasses_{k}')
    for k, _ in HANDS[1:]: save(hand(k), f'hand_{k}')
    covers = [k for k, _, cv in TOPS if cv]
    pv = None
    for n in compose(PRESETS[0][1], back, covers):
        im = Image.open(f'{OUT}/{n}.png').convert('RGBA'); pv = im if pv is None else Image.alpha_composite(pv, im)
    pv.save(f'{OUT}/preview.png', optimize=True)
    data = {
        'version': VERSION, 'aspect': W / H,
        'skin': [[k, n, '#%02x%02x%02x' % c] for k, n, c in SKINS], 'face': FACES,
        'hair': HAIRS, 'hairBack': sorted(back), 'hairColor': [[k, n, '#%02x%02x%02x' % c] for k, n, c in HAIR_COLORS],
        'top': [[k, n] for k, n, _ in TOPS], 'covers': covers, 'bottom': BOTTOMS,
        'shoes': [[k, n, '#%02x%02x%02x' % c] for k, n, c in SHOE_COLORS],
        'hat': HATS, 'glasses': GLASSES, 'hand': HANDS, 'presets': [[n, look] for n, look in PRESETS],
    }
    with open('minimi-data.js', 'w', encoding='utf-8') as fp:
        fp.write('// scripts/cyroom_minimi.py가 만든 파일이에요. 직접 고치지 말고 스크립트를 고쳐서 다시 만들어 주세요.\n')
        fp.write('window.MINIMI_DATA = ' + json.dumps(data, ensure_ascii=False) + ';\n')
    print(len(os.listdir(OUT)), 'files')
