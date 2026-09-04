/* ══════════════════════════════════════════════════════════════════════
   GERADOR LOTE 2 — PARTE 1/4: INGESTAO E MODELO DE DADOS

   Roda dentro do no Code do n8n. Le as respostas do MCP e monta UM objeto
   `DADOS`, que e serializado pra dentro do HTML. Daí pra frente quem
   trabalha e o navegador.

   A diferenca de fundo pro gerador antigo: aquele assava os valores no HTML
   (`<div class="kpi-value">29.010</div>`) e por isso so podia ser filtrado
   por reescrita de texto. Este embarca DADO e deixa o render pro cliente —
   e por isso o filtro alcanca a pagina inteira, e nao 18 valores.

   CONTRATO DE ENTRADA — identico ao do gerador de producao:
     $('Montar Queries').all()[i].json.queryName
     $('MCP Run').all()[i].json.structuredContent = { columns:[], rows:[[]] }
   Mantido de proposito: e o mesmo que a arquitetura B ja entrega, entao
   este no entra no lugar do antigo sem mexer em nenhum no anterior.
   ══════════════════════════════════════════════════════════════════════ */

const qn = $('Montar Queries').all().map(function (i) { return i.json.queryName; });
const outs = $('MCP Run').all().map(function (i) { return i.json.structuredContent || {}; });

function idxAll(name) {
  const arr = [];
  for (let i = 0; i < qn.length; i++) { if (qn[i] === name) arr.push(i); }
  return arr;
}
/* zipn cruza columns com rows -> array de objetos. zipnRaw devolve as linhas
   cruas (mais barato quando o consumidor indexa por posicao, caso do Raio-X). */
function zipn(name) {
  let r = [];
  idxAll(name).forEach(function (k) {
    const sc = outs[k] || {}, cols = sc.columns || [], rows = sc.rows || [];
    r = r.concat(rows.map(function (row) {
      const o = {}; cols.forEach(function (c, i) { o[c] = row[i]; }); return o;
    }));
  });
  return r;
}
function zipnRaw(name) {
  let r = [];
  idxAll(name).forEach(function (k) { r = r.concat((outs[k] || {}).rows || []); });
  return r;
}

const num = function (v) { return v == null ? 0 : (typeof v === 'number' ? v : Number(v) || 0); };

/* ─── 1. COORTE — o eixo do relatorio ─────────────────────────────────
   coorte    = uma linha por safra (mes de cadastro) da plataforma inteira
   coorte_wl = uma linha por (whitelabel, safra)
   As safras sao particoes DISJUNTAS (cada cliente tem exatamente um mes de
   cadastro), entao somar meses reproduz totais. E o que permite recortar
   por ano/mes no cliente sem voltar ao banco. Vale por whitelabel tambem —
   dentro de um WL as safras seguem disjuntas.
   O total da plataforma sai da `coorte`, NUNCA da soma da `coorte_wl`:
   quem esta em N whitelabels aparece N vezes na segunda. */
const CAMPOS = ['total', 'com_login', 'sem_login', 'ofertantes', 'compradores',
  'negociacoes', 'vendido', 'status2', 'volume', 's1', 's2', 's3', 's4', 's5', 's6'];

function compactaCoorte(rows, comWl) {
  return rows.map(function (r) {
    const linha = comWl ? [num(r.wl), String(r.ym || '')] : [String(r.ym || '')];
    CAMPOS.forEach(function (c) { linha.push(num(r[c])); });
    /* ultima_compra viaja como string ISO curta ou null — o cliente so faz MAX */
    linha.push(r.ultima_compra ? String(r.ultima_compra).slice(0, 10) : null);
    return linha;
  });
}

const coorte = zipn('coorte');
const coorteWl = zipn('coorte_wl');

/* A lista de whitelabels sai da propria coorte_wl — nao precisa de query
   separada, e assim o dropdown nunca oferece WL sem dado por tras.
   Decisao de 04/09: manter os 58, inclusive os de total zero. */
const wlMap = {};
coorteWl.forEach(function (r) {
  const id = num(r.wl);
  if (!wlMap[id]) wlMap[id] = { id: id, nome: String(r.wl_name || ('WL ' + id)), total: 0 };
  wlMap[id].total += num(r.total);
});
const WLS = Object.keys(wlMap).map(function (k) { return wlMap[k]; })
  .sort(function (a, b) { return b.total - a.total || a.id - b.id; });

