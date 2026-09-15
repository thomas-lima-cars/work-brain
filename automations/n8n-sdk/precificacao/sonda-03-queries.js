/* ═══════════════════════════════════════════════════════════════════════════
   ESTUDO DE PRECIFICAÇÃO — SONDA 3: os 10 códigos mais vendidos, em reais

   Pedido do Thomas: os 10 veículos (por código FIPE) com mais vendas, o valor
   médio de venda, o valor da FIPE e o deságio médio.

   Por que não dá pra tirar isso da sonda 2: ela trouxe `razao_media` e
   `fipe_media`, mas **média de razão não é razão de médias**. Com dispersão
   de ~9 p.p. a diferença entre AVG(preço) e AVG(razão) × AVG(fipe) é real.
   O valor em reais tem de vir do banco.

   Duas queries, de propósito:
     q_top10_limpo  com o corte de outlier 0,20 <= razão <= 1,20
     q_top10_bruto  sem corte nenhum

   As duas existem porque o corte muda o ranking de três códigos de forma
   grosseira — o Chevrolet Agile aparece vendendo a 3,07x a FIPE no bruto. Ver
   os dois lado a lado é o que torna o corte auditável em vez de escondido.

   ── DEFINIÇÕES (as mesmas da sonda 2) ────────────────────────────────────
     venda  = veículo cuja ÚLTIMA linha válida de advertisement_negotiations
              tem status 2, 3 ou 7 (correção do Thomas, 2026-09-14)
     última = MAX(an.id) por vehicle_id, entre as não deletadas
     valor  = offers.price da oferta vencedora, via an.offer_actual_id
     FIPE   = advertisements.fipe_price

   `deságio` sai calculado como 1 − razão no relatório local, não aqui: no SQL
   fica a razão crua, que é o que a sonda 2 já mede, pra os dois números serem
   comparáveis sem conversão pelo caminho.

   ⚠️ VMV entra junto (`an.min_sale_price`). Não foi pedido, mas é o piso da
   venda: sem ele, "o carro vendeu a 69% da FIPE" não diz se foi bom ou se o
   piso já estava em 68%. Uma coluna, mesma varredura.
   ═══════════════════════════════════════════════════════════════════════════ */

const PAGE = 50;
const MESES = 12;
const TOPN = 10;
const RAZAO_MIN = 0.20;
const RAZAO_MAX = 1.20;

const pad = (n) => String(n).padStart(2, '0');
const agora = new Date(Date.now() - 180 * 60000);
const ini = new Date(agora.getFullYear(), agora.getMonth() - MESES, agora.getDate());
const DATA_INI = ini.getFullYear() + '-' + pad(ini.getMonth() + 1) + '-' + pad(ini.getDate());
const HOJE = agora.getFullYear() + '-' + pad(agora.getMonth() + 1) + '-' + pad(agora.getDate());

const JANELA =
  " AND an.finish_date_offer >= '" + DATA_INI + " 00:00:00'" +
  " AND an.finish_date_offer <= '" + HOJE + " 23:59:59'";
const VENDA = 'an.status IN (2, 3, 7)';

const ULTIMA =
  ' INNER JOIN (SELECT a2.vehicle_id AS vid, MAX(an2.id) AS ult' +
  ' FROM advertisement_negotiations an2' +
  ' INNER JOIN advertisements a2 ON a2.id = an2.advertisement_id' +
  ' WHERE an2.deleted_at IS NULL' +
  ' GROUP BY a2.vehicle_id) u ON u.ult = an.id';

const CAMINHO =
  ' FROM advertisement_negotiations an' + ULTIMA +
  ' LEFT JOIN offers o ON o.id = an.offer_actual_id AND o.deleted_at IS NULL' +
  ' INNER JOIN advertisements a ON a.id = an.advertisement_id' +
  ' INNER JOIN vehicles v ON v.id = a.vehicle_id' +
  ' LEFT JOIN versions ver ON ver.id = v.version_id' +
  ' LEFT JOIN brands b ON b.id = v.brand_id' +
  ' LEFT JOIN models m ON m.id = v.model_id';

