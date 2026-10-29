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
      ['uuid', "(SELECT a3.uuid FROM advertisements a3 WHERE a3.vehicle_id = v.id ORDER BY a3.id DESC LIMIT 1)"]
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
function temJanela(sql) {
  const u = String(sql).toUpperCase();
  return u.indexOf('OVER (') >= 0 || u.indexOf('OVER(') >= 0;
}
const PARTES = {};
const itens = [];
TABELAS.forEach((t) => {
  const n = t.partes || 1;
  PARTES[t.nome] = n;
  for (let p = 0; p < n; p++) {
    const de = n > 1 ? t.de.split('PARTE').join('MOD(' + t.parte + ', ' + n + ') = ' + p) : t.de;
    if (de.indexOf('PARTE') >= 0) throw new Error(t.nome + ': PARTE sobrou numa tabela de uma parte so');
    const sql = "SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(" +
      t.cols.map((c) => c[1]).join(', ') + ")) AS linhas" + de;
    if (temJanela(sql)) throw new Error('funcao de janela em ' + t.nome + ' (o MCP rejeita)');
    itens.push({
      json: {
        queryName: n > 1 ? t.nome + '_p' + p : t.nome,
        tabela: t.nome,
        database: DB,
        sql: sql,
        cols: t.cols.map((c) => c[0]),
        idx: itens.length,
        meta: { wls: WLS, dias: DIAS, piso: PISO, piso_dia: PISO_DIA, agora_br: AGORA_BR, partes: PARTES }
      }
    });
  }
});
return itens;
