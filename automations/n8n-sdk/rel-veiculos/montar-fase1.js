/* ══════════════════════════════════════════════════════════════════════
   NÓ "Montar Fase 1" — dimensiona antes de coletar

   Relatório de veículos em evento, com as lojas mais aderentes a cada um.

   ─── COMO ESCOLHER OS EVENTOS ─────────────────────────────────────────
   Duas formas, e só uma vale por vez:

     EVENTOS_IDS = [23860, 23861]   -> analisa exatamente esses
     EVENTOS_IDS = []               -> usa a regra das próximas N horas

   O padrão é a regra de 48h porque foi o recorte pedido em 2026-09-09.
   Para uma edição específica, é só preencher a lista.

   A janela vai da MEIA-NOITE DE HOJE EM BRASÍLIA até HORAS_ADIANTE à
   frente, então evento que já encerrou hoje continua na base
   (INCLUI_ENCERRADOS_HOJE). Pondo false, conta do instante atual pra frente.

   ⚠️ FUSO: o banco responde NOW() em UTC, mas grava as datas dos eventos em
   hora de Brasília — medido na sonda 49954. Por isso o recorte é calculado
   aqui e vai como literal; NÃO troque por NOW()/CURDATE(), que às 21h de
   Brasília já apontam para o dia seguinte e cortam o dia inteiro.

   ─── POR QUE UMA FASE SÓ PRA CONTAR ───────────────────────────────────
   O `OFFSET` faz o banco re-executar a query inteira a cada página, então
   página que sobra custa um agregado completo e devolve zero linha. Na
   execução 49803 isso queimou 170 chamadas. Contando antes, a fase 2
   monta exatamente ceil(n / 50) páginas.

   Limites do MCP já medidos (automations/n8n-sdk/README.md):
   sem função de janela, resposta cortada em 50 linhas, deadline de 60s.
   ══════════════════════════════════════════════════════════════════════ */

/* Os nove eventos que encerraram em 2026-09-09, medidos na sonda 49961.
   Recorte pedido pelo Thomas. Com a lista preenchida as datas nao valem:
   SELECAO vira `e.id IN (...)`, entao nao importa que dia e hoje.
   Para voltar ao recorte movel das proximas horas, esvazie a lista. */
const EVENTOS_IDS = [23882, 23890, 23891, 23892, 23860, 23884, 23887, 23888, 23889];
const HORAS_ADIANTE = 48;
const INCLUI_ENCERRADOS_HOJE = true;  /* pedido em 2026-09-09 - ver nota abaixo */
const MESES_HISTORICO = 6;   /* janela do perfil de compra das lojas */
const PAGE = 50;             /* teto duro do MCP. NÃO aumentar */
const LADO = 'buyer_shop_id';  /* a loja que DEU o lance */

/* ─── RELOGIO ────────────────────────────────────────────────────────────
   O banco responde NOW() em UTC (medido: sonda 49954, q_relogio devolveu
   2026-09-10 01:51 quando em Brasilia eram 22:51 do dia 9). Mas as datas
   dos eventos estao gravadas em hora de Brasilia. Entao NADA aqui pode
   usar NOW()/CURDATE() do banco pra recortar evento: o piso e o teto sao
   calculados aqui, em hora de Brasilia, e viajam como literal.

   O deslocamento e feito sobre o epoch e lido com getUTC*, entao o fuso do
   processo do n8n (tambem UTC) nao interfere. */
const FUSO_MIN = -180;               /* America/Sao_Paulo, sem horario de verao */
const pad = (n) => String(n).padStart(2, '0');
const now = new Date(Date.now() + FUSO_MIN * 60000);
const dataDe = (d) => d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
const horaDe = (d) => dataDe(d) + ' ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':00';

const AGORA_BR = horaDe(now);
const HOJE_BR = dataDe(now);
const ini = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - MESES_HISTORICO, now.getUTCDate()));
const DATA_INI = dataDe(ini);

/* piso = meia-noite de hoje em Brasilia, pra evento que ja encerrou hoje
   continuar na base; teto = agora + HORAS_ADIANTE, tambem em Brasilia */
const PISO = INCLUI_ENCERRADOS_HOJE ? (HOJE_BR + ' 00:00:00') : AGORA_BR;
const TETO = horaDe(new Date(now.getTime() + HORAS_ADIANTE * 3600000));

/* o filtro de evento, montado uma vez e reusado na fase 2.
   Erro que ja cometi: com o piso em NOW(), evento que fechou mais cedo no
   mesmo dia some, e eu respondi "nenhum evento finaliza hoje" quando nove
   ja tinham fechado. O piso agora e a meia-noite de hoje em Brasilia. */
/* Repare que NAO ha filtro de e.status aqui.
   Evento encerrado tem status 0 (medido na sonda 49961: os nove do dia
   09/09 estao todos assim). Exigir status 1 excluiria justamente o que o
   INCLUI_ENCERRADOS_HOJE quer trazer -- a janela abriria e nada entraria.

   Quem filtra de verdade e o status da ULTIMA negociacao de cada veiculo,
   la embaixo: evento cancelado deixa suas negociacoes em status 10, que
   nao esta na lista, entao o carro cai fora por si. Filtrar pelo evento
   seria redundante e, aqui, prejudicial. */
