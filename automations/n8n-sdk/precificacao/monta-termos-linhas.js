/* TERMOS DA DESCRIÇÃO + AS LINHAS ONDE CADA UM APARECE.
 *
 * Uso: node monta-termos-linhas.js <termos.json> <analitico.json> [saida.html]
 *
 * A página de termos original mostra o efeito de cada expressão mas não deixa
 * ver QUEM está por trás do número. Aqui cada termo abre o analítico filtrado:
 * as vendas em que aquela expressão aparece, com o deságio de cada uma.
 *
 * ── A TOKENIZAÇÃO TEM DE SER A MESMA DE `analisa-texto.js` ────────────────
 * Lá os n-gramas são montados sobre a sequência de tokens JÁ FILTRADA: token
 * que parece identificador (`^\d+$` com mais de 2 dígitos) é REMOVIDO DA
 * SEQUÊNCIA. Por isso "motor 12345 funciona" produz o bigrama
 * `motor funciona` — e uma busca por substring no texto cru NÃO acharia.
 *
 * A página embute, por linha, a sequência de tokens já filtrada e casa o termo
 * como substring dela com fronteira de espaço. Isso é equivalente a "tokens
 * consecutivos" e reproduz o índice da análise. O gerador confere: para cada
 * termo, a contagem de linhas tem de bater com `vendas` do JSON de termos. Se
 * não bater em nenhum, ele para.
 *
 * ── POR QUE O TEXTO ORIGINAL NÃO É EMBUTIDO ──────────────────────────────
 * As descrições somam 9,3 MB na Dealers. Embutir original + normalizado
 * passaria de 20 MB. Fica só o normalizado (minúsculo, sem acento e sem
 * pontuação), que é exatamente o que foi medido — quem confere o termo está
 * vendo o texto sobre o qual a conta foi feita, não uma aproximação.
 *
 * ⚠️ REQUER `descricao` NO ANALÍTICO. A sonda 10 da Cars2You não extrai essa
 * coluna, então hoje isto só roda sobre a base da Dealers. Para valer lá,
 * incluir `v.description` em `sonda-10-template.js`.
 */
const fs = require('fs');
const path = require('path');

const argTermos = process.argv[2];
const argAnalitico = process.argv[3];
const saida = process.argv[4] || path.join(process.cwd(), 'termos-linhas.html');
if (!argTermos || !argAnalitico) {
  throw new Error('uso: node monta-termos-linhas.js <termos.json> <analitico.json> [saida.html]');
}

const T = JSON.parse(fs.readFileSync(argTermos, 'utf8'));
const A = JSON.parse(fs.readFileSync(argAnalitico, 'utf8'));

/* aceita os dois formatos de analítico que o estudo produz */
const linhasA = A.vendas
  ? A.vendas
  : (A.linhas || []).map((ln) => {
      const o = {};
      A.colunas.forEach((c, i) => { o[c] = ln[i]; });
      return o;
    });
if (!linhasA.length) throw new Error('analítico vazio');
if (!('descricao' in linhasA[0])) {
  throw new Error('o analítico não tem a coluna `descricao` — ' +
    'incluir v.description na sonda que o gera');
}

