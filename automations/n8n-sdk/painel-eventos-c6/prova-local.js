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
const arq = path.join(__dirname, 'dados-prova.json');
if (!fs.existsSync(arq)) {
  console.error('dados-prova.json não existe — rode `python coleta_local.py --prova` (precisa de VPN)');
  process.exit(1);
}
const d = JSON.parse(fs.readFileSync(arq, 'utf8'));
if (d.consultas.length !== NOMES.length) {
  console.error('dados-local.json é de antes das consultas de acesso — rode `python coleta_local.py` (VPN)');
  process.exit(1);
}
const arqPlan = path.join(__dirname, 'dados-carteira-local.json');
if (!fs.existsSync(arqPlan)) {
  console.error('dados-carteira-local.json não existe — rode `node _carteira_local.js`');
  process.exit(1);
}
const planilha = JSON.parse(fs.readFileSync(arqPlan, 'utf8'));
const arqNomes = path.join(__dirname, 'dados-gerentes-local.json');
if (!fs.existsSync(arqNomes)) {
  console.error('dados-gerentes-local.json não existe — rode `node _gerentes_local.js`');
  process.exit(1);
}
const gerentes = JSON.parse(fs.readFileSync(arqNomes, 'utf8'));
const nos = { 'Montar Consultas': d.consultas, 'MCP Consultas': d.mcp, 'Ler Representantes': planilha, 'Ler Nomes': gerentes };
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
/* loja nova (Thomas, 02/10): no grupo de cliente das novas, cadastrada a
   partir da data das novas e dentro da janela */
const REGRA_NOVAS = d.consultas[0].json.meta.novas;
/* 05/10: loja nova não depende da janela do evento; só o filtro de Data corta, pelo fim do dia */
const novaCru = (fim) => cru.lojas.filter((l) => Number(l.grupo) === 1 && !Number(l.apagada) &&
  l.cadastro >= REGRA_NOVAS.desde && (fim === null || l.cadastro <= fim));
const novasTodos = novaCru(null);
const ehNovaT = {};
novasTodos.forEach((l) => { ehNovaT[l.id] = 1; });
prova('lojas novas = grupo ' + REGRA_NOVAS.grupo + ' e cadastro desde ' + REGRA_NOVAS.desde, R.kpi.novas === novasTodos.length, [R.kpi.novas, novasTodos.length]);
prova('regra de loja nova no nó: grupo 146, desde 01/10/2026', itens[0].json.meta.novas.grupo === 146 &&
  itens[0].json.meta.novas.desde === '2026-10-01 00:00' && sqlDe('lojas').indexOf('ucg.client_group_id = 146') > 0);
prova('recorte de outubro no nó: eventos que encerram a partir de 01/10/2026', itens[0].json.meta.piso === '2026-10-01 00:00:00' &&
  sqlDe('eventos').indexOf("e.finish_date_event >= '2026-10-01 00:00:00'") > 0);
