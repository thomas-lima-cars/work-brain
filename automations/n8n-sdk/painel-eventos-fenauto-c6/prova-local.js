/* Provas do Eventos Fenauto C6 — sem n8n e sem banco.

     node prova-local.js

   Portadas em 26/10 das provas do Painel de Eventos C6 (prova-local.js de
   painel-eventos-c6). Saiu a seção do representante comercial e tudo de GP e
   GN; entraram as provas de que nada de representante sobrou e de que a logo
   da Fenauto está no centro do topo, com o C6 sozinho à esquerda.

   Roda os nós de verdade (não cópias) contra a coleta de prova
   (`python coleta_local.py --prova`, VPN) e confere o que dá para conferir
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
  /* sem representante, sem CNPJ (26/10): no C6 ele era a chave da carteira */
  prova(q.queryName + ': sem CNPJ', low.indexOf('cnpj') < 0);
});
const sqlDe = (n) => itens.find((i) => i.json.queryName === n).json.sql;
prova('acesso ao evento (08/10): por igualdade no event_id, cortado no horário do próprio evento, no minuto',
  PARTES_NOMES.concat(['lojas']).every((n) => sqlDe(n).indexOf('INNER JOIN access_logs al ON al.event_id = e.id') > 0 &&
    sqlDe(n).indexOf('al.created_at >= e.start_date_offer AND al.created_at <= e.finish_date_event') > 0));
prova('acesso ao evento: não é mais o canal inteiro (sem MIN/MAX do recorte nas partes)',
  PARTES_NOMES.every((n) => sqlDe(n).indexOf('MIN(e.start_date_offer)') < 0 && sqlDe(n).indexOf('MAX(e.finish_date_event)') < 0));
prova('cada parte pega o seu resto do id da loja', PARTES_NOMES.every((n, p) =>
  sqlDe(n).indexOf('MOD(al.shop_id, ' + PARTES + ') = ' + p) > 0));
prova('acesso a anúncio cortado no horário do próprio evento, por igualdade no event_id',
  sqlDe('acessos_anuncio').indexOf('al.event_id = e.id') > 0 &&
  sqlDe('acessos_anuncio').indexOf('al.created_at >= e.start_date_offer AND al.created_at <= e.finish_date_event') > 0);
prova('acesso a anúncio: uma linha por (evento, anúncio, loja), com a máscara dos dias',
  sqlDe('acessos_anuncio').indexOf('GROUP BY e.id, al.advertisement_id, al.shop_id') > 0 &&
  sqlDe('acessos_anuncio').indexOf('BIT_OR(1 << DATEDIFF(al.created_at, e.start_date_offer))') > 0);

/* ── 3. o painel contra a coleta real ────────────────────────────────
   A coleta DE PROVA (dados-prova.json, 02/10): o mesmo SQL com o recorte e
   a loja nova desde 01/09. O recorte de outubro abriu quase vazio (3
   ofertas, 0 loja nova), e conta refeita sobre zero não prova nada. */
/* a coleta própria, se houver; senão a do painel do C6 (mesmo recorte, WL 43,
   e o mesmo SQL menos o CNPJ da consulta de lojas — o Montar Painel lê as
   colunas pelo nome e ignora a que sobra) */
const arqProprio = path.join(__dirname, 'dados-prova.json');
const arqC6 = path.join(__dirname, '..', 'painel-eventos-c6', 'dados-prova.json');
const arq = fs.existsSync(arqProprio) ? arqProprio : arqC6;
if (!fs.existsSync(arq)) {
  console.error('dados-prova.json não existe — rode `python coleta_local.py --prova` (precisa de VPN)');
  process.exit(1);
}
if (arq === arqC6) console.log('ℹ coleta de prova do painel do C6 (' + path.relative(__dirname, arq) + ')');
const d = JSON.parse(fs.readFileSync(arq, 'utf8'));
if (d.consultas.length !== NOMES.length) {
  console.error('dados-local.json é de antes das consultas de acesso — rode `python coleta_local.py` (VPN)');
  process.exit(1);
}
/* só os dois nós: sem Ler Representantes e sem Ler Nomes. O $() de mentira
   derruba quem pedir um nó que não está aqui */
const nos = { 'Montar Consultas': d.consultas, 'MCP Consultas': d.mcp };
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
/* loja nova (Thomas, 26/10): no grupo de cliente das novas, cadastrada a
   partir da data das novas E num dos DIAS do evento, o dia inteiro. Aqui a
   conta é por data (AAAA-MM-DD) do cadastro entre o dia do início e o dia
   do fim — no nó é o mesmo corte, escrito de outro jeito */
const REGRA_NOVAS = d.consultas[0].json.meta.novas;
const novaCru = (diaIni, diaFim) => cru.lojas.filter((l) => Number(l.grupo) === 1 && !Number(l.apagada) &&
  l.cadastro >= REGRA_NOVAS.desde && l.cadastro.slice(0, 10) >= diaIni && l.cadastro.slice(0, 10) <= diaFim);
