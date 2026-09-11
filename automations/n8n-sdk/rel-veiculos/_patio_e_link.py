# -*- coding: utf-8 -*-
"""UF do veiculo passa a ser a do PATIO, e o anuncio ganha link.

PATIO (pedido de 2026-09-10). Ate agora a UF do veiculo vinha do ENDERECO DA
LOJA VENDEDORA (`shop_addresses` de `a.shop_id`) -- mas o carro nao esta no
escritorio da loja, esta num patio, e `shop_stocks` e justamente "estoques de
uma loja, que podem ser locais fisicos diferentes", com state e city.

Medido antes (sonda 50068, q_patio / q_uf_patio), sobre 1.879 negociacoes:
  patio_no_anuncio = 1.879   patio_no_veiculo = 1.879
  patio_encontrado = 1.879   patio_com_uf     = 1.879
  divergem         = 1.278  <-- 68%

Cobertura de 100% pelos DOIS caminhos, e 68% dos veiculos mudam de UF. Isso
nao e cosmetico: UF e metade da regra de elegibilidade (par (veiculo, loja) so
existe se a UF for a mesma), entao a base de pares e OUTRA, nao uma variacao
da anterior. Comparar o proximo run com o 49984 nao vai fazer sentido.

A UF da LOJA continua saindo de `shop_addresses` -- e o certo: o carro esta no
patio, a loja compradora esta onde ela e. Por isso UF_CASE fica de pe e o
patio ganha expressao propria.

Normalizar o patio e desnecessario (as 25 UFs medidas ja vem como sigla limpa
de duas letras, zero vazios), mas a validacao contra a lista das 27 fica como
GUARDA: se um dia entrar sujeira, cai em 'Nao identificada' e aparece na tela,
em vez de virar uma UF fantasma que quebra a elegibilidade em silencio.

LINK (pedido de 2026-09-10). O padrao NAO e /anuncio/<uuid>: esta decidido
desde a reuniao de 25/08 e conferido caractere por caractere contra os
exemplos do Guilherme (ver n8n-flows/lista-lm-propostas.md):

    cars2you.com.br/anuncio/veiculo/{marca}/{modelo}/{versao}/{uuid}

Precisa de quatro pedacos, nao de um. Medido (q_link_partes): link_completo =
1.879 de 1.879, zero sem marca, modelo, versao ou uuid. Ainda assim a montagem
fica no Montar HTML com a regra dura herdada da lista LM -- faltando um pedaco,
NAO entrega link. Melhor sem botao que botao que cai em lugar nenhum.

Aqui a fase 2 so traz a materia-prima: `versao` e `anuncio_uuid`.

    python _patio_e_link.py
"""
import io
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-fase2.js")
s = io.open(P, encoding="utf-8").read()
orig = s

UFS = ("'SP','MG','PR','SC','RJ','GO','RS','BA','MT','DF','CE','MS','ES','PE',"
       "'PA','SE','AM','MA','RN','PB','AL','PI','RO','TO','AP','AC','RR'")


def troca(velho, novo, rotulo):
    global s
    if velho not in s:
        raise SystemExit("NAO ENCONTRADO: " + rotulo)
    s = s.replace(velho, novo, 1)
    print("  ok  " + rotulo)


# 1) a expressao da UF do patio, ao lado do UF_CASE da loja
troca(
    u"  \" ELSE NULL END\";\n\nconst JANELA =",
    u"  \" ELSE NULL END\";\n\n"
    u"/* a UF do VEICULO sai do PATIO, nao do endereco da loja vendedora: o carro\n"
    u"   esta fisicamente no estoque (`shop_stocks`), e 68% dos veiculos tem UF de\n"
    u"   patio diferente da UF da loja (sonda 50068). UF e metade da regra de\n"
    u"   elegibilidade, entao isso decide quem pode aparecer pra quem.\n"
    u"   As 25 UFs medidas ja vem como sigla limpa, sem vazios -- a validacao\n"
    u"   abaixo e GUARDA, nao caminho: sujeira futura cai em 'Nao identificada' e\n"
    u"   aparece na tela em vez de virar UF fantasma. */\n"
    u"const UF_PATIO =\n"
    u"  \"CASE WHEN UPPER(TRIM(ss.state)) IN (" + UFS + ") THEN UPPER(TRIM(ss.state))\" +\n"
    u"  \" ELSE NULL END\";\n\nconst JANELA =",
    "UF_PATIO definido ao lado de UF_CASE")

# 2) q_veiculos: colunas novas
troca(
    u"  \" v.category_id AS category_id, cat.name AS categoria,\" +\n"
    u"  \" br.name AS marca, v.model_year AS model_year, NULLIF(v.km, 0) AS km,\" +",
    u"  \" v.category_id AS category_id, cat.name AS categoria,\" +\n"
    u"  \" br.name AS marca, ve.name AS versao, a.uuid AS anuncio_uuid,\" +\n"
    u"  \" v.model_year AS model_year, NULLIF(v.km, 0) AS km,\" +",
    "q_veiculos traz versao e anuncio_uuid")

# 3) q_veiculos: a UF passa a ser a do patio
troca(
    u"  \" COALESCE(\" + UF_CASE + \", 'Não identificada') AS uf\" +\n"
    u"  \" FROM \" + ULTIMA_NEG +",
    u"  \" COALESCE(\" + UF_PATIO + \", 'Não identificada') AS uf\" +\n"
    u"  \" FROM \" + ULTIMA_NEG +",
    "q_veiculos usa UF do patio")

# 4) os joins: patio e versoes. shop_addresses SAI de q_veiculos -- nao e mais
#    usada ali, e join que ninguem le e custo puro num agregado paginado.
troca(
    u"  \" LEFT JOIN brands br ON br.id = v.brand_id\" +\n"
    u"  \" LEFT JOIN shops s ON s.id = a.shop_id\" +\n"
    u"  \" LEFT JOIN shop_addresses sa ON sa.shop_id = a.shop_id AND sa.deleted_at IS NULL\" +\n"
    u"  \" WHERE\" + DISPONIVEL +",
    u"  \" LEFT JOIN brands br ON br.id = v.brand_id\" +\n"
    u"  \" LEFT JOIN versions ve ON ve.id = v.version_id\" +\n"
    u"  \" LEFT JOIN shops s ON s.id = a.shop_id\" +\n"
    u"  /* os DOIS caminhos ate o patio estao preenchidos em 100% dos casos; o\n"
    u"     COALESCE prefere o do anuncio, que e o local de onde o carro esta\n"
    u"     sendo vendido naquele evento. shop_addresses saiu daqui: a UF da loja\n"
    u"     vendedora nao e mais lida, e join que ninguem le custa caro num\n"
    u"     agregado paginado. */\n"
    u"  \" LEFT JOIN shop_stocks ss ON ss.id = COALESCE(a.shop_stock_id, v.shop_stock_id)\" +\n"
    u"  \" AND ss.deleted_at IS NULL\" +\n"
    u"  \" WHERE\" + DISPONIVEL +",
    "joins de shop_stocks e versions; shop_addresses fora de q_veiculos")

# 5) GROUP BY tem que listar as colunas novas
troca(
    u"  \" marca, model_year, km, neg_status, loja_id, loja_vendedora, uf\" +",
    u"  \" marca, versao, anuncio_uuid, model_year, km, neg_status,\" +\n"
    u"  \" loja_id, loja_vendedora, uf\" +",
    "GROUP BY inclui versao e anuncio_uuid")

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
