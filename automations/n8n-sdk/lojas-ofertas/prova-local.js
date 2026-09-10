/* ══════════════════════════════════════════════════════════════════════
   PROVA LOCAL — roda os três nós Code fora do n8n, com respostas MCP
   sintéticas. Não toca no banco.

   Regressões dos defeitos reais encontrados em produção:
     [R1] 49799 — função de janela: o MCP rejeita `OVER (`
     [R2] 49799 — resposta cortada em 50 linhas com `truncated: true`
     [R3] 49799 — erro objeto virando "[object Object]" no diagnóstico
     [R4] 49803 — paginação chutada: página que sobra custa um agregado
                  completo e devolve zero linha

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

function rodaNo(arquivo, ctx) {
  const src = fs.readFileSync(path.join(AQUI, arquivo), 'utf8');
  return new Function('$', '$json', '$now', src)(ctx.$, ctx.$json, new Date());
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

/* ═══ 1. Fase 1 — Montar Totais ═════════════════════════════════════ */
console.log('\n[1] Fase 1 — Montar Totais');
const itensT = rodaNo('montar-totais.js', ctxDe({}));
ok(itensT.length === 1, 'a fase 1 gasta exatamente 1 chamada — tem ' + itensT.length);
const t0 = itensT[0].json;
ok(t0.queryName === 'q_totais', 'queryName = q_totais');
ok(/COUNT\(DISTINCT o\.buyer_shop_id\) AS lojas/.test(t0.sql), 'conta lojas distintas');
ok(/COUNT\(\*\) AS ofertas/.test(t0.sql), 'conta ofertas');
ok(t0.meta.page === 50, '[R2] PAGE = 50 desde a fase 1');
ok(t0.meta.lado === 'buyer_shop_id', 'lado confirmado: buyer_shop_id');
ok(!/LIMIT/.test(t0.sql), 'a query de total nao precisa de LIMIT');

/* ═══ 2. Fase 2 — Montar Queries, dimensionada ══════════════════════ */
console.log('\n[2] Fase 2 — Montar Queries dimensionada pelo total');
function respTotais(lojas, ofertas) {
  return [{ json: { structuredContent: { columns: ['lojas', 'ofertas'], rows: [[lojas, ofertas]] } } }];
}
function montaCom(lojas, ofertas) {
  return rodaNo('montar-queries.js', ctxDe({
    'Montar Totais': itensT,
    'MCP Totais': respTotais(lojas, ofertas)
  }));
}

/* [R4] o caso da 49803: 1.234 lojas deve dar 25 paginas, nao 60 */
const grande = montaCom(1234, 98765).map((i) => i.json);
ok(grande[0].meta.pages === 25, '[R4] 1.234 lojas -> ceil(1234/50) = 25 paginas — tem ' + grande[0].meta.pages);
ok(grande.length === 125, '[R4] 5 queries x 25 paginas = 125 chamadas — tem ' + grande.length);
ok(grande[0].meta.chamadas === 126, '[R4] 126 chamadas no total (125 + a fase 1)');
const maiorOffset = Math.max.apply(null, grande.map((p) => Number(/OFFSET (\d+)$/.exec(p.sql)[1])));
ok(maiorOffset === 1200, '[R4] maior OFFSET = 1200, cobre a loja 1234 sem passar longe');
ok(maiorOffset + 50 >= 1234, '[R4] a ultima pagina alcanca a ultima loja');
ok(maiorOffset < 1234, '[R4] nenhuma pagina comeca depois do fim dos dados');

/* o desperdicio que a 49803 teve, medido */
const desperdicio60 = (60 - 25) * 5;
ok(desperdicio60 === 175, 'para efeito de registro: o teto de 60 gerava 175 chamadas vazias');

