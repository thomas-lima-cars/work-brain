/* ══════════════════════════════════════════════════════════════════════
   Provas do workflow "Carteira Comercial", sem tocar no n8n nem no
   SharePoint.

       node automations/n8n-sdk/carteira-comercial/_prova-carteira.js

   ── O QUE ESTE WORKFLOW PRECISA PROVAR ────────────────────────────────
   Ele produz o arquivo que TODO o resto consome. Um defeito aqui não
   aparece aqui: aparece no Radar, dias depois, como loja com o consultor
   errado. Então as provas negativas importam mais que o caminho feliz —
   cada guarda precisa MORDER, e o produto tem que ser recusado em vez de
   substituir uma carteira boa por uma ruim.
   ══════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');

const AQUI = __dirname;
const RADAR = path.resolve(AQUI, '..', 'rel-veiculos');
const TRATAR = fs.readFileSync(path.join(AQUI, 'tratar-carteira.js'), 'utf8');
const VIRAR = fs.readFileSync(path.join(AQUI, 'virar-arquivo.js'), 'utf8');

let ok = 0;
let falhou = 0;

function prova(nome, fn) {
  try { fn(); ok++; console.log('  ok   ' + nome); }
  catch (e) { falhou++; console.log('  FALHA ' + nome + ' :: ' + e.message); }
}
function igual(a, b, rot) {
  if (a !== b) throw new Error(rot + ': esperava ' + JSON.stringify(b) + ', veio ' + JSON.stringify(a));
}
function rodaNo(fonte, itens, opcoes) {
  const o = opcoes || {};
  const $input = {
    all: () => itens.map((j) => ({ json: j })),
    first: () => ({ json: itens[0] })
  };
  return new Function('$input', 'Buffer', 'Date', fonte)($input, o.Buffer || Buffer, o.Date || Date);
}
function morde(fn, trecho, rot) {
  let bateu = false;
  try { fn(); } catch (e) {
    bateu = e.message.indexOf(trecho) >= 0;
    if (!bateu) throw new Error(rot + ': falhou pela razao errada — ' + e.message);
  }
  if (!bateu) throw new Error(rot + ': deixou passar');
}

/** Planilha sintética com `qt` clientes distribuídos em 3 consultores. */
function planilha(qt, mexer) {
  const nomes = ['Zulmira', 'Amanda', 'Mariana'];
  const linhas = [];
  for (let i = 0; i < qt; i++) {
    linhas.push({
      'Razao Social': 'LOJA SINTETICA ' + i + ' LTDA',
      'CNPJ': String(10000000000000 + i).replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5'),
      'Consultor Responsavel': nomes[i % 3],
      'Temperatura': 'QUENTE'
    });
  }
  if (mexer) mexer(linhas);
  return linhas;
}

console.log('\nCarteira Comercial\n');

/* ═══ 1. caminho feliz ═══════════════════════════════════════════════ */
prova('planilha boa vira mapa com consultores, cnpj e nome', () => {
  const r = rodaNo(TRATAR, planilha(800));
  igual(r.length, 1, 'um item de saída');
  const c = r[0].json.carteira;
  igual(c.consultores.length, 3, 'consultores');
  igual(Object.keys(c.cnpj).length, 800, 'CNPJ mapeados');
  igual(r[0].json.resumo.linhas, 800, 'linhas lidas');
  igual(!!c.gerado_em, true, 'declara quando foi gerado');
  /* o instante, sem fuso ambiguo — e ele que o Radar usa pra contar idade.
     `gerado_em` sozinho e texto em hora de Brasilia, e `Date.parse` o le
     como hora local de quem abre: no n8n, que roda em UTC, a carteira
     parecia 3h mais nova. Medido em 21/09, com 12 dias virando 11. */
  igual(/^[0-9]{4}-[0-9]{2}-[0-9]{2}T.*Z$/.test(c.gerado_em_utc), true,
    'e publica tambem o instante em UTC: ' + c.gerado_em_utc);
  const dif = Math.abs(Date.parse(c.gerado_em_utc) - Date.now());
  igual(dif < 60000, true, 'que e mesmo agora, e nao o texto de Brasilia lido como UTC');
});

prova('os consultores saem ORDENADOS e os indices acompanham', () => {
  const r = rodaNo(TRATAR, planilha(800));
  const c = r[0].json.carteira;
  igual(c.consultores.join(','), 'Amanda,Mariana,Zulmira', 'ordem alfabética');
  /* a linha 0 e da Zulmira (i % 3 === 0). Depois de ordenar, Zulmira e o
     indice 2 -- se o remapeamento nao acontecesse, apontaria pro 0, que
     agora e a Amanda. E o erro silencioso mais caro deste no. */
  const cnpj0 = '10000000000000';
  igual(c.consultores[c.cnpj[cnpj0]], 'Zulmira', 'o primeiro CNPJ segue com a dona certa');
});

prova('nome ambiguo NAO entra no mapa', () => {
  const r = rodaNo(TRATAR, planilha(800, (l) => {
    /* mesma razao social para dois consultores diferentes */
    l[0]['Razao Social'] = 'REPETIDA LTDA';
    l[1]['Razao Social'] = 'REPETIDA LTDA';
  }));
  const c = r[0].json.carteira;
  igual(c.nome['REPETIDA'], undefined, 'o nome ambíguo fica de fora');
  igual(r[0].json.resumo.nome_ambiguo >= 1, true, 'e é contado');
});

prova('o CNPJ e comparado por digito, nao por texto', () => {
  const r = rodaNo(TRATAR, planilha(800, (l) => { l[5]['CNPJ'] = '10000000000005'; }));
  const c = r[0].json.carteira;
  igual(c.cnpj['10000000000005'] !== undefined, true, 'com ou sem máscara, casa igual');
});

