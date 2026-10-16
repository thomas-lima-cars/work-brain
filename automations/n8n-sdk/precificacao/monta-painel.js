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
/* aba 3 — laudo cautelar. Escala própria, pelo mesmo motivo das outras: olha
   todas as bases e também as faixas de lataria, que dividem a tela com ela. */
const LD = D.laudo || null;
let MAX3 = 0;
if (LD) {
  LD.sinais.forEach((s) => Object.keys(s.por_base).forEach((b) => {
    if (s.por_base[b]) MAX3 = Math.max(MAX3, Math.abs(s.por_base[b].efeito));
  }));
  Object.keys(LD.lataria).forEach((b) => LD.lataria[b].forEach((x) => {
    MAX3 = Math.max(MAX3, Math.abs(x.efeito));
  }));
}
/* aba 4 — laudo item a item. Escala própria, olhando todos os estados e bases */
const IT = LD && LD.itens ? LD.itens : null;
let MAX4 = 0;
if (IT) IT.forEach((it) => Object.values(it.estados).forEach((st) => Object.values(st.por_base)
  .forEach((e) => { if (e && !e.poucos) MAX4 = Math.max(MAX4, Math.abs(e.efeito)); })));
const nfmt = (x) => Number(x).toLocaleString('pt-BR');

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

const GLOSS_LAUDO = [
  ['De onde sai', 'Do <b>texto do PDF</b> do laudo cautelar (<code>vehicle_precautionary_reports.file_url</code>), extraído com <code>pdftotext</code>. Não é o campo <code>situation</code> do banco — esse é o "Laudo cautelar" da aba Campos do sistema.'],
  ['Quais vendas', LD ? 'Um sorteio de até 1.500 vendas por base, com semente fixa, dentro da mesma amostra das outras abas. Lidos: Cars2You ' + nfmt(LD.lidos.Cars2You) + ', Dealers ' + nfmt(LD.lidos.Dealers) + '. Com texto legível: ' + nfmt(LD.legiveis.Cars2You) + ' e ' + nfmt(LD.legiveis.Dealers) + ' — o resto é laudo escaneado (imagem), que precisaria de OCR.' : '—'],
  ['Deságio sem', 'Deságio médio das <b>outras vendas com laudo lido</b>, não da base inteira. Comparar "o laudo diz longarina avariada" com "não li o laudo" misturaria o efeito da longarina com o efeito de ter sido sorteado.'],
  ['Efeito', 'O mesmo das outras abas: diferença em pontos percentuais depois de descontar a média do próprio modelo, na própria base.'],
  ['Como o indicador é lido', 'Dicionário de <b>peça + estado</b> dentro da mesma cláusula do laudo ("longarina dianteira esquerda: avariado", "caixa de ar direita amassada", "veículo liga: não"). Há pelo menos dez modelos de laudo, de vistoriadoras diferentes; a frase é o que eles têm em comum. Mora em <code>laudo_sinais.py</code>.'],
  ['O que não conta', 'Rodapé jurídico ("não verificamos funcionamento de… airbag"), negação ("não apresenta danos estruturais", "não indica roubo"), rótulo sem valor ("Chassi remarcado?") e falso amigo ("para-<b>lama</b>" não é alagamento; "rodas de <b>liga</b> leve" não é motor).'],
  ['Ausência não é "não tem"', 'Laudo que não menciona longarina pode ter longarina boa <b>ou</b> não ter checado. Cada vistoriadora checa coisas diferentes — por isso a comparação é "o laudo aponta" contra "o laudo não aponta". Um caso conhecido: o laudo da Natus (Dealers) traz o checklist em grade, que a extração de texto embaralha; dele só se lê o "Detalhe das avarias". Isso dilui o efeito (laudo com dano cai no grupo "não aponta"), não o inventa.'],
  ['Trecho', 'A cláusula exata que casou, mostrada ao lado de cada venda. O PDF original abre pelo link — vale conferir antes de citar um número.'],
  ['Peças de lataria', 'Contagem aproximada de peças externas (capô, porta, para-choque, paralama…) com dano, sem repetir a mesma peça. Legenda de foto que descreve dano conta.'],
  ['Não consta na base', 'O indicador aparece em menos de ' + D.n_min + ' vendas daquela base.'],
];

