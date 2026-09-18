/* SMOKE TEST do painel de precificação.
 * Uso: node _smoke_painel.js <painel-precificacao.html> [painel-dados.json]
 *
 * A página tem duas telas, um seletor de base que vale para as duas, clique em
 * sinal e clique em venda. Nada disso é validado por `node --check`. Aqui um
 * DOM de mentira executa o script de verdade e confere que cada parte produz
 * conteúdo — e que os números batem com o JSON que alimentou a página.
 */
const fs = require('fs');
const path = require('path');

const arq = process.argv[2] || path.join(process.cwd(), 'painel-precificacao.html');
const jsonD = process.argv[3];
const html = fs.readFileSync(arq, 'utf8');
const falhas = [];
const ok = (c, m) => { if (!c) falhas.push(m); };

Array.from(new Set(Array.from(html.matchAll(/getElementById\('([^']+)'\)/g)).map((m) => m[1])))
  .forEach((id) => ok(new RegExp('id="' + id + '"').test(html),
    'script procura #' + id + ', que não existe no HTML'));

let baixou = null;
const reg = {};
function no(id) {
  const el = {
    id, _html: '', _txt: '', value: '', style: {}, dataset: {},
    classList: { _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
      contains(c) { return this._s.has(c); } },
    closest() { return this.dataset.i !== undefined || this.dataset.j !== undefined ? this : null; },
    querySelector() { return null; }, querySelectorAll() { return []; }
  };
  Object.defineProperty(el, 'innerHTML', { get() { return this._html; }, set(v) { this._html = v; } });
  Object.defineProperty(el, 'textContent', { get() { return this._txt; }, set(v) { this._txt = v; } });
  return el;
}
const pega = (s) => (reg[s] = reg[s] || no(s));

const botoes = Array.from(html.matchAll(/data-b="(\w+)"/g)).map((m) => {
  const e = no('b' + m[1]); e.dataset.b = m[1];
  if (m[1] === 'Ambas') e.classList.add('active');
  return e;
});

const doc = {
  getElementById: (id) => pega(id),
  querySelector: (s) => pega(s),
  querySelectorAll: (s) => {
    if (s === '#fbase button') return botoes;
    if (s === '#tabL th') {
      const m = html.match(/id="tabL"[\s\S]*?<\/tr>/);
      return (m ? Array.from(m[0].matchAll(/data-k="([^"]+)"/g)) : []).map((x) => {
        const e = no('th'); e.dataset.k = x[1]; return e;
      });
    }
    return [];
  },
  createElement: () => ({ set href(v) { this._h = v; }, download: '',
    click() { if (baixou) baixou.clicou = true; } })
};

const bloco = html.match(/<script>\s*var POR_BASE[\s\S]*?<\/script>/);
ok(!!bloco, 'não achei o <script> de dados/lógica');
if (bloco) {
  const corpo = bloco[0].replace(/^<script>/, '').replace(/<\/script>$/, '');
  try {
    new Function('document', 'Blob', 'URL', 'window', corpo)(
      doc,
      function (partes, o) { this.partes = partes; this.type = o && o.type; },
      { createObjectURL: (b) => { baixou = { partes: b.partes }; return 'blob:x'; } },
      {});
  } catch (e) { ok(false, 'o script quebrou ao executar: ' + e.message); }
}

/* ── tela 1 ── */
const c1 = reg.campos ? reg.campos.innerHTML : '';
ok(c1.length > 200, 'a tela de campos do sistema saiu vazia');
const cards = (c1.match(/class="col-12 col-xl-6"/g) || []).length;
ok(cards >= 4, 'esperava 4 cartões de campo, vi ' + cards);
ok(/Quilometragem/.test(c1) && /Idade/.test(c1) && /UF/.test(c1) && /Laudo/.test(c1),
  'falta uma das quatro dimensões na tela 1');
/* o laudo passou a existir nas DUAS bases em 17/09. Se voltar a faltar, a tela
   tem de dizer "não consta na base" — nunca sumir com o cartão calada. */
ok(!/laudo só existe na/.test(c1),
  'a tela ainda traz o aviso antigo de que o laudo é só da Dealers');

/* ── tela 2 ── */
const tS0 = reg['#tabS tbody'] ? reg['#tabS tbody'].innerHTML : '';
ok((tS0.match(/<tr /g) || []).length > 0, 'a tabela de sinais saiu vazia');
ok(/data-i="/.test(tS0), 'as linhas de sinal ficaram sem data-i');
/* o agrupamento por contexto voltou a pedido: tem de haver cabeçalho de grupo */
const grupos = (tS0.match(/class="gtit"/g) || []).length;
ok(grupos >= 4, 'esperava cabeçalhos de grupo na tela 2, vi ' + grupos);

const tL0 = reg['#tabL tbody'] ? reg['#tabL tbody'].innerHTML : '';
ok((tL0.match(/<tr /g) || []).length > 0, 'a lista de vendas saiu vazia na carga');
ok(/badge/.test(tL0), 'a lista de vendas não mostra a base de cada linha');
ok((reg.txt ? reg.txt.innerHTML : '').length > 20, 'o painel de texto saiu vazio');
ok(/<mark>/.test(reg.txt ? reg.txt.innerHTML : ''), 'o texto saiu sem destaque');

if (jsonD) {
  const J = JSON.parse(fs.readFileSync(jsonD, 'utf8'));
  ok(J.por_base.Ambas.n === J.por_base.Cars2You.n + J.por_base.Dealers.n,
    'a união não fecha: ' + J.por_base.Ambas.n + ' != ' +
    J.por_base.Cars2You.n + ' + ' + J.por_base.Dealers.n);
  const esperado = J.sinais[0].linhas.length;
  const visto = (tL0.match(/<tr /g) || []).length;
  ok(visto === Math.min(100, esperado),
    'a lista mostra ' + visto + ' linhas; o sinal de abertura tem ' + esperado);
  const soUma = J.sinais.filter((s) => !s.por_base.Cars2You || !s.por_base.Dealers).length;
  ok(soUma > 0, 'esperava algum sinal presente em só uma base — sem isso a prova de ' +
    '"não consta na base" não testa nada');
  /* as duas bases têm de trazer as MESMAS colunas na linha */
  const bases = new Set(J.linhas.map((r) => r.base));
  ok(bases.size === 2, 'a base unida deveria ter as duas origens, tem ' + bases.size);
  const chavesC = Object.keys(J.linhas.find((r) => r.base === 'Cars2You') || {}).sort().join(',');
  const chavesD = Object.keys(J.linhas.find((r) => r.base === 'Dealers') || {}).sort().join(',');
  ok(chavesC === chavesD, 'as duas bases não trazem as mesmas colunas na linha');
}

/* trocar a base tem de repintar as DUAS telas, e filtrar o analítico */
if (botoes.length === 3) {
  const alvo = botoes.filter((b) => b.dataset.b === 'Cars2You')[0];
  ok(!!alvo && typeof alvo.onclick === 'function', 'o botão Cars2You ficou sem onclick');
  if (alvo && alvo.onclick) {
    const antes1 = reg.campos.innerHTML, antes2 = reg['#tabS tbody'].innerHTML;
    alvo.onclick();
    ok(reg.campos.innerHTML !== antes1, 'trocar a base não repintou a tela 1');
    ok(reg['#tabS tbody'].innerHTML !== antes2, 'trocar a base não repintou a tela 2');
    ok(/não consta na base/.test(reg['#tabS tbody'].innerHTML),
      'na Cars2You, sinal ausente deveria sair como "não consta na base"');
    ok(!/>Dealers</.test(reg['#tabL tbody'].innerHTML),
      'com Cars2You selecionada, o analítico ainda traz linha da Dealers');
    botoes.filter((b) => b.dataset.b === 'Ambas')[0].onclick();
  }
}

/* trocar de sinal muda a lista */
const sigs = Array.from(tS0.matchAll(/data-i="(\d+)"/g)).map((m) => m[1]);
if (sigs.length > 1 && reg['#tabS tbody'].onclick) {
  const antes = reg['#tabL tbody'].innerHTML;
  const falso = no('tr'); falso.dataset.i = sigs[1];
  reg['#tabS tbody'].onclick({ target: falso });
  ok(reg['#tabL tbody'].innerHTML !== antes, 'clicar em outro sinal não mudou a lista');
}

if (reg.csv && reg.csv.onclick) {
  baixou = null; reg.csv.onclick();
  ok(!!baixou, 'o botão de CSV não gerou arquivo');
  if (baixou) {
    const csv = baixou.partes[0], l = csv.split('\r\n');
    ok(csv.charCodeAt(0) === 0xFEFF, 'CSV sem BOM — o Excel abriria com acento quebrado');
    ok(l[0].indexOf(';') >= 0, 'CSV sem separador ponto-e-vírgula');
    /* o BOM ocupa a posicao 0 da primeira linha -- tirar antes de comparar */
    ok(l[0].replace(/^﻿/, '').indexOf('base') === 0,
      'CSV sem a coluna de base como primeira');
    ok(l[0].indexOf('descricao') >= 0, 'CSV sem a descrição');
    ok(!/;\d+\.\d{2};/.test(l[1] || ''), 'CSV com ponto decimal — o Excel pt-BR não lê');
  }
}

/* ── o que mudou em 17/09: largura fluida, ordem por efeito, sem coluna t ── */
/* procurar no arquivo inteiro daria falso positivo desde que o Bootstrap
   passou a ser embutido: o CSS dele DEFINE .container-xxl. O que importa é a
   classe usada na marcação da página. */
ok(/<div class="container-fluid/.test(html),
  'o container da página deveria ser fluido, para acompanhar a tela');
ok(!/<div class="container-xxl/.test(html),
  'a página ainda usa container-xxl na marcação');

/* a coluna t saiu das DUAS tabelas. O <th> é curto e literal: procurar ">t<". */
ok(!/<th class="num">t<\/th>/.test(html), 'a coluna t ainda está no cabeçalho da tela 2');
ok(!/>t<\/th>/.test(c1), 'a coluna t ainda está nas tabelas da tela 1');
/* mas o critério não sumiu: o negrito continua, e a legenda tem de explicá-lo */
ok(/fw-semibold/.test(c1), 'sumiu o negrito que marca o que passa no corte');
ok(/passa no corte estatístico/.test(html),
  'sem a coluna t, a legenda do negrito é a única defesa — e não está na página');

/* ordem crescente por efeito. Os valores saem como <b class="pos|neg">+1,2</b>,
   com sinal unicode − no negativo. */
function efeitos(txt) {
  return Array.from(txt.matchAll(/<b class="(?:pos|neg)">([+−][\d,]+)<\/b>/g))
    .map((m) => Number(m[1].replace('−', '-').replace('+', '').replace(',', '.')));
}
function crescente(v) {
  for (let i = 1; i < v.length; i++) if (v[i] < v[i - 1] - 1e-9) return false;
  return true;
}
/* tela 1: cada cartão é uma tabela independente */
const cartoes = c1.split('<div class="col-12 col-xl-6">').slice(1);
cartoes.forEach((card, i) => {
  const v = efeitos(card);
  ok(crescente(v), 'cartão ' + (i + 1) + ' da tela 1 não está em ordem crescente de efeito: ' +
    v.slice(0, 6).join(', '));
});
/* tela 2: cada grupo é um bloco entre cabeçalhos .gtit */
const blocos = tS0.split(/<tr class="gh">/).slice(1);
ok(blocos.length >= 4, 'esperava blocos de grupo na tela 2');
blocos.forEach((b, i) => {
  const v = efeitos(b);
  ok(crescente(v), 'grupo ' + (i + 1) + ' da tela 2 não está em ordem crescente: ' +
    v.slice(0, 6).join(', '));
});
/* os GRUPOS, ao contrário das linhas, têm ordem FIXA: a do dicionário. Em
   17/09 eles eram ordenados por efeito e se reorganizavam a cada troca de
   base — o pedido foi travar. */
if (jsonD) {
  const JG = JSON.parse(fs.readFileSync(jsonD, 'utf8'));
  const naTela = Array.from(tS0.matchAll(/class="gtit">([^<]+)</g)).map((m) => m[1]);
  const esperada = (JG.ordem_grupos || []).filter((g) => naTela.indexOf(g) >= 0);
  ok(naTela.join(' | ') === esperada.join(' | '),
    'a ordem dos grupos não é a do dicionário.\n       tela:     ' +
    naTela.join(' | ') + '\n       esperada: ' + esperada.join(' | '));
  /* e tem de continuar a mesma depois de trocar de base */
  if (botoes.length === 3) {
    botoes.filter((b) => b.dataset.b === 'Dealers')[0].onclick();
    const depois = Array.from(reg['#tabS tbody'].innerHTML.matchAll(/class="gtit">([^<]+)</g))
      .map((m) => m[1]);
    ok(depois.join(' | ') === naTela.join(' | '),
      'a ordem dos grupos mudou ao trocar de base — era justamente o que se quis travar');
    botoes.filter((b) => b.dataset.b === 'Ambas')[0].onclick();
  }
}

/* colunas centradas, com duas exceções deliberadas: o título de grupo (que
   atravessa a tabela) e o glossário (texto corrido) */
ok(/#tabS th, #tabS td, #tabL th, #tabL td\{text-align:center\}/.test(html),
  'sumiu a regra que centraliza as colunas das tabelas');
ok(/#tabS td\.gtit\{text-align:left\}/.test(html),
  'o título de grupo deveria continuar à esquerda');
ok(/\.gl th, \.gl td\{text-align:left\}/.test(html),
  'o glossário deveria continuar à esquerda — centrado fica ilegível');
/* a crase quebra o template literal do gerador; já aconteceu uma vez */
ok(!/\/\* [^*]*`/.test(html.slice(html.indexOf('<style>'), html.indexOf('</style>'))),
  'há crase dentro de comentário no CSS — isso encerra o template literal');

/* o Bootstrap passou a ser EMBUTIDO em 17/09, para a página funcionar offline.
   Antes estas duas provas exigiam o CDN — agora exigem o contrário. */
ok(!/(src|href)="https?:\/\//.test(html),
  'a página busca algo na rede: offline perderia o visual');
ok(/Bootstrap\s+v5\.3\.3/.test(html), 'o Bootstrap não está embutido no HTML');
/* o CSS sozinho não basta: quem troca de aba e abre o glossário é o JS dele.
   Testar o tamanho do HTML inteiro seria prova falsa — ele tem 10 MB de dado
   e passaria de qualquer jeito. O que vale é o bloco <script> do Bootstrap. */
const scripts = Array.from(html.matchAll(/<script>([\s\S]*?)<\/script>/g)).map((m) => m[1]);
const bsScript = scripts.find((s) => /Bootstrap\s+v5\.3\.3/.test(s));
ok(!!bsScript, 'não achei o <script> com o bundle do Bootstrap');
ok(!!bsScript && bsScript.length > 50000,
  'o bundle do Bootstrap está pequeno demais (' +
  (bsScript ? bsScript.length : 0) + ' bytes) — provavelmente truncado');
/* e o CSS dele, no <style> */
const estilos = Array.from(html.matchAll(/<style>([\s\S]*?)<\/style>/g)).map((m) => m[1]);
ok(estilos.some((s) => /Bootstrap\s+v5\.3\.3/.test(s) && s.length > 150000),
  'o CSS do Bootstrap não está embutido, ou está truncado');
ok(!/\/\*__BS_(CSS|JS)__\*\//.test(html), 'sobrou placeholder do Bootstrap sem substituir');
ok(/data-bs-target="#t1"/.test(html) && /data-bs-target="#t2"/.test(html),
  'as duas abas não estão ligadas aos painéis');
ok(/id="gl1"/.test(html) && /id="gl2"/.test(html), 'falta um dos dois glossários');
/* o seletor de base é UM só, acima das abas, e vale para as duas telas */
ok(html.indexOf('id="fbase"') < html.indexOf('data-bs-target="#t1"'),
  'o seletor de base deveria estar ACIMA das abas, valendo para as duas telas');

console.log('\n  ' + path.basename(arq) + ' — ' +
  (fs.statSync(arq).size / 1048576).toFixed(1) + ' MB');
console.log('  ' + cards + ' cartões na tela 1 · ' + sigs.length +
  ' sinais em ' + grupos + ' grupos na tela 2');
if (falhas.length) {
  console.log('\n  FALHAS:');
  falhas.forEach((f) => console.log('   - ' + f));
  process.exit(1);
}
console.log('\n  todas as provas passaram\n');
