/* CADA ITEM E CADA PEÇA, COM O ANALÍTICO JUNTO.
 *
 * Uso: node monta-sinais.js <sinais.json> [saida.html] [rótulo da base]
 *
 * Substitui a página por contagem. Aquela dizia "3 peças avariadas"; esta diz
 * QUAL peça, e clicar nela abre as vendas com o texto do anúncio.
 *
 * O JSON vem de `analisa-sinais.py`, que já traz `linhas` (índices) por sinal.
 * A página NÃO recalcula o casamento: se recalculasse, uma diferença de regex
 * entre Python e JavaScript faria a tabela e a lista discordarem sem avisar.
 */
const fs = require('fs');
const path = require('path');

const entrada = process.argv[2];
const saida = process.argv[3] || path.join(process.cwd(), 'sinais-contexto.html');
const ROTULO = process.argv[4] || '';
if (!entrada) throw new Error('uso: node monta-sinais.js <sinais.json> [saida.html] [rótulo]');

const D = JSON.parse(fs.readFileSync(entrada, 'utf8'));
const num = (x) => Number(x || 0).toLocaleString('pt-BR');
const pct = (x) => (x * 100).toFixed(1).replace('.', ',') + '%';
const pp = (x) => (x >= 0 ? '+' : '−') + Math.abs(x * 100).toFixed(1).replace('.', ',');
const esc = (s) => String(s === null || s === undefined ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const CORTE = D.base.corte_t;
let MAXEF = 0;
D.sinais.forEach((s) => { MAXEF = Math.max(MAXEF, Math.abs(s.efeito)); });

/* grupos ordenados pelo maior efeito absoluto que contêm */
const porGrupo = {};
D.sinais.forEach((s, i) => {
  (porGrupo[s.grupo] = porGrupo[s.grupo] || []).push(Object.assign({ i }, s));
});
const ordem = Object.keys(porGrupo).sort((a, b) =>
  Math.max.apply(null, porGrupo[b].map((s) => Math.abs(s.efeito))) -
  Math.max.apply(null, porGrupo[a].map((s) => Math.abs(s.efeito))));

const secoes = ordem.map((g) => {
  const ss = porGrupo[g].slice().sort((a, b) => Math.abs(b.efeito) - Math.abs(a.efeito));
  const linhas = ss.map((s) => {
    const forte = Math.abs(s.t) >= CORTE;
    const cor = s.efeito >= 0 ? 'pos' : 'neg';
    const w = (Math.abs(s.efeito) / MAXEF) * 46;
    const barra = s.efeito >= 0
      ? `<i class="b ${cor}" style="left:50%;width:${w}%"></i>`
      : `<i class="b ${cor}" style="right:50%;width:${w}%"></i>`;
    return `<tr class="sig${forte ? ' f' : ''}" data-i="${s.i}">
<td>${esc(s.rotulo)}${s.nota ? ' <span class="i" title="' + esc(s.nota) + '">?</span>' : ''}</td>
<td class="n">${num(s.n)}</td><td class="n mut">${pct(s.pct)}</td>
<td class="n">${pct(s.desagio_com)}</td><td class="n mut">${pct(s.desagio_sem)}</td>
<td class="bar"><span class="eixo"></span>${barra}<b class="${cor}">${pp(s.efeito)}</b></td>
<td class="n mut">${s.t.toFixed(1).replace('.', ',')}</td></tr>`;
  }).join('\n');
  return `<section class="card">
<h2>${esc(g)}</h2>
<table><thead><tr><th>sinal</th><th class="n">vendas</th><th class="n">% base</th>
<th class="n">c/ sinal</th><th class="n">s/ sinal</th><th>efeito no modelo</th>
<th class="n">t</th></tr></thead><tbody>${linhas}</tbody></table>
</section>`;
}).join('\n');

/* o payload: sinais sem as estatísticas já renderizadas, e as linhas */
const sinaisJs = D.sinais.map((s) => ({
  r: s.rotulo, g: s.grupo, n: s.n, e: s.efeito, t: s.t,
  rx: s.rx, bl: s.bloqueio, nota: s.nota, dst: s.destaque, L: s.linhas
}));

const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Itens e peças — efeito no deságio</title>
<style>
:root{--bg:#fff;--fg:#1a1d21;--mut:#6b7280;--lin:#e5e7eb;--az:#2a78d6;--lj:#d95926;
--card:#f9fafb;--hi:#fde68a;--av:#fff7ed;--avl:#fdba74}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#15181c;--fg:#e8eaed;
--mut:#9aa1ab;--lin:#2b3038;--az:#3987e5;--lj:#eb6834;--card:#1c2026;--hi:#78350f;
--av:#2a1f16;--avl:#7c4a21}}
*{box-sizing:border-box}
body{margin:0;padding:30px 16px 60px;background:var(--bg);color:var(--fg);
font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:1260px;margin:0 auto}
h1{font-size:26px;margin:0 0 4px;letter-spacing:-.02em}
.top{color:var(--mut);margin:0 0 4px}
.meta{color:var(--mut);font-size:13px;margin:0 0 14px}
.rule{height:1px;background:var(--lin);margin:16px 0}
.nav a{color:var(--az);text-decoration:none;margin-right:16px;font-size:14px}
.nav a:hover{text-decoration:underline}
.cols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;align-items:start}
@media(max-width:1000px){.cols{grid-template-columns:1fr}}
.card{background:var(--card);border:1px solid var(--lin);border-radius:11px;
padding:14px 16px;margin-bottom:16px}
.card h2{font-size:15px;margin:0 0 10px;letter-spacing:.02em;text-transform:uppercase;
color:var(--mut)}
table{border-collapse:collapse;width:100%;font-size:13px}
th,td{padding:5px 7px;text-align:left;border-bottom:1px solid var(--lin);white-space:nowrap}
th{color:var(--mut);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.03em}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
.mut{color:var(--mut)}
tr.sig{cursor:pointer}
tr.sig:hover td{background:rgba(42,120,214,.07)}
tr.sig.on td{background:rgba(42,120,214,.15)}
tr.f td{font-weight:600}
td.bar{position:relative;width:190px;min-width:150px}
td.bar .eixo{position:absolute;left:50%;top:3px;bottom:3px;width:1px;background:var(--lin)}
td.bar .b{position:absolute;top:50%;transform:translateY(-50%);height:10px;border-radius:2px}
td.bar .b.pos{background:var(--lj)}td.bar .b.neg{background:var(--az)}
td.bar b{position:absolute;right:3px;top:50%;transform:translateY(-50%);font-size:12px}
b.pos{color:var(--lj)}b.neg{color:var(--az)}
.i{display:inline-block;width:14px;height:14px;line-height:14px;text-align:center;
border-radius:50%;border:1px solid var(--lin);color:var(--mut);font-size:10px;cursor:help}
.sticky{position:sticky;top:16px}
.bar2{display:flex;gap:8px;align-items:center;margin-bottom:10px}
button{padding:6px 12px;border:1px solid var(--lin);border-radius:7px;background:var(--bg);
color:var(--fg);font:13px inherit;cursor:pointer}
button:hover{border-color:var(--az);color:var(--az)}
.scroll{max-height:420px;overflow:auto;border:1px solid var(--lin);border-radius:8px}
.scroll table th{position:sticky;top:0;background:var(--card)}
.txt{white-space:pre-wrap;font-size:12.5px;color:var(--fg);line-height:1.5;
border:1px solid var(--lin);border-radius:8px;padding:10px;max-height:340px;overflow:auto;
background:var(--bg);margin-top:8px}
mark{background:var(--hi);color:inherit;padding:0 1px;border-radius:2px}
.alerta{background:var(--av);border:1px solid var(--avl);border-radius:8px;
padding:9px 12px;font-size:13px;margin:0 0 10px}
.box{background:var(--card);border:1px solid var(--lin);border-radius:10px;
padding:14px 16px;font-size:13.5px;margin-top:8px}
.box p{margin:0 0 9px}.box p:last-child{margin:0}
code{background:var(--bg);border:1px solid var(--lin);border-radius:4px;padding:0 4px;
font-size:12px}
footer{color:var(--mut);font-size:12px;margin-top:26px;border-top:1px solid var(--lin);
padding-top:12px}
</style></head><body><div class="wrap">

<h1>Itens e peças — efeito no deságio</h1>
<p class="top">Cada item e cada peça medidos sozinhos, contra quem não os tem</p>
<p class="meta">${esc(ROTULO)}${ROTULO ? ' · ' : ''}${num(D.base.vendas)} vendas ·
deságio médio ${pct(D.base.desagio_medio)} · efeito sempre <b>dentro do mesmo modelo</b> ·
${D.base.testes} sinais · Bonferroni pede |t| ≥ ${String(CORTE).replace('.', ',')}
(linhas em negrito passam)</p>
<div class="rule"></div>
<p class="nav"><a href="termos-linhas.html">→ Termos da descrição</a>
<a href="colunas-desagio.html">→ Avaliação coluna a coluna</a>
<a href="analitico-veiculos.html">→ Analítico completo</a>
<a href="graficos-modelo.html">→ km, idade, UF e laudo</a></p>

<div class="cols">
  <div>${secoes}</div>
  <div class="sticky">
    <div class="card">
      <h2 id="tit">Clique num sinal</h2>
      <div id="alerta"></div>
      <p class="meta" id="sub" style="margin:0 0 10px">
        as vendas em que o sinal aparece, com o texto do anúncio</p>
      <div class="bar2"><button id="csv">baixar CSV</button>
        <span class="mut" id="pg" style="font-size:12.5px"></span></div>
      <div class="scroll"><table id="tabL"><thead><tr>
        <th class="n" data-k="id">id</th><th data-k="g">modelo</th><th data-k="v">versão</th>
        <th class="n" data-k="a">ano</th><th class="n" data-k="k">km</th>
        <th data-k="uf">uf</th><th class="n" data-k="f">FIPE</th>
        <th class="n" data-k="p">venda</th><th class="n" data-k="d">deságio</th>
      </tr></thead><tbody></tbody></table></div>
      <p class="meta" id="capTxt" style="margin:10px 0 0"></p>
      <div class="txt" id="txt">—</div>
    </div>
  </div>
</div>

<div class="box">
<p><b>Cada sinal é medido sozinho, contra quem não o tem</b>, e sempre depois de subtrair a
média do próprio modelo. As colunas "c/ sinal" e "s/ sinal" são o deságio cru dos dois
lados; o <b>efeito</b> é a diferença já controlada. Os dois separam quando o sinal aparece
mais num modelo que já é caro ou barato.</p>
<p><b>A negação tem prioridade.</b> <code>não funciona com chave</code> contém
<code>com chave</code>. Sem bloqueio, 300 vendas entrariam como "tem chave". Cada regra
positiva só vale se a negativa não casou.</p>
<p><b>Peça conta quando aparece perto de uma palavra de dano</b> — até 40 caracteres, sem
atravessar ponto, ponto-e-vírgula ou barra. Isso evita que "porta pronta. capô danificado"
conte a porta.</p>
<p><b>Sinal presente em quase toda a base separa pouco</b>, por construção.
<code>para-choque</code> está em 70,8% e <code>arranhões e avarias em geral</code> em
74,7%: são itens de formulário, não descrição daquele carro. O efeito deles é pequeno e
isso é esperado.</p>
<p><b>O texto mostrado é o original</b>, não o normalizado. O casamento foi feito sobre o
texto normalizado (minúsculo, sem acento, sem pontuação) e vem pronto do Python — a página
não recalcula. O destaque no original é aproximado: marca as palavras-chave do sinal, então
pode pintar uma ocorrência que não foi a que casou.</p>
</div>

<footer>
Gerado por <code>monta-sinais.js</code> a partir de <code>${esc(path.basename(entrada))}</code>,
saída de <code>analisa-sinais.py</code>.<br>
⚠️ Contém nome real de loja e dado comercial de cliente. Repo privado — pensar antes de repassar.
</footer>
</div>
<script>
var S = ${JSON.stringify(sinaisJs)};
var L = ${JSON.stringify(D.linhas)};
var PAG = 100;
var sel = -1, arr = [], ord = { k: 'd', dir: -1 };

function nb(x){ return x===null||x===undefined||x===''?'—':Number(x).toLocaleString('pt-BR'); }
function pc(x){ return x===null?'—':(x*100).toFixed(1).replace('.',',')+'%'; }
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
function semAcento(s){ return s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,''); }

