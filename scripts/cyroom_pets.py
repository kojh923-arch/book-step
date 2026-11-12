# 싸이월드풍 도트 펫을 그려요 (미니미와 같은 스타일: 동글동글, 부위마다 진한 색 외곽선).
# → assets/room/dot/pet_<id>.png   실행: python3 scripts/cyroom_pets.py  (Pillow 필요)
import colorsys, os
from PIL import Image, ImageDraw

W, H, OX, OY, UP = 30, 32, 3, 8, 4
OUT = 'assets/room/dot'

def dk(c, f=.58):
    h, l, s = colorsys.rgb_to_hls(*[v / 255 for v in c]); return tuple(round(v * 255) for v in colorsys.hls_to_rgb(h, l * f, min(1, s * 1.1)))
def lt(c, f=.35): return tuple(round(v + (255 - v) * f) for v in c)

class Part:
    def __init__(s, color, line=None):
        s.c = color; s.line = line or dk(color); s.img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); s.d = ImageDraw.Draw(s.img)
    def _f(s, c): return (s.c if c is None else c) + (255,)
    def _p(s, pts): return [(x + OX, y + OY) for x, y in pts]
    def rect(s, x0, y0, x1, y1, c=None): s.d.rectangle([x0 + OX, y0 + OY, x1 + OX, y1 + OY], fill=s._f(c))
    def oval(s, x0, y0, x1, y1, c=None): s.d.ellipse([x0 + OX, y0 + OY, x1 + OX, y1 + OY], fill=s._f(c))
    def poly(s, pts, c=None): s.d.polygon(s._p(pts), fill=s._f(c))
    def dot(s, x, y, c=None): s.d.point((x + OX, y + OY), fill=s._f(c))
    def dots(s, pts, c=None): [s.dot(x, y, c) for x, y in pts]
    def line_(s, pts, c=None, w=1): s.d.line(s._p(pts), fill=s._f(c), width=w)
    def done(s):
        if s.line is None: return s.img
        px = s.img.load(); out = s.img.copy(); o = out.load()
        for y in range(H):
            for x in range(W):
                if px[x, y][3]: continue
                if any(0 <= x + a < W and 0 <= y + b < H and px[x + a, y + b][3] for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    o[x, y] = s.line + (255,)
        return out

EYE = (40, 30, 36); WHITE = (255, 255, 255); BLUSH = (255, 160, 170); PINK = (255, 170, 190); NOSE = (70, 46, 46)
def eyes(p, y=8, xs=(8, 15), shine=True, c=EYE):
    for x in xs: p.rect(x, y, x + 1, y + 1, c); p.dot(x, y, WHITE) if shine else None
def blush(p, y=11, xs=(5, 17)):
    for x in xs: p.rect(x, y, x + 1, y, BLUSH)
def stack(*parts):
    img = parts[0]
    for q in parts[1:]: img = Image.alpha_composite(img, q)
    return img

def dog():
    c = (214, 160, 108); body = Part(c); body.oval(6, 12, 18, 20); body.oval(16, 12, 21, 15); body.oval(7, 18, 10, 21); body.oval(14, 18, 17, 21)
    head = Part(c); head.oval(3, 1, 20, 15); head.oval(8, 9, 15, 15, lt(c, .55))
    ears = Part(dk(c, .78)); ears.oval(0, 2, 5, 12); ears.oval(18, 2, 23, 12)
    face = Part(EYE, None); eyes(face); face.rect(11, 10, 12, 11, NOSE); face.dots([(10, 13), (11, 13), (12, 13), (13, 13)][1:3], (200, 90, 100)); blush(face)
    return stack(body.done(), head.done(), ears.done(), face.done())
def shiba():
    c = (232, 150, 72); body = Part(c); body.oval(6, 12, 18, 20); body.oval(8, 14, 16, 20, (252, 240, 224))
    tail = Part(c); tail.oval(16, 9, 23, 15); tail.oval(18, 11, 21, 13, (252, 240, 224))
    head = Part(c); head.poly([(4, 4), (6, -2), (9, 3)]); head.poly([(14, 3), (17, -2), (19, 4)]); head.oval(3, 1, 20, 15)
    head.oval(6, 8, 17, 15, (252, 240, 224)); head.dots([(6, 1), (17, 1)], (255, 200, 200))
    face = Part(EYE, None); eyes(face, 7); face.rect(11, 10, 12, 10, NOSE); face.dots([(10, 12), (13, 12)], (200, 90, 100)); face.dots([(11, 13), (12, 13)], (200, 90, 100)); blush(face, 10)
    return stack(tail.done(), body.done(), head.done(), face.done())
def cat(c=(250, 186, 110), stripe=(222, 130, 60), eye=EYE):
    tail = Part(c); tail.line_([(17, 18), (21, 15), (22, 10)], None, 3)
    body = Part(c); body.oval(6, 12, 18, 20); body.oval(7, 18, 10, 21); body.oval(14, 18, 17, 21)
    head = Part(c); head.poly([(4, 6), (5, -1), (10, 3)]); head.poly([(13, 3), (18, -1), (19, 6)]); head.oval(3, 2, 20, 15)
    head.poly([(6, 4), (6, 1), (8, 3)], PINK); head.poly([(15, 3), (17, 1), (17, 4)], PINK)
    if stripe: head.dots([(11, 3), (11, 4), (12, 3), (12, 4), (9, 4), (14, 4)], stripe)
    face = Part(eye, None); eyes(face, 8, c=eye); face.dot(11, 11, (240, 120, 140)); face.dot(12, 11, (240, 120, 140)); blush(face)
    if eye != EYE: face.dots([(8, 8), (15, 8)], (40, 40, 40))
    return stack(tail.done(), body.done(), head.done(), face.done())
def rabbit():
    c = (250, 248, 246); line = (176, 160, 176)
    ears = Part(c, line); ears.oval(6, -6, 10, 7); ears.oval(13, -6, 17, 7); ears.oval(7, -4, 9, 5, PINK); ears.oval(14, -4, 16, 5, PINK)
    body = Part(c, line); body.oval(6, 12, 18, 20); body.oval(16, 15, 20, 19)
    head = Part(c, line); head.oval(4, 3, 19, 15)
    face = Part(EYE, None); eyes(face, 8, (8, 14)); face.dots([(11, 11), (12, 11)], (240, 120, 140)); blush(face, 11, (5, 16))
    return stack(ears.done(), body.done(), head.done(), face.done())
def hamster():
    c = (240, 170, 96); body = Part(c); body.oval(2, 3, 21, 20); body.oval(5, 9, 18, 20, (255, 244, 232))
    body.oval(3, 1, 7, 5); body.oval(16, 1, 20, 5); body.dots([(4, 2), (17, 2)], PINK)
    face = Part(EYE, None); eyes(face, 7, (7, 15)); face.dot(11, 10, (240, 120, 140)); face.dot(12, 10, (240, 120, 140)); blush(face, 10, (4, 18))
    paw = Part((255, 214, 200), (220, 150, 130)); paw.rect(9, 14, 10, 15); paw.rect(13, 14, 14, 15)
    return stack(body.done(), face.done(), paw.done())
def chick():
    c = (255, 222, 90); body = Part(c); body.oval(4, 3, 19, 19); body.poly([(10, 4), (11, -1), (13, 4)]); body.oval(15, 9, 20, 14, dk(c, .9))
    feet = Part((246, 150, 60)); feet.rect(8, 19, 10, 20); feet.rect(13, 19, 15, 20)
    beak = Part((246, 150, 60)); beak.poly([(10, 10), (13, 10), (11.5, 12)])
    face = Part(EYE, None); eyes(face, 7, (8, 14)); blush(face, 10, (5, 16))
    return stack(feet.done(), body.done(), beak.done(), face.done())
def penguin():
    c = (64, 80, 120); body = Part(c); body.oval(4, 1, 19, 20); body.oval(2, 9, 6, 16); body.oval(17, 9, 21, 16)
    body.oval(6, 5, 17, 20, (250, 250, 252))
    feet = Part((246, 160, 60)); feet.oval(6, 19, 10, 21); feet.oval(13, 19, 17, 21)
    beak = Part((246, 160, 60)); beak.poly([(10, 9), (13, 9), (11.5, 11)])
    face = Part(EYE, None); eyes(face, 7, (8, 14)); blush(face, 10, (6, 16))
    return stack(feet.done(), body.done(), beak.done(), face.done())
def panda():
    blk = (56, 56, 66); wht = (250, 250, 250); line = (60, 60, 72)
    ears = Part(blk); ears.oval(2, 0, 7, 5); ears.oval(16, 0, 21, 5)
    body = Part(wht, line); body.oval(6, 12, 18, 20); body.oval(4, 13, 8, 18, blk); body.oval(16, 13, 20, 18, blk); body.oval(7, 18, 10, 21, blk); body.oval(14, 18, 17, 21, blk)
    head = Part(wht, line); head.oval(3, 2, 20, 15); head.oval(6, 6, 10, 11, blk); head.oval(13, 6, 17, 11, blk)
    face = Part(EYE, None); face.dots([(8, 8), (15, 8)], WHITE); face.rect(11, 10, 12, 11, blk); blush(face, 12, (4, 18))
    return stack(ears.done(), body.done(), head.done(), face.done())
def turtle():
    g = (126, 200, 110); skin = (170, 220, 140)
    legs = Part(skin); [legs.oval(x, 15, x + 4, 20) for x in (2, 16)]; legs.oval(19, 12, 25, 17); legs.poly([(0, 14), (3, 13), (2, 16)])
    shell = Part(g); shell.oval(2, 5, 21, 18); shell.rect(2, 13, 21, 16, dk(g, .85))
    shell.dots([(7, 8), (8, 8), (11, 7), (12, 7), (15, 8), (16, 8), (9, 11), (10, 11), (13, 11), (14, 11)], lt(g, .4))
    head = Part(skin); head.oval(18, 6, 26, 14)
    face = Part(EYE, None); face.rect(22, 8, 23, 9); face.dot(22, 8, WHITE); face.dot(24, 12, (230, 110, 120))
    return stack(legs.done(), shell.done(), head.done(), face.done())
def blackcat(): return cat((70, 66, 84), None, (255, 214, 80))

PETS = [('pet_dog', '갈색 강아지', dog), ('pet_shiba', '시바견', shiba), ('pet_cat', '치즈 고양이', cat), ('pet_blackcat', '까만 고양이', blackcat),
        ('pet_rabbit', '하얀 토끼', rabbit), ('pet_hamster', '햄스터', hamster), ('pet_chick', '병아리', chick), ('pet_penguin', '펭귄', penguin),
        ('pet_panda', '아기 판다', panda), ('pet_turtle', '거북이', turtle)]

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for key, name, fn in PETS:
        img = fn(); bb = img.getbbox()
        img.resize((W * UP, H * UP), Image.NEAREST).save(f'{OUT}/{key}.png', optimize=True)
        print(key, name, bb)
