/* ═══════════════════════════════════════════════════════════════════════════
   ESTUDO DE PRECIFICAÇÃO — SONDA 1: dimensionar antes de coletar

   Pergunta do Thomas (2026-09-14): usando o código FIPE como base, achar os
   veículos mais vendidos (para ter índice de confiança) e descobrir quais
   campos mais interferem no deságio (venda / FIPE).

   Esta sonda NÃO responde a pergunta. Ela mede se a pergunta tem dado que a
   sustente, e quanto custa a coleta. São 7 chamadas. O erro que quero evitar
   é o da execução 48693: coletar 1.231 vezes e descobrir no fim que 74% era
   desperdício.

   ── AS TRÊS DEFINIÇÕES QUE PRECISAM ESTAR CERTAS ────────────────────────

   1. VENDA. `an.status IN (2, 3, 7)` — Vendido (7) mais os dois estados de
      liquidação (2 Aguardando Pagamento, 3 Aguardando Confirmação). NÃO entra
      18 (Venda Cancelada), que o `dominios.md` classifica como sobra.

   2. VALOR DA VENDA. `offers.price` da oferta vencedora, via
      `an.offer_actual_id`. NÃO é `MAX(offers.price)` e NÃO é `an.value_actual`
      — a doc do IGA registra que `value_actual` é "sujo, preenchido em lote
      não vendido", e que usar o maior lance como proxy diverge da venda real
      em R$ 157 mil num único evento de Pesados.
      ⚠️ `offer_actual_id` é a premissa mais frágil das três. `q_status_venda`
      existe só pra medir: se houver venda sem oferta vencedora preenchida,
      essas linhas somem do estudo e eu preciso saber o tamanho do buraco.

   3. FIPE. `advertisements.fipe_price` (85,6% preenchida, contemporânea da
      oferta) e não `vehicles.fipe_price` (63,8%). As duas divergem em 633
      ofertas — `q_fipe_fontes` mede a divergência dentro das vendas.

   ── O QUE CADA QUERY DECIDE ─────────────────────────────────────────────
     q_horizonte      até onde vai o histórico de vendas. Se for curto, "mais
                      vendidos" é sobre uma janela, não sobre sempre.
     q_sizing         quantas vendas sobrevivem às 3 definições. É o gabarito.
     q_status_venda   valida a premissa 2 — e mede o buraco se ela falhar.
     q_fipe_fontes    quanto as duas FIPEs divergem DENTRO das vendas.
     q_codigo_faixa   quantos códigos FIPE têm n suficiente. Define o corte de
                      confiança: n=3 não é amostra, n=50 é.
     q_razao_faixa    a distribuição bruta da razão, SEM corte. É onde o lixo
                      documentado (−1.586% a +94%) aparece e vira regra.
     q_top_codigo     os 50 códigos mais vendidos, com média e desvio.

   ⚠️ NUNCA `SELECT *` em `vehicles`: placa e chassi moram lá. Aqui só entram
   contagens, agregados e colunas nomeadas de catálogo.
   ═══════════════════════════════════════════════════════════════════════════ */

const PAGE = 50;
const MESES = 12;
const N_MINIMO = 10;          /* piso pra um código aparecer no top */

/* Data como literal, calculada fora do SQL. O banco responde em UTC e as datas
   de evento são de Brasília — comparar com NOW() erra por 3h. Numa janela de
   12 meses isso é irrelevante, mas a regra da casa é não misturar os dois, e
   um literal nunca vira bug silencioso quando a janela encurtar. */
const pad = (n) => String(n).padStart(2, '0');
const agora = new Date(Date.now() - 180 * 60000);
const ini = new Date(agora.getFullYear(), agora.getMonth() - MESES, agora.getDate());
const DATA_INI = ini.getFullYear() + '-' + pad(ini.getMonth() + 1) + '-' + pad(ini.getDate());
const HOJE = agora.getFullYear() + '-' + pad(agora.getMonth() + 1) + '-' + pad(agora.getDate());

/* ── os pedaços comuns, escritos uma vez ──────────────────────────────── */
const VENDA = 'an.status IN (2, 3, 7)';
const JANELA = " AND an.finish_date_offer >= '" + DATA_INI + " 00:00:00'";

/* o caminho negociação -> oferta vencedora -> anúncio -> veículo -> versão.
   offers e advertisements entram por PK (offer_actual_id e advertisement_id),
   então são busca indexada, não varredura. É o padrão PC: filtra pelo índice
   de status primeiro, depois resolve cada linha por chave. */
