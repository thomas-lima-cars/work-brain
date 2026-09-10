/* ══════════════════════════════════════════════════════════════════════
   NÓ "Montar Fase 2" — coleta dimensionada

   Lê da fase 1 quantos veículos e quantas lojas existem, e monta
   exatamente ceil(n / 50) páginas para cada conjunto. Nada de teto
   chutado: página que sobra custa um agregado completo e devolve zero.

   Dois conjuntos:

     A) os VEÍCULOS do evento — uma linha por negociação disponível, com
        valor (`value_actual`), modelo, categoria, ano, km e a loja
        vendedora com UF.

     B) o PERFIL DE COMPRA das lojas nos últimos 6 meses — as mesmas 5
        queries do relatório `LZL3mxfbMIz4avyx`, já provadas em produção
        (execução 49803, 1.300 lojas). Sem função de janela: a última
        oferta sai de MAX(offers.id) e o topo das modas de INNER JOIN no
        MAX(n), porque o validador do MCP rejeita `OVER (`.
   ══════════════════════════════════════════════════════════════════════ */

const cab = $('Montar Fase 1').all()[0].json;
const META_IN = cab.meta;
const PAGE = META_IN.page;
const LADO = META_IN.lado;
const DATA_INI = META_IN.data_ini;
const SELECAO = META_IN.selecao;
const DISPONIVEL = META_IN.disponivel;
/* o relogio da fase 1, em hora de Brasilia. Precisa atravessar ate o
   Montar HTML pra ele saber qual evento ja encerrou -- este no reconstroi
   o META do zero, entao o que nao for repassado aqui chega undefined. */
const ULTIMA_NEG = META_IN.ultima_neg;
const AGORA_BR = META_IN.agora_br;
const JANELA_INI = META_IN.janela_ini;
const JANELA_FIM = META_IN.janela_fim;

/* ── lê os totais da fase 1 ─────────────────────────────────────────── */
const pedidos1 = $('Montar Fase 1').all().map((i) => i.json);
const outs1 = $('MCP Fase 1').all();
function leitura(nome) {
  for (let i = 0; i < pedidos1.length; i++) {
    if (pedidos1[i].queryName !== nome) continue;
    const o = outs1[i] ? outs1[i].json : null;
    const sc = o ? (o.structuredContent || o) : null;
    const cols = (sc && sc.columns) || [];
    const rows = (sc && sc.rows) || [];
    return rows.map((r) => {
      const obj = {};
      for (let c = 0; c < cols.length; c++) obj[cols[c]] = r[c];
      return obj;
    });
  }
  return [];
}

const eventos = leitura('q_eventos');
const vt = leitura('q_veic_total')[0] || {};
const lt = leitura('q_lojas_total')[0] || {};
const valor = leitura('q_valor')[0] || {};
const eventoWl = leitura('q_evento_wl');
/* a q_por_status roda na FASE 1, e o Montar HTML so enxerga os resultados
   da fase 2 -- entao ela precisa pegar carona no META, como eventos e
   evento_wl ja fazem. Sem isso o painel chega vazio e ninguem reclama. */
const porStatus = leitura('q_por_status');

const VEICULOS = vt.veiculos === undefined ? null : Number(vt.veiculos);
const LOJAS = lt.lojas === undefined ? null : Number(lt.lojas);

if (VEICULOS === null || LOJAS === null) {
  throw new Error('a fase 1 nao voltou completa — sem contagem nao da pra dimensionar. ' +
    'veiculos=' + VEICULOS + ' lojas=' + LOJAS);
}
if (VEICULOS === 0) {
  throw new Error('nenhum veiculo disponivel no recorte de eventos escolhido. ' +
    'Eventos encontrados: ' + eventos.length + '. Revise EVENTOS_IDS ou HORAS_ADIANTE na fase 1.');
}
if (LOJAS === 0) throw new Error('nenhuma loja com oferta na janela de historico');

const PAG_VEIC = Math.ceil(VEICULOS / PAGE);
const PAG_LOJAS = Math.ceil(LOJAS / PAGE);

const UF_CASE =
  "CASE WHEN UPPER(TRIM(sa.state)) IN ('SP','MG','PR','SC','RJ','GO','RS','BA','MT','DF','CE','MS','ES','PE','PA','SE','AM','MA','RN','PB','AL','PI','RO','TO','AP','AC','RR') THEN UPPER(TRIM(sa.state))" +
  " WHEN UPPER(TRIM(sa.state)) = 'S.P' THEN 'SP'" +
  " WHEN UPPER(TRIM(sa.state)) = 'RIO DE JANEIRO' THEN 'RJ'" +
  " WHEN UPPER(TRIM(sa.state)) = 'MATO GROSSO DO SUL' THEN 'MS'" +
  " WHEN UPPER(TRIM(sa.state)) LIKE 'ESPIRITO%SANTO%' THEN 'ES'" +
  " ELSE NULL END";