/* ═══ 2. as guardas TEM que morder ═══════════════════════════════════ */
prova('[neg] planilha vazia e recusada', () => {
  morde(() => rodaNo(TRATAR, []), 'nao devolveu linha nenhuma', 'vazia');
});

prova('[neg] item de erro do HTTP e recusado, com o texto do erro junto', () => {
  morde(() => rodaNo(TRATAR, [{ error: { message: 'Forbidden - perhaps check your credentials?' } }]),
    'Forbidden', 'erro do HTTP');
});

prova('[neg] falta a coluna do consultor', () => {
  morde(() => rodaNo(TRATAR, planilha(800, (l) => {
    l.forEach((x) => { delete x['Consultor Responsavel']; });
  })), 'faltam colunas', 'coluna ausente');
});

prova('[neg] leitura truncada e recusada', () => {
  morde(() => rodaNo(TRATAR, planilha(40)), 'abaixo do piso', 'truncada');
});

prova('[neg] uma linha sem consultor derruba a publicacao inteira', () => {
  morde(() => rodaNo(TRATAR, planilha(800, (l) => { l[9]['Consultor Responsavel'] = '   '; })),
    'sem consultor responsavel', 'linha incompleta');
});

prova('[neg] coluna de CNPJ presente mas vazia', () => {
  morde(() => rodaNo(TRATAR, planilha(800, (l) => { l.forEach((x) => { x['CNPJ'] = ''; }); })),
    'nenhum CNPJ valido', 'CNPJ vazio');
});

/* ═══ 3. o arquivo ═══════════════════════════════════════════════════ */
function mapaPronto() {
  return rodaNo(TRATAR, planilha(800))[0].json;
}

prova('o mapa vira binario com os mesmos bytes', () => {
  const m = mapaPronto();
  const r = rodaNo(VIRAR, [m]);
  const b = Buffer.from(r[0].binary.data.data, 'base64');
  igual(b.length, r[0].json.bytes, 'bytes declarados batem com o binário');
  igual(JSON.parse(b.toString('utf8')).consultores.length, 3, 'e volta como JSON legível');
});

prova('NAO leva BOM — o BOM quebraria o JSON.parse do consumidor', () => {
  const r = rodaNo(VIRAR, [mapaPronto()]);
  const b = Buffer.from(r[0].binary.data.data, 'base64');
  igual(b.slice(0, 3).toString('hex') === 'efbbbf', false, 'sem BOM');
  igual(b.slice(0, 1).toString('utf8'), '{', 'começa direto no objeto');
});

prova('o caminho aponta pra _dados, com o espaco codificado e a barra NAO', () => {
  const r = rodaNo(VIRAR, [mapaPronto()]);
  igual(r[0].json.caminho, 'Radar%20de%20Estoque/_dados/carteira-comercial.json', 'caminho');
  igual((r[0].json.caminho.match(/\//g) || []).length, 2, 'duas barras separadoras');
});

prova('o nome do arquivo e FIXO — e uma carteira publicada, nao um acervo', () => {
  const a = rodaNo(VIRAR, [mapaPronto()], { Date: (function () {
    function D(v) { return v === undefined ? new Date('2026-09-21T12:00:00Z') : new Date(v); }
    D.now = () => new Date('2026-09-21T12:00:00Z').getTime();
    D.prototype = Date.prototype; return D;
  })() });
  igual(a[0].json.nomeArquivo, 'carteira-comercial.json', 'nome do arquivo');
  if (/[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(a[0].json.nomeArquivo)) {
    throw new Error('apareceu data no nome: a pasta vai acumular');
  }
});

prova('[neg] mapa minusculo e recusado antes de substituir a carteira boa', () => {
  morde(() => rodaNo(VIRAR, [{ carteira: { consultores: ['A'], cnpj: {}, nome: {} } }]),
    'abaixo do piso', 'mapa vazio');
});

prova('[neg] sem `carteira` no item de entrada', () => {
  morde(() => rodaNo(VIRAR, [{ resumo: {} }]), 'nao entregou', 'entrada errada');
});

/* ═══ 4. a normalizacao TEM que ser a mesma do Radar ═════════════════
   Duas copias da mesma funcao em workflows diferentes e o risco central
   deste desenho: se elas divergirem, o mapa e o consumidor discordam sobre
   o que e "o mesmo nome", e o efeito e loja sem responsavel -- sem erro
   nenhum, sem nada na tela. Entao a prova compara os blocos byte a byte. */
prova('a normNome daqui e IDENTICA a do Montar HTML do Radar', () => {
  function bloco(fonte) {
    const a = fonte.indexOf('/* NORMNOME:INICIO');
    const b = fonte.indexOf('/* NORMNOME:FIM */');
    if (a < 0 || b < 0) throw new Error('bloco NORMNOME nao encontrado');
    const corpo = fonte.slice(a, b);
    return corpo.slice(corpo.indexOf('*/') + 2).replace(/\r/g, '').trim();
  }
  const daqui = bloco(TRATAR);
  const doRadar = bloco(fs.readFileSync(path.join(RADAR, 'montar-html.js'), 'utf8'));
  if (daqui !== doRadar) {
    throw new Error('as duas normNome divergiram — mapa e consumidor vao discordar ' +
      'sobre o que e o mesmo nome, e o sintoma sera loja sem responsavel');
  }
  igual(daqui.length > 200, true, 'e o bloco comparado nao esta vazio');
});

console.log('');
console.log(ok + ' provas ok, ' + falhou + ' falha(s)');
process.exit(falhou ? 1 : 0);
