# -*- coding: utf-8 -*-
"""Publica o status da ultima negociacao e marca a sobra na tela.

Agora que a base tem uma linha por VEICULO com o status da ULTIMA
negociacao dele, convivem duas coisas diferentes na mesma tabela:

  - carro em evento ABERTO, status 1 (Ativo)
  - carro que SOBROU de evento encerrado: 11 Sem Ofertas, 14 Vendedor
    Rejeitou, 15 Comprador Rejeitou, 18 Venda Cancelada

Sem marcar, os dois se parecem -- e a diferenca e operacional: um ainda
esta em disputa, o outro e estoque parado esperando reoferta.

A deduplicacao por veiculo ja e garantida pelo SQL (MAX(an.id) agrupado
por vehicle_id). Aqui ela e refeita mesmo assim, e a contagem de descarte
vai para as falhas: se um dia a query mudar e voltar a duplicar, o
relatorio grita em vez de somar o mesmo carro duas vezes.

    python _marca_sobra.py
"""
import io
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-html.js")
s = io.open(P, encoding="utf-8").read()
orig = s
feito = []


def troca(velho, novo, rotulo):
    global s
    if velho not in s:
        raise SystemExit("NAO ENCONTRADO (" + rotulo + ")")
    s = s.replace(velho, novo, 1)
    feito.append(rotulo)


# ── 1. dicionario de status + dedup por veiculo ─────────────────────────
troca(
"""const vistos = {};
let dupVeic = 0;""",
"""/* Dominio informado pelo Thomas em 2026-09-09 -- ver
   context/banco-de-dados/dominios.md. So os cinco de STATUS_OK chegam
   aqui; os outros ficam no dicionario porque um dia a lista pode mudar e
   e melhor a tela dizer o nome do que mostrar um numero solto. */
const STATUS_NOME = {
  1: 'Ativo', 2: 'Aguardando Pagamento', 3: 'Aguardando Confirmacao de Pagamento',
  7: 'Vendido', 8: 'Suspenso', 9: 'Em Analise Comprador', 10: 'Cancelado',
  11: 'Sem Ofertas', 13: 'Em Analise Vendedor', 14: 'Vendedor Rejeitou',
  15: 'Comprador Rejeitou', 18: 'Venda Cancelada'
};

/* a chave e o VEICULO, nao a negociacao: o mesmo carro reaparece em
   eventos diferentes e o SQL ja colapsa por MAX(an.id). Refazer aqui e
   barato e transforma uma regressao silenciosa em falha visivel. */
const vistos = {};
let dupVeic = 0;""",
"dicionario de status")

troca(
"""(dados.q_veiculos || []).forEach((r) => {
  const k = String(r.neg_id);
  if (vistos[k]) { dupVeic++; return; }
  vistos[k] = 1;""",
"""(dados.q_veiculos || []).forEach((r) => {
  const k = String(r.vehicle_id);
  if (vistos[k]) { dupVeic++; return; }
  vistos[k] = 1;""",
"dedup por veiculo")

# ── 2. o veiculo carrega o status ───────────────────────────────────────
troca(
"""    /* string x string: os dois lados sao 'YYYY-MM-DD HH:MM' em hora de
       Brasilia, entao a ordem lexicografica e a ordem cronologica */
    encerrado: !!(META.agora_br && r.fim_evento && r.fim_evento < META.agora_br)""",
"""    /* string x string: os dois lados sao 'YYYY-MM-DD HH:MM' em hora de
       Brasilia, entao a ordem lexicografica e a ordem cronologica */
    encerrado: !!(META.agora_br && r.fim_evento && r.fim_evento < META.agora_br),
    neg_status: num(r.neg_status),
    status_nome: STATUS_NOME[num(r.neg_status)] || ('status ' + r.neg_status),
    /* sobra = passou pelo evento e nao foi vendido nem esta em negociacao.
       Status 1 e o unico que significa "ainda em disputa". */
    sobra: num(r.neg_status) !== null && num(r.neg_status) !== 1""",
"status no veiculo")

# ── 3. resumo e falhas ──────────────────────────────────────────────────
troca(
"""    encerrados: veiculos.filter((v) => v.encerrado).length,""",
"""    encerrados: veiculos.filter((v) => v.encerrado).length,
    sobra: veiculos.filter((v) => v.sobra).length,""",
"contagem de sobra no resumo")

