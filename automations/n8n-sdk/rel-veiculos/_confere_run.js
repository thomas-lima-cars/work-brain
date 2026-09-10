/* ══════════════════════════════════════════════════════════════════════
   Confere um run contra a formula, do lado de ca.

   Por que existe: o codigo do no viajou ate o n8n como uma string longa,
   transcrita a mao. Um caractere trocado no meio da formula nao quebra a
   sintaxe -- so envenena os numeros, em silencio. Entao aqui eu pego os
   pares que o n8n publicou e RECALCULO cada um a partir de veiculos[] e
   lojas[], que vem no mesmo JSON. Se o `pontua()` la em cima nao for o
   mesmo daqui, os scores divergem e este script grita.

   Tambem confere a elegibilidade (mesma UF + whitelabel do evento), que e
   a regra que define o universo.

     node _confere_run.js dados-49846.json
   ══════════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const arq = process.argv[2] || 'dados-49846.json';
const D = JSON.parse(fs.readFileSync(path.join(__dirname, arq), 'utf8'));
const V = D.veiculos, L = D.lojas, P = D.pares, DET = D.det;
const CONF_MIN = (D.parametros && D.parametros.confianca_min) || 5;

function adNum(valor, media, desvio) {
  if (valor === null || media === null || !media) return null;
  if (desvio && desvio > 0) return 1 / (1 + (Math.abs(valor - media) / desvio));
  return 1 / (1 + (Math.abs(valor - media) / media));
}
function pesoNum(media, desvio) {
  if (!media || media <= 0) return 0;
  if (desvio === null || desvio === undefined || desvio < 0) return 0;
  return 1 / (1 + (desvio / media));
}
function pontua(v, l) {
  const comps = [];
  const pP = l.p_preco, pI = l.p_idade, pK = l.p_km;
  const aP = adNum(v.valor, l.preco_medio, l.preco_desvio);
  if (aP !== null && pP > 0) comps.push({ k: 'preco', a: aP, p: pP });
  const aI = adNum(v.idade, l.idade_media, l.idade_desvio);
  if (aI !== null && pI > 0) comps.push({ k: 'idade', a: aI, p: pI });
  const aK = adNum(v.km, l.km_medio, l.km_desvio);
  if (aK !== null && pK > 0) comps.push({ k: 'km', a: aK, p: pK });
  const pctM = l.pct_modelo / 100, pctC = l.pct_categoria / 100;
  if (pctM > 0 && v.model_id !== null) comps.push({ k: 'modelo', a: (v.modelo === l.modelo ? 1 : 0), p: pctM });
  if (pctC > 0 && v.category_id !== null) comps.push({ k: 'categoria', a: (v.categoria === l.categoria ? 1 : 0), p: pctC });
  if (!comps.length) return null;
  let sP = 0, sPA = 0;
  comps.forEach((c) => { sP += c.p; sPA += c.p * c.a; });
  if (sP <= 0) return null;
  const conf = l.confianca;
  return (sPA / sP) * conf * 100;
}

/* os pesos agora vem publicados. Confiro os dois: que o peso publicado
   e mesmo 1/(1+desvio/media), e que o score usa esse peso. */
const temPesos = L.length && L[0].p_preco !== undefined;
if (!temPesos) {
  console.log('ATENCAO: este run nao publica p_preco/p_idade/p_km -- e anterior');
  console.log('a mudanca do extrato. Nao da para conferir a formula contra ele.');
  process.exit(2);
}
const falhas = [];
L.forEach((l, i) => {
  const alvo = [['p_preco', pesoNum(l.preco_medio, l.preco_desvio)],
                ['p_idade', pesoNum(l.idade_media, l.idade_desvio)],
                ['p_km', pesoNum(l.km_medio, l.km_desvio)]];
  alvo.forEach((a) => {
    if (Math.abs(l[a[0]] - Math.round(a[1] * 1000) / 1000) > 0.0011 && falhas.length < 6) {
      falhas.push('loja ' + l.loja + ': ' + a[0] + ' publicado ' + l[a[0]] +
        ' mas 1/(1+desvio/media) da ' + a[1].toFixed(4));
    }
  });
  const c = Math.min(1, (l.qt_veiculos || 0) / CONF_MIN);
  if (Math.abs(l.confianca - Math.round(c * 100) / 100) > 0.011 && falhas.length < 8) {
    falhas.push('loja ' + l.loja + ': confianca publicada ' + l.confianca + ' x ' + c.toFixed(3));
  }
});

