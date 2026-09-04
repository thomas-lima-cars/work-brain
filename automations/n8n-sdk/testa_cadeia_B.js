// Roda a cadeia da arquitetura B fora do n8n, com os dados gravados da 48437.
//   Montar Queries Base -> MCP Exec -> [Montar Queries] -> [MCP Run]
//   -> Montar HTML (ORIGINAL, INTOCADO) -> [Injetar Filtros]
const fs = require('fs');
const crypto = require('crypto');

const DUMP = 'C:/Users/thoma/.claude/projects/C--Users-thoma-Documents-work-brain/2bedc899-1389-411d-893a-b9d7ea5c9bc4/tool-results/mcp-ad7bbf4e-95de-4891-81aa-0a35fe700e94-get_workflow_execution-1788482029557.txt';
const SDK = 'C:/Users/thoma/Documents/work-brain/automations/n8n-sdk/';

const d = JSON.parse(fs.readFileSync(DUMP, 'utf8'));
const rd = d.data.resultData.runData;
const baseQueries = rd['Montar Queries'][0].data.main[0];   // vira "Montar Queries Base"
const mcpExec = rd['MCP Run'][0].data.main[0];              // vira "MCP Exec"
console.log('dados 48437: %d queries, %d respostas\n', baseQueries.length, mcpExec.length);

const store = { 'Montar Queries Base': baseQueries, 'MCP Exec': mcpExec };
const $ = (n) => ({ all: () => { if (!store[n]) throw new Error('no desconhecido: ' + n); return store[n]; } });

function roda(arquivo, nomeSaida, json) {
  const src = fs.readFileSync(SDK + arquivo, 'utf8');
  const md5 = crypto.createHash('md5').update(src).digest('hex');
  const r = new Function('$', '$json', src)($, json);
  const itens = Array.isArray(r) ? r : [r];
  store[nomeSaida] = itens;
  console.log('%-22s %-26s -> %d item(ns)  md5 %s', nomeSaida, arquivo, itens.length, md5.slice(0, 12));
  return itens;
}

roda('no-adaptador-queries.js', 'Montar Queries');
roda('no-adaptador-mcp.js', 'MCP Run');

// o gerador ORIGINAL, byte-identico a producao
const genSrc = fs.readFileSync(SDK + 'nodes-originais/Montar_HTML.js', 'utf8');
const genMd5 = crypto.createHash('md5').update(genSrc).digest('hex');
console.log('%-22s %-26s    md5 %s  %s', 'Montar HTML', 'nodes-originais/', genMd5.slice(0, 12),
  genMd5 === '9e570f948b630938665d9e9486b77b6c' ? '(= producao)' : '*** DIFERE ***');
const gen = new Function('$', genSrc)($);
store['Montar HTML'] = [{ json: gen.json }];
console.log('%-22s totalBase=%s  volume=%s  html=%d chars', '', gen.json.totalBase,
  Number(gen.json.volume).toLocaleString('pt-BR'), gen.json.html.length);

const inj = roda('no-injetar-filtros.js', 'Injetar Filtros', gen.json);
const out = inj[0].json;

console.log();
console.log('=== INJETOR ===');
console.log('  valores marcados como reativos :', out.marcadosReativos, '(esperado 17: 7 kpi + 6 situacao + 4 funil)');
console.log('  safras embarcadas              :', out.safras);
console.log('  html final                     :', out.html.length, 'chars (+%d)', out.html.length - gen.json.html.length);

const h = out.html;
console.log();
console.log('=== CHECAGENS NO HTML ===');
const ck = [
  ['barra de filtros', h.includes('class="sf-bar"')],
  ['select Ano', h.includes('id="sfAno"')],
  ['select Mes', h.includes('id="sfMes"')],
  ['select Whitelabel', h.includes('id="sfWl"')],
  ['WL desabilitado', /id="sfWl" disabled/.test(h)],
  ['CSS injetado', h.includes('id="sf-css"')],
  ['JS injetado', h.includes('id="sf-js"')],
  ['data-sf presentes', (h.match(/data-sf="/g) || []).length + ' ocorrencias'],
];
ck.forEach(([k, v]) => console.log('  %-20s %s', k, v));

const anos = [...h.matchAll(/<option value="(\d{4})">/g)].map(m => m[1]);
console.log('  anos no seletor      :', anos.join(', '));

fs.writeFileSync('saida_cadeiaB.html', h, 'utf8');
console.log('\ngravado: saida_cadeiaB.html');
