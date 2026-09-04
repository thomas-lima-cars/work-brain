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
/* ══════════════════════════════════════════════════════════════════
   [lote 2] baseWl() — a base de clientes carregando o whitelabel.
   Mesmo filtro de BASEF, verbatim. O INNER JOIN (e nao WHERE) e o ponto:
   quem esta em N whitelabels precisa aparecer N vezes aqui, uma vez em
   cada recorte. O total da plataforma NUNCA sai daqui — sai da query
   global correspondente, que nao tem o join. Somar os WLs pra chegar no
   total daria numero inflado, e e o erro que o EXISTS do BASE evita.
   `ano` null monta a base inteira; com ano, fatia por ano de cadastro
   dentro da subquery (padrao do lote 1f, coluna indexada).
   ══════════════════════════════════════════════════════════════════ */
function baseWl(ano) {
  return "SELECT u.id as user_id, uw.whitelabel_id as wl" +
    " FROM users u INNER JOIN user_whitelabels uw ON uw.user_id = u.id" +
    " WHERE " + BASEF +
    (ano ? " AND u.created_at >= '" + ano + "-01-01' AND u.created_at < '" + (ano + 1) + "-01-01'" : "");
}
const BWL = "(" + baseWl(null) + ") bw";

/* ─── [lote 2] RECENCIA POR WL ────────────────────────────────────────
   Original: agrupa por faixa. Aqui agrupa por (wl, user) pra achar o
   ultimo evento de cada cliente dentro de cada whitelabel, e so entao
   conta por faixa. O CASE de faixa e verbatim do original.
   58 WL x 4 faixas x 3 tipos = teto de 696 linhas. */
const FAIXA = "CASE WHEN DATEDIFF(NOW(), ul) BETWEEN 0 AND 30 THEN '00-30d' WHEN DATEDIFF(NOW(), ul) BETWEEN 31 AND 90 THEN '31-90d' WHEN DATEDIFF(NOW(), ul) BETWEEN 91 AND 180 THEN '91-180d' ELSE '180d+' END";
pushPaged('recencia_wl',
  "SELECT 'login' as tipo, wl, faixa, COUNT(*) as qtd FROM (SELECT bw.wl as wl, " + FAIXA + " as faixa FROM (SELECT ua.user_id as uid, MAX(ua.created_at) as ul FROM user_access ua GROUP BY ua.user_id) t INNER JOIN " + BWL + " ON bw.user_id = t.uid) rl GROUP BY wl, faixa " +
  "UNION ALL " +
  "SELECT 'oferta' as tipo, wl, faixa, COUNT(*) as qtd FROM (SELECT bw.wl as wl, " + FAIXA + " as faixa FROM (SELECT o.buyer_user_id as uid, MAX(o.created_at) as ul FROM offers o WHERE o.deleted_at IS NULL GROUP BY o.buyer_user_id) t INNER JOIN " + BWL + " ON bw.user_id = t.uid) ro GROUP BY wl, faixa " +
  "UNION ALL " +
  "SELECT 'compra' as tipo, wl, faixa, COUNT(*) as qtd FROM (SELECT bw.wl as wl, " + FAIXA + " as faixa FROM (SELECT o.buyer_user_id as uid, MAX(an.finish_date_offer) as ul FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id WHERE an.status IN (2,3,7) GROUP BY o.buyer_user_id) t INNER JOIN " + BWL + " ON bw.user_id = t.uid) rc GROUP BY wl, faixa " +
  "ORDER BY tipo, wl, faixa",
  16);

/* ─── [lote 2] EVOLUCAO POR WL ────────────────────────────────────────
   Transformacao mecanica das evol_* globais: o
   `X.user_id IN (SELECT user_id FROM (BASE) bb)` vira INNER JOIN em
   baseWl(), e `bw.wl` entra no SELECT e no GROUP BY. Janela de data
   verbatim. 58 WL x 12 meses = teto de 696 linhas.
   NAO fatiam por ano de cadastro: partem da tabela de evento, que ja e
   seletiva pela janela de 12 meses — fatiar multiplicaria chamada sem
   tirar custo. Se estourar deadline, fatiar e o proximo passo. */
pushPaged('evol_login_wl',
  "SELECT bw.wl as wl, DATE_FORMAT(ua.created_at,'%Y-%m') as mes, COUNT(DISTINCT ua.user_id) as unicos FROM user_access ua INNER JOIN " + BWL + " ON bw.user_id = ua.user_id WHERE ua.created_at >= '" + MES_INICIO + "-01' GROUP BY wl, mes ORDER BY wl, mes",
  20);

pushPaged('evol_oferta_wl',
  "SELECT bw.wl as wl, DATE_FORMAT(o.created_at,'%Y-%m') as mes, COUNT(DISTINCT o.buyer_user_id) as unicos FROM offers o INNER JOIN " + BWL + " ON bw.user_id = o.buyer_user_id WHERE o.deleted_at IS NULL AND o.created_at >= '" + MES_INICIO + "-01' AND o.created_at < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY wl, mes ORDER BY wl, mes",
  20);

