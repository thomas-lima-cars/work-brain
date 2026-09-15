/* Gráficos do deságio dentro do mesmo MODELO.
 * Uso: node monta-graficos.js [dimensoes-51331.json] [saida.html]
 *
 * ── POR QUE BARRA DIVERGENTE EM VOLTA DO ZERO ─────────────────────────────
 * O deságio das faixas vive entre 22% e 41%. Num gráfico de barras ancorado em
 * zero, essa variação some; num gráfico com eixo cortado em 25%, a variação
 * vira montanha — e eixo cortado em barra é mentira gráfica.
 *
 * A saída é medir o que a pergunta realmente é: o DESVIO da faixa em relação à
 * média do próprio modelo. Esse número tem zero de verdade — zero quer
 * dizer "essa faixa não desloca nada" — então a barra pode ser ancorada nele
 * sem distorcer. O valor absoluto vai ao lado, em texto.
 *
 * ── DUAS SÉRIES, DE PROPÓSITO ─────────────────────────────────────────────
 *   azul    dentro do modelo — a resposta da pergunta
 *   laranja bruto — misturando os 20 modelos
 * A distância entre as duas é o tamanho da contaminação por composição de
 * modelo. Sem a laranja, não dá pra saber se o controle mudou alguma coisa.
 *
 * Paleta: slots 1 e 2 do padrão, validados nos dois modos
 * (CVD ΔE 24,7 claro / 26,8 escuro; visão normal 33,6 / 31,8).
 */
const fs = require('fs');
const path = require('path');
const HERE = __dirname;

