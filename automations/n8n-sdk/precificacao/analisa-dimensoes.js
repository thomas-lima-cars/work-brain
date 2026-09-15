/* DESÁGIO DENTRO DO MESMO CÓDIGO FIPE — km, idade, UF e laudo.
 *
 * Uso: node analisa-dimensoes.js [dados-51095.json]
 *
 * A sonda 5 trouxe (codigo_fipe x faixa) agregado. Aqui as duas leituras saem
 * desse par:
 *
 *   BRUTO      média ponderada do deságio da faixa, misturando os 10 códigos.
 *              Engana: se a faixa "200k+" for quase só Meteor, ela herda o
 *              patamar do Meteor e não diz nada sobre quilometragem.
 *
 *   DENTRO DO  para cada código, o quanto aquela faixa desvia da média DAQUELE
 *   CÓDIGO     código; depois a média ponderada desses desvios. É o que o
 *              Thomas pediu: só veículos com o mesmo codigo_fipe comparados
 *              entre si. Exibido como média global + desvio, pra ficar na
 *              mesma escala do bruto.
 *
 * A diferença entre as duas colunas é exatamente o quanto a composição de
 * modelos estava contaminando a leitura.
 */
const fs = require('fs');
const arq = process.argv[2] || 'dados-51095.json';
const D = JSON.parse(fs.readFileSync(arq, 'utf8'));
const dd = D.dados;

const n = (x) => Number(x || 0);
const pct = (x, d) => (x * 100).toFixed(d === undefined ? 1 : d).replace('.', ',') + '%';
const pp = (x, d) => (x >= 0 ? '+' : '') + (x * 100).toFixed(d === undefined ? 1 : d).replace('.', ',');

const gab = dd.q_gabarito[0];
const TOTAL = n(gab.vendas);
const MEDIA = 1 - n(gab.razao_media);

/* rótulo limpo: tira o prefixo de ordenação 'a ', 'b '... */
const limpo = (f) => /^[a-z] /.test(f) ? f.slice(2) : f;
const ehSem = (f) => /^z /.test(f);

function analisa(chave) {
  const linhas = dd[chave] || [];
  /* deságio e peso por (código, faixa) */
  const cel = linhas.map((r) => ({
    cod: r.grupo || r.codigo_fipe, faixa: r.faixa, n: n(r.vendas),
    des: 1 - n(r.razao_media)
  }));
  const soma = cel.reduce((s, c) => s + c.n, 0);

  /* média de cada código, sobre as faixas desta dimensão */
  const porCod = {};
  cel.forEach((c) => {
    if (!porCod[c.cod]) porCod[c.cod] = { s: 0, n: 0 };
    porCod[c.cod].s += c.des * c.n; porCod[c.cod].n += c.n;
  });
  Object.keys(porCod).forEach((k) => { porCod[k].m = porCod[k].s / porCod[k].n; });

  /* por faixa: bruto e dentro-do-código */
  const porFaixa = {};
  cel.forEach((c) => {
    if (!porFaixa[c.faixa]) porFaixa[c.faixa] = { n: 0, sb: 0, sr: 0, cods: {} };
    const f = porFaixa[c.faixa];
    f.n += c.n;
    f.sb += c.des * c.n;
    f.sr += (c.des - porCod[c.cod].m) * c.n;
    f.cods[c.cod] = c.n;
  });

  const faixas = Object.keys(porFaixa).sort().map((k) => {
    const f = porFaixa[k];
    return {
      faixa: k, rotulo: limpo(k), sem: ehSem(k), n: f.n,
      bruto: f.sb / f.n,
      efeito: f.sr / f.n,
      dentro: MEDIA + f.sr / f.n,
      codigos: Object.keys(f.cods).length
    };
  });
  return { chave, total: soma, faixas, codigos: Object.keys(porCod).length };
}

const DIMS = [
  ['q_km', 'Quilometragem'],
  ['q_idade', 'Idade do veículo (ano da venda − ano do modelo)'],
  ['q_uf', 'UF do pátio'],
  ['q_laudo', 'Laudo cautelar']
];

console.log('\n' + '═'.repeat(76));
console.log('DESÁGIO DENTRO DO MESMO GRUPO — execução ' + D.execucao);
console.log('═'.repeat(76));
console.log('  total: ' + TOTAL.toLocaleString('pt-BR') + ' vendas · ' +
  n(gab.grupos || gab.codigos) + ' códigos · deságio médio ' + pct(MEDIA, 2));

if (dd.q_categorias_restantes) {
  console.log('  categorias que sobraram: ' + dd.q_categorias_restantes
    .map((c) => c.categoria + ' ' + n(c.vendas).toLocaleString('pt-BR')).join(' · '));
}

const saida = { execucao: D.execucao, total: TOTAL, media: MEDIA, dimensoes: {} };

DIMS.forEach(([chave, titulo]) => {
  const a = analisa(chave);
  saida.dimensoes[chave] = { titulo, total: a.total, faixas: a.faixas };

  console.log('\n' + '─'.repeat(76));
  console.log(titulo.toUpperCase());
  console.log('─'.repeat(76));
  const bate = a.total === TOTAL;
  console.log('  soma das faixas: ' + a.total.toLocaleString('pt-BR') +
    (bate ? ' = gabarito ✓' : ' ≠ gabarito ' + TOTAL + ' ✗'));
  console.log('');
  console.log('  faixa                  n    bruto   dentro do cód.   efeito   códs');
  console.log('  ' + '-'.repeat(70));
  a.faixas.forEach((f) => {
    console.log('  ' + (f.rotulo + (f.sem ? ' *' : '')).padEnd(20) +
      String(f.n).padStart(5) + '   ' +
      pct(f.bruto).padStart(6) + '   ' +
      pct(f.dentro).padStart(8) + '        ' +
      (pp(f.efeito) + ' p.p.').padStart(11) +
      String(f.codigos).padStart(6));
  });
  const uteis = a.faixas.filter((f) => !f.sem && f.n >= 20);
  if (uteis.length >= 2) {
    const alto = uteis.reduce((x, y) => y.efeito > x.efeito ? y : x);
    const baixo = uteis.reduce((x, y) => y.efeito < x.efeito ? y : x);
    console.log('\n  amplitude do efeito (faixas com n>=20): ' +
      pp(alto.efeito - baixo.efeito) + ' p.p.  (' + alto.rotulo + ' vs ' + baixo.rotulo + ')');
    /* o mesmo no bruto, pra a diferenca ficar visivel */
    const ab = uteis.reduce((x, y) => y.bruto > x.bruto ? y : x);
    const bb = uteis.reduce((x, y) => y.bruto < x.bruto ? y : x);
    console.log('  amplitude no bruto:                     ' +
      pp(ab.bruto - bb.bruto) + ' p.p.');
  }
});

fs.writeFileSync((process.argv[3] || 'dimensoes-51331.json'), JSON.stringify(saida, null, 1), 'utf8');
console.log('\n  gravado '+(process.argv[3]||'dimensoes-51331.json')+'\n');
