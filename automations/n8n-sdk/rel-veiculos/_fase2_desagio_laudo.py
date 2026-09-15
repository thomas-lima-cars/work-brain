# -*- coding: utf-8 -*-
"""Fase 2: desagio e laudo na base de VEICULOS, e o desvio do desagio por loja.

Pedido do Thomas em 2026-09-11 (segunda rodada). Duas colunas novas e nenhuma
consulta nova -- as duas pegam carona em varreduras que ja existem:

  1. LAUDO DO VEICULO -> uma juncao a mais na q_veiculos.
  2. DESVIO DO DESAGIO -> uma coluna a mais na q_perfil, ao lado da media que
     ja entrou hoje de manha.

O desagio DO VEICULO nao vem do banco: `valor` e `fipe` ja estao na
q_veiculos, entao ele e conta no Montar HTML. Pedir ao banco o que ja se tem
custaria 26 chamadas por nada.

POR QUE O DESVIO IMPORTA: o desagio vai virar indicador QUANTITATIVO, como
preco e km. Nesses, a aderencia e 1/(1+|valor-media|/desvio) e o peso e
1/(1+desvio/media) -- o inverso do coeficiente de variacao. Sem o desvio nao
ha nem aderencia nem peso: loja de desagio consistente (compra sempre 30%
abaixo) e loja erratica pesariam igual, que e justamente o que o CV existe
pra separar.

ARMADILHA REPETIDA DE PROPOSITO: a juncao do laudo na q_veiculos e LEFT.
Com INNER, veiculo sem laudo sumiria da base inteira -- 4% deles, medido na
sonda 50346 -- e a contagem de veiculos mudaria em silencio. Foi a mesma
decisao da juncao do desagio na q_perfil hoje de manha.

E o laudo tem UMA linha por veiculo (medido: `n` = COUNT(DISTINCT vehicle_id)
nos cinco status), entao a juncao nao multiplica linha. Se um dia multiplicar,
a guarda de duplicata que ja existe no Montar HTML acusa.

    python _fase2_desagio_laudo.py
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
    if s.count(velho) != 1:
        raise SystemExit("ANCORA AMBIGUA OU AUSENTE (%d): %s" % (s.count(velho), rot))
    s = s.replace(velho, novo, 1)
    print("  ok  " + rot)


# ── 1. q_veiculos ganha o status do laudo ────────────────────────────────
troca(
"""  \" an.status AS neg_status,\" +""",
"""  \" an.status AS neg_status,\" +
  /* laudo cautelar do veiculo. Dominio medido na sonda 50346: aprovado,
     aprovado_com_apontamento, reprovado, nao_informado e vazio.
     'nao_informado' e laudo SEM VEREDITO (78% da base), diferente de nao ter
     laudo -- que aqui chega como NULL. Sao tres estados, nao dois. */
  \" vpr.situation AS laudo,\" +""",
    "q_veiculos publica o status do laudo")

troca(
"""  \" LEFT JOIN shop_stocks ss ON ss.id = COALESCE(a.shop_stock_id, v.shop_stock_id)\" +
  \" AND ss.deleted_at IS NULL\" +
  \" WHERE\" + DISPONIVEL +""",
"""  \" LEFT JOIN shop_stocks ss ON ss.id = COALESCE(a.shop_stock_id, v.shop_stock_id)\" +
  \" AND ss.deleted_at IS NULL\" +
  /* LEFT, nunca INNER: 4% dos veiculos nao tem laudo (sonda 50346) e com
     INNER eles sumiriam da base inteira, mudando a contagem em silencio.
     Uma linha por veiculo, medido -- a juncao nao multiplica. */
  \" LEFT JOIN vehicle_precautionary_reports vpr\" +
  \" ON vpr.vehicle_id = a.vehicle_id AND vpr.deleted_at IS NULL\" +
  \" WHERE\" + DISPONIVEL +""",
    "juncao LEFT com o laudo")

troca(
"""  \" marca, versao, anuncio_uuid, model_year, km, neg_status,\" +
  \" loja_id, loja_vendedora, uf\" +""",
"""  \" marca, versao, anuncio_uuid, model_year, km, neg_status, laudo,\" +
  \" loja_id, loja_vendedora, uf\" +""",
    "laudo no GROUP BY")

# ── 2. q_perfil ganha o desvio do desagio ────────────────────────────────
troca(
"""  \" ROUND(AVG(CASE WHEN \" + DESAGIO_OK + \" THEN \" + DESAGIO + \" END), 2) AS desagio_medio,\" +""",
"""  \" ROUND(AVG(CASE WHEN \" + DESAGIO_OK + \" THEN \" + DESAGIO + \" END), 2) AS desagio_medio,\" +
  /* o desvio e o que torna o desagio um indicador QUANTITATIVO de verdade:
     a aderencia usa 1/(1+|valor-media|/desvio) e o peso usa o inverso do
     coeficiente de variacao. Sem ele, loja de desagio consistente e loja
     erratica pesariam igual. */
  \" ROUND(STDDEV_SAMP(CASE WHEN \" + DESAGIO_OK + \" THEN \" + DESAGIO + \" END), 2) AS desagio_desvio,\" +""",
    "q_perfil publica desagio_desvio")

tmp = P + ".tmp"
with io.open(tmp, "w", encoding="utf-8") as f:
    f.write(s)
os.replace(tmp, P)

print("montar-fase2.js: %d -> %d chars" % (len(orig), len(s)))
