const qn = $('Montar Queries').all().map(function(i){ return i.json.queryName; });
const outs = $('MCP Run').all().map(function(i){ return i.json.structuredContent || {}; });
function idxAll(name){ const arr = []; for (let i=0;i<qn.length;i++){ if (qn[i]===name) arr.push(i); } return arr; } function zipn(name){ let result = []; idxAll(name).forEach(function(k){ const sc = outs[k] || {}; const cols = sc.columns || []; const rows = sc.rows || []; result = result.concat(rows.map(function(r){ const o = {}; cols.forEach(function(c,i){ o[c] = r[i]; }); return o; })); }); return result; }
function zipnRaw(name){ let result = []; idxAll(name).forEach(function(k){ const sc = outs[k] || {}; result = result.concat(sc.rows || []); }); return result; }

/* [port multi-WL, 2026-09-04] kpi e situacao foram substituidas pela query
   de coorte no lote 1b — a antiga estourava o deadline do MCP na escala da
   plataforma (10 subqueries independentes sobre 29.010 clientes).
   A coorte devolve 1 linha por safra (mes de cadastro). Como as safras sao
   particoes DISJUNTAS, somar os meses reproduz exatamente os totais que o
   kpi dava — e ainda deixa o dado pronto pra filtrar por safra no cliente.
   Este adaptador remonta os mesmos objetos que o resto do arquivo espera,
   entao nada abaixo desta linha precisou mudar. */
const coorte = zipn('coorte');
function _cSum(campo){
  let t = 0;
  for (let i = 0; i < coorte.length; i++){ t += Number(coorte[i][campo]) || 0; }
  return t;
}
function _cMax(campo){
  let m = null;
  for (let i = 0; i < coorte.length; i++){
    const v = coorte[i][campo];
    if (v && (m === null || String(v) > String(m))) m = v;
  }
  return m;
}
const kpi = {
  total_base:    _cSum('total'),
  com_login:     _cSum('com_login'),
  ofertantes:    _cSum('ofertantes'),
  compradores:   _cSum('compradores'),
  negociacoes:   _cSum('negociacoes'),
  volume:        _cSum('volume'),
  status7:       _cSum('vendido'),
  status2:       _cSum('status2'),
  ultima_compra: _cMax('ultima_compra')
};
const situ = [1,2,3,4,5,6].map(function(n){
  return { situation: n, qtd: _cSum('s' + n) };
});
const rec = zipn('recencia');
const evLogin = zipn('evol_login');
const evOferta = zipn('evol_oferta');
const evCompra = zipn('evol_compra');
const evCadastro = zipn('evol_cadastro');
const evCadastroDia = zipn('evol_cadastro_dia');
const evMedia = zipn('evol_media_oferta');
const topHist = zipn('top_compradores_hist');
const topAno = zipn('top_compradores_ano');
const topAcesso = zipn('top_acesso_ano');
const topOfertas = zipn('top_ofertas_ano');
const ufCadastro = zipn('uf_cadastro');
const ufCompra = zipn('uf_compra');
const topLojas = zipn('top_lojas');

/* [BC-17/BC-17b] Loja + CNPJ como subtitulo do nome, nos 4 Top 10 e no Raio-X.
   CNPJ chega cru do banco (14 digitos) e e formatado aqui. Usuario com mais de
   uma loja: nomes juntados com ' / ' e CNPJ da primeira (a query ja vem ordenada
   por us.created_at). Sem loja vinculada: nada e exibido (nunca 'Loja nao identificada'). */
function fmtCnpj(c){ c = String(c==null?'':c).replace(/\D/g,''); if (c.length!==14) return ''; return c.slice(0,2)+'.'+c.slice(2,5)+'.'+c.slice(5,8)+'/'+c.slice(8,12)+'-'+c.slice(12); }
const lojaTop = (function(){ const m = {}; topLojas.forEach(function(r){ const id = r.user_id; if (id==null || !r.loja) return; if (!m[id]) m[id] = { nomes: [], cnpj: fmtCnpj(r.cnpj) }; if (m[id].nomes.indexOf(r.loja) < 0) m[id].nomes.push(r.loja); }); const out = {}; for (const id in m) out[id] = [m[id].nomes.join(' / '), m[id].cnpj]; return out; })();
function subLoja(id){ const l = lojaTop[id]; if (!l || (!l[0] && !l[1])) return ''; return '<span class="cell-sub">' + l[0] + (l[1] ? ' \u00b7 CNPJ ' + l[1] : '') + '</span>'; }

/* rx_buyers vem de BC-17b com LEFT JOIN de loja: pode ter mais de uma linha por
   comprador. Colapsa aqui, DEPOIS de todas as paginas, para [id, nome, loja, cnpj]. */
const RX_BUYERS = (function(){ const rows = zipnRaw('rx_buyers'); const m = {}, ord = []; rows.forEach(function(r){ const id = r[0]; if (id==null) return; if (!m[id]) { m[id] = [id, r[1], [], '']; ord.push(id); } if (r[2] && m[id][2].indexOf(r[2]) < 0) m[id][2].push(r[2]); if (!m[id][3] && r[3]) m[id][3] = fmtCnpj(r[3]); }); return ord.map(function(id){ return [m[id][0], m[id][1], m[id][2].join(' / '), m[id][3]]; }); })();
const RX_TOTALS = zipnRaw('rx_totais');
const RX_MODELO = zipnRaw('rx_modelo');
const RX_LAUDO = zipnRaw('rx_laudo');
const RX_UF = zipnRaw('rx_uf');
const RX_FAIXA = zipnRaw('rx_faixa');
const RX_PARTIC = zipnRaw('rx_partic');

const br = (n) => (Number(n)||0).toLocaleString('pt-BR');
const vol = (n) => { n = Number(n)||0; if (n>=1e9) return 'R$ '+(n/1e9).toFixed(2).replace('.',',')+' bi'; if (n>=1e6) return 'R$ '+(n/1e6).toFixed(1).replace('.',',')+' Mi'; if (n>=1e3) return 'R$ '+Math.round(n/1e3)+' K'; return 'R$ '+br(Math.round(n)); };
const tick = (n) => 'R$ '+br(Math.round(Number(n)||0));
const fmtBR = (d) => { if (!d) return '—'; const s = String(d).slice(0,10).split('-'); return s.length===3 ? s[2]+'/'+s[1]+'/'+s[0] : String(d); };
const pct1 = (n) => (Number(n)||0).toFixed(1).replace('.',',');

const now = new Date();
const ANO = now.getFullYear();
const pad = (n) => String(n).padStart(2,'0');
const hojeStrVal = (function(){ return pad(now.getDate())+'/'+pad(now.getMonth()+1)+'/'+now.getFullYear(); })();

const nomesMes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const nomesMesLongo = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const meses = [];
for (let i = 11; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth()-i, 1); meses.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')); }
const rot = (mm) => nomesMes[parseInt(mm.slice(5),10)-1]+'/'+mm.slice(2,4);
const MON = meses.map(rot);
const pega = (arr, mm, campo) => { for (let i=0;i<arr.length;i++){ if (arr[i].mes===mm) return arr[i][campo]; } return 0; };

const totalBase = Number(kpi.total_base)||0;
const comLogin = Number(kpi.com_login)||0;
const semLogin = totalBase - comLogin;
const ofertantes = Number(kpi.ofertantes)||0;
const compradores = Number(kpi.compradores)||0;
const negociacoes = Number(kpi.negociacoes)||0;
const volume = Number(kpi.volume)||0;
const ultimaCompra = fmtBR(kpi.ultima_compra);
const status7 = Number(kpi.status7)||0;
const status2 = Number(kpi.status2)||0;

const pctLogin = totalBase ? comLogin/totalBase*100 : 0;
const pctOfertantes = comLogin ? ofertantes/comLogin*100 : 0;
const pctCompradores = ofertantes ? compradores/ofertantes*100 : 0;

const SITU_LBL = { '1':'Pré cadastrado','2':'Para aprovação','3':'Aprovado','4':'Reprovado','5':'Bloqueado','6':'Inadimplente' };
const situMap = {}; situ.forEach(function(s){ situMap[String(s.situation)] = Number(s.qtd)||0; });
function situQtd(k){ return situMap[k]||0; }
function situPct(k){ const q=situQtd(k); return totalBase? pct1(q/totalBase*100)+'%' : '0,0%'; }

function recBucket(tipo){ const o = {}; rec.filter(function(r){ return r.tipo===tipo; }).forEach(function(r){ o[r.faixa] = Number(r.qtd)||0; }); return o; }
const recLogin = recBucket('login');
const recOferta = recBucket('oferta');
const recCompra = recBucket('compra');
function recWidth(bucket, denom, faixa){ const q=bucket[faixa]||0; return denom? pct1(q/denom*100) : '0,0'; }
function recQtd(bucket, faixa){ return br(bucket[faixa]||0); }

const evUniqLogin = meses.map(function(mm){ return Number(pega(evLogin, mm, 'unicos'))||0; });
const evUniqOferta = meses.map(function(mm){ return Number(pega(evOferta, mm, 'unicos'))||0; });
const evUniqCompra = meses.map(function(mm){ return Number(pega(evCompra, mm, 'unicos'))||0; });
const evVolume = meses.map(function(mm){ return Math.round((Number(pega(evCompra, mm, 'volume'))||0)/1e6*10)/10; });
const evCad = meses.map(function(mm){ return Number(pega(evCadastro, mm, 'novos'))||0; });

/* [BC-25/26/27] Novos vs. recorrentes. As queries so devolvem linha para mes com
   movimento; pega() devolve 0 nos buracos, entao as 6 series ficam do mesmo tamanho
   de MON. Por construcao novos + recorrentes = unicos do mesmo mes (evUniq*). */
const nrLogin = zipn('nr_login'), nrOferta = zipn('nr_oferta'), nrCompra = zipn('nr_compra');
function nrSerie(rows, campo){ return meses.map(function(mm){ return Number(pega(rows, mm, campo))||0; }); }
const nrLoginNovos = nrSerie(nrLogin,'novos'),  nrLoginRec  = nrSerie(nrLogin,'recorrentes');
const nrOfertaNovos = nrSerie(nrOferta,'novos'), nrOfertaRec = nrSerie(nrOferta,'recorrentes');
const nrCompraNovos = nrSerie(nrCompra,'novos'), nrCompraRec = nrSerie(nrCompra,'recorrentes');
const evAnuncios = meses.map(function(mm){ return Number(pega(evMedia, mm, 'anuncios_publicados'))||0; });
const evVeiculosVendidos = meses.map(function(mm){ return Number(pega(evMedia, mm, 'veiculos_vendidos'))||0; });
const evMediaOf = meses.map(function(mm){ return Number(pega(evMedia, mm, 'media_ofertas_por_anuncio'))||0; });
const evAnunciosCriados = meses.map(function(mm){ return Number(pega(evMedia, mm, 'anuncios_criados'))||0; });
const evMediaPub = meses.map(function(mm){ return Number(pega(evMedia, mm, 'media_publicacoes_por_veiculo'))||0; });
const evExito = evAnuncios.map(function(pub,i){ const vend=evVeiculosVendidos[i]; return pub? Math.round(Math.min(vend/pub,1)*1000)/10 : 0; });
const ultimoMesParcial = rot(meses[meses.length-1])+': dado parcial (dia 1–'+now.getDate()+')';
const PERIODO_EVOLUCAO = MON[0]+' a '+MON[MON.length-1]+' · '+ultimoMesParcial;

