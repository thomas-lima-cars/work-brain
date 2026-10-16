/* RELATÓRIO PREDITIVO — previsto × vendido, a partir de resultado-modelo.json
 *
 *   node automations/precificacao/preditivo/monta-relatorio.js
 *
 * Parte do `design/modelos/dashboard-claro.html` (folha, logos, topo, tema) e
 * troca o <main> e o bloco de dados. Não copia a folha à mão: quando o tema
 * mudar, regerar este arquivo traz a mudança junto.
 *
 * O que a tela calcula sozinha, a partir das vendas testadas: KPI, acerto por
 * mês, dispersão e tabela — tudo responde ao filtro de base. O que vem pronto
 * do Python: a escada (cada degrau é um modelo diferente, não dá para refazer
 * no navegador) e os pesos.
 */
const fs = require('fs');
const path = require('path');

const AQUI = __dirname;
const RAIZ = path.join(AQUI, '..', '..', '..');
const R = JSON.parse(fs.readFileSync(path.join(AQUI, 'resultado-modelo.json'), 'utf8'));
let tpl = fs.readFileSync(path.join(RAIZ, 'design', 'modelos', 'dashboard-claro.html'), 'utf8');

const corta = (txt, ini, fim, novo) => {
  const a = txt.indexOf(ini), b = txt.indexOf(fim, a);
  if (a < 0 || b < 0) throw new Error('não achei no modelo: ' + ini.slice(0, 40));
  return txt.slice(0, a) + novo + txt.slice(b + fim.length);
};

/* ── topo ─────────────────────────────────────────────────────────────── */
tpl = tpl.replace(/<title>[^<]*<\/title>/, '<title>Precificação preditiva — teste em vendas reais</title>');
tpl = corta(tpl, '<div class="topo-tit">', '</div>',
  '<div class="topo-tit">\n      <h1>Precificação preditiva</h1>\n' +
  '      <p class="sub">Previsto × vendido · jul a set/2026</p>\n    </div>');
tpl = corta(tpl, '<select class="ctrl" id="f-base"', '</select>',
  '<select class="ctrl" id="f-base" aria-label="Base">\n' +
  '        <option value="todas">Todas as bases</option>\n' +
  '        <option value="Cars2You">Cars2You</option>\n' +
  '        <option value="Dealers">Dealers</option>\n      </select>');
tpl = corta(tpl, '<select class="ctrl" id="f-janela"', '</select>', '');

/* ── corpo ────────────────────────────────────────────────────────────── */
const ICO = {
  alvo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  faixa: '<path d="M4 12h16"/><path d="M8 8l-4 4 4 4"/><path d="M16 8l4 4-4 4"/>',
  real: '<path d="M12 2v20"/><path d="M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>',
  ganho: '<path d="M3 17l6-6 4 4 7-7"/><path d="M14 8h6v6"/>',
  disp: '<path d="M3 3v18h18"/><circle cx="8" cy="15" r="1.2"/><circle cx="12" cy="10" r="1.2"/><circle cx="17" cy="7" r="1.2"/>',
  escada: '<path d="M4 20h4v-4h4v-4h4V8h4"/>',
  pesos: '<path d="M12 3v18"/><path d="M5 7h14"/><path d="M5 7l-3 7h6z"/><path d="M19 7l-3 7h6z"/>',
  tab: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>',
  mes: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  lupa: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  alerta: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  balanca: '<path d="M12 3v18"/><path d="M5 7h14"/><path d="M5 7l-3 7h6z"/><path d="M19 7l-3 7h6z"/>',
};
/* outliers.json sai de outliers.py; sem ele a seção diz o que rodar */
const pOut = path.join(AQUI, 'outliers.json');
const OUT = fs.existsSync(pOut) ? JSON.parse(fs.readFileSync(pOut, 'utf8')) : null;
const chip = (k) => '<span class="chip" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICO[k] + '</svg></span>';
const kpi = (k, ic, rot) => `
    <article class="cartao">
      <div class="cartao-topo">${chip(ic)}<span class="kpi-rot">${rot}</span></div>
      <p class="kpi-val num" id="k-${k}">—</p>
      <p class="kpi-delta neutro" id="k-${k}-d">—</p>
      <dl class="kpi-pe" id="k-${k}-pe"></dl>
    </article>`;

const COMO_HTML = require('./pagina-como.js')(R, chip);

