/* Provas do Painel de Eventos Cars2You, sobre a coleta local.

     node prova-local.js

   O _confere_banco.py confere o painel contra o BANCO (SQL escrito de novo).
   Aqui o painel é conferido contra o CRU que ele mesmo recebeu, e contra as
   regras: o que derruba o run, o que vira aviso, o que não pode vazar, a
   ordem dos blocos, e cada conta refeita sem as máscaras de dias. */

const fs = require('fs');
const path = require('path');
const { roda } = require('./_roda_no');
const injetor = require('./_aplica-modelo');
const { enxuga } = require('./_enxuga');

const AQUI = __dirname;
const semCR = (s) => s.split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
const ler = (f) => semCR(fs.readFileSync(path.join(AQUI, f), 'utf8'));
const dados = JSON.parse(fs.readFileSync(path.join(AQUI, 'dados-local.json'), 'utf8'));
const copia = (x) => JSON.parse(JSON.stringify(x));

let ok = 0;
const falhas = [];
function prova(nome, fn) {
  try { fn(); ok++; } catch (e) { falhas.push(nome + ' — ' + e.message); }
}
const igual = (a, b, o) => { if (a !== b) throw new Error((o || '') + ': ' + JSON.stringify(a) + ' ≠ ' + JSON.stringify(b)); };
const verdade = (x, o) => { if (!x) throw new Error(o || 'falso'); };
const cai = (fn, trecho) => {
  try { fn(); } catch (e) { if (trecho && e.message.indexOf(trecho) < 0) throw new Error('caiu por outro motivo: ' + e.message); return; }
  throw new Error('não caiu');
};

const monta = (d, arq) => roda(arq || 'montar-painel.js', { 'Montar Consultas': d.consultas, 'MCP Consultas': d.mcp, 'Ler Carteira': d.carteira })[0].json;
const OUT = monta(dados);
const html = OUT.html;
const R0 = OUT.resumo;

/* a página como ela roda: o dado e o calcula() de dentro do <script> */
const ini = html.indexOf('<script>') + 8;
const D = JSON.parse(html.slice(html.lastIndexOf('APP(') + 4, html.lastIndexOf(',{"claro"')));
const calcula = new Function(html.slice(ini, html.indexOf('function APP(', ini)) + ' return calcula;')();
const C = (F) => calcula(D, F || {});
const T0 = C();
const bit = (m, d) => ((m >>> d) & 1) === 1;

/* ── 1. a fonte ───────────────────────────────────────────────────────── */
['montar-consultas.js', 'montar-painel.js', 'virar-arquivo.js'].forEach((f) => {
  prova(f + ': sem barra invertida, crase nem cifrão-chave', () => {
    const s = ler(f);
    verdade(s.indexOf(String.fromCharCode(92)) < 0, 'barra invertida');
    verdade(s.indexOf('`') < 0, 'crase');
    verdade(s.indexOf('${') < 0, 'cifrão-chave');
  });
  prova(f + ': n8n/ é o nó enxuto de hoje', () => igual(ler(path.join('n8n', f)), enxuga(ler(f)), 'enxuto desatualizado'));
});
prova('bloco TEMA igual ao que o injetor produziria', () => verdade(ler('montar-painel.js').indexOf(injetor.blocoTema) >= 0));
prova('bloco LOGOS igual ao que o injetor produziria', () => verdade(ler('montar-painel.js').indexOf(injetor.blocoLogos) >= 0));
/* o script da página leva calcula() e APP() pelo toString(), com os
   comentários junto, e o enxuto não tem: o que tem que ser igual é o resto */
const ENX = monta(dados, 'n8n/montar-painel.js');
const semBytes = (r) => JSON.stringify(Object.assign({}, r, { bytes_html: 0 }));
const dadoDe = (h) => h.slice(h.lastIndexOf('APP(') + 4);
prova('nó enxuto: mesmo resumo', () => igual(semBytes(ENX.resumo), semBytes(R0)));
prova('nó enxuto: mesma marcação fora do script', () => igual(ENX.html.split('<script>')[0], html.split('<script>')[0]));
prova('nó enxuto: mesmo dado embutido', () => { igual(dadoDe(ENX.html), dadoDe(html)); verdade(dadoDe(html).length > 1e6); });

