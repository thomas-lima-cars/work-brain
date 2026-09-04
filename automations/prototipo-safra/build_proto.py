# -*- coding: utf-8 -*-
# Estado alvo: CROSS-FILTER BIDIRECIONAL (filtros WL/Ano/Mes no bloco de safra,
# header original intacto, sem seletor de WL nas abas de Raio-X).
import json, sys, os
sys.stdout.reconfigure(encoding="utf-8")
# PORTÁVEL: caminhos relativos à pasta deste script — roda em qualquer máquina, sem editar.
HERE = os.path.dirname(os.path.abspath(__file__))
SP  = os.path.join(HERE, "dados")
SRC = os.path.join(HERE, "relatorio-c6-original-baseline.html")
OUT = os.path.join(HERE, "relatorio-c6-PROTO-safra-atual.html")

html=open(SRC,encoding="utf-8").read()
ALL=json.load(open(os.path.join(SP,"coorte_all.json"),encoding="utf-8"))
WL=json.load(open(os.path.join(SP,"coorte_wl.json"),encoding="utf-8"))
WLLIST=json.load(open(os.path.join(SP,"wl_list.json"),encoding="utf-8"))
REC=json.load(open(os.path.join(SP,"recencia.json"),encoding="utf-8"))

def match_div(s,start):
    d=0;i=start;n=len(s)
    while i<n:
        if s.startswith("<div",i):d+=1;i+=4
        elif s.startswith("</div>",i):
            d-=1;i+=6
            if d==0:return i
        else:i+=1
def sec_containing(t):
    idx=html.index(t);st=html.rfind('<div class="sec"',0,idx);return html[st:match_div(html,st)]
sit_sec=sec_containing("Cadastros por Situação")
funil_sec=sec_containing("Funil de Conversão")

CSS=r'''
<style id="proto-safra-css">
.safra-box{border:1px solid var(--line);background:linear-gradient(180deg,#fafafa,#fff);border-radius:14px;padding:18px 18px 22px;margin:4px 0 26px}
.safra-top{display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap;align-items:flex-start}
.safra-title{font-family:'Oswald',sans-serif;font-size:20px;font-weight:600;color:var(--ink);text-transform:uppercase;letter-spacing:.04em}
.safra-note{font-size:12.5px;color:var(--sub);max-width:560px;margin-top:4px;line-height:1.5}
.safra-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.safra-toolbar label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--sub)}
.safra-toolbar select{padding:9px 12px;border:1px solid var(--line);border-radius:9px;background:#fff;font-size:13px;color:var(--ink2);font-family:'Inter',sans-serif;max-width:260px}
.safra-reset{padding:9px 12px;border:1px solid var(--line);border-radius:9px;background:var(--brand);color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif}
.safra-reset:hover{background:var(--brand2)}
.safra-scope{margin:14px 0 6px;font-size:13px;color:var(--ink2);font-weight:600}
.safra-sub{margin:24px 0 4px;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--ink)}
.safra-sub-note{font-size:12px;color:var(--sub);margin:0 0 12px}
</style>
'''

