/* Avaliador do modelo de preço em JavaScript — o n8n não roda Python.
 *
 *   const { prever } = require('./aplica-modelo.js');   // no Node, para a prova
 *   prever(linhaCrua, evento, 'Cars2You', MODELO)        // no n8n, colado no nó
 *
 * MODELO é o `modelo.json` de `exporta-modelo.py`. O treino continua no Python;
 * aqui só se monta a matriz e se percorrem as árvores. Tudo que é regra (faixas,
 * sinais do texto, vocabulário, ordem das colunas) vem do JSON — nada é
 * redeclarado aqui, para o JS não divergir do Python em silêncio.
 * `prova-modelo-js.js` confere este arquivo contra o Python, venda a venda.
 *
 * Entrada crua: as colunas do analítico (roda-estudo.py), com os mesmos nomes:
 *   grupo, valor_fipe_anuncio, km, ano_modelo, data_venda, patio_uf, whitelabel_id,
 *   categoria, laudo, descricao, loja_id, cor, cambio, combustivel, carroceria
 * e o evento: dias, dia_semana (0 = segunda), hora.
 * data_venda, no carro não vendido, é o fim da oferta da negociação atual.
 *
 * Nenhum VMV, valor de venda ou comprador entra aqui (regra do projeto).
 */
function num(x) {
  if (x === null || x === undefined || x === '' || x === 'None') return 0;
  const v = Number(x);
  return isFinite(v) ? v : 0;
}
function vazio(x) { return x === null || x === undefined || x === '' || x === 'None'; }
/* o "%s" do Python: 594 -> "594", 594.0 -> "594" no caso de id vindo como float */
function idTexto(x) {
  if (vazio(x)) return 'None';
  const v = Number(x);
  return isFinite(v) && Math.floor(v) === v ? String(v) : String(x);
}
function faixa(valor, tabela, acima) {
  for (const [lim, rot] of tabela) if (valor < lim) return rot;
  return acima;
}
/* SEM barra invertida e sem regex no código deste arquivo: ele vai para o nó
   Code do n8n como string, e barra invertida transcrita a mais já derrubou um
   run (automations/n8n-sdk/README.md). As expressões dos sinais vêm do
   modelo.json, que é baixado como arquivo — ali regex não é problema. */
function ano4(d) {
  const s = String(d === null || d === undefined ? '' : d).slice(0, 4);
  if (s.length < 4) return null;
  for (const ch of s) if (ch < '0' || ch > '9') return null;
  return Number(s);
}
function faixaIdade(anoModelo, dataVenda, F) {
  const am = num(anoModelo);
  if (am < 1950) return F.idade_vazio;
  const a = ano4(dataVenda);
  if (a === null) return F.idade_vazio;
  const i = a - Math.trunc(am);
  for (const [lim, rot] of F.idade) if (i <= lim) return rot;
  return F.idade_acima;
}
/* o norm() de analisa-sinais.py: minúsculo, sem acento, sem tag, só [a-z0-9]
   separado por um espaço. Acento = marca combinante U+0300 a U+036F do NFD. */
