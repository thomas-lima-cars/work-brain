/* PÁGINA — as palavras da descrição que mexem no deságio.
 * Uso: node monta-termos.js [termos-51368.json] [saida.html]
 *
 * Barra divergente em torno do zero, pelo mesmo motivo da página de dimensões:
 * o que se mede é um DESVIO em relação à média do próprio modelo, e desvio tem
 * zero de verdade. Barra ancorada em zero absoluto esconderia a variação.
 *
 * O corte de significância é Bonferroni sobre o nº de termos efetivamente
 * testados — não um |t| > 2 solto. Com 32 mil testes contra o mesmo alvo,
 * |t| = 2 acontece por acaso às centenas.
 */
const fs = require('fs');
const path = require('path');
const HERE = __dirname;

const entrada = process.argv[2] || path.join(HERE, 'termos-51368.json');
const saida = process.argv[3] || path.join(HERE, 'termos-descricao.html');
const D = JSON.parse(fs.readFileSync(entrada, 'utf8'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pct = (x) => (x * 100).toFixed(1).replace('.', ',') + '%';
const sig = (x) => (x >= 0 ? '+' : '−') + Math.abs(x * 100).toFixed(1).replace('.', ',');
const num = (x) => Number(x).toLocaleString('pt-BR');

/* Bonferroni: 32.336 termos testados contra o mesmo alvo. α = 0,05 dividido
   por isso dá ~1,5e-6, que em z é ≈ 4,8. Abaixo disso o termo é candidato,
   não achado. */
const TESTADOS = 32336;
const T_SEGURO = 4.8;

const T = {};
D.termos.forEach((t) => { T[t.termo] = t; });
const pega = (nome) => T[nome] || null;

/* famílias curadas: o ranking cru mistura fragmento de frase com achado.
   Agrupar por assunto é o que torna a lista legível por quem decide preço. */
const FAMILIAS = [
  {
    titulo: 'Classificação comercial',
    nota: 'Duas palavras que não descrevem o carro: classificam a operação. São o maior efeito da lista inteira — e a rigor não deveriam viver num campo de texto.',
    termos: ['repasse', 'tradicional']
  },
  {
    titulo: 'Documentação',
    nota: 'O "status da documentação" que eu disse não existir no banco. Existe — dentro da descrição, em texto.',
    termos: ['documento em regularizacao', 'documento pronto']
  },
  {
    titulo: 'Mecânica',
    nota: 'Motor parado é o item de condição com maior efeito.',
    termos: ['motor nao funciona', 'motor funciona']
  },
  {
    titulo: 'Itens e equipamento',
    nota: 'Chave, estepe e itens de segurança. A negação é o que carrega o sinal — por isso a análise usa expressões, não palavras soltas.',
    termos: ['nao possui itens', 'chave reserva', 'com estepe', 'possui chave']
  },
  {
    titulo: 'Avarias localizadas',
    nota: 'Todas empurram o deságio para cima. Quanto mais específica a avaria citada, maior o efeito.',
    termos: ['para lama', 'toda lataria', 'choque traseiro avariado', 'pneus', 'farol',
      'banco', 'caixa de ar', 'amassada', 'traseira direita', 'lateral']
  },
  {
    titulo: 'Linguagem que tranquiliza',
    nota: 'Vocabulário de quem descreve o estado com cuidado. Todas puxam o deságio para baixo — mas isto é o vendedor, não o carro: quem escreve assim tende a ser quem cuida do anúncio.',
    termos: ['no estado', 'demais informacoes', 'regular', 'conservacao', 'superficiais',
      'de uso', 'riscos e ralados', 'leve']
  },
  {
    titulo: 'Contraintuitivo',
    nota: 'IPVA pago aparece com MAIS deságio, não menos. Não tenho explicação medida — fica como pergunta.',
    termos: ['ipva pago', 'fotos']
  }
];

const usados = new Set();
FAMILIAS.forEach((f) => f.termos.forEach((t) => usados.add(t)));
const resto = D.termos.filter((t) => !usados.has(t.termo)).slice(0, 40);

const todos = D.termos.filter((t) => t.t !== null);
const maxEf = Math.max.apply(null, todos.map((t) => Math.abs(t.efeito)).concat([0.02]));

function linha(t) {
  if (!t) return '';
  const w = (Math.abs(t.efeito) / maxEf) * 50;
  const seguro = Math.abs(t.t) >= T_SEGURO;
  const lado = t.efeito >= 0
    ? '<i class="s1 pos" style="left:50%;width:' + w.toFixed(2) + '%"></i>'
    : '<i class="s1 neg" style="right:50%;width:' + w.toFixed(2) + '%"></i>';
  return '<tr class="' + (seguro ? 'ok' : 'fraco') + '">' +
    '<th scope="row"><code>' + esc(t.termo) + '</code>' +
    (seguro ? '' : ' <span class="tag" title="não passa no corte de teste múltiplo">candidato</span>') +
    '</th>' +
    '<td class="n">' + num(t.vendas) + '</td>' +
    '<td class="n">' + t.modelos + '</td>' +
    '<td class="n abs">' + pct(t.desagio_com) + '</td>' +
    '<td class="plot"><span class="zero"></span>' + lado + '</td>' +
    '<td class="n efe"><b>' + sig(t.efeito) + '</b></td>' +
    '<td class="n dim">' + (t.t).toFixed(1).replace('.', ',') + '</td>' +
    '</tr>';
}

function tabela(linhas) {
  return '<p class="regua"><span>&larr; menos deságio</span>' +
    '<span class="mid">0 = média do próprio modelo</span>' +
    '<span>mais deságio &rarr;</span></p>' +
    '<div class="scroll"><table class="chart"><thead><tr>' +
    '<th scope="col">termo</th><th scope="col" class="n">vendas</th>' +
    '<th scope="col" class="n">mod.</th><th scope="col" class="n">deságio</th>' +
    '<th scope="col" class="plot"></th><th scope="col" class="n">efeito</th>' +
    '<th scope="col" class="n">t</th></tr></thead><tbody>' +
    linhas + '</tbody></table></div>';
}

/* ⚠️ Para comparar DOIS termos entre si, use a diferença dos PATAMARES
   (desagio_com), nunca a soma dos efeitos. Cada `efeito` é medido contra todo
   o resto da base — que inclui o outro termo —, então somá-los conta a mesma
   diferença duas vezes: dava +9,1 p.p. onde o correto é +7,0. */
const rep = pega('repasse'), tra = pega('tradicional');
const dpr = pega('documento pronto'), dre = pega('documento em regularizacao');

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>As palavras que mexem no deságio</title>
<style>
:root{color-scheme:light dark;
 --surface:#fcfcfb;--card:#fff;--line:#e6e5e0;--ink:#0b0b0b;--ink2:#52514e;--ink3:#87857e;
 --s1:#2a78d6;--amber:#eda100;--grid:#e6e5e0}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
 --surface:#161615;--card:#1f1f1e;--line:#33332f;--ink:#fff;--ink2:#c3c2b7;--ink3:#8d8b82;
 --s1:#3987e5;--amber:#c98500;--grid:#33332f}}
:root[data-theme="dark"]{--surface:#161615;--card:#1f1f1e;--line:#33332f;--ink:#fff;
 --ink2:#c3c2b7;--ink3:#8d8b82;--s1:#3987e5;--amber:#c98500;--grid:#33332f}
*{box-sizing:border-box}
body{margin:0;background:var(--surface);color:var(--ink);
 font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
 -webkit-font-smoothing:antialiased}
.wrap{max-width:1000px;margin:0 auto;padding-block:32px 64px;padding-left:20px;padding-right:20px}
h1{font-size:25px;margin:0 0 6px;letter-spacing:-.01em;line-height:1.2}
h2{font-size:19px;margin:0;letter-spacing:-.01em}
.sub{color:var(--ink2);margin:0}
.meta{color:var(--ink3);font-size:13px;margin:6px 0 0}
.rule{height:3px;background:var(--amber);border-radius:2px;margin:14px 0 0}
.nav{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0 20px}
.nav a{font-size:13px;color:var(--s1);text-decoration:none;border:1px solid var(--line);
 border-radius:99px;padding:4px 12px}
.nav a:hover{border-color:var(--s1)}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:0 0 18px}
.tile{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
.tile .v{font-size:25px;font-weight:650;letter-spacing:-.02em;line-height:1.1}
.tile .k{color:var(--ink3);font-size:12px;text-transform:uppercase;letter-spacing:.04em;margin-top:4px}
.tile .x{color:var(--ink2);font-size:12px;margin-top:2px}
.box{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--s1);
 border-radius:8px;padding:14px 16px;margin:0 0 18px}
.box.warn{border-left-color:var(--amber)}
.box p{margin:0 0 8px}.box p:last-child{margin:0}
.fam{background:var(--card);border:1px solid var(--line);border-radius:10px;
 padding:18px 20px;margin:0 0 16px}
.fam header{margin-bottom:10px}
.nt{color:var(--ink2);margin:4px 0 0;font-size:13.5px}
.regua{display:flex;justify-content:space-between;align-items:baseline;gap:12px;
 margin:0 0 6px;font-size:11px;color:var(--ink3)}
.scroll{overflow-x:auto}
table.chart{width:100%;border-collapse:collapse;font-size:13.5px;min-width:600px}
.chart th[scope=col]{text-align:left;font-weight:600;color:var(--ink3);font-size:11px;
 text-transform:uppercase;letter-spacing:.04em;padding:0 10px 8px 0;
 border-bottom:1px solid var(--line);white-space:nowrap}
.chart th[scope=row]{text-align:left;font-weight:400;padding:6px 10px 6px 0;
 border-bottom:1px solid var(--line);white-space:nowrap}
.chart td{padding:6px 10px 6px 0;border-bottom:1px solid var(--line);vertical-align:middle}
.chart tbody tr:hover th[scope=row],.chart tbody tr:hover td{
 background:color-mix(in srgb,var(--s1) 7%,transparent)}
.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.abs{color:var(--ink2)}.dim{color:var(--ink3)}.efe{width:66px}
tr.fraco th[scope=row] code{color:var(--ink3)}
tr.fraco .plot i{opacity:.45}
.plot{position:relative;width:38%;min-width:180px;height:22px;padding-right:0}
.zero{position:absolute;left:50%;top:1px;bottom:1px;width:1px;background:var(--grid)}
.plot i{position:absolute;height:8px;top:7px;border-radius:2px;display:block;background:var(--s1)}
.plot .pos{border-radius:0 3px 3px 0}.plot .neg{border-radius:3px 0 0 3px}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.9em;
 background:color-mix(in srgb,var(--ink) 7%,transparent);padding:1px 5px;border-radius:4px}
.tag{font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--ink3);
 border:1px solid var(--line);border-radius:99px;padding:1px 7px;cursor:help}
.gap{font-size:13.5px;color:var(--ink2);margin:12px 0 0;
 background:color-mix(in srgb,var(--s1) 8%,transparent);border-radius:6px;padding:10px 12px}
footer{margin-top:40px;padding-top:18px;border-top:1px solid var(--line);
 color:var(--ink3);font-size:12.5px}
@media (max-width:640px){h1{font-size:21px}.plot{display:none}}
</style></head>
<body><div class="wrap">

<h1>As palavras que mexem no deságio</h1>
<p class="sub">Análise de <code>vehicles.description</code> — o texto livre do veículo</p>
<p class="meta">Execução ${D.execucao} · ${num(D.base.vendas)} vendas · ${num(D.base.celulas)} células
(modelo × texto) · ${num(D.base.textos_distintos)} textos distintos · deságio médio ${pct(D.base.desagio_medio)}</p>
<div class="rule"></div>
<p class="nav"><a href="colunas-desagio.html">→ Avaliação coluna a coluna</a>
<a href="analitico-veiculos.html">→ Analítico dos veículos</a>
<a href="graficos-modelo.html">→ Gráficos: km, idade, UF e laudo</a></p>

<div class="tiles">
  <div class="tile"><div class="v">${num(TESTADOS)}</div><div class="k">termos testados</div>
    <div class="x">1 a 4 palavras seguidas</div></div>
  <div class="tile"><div class="v">${num(D.termos.length)}</div><div class="k">passaram nos cortes</div>
    <div class="x">n ≥ ${D.cortes.n_min}, ≥ ${D.cortes.modelos_min} modelos</div></div>
  <div class="tile"><div class="v">${sig(rep.desagio_com - tra.desagio_com)}</div><div class="k">p.p. · repasse vs tradicional</div>
    <div class="x">o maior efeito da lista</div></div>
  <div class="tile"><div class="v">98,9%</div><div class="k">das vendas têm texto</div>
    <div class="x">${num(D.base.vendas - D.base.com_texto)} sem descrição</div></div>
</div>

<div class="box">
<p><b>Não é bem texto livre.</b> São ${num(D.base.textos_distintos)} textos distintos para
${num(D.base.vendas)} vendas, e duas frases sozinhas cobrem 44% da base. É formulário
digitado à mão: um rótulo de operação, um bloco de documentação e um checklist de estado.</p>
<p><b>A análise usa expressões de 1 a 4 palavras, não palavras soltas</b> — porque a negação
é o que carrega o sinal. <code>possui chave</code> e <code>não possui chave</code>
compartilham a palavra "chave"; contando palavra solta, "chave" daria efeito zero e a
conclusão seria que chave não importa.</p>
<p><b>Cada efeito é medido dentro do mesmo modelo</b>, igual ao resto do estudo: o desvio da
média do próprio modelo. Sem isso, <code>repasse</code> pareceria caro só por aparecer mais
em modelo que já é caro.</p>
</div>

${FAMILIAS.map((f) => `<section class="fam">
  <header><h2>${esc(f.titulo)}</h2><p class="nt">${f.nota}</p></header>
  ${tabela(f.termos.map((t) => linha(pega(t))).join(''))}
</section>`).join('\n')}

<section class="fam">
  <header><h2>Os demais</h2>
  <p class="nt">Os 40 seguintes por tamanho de efeito, sem curadoria. Muitos são fragmentos
  de frase de uma família acima — <code>estado</code> e <code>se encontra</code> são pedaços
  de "no estado que se encontra".</p></header>
  ${tabela(resto.map(linha).join(''))}
</section>

<h2 style="margin-top:34px">O que isto muda, e o que não prova</h2>
<div class="box warn">
<p><b>O maior achado não é uma palavra — é um campo no lugar errado.</b>
<code>REPASSE</code> e <code>TRADICIONAL</code> não descrevem o veículo: classificam a
operação. Entre os dois há <b>${sig(rep.desagio_com - tra.desagio_com).replace('+', '')} pontos
percentuais</b> de deságio (${pct(rep.desagio_com)} contra ${pct(tra.desagio_com)}), em
${rep.vendas + tra.vendas} das ${num(D.base.vendas)} vendas. Isso é uma coluna, não uma
descrição — e enquanto viver dentro de um TEXT digitado à mão vai continuar invisível para
qualquer relatório que não faça o que esta página fez.</p>

<p><b>O status da documentação existe — eu disse que não.</b> Quando você perguntou por ele
há dois dias, procurei nas colunas do banco e respondi que não havia. Estava certo sobre as
colunas e errado sobre o banco: <code>Documento Pronto</code> (${num(dpr.vendas)} vendas,
${sig(dpr.efeito)} p.p.) e <code>DOCUMENTO EM REGULARIZAÇÃO</code> (${num(dre.vendas)},
${sig(dre.efeito)} p.p.) estão no texto, separados por
<b>${sig(dre.desagio_com - dpr.desagio_com).replace('+', '')} p.p.</b></p>

<p><b>O termo que faz mais sentido de negócio é o que menos se sustenta estatisticamente.</b>
<code>motor nao funciona</code> dá ${sig(pega('motor nao funciona').efeito)} p.p. com
t = ${pega('motor nao funciona').t.toFixed(1).replace('.', ',')} — abaixo do corte de
${String(T_SEGURO).replace('.', ',')} que ${num(TESTADOS)} testes simultâneos exigem. É o
achado mais plausível da lista e ainda assim entra como <i>candidato</i>, não como provado.
Confirmar exige olhar só esse termo, numa amostra nova.</p>

<p><b>"Linguagem que tranquiliza" provavelmente não é sobre o carro.</b> Palavras como
<code>conservacao</code>, <code>superficiais</code> e <code>de uso</code> puxam o deságio
para baixo — mas quem escreve assim é um tipo de vendedor, e vendedor já apareceu como
driver na análise de colunas. O efeito pode ser do anunciante, não do texto.</p>

<p><b>Correlação, e num campo escrito por quem vende.</b> Nada aqui diz que mudar a palavra
muda o preço. Diz que carros descritos assim vendem assim.</p>
</div>

<footer>
Gerado por <code>monta-termos.js</code> a partir de <code>${path.basename(entrada)}</code> ·
workflow <code>a6fNNTUYYayehNIn</code>, execuções 51366 (reconhecimento) e ${D.execucao} (coleta) ·
coleta conferida contra gabarito: ${num(D.base.celulas)} células, ${num(D.base.vendas)} vendas.<br>
t aproximado: o dado veio agregado por célula, então a variância dentro da célula não entra na conta.<br>
⚠️ Dado comercial de cliente. Repo privado — pensar antes de repassar.
</footer>
</div></body></html>`;

fs.writeFileSync(saida, html, 'utf8');
console.log('\n  ' + path.basename(saida) + ' — ' + (html.length / 1024).toFixed(0) + ' KB');
console.log('  ' + FAMILIAS.length + ' famílias + ' + resto.length + ' termos sem curadoria');
console.log('  repasse vs tradicional: ' + sig(rep.desagio_com - tra.desagio_com) + ' p.p.\n');
