/* ══════════════════════════════════════════════════════════════════════
   NÓ "Montar HTML" — aderência loja x veículo, com filtro cruzado

   ─── ELEGIBILIDADE (a regra que define o universo) ────────────────────
   Um par (veículo, loja) só existe se as DUAS condições valerem:

     1. MESMA UF     — a UF do veículo é a da loja vendedora; a da loja
                       compradora vem do endereço dela.
     2. MESMO WHITELABEL — a loja compradora precisa pertencer a um dos
                       whitelabels que o EVENTO do veículo alveja. Um
                       evento pode alvejar vários (`event_whitelabels`),
                       então a comparação é loja.whitelabel_id ∈ conjunto
                       do evento, não uma igualdade simples.

   Fora disso não há aderência — nem baixa, nem zero: o par não existe.
   Por isso o ranking de cada veículo é curto: ele só disputa dentro da
   própria praça e do próprio canal.

   ─── A FÓRMULA ────────────────────────────────────────────────────────
   Cinco componentes. Cada um tem uma ADERÊNCIA (0..1) e um PESO (0..1).

     preço, idade, km:  aderência = 1 / (1 + |valor − média| / desvio)
                        peso      = 1 / (1 + desvio / média)     ← CV

       Loja de faixa apertada é previsível, então acertar o número dela
       vale muito. Loja que compra de tudo tem CV alto e o peso cai
       sozinho, porque o indicador não informa.

     modelo, categoria: aderência = 1 se bate com o item mais ofertado
                        peso      = o % de ofertas da loja naquele item

   score = Σ(peso × aderência) / Σ(peso), de 0 a 100.

   `CONFIANCA_MIN` é adição minha, não estava no pedido: multiplica o
   score por min(1, veículos / 5) para loja de histórico minúsculo não
   liderar por sorte. Ponha 1 para desligar.

   Volume de ofertas NÃO entra no score — está na tela como leitura.
   ══════════════════════════════════════════════════════════════════════ */

const CONFIANCA_MIN = 5;

const pedidos = $('Montar Fase 2').all().map((i) => i.json);
const outs = $('MCP Fase 2').all();
const META = pedidos.length ? pedidos[0].meta : {};

function erroTexto(e) {
  if (!e) return null;
  if (typeof e === 'string') return e.slice(0, 300);
  if (Array.isArray(e)) return e.map(erroTexto).join(' | ').slice(0, 300);
  if (e.message) return String(e.message).slice(0, 300);
  if (e.error) return erroTexto(e.error);
  try { return JSON.stringify(e).slice(0, 300); } catch (x) { return String(e).slice(0, 300); }
}

/* ── ingestão ───────────────────────────────────────────────────────── */
const dados = {};
const diag = {};
for (let i = 0; i < pedidos.length; i++) {
  const nome = pedidos[i].queryName;
  if (!dados[nome]) dados[nome] = [];
  if (!diag[nome]) diag[nome] = { queryName: nome, chamadas: 0, linhas: 0, vazias: 0, truncadas: 0, erro: null };
  diag[nome].chamadas++;
  const o = outs[i] ? outs[i].json : null;
  const sc = o ? (o.structuredContent || o) : null;
  const err = o ? (o.error || (sc && sc.error)) : null;
  if (err && !diag[nome].erro) diag[nome].erro = erroTexto(err);
  if (sc && sc.truncated) diag[nome].truncadas++;
  const cols = (sc && sc.columns) || [];
  const rows = (sc && sc.rows) || [];
  if (!rows.length) { diag[nome].vazias++; continue; }
  diag[nome].linhas += rows.length;
  for (let r = 0; r < rows.length; r++) {
    const obj = {};
    for (let c = 0; c < cols.length; c++) obj[cols[c]] = rows[r][c];
    dados[nome].push(obj);
  }
}
const diagnostico = Object.keys(diag).map((k) => {
  const d = diag[k];
  d.veredito = d.erro ? 'ERRO'
    : (d.truncadas ? 'RESPOSTA CORTADA - pagina maior que o teto do MCP'
      : (d.linhas === 0 ? 'ZERO LINHAS' : 'ok'));
  return d;
});

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
function indexa(arr, chave) {
  const m = {};
  for (let i = 0; i < arr.length; i++) m[String(arr[i][chave])] = arr[i];
  return m;
}
function primeiraPorLoja(arr) {
  const m = {};
  for (let i = 0; i < arr.length; i++) {
    const k = String(arr[i].shop_id);
    if (!m[k]) m[k] = arr[i];
  }
  return m;
}

