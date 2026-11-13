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
  /* 09/11: a semana em literal e só evento com Fenauto no nome */
  prova(q.queryName + ': a semana em literal, nas duas pontas', q.sql.indexOf("e.start_date_offer < '" + q.meta.semana[1] + "'") > 0 &&
    q.sql.indexOf("e.finish_date_event >= '" + q.meta.semana[0] + "'") > 0, q.meta.semana);
  prova(q.queryName + ': só evento com "fenauto" no nome', q.sql.indexOf("e.name LIKE '%fenauto%'") > 0 &&
    q.meta.nome_evento === 'fenauto');
  prova(q.queryName + ': sem evento fixo nem piso de outubro', q.sql.indexOf('e.id IN (') < 0 &&
    q.sql.indexOf("'2026-10-01 00:00:00'") < 0 && q.meta.piso === undefined);
  /* 12/11: o e-mail entra só como FILTRO do usuário externo (NOT LIKE), na
     consulta de lojas; coluna de pessoa nenhuma sai do banco */
  const colsSql = low.slice(0, low.indexOf(')) as linhas'));
  const semFiltro = low.split(' and u.email not like ').join(' ');
  prova(q.queryName + ': sem documento de pessoa',
    ['document', 'email', 'phone', 'renavam'].every((p) => colsSql.indexOf(p) < 0 && semFiltro.indexOf(p) < 0) &&
    low.split('u.email not like').length - 1 === (q.queryName === 'lojas' ? 4 : 0));
  /* placa e chassi saíram em 28/09: nem na consulta */
  prova(q.queryName + ': sem placa nem chassi', low.indexOf('plate') < 0 && low.indexOf('chassi') < 0);
  /* sem representante, sem CNPJ (26/10): no C6 ele era a chave da carteira */
  prova(q.queryName + ': sem CNPJ', low.indexOf('cnpj') < 0);
});
const sqlDe = (n) => itens.find((i) => i.json.queryName === n).json.sql;
/* loja nova (Thomas, 12/11): clientes dos grupos 69 e 146 com ENTRADA na
   campanha — loja cadastrada desde 10/11, ou antiga sem compra nos 6 meses
   antes de 10/11 que acessou desde 10/11. A entrada sai do SQL; aqui, o
   SQL é conferido peça a peça */
const INICIO = '2026-11-10 00:00:00';
const SEM_COMPRA = (() => {
  /* 6 meses antes, por Date (outro caminho que o do nó) */
  const x = new Date(Date.UTC(2026, 10, 10));
  x.setUTCMonth(x.getUTCMonth() - 6);
  return x.toISOString().slice(0, 10) + ' 00:00:00';
})();
const sqlL = sqlDe('lojas');
const conta = (txt, pedaco) => txt.split(pedaco).length - 1;
prova('loja nova (12/11): meta com início, "sem compra desde" (6 meses antes) e os grupos 69 e 146, em toda consulta',
  SEM_COMPRA === '2026-05-10 00:00:00' && itens.every((i) => i.json.meta.inicio_campanha === INICIO &&
    i.json.meta.sem_compra_desde === SEM_COMPRA && i.json.meta.meses_sem_compra === 6 &&
    JSON.stringify(i.json.meta.grupos_c6) === '[69,146]' && i.json.meta.grupos_iga === undefined),
  itens[0].json.meta);
prova('loja nova: nada da regra do formulário (campanha_novas, register_form_value, user_profiles)',
  itens.every((i) => i.json.meta.campanha_novas === undefined && i.json.meta.novas === undefined &&
    i.json.sql.indexOf('register_form_value') < 0 && i.json.sql.indexOf('user_profiles') < 0) &&
  ['CAMPANHA_NOVAS', 'CADASTRO_CAMPANHA', 'campanha_novas'].every((t) => ler('montar-consultas.js').indexOf(t) < 0 &&
    painelFonte.indexOf(t) < 0));
prova('loja nova: grupos 69 e 146, uma vez, só na consulta de lojas (sem o 148 do IGA)',
  conta(sqlL, 'ucg.client_group_id IN (69, 146)') === 1 && conta(sqlL, 'client_group_id') === 1 &&
  sqlL.indexOf('148') < 0 && itens.filter((i) => i.json.queryName !== 'lojas').every((i) => i.json.sql.indexOf('client_group') < 0));
prova('loja nova: usuário externo (não apagado, sem @cars2you.com.br, @itau, @c6bank e teste), no join do grupo',
  sqlL.indexOf("INNER JOIN users u ON u.id = ucg.user_id AND u.deleted_at IS NULL AND u.email NOT LIKE '%@cars2you.com.br'" +
    " AND u.email NOT LIKE '%@itau%' AND u.email NOT LIKE '%@c6bank%' AND u.email NOT LIKE '%teste%'" +
    ' INNER JOIN user_shops us ON us.user_id = u.id') > 0);
prova('loja nova: loja não apagada e sem "teste" no nome',
  sqlL.indexOf("INNER JOIN shops sc ON sc.id = cg.shop_id AND sc.deleted_at IS NULL AND sc.name NOT LIKE '%teste%'") > 0);
prova('loja nova: compra = oferta vencedora de negociação 2, 3 ou 7, em [6 meses antes, início)',
  sqlL.indexOf('FROM offers o INNER JOIN advertisement_negotiations an ON an.offer_actual_id = o.id AND an.deleted_at IS NULL AND an.status IN (2, 3, 7)' +
    " WHERE o.deleted_at IS NULL AND o.buyer_shop_id IS NOT NULL AND o.created_at >= '" + SEM_COMPRA + "' AND o.created_at < '" + INICIO + "') cp") > 0 &&
  conta(sqlL, "'" + SEM_COMPRA + "'") === 1);
prova('loja nova: a volta é UMA passada agrupada no access_logs desde o início, sem correlação por loja',
  conta(sqlL, "FROM access_logs al WHERE al.created_at >= '" + INICIO + "' AND al.shop_id IS NOT NULL GROUP BY al.shop_id) va ON va.shop_id = sc.id") === 1 &&
  conta(sqlL, 'access_logs') === 2 && sqlL.indexOf('al.shop_id = sc.id') < 0 && sqlL.indexOf('al.shop_id = s.id') < 0);
prova('loja nova: entrada = cadastro se desde o início, senão a volta; só quem é novo ou voltou sem compra',
  sqlL.indexOf("DATE_FORMAT(IF(sc.created_at >= '" + INICIO + "', sc.created_at, va.volta), '%Y-%m-%d %H:%i') AS entrada") > 0 &&
  sqlL.indexOf("WHERE sc.created_at >= '" + INICIO + "' OR (va.volta IS NOT NULL AND cp.shop_id IS NULL)) f") > 0 &&
  conta(sqlL, "'" + INICIO + "'") === 4);
