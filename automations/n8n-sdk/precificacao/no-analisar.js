/* NÓ "Analisar" — regressão simples de cada coluna contra o deságio.
 *
 * Roda DENTRO do n8n, e não no meu lado, por um motivo prático: 1.302 linhas
 * x 38 colunas é grande demais para trafegar pela API do MCP a cada iteração.
 * O nó devolve só o resumo. A amostra crua fica no nó `Medir` da mesma
 * execução, exportável pela tela do n8n quando for preciso.
 *
 * A lógica é a mesma de `analisa-drivers.js`, que roda local sobre o JSON
 * baixado. Os dois têm de dar o mesmo número — se divergirem, um está errado.
 *
 * ── MÉTODO ────────────────────────────────────────────────────────────────
 *   coluna numérica   → OLS  deságio = a + b·x        R² = r²
 *   coluna categórica → OLS sobre dummies             R² = SS_entre/SS_total
 * As duas em R² na mesma escala, então numérica e categórica ranqueiam juntas.
 *
 * ── AS TRÊS CORREÇÕES QUE O R² CRU EXIGE ──────────────────────────────────
 * 1. R² AJUSTADO: 1 − (1−R²)(n−1)/(n−k−1). Uma categórica com 128 níveis
 *    explica muito por contagem de parâmetros. Ajustado negativo = pior que
 *    o acaso.
 * 2. CONTROLE PELO CÓDIGO FIPE: a mesma regressão sobre o resíduo (deságio
 *    menos a média do próprio modelo). Sem isso, toda coluna correlacionada
 *    com o modelo parece driver sem ser.
 * 3. DEGENERADA: `veiculo_id` dá R² = 1 sempre e não quer dizer nada.
 *    Separada, não apagada.
 *
 * ⚠️ Esta amostra tem 20 modelos. Tudo que é propriedade do MODELO (marca,
 * versão, categoria, carroceria, combustível, portas) é quase constante
 * dentro de um código — vai dar R² cru alto e controlado ~zero. Não é que não
 * importe: é que ESTA amostra não consegue testar. Ampliar em amostra.config.
 */

const pedidos = $('Montar Queries').all().map((i) => i.json);
const outs = $('MCP Exec').all();

/* ── ingestão ─────────────────────────────────────────────────────────── */
const dados = {};
const diag = {};
for (let i = 0; i < pedidos.length; i++) {
  const nome = pedidos[i].queryName;
  if (!dados[nome]) dados[nome] = [];
  if (!diag[nome]) diag[nome] = { chamadas: 0, linhas: 0, vazias: 0, truncadas: 0, erro: null };
  diag[nome].chamadas++;
  const o = outs[i] ? outs[i].json : null;
  const sc = o ? (o.structuredContent || o) : null;
  const err = o ? (o.error || (sc && sc.error)) : null;
  if (err && !diag[nome].erro) diag[nome].erro = String(err.message || err).slice(0, 200);
  if (sc && sc.truncated) diag[nome].truncadas++;
  const cols = (sc && sc.columns) || [];
  const rows = (sc && sc.rows) || [];
  if (!rows.length) { diag[nome].vazias++; continue; }
  diag[nome].linhas += rows.length;
  for (let r = 0; r < rows.length; r++) {
    const obj = {};
    for (let c = 0; c < cols.length; c++) obj[cols[c]] = rows[r][c];
    dados[nome].push(obj);
  }
}

/* ── o gabarito: sem ele, coleta truncada passa por completa ──────────── */
const gab = (dados.q_gabarito || [])[0] || {};
const colhidas = (dados.q_vendas || []).length;
const esperadas = Number(gab.vendas || 0);
const completa = esperadas > 0 && colhidas === esperadas;

/* páginas repetidas quebrariam a regressão sem dar erro */
const ids = {};
let duplicadas = 0;
(dados.q_vendas || []).forEach((r) => {
  if (ids[r.negociacao_id]) duplicadas++; else ids[r.negociacao_id] = 1;
});

/* ── deságio ──────────────────────────────────────────────────────────── */
const base = [];
(dados.q_vendas || []).forEach((r) => {
  const fipe = Number(r.valor_fipe_anuncio);
  const venda = Number(r.venda);
  if (fipe > 0 && venda > 0) {
    r.desagio = 1 - venda / fipe;
    base.push(r);
  }
});

/* ── resíduo por código FIPE ──────────────────────────────────────────── */
const pc = {};
base.forEach((r) => {
  const k = r.grupo;
  if (!pc[k]) pc[k] = { s: 0, n: 0 };
  pc[k].s += r.desagio; pc[k].n++;
});
base.forEach((r) => { r._res = r.desagio - pc[r.grupo].s / pc[r.grupo].n; });

/* ── os dois estimadores ──────────────────────────────────────────────── */
const NUM = ['valor_fipe_anuncio', 'valor_fipe_veiculo', 'valor_ref_vendedor', 'vmv',
  'valor_molicar_veiculo', 'valor_molicar_anuncio', 'valor_varejo',
  'ano_fabricacao', 'ano_modelo', 'km', 'portas', 'fipe_qtd_versoes'];
const DATA = ['data_venda', 'veiculo_criado_em', 'veiculo_atualizado_em'];
const IDENT = ['veiculo_id', 'negociacao_id'];
const FORA = ['desagio', 'venda'];

function olsNum(xs, ys) {
  const n = xs.length;
  if (n < 10) return null;
  let mx = 0, my = 0;
  for (let i = 0; i < n; i++) { mx += xs[i]; my += ys[i]; }
  mx /= n; my /= n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return null;
  const b = sxy / sxx;
  const sse = syy - b * sxy;
  const se = Math.sqrt((sse / (n - 2)) / sxx);
  return { n: n, k: 1, r2: (sxy * sxy) / (sxx * syy), b: b, t: se ? b / se : null };
}

