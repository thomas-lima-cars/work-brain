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
/* Indice do mes na janela (0 = mais antigo, 11 = corrente): vai no pacote no
   lugar do texto 'AAAA-MM', que repetido em 25 mil linhas pesa */
const MI = function (col) { return "PERIOD_DIFF(DATE_FORMAT(" + col + ",'%Y%m'), " + MES_INICIO.replace('-', '') + ")"; };
const fmtDia = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const DIA_INI = fmtDia(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 29));
const DIA_FIM_EXCL = fmtDia(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1));

/* Fim de cada mes da janela, para a base acumulada. O mes corrente fecha HOJE,
   senao a ultima barra contaria dias que ainda nao aconteceram. */
const MESES_UNION = '(' + Array.from({ length: 12 }, function (_, k) {
  const i = 11 - k;
  const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
  const ud = i === 0 ? hoje : new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return "SELECT '" + d.getFullYear() + '-' + pad(d.getMonth() + 1) + "' AS mes, '" + fmtDia(ud) + " 23:59:59' AS fim";
}).join(' UNION ALL ') + ')';

const UF_CASE = "CASE WHEN UPPER(TRIM(sa.state)) IN ('SP','MG','PR','SC','RJ','GO','RS','BA','MT','DF','CE','MS','ES','PE','PA','SE','AM','MA','RN','PB','AL','PI','RO','TO','AP','AC','RR') THEN UPPER(TRIM(sa.state)) WHEN UPPER(TRIM(sa.state)) = 'S.P' THEN 'SP' WHEN UPPER(TRIM(sa.state)) = 'RIO DE JANEIRO' THEN 'RJ' WHEN UPPER(TRIM(sa.state)) = 'MATO GROSSO DO SUL' THEN 'MS' WHEN UPPER(TRIM(sa.state)) LIKE 'ESPIRITO%SANTO%' THEN 'ES' ELSE NULL END";

const COMPRA = "advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id";
const Q = [];

const baseDe = function (wl) {
  const EXCL = wl === 48
    ? '@cars2you|@datapage|@icarros|@itau|@teste|@dnr|@netcarros|@maisquecliente|@dealersclub'
    : '@cars2you|@datapage|@icarros|@itau|@teste|@dnr|@netcarros|@maisquecliente|@dealersclub|@c6bank[.]com';
  return "SELECT u.id as user_id FROM users u INNER JOIN user_whitelabels uw ON uw.user_id = u.id AND uw.whitelabel_id = " + wl + " WHERE u.deleted_at IS NULL AND u.internal_user = 0 AND u.email NOT REGEXP '(" + EXCL + ")' AND NOT EXISTS(SELECT 1 FROM user_clients_group ucg0 WHERE ucg0.user_id = u.id AND ucg0.client_group_id = 7)";
};

