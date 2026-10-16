"""Frequencia de cada sinal do laudo e os trechos que mais casaram.

    python automations/precificacao/laudos/audita-sinais.py [base] [n_trechos] [filtro]

Serve para pegar falso positivo antes que ele vire efeito no painel: o trecho
que casou com mais frequencia costuma ser um rotulo de formulario, nao um carro.
"""
import collections
import os
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(AQUI))
import laudo_sinais as L  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
base = sys.argv[1] if len(sys.argv) > 1 else "cars2you"
N = int(sys.argv[2]) if len(sys.argv) > 2 else 5
filtro = sys.argv[3].lower() if len(sys.argv) > 3 else ""

d = os.path.join(AQUI, "textos-vendas", base)
fs = sorted(f for f in os.listdir(d) if f.endswith(".txt"))
cont, trechos, leg = collections.Counter(), collections.defaultdict(collections.Counter), 0
for f in fs:
    r = L.ler(open(os.path.join(d, f), encoding="utf-8", errors="replace").read())
    if not r["legivel"]:
        continue
    leg += 1
    for k, v in r["sinais"].items():
        cont[k] += 1
        trechos[k][v[:100]] += 1
print("%s: %d textos, %d legiveis" % (base, len(fs), leg))
for s in L.S:
    k = s["rotulo"]
    if filtro and filtro not in k.lower():
        continue
    print("%5d %4.0f%%  %s" % (cont[k], 100 * cont[k] / max(leg, 1), k))
    for t, n in trechos[k].most_common(N):
        print("          %4d  %s" % (n, t))
