/* Provas do Painel de Eventos C6 — sem n8n e sem banco.

     node prova-local.js

   Roda os nós de verdade (não cópias) contra a coleta em dados-local.json
   (gerada por `python coleta_local.py`) e confere o que dá para conferir
   sem olhar tela. As contas que importam — pontuação, score, corte do
   período, funil — são REFEITAS aqui a partir do dado cru, por outro
   caminho, e comparadas com o que o nó publica. Falha com código 1 se
   qualquer prova cair. */

const fs = require('fs');
const path = require('path');
const { roda } = require('./_roda_no');
const injetor = require('./_aplica-modelo');

let ok = 0;
let falhas = 0;
const prova = (nome, cond, detalhe) => {
  if (cond) { ok++; return; }
  falhas++;
  console.error('✗ ' + nome + (detalhe !== undefined ? '  → ' + JSON.stringify(detalhe) : ''));
};
/* CRLF do checkout (core.autocrlf) não é diferença de conteúdo */
const ler = (a) => fs.readFileSync(path.join(__dirname, a), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));

/* ── 1. os arquivos que viajam pro n8n ─────────────────────────────── */
for (const a of ['montar-consultas.js', 'montar-painel.js', 'virar-arquivo.js']) {
  const f = ler(a);
  prova(a + ' sem barra invertida', f.indexOf(String.fromCharCode(92)) < 0);
  prova(a + ' sem crase nem cifrão-chave', f.indexOf(String.fromCharCode(96)) < 0 && f.indexOf('$' + '{') < 0);
}
const painelFonte = ler('montar-painel.js');
prova('bloco TEMA igual ao que o injetor produz hoje', painelFonte.indexOf(injetor.blocoTema) >= 0);
prova('bloco LOGOS igual ao que o injetor produz hoje', painelFonte.indexOf(injetor.blocoLogos) >= 0);

/* ── 2. as consultas ────────────────────────────────────────────────── */
const itens = roda('montar-consultas.js');
const PARTES = itens[0].json.meta.partes_acesso;
const PARTES_NOMES = [];
for (let p = 0; p < PARTES; p++) PARTES_NOMES.push('acessos_p' + p);
const NOMES = ['eventos', 'veiculos', 'ofertas', 'lojas', 'acessos_anuncio'].concat(PARTES_NOMES);
prova('as consultas, nesta ordem (' + NOMES.length + ')', JSON.stringify(itens.map((i) => i.json.queryName)) === JSON.stringify(NOMES),
  itens.map((i) => i.json.queryName));
prova('acesso ao canal em pelo menos duas partes', PARTES >= 2, PARTES);
itens.forEach((it) => {
  const q = it.json;
  const low = q.sql.toLowerCase();
  prova(q.queryName + ': uma linha só (COUNT + JSON_ARRAYAGG)',
    q.sql.indexOf('SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(') === 0);
  prova(q.queryName + ': sem função de janela', q.sql.toUpperCase().indexOf('OVER(') < 0 &&
    q.sql.toUpperCase().indexOf('OVER (') < 0);
  prova(q.queryName + ': sem NOW/CURDATE (o banco é UTC)', q.sql.indexOf('NOW(') < 0 && q.sql.indexOf('CURDATE') < 0);
  prova(q.queryName + ': recorte no whitelabel 43', q.sql.indexOf('ew.whitelabel_id = 43') > 0);
  prova(q.queryName + ': piso literal', q.sql.indexOf("'" + q.meta.piso + "'") > 0, q.meta.piso);
  prova(q.queryName + ': sem documento de pessoa',
    ['document', 'email', 'phone', 'renavam'].every((p) => low.indexOf(p) < 0));
  /* placa e chassi saíram em 28/09: nem na consulta */
  prova(q.queryName + ': sem placa nem chassi', low.indexOf('plate') < 0 && low.indexOf('chassi') < 0);
  prova(q.queryName + ': CNPJ só na consulta de lojas', (low.indexOf('cnpj') >= 0) === (q.queryName === 'lojas'));
});
const sqlDe = (n) => itens.find((i) => i.json.queryName === n).json.sql;
prova('acesso ao canal cortado no período do recorte (menor início → maior fim)',
  PARTES_NOMES.every((n) => sqlDe(n).indexOf('MIN(e.start_date_offer)') > 0 && sqlDe(n).indexOf('MAX(e.finish_date_event)') > 0));
prova('cada parte pega o seu resto do id da loja', PARTES_NOMES.every((n, p) =>
  sqlDe(n).indexOf('MOD(al.shop_id, ' + PARTES + ') = ' + p) > 0));
prova('acesso a anúncio cortado no horário do próprio evento, por igualdade no event_id',
  sqlDe('acessos_anuncio').indexOf('al.event_id = e.id') > 0 &&
  sqlDe('acessos_anuncio').indexOf('al.created_at >= e.start_date_offer AND al.created_at <= e.finish_date_event') > 0);
prova('acesso a anúncio: uma linha por (evento, anúncio, loja), com a máscara dos dias',
  sqlDe('acessos_anuncio').indexOf('GROUP BY e.id, al.advertisement_id, al.shop_id') > 0 &&
  sqlDe('acessos_anuncio').indexOf('BIT_OR(1 << DATEDIFF(al.created_at, e.start_date_offer))') > 0);