function escolhe(i) {
  sel = i;
  var s = S[i];
  arr = s.L.map(function (j) { return L[j]; });
  document.getElementById('tit').textContent = s.r;
  document.getElementById('sub').innerHTML = s.g + ' · ' + nb(s.n) + ' vendas · efeito ' +
    (s.e >= 0 ? '+' : '−') + Math.abs(s.e * 100).toFixed(1).replace('.', ',') +
    ' p.p. · t = ' + s.t.toFixed(1).replace('.', ',') +
    '<br><span class="mut">regra: <code>' + esc(s.rx) + '</code>' +
    (s.bl ? ' &nbsp;bloqueada por <code>' + esc(s.bl) + '</code>' : '') + '</span>';
  document.getElementById('alerta').innerHTML =
    s.nota ? '<p class="alerta">' + esc(s.nota) + '</p>' : '';
  var trs = document.querySelectorAll('tr.sig');
  for (var k = 0; k < trs.length; k++) {
    if (Number(trs[k].getAttribute('data-i')) === i) trs[k].className += ' on';
    else trs[k].className = trs[k].className.replace(' on', '');
  }
  pinta();
}

function pinta() {
  var a = arr.slice();
  a.sort(function (x, y) {
    var k = ord.k, vx = x[k], vy = y[k];
    if (vx === null || vx === undefined || vx === '') return 1;
    if (vy === null || vy === undefined || vy === '') return -1;
    if (typeof vx === 'string') return ord.dir * vx.localeCompare(vy);
    return ord.dir * (vx - vy);
  });
  var fim = Math.min(PAG, a.length), h = '';
  for (var i = 0; i < fim; i++) {
    var r = a[i];
    h += '<tr data-j="' + i + '"><td class="n">' + r.id + '</td><td>' + esc(r.g) + '</td>' +
      '<td>' + esc(r.v || '—') + '</td><td class="n">' + (r.a || '—') + '</td>' +
      '<td class="n">' + nb(r.k) + '</td><td>' + esc(r.uf || '—') + '</td>' +
      '<td class="n">' + nb(r.f) + '</td><td class="n">' + nb(r.p) + '</td>' +
      '<td class="n ' + (r.d >= 0 ? 'pos' : 'neg') + '"><b>' + pc(r.d) + '</b></td></tr>';
  }
  document.querySelector('#tabL tbody').innerHTML = h ||
    '<tr><td colspan="9" class="mut">nenhuma venda</td></tr>';
  document.getElementById('pg').textContent = a.length
    ? '1–' + fim + ' de ' + nb(a.length) + ' · clique numa linha para ler o anúncio' : '';
  window._a = a;
  if (a.length) mostraTexto(0);
}

