function APP(D) {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s === null || s === undefined ? '' : s)
    .split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');
  const nf = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('pt-BR'));
  const n1 = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 }));
  const rs = (n) => (n === null || n === undefined ? '—' : 'R$ ' + Math.round(n).toLocaleString('pt-BR'));
  const pc = (x) => (x === null || x === undefined ? '—' : (100 * x).toFixed(1).replace('.', ',') + '%');
  const pc0 = (x) => (x === null || x === undefined ? '—' : Math.round(100 * x) + '%');
  const dt = (s) => (s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(2, 4) + ' ' + s.slice(11, 16) : '—');
  const dia = (s) => (s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '—');
  const diaCod = (c) => c.slice(4, 6) + '/' + c.slice(2, 4);
  const diaAntes = (s) => {
    const d = new Date(Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)) - 1));
    const p2 = (n) => (n < 10 ? '0' : '') + n;
    return p2(d.getUTCDate()) + '/' + p2(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear();
  };
  const FAROL = { sem: 'Sem oferta', abaixo: 'Oferta abaixo do VMV', atingiu: 'VMV atingido' };
  const tagStatus = (v) => {
    const nome = D.status_nome[v.status] || ('status ' + v.status);
    let cls = '';
    if (v.vendido) cls = 'ok';
    else if (v.status === 11 || v.status === 10) cls = 'ruim';
    else if ([14, 15, 18, 8].indexOf(v.status) >= 0) cls = 'atencao';
    return '<span class="tag ' + cls + '">' + esc(nome) + '</span>';
  };
  const lojaPorId = {};
  D.lojas.forEach((l) => { lojaPorId[l.id] = l; });
  const trilho = (x) => '<span class="trilho" aria-hidden="true"><i style="width:' +
    (x === null ? 0 : Math.max(0, Math.min(100, 100 * x))).toFixed(1) + '%"></i></span>';
  let sel = 'todos';
  let filtroLojas = 'todas';
  let lojasNovasExp = [];
  const F = { dia: '', patio: '', farol: '', dia_hora: '' };
  const FILTROS = ['dia', 'patio', 'farol'];
  const quandoCod = (c) => (c ? c.slice(4, 6) + '/' + c.slice(2, 4) + ' ' + c.slice(6, 8) + 'h' : null);
  const ordem = {
    lojas: { k: 'arrem', dir: -1 },
    veic: { k: 'score', dir: 1 }, patios: { k: 'veiculos', dir: -1 }
  };
  const TABELAS = {};
  function tabela(id, cols, linhas, fixo) {
    TABELAS[id] = { cols: cols, linhas: linhas, fixo: fixo };
    desenhaTabela(id);
  }
  function desenhaTabela(id) {
    const t = TABELAS[id];
    const o = ordem[id];
    const col = t.cols.find((c) => c.k === o.k) || t.cols[0];
    const val = (r) => (col.v ? col.v(r) : r[col.k]);
    const idx = t.linhas.map((r, i) => [r, i]);
    idx.sort((a, b) => {
      if (t.fixo) {
        const fa = t.fixo(a[0]) ? 1 : 0;
        const fb = t.fixo(b[0]) ? 1 : 0;
        if (fa !== fb) return fa - fb;
      }
      const x = val(a[0]);
      const y = val(b[0]);
      const vx = x === null || x === undefined;
      const vy = y === null || y === undefined;
      if (vx || vy) return vx === vy ? a[1] - b[1] : (vx ? 1 : -1);
      if (x === y) return a[1] - b[1];
      if (typeof x === 'string') return o.dir * x.localeCompare(y);
      return o.dir * (x < y ? -1 : 1);
    });
    $('#th-' + id).innerHTML = t.cols.map((c) => {
      const at = c.k === o.k;
      return '<th class="' + (c.n ? 'n' : '') + '"' + (at ? ' aria-sort="' + (o.dir > 0 ? 'ascending' : 'descending') + '"' : '') + '>' +
        '<button type="button" class="ord' + (at ? ' at' : '') + '" data-t="' + id + '" data-k="' + c.k + '">' +
        esc(c.t) + '<span class="seta-ord" aria-hidden="true">' + (at ? (o.dir > 0 ? '▲' : '▼') : '') + '</span></button></th>';
    }).join('');
    $('#tb-' + id).innerHTML = idx.length
      ? idx.map((p, i) => '<tr>' + t.cols.map((c) => '<td class="' + (c.n ? 'n' : '') + (c.cls ? ' ' + c.cls : '') + '">' +
          (c.h ? c.h(p[0], i) : esc(p[0][c.k])) + '</td>').join('') + '</tr>').join('')
      : '<tr><td colspan="' + t.cols.length + '" class="dim">Nada neste recorte.</td></tr>';
  }
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('button.ord');
    if (!b) return;
    const id = b.getAttribute('data-t');
    const k = b.getAttribute('data-k');
    const t = TABELAS[id];
    const c = t.cols.find((x) => x.k === k);
    if (ordem[id].k === k) ordem[id].dir = -ordem[id].dir;
    else { ordem[id].k = k; ordem[id].dir = c.n ? -1 : 1; }
    desenhaTabela(id);
  });
  const dica = $('#dica-g');
  function mostraDica(alvo, html) {
    dica.innerHTML = html;
    dica.hidden = false;
    const r = alvo.getBoundingClientRect();
    const w = dica.offsetWidth;
    let x = r.left + r.width / 2 - w / 2;
    x = Math.max(8, Math.min(window.innerWidth - w - 8, x));
    let y = r.top - dica.offsetHeight - 8;
    if (y < 8) y = r.bottom + 8;
    dica.style.left = x + 'px';
    dica.style.top = y + 'px';
  }
  const escondeDica = () => { dica.hidden = true; };
  ['mouseover', 'focusin'].forEach((tipo) => document.addEventListener(tipo, (ev) => {
    const a = ev.target.closest ? ev.target.closest('[data-dica]') : null;
    if (a) mostraDica(a, a.getAttribute('data-dica'));
  }));
  ['mouseout', 'focusout'].forEach((tipo) => document.addEventListener(tipo, (ev) => {
    const a = ev.target.closest ? ev.target.closest('[data-dica]') : null;
    if (a) escondeDica();
  }));
  window.addEventListener('scroll', escondeDica, { passive: true });
  const LARG_PADRAO = 640;
  function colunas(alvo, grupos, series, rotX, op) {
    op = op || {};
    const LARG = op.largura || LARG_PADRAO;
    let ALT = 210;
    if (op.preenche) {
      const cx = alvo.getBoundingClientRect();
      if (cx.width > 0 && cx.height > 0) ALT = Math.max(180, Math.round(LARG * cx.height / cx.width));
    }
    const n = grupos.length;
    if (!n) { alvo.innerHTML = '<p class="dim">Sem acesso no período.</p>'; return; }
    const topoVal = Math.max(1, Math.max.apply(null, grupos.map((g) => Math.max.apply(null, series.map((s) => g[s.k])))));
    const larguraTexto = (v) => String(nf(v)).length * 6.2 + 4;
    const maiorRot = Math.max.apply(null, grupos.map((g) => Math.max.apply(null, series.map((s) => larguraTexto(g[s.k])))));
    const slot0 = (LARG - 8) / n;
    const barra0 = Math.min(24, (slot0 - 6 - 2 * (series.length - 1)) / series.length);
    const comRotulo = barra0 + 2 >= maiorRot;
    const esq = comRotulo ? 4 : 40;
    const slot = (LARG - esq - 4) / n;
    const barra = Math.max(2, Math.min(24, (slot - 6 - 2 * (series.length - 1)) / series.length));
    const topo = comRotulo ? 18 : 10;
    const base = ALT - 22;
    const h = (v) => (base - topo) * v / topoVal;
    let s = '<svg class="graf" viewBox="0 0 ' + LARG + ' ' + ALT + '" role="img" aria-label="' + esc(alvo.getAttribute('data-rot')) + '">';
    if (!comRotulo) {
      const passo = Math.pow(10, Math.floor(Math.log(topoVal) / Math.LN10)) / 10;
      const pas = Math.max(1, [1, 2, 5, 10, 20, 50].map((m) => m * passo).find((p) => topoVal / p <= 5) || passo * 100);
      for (let v = 0; v <= topoVal; v += pas) {
        const y = base - h(v);
        s += '<line class="linha-grade" x1="' + esq + '" x2="' + (LARG - 4) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>' +
          '<text class="eixo" x="' + (esq - 6) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end">' + nf(v) + '</text>';
      }
    } else {
      s += '<line class="linha-grade" x1="' + esq + '" x2="' + (LARG - 4) + '" y1="' + base + '" y2="' + base + '"/>';
    }
    const cadaX = Math.max(1, Math.ceil(n / Math.floor((LARG - esq) / 40)));
    grupos.forEach((g, i) => {
      const x0 = esq + i * slot;
      const chave = op.chave ? op.chave(g) : null;
      const marcado = chave !== null && chave === op.marcado;
      if (marcado) {
        s += '<rect class="marca-col" x="' + x0.toFixed(1) + '" y="' + topo + '" width="' + slot.toFixed(1) + '" height="' + (base - topo) + '"/>';
      }
      const larg = series.length * barra + 2 * (series.length - 1);
      const xi = x0 + (slot - larg) / 2;
      series.forEach((se, j) => {
        const v = g[se.k];
        const hh = h(v);
        const x = xi + j * (barra + 2);
        const y = base - hh;
        const r = Math.min(4, barra / 2, hh);
        if (hh > 0) {
          s += '<path class="' + se.cls + '" d="M' + x.toFixed(1) + ' ' + base + 'V' + (y + r).toFixed(1) +
            'Q' + x.toFixed(1) + ' ' + y.toFixed(1) + ' ' + (x + r).toFixed(1) + ' ' + y.toFixed(1) +
            'H' + (x + barra - r).toFixed(1) + 'Q' + (x + barra).toFixed(1) + ' ' + y.toFixed(1) + ' ' +
            (x + barra).toFixed(1) + ' ' + (y + r).toFixed(1) + 'V' + base + 'Z"/>';
        }
        if (comRotulo && v > 0) {
          s += '<text class="rotulo" x="' + (x + barra / 2).toFixed(1) + '" y="' + (y - 5).toFixed(1) + '" text-anchor="middle">' + nf(v) + '</text>';
        }
      });
      if (i % cadaX === 0 || marcado) {
        s += '<text class="eixo' + (marcado ? ' forte' : '') + '" x="' + (x0 + slot / 2).toFixed(1) + '" y="' + (ALT - 6) + '" text-anchor="middle">' + esc(rotX(g)) + '</text>';
      }
      const txt = '<b>' + esc(rotX(g)) + '</b>' + series.map((se) => '<br><span class="amostra ' + se.cls + '"></span>' +
        esc(se.nome) + ': ' + nf(g[se.k])).join('') + (chave !== null ? '<br><span class="dim">' +
        (marcado ? 'clique para voltar a todos os dias' : 'clique para ver as horas deste dia') + '</span>' : '');
      s += '<rect class="alvo' + (chave !== null ? ' clicavel' : '') + '" x="' + x0.toFixed(1) + '" y="' + topo + '" width="' + slot.toFixed(1) + '" height="' + (base - topo + 22) +
        '" tabindex="0" data-dica="' + esc(txt) + '"' + (chave !== null ? ' data-k="' + esc(chave) + '"' : '') + '/>';
    });
    alvo.innerHTML = s + '</svg>';
  }
  function funil(alvo, etapas) {
    const W = 640;
    const COL_ROT = 120;
    const COL_PC = 60;
    const FW = W - COL_ROT - COL_PC - 16;
    const ALT_F = 38;
    const VAO = 20;
    const v0 = etapas[0][1] || 0;
    const MIN_F = 3 * 7.4 + 16;
    const larg = etapas.map((f) => MIN_F + (FW - MIN_F) * (v0 ? f[1] / v0 : 0));
    const H = etapas.length * ALT_F + (etapas.length - 1) * VAO;
    const c = COL_ROT + 8 + FW / 2;
    let s = '<svg class="graf funil-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Funil de ativação dos novos cadastros">';
    etapas.forEach((f, i) => {
      const y = i * (ALT_F + VAO);
      const meio = y + ALT_F / 2 + 4.5;
      const wt = larg[i];
      const wb = i < etapas.length - 1 ? larg[i + 1] : Math.max(MIN_F, larg[i] * 0.94);
      const pts = [[c - wt / 2, y], [c + wt / 2, y], [c + wb / 2, y + ALT_F], [c - wb / 2, y + ALT_F]]
        .map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
      const pcTot = v0 ? pc0(f[1] / v0) : '—';
      const ant = i > 0 ? etapas[i - 1][1] : null;
      const txtN = nf(f[1]);
      const cabe = Math.min(wt, wb) >= txtN.length * 7.4 + 14;
      s += '<text class="f-rot" x="0" y="' + meio + '">' + esc(f[0]) + '</text>' +
        '<polygon class="f-forma" points="' + pts + '" tabindex="0" data-dica="' +
        esc('<b>' + esc(f[0]) + '</b><br>' + txtN + ' lojas · ' + pcTot + ' dos cadastrados' +
          (i ? '<br>' + (ant ? pc(f[1] / ant) : '—') + ' da etapa anterior' : '')) + '"/>' +
        (cabe
          ? '<text class="f-txt" x="' + c + '" y="' + meio + '" text-anchor="middle">' + txtN + '</text>'
          : '<text class="f-txt" x="' + (c + Math.max(wt, wb) / 2 + 6).toFixed(1) + '" y="' + meio + '">' + txtN + '</text>') +
        '<text class="f-pc" x="' + W + '" y="' + meio + '" text-anchor="end">' + pcTot + '</text>';
      if (i < etapas.length - 1) {
        s += '<text class="f-conv" x="' + c + '" y="' + (y + ALT_F + VAO / 2 + 4) + '" text-anchor="middle">' +
          '↓ ' + (etapas[i][1] ? pc(etapas[i + 1][1] / etapas[i][1]) : '—') + '</text>';
      }
    });
    alvo.innerHTML = s + '</svg>';
  }
  function opcoes(id, lista, rotTodos, atual) {
    const el = $('#' + id);
    el.innerHTML = '<option value="">' + esc(rotTodos) + '</option>' + lista.map((o) =>
      '<option value="' + esc(o[0]) + '"' + (o[0] === atual ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('');
    el.value = lista.some((o) => o[0] === atual) ? atual : '';
    return el.value;
  }
  function montaFiltros() {
    const base = calcula(D, sel, {});
    if (F.dia && base.dias_periodo.indexOf(F.dia) < 0) F.dia = '';
    F.patio = opcoes('f-patio', base.patios_evento.map((p) => [p, p]), 'Todos os pátios', F.patio);
    F.farol = opcoes('f-farol', [['sem', FAROL.sem], ['abaixo', FAROL.abaixo], ['atingiu', FAROL.atingiu]], 'Todos os status', F.farol);
    if (F.dia_hora && base.dias_periodo.indexOf(F.dia_hora) < 0) F.dia_hora = '';
  }
  function contaFiltros() {
    const n = FILTROS.filter((k) => k !== 'dia' && F[k]).length + (sel === 'todos' ? 0 : 1);
    const b = $('#aba-n');
    b.textContent = n ? String(n) : '';
    b.hidden = !n;
  }
  function gaveta(abre) {
    $('#gaveta').className = abre ? 'gaveta aberta' : 'gaveta';
    $('#veu').hidden = !abre;
    $('#aba').setAttribute('aria-expanded', abre ? 'true' : 'false');
  }
  $('#aba').addEventListener('click', () => gaveta($('#gaveta').className.indexOf('aberta') < 0));
  $('#fecha').addEventListener('click', () => gaveta(false));
  $('#veu').addEventListener('click', () => gaveta(false));
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') gaveta(false); });
  [['f-patio', 'patio'], ['f-farol', 'farol']].forEach((p) => {
    $('#' + p[0]).addEventListener('change', (ev) => {
      F[p[1]] = ev.target.value;
      render();
    });
  });
  $('#limpar').addEventListener('click', () => {
    FILTROS.forEach((k) => { F[k] = ''; });
    F.dia_hora = '';
    sel = 'todos';
    $('#f-evento').value = 'todos';
    alterna('seg-lojas', 'todas', (v) => { filtroLojas = v; });
    montaFiltros();
    render();
  });
  function render() {
    contaFiltros();
    const R = calcula(D, sel, F);
    const k = R.kpi;
    const ev = sel === 'todos' ? null : R.eventos[0];
    $('#sub').textContent = (ev
      ? ev.nome + ' · ' + dt(ev.ini) + ' → ' + dt(ev.fim) + ' · ' + ev.estado
      : 'C6 · ' + D.eventos.length + (D.eventos.length === 1 ? ' evento' : ' eventos') + ' da Fenauto na semana de ' +
        dia(D.semana[0]).slice(0, 5) + ' a ' + diaAntes(D.semana[1]).slice(0, 5) +
        (R.periodo[0] ? ' · ' + dt(R.periodo[0]) + ' → ' + dt(R.periodo[1]) : '')) +
      (sel !== 'todos' || FILTROS.some((x) => F[x]) ? ' · com filtros' : '');
    const pcBar = (idTxt, idBar, x, rot) => {
      $(idTxt).textContent = x === null ? '—' : pc(x) + ' ' + rot;
      $(idBar).innerHTML = trilho(x);
    };
    $('#k-pub').textContent = nf(k.publicados);
    pcBar('#k-pub-pc', '#k-pub-bar', k.publicados ? k.acessados / k.publicados : null, 'dos anúncios acessados');
    $('#k-pub-vend').textContent = nf(k.vendidos);
    $('#k-pub-vmv').textContent = nf(k.vmv_atingido);
    $('#k-of').textContent = nf(k.com_oferta);
    pcBar('#k-of-pc', '#k-of-bar', k.publicados ? k.com_oferta / k.publicados : null, 'dos publicados');
    $('#k-of-lj').textContent = nf(k.ofertantes);
    $('#k-of-lpl').textContent = n1(k.lances_por_lojista);
    $('#k-vd').textContent = nf(k.vendidos);
    pcBar('#k-vd-pc', '#k-vd-bar', k.publicados ? k.vendidos / k.publicados : null, 'dos publicados');
    $('#k-vd-comp').textContent = nf(k.compradores);
    $('#k-vd-ppl').textContent = n1(k.part_por_lojista);
    $('#k-pf').textContent = rs(k.volume);
    pcBar('#k-pf-pc', '#k-pf-bar', k.pc_vendido_vmv, 'da soma dos VMV publicados');
    const pcPe = (id, x) => { $(id).innerHTML = (x === null ? '—' : pc(x)) + trilho(x); };
    pcPe('#k-pf-fipe', k.pc_arrem_fipe);
    pcPe('#k-pf-vmv', k.pc_arrem_vmv);
    $('#k-nv').textContent = nf(k.novas);
    pcBar('#k-nv-pc', '#k-nv-bar', k.engajamento, 'de engajamento');
    $('#k-nv-ac').textContent = nf(k.novas_acessaram);
    $('#k-nv-of').textContent = nf(k.novas_ofertaram);
    $('#k-nv-cp').textContent = nf(k.novas_compraram);
    $('#k-rt').textContent = nf(k.reativadas);
    pcBar('#k-rt-pc', '#k-rt-bar', k.engaj_reativadas, 'de engajamento');
    $('#k-rt-ac').textContent = nf(k.reativadas_acessaram);
    $('#k-rt-of').textContent = nf(k.reativadas_ofertaram);
    $('#k-rt-cp').textContent = nf(k.reativadas_compraram);
    const tipoVis = filtroLojas === 'novas' ? 'N' : filtroLojas === 'reativadas' ? 'R' : '';
    const lojasVis = R.lojas.filter((r) => (r.nova || r.acessos > 0) && (!tipoVis || r.nova === tipoVis));
    const um = lojasVis.length === 1;
    $('#n-lojas').textContent = lojasVis.length + (tipoVis === 'N' ? (um ? ' loja nova' : ' lojas novas')
      : tipoVis === 'R' ? (um ? ' loja reativada' : ' lojas reativadas') : (um ? ' loja' : ' lojas'));
    lojasNovasExp = R.lojas.filter((r) => r.nova);
    tabela('lojas', [
      { k: 'nome', t: 'Loja', h: (r) => esc(r.nome) + (r.nova && !tipoVis ? ' ' + seloTipo(r.nova, 'a') : '') },
      { k: 'pri', t: 'Primeiro acesso', n: true, h: (r) => esc(quandoCod(r.pri) || '—') },
      { k: 'ult', t: 'Último acesso', n: true, h: (r) => esc(quandoCod(r.ult) || '—') },
      { k: 'acessos', t: 'Acessos', n: true, h: (r) => nf(r.acessos) },
      { k: 'lances', t: 'Ofertas', n: true, h: (r) => nf(r.lances) },
      { k: 'veic', t: 'Veículos', n: true, h: (r) => nf(r.veic) },
      { k: 'arrem', t: 'Recuperações', n: true, h: (r) => nf(r.arrem) }
    ], lojasVis);
    $('#n-funil').textContent = nf(R.funil[0][1]) + ' cadastros';
    $('#f-dias').innerHTML = [['', 'Todos']].concat(R.dias_periodo.map((c) => [c, diaCod(c)]))
      .map((o) => '<button type="button" data-d="' + o[0] + '" aria-pressed="' + (F.dia === o[0]) + '">' + esc(o[1]) + '</button>').join('');
    funil($('#funil'), R.funil);
    $('#n-dia').textContent = nf(k.lojas_ranking_acessaram) + (k.lojas_ranking_acessaram === 1 ? ' loja' : ' lojas');
    colunas($('#g-dia'), R.por_dia, [
      { k: 'total', nome: 'Total', cls: 'serie-b' },
      { k: 'novas', nome: 'Novos', cls: 'serie-a' },
      { k: 'reativadas', nome: 'Reativados', cls: 'serie-c' }
    ], (g) => diaCod(g.dia), { preenche: true, chave: (g) => g.dia, marcado: F.dia_hora });
    $('#n-hora').textContent = nf(k.acessos) + ' acessos';
    $('#hora-dia').innerHTML = F.dia_hora
      ? 'em ' + diaCod(F.dia_hora) + ' <button type="button" class="limpa-dia" id="limpa-dia">todos os dias ✕</button>'
      : '';
    colunas($('#g-hora'), R.por_hora, [
      { k: 'total', nome: 'Total', cls: 'serie-b' },
      { k: 'novas', nome: 'Novos', cls: 'serie-a' },
      { k: 'reativadas', nome: 'Reativados', cls: 'serie-c' }
    ], (g) => g.h + 'h', { largura: 1280 });
    $('#n-patios').textContent = R.patios.length + ' pátios';
    tabela('patios', [
      { k: 'patio', t: 'Pátio', cls: 'sem-quebra' },
      { k: 'veiculos', t: 'Veículos', n: true, h: (p) => nf(p.veiculos) },
      { k: 'acesso', t: 'C/ acesso', n: true, h: (p) => nf(p.acesso) },
      { k: 'oferta', t: 'C/ oferta', n: true, h: (p) => nf(p.oferta) },
      { k: 'conversao', t: '% conversão', n: true, h: (p) => pc(p.conversao) },
      { k: 'vmv', t: 'C/ VMV atingido', n: true, h: (p) => nf(p.vmv) },
      { k: 'pc_vmv', t: '% C/ VMV atingido', n: true, h: (p) => pc(p.pc_vmv) }
    ], R.patios);
    $('#n-veic').textContent = R.veiculos.length + ' veículos';
    tabela('veic', [
      { k: 'nome', t: 'Veículo', h: (v) => '<span class="farol ' + v.farol + '" title="' + FAROL[v.farol] + '"></span>' +
        (v.link ? '<a href="' + esc(v.link) + '" target="_blank" rel="noopener">' + esc(v.nome) + ' ↗</a>' : esc(v.nome)) +
        '<span class="dim sub">' + esc(v.ano) + ' · ' + esc(v.patio) + (v.n_ev > 1 ? ' · em ' + v.n_ev + ' eventos' : '') + '</span>' },
      { k: 'acessos', t: 'Acessos', n: true, h: (v) => nf(v.acessos) },
      { k: 'qtd', t: 'Ofertas', n: true, h: (v) => nf(v.qtd) },
      { k: 'ult', t: 'Última oferta', n: true, h: (v) => rs(v.ult) + (v.ult_quando ? '<span class="dim sub">' + dt(v.ult_quando) + '</span>' : '') },
      { k: 'fipe', t: 'FIPE', n: true, h: (v) => rs(v.fipe) },
      { k: 'pfipe', t: '% FIPE', n: true, cls: 'c-vmv', h: (v) => (v.pfipe === null ? '<span class="dim">—</span>'
        : '<span class="vmv">' + trilho(v.pfipe) + '<span class="num">' + pc0(v.pfipe) + '</span></span>') },
      { k: 'pvmv', t: '% VMV', n: true, cls: 'c-vmv', h: (v) => (v.pvmv === null ? '<span class="dim">—</span>'
        : '<span class="vmv' + (v.pvmv >= 1 ? ' ok' : '') + '">' + trilho(v.pvmv) + '<span class="num">' + pc0(v.pvmv) + '</span></span>') },
      { k: 'score', t: 'Score', n: true, cls: 'forte', h: (v) => n1(v.score) },
      { k: 'status', t: 'Resultado', v: (v) => D.status_nome[v.status] || '', h: (v) => {
        if (v.arrematante === null) return tagStatus(v);
        const l = lojaPorId[v.arrematante] || {};
        return tagStatus(v) + '<span class="dim sub">' + esc(l.nome || ('loja ' + v.arrematante)) +
          (R.nova[v.arrematante] ? ' ' + seloTipo(R.nova[v.arrematante], 'o') : '') + '</span>';
      } }
    ], R.veiculos);
  }
  function seloTipo(t, g) {
    return t === 'R' ? '<span class="tag reat">reativad' + g + '</span>' : '<span class="tag ok">nov' + g + '</span>';
  }
  function alterna(id, valor, aplica) {
    document.querySelectorAll('#' + id + ' button').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === valor)));
    aplica(valor);
  }
  $('#seg-lojas').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-v]');
    if (!b) return;
    alterna('seg-lojas', b.getAttribute('data-v'), (v) => { filtroLojas = v; });
    render();
  });
  $('#f-dias').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-d]');
    if (!b) return;
    F.dia = b.getAttribute('data-d');
    F.dia_hora = '';
    render();
  });
  $('#g-dia').addEventListener('click', (ev) => {
    const r = ev.target.closest('rect[data-k]');
    if (!r) return;
    const c = r.getAttribute('data-k');
    F.dia_hora = F.dia_hora === c ? '' : c;
    escondeDica();
    render();
  });
  $('#g-dia').addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    const r = ev.target.closest('rect[data-k]');
    if (!r) return;
    ev.preventDefault();
    r.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  document.addEventListener('click', (ev) => {
    if (!ev.target.closest('#limpa-dia')) return;
    F.dia_hora = '';
    render();
  });
  document.addEventListener('click', (ev) => {
    if (!ev.target.closest('#exporta-novas')) return;
    const asp = String.fromCharCode(34);
    const cel = (v) => (typeof v === 'number' ? String(v) : asp + String(v === null || v === undefined ? '' : v).split(asp).join(asp + asp) + asp);
    const cab = ['Loja', 'Tipo', 'Primeiro acesso', 'Último acesso', 'Acessos', 'Ofertas', 'Veículos', 'Recuperações'];
    const linhas = lojasNovasExp.map((r) => [r.nome, r.nova === 'R' ? 'Reativado' : 'Novo', quandoCod(r.pri), quandoCod(r.ult), r.acessos, r.lances, r.veic, r.arrem]);
    const nl = String.fromCharCode(13, 10);
    const txt = String.fromCharCode(65279) + [cab].concat(linhas).map((l) => l.map(cel).join(';')).join(nl) + nl;
    const url = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'novos-lojistas-fenauto-c6-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  let esperaLk = null;
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest ? ev.target.closest('a[target="_blank"]') : null;
    if (!a) return;
    ev.preventDefault();
    const url = a.href;
    let w = null;
    try { w = window.open(url, '_blank'); if (w) w.opener = null; } catch (e) { w = null; }
    if (w) return;
    let copiou = false;
    try {
      const t = document.createElement('textarea');
      t.value = url;
      t.style.position = 'fixed';
      t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      copiou = document.execCommand('copy');
      document.body.removeChild(t);
    } catch (e) { copiou = false; }
    const cx = $('#dica-lk');
    cx.innerHTML = '<b>' + (copiou ? 'Link copiado' : 'O navegador bloqueou a abertura') + '</b>' +
      '<span class="dim sub">Abra uma nova aba e cole o endereço:</span><span class="lk-url"></span>';
    cx.querySelector('.lk-url').textContent = url;
    cx.hidden = false;
    clearTimeout(esperaLk);
    esperaLk = setTimeout(() => { cx.hidden = true; }, 12000);
  });
  let espera = null;
  window.addEventListener('resize', () => {
    clearTimeout(espera);
    espera = setTimeout(render, 150);
  });
  const evOrd = D.eventos.slice().sort((a, b) => (a.fim < b.fim ? 1 : -1));
  $('#f-evento').innerHTML = '<option value="todos">Todos os eventos (' + D.eventos.length + ')</option>' +
    evOrd.map((e) => '<option value="' + e.id + '">' + esc(e.nome) + ' · ' +
      calcula(D, e.id).eventos[0].estado + '</option>').join('');
  $('#f-evento').addEventListener('change', (ev) => {
    sel = ev.target.value === 'todos' ? 'todos' : Number(ev.target.value);
    montaFiltros();
    render();
  });
  if (D.avisos.length) {
    const b = $('#b-aviso');
    b.hidden = false;
    b.querySelector('.cont').textContent = D.avisos.length;
    $('#dica').innerHTML = '<b>Pontos de atenção desta coleta</b><ul>' +
      D.avisos.map((a) => '<li>' + esc(a) + '</li>').join('') + '</ul>';
    const abre = () => { $('#dica').hidden = false; };
    const fecha = () => { $('#dica').hidden = true; };
    b.addEventListener('mouseenter', abre);
    b.addEventListener('focus', abre);
    b.addEventListener('mouseleave', fecha);
    b.addEventListener('blur', fecha);
    b.addEventListener('click', () => { $('#dica').hidden = !$('#dica').hidden; });
  }
  $('#gloss-lista').innerHTML = D.glossario.map((g) =>
    '<dt>' + esc(g[0]) + '</dt><dd>' + esc(g[1]) + '</dd>').join('');
  $('#gloss-n').textContent = D.glossario.length + ' termos';
  $('#gerado').textContent = dt(D.agora);
  $('#base').textContent = D.eventos.length + (D.eventos.length === 1 ? ' evento' : ' eventos') +
    ' da Fenauto no Canal de vendas C6 Auto (whitelabel ' + D.wl + ') abertos na semana de ' +
    dia(D.semana[0]) + ' a ' + diaAntes(D.semana[1]);
  const ICO = {
    claro: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    escuro: '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>'
  };
  function tema(t) {
    document.documentElement.dataset.tema = t;
    const alvo = t === 'escuro' ? 'claro' : 'escuro';
    const b = $('#b-tema');
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICO[alvo] + '</svg>';
    b.setAttribute('aria-label', 'Mudar para o tema ' + alvo);
    b.setAttribute('title', 'Tema ' + alvo);
  }
  tema(document.documentElement.dataset.tema || 'escuro');
  $('#b-tema').addEventListener('click', () =>
    tema(document.documentElement.dataset.tema === 'escuro' ? 'claro' : 'escuro'));
  gaveta(false);
  montaFiltros();
  render();
}
return [{ json: { APP: APP.toString() } }];