prova('loja nova: CLIENTES roda uma vez — universo e coluna "fenauto" da mesma derivada (MAX por loja)',
  conta(sqlL, 'FROM user_clients_group') === 1 && sqlL.indexOf('UNION SELECT f.id AS id, f.entrada AS fen FROM (SELECT sc.id,') > 0 &&
  sqlL.indexOf('FROM (SELECT u0.id, MAX(u0.fen) AS fen FROM (SELECT o.buyer_shop_id AS id, NULL AS fen FROM offers o') > 0 &&
  sqlL.indexOf(') u0 GROUP BY u0.id) ids INNER JOIN shops s ON s.id = ids.id') > 0 &&
  itens[NOMES.indexOf('lojas')].json.cols.slice(-1)[0] === 'fenauto' && sqlL.indexOf(', ids.fen)) AS linhas') > 0);
prova('loja nova: as outras uniões do universo ficam (ofertas, acesso ao evento, cadastro no 43)',
  sqlL.indexOf('UNION SELECT al.shop_id AS id, NULL AS fen FROM events e INNER JOIN access_logs al') > 0 &&
  sqlL.indexOf('UNION SELECT s2.id AS id, NULL AS fen FROM shops s2 WHERE s2.whitelabel_id = 43 AND s2.deleted_at IS NULL AND s2.created_at >= (SELECT MIN(e.start_date_offer)') > 0);
prova('loja nova: sem WITH (CTE) — o MCP do n8n rejeita', itens.every((i) => i.json.sql.toUpperCase().indexOf('WITH ') < 0));
prova('loja nova: nenhum resto do piso de 01/10', itens.every((i) => i.json.sql.indexOf('2026-10-01 00:00') < 0) &&
  ['GRUPO_NOVAS', 'NOVAS_DESDE'].every((t) => ler('n8n/montar-consultas.js').indexOf(t) < 0));
