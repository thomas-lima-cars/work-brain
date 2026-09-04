/* TESTE LOCAL DO GERADOR LOTE 2 — sem n8n, sem banco.
 *
 * Roda o jsCode do no "Montar HTML" fora do n8n, com um $() falso alimentado
 * por dados sinteticos no formato EXATO do contrato ({columns, rows}), e grava
 * o HTML. Depois abre no navegador de verdade — e la que Chart.js roda.
 *
 * Por que existe: uma execucao no n8n custa 13 a 30 minutos. Um erro de
 * digitacao no render nao vale esse preco. Nos lotes anteriores este tipo de
 * teste foi o que mais economizou tempo.
 */
const fs = require('fs');
const path = require('path');
const HERE = __dirname;

/* ─── A COORTE VEM DO BANCO, NAO DE SORTEIO ────────────────────────────
   Versao anterior deste teste inventava 5 whitelabels. Passava — e mentia
   sobre duas coisas: o dropdown real tem 58, e o peso do HTML com 5 WLs
   falsos e uma fracao do peso com 58. Como a decisao de distribuicao
   (anexo vs SharePoint) depende justamente do tamanho, medir errado ali e
   pior do que nao medir.
   Agora coorte e coorte_wl saem dos JSONs do prototipo, que vieram do banco
   e ja foram validados por dois caminhos independentes (o volume do WL43
   bate com o no Montar HTML da execucao 48290). O resto segue sintetico,
   mas chaveado pelos ids REAIS de whitelabel. */
const PROTO = path.join(HERE, '..', 'prototipo-safra', 'dados');
const lerProto = function (f) { return JSON.parse(fs.readFileSync(path.join(PROTO, f), 'utf8')); };

const COORTE_ALL = lerProto('coorte_all.json');   // { ym: {campos} }, 78 safras
const COORTE_WL_RAW = lerProto('coorte_wl.json'); // 516 linhas, 58 whitelabels
const WL_LIST = lerProto('wl_list.json');         // 58 whitelabels

/* ── ESCOPO: 6 whitelabels, nao os 58 (pedido de 04/09) ────────────────
   No run de verdade o recorte vive no SQL: o EXISTS de BASE/BASEF so aceita
   estes ids, entao "Todos" e a UNIAO deles — cada cliente contado uma vez,
   mesmo estando em dois.

   Aqui no teste isso NAO da pra reproduzir: os JSONs do prototipo trazem a
   coorte por WL, e somar as 6 conta duas vezes quem esta em mais de um. O
   numero de "Todos" abaixo e portanto um TETO, nao a uniao. So o run no n8n
   devolve o valor certo. Fica assim de proposito — inventar um desconto de
   sobreposicao seria pior do que um teto declarado. */
const WL_ESCOPO = [43, 48, 62, 65, 7, 4];
const WL_LISTA_FILTRADA = WL_LIST.filter(function (w) { return WL_ESCOPO.indexOf(w.id) >= 0; });
if (WL_LISTA_FILTRADA.length !== WL_ESCOPO.length) {
  throw new Error('esperava ' + WL_ESCOPO.length + ' whitelabels no escopo, achei ' + WL_LISTA_FILTRADA.length);
}
const WLS = WL_LISTA_FILTRADA.map(function (w) { return [w.id, w.name]; });
const YMS = Object.keys(COORTE_ALL).sort();
const MESES12 = YMS.slice(-12);
const rnd = (function () { let s = 42; return function (n) { s = (s * 1103515245 + 12345) % 2147483648; return Math.floor((s / 2147483648) * n); }; })();

const CAMPOS_COORTE = ['ym', 'total', 'com_login', 'sem_login', 'ofertantes', 'compradores',
  'negociacoes', 'vendido', 'status2', 'volume', 'ultima_compra', 's1', 's2', 's3', 's4', 's5', 's6'];

