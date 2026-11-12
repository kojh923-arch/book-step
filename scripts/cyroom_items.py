# 방 아이템 39개를 싸이월드 미니룸 스타일 도트로 새로 그려요. → assets/room/dot/<id>.png
# 실행: python3 scripts/cyroom_items.py   (Pillow 필요). DB·원본 그림은 건드리지 않아요.
import json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from cyroom_engine import Pen, finish, tone

WOOD = (232, 176, 116); WOOD2 = (204, 140, 88); CREAM = (252, 240, 214); WHITE = (248, 246, 242)
PINK = (250, 178, 190); PINK2 = (236, 132, 152); MINT = (156, 222, 196); SKY = (156, 204, 244)
LAV = (196, 180, 236); YEL = (255, 222, 112); GREEN = (118, 196, 104); GREEN2 = (72, 150, 86)
GRAY = (186, 190, 206); DARK = (72, 78, 98); SCREEN = (64, 84, 120); RED = (238, 112, 112)
BLUE = (112, 156, 228); BEIGE = (230, 204, 176); BROWN = (168, 112, 76); CORK = (214, 168, 112)
BOOKS = [RED, BLUE, YEL, MINT, LAV, PINK, (250, 168, 96)]

def books(p, x0, x1, z0, y, hmax, seed=0, gap=0.25):
    x = x0; i = seed
    while x < x1 - 0.9:
        w = 0.9 + (i * 7 % 3) * 0.35; h = hmax * (0.7 + (i * 5 % 4) * 0.1)
        p.lrect(x, min(x + w, x1), z0, z0 + h, y, BOOKS[i % len(BOOKS)])
        x += w + gap; i += 1

def screen_glare(p, x0, x1, z0, z1, y):
    p.lrect(x0, x1, z0, z1, y, SCREEN)
    p.lrect(x0 + (x1 - x0) * .12, x0 + (x1 - x0) * .3, z0 + (z1 - z0) * .45, z1 - (z1 - z0) * .12, y + .01, tone(SCREEN, 1.35), edge=False)

# ---------- 가구 ----------
def study_desk(p):
    for lx, ly in ((0, 0), (22.5, 0), (0, 10.5), (22.5, 10.5)): p.box(lx, ly, 0, 1.5, 1.5, 14, WOOD2)
    p.box(1.5, 10.5, 9, 21, 1, 1.2, WOOD2)
    p.box(0, 0, 14, 24, 12, 1.6, WOOD)
    p.box(13, 2, 10.2, 10, 10, 3.8, WOOD); p.lrect(13.6, 22.4, 10.6, 13.6, 12.01, tone(WOOD, 1.08)); p.lrect(17.2, 18.8, 11.8, 12.4, 12.02, BROWN)

def bookcase5(p):
    p.box(0, 0, 0, 16, 6, 40, WOOD)
    p.lrect(0.9, 15.1, 1, 39, 6.01, tone(WOOD2, .85))
    for k in range(5):
        z = 1 + k * 7.6
        p.lrect(0.9, 15.1, z, z + 0.9, 6.02, WOOD)
        if k == 2: p.lrect(10, 13.5, z + 0.9, z + 4.2, 6.03, MINT); books(p, 1.5, 9, z + 0.9, 6.03, 5.6, k)
        else: books(p, 1.5, 14.5, z + 0.9, 6.03, 6.0, k * 2)

def storage_bed(p):
    p.box(0, 0, 0, 1.6, 16, 13, WOOD)
    p.box(1.6, 0, 0, 28.4, 16, 5, WOOD)
    for x0 in (4, 17): p.lrect(x0, x0 + 11, 0.8, 4.2, 16.01, tone(WOOD, 1.08)); p.lrect(x0 + 4.8, x0 + 6.2, 2.2, 2.8, 16.02, BROWN)
    p.box(1.8, 0.4, 5, 28, 15.2, 2.6, WHITE)
    p.box(2.6, 2.2, 7.6, 6, 11.6, 1.8, CREAM)
    p.box(11, 0.1, 5.1, 19.2, 15.8, 2.9, PINK)
    p.trect(13, 29.4, 1, 15, 8.02, tone(PINK, 1.18), edge=False)
    for xx in range(14, 30, 4): p.blob(xx, 8, 8.05, .55, .3, tone(PINK, 1.35), edge=False)

def drawer3(p):
    p.box(0, 0, 0, 15, 9, 17, WOOD)
    for k in range(3):
        z = 1 + k * 5.2
        p.lrect(1, 14, z, z + 4.4, 9.01, tone(WOOD, 1.08)); p.lrect(6.6, 8.4, z + 1.8, z + 2.6, 9.02, BROWN)