const MAIN = `<main class="area">
  <nav class="abas" role="tablist" aria-label="Páginas">
    <button type="button" role="tab" class="aba" data-pg="res" aria-selected="true">Resultados</button>
    <button type="button" role="tab" class="aba" data-pg="como" aria-selected="false">Como o modelo funciona</button>
  </nav>
  <div id="pg-res">

  <section class="g4" aria-label="Indicadores">${
    kpi('med', 'alvo', 'Erro mediano') + kpi('d10', 'faixa', 'Dentro de ±10%') +
    kpi('mae', 'real', 'Erro médio por carro') + kpi('ganho', 'ganho', 'Ganho sobre o chute')}
  </section>

  <section class="g2">
    <article class="cartao">
      <div class="cartao-topo">${chip('disp')}<h2>Previsto × vendido</h2>
        <span class="dir"><span class="tag" id="disp-n">—</span></span></div>
      <svg class="graf" id="disp" viewBox="0 0 800 400" role="img"
           aria-label="Dispersão do preço previsto contra o preço de venda"></svg>
      <p class="nota">Cada ponto é uma venda. Na diagonal, o previsto bateu com o vendido; a faixa
        clara é ±10%. Acima da diagonal o modelo previu mais caro do que vendeu.</p>
    </article>
    <article class="cartao">
      <div class="cartao-topo">${chip('mes')}<h2>Acerto por mês</h2></div>
      <div class="rolo"><table>
        <thead><tr><th>mês</th><th>vendas</th><th>erro mediano</th><th>±10%</th><th>viés</th></tr></thead>
        <tbody id="tab-mes"></tbody></table></div>
      <p class="nota" id="nota-mes"></p>
    </article>
  </section>

  <section class="g2">
    <article class="cartao">
      <div class="cartao-topo">${chip('escada')}<h2>O que cada bloco de informação acrescenta</h2></div>
      <div class="rolo"><table class="escada">
        <thead><tr><th>modelo</th><th>erro mediano</th><th>±10%</th><th>erro médio</th><th>viés</th>
          <th title="só as vendas cujo laudo em PDF foi lido">erro mediano<br>com laudo lido</th></tr></thead>
        <tbody id="tab-escada"></tbody></table></div>
      <p class="nota">Cada linha acrescenta um bloco à de cima, e todas foram cobradas nas mesmas vendas.
        Em <b>negrito</b>, o modelo que gera o preço desta página.<span id="nota-ad"></span></p>
    </article>
    <article class="cartao">
      <div class="cartao-topo">${chip('pesos')}<h2>O que mais move o preço</h2></div>
      <ol class="rank" id="rank-pesos"></ol>
      <p class="nota">Em pontos percentuais da FIPE, já descontado o modelo do carro. Verde vende
        mais caro, vermelho mais barato. Só o que se apoia em 30 vendas ou mais.</p>
    </article>
  </section>

  <section class="cartao">
    <div class="cartao-topo">${chip('balanca')}<h2>Modelo × VMV × venda</h2>
      <span class="dir"><span class="tag" id="vmv-n">—</span></span></div>
    <dl class="kpi-pe vmv-kpi" id="vmv-kpi"></dl>
    <div class="rolo"><table class="confronto">
      <thead><tr><th>o VMV, comparado ao preço do modelo</th><th>vendas</th>
        <th title="mediana de venda ÷ preço do modelo">venda ÷ modelo</th>
        <th title="mediana de venda ÷ VMV">venda ÷ VMV</th>
        <th>erro do modelo</th><th>erro do VMV</th>
        <th title="em quantas vendas o modelo chegou mais perto do vendido do que o VMV">modelo mais perto</th>
        <th>vendeu abaixo do VMV</th></tr></thead>
      <tbody id="tab-vmv"></tbody></table></div>
    <p class="nota" id="vmv-nota"></p>
  </section>

  <section class="cartao">
    <div class="cartao-topo">${chip('faixa')}<h2>O índice de confiança acerta?</h2></div>
    <div class="rolo"><table class="calib">
      <thead><tr><th>confiança</th><th>vendas</th><th>índice médio anunciado</th>
        <th>acerto observado (±10%)</th><th>erro mediano</th><th>venda dentro da faixa provável</th></tr></thead>
      <tbody id="tab-calib"></tbody></table></div>
    <p class="nota">Se o índice é honesto, "anunciado" e "observado" ficam próximos em cada linha. Ele serve sobretudo para
      apontar os carros difíceis de prever: na confiança baixa o erro é bem maior; entre média e alta a diferença é pequena.
      A faixa provável foi calibrada para conter 80% das vendas.</p>
  </section>

  <section class="cartao">
    <div class="cartao-topo">${chip('alerta')}<h2>Ofensores dos outliers</h2>
      <span class="dir"><span class="tag" id="out-n">—</span></span></div>
    <div class="rolo"><table class="ofensores">
      <thead><tr><th>indicador</th><th title="vendas outlier com o indicador">nos outliers</th>
        <th title="vendas com erro até 10% que têm o indicador">nas bem previstas</th>
        <th title="quantas vezes mais comum entre os outliers">vezes mais comum</th>
        <th title="das vendas com o indicador, quantas viraram outlier">vira outlier</th>
        <th>o modelo usa?</th></tr></thead>
      <tbody id="tab-out"></tbody></table></div>
    <p class="nota" id="out-nota"></p>
  </section>

  <section class="cartao">
    <div class="cartao-topo">${chip('tab')}<h2>Vendas testadas</h2>
      <span class="dir"><span class="tag" id="tab-n">—</span></span></div>
    <div class="filtros-tab">
      <input class="ctrl" id="busca" type="search" placeholder="buscar modelo, versão, id ou UF…" aria-label="Buscar">
      <select class="ctrl" id="f-erro" aria-label="Faixa de erro">
        <option value="">Qualquer erro</option><option value="ok">Até 10%</option>
        <option value="atencao">10% a 20%</option><option value="ruim">Acima de 20%</option></select>
      <select class="ctrl" id="f-laudo" aria-label="Laudo">
        <option value="">Com e sem laudo lido</option><option value="1">Só com laudo lido</option></select>
      <select class="ctrl" id="f-vmv" aria-label="VMV comparado ao modelo">
        <option value="">Qualquer VMV</option><option value="acima">VMV mais de 15% acima do modelo</option>
        <option value="abaixo">VMV mais de 15% abaixo do modelo</option><option value="sem">Sem VMV</option></select>
      <button class="ctrl" id="b-csv" type="button">Baixar CSV</button>
    </div>
    <div class="rolo rolo-alto"><table class="vendas">
      <thead><tr><th data-k="b">base</th><th data-k="g">modelo</th><th data-k="a">ano</th>
        <th data-k="k">km</th><th data-k="uf">UF</th><th data-k="dt">venda em</th>
        <th data-k="f">FIPE</th><th data-k="prev">previsto</th><th data-k="conf" title="chance estimada de a venda ficar a até 10% do previsto">confiança</th><th data-k="vmv">VMV</th><th data-k="real">vendido</th>
        <th data-k="erro">erro</th><th>laudo</th></tr></thead>
      <tbody id="tab-vendas"></tbody></table></div>
    <p class="nota" id="tab-mais"></p>
  </section>

  <section class="cartao" id="extrato">
    <div class="cartao-topo">${chip('lupa')}<h2>Como o preço foi composto</h2>
      <span class="dir"><span class="tag" id="ext-tag">—</span></span></div>
    <div id="ext-corpo"><p class="nota">Clique numa venda da tabela.</p></div>
  </section>

  </div>
${COMO_HTML}
  <details class="cartao gloss" id="gloss">
    <summary class="cartao-topo">
      <span class="chip" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 19V5a2 2 0 012-2h13v18H6a2 2 0 01-2-2z"/><path d="M4 19a2 2 0 012-2h13"/></svg></span>
      <h2>Glossário</h2>
      <span class="dir"><span class="tag" id="gloss-n">—</span><span class="seta" aria-hidden="true">▾</span></span>
    </summary>
    <dl id="gloss-lista"></dl>
  </details>

  <p class="rodape">
    Atualizado em ${R.gerado_em.split('-').reverse().join('/')} · ${R.corte.n_vendas.toLocaleString('pt-BR')} vendas disputadas (${R.corte.min_lojas}+ lojas) dos 100 modelos mais vendidos de cada base (Cars2You e Dealers, set/2025 a set/2026) · ${R.corte.n_teste.toLocaleString('pt-BR')} delas no teste
  </p>

</main>`;
tpl = corta(tpl, '<main class="area">', '</main>', MAIN);

