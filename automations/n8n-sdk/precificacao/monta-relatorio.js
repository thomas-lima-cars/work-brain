/* Monta o relatorio HTML do estudo de precificacao a partir de dados-51076.json.
 *
 * Uso: node monta-relatorio.js [dados-51076.json] [saida.html]
 *
 * Forma escolhida: TABELA COM BARRAS INLINE, nao um grafico. Sao 30 colunas x 4
 * medidas — isso e trabalho de tabela. A barra existe pra dar a comparacao de
 * relance; o numero ao lado e que e lido.
 *
 * Uma cor so para todas as barras. Ramp por valor (mais escuro = maior) seria
 * codificar duas vezes a mesma coisa e queimar o unico canal livre.
 *
 * Sem CDN: tudo inline. O relatorio circula por e-mail e SharePoint, onde script
 * externo nao carrega.
 */
const fs = require('fs');
const path = require('path');
const HERE = __dirname;

const entrada = process.argv[2] || path.join(HERE, 'dados-51076.json');
const saida = process.argv[3] || path.join(HERE, 'relatorio-precificacao.html');
const D = JSON.parse(fs.readFileSync(entrada, 'utf8'));

/* ── formatacao pt-BR ─────────────────────────────────────────────────── */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pct = (x, d) => (x * 100).toFixed(d === undefined ? 1 : d).replace('.', ',') + '%';
const pp = (x, d) => (x * 100).toFixed(d === undefined ? 1 : d).replace('.', ',') + ' p.p.';
const num = (x) => Number(x).toLocaleString('pt-BR');

/* ── a barra: 4px arredondado na ponta, ancorada na linha de base ────── */
function barra(v, max, classe) {
  const w = max > 0 ? Math.max(0, Math.min(1, v / max)) * 100 : 0;
  return '<span class="bar"><i class="' + (classe || '') + '" style="width:' +
    w.toFixed(2) + '%"></i></span>';
}

const R = D.regressoes;
const maxCtl = Math.max.apply(null, R.map((r) => Math.max(0, r.r2ctlAj || 0)));
const maxCru = Math.max.apply(null, R.map((r) => r.r2 || 0));

/* ── leitura em linguagem de negocio, por coluna ──────────────────────── */
function interferencia(r) {
  if (r.tipo === 'cat' && r.niveis_topo && r.niveis_topo.length >= 2) {
    const t = r.niveis_topo;
    const amp = t[0].desagio - t[t.length - 1].desagio;
    return 'Entre os níveis com amostra, o deságio vai de <b>' + pct(t[0].desagio) +
      '</b> (' + esc(t[0].nivel) + ') a <b>' + pct(t[t.length - 1].desagio) + '</b> (' +
      esc(t[t.length - 1].nivel) + ') — amplitude de <b>' + pp(amp) + '</b>';
  }
  if (r.b !== undefined && r.b !== null) {
    const u = D.unidades[r.coluna];
    if (!u) return 'Coeficiente ' + r.b.toExponential(2) + ' de deságio por unidade.';
    const efeito = r.b * u.fator;
    const dir = efeito >= 0 ? 'sobe' : 'cai';
    return 'A cada <b>' + u.rotulo + '</b> a mais, o deságio ' + dir + ' <b>' +
      pp(Math.abs(efeito), 2) + '</b>. ' +
      (Math.abs(r.t) >= 2
        ? 'Distinguível de zero (t&nbsp;=&nbsp;' + String(r.t).replace('.', ',') + ').'
        : '<b>Não</b> distinguível de zero (t&nbsp;=&nbsp;' + String(r.t).replace('.', ',') + ').');
  }
  return '—';
}

/* ── veredito: o que a coluna e, depois do controle ───────────────────── */
function veredito(r) {
  const v = r.r2ctlAj;
  if (v === null || v === undefined) return ['ind', 'indefinido'];
  if (v >= 0.05) return ['forte', 'driver'];
  if (v >= 0.01) return ['medio', 'efeito pequeno'];
  if (v > 0) return ['fraco', 'marginal'];
  return ['nulo', 'nada'];
}