/* ── normalização: cópia fiel de analisa-texto.js ─────────────────────── */
const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const normaliza = (t) => semAcento(String(t || '').toLowerCase())
  .replace(/<[^>]*>/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();
const ehLixo = (p) => /^\d+$/.test(p) && p.length > 2;
const tokens = (t) => normaliza(t).split(' ').filter((p) => p && !ehLixo(p)).join(' ');

const num = (x) => Number(x || 0).toLocaleString('pt-BR');
const pct = (x, d) => (x * 100).toFixed(d === undefined ? 1 : d).replace('.', ',') + '%';
const pp = (x) => (x >= 0 ? '+' : '−') + Math.abs(x * 100).toFixed(1).replace('.', ',');
const esc = (s) => String(s === null || s === undefined ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ── as linhas, enxutas ───────────────────────────────────────────────── */
const n = (x) => Number(x || 0);
const linhas = linhasA.map((r) => {
  const fipe = n(r.valor_fipe_anuncio);
  const venda = n(r.venda);
  return {
    id: r.veiculo_id,
    g: r.grupo,
    v: r.versao || '',
    a: r.ano_modelo || '',
    k: r.km === null || r.km === '' ? null : n(r.km),
    uf: r.patio_uf || '',
    l: r.loja || '',
    f: fipe,
    p: venda,
    d: fipe > 0 ? 1 - venda / fipe : null,
    t: tokens(r.descricao)
  };
});

const MEDIA = T.base.desagio_medio;

/* média do próprio modelo: o efeito do estudo é sempre contra ela */
const porModelo = {};
linhas.forEach((r) => {
  if (r.d === null) return;
  if (!porModelo[r.g]) porModelo[r.g] = { s: 0, n: 0 };
  porModelo[r.g].s += r.d; porModelo[r.g].n++;
});

/* ── prova: a contagem por termo tem de bater com a da análise ────────── */
const casa = (tok, termo) => (' ' + tok + ' ').indexOf(' ' + termo + ' ') >= 0;
let conferidos = 0, divergentes = [];
T.termos.forEach((x) => {
  const c = linhas.reduce((s, r) => s + (casa(r.t, x.termo) ? 1 : 0), 0);
  conferidos++;
  if (c !== x.vendas) divergentes.push(x.termo + ': pagina=' + c + ' analise=' + x.vendas);
});
if (divergentes.length) {
  throw new Error('a contagem de linhas nao reproduz a analise em ' +
    divergentes.length + ' de ' + conferidos + ' termos. Primeiros: ' +
    divergentes.slice(0, 3).join(' | '));
}
console.log('  ' + conferidos + ' termos conferidos: a contagem de linhas bate com a analise');

/* ── HTML ─────────────────────────────────────────────────────────────── */
const ROTULO = T.rotulo || ('Execução ' + T.execucao);
const termosJs = T.termos.map((x) => ({
  t: x.termo, w: x.palavras, n: x.vendas, m: x.modelos,
  dc: x.desagio_com, ds: x.desagio_sem, e: x.efeito, tt: x.t
}));

const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Termos da descrição — linha a linha</title>
<style>
:root{--bg:#fff;--fg:#1a1d21;--mut:#6b7280;--lin:#e5e7eb;--az:#2a78d6;--lj:#d95926;
--card:#f9fafb;--hi:#fde68a}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#15181c;--fg:#e8eaed;
--mut:#9aa1ab;--lin:#2b3038;--az:#3987e5;--lj:#eb6834;--card:#1c2026;--hi:#78350f}}
*{box-sizing:border-box}
body{margin:0;padding:28px 16px 60px;background:var(--bg);color:var(--fg);
font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:1180px;margin:0 auto}
h1{font-size:25px;margin:0 0 4px;letter-spacing:-.02em}
.sub{color:var(--mut);margin:0 0 2px}
.meta{color:var(--mut);font-size:13px;margin:0 0 16px}
.rule{height:1px;background:var(--lin);margin:16px 0}
.nav a{color:var(--az);text-decoration:none;margin-right:16px;font-size:14px}
.nav a:hover{text-decoration:underline}
.grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);gap:20px}
@media(max-width:900px){.grid{grid-template-columns:1fr}}
.card{background:var(--card);border:1px solid var(--lin);border-radius:10px;padding:14px}
.card h2{font-size:15px;margin:0 0 10px;letter-spacing:.02em;text-transform:uppercase;
color:var(--mut)}
input[type=search],input[type=text]{width:100%;padding:8px 10px;border:1px solid var(--lin);
border-radius:7px;background:var(--bg);color:var(--fg);font:14px inherit;margin-bottom:10px}
table{border-collapse:collapse;width:100%;font-size:13px}
th,td{padding:5px 7px;text-align:left;border-bottom:1px solid var(--lin);white-space:nowrap}
th{color:var(--mut);font-weight:600;font-size:11.5px;text-transform:uppercase;
letter-spacing:.03em;cursor:pointer;position:sticky;top:0;background:var(--card)}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
.scroll{max-height:560px;overflow:auto;border:1px solid var(--lin);border-radius:8px}
tr.sel td{background:rgba(42,120,214,.13)}
tr.termo{cursor:pointer}
tr.termo:hover td{background:rgba(42,120,214,.07)}
.pos{color:var(--lj);font-weight:600}
.neg{color:var(--az);font-weight:600}
.pill{display:inline-block;padding:1px 7px;border-radius:999px;background:var(--bg);
border:1px solid var(--lin);font-size:11.5px;color:var(--mut)}
.txt{white-space:normal;font-size:12px;color:var(--mut);line-height:1.45;
max-width:100%;word-break:break-word}
mark{background:var(--hi);color:inherit;padding:0 1px;border-radius:2px}
.bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}
button{padding:6px 12px;border:1px solid var(--lin);border-radius:7px;background:var(--bg);
color:var(--fg);font:13px inherit;cursor:pointer}
button:hover{border-color:var(--az);color:var(--az)}
.tiles{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}
.tile{flex:1 1 150px;background:var(--card);border:1px solid var(--lin);border-radius:9px;
padding:10px 12px}
.tile .v{font-size:20px;font-weight:650;letter-spacing:-.02em}
.tile .k{font-size:12px;color:var(--mut)}
.box{background:var(--card);border:1px solid var(--lin);border-radius:9px;padding:12px 14px;
font-size:13.5px;margin-top:18px}
.box p{margin:0 0 8px}.box p:last-child{margin:0}
footer{color:var(--mut);font-size:12px;margin-top:26px;border-top:1px solid var(--lin);
padding-top:12px}
</style></head><body><div class="wrap">