/* ── mapa evento -> whitelabels que ele alveja ──────────────────────── */
const eventoWl = {};
const wlNome = {};
(META.evento_wl || []).forEach((r) => {
  const e = String(r.evento_id);
  if (!eventoWl[e]) eventoWl[e] = {};
  eventoWl[e][String(r.whitelabel_id)] = 1;
  if (r.whitelabel) wlNome[String(r.whitelabel_id)] = r.whitelabel;
});

/* ── perfil das lojas ───────────────────────────────────────────────── */
const iOf = indexa(dados.q_ofertas || [], 'shop_id');
const iPe = indexa(dados.q_perfil || [], 'shop_id');
const iMo = primeiraPorLoja(dados.q_modelo || []);
const iCa = primeiraPorLoja(dados.q_categoria || []);

function pesoNum(media, desvio) {
  if (!media || media <= 0) return 0;
  if (desvio === null || desvio === undefined || desvio < 0) return 0;
  return 1 / (1 + (desvio / media));
}

const lojasTodas = (dados.q_lojas || []).map((s) => {
  const k = String(s.shop_id);
  const of = iOf[k] || {};
  const pe = iPe[k] || {};
  const mo = iMo[k] || {};
  const ca = iCa[k] || {};
  const qtOfertas = num(of.qt_ofertas);
  const pct = (n) => (qtOfertas && n ? Number(n) / qtOfertas : 0);
  const precoMedio = num(pe.preco_medio);
  const precoDesvio = num(pe.preco_desvio);
  const idadeMedia = num(pe.idade_media);
  const idadeDesvio = num(pe.idade_desvio);
  const kmMedio = num(pe.km_medio);
  const kmDesvio = num(pe.km_desvio);
  const qtVeiculos = num(pe.qt_veiculos);
  return {
    loja_id: num(s.shop_id), loja: s.loja,
    whitelabel_id: num(s.whitelabel_id),
    whitelabel: s.whitelabel || ('whitelabel #' + s.whitelabel_id),
    uf: s.uf || 'Nao identificada',
    qt_ofertas: qtOfertas, qt_veiculos: qtVeiculos,
    preco_medio: precoMedio, preco_desvio: precoDesvio,
    idade_media: idadeMedia, idade_desvio: idadeDesvio,
    km_medio: kmMedio, km_desvio: kmDesvio,
    modelo_id: num(mo.item_id), modelo: mo.nome || null, pct_modelo: pct(mo.n),
    categoria_id: num(ca.item_id), categoria: ca.nome || null, pct_categoria: pct(ca.n),
    p_preco: pesoNum(precoMedio, precoDesvio),
    p_idade: pesoNum(idadeMedia, idadeDesvio),
    p_km: pesoNum(kmMedio, kmDesvio),
    confianca: Math.min(1, (qtVeiculos || 0) / CONFIANCA_MIN),
    amostra_baixa: (qtVeiculos || 0) < CONFIANCA_MIN
  };
}).filter((l) => l.qt_veiculos);

/* ── veículos ───────────────────────────────────────────────────────── */
const vistos = {};
let dupVeic = 0;
const ANO = new Date().getFullYear();
const veiculos = [];
(dados.q_veiculos || []).forEach((r) => {
  const k = String(r.neg_id);
  if (vistos[k]) { dupVeic++; return; }
  vistos[k] = 1;
  const my = num(r.model_year);
  const evid = num(r.evento_id);
  const wls = Object.keys(eventoWl[String(evid)] || {}).map(Number);
  veiculos.push({
    neg_id: num(r.neg_id), vehicle_id: num(r.vehicle_id),
    evento_id: evid, evento: r.evento, fim_evento: r.fim_evento,
    valor: num(r.valor), fipe: num(r.fipe),
    model_id: num(r.model_id), modelo: r.modelo,
    category_id: num(r.category_id), categoria: r.categoria,
    marca: r.marca, model_year: my, idade: my ? ANO - my : null, km: num(r.km),
    loja_id: num(r.loja_id), loja_vendedora: r.loja_vendedora, uf: r.uf,
    wls: wls,
    wl_nomes: wls.map((w) => wlNome[String(w)] || ('#' + w)).join(', ')
  });
});

