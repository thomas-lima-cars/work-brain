/* Provas do Painel de Precificação — rodar ANTES de mandar qualquer coisa ao n8n.

     node prova-local.js

   Usa dados-local.json (coleta_local.py, dado real) e o modelo.json do
   preditivo. Cada prova diz o que protege. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { roda } = require('./_roda_no.js');
const { injeta, alvo, semCR } = require('./_aplica-modelo.js');

const AQUI = __dirname;
const PREDITIVO = path.join(AQUI, '..', '..', 'precificacao', 'preditivo');
const dados = JSON.parse(fs.readFileSync(path.join(AQUI, 'dados-local.json'), 'utf8'));
const modelo = JSON.parse(fs.readFileSync(path.join(PREDITIVO, 'modelo.json'), 'utf8'));
let falhas = 0;
const ok = (cond, msg) => { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) falhas++; };
const nos = (mcp) => ({ 'Montar Consultas': dados.consultas, 'MCP Consultas': mcp || dados.mcp,
  'Ler Modelo': [{ json: modelo }] });
const extrai = (html) => {
  const i = html.indexOf('var D=') + 6, j = html.indexOf(';(function pagina');
  return JSON.parse(html.slice(i, j).split(String.fromCharCode(92) + 'u003c').join('<'));
};

console.log('1. o que foi injetado no nó está igual à fonte');
const fonte = semCR(fs.readFileSync(alvo, 'utf8'));
ok(injeta(fonte) === fonte, 'tema, logos e avaliador do modelo atualizados (senão: node _aplica-modelo.js)');

console.log('2. os nós que vão ao n8n');
for (const f of ['montar-consultas.js', 'montar-painel.js', 'virar-arquivo.js']) {
  const s = fs.readFileSync(path.join(AQUI, 'n8n', f), 'utf8');
  ok(s.indexOf(String.fromCharCode(92)) < 0 && s.indexOf('`') < 0 && s.indexOf('${') < 0,
    'n8n/' + f + ' sem barra invertida, crase ou ${');
}
const orig = roda('montar-painel.js', nos())[0].json;
const enx = roda('n8n/montar-painel.js', nos())[0].json;
/* o código da página vai pelo toString(), com os comentários; o enxuto os tira */
const semComent = (h) => h.split('/*').map((p, i) => (i ? p.slice(p.indexOf('*/') + 2) : p)).join('').replace(/\s+/g, ' ');
ok(semComent(orig.html) === semComent(enx.html), 'o nó enxuto gera o mesmo HTML que o original (fora os comentários)');

console.log('3. o VMV não entra no modelo (regra do projeto)');
const mexido = JSON.parse(JSON.stringify(dados.mcp));
const cols = dados.consultas[0].json.cols, iv = cols.indexOf('vmv');
mexido.forEach((m, k) => {
  if (dados.consultas[k].json.queryName.indexOf('veiculos') !== 0) return;
  const row = m.json.structuredContent.rows[0];
  const L = JSON.parse(row[1]); L.forEach((r) => { r[iv] = 7777777; }); row[1] = JSON.stringify(L);
});
const A = extrai(orig.html).linhas, B = extrai(roda('montar-painel.js', nos(mexido))[0].json.html).linhas;
ok(A.length === B.length && A.every((l, i) => l[9] === B[i][9] && JSON.stringify(l[10]) === JSON.stringify(B[i][10]) && l[11] === B[i][11]),
  'trocar todo VMV por 7.777.777 não muda nenhum preço, faixa ou confiança');

console.log('4. totais e cobertura');
const totais = dados.mcp.map((m, k) => [dados.consultas[k].json.queryName, Number(m.json.structuredContent.rows[0][0])]);
const nVeic = totais.filter((t) => t[0].indexOf('veiculos') === 0).reduce((s, t) => s + t[1], 0);
const D = extrai(orig.html);
ok(D.linhas.length === nVeic, 'todo veículo do banco está na tela (' + nVeic + ')');
const EXC = ['Motocicleta', 'Caminhao', 'Onibus', 'Reboque', 'Semireboque'];
const semEst = D.linhas.filter((l) => l[9] === null && l[8] > 0 && l[17].indexOf('categoria') < 0);
ok(semEst.length === 0, 'todo carro leve com FIPE recebeu estimativa (' + semEst.length + ' sem)');
ok(D.linhas.every((l) => l[9] === null || (l[10][0] <= l[9] && l[9] <= l[10][1])), 'o preço estimado está sempre dentro da faixa provável');
ok(D.linhas.every((l) => l[11] === null || (l[11] > 0 && l[11] < 1)), 'confiança entre 0 e 1');
const razoes = D.linhas.filter((l) => l[9]).map((l) => l[9] / l[8]).sort((a, b) => a - b);
ok(razoes[0] > 0.2 && razoes[razoes.length - 1] < 1.3, 'razão estimada/FIPE entre ' + razoes[0].toFixed(2) + ' e ' + razoes[razoes.length - 1].toFixed(2));

console.log('5. o avaliador JS reproduz o Python');
let saidaPy = '';
try { saidaPy = execFileSync('node', [path.join(PREDITIVO, 'prova-modelo-js.js')], { encoding: 'utf8' }); }
catch (e) { saidaPy = String(e.stdout || e); }
ok(saidaPy.indexOf('o JS reproduz o Python') >= 0, saidaPy.trim().split(String.fromCharCode(10))[0]);

console.log('6. a página e o arquivo');
ok(orig.html.indexOf('<script src') < 0 && orig.html.indexOf('<link') < 0 && orig.html.indexOf('@import') < 0,
  'nenhuma requisição de rede (abre offline, do SharePoint)');
const arq = roda('virar-arquivo.js', {}, [{ json: { html: orig.html } }])[0];
ok(arq.binary && arq.binary.data && decodeURI(arq.json.caminho) === 'Painel de Precificação/painel-precificacao.html',
  'Virar Arquivo monta o binário em ' + decodeURI(arq.json && arq.json.caminho));
const wf = fs.readFileSync(path.join(AQUI, 'painel-precificacao.wf.ts'), 'utf8');
ok(wf.indexOf(encodeURI('Painel de Precificação') + '/modelo.json:/content') >= 0 && wf.indexOf('Painel de Precificação/modelo.json') < 0,
  'o Ler Modelo do workflow pede o modelo.json com o caminho codificado');

console.log(falhas ? '\n' + falhas + ' prova(s) falharam' : '\ntodas as provas passaram');
process.exit(falhas ? 1 : 0);
