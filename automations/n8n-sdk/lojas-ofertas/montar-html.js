/* ══════════════════════════════════════════════════════════════════════
   NÓ "Montar HTML" — Perfil de lojas ofertantes (6 meses)

   Embarca DADO e desenha no cliente, como o gerador do lote 2. Nó
   pequeno, tabela ordenável e filtrável sem reescrever texto.

   ─── TRÊS CORREÇÕES DA EXECUÇÃO 49799 ─────────────────────────────────

   1. O erro vinha como objeto `{message: "..."}` e eu fazia `String(...)`,
      que imprime "[object Object]". A causa real — o validador do MCP
      rejeitando função de janela — ficou escondida. Agora `erroTexto()`
      abre objeto, Error e array.

   2. O MCP corta resposta em 50 linhas e marca `truncated: true`. Meu
      veredito antigo olhava só "sobrou página vazia?", e por isso deu
      "ok" para uma coleta que perdeu ~1.000 lojas em silêncio. Agora
      `truncated` é lido direto da resposta e derruba o veredito.

   3. Existe `q_totais`, uma chamada só, que devolve o número real de
      lojas e de ofertas. É GABARITO: se a coleta não fechar com ele, o
      relatório abre dizendo quantas lojas faltaram. Não dá mais para uma
      tabela pela metade parecer completa.
   ══════════════════════════════════════════════════════════════════════ */

const pedidos = $('Montar Queries').all().map((i) => i.json);
const outs = $('MCP Exec').all();
const META = pedidos.length
  ? pedidos[0].meta
  : { data_ini: '?', meses: 6, page: 50, pages: 0, lado: '?',
      esperado_lojas: null, esperado_ofertas: null, chamadas: 0 };

/* ── erro legível, venha ele como for ───────────────────────────────── */
function erroTexto(e) {
  if (!e) return null;
  if (typeof e === 'string') return e.slice(0, 300);
  if (Array.isArray(e)) return e.map(erroTexto).join(' | ').slice(0, 300);
  if (e.message) return String(e.message).slice(0, 300);
  if (e.error) return erroTexto(e.error);
  try { return JSON.stringify(e).slice(0, 300); } catch (x) { return String(e).slice(0, 300); }
}

/* ── ingestão: {columns, rows} -> array de objetos ──────────────────── */
const dados = {};
const diag = {};

for (let i = 0; i < pedidos.length; i++) {
  const nome = pedidos[i].queryName;
  if (!dados[nome]) dados[nome] = [];
  if (!diag[nome]) {
    diag[nome] = { queryName: nome, chamadas: 0, linhas: 0, vazias: 0, truncadas: 0, erro: null };
  }
  diag[nome].chamadas++;

  const o = outs[i] ? outs[i].json : null;
  const sc = o ? (o.structuredContent || o) : null;
  const err = o ? (o.error || (sc && sc.error)) : null;
  if (err && !diag[nome].erro) diag[nome].erro = erroTexto(err);

  if (sc && sc.truncated) diag[nome].truncadas++;

  const cols = sc && sc.columns ? sc.columns : [];
  const rows = sc && sc.rows ? sc.rows : [];
  if (!rows.length) { diag[nome].vazias++; continue; }
  diag[nome].linhas += rows.length;
  for (let r = 0; r < rows.length; r++) {
    const obj = {};
    for (let c = 0; c < cols.length; c++) obj[cols[c]] = rows[r][c];
    dados[nome].push(obj);
  }
}

/* ── gabarito ───────────────────────────────────────────────────────
   Vem da fase 1 (`Montar Totais` -> `MCP Totais`), carregado no META
   pelo `Montar Queries`. Não é mais uma query dentro deste lote. */
const ESPERADO_LOJAS = META.esperado_lojas === undefined ? null : META.esperado_lojas;
const ESPERADO_OFERTAS = META.esperado_ofertas === undefined ? null : META.esperado_ofertas;