troca(
"""if (dupVeic) falhas.push(dupVeic + ' linha(s) duplicada(s) de veiculo descartada(s)');""",
"""if (dupVeic) {
  falhas.push(dupVeic + ' veiculo(s) vieram mais de uma vez do banco e foram descartados: ' +
    'a query deveria trazer so a ultima negociacao de cada um');
}""",
"falha de duplicata explica o que deveria acontecer")

# ── 4. o dicionario e a contagem por status viajam no DADOS ─────────────
troca(
"""  parametros: { confianca_min: CONFIANCA_MIN },""",
"""  parametros: {
    confianca_min: CONFIANCA_MIN,
    status_ok: META.status_ok || [],
    status_nome: STATUS_NOME
  },
  por_status: (dados.q_por_status || []).map((r) => ({
    status: num(r.status), nome: STATUS_NOME[num(r.status)] || ('status ' + r.status),
    veiculos: num(r.veiculos), no_relatorio: (META.status_ok || []).indexOf(num(r.status)) >= 0
  })),""",
"parametros e contagem por status no DADOS")

# ── 5. KPI e selo na tabela ─────────────────────────────────────────────
troca(
    r"""["em evento ja encerrado",nf(R.encerrados||0)],""",
    r"""["sobra de evento encerrado",nf(R.sobra||0)],""",
    "KPI de sobra no lugar do de encerrado")

troca(
    r"""'"<td class=\'tx\'>"+esc(r.v.uf)+"</td><td class=\'tx\'>"+esc(r.v.evento)+(r.v.encerrado?" <span class=\'tag w\'>encerrado</span>":"")+"</td>"+',""",
    r"""'"<td class=\'tx\'>"+esc(r.v.uf)+"</td><td class=\'tx\'>"+esc(r.v.evento)+(r.v.sobra?" <span class=\'tag w\'>"+esc(r.v.status_nome)+"</span>":"")+"</td>"+',""",
    "selo mostra o status da ultima negociacao")

# o filtro de texto do veiculo passa a casar tambem com o nome do status,
# entao digitar "sem ofertas" isola a sobra sem precisar de outro controle
troca(
    r"""  'return base.filter(r=>(!ev||r.v.evento===ev)&&noWl(r.v,w)&&(!q||((r.v.marca||"")+" "+(r.v.modelo||"")).toLowerCase().indexOf(q)>=0));}',""",
    r"""  'return base.filter(r=>(!ev||r.v.evento===ev)&&noWl(r.v,w)&&(!q||((r.v.marca||"")+" "+(r.v.modelo||"")+" "+(r.v.status_nome||"")).toLowerCase().indexOf(q)>=0));}',""",
    "filtro de texto casa com o nome do status")

troca(
    """  '<input id="f_v" placeholder="filtrar marca ou modelo" size="26"></div>',""",
    """  '<input id="f_v" placeholder="filtrar marca, modelo ou status (ex: sem ofertas)" size="34"></div>',""",
    "placeholder conta que da pra filtrar por status")

# ── 6. a caixa de elegibilidade explica a base ──────────────────────────
troca(
    """  '<div class="box"><h2>A regra de elegibilidade</h2>',""",
    """  '<div class="box"><h2>O que entra na base</h2>',
  '<p style="margin:0 0 6px">Uma linha por <b>veiculo</b>, com o status da <b>ultima negociacao</b> dele na janela &mdash; nao uma linha por negociacao. A ordem importa: primeiro se acha a ultima negociacao, <b>depois</b> se olha o status. O contrario faria um carro vendido hoje reaparecer como disponivel pela negociacao de ontem. Entram <code>1 Ativo</code> (evento aberto) e a sobra de evento encerrado: <code>11 Sem Ofertas</code>, <code>14 Vendedor Rejeitou</code>, <code>15 Comprador Rejeitou</code>, <code>18 Venda Cancelada</code>. Ficam fora <code>9</code> e <code>13</code> (ha oferta viva na mesa), a venda (<code>2</code>, <code>3</code>, <code>7</code>) e o que foi suspenso ou cancelado (<code>8</code>, <code>10</code>).</p>',
  '<h2 style="margin-top:10px">A regra de elegibilidade</h2>',""",
    "caixa explica a base de veiculos")

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
for r in feito:
    print("  ok  " + r)