/* ── o ranking ────────────────────────────────────────────────────────── */
const linhasRank = R.map((r) => {
  const [cls, rot] = veredito(r);
  return '<tr class="v-' + cls + '">' +
    '<td class="col"><b>' + esc(r.coluna) + '</b>' +
    (r.alerta ? ' <span class="flag" title="' + esc(r.alerta) + '">!</span>' : '') +
    '</td>' +
    '<td class="t">' + r.tipo + '</td>' +
    '<td class="n">' + num(r.n) + '</td>' +
    '<td class="n">' + (r.niveis === null ? '—' : num(r.niveis)) + '</td>' +
    '<td class="n dim">' + pct(r.r2) + '</td>' +
    '<td class="n dim">' + (r.r2aj === null ? '—' : pct(r.r2aj)) + '</td>' +
    '<td class="n">' + (r.r2ctlAj === null ? '—'
      : '<b>' + pct(r.r2ctlAj) + '</b>') + '</td>' +
    '<td class="barcell">' + barra(Math.max(0, r.r2ctlAj || 0), maxCtl, 'f-' + cls) + '</td>' +
    '<td class="vd"><span class="pill p-' + cls + '">' + rot + '</span></td>' +
    '</tr>';
}).join('\n');

/* ── os cartoes de detalhe, um por coluna ─────────────────────────────── */
const cartoes = R.map((r) => {
  const [cls, rot] = veredito(r);
  let corpo = '';
  if (r.tipo === 'cat' && r.niveis_topo && r.niveis_topo.length) {
    const mx = Math.max.apply(null, r.niveis_topo.map((x) => x.desagio));
    corpo = '<table class="niv"><thead><tr><th>nível</th><th class="n">n</th>' +
      '<th class="n">deságio</th><th></th></tr></thead><tbody>' +
      r.niveis_topo.map((x) =>
        '<tr><td>' + esc(x.nivel) + '</td><td class="n">' + num(x.n) + '</td>' +
        '<td class="n"><b>' + pct(x.desagio) + '</b></td>' +
        '<td class="barcell">' + barra(x.desagio, mx, 'f-' + cls) + '</td></tr>').join('') +
      '</tbody></table>' +
      '<p class="nota">Só níveis com n&nbsp;&ge;&nbsp;20. ' +
      (r.niveis > r.niveis_topo.length
        ? 'A coluna tem ' + num(r.niveis) + ' níveis no total.' : '') + '</p>';
  } else {
    corpo = '<p class="coef">' + interferencia(r) + '</p>';
  }
  return '<section class="card" id="c-' + esc(r.coluna) + '">' +
    '<header><h3>' + esc(r.coluna) + '</h3>' +
    '<span class="pill p-' + cls + '">' + rot + '</span></header>' +
    (D.glossario[r.coluna] ? '<p class="gloss">' + esc(D.glossario[r.coluna]) + '</p>' : '') +
    '<dl class="mini">' +
    '<div><dt>R² controlado aj.</dt><dd><b>' +
      (r.r2ctlAj === null ? '—' : pct(r.r2ctlAj)) + '</b></dd></div>' +
    '<div><dt>R² cru</dt><dd>' + pct(r.r2) + '</dd></div>' +
    '<div><dt>linhas</dt><dd>' + num(r.n) + '</dd></div>' +
    '<div><dt>níveis</dt><dd>' + (r.niveis === null ? '—' : num(r.niveis)) + '</dd></div>' +
    '</dl>' +
    (r.tipo === 'cat' ? '<p class="leitura">' + interferencia(r) + '</p>' : '') +
    corpo +
    (r.alerta ? '<p class="alerta">⚠️ ' + esc(r.alerta) + '</p>' : '') +
    '</section>';
}).join('\n');

/* ── desagio por codigo FIPE ──────────────────────────────────────────── */
const pc = D.desagio.por_codigo.slice().sort((a, b) => b.desagio - a.desagio);
const maxPc = Math.max.apply(null, pc.map((x) => x.desagio));
const linhasCod = pc.map((x) =>
  '<tr><td class="mono">' + esc(x.codigo) + '</td><td>' + esc(x.rotulo) + '</td>' +
  '<td class="n">' + num(x.n) + '</td><td class="n"><b>' + pct(x.desagio) + '</b></td>' +
  '<td class="barcell">' + barra(x.desagio, maxPc, 'f-forte') + '</td></tr>').join('');

