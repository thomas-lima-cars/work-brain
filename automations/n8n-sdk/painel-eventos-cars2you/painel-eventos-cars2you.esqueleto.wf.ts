import { workflow, node, trigger, newCredential, expr } from '@n8n/workflow-sdk';

const rodar = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Rodar', position: [0, 0] }
});

/* a agenda (Thomas, 06/11: "de hora em hora das 9h as 18h"): todo dia, no
   minuto 0, das 9h as 18h -- 10 runs. O fuso do workflow e America/Sao_Paulo
   (setWorkflowSettings, no n8n). O Rodar fica para rodada avulsa */
const agenda = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'De hora em hora, 9h às 18h',
    position: [0, -208],
    parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 9-18 * * *' }] } }
  }
});

/* o Montar Painel dividido (ver build_wf.py): as pecas grandes vem antes */
const pecasTema = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Peças do Tema',
    position: [224, 0],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `return [{ json: { marcador: true } }];` }
  }
});

const pecasPagina = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Peças da Página',
    position: [448, 0],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `return [{ json: { marcador: true } }];` }
  }
});

/* a carteira comercial, EM SERIE e antes das consultas (ver build_wf.py) */
const carteira = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Ler Carteira',
    position: [672, 0],
    onError: 'continueRegularOutput',
    parameters: {
      method: 'GET',
      url: 'https://automakers.sharepoint.com/sites/N8N/_api/v2.0/drives/b!WIoPIE-Ra0WlwvYnLSod44VOGNL5_GRNoDqrqsWDT53xop-CS7vvT4Ura4LiRKaM/root:/Radar%20de%20Estoque/_dados/carteira-comercial.json:/content',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'microsoftSharePointOAuth2Api',
      options: { timeout: 60000, response: { response: { responseFormat: 'json' } } }
    },
    credentials: { microsoftSharePointOAuth2Api: newCredential('Microsoft SharePoint Conta PowerBI/Automações', 'AOTm9J6pFcF0DS6g') }
  }
});

/* as metas, em serie: um download, um item por aba de mes, um Extract por item (ver build_wf.py) */
const lerMetas = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Ler Metas',
    position: [896, 0],
    onError: 'continueRegularOutput',
    executeOnce: true,
    parameters: {
      method: 'GET',
      url: 'https://automakers.sharepoint.com/sites/N8N/_api/v2.0/drives/b!WIoPIE-Ra0WlwvYnLSod44VOGNL5_GRNoDqrqsWDT53xop-CS7vvT4Ura4LiRKaM/root:/Comitente%20-%20Metas/metas-painel-eventos.xlsx:/content',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'microsoftSharePointOAuth2Api',
      options: { timeout: 60000, response: { response: { responseFormat: 'file' } } }
    },
    credentials: { microsoftSharePointOAuth2Api: newCredential('Microsoft SharePoint Conta PowerBI/Automações', 'AOTm9J6pFcF0DS6g') }
  }
});

const abasMetas = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Abas das Metas',
    position: [1120, 0],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `const FUSO_MIN = -180;
const MESES = 12;
const agora = new Date(Date.now() + FUSO_MIN * 60000);
const pad = (n) => String(n).padStart(2, '0');
const arq = $input.first();
const binario = arq && arq.binary && arq.binary.data ? arq.binary : null;
const itens = [];
for (let k = MESES - 1; k >= 0; k--) {
const a = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - k, 1));
const aba = a.getUTCFullYear() + '-' + pad(a.getUTCMonth() + 1);
itens.push(binario ? { json: { aba: aba }, binary: binario } : { json: { aba: aba, sem_arquivo: true } });
}
return itens;
` }
  }
});

const metas = node({
  type: 'n8n-nodes-base.extractFromFile',
  version: 1.2,
  config: {
    name: 'Metas',
    position: [1344, 0],
    onError: 'continueRegularOutput',
    alwaysOutputData: true,
    parameters: { operation: 'xlsx', binaryPropertyName: 'data', options: { headerRow: false, sheetName: expr('{{ $json.aba }}') } }
  }
});

