# -*- coding: utf-8 -*-
import io, json, sys, collections
sys.stdout.reconfigure(encoding="utf-8")

F = r"C:\Users\thoma\.claude\projects\C--Users-thoma-Documents-work-brain\2bedc899-1389-411d-893a-b9d7ea5c9bc4\tool-results\mcp-ad7bbf4e-95de-4891-81aa-0a35fe700e94-get_workflow_execution-1788482029557.txt"
PROTO = r"C:\Users\thoma\Documents\work-brain\automations\prototipo-safra\dados\coorte_all.json"

d = json.load(io.open(F, encoding="utf-8"))
rd = d["data"]["resultData"]["runData"]
nomes = [i["json"]["queryName"] for i in rd["Montar Queries"][0]["data"]["main"][0]]
saidas = rd["MCP Run"][0]["data"]["main"][0]
print("perguntas: %d | respostas: %d" % (len(nomes), len(saidas)))
assert len(nomes) == len(saidas)

L = collections.defaultdict(list); C = {}
vaz = collections.Counter(); pg = collections.Counter()
for n, o in zip(nomes, saidas):
    sc = o["json"].get("structuredContent") or {}
    r = sc.get("rows") or []
    if sc.get("columns"):
        C[n] = sc["columns"]
    L[n].extend(r); pg[n] += 1
    if not r:
        vaz[n] += 1

c = C["coorte"]; ix = {k: c.index(k) for k in c}; rows = L["coorte"]
def s(f): return sum(float(x[ix[f]] or 0) for x in rows)

proto = json.load(io.open(PROTO, encoding="utf-8"))
p_tot = sum(int(v["total"]) for v in proto.values())
p_cmp = sum(int(v["compradores"]) for v in proto.values())
p_vol = sum(float(v["volume"] or 0) for v in proto.values())

print()
print("=" * 68)
print("COORTE — execucao 48437 (lote 1d)")
print("=" * 68)
print("  meses           : %d" % len(rows))
print("  total           : %d      (prototipo 17h44: %d)" % (s("total"), p_tot))
print("  com_login       : %d" % s("com_login"))
print("  ofertantes      : %d" % s("ofertantes"))
print("  compradores     : %d       (prototipo: %d)" % (s("compradores"), p_cmp))
print("  negociacoes     : %d" % s("negociacoes"))
print("  vendido (st 7)  : %d" % s("vendido"))
print("  status2  [NOVO] : %d" % s("status2"))
print("  volume          : R$ %.2f  (prototipo: R$ %.2f)" % (s("volume"), p_vol))
print("  total_ofertas   : %s" % L["kpi_ofertas"][0][0])
print()
# coerencia interna
tot = s("total")
print("COERENCIA:")
print("  com_login + sem_login == total ? %s (%d + %d = %d)" % (
    s("com_login") + s("sem_login") == tot, s("com_login"), s("sem_login"),
    s("com_login") + s("sem_login")))
soma_sit = sum(s("s%d" % i) for i in range(1, 7))
print("  s1..s6 == total ?                %s (%d)" % (soma_sit == tot, soma_sit))
print("  status2 <= negociacoes ?         %s" % (s("status2") <= s("negociacoes")))
print("  vendido + status2 <= negociacoes ? %s (%d + %d vs %d)" % (
    s("vendido") + s("status2") <= s("negociacoes"), s("vendido"), s("status2"), s("negociacoes")))
print()
print("=" * 68)
print("PAGINACAO")
print("=" * 68)
t, v = sum(pg.values()), sum(vaz.values())
print("  chamadas: %d | vazias: %d (%.0f%%)  [antes: 1440 / 680 / 47%%]" % (t, v, v / t * 100))
for n in pg:
    if n.startswith("rx_"):
        print("   %-12s %3d pgs, %3d vazias, %5d linhas" % (n, pg[n], vaz[n], len(L[n])))
