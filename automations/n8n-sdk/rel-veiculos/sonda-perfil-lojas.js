/* ═══════════════════════════════════════════════════════════════════════════
   SONDA — os cinco pedidos de 2026-09-11 para o perfil das lojas

   Vai no nó de queries da sonda `a6fNNTUYYayehNIn`.

   Nenhum dos cinco pode ser escrito por chute:

     1. % DESÁGIO. Existem TRÊS colunas de FIPE (`vehicles.fipe_price`,
        `advertisements.fipe_price`, `versions.code_fipe`) e NENHUMA tabela
        de preço FIPE por código — o "valor fipe por código fipe" pedido só
        existe se uma dessas estiver preenchida. `q_fipe` mede as três.
        E o pedido diz "maior oferta" numa frase e "última oferta" na outra:
        `q_desagio` calcula as DUAS para o Thomas escolher pelo número.

     2. % OFERTAS NA MESMA UF. A UF do veículo é a do PÁTIO (decisão de
        10/09), a da loja é a do endereço. `q_uf` mede o cruzamento e,
        principalmente, quanta oferta fica SEM uma das duas pontas.

     3. % POR STATUS DE LAUDO. `vehicle_precautionary_reports.situation` é
        VARCHAR e o domínio nunca foi medido — está na lista de "ainda sem
        decodificar" do `dominios.md`. `q_laudo_dom` abre o domínio,
        `q_laudo_cob` mede quantos veículos ofertados têm laudo.

     4. CONTATO. Mora em `shops` (comercial/privativo, e-mail e telefone).
        `q_contato` mede preenchimento — coluna vazia em 90% das lojas é
        coluna que não vale a pena colocar na tela.

     5. CLUSTER. Precisa de duas datas que o relatório nunca usou: última
        COMPRA e último ACESSO. Compra = `transactions` (domínio de
        `situation` desconhecido → `q_compras_dom`). Acesso = `access_logs`
        (tem `shop_id`) ou `user_access` via `user_shops` — `q_acesso_*`
        medem qual dos dois está preenchido e até onde vai o histórico.
        ⚠️ Se o histórico de acesso não alcançar 90 dias, os clusters 3 a 7
        não são calculáveis como escritos.

   ⚠️ NUNCA `SELECT *` em `vehicles`: a tabela tem placa, chassi e renavam, e
   a saída da execução fica em disco. Aqui só entram colunas nomeadas.

   As consultas de acesso vêm em duas versões: uma sobre a base inteira e
   uma sobre 20 lojas conhecidas. Se a primeira estourar o deadline de 60s,
   a segunda ainda responde — `access_logs` registra TODA rota acessada e
   pode ser enorme.
   ═══════════════════════════════════════════════════════════════════════════ */

const PAGE = 50;
const LADO = 'buyer_shop_id';
const MESES = 6;
const WHITELABELS = [4, 7, 43, 48, 62, 65];

/* 20 lojas reais da base, colhidas do dados-49803: as 10 com mais oferta e
   10 do meio da distribuição. Servem de plano B indexado para as consultas
   de acesso. */
const LOJAS_AMOSTRA = [15769, 109848, 104700, 31576, 15183, 38751, 107866, 850, 28904, 13366,
                       102957, 108622, 110237, 110457, 111070, 111860, 112204, 112563, 15906, 24018];

const pad = (n) => String(n).padStart(2, '0');
const agora = new Date(Date.now() - 180 * 60000);   /* Brasília, como nos outros nós */
const ini = new Date(agora.getFullYear(), agora.getMonth() - MESES, agora.getDate());
const DATA_INI = ini.getFullYear() + '-' + pad(ini.getMonth() + 1) + '-' + pad(ini.getDate());
const HOJE = agora.getFullYear() + '-' + pad(agora.getMonth() + 1) + '-' + pad(agora.getDate());

const WL_IN = WHITELABELS.join(',');
const SO_WL_LOJA = ' AND s.whitelabel_id IN (' + WL_IN + ')';
const JOIN_LOJA = ' INNER JOIN shops s ON s.id = o.' + LADO +
                  ' AND s.deleted_at IS NULL' + SO_WL_LOJA;