/* ── folha própria: só o que o modelo não tem ─────────────────────────── */
const CSS = `<style>
.nota{ font-size:12px; color:var(--texto-3); margin:10px 0 0; line-height:1.45; position:relative }
.graf .faixa10{ fill:var(--acento-veu) }
.graf .diag{ stroke:var(--texto-3); stroke-width:1; stroke-dasharray:4 4 }
.graf .pt{ fill:var(--acento-cheio); fill-opacity:.38 }
.graf .pt.Dealers{ fill:var(--atencao); fill-opacity:.38 }
.graf .leg{ font-size:11px; fill:var(--texto-2) }
.filtros-tab{ display:grid; gap:10px 12px; margin:0 0 12px; position:relative;
  grid-template-columns:repeat(auto-fit,minmax(180px,1fr)) }
.filtros-tab .ctrl{ width:100% }
.rolo-alto{ max-height:520px; overflow:auto; margin-bottom:0 }
.rolo-alto thead th{ position:sticky; top:0; z-index:1; background:var(--superficie, #F3F5F8) }
table.vendas th{ cursor:pointer; white-space:nowrap }
table.vendas tbody tr{ cursor:pointer }
table.vendas tbody tr.sel>td{ background:var(--acento-veu) }
table.vendas td.txt, table.vendas th:nth-child(2){ text-align:left }
table.escada td:first-child, table.escada th:first-child{ text-align:left }
table.escada tr.final td{ font-weight:650 }
.ext-g{ display:grid; gap:18px; grid-template-columns:minmax(260px,1fr) 2fr; position:relative }
@media(max-width:900px){ .ext-g{ grid-template-columns:1fr } }
.ext-g dl{ margin:0; display:grid; grid-template-columns:auto 1fr; gap:6px 14px; font-size:13px }
.ext-g dt{ color:var(--texto-2) } .ext-g dd{ margin:0; font-weight:600; text-align:right }
.aj{ list-style:none; margin:0; padding:0; font-size:13px }
.aj li{ display:grid; grid-template-columns:1fr 70px 90px; gap:10px; align-items:center;
  padding:4px 0; border-bottom:1px solid var(--grade) }
.aj .b{ height:6px; border-radius:3px; background:var(--grade); position:relative }
.aj .b i{ position:absolute; top:0; bottom:0; border-radius:3px }
.aj .b i.mais{ left:50%; background:var(--positivo) } .aj .b i.menos{ right:50%; background:var(--negativo) }
.aj .v{ text-align:right; font-variant-numeric:tabular-nums }
.rank .val.mais{ color:var(--positivo) } .rank .val.menos{ color:var(--negativo) }
.rank .barra i.menos{ background:var(--negativo) } .rank .barra i.mais{ background:var(--positivo) }
.abas{ display:flex; gap:6px; margin:0 0 4px; position:relative }
.aba{ font:inherit; font-size:13px; font-weight:600; padding:8px 14px; border-radius:999px; cursor:pointer;
  border:1px solid var(--grade); background:transparent; color:var(--texto-2) }
.aba[aria-selected="true"]{ background:var(--acento); color:var(--superficie, #fff); border-color:var(--acento) }
#pg-res, #pg-como{ display:flex; flex-direction:column; gap:var(--gap) }
#pg-res[hidden], #pg-como[hidden]{ display:none }
.texto p{ max-width:80ch; line-height:1.55; font-size:14px; margin:0 0 10px; position:relative }
.passos{ margin:0; padding-left:20px; line-height:1.55; font-size:14px; max-width:90ch; position:relative }
.passos li{ margin-bottom:8px }
.blocos{ display:grid; gap:14px; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); position:relative }
.bloco{ border:1px solid var(--grade); border-radius:12px; padding:12px 14px; position:relative }
.bloco h3, .exemplo h3{ font-size:14px; margin:0 0 6px }
.bloco p{ font-size:12.5px; color:var(--texto-2); margin:0 0 8px; line-height:1.45 }
.bloco-nao{ margin-top:14px; border-style:dashed }
.lista-tags{ list-style:none; margin:0; padding:0; display:flex; flex-wrap:wrap; gap:5px }
.lista-tags li{ font-size:11.5px; padding:2px 8px; border-radius:999px; background:var(--acento-veu); color:var(--texto) }
.exemplo{ margin-top:16px; padding-top:14px; border-top:1px solid var(--grade); position:relative }
a.pdf{ font-size:11.5px; font-weight:650; padding:2px 8px; border-radius:6px; text-decoration:underline;
  color:var(--texto); background:var(--acento-veu) }
</style>`;
tpl = tpl.replace('</head>', CSS + '\n</head>');

/* ── dados ────────────────────────────────────────────────────────────── */
const fin = R.escada[R.escada.length - 1];
const pesos = R.pesos.filter((p) => p[2] >= 30 && p[0] !== 'laudo PDF: lido');
const ALG = R.algoritmo_final === 'boost' ? 'gradient boosting' : 'regressão ridge';
const DADOS = {
  escada: R.escada.map((e) => ({ d: e.degrau, r: e.rotulo, t: e.teste, l: e.teste_laudo_lido, b: e.por_base })),
  final: fin.degrau,
  vend: R.nomes_vendedor || {},
  ad: R.antes_depois || null,
  pesos: pesos.slice(0, 14),
  /* só o lado "previu caro": o outro tem 18 vendas e nenhum indicador passa
     de p < 0,001. Câmbio e combustível ficam de fora — são composição da
     frota (o Manual está em 62% das bem previstas), não causa. */
  out: OUT ? {
    n: OUT.caro.n, nb: OUT.caro.n_bom, nbar: OUT.barato.n, taxa: OUT.caro.taxa_geral,
    cob: OUT.cobertura,
    ind: OUT.caro.indicadores.filter((t) => t.p < 0.001 && t.lift >= 1.8 &&
      !/^(câmbio|combustível|cor):/.test(t.ind) && !/^km: sem km/.test(t.ind)).slice(0, 14)
      .map((t) => [t.ind, t.n_out, t.pct_out, t.pct_bom, t.lift, t.taxa,
        /^(vendedor|VMV):/.test(t.ind) ? 0 : 1]),
  } : null,
  v: R.veiculos.map((v) => [v.b, v.id, v.g, v.v, v.a, v.k, v.uf, v.dt, v.f, v.prev, v.real,
    v.lido ? 1 : 0, v.base_modelo, v.ajustes, v.vmv, v.conf, v.faixa, v.laudo_url || null]),
  glossario: [
    ['O que o modelo prevê', 'A razão venda ÷ FIPE do anúncio (1 − deságio). O preço previsto é a FIPE vezes essa razão. Prever a razão faz um Gol e uma Hilux falarem a mesma língua.'],
    ['Como foi testado', 'Como seria usado: re-treinado todo mês só com as vendas anteriores, e cobrado nas vendas do mês seguinte. Julho foi previsto com dados até junho, agosto até julho, setembro até agosto. Nenhuma venda testada estava no treino do próprio mês.'],
    ['Por que não sorteio', 'Sortear vendas para o teste põe no treino carros do mesmo lote, evento e semana dos que estão sendo cobrados, e o acerto sai otimista. O corte por tempo é o que se teria no dia de precificar.'],
    ['Erro', '(previsto − vendido) ÷ vendido. Positivo: o modelo previu mais caro do que vendeu.'],
    ['Erro mediano', 'Metade das vendas errou menos que isso, metade mais. Não se deixa levar por meia dúzia de vendas muito fora.'],
    ['Dentro de ±10%', 'Quantas vendas tiveram previsão a até 10% do valor vendido, para mais ou para menos.'],
    ['Erro médio por carro', 'Média, em reais, da distância entre o previsto e o vendido.'],
    ['Viés', 'Média do erro com sinal. Perto de zero: o modelo erra para os dois lados por igual. Positivo: tende a prever caro. O viés de julho vem da queda de patamar da Dealers naquele mês (a razão saiu de 0,707 em junho para 0,673), que nenhum dado anterior anunciava.'],
    ['Índice de confiança', 'Chance estimada de a venda ficar a até 10% do preço previsto. Sai da largura da faixa provável, convertida em probabilidade com o acerto observado em maio e junho. Alta a partir de 80%, média de 70% a 80%, baixa abaixo de 70%.'],
    ['Faixa provável', 'Intervalo onde a venda deve cair em 8 de cada 10 casos, dado o que se sabe do carro.'],
    ['Laudo (PDF)', 'Link para o PDF do laudo cautelar na plataforma. Abre em outra aba.'],
    ['Venda disputada', 'Só entram vendas em que ' + R.corte.min_lojas + ' ou mais lojas diferentes deram lance — no treino e no teste. Com menos disputa o preço para no VMV: na Cars2You, 67% das vendas com 1 loja fecharam a até 2% do VMV, 33% com 2 lojas e 10% com 3; dali em diante fica em 5 a 6%. Ficaram de fora ' + Object.entries(R.corte.descartadas).map(([b, n]) => n.toLocaleString('pt-BR') + ' da ' + b).join(' e ') + '.'],
    ['Chute ingênuo', 'FIPE × razão média da base, sem olhar o carro. É a régua: o ganho sobre o chute é o quanto o modelo vale.'],
    ['Modelo do carro', 'Marca + modelo, normalizados — o mesmo grupo do painel de precificação. Modelo com poucas vendas tem a média puxada para a da base (encolhimento, k = 10).'],
    ['Blocos de informação', 'C: km, idade, UF do pátio, canal (whitelabel), categoria, faixa de FIPE e laudo do banco. D: os sinais do texto do anúncio (aba Observações do painel). E: os indicadores lidos do laudo em PDF (aba Laudo cautelar).'],
    ['Algoritmo', 'O preço da página sai de ' + ALG + ', escolhido numa validação separada (treino até abril, cobrança em maio e junho), antes de olhar o teste. A composição do preço e "o que mais move o preço" saem de uma regressão ridge com os mesmos dados, porque ela dá um peso legível por indicador; as duas previsões ficam próximas, não iguais.'],
    ['Temperatura do mercado', 'Ajuste que puxa a previsão para o nível dos últimos ' + R.dias_temperatura + ' dias. Foi testado na validação e piorou o acerto, então ficou de fora.'],
    ['VMV', 'Valor mínimo de venda informado pelo vendedor. Não entra no modelo, de propósito: o modelo existe para ser confrontado com ele. Vale quando está entre 20% e 150% da FIPE; na Dealers é 999.000 em 98% das vendas, então o confronto é praticamente só da Cars2You.'],
    ['Modelo × VMV × venda', 'As vendas com VMV válido, agrupadas pela distância entre o VMV e o preço do modelo. Mostra quem chegou mais perto do vendido quando os dois discordam.'],
    ['Modelo mais perto', 'Vendas em que |previsto − vendido| foi menor que |VMV − vendido|.'],
    ['Laudo lido', 'O PDF do laudo só foi lido num sorteio de 1.500 vendas por base, e só nos que tinham texto. Nas outras vendas o modelo trabalha sem os indicadores do laudo.'],
    ['Faixas da tabela', 'Até 10% de erro, de 10% a 20%, e acima de 20%.'],
  ],
};

