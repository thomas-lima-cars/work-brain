/* SMOKE TEST da página de itens e peças.
 * Uso: node _smoke_sinais.js <sinais-contexto.html> [sinais.json]
 *
 * A página tem clique em DOIS níveis — sinal à esquerda, venda à direita — e
 * nenhum dos dois é validado por `node --check`. Aqui um DOM de mentira executa
 * o script de verdade e confere: a lista abre, a contagem bate com a análise,
 * o texto do anúncio aparece com destaque, e o CSV sai no formato do Excel
 * pt-BR.
 */
const fs = require('fs');
const path = require('path');

const arq = process.argv[2] || path.join(process.cwd(), 'sinais-contexto.html');
const html = fs.readFileSync(arq, 'utf8');
const falhas = [];
const ok = (c, m) => { if (!c) falhas.push(m); };

Array.from(new Set(Array.from(html.matchAll(/getElementById\('([^']+)'\)/g)).map((m) => m[1])))
  .forEach((id) => ok(new RegExp('id="' + id + '"').test(html),
    'script procura #' + id + ', que não existe no HTML'));

let baixou = null;
const reg = {};
function noFalso(id) {
  const el = {
    id, _html: '', _txt: '', className: '', _attrs: {},
    getAttribute(k) { return this._attrs[k] === undefined ? null : this._attrs[k]; },
    setAttribute(k, v) { this._attrs[k] = v; },
    closest() { return this._attrs['data-j'] !== undefined ? this : null; },
    querySelectorAll() { return []; }
  };
  Object.defineProperty(el, 'innerHTML', { get() { return this._html; }, set(v) { this._html = v; } });
  Object.defineProperty(el, 'textContent', { get() { return this._txt; }, set(v) { this._txt = v; } });
  return el;
}
const pega = (s) => (reg[s] = reg[s] || noFalso(s));

/* as <tr class="sig"> vêm do HTML estático: o script só pendura onclick nelas */
const sigs = Array.from(html.matchAll(/<tr class="sig[^"]*" data-i="(\d+)">/g)).map((m) => {
  const e = noFalso('sig' + m[1]);
  e._attrs['data-i'] = m[1];
  e.className = 'sig';
  return e;
});

const doc = {
  getElementById: (id) => pega(id),
  querySelector: (s) => pega(s),
  querySelectorAll: (s) => {
    if (s === 'tr.sig') return sigs;
    if (s === '#tabL th') {
      const m = html.match(/id="tabL"[\s\S]*?<\/tr>/);
      return (m ? Array.from(m[0].matchAll(/data-k="([^"]+)"/g)) : [])
        .map((x) => { const e = noFalso('th'); e._attrs['data-k'] = x[1]; return e; });
    }
    return [];
  },
  createElement: () => ({ set href(v) { this._h = v; }, download: '',
    click() { if (baixou) baixou.clicou = true; } })
};

const src = (html.match(/<script>([\s\S]*?)<\/script>/) || [])[1];
ok(!!src, 'não achei o <script> embarcado');
if (src) {
  try {
    new Function('document', 'Blob', 'URL', 'window', src)(
      doc,
      function (partes, o) { this.partes = partes; this.type = o && o.type; },
      { createObjectURL: (b) => { baixou = { partes: b.partes }; return 'blob:x'; } },
      {});
  } catch (e) { ok(false, 'o script quebrou ao executar: ' + e.message); }
}

ok(sigs.length > 0, 'nenhuma linha de sinal no HTML');
ok(typeof sigs[0].onclick === 'function', 'as linhas de sinal ficaram sem onclick');

/* escolhe(0) roda na carga: a tabela de vendas já tem de estar preenchida */
const corpo = reg['#tabL tbody'] ? reg['#tabL tbody'].innerHTML : '';
ok((corpo.match(/<tr /g) || []).length > 0, 'a lista de vendas saiu vazia na carga');
ok(/data-j="/.test(corpo), 'as vendas ficaram sem data-j — o clique não teria o que ler');

const pg = reg.pg ? reg.pg.textContent : '';
const m = /de ([\d.]+)/.exec(pg);
ok(!!m, 'contador de vendas ilegível: "' + pg + '"');

const jsonS = process.argv[3];
if (jsonS && m) {
  const J = JSON.parse(fs.readFileSync(jsonS, 'utf8'));
  /* escolhe(0) usa o PRIMEIRO sinal do array, não o primeiro da tela */
  const esperado = J.sinais[0].n;
  const visto = Number(m[1].replace(/\./g, ''));
  ok(visto === esperado, 'a página mostra ' + visto + ' vendas para "' + J.sinais[0].rotulo +
    '", a análise diz ' + esperado);
}

ok((reg.txt ? reg.txt.innerHTML : '').length > 10, 'o painel de texto saiu vazio');
ok(/<mark>/.test(reg.txt ? reg.txt.innerHTML : ''), 'o texto saiu sem destaque');
ok((reg.capTxt ? reg.capTxt.textContent : '').indexOf('anúncio do veículo') >= 0,
  'a legenda do texto não identifica o veículo');

/* trocar de sinal tem de trocar a lista */
if (sigs.length > 1 && sigs[1].onclick) {
  const antes = reg['#tabL tbody'].innerHTML;
  sigs[1].onclick();
  ok(reg['#tabL tbody'].innerHTML !== antes, 'clicar em outro sinal não mudou a lista');
  ok(reg.tit.textContent.length > 0, 'o título não acompanhou a troca de sinal');
}

if (reg.csv && reg.csv.onclick) {
  baixou = null;
  reg.csv.onclick();
  ok(!!baixou, 'o botão de CSV não gerou arquivo');
  if (baixou) {
    const csv = baixou.partes[0];
    const l = csv.split('\r\n');
    ok(csv.charCodeAt(0) === 0xFEFF, 'CSV sem BOM — o Excel abriria com acento quebrado');
    ok(l[0].indexOf(';') >= 0, 'CSV sem separador ponto-e-vírgula');
    ok(l[0].indexOf('descricao') >= 0, 'CSV sem a descrição — era o ponto de exportar');
    ok(l.length > 1, 'CSV sem linha de dado');
    ok(!/;\d+\.\d{2};/.test(l[1] || ''), 'CSV com ponto decimal — o Excel pt-BR não lê');
  }
}

console.log('\n  ' + path.basename(arq) + ' — ' +
  (fs.statSync(arq).size / 1048576).toFixed(1) + ' MB');
console.log('  ' + sigs.length + ' sinais · ' + (m ? m[1] : '?') + ' vendas no sinal de abertura');
if (falhas.length) {
  console.log('\n  FALHAS:');
  falhas.forEach((f) => console.log('   - ' + f));
  process.exit(1);
}
console.log('\n  todas as provas passaram\n');
