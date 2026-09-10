# -*- coding: utf-8 -*-
"""Uma linha por VEICULO, com o status da ULTIMA negociacao dele.

Pedido do Thomas (2026-09-09): "sempre pegar o ultimo status de cada veiculo".

O QUE MUDA E POR QUE IMPORTA

Ate agora a base era uma linha por NEGOCIACAO em status 1. Isso tinha dois
defeitos que so apareceram quando a janela passou a pegar o dia inteiro:

  1. O mesmo carro pode ter negociacao em varios eventos -- os feiroes LM
     sao diarios e reciclam estoque. Contando por negociacao, ele entrava
     duas vezes.

  2. Filtrar status ANTES de escolher a negociacao inverte a pergunta.
     Um carro vendido hoje, que ontem ficou "Sem Ofertas", passaria a
     aparecer como disponivel pela negociacao velha. A ordem certa e:
     acha a ultima negociacao do veiculo, DEPOIS olha o status dela.

A ULTIMA e MAX(an.id) dentro da janela de eventos -- nao da pra usar
ROW_NUMBER porque o validador do MCP rejeita funcao de janela. Mesmo
padrao que o q_perfil ja usa para a ultima oferta.

QUAIS STATUS ENTRAM (dominio informado pelo Thomas, ver dominios.md)

  1  Ativo                -> em evento aberto
  11 Sem Ofertas          -> sobrou: ninguem deu lance
  14 Vendedor Rejeitou    -> sobrou: recusou a oferta
  15 Comprador Rejeitou   -> sobrou: comprador desistiu
  18 Venda Cancelada      -> sobrou: a venda caiu depois de fechada

Ficam FORA 9 e 13 (Em Analise Comprador/Vendedor): ha oferta viva na mesa,
e ranquear loja para esse carro atrapalha negocio em andamento. Fora
tambem 2, 3 e 7 (venda) e 8, 10 (suspenso, cancelado).

    python _fix_ultimo_status.py
"""
import io
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
feito = []


def edita(arquivo, pares):
    p = os.path.join(AQUI, arquivo)
    s = io.open(p, encoding="utf-8").read()
    orig = s
    for rotulo, velho, novo in pares:
        if velho not in s:
            raise SystemExit("NAO ENCONTRADO em " + arquivo + ": " + rotulo)
        s = s.replace(velho, novo, 1)
        feito.append(arquivo + ": " + rotulo)
    io.open(p, "w", encoding="utf-8").write(s)
    return s != orig


