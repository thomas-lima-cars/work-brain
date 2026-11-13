import { workflow, node, trigger, newCredential, expr } from '@n8n/workflow-sdk';

const rodar = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Rodar', position: [0, 0] }
});

const consultas = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Montar Consultas',
    position: [224, 0],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `const WL_C6 = 43;
const VENDEDORES_IGA = [594, 598, 16036];
const CAMPANHA_FORM = 'fenauto';
const INICIO_CAMPANHA = '2026-11-10 00:00:00';
const MESES_SEM_COMPRA = 6;
const GRUPOS_IGA = [148];
const GRUPO_IGA_NOME = 'VD Itaú - Fenauto 2026';
const NOME_EVENTO = 'fenauto';
const DURACAO_MAX_DIAS = 31;
const FUSO_MIN = -180;
const DB = 'cars2you_production';
const pad = (n) => String(n).padStart(2, '0');
const dataDe = (d) => d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
const agora = new Date(Date.now() + FUSO_MIN * 60000);
const AGORA_BR = dataDe(agora) + ' ' + pad(agora.getUTCHours()) + ':' + pad(agora.getUTCMinutes());
const MES_INI = dataDe(new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1))) + ' 00:00:00';
const MES_FIM = dataDe(new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() + 1, 1))) + ' 00:00:00';
const SEM_COMPRA_DESDE = dataDe(new Date(Date.UTC(Number(INICIO_CAMPANHA.slice(0, 4)),
  Number(INICIO_CAMPANHA.slice(5, 7)) - 1 - MESES_SEM_COMPRA, Number(INICIO_CAMPANHA.slice(8, 10))))) + ' 00:00:00';
const EH_C6 = "EXISTS (SELECT 1 FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id = " + WL_C6 + ")";
const EH_IGA = "EXISTS (SELECT 1 FROM advertisement_negotiations ani" +
  " INNER JOIN advertisements ai ON ai.id = ani.advertisement_id" +
  " WHERE ani.event_id = e.id AND ani.deleted_at IS NULL AND ai.shop_id IN (" + VENDEDORES_IGA.join(',') + "))";
const EVENTO =
  " e.deleted_at IS NULL AND e.start_date_offer < '" + MES_FIM + "' AND e.finish_date_event >= '" + MES_INI + "'" +
  " AND DATEDIFF(e.finish_date_event, e.start_date_offer) <= " + DURACAO_MAX_DIAS +
  " AND e.name LIKE '%" + NOME_EVENTO + "%'" +
  " AND " + EH_IGA + " AND NOT " + EH_C6;
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
const DATA = (col) =>"DATE_FORMAT(" + col + ", '%Y-%m-%d %H:%i')";
const EXTERNO = "uc.deleted_at IS NULL AND uc.email NOT LIKE '%@cars2you.com.br' AND uc.email NOT LIKE '%@itau%'" +
  " AND uc.email NOT LIKE '%@c6bank%' AND uc.email NOT LIKE '%teste%'";
const VOLTA = "SELECT alv.shop_id, MIN(alv.created_at) AS volta FROM access_logs alv" +
  " WHERE alv.created_at >= '" + INICIO_CAMPANHA + "' AND alv.shop_id IS NOT NULL GROUP BY alv.shop_id";
const COMPRAS = "SELECT DISTINCT oc.buyer_shop_id AS shop_id FROM offers oc" +
  " INNER JOIN advertisement_negotiations anc ON anc.offer_actual_id = oc.id AND anc.deleted_at IS NULL AND anc.status IN (2, 3, 7)" +
  " WHERE oc.deleted_at IS NULL AND oc.buyer_shop_id IS NOT NULL" +
  " AND oc.created_at >= '" + SEM_COMPRA_DESDE + "' AND oc.created_at < '" + INICIO_CAMPANHA + "'";
const CLIENTES = "SELECT cs.id, DATE_FORMAT(IF(cs.created_at >= '" + INICIO_CAMPANHA + "', cs.created_at, va.volta), '%Y-%m-%d %H:%i') AS entrada" +
  " FROM (SELECT DISTINCT usc.shop_id FROM user_clients_group ucg" +
  " INNER JOIN users uc ON uc.id = ucg.user_id AND " + EXTERNO +
  " INNER JOIN user_shops usc ON usc.user_id = uc.id" +
  " WHERE ucg.client_group_id IN (" + GRUPOS_IGA.join(', ') + ")) cg" +
  " INNER JOIN shops cs ON cs.id = cg.shop_id AND cs.deleted_at IS NULL AND cs.name NOT LIKE '%teste%'" +
  " LEFT JOIN (" + VOLTA + ") va ON va.shop_id = cs.id" +
  " LEFT JOIN (" + COMPRAS + ") cp ON cp.shop_id = cs.id" +
  " WHERE cs.created_at >= '" + INICIO_CAMPANHA + "' OR (va.volta IS NOT NULL AND cp.shop_id IS NULL)";
const ANO_RECORTE = MES_INI.slice(0, 4);
const CAMPANHA_ANO = CAMPANHA_FORM + ' ' + ANO_RECORTE + ' iga';
const CADASTRO_CAMPANHA_ANO = (loja) => "(SELECT MIN(upa.created_at) FROM user_shops usa" +
  " INNER JOIN user_profiles upa ON upa.user_id = usa.user_id AND upa.deleted_at IS NULL" +
  " AND upa.register_form_value LIKE '%" + CAMPANHA_ANO + "%'" +
  " WHERE usa.shop_id = " + loja + ")";
const UF_CASE = "CASE WHEN UPPER(TRIM(sa.state)) IN ('SP','MG','PR','SC','RJ','GO','RS','BA','MT','DF','CE','MS','ES','PE','PA','SE','AM','MA','RN','PB','AL','PI','RO','TO','AP','AC','RR')" +
  " THEN UPPER(TRIM(sa.state)) WHEN UPPER(TRIM(sa.state)) = 'S.P' THEN 'SP'" +
  " WHEN UPPER(TRIM(sa.state)) = 'RIO DE JANEIRO' THEN 'RJ' WHEN UPPER(TRIM(sa.state)) = 'MATO GROSSO DO SUL' THEN 'MS'" +
  " WHEN UPPER(TRIM(sa.state)) LIKE 'ESPIRITO%SANTO%' THEN 'ES' ELSE NULL END";
const UF_DA_LOJA = (loja) => "(SELECT MIN(" + UF_CASE + ") FROM shop_addresses sa" +
  " WHERE sa.shop_id = " + loja + " AND sa.deleted_at IS NULL)";
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
    de: " FROM (SELECT u0.id, MAX(u0.fen) AS fen FROM (SELECT o.buyer_shop_id AS id, NULL AS fen" + OFERTAS_DO_RECORTE +
        " AND o.buyer_shop_id IS NOT NULL" +
        " UNION SELECT al.shop_id AS id, NULL AS fen" + ACESSOS_DO_EVENTO +
        " UNION SELECT us4.shop_id AS id, NULL AS fen FROM user_shops us4" +
        " INNER JOIN user_profiles up4 ON up4.user_id = us4.user_id AND up4.deleted_at IS NULL" +
        " AND up4.register_form_value LIKE '%" + CAMPANHA_ANO + "%'" +
        " UNION SELECT f.id, f.entrada AS fen FROM (" + CLIENTES + ") f) u0 GROUP BY u0.id) ids" +
        " INNER JOIN shops s ON s.id = ids.id",
    cols: [
      ['id', 's.id'],
      ['nome', 's.name'],
      ['wl', 's.whitelabel_id'],
      ['situacao', 's.situation'],
      ['cadastro', DATA('s.created_at')],
      ['apagada', 's.deleted_at IS NOT NULL'],
      ['fenauto', 'ids.fen'],
      ['uf', UF_DA_LOJA('s.id')],
      ['fenauto_ano', "DATE_FORMAT(" + CADASTRO_CAMPANHA_ANO('s.id') + ", '%Y-%m-%d %H:%i')"]
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
        mes: [MES_INI, MES_FIM], agora_br: AGORA_BR, partes_acesso: PARTES_ACESSO,
        wl_c6: WL_C6, vendedores_iga: VENDEDORES_IGA, nome_evento: NOME_EVENTO,
        campanha_ano: CAMPANHA_ANO,
        inicio_campanha: INICIO_CAMPANHA, sem_compra_desde: SEM_COMPRA_DESDE, meses_sem_compra: MESES_SEM_COMPRA,
        grupos_iga: GRUPOS_IGA, grupo_iga_nome: GRUPO_IGA_NOME
      }
    }
  };
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
    position: [448, 0],
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
    position: [672, 0],
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
  ' animation:none !important }}:root,[data-tema="claro"]{color-scheme: light;',
  '--marca-azul:       #000D3C;--marca-azul-claro: #001FBD;--fundo:          #DDE1EE;',
  '--fundo-veu:      radial-gradient(420px 300px at 0% -14%,rgba(255,255,255,.72), transparent 70%),radial-gradient(1200px 900px at 100% 100%,rgba(120,134,190,.42), transparent 66%);',
  '--superficie:     #FAFBFE;--superficie-2:   #EDEFF7;--borda:          #E3E6F0;',
  '--borda-forte:    #C9CFE2;--texto:          #000D3C;--texto-2:        #3B4672;',
  '--texto-3:        #5A6488;--acento:         #000D3C;--acento-cheio:   #001FBD;',
  '--acento-veu:     rgba(0,13,60,.07);--serie-2:        #C94E00;--positivo:       #0C6E4B;',
  '--negativo:       #7F1112;--atencao:        #6F4047;--grade:          rgba(0,13,60,.07);',
  '--sombra:         0 1px 1px  rgba(0,13,60,.03),0 6px 16px rgba(0,13,60,.05),0 18px 44px rgba(0,13,60,.07),inset 0 1px 0 rgba(255,255,255,.85);',
  '--cartao-borda:   1px solid rgba(255,255,255,.72);',
  '--cartao-fundo:   linear-gradient(155deg, rgba(255,255,255,.82) 0%,rgba(255,255,255,.95) 58%);',
  '--cartao-blur:    blur(18px) saturate(110%);',
  '--brilho:         radial-gradient(420px 260px at 0% 0%,rgba(0,31,189,.10), transparent 72%);}',
  '[data-tema="escuro"]{color-scheme: dark;--marca-azul:       #FF6200;--marca-azul-claro: #7C93FF;',
  '--fundo:          #0B1020;',
  '--fundo-veu:      radial-gradient(900px 500px at 8% -8%,rgba(0,31,189,.28), transparent 62%),radial-gradient(800px 500px at 96% 4%,rgba(255,98,0,.10), transparent 60%);',
  '--superficie:     #12182B;--superficie-2:   #192038;--borda:          rgba(255,255,255,.09);',
  '--borda-forte:    rgba(255,255,255,.16);--texto:          #EEF0F8;--texto-2:        #A9B0CC;',
  '--texto-3:        #7783AB;--acento:         #FF6200;--acento-cheio:   #7C93FF;',
  '--acento-veu:     rgba(124,147,255,.16);--serie-2:        #FF6200;--positivo:       #35C08A;',
  '--negativo:       #EF5B60;--atencao:        #C98A92;--grade:          rgba(255,255,255,.07);',
  '--sombra:         0 1px 1px rgba(0,0,0,.4), 0 16px 40px rgba(0,0,0,.45);',
  '--cartao-borda:   1px solid rgba(255,255,255,.08);',
  '--cartao-fundo:   linear-gradient(158deg, rgba(255,255,255,.075),rgba(255,255,255,.025));',
  '--cartao-blur:    blur(16px) saturate(120%);',
  '--brilho:         radial-gradient(420px 180px at 0% 0%,rgba(124,147,255,.14), transparent 70%);}'
].join('');
const LOGO_IGA = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 107 48" fill="none" role="img" aria-label="IGA"><title>IGA</title><path d="M17.12 48C14.97 48 13.1 47.56 11.48 46.68C9.87 45.81 8.62 44.58 7.74 43C6.85 41.42 6.4 39.57 6.4 37.47C6.4 35.27 6.87 33.35 7.8 31.72C8.73 30.09 10.03 28.82 11.71 27.91C13.4 27 15.35 26.55 17.57 26.55C18.59 26.55 19.56 26.67 20.48 26.9C21.4 27.14 22.2 27.46 22.87 27.86V32.15C22.21 31.68 21.45 31.32 20.56 31.06C19.67 30.81 18.78 30.68 17.88 30.68C15.8 30.68 14.17 31.26 13 32.42C11.82 33.59 11.24 35.2 11.24 37.26C11.24 39.38 11.79 41.03 12.91 42.2C14.02 43.37 15.59 43.96 17.63 43.96C18.19 43.96 18.72 43.9 19.26 43.78V39.92H15.43V36.03H23.69V46.75C21.86 47.58 19.67 48 17.12 48Z" class="iga-t"/><path d="M0 47.49V26.89H4.74V47.49H0V47.49Z" class="iga-t"/><path d="M29.97 47.49H25.1C26.01 43.97 27.08 40.49 28.32 37.05C29.56 33.62 30.95 30.23 32.47 26.89H37.83C39.34 30.11 40.69 33.4 41.89 36.76C43.09 40.13 44.19 43.7 45.21 47.49H40.22C40.03 46.71 39.86 45.98 39.69 45.28C39.53 44.57 39.36 43.9 39.2 43.25H30.99C30.62 44.65 30.28 46.06 29.97 47.49ZM32.04 39.62H38.18C37.78 38.35 37.34 37.04 36.84 35.66C36.35 34.29 35.76 32.74 35.08 31.01C34.5 32.47 33.96 33.92 33.45 35.36C32.94 36.79 32.48 38.21 32.04 39.62Z" class="iga-t"/><path d="M54.45 20.83H52.27V11.43H54.45V20.83Z" class="iga-t"/><path d="M58.8 20.97C57.07 20.97 56.21 20.09 56.21 18.34V15.18H55.09V13.56H56.21V11.67H58.32V13.56H59.85V15.18H58.32V18.14C58.32 18.9 58.63 19.28 59.24 19.28C59.54 19.28 59.8 19.22 60.02 19.1V20.73C59.85 20.8 59.66 20.85 59.44 20.9C59.22 20.94 59.01 20.97 58.8 20.97Z" class="iga-t"/><path d="M62.93 21.01C62.21 21.01 61.64 20.82 61.2 20.43C60.77 20.05 60.55 19.53 60.55 18.88C60.55 18.05 60.87 17.41 61.51 16.95C62.15 16.49 63.05 16.26 64.22 16.26C64.33 16.26 64.43 16.26 64.53 16.27C64.63 16.27 64.73 16.28 64.84 16.29C64.74 15.47 64.22 15.07 63.26 15.07C62.5 15.07 61.82 15.28 61.2 15.72V14.06C61.83 13.61 62.64 13.38 63.61 13.38C64.65 13.38 65.45 13.65 66 14.2C66.56 14.75 66.84 15.53 66.84 16.55V20.83H65.11L65 20.06C64.79 20.36 64.5 20.59 64.13 20.76C63.76 20.92 63.36 21.01 62.93 21.01ZM64.85 17.6C64.71 17.59 64.53 17.58 64.32 17.58C63.75 17.58 63.32 17.67 63 17.86C62.69 18.04 62.54 18.29 62.54 18.63C62.54 18.92 62.63 19.14 62.82 19.31C63 19.48 63.25 19.56 63.56 19.56C63.92 19.56 64.22 19.43 64.47 19.17C64.72 18.91 64.85 18.59 64.85 18.21V17.6H64.85Z" class="iga-t"/><path d="M70.23 21.01C69.49 21.01 68.9 20.75 68.45 20.23C68.01 19.71 67.79 19.03 67.79 18.18V13.56H69.9V17.83C69.9 18.3 70 18.66 70.19 18.91C70.38 19.16 70.65 19.28 71 19.28C71.35 19.28 71.63 19.15 71.84 18.9C72.05 18.64 72.16 18.29 72.16 17.85V13.56H74.27V20.83H72.42L72.31 20.03C71.82 20.68 71.12 21.01 70.23 21.01ZM73.73 10.46L71.78 12.67H69.94L71.46 10.46H73.73Z" class="iga-t"/><path d="M56.76 34.3C55.79 34.3 54.94 34.1 54.2 33.71C53.47 33.31 52.9 32.75 52.5 32.03C52.1 31.31 51.89 30.47 51.89 29.52C51.89 28.51 52.1 27.64 52.53 26.9C52.95 26.16 53.54 25.58 54.31 25.17C55.08 24.75 55.96 24.55 56.97 24.55C57.44 24.55 57.88 24.6 58.3 24.71C58.71 24.81 59.08 24.96 59.38 25.15V27.09C59.08 26.88 58.74 26.72 58.33 26.6C57.93 26.48 57.52 26.43 57.11 26.43C56.17 26.43 55.43 26.69 54.89 27.22C54.36 27.75 54.09 28.48 54.09 29.42C54.09 30.38 54.35 31.13 54.85 31.66C55.36 32.2 56.07 32.46 57 32.46C57.25 32.46 57.5 32.44 57.74 32.38V30.63H56V28.86H59.76V33.73C58.92 34.11 57.92 34.3 56.76 34.3Z" class="iga-t"/><path d="M64.5 34.3C63.31 34.3 62.38 33.97 61.72 33.29C61.05 32.61 60.71 31.67 60.71 30.48C60.71 29.72 60.86 29.05 61.15 28.49C61.43 27.92 61.84 27.48 62.36 27.16C62.88 26.84 63.48 26.68 64.17 26.68C65.14 26.68 65.91 27 66.46 27.64C67.02 28.28 67.3 29.16 67.3 30.28V31.19H62.76C62.98 32.17 63.66 32.66 64.79 32.66C65.15 32.66 65.52 32.61 65.88 32.52C66.24 32.42 66.56 32.28 66.84 32.11V33.73C66.57 33.91 66.23 34.05 65.81 34.15C65.4 34.25 64.96 34.3 64.5 34.3ZM62.73 29.78H65.35C65.33 29.29 65.21 28.91 64.99 28.65C64.77 28.38 64.46 28.25 64.07 28.25C63.31 28.25 62.86 28.76 62.73 29.78Z" class="iga-t"/><path d="M70.48 34.3C70.04 34.3 69.61 34.26 69.19 34.16C68.77 34.07 68.41 33.94 68.09 33.76V32.11C68.41 32.3 68.75 32.45 69.13 32.55C69.5 32.65 69.88 32.71 70.26 32.71C71 32.71 71.38 32.48 71.38 32.02C71.38 31.84 71.28 31.68 71.09 31.56C70.9 31.44 70.53 31.31 69.99 31.16C68.71 30.8 68.06 30.07 68.06 28.96C68.06 28.28 68.34 27.72 68.91 27.31C69.47 26.89 70.22 26.68 71.15 26.68C71.5 26.68 71.84 26.72 72.18 26.79C72.52 26.87 72.8 26.97 73.03 27.1V28.73C72.47 28.43 71.86 28.28 71.21 28.28C70.5 28.28 70.14 28.49 70.14 28.91C70.14 29.08 70.23 29.23 70.4 29.34C70.58 29.45 70.93 29.58 71.46 29.73C72.18 29.92 72.69 30.2 73.02 30.57C73.34 30.94 73.51 31.41 73.51 32C73.51 32.7 73.24 33.26 72.7 33.68C72.16 34.1 71.42 34.3 70.48 34.3Z" class="iga-t"/><path d="M77.39 34.26C75.66 34.26 74.8 33.39 74.8 31.63V28.47H73.68V26.86H74.8V24.97H76.91V26.86H78.44V28.47H76.91V31.44C76.91 32.2 77.22 32.58 77.83 32.58C78.13 32.58 78.39 32.52 78.61 32.4V34.03C78.44 34.09 78.25 34.15 78.03 34.19C77.82 34.24 77.6 34.26 77.39 34.26Z" class="iga-t"/><path d="M81.52 34.3C80.8 34.3 80.23 34.11 79.79 33.73C79.36 33.34 79.14 32.82 79.14 32.17C79.14 31.35 79.46 30.71 80.1 30.25C80.74 29.79 81.64 29.56 82.81 29.56C82.92 29.56 83.02 29.56 83.12 29.56C83.22 29.57 83.32 29.58 83.43 29.59C83.33 28.77 82.81 28.36 81.85 28.36C81.09 28.36 80.41 28.58 79.8 29.01V27.36C80.43 26.9 81.23 26.68 82.2 26.68C83.24 26.68 84.04 26.95 84.6 27.5C85.15 28.05 85.43 28.83 85.43 29.85V34.12H83.71L83.59 33.36C83.38 33.65 83.09 33.88 82.72 34.05C82.36 34.22 81.96 34.3 81.52 34.3ZM83.54 25.98C83.25 25.98 83 25.92 82.78 25.79C82.56 25.67 82.36 25.54 82.19 25.42C82.01 25.29 81.85 25.23 81.7 25.23C81.44 25.23 81.31 25.43 81.31 25.84V25.95H80.02V25.84C80.02 25.19 80.15 24.7 80.41 24.36C80.67 24.02 81.04 23.85 81.53 23.85C81.82 23.85 82.08 23.91 82.3 24.04C82.52 24.17 82.72 24.29 82.89 24.42C83.06 24.54 83.22 24.6 83.37 24.6C83.63 24.6 83.76 24.4 83.76 23.99V23.88H85.06V23.99C85.06 24.64 84.93 25.13 84.66 25.47C84.4 25.81 84.03 25.98 83.54 25.98ZM83.44 30.9C83.3 30.89 83.12 30.88 82.91 30.88C82.35 30.88 81.91 30.97 81.6 31.15C81.29 31.33 81.13 31.59 81.13 31.93C81.13 32.21 81.22 32.44 81.41 32.61C81.6 32.77 81.84 32.86 82.15 32.86C82.51 32.86 82.82 32.73 83.07 32.47C83.32 32.21 83.44 31.89 83.44 31.51V30.9H83.44Z" class="iga-t"/><path d="M89.77 34.3C89.06 34.3 88.44 34.15 87.91 33.84C87.38 33.53 86.97 33.09 86.68 32.52C86.38 31.94 86.24 31.28 86.24 30.51C86.24 29.74 86.38 29.06 86.68 28.49C86.97 27.91 87.38 27.47 87.91 27.15C88.45 26.84 89.07 26.68 89.77 26.68C90.49 26.68 91.11 26.83 91.64 27.15C92.17 27.46 92.58 27.9 92.87 28.47C93.16 29.04 93.31 29.71 93.31 30.48C93.31 31.25 93.16 31.92 92.87 32.5C92.58 33.07 92.17 33.52 91.64 33.83C91.11 34.15 90.49 34.3 89.77 34.3ZM89.77 32.59C90.21 32.59 90.55 32.41 90.79 32.04C91.04 31.68 91.16 31.16 91.16 30.51C91.16 29.84 91.04 29.32 90.79 28.95C90.55 28.57 90.21 28.39 89.77 28.39C89.34 28.39 88.99 28.57 88.75 28.94C88.5 29.31 88.38 29.82 88.38 30.48C88.38 31.14 88.5 31.66 88.75 32.04C88.99 32.41 89.34 32.59 89.77 32.59Z" class="iga-t"/><path d="M54.83 47.6C54.23 47.6 53.71 47.45 53.26 47.14C52.81 46.84 52.47 46.4 52.22 45.83C51.97 45.27 51.85 44.59 51.85 43.82C51.85 43.03 51.98 42.35 52.23 41.78C52.48 41.21 52.83 40.76 53.28 40.45C53.74 40.13 54.26 39.98 54.86 39.98C55.63 39.98 56.26 40.25 56.72 40.8V37.4H58.84V47.42H56.99L56.87 46.54C56.67 46.88 56.39 47.14 56.03 47.32C55.68 47.51 55.27 47.6 54.83 47.6ZM55.39 45.89C55.82 45.89 56.16 45.7 56.41 45.34C56.65 44.97 56.78 44.46 56.78 43.8C56.78 43.13 56.65 42.61 56.41 42.24C56.16 41.87 55.82 41.69 55.39 41.69C54.95 41.69 54.61 41.87 54.36 42.23C54.12 42.6 53.99 43.11 53.99 43.77C53.99 44.44 54.12 44.96 54.36 45.33C54.61 45.7 54.95 45.89 55.39 45.89Z" class="iga-t"/><path d="M63.47 47.6C62.28 47.6 61.36 47.26 60.69 46.59C60.02 45.91 59.69 44.97 59.69 43.78C59.69 43.02 59.83 42.35 60.12 41.78C60.4 41.22 60.81 40.78 61.33 40.46C61.85 40.14 62.45 39.98 63.14 39.98C64.11 39.98 64.88 40.3 65.43 40.94C65.99 41.58 66.27 42.46 66.27 43.58V44.48H61.73C61.95 45.47 62.63 45.96 63.76 45.96C64.12 45.96 64.49 45.91 64.85 45.81C65.21 45.72 65.53 45.58 65.81 45.4V47.03C65.54 47.21 65.2 47.35 64.79 47.45C64.37 47.55 63.94 47.6 63.47 47.6ZM61.7 43.08H64.32C64.3 42.59 64.18 42.21 63.96 41.94C63.74 41.68 63.43 41.55 63.04 41.55C62.28 41.55 61.83 42.06 61.7 43.08Z" class="iga-t"/><path d="M70.9 47.42H68.72C69.13 45.82 69.61 44.23 70.17 42.66C70.72 41.09 71.34 39.55 72.03 38.03H74.44C75.12 39.49 75.72 40.99 76.26 42.53C76.8 44.06 77.3 45.69 77.75 47.42H75.51C75.43 47.07 75.35 46.73 75.27 46.41C75.2 46.09 75.13 45.78 75.05 45.48H71.36C71.19 46.13 71.04 46.77 70.9 47.42ZM71.83 43.83H74.59C74.41 43.25 74.21 42.65 73.99 42.03C73.77 41.4 73.5 40.69 73.2 39.9C72.94 40.57 72.69 41.23 72.47 41.89C72.24 42.54 72.03 43.19 71.83 43.83Z" class="iga-t"/><path d="M81.02 47.56C79.29 47.56 78.43 46.68 78.43 44.93V41.77H77.32V40.15H78.43V38.26H80.55V40.15H82.08V41.77H80.55V44.73C80.55 45.49 80.85 45.87 81.46 45.87C81.76 45.87 82.02 45.81 82.24 45.69V47.32C82.08 47.39 81.88 47.44 81.66 47.49C81.45 47.54 81.23 47.56 81.02 47.56Z" class="iga-t"/><path d="M84.15 39.31C83.81 39.31 83.52 39.19 83.28 38.97C83.04 38.74 82.92 38.45 82.92 38.11C82.92 37.77 83.04 37.48 83.28 37.25C83.52 37.03 83.81 36.91 84.15 36.91C84.5 36.91 84.79 37.03 85.03 37.25C85.26 37.48 85.37 37.77 85.37 38.11C85.37 38.45 85.26 38.74 85.03 38.97C84.79 39.19 84.5 39.31 84.15 39.31ZM83.09 47.42V40.16H85.21V47.42H83.09Z" class="iga-t"/><path d="M90.51 47.42H88.45C87.86 46.2 87.34 44.99 86.91 43.78C86.47 42.57 86.11 41.36 85.82 40.16H88.1C88.25 41.03 88.44 41.9 88.65 42.78C88.87 43.66 89.15 44.54 89.49 45.43C89.83 44.54 90.11 43.66 90.33 42.78C90.55 41.9 90.74 41.03 90.89 40.16H93.14C92.87 41.34 92.52 42.53 92.08 43.74C91.65 44.95 91.12 46.18 90.51 47.42Z" class="iga-t"/><path d="M96.63 47.6C95.92 47.6 95.3 47.45 94.77 47.14C94.24 46.83 93.83 46.38 93.54 45.81C93.24 45.24 93.1 44.57 93.1 43.8C93.1 43.03 93.24 42.36 93.54 41.78C93.83 41.21 94.24 40.76 94.77 40.45C95.31 40.13 95.93 39.98 96.63 39.98C97.35 39.98 97.97 40.13 98.5 40.44C99.03 40.75 99.44 41.19 99.73 41.77C100.02 42.34 100.17 43.01 100.17 43.78C100.17 44.55 100.02 45.22 99.73 45.79C99.44 46.37 99.03 46.81 98.5 47.13C97.97 47.44 97.35 47.6 96.63 47.6ZM96.63 45.89C97.07 45.89 97.41 45.7 97.65 45.34C97.9 44.97 98.02 44.46 98.02 43.8C98.02 43.13 97.9 42.61 97.65 42.24C97.41 41.87 97.07 41.69 96.63 41.69C96.2 41.69 95.85 41.87 95.61 42.23C95.36 42.6 95.24 43.11 95.24 43.77C95.24 44.44 95.36 44.96 95.61 45.33C95.86 45.7 96.2 45.89 96.63 45.89Z" class="iga-t"/><path d="M103.13 47.6C102.69 47.6 102.25 47.55 101.84 47.46C101.42 47.37 101.05 47.23 100.74 47.06V45.4C101.05 45.6 101.4 45.74 101.78 45.85C102.15 45.95 102.53 46 102.91 46C103.65 46 104.02 45.77 104.02 45.32C104.02 45.13 103.93 44.98 103.74 44.86C103.55 44.74 103.18 44.61 102.63 44.46C101.35 44.1 100.71 43.36 100.71 42.26C100.71 41.57 100.99 41.02 101.55 40.6C102.11 40.19 102.86 39.98 103.8 39.98C104.14 39.98 104.48 40.01 104.82 40.09C105.16 40.16 105.45 40.26 105.68 40.39V42.02C105.11 41.73 104.5 41.58 103.86 41.58C103.14 41.58 102.78 41.79 102.78 42.2C102.78 42.38 102.87 42.52 103.05 42.63C103.22 42.75 103.58 42.88 104.11 43.03C104.82 43.22 105.34 43.5 105.67 43.87C105.99 44.23 106.15 44.71 106.15 45.29C106.15 46 105.88 46.56 105.34 46.98C104.81 47.39 104.07 47.6 103.13 47.6Z" class="iga-t"/><path d="M43.95 2.74C43.73 1.7 43.12 1 41.95 0.74C40.03 0.26 37.2 0 34.1 0C31.01 0 28.18 0.26 26.26 0.74C25.09 1 24.48 1.7 24.26 2.74C23.82 4.57 23.52 7.49 23.52 10.58C23.52 13.68 23.82 16.6 24.26 18.43C24.48 19.47 25.09 20.17 26.26 20.43C28.18 20.91 31.01 21.17 34.1 21.17C37.2 21.17 40.03 20.91 41.95 20.43C43.12 20.17 43.73 19.47 43.95 18.43C44.38 16.6 44.69 13.68 44.69 10.58C44.69 7.49 44.38 4.57 43.95 2.74Z" class="iga-t"/><path d="M19.1 2.74C18.88 1.7 18.27 1 17.1 0.74C15.18 0.26 12.35 0 9.25 0C9.25 4.51 9.25 16.69 9.25 21.17C12.35 21.17 15.18 20.91 17.1 20.43C18.27 20.17 18.88 19.47 19.1 18.43C19.53 16.6 19.84 13.68 19.84 10.59C19.84 7.49 19.53 4.57 19.1 2.74Z" fill="#FF6200"/><path d="M4.84 2.74C4.62 1.7 4.01 1 2.83 0.74C2.03 0.54 1.07 0.38 0 0.26V20.91C1.07 20.79 2.03 20.63 2.83 20.43C4.01 20.17 4.62 19.47 4.84 18.43C5.27 16.6 5.58 13.68 5.58 10.58C5.58 7.49 5.27 4.57 4.84 2.74Z" class="iga-a"/></svg>';
const LOGO_FEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 8.1 1076 298.3" role="img" aria-label="FENAUTO com Cars2You"><title>FENAUTO com Cars2You</title><path fill="#242424" fill-rule="evenodd" d="M666.5,192.9C665.4,192.6 662.3,192.2 660.2,192C658.9,191.9 657.1,191.6 656.3,191.4C655.4,191.2 654.1,190.9 653.4,190.8C652.7,190.7 651.8,190.4 651.4,190.3C651,190.2 649.6,189.7 648.3,189.3C641.5,187.1 637.2,185.1 631.4,181.3C624.1,176.6 617.7,170.4 612.3,162.9C610.5,160.3 609,158 607.5,155.4C606.9,154.2 605,150 605,149.7C605,149.6 604.8,149 604.5,148.4C603.6,146.3 602.3,142.7 602,140.9C601.8,140.2 601.5,139.3 601.4,139C601.2,138.6 601,137.9 601,137.4C601,136.9 600.8,135.8 600.5,135.1C600.2,134.3 599.8,132 599.5,130C599,126.4 599,125.9 599.1,68.8L599.1,11.1L627.5,11.1L655.9,11.1L656,68.6L656.1,126.1L656.7,127.6C657.4,129.8 657.9,130.7 659.4,132.5C663.7,137.9 670.8,139.5 676.9,136.4C678.1,135.8 681,133.7 681.4,133.1C683.1,130.7 683.6,129.7 684.3,127.6L684.9,126.1L685,68.6L685.1,11.1L713.5,11.1L741.9,11.1L741.9,70.5C742,121.3 742,129.8 741.6,130.3C741.5,130.6 741.2,131.7 741.1,132.6C741,134.6 740.1,138 739.6,139.1C739.4,139.5 739.2,140.3 739.1,141C739,141.6 738.7,142.5 738.5,143.1C738.2,143.6 738,144.2 738,144.5C738,144.8 737.8,145.5 737.5,146C737.2,146.5 737,147.2 737,147.4C737,147.6 736.8,148.2 736.5,148.7C735.8,150.2 735,151.8 734.9,152.5C734.7,152.9 732.6,156.8 731.7,158.3C731.6,158.5 731.3,159 731.1,159.4C730.4,160.7 728,164 726.1,166.4C720,174.1 711.6,180.8 702.8,185.3C701.2,186 699.6,186.8 699.3,186.9C698.9,187 698.2,187.3 697.8,187.5C697.3,187.8 696.7,188 696.5,188C696.2,188 696,188.1 695.9,188.2C695.8,188.4 694,189 689,190.5C688.1,190.8 687,191 686.5,191C686,191 684.9,191.2 684.1,191.5C683.3,191.7 681.5,192 680.2,192.1C678.9,192.2 677.5,192.4 677,192.5C676.2,192.8 667.3,193.1 666.5,192.9ZM976.4,192.8C973.2,192.2 971.5,192 970.1,192C969.3,192 968.1,191.8 967.5,191.6C966.9,191.4 965.6,191.2 964.6,191.1C963.7,191 962.6,190.8 962.3,190.6C961.9,190.4 961.1,190.2 960.4,190.1C959.3,190 957.6,189.5 955.1,188.7C954.7,188.6 953.9,188.3 953.4,188.2C952.8,188.1 951.9,187.7 951.4,187.5C950.8,187.2 950.1,187 949.9,187C949.6,187 949,186.8 948.6,186.5C948.2,186.2 947.7,186 947.4,186C947.2,186 946.6,185.8 946,185.5C945.5,185.3 944.6,184.8 944,184.6C940.6,183 937.4,181.4 934.8,179.8C934.3,179.5 933.6,179.2 933.4,179C933.1,178.9 932.7,178.6 932.5,178.4C932.3,178.2 932.1,178 932,178C931.9,178 931.3,177.7 930.7,177.2C930.1,176.8 929.1,176.1 928.4,175.6C927.7,175.2 926.8,174.6 926.5,174.3C925.6,173.7 922.2,171 921.9,170.6C921.7,170.5 920.9,169.8 920,169C916.6,166.1 908,156.9 908,156.1C908,156.1 907.3,155.1 906.5,154.1C905.7,153.1 905,152.1 905,152C905,151.8 904.8,151.4 904.4,151C903.5,149.8 899.8,143.6 898.6,141.1C898.3,140.3 897.8,139.5 897.7,139.3C897.6,139 897.4,138.6 897.2,138.3C897.1,137.9 896.8,137.2 896.5,136.6C895.7,134.9 895,133.1 895,132.7C895,132.5 894.8,131.9 894.5,131.4C894.2,130.8 894,130.2 894,129.9C894,129.7 893.8,129.1 893.5,128.6C893.2,128.1 893,127.4 893,127C893,126.7 892.8,126.2 892.6,125.8C892.4,125.3 892.1,124.4 892,123.6C891.9,122.8 891.6,121.7 891.4,121.1C891.2,120.6 891,119.7 891,119.2C891,118.7 890.8,117.8 890.6,117.2C890.4,116.6 890.2,115.2 890.1,114.1C890,113 889.8,111.3 889.5,110.3C889.2,108.7 889.1,107 889.1,100.4C889.1,94.7 889.2,92.1 889.5,91.4C889.6,90.8 889.9,89.1 890,87.6C890.1,86.1 890.4,84.4 890.6,83.9C890.8,83.3 891,82.2 891.1,81.3C891.2,80.4 891.4,79.4 891.6,79.2C891.8,78.9 892,78.1 892.1,77.4C892.2,76.7 892.6,75.1 893,73.9C893.4,72.6 893.9,71.2 894,70.7C894.1,70.2 894.4,69.5 894.6,69.2C894.8,68.9 895,68.2 895.1,67.8C895.2,67.3 895.4,66.8 895.5,66.6C895.6,66.5 896,65.5 896.5,64.3C896.9,63.2 897.4,62.2 897.6,62C897.8,61.8 898,61.5 898,61.3C898,61 899.9,57.2 901.1,55.2C903.1,51.7 904.3,49.9 906.6,46.7C908.6,43.8 913.5,38.1 916.3,35.4C920.1,31.6 925.8,27 930.1,24.1C931.8,23 933.3,22 933.5,21.9C933.7,21.8 934.3,21.4 934.9,21.1C935.4,20.8 936.3,20.3 936.9,20C937.4,19.7 938.3,19.2 938.9,18.9C939.4,18.6 940,18.2 940.3,18.1C940.5,18 941.5,17.5 942.6,17C943.7,16.4 944.7,16 944.9,16C945.1,16 945.7,15.8 946.2,15.5C948.2,14.4 949.3,14 949.8,14C950.1,14 950.6,13.8 951,13.6C951.9,13.1 955.3,12 956,12C956.3,12 957.1,11.8 957.7,11.5C958.4,11.3 959.4,11 960.1,10.9C960.8,10.8 961.7,10.6 962.1,10.4C962.5,10.2 963.3,10 963.9,10C964.5,10 965.7,9.8 966.8,9.5C967.8,9.3 969.7,9 971.1,8.9C972.4,8.8 974.8,8.6 976.3,8.3C979.7,7.9 987.1,8 991,8.6C992.3,8.8 994.1,9 994.9,9C995.8,9 996.9,9.2 997.5,9.4C998.1,9.6 999.3,9.8 1000.2,9.9C1001.1,10 1002.5,10.3 1003.3,10.5C1004.1,10.8 1005,11 1005.4,11C1005.7,11 1006.5,11.2 1007.3,11.5C1008,11.8 1008.8,12 1009.1,12C1009.5,12 1010.2,12.2 1010.8,12.5C1011.3,12.8 1012,13 1012.3,13C1012.5,13 1013.2,13.2 1013.8,13.5C1014.3,13.8 1014.9,14 1015.2,14C1015.4,14 1016,14.2 1016.4,14.5C1016.8,14.8 1017.3,15 1017.6,15C1017.8,15 1018.4,15.2 1018.9,15.5C1019.5,15.8 1020,16 1020.2,16C1020.4,16 1020.8,16.2 1021.2,16.5C1021.5,16.8 1022,17 1022.2,17C1022.4,17 1022.9,17.2 1023.5,17.5C1024,17.8 1024.5,18 1024.8,18.1C1025,18.2 1025.6,18.5 1026.1,18.9C1026.7,19.2 1028,19.9 1029,20.4C1030,20.9 1030.9,21.5 1031,21.7C1031.2,21.9 1031.4,22 1031.5,22C1032.2,22 1041.3,28.6 1044.6,31.6C1047.2,33.8 1053.4,40.1 1054.1,41.2C1054.4,41.6 1055.2,42.6 1055.9,43.5C1057.8,45.8 1061.3,50.6 1061.8,51.8C1062,52.1 1062.5,53 1063,53.8C1063.5,54.5 1064,55.4 1064.2,55.6C1064.8,56.6 1067,61.1 1067,61.3C1067,61.5 1067.2,61.8 1067.5,62.2C1067.8,62.5 1068,63 1068,63.2C1068,63.4 1068.2,64 1068.5,64.6C1069.7,67.4 1070,68 1070,68.3C1070,68.5 1070.2,69.1 1070.5,69.6C1070.8,70.2 1071,70.8 1071,71.1C1071,71.3 1071.2,71.9 1071.5,72.4C1071.8,73 1072,73.7 1072,74.1C1072,74.5 1072.2,75.3 1072.5,75.9C1072.8,76.4 1073,77.2 1073,77.7C1073,78.1 1073.2,79 1073.5,79.8C1073.8,80.5 1074,81.5 1074,82.1C1074,82.7 1074.2,83.7 1074.4,84.3C1074.6,84.9 1074.9,86.8 1075,88.6C1075.2,91.9 1075.4,92.8 1075.8,92.8C1075.9,92.8 1076,96.3 1076,100.9C1076,108.1 1076,109.1 1075.6,109.7C1075.3,110.1 1075.1,111.1 1075,112.9C1074.9,114.3 1074.6,116 1074.4,116.6C1074.2,117.2 1074,118.3 1074,118.9C1074,119.5 1073.8,120.5 1073.5,121.3C1073.2,122 1073,122.9 1073,123.3C1073,123.8 1072.8,124.6 1072.5,125.1C1072.2,125.7 1072,126.4 1072,126.8C1072,127.1 1071.8,127.8 1071.5,128.4C1071.2,128.9 1071,129.6 1071,129.9C1071,130.2 1070.8,130.8 1070.5,131.4C1070.2,131.9 1070,132.5 1070,132.7C1070,132.8 1069.8,133.5 1069.5,134.2C1069.2,134.8 1068.8,135.8 1068.5,136.4C1067.7,138.2 1067,139.8 1066.4,141C1065.8,142.2 1062.7,147.8 1061.9,148.9C1061.7,149.3 1061.3,150.1 1061,150.6C1060.1,152.2 1056.4,157 1053.1,160.7C1048.4,166 1041.8,172.2 1039.1,173.9C1038.7,174.2 1037.9,174.7 1037.4,175.1C1036.8,175.6 1035.9,176.2 1035.3,176.6C1034.6,177 1034.1,177.4 1034,177.5C1033.9,177.6 1033.5,177.9 1033.1,178.1C1032.7,178.3 1032,178.7 1031.6,179C1031.2,179.3 1030.5,179.7 1030.1,179.9C1029.7,180.1 1028.8,180.6 1028.2,181C1026.7,181.8 1022.6,183.9 1020.8,184.7C1020,185 1019.1,185.5 1018.7,185.7C1018.4,185.8 1017.9,186 1017.7,186C1017.5,186 1017,186.2 1016.4,186.5C1015.9,186.8 1015.3,187 1015.1,187C1014.8,187 1014.2,187.2 1013.7,187.5C1013.2,187.8 1012.5,188 1012.2,188C1011.9,188 1011.2,188.2 1010.7,188.5C1010.2,188.8 1009.6,189 1009.4,189C1009.3,189 1008.4,189.2 1007.5,189.5C1006.6,189.7 1005.3,190.1 1004.6,190.2C1003.9,190.3 1002.9,190.6 1002.4,190.7C1000,191.3 996.9,191.8 994.3,192C992.8,192.2 991,192.4 990.4,192.5C989.1,192.8 978,193 976.4,192.8ZM371.8,191.8C371.3,191.6 370.6,191.4 370.3,191.3C370,191.1 369.5,191 369.1,191C368.7,191 367.9,190.8 367.4,190.5C366.9,190.3 366.2,190 365.8,189.9C364.9,189.7 361.7,188 358.8,186C357.6,185.3 355.4,183.3 353.8,181.8C350.8,178.8 349.5,177 347.6,173.3C347.1,172.2 346.3,170.9 345.8,170.3C345.4,169.7 345,169 345,168.8C345,168.6 344.8,168.2 344.5,167.8C344.2,167.5 344,167 344,166.8C344,166.6 343.8,166.2 343.5,165.8C343.2,165.5 343,165 343,164.8C343,164.5 342.8,164.1 342.5,163.9C342.2,163.6 342,163.2 342,162.8C342,162.5 341.8,162.2 341.6,162.1C341.5,162 341.1,161.5 340.9,161C340.7,160.5 339.8,158.9 339,157.4C338.2,155.9 337.3,154.2 337,153.6C336.7,153.1 336.4,152.4 336.3,152.2C335.8,151.4 335.5,150.9 334.9,149.8C334.6,149.1 333.7,147.4 332.9,145.9C332.1,144.4 330.8,141.8 329.9,140.3C329.1,138.7 327.8,136.1 327,134.6C326.2,133.1 325.1,131 324.6,130C324,129 322.9,126.9 322.1,125.4C320.8,122.8 319.4,120.3 317.6,116.7C317.1,115.8 316.6,115.1 316.5,115.1C316.2,115.1 316.1,121.5 316,152L315.9,188.9L288,188.9L260.1,188.9L260.1,113.8L260.1,38.6L260.7,36.2C262.3,29.2 265.3,23.7 270,19C274.7,14.3 280.3,11.3 287.2,9.7C290.4,9 296.6,8.9 299.8,9.6C302.2,10.1 305.3,11.1 306.4,11.6C306.8,11.8 307.3,12 307.5,12C307.8,12 308.1,12.2 308.2,12.4C308.4,12.6 308.9,12.8 309.3,12.9C309.7,13 310.1,13.2 310.1,13.3C310.2,13.4 310.6,13.7 311,13.8C312.7,14.6 315.4,16.8 318.3,19.6C321.3,22.5 324,25.8 324,26.4C324,26.6 324.2,26.9 324.5,27C324.8,27.2 325,27.5 325,28C325,28.4 325.2,28.8 325.4,28.9C325.7,29.1 326.4,30.3 327.6,32.8C327.9,33.2 328.2,33.8 328.3,34C328.4,34.2 328.9,35.3 329.5,36.4C330.1,37.5 331.4,40.1 332.5,42.1C333.6,44.2 335.4,47.7 336.5,49.9C337.6,52.1 339.4,55.6 340.5,57.7C348,72.2 350.7,77.4 352.7,81.4C354.6,85.1 355.3,86.2 355.7,85.9C355.9,85.8 356,75.1 356,48.6C356,28.1 356.1,11.3 356.2,11.2C356.3,11.1 368.9,11 384.1,11.1L411.9,11.1L411.9,87.6C411.9,158.3 411.8,164.2 411.5,165.4C411.2,166.1 410.9,167.1 410.8,167.6C410.3,169.5 409.2,172.4 408.5,173.5C408.4,173.7 408.1,174.1 408,174.5C407.3,176.2 404.6,179.7 402.1,182.1C399.2,185.1 396.1,187.4 393,188.8C392.7,188.9 392.2,189.2 391.9,189.3C391.2,189.7 388.8,190.5 387.6,190.8C387.1,190.9 386.1,191.2 385.5,191.4C384.6,191.8 383.1,191.8 378.6,191.9C375.5,191.9 372.4,191.9 371.8,191.8ZM0,124.2C0,80.3 0.1,59.3 0.3,59.1C0.4,59 0.7,57.5 1,56C1.6,52.7 2.4,49.8 3.6,46.5C4.1,45.2 4.7,43.6 4.9,43C5.1,42.4 5.3,41.8 5.5,41.8C5.7,41.6 7,39 7,38.7C7,38.6 7.4,38 7.8,37.4C8.3,36.8 8.7,36.2 8.8,36C9,35.5 10.3,33.7 12.4,30.9C13.3,29.9 14,28.8 14,28.6C14,28.4 14.2,28.2 14.4,28.1C15.1,27.8 16.4,26.8 20.5,22.9C21,22.4 21.5,22 21.7,22C21.8,22 22.5,21.6 23.2,21.1C27.9,17.6 35.5,14.2 41.7,12.7C48,11.1 47,11.1 77.3,11.1L104.9,11.1L104.9,36.5L104.9,61.9L86,62L67.1,62.1L65.4,62.9C63.2,63.8 60.6,66.1 59.6,68.2C58.2,70.8 58,71.9 58.1,77.2L58.1,81.9L81.5,82L104.9,82.1L104.9,106L104.9,129.9L81.5,130L58.1,130.1L58,159.5L57.9,188.9L28.9,188.9L0,189L0,124.2ZM201.5,188.8C200.9,188.8 198.7,188.5 196.7,188.2C176.2,185.5 158,176.4 143.6,161.4C141.6,159.4 139.8,157.4 139.6,157.1C139.4,156.7 138.6,155.8 138,155C136.6,153.3 131.1,145.3 130.8,144.4C130.6,144.1 130.3,143.3 129.9,142.8C128.9,141.2 127,137.6 127,137.2C127,136.9 126.1,134.7 125.4,133.5C125.2,133.2 125,132.5 124.9,132.1C124.8,131.6 124.6,131.2 124.4,131C124.2,130.8 124,130.3 124,129.9C124,129.5 123.8,128.8 123.5,128.4C123.2,128 123,127.3 123,126.9C123,126.5 122.8,125.8 122.6,125.4C122.4,125 122.1,124 122,123.2C121.8,122.4 121.6,121.5 121.4,121.2C121.2,120.9 121,119.8 120.9,118.8C120.8,117.8 120.6,116.6 120.4,116.2C120.2,115.8 120,114.9 120,114.2C120,113.4 119.8,111.8 119.5,110.5C119.1,108.4 119,107.2 119,100.1C119,94 119.1,91.8 119.4,90.8C119.6,90 119.8,88.5 119.9,87.4C120,86.3 120.2,84.8 120.4,84.1C120.6,83.4 120.9,82.1 121,81.2C121.2,79.6 121.8,77 122.3,75.6C122.4,75.2 122.7,74.4 122.9,73.8C123.9,70.5 124.1,69.8 126,65.4C135.3,43.5 153.2,26 174.9,17.4C182.3,14.5 188.3,12.9 196.7,11.7C200.2,11.2 201.4,11.2 219,11.1L237.7,11L238.3,11.6L239,12.3L238.9,37.1L238.9,61.9L226.5,62C215.2,62.1 213.8,62.2 211,62.7C202.1,64.3 195.9,66.7 189.8,70.8C187.5,72.4 181.9,77.9 182.1,78.5C182.1,78.8 184.4,78.9 210,79L237.9,79.1L237.9,100L237.9,120.9L209.8,120.9C193.1,121 181.6,121.1 181.4,121.2C180.9,121.8 183.3,125.3 186.2,128.1C187.2,129.1 190.9,132 191.2,132C191.3,132 191.8,132.3 192.3,132.7C193.2,133.3 197.4,135.5 199.3,136.1C202.2,137.2 204.9,138 205.5,138C205.9,138 206.9,138.2 207.8,138.5C208.7,138.8 209.9,139 210.5,139C211.1,139 212.3,139.2 213.1,139.4C214.4,139.8 216.6,139.8 226.8,140L238.9,140.1L238.9,164.5L238.9,188.9L220.8,188.9C210.8,188.9 202.1,188.9 201.5,188.8ZM434.1,188.7C434,188.5 434,162.5 434.1,130.9C434.1,73.6 434.1,73.4 434.7,70.3C435.6,65 436.6,60.8 437.8,57.4C438.7,55 440.1,51.3 440.6,50.4C440.8,50 441,49.5 441,49.3C441,49.2 441.2,48.9 441.4,48.8C441.5,48.6 441.8,48.2 441.8,47.9C442.1,46.9 446.4,39.5 447.7,38C447.9,37.8 448.8,36.7 449.7,35.5C451.8,32.8 457.8,26.8 460.5,24.7C461.7,23.8 462.8,22.9 463,22.7C463.5,22.3 468.3,19.1 468.8,18.9C469,18.8 469.6,18.5 470.1,18.1C471.9,17 475.6,15.3 477.5,14.6C482.7,12.7 486.7,11.5 489.4,10.9C492.1,10.3 493.7,10 499.5,9.2C500.5,9.1 503.6,9 506.4,9C510.7,8.9 511.7,9 513.9,9.5C515.2,9.8 516.7,10 517.1,10C517.5,10 518.7,10.2 519.8,10.5C520.8,10.8 522,11 522.5,11C523.4,11 524,11.2 529,12.7C535.8,14.7 544.3,19.3 550.8,24.4C556.8,29.1 563.3,36.3 566.6,41.9C568.1,44.4 569.5,46.8 569.8,47.5C569.9,47.8 570.1,48.3 570.3,48.5C570.4,48.7 570.6,49.2 570.8,49.5C570.9,49.8 571.3,50.6 571.5,51.1C571.7,51.7 572.1,52.6 572.4,53.3C573,54.7 573.7,56.6 574,57.8C574.1,58.4 574.4,59 574.6,59.3C574.8,59.6 575,60.4 575.1,61.1C575.2,61.7 575.4,62.6 575.6,63C575.8,63.4 576,64.2 576,64.7C576,65.2 576.2,66.2 576.5,67C576.8,67.8 577,68.8 577,69.3C577,69.8 577.2,70.9 577.4,71.8C577.9,73.3 577.9,76.9 577.9,131.1L577.9,188.9L549.5,188.9L521.1,188.9L521,161.5L520.9,134.1L509.5,134L498.1,133.9L498.1,110.5L498.1,87.1L509.5,87L520.9,86.9L520.8,83.5C520.8,81.6 520.6,79.3 520.4,78.3C520.2,77.3 520,75.8 520,74.9C520,73.5 519.9,73.2 519.5,73C519.2,72.8 519,72.5 519,72C519,71.6 518.8,71.2 518.6,71C518.4,70.8 518.2,70.5 518.1,70.2C517.8,69 514,65 513.2,65C513,65 512.6,64.8 512.2,64.6C511.1,63.7 509.1,63.2 506.6,63.1C504.4,63 503.8,63 502.3,63.5C501.3,63.8 500.4,64 500.3,64C499.6,64 496.6,66.5 495,68.4C494.6,68.8 493.9,70 493.5,71C493.1,72 492.6,73.1 492.4,73.4C492.2,73.8 492.1,87 492,131.4L491.9,188.9L463.1,188.9C439.8,189 434.2,188.9 434.1,188.7ZM789.1,188.7C789,188.5 789,159.7 788.9,124.8L788.9,61.1L772,61L755.1,60.9L755.1,36L755.1,11.1L818,11.1L880.9,11.1L880.9,36L880.9,60.9L863.5,61L846.1,61.1L846,125L845.9,188.9L817.6,188.9C795,189 789.2,188.9 789.1,188.7ZM990,136.2C1000.5,133.7 1009,127 1013.9,117.4C1015.6,114 1016.5,111.5 1017.3,107.7C1017.8,105.6 1017.9,104.3 1017.9,100.5C1017.9,96.7 1017.8,95.4 1017.3,93.3C1016.5,89.5 1015.6,87 1013.9,83.6C1011.8,79.5 1010.6,77.9 1007.3,74.5C1001.8,69 996.2,66 988.3,64.5C980.3,63 970.6,65 963.6,69.6C962.7,70.2 961.9,70.8 961.8,70.8C961.3,70.8 956.1,76 954.8,77.7C951.1,82.5 948.8,87.7 947.6,93.9C946.9,97.3 947,104.3 947.7,107.7C948.5,111.5 949.4,114 951.1,117.4C956,127.1 965,134.1 975.4,136.2C979,137 979,137 983.4,136.9C986.5,136.8 987.9,136.7 990,136.2Z"/><g fill="#242424" transform="translate(323.00 229.00) scale(0.46088) translate(-20 -14)"><path d="M540.4 64 540.4 39 465.5 39 465.5 14 540.4 14 540.4 39 565.4 39 565.4 64 540.4 64ZM465.5 138.9 465.5 89 490.4 89 490.4 113.9 565.4 113.9 565.4 138.9 465.5 138.9ZM490.4 89 490.4 64 540.4 64 540.4 89 490.4 89Z"/><path d="M319.7 43.4 314.8 64.1C310.4 61.8 304 60.6 298.9 60.6 285.6 60.6 276.1 70 276.1 86.3L276.1 138.9 255.2 138.9 255.2 43.2 275.9 43.2 275.9 54C282.2 44.9 292 40.7 303.7 40.7 315.4 40.7 315 41.5 319.7 43.4Z"/><path d="M404.2 67.2C398.4 63.6 386.5 59 374.6 59 362.7 59 356.5 63.6 356.5 70.4 356.5 77.2 363.5 79 372.3 80.3L382.2 81.8C403.1 84.8 415.5 93.7 415.5 110 415.5 126.4 399.5 141.3 371.9 141.3 344.3 141.3 344.8 139.4 330.8 129L340.5 113.3C347.4 118.6 356.5 123.1 372.1 123.1 387.7 123.1 393.9 118.6 393.9 111.4 393.9 104.2 388.7 102.4 377.3 100.8L367.3 99.5C346.1 96.7 334.8 86.9 334.8 71.5 334.8 56.1 350 40.8 374.4 40.8 398.8 40.8 403.3 44.5 413.2 50.9L404.2 67.2Z"/><path d="M644.7 182 621.5 182 655.7 121.7 613.3 45.7 636.8 45.7 667.5 100.6 697.2 45.7 720.2 45.7 644.7 182Z"/><path d="M952.8 100.8C952.8 131.3 930.8 143.9 908.4 143.9 886 143.9 864 131.3 864 100.8L864 45.7 885 45.7 885 98.9C885 117.4 895.3 124.2 908.4 124.2 921.5 124.2 931.8 117.4 931.8 98.9L931.8 45.7 952.8 45.7 952.8 100.8Z"/><path d="M106.4 56 93 70.3C86.3 64 79.2 60.4 70 60.4 53.9 60.4 41.7 73 41.7 91.1 41.7 109.1 53.9 121.7 70 121.7 86.1 121.7 87.4 117.4 93.5 111.7L106.4 126.1C97.7 136.2 84.9 141.4 70.6 141.4 40.1 141.4 20.2 119.7 20.2 91.1 20.2 62.4 40.1 40.7 70.6 40.7 101.1 40.7 97.9 45.9 106.4 56Z"/><path d="M221.9 138.9 201 138.9 201 127.4C194.4 135.9 184.5 141.4 170.9 141.4 144.2 141.4 123.1 120.3 123.1 91.1 123.1 61.8 144.2 40.7 170.9 40.7 197.7 40.7 194.4 46.3 201 54.8L201 43.2 221.9 43.2 221.9 138.9ZM144.6 91.1C144.6 107.8 155.4 121.7 173.4 121.7 191.4 121.7 202.3 108.5 202.3 91.1 202.3 73.6 190.7 60.4 173.4 60.4 156.1 60.4 144.6 74.3 144.6 91.1Z"/><path d="M835.1 93.6C835.1 122.2 813.2 143.9 783.6 143.9 754 143.9 732.1 122.2 732.1 93.6 732.1 64.9 754 43.2 783.6 43.2 813.2 43.2 835.1 64.9 835.1 93.6ZM753.6 93.6C753.6 111.6 766.5 124.2 783.6 124.2 800.7 124.2 813.7 111.6 813.7 93.6 813.7 75.5 800.7 62.9 783.6 62.9 766.5 62.9 753.6 75.5 753.6 93.6Z"/></g></svg>';
const VENDEDORES = { C6: [104754], IGA: [594, 598, 16036] };
const WL_VITRINE_C6 = [43, 48];
const STATUS_VENDA = [2, 3, 7];
const SITUACAO_APROVADA = 3;
const PESO_SCORE = { acesso: 1, oferta: 5, vmv: 100 };
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
  T[p.queryName] = linhas.map((arr) => {
    if (arr.length !== p.cols.length) {
      throw new Error(p.queryName + ': linha com ' + arr.length + ' colunas, esperadas ' + p.cols.length);
    }
    const o = {};
    p.cols.forEach((k, j) => { o[k] = arr[j]; });
    return o;
  });
});
const META = pedidos[0].meta;
const PARTES = Number(META.partes_acesso);
if (!(PARTES >= 1)) throw new Error('meta.partes_acesso ausente no Montar Consultas');
const nomesAcesso = [];
for (let p = 0; p < PARTES; p++) nomesAcesso.push('acessos_p' + p);
['eventos', 'veiculos', 'ofertas', 'lojas', 'acessos_anuncio'].concat(nomesAcesso).forEach((k) => {
  if (!T[k]) throw new Error('A consulta ' + k + ' nao veio do Montar Consultas');
});
const AGORA = META.agora_br;
const num = (x) => (x === null || x === undefined || x === '' ? null : Number(x));
const avisos = [];
const conta = {};
const marca = (chave) => { conta[chave] = (conta[chave] || 0) + 1; };
const eventos = T.eventos.map((e) => ({
  id: num(e.id), nome: e.nome, status: num(e.status), ini: e.ini, fim: e.fim, op: e.op,
  wls: String(e.wls || '').split(',').filter((x) => x !== '').map(Number)
})).sort((a, b) => (a.fim < b.fim ? 1 : a.fim > b.fim ? -1 : b.id - a.id));
const evPorId = {};
eventos.forEach((e) => { evPorId[e.id] = e; });
const ofertaPorId = {};
const ofertasDaNeg = {};
T.ofertas.forEach((o) => {
  const of = { id: num(o.id), neg: num(o.neg), loja: num(o.loja), valor: num(o.valor), quando: o.quando };
  ofertaPorId[of.id] = of;
  if (!ofertasDaNeg[of.neg]) ofertasDaNeg[of.neg] = [];
  ofertasDaNeg[of.neg].push(of);
});
const lojas = T.lojas.map((l) => ({
  id: num(l.id), nome: l.nome, wl: num(l.wl), situacao: num(l.situacao), cadastro: l.cadastro,
  apagada: num(l.apagada) === 1,
  fenauto: l.fenauto || null,
  reativada: !!l.fenauto && String(l.cadastro || '') < String(META.inicio_campanha || '').slice(0, 16),
  uf: l.uf || null,
  fenauto_ano: l.fenauto_ano || null
}));
const lojaPorId = {};
lojas.forEach((l) => { lojaPorId[l.id] = l; });
function linkAnuncio(v, ev) {
  const wls = ev.wls;
  const t = (x) => String(x === null || x === undefined ? '' : x).trim();
  const partes = [t(v.marca), t(v.modelo), t(v.versao)];
  const id = t(v.uuid).split('-').join('');
  if (!id || partes.some((p) => !p)) { marca('sem_link'); return null; }
  const soC6 = wls.length > 0 && wls.every((w) => WL_VITRINE_C6.indexOf(w) >= 0);
  if (!soC6 && ev.op === 'C6') marca('link_padrao');
  return (soC6 ? 'https://compraveiculos.cars2you.com.br' : 'https://cars2you.com.br') +
    '/anuncio/veiculo/' + partes.map((p) => encodeURIComponent(p.toLowerCase())).join('/') + '/' + id;
}
const acessoAnuncio = T.acessos_anuncio.map((a) => [num(a.evento), num(a.anuncio), num(a.loja), num(a.dias)]);
const lojasDoAnuncio = {};
acessoAnuncio.forEach((a) => {
  const k = a[0] + '|' + a[1];
  lojasDoAnuncio[k] = (lojasDoAnuncio[k] || 0) + 1;
});
const vistos = {};
const veiculos = [];
T.veiculos.forEach((r) => {
  const ev = evPorId[num(r.evento)];
  if (!ev) { marca('veiculo_sem_evento'); return; }
  const chave = ev.id + '|' + num(r.veiculo);
  if (vistos[chave]) marca('veiculo_repetido');
  vistos[chave] = 1;
  if ((VENDEDORES[ev.op] || []).indexOf(num(r.vendedor)) < 0) marca('outro_vendedor');
  if (num(r.anuncio_apagado) === 1) marca('anuncio_apagado');
  const ofs = ofertasDaNeg[num(r.neg)] || [];
  let ult = null;
  let maior = null;
  ofs.forEach((o) => {
    if (!ult || o.id > ult.id) ult = o;
    if (!maior || o.valor > maior.valor) maior = o;
  });
  const status = num(r.status);
  const vendido = STATUS_VENDA.indexOf(status) >= 0;
  const venc = vendido && r.vencedora !== null ? ofertaPorId[num(r.vencedora)] : null;
  if (vendido && !venc) marca('venda_sem_vencedora');
  const vmv = num(r.vmv);
  let farol = 'sem';
  if (maior) farol = vmv !== null && maior.valor >= vmv ? 'atingiu' : 'abaixo';
  const acessos = lojasDoAnuncio[ev.id + '|' + num(r.anuncio)] || 0;
  const patio = String(r.patio || '').trim();
  if (!patio) marca('sem_patio');
  const nomeVeic = [r.marca, r.modelo, r.versao].filter((x) => x).join(' ');
  veiculos.push({
    ev: ev.id, neg: num(r.neg), anuncio: num(r.anuncio), veic: num(r.veiculo),
    nome: nomeVeic || '(sem modelo)',
    ano: [r.ano_fab, r.ano_mod].filter((x) => x).join('/'),
    patio: patio || '(sem pátio)',
    link: linkAnuncio(r, ev),
    qtd: ofs.length, acessos: acessos,
    ult: ult ? ult.valor : null, ult_quando: ult ? ult.quando : null,
    maior: maior ? maior.valor : null,
    vmv: vmv, fipe: num(r.fipe),
    pvmv: maior && vmv ? maior.valor / vmv : null,
    bruto: acessos * PESO_SCORE.acesso + ofs.length * PESO_SCORE.oferta +
      (farol === 'atingiu' ? PESO_SCORE.vmv : 0),
    status: status, vendido: vendido,
    venc: venc ? venc.id : null,
    vq: venc ? String(venc.quando || '') : null,
    venda: venc ? venc.valor : null,
    arrematante: venc ? venc.loja : null,
    pfipe: maior && num(r.fipe) ? maior.valor / num(r.fipe) : null,
    farol: farol
  });
});
const maiorBruto = veiculos.reduce((m, v) => Math.max(m, v.bruto), 0);
veiculos.forEach((v) => { v.score = maiorBruto ? Math.round(1000 * v.bruto / maiorBruto) / 10 : 0; });
const negConhecida = {};
veiculos.forEach((v) => { negConhecida[v.neg] = v; });
T.ofertas.forEach((o) => { if (num(o.loja) === null) marca('lance_sem_loja'); });
const ofertas = T.ofertas.filter((o) => negConhecida[num(o.neg)] && num(o.loja) !== null)
  .map((o) => [num(o.id), num(o.neg), num(o.loja), num(o.valor), o.quando]);
ofertas.forEach((o) => {
  if (!lojaPorId[o[2]]) marca('loja_sem_cadastro');
  else {
    if (evPorId[negConhecida[o[1]].ev].wls.indexOf(lojaPorId[o[2]].wl) < 0) marca('loja_outro_canal');
    if (lojaPorId[o[2]].apagada) marca('loja_apagada');
  }
});
const acessos = [];
nomesAcesso.forEach((k) => {
  T[k].forEach((a) => acessos.push([num(a.loja), String(a.dia), num(a.hora), num(a.n), num(a.evento)]));
});
const TEXTO_AVISO = {
  outro_vendedor: 'veículo(s) de loja vendedora fora da operação do evento (C6: 104754; IGA: 594, 598, 16036)',
  anuncio_apagado: 'veículo(s) com o anúncio apagado e a negociação ainda no evento',
  venda_sem_vencedora: 'venda(s) sem a oferta vencedora entre as ofertas do evento — sem loja compradora',
  veiculo_repetido: 'veículo(s) com mais de uma negociação no mesmo evento',
  veiculo_sem_evento: 'veículo(s) fora dos eventos do recorte',
  sem_link: 'veículo(s) sem marca, modelo, versão ou identificador — sem link do anúncio',
  link_padrao: 'veículo(s) de evento do C6 que alveja outro canal além do C6 — link no cars2you.com.br',
  sem_patio: 'veículo(s) sem pátio no anúncio',
  loja_sem_cadastro: 'lance(s) de loja sem cadastro na tabela de lojas',
  loja_outro_canal: 'lance(s) de loja de um canal que o evento não alveja',
  loja_apagada: 'lance(s) de loja apagada',
  lance_sem_loja: 'lance(s) sem loja compradora (lançado por usuário interno) — fora dos lances e dos rankings; se venceu, a venda conta nos vendidos'
};
Object.keys(conta).forEach((k) => avisos.push(conta[k] + ' ' + (TEXTO_AVISO[k] || k)));
const ANO_CAMPANHA = String(META.campanha_ano || '').split(' ')[1] || '';
const TITULO_REGIAO = 'Lojistas Fenauto ' + ANO_CAMPANHA + ' por região';
const INICIO_NOVAS = String(META.inicio_campanha || '');
const DIA_INICIO_NOVAS = INICIO_NOVAS.slice(8, 10) + '/' + INICIO_NOVAS.slice(5, 7);
const GRUPO_NOVAS = String(META.grupo_iga_nome || '');
const MESES_NOVAS = Number(META.meses_sem_compra) || 0;
const DADOS = {
  agora: AGORA, mes: META.mes,
  peso: PESO_SCORE, aprovada: SITUACAO_APROVADA,
  status_nome: STATUS_NOME,
  eventos: eventos, veiculos: veiculos, lojas: lojas, ofertas: ofertas,
  aa: acessoAnuncio, ac: acessos,
  avisos: avisos
};
function calcula(D, sel, F) {
  F = F || {};
  const evs = sel === 'todos' ? D.eventos : D.eventos.filter((e) => e.id === sel);
  const noRecorte = {};
  evs.forEach((e) => { noRecorte[e.id] = e; });
  const lojaPorId = {};
  D.lojas.forEach((l) => { lojaPorId[l.id] = l; });
  const agora = D.agora;
  const estado = (e) => {
    if (agora < e.ini) return 'Agendado';
    if (agora <= e.fim) return 'Em andamento';
    const aberto = D.veiculos.some((v) => v.ev === e.id && v.status === 1);
    return aberto ? 'Encerrando' : 'Encerrado';
  };
  const veicsEv = D.veiculos.filter((v) => noRecorte[v.ev]);
  const Vf = veicsEv.filter((v) => (!F.patio || v.patio === F.patio) && (!F.farol || v.farol === F.farol));
  const vPorNeg = {};
  const vPorAnuncio = {};
  Vf.forEach((v) => { vPorNeg[v.neg] = v; vPorAnuncio[v.ev + '|' + v.anuncio] = v; });
  let pIni = null;
  let pFim = null;
  evs.forEach((e) => {
    if (pIni === null || e.ini < pIni) pIni = e.ini;
    if (pFim === null || e.fim > pFim) pFim = e.fim;
  });
  const dataDe = (c) => '20' + c.slice(0, 2) + '-' + c.slice(2, 4) + '-' + c.slice(4, 6);
  const codDia = (s) => s.slice(2, 4) + s.slice(5, 7) + s.slice(8, 10);
  const diaData = F.dia ? dataDe(F.dia) : null;
  let wIni = pIni;
  let wFim = pFim;
  if (diaData && pIni !== null) {
    const a = diaData + ' 00:00';
    const b = diaData + ' 23:59';
    wIni = a > pIni ? a : pIni;
    wFim = b < pFim ? b : pFim;
  }
  const semJanela = wIni === null || wIni > wFim;
  const hora = (s) => Number(s.slice(11, 13));
  const minuto = (s) => Number(s.slice(14, 16));
  const dIni = semJanela ? null : codDia(wIni);
  const dFim = semJanela ? null : codDia(wFim);
  const hIni = semJanela ? 0 : hora(wIni);
  const hFim = semJanela ? -1 : (minuto(wFim) === 0 ? hora(wFim) - 1 : hora(wFim));
  const horaOk = (d, h) => {
    if (dIni === null || d < dIni || d > dFim) return false;
    if (d === dIni && h < hIni) return false;
    if (d === dFim && h > hFim) return false;
    return true;
  };
  const diaDentro = (d) => !semJanela && (diaData ? d === diaData :
    d <= wFim.slice(0, 10) && evs.some((e) => d <= e.fim.slice(0, 10)));
  const novas = D.lojas.filter((l) => l.fenauto && !l.apagada && diaDentro(l.fenauto.slice(0, 10)));
  const ehNova = {};
  novas.forEach((l) => { ehNova[l.id] = l.reativada ? 'R' : 'N'; });
  const cadastradas = novas.filter((l) => !l.reativada);
  const reativadas = novas.filter((l) => l.reativada);
  const diasDaLoja = {};
  const lojasDoDia = {};
  const acIni = {};
  const acFim = {};
  const porHoraT = [];
  const porHoraN = [];
  const porHoraR = [];
  for (let h = 0; h < 24; h++) { porHoraT.push(0); porHoraN.push(0); porHoraR.push(0); }
  D.ac.forEach((a) => {
    if (!noRecorte[a[4]] || !horaOk(a[1], a[2])) return;
    (diasDaLoja[a[0]] || (diasDaLoja[a[0]] = {}))[a[1]] = 1;
    (lojasDoDia[a[1]] || (lojasDoDia[a[1]] = {}))[a[0]] = 1;
    const quando = a[1] + (a[2] < 10 ? '0' : '') + a[2];
    if (!acIni[a[0]] || quando < acIni[a[0]]) acIni[a[0]] = quando;
    if (!acFim[a[0]] || quando > acFim[a[0]]) acFim[a[0]] = quando;
  });
  const nDias = (id) => (diasDaLoja[id] ? Object.keys(diasDaLoja[id]).length : 0);
  const Of = D.ofertas.filter((o) => vPorNeg[o[1]] && (!diaData || o[4].slice(0, 10) === diaData));
  const ofPorId = {};
  const ofVeic = {};
  Of.forEach((o) => {
    ofPorId[o[0]] = o;
    const a = ofVeic[o[1]] || (ofVeic[o[1]] = { n: 0, maior: null });
    a.n++;
    if (a.maior === null || o[3] > a.maior) a.maior = o[3];
  });
  const vendidos = Vf.filter((v) => v.vendido && v.venc !== null && (!diaData || String(v.vq).slice(0, 10) === diaData));
  const porLoja = {};
  const pl = (id) => porLoja[id] || (porLoja[id] = { negs: {}, lances: 0, arrem: 0 });
  Of.forEach((o) => { const a = pl(o[2]); a.lances++; a.negs[vPorNeg[o[1]].veic] = 1; });
  vendidos.forEach((v) => { if (v.arrematante !== null) pl(v.arrematante).arrem++; });
  const diasEntre = (a, b) => Math.round((Date.UTC(Number(b.slice(0, 4)), Number(b.slice(5, 7)) - 1, Number(b.slice(8, 10))) -
    Date.UTC(Number(a.slice(0, 4)), Number(a.slice(5, 7)) - 1, Number(a.slice(8, 10)))) / 86400000);
  const acessoVeic = {};
  const lojasDoVeic = {};
  const abriu = {};
  D.aa.forEach((a) => {
    const e = noRecorte[a[0]];
    if (!e) return;
    const v = vPorAnuncio[a[0] + '|' + a[1]];
    if (!v) return;
    (lojasDoVeic[v.veic] || (lojasDoVeic[v.veic] = {}))[a[2]] = 1;
    if (diaData) {
      const k = diasEntre(e.ini.slice(0, 10), diaData);
      if (k < 0 || k > 30 || !(a[3] & (1 << k))) return;
    }
    acessoVeic[v.neg] = (acessoVeic[v.neg] || 0) + 1;
    abriu[a[2]] = 1;
  });
  const vendNeg = {};
  vendidos.forEach((v) => { vendNeg[v.neg] = 1; });
  const negsDoVeic = {};
  Vf.forEach((v) => { (negsDoVeic[v.veic] || (negsDoVeic[v.veic] = [])).push(v); });
  const Vu = Object.keys(negsDoVeic).map((k) => {
    const ls = negsDoVeic[k];
    const base = ls.filter((v) => v.vendido)[0] || ls.slice().sort((x, y) => y.neg - x.neg)[0];
    const u = Object.assign({}, base);
    u.n_ev = ls.length;
    u.tem_oferta = ls.some((v) => ofVeic[v.neg]);
    u.atingiu = ls.some((v) => ofVeic[v.neg] && v.vmv !== null && ofVeic[v.neg].maior >= v.vmv);
    u.tem_acesso = ls.some((v) => acessoVeic[v.neg]);
    u.vendeu = ls.some((v) => vendNeg[v.neg]);
    if (ls.length > 1) {
      u.qtd = ls.reduce((t, v) => t + v.qtd, 0);
      u.acessos = Object.keys(lojasDoVeic[k] || {}).length;
      const mx = ls.filter((v) => v.maior !== null).map((v) => v.maior);
      u.maior = mx.length ? Math.max.apply(null, mx) : null;
      const ul = ls.filter((v) => v.ult_quando).sort((x, y) => (x.ult_quando < y.ult_quando ? 1 : -1))[0];
      u.ult = ul ? ul.ult : null;
      u.ult_quando = ul ? ul.ult_quando : null;
      const pv = ls.filter((v) => v.pvmv !== null).map((v) => v.pvmv);
      const pf = ls.filter((v) => v.pfipe !== null).map((v) => v.pfipe);
      u.pvmv = pv.length ? Math.max.apply(null, pv) : null;
      u.pfipe = pf.length ? Math.max.apply(null, pf) : null;
      u.farol = ls.some((v) => v.farol === 'atingiu') ? 'atingiu' : ls.some((v) => v.farol === 'abaixo') ? 'abaixo' : 'sem';
      u.score = Math.max.apply(null, ls.map((v) => v.score));
    }
    return u;
  });
  const universo = {};
  Object.keys(porLoja).forEach((k) => { universo[k] = 1; });
  Object.keys(diasDaLoja).forEach((k) => { universo[k] = 1; });
  novas.forEach((l) => { universo[l.id] = 1; });
  const rankLojas = Object.keys(universo).map((k) => {
    const id = Number(k);
    const a = porLoja[k] || { negs: {}, lances: 0, arrem: 0 };
    const l = lojaPorId[id] || {};
    const nova = ehNova[id] || '';
    const dias = nDias(id);
    return {
      loja: id, nome: l.nome || ('loja ' + id), nova: nova,
      acessos: dias, lances: a.lances, veic: Object.keys(a.negs).length, arrem: a.arrem,
      pri: acIni[id] || null, ult: acFim[id] || null
    };
  }).sort((x, y) => y.arrem - x.arrem || y.lances - x.lances ||
    y.acessos - x.acessos || String(x.nome).localeCompare(String(y.nome)));
  const REGIAO_DA_UF = {
    AC: 'Norte', AM: 'Norte', AP: 'Norte', PA: 'Norte', RO: 'Norte', RR: 'Norte', TO: 'Norte',
    AL: 'Nordeste', BA: 'Nordeste', CE: 'Nordeste', MA: 'Nordeste', PB: 'Nordeste', PE: 'Nordeste',
    PI: 'Nordeste', RN: 'Nordeste', SE: 'Nordeste',
    DF: 'Centro-Oeste', GO: 'Centro-Oeste', MS: 'Centro-Oeste', MT: 'Centro-Oeste',
    ES: 'Sudeste', MG: 'Sudeste', RJ: 'Sudeste', SP: 'Sudeste',
    PR: 'Sul', RS: 'Sul', SC: 'Sul'
  };
  const SEM_UF = 'Não identificada';
  const porRegiao = {};
  const daCampanha = D.lojas.filter((l) => l.fenauto_ano && !l.apagada &&
    (!diaData || l.fenauto_ano.slice(0, 10) === diaData));
  daCampanha.forEach((l) => {
    const uf = l.uf && REGIAO_DA_UF[l.uf] ? l.uf : null;
    const reg = uf ? REGIAO_DA_UF[uf] : SEM_UF;
    const a = porRegiao[reg] || (porRegiao[reg] = { regiao: reg, total: 0, acessaram: 0, ufs: {} });
    const u = a.ufs[uf || '—'] || (a.ufs[uf || '—'] = { uf: uf, total: 0, acessaram: 0, ofertaram: 0, compraram: 0 });
    a.total++;
    u.total++;
    if (nDias(l.id) > 0) { a.acessaram++; u.acessaram++; }
    if (porLoja[l.id] && porLoja[l.id].lances > 0) u.ofertaram++;
    if (porLoja[l.id] && porLoja[l.id].arrem > 0) u.compraram++;
  });
  const regioes = Object.keys(porRegiao).map((k) => {
    const a = porRegiao[k];
    a.ufs = Object.keys(a.ufs).map((u) => a.ufs[u])
      .sort((x, y) => y.total - x.total || String(x.uf).localeCompare(String(y.uf)));
    return a;
  }).sort((x, y) => (x.regiao === SEM_UF) - (y.regiao === SEM_UF) || y.total - x.total ||
    x.regiao.localeCompare(y.regiao));
  const porPatio = {};
  Vu.forEach((v) => {
    const a = porPatio[v.patio] || (porPatio[v.patio] = { patio: v.patio, veiculos: 0, acesso: 0, oferta: 0, vmv: 0 });
    a.veiculos++;
    if (v.tem_acesso) a.acesso++;
    if (v.tem_oferta) a.oferta++;
    if (v.atingiu) a.vmv++;
  });
  const patios = Object.keys(porPatio).map((k) => {
    const a = porPatio[k];
    a.conversao = a.veiculos ? a.oferta / a.veiculos : null;
    a.pc_vmv = a.veiculos ? a.vmv / a.veiculos : null;
    return a;
  }).sort((x, y) => y.veiculos - x.veiculos || String(x.patio).localeCompare(String(y.patio)));
  const hoje = codDia(agora);
  const listaDias = (ini, fim) => {
    const out = [];
    if (ini === null) return out;
    const ate = fim < hoje ? fim : hoje;
    const dt = new Date(Date.UTC(2000 + Number(ini.slice(0, 2)), Number(ini.slice(2, 4)) - 1, Number(ini.slice(4, 6))));
    const p2 = (n) => (n < 10 ? '0' : '') + n;
    for (let i = 0; i < 400; i++) {
      const c = p2(dt.getUTCFullYear() % 100) + p2(dt.getUTCMonth() + 1) + p2(dt.getUTCDate());
      if (c > ate) break;
      out.push(c);
      dt.setUTCDate(dt.getUTCDate() + 1);
    }
    return out;
  };
  const noRanking = {};
  rankLojas.forEach((r) => { noRanking[r.loja] = 1; });
  const porDia = listaDias(dIni, dFim).map((c) => {
    const ls = Object.keys(lojasDoDia[c] || {}).filter((id) => noRanking[id]);
    return { dia: c, total: ls.length, novas: ls.filter((id) => ehNova[id] === 'N').length,
      reativadas: ls.filter((id) => ehNova[id] === 'R').length };
  });
  const lojaHora = {};
  D.ac.forEach((a) => {
    if (!noRanking[a[0]] || !noRecorte[a[4]] || !horaOk(a[1], a[2])) return;
    if (F.dia_hora && a[1] !== F.dia_hora) return;
    const k = a[0] + '|' + a[1] + '|' + a[2];
    if (lojaHora[k]) return;
    lojaHora[k] = 1;
    porHoraT[a[2]]++;
    if (ehNova[a[0]] === 'N') porHoraN[a[2]]++;
    if (ehNova[a[0]] === 'R') porHoraR[a[2]]++;
  });
  let h0 = 0;
  let h1 = 23;
  while (h0 <= 23 && porHoraT[h0] === 0) h0++;
  while (h1 >= 0 && porHoraT[h1] === 0) h1--;
  const porHora = [];
  for (let h = h0; h <= h1; h++) porHora.push({ h: h, total: porHoraT[h], novas: porHoraN[h], reativadas: porHoraR[h] });
  const soma = (arr, f) => arr.reduce((t, x) => t + (f(x) || 0), 0);
  const ofertantes = rankLojas.filter((r) => r.lances > 0);
  const participacoes = soma(ofertantes, (r) => r.veic);
  const funilDe = (lista) => [
    ['Cadastrados', lista.length],
    ['Aprovados', lista.filter((l) => l.situacao === D.aprovada).length],
    ['Acessaram', lista.filter((l) => nDias(l.id) > 0).length],
    ['Ofertaram', lista.filter((l) => porLoja[l.id] && porLoja[l.id].lances > 0).length],
    ['Compraram', lista.filter((l) => porLoja[l.id] && porLoja[l.id].arrem > 0).length]
  ];
  const funil = funilDe(cadastradas);
  const funilR = funilDe(reativadas);
  const kpi = {
    publicados: Vu.length,
    vendidos: Vu.filter((v) => v.vendeu).length,
    volume: soma(vendidos, (v) => v.venda),
    vmv_publicados: soma(Vu, (v) => v.vmv),
    pc_vendido_vmv: soma(Vu, (v) => v.vmv) ? soma(vendidos, (v) => v.venda) / soma(Vu, (v) => v.vmv) : null,
    pc_arrem_fipe: soma(vendidos.filter((v) => v.fipe), (v) => v.fipe)
      ? soma(vendidos.filter((v) => v.fipe), (v) => v.venda) / soma(vendidos.filter((v) => v.fipe), (v) => v.fipe) : null,
    pc_arrem_vmv: soma(vendidos.filter((v) => v.vmv), (v) => v.vmv)
      ? soma(vendidos.filter((v) => v.vmv), (v) => v.venda) / soma(vendidos.filter((v) => v.vmv), (v) => v.vmv) : null,
    vmv_atingido: Vu.filter((v) => v.atingiu).length,
    acessados: Vu.filter((v) => v.tem_acesso).length,
    com_oferta: Vu.filter((v) => v.tem_oferta).length,
    sem_oferta: Vu.length - Vu.filter((v) => v.tem_oferta).length,
    lances: Of.length,
    ofertantes: ofertantes.length,
    lances_por_lojista: ofertantes.length ? Of.length / ofertantes.length : null,
    compradores: rankLojas.filter((r) => r.arrem > 0).length,
    participacoes: participacoes,
    part_por_lojista: ofertantes.length ? participacoes / ofertantes.length : null,
    novas: cadastradas.length,
    engajamento: cadastradas.length ? funil[2][1] / cadastradas.length : null,
    novas_acessaram: funil[2][1],
    novas_ofertaram: funil[3][1],
    novas_compraram: funil[4][1],
    reativadas: reativadas.length,
    engaj_reativadas: reativadas.length ? funilR[2][1] / reativadas.length : null,
    reativadas_acessaram: funilR[2][1],
    reativadas_ofertaram: funilR[3][1],
    reativadas_compraram: funilR[4][1],
    lojas_acessaram: Object.keys(diasDaLoja).length,
    lojas_ranking_acessaram: rankLojas.filter((r) => r.acessos > 0).length,
    acessos: soma(porHoraT, (n) => n),
    acessos_novas: soma(porHoraN, (n) => n),
    acessos_reativadas: soma(porHoraR, (n) => n)
  };
  return {
    sel: sel, eventos: evs.map((e) => ({ id: e.id, nome: e.nome, op: e.op, ini: e.ini, fim: e.fim, estado: estado(e) })),
    periodo: [pIni, pFim], janela: [wIni, wFim],
    dias_periodo: listaDias(pIni === null ? null : codDia(pIni), pFim === null ? null : codDia(pFim)),
    patios_evento: Object.keys(veicsEv.reduce((o, v) => { o[v.patio] = 1; return o; }, {})).sort(),
    kpi: kpi, veiculos: Vu, lojas: rankLojas, nova: ehNova,
    patios: patios, por_dia: porDia, por_hora: porHora, funil: funil, regioes: regioes
  };
}
function APP(D) {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s === null || s === undefined ? '' : s)
    .split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');
  const nf = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('pt-BR'));
  const n1 = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 }));
  const rs = (n) => (n === null || n === undefined ? '—' : 'R$ ' + Math.round(n).toLocaleString('pt-BR'));
  const pc = (x) => (x === null || x === undefined ? '—' : (100 * x).toFixed(1).replace('.', ',') + '%');
  const pc0 = (x) => (x === null || x === undefined ? '—' : Math.round(100 * x) + '%');
  const dt = (s) => (s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(2, 4) + ' ' + s.slice(11, 16) : '—');
  const dia = (s) => (s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '—');
  const diaCod = (c) => c.slice(4, 6) + '/' + c.slice(2, 4);
  const diaAntes = (s) => {
    const d = new Date(Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)) - 1));
    const p2 = (n) => (n < 10 ? '0' : '') + n;
    return p2(d.getUTCDate()) + '/' + p2(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear();
  };
  const FAROL = { sem: 'Sem oferta', abaixo: 'Oferta abaixo do VMV', atingiu: 'VMV atingido' };
  const tagStatus = (v) => {
    const nome = D.status_nome[v.status] || ('status ' + v.status);
    let cls = '';
    if (v.vendido) cls = 'ok';
    else if (v.status === 11 || v.status === 10) cls = 'ruim';
    else if ([14, 15, 18, 8].indexOf(v.status) >= 0) cls = 'atencao';
    return '<span class="tag ' + cls + '">' + esc(nome) + '</span>';
  };
  const lojaPorId = {};
  D.lojas.forEach((l) => { lojaPorId[l.id] = l; });
  const trilho = (x) => '<span class="trilho" aria-hidden="true"><i style="width:' +
    (x === null ? 0 : Math.max(0, Math.min(100, 100 * x))).toFixed(1) + '%"></i></span>';
  let sel = 'todos';
  let filtroLojas = 'todas';
  let lojasNovasExp = [];
  const F = { dia: '', patio: '', farol: '', dia_hora: '' };
  const FILTROS = ['dia', 'patio', 'farol'];
  const quandoCod = (c) => (c ? c.slice(4, 6) + '/' + c.slice(2, 4) + ' ' + c.slice(6, 8) + 'h' : null);
  const ordem = {
    lojas: { k: 'arrem', dir: -1 },
    veic: { k: 'score', dir: 1 }, patios: { k: 'veiculos', dir: -1 }
  };
  const TABELAS = {};
  function tabela(id, cols, linhas, fixo) {
    TABELAS[id] = { cols: cols, linhas: linhas, fixo: fixo };
    desenhaTabela(id);
  }
  function desenhaTabela(id) {
    const t = TABELAS[id];
    const o = ordem[id];
    const col = t.cols.find((c) => c.k === o.k) || t.cols[0];
    const val = (r) => (col.v ? col.v(r) : r[col.k]);
    const idx = t.linhas.map((r, i) => [r, i]);
    idx.sort((a, b) => {
      if (t.fixo) {
        const fa = t.fixo(a[0]) ? 1 : 0;
        const fb = t.fixo(b[0]) ? 1 : 0;
        if (fa !== fb) return fa - fb;
      }
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
    $('#tb-' + id).innerHTML = idx.length
      ? idx.map((p, i) => '<tr>' + t.cols.map((c) => '<td class="' + (c.n ? 'n' : '') + (c.cls ? ' ' + c.cls : '') + '">' +
          (c.h ? c.h(p[0], i) : esc(p[0][c.k])) + '</td>').join('') + '</tr>').join('')
      : '<tr><td colspan="' + t.cols.length + '" class="dim">Nada neste recorte.</td></tr>';
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
  const LARG_PADRAO = 640;
  function colunas(alvo, grupos, series, rotX, op) {
    op = op || {};
    const LARG = op.largura || LARG_PADRAO;
    let ALT = 210;
    if (op.preenche) {
      const cx = alvo.getBoundingClientRect();
      if (cx.width > 0 && cx.height > 0) ALT = Math.max(180, Math.round(LARG * cx.height / cx.width));
    }
    const n = grupos.length;
    if (!n) { alvo.innerHTML = '<p class="dim">Sem acesso no período.</p>'; return; }
    const topoVal = Math.max(1, Math.max.apply(null, grupos.map((g) => Math.max.apply(null, series.map((s) => g[s.k])))));
    const larguraTexto = (v) => String(nf(v)).length * 6.2 + 4;
    const maiorRot = Math.max.apply(null, grupos.map((g) => Math.max.apply(null, series.map((s) => larguraTexto(g[s.k])))));
    const slot0 = (LARG - 8) / n;
    const barra0 = Math.min(24, (slot0 - 6 - 2 * (series.length - 1)) / series.length);
    const comRotulo = barra0 + 2 >= maiorRot;
    const esq = comRotulo ? 4 : 40;
    const slot = (LARG - esq - 4) / n;
    const barra = Math.max(2, Math.min(24, (slot - 6 - 2 * (series.length - 1)) / series.length));
    const topo = comRotulo ? 18 : 10;
    const base = ALT - 22;
    const h = (v) => (base - topo) * v / topoVal;
    let s = '<svg class="graf" viewBox="0 0 ' + LARG + ' ' + ALT + '" role="img" aria-label="' + esc(alvo.getAttribute('data-rot')) + '">';
    if (!comRotulo) {
      const passo = Math.pow(10, Math.floor(Math.log(topoVal) / Math.LN10)) / 10;
      const pas = Math.max(1, [1, 2, 5, 10, 20, 50].map((m) => m * passo).find((p) => topoVal / p <= 5) || passo * 100);
      for (let v = 0; v <= topoVal; v += pas) {
        const y = base - h(v);
        s += '<line class="linha-grade" x1="' + esq + '" x2="' + (LARG - 4) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>' +
          '<text class="eixo" x="' + (esq - 6) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end">' + nf(v) + '</text>';
      }
    } else {
      s += '<line class="linha-grade" x1="' + esq + '" x2="' + (LARG - 4) + '" y1="' + base + '" y2="' + base + '"/>';
    }
    const cadaX = Math.max(1, Math.ceil(n / Math.floor((LARG - esq) / 40)));
    grupos.forEach((g, i) => {
      const x0 = esq + i * slot;
      const chave = op.chave ? op.chave(g) : null;
      const marcado = chave !== null && chave === op.marcado;
      if (marcado) {
        s += '<rect class="marca-col" x="' + x0.toFixed(1) + '" y="' + topo + '" width="' + slot.toFixed(1) + '" height="' + (base - topo) + '"/>';
      }
      const larg = series.length * barra + 2 * (series.length - 1);
      const xi = x0 + (slot - larg) / 2;
      series.forEach((se, j) => {
        const v = g[se.k];
        const hh = h(v);
        const x = xi + j * (barra + 2);
        const y = base - hh;
        const r = Math.min(4, barra / 2, hh);
        if (hh > 0) {
          s += '<path class="' + se.cls + '" d="M' + x.toFixed(1) + ' ' + base + 'V' + (y + r).toFixed(1) +
            'Q' + x.toFixed(1) + ' ' + y.toFixed(1) + ' ' + (x + r).toFixed(1) + ' ' + y.toFixed(1) +
            'H' + (x + barra - r).toFixed(1) + 'Q' + (x + barra).toFixed(1) + ' ' + y.toFixed(1) + ' ' +
            (x + barra).toFixed(1) + ' ' + (y + r).toFixed(1) + 'V' + base + 'Z"/>';
        }
        if (comRotulo && v > 0) {
          s += '<text class="rotulo" x="' + (x + barra / 2).toFixed(1) + '" y="' + (y - 5).toFixed(1) + '" text-anchor="middle">' + nf(v) + '</text>';
        }
      });
      if (i % cadaX === 0 || marcado) {
        s += '<text class="eixo' + (marcado ? ' forte' : '') + '" x="' + (x0 + slot / 2).toFixed(1) + '" y="' + (ALT - 6) + '" text-anchor="middle">' + esc(rotX(g)) + '</text>';
      }
      const txt = '<b>' + esc(rotX(g)) + '</b>' + series.map((se) => '<br><span class="amostra ' + se.cls + '"></span>' +
        esc(se.nome) + ': ' + nf(g[se.k])).join('') + (chave !== null ? '<br><span class="dim">' +
        (marcado ? 'clique para voltar a todos os dias' : 'clique para ver as horas deste dia') + '</span>' : '');
      s += '<rect class="alvo' + (chave !== null ? ' clicavel' : '') + '" x="' + x0.toFixed(1) + '" y="' + topo + '" width="' + slot.toFixed(1) + '" height="' + (base - topo + 22) +
        '" tabindex="0" data-dica="' + esc(txt) + '"' + (chave !== null ? ' data-k="' + esc(chave) + '"' : '') + '/>';
    });
    alvo.innerHTML = s + '</svg>';
  }
  function funil(alvo, etapas) {
    const W = 640;
    const COL_ROT = 120;
    const COL_PC = 60;
    const FW = W - COL_ROT - COL_PC - 16;
    const ALT_F = 38;
    const VAO = 20;
    const v0 = etapas[0][1] || 0;
    const MIN_F = 3 * 7.4 + 16;
    const larg = etapas.map((f) => MIN_F + (FW - MIN_F) * (v0 ? f[1] / v0 : 0));
    const H = etapas.length * ALT_F + (etapas.length - 1) * VAO;
    const c = COL_ROT + 8 + FW / 2;
    let s = '<svg class="graf funil-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Funil de ativação dos novos cadastros">';
    etapas.forEach((f, i) => {
      const y = i * (ALT_F + VAO);
      const meio = y + ALT_F / 2 + 4.5;
      const wt = larg[i];
      const wb = i < etapas.length - 1 ? larg[i + 1] : Math.max(MIN_F, larg[i] * 0.94);
      const pts = [[c - wt / 2, y], [c + wt / 2, y], [c + wb / 2, y + ALT_F], [c - wb / 2, y + ALT_F]]
        .map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
      const pcTot = v0 ? pc0(f[1] / v0) : '—';
      const ant = i > 0 ? etapas[i - 1][1] : null;
      const txtN = nf(f[1]);
      const cabe = Math.min(wt, wb) >= txtN.length * 7.4 + 14;
      s += '<text class="f-rot" x="0" y="' + meio + '">' + esc(f[0]) + '</text>' +
        '<polygon class="f-forma" points="' + pts + '" tabindex="0" data-dica="' +
        esc('<b>' + esc(f[0]) + '</b><br>' + txtN + ' lojas · ' + pcTot + ' dos cadastrados' +
          (i ? '<br>' + (ant ? pc(f[1] / ant) : '—') + ' da etapa anterior' : '')) + '"/>' +
        (cabe
          ? '<text class="f-txt" x="' + c + '" y="' + meio + '" text-anchor="middle">' + txtN + '</text>'
          : '<text class="f-txt" x="' + (c + Math.max(wt, wb) / 2 + 6).toFixed(1) + '" y="' + meio + '">' + txtN + '</text>') +
        '<text class="f-pc" x="' + W + '" y="' + meio + '" text-anchor="end">' + pcTot + '</text>';
      if (i < etapas.length - 1) {
        s += '<text class="f-conv" x="' + c + '" y="' + (y + ALT_F + VAO / 2 + 4) + '" text-anchor="middle">' +
          '↓ ' + (etapas[i][1] ? pc(etapas[i + 1][1] / etapas[i][1]) : '—') + '</text>';
      }
    });
    alvo.innerHTML = s + '</svg>';
  }
  const UF_NOME = {
    AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapá', BA: 'Bahia', CE: 'Ceará',
    DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MG: 'Minas Gerais',
    MS: 'Mato Grosso do Sul', MT: 'Mato Grosso', PA: 'Pará', PB: 'Paraíba', PE: 'Pernambuco',
    PI: 'Piauí', PR: 'Paraná', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RO: 'Rondônia',
    RR: 'Roraima', RS: 'Rio Grande do Sul', SC: 'Santa Catarina', SE: 'Sergipe', SP: 'São Paulo',
    TO: 'Tocantins'
  };
  const SIGLA_CABE = 0.12;
  function regioes(alvo, lista) {
    const total = lista.reduce((t, r) => t + r.total, 0);
    if (!total) { alvo.innerHTML = '<p class="dim">Nenhum cadastro da campanha no período.</p>'; return; }
    const maior = Math.max.apply(null, lista.map((r) => r.total));
    const plural = (n, um, varios) => nf(n) + ' ' + (n === 1 ? um : varios);
    alvo.innerHTML = lista.map((r) => {
      const segs = r.ufs.map((u) => {
        const nome = u.uf ? u.uf + ' · ' + (UF_NOME[u.uf] || u.uf) : 'Sem UF válida no endereço';
        const txt = '<b>' + esc(nome) + '</b><br>' + plural(u.total, 'lojista', 'lojistas') + ' · ' +
          pc(u.total / total) + ' do total' +
          '<br>Acessaram: ' + nf(u.acessaram) + ' · Ofertaram: ' + nf(u.ofertaram) + ' · Compraram: ' + nf(u.compraram);
        const cabe = u.uf && u.total / maior >= SIGLA_CABE;
        return '<span class="reg-seg" style="flex-grow:' + u.total + '" tabindex="0" data-dica="' + esc(txt) + '">' +
          (cabe ? esc(u.uf) : '') + '</span>';
      }).join('');
      const leg = r.ufs.map((u) => '<span class="reg-uf"><span class="amostra serie-b"></span>' +
        (u.uf ? esc(u.uf) : 'sem UF') + ' <b class="num">' + nf(u.total) + '</b></span>').join('');
      return '<div class="reg-linha">' +
        '<span class="reg-nome">' + esc(r.regiao) + '</span>' +
        '<span class="reg-trilho"><span class="reg-barra" style="width:' + (100 * r.total / maior).toFixed(2) + '%">' + segs + '</span></span>' +
        '<span class="reg-val num"><b>' + nf(r.total) + '</b> <span class="dim">' + pc0(r.total / total) + '</span></span>' +
        '<span class="reg-leg">' + leg + '</span>' +
        '</div>';
    }).join('');
  }
  function opcoes(id, lista, rotTodos, atual) {
    const el = $('#' + id);
    el.innerHTML = '<option value="">' + esc(rotTodos) + '</option>' + lista.map((o) =>
      '<option value="' + esc(o[0]) + '"' + (o[0] === atual ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('');
    el.value = lista.some((o) => o[0] === atual) ? atual : '';
    return el.value;
  }
  function montaFiltros() {
    const base = calcula(D, sel, {});
    if (F.dia && base.dias_periodo.indexOf(F.dia) < 0) F.dia = '';
    F.patio = opcoes('f-patio', base.patios_evento.map((p) => [p, p]), 'Todos os pátios', F.patio);
    F.farol = opcoes('f-farol', [['sem', FAROL.sem], ['abaixo', FAROL.abaixo], ['atingiu', FAROL.atingiu]], 'Todos os status', F.farol);
    if (F.dia_hora && base.dias_periodo.indexOf(F.dia_hora) < 0) F.dia_hora = '';
  }
  function contaFiltros() {
    const n = FILTROS.filter((k) => k !== 'dia' && F[k]).length;
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
  [['f-patio', 'patio'], ['f-farol', 'farol']].forEach((p) => {
    $('#' + p[0]).addEventListener('change', (ev) => {
      F[p[1]] = ev.target.value;
      render();
    });
  });
  $('#limpar').addEventListener('click', () => {
    FILTROS.forEach((k) => { F[k] = ''; });
    F.dia_hora = '';
    sel = 'todos';
    alterna('seg-lojas', 'todas', (v) => { filtroLojas = v; });
    montaFiltros();
    render();
  });
  function render() {
    contaFiltros();
    const R = calcula(D, sel, F);
    const k = R.kpi;
    const ev = sel === 'todos' ? null : R.eventos[0];
    $('#sub').textContent = (ev
      ? ev.nome + ' · ' + dt(ev.ini) + ' → ' + dt(ev.fim) + ' · ' + ev.estado
      : 'IGA · ' + D.eventos.length + (D.eventos.length === 1 ? ' evento' : ' eventos') + ' da Fenauto de ' +
        dia(D.mes[0]).slice(0, 5) + ' a ' + diaAntes(D.mes[1]).slice(0, 5) +
        (R.periodo[0] ? ' · ' + dt(R.periodo[0]) + ' → ' + dt(R.periodo[1]) : '')) +
      (FILTROS.some((x) => F[x]) ? ' · com filtros' : '');
    document.querySelectorAll('#f-eventos button').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.getAttribute('data-e') === String(sel))));
    const pcBar = (idTxt, idBar, x, rot) => {
      $(idTxt).textContent = x === null ? '—' : pc(x) + ' ' + rot;
      $(idBar).innerHTML = trilho(x);
    };
    $('#k-pub').textContent = nf(k.publicados);
    pcBar('#k-pub-pc', '#k-pub-bar', k.publicados ? k.acessados / k.publicados : null, 'dos anúncios acessados');
    $('#k-pub-vend').textContent = nf(k.vendidos);
    $('#k-pub-vmv').textContent = nf(k.vmv_atingido);
    $('#k-of').textContent = nf(k.com_oferta);
    pcBar('#k-of-pc', '#k-of-bar', k.publicados ? k.com_oferta / k.publicados : null, 'dos publicados');
    $('#k-of-lj').textContent = nf(k.ofertantes);
    $('#k-of-lpl').textContent = n1(k.lances_por_lojista);
    $('#k-vd').textContent = nf(k.vendidos);
    pcBar('#k-vd-pc', '#k-vd-bar', k.publicados ? k.vendidos / k.publicados : null, 'dos publicados');
    $('#k-vd-comp').textContent = nf(k.compradores);
    $('#k-vd-ppl').textContent = n1(k.part_por_lojista);
    $('#k-pf').textContent = rs(k.volume);
    pcBar('#k-pf-pc', '#k-pf-bar', k.pc_vendido_vmv, 'da soma dos VMV publicados');
    const pcPe = (id, x) => { $(id).innerHTML = (x === null ? '—' : pc(x)) + trilho(x); };
    pcPe('#k-pf-fipe', k.pc_arrem_fipe);
    pcPe('#k-pf-vmv', k.pc_arrem_vmv);
    $('#k-nv').textContent = nf(k.novas);
    pcBar('#k-nv-pc', '#k-nv-bar', k.engajamento, 'de engajamento');
    $('#k-nv-ac').textContent = nf(k.novas_acessaram);
    $('#k-nv-of').textContent = nf(k.novas_ofertaram);
    $('#k-nv-cp').textContent = nf(k.novas_compraram);
    $('#k-rt').textContent = nf(k.reativadas);
    pcBar('#k-rt-pc', '#k-rt-bar', k.engaj_reativadas, 'de engajamento');
    $('#k-rt-ac').textContent = nf(k.reativadas_acessaram);
    $('#k-rt-of').textContent = nf(k.reativadas_ofertaram);
    $('#k-rt-cp').textContent = nf(k.reativadas_compraram);
    const tipoVis = filtroLojas === 'novas' ? 'N' : filtroLojas === 'reativadas' ? 'R' : '';
    const lojasVis = R.lojas.filter((r) => (r.nova || r.acessos > 0) && (!tipoVis || r.nova === tipoVis));
    const um = lojasVis.length === 1;
    $('#n-lojas').textContent = lojasVis.length + (tipoVis === 'N' ? (um ? ' loja nova' : ' lojas novas')
      : tipoVis === 'R' ? (um ? ' loja reativada' : ' lojas reativadas') : (um ? ' loja' : ' lojas'));
    lojasNovasExp = R.lojas.filter((r) => r.nova);
    tabela('lojas', [
      { k: 'nome', t: 'Loja', h: (r) => esc(r.nome) + (r.nova && !tipoVis ? ' ' + seloTipo(r.nova, 'a') : '') },
      { k: 'pri', t: 'Primeiro acesso', n: true, h: (r) => esc(quandoCod(r.pri) || '—') },
      { k: 'ult', t: 'Último acesso', n: true, h: (r) => esc(quandoCod(r.ult) || '—') },
      { k: 'acessos', t: 'Acessos', n: true, h: (r) => nf(r.acessos) },
      { k: 'lances', t: 'Ofertas', n: true, h: (r) => nf(r.lances) },
      { k: 'veic', t: 'Veículos', n: true, h: (r) => nf(r.veic) },
      { k: 'arrem', t: 'Recuperações', n: true, h: (r) => nf(r.arrem) }
    ], lojasVis);
    $('#n-funil').textContent = nf(R.funil[0][1]) + ' cadastros';
    $('#f-dias').innerHTML = [['', 'Todos']].concat(R.dias_periodo.map((c) => [c, diaCod(c)]))
      .map((o) => '<button type="button" data-d="' + o[0] + '" aria-pressed="' + (F.dia === o[0]) + '">' + esc(o[1]) + '</button>').join('');
    funil($('#funil'), R.funil);
    const nReg = R.regioes.reduce((t, r) => t + r.total, 0);
    const nUf = R.regioes.reduce((t, r) => t + r.ufs.filter((u) => u.uf).length, 0);
    $('#n-regiao').textContent = nf(nReg) + (nReg === 1 ? ' lojista' : ' lojistas') +
      ' · ' + nUf + (nUf === 1 ? ' UF' : ' UFs');
    regioes($('#g-regiao'), R.regioes);
    $('#n-dia').textContent = nf(k.lojas_ranking_acessaram) + (k.lojas_ranking_acessaram === 1 ? ' loja' : ' lojas');
    colunas($('#g-dia'), R.por_dia, [
      { k: 'total', nome: 'Total', cls: 'serie-b' },
      { k: 'novas', nome: 'Novos', cls: 'serie-a' },
      { k: 'reativadas', nome: 'Reativados', cls: 'serie-c' }
    ], (g) => diaCod(g.dia), { preenche: true, chave: (g) => g.dia, marcado: F.dia_hora });
    $('#n-hora').textContent = nf(k.acessos) + ' acessos';
    $('#hora-dia').innerHTML = F.dia_hora
      ? 'em ' + diaCod(F.dia_hora) + ' <button type="button" class="limpa-dia" id="limpa-dia">todos os dias ✕</button>'
      : '';
    colunas($('#g-hora'), R.por_hora, [
      { k: 'total', nome: 'Total', cls: 'serie-b' },
      { k: 'novas', nome: 'Novos', cls: 'serie-a' },
      { k: 'reativadas', nome: 'Reativados', cls: 'serie-c' }
    ], (g) => g.h + 'h', { largura: 1280 });
    $('#n-patios').textContent = R.patios.length + ' pátios';
    tabela('patios', [
      { k: 'patio', t: 'Pátio', cls: 'sem-quebra' },
      { k: 'veiculos', t: 'Veículos', n: true, h: (p) => nf(p.veiculos) },
      { k: 'acesso', t: 'C/ acesso', n: true, h: (p) => nf(p.acesso) },
      { k: 'oferta', t: 'C/ oferta', n: true, h: (p) => nf(p.oferta) },
      { k: 'conversao', t: '% conversão', n: true, h: (p) => pc(p.conversao) },
      { k: 'vmv', t: 'C/ VMV atingido', n: true, h: (p) => nf(p.vmv) },
      { k: 'pc_vmv', t: '% C/ VMV atingido', n: true, h: (p) => pc(p.pc_vmv) }
    ], R.patios);
    $('#n-veic').textContent = R.veiculos.length + ' veículos';
    tabela('veic', [
      { k: 'nome', t: 'Veículo', h: (v) => '<span class="farol ' + v.farol + '" title="' + FAROL[v.farol] + '"></span>' +
        (v.link ? '<a href="' + esc(v.link) + '" target="_blank" rel="noopener">' + esc(v.nome) + ' ↗</a>' : esc(v.nome)) +
        '<span class="dim sub">' + esc(v.ano) + ' · ' + esc(v.patio) + (v.n_ev > 1 ? ' · em ' + v.n_ev + ' eventos' : '') + '</span>' },
      { k: 'acessos', t: 'Acessos', n: true, h: (v) => nf(v.acessos) },
      { k: 'qtd', t: 'Ofertas', n: true, h: (v) => nf(v.qtd) },
      { k: 'ult', t: 'Última oferta', n: true, h: (v) => rs(v.ult) + (v.ult_quando ? '<span class="dim sub">' + dt(v.ult_quando) + '</span>' : '') },
      { k: 'fipe', t: 'FIPE', n: true, h: (v) => rs(v.fipe) },
      { k: 'pfipe', t: '% FIPE', n: true, cls: 'c-vmv', h: (v) => (v.pfipe === null ? '<span class="dim">—</span>'
        : '<span class="vmv">' + trilho(v.pfipe) + '<span class="num">' + pc0(v.pfipe) + '</span></span>') },
      { k: 'pvmv', t: '% VMV', n: true, cls: 'c-vmv', h: (v) => (v.pvmv === null ? '<span class="dim">—</span>'
        : '<span class="vmv' + (v.pvmv >= 1 ? ' ok' : '') + '">' + trilho(v.pvmv) + '<span class="num">' + pc0(v.pvmv) + '</span></span>') },
      { k: 'score', t: 'Score', n: true, cls: 'forte', h: (v) => n1(v.score) },
      { k: 'status', t: 'Resultado', v: (v) => D.status_nome[v.status] || '', h: (v) => {
        if (v.arrematante === null) return tagStatus(v);
        const l = lojaPorId[v.arrematante] || {};
        return tagStatus(v) + '<span class="dim sub">' + esc(l.nome || ('loja ' + v.arrematante)) +
          (R.nova[v.arrematante] ? ' ' + seloTipo(R.nova[v.arrematante], 'o') : '') + '</span>';
      } }
    ], R.veiculos);
  }
  function seloTipo(t, g) {
    return t === 'R' ? '<span class="tag reat">reativad' + g + '</span>' : '<span class="tag ok">nov' + g + '</span>';
  }
  function alterna(id, valor, aplica) {
    document.querySelectorAll('#' + id + ' button').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === valor)));
    aplica(valor);
  }
  $('#seg-lojas').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-v]');
    if (!b) return;
    alterna('seg-lojas', b.getAttribute('data-v'), (v) => { filtroLojas = v; });
    render();
  });
  $('#f-dias').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-d]');
    if (!b) return;
    F.dia = b.getAttribute('data-d');
    F.dia_hora = '';
    render();
  });
  $('#g-dia').addEventListener('click', (ev) => {
    const r = ev.target.closest('rect[data-k]');
    if (!r) return;
    const c = r.getAttribute('data-k');
    F.dia_hora = F.dia_hora === c ? '' : c;
    escondeDica();
    render();
  });
  $('#g-dia').addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    const r = ev.target.closest('rect[data-k]');
    if (!r) return;
    ev.preventDefault();
    r.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  document.addEventListener('click', (ev) => {
    if (!ev.target.closest('#limpa-dia')) return;
    F.dia_hora = '';
    render();
  });
  document.addEventListener('click', (ev) => {
    if (!ev.target.closest('#exporta-novas')) return;
    const asp = String.fromCharCode(34);
    const cel = (v) => (typeof v === 'number' ? String(v) : asp + String(v === null || v === undefined ? '' : v).split(asp).join(asp + asp) + asp);
    const cab = ['Loja', 'Tipo', 'Primeiro acesso', 'Último acesso', 'Acessos', 'Ofertas', 'Veículos', 'Recuperações'];
    const linhas = lojasNovasExp.map((r) => [r.nome, r.nova === 'R' ? 'Reativado' : 'Novo', quandoCod(r.pri), quandoCod(r.ult), r.acessos, r.lances, r.veic, r.arrem]);
    const nl = String.fromCharCode(13, 10);
    const txt = String.fromCharCode(65279) + [cab].concat(linhas).map((l) => l.map(cel).join(';')).join(nl) + nl;
    const url = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'novos-lojistas-mega-evento-fenauto-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
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
  window.addEventListener('resize', () => {
    clearTimeout(espera);
    espera = setTimeout(render, 150);
  });
  const evOrd = D.eventos.slice().sort((a, b) => (a.ini < b.ini ? -1 : a.ini > b.ini ? 1 : a.id - b.id));
  $('#f-eventos').innerHTML = '<button type="button" data-e="todos" aria-pressed="true">Todos <span class="ev-n">' +
    D.eventos.length + '</span></button>' +
    evOrd.map((e) => {
      const est = calcula(D, e.id).eventos[0].estado;
      return '<button type="button" data-e="' + e.id + '" aria-pressed="false" title="' +
        esc(e.nome + ' · ' + dt(e.ini) + ' → ' + dt(e.fim) + ' · ' + est) + '">' +
        esc(e.nome) + '<span class="ev-est">' + esc(est) + '</span></button>';
    }).join('');
  $('#f-eventos').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-e]');
    if (!b) return;
    const v = b.getAttribute('data-e');
    sel = v === 'todos' ? 'todos' : Number(v);
    montaFiltros();
    render();
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
  $('#base').textContent = D.eventos.length + (D.eventos.length === 1 ? ' evento' : ' eventos') +
    ' da Fenauto no IGA abertos de ' + dia(D.mes[0]) + ' a ' + diaAntes(D.mes[1]);
  const ICO = {
    claro: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    escuro: '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>'
  };
  function tema(t) {
    document.documentElement.dataset.tema = t;
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
DADOS.glossario = [
  ['Evento no painel', 'Evento do IGA (tem veículo do Itaú Unibanco, do Repasse Itaú ou da IGA Participações) com "Fenauto" no nome, aberto em algum momento do mês corrente: os em andamento, os agendados e os já encerrados. Os eventos do C6 (os que alvejam o Canal de vendas C6 Auto) ficam fora. Evento aberto por mais de 31 dias não entra.'],
  ['Evento', 'Os botões acima da Data: Todos e um por evento do mês, na ordem de início, com o estado. Escolher um evento recorta o painel inteiro para ele: veículos, lances, acessos, novos lojistas e os dias da Data.'],
  ['Período', 'Da menor data de início à maior data de encerramento dos eventos filtrados. Acesso fora dele não conta. Os novos lojistas têm regra própria (veja Novos lojistas).'],
  ['Um veículo só', 'O mesmo carro que não vendeu num evento pode voltar no seguinte, com uma negociação nova. Nos números de veículos (publicados, com ofertas, VMV atingido, vendidos, anúncios acessados, pátios) e na lista, ele conta uma vez: com oferta, VMV atingido, acessado ou vendido se foi em algum dos eventos do recorte. Na lista, uma linha com o resultado da negociação que vendeu (ou da mais recente), as ofertas dos eventos somadas, a maior e a última de todas, e as lojas distintas que abriram os anúncios dele; embaixo, em quantos eventos ele esteve. Os lances continuam todos.'],
  ['Filtros', 'Na aba lateral. Pátio e status do veículo recortam os veículos, e tudo que nasce deles acompanha: lances, ofertantes, compradores, rankings, pátios e os degraus do funil que dependem de anúncio. Evento e data ficam nos botões acima do funil.'],
  ['Estado do evento', 'Agendado: as ofertas ainda não abriram. Em andamento: dentro do horário. Encerrando: passou do horário de fim e ainda há veículo ativo — os lances da prorrogação caem depois do fim oficial. Encerrado: nenhum veículo ativo.'],
  ['Veículo publicado', 'Cada negociação do evento. O mesmo carro em dois eventos conta uma vez em cada um.'],
  ['Anúncios acessados', 'Veículos que pelo menos uma loja abriu dentro do horário do evento, sobre os publicados.'],
  ['Com ofertas', 'Veículo que recebeu pelo menos um lance naquele evento. O percentual é sobre os publicados.'],
  ['Com VMV atingido', 'Veículo em que alguma oferta alcançou o valor mínimo de venda (VMV) que o vendedor aceita.'],
  ['Vendido / recuperação', 'Negociação em aguardando pagamento, aguardando confirmação de pagamento ou vendido. A loja compradora é a da oferta vencedora; o valor da recuperação, o dessa oferta. Veículo em análise do vendedor ainda não conta. A venda cuja oferta vencedora foi lançada por um usuário interno, sem loja, conta nos vendidos e no valor vendido, mas não nos compradores.'],
  ['Ofertantes', 'Lojas distintas que deram pelo menos um lance.'],
  ['Compradores', 'Lojas distintas que compraram pelo menos um veículo.'],
  ['Lances/lojista', 'Lances do recorte divididos pelos ofertantes.'],
  ['Participações/lojista', 'Participação é cada veículo em que a loja deu lance (vários lances no mesmo carro contam uma vez). Soma das participações dividida pelos ofertantes.'],
  ['Novos lojistas', 'Lojas cadastradas a partir de ' + DIA_INICIO_NOVAS + ' com um usuário no grupo ' + GRUPO_NOVAS +
    '. Ficam fora os usuários internos, os cadastros de teste e as contas do banco. Vale o dia do cadastro: a loja conta em todo evento que termina nesse dia ou depois, então quem se cadastrou antes do primeiro dia do evento entra no total, mas em nenhum botão de Data. Com o filtro de Data, só quem se cadastrou naquele dia. A barra é o engajamento (quantas acessaram o evento); embaixo, quantas acessaram, ofertaram e compraram no recorte.'],
  ['Reativados', 'Lojas antigas do grupo ' + GRUPO_NOVAS + ' que não compraram nada nos ' + MESES_NOVAS + ' meses antes de ' + DIA_INICIO_NOVAS +
    ' e acessaram a plataforma a partir de ' + DIA_INICIO_NOVAS + '. Os compradores desses ' + MESES_NOVAS +
    ' meses ficam fora (aparecem só nos acessos), como os internos, os testes e as contas do banco. Vale o dia do primeiro acesso a partir de ' +
    DIA_INICIO_NOVAS + ', com a mesma regra dos novos lojistas para evento e Data. A barra e o pé, como no cartão de novos lojistas.'],
  ['Data', 'Os botões acima do funil: Todos e um por dia do período do evento escolhido. Escolher um dia encolhe o painel inteiro para aquele dia: novos lojistas e reativados (os que entraram naquele dia) e funil, acessos (gráficos e ranking) e negociações (lances, vendas pela data da oferta vencedora, compradores). A lista de veículos não muda, e o score, as ofertas e o farol de cada veículo continuam os dele.'],
  ['Performance financeira', 'O valor total vendido no recorte. Logo abaixo, esse valor dividido pela soma dos VMV de todos os veículos publicados, vendidos ou não. No pé, a soma das recuperações dividida pela soma da FIPE (só dos vendidos com FIPE) e pela soma dos VMV (só dos vendidos com VMV).'],
  ['Exportar novos lojistas', 'Botão do ranking de lojas: baixa um CSV com as lojas novas e as reativadas do recorte (com ou sem acesso), nas mesmas colunas da tabela e com a coluna Tipo. Respeita os filtros da gaveta e o de Data; o botão Todos lojistas / Novos / Reativados não muda o arquivo.'],
  ['Engajamento', 'Novos lojistas que acessaram o evento no período divididos pelos cadastrados.'],
  ['Acessos da loja', 'Dias em que a loja acessou o EVENTO (acesso registrado com o evento) dentro do período; entrar no canal sem abrir o evento não conta. O corte do período é por hora cheia: num evento que começa às 17:13, o acesso das 17:05 entra. O ranking de lojas mostra só quem acessou.'],
  ['Acessos do veículo', 'Lojas distintas que abriram o anúncio dentro do horário do evento. Uma loja que abriu dez vezes conta uma.'],
  ['Score do veículo', 'Acessos × ' + PESO_SCORE.acesso + ' + ofertas × ' + PESO_SCORE.oferta + ' + ' + PESO_SCORE.vmv +
    ' se alguma oferta atingiu o VMV, levado para uma escala de 0 a 100: 100 é o veículo de maior score da coleta inteira. A tabela abre pelo menor score: os veículos que menos engajaram. Score, ofertas e farol são do veículo inteiro: os filtros escolhem quais veículos aparecem, não os recalculam.'],
  ['% VMV', 'A maior oferta do veículo dividida pelo VMV. 100% ou mais = VMV atingido.'],
  ['% FIPE', 'A maior oferta do veículo dividida pela FIPE dele. Só para quem recebeu oferta e tem FIPE; os demais ficam com "—".'],
  ['Resultado', 'O status da negociação e, quando vendeu, a loja compradora — com o selo "novo" ou "reativado" se é loja nova ou reativada do período.'],
  ['Primeiro e último acesso', 'O primeiro e o último acesso da loja ao evento dentro do período, na hora cheia (a coleta guarda o acesso por hora).'],
  ['Pátio', 'Onde o veículo está (o estoque do anúncio). C/ acesso: veículos que alguma loja abriu. % conversão: veículos com oferta sobre os veículos do pátio. % C/ VMV atingido: veículos com VMV atingido sobre os veículos do pátio.'],
  ['Acessos únicos por dia', 'O mesmo indicador da coluna Acessos do ranking de lojas, dia a dia: quantas lojas do ranking (as que ofertaram, as novas e as reativadas) acessaram o evento em cada dia do período — total, novas e reativadas. Somando as colunas dá a soma da coluna Acessos. Clicar num dia mostra as horas daquele dia no gráfico por hora; clicar de novo volta a todos os dias.'],
  ['Acessos por hora', 'A mesma medida dos acessos únicos por dia, contada por hora: quantas lojas do ranking (as que ofertaram, as novas e as reativadas) acessaram o evento em cada hora do dia — cada loja conta uma vez por hora em cada dia. Total, novas e reativadas, do primeiro ao último horário com acesso. Clicando num dia do gráfico por dia, só aquele dia.'],
  ['Funil de ativação', 'Os novos lojistas do período (sem os reativados, que têm o cartão próprio), etapa por etapa: o título à esquerda, o percentual sobre os cadastrados à direita, e a largura da faixa seguindo esse percentual: uma largura mínima (para o número caber dentro) somada em todas as etapas, mais a parte proporcional. Entre as faixas, a passagem de uma etapa para a seguinte. Aprovado: cadastro na situação 3, a de loja operante. Acessaram: acessaram o evento dentro do período — é o mesmo número do engajamento do cartão de novos lojistas. Ofertaram e compraram: no recorte.'],
  [TITULO_REGIAO, 'Só as lojas cadastradas pela campanha da Fenauto ' + ANO_CAMPANHA + ' do IGA (o formulário de cadastro com "Fenauto ' + ANO_CAMPANHA + ' IGA"), pela UF do endereço cadastrado da loja — o do CNPJ, não o do pátio do veículo. A campanha inteira, em qualquer data; escolhendo um dia em Data, só os cadastros daquele dia. O Evento não recorta: a campanha é da feira, não de um evento. Uma barra por região, do maior para o menor, com o total e o percentual sobre todos os cadastros; dentro, um pedaço por UF, também do maior para o menor, e embaixo a legenda das UFs com o número de cada uma. Passar o mouse num pedaço mostra quantos acessaram o evento, ofertaram e compraram no recorte. Loja sem UF válida no endereço fica em Não identificada.'],
  ['Farol', 'A bolinha antes do veículo. Vermelho: sem oferta. Amarelo: há oferta, mas nenhuma chegou ao VMV (ou o VMV não foi informado). Verde: alguma oferta alcançou o VMV.'],
  ['Link do anúncio', 'Abre o anúncio no cars2you.com.br, a vitrine dos eventos do IGA.']
];
const CSS_PAINEL = [
  ':root{--farol-abaixo:#946200}',
  '[data-tema="escuro"]{--farol-abaixo:#E3B341}',
  '[hidden]{display:none!important}',
  '.marca.logo-iga,.marca.logo-fen{line-height:0}',
  '.marca.logo-iga{justify-self:start}.marca.logo-fen{justify-self:end}',
  '.logo-iga svg{display:block;height:44px;width:auto;aspect-ratio:107/48}',
  '.logo-iga .iga-t{fill:#000D3C}.logo-iga .iga-a{fill:#001FBD}',
  '[data-tema="escuro"] .logo-iga .iga-t{fill:#FFFFFF}[data-tema="escuro"] .logo-iga .iga-a{fill:#7C93FF}',
  '.logo-fen svg{display:block;height:44px;width:auto;aspect-ratio:1076/298.3}',
  '.logo-fen path,.logo-fen g{fill:#000D3C}',
  '[data-tema="escuro"] .logo-fen path,[data-tema="escuro"] .logo-fen g{fill:#FFFFFF}',
  '.sob-topo{max-width:1680px;margin:0 auto;padding:10px 20px 0;display:flex;justify-content:flex-end;align-items:center;gap:8px;justify-self:stretch}',
  '@media (max-width:620px){.logo-iga svg,.logo-fen svg{height:26px}.topo-in{grid-template-columns:auto minmax(0,1fr) auto}',
  '.sob-topo{padding:8px 12px 0}',
  '.topo-tit h1,.topo-tit .sub{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.topo-tit h1{font-size:15px}.topo-tit .sub{font-size:11px}}',
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
  '.kpi-pe .trilho{height:4px;margin-top:5px;min-width:0}',
  '.g4.g5{grid-template-columns:repeat(6,minmax(0,1fr))}',
  '@media (max-width:1400px){.g4.g5{grid-template-columns:repeat(3,minmax(0,1fr))}}',
  '@media (max-width:900px){.g4.g5{grid-template-columns:repeat(2,minmax(0,1fr))}}',
  '@media (max-width:620px){.g4.g5{grid-template-columns:1fr}}',
  '.seg{display:inline-flex;padding:2px;gap:2px;border-radius:var(--r-p);background:var(--superficie-2);border:1px solid var(--borda)}',
  '.seg button{font:inherit;font-size:12px;font-weight:600;color:var(--texto-2);background:transparent;border:0;',
  'border-radius:8px;padding:5px 10px;cursor:pointer}',
  '.seg button[aria-pressed="true"]{background:var(--acento);color:var(--superficie)}',
  '.seg button:focus-visible{outline:2px solid var(--acento);outline-offset:1px}',
  '.cartao-topo{flex-wrap:wrap}',
  'button.ord{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;display:inline-flex;gap:4px;',
  'align-items:center;white-space:nowrap;text-align:inherit}',
  'button.ord.at{color:var(--texto)}button.ord:focus-visible{outline:2px solid var(--acento);outline-offset:2px}',
  '.seta-ord{font-size:9px;min-width:8px}th.n button.ord{flex-direction:row-reverse}',
  '.rolo.alto{max-height:560px;overflow:auto}.rolo.medio{max-height:440px;overflow:auto}',
  'table.dens thead th{text-align:left}table.dens tbody td{text-align:left}',
  'table.dens td.n,table.dens th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}',
  'table.dens td.forte{font-weight:700}table.dens td.sem-quebra{white-space:nowrap}',
  'table.dens a{color:var(--texto);text-decoration:underline;text-underline-offset:2px}',
  '.dim{color:var(--texto-3)}.sub{display:block;font-size:11px}',
  '.farol{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px;vertical-align:1px}',
  '.farol.sem{background:var(--negativo)}.farol.abaixo{background:var(--farol-abaixo)}.farol.atingiu{background:var(--positivo)}',
  'td.c-vmv{min-width:120px}.vmv{display:inline-flex;align-items:center;gap:8px;justify-content:flex-end;width:100%}',
  '.vmv .trilho{width:64px;flex:none}.vmv.ok .trilho i{background:var(--positivo)}',
  '.g2i{display:grid;gap:var(--gap);grid-template-columns:1fr 1fr}@media (max-width:1100px){.g2i{grid-template-columns:1fr}}',
  '.g2i > .cartao,.g2 > .cartao{min-width:0}',
  '.g3i{display:grid;gap:var(--gap);grid-template-columns:repeat(3,minmax(0,1fr))}.g3i > .cartao{min-width:0}',
  '@media (max-width:1400px){.g3i{grid-template-columns:1fr 1fr}.g3i > .c-dia{grid-column:1 / -1}}',
  '@media (max-width:860px){.g3i{grid-template-columns:1fr}}',
  '.reg-lista{flex:1;display:flex;flex-direction:column;justify-content:center;gap:12px}',
  '.reg-linha{display:grid;grid-template-columns:112px minmax(0,1fr) auto;column-gap:10px;row-gap:5px;align-items:center}',
  '.reg-nome{font-size:13px;font-weight:600;color:var(--texto)}',
  '.reg-trilho{display:block;min-width:0}',
  '.reg-barra{display:flex;gap:2px;height:22px;min-width:3px}',
  '.reg-seg{flex-basis:0;min-width:3px;background:var(--serie-2);display:flex;align-items:center;justify-content:center;',
  'overflow:hidden;white-space:nowrap;font-size:11px;font-weight:700;color:var(--superficie);cursor:default}',
  '.reg-barra > .reg-seg:last-child{border-radius:0 4px 4px 0}',
  '.reg-seg:hover,.reg-seg:focus{filter:brightness(1.12);outline:none}',
  '.reg-val{font-size:13px;color:var(--texto);text-align:right;white-space:nowrap}.reg-val .dim{font-size:12px}',
  '.reg-leg{grid-column:2 / 4;display:flex;flex-wrap:wrap;gap:3px 12px;font-size:11.5px;color:var(--texto-2)}',
  '.reg-uf{white-space:nowrap}.reg-uf b{color:var(--texto);font-weight:650}.reg-uf .amostra{width:8px;height:8px;margin-right:4px}',
  '.legenda{display:flex;gap:14px;font-size:12px;color:var(--texto-2);margin:-4px 0 8px}',
  '.amostra{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px}',
  '.graf .serie-a,.amostra.serie-a{fill:var(--acento-cheio);background:var(--acento-cheio)}',
  '.graf .serie-b,.amostra.serie-b{fill:var(--serie-2);background:var(--serie-2)}',
  ':root{--serie-3:#00937F}[data-tema="escuro"]{--serie-3:#3CC7B4}',
  '.graf .serie-c,.amostra.serie-c{fill:var(--serie-3);background:var(--serie-3)}',
  '.tag.reat{background:color-mix(in srgb, var(--serie-3) 16%, transparent);color:var(--serie-3)}',
  '.graf .alvo{fill:transparent;cursor:default}.graf .alvo:hover,.graf .alvo:focus{fill:var(--acento-veu);outline:none}',
  '.graf .alvo.clicavel{cursor:pointer}.graf .marca-col{fill:var(--acento-veu)}.graf .eixo.forte{fill:var(--texto);font-weight:700}',
  '.c-flex{display:flex;flex-direction:column}',
  '.preenche{flex:1;position:relative;min-height:220px}.preenche > svg{position:absolute;inset:0;width:100%;height:100%}',
  '.hora-dia{font-size:12px;font-weight:600;color:var(--texto-2)}',
  '.limpa-dia{font:inherit;font-size:11.5px;margin-left:6px;padding:2px 8px;border-radius:999px;cursor:pointer;',
  'border:1px solid var(--borda-forte);background:var(--superficie-2);color:var(--texto)}',
  '.funil-g{flex:1;display:flex;justify-content:center;align-items:center}',
  '.barra-dias{display:flex;align-items:center;gap:10px;flex-wrap:wrap}',
  '.rot-dias{min-width:46px}',
  '.seg.eventos{flex:1 1 0;min-width:0}',
  '#f-eventos-rot{align-self:flex-start;padding-top:8px}',
  '@media (max-width:620px){.seg.eventos{flex-basis:100%}}',
  '.seg.eventos button{display:inline-flex;align-items:center;gap:6px;text-align:left}',
  '.ev-est{font-size:10.5px;font-weight:600;opacity:.7}',
  '.ev-n{font-size:10.5px;font-weight:700;opacity:.7}',
  '.barras-filtro{display:flex;flex-direction:column;gap:8px}',
  '.rot-dias{font-size:12px;font-weight:600;color:var(--texto-2)}',
  '.seg.dias{display:flex;flex-wrap:wrap;max-width:100%}',
  '.funil-svg{max-width:640px}',
  '.funil-svg .f-rot{fill:var(--texto);font-size:13px;font-weight:600}',
  '.funil-svg .f-pc{fill:var(--texto);font-size:13px;font-weight:700;font-variant-numeric:tabular-nums}',
  '.funil-svg .f-forma{fill:color-mix(in srgb,var(--acento-cheio) 20%,transparent);stroke:color-mix(in srgb,var(--acento-cheio) 45%,transparent);stroke-width:1;stroke-linejoin:round}',
  '.funil-svg .f-forma:hover,.funil-svg .f-forma:focus{fill:color-mix(in srgb,var(--acento-cheio) 30%,transparent);outline:none}',
  '[data-tema="escuro"] .funil-svg .f-forma{fill:rgba(255,255,255,.09);stroke:rgba(255,255,255,.20)}',
  '[data-tema="escuro"] .funil-svg .f-forma:hover,[data-tema="escuro"] .funil-svg .f-forma:focus{fill:rgba(255,255,255,.15)}',
  '.funil-svg .f-txt{fill:var(--texto);font-size:13px;font-weight:650;font-variant-numeric:tabular-nums;pointer-events:none}',
  '.funil-svg .f-conv{fill:var(--texto-3);font-size:11px;font-weight:600;font-variant-numeric:tabular-nums}',
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
  '.fg .seg{display:flex;width:100%}.fg .seg button{flex:1;width:auto}',
  '.nota{font-size:12px;color:var(--texto-2);margin-top:14px;line-height:1.5}',
  '.area{padding-left:52px}',
  '@media(max-width:620px){.area{padding-left:12px}.aba{top:auto;bottom:16px;transform:none;flex-direction:row}',
  '.aba .rot{writing-mode:horizontal-tb}}',
  '@media (prefers-reduced-motion:reduce){.gaveta{transition:none}}'
].join('');
const ICONE = {
  veiculo: '<path d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5v5h-3M6 18H3v-5h18"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/>',
  oferta: '<path d="M12 2v20"/><path d="M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>',
  vendido: '<path d="M20 6L9 17l-5-5"/>',
  financeiro: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
  nova: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  reativado: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  rank: '<path d="M4 6h16"/><path d="M4 12h11"/><path d="M4 18h6"/>',
  pessoa: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  grafico: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  funil: '<path d="M3 4h18l-7 9v6l-4 2v-8z"/>',
  mapa: '<path d="M12 21s-7-6.1-7-11a7 7 0 0114 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  patio: '<path d="M3 21h18M5 21V8l7-4 7 4v13"/><path d="M9 21v-5h6v5"/>',
  filtros: '<path d="M3 5h18M6 12h12M10 19h4"/>',
  gloss: '<path d="M4 19V5a2 2 0 012-2h13v18H6a2 2 0 01-2-2z"/><path d="M4 19a2 2 0 012-2h13"/>'
};
const chip = (k) => '<span class="chip" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICONE[k] + '</svg></span>';
const kpiCard = (ic, rot, idVal, meio, pe) =>
  '<article class="cartao"><div class="cartao-topo">' + chip(ic) + '<span class="kpi-rot">' + rot + '</span></div>' +
  '<p class="kpi-val num" id="' + idVal + '">—</p>' + meio +
  '<dl class="kpi-pe">' + pe.map((p) => '<div><dt>' + p[0] + '</dt><dd class="num" id="' + p[1] + '">—</dd></div>').join('') +
  '</dl></article>';
const meioPc = (idTxt, idBar) => '<div class="kpi-pc"><span class="txt num" id="' + idTxt + '">—</span><span id="' + idBar + '"></span></div>';
const topoCartao = (ic, titulo, idN, extra) => '<div class="cartao-topo">' + chip(ic) + '<h2>' + titulo + '</h2>' +
  '<span class="dir">' + (extra || '') + '<span class="tag" id="' + idN + '">—</span></span></div>';
const cartaoOrdenavel = (ic, titulo, idN, id, rolo, extra) =>
  '<section class="cartao">' + topoCartao(ic, titulo, idN, extra) +
  '<div class="rolo ' + rolo + '"><table class="dens"><thead><tr id="th-' + id + '"></tr></thead>' +
  '<tbody id="tb-' + id + '"></tbody></table></div></section>';
const LEGENDA = '<div class="legenda"><span><span class="amostra serie-b"></span>Total</span>' +
  '<span><span class="amostra serie-a"></span>Novos</span>' +
  '<span><span class="amostra serie-c"></span>Reativados</span></div>';
const seg = (id, rot, opcoes, ativo) => '<span class="seg" id="' + id + '" role="group" aria-label="' + rot + '">' +
  opcoes.map((o) => '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (o[0] === ativo) + '">' + o[1] + '</button>').join('') +
  '</span>';
const filtro = (id, rotulo) => '<div class="fg"><label for="' + id + '" id="' + id + '-rot">' + rotulo + '</label>' +
  '<select class="ctrl" id="' + id + '"></select></div>';
const dadosJs = JSON.stringify(DADOS).split('<').join(String.fromCharCode(92) + 'u003c');
const html = '<!doctype html><html lang="pt-BR" data-tema="escuro"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">' +
  '<title>Mega evento Fenauto</title><style>' + CSS_TEMA + CSS_PAINEL + '</style></head><body>' +
  '<header class="topo"><div class="topo-in">' +
  '<span class="marca logo-iga" id="logo-iga">' + LOGO_IGA + '</span>' +
  '<div class="topo-tit"><h1>Mega evento Fenauto</h1><p class="sub" id="sub"></p></div>' +
  '<span class="marca logo-fen" id="logo-fen">' + LOGO_FEN + '</span>' +
  '</div></header>' +
  '<div class="sob-topo topo-acoes">' +
  '<button class="ctrl so-icone aviso" id="b-aviso" type="button" hidden aria-label="Pontos de atenção">' +
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></svg>' +
  '<span class="cont"></span></button>' +
  '<button class="ctrl so-icone" id="b-tema" type="button" aria-label="Mudar o tema"></button>' +
  '</div><div id="dica" hidden></div><div id="dica-g" hidden></div><div id="dica-lk" hidden></div>' +
  '<button id="aba" class="aba" type="button" aria-expanded="false" aria-controls="gaveta">' +
  '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONE.filtros + '</svg><span class="rot">Filtros</span>' +
  '<span class="n" id="aba-n" hidden></span></button>' +
  '<div id="veu" class="veu" hidden></div>' +
  '<aside id="gaveta" class="gaveta" aria-label="Filtros"><div class="cartao">' +
  '<div class="cartao-topo">' + chip('filtros') + '<h2>Filtros</h2>' +
  '<button id="fecha" class="fechar" type="button" aria-label="Fechar filtros">×</button></div>' +
  '<div class="filtros">' +
  '<div class="fg"><span class="rot-fg" id="seg-lojas-rot">Lojistas</span>' +
  seg('seg-lojas', 'Lojistas', [['todas', 'Todos lojistas'], ['novas', 'Novos'], ['reativadas', 'Reativados']], 'todas') + '</div>' +
  filtro('f-patio', 'Pátio') +
  filtro('f-farol', 'Status do veículo') +
  '<div class="fg"><button class="ctrl" id="limpar" type="button">Limpar filtros</button></div>' +
  '</div>' +
  '<p class="nota"><b>Pátio</b> e <b>status do veículo</b> recortam os veículos: KPIs, rankings, pátios, funil e a lista de veículos acompanham. ' +
  '<b>Lojistas</b> vale só para o ranking de lojas. O <b>evento</b> e a <b>data</b> ficam nos botões acima do funil. ' +
  'Nenhum filtro recalcula o score, as ofertas ou o farol de um veículo.</p>' +
  '</div></aside>' +
  '<main class="area">' +
  '<section class="g4 g5" aria-label="Indicadores">' +
  kpiCard('veiculo', 'Veículos publicados', 'k-pub', meioPc('k-pub-pc', 'k-pub-bar'),
    [['Vendidos', 'k-pub-vend'], ['Com VMV atingido', 'k-pub-vmv']]) +
  kpiCard('oferta', 'Com ofertas', 'k-of', meioPc('k-of-pc', 'k-of-bar'),
    [['Ofertantes', 'k-of-lj'], ['Lances/lojista', 'k-of-lpl']]) +
  kpiCard('vendido', 'Vendidos', 'k-vd', meioPc('k-vd-pc', 'k-vd-bar'),
    [['Compradores', 'k-vd-comp'], ['Participações/lojista', 'k-vd-ppl']]) +
  kpiCard('financeiro', 'Performance financeira', 'k-pf', meioPc('k-pf-pc', 'k-pf-bar'),
    [['Recuperação / FIPE', 'k-pf-fipe'], ['Recuperação / VMV', 'k-pf-vmv']]) +
  kpiCard('nova', 'Novos lojistas', 'k-nv', meioPc('k-nv-pc', 'k-nv-bar'),
    [['Acessaram', 'k-nv-ac'], ['Ofertaram', 'k-nv-of'], ['Compraram', 'k-nv-cp']]) +
  kpiCard('reativado', 'Reativados', 'k-rt', meioPc('k-rt-pc', 'k-rt-bar'),
    [['Acessaram', 'k-rt-ac'], ['Ofertaram', 'k-rt-of'], ['Compraram', 'k-rt-cp']]) +
  '</section>' +
  '<div class="barras-filtro">' +
  '<div class="barra-dias"><span class="rot-dias" id="f-eventos-rot">Evento</span>' +
  '<div class="seg dias eventos" id="f-eventos" role="group" aria-labelledby="f-eventos-rot"></div></div>' +
  '<div class="barra-dias"><span class="rot-dias" id="f-dias-rot">Data</span>' +
  '<div class="seg dias" id="f-dias" role="group" aria-labelledby="f-dias-rot"></div></div>' +
  '</div>' +
  '<section class="g3i">' +
  '<article class="cartao c-flex">' + topoCartao('funil', 'Funil de ativação dos novos cadastros', 'n-funil') +
  '<div class="funil-g" id="funil"></div></article>' +
  '<article class="cartao c-flex">' + topoCartao('mapa', TITULO_REGIAO, 'n-regiao') +
  '<div class="reg-lista" id="g-regiao"></div></article>' +
  '<article class="cartao c-flex c-dia">' + topoCartao('grafico', 'Acessos únicos por dia', 'n-dia') +
  LEGENDA + '<div class="preenche" id="g-dia" data-rot="Acessos únicos por dia: lojas distintas que acessaram o evento, total, novas e reativadas"></div></article>' +
  '</section>' +
  '<article class="cartao">' + topoCartao('relogio', 'Acessos por hora', 'n-hora', '<span class="hora-dia" id="hora-dia"></span>') +
  LEGENDA + '<div id="g-hora" data-rot="Acessos ao evento por hora do dia, total, das lojas novas e das reativadas"></div></article>' +
  cartaoOrdenavel('rank', 'Ranking de lojas', 'n-lojas', 'lojas', 'medio',
    '<button type="button" class="limpa-dia" id="exporta-novas">Exportar novos lojistas</button>') +
  cartaoOrdenavel('patio', 'Pátios', 'n-patios', 'patios', '') +
  cartaoOrdenavel('veiculo', 'Veículos', 'n-veic', 'veic', 'alto') +
  '<details class="cartao gloss" id="gloss"><summary class="cartao-topo">' + chip('gloss') + '<h2>Glossário</h2>' +
  '<span class="dir"><span class="tag" id="gloss-n">—</span><span class="seta" aria-hidden="true">▾</span></span>' +
  '</summary><dl id="gloss-lista"></dl></details>' +
  '<p class="rodape">Atualizado em <span id="gerado">—</span> · <span id="base"></span></p>' +
  '</main><script>' +
  calcula.toString() + APP.toString() +
  'APP(' + dadosJs + ');' +
  '</script></body></html>';
const todos = calcula(DADOS, 'todos', {});
const resumo = {
  eventos: eventos.length, veiculos: veiculos.length, ofertas: ofertas.length,
  lojas_cadastro: lojas.length,
  acessos: { loja_dia_hora: acessos.length, partes: PARTES, anuncio: acessoAnuncio.length },
  kpi: todos.kpi,
  funil: todos.funil,
  regioes: todos.regioes.map((r) => ({ regiao: r.regiao, total: r.total, acessaram: r.acessaram, ufs: r.ufs.map((u) => [u.uf, u.total]) })),
  patios: todos.patios.length,
  por_evento: eventos.map((e) => {
    const r = calcula(DADOS, e.id, {});
    return { id: e.id, estado: r.eventos[0].estado, kpi: r.kpi, funil: r.funil };
  }),
  top_lojas: todos.lojas.slice(0, 5).map((r) => ({ loja: r.loja, arrem: r.arrem, lances: r.lances, acessos: r.acessos, nova: r.nova })),
  avisos: avisos,
  bytes_html: html.length
};
if (CSS_TEMA.length < 5000) throw new Error('CSS do tema nao injetado (rode _aplica-modelo.js)');
if (LOGO_FEN.indexOf('<svg ') !== 0) throw new Error('logo da Fenauto nao injetada (rode _aplica-modelo.js)');
if (LOGO_IGA.indexOf('<svg ') !== 0) throw new Error('logo do IGA nao injetada (rode _aplica-modelo.js)');
return [{ json: { html: html, resumo: resumo } }];
` }
  }
});

const arquivo = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Virar Arquivo',
    position: [896, 0],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `const FUSO_MIN = -180;
const PASTA = 'Mega Evento Fenauto IGA';
const PREFIXO = 'mega-evento-fenauto-iga';
const MIN_BYTES = 40 * 1024;
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
    position: [1120, 0],
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

export default workflow('mega-evento-fenauto-iga', 'Mega Evento Fenauto (IGA)')
  .add(rodar)
  .to(consultas)
  .to(mcp)
  .to(painel)
  .to(arquivo)
  .to(subir);