const SELECAO = EVENTOS_IDS.length
  ? " e.deleted_at IS NULL AND e.id IN (" + EVENTOS_IDS.join(',') + ")"
  : " e.deleted_at IS NULL" +
    (INCLUI_ENCERRADOS_HOJE ? "" : " AND e.status = 1") +
    " AND e.finish_date_event >= '" + PISO + "'" +
    " AND e.finish_date_event <= '" + TETO + "'";

/* ─── QUAL VEÍCULO CONTA ──────────────────────────────────────────────
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
  " GROUP BY a.vehicle_id) u";

const JANELA_OFERTAS =
  " o.deleted_at IS NULL AND o." + LADO + " IS NOT NULL" +
  " AND o.created_at >= '" + DATA_INI + "' AND o.price > 0";

const Q = [];
function push(nome, sql, pages) {
  const n = pages === undefined ? 1 : pages;
  for (let p = 0; p < n; p++) {
    Q.push({
      queryName: nome, database: 'cars2you_production',
      sql: sql + ' LIMIT ' + PAGE + ' OFFSET ' + (p * PAGE), pagina: p
    });
  }
}

/* quais eventos o recorte pegou */
push('q_eventos',
  "SELECT e.id AS evento_id, e.name AS evento, e.status AS ev_status," +
  " DATE_FORMAT(e.start_date_display, '%Y-%m-%d %H:%i') AS ini_display," +
  " DATE_FORMAT(e.finish_date_event, '%Y-%m-%d %H:%i') AS fim_evento" +
  " FROM events e WHERE" + SELECAO + " ORDER BY e.finish_date_event");

/* quantos veículos disponíveis — dimensiona a paginação da fase 2 */
push('q_veic_total',
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
  " GROUP BY an.status ORDER BY veiculos DESC");

/* quantas lojas têm histórico de oferta — dimensiona o perfil */
push('q_lojas_total',
  "SELECT COUNT(DISTINCT o." + LADO + ") AS lojas, COUNT(*) AS ofertas" +
  " FROM offers o WHERE" + JANELA_OFERTAS);

/* o value_actual está preenchido? O Thomas escolheu ele como preço do
   veículo; se vier nulo ou zero na maioria, o relatório nasce cego. */
push('q_valor',
  "SELECT COUNT(*) AS negociacoes," +
  " SUM(CASE WHEN an.value_actual IS NULL THEN 1 ELSE 0 END) AS sem_valor," +
  " SUM(CASE WHEN an.value_actual = 0 THEN 1 ELSE 0 END) AS valor_zero," +
  " ROUND(MIN(NULLIF(an.value_actual, 0)), 2) AS minimo," +
  " ROUND(AVG(NULLIF(an.value_actual, 0)), 2) AS media," +
  " ROUND(MAX(an.value_actual), 2) AS maximo," +
  " ROUND(AVG(NULLIF(an.initial_price_reference, 0)), 2) AS media_inicial," +
  " ROUND(AVG(NULLIF(a.fipe_price, 0)), 2) AS media_fipe" +
  " FROM " + ULTIMA_NEG +
  " INNER JOIN advertisement_negotiations an ON an.id = u.neg_id" +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " WHERE" + DISPONIVEL);

/* quais whitelabels cada evento alveja.
   É a regra de elegibilidade: um veículo só pode casar com loja do MESMO
   whitelabel do evento dele E da mesma UF. Um evento pode alvejar vários
   whitelabels via event_whitelabels, então isto é 1:N, não 1:1. */
push('q_evento_wl',
  "SELECT ew.event_id AS evento_id, ew.whitelabel_id AS whitelabel_id," +
  " w.name AS whitelabel" +
  " FROM event_whitelabels ew" +
  " INNER JOIN events e ON e.id = ew.event_id AND" + SELECAO +
  " LEFT JOIN whitelabels w ON w.id = ew.whitelabel_id" +
  " ORDER BY ew.event_id, ew.whitelabel_id", 4);

if (PAGE > 50) throw new Error('PAGE > 50: o MCP corta a resposta em 50 linhas');

const META = {
  selecao: SELECAO,
  ultima_neg: ULTIMA_NEG,
  status_ok: STATUS_OK,
  agora_br: AGORA_BR,
  janela_ini: PISO,
  janela_fim: TETO,
  disponivel: DISPONIVEL,
  eventos_ids: EVENTOS_IDS,
  horas_adiante: EVENTOS_IDS.length ? null : HORAS_ADIANTE,
  meses_historico: MESES_HISTORICO,
  data_ini: DATA_INI,
  page: PAGE,
  lado: LADO
};

return Q.map((q, i) => ({
  json: { queryName: q.queryName, database: q.database, sql: q.sql, pagina: q.pagina, idx: i, total: Q.length, meta: META }
}));
