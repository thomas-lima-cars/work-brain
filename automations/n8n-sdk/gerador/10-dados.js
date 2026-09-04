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