const JS = `const DADOS = ${JSON.stringify(DADOS)};

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const nb = x => x == null ? '—' : Number(x).toLocaleString('pt-BR');
const rs = x => 'R$ ' + Math.round(x).toLocaleString('pt-BR');
const pc = (x, d) => x == null ? '—' : (x * 100).toFixed(d == null ? 1 : d).replace('.', ',') + '%';
const pp = x => (x >= 0 ? '+' : '−') + Math.abs(x * 100).toFixed(1).replace('.', ',') + ' p.p.';
const sg = x => (x >= 0 ? '+' : '−') + Math.abs(x * 100).toFixed(1).replace('.', ',') + '%';

/* as vendas testadas, com o erro já calculado */
const V = DADOS.v.map(a => ({ b:a[0], id:a[1], g:a[2], v:a[3], a:a[4], k:a[5], uf:a[6], dt:a[7],
  f:a[8], prev:a[9], real:a[10], lido:!!a[11], bm:a[12], aj:a[13], vmv:a[14], conf:a[15], fx:a[16], url:a[17], erro:(a[9]-a[10])/a[10] }));
const MESES = { '07':'julho', '08':'agosto', '09':'setembro' };
const CANAL = { 4:'Trucks2you', 5:'WL 5', 7:'Marketplace', 8:'Dealers Club', 43:'C6 Auto',
  48:'Colaboradores C6', 62:'Lance Fácil BTB', 65:'BTB Associados' };

/* "km=Cars2You:c 40 a 60k" -> "km 40 a 60k (Cars2You)" */
function rotulo(n){
  if (n.indexOf('texto: ') === 0) return 'Anúncio: ' + n.slice(7);
  if (n.indexOf('laudo PDF: ') === 0) return 'Laudo: ' + n.slice(11);
  const i = n.indexOf('='), c = n.slice(0, i); let v = n.slice(i + 1), b = '';
  const j = v.indexOf(':');
  if (j > 0 && (v.slice(0, j) === 'Cars2You' || v.slice(0, j) === 'Dealers')) { b = v.slice(0, j); v = v.slice(j + 1); }
  v = v.replace(/^[a-z] /, '');
  const T = { km:'km', idade:'idade', uf:'UF', categoria:'categoria', faixa_fipe:'FIPE',
    laudo_banco:'laudo no banco', lataria:'lataria com dano', cor:'cor', cambio:'câmbio',
    combustivel:'combustível', carroceria:'carroceria', patio:'pátio' };
  if (c === 'canal') return 'canal ' + (CANAL[v.replace('wl', '')] || v) + (b ? ' (' + b + ')' : '');
  if (c === 'vendedor') return 'vendedor ' + (DADOS.vend[b + ':' + v] || v) + (b ? ' (' + b + ')' : '');
  return (T[c] || c) + ' ' + v.replace(/_/g, ' ') + (b ? ' (' + b + ')' : '');
}

function mede(ls){
  if (!ls.length) return null;
  const ae = ls.map(x => Math.abs(x.erro)).sort((a, b) => a - b);
  const m = ae.length % 2 ? ae[(ae.length - 1) / 2] : (ae[ae.length / 2 - 1] + ae[ae.length / 2]) / 2;
  const s = f => ls.reduce((t, x) => t + f(x), 0) / ls.length;
  return { n: ls.length, med: m, d5: s(x => Math.abs(x.erro) <= .05 ? 1 : 0),
    d10: s(x => Math.abs(x.erro) <= .10 ? 1 : 0), d20: s(x => Math.abs(x.erro) <= .20 ? 1 : 0),
    mae: s(x => Math.abs(x.prev - x.real)), ema: s(x => Math.abs(x.erro)), vies: s(x => x.erro) };
}

let BASE = 'todas', ORD = { k: 'erro', dir: -1 }, SEL = null;
const daBase = () => V.filter(x => BASE === 'todas' || x.b === BASE);
const escadaDe = e => BASE === 'todas' ? e.t : e.b[BASE];

function pintaKpi(){
  const m = mede(daBase());
  $('#k-med').textContent = pc(m.med);
  $('#k-med-d').textContent = 'em ' + nb(m.n) + ' vendas testadas';
  $('#k-med-pe').innerHTML = '<div><dt>Erro médio</dt><dd class="num">' +
    pc(m.ema) + '</dd></div>' +
    '<div><dt>Viés</dt><dd class="num">' + sg(m.vies) + '</dd></div>';
  $('#k-d10').textContent = pc(m.d10, 0);
  $('#k-d10-d').textContent = 'das vendas, previsão a até 10%';
  $('#k-d10-pe').innerHTML = '<div><dt>±5%</dt><dd class="num">' + pc(m.d5, 0) + '</dd></div>' +
    '<div><dt>±20%</dt><dd class="num">' + pc(m.d20, 0) + '</dd></div>';
  $('#k-mae').textContent = rs(m.mae);
  $('#k-mae-d').textContent = 'entre previsto e vendido';
  const preco = daBase().reduce((t, x) => t + x.real, 0) / m.n;
  $('#k-mae-pe').innerHTML = '<div><dt>Preço médio</dt><dd class="num">' + rs(preco) + '</dd></div>';
  const A = escadaDe(DADOS.escada[0]), F = escadaDe(DADOS.escada[DADOS.escada.length - 1]);
  $('#k-ganho').textContent = '−' + ((A.erro_mediano - F.erro_mediano) * 100).toFixed(1).replace('.', ',') + ' p.p.';
  const d = $('#k-ganho-d'); d.className = 'kpi-delta sobe';
  d.innerHTML = '<span aria-hidden="true">▼</span> erro mediano de ' + pc(A.erro_mediano) + ' para ' + pc(F.erro_mediano);
  $('#k-ganho-pe').innerHTML = '<div><dt>±10%, chute</dt><dd class="num">' + pc(A.dentro_10, 0) + '</dd></div>' +
    '<div><dt>±10%, modelo</dt><dd class="num">' + pc(F.dentro_10, 0) + '</dd></div>';
}

/* dispersão: densa por natureza, então eixo com grade e sem rótulo (regra 3) */
function pintaDisp(){
  const ls = daBase(), W = 800, H = 400, L = 62, Rr = 14, T = 12, B = 34;
  const iw = W - L - Rr, ih = H - T - B;
  const vs = ls.map(x => x.real).concat(ls.map(x => x.prev)).sort((a, b) => a - b);
  /* passo redondo: o eixo diz "50 mil", nunca "47 mil" */
  const bruto = vs[Math.floor(vs.length * .99)] * 1.05;
  const passo = [10000, 20000, 25000, 50000, 100000].find(s => s * 4 >= bruto) || 100000;
  const max = Math.ceil(bruto / passo) * passo;
  const x = v => L + iw * Math.min(v, max) / max, y = v => T + ih - ih * Math.min(v, max) / max;
  const p = [];
  for (let v = 0; v <= max; v += passo){
    p.push('<line class="linha-grade" x1="' + L + '" y1="' + y(v).toFixed(1) + '" x2="' + (W - Rr) + '" y2="' + y(v).toFixed(1) + '"/>');
    p.push('<text class="eixo" x="' + (L - 8) + '" y="' + (y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + Math.round(v / 1000) + ' mil</text>');
    p.push('<text class="eixo" x="' + x(v).toFixed(1) + '" y="' + (H - 16) + '" text-anchor="middle">' + Math.round(v / 1000) + ' mil</text>');
  }
  /* ±10%: a borda de cima (previsto = 1,1 × vendido) bate no teto em max/1,1 */
  p.push('<path class="faixa10" d="M' + x(0) + ' ' + y(0) + ' L' + x(max / 1.1).toFixed(1) + ' ' + y(max) +
    ' L' + x(max) + ' ' + y(max) + ' L' + x(max) + ' ' + y(max * .9).toFixed(1) + ' Z"/>');
  p.push('<line class="diag" x1="' + x(0) + '" y1="' + y(0) + '" x2="' + x(max) + '" y2="' + y(max) + '"/>');
  ls.forEach(v => p.push('<circle class="pt ' + v.b + '" cx="' + x(v.real).toFixed(1) + '" cy="' + y(v.prev).toFixed(1) + '" r="2.4"/>'));
  p.push('<text class="eixo" x="' + (L + iw / 2) + '" y="' + (H - 1) + '" text-anchor="middle">vendido</text>');
  p.push('<text class="eixo" x="12" y="' + (T + ih / 2) + '" text-anchor="middle" transform="rotate(-90 12 ' + (T + ih / 2) + ')">previsto</text>');
  if (BASE === 'todas'){
    p.push('<circle class="pt" cx="' + (L + 14) + '" cy="' + (T + 10) + '" r="4"/><text class="leg" x="' + (L + 24) + '" y="' + (T + 14) + '">Cars2You</text>');
    p.push('<circle class="pt Dealers" cx="' + (L + 104) + '" cy="' + (T + 10) + '" r="4"/><text class="leg" x="' + (L + 114) + '" y="' + (T + 14) + '">Dealers</text>');
  }
  $('#disp').innerHTML = p.join('');
  $('#disp-n').textContent = nb(ls.length) + ' vendas';
}

function pintaMes(){
  const ls = daBase();
  $('#tab-mes').innerHTML = Object.keys(MESES).map(m => {
    const r = mede(ls.filter(x => x.dt.slice(5, 7) === m));
    return r ? '<tr><td>' + MESES[m] + '</td><td class="num">' + nb(r.n) + '</td><td class="num">' + pc(r.med) +
      '</td><td class="num">' + pc(r.d10, 0) + '</td><td class="num">' + sg(r.vies) + '</td></tr>' : '';
  }).join('');
  $('#nota-mes').textContent = 'Cada mês foi previsto só com as vendas anteriores a ele.';
}

function pintaEscada(){
  $('#tab-escada').innerHTML = DADOS.escada.map(e => {
    const t = escadaDe(e), l = BASE === 'todas' ? e.l : null;
    return '<tr' + (e.d === DADOS.final ? ' class="final"' : '') + '><td>' + e.d + ' · ' + esc(e.r) + '</td>' +
      '<td class="num">' + pc(t.erro_mediano) + '</td><td class="num">' + pc(t.dentro_10, 0) + '</td>' +
      '<td class="num">' + rs(t.mae_reais) + '</td><td class="num">' + sg(t.vies) + '</td>' +
      '<td class="num">' + (l ? pc(l.erro_mediano) : '—') + '</td></tr>';
  }).join('');
}

function pintaPesos(){
  const max = Math.max(...DADOS.pesos.map(p => Math.abs(p[1])));
  $('#rank-pesos').innerHTML = DADOS.pesos.map((p, i) => {
    const c = p[1] >= 0 ? 'mais' : 'menos';
    return '<li><span class="pos num">' + (i + 1) + '</span><span><span class="nome">' + esc(rotulo(p[0])) +
      '</span><span class="barra"><i class="' + c + '" style="width:' + (100 * Math.abs(p[1]) / max).toFixed(1) + '%"></i></span></span>' +
      '<span class="val num ' + c + '" title="' + nb(p[2]) + ' vendas no treino">' + pp(p[1]) + '</span></li>';
  }).join('');
}

function filtradas(){
  const q = ($('#busca').value || '').trim().toLowerCase(), fe = $('#f-erro').value, fl = $('#f-laudo').value;
  return daBase().filter(x => {
    const ae = Math.abs(x.erro);
    if (fe === 'ok' && ae > .10) return false;
    if (fe === 'atencao' && (ae <= .10 || ae > .20)) return false;
    if (fe === 'ruim' && ae <= .20) return false;
    if (fl && !x.lido) return false;
    const fv = $('#f-vmv').value;
    if (fv === 'sem' && x.vmv) return false;
    if (fv === 'acima' && !(x.vmv && x.vmv / x.prev - 1 > .15)) return false;
    if (fv === 'abaixo' && !(x.vmv && x.vmv / x.prev - 1 < -.15)) return false;
    return !q || (x.g + ' ' + x.v + ' ' + x.id + ' ' + x.uf).toLowerCase().indexOf(q) >= 0;
  });
}

const LIM = 300;
function pintaTabela(){
  const ls = filtradas().sort((p, q) => {
    const a = ORD.k === 'erro' ? Math.abs(p.erro) : p[ORD.k], b = ORD.k === 'erro' ? Math.abs(q.erro) : q[ORD.k];
    if (a == null || a === '') return 1; if (b == null || b === '') return -1;
    return typeof a === 'string' ? ORD.dir * a.localeCompare(b) : ORD.dir * (a - b);
  });
  window._ls = ls;
  $('#tab-vendas').innerHTML = ls.slice(0, LIM).map((x, i) => {
    const ae = Math.abs(x.erro), t = ae <= .10 ? 'ok' : ae <= .20 ? 'atencao' : 'ruim';
    return '<tr data-i="' + i + '"' + (SEL === x ? ' class="sel"' : '') + '><td>' + esc(x.b) + '</td>' +
      '<td class="txt">' + esc(x.g) + '<br><span class="nota">' + esc(x.v) + ' · id ' + esc(x.id) + '</span></td>' +
      '<td class="num">' + esc(x.a) + '</td><td class="num">' + nb(x.k) + '</td><td>' + esc(x.uf) + '</td>' +
      '<td class="num">' + x.dt.split('-').reverse().join('/') + '</td><td class="num">' + rs(x.f) + '</td>' +
      '<td class="num">' + rs(x.prev) + '</td><td>' + tagConf(x.conf) + '</td>' +
      '<td class="num">' + (x.vmv ? rs(x.vmv) : '—') + '</td><td class="num">' + rs(x.real) + '</td>' +
      '<td><span class="tag ' + t + '">' + sg(x.erro) + '</span></td><td>' + linkLaudo(x) + '</td></tr>';
  }).join('') || '<tr><td colspan="13">nenhuma venda com esse filtro</td></tr>';
  $('#tab-n').textContent = nb(ls.length) + ' vendas';
  $('#tab-mais').textContent = ls.length > LIM ? 'Mostrando ' + LIM + ' de ' + nb(ls.length) +
    ' — refine a busca ou baixe o CSV para ver todas.' : '';
}

function pintaExtrato(x){
  SEL = x;
  const soma = x.bm + x.aj.reduce((t, a) => t + a[1], 0);
  const max = Math.max(.01, ...x.aj.map(a => Math.abs(a[1])));
  $('#ext-tag').textContent = x.b + ' · id ' + x.id;
  $('#ext-corpo').innerHTML = '<div class="ext-g"><dl>' +
    '<dt>Veículo</dt><dd>' + esc(x.g) + '</dd><dt>Versão</dt><dd>' + esc(x.v) + '</dd>' +
    '<dt>Ano · km · UF</dt><dd>' + esc(x.a) + ' · ' + nb(x.k) + ' · ' + esc(x.uf) + '</dd>' +
    '<dt>FIPE do anúncio</dt><dd class="num">' + rs(x.f) + '</dd>' +
    '<dt>Ponto de partida do modelo</dt><dd class="num">' + pc(x.bm) + ' da FIPE</dd>' +
    '<dt>Somando os ajustes</dt><dd class="num">' + pc(soma) + ' · ' + rs(x.f * soma) + '</dd>' +
    '<dt>Preço previsto</dt><dd class="num">' + rs(x.prev) + '</dd>' +
    '<dt>Faixa provável</dt><dd class="num">' + rs(x.fx[0]) + ' a ' + rs(x.fx[1]) + '</dd>' +
    '<dt>Confiança</dt><dd>' + tagConf(x.conf) + '</dd>' +
    '<dt>Laudo</dt><dd>' + linkLaudo(x) + '</dd>' +
    '<dt>VMV informado</dt><dd class="num">' + (x.vmv ? rs(x.vmv) + ' (' + sg(x.vmv / x.prev - 1) + ' do previsto)' : '—') + '</dd>' +
    '<dt>Vendido por</dt><dd class="num">' + rs(x.real) + ' (' + sg(x.erro) + ')</dd>' +
    '<dt>Laudo em PDF</dt><dd>' + (x.lido ? 'lido' : 'não lido') + '</dd></dl>' +
    '<div><ul class="aj">' + (x.aj.map(a => {
      const c = a[1] >= 0 ? 'mais' : 'menos', w = (50 * Math.abs(a[1]) / max).toFixed(1);
      return '<li><span>' + esc(rotulo(a[0])) + '</span><span class="b"><i class="' + c + '" style="width:' + w + '%"></i></span>' +
        '<span class="v">' + pp(a[1]) + '</span></li>';
    }).join('') || '<li>nenhum ajuste relevante</li>') + '</ul>' +
    '<p class="nota">O ponto de partida é a média do modelo do carro. Os ajustes vêm da regressão ridge; o preço previsto, do ' +
    (DADOS.final === 'F' ? 'gradient boosting' : 'mesmo modelo') + ' — por isso a soma e o previsto podem diferir um pouco.</p></div></div>';
  pintaTabela();
}

/* calculado sobre as duas bases juntas: com 157 outliers, recortar por base
   deixaria a maior parte dos indicadores abaixo de 8 casos */
function pintaOut(){
  const O = DADOS.out;
  if (!O) { $('#tab-out').innerHTML = '<tr><td colspan="6">rode preditivo/outliers.py</td></tr>'; return; }
  $('#out-n').textContent = O.n + ' vendas com erro acima de +20%';
  $('#tab-out').innerHTML = O.ind.map(t => '<tr><td>' + esc(t[0]) + '</td>' +
    '<td class="num">' + nb(t[1]) + ' · ' + pc(t[2], 0) + '</td><td class="num">' + pc(t[3], 0) + '</td>' +
    '<td class="num"><b>' + t[4].toFixed(1).replace('.', ',') + '×</b></td><td class="num">' + pc(t[5], 0) + '</td>' +
    '<td>' + (t[6] ? '<span class="tag neutro">sim</span>' : '<span class="tag atencao">não</span>') + '</td></tr>').join('');
  $('#out-nota').textContent = 'Outlier aqui é a venda que o modelo previu mais de 20% acima do valor vendido (' +
    pc(O.taxa) + ' das vendas testadas, nas duas bases). O lado oposto, previsto mais de 20% abaixo, tem só ' + O.nbar +
    ' vendas e nenhum indicador se destaca. Só entram indicadores com teste exato de Fisher p < 0,001. Os ofensores são o ' +
    'mesmo perfil de carro (retomado por banco, sem chave, sem motor, sem km lido, laudo reprovado): ' + pc(O.cob.out, 0) +
    ' dos outliers têm ao menos um, contra ' + pc(O.cob.bom, 0) + ' das bem previstas.';
}

/* O confronto que é a razão do projeto. O VMV não entra no modelo; aqui ele é
   posto ao lado do preço do modelo e do vendido. */
const FX_VMV = [['mais de 15% abaixo do modelo', -9, -.15], ['5% a 15% abaixo', -.15, -.05],
  ['dentro de ±5% do modelo', -.05, .05], ['5% a 15% acima', .05, .15], ['mais de 15% acima do modelo', .15, 9]];
function mediana(a){ a = a.slice().sort((p, q) => p - q); const n = a.length;
  return n ? (n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2) : null; }
function pintaVmv(){
  const ls = daBase().filter(x => x.vmv);
  $('#vmv-n').textContent = nb(ls.length) + ' vendas com VMV';
  if (ls.length < 30) {
    $('#vmv-kpi').innerHTML = '';
    $('#tab-vmv').innerHTML = '<tr><td colspan="8">Só ' + ls.length + ' vendas com VMV válido nesta seleção — na Dealers o VMV é valor fixo (999.000).</td></tr>';
    $('#vmv-nota').textContent = ''; return;
  }
  const em = f => mediana(ls.map(x => Math.abs(f(x) - x.real) / x.real));
  const perto = s => s.filter(x => Math.abs(x.prev - x.real) < Math.abs(x.vmv - x.real)).length / s.length;
  $('#vmv-kpi').innerHTML =
    '<div><dt>Erro mediano do modelo</dt><dd class="num">' + pc(em(x => x.prev)) + '</dd></div>' +
    '<div><dt>Erro mediano do VMV</dt><dd class="num">' + pc(em(x => x.vmv)) + '</dd></div>' +
    '<div><dt>Modelo mais perto</dt><dd class="num">' + pc(perto(ls), 0) + '</dd></div>' +
    '<div><dt>Vendeu abaixo do VMV</dt><dd class="num">' + pc(ls.filter(x => x.real < x.vmv).length / ls.length, 0) + '</dd></div>';
  $('#tab-vmv').innerHTML = FX_VMV.map(([rot, a, b]) => {
    const s = ls.filter(x => { const d = x.vmv / x.prev - 1; return d >= a && d < b; });
    if (!s.length) return '';
    const pm = perto(s), tag = s.length < 30 ? '' : pm >= .55 ? ' ok' : pm <= .45 ? ' atencao' : '';
    return '<tr><td>' + rot + '</td><td class="num">' + nb(s.length) + '</td>' +
      '<td class="num">' + mediana(s.map(x => x.real / x.prev)).toFixed(3).replace('.', ',') + '</td>' +
      '<td class="num">' + mediana(s.map(x => x.real / x.vmv)).toFixed(3).replace('.', ',') + '</td>' +
      '<td class="num">' + pc(mediana(s.map(x => Math.abs(x.prev - x.real) / x.real))) + '</td>' +
      '<td class="num">' + pc(mediana(s.map(x => Math.abs(x.vmv - x.real) / x.real))) + '</td>' +
      '<td><span class="tag' + tag + '">' + pc(pm, 0) + '</span></td>' +
      '<td class="num">' + pc(s.filter(x => x.real < x.vmv).length / s.length, 0) + '</td></tr>';
  }).join('');
  /* a leitura é escrita em cima do dado, não fixa: o corte de disputa já
     inverteu uma conclusão inteira (com todas as vendas o VMV empatava) */
  const acima = ls.filter(x => x.vmv / x.prev - 1 > .15), abaixo = ls.filter(x => x.vmv / x.prev - 1 < -.15);
  const leitura = s => s.length < 15 ? '' : pc(s.filter(x => x.real < x.vmv).length / s.length, 0) +
    ' venderam abaixo do VMV e o modelo chegou mais perto em ' + pc(perto(s), 0);
  $('#vmv-nota').textContent = 'O VMV não entra no modelo: os dois são estimativas independentes do mesmo preço, e só ' +
    'entram vendas disputadas — sem disputa a venda para no VMV e o confronto ficaria viciado a favor dele. ' +
    (leitura(acima) ? 'Com o VMV mais de 15% acima do modelo, ' + leitura(acima) + '. ' : '') +
    (leitura(abaixo) ? 'Com o VMV mais de 15% abaixo, ' + leitura(abaixo) + '. ' : '') +
    'Verde: o modelo chegou mais perto em 55% ou mais; vinho: o VMV, em 55% ou mais.';
}

/* confiança: alta >= 80%, média >= 70%, baixa abaixo. Os cortes acompanham a
   escala do índice calibrado, que vai de ~57% a ~97% */
function nivelConf(c){ return c >= .8 ? ['ok', 'alta'] : c >= .7 ? ['', 'média'] : ['atencao', 'baixa']; }
function tagConf(c){ const n = nivelConf(c);
  return '<span class="tag ' + n[0] + '" title="confiança ' + n[1] + '">' + pc(c, 0) + '</span>'; }
/* o PDF mora no CDN da plataforma; abre em outra aba (download entre domínios
   não é garantido pelo navegador) */
function linkLaudo(x){
  return x.url ? '<a class="pdf" href="' + esc(x.url) + '" target="_blank" rel="noopener" download ' +
    'title="Baixar o laudo cautelar em PDF" onclick="event.stopPropagation()">PDF</a>' : '<span class="nota">—</span>';
}

function pintaCalib(){
  const ls = daBase();
  $('#tab-calib').innerHTML = [['baixa', 0, .7], ['média', .7, .8], ['alta', .8, 2]].map(([r, a, b]) => {
    const s = ls.filter(x => x.conf >= a && x.conf < b);
    if (!s.length) return '';
    const m = f => s.reduce((t, x) => t + f(x), 0) / s.length;
    return '<tr><td>' + tagConf(m(x => x.conf)).replace(/>[^<]*</, '>' + r + '<') + '</td><td class="num">' + nb(s.length) + '</td>' +
      '<td class="num">' + pc(m(x => x.conf), 0) + '</td><td class="num"><b>' + pc(m(x => Math.abs(x.erro) <= .1 ? 1 : 0), 0) + '</b></td>' +
      '<td class="num">' + pc(mediana(s.map(x => Math.abs(x.erro)))) + '</td>' +
      '<td class="num">' + pc(m(x => x.real >= x.fx[0] && x.real <= x.fx[1] ? 1 : 0), 0) + '</td></tr>';
  }).join('');
}

/* exemplo da página 2: uma venda real, bem prevista, com laudo lido e ajustes
   suficientes para ilustrar. Escolha determinística: a de maior FIPE entre elas. */
function pintaExemplo(){
  const c = V.filter(x => x.lido && Math.abs(x.erro) <= .05 && x.aj.length >= 5)
    .sort((a, b) => b.f - a.f)[0] || V[0];
  const soma = c.bm + c.aj.reduce((t, a) => t + a[1], 0);
  $('#exemplo').innerHTML = '<h3>Exemplo: ' + esc(c.g) + ' ' + esc(c.v) + ' · ' + esc(c.a) + ' · ' + nb(c.k) + ' km · ' + esc(c.uf) + '</h3>' +
    '<div class="ext-g"><dl>' +
    '<dt>FIPE do anúncio</dt><dd class="num">' + rs(c.f) + '</dd>' +
    '<dt>1. Ponto de partida (modelo do carro)</dt><dd class="num">' + pc(c.bm) + ' da FIPE</dd>' +
    '<dt>2. Ajustes somados</dt><dd class="num">' + pp(soma - c.bm) + '</dd>' +
    '<dt>3. Preço previsto</dt><dd class="num"><b>' + rs(c.prev) + '</b></dd>' +
    '<dt>4. Faixa provável</dt><dd class="num">' + rs(c.fx[0]) + ' a ' + rs(c.fx[1]) + '</dd>' +
    '<dt>Confiança</dt><dd>' + tagConf(c.conf) + '</dd>' +
    '<dt>Vendido por</dt><dd class="num">' + rs(c.real) + ' (' + sg(c.erro) + ')</dd></dl>' +
    '<div><ul class="aj">' + c.aj.slice(0, 8).map(a => {
      const cl = a[1] >= 0 ? 'mais' : 'menos', w = (50 * Math.abs(a[1]) / Math.max(...c.aj.map(z => Math.abs(z[1])))).toFixed(1);
      return '<li><span>' + esc(rotulo(a[0])) + '</span><span class="b"><i class="' + cl + '" style="width:' + w + '%"></i></span><span class="v">' + pp(a[1]) + '</span></li>';
    }).join('') + '</ul><p class="nota">Os ajustes mostrados vêm da versão linear do modelo, que dá um peso legível por ' +
    'característica; o preço sai do gradient boosting, por isso a soma e o previsto ficam próximos, não iguais.</p></div></div>';
}

function abre(pg){
  document.querySelectorAll('.aba').forEach(b => b.setAttribute('aria-selected', b.dataset.pg === pg ? 'true' : 'false'));
  $('#pg-res').hidden = pg !== 'res'; $('#pg-como').hidden = pg !== 'como';
}
document.querySelectorAll('.aba').forEach(b => b.addEventListener('click', () => {
  abre(b.dataset.pg); history.replaceState(null, '', b.dataset.pg === 'como' ? '#como' : '#');
}));
const pelaUrl = () => abre(location.hash === '#como' ? 'como' : 'res');
window.addEventListener('hashchange', pelaUrl);
pelaUrl();

/* antes x depois: o modelo anterior (20 modelos, sem os blocos novos) contra o
   atual, nas MESMAS vendas do teste anterior -- a unica comparacao justa */
if (DADOS.ad) {
  const a = DADOS.ad.antes, d = DADOS.ad.depois;
  $('#nota-ad').innerHTML = ' Contra o modelo anterior, nas mesmas ' + nb(a.n) + ' vendas do teste anterior: erro mediano de ' +
    pc(a.erro_mediano) + ' para <b>' + pc(d.erro_mediano) + '</b>, a até 10% de ' + pc(a.dentro_10, 0) + ' para <b>' +
    pc(d.dentro_10, 0) + '</b>, erro médio por carro de ' + rs(a.mae_reais) + ' para <b>' + rs(d.mae_reais) + '</b>.';
}

function tudo(){ pintaKpi(); pintaDisp(); pintaMes(); pintaEscada(); pintaVmv(); pintaCalib(); pintaTabela(); }

$('#f-base').addEventListener('change', e => { BASE = e.target.value; tudo(); });
['#busca', '#f-erro', '#f-laudo', '#f-vmv'].forEach(s => $(s).addEventListener('input', pintaTabela));
$('#tab-vendas').addEventListener('click', e => {
  const tr = e.target.closest('tr'); if (!tr || tr.dataset.i == null) return;
  pintaExtrato(window._ls[Number(tr.dataset.i)]);
});
document.querySelectorAll('table.vendas th').forEach(th => th.addEventListener('click', () => {
  const k = th.dataset.k;
  ORD = { k: k, dir: ORD.k === k ? -ORD.dir : (k === 'g' || k === 'b' || k === 'uf' ? 1 : -1) };
  pintaTabela();
}));
$('#b-csv').addEventListener('click', () => {
  const cab = ['base','veiculo_id','modelo','versao','ano_modelo','km','uf','data_venda','fipe','previsto','faixa_min','faixa_max','confianca_pct','vmv','vendido','erro_pct','laudo_lido','laudo_pdf'];
  const linhas = [cab.join(';')].concat(filtradas().map(x => [x.b, x.id, x.g, x.v, x.a, x.k == null ? '' : x.k, x.uf, x.dt,
    x.f.toFixed(2).replace('.', ','), x.prev.toFixed(2).replace('.', ','), x.fx[0].toFixed(2).replace('.', ','), x.fx[1].toFixed(2).replace('.', ','), Math.round(x.conf * 100), x.vmv ? x.vmv.toFixed(2).replace('.', ',') : '', x.real.toFixed(2).replace('.', ','),
    (x.erro * 100).toFixed(2).replace('.', ','), x.lido ? 'sim' : 'nao', x.url || '']
    .map(c => { c = String(c); return /[;"]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(';')));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\\uFEFF' + linhas.join('\\r\\n')], { type: 'text/csv;charset=utf-8;' }));
  a.download = 'previsto-x-vendido-' + BASE + '.csv'; a.click();
});

$('#gloss-lista').innerHTML = DADOS.glossario.map(([t, d]) => '<dt>' + esc(t) + '</dt><dd>' + esc(d) + '</dd>').join('');
$('#gloss-n').textContent = DADOS.glossario.length + ' termos';

pintaPesos(); pintaOut(); pintaExemplo(); tudo();
`;