<h1>Termos da descrição — linha a linha</h1>
<p class="sub">Cada expressão abre as vendas em que ela aparece</p>
<p class="meta">${ROTULO} · ${num(T.base.vendas)} vendas · ${num(T.base.textos_distintos)}
textos distintos · deságio médio ${pct(MEDIA)} · ${num(T.termos.length)} termos passaram nos
cortes (n ≥ ${T.cortes.n_min}, ≥ ${T.cortes.modelos_min} modelos)</p>
<div class="rule"></div>
<p class="nav"><a href="colunas-desagio.html">→ Avaliação coluna a coluna</a>
<a href="analitico-veiculos.html">→ Analítico completo</a>
<a href="graficos-modelo.html">→ Gráficos: km, idade, UF e laudo</a></p>

<div class="tiles">
  <div class="tile"><div class="v" id="t-termo">—</div><div class="k">termo selecionado</div></div>
  <div class="tile"><div class="v" id="t-n">—</div><div class="k">vendas com o termo</div></div>
  <div class="tile"><div class="v" id="t-ef">—</div><div class="k">p.p. de efeito</div></div>
  <div class="tile"><div class="v" id="t-med">—</div><div class="k">deságio das linhas</div></div>
</div>

<div class="grid">
  <div class="card">
    <h2>Termos</h2>
    <input type="search" id="fTermo" placeholder="filtrar termo…">
    <p class="meta" id="cntT" style="margin:0 0 8px"></p>
    <div class="scroll"><table id="tabT">
      <thead><tr><th data-k="t">termo</th><th class="n" data-k="n">vendas</th>
      <th class="n" data-k="m">mod</th><th class="n" data-k="e">efeito</th>
      <th class="n" data-k="tt">t</th></tr></thead><tbody></tbody></table></div>
  </div>

  <div class="card">
    <h2>Linhas onde o termo aparece</h2>
    <div class="bar">
      <input type="text" id="livre" placeholder="ou teste qualquer expressão…" style="flex:1;margin:0">
      <button id="csv">baixar CSV</button>
    </div>
    <div class="scroll"><table id="tabL">
      <thead><tr><th class="n" data-k="id">id</th><th data-k="g">modelo</th>
      <th data-k="v">versão</th><th class="n" data-k="a">ano</th><th class="n" data-k="k">km</th>
      <th data-k="uf">uf</th><th class="n" data-k="f">FIPE</th><th class="n" data-k="p">venda</th>
      <th class="n" data-k="d">deságio</th></tr></thead><tbody></tbody></table></div>
    <p class="meta" id="pgL" style="margin:8px 0 0"></p>
    <div id="ctx"></div>
  </div>
</div>

<div class="box">
<p><b>O casamento aqui é o mesmo da análise.</b> Os tokens são minúsculos, sem acento e sem
pontuação, e todo token que é só número com mais de 2 dígitos <b>sai da sequência</b> — por
isso <code>motor 12345 funciona</code> casa com <code>motor funciona</code>. O gerador
confere termo a termo: se a contagem da página divergir da análise em qualquer um, ele para
e não emite o arquivo.</p>
<p><b>O texto mostrado é o normalizado</b>, não o original. É sobre ele que a conta foi
feita — quem confere está vendo o que foi medido, e não uma aproximação. O original tem
9,3 MB e dobraria a página.</p>
<p><b>O efeito é medido dentro do mesmo modelo.</b> A coluna "deságio das linhas" é a média
crua das vendas com o termo; o "efeito" é o desvio em relação à média do próprio modelo. Os
dois diferem quando o termo aparece mais num modelo que já é caro ou barato — e é por isso
que o efeito é o número que vale.</p>
<p>⚠️ <b>Termo que aparece em quase toda a base não diz nada.</b> Um termo com n perto do
total está sendo comparado com o punhado de vendas sem descrição, que são diferentes por
outros motivos. Olhe a coluna <code>vendas</code> antes de ler o efeito.</p>
</div>

