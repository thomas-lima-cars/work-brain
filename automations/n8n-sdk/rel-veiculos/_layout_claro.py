# -*- coding: utf-8 -*-
"""Troca a secao de RENDER inteira: layout claro, filtros acima dos cartoes.

Pedido do Thomas (2026-09-10), com a referencia visual de um dashboard
claro: fundo cinza, cartoes brancos, faixa de KPIs com icone, e a barra de
filtros ACIMA de tudo.

Tres mudancas de comportamento, nao so de aparencia:

  1. Os filtros de whitelabel e evento passam a valer para a PAGINA
     INTEIRA -- KPIs inclusive. Antes os KPIs vinham congelados do DADOS.

  2. O que o filtro NAO alcanca esta escrito na tela, nao escondido: o
     perfil de compra da loja (preco, idade, km, modelo e categoria top,
     % de ofertas) e o fator de confianca saem do historico de 6 meses da
     loja INTEIRA, sem recorte por whitelabel ou evento. Como a aderencia
     e calculada contra esse perfil, o score de cada par tambem nao muda
     com o filtro -- o filtro escolhe quais pares aparecem, nao os recalcula.

  3. A busca por texto continua valendo so para a tabela onde ela esta.
     Filtro (dropdown) muda a pagina; busca so encontra linha.

Reescrever inteiro em vez de remendar: a secao entre RENDER:INICIO e
RENDER:FIM depende apenas de DADOS, entao trocar tudo de uma vez e mais
seguro do que vinte substituicoes em cima de string escapada.

    python _layout_claro.py
"""
import io
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-html.js")
s = io.open(P, encoding="utf-8").read()

INI = s.index("/* ==== RENDER:INICIO ====")
FIM = s.index("/* ==== RENDER:FIM ==== */")

