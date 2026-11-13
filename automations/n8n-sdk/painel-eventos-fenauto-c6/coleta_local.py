# -*- coding: utf-8 -*-
"""Roda as consultas do painel pela conexao direta, sem n8n.

    python coleta_local.py                     -> grava dados-local.json (a semana de hoje)
    python coleta_local.py --semana 2026-11-16 -> outra semana (a segunda-feira)
    python coleta_local.py --prova             -> grava dados-prova.json

--prova roda o MESMO SQL com a janela trocada por 01/09 a 27/10/2026, SEM
a trava do nome. O recorte desde 09/11 (Fenauto do C6 da semana) abriu com 2
eventos e nenhum lance, e as provas precisam de dado variado para refazer as
contas. Ate 09/11 a prova era a mesma janela, sem o fim (o piso era 01/09).

Loja nova (12/11) e a dos grupos 69 e 146 com ENTRADA na campanha: loja
cadastrada desde inicio_campanha (10/11/2026), ou antiga sem compra em
[sem_compra_desde, inicio_campanha) que acessou desde inicio_campanha.
--prova troca as duas datas para o ano da prova (10/11/2025 e 10/05/2025),
com conferencia de contagem no SQL; os grupos do C6 ficam. --semana nao
mexe nelas: a campanha e uma data fixa. A janela de prova (set-out/2026)
nao tem a campanha de 2026 dentro dela: as provas plantam entradas na
coluna "fenauto" (prova-local.js). Em 11/11 a loja nova era a campanha do
formulario "Fenauto <ano> C6"; ate 10/11, o grupo 146 desde 01/10/2026.

Executa o SQL EXATO que o no "Montar Consultas" gera (roda o proprio no com
node) e grava a resposta no formato do MCP: um item por consulta, com
structuredContent.columns/rows. Assim o Montar Painel roda local contra dado
real, e a medicao de tempo e tamanho e do SQL que vai para producao.

Precisa de VPN. O arquivo gerado tem dado real de loja: fica fora do git.
"""
import argparse
from datetime import datetime, timedelta
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

ap = argparse.ArgumentParser()
ap.add_argument("--prova", action="store_true")
ap.add_argument("--semana", help="a segunda-feira da semana, AAAA-MM-DD")
args = ap.parse_args()
JANELA_PROVA = ["2026-09-01 00:00:00", "2026-10-27 00:00:00"]
TRAVA_NOME = " AND e.name LIKE '%fenauto%'"


def troca_janela(q, nova):
    for a, b in zip(q["meta"]["semana"], nova):
        assert q["sql"].count("'" + a + "'") > 0, "semana fora do SQL"
        q["sql"] = q["sql"].replace("'" + a + "'", "'" + b + "'")
    q["meta"]["semana"] = nova


# 12/11: a campanha das novas, no ano da prova. Na consulta de lojas, o
# inicio aparece 4 vezes (volta, fim das compras, cadastro novo no IF e no
# WHERE) e o "sem compra desde" 1; nas outras, nenhuma.
CAMPANHA_PROVA = {"inicio_campanha": "2025-11-10 00:00:00", "sem_compra_desde": "2025-05-10 00:00:00"}
CONTAGEM_CAMPANHA = {"inicio_campanha": 4, "sem_compra_desde": 1}


def troca_campanha(q):
    for chave, nova in CAMPANHA_PROVA.items():
        velha = q["meta"][chave]
        esperado = CONTAGEM_CAMPANHA[chave] if q["queryName"] == "lojas" else 0
        achado = q["sql"].count("'" + velha + "'")
        assert achado == esperado, "%s: %s aparece %d vez(es), esperado %d" % (q["queryName"], chave, achado, esperado)
        q["sql"] = q["sql"].replace("'" + velha + "'", "'" + nova + "'")
        q["meta"][chave] = nova
    assert q["meta"]["grupos_c6"] == [69, 146], "grupos do C6 mudaram: " + str(q["meta"]["grupos_c6"])


if args.semana:
    ini = datetime.strptime(args.semana, "%Y-%m-%d")
    assert ini.weekday() == 0, "a semana comeca na segunda-feira"
    for it in itens:
        troca_janela(it["json"], [ini.strftime("%Y-%m-%d 00:00:00"),
                                  (ini + timedelta(days=7)).strftime("%Y-%m-%d 00:00:00")])
if args.prova:
    for it in itens:
        q = it["json"]
        assert TRAVA_NOME in q["sql"], "a trava do nome mudou: ajustar TRAVA_NOME"
        troca_janela(q, JANELA_PROVA)
        troca_campanha(q)
        q["sql"] = q["sql"].replace(TRAVA_NOME, "")
        q["meta"]["prova"] = {"janela": JANELA_PROVA, "sem_nome": True, "campanha": CAMPANHA_PROVA}

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

destino = AQUI / ("dados-prova.json" if args.prova else "dados-local.json")
destino.write_text(json.dumps({"consultas": itens, "mcp": respostas}, ensure_ascii=False,
                              default=str), encoding="utf-8")
print("gravado:", destino.name)
