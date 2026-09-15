/* ═══════════════════════════════════════════════════════════════════════════
   ESTUDO DE PRECIFICAÇÃO — SONDA 2: a definição de venda, corrigida

   Correção do Thomas em 2026-09-14, depois da sonda 1 (execução 51069):

     "Vendas são todos os veículos cujo último status na
      advertisement_negotiations são 2, 3, 7, olhando sempre para a última
      linha válida (deleted_at = null)"

   A sonda 1 contava TODA negociação com status 2/3/7. Não é o mesmo: um
   veículo vendido (7) e depois cancelado (18) contava como venda. A sonda 1
   mediu o tamanho disso sem querer — 2.086 negociações em status 18, das
   quais 2.073 com `offer_actual_id` preenchido.

   ── O QUE MUDA ────────────────────────────────────────────────────────────
   Agora a unidade é o VEÍCULO, não a negociação. Para cada veículo, acha-se a
   última linha válida de `advertisement_negotiations` e olha-se o status DELA.

   O MCP rejeita função de janela (medido na 49799), então o último-do-grupo
   sai por `MAX(an.id)` + INNER JOIN, que é o padrão registrado no README.

   ⚠️ "Última" por `MAX(id)` e não por data, de propósito: `finish_date_offer`
   tem data podre — a sonda 1 achou mínimo `1969-12-31` e máximo `2030-12-31`.
   Ordenar por uma coluna com lixo escolheria a linha errada. `id` é
   monotônico e não mente.

   ⚠️ O filtro `deleted_at IS NULL` entra DENTRO da subquery que acha o
   máximo. Se entrasse só do lado de fora, o MAX poderia cair numa linha
   deletada e o veículo sumiria em silêncio.

   ⚠️ NÃO filtro `advertisements.deleted_at` dentro da subquery: isso mudaria
   QUAL linha é a última. O anúncio entra ali só para chegar ao vehicle_id.

   ── A OUTRA CORREÇÃO: a janela de data tinha só um lado ────────────────────
   A sonda 1 usava `>= data_ini` e nada mais, então as linhas com
   `finish_date_offer` em 2030 entravam na janela de 12 meses. Agora os dois
   limites são literais.

   ── O QUE CADA QUERY DECIDE ───────────────────────────────────────────────
     q_ultimo_status  distribuição de status da ÚLTIMA linha por veículo. É o
                      retrato do funil inteiro e o denominador honesto.
     q_ano_venda      quanto de lixo de data existe nas vendas.
     q_sizing         gabarito com a definição corrigida.
     q_delta          quantos veículos a definição antiga inflava.
     q_codigo_faixa   quantos códigos FIPE têm n suficiente.
     q_razao_faixa    forma da distribuição da razão, para o corte de outlier.
     q_top_codigo     os 50 códigos mais vendidos.

   ⚠️ NUNCA `SELECT *` em `vehicles`: placa e chassi moram lá.
   ═══════════════════════════════════════════════════════════════════════════ */

const PAGE = 50;
const MESES = 12;
const N_MINIMO = 10;

const pad = (n) => String(n).padStart(2, '0');
const agora = new Date(Date.now() - 180 * 60000);   /* Brasília */
const ini = new Date(agora.getFullYear(), agora.getMonth() - MESES, agora.getDate());
const DATA_INI = ini.getFullYear() + '-' + pad(ini.getMonth() + 1) + '-' + pad(ini.getDate());
const HOJE = agora.getFullYear() + '-' + pad(agora.getMonth() + 1) + '-' + pad(agora.getDate());

/* os dois limites, sempre. Um lado só deixou 2030 entrar na sonda 1. */
const JANELA =
  " AND an.finish_date_offer >= '" + DATA_INI + " 00:00:00'" +
  " AND an.finish_date_offer <= '" + HOJE + " 23:59:59'";

const VENDA = 'an.status IN (2, 3, 7)';

/* ── a última linha válida de cada veículo ────────────────────────────────
   Padrão registrado no README: último-do-grupo por MAX(id) + INNER JOIN,
   porque o MCP rejeita ROW_NUMBER() OVER (PARTITION BY ...). */
const ULTIMA =
  ' INNER JOIN (SELECT a2.vehicle_id AS vid, MAX(an2.id) AS ult' +
  ' FROM advertisement_negotiations an2' +
  ' INNER JOIN advertisements a2 ON a2.id = an2.advertisement_id' +
  ' WHERE an2.deleted_at IS NULL' +
  ' GROUP BY a2.vehicle_id) u ON u.ult = an.id';

/* caminho completo: última negociação -> oferta vencedora -> anúncio ->
   veículo -> versão. Tudo por PK depois do INNER JOIN da última. */
