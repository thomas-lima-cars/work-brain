/* QUE PALAVRAS DA DESCRIÇÃO MEXEM NO DESÁGIO.
 * Uso: node analisa-texto.js [texto-51368.json] [saida.json]
 *
 * ── O QUE O DADO É ────────────────────────────────────────────────────────
 * 1.725 células (modelo × texto), somando 4.582 vendas. A `description` do
 * veículo NÃO é texto livre de verdade: 1.365 textos distintos, e duas frases
 * sozinhas cobrem 44% da base. É boilerplate com variação.
 *
 * ── POR QUE N-GRAMAS E NÃO PALAVRAS SOLTAS ───────────────────────────────
 * O texto é um checklist onde a NEGAÇÃO carrega o significado:
 *   "Possui Chave"  vs  "Não Possui Chave"
 *   "Motor Funciona" vs "Motor Não Funciona"
 *   "Com Estepe"    vs  "Sem Estepe"
 * A palavra "chave" aparece nos dois lados. Um tokenizador de palavra única
 * daria efeito ~zero para "chave" e concluiria que chave não importa — quando
 * o que importa é ter ou não ter. Por isso 1 a 4 palavras seguidas.
 *
 * ── O EFEITO É MEDIDO DENTRO DO MODELO ───────────────────────────────────
 * Igual ao resto do estudo: para cada célula, o desvio em relação à média do
 * próprio modelo. Sem isso, "REPASSE" pareceria caro só por aparecer mais em
 * modelo que já é caro.
 *
 * ⚠️ O t É APROXIMADO. O dado veio agregado por célula, então a variância
 * DENTRO da célula não está aqui. Para as células de 1 venda (a maioria) isso
 * é exato; para "REPASSE" num modelo com 50 vendas, subestima a variância e
 * portanto superestima o t. Trate o t como triagem, não como prova.
 *
 * ⚠️ TESTE MÚLTIPLO. Milhares de n-gramas testados contra o mesmo alvo
 * produzem achados por acaso. Os cortes (n mínimo, nº de modelos, |efeito|)
 * existem para isso, e mesmo assim o topo da lista merece confirmação.
 */
const fs = require('fs');

const arq = process.argv[2] || 'texto-51368.json';
const saidaJson = process.argv[3] || 'termos-51368.json';
const D = JSON.parse(fs.readFileSync(arq, 'utf8'));

const N_MIN = 40;      /* vendas mínimas para o termo entrar */
const MOD_MIN = 4;     /* modelos distintos mínimos */
const MAX_GRAMA = 4;
const pct = (x) => (x * 100).toFixed(1).replace('.', ',') + '%';
const pp = (x) => (x >= 0 ? '+' : '−') + Math.abs(x * 100).toFixed(1).replace('.', ',');
const br = (x) => Number(x).toLocaleString('pt-BR');

/* ── normalização: o que vira token ──────────────────────────────────────
   <br> vira espaço (senão "laudo<br>ipva" vira uma palavra só), acento sai,
   pontuação vira separador. O hífen de "para-choque" também: assim ele entra
   como bigrama "para choque", que é como as outras variantes escrevem. */
