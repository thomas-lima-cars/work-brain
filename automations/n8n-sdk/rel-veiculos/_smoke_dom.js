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
    /* Registrado desde 18/09: o glossario deixou de ser uma segunda tela e
       virou o fim da pagina, entao o botao ROLA ate ele em vez de trocar
       `display`. Sem isto aqui, o clique estoura no DOM de mentira. */
    _rolou: 0,
    scrollIntoView: function () { el._rolou += 1; },
    /* a <textarea> do texto pro lojista chama `select()` antes de copiar */
    select: function () { el._selecionou = (el._selecionou || 0) + 1; },
    getAttribute: function (k) { return el._attrs[k]; },
    setAttribute: function (k, v) { el._attrs[k] = v; },
    /* Devolve linhas de verdade, lidas do proprio innerHTML.

       Antes isto devolvia [] e a consequencia era silenciosa: o app preso
       os handlers de clique com
       `querySelectorAll("tbody tr").forEach(tr => tr.onclick = ...)`, entao
       com lista vazia NENHUM handler nascia -- e o smoke "passava" sem
       nunca ter exercitado clique em linha. Todo o extrato da loja e do
       veiculo ficava fora do teste. */
    querySelectorAll: function (sel) {
      if (String(sel).indexOf('tr') < 0) return [];
      const i = el.innerHTML.indexOf('<tbody');
      if (i < 0) return [];
      /* MEMOIZA enquanto o innerHTML nao muda. Sem isto cada chamada cria
         objetos novos, o `tr.onclick = ...` do app cai em objetos
         descartados, e quem chamar depois recebe linhas sem handler --
         foi exatamente o que aconteceu na primeira versao deste trecho.
         No navegador de verdade o mesmo no volta a cada consulta; aqui a
         memoizacao e o que reproduz isso. */
      if (el._cacheTr && el._cacheTrHtml === el.innerHTML) return el._cacheTr;
      const trs = el.innerHTML.slice(i).match(/<tr[^>]*>/g) || [];
      el._cacheTrHtml = el.innerHTML;
      el._cacheTr = trs.map(function (t) {
        const m = t.match(/data-i=['"]?(\d+)/);
        const linha = {
          onclick: null,
          className: '',
          style: {},
          _attrs: { 'data-i': m ? m[1] : null },
          getAttribute: function (k) { return linha._attrs[k]; },
          setAttribute: function (k, v) { linha._attrs[k] = v; },
          querySelectorAll: function () { return []; }
        };
        return linha;
      });
      return el._cacheTr;
    }
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
    /* `documentElement.dataset` entrou quando o relatorio adotou o modelo do
       brain (18/09): o tema vive num `data-tema` no <html>, e sem isto aqui o
       APP estoura no primeiro `aplicaTema`. O smoke pegou na hora — que e
       exatamente o que ele existe pra fazer. */
    documentElement: { dataset: { tema: 'claro' } },
    querySelector: function (sel) {
      const id = String(sel).replace('#', '');
      if (!cache[id]) cache[id] = elemento(id);
      return cache[id];
    },
    /* Entrou com a selecao de veiculos (18/09). Devolver [] seria mais facil
       e faria o smoke "passar" sem nunca clicar numa caixa — foi exatamente
       assim que o clique em linha ficou anos fora do teste (ver o comentario
       do `querySelectorAll` do elemento). Entao aqui as caixas sao LIDAS do
       innerHTML do extrato, como as linhas de tabela ja sao. */
    querySelectorAll: function (sel) {
      const ext = cache['extrato'];
      /* `.comp` sao as celulas de Componentes, que guardam a dica dos
         indicadores. Sem esta lista o `td.onmouseenter=...` do app cai em
         lugar nenhum e `dicaInd` -- oito indicadores, dois formatos, quatro
         campos que podem faltar -- nunca roda em teste. E exatamente a
         familia de codigo que este smoke existe pra cobrir: ele so aparece
         quando alguem passa o mouse. */
      if (ext && String(sel).indexOf('.comp') >= 0) {
        if (doc._compHtml === ext.innerHTML && doc._comp) return doc._comp;
        const tds = ext.innerHTML.match(/<td[^>]*class='[^']*comp'[^>]*>/g) || [];
        doc._compHtml = ext.innerHTML;
        doc._comp = tds.map(function (t) {
          const m = t.match(/data-k='([^']*)'/);
          return {
            onmouseenter: null, onmouseleave: null, onclick: null,
            getAttribute: function (k) {
              return k === 'data-k' ? (m ? m[1] : null) : null;
            }
          };
        });
        return doc._comp;
      }
      if (!ext || String(sel).indexOf('.cx') < 0) return [];
      /* MEMOIZA enquanto o innerHTML nao muda — mesma armadilha do
         `querySelectorAll` do elemento, e eu caí nela de novo: sem isto,
         cada chamada cria objetos novos, o `cx.onclick=...` do app cai em
         objetos descartados, e quem consultar depois recebe caixas sem
         handler. O smoke acusou na primeira execucao. */
      if (doc._cxHtml === ext.innerHTML && doc._cx) return doc._cx;
      const tags = ext.innerHTML.match(/<input[^>]*class='cx'[^>]*>/g) || [];
      doc._cxHtml = ext.innerHTML;
      doc._cx = tags.map(function (t) {
        const m = t.match(/data-vid='([^']*)'/);
        return {
          onclick: null,
          checked: /checked/.test(t),
          getAttribute: function (k) {
            return k === 'data-vid' ? (m ? m[1] : null) : null;
          }
        };
      });
      return doc._cx;
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
   ['f_wl', 'filtro de whitelabel'], ['f_uf', 'filtro de UF'],
   ['f_rp', 'filtro de responsável']].forEach(function (p) {
    const el = cache[p[0]];
    if (!el || !el.innerHTML || el.innerHTML.length < 20) erros.push(p[1] + ' saiu vazia');
  });

  /* 3b. o glossario e HTML estatico, montado no no -- o DOM de mentira nao
     o enxerga, entao a conferencia e sobre o texto mesmo. */
  [['id="pg_gloss"', 'a pagina do glossario'],
   ['O que entra na base', 'a secao "o que entra na base"'],
   ['Regras de elegibilidade', 'a secao de elegibilidade'],
   ['Como o número é feito', 'a secao de calculo'],
   ['Fator de confiança', 'o verbete do fator de confianca'],
   ['Correspondência mínima', 'o verbete da correspondencia minima']].forEach(function (p) {
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

  /* 4c. o link do anuncio, contado DEPOIS do render -- no HTML estatico so
     existe o template, entao contar lá enganaria. Regra dura herdada da
     lista LM: veiculo sem marca, modelo, versao ou uuid nao ganha botao,
     e nenhum link pode sair com 'undefined'/'null' no meio. */
  const nLk = (hv.match(/class='lk'/g) || []).length;
  if (nLk === 0) {
    erros.push('nenhum link de anuncio renderizado na tabela de veiculos');
  }
  if (nLk > nDado) {
    erros.push('mais links (' + nLk + ') que veiculos na tela (' + nDado + ')');
  }
  if (/\/(undefined|null)(\/|')/.test(hv)) {
    erros.push('link de anuncio renderizado com undefined ou null no meio');
  }
  /* href vazio e o caso pior: o botao aparece, e clicavel, e nao vai a lugar
     nenhum. Sem esta checagem o sabotador da prova negativa passava. */
  if (/<a[^>]*class='lk'[^>]*href=''/.test(hv) || /href=''[^>]*class='lk'/.test(hv)) {
    erros.push('link de anuncio com href vazio — botao clicavel pra lugar nenhum');
  }
  if (hv.indexOf('class=\'lk\'') >= 0 && hv.indexOf('event.stopPropagation()') < 0) {
    erros.push('o link nao trava a propagacao: clicar nele mexeria na selecao');
  }

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

  /* Responsavel particiona as LOJAS — cada loja tem um dono so, e quem
     nao esta na carteira cai em "Nao Distribuido", que tambem e uma opcao.
     Do lado dos veiculos ele nao faz nada: por isso a soma dos veiculos e
     o total REPETIDO uma vez por opcao, e nao o total. Se um dia a soma
     dos veiculos deixar de ser um multiplo exato do total, o filtro passou
     a esconder carro — que e exatamente o que ele nao deve fazer. */
  const rpVals = opcoes(cache['f_rp'].innerHTML).filter(function (v) { return v !== ''; });
  exercita('f_rp', 'filtro de responsável', function (sv, sl) {
    if (sl !== totalL) erros.push('a soma dos responsáveis (' + sl + ') nao fecha com o total de lojas (' + totalL + ')');
    if (sv !== totalV * rpVals.length) {
      erros.push('o filtro de responsável mexeu na lista de veículos: somou ' + sv +
        ', esperado ' + (totalV * rpVals.length) + ' (' + totalV + ' × ' + rpVals.length + ' opções)');
    }
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

  /* 7. o glossario: ultimo bloco da pagina, FECHADO ate clicarem.
     Foi segunda tela (ate 18/09), depois bloco sempre aberto com botao no
     cabecalho, e agora e um <details> — regra do modelo. Cada mudanca dessas
     quebra este bloco de proposito: e ele que impede a anterior de voltar. */
  if (!/<details[^>]*id="pg_gloss"/.test(html)) {
    erros.push('o glossario nao e um <details> — deveria abrir so no clique');
  }
  const abreGloss = html.match(/<details[^>]*id="pg_gloss"[^>]*>/);
  if (abreGloss && /\bopen\b/.test(abreGloss[0])) {
    erros.push('o glossario nasce aberto — deveria estar fechado');
  }
  if (html.indexOf('id="btn_info"') >= 0) {
    erros.push('o botao do glossario voltou pro cabecalho');
  }

  /* 7a. a gaveta de filtros abre, fecha pelo X e fecha pelo veu */
  const abaF = cache['btn_filtros'];
  if (!abaF || typeof abaF.onclick !== 'function') {
    erros.push('a aba de filtros nao tem handler');
  } else {
    try {
      if (cache['gaveta'].className.indexOf('aberta') >= 0) {
        erros.push('a gaveta de filtros nasce aberta');
      }
      abaF.onclick();
      if (cache['gaveta'].className.indexOf('aberta') < 0) {
        erros.push('clicar na aba nao abriu a gaveta');
      }
      if (cache['veu_filtros'].style.display === 'none') {
        erros.push('a gaveta abriu sem o veu que fecha ao clicar fora');
      }
      if (abaF._attrs['aria-expanded'] !== 'true') {
        erros.push('a aba nao anuncia aria-expanded ao abrir');
      }
      cache['fecha_filtros'].onclick();
      if (cache['gaveta'].className.indexOf('aberta') >= 0) {
        erros.push('o X nao fechou a gaveta');
      }
      abaF.onclick();
      cache['veu_filtros'].onclick();
      if (cache['gaveta'].className.indexOf('aberta') >= 0) {
        erros.push('clicar fora nao fechou a gaveta');
      }
    } catch (e) {
      erros.push('erro na gaveta de filtros: ' + e.message);
    }
  }

  /* 7c. o extrato: corte pelo usuario, selecao, e o texto pro lojista.
     Estas tres coisas so existem DEPOIS de clicar numa loja, entao nada
     aqui e alcancado pelo teste de carga da pagina. */
  const lojas = cache['t_l'] && cache['t_l'].querySelectorAll('tbody tr');
  if (lojas && lojas.length) {
    try {
      lojas[0].onclick();
      const ext = cache['extrato'];
      const h = ext.innerHTML || '';

      if (h.indexOf("type='range'") < 0 || h.indexOf("id='lim'") < 0) {
        erros.push('o corte de aderencia nao virou barra deslizante');
      }
      if (!/id='lim'[^>]*value='70'/.test(h)) {
        erros.push('a barra nao nasce em 70%');
      }
      if (h.indexOf("class='cx'") < 0) {
        erros.push('a lista nao tem caixa de selecao por veiculo');
      }
      if (h.indexOf("id='sel_todos'") < 0) {
        erros.push('falta a caixa de selecionar todos');
      }
      /* a caixa nao pode disparar o clique da linha, que troca a tela */
      if (h.indexOf('stopPropagation') < 0) {
        erros.push('a celula da caixa nao barra o clique da linha');
      }

      /* mover a barra tem que REDESENHAR a lista */
      const bar = cache['lim'];
      if (!bar || typeof bar.oninput !== 'function') {
        erros.push('a barra de corte nao tem handler');
      } else {
        const antes = (ext.innerHTML.match(/class='cx'/g) || []).length;
        bar.value = '0';
        bar.oninput();
        const depois = (ext.innerHTML.match(/class='cx'/g) || []).length;
        if (depois < antes) {
          erros.push('baixar o corte para 0% devolveu MENOS veiculos (' +
                     antes + ' -> ' + depois + ')');
        }
        bar.value = '100';
        bar.oninput();
        const cem = (ext.innerHTML.match(/class='cx'/g) || []).length;
        if (cem > depois) {
          erros.push('subir o corte para 100% devolveu MAIS veiculos');
        }
        bar.value = '70';
        bar.oninput();
      }

      /* sem selecao, o botao avisa em vez de gerar texto vazio */
      const bmsg = cache['btn_msg'];
      if (!bmsg || typeof bmsg.onclick !== 'function') {
        erros.push('o botao de gerar texto nao tem handler');
      } else {
        bmsg.onclick();
        if ((cache['saida_msg'].innerHTML || '').indexOf('Selecione ao menos') < 0) {
          erros.push('sem veiculo marcado, o botao deveria pedir uma selecao');
        }

        /* marca o primeiro e gera de novo */
        const caixas = doc.querySelectorAll('#extrato .cx');
        if (!caixas.length) {
          erros.push('o DOM de mentira nao enxergou as caixas');
        } else {
          caixas[0].checked = true;
          caixas[0].onclick({ stopPropagation: function () {} });
          bmsg.onclick();
          const txt = cache['msg_txt'].value || '';
          if (!txt) erros.push('o texto pro lojista saiu vazio');
          if (txt.indexOf('Ol') !== 0) erros.push('o texto nao comeca saudando a loja');
          if (txt.indexOf('http') < 0) {
            erros.push('o texto nao traz o link do anuncio');
          }
          if (txt.indexOf('<') >= 0 || txt.indexOf('&middot;') >= 0) {
            erros.push('o texto tem marcacao HTML — ele vai pro WhatsApp e pro e-mail');
          }
          if (typeof cache['btn_copiar'].onclick !== 'function') {
            erros.push('o botao de copiar nao tem handler');
          }
        }
      }
      /* A linha da loja e um ALTERNADOR: clicar de novo desmarca. Sem
         devolver ao estado anterior, o bloco 7b clica na mesma linha, ela
         desliga, e o extrato chega vazio la — a falha aparece no teste
         seguinte e nao neste, que e o pior jeito de descobrir. */
      lojas[0].onclick();
    } catch (e) {
      erros.push('erro no extrato da loja: ' + e.message);
    }
  }

  /* 7a-2. o rodape carrega o que saiu do topo */
  if (html.indexOf('Atualizado em') < 0) {
    erros.push('o rodape nao diz quando foi atualizado');
  }
  if (html.indexOf('perfil de compra desde') < 0) {
    erros.push('o rodape nao descreve a base');
  }

  /* 7b. clicar numa LOJA abre o extrato, e o extrato desenha o painel
     dos cinco campos. Sem este passo, `perfilExtra` e codigo de navegador
     que nunca roda em teste nenhum. */
  const tl = cache['t_l'];
  const linhasL = tl ? tl.querySelectorAll('tbody tr') : [];
  const comHandler = linhasL.filter(function (tr) { return typeof tr.onclick === 'function'; });
  if (!linhasL.length) {
    erros.push('a tabela de lojas nao devolveu linhas para clicar');
  } else if (!comHandler.length) {
    erros.push('nenhuma linha de loja recebeu handler de clique');
  } else {
    try {
      comHandler[0].onclick();
      const ex = cache['extrato'] && cache['extrato'].innerHTML || '';
      if (!ex) {
        erros.push('clicar na loja nao preencheu o extrato');
      } else {
        if (ex.indexOf('Extrato da loja') < 0) {
          erros.push('o extrato abriu sem o cabecalho esperado');
        }
        /* O painel dos cinco campos so e EXIGIDO quando o dado embarcado
           tem os campos. Um `dados-*.json` anterior a 11/09 nao tem, e
           nesse caso cada bloco se apaga sozinho e a ausencia do painel e
           o comportamento certo -- exigir sempre transformaria a
           regeneracao de qualquer arquivo antigo num falso alarme, e
           alarme que grita no caso normal e alarme que se aprende a
           ignorar. */
        const temCampos = html.indexOf('"cluster_nome"') >= 0;
        if (temCampos) {
          if (ex.indexOf("class='xg'") < 0 && ex.indexOf('class="xg"') < 0) {
            erros.push('o extrato abriu SEM o painel dos cinco campos (.xg)');
          }
          if (ex.indexOf('Categoria do cliente') < 0) {
            erros.push('o painel abriu sem a categoria do cliente');
          }
        }
        /* O ROTULO nao prova nada: e texto fixo, aparece com ou sem dado.
           O que prova e o VALOR. `esc()` transforma undefined em string
           vazia, entao campo nao repassado vira buraco silencioso na tela
           -- o modo de falha classico deste projeto. Exigir um dos sete
           nomes conhecidos so passa se `cluster_nome` chegou de verdade. */
        const NOMES = ['Cliente Diamante', 'Cliente Ouro', 'Cliente Prata',
          'Cliente Recuperação', 'Lead Quente', 'Lead Morno', 'Lead Frio'];
        if (ex.indexOf('Categoria do cliente') >= 0 &&
            !NOMES.some(function (n) { return ex.indexOf(n) >= 0; })) {
          erros.push('o painel mostra o rotulo da categoria mas nenhum nome de ' +
            'categoria — o valor nao chegou na tela');
        }
        /* undefined em tela e o sintoma classico deste projeto: campo que o
           no esqueceu de repassar chega assim, em silencio */
        if (ex.indexOf('undefined') >= 0) {
          erros.push('o extrato da loja mostra "undefined" — campo nao repassado');
        }
        if (ex.indexOf('NaN') >= 0) {
          erros.push('o extrato da loja mostra "NaN" — conta com valor ausente');
        }

        /* ── 21/09: o que SAIU do extrato tem que continuar fora ────────
           Remocao nao se prova sozinha. Sem estas tres linhas, alguem
           reabre a tabela de indicadores "so pra conferir" e ela volta a
           morar nos dois lugares -- e a partir dai as duas divergem. */
        if (ex.indexOf('<th') >= 0 && ex.indexOf('Referência') >= 0) {
          erros.push('a tabela de indicadores voltou pro extrato — ela agora e a dica');
        }
        if (ex.indexOf('Deságio médio') >= 0 || ex.indexOf('Laudo cautelar') >= 0) {
          erros.push('o extrato voltou a trazer perfil da loja (deságio/laudo)');
        }
        if (ex.indexOf('fator de confiança') >= 0) {
          erros.push('o fator de confiança voltou pro extrato — ele vive na dica de cada par');
        }

        /* ── 21/09: o resumo da loja MUDOU DE ENDERECO ─────────────────
           Saiu da caixa `#ctx`, acima das tabelas, e entrou no cartao do
           extrato, a esquerda da categoria do cliente. As duas metades
           precisam de prova: que ele CHEGOU la, e que nao ficou nos dois
           lugares -- dois textos iguais que divergem na proxima mexida e o
           modo de falha desta pagina inteira. */
        if (ex.indexOf('>Resumo<') < 0) {
          erros.push('o resumo da loja nao esta dentro do extrato');
        }
        if (ex.indexOf('resp. ') < 0 || ex.indexOf('perfil: ') < 0) {
          erros.push('o resumo dentro do extrato nao traz responsavel e perfil');
        }
        if (cache['ctx'] && cache['ctx'].style.display !== 'none') {
          erros.push('o #ctx continuou visivel com uma loja selecionada — ' +
            'o resumo ficou nos dois lugares');
        }
        /* a ordem importa: resumo a ESQUERDA da categoria */
        const iRes = ex.indexOf("class='xk resumo'");
        const iCat = ex.indexOf("class='xk cat'");
        if (iRes < 0) erros.push('o bloco do resumo nao tem a classe que o dimensiona');
        if (iCat >= 0 && iRes >= 0 && iRes > iCat) {
          erros.push('a categoria do cliente esta ANTES do resumo na mesma linha');
        }
        /* e o contato fecha a linha de baixo, inteiro */
        if (ex.indexOf("class='xk contato'") < 0) {
          erros.push('o bloco de contato nao tem a classe que o faz ocupar a linha');
        }

        /* ── o "?" das categorias de cliente (21/09) ────────────────────
           Exigido so quando o catalogo veio nos dados: um `dados-*.json`
           gravado antes desta mudanca nao tem `parametros.clusters`, e ai
           a lista vazia e o comportamento certo. Exigir sempre faria a
           regeneracao de qualquer arquivo antigo gritar sem motivo -- e
           alarme que grita no caso normal e alarme que se aprende a
           ignorar. */
        const temCat = html.indexOf('"clusters"') >= 0;
        if (temCat) {
          if (ex.indexOf("id='aj_cat'") < 0) {
            erros.push('a categoria do cliente nao tem o icone de ajuda');
          }
          const aj = cache['aj_cat'];
          if (!aj || typeof aj.onmouseenter !== 'function') {
            erros.push('o icone da categoria nao abre a dica');
          } else {
            aj.onmouseenter();
            const dcat = cache['dica'] && cache['dica'].innerHTML || '';
            const nLinhas = (dcat.match(/<tr/g) || []).length;
            if (nLinhas < 7) {
              erros.push('a dica das categorias lista ' + nLinhas + ' de 7');
            }
            /* a lista das sete so ajuda se disser ONDE esta loja cai */
            if (dcat.indexOf("class='aqui'") < 0) {
              erros.push('a dica das categorias nao marca a categoria desta loja');
            }
            if (dcat.indexOf('undefined') >= 0) {
              erros.push('a dica das categorias mostra "undefined"');
            }
            aj.onmouseleave();
          }
          /* e o glossario tem que trazer a MESMA lista, do mesmo catalogo */
          if (html.indexOf('Quando se aplica') < 0) {
            erros.push('o glossario nao traz a tabela das categorias de cliente');
          }
          NOMES.forEach(function (n) {
            if (html.indexOf('>' + n + '<') < 0) {
              erros.push('o catalogo publicado nao traz a categoria "' + n + '"');
            }
          });
        }

        /* ── e o cartao e RETRATIL ─────────────────────────────────────── */
        if (ex.indexOf('<details') < 0 || ex.indexOf('<summary') < 0) {
          erros.push('o extrato da loja nao e retratil (sem <details>/<summary>)');
        }
        if (ex.indexOf('<details class=\'card dobra\' open>') < 0 &&
            ex.indexOf('<details class="card dobra" open>') < 0) {
          erros.push('o extrato retratil nao nasce aberto');
        }

        /* ── e o que ENTROU no lugar tem que funcionar ──────────────────
           Aqui a dica e exercitada de verdade: o smoke chama o mesmo
           `onmouseenter` que o mouse chamaria e le o que caiu no balao. */
        const comps = doc.querySelectorAll('#extrato .comp');
        if (!comps.length) {
          erros.push('nenhuma celula de componentes com .comp e data-k na lista de veiculos');
        } else if (typeof comps[0].onmouseenter !== 'function') {
          erros.push('a celula de componentes nao recebeu a dica');
        } else {
          comps[0].onmouseenter();
          const dc = cache['dica'] && cache['dica'].innerHTML || '';
          if (!dc) {
            erros.push('passar o mouse nos componentes nao preencheu a dica');
          } else {
            ['Indicador', 'Este veículo', 'Média da loja', 'Peso', 'Leitura']
              .forEach(function (c) {
                if (dc.indexOf(c) < 0) erros.push('a dica dos indicadores nao traz a coluna ' + c);
              });
            if (dc.indexOf('undefined') >= 0) {
              erros.push('a dica dos indicadores mostra "undefined" — campo nao repassado');
            }
            if (dc.indexOf('NaN') >= 0) {
              erros.push('a dica dos indicadores mostra "NaN" — conta com valor ausente');
            }
            if (cache['dica'].style.display !== 'block') {
              erros.push('a dica foi preenchida mas nao apareceu');
            }
            comps[0].onmouseleave();
            if (cache['dica'].style.display !== 'none') {
              erros.push('a dica nao some quando o mouse sai');
            }
          }
        }
      }
      /* fecha a selecao para nao contaminar o passo seguinte */
      comHandler[0].onclick();
    } catch (e) {
      erros.push('erro ao clicar numa loja: ' + e.message);
    }
  }

  /* 7b-bis. O #ctx perdeu o ramo da LOJA, mas nao o do VEICULO: clicar num
     carro continua enchendo a caixa acima das tabelas. Sem esta prova, tirar
     metade de uma funcao passa por refatoracao ate alguem clicar num carro. */
  const tv = cache['t_v'];
  const linhasV2 = tv ? tv.querySelectorAll('tbody tr') : [];
  const comV = linhasV2.filter(function (tr) { return typeof tr.onclick === 'function'; });
  if (!comV.length) {
    erros.push('nenhuma linha de veiculo recebeu handler de clique');
  } else {
    try {
      comV[0].onclick();
      const cx = cache['ctx'];
      if (!cx || cx.style.display === 'none' || !cx.innerHTML) {
        erros.push('clicar num veiculo nao preencheu o resumo (#ctx)');
      } else if (cx.innerHTML.indexOf('Lojas elegíveis') < 0 &&
                 cx.innerHTML.indexOf('canal sem loja') < 0 &&
                 cx.innerHTML.indexOf('não tem loja compradora') < 0) {
        erros.push('o resumo do veiculo nao explica quais lojas sao elegiveis');
      }
      comV[0].onclick();
    } catch (e) {
      erros.push('erro ao clicar num veiculo: ' + e.message);
    }
  }

  /* 7c. os pontos de atencao viraram icone no cabecalho (21/09).
     O cartao `#alerta` nao existe mais; quem avisa e `#aviso`, que so
     APARECE quando ha algo a dizer. As duas metades sao testaveis: a marca
     no HTML estatico, e o comportamento no DOM de mentira. */
  if (html.indexOf('id="alerta"') >= 0) {
    erros.push('o cartao de alerta voltou ao corpo da pagina');
  }
  if (html.indexOf('id="aviso"') < 0) {
    erros.push('o icone de pontos de atenção nao esta no cabecalho');
  }
  if (html.indexOf('id="dica"') < 0) {
    erros.push('o balao das dicas nao esta na pagina');
  }
  /* o icone vem ANTES do botao de tema, que e o que o pedido dizia */
  if (html.indexOf('id="aviso"') > html.indexOf('id="btn_tema"')) {
    erros.push('o icone de atenção esta DEPOIS do botao de tema');
  }
  const avi = cache['aviso'];
  const temAviso = (D.falhas && D.falhas.length) ||
    (D.diagnostico || []).some(function (d) { return d.veredito !== 'ok'; });
  if (temAviso) {
    if (avi.style.display !== 'inline-flex') {
      erros.push('ha ponto de atenção e o icone continuou escondido');
    }
    if (typeof avi.onmouseenter !== 'function') {
      erros.push('o icone de atenção nao abre a dica');
    } else {
      avi.onmouseenter();
      const dc = cache['dica'] && cache['dica'].innerHTML || '';
      if (dc.indexOf('ponto(s) de atenção') < 0) {
        erros.push('a dica do icone nao lista os pontos de atenção');
      }
      avi.onmouseleave();
    }
  } else if (avi.style.display === 'inline-flex') {
    erros.push('nao ha ponto de atenção e o icone apareceu assim mesmo');
  }

  /* 7d. o titulo do painel fica no CENTRO, na coluna do meio (21/09) */
  if (html.indexOf('<span class="meio"><b>') < 0) {
    erros.push('o titulo nao esta na coluna do meio do topo');
  }

  /* 7e. Duas regras de CSS que so o navegador mostraria, e que ja voltaram
     sozinhas uma vez cada. Aqui elas sao conferidas no TEXTO da folha,
     porque o DOM de mentira nao calcula estilo. */
  if (html.indexOf('.xk>span{display:block') < 0) {
    erros.push('o rotulo do bloco voltou a ser \'.xk span\' — o contato empilha');
  }
  if (/\.xk span\{display:block/.test(html)) {
    erros.push('a regra larga \'.xk span\' voltou: ela pega os .dim do contato');
  }
  if (!/\.gl dl\{[^}]*columns:/.test(html)) {
    erros.push('o glossario voltou a uma coluna so, encostado na esquerda');
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
