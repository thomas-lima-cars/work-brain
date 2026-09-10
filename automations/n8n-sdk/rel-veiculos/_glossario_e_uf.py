# -*- coding: utf-8 -*-
"""Glossario em pagina propria, filtro de UF, e a tabela de veiculos em dois niveis.

Pedidos do Thomas em 2026-09-10:

  1. Botao de informacao no cabecalho levando a OUTRA PAGINA com "o que entra
     na base", elegibilidade e a inteligencia de calculo, organizado como
     glossario. Sai tudo isso da tela inicial.

     Nota de desenho: "outra pagina" virou uma segunda TELA dentro do mesmo
     arquivo, com endereco proprio (#glossario). O relatorio circula como
     anexo; um segundo arquivo solto se perderia do primeiro no primeiro
     encaminhamento. O botao alterna, o hash torna linkavel, e o botao
     voltar do navegador funciona.

  2. Filtro de UF valendo para a pagina inteira. Como o par so existe entre
     mesma UF, filtrar UF recorta os dois lados de uma vez.

     Os tres dropdowns agora se recontam entre si (filtro facetado): cada um
     mostra a contagem que sobraria considerando os OUTROS dois. Sem isso o
     dropdown promete 79 e a tabela entrega 12.

  3. Saem preco medio, modelo top e categoria da tabela de lojas.

  4. "Ofertas 6m" passa a contar VEICULOS que tiveram oferta, nao ofertas.
     Nao precisa de SQL novo: `qt_veiculos` ja e isso -- vem do q_perfil,
     que agrupa por (loja, veiculo) antes de contar. O que estava na coluna
     era `qt_ofertas`, que conta cada lance.

  5. A tabela de veiculos passa a ter dois niveis por carro: UF e evento em
     cima, o resto embaixo. Duas <tr> irmas com o mesmo data-i, entao clicar
     em qualquer uma das duas seleciona o veiculo.

    python _glossario_e_uf.py
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
  '.topo{background:#fff;border-bottom:1px solid var(--line);padding:12px 24px;',
  'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}',
  '.topo b{font-size:19px;letter-spacing:-.4px}',
  '.topo .dir{display:flex;align-items:center;gap:14px}',
  '.topo .dim{font-size:11.5px}',
  '#btn_info{display:flex;align-items:center;gap:6px;font-weight:600}',
  '#btn_info svg{width:15px;height:15px}',
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
  '.kpis{display:grid;grid-template-columns:repeat(6,1fr);background:#fff;',
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
  '.ic{width:20px;height:20px}',
  '.kpi .ring{width:38px;height:38px;border-radius:50%;border:1px solid currentColor;',
  'display:flex;align-items:center;justify-content:center;flex:0 0 38px}',
  '.kpi .tx{min-width:0}',
  '.kpi .lb{font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;font-weight:600;',
  'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
  '.kpi .vl{font-size:21px;font-weight:600;letter-spacing:-.5px;color:var(--tx);',
  'line-height:1.2;white-space:nowrap}',
  'table{border-collapse:collapse;width:100%;font-size:12px}',
  'th,td{padding:8px 10px;border-bottom:1px solid var(--line2);text-align:right;white-space:nowrap}',
  'th{background:#fbfcfd;position:sticky;top:0;font-weight:600;color:var(--dim);',
  'font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;z-index:1}',
  'th.tx,td.tx{text-align:left}',
  'tbody tr{cursor:pointer}tbody tr:hover{background:#f7f9fc}',
  'tr.sel,tr.sel+tr.dado{background:#eaf2fe}',
  '.wrap{overflow:auto;max-height:62vh}',
  '.vazio{padding:26px 18px;color:var(--dim);text-align:center}',
  /* ---- dois niveis por veiculo: contexto em cima, dados embaixo ---- */
  'tr.ctxr td{border-bottom:0;padding:9px 10px 1px;font-size:11px;color:var(--dim)}',
  'tr.ctxr:hover,tr.ctxr:hover+tr.dado{background:#f7f9fc}',
  'tr.dado td{padding-top:2px;padding-bottom:9px}',
  'tr.dado{border-bottom:1px solid var(--line2)}',
  'tr.ctxr .uf{color:var(--tx);font-weight:600;letter-spacing:.3px}',
  '.tag{display:inline-block;padding:1px 7px;border-radius:99px;font-size:10px;',
  'background:#eaf2fe;color:var(--ac);white-space:nowrap}',
  '.tag.w{background:#fff3e0;color:#b25e00}',
  '.dim{color:var(--dim)}',
  '.mono{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px}',
  'code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11.5px;',
  'background:#f1f3f7;padding:1px 5px;border-radius:3px}',
  '.bar{display:inline-block;height:6px;background:var(--ac);border-radius:99px;vertical-align:middle}',
  '.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}',
  /* sem isto o 1fr nao vale: item de grade nao encolhe abaixo do conteudo,
     a tabela larga empurra a coluna vizinha e a PAGINA ganha rolagem
     horizontal. Com min-width:0 quem rola e a tabela, dentro do cartao. */
  '.grid>*{min-width:0}',
  '@media(max-width:1200px){.grid{grid-template-columns:1fr}}',
  'td.nm{max-width:250px;overflow:hidden;text-overflow:ellipsis}',
  '.aviso{border-color:#f5c6cb}',
  '.aviso .card-h{color:var(--rd);border-bottom-color:#f5c6cb}',
  '.aviso ul{margin:0;padding-left:18px}.aviso li{margin-bottom:5px}',
  '.ctx{background:#eaf2fe;border:1px solid #bcd8fd;border-radius:3px;',
  'padding:10px 14px;margin-bottom:20px;font-size:12.5px}',
  /* ---- glossario ---- */
  '.gl{max-width:900px}',
  '.gl h2{font-size:13px;text-transform:uppercase;letter-spacing:.6px;',
  'margin:0 0 4px;color:var(--ac)}',
  '.gl .sub{color:var(--dim);font-size:12px;margin:0 0 16px}',
  '.gl dl{margin:0}',
  '.gl dt{font-weight:600;margin-top:16px;font-size:13px}',
  '.gl dt:first-child{margin-top:0}',
  '.gl dd{margin:3px 0 0;color:#3b4b63;line-height:1.65}',
  '.gl dd+dd{margin-top:6px}',
  '.gl .ex{color:var(--dim);font-size:12px}',
  '.gl table{margin-top:8px;font-size:12px;border:1px solid var(--line2)}',
  '.gl td,.gl th{white-space:normal}',
  '.gl .st-in{color:var(--gr);font-weight:600}',
  '.gl .st-out{color:var(--dim)}'
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
  'const ufs=Array.from(new Set(D.veiculos.map(v=>v.uf).concat(D.lojas.map(l=>l.uf)))).sort();',
  'const evFechado={};D.veiculos.forEach(function(v){if(v.encerrado)evFechado[v.evento]=1;});',
  'const wlNome={};',
  'D.lojas.forEach(function(l){if(l.whitelabel_id!==null&&l.whitelabel_id!==undefined&&!wlNome[l.whitelabel_id])wlNome[l.whitelabel_id]=l.whitelabel;});',
  'D.veiculos.forEach(function(v){const ns=String(v.wl_nomes||"").split(", ");(v.wls||[]).forEach(function(w,i){if(!wlNome[w])wlNome[w]=ns[i]||("#"+w);});});',
  'const wls=Object.keys(wlNome).map(Number).sort(function(a,b){return String(wlNome[a]).localeCompare(String(wlNome[b]));});',
  'function wlSel(){const i=$("#f_wl").value;return i===""?null:wls[Number(i)];}',
  'function evSel(){const i=$("#f_ev").value;return i===""?null:evs[Number(i)];}',
  'function ufSel(){const i=$("#f_uf").value;return i===""?null:ufs[Number(i)];}',
  'function noWl(v,w){return w===null||(v.wls||[]).indexOf(w)>=0;}',
  'function passaV(v,ev,w,uf){return (!ev||v.evento===ev)&&noWl(v,w)&&(uf===null||v.uf===uf);}',
  'function passaL(l,w,uf){return (w===null||l.whitelabel_id===w)&&(uf===null||l.uf===uf);}',
  /* Filtro facetado: cada dropdown se reconta considerando os OUTROS dois.
     Sem isso o dropdown promete 79 e a tabela entrega 12. A selecao e
     preservada quando continua existindo. */
  'function opcoes(alvo,itens,rotulo,conta,cur){',
  'var manteve=false;var tot=0;',
  'const opts=itens.map(function(it,i){',
  'const n=conta(it);tot+=n;if(!n)return "";',
  'if(String(i)===cur)manteve=true;',
  'return "<option value=\'"+i+"\'>"+rotulo(it)+" ("+n+")</option>";}).join("");',
  '$(alvo).innerHTML="<option value=\'\'>"+(alvo==="#f_wl"?"todos os whitelabels":alvo==="#f_uf"?"todas as UFs":"todos os eventos")+" ("+tot+")</option>"+opts;',
  '$(alvo).value=manteve?cur:"";}',
  'function pintaFiltros(){',
  'const w=wlSel(),ev=evSel(),uf=ufSel();',
  'opcoes("#f_wl",wls,function(x){return esc(wlNome[x]);},',
  'function(x){return D.veiculos.filter(function(v){return passaV(v,ev,x,uf);}).length;},$("#f_wl").value);',
  'opcoes("#f_uf",ufs,function(x){return esc(x);},',
  'function(x){return D.veiculos.filter(function(v){return passaV(v,ev,w,x);}).length;},$("#f_uf").value);',
  'opcoes("#f_ev",evs,function(x){return esc(x)+(evFechado[x]?" [encerrado]":"");},',
  'function(x){return D.veiculos.filter(function(v){return passaV(v,x,w,uf);}).length;},$("#f_ev").value);}',
  'var selV=null,selL=null;',
  /* ---- KPIs: recalculados a cada troca de filtro ---- */
  'function ic(p){return "<svg class=\'ic\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'>"+p+"</svg>";}',
  'const ICO={',
  'veic:"<rect x=\'2.5\' y=\'8\' width=\'19\' height=\'8\' rx=\'2\'/><path d=\'M6.5 16v2M17.5 16v2M5 8l1.6-3.2A2 2 0 018.4 3.7h7.2a2 2 0 011.8 1.1L19 8\'/>",',
  'loja:"<path d=\'M4.5 9.5h15V20h-15z\'/><path d=\'M4.5 9.5L5.7 4.5h12.6l1.2 5\'/><path d=\'M10 20v-5h4v5\'/>",',
  'par:"<circle cx=\'8.5\' cy=\'12\' r=\'4.5\'/><circle cx=\'15.5\' cy=\'12\' r=\'4.5\'/>",',
  'med:"<path d=\'M3.5 19.5h17\'/><path d=\'M6.5 19.5v-6M11 19.5v-11M15.5 19.5v-8M20 19.5v-4\'/>",',
  'sobra:"<path d=\'M12 3.5l8.5 4-8.5 4-8.5-4z\'/><path d=\'M3.5 7.5v9l8.5 4 8.5-4v-9\'/>",',
  'zero:"<circle cx=\'12\' cy=\'12\' r=\'8.5\'/><path d=\'M9 9l6 6M15 9l-6 6\'/>",',
  'info:"<circle cx=\'12\' cy=\'12\' r=\'9\'/><path d=\'M12 11v5M12 7.6v.6\'/>"};',
  'function kpi(cor,icone,rot,val){return "<div class=\'kpi\'><div class=\'ring\' style=\'color:"+cor+"\'>"+ic(icone)+"</div>"+',
  '"<div class=\'tx\'><div class=\'lb\' style=\'color:"+cor+"\'>"+rot+"</div><div class=\'vl\'>"+val+"</div></div></div>";}',
  'function pintaKpis(){',
  'const ev=evSel(),w=wlSel(),uf=ufSel();',
  'const vIdx=[];D.veiculos.forEach(function(v,i){if(passaV(v,ev,w,uf))vIdx.push(i);});',
  'const naLista={};vIdx.forEach(function(i){naLista[i]=1;});',
  'var nPares=0;const lojasVistas={};const porVeic={};',
  'for(let i=0;i<P.length;i+=3){',
  'if(!naLista[P[i]])continue;',
  'if(!passaL(D.lojas[P[i+1]],w,uf))continue;',
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
  /* ---- veiculos: dois niveis por carro ---- */
  'function linhasV(){',
  'const q=$("#f_v").value.toLowerCase();',
  'const ev=evSel(),w=wlSel(),uf=ufSel();',
  'let base;',
  'if(selL!==null){base=(porL[selL]||[]).map(x=>({v:D.veiculos[x.o],i:x.o,s:x.s,d:x.d}));}',
  'else{base=D.veiculos.map((v,i)=>({v:v,i:i,s:v.melhor,d:null}));base.sort((a,b)=>(b.s||0)-(a.s||0));}',
  'return base.filter(r=>passaV(r.v,ev,w,uf)&&(!q||((r.v.marca||"")+" "+(r.v.modelo||"")+" "+(r.v.status_nome||"")).toLowerCase().indexOf(q)>=0));}',
  'function pintaV(){',
  'const rows=linhasV();',
  'const comScore=selL!==null;',
  'const nCols=comScore?7:6;',
  '$("#cv").textContent=rows.length+" de "+D.veiculos.length;',
  'if(!rows.length){$("#t_v").innerHTML="";$("#v_vazio").innerHTML="<div class=\'vazio\'>Nenhum veiculo no filtro atual.</div>";return;}',
  '$("#v_vazio").innerHTML="";',
  '$("#t_v").innerHTML="<thead><tr><th class=\'tx\'>Veiculo</th><th>Ano</th><th>Km</th><th>Valor</th>"+(comScore?"<th>Aderencia</th><th>Score</th>":"<th>Melhor score</th>")+"<th>Lojas</th></tr></thead><tbody>"+',
  'rows.map(function(r){',
  'const sel=(r.i===selV?" sel":"");',
  /* nivel 1: UF e evento */
  'return "<tr data-i=\'"+r.i+"\' class=\'ctxr"+sel+"\'><td class=\'tx\' colspan=\'"+nCols+"\'>"+',
  '"<span class=\'uf\'>"+esc(r.v.uf)+"</span> \\u00b7 "+esc(r.v.evento)+',
  '(r.v.sobra?" <span class=\'tag w\'>"+esc(r.v.status_nome)+"</span>":"")+"</td></tr>"+',
  /* nivel 2: o veiculo em si */
  '"<tr data-i=\'"+r.i+"\' class=\'dado"+sel+"\'>"+',
  '"<td class=\'tx nm\' title=\'"+esc((r.v.marca?r.v.marca+" ":"")+(r.v.modelo||"?"))+"\'>"+esc((r.v.marca?r.v.marca+" ":"")+(r.v.modelo||"?"))+" <span class=\'dim mono\'>#"+r.v.vehicle_id+"</span></td>"+',
  '"<td>"+(r.v.model_year||"\\u2014")+"</td><td>"+nf(r.v.km)+"</td><td>"+money(r.v.valor)+"</td>"+',
  '(comScore?celulas(r.s,D.lojas[selL].confianca):"<td>"+(r.s===null?"\\u2014":barra(r.s))+"</td>")+',
  '"<td>"+nf(r.v.candidatos)+"</td></tr>";}).join("")+"</tbody>";',
  'Array.prototype.forEach.call($("#t_v").querySelectorAll("tbody tr"),function(tr){tr.onclick=function(){const i=Number(tr.getAttribute("data-i"));selV=(selV===i?null:i);selL=null;pinta();};});}',
  /* ---- lojas ---- */
  'function linhasL(){',
  'const q=$("#f_l").value.toLowerCase();',
  'const w=wlSel(),uf=ufSel();',
  'let base;',
  'if(selV!==null){base=(porV[selV]||[]).map(x=>({l:D.lojas[x.o],i:x.o,s:x.s,d:x.d}));}',
  'else{base=D.lojas.map((l,i)=>({l:l,i:i,s:l.melhor,d:null}));base.sort((a,b)=>(b.s||0)-(a.s||0));}',
  'return base.filter(r=>passaL(r.l,w,uf)&&(!q||((r.l.loja||"")+" "+(r.l.uf||"")+" "+(r.l.whitelabel||"")).toLowerCase().indexOf(q)>=0));}',
  'function pintaL(){',
  'const rows=linhasL();',
  'const comScore=selV!==null;',
  '$("#cl").textContent=rows.length+" de "+D.lojas.length;',
  'if(!rows.length){$("#t_l").innerHTML="";$("#l_vazio").innerHTML="<div class=\'vazio\'>Nenhuma loja no filtro atual.</div>";return;}',
  '$("#l_vazio").innerHTML="";',
  '$("#t_l").innerHTML="<thead><tr><th class=\'tx\'>Loja</th><th class=\'tx\'>UF</th>"+(comScore?"<th>Aderencia</th><th>Score</th><th class=\'tx\'>Componentes</th>":"<th>Melhor score</th>")+"<th>Veiculos ofertados 6m</th></tr></thead><tbody>"+',
  'rows.map(r=>"<tr data-i=\'"+r.i+"\' class=\'"+(r.i===selL?"sel":"")+"\'>"+',
  '"<td class=\'tx nm\' title=\'"+esc(r.l.loja)+"\'>"+esc(r.l.loja)+" <span class=\'dim mono\'>#"+r.l.loja_id+"</span>"+(r.l.amostra_baixa?" <span class=\'tag w\'>amostra baixa</span>":"")+"</td>"+',
  '"<td class=\'tx\'>"+esc(r.l.uf)+"</td>"+',
  '(comScore?celulas(r.s,r.l.confianca)+"<td class=\'tx\'>"+det(r.d)+"</td>":"<td>"+(r.s===null?"\\u2014":barra(r.s))+"</td>")+',
  '"<td>"+nf(r.l.qt_veiculos)+"</td></tr>").join("")+"</tbody>";',
  'Array.prototype.forEach.call($("#t_l").querySelectorAll("tbody tr"),function(tr){tr.onclick=function(){const i=Number(tr.getAttribute("data-i"));selL=(selL===i?null:i);selV=null;pinta();};});}',
  /* ---- contexto da selecao ---- */
  'function ctx(){',
  'if(selV!==null){const v=D.veiculos[selV];',
  '$("#ctx").innerHTML="<b>"+esc((v.marca?v.marca+" ":"")+(v.modelo||"?"))+" "+(v.model_year||"")+"</b> \\u00b7 "+money(v.valor)+" \\u00b7 "+nf(v.km)+" km \\u00b7 "+esc(v.categoria||"?")+" \\u00b7 "+esc(v.uf)+" \\u00b7 "+esc(v.evento)+"<br><span class=\'dim\'>Lojas elegiveis: mesma UF (<b>"+esc(v.uf)+"</b>) e whitelabel do evento (<b>"+esc(v.wl_nomes||"nenhum")+"</b>) \\u2014 "+nf(v.candidatos)+" loja(s) acima de "+MIN+"%, ordenadas por aderencia.</span>";',
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
  'const ev2=evSel(),w2=wlSel(),uf2=ufSel();',
  'const todos=(porL[selL]||[]).filter(function(x){return x.s>LIMIAR;});',
  'const acima=todos.filter(function(x){return passaV(D.veiculos[x.o],ev2,w2,uf2);});',
  'const escondidos=todos.length-acima.length;',
  'const listaV=acima.length?("<div class=\'wrap\' style=\'max-height:40vh\'><table><thead><tr><th>Aderencia</th><th>Score</th><th class=\'tx\'>Veiculo</th><th class=\'tx\'>Categoria</th><th>Ano</th><th>Km</th><th>Valor</th><th class=\'tx\'>Evento</th><th class=\'tx\'>Componentes</th></tr></thead><tbody>"+acima.map(function(x){const v=D.veiculos[x.o];return "<tr>"+celulas(x.s,l.confianca)+"<td class=\'tx\'>"+esc((v.marca?v.marca+" ":"")+(v.modelo||"?"))+" <span class=\'dim mono\'>#"+v.vehicle_id+"</span></td><td class=\'tx\'>"+esc(v.categoria||"\\u2014")+"</td><td>"+(v.model_year||"\\u2014")+"</td><td>"+nf(v.km)+"</td><td>"+money(v.valor)+"</td><td class=\'tx\'>"+esc(v.evento)+"</td><td class=\'tx\'>"+det(x.d)+"</td></tr>";}).join("")+"</tbody></table></div>")',
  ':(todos.length?("<div class=\'vazio\'>Os "+todos.length+" veiculo(s) acima de "+LIMIAR+"% desta loja estao fora do filtro atual.</div>"):("<div class=\'vazio\'>Nenhum veiculo passa de "+LIMIAR+"% de aderencia para esta loja. O melhor e "+nf(l.melhor,1)+"%.</div>"));',
  '$("#extrato").innerHTML="<div class=\'card\'><div class=\'card-h\'>Extrato da loja \\u2014 "+esc(l.loja)+" <span class=\'n mono\'>#"+l.loja_id+"</span></div><div class=\'card-b\'>"+',
  '"<div style=\'margin-bottom:12px\'>"+esc(l.uf)+" &middot; "+esc(l.whitelabel)+" &middot; <b>"+nf(l.qt_veiculos)+"</b> veiculos ofertados em <b>"+nf(l.qt_ofertas)+"</b> lances nos ultimos 6 meses"+(l.amostra_baixa?" <span class=\'tag w\'>amostra baixa</span>":"")+" &middot; fator de confianca <b>"+nf(l.confianca,2)+"</b> &middot; elegivel para <b>"+nf(l.pares)+"</b> veiculo(s)</div>"+',
  '"<table><thead><tr><th class=\'tx\'>Indicador</th><th>Referencia</th><th>Desvio</th><th>CV</th><th>Peso</th><th class=\'tx\'>Leitura</th></tr></thead><tbody>"+linhas.join("")+"</tbody></table>"+',
  '"<div class=\'dim\' style=\'margin-top:10px;font-size:11.5px\'>Estes numeros vem do historico de 6 meses da loja inteira e <b>nao mudam</b> com o filtro. Ver o glossario para como o peso e formado.</div></div></div>"+',
  '"<div class=\'card\'><div class=\'card-h\'>Veiculos com aderencia acima de "+LIMIAR+"% <span class=\'n\'>"+acima.length+" de "+nf(l.pares)+" elegiveis"+(escondidos?", "+escondidos+" fora do filtro":"")+"</span></div>"+listaV+"</div>";',
  '$("#extrato").style.display="";}',
  /* ---- avisos ---- */
  'const av=[];D.falhas.forEach(f=>av.push("<li>"+esc(f)+"</li>"));',
  'D.diagnostico.filter(d=>d.veredito!=="ok").forEach(p=>av.push("<li><code>"+p.queryName+"</code>: "+esc(p.veredito)+(p.erro?" \\u2014 <span class=\'mono\'>"+esc(p.erro)+"</span>":"")+"</li>"));',
  'if(av.length){$("#alerta").innerHTML="<div class=\'card aviso\'><div class=\'card-h\'>"+av.length+" ponto(s) de atencao</div><div class=\'card-b\'><ul>"+av.join("")+"</ul></div></div>";}',
  /* ---- as duas telas ---- */
  '$("#btn_info").innerHTML=ic(ICO.info)+"<span id=\'btn_tx\'>glossario</span>";',
  'var vendoGloss=false;',
  'function mostra(g){vendoGloss=g;',
  '$("#pg_rel").style.display=g?"none":"";',
  '$("#pg_gloss").style.display=g?"":"none";',
  '$("#btn_tx").textContent=g?"voltar ao relatorio":"glossario";',
  'window.scrollTo(0,0);}',
  '$("#btn_info").onclick=function(){const g=!vendoGloss;location.hash=g?"glossario":"";mostra(g);};',
  'window.onhashchange=function(){mostra(location.hash==="#glossario");};',
  'mostra(location.hash==="#glossario");',
  /* ---- orquestracao ---- */
  'function pinta(){pintaKpis();ctx();pintaV();pintaL();extrato();}',
  '$("#f_v").oninput=pintaV;$("#f_l").oninput=pintaL;',
  '$("#f_ev").onchange=function(){pintaFiltros();pinta();};',
  '$("#f_uf").onchange=function(){pintaFiltros();pinta();};',
  '$("#f_wl").onchange=function(){pintaFiltros();pinta();};',
  '$("#limpar").onclick=function(){selV=null;selL=null;$("#f_v").value="";$("#f_l").value="";$("#f_ev").value="";$("#f_wl").value="";$("#f_uf").value="";pintaFiltros();pinta();};',
  'pintaFiltros();pinta();'
].join('\n');

const MIN_TX = (DADOS.parametros && DADOS.parametros.corresp_min) || 0;
const CORTADOS = (DADOS.parametros && DADOS.parametros.pares_descartados) || 0;
const ST_NOME = (DADOS.parametros && DADOS.parametros.status_nome) || {};
const ST_OK = (DADOS.parametros && DADOS.parametros.status_ok) || [];

/* a tabela de status do glossario sai do proprio dicionario publicado,
   entao mudar STATUS_OK la em cima muda a documentacao junto */
const LINHAS_ST = Object.keys(ST_NOME).map(Number).sort((a, b) => a - b).map((k) => {
  const dentro = ST_OK.indexOf(k) >= 0;
  return '<tr><td>' + k + '</td><td class="tx">' + ST_NOME[k] + '</td><td class="tx ' +
    (dentro ? 'st-in">entra' : 'st-out">fica de fora') + '</td></tr>';
}).join('');

const html = [
  '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1">',
  '<title>Veiculos x lojas - aderencia</title>',
  '<style>' + CSS + '</style></head><body>',
  '<div class="topo"><b>Veiculos em evento &times; lojas compradoras</b>',
  '<span class="dir"><button id="btn_info"></button>',
  '<span class="dim">gerado em <span id="ger"></span></span></span></div>',
  /* ═══ TELA 1: o relatorio ═══ */
  '<div class="pg" id="pg_rel">',
  '<div class="tit"><h1>Aderencia por veiculo</h1>',
  '<span class="via">eventos que encerram entre <b>' + (META.janela_ini || '?') + '</b> e <b>' + (META.janela_fim || '?') + '</b> (hora de Brasilia) &middot; perfil de compra desde ' + (META.data_ini || '?') + '</span></div>',
  '<div class="card"><div class="card-h">Filtros</div><div class="card-b">',
  '<div class="filtros">',
  '<div class="fg"><label for="f_wl">Whitelabel</label><select id="f_wl"></select></div>',
  '<div class="fg"><label for="f_uf">UF</label><select id="f_uf"></select></div>',
  '<div class="fg"><label for="f_ev">Evento</label><select id="f_ev"></select></div>',
  '<div class="fg"><label for="f_v">Buscar veiculo</label><input id="f_v" placeholder="marca, modelo ou status" size="26"></div>',
  '<div class="fg"><label for="f_l">Buscar loja</label><input id="f_l" placeholder="loja, UF ou whitelabel" size="26"></div>',
  '<div class="fg"><label>&nbsp;</label><button id="limpar">limpar tudo</button></div>',
  '</div>',
  '<div class="nota"><b>Whitelabel</b>, <b>UF</b> e <b>evento</b> valem para a pagina inteira: KPIs, as duas tabelas e o extrato. As duas <b>buscas</b> so filtram a tabela em que estao.<br>',
  'O filtro <b>nao</b> alcanca o perfil de compra da loja nem o fator de confianca: esses vem do historico de <b>6 meses da loja inteira</b>. Como a aderencia e calculada contra esse perfil, o <b>score de cada par tambem nao muda</b> com o filtro &mdash; o filtro escolhe quais pares aparecem, nao os recalcula.' +
  (MIN_TX ? ' Correspondencia minima de <b>' + MIN_TX + '%</b>' + (CORTADOS ? ' (' + CORTADOS.toLocaleString('pt-BR') + ' pares descartados nesta coleta)' : '') + '.' : '') +
  ' Os termos estao no <b>glossario</b>, no botao acima.</div>',
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
  '</div>',
  /* ═══ TELA 2: o glossario ═══ */
  '<div class="pg gl" id="pg_gloss" style="display:none">',
  '<div class="tit"><h1>Glossario</h1>',
  '<span class="via">o que entra na base, quem pode casar com quem, e como o numero e feito</span></div>',

  '<div class="card"><div class="card-h">O que entra na base</div><div class="card-b"><dl>',
  '<dt>Uma linha por veiculo</dt>',
  '<dd>Nao uma linha por negociacao. O mesmo carro aparece em varios eventos &mdash; os feiroes sao diarios e reciclam estoque &mdash; e contar por negociacao o duplicava.</dd>',
  '<dt>Ultima negociacao</dt>',
  '<dd>De cada veiculo, vale o status da <b>ultima</b> negociacao dentro da janela de eventos escolhida. A ordem importa e e facil de inverter sem perceber: primeiro se acha a ultima negociacao, <b>depois</b> se olha o status dela. O contrario faria um carro vendido hoje reaparecer como disponivel pela negociacao de ontem, que ficou em "Sem Ofertas".</dd>',
  '<dt>Status da negociacao</dt>',
  '<dd>Cinco dos doze estados entram. Ficam de fora os que tem <b>oferta viva na mesa</b> (9 e 13) &mdash; ranquear loja para um carro em negociacao atrapalha o negocio em andamento &mdash; alem da venda e do que foi suspenso ou cancelado.</dd>',
  '<dd><table><thead><tr><th>Cod.</th><th class="tx">Significado</th><th class="tx">No relatorio</th></tr></thead><tbody>' + LINHAS_ST + '</tbody></table></dd>',
  '<dt>Sobra</dt>',
  '<dd>Veiculo cuja ultima negociacao NAO esta em "Ativo": passou pelo evento e nao foi vendido. E o estoque que faz sentido reofertar, e vem marcado com o nome do status na tabela.</dd>',
  '<dt>Janela de eventos</dt>',
  '<dd>Vai da meia-noite de hoje ate 48h a frente, em <b>hora de Brasilia</b> &mdash; evento que ja encerrou hoje continua na base. O recorte tambem pode ser uma lista fixa de eventos, que e o modo usado quando se quer olhar edicoes especificas.</dd>',
  '</dl></div></div>',

  '<div class="card"><div class="card-h">Quem pode casar com quem</div><div class="card-b"><dl>',
  '<dt>Elegibilidade</dt>',
  '<dd>Um par (veiculo, loja) <b>so existe</b> se as duas condicoes valerem: a loja esta na <b>mesma UF</b> do veiculo <b>e</b> pertence a um dos <b>whitelabels que o evento alveja</b>.</dd>',
  '<dd>Fora disso nao ha aderencia baixa &mdash; o par simplesmente nao existe. E por isso que o ranking de cada veiculo e curto: ele so disputa dentro da propria praca e do proprio canal.</dd>',
  '<dt>Whitelabel do evento</dt>',
  '<dd>Um evento pode alvejar varios whitelabels, entao a comparacao e "o whitelabel da loja esta no conjunto do evento", nao uma igualdade simples. Como consequencia, somar veiculos por whitelabel da um numero maior que o total: o mesmo carro conta em cada canal onde e exposto.</dd>',
  '<dt>Correspondencia minima</dt>',
  '<dd>Par com score abaixo de <b>' + (MIN_TX || 0) + '%</b> nao existe em lugar nenhum do relatorio: nao entra nas tabelas, nao conta nos KPIs, nao aparece em nenhuma das duas direcoes. Veiculo que nao alcanca esse piso com ninguem aparece no KPI <b>sem correspondencia</b>.</dd>',
  '</dl></div></div>',

  '<div class="card"><div class="card-h">Como o numero e feito</div><div class="card-b"><dl>',
  '<dt>A ideia</dt>',
  '<dd>Cada loja tem um <b>perfil de compra</b> tirado dos ultimos ' + (META.meses_historico || 6) + ' meses de lances dela: em que faixa de preco compra, de que idade, de que quilometragem, e qual modelo e categoria mais oferta. A aderencia mede o quanto um veiculo cai dentro desse perfil.</dd>',
  '<dt>Aderencia de um indicador</dt>',
  '<dd>Nos numericos (preco, idade, km): <code>1 / (1 + |valor &minus; media| / desvio)</code>. Vale 1 quando o veiculo esta exatamente na media da loja e cai conforme se afasta, medido em desvios.</dd>',
  '<dd>Em modelo e categoria e binario: 1 se bate com o item que a loja mais oferta, 0 se nao bate.</dd>',
  '<dt>Peso de um indicador</dt>',
  '<dd>Nos numericos: <code>1 / (1 + desvio / media)</code> &mdash; o inverso do coeficiente de variacao. <b>Loja de faixa apertada e previsivel</b>, entao acertar o numero dela vale muito; loja que compra de tudo tem dispersao alta, o peso cai sozinho e o indicador deixa de mandar no resultado.</dd>',
  '<dd>Em modelo e categoria, o peso e o <b>% de ofertas</b> da loja naquele item. Loja que concentra 70% dos lances num modelo faz esse indicador pesar mais do que uma que espalha.</dd>',
  '<dt>Aderencia (o total)</dt>',
  '<dd><code>&Sigma;(peso &times; aderencia) / &Sigma;(peso)</code>, de 0 a 100. E a media dos cinco indicadores ponderada pelo quanto cada um informa sobre aquela loja.</dd>',
  '<dt>Fator de confianca</dt>',
  '<dd><code>min(1, veiculos / ' + CONFIANCA_MIN + ')</code>. Loja com pouco historico tem perfil pouco confiavel, entao o resultado dela e descontado &mdash; com menos de ' + CONFIANCA_MIN + ' veiculos ela aparece marcada como <b>amostra baixa</b>.</dd>',
  '<dd class="ex">Esta parte foi adicao minha, nao estava no pedido original: sem ela, uma loja com um unico carro de historico e aderencia 100 lideraria por sorte.</dd>',
  '<dt>Score</dt>',
  '<dd><b>Aderencia &times; confianca.</b> E o numero que ordena as duas tabelas e o que a barra azul desenha. Quando ha selecao, as duas colunas aparecem lado a lado: <b>aderencia</b> e o casamento bruto com o perfil, <b>score</b> ja e o numero descontado.</dd>',
  '<dt>Componentes</dt>',
  '<dd>A decomposicao do par, indicador a indicador (P, I, K, M, C), cada um de 0 a 100. Serve para ver <i>por que</i> aquele score saiu: um 90 sustentado por preco e idade e diferente de um 90 que veio so de categoria.</dd>',
  '<dt>O que o filtro nao muda</dt>',
  '<dd>O perfil de compra e o fator de confianca saem do historico da <b>loja inteira</b>, sem recorte por whitelabel, UF ou evento. Como a aderencia e calculada contra esse perfil, <b>o score de cada par nao muda</b> com o filtro. O filtro escolhe quais pares aparecem; nao os recalcula.</dd>',
  '<dt>Volume de ofertas</dt>',
  '<dd>Nao entra no score. "Veiculos ofertados 6m" esta na tabela como leitura de porte da loja, nao como criterio de ranking.</dd>',
  '</dl></div></div>',
  '</div>',
  '<script>const D=' + DADOS_JSON + ';</' + 'script>',
  '<script>' + APP + '</' + 'script>',
  '</body></html>'
].join('\n');

"""

s = s[:INI] + NOVO + s[FIM:]
io.open(P, "w", encoding="utf-8").write(s)
print("render trocado: glossario, filtro de UF, tabelas ajustadas")