/* ── 3. o painel contra a coleta real ──────────────────────────────── */
const arq = path.join(__dirname, 'dados-local.json');
if (!fs.existsSync(arq)) {
  console.error('dados-local.json não existe — rode `python coleta_local.py` (precisa de VPN)');
  process.exit(1);
}
const d = JSON.parse(fs.readFileSync(arq, 'utf8'));
if (d.consultas.length !== NOMES.length) {
  console.error('dados-local.json é de antes das consultas de acesso — rode `python coleta_local.py` (VPN)');
  process.exit(1);
}
const arqPlan = path.join(__dirname, 'dados-planilha-local.json');
if (!fs.existsSync(arqPlan)) {
  console.error('dados-planilha-local.json não existe — rode `python _planilha_local.py`');
  process.exit(1);
}
const planilha = JSON.parse(fs.readFileSync(arqPlan, 'utf8'));
const nos = { 'Montar Consultas': d.consultas, 'MCP Consultas': d.mcp, 'Ler Representantes': planilha };
const out = roda('montar-painel.js', nos)[0].json;
const R = out.resumo;
const cru = {};
d.consultas.forEach((c, i) => {
  const row = d.mcp[i].json.structuredContent.rows[0];
  cru[c.json.queryName] = JSON.parse(row[1] || '[]').map((a) => {
    const o = {}; c.json.cols.forEach((k, j) => { o[k] = a[j]; }); return o;
  });
});
const dadosDe = (html) => {
  const s = html.slice(html.lastIndexOf('APP({') + 4);
  return JSON.parse(s.slice(0, s.lastIndexOf(',{"claro"')));
};
const scr = out.html.slice(out.html.indexOf('<script>') + 8);
/* a calcula() que está DENTRO do HTML publicado, e não uma cópia */
const calculaDaPagina = new Function(scr.slice(0, scr.indexOf('function APP(')) + 'return calcula;')();
const D0 = dadosDe(out.html);

prova('um veículo por negociação da coleta', R.veiculos === cru.veiculos.length, [R.veiculos, cru.veiculos.length]);
prova('todo lance entra na conta', R.kpi.lances === cru.ofertas.length, [R.kpi.lances, cru.ofertas.length]);
prova('com + sem oferta = publicados', R.kpi.com_oferta + R.kpi.sem_oferta === R.kpi.publicados);
const somaEv = (f) => R.por_evento.reduce((t, e) => t + e.kpi[f], 0);
['publicados', 'vendidos', 'lances', 'com_oferta', 'vmv_atingido'].forEach((f) =>
  prova('soma dos eventos = total: ' + f, somaEv(f) === R.kpi[f], [somaEv(f), R.kpi[f]]));
const vendCru = cru.veiculos.filter((v) => [2, 3, 7].indexOf(Number(v.status)) >= 0).length;
prova('vendidos = status 2, 3 e 7 na coleta', R.kpi.vendidos === vendCru, [R.kpi.vendidos, vendCru]);
const lojasCru = new Set(cru.ofertas.map((o) => o.loja).filter((x) => x !== null)).size;
prova('ofertantes = lojas distintas nas ofertas', R.kpi.ofertantes === lojasCru, [R.kpi.ofertantes, lojasCru]);
const ofPorId = {};
cru.ofertas.forEach((o) => { ofPorId[o.id] = o; });
const arrematantes = {};
cru.veiculos.forEach((v) => {
  if ([2, 3, 7].indexOf(Number(v.status)) < 0 || v.vencedora === null) return;
  const o = ofPorId[v.vencedora];
  if (o) arrematantes[o.loja] = (arrematantes[o.loja] || 0) + 1;
});
prova('compradores = lojas distintas das ofertas vencedoras', R.kpi.compradores === Object.keys(arrematantes).length,
  [R.kpi.compradores, Object.keys(arrematantes).length]);
const partCru = new Set(cru.ofertas.map((o) => o.loja + '|' + o.neg)).size;
prova('participações = pares (loja, negociação) distintos', R.kpi.participacoes === partCru, [R.kpi.participacoes, partCru]);
prova('lances/lojista e participações/lojista dividem pelos ofertantes',
  Math.abs(R.kpi.lances_por_lojista - cru.ofertas.length / lojasCru) < 1e-9 &&
  Math.abs(R.kpi.part_por_lojista - partCru / lojasCru) < 1e-9);

/* medição independente de 2026-09-24 (consulta m1, feita antes do nó
   existir): eventos encerrados não mudam mais, então o número tem que
   bater para sempre — enquanto o evento estiver na janela. */
const MEDIDO = { 23957: [48, 506, 50], 23852: [57, 262, 44], 23969: [25, 130, 32], 23938: [20, 200, 31] };
Object.keys(MEDIDO).forEach((id) => {
  const e = R.por_evento.find((x) => x.id === Number(id));
  if (!e) return;
  const m = MEDIDO[id];
  prova('evento ' + id + ' bate com a medição independente',
    e.kpi.publicados === m[0] && e.kpi.lances === m[1] && e.kpi.ofertantes === m[2],
    [e.kpi.publicados, e.kpi.lances, e.kpi.ofertantes, 'medido', m]);
});

/* ── 3b. o período e os dias com acesso, refeitos por outro caminho ──────
   O nó corta por hora permitida. Aqui: cada (dia, hora) vira um horário
   "AAAA-MM-DD HH:00" e conta se começa dentro de [hora cheia do início,
   fim). Mesma regra, outra conta. */
const acessosCru = [];
PARTES_NOMES.forEach((n) => cru[n].forEach((a) => acessosCru.push(a)));
const lojasPorParte = PARTES_NOMES.map((n) => new Set(cru[n].map((a) => a.loja)));
prova('nenhuma loja em duas partes do acesso', lojasPorParte.every((s, i) =>
  lojasPorParte.every((t, j) => i === j || [...s].every((l) => !t.has(l)))));
