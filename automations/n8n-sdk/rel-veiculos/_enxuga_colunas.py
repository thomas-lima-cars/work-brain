# -*- coding: utf-8 -*-
"""Enxuga as colunas das duas tabelas e fecha a faixa de KPIs numa grade.

Lado a lado, as tabelas tinham 9 e 11 colunas -- a de lojas ficava espremida
mostrando so a primeira. Duas saidas eram possiveis: empilhar as tabelas em
largura cheia, ou cortar coluna. Empilhar mata o filtro cruzado, que e o
motivo de a tela existir: clicar no veiculo e ver as lojas reordenarem ao
lado. Entao corta coluna -- o detalhe ja vive no extrato.

Sai da tabela de VEICULOS: Categoria (esta no extrato e na barra de contexto).
Sai da tabela de LOJAS: Whitelabel (virou filtro na barra de cima), Idade e
Km medio (estao no extrato). Componentes passa a aparecer so quando ha
selecao, que e quando ele diz alguma coisa.

Os KPIs viram grade de 6 colunas com quebras declaradas em 3 e 2, senao o
sexto cartao cai sozinho esticado na segunda linha.

    python _enxuga_colunas.py
"""
import io
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-html.js")
s = io.open(P, encoding="utf-8").read()
orig = s
feito = []


def troca(velho, novo, rotulo):
    global s
    if velho not in s:
        raise SystemExit("NAO ENCONTRADO: " + rotulo)
    s = s.replace(velho, novo, 1)
    feito.append(rotulo)


# ── KPIs em grade fixa ─────────────────────────────────────────────────
troca(
r"""  '.kpis{display:flex;flex-wrap:wrap;background:#fff;border:1px solid var(--line);',
  'border-radius:3px;margin-bottom:20px}',
  '.kpi{flex:1 1 160px;display:flex;align-items:center;gap:12px;padding:16px 18px;',
  'border-left:1px solid var(--line2)}',
  '.kpi:first-child{border-left:0}',""",
r"""  '.kpis{display:grid;grid-template-columns:repeat(6,1fr);background:#fff;',
  'border:1px solid var(--line);border-radius:3px;margin-bottom:20px}',
  '@media(max-width:1250px){.kpis{grid-template-columns:repeat(3,1fr)}}',
  '@media(max-width:700px){.kpis{grid-template-columns:repeat(2,1fr)}}',
  '.kpi{display:flex;align-items:center;gap:11px;padding:15px 16px;',
  'border-left:1px solid var(--line2);min-width:0}',
  '.kpi:first-child{border-left:0}',
  '@media(max-width:1250px){.kpi:nth-child(3n+1){border-left:0}',
  '.kpi:nth-child(n+4){border-top:1px solid var(--line2)}}',
  '@media(max-width:700px){.kpi:nth-child(2n+1){border-left:0}',
  '.kpi:nth-child(n+3){border-top:1px solid var(--line2)}}',
  '.kpi .vl{white-space:nowrap}.kpi .lb{overflow:hidden;text-overflow:ellipsis}',""",
"KPIs em grade de 6")

# ── veiculos: sai Categoria ────────────────────────────────────────────
troca(
r"""'$("#t_v").innerHTML="<thead><tr><th class=\'tx\'>Veiculo</th><th class=\'tx\'>Categoria</th><th>Ano</th><th>Km</th><th>Valor</th><th class=\'tx\'>UF</th><th class=\'tx\'>Evento</th>"+(comScore?"<th>Aderencia</th><th>Score</th>":"<th>Melhor score</th>")+"<th>Lojas</th></tr></thead><tbody>"+',""",
r"""'$("#t_v").innerHTML="<thead><tr><th class=\'tx\'>Veiculo</th><th>Ano</th><th>Km</th><th>Valor</th><th class=\'tx\'>UF</th><th class=\'tx\'>Evento</th>"+(comScore?"<th>Aderencia</th><th>Score</th>":"<th>Melhor score</th>")+"<th>Lojas</th></tr></thead><tbody>"+',""",
"cabecalho de veiculos sem Categoria")

troca(
r"""  '"<td class=\'tx\'>"+esc(r.v.categoria||"\\u2014")+"</td><td>"+(r.v.model_year||"\\u2014")+"</td><td>"+nf(r.v.km)+"</td><td>"+money(r.v.valor)+"</td>"+',""",
r"""  '"<td>"+(r.v.model_year||"\\u2014")+"</td><td>"+nf(r.v.km)+"</td><td>"+money(r.v.valor)+"</td>"+',""",
"celula de veiculos sem Categoria")

# ── lojas: 11 colunas viram 7 ──────────────────────────────────────────
troca(
r"""'$("#t_l").innerHTML="<thead><tr><th class=\'tx\'>Loja</th><th class=\'tx\'>UF</th><th class=\'tx\'>Whitelabel</th>"+(comScore?"<th>Aderencia</th><th>Score</th>":"<th>Melhor score</th>")+"<th class=\'tx\'>Componentes</th><th>Preco medio</th><th>Idade</th><th>Km medio</th><th class=\'tx\'>Modelo top</th><th class=\'tx\'>Categoria top</th><th>Ofertas 6m</th></tr></thead><tbody>"+',""",
r"""'$("#t_l").innerHTML="<thead><tr><th class=\'tx\'>Loja</th><th class=\'tx\'>UF</th>"+(comScore?"<th>Aderencia</th><th>Score</th><th class=\'tx\'>Componentes</th>":"<th>Melhor score</th>")+"<th>Preco medio</th><th class=\'tx\'>Modelo top</th><th class=\'tx\'>Categoria top</th><th>Ofertas 6m</th></tr></thead><tbody>"+',""",
"cabecalho de lojas enxuto")

troca(
r"""  '"<td class=\'tx\'>"+esc(r.l.uf)+"</td><td class=\'tx\'>"+esc(r.l.whitelabel)+"</td>"+',
  '(comScore?celulas(r.s,r.l.confianca):"<td>"+(r.s===null?"\\u2014":barra(r.s))+"</td>")+"<td class=\'tx\'>"+det(r.d)+"</td>"+',
  '"<td>"+money(r.l.preco_medio)+"</td><td>"+nf(r.l.idade_media,1)+"</td><td>"+nf(r.l.km_medio)+"</td>"+',""",
r"""  '"<td class=\'tx\'>"+esc(r.l.uf)+"</td>"+',
  '(comScore?celulas(r.s,r.l.confianca)+"<td class=\'tx\'>"+det(r.d)+"</td>":"<td>"+(r.s===null?"\\u2014":barra(r.s))+"</td>")+',
  '"<td>"+money(r.l.preco_medio)+"</td>"+',""",
"celula de lojas enxuta")

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
for r in feito:
    print("  ok  " + r)