const JANELA = ' o.deleted_at IS NULL AND o.' + LADO + ' IS NOT NULL' +
               " AND o.created_at >= '" + DATA_INI + "' AND o.price > 0";

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

/* ── 1. FIPE: qual das três colunas existe de verdade? ─────────────────── */
push('q_fipe',
  'SELECT COUNT(*) AS ofertas,' +
  ' COUNT(DISTINCT a.vehicle_id) AS veiculos,' +
  ' SUM(CASE WHEN v.fipe_price > 0 THEN 1 ELSE 0 END) AS fipe_no_veiculo,' +
  ' SUM(CASE WHEN a.fipe_price > 0 THEN 1 ELSE 0 END) AS fipe_no_anuncio,' +
  " SUM(CASE WHEN TRIM(COALESCE(ve.code_fipe, '')) <> '' THEN 1 ELSE 0 END) AS com_codigo_fipe," +
  ' SUM(CASE WHEN v.fipe_price > 0 AND a.fipe_price > 0' +
  ' AND ABS(v.fipe_price - a.fipe_price) > 1 THEN 1 ELSE 0 END) AS as_duas_divergem' +
  ' FROM offers o' + JOIN_LOJA +
  ' INNER JOIN advertisements a ON a.id = o.advertisement_id AND a.deleted_at IS NULL' +
  ' INNER JOIN vehicles v ON v.id = a.vehicle_id AND v.deleted_at IS NULL' +
  ' LEFT JOIN versions ve ON ve.id = v.version_id' +
  ' WHERE' + JANELA);

/* ── 2. DESÁGIO: "maior oferta" e "última oferta" lado a lado ──────────── */
const PARES =
  '(SELECT o.' + LADO + ' AS shop_id, a.vehicle_id AS vehicle_id,' +
  ' MAX(o.id) AS ultima_id, MAX(o.price) AS maior_preco' +
  ' FROM offers o' + JOIN_LOJA +
  ' INNER JOIN advertisements a ON a.id = o.advertisement_id AND a.deleted_at IS NULL' +
  ' WHERE' + JANELA +
  ' GROUP BY o.' + LADO + ', a.vehicle_id) u';

push('q_desagio',
  'SELECT COUNT(*) AS pares,' +
  ' SUM(CASE WHEN v.fipe_price > 0 THEN 1 ELSE 0 END) AS pares_com_fipe,' +
  ' ROUND(AVG(CASE WHEN v.fipe_price > 0 THEN 100 * (1 - ult.price / v.fipe_price) END), 2) AS desagio_ultima,' +
  ' ROUND(AVG(CASE WHEN v.fipe_price > 0 THEN 100 * (1 - u.maior_preco / v.fipe_price) END), 2) AS desagio_maior,' +
  ' SUM(CASE WHEN v.fipe_price > 0 AND ult.price <> u.maior_preco THEN 1 ELSE 0 END) AS ultima_difere_da_maior,' +
  ' ROUND(MIN(CASE WHEN v.fipe_price > 0 THEN 100 * (1 - ult.price / v.fipe_price) END), 2) AS desagio_min,' +
  ' ROUND(MAX(CASE WHEN v.fipe_price > 0 THEN 100 * (1 - ult.price / v.fipe_price) END), 2) AS desagio_max' +
  ' FROM ' + PARES +
  ' INNER JOIN offers ult ON ult.id = u.ultima_id' +
  ' INNER JOIN vehicles v ON v.id = u.vehicle_id AND v.deleted_at IS NULL');