const CAMINHO =
  ' FROM advertisement_negotiations an' +
  ' LEFT JOIN offers o ON o.id = an.offer_actual_id AND o.deleted_at IS NULL' +
  ' INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL' +
  ' INNER JOIN vehicles v ON v.id = a.vehicle_id' +
  ' LEFT JOIN versions ver ON ver.id = v.version_id';

/* linha utilizável pelo estudo: tem preço de venda, tem FIPE e tem código */
const UTIL =
  " AND o.price > 0 AND a.fipe_price > 0 AND TRIM(COALESCE(ver.code_fipe, '')) <> ''";

const RAZAO = '(o.price / a.fipe_price)';

const Q = [];
function push(nome, sql, pages) {
  for (let p = 0; p < (pages || 1); p++) {
    Q.push({
      queryName: nome,
      database: 'cars2you_production',
      sql: sql + ' LIMIT ' + PAGE + ' OFFSET ' + (p * PAGE),
      pagina: p
    });
  }
}

/* ── 1. horizonte: o histórico de venda cobre quanto tempo? ────────────── */
push('q_horizonte',
  'SELECT COUNT(*) AS vendas,' +
  ' MIN(an.finish_date_offer) AS mais_antiga,' +
  ' MAX(an.finish_date_offer) AS mais_recente,' +
  ' COUNT(DISTINCT a.vehicle_id) AS veiculos' +
  ' FROM advertisement_negotiations an' +
  ' INNER JOIN advertisements a ON a.id = an.advertisement_id' +
  ' WHERE ' + VENDA + ' AND an.deleted_at IS NULL');

/* ── 2. o gabarito: quantas vendas sobrevivem às três definições ───────
   Cada coluna é um degrau de perda. Se "utilizaveis" for muito menor que
   "vendas", o estudo é sobre um subconjunto e isso tem de ser dito. */
push('q_sizing',
  'SELECT COUNT(*) AS vendas,' +
  ' COUNT(CASE WHEN an.offer_actual_id IS NOT NULL THEN 1 END) AS com_oferta_vencedora,' +
  ' COUNT(CASE WHEN o.price > 0 THEN 1 END) AS com_preco_venda,' +
  ' COUNT(CASE WHEN a.fipe_price > 0 THEN 1 END) AS com_fipe_anuncio,' +
  ' COUNT(CASE WHEN v.fipe_price > 0 THEN 1 END) AS com_fipe_veiculo,' +
  " COUNT(CASE WHEN TRIM(COALESCE(ver.code_fipe, '')) <> '' THEN 1 END) AS com_code_fipe," +
  " COUNT(CASE WHEN o.price > 0 AND a.fipe_price > 0" +
  "  AND TRIM(COALESCE(ver.code_fipe, '')) <> '' THEN 1 END) AS utilizaveis," +
  ' COUNT(DISTINCT ver.code_fipe) AS codigos_distintos' +
  CAMINHO +
  ' WHERE ' + VENDA + ' AND an.deleted_at IS NULL' + JANELA);

/* ── 3. a premissa frágil: venda sem oferta vencedora existe? ──────────
   Roda sobre TODOS os status, não só os de venda, pra mostrar também se
   offer_actual_id vaza pra estado que não é venda (o `value_actual` vaza). */
push('q_status_venda',
  'SELECT an.status AS status, COUNT(*) AS negociacoes,' +
  ' COUNT(CASE WHEN an.offer_actual_id IS NOT NULL THEN 1 END) AS com_oferta_vencedora,' +
  ' COUNT(CASE WHEN an.value_actual > 0 THEN 1 END) AS com_value_actual' +
  ' FROM advertisement_negotiations an' +
  ' WHERE an.deleted_at IS NULL' + JANELA +
  ' GROUP BY an.status ORDER BY negociacoes DESC');

/* ── 4. as duas FIPEs divergem quanto, dentro das vendas? ──────────────── */
push('q_fipe_fontes',
  'SELECT COUNT(*) AS vendas_com_as_duas,' +
  ' COUNT(CASE WHEN a.fipe_price <> v.fipe_price THEN 1 END) AS divergentes,' +
  ' ROUND(AVG(a.fipe_price / v.fipe_price), 4) AS razao_media_anuncio_veiculo,' +
  ' ROUND(MIN(a.fipe_price / v.fipe_price), 4) AS razao_min,' +
  ' ROUND(MAX(a.fipe_price / v.fipe_price), 4) AS razao_max' +
  CAMINHO +
  ' WHERE ' + VENDA + ' AND an.deleted_at IS NULL' + JANELA +
  ' AND a.fipe_price > 0 AND v.fipe_price > 0');