<footer>
Gerado por <code>monta-termos-linhas.js</code> a partir de
<code>${esc(path.basename(argTermos))}</code> e <code>${esc(path.basename(argAnalitico))}</code>.<br>
⚠️ Contém nome real de loja e dado comercial de cliente. Repo privado — pensar antes de repassar.
</footer>
</div>
<script>
var TERMOS = ${JSON.stringify(termosJs)};
var L = ${JSON.stringify(linhas)};
var MM = ${JSON.stringify(Object.keys(porModelo).reduce((o, k) => {
  o[k] = porModelo[k].s / porModelo[k].n; return o;
}, {}))};
var PAG = 100;
var sel = null, linhasSel = [], pag = 0, ordT = { k: 'e', dir: -1 }, ordL = { k: 'd', dir: -1 };

function nb(x, d) { return x === null || x === undefined ? '—' :
  Number(x).toLocaleString('pt-BR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
function pc(x, d) { return x === null ? '—' :
  (x * 100).toFixed(d === undefined ? 1 : d).replace('.', ',') + '%'; }
function sig(x) { return (x >= 0 ? '+' : '−') + Math.abs(x * 100).toFixed(1).replace('.', ','); }
function casa(tok, termo) { return (' ' + tok + ' ').indexOf(' ' + termo + ' ') >= 0; }

function pintaTermos() {
  var f = document.getElementById('fTermo').value.trim().toLowerCase();
  var arr = TERMOS.filter(function (x) { return !f || x.t.indexOf(f) >= 0; });
  arr.sort(function (a, b) {
    var k = ordT.k, va = a[k], vb = b[k];
    if (typeof va === 'string') return ordT.dir * va.localeCompare(vb);
    return ordT.dir * (va - vb);
  });
  /* sem teto de renderização: com teto, um termo fora dos N primeiros some da
     tela sem aviso e a pessoa conclui que ele não passou nos cortes. 770 linhas
     o navegador desenha sem esforço. */
  var h = '';
  for (var i = 0; i < arr.length; i++) {
    var x = arr[i];
    h += '<tr class="termo' + (sel === x.t ? ' sel' : '') + '" data-t="' + x.t + '">' +
      '<td>' + x.t + '</td><td class="n">' + nb(x.n) + '</td><td class="n">' + x.m + '</td>' +
      '<td class="n ' + (x.e >= 0 ? 'pos' : 'neg') + '">' + sig(x.e) + '</td>' +
      '<td class="n">' + x.tt.toFixed(1).replace('.', ',') + '</td></tr>';
  }
  document.querySelector('#tabT tbody').innerHTML = h;
  document.getElementById('cntT').textContent =
    arr.length === TERMOS.length
      ? nb(TERMOS.length) + ' termos'
      : nb(arr.length) + ' de ' + nb(TERMOS.length) + ' termos';
}

function seleciona(termo, deLivre) {
  sel = termo; pag = 0;
  linhasSel = L.filter(function (r) { return casa(r.t, termo); });
  var meta = null;
  for (var i = 0; i < TERMOS.length; i++) if (TERMOS[i].t === termo) meta = TERMOS[i];
  document.getElementById('t-termo').textContent = termo || '—';
  document.getElementById('t-n').textContent = nb(linhasSel.length);
  var soma = 0, c = 0, res = 0;
  linhasSel.forEach(function (r) {
    if (r.d === null) return; soma += r.d; c++;
    if (MM[r.g] !== undefined) res += r.d - MM[r.g];
  });
  document.getElementById('t-med').textContent = c ? pc(soma / c) : '—';
  /* se o termo está na lista, mostra o efeito da análise; se veio da busca
     livre, calcula o resíduo aqui — senão o cartão ficaria vazio justamente
     na hora em que a pessoa está testando uma hipótese nova. */
  document.getElementById('t-ef').textContent =
    meta ? sig(meta.e) : (c ? sig(res / c) : '—');
  pintaTermos(); pintaLinhas();
}

function pintaLinhas() {
  var arr = linhasSel.slice();
  arr.sort(function (a, b) {
    var k = ordL.k, va = a[k], vb = b[k];
    if (va === null) return 1; if (vb === null) return -1;
    if (typeof va === 'string') return ordL.dir * va.localeCompare(vb);
    return ordL.dir * (va - vb);
  });
  var ini = pag * PAG, fim = Math.min(ini + PAG, arr.length), h = '';
  for (var i = ini; i < fim; i++) {
    var r = arr[i];
    h += '<tr><td class="n">' + r.id + '</td><td>' + r.g + '</td>' +
      '<td>' + (r.v || '—') + '</td><td class="n">' + (r.a || '—') + '</td>' +
      '<td class="n">' + nb(r.k) + '</td><td>' + (r.uf || '—') + '</td>' +
      '<td class="n">' + nb(r.f) + '</td><td class="n">' + nb(r.p) + '</td>' +
      '<td class="n ' + (r.d >= 0 ? 'pos' : 'neg') + '"><b>' + pc(r.d) + '</b></td></tr>';
  }
  document.querySelector('#tabL tbody').innerHTML = h ||
    '<tr><td colspan="9" style="color:var(--mut)">selecione um termo à esquerda</td></tr>';
  document.getElementById('pgL').textContent = arr.length
    ? (ini + 1) + '–' + fim + ' de ' + nb(arr.length) : '';
  /* o texto da primeira linha da página, com o termo destacado: é o que
     permite conferir que o casamento não foi acidental */
  var ctx = document.getElementById('ctx');
  if (arr.length && sel) {
    var t = arr[ini].t;
    var re = new RegExp('(^|\\\\s)(' + sel.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&') + ')(\\\\s|$)', 'g');
    ctx.innerHTML = '<p class="meta" style="margin:10px 0 4px">texto normalizado do veículo ' +
      arr[ini].id + '</p><div class="txt">' +
      t.replace(re, '$1<mark>$2</mark>$3') + '</div>';
  } else { ctx.innerHTML = ''; }
}

document.getElementById('fTermo').oninput = pintaTermos;
document.querySelector('#tabT tbody').onclick = function (e) {
  var tr = e.target.closest ? e.target.closest('tr') : null;
  if (tr && tr.dataset.t) { document.getElementById('livre').value = ''; seleciona(tr.dataset.t); }
};
document.getElementById('livre').oninput = function () {
  var v = this.value.trim().toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\\s+/g, ' ').trim();
  if (v) seleciona(v, true);
};
document.querySelectorAll('#tabT th').forEach(function (th) {
  th.onclick = function () {
    var k = th.dataset.k;
    ordT = { k: k, dir: ordT.k === k ? -ordT.dir : (k === 't' ? 1 : -1) };
    pintaTermos();
  };
});
document.querySelectorAll('#tabL th').forEach(function (th) {
  th.onclick = function () {
    var k = th.dataset.k;
    ordL = { k: k, dir: ordL.k === k ? -ordL.dir : (k === 'g' || k === 'uf' || k === 'v' ? 1 : -1) };
    pag = 0; pintaLinhas();
  };
});
document.getElementById('csv').onclick = function () {
  if (!linhasSel.length) return;
  var cab = ['veiculo_id', 'modelo', 'versao', 'ano_modelo', 'km', 'patio_uf', 'loja',
             'valor_fipe_anuncio', 'venda', 'desagio', 'termo'];
  var out = [cab.join(';')];
  linhasSel.forEach(function (r) {
    out.push([r.id, r.g, r.v, r.a, r.k === null ? '' : r.k, r.uf, r.l, r.f, r.p,
      r.d === null ? '' : (r.d * 100).toFixed(2).replace('.', ','), sel]
      .map(function (c) { return String(c).indexOf(';') >= 0 ? '"' + c + '"' : c; }).join(';'));
  });
  var blob = new Blob(['\\uFEFF' + out.join('\\r\\n')], { type: 'text/csv;charset=utf-8;' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'termo-' + (sel || 'sel').replace(/ /g, '_') + '.csv';
  a.click();
};

pintaTermos(); pintaLinhas();
</script></body></html>`;

fs.writeFileSync(saida, html, 'utf8');
console.log('  ' + path.basename(saida) + '  ' +
  (fs.statSync(saida).size / 1048576).toFixed(1) + ' MB');