let conferidos = 0, piorDelta = 0, piorEm = null;

/* 1. cada par publicado bate com a formula recalculada aqui? */
for (let i = 0, k = 0; i < P.length; i += 3, k++) {
  const v = V[P[i]], l = L[P[i + 1]], sPub = P[i + 2] / 10;
  const sCalc = pontua(v, l);
  if (sCalc === null) { falhas.push('par ' + k + ': n8n pontuou ' + sPub + ' mas aqui nenhum componente vale'); continue; }
  /* tolerancia 0,5: os pesos vem publicados com 3 casas e o score com 1,
     entao um residuo pequeno e aritmetica, nao divergencia de formula. Um
     erro de transcricao real produz dezenas de pontos, nao decimos. */
  const d = Math.abs(sCalc - sPub);
  if (d > piorDelta) { piorDelta = d; piorEm = k; }
  if (d > 0.5) {
    if (falhas.length < 8) {
      falhas.push('par ' + k + ' (' + (v.marca || '') + ' ' + v.modelo + ' x ' + l.loja +
        '): n8n=' + sPub.toFixed(2) + ' local=' + sCalc.toFixed(2) + ' delta=' + d.toFixed(3));
    }
  }
  conferidos++;
}

/* 2. elegibilidade: todo par respeita UF e whitelabel do evento? */
let foraUf = 0, foraWl = 0;
for (let i = 0; i < P.length; i += 3) {
  const v = V[P[i]], l = L[P[i + 1]];
  if (v.uf !== l.uf) foraUf++;
  if ((v.wls || []).indexOf(l.whitelabel_id) < 0) foraWl++;
}
if (foraUf) falhas.push(foraUf + ' par(es) com UF diferente entre veiculo e loja');
if (foraWl) falhas.push(foraWl + ' par(es) com loja fora dos whitelabels do evento');

/* 3. contagem de candidatos por veiculo bate com os pares? */
const cont = {};
for (let i = 0; i < P.length; i += 3) cont[P[i]] = (cont[P[i]] || 0) + 1;
let contRuim = 0;
V.forEach((v, i) => { if ((cont[i] || 0) !== v.candidatos) contRuim++; });
if (contRuim) falhas.push(contRuim + ' veiculo(s) com candidatos[] fora de sincronia com os pares');

/* 4. o det de cada par tem os mesmos componentes que a formula produz */
let detRuim = 0;
for (let i = 0, k = 0; i < P.length && k < 500; i += 3, k++) {
  const d = DET[k] || {};
  Object.keys(d).forEach((c) => {
    if (['preco', 'idade', 'km', 'modelo', 'categoria'].indexOf(c) < 0) detRuim++;
    if (!(d[c] >= 0 && d[c] <= 100)) detRuim++;
  });
}
if (detRuim) falhas.push(detRuim + ' componente(s) de det fora do esperado');

console.log('arquivo: ' + arq);
console.log('pares conferidos: ' + conferidos + ' de ' + (P.length / 3));
console.log('maior divergencia: ' + piorDelta.toFixed(4) + (piorEm !== null ? ' (par ' + piorEm + ')' : ''));
console.log('elegibilidade: ' + foraUf + ' fora de UF, ' + foraWl + ' fora de whitelabel');
console.log('');
if (falhas.length) {
  falhas.forEach((f) => console.log('  FALHA ' + f));
  console.log('\n' + falhas.length + ' problema(s)');
  process.exit(1);
}
console.log('=== o run bate com a formula, ponto a ponto ===');
