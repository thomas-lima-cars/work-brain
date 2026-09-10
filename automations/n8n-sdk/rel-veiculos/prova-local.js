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
ok(nomes1.length === 5, '5 queries: ' + nomes1.join(', '));
ok(nomes1.indexOf('q_evento_wl') >= 0, 'q_evento_wl presente — e a regra de elegibilidade');
ok(p1[0].meta.page === 50, 'PAGE = 50 (teto do MCP)');
ok(/INTERVAL 48 HOUR/.test(p1[0].meta.selecao), 'recorte padrao = proximas 48h');
ok(/an\.status = 1/.test(p1[0].meta.disponivel), 'disponivel = status 1 (medido na sonda 49813)');
ok(p1.every((p) => /LIMIT 50 OFFSET \d+$/.test(p.sql)), 'toda query da fase 1 e paginada');
ok(p1.filter((p) => /OVER\s*\(/i.test(p.sql)).length === 0, 'nenhuma funcao de janela');
ok(p1.every((p) => balanceado(p.sql)), 'parenteses balanceados');
const qwl = p1.find((p) => p.queryName === 'q_evento_wl');
ok(/FROM event_whitelabels ew/.test(qwl.sql), 'q_evento_wl le event_whitelabels');

/* ═══ 2. Fase 2 ═════════════════════════════════════════════════════ */
console.log('\n[2] Fase 2 — coleta dimensionada');
const EVENTOS = [[23885, 'Feirao VWFS', 1, '2026-09-08 16:00', '2026-09-10 14:00'],
                 [23903, 'Venda Direta IGA', 1, '2026-09-09 10:00', '2026-09-10 16:00']];
/* 23885 alveja so o whitelabel 7; 23903 alveja 4 e 7 */
const EVWL = [[23885, 7, 'Marketplace'], [23903, 4, 'Trucks2you'], [23903, 7, 'Marketplace']];
function fase2Com(veic, lojas) {
  return rodaNo('montar-fase2.js', ctxDe({
    'Montar Fase 1': f1,
    'MCP Fase 1': p1.map((p) => {
      if (p.queryName === 'q_eventos') return resp(['evento_id', 'evento', 'ev_status', 'ini_display', 'fim_evento'], EVENTOS, p.pagina);
      if (p.queryName === 'q_veic_total') return resp(['veiculos', 'negociacoes', 'eventos'], [[veic, veic, 2]], p.pagina);
      if (p.queryName === 'q_lojas_total') return resp(['lojas', 'ofertas'], [[lojas, 103923]], p.pagina);
      if (p.queryName === 'q_valor') return resp(['negociacoes', 'sem_valor', 'valor_zero', 'minimo', 'media', 'maximo', 'media_inicial', 'media_fipe'], [[veic, 0, 0, 15000, 92000, 480000, null, 95000]], p.pagina);
      return resp(['evento_id', 'whitelabel_id', 'whitelabel'], EVWL, p.pagina);
    })
  }));
}
const f2 = fase2Com(168, 1300);
const p2 = f2.map((i) => i.json);
const M = p2[0].meta;
ok(M.pag_veic === 4 && M.pag_lojas === 26, '168 veic -> 4 paginas; 1.300 lojas -> 26');
ok(p2.length === 4 + 5 * 26, 'fase 2 = 134 chamadas — tem ' + p2.length);
ok(M.evento_wl.length === 3, 'o mapa evento->whitelabel chegou no meta (3 linhas)');
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
  [14, 'Trucks SP wl4', 4, 'Trucks2you', 'SP']
];
const OFERTAS = [[11, 100], [12, 100], [13, 100], [14, 100]];
const PERFIL = [
  [11, 50, 100000, 10000, 5, 1, 100000, 20000],
  [12, 50, 100000, 100000, 5, 5, 100000, 100000],
  [13, 1, 100000, 10000, 5, 1, 100000, 20000],
  [14, 50, 100000, 10000, 5, 1, 100000, 20000]
];
const MODELO = [[11, 501, 'Onix', 50], [12, 501, 'Onix', 50], [13, 501, 'Onix', 50], [14, 501, 'Onix', 50]];
const CATEG = [[11, 1, 'Automovel', 80], [12, 1, 'Automovel', 80], [13, 1, 'Automovel', 80], [14, 1, 'Automovel', 80]];
const COLV = ['neg_id', 'evento_id', 'evento', 'fim_evento', 'anuncio_id', 'vehicle_id', 'valor', 'valor_inicial', 'fipe', 'model_id', 'modelo', 'category_id', 'categoria', 'marca', 'model_year', 'km', 'loja_id', 'loja_vendedora', 'uf'];
const VEIC = [
  /* v0: evento 23885 (wl 7), SP  -> elegiveis: 11 e 12                     */
  [1, 23885, 'Feirao VWFS', '2026-09-10 14:00', 900, 5001, 100000, null, 105000, 501, 'Onix', 1, 'Automovel', 'Chevrolet', ANO - 5, 100000, 700, 'Vendedora', 'SP'],
  /* v1: evento 23903 (wl 4 e 7), SP -> elegiveis: 11, 12 e 14              */
  [2, 23903, 'Venda Direta IGA', '2026-09-10 16:00', 901, 5002, 120000, null, 125000, 502, 'HB20', 1, 'Automovel', 'Hyundai', ANO - 5, 100000, 700, 'Vendedora', 'SP'],
  /* v2: evento 23885 (wl 7), MG -> elegivel so a 13                        */
  [3, 23885, 'Feirao VWFS', '2026-09-10 14:00', 902, 5003, 100000, null, 105000, 501, 'Onix', 1, 'Automovel', 'Chevrolet', ANO - 5, 100000, 700, 'Vendedora', 'MG'],
  /* v3: evento 23885 (wl 7), RJ -> nenhuma loja no RJ, zero pares          */
  [4, 23885, 'Feirao VWFS', '2026-09-10 14:00', 903, 5004, 100000, null, 105000, 501, 'Onix', 1, 'Automovel', 'Chevrolet', ANO - 5, 100000, 700, 'Vendedora', 'RJ']
];
const f2b = fase2Com(4, 4);
const respostas = f2b.map((i) => i.json).map((p) => {
  if (p.queryName === 'q_veiculos') return resp(COLV, VEIC, p.pagina);
  if (p.queryName === 'q_lojas') return resp(['shop_id', 'loja', 'whitelabel_id', 'whitelabel', 'uf'], LOJAS, p.pagina);
  if (p.queryName === 'q_ofertas') return resp(['shop_id', 'qt_ofertas'], OFERTAS, p.pagina);
  if (p.queryName === 'q_perfil') return resp(['shop_id', 'qt_veiculos', 'preco_medio', 'preco_desvio', 'idade_media', 'idade_desvio', 'km_medio', 'km_desvio'], PERFIL, p.pagina);
  if (p.queryName === 'q_modelo') return resp(['shop_id', 'item_id', 'nome', 'n'], MODELO, p.pagina);
  return resp(['shop_id', 'item_id', 'nome', 'n'], CATEG, p.pagina);
});
const S = rodaNo('montar-html.js', ctxDe({ 'Montar Fase 2': f2b, 'MCP Fase 2': respostas }))[0].json;
const D = S.DADOS;