const JANELA =
  " o.deleted_at IS NULL AND o." + LADO + " IS NOT NULL" +
  " AND o.created_at >= '" + DATA_INI + "' AND o.price > 0";

const Q = [];
function push(nome, sql, pages) {
  for (let p = 0; p < pages; p++) {
    Q.push({
      queryName: nome,
      database: 'cars2you_production',
      sql: sql + ' LIMIT ' + PAGE + ' OFFSET ' + (p * PAGE),
      pagina: p
    });
  }
}

/* ── A) os veículos do evento ───────────────────────────────────────── */
push('q_veiculos',
  "SELECT an.id AS neg_id, e.id AS evento_id, e.name AS evento," +
  " DATE_FORMAT(e.finish_date_event, '%Y-%m-%d %H:%i') AS fim_evento," +
  " a.id AS anuncio_id, a.vehicle_id AS vehicle_id," +
  " ROUND(an.value_actual, 2) AS valor," +
  " ROUND(NULLIF(an.initial_price_reference, 0), 2) AS valor_inicial," +
  " ROUND(NULLIF(a.fipe_price, 0), 2) AS fipe," +
  " v.model_id AS model_id, mo.name AS modelo," +
  " v.category_id AS category_id, cat.name AS categoria," +
  " br.name AS marca, v.model_year AS model_year, NULLIF(v.km, 0) AS km," +
  " an.status AS neg_status," +
  " a.shop_id AS loja_id, s.name AS loja_vendedora," +
  " COALESCE(" + UF_CASE + ", 'Não identificada') AS uf" +
  " FROM " + ULTIMA_NEG +
  " INNER JOIN advertisement_negotiations an ON an.id = u.neg_id" +
  " INNER JOIN events e ON e.id = an.event_id" +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " INNER JOIN vehicles v ON v.id = u.vehicle_id AND v.deleted_at IS NULL" +
  " LEFT JOIN models mo ON mo.id = v.model_id" +
  " LEFT JOIN categories cat ON cat.id = v.category_id" +
  " LEFT JOIN brands br ON br.id = v.brand_id" +
  " LEFT JOIN shops s ON s.id = a.shop_id" +
  " LEFT JOIN shop_addresses sa ON sa.shop_id = a.shop_id AND sa.deleted_at IS NULL" +
  " WHERE" + DISPONIVEL +
  " GROUP BY neg_id, evento_id, evento, fim_evento, anuncio_id, vehicle_id," +
  " valor, valor_inicial, fipe, model_id, modelo, category_id, categoria," +
  " marca, model_year, km, neg_status, loja_id, loja_vendedora, uf" +
  " ORDER BY an.id", PAG_VEIC);

/* ── B) perfil de compra das lojas (mesmas queries do LZL3mxfbMIz4avyx) ── */
push('q_lojas',
  "SELECT s.id AS shop_id, MAX(s.name) AS loja," +
  " MAX(s.whitelabel_id) AS whitelabel_id, MAX(w.name) AS whitelabel," +
  " COALESCE(MAX(" + UF_CASE + "), 'Não identificada') AS uf" +
  " FROM shops s" +
  " LEFT JOIN whitelabels w ON w.id = s.whitelabel_id" +
  " LEFT JOIN shop_addresses sa ON sa.shop_id = s.id AND sa.deleted_at IS NULL" +
  " WHERE s.deleted_at IS NULL" +
  " AND EXISTS (SELECT 1 FROM offers o WHERE o." + LADO + " = s.id" +
  " AND o.deleted_at IS NULL AND o.created_at >= '" + DATA_INI + "' AND o.price > 0)" +
  " GROUP BY s.id ORDER BY s.id", PAG_LOJAS);

push('q_ofertas',
  "SELECT o." + LADO + " AS shop_id, COUNT(*) AS qt_ofertas" +
  " FROM offers o WHERE" + JANELA +
  " GROUP BY o." + LADO + " ORDER BY o." + LADO, PAG_LOJAS);

const ULTIMAS =
  "(SELECT o." + LADO + " AS shop_id, a.vehicle_id AS vehicle_id, MAX(o.id) AS offer_id" +
  " FROM offers o" +
  " INNER JOIN advertisements a ON a.id = o.advertisement_id AND a.deleted_at IS NULL" +
  " WHERE" + JANELA +
  " GROUP BY o." + LADO + ", a.vehicle_id) u";