prova('coleta: todo evento encerra a partir do piso dela', cru.eventos.every((e) => e.fim >= d.consultas[0].json.meta.piso.slice(0, 16)));
prova('coleta: há loja nova (no grupo e depois da data) e loja do grupo antiga, que não é nova',
  novasTodos.length > 0 && cru.lojas.some((l) => Number(l.grupo) === 1 && l.cadastro < REGRA_NOVAS.desde) &&
  cru.lojas.some((l) => Number(l.grupo) !== 1 && l.cadastro >= REGRA_NOVAS.desde && Number(l.wl) === 43), novasTodos.length);

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
prova('acesso fora do período não muda pontos nem dias', outSab.resumo.top_lojas[0].pontos === R.top_lojas[0].pontos &&
  outSab.resumo.top_lojas[0].acessos === R.top_lojas[0].acessos && outSab.resumo.kpi.acessos === R.kpi.acessos);

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
/* Usuário GP e Usuário GN: cada um recorta as lojas pela sua coluna (30/09) */
const repMaisComum = (col) => {
  const cont = {};
  D0.lojas.forEach((l) => { if (l[col] !== 'Sem Representante') cont[l[col]] = (cont[l[col]] || 0) + 1; });
  return Object.keys(cont).sort((a, b) => cont[b] - cont[a])[0];
};
['gp', 'gn'].forEach((col) => {
  const rep = repMaisComum(col);
  const fr = {};
  fr[col] = rep;
  const r = calculaDaPagina(D0, 'todos', fr);
  const doRep = {};
  D0.lojas.forEach((l) => { if (l[col] === rep) doRep[l.id] = 1; });
  prova(col.toUpperCase() + ' ' + rep + ': ranking só com lojas dele', r.lojas.length > 0 && r.lojas.every((x) => x[col] === rep));
  prova(col.toUpperCase() + ' ' + rep + ': lances = lances das lojas dele', r.kpi.lances === cru.ofertas.filter((o) => doRep[o.loja]).length);
  prova(col.toUpperCase() + ' ' + rep + ': dias com acesso refeitos', r.lojas.every((x) =>
    x.acessos === (diasNoPeriodo(perTodos, (l) => doRep[l])[x.loja] || 0)));
  prova(col.toUpperCase() + ' ' + rep + ': a lista de veículos continua inteira', r.veiculos.length === todosPag.veiculos.length);
  prova(col.toUpperCase() + ' ' + rep + ': novos só dele', r.kpi.novas === novasTodos.filter((l) => doRep[l.id]).length);
});
/* os dois juntos se somam: só as lojas daquele GP E daquele GN */
(() => {
  /* o par mais comum entre as lojas do RANKING (quem ofertou ou é nova):
     um par só do cadastro daria ranking vazio e a prova não provaria nada */
  const cont = {};
  todosPag.lojas.forEach((l) => {
    if (l.gp !== 'Sem Representante' && l.gn !== 'Sem Representante') cont[l.gp + '|' + l.gn] = (cont[l.gp + '|' + l.gn] || 0) + 1;
  });
  const par = Object.keys(cont).sort((a, b) => cont[b] - cont[a])[0].split('|');
  const gp = par[0];
  const gn = par[1];
  const r = calculaDaPagina(D0, 'todos', { gp: gp, gn: gn });
  const doPar = {};
  D0.lojas.forEach((l) => { if (l.gp === gp && l.gn === gn) doPar[l.id] = 1; });
  prova('Usuário GP + Usuário GN: interseção', r.lojas.length > 0 && r.lojas.every((x) => x.gp === gp && x.gn === gn) &&
    r.kpi.lances === cru.ofertas.filter((o) => doPar[o.loja]).length, [gp, gn]);
})();
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
prova('Data ' + dataF + ': novos = cadastrados naquele dia', fd.kpi.novas === novaCru(dataF + ' 23:59').length, [fd.kpi.novas, novaCru(dataF + ' 23:59').length]);
prova('Data ' + dataF + ': vendas pela data da oferta vencedora', fd.kpi.vendidos === cru.veiculos.filter((v) =>
  [2, 3, 7].indexOf(Number(v.status)) >= 0 && ofPorId[v.vencedora] && ofPorId[v.vencedora].quando.slice(0, 10) === dataF).length);