BLOCK=r'''
  <!-- [PROTO] SAFRA DE CADASTRO (multi-whitelabel + cross-filter) -->
  <div class="safra-box">
    <div class="safra-top">
      <div>
        <div class="safra-title">Safra de cadastro</div>
        <div class="safra-note">Filtre por <b>whitelabel</b> e por ano/mês de <b>cadastro</b>. Os indicadores descrevem essa safra: dos clientes cadastrados no período, quantos já logaram, ofertaram e compraram. "Todos os whitelabels" mostra clientes <b>distintos</b> da plataforma.</div>
      </div>
      <div class="safra-toolbar">
        <label for="scWl">Whitelabel</label>
        <select id="scWl"></select>
        <label for="scAno">Ano</label>
        <select id="scAno"></select>
        <label for="scMes">Mês</label>
        <select id="scMes"></select>
        <button type="button" id="scReset" class="safra-reset">Limpar</button>
      </div>
    </div>
    <div class="safra-scope" id="scScope"></div>

    <div class="kpi-grid">
      <div class="kpi" style="--accent:var(--brand)"><div class="kpi-label">Clientes na base</div><div class="kpi-value" id="sc_total">–</div><div class="kpi-sub" id="sc_total_sub">clientes cadastrados</div></div>
      <div class="kpi" style="--accent:var(--good)"><div class="kpi-label">Com login</div><div class="kpi-value" id="sc_login">–</div><div class="kpi-sub" id="sc_login_sub"></div></div>
      <div class="kpi" style="--accent:var(--faint)"><div class="kpi-label">Sem login</div><div class="kpi-value" id="sc_semlogin">–</div><div class="kpi-sub">nunca acessaram a plataforma</div></div>
      <div class="kpi" style="--accent:var(--warn)"><div class="kpi-label">Ofertantes</div><div class="kpi-value" id="sc_ofert">–</div><div class="kpi-sub" id="sc_ofert_sub"></div></div>
      <div class="kpi" style="--accent:var(--good)"><div class="kpi-label">Compradores</div><div class="kpi-value" id="sc_comp">–</div><div class="kpi-sub" id="sc_comp_sub"></div></div>
      <div class="kpi" style="--accent:var(--brand)"><div class="kpi-label">Vendas</div><div class="kpi-value" id="sc_neg">–</div><div class="kpi-sub" id="sc_neg_sub"></div></div>
      <div class="kpi" style="--accent:var(--good)"><div class="kpi-label">Valor total</div><div class="kpi-value" id="sc_vol" style="font-size:22px;color:#7c3aed">–</div><div class="kpi-sub">valor total pago nas compras</div></div>
      <div class="kpi" style="--accent:var(--brand)"><div class="kpi-label">Última compra</div><div class="kpi-value" id="sc_ult" style="font-size:22px">–</div><div class="kpi-sub">compra mais recente</div></div>
    </div>

    <div class="safra-sub">Cadastros por Situação</div>
    <div class="safra-sub-note">Situação cadastral <b>atual</b> dos clientes da safra (o sistema não guarda histórico de situação).</div>
    <div class="kpi-grid">
      <div class="kpi" style="--accent:#94a3b8"><div class="kpi-label">1 · Pré cadastrado</div><div class="kpi-value" id="sit_s1">–</div><div class="kpi-sub" id="sit_s1_sub"></div></div>
      <div class="kpi" style="--accent:#94a3b8"><div class="kpi-label">2 · Para aprovação</div><div class="kpi-value" id="sit_s2">–</div><div class="kpi-sub" id="sit_s2_sub"></div></div>
      <div class="kpi" style="--accent:#047857"><div class="kpi-label">3 · Aprovado</div><div class="kpi-value" id="sit_s3">–</div><div class="kpi-sub" id="sit_s3_sub"></div></div>
      <div class="kpi" style="--accent:#b91c1c"><div class="kpi-label">4 · Reprovado</div><div class="kpi-value" id="sit_s4">–</div><div class="kpi-sub" id="sit_s4_sub"></div></div>
      <div class="kpi" style="--accent:#b45309"><div class="kpi-label">5 · Bloqueado</div><div class="kpi-value" id="sit_s5">–</div><div class="kpi-sub" id="sit_s5_sub"></div></div>
      <div class="kpi" style="--accent:#b91c1c"><div class="kpi-label">6 · Inadimplente</div><div class="kpi-value" id="sit_s6">–</div><div class="kpi-sub" id="sit_s6_sub"></div></div>
    </div>

    <div class="safra-sub">Funil de Conversão</div>
    <div class="funnel">
      <div class="f-step"><div class="f-step-lbl">Base</div><div class="f-step-val" id="fn_base">–</div><div class="f-step-pct">100%</div><div class="f-arrow">→</div></div>
      <div class="f-step"><div class="f-step-lbl">Login</div><div class="f-step-val" id="fn_login">–</div><div class="f-step-pct" id="fn_login_pct"></div><div class="f-arrow">→</div></div>
      <div class="f-step"><div class="f-step-lbl">Oferta</div><div class="f-step-val" id="fn_of">–</div><div class="f-step-pct" id="fn_of_pct"></div><div class="f-arrow">→</div></div>
      <div class="f-step"><div class="f-step-lbl">Compra</div><div class="f-step-val" id="fn_comp">–</div><div class="f-step-pct" id="fn_comp_pct"></div></div>
    </div>
  </div>
'''