/* ── aderência, só entre pares elegíveis ────────────────────────────── */
function adNum(valor, media, desvio) {
  if (valor === null || media === null || !media) return null;
  if (desvio && desvio > 0) return 1 / (1 + (Math.abs(valor - media) / desvio));
  return 1 / (1 + (Math.abs(valor - media) / media));
}
function pontua(v, l) {
  const comps = [];
  const aP = adNum(v.valor, l.preco_medio, l.preco_desvio);
  if (aP !== null && l.p_preco > 0) comps.push({ k: 'preco', a: aP, p: l.p_preco });
  const aI = adNum(v.idade, l.idade_media, l.idade_desvio);
  if (aI !== null && l.p_idade > 0) comps.push({ k: 'idade', a: aI, p: l.p_idade });
  const aK = adNum(v.km, l.km_medio, l.km_desvio);
  if (aK !== null && l.p_km > 0) comps.push({ k: 'km', a: aK, p: l.p_km });
  if (l.pct_modelo > 0 && v.model_id !== null) {
    comps.push({ k: 'modelo', a: (v.model_id === l.modelo_id ? 1 : 0), p: l.pct_modelo });
  }
  if (l.pct_categoria > 0 && v.category_id !== null) {
    comps.push({ k: 'categoria', a: (v.category_id === l.categoria_id ? 1 : 0), p: l.pct_categoria });
  }
  if (!comps.length) return null;
  let somaP = 0, somaPA = 0;
  for (let i = 0; i < comps.length; i++) { somaP += comps[i].p; somaPA += comps[i].p * comps[i].a; }
  if (somaP <= 0) return null;
  const det = {};
  for (let i = 0; i < comps.length; i++) det[comps[i].k] = Math.round(comps[i].a * 100);
  return { score: (somaPA / somaP) * l.confianca * 100, det: det };
}

/* índice de lojas por UF, pra não varrer as 1.300 em cada veículo */
const porUf = {};
lojasTodas.forEach((l, i) => {
  if (!porUf[l.uf]) porUf[l.uf] = [];
  porUf[l.uf].push(i);
});

const pares = [];          /* flat: [vi, li, score*10, det...] */
const detPares = [];       /* decomposição, mesmo índice do par */
const usadas = {};
veiculos.forEach((v, vi) => {
  const cands = porUf[v.uf] || [];
  const wlSet = {};
  v.wls.forEach((w) => { wlSet[String(w)] = 1; });
  let n = 0;
  for (let i = 0; i < cands.length; i++) {
    const l = lojasTodas[cands[i]];
    if (!wlSet[String(l.whitelabel_id)]) continue;   /* whitelabel do evento */
    const r = pontua(v, l);
    if (!r || !(r.score > 0)) continue;
    pares.push(vi, cands[i], Math.round(r.score * 10));
    detPares.push(r.det);
    usadas[cands[i]] = 1;
    n++;
  }
  v.candidatos = n;
});

/* só publica as lojas que participam de pelo menos um par */
const mapaLoja = {};
const lojas = [];
Object.keys(usadas).map(Number).sort((a, b) => a - b).forEach((idx) => {
  mapaLoja[idx] = lojas.length;
  const l = lojasTodas[idx];
  lojas.push({
    loja_id: l.loja_id, loja: l.loja, uf: l.uf,
    whitelabel: l.whitelabel, whitelabel_id: l.whitelabel_id,
    qt_ofertas: l.qt_ofertas, qt_veiculos: l.qt_veiculos,
    preco_medio: l.preco_medio, preco_desvio: l.preco_desvio,
    idade_media: l.idade_media, idade_desvio: l.idade_desvio,
    km_medio: l.km_medio, km_desvio: l.km_desvio,
    p_preco: Math.round(l.p_preco * 1000) / 1000,
    p_idade: Math.round(l.p_idade * 1000) / 1000,
    p_km: Math.round(l.p_km * 1000) / 1000,
    confianca: Math.round(l.confianca * 100) / 100,
    modelo: l.modelo, categoria: l.categoria,
    pct_modelo: Math.round(l.pct_modelo * 1000) / 10,
    pct_categoria: Math.round(l.pct_categoria * 1000) / 10,
    amostra_baixa: l.amostra_baixa
  });
});
/* reindexa os pares para o array publicado */
for (let i = 1; i < pares.length; i += 3) pares[i] = mapaLoja[pares[i]];

