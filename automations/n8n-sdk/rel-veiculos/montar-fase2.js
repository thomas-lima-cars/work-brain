/* ══════════════════════════════════════════════════════════════════════
   NÓ "Montar Fase 2" — coleta dimensionada

   Lê da fase 1 quantos veículos e quantas lojas existem, e monta
   exatamente ceil(n / 50) páginas para cada conjunto. Nada de teto
   chutado: página que sobra custa um agregado completo e devolve zero.

   ⚠️ TODAS as consultas de loja sao dimensionadas pela MESMA contagem
   (q_lojas_total), entao todas precisam do MESMO filtro que ela. Filtrar
   so uma parte nao da erro: as outras batem no teto da paginacao e perdem
   as ultimas linhas em silencio. Aconteceu no run 50268.

   As duas consultas de MODA sao a excecao: elas podem passar do numero de
   lojas por empate no topo, entao levam folga (PAG_MODA) e sao conferidas
   por LOJA DISTINTA no Montar HTML.

   Dois conjuntos:

     A) os VEÍCULOS do evento — uma linha por negociação disponível, com
        valor (`value_actual`), modelo, categoria, ano, km, a loja vendedora
        e a UF **do pátio** (`shop_stocks`), não a do endereço da loja: o
        carro está fisicamente no estoque, e 68% dos veículos divergem entre
        as duas (sonda 50068). Traz também versão e uuid, que o Montar HTML
        usa para montar o link do anúncio.

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
/* o mesmo filtro de canal que dimensionou a q_lojas_total na fase 1 */
const SO_WL_LOJA = META_IN.so_wl_loja || '';

/* ── lê os totais da fase 1 ─────────────────────────────────────────── */
const pedidos1 = $('Montar Fase 1').all().map((i) => i.json);
const outs1 = $('MCP Fase 1').all();
/* ACUMULA todas as paginas da consulta, nao devolve a primeira.
   Bug achado na execucao 50105: o `return` ficava DENTRO do laco, entao
   consulta paginada era lida so ate a pagina 0. Com nove eventos os 71
   pares de q_evento_wl ainda cabiam em 50 linhas e ninguem viu; com a
   janela aberta (47 eventos) sumiam 21 pares de whitelabel -- e whitelabel
   e metade da regra de elegibilidade, entao os veiculos daqueles eventos
   virariam "sem loja elegivel", indistinguiveis de quem nao tem par mesmo.
   Quem pegou foi a conferencia contra q_evwl_total, nao o olho. */
