const now = new Date();
const ANO = now.getFullYear();
const pad = (n) => String(n).padStart(2,'0');
const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
const MES_INICIO = start.getFullYear() + '-' + pad(start.getMonth()+1);
const fimExcl = new Date(now.getFullYear(), now.getMonth() + 1, 1);
const MES_FIM_EXCLUSIVO = fimExcl.getFullYear() + '-' + pad(fimExcl.getMonth()+1);
const startRX = new Date(now.getFullYear(), now.getMonth() - 11, 1);
const MES_INICIO_RX = startRX.getFullYear() + '-' + pad(startRX.getMonth()+1);
const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const hojeMenos29 = new Date(hoje); hojeMenos29.setDate(hoje.getDate()-29);
const amanha = new Date(hoje); amanha.setDate(hoje.getDate()+1);
const fmtDate = (d) => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const HOJE_MENOS_29D = fmtDate(hojeMenos29);
const AMANHA = fmtDate(amanha);

/* MULTI-WL: aqui havia um INNER JOIN em user_whitelabels preso ao WL 43.
   O EXISTS troca o join por teste de existencia — sem ele, quem esta
   em varios whitelabels apareceria N vezes e o COUNT(*) do kpi
   contaria repetido (user_whitelabels e N:N). */
const BASE = "SELECT u.id as user_id FROM users u WHERE u.deleted_at IS NULL AND u.internal_user = 0 AND u.email NOT REGEXP '(@cars2you|@datapage|@icarros|@itau|@teste|@dnr[.]com[.]br|@maisquecliente|@dealersclub|@c6bank[.]com)' AND EXISTS(SELECT 1 FROM user_whitelabels uw0 WHERE uw0.user_id = u.id)";

const UF_CASE = "CASE WHEN UPPER(TRIM(sa.state)) IN ('SP','MG','PR','SC','RJ','GO','RS','BA','MT','DF','CE','MS','ES','PE','PA','SE','AM','MA','RN','PB','AL','PI','RO','TO','AP','AC','RR') THEN UPPER(TRIM(sa.state)) WHEN UPPER(TRIM(sa.state)) = 'S.P' THEN 'SP' WHEN UPPER(TRIM(sa.state)) = 'RIO DE JANEIRO' THEN 'RJ' WHEN UPPER(TRIM(sa.state)) = 'MATO GROSSO DO SUL' THEN 'MS' WHEN UPPER(TRIM(sa.state)) LIKE 'ESPIRITO%SANTO%' THEN 'ES' ELSE NULL END";

const Q = [];

const BASEF = "u.deleted_at IS NULL AND u.internal_user = 0 AND u.email NOT REGEXP '(@cars2you|@datapage|@icarros|@itau|@teste|@dnr[.]com[.]br|@maisquecliente|@dealersclub|@c6bank[.]com)' AND EXISTS(SELECT 1 FROM user_whitelabels uw0 WHERE uw0.user_id = u.id)";


const RX_PAGE = 50;
function pushPaged(name, sqlNoLimit, pages){
  for (let i = 0; i < pages; i++){
    Q.push({ queryName: name, database: 'cars2you_production', sql: sqlNoLimit + " LIMIT " + RX_PAGE + " OFFSET " + (i*RX_PAGE) });
  }
}


const ANO_INI_WL = 2019;
function baseWl(ano) {
  return "SELECT u.id as user_id, uw.whitelabel_id as wl" +
    " FROM users u INNER JOIN user_whitelabels uw ON uw.user_id = u.id" +
    " WHERE " + BASEF +
    (ano ? " AND u.created_at >= '" + ano + "-01-01' AND u.created_at < '" + (ano + 1) + "-01-01'" : "");
}
const BWL = "(" + baseWl(null) + ") bw";
/* [correcao pos-sonda 48571] A primeira versao agregava DEPOIS de juntar com
   user_whitelabels: cada linha de evento era multiplicada pela quantidade de
   whitelabels do comprador antes do GROUP BY. Foi essa forma que estourou o
   deadline em uf_compra_wl, e estes rankings tem a mesma forma.

   Aqui a ordem se inverte, seguindo o padrao `PC` que a coorte ja usa em
   producao: agrega por usuario UMA vez (poucos milhares de linhas), e so
   entao junta com whitelabel e ranqueia. O join com user_whitelabels passa a
   acontecer sobre o agregado, nao sobre o evento.

   Fatiar por ano nao serviria aqui: top-10 por ano nao soma pra top-10 geral
   — quem for 11o em todo ano e 5o no total sumiria. Por isso pre-agregar, e
   nao paginar por data. */