const consultas = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Montar Consultas',
    position: [1792, 0],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `const WLS = [4, 7, 43, 48, 62, 65];
const DIAS = 30;
const STATUS_VENDA = [2, 3, 7];
const STATUS_SISTEMA = [1, 2, 3, 7, 8, 9, 10, 11, 13, 14, 15, 18];
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
partes: 16,
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
partes: 8,
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
const PARTES_LOJD = 3;
const PARTES_EVENTOS = 3;
const MES = [];
for (let k = MESES - 1; k >= 0; k--) {
const a = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - k, 1));
const b = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - k + 1, 1));
const ult = k === 0 ? dataDe(agora) : dataDe(new Date(b.getTime() - 86400000));
MES.push({ rot: dataDe(a).slice(0, 7), ini: dataDe(a) + ' 00:00:00', fim: dataDe(b) + ' 00:00:00', dia0: dataDe(a), ult: ult });
}
const MES_PISO = MES[0].ini;
const BIT_WL = "(1 << (FIELD(ew.whitelabel_id, " + LISTA_WL + ") - 1))";
const EVENTO_MES = (m) =>
" e.deleted_at IS NULL AND e.start_date_offer < '" + m.fim + "' AND e.finish_date_event >= '" + m.ini + "'" +
" AND e.start_date_offer <= '" + AGORA_BR + "' AND DATEDIFF(e.finish_date_event, e.start_date_offer) <= " + DIAS_MAX_EVENTO +
" AND EXISTS (SELECT 1 FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id IN (" + LISTA_WL + "))";
const VENDA_IN = STATUS_VENDA.join(',');
const LANCE = "o.deleted_at IS NULL AND o.buyer_shop_id IS NOT NULL";
const CHAVE = "CONCAT(DATE_FORMAT(n.fim, '%Y%m%d%H%i'), LPAD(n.nid, 10, '0'))";
const ULT_ID = (col) => "SUBSTRING_INDEX(MAX(CONCAT(LPAD(n.nid, 10, '0'), '|', IFNULL(" + col + ", ''))), '|', -1)";
const K0 = (m) => "DATEDIFF(GREATEST(DATE(e.start_date_offer), '" + m.dia0 + "'), '" + m.dia0 + "')";
const K1 = (m) => "DATEDIFF(LEAST(DATE(e.finish_date_event), '" + m.ult + "'), '" + m.dia0 + "')";
const NEG_LEVE = (m) => "SELECT an.id AS nid, an.event_id AS eid, a.vehicle_id AS v, e.finish_date_event AS fim," +
" " + K0(m) + " AS k0, " + K1(m) + " AS k1" +
" FROM events e INNER JOIN advertisement_negotiations an ON an.event_id = e.id AND an.deleted_at IS NULL" +
" INNER JOIN advertisements a ON a.id = an.advertisement_id WHERE" + EVENTO_MES(m);
const NOVO = (m, col) => "NOT EXISTS (SELECT 1 FROM advertisements a2 INNER JOIN advertisement_negotiations an2 ON an2.advertisement_id = a2.id" +
" AND an2.deleted_at IS NULL INNER JOIN events e2 ON e2.id = an2.event_id AND e2.deleted_at IS NULL" +
" WHERE a2.vehicle_id = " + col + " AND e2.start_date_offer < '" + m.ini + "')";
const DIAS_MES = (() => {
const u = [];
for (let k = 0; k <= 30; k++) u.push('SELECT ' + k + ' AS k');
return '(' + u.join(' UNION ALL ') + ')';
})();
const BLOCO_EV = (p, w) => {
const e = (c) => (w === '1' ? c : '(' + w + ' AND ' + c + ')');
const vend = "o.st IN (" + VENDA_IN + ")";
const co = "(" + vend + " OR o.tl = '1')";
const ac = "o.ac = '1'";
return [
[p + 'veic', 'SUM(' + w + ')'],
[p + 'novos', 'SUM(' + e('d.novo') + ')'],
[p + 'ac', 'SUM(' + e(ac) + ')'],
[p + 'of', 'SUM(' + e(co) + ')'],
[p + 've', 'SUM(' + e(vend) + ')'],
[p + 'ac_n', 'SUM(' + e('d.novo AND ' + ac) + ')'],
[p + 'of_n', 'SUM(' + e('d.novo AND ' + co) + ')'],
[p + 've_n', 'SUM(' + e('d.novo AND ' + vend) + ')']
].concat(STATUS_SISTEMA.map((s) => [p + 's' + s, 'SUM(' + e('o.st = ' + s) + ')']), [
[p + 'sx', 'SUM(' + e('o.st NOT IN (' + STATUS_SISTEMA.join(',') + ')') + ')'],
[p + 'valor', 'SUM(IF(' + e(vend + " AND o.pv <> ''") + ', o.pv + 0, 0))']
]);
};
const COLS_EV = BLOCO_EV('o_', '1').concat(BLOCO_EV('d_', '(o.eid = d.de)'));
const deMesEv = (m) => {
const neg = "SELECT an.id AS nid, an.event_id AS eid, a.vehicle_id AS v, a.shop_id AS c, an.status AS st, " + CATEGORIA('vc', 'cg') + " AS cat," +
" EXISTS (SELECT 1 FROM offers o WHERE o.advs_negotiation_id = an.id AND " + LANCE + ") AS tl," +
" (SELECT o.price FROM offers o WHERE o.id = an.offer_actual_id AND an.status IN (" + VENDA_IN + ")) AS pv," +
" EXISTS (SELECT 1 FROM access_logs al WHERE al.advertisement_id = an.advertisement_id AND al.event_id = e.id" +
" AND al.shop_id IS NOT NULL) AS ac" +
" FROM events e INNER JOIN advertisement_negotiations an ON an.event_id = e.id AND an.deleted_at IS NULL" +
" INNER JOIN advertisements a ON a.id = an.advertisement_id" +
" INNER JOIN vehicles vc ON vc.id = a.vehicle_id LEFT JOIN categories cg ON cg.id = vc.category_id WHERE" + EVENTO_MES(m);
const own = "SELECT n.eid, n.v, " + ULT_ID('n.c') + " AS c, " + ULT_ID('n.st') + " AS st, " + ULT_ID('n.tl') + " AS tl, " +
ULT_ID('n.pv') + " AS pv, " + ULT_ID('n.ac') + " AS ac, MAX(n.cat) AS cat FROM (" + neg + ") n GROUP BY n.eid, n.v";
const dono = "SELECT n.v, SUBSTRING_INDEX(MAX(CONCAT(" + CHAVE + ", '|', n.eid)), '|', -1) AS de, " + NOVO(m, 'n.v') + " AS novo" +
" FROM (" + NEG_LEVE(m) + ") n GROUP BY n.v";
return " FROM (SELECT o.eid, o.c, o.cat, " + COLS_EV.map((c) => c[1] + ' AS ' + c[0]).join(', ') +
" FROM (" + own + ") o INNER JOIN (" + dono + ") d ON d.v = o.v GROUP BY o.eid, o.c, o.cat) g";
};
const BLOCO_DIA = (p, w) => {
const e = (c) => (w === '1' ? c : '(' + w + ' AND ' + c + ')');
const ate = (col) => "(" + col + " <> '' AND " + col + " + 0 <= dd.k)";
const ve = ate('o.fvk');
const of = "(" + ve + " OR " + ate('o.flk') + ")";
const ac = ate('o.fak');
const nv = "s.ek = dd.k";
return [
[p + 'veic', 'SUM(' + w + ')'],
[p + 'novos', 'SUM(' + e(nv) + ')'],
[p + 'ac', 'SUM(' + e(ac) + ')'],
[p + 'of', 'SUM(' + e(of) + ')'],
[p + 've', 'SUM(' + e(ve) + ')'],
[p + 'ac_n', 'SUM(' + e(nv + ' AND ' + ac) + ')'],
[p + 'of_n', 'SUM(' + e(nv + ' AND ' + of) + ')'],
[p + 've_n', 'SUM(' + e(nv + ' AND ' + ve) + ')']
];
};
const COLS_DIA = BLOCO_DIA('o_', '1').concat(BLOCO_DIA('d_', '(o.eid = d.de)'));
const deMesDia = (m) => {
const desde = (col) => "DATEDIFF(" + col + ", '" + m.dia0 + "')";
const neg = "SELECT an.id AS nid, an.event_id AS eid, a.vehicle_id AS v, a.shop_id AS c, " + CATEGORIA('vc', 'cg') + " AS cat," +
" " + K0(m) + " AS k0, " + K1(m) + " AS k1," +
" " + desde("(SELECT MIN(al.created_at) FROM access_logs al WHERE al.advertisement_id = an.advertisement_id AND al.event_id = e.id" +
" AND al.shop_id IS NOT NULL)") + " AS fak," +
" " + desde("(SELECT MIN(o.created_at) FROM offers o WHERE o.advs_negotiation_id = an.id AND " + LANCE + ")") + " AS flk," +
" IF(an.status IN (" + VENDA_IN + "), " + desde("(SELECT o.created_at FROM offers o WHERE o.id = an.offer_actual_id)") + ", NULL) AS fvk" +
" FROM events e INNER JOIN advertisement_negotiations an ON an.event_id = e.id AND an.deleted_at IS NULL" +
" INNER JOIN advertisements a ON a.id = an.advertisement_id" +
" INNER JOIN vehicles vc ON vc.id = a.vehicle_id LEFT JOIN categories cg ON cg.id = vc.category_id WHERE" + EVENTO_MES(m);
const own = "SELECT n.eid, n.v, " + ULT_ID('n.c') + " AS c, " + ULT_ID('n.fak') + " AS fak, " + ULT_ID('n.flk') + " AS flk, " +
ULT_ID('n.fvk') + " AS fvk, MAX(n.cat) AS cat, MIN(n.k0) AS k0, MAX(n.k1) AS k1 FROM (" + neg + ") n GROUP BY n.eid, n.v";
const dono = "SELECT n.v, dd.k, SUBSTRING_INDEX(MAX(CONCAT(" + CHAVE + ", '|', n.eid)), '|', -1) AS de" +
" FROM (" + NEG_LEVE(m) + ") n INNER JOIN " + DIAS_MES + " dd ON dd.k BETWEEN n.k0 AND n.k1 GROUP BY n.v, dd.k";
const est = "SELECT x.v, DATEDIFF((SELECT MIN(e2.start_date_offer) FROM advertisements a2" +
" INNER JOIN advertisement_negotiations an2 ON an2.advertisement_id = a2.id AND an2.deleted_at IS NULL" +
" INNER JOIN events e2 ON e2.id = an2.event_id AND e2.deleted_at IS NULL WHERE a2.vehicle_id = x.v), '" + m.dia0 + "') AS ek" +
" FROM (SELECT DISTINCT n.v FROM (" + NEG_LEVE(m) + ") n) x";
return " FROM (SELECT dd.k, o.eid, o.c, o.cat, " + COLS_DIA.map((c) => c[1] + ' AS ' + c[0]).join(', ') +
" FROM (" + own + ") o INNER JOIN " + DIAS_MES + " dd ON dd.k BETWEEN o.k0 AND o.k1" +
" INNER JOIN (" + dono + ") d ON d.v = o.v AND d.k = dd.k" +
" INNER JOIN (" + est + ") s ON s.v = o.v GROUP BY dd.k, o.eid, o.c, o.cat) g";
};
const deMesLojd = (m, p) => {
const noMes = (col) => col + " >= '" + m.ini + "' AND " + col + " < '" + m.fim + "'";
const bitDia = (col) => "(1 << (DAY(" + col + ") - 1))";
const evs = "SELECT e.id FROM events e WHERE" + EVENTO_MES(m) + " AND MOD(e.id, " + PARTES_LOJD + ") = " + p;
const base = " FROM (" + evs + ") ev INNER JOIN advertisement_negotiations an ON an.event_id = ev.id AND an.deleted_at IS NULL";
const acoes = "SELECT 1 AS t, al.shop_id AS l, ev.id AS eid, " + bitDia('al.created_at') + " AS b" + base +
" INNER JOIN access_logs al ON al.advertisement_id = an.advertisement_id AND al.event_id = ev.id AND al.shop_id IS NOT NULL" +
" AND " + noMes('al.created_at') +
" UNION ALL SELECT 2, o.buyer_shop_id, ev.id, " + bitDia('o.created_at') + base +
" INNER JOIN offers o ON o.advs_negotiation_id = an.id AND " + LANCE + " AND " + noMes('o.created_at') +
" UNION ALL SELECT 4, o.buyer_shop_id, ev.id, " + bitDia('o.created_at') + base + " AND an.status IN (" + VENDA_IN + ")" +
" INNER JOIN offers o ON o.id = an.offer_actual_id AND o.buyer_shop_id IS NOT NULL AND " + noMes('o.created_at');
const pares = "SELECT x.eid, x.l, BIT_OR(IF(x.t = 1, x.b, 0)) AS mac, BIT_OR(IF(x.t = 2, x.b, 0)) AS mof," +
" BIT_OR(IF(x.t = 4, x.b, 0)) AS mco FROM (" + acoes + ") x GROUP BY x.eid, x.l";
const b36 = (c) => "LOWER(CONV(" + c + ", 10, 36))";
const txt = "CONCAT(p.l, '.', " + b36('p.mac') + ", IF(p.mof > 0 OR p.mco > 0, CONCAT('.', " + b36('p.mof') +
", IF(p.mco > 0, CONCAT('.', " + b36('p.mco') + "), '')), ''))";
return " FROM (SELECT p.eid, JSON_ARRAYAGG(" + txt + ") AS ls FROM (" + pares + ") p GROUP BY p.eid) g";
};
TABELAS.push(
{
nome: 'mes_ev',
meses: true,
deMes: deMesEv,
cols: [['eid', 'g.eid'], ['c', 'g.c'], ['cat', 'g.cat']].concat(COLS_EV.map((c) => [c[0], 'g.' + c[0]]))
},
{
nome: 'mes_dia',
meses: true,
deMes: deMesDia,
cols: [['k', 'g.k'], ['eid', 'g.eid'], ['c', 'g.c'], ['cat', 'g.cat']].concat(COLS_DIA.map((c) => [c[0], 'g.' + c[0]]))
},
{
nome: 'mes_lojd',
meses: true,
partesMes: PARTES_LOJD,
deMes: deMesLojd,
cols: [['eid', 'g.eid'], ['ls', 'g.ls']]
},
{
nome: 'mes_eventos',
partes: PARTES_EVENTOS,
parte: 'e.id',
de: " FROM (SELECT e.id, e.name AS nome, e.status AS st, " + DATA('e.start_date_offer') + " AS ini, " + DATA('e.finish_date_event') + " AS fim," +
" (SELECT BIT_OR(" + BIT_WL + ") FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id IN (" + LISTA_WL + ")) AS wm," +
" (SELECT GROUP_CONCAT(DISTINCT a.shop_id) FROM advertisement_negotiations an INNER JOIN advertisements a ON a.id = an.advertisement_id" +
" WHERE an.event_id = e.id AND an.deleted_at IS NULL) AS cs" +
" FROM events e WHERE e.deleted_at IS NULL AND e.finish_date_event >= '" + MES_PISO + "' AND e.start_date_offer <= '" + AGORA_BR + "'" +
" AND DATEDIFF(e.finish_date_event, e.start_date_offer) <= " + DIAS_MAX_EVENTO +
" AND EXISTS (SELECT 1 FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id IN (" + LISTA_WL + "))" +
" AND PARTE) g",
cols: [['id', 'g.id'], ['nome', 'g.nome'], ['st', 'g.st'], ['ini', 'g.ini'], ['fim', 'g.fim'], ['wm', 'g.wm'], ['cs', 'g.cs']]
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
const pm = t.partesMes || 1;
const n = t.meses ? MESES * pm : (t.partes || 1);
PARTES[t.nome] = n;
for (let p = 0; p < n; p++) {
const mi = Math.floor(p / pm);
const de = t.meses ? t.deMes(MES[mi], p % pm) : n > 1 ? t.de.split('PARTE').join('MOD(' + t.parte + ', ' + n + ') = ' + p) : t.de;
if (de.indexOf('PARTE') >= 0) throw new Error(t.nome + ': PARTE sobrou numa tabela de uma parte so');
const cols = t.meses ? [['m', String(mi)]].concat(t.cols) : t.cols;
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
meses: MES.map((m) => m.rot), meses_ult: MES.map((m) => m.ult), dias_max_evento: DIAS_MAX_EVENTO }
}
});
}
});
return itens;
` }
  }
});