prova('Data ' + dataF + ': a lista de veículos continua inteira', fd.veiculos.length === todosPag.veiculos.length);
/* filtros juntos: pátio + status = interseção */
const fj = calculaDaPagina(D0, 'todos', { patio: umPatio, farol: 'abaixo' });
prova('Pátio + Status: interseção', fj.kpi.publicados === D0.veiculos.filter((v) => v.patio === umPatio && v.farol === 'abaixo').length);
prova('sem filtro = filtro vazio', JSON.stringify(calculaDaPagina(D0, 'todos', { gp: '', gn: '', dia: '', patio: '', farol: '' }).kpi) ===
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
prova('rankings de usuários GP e GN lado a lado, antes do de lojas', semScript.indexOf('id="th-rgp"') > 0 &&
  semScript.indexOf('id="th-rgp"') < semScript.indexOf('id="th-rgn"') && semScript.indexOf('id="th-rgn"') < semScript.indexOf('id="th-lojas"') &&
  semScript.lastIndexOf('<section class="g2i">', semScript.indexOf('id="th-rgp"')) ===
  semScript.lastIndexOf('<section class="g2i">', semScript.indexOf('id="th-rgn"')) && semScript.indexOf('id="th-reps"') < 0);
prova('ranking de lojas na linha inteira', (() => {
  const i = semScript.indexOf('id="th-lojas"');
  const g = semScript.lastIndexOf('<section class="g2i">', i);
  return i > 0 && semScript.lastIndexOf('</section>', i) > g;
})());
prova('ranking de lojas com GP, GN, primeiro e último acesso', ["t: 'Usuário GP'", "t: 'Usuário GN'", "t: 'Primeiro acesso'", "t: 'Último acesso'"]
  .every((t) => scr.indexOf(t) > 0));
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
prova('Resultado com GP e GN, sem o botão', scr.indexOf("'<span class=\"dim sub\">GP ' + semRepHtml(l.gp") > 0 && scr.indexOf('F.col') < 0);
prova('farol abaixo do VMV em amarelo, nos dois temas', h.indexOf('.farol.abaixo{background:var(--farol-abaixo)}') > 0 &&
  (h.slice(h.indexOf('#DCDCDC')).match(/--farol-abaixo:/g) || []).length === 2);
prova('sem degradê amarelo no escuro', h.indexOf('rgba(255,192,0,.07)') < 0);
prova('pátios fora da grade de duas colunas (linha inteira)', (() => {
  const i = semScript.indexOf('id="th-patios"');
  const g = semScript.lastIndexOf('<section class="g2i">', i);
  return i > 0 && semScript.lastIndexOf('</section>', i) > g;
})());
prova('gaveta de filtros com Usuário GP, Usuário GN, Data, Pátio e Status', ['id="gaveta"', 'id="f-gp"', 'id="f-gn"', 'id="f-dia"', 'id="f-patio"', 'id="f-farol"', 'id="limpar"']
  .every((t) => semScript.indexOf(t) > 0));
prova('gráfico por dia se chama Acessos únicos por dia', semScript.indexOf('Acessos únicos por dia') > 0 && semScript.indexOf('Lojas únicas que acessaram') < 0);
prova('rankings: representantes só com loja nova; lojas: nova sempre, as demais só com acesso (05/10)', scr.indexOf('.filter((g) => g.novas > 0)') > 0 &&
  scr.indexOf('R.lojas.filter((r) => (r.nova || r.acessos > 0)') > 0);
prova('funil: mínimo de 3 dígitos somado em todas as etapas + parte proporcional',
  scr.indexOf('const MIN_F = 3 * 7.4 + 16;') > 0 && scr.indexOf('MIN_F + (FW - MIN_F) * (v0 ? f[1] / v0 : 0)') > 0);
prova('funil à esquerda das lojas por dia; por hora abaixo', semScript.indexOf('id="funil"') < semScript.indexOf('id="g-dia"') &&
  semScript.indexOf('id="g-dia"') < semScript.indexOf('id="g-hora"'));
prova('botões Todos lojistas/Somente novos; sem o botão GN/GP', ['Todos lojistas', 'Somente novos'].every((t) => semScript.indexOf(t) > 0) &&
  h.indexOf('seg-reps') < 0 && h.indexOf('f-rep') < 0);
/* ordem pedida em 29/09, com os filtros de usuário no lugar do botão GN/GP
   e do Representante (30/09); nada disso no topo */
const gav = semScript.slice(semScript.indexOf('id="gaveta"'), semScript.indexOf('</aside>'));
const posG = ['id="f-evento"', 'id="seg-lojas"', 'id="f-gp"', 'id="f-gn"', 'id="f-dia"', 'id="f-patio"', 'id="f-farol"'].map((t) => gav.indexOf(t));
prova('gaveta na ordem: Evento, Lojistas, Usuário GP, Usuário GN, Data, Pátio, Status', posG.every((p, i) => p > 0 && (i === 0 || p > posG[i - 1])), posG);
prova('topo e rankings sem seletor de evento nem botões', semScript.slice(0, semScript.indexOf('id="gaveta"')).indexOf('f-evento') < 0 &&
  semScript.slice(semScript.indexOf('</aside>')).indexOf('class="seg"') < 0);
prova('veículos abrem pelo score crescente', scr.indexOf("veic: { k: 'score', dir: 1 }") > 0);
prova('rankings abrem pela pontuação decrescente', scr.indexOf("lojas: { k: 'pontos', dir: -1 }, rgp: { k: 'pontos', dir: -1 }, rgn: { k: 'pontos', dir: -1 }") > 0);
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
   Cada caso da regra, com CNPJs TIRADOS da carteira real e plantados em
   lojas da coleta: a contagem aqui é independente da do nó. Linha sem
   Base_Data em forma de data (a de teste do Caio) não é da carteira. */
const dataOk = (v) => /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(String(v || '').trim().slice(0, 10));
const soDig = (v) => String(v || '').split('').filter((c) => c >= '0' && c <= '9').join('');
const votosDe = (col) => {
  const vt = {};
  planilha.forEach((it) => {
    if (!dataOk(it.json.Base_Data)) return;
    const c = soDig(it.json.CNPJ).padStart(14, '0');
    vt[c] = vt[c] || {};
    const r = String(it.json[col] || '').trim();
    if (r) vt[c][r] = (vt[c][r] || 0) + 1;
  });
  return vt;
};
const votosP = votosDe('GP_Usuario');
const votosN = votosDe('GN_Usuario');
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

/* o nome que a tela deve mostrar, contado aqui à parte da tabela de gerentes */
const nomeIndep = { gp: {}, gn: {} };
gerentes.forEach((it) => { nomeIndep[it.json.Papel.toLowerCase()][it.json.Usuario] = it.json.Nome; });
const nomeEsp = (q, rep) => (rep === 'Sem Representante' ? rep : nomeIndep[q][rep] || rep);

/* na coleta real, GP e GN de cada loja batem com a conta independente */
const cnpjCru = {};
cru.lojas.forEach((l) => { cnpjCru[l.id] = soDig(l.cnpj).padStart(14, '0'); });
const repErrado = (col, vt) => D0.lojas.filter((l) => l[col] !== nomeEsp(col, esperadoDe(vt, cnpjCru[l.id])));
prova('Usuário GP de toda loja da coleta bate com a carteira', repErrado('gp', votosP).length === 0, repErrado('gp', votosP).slice(0, 2));
prova('Usuário GN de toda loja da coleta bate com a carteira', repErrado('gn', votosN).length === 0, repErrado('gn', votosN).slice(0, 2));
prova('GN e GP são colunas diferentes de fato', D0.lojas.some((l) => l.gp !== l.gn));
/* o nome no lugar do usuário: nenhum USUARIO.EM.CAIXA.ALTA sobra na tela */
const pareceLogin = (v) => v !== 'Sem Representante' && v.indexOf('.') > 0 && v === v.toUpperCase();
prova('representantes aparecem pelo nome, nenhum pelo usuário',
  D0.lojas.every((l) => !pareceLogin(l.gp) && !pareceLogin(l.gn)) &&
  D0.lojas.some((l) => l.gn !== 'Sem Representante') && D0.lojas.some((l) => l.gp !== 'Sem Representante'),
  D0.lojas.filter((l) => pareceLogin(l.gp) || pareceLogin(l.gn)).slice(0, 2));
prova('nomes contados no resumo, nenhum usuário sem nome', R.representantes.nomes.gn === 250 && R.representantes.nomes.gp === 30 &&
  !R.representantes.nomes.sem_nome_gp.length && !R.representantes.nomes.sem_nome_gn.length, R.representantes.nomes);
/* um usuário a menos na tabela de nomes: ele aparece pelo usuário, com aviso, e o run segue */
const umGn = D0.lojas.find((l) => l.gn !== 'Sem Representante').gn;
const loginGn = Object.keys(nomeIndep.gn).find((u) => nomeIndep.gn[u] === umGn);
const outSN = roda('montar-painel.js', Object.assign({}, nos, { 'Ler Nomes': gerentes.filter((it) => it.json.Usuario !== loginGn) }))[0].json;
prova('usuário sem nome aparece pelo usuário e vira aviso', dadosDe(outSN.html).lojas.some((l) => l.gn === loginGn) &&
  outSN.resumo.avisos.some((a) => a.indexOf('1 Usuário(s) GN sem nome') === 0), outSN.resumo.avisos);
const outNV = roda('montar-painel.js', Object.assign({}, nos, { 'Ler Nomes': [{ json: {} }] }))[0].json;
prova('tabela de nomes vazia: usuários na tela, aviso, run segue', dadosDe(outNV.html).lojas.some((l) => pareceLogin(l.gn)) &&
  outNV.resumo.avisos.some((a) => a.indexOf('veio vazia') > 0), outNV.resumo.avisos);
/* dois usuários com o mesmo nome não viram um representante só */
const gpsNaColeta = D0.lojas.map((l) => l.gp).filter((g, i, a) => g !== 'Sem Representante' && a.indexOf(g) === i);
const [ua, ub] = gpsNaColeta.slice(0, 2).map((n) => Object.keys(nomeIndep.gp).find((u) => nomeIndep.gp[u] === n));
const outCo = roda('montar-painel.js', Object.assign({}, nos, { 'Ler Nomes': gerentes.map((it) =>
  (it.json.Usuario === ub && it.json.Papel === 'GP' ? { json: Object.assign({}, it.json, { Nome: nomeIndep.gp[ua] }) } : it)) }))[0].json;
const gpsCo = dadosDe(outCo.html).lojas.map((l) => l.gp);
prova('nome repetido leva o usuário entre parênteses', gpsCo.every((g) => g !== nomeIndep.gp[ua]) &&
  gpsCo.indexOf(nomeIndep.gp[ua] + ' (' + ua + ')') >= 0 && gpsCo.indexOf(nomeIndep.gp[ua] + ' (' + ub + ')') >= 0, [ua, ub]);

const achaCnpj = (caso) => Object.keys(votosP).find((c) => casoDe(votosP, c) === caso);
const CASOS = {
  unico: achaCnpj('unico'), maioria: achaCnpj('maioria'), empate: achaCnpj('empate'),
  vazio: achaCnpj('vazio'), fora: '00000000000191', sem_cnpj: null,
  teste: '22131844000104'
};
prova('a carteira real tem os quatro casos', ['unico', 'maioria', 'empate', 'vazio'].every((k) => CASOS[k]), CASOS);

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
  const esp = CASOS[caso] ? nomeEsp('gp', esperadoDe(votosP, CASOS[caso])) : 'Sem Representante';
  prova('representante no caso ' + caso, repDe[id] === esp, [repDe[id], esp]);
});
const RR = outS.resumo.representantes.gp;
prova('resumo conta cada caminho do cruzamento',
  RR.unico === 1 && RR.maioria === 1 && RR.empate === 1 && RR.vazio_planilha === 1 && RR.sem_cnpj === 1 &&
  RR.fora_planilha === linhasL.length - 5, RR);