/* melhor score de cada lado, pra ordenação inicial */
const melhorV = new Array(veiculos.length).fill(0);
const melhorL = new Array(lojas.length).fill(0);
const nParesL = new Array(lojas.length).fill(0);
for (let i = 0; i < pares.length; i += 3) {
  const vi = pares[i], li = pares[i + 1], s = pares[i + 2] / 10;
  if (s > melhorV[vi]) melhorV[vi] = s;
  if (s > melhorL[li]) melhorL[li] = s;
  nParesL[li]++;
}
veiculos.forEach((v, i) => { v.melhor = v.candidatos ? melhorV[i] : null; });
lojas.forEach((l, i) => { l.melhor = melhorL[i]; l.pares = nParesL[i]; });

/* ── completude ─────────────────────────────────────────────────────── */
const falhas = [];
if (META.esperado_veiculos && veiculos.length !== META.esperado_veiculos) {
  falhas.push('coletei ' + veiculos.length + ' veiculos mas a fase 1 contou ' +
    META.esperado_veiculos + ': faltam ' + (META.esperado_veiculos - veiculos.length));
}
if (META.esperado_lojas && lojasTodas.length !== META.esperado_lojas) {
  falhas.push('perfil montado para ' + lojasTodas.length + ' lojas mas a fase 1 contou ' + META.esperado_lojas);
}
const semValor = veiculos.filter((v) => !v.valor).length;
if (semValor) falhas.push(semValor + ' veiculo(s) sem value_actual: ficam sem o componente de preco');
if (dupVeic) falhas.push(dupVeic + ' linha(s) duplicada(s) de veiculo descartada(s)');
const semWl = veiculos.filter((v) => !v.wls.length).length;
if (semWl) falhas.push(semWl + ' veiculo(s) em evento sem whitelabel declarado: ficam sem nenhuma loja elegivel');
const semPar = veiculos.filter((v) => !v.candidatos).length;
if (semPar) falhas.push(semPar + ' veiculo(s) sem nenhuma loja na mesma UF e whitelabel');

const DADOS = {
  gerado_em: new Date().toISOString(),
  meta: {
    meses_historico: META.meses_historico, data_ini: META.data_ini,
    esperado_veiculos: META.esperado_veiculos, esperado_lojas: META.esperado_lojas,
    cobertura_valor: META.cobertura_valor
  },
  parametros: { confianca_min: CONFIANCA_MIN },
  resumo: {
    veiculos: veiculos.length,
    lojas_elegiveis: lojas.length,
    lojas_no_universo: lojasTodas.length,
    pares: pares.length / 3,
    eventos: (META.eventos || []).length,
    sem_par: semPar,
    media_candidatos: veiculos.length
      ? Math.round(veiculos.reduce((s, v) => s + v.candidatos, 0) / veiculos.length) : 0
  },
  falhas: falhas,
  diagnostico: diagnostico,
  eventos: META.eventos || [],
  veiculos: veiculos,
  lojas: lojas,
  pares: pares,
  det: detPares
};

const problemas = diagnostico.filter((d) => d.veredito !== 'ok').length + falhas.length;
const DADOS_JSON = JSON.stringify(DADOS).split('</').join('<\\/');

/* ==== RENDER:INICIO ==== (daqui pra baixo tudo depende so de DADOS,
   entao monta_html_de_dados.js reusa este trecho pra regerar o HTML sem
   rodar o workflow de novo. Mexeu so na tela? roda o script local.) */
