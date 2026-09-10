/* ══════════════════════════════════════════════════════════════════════
   NÓ "Montar Queries" — fase 2 de 2
   Este nó só monta SQL; quem executa é o "MCP Exec".

   Recebe do "MCP Totais" o número real de lojas e monta EXATAMENTE
   ceil(lojas / 50) páginas por query. Nada de teto chutado.

   ─── LIÇÕES QUE ESTE CÓDIGO CARREGA ───────────────────────────────────

   [49799] O MCP **não aceita função de janela.** `ROW_NUMBER() OVER (...)`
     volta "syntax error", com a posição caindo em cima do `PARTITION BY`.
     Aqui: a última oferta de cada veículo sai de `MAX(offers.id)` (id é
     auto-increment, então o maior do grupo é o mais recente), e o topo
     das modas sai de `INNER JOIN` no `MAX(n)`.

   [49799] O MCP **corta toda resposta em 50 linhas** e marca
     `truncated:true`. Paginar de 1.000 em 1.000 pula 950 por página, em
     silêncio. **PAGE tem que ser 50.**

   [49803] O `OFFSET` faz o banco **re-executar a query inteira a cada
     página**. Página que sobra custa um agregado completo e devolve zero
     linha. Por isso a fase 1 existe: dimensionar em vez de chutar.

   Só uso construção que a 49799 provou que passa: GROUP BY, INNER/LEFT
   JOIN, subselect no FROM, EXISTS, CASE, COALESCE, MAX, COUNT, AVG,
   STDDEV_SAMP, ROUND, NULLIF.

   UF_CASE é cópia verbatim da SONDA 7TCmS8JFacDTmySQ.
   ══════════════════════════════════════════════════════════════════════ */

const cab = $('Montar Totais').all()[0].json;
const META_IN = cab.meta;
const MESES = META_IN.meses;
const PAGE = META_IN.page;
const LADO = META_IN.lado;
const DATA_INI = META_IN.data_ini;

/* ── lê o resultado da fase 1 ───────────────────────────────────────── */
const rt = $('MCP Totais').all()[0].json;
const sct = rt.structuredContent || rt;
const cols = sct.columns || [];
const row = (sct.rows || [])[0] || [];
const tot = {};
for (let i = 0; i < cols.length; i++) tot[cols[i]] = row[i];

const ESPERADO_LOJAS = tot.lojas === undefined ? null : Number(tot.lojas);
const ESPERADO_OFERTAS = tot.ofertas === undefined ? null : Number(tot.ofertas);

if (ESPERADO_LOJAS === null) {
  throw new Error('q_totais nao voltou — sem ela nao da pra dimensionar a paginacao. ' +
    'Resposta do MCP Totais: ' + JSON.stringify(rt).slice(0, 300));
}
if (ESPERADO_LOJAS === 0) throw new Error('nenhuma loja com oferta na janela');

/* páginas exatas. O +0 é de propósito: sem página de folga, porque a
   completude quem confere é o gabarito, não página vazia. */
const PAGES = Math.ceil(ESPERADO_LOJAS / PAGE);

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
function push(nome, sql) {
  for (let p = 0; p < PAGES; p++) {
    Q.push({
      queryName: nome,
      database: 'cars2you_production',
      sql: sql + ' LIMIT ' + PAGE + ' OFFSET ' + (p * PAGE),
      pagina: p
    });
  }
}

/* ── 1. dimensões da loja ───────────────────────────────────────────── */
push('q_lojas',
  "SELECT s.id AS shop_id, MAX(s.name) AS loja," +
  " MAX(s.whitelabel_id) AS whitelabel_id, MAX(w.name) AS whitelabel," +
  " COALESCE(MAX(" + UF_CASE + "), 'Não identificada') AS uf," +
  " COUNT(DISTINCT sa.id) AS qt_enderecos" +
  " FROM shops s" +
  " LEFT JOIN whitelabels w ON w.id = s.whitelabel_id" +
  " LEFT JOIN shop_addresses sa ON sa.shop_id = s.id AND sa.deleted_at IS NULL" +
  " WHERE s.deleted_at IS NULL" +
  " AND EXISTS (SELECT 1 FROM offers o WHERE o." + LADO + " = s.id" +
  " AND o.deleted_at IS NULL AND o.created_at >= '" + DATA_INI + "' AND o.price > 0)" +
  " GROUP BY s.id ORDER BY s.id");

/* ── 2. total de ofertas por loja (denominador dos percentuais) ─────── */
push('q_ofertas',
  "SELECT o." + LADO + " AS shop_id, COUNT(*) AS qt_ofertas," +
  " COUNT(DISTINCT o.advertisement_id) AS qt_anuncios" +
  " FROM offers o WHERE" + JANELA +
  " GROUP BY o." + LADO + " ORDER BY o." + LADO);

/* ── 3. perfil: a última oferta de cada veículo ─────────────────────── */
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
  " GROUP BY u.shop_id ORDER BY u.shop_id");

/* ── 4 e 5. moda de modelo e de categoria ───────────────────────────── */
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
    " ORDER BY ag.shop_id, ag.item_id");
}
moda('q_modelo', 'model_id', 'models');
moda('q_categoria', 'category_id', 'categories');

/* ── guardas ────────────────────────────────────────────────────────── */
if (Q.length === 0) throw new Error('nenhuma query montada');
const comJanela = Q.filter((q) => /OVER\s*\(/i.test(q.sql));
if (comJanela.length) {
  throw new Error('funcao de janela detectada (o MCP rejeita): ' + comJanela[0].queryName);
}
if (PAGE > 50) throw new Error('PAGE > 50: o MCP corta a resposta em 50 linhas');

const META = {
  data_ini: DATA_INI,
  meses: MESES,
  page: PAGE,
  pages: PAGES,
  lado: LADO,
  esperado_lojas: ESPERADO_LOJAS,
  esperado_ofertas: ESPERADO_OFERTAS,
  chamadas: Q.length + 1   /* +1 = a chamada da fase 1 */
};

return Q.map((q, i) => ({
  json: {
    queryName: q.queryName,
    database: q.database,
    sql: q.sql,
    pagina: q.pagina,
    idx: i,
    total: Q.length,
    meta: META
  }
}));