/* ── a pagina ─────────────────────────────────────────────────────────── */
const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Estudo de precificação — o que move o deságio</title>
<style>
:root{
  color-scheme:light dark;
  --surface:#fcfcfb; --card:#ffffff; --line:#e6e5e0;
  --ink:#0b0b0b; --ink2:#52514e; --ink3:#87857e;
  --blue:#2a78d6; --blue-d:#184f95; --blue-l:#9ec5f4;
  --gray:#c3c2b7; --amber:#eda100;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --surface:#161615; --card:#1f1f1e; --line:#33332f;
  --ink:#ffffff; --ink2:#c3c2b7; --ink3:#8d8b82;
  --blue:#3987e5; --blue-d:#86b6ef; --blue-l:#1c5cab;
  --gray:#52514e; --amber:#c98500;
}}
:root[data-theme="dark"]{
  --surface:#161615; --card:#1f1f1e; --line:#33332f;
  --ink:#ffffff; --ink2:#c3c2b7; --ink3:#8d8b82;
  --blue:#3987e5; --blue-d:#86b6ef; --blue-l:#1c5cab;
  --gray:#52514e; --amber:#c98500;
}
*{box-sizing:border-box}
body{margin:0;background:var(--surface);color:var(--ink);
  font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased}
.wrap{max-width:1080px;margin:0 auto;padding-block:32px 64px;padding-left:20px;padding-right:20px}
h1{font-size:26px;line-height:1.2;margin:0 0 6px;letter-spacing:-.01em}
h2{font-size:19px;margin:44px 0 6px;letter-spacing:-.01em}
h3{font-size:15px;margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.sub{color:var(--ink2);margin:0 0 4px}
.meta{color:var(--ink3);font-size:13px;margin:0}
.rule{height:3px;background:var(--amber);border-radius:2px;margin:14px 0 0}
.lead{color:var(--ink2);margin:8px 0 0;max-width:72ch}

.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:24px 0 0}
.tile{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
.tile .v{font-size:26px;font-weight:650;letter-spacing:-.02em;line-height:1.1}
.tile .k{color:var(--ink3);font-size:12px;text-transform:uppercase;letter-spacing:.04em;margin-top:4px}
.tile .x{color:var(--ink2);font-size:12px;margin-top:2px}

.box{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--blue);
  border-radius:8px;padding:14px 16px;margin:16px 0}
.box p{margin:0 0 8px} .box p:last-child{margin:0}
.box.warn{border-left-color:var(--amber)}

table{width:100%;border-collapse:collapse;font-size:13.5px}
.scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:10px}
th{text-align:left;font-weight:600;color:var(--ink3);font-size:11.5px;
  text-transform:uppercase;letter-spacing:.04em;padding:0 10px 7px 0;
  border-bottom:1px solid var(--line);white-space:nowrap}
td{padding:7px 10px 7px 0;border-bottom:1px solid var(--line);vertical-align:middle}
tbody tr:hover td{background:color-mix(in srgb,var(--blue) 7%,transparent)}
.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.dim{color:var(--ink3)}
.t{color:var(--ink3);font-size:12px}
.col{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px}
.barcell{width:150px;padding-right:0}

.bar{display:block;height:9px;background:color-mix(in srgb,var(--ink) 7%,transparent);
  border-radius:0 4px 4px 0;overflow:hidden}
.bar i{display:block;height:100%;border-radius:0 4px 4px 0;background:var(--blue)}
.f-forte{background:var(--blue)} .f-medio{background:var(--blue)}
.f-fraco{background:var(--blue-l)} .f-nulo{background:var(--gray)}

.pill{display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;
  border:1px solid var(--line);color:var(--ink2);white-space:nowrap}
