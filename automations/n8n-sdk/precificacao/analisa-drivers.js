/* REGRESSÃO SIMPLES — uma coluna por vez contra o deságio.
 *
 * Uso: node analisa-drivers.js [dados-51075.json]
 *
 * Para cada coluna da amostra (menos o deságio e o valor da venda), roda uma
 * regressão simples e mede quanto da variação do deságio aquela coluna sozinha
 * explica.
 *
 *   coluna numérica     → OLS  deságio = a + b·x     R² = r²
 *   coluna categórica   → OLS sobre dummies          R² = SS_entre / SS_total
 *
 * As duas dão R² na MESMA escala, então dá pra ranquear numérica e categórica
 * na mesma tabela — que é o ponto de "uma análise para cada coluna".
 *
 * ── TRÊS COISAS QUE O R² CRU ESCONDE, E QUE ESTE SCRIPT CORRIGE ───────────
 *
 * 1. R² AJUSTADO. Uma categórica com 128 níveis (loja) e 1.302 linhas explica
 *    muito por pura contagem de parâmetros. O ajustado desconta isso:
 *      R²aj = 1 − (1−R²)·(n−1)/(n−k−1),  k = parâmetros
 *    Quando o ajustado fica NEGATIVO, a coluna explica menos que o acaso.
 *
 * 2. CONTROLE PELO CÓDIGO FIPE. Deságio varia muito mais ENTRE modelos do que
 *    dentro de um. Sem controlar, toda coluna correlacionada com o modelo
 *    (marca, carroceria, combustível) parece um driver sem ser. A coluna
 *    "controlado" roda a mesma regressão sobre o RESÍDUO — o deságio menos a
 *    média do próprio código FIPE. O que sobrevive ali é achado de verdade.
 *
 * 3. COLUNA DEGENERADA. `veiculo_id` tem 1 linha por nível: R² = 1,000 sempre,
 *    e não significa nada. São separadas em vez de apagadas, pra a exclusão
 *    ficar visível.
 *
 * ⚠️ ESTA AMOSTRA SÓ TEM 10 CÓDIGOS FIPE. Por construção, tudo que é
 * propriedade do MODELO (marca, versão, categoria, carroceria, combustível,
 * portas) é quase constante dentro de um código. Essas colunas vão aparecer
 * com R² cru alto e controlado ~zero — não porque não importam, mas porque
 * ESTA amostra não consegue testá-las. Para testar modelo é preciso ampliar o
 * recorte em `amostra.config.json`.
 */
const fs = require('fs');

const arq = process.argv[2] || 'dados-51075.json';
const D = JSON.parse(fs.readFileSync(arq, 'utf8'));
const linhas = D.vendas || D;

/* ── o deságio ─────────────────────────────────────────────────────────── */
const base = linhas
  .map((r) => {
    const fipe = Number(r.valor_fipe_anuncio);
    const venda = Number(r.venda);
    if (!(fipe > 0) || !(venda > 0)) return null;
    return Object.assign({}, r, { desagio: 1 - venda / fipe });
  })
  .filter(Boolean);

/* ── que coluna é de que tipo. Explícito, não adivinhado ──────────────── */
const NUMERICAS = [
  'valor_fipe_anuncio', 'valor_fipe_veiculo', 'valor_ref_vendedor', 'vmv',
  'valor_molicar_veiculo', 'valor_molicar_anuncio', 'valor_varejo',
  'ano_fabricacao', 'ano_modelo', 'km', 'portas', 'fipe_qtd_versoes'
];
const DATAS = ['data_venda', 'veiculo_criado_em', 'veiculo_atualizado_em'];
const IDENTIFICADORAS = ['veiculo_id', 'negociacao_id'];
const FORA = ['desagio', 'venda'];   /* o pedido: estas duas ficam de fora */

const todas = Object.keys(base[0]).filter((c) => FORA.indexOf(c) < 0);

