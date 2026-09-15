/* ═══════════════════════════════════════════════════════════════════════════
   ESTUDO DE PRECIFICAÇÃO — SONDA 5: deságio dentro do mesmo código FIPE

   ⚠️ ARQUIVO GERADO. Edite `amostra.config.json` e rode `node monta-sonda-05.js`.

   Pedido do Thomas: "tendo em vista somente veículos com o mesmo codigo_fipe,
   validar a correlação entre o deságio médio e quilometragem, UF do pátio,
   idade do veículo e status da documentação".

   ── O RECORTE "MESMO CÓDIGO FIPE" ─────────────────────────────────────────
   Agrego por (codigo_fipe × faixa), não só por faixa. Com o par na mão, o
   efeito DENTRO do código sai no cliente: para cada código, o desvio da faixa
   em relação à média daquele código; depois a média ponderada desses desvios.
   Isso é o mesmo controle da sonda 4, agora legível por faixa.

   Agregar em SQL em vez de trazer 1.302 linhas é o que faz isto caber em ~17
   chamadas: 10 códigos x poucas faixas = dezenas de linhas, não milhares.

   ── STATUS DA DOCUMENTAÇÃO: O CAMPO NÃO EXISTE ────────────────────────────
   Não há coluna de status de documentação no banco. As colunas `document` são
   CPF/CNPJ de pessoa. O que existe é `vehicle_precautionary_reports.situation`
   — o LAUDO CAUTELAR — medido na sonda 50346 e documentado em `dominios.md`.
   É o mais próximo, e está rotulado como laudo em todo lugar, não como
   "documentação". Se o Thomas quis dizer outra coisa, é pergunta em aberto.

   ⚠️ `nao_informado` (78% dos laudos) NÃO é ausência de laudo — é laudo sem
   veredito. `sem laudo` (veículo sem linha na tabela) é a quarta categoria e
   fica separada de propósito: juntar as duas mente.

   ⚠️ O laudo entra por subquery agregada, não por LEFT JOIN direto. Se houver
   mais de uma linha por veículo, o join direto multiplicaria a venda e
   inflaria a contagem em silêncio. `q_laudo_unicidade` mede se isso acontece.

   ── IDADE ─────────────────────────────────────────────────────────────────
   idade = ano da venda − `model_year` (ano do MODELO, não de fabricação — é a
   convenção já usada em `consultas/lojas-ofertas-6m.sql`). Pode dar negativo:
   carro 0 km de modelo do ano seguinte. A faixa `a 0-1` absorve isso.

   ── PREFIXO DE LETRA NAS FAIXAS ───────────────────────────────────────────
   As faixas saem como 'a ate 20k', 'b 20-40k'... porque o MCP não tem função
   de janela e o ORDER BY tem de ser alfabético para a ordem da faixa
   sobreviver. O rótulo limpo é remontado no cliente.
   ═══════════════════════════════════════════════════════════════════════════ */

const AMOSTRA = /*__CONFIG__*/null;

const PAGE = AMOSTRA.page;
const pad = (n) => String(n).padStart(2, '0');
const agora = new Date(Date.now() - 180 * 60000);
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

/* o laudo, pré-agregado: garante 1 linha por veículo aconteça o que acontecer */
const LAUDO =
  ' LEFT JOIN (SELECT vpr0.vehicle_id AS vid, MAX(vpr0.situation) AS sit' +
  ' FROM vehicle_precautionary_reports vpr0 WHERE vpr0.deleted_at IS NULL' +
  ' GROUP BY vpr0.vehicle_id) lau ON lau.vid = v.id';

const CAMINHO =
  ' FROM advertisement_negotiations an' + ULTIMA +
  ' LEFT JOIN offers o ON o.id = an.offer_actual_id AND o.deleted_at IS NULL' +
  ' INNER JOIN advertisements a ON a.id = an.advertisement_id' +
  ' INNER JOIN vehicles v ON v.id = a.vehicle_id' +
  ' LEFT JOIN versions ver ON ver.id = v.version_id' +
  ' LEFT JOIN shop_stocks ss ON ss.id = v.shop_stock_id';

