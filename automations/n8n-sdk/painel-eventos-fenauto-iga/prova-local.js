/* Provas do Mega Evento Fenauto (IGA) — sem n8n e sem banco.

   Copiadas em 05/11 das provas do Mega Evento Fenauto (Cars2You). Mudou só a
   cara: identidade do IGA (tema.css + tema-iga.css), logo do IGA à esquerda,
   título e subtítulo à direita, a Fenauto fechando a barra e o botão de tema
   numa linha abaixo do cabeçalho. O resto das provas é o do irmão.
   Ainda em 05/11: só os eventos do IGA (os do C6 saíram) e o título e o
   subtítulo voltaram ao centro.


     node prova-local.js

   Portadas em 03/11 das provas do Eventos Fenauto C6. Mudou o que mudou no
   painel: identidade da Cars2You (sem a camada nem a logo do C6), a Fenauto
   à esquerda com o título e o subtítulo à direita, os eventos do C6 e do
   IGA da semana, a loja nova pela campanha da Fenauto e o filtro de evento
   em botões. Ficou tudo que provava as contas.

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
/* o filtro de usuário externo da loja nova (12/11): o único lugar onde o
   e-mail pode aparecer, e só como filtro — nunca como coluna */
const EXTERNO_ESPERADO = "uc.deleted_at IS NULL AND uc.email NOT LIKE '%@cars2you.com.br' AND uc.email NOT LIKE '%@itau%'" +
  " AND uc.email NOT LIKE '%@c6bank%' AND uc.email NOT LIKE '%teste%'";
itens.forEach((it) => {
  const q = it.json;
  const low = q.sql.split(EXTERNO_ESPERADO).join('').toLowerCase();
  prova(q.queryName + ': uma linha só (COUNT + JSON_ARRAYAGG)',
    q.sql.indexOf('SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(') === 0);
  prova(q.queryName + ': sem função de janela', q.sql.toUpperCase().indexOf('OVER(') < 0 &&
    q.sql.toUpperCase().indexOf('OVER (') < 0);
  prova(q.queryName + ': sem NOW/CURDATE (o banco é UTC)', q.sql.indexOf('NOW(') < 0 && q.sql.indexOf('CURDATE') < 0);
  prova(q.queryName + ': recorte só IGA (vendedores 594, 598 e 16036), e o que alveja o 43 (C6) fora',
    q.sql.indexOf('ai.shop_id IN (594,598,16036)) AND NOT EXISTS (SELECT 1 FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id = 43)') > 0 &&
    q.sql.indexOf(' OR EXISTS') < 0);
  prova(q.queryName + ': o mês em literal, nas duas pontas', q.sql.indexOf("e.start_date_offer < '" + q.meta.mes[1] + "'") > 0 &&
    q.sql.indexOf("e.finish_date_event >= '" + q.meta.mes[0] + "'") > 0, q.meta.mes);
  /* 09/11: só evento com Fenauto no nome */
  prova(q.queryName + ': só evento com "fenauto" no nome', q.sql.indexOf("e.name LIKE '%fenauto%'") > 0 &&
    q.meta.nome_evento === 'fenauto');
  prova(q.queryName + ': teto de 31 dias de duração (o balde 266)', q.sql.indexOf('DATEDIFF(e.finish_date_event, e.start_date_offer) <= 31') > 0);
  prova(q.queryName + ': acesso sem trava de canal (o IGA vende pelos 5 e 7)', q.sql.indexOf('al.whitelabel_id') < 0);
  prova(q.queryName + ': sem documento de pessoa',
    ['document', 'email', 'phone', 'renavam'].every((p) => low.indexOf(p) < 0));
  /* placa e chassi saíram em 28/09: nem na consulta */
  prova(q.queryName + ': sem placa nem chassi', low.indexOf('plate') < 0 && low.indexOf('chassi') < 0);
  /* sem representante, sem CNPJ (26/10): no C6 ele era a chave da carteira */
  prova(q.queryName + ': sem CNPJ', low.indexOf('cnpj') < 0);
});
const sqlDe = (n) => itens.find((i) => i.json.queryName === n).json.sql;
/* o mês (09/11; antes a semana): do dia 1 00:00 ao dia 1 do mês seguinte, e hoje dentro dele */
(() => {
  const m = itens[0].json.meta;
  const ini = new Date(m.mes[0].slice(0, 10) + 'T00:00:00Z');
  const fim = new Date(m.mes[1].slice(0, 10) + 'T00:00:00Z');
  const proximo = new Date(Date.UTC(ini.getUTCFullYear(), ini.getUTCMonth() + 1, 1));
  prova('mês: começa no dia 1, acaba no dia 1 do seguinte e contém agora', ini.getUTCDate() === 1 &&
    fim.getTime() === proximo.getTime() && m.mes[0].slice(11) === '00:00:00' && m.mes[1].slice(11) === '00:00:00' &&
    m.agora_br >= m.mes[0].slice(0, 16) && m.agora_br < m.mes[1].slice(0, 16), m);
})();
prova('eventos: a operação sai do mesmo critério do recorte (C6 = alveja o 43)',
  sqlDe('eventos').indexOf("CASE WHEN EXISTS (SELECT 1 FROM event_whitelabels ew WHERE ew.event_id = e.id AND ew.whitelabel_id = 43) THEN 'C6' ELSE 'IGA' END") > 0);
prova('acesso ao evento por evento (03/11): cada parte agrupa pelo evento e traz a coluna',
  PARTES_NOMES.every((n) => sqlDe(n).indexOf('GROUP BY e.id, al.shop_id,') > 0 &&
    itens.find((i) => i.json.queryName === n).json.cols.join() === 'loja,dia,hora,n,evento'));
/* loja nova (Thomas, 12/11): cliente do grupo da Fenauto do IGA com
   entrada. O SQL conferido pedaço a pedaço contra a regra */
