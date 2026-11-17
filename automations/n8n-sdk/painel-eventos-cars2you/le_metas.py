# -*- coding: utf-8 -*-
"""Le a planilha de metas como o n8n le, para o painel rodar local.

    python le_metas.py                          -> metas-painel-eventos.xlsx
    python le_metas.py outra.xlsx               -> outra planilha (a baixada do SharePoint, por exemplo)

Desde 17/11 a planilha tem UMA ABA POR MES ("2026-11"), com a meta mensal e
a diaria na mesma aba. No n8n, o no Abas das Metas faz um item por mes dos 12
do Mensal ({aba}), e o Metas (Extract From File, xlsx, SEM linha de
cabecalho, a aba pela expressao) roda uma vez por item: entrega um item por
linha da area usada da aba, { row: [celulas] }, com o pairedItem apontando
para o item de entrada -- e por ele que o Montar Painel sabe a aba de cada
linha. Aba que nao existe sai como item de erro, com o mesmo pairedItem.

Grava metas-local.json com os dois nos nesse formato. Os meses sao os do
dados-local.json (a coleta), para a planilha e o painel falarem dos mesmos.
O monta_local.js, a prova e as conferencias passam isso ao Montar Painel
(_roda_no.js, nosLocais). Sem o arquivo, o painel local sai sem meta, como
no n8n.
"""
import json
import sys
from pathlib import Path

from openpyxl import load_workbook

AQUI = Path(__file__).resolve().parent

origem = Path(sys.argv[1]) if len(sys.argv) > 1 else AQUI / "metas-painel-eventos.xlsx"
dados = json.loads((AQUI / "dados-local.json").read_text(encoding="utf-8"))
meses = dados["consultas"][0]["json"]["meta"]["meses"]
wb = load_workbook(origem, data_only=True)
abas = [{"json": {"aba": m}} for m in meses]
metas = []
for k, m in enumerate(meses):
    if m not in wb.sheetnames:
        metas.append({"json": {"error": "Sheet '%s' not found" % m}, "pairedItem": {"item": k}})
        print("⚠ sem a aba %s em %s (o n8n devolve um item de erro)" % (m, origem.name))
        continue
    ws = wb[m]
    # a area usada (o !ref que o n8n le), uma linha por item, vazias inclusive
    linhas = ws.iter_rows(min_row=ws.min_row, max_row=ws.max_row, min_col=ws.min_column, max_col=ws.max_column,
                          values_only=True)
    n0 = len(metas)
    metas.extend({"json": {"row": list(r)}, "pairedItem": {"item": k}} for r in linhas)
    print("%s: %d linhas (area %s)" % (m, len(metas) - n0, ws.dimensions))
saida = {"Abas das Metas": abas, "Metas": metas}
(AQUI / "metas-local.json").write_text(json.dumps(saida, ensure_ascii=False), encoding="utf-8")
print("gravado: metas-local.json")