def floor_table(p):
    for lx, ly in ((0.5, 0.5), (18, 0.5), (0.5, 9.5), (18, 9.5)): p.box(lx, ly, 0, 1.5, 1.5, 5, WOOD2)
    p.box(0, 0, 5, 20, 11.5, 1.5, CREAM, top=WHITE)

def clothes_hanger(p):
    for x0 in (0, 17):
        p.box(x0, 0, 0, 1.4, 6, 1, WOOD2); p.box(x0, 2.3, 1, 1.4, 1.4, 27, WOOD)
    p.box(0, 2.6, 27.5, 18.4, 0.9, 0.9, WOOD2)
    for i, (c, x0, w, h) in enumerate(((SKY, 2.5, 4, 12), (YEL, 7, 4.2, 15), (PINK, 11.6, 4, 11))):
        p.line((x0 + w / 2, 3.1, 27.5), (x0 + w / 2, 3.1, 26), DARK)
        p.poly([(x0, 3.2, 26), (x0 + w, 3.2, 26), (x0 + w + .6, 3.2, 26 - h), (x0 - .6, 3.2, 26 - h)], c)
    p.box(3, 1.5, 1, 6, 4, 2.2, BEIGE); p.box(10, 1.5, 1, 5, 4, 3.5, MINT)

def book_cart(p):
    for lx, ly in ((0, 0), (15, 0), (0, 7), (15, 7)):
        p.box(lx, ly, 1.2, 0.9, 0.9, 16, GRAY); p.blob(lx + .4, ly + .4, 0.6, 1.3, .9, DARK)
    for z in (3, 9.5):
        p.box(0, 0, z, 15.9, 7.9, 1, WOOD)
        books(p, 1, 14.5, z + 1, 7.92, 4.8, int(z))
    p.box(0, 0, 16.4, 15.9, 7.9, 0.8, WOOD)

def full_mirror(p):
    p.box(3, -1, 0, 2, 6, 1, WOOD2)
    p.box(0, 0, 0.8, 10, 1.6, 30, WOOD)
    p.lrect(1, 9, 2, 29.8, 1.61, (214, 236, 252))
    p.poly([(2, 1.62, 18), (5, 1.62, 28), (6.6, 1.62, 28), (3.6, 1.62, 18)], (246, 252, 255), edge=False)
    p.poly([(5, 1.62, 8), (7.5, 1.62, 15), (8.4, 1.62, 15), (5.9, 1.62, 8)], (246, 252, 255), edge=False)

def storage_bed_dummy(p): pass

# ---------- 의자·쿠션 ----------
def floor_cushion(p):
    p.cyl(6, 6, 0, 5.6, 2.2, PINK)
    for a, b in ((2.2, 6.8), (6.8, 2.2)): p.ball(a, b, 1.6, 1.3, PINK2)
    cx, cy = p.P(6, 6, 2.2); u = p.u
    p.ell(cx - 4 * u, cy, .9 * u, .9 * u, DARK, edge=False); p.ell(cx + 4 * u, cy, .9 * u, .9 * u, DARK, edge=False)
    p.ell(cx, cy + 1.6 * u, 1.6 * u, 1.1 * u, (255, 236, 236), edge=False)

def sitting_ball(p):
    p.ball(5, 5, 0, 5.2, MINT)
    cx, cy = p.P(5, 5, 5.2); u = p.u
    p.d.arc([cx - 9 * u, cy - 2.5 * u, cx + 9 * u, cy + 4.5 * u], 10, 170, fill=tone(MINT, .7) + (255,), width=max(1, round(u)))

def sitting_chair(p):
    p.poly([(0, 0, 2), (0, 12, 2), (-3, 12, 15), (-3, 0, 15)], tone(BEIGE, .92))
    p.poly([(-3, 0, 15), (-1.5, 0, 15), (1.5, 0, 2), (0, 0, 2)], tone(BEIGE, .75))
    p.poly([(-3, 0, 15), (-3, 12, 15), (-1.5, 12, 15), (-1.5, 0, 15)], tone(BEIGE, 1.1))
    p.poly([(0.4, 1, 3.4), (0.4, 11, 3.4), (-2, 11, 13.6), (-2, 1, 13.6)], PINK)
    p.box(0, 0, 0, 12, 12, 2.6, BEIGE)
    p.box(1, 1, 2.6, 10.5, 10.5, 1.6, PINK)

