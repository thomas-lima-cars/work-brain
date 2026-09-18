/* PAINEL DE PRECIFICAÇÃO — duas análises, duas telas, um arquivo.
 *
 * Uso: node monta-painel.js <painel-dados.json> [saida.html]
 *
 * Tela 1 — CAMPOS DO SISTEMA: km, idade, UF do pátio e laudo cautelar.
 * Tela 2 — OBSERVAÇÕES DO VEÍCULO: os sinais de `vehicles.description`,
 *          agrupados por contexto, com o analítico e o texto do anúncio.
 *
 * Um seletor de base no topo vale para as DUAS telas: Ambas, Cars2You,
 * Dealers. Cada tela tem seu próprio glossário — as duas medem coisas
 * diferentes, e um glossário só obrigaria a garimpar.
 *
 * ── O QUE MUDOU EM 17/09, DEPOIS DA CONEXÃO DIRETA ──────────────────────
 * Antes a Cars2You vinha do MCP com 39 colunas: faltavam `descricao` e
 * `laudo`. A tela 2 media a Cars2You por CÉLULA (modelo × texto), com t
 * aproximado e sem analítico para clicar. Agora as duas bases saem do mesmo
 * script com as mesmas 41 colunas: sinais linha a linha, t exato e analítico
 * nas duas.
 *
 * ── "NÃO CONSTA NA BASE" ────────────────────────────────────────────────
 * Sinal ou nível ausente numa base sai com essa frase, nunca com 0. Zero
 * diria "medi e deu zero" — afirmação diferente, e mais forte.
 *
 * ── O CONTROLE É POR (base, modelo) ─────────────────────────────────────
 * Um Gol da Cars2You e um da Dealers são operações diferentes. Num grupo só,
 * a diferença ENTRE as bases vazaria para dentro do efeito de km e idade.
 *
 * O Bootstrap vai EMBUTIDO (CSS e JS), vendorizado em `vendor/`. A página
 * funciona offline inteira — inclusive as abas e o glossário, que dependem do
 * JS dele. Custa ~300 KB num arquivo de 10 MB.
 */
const fs = require('fs');
const path = require('path');

const entrada = process.argv[2];
const saida = process.argv[3] || path.join(process.cwd(), 'painel-precificacao.html');
if (!entrada) throw new Error('uso: node monta-painel.js <painel-dados.json> [saida.html]');

const D = JSON.parse(fs.readFileSync(entrada, 'utf8'));
const CORTE = D.corte_t;

/* ── Bootstrap embutido, para a página funcionar offline ─────────────────
   Antes vinha de CDN e sem rede a página perdia o grid E as abas — o JS do
   Bootstrap é quem troca de aba e abre o glossário.
   Os dois arquivos ficam vendorizados em `vendor/`, baixados uma vez de
   cdn.jsdelivr.net/npm/bootstrap@5.3.3. Não editar: para atualizar, baixar
   de novo.
   ⚠️ O conteúdo NÃO pode entrar no template literal: o bundle minificado tem
   crases e ${...} próprios, que encerrariam a string. Entra por placeholder,
   depois, com função de substituição — `String.replace` com texto interpreta
   $&, $' e $` no que for inserido, e o bundle tem cifrões. */
