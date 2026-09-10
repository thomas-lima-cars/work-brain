# -*- coding: utf-8 -*-
"""Separa ADERENCIA (bruta) de SCORE (final) nas tabelas.

Ate agora as tabelas mostravam uma coluna so, rotulada "Aderencia", que na
verdade era o score final -- ja multiplicado pelo fator de confianca. Sao
coisas diferentes e a diferenca morde: 215 das 547 lojas tem confianca < 1,
o que afeta 15.054 dos 39.761 pares. A REIS VEICULOS INTERCRED, por exemplo,
tem aderencia 100 e score 20, porque tem 1 unico veiculo de historico.

Agora sao duas colunas:
  Aderencia = o quanto o veiculo casa com o perfil da loja (0..100)
  Score     = aderencia x confianca -- e o que ordena

Nao precisa de coleta nova: bruto = score / confianca, exatamente
recuperavel, porque foi assim que o score foi construido.

    python _add_score.py
"""
import io
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-html.js")
s = io.open(P, encoding="utf-8").read()
orig = s

Q = "'"
B = chr(92)
tx = "class=" + B + Q + "tx" + B + Q


def troca(velho, novo, rotulo):
    global s
    if velho not in s:
        raise SystemExit("NAO ENCONTRADO: " + rotulo)
    s = s.replace(velho, novo, 1)


# ── helper novo: devolve as duas celulas ────────────────────────────────
helper = (
    "  'function celulas(s,conf){if(s===null||s===undefined)"
    'return "<td>' + B + 'u2014</td><td>' + B + 'u2014</td>";'
    "const c=conf||1;const bruto=s/c;"
    'return "<td>"+nf(bruto,1)+"</td><td>"+barra(s)+"</td>";}' + "',\n"
)
alvo = "  'function det(d){"
if alvo not in s:
    raise SystemExit("ancora do det() nao encontrada")
s = s.replace(alvo, helper + alvo, 1)

# ── tabela de VEICULOS ─────────────────────────────────────────────────
troca(
    '<th>"+(comScore?"Aderencia":"Melhor")+"</th><th>Lojas</th>',
    '"+(comScore?"<th>Aderencia</th><th>Score</th>":"<th>Melhor score</th>")+"<th>Lojas</th>',
    "cabecalho veiculos",
)
troca(
    '\'"<td>"+(r.s===null||r.s===undefined?"' + B + B + 'u2014":barra(r.s))+"</td><td>"+nf(r.v.candidatos)+"</td></tr>").join("")+"</tbody>";\',',
    '\'"+(comScore?celulas(r.s,D.lojas[selL].confianca):"<td>"+(r.s===null?"' + B + B + 'u2014":barra(r.s))+"</td>")+"<td>"+nf(r.v.candidatos)+"</td></tr>").join("")+"</tbody>";\',',
    "celula veiculos",
)

# ── tabela de LOJAS ────────────────────────────────────────────────────
troca(
    '<th>"+(comScore?"Aderencia":"Melhor")+"</th><th ' + tx + '>Componentes</th>',
    '"+(comScore?"<th>Aderencia</th><th>Score</th>":"<th>Melhor score</th>")+"<th ' + tx + '>Componentes</th>',
    "cabecalho lojas",
)
troca(
    '\'"<td>"+(r.s===null||r.s===undefined?"' + B + B + 'u2014":barra(r.s))+"</td><td ' + tx + '>"+det(r.d)+"</td>"+\',',
    '\'"+(comScore?celulas(r.s,r.l.confianca):"<td>"+(r.s===null?"' + B + B + 'u2014":barra(r.s))+"</td>")+"<td ' + tx + '>"+det(r.d)+"</td>"+\',',
    "celula lojas",
)

# ── lista do extrato ───────────────────────────────────────────────────
troca(
    "<th>Aderencia</th><th " + tx + ">Veiculo</th>",
    "<th>Aderencia</th><th>Score</th><th " + tx + ">Veiculo</th>",
    "cabecalho extrato",
)
troca(
    'return "<tr><td>"+barra(x.s)+"</td><td ' + tx + '>"+esc((v.marca?v.marca+" ":"")',
    'return "<tr>"+celulas(x.s,l.confianca)+"<td ' + tx + '>"+esc((v.marca?v.marca+" ":"")',
    "celula extrato",
)

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
for m in ["function celulas(", "<th>Score</th>", "celulas(r.s,", "celulas(x.s,"]:
    print(("  ok    " if m in s else "  FALTA ") + m)