const entrada = process.argv[2] || path.join(HERE, 'dimensoes-51331.json');
const saida = process.argv[3] || path.join(HERE, 'graficos-modelo.html');
const D = JSON.parse(fs.readFileSync(entrada, 'utf8'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pct = (x, d) => (x * 100).toFixed(d === undefined ? 1 : d).replace('.', ',') + '%';
const sig = (x) => (x >= 0 ? '+' : '−') + Math.abs(x * 100).toFixed(1).replace('.', ',');
const num = (x) => Number(x).toLocaleString('pt-BR');

const MEDIA = D.media;
const N_MIN = 20;   /* faixa com menos que isso não entra no gráfico */

/* ── ordem: bins seguem a ordem natural; nominais, pelo efeito ────────── */
const ORDENADAS = { q_km: true, q_idade: true };

const CFG = {
  q_km: {
    titulo: 'Quilometragem',
    pergunta: 'Carro rodado vende com mais deságio?',
    eixo: 'faixa de km'
  },
  q_idade: {
    titulo: 'Idade do veículo',
    pergunta: 'Carro mais velho vende com mais deságio?',
    eixo: 'ano da venda − ano do modelo'
  },
  q_uf: {
    titulo: 'UF do pátio',
    pergunta: 'Onde o carro está muda o preço?',
    eixo: 'UF do pátio (não do endereço da loja)'
  },
  q_laudo: {
    titulo: 'Laudo cautelar',
    pergunta: 'Laudo reprovado derruba o preço?',
    eixo: 'vehicle_precautionary_reports.situation'
  }
};

function bloco(chave) {
  const dim = D.dimensoes[chave];
  const cfg = CFG[chave];
  let fx = dim.faixas.map((f) => Object.assign({}, f, {
    efeitoBruto: f.bruto - MEDIA
  }));

  const fora = fx.filter((f) => f.n < N_MIN);
  fx = fx.filter((f) => f.n >= N_MIN);
  if (!ORDENADAS[chave]) fx.sort((a, b) => b.efeito - a.efeito);

  const max = Math.max.apply(null,
    fx.map((f) => Math.max(Math.abs(f.efeito), Math.abs(f.efeitoBruto))).concat([0.01]));

  const linhas = fx.map((f) => {
    const w = (v) => (Math.abs(v) / max) * 50;
    const lado = (v, cls) => v >= 0
      ? '<i class="' + cls + ' pos" style="left:50%;width:' + w(v).toFixed(2) + '%"></i>'
      : '<i class="' + cls + ' neg" style="right:50%;width:' + w(v).toFixed(2) + '%"></i>';
    return '<tr' + (f.sem ? ' class="ausente"' : '') + '>' +
      '<th scope="row">' + esc(f.rotulo) + (f.sem ? ' <span class="tag">ausência</span>' : '') + '</th>' +
      '<td class="n">' + num(f.n) + '</td>' +
      '<td class="n abs">' + pct(f.dentro) + '</td>' +
      '<td class="plot"><span class="zero"></span>' +
      lado(f.efeito, 's1') + lado(f.efeitoBruto, 's2') + '</td>' +
      '<td class="n efe"><b>' + sig(f.efeito) + '</b></td>' +
      '<td class="n efe dim">' + sig(f.efeitoBruto) + '</td>' +
      '</tr>';
  }).join('\n');

  /* a conclusão, em número, só sobre faixas com amostra */
  const alto = fx.reduce((a, b) => b.efeito > a.efeito ? b : a, fx[0]);
  const baixo = fx.reduce((a, b) => b.efeito < a.efeito ? b : a, fx[0]);
  const ampC = alto.efeito - baixo.efeito;
  const ampB = Math.max.apply(null, fx.map((f) => f.efeitoBruto)) -
               Math.min.apply(null, fx.map((f) => f.efeitoBruto));

  return `<section class="dim">
  <header>
    <h2>${esc(cfg.titulo)}</h2>
    <p class="perg">${esc(cfg.pergunta)}</p>
  </header>
  <p class="regua"><span>&larr; menos deságio</span><span class="mid">0 = média do próprio modelo</span><span>mais deságio &rarr;</span></p>
  <div class="scroll"><table class="chart">
  <caption class="sr">Deságio por ${esc(cfg.eixo)}, dentro do mesmo modelo</caption>
  <thead><tr>
    <th scope="col">${esc(cfg.eixo)}</th>
    <th scope="col" class="n">vendas</th>
    <th scope="col" class="n">deságio</th>
    <th scope="col" class="plot"></th>
    <th scope="col" class="n">no modelo</th>
    <th scope="col" class="n">bruto</th>
  </tr></thead>
  <tbody>${linhas}</tbody>
  </table></div>
  <p class="resumo">Entre as faixas com amostra, o deságio se desloca
    <b>${sig(ampC).replace('+', '')} p.p.</b> de ponta a ponta dentro do mesmo modelo
    — de <b>${esc(baixo.rotulo)}</b> (${sig(baixo.efeito)}) a
    <b>${esc(alto.rotulo)}</b> (${sig(alto.efeito)}).
    No bruto seriam ${sig(ampB).replace('+', '')} p.p.${
      /* "p.p." já termina em ponto — o else é vazio de propósito */
      Math.abs(ampB - ampC) > 0.01
        ? ' — a diferença de ' + sig(ampB - ampC).replace('+', '') +
          ' p.p. era composição de modelo, não ' + esc(cfg.titulo.toLowerCase()) + '.'
        : ''}</p>
  ${fora.length ? '<p class="nota">Fora do gráfico, com menos de ' + N_MIN +
      ' vendas: ' + fora.map((f) => esc(f.rotulo) + ' (' + f.n + ')').join(', ') + '.</p>' : ''}
</section>`;
}

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Deságio dentro do mesmo modelo</title>
<style>
:root{
  color-scheme:light dark;
  --surface:#fcfcfb; --card:#ffffff; --line:#e6e5e0;
  --ink:#0b0b0b; --ink2:#52514e; --ink3:#87857e;
  --s1:#2a78d6; --s2:#eb6834; --amber:#eda100; --grid:#e6e5e0;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --surface:#161615; --card:#1f1f1e; --line:#33332f;
  --ink:#fff; --ink2:#c3c2b7; --ink3:#8d8b82;
  --s1:#3987e5; --s2:#d95926; --amber:#c98500; --grid:#33332f;
}}
:root[data-theme="dark"]{
  --surface:#161615; --card:#1f1f1e; --line:#33332f;
  --ink:#fff; --ink2:#c3c2b7; --ink3:#8d8b82;
  --s1:#3987e5; --s2:#d95926; --amber:#c98500; --grid:#33332f;
}
*{box-sizing:border-box}
body{margin:0;background:var(--surface);color:var(--ink);
  font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased}
.wrap{max-width:1000px;margin:0 auto;padding-block:32px 64px;padding-left:20px;padding-right:20px}
h1{font-size:25px;margin:0 0 6px;letter-spacing:-.01em;line-height:1.2}
h2{font-size:19px;margin:0;letter-spacing:-.01em}
.sub{color:var(--ink2);margin:0}
.meta{color:var(--ink3);font-size:13px;margin:6px 0 0}
.rule{height:3px;background:var(--amber);border-radius:2px;margin:14px 0 22px}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}

.box{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--s1);
  border-radius:8px;padding:14px 16px;margin:0 0 18px}