function leitura(nome) {
  const linhas = [];
  for (let i = 0; i < pedidos1.length; i++) {
    if (pedidos1[i].queryName !== nome) continue;
    const o = outs1[i] ? outs1[i].json : null;
    const sc = o ? (o.structuredContent || o) : null;
    const cols = (sc && sc.columns) || [];
    const rows = (sc && sc.rows) || [];
    for (let r = 0; r < rows.length; r++) {
      const obj = {};
      for (let c = 0; c < cols.length; c++) obj[cols[c]] = rows[r][c];
      linhas.push(obj);
    }
  }
  return linhas;
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

/* q_evento_wl e paginada por numero escolhido na fase 1. Truncar ali nao da
   erro: o veiculo perde whitelabel e vira "sem loja elegivel", que na tela
   fica igual a um carro sem loja compativel de verdade. Entao confere. */
const EVWL_ESPERADO = Number((leitura('q_evwl_total')[0] || {}).pares);
if (Number.isFinite(EVWL_ESPERADO) && eventoWl.length !== EVWL_ESPERADO) {
  throw new Error('q_evento_wl veio incompleta: ' + eventoWl.length +
    ' pares evento x whitelabel de ' + EVWL_ESPERADO +
    '. Aumente as paginas dela na fase 1 (whitelabel e metade da regra de ' +
    'elegibilidade -- faltar par faz veiculo perder loja em silencio).');
}

const PAG_VEIC = Math.ceil(VEICULOS / PAGE);
const PAG_LOJAS = Math.ceil(LOJAS / PAGE);
/* As duas consultas de MODA sao as unicas que podem passar do numero de
   lojas: elas devolvem uma linha por (loja, item) empatado no topo, entao
   loja com empate rende mais de uma linha. No run 50270 as duas voltaram
   com exatos 1.300 = 26 x 50, batendo no teto -- sem folga nao da pra
   saber se aquilo era a contagem real ou corte.

   2 paginas de folga sao numero ESCOLHIDO, nao medido. O que torna a
   escolha segura e a conferencia de cobertura no Montar HTML, que compara
   as lojas distintas que chegaram contra q_moda_lojas. */
const PAG_MODA = PAG_LOJAS + 2;

const UF_CASE =
  "CASE WHEN UPPER(TRIM(sa.state)) IN ('SP','MG','PR','SC','RJ','GO','RS','BA','MT','DF','CE','MS','ES','PE','PA','SE','AM','MA','RN','PB','AL','PI','RO','TO','AP','AC','RR') THEN UPPER(TRIM(sa.state))" +
  " WHEN UPPER(TRIM(sa.state)) = 'S.P' THEN 'SP'" +
  " WHEN UPPER(TRIM(sa.state)) = 'RIO DE JANEIRO' THEN 'RJ'" +
  " WHEN UPPER(TRIM(sa.state)) = 'MATO GROSSO DO SUL' THEN 'MS'" +
  " WHEN UPPER(TRIM(sa.state)) LIKE 'ESPIRITO%SANTO%' THEN 'ES'" +
  " ELSE NULL END";

/* a UF do VEICULO sai do PATIO, nao do endereco da loja vendedora: o carro
   esta fisicamente no estoque (`shop_stocks`), e 68% dos veiculos tem UF de
   patio diferente da UF da loja (sonda 50068). UF e metade da regra de
   elegibilidade, entao isso decide quem pode aparecer pra quem.
   As 25 UFs medidas ja vem como sigla limpa, sem vazios -- a validacao
   abaixo e GUARDA, nao caminho: sujeira futura cai em 'Nao identificada' e
   aparece na tela em vez de virar UF fantasma. */
const UF_PATIO =
  "CASE WHEN UPPER(TRIM(ss.state)) IN ('SP','MG','PR','SC','RJ','GO','RS','BA','MT','DF','CE','MS','ES','PE','PA','SE','AM','MA','RN','PB','AL','PI','RO','TO','AP','AC','RR') THEN UPPER(TRIM(ss.state))" +
  " ELSE NULL END";

const JANELA =
  " o.deleted_at IS NULL AND o." + LADO + " IS NOT NULL" +
  " AND o.created_at >= '" + DATA_INI + "' AND o.price > 0";

/* O MESMO recorte de canal que a q_lojas_total usou pra dimensionar estas
   consultas. Sem ele, q_ofertas/q_perfil/q_modelo/q_categoria varrem o
   universo INTEIRO de lojas com paginacao dimensionada pelo universo
   FILTRADO -- e as ultimas linhas somem no teto. Foi o que aconteceu no
   run 50268: quatro consultas devolvendo exatos 1.300 = 26 x 50, e tres
   lojas ficando sem perfil.

   Montado uma vez so, de proposito: quatro copias do mesmo join e quatro
   chances de uma divergir das outras. */
const JOIN_LOJA_CANAL = SO_WL_LOJA
  ? " INNER JOIN shops s ON s.id = o." + LADO + " AND s.deleted_at IS NULL" + SO_WL_LOJA
  : "";

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
  " br.name AS marca, ve.name AS versao, a.uuid AS anuncio_uuid," +
  " v.model_year AS model_year, NULLIF(v.km, 0) AS km," +
  " an.status AS neg_status," +
  " a.shop_id AS loja_id, s.name AS loja_vendedora," +
  " COALESCE(" + UF_PATIO + ", 'Não identificada') AS uf" +
  " FROM " + ULTIMA_NEG +
  " INNER JOIN advertisement_negotiations an ON an.id = u.neg_id" +
  " INNER JOIN events e ON e.id = an.event_id" +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " INNER JOIN vehicles v ON v.id = u.vehicle_id AND v.deleted_at IS NULL" +
  " LEFT JOIN models mo ON mo.id = v.model_id" +
  " LEFT JOIN categories cat ON cat.id = v.category_id" +
  " LEFT JOIN brands br ON br.id = v.brand_id" +
  " LEFT JOIN versions ve ON ve.id = v.version_id" +
  " LEFT JOIN shops s ON s.id = a.shop_id" +
  /* os DOIS caminhos ate o patio estao preenchidos em 100% dos casos; o
     COALESCE prefere o do anuncio, que e o local de onde o carro esta
     sendo vendido naquele evento. shop_addresses saiu daqui: a UF da loja
     vendedora nao e mais lida, e join que ninguem le custa caro num
     agregado paginado. */
  " LEFT JOIN shop_stocks ss ON ss.id = COALESCE(a.shop_stock_id, v.shop_stock_id)" +
  " AND ss.deleted_at IS NULL" +
  " WHERE" + DISPONIVEL +
  " GROUP BY neg_id, evento_id, evento, fim_evento, anuncio_id, vehicle_id," +
  " valor, valor_inicial, fipe, model_id, modelo, category_id, categoria," +
  " marca, versao, anuncio_uuid, model_year, km, neg_status," +
  " loja_id, loja_vendedora, uf" +
  " ORDER BY an.id", PAG_VEIC);

