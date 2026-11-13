# -*- coding: utf-8 -*-
"""Roda as consultas do painel pela conexao direta, sem n8n.

    python coleta_local.py                     -> grava dados-local.json (a semana de hoje)
    python coleta_local.py --prova             -> grava dados-prova.json (a semana da Fenauto 2025)
    python coleta_local.py --semana 2026-11-09 -> outra semana (a segunda-feira), em dados-local.json

--prova roda o MESMO SQL com a semana trocada pela de 17/11/2025, a da
Fenauto 2025: com a trava do nome (09/11), o 22231 do C6 e o 22223 do IGA
ao mesmo tempo (19 a 21/11/2025) e as lojas da campanha "Fenauto 2025
IGA". A semana corrente (09/11/2026) tem 5 eventos da Fenauto e nenhum
lance ainda: as provas precisam de dado variado para refazer as contas.
Desde 12/11 os novos lojistas sao pelos grupos de clientes da campanha
(montar-consultas.js): --prova troca tambem o inicio da campanha e a janela
sem compra para o ano da prova (10/11/2025 e 10/05/2025) e o grupo do IGA
148 "VD Itau - Fenauto 2026" pelo 133 "VD Itau - Fenauto 2025" (375
usuarios); os grupos do C6 (69 e 146) ficam. Cada troca confere quantas
vezes o literal aparece no SQL.

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
SEMANA_PROVA = "2025-11-17"
segunda = SEMANA_PROVA if args.prova else args.semana
if segunda:
    ini = datetime.strptime(segunda, "%Y-%m-%d")
    assert ini.weekday() == 0, "a semana comeca na segunda-feira"
    novo = [ini.strftime("%Y-%m-%d 00:00:00"), (ini + timedelta(days=7)).strftime("%Y-%m-%d 00:00:00")]
    for it in itens:
        q = it["json"]
        velho = q["meta"]["semana"]
        for a, b in zip(velho, novo):
            assert q["sql"].count("'" + a + "'") > 0 or q["queryName"] == "nenhuma", "semana fora do SQL"
            q["sql"] = q["sql"].replace("'" + a + "'", "'" + b + "'")
        q["meta"]["semana"] = novo
    # 12/11: novos lojistas pelos grupos. Na prova (2025), o inicio da campanha e
    # a janela sem compra no ano dela, e o grupo do IGA daquele ano
    TROCA_CAMPANHA = {"inicio_campanha": "2025-11-10 00:00:00", "sem_compra_desde": "2025-05-10 00:00:00"}
    GRUPOS_IGA_PROVA = [133]   # "VD Itau - Fenauto 2025", 375 usuarios (medido em 12/11)
    if args.prova:
        for it in itens:
            q = it["json"]
            m = q["meta"]
            eh_lojas = q["queryName"] == "lojas"
            # o inicio: o cadastro (IF e WHERE), a volta e o teto das compras = 4;
            # o comeco da janela sem compra = 1. So na consulta de lojas
            for chave, vezes in (("inicio_campanha", 4), ("sem_compra_desde", 1)):
                a, b = "'" + m[chave] + "'", "'" + TROCA_CAMPANHA[chave] + "'"
                assert q["sql"].count(a) == (vezes if eh_lojas else 0), chave + " fora do SQL"
                q["sql"] = q["sql"].replace(a, b)
                m[chave] = TROCA_CAMPANHA[chave]
            iga = ",".join(str(g) for g in m["grupos_iga"])
            todos = ",".join(str(g) for g in m["grupos_iga"] + m["grupos_c6"])
            iga_p = ",".join(str(g) for g in GRUPOS_IGA_PROVA)
            todos_p = ",".join(str(g) for g in GRUPOS_IGA_PROVA + m["grupos_c6"])
            # o CASE da operacao e o filtro dos grupos, uma vez cada
            for a, b in (("client_group_id IN (" + iga + ") THEN", "client_group_id IN (" + iga_p + ") THEN"),
                         ("client_group_id IN (" + todos + "))", "client_group_id IN (" + todos_p + "))")):
                assert q["sql"].count(a) == (1 if eh_lojas else 0), "grupo fora do SQL: " + a
                q["sql"] = q["sql"].replace(a, b)
            m["grupos_iga"] = GRUPOS_IGA_PROVA

cx = conectar("cars2you")
if args.prova:
    # o grupo trocado tem que ser o da Fenauto do ano da prova
    cur = cx.cursor()
    cur.execute(validar("SELECT cg.id, cg.name, (SELECT COUNT(*) FROM user_clients_group ucg WHERE ucg.client_group_id = cg.id)"
                        " FROM client_groups cg WHERE cg.id IN (" + ",".join(str(g) for g in GRUPOS_IGA_PROVA) + ")"))
    grupos = cur.fetchall()
    cur.close()
    assert len(grupos) == len(GRUPOS_IGA_PROVA) and all("fenauto 2025" in str(g[1]).lower() for g in grupos), grupos
    print("grupo do IGA na prova:", ", ".join("%s %s (%s usuarios)" % tuple(g) for g in grupos))
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
