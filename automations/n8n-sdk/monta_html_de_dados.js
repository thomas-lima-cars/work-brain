/* MONTA O HTML A PARTIR DO DADOS BAIXADO DO n8n.
 *
 * Uso: node monta_html_de_dados.js <dados.json> [saida.html]
 *
 * Faz exatamente o que o no "Montar HTML" faria dentro do n8n — mesma ordem,
 * mesmos marcadores, mesmo escape. A diferenca e so ONDE roda: aqui, porque
 * transmitir o app (46 KB) e o esqueleto (27 KB) pela API do MCP custa mais
 * do que baixar o DADOS (~350 KB) e montar fora.
 *
 * Se um dia o HTML voltar a ser montado no n8n, este arquivo continua valendo
 * como conferencia: os dois caminhos tem de produzir o mesmo byte.
 */
const fs = require('fs');
const path = require('path');
const HERE = __dirname;

const entrada = process.argv[2];
if (!entrada) {
  console.error('uso: node monta_html_de_dados.js <dados.json> [saida.html]');
  process.exit(1);
}
const saida = process.argv[3] || path.join(HERE, 'relatorio-base-clientes.html');

/* ─── 1. o dado ────────────────────────────────────────────────────────── */
const bruto = fs.readFileSync(entrada, 'utf8');
let DADOS;
try {
  DADOS = JSON.parse(bruto);
} catch (e) {
  console.error('✗ o arquivo nao e JSON valido: ' + e.message);
  process.exit(1);
}

/* ─── 2. as pecas do gerador, as mesmas que o n8n usaria ───────────────── */
const CSS = fs.readFileSync(path.join(HERE, 'gerador', '20-css.css'), 'utf8');
const SHELL = fs.readFileSync(path.join(HERE, 'gerador', '30-shell.html'), 'utf8');
const APP = fs.readFileSync(path.join(HERE, 'gerador', '40-app.js'), 'utf8');

/* ─── 3. provas antes de montar ────────────────────────────────────────── */
const falhas = [];
if (!DADOS.coorte || !DADOS.coorte.length) falhas.push('coorte vazia — o relatorio nao teria base');
if (!DADOS.meta || !DADOS.meta.wls || !DADOS.meta.wls.length) falhas.push('nenhum whitelabel');
if (!DADOS.campos || !DADOS.campos.length) falhas.push('campos da coorte ausentes');
if (falhas.length) { falhas.forEach(f => console.error('✗ ' + f)); process.exit(1); }

/* ─── 4. montagem — identica a do no ───────────────────────────────────── */
/* JSON.stringify pode gerar "</script>" dentro de uma string de dado (nome de
   loja com HTML, por exemplo) e fechar a tag antes da hora. O escape de "<"
   resolve sem mexer no valor: < volta a "<" no JSON.parse do navegador. */
const dadosJson = JSON.stringify(DADOS).split('<').join('\\u003c');

let html = SHELL
  .replace('/*__CSS__*/', function () { return CSS; })
  .replace('/*__DADOS__*/', function () { return dadosJson; })
  .replace('/*__APP__*/', function () { return APP; });

const d = new Date();
const p = (x) => String(x).padStart(2, '0');
html = html.replace('<span id="geradoEm"></span>',
  '<span id="geradoEm">' + p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + '</span>');

if (html.indexOf('/*__') >= 0) { console.error('✗ marcador nao substituido'); process.exit(1); }

fs.writeFileSync(saida, html, 'utf8');

/* ─── 5. o que foi embarcado, dito em voz alta ─────────────────────────── */
const conta = (k) => {
  const v = DADOS[k];
  if (!v) return 0;
  return v.length !== undefined ? v.length : Object.keys(v).length;
};
const SECOES = [
  ['KPIs / Situação / Destaques', ['coorte', 'coorteWl']],
  ['Recência', ['rec', 'recWl']],
  ['Evolução mensal', ['evLogin', 'evOferta', 'evCompra', 'evCadDia']],
  ['Evolução por whitelabel', ['evLoginWl', 'evOfertaWl', 'evCompraWl', 'evCadDiaWl']],
  ['Novos vs. recorrentes', ['nrLogin', 'nrOferta', 'nrCompra']],
  ['Novos vs. recorrentes por WL', ['nrLoginWl', 'nrOfertaWl', 'nrCompraWl']],
  ['Dinâmica de oferta', ['evMedia']],
  ['UF', ['ufCad', 'ufCom']],
  ['UF por whitelabel', ['ufCadWl', 'ufComWl']],
  ['Top 10', ['topHist', 'topAno', 'topAcesso', 'topOfertas']],
  ['Top 10 por whitelabel', ['topHistWl', 'topAnoWl', 'topAcessoWl', 'topOfertasWl']],
  ['Raio-X (oculto)', ['rxTotais', 'rxBuyers', 'rxBuyerWl']]
];

console.log('\n═══ HTML MONTADO ═══\n');
console.log('  arquivo:     ' + path.basename(saida));
console.log('  tamanho:     ' + (html.length / 1024).toFixed(0) + ' KB');
console.log('  gerado em:   ' + (DADOS.meta.gerado || '?'));
console.log('  whitelabels: ' + DADOS.meta.wls.length +
  ' — ' + DADOS.meta.wls.map(w => w[1] + ' (' + w[2] + ')').join(', '));
console.log('  safras:      ' + DADOS.coorte.length);
const iTot = DADOS.campos.indexOf('total');
const total = DADOS.coorte.reduce((s, l) => s + l[1 + iTot], 0);
console.log('  total (união dos whitelabels): ' + total.toLocaleString('pt-BR'));
if (DADOS.avisos && DADOS.avisos.length) {
  console.log('\n  ⚠️ avisos do gerador:');
  DADOS.avisos.forEach(a => console.log('     - ' + a));
}

console.log('\n  seção                            linhas   estado');
console.log('  ' + '-'.repeat(58));
let vazias = [];
SECOES.forEach(([nome, chaves]) => {
  const n = chaves.reduce((s, k) => s + conta(k), 0);
  const estado = n > 0 ? 'ok' : 'VAZIA — cai no global com selo';
  if (n === 0) vazias.push(nome);
  console.log('  ' + nome.padEnd(32) + String(n).padStart(7) + '   ' + estado);
});

console.log('\n' + '═'.repeat(60));
if (vazias.length) {
  console.log('Seções sem dado por whitelabel: ' + vazias.join(', ') + '.');
  console.log('O HTML mostra o total e marca com "sem recorte por whitelabel".');
} else {
  console.log('Todas as seções vieram com dado.');
}
console.log('═'.repeat(60) + '\n');