pushPaged('evol_compra_wl',
  "SELECT bw.wl as wl, DATE_FORMAT(an.finish_date_offer,'%Y-%m') as mes, COUNT(DISTINCT o.buyer_user_id) as unicos, SUM(o.price) as volume FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id INNER JOIN " + BWL + " ON bw.user_id = o.buyer_user_id WHERE an.status IN (2,3,7) AND an.finish_date_offer >= '" + MES_INICIO + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY wl, mes ORDER BY wl, mes",
  20);

pushPaged('evol_cadastro_dia_wl',
  "SELECT bw.wl as wl, DATE(u.created_at) as dia, COUNT(*) as novos FROM users u INNER JOIN " + BWL + " ON bw.user_id = u.id WHERE u.created_at >= '" + HOJE_MENOS_29D + "' AND u.created_at < '" + AMANHA + "' GROUP BY wl, dia ORDER BY wl, dia",
  40);

/* ─── [lote 2] NOVOS vs RECORRENTES POR WL ────────────────────────────
   A subquery `f` (primeiro_mes) segue SEM filtro de data e SEM wl, de
   proposito: 'novo' e quem esta no mes da primeira ocorrencia na
   historia inteira do cliente — nao na historia dentro daquele
   whitelabel, e nao no comeco da janela. Mudar isso faria o grafico
   medir o comeco da janela, que e exatamente a armadilha descrita no
   comentario original do BC-25/26/27. So `m` ganha wl. */
const NR_SEL_WL = "SELECT m.wl, m.mes, SUM(CASE WHEN m.mes = f.primeiro_mes THEN 1 ELSE 0 END) as novos, SUM(CASE WHEN m.mes > f.primeiro_mes THEN 1 ELSE 0 END) as recorrentes FROM ";
const NR_FIM_WL = " f ON f.uid = m.uid GROUP BY m.wl, m.mes ORDER BY m.wl, m.mes";

pushPaged('nr_login_wl',
  NR_SEL_WL +
  "(SELECT bw.wl as wl, ua.user_id as uid, DATE_FORMAT(ua.created_at,'%Y-%m') as mes FROM user_access ua INNER JOIN " + BWL + " ON bw.user_id = ua.user_id WHERE ua.created_at >= '" + MES_INICIO + "-01' GROUP BY bw.wl, ua.user_id, mes) m INNER JOIN " +
  "(SELECT ua.user_id as uid, DATE_FORMAT(MIN(ua.created_at),'%Y-%m') as primeiro_mes FROM user_access ua WHERE ua.user_id IN (SELECT user_id FROM (" + BASE + ") bb) GROUP BY ua.user_id)" + NR_FIM_WL,
  20);

pushPaged('nr_oferta_wl',
  NR_SEL_WL +
  "(SELECT bw.wl as wl, o.buyer_user_id as uid, DATE_FORMAT(o.created_at,'%Y-%m') as mes FROM offers o INNER JOIN " + BWL + " ON bw.user_id = o.buyer_user_id WHERE o.deleted_at IS NULL AND o.created_at >= '" + MES_INICIO + "-01' AND o.created_at < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY bw.wl, o.buyer_user_id, mes) m INNER JOIN " +
  "(SELECT o.buyer_user_id as uid, DATE_FORMAT(MIN(o.created_at),'%Y-%m') as primeiro_mes FROM offers o WHERE o.deleted_at IS NULL AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) GROUP BY o.buyer_user_id)" + NR_FIM_WL,
  20);

pushPaged('nr_compra_wl',
  NR_SEL_WL +
  "(SELECT bw.wl as wl, o.buyer_user_id as uid, DATE_FORMAT(an.finish_date_offer,'%Y-%m') as mes FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id INNER JOIN " + BWL + " ON bw.user_id = o.buyer_user_id WHERE an.status IN (2,3,7) AND an.finish_date_offer >= '" + MES_INICIO + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY bw.wl, o.buyer_user_id, mes) m INNER JOIN " +
  "(SELECT o.buyer_user_id as uid, DATE_FORMAT(MIN(an.finish_date_offer),'%Y-%m') as primeiro_mes FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) GROUP BY o.buyer_user_id)" + NR_FIM_WL,
  20);

/* ─── [lote 2] UF POR WL ──────────────────────────────────────────────
   uf_cadastro: a `(BASE) b` do original vira baseWl(), que ja traz b.wl.
   O LEFT JOIN de UF, o UF_CASE e o COALESCE ficam verbatim.
   uf_compra: o `IN (BASE)` vira INNER JOIN. ~58 WL x ~28 UF = ~1,6k. */