const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const dias30 = [];
for (let i=29;i>=0;i--){ const d=new Date(hoje); d.setDate(hoje.getDate()-i); dias30.push(d); }
function fmtDiaKey(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
const cadDiaMap = {}; evCadastroDia.forEach(function(r){ cadDiaMap[String(r.dia).slice(0,10)] = Number(r.novos)||0; });
const CAD_DIA_LABELS = dias30.map(function(d){ return pad(d.getDate())+'/'+pad(d.getMonth()+1); });
const CAD_DIA_VALUES = dias30.map(function(d){ return cadDiaMap[fmtDiaKey(d)] || 0; });
function linreg(ys){
  const n=ys.length; let sumX=0,sumY=0,sumXY=0,sumXX=0;
  for(let i=0;i<n;i++){ sumX+=i; sumY+=ys[i]; sumXY+=i*ys[i]; sumXX+=i*i; }
  const den=(n*sumXX - sumX*sumX)||1;
  const b=(n*sumXY - sumX*sumY)/den;
  const a=(sumY - b*sumX)/n;
  return ys.map(function(_,i){ return Math.round((a+b*i)*10)/10; });
}
const CAD_DIA_TREND = linreg(CAD_DIA_VALUES);
const PERIODO_CAD_DIA = pad(dias30[0].getDate())+'/'+pad(dias30[0].getMonth()+1)+' a '+pad(dias30[29].getDate())+'/'+pad(dias30[29].getMonth()+1)+'/'+dias30[29].getFullYear();

function orderUf(arr){ const semId = arr.filter(function(r){ return r.uf !== 'Não identificada'; }); const idRow = arr.filter(function(r){ return r.uf === 'Não identificada'; })[0]; return idRow ? semId.concat([idRow]) : semId; }
const ufCadastroOrdered = orderUf(ufCadastro);
const ufCadSoma = ufCadastroOrdered.reduce(function(s,r){ return s+(Number(r.qtd)||0); }, 0);
function splitCols(arr, n){ const perCol = Math.ceil(arr.length/n); const cols=[]; for(let i=0;i<n;i++){ cols.push(arr.slice(i*perCol,(i+1)*perCol)); } return cols; }
const ufCadCols = splitCols(ufCadastroOrdered, 3);
function rowsUf(colArr){ return colArr.map(function(r){ const q=Number(r.qtd)||0; const p=totalBase?q/totalBase*100:0; const st = r.uf==='Não identificada' ? ' style="color:var(--faint)"' : ''; return '<tr><td'+st+'>'+r.uf+'</td><td class="r mono">'+br(q)+'</td><td class="r">'+pct1(p)+'%</td></tr>'; }).join(''); }
const ufCompraOrdered = orderUf(ufCompra);
const UF_COMPRA_LABELS = ufCompraOrdered.map(function(r){ return r.uf; });
const UF_COMPRA_DATA = ufCompraOrdered.map(function(r){ return Number(r.compras)||0; });
const UF_COMPRA_VOL = ufCompraOrdered.map(function(r){ return Math.round((Number(r.volume)||0)/1e6*10)/10; });

const setHist = new Set(topHist.map(function(x){ return x.id; }));
const setAno = new Set(topAno.map(function(x){ return x.id; }));
const setAcesso = new Set(topAcesso.map(function(x){ return x.id; }));
const setOfertas = new Set(topOfertas.map(function(x){ return x.id; }));

function rowsTopHist(){
  return topHist.map(function(r, i){
    const cls = i===0 ? ' class="top1"' : '';
    return '<tr'+cls+'><td>'+(i+1)+'</td><td>'+(r.full_name||'—')+subLoja(r.id)+'</td><td class="r mono">'+br(r.compras)+'</td><td class="r mono">'+vol(r.volume)+'</td><td class="r mono">'+fmtBR(r.ultima_compra)+'</td></tr>';
  }).join('');
}
function rowsTopAno(){
  return topAno.map(function(r, i){
    const marcado = (setHist.has(r.id) || setOfertas.has(r.id)) && i>0;
    const cls = i===0 ? ' class="top1"' : '';
    const nome = (r.full_name||'—');
    const nameCell = '<td>'+(marcado?'<span class="cross">★ '+nome+'</span>':nome)+subLoja(r.id)+'</td>';
    return '<tr'+cls+'><td>'+(i+1)+'</td>'+nameCell+'<td class="r mono">'+br(r.compras)+'</td><td class="r mono">'+vol(r.volume)+'</td><td class="r mono">'+fmtBR(r.ultima_compra)+'</td></tr>';
  }).join('');
}
function rowsTopAcesso(){
  return topAcesso.map(function(r, i){
    const marcado = setOfertas.has(r.id);
    const nome = (r.full_name||'—');
    return '<tr><td>'+(i+1)+'</td><td>'+(marcado?'<span class="cross">★ '+nome+'</span>':nome)+subLoja(r.id)+'</td><td class="r mono">'+br(r.dias_ativos)+'</td></tr>';
  }).join('');
}
function rowsTopOfertas(){
  return topOfertas.map(function(r, i){
    const marcado = setAcesso.has(r.id);
    const nome = (r.full_name||'—');
    return '<tr><td>'+(i+1)+'</td><td>'+(marcado?'<span class="cross">★ '+nome+'</span>':nome)+subLoja(r.id)+'</td><td class="r mono">'+br(r.ofertas)+'</td></tr>';
  }).join('');
}

const overlapCount = topAno.filter(function(r){ return setHist.has(r.id) || setOfertas.has(r.id); }).length;
const acessoOfertaOverlap = topAcesso.filter(function(r){ return setOfertas.has(r.id); }).map(function(r){ return r.full_name; });

const top10HistVolume = topHist.reduce(function(s,r){ return s+(Number(r.volume)||0); }, 0);
const concentracaoPct = volume ? top10HistVolume/volume*100 : 0;
const inativos180Login = recLogin['180d+'] || 0;
const pctInativos180 = comLogin ? inativos180Login/comLogin*100 : 0;

const insights = [];
if (pctCompradores >= 60) {
  insights.push({ good: true, titulo: 'Alta conversão de oferta em compra.', texto: 'Dos '+br(ofertantes)+' clientes que já ofertaram (qualquer loja da plataforma), '+br(compradores)+' ('+pct1(pctCompradores)+'%) converteram em pelo menos uma compra — uma taxa elevada nesta etapa do funil.' });
} else {
  insights.push({ good: false, titulo: 'Conversão de oferta em compra abaixo do ideal.', texto: 'Dos '+br(ofertantes)+' clientes que já ofertaram (qualquer loja da plataforma), apenas '+br(compradores)+' ('+pct1(pctCompradores)+'%) converteram em pelo menos uma compra.' });
}
if (pctOfertantes < 50) {
  insights.push({ good: false, titulo: 'Gargalo está entre login e oferta.', texto: 'Apenas '+br(ofertantes)+' dos '+br(comLogin)+' clientes com login ('+pct1(pctOfertantes)+'%) chegaram a ofertar — o maior gargalo do funil está na ativação para oferta, não na conversão final.' });
} else {
  insights.push({ good: true, titulo: 'Boa ativação de ofertantes.', texto: br(ofertantes)+' dos '+br(comLogin)+' clientes com login ('+pct1(pctOfertantes)+'%) chegaram a ofertar — ativação saudável nesta etapa do funil.' });
}
if (pctInativos180 >= 50) {
  insights.push({ good: false, titulo: 'Maioria dos logados está inativa há mais de 180 dias.', texto: br(inativos180Login)+' clientes ('+pct1(pctInativos180)+'% dos '+br(comLogin)+' com login) não acessam a plataforma há mais de 180 dias, e outros '+br(semLogin)+' nunca fizeram login.' });
} else {
  insights.push({ good: true, titulo: 'Base de login majoritariamente ativa.', texto: 'Apenas '+pct1(pctInativos180)+'% dos '+br(comLogin)+' clientes com login estão inativos há mais de 180 dias.' });
}
if (overlapCount >= 5) {
  insights.push({ good: true, titulo: 'Sobreposição entre top compradores e top ofertantes.', texto: overlapCount+' dos 10 maiores compradores do ano de '+ANO+' também aparecem no ranking histórico de compras ou no Top 10 de ofertas — indício de uma base de clientes recorrentes e engajados.' });
} else {
  insights.push({ good: false, titulo: 'Baixa sobreposição entre os rankings de compra e oferta.', texto: 'Apenas '+overlapCount+' dos 10 maiores compradores do ano de '+ANO+' aparecem também no ranking histórico de compras ou no Top 10 de ofertas.' });
}
if (concentracaoPct >= 25) {
  insights.push({ good: false, titulo: 'Concentração de volume nos maiores clientes.', texto: 'Os 10 maiores compradores históricos somam '+vol(top10HistVolume)+' ('+pct1(concentracaoPct)+'% do volume total de '+vol(volume)+').' });
} else {
  insights.push({ good: true, titulo: 'Volume bem distribuído entre compradores.', texto: 'Os 10 maiores compradores históricos somam '+vol(top10HistVolume)+' ('+pct1(concentracaoPct)+'% do volume total de '+vol(volume)+') — concentração baixa.' });
}
const insightsHtml = insights.map(function(ins){
  const cls = ins.good ? 'good' : 'warn';
  const badgeBg = ins.good ? 'var(--good-soft)' : 'var(--warn-soft)';
  const icon = ins.good ? '✅' : '⚠️';
  const lblColor = ins.good ? 'var(--good)' : 'var(--warn)';
  const lbl = ins.good ? 'Destaque positivo' : 'Ponto de atenção';
  return '<div class="insight '+cls+'"><div class="insight-badge" style="background:'+badgeBg+'">'+icon+'</div><div><div class="insight-lbl" style="color:'+lblColor+'">'+lbl+'</div><p><strong>'+ins.titulo+'</strong> '+ins.texto+'</p></div></div>';
}).join('');

const rxIniDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
const RX_PERIODO_LABEL = nomesMesLongo[rxIniDate.getMonth()]+' de '+rxIniDate.getFullYear()+' a '+nomesMesLongo[now.getMonth()]+' de '+now.getFullYear()+' (últimos 12 meses)';

const M = {
  TITULO_ESCOPO: 'Canal de Vendas C6 Auto',
  SUBTITULO_ESCOPO: 'Base completa do whitelabel 43 (C6 Lojista)',
  COR_BRAND: '#242424', COR_BRAND2: '#4a4a4a', COR_BRAND_SOFT: '#f5f3ff',
  COR_ACCENT: '#7c3aed', COR_ACCENT2: '#a855f7',
  WL_LOGO: 'https://d1p8lh2yk5ndo8.cloudfront.net/f9c4681951972af03b9ef33217f42885.png',
  WL_LOGO_STYLE: 'height:38px;background:#fff;padding:6px 14px;border-radius:6px',
  DATA_GERACAO: hojeStrVal,
  PILL_ESCOPO: 'C6 Auto · Canal de Vendas',
  MES_INICIO_LABEL: MON[0], MES_FIM_LABEL: MON[MON.length-1],
  KPI_TOTAL_BASE: br(totalBase), KPI_TOTAL_BASE_SUB: 'lojistas cadastrados no C6 Auto',
  KPI_COM_LOGIN: br(comLogin), KPI_PCT_LOGIN: pct1(pctLogin)+'%',
  KPI_SEM_LOGIN: br(semLogin),
  KPI_ESCOPO_ANUNCIANTE: '',
  KPI_OFERTANTES: br(ofertantes), KPI_PCT_OFERTA_LOGIN: pct1(pctOfertantes)+'%',
  KPI_COMPRADORES: br(compradores), KPI_PCT_COMPRA_OFERTA: pct1(pctCompradores)+'%',
  KPI_NEGOCIACOES: br(negociacoes), KPI_STATUS_BREAKDOWN: 'status 7: '+br(status7)+' · status 2: '+br(status2),
  KPI_VOLUME: vol(volume), KPI_ULTIMA_COMPRA: ultimaCompra,
  SIT_1_QTD: br(situQtd('1')), SIT_1_PCT: situPct('1'),
  SIT_2_QTD: br(situQtd('2')), SIT_2_PCT: situPct('2'),
  SIT_3_QTD: br(situQtd('3')), SIT_3_PCT: situPct('3'),
  SIT_4_QTD: br(situQtd('4')), SIT_4_PCT: situPct('4'),
  SIT_5_QTD: br(situQtd('5')), SIT_5_PCT: situPct('5'),
  SIT_6_QTD: br(situQtd('6')), SIT_6_PCT: situPct('6'),
  REC_LOGIN_00_30_WIDTH: recWidth(recLogin,comLogin,'00-30d'), REC_LOGIN_00_30_QTD: recQtd(recLogin,'00-30d'),
  REC_LOGIN_31_90_WIDTH: recWidth(recLogin,comLogin,'31-90d'), REC_LOGIN_31_90_QTD: recQtd(recLogin,'31-90d'),
  REC_LOGIN_91_180_WIDTH: recWidth(recLogin,comLogin,'91-180d'), REC_LOGIN_91_180_QTD: recQtd(recLogin,'91-180d'),
  REC_LOGIN_180_WIDTH: recWidth(recLogin,comLogin,'180d+'), REC_LOGIN_180_QTD: recQtd(recLogin,'180d+'),
  REC_OFERTA_00_30_WIDTH: recWidth(recOferta,ofertantes,'00-30d'), REC_OFERTA_00_30_QTD: recQtd(recOferta,'00-30d'),
  REC_OFERTA_31_90_WIDTH: recWidth(recOferta,ofertantes,'31-90d'), REC_OFERTA_31_90_QTD: recQtd(recOferta,'31-90d'),
  REC_OFERTA_91_180_WIDTH: recWidth(recOferta,ofertantes,'91-180d'), REC_OFERTA_91_180_QTD: recQtd(recOferta,'91-180d'),
  REC_OFERTA_180_WIDTH: recWidth(recOferta,ofertantes,'180d+'), REC_OFERTA_180_QTD: recQtd(recOferta,'180d+'),
  REC_COMPRA_00_30_WIDTH: recWidth(recCompra,compradores,'00-30d'), REC_COMPRA_00_30_QTD: recQtd(recCompra,'00-30d'),
  REC_COMPRA_31_90_WIDTH: recWidth(recCompra,compradores,'31-90d'), REC_COMPRA_31_90_QTD: recQtd(recCompra,'31-90d'),
  REC_COMPRA_91_180_WIDTH: recWidth(recCompra,compradores,'91-180d'), REC_COMPRA_91_180_QTD: recQtd(recCompra,'91-180d'),
  REC_COMPRA_180_WIDTH: recWidth(recCompra,compradores,'180d+'), REC_COMPRA_180_QTD: recQtd(recCompra,'180d+'),
  PERIODO_EVOLUCAO: PERIODO_EVOLUCAO,
  PERIODO_CAD_DIA: PERIODO_CAD_DIA,
  UF_CADASTRO_SOMA: br(ufCadSoma),
  UF_CADASTRO_ROWS_COL1: rowsUf(ufCadCols[0]||[]),
  UF_CADASTRO_ROWS_COL2: rowsUf(ufCadCols[1]||[]),
  UF_CADASTRO_ROWS_COL3: rowsUf(ufCadCols[2]||[]),
  TOP_HIST_ROWS: rowsTopHist(),
  ANO_ATUAL: String(ANO),
  TOP_ANO_ROWS: rowsTopAno(),
  TOP_ACESSO_ROWS: rowsTopAcesso(),
  TOP_OFERTA_ROWS: rowsTopOfertas(),
  CRUZAMENTO_NOTA: acessoOfertaOverlap.length+' nome(s) aparecem simultaneamente nos rankings de acesso e de ofertas de '+ANO+'.',
  INSIGHTS_HTML: insightsHtml,
  RX_PERIODO_LABEL: RX_PERIODO_LABEL,
  FOOTER_ESCOPO: 'Canal de Vendas C6 Auto (Whitelabel 43)',
  MESES_JSON: MON.map(function(m){return JSON.stringify(m);}).join(','),
  LOGIN_DATA: evUniqLogin.join(','),
  OFERTA_DATA: evUniqOferta.join(','),
  COMPRA_DATA: evUniqCompra.join(','),
  NR_LOGIN_NOVOS_DATA: nrLoginNovos.join(','),
  NR_LOGIN_REC_DATA: nrLoginRec.join(','),
  NR_OFERTA_NOVOS_DATA: nrOfertaNovos.join(','),
  NR_OFERTA_REC_DATA: nrOfertaRec.join(','),
  NR_COMPRA_NOVOS_DATA: nrCompraNovos.join(','),
  NR_COMPRA_REC_DATA: nrCompraRec.join(','),
  VOLUME_DATA: evVolume.join(','),
  CADASTROS_DATA: evCad.join(','),
  CAD_DIA_LABELS_JSON: CAD_DIA_LABELS.map(function(l){return JSON.stringify(l);}).join(','),
  CAD_DIA_DATA: CAD_DIA_VALUES.join(','),
  CAD_DIA_TREND_DATA: CAD_DIA_TREND.join(','),
  ANUNCIOS_DATA: evAnuncios.join(','),
  VEICULOS_VENDIDOS_DATA: evVeiculosVendidos.join(','),
  MEDIA_OFERTA_ANUNCIO_DATA: evMediaOf.join(','),
  EXITO_VENDA_DATA: evExito.join(','),
  ANUNCIOS_CRIADOS_DATA: evAnunciosCriados.join(','),
  MEDIA_PUBLICACOES_DATA: evMediaPub.join(','),
  UF_COMPRA_LABELS_JSON: UF_COMPRA_LABELS.map(function(l){return JSON.stringify(l);}).join(','),
  UF_COMPRA_DATA: UF_COMPRA_DATA.join(','),
  UF_COMPRA_VOLUME_MI_DATA: UF_COMPRA_VOL.join(',')
};

const TPL = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Análise de Base de Clientes — {{TITULO_ESCOPO}} | Cars2You</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Oswald:wght@500;600;700&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-datalabels/2.2.0/chartjs-plugin-datalabels.min.js"></script>
<style>
/* ══════════════════════════════════════════════════════════════════
   CORES — {{COR_BRAND}}/{{COR_BRAND2}} vêm de whitelabel_themes.
   {{COR_ACCENT}}/{{COR_ACCENT2}} = laranja IGA (#E65100/#FF6D00) se shop_id=594
   estiver no escopo, senão um tom neutro derivado do brand (ex: roxo/âmbar).
   ══════════════════════════════════════════════════════════════════ */
:root{
  --ink:#0f172a; --ink2:#1e293b; --sub:#475569; --faint:#94a3b8;
  --bg:#f1f5f9; --card:#ffffff; --line:#e2e8f0;
  --brand:{{COR_BRAND}}; --brand2:{{COR_BRAND2}}; --brand-soft:{{COR_BRAND_SOFT}};
  --good:#047857; --good-soft:#ecfdf5; --good-line:#a7f3d0;
  --warn:#b45309; --warn-soft:#fffbeb; --warn-line:#fde68a;
  --bad:#b91c1c; --bad-soft:#fef2f2; --bad-line:#fecaca;
  --amber:{{COR_ACCENT}}; --amber2:{{COR_ACCENT2}};
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:'Inter',sans-serif;font-size:15px;line-height:1.6}
.num,.kpi-value,.stat-value{font-family:'Oswald',sans-serif}
.page{max-width:1180px;margin:0 auto;padding:0 24px 64px}

.header{background:linear-gradient(135deg,var(--ink) 0%,var(--brand2) 100%);margin:0 -24px 0;padding:28px 40px 24px;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap}
.header-left{display:flex;align-items:center;gap:18px}
.header-logo img{display:block;{{WL_LOGO_STYLE}}}
.header-divider{width:1px;height:42px;background:rgba(255,255,255,.25)}
.header-title h1{font-family:'Oswald',sans-serif;font-size:26px;font-weight:600;color:#fff;letter-spacing:.2px}
.header-title p{font-size:13px;color:rgba(255,255,255,.65);margin-top:3px}
.header-meta{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.pill{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);border-radius:20px;padding:5px 14px;font-size:12px;font-weight:600;color:rgba(255,255,255,.9)}
.header-bar{height:4px;background:linear-gradient(90deg,var(--amber) 0%,var(--amber2) 100%);margin:0 -24px 32px}

.sec{margin-bottom:40px}
.sec-head{display:flex;align-items:baseline;gap:10px;margin-bottom:16px}
.sec-title{font-family:'Oswald',sans-serif;font-size:13px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--brand2)}
.sec-line{flex:1;height:1px;background:var(--line)}
.sec-note{font-size:12px;color:var(--faint);margin-top:-8px;margin-bottom:16px}

.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px 18px;position:relative;overflow:hidden}
.kpi::before{content:'';position:absolute;top:0;left:0;width:3px;height:100%;background:var(--accent,var(--brand))}
.kpi-label{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--sub)}
.kpi-value{font-size:30px;font-weight:700;color:var(--ink);line-height:1.15;margin:5px 0 3px}
.kpi-sub{font-size:12px;color:var(--faint)}