def storage_stool(p):
    p.cyl(5, 5, 0, 4.6, 7.5, LAV)
    p.cyl(5, 5, 7.5, 4.9, 1.4, tone(LAV, 1.12))
    cx, cy = p.P(5, 5, 9.2); u = p.u
    p.ell(cx, cy, 2.4 * u, 1.1 * u, tone(LAV, .8))

def swivel_chair(p):
    for dx, dy in ((5, 0), (-5, 0), (0, 5), (0, -5)):
        p.line((6, 6, 1.2), (6 + dx, 6 + dy, 0.8), DARK, max(2, round(p.u * 1.2))); p.blob(6 + dx, 6 + dy, 0.2, 1.2, .9, DARK)
    p.cyl(6, 6, 1, 0.7, 7, GRAY)
    p.box(1, 1, 8, 10, 10, 2.4, PINK)
    p.box(0, 1.5, 10, 2, 9, 12, PINK, top=tone(PINK, 1.1))
    for yy in (0.2, 10.3): p.box(3, yy, 10.4, 7, 1.4, 1, DARK); p.box(7.5, yy, 8.5, 1, 1.4, 2, DARK)

# ---------- 조명 ----------
def mood_lamp(p):
    p.cyl(4, 4, 0, 3.4, 2.2, LAV)
    p.ball(4, 4, 2.2, 3.4, YEL)
    cx, cy = p.P(4, 4, 5.4); u = p.u
    p.ell(cx - 2 * u, cy, .6 * u, .7 * u, DARK, edge=False); p.ell(cx + 2 * u, cy, .6 * u, .7 * u, DARK, edge=False)
    p.d.arc([cx - 1.4 * u, cy, cx + 1.4 * u, cy + 1.8 * u], 20, 160, fill=DARK + (255,), width=max(1, round(u * .6)))
    p.ell(cx - 3.6 * u, cy + 1.6 * u, .9 * u, .5 * u, PINK, edge=False); p.ell(cx + 3.6 * u, cy + 1.6 * u, .9 * u, .5 * u, PINK, edge=False)

def stand_lamp(p):
    p.cyl(4, 4, 0, 3, 0.9, WOOD2)
    p.box(3.6, 3.6, 0.9, 0.8, 0.8, 24, WOOD)
    cx, top = p.P(4, 4, 31); _, bot = p.P(4, 4, 25); u = p.u
    p.d.polygon([(cx - 4 * u, top), (cx + 4 * u, top), (cx + 7.5 * u, bot), (cx - 7.5 * u, bot)], fill=CREAM + (255,), outline=tone(CREAM, .58) + (255,))
    p.d.polygon([(cx + 1.5 * u, top), (cx + 4 * u, top), (cx + 7.5 * u, bot), (cx + 3.5 * u, bot)], fill=tone(CREAM, .88) + (255,))
    p.ell(cx, bot, 7.5 * u, 1.4 * u, (255, 236, 150))

# ---------- 벽 장식 (벽에 거는 판: 오른쪽 앞면이 정면) ----------
def wall_panel(p, w, h, frame, face, depth=0.8):
    p.box(0, 0, 0, depth, w, h, frame, right=frame)
    p.rrect(0.8, w - 0.8, 0.8, h - 0.8, depth + 0.01, face)

def mini_board(p):
    wall_panel(p, 14, 10, WOOD, WHITE)
    for i, c in enumerate((RED, BLUE, GREEN)): p.line((0.82, 2 + i * 1.2, 7.5 - i * 1.8), (0.82, 7 + i * 1.6, 7.3 - i * 1.8), c, 2)
    p.box(0.9, 9.5, 1, 1, 3, 0.6, DARK)

def dday_calendar(p):
    wall_panel(p, 10, 11, WHITE, WHITE)
    p.rrect(0.8, 9.2, 8, 10.2, 0.81, RED)
    for r in range(3):
        for c in range(4):
            col = PINK if (r, c) == (1, 2) else tone(GRAY, 1.05)
            p.rrect(1.3 + c * 2.0, 2.4 + c * 2.0, 5.6 - r * 2.0, 6.8 - r * 2.0, 0.82, col, edge=False)
    for yy in (2.5, 7.5): p.box(0.2, yy, 10.6, 0.8, .6, 1.4, GRAY)