/* ── 2. as consultas ──────────────────────────────────────────────────── */
const itens = roda('montar-consultas.js');
const meta = itens[0].json.meta;
prova('uma consulta por parte de cada tabela', () => {
  const n = Object.keys(meta.partes).reduce((s, k) => s + meta.partes[k], 0);
  igual(itens.length, n, 'itens');
});
prova('toda consulta é um pacote só (COUNT + JSON_ARRAYAGG), sem função de janela', () => itens.forEach((i) => {
  verdade(i.json.sql.indexOf('SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(') === 0, i.json.queryName);
  verdade(i.json.sql.toUpperCase().indexOf('OVER(') < 0 && i.json.sql.toUpperCase().indexOf('OVER (') < 0, i.json.queryName);
}));
prova('o recorte usa os seis canais, 30 dias e o piso em hora de Brasília', () => {
  igual(meta.wls.join(','), '4,7,43,48,62,65');
  igual(meta.dias, 30);
  verdade(itens.every((i) => i.json.sql.indexOf("finish_date_event >= '" + meta.piso + "'") >= 0 || ['canais', 'logins', 'lojas'].indexOf(i.json.tabela) >= 0),
    'piso fora de alguma consulta de evento');
  verdade(itens.every((i) => i.json.sql.indexOf('NOW()') < 0 && i.json.sql.indexOf('CURDATE()') < 0), 'NOW/CURDATE no SQL');
});
prova('as partes cortam pelo resto do id e cobrem 0..n-1', () => Object.keys(meta.partes).forEach((k) => {
  const n = meta.partes[k];
  if (n === 1) return;
  for (let p = 0; p < n; p++) {
    const it = itens.find((i) => i.json.queryName === k + '_p' + p);
    verdade(it && it.json.sql.indexOf(', ' + n + ') = ' + p) >= 0, k + '_p' + p);
  }
}));

/* ── 3. o que derruba o run, e o que vira aviso ───────────────────────── */
prova('pacote com uma linha a menos derruba o run', () => {
  const d = copia(dados);
  const i = d.consultas.findIndex((x) => x.json.queryName === 'negs_p3');
  const sc = d.mcp[i].json.structuredContent;
  const li = JSON.parse(sc.rows[0][1]);
  li.pop();
  sc.rows[0][1] = JSON.stringify(li);
  cai(() => monta(d), 'Pacote incompleto');
});
prova('parte que falta derruba o run', () => {
  const d = copia(dados);
  const i = d.consultas.findIndex((x) => x.json.queryName === 'acessos_p2');
  d.consultas.splice(i, 1);
  d.mcp.splice(i, 1);
  cai(() => monta(d), 'acessos chegou em');
});
prova('resposta a menos do MCP derruba o run', () => {
  const d = copia(dados);
  d.mcp.pop();
  cai(() => monta(d), 'respostas para');
});
[['ausente', []], ['com erro do HTTP', [{ json: { error: { message: '404' } } }]],
 ['truncada', [{ json: { consultores: ['A'], cnpj: { '11111111000111': 0 }, gerado_em: '2026-10-28' } }]]].forEach((c) => {
  prova('carteira ' + c[0] + ': o painel sai sem o filtro de responsável, com aviso', () => {
    const d = copia(dados);
    d.carteira = c[1];
    const o = monta(d);
    verdade(o.resumo.carteira.sem_carteira, 'sem_carteira vazio');
    verdade(o.resumo.avisos.some((a) => a.indexOf('sem o filtro de responsável') >= 0), 'aviso');
    const Dd = JSON.parse(o.html.slice(o.html.lastIndexOf('APP(') + 4, o.html.lastIndexOf(',{"claro"')));
    igual(Dd.consultores.length, 0, 'consultores');
    verdade(Dd.lojas.every((l) => l[2] === -1), 'loja com responsável');
  });
});
prova('carteira velha (mais de 7 dias) sai com aviso da idade', () => {
  verdade(R0.avisos.some((a) => a.indexOf('carteira comercial de') === 0 && a.indexOf(' dias') > 0), 'sem aviso de idade');
});