const CSS = [
  ':root{--bg:#0f1216;--card:#171c22;--line:#252d36;--tx:#e6edf3;--dim:#8b98a5;',
  '--ac:#4da3ff;--err:#ff6b6b;--ok:#3fb950;--warn:#ffb454}',
  '*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);',
  'font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;padding:20px}',
  'h1{font-size:20px;margin:0 0 4px}h2{font-size:14px;margin:0 0 8px;color:var(--ac)}',
  '.sub{color:var(--dim);font-size:12px;margin-bottom:14px}',
  '.kpis{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}',
  '.kpi{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:9px 13px;min-width:104px}',
  '.kpi b{display:block;font-size:19px;font-weight:600}',
  '.kpi span{color:var(--dim);font-size:10.5px;text-transform:uppercase;letter-spacing:.4px}',
  'table{border-collapse:collapse;width:100%;font-size:12px}',
  'th,td{padding:5px 8px;border-bottom:1px solid var(--line);text-align:right;white-space:nowrap}',
  'th{background:var(--card);position:sticky;top:0;font-weight:600;z-index:1}',
  'th.tx,td.tx{text-align:left}',
  'tbody tr{cursor:pointer}tbody tr:hover{background:#1c232b}',
  'tr.sel{background:#1e3a5f}',
  '.wrap{overflow:auto;max-height:66vh;border:1px solid var(--line);border-radius:8px}',
  '.box{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px 15px;margin-bottom:12px}',
  '.box li{margin-bottom:4px}.err{border-color:var(--err)}.err h2{color:var(--err)}',
  '.tag{display:inline-block;padding:0 6px;border-radius:99px;font-size:10px;background:#243040;color:var(--ac)}',
  '.tag.w{background:#3a2f18;color:var(--warn)}',
  'select,input,button{background:#0d1117;color:var(--tx);border:1px solid var(--line);',
  'border-radius:6px;padding:5px 9px;font-size:12.5px;margin-right:6px}',
  'button{cursor:pointer}button:hover{border-color:var(--ac)}',
  '.dim{color:var(--dim)}.mono{font-family:ui-monospace,Consolas,monospace;font-size:11px}',
  'code{font-family:ui-monospace,Consolas,monospace;font-size:11.5px;background:#0d1117;padding:0 4px;border-radius:4px}',
  '.bar{display:inline-block;height:7px;background:var(--ac);border-radius:2px;vertical-align:middle}',
  '.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}',
  '@media(max-width:1200px){.grid{grid-template-columns:1fr}}',
  '.pane h2 span{color:var(--dim);font-weight:400;font-size:12px}',
  '.ctx{background:#1e2836;border:1px solid var(--ac);border-radius:8px;padding:9px 13px;margin-bottom:10px;font-size:12.5px}'
].join('');

