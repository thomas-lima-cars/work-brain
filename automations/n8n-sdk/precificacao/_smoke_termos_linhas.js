/* SMOKE TEST da página de termos + linhas.
 * Uso: node _smoke_termos_linhas.js <termos-linhas.html> [termos.json]
 *
 * `node --check` valida a SINTAXE do script embarcado. Não valida que ele acha
 * os elementos, nem que clicar num termo traz as linhas certas. Aqui um DOM de
 * mentira executa o script de verdade e confere o resultado — mesmo padrão do
 * `_smoke_analitico.js`.
 *
 * O que pega, e que só apareceria abrindo a página: id trocado entre HTML e
 * script, clique que não filtra, contagem da página divergindo da análise,
 * CSV com ponto decimal (que o Excel pt-BR não lê) ou sem BOM.
 */
const fs = require('fs');
const path = require('path');

const arq = process.argv[2] || path.join(process.cwd(), 'termos-linhas.html');
const html = fs.readFileSync(arq, 'utf8');
const falhas = [];
const ok = (c, m) => { if (!c) falhas.push(m); };

/* ── 1. os ids que o script procura existem no HTML ───────────────────── */
Array.from(new Set(Array.from(html.matchAll(/getElementById\('([^']+)'\)/g)).map((m) => m[1])))
  .forEach((id) => ok(new RegExp('id="' + id + '"').test(html),
    'script procura #' + id + ', que não existe no HTML'));

/* ── 2. DOM de mentira ────────────────────────────────────────────────── */
let baixou = null;
const reg = {};
function noFalso(id) {
  const el = {
    id, _html: '', _txt: '', value: '', dataset: {}, children: [],
    appendChild(x) { this.children.push(x); },
    closest() { return null; },
    click() { this._clicou = true; },
    querySelectorAll() { return []; },
    querySelector() { return null; }
  };
  Object.defineProperty(el, 'innerHTML', {
    get() { return this._html; }, set(v) { this._html = v; }
  });
  Object.defineProperty(el, 'textContent', {
    get() { return this._txt; }, set(v) { this._txt = v; }
  });
  return el;
}
function pega(sel) {
  if (!reg[sel]) reg[sel] = noFalso(sel);
  return reg[sel];
}

const doc = {
  getElementById: (id) => pega(id),
  querySelector: (s) => pega(s),
  querySelectorAll: (s) => {
    /* os th são criados a partir do HTML estático, não do script */
    const bloco = s.indexOf('tabT') >= 0 ? 'tabT' : 'tabL';
    const m = html.match(new RegExp('id="' + bloco + '"[\\s\\S]*?</thead>'));
    const ths = m ? Array.from(m[0].matchAll(/data-k="([^"]+)"/g)) : [];
    return ths.map((x) => ({ dataset: { k: x[1] }, set onclick(f) { this._f = f; },
      get onclick() { return this._f; } }));
  },
  /* o <a> NÃO sobrescreve `baixou`: quem registra o conteúdo é o
     createObjectURL, e o clique do link só confirma que o download disparou.
     Trocar isso faz o teste perder o CSV e acusar erro onde não há. */
  createElement: () => ({ set href(v) { this._h = v; }, download: '',
    click() { this._clicou = true; if (baixou) baixou.clicou = true; } })
};

const src = (html.match(/<script>([\s\S]*?)<\/script>/) || [])[1];
ok(!!src, 'não achei o <script> embarcado');

if (src) {
  const ctx = {
    document: doc,
    Blob: function (partes, o) { this.partes = partes; this.type = o && o.type; },
    URL: { createObjectURL: (b) => { baixou = { partes: b.partes, type: b.type }; return 'blob:x'; } },
    console
  };
  try {
    new Function('document', 'Blob', 'URL', 'console', src)(
      ctx.document, ctx.Blob, ctx.URL, ctx.console);
  } catch (e) {
    ok(false, 'o script quebrou ao executar: ' + e.message);
  }
}

/* ── 3. a tabela de termos saiu com linha ─────────────────────────────── */
const tT = reg['#tabT tbody'] ? reg['#tabT tbody'].innerHTML : '';
const linhasT = (tT.match(/<tr /g) || []).length;
ok(linhasT > 0, 'a tabela de termos saiu vazia');
ok(/data-t="/.test(tT), 'as linhas de termo não têm data-t — o clique não teria o que ler');

/* ── 4. clicar num termo traz as linhas, e a contagem bate ────────────── */
const jsonT = process.argv[3];
const primeiro = (tT.match(/data-t="([^"]+)"/) || [])[1];
ok(!!primeiro, 'não consegui ler um termo para clicar');
if (primeiro && reg['#tabT tbody'].onclick) {
  reg['#tabT tbody'].onclick({ target: { closest: () => ({ dataset: { t: primeiro } }) } });
  const pg = reg.pgL ? reg.pgL.textContent : '';
  const m = /de ([\d.]+)$/.exec(pg.trim());
  ok(!!m, 'paginação das linhas ilegível: "' + pg + '"');
  const nPag = m ? Number(m[1].replace(/\./g, '')) : 0;
  ok(nPag > 0, 'clicar no termo não trouxe nenhuma linha');

  if (jsonT) {
    const T = JSON.parse(fs.readFileSync(jsonT, 'utf8'));
    const meta = T.termos.filter((x) => x.termo === primeiro)[0];
    ok(!!meta, 'termo "' + primeiro + '" não está no JSON de termos');
    if (meta) {
      ok(nPag === meta.vendas, 'a página mostra ' + nPag + ' linhas para "' + primeiro +
        '", a análise diz ' + meta.vendas);
    }
  }
  const tL = reg['#tabL tbody'].innerHTML;
  ok((tL.match(/<tr>/g) || []).length > 0, 'a tabela de linhas saiu vazia');
  ok(/<mark>/.test(reg.ctx ? reg.ctx.innerHTML : ''),
    'o texto de contexto saiu sem o termo destacado');
}

/* ── 5. o CSV ─────────────────────────────────────────────────────────── */
if (reg.csv && reg.csv.onclick) {
  baixou = null;
  reg.csv.onclick();
  ok(!!baixou, 'o botão de CSV não gerou arquivo');
  if (baixou) {
    const csv = baixou.partes[0];
    const l = csv.split('\r\n');
    ok(l.length > 1, 'CSV sem linha de dado');
    ok(csv.charCodeAt(0) === 0xFEFF, 'CSV sem BOM — o Excel abriria com acento quebrado');
    ok(l[0].indexOf(';') >= 0, 'CSV sem separador ponto-e-vírgula');
    ok(!/\d\.\d{2}(;|$)/.test(l[1] || ''), 'CSV com ponto decimal — o Excel pt-BR não lê');
    ok(l[0].indexOf('termo') >= 0, 'CSV sem a coluna do termo — a linha perde o contexto');
  }
}

/* ── 6. busca livre ───────────────────────────────────────────────────── */
if (reg.livre && reg.livre.oninput) {
  reg.livre.value = 'motor';
  reg.livre.oninput.call(reg.livre);
  ok(/de [\d.]+$/.test((reg.pgL.textContent || '').trim()),
    'a busca livre não repaginou as linhas');
}

console.log('\n  ' + path.basename(arq) + ' — ' +
  (fs.statSync(arq).size / 1048576).toFixed(1) + ' MB');
console.log('  ' + linhasT + ' termos na tabela · termo testado: ' + primeiro);
if (falhas.length) {
  console.log('\n  FALHAS:');
  falhas.forEach((f) => console.log('   - ' + f));
  process.exit(1);
}
console.log('\n  todas as provas passaram\n');
