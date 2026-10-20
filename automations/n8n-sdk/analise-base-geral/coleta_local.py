# -*- coding: utf-8 -*-
"""Roda as consultas da Analise de Base pela conexao direta, sem n8n.

    python coleta_local.py              -> grava dados-local.json
    python coleta_local.py atv rx_uf    -> so mede essas (nao grava)

Executa o SQL EXATO que o no "Montar Queries" gera (roda o proprio no com node)
e grava a resposta no formato do MCP (structuredContent.columns/rows). Assim o
Montar HTML roda local contra dado real, e o tamanho medido de cada pacote e o
do SQL que vai para producao.

Precisa de VPN. O arquivo gerado tem nome de cliente: fica fora do git.
"""
import json
import subprocess
import sys
import time
from pathlib import Path

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI.parents[1] / "bancos"))
from conexao import conectar  # noqa: E402
from consulta import validar  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
so = set(sys.argv[1:])
saida = subprocess.run(["node", str(AQUI / "_roda_no.js"), "montar-queries.js"],
                       capture_output=True, text=True, encoding="utf-8", check=True)
itens = json.loads(saida.stdout)

cx = conectar("cars2you")
respostas = []
t_ini = time.time()
for it in itens:
    q = it["json"]
    if so and q["queryName"] not in so:
        continue
    t0 = time.time()
    cur = cx.cursor()
    cur.execute(validar(q["sql"]))
    cols = [c[0] for c in cur.description]
    rows = [list(r) for r in cur.fetchall()]
    cur.close()
    dt = time.time() - t0
    if "parte" in q:
        total, linhas = rows[0][0], rows[0][1]
        n = len(json.loads(linhas)) if isinstance(linhas, str) else 0
        kb = len(linhas.encode("utf-8")) / 1024 if isinstance(linhas, str) else 0
        print("%-10s %d/%d  total=%-6s itens=%-6s pacote=%6.1f KB  %5.2fs"
              % (q["queryName"], q["parte"] + 1, q["partes"], total, n, kb, dt), flush=True)
    elif dt > 3 or so:
        print("%-14s wl=%-3s linhas=%-4s %5.2fs" % (q["queryName"], q["wl"], len(rows), dt), flush=True)
    respostas.append({"json": {"structuredContent": {"columns": cols, "rows": rows}}})
cx.close()
print("total %.0fs, %d consultas" % (time.time() - t_ini, len(respostas)))

if not so:
    (AQUI / "dados-local.json").write_text(
        json.dumps({"consultas": itens, "mcp": respostas}, ensure_ascii=False, default=str), encoding="utf-8")
    print("gravado: dados-local.json")
