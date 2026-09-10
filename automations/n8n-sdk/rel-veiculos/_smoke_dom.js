/* ══════════════════════════════════════════════════════════════════════
   Smoke test do JS que roda no NAVEGADOR.

   Por que existe: o codigo do cliente viaja dentro do `montar-html.js`
   como STRING — `node --check` nunca olha para ele. Dois bugs reais
   passaram por essa fresta e so apareceram quando o Thomas abriu a pagina:

     1. `"+(comScore?...` -> "missing ) after argument list" (sintaxe)
     2. `<option>` sem `value` -> o valor virava o texto COM a contagem,
        e o filtro de evento zerava a tabela (comportamento)

   O primeiro morre na checagem de sintaxe. O segundo so morre se alguem
   MEXER no controle — por isso este smoke interage: percorre os tres
   dropdowns, cruza um com o outro, abre o glossario, clica em limpar, e
   confere que nenhuma combinacao esvazia a tela sem motivo.

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

/* Linhas de DADO no corpo da tabela.

   A tabela de veiculos passou a ter DOIS <tr> por carro: um com UF e
   evento (classe `ctxr`) e outro com os dados. Contar `<tr>` cru daria o
   dobro e faria toda invariante de soma mentir. */
function linhasNoCorpo(html) {
  if (!html) return 0;
  const i = html.indexOf('<tbody');
  if (i < 0) return 0;
  const trs = html.slice(i).match(/<tr[^>]*>/g) || [];
  return trs.filter(function (t) { return t.indexOf('ctxr') < 0; }).length;
}