def wall_pocket(p):
    wall_panel(p, 9, 12, BEIGE, BEIGE)
    p.line((0.4, 0.5, 12.8), (0.4, 4.5, 14.5), BROWN, 1); p.line((0.4, 4.5, 14.5), (0.4, 8.5, 12.8), BROWN, 1)
    p.rrect(0.6, 8.4, 6, 8.4, 0.85, tone(PINK, 1.05)); p.rrect(0.6, 8.4, 1, 4.6, 0.85, tone(MINT, 1.0))
    p.rrect(2, 3, 8.4, 11, 0.84, YEL); p.rrect(5, 6.4, 4.6, 7.2, 0.84, BLUE)

def mini_shelf(p):
    for yy in (1.5, 13.5): p.box(0, yy, -2.6, 1.2, 1, 2.6, WOOD2)
    p.box(0, 0, 0, 5, 16, 1.2, WOOD)
    for i, yy in enumerate((1, 2.6, 4.2)): p.box(1, yy, 1.2, 3.2, 1.4, 5 - i * .7, BOOKS[i + 1])
    p.cyl(2.6, 8.4, 1.2, 1.5, 2.4, WHITE); p.ball(2.6, 8.4, 3.4, 1.6, GREEN)
    p.box(1.5, 11.5, 1.2, 1, 3.4, 4, WOOD2); p.rrect(11.9, 14.5, 1.8, 4.6, 2.51, SKY)

def memo_board(p):
    wall_panel(p, 16, 12, WOOD, CORK)
    for i, (yy, zz, c) in enumerate(((2, 7, YEL), (6, 8, PINK), (10.5, 6.5, MINT), (3.5, 2.5, SKY), (9, 2.2, (255, 255, 255)))):
        p.rrect(yy, yy + 3, zz, zz + 2.8, 0.82, c)
        p.blob(0.9, yy + 1.5, zz + 2.4, .5, .5, RED, edge=False)

def design_frame(p):
    wall_panel(p, 12, 12, WOOD, SKY)
    p.rrect(1.6, 10.4, 1.6, 5.5, 0.82, GREEN, edge=False)
    p.poly([(0.83, 1.6, 5.5), (0.83, 6, 8), (0.83, 10.4, 5.5)], tone(GREEN, .85), edge=False)
    cx, cy = p.P(0.83, 8.2, 9); p.ell(cx, cy, 1.4 * p.u, 1.4 * p.u, YEL, edge=False)
    p.rrect(2, 4, 8.6, 9.4, 0.83, WHITE, edge=False)

# ---------- 인테리어 ----------
def blanket_basket(p):
    p.cyl(6, 6, 0, 5.4, 8, BEIGE, top=tone(BROWN, .9))
    cx, cy = p.P(6, 6, 0); u = p.u
    for k in range(1, 4):
        _, yy = p.P(6, 6, k * 2)
        p.d.arc([cx - 15.3 * u, yy - 7.6 * u, cx + 15.3 * u, yy + 7.6 * u], 0, 180, fill=tone(BEIGE, .7) + (255,))
    p.box(2.5, 2.5, 7.4, 7, 7, 1.6, PINK); p.box(3, 3, 9, 6, 6, 1.6, MINT); p.box(3.4, 3.4, 10.6, 5.2, 5.2, 1.4, YEL)
    p.poly([(9.2, 8, 7.4), (9.2, 9.5, 7.4), (10.6, 10.6, 3), (10.6, 9.4, 2.6)], PINK2)

def air_purifier(p):
    p.cyl(5, 5, 0, 4.4, 16, WHITE)
    cx, cy = p.P(5, 5, 16); u = p.u
    for k in range(3): p.ell(cx, cy, (10 - k * 3) * u, (5 - k * 1.5) * u, tone(GRAY, 1.0 + k * .06))
    for zz in range(2, 12, 2):
        _, yy = p.P(5, 5, zz); p.d.arc([cx - 12.4 * u, yy - 6.2 * u, cx + 12.4 * u, yy + 6.2 * u], 30, 150, fill=tone(GRAY, .9) + (255,))
    _, yy = p.P(5, 5, 13); p.ell(cx - 4 * u, yy + 4 * u, 1 * u, 1 * u, MINT, edge=False)

def acoustic_guitar(p):
    p.box(1, 1, 0, 6, 6, 0.8, WOOD2)
    p.line((4, 4, 0.8), (6, 2, 9), WOOD2, max(2, round(p.u)))
    u = p.u; cx, cy = p.P(4, 4, 7)
    p.d.rectangle([cx - 1 * u, cy - 26 * u, cx + 1 * u, cy], fill=BROWN + (255,), outline=tone(BROWN, .6) + (255,))
    p.d.rectangle([cx - 1.8 * u, cy - 30 * u, cx + 1.8 * u, cy - 26 * u], fill=tone(BROWN, .8) + (255,))
    p.ell(cx, cy + 3 * u, 6.4 * u, 6 * u, WOOD); p.ell(cx, cy - 5 * u, 4.8 * u, 4.6 * u, WOOD)
    p.ell(cx, cy - 0.5 * u, 4.4 * u, 2 * u, WOOD, edge=False)
    p.ell(cx, cy - 1 * u, 1.8 * u, 1.8 * u, DARK, edge=False)
    p.d.rectangle([cx - 2.4 * u, cy + 5 * u, cx + 2.4 * u, cy + 6 * u], fill=BROWN + (255,))

