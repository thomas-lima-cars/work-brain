# -*- coding: utf-8 -*-
"""Roda as consultas do painel pela conexao direta, sem n8n.

    python coleta_local.py            -> grava dados-local.json

Executa o SQL EXATO que o no "Montar Consultas" gera (roda o proprio no com
node) e grava a resposta no formato do MCP: um item por consulta, com
structuredContent.columns/rows. Assim o Montar Painel roda local contra dado
real, e a medicao de tempo e tamanho e do SQL que vai para producao.

Precisa de VPN. O arquivo gerado tem dado real de loja: fica fora do git.
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

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

saida = subprocess.run(["node", str(AQUI / "_roda_no.js"), "montar-consultas.js"],
                       capture_output=True, text=True, encoding="utf-8", check=True)
itens = json.loads(saida.stdout)

cx = conectar("cars2you")
respostas = []
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
    total, linhas = rows[0][0], rows[0][1]
    pacote = len(linhas.encode("utf-8")) if isinstance(linhas, str) else 0
    n = len(json.loads(linhas)) if isinstance(linhas, str) else 0
    print("%-13s total=%-5s itens=%-5s pacote=%7.1f KB  %5.2fs" %
          (q["queryName"], total, n, pacote / 1024, dt))
    respostas.append({"json": {"structuredContent": {"columns": cols, "rows": rows}}})
cx.close()

destino = AQUI / "dados-local.json"
destino.write_text(json.dumps({"consultas": itens, "mcp": respostas}, ensure_ascii=False,
                              default=str), encoding="utf-8")
print("gravado:", destino.name)
