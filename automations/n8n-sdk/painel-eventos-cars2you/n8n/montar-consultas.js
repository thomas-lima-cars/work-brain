const WLS = [4, 7, 43, 48, 62, 65];
const DIAS = 30;
const STATUS_VENDA = [2, 3, 7];
const FUSO_MIN = -180;
const DB = 'cars2you_production';
if (DIAS > 30) throw new Error('DIAS acima de 30 estoura a mascara de dias (bit 31 e o sinal)');
const pad = (n) => String(n).padStart(2, '0');
const dataDe = (d) => d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
const agora = new Date(Date.now() + FUSO_MIN * 60000);
const AGORA_BR = dataDe(agora) + ' ' + pad(agora.getUTCHours()) + ':' + pad(agora.getUTCMinutes());
const PISO_DIA = dataDe(new Date(agora.getTime() - DIAS * 86400000));
const PISO = PISO_DIA + ' 00:00:00';
const LISTA_WL = WLS.join(',');
const EVENTO =
  " e.deleted_at IS NULL AND e.finish_date_event >= '" + PISO + "'" +
  " AND e.start_date_offer <= '" + AGORA_BR + "'" +
  " AND EXISTS (SELECT 1 FROM event_whitelabels ew" +
  " WHERE ew.event_id = e.id AND ew.whitelabel_id IN (" + LISTA_WL + "))";
const NEGS =
  " FROM advertisement_negotiations an" +
  " INNER JOIN events e ON e.id = an.event_id AND" + EVENTO +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id" +
  " WHERE an.deleted_at IS NULL";
const CATEGORIA = (v, c) => "CASE" +
  " WHEN " + c + ".category_group_id = 2 OR " + v + ".category_id = 23 THEN 'P'" +
  " WHEN " + c + ".category_group_id = 10 THEN 'L' WHEN " + c + ".category_group_id = 8 THEN 'E' ELSE 'N' END";