/* a semana (09/11): de segunda 00:00 à segunda seguinte, e hoje dentro dela */
(() => {
  const m = itens[0].json.meta;
  const ini = new Date(m.semana[0].slice(0, 10) + 'T00:00:00Z');
  const fim = new Date(m.semana[1].slice(0, 10) + 'T00:00:00Z');
  prova('semana: começa numa segunda, dura 7 dias e contém agora', ini.getUTCDay() === 1 && fim - ini === 7 * 86400000 &&
    m.semana[0].slice(11) === '00:00:00' && m.agora_br >= m.semana[0].slice(0, 16) && m.agora_br < m.semana[1].slice(0, 16), m);
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
   A coleta DE PROVA (dados-prova.json, 09/11): o mesmo SQL com a janela de
   01/09 a 27/10/2026, SEM a trava do nome (a campanha das novas é a de
   2026, a mesma da semana; até 10/11 a loja nova ia desde 01/09). A
   semana da Fenauto de 09/11 abriu com 2 eventos e nenhum lance, e conta
   refeita sobre zero não prova nada. A trava do nome é provada no SQL
   (acima) e na coleta da semana (seção 3c). */
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

/* ── loja nova (Thomas, 12/11): entradas PLANTADAS ────────────────────
   A coleta de prova troca a campanha para o ano da prova (início
   10/11/2025, sem compra desde 10/05/2025; os grupos 69 e 146 ficam), então
   a coluna "fenauto" já chega com entradas reais — cadastros e voltas de
   nov/2025 em diante. A janela de prova (set–out/2026) não tem o 10/11
   dentro dela; para ter os casos da regra em todo dia, a prova PLANTA
   entradas em lojas da coleta sem entrada: uma loja por dia do período com
   acesso, entre as que acessaram naquele dia, na hora do primeiro acesso
   dela no dia — assim há nova em todo dia com acesso, e nova que acessou —
   mais uma entrada ANTES do primeiro dia (conta no total, em nenhum botão
   de Data). Daqui para baixo, "d" é a coleta COM o plantio, e as contas
   refeitas do cru leem a mesma coluna que o nó.
   12/11 (tarde): novas e reativadas separadas pelo cadastro da loja contra o
   início da campanha. As lojas livres da coleta são quase todas antigas
   (cadastro antes de 10/11/2025): o plantio de todo dia vira REATIVADA, e
   só com ele o botão de Data não teria nova nenhuma. Então o plantio de
   todo dia pega só loja antiga (reativada) e, nos seis últimos dias com
   acesso, uma loja livre cadastrada desde o início da campanha recebe uma
   entrada naquele dia (NOVA). Na coleta real a entrada da nova é o próprio
   cadastro; aqui não precisa ser — o nó só olha a entrada, e a separação só
   o cadastro contra o início. */
const tabela = (dd, nome) => {
  const i = NOMES.indexOf(nome);
  const row = dd.mcp[i].json.structuredContent.rows[0];
  return { cols: dd.consultas[i].json.cols, row: row, linhas: JSON.parse(row[1] || '[]') };
};
/* entradas: { loja: 'AAAA-MM-DD HH:MM' }; apagar: lojas que viram apagadas */
const planta = (dd, entradas, apagar) => {
  const t = tabela(dd, 'lojas');
  const iId = t.cols.indexOf('id');
  const iF = t.cols.indexOf('fenauto');
  const iA = t.cols.indexOf('apagada');
  t.linhas.forEach((a) => {
    const id = Number(a[iId]);
    if (entradas[id] !== undefined) a[iF] = entradas[id];
    if (apagar && apagar.indexOf(id) >= 0) a[iA] = 1;
  });
  t.row[1] = JSON.stringify(t.linhas);
};
const META_PROVA = d.consultas[0].json.meta;
const ENTRADAS_REAIS = (() => {
  const t = tabela(d, 'lojas');
  return t.linhas.filter((a) => a[t.cols.indexOf('fenauto')] !== null).map((a) => String(a[t.cols.indexOf('fenauto')]));
})();
prova('coleta de prova: campanha no ano da prova (10/11/2025, sem compra desde 10/05/2025), grupos 69 e 146, em toda consulta',
  d.consultas.every((c) => c.json.meta.inicio_campanha === '2025-11-10 00:00:00' && c.json.meta.sem_compra_desde === '2025-05-10 00:00:00' &&
    JSON.stringify(c.json.meta.grupos_c6) === '[69,146]' && c.json.sql.indexOf("'" + INICIO + "'") < 0 && c.json.sql.indexOf("'" + SEM_COMPRA + "'") < 0) &&
  conta(d.consultas[NOMES.indexOf('lojas')].json.sql, "'2025-11-10 00:00:00'") === 4 &&
  conta(d.consultas[NOMES.indexOf('lojas')].json.sql, "'2025-05-10 00:00:00'") === 1, META_PROVA);
prova('coleta de prova: toda entrada real é do início da campanha em diante (cadastro ou volta)',
  ENTRADAS_REAIS.length > 0 && ENTRADAS_REAIS.every((x) => x >= META_PROVA.inicio_campanha.slice(0, 16)),
  [ENTRADAS_REAIS.length, ENTRADAS_REAIS.slice().sort()[0]]);
const PLANTADAS = [];
const PLANTADAS_N = [];
const PLANTADAS_R = [];
let ANTES_DO_1O = null;
(() => {
  const evs = tabela(d, 'eventos');
  const per = [evs.linhas.map((e) => e[evs.cols.indexOf('ini')]).sort()[0], evs.linhas.map((e) => e[evs.cols.indexOf('fim')]).sort().pop()];
  /* dia -> loja -> o primeiro horário com acesso dela naquele dia */
  const noDia = {};
  NOMES.filter((n) => n.indexOf('acessos_p') === 0).forEach((n) => tabela(d, n).linhas.forEach((a) => {
    const c = String(a[1]);
    const ts = '20' + c.slice(0, 2) + '-' + c.slice(2, 4) + '-' + c.slice(4, 6) + ' ' + (Number(a[2]) < 10 ? '0' : '') + Number(a[2]) + ':00';
    if (ts < per[0].slice(0, 13) + ':00' || ts >= per[1]) return;
    const m = noDia[ts.slice(0, 10)] || (noDia[ts.slice(0, 10)] = {});
    if (!m[a[0]] || ts < m[a[0]]) m[a[0]] = ts;
  }));
  const lj = tabela(d, 'lojas');
  const iniP = META_PROVA.inicio_campanha.slice(0, 16);
  /* loja livre -> o cadastro dela */
  const livre = {};
  lj.linhas.forEach((a) => {
    if (a[lj.cols.indexOf('fenauto')] === null && !Number(a[lj.cols.indexOf('apagada')])) livre[a[lj.cols.indexOf('id')]] = String(a[lj.cols.indexOf('cadastro')]);
  });
  const antiga = (x) => livre[x] && livre[x] < iniP;
  const entradas = {};
  Object.keys(noDia).sort().forEach((dia) => {
    const id = Object.keys(noDia[dia]).map(Number).sort((a, b) => a - b).find((x) => antiga(x) && !entradas[x]);
    if (id === undefined) return;
    entradas[id] = noDia[dia][id].slice(0, 13) + ':07';
    PLANTADAS.push(id);
    PLANTADAS_R.push(id);
  });
  /* novas: nos seis últimos dias com acesso, uma loja livre cadastrada
     desde o início da campanha e até aquele dia (a que acessou no dia, se
     houver), com entrada nele */
  Object.keys(noDia).sort().reverse().slice(0, 6).forEach((dia) => {
    const cands = Object.keys(livre).map(Number).sort((a, b) => a - b)
      .filter((x) => !entradas[x] && livre[x] >= iniP && livre[x].slice(0, 10) <= dia);
    const id = cands.find((x) => noDia[dia][x]) || cands[0];
    if (id === undefined) return;
    entradas[id] = (noDia[dia][id] || dia + ' 10:00').slice(0, 13) + ':07';
    PLANTADAS.push(id);
    PLANTADAS_N.push(id);
  });
  /* uma entrada três dias antes do primeiro dia do período (loja antiga) */
  const antes = Object.keys(livre).map(Number).sort((a, b) => a - b).find((x) => antiga(x) && !entradas[x]);
  if (antes !== undefined) {
    const p0 = per[0].slice(0, 10);
    entradas[antes] = new Date(Date.UTC(Number(p0.slice(0, 4)), Number(p0.slice(5, 7)) - 1, Number(p0.slice(8, 10)) - 3)).toISOString().slice(0, 10) + ' 10:00';
    ANTES_DO_1O = antes;
    PLANTADAS.push(antes);
    PLANTADAS_R.push(antes);
  }
  planta(d, entradas);
})();
prova('plantio: reativadas em vários dias, novas nos seis últimos dias com acesso, mais uma antes do primeiro dia',
  PLANTADAS_R.length >= 6 && PLANTADAS_N.length === 6 && ANTES_DO_1O !== null,
  [PLANTADAS_R.length, PLANTADAS_N.length, ANTES_DO_1O]);
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
/* lance sem loja compradora fica fora das contas e vira aviso (12/11, como
   no Mega Evento Fenauto); a coleta de prova não tem nenhum */
const semLoja = cru.ofertas.filter((o) => o.loja === null).length;
prova('todo lance com loja entra na conta; o sem loja vira aviso', R.kpi.lances === cru.ofertas.length - semLoja &&
  (semLoja === 0 || R.avisos.indexOf(semLoja + ' lance(s) sem loja compradora (lançado por usuário interno) — fora dos lances e dos rankings; se venceu, a venda conta nos vendidos') >= 0), [R.kpi.lances, cru.ofertas.length, semLoja]);
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
const partCru = new Set(cru.ofertas.map((o) => o.loja + '|' + veicDaNeg[o.neg])).size;
/* 12/11: venda cuja oferta vencedora não tem loja (lançada por usuário
   interno; no IGA, 516768 em 11/11, o cartão dava 3 vendidos com 4 na
   tabela) conta nos vendidos e no valor, não nos compradores nem nos lances
   — planta tirando a loja da vencedora de uma venda; com Data, a venda
   segue no dia da oferta vencedora */
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
  prova('lance sem loja vira aviso, com o texto de 12/11', o.resumo.avisos.indexOf('1 lance(s) sem loja compradora (lançado por usuário interno) — fora dos lances e dos rankings; se venceu, a venda conta nos vendidos') >= 0,
    o.resumo.avisos);
})();
prova('participações = pares (loja, veículo) distintos', R.kpi.participacoes === partCru, [R.kpi.participacoes, partCru]);
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
/* loja nova (Thomas, 12/11): entrada na campanha (a coluna "fenauto") até
   o dia do fim de ALGUM evento do filtro — aqui evento a evento, com
   some(); no nó é o dia do maior fim. Sem piso: entrada antes do primeiro
   dia conta. Com Data, entrada naquele dia. A data da loja ("cadastro") não
   entra: a do cadastro novo já veio como entrada do SQL */