def monstera(p):
    p.cyl(5, 5, 0, 4, 6, WHITE)
    u = p.u; cx, cy = p.P(5, 5, 6)
    p.ell(cx, cy, 10 * u, 4.6 * u, tone(BROWN, .9))
    leaves = tuple((dx * 1.6, dy * 1.6, r * 1.6, s) for dx, dy, r, s in ((-8, -12, 6, -1), (7, -15, 6.4, 1), (-1, -22, 6, 0), (10, -6, 5, 1), (-10, -4, 5, -1), (2, -10, 5.4, 0)))
    for dx, dy, r, s in leaves:
        p.d.line([cx, cy - 1 * u, cx + dx * u * .85, cy + dy * u * .85], fill=GREEN2 + (255,), width=max(1, round(u * .9)))
    for dx, dy, r, s in leaves:
        x, y = cx + dx * u, cy + dy * u
        p.ell(x, y, r * u, r * .78 * u, GREEN)
        p.ell(x - r * .25 * u, y - r * .28 * u, r * .5 * u, r * .3 * u, tone(GREEN, 1.15), edge=False)
        p.d.line([x - r * .85 * u, y + r * .1 * u, x + r * .85 * u, y - r * .1 * u], fill=GREEN2 + (255,), width=max(1, round(u * .6)))
        for k in (-.5, .5):   # 몬스테라 잎 갈라진 홈
            p.d.line([x + k * r * u, y - r * .05 * u, x + k * r * 1.15 * u, y + r * .7 * u], fill=GREEN2 + (255,), width=max(1, round(u * .6)))

# ---------- 전자기기 ----------
def phone_stand(p):
    p.box(0, 0, 0, 6, 5, 1, WHITE)
    p.poly([(1, 1, 1), (1, 4, 1), (-0.5, 4, 9), (-0.5, 1, 9)], DARK)
    p.poly([(1.1, 1, 1), (-0.4, 1, 9), (-0.4, 4, 9), (1.1, 4, 1)], DARK)
    p.rrect(1.4, 3.6, 2.4, 8.2, 0.6, SCREEN); p.box(0, 0, 1, 2.4, 5, 0.8, PINK)

def keyboard_mouse(p):
    p.box(0, 0, 0, 15, 5.5, 1, WHITE)
    for r in range(3):
        for c in range(7): p.trect(0.8 + c * 2, 2.2 + c * 2, 0.6 + r * 1.6, 1.8 + r * 1.6, 1.01, tone(PINK, 1.15) if (r + c) % 5 else PINK, edge=False)
    p.blob(18, 3, 0.6, 2.6, 2.0, WHITE); p.blob(18, 3, 1.2, 1.4, 1.0, tone(PINK, 1.15), edge=False)

def headphone_stand(p):
    p.cyl(4, 4, 0, 3.4, 1, WOOD2)
    p.box(3.4, 3.4, 1, 1.2, 1.2, 14, WOOD)
    u = p.u; cx, cy = p.P(4, 4, 15)
    p.d.arc([cx - 8 * u, cy - 6 * u, cx + 8 * u, cy + 10 * u], 180, 360, fill=PINK2 + (255,), width=max(2, round(u * 1.6)))
    for s in (-1, 1): p.ell(cx + s * 8 * u, cy + 4 * u, 2.6 * u, 4 * u, PINK)

def power_strip_box(p):
    p.box(0, 0, 0, 14, 6, 5, WHITE)
    p.trect(2, 12, 1.5, 4.5, 5.01, tone(GRAY, 1.15))
    for xx in (2.2, 11.8): p.lrect(xx - .8, xx + .8, 1.2, 2.6, 6.01, DARK)
    p.line((13, 6, 1.5), (16, 8, 0.2), DARK, max(1, round(p.u * .8)))

