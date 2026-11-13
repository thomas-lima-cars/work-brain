/* Provas do Mega Evento Fenauto (Cars2You) — sem n8n e sem banco.

     node prova-local.js

   Portadas em 03/11 das provas do Eventos Fenauto C6. Mudou o que mudou no
   painel: identidade da Cars2You (sem a camada nem a logo do C6), a Fenauto
   à esquerda com o título e o subtítulo à direita, os eventos do C6 e do
   IGA da semana, a loja nova pela campanha da Fenauto e o filtro de evento
   em botões. Ficou tudo que provava as contas.
   Em 11/11: a loja nova pela campanha DA OPERAÇÃO do evento ("fenauto <ano>
   c6" e "fenauto <ano> iga") e o filtro de Operação (Todas / C6 / Itaú),
   refeitos aqui por outro caminho (os dias de cada operação como conjunto),
   com cadastros plantados onde a coleta não tem (não há C6 real).
   Em 12/11: os novos lojistas pelos grupos de clientes da campanha (IGA
   148, na prova o 133; C6 69 e 146) com a entrada por operação (cadastro a
   partir de 10/11, ou a volta de quem não comprou nos 6 meses antes), nova
   num evento com a entrada até o dia do fim dele. Provas do SQL (grupos,
   externo, teste, janela de compra, uma passada no access_logs) e a
   recontagem das novas por outro caminho (o último dia e os dias de evento
   de cada operação), com entradas plantadas.
   Em 12/11 (tarde): novos e reativados separados (nova = loja cadastrada
   desde o início da campanha; reativada = loja anterior, a entrada é a
   volta), recontados por outro caminho em todo recorte; e a venda com a
   oferta vencedora sem loja (lançada por usuário interno) nos vendidos.

   Roda os nós de verdade (não cópias) contra a coleta de prova
   (`python coleta_local.py --prova`, VPN: a semana da Fenauto 2025, de
   17/11/2025) e confere o que dá para conferir sem olhar tela. As contas
   que importam — score, corte do período, funil, loja nova, o corte por
   evento — são REFEITAS aqui a partir do dado cru, por outro caminho, e
   comparadas com o que o nó publica. Falha com código 1 se qualquer prova
   cair. */

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
  prova(q.queryName + ': recorte C6 (whitelabel 43) ou IGA (vendedores 594, 598 e 16036)',
    q.sql.indexOf('ew.whitelabel_id = 43') > 0 && q.sql.indexOf('ai.shop_id IN (594,598,16036)') > 0);
  prova(q.queryName + ': a semana em literal, nas duas pontas', q.sql.indexOf("e.start_date_offer < '" + q.meta.semana[1] + "'") > 0 &&
    q.sql.indexOf("e.finish_date_event >= '" + q.meta.semana[0] + "'") > 0, q.meta.semana);
  prova(q.queryName + ': só evento com "fenauto" no nome (09/11)', q.sql.indexOf("e.name LIKE '%fenauto%'") > 0 &&
    q.meta.nome_evento === 'fenauto');
  prova(q.queryName + ': teto de 31 dias de duração (o balde 266)', q.sql.indexOf('DATEDIFF(e.finish_date_event, e.start_date_offer) <= 31') > 0);
  prova(q.queryName + ': acesso sem trava de canal (o IGA vende pelos 5 e 7)', q.sql.indexOf('al.whitelabel_id') < 0);
  /* 12/11: o e-mail entra só no filtro do usuário externo (NOT LIKE), nunca
     na lista de colunas */
  const lista = low.slice(low.indexOf('json_array('), low.indexOf(')) as linhas'));
  prova(q.queryName + ': sem documento de pessoa (o e-mail só filtra, não sai)',
    ['document', 'email', 'phone', 'renavam'].every((p) => lista.indexOf(p) < 0) &&
    ['document', 'phone', 'renavam'].every((p) => low.indexOf(p) < 0) &&
    low.split('email').length === low.split('u.email not like ').length);
  /* placa e chassi saíram em 28/09: nem na consulta */
  prova(q.queryName + ': sem placa nem chassi', low.indexOf('plate') < 0 && low.indexOf('chassi') < 0);
  /* sem representante, sem CNPJ (26/10): no C6 ele era a chave da carteira */
  prova(q.queryName + ': sem CNPJ', low.indexOf('cnpj') < 0);
});
const sqlDe = (n) => itens.find((i) => i.json.queryName === n).json.sql;
/* a semana (03/11): de segunda 00:00 à segunda seguinte, e hoje dentro dela */
(() => {
  const m = itens[0].json.meta;
  const ini = new Date(m.semana[0].slice(0, 10) + 'T00:00:00Z');
  const fim = new Date(m.semana[1].slice(0, 10) + 'T00:00:00Z');
  prova('semana: começa numa segunda, dura 7 dias e contém agora', ini.getUTCDay() === 1 && fim - ini === 7 * 86400000 &&
    m.semana[0].slice(11) === '00:00:00' && m.agora_br >= m.semana[0].slice(0, 16) && m.agora_br < m.semana[1].slice(0, 16), m);
})();
prova('eventos: a operação sai do mesmo critério do recorte (C6 = alveja o 43)',
  sqlDe('eventos').indexOf("CASE WHEN EXISTS (SELECT 1 FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id = 43) THEN 'C6' ELSE 'IGA' END") > 0);
prova('acesso ao evento por evento (03/11): cada parte agrupa pelo evento e traz a coluna',
  PARTES_NOMES.every((n) => sqlDe(n).indexOf('GROUP BY e.id, al.shop_id,') > 0 &&
    itens.find((i) => i.json.queryName === n).json.cols.join() === 'loja,dia,hora,n,evento'));
/* novos lojistas pelos grupos (Thomas, 12/11): a regra inteira na consulta
   de lojas, as duas entradas no universo (uma passada no access_logs) e
   nada da campanha do formulário (a regra de 11/11) */
(() => {
  const m = itens[0].json.meta;
  const sl = sqlDe('lojas');
  const vezes = (t) => sl.split(t).length - 1;
  prova('novos lojistas (12/11): início 10/11/2026, 6 meses sem compra desde 10/05/2026, grupos 148 (IGA) e 69 e 146 (C6), no meta de toda consulta',
    itens.every((it) => JSON.stringify([it.json.meta.inicio_campanha, it.json.meta.sem_compra_desde, it.json.meta.meses_sem_compra,
      it.json.meta.grupos_iga, it.json.meta.grupos_c6]) === JSON.stringify(['2026-11-10 00:00:00', '2026-05-10 00:00:00', 6, [148], [69, 146]]) &&
      it.json.meta.campanha_c6 === undefined && it.json.meta.campanha_iga === undefined && it.json.meta.campanha_novas === undefined), m);
  prova('a janela sem compra sai do início menos 6 meses, calculada (sem a data escrita)',
    ler('montar-consultas.js').indexOf("'2026-05-10") < 0 && ler('montar-consultas.js').indexOf('MESES_SEM_COMPRA = 6;') > 0);
  prova('a regra de 11/11 saiu: nenhuma consulta lê o formulário de cadastro', itens.every((it) =>
    it.json.sql.indexOf('register_form_value') < 0 && it.json.sql.indexOf('user_profiles') < 0));
  prova('clientes: a operação pelo grupo do IGA e o filtro pelos três grupos, uma vez cada',
    vezes("CASE WHEN ucg.client_group_id IN (148) THEN 'IGA' ELSE 'C6' END AS op") === 1 &&
    vezes('WHERE ucg.client_group_id IN (148,69,146)) cg') === 1 && vezes('client_group_id') === 2 &&
    itens.every((it) => it.json.queryName === 'lojas' || it.json.sql.indexOf('client_group') < 0));
  prova('clientes: só usuário externo (sem interno, banco nem teste)', vezes("INNER JOIN users u ON u.id = ucg.user_id AND u.deleted_at IS NULL" +
    " AND u.email NOT LIKE '%@cars2you.com.br' AND u.email NOT LIKE '%@itau%' AND u.email NOT LIKE '%@c6bank%' AND u.email NOT LIKE '%teste%'" +
    ' INNER JOIN user_shops us ON us.user_id = u.id') === 1);
  prova('clientes: loja não apagada e sem teste no nome', vezes("INNER JOIN shops s ON s.id = cg.shop_id AND s.deleted_at IS NULL AND s.name NOT LIKE '%teste%'") === 1);
  prova('clientes: compra = oferta vencedora de negociação vendida, nos 6 meses ANTES do início',
    vezes('SELECT DISTINCT o.buyer_shop_id AS shop_id FROM offers o INNER JOIN advertisement_negotiations an ON an.offer_actual_id = o.id' +
      ' AND an.deleted_at IS NULL AND an.status IN (2, 3, 7) WHERE o.deleted_at IS NULL AND o.buyer_shop_id IS NOT NULL') === 1 &&
    vezes("o.created_at >= '2026-05-10 00:00:00' AND o.created_at < '2026-11-10 00:00:00'") === 1);
  prova('clientes: entrada = o cadastro a partir do início, senão a volta de quem não comprou',
    vezes("DATE_FORMAT(IF(s.created_at >= '2026-11-10 00:00:00', s.created_at, va.volta), '%Y-%m-%d %H:%i') AS entrada") === 1 &&
    vezes("WHERE s.created_at >= '2026-11-10 00:00:00' OR (va.volta IS NOT NULL AND cp.shop_id IS NULL)") === 1);
  prova('access_logs: UMA passada agrupada para a volta, sem subconsulta por loja',
    vezes("(SELECT al.shop_id, MIN(al.created_at) AS volta FROM access_logs al WHERE al.created_at >= '2026-11-10 00:00:00'" +
      ' AND al.shop_id IS NOT NULL GROUP BY al.shop_id) va ON va.shop_id = s.id') === 1 &&
    vezes('access_logs') === 2 && vezes('MIN(al.created_at)') === 1 && sl.indexOf('= s.id)') < 0 &&
    itens.every((it) => it.json.queryName === 'lojas' || it.json.sql.indexOf('MIN(al.created_at)') < 0));
  prova('lojas: o universo carrega as duas entradas (CLIENTES uma vez só), sem CTE',
    sl.indexOf(' FROM (SELECT u0.id, MAX(u0.c6) AS c6, MAX(u0.iga) AS iga FROM (SELECT DISTINCT o.buyer_shop_id AS id, NULL AS c6, NULL AS iga') > 0 &&
    vezes("UNION ALL SELECT f.id, IF(f.op = 'C6', f.entrada, NULL), IF(f.op = 'IGA', f.entrada, NULL) FROM (SELECT cg.op, s.id,") === 1 &&
    vezes('AS entrada') === 1 && sl.indexOf(') u0 GROUP BY u0.id) ids INNER JOIN shops s ON s.id = ids.id') > 0 &&
    sl.indexOf('s.deleted_at IS NOT NULL, ids.c6, ids.iga)) AS linhas') > 0 && sl.toUpperCase().indexOf('WITH ') < 0);
  const cl = itens.find((i) => i.json.queryName === 'lojas').json.cols;
  prova('lojas: fenauto_c6 e fenauto_iga (a entrada de cada operação) no lugar de fenauto', cl.indexOf('fenauto_c6') > 0 && cl.indexOf('fenauto_iga') > 0 &&
    cl.indexOf('fenauto') < 0, cl);
  prova('coleta_local.py: na prova troca início, janela sem compra e o grupo do IGA (148 -> 133), conferindo no SQL', (() => {
    const py = ler('coleta_local.py');
    return py.indexOf('"inicio_campanha": "2025-11-10 00:00:00", "sem_compra_desde": "2025-05-10 00:00:00"') > 0 &&
      py.indexOf('GRUPOS_IGA_PROVA = [133]') > 0 && py.indexOf('" fora do SQL"') > 0 && py.indexOf('"grupo fora do SQL: "') > 0 &&
      py.indexOf('campanha_c6') < 0 && py.indexOf('"fenauto 2025" in') > 0;
  })());
})();
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
   A coleta DE PROVA (dados-prova.json, 03/11): o mesmo SQL com a semana da
   Fenauto 2025 (17/11/2025). A semana de 03/11/2026 abriu com dois eventos
   do C6, nenhum do IGA e nenhum cadastro da campanha, e conta refeita sobre
   zero não prova nada. Sem fallback para a coleta do C6: o SQL é outro. */
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
  return JSON.parse(s.slice(0, s.lastIndexOf(');')));
};
const scr = out.html.slice(out.html.indexOf('<script>') + 8);
/* a calcula() que está DENTRO do HTML publicado, e não uma cópia */
const calculaDaPagina = new Function(scr.slice(0, scr.indexOf('function APP(')) + 'return calcula;')();
const D0 = dadosDe(out.html);

