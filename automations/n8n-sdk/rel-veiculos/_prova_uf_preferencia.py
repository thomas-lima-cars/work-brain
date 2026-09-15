# -*- coding: utf-8 -*-
"""Provas da regra nova: UF vira preferencia, desagio e laudo viram indicadores.

As provas antigas FALHARAM ao aplicar a mudanca, e falharam certo: elas
codificavam a porta de UF ("v3 (MG) so casa com a loja de MG"). A porta caiu,
entao elas precisam dizer outra coisa -- nao ser silenciadas.

O QUE MUDA NA ASSERCAO:
  - o whitelabel CONTINUA sendo porta: evento que alveja wl7 nao pode casar
    com loja wl4, e isso segue provado;
  - a UF NAO e mais porta: loja de MG passa a aparecer para veiculo de SP.

A PROVA QUE DECIDE e nova e e a unica que separa "prioriza" de "ignora":
a MESMA loja tem que pontuar MAIS ALTO para um veiculo da propria UF do que
para um veiculo identico de outra UF. Se os dois scores forem iguais, o
componente de UF nao esta valendo, e nenhuma contagem de pares perceberia.

Para os componentes novos existirem no dado sintetico foi preciso alimentar
o que o no agora le:
  - `laudo` na resposta da q_veiculos (a coluna nova da fase 2);
  - `desagio_medio` / `desagio_desvio` na q_perfil.
Sem isso os dois componentes ficariam com peso zero e as provas passariam
sem provar nada -- o modo de falha mais caro que existe aqui.

    python _prova_uf_preferencia.py
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


# ── 1. o perfil sintetico ganha as colunas de desagio ────────────────────
troca(
"""const PERFIL = [
  [11, 50, 100000, 10000, 5, 1, 100000, 20000],
  [12, 50, 100000, 100000, 5, 5, 100000, 100000],""",
"""/* as tres ultimas colunas sao desagio_n, desagio_medio e desagio_desvio.
   Sem elas o componente de desagio fica com peso zero e as provas dele
   passariam sem provar nada. */
const PERFIL = [
  [11, 50, 100000, 10000, 5, 1, 100000, 20000, 50, 5, 1],
  [12, 50, 100000, 100000, 5, 5, 100000, 100000, 50, 5, 20],""",
    "perfil sintetico ganha desagio (lojas 11 e 12)")

troca(
"""  [13, 4, 100000, 10000, 5, 1, 100000, 20000],
  [14, 50, 100000, 10000, 5, 1, 100000, 20000],
  /* faixa apertada e distante: adere quase zero em preco, idade e km */
  [15, 50, 300000, 1000, 15, 0.5, 300000, 1000]
];""",
"""  [13, 4, 100000, 10000, 5, 1, 100000, 20000, 4, 5, 1],
  [14, 50, 100000, 10000, 5, 1, 100000, 20000, 50, 5, 1],
  /* faixa apertada e distante: adere quase zero em preco, idade e km */
  [15, 50, 300000, 1000, 15, 0.5, 300000, 1000, 50, 80, 1]
];""",
    "perfil sintetico ganha desagio (lojas 13, 14 e 15)")

troca(
"""  if (p.queryName === 'q_perfil') return resp(['shop_id', 'qt_veiculos', 'preco_medio', 'preco_desvio', 'idade_media', 'idade_desvio', 'km_medio', 'km_desvio'], PERFIL, p.pagina);""",
"""  if (p.queryName === 'q_perfil') return resp(['shop_id', 'qt_veiculos', 'preco_medio', 'preco_desvio', 'idade_media', 'idade_desvio', 'km_medio', 'km_desvio', 'desagio_n', 'desagio_medio', 'desagio_desvio'], PERFIL, p.pagina);""",
    "colunas de desagio na resposta da q_perfil")

# ── 2. o veiculo sintetico ganha o laudo ─────────────────────────────────
troca(
"""const COLV = ['neg_id', 'evento_id', 'evento', 'fim_evento', 'anuncio_id', 'vehicle_id', 'valor', 'valor_inicial', 'fipe', 'model_id', 'modelo', 'category_id', 'categoria', 'marca', 'versao', 'anuncio_uuid', 'model_year', 'km', 'loja_id', 'loja_vendedora', 'uf', 'neg_status'];""",
"""/* `laudo` no fim: a coluna nova da q_veiculos. NULL vira 'ausente' no no,
   que e categoria propria e nao a mesma coisa que 'nao_informado'. */
