/* ══════════════════════════════════════════════════════════════════
   NÓ "Injetar Filtros"  (arquitetura B, 2026-09-04)

   Entra entre "Montar HTML" e "Anexar HTML". Pega o HTML já gerado e
   injeta o bloco de filtros de safra + o JS que recalcula ao vivo.

   Por que aqui e não dentro do Montar HTML: aquele nó tem 87 KB e não passa
   pela API do MCP (o literal sozinho ultrapassa 50 mil tokens). Pós-processar
   é a mesma estratégia do protótipo do Everton, que injeta CSS/HTML/JS sobre
   um relatório pronto — só que agora dentro do n8n, versionado, em vez de um
   script Python solto numa pasta.

   COMO ANCORA: pelo TEXTO do rótulo (`kpi-label`, `f-step-lbl`), não por
   posição nem por faixa de linha. Se o gerador mudar a ordem dos cards, o
   injetor continua achando. Se um rótulo SUMIR, o card correspondente
   simplesmente não fica reativo — falha visível, não silenciosa.

   ⚠️ ESCOPO: o seletor de Ano/Mês FUNCIONA (a coorte é indexada por mês de
   cadastro). O de Whitelabel fica presente porém desabilitado — o dado por
   whitelabel é o lote 2, que ainda não existe. Quando existir, basta popular
   WL_DATA aqui; a mecânica de render já está pronta.
   ══════════════════════════════════════════════════════════════════ */

let html = $json.html;
if (!html) { throw new Error('Injetar Filtros: $json.html vazio — o Montar HTML nao gerou nada'); }

/* ─── 1. coorte, a partir dos nós reais ─────────────────────────────── */
const nomes = $('Montar Queries Base').all().map(function (i) { return i.json.queryName; });
const outs = $('MCP Exec').all();
const coorte = [];
for (let i = 0; i < nomes.length; i++) {
  if (nomes[i] !== 'coorte') continue;
  const sc = (outs[i] && outs[i].json && outs[i].json.structuredContent) || {};
  const cols = sc.columns || [];
  const rows = sc.rows || [];
  for (let r = 0; r < rows.length; r++) {
    const o = {};
    for (let c = 0; c < cols.length; c++) { o[cols[c]] = rows[r][c]; }
    coorte.push(o);
  }
}
if (!coorte.length) { throw new Error('Injetar Filtros: coorte vazia'); }

/* ─── 2. marca os valores reativos por TEXTO do rótulo ──────────────── */
/* "Volume total" e "Última compra" trazem style inline no kpi-value, entao
   o padrao abaixo aceita atributos antes do '>'. A "Última compra" TEM que
   ser reativa: se ficasse estatica, mostraria a data da plataforma inteira
   enquanto o resto da tela mostra a safra filtrada — numero inconsistente. */
const KPI_MAP = {
  'Clientes na base': 'total',
  'Com login': 'com_login',
  'Sem login': 'sem_login',
  'Ofertantes': 'ofertantes',
  'Compradores': 'compradores',
  'Negociações vendidas': 'negociacoes',
  'Volume total': 'volume',
  'Última compra': 'ultima_compra'
};
const FUNIL_MAP = { 'Base': 'total', 'Login': 'com_login', 'Oferta': 'ofertantes', 'Compra': 'compradores' };

let marcados = 0;
function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

Object.keys(KPI_MAP).forEach(function (rotulo) {
  const re = new RegExp('(<div class="kpi-label">' + esc(rotulo) +
    '</div><div class="kpi-value"[^>]*)(>)', 'g');
  const antes = html;
  html = html.replace(re, '$1 data-sf="' + KPI_MAP[rotulo] + '"$2');
  if (html !== antes) marcados++;
});