/* ─── 2. SERIES POR MES — global e por whitelabel ─────────────────────
   Formato [chave, ...valores] pra encolher o JSON: nome de campo repetido
   58 vezes por serie e o que faz um relatorio destes passar de 1 MB. */
function serie(nome, chaveCol, cols) {
  return zipn(nome).map(function (r) {
    return [String(r[chaveCol] || '')].concat(cols.map(function (c) { return num(r[c]); }));
  });
}
function serieWl(nome, chaveCol, cols) {
  return zipn(nome).map(function (r) {
    return [num(r.wl), String(r[chaveCol] || '')].concat(cols.map(function (c) { return num(r[c]); }));
  });
}

const DADOS = {
  meta: {
    gerado: new Date().toISOString(),
    /* o relatorio passou a cobrir a plataforma inteira; o titulo nao pode
       mais dizer "Canal de Vendas C6 Auto" quando o recorte e "Todos" */
    escopo: 'plataforma',
    wls: WLS.map(function (w) { return [w.id, w.nome, w.total]; })
  },

  coorte: compactaCoorte(coorte, false),
  coorteWl: compactaCoorte(coorteWl, true),
  campos: CAMPOS,

  /* total_ofertas e o unico KPI que nao sai da coorte: e contagem bruta de
     ofertas, nao de compradores. Global e por WL. */
  ofertas: num((zipn('kpi_ofertas')[0] || {}).total_ofertas),

  rec: serie('recencia', 'faixa', ['qtd']).map(function (x, i) {
    return [zipn('recencia')[i].tipo, x[0], x[1]];
  }),
  recWl: zipn('recencia_wl').map(function (r) {
    return [num(r.wl), String(r.tipo || ''), String(r.faixa || ''), num(r.qtd)];
  }),

  evLogin: serie('evol_login', 'mes', ['unicos']),
  evLoginWl: serieWl('evol_login_wl', 'mes', ['unicos']),
  evOferta: serie('evol_oferta', 'mes', ['unicos']),
  evOfertaWl: serieWl('evol_oferta_wl', 'mes', ['unicos']),
  evCompra: serie('evol_compra', 'mes', ['unicos', 'volume']),
  evCompraWl: serieWl('evol_compra_wl', 'mes', ['unicos', 'volume']),
  evCadDia: serie('evol_cadastro_dia', 'dia', ['novos']).map(function (x) {
    return [String(x[0]).slice(0, 10), x[1]];
  }),
  evCadDiaWl: zipn('evol_cadastro_dia_wl').map(function (r) {
    return [num(r.wl), String(r.dia || '').slice(0, 10), num(r.novos)];
  }),

  /* evol_cadastro NAO tem versao _wl e nao precisa: o `ym` da coorte_wl JA E
     o mes de cadastro. A serie por whitelabel e derivada no cliente. */
  evCadastro: serie('evol_cadastro', 'mes', ['novos']),

  /* MEDIA DE OFERTAS — os 3 graficos do lado da OFERTA.
     Nao tem, e nao pode ter, recorte por whitelabel: a query sai de
     advertisements + shops e nao passa por usuario nenhum. "Whitelabel de um
     anuncio" nao existe no modelo — a chave ali e advertisements.shop_id, e o
     Feirao C6 roda no mesmo WL 7 do IGA, entao filtrar por WL traria evento
     do Itau pra dentro do recorte do C6.
     Fica global em qualquer recorte, e o HTML rotula isso na cara. */
  evMedia: zipn('evol_media_oferta').map(function (r) {
    return [String(r.mes || ''), num(r.media_ofertas_por_anuncio),
      num(r.media_publicacoes_por_veiculo), num(r.anuncios_publicados),
      num(r.veiculos_vendidos), num(r.total_ofertas_recebidas),
      num(r.anuncios_criados)];
  }),

  nrLogin: serie('nr_login', 'mes', ['novos', 'recorrentes']),
  nrLoginWl: serieWl('nr_login_wl', 'mes', ['novos', 'recorrentes']),
  nrOferta: serie('nr_oferta', 'mes', ['novos', 'recorrentes']),
  nrOfertaWl: serieWl('nr_oferta_wl', 'mes', ['novos', 'recorrentes']),
  nrCompra: serie('nr_compra', 'mes', ['novos', 'recorrentes']),
  nrCompraWl: serieWl('nr_compra_wl', 'mes', ['novos', 'recorrentes']),

  ufCad: serie('uf_cadastro', 'uf', ['qtd']),
  ufCadWl: serieWl('uf_cadastro_wl', 'uf', ['qtd']),
  ufCom: serie('uf_compra', 'uf', ['compras', 'volume']),
  ufComWl: serieWl('uf_compra_wl', 'uf', ['compras', 'volume'])
};