.p-forte{border-color:var(--blue);color:var(--blue)}
.p-medio{color:var(--ink2)}
.p-fraco{color:var(--ink3)}
.p-nulo{color:var(--ink3);text-decoration:line-through;text-decoration-thickness:1px}
.flag{display:inline-block;width:15px;height:15px;line-height:15px;text-align:center;
  border-radius:99px;background:var(--amber);color:#0b0b0b;font-size:10px;font-weight:700;
  cursor:help;vertical-align:1px}

.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;margin-top:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px}
.card header{display:flex;align-items:center;justify-content:space-between;gap:10px;
  flex-wrap:wrap;margin-bottom:8px}
.gloss{color:var(--ink2);font-size:13px;margin:0 0 10px}
.mini{display:flex;flex-wrap:wrap;gap:14px;margin:0 0 10px;padding:10px 0;
  border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.mini div{min-width:70px}
.mini dt{color:var(--ink3);font-size:11px;text-transform:uppercase;letter-spacing:.03em}
.mini dd{margin:1px 0 0;font-variant-numeric:tabular-nums;font-size:14px}
.leitura{margin:0 0 10px;font-size:13.5px;color:var(--ink2)}
.coef{margin:0;font-size:13.5px;color:var(--ink2)}
.niv{font-size:12.5px} .niv .barcell{width:90px}
.niv td,.niv th{padding:5px 8px 5px 0}
.nota{color:var(--ink3);font-size:11.5px;margin:8px 0 0}
.alerta{margin:10px 0 0;font-size:12.5px;color:var(--ink2);
  background:color-mix(in srgb,var(--amber) 14%,transparent);
  border-radius:6px;padding:8px 10px}
footer{margin-top:52px;padding-top:18px;border-top:1px solid var(--line);
  color:var(--ink3);font-size:12.5px}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.92em;
  background:color-mix(in srgb,var(--ink) 7%,transparent);padding:1px 5px;border-radius:4px}
@media (max-width:640px){
  .barcell{display:none}
  h1{font-size:22px}
  .tile .v{font-size:22px}
}
</style></head>
<body><div class="wrap">

<h1>Estudo de precificação — o que move o deságio</h1>
<p class="sub">Regressão simples de cada coluna do veículo contra o deságio da venda</p>
<p class="meta">Execução ${D.execucao} · ${D.amostra.periodo_real[0].slice(0, 10).split('-').reverse().join('/')}
a ${D.amostra.periodo_real[1].slice(0, 10).split('-').reverse().join('/')} ·
amostra <code>${esc(D.amostra.nome)}</code></p>
<div class="rule"></div>

<div class="tiles">
  <div class="tile"><div class="v">${num(D.coleta.colhidas)}</div><div class="k">vendas</div>
    <div class="x">gabarito ${num(D.coleta.esperadas)} · 0 duplicadas</div></div>
  <div class="tile"><div class="v">${pct(D.desagio.media)}</div><div class="k">deságio médio</div>
    <div class="x">desvio ${pp(D.desagio.desvio)}</div></div>
  <div class="tile"><div class="v">${D.amostra.codigos}</div><div class="k">códigos FIPE</div>
    <div class="x">os mais vendidos em 12 meses</div></div>
  <div class="tile"><div class="v">${R.length}</div><div class="k">colunas testadas</div>
    <div class="x">+ 2 descartadas por degeneração</div></div>
</div>

<div class="box">
<p><b>Deságio</b> = 1 − (valor da venda ÷ valor FIPE do anúncio). Deságio de 32% quer
dizer que o carro saiu por 68% da tabela.</p>
<p><b>Venda</b> = veículo cuja última linha válida de <code>advertisement_negotiations</code>
está em status 2, 3 ou 7. <b>Valor</b> = <code>offers.price</code> da oferta vencedora, via
<code>offer_actual_id</code>. Fora da amostra: razões abaixo de 0,20 e acima de 1,20
(0,6% das linhas, onde havia venda registrada a 107× a FIPE).</p>
</div>