const CAMINHO =
  ' FROM advertisement_negotiations an' +
  ULTIMA +
  ' LEFT JOIN offers o ON o.id = an.offer_actual_id AND o.deleted_at IS NULL' +
  ' INNER JOIN advertisements a ON a.id = an.advertisement_id' +
  ' INNER JOIN vehicles v ON v.id = a.vehicle_id' +
  ' LEFT JOIN versions ver ON ver.id = v.version_id';

const UTIL =
  " AND o.price > 0 AND a.fipe_price > 0 AND TRIM(COALESCE(ver.code_fipe, '')) <> ''";
const RAZAO = '(o.price / a.fipe_price)';

const Q = [];
function push(nome, sql, pages) {
  for (let p = 0; p < (pages || 1); p++) {
    Q.push({
      queryName: nome, database: 'cars2you_production',
      sql: sql + ' LIMIT ' + PAGE + ' OFFSET ' + (p * PAGE), pagina: p
    });
  }
}

/* ── 1. o funil inteiro: em que status cada veículo PAROU ─────────────────
   Sem janela de data, porque aqui a pergunta é o retrato do estoque
   histórico, não da safra. É o denominador honesto do estudo. */
push('q_ultimo_status',
  'SELECT an.status AS status, COUNT(*) AS veiculos,' +
  ' COUNT(CASE WHEN an.offer_actual_id IS NOT NULL THEN 1 END) AS com_oferta_vencedora' +
  ' FROM advertisement_negotiations an' + ULTIMA +
  ' GROUP BY an.status ORDER BY veiculos DESC');

/* ── 2. quanto de lixo de data existe nas vendas ──────────────────────── */
push('q_ano_venda',
  'SELECT YEAR(an.finish_date_offer) AS ano, COUNT(*) AS veiculos' +
  ' FROM advertisement_negotiations an' + ULTIMA +
  ' WHERE ' + VENDA +
  ' GROUP BY ano ORDER BY ano');

/* ── 3. o gabarito, com a definição corrigida ─────────────────────────────
   Cada coluna é um degrau de perda entre "venda" e "linha utilizável". */
push('q_sizing',
  'SELECT COUNT(*) AS veiculos_vendidos,' +
  ' COUNT(CASE WHEN an.offer_actual_id IS NOT NULL THEN 1 END) AS com_oferta_vencedora,' +
  ' COUNT(CASE WHEN o.price > 0 THEN 1 END) AS com_preco_venda,' +
  ' COUNT(CASE WHEN a.fipe_price > 0 THEN 1 END) AS com_fipe_anuncio,' +
  " COUNT(CASE WHEN TRIM(COALESCE(ver.code_fipe, '')) <> '' THEN 1 END) AS com_code_fipe," +
  " COUNT(CASE WHEN o.price > 0 AND a.fipe_price > 0" +
  "  AND TRIM(COALESCE(ver.code_fipe, '')) <> '' THEN 1 END) AS utilizaveis," +
  ' COUNT(DISTINCT ver.code_fipe) AS codigos_distintos' +
  CAMINHO +
  ' WHERE ' + VENDA + JANELA);

/* ── 4. quanto a definição antiga inflava ─────────────────────────────────
   Veículos que TIVERAM alguma negociação 2/3/7 em algum momento, contra os
   que TERMINARAM em 2/3/7 (q_sizing). A diferença são as vendas que caíram. */
push('q_delta',
  'SELECT COUNT(DISTINCT a.vehicle_id) AS veiculos_com_alguma_venda' +
  ' FROM advertisement_negotiations an' +
  ' INNER JOIN advertisements a ON a.id = an.advertisement_id' +
  ' WHERE ' + VENDA + ' AND an.deleted_at IS NULL' + JANELA);

/* ── 5. quantos códigos FIPE têm amostra de verdade ───────────────────── */
push('q_codigo_faixa',
  'SELECT CASE WHEN vendas >= 200 THEN 1 WHEN vendas >= 100 THEN 2' +
  ' WHEN vendas >= 50 THEN 3 WHEN vendas >= 30 THEN 4' +
  ' WHEN vendas >= 10 THEN 5 WHEN vendas >= 3 THEN 6 ELSE 7 END AS faixa,' +
  ' COUNT(*) AS codigos, SUM(vendas) AS vendas, MIN(vendas) AS piso, MAX(vendas) AS teto' +
  ' FROM (SELECT ver.code_fipe AS cf, COUNT(*) AS vendas' +
  CAMINHO + ' WHERE ' + VENDA + JANELA + UTIL +
  ' GROUP BY ver.code_fipe) x' +
  ' GROUP BY faixa ORDER BY faixa');

