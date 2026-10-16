/* ============================================================================
   Catálogo de Relatórios — gerador
   ----------------------------------------------------------------------------
   relatorios.json + design/modelos/dashboard-claro.html  →  duas saídas:

     catalogo-relatorios.html         documento inteiro, autossuficiente, abre
                                      do SharePoint ou de um anexo (regra 9).
                                      Nasce no tema claro: o tema do arquivo
                                      manda (regra 7).
     _artifact/catalogo-relatorios.html  o mesmo conteúdo sem <html>/<head>/
                                      <body>, para publicar como Artifact. Lá o
                                      tema segue o do leitor.

   O visual NÃO mora aqui. Folha de estilo, logos e ícone de tema são
   recortados do modelo gerado, então mexer no design/tokens/tema.css e
   regerar os modelos chega aqui sozinho na próxima execução. Aqui só entra
   o que o modelo não tem: as abas e a tabela de catálogo.

       node automations/catalogo-relatorios/monta-catalogo.js
   ========================================================================== */
const fs = require('fs');
const path = require('path');

const AQUI = __dirname;
const MODELO = path.join(AQUI, '..', '..', 'design', 'modelos', 'dashboard-claro.html');
const DADOS = JSON.parse(fs.readFileSync(path.join(AQUI, 'relatorios.json'), 'utf8'));
const modelo = fs.readFileSync(MODELO, 'utf8');

/* ── recortes do modelo ──────────────────────────────────────────────── */
function recorta(ini, fim, rotulo) {
  const a = modelo.indexOf(ini);
  const b = a < 0 ? -1 : modelo.indexOf(fim, a + ini.length);
  if (a < 0 || b < 0) throw new Error('não achei ' + rotulo + ' no modelo — ele mudou de forma');
  return modelo.slice(a, b + fim.length);
}
const estilo = recorta('<style>', '</style>', 'a folha de estilo').slice(7, -8);
const logo = recorta('const LOGO = {', '\n};', 'o bloco das logos');
const icoTema = recorta('const ICO_TEMA = {', '\n};', 'o ícone do tema');

/* ── dados ───────────────────────────────────────────────────────────── */
const OPS = DADOS.operacoes;
const REL = DADOS.relatorios;
const idsOp = new Set(OPS.map((o) => o.id));
REL.forEach((r) => r.ops.forEach((o) => {
  if (!idsOp.has(o)) throw new Error(r.nome + ': operação desconhecida "' + o + '"');
}));
const SIT = {
  producao:   { rot: 'Em produção',   cls: 'ok' },
  validacao:  { rot: 'Em validação',  cls: 'atencao' },
  construcao: { rot: 'Em construção', cls: 'atencao' },
  parado:     { rot: 'Parado',        cls: '' },
  verificar:  { rot: 'Verificar',     cls: 'ruim' }
};
REL.forEach((r) => { if (!SIT[r.situacao]) throw new Error(r.nome + ': situação "' + r.situacao + '"'); });

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nf = (n) => n.toLocaleString('pt-BR');
const dataBR = DADOS.atualizado.split('-').reverse().join('/');

/* ── números do topo (cada relatório conta uma vez, mesmo em duas abas) ─ */
const conta = (f) => REL.filter(f).length;
const K = {
  total: REL.length,
  producao: conta((r) => r.situacao === 'producao'),
  andamento: conta((r) => r.situacao === 'validacao' || r.situacao === 'construcao'),
  agendado: conta((r) => r.modo === 'agendado'),
  evento: conta((r) => r.modo === 'evento'),
  manual: conta((r) => r.modo === 'manual'),
  manualProd: conta((r) => r.modo === 'manual' && r.situacao === 'producao'),
  verificar: conta((r) => r.situacao === 'verificar'),
  parado: conta((r) => r.situacao === 'parado')
};

/* ── peças ───────────────────────────────────────────────────────────── */
const ICO = {
  doc: '<path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  mao: '<path d="M8 13V5a2 2 0 014 0v6"/><path d="M12 11V4a2 2 0 014 0v7"/><path d="M16 11V7a2 2 0 014 0v7a7 7 0 01-7 7h-1a7 7 0 01-6-3.4L4 14a2 2 0 013.4-2L8 13"/>',
  alerta: '<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.5"/>',
  pasta: '<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
  livro: '<path d="M4 19V5a2 2 0 012-2h13v18H6a2 2 0 01-2-2z"/><path d="M4 19a2 2 0 012-2h13"/>'
};
const chip = (k) => '<span class="chip" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICO[k] + '</svg></span>';

