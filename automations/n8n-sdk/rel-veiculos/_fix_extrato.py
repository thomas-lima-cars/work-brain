# -*- coding: utf-8 -*-
"""Reescreve o bloco do extrato no APP com escape correto.

Motivo de existir: o heredoc do bash nesta maquina come contrabarra, entao
gerar codigo JS com aspas simples por `python - <<EOF` produz linha quebrada.
Script em arquivo nao passa pelo heredoc e sai intacto.
"""
import io
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-html.js")
s = io.open(P, encoding="utf-8").read()

INI = "  'const LIMIAR=70;',"
FIM_MARCA = "style.display='';}',"


def jl(code):
    """codigo JS -> elemento do array APP, com escape de \\ e '."""
    esc = code.replace(chr(92), chr(92) * 2).replace("'", chr(92) + "'")
    return "  '" + esc + "',"


EXTRATO = [
    "const LIMIAR=70;",
    "function cvDe(m,d){if(!m||d===null||d===undefined)return null;return d/m;}",
    'function leitura(cv){if(cv===null)return "<span class=\'dim\'>sem desvio medido</span>";'
    'if(cv<0.25)return "faixa apertada: acertar este numero vale muito";'
    'if(cv<0.6)return "faixa media";'
    'return "dispersao alta: este indicador quase nao informa";}',
    "function extrato(){",
    'if(selL===null){$("#extrato").innerHTML="";$("#extrato").style.display="none";return;}',
    "const l=D.lojas[selL];",
    "const linhas=[];",
    '[["Preco",l.preco_medio,l.preco_desvio,l.p_preco,money],',
    ' ["Idade",l.idade_media,l.idade_desvio,l.p_idade,function(v){return nf(v,1)+" anos";}],',
    ' ["Km",l.km_medio,l.km_desvio,l.p_km,function(v){return nf(v)+" km";}]].forEach(function(r){',
    "const cv=cvDe(r[1],r[2]);",
    'linhas.push("<tr><td class=\'tx\'>"+r[0]+"</td><td>"+(r[1]===null?"\\u2014":r[4](r[1]))'
    '+"</td><td>"+(r[2]===null||r[2]===undefined?"\\u2014":r[4](r[2]))'
    '+"</td><td>"+(cv===null?"\\u2014":nf(cv,2))+"</td><td>"+nf(r[3],3)'
    '+"</td><td class=\'tx\'>"+leitura(cv)+"</td></tr>");});',
    'linhas.push("<tr><td class=\'tx\'>Modelo</td><td class=\'tx\' colspan=\'3\'>"+esc(l.modelo||"\\u2014")'
    '+"</td><td>"+nf(l.pct_modelo/100,3)+"</td><td class=\'tx\'>"+nf(l.pct_modelo,1)'
    '+"% das ofertas caem neste modelo</td></tr>");',
    'linhas.push("<tr><td class=\'tx\'>Categoria</td><td class=\'tx\' colspan=\'3\'>"+esc(l.categoria||"\\u2014")'
    '+"</td><td>"+nf(l.pct_categoria/100,3)+"</td><td class=\'tx\'>"+nf(l.pct_categoria,1)'
    '+"% das ofertas caem nesta categoria</td></tr>");',
    "const acima=(porL[selL]||[]).filter(function(x){return x.s>LIMIAR;});",
    'const listaV=acima.length?("<div class=\'wrap\' style=\'max-height:40vh\'><table><thead><tr>'
    '<th>Aderencia</th><th class=\'tx\'>Veiculo</th><th class=\'tx\'>Categoria</th><th>Ano</th>'
    '<th>Km</th><th>Valor</th><th class=\'tx\'>Evento</th><th class=\'tx\'>Componentes</th>'
    '</tr></thead><tbody>"+acima.map(function(x){const v=D.veiculos[x.o];'
    'return "<tr><td>"+barra(x.s)+"</td><td class=\'tx\'>"+esc((v.marca?v.marca+" ":"")+(v.modelo||"?"))'
    '+" <span class=\'dim mono\'>#"+v.vehicle_id+"</span></td><td class=\'tx\'>"+esc(v.categoria||"\\u2014")'
    '+"</td><td>"+(v.model_year||"\\u2014")+"</td><td>"+nf(v.km)+"</td><td>"+money(v.valor)'
    '+"</td><td class=\'tx\'>"+esc(v.evento)+"</td><td class=\'tx\'>"+det(x.d)+"</td></tr>";'
    '}).join("")+"</tbody></table></div>")',
    ':("<div class=\'dim\'>Nenhum veiculo elegivel passa de "+LIMIAR+"% de aderencia para esta loja.'
    ' O melhor e "+nf(l.melhor,1)+"%.</div>");',
    '$("#extrato").innerHTML="<h2>Extrato da loja &mdash; "+esc(l.loja)'
    '+" <span class=\'dim mono\'>#"+l.loja_id+"</span></h2>"+',
    '"<div class=\'box\'><div style=\'margin-bottom:8px\'>"+esc(l.uf)+" &middot; "+esc(l.whitelabel)'
    '+" &middot; <b>"+nf(l.qt_ofertas)+"</b> ofertas em <b>"+nf(l.qt_veiculos)'
    '+"</b> veiculos nos ultimos 6 meses"+(l.amostra_baixa?" <span class=\'tag w\'>amostra baixa</span>":"")'
    '+" &middot; fator de confianca <b>"+nf(l.confianca,2)+"</b> &middot; elegivel para <b>"'
    '+nf(l.pares)+"</b> veiculo(s)</div>"+',
    '"<table><thead><tr><th class=\'tx\'>Indicador</th><th>Referencia</th><th>Desvio</th>'
    '<th>CV</th><th>Peso</th><th class=\'tx\'>Leitura</th></tr></thead><tbody>"+linhas.join("")'
    '+"</tbody></table>"+',
    '"<div class=\'dim\' style=\'margin-top:8px\'>O <b>peso</b> sai de 1/(1 + desvio/media) nos numericos'
    ' e do % de ofertas em modelo e categoria. CV baixo = loja previsivel = indicador pesa mais.'
    '</div></div>"+',
    '"<h2>Veiculos com aderencia acima de "+LIMIAR+"% <span class=\'dim\'>("+acima.length+" de "'
    '+nf(l.pares)+" elegiveis)</span></h2>"+listaV;',
    '$("#extrato").style.display="";}',
]

linhas = s.split("\n")
ini = next(i for i, l in enumerate(linhas) if l == INI)
fim = next(i for i, l in enumerate(linhas) if i >= ini and FIM_MARCA in l)
novo = [jl(c) for c in EXTRATO]
linhas[ini:fim + 1] = novo
s2 = "\n".join(linhas)
io.open(P, "w", encoding="utf-8").write(s2)

print("bloco trocado: linhas " + str(ini + 1) + ".." + str(fim + 1) +
      " -> " + str(len(novo)) + " linhas novas")
