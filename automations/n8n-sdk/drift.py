# -*- coding: utf-8 -*-
"""A divergencia da coorte e drift temporal ou erro de query?

Teste: se for DRIFT (o prototipo tirou o snapshot ~17:44 e eu rodei 23:03),
a diferenca tem que estar concentrada nos meses RECENTES — cadastro novo cai
na safra do mes corrente, compra nova entra no mes da compra. Safras antigas
sao imutaveis: quem se cadastrou em 2021-05 continua em 2021-05 para sempre.

Se for ERRO DE QUERY, a diferenca aparece espalhada tambem nos meses antigos.
"""
import io, json, sys
sys.stdout.reconfigure(encoding="utf-8")

F = r"C:\Users\thoma\.claude\projects\C--Users-thoma-Documents-work-brain\2bedc899-1389-411d-893a-b9d7ea5c9bc4\tool-results\mcp-ad7bbf4e-95de-4891-81aa-0a35fe700e94-get_workflow_execution-1788478257694.txt"
DADOS = r"C:\Users\thoma\Documents\work-brain\automations\prototipo-safra\dados\coorte_all.json"

d = json.load(io.open(F, encoding="utf-8"))
rd = d["data"]["resultData"]["runData"]
nomes = [i["json"]["queryName"] for i in rd["Montar Queries"][0]["data"]["main"][0]]
saidas = rd["MCP Run"][0]["data"]["main"][0]

rows, cols = [], None
for nome, out in zip(nomes, saidas):
    if nome != "coorte":
        continue
    sc = out["json"].get("structuredContent") or {}
    if sc.get("columns"):
        cols = sc["columns"]
    rows.extend(sc.get("rows") or [])

ix = {k: cols.index(k) for k in cols}
meu = {r[ix["ym"]]: r for r in rows}
proto = json.load(io.open(DADOS, encoding="utf-8"))

CAMPOS = ["total", "com_login", "ofertantes", "compradores", "volume"]
print("%-9s %8s %8s %8s %8s %14s" % ("mes", "d_total", "d_login", "d_ofert", "d_compr", "d_volume"))
print("-" * 62)
difs = []
for ym in sorted(set(meu) | set(proto)):
    a = meu.get(ym)
    b = proto.get(ym)
    if a is None or b is None:
        print("%-9s  SO EM %s" % (ym, "48417" if b is None else "prototipo"))
        continue
    dd = {}
    for c in CAMPOS:
        va = float(a[ix[c]] or 0)
        vb = float(b[c] or 0)
        dd[c] = va - vb
    if any(abs(v) > 0.001 for v in dd.values()):
        difs.append((ym, dd))
        print("%-9s %8.0f %8.0f %8.0f %8.0f %14.2f" % (
            ym, dd["total"], dd["com_login"], dd["ofertantes"], dd["compradores"], dd["volume"]))

print("-" * 62)
print("meses com diferenca: %d de %d" % (len(difs), len(proto)))
if difs:
    recentes = [ym for ym, _ in difs if ym >= "2026-06"]
    antigos = [ym for ym, _ in difs if ym < "2026-06"]
    print("  em safras recentes (>= 2026-06):", recentes)
    print("  em safras antigas  (<  2026-06):", antigos)
    print()
    if not antigos:
        print("VEREDITO: DRIFT TEMPORAL.")
        print("  Toda a diferenca esta em safras recentes. Safras antigas — que sao")
        print("  imutaveis — batem EXATAMENTE. A query esta correta; o prototipo e")
        print("  so um snapshot mais velho (~17:44 vs 23:03 desta execucao).")
    else:
        print("VEREDITO: ATENCAO — ha diferenca em safras antigas, que deveriam ser")
        print("  imutaveis. Investigar a query.")
