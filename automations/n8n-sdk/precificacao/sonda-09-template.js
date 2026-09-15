/* ═══════════════════════════════════════════════════════════════════════════
   ESTUDO DE PRECIFICAÇÃO — SONDA 9: as quatro dimensões, agora POR MODELO

   ⚠️ ARQUIVO GERADO. Edite `amostra-modelo.config.json` e rode
   `node monta-sonda-09.js`.

   Pedido do Thomas (15/09): trocar o recorte de código FIPE para MODELO, tirar
   motos e pesados, e usar os 20 modelos com mais vendas.

   ── O QUE MUDA EM RELAÇÃO À SONDA 5 ───────────────────────────────────────
   O grupo de controle deixa de ser `code_fipe` e passa a ser marca+modelo.
   Consequências, as duas reais:

     GANHO   dentro de um código FIPE o ano do modelo quase não varia, e por
             isso idade rendeu só 2,6 p.p. na sonda 5. Por modelo, o Gol cobre
             2006–2023 e o Corolla 2003–2026: idade e km passam a variar de
             verdade dentro do grupo, e a medida passa a ter o que medir.

     PERDA   o controle fica mais frouxo. "Mesmo modelo" mistura gerações e
             versões que "mesmo código FIPE" separava. Um Onix 2014 e um Onix
             2025 são o mesmo grupo aqui. Parte do que aparecer como efeito de
             km pode ser efeito de geração.

   As duas coisas precisam ser ditas juntas: a leitura fica mais sensível E
   menos limpa. Não existe recorte que seja as duas coisas.

   ── A CHAVE É O NOME, NÃO O ID ────────────────────────────────────────────
   O catálogo `models` reparte o mesmo modelo em ids diferentes — a sonda 7
   achou pelo menos 50 nomes assim. Agrupar por `model_id` partiria a Strada em
   dois grupos de 172 e 33. A coluna `grupo` sai como marca+modelo normalizados.

   `grupo` tem esse nome genérico de propósito: o nó de análise não precisa
   saber se o controle é código FIPE ou modelo, só que existe um.

   ── O FILTRO DE MOTOS E PESADOS É POR LINHA ───────────────────────────────
   Não por modelo agregado. Na sonda 7 eu trouxe a categoria com MAX(cat.name)
   e um único veículo sem categoria rotulava o modelo inteiro — Gol, Onix e
   HB20 apareceram como "Não informada" por causa disso.
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

const ULTIMA =
  ' INNER JOIN (SELECT a2.vehicle_id AS vid, MAX(an2.id) AS ult' +
  ' FROM advertisement_negotiations an2' +
  ' INNER JOIN advertisements a2 ON a2.id = an2.advertisement_id' +
  ' WHERE an2.deleted_at IS NULL' +
  ' GROUP BY a2.vehicle_id) u ON u.ult = an.id';

/* o laudo, pré-agregado: 1 linha por veículo aconteça o que acontecer.
   Medido na 51095: hoje é 1 por veículo, mas o join direto ficaria refém
   disso continuar verdade. */
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
  ' LEFT JOIN shop_stocks ss ON ss.id = v.shop_stock_id' +
  ' LEFT JOIN models m ON m.id = v.model_id' +
  ' LEFT JOIN brands b ON b.id = v.brand_id' +
  ' LEFT JOIN categories cat ON cat.id = v.category_id';

const MARCA = "UPPER(TRIM(COALESCE(b.name, '(sem marca)')))";
const MODELO = "UPPER(TRIM(COALESCE(m.name, '(sem modelo)')))";
const GRUPO = "CONCAT(" + MARCA + ", ' ', " + MODELO + ")";

const RAZAO = '(o.price / a.fipe_price)';

/* o filtro de categoria, POR LINHA */
const SEM_PESADOS =
  " AND COALESCE(cat.name, 'Nao informada') NOT IN ('" +
  AMOSTRA.excluir_categorias.join("', '") + "')";

/* os 20 modelos, por marca|modelo */
const CHAVES = AMOSTRA.modelos.map((x) => x.marca + '|' + x.modelo);
const ESCOPO =
  " AND CONCAT(" + MARCA + ", '|', " + MODELO + ") IN ('" + CHAVES.join("', '") + "')";

const FILTRO =
  ' WHERE an.status IN (2, 3, 7)' + JANELA +
  ' AND o.price > 0 AND a.fipe_price > 0' +
  ' AND ' + RAZAO + ' >= ' + AMOSTRA.corte_razao[0] +
  ' AND ' + RAZAO + ' <= ' + AMOSTRA.corte_razao[1] +
  SEM_PESADOS + ESCOPO;

/* as medidas, iguais em toda dimensão — senão as quatro não são comparáveis */
const MEDIDAS =
  ' COUNT(*) AS vendas,' +
  ' ROUND(AVG(' + RAZAO + '), 6) AS razao_media,' +
  ' ROUND(STDDEV_SAMP(' + RAZAO + '), 6) AS razao_dp,' +
  ' ROUND(AVG(o.price), 2) AS venda_media,' +
  ' ROUND(AVG(a.fipe_price), 2) AS fipe_media';