/* ─── 3. TOP 10 ───────────────────────────────────────────────────────
   Global vem de LIMIT 10; por WL vem de ROW_NUMBER() OVER (PARTITION BY wl).
   Formato [id, nome, m1, m2, m3] — as metricas mudam por ranking. */
function top(nome, cols) {
  return zipn(nome).map(function (r) {
    return [num(r.id), String(r.full_name || '')].concat(cols.map(function (c) {
      return c === 'ultima_compra' ? (r[c] ? String(r[c]).slice(0, 10) : null) : num(r[c]);
    }));
  });
}
function topWl(nome, cols) {
  return zipn(nome).map(function (r) {
    return [num(r.wl), num(r.id), String(r.full_name || '')].concat(cols.map(function (c) {
      return c === 'ultima_compra' ? (r[c] ? String(r[c]).slice(0, 10) : null) : num(r[c]);
    }));
  });
}
const M_COMPRA = ['compras', 'volume', 'ultima_compra'];
DADOS.topHist = top('top_compradores_hist', M_COMPRA);
DADOS.topHistWl = topWl('top_compradores_hist_wl', M_COMPRA);
DADOS.topAno = top('top_compradores_ano', M_COMPRA);
DADOS.topAnoWl = topWl('top_compradores_ano_wl', M_COMPRA);
DADOS.topAcesso = top('top_acesso_ano', ['dias_ativos', 'acessos_totais']);
DADOS.topAcessoWl = topWl('top_acesso_ano_wl', ['dias_ativos', 'acessos_totais']);
DADOS.topOfertas = top('top_ofertas_ano', ['ofertas']);
DADOS.topOfertasWl = topWl('top_ofertas_ano_wl', ['ofertas']);

/* Loja + CNPJ como subtitulo do nome nos rankings. CNPJ chega cru (14
   digitos). Usuario com mais de uma loja: nomes juntados com ' / ' e CNPJ da
   primeira — a query ja vem ordenada por us.created_at. Sem loja: nada e
   exibido, nunca 'Loja nao identificada'. */
function fmtCnpj(c) {
  c = String(c == null ? '' : c).replace(/\D/g, '');
  if (c.length !== 14) return '';
  return c.slice(0, 2) + '.' + c.slice(2, 5) + '.' + c.slice(5, 8) + '/' + c.slice(8, 12) + '-' + c.slice(12);
}
DADOS.lojas = (function () {
  const m = {};
  zipn('top_lojas').forEach(function (r) {
    const id = r.user_id;
    if (id == null || !r.loja) return;
    if (!m[id]) m[id] = { nomes: [], cnpj: fmtCnpj(r.cnpj) };
    if (m[id].nomes.indexOf(r.loja) < 0) m[id].nomes.push(r.loja);
  });
  const out = {};
  for (const id in m) out[id] = [m[id].nomes.join(' / '), m[id].cnpj];
  return out;
})();

/* ─── 4. RAIO-X ───────────────────────────────────────────────────────
   As 7 queries rx_* ficaram INTOCADAS — vem indexadas por buyer_user_id,
   e o recorte por whitelabel se resolve com o mapa comprador->wl. Foi o que
   evitou multiplicar 855 chamadas por 58.
   rx_buyers vem com LEFT JOIN de loja: pode ter mais de uma linha por
   comprador. Colapsa aqui, DEPOIS de paginar tudo — nunca antes. */
