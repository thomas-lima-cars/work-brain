/* SMOKE TEST do analítico. Uso: node _smoke_analitico.js [analitico-veiculos.html]
 *
 * `node --check` valida a SINTAXE do JavaScript. Não valida que o script acha
 * os elementos que procura, nem que a tabela sai com linha dentro. Este teste
 * monta um DOM de mentira, executa o script embarcado de verdade e confere o
 * resultado — é o mesmo padrão do `_smoke_dom.js` do rel-veiculos.
 *
 * O que ele pega, e que só apareceria abrindo a página: id trocado entre o HTML
 * e o script, coluna que não existe no dado, deságio calculado errado,
 * paginação fora do lugar, CSV com separador decimal errado.
 */
const fs = require('fs');
const path = require('path');

const arq = process.argv[2] || path.join(__dirname, 'analitico-veiculos.html');
const html = fs.readFileSync(arq, 'utf8');

const falhas = [];
const ok = (c, m) => { if (!c) falhas.push(m); };

/* ── 1. o HTML tem os elementos que o script procura ──────────────────── */
const ids = Array.from(html.matchAll(/getElementById\('([^']+)'\)/g)).map((m) => m[1]);
const unicos = Array.from(new Set(ids));
unicos.forEach((id) => {
  ok(new RegExp('id="' + id + '"').test(html), 'script procura #' + id + ', que não existe no HTML');
});

/* ── 2. DOM de mentira, só com o que o script toca ────────────────────── */
function noFalso(id) {
  const el = {
    id, _html: '', _txt: '', value: '', hidden: false, disabled: false,
    dataset: {}, children: [], classList: {
      _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
      toggle(c, f) { const t = f === undefined ? !this._s.has(c) : f; t ? this._s.add(c) : this._s.delete(c); return t; },
      contains(c) { return this._s.has(c); }
    },
    appendChild(x) { this.children.push(x); },
    querySelector() { return { checked: true }; },
    querySelectorAll(sel) {
      if (sel === 'select') return this.children.filter((c) => c.tag === 'select');
      if (sel === 'input:checked') return this._checks || [];
      if (sel === '#cab th') return this._ths || [];
      return [];
    },
    closest() { return null; },
    click() { this._clicou = true; }
  };
  Object.defineProperty(el, 'innerHTML', {
    get() { return this._html; },
    set(v) { this._html = v; if (this.id === 'cab') montaThs(this, v); }
  });
  Object.defineProperty(el, 'textContent', { get() { return this._txt; }, set(v) { this._txt = v; } });
  return el;
}
function montaThs(cab, v) {
  cab._ths = Array.from(v.matchAll(/data-c="([^"]+)"/g)).map((m) => ({
    dataset: { c: m[1] }, set onclick(f) { this._f = f; }, get onclick() { return this._f; }
  }));
}

const reg = {};
const doc = {
  getElementById(id) { return (reg[id] = reg[id] || noFalso(id)); },
  createElement(tag) { const e = noFalso('novo:' + tag); e.tag = tag; return e; },
  querySelectorAll(sel) {
    if (sel === '#cab th') return reg.cab && reg.cab._ths ? reg.cab._ths : [];
    return [];
  }
};
/* o <script type="application/json"> com o dado */
const dadosTxt = /<script id="dados" type="application\/json">([\s\S]*?)<\/script>/.exec(html);
ok(!!dadosTxt, 'bloco de dados não encontrado no HTML');
if (!dadosTxt) { console.error(falhas.join('\n')); process.exit(1); }
reg.dados = noFalso('dados');
reg.dados.textContent = dadosTxt[1];

let baixou = null;
global.document = doc;
global.Blob = function (partes, o) { this.partes = partes; this.type = o && o.type; };
global.URL = { createObjectURL: (b) => { baixou = b; return 'blob:x'; }, revokeObjectURL() {} };