const GLOSS_ITENS = [
  ['De onde sai', 'Do texto do PDF do laudo cautelar — as mesmas vendas da aba Laudo cautelar. Para cada item que a vistoria checa, o estado é lido da cláusula que cita o item. Mora em <code>laudo_itens.py</code>.'],
  ['Presente', 'O laudo diz que o item está lá e em ordem: presente, possui, sim, ok, bom, sem danos, funcionando. Pneu com meia vida conta como presente.'],
  ['Ausente', 'O laudo diz que o item falta: falta, ausente, não possui, "sem estepe".'],
  ['Danificado', 'O laudo diz que o item existe mas está ruim: danificado, avariado, quebrado, trincado, ruim, não funciona, necessário a troca, sem carga.'],
  ['Item citado várias vezes', 'Fica o pior estado (danificado > ausente > presente). Laudo com "estepe: presente" no checklist e "estepe furado" na observação conta como estepe danificado.'],
  ['Itens de funcionamento', 'Motor, câmbio, ar-condicionado e vidros elétricos: "não" sozinho conta como danificado — "veículo liga: não" é motor que não liga, não motor ausente. "Não possui" continua ausente.'],
  ['Gravação no vidro', 'Nos laudos que listam a gravação do chassi nos vidros ("PARA-BRISA: ORIGINAL", "PORTA DIANTEIRA: ORIGINAL"), "original" e "ausente" falam da gravação, não da peça, e não valem como estado de para-brisa, vidros e portas.'],
  ['Não cita', 'Laudo que não menciona o item não entra em nenhum estado daquele item. Cada vistoriadora checa coisas diferentes.'],
  ['Impacto médio (efeito)', 'Diferença de deságio, em pontos percentuais, entre as vendas com o item naquele estado e as outras vendas de laudo lido, depois de descontar a média do próprio modelo na própria base. Positivo: vendeu mais longe da FIPE.'],
  ['Índice de confiança', 'Confiança de que o efeito é real e não acaso da amostra: 1 − p (teste de duas amostras). <b>Alta</b> = passa o corte de Bonferroni do painel (|t| ≥ ' + String(CORTE).replace('.', ',') + '); <b>média</b> = passa o corte usual (|t| ≥ 2, cerca de 95%); <b>baixa</b> = abaixo disso. Diz se o efeito existe, não se o tamanho está exato — para isso, o intervalo de 95% aparece ao passar o mouse.'],
  ['Poucos casos', 'Estado com menos de ' + D.n_min + ' vendas: aparece com o número de vendas, sem efeito medido.'],
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
#tabS th, #tabS td, #tabL th, #tabL td,
#tabLd th, #tabLd td, #tabLL th, #tabLL td, #lat th, #lat td{text-align:center}
#tabLd td.gtit{text-align:left}
#tabIt th, #tabIt td, #tabIL th, #tabIL td{text-align:center}
#tabIt td.gtit{text-align:left}
.est{display:inline-block;min-width:86px;font-size:12px;font-weight:600;padding:1px 8px;border-radius:10px}
.est.presente{background:rgba(25,135,84,.14);color:var(--bs-success-text-emphasis)}
.est.ausente{background:rgba(255,193,7,.22);color:var(--bs-warning-text-emphasis)}
.est.danificado{background:rgba(220,53,69,.14);color:var(--bs-danger-text-emphasis)}
.cf{font-size:12px;white-space:nowrap}
.cf b{display:inline-block;min-width:44px;padding:1px 6px;border-radius:10px;font-weight:600}
.cf .alta{background:rgba(25,135,84,.14);color:var(--bs-success-text-emphasis)}
.cf .media{background:var(--bs-secondary-bg);color:var(--bs-body-color)}
.cf .baixa{background:transparent;color:var(--bs-secondary-color);border:1px solid var(--bs-border-color)}
.trechos div{padding:3px 6px;border-radius:3px;margin-bottom:2px}
.trechos div.on{background:rgba(217,89,38,.16)}
.trechos b{font-weight:600}
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
    <li class="nav-item"><button class="nav-link" data-bs-toggle="tab"
      data-bs-target="#t3" type="button">Laudo cautelar</button></li>
    <li class="nav-item"><button class="nav-link" data-bs-toggle="tab"
      data-bs-target="#t4" type="button">Laudo item a item</button></li>
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

    <div class="tab-pane fade" id="t3">
${LD ? `      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <input class="form-control form-control-sm" style="max-width:260px" id="flaudo"
          placeholder="filtrar indicador ou grupo…">
        <span class="small text-secondary" id="ldres"></span>
        <button class="btn btn-sm btn-outline-secondary ms-auto" data-bs-toggle="collapse"
          data-bs-target="#gl3">Glossário</button></div>
      <div class="collapse mb-3" id="gl3"><div class="card card-body bg-body-tertiary">
        <h2 class="h6 text-uppercase text-secondary mb-2">Glossário — laudo cautelar</h2>
        ${tabelaGloss(GLOSS_LAUDO)}</div></div>
      <div class="row g-3">
        <div class="col-12 col-xl-7">
          <div class="card mb-3"><div class="card-body">
            <h2 class="h6 mb-2">Peças de lataria com dano</h2>
            <div class="table-responsive"><table class="table table-sm mb-0" id="lat">
              <thead><tr><th>faixa</th><th class="num">vendas</th><th class="num">deságio</th>
              <th>efeito no modelo</th></tr></thead><tbody></tbody></table></div>
          </div></div>
          <div class="card"><div class="card-body">
          <h2 class="h6 text-uppercase text-secondary">Indicadores do laudo por grupo</h2>
          <div class="rolar"><table class="table table-sm table-hover mb-0" id="tabLd">
            <thead><tr><th>o laudo aponta</th><th class="num">vendas</th>
            <th class="num" title="deságio médio das vendas cujo laudo aponta o indicador">deságio<br>com</th>
            <th class="num" title="deságio médio das outras vendas com laudo lido">deságio<br>sem</th>
            <th>efeito no modelo</th></tr></thead>
            <tbody></tbody></table></div>
          <p class="small text-secondary mb-0 mt-2">Do menor para o maior efeito.
            <b>Negrito</b> = passa no corte estatístico; o resto é pista, não afirmação.</p>
        </div></div></div>
        <div class="col-12 col-xl-5"><div class="card h-100"><div class="card-body">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div><h2 class="h6 mb-1" id="titL">—</h2>
              <p class="small text-secondary mb-2" id="subL"></p></div>
            <button class="btn btn-sm btn-outline-secondary text-nowrap" id="csvL">CSV</button>
          </div>
          <div id="alertaL"></div>
          <div class="rolar" style="max-height:34vh"><table class="table table-sm mb-0" id="tabLL">
            <thead><tr><th data-k="b">base</th><th class="num" data-k="id">id</th>
            <th data-k="g">modelo</th><th class="num" data-k="a">ano</th>
            <th class="num" data-k="k">km</th><th data-k="uf">uf</th>
            <th class="num" data-k="d">deságio</th></tr></thead><tbody></tbody></table></div>
          <p class="small text-secondary mt-2 mb-1" id="capL"></p>
          <div class="border rounded p-2 bg-body-tertiary txtbox trechos" id="txtL">—</div>
        </div></div></div>
      </div>` : `      <div class="alert alert-secondary">Os textos dos laudos não estavam disponíveis
        quando o painel foi gerado. Rode <code>laudos/coleta-textos-vendas.py</code> e depois
        <code>monta-painel-dados.py</code>.</div>`}
    </div>

    <div class="tab-pane fade" id="t4">
${IT ? `      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <input class="form-control form-control-sm" style="max-width:260px" id="fitem"
          placeholder="filtrar item…">
        <select class="form-select form-select-sm" style="max-width:240px" id="fordem">
          <option value="lista">Ordem do laudo</option>
          <option value="impacto">Maior impacto primeiro</option></select>
        <span class="small text-secondary" id="itres"></span>
        <button class="btn btn-sm btn-outline-secondary ms-auto" data-bs-toggle="collapse"
          data-bs-target="#gl4">Glossário</button></div>
      <div class="collapse mb-3" id="gl4"><div class="card card-body bg-body-tertiary">
        <h2 class="h6 text-uppercase text-secondary mb-2">Glossário — laudo item a item</h2>
        ${tabelaGloss(GLOSS_ITENS)}</div></div>
      <div class="row g-3">
        <div class="col-12 col-xl-7"><div class="card h-100"><div class="card-body">
          <h2 class="h6 text-uppercase text-secondary">Cada item, em três estados</h2>
          <div class="rolar"><table class="table table-sm table-hover mb-0" id="tabIt">
            <thead><tr><th>estado no laudo</th><th class="num">vendas</th>
            <th class="num" title="deságio médio das vendas com o item neste estado">deságio<br>com</th>
            <th class="num" title="deságio médio das outras vendas com laudo lido">deságio<br>sem</th>
            <th>impacto médio no deságio</th>
            <th title="confiança de que o impacto é real e não acaso — passe o mouse para o intervalo de 95%">confiança</th></tr></thead>
            <tbody></tbody></table></div>
          <p class="small text-secondary mb-0 mt-2">Positivo: o carro vendeu mais longe da FIPE.
            Confiança <b>alta</b> passa o corte de Bonferroni; <b>média</b>, o corte usual de 95%; <b>baixa</b> é pista.</p>
        </div></div></div>
        <div class="col-12 col-xl-5"><div class="card h-100"><div class="card-body">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div><h2 class="h6 mb-1" id="titI">—</h2>
              <p class="small text-secondary mb-2" id="subI"></p></div>
            <button class="btn btn-sm btn-outline-secondary text-nowrap" id="csvI">CSV</button>
          </div>
          <div class="rolar" style="max-height:34vh"><table class="table table-sm mb-0" id="tabIL">
            <thead><tr><th data-k="b">base</th><th class="num" data-k="id">id</th>
            <th data-k="g">modelo</th><th class="num" data-k="a">ano</th>
            <th class="num" data-k="k">km</th><th data-k="uf">uf</th>
            <th class="num" data-k="d">deságio</th></tr></thead><tbody></tbody></table></div>
          <p class="small text-secondary mt-2 mb-1" id="capI"></p>
          <div class="border rounded p-2 bg-body-tertiary txtbox trechos" id="txtI">—</div>
        </div></div></div>
      </div>` : `      <div class="alert alert-secondary">Sem os textos dos laudos não há análise item a item.</div>`}
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
  f: r.f, p: r.p, d: r.d, txt: r.txt, ld: r.ld || null
})))};
var LD = ${JSON.stringify(LD ? {
  lidos: LD.lidos, legiveis: LD.legiveis, lataria: LD.lataria, ordem: LD.ordem_grupos,
  S: LD.sinais.map((s) => ({ r: s.rotulo, g: s.grupo, rx: s.rx, bl: s.bloqueio,
    nota: s.nota, L: s.linhas, B: s.por_base }))
} : null)};
var MAX3 = ${MAX3 || 1}, selL = -1, arrL = [], ordL = { k: 'd', dir: -1 };
var IT = ${JSON.stringify(IT ? IT.map((it) => ({ i: it.item,
  E: Object.fromEntries(Object.entries(it.estados).map(([k, st]) => [k, { B: st.por_base, L: st.linhas }])) })) : null)};