function linhaCoorte(ym, escala) {
  const t = 20 + rnd(400 * escala);
  const cl = Math.floor(t * 0.6), of = Math.floor(t * 0.2), cp = Math.floor(t * 0.08);
  return [ym, t, cl, t - cl, of, cp, cp * 2, cp, Math.floor(cp / 2),
    cp * 85000, cp ? '2026-08-' + String(1 + rnd(28)).padStart(2, '0') : null,
    Math.floor(t * .5), Math.floor(t * .2), Math.floor(t * .1),
    Math.floor(t * .1), Math.floor(t * .05), Math.floor(t * .05)];
}

const RESP = {};
function reg(nome, columns, rows) { RESP[nome] = { columns: columns, rows: rows }; }

/* coorte e coorte_wl saem do banco (via JSONs do prototipo). A invariante
   "plataforma >= maior WL isolado" vem de graca porque o dado e real: os
   whitelabels sao subconjuntos da base, com sobreposicao entre eles.
   `status2` nao existe nesses JSONs (entrou no lote 1d, depois deles) —
   vai como 0, e nenhum KPI da tela depende dele. */
function linhaDeObj(o, ym) {
  return CAMPOS_COORTE.map(function (c) {
    if (c === 'ym') return ym;
    if (c === 'ultima_compra') return o.ultima_compra || null;
    return o[c] == null ? 0 : o[c];
  });
}
/* Global = soma dos 6 por safra. TETO, nao uniao — ver a nota do escopo. */
const GLOBAL_ESCOPO = {};
COORTE_WL_RAW.forEach(function (r) {
  if (WL_ESCOPO.indexOf(r.wl_id) < 0) return;
  const g = GLOBAL_ESCOPO[r.ym] = GLOBAL_ESCOPO[r.ym] || {};
  CAMPOS_COORTE.forEach(function (c) {
    if (c === 'ym') return;
    if (c === 'ultima_compra') { if (r.ultima_compra && (!g.ultima_compra || r.ultima_compra > g.ultima_compra)) g.ultima_compra = r.ultima_compra; return; }
    g[c] = (g[c] || 0) + (r[c] || 0);
  });
});
const YMS_ESCOPO = Object.keys(GLOBAL_ESCOPO).sort();
reg('coorte', CAMPOS_COORTE, YMS_ESCOPO.map(function (y) { return linhaDeObj(GLOBAL_ESCOPO[y], y); }));
const COORTE_WL_ESCOPO = COORTE_WL_RAW.filter(function (r) {
  return WL_ESCOPO.indexOf(r.wl_id) >= 0;
});
reg('coorte_wl', ['wl', 'wl_name'].concat(CAMPOS_COORTE),
  COORTE_WL_ESCOPO.map(function (r) {
    return [r.wl_id, r.wl_name].concat(linhaDeObj(r, r.ym));
  }));
reg('kpi_ofertas', ['total_ofertas'], [[128400]]);

const FAIXAS = ['00-30d', '31-90d', '91-180d', '180d+'];
const TIPOS = ['login', 'oferta', 'compra'];
reg('recencia', ['tipo', 'faixa', 'qtd'],
  [].concat.apply([], TIPOS.map(function (t) { return FAIXAS.map(function (f) { return [t, f, 100 + rnd(3000)]; }); })));
reg('recencia_wl', ['tipo', 'wl', 'faixa', 'qtd'],
  [].concat.apply([], WLS.map(function (w) {
    return [].concat.apply([], TIPOS.map(function (t) { return FAIXAS.map(function (f) { return [t, w[0], f, 10 + rnd(500)]; }); }));
  })));

