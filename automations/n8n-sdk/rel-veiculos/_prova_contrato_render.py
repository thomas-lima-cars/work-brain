# -*- coding: utf-8 -*-
"""Prova que o bloco RENDER so usa o que o regenerador injeta.

O BURACO QUE ESTA PROVA FECHA, descoberto agora: eu citei `TETO_LOJAS`
dentro do bloco RENDER. No NO isso funciona -- a constante esta no mesmo
escopo, logo acima. No `monta_html_de_dados.js` nao: ele recorta so o trecho
entre RENDER:INICIO e RENDER:FIM e executa com quatro coisas no escopo --
DADOS, META, CONFIANCA_MIN e DADOS_JSON. Resultado: ReferenceError, e a
ferramenta que regenera a tela sem rodar o workflow parou de funcionar.

E a terceira vez que esta familia morde:
  - 10/09: `descreveRecorte()` nasceu FORA do RENDER e o RENDER a chamava;
  - 11/09 (manha): `META.desagio_min` faltou em DADOS.meta, que e um
    subconjunto curado;
  - 11/09 (noite): `TETO_LOJAS` citado dentro do RENDER.

As duas primeiras foram pegas por acaso. Esta prova pega por construcao:
executa o bloco RENDER exatamente como o regenerador executa, com os mesmos
quatro nomes no escopo e nada mais. Qualquer identificador de fora estoura
aqui, em segundos, em vez de estourar na proxima vez que alguem tentar
regerar a tela.

    python _prova_contrato_render.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "prova-local.js")
s = io.open(P, encoding="utf-8").read()
orig = s

ancora = """ok(!fonteHtml.endsWith('\\n'),"""
if s.count(ancora) != 1:
    raise SystemExit("ANCORA AMBIGUA OU AUSENTE (%d)" % s.count(ancora))

prova = """/* ── o CONTRATO do bloco RENDER ────────────────────────────────────────
   O `monta_html_de_dados.js` recorta o trecho entre RENDER:INICIO e
   RENDER:FIM e executa com QUATRO nomes no escopo: DADOS, META,
   CONFIANCA_MIN e DADOS_JSON. Nada mais.

   No no isso nao se percebe: tudo esta no mesmo escopo. Entao e facil citar
   uma constante de cima do arquivo e so descobrir depois, quando alguem
   tenta regerar a tela. Ja aconteceu tres vezes (descreveRecorte fora do
   RENDER, META.desagio_min ausente do DADOS.meta, e TETO_LOJAS citado
   dentro do RENDER).

   Aqui o bloco roda com exatamente o escopo do regenerador, sobre o DADOS
   sintetico que as provas acima produziram. Identificador de fora estoura
   nesta linha, em segundos. */
(function () {
  const ini = fonteHtml.indexOf('/* ==== RENDER:INICIO ====');
  const fim = fonteHtml.indexOf('/* ==== RENDER:FIM ==== */');
  ok(ini > 0 && fim > ini, 'os marcadores RENDER existem no montar-html.js');
  const render = fonteHtml.slice(ini, fim);
  const METAr = D.meta || {};
  const CONFr = (D.parametros && D.parametros.confianca_min) || 5;
  const JSONr = JSON.stringify(D).split('</').join('<\\\\/');
  let erro = null;
  let saiu = '';
  try {
    saiu = new Function('DADOS', 'META', 'CONFIANCA_MIN', 'DADOS_JSON',
      render + '\\nreturn html;')(D, METAr, CONFr, JSONr);
  } catch (e) {
    erro = e.message;
  }
  ok(erro === null,
    'o bloco RENDER roda com o escopo do regenerador (DADOS, META, ' +
    'CONFIANCA_MIN, DADOS_JSON) — ' + (erro || 'sem erro'));
  ok(saiu && saiu.indexOf('</html>') > 0,
    'e devolve um documento completo');
})();

"""

s = s.replace(ancora, prova + ancora, 1)

tmp = P + ".tmp"
with io.open(tmp, "w", encoding="utf-8") as f:
    f.write(s)
os.replace(tmp, P)

print("  ok  prova do contrato do RENDER acrescentada")
print("prova-local.js: %d -> %d chars" % (len(orig), len(s)))