const IDADE = "(YEAR(CURDATE()) - NULLIF(v.model_year, 0))";

push('q_perfil',
  "SELECT u.shop_id AS shop_id, COUNT(*) AS qt_veiculos," +
  " ROUND(AVG(ult.price), 2) AS preco_medio," +
  " ROUND(STDDEV_SAMP(ult.price), 2) AS preco_desvio," +
  " ROUND(AVG(" + IDADE + "), 2) AS idade_media," +
  " ROUND(STDDEV_SAMP(" + IDADE + "), 2) AS idade_desvio," +
  " ROUND(AVG(NULLIF(v.km, 0)), 0) AS km_medio," +
  " ROUND(STDDEV_SAMP(NULLIF(v.km, 0)), 0) AS km_desvio" +
  " FROM " + ULTIMAS +
  " INNER JOIN offers ult ON ult.id = u.offer_id" +
  " INNER JOIN vehicles v ON v.id = u.vehicle_id AND v.deleted_at IS NULL" +
  " GROUP BY u.shop_id ORDER BY u.shop_id", PAG_LOJAS);

function moda(nome, campo, tabela) {
  const AG =
    "(SELECT o." + LADO + " AS shop_id, v." + campo + " AS item_id, COUNT(*) AS n" +
    " FROM offers o" +
    " INNER JOIN advertisements a ON a.id = o.advertisement_id AND a.deleted_at IS NULL" +
    " INNER JOIN vehicles v ON v.id = a.vehicle_id AND v.deleted_at IS NULL" +
    " WHERE" + JANELA + " AND v." + campo + " IS NOT NULL" +
    " GROUP BY o." + LADO + ", v." + campo + ")";
  push(nome,
    "SELECT ag.shop_id AS shop_id, ag.item_id AS item_id, cat.name AS nome, ag.n AS n" +
    " FROM " + AG + " ag" +
    " INNER JOIN (SELECT t.shop_id AS shop_id, MAX(t.n) AS mx FROM " + AG + " t" +
    " GROUP BY t.shop_id) top ON top.shop_id = ag.shop_id AND ag.n = top.mx" +
    " LEFT JOIN " + tabela + " cat ON cat.id = ag.item_id" +
    " ORDER BY ag.shop_id, ag.item_id", PAG_LOJAS);
}
moda('q_modelo', 'model_id', 'models');
moda('q_categoria', 'category_id', 'categories');

/* ── guardas ────────────────────────────────────────────────────────── */
/* Sem regex de proposito. Este arquivo viaja ate o n8n como string JSON
   escapada, transcrita a mao, e barra invertida e onde este projeto erra:
   escapar uma vez a mais gera "Invalid regular expression" e derruba o run
   inteiro (aconteceu na execucao 49963). indexOf nao tem esse risco -- e
   por isso nem este comentario usa barra invertida. */
function temJanela(sql) {
  const u = String(sql).toUpperCase();
  return u.indexOf('OVER (') >= 0 || u.indexOf('OVER(') >= 0;
}
const comJanela = Q.filter((q) => temJanela(q.sql));
if (comJanela.length) {
  throw new Error('funcao de janela detectada (o MCP rejeita): ' + comJanela[0].queryName);
}
if (PAGE > 50) throw new Error('PAGE > 50: o MCP corta a resposta em 50 linhas');

const META = {
  selecao: SELECAO,
  ultima_neg: ULTIMA_NEG,
  status_ok: META_IN.status_ok,
  agora_br: AGORA_BR,
  janela_ini: JANELA_INI,
  janela_fim: JANELA_FIM,
  eventos: eventos,
  evento_wl: eventoWl,
  por_status: porStatus,
  meses_historico: META_IN.meses_historico,
  data_ini: DATA_INI,
  page: PAGE,
  lado: LADO,
  esperado_veiculos: VEICULOS,
  esperado_negociacoes: vt.negociacoes === undefined ? null : Number(vt.negociacoes),
  esperado_lojas: LOJAS,
  esperado_ofertas: lt.ofertas === undefined ? null : Number(lt.ofertas),
  pag_veic: PAG_VEIC,
  pag_lojas: PAG_LOJAS,
  cobertura_valor: valor,
  chamadas: Q.length + 4
};

return Q.map((q, i) => ({
  json: { queryName: q.queryName, database: q.database, sql: q.sql, pagina: q.pagina, idx: i, total: Q.length, meta: META }
}));