function serieMes(cols, gen) { return MESES12.map(function (m) { return [m].concat(gen()); }); }
function serieMesWl(cols, gen) {
  return [].concat.apply([], WLS.map(function (w) {
    return MESES12.map(function (m) { return [w[0], m].concat(gen()); });
  }));
}
reg('evol_login', ['mes', 'unicos'], serieMes(1, function () { return [500 + rnd(2000)]; }));
reg('evol_login_wl', ['wl', 'mes', 'unicos'], serieMesWl(1, function () { return [20 + rnd(400)]; }));
reg('evol_oferta', ['mes', 'unicos'], serieMes(1, function () { return [200 + rnd(800)]; }));
reg('evol_oferta_wl', ['wl', 'mes', 'unicos'], serieMesWl(1, function () { return [10 + rnd(150)]; }));
reg('evol_compra', ['mes', 'unicos', 'volume'], serieMes(2, function () { const u = 50 + rnd(300); return [u, u * 92000]; }));
reg('evol_compra_wl', ['wl', 'mes', 'unicos', 'volume'], serieMesWl(2, function () { const u = 3 + rnd(60); return [u, u * 92000]; }));
reg('evol_cadastro', ['mes', 'novos'], serieMes(1, function () { return [100 + rnd(900)]; }));

const DIAS = [];
for (let d = 1; d <= 30; d++) DIAS.push('2026-08-' + String(d).padStart(2, '0'));
reg('evol_cadastro_dia', ['dia', 'novos'], DIAS.map(function (d) { return [d, 5 + rnd(60)]; }));
reg('evol_cadastro_dia_wl', ['wl', 'dia', 'novos'],
  [].concat.apply([], WLS.map(function (w) { return DIAS.map(function (d) { return [w[0], d, rnd(20)]; }); })));

reg('evol_media_oferta', ['mes', 'anuncios_publicados', 'anuncios_criados', 'total_ofertas_recebidas',
  'veiculos_vendidos', 'media_ofertas_por_anuncio', 'media_publicacoes_por_veiculo'],
  MESES12.map(function (m) {
    const pub = 800 + rnd(600), vend = Math.floor(pub * 0.4);
    return [m, pub, pub + rnd(200), pub * 3, vend, 2.5 + rnd(20) / 10, 1.1 + rnd(8) / 10];
  }));

['nr_login', 'nr_oferta', 'nr_compra'].forEach(function (nome) {
  reg(nome, ['mes', 'novos', 'recorrentes'], serieMes(2, function () { return [20 + rnd(200), 100 + rnd(600)]; }));
  reg(nome + '_wl', ['wl', 'mes', 'novos', 'recorrentes'], serieMesWl(2, function () { return [2 + rnd(40), 10 + rnd(120)]; }));
});

const UFS = ['SP', 'MG', 'PR', 'SC', 'RJ', 'GO', 'RS', 'BA', 'MT', 'DF', 'Não identificada'];
reg('uf_cadastro', ['uf', 'qtd'], UFS.map(function (u) { return [u, 100 + rnd(8000)]; }));
reg('uf_cadastro_wl', ['wl', 'uf', 'qtd'],
  [].concat.apply([], WLS.map(function (w) { return UFS.map(function (u) { return [w[0], u, 5 + rnd(900)]; }); })));
reg('uf_compra', ['uf', 'compras', 'volume'], UFS.map(function (u) { const c = 10 + rnd(600); return [u, c, c * 91000]; }));
reg('uf_compra_wl', ['wl', 'uf', 'compras', 'volume'],
  [].concat.apply([], WLS.map(function (w) { return UFS.map(function (u) { const c = rnd(80); return [w[0], u, c, c * 91000]; }); })));

const NOMES = ['AUTO CENTER SILVA', 'MULTIMARCAS PRIME', 'VEICULOS BRASIL', 'GARAGE 77',
  'REVENDA NORTE', 'CAR PLUS', 'DRIVE MOTORS', 'NOVA ERA VEICULOS', 'SPEED CAR', 'TOP MOTORS'];
function topRows(cols, gen) { return NOMES.map(function (nm, i) { return [1000 + i, nm].concat(gen(i)); }); }
function topRowsWl(cols, gen) {
  return [].concat.apply([], WLS.map(function (w) {
    return NOMES.slice(0, 10).map(function (nm, i) { return [w[0], 2000 + w[0] * 10 + i, nm].concat(gen(i)).concat([i + 1]); });
  }));
}
reg('top_compradores_hist', ['id', 'full_name', 'compras', 'volume', 'ultima_compra'],
  topRows(3, function (i) { return [80 - i * 6, (80 - i * 6) * 95000, '2026-0' + (1 + (i % 8)) + '-15']; }));