.funnel{display:grid;grid-template-columns:repeat(4,1fr);gap:0;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden}
.f-step{padding:20px 16px;text-align:center;border-right:1px solid var(--line);position:relative}
.f-step:last-child{border-right:none}
.f-step-lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--sub)}
.f-step-val{font-family:'Oswald',sans-serif;font-size:32px;font-weight:600;color:var(--ink);margin:6px 0 2px}
.f-step-pct{font-size:12px;color:var(--brand2);font-weight:600}
.f-arrow{position:absolute;right:-13px;top:50%;transform:translateY(-50%);width:26px;height:26px;background:var(--card);border:1px solid var(--line);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--faint);z-index:2}

.rec-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
@media(max-width:760px){.rec-grid{grid-template-columns:1fr}}
.rec-card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:18px 20px}
.rec-head{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:14px}
.rec-dot{width:9px;height:9px;border-radius:50%}
.rec-row{display:flex;align-items:center;gap:10px;padding:6px 0}
.rec-period{width:66px;font-size:12px;color:var(--sub);flex-shrink:0}
.rec-bar-bg{flex:1;height:8px;background:#eef1f6;border-radius:4px;overflow:hidden}
.rec-bar{height:100%;border-radius:4px}
.rec-count{width:38px;text-align:right;font-family:'Oswald',sans-serif;font-weight:600;font-size:14px}
.rec-footer{margin-top:12px;padding-top:10px;border-top:1px solid var(--line);font-size:11.5px;color:var(--sub)}

.chart-card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:20px 22px;margin-bottom:14px}
.chart-card .ct{font-size:14px;font-weight:600;color:var(--ink2)}
.chart-card .cs{font-size:12px;color:var(--sub);margin-bottom:12px}
.legend{display:flex;gap:16px;margin-bottom:10px;font-size:12px;color:var(--sub);font-weight:500}
.legend span{display:flex;align-items:center;gap:5px}
.ldot{width:9px;height:9px;border-radius:2px}