prova('toda loja na parte do seu resto', PARTES_NOMES.every((n, p) => cru[n].every((a) => Number(a.loja) % PARTES === p)));
const tsDe = (a) => {
  const c = String(a.dia);
  return '20' + c.slice(0, 2) + '-' + c.slice(2, 4) + '-' + c.slice(4, 6) + ' ' + (Number(a.hora) < 10 ? '0' : '') + Number(a.hora) + ':00';
};
const periodoDe = (evs) => [evs.map((e) => e.ini).sort()[0], evs.map((e) => e.fim).sort().pop()];
const horaCheia = (s) => s.slice(0, 13) + ':00';
const dentro = (a, per) => { const t = tsDe(a); return t >= horaCheia(per[0]) && t < per[1]; };
const diasNoPeriodo = (per, ok) => {
  const dias = {};
  acessosCru.forEach((a) => {
    if (!dentro(a, per) || (ok && !ok(a.loja))) return;
    (dias[a.loja] = dias[a.loja] || {})[a.dia] = 1;
  });
  const n = {};
  Object.keys(dias).forEach((k) => { n[k] = Object.keys(dias[k]).length; });
  return n;
};
const eventosCru = cru.eventos.map((e) => ({ id: Number(e.id), ini: e.ini, fim: e.fim }));
const perTodos = periodoDe(eventosCru);
const diasTodos = diasNoPeriodo(perTodos);
const lojaCru = {};
cru.lojas.forEach((l) => { lojaCru[l.id] = l; });
const novaCru = (per) => cru.lojas.filter((l) => Number(l.wl) === 43 && !Number(l.apagada) &&
  l.cadastro >= per[0] && l.cadastro <= per[1]);
const novasTodos = novaCru(perTodos);
const ehNovaT = {};
novasTodos.forEach((l) => { ehNovaT[l.id] = 1; });
prova('lojas novas = cadastro do WL 43 dentro do período', R.kpi.novas === novasTodos.length, [R.kpi.novas, novasTodos.length]);

/* pontuação: só loja nova, 10 por arremate + 1 por dia com acesso */
const pontosCru = (id) => (ehNovaT[id] ? (arrematantes[id] || 0) * 10 + (diasTodos[id] || 0) : 0);
const todosPag = calculaDaPagina(D0, 'todos', {});
const errados = todosPag.lojas.filter((r) => r.pontos !== pontosCru(r.loja));
prova('pontos de TODAS as lojas recalculados do cru', errados.length === 0, errados.slice(0, 3));
prova('loja antiga não pontua', todosPag.lojas.filter((r) => !r.nova).every((r) => r.pontos === 0) &&
  todosPag.lojas.some((r) => !r.nova && r.arrem > 0));
prova('acessos da loja = dias com acesso no período', todosPag.lojas.every((r) => r.acessos === (diasTodos[r.loja] || 0)));
const maior = Math.max.apply(null, novasTodos.map((l) => pontosCru(l.id)));
prova('a primeira do ranking tem a maior pontuação', R.top_lojas[0].pontos === maior, [R.top_lojas[0].pontos, maior]);
prova('ranking = quem ofertou ∪ lojas novas', todosPag.lojas.length === new Set(
  cru.ofertas.map((o) => String(o.loja)).concat(novasTodos.map((l) => String(l.id)))).size);

/* um evento: o período encolhe para o dele, e os acessos junto */
const evMaior = R.por_evento.slice().sort((a, b) => b.kpi.publicados - a.kpi.publicados)[0];
const evCru = eventosCru.find((e) => e.id === evMaior.id);
const diasEv = diasNoPeriodo([evCru.ini, evCru.fim]);
const ev1 = calculaDaPagina(D0, evCru.id, {});
prova('evento ' + evCru.id + ': dias com acesso cortados no horário do evento',
  ev1.lojas.every((r) => r.acessos === (diasEv[r.loja] || 0)) && ev1.kpi.lojas_acessaram === Object.keys(diasEv).length,
  [ev1.kpi.lojas_acessaram, Object.keys(diasEv).length]);
prova('evento ' + evCru.id + ': período = início → fim dele', ev1.periodo[0] === evCru.ini && ev1.periodo[1] === evCru.fim);

/* acesso fora do período NÃO conta: planta acessos antes do início e
   depois do fim, para a loja nova do topo, na parte certa dela */
const topo = R.top_lojas[0].loja;
const sab = JSON.parse(JSON.stringify(d));
const iAd = NOMES.indexOf('acessos_p' + (topo % PARTES));
const rowAd = sab.mcp[iAd].json.structuredContent.rows[0];
const linAd = JSON.parse(rowAd[1]);
linAd.push([topo, '200101', 12, 9], [topo, '991231', 12, 9]);
rowAd[0] = linAd.length;
rowAd[1] = JSON.stringify(linAd);
const outSab = roda('montar-painel.js', Object.assign({}, nos, { 'MCP Consultas': sab.mcp }))[0].json;
prova('acesso fora do período não muda pontos nem dias', outSab.resumo.top_lojas[0].pontos === R.top_lojas[0].pontos &&
  outSab.resumo.top_lojas[0].acessos === R.top_lojas[0].acessos && outSab.resumo.kpi.acessos === R.kpi.acessos);

/* acessos por hora, refeitos: total e novos, do primeiro ao último
   horário com acesso */