const novaCru = (evs) => cru.lojas.filter((l) => l.fenauto && !Number(l.apagada) &&
  evs.some((e) => l.fenauto.slice(0, 10) <= e.fim.slice(0, 10)));
const novaCruDia = (dataF) => cru.lojas.filter((l) => l.fenauto && !Number(l.apagada) && l.fenauto.slice(0, 10) === dataF);
/* 12/11 (tarde): separadas — nova = loja cadastrada desde o início da
   campanha; reativada = loja anterior a ele (a entrada é a volta) */
const INI_CAMP = META_PROVA.inicio_campanha.slice(0, 16);
const ehReat = (l) => String(l.cadastro || '') < INI_CAMP;
const novaCruN = (evs) => novaCru(evs).filter((l) => !ehReat(l));
const novaCruR = (evs) => novaCru(evs).filter(ehReat);
const novaCruDiaN = (dataF) => novaCruDia(dataF).filter((l) => !ehReat(l));
const novaCruDiaR = (dataF) => novaCruDia(dataF).filter(ehReat);
const novasTodos = novaCru(eventosCru);
const cadTodos = novasTodos.filter((l) => !ehReat(l));
const reatTodos = novasTodos.filter(ehReat);
const ehNovaT = {};
novasTodos.forEach((l) => { ehNovaT[l.id] = ehReat(l) ? 'R' : 'N'; });
const nTot = (k) => k.novas + k.reativadas;
prova('lojas novas = entrada até o dia do fim de algum evento, refeito do cru; separadas em novas e reativadas',
  R.kpi.novas === cadTodos.length && R.kpi.reativadas === reatTodos.length && cadTodos.length > 0 && reatTodos.length > 0,
  [R.kpi.novas, cadTodos.length, R.kpi.reativadas, reatTodos.length]);
prova('toda loja plantada entra (a de antes do primeiro dia também); as antigas como reativadas, as do início em diante como novas',
  PLANTADAS_R.every((id) => ehNovaT[id] === 'R') && PLANTADAS_N.every((id) => ehNovaT[id] === 'N') &&
  novasTodos.length >= PLANTADAS.length, [PLANTADAS.length, novasTodos.length]);
prova('loja nova por evento = entrada até o dia do fim DELE, refeito do cru, novas e reativadas', R.por_evento.every((e) =>
  e.kpi.novas === novaCruN(eventosCru.filter((x) => x.id === e.id)).length &&
  e.kpi.reativadas === novaCruR(eventosCru.filter((x) => x.id === e.id)).length) &&
  new Set(R.por_evento.map((e) => nTot(e.kpi))).size > 1, R.por_evento.map((e) => [e.id, e.kpi.novas, e.kpi.reativadas]));
prova('reativada: tem entrada, loja anterior ao início da campanha e entrada depois do cadastro', D0.lojas.filter((l) => l.reativada).length ===
  cru.lojas.filter((l) => l.fenauto && ehReat(l)).length && D0.lojas.every((l) => !l.reativada || (l.fenauto && l.fenauto > l.cadastro)) &&
  D0.lojas.some((l) => l.reativada));
prova('entrada antes do primeiro dia: conta no total e em nenhum botão de Data', (() => {
  const t = calculaDaPagina(D0, 'todos', {});
  return ANTES_DO_1O !== null && !!t.nova[ANTES_DO_1O] && t.dias_periodo.length > 1 &&
    t.dias_periodo.every((c) => !calculaDaPagina(D0, 'todos', { dia: c }).nova[ANTES_DO_1O]);
})());
prova('soma dos botões de Data + entradas antes do primeiro dia = total', (() => {
  const t = calculaDaPagina(D0, 'todos', {});
  const p0 = perTodos[0].slice(0, 10);
  const antes = novasTodos.filter((l) => l.fenauto.slice(0, 10) < p0).length;
  const porBotao = t.dias_periodo.reduce((n, c) => n + nTot(calculaDaPagina(D0, 'todos', { dia: c }).kpi), 0);
  return antes > 0 && porBotao + antes === nTot(t.kpi);
})());
prova('o nó não refaz a regra (ela vem pronta do SQL): sem "grupo" na loja nem "novas_regra" no dado',
  ['novas_regra', 'META.novas', 'l.grupo', 'grupo_nome', 'client_group'].every((t) => painelFonte.indexOf(t) < 0) &&
  D0.novas_regra === undefined && D0.lojas.every((l) => l.grupo === undefined));
prova('recorte no nó (09/11): o 43, a semana e o nome', sqlDe('eventos').indexOf('ew.whitelabel_id = 43') > 0 &&
  sqlDe('eventos').indexOf("e.finish_date_event >= '" + itens[0].json.meta.semana[0] + "'") > 0 &&
  sqlDe('eventos').indexOf("e.name LIKE '%fenauto%'") > 0);
prova('coleta de prova: sem a trava do nome, na janela dela', d.consultas.every((c) => c.json.sql.indexOf('e.name LIKE') < 0) &&
  cru.eventos.length > 2 && cru.eventos.every((e) => e.ini < d.consultas[0].json.meta.semana[1].slice(0, 16) &&
    e.fim >= d.consultas[0].json.meta.semana[0].slice(0, 16)), cru.eventos.length);
prova('coleta: loja do 43 cadastrada no período, sem entrada, não é nova (a data da loja só conta pelo SQL)', (() => {
  const ls = cru.lojas.filter((l) => !l.fenauto && !Number(l.apagada) && Number(l.wl) === 43 &&
    l.cadastro.slice(0, 10) >= perTodos[0].slice(0, 10) && l.cadastro.slice(0, 10) <= perTodos[1].slice(0, 10));
  return ls.length > 0 && ls.every((l) => !ehNovaT[l.id]);
})());

/* os casos da regra, PLANTADOS numa cópia da coleta (12/11): cada loja
   recebe uma entrada (a coluna que o SQL entrega). Vale o DIA do fim, o dia
   inteiro: 23:59 do último dia entra (depois de o evento fechar, que é de
   tarde), 00:01 do dia seguinte não. Sem piso: 00:00 do primeiro dia (antes
   de o evento abrir) e um ano antes do período entram. Evento a evento:
   entrada depois do fim do evento que fecha primeiro e antes do último não
   é nova naquele evento, mas é no total. Loja apagada com entrada e loja
   cadastrada no período sem entrada não entram. Quatro das sete entram no
   total; o total sobe exatamente 4 */
