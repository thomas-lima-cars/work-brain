import sys, numpy as np, potrace
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
S = 4  # amplia antes de traçar: curvas mais lisas
im = Image.open(src).convert("RGBA")
w, h = im.size
a = im.getchannel("A").resize((w*S, h*S), Image.LANCZOS)
bm = potrace.Bitmap(np.array(a) <= 127)  # o potracer traca o False como tinta
plist = bm.trace(turdsize=8, alphamax=1.0, opticurve=True, opttolerance=0.2)
f = lambda p: f"{p.x/S:.2f},{p.y/S:.2f}"
d = []
for curve in plist:
    d.append("M" + f(curve.start_point))
    for seg in curve.segments:
        if seg.is_corner:
            d.append("L" + f(seg.c) + "L" + f(seg.end_point))
        else:
            d.append("C" + f(seg.c1) + " " + f(seg.c2) + " " + f(seg.end_point))
    d.append("Z")
open(out, "w", newline=chr(10)).write("".join(d))
print(len(plist), "contornos,", len("".join(d)), "bytes", w, h)
