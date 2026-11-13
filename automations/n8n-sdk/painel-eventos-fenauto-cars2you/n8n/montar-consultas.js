const WL_C6 = 43;
const VENDEDORES_IGA = [594, 598, 16036];
const INICIO_CAMPANHA = '2026-11-10 00:00:00';
const MESES_SEM_COMPRA = 6;
const GRUPOS_IGA = [148];
const GRUPOS_C6 = [69, 146];
const NOME_EVENTO = 'fenauto';
const DURACAO_MAX_DIAS = 31;
const FUSO_MIN = -180;
const DB = 'cars2you_production';
const pad = (n) => String(n).padStart(2, '0');
const dataDe = (d) => d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
const agora = new Date(Date.now() + FUSO_MIN * 60000);
const AGORA_BR = dataDe(agora) + ' ' + pad(agora.getUTCHours()) + ':' + pad(agora.getUTCMinutes());
const segunda = new Date(agora.getTime() - ((agora.getUTCDay() + 6) % 7) * 86400000);
const SEMANA_INI = dataDe(segunda) + ' 00:00:00';
const SEMANA_FIM = dataDe(new Date(segunda.getTime() + 7 * 86400000)) + ' 00:00:00';
const SEM_COMPRA_DESDE = dataDe(new Date(Date.UTC(Number(INICIO_CAMPANHA.slice(0, 4)),
  Number(INICIO_CAMPANHA.slice(5, 7)) - 1 - MESES_SEM_COMPRA, Number(INICIO_CAMPANHA.slice(8, 10))))) +
  INICIO_CAMPANHA.slice(10);
const EH_C6 = "EXISTS (SELECT 1 FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id = " + WL_C6 + ")";
const EH_IGA = "EXISTS (SELECT 1 FROM advertisement_negotiations ani" +
  " INNER JOIN advertisements ai ON ai.id = ani.advertisement_id" +
  " WHERE ani.event_id = e.id AND ani.deleted_at IS NULL AND ai.shop_id IN (" + VENDEDORES_IGA.join(',') + "))";
const EVENTO =
  " e.deleted_at IS NULL AND e.start_date_offer < '" + SEMANA_FIM + "' AND e.finish_date_event >= '" + SEMANA_INI + "'" +
  " AND DATEDIFF(e.finish_date_event, e.start_date_offer) <= " + DURACAO_MAX_DIAS +
  " AND e.name LIKE '%" + NOME_EVENTO + "%'" +
  " AND (" + EH_C6 + " OR " + EH_IGA + ")";
const OFERTAS_DO_RECORTE =
  " FROM offers o" +
  " INNER JOIN advertisement_negotiations an ON an.id = o.advs_negotiation_id AND an.deleted_at IS NULL" +
  " INNER JOIN events e ON e.id = an.event_id AND" + EVENTO +
  " WHERE o.deleted_at IS NULL";
const ACESSOS_DO_EVENTO =
  " FROM events e INNER JOIN access_logs al ON al.event_id = e.id" +
  " AND al.shop_id IS NOT NULL" +
  " AND al.created_at >= e.start_date_offer AND al.created_at <= e.finish_date_event" +
  " WHERE" + EVENTO;
const EXTERNO = "u.deleted_at IS NULL AND u.email NOT LIKE '%@cars2you.com.br' AND u.email NOT LIKE '%@itau%'" +
  " AND u.email NOT LIKE '%@c6bank%' AND u.email NOT LIKE '%teste%'";
const VOLTA = "SELECT al.shop_id, MIN(al.created_at) AS volta FROM access_logs al" +
  " WHERE al.created_at >= '" + INICIO_CAMPANHA + "' AND al.shop_id IS NOT NULL GROUP BY al.shop_id";
const COMPRAS = "SELECT DISTINCT o.buyer_shop_id AS shop_id FROM offers o" +
  " INNER JOIN advertisement_negotiations an ON an.offer_actual_id = o.id AND an.deleted_at IS NULL AND an.status IN (2, 3, 7)" +
  " WHERE o.deleted_at IS NULL AND o.buyer_shop_id IS NOT NULL" +
  " AND o.created_at >= '" + SEM_COMPRA_DESDE + "' AND o.created_at < '" + INICIO_CAMPANHA + "'";