JS=r'''
<script id="proto-safra-js">
(function(){
  var ALL=__ALL__, WL=__WL__, WLLIST=__WLLIST__, REC=__REC__;
  var MK=['total','com_login','sem_login','ofertantes','compradores','negociacoes','vendido','volume','s1','s2','s3','s4','s5','s6'];
  var MESNOME=['','janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var fmt=function(n){return (n||0).toLocaleString('pt-BR');};
  var pct1=function(a,b){return b>0?(a/b*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1}):'0,0';};
  var volf=function(n){n=Number(n)||0; if(n>=1e9)return 'R$ '+(n/1e9).toFixed(2).replace('.',',')+' bi'; if(n>=1e6)return 'R$ '+(n/1e6).toFixed(1).replace('.',',')+' Mi'; if(n>=1e3)return 'R$ '+Math.round(n/1e3)+' K'; return 'R$ '+fmt(Math.round(n));};
  var dt=function(s){if(!s)return '—';var d=new Date(s);return d.toLocaleDateString('pt-BR');};
  var wlSel=document.getElementById('scWl'),anoSel=document.getElementById('scAno'),mesSel=document.getElementById('scMes');
  function wlName(){var o=wlSel.options[wlSel.selectedIndex];return o?o.getAttribute('data-name'):'';}
  function rowsForWl(){
    var wl=wlSel.value;
    if(!wl){ return Object.keys(ALL).map(function(ym){var o={ym:ym};MK.forEach(function(k){o[k]=ALL[ym][k]||0;});o.ultima_compra=ALL[ym].ultima_compra;return o;}); }
    return WL.filter(function(r){return String(r.wl_id)===wl;});
  }
  function hasOpt(sel,v){return Array.prototype.some.call(sel.options,function(o){return o.value===v;});}
  // cross-filter bidirecional: cada seletor lista so opcoes validas dadas as OUTRAS selecoes
  function refresh(){
    var wl=wlSel.value,a=anoSel.value,m=mesSel.value;
    var wlTot={};
    WL.forEach(function(r){ if(a&&r.ym.slice(0,4)!==a)return; if(m&&r.ym.slice(5,7)!==m)return; wlTot[r.wl_id]=(wlTot[r.wl_id]||0)+r.total; });
    var o1='<option value="" data-name="Todos os whitelabels">Todos os whitelabels (distinto)</option>';
    WLLIST.forEach(function(w){ if(wlTot[w.id]!=null) o1+='<option value="'+w.id+'" data-name="'+w.name.replace(/"/g,'&quot;')+'">'+w.name+' ('+fmt(wlTot[w.id])+')</option>'; });
    wlSel.innerHTML=o1; wlSel.value=hasOpt(wlSel,wl)?wl:''; wl=wlSel.value;
    var anos={};
    WL.forEach(function(r){ if(wl&&String(r.wl_id)!==wl)return; if(m&&r.ym.slice(5,7)!==m)return; anos[r.ym.slice(0,4)]=1; });
    anoSel.innerHTML='<option value="">Todos</option>'+Object.keys(anos).sort().map(function(x){return '<option value="'+x+'">'+x+'</option>';}).join('');
    anoSel.value=hasOpt(anoSel,a)?a:''; a=anoSel.value;
    var mes={};
    WL.forEach(function(r){ if(wl&&String(r.wl_id)!==wl)return; if(a&&r.ym.slice(0,4)!==a)return; mes[r.ym.slice(5,7)]=1; });
    mesSel.innerHTML='<option value="">Todos</option>'+Object.keys(mes).sort().map(function(x){return '<option value="'+x+'">'+MESNOME[parseInt(x,10)]+'</option>';}).join('');
    mesSel.value=hasOpt(mesSel,m)?m:'';
  }
  function agg(){
    var a=anoSel.value,m=mesSel.value;
    var s={ultima_compra:null}; MK.forEach(function(k){s[k]=0;});
    rowsForWl().forEach(function(r){
      if(a&&r.ym.slice(0,4)!==a)return; if(m&&r.ym.slice(5,7)!==m)return;
      MK.forEach(function(k){s[k]+=r[k]||0;});
      if(r.ultima_compra&&(!s.ultima_compra||r.ultima_compra>s.ultima_compra))s.ultima_compra=r.ultima_compra;
    });
    return s;
  }
  function scopeLabel(){
    var a=anoSel.value,m=mesSel.value,per;
    if(!a&&!m)per='todas as safras'; else if(a&&!m)per='safra de '+a; else if(!a&&m)per='safra de '+MESNOME[parseInt(m,10)]+' (todos os anos)'; else per='safra de '+MESNOME[parseInt(m,10)]+' de '+a;
    return wlName()+' · '+per;
  }
  function setT(id,v){var e=document.getElementById(id);if(e)e.textContent=v;}
  function render(){
    var s=agg(),t=s.total;
    setT('scScope',scopeLabel());
    setT('sc_total',fmt(s.total));
    setT('sc_total_sub', wlSel.value ? ('cadastrados em '+wlName()) : 'clientes distintos da plataforma');
    setT('sc_login',fmt(s.com_login)); setT('sc_login_sub',pct1(s.com_login,t)+'% da safra');
    setT('sc_semlogin',fmt(s.sem_login));
    setT('sc_ofert',fmt(s.ofertantes)); setT('sc_ofert_sub',pct1(s.ofertantes,s.com_login)+'% dos com login');
    setT('sc_comp',fmt(s.compradores)); setT('sc_comp_sub',pct1(s.compradores,s.ofertantes)+'% dos ofertantes');
    setT('sc_neg',fmt(s.negociacoes)); var _n=document.getElementById('sc_neg_sub'); if(_n)_n.innerHTML='Vendido: '+fmt(s.vendido)+'<br>Pgto. Pendente: '+fmt(s.negociacoes-s.vendido);
    setT('sc_vol',volf(s.volume));
    setT('sc_ult',dt(s.ultima_compra));
    for(var i=1;i<=6;i++){var k='s'+i;setT('sit_'+k,fmt(s[k]));setT('sit_'+k+'_sub',pct1(s[k],t)+'% da safra');}
    setT('fn_base',fmt(s.total));
    setT('fn_login',fmt(s.com_login)); setT('fn_login_pct',pct1(s.com_login,s.total)+'% da base');
    setT('fn_of',fmt(s.ofertantes)); setT('fn_of_pct',pct1(s.ofertantes,s.com_login)+'% dos c/ login');
    setT('fn_comp',fmt(s.compradores)); setT('fn_comp_pct',pct1(s.compradores,s.ofertantes)+'% dos ofertantes');
    renderRec();
  }
  function renderRec(){
    var r=REC[wlSel.value]||REC.all;
    ['lg','of','cp'].forEach(function(t){
      var o=r[t]||{com:0,b:[0,0,0,0]}, com=o.com||0;
      for(var i=0;i<4;i++){ var c=(o.b&&o.b[i])||0; setT('rec_'+t+'_c'+i,fmt(c)); var el=document.getElementById('rec_'+t+'_bar'+i); if(el) el.style.width=(com>0?(c/com*100):0)+'%'; }
      setT('rec_'+t+'_com',fmt(com));
      setT('rec_'+t+'_nunca',fmt((r.total||0)-com));
    });
  }
  wlSel.addEventListener('change',function(){refresh();render();});
  anoSel.addEventListener('change',function(){refresh();render();});
  mesSel.addEventListener('change',function(){refresh();render();});
  document.getElementById('scReset').addEventListener('click',function(){wlSel.value='';anoSel.value='';mesSel.value='';refresh();render();});
  refresh();render();
})();
</script>
'''
JS=(JS.replace("__ALL__",json.dumps(ALL,ensure_ascii=False))
      .replace("__WL__",json.dumps(WL,ensure_ascii=False))
      .replace("__WLLIST__",json.dumps(WLLIST,ensure_ascii=False))
      .replace("__REC__",json.dumps(REC,ensure_ascii=False)))