.tbl-wrap{background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden}
table{width:100%;border-collapse:collapse}
th{background:#f8fafc;color:var(--brand2);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;padding:10px 14px;text-align:left;border-bottom:1px solid var(--line)}
th.r,td.r{text-align:right}
td{padding:9px 14px;font-size:13.5px;border-bottom:1px solid #f1f5f9;color:var(--ink2)}
tr:last-child td{border-bottom:none}
tr:hover td{background:#f8fafc}
.mono{font-family:'Oswald',sans-serif}
tfoot td{background:#f8fafc;font-weight:800}
.cell-sub{display:block;font-size:11px;font-weight:400;color:var(--faint);margin-top:1px}
.top1 td{background:var(--brand-soft);font-weight:700}
.top1 td:first-child{color:var(--amber);font-weight:800}
.top1 td:first-child::before{content:'🏆'}
.top1 td:nth-child(4){color:var(--amber)}
.cross{color:var(--amber);font-weight:600}

.rx-toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:16px}
.rx-toolbar label{font-size:12px;color:var(--sub);font-weight:600;margin-right:-4px}
.rx-toolbar select{padding:9px 12px;border:1px solid var(--line);border-radius:9px;background:#fff;font-size:13px;color:var(--ink2);font-family:'Inter',sans-serif}
.rx-toolbar .rx-count{margin-left:auto;font-size:12px;color:var(--faint)}
.table-tools{display:flex;gap:12px;margin:10px 0;flex-wrap:wrap;align-items:center}
input.search{flex:1;min-width:220px;padding:9px 12px;border:1px solid var(--line);border-radius:9px;font-size:13px;font-family:'Inter',sans-serif}
th.sortable{cursor:pointer;user-select:none}
th.sortable:after{content:'⇅';margin-left:4px;color:var(--faint);font-size:10px}
.buyer-select{width:min(520px,100%);padding:10px 12px;border:1px solid var(--line);border-radius:9px;background:#fff;font-family:'Inter',sans-serif}
.buyer-detail{margin-top:16px}
.rx-combo-label{display:block;font-size:12px;color:var(--sub);font-weight:600;margin-bottom:6px}
.rx-combo{position:relative;width:min(520px,100%)}
.rx-combo-field{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border:1px solid var(--line);border-radius:9px;background:#fff;cursor:pointer;font-size:14px;color:var(--ink2)}
.rx-combo-field:hover{border-color:var(--brand2)}
.rx-combo-field.open{border-color:var(--ink);box-shadow:0 0 0 3px rgba(15,23,42,.08)}
.rx-combo-value{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rx-combo-value.placeholder{color:var(--faint)}
.rx-combo-icons{display:flex;align-items:center;gap:8px;color:var(--faint);flex-shrink:0}
.rx-combo-clear{background:none;border:none;cursor:pointer;color:var(--faint);font-size:15px;line-height:1;padding:2px;display:flex}
.rx-combo-clear:hover{color:var(--ink)}
.rx-combo-chevron{display:flex;transition:transform .15s;color:var(--faint)}
.rx-combo-field.open .rx-combo-chevron{transform:rotate(180deg)}
.rx-combo-panel{position:absolute;top:calc(100% + 6px);left:0;right:0;background:#fff;border:1px solid var(--line);border-radius:10px;box-shadow:0 10px 30px rgba(15,23,42,.14);z-index:30;overflow:hidden}
.rx-combo-search-wrap{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--line)}
.rx-combo-search-wrap input{flex:1;border:none;outline:none;font-size:13px;font-family:'Inter',sans-serif;color:var(--ink2);background:transparent}
.rx-combo-search-wrap svg{flex-shrink:0;color:var(--faint)}
.rx-combo-list{max-height:240px;overflow-y:auto}
.rx-combo-item{padding:9px 14px;font-size:13.5px;color:var(--ink2);cursor:pointer}
.rx-combo-item:hover{background:#f1f5f9}
.rx-combo-item.selected{background:var(--ink);color:#fff}
.rx-combo-empty{padding:14px;font-size:13px;color:var(--faint);text-align:center}
.rx-combo-item.selected .cell-sub{color:rgba(255,255,255,.72)}
.rx-buyer-head{margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--line)}
.rx-buyer-head .n{font-size:16px;font-weight:700;color:var(--ink)}
.profile-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:16px}
.mini{padding:12px 14px}
.mini .l{font-size:11px;color:var(--sub);text-transform:uppercase;letter-spacing:.04em;font-weight:700}
.mini .v{font-family:'Oswald',sans-serif;font-size:19px;font-weight:700;color:var(--ink);margin-top:4px}
.dist-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
@media(max-width:760px){.dist-grid{grid-template-columns:1fr}}
.dist-box h4{font-size:13px;font-weight:700;color:var(--ink2);margin-bottom:10px}
.dist-row{display:grid;grid-template-columns:minmax(100px,1.2fr) minmax(70px,2fr) 78px;gap:8px;align-items:center;margin:6px 0;font-size:12px;color:var(--sub)}
.dist-bar-bg{height:7px;background:#eef1f6;border-radius:5px;overflow:hidden}
.dist-bar{height:100%;border-radius:5px;background:var(--amber)}
.rx-empty{padding:24px;text-align:center;color:var(--faint);font-size:13px}

.tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 32px}
.tab{border:1px solid var(--line);background:#fff;border-radius:999px;padding:10px 18px;cursor:pointer;font-weight:700;font-size:13px;color:var(--sub);font-family:'Inter',sans-serif}
.tab.active{background:var(--brand);color:#fff;border-color:var(--brand)}
.panel{display:none}
.panel.active{display:block}
.period-badge{display:inline-block;background:var(--brand-soft);color:var(--brand2);border-radius:20px;padding:4px 12px;font-size:12px;font-weight:700;margin-bottom:20px}

.insight-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:700px){.insight-grid{grid-template-columns:1fr}}
.insight{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px 18px;display:flex;gap:12px}
.insight.good{border-left:3px solid var(--good)}
.insight.warn{border-left:3px solid var(--warn)}
.insight-badge{width:30px;height:30px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px}
.insight-lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px}
.insight p{font-size:13.5px;color:var(--sub);line-height:1.55}
.insight p strong{color:var(--ink2);font-weight:600}

.footer{border-top:2px solid var(--ink);margin-top:48px;padding-top:16px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:12px;color:var(--sub)}

.info{display:inline-flex;align-items:center;justify-content:center;margin-left:7px;color:#94a3b8;cursor:help;vertical-align:middle;line-height:0}
.info svg{display:block}
.info:hover{color:var(--brand)}
#tipbox{position:fixed;z-index:9999;max-width:300px;background:#0f172a;color:#e2e8f0;font-family:inherit;font-size:11.5px;font-weight:400;font-style:normal;letter-spacing:0;line-height:1.55;text-align:left;text-transform:none;padding:10px 12px;border-radius:7px;box-shadow:0 10px 28px rgba(0,0,0,.35);opacity:0;visibility:hidden;transition:opacity .13s ease;pointer-events:none}
#tipbox.on{opacity:1;visibility:visible}
@media print{.info{display:none}}
</style>
</head>
<body>
<div class="page">

<div class="header">
  <div class="header-left">
    <div class="header-logo"><img src="{{WL_LOGO}}" alt="{{TITULO_ESCOPO}}"></div>
    <div class="header-divider"></div>
    <div class="header-title">
      <h1>Análise de Base de Clientes</h1>
      <p>{{TITULO_ESCOPO}} · {{SUBTITULO_ESCOPO}}</p>
    </div>
  </div>
  <div class="header-meta">
    <span class="pill">Gerado em {{DATA_GERACAO}}</span>
    <span class="pill">{{PILL_ESCOPO}}</span>
    <span class="pill">Confidencial</span>
  </div>
</div>
<div class="header-bar"></div>

<!-- ═══ ABAS ═══ -->
<!-- Estrutura de 3 abas: Visão Geral da Base (tudo que já existia), Raio-X de
     Compradores (matriz) e Raio-X Individual (detalhe por comprador) — ver
     preenchimento.md § 10. Cada painel deixa o período analisado explícito via
     .period-badge logo no topo. -->
<div class="tabs">
  <button class="tab active" data-tab="panel-geral">Visão Geral da Base</button>
  <button class="tab" data-tab="panel-matriz">Raio-X de Compradores</button>
  <button class="tab" data-tab="panel-individual">Raio-X Individual</button>
</div>

<div id="panel-geral" class="panel active">
<div class="period-badge">Período analisado: histórico completo da base (evolução mensal detalhada em {{MES_INICIO_LABEL}} – {{MES_FIM_LABEL}})</div>

<!-- ═══ VISÃO GERAL ═══ -->
<!-- DADOS: BC-01, BC-03, BC-04, BC-05 -->
<div class="sec">
  <div class="sec-head"><div class="sec-title">Visão Geral da Base</div><div class="sec-line"></div></div>
  <div class="kpi-grid">
    <div class="kpi" style="--accent:var(--brand)"><div class="kpi-label">Clientes na base</div><div class="kpi-value">{{KPI_TOTAL_BASE}}</div><div class="kpi-sub">{{KPI_TOTAL_BASE_SUB}}</div></div>
    <div class="kpi" style="--accent:#047857"><div class="kpi-label">Com login</div><div class="kpi-value">{{KPI_COM_LOGIN}}</div><div class="kpi-sub">{{KPI_PCT_LOGIN}} da base · histórico completo</div></div>
    <div class="kpi" style="--accent:#b91c1c"><div class="kpi-label">Sem login</div><div class="kpi-value">{{KPI_SEM_LOGIN}}</div><div class="kpi-sub">nunca acessaram a plataforma</div></div>
    <div class="kpi" style="--accent:var(--brand2)"><div class="kpi-label">Ofertantes{{KPI_ESCOPO_ANUNCIANTE}}</div><div class="kpi-value">{{KPI_OFERTANTES}}</div><div class="kpi-sub">{{KPI_PCT_OFERTA_LOGIN}} dos com login</div></div>
    <div class="kpi" style="--accent:var(--amber)"><div class="kpi-label">Compradores{{KPI_ESCOPO_ANUNCIANTE}}</div><div class="kpi-value">{{KPI_COMPRADORES}}</div><div class="kpi-sub">{{KPI_PCT_COMPRA_OFERTA}} dos ofertantes</div></div>
    <div class="kpi" style="--accent:var(--brand)"><div class="kpi-label">Negociações vendidas</div><div class="kpi-value">{{KPI_NEGOCIACOES}}</div><div class="kpi-sub">{{KPI_STATUS_BREAKDOWN}}</div></div>
    <div class="kpi" style="--accent:var(--amber)"><div class="kpi-label">Volume total</div><div class="kpi-value" style="font-size:24px;color:var(--amber)">{{KPI_VOLUME}}</div><div class="kpi-sub">valor total pago nas compras</div></div>
    <div class="kpi" style="--accent:#94a3b8"><div class="kpi-label">Última compra</div><div class="kpi-value" style="font-size:22px">{{KPI_ULTIMA_COMPRA}}</div><div class="kpi-sub">compra mais recente</div></div>
  </div>
</div>

<!-- ═══ CADASTROS POR SITUAÇÃO ═══ -->
<!-- DADOS: BC-02 -->
<div class="sec">
  <div class="sec-head"><div class="sec-title">Cadastros por Situação</div><div class="sec-line"></div></div>
  <div class="sec-note">Situação cadastral atual dos {{KPI_TOTAL_BASE}} clientes da base.</div>
  <div class="kpi-grid">
    <div class="kpi" style="--accent:#94a3b8"><div class="kpi-label">1 · Pré cadastrado</div><div class="kpi-value">{{SIT_1_QTD}}</div><div class="kpi-sub">{{SIT_1_PCT}} da base</div></div>
    <div class="kpi" style="--accent:#94a3b8"><div class="kpi-label">2 · Para aprovação</div><div class="kpi-value">{{SIT_2_QTD}}</div><div class="kpi-sub">{{SIT_2_PCT}} da base</div></div>
    <div class="kpi" style="--accent:#047857"><div class="kpi-label">3 · Aprovado</div><div class="kpi-value">{{SIT_3_QTD}}</div><div class="kpi-sub">{{SIT_3_PCT}} da base</div></div>
    <div class="kpi" style="--accent:#b91c1c"><div class="kpi-label">4 · Reprovado</div><div class="kpi-value">{{SIT_4_QTD}}</div><div class="kpi-sub">{{SIT_4_PCT}} da base</div></div>
    <div class="kpi" style="--accent:#b45309"><div class="kpi-label">5 · Bloqueado</div><div class="kpi-value">{{SIT_5_QTD}}</div><div class="kpi-sub">{{SIT_5_PCT}} da base</div></div>
    <div class="kpi" style="--accent:#b91c1c"><div class="kpi-label">6 · Inadimplente</div><div class="kpi-value">{{SIT_6_QTD}}</div><div class="kpi-sub">{{SIT_6_PCT}} da base</div></div>
  </div>
</div>

<!-- ═══ FUNIL DE CONVERSÃO ═══ -->
<div class="sec">
  <div class="sec-head"><div class="sec-title">Funil de Conversão</div><div class="sec-line"></div></div>
  <div class="funnel">
    <div class="f-step"><div class="f-step-lbl">Base</div><div class="f-step-val">{{KPI_TOTAL_BASE}}</div><div class="f-step-pct">100%</div><div class="f-arrow">→</div></div>
    <div class="f-step"><div class="f-step-lbl">Login</div><div class="f-step-val">{{KPI_COM_LOGIN}}</div><div class="f-step-pct">{{KPI_PCT_LOGIN}} da base</div><div class="f-arrow">→</div></div>
    <div class="f-step"><div class="f-step-lbl">Oferta{{KPI_ESCOPO_ANUNCIANTE}}</div><div class="f-step-val">{{KPI_OFERTANTES}}</div><div class="f-step-pct">{{KPI_PCT_OFERTA_LOGIN}} dos c/ login</div><div class="f-arrow">→</div></div>
    <div class="f-step"><div class="f-step-lbl">Compra{{KPI_ESCOPO_ANUNCIANTE}}</div><div class="f-step-val">{{KPI_COMPRADORES}}</div><div class="f-step-pct">{{KPI_PCT_COMPRA_OFERTA}} dos ofertantes</div></div>
  </div>
</div>

<!-- ═══ RECÊNCIA ═══ -->
<!-- DADOS: BC-03, BC-04, BC-05 (recência) — {{REC_*_QTD}} e {{REC_*_WIDTH}} (% para a barra) -->
<div class="sec">
  <div class="sec-head"><div class="sec-title">Recência — Há Quanto Tempo Sem Agir</div><div class="sec-line"></div></div>
  <div class="sec-note">Tempo desde a última ação de cada cliente, considerando apenas quem já fez aquela ação ao menos uma vez. O acesso considera todo o histórico disponível.</div>
  <div class="rec-grid">
    <div class="rec-card">
      <div class="rec-head"><span class="rec-dot" style="background:var(--brand)"></span><span style="color:var(--brand)">Parou de Logar</span></div>
      <div class="rec-row"><span class="rec-period">0–30d</span><div class="rec-bar-bg"><div class="rec-bar" style="width:{{REC_LOGIN_00_30_WIDTH}}%;background:var(--brand)"></div></div><span class="rec-count">{{REC_LOGIN_00_30_QTD}}</span></div>
      <div class="rec-row"><span class="rec-period">31–90d</span><div class="rec-bar-bg"><div class="rec-bar" style="width:{{REC_LOGIN_31_90_WIDTH}}%;background:var(--brand);opacity:.6"></div></div><span class="rec-count">{{REC_LOGIN_31_90_QTD}}</span></div>
      <div class="rec-row"><span class="rec-period">91–180d</span><div class="rec-bar-bg"><div class="rec-bar" style="width:{{REC_LOGIN_91_180_WIDTH}}%;background:var(--amber);opacity:.7"></div></div><span class="rec-count">{{REC_LOGIN_91_180_QTD}}</span></div>
      <div class="rec-row"><span class="rec-period">180d+</span><div class="rec-bar-bg"><div class="rec-bar" style="width:{{REC_LOGIN_180_WIDTH}}%;background:var(--bad);opacity:.75"></div></div><span class="rec-count">{{REC_LOGIN_180_QTD}}</span></div>
      <div class="rec-footer">Com login: <strong style="color:var(--brand)">{{KPI_COM_LOGIN}}</strong> · Nunca logou: <strong style="color:var(--bad)">{{KPI_SEM_LOGIN}}</strong></div>
    </div>
    <div class="rec-card">
      <div class="rec-head"><span class="rec-dot" style="background:var(--brand2)"></span><span style="color:var(--brand2)">Parou de Ofertar</span></div>
      <div class="rec-row"><span class="rec-period">0–30d</span><div class="rec-bar-bg"><div class="rec-bar" style="width:{{REC_OFERTA_00_30_WIDTH}}%;background:var(--brand2)"></div></div><span class="rec-count">{{REC_OFERTA_00_30_QTD}}</span></div>
      <div class="rec-row"><span class="rec-period">31–90d</span><div class="rec-bar-bg"><div class="rec-bar" style="width:{{REC_OFERTA_31_90_WIDTH}}%;background:var(--brand2);opacity:.6"></div></div><span class="rec-count">{{REC_OFERTA_31_90_QTD}}</span></div>
      <div class="rec-row"><span class="rec-period">91–180d</span><div class="rec-bar-bg"><div class="rec-bar" style="width:{{REC_OFERTA_91_180_WIDTH}}%;background:var(--amber);opacity:.7"></div></div><span class="rec-count">{{REC_OFERTA_91_180_QTD}}</span></div>
      <div class="rec-row"><span class="rec-period">180d+</span><div class="rec-bar-bg"><div class="rec-bar" style="width:{{REC_OFERTA_180_WIDTH}}%;background:var(--bad);opacity:.75"></div></div><span class="rec-count">{{REC_OFERTA_180_QTD}}</span></div>
      <div class="rec-footer">Total já ofertou: <strong style="color:var(--brand2)">{{KPI_OFERTANTES}}</strong></div>
    </div>
    <div class="rec-card">
      <div class="rec-head"><span class="rec-dot" style="background:var(--amber)"></span><span style="color:var(--amber)">Parou de Comprar</span></div>
      <div class="rec-row"><span class="rec-period">0–30d</span><div class="rec-bar-bg"><div class="rec-bar" style="width:{{REC_COMPRA_00_30_WIDTH}}%;background:var(--amber)"></div></div><span class="rec-count">{{REC_COMPRA_00_30_QTD}}</span></div>
      <div class="rec-row"><span class="rec-period">31–90d</span><div class="rec-bar-bg"><div class="rec-bar" style="width:{{REC_COMPRA_31_90_WIDTH}}%;background:var(--amber);opacity:.6"></div></div><span class="rec-count">{{REC_COMPRA_31_90_QTD}}</span></div>
      <div class="rec-row"><span class="rec-period">91–180d</span><div class="rec-bar-bg"><div class="rec-bar" style="width:{{REC_COMPRA_91_180_WIDTH}}%;background:var(--amber);opacity:.4"></div></div><span class="rec-count">{{REC_COMPRA_91_180_QTD}}</span></div>
      <div class="rec-row"><span class="rec-period">180d+</span><div class="rec-bar-bg"><div class="rec-bar" style="width:{{REC_COMPRA_180_WIDTH}}%;background:var(--bad);opacity:.75"></div></div><span class="rec-count">{{REC_COMPRA_180_QTD}}</span></div>
      <div class="rec-footer">Total já comprou: <strong style="color:var(--amber)">{{KPI_COMPRADORES}}</strong></div>
    </div>
  </div>
</div>

<!-- ═══ EVOLUÇÃO MENSAL ═══ -->
<!-- DADOS: BC-06, BC-07, BC-08, BC-09, BC-10 → arrays JS ao final do documento -->
<div class="sec">
  <div class="sec-head"><div class="sec-title">Evolução Mensal</div><div class="sec-line"></div></div>
  <div class="chart-card">
    <div class="ct">Usuários únicos por etapa</div>
    <div class="cs">{{PERIODO_EVOLUCAO}}{{KPI_ESCOPO_ANUNCIANTE}}</div>
    <div class="legend"><span><span class="ldot" style="background:var(--brand)"></span>Logaram</span><span><span class="ldot" style="background:var(--brand2)"></span>Ofertaram</span><span><span class="ldot" style="background:var(--amber)"></span>Compraram</span></div>
    <div style="position:relative;height:260px"><canvas id="ch_uniq"></canvas></div>
  </div>
  <!-- Novos vs. recorrentes - BC-25/26/27 (ver preenchimento.md 6.1) -->
  <div class="chart-card">
    <div class="ct">Acessos &mdash; novos vs. recorrentes</div>
    <div class="cs">Clientes que acessaram em cada mês, separados entre quem estava acessando pela primeira vez na história e quem já tinha acessado antes. Quem acessou pela primeira vez em julho conta como novo em julho e como recorrente em agosto. As duas barras somam o total de clientes únicos do mês.</div>
    <div class="legend"><span><span class="ldot" style="background:var(--amber)"></span>Novos</span><span><span class="ldot" style="background:var(--brand)"></span>Recorrentes</span></div>
    <div style="position:relative;height:200px"><canvas id="ch_nr_login"></canvas></div>
  </div>
  <div class="chart-card">
    <div class="ct">Ofertas &mdash; novos vs. recorrentes</div>
    <div class="cs">Clientes que ofertaram em cada mês, separados entre quem deu o primeiro lance da história dele e quem já tinha ofertado antes. Quem ofertou pela primeira vez em julho conta como novo em julho e como recorrente em agosto. As duas barras somam o total de clientes únicos do mês.</div>
    <div class="legend"><span><span class="ldot" style="background:var(--amber)"></span>Novos</span><span><span class="ldot" style="background:var(--brand)"></span>Recorrentes</span></div>
    <div style="position:relative;height:200px"><canvas id="ch_nr_oferta"></canvas></div>
  </div>
  <div class="chart-card">
    <div class="ct">Compras &mdash; novos vs. recorrentes</div>
    <div class="cs">Clientes que compraram em cada mês, separados entre quem fez a primeira compra da história dele e quem já tinha comprado antes. Quem comprou pela primeira vez em julho conta como novo em julho e como recorrente em agosto. As duas barras somam o total de clientes únicos do mês.</div>
    <div class="legend"><span><span class="ldot" style="background:var(--amber)"></span>Novos</span><span><span class="ldot" style="background:var(--brand)"></span>Recorrentes</span></div>
    <div style="position:relative;height:200px"><canvas id="ch_nr_compra"></canvas></div>
  </div>
  <div class="chart-card">
    <div class="ct">Volume financeiro mensal</div>
    <div class="cs">Valor total pago nas compras concluídas{{KPI_ESCOPO_ANUNCIANTE}}</div>
    <div style="position:relative;height:220px"><canvas id="ch_vol"></canvas></div>
  </div>
  <div class="chart-card">
    <div class="ct">Novos cadastros na base</div>
    <div class="cs">Novos cadastros por mês</div>
    <div style="position:relative;height:180px"><canvas id="ch_cad"></canvas></div>
  </div>
  <div class="chart-card">
    <div class="ct">Cadastros por dia — últimos 30 dias</div>
    <div class="cs">{{PERIODO_CAD_DIA}} · com linha de tendência</div>
    <div class="legend"><span><span class="ldot" style="background:#cbd5e1"></span>Cadastros/dia</span><span><span class="ldot" style="background:var(--amber)"></span>Tendência</span></div>
    <div style="position:relative;height:200px"><canvas id="ch_cad_dia"></canvas></div>
  </div>
  <div class="chart-card">
    <div class="ct">Média de ofertas recebidas por anúncio publicado</div>
    <div class="cs">Veículos anunciados, vendidos e ofertas recebidas em cada mês</div>
    <div style="position:relative;height:200px"><canvas id="ch_oferta_anuncio"></canvas></div>
    <div class="sec-note" style="margin-top:10px;margin-bottom:0">As ofertas recebidas consideram todos os compradores da plataforma, não apenas os clientes desta base — representam a demanda total sobre os veículos anunciados. Cada veículo conta uma vez no mês, mesmo que tenha sido anunciado mais de uma vez, e só é considerado vendido no mês em que a venda de fato ocorreu.</div>
  </div>
  <div class="chart-card">
    <div class="ct">Êxito de Venda por Mês</div>
    <div class="cs">Percentual dos veículos anunciados que foi vendido no mês</div>
    <div style="position:relative;height:180px"><canvas id="ch_exito_venda"></canvas></div>
    <div class="sec-note" style="margin-top:10px;margin-bottom:0">Mesma informação do gráfico anterior, apresentada como percentual em vez de duas barras.</div>
  </div>
  <div class="chart-card">
    <div class="ct">Média de Publicações por Veículo</div>
    <div class="cs">Quantas vezes, em média, cada veículo precisou ser anunciado</div>
    <div style="position:relative;height:180px"><canvas id="ch_media_publicacoes"></canvas></div>
    <div class="sec-note" style="margin-top:10px;margin-bottom:0">1,00 significa que cada veículo foi anunciado uma única vez. Acima disso, foi preciso anunciar a mesma placa novamente. Mede o esforço de recolocação do veículo, não a demanda.</div>
  </div>
</div>

<!-- ═══ DISTRIBUIÇÃO GEOGRÁFICA (UF) ═══ -->
<!-- DADOS: BC-15 (cadastros, total histórico) e BC-16 (compradores, janela 12 meses)
     Gráficos de barra horizontal (Chart.js, indexAxis:'y') em vez de tabela — mais
     compacto com até 27 UFs + "Não identificada". Ver preenchimento.md § 8. -->
<div class="sec">
  <div class="sec-head"><div class="sec-title">Distribuição Geográfica (UF)</div><div class="sec-line"></div></div>
  <div class="sec-note">Cadastros por Estado — estado das lojas vinculadas a cada cliente, em todo o período ({{KPI_TOTAL_BASE}} clientes). Quem tem loja em mais de um estado aparece em cada um, por isso a soma ({{UF_CADASTRO_SOMA}}) fica acima do total.</div>
  <div class="rec-grid" style="grid-template-columns:repeat(3,1fr)">
    <div class="tbl-wrap"><table><thead><tr><th>UF</th><th class="r">Cadastros</th><th class="r">%</th></tr></thead><tbody>
{{UF_CADASTRO_ROWS_COL1}}
    </tbody></table></div>
    <div class="tbl-wrap"><table><thead><tr><th>UF</th><th class="r">Cadastros</th><th class="r">%</th></tr></thead><tbody>
{{UF_CADASTRO_ROWS_COL2}}
    </tbody></table></div>
    <div class="tbl-wrap"><table><thead><tr><th>UF</th><th class="r">Cadastros</th><th class="r">%</th></tr></thead><tbody>
{{UF_CADASTRO_ROWS_COL3}}
    </tbody></table></div>
  </div>
  <div class="chart-card" style="margin-top:14px">
    <div class="ct">Compradores por Estado (UF)</div>
    <div class="cs">Estado da loja que comprou · todo o período{{KPI_ESCOPO_ANUNCIANTE}}</div>
    <div style="position:relative;height:320px"><canvas id="ch_uf_compra"></canvas></div>
    <div class="sec-note" style="margin-top:10px;margin-bottom:0">"Não identificada" = compra sem loja informada ou com endereço incompleto.</div>
  </div>
</div>

<!-- ═══ TOP COMPRADORES — HISTÓRICO ═══ -->
<div class="sec">
  <div class="sec-head"><div class="sec-title">Top 10 Clientes — Compras no Período Total</div><div class="sec-line"></div></div>
  <div class="sec-note">Considera todo o período.</div>
  <div class="tbl-wrap">
    <table>
      <thead><tr><th>#</th><th>Cliente</th><th class="r">Compras (total)</th><th class="r">Volume (total)</th><th class="r">Última compra</th></tr></thead>
      <tbody>
{{TOP_HIST_ROWS}}
      </tbody>
    </table>
  </div>
</div>

<!-- ═══ TOP COMPRADORES — ANO ATUAL ═══ -->
<div class="sec">
  <div class="sec-head"><div class="sec-title">Top 10 Clientes — Compras em {{ANO_ATUAL}}</div><div class="sec-line"></div></div>
  <div class="sec-note">Ranking do ano corrente (01/01/{{ANO_ATUAL}} em diante).</div>
  <div class="tbl-wrap">
    <table>
      <thead><tr><th>#</th><th>Cliente</th><th class="r">Compras {{ANO_ATUAL}}</th><th class="r">Volume {{ANO_ATUAL}}</th><th class="r">Última compra</th></tr></thead>
      <tbody>
{{TOP_ANO_ROWS}}
      </tbody>
    </table>
  </div>
  <div class="sec-note" style="margin-top:10px;margin-bottom:0">★ também aparece no Top 10 de Ofertas {{ANO_ATUAL}} (ver cruzamento abaixo).</div>
</div>

<!-- ═══ TOP ACESSO x OFERTA + CRUZAMENTO ═══ -->
<div class="sec">
  <div class="sec-head"><div class="sec-title">Top 10 Acesso e Top 10 Oferta — {{ANO_ATUAL}}</div><div class="sec-line"></div></div>
  <div class="sec-note">Ordenado pelo número de dias diferentes em que o cliente acessou a plataforma. ★ marca quem também aparece nos rankings de compra acima.</div>
  <div class="rec-grid" style="grid-template-columns:1fr 1fr">
    <div class="tbl-wrap">
      <table>
        <thead><tr><th>#</th><th>Mais dias ativos</th><th class="r">Dias distintos</th></tr></thead>
        <tbody>
{{TOP_ACESSO_ROWS}}
        </tbody>
      </table>
    </div>
    <div class="tbl-wrap">
      <table>
        <thead><tr><th>#</th><th>Mais ofertas</th><th class="r">Ofertas</th></tr></thead>
        <tbody>
{{TOP_OFERTA_ROWS}}
        </tbody>
      </table>
    </div>
  </div>
  <div class="sec-note" style="margin-top:10px;margin-bottom:0">{{CRUZAMENTO_NOTA}}</div>
</div>

<!-- ═══ INSIGHTS ═══ -->
<!-- Gerar 4 a 6 cards em Python, a partir dos números reais deste escopo.
     NUNCA comparar com outra base/cliente (regra de ouro 7). -->
<div class="sec">
  <div class="sec-head"><div class="sec-title">Destaques do Período</div><div class="sec-line"></div></div>
  <div class="insight-grid">
{{INSIGHTS_HTML}}
  </div>
</div>

</div><!-- /panel-geral -->

<div id="panel-matriz" class="panel">
<!-- ═══ RAIO-X DE COMPRADORES (MATRIZ) ═══ -->
<!-- Seção nova (não existe na skill genérica nem na versão anterior do C6). Adaptada do
     relatório "Raio-X" usado no IGA, com clusters substituídos por status do laudo cautelar
     (vehicle_precautionary_reports.situation) — ver queries.md BC-19 a BC-24. Filtro de
     Ano/Mês roda 100% no navegador sobre dados agregados por (comprador, mês, dimensão);
     não precisa de nova consulta ao trocar o filtro. Janela de 12 meses (mês atual + 11 fechados), igual à janela da evolução
     mensal do resto do relatório — ver
     preenchimento.md § 10 sobre por quê (custo de extração de uma janela maior). -->
<div class="sec">
  <div class="sec-head"><div class="sec-title">Raio-X de Compradores</div><div class="sec-line"></div></div>
  <div class="period-badge">Período analisado: {{RX_PERIODO_LABEL}}</div>
  <div class="sec-note">Perfil de compra de cada cliente que já comprou, considerando compras em qualquer loja da plataforma. Use o filtro de ano/mês abaixo — ele vale também para a aba "Raio-X Individual".</div>
  <div class="rx-toolbar">
    <label for="rxAno">Ano</label>
    <select id="rxAno"></select>
    <label for="rxMes">Mês</label>
    <select id="rxMes"></select>
    <span class="rx-count" id="rxCount"></span>
  </div>

  <div class="tbl-wrap" style="margin-bottom:20px">
    <div class="table-tools" style="padding:14px 14px 0"><input class="search" id="rxSearch" placeholder="Filtrar por nome, loja ou CNPJ..."></div>
    <div style="overflow-x:auto">
    <table id="rxMatrix">
      <thead><tr>
        <th class="sortable" data-key="name">Comprador</th>
        <th class="r sortable" data-key="compras">Compras</th>
        <th class="r sortable" data-key="exito">Êxito</th>
        <th class="r sortable" data-key="ticket_medio">Ticket médio</th>
        <th class="sortable" data-key="faixa">Faixa dominante</th>
        <th class="r sortable" data-key="recfipe">Rec. FIPE</th>
        <th class="r sortable" data-key="recmolicar">Rec. Molicar</th>
        <th class="sortable" data-key="modelo">Modelo dominante</th>
        <th class="r sortable" data-key="modelos_dist">Modelos distintos</th>
        <th class="sortable" data-key="laudo">Laudo cautelar dominante</th>
        <th class="sortable" data-key="uf">Localização dominante</th>
      </tr></thead>
      <tbody id="rxMatrixBody"></tbody>
    </table>
    </div>
  </div>
  <div class="sec-note" style="margin-top:-10px;margin-bottom:0">"Êxito" = compras concluídas dividido pelo número de disputas em que o cliente deu lance no período. A "Faixa dominante" mostra a faixa de valor mais frequente das compras dele.</div>
</div>
</div><!-- /panel-matriz -->

<div id="panel-individual" class="panel">
<!-- ═══ RAIO-X INDIVIDUAL ═══ -->
<div class="sec">
  <div class="sec-head"><div class="sec-title">Raio-X Individual</div><div class="sec-line"></div></div>
  <div class="period-badge">Período analisado: {{RX_PERIODO_LABEL}}</div>
  <div class="rx-toolbar">
    <label for="rxAno2">Ano</label>
    <select id="rxAno2"></select>
    <label for="rxMes2">Mês</label>
    <select id="rxMes2"></select>
  </div>
  <div class="chart-card">
    <div class="ct">Raio-X individual do comprador</div>
    <div class="cs">Selecione um comprador para ver o perfil de compra detalhado no período filtrado acima.</div>
    <label class="rx-combo-label" for="rxBuyerComboField">Comprador</label>
    <div class="rx-combo" id="rxBuyerCombo">
      <div class="rx-combo-field" id="rxBuyerComboField" tabindex="0">
        <span class="rx-combo-value placeholder" id="rxBuyerComboValue">Selecione um comprador</span>
        <span class="rx-combo-icons">
          <button type="button" class="rx-combo-clear" id="rxBuyerComboClear" aria-label="Limpar" style="display:none">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          </button>
          <span class="rx-combo-chevron">
            <svg width="11" height="7" viewBox="0 0 11 7" fill="none"><path d="M1 1L5.5 5.5L10 1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </span>
      </div>
      <div class="rx-combo-panel" id="rxBuyerComboPanel" hidden>
        <div class="rx-combo-search-wrap">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.3"/><path d="M11 11L14.5 14.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          <input type="text" id="rxBuyerSearch" placeholder="Buscar comprador..." autocomplete="off">
        </div>
        <div class="rx-combo-list" id="rxBuyerComboList"></div>
      </div>
      <input type="hidden" id="rxBuyerSelect">
    </div>
    <div class="buyer-detail" id="rxBuyerDetail"><div class="rx-empty">Selecione um comprador acima.</div></div>
  </div>
</div>
</div><!-- /panel-individual -->

<div class="footer">
  <span>Cars2You · {{FOOTER_ESCOPO}} · Fonte: cars2you_production</span>
  <span>Uso interno · Análise de base de clientes — dados validados em {{DATA_GERACAO}}</span>
</div>

</div>

<script>
/* ══════════════════════════════════════════════════════════════════
   ARRAYS DE DADOS — preencher com os resultados de BC-06 a BC-10.
   Todos os arrays devem ter o mesmo número de posições que {{MESES_JSON}}.
   ══════════════════════════════════════════════════════════════════ */
const BRAND=getComputedStyle(document.documentElement).getPropertyValue('--brand').trim();
const BRAND2=getComputedStyle(document.documentElement).getPropertyValue('--brand2').trim();
const AMBER=getComputedStyle(document.documentElement).getPropertyValue('--amber').trim();
const GOOD='#047857';
const GR='rgba(15,23,42,0.06)', TK='#94a3b8';
const MON=[{{MESES_JSON}}];

function lineOpts(){return {responsive:true,maintainAspectRatio:false,
  plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false}},
  scales:{x:{grid:{color:GR},ticks:{color:TK,font:{size:11}},border:{display:false}},
          y:{grid:{color:GR},ticks:{color:TK},border:{display:false}}}};}
function barOpts(){return {responsive:true,maintainAspectRatio:false,
  plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false}},
  scales:{x:{grid:{color:GR},ticks:{color:TK,font:{size:11}},border:{display:false}},
          y:{grid:{color:GR},ticks:{color:TK},border:{display:false}}}};}

new Chart(document.getElementById('ch_uniq'),{type:'line',data:{labels:MON,datasets:[
  {label:'Logaram',data:[{{LOGIN_DATA}}],borderColor:BRAND,backgroundColor:BRAND+'14',tension:.35,pointRadius:4,fill:true},
  {label:'Ofertaram',data:[{{OFERTA_DATA}}],borderColor:BRAND2,backgroundColor:BRAND2+'14',tension:.35,pointRadius:4,fill:true},
  {label:'Compraram',data:[{{COMPRA_DATA}}],borderColor:AMBER,backgroundColor:AMBER+'14',tension:.35,pointRadius:4,fill:true}
]},options:lineOpts()});

/* Novos vs. recorrentes - BC-25/26/27. 'Novo' = o mes e o mes da PRIMEIRA ocorrencia
   do cliente na historia inteira da plataforma. novos + recorrentes = ch_uniq do mes. */
function stackOpts(){return {responsive:true,maintainAspectRatio:false,
  plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false}},
  scales:{x:{stacked:true,grid:{color:GR},ticks:{color:TK,font:{size:11}},border:{display:false}},
          y:{stacked:true,grid:{color:GR},ticks:{color:TK},border:{display:false}}}};}
function nrChart(id,novos,recorrentes){
  new Chart(document.getElementById(id),{type:'bar',data:{labels:MON,datasets:[
    {label:'Novos',data:novos,backgroundColor:AMBER+'cc',borderRadius:4},
    {label:'Recorrentes',data:recorrentes,backgroundColor:BRAND+'cc',borderRadius:4}
  ]},options:stackOpts()});
}
nrChart('ch_nr_login',[{{NR_LOGIN_NOVOS_DATA}}],[{{NR_LOGIN_REC_DATA}}]);
nrChart('ch_nr_oferta',[{{NR_OFERTA_NOVOS_DATA}}],[{{NR_OFERTA_REC_DATA}}]);
nrChart('ch_nr_compra',[{{NR_COMPRA_NOVOS_DATA}}],[{{NR_COMPRA_REC_DATA}}]);

new Chart(document.getElementById('ch_vol'),{type:'bar',data:{labels:MON,datasets:[
  {label:'Volume (R$ Mi)',data:[{{VOLUME_DATA}}],backgroundColor:BRAND+'cc',borderRadius:4}
]},options:barOpts()});

new Chart(document.getElementById('ch_cad'),{type:'bar',data:{labels:MON,datasets:[
  {label:'Cadastros',data:[{{CADASTROS_DATA}}],backgroundColor:GOOD+'cc',borderRadius:4}
]},options:barOpts()});

/* ══════════════════════════════════════════════════════════════════
   CADASTROS POR DIA (30 dias) + TENDÊNCIA — BC-18, ver preenchimento.md § 9.
   Dias sem cadastro já vêm preenchidos com 0 no array; tendência é reta de
   regressão linear simples, calculada fora do template.
   ══════════════════════════════════════════════════════════════════ */
const DIAS30=[{{CAD_DIA_LABELS_JSON}}];
const CAD_DIA=[{{CAD_DIA_DATA}}];
const CAD_TREND=[{{CAD_DIA_TREND_DATA}}];
new Chart(document.getElementById('ch_cad_dia'),{data:{labels:DIAS30,datasets:[
  {type:'bar',label:'Cadastros/dia',data:CAD_DIA,backgroundColor:'#cbd5e1',borderRadius:3,order:2},
  {type:'line',label:'Tendência',data:CAD_TREND,borderColor:AMBER,backgroundColor:AMBER,borderWidth:2,pointRadius:0,tension:0,fill:false,order:1}
]},options:{responsive:true,maintainAspectRatio:false,
  plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false}},
  scales:{x:{grid:{color:GR},ticks:{color:TK,font:{size:10}},border:{display:false}},
          y:{grid:{color:GR},ticks:{color:TK},border:{display:false}}}}});

