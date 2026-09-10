/* ══════════════════════════════════════════════════════════════════════
   NÓ "Montar Fase 1" — dimensiona antes de coletar

   Relatório de veículos em evento, com as lojas mais aderentes a cada um.

   ─── COMO ESCOLHER OS EVENTOS ─────────────────────────────────────────
   Duas formas, e só uma vale por vez:

     EVENTOS_IDS = [23860, 23861]   -> analisa exatamente esses
     EVENTOS_IDS = []               -> usa a regra das próximas N horas

   O padrão é a regra de 48h porque foi o recorte pedido em 2026-09-09.
   Para uma edição específica, é só preencher a lista.

   ─── POR QUE UMA FASE SÓ PRA CONTAR ───────────────────────────────────
   O `OFFSET` faz o banco re-executar a query inteira a cada página, então
   página que sobra custa um agregado completo e devolve zero linha. Na
   execução 49803 isso queimou 170 chamadas. Contando antes, a fase 2
   monta exatamente ceil(n / 50) páginas.

   Limites do MCP já medidos (automations/n8n-sdk/README.md):
   sem função de janela, resposta cortada em 50 linhas, deadline de 60s.
   ══════════════════════════════════════════════════════════════════════ */

const EVENTOS_IDS = [];      /* vazio = usa a regra de horas abaixo */
const HORAS_ADIANTE = 48;
const MESES_HISTORICO = 6;   /* janela do perfil de compra das lojas */
const PAGE = 50;             /* teto duro do MCP. NÃO aumentar */
const LADO = 'buyer_shop_id';  /* a loja que DEU o lance */

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const ini = new Date(now.getFullYear(), now.getMonth() - MESES_HISTORICO, now.getDate());
const DATA_INI = ini.getFullYear() + '-' + pad(ini.getMonth() + 1) + '-' + pad(ini.getDate());

/* o filtro de evento, montado uma vez e reusado na fase 2 */
const SELECAO = EVENTOS_IDS.length
  ? " e.deleted_at IS NULL AND e.id IN (" + EVENTOS_IDS.join(',') + ")"
  : " e.deleted_at IS NULL AND e.status = 1" +
    " AND e.finish_date_event >= NOW()" +
    " AND e.finish_date_event <= DATE_ADD(NOW(), INTERVAL " + HORAS_ADIANTE + " HOUR)";

/* negociação disponível. status 1 = em aberto; 2, 3 e 7 = vendido.
   Medido na sonda a6fNNTUYYayehNIn, execução 49813 — não é suposição. */
const DISPONIVEL = " an.deleted_at IS NULL AND an.status = 1";

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
  "SELECT COUNT(DISTINCT a.vehicle_id) AS veiculos," +
  " COUNT(DISTINCT an.id) AS negociacoes," +
  " COUNT(DISTINCT e.id) AS eventos" +
  " FROM advertisement_negotiations an" +
  " INNER JOIN events e ON e.id = an.event_id AND" + SELECAO +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " INNER JOIN vehicles v ON v.id = a.vehicle_id AND v.deleted_at IS NULL" +
  " WHERE" + DISPONIVEL);

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
  " FROM advertisement_negotiations an" +
  " INNER JOIN events e ON e.id = an.event_id AND" + SELECAO +
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
