# -*- coding: utf-8 -*-
"""Marca o veiculo cujo evento ja encerrou.

Agora que a base pega o dia inteiro, e nao so daqui pra frente, convivem na
mesma tela evento que ainda esta rodando e evento que fechou de manha. Sem
marcar, os dois se parecem -- e o leitor nao tem como saber quais foram os
que acabaram de entrar.

A comparacao e de string, e isso e proposital: `fim_evento` vem do banco
como '%Y-%m-%d %H:%i' e `agora_br` e montado no mesmo formato, em hora de
Brasilia. Comparar texto ordenado assim da o mesmo resultado que comparar
data, sem construir Date nenhum -- e sem reintroduzir fuso, que e onde este
relatorio ja escorregou.

    python _marca_encerrado.py
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
        raise SystemExit("NAO ENCONTRADO (" + rotulo + ")")
    s = s.replace(velho, novo, 1)
    feito.append(rotulo)


# ── 1. a flag no veiculo ────────────────────────────────────────────────
troca(
"""    wls: wls,
    wl_nomes: wls.map((w) => wlNome[String(w)] || ('#' + w)).join(', ')
  });
});""",
"""    wls: wls,
    wl_nomes: wls.map((w) => wlNome[String(w)] || ('#' + w)).join(', '),
    /* string x string: os dois lados sao 'YYYY-MM-DD HH:MM' em hora de
       Brasilia, entao a ordem lexicografica e a ordem cronologica */
    encerrado: !!(META.agora_br && r.fim_evento && r.fim_evento < META.agora_br)
  });
});""",
"flag encerrado no veiculo")

# ── 2. o relogio e a janela viajam no DADOS ─────────────────────────────
troca(
"""  meta: {
    meses_historico: META.meses_historico, data_ini: META.data_ini,""",
"""  meta: {
    meses_historico: META.meses_historico, data_ini: META.data_ini,
    agora_br: META.agora_br, janela_ini: META.janela_ini, janela_fim: META.janela_fim,""",
"relogio e janela no DADOS")

# ── 3. resumo conta quantos vieram de evento ja fechado ─────────────────
troca(
"""    eventos: (META.eventos || []).length,
    sem_par: semPar,""",
"""    eventos: (META.eventos || []).length,
    encerrados: veiculos.filter((v) => v.encerrado).length,
    sem_par: semPar,""",
"contagem de encerrados no resumo")

# ── 4. KPI e marcacao no filtro de evento ───────────────────────────────
troca(
    r"""  '$("#kpis").innerHTML=[["veiculos",nf(R.veiculos)],["lojas elegiveis",nf(R.lojas_elegiveis)],["pares",nf(R.pares)],["media de lojas por veiculo",nf(R.media_candidatos)],["veiculos sem par",nf(R.sem_par)],["eventos",nf(R.eventos)]].map(k=>"<div class=\'kpi\'><b>"+k[1]+"</b><span>"+k[0]+"</span></div>").join("");',""",
    r"""  '$("#kpis").innerHTML=[["veiculos",nf(R.veiculos)],["lojas elegiveis",nf(R.lojas_elegiveis)],["pares",nf(R.pares)],["media de lojas por veiculo",nf(R.media_candidatos)],["em evento ja encerrado",nf(R.encerrados||0)],["veiculos sem par",nf(R.sem_par)],["eventos",nf(R.eventos)]].map(k=>"<div class=\'kpi\'><b>"+k[1]+"</b><span>"+k[0]+"</span></div>").join("");',""",
    "KPI de encerrados")

troca(
    r"""  'const evs=Array.from(new Set(D.veiculos.map(v=>v.evento))).sort();',""",
    r"""  'const evs=Array.from(new Set(D.veiculos.map(v=>v.evento))).sort();',
  'const evFechado={};D.veiculos.forEach(function(v){if(v.encerrado)evFechado[v.evento]=1;});',""",
    "mapa de evento encerrado")

troca(
    r"""  'return "<option value=\'"+i+"\'>"+esc(e)+" ("+n+")</option>";}).join("");',""",
    r"""  'return "<option value=\'"+i+"\'>"+esc(e)+(evFechado[e]?" [encerrado]":"")+" ("+n+")</option>";}).join("");',""",
    "opcao de evento marca encerrado")

# na tabela de veiculos, o evento encerrado ganha um selo
troca(
    r"""  '"<td class=\'tx\'>"+esc(r.v.uf)+"</td><td class=\'tx\'>"+esc(r.v.evento)+"</td>"+',""",
    r"""  '"<td class=\'tx\'>"+esc(r.v.uf)+"</td><td class=\'tx\'>"+esc(r.v.evento)+(r.v.encerrado?" <span class=\'tag w\'>encerrado</span>":"")+"</td>"+',""",
    "selo de encerrado na tabela de veiculos")

# ── 5. o subtitulo conta a janela real ──────────────────────────────────
troca(
    """  '<div class="sub">Clique num <b>veiculo</b> para ordenar as lojas por aderencia; clique numa <b>loja</b> para ordenar os veiculos. Clicar de novo desmarca. &middot; perfil de compra dos ultimos ' + (META.meses_historico || 6) + ' meses (desde ' + (META.data_ini || '?') + ') &middot; preco = <code>value_actual</code> &middot; gerado em <span id="ger"></span></div>',""",
    """  '<div class="sub">Clique num <b>veiculo</b> para ordenar as lojas por aderencia; clique numa <b>loja</b> para ordenar os veiculos. Clicar de novo desmarca. &middot; eventos que encerram entre <b>' + (META.janela_ini || '?') + '</b> e <b>' + (META.janela_fim || '?') + '</b> (hora de Brasilia, ja encerrados inclusive) &middot; perfil de compra dos ultimos ' + (META.meses_historico || 6) + ' meses (desde ' + (META.data_ini || '?') + ') &middot; preco = <code>value_actual</code> &middot; gerado em <span id="ger"></span></div>',""",
    "subtitulo mostra a janela")

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
for r in feito:
    print("  ok  " + r)