CANAIS.forEach(function (c) {
  const BASE = baseDe(c.wl);
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

  /* Top 100 (era 10, 16/10): 100 linhas passam do teto de 50 do MCP, entao vem
     numa linha so, empacotado. JSON_ARRAYAGG nao garante ordem: ordena no JS. */
  push('top',
    "SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(t.id, t.nome, t.loja, t.compras, t.valor, t.ultima)) AS linhas FROM (" +
    "SELECT u.id, u.full_name as nome, (SELECT s.name FROM user_shops us INNER JOIN shops s ON s.id = us.shop_id WHERE us.user_id = u.id ORDER BY us.created_at LIMIT 1) as loja, COUNT(DISTINCT an.id) as compras, ROUND(SUM(o.price)) as valor, DATE_FORMAT(MAX(an.finish_date_offer),'%Y-%m-%d') as ultima FROM " + COMPRA + " INNER JOIN users u ON u.id = o.buyer_user_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN " + IN_BASE + " GROUP BY u.id, u.full_name ORDER BY compras DESC, u.id LIMIT 100) t");

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

  /* --- Graficos trazidos do relatorio do C6 Lojista (f6Bw2iiuaWECy9Uz), 16/10 --- */
  push('cad_dia',
    "SELECT DATE_FORMAT(u.created_at,'%Y-%m-%d') as dia, COUNT(*) as novos FROM users u WHERE u.id IN " + IN_BASE + " AND u.created_at >= '" + DIA_INI + "' AND u.created_at < '" + DIA_FIM_EXCL + "' GROUP BY dia ORDER BY dia");

  /* Anuncios das LOJAS do canal (shops.whitelabel_id), nao dos clientes: as
     ofertas recebidas vem de qualquer comprador da plataforma. So contagens;
     as medias saem no navegador, para o "todos" poder somar canais. */
  push('anuncios',
    "SELECT DATE_FORMAT(an.finish_date_offer,'%Y-%m') as mes, COUNT(DISTINCT a.vehicle_id) as publicados, COUNT(DISTINCT a.id) as criados, COUNT(o.id) as ofertas, COUNT(DISTINCT CASE WHEN an.status IN (2,3,7) THEN a.vehicle_id END) as vendidos FROM advertisements a INNER JOIN shops s ON s.id = a.shop_id AND s.whitelabel_id = " + c.wl + " INNER JOIN advertisement_negotiations an ON an.advertisement_id = a.id LEFT JOIN offers o ON o.advertisement_id = a.id AND o.deleted_at IS NULL WHERE an.finish_date_offer >= '" + MES_INICIO + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCL + "-01' AND an.status <> 10 GROUP BY mes ORDER BY mes");

  /* Fatias EXCLUSIVAS, fecham o total da base em cada mes: cada CASE nega os anteriores */
  const ate = function (al) { return "(" + al + ".d1 IS NOT NULL AND " + al + ".d1 <= m.fim)"; };
  push('base_acum',
    "SELECT m.mes, COUNT(*) AS base, " +
    "SUM(CASE WHEN " + ate('c1') + " THEN 1 ELSE 0 END) AS compraram, " +
    "SUM(CASE WHEN NOT " + ate('c1') + " AND " + ate('o1') + " THEN 1 ELSE 0 END) AS ofertaram, " +
    "SUM(CASE WHEN NOT " + ate('c1') + " AND NOT " + ate('o1') + " AND " + ate('ac') + " THEN 1 ELSE 0 END) AS acessaram, " +
    "SUM(CASE WHEN NOT " + ate('c1') + " AND NOT " + ate('o1') + " AND NOT " + ate('ac') + " THEN 1 ELSE 0 END) AS nunca " +
    "FROM " + MESES_UNION + " m JOIN " + BASE_COORTE + " b ON b.created_at <= m.fim " +
    "LEFT JOIN " + D_ACESSO + " ac ON ac.uid = b.id LEFT JOIN " + D_OFERTA + " o1 ON o1.uid = b.id LEFT JOIN " + D_COMPRA + " c1 ON c1.uid = b.id " +
    "GROUP BY m.mes ORDER BY m.mes");

  push('uf_compra',
    "SELECT COALESCE(ufn2.uf_norm, 'Nao identificada') as uf, COUNT(DISTINCT an.id) as compras, SUM(o.price) as volume FROM " + COMPRA + " LEFT JOIN (SELECT s.id as shop_id, MIN(" + UF_CASE + ") as uf_norm FROM shops s INNER JOIN shop_addresses sa ON sa.shop_id = s.id AND sa.deleted_at IS NULL GROUP BY s.id) ufn2 ON ufn2.shop_id = o.buyer_shop_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN " + IN_BASE + " GROUP BY uf ORDER BY compras DESC");
});

/* ══ Pacotes globais: Raio-X e filtro de periodo ══════════════════════════
   Quem compra compra na plataforma inteira, nao "no canal": o dado de um
   cliente e o mesmo em qualquer canal em que ele esteja. Por isso estes
   pacotes rodam UMA vez sobre a uniao das 6 bases, e cada cliente leva a
   mascara dos canais a que pertence (bit i = CANAIS[i]). O navegador filtra
   canal pela mascara e periodo pelo indice do mes - e no "todos" a pessoa
   conta uma vez so, sem a dupla contagem que a soma de canais tem.
   Tabela inteira numa linha (COUNT + JSON_ARRAYAGG), partida por MOD(id, n)
   para cada pacote caber no MCP. Cada parte traz o proprio total: o Montar
   HTML aborta se uma parte chegar com menos itens do que o banco contou.
   Tamanhos medidos em 16/10/2026 no README. */
