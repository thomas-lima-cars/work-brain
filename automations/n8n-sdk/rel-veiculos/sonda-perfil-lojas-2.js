/* ═══════════════════════════════════════════════════════════════════════════
   SONDA 2 — as decisões do Thomas de 2026-09-11, e o que elas destravam

   Decisões tomadas depois da sonda 50346:
     1. "comprou" vira "ofertou" em todos os sete clusters
     2. horizonte de 12 meses aceito no lugar de "nunca"
     3. corte de outlier do deságio mantido (-100% a +95%)
     4. e-mail vem de `users` via `user_shops`
     5. `privative_number` entra no relatório

   A decisão 1 mata a dependência de `transactions` — ótimo, porque o
   domínio de `transactions.situation` continua indecifrado. Mas ela cria
   um problema NOVO, e é o principal motivo desta sonda:

   🚨 A BASE AVALIADA JÁ É "LOJAS COM OFERTA NOS ÚLTIMOS 6 MESES".
      Com "ofertou" no lugar de "comprou", toda loja da base cai no cluster
      1 ou 2 por definição, e os clusters 3 a 7 ficam VAZIOS — um campo que
      só tem dois valores possíveis não segmenta nada.

      `q_cluster_base` mede exatamente isso: se vier só 1 e 2, está provado.
      `q_cluster_universo` calcula a mesma regra sobre TODAS as lojas ativas
      dos seis canais, que é onde os sete clusters têm chance de existir.
      Com os dois números na mão dá pra decidir onde o campo faz sentido.

   O resto mede o que as outras decisões precisam:
     - `q_email_users`  : a decisão 4 vale a pena? (em `shops` era 5,8%)
     - `q_user_function`: `user_shops.function` diz qual usuário é o contato
     - `q_ofertas_horiz`: até onde vai o histórico de `offers` — "nunca
                          ofertou" tem o mesmo problema de horizonte que
                          "nunca acessou" tinha
     - `q_shops_situation`: o pedido diz "lojas (ativas)"; `shops.situation`
                          nunca foi decodificado

   ⚠️ NUNCA `SELECT *` em `vehicles` nem em `users`: as duas carregam PII.
   Aqui só entram contagens e colunas nomeadas — nenhum e-mail sai do banco
   nesta sonda, só quantos existem.
   ═══════════════════════════════════════════════════════════════════════════ */

const PAGE = 50;
const LADO = 'buyer_shop_id';
const MESES = 6;
const WHITELABELS = [4, 7, 43, 48, 62, 65];

const pad = (n) => String(n).padStart(2, '0');
const agora = new Date(Date.now() - 180 * 60000);   /* Brasília */
const ini = new Date(agora.getFullYear(), agora.getMonth() - MESES, agora.getDate());
const DATA_INI = ini.getFullYear() + '-' + pad(ini.getMonth() + 1) + '-' + pad(ini.getDate());
const HOJE = agora.getFullYear() + '-' + pad(agora.getMonth() + 1) + '-' + pad(agora.getDate());

const WL_IN = WHITELABELS.join(',');
const SO_WL = ' AND s.whitelabel_id IN (' + WL_IN + ')';

/* a loja pertence a base avaliada = ofertou na janela de 6 meses */
const NA_BASE =
  ' AND EXISTS (SELECT 1 FROM offers o WHERE o.' + LADO + ' = s.id' +
  " AND o.deleted_at IS NULL AND o.created_at >= '" + DATA_INI + "' AND o.price > 0)";

/* ── a regra dos sete clusters, com "ofertou" no lugar de "comprou" ─────
   Cascata: a primeira condicao que bate ganha, entao a ordem importa e e a
   ordem da tabela do Thomas. As duas datas entram por subconsulta
   correlacionada, que usa os indices de offers(buyer_shop_id) e
   access_logs(shop_id) -- varrer as duas tabelas inteiras com GROUP BY
   custaria muito mais. */
const ULT_OFERTA =
  '(SELECT MAX(o.created_at) FROM offers o WHERE o.' + LADO + ' = s.id' +
  ' AND o.deleted_at IS NULL AND o.price > 0)';
const ULT_ACESSO =
  '(SELECT MAX(al.created_at) FROM access_logs al WHERE al.shop_id = s.id)';

const CLUSTER =
  "CASE WHEN uo >= DATE_SUB('" + HOJE + "', INTERVAL 30 DAY) THEN 1" +
  " WHEN uo >= DATE_SUB('" + HOJE + "', INTERVAL 180 DAY) THEN 2" +
  " WHEN uo IS NOT NULL AND ua >= DATE_SUB('" + HOJE + "', INTERVAL 90 DAY) THEN 3" +
  ' WHEN uo IS NOT NULL THEN 4' +
  " WHEN ua >= DATE_SUB('" + HOJE + "', INTERVAL 90 DAY) THEN 5" +
  ' WHEN ua IS NOT NULL THEN 6' +
  ' ELSE 7 END';

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

/* ── 1. o cluster DENTRO da base avaliada ──────────────────────────────
   Previsao: so vem 1 e 2. Se vier, o campo nao segmenta a base e isso
   precisa ser dito antes de implementar, nao depois. */
