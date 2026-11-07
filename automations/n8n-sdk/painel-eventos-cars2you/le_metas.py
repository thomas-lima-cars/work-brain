# -*- coding: utf-8 -*-
"""Le a planilha de metas como o n8n le, para o painel rodar local.

    python le_metas.py                          -> metas-painel-eventos.xlsx
    python le_metas.py outra.xlsx               -> outra planilha (a baixada do SharePoint, por exemplo)

Grava metas-local.json com as duas abas no formato que o no "Extract From
File" (xlsx, SEM linha de cabecalho) entrega: um item por linha da area usada
da aba, { row: [celulas] } -- a primeira celula e a da primeira coluna usada.
A aba tem margem, a linha das medidas mescladas e o nome da categoria
repetido no cabecalho (gera_metas.py), entao o n8n nao le cabecalho: o Montar
Painel acha a linha do "ID comitente" e a medida na linha de cima.

O monta_local.js, a prova e as conferencias passam isso ao Montar Painel como
os nos "Metas Mensais" e "Metas Diarias" (_roda_no.js, nosLocais). Sem o
arquivo, o painel local sai sem meta, como no n8n.
"""
import json
import sys
from pathlib import Path

from openpyxl import load_workbook

AQUI = Path(__file__).resolve().parent
ABAS = {"Metas Mensais": "Média mensal", "Metas Diárias": "Média diária"}

origem = Path(sys.argv[1]) if len(sys.argv) > 1 else AQUI / "metas-painel-eventos.xlsx"
wb = load_workbook(origem, data_only=True)
saida = {}
for no, aba in ABAS.items():
    if aba not in wb.sheetnames:
        print("⚠ sem a aba %s em %s" % (aba, origem.name))
        saida[no] = []
        continue
    ws = wb[aba]
    # a area usada (o !ref que o n8n le), uma linha por item, vazias inclusive
    linhas = ws.iter_rows(min_row=ws.min_row, max_row=ws.max_row, min_col=ws.min_column, max_col=ws.max_column,
                          values_only=True)
    saida[no] = [{"json": {"row": list(r)}} for r in linhas]
    print("%s: %d linhas (area %s)" % (aba, len(saida[no]), ws.dimensions))
(AQUI / "metas-local.json").write_text(json.dumps(saida, ensure_ascii=False), encoding="utf-8")
print("gravado: metas-local.json")