/* ── 3. executa o script de verdade ───────────────────────────────────── */
const script = /<script>\n\(function \(\) \{([\s\S]*?)\}\)\(\);\n<\/script>/.exec(html);
ok(!!script, 'script principal não encontrado');
if (!script) { console.error(falhas.join('\n')); process.exit(1); }
try {
  new Function('document', 'Blob', 'URL', '(function(){' + script[1] + '})()')(doc, global.Blob, global.URL);
} catch (e) {
  console.error('✗ o script quebra ao rodar: ' + e.message + '\n' + (e.stack || '').split('\n')[1]);
  process.exit(1);
}

/* ── 4. o que tem de ter saído ────────────────────────────────────────── */
const corpo = reg.corpo ? reg.corpo.innerHTML : '';
const nLinhas = (corpo.match(/<tr>/g) || []).length;
ok(nLinhas === 100, 'a primeira página deveria ter 100 linhas, tem ' + nLinhas);

const cab = reg.cab ? reg.cab.innerHTML : '';
ok(cab.indexOf('desagio') >= 0, 'coluna deságio ausente do cabeçalho');
ok(cab.indexOf('grupo') >= 0, 'coluna grupo ausente do cabeçalho');

const cnt = reg.cnt ? reg.cnt.textContent : '';
ok(/4\.582 de 4\.582 vendas/.test(cnt), 'contador não bate: "' + cnt + '"');

const tiles = reg.tiles ? reg.tiles.innerHTML : '';
ok(/31,\d%/.test(tiles), 'deságio médio fora do esperado (~31%) nos cartões');
ok(tiles.indexOf('R$') >= 0, 'cartão de total vendido sem valor');

const pgt = reg.pgt ? reg.pgt.textContent : '';
ok(/^1–100 de 4\.582$/.test(pgt), 'paginação errada: "' + pgt + '"');

/* a tabela está ordenada por deságio decrescente por padrão */
const primeiros = Array.from(corpo.matchAll(/<b>(-?\d+,\d)%<\/b>/g)).map((m) => Number(m[1].replace(',', '.')));
ok(primeiros.length >= 2, 'não achei os valores de deságio nas células');
if (primeiros.length >= 2) {
  ok(primeiros[0] >= primeiros[1], 'a ordenação padrão não é deságio decrescente');
  ok(primeiros[0] <= 80, 'deságio de ' + primeiros[0] + '% no topo — o corte de outlier não pegou');
}

/* ── 5. o CSV ─────────────────────────────────────────────────────────── */
if (reg.csv && reg.csv.onclick) {
  reg.csv.onclick();
  ok(!!baixou, 'o botão de CSV não gerou arquivo');
  if (baixou) {
    const csv = baixou.partes[0];
    const l = csv.split('\r\n');
    ok(l.length === 4583, 'CSV deveria ter 1 cabeçalho + 4.582 linhas, tem ' + l.length);
    ok(l[0].indexOf(';') >= 0, 'CSV sem separador ponto-e-vírgula');
    ok(csv.charCodeAt(0) === 0xFEFF, 'CSV sem BOM — o Excel abriria com acento quebrado');
    ok(!/\d\.\d{2}(;|$)/.test(l[1]), 'CSV com ponto decimal — o Excel pt-BR não lê');
  }
}

console.log('\n  ' + path.basename(arq) + ' — ' + (html.length / 1048576).toFixed(1) + ' MB');
console.log('  ' + unicos.length + ' ids conferidos · ' + nLinhas + ' linhas na 1ª página · ' + cnt);
console.log('  cartões: ' + (tiles.match(/class="v"/g) || []).length + ' · CSV: ' +
  (baixou ? baixou.partes[0].split('\r\n').length - 1 + ' linhas' : 'não testado'));
console.log('\n' + (falhas.length ? '  FALHAS:\n   - ' + falhas.join('\n   - ') : '  todas as provas passaram') + '\n');
process.exit(falhas.length ? 1 : 0);