/* a primeira linha de dado, para conferir contagem de colunas */
function primeiraLinhaDeDado(html) {
  const i = html.indexOf('<tbody');
  if (i < 0) return null;
  const corpo = html.slice(i);
  const re = /<tr[^>]*>/g;
  let m;
  while ((m = re.exec(corpo)) !== null) {
    if (m[0].indexOf('ctxr') >= 0) continue;
    const fim = corpo.indexOf('</tr>', m.index);
    return corpo.slice(m.index, fim);
  }
  return null;
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

  /* 2. execucao contra um DOM de mentira.
     `window` e `location` entraram quando o glossario virou uma segunda
     tela com endereco proprio (#glossario). */
  const cache = {};
  const doc = {
    querySelector: function (sel) {
      const id = String(sel).replace('#', '');
      if (!cache[id]) cache[id] = elemento(id);
      return cache[id];
    }
  };
  const loc = { hash: '' };
  const win = { scrollTo: function () {}, onhashchange: null };
  let D;
  try {
    D = new Function(dados + '\nreturn D;')();
    new Function('document', 'D', 'window', 'location', app)(doc, D, win, loc);
  } catch (e) {
    erros.push('EXECUCAO do JS do navegador: ' + e.message);
    return erros;
  }

  /* 3. pintou? */
  [['t_v', 'tabela de veiculos'], ['t_l', 'tabela de lojas'],
   ['kpis', 'painel de KPIs'], ['f_ev', 'filtro de evento'],
   ['f_wl', 'filtro de whitelabel'], ['f_uf', 'filtro de UF']].forEach(function (p) {
    const el = cache[p[0]];
    if (!el || !el.innerHTML || el.innerHTML.length < 20) erros.push(p[1] + ' saiu vazia');
  });

  /* 3b. o glossario e HTML estatico, montado no no -- o DOM de mentira nao
     o enxerga, entao a conferencia e sobre o texto mesmo. */
  [['id="pg_gloss"', 'a pagina do glossario'],
   ['O que entra na base', 'a secao "o que entra na base"'],
   ['Quem pode casar com quem', 'a secao de elegibilidade'],
   ['Como o numero e feito', 'a secao de calculo'],
   ['Fator de confianca', 'o verbete do fator de confianca'],
   ['Correspondencia minima', 'o verbete da correspondencia minima']].forEach(function (p) {
    if (html.indexOf(p[0]) < 0) erros.push(p[1] + ' nao esta no HTML');
  });
  /* e a tabela de status tem que sair do dicionario publicado, nao de uma
     lista escrita a mao que envelhece sozinha */
  ['Sem Ofertas', 'Em Analise Vendedor', 'Vendido'].forEach(function (nome) {
    if (html.indexOf('>' + nome + '<') < 0) erros.push('o glossario nao lista o status "' + nome + '"');
  });

  /* 4. cabecalho e celula de dado com o mesmo numero de colunas */
  ['t_v', 't_l'].forEach(function (id) {
    const h = cache[id] && cache[id].innerHTML;
    if (!h) return;
    const cab = (h.match(/<th[ >]/g) || []).length;
    const linha = primeiraLinhaDeDado(h);
    if (!linha) { erros.push(id + ': nenhuma linha de dado no corpo'); return; }
    const cel = (linha.match(/<td[ >]/g) || []).length;
    if (cab !== cel) erros.push(id + ': ' + cab + ' colunas no cabecalho x ' + cel + ' celulas');
  });

  /* 4b. a tabela de veiculos tem que ter os DOIS niveis por carro */
  const hv = cache['t_v'] && cache['t_v'].innerHTML || '';
  const nCtx = (hv.match(/<tr[^>]*ctxr/g) || []).length;
  const nDado = linhasNoCorpo(hv);
  if (nCtx !== nDado) {
    erros.push('veiculos: ' + nCtx + ' linhas de contexto para ' + nDado +
      ' de dado — os dois niveis tem que andar em par');
  }
  if (hv.indexOf('colspan=') < 0) erros.push('a linha de contexto do veiculo nao usa colspan');

  /* 5. INTERACAO — cada dropdown filtra de verdade?
     Foi aqui que o bug do <option> sem value escapou. */
  const totalV = linhasNoCorpo(hv);
  const totalL = linhasNoCorpo(cache['t_l'] && cache['t_l'].innerHTML);

  function exercita(id, nome, invariante) {
    const el = cache[id];
    if (!el || typeof el.onchange !== 'function') {
      erros.push('o ' + nome + ' nao tem handler de onchange');
      return;
    }
    const vals = opcoes(el.innerHTML);
    if (vals.length < 2) {
      erros.push('o ' + nome + ' tem ' + vals.length + ' opcao(oes) com value');
      return;
    }
    let somaV = 0, somaL = 0;
    vals.forEach(function (v) {
      el.value = v;
      try { el.onchange(); } catch (e) {
        erros.push('erro ao trocar o ' + nome + ' para value="' + v + '": ' + e.message);
        return;
      }
      const nv = linhasNoCorpo(cache['t_v'].innerHTML);
      const nl = linhasNoCorpo(cache['t_l'].innerHTML);
      if (v === '') {
        if (nv !== totalV) erros.push(nome + ' em "todos" deveria mostrar ' + totalV + ' veiculos, mostrou ' + nv);
      } else {
        if (nv === 0 && nl === 0) erros.push(nome + ' value="' + v + '" ZEROU as duas tabelas');
        if (nv > totalV) erros.push(nome + ' value="' + v + '" mostrou mais veiculos que o total');
        somaV += nv; somaL += nl;
      }
    });
    el.value = '';
    try { el.onchange(); } catch (e) { erros.push('erro ao voltar o ' + nome + ': ' + e.message); }
    if (invariante) invariante(somaV, somaL);
  }

  /* Evento e UF PARTICIONAM os veiculos: cada carro esta num evento so e
     numa UF so, entao a soma das partes tem que fechar com o todo.
     Whitelabel NAO particiona: um evento alveja varios e o mesmo carro
     conta em cada um -- e o fan-out. Do lado das lojas e o contrario:
     whitelabel e UF particionam, evento nao se aplica. Trocar uma
     invariante pela outra faz o teste falhar sempre. */
  exercita('f_ev', 'filtro de evento', function (sv) {
    if (sv !== totalV) erros.push('a soma dos eventos (' + sv + ') nao fecha com o total de veiculos (' + totalV + ')');
  });
  exercita('f_uf', 'filtro de UF', function (sv, sl) {
    if (sv !== totalV) erros.push('a soma das UFs (' + sv + ') nao fecha com o total de veiculos (' + totalV + ')');
    if (sl !== totalL) erros.push('a soma das UFs (' + sl + ') nao fecha com o total de lojas (' + totalL + ')');
  });
  exercita('f_wl', 'filtro de whitelabel', function (sv, sl) {
    if (sv < totalV) erros.push('a soma dos whitelabels (' + sv + ') ficou ABAIXO do total (' + totalV + '); o fan-out so pode inflar');
    if (sl !== totalL) erros.push('a soma dos whitelabels (' + sl + ') nao fecha com o total de lojas (' + totalL + ')');
  });

  /* 6. dois filtros ao mesmo tempo nao podem se anular sem motivo */
  const wlVals = opcoes(cache['f_wl'].innerHTML).filter(function (v) { return v !== ''; });
  if (wlVals.length) {
    cache['f_wl'].value = wlVals[0];
    cache['f_wl'].onchange();
    const comWl = linhasNoCorpo(cache['t_v'].innerHTML);
    const evVals = opcoes(cache['f_ev'].innerHTML).filter(function (v) { return v !== ''; });
    let soma = 0;
    evVals.forEach(function (e) {
      cache['f_ev'].value = e;
      cache['f_ev'].onchange();
      soma += linhasNoCorpo(cache['t_v'].innerHTML);
    });
    if (evVals.length && soma !== comWl) {
      erros.push('com whitelabel preso, a soma dos eventos (' + soma +
        ') nao fecha com o que o whitelabel mostra (' + comWl + ')');
    }
    cache['f_wl'].value = ''; cache['f_ev'].value = '';
    cache['f_wl'].onchange();
  }

  /* 7. o glossario abre e volta */
  const bt = cache['btn_info'];
  if (!bt || typeof bt.onclick !== 'function') {
    erros.push('o botao do glossario nao tem handler');
  } else {
    try {
      bt.onclick();
      if (cache['pg_gloss'].style.display !== '' || cache['pg_rel'].style.display !== 'none') {
        erros.push('clicar no botao nao trocou para o glossario');
      }
      if (loc.hash !== 'glossario' && loc.hash !== '#glossario') {
        erros.push('o glossario nao registrou endereco proprio — tem "' + loc.hash + '"');
      }
      bt.onclick();
      if (cache['pg_rel'].style.display !== '' || cache['pg_gloss'].style.display !== 'none') {
        erros.push('clicar de novo nao voltou para o relatorio');
      }
    } catch (e) {
      erros.push('erro ao abrir o glossario: ' + e.message);
    }
  }

  /* 8. o botao limpar volta ao estado inicial */
  const lim = cache['limpar'];
  if (!lim || typeof lim.onclick !== 'function') {
    erros.push('o botao limpar nao tem handler');
  } else {
    try {
      lim.onclick();
      const n = linhasNoCorpo(cache['t_v'].innerHTML);
      if (n !== totalV) erros.push('limpar deveria voltar a ' + totalV + ' veiculos, voltou ' + n);
    } catch (e) {
      erros.push('erro ao clicar em limpar: ' + e.message);
    }
  }

  return erros;
}

module.exports = { smoke: smoke };