function mostraTexto(j) {
  var r = window._a[j];
  if (!r) return;
  document.getElementById('capTxt').textContent =
    'anúncio do veículo ' + r.id + ' — ' + r.g + (r.v ? ' ' + r.v : '');
  var t = esc(r.txt || '(sem descrição)');
  var dst = sel >= 0 ? S[sel].dst : [];
  /* destaque aproximado: casa sem acento e sem diferenciar maiúscula, sobre o
     texto original. Pode pintar uma ocorrência que não foi a que casou — o
     casamento oficial é o do Python, e está na coluna de contagem. */
  var plano = semAcento(t).toLowerCase();
  var marcas = [];
  dst.forEach(function (d) {
    var alvo = semAcento(d).toLowerCase(), p = 0;
    while (alvo && (p = plano.indexOf(alvo, p)) >= 0) {
      marcas.push([p, p + alvo.length]); p += alvo.length;
    }
  });
  marcas.sort(function (a, b) { return a[0] - b[0]; });
  var out = '', pos = 0;
  marcas.forEach(function (m) {
    if (m[0] < pos) return;
    out += t.slice(pos, m[0]) + '<mark>' + t.slice(m[0], m[1]) + '</mark>';
    pos = m[1];
  });
  out += t.slice(pos);
  document.getElementById('txt').innerHTML = out;
}

