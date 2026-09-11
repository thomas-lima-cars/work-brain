# -*- coding: utf-8 -*-
r"""Restringe a base a seis whitelabels (pedido do Thomas em 2026-09-11).

   4  Trucks2you
   7  Marketplace Cars2You
  43  Canal de vendas C6 Auto
  48  Colaboradores C6
  62  Lance Facil BTB
  65  Lance Facil BTB Associados

POR QUE POR ID E NAO POR NOME: renomear um canal no banco quebraria um
filtro por nome em silencio, e o relatorio sairia menor sem avisar. Mas id
tambem erra -- 48 e 65 vieram da documentacao do brain, que avisa que seus
numeros sao inferidos, e nenhum dos dois aparece na janela atual, entao nao
deu pra conferir pelo dado. Por isso entra a `q_wl_nomes`: o no declara o
nome que ESPERA para cada id e o Montar HTML confere contra o banco. Id
trocado vira falha declarada, nao base silenciosamente menor.

O filtro vale em QUATRO lugares, e faltar um quebra invariante:

  1. SELECAO      -- so entra evento que alveja pelo menos um dos seis
  2. q_evento_wl  -- o veiculo so carrega os canais permitidos, senao ele
                     seria elegivel por um canal que nao esta mais na base
  3. q_evwl_total -- o gabarito tem que contar a mesma coisa que a consulta,
                     ou a conferencia de completude acusa falso positivo
  4. q_lojas_total + q_lojas -- as lojas tambem se restringem aos seis. E os
                     dois precisam do MESMO filtro: um dimensiona a
                     paginacao do outro, e divergir gera pagina vazia (que
                     custa um agregado inteiro) ou coleta incompleta.

Efeito colateral previsto: saem Banco GM, Evento Especial LM, VWFS,
Colaboradores Bemol, Apeop, Clube FMP e Omni. Como os cinco ultimos eram
justamente os canais de pessoa fisica sem loja compradora, o grupo "canal
sem loja" deve encolher muito ou zerar -- a separacao das tres causas
continua valendo, mas deixa de ser o numero grande.

    python _so_seis_whitelabels.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
AQUI = os.path.dirname(os.path.abspath(__file__))


def patch(nome, pares):
    P = os.path.join(AQUI, nome)
    s = io.open(P, encoding="utf-8").read()
    orig = s
    for velho, novo, rot in pares:
        if velho not in s:
            raise SystemExit("NAO ENCONTRADO em " + nome + ": " + rot)
        s = s.replace(velho, novo, 1)
        print("  ok  " + nome + ": " + rot)
    io.open(P, "w", encoding="utf-8").write(s)
    print("  -> " + nome + " mudou: " + str(s != orig))


# ── FASE 1 ────────────────────────────────────────────────────────────────
patch("montar-fase1.js", [
    (
"""const INCLUI_ENCERRADOS_HOJE = true;  /* pedido em 2026-09-09 - ver nota abaixo */""",
"""const INCLUI_ENCERRADOS_HOJE = true;  /* pedido em 2026-09-09 - ver nota abaixo */

/* ─── OS CANAIS QUE CONTAM (pedido de 2026-09-11) ──────────────────────
   Só estes seis whitelabels entram na base — evento que não alveja nenhum
   deles fica fora, e loja de outro canal sai do universo.

   Por ID, não por nome: renomear um canal no banco quebraria um filtro por
   nome em silêncio. Mas o id também pode estar errado — 48 e 65 vieram da
   documentação do brain, que avisa que são inferidos. Por isso o nome
   esperado viaja junto e a `q_wl_nomes` confere contra o banco: id trocado
   vira falha declarada, não base menor sem aviso.

   Lista vazia = sem restrição de canal. */
const WHITELABELS = [4, 7, 43, 48, 62, 65];
const WL_ESPERADO = {
  4: 'Trucks2you',
  7: 'Marketplace Cars2You',
  43: 'Canal de vendas C6 Auto',
  48: 'Colaboradores C6',
  62: 'Lance Fácil BTB',
  65: 'Lance Fácil BTB Associados'
};
const WL_IN = WHITELABELS.join(',');
/* o evento precisa alvejar pelo menos um dos seis */
const SO_WL_EVENTO = WHITELABELS.length
  ? " AND EXISTS (SELECT 1 FROM event_whitelabels ew2" +
    " WHERE ew2.event_id = e.id AND ew2.whitelabel_id IN (" + WL_IN + "))"
  : "";
/* e a loja compradora precisa pertencer a um deles */
const SO_WL_LOJA = WHITELABELS.length
  ? " AND s.whitelabel_id IN (" + WL_IN + ")"
  : "";
/* usado nas duas consultas de event_whitelabels, que precisam contar a
   mesma coisa uma que a outra */