const porHoraCru = (per, soDia, ok) => {
  const t = [];
  const nv = [];
  for (let x = 0; x < 24; x++) { t.push(0); nv.push(0); }
  acessosCru.forEach((a) => {
    if (!dentro(a, per) || (soDia && a.dia !== soDia) || (ok && !ok(a.loja))) return;
    t[Number(a.hora)] += Number(a.n);
    if (ehNovaT[a.loja]) nv[Number(a.hora)] += Number(a.n);
  });
  return { t: t, nv: nv };
};
const hc = porHoraCru(perTodos);
const primeira = hc.t.findIndex((n) => n > 0);
const ultima = 23 - hc.t.slice().reverse().findIndex((n) => n > 0);
prova('por hora: do primeiro ao último horário com acesso', todosPag.por_hora.length === ultima - primeira + 1 &&
  todosPag.por_hora[0].h === primeira && todosPag.por_hora[todosPag.por_hora.length - 1].h === ultima,
  [todosPag.por_hora.length, primeira, ultima]);
prova('por hora: total e novos recalculados do cru', todosPag.por_hora.every((x) => x.total === hc.t[x.h] && x.novas === hc.nv[x.h]));
prova('por hora: novas ≤ total, toda hora, e algum novo acessou', todosPag.por_hora.every((x) => x.novas <= x.total) &&
  R.kpi.acessos_novas > 0);
const brutoHora = acessosCru.reduce((t, a) => t + Number(a.n), 0);
prova('soma por hora ≤ acessos brutos da coleta', R.kpi.acessos <= brutoHora && R.kpi.acessos > 0, [R.kpi.acessos, brutoHora]);
/* o clique num dia do gráfico por dia filtra só o gráfico por hora */
const umDia = todosPag.por_dia.filter((x) => x.total > 0).slice(-3)[0].dia;
const soDia = calculaDaPagina(D0, 'todos', { dia_hora: umDia });
const hcDia = porHoraCru(perTodos, umDia);
prova('clique no dia: por hora só daquele dia', soDia.por_hora.every((x) => x.total === hcDia.t[x.h] && x.novas === hcDia.nv[x.h]) &&
  soDia.kpi.acessos === hcDia.t.reduce((a, b) => a + b, 0));
prova('clique no dia: o resto do painel não muda', JSON.stringify(Object.assign({}, soDia.kpi, { acessos: 0, acessos_novas: 0 })) ===
  JSON.stringify(Object.assign({}, todosPag.kpi, { acessos: 0, acessos_novas: 0 })));
prova('anúncios acessados = veículos com alguma loja no anúncio', R.kpi.acessados === D0.veiculos.filter((v) => v.acessos > 0).length &&
  R.kpi.acessados > 0 && R.kpi.acessados <= R.kpi.publicados);
prova('acessos únicos por dia: novas ≤ total, todo dia', todosPag.por_dia.length > 0 &&
  todosPag.por_dia.every((x) => x.novas <= x.total));

/* ── 3c. o score do veículo, refeito ─────────────────────────────────── */
const lojasAnuncio = {};
cru.acessos_anuncio.forEach((a) => {
  const k = a.evento + '|' + a.anuncio;
  (lojasAnuncio[k] = lojasAnuncio[k] || new Set()).add(a.loja);
});
const lancesNeg = {};
const maiorNeg = {};
cru.ofertas.forEach((o) => {
  lancesNeg[o.neg] = (lancesNeg[o.neg] || 0) + 1;
  if (maiorNeg[o.neg] === undefined || Number(o.valor) > maiorNeg[o.neg]) maiorNeg[o.neg] = Number(o.valor);
});
const scoreCru = (v) => {
  const ac = lojasAnuncio[v.evento + '|' + v.anuncio] ? lojasAnuncio[v.evento + '|' + v.anuncio].size : 0;
  const vmv = v.vmv === null ? null : Number(v.vmv);
  const atingiu = maiorNeg[v.neg] !== undefined && vmv !== null && maiorNeg[v.neg] >= vmv;
  return ac * 1 + (lancesNeg[v.neg] || 0) * 5 + (atingiu ? 10 : 0);
};
const scorePorNeg = {};
D0.veiculos.forEach((v) => { scorePorNeg[v.neg] = v.score; });
const scoreErrado = cru.veiculos.filter((v) => scorePorNeg[v.neg] !== scoreCru(v));
prova('score de TODOS os veículos recalculado do cru', scoreErrado.length === 0, scoreErrado.slice(0, 3).map((v) => v.neg));
prova('algum veículo tem acesso, algum tem VMV atingido', D0.veiculos.some((v) => v.acessos > 0) &&
  D0.veiculos.some((v) => v.farol === 'atingiu'));
prova('% VMV = maior oferta ÷ VMV', D0.veiculos.every((v) => v.pvmv === null ||
  Math.abs(v.pvmv - v.maior / v.vmv) < 1e-12));
const semAcessoMasOferta = D0.veiculos.filter((v) => v.qtd > 0 && v.acessos === 0).length;
if (semAcessoMasOferta) {
  console.log('ℹ ' + semAcessoMasOferta + ' veículo(s) com oferta e sem acesso ao anúncio registrado no horário do evento');
}

/* ── 3d. funil e pátios ─────────────────────────────────────────────── */
const F = R.funil.map((f) => f[1]);
prova('funil tem as seis etapas pedidas', JSON.stringify(R.funil.map((f) => f[0])) ===
  JSON.stringify(['Cadastrados', 'Aprovados', 'Logaram', 'Acessaram', 'Ofertaram', 'Compraram']));
prova('aprovados = cadastros novos em situation 3', F[1] === novasTodos.filter((l) => Number(l.situacao) === 3).length);
prova('logaram = novos com dia de acesso no período', F[2] === novasTodos.filter((l) => diasTodos[l.id]).length);
prova('compraram ≤ ofertaram ≤ cadastrados, e toda etapa ≤ cadastrados',
  F[5] <= F[4] && F.every((x) => x <= F[0]), F);