/* ── 3. UF: oferta na mesma UF da loja ─────────────────────────────────── */
push('q_uf',
  'SELECT COUNT(*) AS ofertas,' +
  " SUM(CASE WHEN TRIM(COALESCE(ss.state, '')) <> '' THEN 1 ELSE 0 END) AS com_uf_patio," +
  " SUM(CASE WHEN TRIM(COALESCE(sa.state, '')) <> '' THEN 1 ELSE 0 END) AS com_uf_loja," +
  ' SUM(CASE WHEN UPPER(TRIM(ss.state)) = UPPER(TRIM(sa.state))' +
  " AND TRIM(COALESCE(ss.state, '')) <> '' THEN 1 ELSE 0 END) AS mesma_uf," +
  ' COUNT(DISTINCT o.' + LADO + ') AS lojas' +
  ' FROM offers o' + JOIN_LOJA +
  ' INNER JOIN advertisements a ON a.id = o.advertisement_id AND a.deleted_at IS NULL' +
  ' LEFT JOIN vehicles v ON v.id = a.vehicle_id' +
  ' LEFT JOIN shop_stocks ss ON ss.id = COALESCE(a.shop_stock_id, v.shop_stock_id)' +
  ' LEFT JOIN shop_addresses sa ON sa.shop_id = o.' + LADO + ' AND sa.deleted_at IS NULL' +
  ' WHERE' + JANELA);

/* ── 4. LAUDO CAUTELAR: o domínio, que ninguém mediu ───────────────────── */
push('q_laudo_dom',
  "SELECT COALESCE(NULLIF(TRIM(vpr.situation), ''), '(vazio ou nulo)') AS situation, COUNT(*) AS n," +
  ' COUNT(DISTINCT vpr.vehicle_id) AS veiculos,' +
  ' MIN(vpr.created_at) AS mais_antigo, MAX(vpr.created_at) AS mais_recente' +
  ' FROM vehicle_precautionary_reports vpr' +
  ' WHERE vpr.deleted_at IS NULL' +
  ' GROUP BY vpr.situation ORDER BY n DESC');

/* ── 5. LAUDO: cobertura nos veículos que a base oferta ────────────────── */
push('q_laudo_cob',
  'SELECT COUNT(DISTINCT a.vehicle_id) AS veiculos_ofertados,' +
  ' COUNT(DISTINCT CASE WHEN vpr.id IS NOT NULL THEN a.vehicle_id END) AS com_laudo,' +
  ' COUNT(DISTINCT CASE WHEN vpr.id IS NULL THEN a.vehicle_id END) AS sem_laudo' +
  ' FROM offers o' + JOIN_LOJA +
  ' INNER JOIN advertisements a ON a.id = o.advertisement_id AND a.deleted_at IS NULL' +
  ' LEFT JOIN vehicle_precautionary_reports vpr' +
  ' ON vpr.vehicle_id = a.vehicle_id AND vpr.deleted_at IS NULL' +
  ' WHERE' + JANELA);

/* ── 6. CONTATO: preenchimento das cinco colunas ───────────────────────── */
push('q_contato',
  'SELECT COUNT(*) AS lojas,' +
  " SUM(CASE WHEN TRIM(COALESCE(s.comercial_email, '')) <> '' THEN 1 ELSE 0 END) AS email_comercial," +
  " SUM(CASE WHEN TRIM(COALESCE(s.privative_email, '')) <> '' THEN 1 ELSE 0 END) AS email_privativo," +
  " SUM(CASE WHEN TRIM(COALESCE(s.whatsapp_number, '')) <> '' THEN 1 ELSE 0 END) AS whatsapp," +
  " SUM(CASE WHEN TRIM(COALESCE(s.comercial_number, '')) <> '' THEN 1 ELSE 0 END) AS tel_comercial," +
  " SUM(CASE WHEN TRIM(COALESCE(s.privative_number, '')) <> '' THEN 1 ELSE 0 END) AS tel_privativo" +
  ' FROM shops s' +
  ' WHERE s.deleted_at IS NULL' + SO_WL_LOJA +
  ' AND EXISTS (SELECT 1 FROM offers o WHERE o.' + LADO + ' = s.id' +
  " AND o.deleted_at IS NULL AND o.created_at >= '" + DATA_INI + "' AND o.price > 0)");

/* ── 7. COMPRA: o domínio de transactions.situation ────────────────────── */
push('q_compras_dom',
  'SELECT t.situation AS situation, COUNT(*) AS n,' +
  ' COUNT(DISTINCT t.buyer_shop_id) AS lojas,' +
  ' MIN(t.created_at) AS mais_antiga, MAX(t.created_at) AS mais_recente' +
  ' FROM transactions t' +
  ' GROUP BY t.situation ORDER BY n DESC');