prova('linhas da carteira contadas', outS.resumo.representantes.linhas_planilha === planilha.length);
/* a linha de teste da tabela: fora da conta, com aviso, sem dar o GN dela ao CNPJ */
const idTeste = Object.keys(plantado).find((id) => plantado[id] === 'teste');
prova('linha de teste da carteira: o CNPJ dela fica Sem Representante nas duas colunas',
  D.lojas.some((l) => String(l.id) === idTeste && l.gn === 'Sem Representante' && l.gp === 'Sem Representante'));
prova('linha de teste da carteira: nenhuma loja com o GN dela', D.lojas.concat(D0.lojas).every((l) =>
  l.gn !== 'CAIO.LEDESMA' && l.gn.indexOf('Caio Ledesma') < 0));
prova('linha de teste da carteira: 1 linha fora, sem aviso na tela (05/10)', R.representantes.linhas_fora === 1 &&
  !R.avisos.some((a) => a.indexOf('da carteira sem data de base') >= 0), [R.representantes.linhas_fora, R.avisos]);
prova('data da carteira = a das linhas válidas, no rodapé', R.representantes.base === '2026-08-17' && D0.base_reps === '2026-08-17' &&
  out.html.indexOf("' · carteira de representantes de ' + dia(D.base_reps)") > 0);
