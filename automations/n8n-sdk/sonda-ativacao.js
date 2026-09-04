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
const BASE = "SELECT u.id as user_id FROM users u WHERE u.deleted_at IS NULL AND u.internal_user = 0 AND u.email NOT REGEXP '(@cars2you|@datapage|@icarros|@itau|@teste|@dnr[.]com[.]br|@maisquecliente|@dealersclub|@c6bank[.]com)' AND EXISTS(SELECT 1 FROM user_whitelabels uw0 WHERE uw0.user_id = u.id AND uw0.whitelabel_id IN (43, 48, 62, 65, 7, 4))";

const UF_CASE = "CASE WHEN UPPER(TRIM(sa.state)) IN ('SP','MG','PR','SC','RJ','GO','RS','BA','MT','DF','CE','MS','ES','PE','PA','SE','AM','MA','RN','PB','AL','PI','RO','TO','AP','AC','RR') THEN UPPER(TRIM(sa.state)) WHEN UPPER(TRIM(sa.state)) = 'S.P' THEN 'SP' WHEN UPPER(TRIM(sa.state)) = 'RIO DE JANEIRO' THEN 'RJ' WHEN UPPER(TRIM(sa.state)) = 'MATO GROSSO DO SUL' THEN 'MS' WHEN UPPER(TRIM(sa.state)) LIKE 'ESPIRITO%SANTO%' THEN 'ES' ELSE NULL END";

const Q = [];

const BASEF = "u.deleted_at IS NULL AND u.internal_user = 0 AND u.email NOT REGEXP '(@cars2you|@datapage|@icarros|@itau|@teste|@dnr[.]com[.]br|@maisquecliente|@dealersclub|@c6bank[.]com)' AND EXISTS(SELECT 1 FROM user_whitelabels uw0 WHERE uw0.user_id = u.id AND uw0.whitelabel_id IN (43, 48, 62, 65, 7, 4))";


const RX_PAGE = 50;
function pushPaged(name, sqlNoLimit, pages){
  for (let i = 0; i < pages; i++){
    Q.push({ queryName: name, database: 'cars2you_production', sql: sqlNoLimit + " LIMIT " + RX_PAGE + " OFFSET " + (i*RX_PAGE) });
  }
}


/* Preenchido pelo gera_lote2.py junto com o resto do recorte de whitelabel,
   pra a lista de ids ter UMA fonte so no arquivo inteiro. */
const FILTRO_WL_JOIN = " AND uw.whitelabel_id IN (43, 48, 62, 65, 7, 4)";

const PRIMEIRO_LOGIN = "SELECT ua.user_id uid, MIN(ua.created_at) p FROM user_access ua GROUP BY ua.user_id";
const PRIMEIRA_OFERTA = "SELECT o.buyer_user_id uid, MIN(o.created_at) p FROM offers o WHERE o.deleted_at IS NULL GROUP BY o.buyer_user_id";
const PRIMEIRA_COMPRA = "SELECT o.buyer_user_id uid, MIN(an.finish_date_offer) p FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id WHERE an.status IN (2,3,7) GROUP BY o.buyer_user_id";

function faixasAtivacao(alias) {
  return [30, 60, 90, 180].map(function (d) {
    return "SUM(" + alias + ".p IS NOT NULL AND DATEDIFF(" + alias + ".p, b.cad) <= " + d + ")";
  });
}
const ATIV_METRICS =
  "COUNT(*) total, " +
  faixasAtivacao('fl').map(function (e, i) { return e + " lg" + [30,60,90,180][i]; }).join(', ') + ", " +
  faixasAtivacao('fo').map(function (e, i) { return e + " of" + [30,60,90,180][i]; }).join(', ') + ", " +
  faixasAtivacao('fc').map(function (e, i) { return e + " cp" + [30,60,90,180][i]; }).join(', ') + ", " +
  "SUM(fl.p IS NOT NULL AND DATEDIFF(fl.p, b.cad) < 0) anomalos";

const ATIV_JOINS =
  " LEFT JOIN (" + PRIMEIRO_LOGIN + ") fl ON fl.uid = b.uid" +
  " LEFT JOIN (" + PRIMEIRA_OFERTA + ") fo ON fo.uid = b.uid" +
  " LEFT JOIN (" + PRIMEIRA_COMPRA + ") fc ON fc.uid = b.uid";

/* base enxuta: so id, safra e data de cadastro — nao precisa dos EXISTS do BEXT */
const BASE_CAD = "SELECT u.id uid, DATE_FORMAT(u.created_at,'%Y-%m') ym, u.created_at cad" +
  " FROM users u WHERE " + BASEF;

pushPaged('ativacao',
  "SELECT b.ym, " + ATIV_METRICS +
  " FROM (" + BASE_CAD + ") b" + ATIV_JOINS +
  " GROUP BY b.ym ORDER BY b.ym",
  3);

/* Por whitelabel: mesma coisa com o join de user_whitelabels sobre a base.
   6 WL x ~78 safras = teto de 468 linhas. */
pushPaged('ativacao_wl',
  "SELECT uw.whitelabel_id wl, b.ym, " + ATIV_METRICS +
  " FROM (" + BASE_CAD + ") b" +
  " INNER JOIN user_whitelabels uw ON uw.user_id = b.uid" + FILTRO_WL_JOIN +
  ATIV_JOINS +
  " GROUP BY uw.whitelabel_id, b.ym ORDER BY uw.whitelabel_id, b.ym",
  12);


const SONDA = ["ativacao", "ativacao_wl"];
const Q_S = Q.filter(function (q) { return SONDA.indexOf(q.queryName) >= 0; });
if (Q_S.length === 0) throw new Error('sonda vazia');
return Q_S.map(function (q, i) {
  return { json: { queryName: q.queryName, database: q.database, sql: q.sql, idx: i, total: Q_S.length } };
});