document.querySelectorAll('tr.sig').forEach(function (tr) {
  tr.onclick = function () { escolhe(Number(tr.getAttribute('data-i'))); };
});
document.querySelector('#tabL tbody').onclick = function (e) {
  var tr = e.target.closest ? e.target.closest('tr') : null;
  if (tr && tr.getAttribute('data-j') !== null) mostraTexto(Number(tr.getAttribute('data-j')));
};
document.querySelectorAll('#tabL th').forEach(function (th) {
  th.onclick = function () {
    var k = th.getAttribute('data-k');
    ord = { k: k, dir: ord.k === k ? -ord.dir : (k === 'g' || k === 'uf' || k === 'v' ? 1 : -1) };
    pinta();
  };
});
document.getElementById('csv').onclick = function () {
  if (!arr.length) return;
  var cab = ['veiculo_id','modelo','versao','ano_modelo','km','patio_uf','loja',
             'valor_fipe_anuncio','venda','desagio','sinal','descricao'];
  var out = [cab.join(';')];
  arr.forEach(function (r) {
    out.push([r.id, r.g, r.v, r.a, r.k === null ? '' : r.k, r.uf, r.l, r.f, r.p,
      (r.d * 100).toFixed(2).replace('.', ','), S[sel].r,
      String(r.txt || '').replace(/[\\r\\n]+/g, ' ')]
      .map(function (c) {
        c = String(c);
        return (c.indexOf(';') >= 0 || c.indexOf('"') >= 0)
          ? '"' + c.replace(/"/g, '""') + '"' : c;
      }).join(';'));
  });
  var blob = new Blob(['\\uFEFF' + out.join('\\r\\n')], { type: 'text/csv;charset=utf-8;' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sinal-' + S[sel].r.replace(/[^\\w]+/g, '_') + '.csv';
  a.click();
};

escolhe(0);
</script></body></html>`;

fs.writeFileSync(saida, html, 'utf8');
console.log('  ' + path.basename(saida) + '  ' +
  (fs.statSync(saida).size / 1048576).toFixed(1) + ' MB · ' +
  D.sinais.length + ' sinais em ' + ordem.length + ' grupos');