function kpi(ico, rot, val, pe) {
  return '<article class="cartao">' +
    '<div class="cartao-topo">' + chip(ico) + '<span class="kpi-rot">' + rot + '</span></div>' +
    '<p class="kpi-val num">' + nf(val) + '</p>' +
    '<dl class="kpi-pe">' + pe.map((p) => '<div><dt>' + p[0] + '</dt><dd class="num">' + nf(p[1]) + '</dd></div>').join('') + '</dl>' +
    '</article>';
}

function linha(r, op) {
  const s = SIT[r.situacao];
  const outras = r.ops.filter((o) => o !== op).map((o) => OPS.find((x) => x.id === o).nome);
  const selos = [];
  if (r.insumo) selos.push('<span class="tag">insumo</span>');
  if (outras.length) selos.push('<span class="tag">também em ' + esc(outras.join(', ')) + '</span>');
  const link = r.wf
    ? '<a class="lk" href="' + DADOS.n8n_base + r.wf + '" target="_blank" rel="noopener">abrir no n8n ↗</a>'
    : '<span class="mono">fora do n8n</span>';
  return '<tr>' +
    '<td class="rel"><strong>' + esc(r.nome) + '</strong>' +
      (selos.length ? '<span class="selos">' + selos.join('') + '</span>' : '') +
      '<span class="wf">' + link + '</span></td>' +
    '<td class="mostra">' + esc(r.mostra) + (r.nota ? '<span class="nota">' + esc(r.nota) + '</span>' : '') + '</td>' +
    '<td>' + esc(r.formato) + '</td>' +
    '<td>' + esc(r.quando) + '</td>' +
    '<td>' + esc(r.onde) + '<span class="para">' + esc(r.para) + '</span></td>' +
    '<td><span class="tag ' + s.cls + '">' + s.rot + '</span></td>' +
    '</tr>';
}

function secao(op) {
  const lista = REL.filter((r) => r.ops.indexOf(op.id) >= 0);
  const corpo = lista.length
    ? '<div class="rolo"><table class="cat">' +
      '<thead><tr><th>Relatório</th><th>O que mostra</th><th>Formato</th><th>Quando roda</th><th>Onde chega · para quem</th><th>Situação</th></tr></thead>' +
      '<tbody>' + lista.map((r) => linha(r, op.id)).join('') + '</tbody></table></div>'
    : '<p class="vazio">Nenhum relatório nesta operação ainda.</p>';
  return '<section class="cartao op" id="op-' + op.id + '" data-op="' + op.id + '">' +
    '<div class="cartao-topo">' + chip('pasta') + '<h2>' + esc(op.nome) + '</h2>' +
    '<span class="dir"><span class="tag">' + lista.length + (lista.length === 1 ? ' relatório' : ' relatórios') + '</span></span></div>' +
    '<p class="op-desc">' + esc(op.desc) + '</p>' + corpo + '</section>';
}

const GLOSS = [
  ['Relatório', 'Tudo que uma automação entrega para alguém ler: página, planilha, mensagem ou e-mail. Os gatilhos, sondas e cópias de teste não entram no catálogo.'],
  ['Insumo', 'Automação que não é lida por pessoas: ela prepara um dado que outro relatório usa.'],
  ['Todo dia / semanal', 'Roda sozinho num horário fixo, no relógio de São Paulo.'],
  ['No fim de cada evento', 'Um gatilho confere a cada 10 minutos se o pregão acabou. Quando acaba, dispara o relatório uma vez só.'],
  ['Manual / por formulário', 'Só roda quando alguém pede: pelo n8n, por um formulário ou depois de uma etapa da operação.'],
  ['Em produção', 'Roda e entrega para o público final.'],
  ['Em validação', 'Pronto, mas ainda sendo conferido antes de chegar a todo mundo.'],
  ['Em construção', 'Ainda não entregou um resultado completo.'],
  ['Parado', 'Existe no n8n, mas não entrega mais. A nota diz o porquê.'],
  ['Verificar', 'O estado no n8n não bate com o que se espera, ou o relatório ainda não foi documentado.'],
  ['Pregão', 'A disputa de ofertas de um evento. O relatório do pregão mostra a melhor oferta, não a venda fechada.'],
  ['VMV', 'Valor mínimo de venda: o menor valor que o vendedor aceita naquele veículo.'],
  ['Remanescentes', 'Veículos que passaram pelo evento e não receberam oferta.'],
  ['Canal', 'O whitelabel da plataforma por onde a loja compra: 4 Trucks2you, 7 Marketplace, 43 C6 Auto, 48 Colaboradores C6, 62 e 65 Lance Fácil BTB.']
];

