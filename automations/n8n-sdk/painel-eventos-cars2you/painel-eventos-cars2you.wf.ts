import { workflow, node, trigger, newCredential, expr } from '@n8n/workflow-sdk';

const rodar = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Rodar', position: [0, 0] }
});

/* a carteira comercial, EM SERIE e antes das consultas (ver build_wf.py) */
const carteira = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Ler Carteira',
    position: [224, 0],
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

const consultas = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Montar Consultas',
    position: [448, 0],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `const WLS = [4, 7, 43, 48, 62, 65];
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
` }
  }
});

const mcp = node({
  type: '@n8n/n8n-nodes-langchain.mcpClient',
  version: 1.1,
  config: {
    name: 'MCP Consultas',
    position: [672, 0],
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
    position: [896, 0],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `const CSS_TEMA = [
  ':root{--marca-azul:       #1523A0;--marca-azul-claro: #487DEA;--marca-cinza:      #E4E6E6;',
  '--marca-vinho:      #6F4047;--marca-vermelho:   #7F1112;--d-verde:          #0E7C55;',
  '--d-verde-vivo:     #35C08A;--d-vermelho-vivo:  #EF5B60;--r-g: 22px;--r-m: 14px;--r-p: 11px;',
  '--gap: 16px;--topo-h: 68px;',
  '--fonte: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,"Helvetica Neue", Arial, "Noto Sans", sans-serif;',
  '}:root,[data-tema="claro"]{color-scheme: light;--fundo:          #D8E1E9;',
  '--fundo-veu:      radial-gradient(420px 300px at 0% -14%,rgba(255,255,255,.72), transparent 70%),radial-gradient(1200px 900px at 100% 100%,rgba(128,155,178,.50), transparent 66%);',
  '--superficie:     #FAFCFD;--superficie-2:   #EDF1F5;--borda:          #E3E9EE;',
  '--borda-forte:    #C9D4DD;--texto:          #3A4552;--texto-2:        #55626F;',
  '--texto-3:        #6F7D89;--acento:         #3A4552;--acento-cheio:   var(--marca-azul-claro);',
  '--acento-veu:     rgba(58,69,82,.07);--positivo:       #0C6E4B;',
  '--negativo:       var(--marca-vermelho);--atencao:        var(--marca-vinho);',
  '--grade:          rgba(23,33,43,.06);',
  '--sombra:         0 1px 1px  rgba(23,33,43,.03),0 6px 16px rgba(23,33,43,.05),0 18px 44px rgba(23,33,43,.07),inset 0 1px 0 rgba(255,255,255,.85);',
  '--cartao-borda:   1px solid rgba(255,255,255,.72);',
  '--cartao-fundo:   linear-gradient(155deg, rgba(255,255,255,.82) 0%,rgba(255,255,255,.95) 58%);',
  '--cartao-blur:    blur(18px) saturate(115%);',
  '--brilho:         radial-gradient(420px 260px at 0% 0%,rgba(86,112,138,.13), transparent 72%);}',
  '[data-tema="escuro"]{color-scheme: dark;--fundo:          #0B0D12;',
  '--fundo-veu:      radial-gradient(900px 500px at 8% -8%,rgba(72,125,234,.20), transparent 62%),radial-gradient(800px 500px at 96% 4%,rgba(111,64,71,.16), transparent 60%);',
  '--superficie:     #12151D;--superficie-2:   #171B25;--borda:          rgba(255,255,255,.09);',
  '--borda-forte:    rgba(255,255,255,.16);--texto:          #EDEFF5;--texto-2:        #A4ABBF;',
  '--texto-3:        #6E7589;--acento:         var(--marca-azul-claro);',
  '--acento-cheio:   var(--marca-azul-claro);--acento-veu:     rgba(72,125,234,.18);',
  '--positivo:       var(--d-verde-vivo);--negativo:       var(--d-vermelho-vivo);',
  '--atencao:        #C98A92;--grade:          rgba(255,255,255,.07);',
  '--sombra:         0 1px 1px rgba(0,0,0,.4), 0 16px 40px rgba(0,0,0,.45);',
  '--cartao-borda:   1px solid rgba(255,255,255,.08);',
  '--cartao-fundo:   linear-gradient(158deg, rgba(255,255,255,.075),rgba(255,255,255,.025));',
  '--cartao-blur:    blur(16px) saturate(140%);',
  '--brilho:         radial-gradient(420px 180px at 0% 0%,rgba(72,125,234,.16), transparent 70%);}',
  '*,*::before,*::after{ box-sizing:border-box }html{ -webkit-text-size-adjust:100% }body{margin:0;',
  'font-family:var(--fonte);font-size:14px;line-height:1.45;color:var(--texto);',
  'background-color:var(--fundo);background-image:var(--fundo-veu);background-attachment:fixed;',
  'background-repeat:no-repeat;-webkit-font-smoothing:antialiased;}h1,h2,h3{ margin:0;',
  ' font-weight:650; letter-spacing:-.01em }p{ margin:0 }.num{ font-variant-numeric:tabular-nums;',
  ' font-feature-settings:"tnum" 1 }.topo{position:sticky; top:0; z-index:30;',
  'background:transparent;backdrop-filter:var(--cartao-blur);',
  '-webkit-backdrop-filter:var(--cartao-blur);}.topo-in{max-width:1680px; margin:0 auto;',
  'min-height:var(--topo-h);padding:10px 20px;display:grid; grid-template-columns:1fr auto 1fr;',
  'align-items:center; gap:16px;}.marca{ justify-self:start; min-width:0; display:block;',
  ' line-height:0 }.logo{ height:26px; width:auto; display:block; flex:none }.logo-curta{',
  ' display:none }.topo-tit{ text-align:center; min-width:0 }.topo-tit h1{ font-size:22px;',
  ' letter-spacing:-.01em }.topo-tit .sub{ font-size:12.5px; color:var(--texto-2); margin-top:1px }',
  '.topo-acoes{ display:flex; align-items:center; justify-content:flex-end;gap:8px; flex-wrap:wrap;',
  ' justify-self:end }:root:not([data-tema="escuro"]) .ctrl{background:rgba(255,255,255,.55);',
  'border-color:rgba(255,255,255,.7);',
  'box-shadow:inset 0 1px 2px rgba(23,33,43,.06),0 1px 0 rgba(255,255,255,.9);}',
  ':root:not([data-tema="escuro"]) .chip{background:var(--acento);color:#FFFFFF;}',
  ':root:not([data-tema="escuro"]) .g4 .cartao{',
  'box-shadow:0 1px 1px rgba(23,33,43,.03),0 4px 12px rgba(23,33,43,.05),inset 0 1px 0 rgba(255,255,255,.85);',
  '}.ctrl{font:inherit; font-size:13px; color:var(--texto);background:var(--superficie-2);',
  'border:1px solid var(--borda);border-radius:var(--r-p);padding:7px 11px;cursor:pointer;',
  'transition:border-color .15s, background .15s;}.ctrl:hover{ border-color:var(--borda-forte) }',
  '.ctrl:focus-visible{ outline:2px solid var(--acento); outline-offset:1px }select.ctrl{',
  ' padding-right:26px }.ctrl.so-icone{ padding:7px; display:inline-flex; align-items:center }',
  '.ctrl.so-icone svg{ width:16px; height:16px; display:block; stroke:currentColor;fill:none;',
  ' stroke-width:1.9; stroke-linecap:round;stroke-linejoin:round }.area{max-width:1680px;',
  ' margin:0 auto;padding:var(--gap) 20px 48px;display:flex; flex-direction:column; gap:var(--gap);',
  '}.g4{ display:grid; gap:var(--gap); grid-template-columns:repeat(4,1fr) }.g2{ display:grid;',
  ' gap:var(--gap); grid-template-columns:2fr 1fr }@media (max-width:1100px){.g4{',
  ' grid-template-columns:repeat(2,1fr) }.g2{ grid-template-columns:1fr }}@media (max-width:620px){',
  '.g4{ grid-template-columns:1fr }.area{ padding:12px 12px 40px }.topo-in{ padding:10px 12px;',
  ' grid-template-columns:auto 1fr auto; gap:8px }.logo-extensa{ display:none }.logo-curta{',
  ' display:block; height:22px }.topo-tit h1{ font-size:16px }}.cartao{position:relative;',
  'background:var(--cartao-fundo);border:var(--cartao-borda);border-radius:var(--r-g);',
  'box-shadow:var(--sombra);backdrop-filter:var(--cartao-blur);',
  '-webkit-backdrop-filter:var(--cartao-blur);padding:18px;overflow:hidden;}.cartao::before{',
  'content:""; position:absolute; inset:0;background:var(--brilho);pointer-events:none;}',
  '.cartao > *{ position:relative }.cartao-topo{display:flex; align-items:center; gap:10px;',
  'margin-bottom:14px;}.cartao-topo h2{ font-size:14.5px; font-weight:650 }.cartao-topo .dir{',
  ' margin-left:auto; display:flex; gap:6px; align-items:center }.chip{flex:none; width:34px;',
  ' height:34px; border-radius:50%;display:grid; place-items:center;background:var(--acento-veu);',
  'color:var(--acento);}.chip svg{ width:17px; height:17px; stroke:currentColor; fill:none;',
  'stroke-width:1.9; stroke-linecap:round; stroke-linejoin:round }.g4 .cartao{ padding:13px 14px }',
  '.g4 .cartao-topo{ margin-bottom:6px; gap:8px }.g4 .chip{ width:26px; height:26px }.g4 .chip svg{',
  ' width:14px; height:14px }.kpi-rot{ font-size:12.5px; color:var(--texto-2); font-weight:500 }',
  '.kpi-val{font-size:23px; line-height:1.15; font-weight:700; letter-spacing:-.015em;',
  'margin:4px 0 2px;}.kpi-delta{ font-size:11.5px; font-weight:600; display:inline-flex; gap:4px;',
  'align-items:center }.sobe{ color:var(--positivo) } .desce{ color:var(--negativo) }.neutro{',
  ' color:var(--texto-3) }.kpi-pe{display:flex; gap:16px;margin-top:9px; padding-top:8px;',
  'border-top:1px solid var(--borda);}.kpi-pe div{ min-width:0 }.kpi-pe dt{ font-size:11px;',
  ' color:var(--texto-3); white-space:nowrap;overflow:hidden; text-overflow:ellipsis }.kpi-pe dd{',
  ' margin:1px 0 0; font-size:13.5px; font-weight:650 }.graf{ width:100%; height:auto;',
  ' display:block; overflow:visible }.graf .eixo{ font-size:10.5px; fill:var(--texto-3) }',
  '.graf .linha-grade{ stroke:var(--grade); stroke-width:1 }.graf .serie{ fill:none;',
  ' stroke:var(--acento-cheio); stroke-width:2.25;stroke-linecap:round; stroke-linejoin:round }',
  '.graf .area-serie{ fill:url(#veu-serie); stroke:none }.graf .ponto{ fill:var(--acento-cheio) }',
  '.graf .rotulo{ font-size:11px; font-weight:650; fill:var(--texto);',
  'font-variant-numeric:tabular-nums }.rank{ list-style:none; margin:0; padding:0; display:flex;',
  'flex-direction:column; gap:11px }.rank li{ display:grid; grid-template-columns:22px 1fr auto;',
  ' gap:10px;align-items:center }.rank .pos{ font-size:12px; color:var(--texto-3);',
  ' text-align:right }.rank .nome{ display:block; font-size:13px; overflow:hidden;',
  'text-overflow:ellipsis; white-space:nowrap }.rank .barra{ display:block; height:5px;',
  ' border-radius:3px;background:var(--acento-veu); margin-top:5px; overflow:hidden }',
  '.rank .barra i{ display:block; height:100%; border-radius:3px;background:var(--acento-cheio) }',
  '.rank .val{ font-size:13px; font-weight:650 }.rolo{ overflow-x:auto; margin:0 -18px -18px;',
  ' padding:0 18px 18px }table{ width:100%; border-collapse:collapse; font-size:13px }thead th{',
  'position:sticky; top:0;background:var(--superficie-2);color:var(--texto-2); font-weight:600;',
  ' font-size:12px;text-align:center; white-space:nowrap;padding:9px 10px;',
  'border-bottom:1px solid var(--borda);}tbody td{ padding:9px 10px; text-align:center;',
  'border-bottom:1px solid var(--borda) }tbody td:first-child, thead th:first-child{',
  ' text-align:left }tbody tr:last-child td{ border-bottom:none }tbody tr:hover td{',
  ' background:var(--acento-veu) }.tag{display:inline-block; font-size:11.5px; font-weight:600;',
  'padding:2px 8px; border-radius:999px;background:var(--acento-veu); color:var(--acento);}.tag.ok{',
  ' background:color-mix(in srgb, var(--positivo) 16%, transparent);color:var(--positivo) }',
  '.tag.ruim{ background:color-mix(in srgb, var(--negativo) 16%, transparent);',
  'color:var(--negativo) }.tag.atencao{',
  ' background:color-mix(in srgb, var(--atencao) 18%, transparent);color:var(--atencao) }.rodape{',
  ' color:var(--texto-3); font-size:12px; padding:4px 2px 0 }.rodape a{ color:var(--acento) }',
  '.gloss{ padding:0 }.gloss > summary{cursor:pointer; padding:18px; margin:0;list-style:none;',
  'border-radius:var(--r-g);}.gloss > summary::-webkit-details-marker{ display:none }',
  '.gloss > summary:focus-visible{ outline:2px solid var(--acento); outline-offset:-2px }',
  '.gloss .seta{ color:var(--texto-3); font-size:11px; transition:transform .15s }',
  '.gloss[open] > summary{ border-radius:var(--r-g) var(--r-g) 0 0 }.gloss[open] .seta{',
  ' transform:rotate(180deg) }.gloss dl{margin:0; padding:0 18px 18px;display:grid;',
  ' grid-template-columns:auto 1fr; gap:9px 18px;font-size:12.5px;}.gloss dt{ font-weight:650;',
  ' white-space:nowrap }.gloss dd{ margin:0; color:var(--texto-2) }@media (max-width:620px){',
  '.gloss dl{ grid-template-columns:1fr; gap:2px 0 }.gloss dt{ white-space:normal; margin-top:8px }',
  '.gloss dt:first-child{ margin-top:0 }}@media print{body{ background:#fff; color:#000 }.topo{',
  ' position:static }.topo-acoes{ display:none }.cartao{ box-shadow:none; border:1px solid #ccc;',
  ' backdrop-filter:none;break-inside:avoid }.cartao::before{ display:none }}',
  '@media (prefers-reduced-motion:reduce){*{ transition:none !important;',
  ' animation:none !important }}'
].join('');
const LOGO = {"claro":{"extensa":"data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgOTMzIDE2OCIgd2lkdGg9IjkzMyIgaGVpZ2h0PSIxNjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIwIiB5PSIxNCIgd2lkdGg9IjkzMyIgaGVpZ2h0PSIxNjgiLz48L2NsaXBQYXRoPjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjY2xpcDApIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjAgLTE0KSI+PHBhdGggZD0iTTU0MC40MTggNjMuOTcwMyA1NDAuNDE4IDM4Ljk4NTEgNDY1LjQ2MyAzOC45ODUxIDQ2NS40NjMgMTQgNTQwLjQxOCAxNCA1NDAuNDE4IDM4Ljk4NTEgNTY1LjQwMyAzOC45ODUxIDU2NS40MDMgNjMuOTcwMyA1NDAuNDE4IDYzLjk3MDNaTTQ2NS40NjMgMTM4LjkyNiA0NjUuNDYzIDg4Ljk1NTQgNDkwLjQ0OCA4OC45NTU0IDQ5MC40NDggMTEzLjk0MSA1NjUuNDAzIDExMy45NDEgNTY1LjQwMyAxMzguOTI2IDQ2NS40NjMgMTM4LjkyNlpNNDkwLjQ0OCA4OC45NTU0IDQ5MC40NDggNjMuOTcwMyA1NDAuNDE4IDYzLjk3MDMgNTQwLjQxOCA4OC45NTU0IDQ5MC40NDggODguOTU1NFoiIGZpbGw9IiMzQTQ1NTIiLz48cGF0aCBkPSJNMzE5Ljc0OSA0My4zODI1IDMxNC43NTIgNjQuMDcwMkMzMTAuMzU1IDYxLjc3MTYgMzAzLjk1OSA2MC41NzIzIDI5OC44NjIgNjAuNTcyMyAyODUuNTcgNjAuNTcyMyAyNzYuMDc1IDY5Ljk2NjcgMjc2LjA3NSA4Ni4yNTdMMjc2LjA3NSAxMzguOTI2IDI1NS4xODggMTM4LjkyNiAyNTUuMTg4IDQzLjE4MjYgMjc1Ljg3NSA0My4xODI2IDI3NS44NzUgNTMuOTc2MkMyODIuMTcyIDQ0Ljg4MTYgMjkxLjk2NiA0MC42ODQxIDMwMy42NTkgNDAuNjg0MSAzMTUuMzUyIDQwLjY4NDEgMzE0Ljk1MiA0MS40ODM2IDMxOS43NDkgNDMuMzgyNVoiIGZpbGw9IiMzQTQ1NTIiLz48cGF0aCBkPSJNNDA0LjE5OSA2Ny4xNjg0QzM5OC40MDIgNjMuNTcwNSAzODYuNTEgNTguOTczMiAzNzQuNjE3IDU4Ljk3MzIgMzYyLjcyNCA1OC45NzMyIDM1Ni41MjcgNjMuNTcwNSAzNTYuNTI3IDcwLjM2NjUgMzU2LjUyNyA3Ny4xNjI0IDM2My41MjMgNzguOTYxMyAzNzIuMzE4IDgwLjI2MDZMMzgyLjIxMiA4MS43NTk3QzQwMy4xIDg0Ljc1NzkgNDE1LjQ5MiA5My42NTI2IDQxNS40OTIgMTEwLjA0MyA0MTUuNDkyIDEyNi40MzMgMzk5LjUwMiAxNDEuMzI0IDM3MS45MTggMTQxLjMyNCAzNDQuMzM1IDE0MS4zMjQgMzQ0LjgzNCAxMzkuNDI1IDMzMC44NDMgMTI5LjAzMkwzNDAuNTM3IDExMy4zNDFDMzQ3LjQzMyAxMTguNjM4IDM1Ni41MjcgMTIzLjEzNSAzNzIuMTE4IDEyMy4xMzUgMzg3LjcwOSAxMjMuMTM1IDM5My45MDUgMTE4LjYzOCAzOTMuOTA1IDExMS40NDIgMzkzLjkwNSAxMDQuMjQ2IDM4OC43MDggMTAyLjQ0NyAzNzcuMzE1IDEwMC44NDhMMzY3LjMyMSA5OS41NDkxQzM0Ni4xMzQgOTYuNjUwOCAzMzQuODQgODYuODU2NiAzMzQuODQgNzEuNDY1OCAzMzQuODQgNTYuMDc1IDM1MC4wMzEgNDAuNzg0MSAzNzQuNDE3IDQwLjc4NDEgMzk4LjgwMiA0MC43ODQxIDQwMy4zIDQ0LjQ4MTkgNDEzLjE5NCA1MC44NzgxTDQwNC4xOTkgNjcuMTY4NFoiIGZpbGw9IiMzQTQ1NTIiLz48cGF0aCBkPSJNNjQ0LjY1NiAxODIgNjIxLjQ3IDE4MiA2NTUuNzQ5IDEyMS43MzYgNjEzLjI3NSA0NS42ODExIDYzNi43NjEgNDUuNjgxMSA2NjcuNTQyIDEwMC42NDggNjk3LjIyNSA0NS42ODExIDcyMC4yMTEgNDUuNjgxMSA2NDQuNjU2IDE4MloiIGZpbGw9IiMzQTQ1NTIiLz48cGF0aCBkPSJNOTUyLjc3MiAxMDAuODQ4Qzk1Mi43NzIgMTMxLjMzIDkzMC43ODYgMTQzLjkyMyA5MDguMzk5IDE0My45MjMgODg2LjAxMiAxNDMuOTIzIDg2NC4wMjUgMTMxLjMzIDg2NC4wMjUgMTAwLjg0OEw4NjQuMDI1IDQ1LjY4MTEgODg1LjAxMyA0NS42ODExIDg4NS4wMTMgOTguOTQ5NEM4ODUuMDEzIDExNy40MzggODk1LjMwNyAxMjQuMjM0IDkwOC4zOTkgMTI0LjIzNCA5MjEuNDkxIDEyNC4yMzQgOTMxLjc4NSAxMTcuNDM4IDkzMS43ODUgOTguOTQ5NEw5MzEuNzg1IDQ1LjY4MTEgOTUyLjc3MiA0NS42ODExIDk1Mi43NzIgMTAwLjg0OFoiIGZpbGw9IiMzQTQ1NTIiLz48cGF0aCBkPSJNMTA2LjM3NiA1NS45NzUgOTIuOTg0MiA3MC4yNjY1Qzg2LjI4ODIgNjMuOTcwMyA3OS4xOTI0IDYwLjM3MjQgNjkuOTk3OSA2MC4zNzI0IDUzLjkwNzUgNjAuMzcyNCA0MS43MTQ4IDcyLjk2NDkgNDEuNzE0OCA5MS4wNTQxIDQxLjcxNDggMTA5LjE0MyA1My45MDc1IDEyMS43MzYgNjkuOTk3OSAxMjEuNzM2IDg2LjA4ODMgMTIxLjczNiA4Ny4zODc2IDExNy40MzggOTMuNDgzOSAxMTEuNzQyTDEwNi4zNzYgMTI2LjEzM0M5Ny42ODE0IDEzNi4yMjcgODQuODg5MSAxNDEuNDI0IDcwLjU5NzYgMTQxLjQyNCA0MC4xMTU3IDE0MS40MjQgMjAuMjI3NSAxMTkuNzM3IDIwLjIyNzUgOTEuMDU0MSAyMC4yMjc1IDYyLjM3MTIgNDAuMTE1NyA0MC42ODQxIDcwLjU5NzYgNDAuNjg0MSAxMDEuMDc5IDQwLjY4NDEgOTcuODgxMyA0NS44ODEgMTA2LjM3NiA1NS45NzVaIiBmaWxsPSIjM0E0NTUyIi8+PHBhdGggZD0iTTIyMS45MDggMTM4LjkyNiAyMDEuMDIgMTM4LjkyNiAyMDEuMDIgMTI3LjQzMkMxOTQuNDI0IDEzNS45MjcgMTg0LjUzIDE0MS40MjQgMTcwLjkzOCAxNDEuNDI0IDE0NC4xNTQgMTQxLjQyNCAxMjMuMDY2IDEyMC4zMzcgMTIzLjA2NiA5MS4wNTQxIDEyMy4wNjYgNjEuNzcxNiAxNDQuMTU0IDQwLjY4NDEgMTcwLjkzOCA0MC42ODQxIDE5Ny43MjIgNDAuNjg0MSAxOTQuNDI0IDQ2LjI4MDggMjAxLjAyIDU0Ljc3NTdMMjAxLjAyIDQzLjE4MjYgMjIxLjkwOCA0My4xODI2IDIyMS45MDggMTM4LjkyNlpNMTQ0LjU1NCA5MS4wNTQxQzE0NC41NTQgMTA3Ljg0NCAxNTUuNDQ3IDEyMS43MzYgMTczLjQzNiAxMjEuNzM2IDE5MS40MjYgMTIxLjczNiAyMDIuMzE5IDEwOC41NDQgMjAyLjMxOSA5MS4wNTQxIDIwMi4zMTkgNzMuNTY0NSAxOTAuNzI2IDYwLjM3MjQgMTczLjQzNiA2MC4zNzI0IDE1Ni4xNDcgNjAuMzcyNCAxNDQuNTU0IDc0LjI2NDEgMTQ0LjU1NCA5MS4wNTQxWiIgZmlsbD0iIzNBNDU1MiIvPjxwYXRoIGQ9Ik04MzUuMTQzIDkzLjU1MjdDODM1LjE0MyAxMjIuMjM2IDgxMy4xNTYgMTQzLjkyMyA3ODMuNTczIDE0My45MjMgNzUzLjk5MSAxNDMuOTIzIDczMi4xMDQgMTIyLjIzNiA3MzIuMTA0IDkzLjU1MjcgNzMyLjEwNCA2NC44Njk3IDc1My45OTEgNDMuMTgyNiA3ODMuNTczIDQzLjE4MjYgODEzLjE1NiA0My4xODI2IDgzNS4xNDMgNjQuODY5NyA4MzUuMTQzIDkzLjU1MjdaTTc1My41OTEgOTMuNTUyN0M3NTMuNTkxIDExMS42NDIgNzY2LjQ4MyAxMjQuMjM0IDc4My41NzMgMTI0LjIzNCA4MDAuNjYzIDEyNC4yMzQgODEzLjY1NSAxMTEuNjQyIDgxMy42NTUgOTMuNTUyNyA4MTMuNjU1IDc1LjQ2MzQgODAwLjY2MyA2Mi44NzA5IDc4My41NzMgNjIuODcwOSA3NjYuNDgzIDYyLjg3MDkgNzUzLjU5MSA3NS40NjM0IDc1My41OTEgOTMuNTUyN1oiIGZpbGw9IiMzQTQ1NTIiLz48L2c+PC9zdmc+","curta":"data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgOTkwIDQ1NCIgd2lkdGg9Ijk5MCIgaGVpZ2h0PSI0NTQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIG92ZXJmbG93PSJoaWRkZW4iPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDk2IC0xOTcpIj48cGF0aCBkPSJNMjE5Ljc4IDEzOC4yNTggMTg1LjU4MyAxNzUuMjczQzE2OC41MjEgMTU4Ljk2OSAxNTAuMzc2IDE0OS42NDIgMTI2Ljk1MiAxNDkuNjQyIDg1Ljg4NzYgMTQ5LjY0MiA1NC44MDAzIDE4Mi4yNSA1NC44MDAzIDIyOS4xNzkgNTQuODAwMyAyNzYuMTA4IDg1Ljg4NzYgMzA4LjcxNiAxMjYuOTUyIDMwOC43MTYgMTUwLjQ0OCAzMDguNzE2IDE3MS4zNDEgMjk3LjU1MyAxODYuODg1IDI4Mi43OTFMMjE5Ljc4IDMyMC4wOTlDMTk3LjU4NSAzNDYuMjQ1IDE2NC45OCAzNTkuNzU4IDEyOC40NyAzNTkuNzU4IDUwLjc1MTcgMzU5LjY4NCAwIDMwMy41MDEgMCAyMjkuMTc5IDAgMTU0Ljg1NiA1MC43NTE3IDk4LjYwMDEgMTI4LjU0MiA5OC42MDAxIDE2NC45OCA5OC42MDAxIDE5OC4xNjMgMTEyLjA0IDIxOS44NTEgMTM4LjI1OEwyMTkuNzggMTM4LjI1OFoiIGZpbGw9IiMzQTQ1NTIiIHRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIDEuMDAxMzEgLTk2IDE5NykiLz48cGF0aCBkPSJNNTMyLjI5MSAxNDMuODIyIDUzMi4yOTEgNzEuODcgMzQyLjQzNiA3MS44NyAzNDIuNDM2IDAgNTMyLjI5MSAwIDUzMi4yOTEgNzEuOTUxNiA1OTUuNTk5IDcxLjk1MTYgNTk1LjU5OSAxNDMuOTAzIDUzMi4yOTEgMTQzLjkwMyA1MzIuMjkxIDE0My44MjJaTTM0Mi40MzYgMzU5LjY3NiAzNDIuNDM2IDIxNS44NTUgNDA1Ljc0NCAyMTUuODU1IDQwNS43NDQgMjg3LjgwNiA1OTUuNTk5IDI4Ny44MDYgNTk1LjU5OSAzNTkuNzU4IDM0Mi40MzYgMzU5Ljc1OCAzNDIuNDM2IDM1OS42NzZaTTQwNS42NzMgMjE1Ljc3MyA0MDUuNjczIDE0My44MjIgNTMyLjIxOCAxNDMuODIyIDUzMi4yMTggMjE1Ljc3MyA0MDUuNjczIDIxNS43NzNaIiBmaWxsPSIjM0E0NTUyIiB0cmFuc2Zvcm09Im1hdHJpeCgxIDAgMCAxLjAwMTMxIC05NiAxOTcpIi8+PHBhdGggZD0iTTc5Ni45NzEgNDUzLjAyOSA3MzcuNzY4IDQ1My4wMjkgODI1LjM0NCAyOTYuMzMxIDcxNi44NSA5OC42MDAxIDc3Ni44NTEgOTguNjAwMSA4NTUuNDUxIDI0MS41MiA5MzEuMzAzIDk4LjYwMDEgOTkwIDk4LjYwMDEgNzk2Ljk3MSA0NTMuMDI5WiIgZmlsbD0iIzNBNDU1MiIgdHJhbnNmb3JtPSJtYXRyaXgoMSAwIDAgMS4wMDEzMSAtOTYgMTk3KSIvPjwvZz48L3N2Zz4="},"escuro":{"extensa":"data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgOTMzIDE2OCIgd2lkdGg9IjkzMyIgaGVpZ2h0PSIxNjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIwIiB5PSIxNCIgd2lkdGg9IjkzMyIgaGVpZ2h0PSIxNjgiLz48L2NsaXBQYXRoPjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjY2xpcDApIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjAgLTE0KSI+PHBhdGggZD0iTTU0MC40MTggNjMuOTcwMyA1NDAuNDE4IDM4Ljk4NTEgNDY1LjQ2MyAzOC45ODUxIDQ2NS40NjMgMTQgNTQwLjQxOCAxNCA1NDAuNDE4IDM4Ljk4NTEgNTY1LjQwMyAzOC45ODUxIDU2NS40MDMgNjMuOTcwMyA1NDAuNDE4IDYzLjk3MDNaTTQ2NS40NjMgMTM4LjkyNiA0NjUuNDYzIDg4Ljk1NTQgNDkwLjQ0OCA4OC45NTU0IDQ5MC40NDggMTEzLjk0MSA1NjUuNDAzIDExMy45NDEgNTY1LjQwMyAxMzguOTI2IDQ2NS40NjMgMTM4LjkyNlpNNDkwLjQ0OCA4OC45NTU0IDQ5MC40NDggNjMuOTcwMyA1NDAuNDE4IDYzLjk3MDMgNTQwLjQxOCA4OC45NTU0IDQ5MC40NDggODguOTU1NFoiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNMzE5Ljc0OSA0My4zODI1IDMxNC43NTIgNjQuMDcwMkMzMTAuMzU1IDYxLjc3MTYgMzAzLjk1OSA2MC41NzIzIDI5OC44NjIgNjAuNTcyMyAyODUuNTcgNjAuNTcyMyAyNzYuMDc1IDY5Ljk2NjcgMjc2LjA3NSA4Ni4yNTdMMjc2LjA3NSAxMzguOTI2IDI1NS4xODggMTM4LjkyNiAyNTUuMTg4IDQzLjE4MjYgMjc1Ljg3NSA0My4xODI2IDI3NS44NzUgNTMuOTc2MkMyODIuMTcyIDQ0Ljg4MTYgMjkxLjk2NiA0MC42ODQxIDMwMy42NTkgNDAuNjg0MSAzMTUuMzUyIDQwLjY4NDEgMzE0Ljk1MiA0MS40ODM2IDMxOS43NDkgNDMuMzgyNVoiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNNDA0LjE5OSA2Ny4xNjg0QzM5OC40MDIgNjMuNTcwNSAzODYuNTEgNTguOTczMiAzNzQuNjE3IDU4Ljk3MzIgMzYyLjcyNCA1OC45NzMyIDM1Ni41MjcgNjMuNTcwNSAzNTYuNTI3IDcwLjM2NjUgMzU2LjUyNyA3Ny4xNjI0IDM2My41MjMgNzguOTYxMyAzNzIuMzE4IDgwLjI2MDZMMzgyLjIxMiA4MS43NTk3QzQwMy4xIDg0Ljc1NzkgNDE1LjQ5MiA5My42NTI2IDQxNS40OTIgMTEwLjA0MyA0MTUuNDkyIDEyNi40MzMgMzk5LjUwMiAxNDEuMzI0IDM3MS45MTggMTQxLjMyNCAzNDQuMzM1IDE0MS4zMjQgMzQ0LjgzNCAxMzkuNDI1IDMzMC44NDMgMTI5LjAzMkwzNDAuNTM3IDExMy4zNDFDMzQ3LjQzMyAxMTguNjM4IDM1Ni41MjcgMTIzLjEzNSAzNzIuMTE4IDEyMy4xMzUgMzg3LjcwOSAxMjMuMTM1IDM5My45MDUgMTE4LjYzOCAzOTMuOTA1IDExMS40NDIgMzkzLjkwNSAxMDQuMjQ2IDM4OC43MDggMTAyLjQ0NyAzNzcuMzE1IDEwMC44NDhMMzY3LjMyMSA5OS41NDkxQzM0Ni4xMzQgOTYuNjUwOCAzMzQuODQgODYuODU2NiAzMzQuODQgNzEuNDY1OCAzMzQuODQgNTYuMDc1IDM1MC4wMzEgNDAuNzg0MSAzNzQuNDE3IDQwLjc4NDEgMzk4LjgwMiA0MC43ODQxIDQwMy4zIDQ0LjQ4MTkgNDEzLjE5NCA1MC44NzgxTDQwNC4xOTkgNjcuMTY4NFoiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNNjQ0LjY1NiAxODIgNjIxLjQ3IDE4MiA2NTUuNzQ5IDEyMS43MzYgNjEzLjI3NSA0NS42ODExIDYzNi43NjEgNDUuNjgxMSA2NjcuNTQyIDEwMC42NDggNjk3LjIyNSA0NS42ODExIDcyMC4yMTEgNDUuNjgxMSA2NDQuNjU2IDE4MloiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNOTUyLjc3MiAxMDAuODQ4Qzk1Mi43NzIgMTMxLjMzIDkzMC43ODYgMTQzLjkyMyA5MDguMzk5IDE0My45MjMgODg2LjAxMiAxNDMuOTIzIDg2NC4wMjUgMTMxLjMzIDg2NC4wMjUgMTAwLjg0OEw4NjQuMDI1IDQ1LjY4MTEgODg1LjAxMyA0NS42ODExIDg4NS4wMTMgOTguOTQ5NEM4ODUuMDEzIDExNy40MzggODk1LjMwNyAxMjQuMjM0IDkwOC4zOTkgMTI0LjIzNCA5MjEuNDkxIDEyNC4yMzQgOTMxLjc4NSAxMTcuNDM4IDkzMS43ODUgOTguOTQ5NEw5MzEuNzg1IDQ1LjY4MTEgOTUyLjc3MiA0NS42ODExIDk1Mi43NzIgMTAwLjg0OFoiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNMTA2LjM3NiA1NS45NzUgOTIuOTg0MiA3MC4yNjY1Qzg2LjI4ODIgNjMuOTcwMyA3OS4xOTI0IDYwLjM3MjQgNjkuOTk3OSA2MC4zNzI0IDUzLjkwNzUgNjAuMzcyNCA0MS43MTQ4IDcyLjk2NDkgNDEuNzE0OCA5MS4wNTQxIDQxLjcxNDggMTA5LjE0MyA1My45MDc1IDEyMS43MzYgNjkuOTk3OSAxMjEuNzM2IDg2LjA4ODMgMTIxLjczNiA4Ny4zODc2IDExNy40MzggOTMuNDgzOSAxMTEuNzQyTDEwNi4zNzYgMTI2LjEzM0M5Ny42ODE0IDEzNi4yMjcgODQuODg5MSAxNDEuNDI0IDcwLjU5NzYgMTQxLjQyNCA0MC4xMTU3IDE0MS40MjQgMjAuMjI3NSAxMTkuNzM3IDIwLjIyNzUgOTEuMDU0MSAyMC4yMjc1IDYyLjM3MTIgNDAuMTE1NyA0MC42ODQxIDcwLjU5NzYgNDAuNjg0MSAxMDEuMDc5IDQwLjY4NDEgOTcuODgxMyA0NS44ODEgMTA2LjM3NiA1NS45NzVaIiBmaWxsPSIjRkZGRkZGIi8+PHBhdGggZD0iTTIyMS45MDggMTM4LjkyNiAyMDEuMDIgMTM4LjkyNiAyMDEuMDIgMTI3LjQzMkMxOTQuNDI0IDEzNS45MjcgMTg0LjUzIDE0MS40MjQgMTcwLjkzOCAxNDEuNDI0IDE0NC4xNTQgMTQxLjQyNCAxMjMuMDY2IDEyMC4zMzcgMTIzLjA2NiA5MS4wNTQxIDEyMy4wNjYgNjEuNzcxNiAxNDQuMTU0IDQwLjY4NDEgMTcwLjkzOCA0MC42ODQxIDE5Ny43MjIgNDAuNjg0MSAxOTQuNDI0IDQ2LjI4MDggMjAxLjAyIDU0Ljc3NTdMMjAxLjAyIDQzLjE4MjYgMjIxLjkwOCA0My4xODI2IDIyMS45MDggMTM4LjkyNlpNMTQ0LjU1NCA5MS4wNTQxQzE0NC41NTQgMTA3Ljg0NCAxNTUuNDQ3IDEyMS43MzYgMTczLjQzNiAxMjEuNzM2IDE5MS40MjYgMTIxLjczNiAyMDIuMzE5IDEwOC41NDQgMjAyLjMxOSA5MS4wNTQxIDIwMi4zMTkgNzMuNTY0NSAxOTAuNzI2IDYwLjM3MjQgMTczLjQzNiA2MC4zNzI0IDE1Ni4xNDcgNjAuMzcyNCAxNDQuNTU0IDc0LjI2NDEgMTQ0LjU1NCA5MS4wNTQxWiIgZmlsbD0iI0ZGRkZGRiIvPjxwYXRoIGQ9Ik04MzUuMTQzIDkzLjU1MjdDODM1LjE0MyAxMjIuMjM2IDgxMy4xNTYgMTQzLjkyMyA3ODMuNTczIDE0My45MjMgNzUzLjk5MSAxNDMuOTIzIDczMi4xMDQgMTIyLjIzNiA3MzIuMTA0IDkzLjU1MjcgNzMyLjEwNCA2NC44Njk3IDc1My45OTEgNDMuMTgyNiA3ODMuNTczIDQzLjE4MjYgODEzLjE1NiA0My4xODI2IDgzNS4xNDMgNjQuODY5NyA4MzUuMTQzIDkzLjU1MjdaTTc1My41OTEgOTMuNTUyN0M3NTMuNTkxIDExMS42NDIgNzY2LjQ4MyAxMjQuMjM0IDc4My41NzMgMTI0LjIzNCA4MDAuNjYzIDEyNC4yMzQgODEzLjY1NSAxMTEuNjQyIDgxMy42NTUgOTMuNTUyNyA4MTMuNjU1IDc1LjQ2MzQgODAwLjY2MyA2Mi44NzA5IDc4My41NzMgNjIuODcwOSA3NjYuNDgzIDYyLjg3MDkgNzUzLjU5MSA3NS40NjM0IDc1My41OTEgOTMuNTUyN1oiIGZpbGw9IiNGRkZGRkYiLz48L2c+PC9zdmc+","curta":"data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgOTkwIDQ1NCIgd2lkdGg9Ijk5MCIgaGVpZ2h0PSI0NTQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIG92ZXJmbG93PSJoaWRkZW4iPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDk2IC0xOTcpIj48cGF0aCBkPSJNMjE5Ljc4IDEzOC4yNTggMTg1LjU4MyAxNzUuMjczQzE2OC41MjEgMTU4Ljk2OSAxNTAuMzc2IDE0OS42NDIgMTI2Ljk1MiAxNDkuNjQyIDg1Ljg4NzYgMTQ5LjY0MiA1NC44MDAzIDE4Mi4yNSA1NC44MDAzIDIyOS4xNzkgNTQuODAwMyAyNzYuMTA4IDg1Ljg4NzYgMzA4LjcxNiAxMjYuOTUyIDMwOC43MTYgMTUwLjQ0OCAzMDguNzE2IDE3MS4zNDEgMjk3LjU1MyAxODYuODg1IDI4Mi43OTFMMjE5Ljc4IDMyMC4wOTlDMTk3LjU4NSAzNDYuMjQ1IDE2NC45OCAzNTkuNzU4IDEyOC40NyAzNTkuNzU4IDUwLjc1MTcgMzU5LjY4NCAwIDMwMy41MDEgMCAyMjkuMTc5IDAgMTU0Ljg1NiA1MC43NTE3IDk4LjYwMDEgMTI4LjU0MiA5OC42MDAxIDE2NC45OCA5OC42MDAxIDE5OC4xNjMgMTEyLjA0IDIxOS44NTEgMTM4LjI1OEwyMTkuNzggMTM4LjI1OFoiIGZpbGw9IiNGRkZGRkYiIHRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIDEuMDAxMzEgLTk2IDE5NykiLz48cGF0aCBkPSJNNTMyLjI5MSAxNDMuODIyIDUzMi4yOTEgNzEuODcgMzQyLjQzNiA3MS44NyAzNDIuNDM2IDAgNTMyLjI5MSAwIDUzMi4yOTEgNzEuOTUxNiA1OTUuNTk5IDcxLjk1MTYgNTk1LjU5OSAxNDMuOTAzIDUzMi4yOTEgMTQzLjkwMyA1MzIuMjkxIDE0My44MjJaTTM0Mi40MzYgMzU5LjY3NiAzNDIuNDM2IDIxNS44NTUgNDA1Ljc0NCAyMTUuODU1IDQwNS43NDQgMjg3LjgwNiA1OTUuNTk5IDI4Ny44MDYgNTk1LjU5OSAzNTkuNzU4IDM0Mi40MzYgMzU5Ljc1OCAzNDIuNDM2IDM1OS42NzZaTTQwNS42NzMgMjE1Ljc3MyA0MDUuNjczIDE0My44MjIgNTMyLjIxOCAxNDMuODIyIDUzMi4yMTggMjE1Ljc3MyA0MDUuNjczIDIxNS43NzNaIiBmaWxsPSIjRkZGRkZGIiB0cmFuc2Zvcm09Im1hdHJpeCgxIDAgMCAxLjAwMTMxIC05NiAxOTcpIi8+PHBhdGggZD0iTTc5Ni45NzEgNDUzLjAyOSA3MzcuNzY4IDQ1My4wMjkgODI1LjM0NCAyOTYuMzMxIDcxNi44NSA5OC42MDAxIDc3Ni44NTEgOTguNjAwMSA4NTUuNDUxIDI0MS41MiA5MzEuMzAzIDk4LjYwMDEgOTkwIDk4LjYwMDEgNzk2Ljk3MSA0NTMuMDI5WiIgZmlsbD0iI0ZGRkZGRiIgdHJhbnNmb3JtPSJtYXRyaXgoMSAwIDAgMS4wMDEzMSAtOTYgMTk3KSIvPjwvZz48L3N2Zz4="}};
const WL_VITRINE_C6 = [43, 48];
const MIN_CNPJ_CARTEIRA = 500;
const STATUS_NOME = {
  1: 'Ativo', 2: 'Aguardando pagamento', 3: 'Aguardando confirmação de pagamento',
  7: 'Vendido', 8: 'Suspenso', 9: 'Em análise do comprador', 10: 'Cancelado',
  11: 'Sem ofertas', 13: 'Em análise do vendedor', 14: 'Vendedor rejeitou',
  15: 'Comprador rejeitou', 18: 'Venda cancelada'
};
const pedidos = $('Montar Consultas').all().map((i) => i.json);
const respostas = $('MCP Consultas').all();
if (respostas.length !== pedidos.length) {
  throw new Error('MCP Consultas devolveu ' + respostas.length + ' respostas para ' +
    pedidos.length + ' consultas. Sem par um a um nao da para saber qual e qual.');
}
const T = {};
const vistas = {};
pedidos.forEach((p, i) => {
  const r = respostas[i] ? respostas[i].json : null;
  const sc = r ? (r.structuredContent || r) : null;
  if (!sc || !sc.rows || !sc.columns) {
    throw new Error('A consulta ' + p.queryName + ' nao voltou do MCP: ' +
      JSON.stringify(r).slice(0, 400));
  }
  const row = sc.rows[0] || [];
  const total = Number(row[sc.columns.indexOf('total')]);
  let linhas = row[sc.columns.indexOf('linhas')];
  if (typeof linhas === 'string') linhas = JSON.parse(linhas);
  if (linhas === null || linhas === undefined) linhas = [];
  if (!Number.isFinite(total) || linhas.length !== total) {
    throw new Error('Pacote incompleto em ' + p.queryName + ': o banco contou ' + total +
      ' linhas e chegaram ' + linhas.length + '. Publicar meia tabela e pior que nao publicar.');
  }
  if (!T[p.tabela]) T[p.tabela] = [];
  vistas[p.tabela] = (vistas[p.tabela] || 0) + 1;
  linhas.forEach((arr) => {
    if (arr.length !== p.cols.length) {
      throw new Error(p.queryName + ': linha com ' + arr.length + ' colunas, esperadas ' + p.cols.length);
    }
    const o = {};
    p.cols.forEach((k, j) => { o[k] = arr[j]; });
    T[p.tabela].push(o);
  });
});
const META = pedidos[0].meta;
Object.keys(META.partes).forEach((k) => {
  if (vistas[k] !== META.partes[k]) {
    throw new Error('A tabela ' + k + ' chegou em ' + (vistas[k] || 0) + ' parte(s), esperadas ' + META.partes[k]);
  }
});
const num = (x) => (x === null || x === undefined || x === '' ? null : Number(x));
const avisos = [];
const conta = {};
const marca = (chave) => { conta[chave] = (conta[chave] || 0) + 1; };
const CARTEIRA_VELHA_DIAS = 7;
const itCart = $('Ler Carteira').all();
const cj = itCart.length ? itCart[0].json : null;
let CART = cj ? (cj.carteira || cj) : null;
let semCarteira = '';
if (!CART || !Array.isArray(CART.consultores) || !CART.consultores.length ||
    !CART.cnpj || typeof CART.cnpj !== 'object') {
  semCarteira = 'a carteira comercial não veio (ou veio fora do formato): sem o filtro de responsável';
}
const soDigitos = (s) => {
  let o = '';
  const t = String(s === null || s === undefined ? '' : s);
  for (let i = 0; i < t.length; i++) if (t[i] >= '0' && t[i] <= '9') o += t[i];
  return o;
};
const cnpj14 = (s) => { const d = soDigitos(s); return d ? d.padStart(14, '0') : ''; };
let respPorCnpj = {};
if (!semCarteira) {
  Object.keys(CART.cnpj).forEach((k) => {
    const i = Number(CART.cnpj[k]);
    if (i >= 0 && i < CART.consultores.length) respPorCnpj[cnpj14(k)] = i;
    else semCarteira = 'a carteira comercial aponta CNPJ para consultor inexistente: sem o filtro de responsável';
  });
}
if (!semCarteira && Object.keys(respPorCnpj).length < MIN_CNPJ_CARTEIRA) {
  semCarteira = 'a carteira comercial veio com ' + Object.keys(respPorCnpj).length + ' CNPJ, abaixo do piso de ' +
    MIN_CNPJ_CARTEIRA + ' (leitura truncada): sem o filtro de responsável';
}
if (semCarteira) {
  respPorCnpj = {};
  CART = { consultores: [], cnpj: {}, gerado_em: '' };
}
const PISO_DIA = META.piso_dia;
const utcDe = (s) => Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)));
const P0 = utcDe(PISO_DIA);
const diaIdx = (s) => (s ? Math.round((utcDe(s) - P0) / 86400000) : null);
const HOJE = diaIdx(META.agora_br);
if (HOJE !== META.dias) throw new Error('o dia de hoje (' + HOJE + ') nao e o ultimo da janela (' + META.dias + ')');
const eventos = T.eventos.map((e) => {
  const d0 = Math.max(0, diaIdx(e.ini));
  let d1 = Math.min(HOJE, diaIdx(e.fim));
  if (d1 < d0) { marca('evento_fim_antes'); d1 = d0; }
  return {
    id: num(e.id), nome: e.nome, ini: e.ini, fim: e.fim, d0: d0, d1: d1,
    wls: String(e.wls || '').split(',').filter((x) => x !== '').map(Number), comits: []
  };
}).sort((a, b) => (a.fim < b.fim ? 1 : a.fim > b.fim ? -1 : b.id - a.id));
const evIdx = {};
eventos.forEach((e, i) => { evIdx[e.id] = i; });
const comitentes = T.comitentes.map((c) => ({ id: num(c.id), nome: String(c.nome || '').trim() || ('loja ' + c.id) }))
  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
const comIdx = {};
comitentes.forEach((c, i) => { comIdx[c.id] = i; });
const cartConta = { por_cnpj: 0, nao_distribuidas: 0, sem_cnpj: 0 };
const lojas = T.lojas.map((l) => {
  const c = cnpj14(l.cnpj);
  let resp = -1;
  if (!c) cartConta.sem_cnpj++;
  else if (respPorCnpj[c] !== undefined) { resp = respPorCnpj[c]; cartConta.por_cnpj++; }
  else cartConta.nao_distribuidas++;
  return { id: num(l.id), linha: [String(l.nome || '').trim() || ('loja ' + l.id), num(l.wl), resp] };
});
const lojaIdx = {};
lojas.forEach((l, i) => { lojaIdx[l.id] = i; });
const veics = T.veiculos.map((v) => {
  let est = diaIdx(v.estreia);
  if (est === null) { marca('veiculo_sem_estreia'); est = -1; }
  if (est < 0) est = -1;
  return { id: num(v.veic), linha: [v.marca || '', v.modelo || '', v.versao || '', num(v.ano), num(v.km), est,
    String(v.uuid || '').split('-').join('')] };
});
const veicIdx = {};
veics.forEach((v, i) => { veicIdx[v.id] = i; });
const negs = [];
const negIdx = {};
T.negs.forEach((r) => {
  const e = evIdx[num(r.ev)];
  const v = veicIdx[num(r.veic)];
  if (e === undefined) { marca('neg_sem_evento'); return; }
  if (v === undefined) { marca('neg_sem_veiculo'); return; }
  let c = comIdx[num(r.comit)];
  if (c === undefined) { marca('neg_sem_comitente'); c = -1; }
  if (c >= 0 && eventos[e].comits.indexOf(c) < 0) eventos[e].comits.push(c);
  negIdx[num(r.neg)] = negs.length;
  negs.push([e, v, c, num(r.status), num(r.vmv), num(r.fipe)]);
});
const daLoja = (rotulo, id) => {
  const l = lojaIdx[num(id)];
  if (l === undefined) marca(rotulo);
  return l;
};
const ofertas = [];
T.ofertas.forEach((o) => {
  const n = negIdx[num(o.neg)];
  if (n === undefined) { marca('oferta_sem_neg'); return; }
  const l = daLoja('oferta_sem_loja', o.loja);
  if (l === undefined) return;
  ofertas.push([n, l, num(o.n), num(o.maior), num(o.dias)]);
});
const acessos = [];
T.acessos.forEach((a) => {
  const n = negIdx[num(a.neg)];
  if (n === undefined) { marca('acesso_sem_neg'); return; }
  const l = daLoja('acesso_sem_loja', a.loja);
  if (l === undefined) return;
  acessos.push([n, l, num(a.dias)]);
});
const vendas = [];
T.vendas.forEach((s) => {
  const n = negIdx[num(s.neg)];
  if (n === undefined) { marca('venda_sem_neg'); return; }
  let l = -1;
  if (num(s.loja) === null) marca('venda_sem_loja_compradora');
  else {
    l = daLoja('venda_sem_loja', s.loja);
    if (l === undefined) return;
  }
  const d = diaIdx(s.quando);
  if (d === null || d < 0 || d > HOJE) marca('venda_fora_da_janela');
  vendas.push([n, l, num(s.valor), d === null ? -1 : d]);
});
const logins = [];
T.logins.forEach((g) => {
  const l = daLoja('login_sem_loja', g.loja);
  if (l === undefined) return;
  logins.push([l, num(g.wl), num(g.dias)]);
});
const TEXTO_AVISO = {
  evento_fim_antes: 'evento(s) com fim antes do início das ofertas',
  veiculo_sem_estreia: 'veículo(s) sem data de estreia — nunca contam como novos',
  neg_sem_evento: 'negociação(ões) fora dos eventos do recorte',
  neg_sem_veiculo: 'negociação(ões) sem o veículo na consulta de veículos',
  neg_sem_comitente: 'negociação(ões) de comitente fora da lista de comitentes',
  oferta_sem_neg: 'oferta(s) de negociação fora do recorte',
  oferta_sem_loja: 'oferta(s) de loja fora da tabela de lojas',
  acesso_sem_neg: 'acesso(s) de negociação fora do recorte',
  acesso_sem_loja: 'acesso(s) de loja fora da tabela de lojas',
  venda_sem_neg: 'venda(s) de negociação fora do recorte',
  venda_sem_loja: 'venda(s) de loja fora da tabela de lojas',
  venda_sem_loja_compradora: 'venda(s) com a oferta vencedora sem loja — contam como venda do veículo, fora dos lojistas que compraram',
  venda_fora_da_janela: 'venda(s) com a oferta vencedora fora dos 31 dias — não entram nos gráficos',
  login_sem_loja: 'loja(s) com acesso ao canal fora da tabela de lojas'
};
Object.keys(conta).forEach((k) => avisos.push(conta[k] + ' ' + (TEXTO_AVISO[k] || k)));
if (semCarteira) avisos.push(semCarteira);
else if (CART.gerado_em) {
  const g = String(CART.gerado_em);
  const idade = HOJE - diaIdx(g);
  if (idade > CARTEIRA_VELHA_DIAS) {
    avisos.push('carteira comercial de ' + g.slice(8, 10) + '/' + g.slice(5, 7) + '/' + g.slice(0, 4) + ', com ' + idade +
      ' dias: o responsável de cada loja pode estar desatualizado');
  }
}
const DADOS = {
  agora: META.agora_br, piso_dia: PISO_DIA, hoje: HOJE,
  canais: T.canais.map((c) => [num(c.id), c.nome]).sort((a, b) => a[0] - b[0]),
  eventos: eventos.map((e) => ({ nome: e.nome, ini: e.ini, fim: e.fim, d0: e.d0, d1: e.d1, wls: e.wls, comits: e.comits })),
  comitentes: comitentes.map((c) => c.nome),
  consultores: CART.consultores,
  carteira_em: String(CART.gerado_em || '').slice(0, 10),
  veics: veics.map((v) => v.linha),
  negs: negs, ofertas: ofertas, acessos: acessos, vendas: vendas, logins: logins,
  lojas: lojas.map((l) => l.linha),
  status_nome: STATUS_NOME, vitrine_c6: WL_VITRINE_C6,
  avisos: avisos
};
function calcula(D, F) {
  F = F || {};
  const ST_VENDA = [2, 3, 7];
  const ST_ANALISE = [9, 13];
  const vazio = (x) => x === undefined || x === null || x === '';
  let de = vazio(F.de) ? 0 : Number(F.de);
  let ate = vazio(F.ate) ? D.hoje : Number(F.ate);
  if (de > ate) { const t = de; de = ate; ate = t; }
  const faixa = (a, b) => { let m = 0; for (let d = a; d <= b; d++) m |= (1 << d); return m; };
  const bit = (m, d) => ((m >>> d) & 1) === 1;
  const per = faixa(de, ate);
  const wl = vazio(F.wl) ? 0 : Number(F.wl);
  const comit = vazio(F.comit) ? -1 : Number(F.comit);
  const ev = vazio(F.ev) ? -1 : Number(F.ev);
  const resp = vazio(F.resp) ? '' : String(F.resp);
  if (!D._ix) {
    const ix = { of: [], ac: [], ven: [] };
    D.negs.forEach(() => { ix.of.push([]); ix.ac.push([]); ix.ven.push(null); });
    D.ofertas.forEach((o) => ix.of[o[0]].push(o));
    D.acessos.forEach((a) => ix.ac[a[0]].push(a));
    D.vendas.forEach((s) => { ix.ven[s[0]] = s; });
    ix.evMask = D.eventos.map((e) => faixa(e.d0, e.d1));
    D._ix = ix;
  }
  const X = D._ix;
  const evOk = D.eventos.map((e, i) => (!wl || e.wls.indexOf(wl) >= 0) && (ev < 0 || i === ev) &&
    (comit < 0 || e.comits.indexOf(comit) >= 0));
  const lojaOk = D.lojas.map((l) => resp === '' || (resp === 'nd' ? l[2] < 0 : l[2] === Number(resp)));
  const nOk = (n) => evOk[n[0]] && (comit < 0 || n[2] === comit);
  const NV = D.veics.length;
  const NL = D.lojas.length;
  const zeros = (k) => { const a = []; for (let i = 0; i < k; i++) a.push(0); return a; };
  const vAt = zeros(NV);
  const vAc = zeros(NV);
  const vOf = zeros(NV);
  const vVe = zeros(NV);
  const vNegs = [];
  const lLog = zeros(NL);
  const lAc = zeros(NL);
  const lOf = zeros(NL);
  const lCo = zeros(NL);
  D.negs.forEach((n, i) => {
    if (!nOk(n)) return;
    const m = X.evMask[n[0]] & per;
    const v = n[1];
    if (m) {
      vAt[v] |= m;
      if (!vNegs[v]) vNegs[v] = [];
      vNegs[v].push(i);
    }
    X.ac[i].forEach((a) => { if (lojaOk[a[1]]) { vAc[v] |= a[2]; lAc[a[1]] |= a[2] & per; } });
    X.of[i].forEach((o) => { if (lojaOk[o[1]]) { vOf[v] |= o[4]; lOf[o[1]] |= o[4] & per; } });
    const s = X.ven[i];
    if (s && s[3] >= 0 && (s[1] < 0 ? resp === '' : lojaOk[s[1]])) {
      vVe[v] |= (1 << s[3]);
      if (s[1] >= 0) lCo[s[1]] |= (1 << s[3]) & per;
    }
  });
  D.logins.forEach((g) => { if (lojaOk[g[0]] && (!wl || g[1] === wl)) lLog[g[0]] |= g[2] & per; });
  const dias = [];
  for (let d = de; d <= ate; d++) {
    dias.push({ d: d, ativos: 0, novos: 0, acesso: 0, oferta: 0, venda: 0, acesso_n: 0, oferta_n: 0, venda_n: 0 });
  }
  let noPeriodo = 0;
  for (let v = 0; v < NV; v++) {
    if (!vAt[v]) continue;
    noPeriodo++;
    const est = D.veics[v][5];
    for (let d = de; d <= ate; d++) {
      if (!bit(vAt[v], d)) continue;
      const g = dias[d - de];
      const nv = est === d;
      g.ativos++;
      if (nv) g.novos++;
      if (bit(vAc[v], d)) { g.acesso++; if (nv) g.acesso_n++; }
      if (bit(vOf[v], d)) { g.oferta++; if (nv) g.oferta_n++; }
      if (bit(vVe[v], d)) { g.venda++; if (nv) g.venda_n++; }
    }
  }
  const lojistas = dias.map((g) => ({ d: g.d, logaram: 0, acessaram: 0, ofertaram: 0, compraram: 0 }));
  const totLoj = { logaram: 0, acessaram: 0, ofertaram: 0, compraram: 0 };
  [['logaram', lLog], ['acessaram', lAc], ['ofertaram', lOf], ['compraram', lCo]].forEach((p) => {
    p[1].forEach((m) => {
      if (!m) return;
      totLoj[p[0]]++;
      for (let d = de; d <= ate; d++) if (bit(m, d)) lojistas[d - de][p[0]]++;
    });
  });
  const ref = ate;
  const evRef = {};
  let nEvRef = 0;
  D.eventos.forEach((e, i) => { if (evOk[i] && e.d0 <= ref && ref <= e.d1) { evRef[i] = 1; nEvRef++; } });
  const melhor = {};
  D.negs.forEach((n, i) => {
    if (!evRef[n[0]] || !nOk(n)) return;
    const j = melhor[n[1]];
    if (j === undefined) { melhor[n[1]] = i; return; }
    const a = D.eventos[n[0]].fim;
    const b = D.eventos[D.negs[j][0]].fim;
    if (a > b || (a === b && i > j)) melhor[n[1]] = i;
  });
  const k = {
    ref: ref, eventos: nEvRef, veiculos: 0, comitentes: 0,
    ativos: 0, ativos_acesso: 0, ativos_oferta: 0,
    analise: 0, analise_comprador: 0, analise_vendedor: 0,
    vendidos: 0, aguardando: 0, vendido: 0, valor: 0,
    removidos: 0, rem_cancelado: 0, rem_sem_oferta: 0, rem_rejeitado: 0, rem_outros: 0
  };
  const comRef = {};
  Object.keys(melhor).forEach((v) => {
    const i = melhor[v];
    const n = D.negs[i];
    const st = n[3];
    k.veiculos++;
    if (n[2] >= 0) comRef[n[2]] = 1;
    if (st === 1) {
      k.ativos++;
      if (X.ac[i].length) k.ativos_acesso++;
      if (X.of[i].length) k.ativos_oferta++;
    } else if (ST_ANALISE.indexOf(st) >= 0) {
      k.analise++;
      if (st === 9) k.analise_comprador++; else k.analise_vendedor++;
    } else if (ST_VENDA.indexOf(st) >= 0) {
      k.vendidos++;
      if (st === 7) k.vendido++; else k.aguardando++;
      if (X.ven[i]) k.valor += X.ven[i][2];
    } else {
      k.removidos++;
      if (st === 8 || st === 10) k.rem_cancelado++;
      else if (st === 11) k.rem_sem_oferta++;
      else if (st === 14 || st === 15 || st === 18) k.rem_rejeitado++;
      else k.rem_outros++;
    }
  });
  k.comitentes = Object.keys(comRef).length;
  const veiculos = [];
  for (let v = 0; v < NV; v++) {
    const ns = vNegs[v];
    if (!ns) continue;
    let ult = ns[0];
    ns.forEach((i) => {
      const a = D.eventos[D.negs[i][0]].fim;
      const b = D.eventos[D.negs[ult][0]].fim;
      if (a > b || (a === b && i > ult)) ult = i;
    });
    const quemAc = {};
    const quemOf = {};
    let lances = 0;
    let maior = null;
    const evs = {};
    ns.forEach((i) => {
      evs[D.negs[i][0]] = 1;
      X.ac[i].forEach((a) => { if (lojaOk[a[1]] && (a[2] & per)) quemAc[a[1]] = 1; });
      X.of[i].forEach((o) => {
        if (!lojaOk[o[1]]) return;
        quemOf[o[1]] = 1;
        lances += o[2];
        if (maior === null || o[3] > maior) maior = o[3];
      });
    });
    const n = D.negs[ult];
    const vmv = n[4];
    const fipe = n[5];
    const s = X.ven[ult];
    let farol = 'sem';
    if (maior !== null) farol = vmv !== null && maior >= vmv ? 'atingiu' : 'abaixo';
    const vv = D.veics[v];
    veiculos.push({
      v: v, nome: [vv[0], vv[1], vv[2]].filter((x) => x).join(' ') || '(sem modelo)',
      ev: n[0], n_ev: Object.keys(evs).length, comit: n[2], status: n[3],
      acessos: Object.keys(quemAc).length, lances: lances, ofertantes: Object.keys(quemOf).length,
      maior: maior, vmv: vmv, fipe: fipe,
      pvmv: maior !== null && vmv ? maior / vmv : null,
      pfipe: maior !== null && fipe ? maior / fipe : null,
      vendido: ST_VENDA.indexOf(n[3]) >= 0,
      comprador: s && ST_VENDA.indexOf(n[3]) >= 0 ? s[1] : null,
      venda: s && ST_VENDA.indexOf(n[3]) >= 0 ? s[2] : null,
      estreia: vv[5], farol: farol
    });
  }
  return { de: de, ate: ate, kpi: k, dias: dias, lojistas: lojistas, tot_lojistas: totLoj,
    veiculos_periodo: noPeriodo, veiculos: veiculos };
}
function APP(D, LOGO) {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s === null || s === undefined ? '' : s)
    .split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');
  const nf = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('pt-BR'));
  const rs = (n) => (n === null || n === undefined ? '—' : 'R$ ' + Math.round(n).toLocaleString('pt-BR'));
  const pc = (x) => (x === null || x === undefined ? '—' : (100 * x).toFixed(1).replace('.', ',') + '%');
  const pc0 = (x) => (x === null || x === undefined ? '—' : Math.round(100 * x) + '%');
  const dt = (s) => (s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(2, 4) + ' ' + s.slice(11, 16) : '—');
  const P0 = Date.UTC(Number(D.piso_dia.slice(0, 4)), Number(D.piso_dia.slice(5, 7)) - 1, Number(D.piso_dia.slice(8, 10)));
  const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const dataDia = (d) => new Date(P0 + d * 86400000);
  const rotDia = (d) => { const x = dataDia(d); return String(x.getUTCDate()).padStart(2, '0') + '/' + String(x.getUTCMonth() + 1).padStart(2, '0'); };
  const rotDiaLongo = (d) => SEMANA[dataDia(d).getUTCDay()] + ' ' + rotDia(d);
  const FAROL = { sem: 'Sem oferta', abaixo: 'Oferta abaixo do VMV', atingiu: 'VMV atingido' };
  const KPI = {
    acesso: { nome: 'Com acesso', linha: '% com acesso' },
    oferta: { nome: 'Com oferta', linha: '% com oferta' },
    venda: { nome: 'Vendidos', linha: '% vendidos' }
  };
  const tagStatus = (st) => {
    const nome = D.status_nome[st] || ('status ' + st);
    let cls = '';
    if ([2, 3, 7].indexOf(st) >= 0) cls = 'ok';
    else if (st === 11 || st === 10 || st === 8) cls = 'ruim';
    else if ([14, 15, 18].indexOf(st) >= 0) cls = 'atencao';
    return '<span class="tag ' + cls + '">' + esc(nome) + '</span>';
  };
  const trilho = (x) => '<span class="trilho" aria-hidden="true"><i style="width:' +
    (x === null ? 0 : Math.max(0, Math.min(100, 100 * x))).toFixed(1) + '%"></i></span>';
  const linkDe = (r) => {
    const vv = D.veics[r.v];
    const partes = [vv[0], vv[1], vv[2]].map((x) => String(x || '').trim());
    if (!vv[6] || partes.some((p) => !p)) return null;
    const wls = D.eventos[r.ev].wls;
    const soC6 = wls.length > 0 && wls.every((w) => D.vitrine_c6.indexOf(w) >= 0);
    return (soC6 ? 'https://compraveiculos.cars2you.com.br' : 'https://cars2you.com.br') +
      '/anuncio/veiculo/' + partes.map((p) => encodeURIComponent(p.toLowerCase())).join('/') + '/' + vv[6];
  };
  const F = { wl: '', comit: '', ev: '', resp: '', de: '', ate: '' };
  const FILTROS = ['wl', 'comit', 'ev', 'resp', 'de', 'ate'];
  let kpi = 'acesso';
  let modo = 'todos';
  let busca = '';
  const PASSO = 100;
  const ordem = { veic: { k: 'lances', dir: -1 } };
  const TABELAS = {};
  function tabela(id, cols, linhas) {
    const lim = TABELAS[id] ? TABELAS[id].lim : PASSO;
    TABELAS[id] = { cols: cols, linhas: linhas, lim: lim };
    desenhaTabela(id);
  }
  function desenhaTabela(id) {
    const t = TABELAS[id];
    const o = ordem[id];
    const col = t.cols.find((c) => c.k === o.k) || t.cols[0];
    const val = (r) => (col.v ? col.v(r) : r[col.k]);
    const idx = t.linhas.map((r, i) => [r, i]);
    idx.sort((a, b) => {
      const x = val(a[0]);
      const y = val(b[0]);
      const vx = x === null || x === undefined;
      const vy = y === null || y === undefined;
      if (vx || vy) return vx === vy ? a[1] - b[1] : (vx ? 1 : -1);
      if (x === y) return a[1] - b[1];
      if (typeof x === 'string') return o.dir * x.localeCompare(y);
      return o.dir * (x < y ? -1 : 1);
    });
    $('#th-' + id).innerHTML = t.cols.map((c) => {
      const at = c.k === o.k;
      return '<th class="' + (c.n ? 'n' : '') + '"' + (at ? ' aria-sort="' + (o.dir > 0 ? 'ascending' : 'descending') + '"' : '') + '>' +
        '<button type="button" class="ord' + (at ? ' at' : '') + '" data-t="' + id + '" data-k="' + c.k + '">' +
        esc(c.t) + '<span class="seta-ord" aria-hidden="true">' + (at ? (o.dir > 0 ? '▲' : '▼') : '') + '</span></button></th>';
    }).join('');
    const vis = idx.slice(0, t.lim);
    $('#tb-' + id).innerHTML = vis.length
      ? vis.map((p) => '<tr>' + t.cols.map((c) => '<td class="' + (c.n ? 'n' : '') + (c.cls ? ' ' + c.cls : '') + '">' +
          (c.h ? c.h(p[0]) : esc(p[0][c.k])) + '</td>').join('') + '</tr>').join('')
      : '<tr><td colspan="' + t.cols.length + '" class="dim">Nada neste recorte.</td></tr>';
    const resta = idx.length - vis.length;
    const b = $('#mais-' + id);
    b.hidden = resta <= 0;
    b.textContent = 'Mostrar mais ' + nf(Math.min(PASSO, resta)) + ' · ' + nf(vis.length) + ' de ' + nf(idx.length);
  }
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('button.ord');
    if (!b) return;
    const id = b.getAttribute('data-t');
    const k = b.getAttribute('data-k');
    const t = TABELAS[id];
    const c = t.cols.find((x) => x.k === k);
    if (ordem[id].k === k) ordem[id].dir = -ordem[id].dir;
    else { ordem[id].k = k; ordem[id].dir = c.n ? -1 : 1; }
    desenhaTabela(id);
  });
  $('#mais-veic').addEventListener('click', () => {
    TABELAS.veic.lim += PASSO;
    desenhaTabela('veic');
  });
  const dica = $('#dica-g');
  function mostraDica(alvo, html) {
    dica.innerHTML = html;
    dica.hidden = false;
    const r = alvo.getBoundingClientRect();
    const w = dica.offsetWidth;
    let x = r.left + r.width / 2 - w / 2;
    x = Math.max(8, Math.min(window.innerWidth - w - 8, x));
    let y = r.top - dica.offsetHeight - 8;
    if (y < 8) y = r.bottom + 8;
    dica.style.left = x + 'px';
    dica.style.top = y + 'px';
  }
  const escondeDica = () => { dica.hidden = true; };
  ['mouseover', 'focusin'].forEach((tipo) => document.addEventListener(tipo, (ev) => {
    const a = ev.target.closest ? ev.target.closest('[data-dica]') : null;
    if (a) mostraDica(a, a.getAttribute('data-dica'));
  }));
  ['mouseout', 'focusout'].forEach((tipo) => document.addEventListener(tipo, (ev) => {
    const a = ev.target.closest ? ev.target.closest('[data-dica]') : null;
    if (a) escondeDica();
  }));
  window.addEventListener('scroll', escondeDica, { passive: true });
  const ALT_G = 280;
  const passoRedondo = (topo) => {
    const p = Math.pow(10, Math.floor(Math.log(Math.max(1, topo)) / Math.LN10)) / 10;
    return Math.max(1, [1, 2, 5, 10, 20, 50].map((m) => m * p).find((c) => topo / c <= 5) || p * 100);
  };
  const largura = (alvo) => Math.max(300, Math.round(alvo.getBoundingClientRect().width) || 960);
  const eixoX = (s, grupos, esq, slot, base, ALT) => {
    const cadaX = Math.max(1, Math.ceil(grupos.length / Math.max(1, Math.floor(slot * grupos.length / 44))));
    grupos.forEach((g, i) => {
      if (i % cadaX === 0) {
        s.push('<text class="eixo" x="' + (esq + i * slot + slot / 2).toFixed(1) + '" y="' + (ALT - 6) + '" text-anchor="middle">' + esc(g.rot) + '</text>');
      }
    });
    s.push('<line class="linha-grade forte" x1="' + esq + '" x2="' + (esq + slot * grupos.length).toFixed(1) + '" y1="' + base + '" y2="' + base + '"/>');
  };
  function combo(alvo, grupos) {
    const W = largura(alvo);
    const n = grupos.length;
    if (!n) { alvo.innerHTML = '<p class="dim">Nenhum dia no período.</p>'; return; }
    const esq = 44;
    const dir = 44;
    const topo = 12;
    const base = ALT_G - 24;
    const slot = (W - esq - dir) / n;
    const barra = Math.max(3, Math.min(28, slot * 0.62));
    const topoV = Math.max(1, Math.max.apply(null, grupos.map((g) => g.a + g.b)));
    const passo = passoRedondo(topoV);
    const topoN = Math.ceil(topoV / passo) * passo;
    const maxP = Math.max(0.005, Math.max.apply(null, grupos.map((g) => (g.p === null ? 0 : g.p))) * 1.08);
    const passoP = [0.01, 0.02, 0.05, 0.1, 0.2, 0.25].find((p) => Math.ceil(maxP / p) <= 5) || 0.25;
    const marcasP = Math.max(2, Math.ceil(maxP / passoP));
    const topoP = Math.min(1, passoP * marcasP);
    const hN = (v) => (base - topo) * v / topoN;
    const yP = (p) => base - (base - topo) * p / topoP;
    const s = ['<svg class="graf" viewBox="0 0 ' + W + ' ' + ALT_G + '" width="' + W + '" height="' + ALT_G + '" role="img" aria-label="' + esc(alvo.getAttribute('data-rot')) + '">'];
    for (let v = passo; v <= topoN; v += passo) {
      const y = base - hN(v);
      s.push('<line class="linha-grade" x1="' + esq + '" x2="' + (W - dir) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>' +
        '<text class="eixo" x="' + (esq - 6) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end">' + nf(v) + '</text>');
    }
    for (let p = passoP; p <= topoP + 1e-9; p += passoP) {
      s.push('<text class="eixo eixo-p" x="' + (W - dir + 6) + '" y="' + (yP(p) + 3.5).toFixed(1) + '">' + pc0(p) + '</text>');
    }
    s.push('<text class="eixo" x="' + (esq - 6) + '" y="' + (base + 3.5) + '" text-anchor="end">0</text>');
    eixoX(s, grupos, esq, slot, base, ALT_G);
    const pontos = [];
    grupos.forEach((g, i) => {
      const x0 = esq + i * slot;
      const x = x0 + (slot - barra) / 2;
      const ha = hN(g.a);
      const hb = hN(g.b);
      const r = Math.min(3, barra / 2);
      if (ha > 0) s.push('<rect class="serie-b" x="' + x.toFixed(1) + '" y="' + (base - ha).toFixed(1) + '" width="' + barra.toFixed(1) + '" height="' + ha.toFixed(1) + '"' + (hb > 0 ? '' : ' rx="' + r + '"') + '/>');
      if (hb > 0) s.push('<rect class="serie-a" x="' + x.toFixed(1) + '" y="' + (base - ha - hb).toFixed(1) + '" width="' + barra.toFixed(1) + '" height="' + hb.toFixed(1) + '" rx="' + r + '"/>');
      if (g.p !== null) pontos.push([x0 + slot / 2, yP(g.p)]);
      else pontos.push(null);
    });
    let d = '';
    pontos.forEach((p, i) => {
      if (!p) return;
      d += (i && pontos[i - 1] ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
    });
    if (d) s.push('<path class="linha-kpi" d="' + d + '"/>');
    pontos.forEach((p) => { if (p) s.push('<circle class="ponto-kpi" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3"/>'); });
    grupos.forEach((g, i) => {
      s.push('<rect class="alvo" x="' + (esq + i * slot).toFixed(1) + '" y="' + topo + '" width="' + slot.toFixed(1) + '" height="' + (base - topo + 22) +
        '" tabindex="0" data-dica="' + esc(g.dica) + '"/>');
    });
    alvo.innerHTML = s.join('') + '</svg>';
  }
  function linhas(alvo, grupos, series) {
    const W = largura(alvo);
    const n = grupos.length;
    if (!n) { alvo.innerHTML = '<p class="dim">Nenhum dia no período.</p>'; return; }
    const esq = 44;
    const dir = 12;
    const topo = 12;
    const base = ALT_G - 24;
    const slot = (W - esq - dir) / n;
    const topoV = Math.max(1, Math.max.apply(null, grupos.map((g) => Math.max.apply(null, series.map((se) => g[se.k])))));
    const passo = passoRedondo(topoV);
    const topoN = Math.ceil(topoV / passo) * passo;
    const y = (v) => base - (base - topo) * v / topoN;
    const s = ['<svg class="graf" viewBox="0 0 ' + W + ' ' + ALT_G + '" width="' + W + '" height="' + ALT_G + '" role="img" aria-label="' + esc(alvo.getAttribute('data-rot')) + '">'];
    for (let v = passo; v <= topoN; v += passo) {
      s.push('<line class="linha-grade" x1="' + esq + '" x2="' + (W - dir) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/>' +
        '<text class="eixo" x="' + (esq - 6) + '" y="' + (y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + nf(v) + '</text>');
    }
    s.push('<text class="eixo" x="' + (esq - 6) + '" y="' + (base + 3.5) + '" text-anchor="end">0</text>');
    eixoX(s, grupos, esq, slot, base, ALT_G);
    series.forEach((se) => {
      const pts = grupos.map((g, i) => [esq + i * slot + slot / 2, y(g[se.k])]);
      s.push('<path class="linha ' + se.cls + '" d="' + pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('') + '"/>');
      if (n <= 45) pts.forEach((p) => s.push('<circle class="ponto ' + se.cls + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.5"/>'));
    });
    grupos.forEach((g, i) => {
      const txt = '<b>' + esc(g.longo) + '</b>' + series.map((se) => '<br><span class="amostra ' + se.cls + '"></span>' +
        esc(se.nome) + ': ' + nf(g[se.k])).join('');
      s.push('<rect class="alvo" x="' + (esq + i * slot).toFixed(1) + '" y="' + topo + '" width="' + slot.toFixed(1) + '" height="' + (base - topo + 22) +
        '" tabindex="0" data-dica="' + esc(txt) + '"/>');
    });
    alvo.innerHTML = s.join('') + '</svg>';
  }
  function opcoes(id, lista, rotTodos, atual) {
    const el = $('#' + id);
    el.innerHTML = '<option value="">' + esc(rotTodos) + '</option>' + lista.map((o) =>
      '<option value="' + esc(o[0]) + '"' + (o[0] === atual ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('');
    el.value = lista.some((o) => o[0] === atual) ? atual : '';
    return el.value;
  }
  const estado = (e) => (D.agora < e.ini ? 'agendado' : D.agora <= e.fim ? 'em andamento' : 'encerrado');
  function montaFiltros() {
    F.wl = opcoes('f-wl', D.canais.map((c) => [String(c[0]), c[1] + ' (' + c[0] + ')']), 'Todos os canais', F.wl);
    F.comit = opcoes('f-comit', D.comitentes.map((c, i) => [String(i), c]), 'Todos os comitentes', F.comit);
    const evs = [];
    D.eventos.forEach((e, i) => {
      if (F.wl && e.wls.indexOf(Number(F.wl)) < 0) return;
      if (F.comit !== '' && e.comits.indexOf(Number(F.comit)) < 0) return;
      evs.push([String(i), e.nome + ' · ' + estado(e)]);
    });
    F.ev = opcoes('f-ev', evs, 'Todos os eventos (' + nf(evs.length) + ')', F.ev);
    F.resp = opcoes('f-resp', D.consultores.map((c, i) => [String(i), c]).concat([['nd', 'Não distribuído']]), 'Todos os responsáveis', F.resp);
    $('#f-resp').closest('.fg').hidden = !D.consultores.length;
    const dias = [];
    for (let d = 0; d <= D.hoje; d++) dias.push([String(d), rotDiaLongo(d)]);
    F.de = opcoes('f-de', dias, 'Desde ' + rotDia(0), F.de);
    F.ate = opcoes('f-ate', dias.slice().reverse(), 'Até hoje (' + rotDia(D.hoje) + ')', F.ate);
  }
  function contaFiltros() {
    const n = FILTROS.filter((k) => F[k] !== '').length;
    const b = $('#aba-n');
    b.textContent = n ? String(n) : '';
    b.hidden = !n;
  }
  function gaveta(abre) {
    $('#gaveta').className = abre ? 'gaveta aberta' : 'gaveta';
    $('#veu').hidden = !abre;
    $('#aba').setAttribute('aria-expanded', abre ? 'true' : 'false');
  }
  $('#aba').addEventListener('click', () => gaveta($('#gaveta').className.indexOf('aberta') < 0));
  $('#fecha').addEventListener('click', () => gaveta(false));
  $('#veu').addEventListener('click', () => gaveta(false));
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') gaveta(false); });
  [['f-wl', 'wl'], ['f-comit', 'comit'], ['f-ev', 'ev'], ['f-resp', 'resp'], ['f-de', 'de'], ['f-ate', 'ate']].forEach((p) => {
    $('#' + p[0]).addEventListener('change', (ev) => {
      F[p[1]] = ev.target.value;
      if (p[1] === 'wl' || p[1] === 'comit') montaFiltros();
      if (TABELAS.veic) TABELAS.veic.lim = PASSO;
      render();
    });
  });
  $('#limpar').addEventListener('click', () => {
    FILTROS.forEach((k) => { F[k] = ''; });
    montaFiltros();
    if (TABELAS.veic) TABELAS.veic.lim = PASSO;
    render();
  });
  function alterna(id, valor) {
    document.querySelectorAll('#' + id + ' button').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === valor)));
  }
  $('#seg-kpi').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-v]');
    if (!b) return;
    kpi = b.getAttribute('data-v');
    alterna('seg-kpi', kpi);
    desenhaAtivos();
  });
  $('#seg-modo').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-v]');
    if (!b) return;
    modo = b.getAttribute('data-v');
    alterna('seg-modo', modo);
    desenhaAtivos();
  });
  let esperaBusca = null;
  $('#busca').addEventListener('input', (ev) => {
    clearTimeout(esperaBusca);
    esperaBusca = setTimeout(() => {
      busca = ev.target.value.trim().toLowerCase();
      if (TABELAS.veic) TABELAS.veic.lim = PASSO;
      desenhaVeiculos();
    }, 160);
  });
  let R = null;
  function desenhaAtivos() {
    const novos = modo === 'novos';
    const grupos = R.dias.map((g) => {
      const base = novos ? g.novos : g.ativos;
      const hit = novos ? g[kpi + '_n'] : g[kpi];
      const linhaDia = (k2, nome) => {
        const h = novos ? g[k2 + '_n'] : g[k2];
        return '<br>' + esc(nome) + ': ' + nf(h) + ' (' + (base ? pc(h / base) : '—') + ')';
      };
      return {
        rot: rotDia(g.d),
        a: novos ? 0 : g.ativos - g.novos,
        b: g.novos,
        p: base ? hit / base : null,
        dica: '<b>' + esc(rotDiaLongo(g.d)) + '</b><br>' +
          (novos ? '' : '<span class="amostra serie-b"></span>Veículos ativos: ' + nf(g.ativos) + '<br>') +
          '<span class="amostra serie-a"></span>Novos: ' + nf(g.novos) +
          linhaDia('acesso', 'Com acesso') + linhaDia('oferta', 'Com oferta') + linhaDia('venda', 'Vendidos')
      };
    });
    $('#leg-a').hidden = novos;
    $('#leg-linha').textContent = KPI[kpi].linha + (novos ? ' dos novos' : '');
    combo($('#g-ativos'), grupos);
  }
  function desenhaVeiculos() {
    const linhasV = busca
      ? R.veiculos.filter((r) => (r.nome + ' ' + D.eventos[r.ev].nome + ' ' + (r.comit >= 0 ? D.comitentes[r.comit] : '')).toLowerCase().indexOf(busca) >= 0)
      : R.veiculos;
    $('#n-veic').textContent = nf(linhasV.length) + (linhasV.length === 1 ? ' veículo' : ' veículos');
    tabela('veic', [
      { k: 'nome', t: 'Veículo', h: (r) => {
        const vv = D.veics[r.v];
        const lk = linkDe(r);
        return '<span class="farol ' + r.farol + '" title="' + FAROL[r.farol] + '"></span>' +
          (lk ? '<a href="' + esc(lk) + '" target="_blank" rel="noopener">' + esc(r.nome) + ' ↗</a>' : esc(r.nome)) +
          '<span class="dim sub">' + [vv[3], vv[4] !== null ? nf(vv[4]) + ' km' : null, r.estreia >= 0 ? 'estreia ' + rotDia(r.estreia) : 'estreia antes de ' + rotDia(0)]
            .filter((x) => x !== null && x !== '').join(' · ') + '</span>';
      } },
      { k: 'evento', t: 'Evento', v: (r) => D.eventos[r.ev].nome, h: (r) => esc(D.eventos[r.ev].nome) +
        '<span class="dim sub">' + esc(r.comit >= 0 ? D.comitentes[r.comit] : '—') +
        (r.n_ev > 1 ? ' · ' + r.n_ev + ' eventos no período' : '') + '</span>' },
      { k: 'acessos', t: 'Acessos', n: true, h: (r) => nf(r.acessos) },
      { k: 'lances', t: 'Ofertas', n: true, h: (r) => nf(r.lances) + (r.ofertantes ? '<span class="dim sub">' + nf(r.ofertantes) + (r.ofertantes === 1 ? ' loja' : ' lojas') + '</span>' : '') },
      { k: 'maior', t: 'Maior oferta', n: true, h: (r) => rs(r.maior) },
      { k: 'fipe', t: 'FIPE', n: true, h: (r) => rs(r.fipe) },
      { k: 'pfipe', t: '% FIPE', n: true, cls: 'c-vmv', h: (r) => (r.pfipe === null ? '<span class="dim">—</span>'
        : '<span class="vmv">' + trilho(r.pfipe) + '<span class="num">' + pc0(r.pfipe) + '</span></span>') },
      { k: 'vmv', t: 'VMV', n: true, h: (r) => rs(r.vmv) },
      { k: 'pvmv', t: '% VMV', n: true, cls: 'c-vmv', h: (r) => (r.pvmv === null ? '<span class="dim">—</span>'
        : '<span class="vmv' + (r.pvmv >= 1 ? ' ok' : '') + '">' + trilho(r.pvmv) + '<span class="num">' + pc0(r.pvmv) + '</span></span>') },
      { k: 'status', t: 'Resultado', v: (r) => D.status_nome[r.status] || '', h: (r) => tagStatus(r.status) +
        (r.comprador !== null ? '<span class="dim sub">' + esc(r.comprador >= 0 ? D.lojas[r.comprador][0] : 'comprador sem loja') +
          ' · ' + rs(r.venda) + '</span>' : '') }
    ], linhasV);
  }
  function render() {
    contaFiltros();
    R = calcula(D, F);
    const k = R.kpi;
    const pcBar = (idTxt, idBar, x, rot) => {
      $(idTxt).textContent = x === null ? '—' : pc(x) + ' ' + rot;
      $(idBar).innerHTML = trilho(x);
    };
    const hoje = R.ate === D.hoje;
    $('#k-ev-rot').textContent = hoje ? 'Eventos ativos hoje' : 'Eventos ativos em ' + rotDia(R.ate);
    $('#k-ev').textContent = nf(k.eventos);
    $('#k-ev-dia').textContent = rotDiaLongo(R.ate) + (hoje ? ' · até ' + D.agora.slice(11, 16) : '');
    $('#k-ev-veic').textContent = nf(k.veiculos);
    $('#k-ev-com').textContent = nf(k.comitentes);
    const sobre = (x) => (k.veiculos ? x / k.veiculos : null);
    $('#k-at').textContent = nf(k.ativos);
    pcBar('#k-at-pc', '#k-at-bar', sobre(k.ativos), 'dos veículos');
    $('#k-at-ac').textContent = nf(k.ativos_acesso);
    $('#k-at-of').textContent = nf(k.ativos_oferta);
    $('#k-an').textContent = nf(k.analise);
    pcBar('#k-an-pc', '#k-an-bar', sobre(k.analise), 'dos veículos');
    $('#k-an-comp').textContent = nf(k.analise_comprador);
    $('#k-an-vend').textContent = nf(k.analise_vendedor);
    $('#k-vd').textContent = nf(k.vendidos);
    pcBar('#k-vd-pc', '#k-vd-bar', sobre(k.vendidos), 'dos veículos');
    $('#k-vd-ag').textContent = nf(k.aguardando);
    $('#k-vd-vd').textContent = nf(k.vendido);
    $('#k-vd-rs').textContent = rs(k.valor);
    $('#k-rm').textContent = nf(k.removidos);
    pcBar('#k-rm-pc', '#k-rm-bar', sobre(k.removidos), 'dos veículos');
    $('#k-rm-can').textContent = nf(k.rem_cancelado + k.rem_outros);
    $('#k-rm-sem').textContent = nf(k.rem_sem_oferta);
    $('#k-rm-rej').textContent = nf(k.rem_rejeitado);
    $('#n-ativos').textContent = nf(R.veiculos_periodo) + ' veículos no período';
    desenhaAtivos();
    $('#n-lojistas').textContent = nf(R.tot_lojistas.logaram) + ' lojas logaram';
    linhas($('#g-lojistas'), R.lojistas.map((g) => Object.assign({ rot: rotDia(g.d), longo: rotDiaLongo(g.d) }, g)), [
      { k: 'logaram', nome: 'Logaram', cls: 's-log' },
      { k: 'acessaram', nome: 'Acessaram', cls: 's-ac' },
      { k: 'ofertaram', nome: 'Ofertaram', cls: 's-of' },
      { k: 'compraram', nome: 'Compraram', cls: 's-co' }
    ]);
    $('#tot-lojistas').innerHTML = [['Logaram', 'logaram'], ['Acessaram', 'acessaram'], ['Ofertaram', 'ofertaram'], ['Compraram', 'compraram']]
      .map((p) => '<span>' + p[0] + ' no período <b class="num">' + nf(R.tot_lojistas[p[1]]) + '</b></span>').join('');
    desenhaVeiculos();
  }
  let esperaLk = null;
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest ? ev.target.closest('a[target="_blank"]') : null;
    if (!a) return;
    ev.preventDefault();
    const url = a.href;
    let w = null;
    try { w = window.open(url, '_blank'); if (w) w.opener = null; } catch (e) { w = null; }
    if (w) return;
    let copiou = false;
    try {
      const t = document.createElement('textarea');
      t.value = url;
      t.style.position = 'fixed';
      t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      copiou = document.execCommand('copy');
      document.body.removeChild(t);
    } catch (e) { copiou = false; }
    const cx = $('#dica-lk');
    cx.innerHTML = '<b>' + (copiou ? 'Link copiado' : 'O navegador bloqueou a abertura') + '</b>' +
      '<span class="dim sub">Abra uma nova aba e cole o endereço:</span><span class="lk-url"></span>';
    cx.querySelector('.lk-url').textContent = url;
    cx.hidden = false;
    clearTimeout(esperaLk);
    esperaLk = setTimeout(() => { cx.hidden = true; }, 12000);
  });
  let espera = null;
  let largAnt = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === largAnt) return;
    largAnt = window.innerWidth;
    clearTimeout(espera);
    espera = setTimeout(() => { desenhaAtivos(); render(); }, 150);
  });
  if (D.avisos.length) {
    const b = $('#b-aviso');
    b.hidden = false;
    b.querySelector('.cont').textContent = D.avisos.length;
    $('#dica').innerHTML = '<b>Pontos de atenção desta coleta</b><ul>' +
      D.avisos.map((a) => '<li>' + esc(a) + '</li>').join('') + '</ul>';
    const abre = () => { $('#dica').hidden = false; };
    const fecha = () => { $('#dica').hidden = true; };
    b.addEventListener('mouseenter', abre);
    b.addEventListener('focus', abre);
    b.addEventListener('mouseleave', fecha);
    b.addEventListener('blur', fecha);
    b.addEventListener('click', () => { $('#dica').hidden = !$('#dica').hidden; });
  }
  $('#gloss-lista').innerHTML = D.glossario.map((g) =>
    '<dt>' + esc(g[0]) + '</dt><dd>' + esc(g[1]) + '</dd>').join('');
  $('#gloss-n').textContent = D.glossario.length + ' termos';
  $('#gerado').textContent = dt(D.agora);
  $('#base').textContent = nf(D.eventos.length) + ' eventos dos canais ' + D.canais.map((c) => c[0]).join(', ') +
    ' com fim desde ' + rotDia(0) + '/' + D.piso_dia.slice(0, 4) +
    (D.carteira_em ? ' · carteira comercial de ' + D.carteira_em.slice(8, 10) + '/' + D.carteira_em.slice(5, 7) + '/' + D.carteira_em.slice(0, 4) : '');
  const ICO = {
    claro: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    escuro: '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>'
  };
  function tema(t) {
    document.documentElement.dataset.tema = t;
    $('#logo').src = LOGO[t].extensa;
    $('#logo-curta').src = LOGO[t].curta;
    const alvo = t === 'escuro' ? 'claro' : 'escuro';
    const b = $('#b-tema');
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICO[alvo] + '</svg>';
    b.setAttribute('aria-label', 'Mudar para o tema ' + alvo);
    b.setAttribute('title', 'Tema ' + alvo);
  }
  tema(document.documentElement.dataset.tema || 'escuro');
  $('#b-tema').addEventListener('click', () =>
    tema(document.documentElement.dataset.tema === 'escuro' ? 'claro' : 'escuro'));
  gaveta(false);
  montaFiltros();
  render();
}
const nomesCanais = DADOS.canais.map((c) => c[1] + ' (' + c[0] + ')').join(', ');
DADOS.glossario = [
  ['Evento no painel', 'Evento que alveja algum dos canais ' + nomesCanais + ', que já abriu as ofertas e termina a partir de ' +
    META.dias + ' dias atrás: os ativos e os encerrados recentes. Agendado, com as ofertas ainda fechadas, não entra.'],
  ['Filtros', 'Na aba lateral. Canal, comitente e evento recortam os veículos, e tudo que nasce deles acompanha. O canal também escolhe em que canal contam os logins. Responsável recorta as lojas. Data escolhe os dias dos gráficos e da tabela, e o dia dos cartões.'],
  ['Comitente', 'A loja que anuncia o veículo no evento — o banco, a locadora ou a frota que está vendendo.'],
  ['Responsável', 'O consultor comercial dono da loja na carteira comercial, pelo CNPJ. Recorta as lojas: acessos, ofertas, vendas e logins de quem é da carteira dele. Os veículos não têm responsável, então os cartões e as barras de veículos ativos não mudam com ele. Não distribuído: loja fora da carteira.'],
  ['Data', 'De e Até escolhem os dias dos dois gráficos e da tabela de veículos. Os cartões mostram os eventos ativos no dia do Até — hoje, sem filtro.'],
  ['Eventos ativos', 'Eventos abertos no dia: do dia do início das ofertas ao dia do fim. Embaixo, os veículos distintos desses eventos e os comitentes deles.'],
  ['Status nos cartões', 'De cada veículo dos eventos ativos no dia, o status da negociação no evento mais recente. O mesmo carro num feirão que fecha e noutro que abre no mesmo dia conta uma vez. O percentual é sobre os veículos dos eventos ativos.'],
  ['Veículos ativos', 'Negociação ativa, ainda recebendo lance. Embaixo, quantos já tiveram o anúncio aberto por alguma loja e quantos já receberam oferta nesse evento.'],
  ['Em análise', 'Há oferta na mesa e a decisão está com o comprador ou com o vendedor.'],
  ['Vendidos', 'Aguardando pagamento, aguardando confirmação de pagamento ou vendido. O valor é a soma das ofertas vencedoras.'],
  ['Removidos', 'Inativos não vendidos: cancelados ou suspensos, sem ofertas, e rejeitados pelo vendedor ou pelo comprador ou com a venda cancelada.'],
  ['Veículos ativos por dia', 'Veículos distintos com negociação num evento aberto no dia. A barra separa os que já estavam em evento dos novos do dia.'],
  ['Novo', 'Veículo que estreou no dia: o dia de início das ofertas do primeiro evento da vida dele, em qualquer canal. O carro que volta num feirão seguinte não é novo de novo. Na tabela, a data da estreia fica embaixo do veículo.'],
  ['% com acesso, com oferta, vendidos', 'A linha do gráfico, escolhida nos botões acima dele: dos veículos ativos no dia, quantos tiveram o anúncio aberto por alguma loja, receberam lance ou foram vendidos (pela data da oferta vencedora) naquele dia. Com Novos, a conta é só dos novos do dia.'],
  ['Lojistas por dia', 'Lojas distintas por dia. Logaram: entraram no canal (qualquer acesso registrado). Acessaram: abriram algum anúncio dos eventos filtrados. Ofertaram: deram lance. Compraram: têm a oferta vencedora de uma venda, no dia dela. Embaixo, as lojas distintas do período inteiro.'],
  ['Acessos (tabela)', 'Lojas distintas que abriram o anúncio do veículo no período. Uma loja que abriu dez vezes conta uma.'],
  ['Ofertas', 'Lances nas negociações do veículo no período e, embaixo, quantas lojas deram lance.'],
  ['Maior oferta', 'O maior lance do veículo nas negociações do período.'],
  ['% FIPE e % VMV', 'A maior oferta dividida pela FIPE do anúncio e pelo valor mínimo de venda (VMV) que o comitente aceita. 100% ou mais no VMV = VMV atingido.'],
  ['Evento e resultado', 'Na tabela, o evento mais recente do veículo no período e o status da negociação nele. Quando vendeu, a loja compradora e o valor.'],
  ['Farol', 'A bolinha antes do veículo. Vermelho: sem oferta. Amarelo: há oferta, mas nenhuma chegou ao VMV (ou o VMV não foi informado). Verde: alguma oferta alcançou o VMV.'],
  ['Link do anúncio', 'Abre o anúncio mais recente do veículo — na vitrine do C6 quando o evento é só dos canais do C6, no cars2you.com.br nos demais.']
];
const CSS_PAINEL = [
  ':root{--serie-2:#748290;--farol-abaixo:#946200}',
  '[data-tema="escuro"]{--serie-2:#646E86;--farol-abaixo:#E3B341}',
  '[hidden]{display:none!important}',
  '.aviso{position:relative}.aviso .cont{position:absolute;top:-5px;right:-5px;min-width:16px;height:16px;border-radius:8px;',
  'background:var(--negativo);color:var(--superficie);font-size:10px;font-weight:700;line-height:16px;text-align:center}',
  '#dica{position:fixed;z-index:40;top:calc(var(--topo-h) + 4px);right:20px;width:max-content;max-width:min(560px,92vw);',
  'background:var(--superficie);color:var(--texto);border:1px solid var(--borda-forte);border-radius:var(--r-m);',
  'box-shadow:var(--sombra);padding:12px 14px;font-size:12.5px;pointer-events:none}',
  '#dica ul{margin:6px 0 0;padding-left:18px}',
  '#dica-lk{position:fixed;z-index:50;left:50%;bottom:20px;transform:translateX(-50%);width:max-content;max-width:min(640px,92vw);',
  'background:var(--superficie);border:1px solid var(--borda);border-radius:10px;padding:10px 14px;box-shadow:0 6px 24px rgba(0,0,0,.18);font-size:13px}',
  '#dica-lk .lk-url{display:block;margin-top:4px;word-break:break-all;user-select:all}',
  '#dica-g{position:fixed;z-index:40;width:max-content;max-width:min(320px,92vw);background:var(--superficie);',
  'color:var(--texto);border:1px solid var(--borda-forte);border-radius:var(--r-p);box-shadow:var(--sombra);',
  'padding:8px 10px;font-size:12px;line-height:1.5;pointer-events:none;font-variant-numeric:tabular-nums}',
  '.kpi-pc{display:flex;flex-direction:column;gap:5px;margin-top:2px}',
  '.kpi-pc .txt{font-size:11.5px;font-weight:600;color:var(--texto-2)}',
  '.trilho{display:block;height:6px;border-radius:3px;background:var(--acento-veu);overflow:hidden;min-width:40px}',
  '.trilho i{display:block;height:100%;border-radius:3px;background:var(--acento-cheio)}',
  '.g4.g5{grid-template-columns:repeat(5,minmax(0,1fr))}',
  '@media (max-width:1400px){.g4.g5{grid-template-columns:repeat(3,minmax(0,1fr))}}',
  '@media (max-width:900px){.g4.g5{grid-template-columns:repeat(2,minmax(0,1fr))}}',
  '@media (max-width:620px){.g4.g5{grid-template-columns:1fr}}',
  '.seg{display:inline-flex;padding:2px;gap:2px;border-radius:var(--r-p);background:var(--superficie-2);border:1px solid var(--borda)}',
  '.seg button{font:inherit;font-size:12px;font-weight:600;color:var(--texto-2);background:transparent;border:0;',
  'border-radius:8px;padding:5px 10px;cursor:pointer}',
  '.seg button[aria-pressed="true"]{background:var(--acento);color:var(--superficie)}',
  '.seg button:focus-visible{outline:2px solid var(--acento);outline-offset:1px}',
  '.cartao-topo{flex-wrap:wrap}',
  '.ctrl-graf{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 10px}',
  'button.ord{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;display:inline-flex;gap:4px;',
  'align-items:center;white-space:nowrap;text-align:inherit}',
  'button.ord.at{color:var(--texto)}button.ord:focus-visible{outline:2px solid var(--acento);outline-offset:2px}',
  '.seta-ord{font-size:9px;min-width:8px}th.n button.ord{flex-direction:row-reverse}',
  '.rolo.alto{max-height:640px;overflow:auto}',
  'table.dens thead th{text-align:left}table.dens tbody td{text-align:left}',
  'table.dens td.n,table.dens th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}',
  'table.dens a{color:var(--texto);text-decoration:underline;text-underline-offset:2px}',
  '.dim{color:var(--texto-3)}.sub{display:block;font-size:11px}',
  '.farol{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px;vertical-align:1px}',
  '.farol.sem{background:var(--negativo)}.farol.abaixo{background:var(--farol-abaixo)}.farol.atingiu{background:var(--positivo)}',
  'td.c-vmv{min-width:110px}.vmv{display:inline-flex;align-items:center;gap:8px;justify-content:flex-end;width:100%}',
  '.vmv .trilho{width:56px;flex:none}.vmv.ok .trilho i{background:var(--positivo)}',
  '.mais{display:block;margin:12px auto 0}',
  '.busca{max-width:260px}',
  '.legenda{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--texto-2);margin:0 0 8px}',
  '.amostra{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px}',
  '.amostra.traco{height:3px;border-radius:2px;vertical-align:2px;width:14px}',
  '.graf .serie-a,.amostra.serie-a{fill:var(--acento-cheio);background:var(--acento-cheio)}',
  '.graf .serie-b,.amostra.serie-b{fill:var(--serie-2);background:var(--serie-2)}',
  '.graf .linha-kpi{fill:none;stroke:var(--atencao);stroke-width:2.25;stroke-linejoin:round;stroke-linecap:round}',
  '.graf .ponto-kpi{fill:var(--atencao)}.amostra.linha-kpi{background:var(--atencao)}',
  '.graf .eixo-p{fill:var(--atencao)}',
  '.graf .linha-grade.forte{stroke:var(--borda-forte)}',
  '.graf .linha{fill:none;stroke-width:2.25;stroke-linejoin:round;stroke-linecap:round}',
  '.graf .linha.s-log{stroke:var(--texto-3)}.graf .ponto.s-log,.amostra.s-log{fill:var(--texto-3);background:var(--texto-3)}',
  '.graf .linha.s-ac{stroke:var(--acento-cheio)}.graf .ponto.s-ac,.amostra.s-ac{fill:var(--acento-cheio);background:var(--acento-cheio)}',
  '.graf .linha.s-of{stroke:var(--atencao)}.graf .ponto.s-of,.amostra.s-of{fill:var(--atencao);background:var(--atencao)}',
  '.graf .linha.s-co{stroke:var(--positivo)}.graf .ponto.s-co,.amostra.s-co{fill:var(--positivo);background:var(--positivo)}',
  '.graf .alvo{fill:transparent;cursor:default}.graf .alvo:hover,.graf .alvo:focus{fill:var(--acento-veu);outline:none}',
  '.caixa-g{width:100%;min-height:280px}.caixa-g > svg{display:block;width:100%;height:auto}',
  '.tot{display:flex;gap:18px;flex-wrap:wrap;font-size:12px;color:var(--texto-2);margin-top:10px}',
  '.tot b{color:var(--texto);font-weight:650;margin-left:4px}',
  '.aba{position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:41;display:flex;flex-direction:column;',
  'align-items:center;gap:6px;padding:14px 7px;border-radius:0 var(--r-m) var(--r-m) 0;border:var(--cartao-borda);',
  'border-left:0;background:var(--superficie);color:var(--texto);box-shadow:var(--sombra);cursor:pointer;font:inherit}',
  '.aba:hover{color:var(--acento);border-color:var(--borda-forte)}',
  '.aba svg{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round}',
  '.aba .rot{writing-mode:vertical-rl;font-size:11.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}',
  '.aba .n{min-width:18px;height:18px;border-radius:9px;background:var(--acento);color:var(--superficie);',
  'font-size:11px;font-weight:700;line-height:18px;text-align:center}',
  '.gaveta{position:fixed;left:0;top:0;bottom:0;z-index:42;width:min(380px,92vw);overflow:auto;padding:14px;',
  'transform:translateX(-102%);transition:transform .18s ease;background:var(--fundo)}',
  '.gaveta.aberta{transform:none}',
  '.veu{position:fixed;inset:0;z-index:41;background:rgba(4,6,12,.45)}',
  '.fechar{margin-left:auto;background:none;border:0;padding:0 4px;font-size:20px;line-height:1;color:var(--texto-3);cursor:pointer}',
  '.fechar:hover{color:var(--texto)}',
  '.filtros{display:grid;gap:12px;grid-template-columns:1fr}',
  '.fg label,.fg .rot-fg{display:block;font-size:12px;font-weight:600;color:var(--texto-2);margin-bottom:4px}',
  '.fg select,.fg button{width:100%}',
  '.fg2{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
  '.nota{font-size:12px;color:var(--texto-2);margin-top:14px;line-height:1.5}',
  '.area{padding-left:52px}',
  '@media(max-width:620px){.area{padding-left:12px}.aba{top:auto;bottom:16px;transform:none;flex-direction:row}',
  '.aba .rot{writing-mode:horizontal-tb}.busca{max-width:none;width:100%}}',
  '@media (prefers-reduced-motion:reduce){.gaveta{transition:none}}'
].join('');
const ICONE = {
  evento: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  veiculo: '<path d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5v5h-3M6 18H3v-5h18"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  vendido: '<path d="M20 6L9 17l-5-5"/>',
  removido: '<circle cx="12" cy="12" r="9"/><path d="M8 8l8 8M16 8l-8 8"/>',
  grafico: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  pessoa: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  lista: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  filtros: '<path d="M3 5h18M6 12h12M10 19h4"/>',
  gloss: '<path d="M4 19V5a2 2 0 012-2h13v18H6a2 2 0 01-2-2z"/><path d="M4 19a2 2 0 012-2h13"/>'
};
const chip = (k) => '<span class="chip" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICONE[k] + '</svg></span>';
const kpiCard = (ic, rot, idVal, meio, pe, idRot) =>
  '<article class="cartao"><div class="cartao-topo">' + chip(ic) + '<span class="kpi-rot"' + (idRot ? ' id="' + idRot + '"' : '') + '>' + rot + '</span></div>' +
  '<p class="kpi-val num" id="' + idVal + '">—</p>' + meio +
  '<dl class="kpi-pe">' + pe.map((p) => '<div><dt>' + p[0] + '</dt><dd class="num" id="' + p[1] + '">—</dd></div>').join('') +
  '</dl></article>';
const meioPc = (idTxt, idBar) => '<div class="kpi-pc"><span class="txt num" id="' + idTxt + '">—</span><span id="' + idBar + '"></span></div>';
const topoCartao = (ic, titulo, idN, extra) => '<div class="cartao-topo">' + chip(ic) + '<h2>' + titulo + '</h2>' +
  '<span class="dir">' + (extra || '') + '<span class="tag" id="' + idN + '">—</span></span></div>';
const seg = (id, rot, opcoes, ativo) => '<span class="seg" id="' + id + '" role="group" aria-label="' + rot + '">' +
  opcoes.map((o) => '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (o[0] === ativo) + '">' + o[1] + '</button>').join('') +
  '</span>';
const filtro = (id, rotulo) => '<div class="fg"><label for="' + id + '">' + rotulo + '</label>' +
  '<select class="ctrl" id="' + id + '"></select></div>';
const dadosJs = JSON.stringify(DADOS).split('<').join(String.fromCharCode(92) + 'u003c');
const logoJs = JSON.stringify(LOGO);
const html = '<!doctype html><html lang="pt-BR" data-tema="escuro"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">' +
  '<title>Painel de Eventos — Cars2You</title><style>' + CSS_TEMA + CSS_PAINEL + '</style></head><body>' +
  '<header class="topo"><div class="topo-in">' +
  '<span class="marca"><img class="logo logo-extensa" id="logo" src="" alt="Cars2You">' +
  '<img class="logo logo-curta" id="logo-curta" src="" alt="Cars2You"></span>' +
  '<div class="topo-tit"><h1>Painel de Eventos</h1></div>' +
  '<div class="topo-acoes">' +
  '<button class="ctrl so-icone aviso" id="b-aviso" type="button" hidden aria-label="Pontos de atenção">' +
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></svg>' +
  '<span class="cont"></span></button>' +
  '<button class="ctrl so-icone" id="b-tema" type="button" aria-label="Mudar o tema"></button>' +
  '</div></div></header><div id="dica" hidden></div><div id="dica-g" hidden></div><div id="dica-lk" hidden></div>' +
  '<button id="aba" class="aba" type="button" aria-expanded="false" aria-controls="gaveta">' +
  '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONE.filtros + '</svg><span class="rot">Filtros</span>' +
  '<span class="n" id="aba-n" hidden></span></button>' +
  '<div id="veu" class="veu" hidden></div>' +
  '<aside id="gaveta" class="gaveta" aria-label="Filtros"><div class="cartao">' +
  '<div class="cartao-topo">' + chip('filtros') + '<h2>Filtros</h2>' +
  '<button id="fecha" class="fechar" type="button" aria-label="Fechar filtros">×</button></div>' +
  '<div class="filtros">' +
  filtro('f-wl', 'Whitelabel') +
  filtro('f-comit', 'Comitente') +
  filtro('f-ev', 'Evento') +
  filtro('f-resp', 'Responsável da carteira comercial') +
  '<div class="fg2">' + filtro('f-de', 'Data: de') + filtro('f-ate', 'até') + '</div>' +
  '<div class="fg"><button class="ctrl" id="limpar" type="button">Limpar filtros</button></div>' +
  '</div>' +
  '<p class="nota"><b>Whitelabel</b>, <b>comitente</b> e <b>evento</b> recortam os veículos, e tudo que nasce deles acompanha. ' +
  '<b>Responsável</b> recorta as lojas: os cartões e as barras de veículos não mudam com ele. ' +
  '<b>Data</b> escolhe os dias dos gráficos e da tabela; os cartões mostram o dia do Até.</p>' +
  '</div></aside>' +
  '<main class="area">' +
  '<section class="g4 g5" aria-label="Eventos ativos no dia">' +
  kpiCard('evento', 'Eventos ativos hoje', 'k-ev', '<div class="kpi-pc"><span class="txt" id="k-ev-dia">—</span></div>',
    [['Veículos', 'k-ev-veic'], ['Comitentes', 'k-ev-com']], 'k-ev-rot') +
  kpiCard('veiculo', 'Veículos ativos', 'k-at', meioPc('k-at-pc', 'k-at-bar'),
    [['Com acesso', 'k-at-ac'], ['Com oferta', 'k-at-of']]) +
  kpiCard('relogio', 'Em análise', 'k-an', meioPc('k-an-pc', 'k-an-bar'),
    [['Comprador', 'k-an-comp'], ['Vendedor', 'k-an-vend']]) +
  kpiCard('vendido', 'Vendidos', 'k-vd', meioPc('k-vd-pc', 'k-vd-bar'),
    [['Aguardando pgto.', 'k-vd-ag'], ['Vendido', 'k-vd-vd'], ['Valor', 'k-vd-rs']]) +
  kpiCard('removido', 'Removidos', 'k-rm', meioPc('k-rm-pc', 'k-rm-bar'),
    [['Cancelados', 'k-rm-can'], ['Sem ofertas', 'k-rm-sem'], ['Rejeitados', 'k-rm-rej']]) +
  '</section>' +
  '<article class="cartao">' + topoCartao('grafico', 'Veículos ativos por dia', 'n-ativos') +
  '<div class="ctrl-graf">' +
  seg('seg-kpi', 'Indicador da linha', [['acesso', 'Com acesso'], ['oferta', 'Com oferta'], ['venda', 'Vendidos']], 'acesso') +
  seg('seg-modo', 'Veículos', [['todos', 'Todos'], ['novos', 'Novos']], 'todos') + '</div>' +
  '<div class="legenda"><span id="leg-a"><span class="amostra serie-b"></span>Já em evento</span>' +
  '<span><span class="amostra serie-a"></span>Novos no dia</span>' +
  '<span><span class="amostra traco linha-kpi"></span><span id="leg-linha">% com acesso</span> (eixo da direita)</span></div>' +
  '<div class="caixa-g" id="g-ativos" data-rot="Veículos ativos por dia, já em evento e novos, com o percentual do indicador escolhido"></div></article>' +
  '<article class="cartao">' + topoCartao('pessoa', 'Lojistas por dia', 'n-lojistas') +
  '<div class="legenda"><span><span class="amostra traco s-log"></span>Logaram</span>' +
  '<span><span class="amostra traco s-ac"></span>Acessaram</span>' +
  '<span><span class="amostra traco s-of"></span>Ofertaram</span>' +
  '<span><span class="amostra traco s-co"></span>Compraram</span></div>' +
  '<div class="caixa-g" id="g-lojistas" data-rot="Lojas distintas por dia que logaram, acessaram, ofertaram e compraram"></div>' +
  '<div class="tot" id="tot-lojistas"></div></article>' +
  '<section class="cartao">' + topoCartao('lista', 'Veículos', 'n-veic',
    '<input class="ctrl busca" id="busca" type="search" placeholder="Buscar veículo, evento ou comitente" aria-label="Buscar veículo, evento ou comitente">') +
  '<div class="rolo alto"><table class="dens"><thead><tr id="th-veic"></tr></thead><tbody id="tb-veic"></tbody></table></div>' +
  '<button class="ctrl mais" id="mais-veic" type="button" hidden></button></section>' +
  '<details class="cartao gloss" id="gloss"><summary class="cartao-topo">' + chip('gloss') + '<h2>Glossário</h2>' +
  '<span class="dir"><span class="tag" id="gloss-n">—</span><span class="seta" aria-hidden="true">▾</span></span>' +
  '</summary><dl id="gloss-lista"></dl></details>' +
  '<p class="rodape">Atualizado em <span id="gerado">—</span> · <span id="base"></span></p>' +
  '</main><script>' +
  calcula.toString() + APP.toString() +
  'APP(' + dadosJs + ',' + logoJs + ');' +
  '</script></body></html>';
const todos = calcula(DADOS, {});
const resumo = {
  eventos: eventos.length, negociacoes: negs.length, veiculos: veics.length,
  ofertas: ofertas.length, acessos: acessos.length, vendas: vendas.length, logins: logins.length,
  lojas: lojas.length, comitentes: comitentes.length,
  carteira: { consultores: CART.consultores.length, cnpj: Object.keys(respPorCnpj).length, gerado_em: CART.gerado_em,
    sem_carteira: semCarteira, lojas: cartConta },
  kpi: todos.kpi,
  veiculos_periodo: todos.veiculos_periodo,
  hoje: todos.dias[todos.dias.length - 1],
  lojistas_hoje: todos.lojistas[todos.lojistas.length - 1],
  tot_lojistas: todos.tot_lojistas,
  avisos: avisos,
  bytes_html: html.length
};
if (CSS_TEMA.length < 5000) throw new Error('CSS do tema nao injetado (rode _aplica-modelo.js)');
if (!LOGO.claro || !LOGO.escuro || !LOGO.claro.extensa || !LOGO.escuro.curta) throw new Error('logos nao injetadas (rode _aplica-modelo.js)');
return [{ json: { html: html, resumo: resumo } }];
` }
  }
});

const arquivo = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Virar Arquivo',
    position: [1120, 0],
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
    position: [1344, 0],
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
  .to(carteira)
  .to(consultas)
  .to(mcp)
  .to(painel)
  .to(arquivo)
  .to(subir);