const ANUNCIOS_PUB=[{{ANUNCIOS_DATA}}];
const VEICULOS_VEND=[{{VEICULOS_VENDIDOS_DATA}}];
const ANUNCIOS_CRIADOS=[{{ANUNCIOS_CRIADOS_DATA}}];

new Chart(document.getElementById('ch_oferta_anuncio'),{
  data:{labels:MON,datasets:[
    {type:'bar',label:'Anúncios publicados',data:ANUNCIOS_PUB,backgroundColor:'#cbd5e1',borderRadius:4,yAxisID:'y',order:2},
    {type:'bar',label:'Veículos vendidos',data:VEICULOS_VEND,backgroundColor:GOOD+'cc',borderRadius:4,yAxisID:'y',order:2},
    {type:'line',label:'Média de ofertas/anúncio',data:[{{MEDIA_OFERTA_ANUNCIO_DATA}}],borderColor:AMBER,backgroundColor:AMBER,tension:.35,pointRadius:4,yAxisID:'y1',order:1}
  ]},
  options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:true,position:'top',labels:{color:TK,font:{size:11}}},tooltip:{mode:'index',intersect:false}},
    scales:{
      x:{grid:{color:GR},ticks:{color:TK,font:{size:11}},border:{display:false}},
      y:{position:'left',grid:{color:GR},ticks:{color:TK},border:{display:false},title:{display:true,text:'Anúncios',color:TK,font:{size:10}}},
      y1:{position:'right',grid:{display:false},ticks:{color:TK},border:{display:false},title:{display:true,text:'Média/anúncio',color:TK,font:{size:10}}}
    }}
});