var MAX4 = ${MAX4 || 1}, selI = null, arrI = [], ordI = { k: 'd', dir: -1 };
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

/* ── aba 3: laudo cautelar ─────────────────────────────────────────────
   Mesmo desenho da aba 2. A diferença está no quadro de texto: em vez da
   descrição do anúncio, os TRECHOS do laudo que casaram para aquele carro,
   com o do indicador escolhido em destaque, e o link do PDF original. */
function pintaLaudoTopo(){
  if (!LD) return;
  var bs = baseSel === 'Ambas' ? ['Cars2You','Dealers'] : [baseSel];
  var li = 0, le = 0;
  bs.forEach(function(b){ li += LD.lidos[b]; le += LD.legiveis[b]; });
  document.getElementById('ldres').textContent =
    nb(le) + ' laudos com texto, de ' + nb(li) + ' lidos';
  var t = (LD.lataria[baseSel] || []).slice();
  document.querySelector('#lat tbody').innerHTML = t.map(function(x){
    var forte = Math.abs(x.t) >= CORTE;
    return '<tr'+(forte?' class="fw-semibold"':'')+'><td>'+es(limpo(x.nivel))+'</td>'+
      '<td class="num">'+nb(x.n)+'</td><td class="num">'+pc(x.desagio)+'</td>'+
      '<td class="bar">'+barraN(x.efeito, MAX3)+'</td></tr>';
  }).join('') || '<tr><td colspan="4">'+NAO_CONSTA+'</td></tr>';
}