const novasTodos = novaCru(perTodos[0].slice(0, 10), perTodos[1].slice(0, 10));
const ehNovaT = {};
novasTodos.forEach((l) => { ehNovaT[l.id] = 1; });
prova('lojas novas = grupo ' + REGRA_NOVAS.grupo + ', cadastro desde ' + REGRA_NOVAS.desde + ' e num dia do evento',
  R.kpi.novas === novasTodos.length, [R.kpi.novas, novasTodos.length]);
prova('regra de loja nova no nó: grupo 146, desde 01/10/2026', itens[0].json.meta.novas.grupo === 146 &&
  itens[0].json.meta.novas.desde === '2026-10-01 00:00' && sqlDe('lojas').indexOf('ucg.client_group_id = 146') > 0);
prova('recorte de outubro no nó: eventos que encerram a partir de 01/10/2026', itens[0].json.meta.piso === '2026-10-01 00:00:00' &&
  sqlDe('eventos').indexOf("e.finish_date_event >= '2026-10-01 00:00:00'") > 0);
prova('coleta: todo evento encerra a partir do piso dela', cru.eventos.every((e) => e.fim >= d.consultas[0].json.meta.piso.slice(0, 16)));
prova('coleta: há loja nova (no grupo e depois da data) e loja do grupo antiga, que não é nova',
  novasTodos.length > 0 && cru.lojas.some((l) => Number(l.grupo) === 1 && l.cadastro < REGRA_NOVAS.desde) &&
  cru.lojas.some((l) => Number(l.grupo) !== 1 && l.cadastro >= REGRA_NOVAS.desde && Number(l.wl) === 43), novasTodos.length);

/* os dias do evento valem INTEIROS: planta duas lojas do grupo, uma às 23:59
   do último dia (depois de o evento fechar, que é de tarde) e outra às 00:01
   do dia seguinte. A primeira é nova, a segunda não. Pela ponta do FIM: na
   coleta de prova o primeiro dia (31/08) é anterior à data das novas, que
   barraria a véspera sozinha e a prova não provaria a regra dos dias */
(() => {
  const sint = JSON.parse(JSON.stringify(d));
  const iL = NOMES.indexOf('lojas');
  const cols = sint.consultas[iL].json.cols;
  const row = sint.mcp[iL].json.structuredContent.rows[0];
  const linhas = JSON.parse(row[1]);
  const fora = linhas.filter((a) => Number(a[cols.indexOf('grupo')]) !== 1 && !Number(a[cols.indexOf('apagada')])).slice(0, 2);
  const ultimo = perTodos[1].slice(0, 10);
  const seguinte = new Date(Date.UTC(Number(ultimo.slice(0, 4)), Number(ultimo.slice(5, 7)) - 1, Number(ultimo.slice(8, 10)) + 1)).toISOString().slice(0, 10);
  fora[0][cols.indexOf('grupo')] = 1; fora[0][cols.indexOf('cadastro')] = ultimo + ' 23:59';
  fora[1][cols.indexOf('grupo')] = 1; fora[1][cols.indexOf('cadastro')] = seguinte + ' 00:01';
  row[1] = JSON.stringify(linhas);
  const o = roda('montar-painel.js', Object.assign({}, nos, { 'MCP Consultas': sint.mcp }))[0].json;
  const Ds = dadosDe(o.html);
  const r = calculaDaPagina(Ds, 'todos', {});
  const id0 = Number(fora[0][cols.indexOf('id')]);
  const id1 = Number(fora[1][cols.indexOf('id')]);
  prova('cadastro às 23:59 do último dia do evento é novo; às 00:01 do dia seguinte, não',
    perTodos[1].slice(11, 16) < '23:59' && ultimo >= REGRA_NOVAS.desde.slice(0, 10) &&
    r.nova[id0] === 1 && !r.nova[id1] && o.resumo.kpi.novas === R.kpi.novas + 1,
    [perTodos[1], !!r.nova[id0], !!r.nova[id1], o.resumo.kpi.novas, R.kpi.novas]);
})();

/* sem pontuação (Thomas, 26/10): recuperações, ofertas e acessos ordenam */
const todosPag = calculaDaPagina(D0, 'todos', {});
prova('ranking sem pontos', todosPag.lojas.length > 0 && todosPag.lojas.every((r) => r.pontos === undefined) && D0.pontos === undefined);
prova('ranking em ordem de recuperações, ofertas e acessos', todosPag.lojas.every((r, i, a) => i === 0 ||
  a[i - 1].arrem > r.arrem || (a[i - 1].arrem === r.arrem && (a[i - 1].lances > r.lances ||
    (a[i - 1].lances === r.lances && a[i - 1].acessos >= r.acessos)))));
