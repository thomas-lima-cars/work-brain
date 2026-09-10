# -*- coding: utf-8 -*-
"""Conserta o filtro de evento, que zerava a tabela de veiculos.

O bug: as opcoes eram montadas como `<option>Nome (65)</option>`, sem
atributo `value`. Num <option> sem value, o valor E o texto -- entao o
select devolvia "Venda Direta IGA - Misto - 10/09/26 (65)" e a comparacao
`v.evento === valor` nunca casava, porque o nome real nao tem o "(65)".
Resultado: escolher qualquer evento esvaziava a tabela.

A correcao usa o INDICE como value em vez do nome. Alem de resolver, tira
do caminho o problema de escapar aspas e acentos dentro de um atributo
HTML montado por concatenacao de string -- que e onde este projeto erra.

    python _fix_filtro_evento.py
"""
import io
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-html.js")
s = io.open(P, encoding="utf-8").read()
orig = s
B = chr(92)
Q = "'"


def troca(velho, novo, rotulo):
    global s
    if velho not in s:
        raise SystemExit("NAO ENCONTRADO (" + rotulo + ")")
    s = s.replace(velho, novo, 1)
    print("  corrigido: " + rotulo)


# 1. as opcoes passam a ter value = indice
velho_opt = (
    '$("#f_ev").innerHTML="<option value=' + B + Q + B + Q + '>todos os eventos (" '
    '+ D.veiculos.length + ")</option>"+evs.map(function(e){return "<option>"+e+" ("'
    '+D.veiculos.filter(function(v){return v.evento===e;}).length+")</option>";}).join("");'
)
novo_opt = (
    '$("#f_ev").innerHTML="<option value=' + B + Q + B + Q + '>todos os eventos ("'
    '+D.veiculos.length+")</option>"+evs.map(function(e,i){'
    'return "<option value=' + B + Q + '"+i+"' + B + Q + '>"+esc(e)+" ("'
    '+D.veiculos.filter(function(v){return v.evento===e;}).length+")</option>";}).join("");'
)
troca(velho_opt, novo_opt, "montagem das opcoes (value = indice)")

# 2. a leitura do filtro resolve o indice de volta para o nome
troca(
    "  'const ev=$(" + chr(34) + "#f_ev" + chr(34) + ").value;',",
    "  'const evi=$(" + chr(34) + "#f_ev" + chr(34) + ").value;',\n"
    "  'const ev=(evi===\"\"?null:evs[Number(evi)]);',",
    "leitura do filtro",
)

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