prova('engajamento = logaram ÷ cadastrados', Math.abs(R.kpi.engajamento - F[2] / F[0]) < 1e-12);
prova('pátios somam os publicados', todosPag.patios.reduce((t, p) => t + p.veiculos, 0) === R.kpi.publicados);
prova('pátio agrupado por nome (sem repetido)', new Set(todosPag.patios.map((p) => p.patio)).size === todosPag.patios.length);
prova('% conversão e % VMV do pátio sobre os veículos do pátio',
  todosPag.patios.every((p) => Math.abs(p.conversao - p.oferta / p.veiculos) < 1e-12 &&
    Math.abs(p.pc_vmv - p.vmv / p.veiculos) < 1e-12));

/* ── 3e. os filtros (29/09), cada um refeito do cru ─────────────────────── */
const negDe = {};
D0.veiculos.forEach((v) => { negDe[v.neg] = v; });
/* pátio: recorta veículos, e as ofertas desses veículos */
const umPatio = todosPag.patios[0].patio;
const fp = calculaDaPagina(D0, 'todos', { patio: umPatio });
const negsP = D0.veiculos.filter((v) => v.patio === umPatio).map((v) => v.neg);
prova('Pátio: publicados = veículos do pátio', fp.kpi.publicados === negsP.length && fp.veiculos.every((v) => v.patio === umPatio));
prova('Pátio: lances = lances nesses veículos', fp.kpi.lances === cru.ofertas.filter((o) => negsP.indexOf(Number(o.neg)) >= 0).length);
prova('Pátio: a tabela de pátios só tem ele', fp.patios.length === 1 && fp.patios[0].patio === umPatio);
prova('Pátio: acesso ao canal não muda', fp.kpi.lojas_acessaram === todosPag.kpi.lojas_acessaram && fp.kpi.novas === todosPag.kpi.novas);
/* status do veículo: o farol intrínseco */
['sem', 'abaixo', 'atingiu'].forEach((fa) => {
  const r = calculaDaPagina(D0, 'todos', { farol: fa });
  prova('Status ' + fa + ': publicados = veículos com esse farol', r.kpi.publicados === D0.veiculos.filter((v) => v.farol === fa).length &&
    r.veiculos.every((v) => v.farol === fa));
});
prova('Status sem oferta: nenhum lance', calculaDaPagina(D0, 'todos', { farol: 'sem' }).kpi.lances === 0);
prova('Status VMV atingido: todos com VMV atingido', (() => {
  const r = calculaDaPagina(D0, 'todos', { farol: 'atingiu' });
  return r.kpi.vmv_atingido === r.kpi.publicados;
})());
/* representante: recorta lojas pela coluna ativa */
['gp', 'gn'].forEach((col) => {
  const cont = {};
  D0.lojas.forEach((l) => { if (l[col] !== 'Sem Representante') cont[l[col]] = (cont[l[col]] || 0) + 1; });
  const rep = Object.keys(cont).sort((a, b) => cont[b] - cont[a])[0];
  const r = calculaDaPagina(D0, 'todos', { col: col, rep: rep });
  const doRep = {};
  D0.lojas.forEach((l) => { if (l[col] === rep) doRep[l.id] = 1; });
  prova(col.toUpperCase() + ' ' + rep + ': ranking só com lojas dele', r.lojas.length > 0 && r.lojas.every((x) => x[col] === rep));
  prova(col.toUpperCase() + ' ' + rep + ': lances = lances das lojas dele', r.kpi.lances === cru.ofertas.filter((o) => doRep[o.loja]).length);
  prova(col.toUpperCase() + ' ' + rep + ': dias com acesso refeitos', r.lojas.every((x) =>
    x.acessos === (diasNoPeriodo(perTodos, (l) => doRep[l])[x.loja] || 0)));
  prova(col.toUpperCase() + ' ' + rep + ': a lista de veículos continua inteira', r.veiculos.length === todosPag.veiculos.length);
  prova(col.toUpperCase() + ' ' + rep + ': novos só dele', r.kpi.novas === novasTodos.filter((l) => doRep[l.id]).length);
});
/* data: encolhe o período para o dia */
const diaF = todosPag.por_dia.filter((x) => x.total > 0).slice(-4)[0].dia;
const dataF = '20' + diaF.slice(0, 2) + '-' + diaF.slice(2, 4) + '-' + diaF.slice(4, 6);
const fd = calculaDaPagina(D0, 'todos', { dia: diaF });
prova('Data ' + dataF + ': lances = lances daquele dia', fd.kpi.lances === cru.ofertas.filter((o) => o.quando.slice(0, 10) === dataF).length);
prova('Data ' + dataF + ': cada loja com no máximo 1 dia de acesso', fd.lojas.every((x) => x.acessos <= 1) &&
  fd.por_dia.length === 1 && fd.por_dia[0].dia === diaF);
const perDia = [dataF + ' 00:00' > perTodos[0] ? dataF + ' 00:00' : perTodos[0], dataF + ' 23:59' < perTodos[1] ? dataF + ' 23:59' : perTodos[1]];
prova('Data ' + dataF + ': novos = cadastrados naquele dia', fd.kpi.novas === novaCru(perDia).length, [fd.kpi.novas, novaCru(perDia).length]);
prova('Data ' + dataF + ': vendas pela data da oferta vencedora', fd.kpi.vendidos === cru.veiculos.filter((v) =>
  [2, 3, 7].indexOf(Number(v.status)) >= 0 && ofPorId[v.vencedora] && ofPorId[v.vencedora].quando.slice(0, 10) === dataF).length);