/* Nota: "pagina vazia" NÃO é mais sinal de erro. A paginação agora é
   exata (ceil(lojas/50)), então o normal é zero página vazia. Quem
   responde por completude é o gabarito, lá embaixo. */
const diagnostico = Object.keys(diag).map((k) => {
  const d = diag[k];
  d.teto = d.chamadas * META.page;
  if (d.erro) d.veredito = 'ERRO';
  else if (d.truncadas) d.veredito = 'RESPOSTA CORTADA - pagina maior que o teto do MCP';
  else if (d.linhas === 0) d.veredito = 'ZERO LINHAS';
  else d.veredito = 'ok';
  return d;
});

/* ── moda: desempata mantendo a primeira (ordem já vem do SQL) ──────── */
function primeiraPorLoja(arr) {
  const m = {};
  const empates = [];
  for (let i = 0; i < arr.length; i++) {
    const k = String(arr[i].shop_id);
    if (m[k]) { empates.push(k); continue; }
    m[k] = arr[i];
  }
  return { mapa: m, empates: empates.length };
}

/* ── junção pelo shop_id ────────────────────────────────────────────── */
const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
function indexa(arr) {
  const m = {};
  for (let i = 0; i < arr.length; i++) m[String(arr[i].shop_id)] = arr[i];
  return m;
}
const iOf = indexa(dados.q_ofertas || []);
const iPe = indexa(dados.q_perfil || []);
const rMo = primeiraPorLoja(dados.q_modelo || []);
const rCa = primeiraPorLoja(dados.q_categoria || []);
const iMo = rMo.mapa;
const iCa = rCa.mapa;

const linhas = (dados.q_lojas || []).map((s) => {
  const k = String(s.shop_id);
  const of = iOf[k] || {};
  const pe = iPe[k] || {};
  const mo = iMo[k] || {};
  const ca = iCa[k] || {};
  const qtOfertas = num(of.qt_ofertas);
  const pct = (n) => (qtOfertas && n ? Math.round((Number(n) / qtOfertas) * 1000) / 10 : null);
  return {
    whitelabel: s.whitelabel || ('whitelabel #' + s.whitelabel_id),
    whitelabel_id: num(s.whitelabel_id),
    uf: s.uf || 'Nao identificada',
    loja_id: num(s.shop_id),
    loja: s.loja,
    qt_enderecos: num(s.qt_enderecos),
    qt_ofertas: qtOfertas,
    qt_anuncios: num(of.qt_anuncios),
    qt_veiculos: num(pe.qt_veiculos),
    preco_medio: num(pe.preco_medio),
    preco_desvio: num(pe.preco_desvio),
    idade_media: num(pe.idade_media),
    idade_desvio: num(pe.idade_desvio),
    km_medio: num(pe.km_medio),
    km_desvio: num(pe.km_desvio),
    principal_modelo: mo.nome || null,
    pct_modelo: pct(mo.n),
    principal_categoria: ca.nome || null,
    pct_categoria: pct(ca.n)
  };
});

linhas.sort((a, b) => (b.qt_ofertas || 0) - (a.qt_ofertas || 0));

/* ── completude contra o gabarito ───────────────────────────────────── */
const totOfertas = linhas.reduce((s, l) => s + (l.qt_ofertas || 0), 0);
const totVeiculos = linhas.reduce((s, l) => s + (l.qt_veiculos || 0), 0);
const top10 = linhas.slice(0, 10).reduce((s, l) => s + (l.qt_ofertas || 0), 0);
const semPerfil = linhas.filter((l) => l.qt_veiculos === null).length;

const falhas = [];
if (ESPERADO_LOJAS === null) {
  falhas.push('a fase 1 (q_totais) nao voltou: sem gabarito, nao da pra afirmar que a tabela esta completa');
} else if (linhas.length !== ESPERADO_LOJAS) {
  falhas.push('coletei ' + linhas.length + ' lojas mas o banco tem ' + ESPERADO_LOJAS +
    ' com oferta na janela: faltam ' + (ESPERADO_LOJAS - linhas.length));
}
if (ESPERADO_OFERTAS !== null && totOfertas !== ESPERADO_OFERTAS) {
  falhas.push('soma de ofertas ' + totOfertas + ' diverge do total do banco ' + ESPERADO_OFERTAS);
}
if (semPerfil) {
  falhas.push(semPerfil + ' loja(s) sem preco/idade/km: a q_perfil nao cobriu todas');
}