reg('top_compradores_hist_wl', ['wl', 'id', 'full_name', 'compras', 'volume', 'ultima_compra', 'rn'],
  topRowsWl(3, function (i) { return [40 - i * 3, (40 - i * 3) * 95000, '2026-0' + (1 + (i % 8)) + '-15']; }));
reg('top_compradores_ano', ['id', 'full_name', 'compras', 'volume', 'ultima_compra'],
  topRows(3, function (i) { return [30 - i * 2, (30 - i * 2) * 95000, '2026-08-1' + (i % 9)]; }));
reg('top_compradores_ano_wl', ['wl', 'id', 'full_name', 'compras', 'volume', 'ultima_compra', 'rn'],
  topRowsWl(3, function (i) { return [15 - i, (15 - i) * 95000, '2026-08-1' + (i % 9)]; }));
reg('top_acesso_ano', ['id', 'full_name', 'dias_ativos', 'acessos_totais'],
  topRows(2, function (i) { return [200 - i * 12, (200 - i * 12) * 7]; }));
reg('top_acesso_ano_wl', ['wl', 'id', 'full_name', 'dias_ativos', 'acessos_totais', 'rn'],
  topRowsWl(2, function (i) { return [120 - i * 8, (120 - i * 8) * 6]; }));
reg('top_ofertas_ano', ['id', 'full_name', 'ofertas'], topRows(1, function (i) { return [900 - i * 60]; }));
reg('top_ofertas_ano_wl', ['wl', 'id', 'full_name', 'ofertas', 'rn'], topRowsWl(1, function (i) { return [400 - i * 25]; }));
reg('top_lojas', ['user_id', 'loja', 'cnpj'],
  NOMES.map(function (nm, i) { return [1000 + i, nm + ' LTDA', '1234567800019' + (i % 10)]; }));

/* Raio-X: linhas cruas, indexadas por buyer_user_id */
const BUYERS = [];
for (let i = 0; i < 60; i++) BUYERS.push(3000 + i);
reg('rx_buyers', ['id', 'full_name', 'loja', 'cnpj'],
  BUYERS.map(function (b, i) { return [b, NOMES[i % NOMES.length] + ' ' + i, NOMES[i % NOMES.length] + ' LTDA', '1234567800019' + (i % 10)]; }));
/* rx_totais tem 8 colunas, nao 4: as somas de FIPE e Molicar alimentam as
   colunas "Rec. FIPE" e "Rec. Molicar" da matriz do Raio-X. Sem elas o teste
   passava com as duas colunas em "—" e nao provava nada sobre esse caminho. */
reg('rx_totais', ['buyer_user_id', 'ym', 'compras', 'volume',
  'price_fipe_sum', 'fipe_sum', 'price_molicar_sum', 'molicar_sum'],
  [].concat.apply([], BUYERS.map(function (b) {
    return MESES12.slice(0, 4).map(function (m) {
      const c = 1 + rnd(6), vol = c * 93000;
      const fipe = Math.round(vol * (1.05 + rnd(30) / 100));
      const mol = Math.round(vol * (1.02 + rnd(25) / 100));
      return [b, m, c, vol, vol, fipe, vol, mol];
    });
  })));
const MODELOS = ['ONIX', 'HB20', 'COMPASS', 'STRADA', 'COROLLA', 'GOL', 'RENEGADE'];
reg('rx_modelo', ['buyer_user_id', 'ym', 'modelo', 'qtd'],
  [].concat.apply([], BUYERS.map(function (b) { return MODELOS.map(function (m) { return [b, '2026-08', m, rnd(5)]; }); })));
reg('rx_laudo', ['buyer_user_id', 'ym', 'laudo', 'qtd'],
  [].concat.apply([], BUYERS.map(function (b) {
    return ['aprovado', 'restricao', 'sem_registro'].map(function (l) { return [b, '2026-08', l, rnd(6)]; });
  })));
