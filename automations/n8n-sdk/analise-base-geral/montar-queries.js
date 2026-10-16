/* Montar Queries — uma bateria de consultas por canal (whitelabel).
   Base de cliente = a mesma do relatorio do C6 Lojista (filtro unificado com o
   Power BI, 28/09), trocando so o whitelabel. No canal de colaboradores (48) o
   e-mail @c6bank.com NAO sai: la o funcionario e o cliente.
   O servico MCP corta em 50 linhas por chamada, sem aviso. Nenhuma consulta
   abaixo passa disso (maior: uf, 28 estados + "nao identificada"). */
const CANAIS = [
  { wl: 7,  nome: 'Marketplace Cars2You' },
  { wl: 48, nome: 'Colaboradores C6' },
  { wl: 43, nome: 'Canal de vendas C6 Auto' },
  { wl: 4,  nome: 'Trucks2you' },
  { wl: 65, nome: 'Lance Fácil BTB Associados' },
  { wl: 62, nome: 'Lance Fácil BTB' }
];

/* Relogio de Brasilia: o n8n roda em UTC, e depois das 21h o "hoje" viraria amanha */
const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
const pad = (n) => String(n).padStart(2, '0');
const ini = new Date(now.getFullYear(), now.getMonth() - 11, 1);
const MES_INICIO = ini.getFullYear() + '-' + pad(ini.getMonth() + 1);
const fim = new Date(now.getFullYear(), now.getMonth() + 1, 1);
const MES_FIM_EXCL = fim.getFullYear() + '-' + pad(fim.getMonth() + 1);

const UF_CASE = "CASE WHEN UPPER(TRIM(sa.state)) IN ('SP','MG','PR','SC','RJ','GO','RS','BA','MT','DF','CE','MS','ES','PE','PA','SE','AM','MA','RN','PB','AL','PI','RO','TO','AP','AC','RR') THEN UPPER(TRIM(sa.state)) WHEN UPPER(TRIM(sa.state)) = 'S.P' THEN 'SP' WHEN UPPER(TRIM(sa.state)) = 'RIO DE JANEIRO' THEN 'RJ' WHEN UPPER(TRIM(sa.state)) = 'MATO GROSSO DO SUL' THEN 'MS' WHEN UPPER(TRIM(sa.state)) LIKE 'ESPIRITO%SANTO%' THEN 'ES' ELSE NULL END";

const COMPRA = "advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id";
const Q = [];

