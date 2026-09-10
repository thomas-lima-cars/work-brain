/* ══════════════════════════════════════════════════════════════════════
   Smoke test do JS que roda no NAVEGADOR.

   Por que existe: o codigo do cliente viaja dentro do `montar-html.js`
   como STRING — `node --check` nunca olha para ele. Dois bugs reais
   passaram por essa fresta e so apareceram quando o Thomas abriu a pagina:

     1. `"+(comScore?...` -> "missing ) after argument list" (sintaxe)
     2. `<option>` sem `value` -> o valor virava o texto COM a contagem,
        e o filtro de evento zerava a tabela (comportamento)

   O primeiro morre na checagem de sintaxe. O segundo so morre se alguem
   MEXER no controle — por isso este smoke agora interage: troca o select
   de evento em cada opcao, clica em limpar, e confere que a tabela nao
   fica vazia.

   Uso: require('./_smoke_dom.js').smoke(html) -> array de erros.
   ══════════════════════════════════════════════════════════════════════ */
'use strict';

function elemento(id) {
  const el = {
    id: id,
    innerHTML: '',
    textContent: '',
    value: '',
    className: '',
    style: {},
    onclick: null,
    onchange: null,
    oninput: null,
    _attrs: {},
    getAttribute: function (k) { return el._attrs[k]; },
    setAttribute: function (k, v) { el._attrs[k] = v; },
    querySelectorAll: function () { return []; }
  };
  return el;
}

function linhasNoCorpo(html) {
  if (!html) return 0;
  const i = html.indexOf('<tbody');
  if (i < 0) return 0;
  return (html.slice(i).match(/<tr[ >]/g) || []).length;
}

function opcoes(html) {
  /* devolve os value= de cada <option> */
  const out = [];
  const re = /<option value='([^']*)'/g;
  let m;
  while ((m = re.exec(html || '')) !== null) out.push(m[1]);
  return out;
}

function smoke(html) {
  const erros = [];
  const blocos = html.match(/<script>[\s\S]*?<\/script>/g) || [];
  if (blocos.length !== 2) {
    erros.push('esperava 2 blocos de script, achei ' + blocos.length);
    return erros;
  }
  const dados = blocos[0].replace(/^<script>/, '').replace(/<\/script>$/, '');
  const app = blocos[1].replace(/^<script>/, '').replace(/<\/script>$/, '');

  /* 1. sintaxe */
  try { new Function(app); } catch (e) {
    erros.push('SINTAXE do JS do navegador: ' + e.message);
    return erros;
  }

  /* 2. execucao contra um DOM de mentira */
  const cache = {};
  const doc = {
    querySelector: function (sel) {
      const id = String(sel).replace('#', '');
      if (!cache[id]) cache[id] = elemento(id);
      return cache[id];
    }
  };
  let D;
  try {
    D = new Function(dados + '\nreturn D;')();
    new Function('document', 'D', app)(doc, D);
  } catch (e) {
    erros.push('EXECUCAO do JS do navegador: ' + e.message);
    return erros;
  }

  /* 3. pintou? */
  [['t_v', 'tabela de veiculos'], ['t_l', 'tabela de lojas'],
   ['kpis', 'painel de KPIs'], ['f_ev', 'filtro de evento']].forEach(function (p) {
    const el = cache[p[0]];
    if (!el || !el.innerHTML || el.innerHTML.length < 20) erros.push(p[1] + ' saiu vazia');
  });

  /* 4. cabecalho e celula com o mesmo numero de colunas */
  ['t_v', 't_l'].forEach(function (id) {
    const h = cache[id] && cache[id].innerHTML;
    if (!h) return;
    const cab = (h.match(/<th[ >]/g) || []).length;
    const p = h.indexOf('<tr', h.indexOf('<tbody'));
    if (p < 0) { erros.push(id + ': nenhuma linha no corpo'); return; }
    const linha = h.slice(p, h.indexOf('</tr>', p));
    const cel = (linha.match(/<td[ >]/g) || []).length;
    if (cab !== cel) erros.push(id + ': ' + cab + ' colunas no cabecalho x ' + cel + ' celulas');
  });

  /* 5. INTERACAO — o filtro de evento realmente filtra?
     Foi aqui que o bug do <option> sem value escapou. */
  const fev = cache['f_ev'];
  const totalInicial = linhasNoCorpo(cache['t_v'] && cache['t_v'].innerHTML);
  if (!fev || typeof fev.onchange !== 'function') {
    erros.push('o filtro de evento nao tem handler de onchange');
  } else {
    const vals = opcoes(fev.innerHTML);
    if (vals.length < 2) {
      erros.push('o filtro de evento tem ' + vals.length + ' opcao(oes) com value');
    }
    let somaFiltrada = 0;
    vals.forEach(function (v) {
      fev.value = v;
      try { fev.onchange(); } catch (e) {
        erros.push('erro ao trocar o filtro para value="' + v + '": ' + e.message);
        return;
      }
      const n = linhasNoCorpo(cache['t_v'].innerHTML);
      if (v === '') {
        if (n !== totalInicial) erros.push('opcao "todos" deveria mostrar ' + totalInicial + ', mostrou ' + n);
      } else {
        if (n === 0) erros.push('filtro de evento value="' + v + '" ZEROU a tabela de veiculos');
        if (n > totalInicial) erros.push('filtro value="' + v + '" mostrou mais linhas que o total');
        somaFiltrada += n;
      }
    });
    /* a soma das partes tem que dar o todo: os eventos particionam a lista */
    if (!erros.length && somaFiltrada !== totalInicial) {
      erros.push('a soma dos eventos (' + somaFiltrada + ') nao fecha com o total (' + totalInicial + ')');
    }
  }

  /* 6. o botao limpar volta ao estado inicial */
  const lim = cache['limpar'];
  if (!lim || typeof lim.onclick !== 'function') {
    erros.push('o botao limpar nao tem handler');
  } else {
    try {
      lim.onclick();
      const n = linhasNoCorpo(cache['t_v'].innerHTML);
      if (n !== totalInicial) erros.push('limpar deveria voltar a ' + totalInicial + ' linhas, voltou ' + n);
    } catch (e) {
      erros.push('erro ao clicar em limpar: ' + e.message);
    }
  }

  return erros;
}

module.exports = { smoke: smoke };