function topWl(nome, m, ordem, extraWhere) {
  const agregado =
    "SELECT " + m.uid + " as uid, " + m.sel + " FROM " + m.from2 +
    (extraWhere || "") + " GROUP BY " + m.uid;
  pushPaged(nome,
    "SELECT wl, id, full_name, " + m.campos + ", rn FROM (" +
    "SELECT bw.wl as wl, u.id as id, u.full_name as full_name, " + m.campos +
    ", ROW_NUMBER() OVER (PARTITION BY bw.wl ORDER BY " + ordem + " DESC) as rn" +
    " FROM (" + agregado + ") ag" +
    " INNER JOIN users u ON u.id = ag.uid" +
    " INNER JOIN " + BWL + " ON bw.user_id = ag.uid" +
    ") t WHERE t.rn <= 10 ORDER BY wl, rn",
    16);
}

/* `from2` = o mesmo FROM do original, SEM o join com users: o nome do cliente
   entra depois, sobre o agregado. Manter o join com advertisements preserva a
   semantica (negociacao sem anuncio nao e compra real — regra § 3). */
const M_COMPRA = {
  from2: "advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id",
  uid: "o.buyer_user_id",
  sel: "COUNT(DISTINCT an.id) as compras, SUM(o.price) as volume, MAX(an.finish_date_offer) as ultima_compra",
  campos: "compras, volume, ultima_compra"
};
topWl('top_compradores_hist_wl', M_COMPRA, "ag.compras",
  " WHERE an.status IN (2,3,7)");
topWl('top_compradores_ano_wl', M_COMPRA, "ag.compras",
  " WHERE an.status IN (2,3,7) AND an.finish_date_offer >= '" + ANO + "-01-01'");

topWl('top_acesso_ano_wl', {
  from2: "user_access ua",
  uid: "ua.user_id",
  sel: "COUNT(DISTINCT DATE(ua.created_at)) as dias_ativos, COUNT(ua.id) as acessos_totais",
  campos: "dias_ativos, acessos_totais"
}, "ag.dias_ativos", " WHERE ua.created_at >= '" + ANO + "-01-01'");

topWl('top_ofertas_ano_wl', {
  from2: "offers o",
  uid: "o.buyer_user_id",
  sel: "COUNT(*) as ofertas",
  campos: "ofertas"
}, "ag.ofertas", " WHERE o.deleted_at IS NULL AND o.created_at >= '" + ANO + "-01-01'");

pushPaged('rx_buyer_wl',
  "SELECT uw.user_id, uw.whitelabel_id as wl FROM user_whitelabels uw WHERE uw.user_id IN (SELECT DISTINCT o.buyer_user_id FROM advertisement_negotiations an INNER JOIN offers o ON o.id = an.offer_actual_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND an.finish_date_offer >= '" + MES_INICIO_RX + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01') ORDER BY uw.user_id, uw.whitelabel_id",
  60);
/* ══════════════════════════════════════════════════════════════════════
   VARIANTES DE uf_compra_wl — uma pagina cada, so pra medir o deadline.
   ══════════════════════════════════════════════════════════════════════ */
const UF_SEL = "COALESCE(ufn.uf_norm, 'Não identificada') as uf, COUNT(DISTINCT an.id) as compras, SUM(o.price) as volume";
const NEG = "advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id";
const DERIVADA = "(SELECT s.id as shop_id, " + UF_CASE + " as uf_norm FROM shops s INNER JOIN shop_addresses sa ON sa.shop_id = s.id AND sa.deleted_at IS NULL) ufn";
const DIRETO = "shops s2 ON s2.id = o.buyer_shop_id LEFT JOIN shop_addresses sa ON sa.shop_id = s2.id AND sa.deleted_at IS NULL";

/* A — a que estourou: derivada de UF + shard por ano da compra */
pushPaged('varA_derivada_shard',
  "SELECT bw.wl as wl, " + UF_SEL + " FROM " + NEG +
  " INNER JOIN " + BWL + " ON bw.user_id = o.buyer_user_id" +
  " LEFT JOIN " + DERIVADA + " ON ufn.shop_id = o.buyer_shop_id" +
  " WHERE an.status IN (2,3,7) AND an.finish_date_offer >= '2025-01-01' AND an.finish_date_offer < '2026-01-01'" +
  " GROUP BY wl, uf ORDER BY wl, compras DESC", 1);