function norm(t) {
  t = String(t === null || t === undefined ? '' : t).toLowerCase().normalize('NFD');
  let semAcento = '', dentroTag = false;
  for (const ch of t) {
    const c = ch.codePointAt(0);
    if (c >= 0x300 && c <= 0x36f) continue;
    if (ch === '<') { dentroTag = true; continue; }
    if (dentroTag) { if (ch === '>') { dentroTag = false; semAcento += ' '; } continue; }
    semAcento += ch;
  }
  /* "<" sem ">" depois: o Python não casa a tag e mantém o texto */
  if (dentroTag) semAcento = semAcento + t.slice(t.lastIndexOf('<') + 1);
  let out = '', espaco = false;
  for (const ch of semAcento) {
    const ok = (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9');
    if (ok) { out += ch; espaco = false; } else if (!espaco && out) { out += ' '; espaco = true; }
  }
  return out.trim();
}
const _rx = new WeakMap();
function sinaisCompilados(M) {
  if (!_rx.has(M)) {
    _rx.set(M, M.sinais.map((s) => ({ rotulo: s.rotulo, rx: new RegExp(s.rx), bl: s.bloqueio ? new RegExp(s.bloqueio) : null })));
  }
  return _rx.get(M);
}
const _ix = new WeakMap();
function indiceColunas(M) {
  if (!_ix.has(M)) {
    const ix = {};
    M.colunas.slice(0, M.n_onehot).forEach((n, i) => { ix[n] = i; });
    _ix.set(M, ix);
  }
  return _ix.get(M);
}

/* a matriz de uma linha, na ordem de M.colunas: one-hot, log(FIPE), km, numéricas */
function matriz(cru, evento, base, M) {
  const F = M.faixas, f = num(cru.valor_fipe_anuncio);
  const cat = {};
  cat.km = base + ':' + (vazio(cru.km) ? F.km_vazio : faixa(num(cru.km), F.km, F.km_acima));
  cat.idade = base + ':' + faixaIdade(cru.ano_modelo, cru.data_venda, F);
  cat.uf = String(cru.patio_uf || '').trim().toUpperCase() || 'sem UF';
  cat.canal = base + ':wl' + idTexto(cru.whitelabel_id);
  cat.categoria = cru.categoria || 'nao informada';
  cat.faixa_fipe = faixa(f, F.fipe, F.fipe_acima);
  cat.laudo_banco = String(cru.laudo || '').trim() || 'sem laudo';
  cat.vendedor = base + ':' + idTexto(cru.loja_id);
  for (const c of ['cor', 'cambio', 'combustivel', 'carroceria']) {
    cat[c] = String(cru[c] || 'nao informado').trim().toLowerCase();
  }
  const bins = [];
  const t = norm(cru.descricao);
  for (const s of sinaisCompilados(M)) {
    if (s.rx.test(t) && !(s.bl && s.bl.test(t))) bins.push('texto: ' + s.rotulo);
  }
  const ix = indiceColunas(M);
  const onehot = [];
  for (const c of M.cats) {
    if (cat[c] !== undefined && ix[c + '=' + cat[c]] !== undefined) onehot.push(ix[c + '=' + cat[c]]);
  }
  for (const b of bins) {
    if (M.prefixos.some((p) => b.indexOf(p) === 0) && ix[b] !== undefined) onehot.push(ix[b]);
  }
  const ev = evento || {};
  const nums = [Math.log(f), vazio(cru.km) ? NaN : Math.trunc(num(cru.km))]
    .concat(M.numericas.map((k) => (ev[k] === null || ev[k] === undefined ? NaN : Number(ev[k]))));
  const X = new Array(M.colunas.length).fill(0);
  onehot.forEach((i) => { X[i] = 1; });
  nums.forEach((v, j) => { X[M.n_onehot + j] = v; });
  return { X, onehot: onehot.slice().sort((a, b) => a - b), nums };
}

function soma(arv, X) {
  let s = arv.base;
  for (const nos of arv.arvores) {
    let i = 0;
    for (;;) {
      const [col, lim, vazioEsq, esq, dir, folha, valor] = nos[i];
      if (folha) { s += valor; break; }
      const x = X[col];
      i = Number.isNaN(x) ? (vazioEsq ? esq : dir) : (x <= lim ? esq : dir);
    }
  }
  return s;
}

/* erf com erro < 1,2e-7 (Numerical Recipes, erfc de Chebyshev) */
function erf(x) {
  const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
    t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
    t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? 1 - r : r - 1;
}

/* -> {razao, preco, faixa:[min,max], conf, coberto} ou null se não dá para prever */
function prever(cru, evento, base, M) {
  const f = num(cru.valor_fipe_anuncio);
  if (f <= 0) return null;
  const { X } = matriz(cru, evento, base, M);
  const g = base + '|' + cru.grupo;
  const coberto = M.partida.modelo[g] !== undefined;
  const partida = coberto ? M.partida.modelo[g] : M.partida.base[base];
  const p = partida + soma(M.arvores.preco, X);
  const lo = partida + soma(M.arvores.q10, X);
  const hi = partida + soma(M.arvores.q90, X);
  const C = M.calibracao;
  const meia = Math.max((hi - lo) / 2, 1e-4) / p * C.k;
  const bruto = erf(0.10 / ((meia / C.z90) * Math.SQRT2));
  const q = Math.min(Math.max(bruto, 1e-3), 1 - 1e-3);
  const conf = 1 / (1 + Math.exp(-(C.a * Math.log(q / (1 - q)) + C.b)));
  return { razao: p, preco: f * p, faixa: [f * p * (1 - meia), f * p * (1 + meia)], conf, coberto,
           q10: lo, q90: hi };
}

if (typeof module !== 'undefined') module.exports = { prever, matriz, norm };
