# -*- coding: utf-8 -*-
r"""q_modelo e q_categoria param de poder truncar sem avisar.

No run 50270 a correcao do filtro de canal resolveu q_ofertas e q_perfil
(1.295 linhas = o esperado), mas q_modelo e q_categoria voltaram com
exatamente 1.300 = 26 x 50, que e o teto da paginacao.

1.300 no teto NAO prova truncamento aqui: a consulta de moda devolve uma
linha por (loja, item) empatado no topo, entao loja com empate rende mais de
uma linha e o total legitimamente passa do numero de lojas. A evidencia
tambem nao aponta truncamento -- as 44 lojas sem modelo estao espalhadas
pela faixa de ids, e truncamento cortaria o FIM da ordenacao por shop_id
(so 2 das 44 estao entre os 200 maiores ids).

Mas "provavelmente nao truncou" nao e resposta quando o numero bate exato no
teto. Entao se mede, em vez de supor -- duas mudancas:

  1. FOLGA: as duas modas ganham 2 paginas a mais que as outras consultas de
     loja, porque so elas podem passar do numero de lojas por empate. E
     numero escolhido, nao medido -- por isso vem com (2).

  2. CONFERENCIA: a fase 1 conta quantas lojas TEM modelo e quantas TEM
     categoria (`q_moda_lojas`), e o Montar HTML confere contra quantas
     lojas distintas chegaram em cada moda. Faltou loja, vira falha
     declarada. Isso pega truncamento de verdade sem depender de adivinhar
     quantos empates existem.

A conferencia e por LOJAS DISTINTAS, nao por linhas, justamente porque o
numero de linhas depende de empates e nao da pra prever.

    python _cobertura_moda.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
AQUI = os.path.dirname(os.path.abspath(__file__))


def patch(nome, pares):
    P = os.path.join(AQUI, nome)
    s = io.open(P, encoding="utf-8").read()
    orig = s
    for velho, novo, rot in pares:
        if velho not in s:
            raise SystemExit("NAO ENCONTRADO em " + nome + ": " + rot)
        s = s.replace(velho, novo, 1)
        print("  ok  " + nome + ": " + rot)
    io.open(P, "w", encoding="utf-8").write(s)
    print("  -> " + nome + " mudou: " + str(s != orig))


# ── FASE 1: quantas lojas tem modelo e quantas tem categoria ──────────────
patch("montar-fase1.js", [
    (
"""/* o value_actual está preenchido? O Thomas escolheu ele como preço do""",
"""/* quantas lojas TEM moda de modelo e quantas TEM moda de categoria.
   Serve pra conferir cobertura das duas consultas de moda, que sao as
   unicas que podem passar do numero de lojas (empate no topo rende mais de
   uma linha por loja) e por isso nao dao pra dimensionar por contagem de
   linha. A conferencia e por LOJA DISTINTA. */
push('q_moda_lojas',
  "SELECT COUNT(DISTINCT CASE WHEN v.model_id IS NOT NULL THEN o." + LADO + " END) AS lojas_modelo," +
  " COUNT(DISTINCT CASE WHEN v.category_id IS NOT NULL THEN o." + LADO + " END) AS lojas_categoria" +
  " FROM offers o" +
  " INNER JOIN shops s ON s.id = o." + LADO + " AND s.deleted_at IS NULL" + SO_WL_LOJA +
  " INNER JOIN advertisements a ON a.id = o.advertisement_id AND a.deleted_at IS NULL" +
  " INNER JOIN vehicles v ON v.id = a.vehicle_id AND v.deleted_at IS NULL" +
  " WHERE" + JANELA_OFERTAS);

/* o value_actual está preenchido? O Thomas escolheu ele como preço do""",
        "q_moda_lojas acrescentada"),
])

# ── FASE 2: folga nas modas e repasse da contagem ─────────────────────────
patch("montar-fase2.js", [
    (
"""const PAG_VEIC = Math.ceil(VEICULOS / PAGE);
const PAG_LOJAS = Math.ceil(LOJAS / PAGE);""",
"""const PAG_VEIC = Math.ceil(VEICULOS / PAGE);
const PAG_LOJAS = Math.ceil(LOJAS / PAGE);
/* As duas consultas de MODA sao as unicas que podem passar do numero de
   lojas: elas devolvem uma linha por (loja, item) empatado no topo, entao
   loja com empate rende mais de uma linha. No run 50270 as duas voltaram
   com exatos 1.300 = 26 x 50, batendo no teto -- sem folga nao da pra
   saber se aquilo era a contagem real ou corte.

   2 paginas de folga sao numero ESCOLHIDO, nao medido. O que torna a
   escolha segura e a conferencia de cobertura no Montar HTML, que compara
   as lojas distintas que chegaram contra q_moda_lojas. */
const PAG_MODA = PAG_LOJAS + 2;""",
        "PAG_MODA com folga declarada"),
    (
"""    \" LEFT JOIN \" + tabela + \" cat ON cat.id = ag.item_id\" +
    \" ORDER BY ag.shop_id, ag.item_id\", PAG_LOJAS);""",
"""    \" LEFT JOIN \" + tabela + \" cat ON cat.id = ag.item_id\" +
    \" ORDER BY ag.shop_id, ag.item_id\", PAG_MODA);""",
        "as modas usam PAG_MODA"),
    (
"""  wl_nomes_banco: leitura('q_wl_nomes'),""",
"""  wl_nomes_banco: leitura('q_wl_nomes'),
  moda_lojas: leitura('q_moda_lojas')[0] || {},""",
        "META repassa a contagem de cobertura das modas"),
])

# ── MONTAR HTML: a conferencia ────────────────────────────────────────────
patch("montar-html.js", [
    (
"""const semWl = veiculos.filter((v) => !v.wls.length).length;""",
"""/* As duas consultas de moda podem passar do numero de lojas (empate no
   topo rende mais de uma linha por loja), entao elas NAO dao pra conferir
   por contagem de linha -- so por LOJA DISTINTA. Sem isto, truncamento
   nelas tira o componente de modelo/categoria de algumas lojas e o score
   sai menor sem ninguem notar. */
const mLoj = META.moda_lojas || {};
[['q_modelo', 'lojas_modelo', 'modelo'], ['q_categoria', 'lojas_categoria', 'categoria']]
  .forEach((par) => {
    const esperado = Number(mLoj[par[1]]);
    if (!Number.isFinite(esperado)) return;
    const vistas = {};
    (dados[par[0]] || []).forEach((r) => { vistas[String(r.shop_id)] = 1; });
    const n = Object.keys(vistas).length;
    if (n < esperado) {
      falhas.push('a moda de ' + par[2] + ' cobriu ' + n + ' lojas de ' + esperado +
        ': faltam ' + (esperado - n) + ' — provavel truncamento da consulta, e as ' +
        'lojas que faltam perdem esse componente do score em silencio.');
    }
  });

const semWl = veiculos.filter((v) => !v.wls.length).length;""",
        "conferencia de cobertura das modas"),
])
