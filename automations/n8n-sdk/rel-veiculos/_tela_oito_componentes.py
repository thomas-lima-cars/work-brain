# -*- coding: utf-8 -*-
"""A tela passa a mostrar os oito componentes, nao cinco.

Score que muda sem a tela explicar por que e exatamente o defeito que este
relatorio persegue. Se o desagio, o laudo e a UF entram na conta mas nao
aparecem na decomposicao nem no glossario, o numero vira caixa-preta.

Quatro lugares:
  1. `det()` no JS do cliente -- a coluna Componentes, que hoje lista cinco
  2. a tabela de indicadores do extrato -- idem
  3. o cabecalho do no, que diz "Cinco componentes"
  4. o glossario: a formula, e o verbete da elegibilidade, que ainda promete
     "mesma UF" como condicao obrigatoria -- e nao e mais

O verbete da elegibilidade e o mais importante: ele descreve a regra que
define o universo. Deixar escrito que a UF exclui, quando ela passou a so
pesar, seria a tela mentindo sobre a propria base.

    python _tela_oito_componentes.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-html.js")
s = io.open(P, encoding="utf-8").read()
orig = s


def troca(velho, novo, rot):
    global s
    if s.count(velho) != 1:
        raise SystemExit("ANCORA AMBIGUA OU AUSENTE (%d): %s" % (s.count(velho), rot))
    s = s.replace(velho, novo, 1)
    print("  ok  " + rot)


# ── 1. a decomposicao na tela ────────────────────────────────────────────
troca(
"""[\"preco\",\"idade\",\"km\",\"modelo\",\"categoria\"].forEach(k=>{if(d[k]!==undefined)p.push(k[0].toUpperCase()+\" \"+d[k]);});""",
"""[\"preco\",\"idade\",\"km\",\"desagio\",\"modelo\",\"categoria\",\"laudo\",\"uf\"].forEach(k=>{if(d[k]!==undefined)p.push(k[0].toUpperCase()+\" \"+d[k]);});""",
    "det() lista os oito componentes")

# ── 2. a tabela de indicadores do extrato ───────────────────────────────
troca(
"""  ' [\"Km\",l.km_medio,l.km_desvio,l.p_km,function(v){return nf(v)+\" km\";}]].forEach(function(r){',""",
"""  ' [\"Km\",l.km_medio,l.km_desvio,l.p_km,function(v){return nf(v)+\" km\";}],',
  /* desagio entrou como quantitativo em 11/09: mesma forma de preco, idade
     e km, entao entra na MESMA tabela e nao num canto separado. */
  ' [\"Deságio\",l.desagio,l.desagio_desvio,l.p_desagio,function(v){return nf(v,1)+\"%\";}]].forEach(function(r){',""",
    "desagio na tabela de indicadores")

troca(
"""  `linhas.push(\"<tr><td class='tx'>Categoria</td><td class='tx' colspan='3'>\"+esc(l.categoria||\"—\")+\"</td><td>\"+nf(l.pct_categoria/100,3)+\"</td><td class='tx'>\"+nf(l.pct_categoria,1)+\"% das ofertas caem nesta categoria</td></tr>\");`,""",
"""  `linhas.push(\"<tr><td class='tx'>Categoria</td><td class='tx' colspan='3'>\"+esc(l.categoria||\"—\")+\"</td><td>\"+nf(l.pct_categoria/100,3)+\"</td><td class='tx'>\"+nf(l.pct_categoria,1)+\"% das ofertas caem nesta categoria</td></tr>\");`,
  /* laudo e UF: qualitativos, como modelo e categoria */
  `linhas.push(\"<tr><td class='tx'>Laudo</td><td class='tx' colspan='3'>\"+esc(l.laudo_moda_nome||\"—\")+\"</td><td>\"+nf(l.pct_laudo/100,3)+\"</td><td class='tx'>\"+nf(l.pct_laudo,1)+\"% das ofertas caem neste estado de laudo</td></tr>\");`,
  `linhas.push(\"<tr><td class='tx'>UF</td><td class='tx' colspan='3'>\"+esc(l.uf)+\"</td><td>\"+nf(l.p_uf,3)+\"</td><td class='tx'>\"+nf(l.pct_mesma_uf,1)+\"% das ofertas na própria praça\"+(l.p_uf?\"\":\" — indiferente à UF\")+\"</td></tr>\");`,""",
    "laudo e UF na tabela de indicadores")