const RAZAO = '(o.price / a.fipe_price)';
const UTIL =
  " AND o.price > 0 AND a.fipe_price > 0 AND TRIM(COALESCE(ver.code_fipe, '')) <> ''";
const CORTE =
  ' AND ' + RAZAO + ' >= ' + AMOSTRA.corte_razao[0] +
  ' AND ' + RAZAO + ' <= ' + AMOSTRA.corte_razao[1];
const ESCOPO = " AND ver.code_fipe IN ('" + AMOSTRA.codigos_fipe.join("', '") + "')";
const FILTRO = ' WHERE ' + VENDA + JANELA + UTIL + CORTE + ESCOPO;

/* as medidas, iguais em toda query: sem isso as quatro não são comparáveis */
const MEDIDAS =
  ' COUNT(*) AS vendas,' +
  ' ROUND(AVG(' + RAZAO + '), 6) AS razao_media,' +
  ' ROUND(STDDEV_SAMP(' + RAZAO + '), 6) AS razao_dp,' +
  ' ROUND(AVG(o.price), 2) AS venda_media,' +
  ' ROUND(AVG(a.fipe_price), 2) AS fipe_media';

/* ── as quatro faixas ─────────────────────────────────────────────────── */
const F_KM =
  "CASE WHEN v.km IS NULL THEN 'z sem km'" +
  " WHEN v.km < 20000 THEN 'a ate 20k'" +
  " WHEN v.km < 40000 THEN 'b 20 a 40k'" +
  " WHEN v.km < 60000 THEN 'c 40 a 60k'" +
  " WHEN v.km < 80000 THEN 'd 60 a 80k'" +
  " WHEN v.km < 100000 THEN 'e 80 a 100k'" +
  " WHEN v.km < 150000 THEN 'f 100 a 150k'" +
  " WHEN v.km < 200000 THEN 'g 150 a 200k'" +
  " ELSE 'h 200k ou mais' END";

const IDADE = '(YEAR(an.finish_date_offer) - v.model_year)';
const F_IDADE =
  "CASE WHEN v.model_year IS NULL OR v.model_year < 1950 THEN 'z sem ano'" +
  ' WHEN ' + IDADE + " <= 1 THEN 'a 0 a 1 ano'" +
  ' WHEN ' + IDADE + " = 2 THEN 'b 2 anos'" +
  ' WHEN ' + IDADE + " = 3 THEN 'c 3 anos'" +
  ' WHEN ' + IDADE + " = 4 THEN 'd 4 anos'" +
  ' WHEN ' + IDADE + " = 5 THEN 'e 5 anos'" +
  ' WHEN ' + IDADE + " = 6 THEN 'f 6 anos'" +
  ' WHEN ' + IDADE + " = 7 THEN 'g 7 anos'" +
  ' WHEN ' + IDADE + " <= 9 THEN 'h 8 a 9 anos'" +
  " ELSE 'i 10 anos ou mais' END";

const F_UF = "UPPER(TRIM(COALESCE(NULLIF(TRIM(ss.state), ''), 'z sem UF')))";

const F_LAUDO = "COALESCE(NULLIF(TRIM(lau.sit), ''), 'z sem laudo')";

const Q = [];
function push(nome, sql, pagina) {
  Q.push({ queryName: nome, database: 'cars2you_production', sql: sql, pagina: pagina || 0 });
}
function porCodigo(nome, faixa, paginas, extra) {
  const base =
    'SELECT ver.code_fipe AS codigo_fipe, ' + faixa + ' AS faixa,' + MEDIDAS +
    CAMINHO + (extra || '') + FILTRO +
    ' GROUP BY ver.code_fipe, faixa ORDER BY ver.code_fipe, faixa';
  for (let p = 0; p < paginas; p++) {
    push(nome, base + ' LIMIT ' + PAGE + ' OFFSET ' + (p * PAGE), p);
  }
}

