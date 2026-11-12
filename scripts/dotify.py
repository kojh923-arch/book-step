# 방 아이템 그림(assets/room/*.png)을 도트 그림(assets/room/dot/*.png)으로 변환해요. 원본은 바꾸지 않아요.
# 저장소 맨 위 폴더에서 실행: python3 scripts/dotify.py  (Pillow 필요)
import re, sys, os, glob
from PIL import Image, ImageEnhance, ImageFilter
sql = open('supabase-room.sql', encoding='utf-8').read()
base_w = {m[0]: float(m[1]) for m in re.findall(r"'assets/room/([a-z0-9_]+)\.png[^']*',\s*([\d.]+)\)", sql)}
out = 'assets/room/dot'; os.makedirs(out, exist_ok=True)
PX = 3.2      # 방 폭 1%당 도트 칸 수 (모든 아이템이 같은 도트 크기)
UP = 8        # 저장 배율 (블록이 또렷하게)
def dotify(path, name):
    im = Image.open(path).convert('RGBA')
    gw = max(22, round(base_w.get(name, 12) * PX))
    gh = max(1, round(im.height * gw / im.width))
    # 프리멀티플라이드 평균 축소 → 가장자리 색 번짐 방지
    r, g, b, a = im.split()
    pm = Image.merge('RGB', [Image.composite(c, Image.new('L', im.size, 0), a) for c in (r, g, b)])
    small_rgb = pm.resize((gw, gh), Image.BOX); small_a = a.resize((gw, gh), Image.BOX)
    px, pa = small_rgb.load(), small_a.load()
    rgb = Image.new('RGB', (gw, gh)); q = rgb.load()
    for y in range(gh):
        for x in range(gw):
            al = pa[x, y]
            if al: q[x, y] = tuple(min(255, round(c * 255 / al)) for c in px[x, y])
    rgb = ImageEnhance.Color(rgb).enhance(1.18); rgb = ImageEnhance.Contrast(rgb).enhance(1.08)
    mask = small_a.point(lambda v: 255 if v >= 110 else 0)
    # 아이템별 팔레트 (색 수 제한, 디더링 없음)
    n = 20 if gw < 40 else 28
    pal = rgb.quantize(colors=n, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    res = Image.new('RGBA', (gw, gh), (0, 0, 0, 0))
    res.paste(pal, (0, 0), mask)
    # 외곽선: 바깥 테두리를 이웃 색을 어둡게 해서 칠해요 (검정보다 부드러운 싸이월드 느낌)
    src = res.copy(); s, d = src.load(), res.load()
    W, H = res.size
    for y in range(H):
        for x in range(W):
            if s[x, y][3]: continue
            nb = [s[x+dx, y+dy] for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)) if 0 <= x+dx < W and 0 <= y+dy < H and s[x+dx, y+dy][3]]
            if nb:
                c = nb[0]; d[x, y] = (int(c[0]*.38), int(c[1]*.33), int(c[2]*.36), 255)
    res = res.resize((W * UP, H * UP), Image.NEAREST)
    res.save(f'{out}/{name}.png', optimize=True)
    return W, H
for f in sorted(glob.glob('assets/room/*.png')):
    n = os.path.basename(f)[:-4]
    print(n, dotify(f, n), base_w.get(n))