prova('um veículo por negociação da coleta', R.veiculos === cru.veiculos.length, [R.veiculos, cru.veiculos.length]);
/* lance sem loja compradora fica fora das contas e vira aviso (03/11) */
const semLoja = cru.ofertas.filter((o) => o.loja === null).length;
prova('todo lance com loja entra na conta; o sem loja vira aviso', R.kpi.lances === cru.ofertas.length - semLoja &&
  (semLoja === 0 || R.avisos.indexOf(semLoja + ' lance(s) sem loja compradora (lançado por usuário interno) — fora dos lances e dos rankings; se venceu, a venda conta nos vendidos') >= 0), [R.kpi.lances, cru.ofertas.length, semLoja]);
/* as contas de lance da tela usam só os com loja; o score e o farol do
   veículo, todos (o lance existe, só não tem de quem) */
const ofCom = cru.ofertas.filter((o) => o.loja !== null);
prova('com + sem oferta = publicados', R.kpi.com_oferta + R.kpi.sem_oferta === R.kpi.publicados);
const somaEv = (f) => R.por_evento.reduce((t, e) => t + e.kpi[f], 0);
['publicados', 'vendidos', 'lances', 'com_oferta', 'vmv_atingido'].forEach((f) =>
  prova('soma dos eventos = total: ' + f + (f === 'lances' ? '' : ' (12/11: o carro em dois eventos conta uma vez no total, então ≥)'),
    f === 'lances' ? somaEv(f) === R.kpi[f] : somaEv(f) >= R.kpi[f], [somaEv(f), R.kpi[f]]));
/* um veículo só (12/11): o carro, não a negociação */
const veicDaNeg = {};
cru.veiculos.forEach((v) => { veicDaNeg[v.neg] = v.veiculo; });
prova('publicados = carros distintos da coleta (o mesmo carro em dois eventos conta uma vez)',
  R.kpi.publicados === new Set(cru.veiculos.map((v) => v.veiculo)).size, [R.kpi.publicados, new Set(cru.veiculos.map((v) => v.veiculo)).size, cru.veiculos.length]);
const vendCru = new Set(cru.veiculos.filter((v) => [2, 3, 7].indexOf(Number(v.status)) >= 0).map((v) => v.veiculo)).size;
prova('vendidos = status 2, 3 e 7 na coleta', R.kpi.vendidos === vendCru, [R.kpi.vendidos, vendCru]);
/* 12/11: venda cuja oferta vencedora não tem loja (lançada por usuário
   interno, 516768 do evento 24377 do IGA em 11/11) conta nos vendidos e no
   valor, não nos compradores nem nos lances — planta tirando a loja da
   vencedora de uma venda; com Data, a venda segue no dia da oferta
   vencedora; com Operação, na operação do evento dela */
(() => {
  const ofP = {};
  cru.ofertas.forEach((o) => { ofP[o.id] = o; });
  const vend = cru.veiculos.find((v) => [2, 3, 7].indexOf(Number(v.status)) >= 0 && v.vencedora !== null &&
    ofP[v.vencedora] && ofP[v.vencedora].loja !== null);
  const sint = JSON.parse(JSON.stringify(d));
  const iO = NOMES.indexOf('ofertas');
  const cols = sint.consultas[iO].json.cols;
  const row = sint.mcp[iO].json.structuredContent.rows[0];
  const linhas = JSON.parse(row[1]);
  const alvo = linhas.find((a) => Number(a[cols.indexOf('id')]) === Number(vend.vencedora));
  alvo[cols.indexOf('loja')] = null;
  row[1] = JSON.stringify(linhas);
  const o = roda('montar-painel.js', Object.assign({}, nos, { 'MCP Consultas': sint.mcp }))[0].json;
  const Ds = dadosDe(o.html);
  const q = String(ofP[vend.vencedora].quando);
  const cod = q.slice(2, 4) + q.slice(5, 7) + q.slice(8, 10);
  const D0v = dadosDe(out.html);
  const opV = cru.eventos.find((e) => Number(e.id) === Number(vend.evento)).op;
  prova('venda com a oferta vencedora sem loja: conta nos vendidos e no valor, fora dos lances; com Data, no dia da vencedora; com Operação, na dela',
    o.resumo.kpi.vendidos === R.kpi.vendidos && o.resumo.kpi.volume === R.kpi.volume && o.resumo.kpi.lances === R.kpi.lances - 1 &&
    o.resumo.kpi.compradores <= R.kpi.compradores && Ds.veiculos.some((v) => v.neg === Number(vend.neg) && v.arrematante === null) &&
    calculaDaPagina(Ds, 'todos', { dia: cod }).kpi.vendidos === calculaDaPagina(D0v, 'todos', { dia: cod }).kpi.vendidos &&
    calculaDaPagina(Ds, 'todos', { dia: cod }).kpi.vendidos > 0 &&
    calculaDaPagina(Ds, 'todos', { op: opV }).kpi.vendidos === calculaDaPagina(D0v, 'todos', { op: opV }).kpi.vendidos &&
    o.resumo.avisos.some((a) => a.indexOf((semLoja + 1) + ' lance(s) sem loja compradora (lançado por usuário interno)') === 0),
    [o.resumo.kpi.vendidos, R.kpi.vendidos, o.resumo.kpi.lances, R.kpi.lances, cod, opV]);
})();
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
const partCru = new Set(ofCom.map((o) => o.loja + '|' + veicDaNeg[o.neg])).size;
prova('participações = pares (loja, veículo) distintos', R.kpi.participacoes === partCru, [R.kpi.participacoes, partCru]);
prova('lances/lojista e participações/lojista dividem pelos ofertantes',
  Math.abs(R.kpi.lances_por_lojista - ofCom.length / lojasCru) < 1e-9 &&
  Math.abs(R.kpi.part_por_lojista - partCru / lojasCru) < 1e-9);

/* medição independente de 2026-11-03 (consulta à parte, antes do nó
   rodar): veículos publicados e operação de cada evento da semana da
   Fenauto 2025. Encerrados, não mudam mais. TODOS têm que estar na coleta:
   um evento que sumisse do recorte seria um evento a menos, calado.
   Desde 09/11 só os com Fenauto no nome: dos 11 da semana, o 22231
   ("Evento Exclusivo C6 Auto - FENAUTO 2025") e o 22223 ("VD IGA
   exclusivo Fenauto"). Os outros 9 têm que ficar de fora. */
const MEDIDO = { 22231: [54, 'C6'], 22223: [24, 'IGA'] };
const MEDIDO_SEM_FENAUTO = [22212, 22227, 22228, 22229, 22235, 22241, 22237, 22242, 22248];
prova('coleta de prova: os 2 eventos da Fenauto medidos, nem um a mais', R.por_evento.length === 2 &&
  Object.keys(MEDIDO).every((id) => R.por_evento.some((x) => x.id === Number(id))), R.por_evento.map((x) => x.id));
prova('coleta de prova: os 9 eventos da semana sem Fenauto no nome ficam de fora',
  MEDIDO_SEM_FENAUTO.every((id) => R.por_evento.every((x) => x.id !== id)));