/* ── a página ────────────────────────────────────────────────────────── */
const EXTRA = `
/* ── só do catálogo: abas e tabela de texto. Tudo em token do tema. ── */
.abas{display:flex;flex-wrap:wrap;gap:8px}
.aba{font:inherit;font-size:13px;font-weight:600;color:var(--texto-2);background:var(--superficie);
  border:1px solid var(--borda-forte);border-radius:999px;padding:7px 14px;cursor:pointer;
  display:inline-flex;gap:8px;align-items:center}
.aba .n{font-variant-numeric:tabular-nums;color:var(--texto-3);font-weight:500}
.aba:hover{border-color:var(--acento)}
.aba:focus-visible{outline:2px solid var(--acento-cheio);outline-offset:2px}
.aba[aria-selected="true"]{background:var(--acento-veu);border-color:var(--acento);color:var(--texto)}
.aba[aria-selected="true"] .n{color:var(--texto-2)}
.op-desc{margin:0 0 14px;color:var(--texto-2);max-width:75ch;position:relative}
.cat{min-width:980px}
.cat th,.cat td{text-align:left;vertical-align:top}
.cat td{line-height:1.45}
.cat td.rel{min-width:190px}
.cat td.mostra{min-width:280px;max-width:420px;color:var(--texto-2)}
.cat .rel strong{display:block;color:var(--texto)}
.cat .selos{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.cat .wf{display:block;margin-top:6px;font-size:12px}
.cat .para{display:block;margin-top:4px;font-size:12px;color:var(--texto-3)}
.cat .nota{display:block;margin-top:6px;font-size:12px;color:var(--atencao);font-weight:600}
.cat .mono{font-size:12px;color:var(--texto-3)}
.cat .tag{white-space:nowrap}
.lk{color:var(--texto-2);text-decoration:underline;text-underline-offset:2px}
.lk:hover{color:var(--texto)}
.vazio{color:var(--texto-3);margin:0;position:relative}
.op[hidden]{display:none!important}
`;

const corpo = `
<header class="topo">
  <div class="topo-in">
    <span class="marca">
      <img class="logo logo-extensa" id="logo" src="" alt="Cars2You">
      <img class="logo logo-curta" id="logo-curta" src="" alt="Cars2You">
    </span>
    <div class="topo-tit">
      <h1>Catálogo de Relatórios</h1>
      <p class="sub">O que as automações entregam, por operação</p>
    </div>
    <div class="topo-acoes">
      <button class="ctrl so-icone" id="b-tema" type="button" aria-label="Mudar o tema"></button>
    </div>
  </div>
</header>

<main class="area">

  <section class="g4" aria-label="Resumo do catálogo">
    ${kpi('doc', 'Relatórios no catálogo', K.total, [['Em produção', K.producao], ['Em validação ou construção', K.andamento]])}
    ${kpi('relogio', 'Rodam sozinhos', K.agendado + K.evento, [['Em horário fixo', K.agendado], ['No fim do evento', K.evento]])}
    ${kpi('mao', 'Sob demanda', K.manual, [['Em produção', K.manualProd], ['Outros estados', K.manual - K.manualProd]])}
    ${kpi('alerta', 'Pedem atenção', K.verificar + K.parado, [['Verificar', K.verificar], ['Parados', K.parado]])}
  </section>

  <nav class="abas" role="tablist" aria-label="Operação">
    <button class="aba" type="button" role="tab" id="aba-todas" data-op="todas" aria-selected="true">Todas <span class="n">${K.total}</span></button>
    ${OPS.map((o) => `<button class="aba" type="button" role="tab" id="aba-${o.id}" data-op="${o.id}" aria-selected="false">${esc(o.nome)} <span class="n">${REL.filter((r) => r.ops.indexOf(o.id) >= 0).length}</span></button>`).join('\n    ')}
  </nav>

  ${OPS.map(secao).join('\n  ')}

  <details class="cartao gloss" id="gloss">
    <summary class="cartao-topo">
      ${chip('livro')}
      <h2>Glossário</h2>
      <span class="dir"><span class="tag">${GLOSS.length} termos</span><span class="seta" aria-hidden="true">▾</span></span>
    </summary>
    <dl>${GLOSS.map((g) => '<dt>' + g[0] + '</dt><dd>' + g[1] + '</dd>').join('')}</dl>
  </details>

  <p class="rodape">Atualizado em ${dataBR} · ${esc(DADOS.fonte)}</p>

</main>`;

