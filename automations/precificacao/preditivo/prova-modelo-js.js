/* Prova: o avaliador JS dá o MESMO preço que o Python, venda a venda.
 *
 *   node automations/precificacao/preditivo/prova-modelo-js.js
 *
 * Confere, para as 400 vendas de modelo-gabarito.json (exporta-modelo.py):
 *   1. a matriz: as mesmas colunas one-hot ligadas e os mesmos números
 *   2. a razão prevista, os quantis 10/90 (até 1e-9) e o índice (até 1e-4,
 *      porque o erf do JS é uma aproximação de 1e-7)
 * Falha = o JS divergiu do Python, e o painel mostraria outro preço.
 */
const fs = require('fs');
const path = require('path');
const { prever, matriz } = require('./aplica-modelo.js');

const M = JSON.parse(fs.readFileSync(path.join(__dirname, 'modelo.json'), 'utf8'));
const G = JSON.parse(fs.readFileSync(path.join(__dirname, 'modelo-gabarito.json'), 'utf8'));
let falhas = 0, maxR = 0, maxC = 0;
const erro = (msg) => { if (falhas++ < 8) console.log('  ✗ ' + msg); };

for (const g of G) {
  const m = matriz(g.cru, g.evento, g.base, M);
  const quem = g.base + ' veículo ' + g.cru.veiculo_id;
  if (JSON.stringify(m.onehot) !== JSON.stringify(g.onehot)) {
    const a = m.onehot.filter((i) => !g.onehot.includes(i)).map((i) => M.colunas[i]);
    const b = g.onehot.filter((i) => !m.onehot.includes(i)).map((i) => M.colunas[i]);
    erro(quem + ': one-hot difere. só no JS: ' + a.join(', ') + ' · só no Python: ' + b.join(', '));
  }
  g.num.forEach((v, j) => {
    const w = m.nums[j];
    if ((v === null) !== Number.isNaN(w) || (v !== null && Math.abs(v - w) > 1e-12)) {
      erro(quem + ': coluna numérica ' + M.colunas[M.n_onehot + j] + ' JS ' + w + ' Python ' + v);
    }
  });
  const p = prever(g.cru, g.evento, g.base, M);
  for (const [k, v] of [['razao', g.razao], ['q10', g.q10], ['q90', g.q90]]) {
    const d = Math.abs(p[k] - v); maxR = Math.max(maxR, d);
    if (d > 1e-9) erro(quem + ': ' + k + ' JS ' + p[k] + ' Python ' + v);
  }
  const dc = Math.abs(p.conf - g.conf); maxC = Math.max(maxC, dc);
  if (dc > 1e-4) erro(quem + ': conf JS ' + p.conf + ' Python ' + g.conf);
}
console.log(G.length + ' vendas · maior diferença na razão ' + maxR.toExponential(2) +
  ' · no índice ' + maxC.toExponential(2));
if (falhas) { console.log(falhas + ' divergência(s)'); process.exit(1); }
console.log('o JS reproduz o Python');