DADOS.rxBuyers = (function () {
  const rows = zipnRaw('rx_buyers'), m = {}, ord = [];
  rows.forEach(function (r) {
    const id = r[0];
    if (id == null) return;
    if (!m[id]) { m[id] = [id, r[1], [], '']; ord.push(id); }
    if (r[2] && m[id][2].indexOf(r[2]) < 0) m[id][2].push(r[2]);
    if (!m[id][3] && r[3]) m[id][3] = fmtCnpj(r[3]);
  });
  return ord.map(function (id) { return [m[id][0], m[id][1], m[id][2].join(' / '), m[id][3]]; });
})();
DADOS.rxTotais = zipnRaw('rx_totais');
DADOS.rxModelo = zipnRaw('rx_modelo');
DADOS.rxLaudo = zipnRaw('rx_laudo');
DADOS.rxUf = zipnRaw('rx_uf');
DADOS.rxFaixa = zipnRaw('rx_faixa');
DADOS.rxPartic = zipnRaw('rx_partic');

/* mapa comprador -> [wl,...]. E o unico dado novo que o Raio-X precisa. */
DADOS.rxBuyerWl = (function () {
  const m = {};
  zipn('rx_buyer_wl').forEach(function (r) {
    const u = num(r.user_id), w = num(r.wl);
    if (!m[u]) m[u] = [];
    if (m[u].indexOf(w) < 0) m[u].push(w);
  });
  return m;
})();

/* ─── 5. SANIDADE — falha visivel em vez de relatorio errado ──────────
   Estes quatro ja pegaram erro real nesta frente. Ficam. */
const _avisos = [];
if (DADOS.coorte.length === 0) _avisos.push('coorte vazia — o relatorio nao tem base');
if (WLS.length === 0) _avisos.push('nenhum whitelabel na coorte_wl — o seletor ficaria vazio');
(function () {
  /* soma das safras tem de bater com a soma por WL do WL isolado? Nao — mas
     o total da coorte tem de ser >= o maior WL. Se for menor, o EXISTS do
     BASE caiu em algum lugar e ha contagem repetida. */
  const totGlobal = DADOS.coorte.reduce(function (s, l) { return s + l[1]; }, 0);
  const maiorWl = WLS.length ? WLS[0].total : 0;
  if (totGlobal > 0 && maiorWl > totGlobal) {
    _avisos.push('whitelabel "' + WLS[0].nome + '" tem ' + maiorWl +
      ' clientes, mais que os ' + totGlobal + ' da plataforma — contagem repetida');
  }
})();
if (DADOS.evMedia.length === 0) _avisos.push('evol_media_oferta vazia — 3 graficos sairao em branco');
DADOS.avisos = _avisos;


/* ══════════════════════════════════════════════════════════════════════
   GERADOR LOTE 2 — PARTE 4/4: MONTAGEM DO HTML

   O esqueleto e o aplicativo viajam como literal e sao colados nos
   marcadores. Nada de valor e assado no HTML: o unico dado que entra e o
   JSON de DADOS, e quem desenha e o aplicativo. E isso que faz o filtro
   alcancar a pagina inteira em vez de 18 valores.

   O CSS (12 KB) NAO esta aqui — mora no no "Montar CSS", anterior a este.
   Motivo: o `update_workflow` do MCP so aceita o jsCode inline, e um no
   grande demais simplesmente nao passa (foi o que aposentou o gerador de
   87 KB de producao). Separar o CSS, que e estatico e nunca muda junto com
   a logica, devolve 12 KB de folga pro no que de fato evolui.
   ══════════════════════════════════════════════════════════════════════ */