/* ── 4. o HTML ────────────────────────────────────────────────────────── */
prova('abre no ESCURO, com título e nome da página', () => {
  verdade(html.indexOf('<html lang="pt-BR" data-tema="escuro">') >= 0);
  verdade(html.indexOf('<title>Painel de Eventos — Cars2You</title>') >= 0);
  verdade(html.indexOf('<h1>Painel de Eventos</h1>') >= 0);
});
prova('offline: nenhuma folha, fonte ou script de fora', () => {
  verdade(html.indexOf('<link') < 0, '<link');
  verdade(html.indexOf('src="http') < 0, 'src externo');
  verdade(html.indexOf('@import') < 0, '@import');
});
prova('CNPJ não vaza para a página', () => {
  const raw = [];
  dados.consultas.forEach((q, i) => {
    if (q.json.tabela !== 'lojas') return;
    JSON.parse(dados.mcp[i].json.structuredContent.rows[0][1]).forEach((l) => { if (l[3]) raw.push(String(l[3])); });
  });
  verdade(raw.length > 1000, 'poucos CNPJ na coleta');
  const vaza = raw.filter((c) => c.length >= 11 && html.indexOf(c) >= 0);
  igual(vaza.length, 0, 'CNPJ na página');
});
prova('ordem dos blocos: cartões, veículos ativos, lojistas, tabela, glossário, rodapé', () => {
  const pos = ['aria-label="Eventos ativos no dia"', 'id="g-ativos"', 'id="g-lojistas"', 'id="th-veic"', 'id="gloss"', 'class="rodape"']
    .map((m) => html.indexOf(m));
  verdade(pos.every((p, i) => p > 0 && (!i || p > pos[i - 1])), JSON.stringify(pos));
});
prova('gaveta na ordem do pedido: whitelabel, comitente, evento, responsável, data', () => {
  const pos = ['id="f-wl"', 'id="f-comit"', 'id="f-ev"', 'id="f-resp"', 'id="f-de"', 'id="f-ate"', 'id="limpar"'].map((m) => html.indexOf(m));
  verdade(pos.every((p, i) => p > 0 && (!i || p > pos[i - 1])), JSON.stringify(pos));
});
prova('acima do gráfico: indicador à esquerda, Todos/Novos à direita', () => {
  const a = html.indexOf('class="ctrl-graf"');
  verdade(a > 0 && html.indexOf('id="seg-kpi"') > a && html.indexOf('id="seg-modo"') > html.indexOf('id="seg-kpi"'));
  verdade(html.indexOf('.ctrl-graf{display:flex;justify-content:space-between') >= 0, 'space-between');
});
prova('glossário fora de qualquer <section>', () => {
  const antes = html.slice(0, html.indexOf('id="gloss"'));
  igual(antes.split('<section').length, antes.split('</section>').length, 'sections');
});
prova('todo termo do glossário é de regra vigente (sem "antes era")', () => {
  verdade(D.glossario.length >= 20);
  verdade(D.glossario.every((g) => g[1].toLowerCase().indexOf('antes era') < 0 && g[1].indexOf('desde ') < 0));
});