/* ── 5. quantos códigos FIPE têm amostra de verdade ────────────────────
   É esta query que define o corte de confiança. Não vou escolher n=30 por
   ser número redondo: escolho vendo onde está a massa. */
push('q_codigo_faixa',
  'SELECT CASE WHEN vendas >= 200 THEN 1 WHEN vendas >= 100 THEN 2' +
  ' WHEN vendas >= 50 THEN 3 WHEN vendas >= 30 THEN 4' +
  ' WHEN vendas >= 10 THEN 5 WHEN vendas >= 3 THEN 6 ELSE 7 END AS faixa,' +
  ' COUNT(*) AS codigos, SUM(vendas) AS vendas, MIN(vendas) AS piso, MAX(vendas) AS teto' +
  ' FROM (SELECT ver.code_fipe AS cf, COUNT(*) AS vendas' +
  CAMINHO +
  ' WHERE ' + VENDA + ' AND an.deleted_at IS NULL' + JANELA + UTIL +
  ' GROUP BY ver.code_fipe) x' +
  ' GROUP BY faixa ORDER BY faixa');

/* ── 6. o lixo nos extremos, medido antes de virar regra ───────────────
   A doc diz que o deságio vai de −1.586% a +94%. Aqui eu vejo a forma da
   distribuição e decido o corte com número, não com chute. */
push('q_razao_faixa',
  'SELECT CASE WHEN r < 0.2 THEN 1 WHEN r < 0.4 THEN 2 WHEN r < 0.6 THEN 3' +
  ' WHEN r < 0.7 THEN 4 WHEN r < 0.8 THEN 5 WHEN r < 0.9 THEN 6' +
  ' WHEN r < 1.0 THEN 7 WHEN r < 1.2 THEN 8 WHEN r < 1.5 THEN 9 ELSE 10 END AS faixa,' +
  ' COUNT(*) AS vendas, ROUND(MIN(r), 4) AS piso, ROUND(MAX(r), 4) AS teto' +
  ' FROM (SELECT ' + RAZAO + ' AS r' +
  CAMINHO +
  ' WHERE ' + VENDA + ' AND an.deleted_at IS NULL' + JANELA + UTIL + ') x' +
  ' GROUP BY faixa ORDER BY faixa');

/* ── 7. os 50 códigos mais vendidos ────────────────────────────────────
   O desvio padrão vem junto de propósito: um código com 300 vendas e desvio
   enorme dá MENOS confiança que um com 80 vendas e desvio pequeno. Volume
   sozinho não é confiança. */
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
  ' WHERE ' + VENDA + ' AND an.deleted_at IS NULL' + JANELA + UTIL +
  ' GROUP BY ver.code_fipe HAVING COUNT(*) >= ' + N_MINIMO +
  ' ORDER BY vendas DESC');

/* ── guardas: os limites do MCP, medidos na 49799 ──────────────────────── */
const comJanela = Q.filter((q) => q.sql.indexOf('OVER (') >= 0 || q.sql.indexOf('OVER(') >= 0);
if (comJanela.length) throw new Error('funcao de janela: o MCP rejeita — ' + comJanela[0].queryName);
if (PAGE > 50) throw new Error('PAGE > 50: o MCP corta em 50 linhas');

/* SQL malformada: `node --check` valida o JavaScript, não a SQL dentro da
   string. Um `COALESCE(x,, )` passaria e só morreria no banco, com a chamada
   já gasta. Não conferir `()` vazio — NOW() e CURDATE() são legítimos. */
const mal = Q.filter((q) =>
  q.sql.indexOf(',,') >= 0 || q.sql.indexOf('( )') >= 0 || q.sql.indexOf(',)') >= 0);
if (mal.length) throw new Error('SQL malformada em: ' + mal.map((q) => q.queryName).join(', '));

/* nenhuma query pode trazer coluna de PII */
const PII = ['plate', 'chassi', 'renavam', 'cpf', 'cnpj', 'full_name', 'u.email'];
const vaza = Q.filter((q) => PII.some((p) => q.sql.indexOf(p) >= 0));
if (vaza.length) throw new Error('PII na sonda: ' + vaza.map((q) => q.queryName).join(', '));

return Q.map((q, i) => ({
  json: {
    queryName: q.queryName, database: q.database, sql: q.sql,
    pagina: q.pagina, idx: i, total: Q.length, page: PAGE,
    meta: {
      estudo: 'precificacao-01', data_ini: DATA_INI, hoje: HOJE,
      meses: MESES, n_minimo: N_MINIMO,
      venda: VENDA, valor_venda: 'offers.price via an.offer_actual_id',
      fipe: 'advertisements.fipe_price'
    }
  }
}));