# ── 3. o cabecalho do no ────────────────────────────────────────────────
troca(
"""   ─── A FÓRMULA ────────
   Cinco componentes. Cada um tem uma ADERÊNCIA (0..1) e um PESO (0..1).

     preço, idade, km:  aderência = 1 / (1 + |valor − média| / desvio)
                        peso      = 1 / (1 + desvio / média)     ← CV

       Loja de faixa apertada é previsível, então acertar o número dela
       vale muito. Loja que compra de tudo tem CV alto e o peso cai
       sozinho, porque o indicador não informa.

     modelo, categoria: aderência = 1 se bate com o item mais ofertado
                        peso      = o % de ofertas da loja naquele item""",
"""   ─── A FÓRMULA ────────
   OITO componentes. Cada um tem uma ADERÊNCIA (0..1) e um PESO (0..1).

     preço, idade, km, deságio:
                        aderência = 1 / (1 + |valor − média| / desvio)
                        peso      = 1 / (1 + desvio / média)     ← CV

       Loja de faixa apertada é previsível, então acertar o número dela
       vale muito. Loja que compra de tudo tem CV alto e o peso cai
       sozinho, porque o indicador não informa.

     modelo, categoria, laudo, UF:
                        aderência = 1 se bate com o item mais ofertado
                        peso      = o % de ofertas da loja naquele item

       ⚠️ A UF entrou aqui em 2026-09-11 e ANTES ERA UMA PORTA: par entre
       UFs diferentes simplesmente não existia. Agora é preferência com
       peso proporcional — loja que compra 90% na própria praça prioriza
       forte, loja que compra 0% fica indiferente. Como o universo de pares
       cresceu 5,3x, existe TETO_LOJAS por veículo.""",
    "cabecalho do no: cinco -> oito componentes")

# ── 4. glossario: a formula ─────────────────────────────────────────────
troca(
"""  '<dd><code>&Sigma;(peso &times; aderência) / &Sigma;(peso)</code>, de 0 a 100. É a média dos cinco indicadores ponderada pelo quanto cada um informa sobre aquela loja.</dd>',""",
"""  '<dd><code>&Sigma;(peso &times; aderência) / &Sigma;(peso)</code>, de 0 a 100. É a média dos <b>oito</b> indicadores ponderada pelo quanto cada um informa sobre aquela loja.</dd>',
  '<dd class=\"ex\">Quantitativos: preço, idade, km e <b>deságio</b>. Qualitativos: modelo, categoria, <b>laudo</b> e <b>UF</b>. Indicador sem dado na loja simplesmente não entra na média — não entra como zero, que puxaria o resultado para baixo sem motivo.</dd>',""",
    "glossario: media dos oito")

# ── 5. glossario: a elegibilidade nao exige mais a UF ───────────────────
troca(
"""  '<dd>Um par (veículo, loja) <b>só existe</b> se as duas condições valerem: a loja está na <b>mesma UF</b> do veículo <b>e</b> pertence a um dos <b>whitelabels que o evento alveja</b>.</dd>',
  '<dd>Fora disso não há aderência baixa &mdash; o par simplesmente não existe. É por isso que o ranking de cada veículo é curto: ele só disputa dentro da própria praça e do próprio canal.</dd>',""",
"""  '<dd>Um par (veículo, loja) <b>só existe</b> se a loja pertence a um dos <b>whitelabels que o evento alveja</b>. O canal é a única condição obrigatória.</dd>',
  '<dd class=\"ex\">⚠️ <b>Mudou em 11/09/2026.</b> Até então a <b>mesma UF</b> também era obrigatória: carro de São Paulo nunca aparecia para loja de Minas. Agora a UF <b>pesa</b> em vez de excluir (ver <i>UF como preferência</i> abaixo), então o ranking de cada veículo ficou bem mais longo e comparar o número de correspondências com o de um relatório anterior a essa data não faz sentido.</dd>',""",
    "glossario: a elegibilidade perde a UF")

# ── 6. glossario: verbetes novos ────────────────────────────────────────
troca(
"""  '<dt>Componentes</dt>',""",
"""  '<dt>UF como preferência</dt>',
  '<dd>A UF do pátio do veículo comparada com a da loja. Vale 1 se batem, 0 se não batem &mdash; e o <b>peso</b> é a fatia de lances que aquela loja faz dentro do próprio estado.</dd>',
  '<dd class=\"ex\">É o que torna a preferência <b>proporcional ao comportamento de cada loja</b>: quem compra 90% na própria praça prioriza forte o carro local; quem compra 20% quase não se importa; quem nunca comprou no próprio estado fica <b>exatamente indiferente</b>, porque o peso é zero e o indicador nem entra na conta.</dd>',
  '<dt>Teto de lojas por veículo</dt>',
  '<dd>Cada veículo publica no máximo <b>' + TETO_LOJAS + '</b> lojas &mdash; as de maior score. Existe porque a UF deixou de excluir: o universo de pares cresceu mais de cinco vezes e, sem teto, o arquivo passaria de 20 MB e travaria o navegador.</dd>',
  '<dd class=\"ex\">O corte é da <b>cauda</b> de cada carro, nunca de carros inteiros, e o número de pares que ficaram de fora é declarado no aviso do topo &mdash; descarte silencioso seria pior que teto nenhum.</dd>',
  '<dt>Componentes</dt>',""",
    "glossario: verbetes da UF e do teto")

troca(
"""  '<dd>A decomposição do par, indicador a indicador (P, I, K, M, C), cada um de 0 a 100.""",
"""  '<dd>A decomposição do par, indicador a indicador (P preço, I idade, K km, D deságio, M modelo, C categoria, L laudo, U UF), cada um de 0 a 100.""",
    "glossario: a legenda dos componentes")

tmp = P + ".tmp"
with io.open(tmp, "w", encoding="utf-8", newline="") as f:
    f.write(s)
os.replace(tmp, P)

print("montar-html.js: %d -> %d chars" % (len(orig), len(s)))