const CLIENTES = "SELECT cg.op, s.id, DATE_FORMAT(IF(s.created_at >= '" + INICIO_CAMPANHA + "', s.created_at, va.volta), '%Y-%m-%d %H:%i') AS entrada" +
  " FROM (SELECT DISTINCT CASE WHEN ucg.client_group_id IN (" + GRUPOS_IGA.join(',') + ") THEN 'IGA' ELSE 'C6' END AS op, us.shop_id" +
  " FROM user_clients_group ucg INNER JOIN users u ON u.id = ucg.user_id AND " + EXTERNO +
  " INNER JOIN user_shops us ON us.user_id = u.id" +
  " WHERE ucg.client_group_id IN (" + GRUPOS_IGA.concat(GRUPOS_C6).join(',') + ")) cg" +
  " INNER JOIN shops s ON s.id = cg.shop_id AND s.deleted_at IS NULL AND s.name NOT LIKE '%teste%'" +
  " LEFT JOIN (" + VOLTA + ") va ON va.shop_id = s.id" +
  " LEFT JOIN (" + COMPRAS + ") cp ON cp.shop_id = s.id" +
  " WHERE s.created_at >= '" + INICIO_CAMPANHA + "' OR (va.volta IS NOT NULL AND cp.shop_id IS NULL)";