const UTIL =
  " AND o.price > 0 AND a.fipe_price > 0 AND TRIM(COALESCE(ver.code_fipe, '')) <> ''";
const RAZAO = '(o.price / a.fipe_price)';
const CORTE = ' AND ' + RAZAO + ' >= ' + RAZAO_MIN + ' AND ' + RAZAO + ' <= ' + RAZAO_MAX;

const Q = [];
function push(nome, sql) {
  Q.push({
    queryName: nome, database: 'cars2you_production',
    sql: sql + ' LIMIT ' + PAGE + ' OFFSET 0', pagina: 0
  });
}

/* O SELECT é o mesmo nas duas; só o WHERE difere. Escrito uma vez pra não
   haver chance de as duas medirem coisas sutilmente diferentes. */
function top10(nome, extra) {
  push(nome,
    'SELECT ver.code_fipe AS code_fipe,' +
    ' MAX(b.name) AS marca, MAX(m.name) AS modelo, MAX(ver.name) AS versao,' +
    ' COUNT(*) AS vendas,' +
    ' ROUND(AVG(o.price), 2) AS venda_media,' +
    ' ROUND(AVG(a.fipe_price), 2) AS fipe_media,' +
    ' ROUND(AVG(' + RAZAO + '), 4) AS razao_media,' +
    ' ROUND(STDDEV_SAMP(' + RAZAO + '), 4) AS razao_dp,' +
    ' ROUND(MIN(' + RAZAO + '), 4) AS razao_min,' +
    ' ROUND(MAX(' + RAZAO + '), 4) AS razao_max,' +
    ' ROUND(AVG(an.min_sale_price), 2) AS vmv_medio,' +
    ' COUNT(DISTINCT o.buyer_shop_id) AS lojas_compradoras,' +
    ' COUNT(DISTINCT v.model_year) AS anos_modelo' +
    CAMINHO +
    ' WHERE ' + VENDA + JANELA + UTIL + (extra || '') +
    ' GROUP BY ver.code_fipe' +
    ' ORDER BY vendas DESC');
}

top10('q_top10_limpo', CORTE);
top10('q_top10_bruto', '');

/* ── guardas: os limites do MCP, medidos na 49799 ─────────────────────── */
if (PAGE > 50) throw new Error('PAGE > 50: o MCP corta em 50 linhas');
Q.forEach((q) => {
  if (q.sql.indexOf('OVER (') >= 0 || q.sql.indexOf('OVER(') >= 0) {
    throw new Error('funcao de janela: o MCP rejeita — ' + q.queryName);
  }
  if (q.sql.indexOf(',,') >= 0 || q.sql.indexOf('( )') >= 0 || q.sql.indexOf(',)') >= 0) {
    throw new Error('SQL malformada em: ' + q.queryName);
  }
  if (q.sql.indexOf('MAX(an2.id)') < 0) {
    throw new Error('sem o recorte da ultima negociacao: ' + q.queryName);
  }
  ['plate', 'chassi', 'renavam', 'full_name'].forEach((p) => {
    if (q.sql.indexOf(p) >= 0) throw new Error('PII em ' + q.queryName + ': ' + p);
  });
});

/* as duas TÊM de ser iguais fora do corte — senão não são comparáveis */
const so = (s) => s.split(' WHERE ')[0];
if (so(Q[0].sql) !== so(Q[1].sql)) {
  throw new Error('as duas queries divergem antes do WHERE: nao sao comparaveis');
}

return Q.map((q, i) => ({
  json: {
    queryName: q.queryName, database: q.database, sql: q.sql,
    pagina: 0, idx: i, total: Q.length, page: PAGE,
    meta: {
      estudo: 'precificacao-03', data_ini: DATA_INI, hoje: HOJE,
      top_n: TOPN, corte: [RAZAO_MIN, RAZAO_MAX],
      venda: 'ultima negociacao valida do veiculo com status IN (2,3,7)',
      valor_venda: 'offers.price via an.offer_actual_id',
      fipe: 'advertisements.fipe_price'
    }
  }
}));
