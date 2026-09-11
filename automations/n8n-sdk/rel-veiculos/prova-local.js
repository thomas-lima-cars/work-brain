/* ══════════════════════════════════════════════════════════════════════
   PROVA LOCAL — veículos × lojas, com elegibilidade e filtro cruzado
   Roda os três nós Code fora do n8n, com respostas MCP sintéticas.
   Não toca no banco.

   O cenário é desenhado à mão para que TODAS as respostas sejam
   verificáveis no papel: quantos pares devem existir, quais não devem
   existir, e quanto vale cada score.

     node prova-local.js
   ══════════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const AQUI = __dirname;

let falhas = 0;
function ok(cond, msg) {
  console.log((cond ? '  ok   ' : '  FALHA') + ' ' + msg);
  if (!cond) falhas++;
}
function perto(a, b, tol) {
  return a !== null && a !== undefined && Math.abs(a - b) <= (tol === undefined ? 0.15 : tol);
}
function rodaNo(arquivo, ctx) {
  return new Function('$', '$json', '$now', fs.readFileSync(path.join(AQUI, arquivo), 'utf8'))(ctx.$, ctx.$json, new Date());
}
function ctxDe(mapa) {
  return {
    $: (nome) => {
      if (!mapa[nome]) throw new Error('no desconhecido: ' + nome);
      return { all: () => mapa[nome] };
    },
    $json: {}
  };
}
const PAGE = 50;
function resp(cols, rows, pg) {
  const fatia = rows.slice(pg * PAGE, pg * PAGE + PAGE);
  const sc = { columns: cols, rows: fatia };
  if (fatia.length === PAGE) sc.truncated = true;
  return { json: { structuredContent: sc } };
}
function balanceado(s) {
  let n = 0;
  for (const ch of s) { if (ch === '(') n++; else if (ch === ')') n--; if (n < 0) return false; }
  return n === 0;
}

/* ═══ 1. Fase 1 ═════════════════════════════════════════════════════ */
console.log('\n[1] Fase 1 — dimensionamento');
const f1 = rodaNo('montar-fase1.js', ctxDe({}));
const p1 = f1.map((i) => i.json);
const nomes1 = Array.from(new Set(p1.map((p) => p.queryName)));
ok(nomes1.length === 9, '9 queries: ' + nomes1.join(', '));
ok(nomes1.indexOf('q_wl_nomes') >= 0,
   'q_wl_nomes presente — e o que impede id de canal errado de encolher a base calado');
ok(nomes1.indexOf('q_evwl_total') >= 0,
   'q_evwl_total presente — e o que impede q_evento_wl de truncar calada');
ok(nomes1.indexOf('q_evento_wl') >= 0, 'q_evento_wl presente — e a regra de elegibilidade');
ok(p1[0].meta.page === 50, 'PAGE = 50 (teto do MCP)');
/* O recorte deixou de usar o relogio do banco. Isto aqui e o guarda-corpo
   do bug de fuso: o banco responde NOW()/CURDATE() em UTC, mas grava as
   datas dos eventos em hora de Brasilia (medido na sonda 49954). As 21h de
   Brasilia o banco ja acha que e amanha, e o dia inteiro sumiria da base. */
const sel1 = p1[0].meta.selecao;
ok(sel1.indexOf('NOW()') < 0 && sel1.indexOf('CURDATE()') < 0,
   'o recorte NAO usa relogio do banco (que responde em UTC)');
/* Dois modos, e a prova cobre os dois. Com EVENTOS_IDS preenchida o
   recorte e a lista de ids e as datas nao valem; vazia, vale a janela. */
const ids1 = p1[0].meta.eventos_ids || [];
if (ids1.length) {
  ok(sel1.indexOf('e.id IN (' + ids1.join(',') + ')') > 0,
     'modo lista: o recorte sao os ' + ids1.length + ' eventos escolhidos');
  ok(sel1.indexOf('finish_date_event') < 0,
     'modo lista: as datas nao entram no recorte');
} else {
  ok(sel1.indexOf(p1[0].meta.janela_ini) > 0,
     'modo janela: o piso entra como literal, nao como relogio do banco');
  ok(p1[0].meta.janela_ini.slice(11) === '00:00:00',
     'modo janela: piso = meia-noite, evento encerrado no dia continua na base');
  /* SEM TETO tem que significar SEM CLAUSULA. Se `finish_date_event <=`
     sobrasse no SQL com teto vazio, o recorte viraria
     "<= ''" e a base zeraria; e com teto qualquer, evento nao finalizado de
     fim distante ficaria de fora em silencio -- o bug que a mudanca de
     2026-09-10 veio consertar. */
  if (!p1[0].meta.janela_fim) {
    ok(sel1.indexOf('finish_date_event <=') < 0,
       'sem teto: a clausula de teto nao entra no SQL');
    ok(sel1.indexOf('finish_date_event >=') > 0,
       'sem teto: o piso continua valendo');
  } else {
    ok(sel1.indexOf(p1[0].meta.janela_fim) > 0,
       'com teto: o literal do teto entra no recorte');
    const hIni = Date.parse(p1[0].meta.janela_ini.replace(' ', 'T') + 'Z');
    const hFim = Date.parse(p1[0].meta.janela_fim.replace(' ', 'T') + 'Z');
    ok(hFim > hIni, 'com teto: o teto vem depois do piso');
  }
}
/* A ordem e o que importa aqui, e e facil inverter sem perceber. A
   subconsulta acha a ULTIMA negociacao de cada veiculo SEM olhar status;
   o filtro de status vale por fora, sobre ela. Ao contrario, um carro
   vendido hoje reapareceria como disponivel pela negociacao de ontem. */
const un = p1[0].meta.ultima_neg;
ok(un.indexOf('MAX(an.id)') > 0, 'a ultima negociacao sai de MAX(an.id), sem funcao de janela');
ok(un.indexOf('GROUP BY a.vehicle_id') > 0, 'a ultima negociacao e agrupada por VEICULO');
ok(un.indexOf('an.status') < 0, 'a subconsulta NAO filtra status: e a ultima de verdade');
ok(p1[0].meta.disponivel.indexOf('an.status IN (1,11,14,15,18)') > 0,
   'o filtro de status vale por fora: 1 ativo + 11/14/15/18 de sobra');
[9, 13, 2, 3, 7, 8, 10].forEach(function (st) {
  ok(p1[0].meta.disponivel.indexOf(',' + st + ',') < 0 &&
     p1[0].meta.disponivel.indexOf('(' + st + ',') < 0 &&
     p1[0].meta.disponivel.indexOf(',' + st + ')') < 0,
     'status ' + st + ' fica FORA da base');
});
const qvt = p1.find((p) => p.queryName === 'q_veic_total').sql;
ok(qvt.indexOf(un) > 0 && qvt.lastIndexOf('an.status IN') > qvt.indexOf(un),
   'q_veic_total aplica o status DEPOIS do MAX, nao dentro');