const COLV = ['neg_id', 'evento_id', 'evento', 'fim_evento', 'anuncio_id', 'vehicle_id', 'valor', 'valor_inicial', 'fipe', 'model_id', 'modelo', 'category_id', 'categoria', 'marca', 'versao', 'anuncio_uuid', 'model_year', 'km', 'loja_id', 'loja_vendedora', 'uf', 'neg_status', 'laudo'];""",
    "COLV ganha laudo")

for velho, novo, rot in [
    ("'Vendedora', 'SP', 1],\n  /* v0: evento 23885", "'Vendedora', 'SP', 1, 'aprovado'],\n  /* v0: evento 23885", "laudo do v_orfao"),
    ("'Vendedora', 'SP', 1],\n  /* v1: evento 23903", "'Vendedora', 'SP', 1, 'aprovado'],\n  /* v1: evento 23903", "laudo do v0"),
    ("'Vendedora', 'SP', 1],\n  /* v2: evento 23885", "'Vendedora', 'SP', 1, 'aprovado'],\n  /* v2: evento 23885", "laudo do v1"),
    ("'Vendedora', 'MG', 1],\n  /* v3: evento 23885", "'Vendedora', 'MG', 1, 'aprovado'],\n  /* v3: evento 23885", "laudo do v2 (MG)"),
    ("'Vendedora', 'RJ', 1],\n  /* v4: SOBRA", "'Vendedora', 'RJ', 1, 'reprovado'],\n  /* v4: SOBRA", "laudo do v3 (RJ)"),
    ("'Vendedora', 'SP', 11],\n  /* v5: DUPLICATA", "'Vendedora', 'SP', 11, null],\n  /* v5: DUPLICATA", "laudo do v4 (sobra, SEM laudo)"),
    ("'Vendedora', 'SP', 1]\n];", "'Vendedora', 'SP', 1, 'aprovado']\n];", "laudo do v5 (duplicata)"),
]:
    troca(velho, novo, rot)

# ── 3. as assercoes da elegibilidade, reescritas ─────────────────────────
troca(
"""ok(D.resumo.pares === 8, 'PARES = 2 + 3 + 1 + 0 + 2 = 8 — tem ' + D.resumo.pares);
ok(D.veiculos[0].candidatos === 2 || D.veiculos.find((v) => v.neg_id === 1).candidatos === 2,
  'v1 (SP, wl7) tem 2 lojas elegiveis');
const byNeg = {};
D.veiculos.forEach((v, i) => { byNeg[v.neg_id] = { v: v, i: i }; });
ok(byNeg[2].v.candidatos === 3, 'v2 (SP, evento alveja wl 4 e 7) tem 3 elegiveis — tem ' + byNeg[2].v.candidatos);
ok(byNeg[3].v.candidatos === 1, 'v3 (MG) so casa com a loja de MG — tem ' + byNeg[3].v.candidatos);
ok(byNeg[4].v.candidatos === 0, 'v4 (RJ) nao tem nenhuma loja — tem ' + byNeg[4].v.candidatos);
ok(byNeg[4].v.melhor === null, 'v4 sem par fica com melhor = null');
ok(S.falhas.some((f) => /1 veiculo\\(s\\) sem nenhuma loja/.test(f)),
  'a falha declara o veiculo sem par — ' + JSON.stringify(S.falhas));""",
"""const byNeg = {};
D.veiculos.forEach((v, i) => { byNeg[v.neg_id] = { v: v, i: i }; });