/* ── as quatro faixas. Prefixo de letra porque o MCP não tem função de
      janela e o ORDER BY alfabético é o que segura a ordem da faixa. ───── */
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
  ' WHEN ' + IDADE + " <= 14 THEN 'i 10 a 14 anos'" +
  " ELSE 'j 15 anos ou mais' END";

const F_UF = "UPPER(TRIM(COALESCE(NULLIF(TRIM(ss.state), ''), 'z sem UF')))";
const F_LAUDO = "COALESCE(NULLIF(TRIM(lau.sit), ''), 'z sem laudo')";

const Q = [];
function push(nome, sql, pagina) {
  Q.push({ queryName: nome, database: 'cars2you_production', sql: sql, pagina: pagina || 0 });
}
function porGrupo(nome, faixa, paginas, extra) {
  const base =
    'SELECT ' + GRUPO + ' AS grupo, ' + faixa + ' AS faixa,' + MEDIDAS +
    CAMINHO + (extra || '') + FILTRO +
    ' GROUP BY grupo, faixa ORDER BY grupo, faixa';
  for (let p = 0; p < paginas; p++) {
    push(nome, base + ' LIMIT ' + PAGE + ' OFFSET ' + (p * PAGE), p);
  }
}

/* ── gabarito: cada dimensão tem de somar o mesmo total ───────────────── */
push('q_gabarito',
  'SELECT COUNT(*) AS vendas, COUNT(DISTINCT ' + GRUPO + ') AS grupos,' +
  ' COUNT(DISTINCT ver.code_fipe) AS codigos_fipe,' +
  ' COUNT(DISTINCT v.model_id) AS model_ids,' +
  ' ROUND(AVG(' + RAZAO + '), 6) AS razao_media,' +
  ' MIN(an.finish_date_offer) AS primeira, MAX(an.finish_date_offer) AS ultima' +
  CAMINHO + FILTRO + ' LIMIT ' + PAGE + ' OFFSET 0');

/* ── prova de que nenhuma categoria excluída passou ───────────────────── */
push('q_categorias_restantes',
  "SELECT COALESCE(cat.name, '(sem categoria)') AS categoria, COUNT(*) AS vendas" +
  CAMINHO + FILTRO + ' GROUP BY categoria ORDER BY vendas DESC' +
  ' LIMIT ' + PAGE + ' OFFSET 0');

/* ── as quatro dimensões ──────────────────────────────────────────────────
   20 grupos x faixas. UF e a mais larga (27 UFs), por isso 13 paginas. */
porGrupo('q_km', F_KM, 5);
porGrupo('q_idade', F_IDADE, 6);
porGrupo('q_uf', F_UF, 13);
porGrupo('q_laudo', F_LAUDO, 4, LAUDO);

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
  if (q.sql.indexOf('MAX(cat.name)') >= 0) {
    throw new Error('categoria por MAX agregado: o filtro tem de ser por linha');
  }
});
['v.plate', 'v.chassi', 'renavam', 'last_owner_document', 'full_name', 'u.email']
  .forEach((p) => {
    const vaza = Q.filter((q) => q.sql.indexOf(p) >= 0);
    if (vaza.length) throw new Error('PII na sonda (' + p + '): ' + vaza[0].queryName);
  });

/* toda dimensão agrupa por `grupo` — é o recorte "mesmo modelo" do pedido */
Q.filter((q) => ['q_gabarito', 'q_categorias_restantes'].indexOf(q.queryName) < 0)
  .forEach((q) => {
    if (q.sql.indexOf('GROUP BY grupo, faixa') < 0) {
      throw new Error('dimensao sem recorte por modelo: ' + q.queryName);
    }
  });

return Q.map((q, i) => ({
  json: {
    queryName: q.queryName, database: q.database, sql: q.sql,
    pagina: q.pagina, idx: i, total: Q.length, page: PAGE,
    meta: {
      estudo: 'precificacao-09', amostra: AMOSTRA.nome,
      chave: AMOSTRA.chave,
      data_ini: DATA_INI, hoje: HOJE,
      corte_razao: AMOSTRA.corte_razao,
      grupos: AMOSTRA.modelos.length,
      excluidas: AMOSTRA.excluir_categorias,
      vendas_esperadas: AMOSTRA.vendas_esperadas,
      dimensoes: ['km', 'idade', 'uf', 'laudo'],
      idade: 'ano da venda menos model_year',
      laudo: 'vehicle_precautionary_reports.situation — LAUDO CAUTELAR, nao "status da documentacao" (esse campo nao existe no banco)',
      desagio: 'calculado no cliente: 1 - razao_media'
    }
  }
}));