function script(temaDoLeitor) {
  return `<script>
const $ = (s) => document.querySelector(s);
${logo}
${icoTema}
function aplicaTema(t){
  document.documentElement.dataset.tema = t;
  $('#logo').src = LOGO[t].extensa;
  $('#logo-curta').src = LOGO[t].curta;
  const alvo = t === 'escuro' ? 'claro' : 'escuro';
  const b = $('#b-tema');
  b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICO_TEMA[alvo] + '</svg>';
  b.setAttribute('aria-label', 'Mudar para o tema ' + alvo);
  b.setAttribute('title', 'Tema ' + alvo);
}
${temaDoLeitor ? `/* Artifact: o tema segue o do leitor (data-theme do visualizador ou o do sistema). */
function temaDoLeitor(){
  const t = document.documentElement.getAttribute('data-theme');
  if (t === 'dark') return 'escuro';
  if (t === 'light') return 'claro';
  return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
}
aplicaTema(temaDoLeitor());
new MutationObserver(() => aplicaTema(temaDoLeitor()))
  .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => aplicaTema(temaDoLeitor()));`
  : `aplicaTema(document.documentElement.dataset.tema || 'claro');`}
$('#b-tema').addEventListener('click', () =>
  aplicaTema(document.documentElement.dataset.tema === 'escuro' ? 'claro' : 'escuro'));

/* abas: mostram uma operação ou todas. #c6 no link abre direto na aba. */
const abas = Array.prototype.slice.call(document.querySelectorAll('.aba'));
const secoes = Array.prototype.slice.call(document.querySelectorAll('.op'));
function mostra(op){
  if (!abas.some((a) => a.dataset.op === op)) op = 'todas';
  abas.forEach((a) => a.setAttribute('aria-selected', a.dataset.op === op ? 'true' : 'false'));
  secoes.forEach((s) => { s.hidden = !(op === 'todas' || s.dataset.op === op); });
}
abas.forEach((a) => a.addEventListener('click', () => {
  mostra(a.dataset.op);
  try { history.replaceState(null, '', a.dataset.op === 'todas' ? location.pathname : '#' + a.dataset.op); } catch (e) {}
}));
mostra((location.hash || '').slice(1) || 'todas');
</script>`;
}

const titulo = '<title>Catálogo de Relatórios</title>';
const folha = '<style>' + estilo + EXTRA + '</style>';

const inteiro = '<!doctype html>\n<html lang="pt-BR" data-tema="claro">\n<head>\n<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">\n' + titulo + '\n' + folha +
  '\n</head>\n<body>\n' + corpo + '\n' + script(false) + '\n</body>\n</html>\n';
const fragmento = titulo + '\n' + folha + '\n' + corpo + '\n' + script(true) + '\n';

/* guardas: autossuficiente (regra 9) e sem marcador sobrando */
[inteiro, fragmento].forEach((h) => {
  const rede = h.match(/(?:src|href)="(https?:)?\/\/(?!cars2you\.app\.n8n\.cloud)[^"]*"/g);
  if (rede) throw new Error('requisição de rede na página: ' + rede.slice(0, 3).join(', '));
  if (/\$\{/.test(h.replace(/<script>[\s\S]*<\/script>/, ''))) throw new Error('marcador de template sobrando no HTML');
});

fs.writeFileSync(path.join(AQUI, 'catalogo-relatorios.html'), inteiro);
fs.mkdirSync(path.join(AQUI, '_artifact'), { recursive: true });
fs.writeFileSync(path.join(AQUI, '_artifact', 'catalogo-relatorios.html'), fragmento);
console.log('catalogo-relatorios.html: ' + nf(Buffer.byteLength(inteiro)) + ' bytes · ' +
  K.total + ' relatórios em ' + OPS.length + ' operações');
console.log('_artifact/catalogo-relatorios.html: ' + nf(Buffer.byteLength(fragmento)) + ' bytes');