const SO_WL_EW = WHITELABELS.length
  ? " AND ew.whitelabel_id IN (" + WL_IN + ")"
  : "";""",
        "constantes WHITELABELS / WL_ESPERADO / os tres filtros"),
    (
"""const SELECAO = EVENTOS_IDS.length
  ? " e.deleted_at IS NULL AND e.id IN (" + EVENTOS_IDS.join(',') + ")"
  : " e.deleted_at IS NULL" +
    (INCLUI_ENCERRADOS_HOJE ? "" : " AND e.status = 1") +
    " AND e.finish_date_event >= '" + PISO + "'" +
    (TETO ? " AND e.finish_date_event <= '" + TETO + "'" : "");""",
"""/* o recorte de canal vale nos DOIS modos: "manter na base somente estes
   whitelabels" e regra da base inteira, nao do modo de selecao. */
const SELECAO = (EVENTOS_IDS.length
  ? " e.deleted_at IS NULL AND e.id IN (" + EVENTOS_IDS.join(',') + ")"
  : " e.deleted_at IS NULL" +
    (INCLUI_ENCERRADOS_HOJE ? "" : " AND e.status = 1") +
    " AND e.finish_date_event >= '" + PISO + "'" +
    (TETO ? " AND e.finish_date_event <= '" + TETO + "'" : "")) + SO_WL_EVENTO;""",
        "SELECAO respeita os canais nos dois modos"),
    (
"""push('q_evwl_total',
  "SELECT COUNT(*) AS pares" +
  " FROM event_whitelabels ew" +
  " INNER JOIN events e ON e.id = ew.event_id AND" + SELECAO);""",
"""push('q_evwl_total',
  "SELECT COUNT(*) AS pares" +
  " FROM event_whitelabels ew" +
  " INNER JOIN events e ON e.id = ew.event_id AND" + SELECAO +
  " WHERE 1 = 1" + SO_WL_EW);

/* o banco confirma que cada id e o canal que eu penso que e. Sem isto, um
   id errado (48 e 65 sao inferidos da doc) tiraria um canal inteiro da base
   e o relatorio sairia menor sem uma linha de aviso. */
push('q_wl_nomes',
  "SELECT w.id AS whitelabel_id, w.name AS whitelabel" +
  " FROM whitelabels w WHERE w.id IN (" + WL_IN + ") ORDER BY w.id");""",
        "q_evwl_total filtra por canal + q_wl_nomes"),
    (
"""push('q_lojas_total',
  "SELECT COUNT(DISTINCT o." + LADO + ") AS lojas, COUNT(*) AS ofertas" +
  " FROM offers o WHERE" + JANELA_OFERTAS);""",
"""/* o INNER JOIN em shops entra por causa do recorte de canal. Ele e o
   gabarito que dimensiona a q_lojas da fase 2 -- os dois PRECISAM ter o
   mesmo filtro, senao a paginacao sobra (pagina vazia custa um agregado
   inteiro) ou falta (coleta incompleta, que a completude acusa). */
push('q_lojas_total',
  "SELECT COUNT(DISTINCT o." + LADO + ") AS lojas, COUNT(*) AS ofertas" +
  " FROM offers o" +
  " INNER JOIN shops s ON s.id = o." + LADO + " AND s.deleted_at IS NULL" + SO_WL_LOJA +
  " WHERE" + JANELA_OFERTAS);""",
        "q_lojas_total restringe as lojas ao canal"),
    (
"""  " LEFT JOIN whitelabels w ON w.id = ew.whitelabel_id" +""",
"""  " LEFT JOIN whitelabels w ON w.id = ew.whitelabel_id" +
  " WHERE 1 = 1" + SO_WL_EW +""",
        "q_evento_wl so devolve os canais permitidos"),
    (
"""  disponivel: DISPONIVEL,
  eventos_ids: EVENTOS_IDS,""",
"""  disponivel: DISPONIVEL,
  whitelabels: WHITELABELS,
  wl_esperado: WL_ESPERADO,
  so_wl_loja: SO_WL_LOJA,
  eventos_ids: EVENTOS_IDS,""",
        "META publica o recorte de canal"),
])

# ── FASE 2 ────────────────────────────────────────────────────────────────
patch("montar-fase2.js", [
    (
"""const JANELA_FIM = META_IN.janela_fim;""",
"""const JANELA_FIM = META_IN.janela_fim;
/* o mesmo filtro de canal que dimensionou a q_lojas_total na fase 1 */
const SO_WL_LOJA = META_IN.so_wl_loja || '';""",
        "le o filtro de canal do META"),
    (
"""  " LEFT JOIN shop_addresses sa ON sa.shop_id = s.id AND sa.deleted_at IS NULL" +
  " WHERE s.deleted_at IS NULL" +""",
"""  " LEFT JOIN shop_addresses sa ON sa.shop_id = s.id AND sa.deleted_at IS NULL" +
  " WHERE s.deleted_at IS NULL" + SO_WL_LOJA +""",
        "q_lojas restringe ao canal (mesmo filtro do gabarito)"),
    (
"""  eventos_ids: META_IN.eventos_ids,
  horas_adiante: META_IN.horas_adiante,""",
"""  eventos_ids: META_IN.eventos_ids,
  horas_adiante: META_IN.horas_adiante,
  whitelabels: META_IN.whitelabels,
  wl_esperado: META_IN.wl_esperado,
  wl_nomes_banco: leitura('q_wl_nomes'),""",
        "META repassa o recorte e o que o banco respondeu"),
])