(() => {
  const mL = itens.find((i) => i.json.queryName === 'lojas').json;
  const sqlL = mL.sql;
  const INI = mL.meta.inicio_campanha;
  const DESDE = mL.meta.sem_compra_desde;
  const conta = (s, t) => s.split(t).length - 1;
  prova('loja nova: início em 10/11/2026 e janela sem compra desde 6 meses antes (10/05/2026), grupo 148, no meta de toda consulta',
    itens.every((i) => i.json.meta.inicio_campanha === '2026-11-10 00:00:00' && i.json.meta.sem_compra_desde === '2026-05-10 00:00:00' &&
      i.json.meta.meses_sem_compra === 6 && JSON.stringify(i.json.meta.grupos_iga) === '[148]' &&
      i.json.meta.grupo_iga_nome === 'VD Itaú - Fenauto 2026' && i.json.meta.campanha_novas === undefined), mL.meta);
  prova('loja nova: o grupo 148, uma vez, só na consulta de lojas', conta(sqlL, 'ucg.client_group_id IN (148))') === 1 &&
    itens.every((i) => i.json.queryName === 'lojas' || i.json.sql.indexOf('client_group') < 0));
  prova('loja nova: só usuário externo (não apagado; sem @cars2you.com.br, @itau, @c6bank nem "teste" no e-mail)',
    conta(sqlL, 'INNER JOIN users uc ON uc.id = ucg.user_id AND ' + EXTERNO_ESPERADO + ' INNER JOIN user_shops usc ON usc.user_id = uc.id') === 1 &&
    itens.every((i) => i.json.queryName === 'lojas' || i.json.sql.indexOf('email') < 0));
  prova('loja nova: loja apagada ou com "teste" no nome fica fora',
    sqlL.indexOf("INNER JOIN shops cs ON cs.id = cg.shop_id AND cs.deleted_at IS NULL AND cs.name NOT LIKE '%teste%'") > 0);
  prova('loja nova: compra = oferta vencedora de negociação vendida (2, 3, 7), em [10/05, 10/11)',
    conta(sqlL, 'FROM offers oc INNER JOIN advertisement_negotiations anc ON anc.offer_actual_id = oc.id AND anc.deleted_at IS NULL AND anc.status IN (2, 3, 7)' +
      " WHERE oc.deleted_at IS NULL AND oc.buyer_shop_id IS NOT NULL AND oc.created_at >= '" + DESDE + "' AND oc.created_at < '" + INI + "') cp ON cp.shop_id = cs.id") === 1);
  prova('loja nova: a volta é UMA passada agrupada no access_logs, de 10/11 em diante, sem correlacionar por loja',
    conta(sqlL, "FROM access_logs alv WHERE alv.created_at >= '" + INI + "' AND alv.shop_id IS NOT NULL GROUP BY alv.shop_id) va ON va.shop_id = cs.id") === 1 &&
    conta(sqlL, 'access_logs') === 2 && sqlL.indexOf('alv.shop_id = s') < 0 && sqlL.indexOf('alv.shop_id = cs') < 0);
  prova('loja nova: entrada = cadastro da loja de 10/11 em diante, senão a volta; sai só quem é nova ou voltou sem compra',
    sqlL.indexOf("DATE_FORMAT(IF(cs.created_at >= '" + INI + "', cs.created_at, va.volta), '%Y-%m-%d %H:%i') AS entrada") > 0 &&
    sqlL.indexOf("WHERE cs.created_at >= '" + INI + "' OR (va.volta IS NOT NULL AND cp.shop_id IS NULL)) f) u0 GROUP BY u0.id) ids") > 0);
  prova('loja nova: a entrada viaja no universo (coluna fenauto = ids.fen), os clientes uma vez só, sem CTE',
    mL.cols.indexOf('fenauto') > 0 && sqlL.indexOf('ids.fen') > 0 && sqlL.indexOf('SELECT u0.id, MAX(u0.fen) AS fen FROM (') > 0 &&
    conta(sqlL, 'FROM user_clients_group') === 1 && sqlL.toUpperCase().indexOf('WITH ') < 0);
  prova('loja nova: a regra do formulário saiu (sem up3, sem "fenauto" solto, sem C6; a campanha do ano só no cartão de regiões)',
    sqlL.indexOf('up3') < 0 && sqlL.indexOf("register_form_value LIKE '%fenauto%'") < 0 && sqlL.indexOf(" c6%'") < 0 &&
    conta(sqlL, 'register_form_value') === 2);
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
   A coleta DE PROVA (dados-prova.json, 09/11): o mesmo SQL com o mês da
   Fenauto 2025 (novembro/2025): um evento, o 22223. Até 08/11 era a semana
   de 17/11/2025, com 7 eventos do IGA. Novembro/2026 tem os 3 eventos da
   Fenauto, mas eles só abrem em 11/11: sem lance, sem acesso, sem cadastro,
   e conta refeita sobre zero não prova nada. */
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
   interno, 516768 em 11/11) conta nos vendidos e no valor, não nos
   compradores nem nos lances — planta tirando a loja da vencedora de uma
   venda; com Data, a venda segue no dia da oferta vencedora */
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
  prova('venda com a oferta vencedora sem loja: conta nos vendidos e no valor, fora dos lances; com Data, no dia da vencedora',
    o.resumo.kpi.vendidos === R.kpi.vendidos && o.resumo.kpi.volume === R.kpi.volume && o.resumo.kpi.lances === R.kpi.lances - 1 &&
    o.resumo.kpi.compradores <= R.kpi.compradores && Ds.veiculos.some((v) => v.neg === Number(vend.neg) && v.arrematante === null) &&
    calculaDaPagina(Ds, 'todos', { dia: cod }).kpi.vendidos === calculaDaPagina(D0v, 'todos', { dia: cod }).kpi.vendidos &&
    calculaDaPagina(Ds, 'todos', { dia: cod }).kpi.vendidos > 0,
    [o.resumo.kpi.vendidos, R.kpi.vendidos, o.resumo.kpi.lances, R.kpi.lances, cod]);
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

/* medição independente (consulta à parte, antes do nó rodar; 03/11 e
   09/11): veículos publicados e operação de cada evento. Encerrados, não
   mudam mais. TODOS têm que estar na coleta: um evento que sumisse do
   recorte seria um evento a menos, calado. Desde 09/11 só o da Fenauto do
   IGA de novembro/2025. FORA: os 4 do C6 da semana dela (o 22231 tem
   "FENAUTO 2025" no nome: cai pela trava do 43) e os 21 do IGA do mês sem
   Fenauto no nome (medidos em 09/11). */
const MEDIDO = { 22223: [24, 'IGA'] };
const MEDIDO_C6 = [22212, 22227, 22228, 22231];
const MEDIDO_IGA_SEM_FENAUTO = [22142, 22146, 22162, 22167, 22179, 22189, 22198, 22205, 22210, 22214, 22229,
  22235, 22241, 22237, 22242, 22248, 22255, 22260, 22273, 22283, 22289];
prova('coleta de prova: o evento da Fenauto do IGA medido, nem um a mais', R.por_evento.length === 1 &&
  Object.keys(MEDIDO).every((id) => R.por_evento.some((x) => x.id === Number(id))), R.por_evento.map((x) => x.id));
prova('coleta de prova: os 4 eventos do C6 ficaram fora, com Fenauto no nome ou não', MEDIDO_C6.every((id) =>
  R.por_evento.every((x) => x.id !== id) && cru.eventos.every((x) => Number(x.id) !== id)));
prova('coleta de prova: os 21 eventos do IGA do mês sem Fenauto no nome ficaram fora', MEDIDO_IGA_SEM_FENAUTO.every((id) =>
  cru.eventos.every((x) => Number(x.id) !== id)));
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
const eventosCru = cru.eventos.map((e) => ({ id: Number(e.id), ini: e.ini, fim: e.fim }));
const perTodos = periodoDe(eventosCru);
const diasTodos = diasNoPeriodo(perTodos);
const lojaCru = {};
cru.lojas.forEach((l) => { lojaCru[l.id] = l; });
/* loja nova (Thomas, 12/11): a ENTRADA do cliente do grupo (coluna crua
   "fenauto": cadastro da loja nova ou primeiro acesso de quem voltou) até
   o dia do fim do evento, o dia inteiro, sem piso no início do evento; com
   Data, igual àquele dia. Aqui a conta é evento a evento, sobre a coluna
   crua; no nó é o mesmo corte, escrito de outro jeito */
const novaCru = (evs, soDia) => cru.lojas.filter((l) => l.fenauto && !Number(l.apagada) &&
  (soDia ? l.fenauto.slice(0, 10) === soDia : evs.some((e) => l.fenauto.slice(0, 10) <= e.fim.slice(0, 10))));
/* 12/11 (tarde): separadas — nova = loja cadastrada desde o início da
   campanha; reativada = loja anterior a ele (a entrada é a volta) */
const INI_CAMP = d.consultas.find((c) => c.json.queryName === 'lojas').json.meta.inicio_campanha.slice(0, 16);
const ehReat = (l) => String(l.cadastro || '') < INI_CAMP;
const novaCruN = (evs, soDia) => novaCru(evs, soDia).filter((l) => !ehReat(l));
const novaCruR = (evs, soDia) => novaCru(evs, soDia).filter(ehReat);
const novasTodos = novaCru(eventosCru);
const cadTodos = novasTodos.filter((l) => !ehReat(l));
const reatTodos = novasTodos.filter(ehReat);
const ehNovaT = {};
novasTodos.forEach((l) => { ehNovaT[l.id] = ehReat(l) ? 'R' : 'N'; });
const nTot = (k) => k.novas + k.reativadas;
prova('lojas novas = entrada até o dia do fim de algum evento, refeito da coluna crua; separadas em novas e reativadas',
  R.kpi.novas === cadTodos.length && R.kpi.reativadas === reatTodos.length && cadTodos.length > 0 && reatTodos.length > 0,
  [R.kpi.novas, cadTodos.length, R.kpi.reativadas, reatTodos.length]);
prova('loja nova evento a evento: cada um com as entradas até o dia do fim dele', R.por_evento.every((e) =>
  e.kpi.novas === novaCruN(eventosCru.filter((x) => x.id === e.id)).length &&
  e.kpi.reativadas === novaCruR(eventosCru.filter((x) => x.id === e.id)).length), R.por_evento.map((e) => [e.id, e.kpi.novas, e.kpi.reativadas]));
prova('reativada: tem entrada, loja anterior ao início da campanha e entrada depois do cadastro', D0.lojas.filter((l) => l.reativada).length ===
  cru.lojas.filter((l) => l.fenauto && ehReat(l)).length && D0.lojas.every((l) => !l.reativada || (l.fenauto && l.fenauto > l.cadastro)));
/* a coleta de prova (12/11): o grupo da Fenauto 2025 (133) com a campanha
   em 10/11/2025, e o 22223 de 19 a 21/11/2025 */
(() => {
  const mP = d.consultas.find((c) => c.json.queryName === 'lojas').json.meta;
  const ini = mP.inicio_campanha.slice(0, 16);
  const priDia = eventosCru.map((e) => e.ini.slice(0, 10)).sort()[0];
  const ultDia = eventosCru.map((e) => e.fim.slice(0, 10)).sort().pop();
  const comEntrada = cru.lojas.filter((l) => l.fenauto);
  prova('coleta: toda entrada é do início da campanha em diante', comEntrada.length > 0 && comEntrada.every((l) => l.fenauto >= ini), ini);
  prova('coleta: loja cadastrada desde o início da campanha entra pelo cadastro', comEntrada.filter((l) => l.cadastro >= ini).length > 0 &&
    comEntrada.filter((l) => l.cadastro >= ini).every((l) => l.fenauto === l.cadastro));
  prova('coleta: loja antiga que voltou é nova pela data do primeiro acesso, não a do cadastro',
    novasTodos.some((l) => l.cadastro < ini && l.fenauto >= ini), novasTodos.filter((l) => l.cadastro < ini).length);
  const depois = comEntrada.filter((l) => !Number(l.apagada) && !ehNovaT[l.id]);
  prova('coleta: entrada depois do fim de todos os eventos não é nova', depois.length > 0 &&
    depois.every((l) => l.fenauto.slice(0, 10) > ultDia), depois.length);
  const antes = novasTodos.filter((l) => l.fenauto.slice(0, 10) < priDia);
  const todosD = calculaDaPagina(D0, 'todos', {});
  const somaBotoes = todosD.dias_periodo.reduce((t, c) => t + nTot(calculaDaPagina(D0, 'todos', { dia: c }).kpi), 0);
  prova('coleta: quem entrou antes do 1º dia do evento conta no total, mas em nenhum botão de Data', antes.length > 0 &&
    antes.every((l) => !!todosD.nova[l.id]) && somaBotoes === novasTodos.length - antes.length &&
    todosD.dias_periodo.every((c) => antes.every((l) => !calculaDaPagina(D0, 'todos', { dia: c }).nova[l.id])),
    [antes.length, somaBotoes, novasTodos.length]);
})();
prova('coleta: todo evento toca o mês dela, dura no máximo 31 dias e tem Fenauto no nome', cru.eventos.every((e) =>
  e.ini < d.consultas[0].json.meta.mes[1].slice(0, 16) && e.fim >= d.consultas[0].json.meta.mes[0].slice(0, 16) &&
  (new Date(e.fim.slice(0, 10)) - new Date(e.ini.slice(0, 10))) / 86400000 <= 31 &&
  String(e.nome).toLowerCase().indexOf('fenauto') >= 0));
prova('coleta: só eventos do IGA, nenhum que alveje o 43', cru.eventos.length > 0 &&
  cru.eventos.every((e) => e.op === 'IGA' && String(e.wls).split(',').indexOf('43') < 0));
prova('coleta: loja sem entrada nunca é nova', cru.lojas.some((l) => !l.fenauto) &&
  calculaDaPagina(D0, 'todos', {}).lojas.filter((r) => r.nova).every((r) => cru.lojas.find((l) => Number(l.id) === r.loja).fenauto));

/* o dia do fim vale INTEIRO e não há piso no início do evento (12/11):
   planta a entrada em três lojas que não a têm — às 23:59 do último dia
   (depois de o evento fechar, às 16h), às 00:01 do dia seguinte e no dia
   do início da campanha, antes do primeiro dia do evento. A primeira é
   nova, a segunda não, a terceira é nova no total e em nenhum botão de
   Data */
(() => {
  const sint = JSON.parse(JSON.stringify(d));
  const iL = NOMES.indexOf('lojas');
  const cols = sint.consultas[iL].json.cols;
  const row = sint.mcp[iL].json.structuredContent.rows[0];
  const linhas = JSON.parse(row[1]);
  const fora = linhas.filter((a) => !a[cols.indexOf('fenauto')] && !Number(a[cols.indexOf('apagada')])).slice(0, 3);
  const ultimo = perTodos[1].slice(0, 10);
  const seguinte = new Date(Date.UTC(Number(ultimo.slice(0, 4)), Number(ultimo.slice(5, 7)) - 1, Number(ultimo.slice(8, 10)) + 1)).toISOString().slice(0, 10);
  const diaCampanha = sint.consultas[iL].json.meta.inicio_campanha.slice(0, 10);
  fora[0][cols.indexOf('fenauto')] = ultimo + ' 23:59';
  fora[1][cols.indexOf('fenauto')] = seguinte + ' 00:01';
  fora[2][cols.indexOf('fenauto')] = diaCampanha + ' 08:00';
  row[1] = JSON.stringify(linhas);
  const o = roda('montar-painel.js', Object.assign({}, nos, { 'MCP Consultas': sint.mcp }))[0].json;
  const Ds = dadosDe(o.html);
  const r = calculaDaPagina(Ds, 'todos', {});
  const id0 = Number(fora[0][cols.indexOf('id')]);
  const id1 = Number(fora[1][cols.indexOf('id')]);
  const id2 = Number(fora[2][cols.indexOf('id')]);
  prova('entrada às 23:59 do último dia do evento é nova; às 00:01 do dia seguinte, não',
    perTodos[1].slice(11, 16) < '23:59' && eventosCru.every((e) => e.ini.slice(0, 10) > seguinte || e.fim.slice(0, 10) < seguinte) &&
    !!r.nova[id0] && !r.nova[id1] && nTot(o.resumo.kpi) === nTot(R.kpi) + 2,
    [perTodos[1], !!r.nova[id0], !!r.nova[id1], nTot(o.resumo.kpi), nTot(R.kpi)]);
  prova('entrada no dia do início da campanha, antes do evento: nova no total e no evento, em nenhum botão de Data',
    diaCampanha < perTodos[0].slice(0, 10) && !!r.nova[id2] && !!calculaDaPagina(Ds, eventosCru[0].id, {}).nova[id2] &&
    r.dias_periodo.length > 0 && r.dias_periodo.every((c) => !calculaDaPagina(Ds, 'todos', { dia: c }).nova[id2]) &&
    !!calculaDaPagina(Ds, 'todos', { dia: r.dias_periodo[r.dias_periodo.length - 1] }).nova[id0],
    [diaCampanha, perTodos[0], !!r.nova[id2]]);
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

/* o filtro de evento (03/11). Até 08/11 havia aqui a prova de DOIS eventos
   do IGA no mesmo horário (22223 x 22235), cada um com os acessos dele. Com
   o recorte só da Fenauto (09/11), novembro/2025 tem um evento só e a prova
   ficou sem dado real; o acesso de evento fora do recorte na mesma hora
   segue provado mais abaixo (o evento 999999 plantado). Os 3 de novembro/
   2026 abrem juntos em 11/11: depois disso, voltar com ela sobre eles.
   ("c6" ficou como nome: o evento escolhido) */
(() => {
  const c6 = eventosCru.find((e) => e.id === 22223);
  const so = (e) => diasNoPeriodo([e.ini, e.fim], null, [e.id]);
  const rc = calculaDaPagina(D0, c6.id, {});
  prova('o evento 22223 com os acessos dele, refeitos do cru',
    rc.kpi.lojas_acessaram === Object.keys(so(c6)).length && rc.kpi.lojas_acessaram > 0,
    [rc.kpi.lojas_acessaram, Object.keys(so(c6)).length]);
  prova('evento: os gráficos por dia e por hora também cortados pelo evento', rc.por_dia.every((x) => x.total <=
    Object.keys(so(c6)).length));
  prova('evento: veículos, lances e novos só dele', rc.veiculos.every((v) => v.ev === c6.id) &&
    rc.kpi.lances === ofCom.filter((o) => cru.veiculos.some((v) => v.neg === o.neg && Number(v.evento) === c6.id)).length &&
    rc.kpi.novas === novaCruN([c6]).length && rc.kpi.reativadas === novaCruR([c6]).length);
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
prova('por hora: total e novos recalculados do cru', todosPag.por_hora.every((x) => x.total === hc.t[x.h] && x.novas === hc.nv[x.h] && x.reativadas === hc.rv[x.h]) &&
  hc.rv.some((n) => n > 0));
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
prova('acessos únicos por dia: novas ≤ total, todo dia', todosPag.por_dia.length > 0 &&
  todosPag.por_dia.every((x) => x.novas <= x.total));
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
prova('aprovados = cadastros novos em situation 3', F[0] === cadTodos.length && F[1] === cadTodos.filter((l) => Number(l.situacao) === 3).length);
prova('acessaram = novos com dia de acesso no período', F[2] === cadTodos.filter((l) => diasTodos[l.id]).length &&
  R.kpi.reativadas_acessaram === reatTodos.filter((l) => diasTodos[l.id]).length);
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
prova('Data ' + dataF + ': novos = entraram naquele dia', fd.kpi.novas === novaCruN(eventosCru, dataF).length &&
  fd.kpi.reativadas === novaCruR(eventosCru, dataF).length, [fd.kpi.novas, novaCruN(eventosCru, dataF).length]);
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
/* ── identidade do IGA (Thomas, 05/11) ─────────────────────────────── */
const DESIGN = path.join(__dirname, '..', '..', '..', 'design');
const lerD = (...p) => fs.readFileSync(path.join(DESIGN, ...p), 'utf8');
prova('identidade do IGA: tema.css e, depois dele, a camada tema-iga.css', (() => {
  const inj = fs.readFileSync(path.join(__dirname, '_aplica-modelo.js'), 'utf8');
  return inj.indexOf("compacta(ler('tokens', 'tema.css')) + compacta(ler('tokens', 'tema-iga.css'))") > 0 &&
    inj.indexOf('tema-c6.css\')') < 0 && injetor.blocoTema.length > 5000;
})());
prova('claro do IGA: texto #000D3C, dado #001FBD, campo #DDE1EE, Total em laranja escurecido', (() => {
  const a = h.indexOf('--texto:          #000D3C;');
  return a > 0 && h.indexOf('--acento-cheio:   #001FBD;') > 0 && h.indexOf('--fundo:          #DDE1EE;') > 0 &&
    h.indexOf('--serie-2:        #C94E00;') > 0;
})());
prova('escuro do IGA: acento laranja #FF6200, dado #7C93FF, fundo #0B1020', h.indexOf('--acento:         #FF6200;') > 0 &&
  h.indexOf('--acento-cheio:   #7C93FF;') > 0 && h.indexOf('--fundo:          #0B1020;') > 0);
prova('a camada do IGA vence o tema: vem depois dele na folha', (() => {
  const t = h.indexOf('--texto:          #3A4552;');
  const i = h.indexOf('--texto:          #000D3C;');
  return t > 0 && i > t && i < h.indexOf('</style>');
})());
prova('o painel não repõe o cinza da Cars2You na barra Total (a 2ª série é a do IGA)',
  h.indexOf('--serie-2:#748290') < 0 && h.indexOf('--serie-2:#646E86') < 0 &&
  h.indexOf(':root{--farol-abaixo:#946200}') > 0 && h.indexOf('[data-tema="escuro"]{--farol-abaixo:#E3B341}') > 0);
prova('sem a camada do C6', h.indexOf('#DCDCDC') < 0 && h.indexOf('#FFC000') < 0);

/* a logo do IGA: SVG inline, uma cópia só, da arte do design. Tinta e barra
   azul viram classe (a cor de cada tema é CSS); o laranja fica atributo */
prova('logo do IGA inline, a que o injetor produz da arte do design, uma vez só',
  h.indexOf(injetor.logoIga) > 0 && h.split('<title>IGA</title>').length === 2 &&
  (injetor.logoIga.match(/class="iga-t"/g) || []).length === 22 && (injetor.logoIga.match(/class="iga-a"/g) || []).length === 1 &&
  (injetor.logoIga.match(/fill="#FF6200"/g) || []).length === 1 && injetor.logoIga.indexOf('#000D3C') < 0 &&
  injetor.logoIga.indexOf('#001FBD') < 0 && injetor.logoIga.indexOf('viewBox="0 0 107 48"') > 0);
prova('logo do IGA: as mesmas 24 formas da arte, coordenadas com até duas casas', (() => {
  const ds = injetor.logoIga.match(/ d="[^"]*"/g) || [];
  return ds.length === 24 && (lerD('marca', 'iga', 'logo-iga-claro.svg').match(/ d="/g) || []).length === 24 &&
    ds.every((d) => !/[0-9][.][0-9]{3}/.test(d));
})());
prova('logo do IGA tem nome', injetor.logoIga.indexOf('role="img" aria-label="IGA"') > 0);
prova('claro: IGA em #000D3C e #001FBD, como a logo-iga-claro.svg',
  h.indexOf('.logo-iga .iga-t{fill:#000D3C}.logo-iga .iga-a{fill:#001FBD}') > 0 &&
  lerD('marca', 'iga', 'logo-iga-claro.svg').indexOf('fill="#000D3C"') > 0);
prova('escuro: IGA em branco e #7C93FF, como a logo-iga-escuro.svg',
  h.indexOf('[data-tema="escuro"] .logo-iga .iga-t{fill:#FFFFFF}[data-tema="escuro"] .logo-iga .iga-a{fill:#7C93FF}') > 0 &&
  lerD('marca', 'iga', 'logo-iga-escuro.svg').indexOf('fill="#7C93FF"') > 0 &&
  lerD('marca', 'iga', 'logo-iga-escuro.svg').indexOf('fill="#FFFFFF"') > 0);

/* a logo da Fenauto (com a Cars2You): a mesma do irmão; muda só a cor do claro */
prova('logo da Fenauto inline, a que o injetor produz da arte do design, uma vez só',
  h.indexOf(injetor.logoFenauto) > 0 && h.split('<title>FENAUTO com Cars2You</title>').length === 2 &&
  (injetor.logoFenauto.match(/fill="#242424"/g) || []).length === 2 && h.indexOf('#403172') < 0);
prova('logo da Fenauto: coordenadas com uma casa, escala da Cars2You intacta', (() => {
  const ds = injetor.logoFenauto.match(/ d="[^"]*"/g) || [];
  return ds.length === 9 && ds.every((d) => !/[0-9][.][0-9][0-9]/.test(d)) && injetor.logoFenauto.indexOf('scale(0.46088)') > 0;
})());
prova('a logo da Fenauto tem nome: o do SVG', injetor.logoFenauto.indexOf('role="img" aria-label="FENAUTO com Cars2You"') > 0);
prova('claro: a Fenauto no #000D3C do IGA, não no #3A4552 da Cars2You',
  h.indexOf('.logo-fen path,.logo-fen g{fill:#000D3C}') > 0 && h.indexOf('.logo-fen path,.logo-fen g{fill:#3A4552}') < 0);
prova('escuro: a Fenauto em branco pelo CSS, como a logo-fenauto-escuro.svg',
  h.indexOf('[data-tema="escuro"] .logo-fen path,[data-tema="escuro"] .logo-fen g{fill:#FFFFFF}') > 0 &&
  lerD('marca', 'fenauto', 'logo-fenauto-escuro.svg').indexOf('#FFFFFF') > 0);
prova('troca de tema não mexe em logo: a cor é CSS', scr.indexOf("$('#logo')") < 0 && scr.indexOf('LOGO[') < 0 &&
  scr.indexOf("$('#logo-fen')") < 0 && scr.indexOf("$('#logo-iga')") < 0);
prova('as duas logos com 44px, 26px no telefone', h.indexOf('.logo-iga svg{display:block;height:44px;') > 0 &&
  h.indexOf('.logo-fen svg{display:block;height:44px;') > 0 &&
  h.indexOf('@media (max-width:620px){.logo-iga svg,.logo-fen svg{height:26px}') > 0);

/* topo (Thomas, 05/11): IGA à esquerda; título e subtítulo à direita; a
   Fenauto fechando a barra; nenhum botão dentro do cabeçalho */
const cab = semScript.slice(semScript.indexOf('<header class="topo">'), semScript.indexOf('</header>') + 9);
prova('topo: o IGA à esquerda, primeiro filho da barra', (() => {
  const i = semScript.indexOf('<div class="topo-in">');
  return i > 0 && semScript.indexOf('<span class="marca logo-iga" id="logo-iga">' + injetor.logoIga + '</span>') === i + '<div class="topo-in">'.length;
})());
prova('topo: o IGA, depois título e subtítulo, a Fenauto por último', (() => {
  const t = cab.indexOf('<div class="topo-tit"><h1>Mega evento Fenauto</h1><p class="sub" id="sub"></p></div>');
  const f = cab.indexOf('<span class="marca logo-fen" id="logo-fen">' + injetor.logoFenauto + '</span>');
  return t > cab.indexOf('id="logo-iga"') && f > t && cab.slice(f).indexOf('</span></div></header>') === injetor.logoFenauto.length +
    '<span class="marca logo-fen" id="logo-fen">'.length;
})());
prova('topo: título e subtítulo no centro, na grade do tema (1fr auto 1fr)', (() => {
  const g = h.indexOf('grid-template-columns:1fr auto 1fr');
  return g > 0 && h.indexOf('.topo-tit{ text-align:center') > 0 && h.indexOf('.topo-tit{text-align:right}') < 0 &&
    h.indexOf('.topo-in{grid-template-columns:auto minmax(0,1fr) auto}') === h.indexOf('@media (max-width:620px){.logo-iga svg') +
      '@media (max-width:620px){.logo-iga svg,.logo-fen svg{height:26px}'.length;
})());
prova('topo: cada logo encosta na sua ponta', h.indexOf('.marca.logo-iga{justify-self:start}.marca.logo-fen{justify-self:end}') > 0);
prova('topo: nenhum botão dentro do cabeçalho', cab.indexOf('<button') < 0 && cab.indexOf('topo-acoes') < 0 &&
  cab.indexOf('b-tema') < 0 && cab.indexOf('b-aviso') < 0);
prova('subtítulo: o evento escolhido ou a semana, e "com filtros"', scr.indexOf("$('#sub').textContent = (ev") > 0 &&
  scr.indexOf("'IGA · '") > 0 && scr.indexOf("'C6 e IGA · '") < 0 && scr.indexOf("' · com filtros'") > 0);

/* botão de tema numa linha logo abaixo do cabeçalho (Thomas, 05/11), com o
   de avisos; fora do topo fixo */
prova('botão de tema logo abaixo do cabeçalho, antes da área', (() => {
  const fimCab = semScript.indexOf('</header>') + 9;
  const linha = semScript.indexOf('<div class="sob-topo topo-acoes">');
  const tema = semScript.indexOf('id="b-tema"');
  return linha === fimCab && tema > linha && tema < semScript.indexOf('</div>', linha) &&
    tema < semScript.indexOf('<main class="area">') && semScript.split('id="b-tema"').length === 2;
})());
prova('o botão de avisos vai junto, antes do de tema', (() => {
  const linha = semScript.indexOf('<div class="sob-topo topo-acoes">');
  const a = semScript.indexOf('id="b-aviso"');
  return a > linha && a < semScript.indexOf('id="b-tema"') && semScript.split('id="b-aviso"').length === 2;
})());
prova('a linha dos botões à direita, alinhada com a área, e rola com a página', (() => {
  const css = '.sob-topo{max-width:1680px;margin:0 auto;padding:10px 20px 0;display:flex;justify-content:flex-end;align-items:center;gap:8px;justify-self:stretch}';
  const regra = h.slice(h.indexOf('.sob-topo{'), h.indexOf('}', h.indexOf('.sob-topo{')) + 1);
  return h.indexOf(css) > 0 && regra.indexOf('position') < 0 && h.indexOf('.sob-topo{padding:8px 12px 0}') > 0;
})());
prova('o botão de tema continua trocando o tema', scr.indexOf("$('#b-tema').addEventListener('click'") > 0 &&
  scr.indexOf("const b = $('#b-tema');") > 0);
prova('aba do navegador: Mega evento Fenauto', h.indexOf('<title>Mega evento Fenauto</title>') > 0 && h.indexOf('Eventos Fenauto C6') < 0);
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
prova('botões de Evento: Todos e um por evento, na ordem de início, com o estado (sem o selo C6/IGA: só há IGA)',
  scr.indexOf("D.eventos.slice().sort((a, b) => (a.ini < b.ini ? -1 : a.ini > b.ini ? 1 : a.id - b.id))") > 0 &&
  scr.indexOf('data-e="todos"') > 0 &&
  scr.indexOf('<span class="ev-op">') < 0 && h.indexOf('.ev-op{') < 0 && scr.indexOf('<span class="ev-est">') > 0);
prova('botão de evento troca o recorte e refaz a Data', scr.indexOf("sel = v === 'todos' ? 'todos' : Number(v);") > 0 &&
  scr.indexOf("const b = ev.target.closest('button[data-e]');") > 0);
prova('botões de Data fora de cartão, entre os KPIs e o funil', (() => {
  const b = semScript.indexOf('id="f-dias"');
  const fimKpi = semScript.indexOf('</section>', semScript.indexOf('id="k-nv"'));
  const linha = semScript.indexOf('<section class="g3i">', fimKpi);
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
  const g = semScript.lastIndexOf('<section class="g3i">', i);
  return i > 0 && semScript.lastIndexOf('</section>', i) > g;
})());
prova('ranking de lojas com primeiro e último acesso, sem GP nem GN', ["t: 'Primeiro acesso'", "t: 'Último acesso'"]
  .every((t) => scr.indexOf(t) > 0) && ["t: 'Usuário GP'", "t: 'Usuário GN'", "k: 'gp'", "k: 'gn'"].every((t) => h.indexOf(t) < 0));
prova('seis cartões: Performance financeira logo depois de Vendidos; Reativados depois de Novos lojistas', (semScript.match(/class="kpi-val num"/g) || []).length === 6 &&
  semScript.indexOf('id="k-vd"') < semScript.indexOf('id="k-pf"') && semScript.indexOf('id="k-pf"') < semScript.indexOf('id="k-nv"') &&
  semScript.indexOf('id="k-nv"') < semScript.indexOf('id="k-rt"') && h.indexOf('repeat(6,minmax(0,1fr))') > 0 &&
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
prova('farol abaixo do VMV com a cor do tema, nos dois temas', h.indexOf('.farol.abaixo{background:var(--farol-abaixo)}') > 0 &&
  (h.match(/--farol-abaixo:/g) || []).length >= 2);
prova('sem degradê amarelo no escuro', h.indexOf('rgba(255,192,0,.07)') < 0);
prova('pátios fora da grade de duas colunas (linha inteira)', (() => {
  const i = semScript.indexOf('id="th-patios"');
  const g = semScript.lastIndexOf('<section class="g3i">', i);
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
  semScript.indexOf('Somente novos') < 0 &&
  h.indexOf('seg-reps') < 0 && h.indexOf('f-rep') < 0);
/* ordem pedida em 29/09, sem os filtros de usuário; nada disso no topo */
const gav = semScript.slice(semScript.indexOf('id="gaveta"'), semScript.indexOf('</aside>'));
const posG = ['id="seg-lojas"', 'id="f-patio"', 'id="f-farol"'].map((t) => gav.indexOf(t));
prova('gaveta na ordem: Lojistas, Pátio, Status', posG.every((p, i) => p > 0 && (i === 0 || p > posG[i - 1])), posG);
prova('rankings sem botões (os botões de fora da gaveta são só Evento e Data)', semScript.slice(semScript.indexOf('</aside>')).indexOf('class="seg"') < 0 &&
  (semScript.slice(semScript.indexOf('</aside>')).match(/class="seg /g) || []).length === 2);
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
prova('caminho no SharePoint', va.json.caminho === 'Mega%20Evento%20Fenauto%20IGA/mega-evento-fenauto-iga.html', va.json.caminho);
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
  scr.indexOf("'novos-lojistas-mega-evento-fenauto-'") > 0 && scr.indexOf('r.gp') < 0 && scr.indexOf('r.gn') < 0);
prova('sem pontuação nenhuma no nó nem na página', painelFonte.indexOf('pontos') < 0 && painelFonte.indexOf('PONTOS') < 0 && h.indexOf('Pontuação') < 0);
prova('rodapé sem a data da carteira', scr.indexOf('base_reps') < 0);
prova('nada de "Arremate" na tela; Recuperações nas colunas e no cartão', (() => {
  const vis = semScript + scr.slice(scr.indexOf('function APP('));
  return ["t: 'Arremates'", "'Arremate / FIPE'", "'Arremate / VMV'", 'pontos por arremate', 'loja arrematante']
    .every((t) => vis.indexOf(t) < 0 && out.html.indexOf(t) < 0) &&
    ["t: 'Recuperações'", 'Recuperação / FIPE', 'Recuperação / VMV'].every((t) => out.html.indexOf(t) > 0);
})());

/* ── 8. só o IGA (05/11) ─────────────────────────────────────────────── */
prova('todo evento é do IGA e nenhum alveja o 43', D0.eventos.length > 0 && D0.eventos.every((e) =>
  e.op === 'IGA' && e.wls.indexOf(43) < 0));
prova('nenhum aviso de vendedor ou de link fora da operação na coleta de prova', R.avisos.every((a) =>
  a.indexOf('loja vendedora') < 0 && a.indexOf('cars2you.com.br') < 0), R.avisos);
prova('todo vendedor é do IGA: 594, 598 ou 16036', cru.veiculos.length > 0 && cru.veiculos.every((v) =>
  [594, 598, 16036].indexOf(Number(v.vendedor)) >= 0));
prova('link: todo anúncio no cars2you.com.br, nenhum na vitrine do C6', D0.veiculos.some((v) => v.link) &&
  D0.veiculos.filter((v) => v.link).every((v) => v.link.indexOf('https://cars2you.com.br/') === 0));
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
prova('rodapé e glossário falam do mês, da Fenauto e só do IGA', scr.indexOf("' da Fenauto no IGA abertos de '") > 0 &&
  scr.indexOf("' eventos') + ' da Fenauto de '") > 0 && scr.indexOf('semana de') < 0 &&
  h.indexOf('Fenauto' + String.fromCharCode(92, 34) + ' no nome, aberto em algum momento do mês corrente') > 0 &&
  scr.indexOf("' do C6 e do IGA abertos") < 0 &&
  h.indexOf('Evento do IGA (tem veículo do Itaú Unibanco') > 0 && h.indexOf('Os eventos do C6 (os que alvejam o Canal de vendas C6 Auto) ficam fora.') > 0 &&
  h.indexOf('Abre o anúncio no cars2you.com.br, a vitrine dos eventos do IGA.') > 0 &&
  h.indexOf('campanha da Fenauto') > 0 && h.indexOf('grupo de clientes') < 0);
/* 12/11: o glossário de Novos lojistas com a regra do grupo, e a do
   formulário fora */
prova('glossário: Novos lojistas pelo grupo da Fenauto, antigos sem compra que voltaram, quem fica fora e o total sem botão de Data', (() => {
  const mG = d.consultas[0].json.meta;
  const dia = mG.inicio_campanha.slice(8, 10) + '/' + mG.inicio_campanha.slice(5, 7);
  return h.indexOf('["Novos lojistas","Lojas cadastradas a partir de ' + dia + ' com um usuário no grupo ' + mG.grupo_iga_nome +
      '. Ficam fora os usuários internos, os cadastros de teste e as contas do banco.') > 0 &&
    h.indexOf('["Reativados","Lojas antigas do grupo ' + mG.grupo_iga_nome + ' que não compraram nada nos 6 meses antes de ' + dia +
      ' e acessaram a plataforma a partir de ' + dia + '. Os compradores desses 6 meses ficam fora (aparecem só nos acessos)') > 0 &&
    h.indexOf('entra no total, mas em nenhum botão de Data') > 0 &&
    h.indexOf('com um usuário cadastrado pela campanha da Fenauto do IGA do ano') < 0 && h.indexOf('Acesso e cadastro fora dele') < 0;
})());

/* ── 9. lojistas por região e UF (Thomas, 11/11) ────────────────────────
   Só a campanha da Fenauto do ano ("considere somente Fenauto 2026"). */
const consNovas = roda('montar-consultas.js', {});
const sqlLojas = consNovas.find((c) => c.json.queryName === 'lojas').json;
const anoHoje = sqlLojas.meta.mes[0].slice(0, 4);
const ufCaseBase = ler('../analise-base-geral/montar-queries.js').split('const UF_CASE = "')[1].split('";')[0];
prova('consulta de lojas traz a UF do endereço da loja, com a normalização da Análise de Base',
  sqlLojas.cols.indexOf('uf') > 0 && sqlLojas.sql.indexOf('FROM shop_addresses sa WHERE sa.shop_id = s.id AND sa.deleted_at IS NULL') > 0 &&
  sqlLojas.sql.indexOf('(SELECT MIN(' + ufCaseBase + ')') > 0 && sqlLojas.sql.indexOf('shop_stocks') < 0);
prova('consulta de lojas: a campanha do ANO do recorte, na coluna e no universo (em qualquer data)',
  sqlLojas.meta.campanha_ano === 'fenauto ' + anoHoje + ' iga' && sqlLojas.cols[sqlLojas.cols.length - 1] === 'fenauto_ano' &&
  sqlLojas.sql.split("register_form_value LIKE '%fenauto " + anoHoje + " iga%'").length === 3 &&
  sqlLojas.sql.indexOf("up4.register_form_value LIKE '%fenauto " + anoHoje + " iga%' UNION SELECT f.id, f.entrada AS fen FROM (") > 0);
const consProva = d.consultas.find((c) => c.json.queryName === 'lojas').json;
const anoProva = consProva.meta.mes[0].slice(0, 4);
prova('coleta de prova: o ano da campanha acompanha o mês trocado', consProva.meta.campanha_ano === 'fenauto ' + anoProva + ' iga' &&
  consProva.sql.split("'%fenauto " + anoProva + " iga%'").length === 3 && consProva.sql.indexOf("'%fenauto " + anoHoje + " iga%'") < 0 || anoProva === anoHoje);
/* 12/11: a loja nova também anda com o ano — na prova (2025), a campanha
   em 10/11/2025, a janela sem compra desde 10/05/2025 e o grupo 133, "VD
   Itaú - Fenauto 2025", no lugar do 148 */
prova('coleta de prova: início da campanha, janela sem compra e grupo da Fenauto do ano trocados', anoProva === anoHoje || (
  consProva.meta.inicio_campanha === anoProva + '-11-10 00:00:00' && consProva.meta.sem_compra_desde === anoProva + '-05-10 00:00:00' &&
  JSON.stringify(consProva.meta.grupos_iga) === '[133]' && consProva.meta.grupo_iga_nome === 'VD Itaú - Fenauto ' + anoProva &&
  consProva.sql.split("'" + anoProva + "-11-10 00:00:00'").length === 5 && consProva.sql.split("'" + anoProva + "-05-10 00:00:00'").length === 2 &&
  consProva.sql.indexOf('ucg.client_group_id IN (133))') > 0 && consProva.sql.indexOf('(148)') < 0 &&
  consProva.sql.indexOf("'" + anoHoje + "-11-10") < 0 && consProva.sql.indexOf("'" + anoHoje + "-05-10") < 0), consProva.meta);
/* a conta refeita por outro caminho, com UF e cadastro da campanha plantados:
   quatro regiões, uma sigla inválida, uma loja sem UF, cadastros em dois dias
   do evento e um fora deles, uma loja apagada e lojas sem a campanha */
const REG_IND = { Sudeste: ['SP', 'RJ', 'MG', 'ES'], Nordeste: ['BA', 'PE', 'CE', 'AL', 'SE', 'PB', 'RN', 'PI', 'MA'],
  Sul: ['PR', 'SC', 'RS'], 'Centro-Oeste': ['DF', 'GO', 'MT', 'MS'], Norte: ['AM', 'PA', 'AC', 'AP', 'RO', 'RR', 'TO'] };
const regDe = (uf) => Object.keys(REG_IND).find((k) => REG_IND[k].indexOf(uf) >= 0) || 'Não identificada';
const PLANTA = ['SP', 'SP', 'RJ', 'BA', 'PR', 'XX', null, 'DF', 'SP', 'MG'];
const D9 = JSON.parse(JSON.stringify(D0));
const ev9 = D9.eventos.slice().sort((a, b) => (a.ini < b.ini ? -1 : 1))[0];
const dia9a = ev9.ini.slice(0, 10);
const DATAS9 = [dia9a + ' 10:00', dia9a + ' 15:30', null, '2000-01-05 10:00', ev9.fim.slice(0, 10) + ' 09:00', null];
D9.lojas.forEach((l, i) => { l.uf = PLANTA[i % PLANTA.length]; l.fenauto_ano = DATAS9[i % DATAS9.length]; });
const apagada9 = D9.lojas.find((l) => l.fenauto_ano);
apagada9.apagada = true;
const R9 = calculaDaPagina(D9, 'todos', {});
const camp9 = D9.lojas.filter((l) => l.fenauto_ano && !l.apagada);
const rank9 = {};
R9.lojas.forEach((r) => { rank9[r.loja] = r; });
const esperado9 = {};
camp9.forEach((l) => { const g = regDe(l.uf); esperado9[g] = (esperado9[g] || 0) + 1; });
prova('regiões: a soma é o número de lojas da campanha do ano (apagada fora, data fora do evento dentro)', camp9.length > 0 &&
  R9.regioes.reduce((t, r) => t + r.total, 0) === camp9.length && camp9.some((l) => l.fenauto_ano.indexOf('2000-') === 0), [camp9.length]);
prova('regiões: cada região conta o que a UF dela diz, refeito do cru', Object.keys(esperado9).length === R9.regioes.length &&
  R9.regioes.every((r) => esperado9[r.regiao] === r.total && r.ufs.reduce((t, u) => t + u.total, 0) === r.total), [esperado9, R9.regioes.map((r) => [r.regiao, r.total])]);
prova('regiões: sigla inválida e loja sem UF caem em Não identificada, por último', (() => {
  const ni = R9.regioes.find((r) => r.regiao === 'Não identificada');
  return !!ni && R9.regioes[R9.regioes.length - 1] === ni && ni.ufs.length === 1 && ni.ufs[0].uf === null &&
    R9.regioes.every((r) => r.ufs.every((u) => u.uf !== 'XX'));
})());
prova('regiões e UFs do maior para o menor', R9.regioes.slice(0, -1).every((r, i, a) => i === 0 || a[i - 1].total >= r.total) &&
  R9.regioes.every((r) => r.ufs.every((u, i, a) => i === 0 || a[i - 1].total >= u.total)));
prova('regiões: acessaram, ofertaram e compraram por UF, pelo ranking de lojas', R9.regioes.every((r) => r.ufs.every((u) => {
  const ls = camp9.filter((l) => regDe(l.uf) === r.regiao && (regDe(l.uf) === 'Não identificada' ? null : l.uf) === u.uf);
  const de = (l) => rank9[l.id] || { acessos: 0, lances: 0, arrem: 0 };
  return ls.length === u.total && ls.filter((l) => de(l).acessos > 0).length === u.acessaram &&
    ls.filter((l) => de(l).lances > 0).length === u.ofertaram && ls.filter((l) => de(l).arrem > 0).length === u.compraram;
})));
prova('regiões: com Data, só os cadastros daquele dia', (() => {
  const cod = dia9a.slice(2, 4) + dia9a.slice(5, 7) + dia9a.slice(8, 10);
  const Rd = calculaDaPagina(D9, 'todos', { dia: cod });
  const esp = camp9.filter((l) => l.fenauto_ano.slice(0, 10) === dia9a).length;
  return esp > 0 && esp < camp9.length && Rd.regioes.reduce((t, r) => t + r.total, 0) === esp;
})());
prova('regiões: o Evento não recorta a campanha', D9.eventos.every((e) => {
  const Re = calculaDaPagina(D9, e.id, {});
  return Re.regioes.reduce((t, r) => t + r.total, 0) === camp9.length;
}));
prova('regiões: o filtro Lojistas não entra (a calcula não o conhece)', scr.indexOf('soNovas', scr.indexOf('function calcula(')) < 0 ||
  scr.indexOf('soNovas', scr.indexOf('function calcula(')) > scr.indexOf('function APP('));
prova('regiões na coleta de prova: as lojas da campanha do ano, nem mais nem menos', (() => {
  const esp = cru.lojas.filter((l) => l.fenauto_ano && Number(l.apagada) !== 1).length;
  return R.regioes.reduce((t, r) => t + r.total, 0) === esp;
})());
prova('regiões: o resumo traz o mesmo que a página calcula', semBytes(R.regioes) ===
  semBytes(calculaDaPagina(D0, 'todos', {}).regioes.map((r) => ({ regiao: r.regiao, total: r.total, acessaram: r.acessaram, ufs: r.ufs.map((u) => [u.uf, u.total]) }))));
prova('cartão de regiões entre o funil e os acessos únicos por dia, na mesma linha', (() => {
  const f = semScript.indexOf('id="funil"');
  const g = semScript.indexOf('id="g-regiao"');
  const dd = semScript.indexOf('id="g-dia"');
  const sec = semScript.lastIndexOf('<section class="g3i">', f);
  return f < g && g < dd && sec > 0 && semScript.indexOf('</section>', sec) > dd &&
    semScript.indexOf('<h2>Lojistas Fenauto ' + anoProva + ' por região</h2>') > 0 && semScript.indexOf('class="cartao c-flex c-dia"') > 0;
})());
prova('grade de três colunas, duas no meio (acessos na linha inteira) e uma no telefone',
  h.indexOf('.g3i{display:grid;gap:var(--gap);grid-template-columns:repeat(3,minmax(0,1fr))}') > 0 &&
  h.indexOf('@media (max-width:1400px){.g3i{grid-template-columns:1fr 1fr}.g3i > .c-dia{grid-column:1 / -1}}') > 0 &&
  h.indexOf('@media (max-width:860px){.g3i{grid-template-columns:1fr}}') > 0);
prova('barras por região: pedaço por UF com vão de 2px, cor da série Total, legenda das UFs embaixo',
  h.indexOf('.reg-barra{display:flex;gap:2px;') > 0 && h.indexOf('background:var(--serie-2)') > 0 &&
  scr.indexOf('<span class="reg-leg">') > 0 && scr.indexOf('data-dica="') > 0 && h.indexOf('["Lojistas Fenauto ' + anoProva + ' por região","Só as lojas cadastradas pela campanha da Fenauto ' + anoProva) > 0);

console.log((falhas ? '✗' : '✓') + ' %d provas, %d falha(s)', ok + falhas, falhas);
if (falhas) process.exit(1);