/* ── 6. a forma da distribuição, para o corte de outlier sair de número ── */
push('q_razao_faixa',
  'SELECT CASE WHEN r < 0.2 THEN 1 WHEN r < 0.4 THEN 2 WHEN r < 0.6 THEN 3' +
  ' WHEN r < 0.7 THEN 4 WHEN r < 0.8 THEN 5 WHEN r < 0.9 THEN 6' +
  ' WHEN r < 1.0 THEN 7 WHEN r < 1.2 THEN 8 WHEN r < 1.5 THEN 9 ELSE 10 END AS faixa,' +
  ' COUNT(*) AS vendas, ROUND(MIN(r), 4) AS piso, ROUND(MAX(r), 4) AS teto' +
  ' FROM (SELECT ' + RAZAO + ' AS r' +
  CAMINHO + ' WHERE ' + VENDA + JANELA + UTIL + ') x' +
  ' GROUP BY faixa ORDER BY faixa');

/* ── 7. os 50 códigos mais vendidos ───────────────────────────────────────
   O desvio vem junto de propósito: 300 vendas com desvio enorme dá MENOS
   confiança que 80 com desvio pequeno. Volume sozinho não é confiança. */
push('q_top_codigo',
  'SELECT ver.code_fipe AS code_fipe,' +
  ' MAX(b.name) AS marca, MAX(m.name) AS modelo, MAX(ver.name) AS versao,' +
  ' COUNT(*) AS vendas,' +
  ' COUNT(DISTINCT o.buyer_shop_id) AS lojas_compradoras,' +
  ' COUNT(DISTINCT v.model_year) AS anos_modelo,' +
  ' ROUND(AVG(' + RAZAO + '), 4) AS razao_media,' +
  ' ROUND(STDDEV_SAMP(' + RAZAO + '), 4) AS razao_dp,' +
  ' ROUND(MIN(' + RAZAO + '), 4) AS razao_min,' +
  ' ROUND(MAX(' + RAZAO + '), 4) AS razao_max,' +
  ' ROUND(AVG(a.fipe_price), 2) AS fipe_media' +
  CAMINHO +
  ' LEFT JOIN brands b ON b.id = v.brand_id' +
  ' LEFT JOIN models m ON m.id = v.model_id' +
  ' WHERE ' + VENDA + JANELA + UTIL +
  ' GROUP BY ver.code_fipe HAVING COUNT(*) >= ' + N_MINIMO +
  ' ORDER BY vendas DESC');

/* ── guardas: os limites do MCP, medidos na 49799 ─────────────────────── */
const comJanela = Q.filter((q) => q.sql.indexOf('OVER (') >= 0 || q.sql.indexOf('OVER(') >= 0);
if (comJanela.length) throw new Error('funcao de janela: o MCP rejeita — ' + comJanela[0].queryName);
if (PAGE > 50) throw new Error('PAGE > 50: o MCP corta em 50 linhas');

const mal = Q.filter((q) =>
  q.sql.indexOf(',,') >= 0 || q.sql.indexOf('( )') >= 0 || q.sql.indexOf(',)') >= 0);
if (mal.length) throw new Error('SQL malformada em: ' + mal.map((q) => q.queryName).join(', '));

const PII = ['plate', 'chassi', 'renavam', 'cpf', 'cnpj', 'full_name', 'u.email'];
const vaza = Q.filter((q) => PII.some((p) => q.sql.indexOf(p) >= 0));
if (vaza.length) throw new Error('PII na sonda: ' + vaza.map((q) => q.queryName).join(', '));

/* toda query que mede venda tem de usar a ÚLTIMA linha. q_delta é a única
   exceção, e é proposital: ela existe justamente para medir a diferença. */
const semUltima = Q.filter((q) => q.queryName !== 'q_delta' && q.sql.indexOf('MAX(an2.id)') < 0);
if (semUltima.length) {
  throw new Error('query sem o recorte da ultima negociacao: ' +
    semUltima.map((q) => q.queryName).join(', '));
}

return Q.map((q, i) => ({
  json: {
    queryName: q.queryName, database: q.database, sql: q.sql,
    pagina: q.pagina, idx: i, total: Q.length, page: PAGE,
    meta: {
      estudo: 'precificacao-02', data_ini: DATA_INI, hoje: HOJE,
      meses: MESES, n_minimo: N_MINIMO,
      venda: 'ultima negociacao valida do veiculo com status IN (2,3,7)',
      ultima: 'MAX(an.id) por vehicle_id, entre as nao deletadas',
      valor_venda: 'offers.price via an.offer_actual_id',
      fipe: 'advertisements.fipe_price'
    }
  }
}));