const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
function normaliza(t) {
  return semAcento(String(t || '').toLowerCase())
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/* palavras que não carregam informação — entram só como parte de n-grama */
const VAZIAS = new Set(['de', 'da', 'do', 'e', 'a', 'o', 'em', 'no', 'na', 'os', 'as',
  'um', 'uma', 'para', 'por', 'ao', 'aos', 'que', 'se', 'ou']);
/* token que parece identificador não entra: nem como termo, nem em n-grama */
const ehLixo = (p) => /^\d+$/.test(p) && p.length > 2;

function gramas(txt) {
  const ps = normaliza(txt).split(' ').filter((p) => p && !ehLixo(p));
  const out = new Set();
  for (let n = 1; n <= MAX_GRAMA; n++) {
    for (let i = 0; i + n <= ps.length; i++) {
      const g = ps.slice(i, i + n);
      if (n === 1 && (VAZIAS.has(g[0]) || g[0].length < 3)) continue;
      out.add(g.join(' '));
    }
  }
  return out;
}

/* ── células, resíduo por modelo ─────────────────────────────────────────── */
const cel = D.celulas.map((r) => ({
  grupo: r.grupo, texto: r.texto, n: Number(r.vendas),
  des: 1 - Number(r.razao_media)
}));
const TOTAL = cel.reduce((s, c) => s + c.n, 0);

const porModelo = {};
cel.forEach((c) => {
  if (!porModelo[c.grupo]) porModelo[c.grupo] = { s: 0, n: 0 };
  porModelo[c.grupo].s += c.des * c.n; porModelo[c.grupo].n += c.n;
});
cel.forEach((c) => { c.res = c.des - porModelo[c.grupo].s / porModelo[c.grupo].n; });
const MEDIA = cel.reduce((s, c) => s + c.des * c.n, 0) / TOTAL;

/* ── índice termo → células ──────────────────────────────────────────────── */
const idx = new Map();
cel.forEach((c, i) => {
  gramas(c.texto).forEach((g) => {
    if (!idx.has(g)) idx.set(g, []);
    idx.get(g).push(i);
  });
});

/* ── efeito de cada termo ────────────────────────────────────────────────── */
const somaN = TOTAL;
const termos = [];
idx.forEach((ids, termo) => {
  let nc = 0, sc = 0, modelos = new Set();
  ids.forEach((i) => { const c = cel[i]; nc += c.n; sc += c.res * c.n; modelos.add(c.grupo); });
  if (nc < N_MIN || modelos.size < MOD_MIN) return;
  const ns = somaN - nc;
  if (ns < N_MIN) return;
  /* a média ponderada de TODOS os resíduos é zero, então o "sem" sai por
     complemento — não precisa varrer o resto das células */
  const ss = -sc;
  const mCom = sc / nc, mSem = ss / ns;

  /* variância ponderada entre células, com a célula como observação.
     É onde mora a aproximação avisada no cabeçalho. */
  let vc = 0;
  ids.forEach((i) => { const c = cel[i]; vc += c.n * (c.res - mCom) * (c.res - mCom); });
  const dpCom = nc > 1 ? Math.sqrt(vc / (nc - 1)) : null;
  let vs = 0;
  cel.forEach((c, i) => { if (ids.indexOf(i) < 0) vs += c.n * (c.res - mSem) * (c.res - mSem); });
  const dpSem = ns > 1 ? Math.sqrt(vs / (ns - 1)) : null;
  const se = (dpCom !== null && dpSem !== null)
    ? Math.sqrt(dpCom * dpCom / nc + dpSem * dpSem / ns) : null;

  termos.push({
    termo, palavras: termo.split(' ').length,
    vendas: nc, celulas: ids.length, modelos: modelos.size,
    desagio_com: MEDIA + mCom, desagio_sem: MEDIA + mSem,
    efeito: mCom - mSem,
    t: se ? (mCom - mSem) / se : null,
    _ids: ids
  });
});

/* ── redundância: n-grama que só repete um termo menor ───────────────────
   "repasse informacoes no laudo" cobre exatamente as mesmas vendas que
   "repasse". Manter os dois infla a lista e finge dois achados onde há um. */
termos.sort((a, b) => b.palavras - a.palavras || b.vendas - a.vendas);
const vistos = [];
termos.forEach((t) => {
  t.redundante = vistos.some((v) =>
    (v.termo.indexOf(t.termo) >= 0 || t.termo.indexOf(v.termo) >= 0) &&
    Math.abs(v.vendas - t.vendas) / Math.max(v.vendas, t.vendas) < 0.05 &&
    v.palavras < t.palavras);
  if (!t.redundante) vistos.push(t);
});
/* fica o mais curto de cada família com a mesma cobertura */
const fam = {};
termos.filter((t) => !t.redundante).forEach((t) => {
  const k = t.vendas + '|' + t.celulas;
  if (!fam[k] || t.palavras < fam[k].palavras) fam[k] = t;
});
const finais = Object.keys(fam).map((k) => fam[k]);
finais.forEach((t) => { delete t._ids; });
finais.sort((a, b) => Math.abs(b.efeito) - Math.abs(a.efeito));

/* ── saída ───────────────────────────────────────────────────────────────── */
const saida = {
  execucao: D.execucao, gerado_em: D.gerado_em,
  base: {
    vendas: TOTAL, celulas: cel.length,
    textos_distintos: Number(D.gabarito.textos_distintos),
    modelos: Number(D.gabarito.modelos), desagio_medio: MEDIA,
    com_texto: cel.filter((c) => c.texto && c.texto.trim()).reduce((s, c) => s + c.n, 0)
  },
  cortes: { n_min: N_MIN, modelos_min: MOD_MIN, max_grama: MAX_GRAMA },
  termos: finais
};
fs.writeFileSync(saidaJson, JSON.stringify(saida, null, 1), 'utf8');

console.log('\n' + '═'.repeat(78));
console.log('TERMOS DA DESCRIÇÃO — efeito no deságio, dentro do mesmo modelo');
console.log('═'.repeat(78));
console.log('  ' + br(TOTAL) + ' vendas · ' + br(cel.length) + ' células (modelo × texto) · ' +
  br(saida.base.textos_distintos) + ' textos distintos');
console.log('  deságio médio ' + pct(MEDIA) + ' · termos testados: ' + br(idx.size) +
  ' · sobreviveram aos cortes: ' + br(finais.length));
console.log('  cortes: n ≥ ' + N_MIN + ' vendas, ≥ ' + MOD_MIN + ' modelos, 1 a ' + MAX_GRAMA + ' palavras\n');

const cab = '  termo                                    vendas  mod  c/termo  s/termo   efeito     t';
console.log(cab);
console.log('  ' + '-'.repeat(76));
finais.slice(0, 30).forEach((t) => {
  console.log('  ' + t.termo.slice(0, 40).padEnd(41) +
    String(br(t.vendas)).padStart(6) +
    String(t.modelos).padStart(5) +
    pct(t.desagio_com).padStart(9) +
    pct(t.desagio_sem).padStart(9) +
    (pp(t.efeito) + ' p.p.').padStart(11) +
    (t.t === null ? '   —' : t.t.toFixed(1).replace('.', ',').padStart(6)));
});
console.log('\n  gravado ' + saidaJson + '\n');
