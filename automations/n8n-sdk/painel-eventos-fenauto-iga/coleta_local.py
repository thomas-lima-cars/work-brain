# -*- coding: utf-8 -*-
"""Roda as consultas do painel pela conexao direta, sem n8n.

    python coleta_local.py                -> grava dados-local.json (o mes de hoje)
    python coleta_local.py --prova        -> grava dados-prova.json (novembro/2025, o da Fenauto 2025)
    python coleta_local.py --mes 2026-12  -> outro mes, em dados-local.json

--prova roda o MESMO SQL com o mes trocado por novembro/2025, o da
Fenauto 2025: o evento 22223 "VD IGA exclusivo Fenauto - 21/11/25" e as
226 lojas da campanha "Fenauto 2025 IGA". Desde 09/11 o recorte e o mes
(antes, a semana de 17/11/2025) e so evento com Fenauto no nome. Desde
12/11 a loja nova (grupo da Fenauto + entrada) anda junto com o ano: o
inicio da campanha vira 10/11/2025, a janela sem compra 10/05/2025 e o grupo
148 ("VD Itau - Fenauto 2026") vira o 133 ("VD Itau - Fenauto 2025").

Executa o SQL EXATO que o no "Montar Consultas" gera (roda o proprio no com
node) e grava a resposta no formato do MCP: um item por consulta, com
structuredContent.columns/rows. Assim o Montar Painel roda local contra dado
real, e a medicao de tempo e tamanho e do SQL que vai para producao.

Precisa de VPN. O arquivo gerado tem dado real de loja: fica fora do git.
"""
import argparse
from datetime import datetime
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
ap.add_argument("--mes", help="o mes, AAAA-MM")
args = ap.parse_args()
MES_PROVA = "2025-11"
# 12/11: o grupo da Fenauto do IGA de cada ano (o de 2025 tinha 375 usuarios
# em 12/11/2026). O de 2026 e o do Montar Consultas
GRUPOS_DO_ANO = {"2025": ([133], "VD Itaú - Fenauto 2025"), "2026": ([148], "VD Itaú - Fenauto 2026")}
mes = MES_PROVA if args.prova else args.mes
if mes:
    ini = datetime.strptime(mes + "-01", "%Y-%m-%d")
    fim = datetime(ini.year + (ini.month == 12), ini.month % 12 + 1, 1)
    novo = [ini.strftime("%Y-%m-%d 00:00:00"), fim.strftime("%Y-%m-%d 00:00:00")]
    for it in itens:
        q = it["json"]
        velho = q["meta"]["mes"]
        for a, b in zip(velho, novo):
            assert q["sql"].count("'" + a + "'") > 0, "mes fora do SQL"
            q["sql"] = q["sql"].replace("'" + a + "'", "'" + b + "'")
        q["meta"]["mes"] = novo
        # 11/11: a campanha do cartao de regioes e a do ANO do mes ("fenauto 2026")
        camp_velha = q["meta"]["campanha_ano"]
        camp_nova = camp_velha.replace(" " + velho[0][:4] + " ", " " + novo[0][:4] + " ")
        if q["queryName"] == "lojas":
            assert q["sql"].count("'%" + camp_velha + "%'") == 2, "campanha do ano fora do SQL"
        q["sql"] = q["sql"].replace("'%" + camp_velha + "%'", "'%" + camp_nova + "%'")
        q["meta"]["campanha_ano"] = camp_nova
        # 12/11: a loja nova anda com o ANO do mes: o inicio da campanha, a
        # janela sem compra e o grupo da Fenauto daquele ano
        ano_velho, ano_novo = q["meta"]["inicio_campanha"][:4], novo[0][:4]
        if ano_novo != ano_velho:
            assert ano_novo in GRUPOS_DO_ANO, "sem grupo da Fenauto do IGA para " + ano_novo
            for chave, n in (("inicio_campanha", 4), ("sem_compra_desde", 1)):
                v_velho = q["meta"][chave]
                v_novo = str(int(v_velho[:4]) + int(ano_novo) - int(ano_velho)) + v_velho[4:]
                if q["queryName"] == "lojas":
                    assert q["sql"].count("'" + v_velho + "'") == n, chave + " fora do SQL"
                q["sql"] = q["sql"].replace("'" + v_velho + "'", "'" + v_novo + "'")
                q["meta"][chave] = v_novo
            g_velho = "client_group_id IN (" + ", ".join(str(g) for g in q["meta"]["grupos_iga"]) + ")"
            g_novo = "client_group_id IN (" + ", ".join(str(g) for g in GRUPOS_DO_ANO[ano_novo][0]) + ")"
            if q["queryName"] == "lojas":
                assert q["sql"].count(g_velho) == 1, "grupo da Fenauto fora do SQL"
            q["sql"] = q["sql"].replace(g_velho, g_novo)
            q["meta"]["grupos_iga"] = GRUPOS_DO_ANO[ano_novo][0]
            q["meta"]["grupo_iga_nome"] = GRUPOS_DO_ANO[ano_novo][1]

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