prova('Data ' + dataF + ': a lista de veículos continua inteira', fd.veiculos.length === todosPag.veiculos.length);
/* filtros juntos: pátio + status = interseção */
const fj = calculaDaPagina(D0, 'todos', { patio: umPatio, farol: 'abaixo' });
prova('Pátio + Status: interseção', fj.kpi.publicados === D0.veiculos.filter((v) => v.patio === umPatio && v.farol === 'abaixo').length);
prova('sem filtro = filtro vazio', JSON.stringify(calculaDaPagina(D0, 'todos', { rep: '', dia: '', patio: '', farol: '' }).kpi) ===
  JSON.stringify(todosPag.kpi));

/* ── 4. o HTML ──────────────────────────────────────────────────────── */
const h = out.html;
const semScript = h.split('<script>')[0];
prova('HTML sem requisição de rede', semScript.indexOf('src="http') < 0 && h.indexOf('<link') < 0 &&
  h.indexOf('@import') < 0 && h.indexOf('url(http') < 0);
prova('logo em data URI', h.indexOf('data:image/svg+xml;base64,') > 0);
prova('tema C6 depois do tema base', h.indexOf('#DCDCDC') > h.indexOf('#D8E1E9') && h.indexOf('#D8E1E9') > 0);
prova('nenhum azul da Cars2You sobrando nos tokens do C6',
  h.slice(h.indexOf('#DCDCDC')).indexOf('#487DEA') < 0 && h.slice(h.indexOf('#DCDCDC')).indexOf('#1523A0') < 0);
const escuroC6 = h.slice(h.lastIndexOf('[data-tema="escuro"]{'));
prova('escuro do C6 com acento amarelo #FFC000', escuroC6.indexOf('--acento:         #FFC000') >= 0 &&
  escuroC6.indexOf('--acento-cheio:   #FFC000') >= 0);
prova('--serie-2 nos dois blocos da camada', (h.slice(h.indexOf('#DCDCDC')).match(/--serie-2:/g) || []).length === 2);
prova('sem placa, chassi, laudo ou deságio no dado', ['"placa"', '"chassi"', '"laudo"', '"desagio"'].every((p) => h.indexOf(p) < 0));
prova('sem CNPJ, e-mail ou telefone no dado', ['"cnpj"', '"email"', 'whatsapp', 'comercial_number'].every((p) => h.indexOf(p) < 0));
prova('nenhum "</script" dentro do dado', h.split('</script>').length === 2);
prova('tabelas de lojas e de eventos saíram', ['tab-lojas', 'tab-novas', 'tab-eventos'].every((t) => h.indexOf(t) < 0));
prova('ranking de representantes antes do de lojas', semScript.indexOf('id="th-reps"') > 0 && semScript.indexOf('id="th-reps"') < semScript.indexOf('id="th-lojas"'));
prova('farol abaixo do VMV em amarelo, nos dois temas', h.indexOf('.farol.abaixo{background:var(--farol-abaixo)}') > 0 &&
  (h.slice(h.indexOf('#DCDCDC')).match(/--farol-abaixo:/g) || []).length === 2);
prova('sem degradê amarelo no escuro', h.indexOf('rgba(255,192,0,.07)') < 0);
prova('pátios fora da grade de duas colunas (linha inteira)', (() => {
  const i = semScript.indexOf('id="th-patios"');
  const g = semScript.lastIndexOf('<section class="g2i">', i);
  return i > 0 && semScript.lastIndexOf('</section>', i) > g;
})());
prova('gaveta de filtros com Representante, Data, Pátio e Status', ['id="gaveta"', 'id="f-rep"', 'id="f-dia"', 'id="f-patio"', 'id="f-farol"', 'id="limpar"']
  .every((t) => semScript.indexOf(t) > 0));
prova('gráfico por dia se chama Acessos únicos por dia', semScript.indexOf('Acessos únicos por dia') > 0 && semScript.indexOf('Lojas únicas que acessaram') < 0);
prova('rankings: representantes só com loja nova, lojas só com acesso', scr.indexOf('.filter((g) => g.novas > 0)') > 0 &&
  scr.indexOf('R.lojas.filter((r) => r.acessos > 0') > 0);
prova('funil: mínimo de 3 dígitos somado em todas as etapas + parte proporcional',
  scr.indexOf('const MIN_F = 3 * 7.4 + 16;') > 0 && scr.indexOf('MIN_F + (FW - MIN_F) * (v0 ? f[1] / v0 : 0)') > 0);
prova('funil à esquerda das lojas por dia; por hora abaixo', semScript.indexOf('id="funil"') < semScript.indexOf('id="g-dia"') &&
  semScript.indexOf('id="g-dia"') < semScript.indexOf('id="g-hora"'));
prova('botões Todos lojistas/Somente novos e Usuário GN/GP', ['Todos lojistas', 'Somente novos', 'Usuário GN', 'Usuário GP']
  .every((t) => semScript.indexOf(t) > 0));
/* ordem pedida em 29/09: dentro da gaveta, evento, lojistas, coluna GN/GP,
   e só então representante, data, pátio e status; nada disso no topo */
const gav = semScript.slice(semScript.indexOf('id="gaveta"'), semScript.indexOf('</aside>'));
const posG = ['id="f-evento"', 'id="seg-lojas"', 'id="seg-reps"', 'id="f-rep"', 'id="f-dia"', 'id="f-patio"', 'id="f-farol"'].map((t) => gav.indexOf(t));
prova('gaveta na ordem: Evento, Lojistas, GN/GP, Representante, Data, Pátio, Status', posG.every((p, i) => p > 0 && (i === 0 || p > posG[i - 1])), posG);
prova('topo e rankings sem seletor de evento nem botões', semScript.slice(0, semScript.indexOf('id="gaveta"')).indexOf('f-evento') < 0 &&
  semScript.slice(semScript.indexOf('</aside>')).indexOf('class="seg"') < 0);