prova('empate, maioria e loja sem CNPJ viram aviso', ['mais de um Usuário GP', 'empate de Usuário GP', 'sem CNPJ no banco']
  .every((t) => outS.resumo.avisos.some((a) => a.indexOf(t) >= 0)), outS.resumo.avisos);
prova('CNPJ não vaza para o HTML', ['unico', 'maioria', 'empate', 'vazio'].every((k) => outS.html.indexOf(CASOS[k]) < 0) &&
  D.lojas.every((l) => l.cnpj === undefined));
['gp', 'gn'].forEach((q) => {
  const reps = calculaDaPagina(D, 'todos').representantes[q];
  prova(q.toUpperCase() + ': ranking de representantes termina em Sem Representante',
    reps.length > 1 && reps[reps.length - 1].representante === 'Sem Representante' &&
    reps.slice(0, -1).every((g) => g.representante !== 'Sem Representante'), reps.map((g) => g.representante));
  /* representante = soma das lojas + 5 por loja nova cadastrada (30/09) */
  const lojasP = calculaDaPagina(D, 'todos').lojas;
  prova(q.toUpperCase() + ': pontos do representante = lojas + 5 por cadastro novo',
    reps.reduce((t, g) => t + g.pontos, 0) === lojasP.reduce((t, l) => t + l.pontos, 0) + 5 * lojasP.filter((l) => l.nova).length &&
    reps.reduce((t, g) => t + g.lojas, 0) === lojasP.length);
  prova(q.toUpperCase() + ': cada representante, refeito', reps.every((g) => {
    const dele = lojasP.filter((l) => l[q] === g.representante);
    return g.pontos === dele.reduce((t, l) => t + l.pontos, 0) + 5 * dele.filter((l) => l.nova).length;
  }));
});
prova('rankings de usuários: só Lojas novas, sem Total de lojas', scr.indexOf("t: 'Total de lojas'") < 0 &&
  scr.indexOf("{ k: 'novas', t: 'Lojas novas', n: true, h: (g) => nf(g.novas) }") > 0 && scr.indexOf('novas, de ') < 0);