/* situação: 1..6, ancorado no número inicial do rótulo */
for (let n = 1; n <= 6; n++) {
  const re = new RegExp('(<div class="kpi-label">' + n + '[^<]*</div><div class="kpi-value"[^>]*)(>)', 'g');
  const antes = html;
  html = html.replace(re, '$1 data-sf="s' + n + '"$2');
  if (html !== antes) marcados++;
}

Object.keys(FUNIL_MAP).forEach(function (rotulo) {
  const re = new RegExp('(<div class="f-step-lbl">' + esc(rotulo) +
    '</div><div class="f-step-val"[^>]*)(>)', 'g');
  const antes = html;
  html = html.replace(re, '$1 data-sf="' + FUNIL_MAP[rotulo] + '"$2');
  if (html !== antes) marcados++;
});

/* ─── 3. barra de filtros antes do primeiro kpi-grid ────────────────── */
const anos = [];
coorte.forEach(function (r) {
  const a = String(r.ym).slice(0, 4);
  if (anos.indexOf(a) < 0) anos.push(a);
});
anos.sort();

const CSS = '<style id="sf-css">' +
  '.sf-bar{display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;padding:14px 16px;margin:0 0 16px;' +
  'border:1px solid var(--line);border-radius:10px;background:var(--card)}' +
  '.sf-f{display:flex;flex-direction:column;gap:4px}' +
  '.sf-f label{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--sub)}' +
  '.sf-f select{padding:7px 10px;border:1px solid var(--line);border-radius:8px;background:#fff;' +
  'font-size:13px;color:var(--ink);font-family:inherit;min-width:150px}' +
  '.sf-f select:disabled{background:#f1f5f9;color:var(--faint);cursor:not-allowed}' +
  '.sf-btn{padding:7px 12px;border:1px solid var(--line);border-radius:8px;background:var(--brand);' +
  'color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}' +
  '.sf-note{font-size:11.5px;color:var(--faint);margin-left:auto;max-width:340px;line-height:1.45}' +
  '</style>';

const BAR = '<div class="sf-bar">' +
  '<div class="sf-f"><label>Whitelabel</label><select id="sfWl" disabled>' +
  '<option>Todos os whitelabels</option></select></div>' +
  '<div class="sf-f"><label>Ano de cadastro</label><select id="sfAno"><option value="">Todos</option>' +
  anos.map(function (a) { return '<option value="' + a + '">' + a + '</option>'; }).join('') +
  '</select></div>' +
  '<div class="sf-f"><label>Mês</label><select id="sfMes"><option value="">Todos</option></select></div>' +
  '<button class="sf-btn" id="sfReset">Limpar</button>' +
  '<div class="sf-note">Filtra por <b>safra de cadastro</b>: recalcula KPIs, situação e funil ' +
  'para os clientes que entraram no período. O seletor de whitelabel aguarda o dado por WL.</div>' +
  '</div>';

const iGrid = html.indexOf('<div class="kpi-grid">');
if (iGrid < 0) { throw new Error('Injetar Filtros: kpi-grid nao encontrado'); }
html = html.slice(0, iGrid) + BAR + html.slice(iGrid);
html = html.replace('</head>', CSS + '</head>');

/* ─── 4. dados + lógica ─────────────────────────────────────────────── */
const CAMPOS = ['total', 'com_login', 'sem_login', 'ofertantes', 'compradores',
                'negociacoes', 'volume', 's1', 's2', 's3', 's4', 's5', 's6'];
const compacto = coorte.map(function (r) {
  const o = { ym: r.ym, uc: r.ultima_compra || null };
  CAMPOS.forEach(function (c) { o[c] = Number(r[c]) || 0; });
  return o;
});