prova('veículos abrem pelo score crescente', scr.indexOf("veic: { k: 'score', dir: 1 }") > 0);
prova('rankings abrem pela pontuação decrescente', scr.indexOf("lojas: { k: 'pontos', dir: -1 }, reps: { k: 'pontos', dir: -1 }") > 0);
prova('glossário é o último bloco antes do rodapé', h.indexOf('id="gloss"') > h.indexOf('id="tb-veic"') &&
  h.indexOf('class="rodape"') > h.indexOf('id="gloss"'));
prova('glossário nasce fechado', h.indexOf('<details class="cartao gloss" id="gloss">') > 0);
prova('tamanho razoável', R.bytes_html > 60000 && R.bytes_html < 3000000, R.bytes_html);

/* ── 4b. a versão enxuta que vai para o n8n faz o mesmo HTML ─────────── */
const { enxuga } = require('./_enxuga');
const enxuto = enxuga(painelFonte);
prova('n8n/montar-painel.js está em dia com a fonte',
  fs.existsSync(path.join(__dirname, 'n8n', 'montar-painel.js')) && ler('n8n/montar-painel.js') === enxuto);
prova('n8n/montar-consultas.js está em dia com a fonte',
  fs.existsSync(path.join(__dirname, 'n8n', 'montar-consultas.js')) && ler('n8n/montar-consultas.js') === enxuga(ler('montar-consultas.js')));
const outEnx = roda('n8n/montar-painel.js', nos)[0].json;
/* o HTML inteiro NÃO é igual, e é o certo: o toString() das funções leva os
   comentários junto, e o enxuto não tem. O que tem que ser igual é o que
   sai do cálculo, a marcação fora do script e o dado embutido. */
const semBytes = (r) => JSON.stringify(Object.assign({}, r, { bytes_html: 0 }));
prova('nó enxuto calcula o mesmo resumo', semBytes(outEnx.resumo) === semBytes(R));
prova('nó enxuto: mesma marcação fora do script', outEnx.html.split('<script>')[0] === h.split('<script>')[0]);
const dadoDe = (s) => s.slice(s.lastIndexOf('APP({'));
prova('nó enxuto: mesmo dado embutido', dadoDe(outEnx.html) === dadoDe(h) && dadoDe(h).length > 1000);
prova('nó enxuto sem comentário de bloco fora de string', enxuga(enxuto) === enxuto);

/* ── 5. o Virar Arquivo ─────────────────────────────────────────────── */
const va = roda('virar-arquivo.js', {}, [{ json: out }])[0];
const volta = Buffer.from(va.binary.data.data, 'base64').toString('utf8');
prova('arquivo começa com BOM', volta.charCodeAt(0) === 0xFEFF);
prova('arquivo = HTML byte a byte', volta.slice(1) === h);
prova('caminho no SharePoint', va.json.caminho === 'Painel%20de%20Eventos%20C6/painel-eventos-c6.html', va.json.caminho);
let barrou = false;
try { roda('virar-arquivo.js', {}, [{ json: { html: '<html></html>' } }]); } catch (e) { barrou = true; }
prova('Virar Arquivo recusa HTML raquítico', barrou);

/* ── 6. o pacote incompleto derruba o run — em qualquer das sete ─────── */
[2, NOMES.indexOf('acessos_p0'), NOMES.indexOf('acessos_anuncio')].forEach((i) => {
  const sabotado = JSON.parse(JSON.stringify(d.mcp));
  const linha = sabotado[i].json.structuredContent.rows[0];
  const arr = JSON.parse(linha[1]);
  arr.pop();
  linha[1] = JSON.stringify(arr);
  let caiu = '';
  try { roda('montar-painel.js', Object.assign({}, nos, { 'MCP Consultas': sabotado })); } catch (e) { caiu = e.message; }
  prova('pacote de ' + NOMES[i] + ' com uma linha a menos derruba o run', caiu.indexOf('Pacote incompleto em ' + NOMES[i]) === 0, caiu);
});

/* ── 7. o representante comercial ───────────────────────────────────────
   Cada caso da regra, com CNPJs TIRADOS da planilha real e plantados em
   lojas da coleta: a contagem aqui é independente da do nó. */
const soDig = (v) => String(v || '').split('').filter((c) => c >= '0' && c <= '9').join('');
const votosDe = (col) => {
  const vt = {};
  planilha.forEach((it) => {
    const c = soDig(it.json.NR_CNPJ).padStart(14, '0');
    vt[c] = vt[c] || {};
    const r = String(it.json[col] || '').trim();
    if (r) vt[c][r] = (vt[c][r] || 0) + 1;
  });
  return vt;
};
const votosP = votosDe('USUARIO_GP');
const votosN = votosDe('USUARIO_GN');
const casoDe = (vt, c) => {
  const v = vt[c];
  if (!v) return 'fora';
  const reps = Object.keys(v).sort((a, b) => v[b] - v[a]);
  if (!reps.length) return 'vazio';
  if (reps.length === 1) return 'unico';
  return v[reps[0]] === v[reps[1]] ? 'empate' : 'maioria';
};
const esperadoDe = (vt, c) => {
  const caso = casoDe(vt, c);
  if (caso === 'unico' || caso === 'maioria') {
    const v = vt[c];
    return Object.keys(v).sort((a, b) => v[b] - v[a] || (a < b ? -1 : 1))[0];
  }
  return 'Sem Representante';
};