function olsCat(cs, ys) {
  const n = cs.length;
  if (n < 10) return null;
  const g = {};
  let my = 0;
  for (let i = 0; i < n; i++) {
    const k = cs[i];
    if (!g[k]) g[k] = { s: 0, n: 0 };
    g[k].s += ys[i]; g[k].n++; my += ys[i];
  }
  my /= n;
  const niv = Object.keys(g);
  if (niv.length < 2) return null;
  let sst = 0;
  for (let i = 0; i < n; i++) sst += (ys[i] - my) * (ys[i] - my);
  if (sst === 0) return null;
  let ssb = 0;
  niv.forEach((k) => { const m = g[k].s / g[k].n; ssb += g[k].n * (m - my) * (m - my); });
  return { n: n, k: niv.length - 1, r2: ssb / sst, niveis: niv.length, grupos: g };
}

const aj = (r) => (!r || r.n - r.k - 1 <= 0) ? null
  : 1 - (1 - r.r2) * (r.n - 1) / (r.n - r.k - 1);

function avalia(col, campo) {
  const xs = [], ys = [], cs = [];
  const ehNum = NUM.indexOf(col) >= 0, ehData = DATA.indexOf(col) >= 0;
  for (let i = 0; i < base.length; i++) {
    const v = base[i][col];
    if (v === null || v === undefined || v === '') continue;
    const y = base[i][campo];
    if (ehNum) { const x = Number(v); if (isFinite(x)) { xs.push(x); ys.push(y); } }
    else if (ehData) { const t = Date.parse(v); if (isFinite(t)) { xs.push(t / 86400000); ys.push(y); } }
    else { cs.push(String(v)); ys.push(y); }
  }
  return (ehNum || ehData) ? olsNum(xs, ys) : olsCat(cs, ys);
}

const colunas = base.length ? Object.keys(base[0]).filter(
  (c) => FORA.indexOf(c) < 0 && c.charAt(0) !== '_') : [];

const res = [];
colunas.forEach((col) => {
  const cru = avalia(col, 'desagio');
  if (!cru) return;
  const ctl = avalia(col, '_res');
  const tipo = NUM.indexOf(col) >= 0 ? 'num' : (DATA.indexOf(col) >= 0 ? 'data' : 'cat');
  /* os 6 maiores níveis com n>=20, pra a leitura não ser só um número */
  let topo = null;
  if (tipo === 'cat' && cru.grupos) {
    topo = Object.keys(cru.grupos)
      .map((k) => ({ nivel: k, n: cru.grupos[k].n, desagio: cru.grupos[k].s / cru.grupos[k].n }))
      .filter((x) => x.n >= 20)
      .sort((a, b) => b.desagio - a.desagio);
    topo = topo.length > 8
      ? topo.slice(0, 4).concat(topo.slice(-4))
      : topo;
  }
  res.push({
    coluna: col, tipo: tipo, n: cru.n, niveis: cru.niveis || null,
    r2: Math.round(cru.r2 * 10000) / 10000,
    r2aj: aj(cru) === null ? null : Math.round(aj(cru) * 10000) / 10000,
    r2ctl: ctl ? Math.round(ctl.r2 * 10000) / 10000 : null,
    r2ctlAj: ctl && aj(ctl) !== null ? Math.round(aj(ctl) * 10000) / 10000 : null,
    b: cru.b === undefined ? null : cru.b,
    t: cru.t === undefined ? null : (cru.t === null ? null : Math.round(cru.t * 100) / 100),
    degenerada: IDENT.indexOf(col) >= 0 || (cru.niveis && cru.niveis > cru.n * 0.8),
    niveis_topo: topo
  });
});

res.sort((a, b) => (b.r2ctlAj === null ? -9 : b.r2ctlAj) - (a.r2ctlAj === null ? -9 : a.r2ctlAj));

/* ── descritiva do alvo ───────────────────────────────────────────────── */
let md = 0;
base.forEach((r) => { md += r.desagio; });
md /= (base.length || 1);
let vv = 0;
base.forEach((r) => { vv += (r.desagio - md) * (r.desagio - md); });
const dp = base.length > 1 ? Math.sqrt(vv / (base.length - 1)) : null;

return [{
  json: {
    gerado_em: new Date().toISOString(),
    amostra: pedidos.length ? pedidos[0].meta : null,
    coleta: {
      esperadas: esperadas, colhidas: colhidas, completa: completa,
      duplicadas: duplicadas,
      usadas_na_regressao: base.length,
      paginas: diag.q_vendas ? diag.q_vendas.chamadas : 0,
      paginas_vazias: diag.q_vendas ? diag.q_vendas.vazias : 0,
      truncadas: diag.q_vendas ? diag.q_vendas.truncadas : 0,
      erro: diag.q_vendas ? diag.q_vendas.erro : null,
      periodo: [gab.primeira || null, gab.ultima || null],
      codigos: Number(gab.codigos || 0)
    },
    desagio: {
      media: Math.round(md * 10000) / 10000,
      desvio: dp === null ? null : Math.round(dp * 10000) / 10000,
      por_codigo: Object.keys(pc).map((k) => ({
        grupo: k, n: pc[k].n, desagio: Math.round((pc[k].s / pc[k].n) * 10000) / 10000
      })).sort((a, b) => b.n - a.n)
    },
    regressoes: res
  }
}];
