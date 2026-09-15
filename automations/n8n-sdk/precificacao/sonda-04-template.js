/* ═══════════════════════════════════════════════════════════════════════════
   ESTUDO DE PRECIFICAÇÃO — SONDA 4: uma linha por venda

   ⚠️ ARQUIVO GERADO. Não edite este nó direto — edite `amostra.config.json` e
   rode `node monta-sonda-04.js`. O bloco AMOSTRA abaixo é injetado de lá.

   Extrai as vendas da amostra com TODAS as colunas de
   `context/banco-de-dados/consultas/vehicles-completo-descritivo.sql`, mais o
   valor da FIPE e o valor da venda. O deságio é calculado na análise local
   (1 − venda/FIPE), não aqui: assim o dado bruto fica sem derivada embutida.

   ── O QUE NÃO VEM, e por quê ──────────────────────────────────────────────
     placa, chassi   PII, e identificam exatamente 1 linha cada — valor
                     analítico zero. O README do n8n-sdk proíbe SELECT * em
                     `vehicles` justamente por causa dessas colunas.
     descricao_livre texto livre do anúncio; não é categoria nem número.
     excluido_em     sempre NULL, porque o recorte já filtra deletados.

   ── DEFINIÇÕES (as mesmas desde a sonda 2) ────────────────────────────────
     venda  = veículo cuja ÚLTIMA linha válida de advertisement_negotiations
              tem status 2, 3 ou 7
     última = MAX(an.id) por vehicle_id, entre as não deletadas
     valor  = offers.price da oferta vencedora, via an.offer_actual_id
     FIPE   = advertisements.fipe_price

   ── PAGINAÇÃO ─────────────────────────────────────────────────────────────
   O MCP corta a resposta em 50 linhas SEMPRE (medido na 49799), e o OFFSET faz
   o banco re-executar a query inteira a cada página. Por isso o `q_gabarito`
   vem junto: se a soma das linhas coletadas não bater com ele, a coleta veio
   truncada e o resultado é inválido — sem gabarito, coleta incompleta passa
   por completa em silêncio.

   ⚠️ `ORDER BY an.id` é obrigatório. Sem ordem determinística, OFFSET pula e
   repete linhas entre páginas, e o erro não aparece em lugar nenhum.
   ═══════════════════════════════════════════════════════════════════════════ */

const AMOSTRA = /*__CONFIG__*/null;

const PAGE = AMOSTRA.page;
const pad = (n) => String(n).padStart(2, '0');
const agora = new Date(Date.now() - 180 * 60000);   /* Brasília */
const ini = new Date(agora.getFullYear(), agora.getMonth() - AMOSTRA.janela_meses, agora.getDate());
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

/* os 11 catálogos da vehicles-completo-descritivo, todos LEFT: FK anulável
   com INNER faria o veículo sumir em silêncio */
const CAMINHO =
  ' FROM advertisement_negotiations an' + ULTIMA +
  ' LEFT JOIN offers o ON o.id = an.offer_actual_id AND o.deleted_at IS NULL' +
  ' INNER JOIN advertisements a ON a.id = an.advertisement_id' +
  ' INNER JOIN vehicles v ON v.id = a.vehicle_id' +
  ' LEFT JOIN versions ver ON ver.id = v.version_id' +
  ' LEFT JOIN shops s ON s.id = v.shop_id' +
  ' LEFT JOIN shop_stocks ss ON ss.id = v.shop_stock_id' +
  ' LEFT JOIN categories cat ON cat.id = v.category_id' +
  ' LEFT JOIN brands b ON b.id = v.brand_id' +
  ' LEFT JOIN models m ON m.id = v.model_id' +
  ' LEFT JOIN bodyworks bw ON bw.id = v.bodywork_id' +
  ' LEFT JOIN colors c ON c.id = v.color_id' +
  ' LEFT JOIN driver_shifts dsh ON dsh.id = v.drive_shift_id' +
  ' LEFT JOIN clusters cl ON cl.id = v.cluster_id' +
  ' LEFT JOIN fuels f ON f.id = v.fuel_id';

const RAZAO = '(o.price / a.fipe_price)';
const UTIL =
  " AND o.price > 0 AND a.fipe_price > 0 AND TRIM(COALESCE(ver.code_fipe, '')) <> ''";
const CORTE =
  ' AND ' + RAZAO + ' >= ' + AMOSTRA.corte_razao[0] +
  ' AND ' + RAZAO + ' <= ' + AMOSTRA.corte_razao[1];

/* o recorte da amostra: por lista de códigos, ou por volume mínimo */
let ESCOPO = '';
if (AMOSTRA.codigos_fipe && AMOSTRA.codigos_fipe.length) {
  ESCOPO = " AND ver.code_fipe IN ('" + AMOSTRA.codigos_fipe.join("', '") + "')";
} else if (AMOSTRA.n_minimo) {
  ESCOPO =
    ' AND ver.code_fipe IN (SELECT cf FROM (SELECT ver9.code_fipe AS cf' +
    ' FROM advertisement_negotiations an9' +
    ' INNER JOIN (SELECT a8.vehicle_id AS vid, MAX(an8.id) AS ult' +
    ' FROM advertisement_negotiations an8' +
    ' INNER JOIN advertisements a8 ON a8.id = an8.advertisement_id' +
    ' WHERE an8.deleted_at IS NULL GROUP BY a8.vehicle_id) u9 ON u9.ult = an9.id' +
    ' LEFT JOIN offers o9 ON o9.id = an9.offer_actual_id AND o9.deleted_at IS NULL' +
    ' INNER JOIN advertisements a9 ON a9.id = an9.advertisement_id' +
    ' INNER JOIN vehicles v9 ON v9.id = a9.vehicle_id' +
    ' LEFT JOIN versions ver9 ON ver9.id = v9.version_id' +
    ' WHERE an9.status IN (2, 3, 7)' +
    " AND an9.finish_date_offer >= '" + DATA_INI + " 00:00:00'" +
    " AND an9.finish_date_offer <= '" + HOJE + " 23:59:59'" +
    ' AND o9.price > 0 AND a9.fipe_price > 0' +
    " AND TRIM(COALESCE(ver9.code_fipe, '')) <> ''" +
    ' GROUP BY ver9.code_fipe HAVING COUNT(*) >= ' + AMOSTRA.n_minimo + ') z)';
} else {
  throw new Error('amostra sem recorte: defina codigos_fipe ou n_minimo');
}

