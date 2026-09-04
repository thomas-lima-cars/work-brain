# -*- coding: utf-8 -*-
"""LOTE 1e — coorte POR WHITELABEL. Destrava o seletor de WL.

Uma query so. Os 18 valores reativos da Visao Geral saem todos da coorte,
entao basta a coorte ganhar a dimensao de whitelabel — nao as 26 queries.

Reaproveita BEXT / PC / METRICS que ja estao no lote 1d: o unico SQL novo
sao os dois JOINs e o GROUP BY, copiados do HANDOFF-PROTOTIPO-SAFRA §8.1
(Dataset B), que foi o que gerou o coorte_wl.json — 516 linhas, 58 WLs,
ja rodado nessa escala pelo Everton.

A lista do dropdown sai da PROPRIA coorte_wl (wl + wl_name distintos),
entao nao precisa de query separada pro wl_list.
"""
import io, os, sys, hashlib
sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
LOTE1D = r"C:\Users\thoma\Documents\work-brain\automations\n8n-sdk\montar-queries-LOTE1d.js"
src = io.open(LOTE1D, encoding="utf-8").read()
print("lote 1d: %d chars md5 %s\n" % (len(src), hashlib.md5(src.encode()).hexdigest()))

BLOCO = '''
/* [lote 1e] COORTE POR WHITELABEL — o que faz o seletor de WL funcionar.
   Mesmos BEXT / PC / METRICS da coorte "Todos"; muda so a dimensao:
   INNER JOIN em user_whitelabels + whitelabels, e o GROUP BY ganha o wl.
   Copiado do HANDOFF-PROTOTIPO-SAFRA secao 8.1 (Dataset B).

   Nao substitui a coorte "Todos": user_whitelabels e N:N, entao somar os 58
   whitelabels conta repetido quem esta em varios. As duas convivem — "Todos"
   usa a distinta, um WL selecionado usa esta.

   516 linhas medidas no prototipo (58 WLs x meses com cadastro). 16 paginas
   dao folga de ~1,5x. */
pushPaged('coorte_wl',
  "SELECT uw.whitelabel_id wl, w.name wl_name, b.ym, " + METRICS +
  " FROM (" + BEXT + ") b" +
  " INNER JOIN user_whitelabels uw ON uw.user_id = b.uid" +
  " INNER JOIN whitelabels w ON w.id = uw.whitelabel_id" +
  " LEFT JOIN (" + PC + ") pc ON pc.uid = b.uid" +
  " GROUP BY uw.whitelabel_id, w.name, b.ym ORDER BY uw.whitelabel_id, b.ym",
  16);

'''

anc = "pushPaged('kpi_ofertas',"
i = src.index(anc)
fim = src.index("  1);", i) + len("  1);\n")
src = src[:fim] + BLOCO + src[fim:]
print("E12 coorte_wl inserida apos kpi_ofertas")

old = "const PRIMEIRO = ['coorte', 'kpi_ofertas'];"
assert src.count(old) == 1
src = src.replace(old, "const PRIMEIRO = ['coorte', 'coorte_wl', 'kpi_ofertas'];")
print("E13 coorte_wl entra na frente da fila (junto das outras de verificacao)")

out = os.path.join(HERE, "montar_queries_lote1e.js")
io.open(out, "w", encoding="utf-8", newline="").write(src)
print("\ngravado: %s\n%d chars md5 %s" % (out, len(src), hashlib.md5(src.encode()).hexdigest()))