prova('acessos da loja = dias com acesso no período', todosPag.lojas.every((r) => r.acessos === (diasTodos[r.loja] || 0)));
const maiorArrem = Math.max.apply(null, Object.keys(arrematantes).map((k) => arrematantes[k]).concat([0]));
prova('a primeira do ranking tem o maior número de recuperações', R.top_lojas[0].arrem === maiorArrem, [R.top_lojas[0].arrem, maiorArrem]);
prova('ranking = quem ofertou ∪ lojas novas ∪ quem acessou o canal na janela', todosPag.lojas.length === new Set(
  cru.ofertas.map((o) => String(o.loja)).concat(novasTodos.map((l) => String(l.id)), Object.keys(diasTodos).filter((k) => diasTodos[k] > 0))).size);
prova('toda loja nova está no ranking, com ou sem acesso', novasTodos.every((l) => todosPag.lojas.some((r) => r.loja === l.id && r.nova)) &&
  todosPag.lojas.filter((r) => r.nova).length === novasTodos.length);

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
prova('acesso fora do período não muda os dias', outSab.resumo.top_lojas[0].acessos === R.top_lojas[0].acessos &&
  outSab.resumo.kpi.acessos === R.kpi.acessos);

/* acessos por hora, refeitos: total e novos, do primeiro ao último
   horário com acesso */
/* por hora = a medida do gráfico por dia, por hora (Thomas, 02/10): lojas do
   ranking com acesso naquela hora, uma vez por hora em cada dia */