const APP = [
  'const $=(s)=>document.querySelector(s);',
  'const nf=(v,d)=>v===null||v===undefined?"\\u2014":Number(v).toLocaleString("pt-BR",{minimumFractionDigits:d||0,maximumFractionDigits:d||0});',
  'const money=(v)=>v===null||v===undefined?"\\u2014":"R$ "+nf(v,0);',
  'const esc=(s)=>String(s===null||s===undefined?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;");',
  '$("#ger").textContent=new Date(D.gerado_em).toLocaleString("pt-BR");',
  'const R=D.resumo;',
  '$("#kpis").innerHTML=[["veiculos",nf(R.veiculos)],["lojas elegiveis",nf(R.lojas_elegiveis)],["pares",nf(R.pares)],["media de lojas por veiculo",nf(R.media_candidatos)],["veiculos sem par",nf(R.sem_par)],["eventos",nf(R.eventos)]].map(k=>"<div class=\'kpi\'><b>"+k[1]+"</b><span>"+k[0]+"</span></div>").join("");',
  'const av=[];D.falhas.forEach(f=>av.push("<li>"+esc(f)+"</li>"));',
  'D.diagnostico.filter(d=>d.veredito!=="ok").forEach(p=>av.push("<li><code>"+p.queryName+"</code>: "+esc(p.veredito)+(p.erro?" \\u2014 <span class=\'mono\'>"+esc(p.erro)+"</span>":"")+"</li>"));',
  'if(av.length){$("#alerta").innerHTML="<div class=\'box err\'><h2>"+av.length+" ponto(s) de atencao</h2><ul>"+av.join("")+"</ul></div>";}',
  /* indexa os pares nas duas direcoes */
  'const P=D.pares,DET=D.det;',
  'const porV={},porL={};',
  'for(let i=0,k=0;i<P.length;i+=3,k++){const vi=P[i],li=P[i+1],s=P[i+2]/10;',
  '(porV[vi]=porV[vi]||[]).push({o:li,s:s,d:DET[k]});',
  '(porL[li]=porL[li]||[]).push({o:vi,s:s,d:DET[k]});}',
  'for(const k in porV)porV[k].sort((a,b)=>b.s-a.s);',
  'for(const k in porL)porL[k].sort((a,b)=>b.s-a.s);',
  'const evs=Array.from(new Set(D.veiculos.map(v=>v.evento))).sort();',
  '$("#f_ev").innerHTML="<option value=\'\'>todos os eventos ("+D.veiculos.length+")</option>"+evs.map(function(e,i){return "<option value=\'"+i+"\'>"+esc(e)+" ("+D.veiculos.filter(function(v){return v.evento===e;}).length+")</option>";}).join("");',
  'var selV=null,selL=null;',
  'function barra(s){return "<span class=\'bar\' style=\'width:"+Math.round(s/2.2)+"px\'></span> "+nf(s,1);}',
  'function celulas(s,conf){if(s===null||s===undefined)return "<td>\u2014</td><td>\u2014</td>";const c=conf||1;const bruto=s/c;return "<td>"+nf(bruto,1)+"</td><td>"+barra(s)+"</td>";}',
  'function det(d){if(!d)return "";const p=[];["preco","idade","km","modelo","categoria"].forEach(k=>{if(d[k]!==undefined)p.push(k[0].toUpperCase()+" "+d[k]);});return "<span class=\'dim mono\'>"+p.join(" \\u00b7 ")+"</span>";}',
  /* ---- veiculos ---- */
  'function linhasV(){',
  'const q=$("#f_v").value.toLowerCase();',
  'const evi=$("#f_ev").value;',
  'const ev=(evi===""?null:evs[Number(evi)]);',
  'let base;',
  'if(selL!==null){base=(porL[selL]||[]).map(x=>({v:D.veiculos[x.o],i:x.o,s:x.s,d:x.d}));}',
  'else{base=D.veiculos.map((v,i)=>({v:v,i:i,s:v.melhor,d:null}));base.sort((a,b)=>(b.s||0)-(a.s||0));}',
  'return base.filter(r=>(!ev||r.v.evento===ev)&&(!q||((r.v.marca||"")+" "+(r.v.modelo||"")).toLowerCase().indexOf(q)>=0));}',
  'function pintaV(){',
  'const rows=linhasV();',
  'const comScore=selL!==null;',
  '$("#cv").textContent=rows.length+" de "+D.veiculos.length;',
  '$("#t_v").innerHTML="<thead><tr><th class=\'tx\'>Veiculo</th><th class=\'tx\'>Categoria</th><th>Ano</th><th>Km</th><th>Valor</th><th class=\'tx\'>UF</th><th class=\'tx\'>Evento</th>"+(comScore?"<th>Aderencia</th><th>Score</th>":"<th>Melhor score</th>")+"<th>Lojas</th></tr></thead><tbody>"+',
  'rows.map(r=>"<tr data-i=\'"+r.i+"\' class=\'"+(r.i===selV?"sel":"")+"\'>"+',
  '"<td class=\'tx\'>"+esc((r.v.marca?r.v.marca+" ":"")+(r.v.modelo||"?"))+" <span class=\'dim mono\'>#"+r.v.vehicle_id+"</span></td>"+',
  '"<td class=\'tx\'>"+esc(r.v.categoria||"\\u2014")+"</td><td>"+(r.v.model_year||"\\u2014")+"</td><td>"+nf(r.v.km)+"</td><td>"+money(r.v.valor)+"</td>"+',
  '"<td class=\'tx\'>"+esc(r.v.uf)+"</td><td class=\'tx\'>"+esc(r.v.evento)+"</td>"+',
  '(comScore?celulas(r.s,D.lojas[selL].confianca):"<td>"+(r.s===null?"\\u2014":barra(r.s))+"</td>")+"<td>"+nf(r.v.candidatos)+"</td></tr>").join("")+"</tbody>";',
  'Array.prototype.forEach.call($("#t_v").querySelectorAll("tbody tr"),function(tr){tr.onclick=function(){const i=Number(tr.getAttribute("data-i"));selV=(selV===i?null:i);selL=null;pinta();};});}',
  /* ---- lojas ---- */
  'function linhasL(){',
  'const q=$("#f_l").value.toLowerCase();',
  'let base;',
  'if(selV!==null){base=(porV[selV]||[]).map(x=>({l:D.lojas[x.o],i:x.o,s:x.s,d:x.d}));}',
  'else{base=D.lojas.map((l,i)=>({l:l,i:i,s:l.melhor,d:null}));base.sort((a,b)=>(b.s||0)-(a.s||0));}',
  'return base.filter(r=>!q||((r.l.loja||"")+" "+(r.l.uf||"")+" "+(r.l.whitelabel||"")+" "+(r.l.modelo||"")+" "+(r.l.categoria||"")).toLowerCase().indexOf(q)>=0);}',
  'function pintaL(){',
  'const rows=linhasL();',
  'const comScore=selV!==null;',
  '$("#cl").textContent=rows.length+" de "+D.lojas.length;',
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
  'function ctx(){',
  'if(selV!==null){const v=D.veiculos[selV];',
  '$("#ctx").innerHTML="<b>"+esc((v.marca?v.marca+" ":"")+(v.modelo||"?"))+" "+(v.model_year||"")+"</b> \\u00b7 "+money(v.valor)+" \\u00b7 "+nf(v.km)+" km \\u00b7 "+esc(v.uf)+" \\u00b7 "+esc(v.evento)+"<br><span class=\'dim\'>Lojas elegiveis: mesma UF (<b>"+esc(v.uf)+"</b>) e whitelabel do evento (<b>"+esc(v.wl_nomes||"nenhum")+"</b>) \\u2014 "+nf(v.candidatos)+" loja(s), ordenadas por aderencia.</span>";',
  '$("#ctx").style.display="";return;}',
  'if(selL!==null){const l=D.lojas[selL];',
  '$("#ctx").innerHTML="<b>"+esc(l.loja)+"</b> \\u00b7 "+esc(l.uf)+" \\u00b7 "+esc(l.whitelabel)+" \\u00b7 perfil: "+money(l.preco_medio)+" \\u00b7 "+nf(l.idade_media,1)+" anos \\u00b7 "+nf(l.km_medio)+" km \\u00b7 "+esc(l.modelo||"?")+" ("+nf(l.pct_modelo,1)+"% das ofertas)<br><span class=\'dim\'>Veiculos elegiveis: "+nf(l.pares)+", ordenados por aderencia.</span>";',
  '$("#ctx").style.display="";return;}',
  '$("#ctx").style.display="none";}',
  'const LIMIAR=70;',
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
  'const acima=(porL[selL]||[]).filter(function(x){return x.s>LIMIAR;});',
  'const listaV=acima.length?("<div class=\'wrap\' style=\'max-height:40vh\'><table><thead><tr><th>Aderencia</th><th>Score</th><th class=\'tx\'>Veiculo</th><th class=\'tx\'>Categoria</th><th>Ano</th><th>Km</th><th>Valor</th><th class=\'tx\'>Evento</th><th class=\'tx\'>Componentes</th></tr></thead><tbody>"+acima.map(function(x){const v=D.veiculos[x.o];return "<tr>"+celulas(x.s,l.confianca)+"<td class=\'tx\'>"+esc((v.marca?v.marca+" ":"")+(v.modelo||"?"))+" <span class=\'dim mono\'>#"+v.vehicle_id+"</span></td><td class=\'tx\'>"+esc(v.categoria||"\\u2014")+"</td><td>"+(v.model_year||"\\u2014")+"</td><td>"+nf(v.km)+"</td><td>"+money(v.valor)+"</td><td class=\'tx\'>"+esc(v.evento)+"</td><td class=\'tx\'>"+det(x.d)+"</td></tr>";}).join("")+"</tbody></table></div>")',
  ':("<div class=\'dim\'>Nenhum veiculo elegivel passa de "+LIMIAR+"% de aderencia para esta loja. O melhor e "+nf(l.melhor,1)+"%.</div>");',
  '$("#extrato").innerHTML="<h2>Extrato da loja &mdash; "+esc(l.loja)+" <span class=\'dim mono\'>#"+l.loja_id+"</span></h2>"+',
  '"<div class=\'box\'><div style=\'margin-bottom:8px\'>"+esc(l.uf)+" &middot; "+esc(l.whitelabel)+" &middot; <b>"+nf(l.qt_ofertas)+"</b> ofertas em <b>"+nf(l.qt_veiculos)+"</b> veiculos nos ultimos 6 meses"+(l.amostra_baixa?" <span class=\'tag w\'>amostra baixa</span>":"")+" &middot; fator de confianca <b>"+nf(l.confianca,2)+"</b> &middot; elegivel para <b>"+nf(l.pares)+"</b> veiculo(s)</div>"+',
  '"<table><thead><tr><th class=\'tx\'>Indicador</th><th>Referencia</th><th>Desvio</th><th>CV</th><th>Peso</th><th class=\'tx\'>Leitura</th></tr></thead><tbody>"+linhas.join("")+"</tbody></table>"+',
  '"<div class=\'dim\' style=\'margin-top:8px\'>O <b>peso</b> sai de 1/(1 + desvio/media) nos numericos e do % de ofertas em modelo e categoria. CV baixo = loja previsivel = indicador pesa mais.</div></div>"+',
  '"<h2>Veiculos com aderencia acima de "+LIMIAR+"% <span class=\'dim\'>("+acima.length+" de "+nf(l.pares)+" elegiveis)</span></h2>"+listaV;',
  '$("#extrato").style.display="";}',
  'function pinta(){ctx();pintaV();pintaL();extrato();}',
  '$("#f_v").oninput=pintaV;$("#f_l").oninput=pintaL;$("#f_ev").onchange=pintaV;',
  '$("#limpar").onclick=function(){selV=null;selL=null;$("#f_v").value="";$("#f_l").value="";$("#f_ev").value="";pinta();};',
  'pinta();'
].join('\n');