/* ── gabarito: cada dimensão tem de somar o total ─────────────────────── */
push('q_gabarito',
  'SELECT COUNT(*) AS vendas, COUNT(DISTINCT ver.code_fipe) AS codigos,' +
  ' ROUND(AVG(' + RAZAO + '), 6) AS razao_media' +
  CAMINHO + FILTRO + ' LIMIT ' + PAGE + ' OFFSET 0');

/* ── o laudo é mesmo 1 linha por veículo? ─────────────────────────────
   Se não for, o LEFT JOIN direto teria multiplicado as vendas. A subquery
   agregada já protege; isto mede se a proteção estava fazendo falta. */
push('q_laudo_unicidade',
  'SELECT COUNT(*) AS linhas, COUNT(DISTINCT vpr.vehicle_id) AS veiculos,' +
  ' COUNT(DISTINCT vpr.situation) AS valores_distintos' +
  ' FROM vehicle_precautionary_reports vpr' +
  ' WHERE vpr.deleted_at IS NULL' +
  ' AND vpr.vehicle_id IN (SELECT v3.id' +
  ' FROM advertisement_negotiations an' + ULTIMA +
  ' LEFT JOIN offers o ON o.id = an.offer_actual_id AND o.deleted_at IS NULL' +
  ' INNER JOIN advertisements a ON a.id = an.advertisement_id' +
  ' INNER JOIN vehicles v3 ON v3.id = a.vehicle_id' +
  ' INNER JOIN vehicles v ON v.id = a.vehicle_id' +
  ' LEFT JOIN versions ver ON ver.id = v.version_id' +
  FILTRO + ')' +
  ' LIMIT ' + PAGE + ' OFFSET 0');

/* ── as quatro dimensões ──────────────────────────────────────────────── */
porCodigo('q_km', F_KM, 3);
porCodigo('q_idade', F_IDADE, 3);
porCodigo('q_uf', F_UF, 7);
porCodigo('q_laudo', F_LAUDO, 2, LAUDO);

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
['v.plate', 'v.chassi', 'renavam', 'last_owner_document', 'full_name', 'u.email']
  .forEach((p) => {
    const vaza = Q.filter((q) => q.sql.indexOf(p) >= 0);
    if (vaza.length) throw new Error('PII na sonda (' + p + '): ' + vaza[0].queryName);
  });

/* toda dimensão tem de agrupar por codigo_fipe — é o recorte do pedido */
Q.filter((q) => q.queryName.indexOf('q_') === 0 &&
  ['q_gabarito', 'q_laudo_unicidade'].indexOf(q.queryName) < 0).forEach((q) => {
  if (q.sql.indexOf('GROUP BY ver.code_fipe, faixa') < 0) {
    throw new Error('dimensao sem recorte por codigo FIPE: ' + q.queryName);
  }
});

return Q.map((q, i) => ({
  json: {
    queryName: q.queryName, database: q.database, sql: q.sql,
    pagina: q.pagina, idx: i, total: Q.length, page: PAGE,
    meta: {
      estudo: 'precificacao-05', amostra: AMOSTRA.nome,
      data_ini: DATA_INI, hoje: HOJE,
      corte_razao: AMOSTRA.corte_razao, codigos: AMOSTRA.codigos_fipe.length,
      vendas_esperadas: AMOSTRA.vendas_esperadas,
      dimensoes: ['km', 'idade', 'uf', 'laudo'],
      idade: 'ano da venda menos model_year',
      laudo: 'vehicle_precautionary_reports.situation — LAUDO CAUTELAR, nao "status da documentacao" (esse campo nao existe no banco)',
      desagio: 'calculado no cliente: 1 - razao_media'
    }
  }
}));
