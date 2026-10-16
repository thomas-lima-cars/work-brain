"""Contagem de cada item do laudo por estado, com os trechos que mais casaram.

    python automations/precificacao/laudos/audita-itens.py [n_trechos] [filtro]

Rodar depois de mexer em `laudo_itens.py`. Falso positivo aparece como o
trecho mais frequente de um estado que nao faz sentido ("para brisa: original"
como para-brisa presente era a gravacao do vidro).
"""
import collections
import os
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(AQUI))
import laudo_itens as LI  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
N = int(sys.argv[1]) if len(sys.argv) > 1 else 2
filtro = sys.argv[2].lower() if len(sys.argv) > 2 else ""

cont = collections.defaultdict(collections.Counter)
tr = collections.defaultdict(collections.Counter)
leg = 0
for b in ("cars2you", "dealers"):
    d = os.path.join(AQUI, "textos-vendas", b)
    for f in os.listdir(d):
        if not f.endswith(".txt"):
            continue
        r = LI.ler(open(os.path.join(d, f), encoding="utf-8", errors="replace").read())
        if r is None:
            continue
        leg += 1
        for it, (e, t) in r.items():
            cont[it][e] += 1
            tr[(it, e)][t[:90]] += 1
print("laudos legiveis:", leg)
for it, *_ in LI.ITENS:
    if filtro and filtro not in it.lower():
        continue
    c = cont[it]
    print("\n%-24s presente %4d · ausente %4d · danificado %4d"
          % (it, c["presente"], c["ausente"], c["danificado"]))
    for e in LI.ESTADOS:
        for t, n in tr[(it, e)].most_common(N):
            print("   %-10s %4d  %s" % (e, n, t))
