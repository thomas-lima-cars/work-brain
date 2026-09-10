# -*- coding: utf-8 -*-
"""Ensina o smoke a exercitar o filtro de whitelabel.

O filtro de evento so entrou no smoke DEPOIS de zerar a tabela na mao do
Thomas. Nao repito o erro: o controle novo ja nasce com teste que mexe nele.

Duas invariantes valem a pena, e sao diferentes entre si:

  - Whitelabel PARTICIONA as lojas (cada loja tem um whitelabel_id so),
    entao a soma das lojas por whitelabel tem que fechar com o total.
  - Whitelabel NAO particiona os veiculos: um evento alveja varios, e o
    mesmo carro conta em cada um. Somar da mais que o total -- e o fan-out
    de 1,17x que ja documentei. Aqui a asserção certa e "nao zera", nao
    "soma fecha". Trocar uma pela outra faria o teste falhar sempre.

    python _add_smoke_wl.py
"""
import io
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "_smoke_dom.js")
s = io.open(P, encoding="utf-8").read()
orig = s

ancora = "  return erros;\n}\n\nmodule.exports"
if ancora not in s:
    raise SystemExit("ancora do fim do smoke nao encontrada")

bloco = """  /* 7. INTERACAO — o filtro de whitelabel, que vale para as duas tabelas.
     Cuidado com a invariante: whitelabel particiona LOJA (uma loja tem um
     whitelabel so) mas nao particiona VEICULO (um evento alveja varios e o
     carro conta em cada um). Por isso a soma fecha de um lado so. */
  const fwl = cache['f_wl'];
  const totalL = linhasNoCorpo(cache['t_l'] && cache['t_l'].innerHTML);
  const totalV2 = linhasNoCorpo(cache['t_v'] && cache['t_v'].innerHTML);
  if (!fwl || typeof fwl.onchange !== 'function') {
    erros.push('o filtro de whitelabel nao tem handler de onchange');
  } else {
    const vals = opcoes(fwl.innerHTML);
    if (vals.length < 2) {
      erros.push('o filtro de whitelabel tem ' + vals.length + ' opcao(oes) com value');
    }
    let somaLojas = 0;
    vals.forEach(function (v) {
      fwl.value = v;
      try { fwl.onchange(); } catch (e) {
        erros.push('erro ao trocar o whitelabel para value="' + v + '": ' + e.message);
        return;
      }
      const nv = linhasNoCorpo(cache['t_v'].innerHTML);
      const nl = linhasNoCorpo(cache['t_l'].innerHTML);
      if (v === '') {
        if (nl !== totalL) erros.push('whitelabel "todos" deveria mostrar ' + totalL + ' lojas, mostrou ' + nl);
        if (nv !== totalV2) erros.push('whitelabel "todos" deveria mostrar ' + totalV2 + ' veiculos, mostrou ' + nv);
      } else {
        if (nv === 0 && nl === 0) erros.push('whitelabel value="' + v + '" zerou as DUAS tabelas');
        if (nl > totalL) erros.push('whitelabel value="' + v + '" mostrou mais lojas que o total');
        somaLojas += nl;
      }
    });
    if (somaLojas !== totalL) {
      erros.push('a soma das lojas por whitelabel (' + somaLojas + ') nao fecha com o total (' + totalL + ')');
    }
    /* o filtro de evento tem que continuar valendo com um whitelabel preso */
    if (vals.length > 1) {
      fwl.value = vals[1];
      try {
        fwl.onchange();
        const comWl = linhasNoCorpo(cache['t_v'].innerHTML);
        const evVals = opcoes(cache['f_ev'].innerHTML).filter(function (x) { return x !== ''; });
        let somaEv = 0;
        evVals.forEach(function (e) {
          cache['f_ev'].value = e;
          cache['f_ev'].onchange();
          somaEv += linhasNoCorpo(cache['t_v'].innerHTML);
        });
        if (evVals.length && somaEv !== comWl) {
          erros.push('com whitelabel preso, a soma dos eventos (' + somaEv +
            ') nao fecha com o que o whitelabel mostra (' + comWl + ')');
        }
      } catch (e) {
        erros.push('erro ao cruzar whitelabel com evento: ' + e.message);
      }
    }
    fwl.value = '';
    try { fwl.onchange(); } catch (e) { erros.push('erro ao voltar o whitelabel: ' + e.message); }
  }

  return erros;
}

module.exports"""
s = s.replace(ancora, bloco, 1)

# o cabecalho do arquivo explica por que ele existe; a lista cresce
s = s.replace(
    "   O primeiro morre na checagem de sintaxe. O segundo so morre se alguem\n"
    "   MEXER no controle — por isso este smoke agora interage: troca o select\n"
    "   de evento em cada opcao, clica em limpar, e confere que a tabela nao\n"
    "   fica vazia.",
    "   O primeiro morre na checagem de sintaxe. O segundo so morre se alguem\n"
    "   MEXER no controle — por isso este smoke interage: troca o select de\n"
    "   evento em cada opcao, troca o de whitelabel em cada opcao, cruza os\n"
    "   dois, clica em limpar, e confere que nenhuma combinacao esvazia a\n"
    "   tabela sem motivo.",
    1)

io.open(P, "w", encoding="utf-8").write(s)
print("smoke estendido: " + str(s != orig))