const CSS = $('Montar CSS').first().json.css;
const APP = $('Montar App').first().json.app;
if (!CSS || CSS.length < 1000) throw new Error('Montar CSS devolveu vazio ou truncado');
if (!APP || APP.length < 5000) throw new Error('Montar App devolveu vazio ou truncado');
const SHELL = "<!DOCTYPE html>\n<html lang=\"pt-BR\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<title>Análise de Base de Clientes — Cars2You</title>\n<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Oswald:wght@500;600&display=swap\" rel=\"stylesheet\">\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js\"></script>\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-datalabels/2.2.0/chartjs-plugin-datalabels.min.js\"></script>\n<style>/*__CSS__*/</style>\n<style>\n/* ─── ÚNICO acréscimo ao CSS de produção: a barra de filtro e os selos ───\n   Todo o resto — .sec, .sec-title, .ct, .cs, .legend, .chart-card, .rec-grid,\n   .kpi-grid, .funnel, .insight-grid, .tabs — vem verbatim do relatório\n   anterior. O layout não foi reinventado; só ganhou uma barra. */\n.sf-bar{position:sticky;top:0;z-index:60;display:flex;gap:10px;align-items:center;flex-wrap:wrap;\n  background:var(--brand);color:#fff;padding:11px 16px;border-radius:10px;margin:0 0 20px}\n.sf-bar label{font:600 10px 'Inter',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#cbd5e1}\n.sf-bar select{font:500 13px 'Inter',sans-serif;padding:7px 10px;border-radius:7px;\n  border:1px solid #5a5a5a;background:#3a3a3a;color:#fff;max-width:320px}\n.sf-bar select#fWl{min-width:270px}\n.sf-bar button{font:600 12px 'Inter',sans-serif;padding:7px 14px;border-radius:7px;\n  border:1px solid #5a5a5a;background:transparent;color:#e2e8f0;cursor:pointer}\n.sf-bar button:hover{background:#3a3a3a}\n.sf-escopo{margin-left:auto;font:600 13px 'Inter',sans-serif;color:#fff;text-align:right}\n.selo{display:inline-block;font:600 10px 'Inter',sans-serif;letter-spacing:.04em;\n  padding:3px 9px;border-radius:999px;background:var(--warn-soft);color:var(--warn);\n  border:1px solid var(--warn-line);margin-left:10px;vertical-align:middle;cursor:help}\n.avisos{display:none;background:var(--bad-soft);border:1px solid var(--bad-line);color:var(--bad);\n  padding:12px 16px;border-radius:9px;margin:0 0 18px;font:500 13px 'Inter',sans-serif}\n.avisos ul{margin:6px 0 0 18px;padding:0}\n/* altura do canvas: Chart.js com maintainAspectRatio:false precisa de um pai\n   com altura definida, senao desenha 0px */\n.chart-wrap{position:relative;height:280px;margin-top:10px}\n.rec-grid table{width:100%}\n</style>\n</head>\n<body>\n<div class=\"page\">\n\n  <!-- ═══ CABEÇALHO — estrutura verbatim do relatório anterior ═══\n       .header-bar NÃO é container: é a régua âmbar de 4px que vem DEPOIS.\n       O branco do título vem de `.header-title h1`; sem esse wrapper o h1\n       herda a cor escura e some no fundo escuro. Foi o que aconteceu.\n       O logo do C6 saiu de propósito: o relatório agora cobre a plataforma\n       inteira, e carimbar a marca de um whitelabel no recorte \"Todos\" seria\n       dizer o que não é. -->\n  <div class=\"header\">\n    <div class=\"header-left\">\n      <div class=\"header-title\">\n        <h1>Análise de Base de Clientes</h1>\n        <p>Cars2You · <span id=\"escopoTopo\"></span></p>\n      </div>\n    </div>\n    <div class=\"header-meta\">\n      <span class=\"pill\" id=\"convPill\"></span>\n      <span class=\"pill\">Gerado em <span id=\"geradoEm\"></span></span>\n      <span class=\"pill\">Confidencial</span>\n    </div>\n  </div>\n  <div class=\"header-bar\"></div>\n\n  <div class=\"avisos\" id=\"avisos\"></div>\n\n  <!-- ═══ BARRA DE FILTRO (o acréscimo do lote 2) ═══ -->\n  <div class=\"sf-bar\">\n    <label for=\"fWl\">Whitelabel</label>\n    <select id=\"fWl\"></select>\n    <label for=\"fAno\">Safra — ano</label>\n    <select id=\"fAno\"></select>\n    <label for=\"fMes\">Mês</label>\n    <select id=\"fMes\"></select>\n    <button id=\"fReset\" type=\"button\">Limpar</button>\n    <span class=\"sf-escopo\" id=\"escopo\"></span>\n  </div>\n\n  <!-- ═══ ABAS PRINCIPAIS — as mesmas três do relatório anterior ═══ -->\n  <div class=\"tabs\">\n    <button class=\"tab active\" data-aba=\"geral\" type=\"button\">Visão Geral da Base</button>\n    <!-- As duas abas de Raio-X estao ocultas a pedido (04/09). O painel e o\n         codigo continuam aqui: e so trocar MOSTRAR_RAIOX pra true no app. -->\n    <button class=\"tab\" data-aba=\"rx\" type=\"button\" hidden>Raio-X de Compradores</button>\n    <button class=\"tab\" data-aba=\"rxi\" type=\"button\" hidden>Raio-X Individual</button>\n  </div>\n\n  <!-- ══════════════════ ABA 1: VISÃO GERAL ══════════════════ -->\n  <div data-painel=\"geral\">\n\n    <div class=\"sec\">\n      <div class=\"sec-head\"><div class=\"sec-title\">Visão Geral da Base</div><div class=\"sec-line\"></div></div>\n      <div class=\"kpi-grid\" id=\"kpis\"></div>\n    </div>\n\n    <div class=\"sec\">\n      <div class=\"sec-head\"><div class=\"sec-title\">Cadastros por Situação</div><div class=\"sec-line\"></div></div>\n      <div class=\"kpi-grid\" id=\"situacao\"></div>\n    </div>\n\n    <div class=\"sec\">\n      <div class=\"sec-head\"><div class=\"sec-title\">Recência — Há Quanto Tempo Sem Agir</div><span id=\"recSelo\"></span><div class=\"sec-line\"></div></div>\n      <div class=\"rec-grid\" id=\"recencia\"></div>\n    </div>\n\n    <!-- ═══ EVOLUÇÃO MENSAL — os 10 gráficos, na ordem do relatório anterior ═══ -->\n    <div class=\"sec\">\n      <div class=\"sec-head\"><div class=\"sec-title\">Evolução Mensal</div><span id=\"evolSelo\"></span><div class=\"sec-line\"></div></div>\n      <div class=\"sec-note\" id=\"evolNota\"></div>\n\n      <div class=\"chart-card\">\n        <div class=\"ct\">Usuários únicos por etapa</div>\n        <div class=\"cs\" id=\"cs_uniq\"></div>\n        <div class=\"legend\">\n          <span><span class=\"ldot\" style=\"background:var(--brand)\"></span>Logaram</span>\n          <span><span class=\"ldot\" style=\"background:var(--brand2)\"></span>Ofertaram</span>\n          <span><span class=\"ldot\" style=\"background:var(--amber)\"></span>Compraram</span>\n        </div>\n        <div class=\"chart-wrap\"><canvas id=\"ch_uniq\"></canvas></div>\n      </div>\n\n      <div class=\"chart-card\">\n        <div class=\"ct\">Acessos &mdash; novos vs. recorrentes</div>\n        <div class=\"legend\">\n          <span><span class=\"ldot\" style=\"background:var(--amber)\"></span>Novos</span>\n          <span><span class=\"ldot\" style=\"background:var(--brand)\"></span>Recorrentes</span>\n        </div>\n        <div class=\"chart-wrap\"><canvas id=\"ch_nr_login\"></canvas></div>\n      </div>\n\n      <div class=\"chart-card\">\n        <div class=\"ct\">Ofertas &mdash; novos vs. recorrentes</div>\n        <div class=\"legend\">\n          <span><span class=\"ldot\" style=\"background:var(--amber)\"></span>Novos</span>\n          <span><span class=\"ldot\" style=\"background:var(--brand)\"></span>Recorrentes</span>\n        </div>\n        <div class=\"chart-wrap\"><canvas id=\"ch_nr_oferta\"></canvas></div>\n      </div>\n\n      <div class=\"chart-card\">\n        <div class=\"ct\">Compras &mdash; novos vs. recorrentes</div>\n        <div class=\"legend\">\n          <span><span class=\"ldot\" style=\"background:var(--amber)\"></span>Novos</span>\n          <span><span class=\"ldot\" style=\"background:var(--brand)\"></span>Recorrentes</span>\n        </div>\n        <div class=\"chart-wrap\"><canvas id=\"ch_nr_compra\"></canvas></div>\n      </div>\n\n      <div class=\"chart-card\">\n        <div class=\"ct\">Volume financeiro mensal</div>\n        <div class=\"cs\">Em milhões de reais</div>\n        <div class=\"chart-wrap\"><canvas id=\"ch_vol\"></canvas></div>\n      </div>\n\n      <div class=\"chart-card\">\n        <div class=\"ct\">Novos cadastros na base</div>\n        <div class=\"cs\" id=\"cs_cad\"></div>\n        <div class=\"chart-wrap\"><canvas id=\"ch_cad\"></canvas></div>\n      </div>\n\n      <div class=\"chart-card\">\n        <div class=\"ct\">Cadastros por dia — últimos 30 dias</div>\n        <div class=\"legend\">\n          <span><span class=\"ldot\" style=\"background:#cbd5e1\"></span>Cadastros/dia</span>\n          <span><span class=\"ldot\" style=\"background:var(--amber)\"></span>Tendência</span>\n        </div>\n        <div class=\"chart-wrap\"><canvas id=\"ch_cad_dia\"></canvas></div>\n      </div>\n\n      <div class=\"chart-card\">\n        <div class=\"ct\">Média de ofertas recebidas por anúncio publicado</div>\n        <div class=\"cs\">Métrica do lado da oferta<span class=\"selo\" id=\"mediaSelo1\"></span></div>\n        <div class=\"chart-wrap\"><canvas id=\"ch_oferta_anuncio\"></canvas></div>\n      </div>\n\n      <div class=\"chart-card\">\n        <div class=\"ct\">Êxito de Venda por Mês</div>\n        <div class=\"cs\">Veículos vendidos sobre publicados<span class=\"selo\" id=\"mediaSelo2\"></span></div>\n        <div class=\"chart-wrap\"><canvas id=\"ch_exito_venda\"></canvas></div>\n      </div>\n\n      <div class=\"chart-card\">\n        <div class=\"ct\">Média de Publicações por Veículo</div>\n        <div class=\"cs\">Anúncios criados por veículo distinto<span class=\"selo\" id=\"mediaSelo3\"></span></div>\n        <div class=\"chart-wrap\"><canvas id=\"ch_media_publicacoes\"></canvas></div>\n      </div>\n    </div>\n\n    <!-- ═══ UF — três tabelas lado a lado + gráfico, como no anterior ═══ -->\n    <div class=\"sec\">\n      <div class=\"sec-head\"><div class=\"sec-title\">Distribuição Geográfica (UF)</div><span id=\"ufSelo\"></span><div class=\"sec-line\"></div></div>\n      <div class=\"rec-grid\" id=\"ufTabelas\"></div>\n      <div class=\"chart-card\">\n        <div class=\"ct\">Compradores por Estado (UF)</div>\n        <div class=\"legend\">\n          <span><span class=\"ldot\" style=\"background:var(--brand)\"></span>Compras</span>\n          <span><span class=\"ldot\" style=\"background:var(--amber)\"></span>Volume (R$ Mi)</span>\n        </div>\n        <div class=\"chart-wrap\"><canvas id=\"ch_uf_compra\"></canvas></div>\n      </div>\n    </div>\n\n    <div class=\"sec\">\n      <div class=\"sec-head\"><div class=\"sec-title\">Top 10 Clientes — Compras no Período Total</div><span id=\"topSelo\"></span><div class=\"sec-line\"></div></div>\n      <div id=\"topHist\"></div>\n    </div>\n\n    <div class=\"sec\">\n      <div class=\"sec-head\"><div class=\"sec-title\" id=\"tituloTopAno\">Top 10 Clientes — Compras</div><div class=\"sec-line\"></div></div>\n      <div id=\"topAno\"></div>\n    </div>\n\n    <div class=\"sec\">\n      <div class=\"sec-head\"><div class=\"sec-title\" id=\"tituloTopAcesso\">Top 10 Acesso e Top 10 Oferta</div><div class=\"sec-line\"></div></div>\n      <div class=\"rec-grid\">\n        <div id=\"topAcesso\"></div>\n        <div id=\"topOfertas\"></div>\n      </div>\n    </div>\n\n    <div class=\"sec\">\n      <div class=\"sec-head\"><div class=\"sec-title\">Destaques do Período</div><div class=\"sec-line\"></div></div>\n      <div class=\"insight-grid\" id=\"destaques\"></div>\n    </div>\n  </div>\n\n  <!-- ══════════════════ ABA 2: RAIO-X DE COMPRADORES ══════════════════ -->\n  <div data-painel=\"rx\" style=\"display:none\">\n    <div class=\"sec\">\n      <div class=\"sec-head\"><div class=\"sec-title\">Raio-X de Compradores</div><span class=\"pill\" id=\"rxCount\"></span><span id=\"rxSelo\"></span><div class=\"sec-line\"></div></div>\n      <div class=\"cs\">Um comprador por linha. Ordene clicando no cabeçalho.</div>\n      <div id=\"rxMatriz\"></div>\n    </div>\n  </div>\n\n  <!-- ══════════════════ ABA 3: RAIO-X INDIVIDUAL ══════════════════ -->\n  <div data-painel=\"rxi\" style=\"display:none\">\n    <div class=\"sec\">\n      <div class=\"sec-head\"><div class=\"sec-title\">Raio-X Individual</div><span id=\"rxiSelo\"></span><div class=\"sec-line\"></div></div>\n      <div class=\"buyer-select\">\n        <label class=\"rx-combo-label\" for=\"rxiSel\">Comprador</label>\n        <select id=\"rxiSel\"></select>\n      </div>\n      <div class=\"buyer-detail\" id=\"rxiDetalhe\">\n        <div class=\"profile-kpis\" id=\"rxiKpis\"></div>\n        <div class=\"chart-card\">\n          <div class=\"ct\">Compras e volume por mês</div>\n          <div class=\"legend\">\n            <span><span class=\"ldot\" style=\"background:var(--brand)\"></span>Compras</span>\n            <span><span class=\"ldot\" style=\"background:var(--amber)\"></span>Volume (R$ Mi)</span>\n          </div>\n          <div class=\"chart-wrap\"><canvas id=\"ch_rxi\"></canvas></div>\n        </div>\n        <div class=\"rec-grid\" id=\"rxiDist\"></div>\n      </div>\n    </div>\n  </div>\n\n  <div class=\"footer\">\n    Cars2You · relatório gerado automaticamente pelo n8n.\n    O recorte por whitelabel vale para a página inteira; a safra é o mês de cadastro\n    e recorta o que deriva da coorte.\n  </div>\n</div>\n\n<script>window.__DADOS__ = /*__DADOS__*/;</script>\n<script>/*__APP__*/</script>\n</body>\n</html>\n";