/* troca o bloco de dados e a renderização do modelo, até o comentário do TEMA */
const iDados = tpl.indexOf('const DADOS = {');
const iTema = tpl.lastIndexOf('/* ====', tpl.indexOf('TEMA — o arquivo nasce'));
if (iDados < 0 || iTema < iDados) throw new Error('não achei o bloco de dados do modelo');
tpl = tpl.slice(0, iDados) + JS.replace(/<\/script/gi, '<\\/script') + '\n' + tpl.slice(iTema);
/* o modelo calcula o $ dele; o nosso já declara */
if ((tpl.match(/const \$ = /g) || []).length !== 1) throw new Error('$ declarado mais de uma vez');
if (/__[A-Z_]+__/.test(tpl)) throw new Error('sobrou marcador do modelo');
if (/src="https?:|href="https?:\/\/(?!www)/.test(tpl)) throw new Error('requisição de rede no relatório');

const saida = path.join(AQUI, 'relatorio-preditivo.html');
fs.writeFileSync(saida, tpl, 'utf8');
console.log('relatorio-preditivo.html  ' + (fs.statSync(saida).size / 1024).toFixed(0) + ' KB · ' +
  R.veiculos.length + ' vendas testadas · modelo final ' + fin.degrau + ' (' + ALG + ')');