function pintaLaudo(){
  if (!LD) return;
  var f = (document.getElementById('flaudo').value || '').trim().toLowerCase();
  var porG = {};
  LD.S.forEach(function(s, i){
    if (f && s.r.toLowerCase().indexOf(f) < 0 && s.g.toLowerCase().indexOf(f) < 0) return;
    (porG[s.g] = porG[s.g] || []).push({ i: i, s: s });
  });
  var ordem = LD.ordem.filter(function(g){ return porG[g]; });
  Object.keys(porG).forEach(function(g){ if (ordem.indexOf(g) < 0) ordem.push(g); });
  var h = '';
  ordem.forEach(function(g){
    h += '<tr class="gh"><td colspan="5" class="gtit">'+es(g)+'</td></tr>';
    porG[g].slice().sort(function(a,b){
      var ea = a.s.B[baseSel], eb = b.s.B[baseSel];
      if (!ea && !eb) return 0; if (!ea) return 1; if (!eb) return -1;
      return ea.efeito - eb.efeito;
    }).forEach(function(x){
      var e = x.s.B[baseSel];
      if (!e) {
        h += '<tr class="sig'+(selL===x.i?' on':'')+'" data-i="'+x.i+'"><td>'+es(x.s.r)+'</td>'+
          '<td colspan="4">'+NAO_CONSTA+'</td></tr>';
        return;
      }
      var forte = Math.abs(e.t) >= CORTE;
      h += '<tr class="sig'+(selL===x.i?' on':'')+(forte?' fw-semibold':'')+'" data-i="'+x.i+'">'+
        '<td>'+es(x.s.r)+'</td><td class="num">'+nb(e.n)+'</td>'+
        '<td class="num">'+pc(e.desagio_com)+'</td>'+
        '<td class="num mut">'+pc(e.desagio_sem)+'</td>'+
        '<td class="bar">'+barraN(e.efeito, MAX3)+'</td></tr>';
    });
  });
  document.querySelector('#tabLd tbody').innerHTML = h ||
    '<tr><td colspan="5" class="mut">nenhum indicador com esse filtro</td></tr>';
}