.box.warn{border-left-color:var(--amber)}
.box p{margin:0 0 8px} .box p:last-child{margin:0}

.legenda{display:flex;gap:18px;flex-wrap:wrap;align-items:center;margin:0 0 20px;
  font-size:13px;color:var(--ink2)}
.key{display:inline-flex;align-items:center;gap:7px}
.key i{width:22px;height:9px;border-radius:2px;display:inline-block}
.k1{background:var(--s1)} .k2{background:var(--s2)}

.dim{background:var(--card);border:1px solid var(--line);border-radius:10px;
  padding:18px 20px;margin:0 0 18px}
.dim header{margin-bottom:12px}
.perg{color:var(--ink2);margin:3px 0 0;font-size:14px}
.scroll{overflow-x:auto}
table.chart{width:100%;border-collapse:collapse;font-size:13.5px;min-width:560px}
.chart th[scope=col]{text-align:left;font-weight:600;color:var(--ink3);font-size:11px;
  text-transform:uppercase;letter-spacing:.04em;padding:0 10px 8px 0;
  border-bottom:1px solid var(--line);white-space:nowrap;vertical-align:bottom}
.chart th[scope=row]{text-align:left;font-weight:500;padding:6px 10px 6px 0;
  border-bottom:1px solid var(--line);white-space:nowrap}
.chart td{padding:6px 10px 6px 0;border-bottom:1px solid var(--line);vertical-align:middle}
.chart tbody tr:hover th[scope=row],.chart tbody tr:hover td{
  background:color-mix(in srgb,var(--s1) 7%,transparent)}
.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.abs{color:var(--ink2)}
.efe{width:64px} .efe.dim{color:var(--ink3)}
.dim td.dim{color:var(--ink3)}

.plot{position:relative;width:46%;min-width:220px;height:24px;padding-right:0}
th.plot{height:auto}
.regua{display:flex;justify-content:space-between;align-items:baseline;gap:12px;
  margin:0 0 6px;font-size:11px;color:var(--ink3);max-width:100%}
.regua .mid{color:var(--ink3);opacity:.8}
.zero{position:absolute;left:50%;top:1px;bottom:1px;width:1px;background:var(--grid)}
.plot i{position:absolute;height:7px;border-radius:2px;display:block}
.plot .s1{top:4px;background:var(--s1)}
.plot .s2{bottom:4px;background:var(--s2)}
.plot .pos{border-radius:0 3px 3px 0}
.plot .neg{border-radius:3px 0 0 3px}
tr.ausente th[scope=row]{color:var(--ink3)}
tr.ausente .plot i{opacity:.45}
.tag{font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--ink3);
  border:1px solid var(--line);border-radius:99px;padding:1px 6px;margin-left:4px}

.resumo{margin:14px 0 0;font-size:13.5px;color:var(--ink2);
  background:color-mix(in srgb,var(--s1) 8%,transparent);border-radius:6px;padding:10px 12px}
.nota{color:var(--ink3);font-size:11.5px;margin:8px 0 0}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.92em;
  background:color-mix(in srgb,var(--ink) 7%,transparent);padding:1px 5px;border-radius:4px}
footer{margin-top:40px;padding-top:18px;border-top:1px solid var(--line);
  color:var(--ink3);font-size:12.5px}
@media (max-width:640px){h1{font-size:21px} .dim{padding:14px}}
</style></head>
<body><div class="wrap">

<h1>Deságio dentro do mesmo modelo</h1>
<p class="sub">Quilometragem, idade, UF do pátio e laudo cautelar — 20 modelos, sem motos e pesados</p>
<p class="meta">Execução ${D.execucao} · ${num(D.total)} vendas · 20 modelos · sem motos e pesados ·
deságio médio ${pct(MEDIA, 2)}</p>
<div class="rule"></div>

<div class="box">
<p><b>Cada barra é um desvio, não um valor absoluto.</b> Zero quer dizer "esta faixa
vende igual à média do próprio modelo". Para a direita, mais deságio; para a
esquerda, menos. O valor absoluto está na coluna <i>deságio</i>.</p>
<p>Foi preciso medir assim porque o deságio das faixas vive entre 22% e 41%: barra
ancorada em zero absoluto esconderia a variação, e barra com eixo cortado em 20%
transformaria 3 pontos percentuais em montanha. O desvio tem um zero de verdade.</p>
</div>

<div class="legenda">
  <span class="key"><i class="k1"></i> dentro do mesmo modelo — <b>a resposta</b></span>
  <span class="key"><i class="k2"></i> bruto, misturando os 20 modelos</span>