# ---- Reconstrói a seção Recência como WL-reativa (template com ids) ----
def rec_card(t,label,color,footlbl):
    rows=""
    faixas=['0–30d','31–90d','91–180d','180d+']
    for i,fx in enumerate(faixas):
        op=';opacity:.6' if i==1 else (';opacity:.7' if i==2 else (';opacity:.75' if i==3 else ''))
        rows+=('<div class="rec-row"><span class="rec-period">'+fx+'</span>'
               '<div class="rec-bar-bg"><div class="rec-bar" id="rec_'+t+'_bar'+str(i)+'" style="width:0%;background:'+color+op+'"></div></div>'
               '<span class="rec-count" id="rec_'+t+'_c'+str(i)+'">0</span></div>')
    return ('<div class="rec-card">'
            '<div class="rec-head"><span class="rec-dot" style="background:'+color+'"></span><span style="color:'+color+'">'+label+'</span></div>'
            +rows+
            '<div class="rec-footer">Com '+footlbl+': <strong style="color:'+color+'" id="rec_'+t+'_com">0</strong> · Nunca '+footlbl.replace("login","logou").replace("oferta","ofertou").replace("compra","comprou")+': <strong style="color:var(--bad)" id="rec_'+t+'_nunca">0</strong></div>'
            '</div>')