new Chart(document.getElementById('ch_exito_venda'),{type:'bar',data:{labels:MON,datasets:[
  {label:'Êxito de venda',data:[{{EXITO_VENDA_DATA}}],backgroundColor:GOOD+'cc',borderRadius:4}
]},plugins:[ChartDataLabels],options:{responsive:true,maintainAspectRatio:false,
  plugins:{legend:{display:false},
    datalabels:{anchor:'end',align:'start',color:'#fff',font:{weight:600,size:11},formatter:v=>v+'%'},
    tooltip:{mode:'index',intersect:false,callbacks:{
      label:c=>\`\${VEICULOS_VEND[c.dataIndex]} vendidos de \${ANUNCIOS_PUB[c.dataIndex]} publicados\`
    }}},
  scales:{x:{grid:{color:GR},ticks:{color:TK,font:{size:11}},border:{display:false}},
          y:{min:0,max:100,grid:{color:GR},ticks:{color:TK,callback:v=>v+'%'},border:{display:false}}}}});

new Chart(document.getElementById('ch_media_publicacoes'),{type:'line',data:{labels:MON,datasets:[
  {label:'Publicações por veículo',data:[{{MEDIA_PUBLICACOES_DATA}}],borderColor:AMBER,backgroundColor:AMBER,tension:.35,pointRadius:4,fill:false}
]},plugins:[ChartDataLabels],options:{responsive:true,maintainAspectRatio:false,
  plugins:{legend:{display:false},
    datalabels:{anchor:'end',align:'top',color:TK,font:{weight:600,size:11},formatter:v=>v.toFixed(2).replace('.',',')},
    tooltip:{mode:'index',intersect:false,callbacks:{
      label:c=>\`\${ANUNCIOS_CRIADOS[c.dataIndex]} anúncios para \${ANUNCIOS_PUB[c.dataIndex]} veículos\`
    }}},
  scales:{x:{grid:{color:GR},ticks:{color:TK,font:{size:11}},border:{display:false}},
          y:{min:1,grid:{color:GR},ticks:{color:TK,callback:v=>v.toFixed(2).replace('.',',')},border:{display:false}}}}});

/* ══════════════════════════════════════════════════════════════════
   COMPRADORES POR UF — BC-16, ver preenchimento.md § 8. Barra (compras,
   eixo esquerdo) + linha (volume R$ Mi, eixo direito), igual ao gráfico
   "Média de ofertas por anúncio". Cadastros por UF (BC-15) virou tabela
   em 3 colunas no HTML acima, não usa Chart.js.
   ══════════════════════════════════════════════════════════════════ */
const UF_COMPRA_LABELS=[{{UF_COMPRA_LABELS_JSON}}];
const UF_COMPRA_DATA=[{{UF_COMPRA_DATA}}];
const UF_COMPRA_VOL=[{{UF_COMPRA_VOLUME_MI_DATA}}];
const UF_COMPRA_BARCOLORS=UF_COMPRA_LABELS.map((l,i)=>i===UF_COMPRA_LABELS.length-1?TK:'#cbd5e1');
new Chart(document.getElementById('ch_uf_compra'),{data:{labels:UF_COMPRA_LABELS,datasets:[
  {type:'bar',label:'Compras',data:UF_COMPRA_DATA,backgroundColor:UF_COMPRA_BARCOLORS,borderRadius:4,yAxisID:'y',order:2},
  {type:'line',label:'Volume (R$ Mi)',data:UF_COMPRA_VOL,borderColor:AMBER,backgroundColor:AMBER,tension:.35,pointRadius:4,yAxisID:'y1',order:1}
]},options:{responsive:true,maintainAspectRatio:false,
  plugins:{legend:{display:true,position:'top',labels:{color:TK,font:{size:11}}},tooltip:{mode:'index',intersect:false}},
  scales:{
    x:{grid:{color:GR},ticks:{color:TK,font:{size:11}},border:{display:false}},
    y:{position:'left',grid:{color:GR},ticks:{color:TK},border:{display:false},title:{display:true,text:'Compras',color:TK,font:{size:10}}},
    y1:{position:'right',grid:{display:false},ticks:{color:TK},border:{display:false},title:{display:true,text:'Volume (R$ Mi)',color:TK,font:{size:10}}}
  }}});

/* ══════════════════════════════════════════════════════════════════
   RAIO-X DE COMPRADORES — dados agregados por (comprador, mês, dimensão).
   Ver preenchimento.md § 10 e queries.md BC-19 a BC-24. Filtro Ano/Mês
   recalcula tudo no navegador sobre estes arrays — não precisa de nova
   consulta ao trocar o filtro.
   ══════════════════════════════════════════════════════════════════ */








/*__RX_DATA_MARKER__*/
const RX_LAUDO_LABELS={aprovado:'Aprovado',aprovado_com_apontamento:'Aprovado c/ apontamento',reprovado:'Reprovado',nao_informado:'Não informado',sem_registro:'Sem registro'};
const RX_MES_NOMES=['','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const RX_NAME_BY_ID=Object.fromEntries(RX_BUYERS.map(b=>[b[0],b[1]]));
const RX_SHOP_BY_ID=Object.fromEntries(RX_BUYERS.map(b=>[b[0],[b[2]||'',b[3]||'']]));
function rxShopText(uid){
  const s=RX_SHOP_BY_ID[uid]||['',''];
  if(!s[0]&&!s[1]) return '';
  return s[0]+(s[1]?' \u00b7 CNPJ '+s[1]:'');
}
function rxShopSub(uid){
  const t=rxShopText(uid);
  return t?\`<span class="cell-sub">\${t}</span>\`:'';
}

function rxFmtBRL(v){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(v||0)}
function rxFmtPct(v){return v==null?'—':((v||0)*100).toFixed(1).replace('.',',')+'%'}

const rxYms=[...new Set(RX_TOTALS.map(r=>r[1]))].sort();
const rxYears=[...new Set(rxYms.map(y=>y.slice(0,4)))].sort();
const rxAnoSel=document.getElementById('rxAno'), rxMesSel=document.getElementById('rxMes');
const rxAnoSel2=document.getElementById('rxAno2'), rxMesSel2=document.getElementById('rxMes2');
const rxAnoOptsHtml='<option value="">Todos</option>'+rxYears.map(y=>\`<option value="\${y}">\${y}</option>\`).join('');
rxAnoSel.innerHTML=rxAnoOptsHtml;
rxAnoSel2.innerHTML=rxAnoOptsHtml;
function rxMesOptsHtml(ano){
  const meses=[...new Set(rxYms.filter(y=>!ano||y.startsWith(ano)).map(y=>y.slice(5,7)))].sort();
  return '<option value="">Todos</option>'+meses.map(m=>\`<option value="\${m}">\${RX_MES_NOMES[parseInt(m,10)]}</option>\`).join('');
}
function rxRebuildMesOptions(){
  rxMesSel.innerHTML=rxMesOptsHtml(rxAnoSel.value);
  rxMesSel2.innerHTML=rxMesOptsHtml(rxAnoSel2.value);
}
rxRebuildMesOptions();

function rxSelectedYms(){
  const ano=rxAnoSel.value, mes=rxMesSel.value;
  return rxYms.filter(y=> (!ano||y.startsWith(ano)) && (!mes||y.slice(5,7)===mes) );
}

function rxSumByBuyer(rows,ymsSet){
  const m={};
  for(const [uid,ym,...rest] of rows){ if(!ymsSet.has(ym)) continue; (m[uid]=m[uid]||[]).push(rest); }
  return m;
}
function rxDominant(entries){
  if(!entries||!entries.length) return {label:'—',pct:0,total:0};
  const agg={}; let total=0;
  for(const [label,qtd] of entries){ agg[label]=(agg[label]||0)+qtd; total+=qtd; }
  let best=null,bestQtd=-1;
  for(const k in agg){ if(agg[k]>bestQtd){bestQtd=agg[k];best=k;} }
  return {label:best,pct: total? bestQtd/total:0, total, agg};
}

function rxBuildMatrix(ymsSet){
  const totalsByBuyer=rxSumByBuyer(RX_TOTALS,ymsSet);
  const modeloByBuyer=rxSumByBuyer(RX_MODELO,ymsSet);
  const laudoByBuyer=rxSumByBuyer(RX_LAUDO,ymsSet);
  const ufByBuyer=rxSumByBuyer(RX_UF,ymsSet);
  const faixaByBuyer=rxSumByBuyer(RX_FAIXA,ymsSet);
  const particByBuyer=rxSumByBuyer(RX_PARTIC,ymsSet);

  const rows=[];
  for(const uid in totalsByBuyer){
    const t=totalsByBuyer[uid];
    let compras=0,volume=0,priceFipe=0,fipeSum=0,priceMol=0,molSum=0;
    for(const [c,v,pf,fs,pm,ms] of t){ compras+=c; volume+=v; priceFipe+=pf; fipeSum+=fs; priceMol+=pm; molSum+=ms; }
    if(compras<=0) continue;
    let partic=0; for(const [p] of (particByBuyer[uid]||[])) partic+=p;
    const modeloDom=rxDominant(modeloByBuyer[uid]);
    const laudoDom=rxDominant((laudoByBuyer[uid]||[]).map(([k,q])=>[RX_LAUDO_LABELS[k]||k,q]));
    const ufDom=rxDominant(ufByBuyer[uid]);
    const faixaDom=rxDominant(faixaByBuyer[uid]);
    rows.push({
      id:+uid, name:RX_NAME_BY_ID[uid]||uid, shop:rxShopText(uid),
      compras, volume, ticket_medio: volume/compras,
      exito: partic>0? Math.min(compras/partic,1) : null,
      recfipe: fipeSum>0? priceFipe/fipeSum : null,
      recmolicar: molSum>0? priceMol/molSum : null,
      modelo: modeloDom.label, modelos_dist: modeloDom.agg?Object.keys(modeloDom.agg).length:0,
      laudo: laudoDom.label, uf: ufDom.label, faixa: faixaDom.label
    });
  }
  return rows;
}

let rxCurrentRows=[], rxSortKey='compras', rxSortDir=-1;
function rxRenderMatrix(){
  const search=(document.getElementById('rxSearch').value||'').toLowerCase();
  let rows=rxCurrentRows.filter(r=>(r.name+' '+(r.shop||'')).toLowerCase().includes(search));
  rows.sort((a,b)=>{
    let av=a[rxSortKey], bv=b[rxSortKey];
    if(typeof av==='string') return rxSortDir*av.localeCompare(bv);
    av=av==null?-1:av; bv=bv==null?-1:bv;
    return rxSortDir*(av-bv);
  });
  document.getElementById('rxCount').textContent=rows.length+' comprador(es) no período';
  document.getElementById('rxMatrixBody').innerHTML=rows.map(r=>\`<tr>
    <td>\${r.name}\${r.shop?\`<span class="cell-sub">\${r.shop}</span>\`:''}</td>
    <td class="r mono">\${r.compras}</td>
    <td class="r mono">\${rxFmtPct(r.exito)}</td>
    <td class="r mono">\${rxFmtBRL(r.ticket_medio)}</td>
    <td>\${r.faixa}</td>
    <td class="r mono">\${rxFmtPct(r.recfipe)}</td>
    <td class="r mono">\${rxFmtPct(r.recmolicar)}</td>
    <td>\${r.modelo}</td>
    <td class="r mono">\${r.modelos_dist}</td>
    <td>\${r.laudo}</td>
    <td>\${r.uf}</td>
  </tr>\`).join('') || '<tr><td colspan="11" class="rx-empty">Nenhum comprador no período selecionado.</td></tr>';
}

function rxRenderBuyerDetail(ymsSet){
  const uid=document.getElementById('rxBuyerSelect').value;
  const box=document.getElementById('rxBuyerDetail');
  if(!uid){ box.innerHTML='<div class="rx-empty">Selecione um comprador acima.</div>'; return; }
  const row=rxCurrentRows.find(r=>String(r.id)===String(uid));
  if(!row){ box.innerHTML='<div class="rx-empty">Este comprador não teve compras no período selecionado.</div>'; return; }

  function distRows(agg){
    if(!agg) return '<div class="rx-empty" style="padding:8px 0">Sem dados no período.</div>';
    const total=Object.values(agg).reduce((a,b)=>a+b,0);
    return Object.entries(agg).sort((a,b)=>b[1]-a[1]).map(([k,n])=>
      \`<div class="dist-row"><span>\${k}</span><div class="dist-bar-bg"><div class="dist-bar" style="width:\${(n/total*100).toFixed(1)}%"></div></div><b>\${n} (\${rxFmtPct(n/total)})</b></div>\`
    ).join('');
  }
  const modeloAgg=rxDominant(RX_MODELO.filter(([u,ym])=>String(u)===String(uid)&&ymsSet.has(ym)).map(([u,ym,k,q])=>[k,q])).agg;
  const laudoAgg=rxDominant(RX_LAUDO.filter(([u,ym])=>String(u)===String(uid)&&ymsSet.has(ym)).map(([u,ym,k,q])=>[RX_LAUDO_LABELS[k]||k,q])).agg;
  const ufAgg=rxDominant(RX_UF.filter(([u,ym])=>String(u)===String(uid)&&ymsSet.has(ym)).map(([u,ym,k,q])=>[k,q])).agg;
  const faixaAgg=rxDominant(RX_FAIXA.filter(([u,ym])=>String(u)===String(uid)&&ymsSet.has(ym)).map(([u,ym,k,q])=>[k,q])).agg;

  box.innerHTML=\`<div class="rx-buyer-head"><div class="n">\${row.name}</div>\${row.shop?\`<span class="cell-sub">\${row.shop}</span>\`:''}</div>
  <div class="profile-kpis">
    <div class="card mini"><div class="l">Compras</div><div class="v">\${row.compras}</div></div>
    <div class="card mini"><div class="l">Ticket médio</div><div class="v">\${rxFmtBRL(row.ticket_medio)}</div></div>
    <div class="card mini"><div class="l">Êxito</div><div class="v">\${rxFmtPct(row.exito)}</div></div>
    <div class="card mini"><div class="l">Rec. FIPE</div><div class="v">\${rxFmtPct(row.recfipe)}</div></div>
    <div class="card mini"><div class="l">Rec. Molicar</div><div class="v">\${rxFmtPct(row.recmolicar)}</div></div>
    <div class="card mini"><div class="l">Modelos distintos</div><div class="v">\${row.modelos_dist}</div></div>
  </div>
  <div class="dist-grid">
    <div class="card dist-box"><h4>Modelos comprados</h4>\${distRows(modeloAgg)}</div>
    <div class="card dist-box"><h4>Status do laudo cautelar</h4>\${distRows(laudoAgg)}</div>
    <div class="card dist-box"><h4>Localizações</h4>\${distRows(ufAgg)}</div>
    <div class="card dist-box"><h4>Faixas de ticket</h4>\${distRows(faixaAgg)}</div>
  </div>\`;
}

function rxRefresh(){
  const ymsArr=rxSelectedYms();
  const ymsSet=new Set(ymsArr);
  rxCurrentRows=rxBuildMatrix(ymsSet);
  rxRenderMatrix();
  rxRenderBuyerDetail(ymsSet);
}

document.querySelectorAll('#rxMatrix th.sortable').forEach(th=>{
  th.addEventListener('click',()=>{
    const key=th.dataset.key;
    if(rxSortKey===key) rxSortDir*=-1; else {rxSortKey=key; rxSortDir=-1;}
    rxRenderMatrix();
  });
});
document.getElementById('rxSearch').addEventListener('input',rxRenderMatrix);
rxAnoSel.addEventListener('change',()=>{rxAnoSel2.value=rxAnoSel.value; rxRebuildMesOptions(); rxMesSel2.value=''; rxRefresh();});
rxMesSel.addEventListener('change',()=>{rxMesSel2.value=rxMesSel.value; rxRefresh();});
rxAnoSel2.addEventListener('change',()=>{rxAnoSel.value=rxAnoSel2.value; rxRebuildMesOptions(); rxMesSel.value=''; rxRefresh();});
rxMesSel2.addEventListener('change',()=>{rxMesSel.value=rxMesSel2.value; rxRefresh();});
const rxBuyerSelect=document.getElementById('rxBuyerSelect');
const rxBuyersSorted=RX_BUYERS.slice().sort((a,b)=>a[1].localeCompare(b[1]));
const rxCombo=document.getElementById('rxBuyerCombo');
const rxComboField=document.getElementById('rxBuyerComboField');
const rxComboValue=document.getElementById('rxBuyerComboValue');
const rxComboClear=document.getElementById('rxBuyerComboClear');
const rxComboPanel=document.getElementById('rxBuyerComboPanel');
const rxComboList=document.getElementById('rxBuyerComboList');
const rxComboSearch=document.getElementById('rxBuyerSearch');

function rxComboOpen(){
  rxComboPanel.hidden=false;
  rxComboField.classList.add('open');
  rxComboSearch.value='';
  rxComboRenderList('');
  rxComboSearch.focus();
}
function rxComboClose(){
  rxComboPanel.hidden=true;
  rxComboField.classList.remove('open');
}
function rxComboRenderList(q){
  const query=q.trim().toLowerCase();
  const filtered=query?rxBuyersSorted.filter(b=>(b[1]+' '+(b[2]||'')+' '+(b[3]||'')).toLowerCase().includes(query)):rxBuyersSorted;
  if(!filtered.length){ rxComboList.innerHTML='<div class="rx-combo-empty">Nenhum comprador encontrado.</div>'; return; }
  const curId=rxBuyerSelect.value;
  rxComboList.innerHTML=filtered.map(b=>\`<div class="rx-combo-item\${String(b[0])===curId?' selected':''}" data-id="\${b[0]}" data-label="\${b[1]}">\${b[1]}\${rxShopSub(b[0])}</div>\`).join('');
}
function rxComboSelect(id,label){
  rxBuyerSelect.value=id||'';
  const sub=id?rxShopText(id):'';
  rxComboValue.innerHTML=id?\`\${label}\${sub?\`<span class="cell-sub">\${sub}</span>\`:''}\`:'Selecione um comprador';
  rxComboValue.classList.toggle('placeholder',!id);
  rxComboClear.style.display=id?'':'none';
  rxComboClose();
  rxRenderBuyerDetail(new Set(rxSelectedYms()));
}
rxComboField.addEventListener('click',(e)=>{
  if(rxComboClear.contains(e.target)) return;
  rxComboPanel.hidden?rxComboOpen():rxComboClose();
});
rxComboClear.addEventListener('click',(e)=>{ e.stopPropagation(); rxComboSelect('',''); });
rxComboSearch.addEventListener('input',()=>rxComboRenderList(rxComboSearch.value));
rxComboList.addEventListener('click',(e)=>{
  const item=e.target.closest('.rx-combo-item');
  if(!item) return;
  rxComboSelect(item.dataset.id,item.dataset.label);
});
document.addEventListener('click',(e)=>{ if(!rxCombo.contains(e.target)) rxComboClose(); });
document.addEventListener('keydown',(e)=>{ if(e.key==='Escape') rxComboClose(); });

rxRefresh();

document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  document.getElementById(t.dataset.tab).classList.add('active');
}));
</script>

<script>
(function(){
  var NL=String.fromCharCode(10), TB=String.fromCharCode(9), CR=String.fromCharCode(13);
  function norm(t){ t=(t||''); t=t.split(NL).join(' ').split(TB).join(' ').split(CR).join(' ');
    while(t.indexOf('  ')>=0){ t=t.split('  ').join(' '); } return t.trim(); }
  var TIPS=[
   ['Clientes na base','Total de lojistas cadastrados no canal C6 Auto. Exclui acessos internos da Cars2You e do proprio C6.'],
   ['Com login','Clientes que ja acessaram a plataforma pelo menos uma vez, considerando todo o historico.'],
   ['Sem login','Clientes cadastrados que nunca acessaram a plataforma.'],
   ['Ofertantes','Clientes que ja deram pelo menos um lance, em qualquer loja da plataforma.'],
   ['Compradores por Estado','Estado da loja que comprou, considerando todo o periodo.'],
   ['Compradores','Clientes que ja concluiram pelo menos uma compra, em qualquer loja da plataforma.'],
   ['Negociacoes vendidas','Total de compras concluidas por clientes desta base.'],
   ['Volume total','Soma do valor pago em todas as compras concluidas.'],
   ['Ultima compra','Data da compra mais recente feita por um cliente desta base.'],
   ['1 ','Cadastro iniciado, ainda sem envio de documentacao completa.'],
   ['2 ','Cadastro enviado, aguardando analise da equipe.'],
   ['3 ','Cadastro aprovado e apto a dar lances e comprar.'],
   ['4 ','Cadastro analisado e recusado.'],
   ['5 ','Cadastro bloqueado, sem acesso a plataforma.'],
   ['6 ','Cliente com pendencia financeira em aberto.'],
   ['Visao Geral da Base','Numeros principais da base de lojistas do C6 Auto, considerando todo o historico.'],
   ['Funil de Conversao','Caminho do cliente: quantos se cadastraram, acessaram, deram lance e compraram. Cada etapa considera todo o historico, entao nao representa uma sequencia dentro de um mesmo periodo.'],
   ['Evolucao Mensal','Comportamento da base mes a mes nos ultimos 12 meses. O mes em curso esta incompleto.'],
   ['Destaques do Periodo','Resumo dos principais movimentos da base no periodo analisado.'],
   ['Raio-X Individual','Perfil detalhado de um comprador especifico, no periodo selecionado no filtro.'],
   ['Usuarios unicos por etapa','Quantos clientes diferentes acessaram, deram lance e compraram em cada mes.'],
   ['Novos cadastros na base','Quantidade de lojistas que entraram na base em cada mes.'],
   ['Cadastros por dia','Entrada de novos lojistas dia a dia nos ultimos 30 dias, com a linha de tendencia do periodo.'],
   ['Compras','Numero de compras concluidas pelo cliente no periodo filtrado.'],
   ['Ticket medio','Valor medio pago por compra no periodo.'],
   ['Exito','Percentual das disputas em que o cliente deu lance e levou o veiculo.'],
   ['Rec. FIPE','Quanto o cliente pagou em relacao a tabela FIPE dos veiculos comprados.'],
   ['Rec. Molicar','Quanto o cliente pagou em relacao a tabela Molicar dos veiculos comprados.'],
   ['Modelos distintos','Quantidade de modelos diferentes comprados no periodo.']
  ];
  function semAcento(s){ var de='aaaaeeiooouuc', mapa={'a':'áàâã','e':'éê','i':'í','o':'óôõ','u':'ú','c':'ç'}; var r=s.toLowerCase();
    for(var k in mapa){ for(var i=0;i<mapa[k].length;i++){ r=r.split(mapa[k].charAt(i)).join(k); } } return r; }
  function buscaTip(titulo){ var t=semAcento(norm(titulo));
    for(var i=0;i<TIPS.length;i++){ if(t.indexOf(semAcento(TIPS[i][0]))===0){ return TIPS[i][1]; } } return ''; }
  var SVG='<svg viewBox="0 0 16 16" width="12" height="12"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5"></circle><circle cx="8" cy="4.5" r="1.05" fill="currentColor"></circle><rect x="7.15" y="6.7" width="1.7" height="5.1" rx="0.85" fill="currentColor"></rect></svg>';
  function caixa(){ var c=document.getElementById('tipbox');
    if(!c){ c=document.createElement('div'); c.id='tipbox'; document.body.appendChild(c); } return c; }
  function mostra(s){ var c=caixa(); c.textContent=s.getAttribute('data-tip'); c.classList.add('on');
    var r=s.getBoundingClientRect(); var cw=c.offsetWidth, ch=c.offsetHeight;
    var esq=r.left + r.width/2 - cw/2;
    if(esq < 10){ esq=10; }
    if(esq + cw > window.innerWidth - 10){ esq=window.innerWidth - cw - 10; }
    var topo=r.bottom + 9;
    if(topo + ch > window.innerHeight - 10){ topo=r.top - ch - 9; }
    c.style.left=esq+'px'; c.style.top=topo+'px'; }
  function esconde(){ var c=document.getElementById('tipbox'); if(c){ c.classList.remove('on'); } }
  function addIcone(alvo, texto){ if(!alvo || !texto) return; if(alvo.querySelector('.info')) return;
    var s=document.createElement('span'); s.className='info'; s.setAttribute('data-tip', texto); s.innerHTML=SVG;
    s.addEventListener('mouseenter', function(){ mostra(s); });
    s.addEventListener('mouseleave', esconde);
    alvo.appendChild(s); }
  function textoDoBloco(bloco){ var p=[];
    var cs=bloco.querySelector('.cs'); var nota=bloco.querySelector('.sec-note');
    if(cs){ p.push(norm(cs.textContent)); cs.parentNode.removeChild(cs); }
    if(nota){ p.push(norm(nota.textContent)); nota.parentNode.removeChild(nota); }
    return p.join(' ').trim(); }
  window.__aplicaTips=function(){
    var cards=document.querySelectorAll('.chart-card');
    Array.prototype.forEach.call(cards, function(c){ var t=c.querySelector('.ct'); var txt=textoDoBloco(c); if(!txt){ txt=buscaTip(t?t.textContent:''); } addIcone(t, txt); });
    var secs=document.querySelectorAll('.sec');
    Array.prototype.forEach.call(secs, function(c){ var t=c.querySelector('.sec-title'); var txt=textoDoBloco(c); if(!txt){ txt=buscaTip(t?t.textContent:''); } addIcone(t, txt); });
    var kpis=document.querySelectorAll('.kpi');
    Array.prototype.forEach.call(kpis, function(c){ var t=c.querySelector('.kpi-label'); addIcone(t, buscaTip(t?t.textContent:'')); });
    var minis=document.querySelectorAll('.card.mini');
    Array.prototype.forEach.call(minis, function(c){ var t=c.querySelector('.l'); addIcone(t, buscaTip(t?t.textContent:'')); });
    var sobra=document.querySelectorAll('.sec-note, .cs');
    Array.prototype.forEach.call(sobra, function(n){ n.parentNode.removeChild(n); });
  };
  window.__aplicaTips();
  if(window.MutationObserver){ var mo=new MutationObserver(function(){ window.__aplicaTips(); });
    mo.observe(document.body, {childList:true, subtree:true}); }
})();
</script>
</body>
</html>
`;

let html = TPL.replace(/\{\{(\w+)\}\}/g, function(m, k){ return (k in M) ? String(M[k]) : m; });

const rxDataBlock = 'const RX_BUYERS='+JSON.stringify(RX_BUYERS)+';\nconst RX_TOTALS='+JSON.stringify(RX_TOTALS)+';\nconst RX_MODELO='+JSON.stringify(RX_MODELO)+';\nconst RX_LAUDO='+JSON.stringify(RX_LAUDO)+';\nconst RX_UF='+JSON.stringify(RX_UF)+';\nconst RX_FAIXA='+JSON.stringify(RX_FAIXA)+';\nconst RX_PARTIC='+JSON.stringify(RX_PARTIC)+';';
html = html.replace('/*__RX_DATA_MARKER__*/', rxDataBlock);

return { json: { html: html, totalBase: totalBase, volume: volume } };