/* JSON.stringify pode gerar "</script>" dentro de uma string de dado (nome de
   loja com HTML, por exemplo) e fechar a tag antes da hora. O escape de "<"
   resolve sem mexer no valor: \u003c volta a "<" no JSON.parse do navegador. */
const dadosJson = JSON.stringify(DADOS).split('<').join('\\u003c');

let html = SHELL
  .replace('/*__CSS__*/', CSS)
  .replace('/*__DADOS__*/', dadosJson)
  .replace('/*__APP__*/', APP);

/* data de geracao no cabecalho, sem depender do fuso do container */
const _d = new Date();
const _p = function (x) { return String(x).padStart(2, '0'); };
html = html.replace('<span id="geradoEm"></span>',
  '<span id="geradoEm">' + _p(_d.getDate()) + '/' + _p(_d.getMonth() + 1) + '/' + _d.getFullYear() + '</span>');

/* provas de que o HTML saiu inteiro. Falham aqui, no n8n, e nao na caixa de
   entrada de seis pessoas. */
if (html.indexOf('/*__') >= 0) throw new Error('marcador nao substituido no HTML final');
if (html.indexOf('__DADOS__') < 0) throw new Error('DADOS nao foi embarcado');
if (DADOS.coorte.length === 0) throw new Error('coorte vazia — o relatorio nao teria base');

return [{ json: {
  html: html,
  _meta: {
    bytes: html.length,
    whitelabels: DADOS.meta.wls.length,
    safras: DADOS.coorte.length,
    avisos: DADOS.avisos
  }
} }];
