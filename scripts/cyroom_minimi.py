# 싸이월드풍 미니미 옷 입히기: 부위별 도트 그림(같은 크기의 투명 PNG)을 겹쳐서 캐릭터를 만들어요.
# → assets/room/dot/minimi/*.png, minimi-data.js (선택지·기본 캐릭터 목록)
# 실행: python3 scripts/cyroom_minimi.py   (Pillow 필요)
import json, os, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__))
from cyroom_engine import tone

W, H, UP = 48, 74, 4
OUT = 'assets/room/dot/minimi'
LINE = (70, 48, 50, 255)
CLEAR = (0, 0, 0, 0)

def new(): img = Image.new('RGBA', (W, H), CLEAR); return img, ImageDraw.Draw(img)
def c4(c): return tuple(c[:3]) + (255,)
def R(d, x0, y0, x1, y1, c): d.rectangle([x0, y0, x1, y1], fill=c4(c) if c != CLEAR else CLEAR)
def O(d, x0, y0, x1, y1, c): d.ellipse([x0, y0, x1, y1], fill=c4(c) if c != CLEAR else CLEAR)
def G(d, pts, c): d.polygon(pts, fill=c4(c) if c != CLEAR else CLEAR)

def outline(img, color=LINE):
    px = img.load(); out = img.copy(); o = out.load()
    for y in range(H):
        for x in range(W):
            if px[x, y][3]: continue
            if any(0 <= x + a < W and 0 <= y + b < H and px[x + a, y + b][3] for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                o[x, y] = color
    return out
def shade_right(img, x_from, f=.86):   # 오른쪽을 살짝 어둡게 (입체감)
    px = img.load()
    for y in range(H):
        for x in range(x_from, W):
            p = px[x, y]
            if p[3] and p[:3] != LINE[:3]: px[x, y] = tone(p, f) + (255,)
def save(img, name, line=True):
    if line: img = outline(img)
    img.resize((W * UP, H * UP), Image.NEAREST).save(f'{OUT}/{name}.png', optimize=True)

# ---------- 몸 (피부·신발) ----------
SKINS = [('light', '밝은 피부', (255, 228, 208)), ('tan', '보통 피부', (246, 206, 172)), ('brown', '구릿빛 피부', (206, 156, 116))]
def body(skin):
    img, d = new()
    for x in (19, 26):
        R(d, x, 55, x + 3, 65, skin)
        O(d, x - 2, 63, x + 5, 69, (120, 84, 74)); R(d, x - 1, 64, x + 1, 65, (170, 130, 116))
    R(d, 21, 38, 26, 44, tone(skin, .9))
    for x in (9, 33): O(d, x, 47, x + 6, 54, skin)
    O(d, 7, 25, 12, 31, skin); O(d, 36, 25, 41, 31, skin)
    O(d, 8, 11, 40, 42, tone(skin, .9)); O(d, 8, 11, 38, 41, skin)
    O(d, 12, 14, 20, 20, tone(skin, 1.06))
    return img

# ---------- 얼굴 ----------
EYE = (58, 40, 52); BLUSH = (255, 166, 180); MOUTH = (196, 76, 92)
def eye(d, x, y, big=False):
    w, h = (5, 8) if big else (4, 7)
    O(d, x, y, x + w, y + h, EYE); R(d, x + 1, y + 1, x + 2, y + 2, (255, 255, 255)); R(d, x + w - 1, y + h - 2, x + w - 1, y + h - 2, (255, 255, 255))
    if big: R(d, x + 1, y + 1, x + 3, y + 3, (255, 255, 255)); R(d, x + 3, y + h - 3, x + 3, y + h - 3, (255, 255, 255))
def closed(d, x, y):
    for i, dy in enumerate((1, 0, 0, 1, 2) if False else (2, 1, 1, 2)): R(d, x + i, y + dy, x + i, y + dy, EYE)
    R(d, x + 4, y + 3, x + 4, y + 3, EYE)
def face(kind):
    img, d = new()
    for x in (11, 32): O(d, x, 33, x + 5, 36, BLUSH)
    if kind == 'smile': eye(d, 16, 26); eye(d, 28, 26); R(d, 22, 36, 22, 36, MOUTH); R(d, 23, 37, 25, 37, MOUTH); R(d, 26, 36, 26, 36, MOUTH)
    elif kind == 'sparkle':
        eye(d, 15, 25, True); eye(d, 28, 25, True)
        O(d, 22, 35, 26, 38, MOUTH); R(d, 23, 37, 25, 37, (255, 150, 160))
    elif kind == 'wink':
        closed(d, 16, 28); eye(d, 28, 26); R(d, 22, 36, 22, 36, MOUTH); R(d, 23, 37, 25, 37, MOUTH); R(d, 26, 36, 26, 36, MOUTH)
    elif kind == 'cat':
        eye(d, 16, 26); eye(d, 28, 26)
        for x, y in ((21, 36), (22, 37), (23, 36), (24, 36), (25, 37), (26, 36)): R(d, x, y, x, y, MOUTH)
    elif kind == 'sleepy':
        closed(d, 16, 29); closed(d, 28, 29); O(d, 23, 36, 25, 38, MOUTH)
    return img
FACES = [('smile', '방긋'), ('sparkle', '반짝'), ('wink', '윙크'), ('cat', '냥냥'), ('sleepy', '졸려')]

# ---------- 머리 (앞머리 + 뒷머리) ----------
HAIR_COLORS = [('black', '검정', (52, 44, 54)), ('brown', '갈색', (124, 80, 56)), ('chestnut', '밤색', (176, 106, 64)),
               ('blonde', '금발', (250, 208, 110)), ('pink', '분홍', (250, 150, 184)), ('sky', '하늘', (126, 188, 240))]
def hair_cap(d, c, side_to=30):
    O(d, 7, 8, 41, 36, c)
    # 앞머리: 이마 아래를 지그재그로 지워요
    G(d, [(12, 22), (15, 19), (18, 23), (21, 18), (24, 23), (27, 18), (30, 23), (33, 19), (36, 22), (36, 40), (12, 40)], CLEAR)
    R(d, 7, 22, 11, side_to, c); R(d, 37, 22, 41, side_to, c)
    O(d, 14, 11, 22, 14, tone(c, 1.22)); R(d, 24, 11, 27, 12, tone(c, 1.22))   # 윤기
def hair(style, c):
    f, df = new(); b, db = new()
    if style == 'short': hair_cap(df, c, 28); O(db, 8, 10, 40, 38, tone(c, .85))
    elif style == 'bob': hair_cap(df, c, 40); R(df, 7, 36, 13, 41, c); R(df, 35, 36, 41, 41, c); O(db, 6, 10, 42, 44, tone(c, .85))
    elif style == 'long': hair_cap(df, c, 46); O(db, 6, 10, 42, 40, tone(c, .85)); R(db, 6, 24, 42, 58, tone(c, .85)); O(db, 6, 52, 42, 62, tone(c, .85))
    elif style == 'pigtail':
        hair_cap(df, c, 32)
        for x in (0, 38):
            O(df, x, 24, x + 10, 46, c); O(df, x + 2, 28, x + 5, 34, tone(c, 1.2))
        for x in (6, 38): R(df, x, 24, x + 4, 27, (255, 120, 150))
    elif style == 'bun': hair_cap(df, c, 30); O(df, 17, 0, 31, 12, c); O(df, 20, 2, 24, 5, tone(c, 1.2)); O(db, 8, 10, 40, 38, tone(c, .85))
    elif style == 'curly':
        O(db, 5, 8, 43, 40, tone(c, .85)); O(df, 8, 6, 40, 32, c)
        for x, y in ((6, 9), (12, 4), (19, 2), (26, 2), (33, 4), (38, 10), (4, 18), (40, 18), (3, 27), (41, 27)):
            O(df, x - 1, y, x + 8, y + 9, c); O(df, x + 1, y + 2, x + 3, y + 3, tone(c, 1.2))
        G(df, [(12, 24), (16, 20), (20, 24), (24, 20), (28, 24), (32, 20), (36, 24), (36, 40), (12, 40)], CLEAR)
    elif style == 'spiky':
        hair_cap(df, c, 28)
        for x in range(8, 38, 6): G(df, [(x, 12), (x + 3, 1), (x + 7, 12)], c)
        O(db, 8, 10, 40, 38, tone(c, .85))
    elif style == 'ponytail':
        hair_cap(df, c, 30); O(db, 8, 10, 40, 38, tone(c, .85))
        G(db, [(34, 12), (44, 18), (46, 34), (42, 48), (38, 44), (40, 30), (34, 20)], tone(c, .85)); R(df, 36, 14, 40, 18, (255, 120, 150))
    return f, b
HAIRS = [('short', '짧은 머리'), ('bob', '단발'), ('long', '긴 머리'), ('pigtail', '양갈래'), ('bun', '똥머리'), ('curly', '곱슬'), ('spiky', '뾰족'), ('ponytail', '포니테일')]

# ---------- 상의 (팔 포함). covers=True 면 하의를 덮어요 ----------
def torso(d, c, x0=15, x1=33, y1=55):
    G(d, [(x0, 41), (x1, 41), (x1 + 1, y1), (x0 - 1, y1)], c)
    G(d, [(x0 + 1, 41), (9, 48), (13, 51), (x0 + 2, 46)], c); G(d, [(x1 - 1, 41), (39, 48), (35, 51), (x1 - 2, 46)], c)
def top(kind):
    img, d = new()
    if kind == 'tee_red': torso(d, (240, 106, 112)); R(d, 21, 41, 27, 42, (255, 255, 255))
    elif kind == 'tee_blue': torso(d, (104, 156, 232)); O(d, 21, 46, 27, 51, (255, 230, 110))
    elif kind == 'stripe':
        torso(d, (252, 252, 248))
        for y in range(43, 56, 3): R(d, 13, y, 35, y, (80, 100, 170))
        G(d, [(9, 48), (13, 51), (8, 52), (4, 52)], CLEAR); G(d, [(39, 48), (35, 51), (40, 52), (44, 52)], CLEAR)
    elif kind == 'hoodie':
        O(d, 13, 36, 35, 46, (130, 214, 186)); torso(d, (150, 224, 196))
        R(d, 18, 49, 30, 54, (130, 204, 176)); R(d, 21, 42, 21, 47, (255, 255, 255)); R(d, 27, 42, 27, 47, (255, 255, 255))
    elif kind == 'uniform':
        torso(d, (70, 82, 136)); G(d, [(18, 41), (30, 41), (24, 47)], (252, 252, 252))
        G(d, [(21, 43), (27, 43), (24, 47)], (230, 70, 84)); R(d, 23, 47, 25, 52, (230, 70, 84))
    elif kind == 'overall':
        torso(d, (252, 252, 246)); R(d, 17, 45, 31, 55, (96, 140, 212)); R(d, 18, 41, 20, 45, (96, 140, 212)); R(d, 28, 41, 30, 45, (96, 140, 212))
        R(d, 17, 55, 22, 62, (96, 140, 212)); R(d, 26, 55, 31, 62, (96, 140, 212)); R(d, 22, 48, 26, 51, (130, 170, 230))
    elif kind == 'dress':
        torso(d, (250, 168, 196), y1=50); G(d, [(15, 49), (33, 49), (38, 61), (10, 61)], (250, 168, 196))
        for x in range(12, 37, 4): O(d, x, 57, x + 2, 59, (255, 255, 255))
        R(d, 15, 49, 33, 50, (240, 120, 160))
    elif kind == 'robe':
        torso(d, (146, 108, 220), y1=64); G(d, [(15, 41), (33, 41), (37, 65), (11, 65)], (146, 108, 220))
        for x, y in ((17, 50), (29, 56), (20, 60)): R(d, x, y - 1, x, y + 1, (255, 220, 90)); R(d, x - 1, y, x + 1, y, (255, 220, 90))
    elif kind == 'bear':
        torso(d, (186, 128, 88), y1=56); O(d, 18, 45, 30, 55, (240, 206, 166))
        R(d, 18, 55, 23, 63, (186, 128, 88)); R(d, 25, 55, 30, 63, (186, 128, 88))
    elif kind == 'cape':
        G(d, [(14, 41), (34, 41), (40, 64), (8, 64)], (206, 50, 70)); torso(d, (250, 220, 110)); R(d, 15, 41, 33, 43, (255, 255, 255))
        for x in (20, 24, 28): R(d, x, 42, x, 42, (230, 70, 84))
    elif kind == 'hanbok':
        torso(d, (252, 196, 210), y1=48)
        for i, col in enumerate(((240, 90, 90), (255, 210, 90), (110, 200, 140), (110, 150, 230))):
            G(d, [(10 + i, 47 - i), (14 + i, 50 - i), (15 + i, 49 - i), (11 + i, 46 - i)], col); G(d, [(38 - i, 47 - i), (34 - i, 50 - i), (33 - i, 49 - i), (37 - i, 46 - i)], col)
        G(d, [(15, 47), (33, 47), (37, 64), (11, 64)], (110, 140, 230)); G(d, [(20, 42), (24, 46), (28, 42)], (255, 255, 255)); R(d, 23, 46, 25, 52, (230, 70, 100))
    elif kind == 'cardigan':
        torso(d, (234, 212, 176)); G(d, [(20, 41), (28, 41), (26, 55), (22, 55)], (252, 252, 252))
        for y in (45, 49, 53): R(d, 22, y, 22, y, (150, 110, 80))
    shade_right(img, 29)
    return img
TOPS = [('tee_red', '빨강 티셔츠', False), ('tee_blue', '파랑 티셔츠', False), ('stripe', '줄무늬 티', False), ('hoodie', '후드티', False),
        ('uniform', '교복', False), ('overall', '멜빵바지', True), ('dress', '원피스', True), ('robe', '마법사 로브', True),
        ('bear', '곰돌이 옷', True), ('cape', '독서왕 망토', False), ('hanbok', '한복', True), ('cardigan', '가디건', False)]

# ---------- 하의 ----------
def bottom(kind):
    img, d = new()
    if kind in ('jeans', 'black'):
        c = (88, 126, 196) if kind == 'jeans' else (62, 62, 82)
        R(d, 16, 52, 32, 56, c); R(d, 17, 56, 23, 63, c); R(d, 25, 56, 31, 63, c); R(d, 24, 54, 24, 57, tone(c, .7))
    elif kind == 'shorts': R(d, 16, 52, 32, 58, (226, 196, 150)); R(d, 24, 55, 24, 58, tone((226, 196, 150), .7))
    elif kind in ('skirt_pink', 'skirt_check'):
        c = (250, 150, 180) if kind == 'skirt_pink' else (220, 80, 90)
        G(d, [(16, 51), (32, 51), (36, 60), (12, 60)], c)
        if kind == 'skirt_check':
            for x in range(14, 36, 4): R(d, x, 52, x, 59, (250, 200, 120))
            R(d, 13, 56, 35, 56, (250, 200, 120))
    shade_right(img, 28)
    return img
BOTTOMS = [('jeans', '청바지'), ('shorts', '반바지'), ('skirt_pink', '분홍 치마'), ('skirt_check', '체크 치마'), ('black', '검정 바지')]

# ---------- 모자·장식 ----------
def hat(kind):
    img, d = new()
    if kind == 'ribbon': G(d, [(30, 8), (40, 2), (41, 14)], (240, 90, 130)); G(d, [(30, 8), (20, 2), (20, 14)], (240, 90, 130)); O(d, 27, 5, 33, 11, (220, 60, 110))
    elif kind == 'cap': O(d, 8, 6, 40, 26, (236, 84, 84)); R(d, 8, 17, 40, 26, CLEAR); R(d, 4, 17, 26, 20, (200, 60, 60)); O(d, 22, 5, 26, 8, (255, 255, 255))
    elif kind == 'crown':
        G(d, [(13, 12), (14, 2), (19, 8), (24, 0), (29, 8), (34, 2), (35, 12)], (255, 206, 70)); R(d, 13, 10, 35, 13, (240, 180, 50))
        for x, col in ((18, (240, 90, 110)), (24, (110, 170, 240)), (30, (110, 200, 140))): R(d, x - 1, 10, x + 1, 12, col)
    elif kind == 'wizard':
        G(d, [(4, 16), (44, 16), (30, -1), (22, -1)], (130, 96, 210)); G(d, [(22, 0), (30, 0), (34, -6), (28, -6)], CLEAR)
        G(d, [(18, 4), (32, 4), (26, -10)], (130, 96, 210)); R(d, 4, 14, 44, 17, (100, 70, 180)); R(d, 24, 6, 26, 8, (255, 220, 90))
    elif kind == 'bear':
        for x in (5, 31): O(d, x, 2, x + 12, 14, (176, 120, 84)); O(d, x + 3, 5, x + 9, 11, (240, 196, 160))
    elif kind == 'cat':
        for x0, x1 in ((7, 19), (29, 41)): G(d, [(x0, 14), ((x0 + x1) // 2, 0), (x1, 14)], (220, 220, 232)); G(d, [(x0 + 3, 12), ((x0 + x1) // 2, 4), (x1 - 3, 12)], (255, 182, 196))
    elif kind == 'flower':
        for dx, dy in ((0, -3), (3, 0), (0, 3), (-3, 0)): O(d, 34 + dx, 12 + dy, 39 + dx, 17 + dy, (255, 150, 180))
        O(d, 35, 13, 38, 16, (255, 220, 90))
    elif kind == 'headphone':
        d.arc([8, 4, 40, 36], 180, 360, fill=(250, 150, 180, 255), width=3)
        for x in (4, 38): O(d, x, 20, x + 7, 32, (250, 150, 180)); O(d, x + 2, 23, x + 5, 29, (255, 200, 216))
    elif kind == 'beanie':
        O(d, 8, 6, 40, 30, (120, 190, 240)); R(d, 8, 19, 40, 30, CLEAR); R(d, 7, 17, 41, 21, (90, 160, 220)); O(d, 20, 0, 28, 8, (255, 255, 255))
    return img
HATS = [('none', '없음'), ('ribbon', '리본'), ('cap', '야구모자'), ('crown', '왕관'), ('wizard', '마법사 모자'), ('bear', '곰돌이 귀'),
        ('cat', '고양이 귀'), ('flower', '꽃핀'), ('headphone', '헤드폰'), ('beanie', '털모자')]

def glasses(kind):
    img, d = new()
    if kind == 'round':
        for x in (14, 26): d.ellipse([x, 25, x + 9, 34], outline=(70, 70, 96, 255))
        R(d, 23, 29, 26, 29, (70, 70, 96))
    elif kind == 'heart':
        for x in (14, 26):
            O(d, x, 25, x + 5, 30, (240, 80, 130)); O(d, x + 4, 25, x + 9, 30, (240, 80, 130)); G(d, [(x, 28), (x + 9, 28), (x + 4.5, 34)], (240, 80, 130))
            R(d, x + 2, 26, x + 3, 27, (255, 180, 200))
        R(d, 23, 28, 26, 28, (200, 60, 110))
    return img
GLASSES = [('none', '없음'), ('round', '동그란 안경'), ('heart', '하트 선글라스')]

def hand(kind):
    img, d = new()
    if kind == 'book':
        G(d, [(31, 44), (42, 42), (44, 55), (33, 57)], (240, 110, 110)); G(d, [(32, 45), (41, 43), (42, 46), (33, 48)], (255, 250, 240))
        G(d, [(36, 44), (37, 44), (39, 56), (38, 56)], (200, 80, 80))
    elif kind == 'balloon':
        d.line([36, 50, 40, 18], fill=(120, 110, 120, 255)); O(d, 34, 4, 46, 18, (255, 120, 150)); O(d, 37, 7, 40, 10, (255, 200, 216))
        G(d, [(39, 18), (42, 18), (40, 20)], (255, 120, 150))
    elif kind == 'flower':
        d.line([36, 52, 38, 38], fill=(80, 160, 90, 255), width=2); O(d, 37, 44, 42, 47, (110, 190, 110))
        for dx, dy in ((0, -3), (3, 0), (0, 3), (-3, 0)): O(d, 35 + dx, 33 + dy, 40 + dx, 38 + dy, (250, 110, 130))
        O(d, 36, 34, 39, 37, (255, 220, 90))
    elif kind == 'wand':
        d.line([36, 52, 41, 34], fill=(250, 250, 250, 255), width=2)
        G(d, [(42, 26), (44, 31), (48, 31), (45, 34), (46, 39), (42, 36), (38, 39), (39, 34), (36, 31), (40, 31)], (255, 214, 80))
    elif kind == 'pencil':
        G(d, [(34, 52), (37, 54), (46, 36), (43, 34)], (255, 210, 90)); G(d, [(43, 34), (46, 36), (45, 31)], (250, 220, 190)); R(d, 33, 52, 35, 55, (250, 150, 170))
    elif kind == 'lollipop':
        d.line([36, 52, 39, 38], fill=(250, 250, 250, 255), width=2); O(d, 33, 28, 45, 40, (255, 140, 170))
        d.arc([35, 30, 43, 38], 0, 300, fill=(255, 255, 255, 255)); O(d, 38, 33, 40, 35, (255, 255, 255))
    return img
HANDS = [('none', '없음'), ('book', '책'), ('balloon', '풍선'), ('flower', '꽃'), ('wand', '별 지팡이'), ('pencil', '연필'), ('lollipop', '막대사탕')]

PRESETS = [
    ('책 읽는 친구', dict(skin='light', face='smile', hair='short', hairColor='black', top='tee_blue', bottom='jeans', hat='none', glasses='none', hand='book')),
    ('리본 친구', dict(skin='light', face='sparkle', hair='long', hairColor='brown', top='dress', bottom='skirt_pink', hat='ribbon', glasses='none', hand='flower')),
    ('양갈래 친구', dict(skin='tan', face='wink', hair='pigtail', hairColor='chestnut', top='stripe', bottom='skirt_check', hat='none', glasses='none', hand='lollipop')),
    ('교복 친구', dict(skin='light', face='smile', hair='bob', hairColor='black', top='uniform', bottom='black', hat='none', glasses='round', hand='book')),
    ('모자 친구', dict(skin='tan', face='sparkle', hair='short', hairColor='brown', top='overall', bottom='jeans', hat='cap', glasses='none', hand='balloon')),
    ('곰돌이 친구', dict(skin='light', face='cat', hair='curly', hairColor='chestnut', top='bear', bottom='shorts', hat='bear', glasses='none', hand='none')),
    ('고양이 친구', dict(skin='light', face='cat', hair='bob', hairColor='pink', top='hoodie', bottom='shorts', hat='cat', glasses='none', hand='pencil')),
    ('마법사 친구', dict(skin='brown', face='sparkle', hair='long', hairColor='sky', top='robe', bottom='black', hat='wizard', glasses='none', hand='wand')),
    ('독서왕', dict(skin='tan', face='smile', hair='spiky', hairColor='blonde', top='cape', bottom='black', hat='crown', glasses='none', hand='book')),
    ('한복 친구', dict(skin='light', face='smile', hair='bun', hairColor='black', top='hanbok', bottom='skirt_pink', hat='flower', glasses='none', hand='none')),
    ('음악 친구', dict(skin='brown', face='sleepy', hair='ponytail', hairColor='blonde', top='tee_red', bottom='jeans', hat='headphone', glasses='heart', hand='none')),
    ('선생님', dict(skin='tan', face='smile', hair='long', hairColor='brown', top='cardigan', bottom='black', hat='none', glasses='round', hand='book')),
]

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT): os.remove(os.path.join(OUT, f))
    for k, _, c in SKINS: save(body(c), f'body_{k}')
    for k, _ in FACES: save(face(k), f'face_{k}', line=False)
    back = []
    for s, _ in HAIRS:
        for ck, _, c in HAIR_COLORS:
            f, b = hair(s, c); save(f, f'hairf_{s}_{ck}')
            if b.getbbox(): save(b, f'hairb_{s}_{ck}'); back.append(s)
    for k, _, _ in TOPS: save(top(k), f'top_{k}')
    for k, _ in BOTTOMS: save(bottom(k), f'bottom_{k}')
    for k, _ in HATS[1:]: save(hat(k), f'hat_{k}')
    for k, _ in GLASSES[1:]: save(glasses(k), f'glasses_{k}', line=k != 'round')
    for k, _ in HANDS[1:]: save(hand(k), f'hand_{k}')
    # 상점 아이콘용 미리보기 (첫 번째 기본 캐릭터)
    L = PRESETS[0][1]; names = []
    if L['hair'] in back: names.append(f"hairb_{L['hair']}_{L['hairColor']}")
    names += [f"body_{L['skin']}", f"bottom_{L['bottom']}", f"top_{L['top']}", f"face_{L['face']}", f"hairf_{L['hair']}_{L['hairColor']}", f"hand_{L['hand']}"]
    pv = None
    for n in names:
        im = Image.open(f'{OUT}/{n}.png').convert('RGBA'); pv = im if pv is None else Image.alpha_composite(pv, im)
    pv.save(f'{OUT}/preview.png', optimize=True)
    data = {
        'version': 1, 'aspect': W / H,
        'skin': [[k, n, '#%02x%02x%02x' % c] for k, n, c in SKINS], 'face': FACES,
        'hair': HAIRS, 'hairBack': sorted(set(back)), 'hairColor': [[k, n, '#%02x%02x%02x' % c] for k, n, c in HAIR_COLORS],
        'top': [[k, n] for k, n, _ in TOPS], 'covers': [k for k, _, cv in TOPS if cv],
        'bottom': BOTTOMS, 'hat': HATS, 'glasses': GLASSES, 'hand': HANDS,
        'presets': [[n, look] for n, look in PRESETS],
    }
    with open('minimi-data.js', 'w', encoding='utf-8') as fp:
        fp.write('// scripts/cyroom_minimi.py가 만든 파일이에요. 직접 고치지 말고 스크립트를 고쳐서 다시 만들어 주세요.\n')
        fp.write('window.MINIMI_DATA = ' + json.dumps(data, ensure_ascii=False) + ';\n')
    print(len(os.listdir(OUT)), 'files')
