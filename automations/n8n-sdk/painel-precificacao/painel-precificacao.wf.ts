import { workflow, node, trigger, newCredential, expr } from '@n8n/workflow-sdk';

/* diario, de manha (Thomas, 14/10): o que muda de um dia para o outro e a
   lista de carros e eventos; o modelo so muda no re-treino mensal */
const diario = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Diariamente às 07h',
    position: [0, 0],
    parameters: { rule: { interval: [{ triggerAtHour: 7 }] } }
  },
  output: [{}]
});

/* o modelo de preco (modelo.json, 1,4 MB) lido do SharePoint a cada run.
   EM SERIE e antes das consultas: na ordem de execucao v1 o n8n roda a
   cadeia principal inteira primeiro, e um no em ramo paralelo ainda nao
   existe quando o Montar Painel o procura (Radar, run 52930). */
const lerModelo = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Ler Modelo',
    position: [224, 0],
    parameters: {
      method: 'GET',
      url: 'https://automakers.sharepoint.com/sites/N8N/_api/v2.0/drives/b!WIoPIE-Ra0WlwvYnLSod44VOGNL5_GRNoDqrqsWDT53xop-CS7vvT4Ura4LiRKaM/root:/Painel%20de%20Precifica%C3%A7%C3%A3o/modelo.json:/content',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'microsoftSharePointOAuth2Api',
      options: { timeout: 120000, response: { response: { responseFormat: 'json' } } }
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
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `const DIAS = 30;
const PARTES = 10;
const FUSO_MIN = -180;
const DB = 'cars2you_production';
const pad = (n) => String(n).padStart(2, '0');
const dataDe = (d) => d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
const agora = new Date(Date.now() + FUSO_MIN * 60000);
const AGORA_BR = dataDe(agora) + ' ' + pad(agora.getUTCHours()) + ':' + pad(agora.getUTCMinutes());
const PISO = dataDe(new Date(agora.getTime() - DIAS * 86400000)) + ' 00:00:00';
const MARCA = "UPPER(TRIM(COALESCE(b.name, '(sem marca)')))";
const MODELO = "UPPER(TRIM(COALESCE(m.name, '(sem modelo)')))";
const DATA = (c) => "DATE_FORMAT(" + c + ", '%Y-%m-%d %H:%i')";
const ULTIMA = " INNER JOIN (SELECT a2.vehicle_id AS vid, MAX(an2.id) AS ult" +
  " FROM advertisement_negotiations an2" +
  " INNER JOIN advertisements a2 ON a2.id = an2.advertisement_id" +
  " INNER JOIN vehicles v2 ON v2.id = a2.vehicle_id" +
  " WHERE an2.deleted_at IS NULL AND v2.deleted_at IS NULL" +
  " AND v2.created_at >= '" + PISO + "'" +
  " GROUP BY a2.vehicle_id) u ON u.ult = an.id";
const NAO_VENDIDO = " an.status NOT IN (2, 3, 7)";
const UNIVERSO = " FROM advertisement_negotiations an" + ULTIMA +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id" +
  " INNER JOIN vehicles v ON v.id = a.vehicle_id" +
  " INNER JOIN events e ON e.id = an.event_id AND e.deleted_at IS NULL";
const VEICULOS_DE = UNIVERSO +
  " LEFT JOIN versions ver ON ver.id = v.version_id" +
  " LEFT JOIN shop_stocks ss ON ss.id = v.shop_stock_id" +
  " LEFT JOIN models m ON m.id = v.model_id" +
  " LEFT JOIN brands b ON b.id = v.brand_id" +
  " LEFT JOIN categories cat ON cat.id = v.category_id" +
  " LEFT JOIN shops s ON s.id = v.shop_id" +
  " LEFT JOIN bodyworks bw ON bw.id = v.bodywork_id" +
  " LEFT JOIN colors c ON c.id = v.color_id" +
  " LEFT JOIN driver_shifts dsh ON dsh.id = v.drive_shift_id" +
  " LEFT JOIN fuels f ON f.id = v.fuel_id" +
  " LEFT JOIN (SELECT vpr0.vehicle_id AS vid, MAX(vpr0.situation) AS sit, MAX(vpr0.id) AS lid" +
  " FROM vehicle_precautionary_reports vpr0" +
  " INNER JOIN vehicles v3 ON v3.id = vpr0.vehicle_id" +
  " WHERE vpr0.deleted_at IS NULL AND v3.created_at >= '" + PISO + "'" +
  " GROUP BY vpr0.vehicle_id) lau ON lau.vid = v.id" +
  " LEFT JOIN vehicle_precautionary_reports vpr ON vpr.id = lau.lid";
const COLS_VEICULO = [
  ['veiculo_id', 'v.id'], ['negociacao_id', 'an.id'], ['anuncio_id', 'a.id'],
  ['status', 'an.status'], ['evento_id', 'an.event_id'],
  ['grupo', "CONCAT(" + MARCA + ", ' ', " + MODELO + ")"],
  ['marca', 'b.name'], ['modelo', 'm.name'], ['versao', 'ver.name'],
  ['valor_fipe_anuncio', 'a.fipe_price'], ['km', 'v.km'],
  ['ano_modelo', 'v.model_year'], ['ano_fabricacao', 'v.manufacture_year'],
  ['data_venda', DATA('an.finish_date_offer')],
  ['patio', 'ss.name'], ['patio_uf', 'ss.state'],
  ['whitelabel_id', 's.whitelabel_id'], ['loja_id', 's.id'], ['loja', 's.name'],
  ['categoria', 'cat.name'], ['laudo', 'lau.sit'], ['laudo_url', 'vpr.file_url'],
  ['descricao', 'v.description'],
  ['cor', 'c.name'], ['cambio', 'dsh.name'], ['combustivel', 'f.name'], ['carroceria', 'bw.name'],
  ['vmv', 'an.min_sale_price'],
  ['cadastro', DATA('v.created_at')]
];
const COLS_EVENTO = [
  ['evento_id', 'e.id'], ['nome', 'e.name'], ['situacao', 'e.status'],
  ['inicio', DATA('e.start_date_offer')], ['fim', DATA('e.finish_date_event')],
  ['dias', 'TIMESTAMPDIFF(SECOND, e.start_date_offer, e.finish_date_event) / 86400'],
  ['dia_semana', 'WEEKDAY(e.finish_date_event)'], ['hora', 'HOUR(e.finish_date_event)'],
  ['canais', "(SELECT JSON_ARRAYAGG(JSON_ARRAY(w.id, w.name)) FROM event_whitelabels ew" +
             " INNER JOIN whitelabels w ON w.id = ew.whitelabel_id WHERE ew.event_id = e.id)"]
];
const EVENTOS_DE = " FROM events e WHERE e.id IN (SELECT an.event_id" + UNIVERSO + " WHERE" + NAO_VENDIDO + ")";
const TABELAS = [];
for (let p = 0; p < PARTES; p++) {
  TABELAS.push({ nome: 'veiculos_p' + p, cols: COLS_VEICULO,
    de: VEICULOS_DE + " WHERE" + NAO_VENDIDO + " AND MOD(v.id, " + PARTES + ") = " + p });
}
TABELAS.push({ nome: 'eventos', cols: COLS_EVENTO, de: EVENTOS_DE });
function temJanela(sql) {
  const u = String(sql).toUpperCase();
  return u.indexOf('OVER (') >= 0 || u.indexOf('OVER(') >= 0;
}
function temPii(sql) {
  const u = String(sql).toLowerCase();
  return ['plate', 'chassi', 'renavam', 'document', 'cpf', 'cnpj'].some((p) => u.indexOf(p) >= 0);
}
return TABELAS.map((t, i) => {
  const sql = "SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(" +
    t.cols.map((c) => c[1]).join(', ') + ")) AS linhas" + t.de;
  if (temJanela(sql)) throw new Error('funcao de janela em ' + t.nome + ' (o MCP rejeita)');
  if (temPii(sql)) throw new Error('coluna de PII em ' + t.nome);
  return {
    json: {
      queryName: t.nome, database: DB, sql: sql, cols: t.cols.map((c) => c[0]), idx: i,
      meta: { piso: PISO, agora_br: AGORA_BR, dias: DIAS, partes: PARTES }
    }
  };
});
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
function num(x) {
  if (x === null || x === undefined || x === '' || x === 'None') return 0;
  const v = Number(x);
  return isFinite(v) ? v : 0;
}
function vazio(x) { return x === null || x === undefined || x === '' || x === 'None'; }
function idTexto(x) {
  if (vazio(x)) return 'None';
  const v = Number(x);
  return isFinite(v) && Math.floor(v) === v ? String(v) : String(x);
}
function faixa(valor, tabela, acima) {
  for (const [lim, rot] of tabela) if (valor < lim) return rot;
  return acima;
}
function ano4(d) {
  const s = String(d === null || d === undefined ? '' : d).slice(0, 4);
  if (s.length < 4) return null;
  for (const ch of s) if (ch < '0' || ch > '9') return null;
  return Number(s);
}
function faixaIdade(anoModelo, dataVenda, F) {
  const am = num(anoModelo);
  if (am < 1950) return F.idade_vazio;
  const a = ano4(dataVenda);
  if (a === null) return F.idade_vazio;
  const i = a - Math.trunc(am);
  for (const [lim, rot] of F.idade) if (i <= lim) return rot;
  return F.idade_acima;
}
function norm(t) {
  t = String(t === null || t === undefined ? '' : t).toLowerCase().normalize('NFD');
  let semAcento = '', dentroTag = false;
  for (const ch of t) {
    const c = ch.codePointAt(0);
    if (c >= 0x300 && c <= 0x36f) continue;
    if (ch === '<') { dentroTag = true; continue; }
    if (dentroTag) { if (ch === '>') { dentroTag = false; semAcento += ' '; } continue; }
    semAcento += ch;
  }
  if (dentroTag) semAcento = semAcento + t.slice(t.lastIndexOf('<') + 1);
  let out = '', espaco = false;
  for (const ch of semAcento) {
    const ok = (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9');
    if (ok) { out += ch; espaco = false; } else if (!espaco && out) { out += ' '; espaco = true; }
  }
  return out.trim();
}
const _rx = new WeakMap();
function sinaisCompilados(M) {
  if (!_rx.has(M)) {
    _rx.set(M, M.sinais.map((s) => ({ rotulo: s.rotulo, rx: new RegExp(s.rx), bl: s.bloqueio ? new RegExp(s.bloqueio) : null })));
  }
  return _rx.get(M);
}
const _ix = new WeakMap();
function indiceColunas(M) {
  if (!_ix.has(M)) {
    const ix = {};
    M.colunas.slice(0, M.n_onehot).forEach((n, i) => { ix[n] = i; });
    _ix.set(M, ix);
  }
  return _ix.get(M);
}
function matriz(cru, evento, base, M) {
  const F = M.faixas, f = num(cru.valor_fipe_anuncio);
  const cat = {};
  cat.km = base + ':' + (vazio(cru.km) ? F.km_vazio : faixa(num(cru.km), F.km, F.km_acima));
  cat.idade = base + ':' + faixaIdade(cru.ano_modelo, cru.data_venda, F);
  cat.uf = String(cru.patio_uf || '').trim().toUpperCase() || 'sem UF';
  cat.canal = base + ':wl' + idTexto(cru.whitelabel_id);
  cat.categoria = cru.categoria || 'nao informada';
  cat.faixa_fipe = faixa(f, F.fipe, F.fipe_acima);
  cat.laudo_banco = String(cru.laudo || '').trim() || 'sem laudo';
  cat.vendedor = base + ':' + idTexto(cru.loja_id);
  for (const c of ['cor', 'cambio', 'combustivel', 'carroceria']) {
    cat[c] = String(cru[c] || 'nao informado').trim().toLowerCase();
  }
  const bins = [];
  const t = norm(cru.descricao);
  for (const s of sinaisCompilados(M)) {
    if (s.rx.test(t) && !(s.bl && s.bl.test(t))) bins.push('texto: ' + s.rotulo);
  }
  const ix = indiceColunas(M);
  const onehot = [];
  for (const c of M.cats) {
    if (cat[c] !== undefined && ix[c + '=' + cat[c]] !== undefined) onehot.push(ix[c + '=' + cat[c]]);
  }
  for (const b of bins) {
    if (M.prefixos.some((p) => b.indexOf(p) === 0) && ix[b] !== undefined) onehot.push(ix[b]);
  }
  const ev = evento || {};
  const nums = [Math.log(f), vazio(cru.km) ? NaN : Math.trunc(num(cru.km))]
    .concat(M.numericas.map((k) => (ev[k] === null || ev[k] === undefined ? NaN : Number(ev[k]))));
  const X = new Array(M.colunas.length).fill(0);
  onehot.forEach((i) => { X[i] = 1; });
  nums.forEach((v, j) => { X[M.n_onehot + j] = v; });
  return { X, onehot: onehot.slice().sort((a, b) => a - b), nums };
}
function soma(arv, X) {
  let s = arv.base;
  for (const nos of arv.arvores) {
    let i = 0;
    for (;;) {
      const [col, lim, vazioEsq, esq, dir, folha, valor] = nos[i];
      if (folha) { s += valor; break; }
      const x = X[col];
      i = Number.isNaN(x) ? (vazioEsq ? esq : dir) : (x <= lim ? esq : dir);
    }
  }
  return s;
}
function erf(x) {
  const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
    t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
    t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? 1 - r : r - 1;
}
function prever(cru, evento, base, M) {
  const f = num(cru.valor_fipe_anuncio);
  if (f <= 0) return null;
  const { X } = matriz(cru, evento, base, M);
  const g = base + '|' + cru.grupo;
  const coberto = M.partida.modelo[g] !== undefined;
  const partida = coberto ? M.partida.modelo[g] : M.partida.base[base];
  const p = partida + soma(M.arvores.preco, X);
  const lo = partida + soma(M.arvores.q10, X);
  const hi = partida + soma(M.arvores.q90, X);
  const C = M.calibracao;
  const meia = Math.max((hi - lo) / 2, 1e-4) / p * C.k;
  const bruto = erf(0.10 / ((meia / C.z90) * Math.SQRT2));
  const q = Math.min(Math.max(bruto, 1e-3), 1 - 1e-3);
  const conf = 1 / (1 + Math.exp(-(C.a * Math.log(q / (1 - q)) + C.b)));
  return { razao: p, preco: f * p, faixa: [f * p * (1 - meia), f * p * (1 + meia)], conf, coberto,
           q10: lo, q90: hi };
}
const BASE = 'Cars2You';
const EXCLUIR = ['Motocicleta', 'Caminhao', 'Onibus', 'Reboque', 'Semireboque'];
const MODELO_VELHO_DIAS = 45;
const ENTRADA_MODELO = ['grupo', 'valor_fipe_anuncio', 'km', 'ano_modelo', 'data_venda', 'patio_uf', 'whitelabel_id',
  'categoria', 'laudo', 'descricao', 'loja_id', 'cor', 'cambio', 'combustivel', 'carroceria'];
const STATUS = {
  1: 'Ativo', 8: 'Suspenso', 9: 'Em análise do comprador', 10: 'Cancelado', 11: 'Sem ofertas',
  13: 'Em análise do vendedor', 14: 'Vendedor rejeitou', 15: 'Comprador rejeitou', 18: 'Venda cancelada'
};
const pedidos = $('Montar Consultas').all().map((i) => i.json);
const respostas = $('MCP Consultas').all();
if (respostas.length !== pedidos.length) {
  throw new Error('MCP Consultas devolveu ' + respostas.length + ' respostas para ' + pedidos.length + ' consultas.');
}
const T = {};
pedidos.forEach((p, i) => {
  const r = respostas[i] ? respostas[i].json : null;
  const sc = r ? (r.structuredContent || r) : null;
  if (!sc || !sc.rows || !sc.columns) {
    throw new Error('A consulta ' + p.queryName + ' nao voltou do MCP: ' + JSON.stringify(r).slice(0, 400));
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
    if (arr.length !== p.cols.length) throw new Error(p.queryName + ': linha com ' + arr.length + ' colunas');
    const o = {};
    p.cols.forEach((k, j) => { o[k] = arr[j]; });
    return o;
  });
});
const META = pedidos[0].meta;
const veiculos = [];
for (let p = 0; p < Number(META.partes); p++) {
  if (!T['veiculos_p' + p]) throw new Error('Faltou a parte ' + p + ' dos veiculos');
  T['veiculos_p' + p].forEach((v) => veiculos.push(v));
}
if (!T.eventos) throw new Error('Faltou a consulta de eventos');
let MODELO = $('Ler Modelo').first().json;
if (MODELO && MODELO.data && !MODELO.arvores) MODELO = MODELO.data;
if (typeof MODELO === 'string') MODELO = JSON.parse(MODELO);
if (!MODELO || !MODELO.arvores || !MODELO.colunas || !MODELO.calibracao) {
  throw new Error('Ler Modelo nao entregou o modelo.json (faltam arvores/colunas/calibracao).');
}
const diasDe = (a, b) => Math.round((Date.parse(b.slice(0, 10) + 'T00:00:00Z') - Date.parse(a.slice(0, 10) + 'T00:00:00Z')) / 86400000);
const idadeModelo = diasDe(MODELO.treinado_com.ate, META.agora_br);
const EV = {};
const CANAIS = {};
T.eventos.forEach((e) => {
  let canais = e.canais;
  if (typeof canais === 'string') canais = JSON.parse(canais);
  canais = (canais || []).map((c) => { CANAIS[c[0]] = c[1]; return c[0]; });
  const agora = META.agora_br;
  const fase = agora < e.inicio ? 'futuro' : agora <= e.fim ? 'ativo' : 'encerrado';
  EV[e.evento_id] = { id: e.evento_id, nome: e.nome, inicio: e.inicio, fim: e.fim, fase: fase, canais: canais,
    calendario: { dias: e.dias === null ? null : Number(e.dias), dia_semana: e.dia_semana, hora: e.hora } };
});
const VMV_PROVISORIO = 100000;
const avisos = [];
const linhas = [];
let semEvento = 0;
veiculos.forEach((v) => {
  const ev = EV[v.evento_id];
  if (!ev) { semEvento++; return; }
  const fipe = num(v.valor_fipe_anuncio);
  const vmvBruto = num(v.vmv);
  const vmvProvisorio = vmvBruto === VMV_PROVISORIO;
  const vmv = !vmvProvisorio && fipe > 0 && vmvBruto / fipe >= 0.2 && vmvBruto / fipe <= 1.5 ? vmvBruto : null;
  let p = null, motivo = '';
  if (EXCLUIR.indexOf(v.categoria) >= 0) motivo = 'categoria fora do modelo (' + v.categoria + ')';
  else if (fipe <= 0) motivo = 'sem FIPE no anúncio';
  else {
    const cru = {};
    ENTRADA_MODELO.forEach((k) => { cru[k] = v[k]; });
    p = prever(cru, ev.calendario, BASE, MODELO);
    if (!p || !Number.isFinite(p.preco)) { p = null; motivo = 'modelo não conseguiu estimar'; }
  }
  linhas.push([
    v.veiculo_id, v.evento_id, String(v.loja || '—').trim(), v.grupo, v.versao || '', v.ano_modelo || '',
    v.km === null || v.km === undefined ? null : Number(v.km), v.patio_uf || '', fipe || null,
    p ? Math.round(p.preco) : null, p ? [Math.round(p.faixa[0]), Math.round(p.faixa[1])] : null,
    p ? Math.round(p.conf * 1000) / 1000 : null, vmv, vmvBruto || null, Number(v.status),
    v.laudo_url || '', p ? (p.coberto ? 1 : 0) : null, motivo, v.cadastro || '', v.anuncio_id
  ]);
});
if (semEvento) avisos.push(semEvento + ' veículo(s) com evento fora da consulta de eventos — ficaram de fora.');
const nFora = linhas.filter((l) => l[9] === null).length;
if (nFora) avisos.push(nFora + ' veículo(s) sem estimativa (motos e pesados, ou sem FIPE no anúncio).');
const nVmvProv = linhas.filter((l) => l[9] !== null && l[13] === VMV_PROVISORIO).length;
if (nVmvProv) avisos.push(nVmvProv + ' veículo(s) com VMV provisório (R$ 100.000, valor de cadastro) — fora do confronto até o cliente informar o VMV.');
const nVmvInv = linhas.filter((l) => l[9] !== null && l[12] === null && l[13] !== VMV_PROVISORIO).length;
if (nVmvInv) avisos.push(nVmvInv + ' veículo(s) com VMV fora de 20% a 150% da FIPE — tratados como sem VMV.');
const nFora20 = linhas.filter((l) => l[16] === 0).length;
if (nFora20) avisos.push(nFora20 + ' veículo(s) de modelo que o modelo não conhece — partida pela média da base.');
if (idadeModelo > MODELO_VELHO_DIAS) {
  avisos.push('O modelo foi treinado com vendas até ' + MODELO.treinado_com.ate + ' (' + idadeModelo +
    ' dias). Re-treinar: automations/precificacao/preditivo/README.md.');
}
const DADOS = {
  linhas: linhas,
  eventos: Object.keys(EV).map((k) => EV[k]).map((e) => [e.id, e.nome, e.inicio, e.fim, e.fase, e.canais]),
  canais: CANAIS, status: STATUS, avisos: avisos, vmvProvisorio: VMV_PROVISORIO,
  meta: { agora: META.agora_br, piso: META.piso, dias: META.dias,
    modelo: { versao: MODELO.versao, ate: MODELO.treinado_com.ate, vendas: MODELO.treinado_com.vendas,
      erro_mediano: MODELO.teste.erro_mediano, dentro_10: MODELO.teste.dentro_10 } }
};
function pagina(D) {
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s === null || s === undefined ? '' : s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;'); };
  var nb = function (x) { return x === null || x === undefined ? '—' : Number(x).toLocaleString('pt-BR'); };
  var rs = function (x) { return x === null || x === undefined ? '—' : 'R$ ' + Math.round(x).toLocaleString('pt-BR'); };
  var pc = function (x, d) { return x === null || x === undefined || !isFinite(x) ? '—' : (x * 100).toFixed(d === undefined ? 1 : d).replace('.', ',') + '%'; };
  var sg = function (x) { return x === null || !isFinite(x) ? '—' : (x >= 0 ? '+' : '−') + Math.abs(x * 100).toFixed(1).replace('.', ',') + '%'; };
  var dt = function (s) { return s ? s.slice(8, 10) + '/' + s.slice(5, 7) + ' ' + s.slice(11, 16) : '—'; };
  var EVI = {}; D.eventos.forEach(function (e) { EVI[e[0]] = { id: e[0], nome: e[1], inicio: e[2], fim: e[3], fase: e[4], canais: e[5] }; });
  var V = D.linhas.map(function (a) {
    var gap = a[9] && a[12] ? a[12] / a[9] - 1 : null;
    return { id: a[0], ev: EVI[a[1]], com: a[2], g: a[3], v: a[4], a: a[5], k: a[6], uf: a[7], f: a[8],
      prev: a[9], fx: a[10], conf: a[11], vmv: a[12], vmvBruto: a[13], st: a[14], url: a[15], cob: a[16],
      motivo: a[17], gap: gap };
  });
  var FAIXAS = [['VMV mais de 15% acima do modelo', 0.15, 99, 'ruim'], ['VMV 5% a 15% acima', 0.05, 0.15, 'atencao'],
    ['VMV alinhado (±5%)', -0.05, 0.05, 'ok'], ['VMV 5% a 15% abaixo', -0.15, -0.05, ''],
    ['VMV mais de 15% abaixo do modelo', -99, -0.15, '']];
  var faixaDe = function (gap) { for (var i = 0; i < FAIXAS.length; i++) if (gap >= FAIXAS[i][1] && gap < FAIXAS[i][2]) return i; return 2; };
  var nivel = function (c) { return c >= 0.8 ? ['ok', 'alta'] : c >= 0.7 ? ['', 'média'] : ['atencao', 'baixa']; };
  var med = function (a) { a = a.slice().sort(function (x, y) { return x - y; }); var n = a.length; return n ? (n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2) : null; };
  var F = { canal: '', com: '', ev: '', de: '', ate: '', g: '', fase: '' };
  function opcoes(sel, pares, todos) {
    $(sel).innerHTML = '<option value="">' + todos + '</option>' + pares.map(function (p) {
      return '<option value="' + esc(p[0]) + '">' + esc(p[1]) + '</option>'; }).join('');
  }
  var uniq = function (arr) { var o = {}; arr.forEach(function (x) { o[x] = 1; }); return Object.keys(o); };
  opcoes('#f-canal', Object.keys(D.canais).map(function (k) { return [k, D.canais[k]]; })
    .sort(function (a, b) { return a[1].localeCompare(b[1]); }), 'Todos os whitelabels');
  opcoes('#f-com', uniq(V.map(function (x) { return x.com; })).sort().map(function (c) { return [c, c]; }), 'Todos os comitentes');
  opcoes('#f-ev', D.eventos.slice().sort(function (a, b) { return a[3] < b[3] ? 1 : -1; })
    .map(function (e) { return [e[0], e[1] + ' · ' + dt(e[3])]; }), 'Todos os eventos');
  opcoes('#f-g', uniq(V.map(function (x) { return x.g; })).sort().map(function (c) { return [c, c]; }), 'Todos os modelos');
  function filtra() {
    return V.filter(function (x) {
      if (F.canal && x.ev.canais.indexOf(Number(F.canal)) < 0) return false;
      if (F.com && x.com !== F.com) return false;
      if (F.ev && String(x.ev.id) !== F.ev) return false;
      if (F.g && x.g !== F.g) return false;
      if (F.fase && x.ev.fase !== F.fase) return false;
      if (F.de && x.ev.fim.slice(0, 10) < F.de) return false;
      if (F.ate && x.ev.fim.slice(0, 10) > F.ate) return false;
      return true;
    });
  }
  function pinta() {
    var ls = filtra();
    var est = ls.filter(function (x) { return x.prev; });
    var par = est.filter(function (x) { return x.vmv; });
    var sV = 0, sP = 0; par.forEach(function (x) { sV += x.vmv; sP += x.prev; });
    var acima = par.filter(function (x) { return x.gap > 0.15; }).length;
    var abaixo = par.filter(function (x) { return x.gap < -0.15; }).length;
    var alta = est.filter(function (x) { return x.conf >= 0.8; }).length;
    var ativos = []; for (var k in F) if (F[k]) ativos.push(k);
    $('#n-filtros').textContent = ativos.length ? ativos.length + ' filtro(s)' : '';
    $('#k-n').textContent = nb(est.length);
    $('#k-n-d').textContent = 'de ' + nb(ls.length) + ' não vendidos no recorte';
    $('#k-n-pe').innerHTML = '<div><dt>Encerrados</dt><dd class="num">' + nb(ls.filter(function (x) { return x.ev.fase === 'encerrado'; }).length) +
      '</dd></div><div><dt>Ativos</dt><dd class="num">' + nb(ls.filter(function (x) { return x.ev.fase === 'ativo'; }).length) +
      '</dd></div><div><dt>Futuros</dt><dd class="num">' + nb(ls.filter(function (x) { return x.ev.fase === 'futuro'; }).length) + '</dd></div>';
    $('#k-gap').textContent = sP ? sg(sV / sP - 1) : '—';
    $('#k-gap-d').textContent = 'soma dos VMV contra a soma do modelo';
    $('#k-gap-pe').innerHTML = '<div><dt>VMV</dt><dd class="num">' + rs(sV) + '</dd></div><div><dt>Modelo</dt><dd class="num">' + rs(sP) + '</dd></div>';
    $('#k-ac').textContent = par.length ? pc(acima / par.length, 0) : '—';
    $('#k-ac-d').textContent = nb(acima) + ' veículos com VMV mais de 15% acima';
    $('#k-ac-pe').innerHTML = '<div><dt>Mais de 15% abaixo</dt><dd class="num">' + nb(abaixo) + '</dd></div><div><dt>Mediana VMV ÷ modelo</dt><dd class="num">' +
      (par.length ? sg(med(par.map(function (x) { return x.gap; }))) : '—') + '</dd></div>';
    $('#k-cf').textContent = est.length ? pc(alta / est.length, 0) : '—';
    $('#k-cf-d').textContent = 'com confiança alta (80% ou mais)';
    $('#k-cf-pe').innerHTML = '<div><dt>Índice médio</dt><dd class="num">' + (est.length ? pc(est.reduce(function (t, x) { return t + x.conf; }, 0) / est.length, 0) : '—') +
      '</dd></div><div><dt>Modelo desconhecido</dt><dd class="num">' + nb(est.filter(function (x) { return x.cob === 0; }).length) + '</dd></div>';
    var cont = FAIXAS.map(function () { return 0; });
    par.forEach(function (x) { cont[faixaDe(x.gap)]++; });
    var mx = Math.max.apply(null, cont.concat([1]));
    $('#dist').innerHTML = FAIXAS.map(function (fx, i) {
      return '<li><span class="pos num">' + (i + 1) + '</span><span><span class="nome">' + fx[0] + '</span><span class="barra"><i class="' + fx[3] +
        '" style="width:' + (100 * cont[i] / mx).toFixed(1) + '%"></i></span></span><span class="val num">' + nb(cont[i]) +
        ' · ' + (par.length ? pc(cont[i] / par.length, 0) : '—') + '</span></li>';
    }).join('');
    var porCom = {};
    par.forEach(function (x) { (porCom[x.com] = porCom[x.com] || []).push(x); });
    var coms = Object.keys(porCom).map(function (c) {
      var s = porCom[c], v = 0, p = 0; s.forEach(function (x) { v += x.vmv; p += x.prev; });
      return { c: c, n: s.length, v: v, p: p, gap: v / p - 1, acima: s.filter(function (x) { return x.gap > 0.15; }).length };
    }).sort(function (a, b) { return b.n - a.n; });
    $('#tab-com').innerHTML = coms.slice(0, 25).map(function (c) {
      var t = c.gap > 0.15 ? 'ruim' : c.gap > 0.05 ? 'atencao' : c.gap < -0.05 ? '' : 'ok';
      return '<tr><td class="txt">' + esc(c.c) + '</td><td class="num">' + nb(c.n) + '</td><td class="num">' + rs(c.v) +
        '</td><td class="num">' + rs(c.p) + '</td><td><span class="tag ' + t + '">' + sg(c.gap) + '</span></td><td class="num">' +
        nb(c.acima) + '</td></tr>';
    }).join('') || '<tr><td colspan="6">nenhum comitente com VMV nesta seleção</td></tr>';
    $('#com-n').textContent = nb(coms.length) + ' comitentes';
    pintaTabela(ls);
  }
  var ORD = { k: 'gap', dir: -1 }, LIM = 300, ATUAL = [];
  var chave = function (x, k) {
    if (k === 'ev') return x.ev.fim; if (k === 'gap') return x.gap === null ? -9 : x.gap;
    return x[k];
  };
  function pintaTabela(ls) {
    var q = ($('#busca').value || '').trim().toLowerCase();
    var a = ls.filter(function (x) { return !q || (x.g + ' ' + x.v + ' ' + x.com + ' ' + x.id + ' ' + x.ev.nome).toLowerCase().indexOf(q) >= 0; });
    a.sort(function (x, y) {
      var p = chave(x, ORD.k), r = chave(y, ORD.k);
      if (p === null || p === undefined || p === '') return 1; if (r === null || r === undefined || r === '') return -1;
      return typeof p === 'string' ? ORD.dir * p.localeCompare(r) : ORD.dir * (p - r);
    });
    ATUAL = a;
    $('#tab-v').innerHTML = a.slice(0, LIM).map(function (x) {
      var fx = x.gap === null ? null : FAIXAS[faixaDe(x.gap)];
      var n = x.conf === null ? null : nivel(x.conf);
      return '<tr><td class="txt">' + esc(x.ev.nome) + '<br><span class="nota">' + x.ev.fase + ' · encerra ' + dt(x.ev.fim) + '</span></td>' +
        '<td class="txt">' + esc(x.com) + '</td>' +
        '<td class="txt">' + esc(x.g) + '<br><span class="nota">' + esc(x.v) + ' · id ' + x.id + '</span></td>' +
        '<td class="num">' + esc(x.a) + '</td><td class="num">' + nb(x.k) + '</td><td>' + esc(x.uf) + '</td>' +
        '<td class="num">' + rs(x.f) + '</td>' +
        '<td class="num" title="' + (x.fx ? 'faixa provável: ' + rs(x.fx[0]) + ' a ' + rs(x.fx[1]) : esc(x.motivo)) + '"><b>' + (x.prev ? rs(x.prev) : '—') + '</b>' +
        (x.prev ? '<br><span class="nota">' + rs(x.fx[0]) + ' a ' + rs(x.fx[1]) + '</span>' : '<br><span class="nota">' + esc(x.motivo) + '</span>') + '</td>' +
        '<td>' + (n ? '<span class="tag ' + n[0] + '" title="confiança ' + n[1] + '">' + pc(x.conf, 0) + '</span>' : '—') + '</td>' +
        '<td class="num">' + (x.vmv ? rs(x.vmv) : (x.vmvBruto ? '<span class="nota">' + rs(x.vmvBruto) + (x.vmvBruto === D.vmvProvisorio ? ' (provisório)' : ' (inválido)') + '</span>' : '—')) + '</td>' +
        '<td>' + (fx ? '<span class="tag ' + fx[3] + '" title="' + fx[0] + '">' + sg(x.gap) + '</span>' : '—') + '</td>' +
        '<td>' + esc(D.status[x.st] || x.st) + '</td>' +
        '<td>' + (x.url ? '<a class="pdf" href="' + esc(x.url) + '" target="_blank" rel="noopener" title="Abrir o laudo cautelar">PDF</a>' : '—') + '</td></tr>';
    }).join('') || '<tr><td colspan="13">nenhum veículo com esses filtros</td></tr>';
    $('#v-n').textContent = nb(a.length) + ' veículos';
    $('#v-mais').textContent = a.length > LIM ? 'Mostrando ' + LIM + ' de ' + nb(a.length) + ' — refine os filtros ou baixe o CSV.' : '';
  }
  document.querySelectorAll('table.veic th[data-k]').forEach(function (th) {
    th.addEventListener('click', function () {
      var k = th.getAttribute('data-k');
      ORD = { k: k, dir: ORD.k === k ? -ORD.dir : (k === 'com' || k === 'g' || k === 'uf' ? 1 : -1) };
      pinta();
    });
  });
  $('#busca').addEventListener('input', function () { pintaTabela(filtra()); });
  $('#b-csv').addEventListener('click', function () {
    var cab = ['evento', 'encerra', 'fase', 'comitente', 'modelo', 'versao', 'veiculo_id', 'ano', 'km', 'uf', 'fipe',
      'estimado', 'faixa_min', 'faixa_max', 'confianca_pct', 'vmv', 'vmv_vs_modelo_pct', 'situacao', 'laudo_pdf'];
    var cel = function (c) { c = String(c === null || c === undefined ? '' : c); return c.indexOf(';') >= 0 || c.indexOf('"') >= 0 ? '"' + c.split('"').join('""') + '"' : c; };
    var dec = function (x) { return x === null || x === undefined ? '' : String(x).replace('.', ','); };
    var out = [cab.join(';')].concat(ATUAL.map(function (x) {
      return [x.ev.nome, x.ev.fim, x.ev.fase, x.com, x.g, x.v, x.id, x.a, x.k, x.uf, dec(x.f), dec(x.prev),
        x.fx ? x.fx[0] : '', x.fx ? x.fx[1] : '', x.conf === null ? '' : Math.round(x.conf * 100), dec(x.vmv),
        x.gap === null ? '' : dec((x.gap * 100).toFixed(1)), D.status[x.st] || x.st, x.url].map(cel).join(';');
    }));
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([String.fromCharCode(0xFEFF) + out.join(String.fromCharCode(13, 10))], { type: 'text/csv;charset=utf-8;' }));
    a.download = 'precificacao-nao-vendidos.csv'; a.click();
  });
  var gav = $('#gaveta');
  var abre = function (s) { gav.className = s ? 'gaveta aberta' : 'gaveta'; };
  $('#aba-filtros').addEventListener('click', function () { abre(gav.className.indexOf('aberta') < 0); });
  $('#gav-fecha').addEventListener('click', function () { abre(false); });
  $('#veu').addEventListener('click', function () { abre(false); });
  [['#f-canal', 'canal'], ['#f-com', 'com'], ['#f-ev', 'ev'], ['#f-de', 'de'], ['#f-ate', 'ate'], ['#f-g', 'g'], ['#f-fase', 'fase']]
    .forEach(function (p) { $(p[0]).addEventListener('change', function (e) { F[p[1]] = e.target.value; pinta(); }); });
  $('#f-limpa').addEventListener('click', function () {
    for (var k in F) F[k] = '';
    document.querySelectorAll('#gaveta select, #gaveta input').forEach(function (el) { el.value = ''; });
    pinta();
  });
  if (D.avisos.length) {
    var b = $('#b-aviso'); b.hidden = false;
    $('#aviso-n').textContent = D.avisos.length;
    b.title = D.avisos.join(' · ');
    b.addEventListener('click', function () { var l = $('#aviso-lista'); l.hidden = !l.hidden; });
    $('#aviso-lista').innerHTML = D.avisos.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('');
  }
  pinta();
}
const ICO = {
  carro: '<path d="M5 17h14M6 17l1.5-6h9L18 17M7 17v2M17 17v2"/><circle cx="8" cy="14.5" r=".8"/><circle cx="16" cy="14.5" r=".8"/>',
  balanca: '<path d="M12 3v18"/><path d="M5 7h14"/><path d="M5 7l-3 7h6z"/><path d="M19 7l-3 7h6z"/>',
  alerta: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  alvo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  tab: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>',
  loja: '<path d="M3 21V10l9-7 9 7v11"/><path d="M9 21v-6h6v6"/>',
  livro: '<path d="M4 19V5a2 2 0 012-2h13v18H6a2 2 0 01-2-2z"/><path d="M4 19a2 2 0 012-2h13"/>'
};
const chip = (k) => '<span class="chip" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICO[k] + '</svg></span>';
const kpi = (k, ic, rot) => '<article class="cartao"><div class="cartao-topo">' + chip(ic) + '<span class="kpi-rot">' + rot +
  '</span></div><p class="kpi-val num" id="k-' + k + '">—</p><p class="kpi-delta neutro" id="k-' + k + '-d">—</p>' +
  '<dl class="kpi-pe" id="k-' + k + '-pe"></dl></article>';
const GLOSSARIO = [
  ['Recorte', 'Carros da Cars2You NÃO vendidos, cadastrados nos últimos ' + META.dias + ' dias (desde ' + META.piso.slice(0, 10) +
    '), que estão em algum evento — encerrado, ativo ou futuro. Não vendido = a última negociação do carro fora dos status de venda (2, 3 e 7).'],
  ['Preço estimado', 'O que o modelo de precificação prevê que o carro vende, olhando só o que se sabe antes do leilão: modelo, km, idade, UF do pátio, canal, laudo, texto do anúncio, acabamento, comitente e calendário do evento. É a FIPE do anúncio vezes a razão prevista.'],
  ['Faixa provável', 'Onde a venda deve cair em 8 de cada 10 casos.'],
  ['Confiança', 'Chance estimada de a venda ficar a até 10% do preço estimado. Alta a partir de 80%, média de 70% a 80%, baixa abaixo de 70%. Medida em vendas reais: anuncia e entrega dentro de 3 pontos.'],
  ['VMV', 'Valor mínimo de venda informado pelo cliente. NÃO entra no modelo, de propósito: os dois são estimativas independentes, e o painel mostra onde discordam. Vale entre 20% e 150% da FIPE; fora disso, aparece como inválido. VMV de exatos R$ 100.000 é o valor provisório do cadastro e fica fora do confronto.'],
  ['VMV × modelo', 'VMV ÷ preço estimado − 1. Positivo: o cliente pede mais do que o modelo estima. Nas vendas de teste, com o VMV mais de 15% acima do modelo, quase todas fecharam abaixo do VMV.'],
  ['Comitente', 'A loja que anuncia o carro (o vendedor).'],
  ['Whitelabel', 'Os canais para os quais o evento é aberto. Um evento pode estar em vários.'],
  ['Data de encerramento', 'O fim do evento (finish_date_event), em hora de Brasília.'],
  ['Modelo desconhecido', 'Carro de um modelo fora dos ~100 mais vendidos usados no treino: o ponto de partida vira a média da base, e a estimativa é mais grosseira.'],
  ['Modelo de precificação', 'Versão ' + MODELO.versao + ', treinado com ' + Number(MODELO.treinado_com.vendas).toLocaleString('pt-BR') +
    ' vendas disputadas até ' + MODELO.treinado_com.ate + '. No teste em vendas reais (jul–set/2026), erro mediano de ' +
    (MODELO.teste.erro_mediano * 100).toFixed(1).replace('.', ',') + '%. Re-treinado mensalmente fora do n8n.']
];
const CSS_PAINEL =
  '.nota{font-size:11.5px;color:var(--texto-3)}' +
  '.topo-acoes{display:flex;gap:8px;justify-content:flex-end;align-items:center}' +
  '.b-aviso{position:relative}.b-aviso b{position:absolute;top:-4px;right:-4px;font-size:10px;min-width:16px;height:16px;border-radius:8px;' +
  'background:var(--negativo);color:#fff;display:flex;align-items:center;justify-content:center}' +
  '#aviso-lista{position:absolute;right:16px;top:64px;z-index:60;max-width:min(560px,92vw);background:var(--superficie,#fff);' +
  'border:1px solid var(--grade);border-radius:12px;padding:10px 14px 10px 28px;font-size:13px;box-shadow:var(--sombra)}' +
  '#aviso-lista li{margin:4px 0}' +
  '.aba-filtros{position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:50;writing-mode:vertical-rl;padding:14px 8px;' +
  'border-radius:0 10px 10px 0;border:1px solid var(--grade);border-left:0;background:var(--superficie,#fff);color:var(--texto);' +
  'font:inherit;font-size:13px;font-weight:650;cursor:pointer;box-shadow:var(--sombra)}' +
  '.aba-filtros span{writing-mode:horizontal-tb;display:block;margin-top:6px;font-size:10px;color:var(--texto-2)}' +
  '.gaveta{position:fixed;inset:0;z-index:70;pointer-events:none}.gaveta .painel-f{position:absolute;left:0;top:0;bottom:0;width:min(340px,90vw);' +
  'background:var(--superficie,#fff);border-right:1px solid var(--grade);padding:18px;overflow:auto;transform:translateX(-102%);transition:transform .2s;' +
  'display:flex;flex-direction:column;gap:12px}' +
  '.gaveta #veu{position:absolute;inset:0;background:rgba(0,0,0,.18);opacity:0;transition:opacity .2s}' +
  '.gaveta.aberta{pointer-events:auto}.gaveta.aberta .painel-f{transform:none}.gaveta.aberta #veu{opacity:1}' +
  '.painel-f label{font-size:12px;color:var(--texto-2);display:flex;flex-direction:column;gap:4px}.painel-f .ctrl{width:100%}' +
  '.painel-f h2{font-size:15px;margin:0;display:flex;justify-content:space-between;align-items:center}' +
  '.area{padding-left:44px}@media(max-width:620px){.area{padding-left:16px}.aba-filtros{top:auto;bottom:0;left:50%;transform:translateX(-50%);' +
  'writing-mode:horizontal-tb;border-radius:10px 10px 0 0;border:1px solid var(--grade);border-bottom:0}}' +
  '.rank .barra i.ok{background:var(--positivo)}.rank .barra i.atencao{background:var(--atencao)}.rank .barra i.ruim{background:var(--negativo)}' +
  '.rolo-alto{max-height:620px;overflow:auto;margin-bottom:0}.rolo-alto thead th{position:sticky;top:0;z-index:1;background:var(--superficie,#F3F5F8)}' +
  'table.veic th[data-k]{cursor:pointer;white-space:nowrap}td.txt,th.txt{text-align:left}' +
  'a.pdf{font-size:11.5px;font-weight:650;padding:2px 8px;border-radius:6px;text-decoration:underline;color:var(--texto);background:var(--acento-veu)}' +
  '.busca-l{display:grid;gap:10px;grid-template-columns:1fr auto;margin:0 0 12px;position:relative}' +
  '.gl dl{columns:2 34em;column-gap:44px}.gl dt{font-weight:650;margin-top:10px;break-after:avoid}.gl dd{margin:2px 0 0;font-size:13px;color:var(--texto-2);break-inside:avoid}';
const BODY =
  '<header class="topo"><div class="topo-in">' +
  '<span class="marca"><img class="logo logo-extensa" id="logo" src="" alt="Cars2You"><img class="logo logo-curta" id="logo-curta" src="" alt="Cars2You"></span>' +
  '<div class="topo-tit"><h1>Painel de Precificação</h1><p class="sub">Preço estimado pelo modelo × VMV do cliente · não vendidos dos últimos ' + META.dias + ' dias</p></div>' +
  '<div class="topo-acoes"><button class="ctrl so-icone b-aviso" id="b-aviso" type="button" aria-label="Pontos de atenção" hidden>' +
  '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICO.alerta + '</svg><b id="aviso-n"></b></button>' +
  '<button class="ctrl so-icone" id="b-tema" type="button" aria-label="Mudar o tema"></button></div></div>' +
  '<ul id="aviso-lista" hidden></ul></header>' +
  '<button class="aba-filtros" id="aba-filtros" type="button">Filtros<span id="n-filtros"></span></button>' +
  '<div class="gaveta" id="gaveta"><div id="veu"></div><div class="painel-f">' +
  '<h2>Filtros <button class="ctrl so-icone" id="gav-fecha" type="button" aria-label="Fechar os filtros">✕</button></h2>' +
  '<label>Whitelabel<select class="ctrl" id="f-canal"></select></label>' +
  '<label>Comitente<select class="ctrl" id="f-com"></select></label>' +
  '<label>Evento<select class="ctrl" id="f-ev"></select></label>' +
  '<label>Situação do evento<select class="ctrl" id="f-fase"><option value="">Encerrado, ativo ou futuro</option>' +
  '<option value="encerrado">Encerrado</option><option value="ativo">Ativo</option><option value="futuro">Futuro</option></select></label>' +
  '<label>Encerramento a partir de<input class="ctrl" id="f-de" type="date"></label>' +
  '<label>Encerramento até<input class="ctrl" id="f-ate" type="date"></label>' +
  '<label>Modelo<select class="ctrl" id="f-g"></select></label>' +
  '<button class="ctrl" id="f-limpa" type="button">Limpar tudo</button></div></div>' +
  '<main class="area">' +
  '<section class="g4" aria-label="Indicadores">' + kpi('n', 'carro', 'Veículos com estimativa') + kpi('gap', 'balanca', 'VMV × modelo') +
  kpi('ac', 'alerta', 'VMV acima do modelo') + kpi('cf', 'alvo', 'Confiança alta') + '</section>' +
  '<section class="g2">' +
  '<article class="cartao"><div class="cartao-topo">' + chip('loja') + '<h2>Comitentes</h2><span class="dir"><span class="tag" id="com-n">—</span></span></div>' +
  '<div class="rolo"><table><thead><tr><th class="txt">comitente</th><th>veículos</th><th>soma dos VMV</th><th>soma do modelo</th><th>VMV × modelo</th><th>VMV +15%</th></tr></thead>' +
  '<tbody id="tab-com"></tbody></table></div><p class="nota">Só veículos com estimativa e VMV válido. Os 25 com mais veículos.</p></article>' +
  '<article class="cartao"><div class="cartao-topo">' + chip('balanca') + '<h2>VMV comparado ao modelo</h2></div><ol class="rank" id="dist"></ol>' +
  '<p class="nota">Vermelho: o cliente pede bem mais do que o modelo estima.</p></article></section>' +
  '<section class="cartao"><div class="cartao-topo">' + chip('tab') + '<h2>Veículos</h2><span class="dir"><span class="tag" id="v-n">—</span></span></div>' +
  '<div class="busca-l"><input class="ctrl" id="busca" type="search" placeholder="buscar modelo, versão, comitente, evento ou id…" aria-label="Buscar">' +
  '<button class="ctrl" id="b-csv" type="button">Baixar CSV</button></div>' +
  '<div class="rolo rolo-alto"><table class="veic"><thead><tr><th class="txt" data-k="ev">evento</th><th class="txt" data-k="com">comitente</th>' +
  '<th class="txt" data-k="g">modelo</th><th data-k="a">ano</th><th data-k="k">km</th><th data-k="uf">UF</th><th data-k="f">FIPE</th>' +
  '<th data-k="prev">estimado</th><th data-k="conf">confiança</th><th data-k="vmv">VMV</th><th data-k="gap">VMV × modelo</th><th>situação</th><th>laudo</th></tr></thead>' +
  '<tbody id="tab-v"></tbody></table></div><p class="nota" id="v-mais"></p></section>' +
  '<details class="cartao gloss" id="gloss"><summary class="cartao-topo">' + chip('livro') + '<h2>Glossário</h2>' +
  '<span class="dir"><span class="tag">' + GLOSSARIO.length + ' termos</span><span class="seta" aria-hidden="true">▾</span></span></summary><dl>' +
  GLOSSARIO.map((g) => '<dt>' + g[0] + '</dt><dd>' + g[1] + '</dd>').join('') + '</dl></details>' +
  '<p class="rodape">Atualizado em ' + META.agora_br.slice(8, 10) + '/' + META.agora_br.slice(5, 7) + '/' + META.agora_br.slice(0, 4) + ' ' +
  META.agora_br.slice(11, 16) + ' · Cars2You, não vendidos cadastrados desde ' + META.piso.slice(8, 10) + '/' + META.piso.slice(5, 7) +
  ' · modelo ' + MODELO.versao + '</p></main>';
const json = JSON.stringify(DADOS).split('<').join(String.fromCharCode(92) + 'u003c');
const TEMA_JS = 'var LOGO=' + JSON.stringify(LOGO) + ';' +
  'function tema(t){document.documentElement.setAttribute("data-tema",t);' +
  'document.getElementById("logo").src=LOGO[t].extensa;document.getElementById("logo-curta").src=LOGO[t].curta;' +
  'var alvo=t==="escuro"?"claro":"escuro",b=document.getElementById("b-tema");' +
  'b.innerHTML=alvo==="escuro"?' + JSON.stringify('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>') +
  ':' + JSON.stringify('<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>') +
  ';b.setAttribute("aria-label","Mudar para o tema "+alvo);b.title="Tema "+alvo;}' +
  'tema("claro");document.getElementById("b-tema").addEventListener("click",function(){' +
  'tema(document.documentElement.getAttribute("data-tema")==="escuro"?"claro":"escuro");});';
const html = '<!doctype html><html lang="pt-BR" data-tema="claro"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1"><title>Painel de Precificação — Cars2You</title>' +
  '<style>' + CSS_TEMA + CSS_PAINEL + '</style></head><body>' + BODY +
  '<script>' + TEMA_JS + 'var D=' + json + ';(' + pagina.toString() + ')(D);</script></body></html>';
const resumo = {
  veiculos: linhas.length, com_estimativa: linhas.filter((l) => l[9] !== null).length,
  com_vmv: linhas.filter((l) => l[9] !== null && l[12] !== null).length,
  eventos: Object.keys(EV).length, avisos: avisos, modelo: MODELO.versao, idade_modelo_dias: idadeModelo
};
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
const PASTA = 'Painel de Precificação';
const PREFIXO = 'painel-precificacao';
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

export default workflow('painel-precificacao', 'Painel de Precificação')
  .add(diario)
  .to(lerModelo)
  .to(consultas)
  .to(mcp)
  .to(painel)
  .to(arquivo)
  .to(subir);