/* B — troca a derivada por join direto nas tabelas indexadas, mesmo shard */
pushPaged('varB_direto_shard',
  "SELECT bw.wl as wl, COALESCE(" + UF_CASE + ", 'Não identificada') as uf, COUNT(DISTINCT an.id) as compras, SUM(o.price) as volume FROM " + NEG +
  " INNER JOIN " + BWL + " ON bw.user_id = o.buyer_user_id" +
  " LEFT JOIN " + DIRETO +
  " WHERE an.status IN (2,3,7) AND an.finish_date_offer >= '2025-01-01' AND an.finish_date_offer < '2026-01-01'" +
  " GROUP BY wl, uf ORDER BY wl, compras DESC", 1);

/* C — join direto SEM shard: se passar, a janela nunca foi o problema */
pushPaged('varC_direto_sem_shard',
  "SELECT bw.wl as wl, COALESCE(" + UF_CASE + ", 'Não identificada') as uf, COUNT(DISTINCT an.id) as compras, SUM(o.price) as volume FROM " + NEG +
  " INNER JOIN " + BWL + " ON bw.user_id = o.buyer_user_id" +
  " LEFT JOIN " + DIRETO +
  " WHERE an.status IN (2,3,7)" +
  " GROUP BY wl, uf ORDER BY wl, compras DESC", 1);

/* D — padrao PC: agrega por (comprador, loja) ANTES de tocar em whitelabel.
   E a forma que consertou os rankings. */
pushPaged('varD_pre_agregado',
  "SELECT bw.wl as wl, COALESCE(" + UF_CASE + ", 'Não identificada') as uf, SUM(ag.compras) as compras, SUM(ag.volume) as volume" +
  " FROM (SELECT o.buyer_user_id as uid, o.buyer_shop_id as shop, COUNT(DISTINCT an.id) as compras, SUM(o.price) as volume" +
  " FROM " + NEG + " WHERE an.status IN (2,3,7) GROUP BY o.buyer_user_id, o.buyer_shop_id) ag" +
  " INNER JOIN " + BWL + " ON bw.user_id = ag.uid" +
  " LEFT JOIN shops s2 ON s2.id = ag.shop" +
  " LEFT JOIN shop_addresses sa ON sa.shop_id = s2.id AND sa.deleted_at IS NULL" +
  " GROUP BY wl, uf ORDER BY wl, compras DESC", 1);

/* E — controle: a evol_compra_wl, que JA passou na 48571. Se ela falhar
   agora, o banco esta diferente e nenhuma medida vale. */
pushPaged('varE_controle',
  "SELECT bw.wl as wl, DATE_FORMAT(an.finish_date_offer,'%Y-%m') as mes, COUNT(DISTINCT o.buyer_user_id) as unicos FROM " + NEG +
  " INNER JOIN " + BWL + " ON bw.user_id = o.buyer_user_id" +
  " WHERE an.status IN (2,3,7) AND an.finish_date_offer >= '" + MES_INICIO + "-01'" +
  " GROUP BY wl, mes ORDER BY wl, mes", 1);

/* os 4 rankings reescritos e o mapa do Raio-X: 1 pagina cada */
const SO_PRIMEIRA = ['top_compradores_hist_wl','top_compradores_ano_wl',
  'top_acesso_ano_wl','top_ofertas_ano_wl','rx_buyer_wl'];
const VARIANTES_UF = ['varE_controle','varA_derivada_shard','varB_direto_shard',
  'varC_direto_sem_shard','varD_pre_agregado'];
const ORDEM = VARIANTES_UF.concat(SO_PRIMEIRA);

const vistos = {};
const Q_SONDA = [];
ORDEM.forEach(function (nome) {
  const q = Q.filter(function (x) { return x.queryName === nome; })[0];
  if (q) Q_SONDA.push(q);          /* so a PRIMEIRA pagina de cada */
});
if (Q_SONDA.length === 0) throw new Error('sonda vazia');
return Q_SONDA.map(function (q, i) {
  return { json: { queryName: q.queryName, database: q.database, sql: q.sql, idx: i, total: Q_SONDA.length } };
});