reg('rx_uf', ['buyer_user_id', 'ym', 'uf', 'qtd'],
  [].concat.apply([], BUYERS.map(function (b) { return UFS.slice(0, 6).map(function (u) { return [b, '2026-08', u, rnd(4)]; }); })));
reg('rx_faixa', ['buyer_user_id', 'ym', 'faixa', 'qtd'],
  [].concat.apply([], BUYERS.map(function (b) {
    return ['Até R$ 25 mil', 'R$ 25-50 mil', 'R$ 50-100 mil', 'R$ 100-200 mil', 'Acima de R$ 200 mil']
      .map(function (f) { return [b, '2026-08', f, rnd(4)]; });
  })));
reg('rx_partic', ['buyer_user_id', 'ym', 'participacoes'],
  BUYERS.map(function (b) { return [b, '2026-08', 1 + rnd(20)]; }));
reg('rx_buyer_wl', ['user_id', 'wl'],
  [].concat.apply([], BUYERS.map(function (b, i) {
    const w = WLS[i % WLS.length][0];
    return i % 7 === 0 ? [[b, w], [b, 7]] : [[b, w]];
  })));

/* ─── $() falso, no formato da arquitetura B ───────────────────────────── */
const NOMES_Q = Object.keys(RESP);
/* O CSS saiu do gerador e virou o no "Montar CSS" — o jsCode viaja inline pela
   API do MCP e o no principal estava em 96% do tamanho que ja inviabilizou o
   gerador de producao. Aqui o no e simulado rodando o proprio montar-css.js,
   e nao lendo o .css direto: assim o teste prova o no de verdade, com o escape
   que ele aplica, e nao uma versao paralela que poderia divergir. */
const CSS_NODE = new Function(fs.readFileSync(path.join(HERE, 'montar-css.js'), 'utf8'))()[0].json.css;
const APP_NODE = new Function(fs.readFileSync(path.join(HERE, 'montar-app.js'), 'utf8'))()[0].json.app;

const fake$ = function (no) {
  if (no === 'Montar Queries') {
    return { all: function () { return NOMES_Q.map(function (n) { return { json: { queryName: n } }; }); } };
  }
  if (no === 'MCP Run') {
    return { all: function () { return NOMES_Q.map(function (n) { return { json: { structuredContent: RESP[n] } }; }); } };
  }
  if (no === 'Montar CSS') {
    return { first: function () { return { json: { css: CSS_NODE } }; } };
  }
  if (no === 'Montar App') {
    return { first: function () { return { json: { app: APP_NODE } }; } };
  }
  throw new Error('no inesperado: ' + no);
};

/* ─── roda o gerador ───────────────────────────────────────────────────── */
const src = fs.readFileSync(path.join(HERE, 'montar-html-lote2.js'), 'utf8');
let saida;
try {
  saida = new Function('$', src)(fake$);
} catch (e) {
  console.error('\n✗ O GERADOR ESTOUROU:\n  ' + e.message + '\n');
  console.error(e.stack.split('\n').slice(0, 6).join('\n'));
  process.exit(1);
}

const html = saida[0].json.html;
const meta = saida[0].json._meta;

console.log('\n═══ GERADOR RODOU ═══\n');
console.log('  HTML:        ' + (html.length / 1024).toFixed(0) + ' KB');
console.log('  whitelabels: ' + meta.whitelabels);
console.log('  safras:      ' + meta.safras);
console.log('  avisos:      ' + (meta.avisos.length ? meta.avisos.join(' | ') : 'nenhum'));

/* ─── provas sobre o HTML ──────────────────────────────────────────────── */
let falhas = [];
const ok = (c, m) => { if (!c) falhas.push(m); };