const DIA = (col) => "DATEDIFF(" + col + ", '" + PISO_DIA + "')";
const BIT = (col) => "IF(" + col + " >= '" + PISO + "', 1 << " + DIA(col) + ", 0)";
const DATA = (col) => "DATE_FORMAT(" + col + ", '%Y-%m-%d %H:%i')";
const TABELAS = [
  {
    nome: 'canais',
    de: " FROM whitelabels w WHERE w.id IN (" + LISTA_WL + ")",
    cols: [['id', 'w.id'], ['nome', 'w.name']]
  },
  {
    nome: 'eventos',
    de: " FROM events e WHERE" + EVENTO,
    cols: [
      ['id', 'e.id'],
      ['nome', 'e.name'],
      ['status', 'e.status'],
      ['ini', DATA('e.start_date_offer')],
      ['fim', DATA('e.finish_date_event')],
      ['wls', "(SELECT GROUP_CONCAT(ew2.whitelabel_id ORDER BY ew2.whitelabel_id)" +
              " FROM event_whitelabels ew2 WHERE ew2.event_id = e.id AND ew2.whitelabel_id IN (" + LISTA_WL + "))"]
    ]
  },
  {
    nome: 'negs',
    partes: 14,
    de: NEGS + " AND PARTE",
    parte: 'an.id',
    cols: [
      ['neg', 'an.id'],
      ['ev', 'an.event_id'],
      ['veic', 'a.vehicle_id'],
      ['comit', 'a.shop_id'],
      ['status', 'an.status'],
      ['vmv', 'NULLIF(an.min_sale_price, 0)'],
      ['fipe', 'NULLIF(a.fipe_price, 0)']
    ]
  },
  {
    nome: 'veiculos',
    partes: 7,
    de: " FROM (SELECT DISTINCT a.vehicle_id AS vid" + NEGS + ") x" +
        " INNER JOIN vehicles v ON v.id = x.vid" +
        " LEFT JOIN brands b ON b.id = v.brand_id" +
        " LEFT JOIN models m ON m.id = v.model_id" +
        " LEFT JOIN versions ver ON ver.id = v.version_id" +
        " LEFT JOIN categories cg ON cg.id = v.category_id" +
        " WHERE PARTE",
    parte: 'x.vid',
    cols: [
      ['veic', 'v.id'],
      ['marca', 'b.name'],
      ['modelo', 'm.name'],
      ['versao', 'ver.name'],
      ['ano', 'v.model_year'],
      ['km', 'NULLIF(v.km, 0)'],
      ['cadastro', DATA('v.created_at')],
      ['estreia', DATA("(SELECT MIN(e2.start_date_offer) FROM advertisements a2" +
        " INNER JOIN advertisement_negotiations an2 ON an2.advertisement_id = a2.id AND an2.deleted_at IS NULL" +
        " INNER JOIN events e2 ON e2.id = an2.event_id AND e2.deleted_at IS NULL" +
        " WHERE a2.vehicle_id = v.id)")],
      ['uuid', "(SELECT a3.uuid FROM advertisements a3 WHERE a3.vehicle_id = v.id ORDER BY a3.id DESC LIMIT 1)"],
      ['cat', CATEGORIA('v', 'cg')]
    ]
  },
  {
    nome: 'vendas',
    de: " FROM advertisement_negotiations an" +
        " INNER JOIN events e ON e.id = an.event_id AND" + EVENTO +
        " INNER JOIN offers o ON o.id = an.offer_actual_id" +
        " WHERE an.deleted_at IS NULL AND an.status IN (" + STATUS_VENDA.join(',') + ")",
    cols: [
      ['neg', 'an.id'],
      ['loja', 'o.buyer_shop_id'],
      ['valor', 'o.price'],
      ['quando', DATA('o.created_at')]
    ]
  },
  {
    nome: 'ofertas',
    partes: 3,
    de: " FROM (SELECT o.advs_negotiation_id AS neg, o.buyer_shop_id AS loja, COUNT(*) AS n," +
        " MAX(o.price) AS maior, BIT_OR(" + BIT('o.created_at') + ") AS dias" +
        " FROM offers o INNER JOIN advertisement_negotiations an ON an.id = o.advs_negotiation_id AND an.deleted_at IS NULL" +
        " INNER JOIN events e ON e.id = an.event_id AND" + EVENTO +
        " WHERE o.deleted_at IS NULL AND o.buyer_shop_id IS NOT NULL AND PARTE" +
        " GROUP BY o.advs_negotiation_id, o.buyer_shop_id) x",
    parte: 'o.advs_negotiation_id',
    cols: [['neg', 'x.neg'], ['loja', 'x.loja'], ['n', 'x.n'], ['maior', 'x.maior'], ['dias', 'x.dias']]
  },
  {
    nome: 'acessos',
    partes: 12,
    de: " FROM (SELECT an.id AS neg, al.shop_id AS loja, BIT_OR(" + BIT('al.created_at') + ") AS dias" +
        " FROM events e INNER JOIN advertisement_negotiations an ON an.event_id = e.id AND an.deleted_at IS NULL" +
        " INNER JOIN access_logs al ON al.advertisement_id = an.advertisement_id AND al.event_id = e.id" +
        " AND al.shop_id IS NOT NULL AND al.created_at >= '" + PISO + "'" +
        " WHERE" + EVENTO + " AND PARTE GROUP BY an.id, al.shop_id) x",
    parte: 'an.id',
    cols: [['neg', 'x.neg'], ['loja', 'x.loja'], ['dias', 'x.dias']]
  },
  {
    nome: 'logins',
    de: " FROM (SELECT al.shop_id AS loja, al.whitelabel_id AS wl, BIT_OR(" + BIT('al.created_at') + ") AS dias" +
        " FROM access_logs al WHERE al.whitelabel_id IN (" + LISTA_WL + ")" +
        " AND al.created_at >= '" + PISO + "' AND al.shop_id IS NOT NULL" +
        " GROUP BY al.shop_id, al.whitelabel_id) x",
    cols: [['loja', 'x.loja'], ['wl', 'x.wl'], ['dias', 'x.dias']]
  },
  {
    nome: 'lojas',
    partes: 2,
    de: " FROM (SELECT al.shop_id AS id FROM access_logs al WHERE al.whitelabel_id IN (" + LISTA_WL + ")" +
        " AND al.created_at >= '" + PISO + "' AND al.shop_id IS NOT NULL" +
        " UNION SELECT al2.shop_id AS id FROM events e INNER JOIN access_logs al2 ON al2.event_id = e.id" +
        " AND al2.shop_id IS NOT NULL AND al2.created_at >= '" + PISO + "' WHERE" + EVENTO +
        " UNION SELECT o.buyer_shop_id AS id FROM offers o INNER JOIN advertisement_negotiations an ON an.id = o.advs_negotiation_id" +
        " AND an.deleted_at IS NULL INNER JOIN events e ON e.id = an.event_id AND" + EVENTO +
        " WHERE o.deleted_at IS NULL AND o.buyer_shop_id IS NOT NULL) ids" +
        " INNER JOIN shops s ON s.id = ids.id WHERE PARTE",
    parte: 's.id',
    cols: [['id', 's.id'], ['nome', 's.name'], ['wl', 's.whitelabel_id'], ['cnpj', 's.cnpj']]
  },
  {
    nome: 'comitentes',
    de: " FROM shops s WHERE s.id IN (SELECT a.shop_id" + NEGS + ")",
    cols: [['id', 's.id'], ['nome', 's.name']]
  }
];
const MESES = 12;
const DIAS_MAX_EVENTO = 31;
const MES = [];
for (let k = MESES - 1; k >= 0; k--) {
  const a = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - k, 1));
  const b = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - k + 1, 1));
  MES.push({ rot: dataDe(a).slice(0, 7), ini: dataDe(a) + ' 00:00:00', fim: dataDe(b) + ' 00:00:00' });
}
const MES_PISO = MES[0].ini;
const BIT_WL = "(1 << (FIELD(ew.whitelabel_id, " + LISTA_WL + ") - 1))";
const EVENTO_MES = (m) =>
  " e.deleted_at IS NULL AND e.start_date_offer < '" + m.fim + "' AND e.finish_date_event >= '" + m.ini + "'" +
  " AND e.start_date_offer <= '" + AGORA_BR + "' AND DATEDIFF(e.finish_date_event, e.start_date_offer) <= " + DIAS_MAX_EVENTO;