ok(D.veiculos.length === 4, '4 veiculos');
ok(D.resumo.pares === 6, 'PARES = 2 + 3 + 1 + 0 = 6 — tem ' + D.resumo.pares);
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
ok(D.lojas.length === 4, 'as 4 lojas participam de pelo menos um par');

/* ═══ 4. A ARITMÉTICA, de novo ══════════════════════════════════════ */
console.log('\n[4] A formula, conferida no papel');
function scoreDe(vi, lojaId) {
  const p = paresDe(vi).find((x) => D.lojas[x.li].loja_id === lojaId);
  return p ? p.s : null;
}
ok(perto(scoreDe(byNeg[1].i, 11), 100, 0.05), 'v1 na media exata da loja 11 -> 100 — tem ' + scoreDe(byNeg[1].i, 11));
ok(perto(scoreDe(byNeg[3].i, 13), 20, 0.05), 'loja 13 tem amostra 1: confianca 1/5 -> 20 — tem ' + scoreDe(byNeg[3].i, 13));
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
ok(porL[li11].length === 2, 'a loja 11 aparece para 2 veiculos (v1 e v2) — tem ' + porL[li11].length);
const li13 = D.lojas.findIndex((l) => l.loja_id === 13);
ok(porL[li13].length === 1, 'a loja 13 (MG) so aparece para o veiculo de MG');
ok(D.lojas[li11].pares === 2 && D.lojas[li13].pares === 1, 'a contagem de pares por loja bate');
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
ok(h.indexOf('adicao minha') > 0, 'a pagina declara a confianca como adicao minha');
ok(h.indexOf('id="t_v"') > 0 && h.indexOf('id="t_l"') > 0, 'as duas tabelas existem');
ok(h.indexOf('id="limpar"') > 0, 'botao de limpar selecao');
const m = h.match(/<script>const D=([\s\S]*?);<\/script>/);
const rep = JSON.parse(m[1].split('<\\/').join('</'));
ok(rep.pares.length === 18, 'JSON embarcado: 6 pares x 3 numeros = 18 — tem ' + rep.pares.length);
ok(rep.det.length === 6, 'uma decomposicao por par');

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
ok(h.indexOf('Veiculos com aderencia acima de') > 0, 'a lista acima do limiar existe');
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
const semValue = h.replace("<option value='\"+i+\"'>\"+esc(e)+", '<option>"+e+');
ok(semValue !== h, '[neg] consegui reintroduzir o option sem value');
ok(require('./_smoke_dom.js').smoke(semValue).length > 0,
  '[neg] o smoke pega o filtro de evento que nao filtra');

fs.writeFileSync(path.join(AQUI, 'saida-teste-local.html'), h);
console.log('\nHTML de teste: saida-teste-local.html (' + h.length + ' bytes)');
console.log('ATENCAO: dado 100% SINTETICO.');
console.log(falhas === 0 ? '\n=== TODAS AS PROVAS PASSARAM ===' : '\n=== ' + falhas + ' FALHA(S) ===');
process.exit(falhas === 0 ? 0 : 1);