const VENDOR = path.join(__dirname, 'vendor');
function leVendor(nome) {
  const p = path.join(VENDOR, nome);
  if (!fs.existsSync(p)) {
    throw new Error('falta ' + p + '\nBaixe uma vez:\n  curl -sSL ' +
      'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/' +
      (nome.endsWith('.css') ? 'css/' : 'js/') + nome + ' -o ' + p);
  }
  const txt = fs.readFileSync(p, 'utf8');
  /* o banner do CSS traz "Bootstrap  v5.3.3" com DOIS espaços e o do JS com
     um só — daí o \s+, e não a string literal */
  if (!/Bootstrap\s+v5\.3\.3/.test(txt)) {
    throw new Error(nome + ' não parece o Bootstrap 5.3.3 — conferir o arquivo');
  }
  /* um </script> no meio do conteúdo fecharia a tag antes da hora */
  return txt.replace(/<\/script/gi, '<\\/script');
}
const BS_CSS = leVendor('bootstrap.min.css');
const BS_JS = leVendor('bootstrap.bundle.min.js');
const esc = (s) => String(s === null || s === undefined ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* escala comum a cada tela, olhando TODAS as bases: senão trocar de base
   mudaria o tamanho das barras e a comparação visual mentiria */
let MAX1 = 0;
D.campos.forEach((c) => Object.keys(c.por_base).forEach((b) =>
  c.por_base[b].forEach((x) => { MAX1 = Math.max(MAX1, Math.abs(x.efeito)); })));
let MAX2 = 0;
D.sinais.forEach((s) => Object.keys(s.por_base).forEach((b) => {
  if (s.por_base[b]) MAX2 = Math.max(MAX2, Math.abs(s.por_base[b].efeito));
}));

const GLOSS_CAMPOS = [
  ['Deságio', 'Quanto o carro saiu abaixo da tabela FIPE. <code>1 − (valor da venda ÷ FIPE do anúncio)</code>. Deságio de 30% quer dizer que saiu por 70% da tabela.'],
  ['Venda', 'Veículo cuja <b>última</b> linha válida em <code>advertisement_negotiations</code> tem status 2, 3 ou 7. "Última" por <code>MAX(an.id)</code>, não por data — <code>finish_date_offer</code> tem registro em 1969 e em 2030.'],
  ['Valor da venda', '<code>offers.price</code>, alcançado por <code>an.offer_actual_id</code>. Não <code>value_actual</code>: essa está preenchida em 72.346 das 72.354 negociações "Sem Ofertas".'],
  ['FIPE', '<code>advertisements.fipe_price</code> — a do anúncio, contemporânea da oferta, e não a de <code>vehicles</code>, que é menos preenchida.'],
  ['Modelo (grupo)', 'Marca + nome do modelo, normalizados. Não <code>model_id</code>: o catálogo reparte o mesmo modelo em ids diferentes — pelo menos 50 nomes assim. Por id, a Strada viraria dois grupos.'],
  ['Efeito', 'Diferença em pontos percentuais <b>depois de descontar a média do próprio modelo, na própria base</b>. É o que sobra quando se compara carro parecido com carro parecido.'],
  ['Por que o controle é (base, modelo)', 'Um Gol da Cars2You e um da Dealers são vendidos em operações diferentes. Num grupo só, a diferença entre as bases vazaria para dentro do efeito de km e idade.'],
  ['Idade', '<code>ano da venda − ano do modelo</code>. Pode dar 0 ou negativo em carro de modelo futuro.'],
  ['UF do pátio', '<code>shop_stocks.state</code> — onde o carro está guardado, não onde a loja tem sede.'],
  ['Laudo cautelar', '<code>vehicle_precautionary_reports.situation</code>, pré-agregado por veículo com <code>MAX</code> para garantir uma linha só.'],
  ['O negrito', 'A coluna <code>t</code> saiu da tela a pedido, mas o critério continua: <b>linha em negrito passou no corte estatístico</b> (|t| ≥ ' + String(CORTE).replace('.', ',') + '); o resto é pista, não afirmação.'],
  ['O que o t media', 'Quantas vezes a diferença encontrada é maior que a variação natural de uma amostra daquele tamanho. Depende de <b>duas</b> coisas: o tamanho do efeito e <b>quantas vendas o sustentam</b>. No estudo, <code>estofado</code> (44 vendas, +5,8 p.p.) e <code>para-choque</code> (3.377 vendas, +1,0 p.p.) têm a MESMA confiança — o efeito é seis vezes maior num, o volume é setenta vezes maior no outro.'],
  ['Por que o corte é ' + String(CORTE).replace('.', ',') + ' e não 2', 'Testando dezenas de sinais contra o mesmo alvo, alguns passariam de 2 por puro azar. A correção de Bonferroni sobe a régua na proporção do número de testes.'],
  ['Efeito grande não é efeito confiável', 'E o contrário também: com volume alto dá para detectar diferença pequena com segurança. <code>Sem manual</code> passa no corte com apenas +0,9 p.p. Detectável e relevante são coisas diferentes — leia o efeito junto com o negrito.'],
  ['Amostra', '20 modelos mais vendidos <b>de cada base</b>, 12 meses, sem motos e pesados, razão venda/FIPE entre 0,20 e 1,20. A lista é re-derivada em cada base — copiar de uma para a outra mediria o ranking de lá na base de cá.'],
  ['A amostra se move', 'O status vira "vendido" horas depois do fim das ofertas. Todo número aqui é o retrato da extração de ' + esc(D.gerado_em) + '.'],
];

const GLOSS_OBS = [
  ['De onde sai', '<code>vehicles.description</code> — campo <code>TEXT</code> digitado à mão. Caminho: <code>advertisement_negotiations → advertisements → vehicles</code>.'],
  ['Sinal', 'Uma expressão procurada no texto. Cada um é medido <b>sozinho</b>, contra as vendas que não o têm, sempre dentro do mesmo modelo e da mesma base.'],
  ['Grupo', 'O assunto de que o sinal fala: avaria, item presente, item faltante, motor, uso, dívida, documentação. Serve para ler os sinais como conjunto, e não um a um.'],
  ['Bloqueio', 'Regra que anula a positiva. <code>não funciona com chave</code> contém <code>com chave</code> — sem bloqueio, essas vendas entrariam como "tem chave".'],
  ['Peça avariada', 'A peça conta quando aparece a até 40 caracteres de uma palavra de dano (avaria, amassado, quebrado, danificado, risco, arranhão…), sem atravessar ponto, ponto-e-vírgula ou barra. Isso evita que "porta pronta. capô danificado" conte a porta.'],
  ['Deságio com', 'Deságio médio das vendas <b>em que aquele sinal aparece</b> no texto. Número cru, sem controle nenhum.'],
  ['Deságio sem', 'Deságio médio de <b>todas as outras vendas</b> da seleção — o grupo de comparação. Não é "o resto do grupo": é o resto da base inteira, tirando as que têm o sinal.'],
  ['Por que o efeito ≠ a diferença entre os dois', 'Porque "com" e "sem" são médias cruas: se um sinal aparecer mais num modelo que já é caro, ele herda o patamar daquele modelo. O <b>efeito</b> desconta a média do próprio modelo antes de comparar. Quando os dois números se afastam, é exatamente isso — a composição de modelos estava contaminando a leitura.'],
  ['Não consta na base', 'O sinal não aparece naquela base, ou aparece em menos de ' + D.n_min + ' vendas. Sai com essa frase e nunca com 0 — zero diria "medi e deu zero", que é uma afirmação diferente.'],
  ['Cláusula de contrato', 'Ficou de fora do dicionário. <code>não mencionamos sobre o funcionamento do motor</code> aparece na maioria das vendas, assim como <code>checagem sob responsabilidade do comprador</code>: dizem quem paga o quê, não o estado do carro.'],
  ['Item de formulário', 'Sinal presente em quase toda a base separa pouco por construção. <code>para-choque</code> e <code>arranhões e avarias em geral</code> são caixas marcadas, não descrição daquele carro — efeito pequeno ali é o esperado.'],
  ['Destaque no texto', 'Aproximado. O casamento oficial é feito no Python sobre o texto normalizado (minúsculo, sem acento, sem pontuação); a tinta no texto original marca as palavras-chave do sinal e pode pintar outra ocorrência.'],
  ['O dicionário', 'Minerado dos n-gramas da própria base, não inventado. Mora em <code>analisa-sinais.py</code> — editar lá é o jeito de mudar a análise.'],
];

const tabelaGloss = (linhas) => `<div class="table-responsive"><table class="table table-sm align-middle gl">
<tbody>${linhas.map(([k, v]) =>
  `<tr><th scope="row">${esc(k)}</th><td>${v}</td></tr>`).join('')}
</tbody></table></div>`;

const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Painel de precificação — Cars2You e Dealers</title>
<style>/*__BS_CSS__*/</style>
<style>
:root{--az:#2a78d6;--lj:#d95926}
[data-bs-theme="dark"]{--az:#3987e5;--lj:#eb6834}
body{font-size:15px}
/* Todas as colunas das tabelas de dado ficam centradas. A classe .num mantém
   tabular-nums para os dígitos alinharem verticalmente mesmo centrados: sem
   isso, "1.176" e "962" dançam de linha para linha.
   (Sem crase nestes comentários — o CSS vive dentro de um template literal,
    e uma crase solta encerra a string. Já quebrou uma vez.) */
#campos table th, #campos table td,
#tabS th, #tabS td, #tabL th, #tabL td{text-align:center}
.num{font-variant-numeric:tabular-nums;white-space:nowrap}
/* duas exceções deliberadas: o cabeçalho de grupo é um título que atravessa a
   tabela, não uma coluna; e o glossário é texto corrido, que centrado fica
   ilegível. */
#tabS td.gtit{text-align:left}
.gl th, .gl td{text-align:left}
.mut{color:var(--bs-secondary-color)}
table{font-size:13.5px}
thead th{font-size:11px;text-transform:uppercase;letter-spacing:.03em;
color:var(--bs-secondary-color)}
.bar{position:relative;min-width:140px;width:30%}
.bar .eixo{position:absolute;left:50%;top:4px;bottom:4px;width:1px;background:var(--bs-border-color)}
.bar i{position:absolute;top:50%;transform:translateY(-50%);height:10px;border-radius:2px}
.bar i.pos{background:var(--lj)}.bar i.neg{background:var(--az)}
.bar b{position:absolute;right:4px;top:50%;transform:translateY(-50%);font-size:12.5px}
b.pos,.pos{color:var(--lj)}b.neg,.neg{color:var(--az)}
tr.sig{cursor:pointer}
tr.sig.on>*{--bs-table-bg-state:rgba(42,120,214,.16)}
.rolar{max-height:58vh;overflow:auto}
.rolar thead th{position:sticky;top:0;z-index:2;background:var(--bs-body-bg)}
.txtbox{white-space:pre-wrap;font-size:12.5px;line-height:1.5;max-height:32vh;overflow:auto}
mark{padding:0 2px;border-radius:2px}
.gl th{width:200px;text-transform:none;letter-spacing:0;font-size:13px;
color:var(--bs-body-color);font-weight:600}
.gl td{font-size:13px}
.kpi .v{font-size:21px;font-weight:650;letter-spacing:-.02em}
.kpi .k{font-size:12px;color:var(--bs-secondary-color)}
/* 15px, e não 13,5: a tabela inteira é 13,5px e a linha de sinal que passa no
   corte já vem em 600. A 13,5/700 o cabeçalho de grupo ficava indistinguível
   de um sinal em negrito — conferido no navegador, não no papel. */
.gtit{font-size:15px;text-transform:uppercase;letter-spacing:.04em;
color:var(--bs-emphasis-color);font-weight:700}
tr.gh>td{background:var(--bs-secondary-bg);
border-top:2px solid var(--bs-border-color);padding-top:9px;padding-bottom:9px}
/* o cabeçalho acompanha a rolagem: o filtro de base vale para as duas telas,
   e sem ele à vista a pessoa perde de que base é o número que está lendo.
   z-index acima do thead grudado das tabelas (que é 2). */
.topo{position:sticky;top:0;z-index:1030;background:var(--bs-body-bg);
border-bottom:1px solid var(--bs-border-color);margin:-1.5rem -0.75rem 1rem;
padding:0.75rem 0.75rem 0.6rem}
@media(min-width:992px){.topo{margin-left:-1.5rem;margin-right:-1.5rem;
padding-left:1.5rem;padding-right:1.5rem}}
@media(max-width:576px){.bar{display:none}}
</style></head>
<body class="bg-body">
<div class="container-fluid px-3 px-lg-4 py-4">

  <div class="topo">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
      <div class="d-flex flex-wrap align-items-center gap-2">
        <h1 class="h5 mb-0 me-2">Painel de precificação</h1>
        <span class="text-secondary small">Base:</span>
        <div class="btn-group btn-group-sm" role="group" id="fbase">
          <button type="button" class="btn btn-outline-primary active" data-b="Ambas">Ambas</button>
          <button type="button" class="btn btn-outline-primary" data-b="Cars2You">Cars2You</button>
          <button type="button" class="btn btn-outline-primary" data-b="Dealers">Dealers</button>
        </div>
        <span class="text-secondary small" id="resumo"></span>
      </div>
      <div class="text-secondary small">O que move o deságio · extração de ${esc(D.gerado_em)}</div>
    </div>
  </div>

  <div class="row g-2 mb-3 kpi">
    <div class="col-6 col-lg-3"><div class="card h-100"><div class="card-body py-2 px-3">
      <div class="v" id="k-n">—</div><div class="k">vendas na seleção</div></div></div></div>
    <div class="col-6 col-lg-3"><div class="card h-100"><div class="card-body py-2 px-3">
      <div class="v" id="k-d">—</div><div class="k">deságio médio</div></div></div></div>
    <div class="col-6 col-lg-3"><div class="card h-100"><div class="card-body py-2 px-3">
      <div class="v" id="k-s">—</div><div class="k">sinais medidos nesta base</div></div></div></div>
    <div class="col-6 col-lg-3"><div class="card h-100"><div class="card-body py-2 px-3">
      <div class="v" id="k-f">—</div><div class="k">passam Bonferroni</div></div></div></div>
  </div>

  <ul class="nav nav-tabs mb-3" role="tablist">
    <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab"
      data-bs-target="#t1" type="button">Campos do sistema</button></li>
    <li class="nav-item"><button class="nav-link" data-bs-toggle="tab"
      data-bs-target="#t2" type="button">Observações do veículo</button></li>
  </ul>

  <div class="tab-content">
    <div class="tab-pane fade show active" id="t1">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        <p class="small text-secondary mb-0">Do menor para o maior efeito.
          <b>Negrito</b> = passa no corte estatístico; o resto é pista, não afirmação.</p>
        <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="collapse"
          data-bs-target="#gl1">Glossário</button></div>
      <div class="collapse mb-3" id="gl1"><div class="card card-body bg-body-tertiary">
        <h2 class="h6 text-uppercase text-secondary mb-2">Glossário — campos do sistema</h2>
        ${tabelaGloss(GLOSS_CAMPOS)}</div></div>
      <div class="row g-3" id="campos"></div>
    </div>

    <div class="tab-pane fade" id="t2">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <input class="form-control form-control-sm" style="max-width:260px" id="fsinal"
          placeholder="filtrar sinal ou grupo…">
        <button class="btn btn-sm btn-outline-secondary ms-auto" data-bs-toggle="collapse"
          data-bs-target="#gl2">Glossário</button></div>
      <div class="collapse mb-3" id="gl2"><div class="card card-body bg-body-tertiary">
        <h2 class="h6 text-uppercase text-secondary mb-2">Glossário — observações do veículo</h2>
        ${tabelaGloss(GLOSS_OBS)}</div></div>
      <div class="row g-3">
        <div class="col-12 col-xl-7"><div class="card h-100"><div class="card-body">
          <h2 class="h6 text-uppercase text-secondary">Sinais por grupo</h2>
          <div class="rolar"><table class="table table-sm table-hover mb-0" id="tabS">
            <thead><tr><th>sinal</th><th class="num">vendas</th>
            <th class="num" title="deságio médio das vendas em que o sinal aparece">deságio<br>com</th>
            <th class="num" title="deságio médio de todas as outras vendas da mesma seleção">deságio<br>sem</th>
            <th>efeito no modelo</th></tr></thead>
            <tbody></tbody></table></div>
          <p class="small text-secondary mb-0 mt-2">Do menor para o maior efeito.
            <b>Negrito</b> = passa no corte estatístico; o resto é pista, não afirmação.</p>
        </div></div></div>
        <div class="col-12 col-xl-5"><div class="card h-100"><div class="card-body">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div><h2 class="h6 mb-1" id="tit">—</h2>
              <p class="small text-secondary mb-2" id="sub"></p></div>
            <button class="btn btn-sm btn-outline-secondary text-nowrap" id="csv">CSV</button>
          </div>
          <div id="alerta"></div>
          <div class="rolar" style="max-height:34vh"><table class="table table-sm mb-0" id="tabL">
            <thead><tr><th data-k="b">base</th><th class="num" data-k="id">id</th>
            <th data-k="g">modelo</th><th class="num" data-k="a">ano</th>
            <th class="num" data-k="k">km</th><th data-k="uf">uf</th>
            <th class="num" data-k="d">deságio</th></tr></thead><tbody></tbody></table></div>
          <p class="small text-secondary mt-2 mb-1" id="cap"></p>
          <div class="border rounded p-2 bg-body-tertiary txtbox" id="txt">—</div>
        </div></div></div>
      </div>
    </div>
  </div>

  <footer class="text-secondary small mt-4 pt-3 border-top">
    Gerado por <code>monta-painel.js</code> a partir de <code>${esc(path.basename(entrada))}</code>.
    As duas bases saem do mesmo <code>roda-estudo.py</code>, com as mesmas 41 colunas.
    Controle por (base, modelo). Bootstrap 5.3.3 embutido — funciona offline.<br>
    ⚠️ Contém nome real de loja e dado comercial de cliente. Repo privado — pensar antes de repassar.
  </footer>
</div>

<script>/*__BS_JS__*/</script>
<script>
var POR_BASE = ${JSON.stringify(D.por_base)};
var CAMPOS = ${JSON.stringify(D.campos)};
var SIN = ${JSON.stringify(D.sinais.map((s) => ({
  r: s.rotulo, g: s.grupo, rx: s.rx, bl: s.bloqueio, nota: s.nota,
  dst: s.destaque, L: s.linhas, B: s.por_base
})))};
var L = ${JSON.stringify(D.linhas.map((r) => ({
  b: r.base, id: r.id, g: r.g, v: r.v, a: r.a, k: r.k, uf: r.uf, l: r.l,
  f: r.f, p: r.p, d: r.d, txt: r.txt
})))};
var ORDEM_GRUPOS = ${JSON.stringify(D.ordem_grupos || [])};
var MAX1 = ${MAX1}, MAX2 = ${MAX2}, CORTE = ${CORTE};
var baseSel = 'Ambas', sel = -1, arr = [], ord = { k: 'd', dir: -1 };

function nb(x){ return x===null||x===undefined||x===''?'—':Number(x).toLocaleString('pt-BR'); }
function pc(x){ return x===null||x===undefined?'—':(x*100).toFixed(1).replace('.',',')+'%'; }
function sg(x){ return (x>=0?'+':'−')+Math.abs(x*100).toFixed(1).replace('.',','); }
function es(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
function limpo(f){ return /^[a-z] /.test(f) ? f.slice(2) : f; }
function barraN(e, max){
  var w = (Math.abs(e)/max)*46, c = e>=0?'pos':'neg';
  return '<span class="eixo"></span><i class="'+c+'" style="'+(e>=0?'left:50%':'right:50%')+
    ';width:'+w+'%"></i><b class="'+c+'">'+sg(e)+'</b>';
}
var NAO_CONSTA = '<span class="mut fst-italic">não consta na base</span>';

function pintaTopo(){
  var pb = POR_BASE[baseSel];
  document.getElementById('k-n').textContent = nb(pb.n);
  document.getElementById('k-d').textContent = pc(pb.desagio);
  var com = SIN.filter(function(s){ return s.B[baseSel]; });
  document.getElementById('k-s').textContent = com.length + ' de ' + SIN.length;
  document.getElementById('k-f').textContent =
    com.filter(function(s){ return Math.abs(s.B[baseSel].t) >= CORTE; }).length;
  document.getElementById('resumo').textContent =
    baseSel === 'Ambas' ? 'Cars2You ' + nb(POR_BASE.Cars2You.n) + ' + Dealers ' +
      nb(POR_BASE.Dealers.n) : '';
}

function pintaCampos(){
  var h = '';
  CAMPOS.forEach(function(c){
    /* ordenado pelo EFEITO, do menor para o maior. Km e idade eram escadas
       naturais (até 20k → 200k+); como o efeito delas é quase monótono, a
       ordem quase não muda — e UF e laudo, que não tinham ordem nenhuma,
       passam a ter. */
    var t = (c.por_base[baseSel] || []).slice()
      .sort(function(a, b){ return a.efeito - b.efeito; });
    var linhas = t.map(function(x){
      var forte = Math.abs(x.t) >= CORTE;
      return '<tr'+(forte?' class="fw-semibold"':'')+'><td>'+es(limpo(x.nivel))+'</td>'+
        '<td class="num">'+nb(x.n)+'</td><td class="num">'+pc(x.desagio)+'</td>'+
        '<td class="bar">'+barraN(x.efeito, MAX1)+'</td></tr>';
    }).join('');
    h += '<div class="col-12 col-xl-6"><div class="card h-100"><div class="card-body">' +
      '<h2 class="h6 mb-2">'+c.titulo+'</h2>' +
      (linhas ? '<div class="table-responsive"><table class="table table-sm mb-0"><thead><tr>' +
        '<th>faixa</th><th class="num">vendas</th><th class="num">deságio</th>' +
        '<th>efeito no modelo</th></tr></thead><tbody>' +
        linhas + '</tbody></table></div>'
      : '<div class="alert alert-secondary py-2 px-3 small mb-0">não consta na base</div>') +
      '</div></div></div>';
  });
  document.getElementById('campos').innerHTML = h;
}

/* os sinais voltam AGRUPADOS por contexto, e não numa lista corrida:
   o assunto é o que dá sentido ao conjunto */
function pintaSinais(){
  var f = (document.getElementById('fsinal').value || '').trim().toLowerCase();
  var porG = {};
  SIN.forEach(function(s, i){
    if (f && s.r.toLowerCase().indexOf(f) < 0 && s.g.toLowerCase().indexOf(f) < 0) return;
    (porG[s.g] = porG[s.g] || []).push({ i: i, s: s });
  });
  /* A ordem dos GRUPOS é fixa — vem do dicionário, na ordem definida pelo
     Thomas. Antes eu ordenava por efeito, e a lista se reorganizava a cada
     troca de base: a pessoa perdia a referência de onde estava cada assunto.
     As LINHAS dentro do grupo continuam do menor para o maior efeito.
     Sinal sem medida na base vai para o fim do grupo: não tem por onde
     ordenar, e no meio da lista pareceria efeito neutro. */
  var ordem = ORDEM_GRUPOS.filter(function(g){ return porG[g]; });
  /* grupo que apareça no dado e não esteja na ordem declarada não some da
     tela — entra no fim, para o esquecimento ser visível */
  Object.keys(porG).forEach(function(g){
    if (ordem.indexOf(g) < 0) ordem.push(g);
  });
  var h = '';
  ordem.forEach(function(g){
    h += '<tr class="gh"><td colspan="5" class="gtit">'+es(g)+'</td></tr>';
    porG[g].slice().sort(function(a,b){
      var ea = a.s.B[baseSel], eb = b.s.B[baseSel];
      if (!ea && !eb) return 0;
      if (!ea) return 1;
      if (!eb) return -1;
      return ea.efeito - eb.efeito;
    }).forEach(function(x){
      var e = x.s.B[baseSel];
      if (!e) {
        h += '<tr class="sig'+(sel===x.i?' on':'')+'" data-i="'+x.i+'"><td>'+es(x.s.r)+'</td>'+
          '<td colspan="4">'+NAO_CONSTA+'</td></tr>';
        return;
      }
      var forte = Math.abs(e.t) >= CORTE;
      h += '<tr class="sig'+(sel===x.i?' on':'')+(forte?' fw-semibold':'')+'" data-i="'+x.i+'">'+
        '<td>'+es(x.s.r)+'</td><td class="num">'+nb(e.n)+'</td>'+
        '<td class="num">'+pc(e.desagio_com)+'</td>'+
        '<td class="num mut">'+pc(e.desagio_sem)+'</td>'+
        '<td class="bar">'+barraN(e.efeito, MAX2)+'</td></tr>';
    });
  });
  document.querySelector('#tabS tbody').innerHTML = h ||
    '<tr><td colspan="5" class="mut">nenhum sinal com esse filtro</td></tr>';
}

function escolhe(i){
  sel = i; var s = SIN[i];
  /* o analítico respeita o seletor de base, igual às estatísticas */
  arr = s.L.map(function(j){ return L[j]; })
           .filter(function(r){ return baseSel === 'Ambas' || r.b === baseSel; });
  document.getElementById('tit').textContent = s.r;
  var partes = [es(s.g)];
  ['Cars2You','Dealers'].forEach(function(b){
    var e = s.B[b];
    partes.push('<b>'+b+'</b> ' + (e ? nb(e.n)+' vendas, '+sg(e.efeito)+' p.p., t = '+
      e.t.toFixed(1).replace('.',',') : '<i>não consta na base</i>'));
  });
  document.getElementById('sub').innerHTML = partes.join(' · ') +
    '<br><span class="mut">regra: <code>'+es(s.rx)+'</code>'+
    (s.bl ? ' · bloqueada por <code>'+es(s.bl)+'</code>' : '')+'</span>';
  document.getElementById('alerta').innerHTML = s.nota
    ? '<div class="alert alert-warning py-1 px-2 small">'+es(s.nota)+'</div>' : '';
  pintaSinais(); pintaLinhas();
}

function pintaLinhas(){
  var a = arr.slice();
  a.sort(function(x,y){
    var k=ord.k, vx=x[k], vy=y[k];
    if(vx===null||vx===undefined||vx==='') return 1;
    if(vy===null||vy===undefined||vy==='') return -1;
    if(typeof vx==='string') return ord.dir*vx.localeCompare(vy);
    return ord.dir*(vx-vy);
  });
  var fim = Math.min(100, a.length), h = '';
  for (var i=0;i<fim;i++){ var r=a[i];
    h += '<tr data-j="'+i+'" style="cursor:pointer">'+
      '<td><span class="badge text-bg-light">'+es(r.b)+'</span></td>'+
      '<td class="num">'+r.id+'</td><td>'+es(r.g)+'</td>'+
      '<td class="num">'+(r.a||'—')+'</td><td class="num">'+nb(r.k)+'</td>'+
      '<td>'+es(r.uf||'—')+'</td>'+
      '<td class="num '+(r.d>=0?'pos':'neg')+'"><b>'+pc(r.d)+'</b></td></tr>';
  }
  document.querySelector('#tabL tbody').innerHTML = h ||
    '<tr><td colspan="7" class="mut">'+(sel<0?'selecione um sinal':
      'este sinal não consta na base selecionada')+'</td></tr>';
  window._a = a;
  if (a.length) { mostraTexto(0); }
  else { document.getElementById('cap').textContent = '';
         document.getElementById('txt').textContent = '—'; }
}

function semAcento(s){ return s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,''); }
function mostraTexto(j){
  var r = window._a[j]; if(!r) return;
  document.getElementById('cap').textContent =
    r.b+' · anúncio do veículo '+r.id+' — '+r.g+(r.v?' '+r.v:'');
  var t = es(r.txt || '(sem descrição)');
  var dst = sel>=0 ? SIN[sel].dst : [];
  var plano = semAcento(t).toLowerCase(), marcas = [];
  dst.forEach(function(d){
    var alvo = semAcento(d).toLowerCase(), p = 0;
    while (alvo && (p = plano.indexOf(alvo, p)) >= 0){ marcas.push([p, p+alvo.length]); p += alvo.length; }
  });
  marcas.sort(function(x,y){ return x[0]-y[0]; });
  var out='', pos=0;
  marcas.forEach(function(m){
    if (m[0] < pos) return;
    out += t.slice(pos, m[0])+'<mark>'+t.slice(m[0], m[1])+'</mark>'; pos = m[1];
  });
  document.getElementById('txt').innerHTML = out + t.slice(pos);
}

document.querySelectorAll('#fbase button').forEach(function(b){
  b.onclick = function(){
    document.querySelectorAll('#fbase button').forEach(function(x){ x.classList.remove('active'); });
    b.classList.add('active'); baseSel = b.dataset.b;
    pintaTopo(); pintaCampos();
    if (sel >= 0) escolhe(sel); else pintaSinais();
  };
});
document.getElementById('fsinal').oninput = pintaSinais;
document.querySelector('#tabS tbody').onclick = function(e){
  var tr = e.target.closest ? e.target.closest('tr') : null;
  if (tr && tr.dataset.i !== undefined) escolhe(Number(tr.dataset.i));
};
document.querySelector('#tabL tbody').onclick = function(e){
  var tr = e.target.closest ? e.target.closest('tr') : null;
  if (tr && tr.dataset.j !== undefined) mostraTexto(Number(tr.dataset.j));
};
document.querySelectorAll('#tabL th').forEach(function(th){
  th.style.cursor = 'pointer';
  th.onclick = function(){
    var k = th.dataset.k;
    ord = { k:k, dir: ord.k===k ? -ord.dir : (k==='g'||k==='uf'||k==='b' ? 1 : -1) };
    pintaLinhas();
  };
});
document.getElementById('csv').onclick = function(){
  if (!arr.length) return;
  var cab = ['base','veiculo_id','modelo','versao','ano_modelo','km','patio_uf','loja',
             'valor_fipe_anuncio','venda','desagio','sinal','descricao'];
  var out = [cab.join(';')];
  arr.forEach(function(r){
    out.push([r.b,r.id,r.g,r.v,r.a,r.k===null?'':r.k,r.uf,r.l,r.f,r.p,
      (r.d*100).toFixed(2).replace('.',','), SIN[sel].r,
      String(r.txt||'').replace(/[\\r\\n]+/g,' ')]
      .map(function(c){ c=String(c);
        return (c.indexOf(';')>=0||c.indexOf('"')>=0) ? '"'+c.replace(/"/g,'""')+'"' : c;
      }).join(';'));
  });
  var blob = new Blob(['\\uFEFF'+out.join('\\r\\n')], {type:'text/csv;charset=utf-8;'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sinal-'+SIN[sel].r.replace(/[^\\w]+/g,'_')+'-'+baseSel+'.csv';
  a.click();
};

pintaTopo(); pintaCampos(); pintaSinais(); escolhe(0);
</script></body></html>`;

/* função de substituição, não texto: o bundle tem cifrões, e $&/$'/$` no
   texto de reposição seriam interpretados pelo próprio replace */
let saidaHtml = html
  .replace('/*__BS_CSS__*/', () => BS_CSS)
  .replace('/*__BS_JS__*/', () => BS_JS);

if (saidaHtml.indexOf('/*__BS_') >= 0) {
  throw new Error('sobrou placeholder do Bootstrap sem substituir');
}
if (/cdn\.jsdelivr|cdnjs\.cloudflare|unpkg\.com/.test(saidaHtml)) {
  throw new Error('ainda há referência a CDN — a página não abriria offline');
}
if (saidaHtml.indexOf('Bootstrap v5.3.3') < 0) {
  throw new Error('o Bootstrap não entrou no arquivo');
}

fs.writeFileSync(saida, saidaHtml, 'utf8');
console.log('  ' + path.basename(saida) + '  ' +
  (fs.statSync(saida).size / 1048576).toFixed(1) + ' MB · ' +
  D.campos.length + ' campos, ' + D.sinais.length + ' sinais, ' +
  D.linhas.length + ' linhas');
