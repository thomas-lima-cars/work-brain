# -*- coding: utf-8 -*-
"""Filtro de whitelabel global + filtro de evento valendo tambem no extrato.

Pedido do Thomas em 2026-09-09:
  1. filtro de whitelabel que vale para TODAS as tabelas
  2. o filtro de evento tem que valer tambem para a tabela de veiculos de baixo
     (a lista do extrato, que ate agora ignorava os dois filtros)

Duas decisoes de desenho aqui:

- O select de whitelabel fica ao lado do "limpar selecao", FORA dos paineis.
  Filtro que vale para tudo nao pode morar dentro de um painel so, senao parece
  que filtra aquele painel.

- As opcoes do filtro de EVENTO passam a ser recontadas quando o whitelabel
  muda. Sem isso o dropdown diria "Feirao LM (79)" enquanto a tabela mostra 12,
  e evento que ficou sem nenhum veiculo naquele whitelabel some da lista.

Como sempre neste arquivo: value = INDICE, nunca o texto. Foi um <option> sem
value que zerou a tabela de veiculos na semana passada.

    python _add_filtro_wl.py
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


# ── 1. mapa de whitelabels + os dois selects ────────────────────────────
# Fonte autoritativa dos pares (id, nome) sao as lojas, que trazem os dois
# campos juntos. Os veiculos trazem `wls` (ids) e `wl_nomes` (nomes na mesma
# ordem), entao servem so pra completar id que nenhuma loja tenha.
velho = r"""  'const evs=Array.from(new Set(D.veiculos.map(v=>v.evento))).sort();',
  '$("#f_ev").innerHTML="<option value=\'\'>todos os eventos ("+D.veiculos.length+")</option>"+evs.map(function(e,i){return "<option value=\'"+i+"\'>"+esc(e)+" ("+D.veiculos.filter(function(v){return v.evento===e;}).length+")</option>";}).join("");',"""

novo = r"""  'const evs=Array.from(new Set(D.veiculos.map(v=>v.evento))).sort();',
  'const wlNome={};',
  'D.lojas.forEach(function(l){if(l.whitelabel_id!==null&&l.whitelabel_id!==undefined&&!wlNome[l.whitelabel_id])wlNome[l.whitelabel_id]=l.whitelabel;});',
  'D.veiculos.forEach(function(v){const ns=String(v.wl_nomes||"").split(", ");(v.wls||[]).forEach(function(w,i){if(!wlNome[w])wlNome[w]=ns[i]||("#"+w);});});',
  'const wls=Object.keys(wlNome).map(Number).sort(function(a,b){return String(wlNome[a]).localeCompare(String(wlNome[b]));});',
  'function wlSel(){const i=$("#f_wl").value;return i===""?null:wls[Number(i)];}',
  'function noWl(v,w){return w===null||(v.wls||[]).indexOf(w)>=0;}',
  '$("#f_wl").innerHTML="<option value=\'\'>todos os whitelabels ("+wls.length+")</option>"+wls.map(function(w,i){var nv=D.veiculos.filter(function(v){return (v.wls||[]).indexOf(w)>=0;}).length;var nl=D.lojas.filter(function(l){return l.whitelabel_id===w;}).length;return "<option value=\'"+i+"\'>"+esc(wlNome[w])+" ("+nv+" veic, "+nl+" lojas)</option>";}).join("");',
  /* as opcoes de evento sao recontadas quando o whitelabel muda: dropdown
     que diz 79 com a tabela mostrando 12 e pior que nao ter contagem */
  'function pintaFiltros(){',
  'const w=wlSel();const cur=$("#f_ev").value;var manteve=false;var tot=0;',
  'const opts=evs.map(function(e,i){',
  'const n=D.veiculos.filter(function(v){return v.evento===e&&noWl(v,w);}).length;',
  'tot+=n;if(!n)return "";if(String(i)===cur)manteve=true;',
  'return "<option value=\'"+i+"\'>"+esc(e)+" ("+n+")</option>";}).join("");',
  '$("#f_ev").innerHTML="<option value=\'\'>todos os eventos ("+tot+")</option>"+opts;',
  '$("#f_ev").value=manteve?cur:"";}',"""
troca(velho, novo, "mapa de whitelabels, select global e recontagem dos eventos")

# ── 2. tabela de veiculos respeita o whitelabel ─────────────────────────
troca(
    r"""  'const evi=$("#f_ev").value;',
  'const ev=(evi===""?null:evs[Number(evi)]);',
  'let base;',
  'if(selL!==null){base=(porL[selL]||[]).map(x=>({v:D.veiculos[x.o],i:x.o,s:x.s,d:x.d}));}',""",
    r"""  'const evi=$("#f_ev").value;',
  'const ev=(evi===""?null:evs[Number(evi)]);',
  'const w=wlSel();',
  'let base;',
  'if(selL!==null){base=(porL[selL]||[]).map(x=>({v:D.veiculos[x.o],i:x.o,s:x.s,d:x.d}));}',""",
    "linhasV le o whitelabel",
)
troca(
    r"""  'return base.filter(r=>(!ev||r.v.evento===ev)&&(!q||((r.v.marca||"")+" "+(r.v.modelo||"")).toLowerCase().indexOf(q)>=0));}',""",
    r"""  'return base.filter(r=>(!ev||r.v.evento===ev)&&noWl(r.v,w)&&(!q||((r.v.marca||"")+" "+(r.v.modelo||"")).toLowerCase().indexOf(q)>=0));}',""",
    "linhasV filtra por whitelabel",
)

# ── 3. tabela de lojas respeita o whitelabel ────────────────────────────
troca(
    r"""  'const q=$("#f_l").value.toLowerCase();',
  'let base;',""",
    r"""  'const q=$("#f_l").value.toLowerCase();',
  'const w=wlSel();',
  'let base;',""",
    "linhasL le o whitelabel",
)
troca(
    r"""  'return base.filter(r=>!q||((r.l.loja||"")+" "+(r.l.uf||"")+" "+(r.l.whitelabel||"")+" "+(r.l.modelo||"")+" "+(r.l.categoria||"")).toLowerCase().indexOf(q)>=0);}',""",
    r"""  'return base.filter(r=>(w===null||r.l.whitelabel_id===w)&&(!q||((r.l.loja||"")+" "+(r.l.uf||"")+" "+(r.l.whitelabel||"")+" "+(r.l.modelo||"")+" "+(r.l.categoria||"")).toLowerCase().indexOf(q)>=0));}',""",
    "linhasL filtra por whitelabel",
)

# ── 4. a lista do extrato passa a obedecer evento E whitelabel ──────────
troca(
    r"""  'const acima=(porL[selL]||[]).filter(function(x){return x.s>LIMIAR;});',""",
    r"""  'const evi2=$("#f_ev").value;const ev2=(evi2===""?null:evs[Number(evi2)]);const w2=wlSel();',
  'const todos=(porL[selL]||[]).filter(function(x){return x.s>LIMIAR;});',
  'const acima=todos.filter(function(x){const v=D.veiculos[x.o];return (!ev2||v.evento===ev2)&&noWl(v,w2);});',
  'const escondidos=todos.length-acima.length;',""",
    "lista do extrato obedece os filtros",
)
# o rodape da lista precisa dizer quando o filtro escondeu algo, senao o
# numero encolhe sem explicacao
troca(
    r"""  ':("<div class=\'dim\'>Nenhum veiculo elegivel passa de "+LIMIAR+"% de aderencia para esta loja. O melhor e "+nf(l.melhor,1)+"%.</div>");',""",
    r"""  ':(todos.length?("<div class=\'dim\'>Os "+todos.length+" veiculo(s) acima de "+LIMIAR+"% desta loja estao fora do filtro atual de evento/whitelabel.</div>"):("<div class=\'dim\'>Nenhum veiculo elegivel passa de "+LIMIAR+"% de aderencia para esta loja. O melhor e "+nf(l.melhor,1)+"%.</div>"));',""",
    "mensagem de lista vazia distingue filtro de ausencia",
)
troca(
    r"""  '"<h2>Veiculos com aderencia acima de "+LIMIAR+"% <span class=\'dim\'>("+acima.length+" de "+nf(l.pares)+" elegiveis)</span></h2>"+listaV;',""",
    r"""  '"<h2>Veiculos com aderencia acima de "+LIMIAR+"% <span class=\'dim\'>("+acima.length+" de "+nf(l.pares)+" elegiveis"+(escondidos?", "+escondidos+" fora do filtro":"")+")</span></h2>"+listaV;',""",
    "titulo do extrato mostra quantos o filtro escondeu",
)

# ── 5. ligacao dos controles ────────────────────────────────────────────
# f_ev vira `pinta` porque agora tambem mexe no extrato; f_wl idem, e ainda
# reconta as opcoes de evento antes.
troca(
    r"""  '$("#f_v").oninput=pintaV;$("#f_l").oninput=pintaL;$("#f_ev").onchange=pintaV;',
  '$("#limpar").onclick=function(){selV=null;selL=null;$("#f_v").value="";$("#f_l").value="";$("#f_ev").value="";pinta();};',
  'pinta();'""",
    r"""  '$("#f_v").oninput=pintaV;$("#f_l").oninput=pintaL;$("#f_ev").onchange=pinta;',
  '$("#f_wl").onchange=function(){pintaFiltros();pinta();};',
  '$("#limpar").onclick=function(){selV=null;selL=null;$("#f_v").value="";$("#f_l").value="";$("#f_ev").value="";$("#f_wl").value="";pintaFiltros();pinta();};',
  'pintaFiltros();pinta();'""",
    "ligacao dos controles",
)

# ── 6. o select no HTML, fora dos paineis ───────────────────────────────
troca(
    r"""  '<div style="margin-bottom:10px"><button id="limpar">limpar selecao</button></div>',""",
    r"""  '<div style="margin-bottom:10px"><select id="f_wl" title="vale para as duas tabelas e para o extrato"></select><button id="limpar">limpar selecao</button> <span class="dim">o whitelabel filtra tudo; o evento filtra os veiculos (inclusive a lista do extrato)</span></div>',""",
    "select de whitelabel no HTML",
)

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
for r in feito:
    print("  ok  " + r)
