# -*- coding: utf-8 -*-
"""Conserta as duas linhas de celula que eu quebrei ao separar Aderencia/Score.

O erro: as linhas do APP que montam as celulas comecam depois de uma linha
que ja termina com `+`. Eu escrevi `"+(comScore?...` -- aquela aspa inicial
abre uma string falsa e o parser morre com "missing ) after argument list".
O certo e a linha comecar direto pela expressao: `(comScore?...`.

Nao foi erro de logica: foi de concatenacao de string, o modo de falha que
este projeto ja conhece. A licao esta na prova, que agora valida a sintaxe
do JS do navegador -- antes so o no era checado, e o APP viaja como string.

    python _fix_celulas.py
"""
import io
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-html.js")
s = io.open(P, encoding="utf-8").read()
orig = s

pares = [
    ("veiculos", "  '\"+(comScore?celulas(r.s,D.lojas[selL].confianca)",
                 "  '(comScore?celulas(r.s,D.lojas[selL].confianca)"),
    ("lojas", "  '\"+(comScore?celulas(r.s,r.l.confianca)",
              "  '(comScore?celulas(r.s,r.l.confianca)"),
]
for rotulo, velho, novo in pares:
    if velho not in s:
        raise SystemExit("NAO ENCONTRADO (" + rotulo + "): " + velho)
    s = s.replace(velho, novo, 1)
    print("  corrigido: " + rotulo)

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
