# -*- coding: utf-8 -*-
"""Valida a execucao 48417 (lote 1b) contra os numeros do prototipo."""
import io, json, sys, os, collections
sys.stdout.reconfigure(encoding="utf-8")

F = r"C:\Users\thoma\.claude\projects\C--Users-thoma-Documents-work-brain\2bedc899-1389-411d-893a-b9d7ea5c9bc4\tool-results\mcp-ad7bbf4e-95de-4891-81aa-0a35fe700e94-get_workflow_execution-1788478257694.txt"
DADOS = r"C:\Users\thoma\Documents\work-brain\automations\prototipo-safra\dados\coorte_all.json"

d = json.load(io.open(F, encoding="utf-8"))
rd = d["data"]["resultData"]["runData"]

nomes = [i["json"]["queryName"] for i in rd["Montar Queries"][0]["data"]["main"][0]]
saidas = rd["MCP Run"][0]["data"]["main"][0]
print("queries enfileiradas:", len(nomes))
print("respostas do MCP    :", len(saidas))
assert len(nomes) == len(saidas), "descasamento entre pergunta e resposta"
print()

# ── junta as linhas por queryName, na ordem ───────────────────────────
linhas = collections.defaultdict(list)
cols = {}
vazias = collections.Counter()
total_pg = collections.Counter()
for nome, out in zip(nomes, saidas):
    sc = out["json"].get("structuredContent") or {}
    rows = sc.get("rows") or []
    if sc.get("columns"):
        cols[nome] = sc["columns"]
    linhas[nome].extend(rows)
    total_pg[nome] += 1
    if not rows:
        vazias[nome] += 1

# ── 1. VERIFICACAO DA COORTE ──────────────────────────────────────────
print("=" * 72)
print("1. COORTE — contra os numeros do prototipo")
print("=" * 72)
c = cols["coorte"]
idx = {k: c.index(k) for k in c}
rows = linhas["coorte"]
def s(campo):
    return sum(float(r[idx[campo]] or 0) for r in rows)

medido = {
    "meses": len(rows),
    "total": s("total"),
    "compradores": s("compradores"),
    "volume": s("volume"),
    "com_login": s("com_login"),
    "ofertantes": s("ofertantes"),
}
alvo = json.load(io.open(DADOS, encoding="utf-8"))
esperado = {
    "meses": len(alvo),
    "total": sum(int(v["total"]) for v in alvo.values()),
    "compradores": sum(int(v["compradores"]) for v in alvo.values()),
    "volume": sum(float(v["volume"] or 0) for v in alvo.values()),
    "com_login": sum(int(v["com_login"]) for v in alvo.values()),
    "ofertantes": sum(int(v["ofertantes"]) for v in alvo.values()),
}

print("%-14s %16s %16s   %s" % ("campo", "MEDIDO (48417)", "ALVO (prototipo)", "veredito"))
print("-" * 72)
ok = True
for k in ["meses", "total", "com_login", "ofertantes", "compradores", "volume"]:
    m, e = medido[k], esperado[k]
    bate = abs(m - e) < 0.01 if k == "volume" else int(m) == int(e)
    if not bate:
        ok = False
    fmt = "%16.2f" if k == "volume" else "%16d"
    print(("%-14s " + fmt + " " + fmt + "   %s") % (
        k, m, e, "OK" if bate else "DIVERGE (delta %s)" % (m - e)))
print("-" * 72)
print("COORTE:", "CONFERE" if ok else "*** DIVERGENCIA ***")
print()

# ── 2. PAGINAS VAZIAS (custo desperdicado) ────────────────────────────
print("=" * 72)
print("2. PROVISIONAMENTO DE PAGINAS")
print("=" * 72)
print("%-22s %6s %6s %6s %8s  %s" % ("query", "pgs", "vazias", "uso", "linhas", "sugestao"))
print("-" * 72)
desperdicio = 0
for nome in total_pg:
    pg, vz = total_pg[nome], vazias[nome]
    usadas = pg - vz
    n = len(linhas[nome])
    desperdicio += vz
    sug = ""
    if vz > 2:
        sug = "-> %d pgs bastam" % max(1, usadas + 1)
    print("%-22s %6d %6d %6d %8d  %s" % (nome, pg, vz, usadas, n, sug))
print("-" * 72)
print("chamadas totais      :", sum(total_pg.values()))
print("chamadas desperdicadas:", desperdicio, "(%.0f%%)" % (desperdicio / sum(total_pg.values()) * 100))
dur = 20 * 60 + 58
print("duracao real         : %d min %ds" % (dur // 60, dur % 60))
print("tempo desperdicado   : ~%.1f min" % (desperdicio / sum(total_pg.values()) * dur / 60))
