// Roda o Montar HTML fora do n8n, alimentado com os dados GRAVADOS da
// execucao 48437. Simula $('Montar Queries') e $('MCP Run') — os dois unicos
// globais do n8n que o no usa (verificado por regex, nao suposto).
// Assim da pra iterar no gerador sem gastar 13 min de producao por tentativa.
const fs = require('fs');

const DUMP = 'C:/Users/thoma/.claude/projects/C--Users-thoma-Documents-work-brain/2bedc899-1389-411d-893a-b9d7ea5c9bc4/tool-results/mcp-ad7bbf4e-95de-4891-81aa-0a35fe700e94-get_workflow_execution-1788482029557.txt';
const NODE = process.argv[2] || 'Montar_HTML_coorte.js';

const d = JSON.parse(fs.readFileSync(DUMP, 'utf8'));
const rd = d.data.resultData.runData;
const mq = rd['Montar Queries'][0].data.main[0];
const mcp = rd['MCP Run'][0].data.main[0];
console.log('dados da 48437: %d queries, %d respostas', mq.length, mcp.length);

const $ = (nome) => ({
  all: () => (nome === 'Montar Queries' ? mq : mcp),
});

const src = fs.readFileSync(NODE, 'utf8');
let out;
try {
  out = new Function('$', src)($);
} catch (e) {
  console.error('\n*** ERRO AO EXECUTAR O NO ***');
  console.error(e.message);
  console.error(String(e.stack).split('\n').slice(0, 4).join('\n'));
  process.exit(1);
}

console.log();
console.log('=== SAIDA DO NO ===');
console.log('  campos      :', Object.keys(out.json).join(', '));
console.log('  totalBase   :', out.json.totalBase);
console.log('  volume      : R$', Number(out.json.volume).toLocaleString('pt-BR'));
console.log('  html        :', out.json.html.length, 'chars');

const h = out.json.html;
console.log();
console.log('=== KPIs RENDERIZADOS ===');
const bloco = h.slice(h.indexOf('Clientes na base') - 200, h.indexOf('Funil') );
const re = /<div class="kpi-label">([^<]+)<\/div><div class="kpi-value">([^<]*)<\/div><div class="kpi-sub">([^<]*)</g;
let m, n = 0;
while ((m = re.exec(bloco)) !== null) {
  console.log('  %-22s %-16s %s', m[1], m[2], m[3].slice(0, 46));
  n++;
}
if (!n) console.log('  (nenhum kpi casou o padrao)');

console.log();
console.log('=== SITUACAO ===');
const sm = h.match(/Cadastros por Situação[\s\S]{0,1800}/);
if (sm) {
  const vals = [...sm[0].matchAll(/<td[^>]*>([\d.]+)<\/td>/g)].map(x => x[1]);
  console.log('  valores na tabela:', vals.slice(0, 12).join(' | ') || '(vazio)');
}

fs.writeFileSync('saida_local.html', h, 'utf8');
console.log();
console.log('html gravado em saida_local.html');
