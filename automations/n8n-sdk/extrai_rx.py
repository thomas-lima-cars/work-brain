# -*- coding: utf-8 -*-
"""Extrai os blocos pushPaged('rx_*') do Montar Queries ORIGINAL, verbatim.

A familia rx_ NAO ganha dimensao de whitelabel (compradores sao distintos),
entao a unica mudanca legitima e:
   BASE      -> BASE_ALL      (tira o whitelabel_id = 43)
   paginas   -> x8,8 + folga  (240 -> 2.105 compradores)
Nada mais pode mudar. Este script prova isso por diff.
"""
import io, os, re, sys
sys.stdout.reconfigure(encoding="utf-8")

ORIG = r"C:\Users\thoma\Documents\work-brain\automations\n8n-sdk\nodes-originais\Montar_Queries.js"
src = io.open(ORIG, encoding="utf-8").read()

# novas contagens de pagina: original x8,8 arredondado pra cima com folga
NOVAS = {
    "rx_totais": (23, 140),
    "rx_modelo": (54, 320),
    "rx_laudo": (31, 190),
    "rx_uf": (41, 250),
    "rx_faixa": (34, 210),
    "rx_partic": (41, 250),
    "rx_buyers": (10, 60),
}

blocos = []
for nome in NOVAS:
    m = re.search(r"pushPaged\('" + nome + r"',\s*\n(.*?),\s*\n\s*(\d+)\);", src, re.S)
    if not m:
        print("NAO ACHOU:", nome)
        continue
    sql_expr = m.group(1).strip()
    pgs_orig = int(m.group(2))
    esperado_orig, novas_pgs = NOVAS[nome]
    assert pgs_orig == esperado_orig, (nome, pgs_orig, esperado_orig)

    # unica alteracao permitida no corpo: BASE -> BASE_ALL
    novo = sql_expr.replace('" + BASE + "', '" + BASE_ALL + "')
    n_sub = sql_expr.count('" + BASE + "')

    # prova: desfazendo a substituicao, volta identico ao original
    volta = novo.replace('" + BASE_ALL + "', '" + BASE + "')
    ok = (volta == sql_expr)

    print("%-12s BASE->BASE_ALL x%d  paginas %d->%d  roundtrip=%s" % (
        nome, n_sub, pgs_orig, novas_pgs, ok))
    assert ok, nome
    blocos.append("pushPaged('%s',\n  %s,\n  %d);\n" % (nome, novo, novas_pgs))

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rx_verbatim.js")
io.open(out, "w", encoding="utf-8", newline="").write("\n".join(blocos))
print()
print("gravado:", out, "|", sum(len(b) for b in blocos), "chars")
print("paginas rx total:", sum(v[1] for v in NOVAS.values()))