const FILTRO = ' WHERE ' + VENDA + JANELA + UTIL + CORTE + ESCOPO;

/* as colunas: as mesmas da vehicles-completo-descritivo, menos PII e texto
   livre, mais o valor da venda. Uma por linha pra a lista ser auditável. */
const COLUNAS = [
  'v.id AS veiculo_id',
  'an.id AS negociacao_id',
  'ver.code_fipe AS codigo_fipe',
  'ver.code_molicar AS codigo_molicar',

  /* os dois valores do pedido */
  'o.price AS venda',
  'a.fipe_price AS valor_fipe_anuncio',

  /* demais referências de preço */
  'v.fipe_price AS valor_fipe_veiculo',
  'an.price_reference_advertiser AS valor_ref_vendedor',
  'an.min_sale_price AS vmv',
  'v.molicar_price AS valor_molicar_veiculo',
  'a.molicar_price AS valor_molicar_anuncio',
  'v.retail_value AS valor_varejo',

  /* de onde vem o carro */
  's.id AS loja_id',
  's.name AS loja',
  's.whitelabel_id AS whitelabel_id',
  'ss.name AS patio',
  'ss.city AS patio_cidade',
  'ss.state AS patio_uf',

  /* os 9 catálogos de ficha técnica */
  'cat.name AS categoria',
  'b.name AS marca',
  'm.name AS modelo',
  'ver.name AS versao',
  'bw.name AS carroceria',
  'c.name AS cor',
  'dsh.name AS cambio',
  'f.name AS combustivel',
  'cl.name AS cluster',

  /* colunas próprias do veículo */
  'v.situation AS situacao_codigo',
  'v.manufacture_year AS ano_fabricacao',
  'v.model_year AS ano_modelo',
  'v.km AS km',
  'v.ports_qtd AS portas',
  'v.fipe_quantity_version AS fipe_qtd_versoes',
  'v.created_at AS veiculo_criado_em',
  'v.updated_at AS veiculo_atualizado_em',

  /* contexto da venda */
  'an.finish_date_offer AS data_venda',
  'an.status AS status_negociacao',
  'o.buyer_shop_id AS comprador_loja_id'
];

const Q = [];
function push(nome, sql, pagina) {
  Q.push({ queryName: nome, database: 'cars2you_production', sql: sql, pagina: pagina || 0 });
}

/* ── gabarito: quantas linhas a coleta TEM de trazer ─────────────────── */
push('q_gabarito',
  'SELECT COUNT(*) AS vendas, COUNT(DISTINCT ver.code_fipe) AS codigos,' +
  ' MIN(an.finish_date_offer) AS primeira, MAX(an.finish_date_offer) AS ultima' +
  CAMINHO + FILTRO + ' LIMIT ' + PAGE + ' OFFSET 0');

/* ── as páginas ──────────────────────────────────────────────────────── */
const PAGINAS = Math.ceil(AMOSTRA.vendas_esperadas / PAGE) + AMOSTRA.paginas_margem;
const BASE = 'SELECT ' + COLUNAS.join(', ') + CAMINHO + FILTRO + ' ORDER BY an.id';
for (let p = 0; p < PAGINAS; p++) {
  push('q_vendas', BASE + ' LIMIT ' + PAGE + ' OFFSET ' + (p * PAGE), p);
}

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
});

/* PII: a proibição é dura, não um aviso */
['v.plate', 'v.chassi', 'renavam', 'u.email', 'full_name', 's.cnpj', 'partner_cpf']
  .forEach((p) => {
    const vaza = Q.filter((q) => q.sql.indexOf(p) >= 0);
    if (vaza.length) throw new Error('PII na sonda (' + p + '): ' + vaza[0].queryName);
  });

/* paginação sem ordem determinística pula e repete linhas em silêncio */
Q.filter((q) => q.queryName === 'q_vendas').forEach((q) => {
  if (q.sql.indexOf('ORDER BY an.id') < 0) {
    throw new Error('pagina sem ORDER BY deterministico: ' + q.pagina);
  }
});

return Q.map((q, i) => ({
  json: {
    queryName: q.queryName, database: q.database, sql: q.sql,
    pagina: q.pagina, idx: i, total: Q.length, page: PAGE,
    meta: {
      estudo: 'precificacao-04',
      amostra: AMOSTRA.nome,
      data_ini: DATA_INI, hoje: HOJE,
      corte_razao: AMOSTRA.corte_razao,
      codigos: AMOSTRA.codigos_fipe ? AMOSTRA.codigos_fipe.length : null,
      n_minimo: AMOSTRA.n_minimo,
      vendas_esperadas: AMOSTRA.vendas_esperadas,
      paginas: PAGINAS,
      colunas: COLUNAS.length,
      venda: 'ultima negociacao valida do veiculo com status IN (2,3,7)',
      valor_venda: 'offers.price via an.offer_actual_id',
      fipe: 'advertisements.fipe_price',
      desagio: 'calculado na analise local: 1 - venda/valor_fipe_anuncio'
    }
  }
}));