prova('nada de "Arremate" na tela; Recuperações nas colunas e no cartão', (() => {
  const vis = semScript + scr.slice(scr.indexOf('function APP('));
  return ["t: 'Arremates'", "'Arremate / FIPE'", "'Arremate / VMV'", 'pontos por arremate', 'loja arrematante']
    .every((t) => vis.indexOf(t) < 0 && out.html.indexOf(t) < 0) &&
    ["t: 'Recuperações'", 'Recuperação / FIPE', 'Recuperação / VMV'].every((t) => out.html.indexOf(t) > 0);
})());

/* a carteira que não serve derruba o run, nas seis formas */
const caiCom = (plan) => {
  try { roda('montar-painel.js', Object.assign({}, nos, { 'Ler Representantes': plan })); return ''; } catch (e) { return e.message; }
};
const semCol = (col) => planilha.map((it) => {
  const j = Object.assign({}, it.json); delete j[col]; return { json: j };
});
prova('carteira que não veio derruba o run', caiCom([{ json: { error: { message: '404' } } }]).indexOf('nao veio') > 0);
prova('tabela vazia (item vazio do alwaysOutputData) derruba o run', caiCom([{ json: {} }]).indexOf('sem as colunas') > 0);
['GP_Usuario', 'GN_Usuario', 'CNPJ', 'Base_Data'].forEach((col) => {
  prova('carteira sem ' + col + ' derruba o run', caiCom(semCol(col)).indexOf('sem as colunas') > 0);
});
prova('carteira truncada derruba o run', caiCom(planilha.slice(0, 50)).indexOf('abaixo do piso') > 0);
prova('Base_Data fora do formato em toda linha derruba o run', caiCom(planilha.map((it) =>
  ({ json: Object.assign({}, it.json, { Base_Data: '17/08/2026' }) }))).indexOf('Base_Data valida') > 0);

console.log((falhas ? '✗' : '✓') + ' %d provas, %d falha(s)', ok + falhas, falhas);
if (falhas) process.exit(1);