/* ── B) perfil de compra das lojas (mesmas queries do LZL3mxfbMIz4avyx) ── */
push('q_lojas',
  "SELECT s.id AS shop_id, MAX(s.name) AS loja," +
  " MAX(s.whitelabel_id) AS whitelabel_id, MAX(w.name) AS whitelabel," +
  " COALESCE(MAX(" + UF_CASE + "), 'Não identificada') AS uf" +
  " FROM shops s" +
  " LEFT JOIN whitelabels w ON w.id = s.whitelabel_id" +
  " LEFT JOIN shop_addresses sa ON sa.shop_id = s.id AND sa.deleted_at IS NULL" +
  " WHERE s.deleted_at IS NULL" + SO_WL_LOJA +
  " AND EXISTS (SELECT 1 FROM offers o WHERE o." + LADO + " = s.id" +
  " AND o.deleted_at IS NULL AND o.created_at >= '" + DATA_INI + "' AND o.price > 0)" +
  " GROUP BY s.id ORDER BY s.id", PAG_LOJAS);

push('q_ofertas',
  "SELECT o." + LADO + " AS shop_id, COUNT(*) AS qt_ofertas" +
  " FROM offers o" + JOIN_LOJA_CANAL + " WHERE" + JANELA +
  " GROUP BY o." + LADO + " ORDER BY o." + LADO, PAG_LOJAS);

const ULTIMAS =
  "(SELECT o." + LADO + " AS shop_id, a.vehicle_id AS vehicle_id, MAX(o.id) AS offer_id" +
  " FROM offers o" + JOIN_LOJA_CANAL +
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
    " FROM offers o" + JOIN_LOJA_CANAL +
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
    " ORDER BY ag.shop_id, ag.item_id", PAG_MODA);
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
  /* o cabecalho do relatorio decide a frase do recorte por eventos_ids: com
     lista, as datas nao valem e anunciar janela seria mentira. Este no
     reconstroi o META do zero -- ja esqueci de repassar campo duas vezes, e
     as duas o efeito foi um valor `undefined` que ninguem viu. */
  eventos_ids: META_IN.eventos_ids,
  horas_adiante: META_IN.horas_adiante,
  whitelabels: META_IN.whitelabels,
  wl_esperado: META_IN.wl_esperado,
  wl_nomes_banco: leitura('q_wl_nomes'),
  moda_lojas: leitura('q_moda_lojas')[0] || {},
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