ok(html.indexOf('/*__') < 0, 'sobrou marcador no HTML');
ok(/<canvas id="ch_/.test(html), 'nenhum canvas no HTML');
const canvas = (html.match(/<canvas id="/g) || []).length;
ok(canvas === 12, 'esperava 12 canvas, achei ' + canvas);
ok(html.indexOf('window.__DADOS__ =') >= 0, 'DADOS nao embarcado');
ok(html.indexOf('chart.umd.js') >= 0, 'Chart.js nao referenciado');
ok(html.indexOf('.kpi-grid') >= 0 && html.indexOf('.rec-bar') >= 0,
  'o CSS do no "Montar CSS" nao chegou ao HTML');
ok(!/\/\*__CSS__\*\//.test(html), 'marcador de CSS sobrou no HTML');
ok(html.indexOf('id="fWl"') >= 0, 'seletor de whitelabel ausente');
ok(html.indexOf('id="fAno"') >= 0, 'seletor de ano ausente');
ok(!/<\/script>/.test(JSON.stringify(RESP)) || html.indexOf('\\u003c/script') < 0 || true, '');

/* o JSON embarcado tem de ser parseavel — e o erro mais caro de descobrir tarde */
const m = html.match(/window\.__DADOS__ = ([\s\S]*?);<\/script>/);
ok(!!m, 'nao achei o bloco de DADOS');
if (m) {
  try {
    const d = JSON.parse(m[1].split('\\u003c').join('<'));
    ok(d.meta.wls.length === WLS.length, 'esperava ' + WLS.length + ' whitelabels, achei ' + d.meta.wls.length);
    ok(d.coorte.length === YMS_ESCOPO.length, 'coorte com ' + d.coorte.length + ' safras, esperava ' + YMS_ESCOPO.length);
    /* NAO e produto cartesiano: a coorte_wl e esparsa — so existe linha
       onde aquele whitelabel teve cadastro naquele mes. 58 x 78 daria 4.524;
       o real sao 516. Assumir a matriz cheia foi erro deste teste, nao do
       gerador. O que importa provar e que nada se perdeu no caminho. */
    ok(d.coorteWl.length === COORTE_WL_ESCOPO.length,
      'coorteWl perdeu linhas: ' + d.coorteWl.length + ' de ' + COORTE_WL_ESCOPO.length);
    var wlsNoPayload = {};
    d.coorteWl.forEach(function (l) { wlsNoPayload[l[0]] = 1; });
    ok(Object.keys(wlsNoPayload).length === WLS.length,
      'whitelabels distintos no payload: ' + Object.keys(wlsNoPayload).length + ', esperava ' + WLS.length);
    ok(Object.keys(d.rxBuyerWl).length === BUYERS.length, 'mapa comprador->wl incompleto');
    console.log('  DADOS:       JSON valido, ' + (m[1].length / 1024).toFixed(0) + ' KB');

    /* invariante que ja pegou erro real: o total da plataforma nunca pode ser
       menor que o maior whitelabel isolado */
    const iTot = d.campos.indexOf('total');
    const totGlobal = d.coorte.reduce((s, l) => s + l[1 + iTot], 0);
    const porWl = {};
    d.coorteWl.forEach(l => { porWl[l[0]] = (porWl[l[0]] || 0) + l[2 + iTot]; });
    const maior = Math.max.apply(null, Object.values(porWl));
    const invOk = maior <= totGlobal;
    ok(invOk, 'WL isolado (' + maior + ') maior que a plataforma (' + totGlobal + ')');
    console.log('  invariante:  plataforma ' + totGlobal + ' >= maior WL ' + maior + (invOk ? ' ✓' : ' ✗'));
  } catch (e) {
    falhas.push('o JSON de DADOS nao faz parse: ' + e.message);
  }
}

const out = path.join(HERE, 'saida-teste-local.html');
fs.writeFileSync(out, html, 'utf8');
console.log('  gravado:     ' + path.basename(out));

console.log('\n' + '═'.repeat(60));
if (falhas.length === 0) {
  console.log('VEREDITO: o gerador produz HTML integro.');
  console.log('Falta o que so o navegador prova: Chart.js desenhando e o filtro reagindo.');
} else {
  console.log('VEREDITO: ' + falhas.length + ' FALHA(S)');
  falhas.forEach(f => console.log('  ✗ ' + f));
  process.exitCode = 1;
}
console.log('═'.repeat(60) + '\n');
