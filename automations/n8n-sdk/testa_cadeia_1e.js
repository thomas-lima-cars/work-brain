// Testa a cadeia B COM o seletor de whitelabel.
// A execucao 48437 e anterior ao lote 1e, entao nao tem coorte_wl. Alimento
// com o coorte_wl.json do prototipo, que tem exatamente a forma que a query
// nova devolve (wl_id/wl_name/ym + metricas). E um STUB de formato — os
// numeros virao do banco quando a 1e rodar.
const fs = require('fs');
const crypto = require('crypto');

const DUMP = 'C:/Users/thoma/.claude/projects/C--Users-thoma-Documents-work-brain/2bedc899-1389-411d-893a-b9d7ea5c9bc4/tool-results/mcp-ad7bbf4e-95de-4891-81aa-0a35fe700e94-get_workflow_execution-1788482029557.txt';
const SDK = 'C:/Users/thoma/Documents/work-brain/automations/n8n-sdk/';
const PROTO = 'C:/Users/thoma/Documents/work-brain/automations/prototipo-safra/dados/coorte_wl.json';

const d = JSON.parse(fs.readFileSync(DUMP, 'utf8'));
const rd = d.data.resultData.runData;
const baseQueries = rd['Montar Queries'][0].data.main[0].map(i => ({ json: i.json }));
const mcpExec = rd['MCP Run'][0].data.main[0].map(i => ({ json: i.json }));

// injeta coorte_wl paginado em 50, como o MCP devolveria
const wlRows = JSON.parse(fs.readFileSync(PROTO, 'utf8'));
const COLS = ['wl', 'wl_name', 'ym', 'total', 'com_login', 'sem_login', 'ofertantes',
  'compradores', 'negociacoes', 'vendido', 'status2', 'volume', 'ultima_compra',
  's1', 's2', 's3', 's4', 's5', 's6'];
const linhas = wlRows.map(r => COLS.map(c => {
  if (c === 'wl') return r.wl_id;
  if (c === 'status2') return 0;              // o prototipo nao tinha essa coluna
  return r[c] !== undefined ? r[c] : null;
}));
for (let i = 0; i < 16; i++) {
  baseQueries.push({ json: { queryName: 'coorte_wl' } });
  mcpExec.push({ json: { structuredContent: { columns: COLS, rows: linhas.slice(i * 50, (i + 1) * 50) } } });
}
console.log('48437 + stub: %d queries, %d respostas (coorte_wl: %d linhas)',
  baseQueries.length, mcpExec.length, linhas.length);

const store = { 'Montar Queries Base': baseQueries, 'MCP Exec': mcpExec };
const $ = (n) => ({ all: () => store[n] });

function roda(arq, nome, json) {
  const src = fs.readFileSync(SDK + arq, 'utf8');
  const r = new Function('$', '$json', src)($, json);
  const itens = Array.isArray(r) ? r : [r];
  store[nome] = itens;
  return itens;
}
roda('no-adaptador-queries.js', 'Montar Queries');
roda('no-adaptador-mcp.js', 'MCP Run');

const genSrc = fs.readFileSync(SDK + 'nodes-originais/Montar_HTML.js', 'utf8');
const genMd5 = crypto.createHash('md5').update(genSrc).digest('hex');
const gen = new Function('$', genSrc)($);
console.log('Montar HTML md5 %s %s | totalBase=%s',
  genMd5.slice(0, 12), genMd5 === '9e570f948b630938665d9e9486b77b6c' ? '(=producao)' : '***DIFERE***',
  gen.json.totalBase);

const out = roda('no-injetar-filtros.js', 'Injetar', gen.json)[0].json;
console.log();
console.log('=== INJETOR ===');
console.log('  reativos    :', out.marcadosReativos);
console.log('  safras      :', out.safras);
console.log('  whitelabels :', out.whitelabels);
console.log('  linhas WL   :', out.linhasWl);
console.log('  html        :', out.html.length, 'chars');

const h = out.html;
const js = h.match(/<script id="sf-js">([\s\S]*?)<\/script>/)[1];
try { new Function(js); console.log('  JS sintaxe  : OK (' + js.length + ' chars)'); }
catch (e) { console.log('  JS sintaxe  : ERRO ->', e.message); process.exit(1); }

const opts = [...h.matchAll(/<option value="(\d+)">([^<]+)<\/option>/g)];
console.log();
console.log('=== DROPDOWN DE WHITELABEL (top 6 de %d) ===', opts.length);
opts.slice(0, 6).forEach(m => console.log('   %s  %s', m[1].padStart(3), m[2]));

// simula recortes
const W = JSON.parse(js.match(/var W=(\[[\s\S]*?\]);var wl=/)[1]);
const C = JSON.parse(js.match(/var C=(\[[\s\S]*?\]);var W=/)[1]);
const ag = (rows) => rows.reduce((a, r) => { for (const k in r) { if (k === 'ym' || k === 'w' || k === 'uc') continue; a[k] = (a[k] || 0) + r[k]; } return a; }, {});
console.log();
console.log('=== RECORTES SIMULADOS ===');
console.log('  Todos          : base %s, compradores %s', ag(C).total, ag(C).compradores);
for (const wid of ['43', '7', '63']) {
  const a = ag(W.filter(r => r.w === wid));
  const nome = (opts.find(m => m[1] === wid) || [, , '?'])[2];
  console.log('  WL %-3s %-24s base %s, compradores %s', wid, nome.slice(0, 24), a.total || 0, a.compradores || 0);
}
fs.writeFileSync('saida_1e.html', h, 'utf8');
console.log('\ngravado: saida_1e.html');
