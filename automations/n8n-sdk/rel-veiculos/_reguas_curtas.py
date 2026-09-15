# -*- coding: utf-8 -*-
"""Encurta as reguas de comentario para que a transcricao seja reproduzivel.

O PROBLEMA, medido agora: transcrevi o `montar-fase2.js` para o n8n e o
conferidor acusou divergencia de 14 caracteres. Nenhum deles em codigo --
todos em reguas decorativas de comentario, sequencias de 70 glifos iguais
(`═` e `─`). Eu nao consigo reproduzir uma sequencia dessas com exatidao, e
o conferidor, corretamente, recusa "quase igual".

E o mesmo problema das barras invertidas de 10/09, com a mesma solucao: a
correcao nao e transcrever com mais cuidado, e TIRAR O MATERIAL. La foram
crases e caracteres literais (320 barras -> 4). Aqui sao as reguas.

O custo de nao resolver e pior do que parece: um conferidor que acusa
divergencia inofensiva em todo run vira um conferidor que se aprende a
ignorar -- e ai ele nao pega a divergencia que importa.

Toda sequencia de 8 ou mais `═`/`─` passa a ter exatamente 8. Oito e
contavel de relance, em quatro pares.

So mexe em `montar-fase2.js` e `montar-html.js`. `montar-fase1.js` e
`virar-arquivo.js` ja conferem byte a byte com o n8n; reescrever os dois
obrigaria a transcrever de novo o que ja esta certo.

    python _reguas_curtas.py
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

AQUI = os.path.dirname(os.path.abspath(__file__))
ALVOS = ["montar-fase2.js", "montar-html.js"]

# 8 e o limiar e tambem o comprimento final: sequencia curta demais para
# errar, longa o bastante para continuar lendo como regua.
N = 8
PADRAO = re.compile(r"([═─]){%d,}" % N)

for arq in ALVOS:
    P = os.path.join(AQUI, arq)
    s = io.open(P, encoding="utf-8").read()
    orig = s

    def encolhe(m):
        return m.group(1) * N

    s = PADRAO.sub(encolhe, s)

    if s == orig:
        print("  --  %-18s nada a encurtar" % arq)
        continue

    tmp = P + ".tmp"
    with io.open(tmp, "w", encoding="utf-8") as f:
        f.write(s)
    os.replace(tmp, P)

    restantes = len(PADRAO.findall(s))
    print("  ok  %-18s %d -> %d chars (%d reguas longas restantes)"
          % (arq, len(orig), len(s), restantes))

print("")
print("Agora `node --check` e as provas, porque regex sobre o arquivo inteiro")
print("e exatamente o tipo de mudanca que pode comer codigo sem avisar.")