/* ── a UF deixou de ser porta (2026-09-11, segunda rodada) ─────────────
   Ate aqui a regra era "mesma UF E mesmo whitelabel". A UF virou
   preferencia ponderada, entao estas assercoes mudaram de conteudo -- nao
   foram silenciadas. O whitelabel CONTINUA porta e segue provado abaixo. */
ok(byNeg[3].v.candidatos > 1,
  'v3 (MG) agora alcanca loja de outra UF — tem ' + byNeg[3].v.candidatos);
ok(byNeg[4].v.candidatos > 0,
  'v4 (RJ), que antes ficava sem par nenhum, agora alcanca loja — tem ' + byNeg[4].v.candidatos);
ok(byNeg[4].v.melhor !== null, 'e por isso deixa de ter melhor = null');""",
    "assercoes da porta de UF reescritas")

troca(
"""const idsDe = (vi) => paresDe(vi).map((p) => D.lojas[p.li].loja_id).sort();
ok(JSON.stringify(idsDe(byNeg[1].i)) === '[11,12]', 'v1 casa exatamente com 11 e 12 — tem ' + JSON.stringify(idsDe(byNeg[1].i)));
ok(JSON.stringify(idsDe(byNeg[2].i)) === '[11,12,14]', 'v2 casa com 11, 12 e 14 (wl 4 entra) — tem ' + JSON.stringify(idsDe(byNeg[2].i)));
ok(JSON.stringify(idsDe(byNeg[3].i)) === '[13]', 'v3 casa so com a 13 (MG)');
ok(idsDe(byNeg[1].i).indexOf(13) < 0, 'a loja de MG NAO aparece para veiculo de SP');
ok(idsDe(byNeg[1].i).indexOf(14) < 0, 'a loja wl4 NAO aparece em evento que so alveja wl7');""",
"""const idsDe = (vi) => paresDe(vi).map((p) => D.lojas[p.li].loja_id).sort();
const scoreDe = (vi, lojaId) => {
  const p = paresDe(vi).find((x) => D.lojas[x.li].loja_id === lojaId);
  return p ? p.s : null;
};

/* o WHITELABEL continua sendo porta, e isso nao mudou */
ok(idsDe(byNeg[1].i).indexOf(14) < 0,
  'a loja wl4 NAO aparece em evento que so alveja wl7 — o canal ainda e porta');
ok(idsDe(byNeg[2].i).indexOf(14) >= 0,
  'e aparece quando o evento alveja wl4 — tem ' + JSON.stringify(idsDe(byNeg[2].i)));

/* a UF NAO e mais porta */
ok(idsDe(byNeg[1].i).indexOf(13) >= 0,
  'a loja de MG AGORA aparece para veiculo de SP — tem ' + JSON.stringify(idsDe(byNeg[1].i)));

/* ── A PROVA QUE DECIDE ────────────────────────────────────────────────
   Contagem de pares nao distingue "UF prioriza" de "UF foi ignorada": nos
   dois casos o par existe. O que distingue e o SCORE.

   v1 e v3 sao o mesmo carro em UFs diferentes (mesmo evento, valor, modelo,
   ano e km — so muda SP/MG). Entao a mesma loja tem que pontuar MAIS ALTO
   para o veiculo da propria praca. Se os dois scores derem igual, o peso da
   UF nao esta valendo e nenhuma outra prova aqui perceberia. */
const s11sp = scoreDe(byNeg[1].i, 11);   /* loja SP  x veiculo SP */
const s11mg = scoreDe(byNeg[3].i, 11);   /* loja SP  x veiculo MG */
ok(s11sp !== null && s11mg !== null,
  'a loja 11 alcanca os dois veiculos, em SP e em MG');
ok(s11sp > s11mg,
  'a loja de SP pontua MAIS ALTO no veiculo de SP que no de MG (' +
  s11sp + ' > ' + s11mg + ') — a UF prioriza, nao so deixa passar');