# ══ FASE 1 ═════════════════════════════════════════════════════════════
edita("montar-fase1.js", [
    ("lista de status + subconsulta da ultima negociacao",
     """/* negociação disponível. status 1 = em aberto; 2, 3 e 7 = vendido.
   Medido na sonda a6fNNTUYYayehNIn, execução 49813 — não é suposição. */
const DISPONIVEL = " an.deleted_at IS NULL AND an.status = 1";""",
     """/* ─── QUAL VEÍCULO CONTA ──────────────────────────────────────────────
   Uma linha por VEÍCULO, com o status da ÚLTIMA negociação dele — não uma
   linha por negociação. O mesmo carro aparece em vários eventos (os feirões
   LM são diários e reciclam estoque), e contar por negociação o duplicava.

   A ordem importa e é fácil de inverter sem perceber: primeiro acha a
   última negociação, DEPOIS olha o status dela. Filtrar status antes faria
   um carro vendido hoje reaparecer como disponível pela negociação de
   ontem, que ficou em "Sem Ofertas".

   Domínio de status informado pelo Thomas em 2026-09-09 (ver
   context/banco-de-dados/dominios.md). Entram:

     1  Ativo              — em evento aberto
     11 Sem Ofertas        — sobrou: ninguém deu lance
     14 Vendedor Rejeitou  — sobrou: recusou a oferta
     15 Comprador Rejeitou — sobrou: comprador desistiu
     18 Venda Cancelada    — sobrou: a venda caiu depois de fechada

   Ficam de fora 9 e 13 (Em Análise Comprador/Vendedor): há oferta viva, e
   ranquear loja aí atrapalha negócio em andamento. Fora também 2, 3 e 7
   (venda) e 8, 10 (suspenso, cancelado). */
const STATUS_OK = [1, 11, 14, 15, 18];
const DISPONIVEL = " an.deleted_at IS NULL AND an.status IN (" + STATUS_OK.join(',') + ")";

/* a última negociação de cada veículo dentro da janela de eventos.
   MAX(an.id) porque o MCP rejeita função de janela — mesmo padrão que o
   q_perfil já usa para achar a última oferta. Repare que aqui NÃO há
   filtro de status: é a última de verdade, não a última entre as boas. */
const ULTIMA_NEG =
  "(SELECT a.vehicle_id AS vehicle_id, MAX(an.id) AS neg_id" +
  " FROM advertisement_negotiations an" +
  " INNER JOIN events e ON e.id = an.event_id AND" + SELECAO +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " WHERE an.deleted_at IS NULL" +
  " GROUP BY a.vehicle_id) u";"""),

    ("q_veic_total conta veiculos, nao negociacoes",
     """push('q_veic_total',
  "SELECT COUNT(DISTINCT a.vehicle_id) AS veiculos," +
  " COUNT(DISTINCT an.id) AS negociacoes," +
  " COUNT(DISTINCT e.id) AS eventos" +
  " FROM advertisement_negotiations an" +
  " INNER JOIN events e ON e.id = an.event_id AND" + SELECAO +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " INNER JOIN vehicles v ON v.id = a.vehicle_id AND v.deleted_at IS NULL" +
  " WHERE" + DISPONIVEL);""",
     """push('q_veic_total',
  "SELECT COUNT(*) AS veiculos, COUNT(*) AS negociacoes," +
  " COUNT(DISTINCT an.event_id) AS eventos" +
  " FROM " + ULTIMA_NEG +
  " INNER JOIN advertisement_negotiations an ON an.id = u.neg_id" +
  " INNER JOIN vehicles v ON v.id = u.vehicle_id AND v.deleted_at IS NULL" +
  " WHERE" + DISPONIVEL);

/* quantos veículos a janela tem por status da última negociação — mostra
   quanto do total é sobra de evento encerrado e quanto está em evento
   aberto. Vai para a tela como leitura, não entra em nenhum cálculo. */
push('q_por_status',
  "SELECT an.status AS status, COUNT(*) AS veiculos" +
  " FROM " + ULTIMA_NEG +
  " INNER JOIN advertisement_negotiations an ON an.id = u.neg_id" +
  " INNER JOIN vehicles v ON v.id = u.vehicle_id AND v.deleted_at IS NULL" +
  " GROUP BY an.status ORDER BY veiculos DESC");"""),

    ("q_valor usa a mesma base",
     """  " FROM advertisement_negotiations an" +
  " INNER JOIN events e ON e.id = an.event_id AND" + SELECAO +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " WHERE" + DISPONIVEL);""",
     """  " FROM " + ULTIMA_NEG +
  " INNER JOIN advertisement_negotiations an ON an.id = u.neg_id" +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " WHERE" + DISPONIVEL);"""),

    ("META carrega a subconsulta e a lista de status",
     """const META = {
  selecao: SELECAO,
  agora_br: AGORA_BR,""",
     """const META = {
  selecao: SELECAO,
  ultima_neg: ULTIMA_NEG,
  status_ok: STATUS_OK,
  agora_br: AGORA_BR,"""),
])

# ══ FASE 2 ═════════════════════════════════════════════════════════════
edita("montar-fase2.js", [
    ("le a subconsulta da fase 1",
     """const AGORA_BR = META_IN.agora_br;""",
     """const ULTIMA_NEG = META_IN.ultima_neg;\nconst AGORA_BR = META_IN.agora_br;"""),

    ("q_veiculos: uma linha por veiculo, status da ultima negociacao",
     """  " FROM advertisement_negotiations an" +
  " INNER JOIN events e ON e.id = an.event_id AND" + SELECAO +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " INNER JOIN vehicles v ON v.id = a.vehicle_id AND v.deleted_at IS NULL" +
  " LEFT JOIN models mo ON mo.id = v.model_id" +""",
     """  " FROM " + ULTIMA_NEG +
  " INNER JOIN advertisement_negotiations an ON an.id = u.neg_id" +
  " INNER JOIN events e ON e.id = an.event_id" +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " INNER JOIN vehicles v ON v.id = u.vehicle_id AND v.deleted_at IS NULL" +
  " LEFT JOIN models mo ON mo.id = v.model_id" +"""),

    ("q_veiculos publica o status",
     """  " a.shop_id AS loja_id, s.name AS loja_vendedora,\"""",
     """  " an.status AS neg_status," +
  " a.shop_id AS loja_id, s.name AS loja_vendedora,\""""),

    ("GROUP BY acompanha a coluna nova",
     """  " marca, model_year, km, loja_id, loja_vendedora, uf" +
  " ORDER BY an.id", PAG_VEIC);""",
     """  " marca, model_year, km, neg_status, loja_id, loja_vendedora, uf" +
  " ORDER BY an.id", PAG_VEIC);"""),

    ("META repassa a subconsulta e os status",
     """const META = {
  selecao: SELECAO,
  agora_br: AGORA_BR,""",
     """const META = {
  selecao: SELECAO,
  ultima_neg: ULTIMA_NEG,
  status_ok: META_IN.status_ok,
  agora_br: AGORA_BR,"""),
])

print("mudou")
for f in feito:
    print("  ok  " + f)
