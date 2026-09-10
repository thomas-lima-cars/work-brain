/* ══════════════════════════════════════════════════════════════════════
   Aplica o corte de correspondencia minima num `dados-*.json` ja coletado.

   Existe porque o corte mora na secao de CALCULO do no, e o
   `monta_html_de_dados.js` so reexecuta a de RENDER. Sem isto eu teria de
   gastar um run de 9 minutos so pra ver a tela nova com o numero certo de
   pares.

   Nao substitui o run: serve pra desenvolver e conferir o layout contra
   dado realista. O arquivo gerado leva `_previa` no nome pra ninguem
   confundir com coleta de verdade.

     node _previa_corte.js dados-49976.json 50
   ══════════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const entrada = process.argv[2] || 'dados-49976.json';
const MIN = Number(process.argv[3] || 50);
const D = JSON.parse(fs.readFileSync(path.join(__dirname, entrada), 'utf8'));

const P = D.pares, DET = D.det;
const pares = [], det = [];
let descartados = 0;
for (let i = 0, k = 0; i < P.length; i += 3, k++) {
  if (P[i + 2] / 10 >= MIN) { pares.push(P[i], P[i + 1], P[i + 2]); det.push(DET[k]); }
  else descartados++;
}

/* recontagem: candidatos por veiculo, pares e melhor score por loja */
const cand = {}, melhorV = {}, melhorL = {}, nParesL = {};
for (let i = 0; i < pares.length; i += 3) {
  const vi = pares[i], li = pares[i + 1], s = pares[i + 2] / 10;
  cand[vi] = (cand[vi] || 0) + 1;
  nParesL[li] = (nParesL[li] || 0) + 1;
  if (!(melhorV[vi] >= s)) melhorV[vi] = s;
  if (!(melhorL[li] >= s)) melhorL[li] = s;
}
D.veiculos.forEach((v, i) => { v.candidatos = cand[i] || 0; v.melhor = cand[i] ? melhorV[i] : null; });
D.lojas.forEach((l, i) => { l.pares = nParesL[i] || 0; l.melhor = melhorL[i] || 0; });

D.pares = pares;
D.det = det;
D.parametros = D.parametros || {};
D.parametros.corresp_min = MIN;
D.parametros.pares_descartados = descartados;

const semPar = D.veiculos.filter((v) => !v.candidatos).length;
D.resumo.pares = pares.length / 3;
D.resumo.sem_par = semPar;
D.resumo.lojas_elegiveis = D.lojas.length;
D.resumo.media_candidatos = D.veiculos.length
  ? Math.round(D.veiculos.reduce((s, v) => s + v.candidatos, 0) / D.veiculos.length) : 0;

D.falhas = (D.falhas || []).filter((f) => !/sem nenhuma loja/.test(f));
if (semPar) {
  D.falhas.push(semPar + ' veiculo(s) sem nenhuma loja: ou nao ha loja na mesma UF e whitelabel, ' +
    'ou nenhuma passou da correspondencia minima de ' + MIN + '%');
}

const saida = entrada.replace(/\.json$/, '-previa.json');
fs.writeFileSync(path.join(__dirname, saida), JSON.stringify(D));
console.log('entrada: ' + entrada + '  corte: ' + MIN + '%');
console.log('saida:   ' + saida);
console.log('pares:   ' + (P.length / 3) + ' -> ' + (pares.length / 3) + '  (' + descartados + ' descartados)');
console.log('veiculos sem nenhuma loja: ' + semPar);
