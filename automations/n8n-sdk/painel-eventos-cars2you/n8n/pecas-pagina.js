function APP(D, LOGO) {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s === null || s === undefined ? '' : s)
    .split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');
  const nf = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('pt-BR'));
  const rs = (n) => (n === null || n === undefined ? '—' : 'R$ ' + Math.round(n).toLocaleString('pt-BR'));
  const pc = (x) => (x === null || x === undefined ? '—' : (100 * x).toFixed(1).replace('.', ',') + '%');
  const pc0 = (x) => (x === null || x === undefined ? '—' : Math.round(100 * x) + '%');
  const dt = (s) => (s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(2, 4) + ' ' + s.slice(11, 16) : '—');
  const P0 = Date.UTC(Number(D.piso_dia.slice(0, 4)), Number(D.piso_dia.slice(5, 7)) - 1, Number(D.piso_dia.slice(8, 10)));
  const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const dataDia = (d) => new Date(P0 + d * 86400000);
  const rotDia = (d) => { const x = dataDia(d); return String(x.getUTCDate()).padStart(2, '0') + '/' + String(x.getUTCMonth() + 1).padStart(2, '0'); };
  const rotDiaLongo = (d) => SEMANA[dataDia(d).getUTCDay()] + ' ' + rotDia(d);
  const FAROL = { sem: 'Sem oferta', abaixo: 'Oferta abaixo do VMV', atingiu: 'VMV atingido' };
  const KPI = {
    acesso: { nome: 'Com acesso', linha: '% com acesso' },
    oferta: { nome: 'Com oferta', linha: '% com oferta' },
    venda: { nome: 'Vendidos', linha: '% vendidos' }
  };
  const tagStatus = (st) => {
    const nome = D.status_nome[st] || ('status ' + st);
    let cls = '';
    if ([2, 3, 7].indexOf(st) >= 0) cls = 'ok';
    else if (st === 11 || st === 10 || st === 8) cls = 'ruim';
    else if ([14, 15, 18].indexOf(st) >= 0) cls = 'atencao';
    return '<span class="tag ' + cls + '">' + esc(nome) + '</span>';
  };
  const trilho = (x, m) => '<span class="trilho" aria-hidden="true"><i style="width:' +
    (x === null ? 0 : Math.max(0, Math.min(100, 100 * x))).toFixed(1) + '%"></i>' +
    (m === null || m === undefined ? '' : '<b class="marca-meta" style="left:' + Math.max(0, Math.min(99, 100 * m)).toFixed(1) + '%"></b>') + '</span>';
  const linkDe = (r) => {
    const vv = D.veics[r.v];
    const partes = [vv[0], vv[1], vv[2]].map((x) => String(x || '').trim());
    if (!vv[6] || partes.some((p) => !p)) return null;
    const wls = D.eventos[r.ev].wls;
    const soC6 = wls.length > 0 && wls.every((w) => D.vitrine_c6.indexOf(w) >= 0);
    return (soC6 ? 'https://compraveiculos.cars2you.com.br' : 'https://cars2you.com.br') +
      '/anuncio/veiculo/' + partes.map((p) => encodeURIComponent(p.toLowerCase())).join('/') + '/' + vv[6];
  };
  const F = { wl: '', comit: '', cat: '', ev: '', resp: '', de: '', ate: '' };
  const FILTROS = ['wl', 'comit', 'cat', 'ev', 'resp', 'de', 'ate'];
  const CATEGORIAS = [['L', 'Leves (motos inclusive)'], ['P', 'Pesados'], ['E', 'Equipamentos'], ['N', 'Não informada']];
  const EV_CATS = D.eventos.map(() => ({}));
  D.negs.forEach((n) => { EV_CATS[n[0]][D.veics[n[1]][7]] = 1; });
  const FM = { wl: '', comit: '', cat: '', mes: '' };
  const FILTROS_M = ['wl', 'comit', 'cat', 'mes'];
  let aba = 'dia';
  let kpi = 'oferta';
  let modo = 'todos';
  let busca = '';
  const PASSO = 100;
  const ordem = { veic: { k: 'lances', dir: -1 } };
  const TABELAS = {};
  function tabela(id, cols, linhas) {
    const lim = TABELAS[id] ? TABELAS[id].lim : PASSO;
    TABELAS[id] = { cols: cols, linhas: linhas, lim: lim };
    desenhaTabela(id);
  }
  function desenhaTabela(id) {
    const t = TABELAS[id];
    const o = ordem[id];
    const col = t.cols.find((c) => c.k === o.k) || t.cols[0];
    const val = (r) => (col.v ? col.v(r) : r[col.k]);
    const idx = t.linhas.map((r, i) => [r, i]);
    idx.sort((a, b) => {
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
    const vis = idx.slice(0, t.lim);
    $('#tb-' + id).innerHTML = vis.length
      ? vis.map((p) => '<tr>' + t.cols.map((c) => '<td class="' + (c.n ? 'n' : '') + (c.cls ? ' ' + c.cls : '') + '">' +
          (c.h ? c.h(p[0]) : esc(p[0][c.k])) + '</td>').join('') + '</tr>').join('')
      : '<tr><td colspan="' + t.cols.length + '" class="dim">Nada neste recorte.</td></tr>';
    const resta = idx.length - vis.length;
    const b = $('#mais-' + id);
    b.hidden = resta <= 0;
    b.textContent = 'Mostrar mais ' + nf(Math.min(PASSO, resta)) + ' · ' + nf(vis.length) + ' de ' + nf(idx.length);
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
  $('#mais-veic').addEventListener('click', () => {
    TABELAS.veic.lim += PASSO;
    desenhaTabela('veic');
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
  const ALT_G = 280;
  const passoRedondo = (topo) => {
    const p = Math.pow(10, Math.floor(Math.log(Math.max(1, topo)) / Math.LN10)) / 10;
    return Math.max(1, [1, 2, 5, 10, 20, 50].map((m) => m * p).find((c) => topo / c <= 5) || p * 100);
  };
  const largura = (alvo) => Math.max(300, Math.round(alvo.getBoundingClientRect().width) || 960);
  const eixoX = (s, grupos, esq, slot, base, ALT) => {
    const cadaX = Math.max(1, Math.ceil(grupos.length / Math.max(1, Math.floor(slot * grupos.length / 44))));
    grupos.forEach((g, i) => {
      if (i % cadaX === 0) {
        s.push('<text class="eixo" x="' + (esq + i * slot + slot / 2).toFixed(1) + '" y="' + (ALT - 6) + '" text-anchor="middle">' + esc(g.rot) + '</text>');
      }
    });
    s.push('<line class="linha-grade forte" x1="' + esq + '" x2="' + (esq + slot * grupos.length).toFixed(1) + '" y1="' + base + '" y2="' + base + '"/>');
  };
  function combo(alvo, grupos) {
    const W = largura(alvo);
    const n = grupos.length;
    if (!n) { alvo.innerHTML = '<p class="dim">Nenhum dia no período.</p>'; return; }
    const esq = 44;
    const dir = 44;
    const topo = 12;
    const base = ALT_G - 24;
    const slot = (W - esq - dir) / n;
    const barra = Math.max(3, Math.min(28, slot * 0.62));
    const topoV = Math.max(1, Math.max.apply(null, grupos.map((g) => g.a + g.b)));
    const passo = passoRedondo(topoV);
    const topoN = Math.ceil(topoV / passo) * passo;
    const maxP = Math.max(0.005, Math.max.apply(null, grupos.map((g) => Math.max(g.p === null ? 0 : g.p,
      g.m === null || g.m === undefined ? 0 : g.m))) * 1.08);
    const passoP = [0.01, 0.02, 0.05, 0.1, 0.2, 0.25].find((p) => Math.ceil(maxP / p) <= 5) || 0.25;
    const marcasP = Math.max(2, Math.ceil(maxP / passoP));
    const topoP = Math.min(1, passoP * marcasP);
    const hN = (v) => (base - topo) * v / topoN;
    const yP = (p) => base - (base - topo) * p / topoP;
    const s = ['<svg class="graf" viewBox="0 0 ' + W + ' ' + ALT_G + '" width="' + W + '" height="' + ALT_G + '" role="img" aria-label="' + esc(alvo.getAttribute('data-rot')) + '">'];
    for (let v = passo; v <= topoN; v += passo) {
      const y = base - hN(v);
      s.push('<line class="linha-grade" x1="' + esq + '" x2="' + (W - dir) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>' +
        '<text class="eixo" x="' + (esq - 6) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end">' + nf(v) + '</text>');
    }
    for (let p = passoP; p <= topoP + 1e-9; p += passoP) {
      s.push('<text class="eixo eixo-p" x="' + (W - dir + 6) + '" y="' + (yP(p) + 3.5).toFixed(1) + '">' + pc0(p) + '</text>');
    }
    s.push('<text class="eixo" x="' + (esq - 6) + '" y="' + (base + 3.5) + '" text-anchor="end">0</text>');
    eixoX(s, grupos, esq, slot, base, ALT_G);
    const pontos = [];
    grupos.forEach((g, i) => {
      const x0 = esq + i * slot;
      const x = x0 + (slot - barra) / 2;
      const ha = hN(g.a);
      const hb = hN(g.b);
      const r = Math.min(3, barra / 2);
      if (ha > 0) s.push('<rect class="serie-b" x="' + x.toFixed(1) + '" y="' + (base - ha).toFixed(1) + '" width="' + barra.toFixed(1) + '" height="' + ha.toFixed(1) + '"' + (hb > 0 ? '' : ' rx="' + r + '"') + '/>');
      if (hb > 0) s.push('<rect class="serie-a" x="' + x.toFixed(1) + '" y="' + (base - ha - hb).toFixed(1) + '" width="' + barra.toFixed(1) + '" height="' + hb.toFixed(1) + '" rx="' + r + '"/>');
      if (g.p !== null) pontos.push([x0 + slot / 2, yP(g.p)]);
      else pontos.push(null);
    });
    let d = '';
    pontos.forEach((p, i) => {
      if (!p) return;
      d += (i && pontos[i - 1] ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
    });
    const temM = (g) => g && g.m !== null && g.m !== undefined;
    let dm = '';
    grupos.forEach((g, i) => {
      if (!temM(g)) return;
      const x = esq + i * slot + slot / 2;
      const y = yP(g.m).toFixed(1);
      dm += (temM(grupos[i - 1]) ? 'L' + x.toFixed(1) : 'M' + (x - slot * 0.35).toFixed(1)) + ' ' + y;
      if (!temM(grupos[i + 1])) dm += 'L' + (x + slot * 0.35).toFixed(1) + ' ' + y;
    });
    if (dm) s.push('<path class="linha-meta" d="' + dm + '"/>');
    if (d) s.push('<path class="linha-kpi" d="' + d + '"/>');
    pontos.forEach((p) => { if (p) s.push('<circle class="ponto-kpi" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3"/>'); });
    grupos.forEach((g, i) => {
      s.push('<rect class="alvo" x="' + (esq + i * slot).toFixed(1) + '" y="' + topo + '" width="' + slot.toFixed(1) + '" height="' + (base - topo + 22) +
        '" tabindex="0" data-dica="' + esc(g.dica) + '"/>');
    });
    alvo.innerHTML = s.join('') + '</svg>';
  }
  function linhas(alvo, grupos, series) {
    const W = largura(alvo);
    const n = grupos.length;
    if (!n) { alvo.innerHTML = '<p class="dim">Nenhum dia no período.</p>'; return; }
    const ALT_R = 15;
    const largRot = (v) => String(nf(v)).length * 6.4 + 10;
    const maiorRot = Math.max.apply(null, grupos.map((g) => Math.max.apply(null, series.map((se) => largRot(g[se.k])))));
    const comRotulo = (W - 16) / n >= maiorRot + 2;
    const esq = comRotulo ? 8 : 44;
    const dir = comRotulo ? 8 : 12;
    const topo = comRotulo ? ALT_R + 8 : 12;
    const base = ALT_G - 24;
    const slot = (W - esq - dir) / n;
    const topoV = Math.max(1, Math.max.apply(null, grupos.map((g) => Math.max.apply(null, series.map((se) => g[se.k])))));
    const passo = passoRedondo(topoV);
    const topoN = comRotulo ? topoV : Math.ceil(topoV / passo) * passo;
    const y = (v) => base - (base - topo) * v / topoN;
    const s = ['<svg class="graf" viewBox="0 0 ' + W + ' ' + ALT_G + '" width="' + W + '" height="' + ALT_G + '" role="img" aria-label="' + esc(alvo.getAttribute('data-rot')) + '">'];
    if (!comRotulo) {
      for (let v = passo; v <= topoN; v += passo) {
        s.push('<line class="linha-grade" x1="' + esq + '" x2="' + (W - dir) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/>' +
          '<text class="eixo" x="' + (esq - 6) + '" y="' + (y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + nf(v) + '</text>');
      }
      s.push('<text class="eixo" x="' + (esq - 6) + '" y="' + (base + 3.5) + '" text-anchor="end">0</text>');
    }
    eixoX(s, grupos, esq, slot, base, ALT_G);
    series.forEach((se) => {
      const pts = grupos.map((g, i) => [esq + i * slot + slot / 2, y(g[se.k])]);
      s.push('<path class="linha ' + se.cls + '" d="' + pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('') + '"/>');
      if (n <= 45) pts.forEach((p) => s.push('<circle class="ponto ' + se.cls + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.5"/>'));
    });
    if (comRotulo) {
      grupos.forEach((g, i) => {
        const x = esq + i * slot + slot / 2;
        const rs = series.map((se) => ({ se: se, v: g[se.k], c: y(g[se.k]) - ALT_R / 2 - 4 }))
          .sort((p, q) => p.c - q.c);
        rs.forEach((r, j) => {
          r.c = Math.max(r.c, ALT_R / 2 + 1);
          if (j && r.c - rs[j - 1].c < ALT_R + 1) r.c = rs[j - 1].c + ALT_R + 1;
        });
        const sobra = rs.length ? rs[rs.length - 1].c + ALT_R / 2 - base : 0;
        if (sobra > 0) rs.forEach((r) => { r.c -= sobra; });
        rs.forEach((r) => {
          const w = largRot(r.v);
          s.push('<g class="rot-p ' + r.se.cls + '"><rect x="' + (x - w / 2).toFixed(1) + '" y="' + (r.c - ALT_R / 2).toFixed(1) + '" width="' + w.toFixed(1) +
            '" height="' + ALT_R + '" rx="4"/><text x="' + x.toFixed(1) + '" y="' + (r.c + 3.6).toFixed(1) + '" text-anchor="middle">' + nf(r.v) + '</text></g>');
        });
      });
    }
    grupos.forEach((g, i) => {
      const txt = '<b>' + esc(g.longo) + '</b>' + series.map((se) => '<br><span class="amostra ' + se.cls + '"></span>' +
        esc(se.nome) + ': ' + nf(g[se.k])).join('');
      s.push('<rect class="alvo" x="' + (esq + i * slot).toFixed(1) + '" y="0" width="' + slot.toFixed(1) + '" height="' + (base + 22) +
        '" tabindex="0" data-dica="' + esc(txt) + '"/>');
    });
    alvo.innerHTML = s.join('') + '</svg>';
  }
  function opcoes(id, lista, rotTodos, atual) {
    const el = $('#' + id);
    el.innerHTML = '<option value="">' + esc(rotTodos) + '</option>' + lista.map((o) =>
      '<option value="' + esc(o[0]) + '"' + (o[0] === atual ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('');
    el.value = lista.some((o) => o[0] === atual) ? atual : '';
    return el.value;
  }
  const estado = (e) => (D.agora < e.ini ? 'agendado' : D.agora <= e.fim ? 'em andamento' : 'encerrado');
  function montaFiltros() {
    F.wl = opcoes('f-wl', D.canais.map((c) => [String(c[0]), c[1] + ' (' + c[0] + ')']), 'Todos os canais', F.wl);
    F.comit = opcoes('f-comit', D.comitentes.map((c, i) => [String(i), c]), 'Todos os comitentes', F.comit);
    F.cat = opcoes('f-cat', CATEGORIAS, 'Todas as categorias', F.cat);
    const evs = [];
    D.eventos.forEach((e, i) => {
      if (F.wl && e.wls.indexOf(Number(F.wl)) < 0) return;
      if (F.comit !== '' && e.comits.indexOf(Number(F.comit)) < 0) return;
      if (F.cat !== '' && !EV_CATS[i][F.cat]) return;
      evs.push([String(i), e.nome + ' · ' + estado(e)]);
    });
    F.ev = opcoes('f-ev', evs, 'Todos os eventos (' + nf(evs.length) + ')', F.ev);
    F.resp = opcoes('f-resp', D.consultores.map((c, i) => [String(i), c]).concat([['nd', 'Não distribuído']]), 'Todos os responsáveis', F.resp);
    $('#f-resp').closest('.fg').hidden = !D.consultores.length;
    const dias = [];
    for (let d = 0; d <= D.hoje; d++) dias.push([String(d), rotDiaLongo(d)]);
    F.de = opcoes('f-de', dias, 'Desde ' + rotDia(0), F.de);
    F.ate = opcoes('f-ate', dias.slice().reverse(), 'Até hoje (' + rotDia(D.hoje) + ')', F.ate);
  }
  function contaFiltros() {
    const n = aba === 'mes' ? FILTROS_M.filter((k) => FM[k] !== '').length : FILTROS.filter((k) => F[k] !== '').length;
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
  [['f-wl', 'wl'], ['f-comit', 'comit'], ['f-cat', 'cat'], ['f-ev', 'ev'], ['f-resp', 'resp'], ['f-de', 'de'], ['f-ate', 'ate']].forEach((p) => {
    $('#' + p[0]).addEventListener('change', (ev) => {
      F[p[1]] = ev.target.value;
      if (p[1] === 'wl' || p[1] === 'comit' || p[1] === 'cat') montaFiltros();
      if (TABELAS.veic) TABELAS.veic.lim = PASSO;
      render();
    });
  });
  $('#limpar').addEventListener('click', () => {
    if (aba === 'mes') {
      FILTROS_M.forEach((k) => { FM[k] = ''; });
      montaFiltrosMes();
      renderMes();
      return;
    }
    FILTROS.forEach((k) => { F[k] = ''; });
    montaFiltros();
    if (TABELAS.veic) TABELAS.veic.lim = PASSO;
    render();
  });
  [['f-m-wl', 'wl'], ['f-m-comit', 'comit'], ['f-m-cat', 'cat'], ['f-m-mes', 'mes']].forEach((p) => {
    $('#' + p[0]).addEventListener('change', (ev) => {
      FM[p[1]] = ev.target.value;
      renderMes();
    });
  });
  function alterna(id, valor) {
    document.querySelectorAll('#' + id + ' button').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === valor)));
  }
  $('#seg-kpi').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-v]');
    if (!b) return;
    kpi = b.getAttribute('data-v');
    alterna('seg-kpi', kpi);
    redesenhaIndicador();
  });
  $('#seg-modo').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-v]');
    if (!b) return;
    modo = b.getAttribute('data-v');
    alterna('seg-modo', modo);
    redesenhaIndicador();
  });
  let esperaBusca = null;
  $('#busca').addEventListener('input', (ev) => {
    clearTimeout(esperaBusca);
    esperaBusca = setTimeout(() => {
      busca = ev.target.value.trim().toLowerCase();
      if (TABELAS.veic) TABELAS.veic.lim = PASSO;
      desenhaVeiculos();
    }, 160);
  });
  let R = null;
  function desenhaAtivos() {
    const novos = modo === 'novos';
    const grupos = R.dias.map((g) => {
      const base = novos ? g.novos : g.ativos;
      const hit = novos ? g[kpi + '_n'] : g[kpi];
      const linhaDia = (k2, nome) => {
        const h = novos ? g[k2 + '_n'] : g[k2];
        return '<br>' + esc(nome) + ': ' + nf(h) + ' (' + (base ? pc(h / base) : '—') + ')';
      };
      const m = metaDe(g);
      return {
        rot: rotDia(g.d),
        a: novos ? 0 : g.ativos - g.novos,
        b: g.novos,
        p: base ? hit / base : null,
        m: m,
        dica: '<b>' + esc(rotDiaLongo(g.d)) + '</b><br>' +
          (novos ? '' : '<span class="amostra serie-b"></span>Veículos ativos: ' + nf(g.ativos) + '<br>') +
          '<span class="amostra serie-a"></span>Novos: ' + nf(g.novos) +
          linhaDia('acesso', 'Com acesso') + linhaDia('oferta', 'Com oferta') + linhaDia('venda', 'Vendidos') +
          (m === null ? '' : '<br><span class="amostra traco linha-meta"></span>Meta do ' + esc(KPI[kpi].linha) + ': ' + pc(m) +
            (notaCobertura(g) ? '<br><span class="dim">' + esc(notaCobertura(g)) + '</span>' : ''))
      };
    });
    $('#leg-meta').hidden = !grupos.some((g) => g.m !== null);
    $('#leg-a').hidden = novos;
    $('#leg-linha').textContent = KPI[kpi].linha + (novos ? ' dos novos' : '');
    combo($('#g-ativos'), grupos);
  }
  const STATUS_C = [['veiculos', 'Veículos'], ['com_oferta', 'Com oferta'],
    ['vmv', 'VMV atingido'], ['vendidos', 'Vendidos'], ['removidos', 'Removidos']];
  const baseDe = (g) => (g ? (modo === 'novos' ? g.novos : g.ativos) : 0);
  const acertoDe = (g) => (g ? (modo === 'novos' ? g[kpi + '_n'] : g[kpi]) : 0);
  const pctDe = (g) => (baseDe(g) ? acertoDe(g) / baseDe(g) : null);
  const CAMPO_META = { oferta: 'mo', venda: 'mv' };
  const metaDe = (g, k, todos) => {
    const c = CAMPO_META[k || kpi];
    if (!g || !c) return null;
    const f = !todos && modo === 'novos' ? '_n' : '';
    return g['mt' + f] ? g[c + f] / g['mt' + f] : null;
  };
  const notaCobertura = (g, todos) => {
    const f = !todos && modo === 'novos' ? '_n' : '';
    const base = f ? g.novos : g.ativos;
    return g['mt' + f] < base ? 'meta de ' + nf(g['mt' + f]) + ' dos ' + nf(base) + ' veículos — os outros não têm meta na planilha' : '';
  };
  const contraMeta = (x, m) => {
    if (x === null || m === null) return '';
    const d = Math.round(1000 * (x - m)) / 10;
    const cls = d > 0 ? 'sobe' : d < 0 ? 'desce' : 'dim';
    return '<span class="' + cls + '">' + (d > 0 ? '▲ +' : d < 0 ? '▼ ' : '') + d.toFixed(1).replace('.', ',') + ' p.p.</span>';
  };
  const rotIndicador = () => KPI[kpi].linha + (modo === 'novos' ? ' dos novos' : '');
  const quandoRef = () => (R.ate === D.hoje ? 'hoje' : 'em ' + rotDia(R.ate));
  const contraAnt = () => (R.ate === D.hoje ? 'ontem' : rotDia(R.ate - 1));
  const difPP = (c) => {
    const a = pctDe(c.dia);
    const b = pctDe(c.dia_ant);
    return a === null || b === null ? null : Math.round(1000 * (a - b)) / 10;
  };
  const delta = (c, curto) => {
    const vs = curto ? '' : '<span class="dim"> vs ' + contraAnt() + '</span>';
    const d = difPP(c);
    if (d === null) return '<span class="dim">—</span>' + vs;
    const t = (d > 0 ? '+' : '') + d.toFixed(1).replace('.', ',') + ' p.p.';
    return '<span class="pp">' + (d > 0 ? '▲ ' : d < 0 ? '▼ ' : '') + t + '</span>' + vs;
  };
  const luzMeta = (g) => {
    const x = pctDe(g);
    const m = metaDe(g);
    return x === null || m === null ? '' : x >= m ? ' luz-sobe' : ' luz-desce';
  };
  const areaSemana = (hist, rotLongo, meta) => {
    rotLongo = rotLongo || ((g) => rotDiaLongo(g.d));
    const W = 98;
    const H = 80;
    const topo = 6;
    const base = H - 3;
    const n = hist.length;
    const passo = (W - 8) / (n - 1);
    const vals = hist.map((g) => (g ? pctDe(g) : null));
    const temMeta = meta !== null && meta !== undefined;
    const max = Math.max(0.05, Math.max.apply(null, vals.concat([temMeta ? meta : 0]).map((v) => (v === null ? 0 : v))) * 1.05);
    const xDe = (i) => 4 + i * passo;
    const yDe = (v) => base - (base - topo) * v / max;
    let s = '<svg class="semana" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<line class="s-base" x1="0" x2="' + W + '" y1="' + base + '" y2="' + base + '"/>';
    const trechos = [];
    let atual = [];
    vals.forEach((v, i) => {
      if (v === null) { if (atual.length) trechos.push(atual); atual = []; return; }
      atual.push([xDe(i), yDe(v)]);
    });
    if (atual.length) trechos.push(atual);
    if (temMeta) s += '<line class="s-meta" x1="0" x2="' + W + '" y1="' + yDe(meta).toFixed(1) + '" y2="' + yDe(meta).toFixed(1) + '"/>';
    trechos.forEach((t) => {
      const linha = t.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
      if (t.length > 1) {
        s += '<path class="s-area" d="' + linha + 'L' + t[t.length - 1][0].toFixed(1) + ' ' + base + 'L' + t[0][0].toFixed(1) + ' ' + base + 'Z"/>' +
          '<path class="s-linha" d="' + linha + '"/>';
      }
    });
    const ult = vals[n - 1];
    if (ult !== null) s += '<circle class="s-hoje" cx="' + xDe(n - 1).toFixed(1) + '" cy="' + yDe(ult).toFixed(1) + '" r="3"/>';
    hist.forEach((g, i) => {
      const v = vals[i];
      const dica = g ? '<b>' + esc(rotLongo(g)) + '</b><br>' + esc(rotIndicador()) + ': ' + (v === null ? '—' : pc(v)) +
        '<br>' + nf(acertoDe(g)) + ' de ' + nf(baseDe(g)) + (modo === 'novos' ? ' novos' : ' veículos') +
        (temMeta ? '<br>Meta: ' + pc(meta) : '') : 'antes da janela';
      s += '<rect class="s-alvo" x="' + (xDe(i) - passo / 2).toFixed(1) + '" y="0" width="' + passo.toFixed(1) + '" height="' + H + '" data-dica="' + esc(dica) + '"/>';
    });
    return s + '</svg>';
  };
  const rosca = (x, m) => {
    const raio = 36;
    const volta = 2 * Math.PI * raio;
    const arco = x === null ? 0 : Math.max(0, Math.min(1, x)) * volta;
    return '<svg class="rosca" viewBox="0 0 88 88" aria-hidden="true">' +
      '<circle class="r-fundo" cx="44" cy="44" r="' + raio + '"/>' +
      (arco > 0 ? '<circle class="r-arco" cx="44" cy="44" r="' + raio + '" stroke-dasharray="' + arco.toFixed(2) + ' ' +
        volta.toFixed(2) + '" transform="rotate(-90 44 44)"/>' : '') +
      (m === null || m === undefined ? '' : (() => {
        const a = 2 * Math.PI * Math.max(0, Math.min(1, m));
        const px = (r) => (44 + r * Math.sin(a)).toFixed(1);
        const py = (r) => (44 - r * Math.cos(a)).toFixed(1);
        return '<line class="r-meta" x1="' + px(raio - 6) + '" y1="' + py(raio - 6) + '" x2="' + px(raio + 6) + '" y2="' + py(raio + 6) + '"/>';
      })()) +
      '<text class="r-pc" x="44" y="49" text-anchor="middle">' + (x === null ? '—' : pc(x)) + '</text></svg>';
  };
  function desenhaComitentes() {
    const lista = R.por_comit;
    $('#comit-rot').textContent = 'Comitentes com evento ativo ' + quandoRef() + ' · clique para filtrar';
    $('#comit-nota').textContent = rotIndicador() + ': ' + quandoRef() + ' na rosca, os últimos 7 dias na linha (meta tracejada), a diferença para ' +
      contraAnt() + ' · verde na meta ou acima, vermelho abaixo';
    const sel = F.comit === '' ? null : Number(F.comit);
    $('#g-comit').innerHTML = lista.length ? lista.map((c) => cartaoComit(c, D.comitentes[c.comit], sel, 'data-c', null))
      .join('') : '<p class="dim">Nenhum comitente com evento ativo neste dia.</p>';
  }
  function cartaoComit(c, nome, sel, attr, rotLongo) {
      const marcado = sel === c.comit;
      const x = pctDe(c.dia);
      const m = metaDe(c.dia);
      const luz = luzMeta(c.dia);
      return '<button type="button" class="cartao comit' + luz + (sel !== null && !marcado ? ' apagado' : '') + '" ' + attr + '="' + c.comit + '"' +
        ' aria-pressed="' + marcado + '" aria-label="' + esc((marcado ? 'Tirar o filtro do comitente ' : 'Filtrar pelo comitente ') + nome) + '">' +
        '<span class="comit-topo"><span class="comit-nome">' + esc(nome) + '</span>' +
        '<span class="tag">' + nf(c.eventos) + (c.eventos === 1 ? ' evento' : ' eventos') + '</span></span>' +
        '<span class="comit-meio"><span class="comit-graf"><span class="comit-ind">' + esc(rotIndicador()) +
          (m === null ? '' : ' · meta ' + pc(m)) + '</span><span class="comit-minis">' +
          '<span class="mini m-rosca">' + rosca(x, m) + '</span>' +
          '<span class="mini m-sem">' + areaSemana(c.hist, rotLongo, m) + '</span></span>' +
          '<span class="comit-num"><b class="num">' + nf(acertoDe(c.dia)) + ' de ' + nf(baseDe(c.dia)) +
            (modo === 'novos' ? ' novos' : '') + '</b><span class="sep">·</span><span>' + delta(c, true) + '</span></span></span>' +
        '<span class="comit-st">' + STATUS_C.map((s) => '<span' + (s[0] === 'veiculos' ? ' class="tot"' : '') + '>' + s[1] +
          '<b class="num">' + nf(c[s[0]]) + '</b></span>').join('') + '</span></span>' +
        (c.valor ? '<span class="comit-rodape">Vendido <b class="num">' + rs(c.valor) + '</b></span>' : '') +
        '</button>';
  }
  $('#g-comit').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-c]');
    if (!b) return;
    const c = b.getAttribute('data-c');
    F.comit = F.comit === c ? '' : c;
    montaFiltros();
    if (TABELAS.veic) TABELAS.veic.lim = PASSO;
    render();
  });
  function desenhaEventos() {
    const lista = R.por_evento;
    $('#ev-rot').textContent = 'Eventos ativos ' + quandoRef();
    $('#n-evlista').textContent = nf(lista.length) + (lista.length === 1 ? ' evento' : ' eventos');
    $('#cab-ev').innerHTML = '<span>Evento</span>' + STATUS_C.map((s) => '<span class="n">' + s[1] + '</span>').join('') +
      '<span>' + esc(rotIndicador() + ' ' + quandoRef() + ' · vs ' + contraAnt()) + '</span>';
    const sel = F.ev === '' ? null : Number(F.ev);
    $('#g-ev').innerHTML = lista.length ? lista.map((c) => {
      const e = D.eventos[c.ev];
      const marcado = sel === c.ev;
      const x = pctDe(c.dia);
      const m = metaDe(c.dia);
      const luz = luzMeta(c.dia);
      return '<button type="button" class="lin' + luz + (marcado ? ' marcada' : '') + (sel !== null && !marcado ? ' apagado' : '') + '" data-e="' + c.ev + '"' +
        ' aria-pressed="' + marcado + '" aria-label="' + esc((marcado ? 'Tirar o filtro do evento ' : 'Filtrar pelo evento ') + e.nome) + '">' +
        '<span class="c-nome"><b title="' + esc(e.nome) + '">' + esc(e.nome) + '</b><span class="dim sub">' +
          esc(e.comits.map((j) => D.comitentes[j]).join(', ')) + ' · até ' + dt(e.fim) + '</span></span>' +
        STATUS_C.map((s) => '<span class="n num" data-r="' + s[1] + '">' + nf(c[s[0]]) + '</span>').join('') +
        '<span class="termo">' + trilho(x, m) + '<span class="pc num">' + (x === null ? '—' : pc(x)) + '</span>' +
          '<span class="de">' + delta(c, true) + '</span></span>' +
        '</button>';
    }).join('') : '<p class="dim">Nenhum evento ativo neste dia.</p>';
  }
  const dobra = $('#dobra-ev');
  let evMao = false;
  let ultComit = '';
  let esperado = null;
  dobra.addEventListener('toggle', () => {
    if (esperado !== null && dobra.open === esperado) { esperado = null; return; }
    esperado = null;
    evMao = dobra.open;
  });
  function dobraEventos() {
    if (F.comit === ultComit) return;
    ultComit = F.comit;
    const quer = F.comit !== '' || evMao;
    if (dobra.open !== quer) { esperado = quer; dobra.open = quer; }
  }
  $('#g-ev').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-e]');
    if (!b) return;
    const e = b.getAttribute('data-e');
    F.ev = F.ev === e ? '' : e;
    montaFiltros();
    if (TABELAS.veic) TABELAS.veic.lim = PASSO;
    render();
  });
  function desenhaVeiculos() {
    const linhasV = busca
      ? R.veiculos.filter((r) => (r.nome + ' ' + D.eventos[r.ev].nome + ' ' + (r.comit >= 0 ? D.comitentes[r.comit] : '')).toLowerCase().indexOf(busca) >= 0)
      : R.veiculos;
    $('#n-veic').textContent = nf(linhasV.length) + (linhasV.length === 1 ? ' veículo' : ' veículos');
    tabela('veic', [
      { k: 'nome', t: 'Veículo', h: (r) => {
        const vv = D.veics[r.v];
        const lk = linkDe(r);
        return '<span class="farol ' + r.farol + '" title="' + FAROL[r.farol] + '"></span>' +
          (lk ? '<a href="' + esc(lk) + '" target="_blank" rel="noopener">' + esc(r.nome) + ' ↗</a>' : esc(r.nome)) +
          '<span class="dim sub">' + [vv[3], vv[4] !== null ? nf(vv[4]) + ' km' : null, r.estreia >= 0 ? 'estreia ' + rotDia(r.estreia) : 'estreia antes de ' + rotDia(0)]
            .filter((x) => x !== null && x !== '').join(' · ') + '</span>';
      } },
      { k: 'evento', t: 'Evento', v: (r) => D.eventos[r.ev].nome, h: (r) => esc(D.eventos[r.ev].nome) +
        '<span class="dim sub">' + esc(r.comit >= 0 ? D.comitentes[r.comit] : '—') +
        (r.n_ev > 1 ? ' · ' + r.n_ev + ' eventos no período' : '') + '</span>' },
      { k: 'acessos', t: 'Acessos', n: true, h: (r) => nf(r.acessos) },
      { k: 'lances', t: 'Ofertas', n: true, h: (r) => nf(r.lances) + (r.ofertantes ? '<span class="dim sub">' + nf(r.ofertantes) + (r.ofertantes === 1 ? ' loja' : ' lojas') + '</span>' : '') },
      { k: 'maior', t: 'Maior oferta', n: true, h: (r) => rs(r.maior) },
      { k: 'fipe', t: 'FIPE', n: true, h: (r) => rs(r.fipe) },
      { k: 'pfipe', t: '% FIPE', n: true, cls: 'c-vmv', h: (r) => (r.pfipe === null ? '<span class="dim">—</span>'
        : '<span class="vmv">' + trilho(r.pfipe) + '<span class="num">' + pc0(r.pfipe) + '</span></span>') },
      { k: 'vmv', t: 'VMV', n: true, h: (r) => rs(r.vmv) },
      { k: 'pvmv', t: '% VMV', n: true, cls: 'c-vmv', h: (r) => (r.pvmv === null ? '<span class="dim">—</span>'
        : '<span class="vmv' + (r.pvmv >= 1 ? ' ok' : '') + '">' + trilho(r.pvmv) + '<span class="num">' + pc0(r.pvmv) + '</span></span>') },
      { k: 'status', t: 'Resultado', v: (r) => D.status_nome[r.status] || '', h: (r) => tagStatus(r.status) +
        (r.comprador !== null ? '<span class="dim sub">' + esc(r.comprador >= 0 ? D.lojas[r.comprador][0] : 'comprador sem loja') +
          ' · ' + rs(r.venda) + '</span>' : '') }
    ], linhasV);
  }
  function metaCartao(id, x, m, g) {
    const el = $('#' + id + '-meta');
    el.hidden = m === null;
    el.innerHTML = m === null ? '' : 'Meta <b class="num">' + pc(m) + '</b> · ' + contraMeta(x, m);
    el.title = m === null ? '' : notaCobertura(g, true);
    $('#' + id + '-bar').innerHTML = trilho(x, m);
  }
  function render() {
    contaFiltros();
    R = calcula(D, F);
    const k = R.kpi;
    const pcBar = (idTxt, idBar, x, rot) => {
      $(idTxt).textContent = x === null ? '—' : pc(x) + ' ' + rot;
      $(idBar).innerHTML = trilho(x);
    };
    const hoje = R.ate === D.hoje;
    $('#k-ev-rot').textContent = hoje ? 'Eventos ativos hoje' : 'Eventos ativos em ' + rotDia(R.ate);
    $('#k-ev').textContent = nf(k.eventos);
    $('#k-ev-dia').textContent = rotDiaLongo(R.ate) + (hoje ? ' · até ' + D.agora.slice(11, 16) : '');
    $('#k-ev-veic').textContent = nf(k.veiculos);
    $('#k-ev-com').textContent = nf(k.comitentes);
    const sobre = (x) => (k.veiculos ? x / k.veiculos : null);
    [['co', 'com_oferta', [['ab', 'co_abertos'], ['an', 'co_analise'], ['en', 'co_encerrados']]],
      ['vm', 'vmv', [['ab', 'vm_abertos'], ['an', 'vm_analise'], ['en', 'vm_encerrados']]],
      ['vd', 'vendidos', [['ag', 'aguardando'], ['vd', 'vendido']]],
      ['rm', 'removidos', [['can', 'rem_cancelado'], ['sus', 'rem_suspenso']]]].forEach((s) => {
      $('#k-' + s[0]).textContent = nf(k[s[1]]);
      pcBar('#k-' + s[0] + '-pc', '#k-' + s[0] + '-bar', sobre(k[s[1]]), 'dos veículos');
      s[2].forEach((p) => { $('#k-' + s[0] + '-' + p[0]).textContent = nf(k[p[1]]); });
    });
    $('#k-vd-rs').textContent = rs(k.valor);
    const gRef = R.dias[R.dias.length - 1];
    metaCartao('k-co', sobre(k.com_oferta), metaDe(gRef, 'oferta', true), gRef);
    metaCartao('k-vd', sobre(k.vendidos), metaDe(gRef, 'venda', true), gRef);
    desenhaComitentes();
    desenhaEventos();
    dobraEventos();
    $('#n-ativos').textContent = nf(R.veiculos_periodo) + ' veículos no período';
    desenhaAtivos();
    $('#n-lojistas').textContent = nf(R.tot_lojistas.acessaram) + ' lojas acessaram';
    linhas($('#g-lojistas'), R.lojistas.map((g) => Object.assign({ rot: rotDia(g.d), longo: rotDiaLongo(g.d) }, g)), [
      { k: 'acessaram', nome: 'Acessaram', cls: 's-ac' },
      { k: 'ofertaram', nome: 'Ofertaram', cls: 's-of' },
      { k: 'compraram', nome: 'Compraram', cls: 's-co' }
    ]);
    $('#tot-lojistas').innerHTML = [['Acessaram', 'acessaram'], ['Ofertaram', 'ofertaram'], ['Compraram', 'compraram']]
      .map((p) => '<span>' + p[0] + ' no período <b class="num">' + nf(R.tot_lojistas[p[1]]) + '</b></span>').join('');
    desenhaVeiculos();
  }
  const NOME_MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const ABREV_MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const MESES_D = D.mes.meses;
  const ULT_M = MESES_D.length - 1;
  const parcial = (m) => m === ULT_M ? ' (até ' + D.agora.slice(8, 10) + '/' + D.agora.slice(5, 7) + ')' : '';
  const rotMes = (m) => ABREV_MES[Number(MESES_D[m].slice(5, 7)) - 1] + '/' + MESES_D[m].slice(2, 4);
  const rotMesLongo = (m) => NOME_MES[Number(MESES_D[m].slice(5, 7)) - 1] + ' de ' + MESES_D[m].slice(0, 4) + parcial(m);
  let RM = null;
  const acIncompleto = (m) => D.mes.dias_acesso[m][0] < D.mes.dias_acesso[m][1];
  const rotMesEixo = (m) => rotMes(m) + (acIncompleto(m) ? ' ⚠' : '');
  const notaAc = (m) => (acIncompleto(m) ? 'acesso registrado em ' + D.mes.dias_acesso[m][0] + ' de ' + D.mes.dias_acesso[m][1] + ' dias' : '');
  function montaFiltrosMes() {
    FM.wl = opcoes('f-m-wl', D.canais.map((c) => [String(c[0]), c[1] + ' (' + c[0] + ')']), 'Todos os canais', FM.wl);
    FM.comit = opcoes('f-m-comit', D.mes.comitentes.map((c, i) => [String(i), c]), 'Todos os comitentes', FM.comit);
    FM.cat = opcoes('f-m-cat', CATEGORIAS, 'Todas as categorias', FM.cat);
    const ms = MESES_D.map((r, m) => [String(m), rotMesLongo(m)]).reverse();
    FM.mes = opcoes('f-m-mes', ms.slice(1), 'Mês corrente (' + rotMesLongo(ULT_M) + ')', FM.mes);
  }
  function desenhaMes() {
    const novos = modo === 'novos';
    const grupos = RM.meses.map((g) => {
      const base = novos ? g.novos : g.ativos;
      const hit = novos ? g[kpi + '_n'] : g[kpi];
      const linhaMes = (k2, nome) => {
        const h = novos ? g[k2 + '_n'] : g[k2];
        return '<br>' + esc(nome) + ': ' + nf(h) + ' (' + (base ? pc(h / base) : '—') + ')';
      };
      const mt = metaDe(g);
      return {
        rot: rotMesEixo(g.m),
        a: novos ? 0 : g.ativos - g.novos,
        b: g.novos,
        p: base ? hit / base : null,
        m: mt,
        dica: '<b>' + esc(rotMesLongo(g.m)) + '</b><br>' +
          (novos ? '' : '<span class="amostra serie-b"></span>Veículos ativos: ' + nf(g.ativos) + '<br>') +
          '<span class="amostra serie-a"></span>Novos: ' + nf(g.novos) +
          linhaMes('acesso', 'Com acesso') + linhaMes('oferta', 'Com oferta') + linhaMes('venda', 'Vendidos') +
          (mt === null ? '' : '<br><span class="amostra traco linha-meta"></span>Meta do ' + esc(KPI[kpi].linha) + ': ' + pc(mt) +
            (notaCobertura(g) ? '<br><span class="dim">' + esc(notaCobertura(g)) + '</span>' : '')) +
          (acIncompleto(g.m) ? '<br><span class="aviso-txt">⚠ ' + esc(notaAc(g.m)) + ': com acesso a menos</span>' : '')
      };
    });
    $('#leg-meta-m').hidden = !grupos.some((g) => g.m !== null);
    $('#leg-a-m').hidden = novos;
    $('#leg-linha-m').textContent = KPI[kpi].linha + (novos ? ' dos novos' : '');
    combo($('#g-ativos-m'), grupos);
    const sel = FM.comit === '' ? null : Number(FM.comit);
    $('#comit-rot-m').textContent = 'Comitentes com evento em ' + rotMesLongo(RM.ref) + ' · clique para filtrar';
    $('#comit-nota-m').textContent = rotIndicador() + ': o mês na rosca, os 12 meses até ele na linha (meta tracejada), e a diferença para ' +
      (RM.ref > 0 ? rotMesLongo(RM.ref - 1) : 'o mês anterior') + ' · verde na meta ou acima, vermelho abaixo';
    $('#g-comit-m').innerHTML = RM.por_comit.length
      ? RM.por_comit.map((c) => cartaoComit(c, D.mes.comitentes[c.comit], sel, 'data-cm', (g) => rotMesLongo(g.m))).join('')
      : '<p class="dim">Nenhum comitente com evento neste mês.</p>';
  }
  function renderMes() {
    contaFiltros();
    RM = calculaMes(D, FM);
    const k = RM.kpi;
    const a = RM.ant;
    const sobre = (x) => (k.veiculos ? x / k.veiculos : null);
    $('#km-ev-rot').textContent = 'Eventos em ' + rotMes(RM.ref);
    $('#km-ev').textContent = nf(k.eventos);
    $('#km-ev-mes').textContent = rotMesLongo(RM.ref);
    $('#km-ev-veic').textContent = nf(k.veiculos);
    $('#km-ev-com').textContent = nf(k.comitentes);
    [['co', 'com_oferta'], ['vm', 'vmv'], ['vd', 'vendidos'], ['rm', 'removidos']].forEach((s) => {
      $('#km-' + s[0]).textContent = nf(k[s[1]]);
      const x = sobre(k[s[1]]);
      $('#km-' + s[0] + '-pc').textContent = x === null ? '—' : pc(x) + ' dos veículos';
      $('#km-' + s[0] + '-bar').innerHTML = trilho(x);
      $('#km-' + s[0] + '-ant').textContent = a ? nf(a[s[1]]) + (a.veiculos ? ' · ' + pc(a[s[1]] / a.veiculos) : '') : '—';
    });
    $('#km-vd-rs').textContent = rs(k.valor);
    metaCartao('km-co', sobre(k.com_oferta), metaDe(k, 'oferta', true), k);
    metaCartao('km-vd', sobre(k.vendidos), metaDe(k, 'venda', true), k);
    desenhaMes();
    $('#n-ativos-m').textContent = '12 meses';
    const inc = MESES_D.map((r, m) => (acIncompleto(m) && m !== ULT_M ? rotMes(m) + ' (' + notaAc(m) + ')' : null)).filter((x) => x);
    const txtInc = inc.length ? '⚠ O registro de acessos tem buraco em ' + inc.join(', ') + ': nesses meses, com acesso e lojistas que acessaram saem a menos.' : '';
    $('#nota-ac-m').textContent = txtInc;
    $('#nota-ac-m').hidden = !txtInc;
    const txtCat = FM.cat ? 'Os lojistas e os eventos do mês não seguem o filtro de categoria: vêm contados do banco por canal e comitente.' : '';
    $('#nota-ac-lm').textContent = [txtInc, txtCat].filter((x) => x).join(' ');
    $('#nota-ac-lm').hidden = !txtInc && !txtCat;
    linhas($('#g-lojistas-m'), RM.meses.map((g) => Object.assign({ rot: rotMesEixo(g.m),
      longo: rotMesLongo(g.m) + (acIncompleto(g.m) ? ' · ⚠ ' + notaAc(g.m) : '') }, g.lojistas)), [
      { k: 'acessaram', nome: 'Acessaram', cls: 's-ac' },
      { k: 'ofertaram', nome: 'Ofertaram', cls: 's-of' },
      { k: 'compraram', nome: 'Compraram', cls: 's-co' }
    ]);
    $('#n-lojistas-m').textContent = nf(k.lojistas.acessaram) + ' lojas acessaram em ' + rotMes(RM.ref);
    $('#tot-lojistas-m').innerHTML = [['Acessaram', 'acessaram'], ['Ofertaram', 'ofertaram'], ['Compraram', 'compraram']]
      .map((p) => '<span>' + p[0] + ' em ' + esc(rotMes(RM.ref)) + ' <b class="num">' + nf(k.lojistas[p[1]]) + '</b></span>').join('');
  }
  $('#g-comit-m').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-cm]');
    if (!b) return;
    const c = b.getAttribute('data-cm');
    FM.comit = FM.comit === c ? '' : c;
    montaFiltrosMes();
    renderMes();
  });
  function trocaAba(a2) {
    aba = a2;
    alterna('seg-aba', aba);
    $('#v-dia').hidden = aba !== 'dia';
    $('#v-mes').hidden = aba !== 'mes';
    $('#fil-dia').hidden = aba !== 'dia';
    $('#fil-mes').hidden = aba !== 'mes';
    if (aba === 'mes') renderMes(); else render();
  }
  $('#seg-aba').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-v]');
    if (b && b.getAttribute('data-v') !== aba) trocaAba(b.getAttribute('data-v'));
  });
  function redesenhaIndicador() {
    if (aba === 'mes') { desenhaMes(); return; }
    desenhaAtivos();
    desenhaComitentes();
    desenhaEventos();
  }
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
  let largAnt = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === largAnt) return;
    largAnt = window.innerWidth;
    clearTimeout(espera);
    espera = setTimeout(() => { if (aba === 'mes') renderMes(); else { desenhaAtivos(); render(); } }, 150);
  });
  $('#gloss-lista').innerHTML = D.glossario.map((g) =>
    '<dt>' + esc(g[0]) + '</dt><dd>' + esc(g[1]) + '</dd>').join('');
  $('#gloss-n').textContent = D.glossario.length + ' termos';
  $('#gerado').textContent = dt(D.agora);
  $('#base').textContent = nf(D.eventos.length) + ' eventos dos canais ' + D.canais.map((c) => c[0]).join(', ') +
    ' com fim desde ' + rotDia(0) + '/' + D.piso_dia.slice(0, 4) +
    (D.carteira_em ? ' · carteira comercial de ' + D.carteira_em.slice(8, 10) + '/' + D.carteira_em.slice(5, 7) + '/' + D.carteira_em.slice(0, 4) : '');
  const ICO = {
    claro: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    escuro: '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>'
  };
  function tema(t) {
    document.documentElement.dataset.tema = t;
    $('#logo').src = LOGO[t].extensa;
    $('#logo-curta').src = LOGO[t].curta;
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
  montaFiltrosMes();
  render();
}
return [{ json: { APP: APP.toString() } }];