/* ── 8. COMPRA: recência por loja da base (as faixas do cluster) ───────── */
push('q_compras_base',
  'SELECT COUNT(DISTINCT s.id) AS lojas_na_base,' +
  ' COUNT(DISTINCT t.buyer_shop_id) AS lojas_que_compraram,' +
  " COUNT(DISTINCT CASE WHEN t.created_at >= DATE_SUB('" + HOJE + "', INTERVAL 30 DAY)" +
  ' THEN t.buyer_shop_id END) AS compra_30d,' +
  " COUNT(DISTINCT CASE WHEN t.created_at >= DATE_SUB('" + HOJE + "', INTERVAL 180 DAY)" +
  ' THEN t.buyer_shop_id END) AS compra_180d' +
  ' FROM shops s' +
  ' LEFT JOIN transactions t ON t.buyer_shop_id = s.id' +
  ' WHERE s.deleted_at IS NULL' + SO_WL_LOJA);

/* ── 9. ACESSO: access_logs sobre a base inteira (pode estourar 60s) ───── */
push('q_acesso_base',
  'SELECT COUNT(DISTINCT al.shop_id) AS lojas_com_acesso,' +
  ' MIN(al.created_at) AS mais_antigo, MAX(al.created_at) AS mais_recente' +
  ' FROM access_logs al' +
  ' INNER JOIN shops s ON s.id = al.shop_id AND s.deleted_at IS NULL' + SO_WL_LOJA);

/* ── 10. ACESSO: plano B indexado, 20 lojas conhecidas ─────────────────── */
push('q_acesso_amostra',
  'SELECT al.shop_id AS shop_id, COUNT(*) AS acessos,' +
  ' MIN(al.created_at) AS primeiro, MAX(al.created_at) AS ultimo' +
  ' FROM access_logs al' +
  ' WHERE al.shop_id IN (' + LOJAS_AMOSTRA.join(',') + ')' +
  ' GROUP BY al.shop_id ORDER BY al.shop_id');

/* ── 11. ACESSO: a outra fonte possível, user_access via user_shops ────── */
push('q_acesso_user',
  'SELECT us.shop_id AS shop_id, COUNT(*) AS acessos,' +
  ' MIN(ua.created_at) AS primeiro, MAX(ua.created_at) AS ultimo' +
  ' FROM user_shops us' +
  ' INNER JOIN user_access ua ON ua.user_id = us.user_id' +
  ' WHERE us.shop_id IN (' + LOJAS_AMOSTRA.join(',') + ')' +
  ' GROUP BY us.shop_id ORDER BY us.shop_id');

/* ── guardas: os limites medidos do MCP ────────────────────────────────── */
function temJanela(sql) {
  return sql.indexOf('OVER (') >= 0 || sql.indexOf('OVER(') >= 0;
}
/* Guarda de SQL malformado. `node --check` valida o JAVASCRIPT; a SQL viaja
   dentro de uma string e nenhum validador local olha pra ela. Esta sonda
   nasceu com um `COALESCE(x,, )` que passou no node --check e so morreria
   no banco, depois da chamada gasta. Virgula dupla, virgula antes de fechar
   e parentese so com espaco cobrem o erro de digitacao tipico.
   NAO conferir `()` vazio: NOW(), CURDATE() e UUID() sao SQL legitima, e
   guarda que dispara no certo e pior que guarda nenhuma. */
const malformadas = Q.filter((q) =>
  q.sql.indexOf(',,') >= 0 || q.sql.indexOf('( )') >= 0 || q.sql.indexOf(',)') >= 0);
if (malformadas.length) {
  throw new Error('SQL malformada em: ' + malformadas.map((q) => q.queryName).join(', '));
}

const comJanela = Q.filter((q) => temJanela(q.sql));
if (comJanela.length) throw new Error('funcao de janela: o MCP rejeita');
if (PAGE > 50) throw new Error('PAGE > 50: o MCP corta em 50 linhas');

return Q.map((q, i) => ({
  json: {
    queryName: q.queryName, database: q.database, sql: q.sql,
    pagina: q.pagina, idx: i, total: Q.length, page: PAGE,
    meta: { data_ini: DATA_INI, hoje: HOJE, lado: LADO, whitelabels: WHITELABELS }
  }
}));