function agrupa(campo) {
  const m = {};
  for (let i = 0; i < linhas.length; i++) {
    const k = linhas[i][campo] || '(vazio)';
    if (!m[k]) m[k] = { chave: k, lojas: 0, ofertas: 0, veiculos: 0, somaPreco: 0, nPreco: 0 };
    m[k].lojas++;
    m[k].ofertas += linhas[i].qt_ofertas || 0;
    m[k].veiculos += linhas[i].qt_veiculos || 0;
    if (linhas[i].preco_medio && linhas[i].qt_veiculos) {
      m[k].somaPreco += linhas[i].preco_medio * linhas[i].qt_veiculos;
      m[k].nPreco += linhas[i].qt_veiculos;
    }
  }
  return Object.keys(m).map((k) => {
    const g = m[k];
    g.preco_medio_ponderado = g.nPreco ? Math.round(g.somaPreco / g.nPreco) : null;
    return g;
  }).sort((a, b) => b.ofertas - a.ofertas);
}
const porWl = agrupa('whitelabel');
const porUf = agrupa('uf');

function modaDe(campo) {
  const m = {};
  for (let i = 0; i < linhas.length; i++) {
    const k = linhas[i][campo];
    if (!k) continue;
    m[k] = (m[k] || 0) + 1;
  }
  return Object.keys(m).map((k) => ({ chave: k, lojas: m[k] }))
    .sort((a, b) => b.lojas - a.lojas).slice(0, 10);
}

const DADOS = {
  gerado_em: new Date().toISOString(),
  meta: META,
  resumo: {
    lojas: linhas.length,
    lojas_esperadas: ESPERADO_LOJAS,
    ofertas: totOfertas,
    ofertas_esperadas: ESPERADO_OFERTAS,
    veiculos: totVeiculos,
    concentracao_top10: totOfertas ? Math.round((top10 / totOfertas) * 1000) / 10 : null,
    whitelabels: porWl.length,
    ufs: porUf.length,
    lojas_sem_perfil: semPerfil,
    empates_modelo: rMo.empates,
    empates_categoria: rCa.empates
  },
  falhas: falhas,
  diagnostico: diagnostico,
  por_whitelabel: porWl,
  por_uf: porUf,
  moda_modelo: modaDe('principal_modelo'),
  moda_categoria: modaDe('principal_categoria'),
  linhas: linhas
};

const problemas = diagnostico.filter((d) => d.veredito !== 'ok').length + falhas.length;

/* JSON embarcado: neutraliza "</" pra nenhum nome de loja fechar o script */
const DADOS_JSON = JSON.stringify(DADOS).split('</').join('<\\/');

const CSS = [
  ':root{--bg:#0f1216;--card:#171c22;--line:#252d36;--tx:#e6edf3;--dim:#8b98a5;',
  '--ac:#4da3ff;--err:#ff6b6b;--ok:#3fb950}',
  '*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);',
  'font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;padding:24px}',
  'h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;margin:28px 0 10px;color:var(--ac)}',
  '.sub{color:var(--dim);font-size:12px;margin-bottom:20px}',
  '.kpis{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:8px}',
  '.kpi{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px 16px;min-width:130px}',
  '.kpi b{display:block;font-size:22px;font-weight:600}',
  '.kpi span{color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:.4px}',
  'table{border-collapse:collapse;width:100%;font-size:12.5px}',
  'th,td{padding:7px 9px;border-bottom:1px solid var(--line);text-align:right;white-space:nowrap}',
  'th{background:var(--card);position:sticky;top:0;cursor:pointer;user-select:none;font-weight:600}',
  'th.tx,td.tx{text-align:left}',
  'tbody tr:hover{background:#1c232b}',
  '.wrap{overflow:auto;max-height:70vh;border:1px solid var(--line);border-radius:8px}',
  '.box{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:14px 16px;margin-bottom:14px}',
  '.box li{margin-bottom:6px}.err{border-color:var(--err)}.err h2{color:var(--err);margin-top:0}',
  '.tag{display:inline-block;padding:1px 7px;border-radius:99px;font-size:11px;background:#243040;color:var(--ac)}',
  'select,input{background:#0d1117;color:var(--tx);border:1px solid var(--line);',
  'border-radius:6px;padding:6px 9px;font-size:13px;margin-right:8px}',
  '.dim{color:var(--dim)}.mono{font-family:ui-monospace,Consolas,monospace;font-size:11.5px}',
  'code{font-family:ui-monospace,Consolas,monospace;font-size:12px;background:#0d1117;padding:1px 5px;border-radius:4px}'
].join('');