CANAIS.forEach(function (c) {
  const EXCL = c.wl === 48
    ? '@cars2you|@datapage|@icarros|@itau|@teste|@dnr|@netcarros|@maisquecliente|@dealersclub'
    : '@cars2you|@datapage|@icarros|@itau|@teste|@dnr|@netcarros|@maisquecliente|@dealersclub|@c6bank[.]com';
  const BASE = "SELECT u.id as user_id FROM users u INNER JOIN user_whitelabels uw ON uw.user_id = u.id AND uw.whitelabel_id = " + c.wl + " WHERE u.deleted_at IS NULL AND u.internal_user = 0 AND u.email NOT REGEXP '(" + EXCL + ")' AND NOT EXISTS(SELECT 1 FROM user_clients_group ucg0 WHERE ucg0.user_id = u.id AND ucg0.client_group_id = 7)";
  const IN_BASE = "(SELECT user_id FROM (" + BASE + ") bb)";
  const push = function (queryName, sql) { Q.push({ queryName: queryName, wl: c.wl, canal: c.nome, database: 'cars2you_production', sql: sql }); };
  const faixa = function (col) { return "CASE WHEN DATEDIFF(NOW(), " + col + ") BETWEEN 0 AND 30 THEN '00-30d' WHEN DATEDIFF(NOW(), " + col + ") BETWEEN 31 AND 90 THEN '31-90d' WHEN DATEDIFF(NOW(), " + col + ") BETWEEN 91 AND 180 THEN '91-180d' ELSE '180d+' END"; };

  push('kpi',
    "SELECT " +
    "(SELECT COUNT(*) FROM (" + BASE + ") t) as total_base, " +
    "(SELECT COUNT(DISTINCT ua.user_id) FROM user_access ua WHERE ua.user_id IN " + IN_BASE + ") as com_login, " +
    "(SELECT COUNT(DISTINCT o.buyer_user_id) FROM offers o WHERE o.deleted_at IS NULL AND o.buyer_user_id IN " + IN_BASE + ") as ofertantes, " +
    "(SELECT COUNT(*) FROM offers o WHERE o.deleted_at IS NULL AND o.buyer_user_id IN " + IN_BASE + ") as total_ofertas, " +
    "(SELECT COUNT(DISTINCT o.buyer_user_id) FROM " + COMPRA + " WHERE an.status IN (2,3,7) AND o.buyer_user_id IN " + IN_BASE + ") as compradores, " +
    "(SELECT COUNT(DISTINCT an.id) FROM " + COMPRA + " WHERE an.status IN (2,3,7) AND o.buyer_user_id IN " + IN_BASE + ") as negociacoes, " +
    "(SELECT SUM(o.price) FROM " + COMPRA + " WHERE an.status IN (2,3,7) AND o.buyer_user_id IN " + IN_BASE + ") as volume, " +
    "(SELECT MAX(an.finish_date_offer) FROM " + COMPRA + " WHERE an.status IN (2,3,7) AND o.buyer_user_id IN " + IN_BASE + ") as ultima_compra");

  push('situacao',
    "SELECT u.situation, COUNT(*) as qtd FROM users u WHERE u.id IN " + IN_BASE + " GROUP BY u.situation ORDER BY u.situation");

  push('recencia',
    "SELECT 'login' as tipo, faixa, COUNT(*) as qtd FROM (SELECT " + faixa('ul') + " as faixa FROM (SELECT ua.user_id, MAX(ua.created_at) as ul FROM user_access ua WHERE ua.user_id IN " + IN_BASE + " GROUP BY ua.user_id) t) x GROUP BY faixa " +
    "UNION ALL " +
    "SELECT 'oferta' as tipo, faixa, COUNT(*) as qtd FROM (SELECT " + faixa('ul') + " as faixa FROM (SELECT o.buyer_user_id, MAX(o.created_at) as ul FROM offers o WHERE o.deleted_at IS NULL AND o.buyer_user_id IN " + IN_BASE + " GROUP BY o.buyer_user_id) t) x GROUP BY faixa " +
    "UNION ALL " +
    "SELECT 'compra' as tipo, faixa, COUNT(*) as qtd FROM (SELECT " + faixa('ul') + " as faixa FROM (SELECT o.buyer_user_id, MAX(an.finish_date_offer) as ul FROM " + COMPRA + " WHERE an.status IN (2,3,7) AND o.buyer_user_id IN " + IN_BASE + " GROUP BY o.buyer_user_id) t) x GROUP BY faixa");

  push('evol_login',
    "SELECT DATE_FORMAT(ua.created_at,'%Y-%m') as mes, COUNT(DISTINCT ua.user_id) as unicos FROM user_access ua WHERE ua.user_id IN " + IN_BASE + " AND ua.created_at >= '" + MES_INICIO + "-01' AND ua.created_at < '" + MES_FIM_EXCL + "-01' GROUP BY mes ORDER BY mes");
  push('evol_oferta',
    "SELECT DATE_FORMAT(o.created_at,'%Y-%m') as mes, COUNT(DISTINCT o.buyer_user_id) as unicos FROM offers o WHERE o.deleted_at IS NULL AND o.buyer_user_id IN " + IN_BASE + " AND o.created_at >= '" + MES_INICIO + "-01' AND o.created_at < '" + MES_FIM_EXCL + "-01' GROUP BY mes ORDER BY mes");
  push('evol_compra',
    "SELECT DATE_FORMAT(an.finish_date_offer,'%Y-%m') as mes, COUNT(DISTINCT o.buyer_user_id) as unicos, COUNT(DISTINCT an.id) as qtd, SUM(o.price) as volume FROM " + COMPRA + " WHERE an.status IN (2,3,7) AND o.buyer_user_id IN " + IN_BASE + " AND an.finish_date_offer >= '" + MES_INICIO + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCL + "-01' GROUP BY mes ORDER BY mes");
  push('evol_cadastro',
    "SELECT DATE_FORMAT(u.created_at,'%Y-%m') as mes, COUNT(*) as qtd FROM users u WHERE u.id IN " + IN_BASE + " AND u.created_at >= '" + MES_INICIO + "-01' AND u.created_at < '" + MES_FIM_EXCL + "-01' GROUP BY mes ORDER BY mes");

  /* "novos" = quem fez aquilo pela PRIMEIRA vez na vida naquele mes */
  push('nov_login',
    "SELECT mes, COUNT(*) as novos FROM (SELECT DATE_FORMAT(MIN(ua.created_at),'%Y-%m') as mes FROM user_access ua WHERE ua.user_id IN " + IN_BASE + " GROUP BY ua.user_id) t WHERE mes >= '" + MES_INICIO + "' GROUP BY mes ORDER BY mes");
  push('nov_oferta',
    "SELECT mes, COUNT(*) as novos FROM (SELECT DATE_FORMAT(MIN(o.created_at),'%Y-%m') as mes FROM offers o WHERE o.deleted_at IS NULL AND o.buyer_user_id IN " + IN_BASE + " GROUP BY o.buyer_user_id) t WHERE mes >= '" + MES_INICIO + "' GROUP BY mes ORDER BY mes");
  push('nov_compra',
    "SELECT mes, COUNT(*) as novos FROM (SELECT DATE_FORMAT(MIN(an.finish_date_offer),'%Y-%m') as mes FROM " + COMPRA + " WHERE an.status IN (2,3,7) AND o.buyer_user_id IN " + IN_BASE + " GROUP BY o.buyer_user_id) t WHERE mes >= '" + MES_INICIO + "' GROUP BY mes ORDER BY mes");

  push('top',
    "SELECT u.id, u.full_name as nome, (SELECT s.name FROM user_shops us INNER JOIN shops s ON s.id = us.shop_id WHERE us.user_id = u.id ORDER BY us.created_at LIMIT 1) as loja, COUNT(DISTINCT an.id) as compras, SUM(o.price) as valor, MAX(an.finish_date_offer) as ultima FROM " + COMPRA + " INNER JOIN users u ON u.id = o.buyer_user_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN " + IN_BASE + " GROUP BY u.id, u.full_name ORDER BY compras DESC LIMIT 10");

  push('uf',
    "SELECT COALESCE(ufn.uf_norm, 'Nao identificada') as uf, COUNT(DISTINCT b.user_id) as qtd FROM (" + BASE + ") b LEFT JOIN (SELECT DISTINCT us.user_id, " + UF_CASE + " as uf_norm FROM user_shops us INNER JOIN shop_addresses sa ON sa.shop_id = us.shop_id AND sa.deleted_at IS NULL) ufn ON ufn.user_id = b.user_id AND ufn.uf_norm IS NOT NULL GROUP BY uf ORDER BY qtd DESC");

  /* Coorte de cadastro — as definicoes de acesso/oferta/compra sao as mesmas do resto */
  const BASE_COORTE = "(" + BASE.replace("SELECT u.id as user_id FROM", "SELECT u.id, u.created_at FROM") + ")";
  const D_ACESSO = "(SELECT ua.user_id AS uid, MIN(ua.created_at) AS d1 FROM user_access ua GROUP BY ua.user_id)";
  const D_OFERTA = "(SELECT o.buyer_user_id AS uid, MIN(o.created_at) AS d1 FROM offers o WHERE o.deleted_at IS NULL GROUP BY o.buyer_user_id)";
  const D_COMPRA = "(SELECT o.buyer_user_id AS uid, MIN(an.finish_date_offer) AS d1 FROM advertisement_negotiations an INNER JOIN offers o ON o.id = an.offer_actual_id WHERE an.status IN (2,3,7) GROUP BY o.buyer_user_id)";
  const JOINS = " FROM " + BASE_COORTE + " b LEFT JOIN " + D_ACESSO + " ac ON ac.uid = b.id LEFT JOIN " + D_OFERTA + " o1 ON o1.uid = b.id LEFT JOIN " + D_COMPRA + " c1 ON c1.uid = b.id WHERE b.created_at >= '" + MES_INICIO + "-01' GROUP BY mes ORDER BY mes";
  const jan = function (alias, pre) {
    return [30, 60, 90, 180].map(function (n) { return "SUM(CASE WHEN DATEDIFF(" + alias + ".d1,b.created_at) <= " + n + " THEN 1 ELSE 0 END) AS " + pre + n; }).join(', ');
  };

  push('coorte_acum',
    "SELECT DATE_FORMAT(b.created_at,'%Y-%m') AS mes, COUNT(*) AS cadastrados, " +
    "SUM(CASE WHEN ac.uid IS NOT NULL THEN 1 ELSE 0 END) AS acessaram, " +
    "SUM(CASE WHEN o1.uid IS NOT NULL THEN 1 ELSE 0 END) AS ofertaram, " +
    "SUM(CASE WHEN c1.uid IS NOT NULL THEN 1 ELSE 0 END) AS compraram, " +
    "SUM(CASE WHEN ac.uid IS NULL THEN 1 ELSE 0 END) AS sem_interacao" + JOINS);
  push('coorte_janela',
    "SELECT DATE_FORMAT(b.created_at,'%Y-%m') AS mes, COUNT(*) AS cadastrados, " +
    jan('ac', 'ac') + ", " + jan('o1', 'of') + ", " + jan('c1', 'cp') + ", " +
    [30, 60, 90, 180].map(function (n) { return "SUM(CASE WHEN DATEDIFF(NOW(), b.created_at) >= " + n + " THEN 1 ELSE 0 END) AS mad" + n; }).join(', ') + JOINS);
});

return Q.map(function (q) { return { json: q }; });