/* na coleta real, GP e GN de cada loja batem com a conta independente */
const cnpjCru = {};
cru.lojas.forEach((l) => { cnpjCru[l.id] = soDig(l.cnpj).padStart(14, '0'); });
const repErrado = (col, vt) => D0.lojas.filter((l) => l[col] !== esperadoDe(vt, cnpjCru[l.id]));
prova('USUARIO_GP de toda loja da coleta bate com a planilha', repErrado('gp', votosP).length === 0, repErrado('gp', votosP).slice(0, 2));
prova('USUARIO_GN de toda loja da coleta bate com a planilha', repErrado('gn', votosN).length === 0, repErrado('gn', votosN).slice(0, 2));
prova('GN e GP são colunas diferentes de fato', D0.lojas.some((l) => l.gp !== l.gn));

const achaCnpj = (caso) => Object.keys(votosP).find((c) => casoDe(votosP, c) === caso);
const CASOS = {
  unico: achaCnpj('unico'), maioria: achaCnpj('maioria'), empate: achaCnpj('empate'),
  vazio: achaCnpj('vazio'), fora: '00000000000191', sem_cnpj: null
};
prova('a planilha real tem os quatro casos', ['unico', 'maioria', 'empate', 'vazio'].every((k) => CASOS[k]), CASOS);

/* a coleta com o CNPJ plantado: 6 lojas com os casos, o resto fora */
const sint = JSON.parse(JSON.stringify(d));
const iLojas = NOMES.indexOf('lojas');
const cLojas = sint.consultas[iLojas].json;
const rowL = sint.mcp[iLojas].json.structuredContent.rows[0];
const linhasL = JSON.parse(rowL[1]);
const ordemCasos = Object.keys(CASOS);
const plantado = {};
const iCnpj = cLojas.cols.indexOf('cnpj');
const iId = cLojas.cols.indexOf('id');
const novasL = linhasL.map((a, i) => {
  const caso = i < ordemCasos.length ? ordemCasos[i] : 'fora';
  plantado[a[iId]] = caso;
  const b = a.slice();
  b[iCnpj] = caso === 'fora' ? '00000000000191' : CASOS[caso];
  return b;
});
rowL[1] = JSON.stringify(novasL);
const outS = roda('montar-painel.js', Object.assign({}, nos, { 'Montar Consultas': sint.consultas, 'MCP Consultas': sint.mcp }))[0].json;
const D = dadosDe(outS.html);
const repDe = {};
D.lojas.forEach((l) => { repDe[l.id] = l.gp; });
Object.keys(plantado).slice(0, ordemCasos.length).forEach((id) => {
  const caso = plantado[id];
  const esp = CASOS[caso] ? esperadoDe(votosP, CASOS[caso]) : 'Sem Representante';
  prova('representante no caso ' + caso, repDe[id] === esp, [repDe[id], esp]);
});
const RR = outS.resumo.representantes.gp;
prova('resumo conta cada caminho do cruzamento',
  RR.unico === 1 && RR.maioria === 1 && RR.empate === 1 && RR.vazio_planilha === 1 && RR.sem_cnpj === 1 &&
  RR.fora_planilha === linhasL.length - 5, RR);
prova('linhas da planilha contadas', outS.resumo.representantes.linhas_planilha === planilha.length);
prova('empate, maioria e loja sem CNPJ viram aviso', ['mais de um USUARIO_GP', 'empate de USUARIO_GP', 'sem CNPJ no banco']
  .every((t) => outS.resumo.avisos.some((a) => a.indexOf(t) >= 0)), outS.resumo.avisos);
prova('CNPJ não vaza para o HTML', ['unico', 'maioria', 'empate', 'vazio'].every((k) => outS.html.indexOf(CASOS[k]) < 0) &&
  D.lojas.every((l) => l.cnpj === undefined));
['gp', 'gn'].forEach((q) => {
  const reps = calculaDaPagina(D, 'todos').representantes[q];
  prova(q.toUpperCase() + ': ranking de representantes termina em Sem Representante',
    reps.length > 1 && reps[reps.length - 1].representante === 'Sem Representante' &&
    reps.slice(0, -1).every((g) => g.representante !== 'Sem Representante'), reps.map((g) => g.representante));
  prova(q.toUpperCase() + ': pontos e lojas dos representantes somam os das lojas',
    reps.reduce((t, g) => t + g.pontos, 0) === calculaDaPagina(D, 'todos').lojas.reduce((t, l) => t + l.pontos, 0) &&
    reps.reduce((t, g) => t + g.lojas, 0) === calculaDaPagina(D, 'todos').lojas.length);
});

/* a planilha que não serve derruba o run, nas quatro formas */
const caiCom = (plan) => {
  try { roda('montar-painel.js', Object.assign({}, nos, { 'Ler Representantes': plan })); return ''; } catch (e) { return e.message; }
};
prova('planilha que não veio derruba o run', caiCom([{ json: { error: { message: '404' } } }]).indexOf('nao veio') > 0);
prova('planilha sem USUARIO_GP derruba o run', caiCom(planilha.map((it) =>
  ({ json: { NR_CNPJ: it.json.NR_CNPJ, USUARIO_GN: it.json.USUARIO_GN } }))).indexOf('sem as colunas') > 0);
prova('planilha sem USUARIO_GN derruba o run', caiCom(planilha.map((it) =>
  ({ json: { NR_CNPJ: it.json.NR_CNPJ, USUARIO_GP: it.json.USUARIO_GP } }))).indexOf('sem as colunas') > 0);
prova('planilha truncada derruba o run', caiCom(planilha.slice(0, 50)).indexOf('abaixo do piso') > 0);

console.log((falhas ? '✗' : '✓') + ' %d provas, %d falha(s)', ok + falhas, falhas);
if (falhas) process.exit(1);