/* ── regressão simples, numérica: OLS de 1 variável ───────────────────── */
function olsNumerica(xs, ys) {
  const n = xs.length;
  if (n < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return null;
  const b = sxy / sxx;
  const r2 = (sxy * sxy) / (sxx * syy);
  /* erro padrão do coeficiente, para saber se b é distinguível de zero */
  const sse = syy - b * sxy;
  const se = n > 2 ? Math.sqrt((sse / (n - 2)) / sxx) : NaN;
  return { n: n, r2: r2, k: 1, b: b, t: se ? b / se : NaN };
}

/* ── regressão simples, categórica: OLS sobre dummies ─────────────────── */
function olsCategorica(cats, ys) {
  const n = cats.length;
  const g = {};
  for (let i = 0; i < n; i++) {
    const k = cats[i];
    if (!g[k]) g[k] = { s: 0, n: 0 };
    g[k].s += ys[i]; g[k].n++;
  }
  const niveis = Object.keys(g);
  if (niveis.length < 2) return null;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sst = 0;
  for (let i = 0; i < n; i++) sst += (ys[i] - my) * (ys[i] - my);
  if (sst === 0) return null;
  let ssb = 0;
  niveis.forEach((k) => {
    const m = g[k].s / g[k].n;
    ssb += g[k].n * (m - my) * (m - my);
  });
  return { n: n, r2: ssb / sst, k: niveis.length - 1, niveis: niveis.length, grupos: g };
}

function ajustado(r) {
  if (!r || r.n - r.k - 1 <= 0) return null;
  return 1 - (1 - r.r2) * (r.n - 1) / (r.n - r.k - 1);
}

/* ── o resíduo: deságio menos a média do próprio código FIPE ──────────── */
const porCodigo = {};
base.forEach((r) => {
  const k = r.codigo_fipe;
  if (!porCodigo[k]) porCodigo[k] = { s: 0, n: 0 };
  porCodigo[k].s += r.desagio; porCodigo[k].n++;
});
base.forEach((r) => {
  const g = porCodigo[r.codigo_fipe];
  r._residuo = r.desagio - g.s / g.n;
});

/* ── roda tudo ────────────────────────────────────────────────────────── */
function avalia(col, campoY) {
  const pares = base
    .map((r) => ({ x: r[col], y: r[campoY] }))
    .filter((p) => p.x !== null && p.x !== undefined && p.x !== '');
  if (pares.length < 10) return null;

  if (NUMERICAS.indexOf(col) >= 0) {
    const xs = [], ys = [];
    pares.forEach((p) => {
      const v = Number(p.x);
      if (Number.isFinite(v)) { xs.push(v); ys.push(p.y); }
    });
    return xs.length >= 10 ? olsNumerica(xs, ys) : null;
  }
  if (DATAS.indexOf(col) >= 0) {
    const xs = [], ys = [];
    pares.forEach((p) => {
      const t = Date.parse(p.x);
      if (Number.isFinite(t)) { xs.push(t / 86400000); ys.push(p.y); }
    });
    return xs.length >= 10 ? olsNumerica(xs, ys) : null;
  }
  return olsCategorica(pares.map((p) => String(p.x)), pares.map((p) => p.y));
}

const res = [];
todas.forEach((col) => {
  if (col.charAt(0) === '_') return;
  const cru = avalia(col, 'desagio');
  const ctl = avalia(col, '_residuo');
  if (!cru) return;
  const tipo = NUMERICAS.indexOf(col) >= 0 ? 'num'
    : (DATAS.indexOf(col) >= 0 ? 'data' : 'cat');
  res.push({
    col: col, tipo: tipo, n: cru.n,
    niveis: cru.niveis || null,
    r2: cru.r2, r2aj: ajustado(cru),
    r2c: ctl ? ctl.r2 : null, r2cAj: ctl ? ajustado(ctl) : null,
    b: cru.b, t: cru.t, grupos: cru.grupos,
    degenerada: IDENTIFICADORAS.indexOf(col) >= 0 ||
      (cru.niveis && cru.niveis > cru.n * 0.8)
  });
});

/* ── saída ────────────────────────────────────────────────────────────── */
const pc = (x) => (x === null || !Number.isFinite(x)) ? '   —' :
  (x * 100).toFixed(1).replace('.', ',').padStart(5);
const md = (x) => x.toFixed(1).replace('.', ',');

console.log('\n' + '═'.repeat(78));
console.log('REGRESSÃO SIMPLES — cada coluna contra o deságio');
console.log('═'.repeat(78));
console.log('  amostra:  ' + (D.meta ? D.meta.amostra : '?') + '  ·  ' + base.length + ' vendas');
const ds = base.map((r) => r.desagio);
const mdes = ds.reduce((a, b) => a + b, 0) / base.length;
const dp = Math.sqrt(ds.reduce((a, b) => a + (b - mdes) * (b - mdes), 0) / (base.length - 1));
console.log('  deságio:  média ' + pc(mdes) + '%   desvio ' + pc(dp) + ' p.p.');
console.log('  códigos:  ' + Object.keys(porCodigo).length);

const uteis = res.filter((r) => !r.degenerada).sort((a, b) => (b.r2cAj || -9) - (a.r2cAj || -9));

console.log('\n  R² cru      = a coluna sozinha, sem controle');
console.log('  R² control. = a mesma coluna sobre o resíduo, já descontada a');
console.log('                média do código FIPE. É esta que vale.');
console.log('  aj          = ajustado por nº de parâmetros. Negativo = pior que o acaso.\n');
console.log('  coluna                    tipo  níveis    R²cru   R²aj   R²ctl  R²ctlAj');
console.log('  ' + '-'.repeat(74));
uteis.forEach((r) => {
  console.log('  ' + r.col.padEnd(26) + r.tipo.padEnd(6) +
    String(r.niveis === null ? '-' : r.niveis).padStart(5) + '  ' +
    pc(r.r2) + '  ' + pc(r.r2aj) + '  ' + pc(r.r2c) + '  ' + pc(r.r2cAj));
});

const deg = res.filter((r) => r.degenerada);
if (deg.length) {
  console.log('\n  DEGENERADAS — 1 linha por nível, R² trivial. Fora do ranking:');
  deg.forEach((r) => console.log('    ' + r.col + ' (' + r.niveis + ' níveis em ' + r.n + ' linhas)'));
}

/* ── detalhe dos que sobreviveram ao controle ─────────────────────────── */
const vencedores = uteis.filter((r) => r.r2cAj !== null && r.r2cAj > 0.01).slice(0, 6);
if (vencedores.length) {
  console.log('\n' + '═'.repeat(78));
  console.log('OS QUE SOBREVIVEM AO CONTROLE — detalhe');
  console.log('═'.repeat(78));
  vencedores.forEach((r) => {
    console.log('\n▸ ' + r.col + '   (R² controlado ajustado = ' + pc(r.r2cAj) + '%)');
    if (r.tipo === 'cat' && r.grupos) {
      const g = Object.keys(r.grupos)
        .map((k) => ({ k: k, n: r.grupos[k].n, m: r.grupos[k].s / r.grupos[k].n }))
        .filter((x) => x.n >= 20).sort((a, b) => b.m - a.m);
      if (!g.length) { console.log('    (nenhum nível com n >= 20)'); return; }
      console.log('    nível (n >= 20)              n    deságio médio');
      g.slice(0, 6).forEach((x) => console.log('    ' + x.k.slice(0, 26).padEnd(28) +
        String(x.n).padStart(4) + '     ' + pc(x.m) + '%'));
      if (g.length > 6) {
        console.log('    ...');
        const u = g[g.length - 1];
        console.log('    ' + u.k.slice(0, 26).padEnd(28) + String(u.n).padStart(4) +
          '     ' + pc(u.m) + '%');
        console.log('    amplitude entre extremos: ' + md((g[0].m - u.m) * 100) + ' p.p.');
      }
    } else {
      console.log('    coeficiente: ' + (r.b < 0.001 && r.b > -0.001
        ? r.b.toExponential(2) : r.b.toFixed(6)) + ' de deságio por unidade');
      console.log('    t = ' + (Number.isFinite(r.t) ? md(r.t) : '—') +
        '   (|t| > 2 ~ distinguível de zero)');
    }
  });
}
console.log('\n' + '═'.repeat(78) + '\n');
