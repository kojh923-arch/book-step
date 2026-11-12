# 싸이월드풍 쿼터뷰 도트 그림 도구: 상자·원기둥·공 같은 기본 도형을 2:1 쿼터뷰로 그려요.
# 좌표: x = 오른쪽 아래로, y = 왼쪽 아래로, z = 위로. 보이는 면: 윗면(밝게)·왼쪽 앞면(기본)·오른쪽 앞면(어둡게)
from PIL import Image, ImageDraw
import colorsys

OUTLINE = (66, 46, 42, 255)

def tone(c, f):
    h, l, s = colorsys.rgb_to_hls(*[v / 255 for v in c[:3]])
    l = max(0.0, min(1.0, l * f if f < 1 else l + (1 - l) * (f - 1) * 2.2))
    return tuple(round(v * 255) for v in colorsys.hls_to_rgb(h, l, min(1, s * (1.05 if f < 1 else .95))))

class Pen:
    ZK = 2.2  # 높이 배율
    def __init__(self, u, size=1400):
        self.u = u
        self.img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.img)
        self.ox, self.oy = size / 2, size * 0.7
        self.fp = [1e9, 1e9, -1e9, -1e9]   # 바닥 발자국(x0, y0, x1, y1): 벽에 붙일 때 쓰는 뒤쪽 모서리 계산용
    def _fp(self, x0, y0, x1, y1):
        f = self.fp; f[0] = min(f[0], x0); f[1] = min(f[1], y0); f[2] = max(f[2], x1); f[3] = max(f[3], y1)
    def P(self, x, y, z=0):
        u = self.u
        return (self.ox + (x - y) * 2 * u, self.oy + (x + y) * u - z * self.ZK * u)
    def poly(self, pts, c, edge=True):
        sp = [self.P(*p) for p in pts]
        self.d.polygon(sp, fill=c[:3] + (255,), outline=(tone(c, .58) + (255,)) if edge else None)
    def line(self, a, b, c, w=1):
        self.d.line([self.P(*a), self.P(*b)], fill=c[:3] + (255,), width=w)
    def box(self, x, y, z, dx, dy, dz, c, top=None, left=None, right=None, edge=True, faces='lrt'):
        self._fp(x, y, x + dx, y + dy)
        if 'l' in faces: self.poly([(x, y + dy, z), (x + dx, y + dy, z), (x + dx, y + dy, z + dz), (x, y + dy, z + dz)], left or c, edge)
        if 'r' in faces: self.poly([(x + dx, y, z), (x + dx, y + dy, z), (x + dx, y + dy, z + dz), (x + dx, y, z + dz)], right or tone(c, .82), edge)
        if 't' in faces: self.poly([(x, y, z + dz), (x + dx, y, z + dz), (x + dx, y + dy, z + dz), (x, y + dy, z + dz)], top or tone(c, 1.12), edge)
    def lrect(self, x0, x1, z0, z1, y, c, edge=True):   # 왼쪽 앞면(y 고정) 위의 사각형
        self.poly([(x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1)], c, edge)
    def rrect(self, y0, y1, z0, z1, x, c, edge=True):   # 오른쪽 앞면(x 고정) 위의 사각형
        self.poly([(x, y0, z0), (x, y1, z0), (x, y1, z1), (x, y0, z1)], c, edge)
    def trect(self, x0, x1, y0, y1, z, c, edge=True):
        self.poly([(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)], c, edge)
    def ell(self, cx, cy, rx, ry, c, edge=True):
        self.d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=c[:3] + (255,), outline=(tone(c, .58) + (255,)) if edge else None)
    def cyl(self, x, y, z, r, h, c, top=None):
        self._fp(x - r, y - r, x + r, y + r)
        u = self.u; rx, ry = 2.83 * r * u, 1.41 * r * u
        bx, by = self.P(x, y, z); tx, ty = self.P(x, y, z + h)
        self.ell(bx, by, rx, ry, tone(c, .82))
        self.d.rectangle([bx - rx, ty, bx + rx, by], fill=c[:3] + (255,))
        self.d.rectangle([bx + rx * .35, ty, bx + rx, by], fill=tone(c, .82) + (255,))
        self.d.rectangle([bx - rx * .75, ty, bx - rx * .5, by], fill=tone(c, 1.1) + (255,))
        e = tone(c, .58) + (255,)
        self.d.line([bx - rx, ty, bx - rx, by], fill=e); self.d.line([bx + rx, ty, bx + rx, by], fill=e)
        self.d.arc([bx - rx, by - ry, bx + rx, by + ry], 0, 180, fill=e)
        self.ell(tx, ty, rx, ry, top or tone(c, 1.12))
    def ball(self, x, y, z, r, c):
        self._fp(x - r, y - r, x + r, y + r)
        u = self.u; R = 2.2 * r * u
        cx, cy = self.P(x, y, z + r * 1.0)
        self.ell(cx, cy, R, R, tone(c, .82))
        self.ell(cx - R * .12, cy - R * .12, R * .86, R * .86, c, edge=False)
        self.ell(cx - R * .38, cy - R * .4, R * .28, R * .2, tone(c, 1.25), edge=False)
    def blob(self, x, y, z, rx, ry, c, edge=True):  # 화면 기준 타원 (잎·쿠션 등)
        cx, cy = self.P(x, y, z); self.ell(cx, cy, rx * self.u, ry * self.u, c, edge)

def finish(img, target_w, aspect, up=4, anchor='bottom', size=None, point=None):
    """잘라내고 → 외곽선 → 원래 그림 비율의 캔버스에 맞춰 놓고 → 블록 확대.
    size=(W, H)를 주면 그 크기 캔버스에 놓아요 (앞모습·뒷모습 크기 맞추기).
    point=(x, y)를 주면 그 점이 결과 그림에서 어디에 있는지 (0~1 비율)를 finish.point에 남겨요."""
    bb = img.getbbox(); img = img.crop(bb)
    w, h = img.size
    W = w + 4; H = max(h + 4, round(W / aspect))
    if size: W, H = max(W, size[0]), max(H, size[1])
    px0, py0 = (W - w) // 2, (H - h - 2 if anchor == 'bottom' else (H - h) // 2)
    can = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    can.paste(img, (px0, py0), img)
    finish.size = (W, H)
    finish.point = None if point is None else (round((point[0] - bb[0] + px0) / W, 4), round((point[1] - bb[1] + py0) / H, 4))
    # 알파 정리 (반투명 없애기)
    px = can.load()
    for yy in range(H):
        for xx in range(W):
            p = px[xx, yy]
            px[xx, yy] = p[:3] + (255,) if p[3] >= 128 else (0, 0, 0, 0)
    out = can.copy(); o = out.load()
    for yy in range(H):
        for xx in range(W):
            if px[xx, yy][3]: continue
            if any(0 <= xx + a < W and 0 <= yy + b < H and px[xx + a, yy + b][3] for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                o[xx, yy] = OUTLINE
    return out.resize((W * up, H * up), Image.NEAREST)