function escolheL(i){
  selL = i; var s = LD.S[i];
  arrL = s.L.map(function(j){ return L[j]; })
            .filter(function(r){ return baseSel === 'Ambas' || r.b === baseSel; });
  document.getElementById('titL').textContent = s.r;
  var partes = [es(s.g)];
  ['Cars2You','Dealers'].forEach(function(b){
    var e = s.B[b];
    partes.push('<b>'+b+'</b> ' + (e ? nb(e.n)+' vendas, '+sg(e.efeito)+' p.p., t = '+
      e.t.toFixed(1).replace('.',',') : '<i>não consta na base</i>'));
  });
  document.getElementById('subL').innerHTML = partes.join(' · ');
  document.getElementById('alertaL').innerHTML = s.nota
    ? '<div class="alert alert-warning py-1 px-2 small">'+es(s.nota)+'</div>' : '';
  pintaLaudo(); pintaLinhasL();
}

function pintaLinhasL(){
  var a = arrL.slice();
  a.sort(function(x,y){
    var k=ordL.k, vx=x[k], vy=y[k];
    if(vx===null||vx===undefined||vx==='') return 1;
    if(vy===null||vy===undefined||vy==='') return -1;
    if(typeof vx==='string') return ordL.dir*vx.localeCompare(vy);
    return ordL.dir*(vx-vy);
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
  document.querySelector('#tabLL tbody').innerHTML = h ||
    '<tr><td colspan="7" class="mut">'+(selL<0?'selecione um indicador':
      'este indicador não consta na base selecionada')+'</td></tr>';
  window._aL = a;
  if (a.length) { mostraLaudo(0); }
  else { document.getElementById('capL').textContent = '';
         document.getElementById('txtL').textContent = '—'; }
}

function mostraLaudo(j){
  var r = window._aL[j]; if (!r || !r.ld) return;
  var alvo = selL >= 0 ? LD.S[selL].r : '';
  document.getElementById('capL').innerHTML =
    es(r.b+' · veículo '+r.id+' — '+r.g+(r.v?' '+r.v:'')) +
    (r.ld.pl !== null && r.ld.pl !== undefined ? ' · '+r.ld.pl+' peça(s) de lataria com dano' : '') +
    (r.ld.u ? ' · <a href="'+es(r.ld.u).replace(/"/g,'%22')+'" target="_blank" rel="noopener">abrir laudo (PDF)</a>' : '');
  /* os trechos seguem a ordem dos indicadores no dicionário, não a do laudo */
  var h = '';
  LD.S.forEach(function(s){
    var t = r.ld.t[s.r]; if (!t) return;
    h += '<div'+(s.r===alvo?' class="on"':'')+'><b>'+es(s.r)+'</b> — '+es(t)+'</div>';
  });
  document.getElementById('txtL').innerHTML = h || '(nenhum indicador neste laudo)';
}

if (LD) {
  document.getElementById('flaudo').oninput = pintaLaudo;
  document.querySelector('#tabLd tbody').onclick = function(e){
    var tr = e.target.closest ? e.target.closest('tr') : null;
    if (tr && tr.dataset.i !== undefined) escolheL(Number(tr.dataset.i));
  };
  document.querySelector('#tabLL tbody').onclick = function(e){
    var tr = e.target.closest ? e.target.closest('tr') : null;
    if (tr && tr.dataset.j !== undefined) mostraLaudo(Number(tr.dataset.j));
  };
  document.querySelectorAll('#tabLL th').forEach(function(th){
    th.style.cursor = 'pointer';
    th.onclick = function(){
      var k = th.dataset.k;
      ordL = { k:k, dir: ordL.k===k ? -ordL.dir : (k==='g'||k==='uf'||k==='b' ? 1 : -1) };
      pintaLinhasL();
    };
  });
  document.getElementById('csvL').onclick = function(){
    if (!arrL.length) return;
    var s = LD.S[selL];
    var cab = ['base','veiculo_id','modelo','versao','ano_modelo','km','patio_uf','loja',
               'valor_fipe_anuncio','venda','desagio','indicador','trecho_do_laudo','laudo_pdf'];
    var out = [cab.join(';')];
    arrL.forEach(function(r){
      out.push([r.b,r.id,r.g,r.v,r.a,r.k===null?'':r.k,r.uf,r.l,r.f,r.p,
        (r.d*100).toFixed(2).replace('.',','), s.r, r.ld.t[s.r]||'', r.ld.u||'']
        .map(function(c){ c=String(c);
          return (c.indexOf(';')>=0||c.indexOf('"')>=0) ? '"'+c.replace(/"/g,'""')+'"' : c;
        }).join(';'));
    });
    var blob = new Blob(['\\uFEFF'+out.join('\\r\\n')], {type:'text/csv;charset=utf-8;'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'laudo-'+s.r.replace(/[^\\w]+/g,'_')+'-'+baseSel+'.csv';
    a.click();
  };
}

/* ── aba 4: laudo item a item ──────────────────────────────────────────
   Mesmo desenho da aba 2, com uma linha por (item, estado). A ordem padrão é
   a do laudo (acessórios, peças, funcionamento); "maior impacto" ordena os
   ITENS pelo maior efeito de qualquer estado, e os estados ficam na ordem
   presente → ausente → danificado, para a comparação dentro do item. */
var ESTS = ['presente', 'ausente', 'danificado'];
function confI(e){
  var cl = e.nivel === 'alta' ? 'alta' : e.nivel === 'média' ? 'media' : 'baixa';
  var ic = 'intervalo de 95%: ' + sg(e.ic[0]) + ' a ' + sg(e.ic[1]) + ' p.p. · t = ' + e.t.toFixed(1).replace('.', ',');
  return '<span class="cf" title="' + ic + '"><b class="' + cl + '">' + e.nivel + '</b> ' +
    (e.conf * 100).toFixed(e.conf > .999 ? 1 : 0).replace('.', ',') + '%</span>';
}
function pintaItens(){
  if (!IT) return;
  var f = (document.getElementById('fitem').value || '').trim().toLowerCase();
  var lista = IT.map(function(it, i){ return { it: it, i: i }; })
    .filter(function(x){ return !f || x.it.i.toLowerCase().indexOf(f) >= 0; });
  if (document.getElementById('fordem').value === 'impacto') {
    var maior = function(it){ return Math.max.apply(null, ESTS.map(function(s){
      var e = it.E[s].B[baseSel]; return e && !e.poucos ? Math.abs(e.efeito) : 0; })); };
    lista.sort(function(a, b){ return maior(b.it) - maior(a.it); });
  }
  var h = '', medidos = 0, fortes = 0;
  lista.forEach(function(x){
    h += '<tr class="gh"><td colspan="6" class="gtit">' + es(x.it.i) + '</td></tr>';
    ESTS.forEach(function(s){
      var e = x.it.E[s].B[baseSel], chave = x.i + '|' + s, on = selI === chave ? ' on' : '';
      var rot = '<td><span class="est ' + s + '">' + s + '</span></td>';
      if (!e) { h += '<tr class="mut">' + rot + '<td colspan="5" class="mut fst-italic">o laudo não traz este estado</td></tr>'; return; }
      if (e.poucos) { h += '<tr class="sig' + on + '" data-c="' + chave + '">' + rot + '<td class="num">' + nb(e.n) +
        '</td><td colspan="4" class="mut fst-italic">poucos casos — sem efeito medido</td></tr>'; return; }
      medidos++; if (e.nivel === 'alta') fortes++;
      h += '<tr class="sig' + on + (e.nivel === 'alta' ? ' fw-semibold' : '') + '" data-c="' + chave + '">' + rot +
        '<td class="num">' + nb(e.n) + '</td><td class="num">' + pc(e.desagio_com) + '</td>' +
        '<td class="num mut">' + pc(e.desagio_sem) + '</td>' +
        '<td class="bar">' + barraN(e.efeito, MAX4) + '</td><td>' + confI(e) + '</td></tr>';
    });
  });
  document.querySelector('#tabIt tbody').innerHTML = h ||
    '<tr><td colspan="6" class="mut">nenhum item com esse filtro</td></tr>';
  document.getElementById('itres').textContent = IT.length + ' itens · ' + medidos +
    ' estados medidos · ' + fortes + ' com confiança alta';
}
function escolheI(chave){
  selI = chave;
  var p = chave.split('|'), it = IT[Number(p[0])], s = p[1];
  arrI = it.E[s].L.map(function(j){ return L[j]; })
           .filter(function(r){ return baseSel === 'Ambas' || r.b === baseSel; });
  document.getElementById('titI').innerHTML = es(it.i) + ' · <span class="est ' + s + '">' + s + '</span>';
  var partes = [];
  ['Cars2You', 'Dealers'].forEach(function(b){
    var e = it.E[s].B[b];
    partes.push('<b>' + b + '</b> ' + (!e ? '<i>não consta</i>' : e.poucos ? nb(e.n) + ' vendas (poucas)' :
      nb(e.n) + ' vendas, ' + sg(e.efeito) + ' p.p., confiança ' + e.nivel));
  });
  document.getElementById('subI').innerHTML = partes.join(' · ');
  pintaItens(); pintaLinhasI();
}
function pintaLinhasI(){
  var a = arrI.slice();
  a.sort(function(x, y){
    var k = ordI.k, vx = x[k], vy = y[k];
    if (vx === null || vx === undefined || vx === '') return 1;
    if (vy === null || vy === undefined || vy === '') return -1;
    if (typeof vx === 'string') return ordI.dir * vx.localeCompare(vy);
    return ordI.dir * (vx - vy);
  });
  var fim = Math.min(100, a.length), h = '';
  for (var i = 0; i < fim; i++){ var r = a[i];
    h += '<tr data-j="' + i + '" style="cursor:pointer"><td><span class="badge text-bg-light">' + es(r.b) + '</span></td>' +
      '<td class="num">' + r.id + '</td><td>' + es(r.g) + '</td><td class="num">' + (r.a || '—') + '</td>' +
      '<td class="num">' + nb(r.k) + '</td><td>' + es(r.uf || '—') + '</td>' +
      '<td class="num ' + (r.d >= 0 ? 'pos' : 'neg') + '"><b>' + pc(r.d) + '</b></td></tr>';
  }
  document.querySelector('#tabIL tbody').innerHTML = h ||
    '<tr><td colspan="7" class="mut">' + (selI ? 'nenhuma venda nesta base' : 'selecione um item') + '</td></tr>';
  window._aI = a;
  if (a.length) mostraItens(0);
  else { document.getElementById('capI').textContent = ''; document.getElementById('txtI').textContent = '—'; }
}
/* o quadro mostra o estado de TODOS os itens que o laudo daquele carro cita,
   com o item escolhido em destaque — dá para ver o carro inteiro de uma vez */
function mostraItens(j){
  var r = window._aI[j]; if (!r || !r.ld || !r.ld.it) return;
  var alvo = selI ? IT[Number(selI.split('|')[0])].i : '';
  document.getElementById('capI').innerHTML = es(r.b + ' · veículo ' + r.id + ' — ' + r.g + (r.v ? ' ' + r.v : '')) +
    (r.ld.u ? ' · <a href="' + es(r.ld.u).replace(/"/g, '%22') + '" target="_blank" rel="noopener">abrir laudo (PDF)</a>' : '');
  var h = '';
  IT.forEach(function(it){
    var v = r.ld.it[it.i]; if (!v) return;
    h += '<div' + (it.i === alvo ? ' class="on"' : '') + '><b>' + es(it.i) + '</b> <span class="est ' + v[0] + '">' + v[0] +
      '</span>' + (v[1] ? ' — ' + es(v[1]) : '') + '</div>';
  });
  document.getElementById('txtI').innerHTML = h || '(o laudo não cita nenhum item)';
}
if (IT) {
  document.getElementById('fitem').oninput = pintaItens;
  document.getElementById('fordem').onchange = pintaItens;
  document.querySelector('#tabIt tbody').onclick = function(e){
    var tr = e.target.closest ? e.target.closest('tr') : null;
    if (tr && tr.dataset.c) escolheI(tr.dataset.c);
  };
  document.querySelector('#tabIL tbody').onclick = function(e){
    var tr = e.target.closest ? e.target.closest('tr') : null;
    if (tr && tr.dataset.j !== undefined) mostraItens(Number(tr.dataset.j));
  };
  document.querySelectorAll('#tabIL th').forEach(function(th){
    th.style.cursor = 'pointer';
    th.onclick = function(){
      var k = th.dataset.k;
      ordI = { k: k, dir: ordI.k === k ? -ordI.dir : (k === 'g' || k === 'uf' || k === 'b' ? 1 : -1) };
      pintaLinhasI();
    };
  });
  document.getElementById('csvI').onclick = function(){
    if (!arrI.length) return;
    var p = selI.split('|'), it = IT[Number(p[0])];
    var cab = ['base','veiculo_id','modelo','versao','ano_modelo','km','patio_uf','loja','valor_fipe_anuncio',
               'venda','desagio','item','estado','trecho_do_laudo','laudo_pdf'];
    var out = [cab.join(';')];
    arrI.forEach(function(r){
      var v = r.ld.it[it.i] || ['', ''];
      out.push([r.b, r.id, r.g, r.v, r.a, r.k === null ? '' : r.k, r.uf, r.l, r.f, r.p,
        (r.d * 100).toFixed(2).replace('.', ','), it.i, v[0], v[1], r.ld.u || '']
        .map(function(c){ c = String(c);
          return (c.indexOf(';') >= 0 || c.indexOf('"') >= 0) ? '"' + c.replace(/"/g, '""') + '"' : c;
        }).join(';'));
    });
    var blob = new Blob(['\\uFEFF' + out.join('\\r\\n')], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'item-' + it.i.replace(/[^\\w]+/g, '_') + '-' + p[1] + '-' + baseSel + '.csv';
    a.click();
  };
}

document.querySelectorAll('#fbase button').forEach(function(b){
  b.onclick = function(){
    document.querySelectorAll('#fbase button').forEach(function(x){ x.classList.remove('active'); });
    b.classList.add('active'); baseSel = b.dataset.b;
    pintaTopo(); pintaCampos();
    if (sel >= 0) escolhe(sel); else pintaSinais();
    if (LD) { pintaLaudoTopo(); if (selL >= 0) escolheL(selL); else pintaLaudo(); }
    if (IT) { if (selI) escolheI(selI); else pintaItens(); }
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
if (LD && LD.S.length) { pintaLaudoTopo(); escolheL(0); }
if (IT) escolheI('0|ausente');
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