def tablet_pencil(p):
    p.box(0, 0, 0, 13, 9, 0.8, WHITE)
    p.trect(0.9, 12.1, 0.9, 8.1, 0.81, SKY)
    p.trect(2, 6.5, 1.8, 7.2, 0.82, tone(SKY, 1.2), edge=False)
    p.trect(7.5, 11, 2, 5, 0.82, PINK, edge=False); p.trect(7.5, 11, 5.6, 7.2, 0.82, YEL, edge=False)
    p.box(1, 10, 0, 11, 0.9, 0.9, WHITE); p.box(0, 10, 0, 1, 0.9, 0.9, GRAY)

def laptop(p):
    p.box(0, 0, 0, 13, 9, 0.9, GRAY)
    for r in range(3): p.trect(4.2 + r * 2, 5.6 + r * 2, 1, 8, 0.91, tone(GRAY, .9), edge=False)
    p.poly([(0, 0, 0.9), (0, 9, 0.9), (-1.6, 9, 9.5), (-1.6, 0, 9.5)], GRAY)
    p.poly([(0.05, 0.5, 1.4), (0.05, 8.5, 1.4), (-1.5, 8.5, 9), (-1.5, 0.5, 9)], SCREEN, edge=False)
    p.poly([(0.06, 1.4, 4), (0.06, 3.2, 4), (-0.8, 3.2, 8), (-0.8, 1.4, 8)], tone(SCREEN, 1.4), edge=False)

def desktop_pc(p):
    p.box(0, -7, 0, 9, 5, 15, WHITE); p.lrect(1, 8, 11, 12, -1.99, tone(GRAY, 1.05)); p.blob(4.5, -2, 4, .7, .5, MINT, edge=False)
    p.box(5, 4, 0, 5, 4, 0.8, GRAY); p.box(6.8, 5.4, 0.8, 1.4, 1.2, 4, GRAY)
    p.box(5, 0, 4.5, 1.6, 14, 10, GRAY)
    p.rrect(0.8, 13.2, 5.4, 13.6, 6.61, SCREEN)
    p.poly([(6.62, 2, 8), (6.62, 4.4, 8), (6.62, 6.4, 12.6), (6.62, 4, 12.6)], tone(SCREEN, 1.4), edge=False)
    p.box(11, 2, 0, 4.5, 11, 0.6, WHITE); p.blob(14, 15, 0.4, 1.6, 1.1, WHITE)

# ---------- 문구·소품 ----------
def pencil_sharpener(p):
    p.box(0, 0, 0, 7, 6, 6, RED)
    p.lrect(1.4, 3.2, 2.4, 4.2, 6.01, DARK)
    p.rrect(1.5, 4.5, 3.2, 4.4, 7.01, tone(RED, .7))
    p.line((7.2, 3, 3.8), (9.5, 3, 5.5), GRAY, max(2, round(p.u))); p.blob(9.8, 3, 6.6, 1.1, 1.1, YEL)

def scissors_tape(p):
    p.box(0, 0, 0, 7, 5, 4, SKY)
    p.cyl(3.5, 2.5, 4, 2.4, 1.8, tone(YEL, 1.0), top=CREAM)
    u = p.u; cx, cy = p.P(11, 3, 0.5)
    p.d.line([cx - 4 * u, cy - 8 * u, cx + 5 * u, cy + 1 * u], fill=GRAY + (255,), width=max(2, round(u * 1.2)))
    p.d.line([cx + 4 * u, cy - 8 * u, cx - 5 * u, cy + 1 * u], fill=tone(GRAY, .85) + (255,), width=max(2, round(u * 1.2)))
    for s in (-1, 1): p.ell(cx + s * 5 * u, cy + 3 * u, 2.4 * u, 2 * u, PINK2); p.ell(cx + s * 5 * u, cy + 3 * u, 1 * u, .8 * u, (0, 0, 0, 0), edge=False)

def memo_clip(p):
    p.cyl(3, 3, 0, 2.6, 2.4, WOOD)
    p.line((3, 3, 2.4), (3, 3, 10), DARK, max(1, round(p.u * .7)))
    p.poly([(3.2, 0.5, 8), (3.2, 6.5, 8), (3.2, 6.5, 14.5), (3.2, 0.5, 14.5)], YEL)
    for k in range(3): p.line((3.25, 1.4, 13 - k * 1.6), (3.25, 5.6, 13 - k * 1.6), tone(YEL, .7))
    p.blob(3, 3.5, 15.6, 1.6, 1.3, BROWN); p.blob(3, 3.5, 15.8, .9, .6, tone(BROWN, 1.3), edge=False)