ok(sel1.indexOf('e.status') < 0,
   'o recorte nao barra evento encerrado (que fica com events.status = 0)');
ok(p1.every((p) => /LIMIT 50 OFFSET \d+$/.test(p.sql)), 'toda query da fase 1 e paginada');
ok(p1.filter((p) => /OVER\s*\(/i.test(p.sql)).length === 0, 'nenhuma funcao de janela');
ok(p1.every((p) => balanceado(p.sql)), 'parenteses balanceados');
const qwl = p1.find((p) => p.queryName === 'q_evento_wl');
ok(/FROM event_whitelabels ew/.test(qwl.sql), 'q_evento_wl le event_whitelabels');

/* ── o recorte de canais (2026-09-11) ──────────────────────────────────── */
/* Ele vale em QUATRO lugares e faltar um nao da erro: da base errada. */
const WLS = p1[0].meta.whitelabels || [];
if (WLS.length) {
  const lista = WLS.join(',');
  ok(sel1.indexOf('ew2.whitelabel_id IN (' + lista + ')') > 0,
     'SELECAO so aceita evento que alveja um dos ' + WLS.length + ' canais');
  ok(qwl.sql.indexOf('ew.whitelabel_id IN (' + lista + ')') > 0,
     'q_evento_wl so devolve os canais do recorte');
  const qEvwlTot = p1.find((p) => p.queryName === 'q_evwl_total').sql;
  ok(qEvwlTot.indexOf('ew.whitelabel_id IN (' + lista + ')') > 0,
     'q_evwl_total conta a MESMA coisa que q_evento_wl — senao a conferencia de ' +
     'completude acusa falso positivo');
  const qLojTot = p1.find((p) => p.queryName === 'q_lojas_total').sql;
  ok(qLojTot.indexOf('s.whitelabel_id IN (' + lista + ')') > 0,
     'q_lojas_total restringe as lojas ao canal');
  ok(qLojTot.indexOf('INNER JOIN shops s') > 0,
     'e por isso entrou o join em shops no gabarito das lojas');
  const qWlN = p1.find((p) => p.queryName === 'q_wl_nomes');
  ok(!!qWlN && qWlN.sql.indexOf('w.id IN (' + lista + ')') > 0,
     'q_wl_nomes pergunta ao banco o nome de cada id do recorte');
  /* os nomes esperados viajam pro Montar HTML: id errado nao da erro de SQL,
     so devolve base menor, e isso e o pior tipo de defeito */
  const esp = p1[0].meta.wl_esperado || {};
  ok(Object.keys(esp).length === WLS.length,
     'cada id do recorte declara o nome que espera (' + Object.keys(esp).length + ')');
  WLS.forEach((w) => ok(!!esp[String(w)],
    'o canal ' + w + ' declara nome esperado: ' + (esp[String(w)] || 'FALTANDO')));
}

/* ═══ 2. Fase 2 ═════════════════════════════════════════════════════ */
console.log('\n[2] Fase 2 — coleta dimensionada');
const EVENTOS = [[23885, 'Feirao VWFS', 1, '2026-09-08 16:00', '2026-09-10 14:00'],
                 [23903, 'Venda Direta IGA', 1, '2026-09-09 10:00', '2026-09-10 16:00'],
                 /* canal de pessoa fisica: existe evento, nao existe loja */
                 [23904, 'Clube de Associados', 1, '2026-09-09 10:00', '2026-09-11 16:00']];
/* 23885 alveja so o whitelabel 7; 23903 alveja 4 e 7.
   23904 alveja o 62, que NENHUMA loja do universo tem -- e o caso dos 108
   veiculos do run 50106 (Bemol, Apeop, Clube FMP, Omni, Especial LM). */
const EVWL = [[23885, 7, 'Marketplace'], [23903, 4, 'Trucks2you'], [23903, 7, 'Marketplace'],
              [23904, 62, 'Clube Associados']];
/* `pares` mente de proposito quando paresFalsos e passado: e assim que se
   prova que a conferencia de q_evento_wl morde. Sem o branch explicito
   abaixo, o catch-all devolvia colunas erradas, `pares` vinha undefined e o
   guard ficava INERTE no teste -- passando sem nunca ter sido exercitado. */
function fase2Com(veic, lojas, paresFalsos, nomesBanco, modaMentira) {
  nomesBanco = nomesBanco || {};
  return rodaNo('montar-fase2.js', ctxDe({
    'Montar Fase 1': f1,
    'MCP Fase 1': p1.map((p) => {
      if (p.queryName === 'q_eventos') return resp(['evento_id', 'evento', 'ev_status', 'ini_display', 'fim_evento'], EVENTOS, p.pagina);
      if (p.queryName === 'q_veic_total') return resp(['veiculos', 'negociacoes', 'eventos'], [[veic, veic, 2]], p.pagina);
      if (p.queryName === 'q_lojas_total') return resp(['lojas', 'ofertas'], [[lojas, 103923]], p.pagina);
      if (p.queryName === 'q_valor') return resp(['negociacoes', 'sem_valor', 'valor_zero', 'minimo', 'media', 'maximo', 'media_inicial', 'media_fipe'], [[veic, 0, 0, 15000, 92000, 480000, null, 95000]], p.pagina);
      if (p.queryName === 'q_por_status') return resp(['status', 'veiculos'], [[1, 4], [11, 1], [7, 3]], p.pagina);
      /* o banco devolve exatamente os nomes esperados: caminho feliz. O
         caso de id trocado tem prova propria, mais abaixo. */
      if (p.queryName === 'q_moda_lojas') {
        /* cobertura real do fixture; `modaMentira` infla pra provar o guard.
           try/catch porque fase2Com e chamada ANTES de MODELO/CATEG serem
           declarados (zona morta temporal do const) na primeira passagem --
           ali a cobertura ainda nao importa. */
        let nM = 0, nC = 0;
        try {
          nM = new Set(MODELO.map((r) => r[0])).size;
          nC = new Set(CATEG.map((r) => r[0])).size;
        } catch (e) { /* ainda nao declarados */ }
        return resp(['lojas_modelo', 'lojas_categoria'],
          [[nM + (modaMentira || 0), nC]], p.pagina);
      }
      if (p.queryName === 'q_wl_nomes') {
        const esp = p1[0].meta.wl_esperado || {};
        return resp(['whitelabel_id', 'whitelabel'],
          Object.keys(esp).map((id) => [Number(id), nomesBanco[id] || esp[id]]), p.pagina);
      }
      if (p.queryName === 'q_evwl_total') {
        return resp(['pares'], [[paresFalsos === undefined ? EVWL.length : paresFalsos]], p.pagina);
      }
      return resp(['evento_id', 'whitelabel_id', 'whitelabel'], EVWL, p.pagina);
    })
  }));
}
const f2 = fase2Com(168, 1300);
const p2 = f2.map((i) => i.json);
const M = p2[0].meta;
ok(M.pag_veic === 4 && M.pag_lojas === 26, '168 veic -> 4 paginas; 1.300 lojas -> 26');
/* 4 paginas de veiculo + 3 consultas de loja x 26 + 2 modas x 28.
   As modas levam 2 paginas a mais porque empate no topo rende mais de uma
   linha por loja -- ver PAG_MODA na fase 2. */
ok(p2.length === 4 + 3 * 26 + 2 * 28, 'fase 2 = ' + (4 + 3 * 26 + 2 * 28) + ' chamadas — tem ' + p2.length);
ok(M.evento_wl.length === 4, 'o mapa evento->whitelabel chegou no meta (4 linhas)');
/* a fase 2 reconstroi o META do zero: campo esquecido chega undefined em
   silencio. O cabecalho decide a frase do recorte por eventos_ids, entao
   perder este campo faria o relatorio anunciar janela no modo lista. */
ok(M.eventos_ids !== undefined, 'a fase 2 repassa eventos_ids (o cabecalho depende dele)');
/* o filtro de loja da fase 2 tem que ser IDENTICO ao do gabarito da fase 1:
   um dimensiona a paginacao do outro. Divergir gera pagina vazia (que custa
   um agregado inteiro) ou coleta incompleta. */
const qLojas2 = p2.find((p) => p.queryName === 'q_lojas').sql;
const filtroLoja = M.whitelabels && M.whitelabels.length
  ? ' AND s.whitelabel_id IN (' + M.whitelabels.join(',') + ')' : '';
if (filtroLoja) {
  ok(qLojas2.indexOf(filtroLoja.trim()) > 0,
     'q_lojas usa o mesmo filtro de canal que dimensionou a paginacao dela');
  /* TODAS as consultas de loja sao dimensionadas pela MESMA contagem
     (q_lojas_total), entao todas precisam do mesmo filtro. No run 50268 eu
     filtrei so q_lojas: as outras quatro varreram o universo inteiro com
     paginacao do universo filtrado e bateram no teto -- 1.300 = 26 x 50
     linhas em cada uma, tres lojas sem perfil. A conferencia de completude
     pegou; esta prova impede de voltar. */
  ['q_ofertas', 'q_perfil', 'q_modelo', 'q_categoria'].forEach(function (nome) {
    const q = p2.find((x) => x.queryName === nome);
    ok(!!q && q.sql.indexOf(filtroLoja.trim()) > 0,
       nome + ' filtra pelo mesmo canal que a contagem que a dimensiona');
  });
  ok(M.wl_nomes_banco !== undefined,
     'a fase 2 repassa o que o banco respondeu sobre os nomes dos canais');
  /* [neg] id trocado NAO da erro de SQL: `IN (4,7,43,99,...)` roda liso e
     devolve base menor, com um canal faltando. E o pior tipo de defeito --
     o relatorio fica plausivel. So a conferencia nome x id pega. */
  const f2Mentira = fase2Com(168, 1300, undefined, { '7': 'Outro Canal Qualquer' });
  const wlM = f2Mentira[0].json.meta.wl_nomes_banco;
  ok(wlM.some((r) => r.whitelabel === 'Outro Canal Qualquer'),
     '[neg] consegui fazer o banco devolver nome diferente para o canal 7');
}

/* ── leitura() tem que ACUMULAR paginas ────────────────────────────────── */
/* O bug da execucao 50105: o `return` estava DENTRO do laco, entao consulta
   paginada era lida so ate a pagina 0. Com 3 pares de whitelabel o teste
   nunca passava de uma pagina, e por isso a suite inteira passou por cima
   do defeito. Este fixture atravessa DUAS paginas de proposito -- e sem a
   correcao ele para em 50 e a conferencia contra q_evwl_total estoura. */
const EVWL_2PG = [];
for (let i = 0; i < 62; i++) EVWL_2PG.push([23885, 7 + (i % 3), 'wl' + (i % 3)]);
/* try/catch porque com o bug de paginacao a propria fase 2 LANCA (a
   conferencia contra q_evwl_total estoura antes), e excecao no meio da
   suite mata as provas seguintes. Aqui vira falha declarada e a suite
   segue -- foi assim que descobri que a suite inteira parava calada. */
let f2Pag = null;
let erroPag = null;
try {
  f2Pag = rodaNo('montar-fase2.js', ctxDe({
  'Montar Fase 1': f1,
  'MCP Fase 1': p1.map((p) => {
    if (p.queryName === 'q_eventos') return resp(['evento_id', 'evento', 'ev_status', 'ini_display', 'fim_evento'], EVENTOS, p.pagina);
    if (p.queryName === 'q_veic_total') return resp(['veiculos', 'negociacoes', 'eventos'], [[168, 168, 2]], p.pagina);
    if (p.queryName === 'q_lojas_total') return resp(['lojas', 'ofertas'], [[1300, 103923]], p.pagina);
    if (p.queryName === 'q_valor') return resp(['negociacoes', 'sem_valor', 'valor_zero', 'minimo', 'media', 'maximo', 'media_inicial', 'media_fipe'], [[168, 0, 0, 15000, 92000, 480000, null, 95000]], p.pagina);
    if (p.queryName === 'q_por_status') return resp(['status', 'veiculos'], [[1, 4]], p.pagina);
    if (p.queryName === 'q_evwl_total') return resp(['pares'], [[EVWL_2PG.length]], p.pagina);
    return resp(['evento_id', 'whitelabel_id', 'whitelabel'], EVWL_2PG, p.pagina);
  })
  }));
} catch (e) {
  erroPag = String(e.message || e);
}
const evwlLido = f2Pag ? f2Pag[0].json.meta.evento_wl.length : -1;
ok(evwlLido === EVWL_2PG.length,
   'leitura() acumula as paginas: leu ' + evwlLido + ' de ' + EVWL_2PG.length +
   ' pares (com o bug para em ' + PAGE + ')' + (erroPag ? ' — LANCOU: ' + erroPag : ''));
/* [neg] truncar q_evento_wl nao da erro de SQL: o veiculo perde whitelabel e
   vira "sem loja elegivel", igualzinho a um carro sem loja compativel de
   verdade. Este e o unico jeito de essa falha ser audivel. */
let mordeu = false;
try {
  fase2Com(168, 1300, EVWL.length + 7);
} catch (e) {
  mordeu = /q_evento_wl veio incompleta/.test(String(e.message));
}
ok(mordeu, '[neg] a fase 2 mata o run se q_evento_wl vier incompleta');
/* A fase 2 RECONSTROI o META do zero, entao campo que a fase 1 publica e
   ela esquece de repassar chega `undefined` no Montar HTML -- em silencio.
   Foi assim que o selo de "encerrado" nasceu morto no run 49959: o
   `agora_br` nao atravessava, a comparacao virava falsa pra todo mundo e
   ninguem reclamou. Esta prova tranca a ponte. */
['agora_br', 'janela_ini', 'janela_fim', 'data_ini', 'lado', 'page'].forEach(function (campo) {
  ok(M[campo] !== undefined && M[campo] === p1[0].meta[campo],
     'a fase 2 repassa meta.' + campo + ' (' + M[campo] + ')');
});
ok(p2.filter((p) => /OVER\s*\(/i.test(p.sql)).length === 0, 'nenhuma funcao de janela na fase 2');
ok(/ROUND\(an\.value_actual, 2\) AS valor/.test(p2.find((p) => p.queryName === 'q_veiculos').sql),
  'o preco do veiculo e o value_actual');
let morreu = '';
try { fase2Com(0, 1300); } catch (e) { morreu = e.message; }
ok(/nenhum veiculo disponivel/.test(morreu), 'evento sem veiculo morre alto');

/* ═══ 3. ELEGIBILIDADE ══════════════════════════════════════════════ */
console.log('\n[3] Elegibilidade — mesma UF E whitelabel do evento');
const ANO = new Date().getFullYear();
/* lojas: (id, nome, whitelabel_id, whitelabel, uf) */
const LOJAS = [
  [11, 'Apertada SP wl7', 7, 'Marketplace', 'SP'],
  [12, 'Generalista SP wl7', 7, 'Marketplace', 'SP'],
  [13, 'Novata MG wl7', 7, 'Marketplace', 'MG'],
  [14, 'Trucks SP wl4', 4, 'Trucks2you', 'SP'],
  /* mesma UF e mesmo whitelabel dos veiculos de SP, entao ELEGIVEL --
     mas com faixa longe demais: score ~32, abaixo do corte de 50. */
  [15, 'Fora de faixa SP wl7', 7, 'Marketplace', 'SP']
];
const OFERTAS = [[11, 100], [12, 100], [13, 100], [14, 100], [15, 100]];
const PERFIL = [
  [11, 50, 100000, 10000, 5, 1, 100000, 20000],
  [12, 50, 100000, 100000, 5, 5, 100000, 100000],
  /* 4 veiculos de historico -> confianca 4/5 = 0,8. Antes era 1, o que dava
     score 20 e caia no corte; 80 continua provando que a confianca abaixa o
     score, sem sumir da tela. */
  [13, 4, 100000, 10000, 5, 1, 100000, 20000],
  [14, 50, 100000, 10000, 5, 1, 100000, 20000],
  /* faixa apertada e distante: adere quase zero em preco, idade e km */
  [15, 50, 300000, 1000, 15, 0.5, 300000, 1000]
];
const MODELO = [[11, 501, 'Onix', 50], [12, 501, 'Onix', 50], [13, 501, 'Onix', 50], [14, 501, 'Onix', 50], [15, 501, 'Onix', 50]];
const CATEG = [[11, 1, 'Automovel', 80], [12, 1, 'Automovel', 80], [13, 1, 'Automovel', 80], [14, 1, 'Automovel', 80], [15, 1, 'Automovel', 80]];
const COLV = ['neg_id', 'evento_id', 'evento', 'fim_evento', 'anuncio_id', 'vehicle_id', 'valor', 'valor_inicial', 'fipe', 'model_id', 'modelo', 'category_id', 'categoria', 'marca', 'versao', 'anuncio_uuid', 'model_year', 'km', 'loja_id', 'loja_vendedora', 'uf', 'neg_status'];
const VEIC = [
  /* v_orfao: SP, perfil identico ao v0 (onde HA lojas boas), mas no evento
     23904, cujo canal nao tem loja alguma. Fica sem par exclusivamente por
     causa do canal -- e e isso que a prova precisa isolar. */
  [7, 23904, 'Clube de Associados', '2026-09-11 16:00', 906, 5006, 100000, null, 105000, 501, 'Onix', 1, 'Automovel', 'Chevrolet', 'LT 1.0 Flex 12V 5p', 'aaaa9999bbbb8888cccc7777dddd6666', ANO - 5, 100000, 700, 'Vendedora', 'SP', 1],
  /* v0: evento 23885 (wl 7), SP  -> elegiveis: 11 e 12                     */
  [1, 23885, 'Feirao VWFS', '2026-09-10 14:00', 900, 5001, 100000, null, 105000, 501, 'Onix', 1, 'Automovel', 'Chevrolet', 'LT 1.0 Flex 12V 5p', 'aaaa1111bbbb2222cccc3333dddd4444', ANO - 5, 100000, 700, 'Vendedora', 'SP', 1],
  /* v1: evento 23903 (wl 4 e 7), SP -> elegiveis: 11, 12 e 14              */
  [2, 23903, 'Venda Direta IGA', '2026-09-10 16:00', 901, 5002, 120000, null, 125000, 502, 'HB20', 1, 'Automovel', 'Hyundai', 'Comfort Plus 1.0', 'bbbb1111cccc2222dddd3333eeee4444', ANO - 5, 100000, 700, 'Vendedora', 'SP', 1],
  /* v2: evento 23885 (wl 7), MG -> elegivel so a 13                        */
  [3, 23885, 'Feirao VWFS', '2026-09-10 14:00', 902, 5003, 100000, null, 105000, 501, 'Onix', 1, 'Automovel', 'Chevrolet', 'LT 1.0 Flex 12V 5p', 'cccc1111dddd2222eeee3333ffff4444', ANO - 5, 100000, 700, 'Vendedora', 'MG', 1],
  /* v3: evento 23885 (wl 7), RJ -> nenhuma loja no RJ, zero pares          */
  [4, 23885, 'Feirao VWFS', '2026-09-10 14:00', 903, 5004, 100000, null, 105000, 501, 'Onix', 1, 'Automovel', 'Chevrolet', null, 'dddd1111eeee2222ffff3333aaaa4444', ANO - 5, 100000, 700, 'Vendedora', 'RJ', 1],
  /* v4: SOBRA — mesmo perfil do v0, mas status 11 (Sem Ofertas). Tem que
     entrar na base, pontuar igual ao v0 e sair MARCADO como sobra.       */
  [5, 23885, 'Feirao VWFS', '2026-09-10 14:00', 904, 5005, 100000, null, 105000, 501, 'Onix', 1, 'Automovel', 'Chevrolet', 'LT 1.0 Flex 12V 5p', 'eeee1111ffff2222aaaa3333bbbb4444', ANO - 5, 100000, 700, 'Vendedora', 'SP', 11],
  /* v5: DUPLICATA — mesmo vehicle_id do v0 numa negociacao diferente. O
     SQL ja colapsa por veiculo; se um dia parar, isto pega: tem que ser
     descartado E declarado nas falhas, nunca somado duas vezes.          */
  [6, 23903, 'Venda Direta IGA', '2026-09-10 16:00', 905, 5001, 100000, null, 105000, 501, 'Onix', 1, 'Automovel', 'Chevrolet', 'LT 1.0 Flex 12V 5p', 'ffff1111aaaa2222bbbb3333cccc4444', ANO - 5, 100000, 700, 'Vendedora', 'SP', 1]
];
/* 6 veiculos unicos: v0..v4 mais o do canal orfao. A sexta LINHA de VEIC e
   a duplicata do v0 de proposito, e tem que ser descartada e declarada --
   por isso o gabarito e 6, nao 7. */
const f2b = fase2Com(6, 5);
/* nomeado pra ser reusado pela prova negativa de cobertura das modas */
function respostaDe(p) {
  if (p.queryName === 'q_veiculos') return resp(COLV, VEIC, p.pagina);
  if (p.queryName === 'q_lojas') return resp(['shop_id', 'loja', 'whitelabel_id', 'whitelabel', 'uf'], LOJAS, p.pagina);
  if (p.queryName === 'q_ofertas') return resp(['shop_id', 'qt_ofertas'], OFERTAS, p.pagina);
  if (p.queryName === 'q_perfil') return resp(['shop_id', 'qt_veiculos', 'preco_medio', 'preco_desvio', 'idade_media', 'idade_desvio', 'km_medio', 'km_desvio'], PERFIL, p.pagina);
  if (p.queryName === 'q_modelo') return resp(['shop_id', 'item_id', 'nome', 'n'], MODELO, p.pagina);
  return resp(['shop_id', 'item_id', 'nome', 'n'], CATEG, p.pagina);
}
const respostas = f2b.map((i) => i.json).map(respostaDe);
const S = rodaNo('montar-html.js', ctxDe({ 'Montar Fase 2': f2b, 'MCP Fase 2': respostas }))[0].json;
const D = S.DADOS;

ok(D.veiculos.length === 6, '6 veiculos unicos (a duplicata do v0 foi descartada)');
ok(S.falhas.some((f) => /1 veiculo\(s\) vieram mais de uma vez/.test(f)),
   'a duplicata por veiculo vira falha declarada, nao soma silenciosa');
const sobra = D.veiculos.filter((v) => v.sobra);
ok(sobra.length === 1 && D.resumo.sobra === 1, 'exatamente 1 veiculo marcado como sobra');
ok(sobra.length === 1 && sobra[0].neg_status === 11 && sobra[0].status_nome === 'Sem Ofertas',
   'a sobra carrega o status e o nome dele: ' + (sobra[0] ? sobra[0].status_nome : '?'));
ok(D.veiculos.filter((v) => v.neg_status === 1).length === 5, 'os outros 5 estao em status 1 (Ativo)');
const vSobra = sobra[0], v0 = D.veiculos.find((v) => v.neg_id === 1);
ok(vSobra && v0 && vSobra.candidatos === v0.candidatos,
   'sobra concorre em pe de igualdade: mesmos candidatos que o veiculo ativo identico');
/* A q_por_status roda na fase 1; o Montar HTML so le a fase 2. Ela tem que
   pegar carona no META, senao o painel chega vazio sem ninguem reclamar. */
ok((D.por_status || []).length === 3, 'a distribuicao por status atravessou ate o DADOS');
const ps7 = (D.por_status || []).find((r) => r.status === 7);
const ps11 = (D.por_status || []).find((r) => r.status === 11);
ok(ps7 && ps7.no_relatorio === false && ps7.nome === 'Vendido',
   'status 7 aparece na leitura marcado como FORA do relatorio');
ok(ps11 && ps11.no_relatorio === true && ps11.nome === 'Sem Ofertas',
   'status 11 aparece marcado como dentro');
ok(D.resumo.pares === 8, 'PARES = 2 + 3 + 1 + 0 + 2 = 8 — tem ' + D.resumo.pares);
ok(D.veiculos[0].candidatos === 2 || D.veiculos.find((v) => v.neg_id === 1).candidatos === 2,
  'v1 (SP, wl7) tem 2 lojas elegiveis');
const byNeg = {};
D.veiculos.forEach((v, i) => { byNeg[v.neg_id] = { v: v, i: i }; });
ok(byNeg[2].v.candidatos === 3, 'v2 (SP, evento alveja wl 4 e 7) tem 3 elegiveis — tem ' + byNeg[2].v.candidatos);
ok(byNeg[3].v.candidatos === 1, 'v3 (MG) so casa com a loja de MG — tem ' + byNeg[3].v.candidatos);
ok(byNeg[4].v.candidatos === 0, 'v4 (RJ) nao tem nenhuma loja — tem ' + byNeg[4].v.candidatos);
ok(byNeg[4].v.melhor === null, 'v4 sem par fica com melhor = null');
ok(S.falhas.some((f) => /1 veiculo\(s\) sem nenhuma loja/.test(f)),
  'a falha declara o veiculo sem par — ' + JSON.stringify(S.falhas));

/* a loja de MG NAO pode aparecer para o veiculo de SP */
const P = D.pares;
function paresDe(vi) {
  const r = [];
  for (let i = 0; i < P.length; i += 3) if (P[i] === vi) r.push({ li: P[i + 1], s: P[i + 2] / 10 });
  return r;
}
const idsDe = (vi) => paresDe(vi).map((p) => D.lojas[p.li].loja_id).sort();
ok(JSON.stringify(idsDe(byNeg[1].i)) === '[11,12]', 'v1 casa exatamente com 11 e 12 — tem ' + JSON.stringify(idsDe(byNeg[1].i)));
ok(JSON.stringify(idsDe(byNeg[2].i)) === '[11,12,14]', 'v2 casa com 11, 12 e 14 (wl 4 entra) — tem ' + JSON.stringify(idsDe(byNeg[2].i)));
ok(JSON.stringify(idsDe(byNeg[3].i)) === '[13]', 'v3 casa so com a 13 (MG)');
ok(idsDe(byNeg[1].i).indexOf(13) < 0, 'a loja de MG NAO aparece para veiculo de SP');
ok(idsDe(byNeg[1].i).indexOf(14) < 0, 'a loja wl4 NAO aparece em evento que so alveja wl7');
ok(D.lojas.length === 4, 'as 4 lojas com par entram; a 15 nao — tem ' + D.lojas.length);

/* O CORTE DE 50%. A loja 15 e elegivel (mesma UF, mesmo whitelabel) e sem o
   corte apareceria com score ~32. Com ele, nao pode existir em lugar
   nenhum: nem par, nem linha na lista de lojas. */
ok(D.parametros.corresp_min === 50, 'a correspondencia minima viaja no DADOS');
ok(D.parametros.pares_descartados >= 3,
   'o corte derrubou os pares da loja 15 — ' + D.parametros.pares_descartados + ' descartados');
ok(D.lojas.every((l) => l.loja_id !== 15), 'a loja abaixo do corte nao e publicada');
var abaixo = 0;
for (let i = 0; i < P.length; i += 3) if (P[i + 2] / 10 < 50) abaixo++;
ok(abaixo === 0, 'nenhum par publicado esta abaixo do corte — tem ' + abaixo);

/* ═══ 4. A ARITMÉTICA, de novo ══════════════════════════════════════ */
console.log('\n[4] A formula, conferida no papel');
function scoreDe(vi, lojaId) {
  const p = paresDe(vi).find((x) => D.lojas[x.li].loja_id === lojaId);
  return p ? p.s : null;
}
ok(perto(scoreDe(byNeg[1].i, 11), 100, 0.05), 'v1 na media exata da loja 11 -> 100 — tem ' + scoreDe(byNeg[1].i, 11));
ok(perto(scoreDe(byNeg[3].i, 13), 80, 0.05), 'loja 13 tem amostra 4: confianca 4/5 abaixa 100 para 80 — tem ' + scoreDe(byNeg[3].i, 13));
/* v2: 2 desvios acima no preco da loja 11 e de OUTRO modelo.
   pesos  preco 0,90909  idade 0,83333  km 0,83333  modelo 0,5  categoria 0,8 = 3,87575
   ader.  preco 0,33333  idade 1  km 1  modelo 0  categoria 1
   soma(p*a) = 2,76969  ->  2,76969/3,87575 = 71,46 */
ok(perto(scoreDe(byNeg[2].i, 11), 71.5, 0.2), 'score no papel = 71,5 — tem ' + scoreDe(byNeg[2].i, 11));
ok(scoreDe(byNeg[2].i, 12) > scoreDe(byNeg[2].i, 11),
  'a generalista adere mais ao preco fora da media (peso menor, distancia menor)');
const detIdx = [];
for (let i = 0, k = 0; i < P.length; i += 3, k++) if (P[i] === byNeg[2].i && D.lojas[P[i + 1]].loja_id === 11) detIdx.push(k);
ok(D.det[detIdx[0]].preco === 33 && D.det[detIdx[0]].modelo === 0 && D.det[detIdx[0]].categoria === 100,
  'decomposicao do par: preco 33, modelo 0, categoria 100');

/* ═══ 5. O filtro cruzado ═══════════════════════════════════════════ */
console.log('\n[5] Filtro cruzado — as duas direcoes usam os MESMOS pares');
const porV = {}, porL = {};
for (let i = 0; i < P.length; i += 3) {
  (porV[P[i]] = porV[P[i]] || []).push(P[i + 1]);
  (porL[P[i + 1]] = porL[P[i + 1]] || []).push(P[i]);
}
const totalV = Object.keys(porV).reduce((s, k) => s + porV[k].length, 0);
const totalL = Object.keys(porL).reduce((s, k) => s + porL[k].length, 0);
ok(totalV === totalL && totalV === D.resumo.pares, 'veiculo->loja e loja->veiculo somam o mesmo: ' + totalV);
const li11 = D.lojas.findIndex((l) => l.loja_id === 11);
ok(porL[li11].length === 3, 'a loja 11 aparece para 3 veiculos (os dois SP ativos + a sobra) — tem ' + porL[li11].length);
const li13 = D.lojas.findIndex((l) => l.loja_id === 13);
ok(porL[li13].length === 1, 'a loja 13 (MG) so aparece para o veiculo de MG');
ok(D.lojas[li11].pares === 3 && D.lojas[li13].pares === 1, 'a contagem de pares por loja bate');
ok(D.lojas[li11].melhor === 100, 'melhor score da loja 11 = 100');

/* ═══ 6. HTML ═══════════════════════════════════════════════════════ */
console.log('\n[6] HTML');
const h = S.html;
ok(h.indexOf('<!doctype html>') === 0 && h.indexOf('</html>') > 0, 'HTML integro');
ok((h.match(/<script>/g) || []).length === 2, '2 blocos de script');
ok(!/[a-z-]+:\s*[\d]+,[\d]+(%|px|em)/.test(h), 'nenhum valor CSS com virgula decimal');
ok(h.indexOf('2d5party') < 0, 'sem o lixo de CSS que eu tinha digitado');
ok(h.indexOf('mesma UF') > 0 && h.indexOf('whitelabels que o evento alveja') > 0,
  'a pagina explica a regra de elegibilidade');
ok(h.indexOf('adição minha') > 0, 'a pagina declara a confianca como adicao minha');

/* [neg] truncamento numa consulta de MODA nao da erro: as lojas cortadas
   so perdem o componente de modelo/categoria, e o score delas sai menor
   sem uma linha de aviso. A conferencia e por LOJA DISTINTA porque o
   numero de LINHAS depende de empates e nao da pra prever. */
const f2Moda = fase2Com(6, 5, undefined, undefined, 3);
const dModa = rodaNo('montar-html.js', ctxDe({
  'Montar Fase 2': f2Moda,
  'MCP Fase 2': f2Moda.map((i) => i.json).map(respostaDe)
}))[0].json.DADOS;
ok(dModa.falhas.some((f) => f.indexOf('a moda de modelo cobriu') >= 0),
   '[neg] cobertura menor que a contagem vira falha declarada');
ok(h.indexOf('id="t_v"') > 0 && h.indexOf('id="t_l"') > 0, 'as duas tabelas existem');
ok(h.indexOf('id="limpar"') > 0, 'botao de limpar selecao');
const m = h.match(/<script>const D=([\s\S]*?);<\/script>/);
const rep = JSON.parse(m[1].split('<\\/').join('</'));
ok(rep.pares.length === 24, 'JSON embarcado: 8 pares x 3 numeros = 24 — tem ' + rep.pares.length);
ok(rep.det.length === 8, 'uma decomposicao por par');

/* erro de query continua legivel */
const respE = f2b.map((i) => i.json).map((p, i) =>
  p.queryName === 'q_perfil' ? { json: { error: { message: 'query validation failed: syntax error at position 438' } } } : respostas[i]);
const sE = rodaNo('montar-html.js', ctxDe({ 'Montar Fase 2': f2b, 'MCP Fase 2': respE }))[0].json;
const dP = sE.diagnostico.find((d) => d.queryName === 'q_perfil');
ok(dP.erro.indexOf('[object Object]') < 0 && dP.erro.indexOf('position 438') >= 0,
  'erro objeto vira mensagem real');


/* ═══ 7. Extrato da loja ════════════════════════════════════════════ */
console.log('\n[7] Extrato da loja');
const lj = D.lojas[0];
['idade_desvio', 'km_desvio', 'p_preco', 'p_idade', 'p_km', 'confianca'].forEach((k) => {
  ok(lj[k] !== undefined, 'a loja publica ' + k + ' (o extrato precisa)');
});
ok(h.indexOf('id="extrato"') > 0, 'o container do extrato existe no HTML');
ok(h.indexOf('function extrato()') > 0, 'a funcao do extrato existe');
ok(h.indexOf('LIMIAR=70') > 0, 'o limiar de 70% esta no codigo');
ok(h.indexOf('extrato();}') > 0, 'o extrato e repintado junto com as tabelas');
ok(h.indexOf('Extrato da loja') > 0, 'o titulo do extrato aparece');
ok(h.indexOf('Veículos com aderência acima de') > 0, 'a lista acima do limiar existe');
/* o peso tem que bater com 1/(1+desvio/media) */
const espPreco = 1 / (1 + (lj.preco_desvio / lj.preco_medio));
ok(perto(lj.p_preco, Math.round(espPreco * 1000) / 1000, 0.002),
  'peso de preco publicado = 1/(1+CV) — tem ' + lj.p_preco);

/* ═══ 8. O JS que roda no NAVEGADOR ═════════════════════════════════
   Esta secao existe por causa de um bug real: o APP viaja dentro do no
   como string, entao `node --check` nunca o via. Passou um
   `"+(comScore?...` que quebrava a pagina e so aparecia no navegador.
   Agora o codigo do cliente e checado E executado num DOM de mentira. */
console.log('\n[8] JS do navegador');
const smokeErros = require('./_smoke_dom.js').smoke(h);
smokeErros.forEach((e) => ok(false, e));
ok(smokeErros.length === 0, 'sintaxe, execucao e alinhamento de colunas do JS do cliente');
/* o smoke precisa provar que morde — um teste que so passa nao prova nada.
   Os dois bugs abaixo sao reais: escaparam para o navegador do Thomas. */
const quebrado = h.replace('(comScore?celulas(', '"+(comScore?celulas(', 1);
ok(require('./_smoke_dom.js').smoke(quebrado).length > 0,
  '[neg] o smoke pega o erro de sintaxe na concatenacao');
/* bug 2: <option> sem value -> o valor vira o texto COM a contagem */
/* As opcoes passaram a ser montadas por um helper generico (`opcoes`), que
   serve aos tres dropdowns. A sabotagem acompanha: tirar o `value` faz o
   select devolver o TEXTO da opcao, contagem inclusa, e nenhuma comparacao
   casa. Foi assim que a tabela de veiculos zerou na mao do Thomas. */
const semValue = h.replace("<option value='\"+i+\"'>\"+rotulo(it)+", '<option>"+rotulo(it)+');
ok(semValue !== h, '[neg] consegui reintroduzir o option sem value');
ok(require('./_smoke_dom.js').smoke(semValue).length > 0,
  '[neg] o smoke pega o filtro de evento que nao filtra');
/* bug 3: o link montado com pedaco faltando. E o erro que a lista LM ja
   cometeu uma vez -- filtrar por "tem link" em vez de "esta no ar" -- e aqui
   a versao equivalente e deixar 'undefined' virar trecho da URL. */
const linkPodre = h.replace('r.v.link?', 'true?');
ok(linkPodre !== h, '[neg] consegui forcar link em veiculo sem pedaco');
ok(require('./_smoke_dom.js').smoke(linkPodre).length > 0,
  '[neg] o smoke pega link com undefined/null no meio');
/* bug 4: o <a> sem stopPropagation -> clicar no link tambem mexe na selecao */
/* ancora sem barra invertida de proposito: casar o `onclick=\'...\'` inteiro
   exigiria escapar a barra tres vezes, e barra a mais e exatamente o erro
   que derrubou a execucao 49963. */
const semStop = h.replace('event.stopPropagation()', 'void 0');
ok(semStop !== h, '[neg] consegui tirar o stopPropagation do link');
ok(require('./_smoke_dom.js').smoke(semStop).length > 0,
  '[neg] o smoke pega o link que mexe na selecao da linha');

/* ── [9] a UF do veiculo sai do PATIO ─────────────────────────────────── */
console.log('\n[9] UF pelo patio e link do anuncio');
const sqlV = p2.find((p) => p.queryName === 'q_veiculos').sql;
/* 68% dos veiculos tem UF de patio diferente da UF da loja (sonda 50068), e
   UF e metade da regra de elegibilidade -- se esta query voltar a ler
   shop_addresses, o par (veiculo, loja) muda sem ninguem notar. */
ok(sqlV.indexOf('shop_stocks ss') > 0, 'q_veiculos entra em shop_stocks');
ok(sqlV.indexOf('COALESCE(a.shop_stock_id, v.shop_stock_id)') > 0,
   'o patio vem pelos dois caminhos, preferindo o do anuncio');
ok(sqlV.indexOf('UPPER(TRIM(ss.state))') > 0, 'a UF do veiculo sai de ss.state');
ok(sqlV.indexOf('shop_addresses') < 0,
   'q_veiculos NAO le mais shop_addresses (join que ninguem le custa caro)');
/* a UF da LOJA continua sendo a dela -- o carro esta no patio, a loja
   compradora esta onde ela e. Trocar as duas seria o erro simetrico. */
const sqlL = p2.find((p) => p.queryName === 'q_lojas').sql;
ok(sqlL.indexOf('sa.state') > 0, 'q_lojas mantem a UF do endereco da loja');

/* ── o link ───────────────────────────────────────────────────────────── */
ok(sqlV.indexOf('a.uuid AS anuncio_uuid') > 0, 'q_veiculos traz o uuid');
ok(sqlV.indexOf('ve.name AS versao') > 0, 'q_veiculos traz a versao');
ok(sqlV.indexOf('versions ve') > 0, 'q_veiculos entra em versions');
/* GROUP BY incompleto em MySQL nao da erro: escolhe um valor qualquer. Sem
   esta prova, versao e uuid poderiam vir de outra linha do grupo. */
ok(/GROUP BY[\s\S]*versao/.test(sqlV) && /GROUP BY[\s\S]*anuncio_uuid/.test(sqlV),
   'GROUP BY lista versao e anuncio_uuid');

/* o padrao, conferido contra os exemplos do Gui (reuniao de 25/08) */
const vLink = D.veiculos.find((v) => v.vehicle_id === 5001 && v.link);
ok(!!vLink, 'ha veiculo com link montado');
ok(vLink.link.indexOf('https://cars2you.com.br/anuncio/veiculo/') === 0,
   'o link comeca com o padrao decidido em 25/08');
/* so os TRECHOS, nao a URL toda: comparar a url inteira com toLowerCase()
   passaria de graca, porque 'https' ja e minusculo. A marca sintetica e
   'Chevrolet' com C maiusculo, entao esta prova morde de verdade. */
const trechos = vLink.link.split('/anuncio/veiculo/')[1];
ok(trechos === trechos.toLowerCase(), 'os trechos vao em minusculo');
ok(vLink.link.indexOf('%20') > 0, 'espaco vira %20, NAO hifen');
ok(vLink.link.split('/').pop().indexOf('-') < 0, 'o uuid vai sem hifens');
ok(vLink.link.split('/anuncio/veiculo/')[1].split('/').length === 4,
   'quatro trechos: marca, modelo, versao e uuid');

/* a regra dura, ponta a ponta: o v3 nao tem versao */
const semVersao = D.veiculos.filter((v) => !v.versao);
ok(semVersao.length === 1, 'o dado sintetico tem 1 veiculo sem versao');
ok(semVersao[0].link === null,
   'sem um pedaco, NAO sai link (melhor sem botao que botao pra lugar nenhum)');
ok(h.indexOf('undefined/') < 0 && h.indexOf('/null/') < 0,
   'nenhum link com undefined ou null no meio chegou ao HTML');

/* e o link aparece de fato na tela, com o stopPropagation que impede o
   clique de mexer na selecao da linha por baixo */
/* No HTML estatico existem os DOIS pontos de montagem do <a> (a linha de
   contexto e o cabecalho do detalhe), nao as linhas renderizadas -- a tabela
   e construida no navegador. Contar links aqui enganaria; quem conta o
   render de verdade e o _smoke_dom, que roda o JS contra um DOM de mentira. */
const nSites = (h.match(/class='lk'/g) || []).length;
ok(nSites === 2, 'os dois pontos de montagem do link estao no template (' + nSites + ')');

/* ── as TRES causas de "sem correspondencia" ───────────────────────────── */
console.log('\n[10] sem correspondencia: tres causas, tres decisoes');
const R = D.resumo;
/* Declarar as tres como uma frase so fez o run 50106 parecer ter 23% de
   buraco, quando 9,6% era impossivel por construcao e so 8,8% respondia ao
   limiar. Baixar o corte nao mexe nas outras duas populacoes. */
ok(R.sem_canal + R.sem_loja_na_uf + R.cortados_pelo_min === R.sem_par,
   'as tres causas somam exatamente o total sem par (' + R.sem_canal + '+' +
   R.sem_loja_na_uf + '+' + R.cortados_pelo_min + '=' + R.sem_par + ')');

const orfao = D.veiculos.find((v) => v.vehicle_id === 5006);
ok(!!orfao, 'o veiculo do canal orfao chegou ao relatorio');
ok(orfao.canal_sem_loja === true, 'ele esta marcado como canal sem loja');
ok(orfao.elegiveis === 0, 'e nenhuma loja passou na regra de elegibilidade');
ok(orfao.uf === 'SP', 'ele esta em SP DE PROPOSITO — onde ha lojas boas, ' +
   'entao a causa so pode ser o canal');
ok(R.sem_canal === 1, 'exatamente 1 veiculo em canal sem loja');

/* as categorias tem que ser mutuamente exclusivas, senao a soma acima
   fecharia por acaso */
const duplaCategoria = D.veiculos.filter((v) => v.canal_sem_loja && v.elegiveis > 0).length;
ok(duplaCategoria === 0, 'nenhum veiculo cai em duas categorias ao mesmo tempo');

/* e o texto tem que dizer QUAL causa, nao "ou uma ou outra" */
const txt = D.falhas.join(' | ');
ok(txt.indexOf('canal NAO TEM loja alguma') >= 0,
   'a falha nomeia o canal sem loja em vez de generalizar');
ok(txt.indexOf('e so ' + 'estes, que mudariam se o corte baixasse') >= 0 ||
   txt.indexOf('mudariam se o corte baixasse') >= 0 ||
   R.cortados_pelo_min === 0,
   'a falha do corte diz que so ela responde ao limiar');

/* ── a fonte nao pode reacumular barra invertida ───────────────────────── */
/* Nao e estilo: este arquivo e transcrito a mao pro n8n como string JSON, e
   em 2026-09-10 as 248 sequencias `\'` foram dobradas em DUAS tentativas
   seguidas -- 568 barras no no, JS do cliente sem compilar, mesma classe de
   erro que derrubou a execucao 49963. Com crase e caractere literal sobraram
   4 barras, que dao pra conferir na mao. Se este numero subir, a armadilha
   voltou -- e ela nao avisa: ela derruba o run inteiro. */
const fonteHtml = fs.readFileSync(path.join(AQUI, 'montar-html.js'), 'utf8');
/* As checagens valem sobre o CODIGO, nao sobre a documentacao do codigo: o
   comentario que explica a regra precisa citar as sequencias proibidas, e
   uma prova que se ofende com a propria explicacao vira ruido que se aprende
   a ignorar. Comentario de bloco sai antes de medir. */
const semComent = fonteHtml.replace(/\/\*[\s\S]*?\*\//g, '');
/* a remocao nao pode ter comido codigo -- se comeu, o resto das provas
   passaria medindo um arquivo que nao existe */
['function linkAnuncio', 'const APP = [', 'const CSS = [', 'return [{']
  .forEach((marca) => ok(semComent.indexOf(marca) > 0,
    'a limpeza de comentarios preservou ' + marca));

const nBarras = (semComent.match(/\\/g) || []).length;
ok(nBarras <= 4, 'o codigo tem no maximo 4 barras invertidas (tem ' + nBarras + ')');
/* a assinatura da corrupcao e ESTA: duas barras antes da aspa. Foi o que
   apareceu nas duas transcricoes de 2026-09-10 (568 barras, cliente sem
   compilar). Uma barra so seria o escape legitimo; duas nunca sao. */
ok(semComent.indexOf('\\\\\'') < 0,
   'nenhuma aspa com escape DOBRADO — a assinatura que derrubou as duas transcricoes');
ok(semComent.indexOf("\\'") < 0,
   'nenhum escape de aspa simples: elemento de array usa crase');
ok(semComent.indexOf('${') < 0,
   'nenhuma interpolacao: com crase, ${ deixaria de ser texto literal');

/* ── o cabecalho descreve a janela QUE EXISTE ──────────────────────────── */
/* sem teto, a frase antiga imprimia "entre <piso> e <b>?</b>" -- detalhe que
   faz o leitor desconfiar do relatorio inteiro, com razao */
ok(h.indexOf('e <b>?</b>') < 0, 'o cabecalho nao anuncia teto inexistente');
ok(h.indexOf('mais os que ainda não encerraram') > 0,
   'o cabecalho diz que os nao encerrados entram');
ok(h.indexOf('a partir de <b>' + (D.meta.janela_ini || '')) > 0,
   'o cabecalho publica o piso real do recorte');
ok(h.indexOf('event.stopPropagation()') > 0,
   'o clique no link nao mexe na selecao da linha');
ok(h.indexOf("rel=\'noopener\'") > 0 || h.indexOf('noopener') > 0,
   'o link abre em outra aba com noopener');

fs.writeFileSync(path.join(AQUI, 'saida-teste-local.html'), h);
console.log('\nHTML de teste: saida-teste-local.html (' + h.length + ' bytes)');
console.log('ATENCAO: dado 100% SINTETICO.');
console.log(falhas === 0 ? '\n=== TODAS AS PROVAS PASSARAM ===' : '\n=== ' + falhas + ' FALHA(S) ===');
process.exit(falhas === 0 ? 0 : 1);
