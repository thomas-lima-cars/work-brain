# -*- coding: utf-8 -*-
"""O smoke passa a CLICAR numa loja e conferir o extrato.

Por que isto faltava e por que importa:

  O painel dos cinco campos (`perfilExtra`) so roda quando alguem clica numa
  linha da tabela de lojas. O smoke clicava no glossario e no "limpar", mas
  nunca numa linha -- entao o codigo novo era JS de navegador NAO
  EXERCITADO, que e exatamente a fresta pela qual dois bugs chegaram ao
  Thomas (README: "o JS do navegador viaja como string dentro do no,
  node --check nunca olha pra ele").

  Os handlers de linha sao presos por
  `querySelectorAll("tbody tr").forEach(tr => tr.onclick = ...)`, e o
  querySelectorAll do DOM de mentira devolvia `[]` -- ou seja, nenhum
  handler nascia e nao havia o que clicar. Aqui ele passa a devolver linhas
  falsas com `data-i`, lidas do proprio innerHTML.

    python _smoke_clica_loja.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "_smoke_dom.js")
s = io.open(P, encoding="utf-8").read()
orig = s


def troca(velho, novo, rot):
    global s
    if s.count(velho) != 1:
        raise SystemExit("ANCORA AMBIGUA OU AUSENTE (%d): %s" % (s.count(velho), rot))
    s = s.replace(velho, novo, 1)
    print("  ok  " + rot)


# ── 1. o DOM de mentira passa a devolver linhas ──────────────────────────
troca(
"""    getAttribute: function (k) { return el._attrs[k]; },
    setAttribute: function (k, v) { el._attrs[k] = v; },
    querySelectorAll: function () { return []; }
  };
  return el;
}""",
"""    getAttribute: function (k) { return el._attrs[k]; },
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
      const trs = el.innerHTML.slice(i).match(/<tr[^>]*>/g) || [];
      return trs.map(function (t) {
        const m = t.match(/data-i=['"]?(\\d+)/);
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
    }
  };
  return el;
}""",
    "querySelectorAll devolve linhas com data-i")

# ── 2. clicar numa loja e conferir o extrato ─────────────────────────────
troca(
"""  /* 8. o botao limpar volta ao estado inicial */""",
"""  /* 7b. clicar numa LOJA abre o extrato, e o extrato desenha o painel
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
        /* o painel dos cinco campos tem que estar ali */
        if (ex.indexOf("class='xg'") < 0 && ex.indexOf('class="xg"') < 0) {
          erros.push('o extrato abriu SEM o painel dos cinco campos (.xg)');
        }
        if (ex.indexOf('Faixa de recência') < 0) {
          erros.push('o painel abriu sem a faixa de recencia');
        }
        /* undefined em tela e o sintoma classico deste projeto: campo que o
           no esqueceu de repassar chega assim, em silencio */
        if (ex.indexOf('undefined') >= 0) {
          erros.push('o extrato da loja mostra "undefined" — campo nao repassado');
        }
        if (ex.indexOf('NaN') >= 0) {
          erros.push('o extrato da loja mostra "NaN" — conta com valor ausente');
        }
      }
      /* fecha a selecao para nao contaminar o passo seguinte */
      comHandler[0].onclick();
    } catch (e) {
      erros.push('erro ao clicar numa loja: ' + e.message);
    }
  }

  /* 8. o botao limpar volta ao estado inicial */""",
    "o smoke clica numa loja e confere o painel")

tmp = P + ".tmp"
with io.open(tmp, "w", encoding="utf-8") as f:
    f.write(s)
os.replace(tmp, P)

print("_smoke_dom.js: %d -> %d chars" % (len(orig), len(s)))
