/* ══════════════════════════════════════════════════════════════════════
   GERADOR LOTE 2 — PARTE 3/4: O APLICATIVO (roda no navegador)

   Layout, ordem das secoes, titulos, cores e configuracao de cada grafico
   sao os do relatorio anterior — extraidos dele, nao reinventados. O que
   muda e de onde o dado vem: em vez de assado no HTML, sai de `DADOS` e
   passa por um unico `render()`. E isso que faz o filtro alcancar a pagina
   inteira em vez de 18 valores.

   ── AS DUAS DIMENSOES NAO SAO A MESMA COISA ────────────────────────────
   WHITELABEL: vale pra pagina inteira. Toda secao tem recorte por WL.
   SAFRA (Ano/Mes): e o mes de CADASTRO do cliente. Recorta o que deriva da
     coorte — KPIs, Situacao, Funil, Destaques. NAO recorta Evolucao, UF,
     Top 10, Recencia nem Raio-X: essas sao series por data de EVENTO,
     dimensao diferente. Cruzar as duas exigiria dado por
     (wl x safra x dimensao), e o volume explode. Em vez de mostrar numero
     nao filtrado como se estivesse filtrado, cada uma dessas secoes ganha
     um selo dizendo que a safra nao se aplica ali.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var D = window.__DADOS__;
  var C = D.campos;
  var iC = {}; C.forEach(function (n, i) { iC[n] = i; });
  var OFF = 1, OFF_WL = 2;
  var F = { wl: '', ano: '', mes: '' };

  /* As duas abas de Raio-X estao ocultas a pedido (04/09). Nada foi apagado:
     o esqueleto, os dados (rx_*) e os renders continuam aqui. Trocar pra true
     devolve as abas e volta a desenhar. */
  var MOSTRAR_RAIOX = false;

  /* cores: as mesmas variaveis CSS do relatorio anterior */
  var cssv = function (n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); };
  var BRAND = cssv('--brand'), BRAND2 = cssv('--brand2'), AMBER = cssv('--amber');
  var GOOD = '#047857', GR = 'rgba(15,23,42,0.06)', TK = '#94a3b8';

  /* ─── formatadores ─────────────────────────────────────────────────── */
  var nf = new Intl.NumberFormat('pt-BR');
  var nf2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function n(v) { return nf.format(Math.round(v || 0)); }
  function brlMi(v) { return 'R$ ' + nf2.format((v || 0) / 1e6) + ' mi'; }
  function brl(v) {
    v = v || 0;
    if (v >= 1e6) return 'R$ ' + nf2.format(v / 1e6) + ' mi';
    return 'R$ ' + nf.format(Math.round(v));
  }
  function pct(a, b) { return b ? nf2.format((a / b) * 100).replace(/,00$/, '') + '%' : '0%'; }
  function pct1(x) { return nf2.format((x || 0) * 100).replace(/,00$/, '') + '%'; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function dataBr(s) {
    if (!s) return '—';
    var p = String(s).slice(0, 10).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : String(s);
  }
  function el(id) { return document.getElementById(id); }

  /* ─── tamanho do valor nos cards ──────────────────────────────────
     `.kpi-value` no CSS de producao e 30px, e o card tem largura minima de
     160px (`minmax(160px,1fr)`). Sobram ~124px de texto util — em Oswald
     30px isso da cerca de 8 caracteres. Qualquer valor maior quebra em duas
     ou tres linhas, que foi o que aconteceu com "R$ 2.504,58 mi".
     Em vez de baixar a fonte de todos (e desperdicar o card curto), o
     tamanho acompanha o comprimento. `fixo` permite cravar um valor quando
     a decisao e de layout, nao de caber. */
  function kpiValor(txt, fixo) {
    var t = String(txt == null ? '' : txt);
    var px = fixo || (t.length <= 8 ? 30 : (t.length <= 11 ? 26 : (t.length <= 14 ? 22 : 19)));
    return '<div class="kpi-value" style="font-size:' + px + 'px">' + t + '</div>';
  }
  function subLoja(id) {
    var l = D.lojas[id];
    if (!l || (!l[0] && !l[1])) return '';
    return '<span class="cell-sub">' + esc(l[0]) + (l[1] ? ' · CNPJ ' + esc(l[1]) : '') + '</span>';
  }
  var MESNOME = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  function rotuloMes(ym) {
    var p = String(ym).split('-');
    return p.length >= 2 ? MESNOME[+p[1]] + '/' + p[0].slice(2) : ym;
  }

  /* ─── recorte ──────────────────────────────────────────────────────── */
  function linhasCoorte() {
    if (F.wl === '') return D.coorte.map(function (l) { return { ym: l[0], v: l, off: OFF }; });
    var w = +F.wl;
    return D.coorteWl.filter(function (l) { return l[0] === w; })
      .map(function (l) { return { ym: l[1], v: l, off: OFF_WL }; });
  }
  function casaSafra(ym) {
    if (!ym) return false;
    if (F.ano && ym.slice(0, 4) !== F.ano) return false;
    if (F.mes && ym.slice(5, 7) !== F.mes) return false;
    return true;
  }
  function agrega() {
    var a = {}; C.forEach(function (c) { a[c] = 0; });
    a.ultima_compra = null;
    linhasCoorte().forEach(function (r) {
      if (!casaSafra(r.ym)) return;
      C.forEach(function (c) { a[c] += r.v[r.off + iC[c]] || 0; });
      var uc = r.v[r.v.length - 1];
      if (uc && (!a.ultima_compra || uc > a.ultima_compra)) a.ultima_compra = uc;
    });
    return a;
  }
  /* Igual a agrega(), mas sem o recorte de safra. Serve as secoes que nao
     honram safra e ainda assim precisam de um total coerente com elas. */
  function agregaSemSafra() {
    var a = {}; C.forEach(function (c) { a[c] = 0; });
    linhasCoorte().forEach(function (r) {
      C.forEach(function (c) { a[c] += r.v[r.off + iC[c]] || 0; });
    });
    return a;
  }
  /* Toda serie tem par: global (alimenta "Todos") e _wl. O total nunca vem
     de soma de whitelabels — quem esta em N aparece N vezes na _wl.

     DUAS AUSENCIAS DIFERENTES, que nao podem ser mostradas igual:
       a) o dataset _wl veio VAZIO -> a query nao rodou (estourou o deadline
          do banco). Cair no global e AVISAR. Mostrar "sem dado" seria dizer
          que aquele whitelabel nao tem movimento, o que e mentira.
       b) o dataset existe mas nao tem linha para ESTE whitelabel -> e verdade:
          aquele WL nao teve movimento. Devolve vazio mesmo.
     `SEM_WL` acumula as secoes no caso (a) para o selo. */
  var SEM_WL = {};
  function serie(global, porWl, secao) {
    if (F.wl === '') return global;
    if (!porWl || porWl.length === 0) {        /* caso (a) */
      if (secao) SEM_WL[secao] = true;
      return global;
    }
    var w = +F.wl;
    return porWl.filter(function (l) { return l[0] === w; }).map(function (l) { return l.slice(1); });
  }
  function seloSemWl(secao) {
    if (F.wl === '' || !SEM_WL[secao]) return '';
    return '<span class="selo" title="A consulta por whitelabel desta secao nao pode ser executada — estourou o tempo limite do banco. O que aparece aqui e o total da plataforma, nao o recorte escolhido.">sem recorte por whitelabel — mostrando a plataforma</span>';
  }
  function mapaSerie(rows, col) {
    var m = {};
    rows.forEach(function (l) { m[l[0]] = (m[l[0]] || 0) + (l[col] || 0); });
    return m;
  }
  function chavesDe(rows) {
    return rows.map(function (l) { return l[0]; })
      .filter(function (v, i, a) { return v && a.indexOf(v) === i; }).sort();
  }

  /* ─── graficos: registro unico, destroi e recria ───────────────────── */
  var CH = {};
  /* ChartDataLabels entra em TODO grafico. Quem decide se aparece e a opcao
     `datalabels` de cada um — o default abaixo e nao mostrar, entao cada
     grafico liga o que faz sentido nele. Registrar por grafico (e nao global)
     e o que o relatorio anterior ja fazia. */
  function chart(id, cfg) {
    var c = el(id);
    if (!c) return;
    if (CH[id]) { CH[id].destroy(); delete CH[id]; }
    cfg.plugins = (cfg.plugins || []).concat([ChartDataLabels]);
    CH[id] = new Chart(c, cfg);
  }

  /* ─── rotulos de dados ─────────────────────────────────────────────
     Regras que valem pra todos:
     - numero zero nao vira rotulo. Doze "0" empilhados sujam mais do que
       informam, e a ausencia da barra ja diz o que precisa.
     - serie de tendencia e serie de apoio nao levam rotulo: elas existem
       pra dar forma, nao valor.
     - grafico de barras ganha folga no topo (layout.padding), senao o
       rotulo da barra mais alta e cortado pela borda do canvas. */
  var FONTE_DL = { weight: 600, size: 10 };
  function fmtInt(v) { return v ? nf.format(Math.round(v)) : ''; }
  function fmtDec(v) { return v ? nf2.format(v) : ''; }

  /* Opcao "scriptable" do Chart.js: `display` pode ser chamada com um contexto
     incompleto por qualquer codigo que apenas LEIA options.plugins.datalabels
     (foi assim que uma sonda de teste derrubou a pagina). Por isso todo acesso
     ao contexto e defensivo — a funcao nunca pode estourar. */
  function valorDe(c) {
    if (!c || !c.dataset || !c.dataset.data || c.dataIndex == null) return null;
    var v = +c.dataset.data[c.dataIndex];
    return isNaN(v) ? null : v;
  }
  /* rotulo acima da barra/ponto */
  function dlTopo(fmt, cor) {
    return { display: function (c) { var v = valorDe(c); return v !== null && v > 0; },
      anchor: 'end', align: 'top', offset: 2, clamp: true,
      color: cor || TK, font: FONTE_DL, formatter: fmt || fmtInt };
  }
  /* rotulo dentro do segmento — para barra empilhada. Some quando o segmento
     e pequeno demais pra caber o texto, senao o numero vaza pra fora. */
  function dlDentro(fmt) {
    return { display: function (c) {
        var v = valorDe(c);
        if (v === null || v <= 0) return false;
        if (!c.chart || !c.chart.data || !c.chart.data.datasets) return false;
        var max = 0;
        c.chart.data.datasets.forEach(function (d) {
          (d.data || []).forEach(function (x) { var y = +x || 0; if (y > max) max = y; });
        });
        return max ? (v / max) > 0.08 : false;
      },
      anchor: 'center', align: 'center', color: '#fff', font: FONTE_DL,
      formatter: fmt || fmtInt };
  }
  var DL_OFF = { display: false };

  function barOpts(dl) {
    return { responsive: true, maintainAspectRatio: false,
      layout: { padding: { top: 20 } },
      plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false },
        datalabels: dl || DL_OFF },
      scales: { x: { grid: { color: GR }, ticks: { color: TK, font: { size: 11 } }, border: { display: false } },
        y: { grid: { color: GR }, ticks: { color: TK }, border: { display: false } } } };
  }
  function lineOpts(dl) { return barOpts(dl); }
  function stackOpts(dl) {
    return { responsive: true, maintainAspectRatio: false,
      layout: { padding: { top: 20 } },
      plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false },
        datalabels: dl || DL_OFF },
      scales: { x: { stacked: true, grid: { color: GR }, ticks: { color: TK, font: { size: 11 } }, border: { display: false } },
        y: { stacked: true, grid: { color: GR }, ticks: { color: TK }, border: { display: false } } } };
  }
  /* reta de tendencia por minimos quadrados — o grafico de cadastros/dia do
     relatorio anterior tem essa linha sobre as barras */
  function linreg(ys) {
    var N = ys.length; if (!N) return [];
    var sx = 0, sy = 0, sxy = 0, sxx = 0;
    for (var i = 0; i < N; i++) { sx += i; sy += ys[i]; sxy += i * ys[i]; sxx += i * i; }
    var den = N * sxx - sx * sx;
    if (!den) return ys.map(function () { return sy / N; });
    var b = (N * sxy - sx * sy) / den, a = (sy - b * sx) / N;
    return ys.map(function (_, i) { return Math.max(0, a + b * i); });
  }

  /* ─── selos ────────────────────────────────────────────────────────── */
  /* ── O QUE O FILTRO DE ANO/MES FAZ EM CADA LUGAR ────────────────────
     Nao e a mesma coisa em toda secao, e fingir que e seria mentir:

     a) SECOES DA COORTE (KPIs, Situacao, Destaques, "Novos cadastros"):
        recorta por SAFRA — o mes em que o cliente se cadastrou. E a
        dimensao nativa do dado.
     b) SERIES POR MES (Evolucao, novos vs. recorrentes, dinamica de oferta):
        recorta o PERIODO mostrado — os meses do eixo. E o mes do EVENTO
        (login, oferta, compra), nao o do cadastro.
     c) SECOES SEM EIXO DE TEMPO (Recencia, UF, Top 10): nao da pra recortar
        nem por uma coisa nem por outra. Recencia ja e "ha quanto tempo";
        UF e Top 10 vem agregados sem mes. Essas continuam com o selo de
        "nao se aplica".

     Cruzar (a) com (b) de verdade — "logins de quem se cadastrou em 2025" —
     exigiria dado por (whitelabel x safra x mes do evento). Nao existe, e
     montar isso multiplica o volume por 78. */
  function seloSafra() {
    if (!F.ano && !F.mes) return '';
    return '<span class="selo" title="Esta secao nao tem eixo de tempo nem dimensao de safra: vem agregada do banco sem mes. O recorte de ano/mes nao alcanca estes numeros.">ano/mês não se aplica aqui</span>';
  }
  function seloPeriodo() {
    if (!F.ano && !F.mes) return '';
    return '<span class="selo" title="Aqui o recorte de ano/mes filtra o PERIODO do grafico — o mes do evento (login, oferta, compra). Nao e o mes de cadastro do cliente, que e o que a palavra safra significa nos KPIs.">período do evento, não safra de cadastro</span>';
  }
  function nomeWl() {
    if (F.wl === '') return 'Todos os whitelabels';
    var w = +F.wl, achado = null;
    D.meta.wls.forEach(function (x) { if (x[0] === w) achado = x[1]; });
    return achado || ('WL ' + w);
  }
  function rotuloEscopo() {
    var p = [nomeWl()];
    if (F.ano) p.push('safra ' + (F.mes ? MESNOME[+F.mes] + '/' : '') + F.ano);
    return p.join(' · ');
  }

  /* ═══ VISÃO GERAL DA BASE ═══════════════════════════════════════════ */
  function renderKpis(a) {
    var kpis = [
      ['Clientes na base', n(a.total), 'clientes no recorte'],
      ['Com login', n(a.com_login), pct(a.com_login, a.total) + ' da base'],
      ['Nunca logaram', n(a.sem_login), pct(a.sem_login, a.total) + ' da base'],
      ['Ofertantes', n(a.ofertantes), pct(a.ofertantes, a.total) + ' da base'],
      ['Compradores', n(a.compradores), pct(a.compradores, a.total) + ' da base'],
      ['Negociações', n(a.negociacoes), n(a.vendido) + ' concluídas'],
      /* 22px cravado: e o card com o texto mais longo da grade e o unico
         que ainda apertava mesmo na escala automatica. */
      ['Valor total', brl(a.volume), a.negociacoes ? 'ticket ' + brl(a.volume / a.negociacoes) : '', 22],
      ['Última compra', dataBr(a.ultima_compra), 'no recorte']
    ];
    if (F.wl === '' && !F.ano && !F.mes) {
      kpis.push(['Ofertas registradas', n(D.ofertas), 'contagem bruta']);
    }
    el('kpis').innerHTML = kpis.map(function (k) {
      return '<div class="kpi"><div class="kpi-label">' + esc(k[0]) + '</div>' +
        kpiValor(k[1], k[3]) +
        '<div class="kpi-sub">' + esc(k[2]) + '</div></div>';
    }).join('');
    el('convPill').textContent = 'conversão ' + pct(a.compradores, a.total);
  }

  /* Os rotulos de situacao NAO sao os nomes genericos do banco — sao as
     etapas do cadastro do lojista, conforme corrigido em 04/09. A coluna
     `users.situation` continua 1..6; so a leitura muda.
       1 Pré Cadastro   2 Para Aprovação   3 Aprovado
       4 Reprovado      5 Bloqueado        6 Inadimplente */
  var SITU = [['s1', 'Pré Cadastro'], ['s2', 'Para Aprovação'], ['s3', 'Aprovado'],
    ['s4', 'Reprovado'], ['s5', 'Bloqueado'], ['s6', 'Inadimplente']];
  function renderSituacao(a) {
    el('situacao').innerHTML = SITU.map(function (s) {
      return '<div class="kpi"><div class="kpi-label">' + s[1] + '</div>' +
        kpiValor(n(a[s[0]])) +
        '<div class="kpi-sub">' + pct(a[s[0]], a.total) + '</div></div>';
    }).join('');
  }

  /* ═══ RECÊNCIA ══════════════════════════════════════════════════════
     A barra e CSS, nao Chart.js. Tres coisas que a primeira versao errou e
     que deixavam o visual vazio:

     1. `.rec-bar` no CSS de producao e so `{height:100%;border-radius:4px}` —
        NAO tem background. A cor vem inline, por faixa. Sem ela a barra
        existe, tem largura, e e invisivel.
     2. A estrutura e <div class="rec-bar-bg"><div class="rec-bar">, com DIVs.
        Com <span>, o flex do .rec-bar-bg nao da altura ao filho.
     3. O ponto colorido mora no .rec-head (ao lado do titulo), nao na linha.

     ⚠️ E o relatorio de PRODUCAO tem um bug proprio no mesmo lugar: emite
     `width:30,4%` — virgula decimal e declaracao CSS invalida, o navegador
     descarta, e as 12 barras ficam com largura zero. Aqui a largura sai com
     PONTO, que e o que o CSS entende. Nao copiar aquele defeito e proposital.

     As cores das faixas sao um semaforo fixo, igual ao original: as duas
     primeiras na cor do card (a segunda esmaecida), 91-180d em ambar e
     180d+ em vermelho. */
  var FAIXAS = [
    ['00-30d', '0–30d', null, 1],
    ['31-90d', '31–90d', null, .6],
    ['91-180d', '91–180d', 'var(--amber)', .7],
    ['180d+', '180d+', 'var(--bad)', .75]
  ];
  var TIPOS = [
    ['login', 'Parou de Logar', 'var(--brand)'],
    ['oferta', 'Parou de Ofertar', 'var(--brand2)'],
    ['compra', 'Parou de Comprar', 'var(--amber)']
  ];
  function renderRec(a) {
    var linhas;
    if (F.wl === '') linhas = D.rec.map(function (l) { return { tipo: l[0], faixa: l[1], qtd: l[2] }; });
    else {
      var w = +F.wl;
      linhas = D.recWl.filter(function (l) { return l[0] === w; })
        .map(function (l) { return { tipo: l[1], faixa: l[2], qtd: l[3] }; });
    }
    el('recSelo').innerHTML = seloSafra();

    /* O rodape sai da coorte SEM o recorte de safra, de proposito: as barras
       acima tambem ignoram safra (e o selo diz isso). Misturar rodape filtrado
       com barra nao filtrada no mesmo card seria comparar coisas diferentes. */
    var b = agregaSemSafra();

    el('recencia').innerHTML = TIPOS.map(function (t) {
      var da = linhas.filter(function (l) { return l.tipo === t[0]; });
      var tot = da.reduce(function (s, l) { return s + l.qtd; }, 0);
      var corpo = FAIXAS.map(function (f) {
        var q = da.filter(function (l) { return l.faixa === f[0]; })
          .reduce(function (s, l) { return s + l.qtd; }, 0);
        var p = tot ? (q / tot) * 100 : 0;
        var cor = f[2] || t[2];
        return '<div class="rec-row">' +
          '<span class="rec-period">' + f[1] + '</span>' +
          '<div class="rec-bar-bg"><div class="rec-bar" style="width:' +
            p.toFixed(1) + '%;background:' + cor + ';opacity:' + f[3] + '"></div></div>' +
          '<span class="rec-count">' + n(q) + '</span></div>';
      }).join('');
      var rodape = t[0] === 'login'
        ? 'Com login: <strong style="color:var(--brand)">' + n(b.com_login) +
          '</strong> · Nunca logou: <strong style="color:var(--bad)">' + n(b.sem_login) + '</strong>'
        : (t[0] === 'oferta'
          ? 'Total já ofertou: <strong style="color:var(--brand2)">' + n(b.ofertantes) + '</strong>'
          : 'Total já comprou: <strong style="color:var(--amber)">' + n(b.compradores) + '</strong>');
      return '<div class="rec-card">' +
        '<div class="rec-head"><span class="rec-dot" style="background:' + t[2] + '"></span>' +
        '<span style="color:' + t[2] + '">' + t[1] + '</span></div>' +
        corpo + '<div class="rec-footer">' + rodape + '</div></div>';
    }).join('');
  }

  /* ═══ EVOLUÇÃO MENSAL — 10 gráficos, ordem e config do anterior ═════ */
  function renderEvol() {
    SEM_WL.evol = false;

    var login = serie(D.evLogin, D.evLoginWl, 'evol');
    var oferta = serie(D.evOferta, D.evOfertaWl, 'evol');
    var compra = serie(D.evCompra, D.evCompraWl, 'evol');
    /* recorte de periodo: so os meses escolhidos entram no eixo */
    var MON = chavesDe([].concat(login, oferta, compra)).filter(casaSafra);
    var lab = MON.map(rotuloMes);
    var mL = mapaSerie(login, 1), mO = mapaSerie(oferta, 1), mC = mapaSerie(compra, 1);
    el('cs_uniq').textContent = MON.length ? rotuloMes(MON[0]) + ' a ' + rotuloMes(MON[MON.length - 1]) : '';

    /* 1. usuarios unicos por etapa */
    chart('ch_uniq', { type: 'line', data: { labels: lab, datasets: [
      { label: 'Logaram', data: MON.map(function (m) { return mL[m] || 0; }), borderColor: BRAND, backgroundColor: BRAND + '14', tension: .35, pointRadius: 4, fill: true, datalabels: dlTopo(fmtInt, BRAND) },
      { label: 'Ofertaram', data: MON.map(function (m) { return mO[m] || 0; }), borderColor: BRAND2, backgroundColor: BRAND2 + '14', tension: .35, pointRadius: 4, fill: true, datalabels: dlTopo(fmtInt, BRAND2) },
      /* a serie de compras corre por baixo das outras duas; o rotulo dela vai
         ABAIXO do ponto pra nao colidir com o de 'Ofertaram' */
      { label: 'Compraram', data: MON.map(function (m) { return mC[m] || 0; }), borderColor: AMBER, backgroundColor: AMBER + '14', tension: .35, pointRadius: 4, fill: true,
        datalabels: Object.assign(dlTopo(fmtInt, AMBER), { align: 'bottom' }) }
    ] }, options: lineOpts() });

    /* 2-4. novos vs recorrentes — empilhado */
    [['ch_nr_login', D.nrLogin, D.nrLoginWl],
      ['ch_nr_oferta', D.nrOferta, D.nrOfertaWl],
      ['ch_nr_compra', D.nrCompra, D.nrCompraWl]].forEach(function (g) {
      var s = serie(g[1], g[2], 'evol');
      var ms = chavesDe(s).filter(casaSafra), mn = mapaSerie(s, 1), mr = mapaSerie(s, 2);
      chart(g[0], { type: 'bar', data: { labels: ms.map(rotuloMes), datasets: [
        { label: 'Novos', data: ms.map(function (m) { return mn[m] || 0; }), backgroundColor: AMBER + 'cc', borderRadius: 4 },
        { label: 'Recorrentes', data: ms.map(function (m) { return mr[m] || 0; }), backgroundColor: BRAND + 'cc', borderRadius: 4 }
      ] }, options: stackOpts(dlDentro()) });
    });

    /* 5. volume financeiro mensal — em milhoes, como no anterior */
    var mV = mapaSerie(compra, 2);
    chart('ch_vol', { type: 'bar', data: { labels: lab, datasets: [
      { label: 'Volume (R$ Mi)', data: MON.map(function (m) { return +(((mV[m] || 0) / 1e6).toFixed(2)); }), backgroundColor: BRAND + 'cc', borderRadius: 4 }
    ] }, options: barOpts(dlTopo(fmtDec, BRAND)) });

    /* 6. novos cadastros na base — derivado da COORTE, nao de query propria.
       O `ym` da coorte ja e o mes de cadastro, entao a serie por whitelabel
       sai de graca. Uma query a menos no lote 2. */
    /* Este e o unico grafico em que ano/mes E safra de verdade: o eixo ja e
       o mes de cadastro. Recorte nativo, sem ressalva. */
    var rowsC = linhasCoorte().filter(function (r) { return casaSafra(r.ym); })
      .slice().sort(function (x, y) { return x.ym < y.ym ? -1 : 1; });
    el('cs_cad').textContent = rowsC.length + ' safras de cadastro';
    chart('ch_cad', { type: 'bar', data: { labels: rowsC.map(function (r) { return rotuloMes(r.ym); }), datasets: [
      { label: 'Cadastros', data: rowsC.map(function (r) { return r.v[r.off + iC.total]; }), backgroundColor: GOOD + 'cc', borderRadius: 4 }
    ] }, options: barOpts(dlTopo(fmtInt, GOOD)) });

    /* 7. cadastros por dia + tendencia */
    var dia = F.wl === '' ? D.evCadDia
      : D.evCadDiaWl.filter(function (l) { return l[0] === +F.wl; }).map(function (l) { return l.slice(1); });
    var dias = chavesDe(dia).filter(function (d) { return casaSafra(String(d).slice(0, 7)); }), mD = mapaSerie(dia, 1);
    var serieDia = dias.map(function (d) { return mD[d] || 0; });
    chart('ch_cad_dia', { data: { labels: dias.map(function (d) { return d.slice(8) + '/' + d.slice(5, 7); }), datasets: [
      /* 30 barras num grafico so: a fonte cai pra 9 e o rotulo do zero some,
         senao vira mancha. A tendencia e forma, nao valor — nao leva rotulo. */
      { type: 'bar', label: 'Cadastros/dia', data: serieDia, backgroundColor: '#cbd5e1', borderRadius: 3, order: 2,
        datalabels: Object.assign(dlTopo(fmtInt, TK), { font: { weight: 600, size: 9 } }) },
      { type: 'line', label: 'Tendência', data: linreg(serieDia), borderColor: AMBER, backgroundColor: AMBER, borderWidth: 2, pointRadius: 0, tension: 0, fill: false, order: 1, datalabels: DL_OFF }
    ] }, options: { responsive: true, maintainAspectRatio: false,
      layout: { padding: { top: 20 } },
      plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
      scales: { x: { grid: { color: GR }, ticks: { color: TK, font: { size: 10 } }, border: { display: false } },
        y: { grid: { color: GR }, ticks: { color: TK }, border: { display: false } } } } });

    /* 8-10. dinamica de oferta — SEMPRE plataforma inteira.
       Sai de advertisements + shops e nao passa por usuario nenhum. Nao
       existe "whitelabel de um anuncio": a chave e advertisements.shop_id, e
       o Feirao C6 roda no mesmo WL 7 do IGA — filtrar por WL traria evento
       do Itau pra dentro do recorte do C6. */
    var em = D.evMedia.filter(function (r) { return casaSafra(r[0]); })
      .slice().sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
    var lm = em.map(function (r) { return rotuloMes(r[0]); });
    var PUB = em.map(function (r) { return r[3]; });
    var VEND = em.map(function (r) { return r[4]; });
    var CRIADOS = em.map(function (r) { return r[6] != null ? r[6] : r[3]; });

    chart('ch_oferta_anuncio', { data: { labels: lm, datasets: [
      /* tres series de 12 pontos: rotular as tres vira mancha. So a linha —
         que e a metrica do titulo do grafico — leva rotulo. As barras ficam
         no tooltip. */
      { type: 'bar', label: 'Anúncios publicados', data: PUB, backgroundColor: '#cbd5e1', borderRadius: 4, yAxisID: 'y', order: 2, datalabels: DL_OFF },
      { type: 'bar', label: 'Veículos vendidos', data: VEND, backgroundColor: GOOD + 'cc', borderRadius: 4, yAxisID: 'y', order: 2, datalabels: DL_OFF },
      { type: 'line', label: 'Média de ofertas/anúncio', data: em.map(function (r) { return r[1]; }), borderColor: AMBER, backgroundColor: AMBER, tension: .35, pointRadius: 4, yAxisID: 'y1', order: 1,
        datalabels: dlTopo(fmtDec, AMBER) }
    ] }, options: { responsive: true, maintainAspectRatio: false,
      layout: { padding: { top: 20 } },
      plugins: { legend: { display: true, position: 'top', labels: { color: TK, font: { size: 11 } } }, tooltip: { mode: 'index', intersect: false } },
      scales: { x: { grid: { color: GR }, ticks: { color: TK, font: { size: 11 } }, border: { display: false } },
        y: { position: 'left', grid: { color: GR }, ticks: { color: TK }, border: { display: false } },
        y1: { position: 'right', grid: { display: false }, ticks: { color: TK }, border: { display: false } } } } });

    var exito = em.map(function (r) { return r[3] ? +((r[4] / r[3]) * 100).toFixed(1) : 0; });
    chart('ch_exito_venda', { type: 'bar', data: { labels: lm, datasets: [
      { label: 'Êxito de venda', data: exito, backgroundColor: GOOD + 'cc', borderRadius: 4 }
    ] }, options: { responsive: true, maintainAspectRatio: false,
      layout: { padding: { top: 20 } },
      plugins: { legend: { display: false },
        datalabels: { anchor: 'end', align: 'start', color: '#fff', font: FONTE_DL, formatter: function (v) { return v ? nf2.format(v) + '%' : ''; } },
        tooltip: { mode: 'index', intersect: false, callbacks: { label: function (c) { return VEND[c.dataIndex] + ' vendidos de ' + PUB[c.dataIndex] + ' publicados'; } } } },
      scales: { x: { grid: { color: GR }, ticks: { color: TK, font: { size: 11 } }, border: { display: false } },
        y: { min: 0, max: 100, grid: { color: GR }, ticks: { color: TK, callback: function (v) { return v + '%'; } }, border: { display: false } } } } });

    chart('ch_media_publicacoes', { type: 'line', data: { labels: lm, datasets: [
      { label: 'Publicações por veículo', data: em.map(function (r) { return r[2]; }), borderColor: AMBER, backgroundColor: AMBER, tension: .35, pointRadius: 4, fill: false }
    ] }, options: { responsive: true, maintainAspectRatio: false,
      layout: { padding: { top: 20 } },
      plugins: { legend: { display: false },
        datalabels: { anchor: 'end', align: 'top', offset: 2, clamp: true, color: TK, font: FONTE_DL, formatter: function (v) { return v ? nf2.format(v) : ''; } },
        tooltip: { mode: 'index', intersect: false, callbacks: { label: function (c) { return CRIADOS[c.dataIndex] + ' anúncios para ' + PUB[c.dataIndex] + ' veículos'; } } } },
      scales: { x: { grid: { color: GR }, ticks: { color: TK, font: { size: 11 } }, border: { display: false } },
        y: { min: 1, grid: { color: GR }, ticks: { color: TK, callback: function (v) { return v.toFixed(2).replace('.', ','); } }, border: { display: false } } } } });

    /* NAO usar outerHTML aqui: trocar o proprio elemento faz o el(id) do
       proximo render devolver null. So o conteudo muda. */
    /* Gráfico vazio sem explicação parece defeito. Estes gráficos cobrem os
       últimos 12 meses (e o de cadastros/dia, 30 dias) — se o período pedido
       cai fora dessa janela, não há o que desenhar, e dizer isso é melhor do
       que deixar o eixo em branco. */
    var nota = '';
    if ((F.ano || F.mes) && MON.length === 0) {
      nota = 'Sem dado no período escolhido: estes gráficos cobrem os últimos 12 meses de evento.';
    } else if ((F.ano || F.mes) && dias.length === 0) {
      nota = '"Cadastros por dia" cobre apenas os últimos 30 dias — fora dessa janela o gráfico fica vazio.';
    }
    el('evolNota').textContent = nota;
    el('evolSelo').innerHTML = seloPeriodo() + seloSemWl('evol');
    ['mediaSelo1', 'mediaSelo2', 'mediaSelo3'].forEach(function (id) {
      var e = el(id);
      e.textContent = 'sempre plataforma';
      e.title = 'Métrica do lado da oferta: sai de advertisements + shops, não passa por usuário. Não existe whitelabel de um anúncio — a chave é shop_id.';
    });
  }

  /* ═══ UF — três tabelas lado a lado + gráfico duplo eixo ════════════ */
  function renderUf() {
    SEM_WL.uf = false;
    var cad = serie(D.ufCad, D.ufCadWl, 'uf');
    var com = serie(D.ufCom, D.ufComWl, 'uf');
    var mCad = mapaSerie(cad, 1), mCom = mapaSerie(com, 1), mVol = mapaSerie(com, 2);
    var ufs = Object.keys(mCad).sort(function (a, b) { return (mCad[b] || 0) - (mCad[a] || 0); });
    var totCad = ufs.reduce(function (s, u) { return s + mCad[u]; }, 0);

    /* splitCols: o anterior parte a lista em 3 colunas de tamanho igual */
    var porCol = Math.ceil(ufs.length / 3) || 1;
    var cols = [ufs.slice(0, porCol), ufs.slice(porCol, porCol * 2), ufs.slice(porCol * 2)];
    el('ufTabelas').innerHTML = cols.map(function (col) {
      if (!col.length) return '<div></div>';
      return '<div><table><thead><tr><th>UF</th><th class="num">Cadastros</th><th class="num">%</th></tr></thead><tbody>' +
        col.map(function (u) {
          return '<tr><td>' + esc(u) + '</td><td class="num">' + n(mCad[u]) + '</td>' +
            '<td class="num">' + pct(mCad[u], totCad) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }).join('');

    var top = Object.keys(mCom).filter(function (u) { return mCom[u] > 0; })
      .sort(function (a, b) { return mCom[b] - mCom[a]; }).slice(0, 12);
    chart('ch_uf_compra', { data: { labels: top, datasets: [
      { type: 'bar', label: 'Compras', data: top.map(function (u) { return mCom[u]; }),
        backgroundColor: top.map(function (_, i) { return i === 0 ? AMBER + 'cc' : BRAND + 'cc'; }), borderRadius: 4, yAxisID: 'y', order: 2,
        datalabels: dlTopo(fmtInt, BRAND) },
      { type: 'line', label: 'Volume (R$ Mi)', data: top.map(function (u) { return +((mVol[u] || 0) / 1e6).toFixed(2); }),
        borderColor: AMBER, backgroundColor: AMBER, tension: .35, pointRadius: 4, yAxisID: 'y1', order: 1, datalabels: DL_OFF }
    ] }, options: { responsive: true, maintainAspectRatio: false,
      layout: { padding: { top: 20 } },
      plugins: { legend: { display: true, position: 'top', labels: { color: TK, font: { size: 11 } } }, tooltip: { mode: 'index', intersect: false } },
      scales: { x: { grid: { color: GR }, ticks: { color: TK, font: { size: 11 } }, border: { display: false } },
        y: { position: 'left', grid: { color: GR }, ticks: { color: TK }, border: { display: false }, title: { display: true, text: 'Compras', color: TK, font: { size: 10 } } },
        y1: { position: 'right', grid: { display: false }, ticks: { color: TK }, border: { display: false }, title: { display: true, text: 'R$ Mi', color: TK, font: { size: 10 } } } } } });
    el('ufSelo').innerHTML = seloSafra() + seloSemWl('uf');
  }

  /* ═══ TOP 10 — seções separadas, como no anterior ═══════════════════ */
  function tabelaTop(alvo, global, porWl, cabecalho, fmt, secao) {
    var rows;
    if (F.wl === '') rows = global;
    else if (!porWl || porWl.length === 0) {   /* query nao rodou: global + selo */
      if (secao) SEM_WL[secao] = true;
      rows = global;
    } else rows = porWl.filter(function (l) { return l[0] === +F.wl; }).map(function (l) { return l.slice(1); });
    rows = rows.slice(0, 10);
    if (!rows.length) { el(alvo).innerHTML = '<div class="placeholder">Sem dado neste recorte.</div>'; return; }
    el(alvo).innerHTML = '<table><thead><tr><th>#</th>' +
      cabecalho.map(function (c, i) { return '<th' + (i ? ' class="num"' : '') + '>' + esc(c) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + rows.map(function (r, i) {
        return '<tr><td class="mono">' + (i + 1) + '</td>' +
          '<td>' + esc(r[1]) + subLoja(r[0]) + '</td>' +
          fmt(r).map(function (v) { return '<td class="num">' + v + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table>';
  }
  function renderTops() {
    var ANO = new Date().getFullYear();
    SEM_WL.top = false;
    el('tituloTopAno').textContent = 'Top 10 Clientes — Compras em ' + ANO;
    el('tituloTopAcesso').textContent = 'Top 10 Acesso e Top 10 Oferta — ' + ANO;

    tabelaTop('topHist', D.topHist, D.topHistWl,
      ['Cliente', 'Compras (total)', 'Volume (total)', 'Última compra'],
      function (r) { return [n(r[2]), brl(r[3]), dataBr(r[4])]; }, 'top');
    tabelaTop('topAno', D.topAno, D.topAnoWl,
      ['Cliente', 'Compras ' + ANO, 'Volume ' + ANO, 'Última compra'],
      function (r) { return [n(r[2]), brl(r[3]), dataBr(r[4])]; }, 'top');
    tabelaTop('topAcesso', D.topAcesso, D.topAcessoWl,
      ['Mais dias ativos', 'Dias distintos'],
      function (r) { return [n(r[2])]; }, 'top');
    tabelaTop('topOfertas', D.topOfertas, D.topOfertasWl,
      ['Mais ofertas', 'Ofertas'],
      function (r) { return [n(r[2])]; }, 'top');
    el('topSelo').innerHTML = seloSafra() + seloSemWl('top');
  }

  /* ═══ DESTAQUES ═════════════════════════════════════════════════════ */
  function renderDestaques(a) {
    var rows = linhasCoorte().filter(function (r) { return (!F.ano && !F.mes) || casaSafra(r.ym); });
    var melhor = null;
    rows.forEach(function (r) {
      var t = r.v[r.off + iC.total];
      if (!melhor || t > melhor.t) melhor = { ym: r.ym, t: t };
    });
    /* `.insight` no CSS de producao e `display:flex` — no original o card e
       [badge][bloco de texto]. A primeira versao pendurava rotulo, valor e
       subtitulo como filhos diretos, entao o flex punha os TRES lado a lado,
       cada um com um terco da largura. Era isso que quebrava "53,66%" em duas
       linhas, e nao o tamanho da fonte. O bloco de texto agora e um filho so. */
    var itens = [
      ['📅', 'Safra mais numerosa', melhor ? rotuloMes(melhor.ym) : '—', melhor ? n(melhor.t) + ' cadastros' : ''],
      ['🔑', 'Taxa de login', pct(a.com_login, a.total), n(a.sem_login) + ' nunca logaram'],
      ['🛒', 'Oferta → compra', pct(a.compradores, a.ofertantes), 'dos ofertantes compraram'],
      ['💰', 'Ticket médio', a.negociacoes ? brl(a.volume / a.negociacoes) : '—', n(a.negociacoes) + ' negociações'],
      ['✅', 'Vendas concluídas', n(a.vendido), pct(a.vendido, a.negociacoes) + ' das negociações']
    ];
    el('destaques').innerHTML = itens.map(function (i) {
      return '<div class="insight">' +
        '<div class="insight-badge" style="background:var(--brand-soft)">' + i[0] + '</div>' +
        '<div><div class="insight-lbl">' + esc(i[1]) + '</div>' +
        kpiValor(i[2]) +
        '<div class="kpi-sub">' + esc(i[3]) + '</div></div></div>';
    }).join('');
  }

  /* ═══ RAIO-X ════════════════════════════════════════════════════════
     Os arrays rx_* vem indexados por buyer_user_id — o recorte por
     whitelabel e um filtro sobre o conjunto de compradores, nao uma
     requery. Foi o que evitou multiplicar 855 chamadas ao MCP por 58. */
  function compradoresDoRecorte() {
    if (F.wl === '') return null;
    var w = +F.wl, ok = {};
    for (var u in D.rxBuyerWl) { if (D.rxBuyerWl[u].indexOf(w) >= 0) ok[u] = 1; }
    return ok;
  }
  function porComprador(rows, ok) {
    var m = {};
    rows.forEach(function (r) {
      if (ok && !ok[r[0]]) return;
      (m[r[0]] = m[r[0]] || []).push(r.slice(2));
    });
    return m;
  }
  function dominante(entradas) {
    if (!entradas || !entradas.length) return { label: '—', pct: 0 };
    var agg = {}, total = 0;
    entradas.forEach(function (e) { agg[e[0]] = (agg[e[0]] || 0) + (+e[1] || 0); total += (+e[1] || 0); });
    var best = null, bq = -1;
    for (var k in agg) { if (agg[k] > bq) { bq = agg[k]; best = k; } }
    return { label: best, pct: total ? bq / total : 0, agg: agg, total: total };
  }
  var RX_ORD = { campo: 'compras', dir: -1 };

  function matrizRx() {
    var ok = compradoresDoRecorte();
    var tot = porComprador(D.rxTotais, ok), mod = porComprador(D.rxModelo, ok);
    var lau = porComprador(D.rxLaudo, ok), fai = porComprador(D.rxFaixa, ok);
    var par = porComprador(D.rxPartic, ok);
    var nomes = {}; D.rxBuyers.forEach(function (b) { nomes[b[0]] = b[1]; });

    var linhas = [];
    for (var uid in tot) {
      var compras = 0, volume = 0, pf = 0, fs = 0, pm = 0, ms = 0;
      tot[uid].forEach(function (r) {
        compras += +r[0] || 0; volume += +r[1] || 0;
        pf += +r[2] || 0; fs += +r[3] || 0; pm += +r[4] || 0; ms += +r[5] || 0;
      });
      if (compras <= 0) continue;
      var partic = 0;
      (par[uid] || []).forEach(function (r) { partic += +r[0] || 0; });
      linhas.push({
        id: +uid, nome: nomes[uid] || ('#' + uid),
        compras: compras, volume: volume,
        exito: partic ? compras / partic : 0,
        ticket: volume / compras,
        faixa: dominante(fai[uid]),
        fipe: fs ? pf / fs : null,
        molicar: ms ? pm / ms : null,
        modelo: dominante(mod[uid]),
        laudo: dominante(lau[uid])
      });
    }
    return linhas;
  }

  function renderRxMatriz() {
    el('rxSelo').innerHTML = seloSafra();
    var linhas = matrizRx();
    el('rxCount').textContent = n(linhas.length) + ' compradores';
    if (!linhas.length) {
      el('rxMatriz').innerHTML = '<div class="placeholder">Sem comprador neste recorte.</div>';
      return;
    }
    linhas.sort(function (a, b) {
      var x = a[RX_ORD.campo], y = b[RX_ORD.campo];
      if (typeof x === 'object') { x = x.pct; y = y.pct; }
      return (x === y ? 0 : (x > y ? 1 : -1)) * RX_ORD.dir;
    });
    var COLS = [['nome', 'Comprador'], ['compras', 'Compras'], ['exito', 'Êxito'],
      ['ticket', 'Ticket médio'], ['faixa', 'Faixa dominante'], ['fipe', 'Rec. FIPE'],
      ['molicar', 'Rec. Molicar'], ['modelo', 'Modelo dom.']];
    el('rxMatriz').innerHTML = '<table><thead><tr>' +
      COLS.map(function (c, i) {
        return '<th class="sortable' + (i ? ' num' : '') + '" data-campo="' + c[0] + '">' + esc(c[1]) +
          (RX_ORD.campo === c[0] ? (RX_ORD.dir < 0 ? ' ▾' : ' ▴') : '') + '</th>';
      }).join('') + '</tr></thead><tbody>' +
      linhas.slice(0, 200).map(function (r) {
        return '<tr><td>' + esc(r.nome) + subLoja(r.id) + '</td>' +
          '<td class="num">' + n(r.compras) + '</td>' +
          '<td class="num">' + pct1(r.exito) + '</td>' +
          '<td class="num">' + brl(r.ticket) + '</td>' +
          '<td class="num">' + esc(r.faixa.label) + '<span class="cell-sub">' + pct1(r.faixa.pct) + '</span></td>' +
          '<td class="num">' + (r.fipe == null ? '—' : pct1(r.fipe)) + '</td>' +
          '<td class="num">' + (r.molicar == null ? '—' : pct1(r.molicar)) + '</td>' +
          '<td class="num">' + esc(r.modelo.label) + '<span class="cell-sub">' + pct1(r.modelo.pct) + '</span></td></tr>';
      }).join('') + '</tbody></table>';

    Array.prototype.forEach.call(el('rxMatriz').querySelectorAll('th.sortable'), function (th) {
      th.addEventListener('click', function () {
        var c = th.getAttribute('data-campo');
        if (RX_ORD.campo === c) RX_ORD.dir = -RX_ORD.dir; else { RX_ORD.campo = c; RX_ORD.dir = -1; }
        renderRxMatriz();
      });
    });
  }

  /* ═══ RAIO-X INDIVIDUAL ═════════════════════════════════════════════ */
  function renderRxIndividual() {
    el('rxiSelo').innerHTML = seloSafra();
    var linhas = matrizRx().sort(function (a, b) { return b.compras - a.compras; });
    var sel = el('rxiSel');
    var atual = sel.value;
    sel.innerHTML = linhas.map(function (r) {
      return '<option value="' + r.id + '">' + esc(r.nome) + ' — ' + n(r.compras) + ' compras</option>';
    }).join('');
    if (!linhas.length) {
      el('rxiKpis').innerHTML = '<div class="placeholder">Sem comprador neste recorte.</div>';
      el('rxiDist').innerHTML = '';
      if (CH.ch_rxi) { CH.ch_rxi.destroy(); delete CH.ch_rxi; }
      return;
    }
    if (atual && linhas.some(function (r) { return String(r.id) === atual; })) sel.value = atual;
    desenhaComprador(+sel.value);
  }

  function desenhaComprador(id) {
    var linhas = matrizRx();
    var r = null;
    linhas.forEach(function (x) { if (x.id === id) r = x; });
    if (!r) return;

    el('rxiKpis').innerHTML = [
      ['Compras', n(r.compras)], ['Volume', brl(r.volume)],
      ['Ticket médio', brl(r.ticket)], ['Êxito', pct1(r.exito)],
      ['Rec. FIPE', r.fipe == null ? '—' : pct1(r.fipe)],
      ['Rec. Molicar', r.molicar == null ? '—' : pct1(r.molicar)]
    ].map(function (k) {
      return '<div class="kpi"><div class="kpi-label">' + k[0] + '</div>' + kpiValor(k[1]) + '</div>';
    }).join('');

    var meses = {}, vol = {};
    D.rxTotais.forEach(function (x) {
      if (x[0] !== id) return;
      meses[x[1]] = (meses[x[1]] || 0) + (+x[2] || 0);
      vol[x[1]] = (vol[x[1]] || 0) + (+x[3] || 0);
    });
    var ms = Object.keys(meses).sort();
    chart('ch_rxi', { data: { labels: ms.map(rotuloMes), datasets: [
      { type: 'bar', label: 'Compras', data: ms.map(function (m) { return meses[m]; }), backgroundColor: BRAND + 'cc', borderRadius: 4, yAxisID: 'y', order: 2,
        datalabels: dlTopo(fmtInt, BRAND) },
      { type: 'line', label: 'Volume (R$ Mi)', data: ms.map(function (m) { return +((vol[m] || 0) / 1e6).toFixed(2); }), borderColor: AMBER, backgroundColor: AMBER, tension: .35, pointRadius: 4, yAxisID: 'y1', order: 1,
        datalabels: dlTopo(fmtDec, AMBER) }
    ] }, options: { responsive: true, maintainAspectRatio: false,
      layout: { padding: { top: 20 } },
      plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
      scales: { x: { grid: { color: GR }, ticks: { color: TK, font: { size: 11 } }, border: { display: false } },
        y: { position: 'left', grid: { color: GR }, ticks: { color: TK }, border: { display: false } },
        y1: { position: 'right', grid: { display: false }, ticks: { color: TK }, border: { display: false } } } } });

    function dist(titulo, dom) {
      var ks = Object.keys(dom.agg || {}).sort(function (a, b) { return dom.agg[b] - dom.agg[a]; }).slice(0, 8);
      if (!ks.length) return '';
      return '<div class="rec-card"><div class="rec-head">' + titulo + '</div>' +
        ks.map(function (k) {
          var p = dom.total ? (dom.agg[k] / dom.total) * 100 : 0;
          return '<div class="rec-row"><span class="rec-period">' + esc(k) + '</span>' +
            '<span class="rec-bar-bg"><span class="rec-bar" style="width:' + p.toFixed(1) + '%"></span></span>' +
            '<span class="rec-count">' + n(dom.agg[k]) + '</span></div>';
        }).join('') + '</div>';
    }
    el('rxiDist').innerHTML = dist('Modelos', r.modelo) + dist('Faixa de preço', r.faixa) + dist('Laudo', r.laudo);
  }

  /* ═══ ORQUESTRAÇÃO ══════════════════════════════════════════════════ */
  function render() {
    var a = agrega();
    el('escopo').textContent = rotuloEscopo();
    el('escopoTopo').textContent = nomeWl();
    renderKpis(a);
    renderSituacao(a);
    renderRec(a);
    renderEvol();
    renderUf();
    renderTops();
    renderDestaques(a);
    if (MOSTRAR_RAIOX) { renderRxMatriz(); renderRxIndividual(); }
  }

  /* Redesenha so o painel que ficou visivel. Cada aba sabe quais renders
     dependem de medir o canvas. */
  function redesenhaPainel(aba) {
    if (aba === 'geral') { renderEvol(); renderUf(); }
    else if (aba === 'rx' && MOSTRAR_RAIOX) { renderRxMatriz(); }
    else if (aba === 'rxi' && MOSTRAR_RAIOX) { renderRxIndividual(); }
  }

  function montaControles() {
    var wl = el('fWl');
    wl.innerHTML = '<option value="">Todos os whitelabels</option>' +
      D.meta.wls.map(function (w) {
        return '<option value="' + w[0] + '">' + esc(w[1]) + ' (' + n(w[2]) + ')</option>';
      }).join('');

    var anos = {}, meses = {};
    D.coorte.forEach(function (l) {
      if (!l[0]) return;
      anos[l[0].slice(0, 4)] = 1; meses[l[0].slice(5, 7)] = 1;
    });
    el('fAno').innerHTML = '<option value="">Todos os anos</option>' +
      Object.keys(anos).sort().reverse().map(function (a) { return '<option value="' + a + '">' + a + '</option>'; }).join('');
    el('fMes').innerHTML = '<option value="">Todos os meses</option>' +
      Object.keys(meses).sort().map(function (m) { return '<option value="' + m + '">' + MESNOME[+m] + '</option>'; }).join('');

    function muda() {
      F.wl = wl.value; F.ano = el('fAno').value; F.mes = el('fMes').value;
      render();
    }
    wl.addEventListener('change', muda);
    el('fAno').addEventListener('change', muda);
    el('fMes').addEventListener('change', muda);
    el('fReset').addEventListener('click', function () {
      wl.value = ''; el('fAno').value = ''; el('fMes').value = ''; muda();
    });
    el('rxiSel').addEventListener('change', function () { desenhaComprador(+this.value); });

    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
      t.addEventListener('click', function () {
        Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (x) { x.classList.remove('active'); });
        Array.prototype.forEach.call(document.querySelectorAll('[data-painel]'), function (p) { p.style.display = 'none'; });
        t.classList.add('active');
        var aba = t.getAttribute('data-aba');
        var alvo = document.querySelector('[data-painel="' + aba + '"]');
        if (alvo) alvo.style.display = '';
        /* Chart.js mede um canvas escondido como 0x0, e resize() NAO recupera
           depois: o grafico ja nasceu com chartArea de largura zero. Foi o que
           aconteceu com o ch_rxi, que vive numa aba fechada no primeiro render
           — as barras sairam espremidas no canto.
           Redesenhar o painel que acabou de aparecer resolve de verdade, e
           custa nada: e tudo no cliente, sem ida ao banco. */
        redesenhaPainel(aba);
      });
    });
  }

  if (D.avisos && D.avisos.length) {
    var box = el('avisos');
    box.style.display = '';
    box.innerHTML = '<strong>Avisos do gerador:</strong><ul>' +
      D.avisos.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>';
  }

  montaControles();
  render();
})();
