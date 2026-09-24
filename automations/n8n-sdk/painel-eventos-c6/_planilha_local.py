# -*- coding: utf-8 -*-
"""Converte a planilha de representantes no formato que o n8n entrega.

    python _planilha_local.py [caminho.xlsx]   -> dados-planilha-local.json

Imita o no "Ler Representantes" (Extract from File, xlsx, headerRow,
readAsString): um item por linha da PRIMEIRA aba, chaves do cabecalho, todo
valor como texto e celula vazia OMITIDA -- e isso que o no do n8n faz, e e
por isso que o Montar Painel procura as colunas varrendo as linhas.

Tem CNPJ de loja: o arquivo gerado fica fora do git (dados-*.json).
"""
import json
import sys
from pathlib import Path

import openpyxl

AQUI = Path(__file__).resolve().parent
origem = Path(sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\thoma\Downloads\LojasAtivas_C6.xlsx")

ws = openpyxl.load_workbook(origem, read_only=True, data_only=True).worksheets[0]
linhas = ws.iter_rows(values_only=True)
cab = [str(c) for c in next(linhas)]
itens = []
for r in linhas:
    j = {k: str(v) for k, v in zip(cab, r) if v is not None and str(v) != ""}
    if j:
        itens.append({"json": j})

destino = AQUI / "dados-planilha-local.json"
destino.write_text(json.dumps(itens, ensure_ascii=False), encoding="utf-8")
print("gravado:", destino.name, "·", len(itens), "linhas · aba", ws.title)