const LANCE = "o.deleted_at IS NULL AND o.buyer_shop_id IS NOT NULL";
const CHAVE = "CONCAT(DATE_FORMAT(n.fim, '%Y%m%d%H%i'), LPAD(n.nid, 10, '0'))";
const ULT = (col) => "SUBSTRING_INDEX(MAX(CONCAT(" + CHAVE + ", '|', IFNULL(" + col + ", ''))), '|', -1)";
const deMesVeic = (m) => {
  const evs = "SELECT e.id, e.finish_date_event AS fim, BIT_OR(" + BIT_WL + ") AS wm FROM events e" +
    " INNER JOIN event_whitelabels ew ON ew.event_id = e.id AND ew.whitelabel_id IN (" + LISTA_WL + ")" +
    " WHERE" + EVENTO_MES(m) + " GROUP BY e.id";
  const neg = "SELECT an.id AS nid, a.vehicle_id AS v, a.shop_id AS c, an.status AS st, NULLIF(an.min_sale_price, 0) AS vmv," +
    " ev.fim, ev.wm, " + CATEGORIA('vc', 'cg') + " AS cat," +
    " (SELECT MAX(o.price) FROM offers o WHERE o.advs_negotiation_id = an.id AND " + LANCE + ") AS maior," +
    " EXISTS (SELECT 1 FROM offers o WHERE o.advs_negotiation_id = an.id AND " + LANCE + ") AS tem_lance," +
    " (SELECT o.price FROM offers o WHERE o.id = an.offer_actual_id AND an.status IN (" + STATUS_VENDA.join(',') + ")) AS pv," +
    " EXISTS (SELECT 1 FROM access_logs al WHERE al.advertisement_id = an.advertisement_id AND al.event_id = ev.id" +
    " AND al.shop_id IS NOT NULL) AS ac" +
    " FROM (" + evs + ") ev INNER JOIN advertisement_negotiations an ON an.event_id = ev.id AND an.deleted_at IS NULL" +
    " INNER JOIN advertisements a ON a.id = an.advertisement_id" +
    " INNER JOIN vehicles vc ON vc.id = a.vehicle_id LEFT JOIN categories cg ON cg.id = vc.category_id";
  const veic = "SELECT n.v, " + ULT('n.c') + " AS c, " + ULT('n.st') + " AS st, " + ULT('n.vmv') + " AS vmv, " +
    ULT('n.maior') + " AS maior, " + ULT('n.tem_lance') + " AS tl, " + ULT('n.pv') + " AS pv, " + ULT('n.ac') + " AS ac," +
    " BIT_OR(n.wm) AS wm, MAX(n.cat) AS cat," +
    " NOT EXISTS (SELECT 1 FROM advertisements a2 INNER JOIN advertisement_negotiations an2 ON an2.advertisement_id = a2.id" +
    " AND an2.deleted_at IS NULL INNER JOIN events e2 ON e2.id = an2.event_id AND e2.deleted_at IS NULL" +
    " WHERE a2.vehicle_id = n.v AND e2.start_date_offer < '" + m.ini + "') AS novo" +
    " FROM (" + neg + ") n GROUP BY n.v";
  const vend = "(x.st IN (" + STATUS_VENDA.join(',') + "))";
  const co = "(" + vend + " OR x.tl = '1')";
  const vm = "(" + vend + " OR (x.vmv <> '' AND x.maior <> '' AND x.maior + 0 >= x.vmv + 0))";
  const ac = "(x.ac = '1')";
  return " FROM (SELECT x.c, x.wm, x.cat, COUNT(*) AS veic, SUM(x.novo) AS novos, SUM(" + ac + ") AS ac, SUM(" + co + ") AS ofe, SUM(" + vend + ") AS ve," +
    " SUM(x.novo AND " + ac + ") AS ac_n, SUM(x.novo AND " + co + ") AS of_n, SUM(x.novo AND " + vend + ") AS ve_n," +
    " SUM(NOT " + co + ") AS so, SUM(" + co + ") AS co, SUM(" + vm + ") AS vm, SUM(" + vend + ") AS vd, SUM(x.st IN (8, 10)) AS rm," +
    " SUM(IF(" + vend + " AND x.pv <> '', x.pv + 0, 0)) AS valor" +
    " FROM (" + veic + ") x GROUP BY x.c, x.wm, x.cat) g";
};
const deMesLoj = (m) => {
  const evs = "SELECT e.id FROM events e WHERE" + EVENTO_MES(m) +
    " AND EXISTS (SELECT 1 FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id IN (" + LISTA_WL + "))";
  const noMes = (col) => col + " >= '" + m.ini + "' AND " + col + " < '" + m.fim + "'";
  const base = " FROM (" + evs + ") ev INNER JOIN advertisement_negotiations an ON an.event_id = ev.id AND an.deleted_at IS NULL";
  const anuncio = " INNER JOIN advertisements a ON a.id = an.advertisement_id";
  const acoes = "SELECT DISTINCT 1 AS k, al.shop_id AS l, a.shop_id AS c, ev.id AS eid" + base + anuncio +
    " INNER JOIN access_logs al ON al.advertisement_id = an.advertisement_id AND al.event_id = ev.id AND al.shop_id IS NOT NULL" +
    " AND " + noMes('al.created_at') +
    " UNION SELECT DISTINCT 2, o.buyer_shop_id, a.shop_id, ev.id" + base + anuncio +
    " INNER JOIN offers o ON o.advs_negotiation_id = an.id AND " + LANCE + " AND " + noMes('o.created_at') +
    " UNION SELECT DISTINCT 4, o.buyer_shop_id, a.shop_id, ev.id" + base + " AND an.status IN (" + STATUS_VENDA.join(',') + ")" + anuncio +
    " INNER JOIN offers o ON o.id = an.offer_actual_id AND o.buyer_shop_id IS NOT NULL AND " + noMes('o.created_at');
  const conta = "COUNT(DISTINCT IF(x.k = 1, x.l, NULL)) AS ac, COUNT(DISTINCT IF(x.k = 2, x.l, NULL)) AS ofe," +
    " COUNT(DISTINCT IF(x.k = 4, x.l, NULL)) AS co";
  const porCanal = " FROM (" + acoes + ") x INNER JOIN event_whitelabels ew ON ew.event_id = x.eid AND ew.whitelabel_id IN (" + LISTA_WL + ")";
  return " FROM (SELECT ew.whitelabel_id AS wl, x.c, " + conta + porCanal + " GROUP BY ew.whitelabel_id, x.c" +
    " UNION ALL SELECT ew.whitelabel_id, 0, " + conta + porCanal + " GROUP BY ew.whitelabel_id" +
    " UNION ALL SELECT 0, x.c, " + conta + " FROM (" + acoes + ") x GROUP BY x.c" +
    " UNION ALL SELECT 0, 0, " + conta + " FROM (" + acoes + ") x) g";
};
TABELAS.push(
  {
    nome: 'mes_veic',
    meses: true,
    deMes: deMesVeic,
    cols: [['c', 'g.c'], ['wm', 'g.wm'], ['veic', 'g.veic'], ['novos', 'g.novos'], ['ac', 'g.ac'], ['of', 'g.ofe'], ['ve', 'g.ve'],
      ['ac_n', 'g.ac_n'], ['of_n', 'g.of_n'], ['ve_n', 'g.ve_n'], ['so', 'g.so'], ['co', 'g.co'], ['vm', 'g.vm'], ['vd', 'g.vd'],
      ['rm', 'g.rm'], ['valor', 'g.valor'], ['cat', 'g.cat']]
  },
  {
    nome: 'mes_loj',
    meses: true,
    deMes: deMesLoj,
    cols: [['wl', 'g.wl'], ['c', 'g.c'], ['ac', 'g.ac'], ['of', 'g.ofe'], ['co', 'g.co']]
  },
  {
    nome: 'mes_eventos',
    de: " FROM (SELECT e.id, DATE_FORMAT(e.start_date_offer, '%Y-%m-%d') AS ini, DATE_FORMAT(e.finish_date_event, '%Y-%m-%d') AS fim," +
        " (SELECT BIT_OR(" + BIT_WL + ") FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id IN (" + LISTA_WL + ")) AS wm," +
        " (SELECT GROUP_CONCAT(DISTINCT a.shop_id) FROM advertisement_negotiations an INNER JOIN advertisements a ON a.id = an.advertisement_id" +
        " WHERE an.event_id = e.id AND an.deleted_at IS NULL) AS cs" +
        " FROM events e WHERE e.deleted_at IS NULL AND e.finish_date_event >= '" + MES_PISO + "' AND e.start_date_offer <= '" + AGORA_BR + "'" +
        " AND DATEDIFF(e.finish_date_event, e.start_date_offer) <= " + DIAS_MAX_EVENTO +
        " AND EXISTS (SELECT 1 FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id IN (" + LISTA_WL + "))) g",
    cols: [['ini', 'g.ini'], ['fim', 'g.fim'], ['wm', 'g.wm'], ['cs', 'g.cs']]
  },
  {
    nome: 'mes_dias_acesso',
    de: " FROM (SELECT DATE_FORMAT(al.created_at, '%Y-%m') AS m, COUNT(DISTINCT DATE(al.created_at)) AS dias" +
        " FROM access_logs al WHERE al.created_at >= '" + MES_PISO + "' GROUP BY m) g",
    cols: [['mes', 'g.m'], ['dias', 'g.dias']]
  },
  {
    nome: 'mes_comitentes',
    de: " FROM shops s WHERE s.id IN (SELECT a.shop_id FROM events e INNER JOIN advertisement_negotiations an ON an.event_id = e.id" +
        " AND an.deleted_at IS NULL INNER JOIN advertisements a ON a.id = an.advertisement_id" +
        " WHERE e.deleted_at IS NULL AND e.finish_date_event >= '" + MES_PISO + "' AND e.start_date_offer <= '" + AGORA_BR + "'" +
        " AND DATEDIFF(e.finish_date_event, e.start_date_offer) <= " + DIAS_MAX_EVENTO +
        " AND EXISTS (SELECT 1 FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id IN (" + LISTA_WL + ")))",
    cols: [['id', 's.id'], ['nome', 's.name']]
  }
);
function temJanela(sql) {
  const u = String(sql).toUpperCase();
  return u.indexOf('OVER (') >= 0 || u.indexOf('OVER(') >= 0;
}
const PARTES = {};
const itens = [];
TABELAS.forEach((t) => {
  const n = t.meses ? MESES : (t.partes || 1);
  PARTES[t.nome] = n;
  for (let p = 0; p < n; p++) {
    const de = t.meses ? t.deMes(MES[p]) : n > 1 ? t.de.split('PARTE').join('MOD(' + t.parte + ', ' + n + ') = ' + p) : t.de;
    if (de.indexOf('PARTE') >= 0) throw new Error(t.nome + ': PARTE sobrou numa tabela de uma parte so');
    const cols = t.meses ? [['m', String(p)]].concat(t.cols) : t.cols;
    const sql = "SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(" +
      cols.map((c) => c[1]).join(', ') + ")) AS linhas" + de;
    if (temJanela(sql)) throw new Error('funcao de janela em ' + t.nome + ' (o MCP rejeita)');
    if (sql.toUpperCase().indexOf('WITH ROLLUP') >= 0) throw new Error('WITH ROLLUP em ' + t.nome + ' (o MCP rejeita: run 68394)');
    itens.push({
      json: {
        queryName: n > 1 ? t.nome + '_p' + p : t.nome,
        tabela: t.nome,
        database: DB,
        sql: sql,
        cols: cols.map((c) => c[0]),
        idx: itens.length,
        meta: { wls: WLS, dias: DIAS, piso: PISO, piso_dia: PISO_DIA, agora_br: AGORA_BR, partes: PARTES,
          meses: MES.map((m) => m.rot), dias_max_evento: DIAS_MAX_EVENTO }
      }
    });
  }
});
return itens;