/* ── 5. as contas, refeitas do cru ────────────────────────────────────── */
prova('máscaras sem bit depois de hoje', () => {
  const lim = Math.pow(2, D.hoje + 1);
  verdade(D.acessos.every((a) => a[2] >= 0 && a[2] < lim), 'acessos');
  verdade(D.ofertas.every((o) => o[4] >= 0 && o[4] < lim), 'ofertas');
  verdade(D.logins.every((g) => g[2] > 0 && g[2] < lim), 'logins');
});
prova('veículos ativos por dia refeitos sem máscara (todos os dias)', () => {
  for (let d = 0; d <= D.hoje; d++) {
    const vs = {};
    D.negs.forEach((n) => { const e = D.eventos[n[0]]; if (e.d0 <= d && d <= e.d1) vs[n[1]] = 1; });
    igual(T0.dias[d].ativos, Object.keys(vs).length, 'dia ' + d);
    const nv = Object.keys(vs).filter((v) => D.veics[v][5] === d).length;
    igual(T0.dias[d].novos, nv, 'novos dia ' + d);
  }
});
prova('cada dia: novos ≤ ativos, e acesso/oferta/venda ≤ a base deles', () => T0.dias.forEach((g) => {
  verdade(g.novos <= g.ativos && g.acesso <= g.ativos && g.oferta <= g.ativos && g.venda <= g.ativos, 'dia ' + g.d);
  verdade(g.acesso_n <= g.novos && g.oferta_n <= g.novos && g.venda_n <= g.novos, 'novos dia ' + g.d);
  verdade(g.venda <= g.oferta, 'venda sem oferta no dia ' + g.d);
}));
prova('ofertaram e logaram no período refeitos do cru', () => {
  const of = {};
  D.ofertas.forEach((o) => { if (o[4]) of[o[1]] = 1; });
  igual(T0.tot_lojistas.ofertaram, Object.keys(of).length, 'ofertaram');
  const lg = {};
  D.logins.forEach((g) => { lg[g[0]] = 1; });
  igual(T0.tot_lojistas.logaram, Object.keys(lg).length, 'logaram');
});
prova('cartões: ativos + análise + vendidos + removidos = veículos', () => {
  const k = T0.kpi;
  igual(k.ativos + k.analise + k.vendidos + k.removidos, k.veiculos);
  igual(k.rem_cancelado + k.rem_sem_oferta + k.rem_rejeitado + k.rem_outros, k.removidos, 'partes dos removidos');
  igual(k.analise_comprador + k.analise_vendedor, k.analise);
  igual(k.aguardando + k.vendido, k.vendidos);
});
prova('cartões: os veículos dos eventos de hoje são os ativos do último dia', () => igual(T0.kpi.veiculos, T0.dias[D.hoje].ativos));
prova('o responsável reparte as lojas: a soma dos consultores + não distribuído dá o total', () => {
  ['logaram', 'acessaram', 'ofertaram', 'compraram'].forEach((k) => {
    let s = C({ resp: 'nd' }).tot_lojistas[k];
    D.consultores.forEach((c, i) => { s += C({ resp: String(i) }).tot_lojistas[k]; });
    igual(s, T0.tot_lojistas[k], k);
  });
});
prova('o responsável não mexe nos cartões nem nas barras', () => {
  const r = C({ resp: '0' });
  igual(JSON.stringify(r.kpi), JSON.stringify(T0.kpi), 'kpi');
  igual(r.dias.map((g) => g.ativos + '/' + g.novos).join(), T0.dias.map((g) => g.ativos + '/' + g.novos).join(), 'barras');
});
prova('De = Até = d repete o dia d do período inteiro', () => [0, 7, 15, 22, D.hoje].forEach((d) => {
  const r = C({ de: String(d), ate: String(d) });
  ['logaram', 'acessaram', 'ofertaram', 'compraram'].forEach((k) => igual(r.tot_lojistas[k], T0.lojistas[d][k], k + ' dia ' + d));
  ['ativos', 'novos', 'acesso', 'oferta', 'venda'].forEach((k) => igual(r.dias[0][k], T0.dias[d][k], k + ' dia ' + d));
}));
prova('De > Até é o mesmo período invertido', () => igual(JSON.stringify(C({ de: '20', ate: '10' }).dias), JSON.stringify(C({ de: '10', ate: '20' }).dias)));
prova('filtro de evento: os veículos do período são os veículos do evento', () => [0, 5, 40, 120, D.eventos.length - 1].forEach((i) => {
  const vs = {};
  D.negs.forEach((n) => { if (n[0] === i) vs[n[1]] = 1; });
  igual(C({ ev: String(i) }).veiculos_periodo, Object.keys(vs).length, 'evento ' + D.eventos[i].nome);
}));
prova('filtro de canal: só veículos de eventos que alvejam o canal', () => D.canais.forEach((c) => {
  const vs = {};
  D.negs.forEach((n) => { if (D.eventos[n[0]].wls.indexOf(c[0]) >= 0) vs[n[1]] = 1; });
  igual(C({ wl: String(c[0]) }).veiculos_periodo, Object.keys(vs).length, 'canal ' + c[0]);
}));
prova('filtro de comitente: os veículos são os que ele anuncia', () => D.comitentes.forEach((c, i) => {
  const vs = {};
  D.negs.forEach((n) => { if (n[2] === i) vs[n[1]] = 1; });
  igual(C({ comit: String(i) }).veiculos_periodo, Object.keys(vs).length, c);
}));
prova('tabela: uma linha por veículo do período', () => {
  igual(T0.veiculos.length, T0.veiculos_periodo);
  const vistos = {};
  T0.veiculos.forEach((r) => { verdade(!vistos[r.v], 'repetido'); vistos[r.v] = 1; });
});
prova('tabela: lances e maior oferta refeitos do cru', () => {
  const lances = {};
  const maior = {};
  D.ofertas.forEach((o) => {
    const v = D.negs[o[0]][1];
    lances[v] = (lances[v] || 0) + o[2];
    maior[v] = Math.max(maior[v] || 0, o[3]);
  });
  T0.veiculos.forEach((r) => {
    igual(r.lances, lances[r.v] || 0, 'lances ' + r.v);
    igual(r.maior, maior[r.v] === undefined ? null : maior[r.v], 'maior ' + r.v);
  });
});
prova('venda só em 2, 3 ou 7, e o comprador é a loja da oferta vencedora', () => {
  T0.veiculos.forEach((r) => { if (r.comprador !== null) verdade([2, 3, 7].indexOf(r.status) >= 0, 'status ' + r.status); });
  const vendidos = T0.veiculos.filter((r) => r.comprador !== null).length;
  verdade(vendidos > 100, 'poucas vendas na tabela: ' + vendidos);
});

console.log('%d provas · %d ok%s', ok + falhas.length, ok, falhas.length ? '' : ' ✓');
falhas.forEach((f) => console.log('  ✗ ' + f));
console.log('resumo: %d KB · %d eventos · %d negociações · %d veículos · %d lojas · %d aviso(s)',
  Math.round(R0.bytes_html / 1024), R0.eventos, R0.negociacoes, R0.veiculos, R0.lojas, R0.avisos.length);
process.exit(falhas.length ? 1 : 0);