def eraser_cleaner(p):
    for xx in (1.5, 7.5): p.blob(xx, 5, 0.6, 1.1, 1.1, DARK)
    p.box(0, 0, 0.8, 9, 5, 4, MINT)
    p.trect(1.2, 5, 1, 4, 4.81, tone(MINT, 1.2)); p.lrect(6, 8.4, 2, 3.6, 5.01, WHITE)
    p.box(9, 1, 0.4, 2.4, 3, 1.6, tone(MINT, .9)); p.box(-2, 2, 2.8, 2, 1, 4, GRAY)

def tumbler_rack(p):
    p.box(0, 0, 0, 13, 6, 1.2, WOOD)
    for xx in (1, 11.8): p.box(xx, 2.5, 1.2, 0.6, 0.6, 7, WOOD2)
    p.box(1, 2.6, 7.6, 11.4, 0.5, 0.5, WOOD2)
    p.cyl(4, 3, 1.2, 1.8, 7, SKY); p.cyl(9, 3, 1.2, 1.8, 5.6, PINK)

def mini_bookrack(p):
    p.box(0, 0, 0, 12, 6, 1, WOOD)
    p.box(0, 0, 1, 1, 6, 7, WOOD2)
    for i, xx in enumerate((1.2, 3, 4.6, 6.4, 8)): p.box(xx, 0.8, 1, 1.6, 4.6, 6.4 - (i % 3) * 0.8, BOOKS[i])
    p.poly([(9.8, 0.8, 1), (11.4, 0.8, 1), (13, 0.8, 5.6), (11.4, 0.8, 6.2)], LAV)
    p.box(11.6, 0, 1, 0.8, 6, 5, WOOD2)

def study_partition(p):
    p.box(0, 0, 0, 1, 14, 10, CREAM, right=CREAM)
    p.box(1, 0, 0, 10, 1, 10, tone(CREAM, .94))
    p.box(1, 13, 0, 10, 1, 10, CREAM)
    p.rrect(2, 6, 5, 8, 1.01, PINK); p.rrect(8, 11, 4, 7, 1.01, MINT)
    p.rrect(4, 7, 1.5, 4, 1.01, YEL)

# ---------- 뒷모습 (돌리기용): 의자는 책상을 보고 앉게, 책상·컴퓨터는 뒤에서 본 모습 ----------
def swivel_chair_back(p):
    for dx, dy in ((5, 0), (-5, 0), (0, 5), (0, -5)):
        p.line((6, 6, 1.2), (6 + dx, 6 + dy, 0.8), DARK, max(2, round(p.u * 1.2))); p.blob(6 + dx, 6 + dy, 0.2, 1.2, .9, DARK)
    p.cyl(6, 6, 1, 0.7, 7, GRAY)
    p.box(1, 1, 8, 10, 10, 2.4, PINK)
    for yy in (0.2, 10.3): p.box(2, yy, 10.4, 7, 1.4, 1, DARK); p.box(3.5, yy, 8.5, 1, 1.4, 2, DARK)
    p.box(10, 1.5, 10, 2, 9, 12, PINK, right=tone(PINK, .78), top=tone(PINK, 1.1))
    p.rrect(3, 7.5, 13, 19, 12.01, tone(PINK, .7))

def sitting_chair_back(p):
    p.box(0, 0, 0, 12, 12, 2.6, BEIGE)
    p.box(1, 1, 2.6, 10.5, 10.5, 1.6, PINK)
    p.poly([(12, 12, 2), (10.5, 12, 2), (13.5, 12, 15), (15, 12, 15)], tone(BEIGE, .95))
    p.poly([(12, 0, 2), (12, 12, 2), (15, 12, 15), (15, 0, 15)], tone(BEIGE, .8))
    p.poly([(13.5, 0, 15), (13.5, 12, 15), (15, 12, 15), (15, 0, 15)], tone(BEIGE, 1.1))

def study_desk_back(p):
    for lx, ly in ((0, 0), (22.5, 0), (0, 10.5), (22.5, 10.5)): p.box(lx, ly, 0, 1.5, 1.5, 14, WOOD2)
    p.box(1.5, 10.5, 9, 21, 1, 1.2, WOOD2)
    p.box(1.5, 0, 10.2, 10, 10, 3.8, WOOD)
    p.box(0, 0, 14, 24, 12, 1.6, WOOD)

def laptop_back(p):
    p.box(0, 0, 0, 13, 9, 0.9, GRAY)
    p.poly([(13, 0, 0.9), (13, 9, 0.9), (14.6, 9, 9.5), (14.6, 0, 9.5)], tone(GRAY, .9))
    p.blob(13.9, 4.5, 5.6, 1.1, 1.1, WHITE, edge=False)