prova('coleta de prova: todo evento tem Fenauto no nome', cru.eventos.every((e) => e.nome.toLowerCase().indexOf('fenauto') >= 0));
prova('o balde 266 "Anúncios cancelados" (2021 a 2025) fica de fora', R.por_evento.every((x) => x.id !== 266));
Object.keys(MEDIDO).forEach((id) => {
  const e = R.por_evento.find((x) => x.id === Number(id));
  const ev = cru.eventos.find((x) => Number(x.id) === Number(id));
  const m = MEDIDO[id];
  prova('evento ' + id + ' bate com a medição independente', !!e && e.kpi.publicados === m[0] && ev.op === m[1],
    [e && e.kpi.publicados, ev && ev.op, 'medido', m]);
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
const diasNoPeriodo = (per, ok, soEv) => {
  const dias = {};
  acessosCru.forEach((a) => {
    if (!dentro(a, per) || (ok && !ok(a.loja)) || (soEv && soEv.indexOf(Number(a.evento)) < 0)) return;
    (dias[a.loja] = dias[a.loja] || {})[a.dia] = 1;
  });
  const n = {};
  Object.keys(dias).forEach((k) => { n[k] = Object.keys(dias[k]).length; });
  return n;
};
const eventosCru = cru.eventos.map((e) => ({ id: Number(e.id), ini: e.ini, fim: e.fim, op: e.op }));
const perTodos = periodoDe(eventosCru);
const diasTodos = diasNoPeriodo(perTodos);
const lojaCru = {};
cru.lojas.forEach((l) => { lojaCru[l.id] = l; });
/* novos lojistas (Thomas, 12/11; por operação desde 11/11): a loja tem uma
   ENTRADA por operação (fenauto_c6, fenauto_iga — o cadastro a partir do
   início ou a volta de quem não comprou) e é nova num evento da operação
   dela quando o dia da entrada é até o dia do fim dele. O nó testa evento a
   evento com comparação de texto; aqui é por outro caminho: de cada
   operação, o ÚLTIMO dia de evento (sem Data) e o CONJUNTO dos dias de
   evento enumerados um a um (com Data: a entrada daquele dia, num dia de
   evento da operação). */
const diasDoEvento = (e) => {
  const out = [];
  const dt = new Date(e.ini.slice(0, 10) + 'T00:00:00Z');
  for (let i = 0; i < 40 && dt.toISOString().slice(0, 10) <= e.fim.slice(0, 10); i++) {
    out.push(dt.toISOString().slice(0, 10));
    dt.setUTCDate(dt.getUTCDate() + 1);
  }
  return out;
};
const COL_ENTRADA = { C6: 'fenauto_c6', IGA: 'fenauto_iga' };
const novaCru = (evs, soDia, base) => {
  const ultimo = {};
  const diasOp = { C6: new Set(), IGA: new Set() };
  evs.forEach((e) => {
    const f = e.fim.slice(0, 10);
    if (!ultimo[e.op] || f > ultimo[e.op]) ultimo[e.op] = f;
    diasDoEvento(e).forEach((x) => diasOp[e.op].add(x));
  });
  return (base || cru.lojas).filter((l) => !Number(l.apagada) && ['C6', 'IGA'].some((op) => {
    const c = l[COL_ENTRADA[op]];
    if (!c || !ultimo[op]) return false;
    const dd = c.slice(0, 10);
    return soDia ? dd === soDia && diasOp[op].has(dd) : dd <= ultimo[op];
  }));
};
const temEntrada = (l) => !!(l.fenauto_c6 || l.fenauto_iga);
const evC6Real = eventosCru.find((e) => e.op === 'C6');
const evIGAReal = eventosCru.find((e) => e.op === 'IGA');
const META_P = d.consultas[0].json.meta;
const sqlProvaLojas = () => d.consultas.find((c) => c.json.queryName === 'lojas').json.sql;
const INICIO_P = META_P.inicio_campanha.slice(0, 16);
const novasTodos = novaCru(eventosCru);
/* 12/11 (tarde): separadas — nova = loja cadastrada desde o início da
   campanha; reativada = loja anterior a ele (a entrada é a volta). O
   cadastro é da loja: o tipo é o mesmo nas duas operações */
const ehReat = (l) => String(l.cadastro || '') < INICIO_P;
const novaCruN = (evs, soDia, base) => novaCru(evs, soDia, base).filter((l) => !ehReat(l));
const novaCruR = (evs, soDia, base) => novaCru(evs, soDia, base).filter(ehReat);
const cadTodos = novasTodos.filter((l) => !ehReat(l));
const reatTodos = novasTodos.filter(ehReat);
const ehNovaT = {};
novasTodos.forEach((l) => { ehNovaT[l.id] = ehReat(l) ? 'R' : 'N'; });
const nTot = (k) => k.novas + k.reativadas;
const ids = (lista) => lista.map((l) => Number(l.id)).sort((a, b) => a - b);
const idsNova = (r) => Object.keys(r.nova).map(Number).sort((a, b) => a - b);
prova('coleta de prova: a regra no ano da prova (início 10/11/2025, sem compra desde 10/05/2025, grupo do IGA 133, os do C6 ficam)',
  d.consultas.every((c) => JSON.stringify([c.json.meta.inicio_campanha, c.json.meta.sem_compra_desde, c.json.meta.grupos_iga, c.json.meta.grupos_c6]) ===
    JSON.stringify(['2025-11-10 00:00:00', '2025-05-10 00:00:00', [133], [69, 146]])) &&
  sqlProvaLojas().indexOf('client_group_id IN (133,69,146))') > 0 && sqlProvaLojas().indexOf("'2026-11-10") < 0, META_P);
prova('coleta: toda entrada é a partir do início; loja nascida desde o início entra pelo cadastro, a antiga pela volta',
  cru.lojas.filter(temEntrada).length > 0 && cru.lojas.every((l) => ['C6', 'IGA'].every((op) => {
    const c = l[COL_ENTRADA[op]];
    if (!c) return true;
    return c >= INICIO_P && (l.cadastro >= INICIO_P ? c === l.cadastro : c > l.cadastro);
  })));
prova('coleta: há cliente das duas operações, novas e antigas que voltaram', ['C6', 'IGA'].every((op) => {
  const c = cru.lojas.filter((l) => l[COL_ENTRADA[op]]);
  return c.some((l) => l.cadastro >= INICIO_P) && c.some((l) => l.cadastro < INICIO_P);
}));
prova('lojas novas = entrada da operação até o fim de um evento dela, refeitas por outro caminho; separadas em novas e reativadas',
  R.kpi.novas === cadTodos.length && R.kpi.reativadas === reatTodos.length && cadTodos.length > 0 && reatTodos.length > 0 &&
  JSON.stringify(calculaDaPagina(D0, 'todos', {}).lojas.filter((r) => r.nova).map((r) => r.loja).sort((a, b) => a - b)) ===
  JSON.stringify(ids(novasTodos)) &&
  JSON.stringify(calculaDaPagina(D0, 'todos', {}).lojas.filter((r) => r.nova === 'R').map((r) => r.loja).sort((a, b) => a - b)) ===
  JSON.stringify(ids(reatTodos)), [R.kpi.novas, cadTodos.length, R.kpi.reativadas, reatTodos.length]);
prova('reativada: tem entrada, loja anterior ao início da campanha e entrada depois do cadastro', D0.lojas.filter((l) => l.reativada).length ===
  cru.lojas.filter((l) => temEntrada(l) && ehReat(l)).length && D0.lojas.filter((l) => l.reativada).length > 0 &&
  D0.lojas.every((l) => !l.reativada || ['fenauto_c6', 'fenauto_iga'].every((c) => !l[c] || l[c] > l.cadastro)) &&
  D0.lojas.every((l) => l.reativada === (temEntrada(l) && ehReat(l))));
prova('o tipo é da loja: cliente das duas operações tem o mesmo tipo nos dois eventos', (() => {
  const duas = novasTodos.filter((l) => l.fenauto_c6 && l.fenauto_iga);
  const rc = calculaDaPagina(D0, evC6Real.id, {});
  const ri = calculaDaPagina(D0, evIGAReal.id, {});
  return duas.every((l) => (!rc.nova[l.id] || rc.nova[l.id] === ehNovaT[l.id]) && (!ri.nova[l.id] || ri.nova[l.id] === ehNovaT[l.id]));
})());
prova('loja nova evento a evento: cada um com as entradas até o fim dele', R.por_evento.every((e) =>
  e.kpi.novas === novaCruN(eventosCru.filter((x) => x.id === e.id)).length &&
  e.kpi.reativadas === novaCruR(eventosCru.filter((x) => x.id === e.id)).length) &&
  R.por_evento.every((e) => JSON.stringify(idsNova(calculaDaPagina(D0, e.id, {}))) === JSON.stringify(ids(novaCru(eventosCru.filter((x) => x.id === e.id))))),
  R.por_evento.map((e) => [e.id, e.kpi.novas, e.kpi.reativadas]));
prova('coleta: todo evento toca a semana dela e dura no máximo 31 dias', cru.eventos.every((e) =>
  e.ini < d.consultas[0].json.meta.semana[1].slice(0, 16) && e.fim >= d.consultas[0].json.meta.semana[0].slice(0, 16) &&
  (new Date(e.fim.slice(0, 10)) - new Date(e.ini.slice(0, 10))) / 86400000 <= 31));
prova('coleta: há evento do C6 e do IGA', ['C6', 'IGA'].every((op) => cru.eventos.some((e) => e.op === op)));
prova('coleta: entrada depois do fim dos eventos da operação não é nova (as de 2026 na semana de prova)', (() => {
  const fora = cru.lojas.filter((l) => temEntrada(l) && !ehNovaT[l.id] && !Number(l.apagada));
  return fora.length > 0 && fora.every((l) => ['C6', 'IGA'].every((op) => !l[COL_ENTRADA[op]] ||
    eventosCru.filter((e) => e.op === op).every((e) => l[COL_ENTRADA[op]].slice(0, 10) > e.fim.slice(0, 10))));
})());
prova('coleta: loja antiga que voltou sem compra é nova (vale a volta, não o cadastro)',
  novasTodos.some((l) => l.cadastro < INICIO_P), novasTodos.filter((l) => l.cadastro < INICIO_P).length);
prova('coleta: loja sem entrada em nenhuma operação nunca é nova', cru.lojas.some((l) => !temEntrada(l)) &&
  calculaDaPagina(D0, 'todos', {}).lojas.filter((r) => r.nova).every((r) => temEntrada(cru.lojas.find((l) => Number(l.id) === r.loja))));
/* sem piso no início do evento: quem entrou entre 10/11 e o primeiro dia
   conta no total — e em nenhum botão de Data */
(() => {
  const primeiro = eventosCru.map((e) => e.ini.slice(0, 10)).sort()[0];
  const antes = novasTodos.filter((l) => ['C6', 'IGA'].some((op) => l[COL_ENTRADA[op]] && l[COL_ENTRADA[op]].slice(0, 10) < primeiro));
  const t = calculaDaPagina(D0, 'todos', {});
  const porDia = t.dias_periodo.map((c) => calculaDaPagina(D0, 'todos', { dia: c }));
  const soAntes = antes.filter((l) => ['C6', 'IGA'].every((op) => !l[COL_ENTRADA[op]] || l[COL_ENTRADA[op]].slice(0, 10) < primeiro));
  prova('coleta: entrada antes do 1º dia do evento conta no total e em nenhum botão de Data', soAntes.length > 0 &&
    soAntes.every((l) => t.nova[l.id] && porDia.every((r) => !r.nova[l.id])), [antes.length, soAntes.length]);
  prova('Data: cada dia com as entradas daquele dia num dia de evento da operação, refeitas', t.dias_periodo.every((c, i) => {
    const dia = '20' + c.slice(0, 2) + '-' + c.slice(2, 4) + '-' + c.slice(4, 6);
    return JSON.stringify(idsNova(porDia[i])) === JSON.stringify(ids(novaCru(eventosCru, dia))) && porDia[i].kpi.novas === porDia[i].funil[0][1] &&
      porDia[i].kpi.novas === novaCruN(eventosCru, dia).length && porDia[i].kpi.reativadas === novaCruR(eventosCru, dia).length;
  }) && porDia.some((r) => r.kpi.novas > 0));
})();
/* o cliente de uma operação não vira novo no evento da outra que corre nos
   MESMOS dias (19 a 21/11/2025) */
(() => {
  const c6 = eventosCru.find((e) => e.op === 'C6');
  const iga = eventosCru.find((e) => e.op === 'IGA');
  const rc = calculaDaPagina(D0, c6.id, {});
  const ri = calculaDaPagina(D0, iga.id, {});
  const soIGA = cru.lojas.filter((l) => l.fenauto_iga && !l.fenauto_c6 && l.fenauto_iga.slice(0, 10) <= c6.fim.slice(0, 10) && !Number(l.apagada));
  const soC6 = cru.lojas.filter((l) => l.fenauto_c6 && !l.fenauto_iga && l.fenauto_c6.slice(0, 10) <= iga.fim.slice(0, 10) && !Number(l.apagada));
  prova('coleta: cliente só do IGA, com entrada até o fim do evento do C6, não é novo no C6, e é no IGA',
    soIGA.length > 0 && soIGA.every((l) => !rc.nova[l.id] && !!ri.nova[l.id]), soIGA.length);
  prova('coleta: cliente só do C6, com entrada até o fim do evento do IGA, não é novo no IGA, e é no C6',
    soC6.length > 0 && soC6.every((l) => !ri.nova[l.id] && !!rc.nova[l.id]), soC6.length);
})();

/* ── 3a. entradas plantadas (12/11) ──────────────────────────────────
   Planta, em lojas sem entrada nenhuma:
     p0  C6 no 1º dia do evento do C6          -> nova só no evento do C6
     p1  C6 às 23:59 do último dia do C6       -> nova no C6 (o dia é inteiro)
     p2  C6 às 00:01 do dia seguinte           -> nova em lugar nenhum
     p3  IGA às 23:59 do último dia do IGA     -> nova no IGA
     p4  IGA às 00:01 do dia seguinte          -> nova em lugar nenhum
     p5  C6 e IGA, os dois no 1º dia           -> nova nos dois
     p6  C6 no 1º dia, mas loja apagada        -> nova em lugar nenhum
     p7  C6 no dia do início da campanha       -> nova no C6, sem botão de Data
     p8  IGA dois dias antes do 1º dia         -> nova no IGA, sem botão de Data
   e confere cada recorte (Todos, cada evento, cada Operação, Operação +
   evento, Data) contra a conta por outro caminho (novaCru). */
const proxDia = (x) => new Date(Date.UTC(Number(x.slice(0, 4)), Number(x.slice(5, 7)) - 1, Number(x.slice(8, 10)) + 1)).toISOString().slice(0, 10);
const diaAntesDe = (x, n) => new Date(Date.UTC(Number(x.slice(0, 4)), Number(x.slice(5, 7)) - 1, Number(x.slice(8, 10)) - n)).toISOString().slice(0, 10);
const evC6 = eventosCru.find((e) => e.op === 'C6');
const evIGA = eventosCru.find((e) => e.op === 'IGA');
const plantado = (() => {
  const sint = JSON.parse(JSON.stringify(d));
  const iL = NOMES.indexOf('lojas');
  const cols = sint.consultas[iL].json.cols;
  const row = sint.mcp[iL].json.structuredContent.rows[0];
  const linhas = JSON.parse(row[1]);
  const c6 = cols.indexOf('fenauto_c6');
  const ig = cols.indexOf('fenauto_iga');
  const ap = cols.indexOf('apagada');
  const livres = linhas.filter((a) => !a[c6] && !a[ig] && !Number(a[ap])).slice(0, 9);
  const ultC6 = evC6.fim.slice(0, 10);
  const ultIGA = evIGA.fim.slice(0, 10);
  livres[0][c6] = evC6.ini.slice(0, 10) + ' 11:00';
  livres[1][c6] = ultC6 + ' 23:59';
  livres[2][c6] = proxDia(ultC6) + ' 00:01';
  livres[3][ig] = ultIGA + ' 23:59';
  livres[4][ig] = proxDia(ultIGA) + ' 00:01';
  livres[5][c6] = evC6.ini.slice(0, 10) + ' 10:30';
  livres[5][ig] = evIGA.ini.slice(0, 10) + ' 10:30';
  livres[6][c6] = evC6.ini.slice(0, 10) + ' 12:00';
  livres[6][ap] = 1;
  livres[7][c6] = INICIO_P.slice(0, 10) + ' 00:00';
  livres[8][ig] = diaAntesDe(evIGA.ini.slice(0, 10), 2) + ' 15:00';
  row[1] = JSON.stringify(linhas);
  const o = roda('montar-painel.js', Object.assign({}, nos, { 'MCP Consultas': sint.mcp }))[0].json;
  const lojasS = linhas.map((a) => { const x = {}; cols.forEach((k, j) => { x[k] = a[j]; }); return x; });
  return { o: o, D: dadosDe(o.html), lojas: lojasS, id: livres.map((a) => Number(a[cols.indexOf('id')])) };
})();
(() => {
  const Ds = plantado.D;
  const id = plantado.id;
  const esperado = (evs, soDia) => ids(novaCru(evs, soDia, plantado.lojas));
  const rT = calculaDaPagina(Ds, 'todos', {});
  const rC6 = calculaDaPagina(Ds, evC6.id, {});
  const rIGA = calculaDaPagina(Ds, evIGA.id, {});
  const oC6 = calculaDaPagina(Ds, 'todos', { op: 'C6' });
  const oIGA = calculaDaPagina(Ds, 'todos', { op: 'IGA' });
  const realC6 = nTot(calculaDaPagina(D0, 'todos', { op: 'C6' }).kpi);
  const realIGA = nTot(calculaDaPagina(D0, 'todos', { op: 'IGA' }).kpi);
  prova('plantas: as 9 lojas são distintas, os dias seguintes caem fora de todo evento, p7 e p8 antes do 1º dia e os eventos fecham antes das 23:59',
    new Set(id).size === 9 && [proxDia(evC6.fim.slice(0, 10)), proxDia(evIGA.fim.slice(0, 10))].every((x) =>
      eventosCru.every((e) => diasDoEvento(e).indexOf(x) < 0)) && evC6.fim.slice(11) < '23:59' && evIGA.fim.slice(11) < '23:59' &&
    INICIO_P.slice(0, 10) < evC6.ini.slice(0, 10) && diaAntesDe(evIGA.ini.slice(0, 10), 2) >= INICIO_P.slice(0, 10));
  prova('entrada do C6 só vale em evento do C6 (mesmos dias do IGA)', !!rC6.nova[id[0]] && !rIGA.nova[id[0]] &&
    diasDoEvento(evC6).join() === diasDoEvento(evIGA).join());
  prova('entrada do IGA só vale em evento do IGA', !!rIGA.nova[id[3]] && !rC6.nova[id[3]] && !!rIGA.nova[id[8]] && !rC6.nova[id[8]]);
  prova('C6: 23:59 do último dia entra, 00:01 do seguinte não', !!rC6.nova[id[1]] && !rT.nova[id[2]] && !rC6.nova[id[2]]);
  prova('IGA: 23:59 do último dia entra, 00:01 do seguinte não', !!rIGA.nova[id[3]] && !rT.nova[id[4]] && !rIGA.nova[id[4]]);
  prova('loja com entrada nas duas operações é nova nos dois eventos', !!rC6.nova[id[5]] && !!rIGA.nova[id[5]] && !!rT.nova[id[5]]);
  prova('loja apagada com entrada não é nova', !rT.nova[id[6]] && !rC6.nova[id[6]]);
  prova('sem piso no início do evento: entrada no dia do início da campanha e antes do 1º dia conta', !!rC6.nova[id[7]] && !!rT.nova[id[7]] &&
    !!rIGA.nova[id[8]] && !!rT.nova[id[8]]);
  prova('Todos: nova em algum evento, refeita por outro caminho', JSON.stringify(idsNova(rT)) === JSON.stringify(esperado(eventosCru)) &&
    nTot(rT.kpi) === nTot(R.kpi) + 6 && plantado.o.resumo.kpi.novas === rT.kpi.novas && plantado.o.resumo.kpi.reativadas === rT.kpi.reativadas,
    [nTot(rT.kpi), nTot(R.kpi)]);
  prova('plantas: cada uma nova ou reativada pelo cadastro da loja, o mesmo tipo em todo recorte', [0, 1, 3, 5, 7, 8].every((k) => {
    const t = ehReat(plantado.lojas.find((l) => Number(l.id) === id[k])) ? 'R' : 'N';
    return rT.nova[id[k]] === t && [rC6, rIGA].every((r) => !r.nova[id[k]] || r.nova[id[k]] === t);
  }) && JSON.stringify(ids(novaCruR(eventosCru, null, plantado.lojas))) === JSON.stringify(idsNova(rT).filter((x) => rT.nova[x] === 'R')) &&
    rT.kpi.novas === novaCruN(eventosCru, null, plantado.lojas).length && rT.kpi.reativadas === novaCruR(eventosCru, null, plantado.lojas).length);
  prova('cada evento: as novas dele, refeitas por outro caminho', JSON.stringify(idsNova(rC6)) === JSON.stringify(esperado([evC6])) &&
    JSON.stringify(idsNova(rIGA)) === JSON.stringify(esperado([evIGA])) && nTot(rC6.kpi) === realC6 + 4 && nTot(rIGA.kpi) === realIGA + 3,
    [nTot(rC6.kpi), realC6, nTot(rIGA.kpi), realIGA]);
  prova('Operação C6: os clientes do C6 (os reais + p0, p1, p5, p7), sem os do IGA', JSON.stringify(idsNova(oC6)) === JSON.stringify(esperado(eventosCru.filter((e) => e.op === 'C6'))) &&
    [0, 1, 5, 7].every((k) => !!oC6.nova[id[k]]) && [3, 8].every((k) => !oC6.nova[id[k]]) && nTot(oC6.kpi) === realC6 + 4);
  prova('Operação Itaú: os clientes do IGA (os reais + p3, p5, p8), sem os do C6', JSON.stringify(idsNova(oIGA)) === JSON.stringify(esperado(eventosCru.filter((e) => e.op === 'IGA'))) &&
    [3, 5, 8].every((k) => !!oIGA.nova[id[k]]) && [0, 1, 7].every((k) => !oIGA.nova[id[k]]) && nTot(oIGA.kpi) === realIGA + 3);
  prova('Operação + evento da mesma operação = só o evento', JSON.stringify(calculaDaPagina(Ds, evC6.id, { op: 'C6' }).kpi) === JSON.stringify(rC6.kpi));
  prova('funil e KPI acompanham as novas da operação (o funil só com as cadastradas)', oC6.funil[0][1] === oC6.kpi.novas &&
    oC6.lojas.filter((r) => r.nova === 'N').length === oC6.kpi.novas && oC6.lojas.filter((r) => r.nova === 'R').length === oC6.kpi.reativadas &&
    oIGA.funil[0][1] === oIGA.kpi.novas && oIGA.lojas.filter((r) => r.nova === 'R').length === oIGA.kpi.reativadas);
  const dia1 = evC6.ini.slice(2, 4) + evC6.ini.slice(5, 7) + evC6.ini.slice(8, 10);
  const dDia = calculaDaPagina(Ds, 'todos', { op: 'C6', dia: dia1 });
  prova('Operação C6 + Data do 1º dia: só as entradas do C6 daquele dia (p0, p5; p7 não)',
    !!dDia.nova[id[0]] && !!dDia.nova[id[5]] && !dDia.nova[id[7]] && !dDia.nova[id[3]] &&
    JSON.stringify(idsNova(dDia)) === JSON.stringify(esperado([evC6], evC6.ini.slice(0, 10))));
  prova('p7 e p8 (entrada antes do 1º dia) em nenhum botão de Data', rT.dias_periodo.every((c) => {
    const r = calculaDaPagina(Ds, 'todos', { dia: c });
    return !r.nova[id[7]] && !r.nova[id[8]];
  }));
  prova('resumo por operação = calcula com a Operação', plantado.o.resumo.por_operacao.length === 2 &&
    plantado.o.resumo.por_operacao.every((x) => x.kpi.novas === calculaDaPagina(Ds, 'todos', { op: x.op }).kpi.novas));
  /* Data num dia que só existe por causa da OUTRA operação: o C6 passa a
     abrir em 20/11 numa cópia; no botão de 19/11 (do IGA) a entrada do C6
     de 19/11 (p0) não conta, e no total conta */
  (() => {
    const Ds2 = JSON.parse(JSON.stringify(Ds));
    const ini2 = proxDia(evC6.ini.slice(0, 10)) + ' 09:00';
    Ds2.eventos.find((e) => e.id === evC6.id).ini = ini2;
    const evs2 = eventosCru.map((e) => (e.id === evC6.id ? Object.assign({}, e, { ini: ini2 }) : e));
    const c19 = evC6.ini.slice(2, 4) + evC6.ini.slice(5, 7) + evC6.ini.slice(8, 10);
    const r19 = calculaDaPagina(Ds2, 'todos', { dia: c19 });
    prova('Data num dia fora do evento da operação: a entrada daquele dia não conta nele, e conta no total',
      !r19.nova[id[0]] && !!r19.nova[id[5]] && !!calculaDaPagina(Ds2, 'todos', {}).nova[id[0]] &&
      JSON.stringify(idsNova(r19)) === JSON.stringify(esperado(evs2, evC6.ini.slice(0, 10))));
  })();
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
prova('ranking = quem ofertou ∪ lojas novas ∪ quem acessou um evento na janela', todosPag.lojas.length === new Set(
  ofCom.map((o) => String(o.loja)).concat(novasTodos.map((l) => String(l.id)), Object.keys(diasTodos).filter((k) => diasTodos[k] > 0))).size);
prova('toda loja nova está no ranking, com ou sem acesso', novasTodos.every((l) => todosPag.lojas.some((r) => r.loja === l.id && r.nova)) &&
  todosPag.lojas.filter((r) => r.nova).length === novasTodos.length);

/* um evento: o período encolhe para o dele, e os acessos junto */
const evMaior = R.por_evento.slice().sort((a, b) => b.kpi.publicados - a.kpi.publicados)[0];
const evCru = eventosCru.find((e) => e.id === evMaior.id);
const diasEv = diasNoPeriodo([evCru.ini, evCru.fim], null, [evCru.id]);
const ev1 = calculaDaPagina(D0, evCru.id, {});
prova('evento ' + evCru.id + ': dias com acesso cortados no horário do evento',
  ev1.lojas.every((r) => r.acessos === (diasEv[r.loja] || 0)) && ev1.kpi.lojas_acessaram === Object.keys(diasEv).length,
  [ev1.kpi.lojas_acessaram, Object.keys(diasEv).length]);
prova('evento ' + evCru.id + ': período = início → fim dele', ev1.periodo[0] === evCru.ini && ev1.periodo[1] === evCru.fim);

/* o filtro de evento (03/11): dois eventos no mesmo horário, um do C6 e um
   do IGA — o 22231 e o 22223, os dois de 19 a 21/11/2025. Cada um conta só
   os acessos registrados com o id dele. Sem o evento no pacote, um levaria
   os acessos do outro na mesma hora */
(() => {
  const c6 = eventosCru.find((e) => e.id === 22231);
  const iga = eventosCru.find((e) => e.id === 22223);
  const so = (e) => diasNoPeriodo([e.ini, e.fim], null, [e.id]);
  const juntos = diasNoPeriodo([c6.ini, c6.fim], null, [c6.id, iga.id]);
  const rc = calculaDaPagina(D0, c6.id, {});
  const ri = calculaDaPagina(D0, iga.id, {});
  prova('evento C6 e IGA no mesmo horário: cada um com os acessos dele, refeitos do cru',
    rc.kpi.lojas_acessaram === Object.keys(so(c6)).length && ri.kpi.lojas_acessaram === Object.keys(so(iga)).length &&
    Object.keys(juntos).length > Math.max(rc.kpi.lojas_acessaram, ri.kpi.lojas_acessaram),
    [rc.kpi.lojas_acessaram, ri.kpi.lojas_acessaram, Object.keys(juntos).length]);
  prova('evento: os gráficos por dia e por hora também cortados pelo evento', rc.por_dia.every((x) => x.total <=
    Object.keys(so(c6)).length) && rc.kpi.acessos < calculaDaPagina(D0, 'todos', {}).kpi.acessos);
  prova('evento: veículos, lances e novos só dele', rc.veiculos.every((v) => v.ev === c6.id) &&
    rc.kpi.lances === ofCom.filter((o) => cru.veiculos.some((v) => v.neg === o.neg && Number(v.evento) === c6.id)).length &&
    rc.kpi.novas === novaCruN([c6]).length && ri.kpi.novas === novaCruN([iga]).length &&
    rc.kpi.reativadas === novaCruR([c6]).length && ri.kpi.reativadas === novaCruR([iga]).length);
  prova('evento: a Data mostra só os dias dele', JSON.stringify(rc.dias_periodo) === JSON.stringify(['251119', '251120', '251121']), rc.dias_periodo);
})();

/* acesso fora do período NÃO conta: planta acessos antes do início e
   depois do fim, para a loja nova do topo, na parte certa dela */
const topo = R.top_lojas[0].loja;
const sab = JSON.parse(JSON.stringify(d));
const iAd = NOMES.indexOf('acessos_p' + (topo % PARTES));
const rowAd = sab.mcp[iAd].json.structuredContent.rows[0];
const linAd = JSON.parse(rowAd[1]);
/* e um acesso dentro do período, mas de um evento fora do recorte: não conta */
const dentroCod = perTodos[1].slice(2, 4) + perTodos[1].slice(5, 7) + perTodos[1].slice(8, 10);
linAd.push([topo, '200101', 12, 9, eventosCru[0].id], [topo, '991231', 12, 9, eventosCru[0].id], [topo, dentroCod, 10, 9, 999999]);
rowAd[0] = linAd.length;
rowAd[1] = JSON.stringify(linAd);
const outSab = roda('montar-painel.js', Object.assign({}, nos, { 'MCP Consultas': sab.mcp }))[0].json;
prova('acesso fora do período, ou de evento fora do recorte, não muda os dias', outSab.resumo.top_lojas[0].acessos === R.top_lojas[0].acessos &&
  outSab.resumo.kpi.acessos === R.kpi.acessos);

/* acessos por hora, refeitos: total e novos, do primeiro ao último
   horário com acesso */
/* por hora = a medida do gráfico por dia, por hora (Thomas, 02/10): lojas do
   ranking com acesso naquela hora, uma vez por hora em cada dia */
const porHoraCru = (per, soDia, ok) => {
  const t = [];
  const nv = [];
  const rv = [];
  for (let x = 0; x < 24; x++) { t.push(0); nv.push(0); rv.push(0); }
  const naLista = new Set(todosPag.lojas.map((r) => String(r.loja)));
  const visto = new Set();
  acessosCru.forEach((a) => {
    if (!dentro(a, per) || (soDia && a.dia !== soDia) || (ok && !ok(a.loja)) || !naLista.has(String(a.loja))) return;
    const k = a.loja + '|' + a.dia + '|' + a.hora;
    if (visto.has(k)) return;
    visto.add(k);
    t[Number(a.hora)]++;
    if (ehNovaT[a.loja] === 'N') nv[Number(a.hora)]++;
    if (ehNovaT[a.loja] === 'R') rv[Number(a.hora)]++;
  });
  return { t: t, nv: nv, rv: rv };
};
const hc = porHoraCru(perTodos);
const primeira = hc.t.findIndex((n) => n > 0);
const ultima = 23 - hc.t.slice().reverse().findIndex((n) => n > 0);
prova('por hora: do primeiro ao último horário com acesso', todosPag.por_hora.length === ultima - primeira + 1 &&
  todosPag.por_hora[0].h === primeira && todosPag.por_hora[todosPag.por_hora.length - 1].h === ultima,
  [todosPag.por_hora.length, primeira, ultima]);
prova('por hora: total, novos e reativados recalculados do cru', todosPag.por_hora.every((x) => x.total === hc.t[x.h] && x.novas === hc.nv[x.h] && x.reativadas === hc.rv[x.h]) &&
  hc.rv.some((n) => n > 0) && hc.nv.some((n) => n > 0));
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
prova('clique no dia: por hora só daquele dia', soDia.por_hora.every((x) => x.total === hcDia.t[x.h] && x.novas === hcDia.nv[x.h] && x.reativadas === hcDia.rv[x.h]) &&
  soDia.kpi.acessos === hcDia.t.reduce((a, b) => a + b, 0));
prova('clique no dia: o resto do painel não muda', JSON.stringify(Object.assign({}, soDia.kpi, { acessos: 0, acessos_novas: 0, acessos_reativadas: 0 })) ===
  JSON.stringify(Object.assign({}, todosPag.kpi, { acessos: 0, acessos_novas: 0, acessos_reativadas: 0 })));
prova('anúncios acessados = veículos com alguma loja no anúncio', R.kpi.acessados === new Set(D0.veiculos.filter((v) => v.acessos > 0).map((v) => v.veic)).size &&
  R.kpi.acessados > 0 && R.kpi.acessados <= R.kpi.publicados);
prova('acessos únicos por dia: novas + reativadas ≤ total, todo dia', todosPag.por_dia.length > 0 &&
  todosPag.por_dia.every((x) => x.novas + x.reativadas <= x.total));
/* o mesmo indicador da coluna Acessos do ranking (Thomas, 02/10) */
prova('acessos únicos por dia somam a coluna Acessos do ranking de lojas',
  todosPag.por_dia.reduce((t, x) => t + x.total, 0) === todosPag.lojas.reduce((t, r) => t + r.acessos, 0) &&
  todosPag.por_dia.reduce((t, x) => t + x.novas, 0) === todosPag.lojas.filter((r) => r.nova === 'N').reduce((t, r) => t + r.acessos, 0) &&
  todosPag.por_dia.reduce((t, x) => t + x.reativadas, 0) === todosPag.lojas.filter((r) => r.nova === 'R').reduce((t, r) => t + r.acessos, 0) &&
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
/* o VMV de cada CARRO uma vez: o da negociação que vendeu, senão o da mais recente */
const repCru = {};
const vendeuCru = (x) => [2, 3, 7].indexOf(Number(x.status)) >= 0;
cru.veiculos.forEach((v) => {
  const r = repCru[v.veiculo];
  if (!r || (vendeuCru(v) && !vendeuCru(r)) || (vendeuCru(v) === vendeuCru(r) && Number(v.neg) > Number(r.neg))) repCru[v.veiculo] = v;
});
const vmvPubCru = somaC(Object.keys(repCru).map((k) => repCru[k]), (v) => (v.vmv === null ? 0 : Number(v.vmv)));
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
prova('aprovados = cadastros novos em situation 3 (o funil só com as cadastradas)', F[0] === cadTodos.length &&
  F[1] === cadTodos.filter((l) => Number(l.situacao) === 3).length);
prova('acessaram = novos com dia de acesso no período; o cartão de reativados com o funil deles', F[2] === cadTodos.filter((l) => diasTodos[l.id]).length &&
  R.kpi.reativadas_acessaram === reatTodos.filter((l) => diasTodos[l.id]).length &&
  R.kpi.reativadas_ofertaram === reatTodos.filter((l) => ofCom.some((o) => o.loja === l.id)).length &&
  Math.abs(R.kpi.engaj_reativadas - R.kpi.reativadas_acessaram / R.kpi.reativadas) < 1e-12 &&
  R.kpi.acessos_novas + R.kpi.acessos_reativadas <= R.kpi.acessos);
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
prova('Pátio: publicados = veículos do pátio', fp.kpi.publicados === new Set(D0.veiculos.filter((v) => v.patio === umPatio).map((v) => v.veic)).size && fp.veiculos.every((v) => v.patio === umPatio));
prova('Pátio: lances = lances nesses veículos', fp.kpi.lances === ofCom.filter((o) => negsP.indexOf(Number(o.neg)) >= 0).length);
prova('Pátio: a tabela de pátios só tem ele', fp.patios.length === 1 && fp.patios[0].patio === umPatio);
prova('Pátio: acesso ao evento não muda', fp.kpi.lojas_acessaram === todosPag.kpi.lojas_acessaram && fp.kpi.novas === todosPag.kpi.novas);
/* status do veículo: o farol intrínseco */
['sem', 'abaixo', 'atingiu'].forEach((fa) => {
  const r = calculaDaPagina(D0, 'todos', { farol: fa });
  prova('Status ' + fa + ': publicados = veículos com esse farol', r.kpi.publicados === new Set(D0.veiculos.filter((v) => v.farol === fa).map((v) => v.veic)).size &&
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
prova('Data ' + dataF + ': lances = lances daquele dia', fd.kpi.lances === ofCom.filter((o) => o.quando.slice(0, 10) === dataF).length);
prova('Data ' + dataF + ': cada loja com no máximo 1 dia de acesso', fd.lojas.every((x) => x.acessos <= 1) &&
  fd.por_dia.length === 1 && fd.por_dia[0].dia === diaF);
const perDia = [dataF + ' 00:00' > perTodos[0] ? dataF + ' 00:00' : perTodos[0], dataF + ' 23:59' < perTodos[1] ? dataF + ' 23:59' : perTodos[1]];
prova('Data ' + dataF + ': novos = cadastrados naquele dia; reativados = os que voltaram naquele dia', fd.kpi.novas === novaCruN(eventosCru, dataF).length &&
  fd.kpi.reativadas === novaCruR(eventosCru, dataF).length, [fd.kpi.novas, novaCruN(eventosCru, dataF).length, fd.kpi.reativadas]);
prova('Data ' + dataF + ': vendas pela data da oferta vencedora', fd.kpi.vendidos === cru.veiculos.filter((v) =>
  [2, 3, 7].indexOf(Number(v.status)) >= 0 && ofPorId[v.vencedora] && ofPorId[v.vencedora].quando.slice(0, 10) === dataF).length);
prova('Data ' + dataF + ': a lista de veículos continua inteira', fd.veiculos.length === todosPag.veiculos.length);
/* a Data virou os botões acima do funil (Thomas, 26/10): cadastros, acessos e
   negociações daquele dia — e o funil acompanha */
prova('Data ' + dataF + ': o funil só com os cadastrados naquele dia, refeito do cru', fd.funil[0][1] === novaCruN(eventosCru, dataF).length &&
  fd.funil[2][1] === novaCruN(eventosCru, dataF).filter((l) => diasNoPeriodo([dataF + ' 00:00' > perTodos[0] ? dataF + ' 00:00' : perTodos[0],
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
prova('Pátio + Status: interseção', fj.kpi.publicados === new Set(D0.veiculos.filter((v) => v.patio === umPatio && v.farol === 'abaixo').map((v) => v.veic)).size);

/* um veículo só (Thomas, 12/11): planta o mesmo carro numa segunda
   negociação, sem oferta, em outro evento da coleta (ou no mesmo, se ela
   só tem um). O total de carros e de linhas da tabela não muda, o evento
   dele ganha um, e a linha diz em quantos eventos ele esteve, com as
   ofertas dele e o resultado da negociação mais recente */
(() => {
  const sint = JSON.parse(JSON.stringify(d));
  const iV = NOMES.indexOf('veiculos');
  const cols = sint.consultas[iV].json.cols.map((c) => (Array.isArray(c) ? c[0] : c));
  const row = sint.mcp[iV].json.structuredContent.rows[0];
  const linhas = JSON.parse(row[1]);
  const C = (k) => cols.indexOf(k);
  const qtdDe = {};
  D0.veiculos.forEach((v) => { qtdDe[v.neg] = v.qtd; });
  const orig = linhas.find((a) => qtdDe[Number(a[C('neg')])] > 0 && [2, 3, 7].indexOf(Number(a[C('status')])) < 0 &&
    linhas.filter((b) => Number(b[C('veiculo')]) === Number(a[C('veiculo')])).length === 1);
  const evs = [];
  linhas.forEach((a) => { if (evs.indexOf(Number(a[C('evento')])) < 0) evs.push(Number(a[C('evento')])); });
  const evB = evs.find((e) => e !== Number(orig[C('evento')])) || Number(orig[C('evento')]);
  const nova = orig.slice();
  nova[C('neg')] = Math.max.apply(null, linhas.map((a) => Number(a[C('neg')]))) + 1;
  nova[C('anuncio')] = Math.max.apply(null, linhas.map((a) => Number(a[C('anuncio')]))) + 1;
  nova[C('evento')] = evB;
  nova[C('status')] = 11;
  nova[C('vencedora')] = null;
  linhas.push(nova);
  const scV = sint.mcp[iV].json.structuredContent;
  row[scV.columns.indexOf('linhas')] = JSON.stringify(linhas);
  row[scV.columns.indexOf('total')] = linhas.length;
  const o = roda('montar-painel.js', Object.assign({}, nos, { 'MCP Consultas': sint.mcp }))[0].json;
  const Ds = dadosDe(o.html);
  const t = calculaDaPagina(Ds, 'todos', {});
  const linha = t.veiculos.filter((v) => v.veic === Number(orig[C('veiculo')]));
  prova('um veículo só: o carro em duas negociações conta uma vez e tem uma linha só, com as ofertas dele e o status da mais recente',
    o.resumo.veiculos === R.veiculos + 1 && o.resumo.kpi.publicados === R.kpi.publicados && t.veiculos.length === todosPag.veiculos.length &&
    linha.length === 1 && linha[0].n_ev === 2 && linha[0].qtd === qtdDe[Number(orig[C('neg')])] && linha[0].status === 11 &&
    linha[0].neg === nova[C('neg')] && o.resumo.kpi.com_oferta === R.kpi.com_oferta &&
    (evB === Number(orig[C('evento')]) || calculaDaPagina(Ds, evB, {}).kpi.publicados === calculaDaPagina(D0, evB, {}).kpi.publicados + 1),
    [o.resumo.veiculos, R.veiculos, o.resumo.kpi.publicados, R.kpi.publicados, linha.length && linha[0].n_ev, evB]);
})();
prova('sem filtro = filtro vazio', JSON.stringify(calculaDaPagina(D0, 'todos', { dia: '', patio: '', farol: '' }).kpi) ===
  JSON.stringify(todosPag.kpi));

/* ── 4. o HTML ──────────────────────────────────────────────────────── */
const h = out.html;
const semScript = h.split('<script>')[0];
prova('HTML sem requisição de rede', semScript.indexOf('src="http') < 0 && h.indexOf('<link') < 0 &&
  h.indexOf('@import') < 0 && h.indexOf('url(http') < 0);
/* "C6 Bank Lojista" é nome de loja no dado: a busca é fora dele */
prova('sem imagem embutida nem logo do C6', h.indexOf('data:image/') < 0 && semScript.indexOf('C6 Bank') < 0 &&
  scr.slice(0, scr.lastIndexOf('APP({')).indexOf('C6 Bank') < 0 && h.indexOf('id="logo"') < 0 && h.indexOf('logo-c6') < 0);
/* toda cor usada tem definição: sem a camada do C6, --serie-2 e
   --farol-abaixo sumiram calados em 03/11 (barra Total e farol invisíveis) */
(() => {
  const usadas = [...new Set((h.match(/var[(]--[a-z0-9-]+[)]/g) || []).map((v) => v.slice(4, -1)))];
  const soltas = usadas.filter((v) => h.indexOf(v + ':') < 0);
  prova('toda variável de cor usada está definida', usadas.length > 10 && soltas.length === 0, soltas);
})();
/* a logo da Fenauto: SVG inline, uma cópia só, da arte do design (a preta
   de 26/10, #242424). A cor de cada tema é do CSS */
prova('logo da Fenauto inline, a que o injetor produz da arte do design, uma vez só',
  h.indexOf(injetor.logoFenauto) > 0 && h.split('<title>FENAUTO com Cars2You</title>').length === 2 &&
  (injetor.logoFenauto.match(/fill="#242424"/g) || []).length === 2 && h.indexOf('#403172') < 0);
prova('claro: a Fenauto no #3A4552 da Cars2You, o --texto do tema claro', h.indexOf('.logo-fen path,.logo-fen g{fill:#3A4552}') > 0 &&
  h.indexOf('--texto:          #3A4552;') > 0 &&
  fs.readFileSync(path.join(__dirname, '..', '..', '..', 'design', 'marca', 'cars2you', 'logo-cars2you-preto.svg'), 'utf8').indexOf('#3A4552') > 0);
prova('logo da Fenauto: coordenadas com uma casa, escala da Cars2You intacta', (() => {
  const ds = injetor.logoFenauto.match(/ d="[^"]*"/g) || [];
  return ds.length === 9 && ds.every((d) => !/[0-9][.][0-9][0-9]/.test(d)) && injetor.logoFenauto.indexOf('scale(0.46088)') > 0;
})());
/* topo (Thomas, 03/11): a Fenauto à esquerda; o título e o subtítulo
   centrados, na grade do tema (1fr auto 1fr) */
prova('topo: a Fenauto à esquerda, primeiro filho da barra', (() => {
  const i = semScript.indexOf('<div class="topo-in">');
  return i > 0 && semScript.indexOf('<span class="marca logo-fen" id="logo-fen">' + injetor.logoFenauto + '</span>') === i + '<div class="topo-in">'.length;
})());
prova('topo: título e subtítulo no centro, depois da logo', (() => {
  const t = semScript.indexOf('<div class="topo-tit"><h1>Mega evento Fenauto</h1><p class="sub" id="sub"></p></div>');
  return t > semScript.indexOf('id="logo-fen"') && t < semScript.indexOf('<div class="topo-acoes">') &&
    h.indexOf('grid-template-columns:1fr auto 1fr') > 0 && h.indexOf('.topo-tit{ text-align:center') > 0 &&
    h.indexOf('.topo-tit{text-align:right}') < 0 && h.indexOf('.topo-in{grid-template-columns:auto 1fr auto}') < 0;
})());
prova('subtítulo: a operação (quando há), o evento escolhido ou a semana, e "com filtros"',
  scr.indexOf("$('#sub').textContent = (R.op ? NOME_OP[R.op] + ' · ' : '') + (ev") > 0 &&
  scr.indexOf("(R.op ? '' : 'C6 e IGA · ')") > 0 && scr.indexOf("const NOME_OP = { C6: 'C6', IGA: 'Itaú' };") > 0 &&
  scr.indexOf("' · com filtros'") > 0);
prova('a logo tem nome: o do SVG', injetor.logoFenauto.indexOf('role="img" aria-label="FENAUTO com Cars2You"') > 0);
prova('escuro: a Fenauto em branco pelo CSS, como a logo-fenauto-escuro.svg', h.indexOf('[data-tema="escuro"] .logo-fen path,[data-tema="escuro"] .logo-fen g{fill:#FFFFFF}') > 0 &&
  fs.readFileSync(path.join(__dirname, '..', '..', '..', 'design', 'marca', 'fenauto', 'logo-fenauto-escuro.svg'), 'utf8').indexOf('#FFFFFF') > 0);
prova('troca de tema não mexe em logo: a cor é CSS', scr.indexOf("$('#logo')") < 0 && scr.indexOf('LOGO[') < 0 && scr.indexOf("$('#logo-fen')") < 0);
prova('aba do navegador: Mega evento Fenauto', h.indexOf('<title>Mega evento Fenauto</title>') > 0 && h.indexOf('Eventos Fenauto C6') < 0);
prova('Fenauto com 44px, 26px no telefone', h.indexOf('.logo-fen svg{display:block;height:44px;') > 0 &&
  h.indexOf('@media (max-width:620px){.logo-fen svg{height:26px}') > 0);
/* identidade da Cars2You (03/11): o tema.css sozinho, sem a camada do C6 */
prova('identidade da Cars2You: sem a camada do C6', h.indexOf('#DCDCDC') < 0 && h.indexOf('#FFC000') < 0 &&
  h.indexOf('--marca-azul:       #1523A0') > 0 && injetor.blocoTema.length > 5000 &&
  fs.readFileSync(path.join(__dirname, '_aplica-modelo.js'), 'utf8').indexOf("ler('tokens', 'tema-c6.css')") < 0);
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
/* 03/11: os botões de Evento numa linha própria logo acima da Data, fora de cartão */
prova('botões de Evento fora de cartão, logo acima da Data', (() => {
  const e = semScript.indexOf('id="f-eventos"');
  const b = semScript.indexOf('id="f-dias"');
  const fimKpi = semScript.indexOf('</section>', semScript.indexOf('id="k-nv"'));
  return fimKpi < e && e < b && semScript.slice(fimKpi, b).indexOf('cartao') < 0 &&
    semScript.indexOf('<div class="barra-dias"><span class="rot-dias" id="f-eventos-rot">Evento</span>') > 0 &&
    semScript.indexOf('role="group" aria-labelledby="f-eventos-rot"') > 0;
})());
prova('botões de Evento: Todos e um por evento, na ordem de início, com operação e estado',
  scr.indexOf("D.eventos.slice().sort((a, b) => (a.ini < b.ini ? -1 : a.ini > b.ini ? 1 : a.id - b.id))") > 0 &&
  scr.indexOf('data-e="todos"') > 0 &&
  scr.indexOf('<span class="ev-op">') > 0 && scr.indexOf('<span class="ev-est">') > 0);
prova('botão de evento troca o recorte e refaz a Data', scr.indexOf("sel = v === 'todos' ? 'todos' : Number(v);") > 0 &&
  scr.indexOf("const b = ev.target.closest('button[data-e]');") > 0);
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
prova('a aba de Filtros não conta a data nem o evento (eles não moram na gaveta)',
  scr.indexOf("const n = FILTROS.filter((k) => k !== 'dia' && F[k]).length;") > 0 && scr.indexOf("(sel === 'todos' ? 0 : 1)") < 0);
prova('ranking de lojas na linha inteira', (() => {
  const i = semScript.indexOf('id="th-lojas"');
  const g = semScript.lastIndexOf('<section class="g2i">', i);
  return i > 0 && semScript.lastIndexOf('</section>', i) > g;
})());
prova('ranking de lojas com primeiro e último acesso, sem GP nem GN', ["t: 'Primeiro acesso'", "t: 'Último acesso'"]
  .every((t) => scr.indexOf(t) > 0) && ["t: 'Usuário GP'", "t: 'Usuário GN'", "k: 'gp'", "k: 'gn'"].every((t) => h.indexOf(t) < 0));
prova('seis cartões: Performance financeira logo depois de Vendidos; Reativados depois de Novos lojistas', (semScript.match(/class="kpi-val num"/g) || []).length === 6 &&
  semScript.indexOf('id="k-vd"') < semScript.indexOf('id="k-pf"') && semScript.indexOf('id="k-pf"') < semScript.indexOf('id="k-nv"') &&
  semScript.indexOf('id="k-nv"') < semScript.indexOf('id="k-rt"') && h.indexOf('.g4.g5{grid-template-columns:repeat(6,minmax(0,1fr))}') > 0 &&
  h.indexOf('repeat(5,minmax(0,1fr))') < 0 &&
  ['id="k-pf-pc"', 'id="k-pf-fipe"', 'id="k-pf-vmv"'].every((t) => semScript.indexOf(t) > 0));
prova('Reativados: ícone próprio, engajamento e Acessaram, Ofertaram, Compraram no pé', (() => {
  const i = semScript.indexOf('id="k-rt"');
  const pe = semScript.slice(i, semScript.indexOf('</article>', i));
  return i > 0 && ['id="k-rt-pc"', 'id="k-rt-bar"', 'id="k-rt-ac"', 'id="k-rt-of"', 'id="k-rt-cp"'].every((t) => pe.indexOf(t) > 0) &&
    pe.indexOf('>Acessaram<') < pe.indexOf('>Ofertaram<') && pe.indexOf('>Ofertaram<') < pe.indexOf('>Compraram<') &&
    h.indexOf('M3 12a9 9 0 1 0 3-6.7L3 8') > 0 && scr.indexOf("pcBar('#k-rt-pc', '#k-rt-bar', k.engaj_reativadas, 'de engajamento');") > 0;
})());
prova('terceira série Reativados (serie-c) nos dois gráficos e na legenda, com --serie-3 nos dois temas', (() => {
  const nSerie = scr.split("{ k: 'reativadas', nome: 'Reativados', cls: 'serie-c' }").length - 1;
  return nSerie === 2 && semScript.split('<span class="amostra serie-c"></span>Reativados').length - 1 === 2 &&
    h.indexOf(':root{--serie-3:#C2570C}[data-tema="escuro"]{--serie-3:#D9692B}') > 0 &&
    h.indexOf('.graf .serie-c,.amostra.serie-c{fill:var(--serie-3);background:var(--serie-3)}') > 0;
})());
prova('selo de tipo: nova/reativada no ranking, novo/reativado no Resultado', scr.indexOf("(r.nova && !tipoVis ? ' ' + seloTipo(r.nova, 'a') : '')") > 0 &&
  scr.indexOf("(R.nova[v.arrematante] ? ' ' + seloTipo(R.nova[v.arrematante], 'o') : '')") > 0 &&
  scr.indexOf("t === 'R' ? '<span class=" + String.fromCharCode(34) + "tag reat") > 0 &&
  h.indexOf('.tag.reat{background:color-mix(in srgb, var(--serie-3) 16%, transparent);color:var(--serie-3)}') > 0 &&
  scr.indexOf('<span class=' + String.fromCharCode(34) + 'tag ok' + String.fromCharCode(34) + '>nova</span>') < 0);
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
prova('farol abaixo do VMV com a cor do tema, nos dois temas', h.indexOf('.farol.abaixo{background:var(--farol-abaixo)}') > 0 &&
  (h.match(/--farol-abaixo:/g) || []).length >= 2);
prova('sem degradê amarelo no escuro', h.indexOf('rgba(255,192,0,.07)') < 0);
prova('pátios fora da grade de duas colunas (linha inteira)', (() => {
  const i = semScript.indexOf('id="th-patios"');
  const g = semScript.lastIndexOf('<section class="g2i">', i);
  return i > 0 && semScript.lastIndexOf('</section>', i) > g;
})());
prova('gaveta de filtros com Pátio e Status, sem Evento, Data nem Usuário GP/GN', ['id="gaveta"', 'id="f-patio"', 'id="f-farol"', 'id="limpar"']
  .every((t) => semScript.indexOf(t) > 0) && ['id="f-evento"', 'id="f-dia"', 'id="f-gp"', 'id="f-gn"', 'Usuário GP', 'Usuário GN'].every((t) => semScript.indexOf(t) < 0) &&
  h.indexOf("'#f-evento'") < 0 && scr.indexOf("$('#f-evento')") < 0);
prova('gráfico por dia se chama Acessos únicos por dia', semScript.indexOf('Acessos únicos por dia') > 0 && semScript.indexOf('Lojas únicas que acessaram') < 0);
prova('ranking de lojas: nova sempre, as demais só com acesso (05/10)', scr.indexOf('R.lojas.filter((r) => (r.nova || r.acessos > 0)') > 0);
prova('funil: mínimo de 3 dígitos somado em todas as etapas + parte proporcional',
  scr.indexOf('const MIN_F = 3 * 7.4 + 16;') > 0 && scr.indexOf('MIN_F + (FW - MIN_F) * (v0 ? f[1] / v0 : 0)') > 0);
prova('funil à esquerda das lojas por dia; por hora abaixo', semScript.indexOf('id="funil"') < semScript.indexOf('id="g-dia"') &&
  semScript.indexOf('id="g-dia"') < semScript.indexOf('id="g-hora"'));
prova('botões Todos lojistas/Novos/Reativados; sem o botão GN/GP', ['>Todos lojistas<', '>Novos<', '>Reativados<'].every((t) => semScript.indexOf(t) > 0) &&
  semScript.indexOf('Somente novos') < 0 && scr.indexOf("const tipoVis = filtroLojas === 'novas' ? 'N' : filtroLojas === 'reativadas' ? 'R' : '';") > 0 &&
  h.indexOf('seg-reps') < 0 && h.indexOf('f-rep') < 0);
/* ordem pedida em 29/09, sem os filtros de usuário; nada disso no topo */
const gav = semScript.slice(semScript.indexOf('id="gaveta"'), semScript.indexOf('</aside>'));
const posG = ['id="seg-lojas"', 'id="f-patio"', 'id="f-farol"'].map((t) => gav.indexOf(t));
prova('gaveta na ordem: Lojistas, Pátio, Status', posG.every((p, i) => p > 0 && (i === 0 || p > posG[i - 1])), posG);
prova('rankings sem botões (os botões de fora da gaveta são só Operação, Evento e Data)', semScript.slice(semScript.indexOf('</aside>')).indexOf('class="seg"') < 0 &&
  (semScript.slice(semScript.indexOf('</aside>')).match(/class="seg /g) || []).length === 3);
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
prova('caminho no SharePoint', va.json.caminho === 'Mega%20Evento%20Fenauto/mega-evento-fenauto.html', va.json.caminho);
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
prova('CSV de novos lojistas sem GP e GN, com nome próprio', scr.indexOf("const cab = ['Loja', 'Tipo', 'Primeiro acesso',") > 0 &&
  scr.indexOf("r.nova === 'R' ? 'Reativado' : 'Novo'") > 0 && scr.indexOf('lojasNovasExp = R.lojas.filter((r) => r.nova);') > 0 &&
  scr.indexOf("'novos-lojistas-mega-evento-fenauto-'") > 0 && scr.indexOf('r.gp') < 0 && scr.indexOf('r.gn') < 0);
prova('sem pontuação nenhuma no nó nem na página', painelFonte.indexOf('pontos') < 0 && painelFonte.indexOf('PONTOS') < 0 && h.indexOf('Pontuação') < 0);
prova('rodapé sem a data da carteira', scr.indexOf('base_reps') < 0);
prova('nada de "Arremate" na tela; Recuperações nas colunas e no cartão', (() => {
  const vis = semScript + scr.slice(scr.indexOf('function APP('));
  return ["t: 'Arremates'", "'Arremate / FIPE'", "'Arremate / VMV'", 'pontos por arremate', 'loja arrematante']
    .every((t) => vis.indexOf(t) < 0 && out.html.indexOf(t) < 0) &&
    ["t: 'Recuperações'", 'Recuperação / FIPE', 'Recuperação / VMV'].every((t) => out.html.indexOf(t) > 0);
})());

/* ── 8. C6 e IGA juntos (03/11) ─────────────────────────────────────── */
prova('todo evento é C6 ou IGA, e C6 é quem alveja o 43', D0.eventos.length > 0 && D0.eventos.every((e) =>
  (e.op === 'C6') === (e.wls.indexOf(43) >= 0) && ['C6', 'IGA'].indexOf(e.op) >= 0));
prova('nenhum aviso de vendedor ou de link fora da operação na coleta de prova', R.avisos.every((a) =>
  a.indexOf('loja vendedora') < 0 && a.indexOf('cars2you.com.br') < 0), R.avisos);
prova('vendedor do IGA é 594, 598 ou 16036; do C6, 104754', cru.veiculos.every((v) => {
  const e = cru.eventos.find((x) => Number(x.id) === Number(v.evento));
  return (e.op === 'IGA' ? [594, 598, 16036] : [104754]).indexOf(Number(v.vendedor)) >= 0;
}));
prova('link: C6 na vitrine do C6, IGA no cars2you.com.br', D0.veiculos.filter((v) => v.link).every((v) => {
  const e = D0.eventos.find((x) => x.id === v.ev);
  return v.link.indexOf(e.op === 'C6' ? 'https://compraveiculos.cars2you.com.br/' : 'https://cars2you.com.br/') === 0;
}) && D0.veiculos.some((v) => v.link && v.link.indexOf('https://cars2you.com.br/') === 0));
prova('vendedor fora da operação vira aviso', (() => {
  const sab2 = JSON.parse(JSON.stringify(d.mcp));
  const iV = NOMES.indexOf('veiculos');
  const cols = d.consultas[iV].json.cols;
  const row = sab2[iV].json.structuredContent.rows[0];
  const lin = JSON.parse(row[1]);
  lin[0][cols.indexOf('vendedor')] = 1;
  row[1] = JSON.stringify(lin);
  const o = roda('montar-painel.js', Object.assign({}, nos, { 'MCP Consultas': sab2 }))[0].json;
  return o.resumo.avisos.some((a) => a.indexOf('1 veículo(s) de loja vendedora fora da operação') === 0);
})());
prova('rodapé e glossário falam da semana, da Fenauto e das duas operações', scr.indexOf("' da Fenauto no C6 e no IGA abertos na semana de '") > 0 &&
  scr.indexOf("' da Fenauto na semana de '") > 0 &&
  h.indexOf('com ' + String.fromCharCode(92, 34) + 'Fenauto' + String.fromCharCode(92, 34) + ' no nome, aberto em algum momento da semana') > 0 &&
  h.indexOf('Evento do C6 (alveja o Canal de vendas C6 Auto, whitelabel 43) ou do IGA') > 0 &&
  h.indexOf('com usuário no grupo ' + String.fromCharCode(92, 34) + 'VD Itaú - Fenauto 2025' + String.fromCharCode(92, 34)) > 0 &&
  h.indexOf('Parceiros C6 - Geral') > 0 && h.indexOf('campanha da Fenauto') < 0 && h.indexOf('register_form') < 0);

/* ── 9. o filtro de Operação (Thomas, 11/11) ───────────────────────────
   Na calcula (F.op): C6 ou Itaú (IGA) é o mesmo que escolher todos os
   eventos daquela operação. Na página: a linha de botões acima da de
   Evento, os botões de Evento só da operação, o evento de outra operação
   volta a Todos e o Limpar volta a Operação para Todas. */
(() => {
  const somaOp = (op, f) => R.por_evento.filter((e) => eventosCru.find((x) => x.id === e.id).op === op).reduce((t, e) => t + e.kpi[f], 0);
  ['C6', 'IGA'].forEach((op) => {
    const r = calculaDaPagina(D0, 'todos', { op: op });
    const evsOp = eventosCru.filter((e) => e.op === op);
    prova('Operação ' + op + ': só os eventos dela, e os KPIs são a soma deles', r.eventos.length === evsOp.length && evsOp.length > 0 &&
      r.eventos.every((e) => e.op === op) && r.op === op &&
      ['publicados', 'vendidos', 'lances', 'com_oferta'].every((f) => r.kpi[f] === somaOp(op, f)) &&
      r.veiculos.every((v) => evsOp.some((e) => e.id === v.ev)), [op, r.kpi.publicados, somaOp(op, 'publicados')]);
    prova('Operação ' + op + ': lances = lances nos veículos dos eventos dela, refeitos do cru', r.kpi.lances === ofCom.filter((o) =>
      cru.veiculos.some((v) => v.neg === o.neg && evsOp.some((e) => e.id === Number(v.evento)))).length);
    prova('Operação ' + op + ': novas = as entradas dela, por outro caminho', JSON.stringify(Object.keys(r.nova).map(Number).sort()) ===
      JSON.stringify(novaCru(evsOp).map((l) => Number(l.id)).sort()));
    prova('Operação ' + op + ': acessos só dos eventos dela', r.kpi.lojas_acessaram === Object.keys(diasNoPeriodo(periodoDe(evsOp), null, evsOp.map((e) => e.id))).length);
  });
  const oC6 = calculaDaPagina(D0, 'todos', { op: 'C6' });
  const oIGA = calculaDaPagina(D0, 'todos', { op: 'IGA' });
  prova('coleta de prova: Operação C6 e Itaú com clientes, e Todas = a união das duas (loja nas duas conta uma vez)',
    nTot(oC6.kpi) > 0 && nTot(oIGA.kpi) > 0 && nTot(R.kpi) === new Set(Object.keys(oC6.nova).concat(Object.keys(oIGA.nova))).size &&
    nTot(R.kpi) <= nTot(oC6.kpi) + nTot(oIGA.kpi), [nTot(oC6.kpi), nTot(oIGA.kpi), nTot(R.kpi)]);
  prova('Operação C6 + Itaú = Todas, nos KPIs de soma', ['publicados', 'vendidos', 'lances', 'com_oferta', 'vmv_atingido'].every((f) =>
    oC6.kpi[f] + oIGA.kpi[f] === R.kpi[f]));
  prova('Operação Todas, vazia ou desconhecida = sem filtro', ['', undefined, 'X', 'c6'].every((v) =>
    JSON.stringify(calculaDaPagina(D0, 'todos', { op: v }).kpi) === JSON.stringify(todosPag.kpi)) && todosPag.op === '');
  prova('evento de outra operação com Operação ligada: recorte vazio (a página volta o evento a Todos antes)', (() => {
    const r = calculaDaPagina(D0, evC6.id, { op: 'IGA' });
    return r.eventos.length === 0 && r.kpi.publicados === 0 && r.kpi.novas === 0;
  })());
  prova('resumo por operação na coleta de prova', R.por_operacao.map((x) => x.op + ':' + x.eventos + ':' + x.kpi.novas).join() ===
    'C6:1:' + oC6.kpi.novas + ',IGA:1:' + oIGA.kpi.novas,
    R.por_operacao.map((x) => [x.op, x.eventos, x.kpi.novas]));
  /* os dias da Data com Operação: estica o IGA até 23/11 numa cópia e a
     Data do C6 continua 19 a 21, a do Itaú vai a 23 */
  (() => {
    const sint = JSON.parse(JSON.stringify(d));
    const iE = NOMES.indexOf('eventos');
    const cols = sint.consultas[iE].json.cols;
    const row = sint.mcp[iE].json.structuredContent.rows[0];
    const lin = JSON.parse(row[1]);
    lin.find((a) => a[cols.indexOf('op')] === 'IGA')[cols.indexOf('fim')] = '2025-11-23 16:00';
    row[1] = JSON.stringify(lin);
    const Ds = dadosDe(roda('montar-painel.js', Object.assign({}, nos, { 'MCP Consultas': sint.mcp }))[0].json.html);
    const dC6 = calculaDaPagina(Ds, 'todos', { op: 'C6' }).dias_periodo;
    const dIGA = calculaDaPagina(Ds, 'todos', { op: 'IGA' }).dias_periodo;
    prova('Operação: a Data mostra só os dias dos eventos dela', dC6.join() === '251119,251120,251121' &&
      dIGA.join() === '251119,251120,251121,251122,251123' && calculaDaPagina(Ds, 'todos', {}).dias_periodo.join() === dIGA.join(), [dC6, dIGA]);
  })();
  /* a página */
  prova('linha de Operação fora de cartão, logo acima da de Evento, no mesmo estilo', (() => {
    const o = semScript.indexOf('id="f-ops"');
    const e = semScript.indexOf('id="f-eventos"');
    const fimKpi = semScript.indexOf('</section>', semScript.indexOf('id="k-nv"'));
    return fimKpi < o && o < e && semScript.slice(fimKpi, e).indexOf('cartao') < 0 &&
      semScript.indexOf('<div class="barra-dias"><span class="rot-dias" id="f-ops-rot">Operação</span>' +
        '<div class="seg dias" id="f-ops" role="group" aria-labelledby="f-ops-rot"></div></div>' +
        '<div class="barra-dias"><span class="rot-dias" id="f-eventos-rot">Evento</span>') > 0;
  })());
  prova('botões de Operação: Todas, C6 e Itaú, com quantos eventos cada uma tem',
    scr.indexOf("[['', 'Todas'], ['C6', NOME_OP.C6], ['IGA', NOME_OP.IGA]]") > 0 && scr.indexOf('data-o="') > 0 &&
    scr.indexOf("const nDaOp = (op) => D.eventos.filter((e) => !op || e.op === op).length;") > 0);
  prova('Operação liga F.op e refaz Evento, Data e o painel', (() => {
    const i = scr.indexOf("$('#f-ops').addEventListener('click'");
    const t = scr.slice(i, scr.indexOf('});', i));
    return i > 0 && t.indexOf("F.op = b.getAttribute('data-o');") > 0 && t.indexOf('montaEventos();') > 0 &&
      t.indexOf('montaFiltros();') > 0 && t.indexOf('render();') > 0;
  })());
  prova('evento fora da operação escolhida volta a Todos',
    scr.indexOf("if (sel !== 'todos' && F.op && !D.eventos.some((e) => e.id === sel && e.op === F.op)) sel = 'todos';") > 0);
  prova('botões de Evento só da operação escolhida, e o Todos conta os dela',
    scr.indexOf('const lista = evOrd.filter((e) => !F.op || e.op === F.op);') > 0 && scr.indexOf('lista.length +') > 0);
  prova('a Data e o painel usam a Operação (montaFiltros e render pela calcula)', scr.indexOf('const base = calcula(D, sel, { op: F.op });') > 0 &&
    scr.indexOf('const R = calcula(D, sel, F);') > 0 && scr.indexOf("const F = { op: '', dia: '',") > 0);
  prova('Limpar filtros volta a Operação para Todas', (() => {
    /* o handler vai até o render() dele: tem "});" de callback no meio */
    const i = scr.indexOf("$('#limpar').addEventListener('click'");
    const t = scr.slice(i, scr.indexOf('render();', i));
    return i > 0 && t.indexOf("F.op = '';") > 0 && t.indexOf('montaEventos();') > t.indexOf("F.op = '';") && t.indexOf("sel = 'todos';") > 0;
  })());
  prova('Operação não conta na aba da gaveta (ela não mora lá)', scr.indexOf("const FILTROS = ['dia', 'patio', 'farol'];") > 0);
  prova('rótulos das linhas de filtro com a largura de "Operação"', h.indexOf('.rot-dias{min-width:58px}') > 0 && h.indexOf('.rot-dias{min-width:46px}') < 0);
  prova('glossário: Operação, e Novos lojistas e Reativados separados, pelos grupos (12/11)', h.indexOf('["Operação","Os botões acima dos de Evento: Todas, C6 e Itaú') > 0 &&
    ['["Novos lojistas","Lojas cadastradas a partir de 10/11 com usuário no grupo',
      '["Reativados","Lojas antigas desses mesmos grupos que não compraram nada nos 6 meses antes de 10/11 e acessaram a plataforma a partir de 10/11',
      'Os compradores desses 6 meses ficam fora (aparecem só nos acessos), como os internos, os testes e as contas do banco',
      'O cliente do IGA só conta nos eventos do IGA, e o do C6 só nos do C6', 'que termina nesse dia ou depois',
      'quem se cadastrou antes do primeiro dia do evento entra no total, mas em nenhum botão de Data',
      'com a mesma regra dos novos lojistas para operação, evento e Data',
      'sem os reativados, que têm o cartão próprio', 'com o selo ' + String.fromCharCode(92, 34) + 'novo' + String.fromCharCode(92, 34) + ' ou ',
      'as lojas novas e as reativadas do recorte (com ou sem acesso), nas mesmas colunas da tabela e com a coluna Tipo',
      'novos lojistas e reativados (os que entraram naquele dia)', 'total, novas e reativadas',
      'A venda cuja oferta vencedora foi lançada por um usuário interno, sem loja, conta nos vendidos'].every((t) => h.indexOf(t) > 0) &&
    h.indexOf('Lojas novas e antigas que voltaram, somadas') < 0 && h.indexOf('Somente novos') < 0 &&
    D0.glossario.findIndex((g) => g[0] === 'Reativados') === D0.glossario.findIndex((g) => g[0] === 'Novos lojistas') + 1 &&
    D0.glossario.findIndex((g) => g[0] === 'Operação') === D0.glossario.findIndex((g) => g[0] === 'Evento') - 1);
})();

console.log((falhas ? '✗' : '✓') + ' %d provas, %d falha(s)', ok + falhas, falhas);
if (falhas) process.exit(1);