</div>

${['q_km', 'q_idade', 'q_uf', 'q_laudo'].map(bloco).join('\n')}

<h2 style="margin-top:34px">O que mudou ao trocar código FIPE por modelo</h2>
<div class="box">
<p>A medição anterior agrupava por <b>código FIPE</b> — versão + ano. Dentro de um
grupo desses o ano do modelo quase não varia, então idade tinha pouco o que medir.
Por modelo, o Gol cobre 2006–2023 e o Corolla 2003–2026.</p>
<p><b>O efeito é grande onde deveria ser:</b></p>
<table class="chart" style="margin-top:8px;min-width:0">
<thead><tr><th scope="col">dimensão</th><th scope="col" class="n">por código FIPE</th>
<th scope="col" class="n">por modelo</th></tr></thead>
<tbody>
<tr><th scope="row">Quilometragem</th><td class="n">7,4 p.p.</td><td class="n"><b>15,0 p.p.</b></td></tr>
<tr><th scope="row">Idade</th><td class="n">2,6 p.p.</td><td class="n"><b>9,2 p.p.</b></td></tr>
<tr><th scope="row">UF do pátio</th><td class="n">6,0 p.p.</td><td class="n"><b>7,9 p.p.</b></td></tr>
<tr><th scope="row">Laudo</th><td class="n">4,9 p.p.</td><td class="n"><b>5,2 p.p.</b></td></tr>
</tbody></table>
<p style="margin-top:10px">⚠️ <b>Isso não é só ganho.</b> "Mesmo modelo" é um controle mais
frouxo que "mesmo código FIPE": mistura gerações e versões. Um Onix 2014 e um Onix 2025
caem no mesmo grupo. Parte do que aparece como efeito de quilometragem pode ser efeito de
geração — as duas andam juntas. A leitura ficou mais sensível <i>e</i> menos limpa.</p>
</div>

<h2 style="margin-top:34px">Ressalvas</h2>
<div class="box warn">
<p><b>"Status da documentação" não existe no banco.</b> Procurei: as colunas
<code>document</code> guardam CPF/CNPJ de pessoa. O que existe é o <b>laudo
cautelar</b> (<code>vehicle_precautionary_reports.situation</code>), e é ele que está
no quarto gráfico — rotulado como laudo, não como documentação. Se o pedido era
outra coisa, o campo precisa ser encontrado antes.</p>
<p><b><code>nao_informado</code> não é ausência de laudo.</b> São 2.170 vendas de veículo
que <i>tem</i> laudo, e o laudo não traz veredito — quase metade da amostra.
"Sem laudo" — veículo sem linha na tabela — são outras 84, e aparecem separadas de
propósito. Juntar as duas mentiria.</p>
<p><b>Motos e pesados saíram por categoria, linha a linha.</b> Motocicleta, Caminhão,
Ônibus, Reboque e Semirreboque somavam 1.206 de 10.289 vendas (11,7%). Sobraram 9.083, e
os 20 modelos maiores concentram ${num(D.total)} delas. As categorias que restaram na
amostra são Automóvel (3.730), Utilitário (832) e <b>"Não informada" (20)</b> — essas 20
ficaram porque não se sabe o que são, e descartar sem saber é pior que manter e declarar.</p>
<p><b>A amostra se move durante o dia.</b> Todo número aqui é o retrato de uma execução.
Ontem duas extrações com 35 minutos de diferença deram 1.302 e 1.306 — eram vendas cujo
status virou "vendido" no intervalo.</p>
<p><b>Correlação não é causa.</b> Cada dimensão foi medida sozinha. Quilometragem e idade
andam juntas; UF e loja vendedora também. Separar o que é de quem exige um modelo com as
variáveis juntas, que não é o que está aqui.</p>
</div>

<footer>
Gerado por <code>monta-graficos.js</code> a partir de <code>${esc(path.basename(entrada))}</code> ·
execução ${D.execucao} do workflow <code>a6fNNTUYYayehNIn</code> ·
agregação por (modelo × faixa), coleta conferida contra gabarito.<br>
⚠️ Dado comercial de cliente. Repo privado — pensar antes de repassar.
</footer>

</div></body></html>`;

fs.writeFileSync(saida, html, 'utf8');
console.log('\n  ' + path.basename(saida) + ' — ' + (html.length / 1024).toFixed(0) + ' KB');
console.log('  4 dimensoes · ' + num(D.total) + ' vendas · desagio medio ' + pct(MEDIA, 2) + '\n');