<h2>Como ler o R²</h2>
<div class="box">
<p><b>R² cru</b> — quanto da variação do deságio aquela coluna explica sozinha.</p>
<p><b>R² controlado ajustado</b> — a mesma regressão sobre o resíduo, já descontada a
média do próprio código FIPE, e penalizada pelo número de parâmetros.
<b>É esta coluna que vale.</b> Valor negativo significa que a coluna explica menos
que o acaso.</p>
<p>O controle existe porque o deságio varia muito mais <i>entre</i> modelos do que
dentro de um. Sem ele, toda coluna correlacionada com o modelo — marca, carroceria,
combustível — parece um driver sem ser.</p>
</div>

<h2>Ranking — as ${R.length} colunas</h2>
<div class="scroll"><table>
<thead><tr><th>coluna</th><th>tipo</th><th class="n">linhas</th><th class="n">níveis</th>
<th class="n">R² cru</th><th class="n">R² aj</th><th class="n">R² ctl aj</th>
<th></th><th>veredito</th></tr></thead>
<tbody>
${linhasRank}
</tbody></table></div>
<p class="nota">Descartadas por degeneração (1 linha por nível, R² = 1 trivial):
${D.degeneradas.map((d) => '<code>' + esc(d.coluna) + '</code>').join(', ')}.</p>

<div class="box warn">
<p><b>O colapso é a prova de que o controle é necessário.</b> <code>modelo</code> cai de
21,2% para −0,7%. <code>versao</code>, de 23,1% para −0,7%. <code>marca</code>, de 9,8%
para −0,4%. Essas colunas são quase constantes dentro de um código FIPE — o R² cru
delas era o R² do próprio código, emprestado.</p>
<p><b>Consequência:</b> esta amostra, com 10 códigos, <b>não consegue testar atributo de
modelo</b>. Para isso é preciso ampliar o recorte em <code>amostra.config.json</code>
para os 229 códigos com n ≥ 10.</p>
</div>

<h2>Coluna a coluna</h2>
<p class="lead">O que cada coluna faz com o deságio, em ordem de interferência.</p>
<div class="cards">
${cartoes}
</div>

<h2>Deságio por código FIPE</h2>
<p class="lead">O patamar de cada um dos 10 códigos da amostra — é a variação que o
controle remove antes de medir todo o resto.</p>
<div class="scroll"><table>
<thead><tr><th>código</th><th>veículo</th><th class="n">vendas</th>
<th class="n">deságio</th><th></th></tr></thead>
<tbody>${linhasCod}</tbody></table></div>

<h2>Ressalvas</h2>
<div class="box warn">
<p><b>O primeiro colocado é frágil na magnitude.</b> São 445 compradores em 1.300 vendas,
~3 compras por loja. O R² ajustado já penaliza isso e 46% continua grande — mas trate
como ordem de grandeza, não como número fechado. Para firmar, repetir só com
compradores de n ≥ 10.</p>
<p><b>Regressão simples não é causa.</b> Cada coluna foi testada sozinha. Duas colunas
correlacionadas entre si aparecem as duas — <code>patio</code> e
<code>patio_cidade</code> medem quase a mesma coisa.</p>
<p><b>O VMV não explica nada</b> (R² controlado −0,05%) e trouxe valores implausíveis na
execução 51072 — VMV de R$ 292 mil para um Gol. A hipótese de que ele seria o driver
mais forte estava errada.</p>
</div>

<footer>
Gerado por <code>monta-relatorio.js</code> a partir de <code>${esc(path.basename(entrada))}</code> ·
execução ${D.execucao} do workflow <code>a6fNNTUYYayehNIn</code> ·
coleta ${num(D.coleta.colhidas)}/${num(D.coleta.esperadas)} conferida contra gabarito,
${D.coleta.duplicadas} duplicadas, ${D.coleta.truncadas} truncadas.<br>
⚠️ Contém nome real de loja e dado comercial. Repo privado — pensar antes de repassar.
</footer>

</div></body></html>`;

fs.writeFileSync(saida, html, 'utf8');
console.log('\n  ' + path.basename(saida) + ' — ' + (html.length / 1024).toFixed(0) + ' KB');
console.log('  ' + R.length + ' colunas · ' + num(D.coleta.colhidas) + ' vendas · deságio médio ' + pct(D.desagio.media));
console.log('  ranking + ' + R.length + ' cartoes de detalhe + ' + pc.length + ' codigos\n');