const UB = "(SELECT user_id, BIT_OR(cm) AS cm FROM (" + CANAIS.map(function (c, i) {
  return "SELECT user_id, " + (1 << i) + " AS cm FROM (" + baseDe(c.wl) + ") b" + i;
}).join(' UNION ALL ') + ") ux GROUP BY user_id)";
const JAN = function (col) { return col + " >= '" + MES_INICIO + "-01' AND " + col + " < '" + MES_FIM_EXCL + "-01'"; };
const CP_JAN = COMPRA + " INNER JOIN " + UB + " ub ON ub.user_id = o.buyer_user_id WHERE an.status IN (2,3,7) AND " + JAN('an.finish_date_offer');

const pacote = function (nome, partes, campos, de, uidCol) {
  for (let k = 0; k < partes; k++) {
    Q.push({ queryName: nome, wl: 0, canal: 'todos', parte: k, partes: partes, database: 'cars2you_production',
      sql: "SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(" + campos + ")) AS linhas FROM (" + de + ") t WHERE MOD(t." + uidCol + ", " + partes + ") = " + k });
  }
};

/* Clientes com qualquer acesso, lance ou compra na janela: nome e loja servem
   aos rankings e ao Raio-X; a mascara, ao filtro de canal */
pacote('usuarios', 8, 't.id, t.cm, t.nome, t.loja, t.cnpj',
  "SELECT u.id, ub.cm, u.full_name AS nome, " +
  "(SELECT GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ' / ') FROM user_shops us INNER JOIN shops s ON s.id = us.shop_id WHERE us.user_id = u.id) AS loja, " +
  "(SELECT s.cnpj FROM user_shops us INNER JOIN shops s ON s.id = us.shop_id WHERE us.user_id = u.id ORDER BY us.created_at LIMIT 1) AS cnpj " +
  "FROM " + UB + " ub INNER JOIN users u ON u.id = ub.user_id WHERE " +
  "ub.user_id IN (SELECT ua.user_id FROM user_access ua WHERE " + JAN('ua.created_at') + ") OR " +
  "ub.user_id IN (SELECT o.buyer_user_id FROM offers o WHERE o.deleted_at IS NULL AND " + JAN('o.created_at') + ") OR " +
  "ub.user_id IN (SELECT o.buyer_user_id FROM " + COMPRA + " WHERE an.status IN (2,3,7) AND " + JAN('an.finish_date_offer') + ")", 'id');

/* Dias distintos com acesso, por cliente e mes. Acesso nao tem comitente:
   entra na plataforma, nao num anuncio. */
pacote('atv', 6, 't.uid, t.mi, t.dias',
  "SELECT ua.user_id AS uid, " + MI('ua.created_at') + " AS mi, COUNT(DISTINCT DATE(ua.created_at)) AS dias FROM user_access ua INNER JOIN " + UB + " ub ON ub.user_id = ua.user_id WHERE " + JAN('ua.created_at') + " GROUP BY uid, mi", 'uid');

/* Comitente = a loja que vende o veiculo (advertisements.shop_id; ver
   context/banco-de-dados/plataforma/dominios.md). Lance sem anuncio vira 0. */
pacote('lances', 4, 't.uid, t.mi, t.com, t.n',
  "SELECT o.buyer_user_id AS uid, " + MI('o.created_at') + " AS mi, COALESCE(a.shop_id, 0) AS com, COUNT(*) AS n FROM offers o LEFT JOIN advertisements a ON a.id = o.advertisement_id INNER JOIN " + UB + " ub ON ub.user_id = o.buyer_user_id WHERE o.deleted_at IS NULL AND " + JAN('o.created_at') + " GROUP BY uid, mi, com", 'uid');

/* Raio-X: as mesmas 6 agregacoes do C6 Lojista (rx_*), por (comprador, mes,
   comitente[, dimensao]) */
pacote('rx_totais', 4, 't.uid, t.mi, t.com, t.compras, t.volume, t.pf, t.fs, t.pm, t.ms',
  "SELECT o.buyer_user_id AS uid, " + MI('an.finish_date_offer') + " AS mi, a.shop_id AS com, COUNT(*) AS compras, ROUND(SUM(o.price)) AS volume, " +
  "ROUND(SUM(CASE WHEN a.fipe_price>0 THEN o.price ELSE 0 END)) AS pf, ROUND(SUM(CASE WHEN a.fipe_price>0 THEN a.fipe_price ELSE 0 END)) AS fs, " +
  "ROUND(SUM(CASE WHEN a.molicar_price>0 THEN o.price ELSE 0 END)) AS pm, ROUND(SUM(CASE WHEN a.molicar_price>0 THEN a.molicar_price ELSE 0 END)) AS ms " +
  "FROM " + CP_JAN + " GROUP BY uid, mi, com", 'uid');