const s13mg = scoreDe(byNeg[3].i, 13);   /* loja MG  x veiculo MG */
const s13sp = scoreDe(byNeg[1].i, 13);   /* loja MG  x veiculo SP */
ok(s13mg !== null && s13sp !== null && s13mg > s13sp,
  'e o mesmo vale do outro lado: a loja de MG prefere o carro de MG (' +
  s13mg + ' > ' + s13sp + ')');""",
    "prova decisiva: a UF prioriza pelo SCORE, nao pela contagem")

# ── 4. provas dos dois indicadores novos ─────────────────────────────────
troca(
"""ok(D.lojas.length === 4, 'as 4 lojas com par entram; a 15 nao — tem ' + D.lojas.length);""",
"""ok(D.lojas.length === 4, 'as 4 lojas com par entram; a 15 nao — tem ' + D.lojas.length);

/* ── desagio e laudo como indicadores ──────────────────────────────────
   Os dois entram na decomposicao do par (`det`), que e o que a tela mostra
   na coluna Componentes. Se o componente nao aparecer ali, ele nao entrou
   na conta -- e o score continuaria "plausivel". */
(function () {
  const det = D.det;
  const P2 = D.pares;
  let idx = -1;
  for (let i = 0, k = 0; i < P2.length; i += 3, k++) {
    if (P2[i] === byNeg[1].i && D.lojas[P2[i + 1]].loja_id === 11) { idx = k; break; }
  }
  ok(idx >= 0, 'achei a decomposicao do par v1 x loja 11');
  const d = det[idx] || {};
  ok(d.desagio !== undefined, 'o DESAGIO entra na decomposicao do par');
  ok(d.laudo !== undefined, 'o LAUDO entra na decomposicao do par');
  ok(d.uf !== undefined, 'a UF entra na decomposicao do par');
  /* v1 e 'aprovado' e a moda da loja 11 tambem (40 de 100 ofertas) */
  ok(d.laudo === 100, 'laudo do veiculo bate com a moda da loja -> 100');
  /* v1 e SP, loja 11 e SP */
  ok(d.uf === 100, 'mesma UF -> componente de UF vale 100');

  const l11 = D.lojas.find((l) => l.loja_id === 11);
  ok(l11.laudo_moda === 'aprovado',
    'a moda de laudo da loja 11 e "aprovado" (40 de 100) — tem ' + l11.laudo_moda);
  ok(l11.desagio_desvio === 1, 'o desvio do desagio atravessou ate a loja');
  ok(l11.p_desagio > 0, 'e virou peso — tem ' + l11.p_desagio);

  /* NEGATIVA: veiculo sem laudo cai em 'ausente', que NAO e 'nao_informado'.
     Confundir os dois apagaria a distincao que o dominio do banco faz. */
  const semLaudo = D.veiculos.find((v) => v.neg_id === 5);
  ok(semLaudo && semLaudo.laudo === 'ausente',
    'veiculo sem linha de laudo vira "ausente" — tem ' + (semLaudo && semLaudo.laudo));
  ok(semLaudo && semLaudo.laudo !== 'nao_informado',
    '[neg] "sem laudo" NAO e "nao informado"');

  /* o desagio do veiculo sai de valor/fipe, com o mesmo corte das lojas */
  const v1 = byNeg[1].v;
  ok(v1.desagio !== null && Math.abs(v1.desagio - 4.76) < 0.01,
    'desagio do veiculo = 100*(1 - 100000/105000) = 4,76% — tem ' + v1.desagio);
})();

/* ── o teto por veiculo ────────────────────────────────────────────────
   Com TETO_LOJAS = 30 e so 5 lojas sinteticas, o teto nao morde aqui; o que
   se prova e que ele foi PUBLICADO e que nada foi cortado em silencio. */
ok(D.resumo.teto_lojas === 30, 'o teto viaja no resumo — tem ' + D.resumo.teto_lojas);
ok(D.resumo.cortados_pelo_teto === 0,
  'com 5 lojas o teto nao corta nada — tem ' + D.resumo.cortados_pelo_teto);""",
    "provas do desagio, do laudo e do teto")

tmp = P + ".tmp"
with io.open(tmp, "w", encoding="utf-8") as f:
    f.write(s)
os.replace(tmp, P)

print("prova-local.js: %d -> %d chars" % (len(orig), len(s)))
