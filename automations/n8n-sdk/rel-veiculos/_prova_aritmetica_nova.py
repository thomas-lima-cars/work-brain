# -*- coding: utf-8 -*-
"""Atualiza as provas de aritmetica e de contagem para a formula de 8 componentes.

Todas estas falharam com a mudanca, e todas falharam CERTO -- elas travavam
numeros que a formula antiga produzia. Atualizar um numero de prova e
perigoso (e facil "consertar" a prova em vez do codigo), entao cada novo
valor vem com a conta ao lado, conferida contra a decomposicao real.

A CONTA DO PAR neg1 x loja11, que antes dava 100 e agora da 97:

  pesos    preco 0,909 | idade 0,833 | km 0,833 | modelo 0,5
           categoria 0,8 | desagio 0,833 | laudo 0,4 | uf 0,25   -> soma 5,359
  aderenc. tudo 1, MENOS desagio = 0,807
           (veiculo 4,76% contra media 5% da loja, desvio 1 -> 1/(1+0,24/1))
  score    (5,359 - 0,833 + 0,833x0,807) / 5,359 = 0,970 -> 97

Ou seja: o unico componente abaixo de 100 e o desagio, e ele sozinho puxa o
par de 100 para 97. E exatamente o que se espera de um indicador novo entrando
numa media ponderada.

A DESCOBERTA QUE VIROU PROVA: a loja 13 compra 0% dentro da propria UF
(`ofertas_mesma_uf` = 0), entao o peso da UF dela e ZERO e o componente nem
entra na decomposicao. Resultado medido: 63,7 para o carro de MG e 63,7 para
o de SP -- indiferenca exata. Ja a loja 11, que compra 25% na praca, da 97
contra 92,3.

Isso prova a PROPORCIONALIDADE, que e o que o Thomas pediu ("de acordo com o
% de ofertas na mesma UF"), e nao so que "a UF influencia". Uma prova que so
comparasse duas lojas quaisquer nao distinguiria proporcional de bonus fixo.

    python _prova_aritmetica_nova.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "prova-local.js")
s = io.open(P, encoding="utf-8").read()
orig = s


def troca(velho, novo, rot):
    global s
    if s.count(velho) != 1:
        raise SystemExit("ANCORA AMBIGUA OU AUSENTE (%d): %s" % (s.count(velho), rot))
    s = s.replace(velho, novo, 1)
    print("  ok  " + rot)


# ── 1. a prova da UF: indiferenca de quem compra 0% na praca ─────────────
troca(
"""const s13mg = scoreDe(byNeg[3].i, 13);   /* loja MG  x veiculo MG */
const s13sp = scoreDe(byNeg[1].i, 13);   /* loja MG  x veiculo SP */
ok(s13mg !== null && s13sp !== null && s13mg > s13sp,
  'e o mesmo vale do outro lado: a loja de MG prefere o carro de MG (' +
  s13mg + ' > ' + s13sp + ')');""",
"""/* E O CONTRAPONTO, que prova a PROPORCIONALIDADE em vez de so "a UF
   influencia": a loja 13 compra 0% dentro da propria UF, entao o peso da UF
   dela e zero e ela tem que ficar EXATAMENTE indiferente. Se desse
   diferenca, a UF estaria valendo como bonus fixo, nao como preferencia
   proporcional -- e a prova de cima sozinha nao notaria. */
const s13mg = scoreDe(byNeg[3].i, 13);   /* loja MG (0% na praca) x veiculo MG */
const s13sp = scoreDe(byNeg[1].i, 13);   /* loja MG (0% na praca) x veiculo SP */
const l13 = D.lojas.find((l) => l.loja_id === 13);
ok(l13 && l13.p_uf === 0, 'a loja 13 nao oferta nada na propria UF — peso zero');
ok(s13mg !== null && s13sp !== null && s13mg === s13sp,
  'e por isso fica INDIFERENTE a UF: ' + s13mg + ' nos dois casos — ' +
  'a preferencia e proporcional, nao um bonus fixo');""",
    "a UF prova proporcionalidade, nao so influencia")

# ── 2. aritmetica: o desagio puxa 100 para 97 ───────────────────────────
troca(
"""ok(perto(scoreDe(byNeg[1].i, 11), 100, 0.05), 'v1 na media exata da loja 11 -> 100 — tem ' + scoreDe(byNeg[1].i, 11));
ok(perto(scoreDe(byNeg[3].i, 13), 80, 0.05), 'loja 13 tem amostra 4: confianca 4/5 abaixa 100 para 80 — tem ' + scoreDe(byNeg[3].i, 13));""",
"""/* Antes da formula de 8 componentes este par dava 100 exato. Agora da 97, e
   a conta esta no cabecalho do _prova_aritmetica_nova.py: o veiculo esta na
   media exata da loja em preco, idade, km, modelo, categoria, laudo e UF --
   o UNICO componente abaixo de 100 e o desagio (4,76% contra media 5%,
   desvio 1 -> aderencia 0,807), e com peso 0,833 ele puxa o par para 97. */