pushPaged('uf_cadastro_wl',
  "SELECT b.wl as wl, COALESCE(ufn.uf_norm, 'Não identificada') as uf, COUNT(DISTINCT b.user_id) as qtd FROM (" + baseWl(null) + ") b LEFT JOIN (SELECT DISTINCT us.user_id, " + UF_CASE + " as uf_norm FROM user_shops us INNER JOIN shop_addresses sa ON sa.shop_id = us.shop_id AND sa.deleted_at IS NULL) ufn ON ufn.user_id = b.user_id AND ufn.uf_norm IS NOT NULL GROUP BY wl, uf ORDER BY wl, qtd DESC",
  40);

/* [correcao pos-sonda 48571] uf_compra_wl estourou o deadline de 60s na
   PRIMEIRA pagina (item 216). A sonda tambem provou o contrario do que a
   intuicao dizia: uf_cadastro_wl, que materializa a base inteira por
   whitelabel, passou nas 40 paginas. Ou seja, montar a base por WL NAO e o
   gargalo — o gargalo e o join com advertisement_negotiations sobre o
   historico INTEIRO, que esta query fazia sem nenhuma janela de data.

   Por isso o recorte NAO entra por ano de cadastro (como no lote 1f, onde o
   custo era montar o BEXT). Entra por ano da COMPRA, que e onde o custo
   esta, em coluna indexada, e corta a maior tabela antes de qualquer join.

   Somar as fatias e valido: cada negociacao tem uma unica finish_date_offer,
   entao os anos sao particoes disjuntas — COUNT(DISTINCT an.id) e SUM(price)
   sao aditivos entre elas. O cliente soma por (wl, uf). */
const ANO_INI_COMPRA = 2019;
for (let ac = ANO_INI_COMPRA; ac <= ANO; ac++) {
  pushPaged('uf_compra_wl',
    "SELECT bw.wl as wl, COALESCE(ufn2.uf_norm, 'Não identificada') as uf, COUNT(DISTINCT an.id) as compras, SUM(o.price) as volume FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id INNER JOIN " + BWL + " ON bw.user_id = o.buyer_user_id LEFT JOIN (SELECT s.id as shop_id, " + UF_CASE + " as uf_norm FROM shops s INNER JOIN shop_addresses sa ON sa.shop_id = s.id AND sa.deleted_at IS NULL) ufn2 ON ufn2.shop_id = o.buyer_shop_id WHERE an.status IN (2,3,7) AND an.finish_date_offer >= '" + ac + "-01-01' AND an.finish_date_offer < '" + (ac + 1) + "-01-01' GROUP BY wl, uf ORDER BY wl, compras DESC",
    8);
}

/* ─── [lote 2] TOP 10 POR WL ──────────────────────────────────────────
   LIMIT 10 nao serve aqui: daria os 10 primeiros do conjunto todo, nao
   os 10 de cada whitelabel. ROW_NUMBER() OVER (PARTITION BY wl) resolve
   — exige MySQL 8. Metricas e criterio de ordenacao verbatim do
   original. 58 WL x 10 = teto de 580 linhas por ranking. */
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

/* ─── [lote 2] MAPA COMPRADOR -> WHITELABEL (Raio-X) ──────────────────
   O que faz as duas abas do Raio-X filtrarem sem tocar nas 7 queries
   rx_*, que ja somam 855 chamadas ao MCP. Elas vem indexadas por
   buyer_user_id; com este mapa o cliente recorta os arrays existentes.
   O conjunto de compradores e o MESMO subquery do rx_buyers, verbatim,
   pra nao existir comprador no Raio-X sem entrada no mapa. */
pushPaged('rx_buyer_wl',
  "SELECT uw.user_id, uw.whitelabel_id as wl FROM user_whitelabels uw WHERE uw.user_id IN (SELECT DISTINCT o.buyer_user_id FROM advertisement_negotiations an INNER JOIN offers o ON o.id = an.offer_actual_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND an.finish_date_offer >= '" + MES_INICIO_RX + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01') ORDER BY uw.user_id, uw.whitelabel_id",
  60);


/* ─── SONDA ────────────────────────────────────────────────────────────
   So as queries listadas. As globais e as rx_ ficam de fora: elas ja rodaram
   na 48492 e o que se quer medir aqui e o custo NOVO.
   A ordem e a do lote 2 — se estourar, estoura na mesma sequencia. */
const SONDA = ["uf_compra_wl", "top_compradores_hist_wl", "top_compradores_ano_wl", "top_acesso_ano_wl", "top_ofertas_ano_wl", "rx_buyer_wl"];

const ordem = {};
SONDA.forEach(function (n, i) { ordem[n] = i; });

const Q_SONDA = Q.filter(function (q) { return ordem[q.queryName] !== undefined; })
  .sort(function (a, b) { return ordem[a.queryName] - ordem[b.queryName]; });

if (Q_SONDA.length === 0) throw new Error('sonda vazia — nenhuma query _wl encontrada');

return Q_SONDA.map(function (q, i) {
  return { json: { queryName: q.queryName, database: q.database, sql: q.sql, idx: i, total: Q_SONDA.length } };
});