NOVO = r"""/* ==== RENDER:INICIO ==== (daqui pra baixo tudo depende so de DADOS,
   entao monta_html_de_dados.js reusa este trecho pra regerar o HTML sem
   rodar o workflow de novo. Mexeu so na tela? roda o script local.) */
const CSS = [
  ':root{--bg:#f4f6f9;--card:#fff;--line:#e3e7ed;--line2:#eef1f5;',
  '--tx:#1b2e4b;--dim:#7987a1;--ac:#0168fa;--gr:#10b759;--or:#f49917;',
  '--rd:#dc3545;--pu:#6f42c1;--tl:#00b8d4}',
  '*{box-sizing:border-box}',
  'body{margin:0;background:var(--bg);color:var(--tx);',
  'font:13px/1.5 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif}',
  '.topo{background:#fff;border-bottom:1px solid var(--line);padding:14px 24px;',
  'display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px}',
  '.topo b{font-size:19px;letter-spacing:-.4px}',
  '.topo .dim{font-size:11.5px}',
  '.pg{max-width:1460px;margin:0 auto;padding:20px 24px 40px}',
  '.tit{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px}',
  '.tit h1{font-size:15px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;',
  'margin:0;border-left:3px solid var(--ac);padding-left:10px}',
  '.tit .via{font-size:11.5px;color:var(--dim)}',
  '.card{background:var(--card);border:1px solid var(--line);border-radius:3px;margin-bottom:20px}',
  '.card-h{padding:12px 18px;border-bottom:1px solid var(--line2);font-size:11.5px;',
  'font-weight:600;text-transform:uppercase;letter-spacing:.6px;',
  'display:flex;align-items:center;justify-content:space-between;gap:10px}',
  '.card-h .n{font-weight:400;color:var(--dim);letter-spacing:0;text-transform:none;font-size:11.5px}',
  '.card-b{padding:16px 18px}',
  /* ---- barra de filtros, acima de tudo ---- */
  '.filtros{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end}',
  '.fg{display:flex;flex-direction:column;gap:4px}',
  '.fg label{font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;color:var(--dim);font-weight:600}',
  'select,input{background:#fff;color:var(--tx);border:1px solid #d5dae1;border-radius:3px;',
  'padding:7px 10px;font-size:12.5px;font-family:inherit;height:34px}',
  'select:focus,input:focus{outline:none;border-color:var(--ac)}',
  'button{background:#fff;color:var(--tx);border:1px solid #d5dae1;border-radius:3px;',
  'padding:7px 14px;font-size:12.5px;font-family:inherit;height:34px;cursor:pointer}',
  'button:hover{border-color:var(--ac);color:var(--ac)}',
  '.nota{margin-top:12px;padding-top:12px;border-top:1px solid var(--line2);',
  'font-size:11.5px;color:var(--dim);line-height:1.6}',
  /* ---- faixa de KPIs ---- */
  '.kpis{display:flex;flex-wrap:wrap;background:#fff;border:1px solid var(--line);',
  'border-radius:3px;margin-bottom:20px}',
  '.kpi{flex:1 1 160px;display:flex;align-items:center;gap:12px;padding:16px 18px;',
  'border-left:1px solid var(--line2)}',
  '.kpi:first-child{border-left:0}',
  '.ic{width:20px;height:20px}',
  '.kpi .ring{width:38px;height:38px;border-radius:50%;border:1px solid currentColor;',
  'display:flex;align-items:center;justify-content:center;flex:0 0 38px}',
  '.kpi .tx{min-width:0}',
  '.kpi .lb{font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;font-weight:600;white-space:nowrap}',
  '.kpi .vl{font-size:21px;font-weight:600;letter-spacing:-.5px;color:var(--tx);line-height:1.2}',
  /* ---- tabelas ---- */
  'table{border-collapse:collapse;width:100%;font-size:12px}',
  'th,td{padding:8px 10px;border-bottom:1px solid var(--line2);text-align:right;white-space:nowrap}',
  'th{background:#fbfcfd;position:sticky;top:0;font-weight:600;color:var(--dim);',
  'font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;z-index:1}',
  'th.tx,td.tx{text-align:left}',
  'tbody tr{cursor:pointer}tbody tr:hover{background:#f7f9fc}',
  'tr.sel{background:#eaf2fe}',
  'tbody tr:last-child td{border-bottom:0}',
  '.wrap{overflow:auto;max-height:62vh}',
  '.vazio{padding:26px 18px;color:var(--dim);text-align:center}',
  /* ---- diversos ---- */
  '.tag{display:inline-block;padding:1px 7px;border-radius:99px;font-size:10px;',
  'background:#eaf2fe;color:var(--ac);white-space:nowrap}',
  '.tag.w{background:#fff3e0;color:#b25e00}',
  '.tag.g{background:#e7f7ee;color:#0a8043}',
  '.dim{color:var(--dim)}',
  '.mono{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px}',
  'code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11.5px;',
  'background:#f1f3f7;padding:1px 5px;border-radius:3px}',
  '.bar{display:inline-block;height:6px;background:var(--ac);border-radius:99px;vertical-align:middle}',
  '.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}',
  '@media(max-width:1200px){.grid{grid-template-columns:1fr}}',
  '.aviso{border-color:#f5c6cb}',
  '.aviso .card-h{color:var(--rd);border-bottom-color:#f5c6cb}',
  '.aviso ul{margin:0;padding-left:18px}.aviso li{margin-bottom:5px}',
  '.ctx{background:#eaf2fe;border:1px solid #bcd8fd;border-radius:3px;',
  'padding:10px 14px;margin-bottom:20px;font-size:12.5px}',
  '.regra p{margin:0 0 8px}.regra p:last-child{margin:0}'
].join('');

const APP = [
  'const $=(s)=>document.querySelector(s);',
  'const nf=(v,d)=>v===null||v===undefined?"\\u2014":Number(v).toLocaleString("pt-BR",{minimumFractionDigits:d||0,maximumFractionDigits:d||0});',
  'const money=(v)=>v===null||v===undefined?"\\u2014":"R$ "+nf(v,0);',
  'const esc=(s)=>String(s===null||s===undefined?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;");',
  '$("#ger").textContent=new Date(D.gerado_em).toLocaleString("pt-BR");',
  /* ---- indexa os pares nas duas direcoes ---- */
  'const P=D.pares,DET=D.det;',
  'const porV={},porL={};',
  'for(let i=0,k=0;i<P.length;i+=3,k++){const vi=P[i],li=P[i+1],s=P[i+2]/10;',
  '(porV[vi]=porV[vi]||[]).push({o:li,s:s,d:DET[k]});',
  '(porL[li]=porL[li]||[]).push({o:vi,s:s,d:DET[k]});}',
  'for(const k in porV)porV[k].sort((a,b)=>b.s-a.s);',
  'for(const k in porL)porL[k].sort((a,b)=>b.s-a.s);',
  /* ---- catalogos dos filtros ---- */
  'const evs=Array.from(new Set(D.veiculos.map(v=>v.evento))).sort();',
  'const evFechado={};D.veiculos.forEach(function(v){if(v.encerrado)evFechado[v.evento]=1;});',
  'const wlNome={};',
  'D.lojas.forEach(function(l){if(l.whitelabel_id!==null&&l.whitelabel_id!==undefined&&!wlNome[l.whitelabel_id])wlNome[l.whitelabel_id]=l.whitelabel;});',
  'D.veiculos.forEach(function(v){const ns=String(v.wl_nomes||"").split(", ");(v.wls||[]).forEach(function(w,i){if(!wlNome[w])wlNome[w]=ns[i]||("#"+w);});});',
  'const wls=Object.keys(wlNome).map(Number).sort(function(a,b){return String(wlNome[a]).localeCompare(String(wlNome[b]));});',
  'function wlSel(){const i=$("#f_wl").value;return i===""?null:wls[Number(i)];}',
  'function evSel(){const i=$("#f_ev").value;return i===""?null:evs[Number(i)];}',
  'function noWl(v,w){return w===null||(v.wls||[]).indexOf(w)>=0;}',
  'function passaV(v,ev,w){return (!ev||v.evento===ev)&&noWl(v,w);}',
  'function passaL(l,w){return w===null||l.whitelabel_id===w;}',
  '$("#f_wl").innerHTML="<option value=\'\'>todos os whitelabels ("+wls.length+")</option>"+wls.map(function(w,i){var nv=D.veiculos.filter(function(v){return (v.wls||[]).indexOf(w)>=0;}).length;var nl=D.lojas.filter(function(l){return l.whitelabel_id===w;}).length;return "<option value=\'"+i+"\'>"+esc(wlNome[w])+" ("+nv+" veic, "+nl+" lojas)</option>";}).join("");',
  /* as opcoes de evento sao recontadas quando o whitelabel muda: dropdown
     que diz 79 com a tabela mostrando 12 e pior que nao ter contagem */
  'function pintaFiltros(){',
  'const w=wlSel();const cur=$("#f_ev").value;var manteve=false;var tot=0;',
  'const opts=evs.map(function(e,i){',
  'const n=D.veiculos.filter(function(v){return v.evento===e&&noWl(v,w);}).length;',
  'tot+=n;if(!n)return "";if(String(i)===cur)manteve=true;',
  'return "<option value=\'"+i+"\'>"+esc(e)+(evFechado[e]?" [encerrado]":"")+" ("+n+")</option>";}).join("");',
  '$("#f_ev").innerHTML="<option value=\'\'>todos os eventos ("+tot+")</option>"+opts;',
  '$("#f_ev").value=manteve?cur:"";}',
  'var selV=null,selL=null;',
  /* ---- KPIs: recalculados a cada troca de filtro ---- */
  'function ic(p){return "<svg class=\'ic\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'>"+p+"</svg>";}',
  'const ICO={',
  'veic:"<rect x=\'2.5\' y=\'8\' width=\'19\' height=\'8\' rx=\'2\'/><path d=\'M6.5 16v2M17.5 16v2M5 8l1.6-3.2A2 2 0 018.4 3.7h7.2a2 2 0 011.8 1.1L19 8\'/>",',
  'loja:"<path d=\'M4.5 9.5h15V20h-15z\'/><path d=\'M4.5 9.5L5.7 4.5h12.6l1.2 5\'/><path d=\'M10 20v-5h4v5\'/>",',
  'par:"<circle cx=\'8.5\' cy=\'12\' r=\'4.5\'/><circle cx=\'15.5\' cy=\'12\' r=\'4.5\'/>",',
  'med:"<path d=\'M3.5 19.5h17\'/><path d=\'M6.5 19.5v-6M11 19.5v-11M15.5 19.5v-8M20 19.5v-4\'/>",',
  'sobra:"<path d=\'M12 3.5l8.5 4-8.5 4-8.5-4z\'/><path d=\'M3.5 7.5v9l8.5 4 8.5-4v-9\'/>",',
  'zero:"<circle cx=\'12\' cy=\'12\' r=\'8.5\'/><path d=\'M9 9l6 6M15 9l-6 6\'/>"};',
  'function kpi(cor,icone,rot,val){return "<div class=\'kpi\'><div class=\'ring\' style=\'color:"+cor+"\'>"+ic(icone)+"</div>"+',
  '"<div class=\'tx\'><div class=\'lb\' style=\'color:"+cor+"\'>"+rot+"</div><div class=\'vl\'>"+val+"</div></div></div>";}',
  'function pintaKpis(){',
  'const ev=evSel(),w=wlSel();',
  'const vIdx=[];D.veiculos.forEach(function(v,i){if(passaV(v,ev,w))vIdx.push(i);});',
  'const naLista={};vIdx.forEach(function(i){naLista[i]=1;});',
  'var nPares=0;const lojasVistas={};const porVeic={};',
  'for(let i=0;i<P.length;i+=3){',
  'if(!naLista[P[i]])continue;',
  'if(!passaL(D.lojas[P[i+1]],w))continue;',
  'nPares++;lojasVistas[P[i+1]]=1;porVeic[P[i]]=(porVeic[P[i]]||0)+1;}',
  'const semPar=vIdx.filter(function(i){return !porVeic[i];}).length;',
  'const sobra=vIdx.filter(function(i){return D.veiculos[i].sobra;}).length;',
  'const media=vIdx.length?Math.round(nPares/vIdx.length):0;',
  '$("#kpis").innerHTML=',
  'kpi("var(--ac)",ICO.veic,"veiculos",nf(vIdx.length))+',
  'kpi("var(--gr)",ICO.loja,"lojas elegiveis",nf(Object.keys(lojasVistas).length))+',
  'kpi("var(--pu)",ICO.par,"correspondencias",nf(nPares))+',
  'kpi("var(--tl)",ICO.med,"media de lojas por veiculo",nf(media))+',
  'kpi("var(--or)",ICO.sobra,"sobra de evento encerrado",nf(sobra))+',
  'kpi(semPar?"var(--rd)":"var(--dim)",ICO.zero,"sem correspondencia",nf(semPar));}',
  /* ---- helpers de celula ---- */
  'function barra(s){return "<span class=\'bar\' style=\'width:"+Math.round(s/2.6)+"px\'></span> "+nf(s,1);}',
  'function celulas(s,conf){if(s===null||s===undefined)return "<td>\\u2014</td><td>\\u2014</td>";const c=conf||1;const bruto=s/c;return "<td>"+nf(bruto,1)+"</td><td>"+barra(s)+"</td>";}',
  'function det(d){if(!d)return "";const p=[];["preco","idade","km","modelo","categoria"].forEach(k=>{if(d[k]!==undefined)p.push(k[0].toUpperCase()+" "+d[k]);});return "<span class=\'dim mono\'>"+p.join(" \\u00b7 ")+"</span>";}',
  /* ---- veiculos ---- */
  'function linhasV(){',
  'const q=$("#f_v").value.toLowerCase();',
  'const ev=evSel(),w=wlSel();',
  'let base;',
  'if(selL!==null){base=(porL[selL]||[]).map(x=>({v:D.veiculos[x.o],i:x.o,s:x.s,d:x.d}));}',
  'else{base=D.veiculos.map((v,i)=>({v:v,i:i,s:v.melhor,d:null}));base.sort((a,b)=>(b.s||0)-(a.s||0));}',
  'return base.filter(r=>passaV(r.v,ev,w)&&(!q||((r.v.marca||"")+" "+(r.v.modelo||"")+" "+(r.v.status_nome||"")).toLowerCase().indexOf(q)>=0));}',
  'function pintaV(){',
  'const rows=linhasV();',
  'const comScore=selL!==null;',
  '$("#cv").textContent=rows.length+" de "+D.veiculos.length;',
  'if(!rows.length){$("#t_v").innerHTML="";$("#v_vazio").innerHTML="<div class=\'vazio\'>Nenhum veiculo no filtro atual.</div>";return;}',
  '$("#v_vazio").innerHTML="";',
  '$("#t_v").innerHTML="<thead><tr><th class=\'tx\'>Veiculo</th><th class=\'tx\'>Categoria</th><th>Ano</th><th>Km</th><th>Valor</th><th class=\'tx\'>UF</th><th class=\'tx\'>Evento</th>"+(comScore?"<th>Aderencia</th><th>Score</th>":"<th>Melhor score</th>")+"<th>Lojas</th></tr></thead><tbody>"+',
  'rows.map(r=>"<tr data-i=\'"+r.i+"\' class=\'"+(r.i===selV?"sel":"")+"\'>"+',
  '"<td class=\'tx\'>"+esc((r.v.marca?r.v.marca+" ":"")+(r.v.modelo||"?"))+" <span class=\'dim mono\'>#"+r.v.vehicle_id+"</span></td>"+',
  '"<td class=\'tx\'>"+esc(r.v.categoria||"\\u2014")+"</td><td>"+(r.v.model_year||"\\u2014")+"</td><td>"+nf(r.v.km)+"</td><td>"+money(r.v.valor)+"</td>"+',
  '"<td class=\'tx\'>"+esc(r.v.uf)+"</td><td class=\'tx\'>"+esc(r.v.evento)+(r.v.sobra?" <span class=\'tag w\'>"+esc(r.v.status_nome)+"</span>":"")+"</td>"+',
  '(comScore?celulas(r.s,D.lojas[selL].confianca):"<td>"+(r.s===null?"\\u2014":barra(r.s))+"</td>")+"<td>"+nf(r.v.candidatos)+"</td></tr>").join("")+"</tbody>";',
  'Array.prototype.forEach.call($("#t_v").querySelectorAll("tbody tr"),function(tr){tr.onclick=function(){const i=Number(tr.getAttribute("data-i"));selV=(selV===i?null:i);selL=null;pinta();};});}',
  /* ---- lojas ---- */
  'function linhasL(){',
  'const q=$("#f_l").value.toLowerCase();',
  'const w=wlSel();',
  'let base;',
  'if(selV!==null){base=(porV[selV]||[]).map(x=>({l:D.lojas[x.o],i:x.o,s:x.s,d:x.d}));}',
  'else{base=D.lojas.map((l,i)=>({l:l,i:i,s:l.melhor,d:null}));base.sort((a,b)=>(b.s||0)-(a.s||0));}',
  'return base.filter(r=>passaL(r.l,w)&&(!q||((r.l.loja||"")+" "+(r.l.uf||"")+" "+(r.l.whitelabel||"")+" "+(r.l.modelo||"")+" "+(r.l.categoria||"")).toLowerCase().indexOf(q)>=0));}',
  'function pintaL(){',
  'const rows=linhasL();',
  'const comScore=selV!==null;',
  '$("#cl").textContent=rows.length+" de "+D.lojas.length;',
  'if(!rows.length){$("#t_l").innerHTML="";$("#l_vazio").innerHTML="<div class=\'vazio\'>Nenhuma loja no filtro atual.</div>";return;}',
  '$("#l_vazio").innerHTML="";',
  '$("#t_l").innerHTML="<thead><tr><th class=\'tx\'>Loja</th><th class=\'tx\'>UF</th><th class=\'tx\'>Whitelabel</th>"+(comScore?"<th>Aderencia</th><th>Score</th>":"<th>Melhor score</th>")+"<th class=\'tx\'>Componentes</th><th>Preco medio</th><th>Idade</th><th>Km medio</th><th class=\'tx\'>Modelo top</th><th class=\'tx\'>Categoria top</th><th>Ofertas 6m</th></tr></thead><tbody>"+',
  'rows.map(r=>"<tr data-i=\'"+r.i+"\' class=\'"+(r.i===selL?"sel":"")+"\'>"+',
  '"<td class=\'tx\'>"+esc(r.l.loja)+" <span class=\'dim mono\'>#"+r.l.loja_id+"</span>"+(r.l.amostra_baixa?" <span class=\'tag w\'>amostra "+r.l.qt_veiculos+"</span>":"")+"</td>"+',
  '"<td class=\'tx\'>"+esc(r.l.uf)+"</td><td class=\'tx\'>"+esc(r.l.whitelabel)+"</td>"+',
  '(comScore?celulas(r.s,r.l.confianca):"<td>"+(r.s===null?"\\u2014":barra(r.s))+"</td>")+"<td class=\'tx\'>"+det(r.d)+"</td>"+',
  '"<td>"+money(r.l.preco_medio)+"</td><td>"+nf(r.l.idade_media,1)+"</td><td>"+nf(r.l.km_medio)+"</td>"+',
  '"<td class=\'tx\'>"+esc(r.l.modelo||"\\u2014")+" <span class=\'dim\'>"+nf(r.l.pct_modelo,1)+"%</span></td>"+',
  '"<td class=\'tx\'>"+esc(r.l.categoria||"\\u2014")+" <span class=\'dim\'>"+nf(r.l.pct_categoria,1)+"%</span></td>"+',
  '"<td>"+nf(r.l.qt_ofertas)+"</td></tr>").join("")+"</tbody>";',
  'Array.prototype.forEach.call($("#t_l").querySelectorAll("tbody tr"),function(tr){tr.onclick=function(){const i=Number(tr.getAttribute("data-i"));selL=(selL===i?null:i);selV=null;pinta();};});}',
  /* ---- contexto da selecao ---- */
  'function ctx(){',
  'if(selV!==null){const v=D.veiculos[selV];',
  '$("#ctx").innerHTML="<b>"+esc((v.marca?v.marca+" ":"")+(v.modelo||"?"))+" "+(v.model_year||"")+"</b> \\u00b7 "+money(v.valor)+" \\u00b7 "+nf(v.km)+" km \\u00b7 "+esc(v.uf)+" \\u00b7 "+esc(v.evento)+"<br><span class=\'dim\'>Lojas elegiveis: mesma UF (<b>"+esc(v.uf)+"</b>) e whitelabel do evento (<b>"+esc(v.wl_nomes||"nenhum")+"</b>) \\u2014 "+nf(v.candidatos)+" loja(s) acima de "+MIN+"%, ordenadas por aderencia.</span>";',
  '$("#ctx").style.display="";return;}',
  'if(selL!==null){const l=D.lojas[selL];',
  '$("#ctx").innerHTML="<b>"+esc(l.loja)+"</b> \\u00b7 "+esc(l.uf)+" \\u00b7 "+esc(l.whitelabel)+" \\u00b7 perfil: "+money(l.preco_medio)+" \\u00b7 "+nf(l.idade_media,1)+" anos \\u00b7 "+nf(l.km_medio)+" km \\u00b7 "+esc(l.modelo||"?")+" ("+nf(l.pct_modelo,1)+"% das ofertas)<br><span class=\'dim\'>Veiculos elegiveis: "+nf(l.pares)+", ordenados por aderencia.</span>";',
  '$("#ctx").style.display="";return;}',
  '$("#ctx").style.display="none";}',
  /* ---- extrato ---- */
  'const LIMIAR=70;',
  'const MIN=(D.parametros&&D.parametros.corresp_min)||0;',
  'function cvDe(m,d){if(!m||d===null||d===undefined)return null;return d/m;}',
  'function leitura(cv){if(cv===null)return "<span class=\'dim\'>sem desvio medido</span>";if(cv<0.25)return "faixa apertada: acertar este numero vale muito";if(cv<0.6)return "faixa media";return "dispersao alta: este indicador quase nao informa";}',
  'function extrato(){',
  'if(selL===null){$("#extrato").innerHTML="";$("#extrato").style.display="none";return;}',
  'const l=D.lojas[selL];',
  'const linhas=[];',
  '[["Preco",l.preco_medio,l.preco_desvio,l.p_preco,money],',
  ' ["Idade",l.idade_media,l.idade_desvio,l.p_idade,function(v){return nf(v,1)+" anos";}],',
  ' ["Km",l.km_medio,l.km_desvio,l.p_km,function(v){return nf(v)+" km";}]].forEach(function(r){',
  'const cv=cvDe(r[1],r[2]);',
  'linhas.push("<tr><td class=\'tx\'>"+r[0]+"</td><td>"+(r[1]===null?"\\u2014":r[4](r[1]))+"</td><td>"+(r[2]===null||r[2]===undefined?"\\u2014":r[4](r[2]))+"</td><td>"+(cv===null?"\\u2014":nf(cv,2))+"</td><td>"+nf(r[3],3)+"</td><td class=\'tx\'>"+leitura(cv)+"</td></tr>");});',
  'linhas.push("<tr><td class=\'tx\'>Modelo</td><td class=\'tx\' colspan=\'3\'>"+esc(l.modelo||"\\u2014")+"</td><td>"+nf(l.pct_modelo/100,3)+"</td><td class=\'tx\'>"+nf(l.pct_modelo,1)+"% das ofertas caem neste modelo</td></tr>");',
  'linhas.push("<tr><td class=\'tx\'>Categoria</td><td class=\'tx\' colspan=\'3\'>"+esc(l.categoria||"\\u2014")+"</td><td>"+nf(l.pct_categoria/100,3)+"</td><td class=\'tx\'>"+nf(l.pct_categoria,1)+"% das ofertas caem nesta categoria</td></tr>");',
  'const ev2=evSel(),w2=wlSel();',
  'const todos=(porL[selL]||[]).filter(function(x){return x.s>LIMIAR;});',
  'const acima=todos.filter(function(x){return passaV(D.veiculos[x.o],ev2,w2);});',
  'const escondidos=todos.length-acima.length;',
  'const listaV=acima.length?("<div class=\'wrap\' style=\'max-height:40vh\'><table><thead><tr><th>Aderencia</th><th>Score</th><th class=\'tx\'>Veiculo</th><th class=\'tx\'>Categoria</th><th>Ano</th><th>Km</th><th>Valor</th><th class=\'tx\'>Evento</th><th class=\'tx\'>Componentes</th></tr></thead><tbody>"+acima.map(function(x){const v=D.veiculos[x.o];return "<tr>"+celulas(x.s,l.confianca)+"<td class=\'tx\'>"+esc((v.marca?v.marca+" ":"")+(v.modelo||"?"))+" <span class=\'dim mono\'>#"+v.vehicle_id+"</span></td><td class=\'tx\'>"+esc(v.categoria||"\\u2014")+"</td><td>"+(v.model_year||"\\u2014")+"</td><td>"+nf(v.km)+"</td><td>"+money(v.valor)+"</td><td class=\'tx\'>"+esc(v.evento)+"</td><td class=\'tx\'>"+det(x.d)+"</td></tr>";}).join("")+"</tbody></table></div>")',
  ':(todos.length?("<div class=\'vazio\'>Os "+todos.length+" veiculo(s) acima de "+LIMIAR+"% desta loja estao fora do filtro atual.</div>"):("<div class=\'vazio\'>Nenhum veiculo passa de "+LIMIAR+"% de aderencia para esta loja. O melhor e "+nf(l.melhor,1)+"%.</div>"));',
  '$("#extrato").innerHTML="<div class=\'card\'><div class=\'card-h\'>Extrato da loja \\u2014 "+esc(l.loja)+" <span class=\'n mono\'>#"+l.loja_id+"</span></div><div class=\'card-b\'>"+',
  '"<div style=\'margin-bottom:12px\'>"+esc(l.uf)+" &middot; "+esc(l.whitelabel)+" &middot; <b>"+nf(l.qt_ofertas)+"</b> ofertas em <b>"+nf(l.qt_veiculos)+"</b> veiculos nos ultimos 6 meses"+(l.amostra_baixa?" <span class=\'tag w\'>amostra baixa</span>":"")+" &middot; fator de confianca <b>"+nf(l.confianca,2)+"</b> &middot; elegivel para <b>"+nf(l.pares)+"</b> veiculo(s)</div>"+',
  '"<table><thead><tr><th class=\'tx\'>Indicador</th><th>Referencia</th><th>Desvio</th><th>CV</th><th>Peso</th><th class=\'tx\'>Leitura</th></tr></thead><tbody>"+linhas.join("")+"</tbody></table>"+',
  '"<div class=\'dim\' style=\'margin-top:10px;font-size:11.5px\'>O <b>peso</b> sai de 1/(1 + desvio/media) nos numericos e do % de ofertas em modelo e categoria. CV baixo = loja previsivel = indicador pesa mais. Estes numeros vem do historico de 6 meses da loja inteira e <b>nao mudam</b> com o filtro.</div></div></div>"+',
  '"<div class=\'card\'><div class=\'card-h\'>Veiculos com aderencia acima de "+LIMIAR+"% <span class=\'n\'>"+acima.length+" de "+nf(l.pares)+" elegiveis"+(escondidos?", "+escondidos+" fora do filtro":"")+"</span></div>"+listaV+"</div>";',
  '$("#extrato").style.display="";}',
  /* ---- avisos ---- */
  'const av=[];D.falhas.forEach(f=>av.push("<li>"+esc(f)+"</li>"));',
  'D.diagnostico.filter(d=>d.veredito!=="ok").forEach(p=>av.push("<li><code>"+p.queryName+"</code>: "+esc(p.veredito)+(p.erro?" \\u2014 <span class=\'mono\'>"+esc(p.erro)+"</span>":"")+"</li>"));',
  'if(av.length){$("#alerta").innerHTML="<div class=\'card aviso\'><div class=\'card-h\'>"+av.length+" ponto(s) de atencao</div><div class=\'card-b\'><ul>"+av.join("")+"</ul></div></div>";}',
  /* ---- orquestracao ---- */
  'function pinta(){pintaKpis();ctx();pintaV();pintaL();extrato();}',
  '$("#f_v").oninput=pintaV;$("#f_l").oninput=pintaL;',
  '$("#f_ev").onchange=pinta;',
  '$("#f_wl").onchange=function(){pintaFiltros();pinta();};',
  '$("#limpar").onclick=function(){selV=null;selL=null;$("#f_v").value="";$("#f_l").value="";$("#f_ev").value="";$("#f_wl").value="";pintaFiltros();pinta();};',
  'pintaFiltros();pinta();'
].join('\n');

const MIN_TX = (DADOS.parametros && DADOS.parametros.corresp_min) || 0;
const CORTADOS = (DADOS.parametros && DADOS.parametros.pares_descartados) || 0;

const html = [
  '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1">',
  '<title>Veiculos x lojas - aderencia</title>',
  '<style>' + CSS + '</style></head><body>',
  '<div class="topo"><b>Veiculos em evento &times; lojas compradoras</b>',
  '<span class="dim">gerado em <span id="ger"></span></span></div>',
  '<div class="pg">',
  '<div class="tit"><h1>Aderencia por veiculo</h1>',
  '<span class="via">eventos que encerram entre <b>' + (META.janela_ini || '?') + '</b> e <b>' + (META.janela_fim || '?') + '</b> (hora de Brasilia) &middot; perfil de compra desde ' + (META.data_ini || '?') + '</span></div>',
  /* ---- FILTROS, acima dos cartoes ---- */
  '<div class="card"><div class="card-h">Filtros</div><div class="card-b">',
  '<div class="filtros">',
  '<div class="fg"><label for="f_wl">Whitelabel</label><select id="f_wl"></select></div>',
  '<div class="fg"><label for="f_ev">Evento</label><select id="f_ev"></select></div>',
  '<div class="fg"><label for="f_v">Buscar veiculo</label><input id="f_v" placeholder="marca, modelo ou status" size="30"></div>',
  '<div class="fg"><label for="f_l">Buscar loja</label><input id="f_l" placeholder="loja, UF, whitelabel, modelo ou categoria" size="34"></div>',
  '<div class="fg"><label>&nbsp;</label><button id="limpar">limpar tudo</button></div>',
  '</div>',
  '<div class="nota"><b>Whitelabel</b> e <b>evento</b> valem para a pagina inteira: KPIs, as duas tabelas e o extrato. As duas <b>buscas</b> so filtram a tabela em que estao.<br>',
  'O filtro <b>nao</b> alcanca o perfil de compra da loja (preco medio, idade, km, modelo e categoria top, % de ofertas) nem o fator de confianca: esses vem do historico de <b>6 meses da loja inteira</b>, sem recorte por whitelabel ou evento. Como a aderencia e calculada contra esse perfil, o <b>score de cada par tambem nao muda</b> com o filtro &mdash; o filtro escolhe quais pares aparecem, nao os recalcula.' +
  (MIN_TX ? '<br>Correspondencia minima de <b>' + MIN_TX + '%</b>: par abaixo disso nao existe em lugar nenhum do relatorio' + (CORTADOS ? ' (' + CORTADOS.toLocaleString('pt-BR') + ' descartados nesta coleta)' : '') + '.' : '') +
  '</div>',
  '</div></div>',
  '<div class="kpis" id="kpis"></div>',
  '<div id="alerta"></div>',
  '<div id="ctx" class="ctx" style="display:none"></div>',
  '<div class="grid">',
  '<div class="card"><div class="card-h">Veiculos <span class="n" id="cv"></span></div>',
  '<div class="wrap"><table id="t_v"></table></div><div id="v_vazio"></div></div>',
  '<div class="card"><div class="card-h">Lojas <span class="n" id="cl"></span></div>',
  '<div class="wrap"><table id="t_l"></table></div><div id="l_vazio"></div></div>',
  '</div>',
  '<div id="extrato" style="display:none"></div>',
  '<div class="card regra"><div class="card-h">Como o numero e feito</div><div class="card-b">',
  '<p><b>O que entra na base.</b> Uma linha por <b>veiculo</b>, com o status da <b>ultima negociacao</b> dele na janela. A ordem importa: primeiro se acha a ultima negociacao, <b>depois</b> se olha o status &mdash; o contrario faria um carro vendido hoje reaparecer como disponivel pela negociacao de ontem. Entram <code>1 Ativo</code> e a sobra de evento encerrado (<code>11 Sem Ofertas</code>, <code>14 Vendedor Rejeitou</code>, <code>15 Comprador Rejeitou</code>, <code>18 Venda Cancelada</code>). Ficam fora <code>9</code> e <code>13</code>, que tem oferta viva na mesa, a venda (<code>2</code>, <code>3</code>, <code>7</code>) e o suspenso ou cancelado (<code>8</code>, <code>10</code>).</p>',
  '<p><b>Elegibilidade.</b> Um par (veiculo, loja) <b>so existe</b> se a loja estiver na <b>mesma UF</b> do veiculo <b>e</b> pertencer a um dos <b>whitelabels que o evento alveja</b>. Fora disso nao ha aderencia baixa: o par simplesmente nao existe, e por isso o ranking de cada veiculo e curto.</p>',
  '<p class="dim">Score = &Sigma;(peso &times; aderencia) / &Sigma;(peso). Nos numericos, aderencia = <code>1/(1 + |valor &minus; media|/desvio)</code> e peso = <code>1/(1 + desvio/media)</code>: loja de faixa apertada e previsivel, entao acertar o numero dela vale muito; loja que compra de tudo tem peso baixo porque o indicador nao informa. Modelo e categoria pesam pelo <b>% de ofertas</b> da loja naquele item. O score e multiplicado por <code>min(1, veiculos/' + CONFIANCA_MIN + ')</code> para loja de historico minusculo nao liderar por sorte &mdash; <b>essa parte foi adicao minha, nao estava no pedido</b>. Volume de ofertas nao entra no score.</p>',
  '</div></div>',
  '</div>',
  '<script>const D=' + DADOS_JSON + ';</' + 'script>',
  '<script>' + APP + '</' + 'script>',
  '</body></html>'
].join('\n');

"""

s = s[:INI] + NOVO + s[FIM:]
io.open(P, "w", encoding="utf-8").write(s)
print("secao de render trocada")
