# -*- coding: utf-8 -*-
"""A opcao "todos" tem que CONTAR, nao somar as opcoes.

Bug meu, visto na primeira tela: o dropdown dizia "todos os whitelabels
(821)" quando o total de veiculos era 735. Eu montava o numero somando a
contagem de cada opcao -- e whitelabel tem fan-out: um evento alveja
varios canais e o mesmo carro conta em cada um. Somar inflava.

Evento e UF nao tinham o problema (particionam), entao o erro so aparecia
num dos tres dropdowns -- o tipo de coisa que passa batido se voce so olha
o que funciona.

A correcao: "todos" passa a contar os veiculos que sobram desconsiderando
APENAS a propria dimensao, que e literalmente o que escolher "todos"
significa.

    python _corrige_total_opcao.py
"""
import io
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-html.js")
s = io.open(P, encoding="utf-8").read()
orig = s


def troca(velho, novo, rotulo):
    global s
    if velho not in s:
        raise SystemExit("NAO ENCONTRADO: " + rotulo)
    s = s.replace(velho, novo, 1)
    print("  ok  " + rotulo)


troca(
r"""  'function opcoes(alvo,itens,rotulo,conta,cur){',
  'var manteve=false;var tot=0;',
  'const opts=itens.map(function(it,i){',
  'const n=conta(it);tot+=n;if(!n)return "";',
  'if(String(i)===cur)manteve=true;',
  'return "<option value=\'"+i+"\'>"+rotulo(it)+" ("+n+")</option>";}).join("");',
  '$(alvo).innerHTML="<option value=\'\'>"+(alvo==="#f_wl"?"todos os whitelabels":alvo==="#f_uf"?"todas as UFs":"todos os eventos")+" ("+tot+")</option>"+opts;',
  '$(alvo).value=manteve?cur:"";}',""",
r"""  /* `tot` e CONTADO, nao somado. Somar as opcoes inflava o whitelabel:
     um evento alveja varios canais e o mesmo carro conta em cada um, entao
     a soma dava 821 para 735 veiculos. Evento e UF particionam e nao tinham
     o problema -- por isso ele so aparecia num dos tres dropdowns. */
  'function opcoes(alvo,itens,rotulo,conta,tot,cur){',
  'var manteve=false;',
  'const opts=itens.map(function(it,i){',
  'const n=conta(it);if(!n)return "";',
  'if(String(i)===cur)manteve=true;',
  'return "<option value=\'"+i+"\'>"+rotulo(it)+" ("+n+")</option>";}).join("");',
  '$(alvo).innerHTML="<option value=\'\'>"+(alvo==="#f_wl"?"todos os whitelabels":alvo==="#f_uf"?"todas as UFs":"todos os eventos")+" ("+tot+")</option>"+opts;',
  '$(alvo).value=manteve?cur:"";}',""",
"opcoes recebe o total contado")

troca(
r"""  'function pintaFiltros(){',
  'const w=wlSel(),ev=evSel(),uf=ufSel();',
  'opcoes("#f_wl",wls,function(x){return esc(wlNome[x]);},',
  'function(x){return D.veiculos.filter(function(v){return passaV(v,ev,x,uf);}).length;},$("#f_wl").value);',
  'opcoes("#f_uf",ufs,function(x){return esc(x);},',
  'function(x){return D.veiculos.filter(function(v){return passaV(v,ev,w,x);}).length;},$("#f_uf").value);',
  'opcoes("#f_ev",evs,function(x){return esc(x)+(evFechado[x]?" [encerrado]":"");},',
  'function(x){return D.veiculos.filter(function(v){return passaV(v,x,w,uf);}).length;},$("#f_ev").value);}',""",
r"""  'function pintaFiltros(){',
  'const w=wlSel(),ev=evSel(),uf=ufSel();',
  'const qt=function(e2,w2,u2){return D.veiculos.filter(function(v){return passaV(v,e2,w2,u2);}).length;};',
  'opcoes("#f_wl",wls,function(x){return esc(wlNome[x]);},',
  'function(x){return qt(ev,x,uf);},qt(ev,null,uf),$("#f_wl").value);',
  'opcoes("#f_uf",ufs,function(x){return esc(x);},',
  'function(x){return qt(ev,w,x);},qt(ev,w,null),$("#f_uf").value);',
  'opcoes("#f_ev",evs,function(x){return esc(x)+(evFechado[x]?" [encerrado]":"");},',
  'function(x){return qt(x,w,uf);},qt(null,w,uf),$("#f_ev").value);}',""",
"pintaFiltros passa o total de cada dimensao")

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
