# -*- coding: utf-8 -*-
"""Redesenha o cenario sintetico para conviver com a correspondencia minima.

O corte de 50% derrubou o par que testava o fator de confianca: a loja 13
tinha 1 veiculo de historico, confianca 1/5, e score 20 -- exatamente o
caso que a confianca existe pra segurar, e que agora o corte remove antes.

Duas correcoes, e as duas sao no cenario, nao na regra:

  1. A loja 13 passa a ter 4 veiculos de historico (confianca 4/5). O score
     dela vira 80: continua provando que a confianca ABAIXA o score, e
     sobrevive ao corte, entao os testes de elegibilidade que dependiam
     dela voltam a valer.

  2. Entra a loja 15, desenhada para ficar ABAIXO de 50: mesmo whitelabel e
     mesma UF dos veiculos de SP, mas com faixa de preco, idade e km muito
     longe deles. Sem o corte ela apareceria com score ~32. Com o corte ela
     nao pode existir em lugar nenhum -- nem como par, nem na lista de
     lojas publicadas. E o teste que faltava para a regra nova.

    python _prova_corte.py
"""
import io
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "prova-local.js")
s = io.open(P, encoding="utf-8").read()
orig = s
feito = []


def troca(velho, novo, rotulo):
    global s
    if velho not in s:
        raise SystemExit("NAO ENCONTRADO: " + rotulo)
    s = s.replace(velho, novo, 1)
    feito.append(rotulo)


# ── a loja 15, feita pra ser cortada ───────────────────────────────────
troca(
"""  [14, 'Trucks SP wl4', 4, 'Trucks2you', 'SP']
];""",
"""  [14, 'Trucks SP wl4', 4, 'Trucks2you', 'SP'],
  /* mesma UF e mesmo whitelabel dos veiculos de SP, entao ELEGIVEL --
     mas com faixa longe demais: score ~32, abaixo do corte de 50. */
  [15, 'Fora de faixa SP wl7', 7, 'Marketplace', 'SP']
];""",
"loja 15 no elenco")

troca(
    "const OFERTAS = [[11, 100], [12, 100], [13, 100], [14, 100]];",
    "const OFERTAS = [[11, 100], [12, 100], [13, 100], [14, 100], [15, 100]];",
    "ofertas da loja 15")

troca(
"""  [13, 1, 100000, 10000, 5, 1, 100000, 20000],
  [14, 50, 100000, 10000, 5, 1, 100000, 20000]
];""",
"""  /* 4 veiculos de historico -> confianca 4/5 = 0,8. Antes era 1, o que dava
     score 20 e caia no corte; 80 continua provando que a confianca abaixa o
     score, sem sumir da tela. */
  [13, 4, 100000, 10000, 5, 1, 100000, 20000],
  [14, 50, 100000, 10000, 5, 1, 100000, 20000],
  /* faixa apertada e distante: adere quase zero em preco, idade e km */
  [15, 50, 300000, 1000, 15, 0.5, 300000, 1000]
];""",
"perfil da 13 e da 15")

troca(
    "const MODELO = [[11, 501, 'Onix', 50], [12, 501, 'Onix', 50], [13, 501, 'Onix', 50], [14, 501, 'Onix', 50]];",
    "const MODELO = [[11, 501, 'Onix', 50], [12, 501, 'Onix', 50], [13, 501, 'Onix', 50], [14, 501, 'Onix', 50], [15, 501, 'Onix', 50]];",
    "moda de modelo da 15")

troca(
    "const CATEG = [[11, 1, 'Automovel', 80], [12, 1, 'Automovel', 80], [13, 1, 'Automovel', 80], [14, 1, 'Automovel', 80]];",
    "const CATEG = [[11, 1, 'Automovel', 80], [12, 1, 'Automovel', 80], [13, 1, 'Automovel', 80], [14, 1, 'Automovel', 80], [15, 1, 'Automovel', 80]];",
    "moda de categoria da 15")

troca("const f2b = fase2Com(5, 4);", "const f2b = fase2Com(5, 5);", "gabarito: 5 lojas")

# ── a confianca agora e 4/5 ────────────────────────────────────────────
troca(
    "ok(perto(scoreDe(byNeg[3].i, 13), 20, 0.05), 'loja 13 tem amostra 1: confianca 1/5 -> 20 — tem ' + scoreDe(byNeg[3].i, 13));",
    "ok(perto(scoreDe(byNeg[3].i, 13), 80, 0.05), 'loja 13 tem amostra 4: confianca 4/5 abaixa 100 para 80 — tem ' + scoreDe(byNeg[3].i, 13));",
    "confianca 4/5 -> 80")

# ── o teste que faltava: o corte de 50% ────────────────────────────────
troca(
    "ok(D.lojas.length === 4, 'as 4 lojas participam de pelo menos um par');",
"""ok(D.lojas.length === 4, 'as 4 lojas com par entram; a 15 nao — tem ' + D.lojas.length);

/* O CORTE DE 50%. A loja 15 e elegivel (mesma UF, mesmo whitelabel) e sem o
   corte apareceria com score ~32. Com ele, nao pode existir em lugar
   nenhum: nem par, nem linha na lista de lojas. */
ok(D.parametros.corresp_min === 50, 'a correspondencia minima viaja no DADOS');
ok(D.parametros.pares_descartados >= 3,
   'o corte derrubou os pares da loja 15 — ' + D.parametros.pares_descartados + ' descartados');
ok(D.lojas.every((l) => l.loja_id !== 15), 'a loja abaixo do corte nao e publicada');
var abaixo = 0;
for (let i = 0; i < P.length; i += 3) if (P[i + 2] / 10 < 50) abaixo++;
ok(abaixo === 0, 'nenhum par publicado esta abaixo do corte — tem ' + abaixo);""",
    "provas do corte de 50%")

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
for r in feito:
    print("  ok  " + r)