const JS = '<script id="sf-js">(function(){' +
  'var C=' + JSON.stringify(compacto) + ';' +
  'var wl=document.getElementById("sfWl"),an=document.getElementById("sfAno"),' +
  'me=document.getElementById("sfMes"),rs=document.getElementById("sfReset");' +
  'if(!an||!me)return;' +
  'var MN=["","Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];' +
  'function br(n){return (Number(n)||0).toLocaleString("pt-BR");}' +
  'function vol(n){n=Number(n)||0;' +
  'if(n>=1e9)return "R$ "+(n/1e9).toFixed(2).replace(".",",")+" bi";' +
  'if(n>=1e6)return "R$ "+(n/1e6).toFixed(1).replace(".",",")+" Mi";' +
  'if(n>=1e3)return "R$ "+Math.round(n/1e3)+" K";return "R$ "+br(n);}'+
  'function dt(s){if(!s)return "—";var p=String(s).slice(0,10).split("-");'+
  'return p.length===3?p[2]+"/"+p[1]+"/"+p[0]:"—";}' +
  'function meses(a){var o=[];C.forEach(function(r){if(!a||String(r.ym).slice(0,4)===a){' +
  'var m=String(r.ym).slice(5,7);if(o.indexOf(m)<0)o.push(m);}});o.sort();return o;}' +
  'function encheMes(){var a=an.value,at=me.value,ms=meses(a);' +
  'me.innerHTML="<option value=\\"\\">Todos</option>"+ms.map(function(m){' +
  'return "<option value=\\""+m+"\\">"+MN[parseInt(m,10)]+"</option>";}).join("");' +
  'if(ms.indexOf(at)>=0)me.value=at;}' +
  'function agrega(){var a=an.value,m=me.value,o={};' +
  'C.forEach(function(r){var ry=String(r.ym).slice(0,4),rm=String(r.ym).slice(5,7);' +
  'if(a&&ry!==a)return; if(m&&rm!==m)return;' +
  'for(var k in r){if(k==="ym")continue;'+
  'if(k==="uc"){if(r.uc&&(!o.uc||String(r.uc)>String(o.uc)))o.uc=r.uc;continue;}'+
  'o[k]=(o[k]||0)+r[k];}});return o;}' +
  'function pct(x,y){return y?(x/y*100).toFixed(1).replace(".",",")+"%":"0,0%";}' +
  'function render(){var d=agrega(),t=d.total||0;' +
  'document.querySelectorAll("[data-sf]").forEach(function(el){' +
  'var k=el.getAttribute("data-sf"),v=d[k]||0;' +
  'if(k==="ultima_compra"){el.textContent=dt(d.uc);return;}'+
  'el.textContent = k==="volume" ? vol(v) : br(v);' +
  'var sub=el.nextElementSibling;' +
  'if(sub&&sub.className==="kpi-sub"){' +
  'if(k==="com_login")sub.textContent=pct(v,t)+" da base";' +
  'else if(k==="ofertantes")sub.textContent=pct(v,d.com_login||0)+" dos com login";' +
  'else if(k==="compradores")sub.textContent=pct(v,d.ofertantes||0)+" dos ofertantes";' +
  'else if(k.charAt(0)==="s"&&k.length===2)sub.textContent=pct(v,t)+" da base";}' +
  'if(sub&&sub.className==="f-step-pct"){' +
  'if(k==="total")sub.textContent="100%";' +
  'else if(k==="com_login")sub.textContent=pct(v,t)+" da base";' +
  'else if(k==="ofertantes")sub.textContent=pct(v,d.com_login||0)+" dos c/ login";' +
  'else if(k==="compradores")sub.textContent=pct(v,d.ofertantes||0)+" dos ofertantes";}' +
  '});}' +
  'an.addEventListener("change",function(){encheMes();render();});' +
  'me.addEventListener("change",render);' +
  'if(rs)rs.addEventListener("click",function(){an.value="";me.value="";encheMes();render();});' +
  'encheMes();render();' +
  '})();</script>';

html = html.replace('</body>', JS + '</body>');

return {
  json: {
    html: html,
    totalBase: $json.totalBase,
    volume: $json.volume,
    marcadosReativos: marcados,
    safras: coorte.length
  }
};