pacote('rx_modelo', 5, 't.uid, t.mi, t.com, t.k, t.qtd',
  "SELECT o.buyer_user_id AS uid, " + MI('an.finish_date_offer') + " AS mi, a.shop_id AS com, COALESCE(m.name,'Não informado') AS k, COUNT(*) AS qtd FROM " +
  CP_JAN.replace(' INNER JOIN ' + UB, ' INNER JOIN vehicles v ON v.id = a.vehicle_id LEFT JOIN models m ON m.id = v.model_id INNER JOIN ' + UB) + " GROUP BY uid, mi, com, k", 'uid');
pacote('rx_laudo', 3, 't.uid, t.mi, t.com, t.k, t.qtd',
  "SELECT o.buyer_user_id AS uid, " + MI('an.finish_date_offer') + " AS mi, a.shop_id AS com, COALESCE(vpr.situation,'sem_registro') AS k, COUNT(*) AS qtd FROM " +
  CP_JAN.replace(' INNER JOIN ' + UB, ' LEFT JOIN vehicle_precautionary_reports vpr ON vpr.vehicle_id = a.vehicle_id AND vpr.deleted_at IS NULL INNER JOIN ' + UB) + " GROUP BY uid, mi, com, k", 'uid');
pacote('rx_uf', 3, 't.uid, t.mi, t.com, t.k, t.qtd',
  "SELECT o.buyer_user_id AS uid, " + MI('an.finish_date_offer') + " AS mi, a.shop_id AS com, COALESCE(ss.state,'ND') AS k, COUNT(*) AS qtd FROM " +
  CP_JAN.replace(' INNER JOIN ' + UB, ' LEFT JOIN shop_stocks ss ON ss.id = a.shop_stock_id INNER JOIN ' + UB) + " GROUP BY uid, mi, com, k", 'uid');
pacote('rx_faixa', 3, 't.uid, t.mi, t.com, t.k, t.qtd',
  "SELECT o.buyer_user_id AS uid, " + MI('an.finish_date_offer') + " AS mi, a.shop_id AS com, CASE WHEN o.price < 25000 THEN 'Até R$ 25 mil' WHEN o.price < 50000 THEN 'R$ 25-50 mil' WHEN o.price < 100000 THEN 'R$ 50-100 mil' WHEN o.price < 200000 THEN 'R$ 100-200 mil' ELSE 'Acima de R$ 200 mil' END AS k, COUNT(*) AS qtd FROM " +
  CP_JAN + " GROUP BY uid, mi, com, k", 'uid');
/* Participacao = negociacao em que o cliente deu lance, no mes do PRIMEIRO lance
   nela. O join com a negociacao fica, de proposito: lance orfao nao e disputa. */
pacote('rx_partic', 3, 't.uid, t.mi, t.com, t.n',
  "SELECT uid, mi, com, COUNT(*) AS n FROM (SELECT o.buyer_user_id AS uid, " + MI('MIN(o.created_at)') + " AS mi, MIN(a.shop_id) AS com FROM offers o INNER JOIN advertisement_negotiations an ON an.id = o.advs_negotiation_id INNER JOIN advertisements a ON a.id = an.advertisement_id INNER JOIN " + UB + " ub ON ub.user_id = o.buyer_user_id WHERE o.deleted_at IS NULL AND " + JAN('o.created_at') + " GROUP BY o.buyer_user_id, o.advs_negotiation_id) p GROUP BY uid, mi, com", 'uid');

/* Nome dos comitentes: toda loja que vendeu ou recebeu lance da base na janela */
pacote('comitentes', 1, 't.id, t.nome',
  "SELECT s.id, s.name AS nome FROM shops s WHERE s.id IN (SELECT a.shop_id FROM offers o INNER JOIN advertisements a ON a.id = o.advertisement_id INNER JOIN " + UB + " ub ON ub.user_id = o.buyer_user_id WHERE o.deleted_at IS NULL AND " + JAN('o.created_at') + ") OR s.id IN (SELECT a.shop_id FROM " + CP_JAN + ")", 'id');

return Q.map(function (q) { return { json: q }; });