const DATA = (col) =>"DATE_FORMAT(" + col + ", '%Y-%m-%d %H:%i')";
const TABELAS = [
  {
    nome: 'eventos',
    de: " FROM events e WHERE" + EVENTO,
    cols: [
      ['id', 'e.id'],
      ['nome', 'e.name'],
      ['status', 'e.status'],
      ['situacao', 'e.situation'],
      ['ini', DATA('e.start_date_offer')],
      ['fim', DATA('e.finish_date_event')],
      ['op', "CASE WHEN " + EH_C6 + " THEN 'C6' ELSE 'IGA' END"],
      ['wls', "(SELECT GROUP_CONCAT(ew2.whitelabel_id ORDER BY ew2.whitelabel_id)" +
              " FROM event_whitelabels ew2 WHERE ew2.event_id = e.id)"]
    ]
  },
  {
    nome: 'veiculos',
    de: " FROM advertisement_negotiations an" +
        " INNER JOIN events e ON e.id = an.event_id AND" + EVENTO +
        " INNER JOIN advertisements a ON a.id = an.advertisement_id" +
        " INNER JOIN vehicles v ON v.id = a.vehicle_id" +
        " LEFT JOIN brands b ON b.id = v.brand_id" +
        " LEFT JOIN models m ON m.id = v.model_id" +
        " LEFT JOIN versions ver ON ver.id = v.version_id" +
        " LEFT JOIN shop_stocks ss ON ss.id = a.shop_stock_id" +
        " WHERE an.deleted_at IS NULL",
    cols: [
      ['neg', 'an.id'],
      ['evento', 'an.event_id'],
      ['anuncio', 'a.id'],
      ['uuid', 'a.uuid'],
      ['veiculo', 'a.vehicle_id'],
      ['vendedor', 'a.shop_id'],
      ['status', 'an.status'],
      ['vencedora', 'an.offer_actual_id'],
      ['vmv', 'NULLIF(an.min_sale_price, 0)'],
      ['fipe', 'NULLIF(a.fipe_price, 0)'],
      ['marca', 'b.name'],
      ['modelo', 'm.name'],
      ['versao', 'ver.name'],
      ['ano_fab', 'v.manufacture_year'],
      ['ano_mod', 'v.model_year'],
      ['km', 'NULLIF(v.km, 0)'],
      ['patio', 'ss.name'],
      ['anuncio_apagado', 'a.deleted_at IS NOT NULL']
    ]
  },
  {
    nome: 'ofertas',
    de: OFERTAS_DO_RECORTE,
    cols: [
      ['id', 'o.id'],
      ['neg', 'o.advs_negotiation_id'],
      ['loja', 'o.buyer_shop_id'],
      ['usuario', 'o.buyer_user_id'],
      ['valor', 'o.price'],
      ['quando', DATA('o.created_at')]
    ]
  },
  {
    nome: 'lojas',
    de: " FROM (SELECT u0.id, MAX(u0.c6) AS c6, MAX(u0.iga) AS iga FROM (" +
        "SELECT DISTINCT o.buyer_shop_id AS id, NULL AS c6, NULL AS iga" + OFERTAS_DO_RECORTE +
        " AND o.buyer_shop_id IS NOT NULL" +
        " UNION ALL SELECT DISTINCT al.shop_id AS id, NULL AS c6, NULL AS iga" + ACESSOS_DO_EVENTO +
        " UNION ALL SELECT f.id, IF(f.op = 'C6', f.entrada, NULL), IF(f.op = 'IGA', f.entrada, NULL)" +
        " FROM (" + CLIENTES + ") f" +
        ") u0 GROUP BY u0.id) ids" +
        " INNER JOIN shops s ON s.id = ids.id",
    cols: [
      ['id', 's.id'],
      ['nome', 's.name'],
      ['wl', 's.whitelabel_id'],
      ['situacao', 's.situation'],
      ['cadastro', DATA('s.created_at')],
      ['apagada', 's.deleted_at IS NOT NULL'],
      ['fenauto_c6', 'ids.c6'],
      ['fenauto_iga', 'ids.iga']
    ]
  },
  {
    nome: 'acessos_anuncio',
    de: " FROM (SELECT e.id AS ev, al.advertisement_id AS anuncio, al.shop_id AS loja," +
        " BIT_OR(1 << DATEDIFF(al.created_at, e.start_date_offer)) AS dias" +
        " FROM events e INNER JOIN access_logs al ON al.event_id = e.id" +
        " AND al.advertisement_id IS NOT NULL AND al.shop_id IS NOT NULL" +
        " AND al.created_at >= e.start_date_offer AND al.created_at <= e.finish_date_event" +
        " WHERE" + EVENTO + " GROUP BY e.id, al.advertisement_id, al.shop_id) x",
    cols: [
      ['evento', 'x.ev'],
      ['anuncio', 'x.anuncio'],
      ['loja', 'x.loja'],
      ['dias', 'x.dias']
    ]
  }
];
const PARTES_ACESSO = 2;
for (let p = 0; p < PARTES_ACESSO; p++) {
  TABELAS.push({
    nome: 'acessos_p' + p,
    de: " FROM (SELECT e.id AS ev, al.shop_id AS loja, DATE_FORMAT(al.created_at, '%y%m%d') AS dia," +
        " HOUR(al.created_at) AS hora, COUNT(*) AS n" + ACESSOS_DO_EVENTO +
        " AND MOD(al.shop_id, " + PARTES_ACESSO + ") = " + p +
        " GROUP BY e.id, al.shop_id, DATE_FORMAT(al.created_at, '%y%m%d'), HOUR(al.created_at)) x",
    cols: [
      ['loja', 'x.loja'],
      ['dia', 'x.dia'],
      ['hora', 'x.hora'],
      ['n', 'x.n'],
      ['evento', 'x.ev']
    ]
  });
}
function temJanela(sql) {
  const u = String(sql).toUpperCase();
  return u.indexOf('OVER (') >= 0 || u.indexOf('OVER(') >= 0;
}
const itens = TABELAS.map((t, i) => {
  const sql = "SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(" +
    t.cols.map((c) => c[1]).join(', ') + ")) AS linhas" + t.de;
  if (temJanela(sql)) throw new Error('funcao de janela em ' + t.nome + ' (o MCP rejeita)');
  return {
    json: {
      queryName: t.nome,
      database: DB,
      sql: sql,
      cols: t.cols.map((c) => c[0]),
      idx: i,
      meta: {
        semana: [SEMANA_INI, SEMANA_FIM], nome_evento: NOME_EVENTO, agora_br: AGORA_BR, partes_acesso: PARTES_ACESSO,
        wl_c6: WL_C6, vendedores_iga: VENDEDORES_IGA,
        inicio_campanha: INICIO_CAMPANHA, sem_compra_desde: SEM_COMPRA_DESDE, meses_sem_compra: MESES_SEM_COMPRA,
        grupos_iga: GRUPOS_IGA, grupos_c6: GRUPOS_C6
      }
    }
  };
});
return itens;