const APP = [
  'const $=(s)=>document.querySelector(s);',
  'const nf=(v,d)=>v===null||v===undefined?"\\u2014":Number(v).toLocaleString("pt-BR",{minimumFractionDigits:d||0,maximumFractionDigits:d||0});',
  'const money=(v)=>v===null||v===undefined?"\\u2014":"R$ "+nf(v,0);',
  'const pc=(v)=>v===null||v===undefined?"\\u2014":nf(v,1)+"%";',
  '$("#ger").textContent=new Date(D.gerado_em).toLocaleString("pt-BR");',
  'const R=D.resumo;',
  'const cob=(R.lojas_esperadas?" de "+nf(R.lojas_esperadas):"");',
  '$("#kpis").innerHTML=[["lojas",nf(R.lojas)+cob],["ofertas",nf(R.ofertas)],["veiculos",nf(R.veiculos)],["whitelabels",nf(R.whitelabels)],["UFs",nf(R.ufs)],["top 10 lojas",pc(R.concentracao_top10)]].map(k=>"<div class=\'kpi\'><b>"+k[1]+"</b><span>"+k[0]+"</span></div>").join("");',
  'const probs=D.diagnostico.filter(d=>d.veredito!=="ok");',
  'const av=[];',
  'D.falhas.forEach(f=>av.push("<li>"+f+"</li>"));',
  'probs.forEach(p=>av.push("<li><code>"+p.queryName+"</code>: "+p.veredito+(p.erro?" \\u2014 <span class=\'mono\'>"+p.erro+"</span>":"")+"</li>"));',
  'if(av.length){$("#alerta").innerHTML="<div class=\'box err\'><h2>Esta tabela esta INCOMPLETA \\u2014 "+av.length+" problema(s)</h2><ul>"+av.join("")+"</ul></div>";}',
  'function tabela(el,cols,rows){el.innerHTML="<thead><tr>"+cols.map((c,i)=>"<th"+(c.tx?" class=\'tx\'":"")+">"+c.t+"</th>").join("")+"</tr></thead><tbody>"+rows.map(r=>"<tr>"+cols.map(c=>"<td"+(c.tx?" class=\'tx\'":"")+">"+c.f(r)+"</td>").join("")+"</tr>").join("")+"</tbody>";}',
  'tabela($("#t_wl"),[{t:"Whitelabel",tx:1,f:r=>r.chave},{t:"Lojas",f:r=>nf(r.lojas)},{t:"Ofertas",f:r=>nf(r.ofertas)},{t:"Veiculos",f:r=>nf(r.veiculos)},{t:"Preco medio ponderado",f:r=>money(r.preco_medio_ponderado)}],D.por_whitelabel);',
  'tabela($("#t_uf"),[{t:"UF",tx:1,f:r=>r.chave},{t:"Lojas",f:r=>nf(r.lojas)},{t:"Ofertas",f:r=>nf(r.ofertas)},{t:"Veiculos",f:r=>nf(r.veiculos)},{t:"Preco medio ponderado",f:r=>money(r.preco_medio_ponderado)}],D.por_uf);',
  'tabela($("#t_diag"),[{t:"Query",tx:1,f:r=>r.queryName},{t:"Chamadas",f:r=>nf(r.chamadas)},{t:"Linhas",f:r=>nf(r.linhas)},{t:"Vazias",f:r=>nf(r.vazias)},{t:"Cortadas",f:r=>nf(r.truncadas)},{t:"Veredito",tx:1,f:r=>r.veredito==="ok"?"<span style=\'color:var(--ok)\'>ok</span>":"<span style=\'color:var(--err)\'>"+r.veredito+"</span>"}],D.diagnostico);',
  '$("#modas").innerHTML="<b>Modelos</b><ul>"+D.moda_modelo.map(m=>"<li>"+m.chave+" \\u2014 lidera em <b>"+nf(m.lojas)+"</b> loja(s)</li>").join("")+"</ul><b>Categorias</b><ul>"+D.moda_categoria.map(m=>"<li>"+m.chave+" \\u2014 lidera em <b>"+nf(m.lojas)+"</b> loja(s)</li>").join("")+"</ul>";',
  'const COLS=[',
  '{t:"Whitelabel",tx:1,k:"whitelabel",f:r=>r.whitelabel},',
  '{t:"UF",tx:1,k:"uf",f:r=>r.uf+(r.qt_enderecos>1?" <span class=\'tag\'>"+r.qt_enderecos+" end.</span>":"")},',
  '{t:"Loja",tx:1,k:"loja",f:r=>(r.loja||"\\u2014")+" <span class=\'dim mono\'>#"+r.loja_id+"</span>"},',
  '{t:"Ofertas",k:"qt_ofertas",f:r=>nf(r.qt_ofertas)},',
  '{t:"Veiculos",k:"qt_veiculos",f:r=>nf(r.qt_veiculos)},',
  '{t:"Preco medio",k:"preco_medio",f:r=>money(r.preco_medio)},',
  '{t:"DP preco",k:"preco_desvio",f:r=>money(r.preco_desvio)},',
  '{t:"Idade media",k:"idade_media",f:r=>nf(r.idade_media,1)},',
  '{t:"DP idade",k:"idade_desvio",f:r=>nf(r.idade_desvio,1)},',
  '{t:"Km medio",k:"km_medio",f:r=>nf(r.km_medio)},',
  '{t:"DP km",k:"km_desvio",f:r=>nf(r.km_desvio)},',
  '{t:"Principal modelo",tx:1,k:"principal_modelo",f:r=>r.principal_modelo||"\\u2014"},',
  '{t:"% ofertas",k:"pct_modelo",f:r=>pc(r.pct_modelo)},',
  '{t:"Principal categoria",tx:1,k:"principal_categoria",f:r=>r.principal_categoria||"\\u2014"},',
  '{t:"% ofertas",k:"pct_categoria",f:r=>pc(r.pct_categoria)}];',
  'const uniq=(k)=>Array.from(new Set(D.linhas.map(r=>r[k]))).sort();',
  '$("#f_wl").innerHTML="<option value=\'\'>todos os whitelabels</option>"+uniq("whitelabel").map(v=>"<option>"+v+"</option>").join("");',
  '$("#f_uf").innerHTML="<option value=\'\'>todas as UFs</option>"+uniq("uf").map(v=>"<option>"+v+"</option>").join("");',
  'var ord="qt_ofertas",asc=false;',
  'function render(){',
  'const wl=$("#f_wl").value,uf=$("#f_uf").value,q=$("#f_q").value.toLowerCase();',
  'const rows=D.linhas.filter(r=>(!wl||r.whitelabel===wl)&&(!uf||r.uf===uf)&&(!q||String(r.loja||"").toLowerCase().indexOf(q)>=0)).slice()',
  '.sort((a,b)=>{const x=a[ord],y=b[ord];const s=(x===null||x===undefined)?1:((y===null||y===undefined)?-1:(typeof x==="string"?String(x).localeCompare(String(y)):x-y));return asc?s:-s;});',
  'tabela($("#t"),COLS,rows);',
  '$("#cont").textContent=rows.length+" de "+D.linhas.length+" lojas";',
  'Array.prototype.forEach.call($("#t").querySelectorAll("th"),function(th,i){th.onclick=function(){const k=COLS[i].k;asc=(k===ord)?!asc:false;ord=k;render();};});}',
  '$("#f_wl").onchange=render;$("#f_uf").onchange=render;$("#f_q").oninput=render;render();'
].join('\n');

