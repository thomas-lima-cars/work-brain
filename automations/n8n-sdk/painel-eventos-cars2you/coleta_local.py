# -*- coding: utf-8 -*-
"""Roda as consultas do painel pela conexao direta, sem n8n.

    python coleta_local.py            -> grava dados-local.json

Executa o SQL EXATO que o no "Montar Consultas" gera (roda o proprio no com
node) e grava a resposta no formato do MCP: um item por consulta, com
structuredContent.columns/rows. Assim o Montar Painel roda local contra dado
real, e a medicao de tempo e tamanho de cada pacote e do SQL que vai para
producao.

Junto vai a carteira comercial que o no "Ler Carteira" entregaria: sem
acesso ao SharePoint daqui, a copia e a do Radar de Estoque (o literal
CARTEIRAS de rel-veiculos/montar-html.js), no formato do
carteira-comercial.json publicado (consultores + cnpj -> indice).

Precisa de VPN. O arquivo gerado tem dado real de loja: fica fora do git.
"""
import json
import re
import subprocess
import sys
import time
from pathlib import Path

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI.parents[1] / "bancos"))
from conexao import conectar  # noqa: E402
from consulta import validar  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

TETO_KB = 130  # o maior pacote que o MCP ja provou passar

saida = subprocess.run(["node", str(AQUI / "_roda_no.js"), "montar-consultas.js"],
                       capture_output=True, text=True, encoding="utf-8", check=True)
itens = json.loads(saida.stdout)

cx = conectar("cars2you")
respostas = []
grandes = []
t_total = 0.0
for it in itens:
    q = it["json"]
    sql = validar(q["sql"])
    t0 = time.time()
    cur = cx.cursor()
    cur.execute(sql)
    cols = [c[0] for c in cur.description]
    rows = [list(r) for r in cur.fetchall()]
    cur.close()
    dt = time.time() - t0
    t_total += dt
    total, linhas = rows[0][0], rows[0][1]
    pacote = len(linhas.encode("utf-8")) if isinstance(linhas, str) else 0
    n = len(json.loads(linhas)) if isinstance(linhas, str) else 0
    if pacote / 1024 > TETO_KB:
        grandes.append(q["queryName"])
    print("%-14s total=%-6s itens=%-6s pacote=%7.1f KB  %6.2fs" %
          (q["queryName"], total, n, pacote / 1024, dt))
    respostas.append({"json": {"structuredContent": {"columns": cols, "rows": rows}}})
cx.close()
print("%d consultas, %.1fs no banco" % (len(itens), t_total))
if grandes:
    print("⚠ acima de %d KB: %s — subir 'partes' no Montar Consultas" % (TETO_KB, ", ".join(grandes)))

# a carteira: o literal do Radar, no formato do carteira-comercial.json
radar = (AQUI.parent / "rel-veiculos" / "montar-html.js").read_text(encoding="utf-8")
m = re.search(r"^const CARTEIRAS = (\{.*\});\s*$", radar, re.M)
lit = json.loads(m.group(1))
carteira = {"gerado_em": lit["gerado_em"], "origem": lit["origem"] + " (copia local do Radar)",
            "consultores": lit["consultores"], "cnpj": lit["cnpj"]}

destino = AQUI / "dados-local.json"
destino.write_text(json.dumps({"consultas": itens, "mcp": respostas, "carteira": [{"json": carteira}]},
                              ensure_ascii=False, default=str), encoding="utf-8")
print("gravado:", destino.name)