/* pequeno: 4 lojas -> 1 pagina */
const itensQ = montaCom(4, 565);
const pedidos = itensQ.map((i) => i.json);
const META = pedidos[0].meta;
ok(META.pages === 1, '4 lojas -> 1 pagina');
ok(pedidos.length === 5, '5 chamadas (5 queries x 1 pagina) — tem ' + pedidos.length);
ok(META.esperado_lojas === 4 && META.esperado_ofertas === 565, 'gabarito carregado no meta');

const nomes = Array.from(new Set(pedidos.map((p) => p.queryName)));
ok(['q_lojas', 'q_ofertas', 'q_perfil', 'q_modelo', 'q_categoria'].every((n) => nomes.indexOf(n) >= 0),
  '5 queries: ' + nomes.join(', '));
ok(nomes.indexOf('q_totais') < 0, 'q_totais NAO se repete na fase 2');

/* [R1] nenhuma funcao de janela */
ok(pedidos.filter((p) => /OVER\s*\(/i.test(p.sql)).length === 0, '[R1] nenhuma funcao de janela');
ok(pedidos.every((p) => !/ROW_NUMBER|RANK\s*\(|DENSE_RANK/i.test(p.sql)), '[R1] nenhum ROW_NUMBER/RANK');
/* [R2] pagina no teto do MCP */
ok(pedidos.every((p) => /LIMIT 50 OFFSET \d+$/.test(p.sql)), '[R2] toda query pede LIMIT 50');

function balanceado(s) {
  let n = 0;
  for (const ch of s) { if (ch === '(') n++; else if (ch === ')') n--; if (n < 0) return false; }
  return n === 0;
}
ok(pedidos.every((p) => balanceado(p.sql)), 'parenteses balanceados');
ok(pedidos.every((p) => p.database === 'cars2you_production'), 'database em todas');
ok(pedidos.filter((p) => /FROM offers o/.test(p.sql)).every((p) => /o\.deleted_at IS NULL/.test(p.sql)),
  'soft delete de offers em todas que leem offers');
ok(pedidos.filter((p) => /INNER JOIN vehicles v/.test(p.sql)).every((p) => /v\.deleted_at IS NULL/.test(p.sql)),
  'soft delete de vehicles em todas que juntam vehicles');
const qLojas = pedidos.find((p) => p.queryName === 'q_lojas');
ok(/'RIO DE JANEIRO' THEN 'RJ'/.test(qLojas.sql), 'de-para de UF presente');
ok(/MAX\(o\.id\) AS offer_id/.test(pedidos.find((p) => p.queryName === 'q_perfil').sql),
  'ultima oferta por MAX(offers.id)');
ok(/MAX\(t\.n\) AS mx/.test(pedidos.find((p) => p.queryName === 'q_modelo').sql),
  'moda por INNER JOIN no MAX(n)');

/* fase 1 falha -> fase 2 tem que morrer alto, nao seguir no escuro */
let morreu = false;
try {
  rodaNo('montar-queries.js', ctxDe({
    'Montar Totais': itensT,
    'MCP Totais': [{ json: { error: { message: 'timeout' } } }]
  }));
} catch (e) { morreu = /q_totais nao voltou/.test(e.message); }
ok(morreu, 'sem gabarito a fase 2 lanca erro em vez de chutar paginacao');

/* ═══ 3. respostas MCP sintéticas ═══════════════════════════════════ */
console.log('\n[3] Respostas MCP sinteticas');
const PAGE = META.page;
function pagina(cols, rows, pg) {
  const fatia = rows.slice(pg * PAGE, pg * PAGE + PAGE);
  const sc = { columns: cols, rows: fatia };
  if (fatia.length === PAGE) sc.truncated = true;
  return { structuredContent: sc };
}
const LOJAS = [
  [11, 'Auto Centro Sul', 43, 'Canal C6 Auto', 'SP', 1],
  [12, 'Veiculos Norte', 43, 'Canal C6 Auto', 'MG', 2],
  [13, 'Garagem BTB', 62, 'Lance Facil BTB', 'RJ', 1],
  [14, 'Loja Sem Perfil', 7, 'Marketplace', 'Nao identificada', 0]
];
function respostasDe(mut) {
  return pedidos.map((p) => {
    const forcado = mut ? mut(p) : null;
    if (forcado) return forcado;
    if (p.queryName === 'q_lojas') {
      return pagina(['shop_id', 'loja', 'whitelabel_id', 'whitelabel', 'uf', 'qt_enderecos'], LOJAS, p.pagina);
    }
    if (p.queryName === 'q_ofertas') {
      return pagina(['shop_id', 'qt_ofertas', 'qt_anuncios'],
        [[11, 400, 320], [12, 120, 100], [13, 40, 38], [14, 5, 5]], p.pagina);
    }
    if (p.queryName === 'q_perfil') {
      return pagina(['shop_id', 'qt_veiculos', 'preco_medio', 'preco_desvio',
        'idade_media', 'idade_desvio', 'km_medio', 'km_desvio'],
        [[11, 310, 48500.5, 19200.75, 6.4, 2.8, 92000, 41000],
         [12, 95, 61200, 25100, 4.1, 1.9, 55000, 22000],
         [13, 1, 39900, null, 8, null, 130000, null]], p.pagina);
    }
    if (p.queryName === 'q_modelo') {
      return pagina(['shop_id', 'item_id', 'nome', 'n'],
        [[11, 501, 'Onix', 96], [12, 502, 'HB20', 30], [12, 503, 'Kwid', 30],
         [13, 501, 'Onix', 10]], p.pagina);
    }
    return pagina(['shop_id', 'item_id', 'nome', 'n'],
      [[11, 1, 'Carros', 380], [12, 1, 'Carros', 110], [13, 3, 'Caminhoes', 22]], p.pagina);
  });
}
const respostas = respostasDe(null);
ok(respostas.length === pedidos.length, 'uma resposta por chamada, na mesma ordem');

function ctxHtml(rs) {
  return ctxDe({
    'Montar Queries': itensQ,
    'MCP Exec': rs.map((r) => ({ json: r }))
  });
}

/* ═══ 4. caso feliz ═════════════════════════════════════════════════ */
console.log('\n[4] Montar HTML — caso feliz');
const saida = rodaNo('montar-html.js', ctxHtml(respostas))[0].json;

ok(saida.resumo.lojas === 4 && saida.resumo.lojas_esperadas === 4, '4 lojas, fechando com o gabarito');
ok(saida.resumo.ofertas === 565 && saida.resumo.ofertas_esperadas === 565, 'ofertas fecham com o gabarito');
ok(saida.falhas.length === 1 && /1 loja\(s\) sem preco/.test(saida.falhas[0]),
  'unica falha e a loja 14 sem perfil, que e verdade');
ok(saida.diagnostico.every((d) => d.veredito === 'ok'),
  '[R4] pagina vazia nao existe mais, entao nenhum falso "TETO ESTOURADO"');
ok(saida.resumo.empates_modelo === 1, 'detecta o empate de modelo da loja 12');

const l11 = saida.DADOS.linhas.find((l) => l.loja_id === 11);
ok(l11.pct_modelo === 24 && l11.pct_categoria === 95, 'percentuais sobre o total de ofertas');
ok(saida.DADOS.linhas.find((l) => l.loja_id === 12).principal_modelo === 'HB20',
  'empate resolvido pelo menor item_id: HB20');
ok(saida.DADOS.linhas.find((l) => l.loja_id === 13).preco_desvio === null, 'DP nulo com n=1');
const l14 = saida.DADOS.linhas.find((l) => l.loja_id === 14);
ok(l14 && l14.qt_veiculos === null && l14.qt_ofertas === 5, 'loja sem perfil aparece com ofertas');
const wl = saida.DADOS.por_whitelabel.find((g) => g.chave === 'Canal C6 Auto');
ok(wl.lojas === 2 && wl.ofertas === 520, 'agrupamento por whitelabel');
ok(wl.preco_medio_ponderado === Math.round((48500.5 * 310 + 61200 * 95) / 405), 'preco ponderado');

const h = saida.html;
ok(h.indexOf('<!doctype html>') === 0 && h.indexOf('</html>') > 0, 'HTML integro');
ok((h.match(/<script>/g) || []).length === 2, '2 blocos de script');
ok(!/[a-z-]+:\s*[\d]+,[\d]+(%|px|em)/.test(h), 'nenhum valor CSS com virgula decimal');
const m = h.match(/<script>const D=([\s\S]*?);<\/script>/);
ok(m !== null && JSON.parse(m[1].split('<\\/').join('</')).linhas.length === 4, 'JSON embarcado reparseia');

/* ═══ 5. [R3] erro objeto legível ═══════════════════════════════════ */
console.log('\n[5] [R3] erro objeto vira texto legivel');
const sErro = rodaNo('montar-html.js', ctxHtml(respostasDe((p) => p.queryName === 'q_perfil'
  ? { error: { message: 'query validation failed: failed to parse SQL statement: syntax error at position 438' } }
  : null)))[0].json;
const dPerfil = sErro.diagnostico.find((d) => d.queryName === 'q_perfil');
ok(dPerfil.veredito === 'ERRO', 'veredito ERRO');
ok(dPerfil.erro.indexOf('[object Object]') < 0, '[R3] NAO imprime [object Object]');
ok(dPerfil.erro.indexOf('syntax error at position 438') >= 0, '[R3] mostra a mensagem real');
ok(sErro.html.indexOf('INCOMPLETA') > 0 && sErro.html.indexOf('position 438') > 0,
  'o HTML avisa e mostra o erro real');

/* ═══ 6. [R2] resposta cortada derruba o veredito ═══════════════════ */
console.log('\n[6] [R2] resposta cortada');
const MUITAS = [];
for (let i = 0; i < 120; i++) MUITAS.push([1000 + i, 'Loja ' + i, 7, 'Marketplace', 'SP', 1]);
const itensQ2 = montaCom(500, 9999);
const rCorte = itensQ2.map((i) => i.json).map((p) => {
  if (p.queryName === 'q_lojas') {
    const fatia = MUITAS.slice(p.pagina * PAGE, p.pagina * PAGE + PAGE);
    const sc = { columns: ['shop_id', 'loja', 'whitelabel_id', 'whitelabel', 'uf', 'qt_enderecos'], rows: fatia };
    if (fatia.length === PAGE) sc.truncated = true;
    return { structuredContent: sc };
  }
  return { structuredContent: { columns: ['shop_id'], rows: [] } };
});
const sCorte = rodaNo('montar-html.js', ctxDe({
  'Montar Queries': itensQ2,
  'MCP Exec': rCorte.map((r) => ({ json: r }))
}))[0].json;
const dLojas = sCorte.diagnostico.find((d) => d.queryName === 'q_lojas');
ok(dLojas.truncadas === 2, '[R2] conta 2 paginas cortadas');
ok(dLojas.veredito.indexOf('CORTADA') >= 0, '[R2] veredito acusa RESPOSTA CORTADA');
ok(sCorte.resumo.lojas === 120 && sCorte.resumo.lojas_esperadas === 500, '[R2] 120 coletadas, gabarito 500');
ok(sCorte.falhas.some((f) => /faltam 380/.test(f)), '[R2] falha explicita: faltam 380 lojas');
ok(sCorte.html.indexOf('INCOMPLETA') > 0, '[R2] pagina abre avisando');

/* ═══ saida ═════════════════════════════════════════════════════════ */
fs.writeFileSync(path.join(AQUI, 'saida-teste-local.html'), h);
console.log('\nHTML de teste: saida-teste-local.html (' + h.length + ' bytes)');
console.log('ATENCAO: dado 100% SINTETICO. Nao compartilhar como se fosse real.');
console.log(falhas === 0 ? '\n=== TODAS AS PROVAS PASSARAM ===' : '\n=== ' + falhas + ' FALHA(S) ===');
process.exit(falhas === 0 ? 0 : 1);