const html = [
  '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1">',
  '<title>Veiculos x lojas - filtro cruzado</title>',
  '<style>' + CSS + '</style></head><body>',
  '<h1>Veiculos em evento &times; lojas &mdash; filtro cruzado</h1>',
  '<div class="sub">Clique num <b>veiculo</b> para ordenar as lojas por aderencia; clique numa <b>loja</b> para ordenar os veiculos. Clicar de novo desmarca. &middot; perfil de compra dos ultimos ' + (META.meses_historico || 6) + ' meses (desde ' + (META.data_ini || '?') + ') &middot; preco = <code>value_actual</code> &middot; gerado em <span id="ger"></span></div>',
  '<div id="alerta"></div>',
  '<div class="kpis" id="kpis"></div>',
  '<div class="box"><h2>A regra de elegibilidade</h2>',
  '<p style="margin:0 0 6px">Um par (veiculo, loja) <b>so existe</b> se a loja estiver na <b>mesma UF</b> do veiculo <b>e</b> pertencer a um dos <b>whitelabels que o evento alveja</b>. Fora disso nao ha aderencia baixa: o par simplesmente nao existe, e por isso o ranking de cada veiculo e curto &mdash; ele so disputa dentro da propria praca e do proprio canal.</p>',
  '<p style="margin:0" class="dim">Score = &Sigma;(peso &times; aderencia) / &Sigma;(peso). Nos numericos, aderencia = <code>1/(1 + |valor &minus; media|/desvio)</code> e peso = <code>1/(1 + desvio/media)</code>: loja de faixa apertada e previsivel, entao acertar o numero dela vale muito; loja que compra de tudo tem peso baixo porque o indicador nao informa. Modelo e categoria pesam pelo <b>% de ofertas</b> da loja naquele item. O score e multiplicado por <code>min(1, veiculos/' + CONFIANCA_MIN + ')</code> para loja de historico minusculo nao liderar por sorte &mdash; <b>essa parte foi adicao minha, nao estava no pedido</b>. Volume de ofertas nao entra no score.</p></div>',
  '<div style="margin-bottom:10px"><button id="limpar">limpar selecao</button></div>',
  '<div id="ctx" class="ctx" style="display:none"></div>',
  '<div class="grid">',
  '<div class="pane"><h2>Veiculos <span id="cv"></span></h2>',
  '<div style="margin-bottom:6px"><select id="f_ev"></select>',
  '<input id="f_v" placeholder="filtrar marca ou modelo" size="26"></div>',
  '<div class="wrap"><table id="t_v"></table></div></div>',
  '<div class="pane"><h2>Lojas <span id="cl"></span></h2>',
  '<div style="margin-bottom:6px"><input id="f_l" placeholder="filtrar loja, UF, whitelabel, modelo ou categoria" size="36"></div>',
  '<div class="wrap"><table id="t_l"></table></div></div>',
  '</div>',
  '<div id="extrato" style="display:none"></div>',
  '<script>const D=' + DADOS_JSON + ';</' + 'script>',
  '<script>' + APP + '</' + 'script>',
  '</body></html>'
].join('\n');

/* ==== RENDER:FIM ==== */

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