(() => {
  const sint = JSON.parse(JSON.stringify(d));
  const t = tabela(sint, 'lojas');
  const c = (k) => t.cols.indexOf(k);
  const primeiro = perTodos[0].slice(0, 10);
  const ultimo = perTodos[1].slice(0, 10);
  const maisDias = (dia, n) => new Date(Date.UTC(Number(dia.slice(0, 4)), Number(dia.slice(5, 7)) - 1, Number(dia.slice(8, 10)) + n)).toISOString().slice(0, 10);
  const evA = eventosCru.slice().sort((a, b) => (a.fim < b.fim ? -1 : a.fim > b.fim ? 1 : a.id - b.id))[0];
  const depoisDeA = maisDias(evA.fim.slice(0, 10), 1);
  const livres = t.linhas.filter((a) => a[c('fenauto')] === null && !Number(a[c('apagada')]) && PLANTADAS.indexOf(Number(a[c('id')])) < 0);
  const usados = {};
  const pega = (cond) => {
    const a = livres.find((x) => !usados[x[c('id')]] && (!cond || cond(x)));
    if (!a) return null;
    usados[a[c('id')]] = 1;
    return Number(a[c('id')]);
  };
  const noPeriodo = (x) => String(x[c('cadastro')]).slice(0, 10) >= primeiro && String(x[c('cadastro')]).slice(0, 10) <= ultimo;
  /* [nome, loja, entrada, entra no total?, apagar?] */
  const casos = [
    ['entrada às 23:59 do último dia do período', pega(), ultimo + ' 23:59', true],
    ['entrada às 00:01 do dia seguinte ao fim', pega(), maisDias(ultimo, 1) + ' 00:01', false],
    ['loja apagada com entrada no período', pega(), ultimo + ' 10:00', false, 'apagar'],
    ['loja cadastrada no período, sem entrada', pega(noPeriodo), null, false],
    ['entrada às 00:00 do primeiro dia, antes de o evento abrir', pega(), primeiro + ' 00:00', true],
    ['entrada um ano antes do primeiro dia', pega(), maisDias(primeiro, -365) + ' 10:00', true],
    ['entrada no dia seguinte ao fim do evento ' + evA.id + ' (o que fecha primeiro)', pega(), depoisDeA + ' 10:00', true]
  ];
  const entradas = {};
  const apagar = [];
  casos.forEach((k) => { if (k[1] !== null) { if (k[2] !== null) entradas[k[1]] = k[2]; if (k[4]) apagar.push(k[1]); } });
  planta(sint, entradas, apagar);
  const o = roda('montar-painel.js', Object.assign({}, nos, { 'MCP Consultas': sint.mcp }))[0].json;
  const Ds = dadosDe(o.html);
  const r = calculaDaPagina(Ds, 'todos', {});
  prova('casos plantados: sete lojas distintas achadas na coleta, o período fecha antes das 23:59 e o evento ' + evA.id + ' antes do último dia',
    casos.every((k) => k[1] !== null) && new Set(casos.map((k) => k[1])).size === casos.length && perTodos[1].slice(11, 16) < '23:59' &&
    perTodos[0].slice(11, 16) > '00:00' && depoisDeA <= ultimo, casos.map((k) => k[1]));
  casos.forEach((k) => prova('loja nova (plantio): ' + k[0] + (k[3] ? ' ENTRA' : ' não entra'),
    k[1] !== null && !!r.nova[k[1]] === k[3], [k[1], r.nova[k[1]]]));
  prova('casos plantados: o total de novas e reativadas sobe exatamente 4', nTot(o.resumo.kpi) === nTot(R.kpi) + 4, [nTot(o.resumo.kpi), nTot(R.kpi)]);
  /* evento a evento: no evento que fecha primeiro, a entrada do dia
     seguinte ao fim dele não conta; a das 00:00 do primeiro dia do período
     conta se ele já tinha aberto até aquele dia */
  const rA = calculaDaPagina(Ds, evA.id, {});
  const kA = casos[6][1];
  prova('evento ' + evA.id + ' sozinho: a entrada do dia seguinte ao fim dele não é nova; no total é',
    !rA.nova[kA] && !!r.nova[kA] && nTot(o.resumo.por_evento.find((e) => e.id === evA.id).kpi) ===
      nTot(R.por_evento.find((e) => e.id === evA.id).kpi) + 2, [rA.nova[kA], r.nova[kA]]);
  /* com Data: só o dia da entrada; a de um ano antes não está em botão nenhum */
  prova('com Data: a entrada às 23:59 do último dia só no botão do último dia, a de um ano antes em nenhum', (() => {
    const cod = (dia) => dia.slice(2, 4) + dia.slice(5, 7) + dia.slice(8, 10);
    const dias = r.dias_periodo;
    return dias.indexOf(cod(ultimo)) >= 0 && dias.every((x) => {
      const rd = calculaDaPagina(Ds, 'todos', { dia: x });
      return !!rd.nova[casos[0][1]] === (x === cod(ultimo)) && !rd.nova[casos[5][1]] &&
        !!rd.nova[casos[4][1]] === (x === cod(primeiro));
    });
  })());
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
prova('toda loja nova ou reativada está no ranking, com ou sem acesso, com o tipo certo', novasTodos.every((l) =>
  todosPag.lojas.some((r) => r.loja === l.id && r.nova === ehNovaT[l.id])) &&
  todosPag.lojas.filter((r) => r.nova).length === novasTodos.length &&
  todosPag.lojas.every((r) => ['N', 'R', ''].indexOf(r.nova) >= 0));

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
prova('por hora: total, novos e reativados recalculados do cru', todosPag.por_hora.every((x) => x.total === hc.t[x.h] && x.novas === hc.nv[x.h] &&
  x.reativadas === hc.rv[x.h]) && hc.rv.some((n) => n > 0));
prova('por hora: novas + reativadas ≤ total, toda hora, e algum novo e algum reativado acessaram', todosPag.por_hora.every((x) =>
  x.novas + x.reativadas <= x.total) && R.kpi.acessos_novas > 0 && R.kpi.acessos_reativadas > 0);
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
prova('clique no dia: por hora só daquele dia', soDia.por_hora.every((x) => x.total === hcDia.t[x.h] && x.novas === hcDia.nv[x.h] &&
  x.reativadas === hcDia.rv[x.h]) &&
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
prova('funil só das novas (sem as reativadas): cadastrados e aprovados em situation 3', F[0] === cadTodos.length &&
  F[1] === cadTodos.filter((l) => Number(l.situacao) === 3).length);
prova('acessaram = novos com dia de acesso no período; o mesmo dos reativados no cartão deles', F[2] === cadTodos.filter((l) => diasTodos[l.id]).length &&
  R.kpi.reativadas_acessaram === reatTodos.filter((l) => diasTodos[l.id]).length &&
  Math.abs(R.kpi.engaj_reativadas - R.kpi.reativadas_acessaram / R.kpi.reativadas) < 1e-12);
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
prova('Pátio: lances = lances nesses veículos', fp.kpi.lances === cru.ofertas.filter((o) => negsP.indexOf(Number(o.neg)) >= 0).length);
prova('Pátio: a tabela de pátios só tem ele', fp.patios.length === 1 && fp.patios[0].patio === umPatio);
prova('Pátio: acesso ao canal não muda', fp.kpi.lojas_acessaram === todosPag.kpi.lojas_acessaram && fp.kpi.novas === todosPag.kpi.novas);
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
prova('Data ' + dataF + ': lances = lances daquele dia', fd.kpi.lances === cru.ofertas.filter((o) => o.quando.slice(0, 10) === dataF).length);
prova('Data ' + dataF + ': cada loja com no máximo 1 dia de acesso', fd.lojas.every((x) => x.acessos <= 1) &&
  fd.por_dia.length === 1 && fd.por_dia[0].dia === diaF);
const perDia = [dataF + ' 00:00' > perTodos[0] ? dataF + ' 00:00' : perTodos[0], dataF + ' 23:59' < perTodos[1] ? dataF + ' 23:59' : perTodos[1]];
prova('Data ' + dataF + ': novos e reativados = entraram naquele dia (e há dos dois)', fd.kpi.novas === novaCruDiaN(dataF).length &&
  fd.kpi.reativadas === novaCruDiaR(dataF).length && fd.kpi.novas > 0 && fd.kpi.reativadas > 0 && fd.kpi.novas < R.kpi.novas,
  [fd.kpi.novas, novaCruDiaN(dataF).length, fd.kpi.reativadas, novaCruDiaR(dataF).length]);
prova('Data ' + dataF + ': vendas pela data da oferta vencedora', fd.kpi.vendidos === cru.veiculos.filter((v) =>
  [2, 3, 7].indexOf(Number(v.status)) >= 0 && ofPorId[v.vencedora] && ofPorId[v.vencedora].quando.slice(0, 10) === dataF).length);
prova('Data ' + dataF + ': a lista de veículos continua inteira', fd.veiculos.length === todosPag.veiculos.length);
/* a Data virou os botões acima do funil (Thomas, 26/10): cadastros, acessos e
   negociações daquele dia — e o funil acompanha */
prova('Data ' + dataF + ': o funil só com quem entrou naquele dia, refeito do cru', fd.funil[0][1] === novaCruDiaN(dataF).length &&
  fd.funil[2][1] === novaCruDiaN(dataF).filter((l) => diasNoPeriodo([dataF + ' 00:00' > perTodos[0] ? dataF + ' 00:00' : perTodos[0],
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
/* a logo "C6 Auto" (09/11): SVG inline, uma cópia só, traçada do PNG que
   o Thomas mandou. Saiu o monograma C6 em base64 (claro e escuro) */
prova('logo C6 Auto inline, a que o injetor produz da arte do design, uma vez só',
  h.indexOf(injetor.logoC6) > 0 && h.split('aria-label="C6 Auto"').length === 2 &&
  h.indexOf('data:image/svg+xml;base64,') < 0 && h.indexOf('<img') < 0 && semScript.indexOf('C6 Bank') < 0);
prova('logo C6 Auto: a cor é do CSS — #242424 no claro, branco no escuro',
  injetor.logoC6.indexOf('fill=') < 0 && h.indexOf('.logo-c6 path{fill:#242424}[data-tema="escuro"] .logo-c6 path{fill:#FFFFFF}') > 0);
prova('logo C6 Auto: caixa apertada na tinta (112,2 x 22,9), com nome', injetor.logoC6.indexOf('viewBox="2.1 1.5 112.2 22.9"') > 0 &&
  injetor.logoC6.indexOf('role="img" aria-label="C6 Auto"') > 0 &&
  fs.existsSync(path.join(__dirname, '..', '..', '..', 'design', 'marca', 'c6-auto', '_original-c6-auto.png')));
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
/* topo (Thomas, 09/11): C6 Auto à esquerda, título e subtítulo no centro,
   Fenauto à direita, nessa ordem e só isso no cabeçalho */
const cab = semScript.slice(semScript.indexOf('<header class="topo">'), semScript.indexOf('</header>') + 9);
prova('topo: C6 Auto → título e subtítulo → Fenauto', (() => {
  const c = cab.indexOf('<span class="marca logo-c6" id="logo-c6">' + injetor.logoC6 + '</span>');
  const t = cab.indexOf('<div class="topo-tit"><h1>Mega evento Fenauto</h1><p class="sub" id="sub"></p></div>');
  const f = cab.indexOf('<span class="marca logo-fen" id="logo-fen">' + injetor.logoFenauto + '</span>');
  return c > 0 && t > c && f > t && cab.indexOf('<h1 class="logo-fen"') < 0;
})());
prova('topo: cada logo encosta na sua ponta, na grade do tema (1fr auto 1fr)',
  h.indexOf('.marca.logo-c6{justify-self:start}.marca.logo-fen{justify-self:end}') > 0 && h.indexOf('grid-template-columns:1fr auto 1fr') > 0);
prova('topo: nenhum botão dentro do cabeçalho', cab.indexOf('<button') < 0 && cab.indexOf('topo-acoes') < 0 &&
  cab.indexOf('b-tema') < 0 && cab.indexOf('b-aviso') < 0);
prova('botões de tema e de avisos numa linha logo abaixo do cabeçalho, à direita', (() => {
  const fimCab = semScript.indexOf('</header>') + 9;
  return semScript.indexOf('<div class="sob-topo topo-acoes">') === fimCab &&
    semScript.indexOf('id="b-tema"') > fimCab && semScript.indexOf('id="b-aviso"') > fimCab &&
    h.indexOf('.sob-topo{max-width:1680px;margin:0 auto;padding:10px 20px 0;display:flex;justify-content:flex-end;align-items:center;gap:8px;justify-self:stretch}') > 0;
})());
prova('subtítulo: o evento escolhido ou a semana da Fenauto, e "com filtros"', scr.indexOf("$('#sub').textContent = (ev") > 0 &&
  scr.indexOf("' da Fenauto na semana de '") > 0 && scr.indexOf("' · com filtros'") > 0);
prova('rodapé e glossário falam da semana e da Fenauto', scr.indexOf("') abertos na semana de '") > 0 &&
  scr.indexOf('com fim desde') < 0 && h.indexOf('Fenauto' + String.fromCharCode(92, 34) + ' no nome, aberto em algum momento da semana') > 0 &&
  h.indexOf('dias atrás') < 0);
prova('escuro: a Fenauto em branco pelo CSS, como a logo-fenauto-escuro.svg', h.indexOf('[data-tema="escuro"] .logo-fen path,[data-tema="escuro"] .logo-fen g{fill:#FFFFFF}') > 0 &&
  fs.readFileSync(path.join(__dirname, '..', '..', '..', 'design', 'marca', 'fenauto', 'logo-fenauto-escuro.svg'), 'utf8').indexOf('#FFFFFF') > 0);
prova('as duas logos não dependem de JS para o tema', scr.indexOf('LOGO') < 0 && scr.indexOf("$('#logo") < 0);
prova('aba do navegador: Eventos Fenauto C6', h.indexOf('<title>Eventos Fenauto C6</title>') > 0 && h.indexOf('Mega evento exclusivo') < 0);
prova('Fenauto com 44px e C6 Auto com 24px; 26 e 15 no telefone', h.indexOf('.logo-fen svg{display:block;height:44px;') > 0 &&
  h.indexOf('.logo-c6 svg{display:block;height:24px;') > 0 &&
  h.indexOf('@media (max-width:620px){.logo-c6 svg{height:15px}.logo-fen svg{height:26px}') > 0);
prova('tema C6 depois do tema base', h.indexOf('#DCDCDC') > h.indexOf('#D8E1E9') && h.indexOf('#D8E1E9') > 0);
prova('nenhum azul da Cars2You sobrando nos tokens do C6',
  h.slice(h.indexOf('#DCDCDC')).indexOf('#487DEA') < 0 && h.slice(h.indexOf('#DCDCDC')).indexOf('#1523A0') < 0);
/* o escuro da camada do C6 é o primeiro depois do claro dela (12/11: o
   --serie-3 do painel traz mais um bloco escuro, depois) */
const escuroC6 = h.slice(h.indexOf('[data-tema="escuro"]{', h.indexOf('#DCDCDC')));
prova('escuro do C6 com acento amarelo #FFC000', escuroC6.indexOf('--acento:         #FFC000') >= 0 &&
  escuroC6.indexOf('--acento-cheio:   #FFC000') >= 0);
prova('série dos reativados (12/11): azul do painel, #2563EB no claro e #4C8DFF no escuro, nos gráficos, na legenda e no selo',
  h.indexOf(':root{--serie-3:#2563EB}[data-tema="escuro"]{--serie-3:#4C8DFF}') > 0 &&
  h.indexOf('.graf .serie-c,.amostra.serie-c{fill:var(--serie-3);background:var(--serie-3)}') > 0 &&
  h.indexOf('.tag.reat{') > 0 && semScript.split('<span class="amostra serie-c"></span>Reativados').length === 3 &&
  scr.split("k: 'reativadas', nome: 'Reativados', cls: 'serie-c'").length === 3);
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
prova('seis cartões: Performance financeira logo depois de Vendidos; Reativados depois de Novos lojistas', (semScript.match(/class="kpi-val num"/g) || []).length === 6 &&
  semScript.indexOf('id="k-vd"') < semScript.indexOf('id="k-pf"') && semScript.indexOf('id="k-pf"') < semScript.indexOf('id="k-nv"') &&
  semScript.indexOf('id="k-nv"') < semScript.indexOf('id="k-rt"') && h.indexOf('repeat(6,minmax(0,1fr))') > 0 &&
  ['id="k-pf-pc"', 'id="k-pf-fipe"', 'id="k-pf-vmv"'].every((t) => semScript.indexOf(t) > 0));
prova('Vendidos sem o valor; valor na Performance financeira', scr.indexOf("$('#k-vd').textContent = nf(k.vendidos);") > 0 &&
  scr.indexOf("$('#k-pf').textContent = rs(k.volume);") > 0 && h.indexOf('kpi-val-2') < 0);
prova('Novos lojistas e Reativados: Acessaram, Ofertaram, Compraram no pé', ['k-nv', 'k-rt'].every((k) => {
  const i = semScript.indexOf('id="' + k + '"');
  const pe = semScript.slice(i, semScript.indexOf('</article>', i));
  return pe.indexOf('>Acessaram<') < pe.indexOf('>Ofertaram<') && pe.indexOf('>Ofertaram<') < pe.indexOf('>Compraram<') && pe.indexOf('>Acessaram<') > 0 &&
    pe.indexOf('id="' + k + '-ac"') > 0 && pe.indexOf('id="' + k + '-cp"') > 0;
}) && semScript.indexOf('<span class="kpi-rot">Reativados</span>') > 0 && semScript.indexOf('id="k-rt-bar"') > 0);
prova('selo nova/reativada no ranking e novo/reativado no Resultado', scr.indexOf("seloTipo(r.nova, 'a')") > 0 &&
  scr.indexOf("seloTipo(R.nova[v.arrematante], 'o')") > 0 && scr.indexOf('<span class="tag reat">reativad') > 0 &&
  scr.indexOf('<span class="tag ok">nova</span>') < 0);
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
prova('botões Todos lojistas/Novos/Reativados; sem o botão GN/GP', ['>Todos lojistas<', '>Novos<', '>Reativados<'].every((t) => semScript.indexOf(t) > 0) &&
  semScript.indexOf('Somente novos') < 0 &&
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
/* 12/11: a regra nova, do meta (na coleta de prova, o início é 10/11/2025) */
(() => {
  const ini = META_PROVA.inicio_campanha;
  const tela = ini.slice(8, 10) + '/' + ini.slice(5, 7) + '/' + ini.slice(0, 4);
  /* 12/11 (tarde): Novos lojistas e Reativados em entradas separadas */
  const grupos = 'Parceiros C6 - Geral ou Parceiros C6 - Exclusivo SP';
  const aspa = String.fromCharCode(92, 34);
  prova('glossário: Novos lojistas (cadastro desde o início) e Reativados (volta sem compra nos 6 meses), separados, pelos grupos 69 e 146',
    h.indexOf('["Novos lojistas","Lojas cadastradas a partir de ' + tela + ' com um usuário no grupo ' + grupos +
      '. Ficam fora os usuários internos, os cadastros de teste e as contas do banco.') > 0 &&
    h.indexOf('["Reativados","Lojas antigas do grupo ' + grupos + ' que não compraram nada nos 6 meses antes de ' + tela.slice(0, 5) +
      ' e acessaram a plataforma a partir de ' + tela.slice(0, 5) + '. Os compradores desses 6 meses ficam fora (aparecem só nos acessos)') > 0 &&
    h.indexOf('entra no total, mas em nenhum botão de Data') > 0 &&
    h.indexOf('Lojas clientes do C6 (com usuário no grupo') < 0, tela);
  prova('glossário: venda com a vencedora sem loja, selo reativado, CSV com Tipo, gráficos e funil com os reativados',
    h.indexOf('A venda cuja oferta vencedora foi lançada por um usuário interno, sem loja, conta nos vendidos e no valor vendido, mas não nos compradores.') > 0 &&
    h.indexOf('com o selo ' + aspa + 'novo' + aspa + ' ou ' + aspa + 'reativado' + aspa) > 0 &&
    h.indexOf('com a coluna Tipo') > 0 && h.indexOf('Todos lojistas / Novos / Reativados') > 0 &&
    h.indexOf('Total, novas e reativadas') > 0 && h.indexOf('total, novas e reativadas') > 0 &&
    h.indexOf('(sem os reativados, que têm o cartão próprio)') > 0 && h.indexOf('novos lojistas e reativados (os que entraram naquele dia)') > 0);
  prova('glossário: nada da regra do formulário nem do "cadastro fora do período"',
    ['formulário de cadastro', 'Fenauto 2026 C6', 'Fenauto 2025 C6', 'pela campanha Fenauto', 'Acesso e cadastro fora dele'].every((t) => h.indexOf(t) < 0) &&
    h.indexOf('Os novos lojistas têm regra própria (veja Novos lojistas)') > 0);
})();
let semMeta = '';
try {
  const dm = JSON.parse(JSON.stringify(d.consultas));
  dm.forEach((c) => { delete c.json.meta.grupos_c6; });
  roda('montar-painel.js', Object.assign({}, nos, { 'Montar Consultas': dm }));
} catch (e) { semMeta = e.message; }
prova('sem o meta da regra das novas, o Montar Painel para (o glossário mentiria)', semMeta.indexOf('meta da regra das novas ausente') === 0, semMeta);
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
prova('CSV de novos lojistas sem GP e GN, com nome próprio e a coluna Tipo (novo ou reativado)', scr.indexOf("const cab = ['Loja', 'Tipo', 'Primeiro acesso',") > 0 &&
  scr.indexOf("r.nova === 'R' ? 'Reativado' : 'Novo'") > 0 &&
  scr.indexOf("'novos-lojistas-fenauto-c6-'") > 0 && scr.indexOf('r.gp') < 0 && scr.indexOf('r.gn') < 0);
prova('sem pontuação nenhuma no nó nem na página', painelFonte.indexOf('pontos') < 0 && painelFonte.indexOf('PONTOS') < 0 && h.indexOf('Pontuação') < 0);
prova('rodapé sem a data da carteira', scr.indexOf('base_reps') < 0);
prova('nada de "Arremate" na tela; Recuperações nas colunas e no cartão', (() => {
  const vis = semScript + scr.slice(scr.indexOf('function APP('));
  return ["t: 'Arremates'", "'Arremate / FIPE'", "'Arremate / VMV'", 'pontos por arremate', 'loja arrematante']
    .every((t) => vis.indexOf(t) < 0 && out.html.indexOf(t) < 0) &&
    ["t: 'Recuperações'", 'Recuperação / FIPE', 'Recuperação / VMV'].every((t) => out.html.indexOf(t) > 0);
})());

/* ── 3c. a coleta da SEMANA (dados-local.json), com a trava do nome ──────
   A prova de cima roda sem o nome, para ter dado. Aqui a coleta de verdade:
   todo evento é do 43 e tem Fenauto no nome. Na semana de 09/11/2026, os
   dois medidos à parte (consulta independente, 09/11): 24384 (64
   negociações) e 24368 (27). Fora: os da Fenauto do IGA (24377 a 24379). */
(() => {
  const arqL = path.join(__dirname, 'dados-local.json');
  if (!fs.existsSync(arqL)) { console.log('ℹ sem dados-local.json: a prova da semana não rodou'); return; }
  const dl = JSON.parse(fs.readFileSync(arqL, 'utf8'));
  const iE = dl.consultas.findIndex((c) => c.json.queryName === 'eventos');
  const cols = dl.consultas[iE].json.cols;
  const evs = JSON.parse(dl.mcp[iE].json.structuredContent.rows[0][1] || '[]').map((a) => {
    const o = {}; cols.forEach((k, j) => { o[k] = a[j]; }); return o;
  });
  const sem = dl.consultas[0].json.meta.semana;
  /* 12/11: a campanha das novas, fixa (10/11/2026), e toda entrada da coleta
     da semana é desde ela — cadastro novo ou volta */
  const mL = dl.consultas[0].json.meta;
  const iL = dl.consultas.findIndex((c) => c.json.queryName === 'lojas');
  const colsL = dl.consultas[iL].json.cols;
  const entL = JSON.parse(dl.mcp[iL].json.structuredContent.rows[0][1] || '[]').map((a) => a[colsL.indexOf('fenauto')]).filter((x) => x !== null);
  prova('coleta da semana: campanha desde ' + INICIO + ', sem compra desde ' + SEM_COMPRA + ', grupos 69 e 146',
    dl.consultas.every((c) => c.json.meta.inicio_campanha === INICIO && c.json.meta.sem_compra_desde === SEM_COMPRA &&
      JSON.stringify(c.json.meta.grupos_c6) === '[69,146]' && c.json.meta.campanha_novas === undefined) &&
    conta(dl.consultas[iL].json.sql, "'" + INICIO + "'") === 4, mL);
  prova('coleta da semana: há entrada, e toda entrada é de 10/11/2026 em diante', entL.length > 0 && entL.every((x) => x >= INICIO.slice(0, 16)),
    [entL.length, entL.slice().sort()[0]]);
  prova('coleta da semana: com a trava do nome, todo evento do 43 e com Fenauto no nome',
    dl.consultas.every((c) => c.json.sql.indexOf("e.name LIKE '%fenauto%'") > 0) &&
    evs.every((e) => String(e.nome).toLowerCase().indexOf('fenauto') >= 0 && String(e.wls).split(',').indexOf('43') >= 0),
    evs.map((e) => [e.id, e.nome]));
  if (sem[0] === '2026-11-09 00:00:00') {
    const ids = evs.map((e) => Number(e.id)).sort();
    prova('semana de 09/11/2026: os dois eventos Fenauto do C6 medidos, e os do IGA fora',
      JSON.stringify(ids) === JSON.stringify([24368, 24384]), ids);
  }
})();

console.log((falhas ? '✗' : '✓') + ' %d provas, %d falha(s)', ok + falhas, falhas);
if (falhas) process.exit(1);
