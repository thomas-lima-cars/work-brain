/* PÁGINA 1 — avaliação coluna a coluna, controlada por MODELO.
 * Uso: node monta-colunas.js [drivers-51358.json] [saida.html]
 *
 * Lê a saída do nó `Analisar` direto, sem intermediário: o mesmo objeto que o
 * n8n produziu é o que vira página. Um arquivo a menos onde um número pode ser
 * digitado errado.
 *
 * Forma: tabela com barra inline, não gráfico. 37 colunas x 4 medidas é
 * trabalho de tabela. Uma cor só nas barras — ramp por valor codificaria duas
 * vezes a mesma coisa.
 */
const fs = require('fs');
const path = require('path');
const HERE = __dirname;

const entrada = process.argv[2] || path.join(HERE, 'drivers-51358.json');
const saida = process.argv[3] || path.join(HERE, 'colunas-desagio.html');
const D = JSON.parse(fs.readFileSync(entrada, 'utf8'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pct = (x, d) => (x === null || x === undefined || !isFinite(x)) ? '—'
  : (x * 100).toFixed(d === undefined ? 1 : d).replace('.', ',') + '%';
const pp = (x, d) => (x >= 0 ? '+' : '−') +
  Math.abs(x * 100).toFixed(d === undefined ? 1 : d).replace('.', ',') + ' p.p.';
const num = (x) => Number(x).toLocaleString('pt-BR');

/* ── unidades, para a leitura das numéricas sair em linguagem de negócio ── */
const UNI = {
  km: [100000, '100 mil km'],
  valor_fipe_anuncio: [10000, 'R$ 10 mil de FIPE'],
  valor_fipe_veiculo: [10000, 'R$ 10 mil'],
  valor_ref_vendedor: [10000, 'R$ 10 mil'],
  valor_molicar_anuncio: [10000, 'R$ 10 mil'],
  valor_molicar_veiculo: [10000, 'R$ 10 mil'],
  valor_varejo: [10000, 'R$ 10 mil'],
  vmv: [10000, 'R$ 10 mil'],
  ano_fabricacao: [1, 'ano de fabricação'],
  ano_modelo: [1, 'ano de modelo'],
  portas: [1, 'porta'],
  fipe_qtd_versoes: [1, 'versão'],
  data_venda: [365, 'ano'],
  veiculo_criado_em: [365, 'ano'],
  veiculo_atualizado_em: [365, 'ano']
};

const GLOSS = {
  grupo: 'A chave de controle: marca + modelo. R² controlado é zero por construção — o controle É ele.',
  comprador_loja_id: 'A loja que deu o lance vencedor.',
  km: 'Quilometragem do veículo.',
  cluster: 'Agrupamento lógico de veículos definido pela plataforma (tabela clusters).',
  versao: 'A versão exata dentro do modelo. Agora testável: antes, com código FIPE como controle, ela era quase o próprio controle.',
  codigo_fipe: 'O código FIPE — versão + ano. Era o controle na medição anterior; aqui é variável.',
  codigo_molicar: 'Deveria ser o código Molicar; na prática repete o code_fipe na maioria das linhas.',
  patio: 'O estoque físico onde o carro está (shop_stocks) — não o endereço da loja.',
  loja: 'A loja vendedora, dona do anúncio.',
  loja_id: 'Mesma coisa que `loja`, pelo id. Duplicada de propósito: se os dois R² divergissem, haveria nome de loja repetido em ids diferentes.',
  patio_cidade: 'Cidade do pátio.',
  patio_uf: 'UF do pátio.',
  whitelabel_id: 'Canal de venda da loja vendedora.',
  valor_ref_vendedor: 'Valor Referência do Vendedor (price_reference_advertiser) — o campo que sai rotulado como FIPE no relatório do Head.',
  vmv: 'Valor Mínimo de Venda (min_sale_price), o piso da negociação.',
  valor_fipe_anuncio: 'O denominador do deságio. A relação crua é em parte mecânica.',
  situacao_codigo: 'vehicles.situation — domínio ainda não decodificado.',
  status_negociacao: '2 Aguardando Pagamento, 3 Aguardando Confirmação, 7 Vendido.',
  categoria: 'Automóvel ou Utilitário — motos e pesados foram excluídos da amostra.',
  marca: 'Quase constante dentro do grupo: 20 modelos de 12 marcas.',
  modelo: 'É metade da chave de controle. Controlado ~0 por construção.'
};

const ALERTA = Object.assign({
  valor_fipe_anuncio: 'é o denominador do deságio — a relação crua é em parte mecânica',
  vmv: 'medido na execução 51328: 7,6% dos VMV estão acima de 3× a FIPE (até 83×). Usar só com filtro de sanidade',
  codigo_molicar: 'repete o valor de code_fipe na maioria das linhas — não é código Molicar',
  grupo: 'é a chave de controle; R² controlado zero é construção, não achado',
  modelo: 'é metade da chave de controle',
  marca: 'quase constante dentro do grupo'
}, D.alertas || {});

const R = D.regressoes;
const uteis = R.filter((r) => !r.degenerada);
const deg = R.filter((r) => r.degenerada);
const maxCtl = Math.max.apply(null, uteis.map((r) => Math.max(0, r.r2ctlAj || 0)).concat([0.01]));

function veredito(r) {
  const v = r.r2ctlAj;
  if (v === null || v === undefined) return ['ind', 'indefinido'];
  if (v >= 0.05) return ['forte', 'driver'];
  if (v >= 0.01) return ['medio', 'efeito pequeno'];
  if (v > 0) return ['fraco', 'marginal'];
  return ['nulo', 'nada'];
}

function barra(v, max, cls) {
  const w = max > 0 ? Math.max(0, Math.min(1, v / max)) * 100 : 0;
  return '<span class="bar"><i class="' + cls + '" style="width:' + w.toFixed(2) + '%"></i></span>';
}

function leitura(r) {
  if (r.tipo === 'cat' && r.niveis_topo && r.niveis_topo.length >= 2) {
    const t = r.niveis_topo;
    const a = t[0], b = t[t.length - 1];
    return 'Entre os níveis com amostra, o deságio vai de <b>' + pct(a.desagio) + '</b> (' +
      esc(a.nivel) + ') a <b>' + pct(b.desagio) + '</b> (' + esc(b.nivel) +
      ') — amplitude de <b>' + pp(a.desagio - b.desagio).replace('+', '') + '</b>';
  }
  if (r.b !== null && r.b !== undefined) {
    const u = UNI[r.coluna];
    if (!u) return 'Coeficiente ' + r.b.toExponential(2) + ' de deságio por unidade.';
    const ef = r.b * u[0];
    return 'A cada <b>' + u[1] + '</b> a mais, o deságio ' + (ef >= 0 ? 'sobe' : 'cai') +
      ' <b>' + pp(Math.abs(ef), 2).replace('+', '') + '</b>. ' +
      (Math.abs(r.t) >= 2
        ? 'Distinguível de zero (t&nbsp;=&nbsp;' + String(r.t).replace('.', ',') + ').'
        : '<b>Não</b> distinguível de zero (t&nbsp;=&nbsp;' + String(r.t).replace('.', ',') + ').');
  }
  return '—';
}

const linhasRank = uteis.map((r) => {
  const [cls, rot] = veredito(r);
  return '<tr>' +
    '<td class="col"><a href="#c-' + esc(r.coluna) + '"><b>' + esc(r.coluna) + '</b></a>' +
    (ALERTA[r.coluna] ? ' <span class="flag" title="' + esc(ALERTA[r.coluna]) + '">!</span>' : '') + '</td>' +
    '<td class="t">' + r.tipo + '</td>' +
    '<td class="n">' + num(r.n) + '</td>' +
    '<td class="n">' + (r.niveis === null ? '—' : num(r.niveis)) + '</td>' +
    '<td class="n dim">' + pct(r.r2) + '</td>' +
    '<td class="n dim">' + pct(r.r2aj) + '</td>' +
    '<td class="n"><b>' + pct(r.r2ctlAj) + '</b></td>' +
    '<td class="barcell">' + barra(Math.max(0, r.r2ctlAj || 0), maxCtl, 'f-' + cls) + '</td>' +
    '<td class="vd"><span class="pill p-' + cls + '">' + rot + '</span></td>' +
    '</tr>';
}).join('\n');

const cartoes = uteis.map((r) => {
  const [cls, rot] = veredito(r);
  let corpo = '';
  if (r.tipo === 'cat' && r.niveis_topo && r.niveis_topo.length) {
    const mx = Math.max.apply(null, r.niveis_topo.map((x) => x.desagio));
    corpo = '<table class="niv"><thead><tr><th>nível</th><th class="n">n</th>' +
      '<th class="n">deságio</th><th></th></tr></thead><tbody>' +
      r.niveis_topo.map((x) => '<tr><td>' + esc(x.nivel) + '</td><td class="n">' + num(x.n) +
        '</td><td class="n"><b>' + pct(x.desagio) + '</b></td>' +
        '<td class="barcell">' + barra(x.desagio, mx, 'f-' + cls) + '</td></tr>').join('') +
      '</tbody></table><p class="nota">Só níveis com n&nbsp;&ge;&nbsp;20' +
      (r.niveis > r.niveis_topo.length ? '; a coluna tem ' + num(r.niveis) + ' no total' : '') +
      '. Quando há mais de 8, mostro os 4 maiores e os 4 menores.</p>';
  }
  return '<section class="card" id="c-' + esc(r.coluna) + '">' +
    '<header><h3>' + esc(r.coluna) + '</h3><span class="pill p-' + cls + '">' + rot + '</span></header>' +
    (GLOSS[r.coluna] ? '<p class="gloss">' + esc(GLOSS[r.coluna]) + '</p>' : '') +
    '<dl class="mini">' +
    '<div><dt>R² control. aj.</dt><dd><b>' + pct(r.r2ctlAj) + '</b></dd></div>' +
    '<div><dt>R² cru</dt><dd>' + pct(r.r2) + '</dd></div>' +
    '<div><dt>linhas</dt><dd>' + num(r.n) + '</dd></div>' +
    '<div><dt>níveis</dt><dd>' + (r.niveis === null ? '—' : num(r.niveis)) + '</dd></div>' +
    '</dl>' +
    '<p class="leitura">' + leitura(r) + '</p>' + corpo +
    (ALERTA[r.coluna] ? '<p class="alerta">⚠️ ' + esc(ALERTA[r.coluna]) + '</p>' : '') +
    '</section>';
}).join('\n');

/* deságio por modelo — é a variação que o controle remove antes de medir tudo */
const pg = D.desagio.por_grupo.slice().sort((a, b) => b.desagio - a.desagio);
const maxPg = Math.max.apply(null, pg.map((x) => x.desagio));
const linhasGrupo = pg.map((x) =>
  '<tr><td>' + esc(x.grupo) + '</td><td class="n">' + num(x.n) + '</td>' +
  '<td class="n"><b>' + pct(x.desagio) + '</b></td>' +
  '<td class="barcell">' + barra(x.desagio, maxPg, 'f-forte') + '</td></tr>').join('');

const c = D.coleta;
const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Avaliação coluna a coluna — o que move o deságio</title>
<style>
:root{color-scheme:light dark;
  --surface:#fcfcfb;--card:#fff;--line:#e6e5e0;--ink:#0b0b0b;--ink2:#52514e;--ink3:#87857e;
  --blue:#2a78d6;--blue-l:#9ec5f4;--gray:#c3c2b7;--amber:#eda100;}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --surface:#161615;--card:#1f1f1e;--line:#33332f;--ink:#fff;--ink2:#c3c2b7;--ink3:#8d8b82;
  --blue:#3987e5;--blue-l:#1c5cab;--gray:#52514e;--amber:#c98500;}}
:root[data-theme="dark"]{--surface:#161615;--card:#1f1f1e;--line:#33332f;--ink:#fff;
  --ink2:#c3c2b7;--ink3:#8d8b82;--blue:#3987e5;--blue-l:#1c5cab;--gray:#52514e;--amber:#c98500;}
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
.box.warn{border-left-color:var(--amber)}
.box p{margin:0 0 8px}.box p:last-child{margin:0}
table{width:100%;border-collapse:collapse;font-size:13.5px}
.scroll{overflow-x:auto;margin-top:10px}
th{text-align:left;font-weight:600;color:var(--ink3);font-size:11.5px;text-transform:uppercase;
 letter-spacing:.04em;padding:0 10px 7px 0;border-bottom:1px solid var(--line);white-space:nowrap}
td{padding:7px 10px 7px 0;border-bottom:1px solid var(--line);vertical-align:middle}
tbody tr:hover td{background:color-mix(in srgb,var(--blue) 7%,transparent)}
.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.dim{color:var(--ink3)}.t{color:var(--ink3);font-size:12px}
.col{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px}
.col a{color:inherit;text-decoration:none;border-bottom:1px dotted var(--ink3)}
.col a:hover{border-bottom-color:var(--blue);color:var(--blue)}
.barcell{width:150px;padding-right:0}
.bar{display:block;height:9px;background:color-mix(in srgb,var(--ink) 7%,transparent);
 border-radius:0 4px 4px 0;overflow:hidden}
.bar i{display:block;height:100%;border-radius:0 4px 4px 0;background:var(--blue)}
.f-forte,.f-medio{background:var(--blue)}.f-fraco{background:var(--blue-l)}.f-nulo{background:var(--gray)}
.pill{display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;
 border:1px solid var(--line);color:var(--ink2);white-space:nowrap}
.p-forte{border-color:var(--blue);color:var(--blue)}.p-medio{color:var(--ink2)}
.p-fraco{color:var(--ink3)}.p-nulo{color:var(--ink3);text-decoration:line-through}
.flag{display:inline-block;width:15px;height:15px;line-height:15px;text-align:center;border-radius:99px;
 background:var(--amber);color:#0b0b0b;font-size:10px;font-weight:700;cursor:help;vertical-align:1px}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;margin-top:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px;scroll-margin-top:16px}
.card header{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px}
.gloss{color:var(--ink2);font-size:13px;margin:0 0 10px}
.mini{display:flex;flex-wrap:wrap;gap:14px;margin:0 0 10px;padding:10px 0;
 border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.mini div{min-width:70px}
.mini dt{color:var(--ink3);font-size:11px;text-transform:uppercase;letter-spacing:.03em}
.mini dd{margin:1px 0 0;font-variant-numeric:tabular-nums;font-size:14px}
.leitura{margin:0 0 10px;font-size:13.5px;color:var(--ink2)}
.niv{font-size:12.5px}.niv .barcell{width:90px}.niv td,.niv th{padding:5px 8px 5px 0}
.nota{color:var(--ink3);font-size:11.5px;margin:8px 0 0}
.alerta{margin:10px 0 0;font-size:12.5px;color:var(--ink2);
 background:color-mix(in srgb,var(--amber) 14%,transparent);border-radius:6px;padding:8px 10px}
footer{margin-top:52px;padding-top:18px;border-top:1px solid var(--line);color:var(--ink3);font-size:12.5px}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.92em;
 background:color-mix(in srgb,var(--ink) 7%,transparent);padding:1px 5px;border-radius:4px}
.nav{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
.nav a{font-size:13px;color:var(--blue);text-decoration:none;border:1px solid var(--line);
 border-radius:99px;padding:4px 12px}
.nav a:hover{border-color:var(--blue)}
@media (max-width:640px){.barcell{display:none}h1{font-size:22px}.tile .v{font-size:22px}}
</style></head>
<body><div class="wrap">

<h1>Avaliação coluna a coluna</h1>
<p class="sub">Regressão simples de cada coluna contra o deságio, controlada por modelo</p>
<p class="meta">${D.rotulo || 'Execução 51358'} ·
${c.periodo[0].slice(0, 10).split('-').reverse().join('/')} a
${c.periodo[1].slice(0, 10).split('-').reverse().join('/')} ·
amostra <code>${esc(D.amostra.amostra)}</code> · sem motos e pesados</p>
<div class="rule"></div>
<p class="nav"><a href="analitico-veiculos.html">→ Analítico dos veículos (${num(c.colhidas)} vendas)</a>
<a href="graficos-modelo.html">→ Gráficos: km, idade, UF e laudo</a></p>

<div class="tiles">
  <div class="tile"><div class="v">${num(c.colhidas)}</div><div class="k">vendas</div>
    <div class="x">gabarito ${num(c.esperadas)} · ${c.duplicadas} duplicadas</div></div>
  <div class="tile"><div class="v">${pct(D.desagio.media)}</div><div class="k">deságio médio</div>
    <div class="x">desvio ${pct(D.desagio.desvio)}</div></div>
  <div class="tile"><div class="v">${D.desagio.por_grupo.length}</div><div class="k">modelos</div>
    <div class="x">os mais vendidos em 12 meses</div></div>
  <div class="tile"><div class="v">${uteis.length}</div><div class="k">colunas avaliadas</div>
    <div class="x">+ ${deg.length} descartadas por degeneração</div></div>
</div>

<div class="box">
<p><b>Deságio</b> = 1 − (valor da venda ÷ valor FIPE do anúncio). Deságio de 31% quer dizer
que o carro saiu por 69% da tabela.</p>
<p><b>R² cru</b> é quanto a coluna explica sozinha. <b>R² controlado ajustado</b> é a mesma
regressão sobre o resíduo, já descontada a média do próprio modelo e penalizada pelo
número de parâmetros — <b>é esta que vale</b>. Negativo significa que a coluna explica
menos que o acaso.</p>
<p>O controle existe porque o deságio varia muito mais <i>entre</i> modelos do que dentro de
um. Sem ele, toda coluna correlacionada com o modelo parece driver sem ser.</p>
</div>

<h2>Ranking — as ${uteis.length} colunas</h2>
<div class="scroll"><table>
<thead><tr><th>coluna</th><th>tipo</th><th class="n">linhas</th><th class="n">níveis</th>
<th class="n">R² cru</th><th class="n">R² aj</th><th class="n">R² ctl aj</th><th></th>
<th>veredito</th></tr></thead>
<tbody>${linhasRank}</tbody></table></div>
<p class="nota">Descartadas por degeneração (1 linha por nível, R² = 1 trivial):
${deg.map((d) => '<code>' + esc(d.coluna) + '</code>').join(', ')}.</p>

<h2>Coluna a coluna</h2>
<p class="lead">O que cada coluna faz com o deságio, em ordem de interferência.</p>
<div class="cards">${cartoes}</div>

<h2>Deságio por modelo</h2>
<p class="lead">O patamar de cada um dos ${pg.length} modelos — é a variação que o controle
remove antes de medir todo o resto.</p>
<div class="scroll"><table>
<thead><tr><th>modelo</th><th class="n">vendas</th><th class="n">deságio</th><th></th></tr></thead>
<tbody>${linhasGrupo}</tbody></table></div>

<h2>Ressalvas</h2>
<div class="box warn">
<p><b>O primeiro colocado é frágil na magnitude.</b> São ${num(R.find((x) => x.coluna === 'comprador_loja_id').niveis)}
compradores em ${num(c.colhidas)} vendas — cerca de 6 compras por loja. O R² ajustado já
penaliza isso, mas trate como ordem de grandeza, não como número fechado.</p>
<p><b>Regressão simples não é causa.</b> Cada coluna foi testada sozinha. Quilometragem,
idade e versão andam juntas; pátio, cidade e UF medem quase a mesma coisa. Separar o que é
de quem exige um modelo com as variáveis juntas, que não é o que está aqui.</p>
<p><b>O controle por modelo é mais frouxo que por código FIPE.</b> "Mesmo modelo" mistura
gerações: um Onix 2014 e um Onix 2025 caem no mesmo grupo. Em troca, km e idade passam a
variar de verdade dentro do grupo — o que a medição anterior não conseguia ver.</p>
<p><b>A amostra se move durante o dia.</b> Todo número aqui é o retrato de uma execução.</p>
</div>

<footer>
Gerado por <code>monta-colunas.js</code> a partir de <code>${esc(path.basename(entrada))}</code>,
${D.origem || 'que é a saída do nó <code>Analisar</code> do workflow <code>a6fNNTUYYayehNIn</code>'} ·
coleta ${num(c.colhidas)}/${num(c.esperadas)} conferida contra gabarito, ${c.duplicadas} duplicadas,
${c.truncadas} truncadas.<br>
⚠️ Contém nome real de loja e dado comercial. Repo privado — pensar antes de repassar.
</footer>
</div></body></html>`;

fs.writeFileSync(saida, html, 'utf8');
console.log('\n  ' + path.basename(saida) + ' — ' + (html.length / 1024).toFixed(0) + ' KB');
console.log('  ' + uteis.length + ' colunas + ' + deg.length + ' degeneradas · ' +
  num(c.colhidas) + ' vendas · deságio médio ' + pct(D.desagio.media) + '\n');