def desktop_pc_back(p):   # 앞모습을 180° 돌린 배치
    p.box(0, -6, 0, 4.5, 11, 0.6, WHITE); p.blob(1.5, -8, 0.4, 1.6, 1.1, WHITE)
    p.box(5.5, -1, 0, 5, 4, 0.8, GRAY); p.box(7.3, 0.4, 0.8, 1.4, 1.2, 4, GRAY)
    p.box(8.9, -7, 4.5, 1.6, 14, 10, GRAY, right=tone(GRAY, .8))
    p.rrect(-4, 2, 7, 12, 10.51, tone(GRAY, .7))
    p.box(6.5, 9, 0, 9, 5, 15, WHITE)

BACK = {'swivel_chair': swivel_chair_back, 'sitting_chair': sitting_chair_back, 'study_desk': study_desk_back,
        'laptop': laptop_back, 'desktop_pc': desktop_pc_back}

ITEMS = {f.__name__: f for f in [study_desk, bookcase5, storage_bed, drawer3, floor_table, clothes_hanger, book_cart, full_mirror,
         floor_cushion, sitting_ball, sitting_chair, storage_stool, swivel_chair, mood_lamp, stand_lamp,
         mini_board, dday_calendar, wall_pocket, mini_shelf, memo_board, design_frame,
         blanket_basket, air_purifier, acoustic_guitar, monstera,
         phone_stand, keyboard_mouse, headphone_stand, power_strip_box, tablet_pencil, laptop, desktop_pc,
         pencil_sharpener, scissors_tape, memo_clip, eraser_cleaner, tumbler_rack, mini_bookrack, study_partition]}
WALL = {'mini_board', 'dday_calendar', 'wall_pocket', 'mini_shelf', 'memo_board', 'design_frame'}

def render(fn, u):
    p = Pen(u); fn(p); return p

def back_corner(p):   # 발자국의 뒤쪽 모서리(벽 두 면이 만나는 쪽) 화면 좌표
    return p.P(p.fp[0], p.fp[1], 0)

if __name__ == '__main__':
    PX = float(os.environ.get('PX', '4.6'))   # 방 폭 1%당 도트 칸 수
    out = sys.argv[1] if len(sys.argv) > 1 else 'assets/room/dot'
    only = sys.argv[2:] or list(ITEMS)
    os.makedirs(out, exist_ok=True)
    sql = open('supabase-room.sql', encoding='utf-8').read()
    base_w = {m[0]: float(m[1]) for m in re.findall(r"'assets/room/([a-z0-9_]+)\.png[^']*',\s*([\d.]+)\)", sql)}
    man = {m['id']: m for m in json.load(open('assets/room/manifest.json', encoding='utf-8'))}
    anchors = {}
    for name in only:
        fn = ITEMS[name]
        w1 = render(fn, 1).img.getbbox(); w1 = w1[2] - w1[0]
        u = base_w[name] * PX / w1
        p = render(fn, u)
        m = man.get(name, {'w': 1, 'h': 1}); kind = 'center' if name in WALL else 'bottom'
        finish(p.img, 0, m['w'] / m['h'], anchor=kind, point=back_corner(p)).save(f'{out}/{name}.png', optimize=True)
        size = finish.size; anchors[name] = [*finish.point, round(size[1] / size[0], 4)]
        if name in BACK:   # 뒷모습: 같은 배율·같은 캔버스 크기로 그려서 돌려도 크기가 그대로예요
            q = render(BACK[name], u)
            finish(q.img, 0, m['w'] / m['h'], anchor=kind, size=size, point=back_corner(q)).save(f'{out}/{name}_back.png', optimize=True)
            anchors[name + '_back'] = [*finish.point, round(finish.size[1] / finish.size[0], 4)]
            if finish.size != size: print('!! size mismatch', name, size, finish.size)
        print(name, 'ok')
    if only == list(ITEMS):
        with open('room-dot-data.js', 'w', encoding='utf-8') as fp:
            fp.write('// scripts/cyroom_items.py가 만든 파일이에요. 직접 고치지 말고 스크립트를 고쳐서 다시 만들어 주세요.\n')
            fp.write('// anchors: 그림 속 뒤쪽 바닥 모서리 위치(가로 비율, 세로 비율)와 그림 세로/가로 비율 → 벽에 딱 붙이기에 써요\n')
            fp.write('window.ROOM_DOT = ' + json.dumps({'version': 5, 'back': sorted(BACK), 'wall': sorted(WALL), 'anchors': anchors}, ensure_ascii=False) + ';\n')