push('q_cluster_base',
  'SELECT ' + CLUSTER + ' AS cluster, COUNT(*) AS lojas' +
  ' FROM (SELECT s.id AS id, ' + ULT_OFERTA + ' AS uo, ' + ULT_ACESSO + ' AS ua' +
  ' FROM shops s WHERE s.deleted_at IS NULL' + SO_WL + NA_BASE + ') x' +
  ' GROUP BY cluster ORDER BY cluster');

/* ── 2. o cluster sobre TODAS as lojas dos seis canais ─────────────────
   E aqui que os sete tem chance de existir. Pode estourar o deadline:
   ~21 mil lojas x 2 buscas indexadas. */
push('q_cluster_universo',
  'SELECT ' + CLUSTER + ' AS cluster, COUNT(*) AS lojas' +
  ' FROM (SELECT s.id AS id, ' + ULT_OFERTA + ' AS uo, ' + ULT_ACESSO + ' AS ua' +
  ' FROM shops s WHERE s.deleted_at IS NULL' + SO_WL + ') x' +
  ' GROUP BY cluster ORDER BY cluster');

/* ── 3. e-mail em users: a decisao 4 vale a pena? ──────────────────────
   Em `shops` o e-mail estava em 5,8%. Se aqui for alto, a troca de fonte
   se paga; se for baixo, o campo nao entra e e melhor saber agora. */
push('q_email_users',
  'SELECT COUNT(DISTINCT s.id) AS lojas_na_base,' +
  ' COUNT(DISTINCT us.shop_id) AS lojas_com_usuario,' +
  " COUNT(DISTINCT CASE WHEN TRIM(COALESCE(u.email, '')) <> ''" +
  ' THEN us.shop_id END) AS lojas_com_email,' +
  ' COUNT(DISTINCT u.id) AS usuarios,' +
  " COUNT(DISTINCT CASE WHEN TRIM(COALESCE(u.email, '')) <> ''" +
  ' THEN u.id END) AS usuarios_com_email' +
  ' FROM shops s' +
  ' LEFT JOIN user_shops us ON us.shop_id = s.id' +
  ' LEFT JOIN users u ON u.id = us.user_id AND u.deleted_at IS NULL' +
  ' WHERE s.deleted_at IS NULL' + SO_WL + NA_BASE);

/* ── 4. quantos usuarios por loja, e qual o papel de cada um ───────────
   Se a loja tem 8 usuarios, "o e-mail da loja" nao existe -- tem que
   haver regra de escolha. `function` e MEDIUMINT sem dominio documentado. */
push('q_user_function',
  'SELECT us.function AS funcao, COUNT(*) AS vinculos,' +
  ' COUNT(DISTINCT us.shop_id) AS lojas,' +
  " COUNT(DISTINCT CASE WHEN TRIM(COALESCE(u.email, '')) <> ''" +
  ' THEN us.user_id END) AS usuarios_com_email' +
  ' FROM user_shops us' +
  ' INNER JOIN shops s ON s.id = us.shop_id AND s.deleted_at IS NULL' + SO_WL +
  ' LEFT JOIN users u ON u.id = us.user_id AND u.deleted_at IS NULL' +
  ' GROUP BY us.function ORDER BY vinculos DESC');

/* ── 5. ate onde vai o historico de offers ─────────────────────────────
   "nunca ofertou" tem o mesmo problema de horizonte que "nunca acessou":
   se offers so tiver 12 meses, o cluster 7 e uma promessa que o dado nao
   sustenta. access_logs comeca em 2025-08-31. */
push('q_ofertas_horiz',
  'SELECT COUNT(*) AS ofertas, MIN(o.created_at) AS mais_antiga,' +
  ' MAX(o.created_at) AS mais_recente,' +
  ' COUNT(DISTINCT o.' + LADO + ') AS lojas_que_ja_ofertaram' +
  ' FROM offers o WHERE o.deleted_at IS NULL AND o.price > 0');

/* ── 6. "lojas (ativas)": o que shops.situation quer dizer ─────────────── */
push('q_shops_situation',
  'SELECT s.situation AS situation, COUNT(*) AS lojas,' +
  ' COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM offers o' +
  ' WHERE o.' + LADO + ' = s.id AND o.deleted_at IS NULL' +
  " AND o.created_at >= '" + DATA_INI + "') THEN s.id END) AS com_oferta_6m" +
  ' FROM shops s WHERE s.deleted_at IS NULL' + SO_WL +
  ' GROUP BY s.situation ORDER BY lojas DESC');

/* ── guardas: os limites medidos do MCP ────────────────────────────────── */
function temJanela(sql) {
  return sql.indexOf('OVER (') >= 0 || sql.indexOf('OVER(') >= 0;
}
/* Guarda de SQL malformado. `node --check` valida o JAVASCRIPT; a SQL viaja
   dentro de uma string e nenhum validador local olha pra ela. A sonda 1
   nasceu com um `COALESCE(x,, )` que passou no node --check e so morreria no
   banco, depois da chamada gasta.
   NAO conferir `()` vazio: NOW() e CURDATE() sao SQL legitima. */
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