const html = [
  '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1">',
  '<title>Lojas ofertantes - ultimos ' + META.meses + ' meses</title>',
  '<style>' + CSS + '</style></head><body>',
  '<h1>Lojas que ofertaram nos ultimos ' + META.meses + ' meses</h1>',
  '<div class="sub">Janela a partir de ' + META.data_ini + ' &middot; lado da oferta: <code>offers.' + META.lado + '</code> &middot; gerado em <span id="ger"></span></div>',
  '<div id="alerta"></div>',
  '<div class="kpis" id="kpis"></div>',
  '<h2>Premissas desta leitura</h2>',
  '<div class="box"><ul>',
  '<li><b>"Loja que ofertou"</b> = <code>offers.' + META.lado + '</code>, a loja que <b>deu</b> o lance.</li>',
  '<li><b>Whitelabel</b> vem de <code>shops.whitelabel_id</code>: <code>offers</code> nao tem whitelabel proprio, entao cada loja pertence a exatamente um.</li>',
  '<li><b>UF</b> sai de <code>shop_addresses.state</code> normalizado pelo mesmo de-para da sonda do lote 2. Loja com mais de um endereco aparece marcada na coluna UF: nesses casos a UF foi escolhida por <code>MAX()</code> e merece conferencia.</li>',
  '<li><b>Preco, idade e km</b> saem da <b>ultima oferta de cada veiculo</b> — a de maior <code>offers.id</code> dentro de (loja, veiculo). <b>Os percentuais de modelo e categoria</b> saem do <b>total de ofertas</b>. Sao dois denominadores diferentes de proposito, por isso <code>Ofertas</code> e <code>Veiculos</code> estao as duas na tabela.</li>',
  '<li><b>Idade</b> = ano atual menos <code>vehicles.model_year</code> (ano do modelo, nao de fabricacao). <code>model_year = 0</code> entra como nulo.</li>',
  '<li><b>Desvio padrao</b> = <code>STDDEV_SAMP</code> (amostral). Loja com um unico veiculo aparece vazia: e o comportamento correto, nao falta de dado.</li>',
  '<li><b>Completude</b> e conferida contra <code>q_totais</code>, que conta lojas e ofertas direto no banco. Se a coleta nao fechar com esse numero, o aviso vermelho no topo aparece.</li>',
  '</ul></div>',
  '<h2>Por whitelabel</h2><div class="wrap" style="max-height:none"><table id="t_wl"></table></div>',
  '<h2>Por UF</h2><div class="wrap" style="max-height:none"><table id="t_uf"></table></div>',
  '<h2>Modelos e categorias que lideram em mais lojas</h2><div class="box" id="modas"></div>',
  '<h2>Lojas</h2>',
  '<div style="margin-bottom:10px"><select id="f_wl"></select><select id="f_uf"></select>',
  '<input id="f_q" placeholder="filtrar por nome da loja" size="28">',
  '<span class="dim" id="cont"></span></div>',
  '<div class="wrap"><table id="t"></table></div>',
  '<h2>Diagnostico das queries</h2>',
  '<div class="wrap" style="max-height:none"><table id="t_diag"></table></div>',
  '<script>const D=' + DADOS_JSON + ';</' + 'script>',
  '<script>' + APP + '</' + 'script>',
  '</body></html>'
].join('\n');

return [{
  json: {
    resumo: DADOS.resumo,
    falhas: falhas,
    diagnostico: diagnostico,
    problemas: problemas,
    html_bytes: html.length,
    html: html,
    DADOS: DADOS
  }
}];