REC_SECTION=('<div class="sec">'
  '<div class="sec-head"><div class="sec-title">Recência — Há Quanto Tempo Sem Agir</div><div class="sec-line"></div></div>'
  '<div class="sec-note">Tempo desde a última ação de cada cliente do whitelabel selecionado, considerando apenas quem já fez aquela ação ao menos uma vez. O acesso considera todo o histórico disponível.</div>'
  '<div class="rec-grid">'
  +rec_card('lg','Parou de Logar','var(--brand)','login')
  +rec_card('of','Parou de Ofertar','var(--brand2)','oferta')
  +rec_card('cp','Parou de Comprar','var(--good)','compra')
  +'</div></div>')

html2=html.replace("</head>",CSS+"\n</head>",1)
anchor='<div class="sec-title">Visão Geral da Base</div><div class="sec-line"></div></div>'
a_end=html2.index(anchor)+len(anchor)
kg_start=html2.index('<div class="kpi-grid">',a_end)
kg_end=match_div(html2,kg_start)
html2=html2[:a_end]+BLOCK+html2[kg_end:]
assert sit_sec in html2 and funil_sec in html2
html2=html2.replace(sit_sec,"").replace(funil_sec,"")
rec_sec=sec_containing("Recência — Há Quanto Tempo")
assert rec_sec in html2, "secao Recencia nao encontrada"
html2=html2.replace(rec_sec, REC_SECTION,1)
html2=html2.replace("</body>",JS+"\n</body>",1)
open(OUT,"w",encoding="utf-8").write(html2)
print("OK gerado:",OUT,"| tamanho:",len(html2))
print("checks: safra-box=%s scWl_no_bloco=%s header_C6_intacto=%s sem_gfilter=%s sem_rxwl=%s"%(
  'class="safra-box"' in html2,
  ('<div class="safra-toolbar">' in html2),
  ('Base completa do whitelabel 43 (C6 Lojista)' in html2),
  ('class="gfilter"' not in html2),
  ('class="wl-rx"' not in html2)))