ok(perto(scoreDe(byNeg[1].i, 11), 97, 0.05),
  'v1 bate a loja 11 em tudo menos desagio -> 97 — tem ' + scoreDe(byNeg[1].i, 11));
/* a confianca CONTINUA descontando (4 veiculos de historico -> x0,8), mas
   agora ha outro peso pra baixo: a moda de laudo da loja 13 e "ausente" e o
   veiculo e "aprovado", entao o componente de laudo vale 0 com peso 1,0.
   0,797 x 0,8 = 0,637. Provar os dois juntos e o que impede alguem trocar
   um pelo outro sem perceber. */
ok(perto(scoreDe(byNeg[3].i, 13), 63.7, 0.1),
  'loja 13: confianca 0,8 E laudo divergente -> 63,7 — tem ' + scoreDe(byNeg[3].i, 13));
ok(l13.confianca === 0.8, 'a confianca da loja 13 continua 4/5');
ok(l13.laudo_moda === 'ausente' && l13.pct_laudo === 100,
  'e a moda de laudo dela e "ausente", em 100% das ofertas');""",
    "aritmetica do desagio e do laudo, com a conta ao lado")

# ── 3. contagens que dependiam da porta de UF ───────────────────────────
troca(
"""ok(porL[li11].length === 3, 'a loja 11 aparece para 3 veiculos (os dois SP ativos + a sobra) — tem ' + porL[li11].length);""",
"""/* Eram 3 (so os de SP). Sem a porta de UF a loja 11 alcanca os cinco
   veiculos do canal dela -- inclusive o de MG e o de RJ, que antes eram
   invisiveis pra ela. E esse o efeito pedido. */
ok(porL[li11].length === 5,
  'a loja 11 agora alcanca os 5 veiculos do canal, nao so os de SP — tem ' + porL[li11].length);""",
    "loja 11 alcanca todo o canal")

troca(
"""ok(porL[li13].length === 1, 'a loja 13 (MG) so aparece para o veiculo de MG');
ok(D.lojas[li11].pares === 3 && D.lojas[li13].pares === 1, 'a contagem de pares por loja bate');
ok(D.lojas[li11].melhor === 100, 'melhor score da loja 11 = 100');""",
"""ok(porL[li13].length === 4,
  'a loja 13 (MG) tambem sai da propria praca — tem ' + porL[li13].length);
ok(D.lojas[li11].pares === porL[li11].length && D.lojas[li13].pares === porL[li13].length,
  'a contagem de pares por loja bate com o indice');
ok(D.lojas[li11].melhor === 97,
  'melhor score da loja 11 = 97 (o teto de 100 caiu com o desagio) — tem ' + D.lojas[li11].melhor);""",
    "contagens por loja, sem a porta de UF")

# ── 4. o JSON embarcado ─────────────────────────────────────────────────
troca(
"""ok(rep.pares.length === 24, 'JSON embarcado: 8 pares x 3 numeros = 24 — tem ' + rep.pares.length);
ok(rep.det.length === 8, 'uma decomposicao por par');""",
"""/* 15 pares agora, nao 8: a UF parou de excluir. O numero exato importa --
   se mudar sem alguem mexer na regra, alguma coisa se moveu sozinha. */
ok(rep.pares.length === 45, 'JSON embarcado: 15 pares x 3 numeros = 45 — tem ' + rep.pares.length);
ok(rep.det.length === 15, 'uma decomposicao por par');""",
    "contagem do JSON embarcado")

# ── 5. o desagio da loja deixou de ser nulo ─────────────────────────────
troca(
"""  ok(porId[11] && porId[11].desagio === null,
    'sem fipe no dado sintetico, o desagio fica nulo em vez de zero');""",
"""  /* Antes o dado sintetico nao tinha desagio e a prova conferia o NULO.
     Agora tem (a q_perfil passou a devolver media e desvio), entao o que se
     confere e o valor -- e que o desvio chegou junto, porque sem ele o
     indicador nao teria peso. */
  ok(porId[11] && porId[11].desagio === 5,
    'a media de desagio da loja chega — tem ' + (porId[11] && porId[11].desagio));
  ok(porId[11] && porId[11].desagio_desvio === 1,
    'e o desvio tambem, que e o que da peso ao indicador');""",
    "desagio da loja: de nulo para valor")

tmp = P + ".tmp"
with io.open(tmp, "w", encoding="utf-8") as f:
    f.write(s)
os.replace(tmp, P)

print("prova-local.js: %d -> %d chars" % (len(orig), len(s)))
