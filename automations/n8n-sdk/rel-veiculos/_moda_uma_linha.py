# -*- coding: utf-8 -*-
r"""A moda passa a devolver UMA linha por loja. Fim do chute de paginacao.

MEDIDO no run 50327, com a conferencia de cobertura que entrou hoje:

  q_categoria  28 chamadas -> 1.323 linhas (teto 1.400)  completa
  q_modelo     28 chamadas -> 1.400 linhas (teto 1.400)  TRUNCADA
  "a moda de modelo cobriu 1248 lojas de 1295: faltam 47"

Ou seja: a folga de 2 paginas bastou pra categoria (28 empates) e nao bastou
pra modelo. Efeito real -- as 47 lojas perderam o componente de modelo do
score, e os pares cairam de 44.095 (run 50270) para 43.292.

AUMENTAR A FOLGA SERIA CHUTAR DE NOVO. A causa raiz e a consulta devolver
uma linha por (loja, item) empatado no topo, o que faz o numero de linhas
depender de empates -- e empate nao da pra prever.

Correcao: DESEMPATAR NO SQL, agrupando por loja e ficando com o menor
item_id entre os empatados. Assim:

  - sai exatamente UMA linha por loja com moda;
  - o total passa a ser conhecido (= lojas com moda), e a paginacao volta a
    ser PAG_LOJAS, dimensionada e nao chutada;
  - o desempate vira DETERMINISTICO. Hoje quem desempata e o
    `primeiraPorLoja` no Montar HTML, que fica com a linha que chegou
    primeiro -- depende da ordem de paginacao, entao a mesma loja podia ter
    modelo diferente entre dois runs. Menor item_id sempre da o mesmo.

O nome do item entra por fora, num LEFT JOIN sobre o resultado ja colapsado,
porque com GROUP BY por loja nao da pra carregar o nome junto.

A conferencia de cobertura continua: ela e que pegou isto, e e ela que pega
a proxima surpresa.

    python _moda_uma_linha.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-fase2.js")
s = io.open(P, encoding="utf-8").read()
orig = s


def troca(velho, novo, rot):
    global s
    if velho not in s:
        raise SystemExit("NAO ENCONTRADO: " + rot)
    s = s.replace(velho, novo, 1)
    print("  ok  " + rot)


troca(
"""  push(nome,
    "SELECT ag.shop_id AS shop_id, ag.item_id AS item_id, cat.name AS nome, ag.n AS n" +
    " FROM " + AG + " ag" +
    " INNER JOIN (SELECT t.shop_id AS shop_id, MAX(t.n) AS mx FROM " + AG + " t" +
    " GROUP BY t.shop_id) top ON top.shop_id = ag.shop_id AND ag.n = top.mx" +
    " LEFT JOIN " + tabela + " cat ON cat.id = ag.item_id" +
    " ORDER BY ag.shop_id, ag.item_id", PAG_MODA);""",
"""  /* UMA linha por loja. O GROUP BY externo com MIN(item_id) colapsa os\n     empates no topo, e com isso:\n       - o numero de linhas passa a ser conhecido (= lojas com moda), entao\n         a paginacao volta a ser dimensionada em vez de chutada;\n       - o desempate fica DETERMINISTICO. Antes quem desempatava era o\n         `primeiraPorLoja` no Montar HTML, ficando com a linha que chegou\n         primeiro -- dependia da ordem de paginacao, entao a mesma loja\n         podia ter modelo diferente entre dois runs.\n     Medido no run 50327: com uma linha por (loja, item), q_modelo bateu no\n     teto de 1.400 e 47 lojas perderam o componente de modelo. */\n  push(nome,\n    "SELECT t.shop_id AS shop_id, t.item_id AS item_id, cat.name AS nome, t.n AS n" +\n    " FROM (SELECT ag.shop_id AS shop_id, MIN(ag.item_id) AS item_id, MAX(ag.n) AS n" +\n    " FROM " + AG + " ag" +\n    " INNER JOIN (SELECT t2.shop_id AS shop_id, MAX(t2.n) AS mx FROM " + AG + " t2" +\n    " GROUP BY t2.shop_id) top ON top.shop_id = ag.shop_id AND ag.n = top.mx" +\n    " GROUP BY ag.shop_id) t" +\n    " LEFT JOIN " + tabela + " cat ON cat.id = t.item_id" +\n    " ORDER BY t.shop_id", PAG_LOJAS);""",
    "moda colapsada em uma linha por loja, paginada por PAG_LOJAS")

troca(
"""/* As duas consultas de MODA sao as unicas que podem passar do numero de
   lojas: elas devolvem uma linha por (loja, item) empatado no topo, entao
   loja com empate rende mais de uma linha. No run 50270 as duas voltaram
   com exatos 1.300 = 26 x 50, batendo no teto -- sem folga nao da pra
   saber se aquilo era a contagem real ou corte.

   2 paginas de folga sao numero ESCOLHIDO, nao medido. O que torna a
   escolha segura e a conferencia de cobertura no Montar HTML, que compara
   as lojas distintas que chegaram contra q_moda_lojas. */
const PAG_MODA = PAG_LOJAS + 2;""",
"""/* As modas voltaram a caber em PAG_LOJAS: elas agora colapsam os empates no
   proprio SQL e devolvem UMA linha por loja. A folga de 2 paginas que
   existia aqui era chute, e o run 50327 mostrou que chute nao serve --\n   bastou pra categoria (28 empates) e nao bastou pra modelo, que bateu no\n   teto e deixou 47 lojas sem o componente.\n\n   A conferencia de cobertura no Montar HTML continua de pe: foi ela que\n   pegou isto, e e ela que pega a proxima surpresa. */""",
    "PAG_MODA sai; as modas voltam a PAG_LOJAS")

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