const mcp = node({
  type: '@n8n/n8n-nodes-langchain.mcpClient',
  version: 1.1,
  config: {
    name: 'MCP Consultas',
    position: [2016, 0],
    parameters: {
      serverTransport: 'sse',
      endpointUrl: 'https://mcp-cars2you-readonly.cars2you.com.br/sse',
      authentication: 'bearerAuth',
      tool: { __rl: true, mode: 'id', value: 'run_query', cachedResultName: 'run_query' },
      inputMode: 'json',
      jsonInput: expr('{{ JSON.stringify({ sql: $json.sql, database: $json.database }) }}'),
      options: { timeout: 60000 }
    },
    credentials: { httpBearerAuth: newCredential('MCP Cars2You Readonly - BD SQL', 'Cc8CxzVDwvA3EysZ') }
  }
});

const painel = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Montar Painel',
    position: [2240, 0],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `return [{ json: { marcador: true } }];` }
  }
});

const arquivo = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Virar Arquivo',
    position: [2464, 0],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `const FUSO_MIN = -180;
const PASTA = 'Painel de Eventos Cars2You';
const PREFIXO = 'painel-eventos-cars2you';
const MIN_BYTES = 500 * 1024;
const fonte = $input.first().json;
const html = fonte.html;
if (typeof html !== 'string') {
throw new Error('Virar Arquivo: o Montar Painel nao entregou "html" como texto (veio ' + typeof html + ').');
}
const BOM = String.fromCharCode(0xFEFF);
const comBom = html.indexOf(BOM) === 0 ? html : BOM + html;
const bytesHtml = Buffer.byteLength(html, 'utf8');
const bytesFonte = Buffer.byteLength(comBom, 'utf8');
if (bytesHtml < MIN_BYTES) {
throw new Error('Virar Arquivo: o HTML tem ' + bytesHtml + ' bytes, abaixo do piso de ' + MIN_BYTES +
'. Melhor falhar do que publicar painel vazio.');
}
const b64 = Buffer.from(comBom, 'utf8').toString('base64');
const bytesVolta = Buffer.from(b64, 'base64').length;
if (bytesVolta !== bytesFonte) {
throw new Error('Virar Arquivo: o base64 voltou com ' + bytesVolta + ' bytes e a fonte tem ' +
bytesFonte + '. A conversao comeu conteudo.');
}
const agora = new Date(Date.now() + FUSO_MIN * 60000);
const nomeArquivo = PREFIXO + '.html';
const caminho = [PASTA, nomeArquivo].map((p) => encodeURIComponent(p)).join('/');
return [{
json: {
pasta: PASTA, nomeArquivo: nomeArquivo, caminho: caminho, bytes: bytesFonte,
gerado_em: agora.toISOString().slice(0, 16).replace('T', ' '),
resumo: fonte.resumo
},
binary: {
data: { data: b64, mimeType: 'text/html; charset=utf-8', fileName: nomeArquivo, fileExtension: 'html' }
}
}];
` }
  }
});

const subir = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Subir no SharePoint',
    position: [2688, 0],
    parameters: {
      method: 'PUT',
      url: expr('{{ "https://automakers.sharepoint.com/sites/N8N/_api/v2.0/drives/b!WIoPIE-Ra0WlwvYnLSod44VOGNL5_GRNoDqrqsWDT53xop-CS7vvT4Ura4LiRKaM/root:/" + $json.caminho + ":/content" }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'microsoftSharePointOAuth2Api',
      sendBody: true,
      contentType: 'binaryData',
      inputDataFieldName: 'data',
      options: { timeout: 180000 }
    },
    credentials: { microsoftSharePointOAuth2Api: newCredential('Microsoft SharePoint Conta PowerBI/Automações', 'AOTm9J6pFcF0DS6g') }
  }
});

export default workflow('painel-eventos-cars2you', 'Painel de Eventos Cars2You')
  .add(rodar)
  .to(pecasTema)
  .to(pecasPagina)
  .to(carteira)
  .to(lerMetas)
  .to(abasMetas)
  .to(metas)
  .to(consultas)
  .to(mcp)
  .to(painel)
  .to(arquivo)
  .to(subir)
  .add(agenda)
  .to(pecasTema);