const porHoraCru = (per, soDia, ok) => {
  const t = [];
  const nv = [];
  for (let x = 0; x < 24; x++) { t.push(0); nv.push(0); }
  const naLista = new Set(todosPag.lojas.map((r) => String(r.loja)));
  const visto = new Set();
  acessosCru.forEach((a) => {
    if (!dentro(a, per) || (soDia && a.dia !== soDia) || (ok && !ok(a.loja)) || !naLista.has(String(a.loja))) return;
    const k = a.loja + '|' + a.dia + '|' + a.hora;
    if (visto.has(k)) return;
    visto.add(k);
    t[Number(a.hora)]++;
    if (ehNovaT[a.loja]) nv[Number(a.hora)]++;
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
/* a soma por hora é a de lojas × hora; nunca menor que a soma por dia (uma
   loja num dia tem ao menos uma hora) */
prova('por hora: a soma das horas ≥ a soma dos dias, mesma medida', R.kpi.acessos >= todosPag.por_dia.reduce((t, x) => t + x.total, 0) &&
  R.kpi.acessos_novas >= todosPag.por_dia.reduce((t, x) => t + x.novas, 0));
prova('gráfico se chama Acessos por hora', out.html.indexOf('<h2>Acessos por hora</h2>') > 0 && out.html.indexOf('Acessos por hora do dia') < 0);
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
/* o mesmo indicador da coluna Acessos do ranking (Thomas, 02/10) */
prova('acessos únicos por dia somam a coluna Acessos do ranking de lojas',
  todosPag.por_dia.reduce((t, x) => t + x.total, 0) === todosPag.lojas.reduce((t, r) => t + r.acessos, 0) &&
  todosPag.por_dia.reduce((t, x) => t + x.novas, 0) === todosPag.lojas.filter((r) => r.nova).reduce((t, r) => t + r.acessos, 0) &&
  todosPag.por_dia.some((x) => x.total > 0),
  [todosPag.por_dia.reduce((t, x) => t + x.total, 0), todosPag.lojas.reduce((t, r) => t + r.acessos, 0)]);
(() => {
  const naLista = new Set(todosPag.lojas.map((r) => String(r.loja)));
  const porDiaCru = {};
  acessosCru.forEach((a) => {
    if (!dentro(a, perTodos) || !naLista.has(String(a.loja))) return;
    (porDiaCru[a.dia] = porDiaCru[a.dia] || new Set()).add(String(a.loja));
  });
  prova('acessos únicos por dia = lojas do ranking que acessaram no dia, refeito do cru', todosPag.por_dia.every((x) =>
    x.total === (porDiaCru[x.dia] ? porDiaCru[x.dia].size : 0)));
})();

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
const brutoCru = (v) => {
  const ac = lojasAnuncio[v.evento + '|' + v.anuncio] ? lojasAnuncio[v.evento + '|' + v.anuncio].size : 0;
  const vmv = v.vmv === null ? null : Number(v.vmv);
  const atingiu = maiorNeg[v.neg] !== undefined && vmv !== null && maiorNeg[v.neg] >= vmv;
  return ac * 1 + (lancesNeg[v.neg] || 0) * 5 + (atingiu ? 100 : 0);
};
/* 0 a 100 sobre o maior bruto da coleta (Thomas, 30/09) */
const maiorBrutoCru = Math.max.apply(null, cru.veiculos.map(brutoCru));
const scoreCru = (v) => Math.round(1000 * brutoCru(v) / maiorBrutoCru) / 10;
const scorePorNeg = {};
D0.veiculos.forEach((v) => { scorePorNeg[v.neg] = v.score; });
const scoreErrado = cru.veiculos.filter((v) => scorePorNeg[v.neg] !== scoreCru(v));
prova('score de TODOS os veículos recalculado do cru', scoreErrado.length === 0, scoreErrado.slice(0, 3).map((v) => v.neg));
prova('score só é 0 para veículo sem atividade nenhuma', D0.veiculos.every((v) => (v.score === 0) === (brutoCru(cru.veiculos.find((c) => c.neg === v.neg)) === 0)));
prova('score vai de 0 a 100, e o maior da coleta é 100', D0.veiculos.every((v) => v.score >= 0 && v.score <= 100) &&
  Math.max.apply(null, D0.veiculos.map((v) => v.score)) === 100);
prova('VMV atingido pesa 100 no score bruto', scr.indexOf('vmv: 100') > 0 || out.html.indexOf('"vmv":100') > 0);
/* % FIPE (06/10): a MAIOR oferta ÷ FIPE, de todo veículo com oferta e FIPE */
const pfipeCru = {};
cru.veiculos.forEach((v) => {
  const of = cru.ofertas.filter((o) => o.neg === v.neg).map((o) => Number(o.valor));
  pfipeCru[v.neg] = of.length && Number(v.fipe) ? Math.max.apply(null, of) / Number(v.fipe) : null;
});
prova('% FIPE = maior oferta ÷ FIPE', D0.veiculos.every((v) =>
  (pfipeCru[v.neg] === null ? v.pfipe === null : Math.abs(v.pfipe - pfipeCru[v.neg]) < 1e-9)) &&
  D0.veiculos.some((v) => v.pfipe !== null) && D0.veiculos.filter((v) => v.maior === null).every((v) => v.pfipe === null));
/* performance financeira, refeita do cru */
const vendCruL = cru.veiculos.filter((v) => [2, 3, 7].indexOf(Number(v.status)) >= 0 && v.vencedora !== null && ofPorId[v.vencedora]);
const somaC = (arr, f) => arr.reduce((t, x) => t + (f(x) || 0), 0);
const volCru = somaC(vendCruL, (v) => Number(ofPorId[v.vencedora].valor));
const vmvPubCru = somaC(cru.veiculos, (v) => (v.vmv === null ? 0 : Number(v.vmv)));
const comFipe = vendCruL.filter((v) => Number(v.fipe));
const comVmv = vendCruL.filter((v) => v.vmv !== null && Number(v.vmv));
const perto = (a, b) => a !== null && Math.abs(a - b) < 1e-9;
prova('performance: vendido ÷ soma dos VMV de todos os publicados', perto(R.kpi.pc_vendido_vmv, volCru / vmvPubCru) &&
  R.kpi.volume === volCru, [R.kpi.pc_vendido_vmv, volCru / vmvPubCru]);
prova('performance: arremate ÷ FIPE, só dos vendidos com FIPE', perto(R.kpi.pc_arrem_fipe,
  somaC(comFipe, (v) => Number(ofPorId[v.vencedora].valor)) / somaC(comFipe, (v) => Number(v.fipe))), R.kpi.pc_arrem_fipe);
prova('performance: arremate ÷ VMV, só dos vendidos com VMV', perto(R.kpi.pc_arrem_vmv,
  somaC(comVmv, (v) => Number(ofPorId[v.vencedora].valor)) / somaC(comVmv, (v) => Number(v.vmv))), R.kpi.pc_arrem_vmv);
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
prova('funil tem as cinco etapas (06/10: Logaram e Acessaram viraram uma)', JSON.stringify(R.funil.map((f) => f[0])) ===
  JSON.stringify(['Cadastrados', 'Aprovados', 'Acessaram', 'Ofertaram', 'Compraram']));
prova('aprovados = cadastros novos em situation 3', F[1] === novasTodos.filter((l) => Number(l.situacao) === 3).length);
prova('acessaram = novos com dia de acesso no período', F[2] === novasTodos.filter((l) => diasTodos[l.id]).length);
prova('compraram ≤ ofertaram ≤ cadastrados, e toda etapa ≤ cadastrados',
  F[4] <= F[3] && F.every((x) => x <= F[0]), F);

prova('engajamento = acessaram ÷ cadastrados', Math.abs(R.kpi.engajamento - F[2] / F[0]) < 1e-12);
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
/* primeiro e último acesso da loja, no período, refeitos do cru */
const priCru = {};
const ultCru = {};
acessosCru.forEach((a) => {
  if (!dentro(a, perTodos)) return;
  const q = String(a.dia) + (Number(a.hora) < 10 ? '0' : '') + Number(a.hora);
  if (!priCru[a.loja] || q < priCru[a.loja]) priCru[a.loja] = q;
  if (!ultCru[a.loja] || q > ultCru[a.loja]) ultCru[a.loja] = q;
});
prova('primeiro e último acesso de toda loja refeitos do cru', todosPag.lojas.every((x) =>
  x.pri === (priCru[x.loja] || null) && x.ult === (ultCru[x.loja] || null)) &&
  todosPag.lojas.some((x) => x.pri !== null && x.pri < x.ult));
prova('novos lojistas: Acessaram = etapa Acessaram do funil', todosPag.kpi.novas_acessaram === todosPag.funil[2][1] &&
  todosPag.funil[2][0] === 'Acessaram' &&
  Math.abs(todosPag.kpi.engajamento - todosPag.kpi.novas_acessaram / todosPag.kpi.novas) < 1e-12);
/* data: encolhe o período para o dia */
const diaF = todosPag.por_dia.filter((x) => x.total > 0).slice(-4)[0].dia;
const dataF = '20' + diaF.slice(0, 2) + '-' + diaF.slice(2, 4) + '-' + diaF.slice(4, 6);
const fd = calculaDaPagina(D0, 'todos', { dia: diaF });
prova('Data ' + dataF + ': lances = lances daquele dia', fd.kpi.lances === cru.ofertas.filter((o) => o.quando.slice(0, 10) === dataF).length);
prova('Data ' + dataF + ': cada loja com no máximo 1 dia de acesso', fd.lojas.every((x) => x.acessos <= 1) &&
  fd.por_dia.length === 1 && fd.por_dia[0].dia === diaF);
const perDia = [dataF + ' 00:00' > perTodos[0] ? dataF + ' 00:00' : perTodos[0], dataF + ' 23:59' < perTodos[1] ? dataF + ' 23:59' : perTodos[1]];
prova('Data ' + dataF + ': novos = cadastrados naquele dia', fd.kpi.novas === novaCru(dataF, dataF).length, [fd.kpi.novas, novaCru(dataF, dataF).length]);
prova('Data ' + dataF + ': vendas pela data da oferta vencedora', fd.kpi.vendidos === cru.veiculos.filter((v) =>
  [2, 3, 7].indexOf(Number(v.status)) >= 0 && ofPorId[v.vencedora] && ofPorId[v.vencedora].quando.slice(0, 10) === dataF).length);
prova('Data ' + dataF + ': a lista de veículos continua inteira', fd.veiculos.length === todosPag.veiculos.length);
/* a Data virou os botões acima do funil (Thomas, 26/10): cadastros, acessos e
   negociações daquele dia — e o funil acompanha */
prova('Data ' + dataF + ': o funil só com os cadastrados naquele dia, refeito do cru', fd.funil[0][1] === novaCru(dataF, dataF).length &&
  fd.funil[2][1] === novaCru(dataF, dataF).filter((l) => diasNoPeriodo([dataF + ' 00:00' > perTodos[0] ? dataF + ' 00:00' : perTodos[0],
    dataF + ' 23:59' < perTodos[1] ? dataF + ' 23:59' : perTodos[1]])[l.id]).length && fd.kpi.novas_acessaram === fd.funil[2][1], fd.funil);
prova('Data ' + dataF + ': os botões continuam todos (o período não encolhe com o dia)',
  JSON.stringify(fd.dias_periodo) === JSON.stringify(todosPag.dias_periodo) && todosPag.dias_periodo.length > 1);
prova('Data ' + dataF + ': compradores = lojas das vendas daquele dia', fd.kpi.compradores === new Set(cru.veiculos.filter((v) =>
  [2, 3, 7].indexOf(Number(v.status)) >= 0 && ofPorId[v.vencedora] && ofPorId[v.vencedora].quando.slice(0, 10) === dataF)
  .map((v) => String(ofPorId[v.vencedora].loja))).size);
/* filtros juntos: pátio + status = interseção */
const fj = calculaDaPagina(D0, 'todos', { patio: umPatio, farol: 'abaixo' });
/* filtro de representante que chegasse por engano (link velho, cópia do C6)
   não recorta nada: a calcula não conhece gp nem gn */
prova('gp/gn no filtro são ignorados', JSON.stringify(calculaDaPagina(D0, 'todos', { gp: 'X', gn: 'Y' }).kpi) === JSON.stringify(todosPag.kpi));
prova('Pátio + Status: interseção', fj.kpi.publicados === D0.veiculos.filter((v) => v.patio === umPatio && v.farol === 'abaixo').length);
prova('sem filtro = filtro vazio', JSON.stringify(calculaDaPagina(D0, 'todos', { dia: '', patio: '', farol: '' }).kpi) ===
  JSON.stringify(todosPag.kpi));

/* ── 4. o HTML ──────────────────────────────────────────────────────── */
const h = out.html;
const semScript = h.split('<script>')[0];
prova('HTML sem requisição de rede', semScript.indexOf('src="http') < 0 && h.indexOf('<link') < 0 &&
  h.indexOf('@import') < 0 && h.indexOf('url(http') < 0);
prova('logo em data URI', h.indexOf('data:image/svg+xml;base64,') > 0);
/* a logo da Fenauto (26/10): SVG inline, uma cópia só. No escuro o CSS pinta
   de branco o que a logo-fenauto-escuro.svg pinta de branco */
prova('logo da Fenauto inline, a que o injetor produz da arte do design, uma vez só',
  h.indexOf(injetor.logoFenauto) > 0 && h.split('<title>FENAUTO com Cars2You</title>').length === 2 &&
  /* a PRETA no claro (26/10): FENAUTO e Cars2You em #242424, a tinta do C6;
     a azul (#403172) fica guardada em logo-fenauto-azul.svg e fora da página */
  (injetor.logoFenauto.match(/fill="#242424"/g) || []).length === 2 && h.indexOf('#403172') < 0 &&
  fs.existsSync(path.join(__dirname, '..', '..', '..', 'design', 'marca', 'fenauto', 'logo-fenauto-azul.svg')) &&
  h.indexOf('data:image/svg+xml;base64,' + fs.readFileSync(path.join(__dirname, '..', '..', '..', 'design', 'marca', 'fenauto', 'logo-fenauto-escuro.svg')).toString('base64')) < 0);
prova('logo da Fenauto: coordenadas com uma casa, escala da Cars2You intacta', (() => {
  const ds = injetor.logoFenauto.match(/ d="[^"]*"/g) || [];
  return ds.length === 9 && ds.every((d) => !/[0-9][.][0-9][0-9]/.test(d)) && injetor.logoFenauto.indexOf('scale(0.46088)') > 0;
})());
/* topo (Thomas, 26/10, segunda versão): o C6 sozinho à esquerda; a Fenauto no
   centro, dentro do h1, no lugar do título e do subtítulo */
prova('topo: só a logo do C6 à esquerda', (() => {
  const i = semScript.indexOf('<span class="marca">');
  const fim = semScript.indexOf('</span>', i);
  const marca = semScript.slice(i, fim);
  return i > 0 && marca.indexOf('id="logo"') > 0 && marca.indexOf('<svg') < 0 && h.indexOf('marca duas') < 0 && h.indexOf('class="fio"') < 0;
})());
prova('topo: a Fenauto no centro, dentro do h1, sem título nem subtítulo', (() => {
  const t = semScript.indexOf('<div class="topo-tit">');
  const h1 = semScript.indexOf('<h1 class="logo-fen" id="logo-fen">');
  const fimTit = semScript.indexOf('</div>', t);
  return t > semScript.indexOf('<span class="marca">') && h1 === t + '<div class="topo-tit">'.length &&
    semScript.slice(h1, fimTit) === '<h1 class="logo-fen" id="logo-fen">' + injetor.logoFenauto + '</h1>' &&
    h.indexOf('id="sub"') < 0 && scr.indexOf("$('#sub')") < 0 && semScript.indexOf('<h1>') < 0;
})());
prova('o h1 tem nome: o do SVG', injetor.logoFenauto.indexOf('role="img" aria-label="FENAUTO com Cars2You"') > 0);
prova('escuro: a Fenauto em branco pelo CSS, como a logo-fenauto-escuro.svg', h.indexOf('[data-tema="escuro"] .logo-fen path,[data-tema="escuro"] .logo-fen g{fill:#FFFFFF}') > 0 &&
  fs.readFileSync(path.join(__dirname, '..', '..', '..', 'design', 'marca', 'fenauto', 'logo-fenauto-escuro.svg'), 'utf8').indexOf('#FFFFFF') > 0);
prova('troca de tema troca a logo do C6; a da Fenauto não depende de JS', scr.indexOf("$('#logo').src = LOGO[t];") > 0 && scr.indexOf("$('#logo-fen')") < 0);
prova('aba do navegador: Eventos Fenauto C6', h.indexOf('<title>Eventos Fenauto C6</title>') > 0 && h.indexOf('Mega evento exclusivo') < 0);
prova('Fenauto com 44px, 30px no telefone', h.indexOf('.logo-fen svg{display:block;height:44px;') > 0 &&
  h.indexOf('@media (max-width:620px){.logo-fen svg{height:30px}}') > 0);
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
prova('sem ranking de representante', ['th-rgp', 'th-rgn', 'th-reps', 'n-rgp', 'n-rgn'].every((t) => h.indexOf(t) < 0));
/* 26/10: KPIs → funil | acessos por dia → por hora → ranking de lojas → pátios */
prova('ranking de lojas embaixo dos acessos por hora, antes dos pátios', (() => {
  const hora = semScript.indexOf('id="g-hora"');
  const lojas = semScript.indexOf('id="th-lojas"');
  return semScript.indexOf('id="k-nv"') < semScript.indexOf('id="funil"') && semScript.indexOf('id="funil"') < semScript.indexOf('id="g-dia"') &&
    semScript.indexOf('id="g-dia"') < hora && hora < lojas && lojas < semScript.indexOf('id="th-patios"');
})());
/* 26/10: os botões saíram do cartão do funil — linha própria entre os KPIs e ele */
prova('botões de Data fora de cartão, entre os KPIs e o funil', (() => {
  const b = semScript.indexOf('id="f-dias"');
  const fimKpi = semScript.indexOf('</section>', semScript.indexOf('id="k-nv"'));
  const linha = semScript.indexOf('<section class="g2i">', fimKpi);
  const antes = semScript.slice(fimKpi, b);
  return fimKpi < b && b < linha && linha < semScript.indexOf('id="funil"') && antes.indexOf('cartao') < 0 &&
    semScript.indexOf('<div class="barra-dias"><span class="rot-dias" id="f-dias-rot">Data</span>') > 0 &&
    semScript.indexOf('role="group" aria-labelledby="f-dias-rot"') > 0;
})());
prova('o painel abre no tema escuro (padrão de projeto novo, 26/10)', h.indexOf('<html lang="pt-BR" data-tema="escuro">') === 15 &&
  scr.indexOf("tema(document.documentElement.dataset.tema || 'escuro');") > 0);
prova('ranking e CSV sem a coluna Pontos', h.indexOf("t: 'Pontos'") < 0 && scr.indexOf("'Recuperações'];") > 0 && scr.indexOf('r.pontos') < 0);
prova('botão de data liga o filtro de Data (o do painel inteiro) e zera o clique por hora', scr.indexOf("F.dia = b.getAttribute('data-d');") > 0 &&
  scr.indexOf('dia_cad') < 0 && scr.indexOf('cad_por_dia') < 0);
prova('botões de data: Todos e um por dia do período', scr.indexOf("[['', 'Todos']].concat(R.dias_periodo.map((c) => [c, diaCod(c)]))") > 0);
prova('a aba de Filtros não conta a data (ela não mora na gaveta)', scr.indexOf("FILTROS.filter((k) => k !== 'dia' && F[k])") > 0);
prova('ranking de lojas na linha inteira', (() => {
  const i = semScript.indexOf('id="th-lojas"');
  const g = semScript.lastIndexOf('<section class="g2i">', i);
  return i > 0 && semScript.lastIndexOf('</section>', i) > g;
})());
prova('ranking de lojas com primeiro e último acesso, sem GP nem GN', ["t: 'Primeiro acesso'", "t: 'Último acesso'"]
  .every((t) => scr.indexOf(t) > 0) && ["t: 'Usuário GP'", "t: 'Usuário GN'", "k: 'gp'", "k: 'gn'"].every((t) => h.indexOf(t) < 0));
prova('cinco cartões: Performance financeira logo depois de Vendidos', (semScript.match(/class="kpi-val num"/g) || []).length === 5 &&
  semScript.indexOf('id="k-vd"') < semScript.indexOf('id="k-pf"') && semScript.indexOf('id="k-pf"') < semScript.indexOf('id="k-nv"') &&
  ['id="k-pf-pc"', 'id="k-pf-fipe"', 'id="k-pf-vmv"'].every((t) => semScript.indexOf(t) > 0));
prova('Vendidos sem o valor; valor na Performance financeira', scr.indexOf("$('#k-vd').textContent = nf(k.vendidos);") > 0 &&
  scr.indexOf("$('#k-pf').textContent = rs(k.volume);") > 0 && h.indexOf('kpi-val-2') < 0);
prova('Novos lojistas: Acessaram, Ofertaram, Compraram no pé', (() => {
  const i = semScript.indexOf('id="k-nv"');
  const pe = semScript.slice(i, semScript.indexOf('</article>', i));
  return pe.indexOf('>Acessaram<') < pe.indexOf('>Ofertaram<') && pe.indexOf('>Ofertaram<') < pe.indexOf('>Compraram<') && pe.indexOf('>Acessaram<') > 0;
})());
prova('pátio: coluna % C/ VMV atingido', scr.indexOf("t: '% C/ VMV atingido'") > 0 && scr.indexOf("t: '% VMV atingido'") < 0);
prova('veículos: coluna % FIPE', scr.indexOf("{ k: 'pfipe', t: '% FIPE'") > 0);
prova('Resultado sem GP e GN', scr.indexOf('semRepHtml') < 0 && scr.indexOf('dim sub">GP ') < 0 && scr.indexOf('F.col') < 0);
prova('farol abaixo do VMV em amarelo, nos dois temas', h.indexOf('.farol.abaixo{background:var(--farol-abaixo)}') > 0 &&
  (h.slice(h.indexOf('#DCDCDC')).match(/--farol-abaixo:/g) || []).length === 2);
prova('sem degradê amarelo no escuro', h.indexOf('rgba(255,192,0,.07)') < 0);
prova('pátios fora da grade de duas colunas (linha inteira)', (() => {
  const i = semScript.indexOf('id="th-patios"');
  const g = semScript.lastIndexOf('<section class="g2i">', i);
  return i > 0 && semScript.lastIndexOf('</section>', i) > g;
})());
prova('gaveta de filtros com Pátio e Status, sem Data nem Usuário GP/GN', ['id="gaveta"', 'id="f-patio"', 'id="f-farol"', 'id="limpar"']
  .every((t) => semScript.indexOf(t) > 0) && ['id="f-dia"', 'id="f-gp"', 'id="f-gn"', 'Usuário GP', 'Usuário GN'].every((t) => semScript.indexOf(t) < 0));
prova('gráfico por dia se chama Acessos únicos por dia', semScript.indexOf('Acessos únicos por dia') > 0 && semScript.indexOf('Lojas únicas que acessaram') < 0);
prova('ranking de lojas: nova sempre, as demais só com acesso (05/10)', scr.indexOf('R.lojas.filter((r) => (r.nova || r.acessos > 0)') > 0);
prova('funil: mínimo de 3 dígitos somado em todas as etapas + parte proporcional',
  scr.indexOf('const MIN_F = 3 * 7.4 + 16;') > 0 && scr.indexOf('MIN_F + (FW - MIN_F) * (v0 ? f[1] / v0 : 0)') > 0);
prova('funil à esquerda das lojas por dia; por hora abaixo', semScript.indexOf('id="funil"') < semScript.indexOf('id="g-dia"') &&
  semScript.indexOf('id="g-dia"') < semScript.indexOf('id="g-hora"'));
prova('botões Todos lojistas/Somente novos; sem o botão GN/GP', ['Todos lojistas', 'Somente novos'].every((t) => semScript.indexOf(t) > 0) &&
  h.indexOf('seg-reps') < 0 && h.indexOf('f-rep') < 0);
/* ordem pedida em 29/09, sem os filtros de usuário; nada disso no topo */
const gav = semScript.slice(semScript.indexOf('id="gaveta"'), semScript.indexOf('</aside>'));
const posG = ['id="f-evento"', 'id="seg-lojas"', 'id="f-patio"', 'id="f-farol"'].map((t) => gav.indexOf(t));
prova('gaveta na ordem: Evento, Lojistas, Pátio, Status', posG.every((p, i) => p > 0 && (i === 0 || p > posG[i - 1])), posG);
prova('topo e rankings sem seletor de evento nem botões', semScript.slice(0, semScript.indexOf('id="gaveta"')).indexOf('f-evento') < 0 &&
  semScript.slice(semScript.indexOf('</aside>')).indexOf('class="seg"') < 0);
prova('veículos abrem pelo score crescente', scr.indexOf("veic: { k: 'score', dir: 1 }") > 0);
prova('ranking de lojas abre pelas recuperações, decrescente', scr.indexOf("lojas: { k: 'arrem', dir: -1 },") > 0 && scr.indexOf('rgp:') < 0);
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
prova('caminho no SharePoint', va.json.caminho === 'Eventos%20Fenauto%20C6/eventos-fenauto-c6.html', va.json.caminho);
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

/* ── 7. nada de representante sobrou (26/10) ───────────────────────────
   O painel do C6 tinha GN e GP em sete lugares: dois rankings, dois filtros,
   a tabela de lojas, o Resultado do veículo e o CSV. Nenhum deles, nem o
   dado que os alimentava, pode ter ficado para trás. */
prova('o nó não lê carteira nem tabela de gerentes', painelFonte.indexOf("$('Ler Representantes')") < 0 &&
  painelFonte.indexOf("$('Ler Nomes')") < 0);
prova('loja sem gp, gn nem cnpj no dado', D0.lojas.length > 0 && D0.lojas.every((l) => l.gp === undefined && l.gn === undefined && l.cnpj === undefined));
prova('dado sem sem_rep nem base_reps', D0.sem_rep === undefined && D0.base_reps === undefined);
prova('resumo sem representantes', R.representantes === undefined);
prova('calcula não devolve representantes', todosPag.representantes === undefined);
prova('nenhum texto de representante no HTML', ['Representante', 'representante', 'Usuário GP', 'Usuário GN', 'GP_Usuario', 'GN_Usuario', 'carteira de', 'Carteira C6']
  .every((t) => h.indexOf(t) < 0), ['Representante', 'representante', 'Usuário GP', 'Usuário GN', 'carteira de'].filter((t) => h.indexOf(t) >= 0));
prova('CSV de novos lojistas sem GP e GN, com nome próprio', scr.indexOf("const cab = ['Loja', 'Primeiro acesso',") > 0 &&
  scr.indexOf("'novos-lojistas-fenauto-c6-'") > 0 && scr.indexOf('r.gp') < 0 && scr.indexOf('r.gn') < 0);
prova('sem pontuação nenhuma no nó nem na página', painelFonte.indexOf('pontos') < 0 && painelFonte.indexOf('PONTOS') < 0 && h.indexOf('Pontuação') < 0);
prova('rodapé sem a data da carteira', scr.indexOf('base_reps') < 0);
prova('nada de "Arremate" na tela; Recuperações nas colunas e no cartão', (() => {
  const vis = semScript + scr.slice(scr.indexOf('function APP('));
  return ["t: 'Arremates'", "'Arremate / FIPE'", "'Arremate / VMV'", 'pontos por arremate', 'loja arrematante']
    .every((t) => vis.indexOf(t) < 0 && out.html.indexOf(t) < 0) &&
    ["t: 'Recuperações'", 'Recuperação / FIPE', 'Recuperação / VMV'].every((t) => out.html.indexOf(t) > 0);
})());

console.log((falhas ? '✗' : '✓') + ' %d provas, %d falha(s)', ok + falhas, falhas);
if (falhas) process.exit(1);
